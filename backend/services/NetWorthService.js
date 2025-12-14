class NetWorthService {
    // constructor(pool) {
    //     this.pool = pool;
    // }

    async getAssets(pool, userId) {
        const [rows] = await pool.query(
            'SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    async addAsset(pool, userId, data) {
        const { name, type, amount, description, currency } = data;
        const [result] = await pool.query(
            'INSERT INTO assets (user_id, name, type, amount, description, currency) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name, type, amount, description, currency || 'INR']
        );
        return result.insertId;
    }

    async updateAsset(pool, id, userId, data) {
        const { name, type, amount, description, currency } = data;
        await pool.query(
            'UPDATE assets SET name = ?, type = ?, amount = ?, description = ?, currency = ? WHERE id = ? AND user_id = ?',
            [name, type, amount, description, currency || 'INR', id, userId]
        );
        return true;
    }

    async deleteAsset(pool, id, userId) {
        await pool.query(
            'DELETE FROM assets WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return true;
    }

    async getNetWorthSummary(pool, userId) {
        const assets = await this.getAssets(pool, userId);

        let totalAssets = 0;
        let totalLiabilities = 0;

        const assetTypes = ['cash', 'investment', 'real_estate', 'vehicle', 'valuable'];
        const liabilityTypes = ['loan', 'credit_card', 'other_liability'];

        assets.forEach(item => {
            const amount = parseFloat(item.amount);
            if (assetTypes.includes(item.type)) {
                totalAssets += amount;
            } else if (liabilityTypes.includes(item.type)) {
                totalLiabilities += amount;
            }
        });

        return {
            totalAssets,
            totalLiabilities,
            netWorth: totalAssets - totalLiabilities,
            details: assets
        };
    }
}

module.exports = NetWorthService;
