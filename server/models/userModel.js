// models/userModel.js
const db = require('../config/db'); 

/**
 * Finds a user by their ID.
 */
async function findById(userId) {
    const sql = `
        SELECT user_id, email, role, firstName, lastName 
        FROM USER 
        WHERE user_id = ?
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows[0]; // Returns the user object or undefined if not found
}

module.exports = {
    findById
};