const mysql = require('mysql2/promise');

class BudgetService {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Create or update a budget for a category and month
     */
    async createOrUpdateBudget(userId, category, amount, monthYear, currency) {
        const connection = await this.pool.getConnection();
        try {
            // Use INSERT ... ON DUPLICATE KEY UPDATE for an atomic "upsert" operation
            const [result] = await connection.query(
                `INSERT INTO budgets (user_id, category, amount, month_year, currency) 
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE amount = VALUES(amount), updated_at = CURRENT_TIMESTAMP`,
                [userId, category, amount, monthYear, currency]
            );

            // If a new row was inserted, insertId will be the new ID.
            // If a row was updated, insertId will be the ID of the updated row (in most configurations).
            if (result.insertId > 0) {
                return result.insertId;
            } else {
                // If it was an update, we need to get the ID of the row that was updated.
                const [updatedRows] = await connection.query('SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month_year = ?', [userId, category, monthYear]);
                return updatedRows[0].id;
            }
        } finally {
            connection.release();
        }
    }

    /**
     * Get all budgets for a user for a specific month
     */
    async getBudgets(userId, monthYear) {
        const connection = await this.pool.getConnection();
        try {
            const [budgets] = await connection.query(
                `SELECT b.*, 
                    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as spent_amount,
                    CASE 
                        WHEN COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) > b.amount 
                        THEN true 
                        ELSE false 
                    END as is_exceeded
                FROM budgets b
                LEFT JOIN transactions t ON b.user_id = t.user_id 
                    AND b.category = t.category 
                    AND DATE_FORMAT(t.transaction_date, '%Y-%m') = b.month_year
                WHERE b.user_id = ? 
                    AND b.month_year = ?
                GROUP BY b.id`,
                [userId, monthYear]
            );
            return budgets;
        } finally {
            connection.release();
        }
    }

    /**
     * Delete a budget record
     */
    async deleteBudget(budgetId, userId) {
        const connection = await this.pool.getConnection();
        try {
            const [result] = await connection.query(
                'DELETE FROM budgets WHERE id = ? AND user_id = ?',
                [budgetId, userId]
            );
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    /**
     * Check if budget is exceeded for a category and month
     */
    async checkBudgetExceeded(userId, category, amount, transactionDate) {
        const connection = await this.pool.getConnection();
        try {
            // Get the month-year from transaction date
            const monthYear = transactionDate.substring(0, 7); // Format: YYYY-MM
            
            // Get budget and current spending for the category
            const [budgets] = await connection.query(
                `SELECT b.*, 
                    COALESCE(SUM(t.amount), 0) as current_spent
                FROM budgets b
                LEFT JOIN transactions t ON b.user_id = t.user_id 
                    AND b.category = t.category 
                    AND DATE_FORMAT(t.transaction_date, '%Y-%m') = b.month_year
                    AND t.type = 'expense'
                WHERE b.user_id = ? 
                    AND b.category = ? 
                    AND b.month_year = ?
                GROUP BY b.id`,
                [userId, category, monthYear]
            );

            if (budgets.length === 0) {
                return null; // No budget set for this category
            }

            const budget = budgets[0];
            const totalSpent = parseFloat(budget.current_spent) + parseFloat(amount);

            if (totalSpent > budget.amount) {
                return {
                    warning: `🚨 You have exceeded your monthly ${category} budget.`,
                    budgetAmount: budget.amount,
                    spentAmount: totalSpent
                };
            }

            return null;
        } finally {
            connection.release();
        }
    }
}

module.exports = BudgetService;