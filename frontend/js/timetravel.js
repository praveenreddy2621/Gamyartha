export const renderTimeTravelView = (container) => {
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="text-center mb-10">
                <div class="inline-block p-4 rounded-full bg-purple-100 mb-4">
                    <span class="text-4xl">🔮</span>
                </div>
                <h3 class="text-2xl font-bold text-gray-800">Financial Time Travel</h3>
                <p class="text-gray-500 mt-2">Simulate your future wealth based on your current habits.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <!-- Input Section -->
                <div class="col-span-1 space-y-6">
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Monthly Savings (current)</label>
                        <div class="relative rounded-md shadow-sm">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span class="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input type="number" id="tt-savings" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3" placeholder="0">
                        </div>
                        <p class="text-xs text-gray-400 mt-1">If you save this much every month...</p>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Years to Travel</label>
                        <input type="range" id="tt-years" min="1" max="30" value="5" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                        <div class="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1 Year</span>
                            <span id="tt-years-val" class="font-bold text-indigo-600 text-lg">5 Years</span>
                            <span>30 Years</span>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Investment Return (CAGR)</label>
                        <select id="tt-rate" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="4">4% (Savings Bank)</option>
                            <option value="7">7% (Fixed Deposit)</option>
                            <option value="12" selected>12% (Mutual Funds/SIP)</option>
                            <option value="15">15% (Aggressive Stocks)</option>
                        </select>
                    </div>
                </div>

                <!-- Visualization Section -->
                <div class="col-span-1 md:col-span-2 bg-indigo-50 rounded-xl p-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-purple-200 rounded-full opacity-50 filter blur-xl"></div>
                    <div class="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-blue-200 rounded-full opacity-50 filter blur-xl"></div>
                    
                    <div class="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <h4 class="text-sm font-medium text-indigo-800 mb-1">PROJECTED WEALTH</h4>
                            <h2 id="tt-final-amount" class="text-5xl font-extrabold text-gray-900 tracking-tight">₹0</h2>
                            <p class="text-sm text-gray-600 mt-2">
                                Total Invested: <span id="tt-invested" class="font-semibold">₹0</span>
                                <span class="mx-2">•</span>
                                Wealth Gained: <span id="tt-gained" class="font-semibold text-green-600">₹0</span>
                            </p>
                        </div>

                        <!-- Simple Bar Representation -->
                        <div class="mt-8 space-y-4">
                            <div>
                                <div class="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Without Investing (Cash)</span>
                                    <span id="tt-bar-cash-val">₹0</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5">
                                    <div id="tt-bar-cash" class="bg-gray-400 h-2.5 rounded-full" style="width: 0%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-xs text-indigo-800 mb-1">
                                    <span class="font-bold">With Compound Interest 🚀</span>
                                    <span id="tt-bar-invest-val" class="font-bold">₹0</span>
                                </div>
                                <div class="w-full bg-indigo-100 rounded-full h-4">
                                    <div id="tt-bar-invest" class="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full shadow-lg transition-all duration-1000" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-indigo-100">
                            <p id="tt-insight" class="text-sm text-indigo-900 italic">
                                "Start small. Even ₹500/month can grow into a fortune over time."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Logic
    const savingsInput = document.getElementById('tt-savings');
    const yearsInput = document.getElementById('tt-years');
    const yearsValDisplay = document.getElementById('tt-years-val');
    const rateInput = document.getElementById('tt-rate');

    const updateProjection = () => {
        const P = parseFloat(savingsInput.value) || 0; // Monthly Investment
        const t = parseInt(yearsInput.value); // Years
        const r = parseInt(rateInput.value); // Annual Rate

        yearsValDisplay.textContent = `${t} Years`;

        // SIP Formula: M = P × ({[1 + i]^n - 1} / i) × (1 + i)
        // i = monthly interest rate
        // n = number of months
        const i = (r / 100) / 12;
        const n = t * 12;

        let totalAmount = 0;
        let totalInvested = P * n;

        if (P > 0) {
            totalAmount = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
        }

        const wealthGained = totalAmount - totalInvested;

        // Update Display
        document.getElementById('tt-final-amount').textContent = formatCurrency(Math.round(totalAmount));
        document.getElementById('tt-invested').textContent = formatCurrency(Math.round(totalInvested));
        document.getElementById('tt-gained').textContent = `+${formatCurrency(Math.round(wealthGained))}`;

        // Update Bars (Normalize widths)
        const maxVal = totalAmount * 1.1; // 10% buffer
        const cashWidth = maxVal > 0 ? (totalInvested / maxVal) * 100 : 0;
        const investWidth = maxVal > 0 ? (totalAmount / maxVal) * 100 : 0;

        document.getElementById('tt-bar-cash').style.width = `${cashWidth}%`;
        document.getElementById('tt-bar-cash-val').textContent = formatCurrency(Math.round(totalInvested));

        document.getElementById('tt-bar-invest').style.width = `${investWidth}%`;
        document.getElementById('tt-bar-invest-val').textContent = formatCurrency(Math.round(totalAmount));

        // Insights
        const multiplier = totalInvested > 0 ? (totalAmount / totalInvested).toFixed(1) : 0;
        let msg = "Start investing today!";
        if (multiplier > 3) msg = "🔥 The power of compounding is making your money work hard!";
        else if (multiplier > 1.5) msg = "✅ You actally beating inflation significantly.";
        else if (P > 0) msg = "Keep going! Compounding takes time to kick in.";

        document.getElementById('tt-insight').textContent = `"${msg}"`;
    };

    // Helper
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Attach Listeners
    savingsInput.oninput = updateProjection;
    yearsInput.oninput = updateProjection;
    rateInput.onchange = updateProjection;

    // Initialize with a default value if 0
    // Try to approximate savings from monthly income - expense if available in appState
    // For now, default to 5000
    savingsInput.value = 5000;
    updateProjection();
};
