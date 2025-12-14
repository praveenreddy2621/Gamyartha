export const initRecurring = ({ apiBaseUrl, appState, setAlert }) => {
    //
};

export const createRecurring = async (apiBaseUrl, token, data) => {
    const response = await fetch(`${apiBaseUrl}/recurring`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create subscription');
    return await response.json();
};

export const updateRecurring = async (apiBaseUrl, token, id, data) => {
    const response = await fetch(`${apiBaseUrl}/recurring/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update subscription');
    return await response.json();
};

export const deleteRecurring = async (apiBaseUrl, token, id) => {
    const response = await fetch(`${apiBaseUrl}/recurring/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    // If it's already gone (404), treat it as success
    if (response.status === 404) return { message: 'Already deleted' };

    if (!response.ok) throw new Error('Failed to delete subscription');
    return await response.json();
};

export const renderRecurringView = async (container) => {
    const apiBaseUrl = window.ENV.BACKEND_API + '/api';
    const token = localStorage.getItem('authToken');
    let editingId = null; // Track which item is being edited

    const fetchTxns = async () => {
        const res = await fetch(`${apiBaseUrl}/recurring`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const d = await res.json();
        return d.recurring_transactions;
    };

    container.innerHTML = `<div class="p-8 text-center text-gray-500">Loading subscriptions...</div>`;

    let txns = [];
    try {
        txns = await fetchTxns();
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-red-500 text-center p-4">Failed to load transactions</div>`;
        return;
    }

    const renderList = () => {
        if (txns.length === 0) return `<p class="text-center text-gray-500 py-8">No active subscriptions or bills.</p>`;

        return txns.map(t => {
            // Check if payment is due (next_due_date is today or in the past)
            const nextDue = new Date(t.next_due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            nextDue.setHours(0, 0, 0, 0);
            const isDue = nextDue <= today;

            return `
            <div class="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg shadow-sm mb-3">
                <div class="flex items-center space-x-3">
                    <div class="p-2 ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800">${t.description}</h4>
                        <p class="text-xs text-gray-500">${t.category} • <span class="capitalize font-medium text-indigo-600">${t.frequency}</span></p>
                        <p class="text-[10px] ${isDue && t.payment_mode === 'manual' ? 'text-red-600 font-semibold' : 'text-gray-400'}">
                            Next due: ${new Date(t.next_due_date).toLocaleDateString()}
                            ${isDue && t.payment_mode === 'manual' ? ' ⚠️' : ''}
                        </p>
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${t.payment_mode === 'auto' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'} mt-1 inline-block">
                            ${t.payment_mode === 'auto' ? '🤖 Auto-Pay' : '✋ Manual'}
                        </span>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end">
                    <p class="font-bold text-gray-800 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">₹${t.amount}</p>
                    <div class="flex items-center space-x-2 mt-1">
                        ${t.payment_mode === 'manual' ? `
                            ${isDue ?
                        `<button class="paid-btn text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 font-semibold animate-pulse" data-id="${t.id}">💳 Payment Due</button>` :
                        `<button class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-default font-medium" disabled>✓ Paid</button>`
                    }
                            <span class="text-gray-300">|</span>
                        ` : ''}
                        <button class="edit-btn text-xs text-indigo-600 hover:text-indigo-800" data-id="${t.id}">Edit</button>
                        <span class="text-gray-300">|</span>
                        <button class="delete-btn text-xs text-red-500 hover:text-red-700" data-id="${t.id}">Delete</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    };

    container.innerHTML = `
        <div class="p-4 space-y-6">
            <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800">Subscriptions & Bills</h3>
                <button id="add-recurring-btn" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    Add New
                </button>
            </div>

            <!-- Add/Edit Form (Hidden by default) -->
            <div id="add-recurring-form-container" class="hidden bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 transition-all">
                <h4 id="form-title" class="font-bold text-gray-700 mb-3">Add Subscription or Fixed Bill</h4>
                <form id="recurring-form" class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                        <select id="rec-type" class="p-2 border rounded text-sm"><option value="expense">Expense</option><option value="income">Income</option></select>
                        <select id="rec-freq" class="p-2 border rounded text-sm">
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <div>
                        <input id="rec-desc" type="text" placeholder="Description (e.g. Netflix)" class="w-full p-2 border rounded text-sm" required />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <input id="rec-amount" type="number" placeholder="Amount (₹)" class="p-2 border rounded text-sm" required />
                        <select id="rec-category" class="p-2 border rounded text-sm">
                             <option value="Bills">Bills</option>
                             <option value="Rent">Rent</option>
                             <option value="Subscription">Subscription</option>
                             <option value="Salary">Salary</option>
                             <option value="Investment">Investment</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Payment Mode</label>
                        <select id="rec-payment-mode" class="w-full p-2 border rounded text-sm">
                            <option value="auto">🤖 Auto-Pay (Automatically deduct on due date)</option>
                            <option value="manual">✋ Manual (I'll mark as paid manually)</option>
                        </select>
                        <p class="text-[10px] text-gray-500 mt-1">Auto-Pay: Transaction created automatically. Manual: You'll get reminders and mark as paid.</p>
                    </div>
                    <div class="flex items-center space-x-2">
                         <div class="flex-1">
                             <label class="text-xs text-gray-500">Start Date</label>
                             <input id="rec-start-date" type="date" class="w-full p-2 border rounded text-sm" required />
                         </div>
                         <div class="flex items-center pt-4">
                             <input type="checkbox" id="rec-active" class="mr-2" checked>
                             <label for="rec-active" class="text-sm text-gray-600">Active</label>
                         </div>
                    </div>
                    <div class="flex justify-end space-x-2 pt-2">
                        <button type="button" id="cancel-rec-btn" class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                        <button type="submit" id="save-rec-btn" class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
                    </div>
                </form>
            </div>

            <!-- List -->
            <div id="recurring-list-container">
                ${renderList()}
            </div>
        </div>
    `;

    // Event Listeners
    const formContainer = document.getElementById('add-recurring-form-container');
    const addBtn = document.getElementById('add-recurring-btn');
    const cancelBtn = document.getElementById('cancel-rec-btn');
    const form = document.getElementById('recurring-form');
    const formTitle = document.getElementById('form-title');
    const saveBtn = document.getElementById('save-rec-btn');
    const listContainer = document.getElementById('recurring-list-container');

    const resetForm = () => {
        form.reset();
        editingId = null;
        formTitle.textContent = 'Add Subscription or Fixed Bill';
        saveBtn.textContent = 'Save';
        document.getElementById('rec-start-date').valueAsDate = new Date();
        formContainer.classList.add('hidden');
    };

    addBtn.onclick = () => {
        resetForm();
        formContainer.classList.remove('hidden');
    };

    cancelBtn.onclick = resetForm;

    // Delegate Edit/Delete clicks
    listContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this subscription?')) {
                try {
                    await deleteRecurring(apiBaseUrl, token, id);
                    txns = await fetchTxns(); // Refresh data
                    listContainer.innerHTML = renderList(); // Re-render list
                    alert('Subscription deleted.');
                } catch (err) {
                    alert('Failed to delete: ' + err.message);
                }
            }
        } else if (e.target.classList.contains('edit-btn')) {
            const id = e.target.getAttribute('data-id');
            const txn = txns.find(t => t.id == id);
            if (txn) {
                editingId = id;
                document.getElementById('rec-type').value = txn.type;
                document.getElementById('rec-freq').value = txn.frequency;
                document.getElementById('rec-desc').value = txn.description;
                document.getElementById('rec-amount').value = txn.amount;
                document.getElementById('rec-category').value = txn.category;
                document.getElementById('rec-start-date').value = txn.start_date.split('T')[0];
                document.getElementById('rec-active').checked = txn.is_active;
                document.getElementById('rec-payment-mode').value = txn.payment_mode || 'auto';

                formTitle.textContent = 'Edit Subscription';
                saveBtn.textContent = 'Update';
                formContainer.classList.remove('hidden');
                // Scroll to form
                formContainer.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (e.target.classList.contains('paid-btn')) {
            const id = e.target.getAttribute('data-id');
            if (confirm('Mark this subscription as paid for this period?')) {
                try {
                    const response = await fetch(`${apiBaseUrl}/recurring/${id}/mark-paid`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!response.ok) throw new Error('Failed to mark as paid');

                    txns = await fetchTxns();
                    listContainer.innerHTML = renderList();
                    alert('Payment recorded successfully!');
                } catch (err) {
                    alert('Failed to mark as paid: ' + err.message);
                }
            }
        }
    });


    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            type: document.getElementById('rec-type').value,
            frequency: document.getElementById('rec-freq').value,
            description: document.getElementById('rec-desc').value,
            amount: document.getElementById('rec-amount').value,
            category: document.getElementById('rec-category').value,
            start_date: document.getElementById('rec-start-date').value,
            is_active: document.getElementById('rec-active').checked,
            payment_mode: document.getElementById('rec-payment-mode').value
        };

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Processing...';

            if (editingId) {
                await updateRecurring(apiBaseUrl, token, editingId, data);
                alert('Subscription updated successfully!');
            } else {
                await createRecurring(apiBaseUrl, token, data);
                alert('Subscription added successfully!');
            }

            // Reload list
            txns = await fetchTxns();
            listContainer.innerHTML = renderList();
            resetForm();

        } catch (err) {
            alert(err.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = editingId ? 'Update' : 'Save';
        }
    };
};
