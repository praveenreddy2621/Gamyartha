const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function migrate() {
    let connection;
    try {
        console.log('Starting migration...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Add invite_token to expense_groups
        try {
            console.log("Attempting to add 'invite_token' to 'expense_groups'...");
            await connection.query(`
                ALTER TABLE expense_groups
                ADD COLUMN invite_token VARCHAR(64) UNIQUE DEFAULT NULL;
            `);
            console.log("✅ Added 'invite_token' column.");
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ 'invite_token' column already exists.");
            } else {
                throw error;
            }
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
