---
description: How to test the redesigned Groups and Shared Expenses feature
---

# Testing the Redesigned Groups Feature

This workflow guides you through testing the new Splitwise-style Groups UI, confirming the removal of legacy shared mode features, and verifying integrated expense management.

## Prerequisites
- Ensure the backend server is running.
- Ensure the frontend server is running.
- Log in to the application.

## Steps

1.  **Verify Dashboard Cleanup**
    -   Navigate to the **Dashboard**.
    -   Confirm that the **"Shared Ledger Mode" toggle** (previously at the top) is **GONE**.
    -   Check the **Smart Entry** form. Confirm it says "Smart Entry" (or similar personal title) and does **not** show "Adding to Family Ledger".

2.  **Access Groups UI**
    -   Click on "My Profile" (or "Profile" in the navigation).
    -   Click on the **"Groups"** tab.
    -   Confirm that the layout shows a **two-column view** (on desktop) or a list of groups.
    -   Confirm there is **NO "Splits" tab** in the profile navigation.

3.  **Create a New Group**
    -   Click the **"New Group"** button.
    -   Enter a group name (e.g., "Trip to Goa").
    -   Add member emails (comma-separated).
    -   Click "Create".
    -   Verify the new group appears in the sidebar list.

4.  **Add a Shared Expense**
    -   Select the newly created group from the sidebar.
    -   Click the **"Add Expense"** button inside the group view.
    -   Enter an amount (e.g., 500) and description (e.g., "Lunch").
    -   Keep the split method as "Equally".
    -   Click "Save".
    -   Verify the expense appears in the "Latest Expenses" list within the group view.
    -   Verify the "Member Balances" update correctly (e.g., if you paid 500 in a group of 2, it should show you are owed 250).

5.  **Settle Up**
    -   (Requires a scenario where you owe money).
    -   If possible, switch accounts or add an expense where *another* member paid, so you owe money.
    -   Click the **"Settle Up"** button.
    -   Verify the modal allows you to record a payment to the person you owe.

6.  **Verify Personal Dashboard Independence**
    -   Go back to the **Dashboard**.
    -   Add a **Personal Expense** (e.g., "Coffee", 50).
    -   Verify this expense appears in the Main Dashboard history.
    -   Verify this expense does **NOT** appear in the Group's expense list.

## Troubleshooting
-   If the "Groups" tab doesn't load, check the browser console for errors related to `groups.js`.
-   If "Shared Ledger Mode" UI elements persist, clear your browser cache or check if `appState.isShared` is being forced to true in local storage.
