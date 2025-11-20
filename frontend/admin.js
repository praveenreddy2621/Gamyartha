// Admin Panel JavaScript
const API_BASE_URL = 'http://localhost:3001/api';
//const API_BASE_URL = `${window.ENV.BACKEND_API}/api`;


// Global state
let currentTab = 'dashboard';
let adminToken = localStorage.getItem('adminToken');
let adminUser = null;

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (adminToken) {
        // Try to validate token
        validateToken();
    } else {
        showLoginScreen();
    }

    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Other event listeners
    document.getElementById('refresh-users').addEventListener('click', loadUsers);
    document.getElementById('refresh-transactions').addEventListener('click', loadTransactions);
    document.getElementById('transaction-filter').addEventListener('change', loadTransactions);
});

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.user.is_admin) {
            adminToken = data.token;
            adminUser = data.user;
            localStorage.setItem('adminToken', adminToken);
            showAdminPanel();
            loadDashboard();
        } else {
            showAlert('Invalid admin credentials', 'error', 'login-alert');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login failed. Please try again.', 'error', 'login-alert');
    }
}

async function validateToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.user.is_admin) {
                adminUser = data.user;
                showAdminPanel();
                loadDashboard();
            } else {
                showLoginScreen();
            }
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Token validation error:', error);
        showLoginScreen();
    }
}

function handleLogout() {
    adminToken = null;
    adminUser = null;
    localStorage.removeItem('adminToken');
    showLoginScreen();
}

// UI functions
function showLoginScreen() {
    loadingScreen.classList.add('hidden');
    adminPanel.classList.add('hidden');
    loginScreen.classList.remove('hidden');
}

function showAdminPanel() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.add('hidden');
    adminPanel.classList.remove('hidden');

    document.getElementById('admin-info').textContent = `Welcome, ${adminUser.full_name || adminUser.email}`;
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('bg-slate-800');
        btn.classList.add('bg-indigo-600');
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('bg-indigo-600');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('bg-slate-800');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    document.getElementById(`${tabName}-tab`).classList.remove('hidden');

    currentTab = tabName;

    // Load tab data
    switch (tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
            case 'transactions':
            loadTransactions();
            break;
    }
}

function showAlert(message, type, containerId = 'alert-container') {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="alert alert-${type}">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
            ${message}
        </div>
    `;
    container.classList.remove('hidden');

    setTimeout(() => {
        container.classList.add('hidden');
    }, 5000);
}

// Dashboard functions
async function loadDashboard() {
    try {
        const [usersRes, transactionsRes, goalsRes, obligationsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${adminToken}` } }),
            fetch(`${API_BASE_URL}/transactions`, { headers: { 'Authorization': `Bearer ${adminToken}` } }),
            fetch(`${API_BASE_URL}/goals`, { headers: { 'Authorization': `Bearer ${adminToken}` } }),
            fetch(`${API_BASE_URL}/obligations`, { headers: { 'Authorization': `Bearer ${adminToken}` } })
        ]);

        const users = await usersRes.json();
        const transactions = await transactionsRes.json();
        const goals = await goalsRes.json();
        const obligations = await obligationsRes.json();

        // Update stats
        document.getElementById('total-users').textContent = users.users?.length || 0;
        document.getElementById('total-transactions').textContent = transactions.transactions?.length || 0;
        document.getElementById('active-goals').textContent = goals.goals?.length || 0;
        document.getElementById('pending-obligations').textContent = obligations.obligations?.filter(o => !o.is_paid).length || 0;

        // Load recent activity
        loadRecentActivity();

    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

async function loadRecentActivity() {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions?page=1&limit=5`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();
        const container = document.getElementById('recent-activity');

        if (data.transactions && data.transactions.length > 0) {
            container.innerHTML = data.transactions.map(transaction => `
                <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                        <p class="text-sm font-medium text-gray-800">${transaction.description}</p>
                        <p class="text-xs text-gray-500">${new Date(transaction.transaction_date).toLocaleDateString()}</p>
                    </div>
                    <span class="text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                        ${transaction.type === 'income' ? '+' : '-'}${transaction.amount}
                    </span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No recent activity</p>';
        }

    } catch (error) {
        console.error('Recent activity load error:', error);
        document.getElementById('recent-activity').innerHTML = '<p class="text-gray-500 text-center py-4">Failed to load recent activity</p>';
    }
}

// Users management
async function loadUsers() {
    const container = document.getElementById('users-table-container');
    container.innerHTML = '<div class="text-center py-8"><div class="loading-spinner"></div>Loading users...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (data.users && data.users.length > 0) {
            container.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.users.map(user => `
                                <tr>
                                    <td>${user.id}</td>
                                    <td>${user.full_name || 'N/A'}</td>
                                    <td>${user.email}</td>
                                    <td>
                                        <span class="status-badge ${user.email_verified ? 'status-active' : 'status-inactive'}">
                                            ${user.email_verified ? 'Verified' : 'Unverified'}
                                        </span>
                                    </td>
                                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button class="action-btn btn-primary mr-2" onclick="viewUser(${user.id})">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="action-btn ${user.is_admin ? 'btn-danger' : 'btn-success'}" onclick="toggleAdmin(${user.id}, ${user.is_admin})">
                                            <i class="fas ${user.is_admin ? 'fa-user-minus' : 'fa-user-plus'}"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No users found</p>';
        }

    } catch (error) {
        console.error('Users load error:', error);
        container.innerHTML = '<p class="text-red-500 text-center py-8">Failed to load users</p>';
    }
}

// Transactions management
async function loadTransactions() {
    const container = document.getElementById('transactions-table-container');
    const filter = document.getElementById('transaction-filter').value;

    container.innerHTML = '<div class="text-center py-8"><div class="loading-spinner"></div>Loading transactions...</div>';

    try {
        const url = filter ? `${API_BASE_URL}/transactions?type=${filter}&limit=100` : `${API_BASE_URL}/transactions?limit=100`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (data.transactions && data.transactions.length > 0) {
            container.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.transactions.map(transaction => `
                                <tr>
                                    <td>${transaction.id}</td>
                                    <td>User ${transaction.user_id}</td>
                                    <td>${transaction.description}</td>
                                    <td class="font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                        ${transaction.type === 'income' ? '+' : '-'}${transaction.amount}
                                    </td>
                                    <td>
                                        <span class="status-badge ${transaction.type === 'income' ? 'status-active' : 'status-inactive'}">
                                            ${transaction.type}
                                        </span>
                                    </td>
                                    <td>${transaction.category}</td>
                                    <td>${new Date(transaction.transaction_date).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No transactions found</p>';
        }

    } catch (error) {
        console.error('Transactions load error:', error);
        container.innerHTML = '<p class="text-red-500 text-center py-8">Failed to load transactions</p>';
    }
}



// Settings functions
function loadSettings() {
    // Load current settings from environment or local storage
    document.getElementById('email-user').value = localStorage.getItem('email-user') || '';
    document.getElementById('email-pass').value = localStorage.getItem('email-pass') || '';
    document.getElementById('db-host').value = localStorage.getItem('db-host') || 'localhost';
    document.getElementById('db-name').value = localStorage.getItem('db-name') || 'Gamyartha';
}

function saveSettings() {
    const emailUser = document.getElementById('email-user').value;
    const emailPass = document.getElementById('email-pass').value;
    const dbHost = document.getElementById('db-host').value;
    const dbName = document.getElementById('db-name').value;

    localStorage.setItem('email-user', emailUser);
    localStorage.setItem('email-pass', emailPass);
    localStorage.setItem('db-host', dbHost);
    localStorage.setItem('db-name', dbName);

    showAlert('Settings saved successfully!', 'success');
}

// Global functions for button clicks
window.viewUser = function(userId) {
    // TODO: Implement user details modal
    alert(`View user details for ID: ${userId}`);
};

window.toggleAdmin = async function(userId, isCurrentlyAdmin) {
    try {
        // This would require a new API endpoint to toggle admin status
        alert(`Toggle admin status for user ${userId} - Feature not implemented yet`);
    } catch (error) {
        console.error('Toggle admin error:', error);
        showAlert('Failed to update admin status', 'error');
    }
};
