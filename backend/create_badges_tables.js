const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function createBadgesTables() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        console.log('Creating badges tables...\n');

        // Create badges table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS badges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(10),
                criteria_type VARCHAR(50),
                criteria_threshold INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_code (code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Badges table created');

        // Create user_badges table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_badges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                badge_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_badge (user_id, badge_id),
                INDEX idx_user_badges (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ User badges table created');

        // Insert sample badges
        const sampleBadges = [
            ['EARLY_BIRD', 'Early Bird', 'One of the first 100 users', '🐦', 'signup_count', 100],
            ['SAVER_BRONZE', 'Bronze Saver', 'Saved ₹10,000 in goals', '🥉', 'goal_amount', 10000],
            ['SAVER_SILVER', 'Silver Saver', 'Saved ₹50,000 in goals', '🥈', 'goal_amount', 50000],
            ['SAVER_GOLD', 'Gold Saver', 'Saved ₹100,000 in goals', '🥇', 'goal_amount', 100000],
            ['TRACKER_PRO', 'Tracker Pro', 'Logged 100 transactions', '📊', 'transaction_count', 100],
            ['BUDGET_MASTER', 'Budget Master', 'Created 10 budgets', '💰', 'budget_count', 10],
            ['SPLIT_EXPERT', 'Split Expert', 'Created 20 split requests', '🤝', 'split_count', 20],
            ['STREAK_WEEK', '7-Day Streak', 'Logged transactions for 7 consecutive days', '🔥', 'streak_days', 7],
            ['STREAK_MONTH', '30-Day Streak', 'Logged transactions for 30 consecutive days', '⭐', 'streak_days', 30]
        ];

        for (const badge of sampleBadges) {
            try {
                await connection.query(
                    'INSERT INTO badges (code, name, description, icon, criteria_type, criteria_threshold) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
                    badge
                );
            } catch (err) {
                // Ignore duplicate key errors
            }
        }
        console.log('✅ Sample badges inserted');

        // Show created badges
        const [badges] = await connection.query('SELECT * FROM badges');
        console.log(`\n📋 Total badges: ${badges.length}`);
        badges.forEach(b => {
            console.log(`   ${b.icon} ${b.name} (${b.code})`);
        });

        await connection.end();
        console.log('\n✅ All done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createBadgesTables();
