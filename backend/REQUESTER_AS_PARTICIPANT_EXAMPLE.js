// Example: Group Split Where Requester Also Pays

/*
Scenario: Trip to Goa
- 3 friends: Alice, Bob, Charlie
- Total hotel bill: ₹9000
- Alice paid the hotel
- Split equally: ₹3000 each

Alice creates the split and includes herself as a participant.

Before Fix:
- Only Bob and Charlie are added as participants
- Alice can't mark her share as paid
- Confusing!

After Fix:
- Alice, Bob, and Charlie are all participants
- Each owes ₹3000
- All three can mark as paid
- Clear tracking!

*/

// How to create such a split:

const splitRequest = {
    group_id: 5,
    amount: 9000,
    description: "Hotel in Goa",
    split_method: "equal",
    participants: [
        { email: "alice@example.com" },  // Requester (Alice)
        { email: "bob@example.com" },
        { email: "charlie@example.com" }
    ]
};

// Result:
// split_participants table:
// | id | user_id | amount_owed | status  |
// |----|---------|-------------|---------|
// | 1  | Alice   | 3000        | pending |
// | 2  | Bob     | 3000        | pending |
// | 3  | Charlie | 3000        | pending |

// Alice can now:
// 1. See her own "Mark as Paid" button
// 2. Click it when she contributes her share
// 3. Track who still owes

// This is how Splitwise works!
