const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' }); // Adjusted path for script location

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root@123',
    database: process.env.DB_NAME || 'gamyartha'
};

async function seedChallenges() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const challenges = [
            {
                name: 'No Spend Weekend',
                description: 'Spend ₹0 on non-essential items this weekend!',
                start_date: new Date().toISOString().slice(0, 10),
                end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                target_category: 'shopping', // Lowercase to match ENUM
                winning_criteria: 'lowest_spend'
            },
            {
                name: 'Save ₹5000 Challenge',
                description: 'Save at least ₹5000 this month.',
                start_date: new Date().toISOString().slice(0, 10),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                target_category: 'total_spend', // Use valid ENUM
                winning_criteria: 'highest_saving' // Singular 'saving' to match ENUM
            },
            {
                name: 'Low Dining Out Week',
                description: 'Limit your dining out expenses to under ₹500 this week.',
                start_date: new Date().toISOString().slice(0, 10),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                target_category: 'dining', // Lowercase
                winning_criteria: 'lowest_spend' // Use valid criteria
            }
        ];

        console.log('Seeding challenges...');

        for (const c of challenges) {
            // Check if exists
            const [rows] = await connection.execute(
                'SELECT id FROM savings_challenges WHERE name = ?',
                [c.name]
            );

            if (rows.length === 0) {
                await connection.execute(
                    `INSERT INTO savings_challenges 
                    (name, description, start_date, end_date, target_category, winning_criteria, status, created_by_user_id) 
                    VALUES (?, ?, ?, ?, ?, ?, 'active', NULL)`,
                    [c.name, c.description, c.start_date, c.end_date, c.target_category, c.winning_criteria]
                );
                console.log(`✅ Added challenge: ${c.name}`);
            } else {
                console.log(`ℹ️ Challenge already exists: ${c.name}`);
            }
        }

        console.log('Challenge seeding completed.');

    } catch (error) {
        console.error('Error seeding challenges:', error);
    } finally {
        if (connection) await connection.end();
    }
}

seedChallenges();
