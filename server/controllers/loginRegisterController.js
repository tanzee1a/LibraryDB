const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'super_secret_key';

// Helper to generate a unique user_id
function generateUserId() {
    const timestamp = Date.now(); // e.g., 1698101234567
    const random = Math.floor(Math.random() * 1000); // 0–999
    return `U${timestamp}${random}`.slice(0, 13); // make it 13 chars
  }
  

// REGISTER NEW USER
async function registerUser(req, res) {
  let body = '';
  req.on('data', chunk => (body += chunk.toString()));
  req.on('end', async () => {
    let conn; 
    try {
      conn = await pool.getConnection(); 
      
      const { email, password, firstName, lastName } = JSON.parse(body);

      if (!email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: true, message: 'Email and password required' }));
      }
      
      await conn.beginTransaction(); 

      const roleName = 'Patron';
      const [roleRows] = await conn.query(
          'SELECT role_id FROM USER_ROLE WHERE role_name = ?',
          [roleName]
      );

      if (roleRows.length === 0) {
          throw new Error("Default role 'Patron' not found in USER_ROLE table."); 
      }
      const role_id = roleRows[0].role_id;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate user_id
      const userId = generateUserId();
      
      // Insert into USER table (using role_id) 
      await conn.query(
        'INSERT INTO USER (user_id, email, role_id, firstName, lastName) VALUES (?, ?, ?, ?, ?)',
        [userId, email, role_id, firstName || '', lastName || '']
      );

      await conn.query(
        'INSERT INTO USER_CREDENTIAL (email, password_hash) VALUES (?, ?)',
        [email, hashedPassword]
      );

      await conn.commit();

      const token = jwt.sign(
        { id: userId, email: email, role: roleName, staffRole: null}, 
        SECRET,
        { expiresIn: '1h' }
      );
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'User registered successfully',
        token, 
        user: {
          id: userId,
          email: email,
          role: roleName,
          firstName: firstName || '',
          lastName: lastName || '',
          staffRole: null
        }
      })); 
    
    } catch (err) {
      console.error('Registration Error:', err);
      if (conn) {
          await conn.rollback().catch(e => console.error("Rollback failed:", e)); 
      }

      if (err.code === 'ER_DUP_ENTRY') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: true, message: err.sqlMessage }));
      } else if (err.code) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: true, code: err.code, message: err.sqlMessage || 'Error registering user' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: true, message: 'Error registering user' }));
      }
    } finally {
      if (conn) {
          conn.release();
      }
    }
  });
}

// LOGIN USER
async function loginUser(req, res) {
  let body = '';
  req.on('data', chunk => (body += chunk.toString()));
  req.on('end', async () => {
    try {
      const SECRET = process.env.JWT_SECRET || 'super_secret_key'; 
      const { email, password } = JSON.parse(body);

      const [rows] = await pool.query(
        `SELECT 
          U.user_id,
          U.email,
          U.account_status,
          UR.role_name AS role, -- Get the role NAME from USER_ROLE
          SR.role_name AS staffRole,
          U.firstName,
          U.lastName,
          UC.password_hash
        FROM 
          USER U
        JOIN 
          USER_CREDENTIAL UC ON U.email = UC.email
        JOIN 
          USER_ROLE UR ON U.role_id = UR.role_id -- Join to get the role name
        LEFT JOIN STAFF S ON U.user_id = S.user_id
        LEFT JOIN STAFF_ROLES SR ON S.role_id = SR.role_id
        WHERE 
          U.email = ?`, 
        [email]
      );
      
      if (rows.length === 0) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Invalid email or password' }));
      }

      const user = rows[0];

      if (user.account_status === 'DEACTIVATED') {
          res.writeHead(403, { 'Content-Type': 'application/json' }); // 403 Forbidden
          return res.end(JSON.stringify({ message: 'Your account has been deactivated. Please contact support.' }));
      }
      
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Invalid email or password' }));
      }

      const token = jwt.sign(
        { id: user.user_id, email: user.email, role: user.role, staffRole: user.staffRole || null},
        SECRET,
        { expiresIn: '24h' }
      );
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Login successful',
        token,
        user: {
          id: user.user_id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          staffRole: user.staffRole || null,
        }
      }));
    } catch (err) {
      console.error('Error during user login:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Server error' }));
    }
  });
}

module.exports = { registerUser, loginUser };
