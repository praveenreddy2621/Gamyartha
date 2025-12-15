// Groups and Shared Expenses Feature - Professional Redesign
// "Splitwise-style" Layout

let API_BASE_URL;
let appState;
let setAlert; // Assuming setAlert is passed in config or available globally (it was missing in original)

// Initialize the groups module
export function initGroups(config) {
    API_BASE_URL = config.apiBaseUrl;
    appState = config.appState;
    setAlert = config.setAlert || ((msg, type) => alert(msg));

    // Expose global functions for group actions
    window.showCreateGroupModal = showCreateGroupModal;
    window.selectGroup = selectGroup;
    window.deselectGroup = deselectGroup;
    window.showAddExpenseModal = showAddExpenseModal;
    window.showSettleUpModal = showSettleUpModal;
    window.closeModal = closeModal;
    window.editGroup = editGroup;
    window.deleteGroup = deleteGroup;
    window.inviteMember = inviteMember;
}

// Translation Keys (English/Hindi support ready structure)
const T = {
    GROUPS_TITLE: "Groups",
    CREATE_GROUP: "New Group",
    ADD_EXPENSE: "Add Expense",
    SETTLE_UP: "Settle Up",
    OVERALL_BALANCE: "Overall Balance",
    YOU_OWE: "You owe",
    YOU_ARE_OWED: "You are owed",
    EXPENSES_TAB: "Expenses",
    BALANCES_TAB: "Balances",
    NO_GROUPS: "No groups yet.",
    CREATE_FIRST_GROUP: "Create your first group to start splitting bills!",
    MEMBER: "member",
    MEMBERS: "members",
    PAID_BY: "paid by",
    NO_EXPENSES: "No expenses recorded in this group yet.",
    LOADING: "Loading...",
    EQUAL_SPLIT: "Equally",
    UNEQUAL_SPLIT: "Unequally",
    SHARES: "shares",
    SETTLED_UP: "Settled Up"
};

// --- INITIALIZATION ---

// Add to initializeListeners - fetches the list of groups
const initializeGroupListeners = async () => {
    if (!appState.token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/groups`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            appState.groups = data.groups || [];
            // We don't automatically select a group, we show the dashboard summary first
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
};

const inviteMember = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/invite`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate link');
        }

        const data = await response.json();
        const link = `${window.location.origin}/?join=${data.invite_token}`;

        showInviteLinkModal(link);

    } catch (error) {
        console.error('Error inviting member:', error);
        setAlert(error.message, 'error');
    }
};

// --- API ACTIONS ---

const loadGroupDetails = async (groupId) => {
    try {
        // Parallel fetch for efficiency
        const [balancesRes, expensesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/groups/${groupId}/balances`, {
                headers: { 'Authorization': `Bearer ${appState.token}` }
            }),
            fetch(`${API_BASE_URL}/groups/${groupId}/transactions?limit=50`, {
                headers: { 'Authorization': `Bearer ${appState.token}` }
            })
        ]);

        if (balancesRes.ok) {
            const data = await balancesRes.json();
            appState.groupBalances[groupId] = data.balances;
        }

        if (expensesRes.ok) {
            const data = await expensesRes.json();
            // Store expenses in a new map or specialized state area to avoid conflict with main transactions list
            if (!appState.groupExpenses) appState.groupExpenses = {};
            appState.groupExpenses[groupId] = data.transactions;
        }

    } catch (error) {
        console.error('Error loading group details:', error);
        setAlert('Failed to load group details', 'error');
    }
};

// --- UI RENDERING ---

const renderGroupsView = (container) => {
    if (!container) return;

    // Main Layout: Sidebar (List) + Main (Content)
    // using dvh for mobile address bar adjustment
    container.innerHTML = `
        <div class="flex flex-col md:flex-row h-[calc(100dvh-180px)] md:h-[calc(100vh-220px)] bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-200 isolate" id="groups-layout-container">
            
            <!-- Sidebar: Groups List -->
            <!-- On mobile: hide if group selected -->
            <div id="groups-sidebar-panel" class="w-full md:w-1/3 min-w-[300px] border-r border-gray-200 bg-white flex flex-col z-10 
                 ${appState.selectedGroupId ? 'hidden md:flex' : 'flex'}">
                <!-- Sidebar Header -->
                <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 class="font-bold text-gray-800 text-lg">${T.GROUPS_TITLE}</h2>
                    <button onclick="showCreateGroupModal()" 
                            class="flex items-center gap-2 text-emerald-600 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors font-medium text-sm"
                            title="${T.CREATE_GROUP}">
                        <i class="fas fa-plus"></i> <span class="hidden md:inline">New Group</span>
                    </button>
                </div>

                <!-- Groups List Container -->
                <div class="overflow-y-auto flex-1 p-2 space-y-2" id="groups-list-container">
                    ${renderGroupsListItems()}
                </div>
            </div>

            <!-- Main Content: Dashboard or Group Details -->
            <!-- On mobile: hide if NO group selected (show summary only on desktop or if forced) -->
            <div id="groups-main-panel" class="flex-1 flex flex-col bg-gray-50 relative overflow-hidden 
                 ${!appState.selectedGroupId ? 'hidden md:flex' : 'flex'}">
                ${appState.selectedGroupId ? renderSelectedGroupView() : renderOverallSummaryView()}
            </div>
        </div>
    `;
};

// Helper: Render the list of groups for the sidebar
const renderGroupsListItems = () => {
    if (!appState.groups || appState.groups.length === 0) {
        return `
            <div class="p-8 text-center text-gray-400">
                <i class="fas fa-users text-3xl mb-2"></i>
                <p class="text-sm">${T.NO_GROUPS}</p>
                <button onclick="showCreateGroupModal()" class="mt-4 text-emerald-600 text-sm font-medium hover:underline">
                    ${T.CREATE_FIRST_GROUP}
                </button>
            </div>
        `;
    }

    return appState.groups.map(group => {
        const isSelected = appState.selectedGroupId && String(appState.selectedGroupId) === String(group.id);
        const balance = parseFloat(group.user_balance);
        const isCreator = String(group.created_by_user_id) === String(appState.userId);

        let balanceText = '<span class="text-gray-400 text-xs">Settled</span>';
        let balanceClass = 'text-gray-400';

        if (balance > 0) {
            balanceText = `${T.YOU_ARE_OWED} <span class="font-bold">₹${balance.toFixed(2)}</span>`;
            balanceClass = 'text-emerald-600';
        } else if (balance < 0) {
            balanceText = `${T.YOU_OWE} <span class="font-bold">₹${Math.abs(balance).toFixed(2)}</span>`;
            balanceClass = 'text-red-500';
        }

        return `
            <div onclick="selectGroup('${group.id}')"
                 class="group-item relative group p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
                 ${isSelected ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'hover:bg-gray-50 hover:border-gray-200'}">
                <div class="flex justify-between items-start">
                    <div class="flex items-center space-x-3">
                         <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200 shadow-sm">
                            ${(group.group_name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-800 text-sm truncate max-w-[140px]">${group.group_name}</h3>
                            <p class="text-[10px] text-gray-500 flex items-center gap-1">
                                <i class="fas fa-user-friends text-[8px]"></i> ${group.member_count}
                            </p>
                        </div>
                    </div>
                    <div class="text-right flex flex-col items-end">
                        <span class="text-xs ${balanceClass}">${balanceText}</span>
                    </div>
                </div>
                
                <!-- Action Buttons (Always Visible for Creator) -->
                ${isCreator ? `
                <div class="absolute top-2 right-2 flex space-x-2 bg-white/80 rounded px-1 backdrop-blur-sm shadow-sm">
                    <button onclick="event.stopPropagation(); editGroup('${group.id}', '${group.group_name}')" 
                            class="p-1 text-gray-500 hover:text-blue-600 transition-colors" title="Edit Group">
                        <i class="fas fa-pen text-xs"></i>
                    </button>
                    <button onclick="event.stopPropagation(); deleteGroup('${group.id}', '${group.group_name}')" 
                            class="p-1 text-gray-500 hover:text-red-600 transition-colors" title="Delete Group">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
};

// Helper: Render the "Overall Summary" (Default View)
const renderOverallSummaryView = () => {
    // Calculate totals
    let totalOwedToYou = 0;
    let totalYouOwe = 0;

    (appState.groups || []).forEach(g => {
        const bal = parseFloat(g.user_balance);
        if (bal > 0) totalOwedToYou += bal;
        if (bal < 0) totalYouOwe += Math.abs(bal);
    });

    return `
        <div class="h-full flex flex-col items-center justify-center p-8 bg-gray-50">
            <div class="text-center max-w-md w-full">
                <div class="mb-8">
                    <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                        <i class="fas fa-wallet text-3xl text-emerald-600"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Split Expenses Center</h2>
                    <p class="text-gray-500 text-sm">Select a group to view expenses or check your overall status below.</p>
                </div>

                <div class="grid grid-cols-2 gap-4 w-full mb-8">
                    <div class="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                        <p class="text-xs text-emerald-600 font-medium uppercase mb-1">${T.YOU_ARE_OWED}</p>
                        <p class="text-2xl font-bold text-emerald-600">₹${totalOwedToYou.toFixed(2)}</p>
                    </div>
                    <div class="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                        <p class="text-xs text-red-500 font-medium uppercase mb-1">${T.YOU_OWE}</p>
                        <p class="text-2xl font-bold text-red-500">₹${totalYouOwe.toFixed(2)}</p>
                    </div>
                </div>
                 
                 <div class="bg-amber-50 rounded-lg p-4 border border-amber-200 text-left">
                     <h4 class="font-bold text-amber-800 text-sm mb-1"><i class="fas fa-info-circle mr-1"></i> Quick Tips</h4>
                     <ul class="list-disc list-inside text-xs text-amber-700 space-y-1">
                        <li>Tap a group on the left to add expenses.</li>
                        <li>Settle debts directly from the group details view.</li>
                        <li>Use "Create Group" to start a new expense sharing circle.</li>
                     </ul>
                 </div>
            </div>
        </div>
    `;
};

// Helper: Render the specific selected group View
const renderSelectedGroupView = () => {
    const group = appState.groups.find(g => String(g.id) === String(appState.selectedGroupId));
    if (!group) return renderOverallSummaryView();

    const transactions = (appState.groupExpenses && appState.groupExpenses[group.id]) || [];
    const balances = (appState.groupBalances && appState.groupBalances[group.id]) || [];

    // Calculate user's specific balance in this group
    const myBalanceObj = balances.find(b => String(b.user_id) === String(appState.userId));
    const myBalance = myBalanceObj ? parseFloat(myBalanceObj.net_balance) : 0;

    const isCreator = String(group.created_by_user_id) === String(appState.userId);

    return `
        <!-- Group Header -->
        <div class="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-20 flex justify-between items-center sticky top-0">
            <div class="flex items-center overflow-hidden">
                 <button onclick="deselectGroup()" class="md:hidden mr-3 text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"><i class="fas fa-arrow-left"></i></button>
                 <div class="min-w-0">
                     <h2 class="text-xl font-bold text-gray-800 truncate flex items-center gap-2">
                        ${group.group_name}
                        ${isCreator ? `
                            <button onclick="editGroup('${group.id}', '${group.group_name}')" class="text-gray-400 hover:text-blue-600 text-sm p-1 ml-1" title="Edit Name"><i class="fas fa-pen"></i></button>
                            <button onclick="deleteGroup('${group.id}', '${group.group_name}')" class="text-gray-400 hover:text-red-600 text-sm p-1" title="Delete Group"><i class="fas fa-trash"></i></button>
                        ` : ''}
                     </h2>
                     <p class="text-xs text-gray-500 mt-1 truncate">${group.member_count} ${T.MEMBERS}</p>
                 </div>
            </div>
            <div class="flex space-x-2 shrink-0 ml-2">
                ${isCreator ? `
                <button onclick="inviteMember('${group.id}')" 
                        class="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 whitespace-nowrap" title="Invite Link">
                    <i class="fas fa-link"></i> <span class="hidden sm:inline ml-1">Invite</span>
                </button>
                ` : ''}
                <button onclick="showSettleUpModal('${group.id}', ${myBalance})" 
                        class="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300 whitespace-nowrap">
                    ${T.SETTLED_UP}
                </button>
                <button onclick="showAddExpenseModal('${group.id}')" 
                        class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap">
                    <i class="fas fa-receipt"></i> <span class="hidden sm:inline">${T.ADD_EXPENSE}</span>
                </button>
            </div>
        </div>

        <!-- Scrollable Content Area -->
        <div class="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 pb-20">
            
            <!-- Dashboard Cards for this Group -->
             <div class="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 class="text-xs font-semibold text-gray-400 uppercase mb-3">Your Status</h3>
                ${renderUserGroupStatus(myBalance)}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Left Col: Transactions List -->
                <div>
                     <h3 class="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                        <span>Latest Expenses</span>
                        <span class="text-xs font-normal text-gray-500 cursor-pointer hover:underline">View All</span>
                     </h3>
                     <div class="space-y-3">
                         ${transactions.length > 0 ? transactions.map(t => renderTransactionCard(t)).join('') :
            `<div class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 text-sm">
                                <i class="fas fa-receipt text-2xl mb-2 opacity-50"></i><br>${T.NO_EXPENSES}
                            </div>`
        }
                     </div>
                </div>

                <!-- Right Col: Balances List -->
                <div>
                     <h3 class="text-sm font-bold text-gray-700 mb-3">Member Balances</h3>
                     <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        ${renderMemberBalancesList(balances, group.id)}
                     </div>
                </div>
            </div>
        </div>
    `;
};

const renderUserGroupStatus = (balance) => {
    if (balance === 0) {
        return `<div class="flex items-center text-gray-600"><i class="fas fa-check-circle text-emerald-500 mr-2"></i> ${T.SETTLED_UP}</div>`;
    }
    const color = balance > 0 ? 'text-emerald-600' : 'text-red-500';
    const text = balance > 0 ? T.YOU_ARE_OWED : T.YOU_OWE;
    return `
        <div class="flex items-baseline">
            <span class="${color} text-3xl font-bold mr-2">₹${Math.abs(balance).toFixed(2)}</span>
            <span class="text-gray-500 text-sm font-medium uppercase">${text} in total</span>
        </div>
    `;
};

const renderTransactionCard = (t) => {
    // Assuming t structure matches what backend returns for /groups/:id/transactions
    // t: { id, description, amount, paid_by_user_id, paid_by_name, transaction_date, ... }
    const date = new Date(t.transaction_date || t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const isPayer = String(t.paid_by_user_id) === String(appState.userId);

    return `
        <div class="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer">
            <div class="flex items-center space-x-3">
                <div class="flex flex-col items-center justify-center w-10 h-10 bg-gray-50 rounded border border-gray-200 text-xs font-bold text-gray-500 leading-tight">
                    <span>${date.split(' ')[0]}</span>
                    <span>${date.split(' ')[1]}</span>
                </div>
                <div>
                    <h4 class="font-medium text-gray-800 text-sm">${t.description}</h4>
                    <p class="text-xs text-gray-500">
                        ${isPayer ? 'You' : t.paid_by_name || 'Someone'} paid <span class="font-semibold">₹${parseFloat(t.amount).toFixed(2)}</span>
                    </p>
                </div>
            </div>
            <div class="text-right">
                 <!-- Here we could show "You borrowed" or "You lent" if we calculate the split share. For now just generic. -->
                 <span class="text-xs font-medium text-gray-400">Expense</span>
            </div>
        </div>
    `;
};

const renderMemberBalancesList = (balances, groupId) => {
    if (!balances || balances.length === 0) return '<div class="p-4 text-center text-gray-400 text-xs">No balances calculated yet.</div>';

    return balances.map(b => {
        const isMe = String(b.user_id) === String(appState.userId);
        const bal = parseFloat(b.net_balance);
        const isSettled = Math.abs(bal) < 0.01;

        return `
            <div class="flex justify-between items-center p-3 border-b border-gray-100 last:border-0 ${isMe ? 'bg-indigo-50/50' : ''}">
                <div class="flex items-center space-x-2">
                     <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        ${(b.user_name || '?').charAt(0)}
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-800">${isMe ? 'You' : b.user_name}</p>
                    </div>
                </div>
                <div class="text-right">
                    ${isSettled
                ? `<span class="text-xs text-gray-400 flex items-center gap-1"><i class="fas fa-check"></i> Settled</span>`
                : `<p class="text-sm font-bold ${bal > 0 ? 'text-emerald-600' : 'text-red-500'}">
                            ${bal > 0 ? 'gets' : 'owes'} ₹${Math.abs(bal).toFixed(2)}
                           </p>`
            }
                </div>
            </div>
        `;
    }).join('');
};


// --- ACTIONS ---

const selectGroup = async (groupId) => {
    appState.selectedGroupId = groupId;

    // 1. Update List Highlighting (Preserve Scroll)
    const allItems = document.querySelectorAll('.group-item');
    allItems.forEach(item => {
        // Simple check based on onclick attribute or id match if we added one (we didn't add ID to div, relying on onclick is messy)
        // Let's rely on re-rendering just the list container is safer than full view but still risks scroll.
        // Best: Add data-id to list items
        if (item.getAttribute('onclick')?.includes(groupId)) {
            item.classList.add('bg-emerald-50', 'border-emerald-200', 'shadow-sm');
            item.classList.remove('hover:bg-gray-50', 'hover:border-gray-200');
        } else {
            item.classList.remove('bg-emerald-50', 'border-emerald-200', 'shadow-sm');
            item.classList.add('hover:bg-gray-50', 'hover:border-gray-200');
        }
    });

    // 2. Show Loading in Main View
    const mainView = document.getElementById('groups-main-panel') || document.getElementById('groups-main-view'); // supporting both naming conventions just in case
    // Wait, in the template it is 'groups-main-panel' in one place and 'group-main-view' in another?
    // Let's check the Render function. It says id="groups-main-panel".

    // Actually, I'll search for the element by ID 'groups-main-panel'.
    const panel = document.getElementById('groups-main-panel');
    if (panel) {
        panel.classList.remove('hidden'); // Ensure visible on mobile
        panel.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>';
    }

    // 3. Hide Sidebar on Mobile
    const sidebar = document.getElementById('groups-sidebar-panel');
    if (sidebar && window.innerWidth < 768) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
    }

    // 4. Fetch Data & Render Main View
    await loadGroupDetails(groupId);

    // Only update the main panel content
    if (panel) {
        panel.innerHTML = renderSelectedGroupView();
    }
};

const deselectGroup = () => {
    appState.selectedGroupId = null;

    // Show Sidebar on Mobile
    const sidebar = document.getElementById('groups-sidebar-panel');
    if (sidebar) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');
    }

    // Hide Main View on Mobile
    const panel = document.getElementById('groups-main-panel');
    if (panel) {
        if (window.innerWidth < 768) {
            panel.classList.add('hidden');
            panel.classList.remove('flex');
        }
        panel.innerHTML = renderOverallSummaryView();
    }

    // Update List Highlighting
    const allItems = document.querySelectorAll('.group-item');
    allItems.forEach(item => {
        item.classList.remove('bg-emerald-50', 'border-emerald-200', 'shadow-sm');
        item.classList.add('hover:bg-gray-50', 'hover:border-gray-200');
    });
};

const editGroup = async (groupId, currentName) => {
    const newName = prompt("Enter new group name:", currentName);
    if (!newName || newName.trim() === currentName) return;

    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
            body: JSON.stringify({ group_name: newName.trim() })
        });

        if (response.ok) {
            setAlert('Group updated', 'success');
            await initializeGroupListeners();
            if (appState.selectedGroupId === groupId) {
                renderGroupsView(document.getElementById('profile-content'));
            } else {
                renderGroupsView(document.getElementById('profile-content'));
            }
        } else {
            alert('Failed to update group');
        }
    } catch (e) { console.error(e); alert('Error updating group'); }
};

const deleteGroup = async (groupId, groupName) => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"? This cannot be undone.`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });

        if (response.ok) {
            setAlert('Group deleted', 'success');
            if (appState.selectedGroupId === groupId) {
                appState.selectedGroupId = null;
            }
            await initializeGroupListeners();
            renderGroupsView(document.getElementById('profile-content'));
        } else {
            const err = await response.text();
            alert('Failed to delete group: ' + (JSON.parse(err).message || err));
        }
    } catch (e) { console.error(e); alert('Error deleting group'); }
};

// --- MODALS ---

const showCreateGroupModal = (type = 'general') => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100">
            <h3 class="text-xl font-bold text-gray-800 mb-4">${type === 'family' ? 'Create Family Group' : T.CREATE_GROUP}</h3>
            <form id="create-group-form">
                <input type="hidden" id="new-group-type" value="${type}">
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Group Name</label>
                    <input type="text" id="new-group-name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="${type === 'family' ? 'e.g. My Family, Home Expenses' : 'e.g. Goa Trip, Apartment 302'}">
                </div>
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Add Members by Email</label>
                    <textarea id="new-group-members" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" rows="3" placeholder="email1@example.com, email2@example.com"></textarea>
                    <p class="text-xs text-gray-400 mt-1">Comma separated emails.</p>
                </div>
                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Cancel</button>
                    <button type="submit" class="px-5 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition shadow-sm">Create</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('form').onsubmit = handleCreateGroupSubmit;
};
window.showCreateGroupModal = showCreateGroupModal; // Explicitly attach to window


const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;

    // UI Loading State
    submitBtn.disabled = true;
    submitBtn.innerText = 'Creating...';
    submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

    const name = document.getElementById('new-group-name').value.trim();
    const emailsRaw = document.getElementById('new-group-members').value;
    const emails = emailsRaw.split(',').map(e => e.trim()).filter(e => e);

    if (!name) {
        alert('Name required');
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
        submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        return;
    }
    if (emails.length === 0) {
        alert('At least one member required');
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
        submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/groups/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
            body: JSON.stringify({ group_name: name, member_emails: emails, group_type: document.getElementById('new-group-type').value })
        });

        if (response.ok) {
            setAlert('Group created!', 'success');
            closeModal();
            await initializeGroupListeners(); // Refresh list

            // Just created, select it?
            const data = await response.json();
            if (data.group_id) selectGroup(data.group_id);
            else renderGroupsView(document.getElementById('profile-content'));
        } else {
            const err = await response.text();
            alert('Failed to create group: ' + (JSON.parse(err).message || err));
        }
    } catch (error) {
        console.error(error);
        alert('Networking error');
    } finally {
        // Restore button state if modal is still open (on error)
        if (document.body.contains(submitBtn)) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    }
};

const showInviteLinkModal = (link) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 class="text-lg font-bold text-gray-800">Invite Members</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-6 space-y-4">
                <p class="text-sm text-gray-600">Share this link with others to let them join this group instantly:</p>
                
                <div class="flex items-center space-x-2">
                    <input type="text" value="${link}" readonly class="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none select-all" id="invite-link-input">
                    
                    <button onclick="copyInviteLink()" class="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap">
                        <i class="fas fa-copy mr-1"></i> Copy
                    </button>
                </div>

                <div class="text-center pt-2">
                    <p class="text-xs text-gray-400">Anyone with this link can join the group.</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Auto-select text
    setTimeout(() => {
        const input = document.getElementById('invite-link-input');
        if (input) input.select();
    }, 100);
};

window.copyInviteLink = () => {
    const input = document.getElementById('invite-link-input');
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(input.value).then(() => {
            const btn = document.querySelector('button[onclick="copyInviteLink()"]');
            btn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy mr-1"></i> Copy';
            }, 2000);
        });
    }
};

const showAddExpenseModal = (groupId) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold text-gray-800 mb-4">${T.ADD_EXPENSE}</h3>
            <form id="add-group-expense-form">
                <input type="hidden" id="expense-group-id" value="${groupId}">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Description</label>
                        <input type="text" id="expense-desc" required class="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500" placeholder="e.g. Dinner, Groceries">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Amount</label>
                         <div class="relative">
                            <span class="absolute left-3 top-2 text-gray-500">₹</span>
                            <input type="number" id="expense-amount" step="0.01" required class="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-emerald-500" placeholder="0.00">
                        </div>
                    </div>
                </div>
                 <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" class="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Add Expense</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('form').onsubmit = handleAddExpenseSubmit;
};

const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    const groupId = document.getElementById('expense-group-id').value;
    const desc = document.getElementById('expense-desc').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);

    // Default to equal split for now to match prompt "Consolidate". Advanced split logic can be added later.
    // For now we use the endpoint that creates a split request internally or a group expense.
    // The previous implementation used /groups/split endpoint

    try {
        const response = await fetch(`${API_BASE_URL}/groups/split`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
            body: JSON.stringify({
                group_id: groupId,
                amount: amount,
                description: desc,
                split_method: 'equal' // Default
            })
        });

        if (response.ok) {
            setAlert('Expense added!', 'success');
            closeModal();
            await selectGroup(groupId); // Reload group data
        } else {
            alert('Failed add expense');
        }
    } catch (e) { console.error(e); alert('Error adding expense'); }
};

const showSettleUpModal = (groupId, amountOwed) => {
    // Only allow if amountOwed is negative (you owe money) for simplicity, 
    // OR if you want to record a payment you MADE to someone else (if amountOwed > 0, you shouldn't be paying?)
    // Actually, "Settle Up" usually means "I am paying someone".

    if (amountOwed >= 0 && Math.abs(amountOwed) > 0.01) {
        // If you are owed money, you can't "pay" to settle up via this flow generally, 
        // unless you are recording that YOU RECEIVED payment.
        // Let's keep it simple: Settle Up = You Pay.
        alert("You are owed money overall. To record a payment you received, please ask the payer to record it or use the expense list.");
        return;
    }

    if (Math.abs(amountOwed) < 0.01) {
        alert("You are all settled up!");
        return;
    }

    const balances = appState.groupBalances[groupId] || [];
    // People you can pay (those with positive balance, meaning they are owed money)
    const receivers = balances.filter(b => parseFloat(b.net_balance) > 0);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold text-gray-800 mb-4">${T.SETTLED_UP}</h3>
            <form id="settle-up-form">
                <p class="text-sm text-gray-600 mb-4">Record a payment you made.</p>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pay To</label>
                    <select id="settle-to-user" class="w-full px-3 py-2 border rounded-lg">
                        ${receivers.map(r => `<option value="${r.user_id}">${r.user_name} (owed ₹${parseFloat(r.net_balance).toFixed(2)})</option>`).join('')}
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input type="number" id="settle-amount" value="${Math.abs(amountOwed).toFixed(2)}" step="0.01" class="w-full px-3 py-2 border rounded-lg">
                </div>
                 <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Record Payment</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        const toUser = document.getElementById('settle-to-user').value;
        const amount = document.getElementById('settle-amount').value;

        try {
            const response = await fetch(`${API_BASE_URL}/groups/settle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
                body: JSON.stringify({
                    group_id: groupId,
                    from_user_id: appState.userId,
                    to_user_id: toUser,
                    amount: parseFloat(amount)
                })
            });

            if (response.ok) {
                setAlert('Payment recorded', 'success');
                closeModal();
                await selectGroup(groupId);
            } else {
                alert('Failed to record payment');
            }
        } catch (err) { console.error(err); alert('Error recording payment'); }
    };
};

const closeModal = () => {
    const modal = document.querySelector('.fixed.inset-0.bg-black');
    if (modal) modal.remove();
};


// --- EXPORTS ---

// Make functions globally available for inline onclicks
window.showCreateGroupModal = showCreateGroupModal;
window.selectGroup = selectGroup;
window.deselectGroup = deselectGroup;
window.showAddExpenseModal = showAddExpenseModal;
window.showSettleUpModal = showSettleUpModal;
window.closeModal = closeModal;

export { initializeGroupListeners, renderGroupsView };
