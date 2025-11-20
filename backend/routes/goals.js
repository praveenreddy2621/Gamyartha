const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all goals for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const connection = await req.pool.getConnection();
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

// Add a new goal
router.post('/', auth, async (req, res) => {
    try {
        const { name, target_amount, target_date } = req.body;

        if (!name || !target_amount || !target_date) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const connection = await req.pool.getConnection();
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
router.put('/:id/progress', auth, async (req, res) => {
    try {
        const { saved_amount } = req.body;
        const goalId = req.params.id;

        const connection = await req.pool.getConnection();
        await connection.execute(
            'UPDATE goals SET saved_amount = ? WHERE id = ? AND user_id = ?',
            [saved_amount, goalId, req.user.id]
        );
        connection.release();

        res.json({ message: 'Goal progress updated' });

    } catch (error) {
        console.error('Update goal progress error:', error);
        res.status(500).json({ error: 'Failed to update goal progress' });
    }
});

// Update a goal (name, target_amount, target_date)
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, target_amount, target_date } = req.body;
        const goalId = req.params.id;

        if (!name || !target_amount || !target_date) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const connection = await req.pool.getConnection();
        await connection.execute(
            'UPDATE goals SET name = ?, target_amount = ?, target_date = ? WHERE id = ? AND user_id = ?',
            [name, target_amount, target_date, goalId, req.user.id]
        );
        connection.release();

        res.json({ message: 'Goal updated successfully' });

    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
    try {
        const goalId = req.params.id;

        const connection = await req.pool.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM goals WHERE id = ? AND user_id = ?',
            [goalId, req.user.id]
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

module.exports = router;
