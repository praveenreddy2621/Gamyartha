const schedule = require('node-schedule');
const mailerUtils = require('../utils/mailer');

class ObligationReminderService {
    constructor(pool) {
        if (!pool) {
            throw new Error("Database connection pool is required for ObligationReminderService.");
        }
        this.pool = pool;
    }

    /**
     * Schedules a job to run daily to send reminders for obligations due on the current day.
     */
    scheduleObligationReminders() {
        // Schedule to run every day at 8:00 AM server time.
        schedule.scheduleJob('0 8 * * *', async () => {
            console.log('Scheduler: Running daily check for due obligations...');
            try {
                const connection = await this.pool.getConnection();

                // Find all unpaid obligations due today for users who have email alerts enabled.
                const [dueTodayObligations] = await connection.query(`
                    SELECT 
                        o.user_id,
                        o.description,
                        o.amount,
                        o.due_date AS dueDate,
                        u.email AS to_email,
                        u.full_name AS user_name
                    FROM obligations o
                    JOIN users u ON o.user_id = u.id
                    WHERE o.is_paid = FALSE
                      AND o.due_date = CURDATE()
                      AND u.email_alerts_enabled = TRUE
                `);

                console.log(`Scheduler: Found ${dueTodayObligations.length} obligations due today.`);

                // Send an email and notification for each due obligation.
                for (const obligation of dueTodayObligations) {
                    await this.sendReminderWithNotification(obligation, connection);
                }

                connection.release();
            } catch (error) {
                console.error('Scheduler Error: Failed to process obligation reminders.', error);
            }
        });

        console.log('Obligation reminder service has been scheduled to run daily at 8:00 AM.');
    }

    /**
     * Sends a due date alert email for a specific obligation.
     * @param {object} obligation - The obligation details, matching the 'dueDateAlert' template data.
     */
    async sendDueObligationEmail(obligation) {
        // Find user_id from obligation email (this is a bit inefficient, but obligation object structure is limited in the query)
        // A better way is to select user_id in the original query.

        await mailerUtils.sendEmail('dueDateAlert', obligation);
    }

    /**
     * Enhanced version that accepts the full context to save notification
     */
    async sendReminderWithNotification(obligation, connection) {
        // Send Email
        await this.sendDueObligationEmail(obligation);

        // Create In-App Notification
        try {
            // We need user_id. The previous query joined users but didn't select user_id.
            // Let's assume the caller will fix the query.
            if (obligation.user_id) {
                await connection.query(
                    `INSERT INTO notifications (user_id, type, title, message) 
                     VALUES (?, 'obligation_due', 'Bill Due Today', ?)`,
                    [obligation.user_id, `Reminder: Your bill for ${obligation.description} (${obligation.amount}) is due today.`]
                );
            }
        } catch (e) {
            console.error('Failed to create obligation notification', e);
        }
    }
}

module.exports = ObligationReminderService;