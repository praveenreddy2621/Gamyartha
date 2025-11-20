const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dbConfig = require('../config/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: './uploads/bills',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images and PDFs are allowed!'));
    }
});

// Helper function to send email
const { sendEmail } = require('./mailer.js');

// Create a new split request
router.post('/request', auth, upload.single('bill_image'), async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        const {
            group_id,
            amount,
            description,
            split_method,
            participants,
            expires_at
        } = req.body;

        // Input validation
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        if (!description || description.trim().length === 0) {
            return res.status(400).json({ message: 'Description is required' });
        }

        if (!participants) {
            return res.status(400).json({ message: 'Participants are required' });
        }

        // Parse and validate participants data
        let participantsList;
        try {
            participantsList = JSON.parse(participants);
            if (!Array.isArray(participantsList) || participantsList.length === 0) {
                throw new Error('Invalid participants format');
            }
        } catch (e) {
            return res.status(400).json({ message: 'Invalid participants data format' });
        }

        await connection.beginTransaction();

        // Create split request
        const [result] = await connection.query(
            `INSERT INTO split_requests 
            (requester_id, group_id, amount, description, bill_image_url, split_method, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                group_id || null,
                amount,
                description,
                req.file ? `/uploads/bills/${req.file.filename}` : null,
                split_method || 'equal',
                expires_at || null
            ]
        );

        const split_request_id = result.insertId;

        // Keep track of emails processed in this request to avoid duplicates
        const processedEmails = new Set();

        // Calculate amounts for equal split if not specified
        const totalParticipants = participantsList.length;
        const splitAmount = split_method === 'equal' ? amount / totalParticipants : amount / totalParticipants;

        // Add participants
        for (const participant of participantsList) {
            // Prevent processing the same email twice in one request
            if (processedEmails.has(participant.email)) {
                continue;
            }
            processedEmails.add(participant.email);

            // Calculate amount for this participant
            let participantAmount = participant.amount;
            if (!participantAmount || isNaN(participantAmount)) {
                participantAmount = splitAmount;
            }

            // Look up user by email
            let [users] = await connection.query(
                'SELECT id, email_alerts_enabled FROM users WHERE email = ?',
                [participant.email]
            );

            let userId;
            let shouldSendEmail = true; // Always send emails for split requests

            if (users.length === 0) {
                // User not found, create a placeholder account
                const saltRounds = 10;
                // Generate a long, random password hash that cannot be used to log in
                const randomPassword = require('crypto').randomBytes(32).toString('hex');
                const passwordHash = await bcrypt.hash(randomPassword, saltRounds);

                const [newUserResult] = await connection.query(
                    `INSERT INTO users (email, password_hash, full_name, email_verified) VALUES (?, ?, ?, ?)`,
                    [participant.email, passwordHash, participant.email.split('@')[0], false]
                );
                userId = newUserResult.insertId;
            } else {
                userId = users[0].id;
                // Always send emails for split requests, regardless of email alert settings
                shouldSendEmail = true;
            }

            // Skip if participant is the requester
            if (userId === req.user.id) {
                continue;
            }

            // Send invitation email to participants who have email alerts enabled
            if (shouldSendEmail) {
                try {
                    await sendEmail('invite', {
                        to_email: participant.email,
                        requester_name: req.user.fullName, // Renamed from Gamyartha to Gamyartha
                        description: description,
                        amount_owed: participantAmount
                    });
                } catch (emailError) {
                    // Log the error but don't fail the entire transaction
                    console.error(`Failed to send invite email to ${participant.email}:`, emailError);
                }
            }

            // Add participant with resolved user ID
            await connection.query(
                `INSERT INTO split_participants
                (split_request_id, user_id, amount_owed)
                VALUES (?, ?, ?)`,
                [split_request_id, userId, participantAmount]
            );

            // Update the participant object for response
            participant.amount = participantAmount;
        }

        // If it's a group expense, add to group_expenses
        if (group_id) {
            await connection.query(
                `INSERT INTO group_expenses 
                (group_id, split_request_id, paid_by_user_id, amount, description, split_method) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [group_id, split_request_id, req.user.id, amount, description, split_method]
            );
        }

        await connection.commit();
        res.json({
            message: 'Split request created successfully',
            split_request_id,
            amount,
            participants: participantsList
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating split request:', error);
        
        if (error.message && error.message.includes('User not found with email')) {
            res.status(400).json({ message: error.message });
        } else if (error.code === 'ER_NO_REFERENCED_ROW') {
            res.status(400).json({ message: 'Invalid user or group reference' });
        } else if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: 'Duplicate split request' });
        } else {
            res.status(500).json({ message: 'Failed to create split request. Please try again.' });
        }
    } finally {
        connection.release();
    }
});

// Get all split requests for a user
router.get('/request/list', auth, async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        const [requests] = await connection.query(
            `SELECT sr.*,
                    u.full_name as requester_name,
                    COALESCE(eg.group_name, 'Direct Split') as group_name,
                    (SELECT COUNT(*) FROM split_participants WHERE split_request_id = sr.id) as participant_count,
                    (SELECT COUNT(*) FROM split_participants WHERE split_request_id = sr.id AND status = 'paid') as paid_count
             FROM split_requests sr
             JOIN users u ON sr.requester_id = u.id
            LEFT JOIN \`expense_groups\` eg ON sr.group_id = eg.id

             WHERE sr.requester_id = ?
                OR sr.id IN (
                    SELECT split_request_id
                    FROM split_participants
                    WHERE user_id = ?
                )
             ORDER BY sr.created_at DESC`,
            [req.user.id, req.user.id]
        );

        // Get participants for each request
        for (const request of requests) {
            const [participants] = await connection.query(
                `SELECT sp.*, u.email, u.full_name
                 FROM split_participants sp
                 JOIN users u ON sp.user_id = u.id
                 WHERE sp.split_request_id = ?`,
                [request.id]
            );
            request.participants = participants;
        }

        res.json({ requests });
    } catch (error) {
        console.error('Error fetching split requests:', error);
        res.status(500).json({ message: 'Failed to fetch split requests' });
    } finally {
        connection.release();
    }
});

// Get details of a specific split request
router.get('/request/:id', auth, async (req, res) => {
    try {
        const [request] = await req.pool.query(
            `SELECT sr.*,
                    u.full_name as requester_name,
                    eg.group_name
             FROM split_requests sr
             JOIN users u ON sr.requester_id = u.id
             LEFT JOIN \`expense_groups\` eg ON sr.group_id = eg.id
             WHERE sr.id = ?`,
            [req.params.id]
        );

        if (!request.length) {
            return res.status(404).json({ message: 'Split request not found' });
        }

        const [participants] = await req.pool.query(
            `SELECT sp.*, u.full_name, u.email
             FROM split_participants sp
             JOIN users u ON sp.user_id = u.id
             WHERE sp.split_request_id = ?`,
            [req.params.id]
        );

        const [payments] = await req.pool.query(
            `SELECT sp.*, spt.user_id, u.full_name as paid_by_name
             FROM split_payments sp
             JOIN split_participants spt ON sp.split_participant_id = spt.id
             JOIN users u ON spt.user_id = u.id
             WHERE spt.split_request_id = ?`,
            [req.params.id]
        );

        res.json({
            ...request[0],
            participants,
            payments
        });
    } catch (error) {
        console.error('Error fetching split request details:', error);
        res.status(500).json({ message: 'Failed to fetch split request details' });
    }
});

// Record a payment for a split request
router.post('/payment', auth, upload.single('payment_proof'), async (req, res) => {
    const connection = await req.pool.getConnection();
    try {
        const {
            split_participant_id,
            amount,
            payment_method,
            payment_reference,
            notes
        } = req.body;

        await connection.beginTransaction();

        // Record payment
        await connection.query(
            `INSERT INTO split_payments 
            (split_participant_id, amount, payment_method, payment_reference, payment_screenshot_url, notes) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                split_participant_id,
                amount,
                payment_method,
                payment_reference,
                req.file ? `/uploads/payments/${req.file.filename}` : null,
                notes
            ]
        );

        // Update participant's paid amount
        await connection.query(
            `UPDATE split_participants 
             SET amount_paid = amount_paid + ?,
                 status = CASE 
                    WHEN amount_paid + ? >= amount_owed THEN 'paid'
                    ELSE status 
                 END
             WHERE id = ?`,
            [amount, amount, split_participant_id]
        );

        // Check if all participants have paid and update split request status
        const [{ split_request_id }] = await connection.query(
            'SELECT split_request_id FROM split_participants WHERE id = ?',
            [split_participant_id]
        );

        const [{ total, paid }] = await connection.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid
             FROM split_participants
             WHERE split_request_id = ?`,
            [split_request_id]
        );

        if (paid === total) {
            await connection.query(
                'UPDATE split_requests SET status = ? WHERE id = ?',
                ['completed', split_request_id]
            );
        } else if (paid > 0) {
            await connection.query(
                'UPDATE split_requests SET status = ? WHERE id = ?',
                ['partially_paid', split_request_id]
            );
        }

        await connection.commit();
        res.json({ message: 'Payment recorded successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Failed to record payment' });
    } finally {
        connection.release();
    }
});

// Get all users except current user for split selection
router.get('/users', auth, async (req, res) => {
    try {
        const [users] = await req.pool.query(
            `SELECT id, email, full_name
             FROM users
             WHERE id != ?
             ORDER BY full_name ASC`,
            [req.user.id]
        );

        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// Send reminder to participants
router.post('/remind/:id', auth, async (req, res) => {
    try {
        const [request] = await req.pool.query(
            `SELECT * FROM split_requests WHERE id = ? AND requester_id = ?`,
            [req.params.id, req.user.id]
        );

        if (!request.length) {
            return res.status(403).json({ message: 'Not authorized to send reminders for this split' });
        }

        await req.pool.query(
            `UPDATE split_participants
             SET reminder_sent_at = CURRENT_TIMESTAMP
             WHERE split_request_id = ? AND status = 'pending'`,
            [req.params.id]
        );

        // TODO: Send actual reminder notifications/emails

        res.json({ message: 'Reminders sent successfully' });
    } catch (error) {
        console.error('Error sending reminders:', error);
        res.status(500).json({ message: 'Failed to send reminders' });
    }
});

module.exports = router;
