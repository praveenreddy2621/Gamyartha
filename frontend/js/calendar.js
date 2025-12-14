
export const renderCalendarView = async (container, appState, API_BASE_URL) => {
    container.innerHTML = `
        <div class="space-y-4">
             <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-800">📅 Financial Calendar</h2>
                <div class="flex space-x-2 text-sm">
                    <span class="flex items-center"><span class="w-3 h-3 rounded-full bg-green-500 mr-1"></span> Income</span>
                    <span class="flex items-center"><span class="w-3 h-3 rounded-full bg-red-500 mr-1"></span> Expense</span>
                    <span class="flex items-center"><span class="w-3 h-3 rounded-full bg-yellow-500 mr-1"></span> Due Date</span>
                </div>
            </div>
            <div id="financial-calendar" class="bg-white p-2 rounded-lg shadow" style="min-height: 600px;"></div>
        </div>
    `;

    if (typeof FullCalendar === 'undefined') {
        container.innerHTML += '<div class="text-red-500">Error: FullCalendar library not loaded. Check internet connection.</div>';
        return;
    }

    try {
        // Fetch fresh data
        const [txResponse, obResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/transactions?limit=1000`, { headers: { 'Authorization': `Bearer ${appState.token}` } }),
            fetch(`${API_BASE_URL}/obligations`, { headers: { 'Authorization': `Bearer ${appState.token}` } })
        ]);

        const txData = await txResponse.json();
        const obData = await obResponse.json();

        const events = [];

        // Map Transactions
        if (txData.transactions) {
            txData.transactions.forEach(t => {
                events.push({
                    title: `${t.type === 'income' ? '+' : '-'}${t.amount} ${t.category}`,
                    start: t.transaction_date.split('T')[0], // YYYY-MM-DD
                    backgroundColor: t.type === 'income' ? '#10B981' : '#EF4444', // Green or Red
                    borderColor: t.type === 'income' ? '#059669' : '#DC2626',
                    extendedProps: {
                        description: t.description,
                        amount: t.amount,
                        type: t.type
                    }
                });
            });
        }

        // Map Obligations (Bills)
        if (obData.obligations) {
            obData.obligations.forEach(o => {
                events.push({
                    title: `⚠️ Due: ${o.amount} ${o.description}`,
                    start: o.due_date.split('T')[0],
                    backgroundColor: '#F59E0B', // Yellow/Orange
                    borderColor: '#D97706',
                    extendedProps: {
                        description: `Pay ${o.description}`,
                        amount: o.amount,
                        type: 'obligation',
                        is_paid: o.is_paid
                    }
                });
            });
        }

        const calendarEl = document.getElementById('financial-calendar');
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,listWeek'
            },
            events: events,
            eventClick: (info) => {
                const props = info.event.extendedProps;
                alert(`${info.event.title}\nAmount: ${props.amount}\n${props.description || ''}`);
            },
            height: 'auto',
            contentHeight: 600
        });

        calendar.render();

        // Hack to resize properly if inside a hidden tab initially
        setTimeout(() => calendar.updateSize(), 100);

    } catch (error) {
        console.error("Failed to load calendar data", error);
        container.innerHTML += `<div class="text-red-500">Failed to load calendar data: ${error.message}</div>`;
    }
};
