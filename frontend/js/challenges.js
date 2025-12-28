export const initChallenges = async (config) => {
    // No-op for now, or use config if needed
    console.log("Challenges module initialized");
};

export const fetchChallenges = async (apiBaseUrl, token) => {
    try {
        const response = await fetch(`${apiBaseUrl}/challenges`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch challenges');
        const data = await response.json();
        return data.challenges;
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const fetchLeaderboard = async (apiBaseUrl, token, challengeId) => {
    try {
        const response = await fetch(`${apiBaseUrl}/challenges/${challengeId}/leaderboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        const data = await response.json();
        return data.leaderboard;
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const joinChallenge = async (apiBaseUrl, token, challengeId) => {
    try {
        const response = await fetch(`${apiBaseUrl}/challenges/${challengeId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to join challenge');
        return { success: true, message: data.message };
    } catch (error) {
        console.error(error);
        alert(error.message);
        return { success: false };
    }
};

export const renderChallengesView = async (container) => {
    container.innerHTML = `<div class="p-8 text-center text-gray-500">Loading challenges...</div>`;

    const challenges = await fetchChallenges(window.ENV.BACKEND_API + '/api', localStorage.getItem('authToken'));

    if (challenges.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">🎯</div>
                <h3 class="text-xl font-bold text-gray-700">No Active Challenges</h3>
                <p class="text-gray-500 mt-2">Check back later for new savings challenges!</p>
            </div>
        `;
        return;
    }

    const renderChallengeCard = (challenge) => {
        const isJoined = challenge.is_joined;
        const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));

        return `
        <div class="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between h-full transition hover:shadow-lg relative overflow-hidden">
            ${isJoined ? `<div class="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">Joined</div>` : ''}
            
            <div>
                <div class="flex items-center mb-3">
                    <div class="bg-indigo-100 p-2 rounded-lg text-indigo-600 mr-3">
                        <i class="fas fa-trophy text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-lg leading-tight">${challenge.name}</h4>
                        <p class="text-xs text-gray-500">${daysLeft > 0 ? `${daysLeft} days left` : 'Ending soon'}</p>
                    </div>
                </div>
                
                <p class="text-sm text-gray-600 mb-4">${challenge.description}</p>
                
                <div class="flex items-center text-xs text-gray-500 mb-4 space-x-3">
                    <span class="flex items-center cursor-pointer hover:text-indigo-600 transition" onclick="window.showLeaderboard(${challenge.id}, '${challenge.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-users mr-1"></i> ${challenge.participant_count} joined
                    </span>
                    <span class="flex items-center"><i class="fas fa-bullseye mr-1"></i> ${challenge.winning_criteria.replace('_', ' ')}</span>
                </div>
            </div>

            <div class="space-y-2">
                ${isJoined ? `
                    <button disabled class="w-full bg-green-100 text-green-700 font-bold py-2 rounded-lg cursor-default flex items-center justify-center">
                        <i class="fas fa-check mr-2"></i> Active
                    </button>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-xs text-gray-500">Score: <span class="font-bold text-gray-700">₹${(challenge.current_score || 0).toLocaleString()}</span></span>
                        <button onclick="window.showLeaderboard(${challenge.id}, '${challenge.name.replace(/'/g, "\\'")}')" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition">
                             Leaderboard <i class="fas fa-chevron-right ml-1 text-[10px]"></i>
                        </button>
                    </div>
                ` : `
                    <button onclick="window.handleJoinChallenge(${challenge.id})" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition shadow-md hover:shadow-none">
                        Join Challenge
                    </button>
                    <button onclick="window.showLeaderboard(${challenge.id}, '${challenge.name.replace(/'/g, "\\'")}')" class="w-full mt-2 text-xs text-gray-500 hover:text-indigo-600 transition">
                        View Leaderboard
                    </button>
                `}
            </div>
        </div>
        `;
    };

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            ${challenges.map(renderChallengeCard).join('')}
        </div>
        
        <!-- Modal for Leaderboard -->
        <div id="leaderboard-modal" class="fixed inset-0 bg-black/50 hidden z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div class="bg-indigo-700 p-6 text-white relative">
                    <h3 id="modal-title" class="text-xl font-bold">Challenge Leaderboard</h3>
                    <p class="text-indigo-100 text-sm mt-1">Top performers</p>
                    <button onclick="document.getElementById('leaderboard-modal').classList.add('hidden')" class="absolute top-4 right-4 text-white/80 hover:text-white transition">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div id="leaderboard-content" class="p-6 max-h-[60vh] overflow-y-auto">
                    <!-- Leaderboard data will be injected here -->
                </div>
            </div>
        </div>
    `;

    // Expose handlers globally
    window.handleJoinChallenge = async (id) => {
        const result = await joinChallenge(window.ENV.BACKEND_API + '/api', localStorage.getItem('authToken'), id);
        if (result.success) {
            renderChallengesView(container);
        }
    };

    window.showLeaderboard = async (challengeId, challengeName) => {
        const modal = document.getElementById('leaderboard-modal');
        const modalTitle = document.getElementById('modal-title');
        const content = document.getElementById('leaderboard-content');

        modalTitle.innerText = challengeName;
        content.innerHTML = `<div class="flex justify-center p-8"><i class="fas fa-spinner fa-spin text-2xl text-indigo-600"></i></div>`;
        modal.classList.remove('hidden');

        const leaderboard = await fetchLeaderboard(window.ENV.BACKEND_API + '/api', localStorage.getItem('authToken'), challengeId);

        if (!leaderboard || leaderboard.length === 0) {
            content.innerHTML = `<div class="text-center py-8 text-gray-500">No participants yet. Be the first to join!</div>`;
            return;
        }

        content.innerHTML = `
            <div class="space-y-3">
                ${leaderboard.map((entry, index) => `
                    <div class="flex items-center justify-between p-3 rounded-lg ${index < 3 ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}">
                        <div class="flex items-center space-x-3">
                            <span class="w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm 
                                ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-200 text-gray-500'}">
                                ${index + 1}
                            </span>
                            <span class="font-medium text-gray-800">${entry.name}</span>
                        </div>
                        <span class="font-bold text-indigo-700">₹${Number(entry.current_score).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        `;
    };
};
