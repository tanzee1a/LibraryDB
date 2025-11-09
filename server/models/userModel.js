// models/userModel.js
const db = require('../config/db'); 
const bcrypt = require('bcrypt');

/**
 * Finds a user by their ID.
 */
async function findById(userId) {
    // --- MODIFIED: JOIN to get role_name ---
    const sql = `
        SELECT 
            u.user_id, 
            u.email, 
            ur.role_name AS role, -- Get the name from USER_ROLE
            u.firstName, 
            u.lastName 
        FROM USER u
        JOIN USER_ROLE ur ON u.role_id = ur.role_id -- Join to get the role
        WHERE u.user_id = ?
    `;
    // --- END MODIFICATION ---
    const [rows] = await db.query(sql, [userId]);
    return rows[0]; // Returns the user object or undefined if not found
}

// --- MODIFIED: Find ALL Users (Patrons and Staff) ---
async function findAllUsers() {
    // --- MODIFIED: JOIN to get role_name and check role_name ---
    const sql = `
        SELECT 
            u.user_id, 
            u.email, 
            ur.role_name AS role, -- Get the name from USER_ROLE
            u.firstName, 
            u.lastName,
            sr.role_name AS staff_role 
        FROM USER u
        JOIN USER_ROLE ur ON u.role_id = ur.role_id -- Join to get the role
        -- Check role_name from the new table
        LEFT JOIN STAFF s ON u.user_id = s.user_id AND ur.role_name = 'Staff'
        LEFT JOIN STAFF_ROLES sr ON s.role_id = sr.role_id
        ORDER BY u.lastName, u.firstName;
    `;
    // --- END MODIFICATION ---
    const [rows] = await db.query(sql);
    return rows;
}

// --- MODIFIED: Staff Creates User (with Hashing) ---
async function staffCreateUser(userData) {
    // 'role' is the role NAME (e.g., "Student") from the frontend
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

        // --- STEP 1: Get the role_id from the role_name ---
        const [roleRows] = await conn.query(
            'SELECT role_id FROM USER_ROLE WHERE role_name = ?', 
            [role]
        );

        if (roleRows.length === 0) {
            throw new Error(`Invalid user role specified: ${role}`);
        }
        const role_id = roleRows[0].role_id; // This is the ID we need
        // --- END STEP 1 ---

        // --- STEP 2: Insert into USER table (using role_id) ---
        const userSql = `
            INSERT INTO USER (user_id, email, role_id, firstName, lastName)
            VALUES (?, ?, ?, ?, ?)
        `; 
        // Pass the role_id (number) instead of the role (name)
        await conn.query(userSql, [user_id, email, role_id, firstName, lastName]);
        // --- END STEP 2 ---

        // 3. Insert into USER_CREDENTIAL table (No change)
        const credentialSql = `
            INSERT INTO USER_CREDENTIAL (email, password_hash) 
            VALUES (?, ?)
        `;
        await conn.query(credentialSql, [email, password_hash]);


        // 4. If the role is 'Staff', also insert into STAFF table (No change)
        //    (The 'role' variable is still the name, so this check works)
        if (role === 'Staff') {
            const defaultStaffRoleId = 3; // Clerk
            const staffSql = 'INSERT INTO STAFF (user_id, role_id) VALUES (?, ?)';
            await conn.query(staffSql, [user_id, defaultStaffRoleId]);
        }

        await conn.commit();
        // Return user data (excluding password)
        return { user_id, email, role, firstName, lastName }; // Return the NAME

    } catch (error) {
        await conn.rollback();
        // Check for duplicate user_id or email errors (No change)
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

// --- MODIFIED: Find User Profile with History Counts ---
async function findUserProfileById(userId) {
    const conn = await db.getConnection();
    try {
        // --- STEP 1: Get Base User Info (MODIFIED) ---
        const userSql = `
            SELECT 
                u.user_id, u.email, 
                ur.role_name AS role, -- Get the name from USER_ROLE
                u.firstName, u.lastName,
                sr.role_name AS staff_role 
            FROM USER u
            JOIN USER_ROLE ur ON u.role_id = ur.role_id -- Join to get the role
            -- Check role_name from the new table
            LEFT JOIN STAFF s ON u.user_id = s.user_id AND ur.role_name = 'Staff'
            LEFT JOIN STAFF_ROLES sr ON s.role_id = sr.role_id
            WHERE u.user_id = ?;
        `;
        // --- END MODIFICATION ---
        const [userRows] = await conn.query(userSql, [userId]);
        if (userRows.length === 0) {
            return undefined; // User not found
        }
        const userProfile = userRows[0];

        // --- Steps 2, 3, 4 are UNCHANGED ---
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
        
        return userProfile;

    } catch (error) {
        console.error(`Error fetching profile for user ${userId}:`, error);
        throw error; 
    } finally {
        if (conn) conn.release(); 
    }
}

// --- NO CHANGES NEEDED FOR THESE FUNCTIONS ---
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
        ORDER BY b.borrow_date DESC;
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
}

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
// --- END NO CHANGES ---

/**
 * Staff updates a user's details.
 */
async function staffUpdateUser(userId, userData) {
    // Get data from controller
    const { firstName, lastName, email, role } = userData;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get the role_id from the role_name (e.g., "Patron")
        const [roleRows] = await conn.query('SELECT role_id FROM USER_ROLE WHERE role_name = ?', [role]);
        if (roleRows.length === 0) {
            throw new Error(`Invalid user role: ${role}`);
        }
        const role_id = roleRows[0].role_id;

        // 2. Update the USER table.
        // Your schema's "ON UPDATE CASCADE" for USER_CREDENTIAL
        // means changing USER.email here will also update USER_CREDENTIAL.email.
        const userSql = `
            UPDATE USER 
            SET firstName = ?, lastName = ?, email = ?, role_id = ?
            WHERE user_id = ?
        `;
        await conn.query(userSql, [firstName, lastName, email, role_id, userId]);

        // 3. Handle Staff role logic
        if (role === 'Staff') {
            // If user is now Staff, add them to STAFF table if not already present
            const [staffRows] = await conn.query('SELECT * FROM STAFF WHERE user_id = ?', [userId]);
            if (staffRows.length === 0) {
                const defaultStaffRoleId = 3; // 'Clerk'
                await conn.query('INSERT INTO STAFF (user_id, role_id) VALUES (?, ?)', [userId, defaultStaffRoleId]);
            }
        } else {
            // If user is no longer Staff, remove them from STAFF table
            // ON DELETE CASCADE in schema handles this, but we'll be explicit
            await conn.query('DELETE FROM STAFF WHERE user_id = ?', [userId]);
        }

        await conn.commit();
        return { user_id: userId, ...userData }; // Return updated data

    } catch (error) {
        await conn.rollback();
        // Handle duplicate email error
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Email address already exists.');
        }
        console.error("Error in staffUpdateUser transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

/**
 * Staff deletes a user. (HARD DELETE)
 */
async function staffDeleteUser(userId) {
    // WARNING: This is a HARD DELETE.
    // This will FAIL if the user has any BORROW or FINE records
    // due to your schema's foreign key constraints.
    // (HOLD, WISHLIST, STAFF tables should cascade delete).
    
    const sql = 'DELETE FROM USER WHERE user_id = ?';
    try {
        const [result] = await db.query(sql, [userId]);
        return result.affectedRows; // 1 if deleted, 0 if not found
    } catch (error) {
        // Catch the specific error when records are linked
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            throw new Error('Cannot delete user: They have existing borrow or fine records.');
        }
        throw error;
    }
}

module.exports = {
    findById,
    findAllUsers,
    staffCreateUser,
    findUserProfileById,
    findBorrowHistoryForUser,
    findFineHistoryForUser,
    findHoldHistoryForUser,
    staffUpdateUser,
    staffDeleteUser 
};