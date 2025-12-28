export const initGamification = ({ apiBaseUrl, appState, setAlert }) => {
    // expose to window if needed
};

export const fetchBadges = async (apiBaseUrl, token) => {
    try {
        const response = await fetch(`${apiBaseUrl}/badges`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch badges');
        const data = await response.json();
        return data.badges;
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const renderBadgesView = async (container, T = (k) => k) => {

    // Loading state
    container.innerHTML = `<div class="p-8 text-center text-gray-500">${T('GAMIFICATION_LOADING')}</div>`;

    // Fetch data
    const badges = await fetchBadges(window.ENV.BACKEND_API + '/api', localStorage.getItem('authToken'));

    if (badges.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">🏆</div>
                <h3 class="text-xl font-bold text-gray-700">${T('GAMIFICATION_NO_BADGES')}</h3>
                <p class="text-gray-500 mt-2">${T('GAMIFICATION_START_EARNING')}</p>
            </div>
        `;
        return;
    }

    const earnedBadges = badges.filter(b => b.is_earned);
    const lockedBadges = badges.filter(b => !b.is_earned);

    const renderBadgeCard = (badge, isLocked) => `
        <div class="bg-white p-4 rounded-xl shadow-md border ${isLocked ? 'border-gray-200 opacity-60 bg-gray-50' : 'border-yellow-200 bg-yellow-50'} flex flex-col items-center text-center transition hover:shadow-lg">
            <div class="text-4xl mb-3 ${isLocked ? 'grayscale' : ''}">${badge.icon}</div>
            <h4 class="font-bold text-gray-800 ${isLocked ? 'text-gray-500' : ''}">${badge.name}</h4>
            <p class="text-xs text-gray-600 mt-1 h-8 overflow-hidden">${badge.description}</p>
            
            ${isLocked ? `
                <div class="mt-3 text-xs font-semibold px-2 py-1 bg-gray-200 rounded text-gray-600">${T('GAMIFICATION_LOCKED')}</div>
            ` : `
                <div class="mt-3 text-xs font-bold px-2 py-1 bg-yellow-200 text-yellow-800 rounded">${T('GAMIFICATION_EARNED')}</div>
                <p class="text-[10px] text-gray-400 mt-1">on ${new Date(badge.awarded_at).toLocaleDateString()}</p>
            `}
        </div>
    `;

    container.innerHTML = `
        <div class="p-4">
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white mb-8 shadow-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold">${T('GAMIFICATION_YOUR_ACHIEVEMENTS')}</h2>
                        <p class="opacity-90">${T('GAMIFICATION_LEVEL_UP')}</p>
                    </div>
                    <div class="text-4xl font-black opacity-20">🏆</div>
                </div>
                <div class="mt-4 flex items-center space-x-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-full">
                    <span>${earnedBadges.length} Earned</span>
                    <span>•</span>
                    <span>${lockedBadges.length} Locked</span>
                </div>
            </div>

            <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span>${T('GAMIFICATION_EARNED_BADGES')}</span>
                <span class="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">${earnedBadges.length}</span>
            </h3>
            
            ${earnedBadges.length > 0 ? `
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    ${earnedBadges.map(b => renderBadgeCard(b, false)).join('')}
                </div>
            ` : `<p class="text-gray-500 mb-8 italic">${T('GAMIFICATION_NO_EARNED_YET')}</p>`}

            <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span>${T('GAMIFICATION_NEXT_CHALLENGES')}</span>
                <span class="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">${lockedBadges.length}</span>
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                ${lockedBadges.map(b => renderBadgeCard(b, true)).join('')}
            </div>
        </div>
    `;
};
