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

async function testTodaySubscription() {
    try {
        const pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();

        console.log('Creating manual subscription with TODAY as start date...\n');

        // Create a manual subscription due TODAY for User ID 1
        const [result] = await connection.query(`
            INSERT INTO recurring_transactions 
            (user_id, amount, description, category, type, frequency, start_date, next_due_date, payment_mode, is_active)
            VALUES (1, 299, 'Netflix Subscription', 'Subscription', 'expense', 'monthly', CURDATE(), CURDATE(), 'manual', 1)
        `);

        console.log(`✅ Created subscription with ID: ${result.insertId}`);
        console.log('📅 Start date: TODAY');
        console.log('📅 Next due date: TODAY');
        console.log('💳 Payment mode: MANUAL\n');

        console.log('Now processing due subscriptions...\n');

        // Process it immediately
        const RecurringTransactionService = require('./services/RecurringTransactionService');
        const service = new RecurringTransactionService(pool);
        await service.processDueTransactions();

        console.log('\n✅ Done!');
        console.log('\n📧 Check your email for payment reminder');
        console.log('🔔 Check in-app notifications (refresh browser)');
        console.log('🔴 You should see RED "Payment Due" button in the app');

        connection.release();
        pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testTodaySubscription();
