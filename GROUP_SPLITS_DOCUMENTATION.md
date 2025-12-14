# Group Splits - Complete Behavior Documentation

## Overview
The Group Splits feature allows users to split expenses among group members, track payments, and manage group balances. It supports both **Direct Splits** (one-to-one) and **Group Splits** (one-to-many within a group).

---

## Database Schema

### Core Tables

#### 1. **expense_groups**
- Represents a group of people (e.g., "Roommates", "Trip to Goa")
- Created by a user
- Can have multiple members

#### 2. **group_members**
- Links users to groups
- One user can be in multiple groups
- Prevents duplicate memberships

#### 3. **group_balances**
- Tracks net balance for each user in each group
- Positive balance = Others owe you
- Negative balance = You owe others
- Auto-updated when expenses are added/settled

#### 4. **split_requests**
- Main table for split expenses
- Can be linked to a group (`group_id`) or be a direct split (`group_id = NULL`)
- Tracks overall status: `pending`, `partially_paid`, `completed`, `cancelled`

#### 5. **split_participants**
- Who owes money in each split
- Tracks `amount_owed` and `amount_paid`
- Individual status: `pending`, `paid`, `declined`

#### 6. **split_payments**
- Records actual payments made
- Can include payment proof (screenshot)
- Payment method tracking (UPI, cash, bank transfer)

#### 7. **group_expenses**
- Historical record of all group expenses
- Links to split_requests
- Used for analytics and reporting

---

## Split Types

### 1. Direct Split
**Use Case**: Split a bill between 2 specific people

**Example**: You and a friend go to dinner (₹1000)

**Flow**:
```
1. User A creates split request
   - amount: ₹1000
   - group_id: NULL (direct split)
   - participants: [User B]
   
2. Split created:
   - split_requests.status = 'pending'
   - split_participants created for User B
   - User B gets email + in-app notification

3. User B marks as paid:
   - split_participants.status = 'paid'
   - split_participants.amount_paid = ₹1000
   - split_requests.status = 'completed'
   - User A gets notification
```

### 2. Group Split
**Use Case**: Split expenses among group members

**Example**: Roommates splitting rent (₹12,000 among 3 people)

**Flow**:
```
1. User A creates group "Roommates"
   - expense_groups created
   - group_members: [User A, User B, User C]
   - group_balances initialized for all

2. User A creates split for rent:
   - amount: ₹12,000
   - group_id: [Roommates group ID]
   - split_method: 'equal'
   - participants: Auto-populated from group members

3. Split calculation:
   - Each person owes: ₹12,000 / 3 = ₹4,000
   - split_participants created for User B and User C
   - User A (requester) is excluded from owing

4. User B pays ₹4,000:
   - split_participants.status = 'paid' for User B
   - split_requests.status = 'partially_paid'
   - group_balances updated

5. User C pays ₹4,000:
   - split_participants.status = 'paid' for User C
   - split_requests.status = 'completed'
   - group_balances updated
```

---

## Split Methods

### 1. **Equal Split** (Default)
- Amount divided equally among all participants
- Example: ₹300 among 3 people = ₹100 each

### 2. **Percentage Split**
- Each person pays a percentage
- Example: 
  - User A: 50% (₹150)
  - User B: 30% (₹90)
  - User C: 20% (₹60)

### 3. **Exact Amount Split**
- Manually specify exact amount for each person
- Example:
  - User A: ₹200
  - User B: ₹100

---

## Payment Flow

### Step 1: Create Split Request
```javascript
POST /api/splits/request
{
  "group_id": 5,  // or null for direct split
  "amount": 1200,
  "description": "Dinner at Restaurant",
  "split_method": "equal",
  "participants": [
    { "email": "user1@example.com" },
    { "email": "user2@example.com" }
  ]
}
```

**Backend Actions**:
1. Create `split_requests` record
2. Create `split_participants` for each participant
3. Calculate amounts based on split_method
4. Send invitation emails to participants
5. Create in-app notifications
6. If user doesn't exist, create placeholder account

### Step 2: View Split Requests
```javascript
GET /api/splits/request/list
```

**Returns**:
- All splits where user is requester OR participant
- Shows status, amount, paid count
- Grouped by status

### Step 3: Mark as Paid
```javascript
POST /api/splits/payment
{
  "split_participant_id": 123,
  "amount": 600,
  "payment_method": "upi",
  "payment_reference": "UPI123456"
}
```

**Backend Actions**:
1. Create `split_payments` record
2. Update `split_participants.amount_paid`
3. Update `split_participants.status` to 'paid' if fully paid
4. Check if all participants paid
5. Update `split_requests.status`:
   - All paid → 'completed'
   - Some paid → 'partially_paid'
6. Update `group_balances` if group split
7. Send confirmation notifications

---

## Group Balance Management

### How Balances Work

**Example Scenario**:
```
Group: "Trip to Goa" (3 members: A, B, C)

Expense 1: A pays ₹3000 for hotel (split equally)
- Each owes: ₹1000
- B owes A: ₹1000
- C owes A: ₹1000
- A's balance: +₹2000
- B's balance: -₹1000
- C's balance: -₹1000

Expense 2: B pays ₹1500 for food (split equally)
- Each owes: ₹500
- A owes B: ₹500
- C owes B: ₹500
- A's balance: +₹2000 - ₹500 = +₹1500
- B's balance: -₹1000 + ₹1000 = ₹0
- C's balance: -₹1000 - ₹500 = -₹1500

Final Settlement:
- C pays A: ₹1500
- All balances become ₹0
```

### Balance Calculation
```javascript
// When expense is added
for each participant:
  if participant is requester:
    balance += (total_amount - their_share)
  else:
    balance -= their_share
```

---

## Notification System

### Email Notifications

#### 1. **Split Invitation** (`invite` template)
**Sent to**: All participants when split is created
**Contains**:
- Requester name
- Amount owed
- Description
- Link to view/pay split

#### 2. **Payment Reminder** (if implemented)
**Sent to**: Participants who haven't paid
**Frequency**: Configurable (e.g., 3 days before due date)

#### 3. **Payment Received** (`payment_received` template)
**Sent to**: Requester when participant pays
**Contains**:
- Participant name
- Amount paid
- Payment method

### In-App Notifications

**Types**:
- `split_created`: New split request
- `split_reminder`: Payment reminder
- `payment_received`: Someone paid
- `split_completed`: All participants paid

---

## Status Lifecycle

### Split Request Status
```
pending → partially_paid → completed
   ↓
cancelled
```

### Participant Status
```
pending → paid
   ↓
declined
```

---

## Special Features

### 1. **Invite Non-Users**
- Can invite by email even if user doesn't exist
- Backend creates placeholder account
- User can sign up later and access their splits

### 2. **Payment Proof**
- Upload screenshot of payment
- Stored in `/uploads/payments/`
- Helps with dispute resolution

### 3. **Bill Image**
- Upload bill/receipt when creating split
- Stored in `/uploads/bills/`
- Provides context for the expense

### 4. **Expiry Date**
- Optional expiry for split requests
- After expiry, can be auto-cancelled

---

## API Endpoints

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - List user's groups
- `POST /api/groups/:id/members` - Add member
- `DELETE /api/groups/:id/members/:userId` - Remove member

### Splits
- `POST /api/splits/request` - Create split
- `GET /api/splits/request/list` - List splits
- `GET /api/splits/request/:id` - Get split details
- `POST /api/splits/payment` - Record payment
- `PUT /api/splits/request/:id/cancel` - Cancel split

### Balances
- `GET /api/groups/:id/balances` - Get group balances
- `POST /api/groups/:id/settle` - Settle balances

---

## Current Implementation Status

✅ **Implemented**:
- Direct splits (1-to-1)
- Group splits (1-to-many)
- Equal split method
- Payment tracking
- Email notifications
- In-app notifications
- Invite non-users by email
- Payment proof upload
- Bill image upload

⚠️ **Partially Implemented**:
- Percentage split (backend ready, frontend needs UI)
- Exact amount split (backend ready, frontend needs UI)

❌ **Not Implemented**:
- Group balance settlement
- Payment reminders (scheduled)
- Expense analytics/reports
- Split history export

---

## Best Practices

### For Users
1. Always add description to splits
2. Upload bill image for transparency
3. Mark as paid immediately after payment
4. Use payment reference for tracking

### For Developers
1. Always validate participant emails
2. Handle non-existent users gracefully
3. Update balances atomically
4. Send notifications asynchronously
5. Log all payment transactions

---

## Example Use Cases

### Use Case 1: Roommate Rent
```
1. Create group "Apartment 101"
2. Add all roommates
3. Create monthly split for rent
4. Each roommate marks as paid
5. Balances auto-update
```

### Use Case 2: Trip Expenses
```
1. Create group "Goa Trip 2025"
2. Add all travelers
3. Create splits for:
   - Hotel (paid by Person A)
   - Food (paid by Person B)
   - Transport (paid by Person C)
4. System calculates who owes whom
5. Settle at end of trip
```

### Use Case 3: One-Time Split
```
1. Don't create group
2. Create direct split with friend
3. Friend pays
4. Done!
```

---

This is the complete behavior of the Group Splits feature! 🎉
