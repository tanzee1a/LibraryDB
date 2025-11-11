const db = require('../config/db');

async function searchItems(searchTerm, filters = {}, searchType = 'Description') {
    const queryTerm = `%${searchTerm}%`;
    const exactTerm = searchTerm;
    const startsWithTerm = `${searchTerm}%`;

    let sqlParts = [];
    let finalParams = [];

    const categoryFilter = filters.category ? filters.category.split(',') : [];
    const tagFilter = filters.tag ? filters.tag.split(',') : []; //

    const selectClause =
    `   SELECT
            i.item_id, i.category, i.thumbnail_url, i.available, i.on_hold, i.loaned_out, i.earliest_available_date,
            %TITLE_FIELD% AS title,
            %CREATOR_FIELD% AS creators
    `;
    const fromItemJoin = `FROM ITEM i `;

    // --- 1. Build BOOK Query Part ---
    // Only search books if:
    // 1. We are NOT searching by 'Director' or 'Manufacturer'
    // 2. The category filter allows it (or is empty)
    if (searchType !== 'Director' && searchType !== 'Manufacturer' && (categoryFilter.length === 0 || categoryFilter.includes('BOOK'))) {
        let bookParams = [];
        let bookWhereClauses = [];
        let bookJoins = [
            `JOIN BOOK b ON i.item_id = b.item_id`,
            `LEFT JOIN BOOK_AUTHOR ba ON i.item_id = ba.item_id`,
            `LEFT JOIN AUTHOR a ON ba.author_id = a.author_id`
        ];
        let bookSelect = selectClause.replace('%TITLE_FIELD%', 'b.title').replace('%CREATOR_FIELD%', `GROUP_CONCAT(DISTINCT a.first_name, ' ', a.last_name SEPARATOR ', ')`);

        if (searchTerm.trim()) {
            if (searchType === 'Title') {
                bookWhereClauses.push(`b.title LIKE ?`);
                bookParams.push(queryTerm); // Find all matches
                // Add sorting rank column
                bookSelect += `,
                    CASE
                        WHEN b.title = ? THEN 1   -- Exact match
                        WHEN b.title LIKE ? THEN 2 -- Starts with match
                        ELSE 3                     -- Contains match
                    END AS sort_priority
                `;
                bookParams.push(exactTerm, startsWithTerm);
            } else if (searchType === 'Author') {
                bookWhereClauses.push(`(a.first_name LIKE ? OR a.last_name LIKE ?)`);
                bookParams.push(queryTerm, queryTerm);
                bookSelect += `, 4 AS sort_priority`; // Default low priority
            } else if (searchType === 'Tag') {
                // tag logic is added within the tagFilter section
                bookSelect += `, 4 AS sort_priority`;
            } else { // Default 'Description' search
                bookWhereClauses.push(`(b.title LIKE ? OR i.description LIKE ? OR a.first_name LIKE ? OR a.last_name LIKE ?)`);
                bookParams.push(queryTerm, queryTerm, queryTerm, queryTerm);
                bookSelect += `, 4 AS sort_priority`;
            }
        } else {
            bookSelect += `, 4 AS sort_priority`; // Default low priority if no search term
        }
        // Category Filter logic
        if (categoryFilter.length > 0) {
            bookWhereClauses.push(`i.category IN (?)`);
            bookParams.push(categoryFilter);
        }
        // Tag Filter logic
        if (tagFilter.length > 0 || searchType === 'Tag') {
            bookJoins.push(
                `JOIN ITEM_TAG it ON i.item_id = it.item_id`,
                `JOIN TAG t ON it.tag_id = t.tag_id`
            );
            if (tagFilter.length > 0) { // Filtering by tag list
                bookWhereClauses.push(`t.tag_name IN (?)`);
                bookParams.push(tagFilter);
            }
            if (searchType === 'Tag' && searchTerm.trim()) { // Searching by tag
                bookWhereClauses.push(`t.tag_name LIKE ?`);
                bookParams.push(queryTerm);
            }
        }
        
        const whereString = bookWhereClauses.length > 0 ? `WHERE ${bookWhereClauses.join(' AND ')}` : '';

        sqlParts.push(`
            ( ${bookSelect}
              ${fromItemJoin}
              ${bookJoins.join('\n')}
              ${whereString}
              GROUP BY i.item_id
            )
        `);
        finalParams.push(...bookParams);
    }

    // --- 2. Build MOVIE Query Part ---
    // Only search movies if:
    // 1. We are NOT searching by 'Author' or 'Manufacturer'
    // 2. The category filter allows it (or is empty)
     if (searchType !== 'Author' && searchType !== 'Manufacturer' && (categoryFilter.length === 0 || categoryFilter.includes('MOVIE'))) {
        let movieParams = [];
        let movieWhereClauses = [];
        let movieJoins = [
            `JOIN MOVIE m ON i.item_id = m.item_id`,
            `LEFT JOIN MOVIE_DIRECTOR md ON m.item_id = md.item_id`,
            `LEFT JOIN DIRECTOR d ON md.director_id = d.director_id`
        ];
        let movieSelect = selectClause.replace('%TITLE_FIELD%', 'm.title').replace('%CREATOR_FIELD%', `GROUP_CONCAT(DISTINCT d.first_name, ' ', d.last_name SEPARATOR ', ')`);

        if (searchTerm.trim()) {
            if (searchType === 'Title') {
                movieWhereClauses.push(`m.title LIKE ?`);
                movieParams.push(queryTerm);
                movieSelect += `,
                    CASE
                        WHEN m.title = ? THEN 1
                        WHEN m.title LIKE ? THEN 2
                        ELSE 3
                    END AS sort_priority
                `;
                movieParams.push(exactTerm, startsWithTerm);
            } else if (searchType === 'Director') {
                movieWhereClauses.push(`(d.first_name LIKE ? OR d.last_name LIKE ?)`);
                movieParams.push(queryTerm, queryTerm);
                movieSelect += `, 4 AS sort_priority`;
            } else if (searchType === 'Tag') {
                movieSelect += `, 4 AS sort_priority`;
            } else { // Default 'Description' search
                movieWhereClauses.push(`(m.title LIKE ? OR i.description LIKE ? OR d.first_name LIKE ? OR d.last_name LIKE ?)`);
                movieParams.push(queryTerm, queryTerm, queryTerm, queryTerm);
                movieSelect += `, 4 AS sort_priority`;
            }
        } else {
            movieSelect += `, 4 AS sort_priority`;
        }
        // Category filter logic
        if (categoryFilter.length > 0) {
            movieWhereClauses.push(`i.category IN (?)`);
            movieParams.push(categoryFilter);
        }
        // Tag filter logic
        if (tagFilter.length > 0 || (searchType === 'Tag' && searchTerm.trim())) {
            movieJoins.push(
                `JOIN ITEM_TAG it ON i.item_id = it.item_id`,
                `JOIN TAG t ON it.tag_id = t.tag_id`
            );
            if (tagFilter.length > 0) {
                movieWhereClauses.push(`t.tag_name IN (?)`);
                movieParams.push(tagFilter);
            }
            if (searchType === 'Tag' && searchTerm.trim()) {
                movieWhereClauses.push(`t.tag_name LIKE ?`);
                movieParams.push(queryTerm);
            }
        }

        const whereString = movieWhereClauses.length > 0 ? `WHERE ${movieWhereClauses.join(' AND ')}` : '';
        
        sqlParts.push(`
             ( ${movieSelect}
               ${fromItemJoin}
               ${movieJoins.join('\n')}
               ${whereString}
               GROUP BY i.item_id
             )
        `);
        finalParams.push(...movieParams);
     }

    // --- 3. Build DEVICE Query Part ---
    // Only search devices if:
    // 1. We are NOT searching by 'Author' or 'Director'
    // 2. The category filter allows it (or is empty)
     if (searchType !== 'Author' && searchType !== 'Director' && (categoryFilter.length === 0 || categoryFilter.includes('DEVICE'))) {
        let deviceParams = [];
        let deviceWhereClauses = [];
        let deviceJoins = [
            `JOIN DEVICE d ON i.item_id = d.item_id`
        ];
        let deviceSelect = selectClause.replace('%TITLE_FIELD%', 'd.device_name').replace('%CREATOR_FIELD%', 'd.manufacturer');

        if (searchTerm.trim()) {
            if (searchType === 'Title') {
                deviceWhereClauses.push(`d.device_name LIKE ?`);
                deviceParams.push(queryTerm);
                deviceSelect += `,
                    CASE
                        WHEN d.device_name = ? THEN 1
                        WHEN d.device_name LIKE ? THEN 2
                        ELSE 3
                    END AS sort_priority
                `;
                deviceParams.push(exactTerm, startsWithTerm);
            } else if (searchType === 'Manufacturer') {
                deviceWhereClauses.push(`d.manufacturer LIKE ?`);
                deviceParams.push(queryTerm);
                deviceSelect += `, 4 AS sort_priority`;
            } else if (searchType === 'Tag') {
                deviceSelect += `, 4 AS sort_priority`;
            } else { // Default 'Description' search
                deviceWhereClauses.push(`(d.device_name LIKE ? OR i.description LIKE ? OR d.manufacturer LIKE ?)`);
                deviceParams.push(queryTerm, queryTerm, queryTerm);
                deviceSelect += `, 4 AS sort_priority`;
            }
        } else {
            deviceSelect += `, 4 AS sort_priority`;
        }
        // Category filter logic
        if (categoryFilter.length > 0) {
            deviceWhereClauses.push(`i.category IN (?)`);
            deviceParams.push(categoryFilter);
        }        
        // Tag filter logic
        if (tagFilter.length > 0 || (searchType === 'Tag' && searchTerm.trim())) {
            deviceJoins.push(
                `JOIN ITEM_TAG it ON i.item_id = it.item_id`,
                `JOIN TAG t ON it.tag_id = t.tag_id`
            );
            if (tagFilter.length > 0) {
                deviceWhereClauses.push(`t.tag_name IN (?)`);
                deviceParams.push(tagFilter);
            }
            if (searchType === 'Tag' && searchTerm.trim()) {
                deviceWhereClauses.push(`t.tag_name LIKE ?`);
                deviceParams.push(queryTerm);
            }
        }
        
        const whereString = deviceWhereClauses.length > 0 ? `WHERE ${deviceWhereClauses.join(' AND ')}` : '';

        sqlParts.push(`
            ( ${deviceSelect}
              ${fromItemJoin}
              ${deviceJoins.join('\n')}
              ${whereString}
              GROUP BY i.item_id
            )
        `);
        finalParams.push(...deviceParams);
     }

    if (sqlParts.length === 0) {
        return [];
    }

    const unionSql = sqlParts.join('\n UNION \n');
    const finalSql = `
        SELECT * FROM (
            ${unionSql}
        ) AS combined_results
        ORDER BY sort_priority ASC, title ASC
    `;
    console.log("Executing Search SQL:", finalSql); // For debugging
    console.log("With Params:", finalParams); // For debugging
    const [rows] = await db.query(finalSql, finalParams);
    return rows;
}

module.exports = { searchItems };