const fetch = require('node-fetch');

// Configuration
const API_BASE = 'http://localhost:3001/api';
const TEST_EMAIL = 'praveenreddy2621@gmail.com';
const TEST_PASSWORD = 'Praveen@1626';

async function testSplitsFeature() {
    console.log('🧪 Testing Splits Feature\n');

    try {
        // Step 1: Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.statusText}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log(`✅ Logged in as: ${loginData.user.full_name}`);
        console.log(`   User ID: ${loginData.user.id}\n`);

        // Step 2: Get groups
        console.log('2️⃣ Fetching groups...');
        const groupsResponse = await fetch(`${API_BASE}/groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!groupsResponse.ok) {
            throw new Error(`Failed to fetch groups: ${groupsResponse.statusText}`);
        }

        const groupsData = await groupsResponse.json();
        console.log(`✅ Found ${groupsData.groups.length} groups:`);
        groupsData.groups.forEach(g => {
            console.log(`   - ${g.group_name} (ID: ${g.id}, Members: ${g.member_count})`);
        });

        if (groupsData.groups.length === 0) {
            console.log('\n❌ No groups found. Please create a group first.');
            return;
        }

        // Use the first group (or Test Roommates if it exists)
        const testGroup = groupsData.groups.find(g => g.group_name === 'Test Roommates') || groupsData.groups[0];
        console.log(`\n📌 Using group: ${testGroup.group_name} (ID: ${testGroup.id})\n`);

        // Step 3: Get group members
        console.log('3️⃣ Fetching group members...');
        const membersResponse = await fetch(`${API_BASE}/groups/${testGroup.id}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!membersResponse.ok) {
            throw new Error(`Failed to fetch members: ${membersResponse.statusText}`);
        }

        const membersData = await membersResponse.json();
        console.log(`✅ Group has ${membersData.members.length} members:`);
        membersData.members.forEach(m => {
            console.log(`   - ${m.full_name} (${m.email})`);
        });

        // Step 4: Create a split request
        console.log('\n4️⃣ Creating split request...');
        const splitAmount = 1200;
        const participantCount = membersData.members.length;
        const amountPerPerson = splitAmount / participantCount;

        const participants = membersData.members.map(m => ({
            email: m.email,
            amount: amountPerPerson
        }));

        console.log(`   Total Amount: ₹${splitAmount}`);
        console.log(`   Split among: ${participantCount} people`);
        console.log(`   Amount per person: ₹${amountPerPerson.toFixed(2)}`);

        const splitResponse = await fetch(`${API_BASE}/splits/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                group_id: testGroup.id,
                amount: splitAmount,
                description: 'Dinner at restaurant - Test Split',
                split_method: 'equal',
                participants: JSON.stringify(participants)
            })
        });

        if (!splitResponse.ok) {
            const errorData = await splitResponse.json();
            throw new Error(`Failed to create split: ${errorData.message || splitResponse.statusText}`);
        }

        const splitData = await splitResponse.json();
        console.log(`✅ Split request created successfully!`);
        console.log(`   Split ID: ${splitData.split_request_id}`);
        console.log(`   Total Amount: ₹${splitData.amount}`);
        console.log(`   Participants: ${splitData.participants.length}\n`);

        // Step 5: Fetch all split requests
        console.log('5️⃣ Fetching all split requests...');
        const splitsListResponse = await fetch(`${API_BASE}/splits/request/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!splitsListResponse.ok) {
            throw new Error(`Failed to fetch splits: ${splitsListResponse.statusText}`);
        }

        const splitsListData = await splitsListResponse.json();
        console.log(`✅ Found ${splitsListData.requests.length} split requests:\n`);

        splitsListData.requests.forEach((split, index) => {
            console.log(`   ${index + 1}. ${split.description}`);
            console.log(`      Amount: ₹${split.amount}`);
            console.log(`      Status: ${split.status}`);
            console.log(`      Requester: ${split.requester_name}`);
            console.log(`      Group: ${split.group_name}`);
            console.log(`      Participants: ${split.participant_count} (Paid: ${split.paid_count})`);
            console.log(`      Created: ${new Date(split.created_at).toLocaleString()}\n`);
        });

        // Step 6: Get details of the newly created split
        console.log('6️⃣ Fetching split request details...');
        const splitDetailsResponse = await fetch(`${API_BASE}/splits/request/${splitData.split_request_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!splitDetailsResponse.ok) {
            throw new Error(`Failed to fetch split details: ${splitDetailsResponse.statusText}`);
        }

        const splitDetails = await splitDetailsResponse.json();
        console.log(`✅ Split Request Details:`);
        console.log(`   Description: ${splitDetails.description}`);
        console.log(`   Total Amount: ₹${splitDetails.amount}`);
        console.log(`   Split Method: ${splitDetails.split_method}`);
        console.log(`   Status: ${splitDetails.status}`);
        console.log(`\n   Participants:`);
        splitDetails.participants.forEach(p => {
            console.log(`   - ${p.full_name} (${p.email})`);
            console.log(`     Owed: ₹${p.amount_owed}, Paid: ₹${p.amount_paid || 0}, Status: ${p.status}`);
        });

        console.log('\n✅ All tests passed! Splits feature is working correctly.\n');

        // Summary
        console.log('📊 Test Summary:');
        console.log(`   ✅ Login successful`);
        console.log(`   ✅ Groups fetched (${groupsData.groups.length} groups)`);
        console.log(`   ✅ Group members fetched (${membersData.members.length} members)`);
        console.log(`   ✅ Split request created (ID: ${splitData.split_request_id})`);
        console.log(`   ✅ Split requests listed (${splitsListData.requests.length} total)`);
        console.log(`   ✅ Split details retrieved`);

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testSplitsFeature();
