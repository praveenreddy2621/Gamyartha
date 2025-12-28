const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function migrate() {
    console.log('Starting migration for category_rules table...');

    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const connection = await pool.getConnection();
        console.log('Connected to database.');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS category_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                keyword VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_keyword (user_id, keyword)
            )
        `);

        console.log('✅ category_rules table created/verified successfully.');
        connection.release();
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
