const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root@123',
    database: process.env.DB_NAME || 'Gamyartha'
};

async function migrate() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        // 1. Check and Add group_type to expense_groups
        try {
            console.log('Checking expense_groups table for group_type column...');
            await connection.execute(`
                ALTER TABLE expense_groups
                ADD COLUMN group_type ENUM('general', 'family') DEFAULT 'general'
            `);
            console.log('SUCCESS: Added group_type column to expense_groups.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('SKIPPING: group_type column already exists.');
            } else {
                console.error('ERROR adding group_type:', err.message);
            }
        }

        // 2. Check and Add invite_token to expense_groups
        try {
            console.log('Checking expense_groups table for invite_token column...');
            await connection.execute(`
                ALTER TABLE expense_groups
                ADD COLUMN invite_token VARCHAR(64) UNIQUE NULL
            `);
            console.log('SUCCESS: Added invite_token column to expense_groups.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('SKIPPING: invite_token column already exists.');
            } else {
                console.error('ERROR adding invite_token:', err.message);
            }
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

migrate();
