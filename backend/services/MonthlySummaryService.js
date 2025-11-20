const mysql = require('mysql2/promise');
const { sendEmail } = require('../utils/mailer');

class MonthlySummaryService {
    constructor(pool) {
        this.pool = pool;
    }

    async sendMonthlySummaries() {
        try {
            // Get all users with email alerts enabled
            const [users] = await this.pool.query(
                'SELECT id, email, full_name FROM users WHERE email_alerts_enabled = true'
            );

            for (const user of users) {
                try {
                    const summaryData = await this.getMonthlySummary(user.id);

                    if (summaryData) {
                        await sendEmail('monthlySummary', {
                            to_email: user.email,
                            user_name: user.full_name || user.email.split('@')[0],
                            ...summaryData
                        });
                        console.log(`Monthly summary sent to ${user.email}`);
                    }
                } catch (error) {
                    console.error(`Failed to send monthly summary to ${user.email}:`, error);
                }
            }
        } catch (error) {
            console.error('Error sending monthly summaries:', error);
        }
    }

    async getMonthlySummary(userId) {
        const connection = await this.pool.getConnection();
        try {
            // Get previous month (current month - 1)
            const now = new Date();
            const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const monthYear = previousMonth.toISOString().slice(0, 7); // YYYY-MM
            const monthName = previousMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

            // Get total income and expense for previous month
            const [totals] = await connection.query(
                `SELECT
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
                 FROM transactions
                 WHERE user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
                [userId, monthYear]
            );

            if (totals.length === 0 || (!totals[0].total_income && !totals[0].total_expense)) {
                return null; // No transactions for the month
            }

            const totalIncome = parseFloat(totals[0].total_income || 0);
            const totalExpense = parseFloat(totals[0].total_expense || 0);
            const savings = totalIncome - totalExpense;

            // Get top 3 spending categories
            const [categories] = await connection.query(
                `SELECT category, SUM(amount) as amount
                 FROM transactions
                 WHERE user_id = ? AND type = 'expense' AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
                 GROUP BY category
                 ORDER BY amount DESC
                 LIMIT 3`,
                [userId, monthYear]
            );

            return {
                month_name: monthName,
                total_income: totalIncome,
                total_expense: totalExpense,
                savings: savings,
                top_categories: categories,
                is_negative_savings: savings < 0
            };

        } finally {
            connection.release();
        }
    }
}

module.exports = MonthlySummaryService;
