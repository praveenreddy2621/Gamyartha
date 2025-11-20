// Add to your existing app.js or create a new notifications.js file

// Add to appState
appState.notifications = [];
appState.unreadNotificationCount = 0;

// Notification functions
const loadNotifications = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch notifications');

        const data = await response.json();
        appState.notifications = data.notifications;
        appState.unreadNotificationCount = data.notifications.filter(n => !n.read_at).length;
        updateNotificationBadge();
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
};

const updateNotificationBadge = () => {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        badge.textContent = appState.unreadNotificationCount;
        badge.style.display = appState.unreadNotificationCount > 0 ? 'block' : 'none';
    }
};

const renderNotificationsDropdown = () => {
    return `
        <div class="relative">
            <button id="notification-btn" 
                    class="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none">
                <i class="fas fa-bell text-xl"></i>
                <span id="notification-badge" 
                      class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full ${appState.unreadNotificationCount ? '' : 'hidden'}">
                    ${appState.unreadNotificationCount}
                </span>
            </button>
            
            <div id="notifications-dropdown" 
                 class="hidden absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-800">Notifications</h3>
                        ${appState.unreadNotificationCount ? `
                            <button onclick="markAllNotificationsRead()"
                                    class="text-sm text-emerald-600 hover:text-emerald-700">
                                Mark all as read
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="max-h-96 overflow-y-auto">
                    ${appState.notifications.length ? appState.notifications.map(notification => `
                        <div class="p-4 border-b border-gray-100 hover:bg-gray-50 ${notification.read_at ? '' : 'bg-emerald-50'}"
                             onclick="handleNotificationClick('${notification.id}', '${notification.split_request_id}')">
                            <div class="flex items-start">
                                <div class="flex-shrink-0">
                                    ${getNotificationIcon(notification.type)}
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm font-medium text-gray-900">${notification.title}</p>
                                    <p class="text-sm text-gray-500">${notification.message}</p>
                                    <p class="text-xs text-gray-400 mt-1">
                                        ${formatTimeAgo(new Date(notification.created_at))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="p-4 text-center text-gray-500">
                            No notifications
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
};

const getNotificationIcon = (type) => {
    const icons = {
        split_reminder: '<i class="fas fa-clock text-yellow-500"></i>',
        payment_received: '<i class="fas fa-check-circle text-green-500"></i>',
        split_completed: '<i class="fas fa-check-double text-green-500"></i>',
        split_created: '<i class="fas fa-plus-circle text-blue-500"></i>'
    };
    return icons[type] || '<i class="fas fa-bell text-gray-500"></i>';
};

const handleNotificationClick = async (notificationId, splitRequestId) => {
    try {
        // Mark as read
        await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });

        // Navigate to split details if available
        if (splitRequestId) {
            showSplitDetails(splitRequestId);
        }

        // Refresh notifications
        loadNotifications();
    } catch (error) {
        console.error('Error handling notification:', error);
    }
};

const markAllNotificationsRead = async () => {
    try {
        await fetch(`${API_BASE_URL}/notifications/read-all`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        loadNotifications();
    } catch (error) {
        console.error('Error marking notifications as read:', error);
    }
};

// Add click handler for notification button
document.getElementById('notification-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('notifications-dropdown');
    dropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#notifications-dropdown') && !e.target.closest('#notification-btn')) {
        document.getElementById('notifications-dropdown')?.classList.add('hidden');
    }
});

// Initialize notifications on login
document.addEventListener('DOMContentLoaded', () => {
    if (appState.token) {
        loadNotifications();
        // Refresh notifications every 5 minutes
        setInterval(loadNotifications, 5 * 60 * 1000);
    }
});