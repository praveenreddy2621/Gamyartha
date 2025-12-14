const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function fixSplitStatuses() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        console.log('Fixing split request statuses...\n');

        // Get all split requests
        const [splits] = await connection.query(`
            SELECT id FROM split_requests WHERE status = 'pending'
        `);

        for (const split of splits) {
            // Check participant status
            const [statusRows] = await connection.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid
                FROM split_participants
                WHERE split_request_id = ?
            `, [split.id]);

            const { total, paid } = statusRows[0];
            const totalNum = Number(total);
            const paidNum = Number(paid);

            if (paidNum === totalNum && totalNum > 0) {
                await connection.query(
                    'UPDATE split_requests SET status = ? WHERE id = ?',
                    ['completed', split.id]
                );
                console.log(`✅ Split ${split.id}: ${paidNum}/${totalNum} paid → COMPLETED`);
            } else if (paidNum > 0) {
                await connection.query(
                    'UPDATE split_requests SET status = ? WHERE id = ?',
                    ['partially_paid', split.id]
                );
                console.log(`✅ Split ${split.id}: ${paidNum}/${totalNum} paid → PARTIALLY_PAID`);
            } else {
                console.log(`⏳ Split ${split.id}: ${paidNum}/${totalNum} paid → Still PENDING`);
            }
        }

        console.log('\n✅ Done! All split statuses have been fixed.');
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

fixSplitStatuses();
