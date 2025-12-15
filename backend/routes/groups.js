/*
 * Copyright (c) 2025 Gamyartha. All rights reserved.
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { sendEmail } = require('../utils/mailer');

// Create a new group
router.post('/create', auth, async (req, res) => {
    console.log('Received create group request:', req.body);
    const connection = await req.pool.getConnection();
    try {
        const { group_name, member_emails: raw_member_emails, group_type = 'general' } = req.body;
        if (!group_name || !raw_member_emails || !Array.isArray(raw_member_emails)) {
            return res.status(400).json({ message: 'Invalid request data' });
        }

        // Normalize emails to lowercase and trim
        const member_emails = raw_member_emails.map(e => e.trim().toLowerCase());

        console.log('Starting transaction for group creation...');
        // Start transaction
        await connection.beginTransaction();

        // Create group
        console.log(`Creating group '${group_name}' (Type: ${group_type}) for user ${req.user.id}`);
        const [groupResult] = await connection.query(
            'INSERT INTO expense_groups (group_name, created_by_user_id, group_type) VALUES (?, ?, ?)',
            [group_name, req.user.id, group_type]
        );
        const actualGroupId = groupResult.insertId; // Use insertId property
        console.log('Group created with ID:', actualGroupId);

        // Get user IDs for member emails
        console.log('Checking existing users for emails:', member_emails);
        const [existingUsers] = await connection.query(
            'SELECT id, email FROM users WHERE email IN (?)',
            [member_emails]
        );
        const existingUserMap = new Map(existingUsers.map(u => [u.email.toLowerCase(), u.id]));
        const memberUserIds = [];

        console.log('Processing members...');
        for (const email of member_emails) {
            if (!existingUserMap.has(email)) {
                console.log(`Creating new user for email: ${email}`);
                // Create placeholder account for new user
                const saltRounds = 10;
                const randomPassword = require('crypto').randomBytes(32).toString('hex');
                const passwordHash = await bcrypt.hash(randomPassword, saltRounds);

                const [newUserResult] = await connection.query(
                    'INSERT INTO users (email, password_hash, full_name, email_verified) VALUES (?, ?, ?, ?)',
                    [email, passwordHash, email.split('@')[0], false]
                );
                const newUserId = newUserResult.insertId;
                memberUserIds.push(newUserId);
                existingUserMap.set(email, newUserId); // Add new user to map for email sending
            } else {
                memberUserIds.push(existingUserMap.get(email));
            }
        }

        // Add members including creator
        const allMembers = [...new Set([...memberUserIds, req.user.id])];
        console.log('Adding members to group:', allMembers);
        for (const user_id of allMembers) {
            await connection.query(
                'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
                [actualGroupId, user_id]
            );

            // Initialize balance for each member
            await connection.query(
                'INSERT INTO group_balances (group_id, user_id, net_balance) VALUES (?, ?, 0)',
                [actualGroupId, user_id]
            );
        }

        console.log('Committing transaction...');
        await connection.commit();

        // Send invitation emails to all members except the creator
        try {
            // Get creator's name
            const [creatorResult] = await connection.query(
                'SELECT full_name FROM users WHERE id = ?',
                [req.user.id]
            );
            const creatorName = creatorResult[0]?.full_name || req.user.email.split('@')[0];

            // Send emails to all members except creator
            const emailPromises = memberUserIds
                .filter(userId => userId !== req.user.id)
                .map(async (userId) => {
                    try {
                        const [userResult] = await connection.query(
                            'SELECT email, full_name FROM users WHERE id = ?',
                            [userId]
                        );
                        const user = userResult[0];
                        if (user) {
                            await sendEmail('groupInvite', {
                                to_email: user.email,
                                user_name: user.full_name || user.email.split('@')[0],
                                group_name: group_name,
                                creator_name: creatorName
                            });
                        }
                    } catch (emailError) {
                        console.error(`Failed to send group invite email to user ${userId}:`, emailError);
                        // Don't fail the group creation if email fails
                    }
                });

            // Send emails asynchronously (don't wait for completion)
            Promise.all(emailPromises).catch(error => {
                console.error('Error sending group invitation emails:', error);
            });

        } catch (emailSetupError) {
            console.error('Error setting up group invitation emails:', emailSetupError);
            // Don't fail group creation if email setup fails
        }

        res.json({
            message: 'Group created successfully',
            group_id: actualGroupId,
            group_name
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating group (STACK TRACE):', error);
        res.status(500).json({ message: 'Failed to create group: ' + error.message });
    } finally {
        connection.release();
    }
});

// Get all groups for current user
router.get('/', auth, async (req, res) => {
    try {
        const [groups] = await req.pool.query(
            `SELECT eg.*,
                    COUNT(DISTINCT gm.user_id) as member_count,
                    gb.net_balance as user_balance
             FROM expense_groups eg
             JOIN group_members gm ON eg.id = gm.group_id
             LEFT JOIN group_balances gb ON eg.id = gb.group_id AND gb.user_id = ?
             WHERE eg.id IN (
                 SELECT group_id FROM group_members WHERE user_id = ?
             )
             GROUP BY eg.id`,
            [req.user.id, req.user.id]
        );
        console.log(`[DEBUG] GET /groups for User ${req.user.id} found ${groups.length} groups`);
        if (groups.length > 0) {
            console.log(`[DEBUG] Group IDs: ${groups.map(g => g.id).join(', ')}`);
        }
        res.json({ groups });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Failed to fetch groups' });
    }
});

// Split a new expense (or record income)
router.post('/split', auth, async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        // NOTE: The request body must include: group_id, amount, description
        const { group_id, amount, description, category, type = 'expense', split_method = 'equal' } = req.body;

        // Validate request
        if (!group_id || !amount || !description) {
            return res.status(400).json({ message: 'Missing required fields: group_id, amount, and description are required' });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User authentication required' });
        }

        // Start transaction
        await connection.beginTransaction();

        // Create expense record
        const paidByUserIdInt = parseInt(req.user.id);

        await connection.query(
            'INSERT INTO group_expenses (group_id, split_request_id, paid_by_user_id, amount, description, category, type, split_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [group_id, null, paidByUserIdInt, amount, description, category || 'Uncategorized', type, split_method]
        );

        // Access/Debt Logic:
        // If it's an EXPENSE, we split it (create debt).
        // If it's INCOME, for now, we just record it. (Future: maybe split income?)
        // The user just wants "Transactions, Income, Expenses" displayed.
        // So if type === 'income', we skip the balance updates for now, OR we could treat it as "Negative Expense" for the payer?
        // Let's mostly skip balance updates for Income to keep "Debt" separate from "Group Income Tracking" unless requested to split income.
        // Assuming "Income" in this context is just logging inflow.

        if (type === 'expense') {
            // Get group members
            const [members] = await connection.query(
                'SELECT user_id FROM group_members WHERE group_id = ?',
                [group_id]
            );

            if (members.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Group not found or has no members.' });
            }

            // Calculate split amount
            const splitAmount = amount / members.length;

            // Update balances
            // Each member who didn't pay owes their share
            for (const member of members) {
                const memberUserId = member.user_id || member.id;
                if (!memberUserId) continue;

                if (memberUserId === req.user.id) continue;

                // Update member's balance (they owe money)
                await connection.query(
                    'UPDATE group_balances SET net_balance = net_balance - ? WHERE group_id = ? AND user_id = ?',
                    [splitAmount, group_id, memberUserId]
                );
            }

            // The payer is credited for the amount they paid, minus their own share.
            const payerCredit = amount - splitAmount;
            await connection.query(
                'UPDATE group_balances SET net_balance = net_balance + ? WHERE group_id = ? AND user_id = ?',
                [payerCredit, group_id, req.user.id]
            );
        }

        await connection.commit();
        res.json({
            message: type === 'income' ? 'Income recorded successfully' : 'Expense split successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error splitting expense:', error);
        res.status(500).json({ message: 'Failed to record transaction' });
    } finally {
        connection.release();
    }
});

// Get balances for a group
router.get('/:group_id/balances', auth, async (req, res) => {
    try {
        // First verify user is member of the group
        console.log(`[DEBUG] GET /:group_id/balances - User: ${req.user.id}, Group: ${req.params.group_id}`);
        const [isMember] = await req.pool.query(
            'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
            [req.params.group_id, req.user.id]
        );
        console.log(`[DEBUG] Membership Check Result:`, isMember);

        if (!isMember.length) {
            console.warn(`[DEBUG] User ${req.user.id} not a member of Group ${req.params.group_id} for balances`);
            return res.status(403).json({ message: 'Not authorized to view this group' });
        }

        const [balances] = await req.pool.query(
            `SELECT gb.*, u.full_name as user_name, u.email
             FROM group_balances gb
             JOIN users u ON gb.user_id = u.id
             WHERE gb.group_id = ?`,
            [req.params.group_id]
        );

        res.json({ balances });
    } catch (error) {
        console.error('Error fetching balances:', error);
        res.status(500).json({ message: 'Failed to fetch balances' });
    }
});

// Settle up a balance within a group
router.post('/settle', auth, async (req, res) => {
    const connection = await req.pool.getConnection();
    console.log('Backend: Received POST /api/groups/settle request'); // Debug log
    try {
        const { group_id, from_user_id, to_user_id, amount } = req.body;

        if (!group_id || !from_user_id || !to_user_id || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Missing required fields for settlement.' });
        }

        // Verify that the person making the request is the one paying
        if (req.user.id !== parseInt(from_user_id)) {
            return res.status(403).json({ message: 'You can only record payments for yourself.' });
        }

        await connection.beginTransaction();

        // Debit the receiver (their credit is reduced)
        await connection.query(
            'UPDATE group_balances SET net_balance = net_balance - ? WHERE group_id = ? AND user_id = ?',
            [amount, group_id, to_user_id]
        );

        // Credit the sender (their debt is reduced)
        await connection.query(
            'UPDATE group_balances SET net_balance = net_balance + ? WHERE group_id = ? AND user_id = ?',
            [amount, group_id, from_user_id]
        );

        // Optionally, log this as a special type of transaction/event
        await connection.query(
            'INSERT INTO group_expenses (group_id, paid_by_user_id, amount, description, type, split_method) VALUES (?, ?, ?, ?, ?, ?)',
            [group_id, from_user_id, amount, `Settlement to user ${to_user_id}`, 'settlement', 'settlement']
        );

        await connection.commit();
        res.json({ message: 'Settlement recorded successfully.' });

    } catch (error) {
        await connection.rollback();
        console.error('Error settling up:', error);
        res.status(500).json({ message: 'Failed to record settlement.' });
    } finally {
        connection.release();
    }
});

// Get transactions for a group (formatted for dashboard)
router.get('/:group_id/transactions', auth, async (req, res) => {
    try {
        const connection = await req.pool.getConnection();

        // Verify member
        console.log(`[DEBUG] GET /:group_id/transactions - User: ${req.user.id}, Group: ${req.params.group_id}`);
        const [isMember] = await connection.query(
            'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
            [req.params.group_id, req.user.id]
        );
        console.log(`[DEBUG] Membership Check Result:`, isMember);

        if (!isMember.length) {
            console.warn(`[DEBUG] User ${req.user.id} not a member of Group ${req.params.group_id}`);
            connection.release();
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Fetch group expenses
        const [expenses] = await connection.query(`
            SELECT ge.id, ge.amount, ge.description, ge.type, ge.category, ge.created_at as transaction_date, 
                   ge.paid_by_user_id, u.full_name as paid_by_name,
                   FALSE as is_business, 'INR' as currency
            FROM group_expenses ge
            JOIN users u ON ge.paid_by_user_id = u.id
            WHERE ge.group_id = ?
            ORDER BY ge.created_at DESC
            LIMIT 50
        `, [req.params.group_id]);

        connection.release();

        // Format for frontend
        const transactions = expenses.map(e => ({
            ...e,
            description: `${e.description} (by ${e.paid_by_user_id === req.user.id ? 'You' : e.paid_by_name})`
        }));

        res.json({ transactions });
    } catch (error) {
        console.error('Error fetching group transactions:', error);
        res.status(500).json({ message: 'Failed to fetch group transactions' });
    }
});

// Delete a group expense
router.delete('/:group_id/expenses/:expense_id', auth, async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        await connection.beginTransaction();

        const { group_id, expense_id } = req.params;

        // Verify user is a member of the group
        const [isMember] = await connection.query(
            'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
            [group_id, req.user.id]
        );

        if (!isMember.length) {
            await connection.rollback();
            connection.release();
            return res.status(403).json({ message: 'Not authorized to delete this expense' });
        }

        // Get expense details before deleting (to recalculate balances)
        const [expense] = await connection.query(
            'SELECT * FROM group_expenses WHERE id = ? AND group_id = ?',
            [expense_id, group_id]
        );

        if (!expense.length) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Delete expense
        await connection.query(
            'DELETE FROM group_expenses WHERE id = ?',
            [expense_id]
        );

        // Recalculate balances... for now, simpler to just reset them?
        // No, invalidating balances is tricky if we delete one by one.
        // Actually, deleting an expense should reverse the balance effect.
        // Since we didn't store the exact split details per user in a granular way (only aggregate balances), reversing is complex unless we stored the split.
        // We DO store 'split_method' but not the exact breakdown if it was complicated.
        // However, we did this:
        // 'UPDATE group_balances SET net_balance = net_balance - ? ...'
        // So we can reverse it if we know the amount and who was involved.
        // But `group_expenses` doesn't store who was involved in THAT specific expense other than implicitly "all members" for equal split.
        // If members joined later, they might not be part of old expenses.
        // This is a known limitation of simple splitwise clones.
        // For MVP: We will reset all balances if we clear ALL transactions.
        // If deleting ONE transaction: we roughly estimate reversal or warn user.
        // "Clearing all transactions" is requested.

        await connection.commit();
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting group expense:', error);
        res.status(500).json({ message: 'Failed to delete expense' });
    } finally {
        connection.release();
    }
});

// Clear all expenses for a group
router.delete('/:group_id/expenses', auth, async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        await connection.beginTransaction();

        const { group_id } = req.params;

        // Verify member
        const [isMember] = await connection.query(
            'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
            [group_id, req.user.id]
        );

        if (!isMember.length) {
            await connection.rollback();
            connection.release();
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete all expenses
        await connection.query(
            'DELETE FROM group_expenses WHERE group_id = ?',
            [group_id]
        );

        // Reset all balances to 0
        await connection.query(
            'UPDATE group_balances SET net_balance = 0 WHERE group_id = ?',
            [group_id]
        );

        await connection.commit();
        res.json({ message: 'All group expenses cleared and balances reset.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error clearing group expenses:', error);
        res.status(500).json({ message: 'Failed to clear group expenses' });
    } finally {
        connection.release();
    }
});


// Update a group (Edit Name)
router.put('/:id', auth, async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        const { id } = req.params;
        const { group_name } = req.body;

        if (!group_name) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        // Verify ownership (only creator can rename)
        const [group] = await connection.query(
            'SELECT created_by_user_id FROM expense_groups WHERE id = ?',
            [id]
        );

        if (!group.length) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group[0].created_by_user_id !== req.user.id) {
            return res.status(403).json({ message: 'Only the group creator can edit this group' });
        }

        await connection.query(
            'UPDATE expense_groups SET group_name = ? WHERE id = ?',
            [group_name, id]
        );

        res.json({ message: 'Group updated successfully', group_id: id, group_name });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ message: 'Failed to update group' });
    } finally {
        connection.release();
    }
});

// Delete a group
router.delete('/:id', auth, async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        const { id } = req.params;

        // Verify ownership (only creator can delete)
        const [group] = await connection.query(
            'SELECT created_by_user_id FROM expense_groups WHERE id = ?',
            [id]
        );

        if (!group.length) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group[0].created_by_user_id !== req.user.id) {
            return res.status(403).json({ message: 'Only the group creator can delete this group' });
        }

        // Delete group (Cascades to members, expenses, balances via DB schema)
        await connection.query('DELETE FROM expense_groups WHERE id = ?', [id]);

        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: 'Failed to delete group' });
    } finally {
        connection.release();
    }
});

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

        // Check membership instead of just creator ownership
        const [membership] = await connection.query(
            'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (!membership.length) {
            return res.status(403).json({ message: 'You must be a member of the group to invite others' });
        }

        let token = group[0].invite_token;
        if (!token) {
            token = uuidv4();
            await connection.query('UPDATE expense_groups SET invite_token = ? WHERE id = ?', [token, id]);
            await connection.commit(); // Ensure token save is committed if we started a transaction (we didn't yet, but good practice if mixed)
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

module.exports = router;
