const db = require('../config/db'); 

// Add item to wishlist
async function add(userId, itemId) {
    const sql = 'INSERT INTO WISHLIST (user_id, item_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id'; // Ignore if exists
    await db.query(sql, [userId, itemId]);
    return { message: 'Item added to wishlist' };
}

// Remove item from wishlist
async function remove(userId, itemId) {
    const sql = 'DELETE FROM WISHLIST WHERE user_id = ? AND item_id = ?';
    const [result] = await db.query(sql, [userId, itemId]);
    if (result.affectedRows === 0) {
        throw new Error('Item not found in wishlist.');
    }
    return { message: 'Item removed from wishlist' };
}

// Get user's wishlist
async function findByUserId(userId) {
     const sql = `
        SELECT 
            w.item_id,
            w.created_at,
            COALESCE(bk.title, m.title, d.device_name) AS title,
            i.thumbnail_url
        FROM WISHLIST w
        JOIN ITEM i ON w.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC;
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
}

module.exports = {
    add,
    remove,
    findByUserId
};