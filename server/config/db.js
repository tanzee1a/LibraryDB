require('dotenv').config(); 

console.log('My DB Host from .env is:', process.env.DB_HOST);

const mysql = require('mysql2/promise');

// Load variables from .env
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Optional test to confirm connection
(async () => {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Database connected successfully!');
      connection.release();
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
    }
  })();
  
module.exports = pool;


