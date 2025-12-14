const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration
const emailConfig = {
    service: 'gmail', // or 'outlook', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Base URL for links (Production URL or Localhost)
const BASE_URL = process.env.APP_URL || process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`;

// Email templates
const emailTemplates = {
    welcome: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: 'Welcome to Gamyartha! 🎉',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Welcome to Gamyartha</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #3b82f6; text-align: center;">Welcome to Gamyartha! 🎉</h1>

                    <p>Dear ${data.user_name},</p> 

                    <p>Welcome to <strong>Gamyartha</strong>, your AI-powered financial companion!</p>

                    <p>We're excited to have you on board. Here's what you can do:</p>

                    <ul>
                        <li>📊 Track your income and expenses</li>
                        <li>🎯 Set and achieve savings goals</li>
                        <li>📅 Get reminders for due payments</li> 
                        <li>🤖 Use AI to analyze your transactions</li>
                        <li>💬 Chat with our financial assistant</li>
                    </ul>

                    <p>Get started by logging into your account and recording your first transaction!</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${BASE_URL}/" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Using Gamyartha</a>
                    </div>

                    <p>Happy budgeting! 💰</p>

                    <p>Best regards,<br>The Gamyartha Team</p>
 
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </body>
            </html>
        `
    }),

    passwordReset: (data) => {
        return {
            from: emailConfig.auth.user,
            to: data.to_email, // Renamed from Gamyartha to Gamyartha
            subject: 'Password Reset Code - Gamyartha',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Password Reset Code</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #dc2626; text-align: center;">Password Reset Code</h1>

                        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0;"> 
                            <p style="margin: 0; color: #dc2626;"><strong>⚠️ Security Alert:</strong> Password reset requested for your Gamyartha account.</p>
                        </div>

                        <p>Dear ${data.user_name},</p> 

                        <p>We received a request to reset your password for your Gamyartha account.</p>

                        <div style="background-color: #f8f9fa; border: 1px solid #e5e7eb; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                            <h2 style="margin-top: 0; color: #dc2626; font-size: 24px;">Your Reset Code</h2>
                            <p style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 5px; margin: 10px 0;">${data.reset_code}</p>
                            <p style="margin: 0; font-size: 14px; color: #666;">This code will expire in 15 minutes</p>
                        </div>

                        <p>Enter this code in the app to reset your password.</p>

                        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Didn't request this?</strong> If you didn't ask to reset your password, please contact our support team immediately.</p>
                        </div>

                        <p>For security reasons, please don't share this code with anyone.</p>

                        <p>Best regards,<br>The Gamyartha Security Team</p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #666; text-align: center;">
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                </body>
                </html>
            `
        };
    },

    transactionAlert: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: `Transaction Recorded: ${data.description}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Transaction Alert</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #059669; text-align: center;">Transaction Recorded</h1>

                    <p>Dear ${data.user_name},</p>

                    <p>A new transaction has been recorded in your Gamyartha account:</p>

                    <div style="background-color: #ecfdf5; border: 1px solid #059669; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #059669;">Transaction Details</h3>
                        <p><strong>Amount:</strong> ₹${data.amount}</p>
                        <p><strong>Description:</strong> ${data.description}</p>
                        <p><strong>Category:</strong> ${data.category}</p>
                        <p><strong>Type:</strong> ${data.transaction_type}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    <p>You can view all your transactions in your Gamyartha dashboard.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${BASE_URL}/" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a> 
                    </div>

                    <p>Best regards,<br>The Gamyartha Team</p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated notification from Gamyartha.
                    </p>
                </div>
            </body>
            </html>
        `
    }),

    dueDateAlert: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: `Due Date Alert: ${data.description}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Due Date Alert</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #f59e0b; text-align: center;">📅 Due Date Alert</h1>

                    <div style="background-color: #fffbeb; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e;"><strong>⏰ Reminder:</strong> You have a payment due soon!</p>
                    </div>

                    <p>Dear ${data.user_name},</p>

                    <p>This is a reminder that you have an upcoming payment due:</p>

                    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #92400e;">Payment Details</h3>
                        <p><strong>Description:</strong> ${data.description}</p>
                        <p><strong>Amount:</strong> ₹${data.amount}</p>
                        <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
                    </div>
 
                    <p>Please make sure to complete this payment before the due date to avoid any penalties or late fees.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${BASE_URL}/" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in Gamyartha</a>
                    </div>

                    <p>Best regards,<br>The Gamyartha Team</p>
 
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated reminder from Gamyartha.
                    </p>
                </div>
            </body>
            </html>
        `
    }),

    goalCompleted: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: `🎉 Goal Achieved: ${data.goalName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Goal Completed</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #059669; text-align: center;">🎉 Congratulations!</h1>

                    <div style="background-color: #ecfdf5; border: 1px solid #059669; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #059669;"><strong>🎯 Goal Achieved:</strong> You have successfully completed your savings goal!</p>
                    </div>

                    <p>Dear ${data.user_name},</p>

                    <p>Congratulations on achieving your savings goal!</p>

                    <div style="background-color: #ecfdf5; border: 1px solid #059669; padding: 20px; border-radius: 5px; margin: 20px 0;"> 
                        <h3 style="margin-top: 0; color: #059669;">Goal Details</h3>
                        <p><strong>Goal Name:</strong> ${data.goalName}</p>
                        <p><strong>Target Amount:</strong> ₹${data.targetAmount}</p>
                        <p><strong>Completed On:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    <p>Keep up the excellent work! Setting and achieving financial goals is a great habit that will help you build wealth over time.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${BASE_URL}/" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Set New Goal</a>
                    </div>

                    <p>Best regards,<br>The Gamyartha Team</p>
 
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated celebration from Gamyartha.
                    </p> 
                </div>
            </body>
            </html>
        `
    }),

    invite: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: `Split Request from ${data.requester_name}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Split Request Invitation</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #3b82f6; text-align: center;">Split Request Invitation</h1>

                    <div style="background-color: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #1e40af;"><strong>💰 Split Request:</strong> ${data.requester_name} wants to split an expense with you!</p>
                    </div>

                    <p>Dear User,</p>

                    <p><strong>${data.requester_name}</strong> has created a split request for: <strong>${data.description}</strong></p>

                    <div style="background-color: #f8f9fa; border: 1px solid #e5e7eb; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1f2937;">Split Details</h3>
                        <p><strong>Description:</strong> ${data.description}</p>
                        <p><strong>Your Share:</strong> ₹${data.amount_owed}</p>
                        <p><strong>Requested by:</strong> ${data.requester_name}</p>
                    </div>

                    <p>You can view and pay your share by logging into Gamyartha.</p>

                    <div style="text-align: center; margin: 30px 0;"> 
                        <a href="${BASE_URL}/" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Split Request</a>
                    </div>

                    <p>If you don't have a Gamyartha account yet, you'll need to sign up first.</p>

                    <p>Best regards,<br>The Gamyartha Team</p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated invitation from Gamyartha.
                    </p>
                </div>
            </body>
            </html>
        `
    }),

    groupInvite: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: `You've been added to "${data.group_name}" group`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Group Invitation</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #059669; text-align: center;">🎉 Group Invitation</h1>

                    <div style="background-color: #ecfdf5; border: 1px solid #059669; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #047857;"><strong>👥 You've been added to a group:</strong> ${data.group_name}</p>
                    </div>

                    <p>Dear ${data.user_name},</p>

                    <p><strong>${data.creator_name}</strong> has added you to the group <strong>"${data.group_name}"</strong> on Gamyartha!</p>

                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #166534;">Group Details</h3>
                        <p><strong>Group Name:</strong> ${data.group_name}</p>
                        <p><strong>Created by:</strong> ${data.creator_name}</p>
                        <p><strong>Created on:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    <p>You can now split expenses, track balances, and manage shared costs with the group members.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${BASE_URL}/" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Group</a>
                    </div>

                    <p>If you don't have a Gamyartha account yet, you'll need to sign up first to access the group.</p>

                    <p>Happy splitting! 💰</p>

                    <p>Best regards,<br>The Gamyartha Team</p>
 
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"> 
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated invitation from Gamyartha.
                    </p> 
                </div>
            </body> 
            </html>
        `
    }),

    income: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: `Income Recorded: ${data.description}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Income Recorded</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #059669; text-align: center;">💰 Income Recorded</h1>

                    <div style="background-color: #ecfdf5; border: 1px solid #059669; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #047857;"><strong>📈 New Income:</strong> Great job on earning some money!</p>
                    </div>

                    <p>Dear ${data.user_name},</p>

                    <p>A new income transaction has been recorded in your Gamyartha account:</p>

                    <div style="background-color: #ecfdf5; border: 1px solid #059669; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #059669;">Income Details</h3>
                        <p><strong>Amount:</strong> ₹${data.amount}</p>
                        <p><strong>Description:</strong> ${data.description}</p>
                        <p><strong>Category:</strong> ${data.category}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    <p>Keep up the good work! Tracking your income helps you understand your financial health better.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${BASE_URL}/" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
                    </div>

                    <p>Best regards,<br>The Gamyartha Team</p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated notification from Gamyartha.
                    </p>
                </div>
            </body>
            </html>
        `
    }),

    budgetExceeded: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: `🚨 Budget Exceeded Alert: ${data.category}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Budget Exceeded Alert</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #dc2626; text-align: center;">🚨 Budget Exceeded Alert</h1>

                    <div style="background-color: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #dc2626;"><strong>⚠️ Warning:</strong> You have exceeded your monthly budget for ${data.category}!</p>
                    </div>

                    <p>Dear ${data.user_name},</p>

                    <p>Your recent transaction has caused you to exceed your monthly budget for the <strong>${data.category}</strong> category.</p>

                    <div style="background-color: #fef2f2; border: 1px solid #dc2626; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #dc2626;">Budget Details</h3>
                        <p><strong>Category:</strong> ${data.category}</p>
                        <p><strong>Monthly Budget:</strong> ₹${data.budgetAmount}</p>
                        <p><strong>Current Spending:</strong> ₹${data.spentAmount}</p>
                        <p><strong>Exceeded By:</strong> ₹${(data.spentAmount - data.budgetAmount).toFixed(2)}</p>
                        <p><strong>Month:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                    </div>

                    <p>Consider reviewing your spending in this category or adjusting your budget to better align with your financial goals.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${BASE_URL}/" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Budget</a>
                    </div>

                    <p>Stay on track with your financial goals!</p>

                    <p>Best regards,<br>The Gamyartha Team</p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated budget alert from Gamyartha.
                    </p>
                </div>
            </body>
            </html>
        `
    }),

    monthlySummary: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: `Your Monthly Financial Summary – ${data.month_name}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Monthly Financial Summary</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #3b82f6; text-align: center;">📊 Monthly Financial Summary</h1>

                    <div style="background-color: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #1e40af;"><strong>📅 Summary for ${data.month_name}</strong></p>
                    </div>

                    <p>Dear ${data.user_name},</p>

                    <p>Here's your financial summary for ${data.month_name}:</p>

                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1e293b;">Financial Overview</h3>
                        <p><strong>Total Income:</strong> ₹${data.total_income.toFixed(2)}</p>
                        <p><strong>Total Expenses:</strong> ₹${data.total_expense.toFixed(2)}</p>
                        <p style="color: ${data.is_negative_savings ? '#dc2626' : '#059669'}; font-weight: bold;">
                            <strong>Savings: ₹${data.savings.toFixed(2)}</strong>
                            ${data.is_negative_savings ? ' ⚠️' : ' ✅'}
                        </p>
                    </div>

                    ${data.top_categories.length > 0 ? `
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1e293b;">Top Spending Categories</h3>
                        ${data.top_categories.map((cat, index) => `
                            <p><strong>${index + 1}. ${cat.category}:</strong> ₹${parseFloat(cat.amount).toFixed(2)}</p>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${data.is_negative_savings ? `
                    <div style="background-color: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #dc2626;"><strong>⚠️ Alert:</strong> Your expenses exceeded your income this month. Consider reviewing your budget and spending patterns.</p>
                    </div>
                    ` : `
                    <div style="background-color: #ecfdf5; border: 1px solid #059669; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #047857;"><strong>✅ Great job!</strong> You maintained positive savings this month. Keep up the good work!</p>
                    </div>
                    `}

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${BASE_URL}/" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Full Dashboard</a>
                    </div>

                    <p>Stay on track with your financial goals!</p>

                    <p>Best regards,<br>The Gamyartha Team</p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated monthly summary from Gamyartha.
                    </p>
                </div>
            </body>
            </html>
        `
    }),

    subscriptionRenewed: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: `Subscription Renewed: ${data.description}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Subscription Renewed</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #6366f1; text-align: center;">🔄 Subscription Renewed</h1>

                    <div style="background-color: #eef2ff; border: 1px solid #6366f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #4338ca;"><strong>✅ Auto-Renewal:</strong> Your subscription has been automatically processed.</p>
                    </div>

                    <p>Dear ${data.user_name},</p>

                    <p>Your recurring subscription has been renewed and recorded in your Gamyartha account:</p>

                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1e293b;">Subscription Details</h3>
                        <p><strong>Description:</strong> ${data.description}</p>
                        <p><strong>Amount:</strong> ₹${data.amount}</p>
                        <p><strong>Frequency:</strong> <span style="text-transform: capitalize;">${data.frequency}</span></p>
                        <p><strong>Processed On:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Next Due Date:</strong> ${new Date(data.next_due_date).toLocaleDateString()}</p>
                    </div>

                    <p>This transaction has been automatically added to your expense records.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${BASE_URL}/" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Subscriptions</a>
                    </div>

                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px;"><strong>💡 Tip:</strong> You can manage or cancel your subscriptions anytime from your Gamyartha dashboard.</p>
                    </div>

                    <p>Best regards,<br>The Gamyartha Team</p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        This is an automated notification from Gamyartha.
                    </p>
                </div>
            </body>
            </html>
        `
    }),

    generic: (data) => ({
        from: emailConfig.auth.user,
        to: data.to_email,
        subject: data.subject,
        html: data.html
    })
};

const sendEmail = async (type, data) => {
    if (!emailTemplates[type]) {
        throw new Error(`Invalid email type: ${type}`);
    }
    const mailOptions = emailTemplates[type](data);
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${type} to ${data.to_email}`);
    return result;
};

module.exports = {
    transporter,
    emailTemplates,
    sendEmail
};
