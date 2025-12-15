
// Generate or Retrieve Invite Link
router.get('/:id/invite', auth, async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        const { id } = req.params;

        // Verify ownership (only creator can generate invite)
        const [group] = await connection.query(
            'SELECT created_by_user_id, invite_token, group_name FROM expense_groups WHERE id = ?',
            [id]
        );

        if (!group.length) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Only creator? Or allow any member? Let's restrict to creator for now as per proposal
        if (group[0].created_by_user_id !== req.user.id) {
            return res.status(403).json({ message: 'Only the group creator can generate invite links' });
        }

        let token = group[0].invite_token;
        if (!token) {
            token = uuidv4();
            await connection.query('UPDATE expense_groups SET invite_token = ? WHERE id = ?', [token, id]);
        }

        // Construct full link (frontend URL) 
        // We return just the token, frontend constructs the link
        res.json({
            invite_token: token,
            // Assuming frontend runs on same domain/port for simplistic setup or strict FE_URL logic
            // We'll let Frontend build the full URL: window.location.origin + '/?join=' + token
            message: 'Invite token generated'
        });

    } catch (error) {
        console.error('Error generating invite:', error);
        res.status(500).json({ message: 'Failed to generate invite' });
    } finally {
        connection.release();
    }
});

// Join Group via Token
router.post('/join', auth, async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: 'Token is required' });

        const [group] = await connection.query('SELECT id, group_name FROM expense_groups WHERE invite_token = ?', [token]);
        if (!group.length) {
            return res.status(404).json({ message: 'Invalid or expired invite link' });
        }

        const groupId = group[0].id;
        const userId = req.user.id;

        // Check if already a member
        const [existing] = await connection.query('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId]);
        if (existing.length) {
            return res.status(200).json({ message: 'You are already a member of this group', group_id: groupId });
        }

        await connection.beginTransaction();

        // Add to members
        await connection.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, userId]);

        // Initialize balance
        await connection.query('INSERT INTO group_balances (group_id, user_id, net_balance) VALUES (?, ?, 0)', [groupId, userId]);

        await connection.commit();

        res.json({ message: `Joined ${group[0].group_name} successfully!`, group_id: groupId });

    } catch (error) {
        await connection.rollback();
        console.error('Error joining group:', error);
        res.status(500).json({ message: 'Failed to join group' });
    } finally {
        connection.release();
    }
});
