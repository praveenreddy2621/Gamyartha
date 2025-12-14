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

async function createTestSubscription() {
    try {
        const pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();

        console.log('Creating test manual subscription for User ID 1...\n');

        // Create a manual subscription due today for User ID 1
        const [result] = await connection.query(`
            INSERT INTO recurring_transactions 
            (user_id, amount, description, category, type, frequency, start_date, next_due_date, payment_mode, is_active)
            VALUES (1, 500, 'Test Manual Subscription', 'Subscription', 'expense', 'monthly', CURDATE(), CURDATE(), 'manual', 1)
        `);

        console.log(`✅ Created subscription with ID: ${result.insertId}`);
        console.log('Now processing it...\n');

        // Process it
        const RecurringTransactionService = require('./services/RecurringTransactionService');
        const service = new RecurringTransactionService(pool);
        await service.processDueTransactions();

        console.log('\n✅ Done! Check your notifications now.');

        connection.release();
        pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTestSubscription();
