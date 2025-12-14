let API_BASE_URL = '';
let appState = {};
let setAlert = () => { };

export const initChallenges = (context) => {
    API_BASE_URL = context.apiBaseUrl;
    appState = context.appState;
    setAlert = context.setAlert;
};

export const renderChallengesView = async (container) => {
    container.innerHTML = `
        <div class="flex justify-center p-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/challenges`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await response.json();
        const challenges = data.challenges || [];

        renderDashboard(container, challenges);
    } catch (error) {
        console.error('Error loading challenges:', error);
        container.innerHTML = `<div class="text-center text-red-500 p-4">Failed to load challenges.</div>`;
    }
};

const renderDashboard = (container, challenges) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = challenges.filter(c => new Date(c.start_date) <= today);
    const upcoming = challenges.filter(c => new Date(c.start_date) > today);

    const renderChallengeCard = (c, isActive) => `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition relative">
            ${!isActive ? '<div class="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-bl-lg">UPCOMING</div>' : '<div class="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">ACTIVE</div>'}
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="inline-block px-2 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-700 mb-2 uppercase tracking-wide">
                            ${c.target_category.replace('_', ' ')}
                        </span>
                        <h4 class="text-xl font-bold text-gray-900">${c.name}</h4>
                    </div>
                </div>
                
                <p class="text-gray-600 text-sm mb-4 min-h-[40px]">${c.description}</p>
                
                <div class="flex items-center text-xs text-gray-500 mb-6 space-x-4">
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ${new Date(c.start_date).toLocaleDateString()}
                    </div>
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        ${c.participant_count} Joined
                    </div>
                </div>

                ${c.is_joined ? `
                    <div class="space-y-2">
                        <button class="w-full bg-green-50 text-green-700 py-2 rounded-lg font-semibold text-sm border border-green-200 cursor-default">
                             ${isActive ? '✅ Particpating' : '🗓️ Registered'}
                        </button>
                        ${isActive ? `
                        <button onclick="viewLeaderboard(${c.id})" class="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition">
                            View Leaderboard 📊
                        </button>` : `
                        <button disabled class="w-full bg-gray-100 text-gray-400 py-2 rounded-lg font-semibold text-sm cursor-not-allowed">
                            Starts Soon ⏳
                        </button>`}
                    </div>
                ` : `
                    <button onclick="joinChallenge(${c.id})" class="w-full bg-gray-900 text-white py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 transition">
                        ${isActive ? 'Join Late' : 'Pre-Register'}
                    </button>
                `}
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="space-y-8">
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-2xl font-bold mb-2">Savings Challenges 🏁</h2>
                        <p class="text-indigo-100 max-w-xl">
                            Join community challenges to gamify your savings! Compete with others to see who can spend the least in specific categories.
                        </p>
                    </div>
                    <div class="text-4xl">🏆</div>
                </div>
            </div>

            ${active.length > 0 ? `
                <div>
                    <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Live Challenges
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${active.map(c => renderChallengeCard(c, true)).join('')}
                    </div>
                </div>
            ` : ''}

            ${upcoming.length > 0 ? `
                <div>
                    <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <span class="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                        Upcoming Challenges
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${upcoming.map(c => renderChallengeCard(c, false)).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${challenges.length === 0 ? '<p class="text-gray-500 text-center py-8">No challenges found at this time.</p>' : ''}
            
            <!-- Leaderboard Modal Container -->
            <div id="leaderboard-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
                    <button class="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onclick="closeLeaderboard()">✕</button>
                    <div id="leaderboard-content" class="p-6"></div>
                </div>
            </div>
        </div>
    `;

    // Attach globals
    window.joinChallenge = joinChallenge;
    window.viewLeaderboard = viewLeaderboard;
    window.closeLeaderboard = () => {
        document.getElementById('leaderboard-modal').classList.add('hidden');
    };
};

const joinChallenge = async (id) => {
    if (!confirm('Are you ready to commit to this savings challenge?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/challenges/${id}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await response.json();

        if (response.ok) {
            setAlert('Successfully joined challenge!', 'success');
            renderChallengesView(document.getElementById('profile-content')); // Refresh
        } else {
            setAlert(data.error || 'Failed to join', 'error');
        }
    } catch (error) {
        console.error('Join error:', error);
        setAlert('Network error joining challenge', 'error');
    }
};

const viewLeaderboard = async (id) => {
    const modal = document.getElementById('leaderboard-modal');
    const content = document.getElementById('leaderboard-content');
    modal.classList.remove('hidden');
    content.innerHTML = '<div class="text-center py-10">Loading leaderboard...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/challenges/${id}/leaderboard`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        const { challenge, leaderboard } = data;

        content.innerHTML = `
            <div class="text-center mb-6">
                <h3 class="text-xl font-bold text-gray-800">${challenge.name}</h3>
                <p class="text-xs text-gray-500 uppercase tracking-widest mt-1">Leaderboard</p>
            </div>
            
            <div class="space-y-3">
                ${leaderboard.length === 0 ? '<p class="text-center text-gray-500">No data yet. Be the first to track expenses!</p>' : ''}
                ${leaderboard.map((user, index) => {
            const isCurrentUser = user.id === appState.userId;
            // For privacy, showing First Name + Last Initial for others
            const displayName = isCurrentUser ?
                'You' :
                user.full_name.split(' ')[0] + ' ' + (user.full_name.split(' ')[1]?.[0] || '') + '.';

            const avatarColor = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600'][index % 4];

            return `
                    <div class="flex items-center justify-between p-3 rounded-lg ${index < 3 ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50'}">
                        <div class="flex items-center space-x-3">
                            <div class="font-bold text-gray-400 w-6 text-center">#${index + 1}</div>
                            <div class="w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-xs font-bold">
                                ${user.full_name[0]}
                            </div>
                            <div>
                                <div class="font-semibold text-gray-800 ${isCurrentUser ? 'text-indigo-600' : ''}">
                                    ${displayName}
                                </div>
                            </div>
                        </div>
                        <div class="font-mono font-bold text-gray-700">
                            ₹${user.total_spent}
                        </div>
                    </div>
                `
        }).join('')}
            </div>
            
            <p class="text-center text-xs text-gray-400 mt-6">
                * Ranking based on lowest spend in target category during challenge period.
            </p>
        `;

    } catch (error) {
        content.innerHTML = '<div class="text-red-500 text-center">Failed to load leaderboard.</div>';
    }
};
