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

module.exports = {
    findById,
    findAllUsers,
    staffCreateUser
};