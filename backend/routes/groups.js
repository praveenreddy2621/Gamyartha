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
        const { group_name, member_emails: raw_member_emails } = req.body;
        if (!group_name || !raw_member_emails || !Array.isArray(raw_member_emails)) {
            return res.status(400).json({ message: 'Invalid request data' });
        }

        // Normalize emails to lowercase and trim
        const member_emails = raw_member_emails.map(e => e.trim().toLowerCase());

        console.log('Starting transaction for group creation...');
        // Start transaction
        await connection.beginTransaction();

        // Create group
        console.log(`Creating group '${group_name}' for user ${req.user.id}`);
        const [groupResult] = await connection.query(
            'INSERT INTO expense_groups (group_name, created_by_user_id) VALUES (?, ?)',
            [group_name, req.user.id]
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
        res.json({ groups });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Failed to fetch groups' });
    }
});

// Split a new expense
router.post('/split', auth, async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        // NOTE: The request body must include: group_id, amount, description
        const { group_id, amount, description, split_method = 'equal' } = req.body;

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
        // FIX: Ensuring req.user.id is cast to an integer to match the database schema (INT)
        // This resolves the 'Column paid_by_user_id cannot be null' error caused by parameter ambiguity.
        const paidByUserIdInt = parseInt(req.user.id);

        await connection.query(
            'INSERT INTO group_expenses (group_id, split_request_id, paid_by_user_id, amount, description, split_method) VALUES (?, ?, ?, ?, ?, ?)',
            [group_id, null, paidByUserIdInt, amount, description, split_method]
        );

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
            if (!memberUserId) {
                console.error('Invalid member object:', member);
                continue;
            }

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

        await connection.commit();
        res.json({
            message: 'Expense split successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error splitting expense:', error);
        res.status(500).json({ message: 'Failed to split expense' });
    } finally {
        connection.release();
    }
});

// Get balances for a group
router.get('/:group_id/balances', auth, async (req, res) => {
    try {
        // First verify user is member of the group
        const [isMember] = await req.pool.query(
            'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
            [req.params.group_id, req.user.id]
        );

        if (!isMember.length) {
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
            'INSERT INTO group_expenses (group_id, paid_by_user_id, amount, description, split_method) VALUES (?, ?, ?, ?, ?)',
            [group_id, from_user_id, amount, `Settlement to user ${to_user_id}`, 'settlement']
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
        const [isMember] = await connection.query(
            'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
            [req.params.group_id, req.user.id]
        );

        if (!isMember.length) {
            connection.release();
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Fetch group expenses
        const [expenses] = await connection.query(`
            SELECT ge.id, ge.amount, ge.description, 'expense' as type, ge.created_at as transaction_date, 
                   ge.paid_by_user_id, u.full_name as paid_by_name,
                   'Group Expense' as category, 
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
            description: `${e.description} (Paid by ${e.paid_by_user_id === req.user.id ? 'You' : e.paid_by_name})`
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

        // Delete the expense
        await connection.query(
            'DELETE FROM group_expenses WHERE id = ? AND group_id = ?',
            [expense_id, group_id]
        );

        // Note: Group expenses don't have a separate splits table in this schema
        // The split_method is stored directly in the group_expenses table

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

module.exports = router;
