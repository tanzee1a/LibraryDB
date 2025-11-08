const db = require('../config/db');

async function searchItems(searchTerm, filters = {}) {
    const queryTerm = `%${searchTerm}%`; 

    let sqlParts = [];
    let finalParams = [];

    const categoryFilter = filters.category ? filters.category.split(',') : [];
    const tagFilter = filters.tag ? filters.tag.split(',') : []; //

    const selectClause = 
    `   SELECT 
            i.item_id, i.category, i.thumbnail_url, i.available, i.on_hold, i.loaned_out, i.earliest_available_date,
            %TITLE_FIELD% AS title, 
            %CREATOR_FIELD% AS creators 
    `; //
    const fromItemJoin = `FROM ITEM i `; //
    
    // --- 1. Build BOOK Query Part ---
    if (categoryFilter.length === 0 || categoryFilter.includes('BOOK')) {
        let bookParams = [];
        let bookWhereClauses = [];
        let bookJoins = [
            `JOIN BOOK b ON i.item_id = b.item_id`,
            `LEFT JOIN BOOK_AUTHOR ba ON i.item_id = ba.item_id`,
            `LEFT JOIN AUTHOR a ON ba.author_id = a.author_id`
        ];

        if (searchTerm.trim()) {
            bookWhereClauses.push(`(b.title LIKE ? OR i.description LIKE ?)`);
            bookParams.push(queryTerm, queryTerm);
        }
        // Category Filter logic
        if (categoryFilter.length > 0) {
            bookWhereClauses.push(`i.category IN (?)`);
            bookParams.push(categoryFilter);
        }

        // Tag Filter logic
        if (tagFilter.length > 0) {
            bookJoins.push(
                `JOIN ITEM_TAG it ON i.item_id = it.item_id`,
                `JOIN TAG t ON it.tag_id = t.tag_id`
            );
            bookWhereClauses.push(`t.tag_name IN (?)`);
            bookParams.push(tagFilter);
        }
        
        const whereString = bookWhereClauses.length > 0 ? `WHERE ${bookWhereClauses.join(' AND ')}` : '';

        sqlParts.push(`
            ( ${selectClause.replace('%TITLE_FIELD%', 'b.title').replace('%CREATOR_FIELD%', `GROUP_CONCAT(DISTINCT a.first_name, ' ', a.last_name SEPARATOR ', ')`)}
              ${fromItemJoin}
              ${bookJoins.join('\n')}
              ${whereString} 
              GROUP BY i.item_id 
            )
        `);
        finalParams.push(...bookParams);
    }
    
    // --- 2. Build MOVIE Query Part ---
     if (categoryFilter.length === 0 || categoryFilter.includes('MOVIE')) {
        let movieParams = [];
        let movieWhereClauses = [];
        let movieJoins = [
            `JOIN MOVIE m ON i.item_id = m.item_id`,
            `LEFT JOIN MOVIE_DIRECTOR md ON m.item_id = md.item_id`,
            `LEFT JOIN DIRECTOR d ON md.director_id = d.director_id`
        ];

        if (searchTerm.trim()) {
            movieWhereClauses.push(`(m.title LIKE ? OR i.description LIKE ?)`);
            movieParams.push(queryTerm, queryTerm);
        }
        // Category filter logic
        if (categoryFilter.length > 0) {
            movieWhereClauses.push(`i.category IN (?)`);
            movieParams.push(categoryFilter);
        }
        // Tag filter logic
        if (tagFilter.length > 0) {
            movieJoins.push(
                `JOIN ITEM_TAG it ON i.item_id = it.item_id`,
                `JOIN TAG t ON it.tag_id = t.tag_id`
            );
            movieWhereClauses.push(`t.tag_name IN (?)`);
            movieParams.push(tagFilter);
        }

        const whereString = movieWhereClauses.length > 0 ? `WHERE ${movieWhereClauses.join(' AND ')}` : '';
        
        sqlParts.push(`
             ( ${selectClause.replace('%TITLE_FIELD%', 'm.title').replace('%CREATOR_FIELD%', `GROUP_CONCAT(DISTINCT d.first_name, ' ', d.last_name SEPARATOR ', ')`)}
               ${fromItemJoin}
               ${movieJoins.join('\n')}
               ${whereString}
               GROUP BY i.item_id
             )
        `);
        finalParams.push(...movieParams);
     }

    // --- 3. Build DEVICE Query Part ---
     if (categoryFilter.length === 0 || categoryFilter.includes('DEVICE')) {
        let deviceParams = [];
        let deviceWhereClauses = [];
        let deviceJoins = [
            `JOIN DEVICE d ON i.item_id = d.item_id`
        ];

        if (searchTerm.trim()) {
            deviceWhereClauses.push(`(d.device_name LIKE ? OR i.description LIKE ? OR d.manufacturer LIKE ?)`);
            deviceParams.push(queryTerm, queryTerm, queryTerm);
        }
        // Category filter logic
        if (categoryFilter.length > 0) {
            deviceWhereClauses.push(`i.category IN (?)`);
            deviceParams.push(categoryFilter);
        }
        // Tag filter logic
        if (tagFilter.length > 0) {
            deviceJoins.push(
                `JOIN ITEM_TAG it ON i.item_id = it.item_id`,
                `JOIN TAG t ON it.tag_id = t.tag_id`
            );
            deviceWhereClauses.push(`t.tag_name IN (?)`);
            deviceParams.push(tagFilter);
        }
        
        const whereString = deviceWhereClauses.length > 0 ? `WHERE ${deviceWhereClauses.join(' AND ')}` : '';

        sqlParts.push(`
            ( ${selectClause.replace('%TITLE_FIELD%', 'd.device_name').replace('%CREATOR_FIELD%', 'd.manufacturer')}
              ${fromItemJoin}
              ${deviceJoins.join('\n')}
              ${whereString}
              GROUP BY i.item_id -- Add GROUP BY to prevent duplicates from tags
            )
        `);
        finalParams.push(...deviceParams);
     }

    if (sqlParts.length === 0) {
        return [];
    }

    const finalSql = sqlParts.join('\n UNION \n');
    console.log("Executing Search SQL:", finalSql); // For debugging
    console.log("With Params:", finalParams); // For debugging
    const [rows] = await db.query(finalSql, finalParams);
    return rows;
}

module.exports = { searchItems };