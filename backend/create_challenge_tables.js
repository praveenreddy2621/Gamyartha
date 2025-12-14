const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dhan_sarthi',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function createSavingsChallengeTables() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Challenges Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS savings_challenges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                join_deadline DATE,
                target_category ENUM('total_spend', 'dining', 'shopping', 'entertainment', 'transport', 'groceries') DEFAULT 'total_spend',
                winning_criteria ENUM('lowest_spend', 'highest_saving') DEFAULT 'lowest_spend',
                created_by_user_id INT,
                status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ savings_challenges table created.');

        // 2. Challenge Participants Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS challenge_participants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                challenge_id INT NOT NULL,
                user_id INT NOT NULL,
                current_score DECIMAL(15, 2) DEFAULT 0.00,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (challenge_id) REFERENCES savings_challenges(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_participant (challenge_id, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ challenge_participants table created.');

        // 3. Challenge Leaderboard (Optional, can be calculated on fly, but good for caching history)
        // For now, we'll calculate dynamic leaderboards using SQL views or queries.

        // Insert some sample Public Challenges
        const [existing] = await connection.execute("SELECT COUNT(*) as count FROM savings_challenges WHERE name = 'December Saver'");
        if (existing[0].count === 0) {
            await connection.execute(`
                INSERT INTO savings_challenges (name, description, start_date, end_date, target_category, winning_criteria)
                VALUES 
                ('December Saver', 'End the year with extra savings! Minimize dining and shopping.', '2025-12-01', '2025-12-31', 'total_spend', 'lowest_spend'),
                ('New Year New You', 'Start 2026 with good habits. Strictly essentials only.', '2026-01-01', '2026-01-31', 'shopping', 'lowest_spend'),
                ('Foodie Fasting', 'Cook at home challenge for January.', '2026-01-15', '2026-02-15', 'dining', 'lowest_spend')
            `);
            console.log('✅ Sample challenges inserted.');
        }

    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        if (connection) await connection.end();
    }
}

createSavingsChallengeTables();
