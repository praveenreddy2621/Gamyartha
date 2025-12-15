const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function migrate() {
    let connection;
    try {
        console.log('Starting Shared Features migration...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Add group_id to goals
        try {
            console.log("Adding 'group_id' to 'goals'...");
            await connection.query(`
                ALTER TABLE goals
                ADD COLUMN group_id INT DEFAULT NULL,
                ADD FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE;
            `);
            console.log("✅ Added 'group_id' to 'goals'.");
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ 'group_id' column already exists in 'goals'.");
            } else {
                console.error("❌ Failed to alter 'goals':", error.message);
            }
        }

        // 2. Add group_id to budgets
        try {
            console.log("Adding 'group_id' to 'budgets'...");
            // budgets has a unique key: unique_user_category_month (user_id, category, month_year)
            // We need to drop that constraint and replace it with (user_id, group_id, category, month_year)
            // or just allow multiple same-category budgets if group_id is different.

            // First add the column
            await connection.query(`
                ALTER TABLE budgets
                ADD COLUMN group_id INT DEFAULT NULL,
                ADD FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE;
            `);
            console.log("✅ Added 'group_id' to 'budgets'.");

            // Drop old unique index if exists
            try {
                await connection.query(`ALTER TABLE budgets DROP INDEX unique_user_category_month`);
                console.log("✅ Dropped old unique index on budgets.");
            } catch (e) {
                console.log("ℹ️ Old unique index might not exist or already dropped.");
            }

            // Create new unique index that includes group_id (handling NULL is tricky in MySQL unique indexes, 
            // usually NULL != NULL, so strict uniqueness might be relaxed or handled by app logic.
            // For now, let's just make it a non-unique index to prevent errors, or rely on app logic.)
            await connection.query(`
                CREATE UNIQUE INDEX unique_budget_entry ON budgets (user_id, category, month_year, group_id);
            `);

        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ 'group_id' column already exists in 'budgets'.");
            } else {
                console.error("❌ Failed to alter 'budgets':", error.message);
            }
        }

        // 3. Add group_id to obligations
        try {
            console.log("Adding 'group_id' to 'obligations'...");
            await connection.query(`
                ALTER TABLE obligations
                ADD COLUMN group_id INT DEFAULT NULL,
                ADD FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE;
            `);
            console.log("✅ Added 'group_id' to 'obligations'.");
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ 'group_id' column already exists in 'obligations'.");
            } else {
                console.error("❌ Failed to alter 'obligations':", error.message);
            }
        }

        // 4. Add type and category to group_expenses
        try {
            console.log("Adding 'type' and 'category' to 'group_expenses'...");

            // Add type
            try {
                await connection.query(`
                    ALTER TABLE group_expenses
                    ADD COLUMN type ENUM('expense', 'income', 'settlement') DEFAULT 'expense';
                `);
                console.log("✅ Added 'type' to 'group_expenses'.");
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log("ℹ️ 'type' column already exists in 'group_expenses'.");
                } else throw error;
            }

            // Add category
            try {
                await connection.query(`
                    ALTER TABLE group_expenses
                    ADD COLUMN category VARCHAR(100) DEFAULT 'Uncategorized';
                `);
                console.log("✅ Added 'category' to 'group_expenses'.");
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log("ℹ️ 'category' column already exists in 'group_expenses'.");
                } else throw error;
            }

        } catch (error) {
            console.error("❌ Failed to alter 'group_expenses':", error.message);
        }

        // 5. Add group_type to expense_groups
        try {
            console.log("Adding 'group_type' to 'expense_groups'...");
            await connection.query(`
                ALTER TABLE expense_groups
                ADD COLUMN group_type ENUM('general', 'family') DEFAULT 'general';
            `);
            console.log("✅ Added 'group_type' to 'expense_groups'.");
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ 'group_type' column already exists in 'expense_groups'.");
            } else {
                console.error("❌ Failed to alter 'expense_groups':", error.message);
            }
        }

        console.log('Migration shared features completed.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
