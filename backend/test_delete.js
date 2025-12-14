
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

async function testDelete() {
    try {
        const pool = mysql.createPool(dbConfig);
        const service = new RecurringTransactionService(pool);

        console.log('Testing deleteRecurringTransaction directly...');
        // Try to delete transaction ID 2 for User ID 1
        // We first check if it exists
        const [rows] = await pool.query('SELECT * FROM recurring_transactions WHERE id = 2 AND user_id = 1');
        if (rows.length === 0) {
            console.log('❌ Transaction 2 for user 1 NOT FOUND in DB. It might have been deleted already.');
        } else {
            console.log('✅ Found transaction 2 for user 1. Proceeding to delete...');
            const success = await service.deleteRecurringTransaction(1, 2);
            console.log(`Delete Result: ${success}`);
        }

        pool.end();
    } catch (error) {
        console.error('Test Error:', error);
    }
}

testDelete();
