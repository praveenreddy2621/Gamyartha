const { getOrSet, invalidate } = require('../utils/redisClient');

class ChallengeService {
    constructor(pool) {
        this.pool = pool;
    }

    // Get all available challenges (active and upcoming)
    async getChallenges(userId) {
        // We don't cache deeply here because individual user participation status varies
        const connection = await this.pool.getConnection();
        try {
            const [challenges] = await connection.execute(`
                SELECT c.*, 
                       CASE WHEN cp.id IS NOT NULL THEN TRUE ELSE FALSE END as is_joined,
                       cp.current_score,
                       cp.joined_at,
                       (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as participant_count
                FROM savings_challenges c
                LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id AND cp.user_id = ?
                WHERE c.status IN ('active', 'upcoming')
                ORDER BY c.start_date ASC
            `, [userId]);
            return challenges;
        } finally {
            connection.release();
        }
    }

    // Join a challenge
    async joinChallenge(userId, challengeId) {
        const connection = await this.pool.getConnection();
        try {
            await connection.execute(`
                INSERT INTO challenge_participants (challenge_id, user_id)
                VALUES (?, ?)
            `, [challengeId, userId]);

            return { success: true, message: "Joined challenge successfully!" };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: "You have already joined this challenge." };
            }
            throw error;
        } finally {
            connection.release();
        }
    }

    // Update progress for all participants of active challenges
    // This is a heavy operation, usually run by a cron job or daily trigger
    async updateChallengeProgress() {
        // Logic to calculate progress based on transactions
        // For 'lowest_spend', we sum expenses in target_category during the challenge period
        // For now, we'll keep it simple and just set a placeholder. 
        // Real implementation requires complex aggregation of the transactions table.
        console.log("Challenge progress update triggered (Implementation Pending)");
    }
    async getLeaderboard(challengeId) {
        const connection = await this.pool.getConnection();
        try {
            // Fetch top 10 participants ordered by score (Assuming lower score is better for spend challenges, higher for savings)
            // We need to know the winning_criteria to notify sort order
            const [challenges] = await connection.execute(
                'SELECT winning_criteria FROM savings_challenges WHERE id = ?',
                [challengeId]
            );

            if (challenges.length === 0) return [];
            const criteria = challenges[0].winning_criteria;
            const sortOrder = criteria === 'lowest_spend' ? 'ASC' : 'DESC';

            const [leaderboard] = await connection.execute(`
                SELECT u.full_name as name, cp.current_score
                FROM challenge_participants cp
                JOIN users u ON cp.user_id = u.id
                WHERE cp.challenge_id = ?
                ORDER BY cp.current_score ${sortOrder}
                LIMIT 10
            `, [challengeId]);

            return leaderboard;
        } finally {
            connection.release();
        }
    }
}

module.exports = ChallengeService;
