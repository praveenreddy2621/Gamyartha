const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function cleanupOrphanedBadges() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        console.log('Checking for orphaned user_badges...\n');

        // Check if there are any orphaned user_badges
        const [orphaned] = await connection.query(`
            SELECT ub.id, ub.user_id, ub.badge_id
            FROM user_badges ub
            LEFT JOIN badges b ON ub.badge_id = b.id
            WHERE b.id IS NULL
        `);

        if (orphaned.length > 0) {
            console.log(`⚠️  Found ${orphaned.length} orphaned user_badges entries!`);
            orphaned.forEach(o => {
                console.log(`   - user_badges.id=${o.id}, badge_id=${o.badge_id} (badge deleted)`);
            });

            // Clean them up
            const [result] = await connection.query('DELETE FROM user_badges WHERE badge_id NOT IN (SELECT id FROM badges)');
            console.log(`\n✅ Cleaned up ${result.affectedRows} orphaned entries`);
        } else {
            console.log('✅ No orphaned user_badges entries found');
            console.log('   All user badges reference valid badges');
        }

        // Show current user_badges count
        const [count] = await connection.query('SELECT COUNT(*) as total FROM user_badges');
        console.log(`\n📊 Total user_badges: ${count[0].total}`);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

cleanupOrphanedBadges();
