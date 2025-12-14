const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function manualFix() {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query("UPDATE split_requests SET status = 'completed' WHERE id IN (15, 16)");
    console.log('✅ Fixed splits 15 and 16 to COMPLETED');
    await connection.end();
}

manualFix();
