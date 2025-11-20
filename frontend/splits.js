// Split Expense Feature Module
let API_BASE_URL;
let appState;
let formatCurrency;

export function initSplits(config) {
    API_BASE_URL = config.apiBaseUrl;
    appState = config.appState;
    formatCurrency = config.formatCurrency;
}

async function createSplitRequest(data) {
    try {
        const formData = new FormData();
        formData.append('amount', data.amount);
        formData.append('description', data.description);
        formData.append('split_method', data.splitMethod.toLowerCase());
        
        // Convert participants to the format expected by backend
        const participantsData = data.participants.map(email => ({
            email: email,
            amount: data.splitMethod.toLowerCase() === 'equal' 
                ? data.amount / data.participants.length 
                : data.amount
        }));
        
        formData.append('participants', JSON.stringify(participantsData));
        
        if (data.dueDate) {
            formData.append('expires_at', data.dueDate);
        }

        const response = await fetch(`${API_BASE_URL}/splits/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${appState.token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create split request');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating split request:', error);
        throw error;
    }
}

async function getSplitRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/splits/request/list`, {
            headers: {
                'Authorization': `Bearer ${appState.token}`
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch split requests');
        }
        return await response.json().then(data => data.requests);
    } catch (error) {
        console.error('Error fetching split requests:', error);
        throw error;
    }
}

function renderSplitExpenseSection() {
    return `
        <div class="p-4 bg-white shadow-lg rounded-lg mb-4">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold text-gray-800">Split Expenses</h2>
                <button id="create-split-btn" class="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition">
                    Create Split
                </button>
            </div>

            <div id="split-requests-container" class="space-y-4">
                Loading splits...
            </div>
        </div>
    `;
}

function renderSplitRequestForm() {
    return `
        <form id="split-request-form" class="p-4 bg-white rounded-lg shadow-lg">
            <h3 class="text-lg font-semibold mb-4">Create Split Request</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Description</label>
                    <input type="text" name="description" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="What's this split for?">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Amount</label>
                    <input type="number" name="amount" required min="1"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Total amount to split">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Split Method</label>
                    <select name="splitMethod" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="equal">Equal Split</option>
                        <option value="percentage">Percentage Split</option>
                        <option value="exact">Exact Amount Split</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Add Participants (comma-separated emails)</label>
                    <input type="text" name="participants" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="friend@example.com, another@example.com">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
                    <input type="date" name="dueDate"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>

                <button type="submit"
                    class="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition">
                    Create Split Request
                </button>
            </div>
        </form>
    `;
}

async function renderSplitRequests() {
    const container = document.getElementById('split-requests-container');
    try {
        const requests = await getSplitRequests();
        
        if (requests.length === 0) {
            container.innerHTML = `
                <p class="text-gray-500 text-center py-4">No split requests yet. Create one to start splitting expenses!</p>
            `;
            return;
        }

        const requestsHtml = requests.map(request => `
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-semibold text-lg">${request.description}</h4>
                        <p class="text-sm text-gray-600">Total: ${formatCurrency(request.amount)}</p>
                    </div>
                    <span class="px-2 py-1 text-sm rounded-full ${getStatusColor(request.status)}">
                        ${request.status}
                    </span>
                </div>
                <div class="mt-4">
                    <h5 class="text-sm font-medium text-gray-700 mb-2">Participants</h5>
                    <div class="space-y-2">
                        ${request.participants.map(p => `
                            <div class="flex justify-between items-center text-sm">
                                <span>${p.email}</span>
                                <span class="font-medium ${p.status === 'paid' ? 'text-green-600' : 'text-red-600'}">
                                    ${formatCurrency(p.amount_owed)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = requestsHtml;
    } catch (error) {
        container.innerHTML = `
            <p class="text-red-500 text-center py-4">Error loading split requests. Please try again.</p>
        `;
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'partially_paid': return 'bg-blue-100 text-blue-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

export function renderSplitView(container) {
    if (!container) {
        console.error('Target container for renderSplitView is not defined.');
        return;
    }
    container.innerHTML = renderSplitExpenseSection();

    document.getElementById('create-split-btn').addEventListener('click', () => {
        const formContainer = document.getElementById('split-requests-container');
        if (!formContainer) {
            console.error('Split requests container not found for form rendering.');
            return;
        }
        formContainer.innerHTML = renderSplitRequestForm();

        // Attach form submission listener directly
        const form = document.getElementById('split-request-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                
                try {
                    const participants = formData.get('participants')
                        .split(',')
                        .map(email => email.trim())
                        .filter(email => email);

                    const splitData = {
                        description: formData.get('description'),
                        amount: parseFloat(formData.get('amount')),
                        splitMethod: formData.get('splitMethod'),
                        participants: participants,
                        dueDate: formData.get('dueDate') || null
                    };

                    await createSplitRequest(splitData);
                    await renderSplitRequests(); // Re-render the list after creation
                } catch (error) {
                    console.error('Split request error:', error);
                    alert('Failed to create split request. Please try again.');
                }
            });
        }
    });
    renderSplitRequests();
}