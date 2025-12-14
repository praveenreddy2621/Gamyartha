const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dhan_sarthi',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function fixNotificationType() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB.');

        // Change type to VARCHAR to allow any string
        await connection.execute(`
            ALTER TABLE notifications 
            MODIFY COLUMN type VARCHAR(50) NOT NULL
        `);
        console.log('✅ Notification type changed to VARCHAR successfully.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

fixNotificationType();
