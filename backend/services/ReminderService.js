const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const pool = require('../db');

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Base URL for links (Production URL or Localhost)
const BASE_URL = process.env.APP_URL || process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`;

class ReminderService {
    // Schedule automatic reminders for pending splits
    static scheduleReminders() {
        // Run every day at 10 AM
        schedule.scheduleJob('0 10 * * *', async () => {
            try {
                const connection = await pool.getConnection();

                // Get pending split participants that haven't been reminded in 3 days
                const [pendingParticipants] = await connection.query(`
                    SELECT 
                        sp.id as participant_id,
                        sp.user_id,
                        sr.id as split_request_id,
                        sr.amount,
                        sr.description,
                        sr.requester_id,
                        u.email as participant_email,
                        u.full_name as participant_name,
                        req.full_name as requester_name,
                        sp.amount_owed,
                        DATEDIFF(CURRENT_TIMESTAMP, COALESCE(sp.reminder_sent_at, sr.created_at)) as days_since_reminder
                    FROM split_participants sp
                    JOIN split_requests sr ON sp.split_request_id = sr.id
                    JOIN users u ON sp.user_id = u.id
                    JOIN users req ON sr.requester_id = req.id
                    WHERE sp.status = 'pending'
                    AND (sp.reminder_sent_at IS NULL OR DATEDIFF(CURRENT_TIMESTAMP, sp.reminder_sent_at) >= 3)
                    AND sr.status != 'cancelled'
                `);

                for (const participant of pendingParticipants) {
                    await this.sendReminder(participant, connection);
                }

                connection.release();
            } catch (error) {
                console.error('Error in reminder scheduler:', error);
            }
        });
    }

    // Send individual reminder
    static async sendReminder(participant, connection) {
        try {
            // Create email content
            const emailContent = this.createReminderEmail(participant);

            // Send email
            await transporter.sendMail({
                from: '"Gamyartha" <noreply@gamyartha.com>',
                to: participant.participant_email,
                subject: 'Payment Reminder: Split Request Pending',
                html: emailContent
            });

            // Create in-app notification
            await connection.query(`
                INSERT INTO notifications (
                    user_id, 
                    type, 
                    title, 
                    message, 
                    split_request_id
                ) VALUES (?, ?, ?, ?, ?)
            `, [
                participant.user_id,
                'split_reminder',
                'Payment Reminder',
                `You have a pending payment of ₹${participant.amount_owed} for ${participant.description}`,
                participant.split_request_id
            ]);

            // Update reminder sent timestamp
            await connection.query(`
                UPDATE split_participants 
                SET reminder_sent_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [participant.participant_id]);

        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    }

    // Create reminder email content
    static createReminderEmail(participant) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #059669;">Payment Reminder</h2> 
                
                <p>Hello ${participant.participant_name},</p>
                
                <p>This is a friendly reminder about a pending split payment:</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Amount Due:</strong> ₹${participant.amount_owed}</p>
                    <p style="margin: 5px 0;"><strong>Description:</strong> ${participant.description}</p>
                    <p style="margin: 5px 0;"><strong>Requested By:</strong> ${participant.requester_name}</p>
                </div>

                <p>Please settle this payment at your earliest convenience.</p>

                <a href="${BASE_URL}/splits" 
                   style="display: inline-block; background-color: #059669; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    View Split Details
                </a>

                <p style="color: #6b7280; font-size: 0.9em; margin-top: 20px;">
                    If you've already made the payment, please mark it as paid in the app.
                </p>
            </div>
        `;
    }
}

module.exports = ReminderService;