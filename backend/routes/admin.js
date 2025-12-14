const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

// Middleware to check for auth and admin status for all routes
router.use(auth);
router.use(adminAuth);

// Get Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const connection = await req.pool.getConnection(); // Use pool from request

        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [transactionCount] = await connection.query('SELECT COUNT(*) as count FROM transactions');
        const [goalCount] = await connection.query('SELECT COUNT(*) as count FROM goals');
        const [obligationCount] = await connection.query('SELECT COUNT(*) as count FROM obligations');

        // Get recent transactions (system-wide)
        const [recentTransactions] = await connection.query(`
            SELECT t.id, t.amount, t.description, t.type, t.created_at, u.full_name as user_name 
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC 
            LIMIT 5
        `);

        connection.release();

        res.json({
            users: userCount[0].count,
            transactions: transactionCount[0].count,
            goals: goalCount[0].count,
            obligations: obligationCount[0].count,
            recentActivity: recentTransactions
        });

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// Get All Users
router.get('/users', async (req, res) => {
    try {
        const connection = await req.pool.getConnection();
        const [users] = await connection.query(`
            SELECT id, full_name, email, is_admin, email_verified, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        connection.release();
        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Toggle Admin Status
router.put('/users/:id/role', async (req, res) => {
    try {
        const userId = req.params.id;
        const { is_admin } = req.body; // Expect boolean

        // Prevent changing own role (optional, but good practice)
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Cannot change your own admin status' });
        }

        const connection = await req.pool.getConnection();

        await connection.query('UPDATE users SET is_admin = ? WHERE id = ?', [is_admin, userId]);

        // If enabling admin, ensure entry in admins table
        if (is_admin) {
            await connection.query('INSERT IGNORE INTO admins (user_id, permissions) VALUES (?, ?)', [userId, JSON.stringify(['all'])]);
        }

        connection.release();

        res.json({ message: `User role updated successfully` });

    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// --- NEW FEATURES ---

// 1. Analytics & System Health
router.get('/analytics', async (req, res) => {
    try {
        const connection = await req.pool.getConnection();

        // Mock data logic for demonstration, real queries would go here
        // User Growth (Last 7 days)
        const [dailySignups] = await connection.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
            GROUP BY DATE(created_at)
        `);

        // Transaction Volume (Last 7 days)
        const [dailyTransactions] = await connection.query(`
            SELECT DATE(transaction_date) as date, COUNT(*) as count, SUM(amount) as volume
            FROM transactions 
            WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
            GROUP BY DATE(transaction_date)
        `);

        connection.release();

        const health = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };

        res.json({
            userGrowth: dailySignups,
            transactionTrends: dailyTransactions,
            systemHealth: health
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// 2. Transaction Inspector
router.get('/transactions', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const connection = await req.pool.getConnection();

        const [transactions] = await connection.query(`
            SELECT t.*, u.full_name, u.email 
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.transaction_date DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), parseInt(offset)]);

        connection.release();
        res.json({ transactions });
    } catch (error) {
        console.error('Error fetching admin transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// 3. Global Broadcast
const mailerUtils = require('../utils/mailer');
router.post('/broadcast', async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) return res.status(400).json({ error: 'Subject and message required' });

        const connection = await req.pool.getConnection();
        const [users] = await connection.query('SELECT email FROM users WHERE email_alerts_enabled = TRUE');
        connection.release();

        // In a real production app, use a queue (BullMQ/RabbitMQ). iterating here for simplicity.
        let sentCount = 0;
        for (const user of users) {
            try {
                // Using the generic sendEmail wrapper from mailerUtils if available, or direct transport
                // Assuming mailerUtils has a generic 'sendCustom' or we can mock a template type
                await mailerUtils.sendEmail('generic', {
                    to_email: user.email,
                    subject: subject,
                    text: message,
                    html: `<div style="font-family: sans-serif; padding: 20px;"><h2>${subject}</h2><p>${message}</p><p style="color:gray; font-size:12px;">This is a system broadcast from Gamyartha Team.</p></div>`
                });
                sentCount++;
            } catch (e) {
                console.error(`Failed to send to ${user.email}`, e);
            }
        }

        res.json({ message: `Broadcast processed. Sent to ${sentCount} / ${users.length} users.` });

    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({ error: 'Broadcast failed' });
    }
});

// 4. Gamification Manager (Badges)
router.get('/badges', async (req, res) => {
    try {
        const connection = await req.pool.getConnection();
        const [badges] = await connection.query('SELECT * FROM badges ORDER BY created_at DESC');
        connection.release();
        res.json({ badges });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
});

router.post('/badges', async (req, res) => {
    try {
        const { code, name, description, icon, type, threshold } = req.body;
        const connection = await req.pool.getConnection();
        await connection.query(
            'INSERT INTO badges (code, name, description, icon, criteria_type, criteria_threshold) VALUES (?, ?, ?, ?, ?, ?)',
            [code, name, description, icon, type, threshold]
        );
        connection.release();
        res.json({ message: 'Badge created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create badge' });
    }
});

// Update badge
router.put('/badges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, description, icon, type, threshold } = req.body;
        const connection = await req.pool.getConnection();

        await connection.query(
            'UPDATE badges SET code = ?, name = ?, description = ?, icon = ?, criteria_type = ?, criteria_threshold = ? WHERE id = ?',
            [code, name, description, icon, type, threshold, id]
        );

        connection.release();
        res.json({ message: 'Badge updated successfully' });
    } catch (error) {
        console.error('Error updating badge:', error);
        res.status(500).json({ error: 'Failed to update badge' });
    }
});

// Delete badge
router.delete('/badges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await req.pool.getConnection();

        // First, remove all user_badges entries for this badge
        await connection.query('DELETE FROM user_badges WHERE badge_id = ?', [id]);

        // Then delete the badge itself
        await connection.query('DELETE FROM badges WHERE id = ?', [id]);

        connection.release();
        res.json({ message: 'Badge deleted successfully' });
    } catch (error) {
        console.error('Error deleting badge:', error);
        res.status(500).json({ error: 'Failed to delete badge' });
    }
});

// Assign badge to user
router.post('/users/:userId/badges', async (req, res) => {
    try {
        const { userId } = req.params;
        const { badgeId } = req.body;

        const connection = await req.pool.getConnection();

        // Check if badge exists
        const [badges] = await connection.query('SELECT * FROM badges WHERE id = ?', [badgeId]);
        if (badges.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Badge not found' });
        }

        // Check if user already has this badge
        const [existing] = await connection.query(
            'SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?',
            [userId, badgeId]
        );

        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'User already has this badge' });
        }

        // Assign badge
        await connection.query(
            'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
            [userId, badgeId]
        );

        connection.release();
        res.json({ message: 'Badge assigned successfully' });
    } catch (error) {
        console.error('Error assigning badge:', error);
        res.status(500).json({ error: 'Failed to assign badge' });
    }
});

// Remove badge from user
router.delete('/users/:userId/badges/:badgeId', async (req, res) => {
    try {
        const { userId, badgeId } = req.params;
        const connection = await req.pool.getConnection();

        await connection.query(
            'DELETE FROM user_badges WHERE user_id = ? AND badge_id = ?',
            [userId, badgeId]
        );

        connection.release();
        res.json({ message: 'Badge removed successfully' });
    } catch (error) {
        console.error('Error removing badge:', error);
        res.status(500).json({ error: 'Failed to remove badge' });
    }
});

module.exports = router;
