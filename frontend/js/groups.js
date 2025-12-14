// Groups and Split Expenses Feature

let API_BASE_URL;
let appState;

// Initialize the groups module
export function initGroups(config) {
    API_BASE_URL = config.apiBaseUrl;
    appState = config.appState;
}

// Add to translations (English)
const TRANSLATIONS = {
    GROUPS_TITLE: "Split Expenses",
    CREATE_GROUP: "Create New Group",
    GROUP_NAME: "Group Name",
    ADD_MEMBERS: "Add Members",
    SPLIT_BILL: "Split a Bill",
    AMOUNT_TO_SPLIT: "Amount to Split",
    SPLIT_DESCRIPTION: "Description",
    OWES_YOU: "owes you",
    YOU_OWE: "you owe",
    MEMBER_COUNT: "members",
    EQUAL_SPLIT: "Split Equally",
    UNEQUAL_SPLIT: "Split Unequally",
    SETTLED_UP: "All settled up!",
    SPLIT_SUCCESS: "Bill split successfully!",
    GROUP_CREATED: "Group created successfully!"
};

// Add to initializeListeners
const initializeGroupListeners = async () => {
    if (!appState.token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/groups`, {
            headers: {
                // Assuming Content-Type is application/json for GET requests
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            appState.groups = data.groups || [];
            // Don't automatically load balances for undefined group
            // Note: updateUI is not available in this module, assuming it's handled by the caller
        }
    } catch (error) {
        console.error('Error loading groups:', error);
        // Note: setAlert is not available in this module, error is logged instead
    }
};

const loadGroupBalances = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/balances`, {
            headers: {
                // Assuming Content-Type is application/json for GET requests
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            appState.groupBalances[groupId] = data.balances;
            // Note: updateUI is not available in this module, assuming it's handled by the caller
        }
    } catch (error) {
        console.error('Error loading balances:', error);
        // Note: setAlert is not available in this module, error is logged instead
    }
};

const renderGroupsView = (container) => {
    const groupsList = (appState.groups || []).map(group => `
        <div class="group-item p-4 bg-white rounded-lg shadow-md mb-4 cursor-pointer ${appState.selectedGroupId === group.id ? 'border-2 border-emerald-500' : ''}"
             onclick="selectGroup('${group.id}')">
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-800">${group.group_name}</h3>
                <span class="text-sm text-gray-500">${group.member_count} ${TRANSLATIONS.MEMBER_COUNT}</span>
            </div>
            <div class="mt-2 text-sm ${group.user_balance > 0 ? 'text-green-600' : group.user_balance < 0 ? 'text-red-600' : 'text-gray-600'}">
            <div class="mt-2 text-sm ${group.user_balance > 0 ? 'text-green-600' : group.user_balance < 0 ? 'text-red-600' : 'text-gray-600'}">
                ${formatGroupBalance(group.user_balance)}
            </div>
            ${appState.currentGroupId && String(appState.currentGroupId) === String(group.id) ?
            '<div class="mt-2 inline-block px-2 py-0.5 bg-teal-100 text-teal-800 text-xs rounded-full font-medium">Active Family Group</div>' : ''}
        </div>
    `).join('');

    const selectedGroup = appState.selectedGroupId ?
        (appState.groups || []).find(g => g.id === appState.selectedGroupId) : null;

    const balancesList = selectedGroup ? renderGroupBalances(selectedGroup) : '';

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">${TRANSLATIONS.GROUPS_TITLE}</h2>
            <button onclick="showCreateGroupModal()"
                    class="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">
                <i class="fas fa-plus mr-2"></i>${TRANSLATIONS.CREATE_GROUP}
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Groups List -->
            <div class="md:col-span-1">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Your Groups</h3>
                    ${groupsList || '<p class="text-gray-500">No groups yet. Create your first group!</p>'}
                </div>
            </div>

            <!-- Selected Group Details -->
            <div class="md:col-span-2">
                ${selectedGroup ? `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold text-gray-800">${selectedGroup.group_name}</h3>
                            <button onclick="showSplitBillModal('${selectedGroup.id}')"
                                    class="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">
                                <i class="fas fa-receipt mr-2"></i>${TRANSLATIONS.SPLIT_BILL}
                            </button>
                        </div>
                        
                        <!-- Set Active Group Section -->
                        <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                            <div>
                                <h4 class="font-semibold text-gray-800">Family Mode Status</h4>
                                <p class="text-sm text-gray-500">
                                    ${appState.currentGroupId && String(appState.currentGroupId) === String(selectedGroup.id) ?
                'This is your currently active group for the Shared Dashboard.' :
                'Set this group to see its transactions on your Dashboard.'}
                                </p>
                            </div>
                            ${appState.currentGroupId && String(appState.currentGroupId) === String(selectedGroup.id) ?
                '<span class="px-4 py-2 bg-teal-100 text-teal-700 rounded-md font-medium border border-teal-200">Currently Active</span>' :
                `<button onclick="setActiveGroup('${selectedGroup.id}')" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition shadow-sm">Set as Active</button>`
            }
                        </div>

                        ${balancesList}
                    </div>
                ` : `
                    <div class="flex items-center justify-center h-full bg-gray-50 rounded-lg p-8">
                        <p class="text-gray-500">Select a group to view details</p>
                    </div>
                `}
            </div>
        </div>
    `;
};

const renderGroupBalances = (group) => {
    const balances = appState.groupBalances[group.id] || [];
    if (!balances.length) return '<p class="text-gray-500">Loading balances...</p>';

    // Separate settled and unsettled members
    const settledMembers = balances.filter(b => Number(b.net_balance) === 0);
    const unsettledMembers = balances.filter(b => Number(b.net_balance) !== 0);

    // If all balances are zero, show success message
    if (unsettledMembers.length === 0 && settledMembers.length > 0) {
        return `
            <div class="text-center py-8">
                <div class="text-5xl mb-3">✅</div>
                <p class="text-lg font-semibold text-green-600">All settled up!</p>
                <p class="text-sm text-gray-500 mt-1">Everyone in this group is square.</p>
            </div>
        `;
    }

    // Render unsettled members first, then settled members
    const allMembers = [...unsettledMembers, ...settledMembers];

    const balanceItems = allMembers
        .map(balance => {
            const balanceNum = Number(balance.net_balance);
            const isSettled = balanceNum === 0;

            return `
            <div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                <div>
                    <span class="font-medium">${balance.user_name} ${balance.user_id === appState.userId ? '(You)' : ''}</span>
                </div>
                <div class="text-right flex items-center gap-2">
                    ${isSettled ? `
                        <span class="text-sm font-medium text-green-600 flex items-center gap-1">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            Settled
                        </span>
                    ` : `
                        <span class="font-semibold ${balanceNum > 0 ? 'text-green-600' : 'text-red-600'}">
                            ${formatGroupBalance(balanceNum)}
                        </span>
                        ${balanceNum < 0 && balance.user_id === appState.userId ? `
                            <button onclick="showSettleUpModal('${group.id}', ${balanceNum})" 
                                    class="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition">
                                Settle Up
                            </button>
                        ` : ''}
                    `}
                </div>
            </div>
        `;
        }).join('');

    return `
        <div class="mb-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-3">Group Members</h4>
            ${balanceItems}
        </div>
    `;
};

const showCreateGroupModal = () => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800">${TRANSLATIONS.CREATE_GROUP}</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="create-group-form">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">${TRANSLATIONS.GROUP_NAME}</label>
                    <input type="text" id="group-name" name="groupName" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">${TRANSLATIONS.ADD_MEMBERS}</label>
                    <textarea id="member-emails" name="memberEmails" placeholder="Enter email addresses separated by commas"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              rows="3"></textarea>
                    <p class="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                </div>

                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="closeModal()"
                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                        Create Group
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const form = modal.querySelector('#create-group-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createGroup();
    });
};

const closeModal = () => {
    const modal = document.querySelector('.fixed.inset-0.bg-black');
    if (modal) {
        modal.remove();
    }
};

const createGroup = async () => {
    const groupName = document.getElementById('group-name').value.trim();
    const memberEmailsText = document.getElementById('member-emails').value.trim();

    if (!groupName) {
        alert('Please enter a group name');
        return;
    }

    // Parse member emails
    const memberEmails = memberEmailsText
        .split(',')
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));

    if (memberEmails.length === 0) {
        alert('Please add at least one member email');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/groups/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                group_name: groupName,
                member_emails: memberEmails
            })
        });

        console.log('Create group response:', response.status, response.statusText);

        if (response.ok) {
            const data = await response.json();
            closeModal();
            // Reload groups data
            await initializeGroupListeners();
            // Select the new group
            await selectGroup(data.group_id);

            // Ask user if they want to switch immediately
            const confirmSwitch = confirm(`${TRANSLATIONS.GROUP_CREATED}\n\nDo you want to open ${data.group_name} Dashboard now?`);
            if (confirmSwitch && window.switchToGroupDashboard) {
                window.switchToGroupDashboard(data.group_id);
            } else {
                renderGroupsView(document.getElementById('profile-content'));
            }
        } else {
            const errorText = await response.text();
            // setAlert is not available in this module, so using alert()
            // If setAlert is desired, it needs to be passed via initGroups config
            let errorMessage = 'Failed to create group';
            try {
                const error = JSON.parse(errorText);
                errorMessage = error.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            alert(`Error: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group. Please try again.');
    }
};

const showSplitBillModal = (groupId) => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800">${TRANSLATIONS.SPLIT_BILL}</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="split-bill-form">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">${TRANSLATIONS.AMOUNT_TO_SPLIT}</label>
                    <input type="number" id="split-amount" name="amount" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                           placeholder="${TRANSLATIONS.AMOUNT_PLACEHOLDER}" min="0.01" step="0.01">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">${TRANSLATIONS.SPLIT_DESCRIPTION}</label>
                    <input type="text" id="split-description" name="description" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                           placeholder="e.g., Dinner at restaurant">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Split Method</label>
                    <select id="split-method" name="splitMethod"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="equal">${TRANSLATIONS.EQUAL_SPLIT}</option>
                        <option value="unequal">${TRANSLATIONS.UNEQUAL_SPLIT}</option>
                    </select>
                </div>

                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="closeModal()"
                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                        ${TRANSLATIONS.SPLIT_BILL}
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const form = modal.querySelector('#split-bill-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await splitBill(groupId);
    });
};

const selectGroup = async (groupId) => {
    appState.selectedGroupId = parseInt(groupId);
    await loadGroupBalances(groupId);
    // Note: updateUI is not available in this module, assuming it's handled by the caller
    // Re-render to show selected group within the correct container
    renderGroupsView(document.getElementById('profile-content'));
};

const splitBill = async (groupId) => {
    const amount = parseFloat(document.getElementById('split-amount').value);
    const description = document.getElementById('split-description').value.trim();
    const splitMethod = document.getElementById('split-method').value;

    if (!amount || amount <= 0 || !description) {
        alert('Please fill in all fields correctly');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/groups/split`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                group_id: groupId,
                amount: amount,
                description: description,
                split_method: splitMethod
            })
        });

        if (response.ok) {
            const data = await response.json();
            alert(TRANSLATIONS.SPLIT_SUCCESS);
            closeModal();
            // Reload group balances
            await loadGroupBalances(groupId);
            renderGroupsView(document.getElementById('profile-content'));
        } else {
            const errorText = await response.text();
            // setAlert is not available in this module, so using alert()
            // If setAlert is desired, it needs to be passed via initGroups config
            let errorMessage = 'Failed to split bill';
            try {
                const error = JSON.parse(errorText);
                errorMessage = error.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            alert(`Error: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error splitting bill:', error);
        alert('Failed to split bill. Please try again.');
    }
};

const showSettleUpModal = (groupId, amountOwed) => {
    const balances = appState.groupBalances[groupId] || [];
    const peopleYouCanPay = balances.filter(b => b.net_balance > 0);

    if (peopleYouCanPay.length === 0) {
        alert("There's no one with a positive balance to settle up with right now.");
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800">Settle Up</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="settle-up-form">
                <p class="mb-4 text-sm text-gray-600">You owe <span class="font-bold text-red-600">₹${Math.abs(amountOwed).toFixed(2)}</span>. Record your payment to settle the balance.</p>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                    <input type="number" id="settle-amount" name="amount" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md"
                           value="${Math.abs(amountOwed).toFixed(2)}" max="${Math.abs(amountOwed).toFixed(2)}" min="0.01" step="0.01">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Paid To</label>
                    <select id="settle-to-user" name="toUserId" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        ${peopleYouCanPay.map(p => `<option value="${p.user_id}">${p.user_name} (is owed ₹${parseFloat(p.net_balance).toFixed(2)})</option>`).join('')}
                    </select>
                </div>

                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Record Payment
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#settle-up-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('settle-amount').value);
        const toUserId = document.getElementById('settle-to-user').value;
        await handleSettleUp(groupId, toUserId, amount);
    });
};

const handleSettleUp = async (groupId, toUserId, amount) => {
    if (!amount || amount <= 0 || !toUserId) {
        alert('Invalid settlement details.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/groups/settle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                group_id: groupId,
                from_user_id: appState.userId,
                to_user_id: toUserId,
                amount: amount
            })
        });

        if (response.ok) {
            alert('Settlement recorded successfully!');
            closeModal();
            await loadGroupBalances(groupId);
            renderGroupsView(document.getElementById('profile-content'));
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message || 'Failed to record settlement.'}`);
        }
    } catch (error) {
        console.error('Error settling up:', error);
        alert('An error occurred while recording the settlement.');
    }
};

const formatGroupBalance = (balance) => {
    if (balance === 0) return 'All settled up';
    const amount = Math.abs(balance).toFixed(2);
    return balance > 0 ?
        `You are owed ₹${amount}` :
        `You owe ₹${amount}`;
};

// Make functions globally available for onclick handlers
window.showCreateGroupModal = showCreateGroupModal;
window.showSplitBillModal = showSplitBillModal;
window.selectGroup = selectGroup;
window.showSettleUpModal = showSettleUpModal;
window.closeModal = closeModal;
window.setActiveGroup = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/user/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({ key: 'current_group', value: String(groupId) })
        });

        if (response.ok) {
            appState.currentGroupId = groupId;
            // Update UI
            alert('Active group updated! Dashboard will now show this group when in Shared Mode.');
            renderGroupsView(document.getElementById('profile-content'));
        } else {
            alert('Failed to update active group.');
        }
    } catch (error) {
        console.error('Error setting active group:', error);
        alert('An error occurred.');
    }
};

// Export functions for use in app.js
export { initializeGroupListeners, renderGroupsView };
