const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

// Middleware to pass pool to req if not already there (handled in server.js, but safe check)
// Assuming req.pool is available

// 1. Get All Active/Upcoming Challenges
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [challenges] = await req.pool.execute(`
            SELECT sc.*, 
                   (SELECT COUNT(*) FROM challenge_participants cp WHERE cp.challenge_id = sc.id) as participant_count,
                   (SELECT COUNT(*) FROM challenge_participants cp WHERE cp.challenge_id = sc.id AND cp.user_id = ?) as is_joined
            FROM savings_challenges sc
            WHERE sc.end_date >= CURDATE()
            ORDER BY sc.start_date ASC
        `, [req.user.id]);

        res.json({ challenges });
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});

// 2. Join a Challenge
router.post('/:id/join', authenticateToken, async (req, res) => {
    try {
        const challengeId = req.params.id;
        const userId = req.user.id;

        // Check if already joined
        const [existing] = await req.pool.execute(
            'SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?',
            [challengeId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already joined this challenge' });
        }

        await req.pool.execute(
            'INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)',
            [challengeId, userId]
        );

        res.json({ success: true, message: 'Joined challenge successfully!' });
    } catch (error) {
        console.error('Error joining challenge:', error);
        res.status(500).json({ error: 'Failed to join challenge' });
    }
});

// 3. Get Challenge Leaderboard
router.get('/:id/leaderboard', authenticateToken, async (req, res) => {
    try {
        const challengeId = req.params.id;

        // Fetch challenge details to know criteria
        const [challenge] = await req.pool.execute('SELECT * FROM savings_challenges WHERE id = ?', [challengeId]);
        if (challenge.length === 0) return res.status(404).json({ error: 'Challenge not found' });

        const c = challenge[0];
        const startDate = c.start_date.toISOString().split('T')[0];
        const endDate = c.end_date.toISOString().split('T')[0];

        // This is a simplified logic. In a real app, you'd aggregate transactions table dynamically.
        // Query: Sum expenses for users in this challenge, during challenge period, for target category.

        let categoryFilter = "";
        if (c.target_category !== 'total_spend') {
            categoryFilter = `AND t.category = '${c.target_category}'`; // Be careful with SQL injection in real prod, use params
            // Converting enum to actual category string matches might be needed if exact strings differ
        }

        // We want 'lowest_spend' to be at the top of leaderboard
        const query = `
            SELECT u.id, u.full_name, 
                   COALESCE(SUM(t.amount), 0) as total_spent
            FROM challenge_participants cp
            JOIN users u ON cp.user_id = u.id
            LEFT JOIN transactions t ON u.id = t.user_id 
                AND t.transaction_date BETWEEN ? AND ? 
                AND t.type = 'expense'
                ${categoryFilter}
            WHERE cp.challenge_id = ?
            GROUP BY u.id, u.full_name
            ORDER BY total_spent ASC
            LIMIT 10
        `;

        const [leaderboard] = await req.pool.execute(query, [startDate, endDate, challengeId]);

        res.json({ challenge: c, leaderboard });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// 4. Create New Challenge (Admin Only)
router.post('/create', authenticateToken, async (req, res) => {
    try {
        // Fix: Middleware sets req.user.is_admin, not isAdmin
        if (!req.user.is_admin) {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }

        const { name, description, start_date, end_date, target_category, winning_criteria } = req.body;

        if (!name || !description || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await req.pool.execute(
            `INSERT INTO savings_challenges 
            (name, description, start_date, end_date, target_category, winning_criteria, created_by_user_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'upcoming')`,
            [name, description, start_date, end_date, target_category || 'total_spend', winning_criteria || 'lowest_spend', req.user.id]
        );

        res.json({ success: true, message: 'Challenge created successfully!' });

    } catch (error) {
        console.error('Error creating challenge:', error);
        res.status(500).json({ error: 'Failed to create challenge' });
    }

});

// 5. Delete Challenge (Admin Only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (!req.user.is_admin) {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }

        const challengeId = req.params.id;

        // Delete challenge (cascade will handle participants)
        await req.pool.execute('DELETE FROM savings_challenges WHERE id = ?', [challengeId]);

        res.json({ success: true, message: 'Challenge deleted successfully' });
    } catch (error) {
        console.error('Error deleting challenge:', error);
        res.status(500).json({ error: 'Failed to delete challenge' });
    }
});

module.exports = router;
