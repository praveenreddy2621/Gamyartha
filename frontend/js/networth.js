export let apiBaseUrl = '';
export let appState = null;
let setAlert = null;

export const initNetWorth = (config) => {
    apiBaseUrl = config.apiBaseUrl;
    appState = config.appState;
    setAlert = config.setAlert || ((msg) => alert(msg));
};

export const fetchNetWorth = async () => {
    try {
        const response = await fetch(`${apiBaseUrl}/networth`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch net worth: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data; // { totalAssets, totalLiabilities, netWorth, details: [] }
    } catch (error) {
        console.error('Error fetching net worth:', error);
        return null;
    }
};

export const addAsset = async (assetData) => {
    try {
        const response = await fetch(`${apiBaseUrl}/networth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify(assetData)
        });
        if (!response.ok) throw new Error('Failed to add asset');
        return true;
    } catch (error) {
        console.error('Error adding asset:', error);
        setAlert('Failed to add asset', 'error');
        return false;
    }
};

export const deleteAsset = async (id) => {
    try {
        const response = await fetch(`${apiBaseUrl}/networth/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        if (!response.ok) throw new Error('Failed to delete asset');
        return true;
    } catch (error) {
        console.error('Error deleting asset:', error);
        setAlert('Failed to delete asset', 'error');
        return false;
    }
};

export const renderNetWorthView = async (container) => {
    container.innerHTML = '<div class="text-center p-4">Loading Net Worth...</div>';
    const data = await fetchNetWorth();

    if (!data) {
        container.innerHTML = '<div class="text-red-500 p-4">Failed to load data.</div>';
        return;
    }

    const { totalAssets, totalLiabilities, netWorth, details } = data;
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 shadow-sm">
                    <h3 class="text-green-800 text-sm font-medium uppercase tracking-wide">Total Assets</h3>
                    <p class="text-2xl font-bold text-green-700 mt-1">${formatCurrency(totalAssets)}</p>
                </div>
                <div class="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl border border-red-100 shadow-sm">
                    <h3 class="text-red-800 text-sm font-medium uppercase tracking-wide">Total Liabilities</h3>
                    <p class="text-2xl font-bold text-red-700 mt-1">${formatCurrency(totalLiabilities)}</p>
                </div>
                <div class="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                    <h3 class="text-indigo-800 text-sm font-medium uppercase tracking-wide">Net Worth</h3>
                    <p class="text-2xl font-bold text-indigo-700 mt-1">${formatCurrency(netWorth)}</p>
                </div>
            </div>

            <!-- Add New Asset Form -->
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 class="font-bold text-lg mb-4 text-gray-800">Add Asset / Liability</h3>
                <form id="add-asset-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="name" placeholder="Name (e.g. HDFC Bank, Car Loan)" required class="p-2 border rounded-lg">
                    <select name="type" required class="p-2 border rounded-lg bg-white">
                        <option value="" disabled selected>Select Type</option>
                        <optgroup label="Assets (Positive)">
                            <option value="cash">Cash / Bank</option>
                            <option value="investment">Investment (Stocks, FD)</option>
                            <option value="real_estate">Real Estate</option>
                            <option value="vehicle">Vehicle</option>
                            <option value="valuable">Valuable (Gold, Art)</option>
                        </optgroup>
                        <optgroup label="Liabilities (Negative)">
                            <option value="loan">Loan</option>
                            <option value="credit_card">Credit Card Debt</option>
                            <option value="other_liability">Other Liability</option>
                        </optgroup>
                    </select>
                    <input type="number" name="amount" placeholder="Value (Positive Number)" required min="0" step="any" class="p-2 border rounded-lg">
                    <input type="text" name="description" placeholder="Description (Optional)" class="p-2 border rounded-lg">
                    <button type="submit" class="md:col-span-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium transition">
                        Add Item
                    </button>
                </form>
            </div>

            <!-- Assets List -->
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="p-4 font-semibold text-gray-700">Name</th>
                            <th class="p-4 font-semibold text-gray-700">Type</th>
                            <th class="p-4 font-semibold text-gray-700 text-right">Value</th>
                            <th class="p-4 font-semibold text-gray-700 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${details.length === 0 ? '<tr><td colspan="4" class="p-4 text-center text-gray-500">No assets recorded yet.</td></tr>' :
            details.map(item => {
                const isLiability = ['loan', 'credit_card', 'other_liability'].includes(item.type);
                const colorClass = isLiability ? 'text-red-600' : 'text-green-600';
                const displayAmount = isLiability ? `- ${formatCurrency(item.amount)}` : formatCurrency(item.amount);
                return `
                                <tr class="hover:bg-gray-50 transition">
                                    <td class="p-4 font-medium text-gray-800">${item.name}<div class="text-xs text-gray-500">${item.description || ''}</div></td>
                                    <td class="p-4 text-gray-600 capitalize">${item.type.replace('_', ' ')}</td>
                                    <td class="p-4 text-right font-bold ${colorClass}">${displayAmount}</td>
                                    <td class="p-4 text-right">
                                        <button data-id="${item.id}" class="delete-asset-btn text-red-500 hover:text-red-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Event Listeners
    document.getElementById('add-asset-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const assetData = Object.fromEntries(formData.entries());
        assetData.amount = parseFloat(assetData.amount);

        const success = await addAsset(assetData);
        if (success) {
            renderNetWorthView(container); // Refresh
        }
    };

    container.querySelectorAll('.delete-asset-btn').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('Are you sure you want to delete this item?')) {
                const success = await deleteAsset(btn.dataset.id);
                if (success) renderNetWorthView(container);
            }
        };
    });
};
