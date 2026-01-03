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
        // Schedule to run every hour to ensure no reminders are missed.
        schedule.scheduleJob('0 * * * *', async () => {
            console.log('Scheduler: Running hourly check for due obligations...');
            try {
                const connection = await this.pool.getConnection();

                // Find all unpaid obligations due today for users who have email alerts enabled
                // AND haven't been reminded today.
                const [dueTodayObligations] = await connection.query(`
                    SELECT 
                        o.id,
                        o.user_id,
                        o.description,
                        o.amount,
                        o.due_date AS dueDate,
                        u.email AS to_email,
                        u.full_name AS user_name
                    FROM obligations o
                    JOIN users u ON o.user_id = u.id
                    WHERE o.is_paid = FALSE
                      AND o.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                      AND u.email_alerts_enabled = TRUE
                      AND (o.last_reminded_at IS NULL OR o.last_reminded_at != CURDATE())
                `);

                console.log(`Scheduler: Found ${dueTodayObligations.length} obligations due today to remind.`);

                // Send an email and notification for each due obligation.
                for (const obligation of dueTodayObligations) {
                    await this.sendReminderWithNotification(obligation, connection);

                    // Update last_reminded_at
                    await connection.query(
                        'UPDATE obligations SET last_reminded_at = CURDATE() WHERE id = ?',
                        [obligation.id]
                    );
                }

                connection.release();
            } catch (error) {
                console.error('Scheduler Error: Failed to process obligation reminders.', error);
            }
        });

        console.log('Obligation reminder service has been scheduled to run hourly.');
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
                const isDueTomorrow = new Date(obligation.dueDate) > new Date();
                const title = isDueTomorrow ? 'Bill Due Tomorrow' : 'Bill Due Today';
                const message = isDueTomorrow
                    ? `Upcoming Bill: ${obligation.description} (${obligation.amount}) is due tomorrow.`
                    : `Reminder: Your bill for ${obligation.description} (${obligation.amount}) is due today.`;

                await connection.query(
                    `INSERT INTO notifications (user_id, type, title, message) 
                     VALUES (?, 'obligation_due', ?, ?)`,
                    [obligation.user_id, title, message]
                );
            }
        } catch (e) {
            console.error('Failed to create obligation notification', e);
        }
    }
}

module.exports = ObligationReminderService;