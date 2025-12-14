# Auto-Pay vs Manual Subscription Feature

## Overview
Implemented a comprehensive Auto-Pay vs Manual payment mode system for recurring transactions (subscriptions & bills).

## Features Implemented

### 1. Payment Mode Selection
When adding or editing a subscription, users can choose:
- **🤖 Auto-Pay**: Automatically deducts payment on due date
- **✋ Manual**: User manually marks as paid when they complete the payment

### 2. Auto-Pay Mode Behavior
- ✅ Automatically creates transaction on due date
- ✅ Sends "Subscription Renewed" email notification
- ✅ Creates in-app notification
- ✅ Updates next due date automatically

### 3. Manual Mode Behavior
- ❌ Does NOT auto-create transaction
- 📧 Sends "Payment Due" reminder email on due date
- 🔔 Creates in-app "Payment Due" notification
- ➕ Shows "Mark as Paid" button in UI
- When user clicks "Mark as Paid":
  - Creates the transaction record
  - Sends "Payment Confirmed" email
  - Removes pending notifications
  - Updates next due date
  - Repeats cycle for next period

## Database Changes
Added `payment_mode` column to `recurring_transactions` table:
```sql
ALTER TABLE recurring_transactions 
ADD COLUMN payment_mode ENUM('auto', 'manual') DEFAULT 'auto' AFTER is_active;
```

## Frontend Changes

### UI Updates (`frontend/js/recurring.js`)
1. **Form**: Added payment mode dropdown with helpful descriptions
2. **List View**: 
   - Shows payment mode badge (🤖 Auto-Pay or ✋ Manual)
   - Displays "Mark Paid" button for manual subscriptions
3. **Event Handlers**: Added click handler for "Mark Paid" button

### API Integration
- Updated `createRecurring` to include `payment_mode`
- Updated `updateRecurring` to include `payment_mode`
- Added new API call to `/api/recurring/:id/mark-paid`

## Backend Changes

### Service Layer (`backend/services/RecurringTransactionService.js`)
1. **createRecurringTransaction**: Now accepts and stores `payment_mode`
2. **updateRecurringTransaction**: Now accepts and updates `payment_mode`
3. **processDueTransactions**: 
   - Checks `payment_mode` for each due subscription
   - Auto mode: Creates transaction, sends renewal email
   - Manual mode: Sends reminder email/notification only
4. **markAsPaid** (NEW): 
   - Creates transaction for manual payment
   - Updates next due date
   - Removes pending notifications
   - Sends confirmation email

### API Routes (`backend/server.js`)
Added new endpoint:
```javascript
POST /api/recurring/:id/mark-paid
```

### Email Templates (`backend/utils/mailer.js`)
Added new template:
- **subscriptionRenewed**: Beautiful email for auto-pay renewals

## Email Notifications

### Auto-Pay Mode
**Email**: "Subscription Renewed: [Description]"
- Subscription details
- Amount charged
- Next due date
- Frequency
- Link to manage subscriptions

### Manual Mode
**Reminder Email**: "Due Date Alert: [Description]"
- Payment due notice
- Amount owed
- Due date
- Call to action

**Confirmation Email**: "Transaction Recorded: [Description] - Payment Confirmed"
- Payment confirmation
- Transaction details

## Testing

### Test Script
Created `test_subscription_email.js` to:
- View all active subscriptions
- Check user email settings
- Manually trigger processing
- Test email delivery

### Usage
```bash
# View subscriptions
node test_subscription_email.js

# Process due subscriptions now
node test_subscription_email.js --process
```

## User Flow

### Creating Auto-Pay Subscription
1. User adds subscription
2. Selects "Auto-Pay" mode
3. On due date: Transaction auto-created, email sent
4. Next due date updated automatically

### Creating Manual Subscription
1. User adds subscription
2. Selects "Manual" mode
3. On due date: Reminder email/notification sent
4. User clicks "Mark as Paid" when payment is made
5. Transaction created, confirmation email sent
6. Next due date updated
7. Cycle repeats

## Benefits
- ✅ Flexibility for users to choose payment method
- ✅ No missed payments for auto-pay
- ✅ Manual control for users who prefer it
- ✅ Comprehensive email notifications
- ✅ Clean notification management
- ✅ Accurate transaction records

## Files Modified
1. `backend/services/RecurringTransactionService.js`
2. `backend/server.js`
3. `backend/utils/mailer.js`
4. `frontend/js/recurring.js`
5. Database schema (recurring_transactions table)
