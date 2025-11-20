class AIReportService {
    constructor(pool) {
        this.pool = pool;
    }

    // Get current mode for user
    async getCurrentMode(userId) {
        try {
            const connection = await this.pool.getConnection();
            const [settings] = await connection.execute(
                'SELECT setting_value FROM user_settings WHERE user_id = ? AND setting_key = ?',
                [userId, 'current_mode']
            );
            connection.release();

            return settings.length > 0 ? settings[0].setting_value : 'private';
        } catch (error) {
            console.error('Error getting current mode:', error);
            return 'private'; // Default to private mode
        }
    }

    // Set current mode for user
    async setCurrentMode(userId, mode) {
        try {
            const connection = await this.pool.getConnection();
            await connection.execute(
                'INSERT INTO user_settings (user_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [userId, 'current_mode', mode, mode]
            );
            connection.release();
            return true;
        } catch (error) {
            console.error('Error setting current mode:', error);
            return false;
        }
    }

    // Get current group for shared mode
    async getCurrentGroup(userId) {
        try {
            const connection = await this.pool.getConnection();
            const [settings] = await connection.execute(
                'SELECT setting_value FROM user_settings WHERE user_id = ? AND setting_key = ?',
                [userId, 'current_group']
            );
            connection.release();

            return settings.length > 0 ? parseInt(settings[0].setting_value) : null;
        } catch (error) {
            console.error('Error getting current group:', error);
            return null;
        }
    }

    // Set current group for shared mode
    async setCurrentGroup(userId, groupId) {
        try {
            const connection = await this.pool.getConnection();
            await connection.execute(
                'INSERT INTO user_settings (user_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [userId, 'current_group', groupId.toString(), groupId.toString()]
            );
            connection.release();
            return true;
        } catch (error) {
            console.error('Error setting current group:', error);
            return false;
        }
    }

    // Get user's groups for selection
    async getUserGroups(userId) {
        try {
            const connection = await this.pool.getConnection();
            const [groups] = await connection.execute(
                `SELECT eg.id, eg.group_name
                 FROM expense_groups eg
                 JOIN group_members gm ON eg.id = gm.group_id
                 WHERE gm.user_id = ?
                 ORDER BY eg.created_at DESC`,
                [userId]
            );
            connection.release();
            return groups;
        } catch (error) {
            console.error('Error getting user groups:', error);
            return [];
        }
    }

    // Get group balances for settlement calculation
    async getGroupBalances(groupId) {
        try {
            const connection = await this.pool.getConnection();
            const [balances] = await connection.execute(
                `SELECT gb.user_id, gb.net_balance, u.full_name, u.email
                 FROM group_balances gb
                 JOIN users u ON gb.user_id = u.id
                 WHERE gb.group_id = ?
                 ORDER BY gb.net_balance DESC`,
                [groupId]
            );
            connection.release();
            return balances;
        } catch (error) {
            console.error('Error getting group balances:', error);
            return [];
        }
    }

    // Calculate settlement suggestions
    calculateSettlements(balances) {
        const creditors = balances.filter(b => b.net_balance > 0);
        const debtors = balances.filter(b => b.net_balance < 0);

        const settlements = [];
        let i = 0, j = 0;

        while (i < creditors.length && j < debtors.length) {
            const creditor = creditors[i];
            const debtor = debtors[j];

            const amount = Math.min(creditor.net_balance, Math.abs(debtor.net_balance));

            if (amount > 0) {
                settlements.push({
                    from: debtor.full_name,
                    to: creditor.full_name,
                    amount: amount,
                    from_id: debtor.user_id,
                    to_id: creditor.user_id
                });
            }

            creditor.net_balance -= amount;
            debtor.net_balance += amount;

            if (creditor.net_balance <= 0) i++;
            if (debtor.net_balance >= 0) j++;
        }

        return settlements;
    }

    // Get private mode data for AI context
    async getPrivateData(userId) {
        try {
            const connection = await this.pool.getConnection();

            // Recent transactions
            const [transactions] = await connection.execute(
                'SELECT amount, description, category, type, transaction_date FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 20',
                [userId]
            );

            // Current budgets
            const [budgets] = await connection.execute(
                'SELECT category, amount FROM budgets WHERE user_id = ? AND month_year = DATE_FORMAT(NOW(), "%Y-%m")',
                [userId]
            );

            // Goals
            const [goals] = await connection.execute(
                'SELECT name, target_amount, saved_amount FROM goals WHERE user_id = ?',
                [userId]
            );

            connection.release();

            return {
                transactions,
                budgets,
                goals
            };
        } catch (error) {
            console.error('Error getting private data:', error);
            return { transactions: [], budgets: [], goals: [] };
        }
    }

    // Get shared mode data for AI context
    async getSharedData(groupId) {
        try {
            const connection = await this.pool.getConnection();

            // Group info
            const [groupInfo] = await connection.execute(
                'SELECT group_name FROM expense_groups WHERE id = ?',
                [groupId]
            );

            // Group balances
            const balances = await this.getGroupBalances(groupId);

            // Recent group expenses
            const [expenses] = await connection.execute(
                `SELECT ge.amount, ge.description, ge.category, u.full_name as paid_by
                 FROM group_expenses ge
                 JOIN users u ON ge.paid_by_user_id = u.id
                 WHERE ge.group_id = ?
                 ORDER BY ge.created_at DESC LIMIT 10`,
                [groupId]
            );

            connection.release();

            const settlements = this.calculateSettlements(balances);

            return {
                groupName: groupInfo.length > 0 ? groupInfo[0].group_name : 'Unknown Group',
                balances,
                settlements,
                recentExpenses: expenses
            };
        } catch (error) {
            console.error('Error getting shared data:', error);
            return { groupName: 'Unknown', balances: [], settlements: [], recentExpenses: [] };
        }
    }

    // Detect mode switch keywords
    detectModeSwitch(message) {
        const sharedKeywords = ["shared ledger mode", "shared mode", "group mode"];
        const privateKeywords = ["private mode"];

        if (sharedKeywords.some(kw => message.toLowerCase().includes(kw))) {
            return 'shared';
        } else if (privateKeywords.some(kw => message.toLowerCase().includes(kw))) {
            return 'private';
        }
        return null;
    }

    // Generate system prompt based on mode
    generateSystemPrompt(mode, language = 'en', groupData = null) {
        const languageNames = { en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada' };
        const currentLangName = languageNames[language] || 'English';

        if (mode === 'shared') {
            return `You are Gamyartha — India's smartest money companion.

You ALWAYS run in SHARED LEDGER MODE:

Rules:
- Talk ONLY about GROUP EXPENSES + who owes who
- Never reveal anyone's PERSONAL private spending
- Treat everyone equally
- If no group selected: ask "Which group? Give me group name or ID."

Language:
Always reply in simple friendly INDIAN ENGLISH.
Keep sentences short, clear, and practical.

Current group balances: ${JSON.stringify(groupData?.balances || [])}
Suggested settlements: ${JSON.stringify(groupData?.settlements || [])}`;
        } else {
            return `You are Gamyartha — India's smartest money companion.

You ALWAYS run in PRIVATE MODE:

Rules:
- Only use the USER'S PERSONAL DATA
- Never talk about groups or other people
- Give personal finance advice, saving tactics, personal budget optimizations

Language:
Always reply in simple friendly INDIAN ENGLISH.
Keep sentences short, clear, and practical.`;
        }
    }
}

module.exports = AIReportService;
