-- Gamyartha Database Setup Script
-- Gamyartha Database Setup Script
-- This script creates the database, user, and all required tables for the Gamyartha financial app

-- Create database
CREATE DATABASE IF NOT EXISTS gamyartha;
USE gamyartha;


-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP NULL,
    full_name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_alerts_enabled BOOLEAN DEFAULT TRUE,
    currency VARCHAR(3) DEFAULT 'INR',
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admins table (separate from users for better security)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    is_business BOOLEAN DEFAULT FALSE,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, transaction_date),
    INDEX idx_category (category)
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    saved_amount DECIMAL(15,2) DEFAULT 0,
    target_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
    INDEX idx_user_target (user_id, target_date)
);

-- Obligations table
CREATE TABLE IF NOT EXISTS obligations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT DEFAULT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    last_reminded_at DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
    INDEX idx_user_due (user_id, due_date)
);

-- Password reset codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reset_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_code (reset_code),
    INDEX idx_expires (expires_at)
);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role ENUM('user', 'model') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_time (user_id, created_at)
);

-- Budgets table
-- CREATE TABLE IF NOT EXISTS budgets (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     category VARCHAR(100) NOT NULL,
--     amount DECIMAL(10,2) NOT NULL,
--     month_year VARCHAR(7) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--     UNIQUE KEY unique_user_category_month (user_id, category, month_year),
--     INDEX idx_user_month (user_id, month_year)
-- );
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );


CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT DEFAULT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    month_year VARCHAR(7) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
    UNIQUE KEY unique_budget_entry (user_id, category, month_year, group_id),
    INDEX idx_user_month (user_id, month_year)
);



-- Groups table for split expenses
CREATE TABLE IF NOT EXISTS expense_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_member (group_id, user_id),
    INDEX idx_user_groups (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Group balances table
CREATE TABLE IF NOT EXISTS group_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    net_balance DECIMAL(10, 2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_group_balance (group_id, user_id),
    INDEX idx_user_balances (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Split requests table (like GPay's split request feature)
CREATE TABLE IF NOT EXISTS split_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    group_id INT NULL, -- NULL if direct split request
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    bill_image_url VARCHAR(255), -- For bill/receipt images
    split_method ENUM('equal', 'percentage', 'exact') DEFAULT 'equal',
    status ENUM('pending', 'partially_paid', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Optional expiry for the split request
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE SET NULL,
    INDEX idx_requester (requester_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Split participants table (who needs to pay in each split)
CREATE TABLE IF NOT EXISTS split_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    split_request_id INT NOT NULL,
    user_id INT NOT NULL,
    amount_owed DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('pending', 'paid', 'declined') DEFAULT 'pending',
    reminder_sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (split_request_id) REFERENCES split_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_splits (user_id),
    INDEX idx_split_status (split_request_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Split payments table (tracks actual payments made)
CREATE TABLE IF NOT EXISTS split_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    split_participant_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- e.g., 'upi', 'cash', 'bank_transfer'
    payment_reference VARCHAR(100), -- Reference number or transaction ID
    payment_screenshot_url VARCHAR(255), -- For payment proof
    status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (split_participant_id) REFERENCES split_participants(id) ON DELETE CASCADE,
    INDEX idx_payment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Group expenses table (for reference and history)
CREATE TABLE IF NOT EXISTS group_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    split_request_id INT NULL, -- NULL for simple group expenses not tied to split requests
    paid_by_user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Uncategorized', -- For expense categorization
    type ENUM('expense', 'income', 'settlement') DEFAULT 'expense',
    split_method ENUM('equal', 'percentage', 'exact', 'settlement') DEFAULT 'equal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (split_request_id) REFERENCES split_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_group_expenses (group_id),
    INDEX idx_paid_by (paid_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shared ledger entries table
CREATE TABLE IF NOT EXISTS shared_ledger_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Settings table for user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, setting_key)
);

-- Notifications table for split reminders and other notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('split_reminder', 'payment_received', 'split_completed', 'split_created', 'budget_alert') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    split_request_id INT,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (split_request_id) REFERENCES split_requests(id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, read_at),
    INDEX idx_type (type)
);

-- Insert sample data (optional - for testing)
-- You can uncomment these lines to add sample data

-- INSERT INTO users (email, password_hash, full_name, is_admin) VALUES
-- ('admin@Gamyartha.com', '$2b$10$example.hash.here', 'Admin User', TRUE),
-- ('user@example.com', '$2b$10$example.hash.here', 'Sample User', FALSE);

-- INSERT INTO admins (user_id, permissions) VALUES
-- (1, '{"all": true}');







-- -- Groups Table
-- CREATE TABLE IF NOT EXISTS groups (
--     group_id VARCHAR(50) PRIMARY KEY,
--     group_name VARCHAR(255) NOT NULL,
--     created_by_user_id VARCHAR(50) NOT NULL,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -- Group Members Table
-- CREATE TABLE IF NOT EXISTS group_members (
--     group_member_id VARCHAR(50) PRIMARY KEY,
--     group_id VARCHAR(50) NOT NULL,
--     user_id VARCHAR(50) NOT NULL,
--     FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
--     FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
--     UNIQUE KEY unique_group_member (group_id, user_id)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -- Group Balances Table
-- CREATE TABLE IF NOT EXISTS group_balances (
--     balance_id VARCHAR(50) PRIMARY KEY,
--     group_id VARCHAR(50) NOT NULL,
--     user_id VARCHAR(50) NOT NULL,
--     net_balance DECIMAL(10, 2) DEFAULT 0.00,
--     last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
--     FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
--     UNIQUE KEY unique_user_group_balance (group_id, user_id)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -- Group Expenses Table
-- CREATE TABLE IF NOT EXISTS group_expenses (
--     expense_id VARCHAR(50) PRIMARY KEY,
--     group_id VARCHAR(50) NOT NULL,
--     paid_by_user_id VARCHAR(50) NOT NULL,
--     amount DECIMAL(10, 2) NOT NULL,
--     description TEXT,
--     split_method ENUM('equal', 'unequal') DEFAULT 'equal',
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
--     FOREIGN KEY (paid_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Recurring transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
    start_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    last_processed_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    payment_mode ENUM('auto', 'manual') DEFAULT 'auto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Gamification: Badges table
CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    criteria_type VARCHAR(50),
    criteria_threshold INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Gamification: User badges table (tracks which users have which badges)
CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user_badges (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create indices for better query performance
-- CREATE INDEX idx_group_members_user ON group_members(user_id);
-- CREATE INDEX idx_group_balances_user ON group_balances(user_id);
-- CREATE INDEX idx_group_expenses_paid_by ON group_expenses(paid_by_user_id);

-- ============================================
-- SCHEMA UPDATES / MIGRATIONS
-- ============================================
-- Add these ALTER TABLE statements if upgrading an existing database

-- Add payment_mode column to recurring_transactions (for Auto-Pay vs Manual feature)
ALTER TABLE recurring_transactions 
ADD COLUMN IF NOT EXISTS payment_mode ENUM('auto', 'manual') DEFAULT 'auto' AFTER is_active;

-- Add password reset columns to users table (for Forgot Password feature)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) AFTER password_hash,
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP NULL AFTER reset_token;

-- Savings Challenges Table
CREATE TABLE IF NOT EXISTS savings_challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_category VARCHAR(100) DEFAULT 'total_spend',
    winning_criteria VARCHAR(50) DEFAULT 'lowest_spend',
    status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
    created_by_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Challenge Participants Table
CREATE TABLE IF NOT EXISTS challenge_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_score DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (challenge_id) REFERENCES savings_challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participation (challenge_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note: Run these ALTER statements only once when upgrading from an older version
-- For fresh installations, these columns should be added directly to the CREATE TABLE statements above
-- Insert sample badges if they don't exist
INSERT INTO badges (code, name, description, icon, criteria_type, criteria_threshold) VALUES
('EARLY_BIRD', 'Early Bird', 'One of the first 100 users', '🐦', 'signup_count', 100),
('SAVER_BRONZE', 'Bronze Saver', 'Saved ₹10,000 in goals', '🥉', 'goal_amount', 10000),
('SAVER_SILVER', 'Silver Saver', 'Saved ₹50,000 in goals', '🥈', 'goal_amount', 50000),
('SAVER_GOLD', 'Gold Saver', 'Saved ₹100,000 in goals', '🥇', 'goal_amount', 100000),
('TRACKER_PRO', 'Tracker Pro', 'Logged 100 transactions', '📊', 'transaction_count', 100),
('BUDGET_MASTER', 'Budget Master', 'Created 10 budgets', '💰', 'budget_count', 10),
('SPLIT_EXPERT', 'Split Expert', 'Created 20 split requests', '🤝', 'split_count', 20),
('STREAK_WEEK', '7-Day Streak', 'Logged transactions for 7 consecutive days', '🔥', 'streak_days', 7),
('STREAK_MONTH', '30-Day Streak', 'Logged transactions for 30 consecutive days', '⭐', 'streak_days', 30)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Table for user-defined category rules (AI learning)
CREATE TABLE IF NOT EXISTS category_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_keyword (user_id, keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
