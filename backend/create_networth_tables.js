const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function createNetWorthTables() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        console.log('Creating assets table...\n');

        // Create assets table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS assets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                type ENUM('cash', 'investment', 'real_estate', 'vehicle', 'valuable', 'loan', 'credit_card', 'other_liability') NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                description TEXT,
                currency VARCHAR(3) DEFAULT 'INR',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_assets (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Assets table created');

        await connection.end();
        console.log('\n✅ All done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createNetWorthTables();
