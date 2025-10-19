require('dotenv').config(); 

console.log('My DB Host from .env is:', process.env.DB_HOST);

const mysql = require('mysql2/promise');

// Load variables from .env
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

module.exports = pool;
