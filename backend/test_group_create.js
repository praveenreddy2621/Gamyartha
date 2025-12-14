const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';
const CREATOR_EMAIL = 'test8048@example.com';
const PASSWORD = 'password123';
// The email from the error log, mixed case
const EXISTING_MEMBER_EMAIL_MIXED = 'Praveereddy0@gmail.com';

async function runtest() {
    try {
        console.log(`Using existing creator: ${CREATOR_EMAIL}`);

        // 1. Login Creator
        console.log('Logging in creator...');
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: CREATOR_EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
            console.error('Login failed:', loginData);
            return;
        }
        const authHeader = loginData.token;
        console.log('Logged in.');

        // 2. Create Group using MIXED CASE email
        console.log(`Creating group adding member: ${EXISTING_MEMBER_EMAIL_MIXED}`);

        const groupRes = await fetch(`${API_BASE_URL}/groups/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authHeader}`
            },
            body: JSON.stringify({
                group_name: 'Fix Verification Group ' + Date.now(),
                member_emails: [EXISTING_MEMBER_EMAIL_MIXED]
            })
        });

        const text = await groupRes.text();
        console.log('Create Group Response Status:', groupRes.status);
        try {
            console.log('Create Group Body:', JSON.parse(text));
        } catch (e) {
            console.log('Body:', text);
        }

    } catch (e) {
        console.error('Test failed:', e);
    }
}

runtest();
