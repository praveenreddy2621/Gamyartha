const { getOrSet, invalidate } = require('../utils/redisClient');

class GamificationService {
    constructor(pool) {
        this.pool = pool;
    }

    // Helper to get all badges for a user (earned + unearned)
    async getUserBadges(userId) {
        // Cache key for this user's badges
        const cacheKey = `badges:${userId}`;

        return await getOrSet(cacheKey, 600, async () => {
            try {
                const connection = await this.pool.getConnection();

                const [badges] = await connection.execute(`
                    SELECT b.*, 
                           CASE WHEN ub.id IS NOT NULL THEN TRUE ELSE FALSE END as is_earned,
                           ub.awarded_at
                    FROM badges b
                    LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
                    ORDER BY is_earned DESC, b.criteria_threshold ASC
                `, [userId]);

                connection.release();
                return badges;
            } catch (error) {
                console.error('Error fetching badges:', error);
                throw error;
            }
        });
    }

    // Check specific actions and award badges
    async checkAndAwardBadges(userId, actionType, actionValue = 0) {
        try {
            const connection = await this.pool.getConnection();
            const earnedBadges = [];

            // 1. Get potential badges for this criteria type that user hasn't earned yet
            const [potentialBadges] = await connection.execute(`
                SELECT b.* 
                FROM badges b
                LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
                WHERE ub.id IS NULL 
                AND b.criteria_type = ?
            `, [userId, actionType]);

            // 2. Fetch current stats based on criteria_type
            let currentMetric = 0;

            if (actionType === 'login_count') {
                // For login, we just assume +1 or fetch from user stats if we tracked it separately.
                // For simplicity, we'll verify actionValue provided
                currentMetric = actionValue;
            } else if (actionType === 'budget_count') {
                const [rows] = await connection.execute('SELECT COUNT(*) as count FROM budgets WHERE user_id = ?', [userId]);
                currentMetric = rows[0].count;
            } else if (actionType === 'total_saved') {
                const [rows] = await connection.execute('SELECT SUM(saved_amount) as total FROM goals WHERE user_id = ?', [userId]);
                currentMetric = parseFloat(rows[0].total) || 0;
            } else if (actionType === 'obligation_paid') {
                const [rows] = await connection.execute('SELECT COUNT(*) as count FROM obligations WHERE user_id = ? AND is_paid = TRUE', [userId]);
                currentMetric = rows[0].count;
            }

            // 3. Award badges if threshold met
            for (const badge of potentialBadges) {
                if (currentMetric >= parseFloat(badge.criteria_threshold)) {
                    await connection.execute(
                        'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
                        [userId, badge.id]
                    );
                    earnedBadges.push(badge);

                    // Invalidate cache immediately when a new badge is earned
                    await invalidate(`badges:${userId}`);
                }
            }

            connection.release();
            return earnedBadges; // Return newly earned badges to show alert
        } catch (error) {
            console.error('Error checking badges:', error);
            return [];
        }
    }
}

module.exports = GamificationService;
