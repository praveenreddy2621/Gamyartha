const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get user's notifications
router.get('/', auth, async (req, res) => {
    try {
        const [notifications] = await req.pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [req.user.id]
        );

        res.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.post('/:id/read', auth, async (req, res) => {
    try {
        await req.pool.query(
            `UPDATE notifications 
             SET read_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to update notification' });
    }
});

// Mark all notifications as read
router.post('/read-all', auth, async (req, res) => {
    try {
        await req.pool.query(
            `UPDATE notifications 
             SET read_at = CURRENT_TIMESTAMP 
             WHERE user_id = ? AND read_at IS NULL`,
            [req.user.id]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Failed to update notifications' });
    }
});

module.exports = router;