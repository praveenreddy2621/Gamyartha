const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BudgetService = require('../services/BudgetService');

// Create or update a budget
router.post('/', auth, async (req, res) => {
    try {
        const { category, amount, monthYear } = req.body;

        if (!category || !amount || !monthYear) {
            return res.status(400).json({
                error: 'Category, amount and monthYear are required'
            });
        }

        // Validate monthYear format (YYYY-MM)
        if (!/^\d{4}-\d{2}$/.test(monthYear)) {
            return res.status(400).json({
                error: 'monthYear must be in YYYY-MM format'
            });
        }

        const budgetService = new BudgetService(req.pool);
        const budgetId = await budgetService.createOrUpdateBudget(
            req.user.id,
            category,
            amount,
            monthYear,
            req.user.currency || 'INR' // Automatically use user's currency
        );

        res.json({
            message: 'Budget created/updated successfully',
            budgetId
        });

    } catch (error) {
        console.error('Create/update budget error:', error);
        res.status(500).json({ error: 'Failed to create/update budget' });
    }
});

// Get budgets for current month
router.get('/', auth, async (req, res) => {
    try {
        const budgetService = new BudgetService(req.pool);
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        const budgets = await budgetService.getBudgets(req.user.id, currentMonth);
        res.json({ budgets });

    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Failed to get budgets' });
    }
});

// Get budgets for specific month
router.get('/:month', auth, async (req, res) => {
    try {
        const { month } = req.params;

        // Validate month format (YYYY-MM)
        if (!/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({
                error: 'Month parameter must be in YYYY-MM format'
            });
        }

        const budgetService = new BudgetService(req.pool);
        const budgets = await budgetService.getBudgets(req.user.id, month);
        res.json({ budgets });

    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Failed to get budgets' });
    }
});

// Delete a budget
router.delete('/:id', auth, async (req, res) => {
    try {
        const budgetService = new BudgetService(req.pool);
        const success = await budgetService.deleteBudget(req.params.id, req.user.id);

        if (!success) {
            return res.status(404).json({
                error: 'Budget not found or unauthorized'
            });
        }

        res.json({ message: 'Budget deleted successfully' });

    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

// Clear all budgets
router.delete('/', auth, async (req, res) => {
    try {
        const budgetService = new BudgetService(req.pool);
        // Assuming budgetService might not have deleteAll, let's check its code or just use SQL here if service is simple wrapper.
        // Wait, I should verify BudgetService.
        // Let's just use raw SQL with req.pool if I can, or check service.
        // req.pool is available.
        const connection = await req.pool.getConnection();
        await connection.execute(
            'DELETE FROM budgets WHERE user_id = ?',
            [req.user.id]
        );
        connection.release();

        res.json({ message: 'All budgets cleared successfully' });

    } catch (error) {
        console.error('Clear budgets error:', error);
        res.status(500).json({ error: 'Failed to clear budgets' });
    }
});

module.exports = router;