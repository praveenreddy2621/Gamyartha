const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function checkNotifications() {
    try {
        const pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();

        console.log('Checking notifications...\n');

        const [notifications] = await connection.query(`
            SELECT * FROM notifications 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        console.log(`Found ${notifications.length} recent notifications:\n`);
        notifications.forEach((n, i) => {
            console.log(`${i + 1}. [${n.type}] ${n.title}`);
            console.log(`   User ID: ${n.user_id}`);
            console.log(`   Message: ${n.message}`);
            console.log(`   Created: ${n.created_at}`);
            console.log(`   Read: ${n.read_at ? 'Yes' : 'No'}`);
            console.log('');
        });

        connection.release();
        pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkNotifications();
