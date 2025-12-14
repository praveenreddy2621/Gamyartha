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

async function updateNotificationEnum() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB.');

        // Update the ENUM to include more generic types
        await connection.execute(`
            ALTER TABLE notifications 
            MODIFY COLUMN type ENUM(
                'split_reminder', 
                'payment_received', 
                'split_completed', 
                'split_created', 
                'challenge_update', 
                'goal_completed', 
                'budget_exceeded',
                'general',
                'info',
                'warning',
                'success',
                'error'
            ) NOT NULL
        `);
        console.log('✅ Notification ENUM updated successfully.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateNotificationEnum();
