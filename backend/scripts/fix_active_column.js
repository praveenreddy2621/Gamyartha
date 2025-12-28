require('dotenv').config(); // Load from current directory since we run from backend
console.log('DB_USER:', process.env.DB_USER); // Debug
console.log('DB_HOST:', process.env.DB_HOST);
const mysql = require('mysql2/promise');

async function migrate() {
    console.log('Starting migration to add last_active_at column...');

    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'gamyartha',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const connection = await pool.getConnection();
        console.log('Connected to database.');

        // Check if column exists
        const [rows] = await connection.query(`
            SELECT COUNT(*) AS count 
            FROM information_schema.columns 
            WHERE table_schema = ? 
            AND table_name = 'users' 
            AND column_name = 'last_active_at'
        `, [process.env.DB_NAME || 'gamyartha']);

        if (rows[0].count === 0) {
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('Successfully added last_active_at column.');
        } else {
            console.log('Column last_active_at already exists.');
        }

        connection.release();
    } catch (err) {
        console.error('Database connection failed:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

migrate();
