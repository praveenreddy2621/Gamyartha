const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

async function fixSchema() {
    console.log('Starting schema fix...');
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Fix users table
        try {
            console.log('Checking users table...');
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('✅ Added/Verified last_active_at column in users table.');
        } catch (err) {
            console.error('❌ Error updating users table:', err.message);
        }

        // 2. Fix obligations table
        try {
            console.log('Checking obligations table...');
            await connection.query(`
                ALTER TABLE obligations 
                ADD COLUMN IF NOT EXISTS last_reminded_at DATE NULL
            `);
            console.log('✅ Added/Verified last_reminded_at column in obligations table.');
        } catch (err) {
            console.error('❌ Error updating obligations table:', err.message);
        }

    } catch (err) {
        console.error('❌ Database connection error:', err);
    } finally {
        if (connection) await connection.end();
        console.log('Schema fix completed.');
        process.exit(0);
    }
}

fixSchema();
