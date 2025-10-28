// models/staffModel.js
const db = require('../config/db');


async function checkStaffRole(userId) {
    const sql = 'SELECT role FROM USER WHERE user_id = ? AND role = "Staff"';
    const [rows] = await db.query(sql, [userId]);
    return rows.length > 0; // Returns true if a row is found
}

/**
 * Fetches dashboard statistics.
 */
async function getDashboardStats() {
    const loanedOutStatusId = 2; // Assuming 2 = 'Loaned Out'
    
    // Query for currently loaned out items
    const [loanRows] = await db.query(
        'SELECT COUNT(*) as count FROM BORROW WHERE status_id = ?', 
        [loanedOutStatusId]
    );

    // Query for overdue items
    const [overdueRows] = await db.query(
        'SELECT COUNT(*) as count FROM BORROW WHERE status_id = ? AND due_date < CURDATE()',
        [loanedOutStatusId]
    );

    // Query for pending pickups (active holds)
    const [holdRows] = await db.query(
        'SELECT COUNT(*) as count FROM HOLD WHERE picked_up_at IS NULL AND canceled_at IS NULL AND expires_at >= NOW()'
    );

    // Query for outstanding fines
    const [fineRows] = await db.query(
        'SELECT COUNT(*) as count FROM FINE WHERE date_paid IS NULL AND waived_at IS NULL'
    );

    return {
        loans: loanRows[0]?.count || 0,
        overdue: overdueRows[0]?.count || 0,
        pendingPickups: holdRows[0]?.count || 0,
        outstandingFines: fineRows[0]?.count || 0,
    };
}

/**
 * Fetches staff profile details based on user_id.
 * Joins USER, STAFF, and STAFF_ROLES tables.
 */
async function findStaffProfileById(userId) {
    const sql = `
        SELECT 
            u.user_id,
            u.firstName,
            u.lastName,
            u.email,
            sr.role_name 
        FROM USER u
        JOIN STAFF s ON u.user_id = s.user_id
        JOIN STAFF_ROLES sr ON s.role_id = sr.role_id
        WHERE u.user_id = ? AND u.role = 'Staff'; 
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows[0]; // Return profile or undefined
}

module.exports = {
    getDashboardStats,
    findStaffProfileById,
    checkStaffRole
};