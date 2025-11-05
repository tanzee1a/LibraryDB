const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'default_secret_key';

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
      // --- Use a connection for a transaction ---
      const conn = await pool.getConnection();
      try {
        const { email, password, firstName, lastName } = JSON.parse(body);
  
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: true, message: 'Email and password required' }));
        }
        
        await conn.beginTransaction(); // Start transaction

        // --- STEP 1: Get the role_id for 'Patron' ---
        const roleName = 'Patron';
        const [roleRows] = await conn.query(
            'SELECT role_id FROM USER_ROLE WHERE role_name = ?',
            [roleName]
        );

        if (roleRows.length === 0) {
            throw new Error("Default role 'Patron' not found in USER_ROLE table.");
        }
        const role_id = roleRows[0].role_id;
        // --- END STEP 1 ---

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
  
        // Generate user_id
        const userId = generateUserId();
        
        // --- STEP 2: Insert into USER table (using role_id) ---
        await conn.query(
          'INSERT INTO USER (user_id, email, role_id, firstName, lastName) VALUES (?, ?, ?, ?, ?)',
          [userId, email, role_id, firstName || '', lastName || '']
        );

        await pool.query(
          'INSERT INTO USER_CREDENTIAL (email, password_hash) VALUES (?, ?)',
          [email, hashedPassword]
        );
  
        await conn.commit(); // Commit transaction

        res.writeHead(201, { 'Content-Type': 'application/json' });
        // Return the roleName for clarity
        res.end(JSON.stringify({ message: 'User registered successfully', userId, role: roleName })); 
      
      } catch (err) {
        console.error(err);
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
      }
    });
  }

// LOGIN USER
async function loginUser(req, res) {
  let body = '';
  req.on('data', chunk => (body += chunk.toString()));
  req.on('end', async () => {
    try {
      // SECRET needs to be defined in scope for jwt.sign
      const SECRET = process.env.JWT_SECRET || 'your-super-secret-key'; 
      const { email, password } = JSON.parse(body);

      const [rows] = await pool.query(
        `SELECT 
          U.user_id,
          U.email,
          UR.role_name AS role, -- Get the role NAME from USER_ROLE
          U.firstName,
          U.lastName,
          UC.password_hash
        FROM 
          USER U
        JOIN 
          USER_CREDENTIAL UC ON U.email = UC.email
        JOIN 
          USER_ROLE UR ON U.role_id = UR.role_id -- Join to get the role name
        WHERE 
          U.email = ?`, 
        [email]
      );
      
      if (rows.length === 0) {
        // This handles cases where the email doesn't exist in either table (or the join fails)
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Invalid email or password' }));
      }

      const user = rows[0];
      
      // The password hash is now retrieved from the joined USER_CREDENTIAL table
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Invalid email or password' }));
      }

      // Assuming jwt and SECRET are defined/imported globally
      const token = jwt.sign(
        { id: user.user_id, email: user.email, role: user.role },
        SECRET,
        { expiresIn: '1h' }
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
          lastName: user.lastName
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
