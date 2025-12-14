/*
 * Copyright (c) 2025 Gamyartha. All rights reserved.
 */

const express = require('express');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fetch = require('node-fetch'); // Add this line to import node-fetch
const helmet = require('helmet'); // Security headers
const rateLimit = require('express-rate-limit'); // Rate limiting
const { initRedis } = require('./utils/redisClient');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // Renamed from Gamyartha to Gamyartha
    database: process.env.DB_NAME, // Renamed from Gamyartha to Gamyartha
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Gemini API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for now to allow inline scripts in frontend
}));

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased limit for dev usage
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Increased limit for testing
    message: 'Too many accounts created from this IP, please try again after an hour'
});

// Apply global rate limiter to all api routes
app.use('/api/', apiLimiter);
// Apply strict limiter to auth routes (we'll apply this specifically later or globally to /api/auth if strictly separated)

// CORS Configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:5500'], // Allow local dev
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Add pool to request object
app.use((req, res, next) => {
    req.pool = pool;
    next();
});

// Initialize service classes
const BudgetService = require('./services/BudgetService');
const AIReportService = require('./services/AIReportService');
const GamificationService = require('./services/GamificationService');
const RecurringTransactionService = require('./services/RecurringTransactionService');

// Routes
const splitsRouter = require('./routes/splits');
const notificationsRouter = require('./routes/notifications'); // Import notifications router
const groupsRouter = require('./routes/groups');
const budgetsRouter = require('./routes/budgets'); // Import budgets router
const adminRouter = require('./routes/admin'); // Import admin router
const netWorthRouter = require('./routes/networth');
const challengesRouter = require('./routes/challenges');

app.use('/api/splits', splitsRouter);
app.use('/api/notifications', notificationsRouter); // Use notifications router
app.use('/api/networth', netWorthRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/groups', groupsRouter); // Use groups router
app.use('/api/budgets', budgetsRouter); // Use budgets router
app.use('/api/admin', adminRouter); // Use admin router

console.log('✅ API routes (/api/splits, /api/notifications, /api/groups, /api/budgets) have been mounted.');

// Initialize mailer utility
const mailerUtils = require('./utils/mailer.js');

// Import the authentication middleware
const authenticateToken = require('./middleware/auth');

// Initialize AI Report Service
// Initialize Services
const aiReportService = new AIReportService(pool);
const gamificationService = new GamificationService(pool);
const recurringTransactionService = new RecurringTransactionService(pool);

// Database initialization
async function initializeDatabase() {
    try {
        // Create database if it doesn't exist
        const tempConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        await tempConnection.execute('CREATE DATABASE IF NOT EXISTS gamyartha');
        await tempConnection.end();

        // Create tables
        const dbConnection = await pool.getConnection();

        // Users table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                email_verified BOOLEAN DEFAULT FALSE,
                email_alerts_enabled BOOLEAN DEFAULT TRUE,
                currency VARCHAR(3) DEFAULT 'INR',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Admins table (separate from users for better security)
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                permissions JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Transactions table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                is_business BOOLEAN DEFAULT FALSE,
                gst_amount DECIMAL(10,2) DEFAULT 0,
                currency VARCHAR(3) DEFAULT 'INR',
                transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_date (user_id, transaction_date),
                INDEX idx_category (category)
            )
        `);

        // Budgets table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS budgets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category VARCHAR(100) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                month_year VARCHAR(7) NOT NULL,
                currency VARCHAR(3) DEFAULT 'INR',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_category_month (user_id, category, month_year),
                INDEX idx_user_month (user_id, month_year)
            )
        `);

        // Goals table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS goals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                target_amount DECIMAL(15,2) NOT NULL,
                saved_amount DECIMAL(15,2) DEFAULT 0,
                target_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_target (user_id, target_date)
            )
        `);

        // Obligations table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS obligations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                description TEXT NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                due_date DATE NOT NULL,
                is_paid BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_due (user_id, due_date)
            )
        `);

        // Password reset codes table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS password_reset_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                reset_code VARCHAR(10) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_code (reset_code),
                INDEX idx_expires (expires_at)
            )
        `);

        // Chat history table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                role ENUM('user', 'model') NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_time (user_id, created_at)
            )
        `);

        // Settings table for user preferences
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                setting_key VARCHAR(100) NOT NULL,
                setting_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_setting (user_id, setting_key)
            )
        `);

        // Groups table for split expenses
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS expense_groups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                group_name VARCHAR(255) NOT NULL,
                created_by_user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Group members table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS group_members (
                id INT AUTO_INCREMENT PRIMARY KEY,
                group_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_group_member (group_id, user_id)
            )
        `);

        // Group balances table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS group_balances (
                id INT AUTO_INCREMENT PRIMARY KEY,
                group_id INT NOT NULL,
                user_id INT NOT NULL,
                net_balance DECIMAL(10, 2) DEFAULT 0.00,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_group_balance (group_id, user_id)
            )
        `);

        // Split requests table (like GPay's split request feature)
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS split_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                requester_id INT NOT NULL,
                group_id INT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                description TEXT,
                bill_image_url VARCHAR(255),
                split_method ENUM('equal', 'percentage', 'exact') DEFAULT 'equal',
                status ENUM('pending', 'partially_paid', 'completed', 'cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NULL
            )
        `);

        // Group expenses table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS group_expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                group_id INT NOT NULL,
                split_request_id INT NULL,
                paid_by_user_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                description TEXT,
                category VARCHAR(50),
                split_method ENUM('equal', 'percentage', 'exact', 'settlement') DEFAULT 'equal',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
                FOREIGN KEY (split_request_id) REFERENCES split_requests(id) ON DELETE CASCADE,
                FOREIGN KEY (paid_by_user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Recurring Transactions table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS recurring_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
                start_date DATE NOT NULL,
                next_due_date DATE NOT NULL,
                last_processed_date DATE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_next_due (next_due_date, is_active)
            )
        `);

        // Badges table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS badges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                icon VARCHAR(20) NOT NULL,
                criteria_type VARCHAR(50) NOT NULL,
                criteria_threshold DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // User Badges table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS user_badges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                badge_id INT NOT NULL,
                awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_viewed BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_badge (user_id, badge_id)
            )
        `);

        // Ensure the group_expenses.split_method ENUM includes 'settlement'
        await dbConnection.execute(`
            ALTER TABLE group_expenses
            MODIFY COLUMN split_method ENUM('equal', 'percentage', 'exact', 'settlement') DEFAULT 'equal'
        `);

        // Add currency column to transactions table if it doesn't exist
        try {
            await dbConnection.execute(`
                ALTER TABLE transactions
                ADD COLUMN currency VARCHAR(3) DEFAULT 'INR'
            `);
        } catch (error) {
            if (!error.message.includes('Duplicate column name')) {
                throw error;
            }
        }

        // Add currency column to budgets table if it doesn't exist
        try {
            await dbConnection.execute(`
                ALTER TABLE budgets
                ADD COLUMN currency VARCHAR(3) DEFAULT 'INR'
            `);
        } catch (error) {
            if (!error.message.includes('Duplicate column name')) {
                throw error;
            }
        }

        // Create default admin user if it doesn't exist
        const defaultAdminEmail = 'praveenreddy2621@gmail.com';
        const defaultAdminPassword = 'Praveen@1626';
        const defaultAdminName = 'Praveen Reddy';

        const [existingAdmin] = await dbConnection.execute(
            'SELECT id, is_admin FROM users WHERE email = ?',
            [defaultAdminEmail]
        );

        if (existingAdmin.length === 0) {
            // Hash the default password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(defaultAdminPassword, saltRounds);

            // Create the default admin user
            const [adminResult] = await dbConnection.execute(
                'INSERT INTO users (email, password_hash, full_name, is_admin, email_verified) VALUES (?, ?, ?, TRUE, TRUE)',
                [defaultAdminEmail, hashedPassword, defaultAdminName]
            );

            // Create admin permissions entry
            await dbConnection.execute(
                'INSERT INTO admins (user_id, permissions) VALUES (?, ?)',
                [adminResult.insertId, JSON.stringify(['all'])]
            );

            console.log('Default admin user created successfully');
        } else if (!existingAdmin[0].is_admin) {
            // User exists but isn't admin - upgrade them
            await dbConnection.execute(
                'UPDATE users SET is_admin = TRUE WHERE id = ?',
                [existingAdmin[0].id]
            );
            // Create admin permissions entry if missing
            await dbConnection.execute(
                'INSERT IGNORE INTO admins (user_id, permissions) VALUES (?, ?)',
                [existingAdmin[0].id, JSON.stringify(['all'])]
            );
            console.log('Existing user upgraded to Admin');
        }

        // Insert default badges if they don't exist
        const defaultBadges = [
            { code: 'FIRST_LOGIN', name: 'Welcome Aboard', description: 'Joined DhanSarthi', icon: '🚀', type: 'login_count', threshold: 1 },
            { code: 'FIRST_BUDGET', name: 'Planner', description: 'Created your first budget', icon: '📅', type: 'budget_count', threshold: 1 },
            { code: 'SAVER_BRONZE', name: 'Bronze Saver', description: 'Saved ₹1,000 in goals', icon: '🥉', type: 'total_saved', threshold: 1000 },
            { code: 'SAVER_SILVER', name: 'Silver Saver', description: 'Saved ₹10,000 in goals', icon: '🥈', type: 'total_saved', threshold: 10000 },
            { code: 'SAVER_GOLD', name: 'Gold Saver', description: 'Saved ₹1,00,000 in goals', icon: '🥇', type: 'total_saved', threshold: 100000 },
            { code: 'STREAK_7', name: 'Week Warrior', description: 'Logged in 7 days in a row', icon: '🔥', type: 'login_streak', threshold: 7 },
            { code: 'DEBT_FREE', name: 'Debt Destroyer', description: 'Paid off an obligation', icon: '💸', type: 'obligation_paid', threshold: 1 }
        ];

        for (const badge of defaultBadges) {
            await dbConnection.execute(
                `INSERT IGNORE INTO badges (code, name, description, icon, criteria_type, criteria_threshold) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [badge.code, badge.name, badge.description, badge.icon, badge.type, badge.threshold]
            );
        }

        dbConnection.release();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// User registration (This section was previously inside the AI report route's 'try' block)
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const connection = await pool.getConnection();

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            connection.release();
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const [result] = await connection.execute(
            'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
            [email, passwordHash, full_name || email.split('@')[0]]
        );

        const userId = result.insertId;

        // Check if this is the first user (make them admin)
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        if (userCount[0].count === 1) {
            await connection.execute(
                'INSERT INTO admins (user_id, permissions) VALUES (?, ?)',
                [userId, JSON.stringify(['all'])]
            );
            await connection.execute(
                'UPDATE users SET is_admin = TRUE WHERE id = ?',
                [userId]
            );
        }

        connection.release();

        // Send welcome email
        try {
            await mailerUtils.sendEmail('welcome', { to_email: email, user_name: full_name || email.split('@')[0] });
        } catch (emailError) {
            console.error('Welcome email failed:', emailError);
        }

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: userId, email, full_name: full_name || email.split('@')[0] }
        });

        // Award badge for joining
        gamificationService.checkAndAwardBadges(userId, 'first_login', 1).catch(console.error);


    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const connection = await pool.getConnection();
        const [users] = await connection.execute(
            'SELECT id, email, password_hash, full_name, is_admin FROM users WHERE email = ?',
            [email]
        );
        connection.release();

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                is_admin: user.is_admin // Include admin status in token
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Check for obligations due today and send alerts if enabled
        if (user.email_alerts_enabled) {
            try {
                const [dueObligations] = await connection.execute(
                    'SELECT description, amount, due_date FROM obligations WHERE user_id = ? AND due_date = CURDATE() AND is_paid = FALSE',
                    [user.id]
                );

                for (const obligation of dueObligations) {
                    await mailerUtils.sendEmail('dueDateAlert', {
                        to_email: user.email,
                        user_name: user.full_name || user.email.split('@')[0],
                        description: obligation.description,
                        amount: obligation.amount,
                        dueDate: obligation.due_date
                    });
                }
            } catch (alertError) {
                console.error('Login obligation alert failed:', alertError);
                // Don't fail login due to alert error
            }
        }

        connection.release();

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                is_admin: user.is_admin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Password reset request
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const connection = await pool.getConnection();
        const [users] = await connection.execute(
            'SELECT id, full_name FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Generate reset code
        const resetCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Save reset code
        await connection.execute(
            'INSERT INTO password_reset_codes (user_id, reset_code, expires_at) VALUES (?, ?, ?)',
            [user.id, resetCode, expiresAt]
        );

        connection.release();

        // Send password reset email using the mailer utility
        const mailResult = await mailerUtils.sendEmail('passwordReset', {
            to_email: email,
            user_name: user.full_name || email.split('@')[0],
            reset_code: resetCode // Pass the generated code to the mailer
        });

        // In development, include the reset code in response
        if (process.env.NODE_ENV === 'development') {
            res.json({
                message: 'Password reset code sent successfully',
                resetCode: resetCode // Send the code that was saved to the DB
            });
        } else {
            res.json({ message: 'Password reset code sent successfully' });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to send reset code' });
    }
});

// Verify reset code and update password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, reset_code, new_password } = req.body;

        if (!email || !reset_code || !new_password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const connection = await pool.getConnection();

        // Find user
        const [users] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = users[0].id;

        // Find valid reset code
        const [codes] = await connection.execute(
            'SELECT id FROM password_reset_codes WHERE user_id = ? AND reset_code = ? AND expires_at > NOW() AND used = FALSE',
            [userId, reset_code]
        );

        if (codes.length === 0) {
            connection.release();
            return res.status(400).json({ error: 'Invalid or expired reset code' });
        }

        // Hash new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(new_password, saltRounds);

        // Update password
        await connection.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, userId]
        );

        // Mark code as used
        await connection.execute(
            'UPDATE password_reset_codes SET used = TRUE WHERE id = ?',
            [codes[0].id]
        );

        connection.release();

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [users] = await connection.execute(
            'SELECT id, email, full_name, is_admin, email_verified, email_alerts_enabled, currency, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch user's badges (if table exists)
        let badges = [];
        try {
            const [badgeResults] = await connection.execute(`
                SELECT b.id, b.code, b.name, b.description, b.icon
                FROM user_badges ub
                JOIN badges b ON ub.badge_id = b.id
                WHERE ub.user_id = ?
            `, [req.user.id]);
            badges = badgeResults;
        } catch (badgeError) {
            // Badges table doesn't exist or other error, just return empty array
            console.log('Badges not available:', badgeError.message);
        }

        connection.release();

        // Get current mode and group (using aiReportService which should be available in scope)
        // If aiReportService is not defined in this scope, we instantiate it
        // Assuming aiReportService is defined globally as seen in chat query route
        let currentMode = 'private';
        let currentGroup = null;
        try {
            currentMode = await aiReportService.getCurrentMode(req.user.id);
            currentGroup = await aiReportService.getCurrentGroup(req.user.id);
        } catch (e) {
            console.log("Error fetching user settings", e);
        }

        res.json({
            user: {
                ...users[0],
                current_mode: currentMode,
                current_group: currentGroup
            },
            badges: badges,
            geminiApiKey: GEMINI_API_KEY
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Get all users (for selection in splits/groups)
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        // Select all users except the one making the request
        const [users] = await connection.execute(
            'SELECT id, email, full_name FROM users WHERE id != ? ORDER BY full_name ASC',
            [req.user.id]
        );
        connection.release();

        res.json({ users });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { full_name, email_alerts_enabled, currency } = req.body;

        const connection = await pool.getConnection();
        await connection.execute(
            'UPDATE users SET full_name = ?, email_alerts_enabled = ?, currency = ? WHERE id = ?',
            [full_name, email_alerts_enabled, currency, req.user.id]
        );
        connection.release();

        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Delete user account
app.delete('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { email_confirmation } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email; // From token

        // Basic verification
        if (email_confirmation !== userEmail) {
            return res.status(400).json({ error: 'Email confirmation does not match.' });
        }

        const connection = await pool.getConnection();

        // Delete user (Cascading delete handles related data)
        const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ message: 'Account deleted successfully.' });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account.' });
    }
});

// Get transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Ensure all parameters are valid numbers or null
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 50);
        const offset = (page - 1) * limit;
        const { type, category } = req.query;

        const connection = await pool.getConnection();

        let query = 'SELECT * FROM transactions WHERE user_id = ?';
        let params = [req.user.id];

        if (type && ['income', 'expense'].includes(type)) {
            query += ' AND type = ?';
            params.push(type);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        // Use template literals for LIMIT and OFFSET instead of placeholders
        query += ` ORDER BY transaction_date DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [transactions] = await connection.execute(query, params);
        connection.release();

        res.json({ transactions });

    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

// Add transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { amount, description, category, type, is_business, gst_amount } = req.body;

        if (!amount || !description || !category || !type) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        // Check budget before adding transaction (only for expenses)
        let budgetWarning = null;
        if (type === 'expense') {
            const budgetService = new BudgetService(pool);
            const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            budgetWarning = await budgetService.checkBudgetExceeded(
                req.user.id,
                category,
                amount,
                currentDate
            );
        }

        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO transactions (user_id, amount, description, category, type, is_business, gst_amount, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, amount, description, category, type, is_business || false, gst_amount || 0, req.user.currency || 'INR']
        );

        // Fetch user details for email notification
        const [userRows] = await connection.execute(
            'SELECT email, full_name, email_alerts_enabled FROM users WHERE id = ?',
            [req.user.id]
        );
        connection.release();

        const response = {
            message: 'Transaction added successfully',
            transactionId: result.insertId
        };

        if (budgetWarning) {
            response.warning = budgetWarning.warning;
            response.budgetDetails = {
                budgetAmount: budgetWarning.budgetAmount,
                spentAmount: budgetWarning.spentAmount
            };

            // Send budget exceeded email if alerts are enabled
            if (userRows.length > 0 && userRows[0].email_alerts_enabled) {
                const user = userRows[0];
                try {
                    await mailerUtils.sendEmail('budgetExceeded', {
                        to_email: user.email,
                        user_name: user.full_name || user.email.split('@')[0],
                        category: category,
                        budgetAmount: budgetWarning.budgetAmount,
                        spentAmount: budgetWarning.spentAmount
                    });
                } catch (emailError) {
                    console.error('Budget exceeded email failed:', emailError);
                }
            }
        }

        res.status(201).json(response);

    } catch (error) {
        console.error('Add transaction error:', error);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Clear all transactions
app.delete('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.execute(
            'DELETE FROM transactions WHERE user_id = ?',
            [req.user.id]
        );
        connection.release();

        res.json({ message: 'All transactions cleared successfully' });
    } catch (error) {
        console.error('Clear transactions error:', error);
        res.status(500).json({ error: 'Failed to clear transactions' });
    }
});

// Get goals
app.get('/api/goals', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [goals] = await connection.execute(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY target_date ASC',
            [req.user.id]
        );
        connection.release();

        res.json({ goals });

    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Failed to get goals' });
    }
});

// Add goal
app.post('/api/goals', authenticateToken, async (req, res) => {
    try {
        const { name, target_amount, target_date } = req.body;

        if (!name || !target_amount || !target_date) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO goals (user_id, name, target_amount, target_date) VALUES (?, ?, ?, ?)',
            [req.user.id, name, target_amount, target_date]
        );
        connection.release();

        res.status(201).json({
            message: 'Goal added successfully',
            goalId: result.insertId
        });

    } catch (error) {
        console.error('Add goal error:', error);
        res.status(500).json({ error: 'Failed to add goal' });
    }
});

// Update goal progress
app.put('/api/goals/:id/progress', authenticateToken, async (req, res) => {
    try {
        const { saved_amount } = req.body;
        const goalId = req.params.id;

        const connection = await pool.getConnection();
        await connection.execute(
            'UPDATE goals SET saved_amount = ? WHERE id = ? AND user_id = ?',
            [saved_amount, goalId, req.user.id]
        );
        connection.release();

        res.json({ message: 'Goal progress updated' });

        // Check for saver badges
        const newBadges = await gamificationService.checkAndAwardBadges(req.user.id, 'total_saved');
        if (newBadges.length > 0) {
            // Can optionally send this back to frontend to show a popup
            console.log(`User ${req.user.id} earned badges:`, newBadges.map(b => b.name));
        }

    } catch (error) {
        console.error('Update goal progress error:', error);
        res.status(500).json({ error: 'Failed to update goal progress' });
    }
});

// Delete a goal
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM goals WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

// Update a goal
app.put('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        const { name, target_amount, target_date } = req.body;
        const connection = await pool.getConnection();
        await connection.execute(
            'UPDATE goals SET name = ?, target_amount = ?, target_date = ? WHERE id = ? AND user_id = ?',
            [name, target_amount, target_date, req.params.id, req.user.id]
        );
        connection.release();

        res.json({ message: 'Goal updated successfully' });
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

// Get obligations
app.get('/api/obligations', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [obligations] = await connection.execute(
            'SELECT * FROM obligations WHERE user_id = ? ORDER BY due_date ASC',
            [req.user.id]
        );
        connection.release();

        res.json({ obligations });

    } catch (error) {
        console.error('Get obligations error:', error);
        res.status(500).json({ error: 'Failed to get obligations' });
    }
});

// Add obligation
app.post('/api/obligations', authenticateToken, async (req, res) => {
    try {
        const { description, amount, due_date } = req.body;

        if (!description || !amount || !due_date) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO obligations (user_id, description, amount, due_date) VALUES (?, ?, ?, ?)',
            [req.user.id, description, amount, due_date]
        );

        // Fetch user details for email notification
        const [userRows] = await connection.execute(
            'SELECT email, full_name, email_alerts_enabled FROM users WHERE id = ?',
            [req.user.id]
        );
        connection.release();

        // After creating obligation
        const today = new Date().toISOString().split('T')[0];

        if (due_date === today && userRows[0].email_alerts_enabled) {
            try {
                await mailerUtils.sendEmail('dueDateAlert', {
                    to_email: userRows[0].email,
                    user_name: userRows[0].full_name,
                    description,
                    amount,
                    dueDate: due_date
                });
            } catch (e) {
                console.error('Immediate obligation alert failed:', e);
            }
        }

        res.status(201).json({
            message: 'Obligation added successfully',
            obligationId: result.insertId
        });

    } catch (error) {
        console.error('Add obligation error:', error);
        res.status(500).json({ error: 'Failed to add obligation' });
    }
});

// Mark obligation as paid
app.put('/api/obligations/:id/pay', authenticateToken, async (req, res) => {
    try {
        const obligationId = req.params.id;

        const connection = await pool.getConnection();
        await connection.execute(
            'UPDATE obligations SET is_paid = TRUE WHERE id = ? AND user_id = ?',
            [obligationId, req.user.id]
        );
        connection.release();

        res.json({ message: 'Obligation marked as paid' });

        // Check for debt destroyer badge
        gamificationService.checkAndAwardBadges(req.user.id, 'obligation_paid').catch(console.error);

    } catch (error) {
        console.error('Mark obligation paid error:', error);
        res.status(500).json({ error: 'Failed to mark obligation as paid' });
    }
});
// Delete obligation
app.delete('/api/obligations/:id', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM obligations WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Obligation not found' });
        }

        res.json({ message: 'Obligation deleted successfully' });
    } catch (error) {
        console.error('Delete obligation error:', error);
        res.status(500).json({ error: 'Failed to delete obligation' });
    }
});

// Clear all obligations
app.delete('/api/obligations', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.execute(
            'DELETE FROM obligations WHERE user_id = ?',
            [req.user.id]
        );
        connection.release();

        res.json({ message: 'All obligations cleared successfully' });
    } catch (error) {
        console.error('Clear obligations error:', error);
        res.status(500).json({ error: 'Failed to clear obligations' });
    }
});

// Get chat history
app.get('/api/chat/history', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [messages] = await connection.execute(
            'SELECT role, message, created_at FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        connection.release();

        res.json({ messages: messages.reverse() });

    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Failed to get chat history' });
    }
});

// Save chat message
app.post('/api/chat/message', authenticateToken, async (req, res) => {
    try {
        const { role, message } = req.body;

        const connection = await pool.getConnection();
        await connection.execute(
            'INSERT INTO chat_history (user_id, role, message) VALUES (?, ?, ?)',
            [req.user.id, role, message]
        );
        connection.release();

        res.status(201).json({ message: 'Chat message saved' });

    } catch (error) {
        console.error('Save chat message error:', error);
        res.status(500).json({ error: 'Failed to save chat message' });
    }
});

// Handle chat queries, including special commands
app.post('/api/chat/query', authenticateToken, async (req, res) => {
    const { message, history, language } = req.body;

    if (message.trim() === '/suggest_budget') {
        try {
            const connection = await pool.getConnection();

            // 1. Fetch last 60 days of expense transactions
            const [transactions] = await connection.execute(
                `SELECT category, SUM(amount) as total_amount, COUNT(DISTINCT DATE_FORMAT(transaction_date, '%Y-%m')) as month_count
                 FROM transactions
                 WHERE user_id = ? AND type = 'expense' AND transaction_date >= DATE_SUB(NOW(), INTERVAL 60 DAY)
                 GROUP BY category`,
                [req.user.id]
            );
            connection.release();

            if (transactions.length === 0) {
                return res.json({
                    text: "I couldn't find enough transaction data from the last 60 days to suggest a budget. Please add more expenses and try again!"
                });
            }

            // 2. Compute monthly average spending
            const monthlyAverages = transactions.map(t => ({
                category: t.category,
                monthlyAvg: parseFloat(t.total_amount) / (t.month_count > 0 ? t.month_count : 1)
            }));

            // 3. Prepare prompt for Gemini
            const geminiPrompt = `
You are a financial advisor helping a user create realistic monthly budgets based on their spending patterns.

Analyze this user's average monthly spending over the last 60 days and suggest appropriate monthly budgets for each category.

Guidelines:
- For categories with high spending, suggest reducing by 10-30% to encourage better financial habits
- For essential categories (like bills, groceries, transport), suggest amounts close to current spending but rounded nicely
- For discretionary categories (like entertainment, dining out), suggest lower amounts to promote saving
- Round all suggestions to clean numbers (nearest 50, 100, or 500 depending on amount size)
- Use the user's currency symbol: ${req.user.currency || 'INR'}

Format your response as conversational text like this example:

Based on your spending patterns, here are my budget suggestions:

• Bills → ₹2,500/month (keeping it realistic for essentials)
• Food & Dining → ₹8,000/month (consider reducing dining out)
• Groceries → ₹3,000/month
• Transport → ₹1,500/month
• Entertainment → ₹1,000/month (cut back on non-essentials)

Spending Data: ${JSON.stringify(monthlyAverages)}

Provide specific, actionable advice for each category.
`;


            // 4. Call Gemini API
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: geminiPrompt }] }]
                })
            });

            if (!geminiResponse.ok) {
                throw new Error(`Gemini API error: ${geminiResponse.status}`);
            }

            const result = await geminiResponse.json();
            const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            // 5. Return the structured JSON to the frontend
            return res.json({ text: aiText });

        } catch (error) {
            console.error('Error in /suggest_budget command:', error);
            return res.status(500).json({ error: 'Failed to generate budget suggestions.' });
        }
    }

    // --- NEW: AI-powered chat with mode awareness using AIReportService ---
    try {
        const userId = req.user.id;

        // 1. Detect and handle explicit mode switches
        const detectedMode = aiReportService.detectModeSwitch(message);
        if (detectedMode) {
            await aiReportService.setCurrentMode(userId, detectedMode);
            const modeName = detectedMode === 'shared' ? 'SHARED LEDGER MODE' : 'PRIVATE MODE';
            const announcement = `✅ switched to ${modeName}`;
            return res.json({ text: announcement });
        }

        // 2. Get the user's current mode
        const currentMode = await aiReportService.getCurrentMode(userId);

        let systemPrompt;
        let contextData = {};

        // 3. Fetch data and generate prompt based on the mode
        if (currentMode === 'shared') {
            const groupId = await aiReportService.getCurrentGroup(userId);
            if (!groupId) {
                const userGroups = await aiReportService.getUserGroups(userId);
                if (userGroups.length > 0) {
                    const groupList = userGroups.map(g => `• ${g.group_name} (ID: ${g.id})`).join('\n');
                    const responseText = `Which group? Give me group name or ID.\n\nYour groups:\n${groupList}`;
                    return res.json({ text: responseText });
                } else {
                    return res.json({ text: "No groups found. Create one from Profile section." });
                }
            }
            contextData = await aiReportService.getSharedData(groupId);
            systemPrompt = aiReportService.generateSystemPrompt('shared', language, contextData);
        } else { // Private mode
            contextData = await aiReportService.getPrivateData(userId);
            const privateDataString = `
Recent Transactions: ${JSON.stringify(contextData.transactions)}
Current Budgets: ${JSON.stringify(contextData.budgets)}
Active Goals: ${JSON.stringify(contextData.goals)}
            `;
            systemPrompt = aiReportService.generateSystemPrompt('private', language);
            // Append data to the user's message for context
            const lastMessage = history[history.length - 1];
            lastMessage.text = `${lastMessage.text}\n\n[My Financial Data for Context]\n${privateDataString}`;
        }

        // 4. Prepare payload for Gemini API
        const payload = {
            contents: history.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            })),
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        // 5. Call Gemini API
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }

        const result = await geminiResponse.json();
        const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";

        // 6. Return the response
        res.json({ text: aiText });
    } catch (error) {
        console.error('Chatbot query error:', error);
        res.status(500).json({ error: "I'm having trouble connecting to my brain right now. Please try again later." });
    }
});


app.post('/api/user/settings', authenticateToken, async (req, res) => {
    try {
        const { key, value } = req.body;
        let result = false;

        if (key === 'current_mode') {
            result = await aiReportService.setCurrentMode(req.user.id, value);
        } else if (key === 'current_group') {
            result = await aiReportService.setCurrentGroup(req.user.id, value);
        } else {
            // Generic setting fallback if generic method exists, or just log error
            console.warn(`Attempt to set unknown setting: ${key}`);
            return res.status(400).json({ error: 'Invalid setting key' });
        }

        if (result) {
            res.json({ message: `Setting '${key}' updated successfully.` });
        } else {
            res.status(500).json({ error: 'Failed to update setting.' });
        }
    } catch (error) {
        console.error('Set user setting error:', error);
        res.status(500).json({ error: 'Failed to update setting.' });
    }
});

// Admin routes
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        // Check for admin status
        if (!req.user.is_admin) {
            console.log('Admin access denied for user:', req.user);
            return res.status(403).json({ error: 'Admin access required' });
        }

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) throw new Error(`API error: ${geminiResponse.status}`);
        const connection = await pool.getConnection();
        const [users] = await connection.execute(
            'SELECT id, email, full_name, is_admin, email_verified, created_at FROM users ORDER BY created_at DESC'
        );
        connection.release();

        res.json({ users });

    } catch (error) {
        console.error('Get admin users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Email routes (keeping existing functionality)
app.post('/api/send-email', async (req, res) => {
    try {
        const { type, ...emailData } = req.body;

        await mailerUtils.sendEmail(type, emailData);

        res.json({ success: true, message: 'Email sent successfully' });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
});

// --- NEW FEATURES ROUTES ---

// Gamification: Get Badges
app.get('/api/badges', authenticateToken, async (req, res) => {
    try {
        const badges = await gamificationService.getUserBadges(req.user.id);
        res.json({ badges });
    } catch (error) {
        console.error('Get badges error:', error);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
});

// Recurring Transactions: Create
app.post('/api/recurring', authenticateToken, async (req, res) => {
    try {
        const result = await recurringTransactionService.createRecurringTransaction(req.user.id, req.body);
        res.status(201).json({ message: 'Recurring transaction created', id: result });
    } catch (error) {
        console.error('Create recurring error:', error);
        res.status(500).json({ error: 'Failed to create recurring transaction' });
    }
});

// Recurring Transactions: Get All
app.get('/api/recurring', authenticateToken, async (req, res) => {
    try {
        const txns = await recurringTransactionService.getRecurringTransactions(req.user.id);
        res.json({ recurring_transactions: txns });
    } catch (error) {
        console.error('Get recurring error:', error);
        res.status(500).json({ error: 'Failed to fetch recurring transactions' });
    }
});
// Recurring Transactions: Update
app.put('/api/recurring/:id', authenticateToken, async (req, res) => {
    try {
        const success = await recurringTransactionService.updateRecurringTransaction(req.user.id, req.params.id, req.body);
        if (success) {
            res.json({ message: 'Recurring transaction updated' });
        } else {
            res.status(404).json({ error: 'Transaction not found or unauthorized' });
        }
    } catch (error) {
        console.error('Update recurring error:', error);
        res.status(500).json({ error: 'Failed to update recurring transaction' });
    }
});

// Recurring Transactions: Delete
app.delete('/api/recurring/:id', authenticateToken, async (req, res) => {
    try {
        const success = await recurringTransactionService.deleteRecurringTransaction(req.user.id, req.params.id);
        if (success) {
            res.json({ message: 'Recurring transaction deleted' });
        } else {
            res.status(404).json({ error: 'Transaction not found or unauthorized' });
        }
    } catch (error) {
        console.error('Delete recurring error:', error);
        res.status(500).json({ error: 'Failed to delete recurring transaction' });
    }
});

// Recurring Transactions: Mark as Paid (for manual subscriptions)
app.post('/api/recurring/:id/mark-paid', authenticateToken, async (req, res) => {
    try {
        const success = await recurringTransactionService.markAsPaid(req.user.id, req.params.id);
        if (success) {
            res.json({ message: 'Payment recorded successfully' });
        } else {
            res.status(404).json({ error: 'Subscription not found or unauthorized' });
        }
    } catch (error) {
        console.error('Mark as paid error:', error);
        res.status(500).json({ error: 'Failed to record payment' });
    }
});
// Health check // Renamed from Gamyartha to Gamyartha
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Catch-all for API routes not found
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API route not found' });
});

// Catch-all for non-API routes: send back index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware (should be placed after all routes and other middlewares)
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(500).json({ error: 'Something went wrong on the server' });
});

// Initialize database and start server
initializeDatabase().then(() => {
    // Initialize mailer after database is ready
    try {
        mailerUtils.initMailer && mailerUtils.initMailer();
    } catch (error) {
        console.error('Mailer initialization failed:', error);
    }

    // Initialize Redis
    initRedis().catch(err => console.error('Redis init failed:', err));

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Frontend /backend available at http://localhost:${PORT}`); // Renamed from Gamyartha to Gamyartha
        console.log(`Connected to MySQL database`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
}).catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});


// Start the reminder service after the server starts
const ObligationReminderService = require('./services/ObligationReminderService');
const reminderService = new ObligationReminderService(pool);
reminderService.scheduleObligationReminders();

// Start the monthly summary service
const MonthlySummaryService = require('./services/MonthlySummaryService');
const monthlySummaryService = new MonthlySummaryService(pool);

// Schedule monthly summaries: 0 8 1 * * (1st of every month at 8:00 AM)
const cron = require('node-cron');
cron.schedule('0 8 1 * *', () => {
    console.log('Running monthly summary email job...');
    monthlySummaryService.sendMonthlySummaries();
}, {
    timezone: "Asia/Kolkata"
});

console.log('✅ Monthly summary email scheduler started (runs 1st of every month at 8:00 AM IST)');

// Recurring Transactions Scheduler: 0 5 0 * * * (Daily at 12:05 AM)
cron.schedule('0 5 0 * * *', async () => {
    console.log('🔄 Processing recurring transactions...');
    try {
        const count = await recurringTransactionService.processDueTransactions();
        console.log(`✅ Processed ${count} recurring transactions.`);
    } catch (error) {
        console.error('❌ Error processing recurring transactions:', error);
    }
}, {
    timezone: "Asia/Kolkata"
});

// Challenge Activator & Notifier: Runs every hour to check for new active challenges OR completed challenges
cron.schedule('0 * * * *', async () => {
    console.log('🔄 Checking for challenge updates...');
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. ACTIVATE STARTING CHALLENGES
        const [startingChallenges] = await connection.execute(`
            SELECT * FROM savings_challenges 
            WHERE status = 'upcoming' AND start_date <= CURDATE()
        `);

        if (startingChallenges.length > 0) {
            console.log(`🚀 Found ${startingChallenges.length} challenges starting now.`);

            for (const challenge of startingChallenges) {
                await connection.execute('UPDATE savings_challenges SET status = "active" WHERE id = ?', [challenge.id]);

                // Notify ALL users (broad announcement)
                const [users] = await connection.execute('SELECT id FROM users');
                if (users.length > 0) {
                    const values = users.map(u => [
                        u.id,
                        'challenge_update',
                        `🏁 Challenge Started: ${challenge.name}`,
                        `The challenge "${challenge.name}" is now live! Join now to track your savings.`,
                        null
                    ]);
                    await connection.query(
                        'INSERT INTO notifications (user_id, type, title, message, split_request_id) VALUES ?',
                        [values]
                    );
                }
            }
        }

        // 2. COMPLETE EXPIRED CHALLENGES
        const [expiredChallenges] = await connection.execute(`
            SELECT * FROM savings_challenges 
            WHERE status = 'active' AND end_date < CURDATE()
        `);

        if (expiredChallenges.length > 0) {
            console.log(`🏁 Found ${expiredChallenges.length} challenges ending now.`);

            for (const challenge of expiredChallenges) {
                // Update status
                await connection.execute('UPDATE savings_challenges SET status = "completed" WHERE id = ?', [challenge.id]);

                // Determine Winner
                let categoryFilter = "";
                if (challenge.target_category !== 'total_spend') {
                    // Note: In production, sanitize this input. Assuming internal ENUM values here are safe.
                    categoryFilter = `AND t.category = '${challenge.target_category}'`;
                }

                // Query for winner: Lowest spend
                const [leaderboard] = await connection.execute(`
                    SELECT u.id, u.full_name, COALESCE(SUM(t.amount), 0) as total_spent
                    FROM challenge_participants cp
                    JOIN users u ON cp.user_id = u.id
                    LEFT JOIN transactions t ON u.id = t.user_id 
                        AND t.transaction_date BETWEEN ? AND ? 
                        AND t.type = 'expense'
                        ${categoryFilter}
                    WHERE cp.challenge_id = ?
                    GROUP BY u.id, u.full_name
                    ORDER BY total_spent ASC
                    LIMIT 1
                `, [challenge.start_date, challenge.end_date, challenge.id]);

                if (leaderboard.length > 0) {
                    const winner = leaderboard[0];
                    console.log(`🏆 Winner for ${challenge.name} is ${winner.full_name}`);

                    // Get all participants to notify them
                    const [participants] = await connection.execute(
                        'SELECT user_id FROM challenge_participants WHERE challenge_id = ?',
                        [challenge.id]
                    );

                    if (participants.length > 0) {
                        const notifValues = participants.map(p => {
                            const isWinner = p.user_id === winner.id;
                            const title = isWinner ? '🏆 You Won!' : '🏁 Challenge Ended';
                            const message = isWinner
                                ? `Congratulations! You won the "${challenge.name}" challenge with the lowest spend of ₹${winner.total_spent}.`
                                : `The "${challenge.name}" challenge has ended. The winner is ${winner.full_name} (₹${winner.total_spent}).`;

                            return [p.user_id, 'challenge_update', title, message, null];
                        });

                        await connection.query(
                            'INSERT INTO notifications (user_id, type, title, message, split_request_id) VALUES ?',
                            [notifValues]
                        );
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Error in challenge scheduler:', error);
    } finally {
        if (connection) connection.release();
    }
}, {
    timezone: "Asia/Kolkata"
});

module.exports = app;
