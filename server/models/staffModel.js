// models/staffModel.js (FIXED)
const db = require('../config/db');

// FIX 1: Join USER and USER_ROLE to check if the user is in the 'Staff' main category
async function checkStaffRole(userId) {
    const sql = `
        SELECT 
            U.user_id 
        FROM USER U
        JOIN USER_ROLE UR ON U.role_id = UR.role_id
        WHERE U.user_id = ? AND UR.role_name = 'Staff'
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows.length > 0; // Returns true if a row is found with the role name 'Staff'
}

/**
 * Fetches dashboard statistics. (No change needed here, as it doesn't query the user role)
 */
async function getDashboardStats() {
    // ... (content remains the same)
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
    // FIX 2: Remove the incorrect 'AND u.role = 'Staff'' clause.
    // The staffProtect middleware already confirms they are 'Staff' based on the JWT.
    // Also, the JOIN to STAFF already ensures the user is a staff member.
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
        WHERE u.user_id = ?; 
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows[0]; // Return profile or undefined
}

module.exports = {
    getDashboardStats,
    findStaffProfileById,
    checkStaffRole
};