const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function checkSplitStatus() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        console.log('Checking split requests and payments...\n');

        // Get all split requests
        const [splits] = await connection.query(`
            SELECT 
                sr.id,
                sr.description,
                sr.amount,
                sr.status,
                sr.requester_id,
                u.full_name as requester_name
            FROM split_requests sr
            JOIN users u ON sr.requester_id = u.id
            ORDER BY sr.created_at DESC
            LIMIT 5
        `);

        console.log('Recent Split Requests:');
        for (const split of splits) {
            console.log(`\n${split.id}. ${split.description} - ₹${split.amount}`);
            console.log(`   Status: ${split.status}`);
            console.log(`   Requester: ${split.requester_name}`);

            // Get participants
            const [participants] = await connection.query(`
                SELECT 
                    sp.id,
                    sp.amount_owed,
                    sp.amount_paid,
                    sp.status,
                    u.full_name,
                    u.email
                FROM split_participants sp
                JOIN users u ON sp.user_id = u.id
                WHERE sp.split_request_id = ?
            `, [split.id]);

            console.log('   Participants:');
            participants.forEach(p => {
                console.log(`   - ${p.full_name} (${p.email}): ₹${p.amount_owed} | Paid: ₹${p.amount_paid} | Status: ${p.status}`);
            });
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSplitStatus();
