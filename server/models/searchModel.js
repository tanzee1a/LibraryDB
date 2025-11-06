const db = require('../config/db');

async function searchItems(searchTerm, filters = {}) {
    const queryTerm = `%${searchTerm}%`; 

    let sqlParts = [];
    let finalParams = [];
    
    // Apply category filter (if present)
    const categoryFilter = filters.category ? filters.category.split(',') : []; // Expecting comma-separated string

    // --- Base SQL parts ---
    const selectClause = `
        SELECT 
            i.item_id, i.category, i.thumbnail_url, i.available, i.on_hold, i.loaned_out, i.earliest_available_date,
            %TITLE_FIELD% AS title, 
            %CREATOR_FIELD% AS creators 
    `;
    const fromItemJoin = `FROM ITEM i `;

    // --- 1. Build BOOK Query Part ---
    // Only include BOOK search if category filter allows or is absent
    if (categoryFilter.length === 0 || categoryFilter.includes('BOOK')) {
        let bookParams = [];
        let bookWhereClauses = [];

        // Add search term clauses ONLY if a search term exists
        if (searchTerm.trim()) {
            bookWhereClauses.push(`(b.title LIKE ? OR i.description LIKE ?)`);
            bookParams.push(queryTerm, queryTerm);
        }
        // Add category filter clauses ONLY if a category filter exists
        if (categoryFilter.length > 0) {
            bookWhereClauses.push(`i.category IN (?)`);
            bookParams.push(categoryFilter);
        }
        
        // Build the WHERE string
        const whereString = bookWhereClauses.length > 0 ? `WHERE ${bookWhereClauses.join(' AND ')}` : '';

        sqlParts.push(`
            ( ${selectClause.replace('%TITLE_FIELD%', 'b.title').replace('%CREATOR_FIELD%', `GROUP_CONCAT(DISTINCT a.first_name, ' ', a.last_name SEPARATOR ', ')`)}
              ${fromItemJoin}
              JOIN BOOK b ON i.item_id = b.item_id
              LEFT JOIN BOOK_AUTHOR ba ON i.item_id = ba.item_id
              LEFT JOIN AUTHOR a ON ba.author_id = a.author_id
              ${whereString} 
              GROUP BY i.item_id 
            )
        `);
        finalParams.push(...bookParams); // Add this part's params to the final array
    }

    // --- 2. Build MOVIE Query Part ---
    // Only include MOVIE search if category filter allows or is absent
     if (categoryFilter.length === 0 || categoryFilter.includes('MOVIE')) {
        let movieParams = [];
        let movieWhereClauses = [];

        if (searchTerm.trim()) {
            movieWhereClauses.push(`(m.title LIKE ? OR i.description LIKE ?)`);
            movieParams.push(queryTerm, queryTerm);
        }
        if (categoryFilter.length > 0) {
            movieWhereClauses.push(`i.category IN (?)`);
            movieParams.push(categoryFilter);
        }

        const whereString = movieWhereClauses.length > 0 ? `WHERE ${movieWhereClauses.join(' AND ')}` : '';
        
        sqlParts.push(`
             ( ${selectClause.replace('%TITLE_FIELD%', 'm.title').replace('%CREATOR_FIELD%', `GROUP_CONCAT(DISTINCT d.first_name, ' ', d.last_name SEPARATOR ', ')`)}
               ${fromItemJoin}
               JOIN MOVIE m ON i.item_id = m.item_id
               LEFT JOIN MOVIE_DIRECTOR md ON m.item_id = md.item_id 
               LEFT JOIN DIRECTOR d ON md.director_id = d.director_id
               ${whereString}
               GROUP BY i.item_id
             )
        `);
        finalParams.push(...movieParams); // Add this part's params
     }

     // --- 3. Build DEVICE Query Part ---
    // Only include DEVICE search if category filter allows or is absent
     if (categoryFilter.length === 0 || categoryFilter.includes('DEVICE')) {
        let deviceParams = [];
        let deviceWhereClauses = [];

        if (searchTerm.trim()) {
            deviceWhereClauses.push(`(d.device_name LIKE ? OR i.description LIKE ? OR d.manufacturer LIKE ?)`);
            deviceParams.push(queryTerm, queryTerm, queryTerm);
        }
        if (categoryFilter.length > 0) {
            deviceWhereClauses.push(`i.category IN (?)`);
            deviceParams.push(categoryFilter);
        }
        
        const whereString = deviceWhereClauses.length > 0 ? `WHERE ${deviceWhereClauses.join(' AND ')}` : '';

        sqlParts.push(`
            ( ${selectClause.replace('%TITLE_FIELD%', 'd.device_name').replace('%CREATOR_FIELD%', 'd.manufacturer')}
              ${fromItemJoin}
              JOIN DEVICE d ON i.item_id = d.item_id
              ${whereString}
              -- No GROUP BY needed
            )
        `);
        finalParams.push(...deviceParams); // Add this part's params
     }

     if (sqlParts.length === 0) {
        return []; // No categories selected
    }

    const finalSql = sqlParts.join('\n UNION \n');

    console.log("Executing Search SQL:", finalSql); // For debugging
    console.log("With Params:", finalParams);       // For debugging
    
    // The driver will correctly map the params in order
    const [rows] = await db.query(finalSql, finalParams);
    return rows;
}

module.exports = { searchItems };