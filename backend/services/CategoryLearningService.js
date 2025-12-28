class CategoryLearningService {
    constructor(pool) {
        this.pool = pool;
    }

    async addRule(userId, keyword, category) {
        // Simple normalization
        const normalizedKeyword = keyword.trim();
        const normalizedCategory = category.trim();

        if (!normalizedKeyword || !normalizedCategory) return false;

        const connection = await this.pool.getConnection();
        try {
            // Check if rule exists
            const [existing] = await connection.execute(
                'SELECT id FROM category_rules WHERE user_id = ? AND keyword = ?',
                [userId, normalizedKeyword]
            );

            if (existing.length > 0) {
                // Update
                await connection.execute(
                    'UPDATE category_rules SET category = ? WHERE id = ?',
                    [normalizedCategory, existing[0].id]
                );
            } else {
                // Insert
                await connection.execute(
                    'INSERT INTO category_rules (user_id, keyword, category) VALUES (?, ?, ?)',
                    [userId, normalizedKeyword, normalizedCategory]
                );
            }
            return true;
        } catch (error) {
            console.error('Error adding category rule:', error);
            return false;
        } finally {
            connection.release();
        }
    }

    async getUserRules(userId) {
        const connection = await this.pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT keyword, category FROM category_rules WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            return rows; // [{keyword: 'Uber', category: 'Travel'}, ...]
        } finally {
            connection.release();
        }
    }

    async getSystemPromptSupplement(userId) {
        const rules = await this.getUserRules(userId);
        if (rules.length === 0) return '';

        const ruleStrings = rules.map(r => `"${r.keyword}" -> "${r.category}"`).join('\n');
        return `\n[User Manual Categorization Rules - STRICTLY FOLLOW THESE]\nIf the transaction description contains these keywords, use the specified category:\n${ruleStrings}\n`;
    }
}

module.exports = CategoryLearningService;
