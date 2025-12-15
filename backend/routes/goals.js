const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get goals (Personal or Group)
router.get('/', auth, async (req, res) => {
    try {
        const { group_id } = req.query;
        const connection = await req.pool.getConnection();
        let goals;

        if (group_id) {
            // Verify membership
            const [membership] = await connection.execute(
                'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
                [group_id, req.user.id]
            );

            if (membership.length === 0) {
                connection.release();
                return res.status(403).json({ error: 'Not a member of this group' });
            }

            [goals] = await connection.execute(
                'SELECT * FROM goals WHERE group_id = ? ORDER BY target_date ASC',
                [group_id]
            );
        } else {
            // Fetch PERSONAL goals only (group_id IS NULL)
            [goals] = await connection.execute(
                'SELECT * FROM goals WHERE user_id = ? AND group_id IS NULL ORDER BY target_date ASC',
                [req.user.id]
            );
        }

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
        const { name, target_amount, target_date, group_id } = req.body;

        if (!name || !target_amount || !target_date) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const connection = await req.pool.getConnection();

        if (group_id) {
            // Verify membership
            const [membership] = await connection.execute(
                'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
                [group_id, req.user.id]
            );
            if (membership.length === 0) {
                connection.release();
                return res.status(403).json({ error: 'Not a member of this group' });
            }
        }

        const [result] = await connection.execute(
            'INSERT INTO goals (user_id, group_id, name, target_amount, target_date) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, group_id || null, name, target_amount, target_date]
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

        // Check functionality: If it's a group ID, check membership. If private, check ownership.
        const [goal] = await connection.execute('SELECT user_id, group_id FROM goals WHERE id = ?', [goalId]);

        if (goal.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Goal not found' });
        }

        if (goal[0].group_id) {
            const [membership] = await connection.execute(
                'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
                [goal[0].group_id, req.user.id]
            );
            if (membership.length === 0) {
                connection.release();
                return res.status(403).json({ error: 'Not authorized for this group goal' });
            }
        } else {
            if (goal[0].user_id !== req.user.id) {
                connection.release();
                return res.status(403).json({ error: 'Not authorized' });
            }
        }


        await connection.execute(
            'UPDATE goals SET saved_amount = ? WHERE id = ?',
            [saved_amount, goalId]
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

        // Permission check
        const [goal] = await connection.execute('SELECT user_id, group_id FROM goals WHERE id = ?', [goalId]);
        if (goal.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Goal not found' });
        }

        if (goal[0].group_id) {
            const [membership] = await connection.execute(
                'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
                [goal[0].group_id, req.user.id]
            );
            if (membership.length === 0) {
                connection.release();
                return res.status(403).json({ error: 'Not authorized' });
            }
        } else {
            if (goal[0].user_id !== req.user.id) {
                connection.release();
                return res.status(403).json({ error: 'Not authorized' });
            }
        }

        await connection.execute(
            'UPDATE goals SET name = ?, target_amount = ?, target_date = ? WHERE id = ?',
            [name, target_amount, target_date, goalId]
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

        // Permission check
        const [goal] = await connection.execute('SELECT user_id, group_id FROM goals WHERE id = ?', [goalId]);
        if (goal.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Goal not found' });
        }

        if (goal[0].group_id) {
            const [membership] = await connection.execute(
                'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
                [goal[0].group_id, req.user.id]
            );
            if (membership.length === 0) {
                connection.release();
                return res.status(403).json({ error: 'Not authorized' });
            }
        } else {
            if (goal[0].user_id !== req.user.id) {
                connection.release();
                return res.status(403).json({ error: 'Not authorized' });
            }
        }

        await connection.execute(
            'DELETE FROM goals WHERE id = ?',
            [goalId]
        );
        connection.release();

        res.json({ message: 'Goal deleted successfully' });

    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

module.exports = router;
