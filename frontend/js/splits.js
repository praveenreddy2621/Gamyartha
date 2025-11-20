// Split Expenses Feature UI Components

let API_BASE_URL;
let appState;
let setAlert;

export function initSplits(config) {
    API_BASE_URL = config.apiBaseUrl;
    appState = config.appState;
    setAlert = config.setAlert;
}

export const renderSplitView = (container) => {
    if (!container) {
        console.error('Target container for renderSplitView is not defined.');
        return;
    }
    container.innerHTML = `
        <div class="p-4">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Split Expenses</h2>
                <button id="show-new-split-modal-btn"
                        class="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">
                    <i class="fas fa-plus mr-2"></i>New Split
                </button>
            </div>

            <!-- Split Request Tabs -->
            <div class="mb-6">
                <div class="border-b border-gray-200">
                    <nav class="-mb-px flex space-x-8">
                        <button data-tab="pending"
                                class="split-tab-btn active whitespace-nowrap py-4 px-1 border-b-2 border-emerald-500 font-medium text-emerald-600">
                            Pending
                        </button>
                        <button data-tab="history"
                                class="split-tab-btn whitespace-nowrap py-4 px-1 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            History
                        </button>
                    </nav>
                </div>
            </div>

            <!-- Split Requests List -->
            <div id="pending-splits" class="space-y-4"></div>
            <div id="splits-history" class="hidden space-y-4"></div>
        </div>

        <!-- New Split Modal -->
        <div id="new-split-modal" class="modal">
            <div class="modal-content max-w-lg">
                <div class="modal-header">
                    <h3 class="text-lg font-semibold text-gray-800">Create New Split</h3>
                    <button data-modal-id="new-split-modal" class="close-modal-btn text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="split-form" class="modal-body">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Amount</label>
                            <div class="mt-1 relative rounded-md shadow-sm">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="text-gray-500 sm:text-sm">₹</span>
                                </div>
                                <input type="number" id="split-amount" required
                                       class="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                       placeholder="0.00">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">Description</label>
                            <input type="text" id="split-description" required
                                   class="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                   placeholder="e.g., Dinner at Restaurant">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">Split With (Enter email addresses, separated by commas)</label>
                            <input type="text" id="split-users" required
                                   class="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                   placeholder="e.g., user1@example.com, user2@example.com">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">Split Method</label>
                            <select id="split-method"
                                    class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                                <option value="equal">Split Equally</option>
                                <option value="percentage">Split by Percentage</option>
                                <option value="exact">Split by Exact Amount</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">Bill Image (Optional)</label>
                            <input type="file" id="bill-image" accept="image/*,application/pdf"
                                   class="mt-1 block w-full text-sm text-gray-500
                                          file:mr-4 file:py-2 file:px-4
                                          file:rounded-md file:border-0
                                          file:text-sm file:font-semibold
                                          file:bg-emerald-50 file:text-emerald-700
                                          hover:file:bg-emerald-100">
                        </div>
                    </div>
                </form>
                <div class="modal-footer">
                    <button type="button" data-modal-id="new-split-modal" class="close-modal-btn bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" form="split-form"
                            class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700">
                        Create Split Request
                    </button>
                </div>
            </div>
        </div>

        <!-- Split Details Modal -->
        <div id="split-details-modal" class="modal">
            <div class="modal-content max-w-2xl">
                <div class="modal-header">
                    <h3 class="text-lg font-semibold text-gray-800">Split Details</h3>
                    <button data-modal-id="split-details-modal" class="close-modal-btn text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" id="split-details-content"></div>
            </div>
        </div>
    `;

    // Attach event listeners now that the DOM is updated
    attachSplitViewListeners();
    loadSplitRequests();
};

function attachSplitViewListeners() {
    document.getElementById('show-new-split-modal-btn').addEventListener('click', showNewSplitModal);

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.modalId));
    });

    document.querySelectorAll('.split-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchSplitTab(btn.dataset.tab));
    });

    document.getElementById('split-form')?.addEventListener('submit', handleSplitFormSubmit);

    document.querySelectorAll('[data-split-id]').forEach(card => {
        // Ensure listeners are only added once to avoid duplicates
        if (!card.dataset.listenerAdded) {
            card.addEventListener('click', () => showSplitDetails(card.dataset.splitId));
            card.dataset.listenerAdded = 'true';
        }
    });
}

function showNewSplitModal() {
    document.getElementById('new-split-modal').style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function switchSplitTab(tabName) {
    // Update button styles
    document.querySelectorAll('.split-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-emerald-500', 'text-emerald-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    const activeBtn = document.querySelector(`.split-tab-btn[data-tab="${tabName}"]`);
    activeBtn.classList.add('active', 'border-emerald-500', 'text-emerald-600');
    activeBtn.classList.remove('border-transparent', 'text-gray-500');

    // Show/hide content
    if (tabName === 'pending') {
        document.getElementById('pending-splits').classList.remove('hidden');
        document.getElementById('splits-history').classList.add('hidden');
    } else {
        document.getElementById('pending-splits').classList.add('hidden');
        document.getElementById('splits-history').classList.remove('hidden');
    }
}

function getUserAvatar(userId) {
    // For now, return null to indicate no specific avatar is available.
    // In a real app, this would fetch a user's actual avatar URL.
    return null;
}

async function showSplitDetails(splitId) {
    const modal = document.getElementById('split-details-modal');
    const contentContainer = document.getElementById('split-details-content');
    contentContainer.innerHTML = '<p class="text-center py-8">Loading details...</p>';
    modal.style.display = 'flex';

    try {
        const response = await fetch(`${API_BASE_URL}/splits/request/${splitId}`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch split details');

        const split = await response.json();
        
        const participantsHtml = split.participants.map(p => {
            const isCurrentUser = p.user_id === appState.userId;
            const isPaid = p.status === 'paid';

            return `
                <div class="flex justify-between items-center py-3 border-b last:border-0">
                    <div class="flex items-center space-x-3">
                        ${getUserAvatar(p.user_id) ?
                            `<img src="${getUserAvatar(p.user_id)}" class="w-8 h-8 rounded-full" alt="${p.full_name}">` :
                            `<span class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm text-gray-600">${p.full_name.charAt(0).toUpperCase()}</span>`}
                        <div>
                            <p class="font-medium text-gray-800">${p.full_name} ${isCurrentUser ? '(You)' : ''}</p>
                            <p class="text-xs text-gray-500">${p.email}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-lg ${isPaid ? 'text-green-600' : 'text-red-600'}">₹${p.amount_owed}</p>
                        ${isCurrentUser && !isPaid ? `
                            <button onclick="handlePaySplit('${p.id}', '${split.id}', '${p.amount_owed}')" 
                                    class="mt-1 text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition">
                                Mark as Paid
                            </button>
                        ` : `
                            <span class="text-xs font-medium px-2 py-1 rounded-full ${isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                ${isPaid ? 'Paid' : 'Pending'}
                            </span>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        contentContainer.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h4 class="text-lg font-bold text-gray-800">${split.description}</h4>
                    <p class="text-sm text-gray-500">Total: ₹${split.amount} | Requested by: ${split.requester_name}</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h5 class="font-semibold text-gray-700 mb-2">Participants</h5>
                    ${participantsHtml}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error showing split details:', error);
        contentContainer.innerHTML = '<p class="text-center py-8 text-red-500">Could not load split details.</p>';
    }
}

// Make handlePaySplit globally accessible for the onclick handler
window.handlePaySplit = async (participantId, splitId, amount) => {
    if (!confirm(`Confirm payment of ₹${amount}?`)) return;

    // This is a simplified call. In a real app, you might have a form for payment method, etc.
    const response = await fetch(`${API_BASE_URL}/splits/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appState.token}` },
        body: JSON.stringify({ split_participant_id: participantId, amount: amount, payment_method: 'cash' })
    });

    if (response.ok) {
        setAlert('Payment recorded successfully!', 'success');
        closeModal('split-details-modal');
        loadSplitRequests(); // Refresh the main list
    } else {
        setAlert('Failed to record payment.', 'error');
    }
};

const loadSplitRequests = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/splits/request/list`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch split requests');

        const data = await response.json();
        renderSplitRequests(data.requests);
    } catch (error) {
        console.error('Error loading split requests:', error);
        setAlert('Failed to load split requests', 'error');
    }
};

const renderSplitRequests = (requests) => {
    const pendingContainer = document.getElementById('pending-splits');
    const historyContainer = document.getElementById('splits-history');

    const pendingRequests = requests.filter(r => r.status !== 'completed');
    const completedRequests = requests.filter(r => r.status === 'completed');

    pendingContainer.innerHTML = pendingRequests.length ? pendingRequests.map(renderSplitRequestCard).join('') 
        : '<p class="text-center text-gray-500 py-8">No pending split requests</p>';

    historyContainer.innerHTML = completedRequests.length ? completedRequests.map(renderSplitRequestCard).join('')
        : '<p class="text-center text-gray-500 py-8">No completed splits</p>';
    
    // Re-attach listeners to the newly rendered cards
    document.querySelectorAll('[data-split-id]').forEach(card => {
        if (!card.dataset.listenerAdded) {
            card.addEventListener('click', () => showSplitDetails(card.dataset.splitId));
            card.dataset.listenerAdded = 'true';
        }
    });
};

const renderSplitRequestCard = (request) => {
    const isRequester = request.requester_id === appState.userId;
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        partially_paid: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    return `
        <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
             data-split-id="${request.id}">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-gray-800">${request.description}</h3>
                    <p class="text-sm text-gray-500">${request.group_name}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded-full ${statusColors[request.status]}">
                    ${request.status.replace('_', ' ').toUpperCase()}
                </span>
            </div>
            <div class="mt-4 flex justify-between items-center">
                <div class="text-sm text-gray-600">
                    ${isRequester 
                        ? 'You requested' 
                        : `<div class="flex items-center space-x-2">
                               ${getUserAvatar(request.requester_id) ?
                                   `<img src="${getUserAvatar(request.requester_id)}" class="w-6 h-6 rounded-full" alt="${request.requester_name}">` :
                                   `<span class="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">${request.requester_name.charAt(0).toUpperCase()}</span>`}
                               <span>${request.requester_name} requested</span>
                           </div>`
                    }
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-800">₹${request.amount}</p>
                    <p class="text-xs text-gray-500">
                        ${request.paid_count}/${request.participant_count} paid
                    </p>
                </div>
            </div>
        </div>
    `;
};

async function handleSplitFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('amount', document.getElementById('split-amount').value);
    formData.append('description', document.getElementById('split-description').value);
    formData.append('split_method', document.getElementById('split-method').value);
    
    const userEmails = document.getElementById('split-users').value
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)
        .map(email => ({ email })); // Backend expects emails

    if (userEmails.length === 0) {
        setAlert('Please enter at least one email address', 'error');
        return;
    }

    formData.append('participants', JSON.stringify(userEmails));

    const billImage = document.getElementById('bill-image').files[0];
    if (billImage) {
        formData.append('bill_image', billImage);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/splits/request`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${appState.token}` },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create split request');
        }

        closeModal('new-split-modal');
        setAlert('Split request created successfully', 'success');
        loadSplitRequests();
    } catch (error) {
        console.error('Error creating split request:', error);
        setAlert(error.message || 'Failed to create split request', 'error');
    }
}