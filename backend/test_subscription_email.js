const mysql = require('mysql2/promise');
const RecurringTransactionService = require('./services/RecurringTransactionService');
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

async function testSubscriptionEmail() {
    try {
        const pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();

        console.log('🔍 Checking for recurring transactions...');

        // Get all recurring transactions
        const [txns] = await connection.query('SELECT * FROM recurring_transactions WHERE is_active = 1');
        console.log(`Found ${txns.length} active recurring transactions`);

        if (txns.length === 0) {
            console.log('\n❌ No active subscriptions found. Create one first from the app.');
            connection.release();
            process.exit(0);
        }

        // Show the subscriptions
        console.log('\n📋 Active Subscriptions:');
        txns.forEach((txn, i) => {
            console.log(`${i + 1}. ${txn.description} - ₹${txn.amount} (${txn.frequency})`);
            console.log(`   Next Due: ${txn.next_due_date}`);
            console.log(`   User ID: ${txn.user_id}`);
        });

        // Check user email settings
        const [users] = await connection.query(
            'SELECT id, email, full_name, email_alerts_enabled FROM users WHERE id IN (?)',
            [txns.map(t => t.user_id)]
        );

        console.log('\n👤 User Email Settings:');
        users.forEach(u => {
            console.log(`${u.full_name} (${u.email}): Email Alerts ${u.email_alerts_enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
        });

        // Ask if user wants to force process
        console.log('\n\n🧪 TEST OPTIONS:');
        console.log('1. To manually trigger processing, update a subscription\'s next_due_date to today:');
        console.log('   UPDATE recurring_transactions SET next_due_date = CURDATE() WHERE id = [ID];');
        console.log('\n2. Then run: node test_subscription_email.js --process');
        console.log('\n3. Or wait for the scheduled job to run (every 5 minutes)');

        // If --process flag is passed, actually process
        if (process.argv.includes('--process')) {
            console.log('\n🚀 Processing due transactions NOW...');
            const service = new RecurringTransactionService(pool);
            const count = await service.processDueTransactions();
            console.log(`✅ Processed ${count} transactions. Check your email!`);
        }

        connection.release();
        pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testSubscriptionEmail();
