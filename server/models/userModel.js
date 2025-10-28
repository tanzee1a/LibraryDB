// models/userModel.js
const db = require('../config/db'); 

const bcrypt = require('bcrypt'); // --- ADDED: Import bcrypt ---

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

// --- ADDED: Find ALL Users (Patrons and Staff) ---
async function findAllUsers() {
    const sql = `
        SELECT 
            u.user_id, 
            u.email, 
            u.role, 
            u.firstName, 
            u.lastName,
            -- Optionally join staff roles if needed
            sr.role_name AS staff_role 
        FROM USER u
        LEFT JOIN STAFF s ON u.user_id = s.user_id AND u.role = 'Staff'
        LEFT JOIN STAFF_ROLES sr ON s.role_id = sr.role_id
        ORDER BY u.lastName, u.firstName;
    `;
    const [rows] = await db.query(sql);
    // TODO: Maybe add counts for borrows/holds/fines per user if needed for display?
    return rows;
}

// --- ADDED: Staff Creates User (with Hashing) ---
async function staffCreateUser(userData) {
    const { user_id, email, role, firstName, lastName, temporaryPassword } = userData;

    // Basic validation
    if (!user_id || !email || !role || !firstName || !lastName || !temporaryPassword) {
        throw new Error('Missing required fields for user creation.');
    }

    // Hash the temporary password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(temporaryPassword, saltRounds);

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert into USER table (NO password_hash here)
        const userSql = `
            INSERT INTO USER (user_id, email, role, firstName, lastName)
            VALUES (?, ?, ?, ?, ?)
        `; // Assumes USER table still has email
        await conn.query(userSql, [user_id, email, role, firstName, lastName]);

        // 2. Insert into USER_CREDENTIAL table
        const credentialSql = `
            INSERT INTO USER_CREDENTIAL (email, password_hash) 
            VALUES (?, ?)
        `;
        await conn.query(credentialSql, [email, password_hash]);


        // 3. If the role is 'Staff', also insert into STAFF table
        if (role === 'Staff') {
            const defaultStaffRoleId = 3; // Clerk
            const staffSql = 'INSERT INTO STAFF (user_id, role_id) VALUES (?, ?)';
            await conn.query(staffSql, [user_id, defaultStaffRoleId]);
        }

        await conn.commit();
        // Return user data (excluding password)
        return { user_id, email, role, firstName, lastName };

    } catch (error) {
        await conn.rollback();
        // Check for duplicate user_id or email errors (email PK in USER_CREDENTIAL)
        if (error.code === 'ER_DUP_ENTRY') {
             if (error.sqlMessage.includes('USER.PRIMARY')) {
                 throw new Error('User ID already exists.');
             } else if (error.sqlMessage.includes('USER_CREDENTIAL.PRIMARY')) {
                 throw new Error('Email address already exists.');
             } else {
                  throw new Error('Duplicate entry error.');
             }
        }
        console.error("Error in staffCreateUser transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

// --- ADDED: Find User Profile with History Counts ---
async function findUserProfileById(userId) {
    const conn = await db.getConnection(); // Use a connection for multiple queries
    try {
        // 1. Get Base User Info
        const userSql = `
            SELECT 
                u.user_id, u.email, u.role, u.firstName, u.lastName,
                sr.role_name AS staff_role 
            FROM USER u
            LEFT JOIN STAFF s ON u.user_id = s.user_id AND u.role = 'Staff'
            LEFT JOIN STAFF_ROLES sr ON s.role_id = sr.role_id
            WHERE u.user_id = ?;
        `;
        const [userRows] = await conn.query(userSql, [userId]);
        if (userRows.length === 0) {
            return undefined; // User not found
        }
        const userProfile = userRows[0];

        // 2. Get Current Borrows Count
        const loanedOutStatusId = 2; // Assuming 'Loaned Out'
        const [borrowCountRows] = await conn.query(
            'SELECT COUNT(*) as count FROM BORROW WHERE user_id = ? AND status_id = ?',
            [userId, loanedOutStatusId]
        );
        userProfile.current_borrows = borrowCountRows[0]?.count || 0;

        // 3. Get Active Holds Count (Pending Pickups)
        const [holdCountRows] = await conn.query(
            'SELECT COUNT(*) as count FROM HOLD WHERE user_id = ? AND picked_up_at IS NULL AND canceled_at IS NULL AND expires_at >= NOW()',
            [userId]
        );
        userProfile.active_holds = holdCountRows[0]?.count || 0;

        // 4. Get Outstanding Fines (Amount)
        const [fineSumRows] = await conn.query(
            'SELECT SUM(amount) as total_fines FROM FINE WHERE user_id = ? AND date_paid IS NULL AND waived_at IS NULL',
            [userId]
        );
        userProfile.outstanding_fines = fineSumRows[0]?.total_fines || 0;

        // --- Fetch Detailed History (Separate API calls recommended) ---
        // For simplicity now, we only add counts. The detailed lists below should
        // ideally be fetched via separate API calls triggered by the frontend tabs.
        // We will add separate functions for these later if needed.

        return userProfile;

    } catch (error) {
        console.error(`Error fetching profile for user ${userId}:`, error);
        throw error; // Let controller handle it
    } finally {
        if (conn) conn.release(); // Release connection
    }
}

async function findBorrowHistoryForUser(userId) {
    const returnedStatusId = 3; // 'Returned'
    const lostStatusId = 4;     // 'Lost'
     const sql = `
        SELECT 
            b.borrow_id, 
            b.item_id,
            b.borrow_date,
            b.due_date,
            b.return_date,
            bs.status_name,
            COALESCE(bk.title, m.title, d.device_name) AS item_title,
            i.thumbnail_url 
        FROM BORROW b
        JOIN ITEM i ON b.item_id = i.item_id
        JOIN BORROW_STATUS bs ON b.status_id = bs.status_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE b.user_id = ? 
        -- Optionally filter only Returned/Lost, or show all for staff view?
        -- AND b.status_id IN (?, ?) 
        ORDER BY b.borrow_date DESC;
    `;
    const [rows] = await db.query(sql, [userId /*, returnedStatusId, lostStatusId */ ]);
    return rows;
}

// --- ADDED: Fetch Detailed Hold History for a User ---
async function findHoldHistoryForUser(userId) {
    const sql = `
        SELECT 
            h.hold_id, 
            h.item_id,
            h.created_at,
            h.expires_at,
            h.picked_up_at,
            h.canceled_at,
            CASE
                WHEN h.picked_up_at IS NOT NULL THEN 'Picked Up'
                WHEN h.canceled_at IS NOT NULL THEN 'Canceled'
                WHEN h.expires_at < NOW() AND h.picked_up_at IS NULL AND h.canceled_at IS NULL THEN 'Expired'
                ELSE 'Pending Pickup' 
            END AS hold_status, 
            COALESCE(bk.title, m.title, d.device_name) AS item_title,
            i.thumbnail_url
        FROM HOLD h
        JOIN ITEM i ON h.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE h.user_id = ?
        ORDER BY h.created_at DESC;
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
}

// --- ADDED: Fetch Detailed Fine History for a User ---
async function findFineHistoryForUser(userId) {
     const sql = `
        SELECT 
            f.fine_id,
            f.borrow_id,
            f.fee_type,
            f.amount,
            f.date_issued,
            f.date_paid,
            f.notes,
            f.waived_at,
            f.waived_reason,
            COALESCE(bk.title, m.title, d.device_name) AS item_title
        FROM FINE f
        JOIN BORROW b ON f.borrow_id = b.borrow_id
        JOIN ITEM i ON b.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE f.user_id = ?
        ORDER BY f.date_issued DESC; 
    `;
     const [rows] = await db.query(sql, [userId]);
    return rows;
}

module.exports = {
    findById,
    findAllUsers,
    staffCreateUser,
    findUserProfileById,
    findBorrowHistoryForUser,
    findFineHistoryForUser,
    findHoldHistoryForUser
};