// models/userModel.js
const db = require('../config/db'); 
const bcrypt = require('bcrypt');

const SUSPENSION_THRESHOLD = 20.00;
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
async function findAllUsers(searchTerm, filters = {}, sort = '') {
    let sql = `
        SELECT 
            u.user_id, 
            u.email, 
            ur.role_name AS role,
            u.firstName, 
            u.lastName,
            sr.role_name AS staff_role 
        FROM USER u
        JOIN USER_ROLE ur ON u.role_id = ur.role_id
        LEFT JOIN STAFF s ON u.user_id = s.user_id AND ur.role_name = 'Staff'
        LEFT JOIN STAFF_ROLES sr ON s.role_id = sr.role_id
    `; 
    
    let params = [];
    let whereClauses = []; // Use an array to build WHERE clauses

    // --- Search Term Clause ---
    if (searchTerm && searchTerm.trim()) {
        const queryTerm = `%${searchTerm}%`;
        // Add parentheses for correct AND/OR logic
        whereClauses.push(`(u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ?)`);
        params.push(queryTerm, queryTerm, queryTerm);
    }

    // --- Role Filter Clause ---
    const roleFilter = filters.role ? filters.role.split(',') : [];
    if (roleFilter.length > 0) {
        // 'role' is the param name from userFilterOptions
        whereClauses.push(`ur.role_name IN (?)`);
        params.push(roleFilter);
    }
    // --- End Role Filter ---

    // Assemble the final SQL
    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

   let orderByClause = ' '; // Default
    if (sort === 'Fname_desc') {
        orderByClause = ' ORDER BY u.firstName DESC';
    }   else if (sort === 'Fname_asc') {
        orderByClause = ' ORDER BY u.firstName ASC';
    }   else if (sort === 'Lname_asc') {
        orderByClause = ' ORDER BY u.lastName ASC';
    }   else if (sort === 'Lname_desc') {
        orderByClause = ' ORDER BY u.lastName DESC';
    }
    
    sql += orderByClause; // Append the sort logic
    
    const [rows] = await db.query(sql, params);
    return rows;
}

// --- MODIFIED: Staff Creates User (with Hashing) ---
async function staffCreateUser(userData) {
    // 'role' is the role NAME (e.g., "Student") from the frontend
    const { user_id, email, role, firstName, lastName, temporaryPassword, staffRole } = userData;

    // Basic validation
    if (!user_id || !email || !role || !firstName || !lastName || !temporaryPassword) {
        throw new Error('Missing required fields for user creation.');
    }

    if (role === 'Staff' && !staffRole) {
         throw new Error('Staff Role (e.g., Clerk) is required when creating a Staff user.');
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

        if (role === 'Staff') {
            // 4a. Get the specific staff role_id from STAFF_ROLES
            const [staffRoleRows] = await conn.query(
                'SELECT role_id FROM STAFF_ROLES WHERE role_name = ?',
                [staffRole] // Use the new variable from the frontend
            );

            if (staffRoleRows.length === 0) {
                throw new Error(`Invalid staff role specified: ${staffRole}`);
            }
            const specificStaffRoleId = staffRoleRows[0].role_id; // This is the dynamic ID

            // 4b. Insert into STAFF table using the dynamically found ID
            const staffSql = 'INSERT INTO STAFF (user_id, role_id) VALUES (?, ?)';
            await conn.query(staffSql, [user_id, specificStaffRoleId]); // <-- USE new ID
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

async function findUserProfileById(userId) {
    const conn = await db.getConnection();
    try {
        // --- STEP 1: Get Base User Info, Role, Fines, and Suspension ---
        const userSql = `
            SELECT 
                u.user_id, 
                u.email, 
                u.firstName, 
                u.lastName,
                r.role_name AS role,
                r.requires_membership_fee,
                sr.role_name AS staff_role,
                COALESCE(f.total_fines, 0.00) AS total_fines,
                (COALESCE(f.total_fines, 0.00) >= ?) AS is_suspended
            FROM USER u
            JOIN USER_ROLE r ON u.role_id = r.role_id
            LEFT JOIN (
                SELECT user_id, SUM(amount) AS total_fines
                FROM FINE
                WHERE date_paid IS NULL AND waived_at IS NULL
                GROUP BY user_id
            ) AS f ON u.user_id = f.user_id
            LEFT JOIN STAFF s ON u.user_id = s.user_id AND r.role_name = 'Staff'
            LEFT JOIN STAFF_ROLES sr ON s.role_id = sr.role_id
            WHERE u.user_id = ?
        `;
        
        const [userRows] = await conn.query(userSql, [SUSPENSION_THRESHOLD, userId]);
        
        if (userRows.length === 0) {
            return undefined; // User not found
        }

        const userProfile = userRows[0];

        // --- STEP 2: Get Loan and Hold counts (as you had before) ---
        const loanedOutStatusId = 2; // 'Loaned Out'
        const [borrowCountRows] = await conn.query(
            'SELECT COUNT(*) as count FROM BORROW WHERE user_id = ? AND status_id = ?',
            [userId, loanedOutStatusId]
        );
        userProfile.current_borrows = borrowCountRows[0]?.count || 0;

        const [holdCountRows] = await conn.query(
            'SELECT COUNT(*) as count FROM HOLD WHERE user_id = ? AND picked_up_at IS NULL AND canceled_at IS NULL AND expires_at >= NOW()',
            [userId]
        );
        userProfile.active_holds = holdCountRows[0]?.count || 0;
        
        // (Note: outstanding_fines is already included in userProfile from STEP 1)
        userProfile.outstanding_fines = userProfile.total_fines;


        // --- STEP 3: Get Membership Status (NEW) ---
        if (userProfile.requires_membership_fee) {
            const membershipSql = "SELECT * FROM PATRON_MEMBERSHIP WHERE user_id = ?";
            const [membershipRows] = await conn.query(membershipSql, [userId]);

            if (membershipRows.length === 0) {
                userProfile.membership_status = 'new';
                userProfile.membership_details = null;
            } else {
                const membership = membershipRows[0];
                const isExpired = new Date(membership.expires_at) < new Date();

                if (isExpired) {
                    userProfile.membership_status = 'expired';
                } else if (membership.auto_renew === 0) {
                    userProfile.membership_status = 'canceled';
                } else {
                    userProfile.membership_status = 'active';
                }
                
                
                userProfile.card_last_four = membership.card_last_four;
                userProfile.expires_at = membership.expires_at;
                userProfile.auto_renew = membership.auto_renew;
                
            }
        } else {
            userProfile.membership_status = null;
            userProfile.membership_details = null;
        }

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
    const { role: incomingRole, staffRole } = userData;

    let role = incomingRole; 
    let currentEmail = null; 

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();
        
        // STEP 1: Fetch Current Role AND Email for necessary checks
        if (!role || (userData.email !== undefined)) {
             const [userRow] = await conn.query(`
                SELECT ur.role_name AS role, u.email
                FROM USER u
                JOIN USER_ROLE ur ON u.role_id = ur.role_id
                WHERE u.user_id = ?
            `, [userId]);

            if (userRow.length === 0) {
                 throw new Error('User to update not found.');
            }
            role = role || userRow[0].role; // Use existing role if not provided
            currentEmail = userRow[0].email; // Store current email
        }
        
        // STEP 2: Email Duplication Check (Prevents foreign key errors)
        if (userData.email !== undefined && userData.email !== currentEmail) {
            const [duplicateCheck] = await conn.query(
                'SELECT user_id FROM USER WHERE email = ? AND user_id != ?',
                [userData.email, userId]
            );
            if (duplicateCheck.length > 0) {
                throw new Error('Email address already exists.');
            }
        }
        
        // Define all valid roles 
        const USER_ROLES_PRIMARY = ['Patron', 'Student', 'Faculty'];
        const STAFF_ROLES_ALL = ['Staff', 'Librarian', 'Assistant Librarian', 'Clerk', 'Admin'];

        // STEP 3: Build the dynamic update map for the USER table
        const userUpdateMap = {};
        const allowedUserFields = ['firstName', 'lastName', 'email'];
        
        // Populate map ONLY with defined values from the payload
        for (const field of allowedUserFields) {
            if (userData[field] !== undefined) { 
                userUpdateMap[field] = userData[field];
            }
        }
        
        // --- Core Logic ---

        if (USER_ROLES_PRIMARY.includes(role)) {
            
            const [roleRows] = await conn.query('SELECT role_id FROM USER_ROLE WHERE role_name = ?', [role]);
            if (roleRows.length === 0) {
                throw new Error(`Invalid user role: ${role}`);
            }
            const role_id = roleRows[0].role_id;
            userUpdateMap.role_id = role_id; 

            const setClauses = Object.keys(userUpdateMap).map(key => `${key} = ?`).join(', ');
            const values = Object.values(userUpdateMap);
            
            if (values.length > 0) {
                const userSql = `UPDATE USER SET ${setClauses} WHERE user_id = ?`;
                await conn.query(userSql, [...values, userId]);
            }

        } 
        else if (STAFF_ROLES_ALL.includes(role)) { 
            
            const setClauses = Object.keys(userUpdateMap).map(key => `${key} = ?`).join(', ');
            const values = Object.values(userUpdateMap);

            if (values.length > 0) {
                const userSql = `UPDATE USER SET ${setClauses} WHERE user_id = ?`;
                await conn.query(userSql, [...values, userId]);
            }

            if (staffRole) {
                const [staffRoleRows] = await conn.query(
                    'SELECT role_id FROM STAFF_ROLES WHERE role_name = ?',
                    [staffRole]
                );
                if (staffRoleRows.length === 0) {
                    throw new Error(`Invalid staff role: ${staffRole}`);
                }
                const specificStaffRoleId = staffRoleRows[0].role_id;

                const staffUpdateSql = `
                    UPDATE STAFF 
                    SET role_id = ?
                    WHERE user_id = ?
                `;
                await conn.query(staffUpdateSql, [specificStaffRoleId, userId]);
            }
        } 
        else {
            throw new Error(`Invalid role specified for update. Role received: ${role}`);
        }

        await conn.commit();
        return { user_id: userId, ...userData }; 

    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('USER.uq_user_email')) {
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

/**
 * Staff deactivates a user. (SOFT DELETE)
 * Sets their account_status to 'DEACTIVATED'.
 * @returns {Promise<number>} 1 if successful, 0 if user not found.
 */
async function staffDeactivateUser(userId) {
    
    // Step 1: First, check if the user actually exists.
    // This allows us to differentiate "not found" (0) from "success" (1)
    // even if the user was already deactivated.
    const [userRows] = await db.query('SELECT user_id FROM USER WHERE user_id = ?', [userId]);

    if (userRows.length === 0) {
        return 0; // Return 0 to signal "User not found" to the controller
    }

    // Step 2: User exists, so update their status.
    const sql = "UPDATE USER SET account_status = 'DEACTIVATED' WHERE user_id = ?";
    
    try {
        // We run the update. We don't need to check affectedRows here,
        // because we already know the user exists.
        await db.query(sql, [userId]);
        
        // Return 1 to signal "Success"
        return 1; 
    } catch (error) {
        // The foreign key constraint error won't happen,
        // so we just re-throw any other unexpected db error.
        console.error("Error in staffDeactivateUser model:", error);
        throw error;
    }
}

async function changeUserPassword(userId, currentPassword, newPassword) {
    // 1. Get the user's email and current password hash
    const userSql = `
        SELECT uc.password_hash, u.email 
        FROM USER_CREDENTIAL uc
        JOIN USER u ON uc.email = u.email 
        WHERE u.user_id = ?
    `;
    const [userRows] = await db.query(userSql, [userId]);

    if (userRows.length === 0) {
        // Should not happen if protect middleware works, but a safe check
        throw new Error('User not found.'); 
    }
    
    const { password_hash, email } = userRows[0];
    
    // 2. Compare the provided currentPassword with the stored hash
    const isMatch = await bcrypt.compare(currentPassword, password_hash);

    if (!isMatch) {
        return false; // Current password incorrect
    }
    
    // 3. Hash the new password
    const saltRounds = 10;
    const new_password_hash = await bcrypt.hash(newPassword, saltRounds);

    // 4. Update the password hash in USER_CREDENTIAL
    const updateSql = `
        UPDATE USER_CREDENTIAL
        SET password_hash = ?
        WHERE email = ?
    `;
    const [result] = await db.query(updateSql, [new_password_hash, email]);

    return result.affectedRows > 0;
}

async function changeUserEmail(userId, newEmail) {
    const conn = await db.getConnection();
    await conn.beginTransaction();
    
    try {
        // 1. Get current email
        const [userRows] = await conn.query(
            'SELECT email FROM USER WHERE user_id = ?', 
            [userId]
        );
        
        if (userRows.length === 0) {
            await conn.rollback();
            return false; // User not found
        }
        
        const currentEmail = userRows[0].email;
        
        // Check 1: Is the email the same?
        if (currentEmail === newEmail) {
            await conn.rollback();
            throw new Error('New email is the same as the current email.');
        }

        // Check 2: CRITICAL PRE-CHECK - Is the new email already used by someone else?
        const [duplicateCheck] = await conn.query(
            'SELECT user_id FROM USER WHERE email = ? AND user_id != ?',
            [newEmail, userId]
        );

        if (duplicateCheck.length > 0) {
            await conn.rollback();
            throw new Error('Email address already exists for another user.');
        }

        // 3. Update the parent table (USER). Cascade handles USER_CREDENTIAL.
        const userUpdateSql = `
            UPDATE USER
            SET email = ?
            WHERE user_id = ?
        `;
        const [userResult] = await conn.query(userUpdateSql, [newEmail, userId]);
        
        // FIX: The commit is now reached if no error was thrown.
                
        await conn.commit();
        return true;

    } catch (error) {
        await conn.rollback();
        
        // Handle all possible errors (including the misleading foreign key error)
        if (error.code === 'ER_DUP_ENTRY' || error.sqlMessage?.includes('USER.uq_user_email') || error.sqlMessage?.includes('FOREIGN KEY')) {
            throw new Error('Email address already exists for another user.');
        }
        
        console.error("Error in changeUserEmail transaction:", error);
        throw error;
    } finally {
        conn.release();
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
    staffDeleteUser,
    staffDeactivateUser,
    changeUserPassword,
    changeUserEmail
};