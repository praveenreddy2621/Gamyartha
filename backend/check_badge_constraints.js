const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function checkBadgeConstraints() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Check foreign key constraints
        const [constraints] = await connection.query(`
            SELECT 
                CONSTRAINT_NAME,
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME,
                DELETE_RULE
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
            AND TABLE_NAME = 'user_badges'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        console.log('Foreign Key Constraints on user_badges table:\n');
        constraints.forEach(c => {
            console.log(`${c.CONSTRAINT_NAME}:`);
            console.log(`  ${c.TABLE_NAME}.${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`);
            console.log(`  ON DELETE: ${c.DELETE_RULE}\n`);
        });

        // Check if there are any orphaned user_badges
        const [orphaned] = await connection.query(`
            SELECT ub.* 
            FROM user_badges ub
            LEFT JOIN badges b ON ub.badge_id = b.id
            WHERE b.id IS NULL
        `);

        if (orphaned.length > 0) {
            console.log(`⚠️  Found ${orphaned.length} orphaned user_badges entries!`);
            console.log('These should have been deleted when the badge was removed.\n');

            // Clean them up
            await connection.query('DELETE FROM user_badges WHERE badge_id NOT IN (SELECT id FROM badges)');
            console.log('✅ Cleaned up orphaned entries');
        } else {
            console.log('✅ No orphaned user_badges entries found');
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkBadgeConstraints();
