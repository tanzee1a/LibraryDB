const db = require('../config/db');

async function searchItems(searchTerm, filters = {}) {
    const queryTerm = `%${searchTerm}%`; 
    let params = []; // Initialize params array

    // --- Base SQL parts ---
    const selectClause = `
        SELECT 
            i.item_id, i.category, i.thumbnail_url, i.available, i.on_hold, i.loaned_out, i.earliest_available_date,
            %TITLE_FIELD% AS title, 
            %CREATOR_FIELD% AS creators 
    `;
    const fromItemJoin = `FROM ITEM i `;
    
    // --- Build WHERE Clauses dynamically ---
    let bookWhereClauses = [`(b.title LIKE ? OR i.description LIKE ?)`];
    params.push(queryTerm, queryTerm);
    let movieWhereClauses = [`(m.title LIKE ? OR i.description LIKE ?)`];
    params.push(queryTerm, queryTerm);
    let deviceWhereClauses = [`(d.device_name LIKE ? OR i.description LIKE ? OR d.manufacturer LIKE ?)`];
    params.push(queryTerm, queryTerm, queryTerm);

    // Apply category filter (if present)
    const categoryFilter = filters.category ? filters.category.split(',') : []; // Expecting comma-separated string
    if (categoryFilter.length > 0) {
        // We need to adjust which UNION parts run, or add this to each WHERE
        // Simpler for now: Add to each part (less efficient but easier)
        bookWhereClauses.push(`i.category IN (?)`); 
        params.push(categoryFilter);
        movieWhereClauses.push(`i.category IN (?)`);
        params.push(categoryFilter);
        deviceWhereClauses.push(`i.category IN (?)`);
        params.push(categoryFilter);
    }
    
    // Apply genre filter (if present) - MORE COMPLEX requires JOINs in WHERE
    const genreFilter = filters.genre ? filters.genre.split(',') : [];
    if (genreFilter.length > 0) {
        // Add checks within each relevant UNION part
        // Note: This assumes you have genre tables like BOOK_GENRE, MOVIE_GENRE linked by item_id
        // Example for Books (requires adding a JOIN to BOOK_GENRE):
        // bookWhereClauses.push(`bg.genre_name IN (?)`); 
        // params.push(genreFilter); 
        // You would need to add `JOIN BOOK_GENRE bg ON i.item_id = bg.item_id` to the FROM/JOIN section for Books.
        // Similar logic for Movies. This gets complicated quickly.
        
        // --- TODO: Implement genre filtering ---
        console.warn("Genre filter not fully implemented in backend yet.");
    }

    // --- Combine SQL Parts ---
    let sqlParts = [];

    // Only include BOOK search if category filter allows or is absent
    if (categoryFilter.length === 0 || categoryFilter.includes('BOOK')) {
        sqlParts.push(`
            ( ${selectClause.replace('%TITLE_FIELD%', 'b.title').replace('%CREATOR_FIELD%', `GROUP_CONCAT(DISTINCT a.first_name, ' ', a.last_name SEPARATOR ', ')`)}
              ${fromItemJoin}
              JOIN BOOK b ON i.item_id = b.item_id
              LEFT JOIN BOOK_AUTHOR ba ON i.item_id = ba.item_id
              LEFT JOIN AUTHOR a ON ba.author_id = a.author_id
              WHERE ${bookWhereClauses.join(' AND ')} 
              GROUP BY i.item_id 
            )
        `);
    }
    
    // Only include MOVIE search if category filter allows or is absent
     if (categoryFilter.length === 0 || categoryFilter.includes('MOVIE')) {
        sqlParts.push(`
             ( ${selectClause.replace('%TITLE_FIELD%', 'm.title').replace('%CREATOR_FIELD%', `GROUP_CONCAT(DISTINCT d.first_name, ' ', d.last_name SEPARATOR ', ')`)}
               ${fromItemJoin}
               JOIN MOVIE m ON i.item_id = m.item_id
               LEFT JOIN MOVIE_DIRECTOR md ON m.item_id = md.item_id 
               LEFT JOIN DIRECTOR d ON md.director_id = d.director_id
               WHERE ${movieWhereClauses.join(' AND ')}
               GROUP BY i.item_id
             )
        `);
     }

    // Only include DEVICE search if category filter allows or is absent
     if (categoryFilter.length === 0 || categoryFilter.includes('DEVICE')) {
        sqlParts.push(`
            ( ${selectClause.replace('%TITLE_FIELD%', 'd.device_name').replace('%CREATOR_FIELD%', 'd.manufacturer')}
              ${fromItemJoin}
              JOIN DEVICE d ON i.item_id = d.item_id
              WHERE ${deviceWhereClauses.join(' AND ')}
              -- No GROUP BY needed here
            )
        `);
     }

    if (sqlParts.length === 0) {
        return []; // No categories selected or found
    }

    const finalSql = sqlParts.join('\n UNION \n');

    // --- Execute Query ---
    console.log("Executing Search SQL:", finalSql); // For debugging
    console.log("With Params:", params);          // For debugging
    const [rows] = await db.query(finalSql, params);
    return rows;
}

module.exports = { searchItems };