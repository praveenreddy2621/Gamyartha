// Notification System
// Get API base URL
const getApiBaseUrl = () => {
    return `${window.ENV?.BACKEND_API || 'http://localhost:3001'}/api`;
};

let notificationsData = [];
let unreadCount = 0;

// Load notifications from API
const loadNotifications = async () => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No auth token found, skipping notification load');
            return;
        }

        const apiUrl = `${getApiBaseUrl()}/notifications`;

        const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error('Failed to fetch notifications:', response.status, response.statusText);
            throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        notificationsData = data.notifications || [];
        unreadCount = notificationsData.filter(n => !n.read_at).length;

        unreadCount = notificationsData.filter(n => !n.read_at).length;
        updateNotificationUI();
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
};

// Update notification UI
const updateNotificationUI = () => {
    const badge = document.getElementById('notification-badge');
    const list = document.getElementById('notifications-list');

    if (!badge || !list) return;

    // Update badge
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    // Update list
    if (notificationsData.length === 0) {
        list.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No notifications</div>';
        return;
    }

    list.innerHTML = notificationsData.map(n => `
        <div class="p-3 hover:bg-gray-50 cursor-pointer ${n.read_at ? '' : 'bg-blue-50'}" onclick="handleNotificationClick('${n.id}')">
            <div class="flex items-start">
                <div class="flex-shrink-0 mr-3">
                    ${getNotificationIcon(n.type)}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">${n.title}</p>
                    <p class="text-xs text-gray-600 mt-1">${n.message}</p>
                    <p class="text-xs text-gray-400 mt-1">${formatTimeAgo(new Date(n.created_at))}</p>
                </div>
            </div>
        </div>
    `).join('');
};

// Get icon for notification type
const getNotificationIcon = (type) => {
    const icons = {
        split_reminder: '<i class="fas fa-clock text-yellow-500"></i>',
        payment_received: '<i class="fas fa-check-circle text-green-500"></i>',
        split_completed: '<i class="fas fa-check-double text-green-500"></i>',
        split_created: '<i class="fas fa-plus-circle text-blue-500"></i>',
        recurring_processed: '<svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>',
        obligation_due: '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>'
    };
    return icons[type] || '<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>';
};

// Format time ago
const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

// Handle notification click
window.handleNotificationClick = async (notificationId) => {
    try {
        const token = localStorage.getItem('authToken');
        await fetch(`${getApiBaseUrl()}/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Reload notifications
        await loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

// Mark all as read
const markAllAsRead = async () => {
    try {
        const token = localStorage.getItem('authToken');
        await fetch(`${getApiBaseUrl()}/notifications/read-all`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        await loadNotifications();
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
};

// Initialize notification system
window.initNotifications = () => {

    const container = document.getElementById('notification-container');
    const btn = document.getElementById('notification-btn');
    const dropdown = document.getElementById('notifications-dropdown');
    const markAllBtn = document.getElementById('mark-all-read-btn');

    if (!container || !btn || !dropdown) {
        console.error('❌ Notification elements not found!');
        return;
    }

    // Show notification container
    container.classList.remove('hidden');

    // ONLY attach listeners if not already attached
    if (!window.notificationsListenersAttached) {
        // Toggle dropdown
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        // Mark all as read
        if (markAllBtn) {
            markAllBtn.addEventListener('click', markAllAsRead);
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        window.notificationsListenersAttached = true;
        console.log('🔔 Notification listeners attached');
    }

    // Load notifications immediately
    loadNotifications();

    // Clear existing interval if any to prevent duplicates
    if (window.notificationInterval) {
        clearInterval(window.notificationInterval);
    }

    // Refresh every 30 seconds
    window.notificationInterval = setInterval(loadNotifications, 30000);
};