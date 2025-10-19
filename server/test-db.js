require('dotenv').config();
const mysql = require('mysql2/promise');

// These are the same options from your db.js
const connectionOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

async function testConnection() {
    let connection;
    try {
        console.log(`Attempting to connect to ${process.env.DB_HOST} as ${process.env.DB_USER}...`);
        
        // Use createConnection for a single, direct test
        connection = await mysql.createConnection(connectionOptions);
        
        console.log('✅ Connection successful!');
        
        console.log('Running test query (SELECT 1+1)...');
        const [rows] = await connection.query('SELECT 1+1 AS solution');
        
        console.log(`✅ Query successful! Result: ${rows[0].solution}`);
    } catch (error) {
        console.error('❌ Test failed:');
        console.error(error);
    } finally {
        if (connection) {
            console.log('Closing connection.');
            await connection.end();
        }
    }
}

testConnection();