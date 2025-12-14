const express = require('express');
const router = express.Router();
const NetWorthService = require('../services/NetWorthService');
const authenticateToken = require('../middleware/auth');

const netWorthService = new NetWorthService();

// Get all assets and summary
router.get('/', authenticateToken, async (req, res) => {
    try {
        const summary = await netWorthService.getNetWorthSummary(req.pool, req.user.id);
        res.json(summary);
    } catch (error) {
        console.error('Error fetching net worth:', error);
        res.status(500).json({ error: 'Failed to fetch net worth data' });
    }
});

// Add new asset/liability
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, type, amount, description } = req.body;

        if (!name || !type || amount === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const id = await netWorthService.addAsset(req.pool, req.user.id, req.body);
        res.status(201).json({ message: 'Asset added successfully', id });
    } catch (error) {
        console.error('Error adding asset:', error);
        res.status(500).json({ error: 'Failed to add asset' });
    }
});

// Update asset/liability
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, type, amount, description } = req.body;
        await netWorthService.updateAsset(req.pool, req.params.id, req.user.id, req.body);
        res.json({ message: 'Asset updated successfully' });
    } catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).json({ error: 'Failed to update asset' });
    }
});

// Delete asset/liability
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await netWorthService.deleteAsset(req.pool, req.params.id, req.user.id);
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
});

module.exports = router;
