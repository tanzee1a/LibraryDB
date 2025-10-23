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
      try {
        const { email, password, firstName, lastName } = JSON.parse(body);
  
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Email and password required' }));
        }
  
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
  
        // Generate user_id and default role
        const userId = generateUserId();
        const role = 'Patron';
  
        await pool.query(
          'INSERT INTO USER (user_id, email, password_hash, role, firstName, lastName) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, email, hashedPassword, role, firstName || '', lastName || '']
        );
  
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User registered successfully', userId, role }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Error registering user' }));
      }
    });
  }

// LOGIN USER
async function loginUser(req, res) {
  let body = '';
  req.on('data', chunk => (body += chunk.toString()));
  req.on('end', async () => {
    try {
      const { email, password } = JSON.parse(body);

      const [rows] = await pool.query('SELECT * FROM USER WHERE email = ?', [email]);
      if (rows.length === 0) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Invalid email or password' }));
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Invalid email or password' }));
      }

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
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Server error' }));
    }
  });
}

module.exports = { registerUser, loginUser };
