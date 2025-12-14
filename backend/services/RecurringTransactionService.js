class RecurringTransactionService {
    constructor(pool) {
        this.pool = pool;
    }

    async createRecurringTransaction(userId, data) {
        try {
            const { amount, description, category, type, frequency, start_date, payment_mode } = data;
            const connection = await this.pool.getConnection();

            // Calculate first due date
            const nextDue = new Date(start_date);

            const [result] = await connection.execute(
                `INSERT INTO recurring_transactions 
                (user_id, amount, description, category, type, frequency, start_date, next_due_date, payment_mode) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, amount, description, category, type, frequency, start_date, nextDue, payment_mode || 'auto']
            );

            connection.release();
            return result.insertId;
        } catch (error) {
            console.error('Error creating recurring transaction:', error);
            throw error;
        }
    }

    async processDueTransactions() {
        try {
            const connection = await this.pool.getConnection();
            const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

            // Find due transactions
            const [dueTxns] = await connection.execute(
                `SELECT * FROM recurring_transactions 
                 WHERE is_active = TRUE AND next_due_date <= ?`,
                [today]
            );

            console.log(`Processing ${dueTxns.length} recurring transactions...`);

            for (const txn of dueTxns) {
                // Calculate next due date first
                const currentDue = new Date(txn.next_due_date);
                let nextDue = new Date(currentDue);

                switch (txn.frequency) {
                    case 'daily': nextDue.setDate(currentDue.getDate() + 1); break;
                    case 'weekly': nextDue.setDate(currentDue.getDate() + 7); break;
                    case 'monthly': nextDue.setMonth(currentDue.getMonth() + 1); break;
                    case 'yearly': nextDue.setFullYear(currentDue.getFullYear() + 1); break;
                }

                // Get user details
                const [users] = await connection.execute(
                    'SELECT email, full_name, email_alerts_enabled FROM users WHERE id = ?',
                    [txn.user_id]
                );

                if (txn.payment_mode === 'auto') {
                    // AUTO-PAY MODE: Create transaction automatically
                    await connection.execute(
                        `INSERT INTO transactions 
                        (user_id, amount, description, category, type, is_business, transaction_date) 
                        VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
                        [txn.user_id, txn.amount, `${txn.description} (Recurring)`, txn.category, txn.type, txn.next_due_date]
                    );

                    // Update next due date
                    await connection.execute(
                        `UPDATE recurring_transactions 
                         SET next_due_date = ?, last_processed_date = ? 
                         WHERE id = ?`,
                        [nextDue, currentDue, txn.id]
                    );

                    // Create Notification
                    await connection.execute(
                        `INSERT INTO notifications (user_id, type, title, message) 
                         VALUES (?, 'recurring_processed', 'Subscription Renewed', ?)`,
                        [txn.user_id, `Your subscription for ${txn.description} (₹${txn.amount}) has been processed.`]
                    );

                    // Send Email
                    if (users.length > 0 && users[0].email_alerts_enabled) {
                        try {
                            const mailerUtils = require('../utils/mailer');
                            await mailerUtils.sendEmail('subscriptionRenewed', {
                                to_email: users[0].email,
                                user_name: users[0].full_name,
                                description: txn.description,
                                amount: txn.amount,
                                frequency: txn.frequency,
                                next_due_date: nextDue
                            });
                            console.log(`✅ Auto-pay renewal email sent to ${users[0].email}`);
                        } catch (emailError) {
                            console.error('Failed to send subscription email:', emailError);
                        }
                    }
                } else {
                    // MANUAL MODE: Create an obligation so user can track and pay it
                    await connection.execute(
                        `INSERT INTO obligations (user_id, description, amount, due_date, status) 
                         VALUES (?, ?, ?, ?, 'pending')`,
                        [txn.user_id, `${txn.description} (Subscription)`, txn.amount, txn.next_due_date]
                    );

                    // Create Notification
                    await connection.execute(
                        `INSERT INTO notifications (user_id, type, title, message) 
                         VALUES (?, 'obligation_due', 'Payment Due', ?)`,
                        [txn.user_id, `Payment due for ${txn.description} (₹${txn.amount}). Please mark as paid when completed.`]
                    );

                    // Send Email Reminder
                    if (users.length > 0 && users[0].email_alerts_enabled) {
                        try {
                            const mailerUtils = require('../utils/mailer');
                            await mailerUtils.sendEmail('dueDateAlert', {
                                to_email: users[0].email,
                                user_name: users[0].full_name,
                                description: txn.description,
                                amount: txn.amount,
                                dueDate: txn.next_due_date
                            });
                            console.log(`✅ Payment reminder sent to ${users[0].email}`);
                        } catch (emailError) {
                            console.error('Failed to send reminder email:', emailError);
                        }
                    }

                    // Update next due date (so reminder isn't sent every day)
                    await connection.execute(
                        `UPDATE recurring_transactions 
                         SET next_due_date = ? 
                         WHERE id = ?`,
                        [nextDue, txn.id]
                    );
                }
            }

            connection.release();
            return dueTxns.length;
        } catch (error) {
            console.error('Error processing recurring transactions:', error);
            throw error;
        }
    }

    async getRecurringTransactions(userId) {
        try {
            const connection = await this.pool.getConnection();
            const [txns] = await connection.execute(
                'SELECT * FROM recurring_transactions WHERE user_id = ? ORDER BY next_due_date ASC',
                [userId]
            );
            connection.release();
            return txns;
        } catch (error) {
            console.error('Error fetching recurring transactions:', error);
            throw error;
        }
    }
    async updateRecurringTransaction(userId, id, data) {
        try {
            const { amount, description, category, type, frequency, is_active, payment_mode } = data;
            const connection = await this.pool.getConnection();

            const [result] = await connection.execute(
                `UPDATE recurring_transactions 
                 SET amount = ?, description = ?, category = ?, type = ?, frequency = ?, is_active = ?, payment_mode = ?
                 WHERE id = ? AND user_id = ?`,
                [amount, description, category, type, frequency, is_active, payment_mode || 'auto', id, userId]
            );

            connection.release();
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating recurring transaction:', error);
            throw error;
        }
    }

    async deleteRecurringTransaction(userId, id) {
        try {
            const connection = await this.pool.getConnection();
            const [result] = await connection.execute(
                'DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?',
                [id, userId]
            );
            connection.release();
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting recurring transaction:', error);
            throw error;
        }
    }

    async markAsPaid(userId, id) {
        try {
            const connection = await this.pool.getConnection();

            // Get the recurring transaction
            const [txns] = await connection.execute(
                'SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if (txns.length === 0) {
                connection.release();
                return false;
            }

            const txn = txns[0];

            // Create the transaction
            await connection.execute(
                `INSERT INTO transactions 
                (user_id, amount, description, category, type, is_business, transaction_date) 
                VALUES (?, ?, ?, ?, ?, FALSE, CURDATE())`,
                [txn.user_id, txn.amount, `${txn.description} (Manual Payment)`, txn.category, txn.type]
            );

            // Calculate next due date
            const currentDue = new Date(txn.next_due_date);
            let nextDue = new Date(currentDue);

            switch (txn.frequency) {
                case 'daily': nextDue.setDate(currentDue.getDate() + 1); break;
                case 'weekly': nextDue.setDate(currentDue.getDate() + 7); break;
                case 'monthly': nextDue.setMonth(currentDue.getMonth() + 1); break;
                case 'yearly': nextDue.setFullYear(currentDue.getFullYear() + 1); break;
            }

            // Update next due date
            await connection.execute(
                'UPDATE recurring_transactions SET next_due_date = ?, last_processed_date = CURDATE() WHERE id = ?',
                [nextDue, id]
            );

            // Remove pending notifications for this subscription
            await connection.execute(
                `DELETE FROM notifications 
                 WHERE user_id = ? AND type = 'obligation_due' 
                 AND message LIKE ?`,
                [userId, `%${txn.description}%`]
            );

            // Send confirmation email
            const [users] = await connection.execute(
                'SELECT email, full_name, email_alerts_enabled FROM users WHERE id = ?',
                [userId]
            );

            if (users.length > 0 && users[0].email_alerts_enabled) {
                try {
                    const mailerUtils = require('../utils/mailer');
                    await mailerUtils.sendEmail('transactionAlert', {
                        to_email: users[0].email,
                        user_name: users[0].full_name,
                        description: `${txn.description} - Payment Confirmed`,
                        amount: txn.amount,
                        category: txn.category,
                        transaction_type: txn.type
                    });
                    console.log(`✅ Payment confirmation email sent to ${users[0].email}`);
                } catch (emailError) {
                    console.error('Failed to send confirmation email:', emailError);
                }
            }

            connection.release();
            return true;
        } catch (error) {
            console.error('Error marking as paid:', error);
            throw error;
        }
    }
}

module.exports = RecurringTransactionService;
