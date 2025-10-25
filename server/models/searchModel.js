// models/searchModel.js
const db = require('../config/db');

async function searchItems(searchTerm, filters = {}) {
    const queryTerm = `%${searchTerm}%`; 

    // --- Build the SQL Query ---
    // Removed GROUP BY from the DEVICE section only
    
    let sql = `
        -- Search Books
        SELECT 
            i.item_id, i.category, i.thumbnail_url, i.available, i.on_hold, i.loaned_out, i.earliest_available_date,
            b.title, 
            GROUP_CONCAT(DISTINCT a.first_name, ' ', a.last_name SEPARATOR ', ') AS creators 
        FROM ITEM i
        JOIN BOOK b ON i.item_id = b.item_id
        LEFT JOIN BOOK_AUTHOR ba ON i.item_id = ba.item_id
        LEFT JOIN AUTHOR a ON ba.author_id = a.author_id
        WHERE (b.title LIKE ? OR i.description LIKE ?) 
        GROUP BY i.item_id 

        UNION

        -- Search Movies
        SELECT 
            i.item_id, i.category, i.thumbnail_url, i.available, i.on_hold, i.loaned_out, i.earliest_available_date,
            m.title, 
            GROUP_CONCAT(DISTINCT d.first_name, ' ', d.last_name SEPARATOR ', ') AS creators
        FROM ITEM i
        JOIN MOVIE m ON i.item_id = m.item_id
        LEFT JOIN MOVIE_DIRECTOR md ON m.item_id = md.item_id -- Assuming MOVIE_DIRECTOR links by item_id now
        LEFT JOIN DIRECTOR d ON md.director_id = d.director_id
        WHERE (m.title LIKE ? OR i.description LIKE ?)
        GROUP BY i.item_id

        UNION

        -- Search Devices
        SELECT 
            i.item_id, i.category, i.thumbnail_url, i.available, i.on_hold, i.loaned_out, i.earliest_available_date,
            d.device_name AS title, 
            d.manufacturer AS creators 
        FROM ITEM i
        JOIN DEVICE d ON i.item_id = d.item_id
        WHERE (d.device_name LIKE ? OR i.description LIKE ? OR d.manufacturer LIKE ?)
        -- Removed GROUP BY i.item_id from this section
    `;

    const params = [
      queryTerm, queryTerm, // Book title/desc
      queryTerm, queryTerm, // Movie title/desc
      queryTerm, queryTerm, queryTerm // Device name/desc/manufacturer
    ];

    const [rows] = await db.query(sql, params);
    return rows;
}

module.exports = { searchItems };