// AI Poker Web App - Main Application Logic

// State
const state = {
    holeCards: [],
    communityCards: [],
    gameMode: 'holdem',
    playerCount: 2,
    apiKey: null,
    currentCardType: null, // 'hole' or 'community'
    selectedRank: null,
    selectedSuit: null,
    handHistory: [],
    currentAnalysis: null
};

// Initialize app
function init() {
    loadAPIKey();
    loadHistory();
    updateHandCount();
    checkAPIStatus();
    
    // Set default player count
    document.getElementById('player-count').value = '2';
    
    // Event listeners
    document.getElementById('game-mode').addEventListener('change', (e) => {
        state.gameMode = e.target.value;
        updateHoleCardCount();
    });
    
    document.getElementById('player-count').addEventListener('change', (e) => {
        state.playerCount = parseInt(e.target.value);
        if (state.currentAnalysis) {
            analyzeHand();
        }
    });
}

// API Key Management
function loadAPIKey() {
    state.apiKey = localStorage.getItem('anthropic_api_key');
}

function checkAPIStatus() {
    const status = document.getElementById('api-status');
    if (state.apiKey) {
        status.className = 'px-4 py-2 bg-green-600/20 border border-green-600/30 text-green-400 rounded-lg text-sm';
        status.textContent = '✓ Configured';
    } else {
        status.className = 'px-4 py-2 bg-yellow-600/20 border border-yellow-600/30 text-yellow-400 rounded-lg text-sm cursor-pointer';
        status.textContent = '⚠️ Click to set API key';
        status.onclick = promptForAPIKey;
    }
}

function promptForAPIKey() {
    const key = prompt('Enter your Anthropic API key:\n\n(Get one at console.anthropic.com)\n\nYour key is stored locally and never sent anywhere except Anthropic.');
    if (key && key.startsWith('sk-ant-')) {
        localStorage.setItem('anthropic_api_key', key);
        state.apiKey = key;
        checkAPIStatus();
        alert('✓ API key saved! You can now analyze hands.');
    } else if (key) {
        alert('❌ Invalid API key format. Should start with "sk-ant-"');
    }
}

// Card Management
function showManualEntry(type) {
    state.currentCardType = type;
    document.getElementById('manual-modal').classList.remove('hidden');
    document.getElementById('manual-modal').classList.add('flex');
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('manual-modal').classList.add('hidden');
    document.getElementById('manual-modal').classList.remove('flex');
    state.selectedRank = null;
    state.selectedSuit = null;
    
    // Reset button styles
    document.querySelectorAll('.rank-btn').forEach(btn => {
        btn.classList.remove('bg-purple-600');
        btn.classList.add('bg-white/10');
    });
    document.querySelectorAll('.suit-btn').forEach(btn => {
        btn.classList.remove('bg-purple-600');
        btn.classList.add('bg-white/10');
    });
}

function selectRank(rank) {
    state.selectedRank = rank;
    
    // Update button styles
    document.querySelectorAll('.rank-btn').forEach(btn => {
        btn.classList.remove('bg-purple-600');
        btn.classList.add('bg-white/10');
    });
    event.target.classList.remove('bg-white/10');
    event.target.classList.add('bg-purple-600');
    
    // Auto-add if we have suit already
    if (state.selectedSuit) {
        addCard();
    }
}

function selectSuit(suit) {
    state.selectedSuit = suit;
    
    // Update button styles
    document.querySelectorAll('.suit-btn').forEach(btn => {
        btn.classList.remove('bg-purple-600');
        btn.classList.add('bg-white/10');
    });
    event.target.classList.remove('bg-white/10');
    event.target.classList.add('bg-purple-600');
    
    // Auto-add if we have rank already
    if (state.selectedRank) {
        addCard();
    }
}

function addCard() {
    if (!state.selectedRank || !state.selectedSuit) return;
    
    const card = state.selectedRank + state.selectedSuit;
    const allCards = [...state.holeCards, ...state.communityCards];
    
    // Check for duplicates
    if (allCards.includes(card)) {
        alert(`Card ${card} already used!`);
        state.selectedRank = null;
        state.selectedSuit = null;
        return;
    }
    
    // Add to appropriate array
    if (state.currentCardType === 'hole') {
        const maxHole = state.gameMode === 'holdem' ? 2 : 4;
        if (state.holeCards.length < maxHole) {
            state.holeCards.push(card);
        }
    } else {
        if (state.communityCards.length < 5) {
            state.communityCards.push(card);
        }
    }
    
    updateCardDisplay();
    state.selectedRank = null;
    state.selectedSuit = null;
    
    // Auto-close if we have enough cards
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    if ((state.currentCardType === 'hole' && state.holeCards.length === maxHole) ||
        (state.currentCardType === 'community' && state.communityCards.length === 5)) {
        closeModal();
        analyzeHand();
    }
}

function removeLastCard() {
    if (state.currentCardType === 'hole') {
        state.holeCards.pop();
    } else {
        state.communityCards.pop();
    }
    updateCardDisplay();
}

function updateCardDisplay() {
    // Hole cards
    const holeContainer = document.getElementById('hole-cards');
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    
    if (state.holeCards.length === 0) {
        holeContainer.innerHTML = '<div class="text-gray-500">No cards yet - enter below or upload image</div>';
    } else {
        holeContainer.innerHTML = state.holeCards.map(card => renderCard(card)).join('');
    }
    
    document.getElementById('hole-count').textContent = `${state.holeCards.length}/${maxHole}`;
    
    // Community cards
    const communityContainer = document.getElementById('community-cards');
    if (state.communityCards.length === 0) {
        communityContainer.innerHTML = '<div class="text-gray-500">No cards yet</div>';
    } else {
        communityContainer.innerHTML = state.communityCards.map(card => renderCard(card)).join('');
    }
    
    document.getElementById('community-count').textContent = `${state.communityCards.length}/5`;
    
    // Analyze if we have enough cards
    if (state.holeCards.length === maxHole && state.communityCards.length >= 3) {
        analyzeHand();
    }
}

function renderCard(card) {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    const suitSymbol = {S: '♠', H: '♥', D: '♦', C: '♣'}[suit];
    const isRed = suit === 'H' || suit === 'D';
    
    return `
        <div class="bg-white rounded-lg p-4 shadow-lg flex flex-col items-center justify-center w-20 h-28">
            <div class="text-2xl font-bold ${isRed ? 'text-red-600' : 'text-black'}">${rank}</div>
            <div class="text-4xl ${isRed ? 'text-red-600' : 'text-black'}">${suitSymbol}</div>
        </div>
    `;
}

function updateHoleCardCount() {
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    if (state.holeCards.length > maxHole) {
        state.holeCards = state.holeCards.slice(0, maxHole);
        updateCardDisplay();
    }
    document.getElementById('hole-count').textContent = `${state.holeCards.length}/${maxHole}`;
}

// Image Upload
async function uploadCards(type, input) {
    if (!state.apiKey) {
        promptForAPIKey();
        return;
    }
    
    const file = input.files[0];
    if (!file) return;
    
    const panel = document.getElementById('analysis-panel');
    panel.innerHTML = `
        <div class="bg-white/5 rounded-xl p-8 border border-cyan-600/30 analyzing">
            <div class="text-center">
                <div class="text-6xl mb-4">🎴</div>
                <div class="text-xl text-white mb-2">Analyzing cards...</div>
                <div class="text-gray-400">AI is detecting cards in your image</div>
            </div>
        </div>
    `;
    
    try {
        const base64 = await fileToBase64(file);
        const cards = await detectCards(base64);
        
        if (cards.length === 0) {
            alert('No cards detected. Try a clearer image.');
            return;
        }
        
        // Add detected cards
        state.currentCardType = type;
        const allCards = [...state.holeCards, ...state.communityCards];
        
        for (const card of cards) {
            if (allCards.includes(card)) continue;
            
            if (type === 'hole') {
                const maxHole = state.gameMode === 'holdem' ? 2 : 4;
                if (state.holeCards.length < maxHole) {
                    state.holeCards.push(card);
                }
            } else {
                if (state.communityCards.length < 5) {
                    state.communityCards.push(card);
                }
            }
        }
        
        updateCardDisplay();
        
    } catch (error) {
        alert('Error analyzing image: ' + error.message);
        console.error(error);
        panel.innerHTML = `
            <div class="bg-white/5 rounded-xl p-8 border border-red-600/30">
                <div class="text-center text-red-400">
                    <div class="text-4xl mb-4">❌</div>
                    <p>Error: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function detectCards(base64Image) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': state.apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 100,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        type: 'text',
                        text: 'Return ONLY a JSON array of playing cards visible in this image. Format: ["AS","KH","10D"]. Use A,K,Q,J,10,9,8,7,6,5,4,3,2 for ranks and S,H,D,C for suits. No explanation.'
                    }
                ]
            }]
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    const text = data.content[0].text.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
}

// Hand Analysis
async function analyzeHand() {
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    if (state.holeCards.length !== maxHole || state.communityCards.length < 3) {
        return;
    }
    
    const panel = document.getElementById('analysis-panel');
    panel.innerHTML = `
        <div class="bg-white/5 rounded-xl p-8 border border-purple-600/30 analyzing">
            <div class="text-center">
                <div class="text-6xl mb-4">🧠</div>
                <div class="text-xl text-white mb-2">Analyzing hand...</div>
                <div class="text-gray-400">Calculating odds and strategy</div>
            </div>
        </div>
    `;
    
    try {
        // Calculate locally first (fast)
        const localAnalysis = calculateLocal();
        
        // Get AI evaluation for hand name
        let aiHandName = null;
        if (state.apiKey) {
            aiHandName = await getAIHandEvaluation();
        }
        
        const handName = aiHandName || localAnalysis.handName;
        const analysis = {
            ...localAnalysis,
            handName
        };
        
        state.currentAnalysis = analysis;
        displayAnalysis(analysis);
        saveToHistory(analysis);
        
    } catch (error) {
        console.error('Analysis error:', error);
        panel.innerHTML = `
            <div class="bg-white/5 rounded-xl p-8 border border-red-600/30">
                <div class="text-center text-red-400">
                    <div class="text-4xl mb-4">❌</div>
                    <p>Analysis failed: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

async function getAIHandEvaluation() {
    if (!state.apiKey) return null;
    
    const allCards = [...state.holeCards, ...state.communityCards];
    const prompt = state.gameMode.startsWith('omaha')
        ? `In Omaha poker, you MUST use exactly 2 cards from your hand and 3 from the board. Given hole cards: ${state.holeCards.join(', ')} and community cards: ${state.communityCards.join(', ')}, what is the BEST possible poker hand? Respond with ONLY the hand name (e.g., 'Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House', 'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'Pair', 'High Card'). No explanation, just the hand name.`
        : `Cards: ${allCards.join(', ')}. Best 5-card poker hand? Reply with only the hand name: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, Pair, or High Card.`;
    
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': state.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 30,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.content[0].text.trim();
    } catch (error) {
        console.error('AI evaluation error:', error);
        return null;
    }
}

function calculateLocal() {
    const allCards = [...state.holeCards, ...state.communityCards];
    
    // Count ranks and suits
    const rankCounts = {};
    const suitCounts = {};
    
    allCards.forEach(card => {
        const rank = card.slice(0, -1);
        const suit = card.slice(-1);
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    
    // Check hand types
    const counts = Object.values(rankCounts);
    const hasPair = counts.some(c => c >= 2);
    const hasThree = counts.some(c => c >= 3);
    const hasFour = counts.some(c => c === 4);
    const pairCount = counts.filter(c => c === 2).length;
    const threeCount = counts.filter(c => c === 3).length;
    const hasFlush = Object.values(suitCounts).some(c => c >= 5);
    
    // Get rank values for straight checking
    const rankValues = allCards.map(card => {
        const rank = card.slice(0, -1);
        return {'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2}[rank];
    }).sort((a, b) => b - a);
    
    const straight = isStraight(rankValues);
    
    // Determine hand strength
    let handStrength = 1;
    let handName = 'High Card';
    
    if (hasFlush && straight) {
        handStrength = 9;
        handName = 'Straight Flush';
    } else if (hasFour) {
        handStrength = 8;
        handName = 'Four of a Kind';
    } else if (threeCount >= 1 && pairCount >= 1) {
        handStrength = 7;
        handName = 'Full House';
    } else if (hasFlush) {
        handStrength = 6;
        handName = 'Flush';
    } else if (straight) {
        handStrength = 5;
        handName = 'Straight';
    } else if (hasThree) {
        handStrength = 4;
        handName = 'Three of a Kind';
    } else if (pairCount >= 2) {
        handStrength = 3;
        handName = 'Two Pair';
    } else if (hasPair) {
        handStrength = 2;
        handName = 'Pair';
    }
    
    // Calculate win rate
    const baseWinRate = state.communityCards.length === 5
        ? getRiverWinRate(handStrength)
        : Math.min(95, handStrength * 10 + 10);
    
    const adjustedWinRate = adjustForPlayers(baseWinRate, handStrength, state.playerCount);
    
    // Calculate outs (simplified)
    const outs = calculateOuts(rankCounts, suitCounts, state.communityCards.length);
    
    // Generate recommendation
    const recommendation = getRecommendation(handStrength, adjustedWinRate);
    
    return {
        handStrength,
        handName,
        baseWinRate,
        adjustedWinRate,
        outs,
        recommendation,
        playerCount: state.playerCount
    };
}

function isStraight(ranks) {
    const unique = [...new Set(ranks)].sort((a, b) => b - a);
    if (unique.length < 5) return false;
    
    for (let i = 0; i <= unique.length - 5; i++) {
        if (unique[i] - unique[i + 4] === 4) return true;
    }
    
    // Check wheel (A-2-3-4-5)
    if (unique.includes(14) && unique.includes(5) && unique.includes(4) && unique.includes(3) && unique.includes(2)) {
        return true;
    }
    
    return false;
}

function getRiverWinRate(strength) {
    const rates = {1: 20, 2: 35, 3: 50, 4: 60, 5: 75, 6: 85, 7: 95, 8: 98, 9: 99};
    return rates[strength] || 20;
}

function adjustForPlayers(baseWinRate, handStrength, players) {
    if (handStrength >= 8) {
        return Math.max(95, baseWinRate - (players - 2));
    }
    
    const multipliers = {2: 1.0, 3: 0.85, 4: 0.72, 5: 0.62, 6: 0.54, 7: 0.48, 8: 0.43, 9: 0.39, 10: 0.36, 11: 0.33};
    const multiplier = multipliers[players] || 0.30;
    const strengthAdjustment = handStrength >= 6 ? 1.1 : 1.0;
    
    return Math.max(5, Math.min(99, Math.round(baseWinRate * multiplier * strengthAdjustment)));
}

function calculateOuts(rankCounts, suitCounts, communityCount) {
    if (communityCount === 5) return 0;
    
    let outs = 0;
    Object.values(rankCounts).forEach(count => {
        if (count === 2) outs += 2;
        if (count === 3) outs += 1;
    });
    
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    if (maxSuitCount === 4) outs += 9;
    
    return outs;
}

function getRecommendation(strength, winRate) {
    if (strength >= 7 || winRate >= 80) {
        return {action: 'BET/RAISE', color: 'green'};
    } else if (strength >= 4 || winRate >= 60) {
        return {action: 'CALL', color: 'blue'};
    } else if (strength >= 2 || winRate >= 40) {
        return {action: 'CHECK/CALL', color: 'orange'};
    } else {
        return {action: 'FOLD', color: 'red'};
    }
}

function displayAnalysis(analysis) {
    const strengthColor = {1: 'red', 2: 'red', 3: 'orange', 4: 'orange', 5: 'yellow', 6: 'yellow', 7: 'green', 8: 'green', 9: 'green'}[analysis.handStrength] || 'gray';
    
    const panel = document.getElementById('analysis-panel');
    panel.innerHTML = `
        <div class="space-y-6">
            <!-- Hand Name -->
            <div class="bg-gradient-to-br from-purple-600/20 to-purple-900/20 rounded-xl p-6 border border-purple-600/30">
                <div class="text-center">
                    <div class="text-sm text-gray-400 mb-2">Your Hand</div>
                    <div class="text-4xl font-bold text-${strengthColor}-400 mb-2">${analysis.handName}</div>
                    <div class="text-gray-300">Strength: ${analysis.handStrength}/9</div>
                </div>
            </div>
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gradient-to-br from-cyan-600/20 to-cyan-900/20 rounded-xl p-4 border border-cyan-600/30">
                    <div class="text-sm text-gray-400 mb-1">Win Rate</div>
                    <div class="text-3xl font-bold text-cyan-400">${analysis.adjustedWinRate}%</div>
                    <div class="text-xs text-gray-500">vs ${analysis.playerCount - 1} opponent${analysis.playerCount > 2 ? 's' : ''}</div>
                </div>
                
                <div class="bg-gradient-to-br from-orange-600/20 to-orange-900/20 rounded-xl p-4 border border-orange-600/30">
                    <div class="text-sm text-gray-400 mb-1">Outs</div>
                    <div class="text-3xl font-bold text-orange-400">${analysis.outs}</div>
                    <div class="text-xs text-gray-500">${state.communityCards.length === 5 ? 'River' : 'to improve'}</div>
                </div>
            </div>
            
            <!-- Recommendation -->
            <div class="bg-gradient-to-br from-${analysis.recommendation.color}-600/20 to-${analysis.recommendation.color}-900/20 rounded-xl p-6 border border-${analysis.recommendation.color}-600/30">
                <div class="text-sm text-gray-400 mb-2">Recommendation</div>
                <div class="text-3xl font-bold text-${analysis.recommendation.color}-400">${analysis.recommendation.action}</div>
            </div>
            
            <!-- AI Commentary -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
                <div class="text-sm text-gray-400 mb-2">🧠 AI Analysis</div>
                <div class="text-sm text-gray-300">${getCommentary(analysis)}</div>
            </div>
        </div>
    `;
}

function getCommentary(analysis) {
    const {handName, handStrength, adjustedWinRate, outs} = analysis;
    
    if (handStrength >= 9) {
        return `${handName}! The absolute nuts - you have the best possible hand. Maximize value and extract every chip.`;
    } else if (handStrength >= 7) {
        return `${handName}! Very strong hand. You're likely ahead. Bet for value and protect your hand.`;
    } else if (handStrength >= 5) {
        return `${handName}. Solid made hand. Watch for flush and full house possibilities on the board.`;
    } else if (handStrength >= 3) {
        return `${handName}. Decent hand but vulnerable to better holdings. ${outs > 0 ? `You have ${outs} outs to improve.` : 'Proceed with caution.'}`;
    } else if (outs >= 9) {
        return `Drawing hand with ${outs} outs! Strong equity to improve. Consider semi-bluffing.`;
    } else if (outs >= 4) {
        return `You have ${outs} outs to improve. Calculate pot odds before continuing.`;
    } else {
        return `Weak holding. Fold to aggression unless you have a good read.`;
    }
}

// History Management
function saveToHistory(analysis) {
    const hand = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        gameMode: state.gameMode,
        playerCount: state.playerCount,
        holeCards: [...state.holeCards],
        communityCards: [...state.communityCards],
        ...analysis
    };
    
    state.handHistory.unshift(hand);
    localStorage.setItem('hand_history', JSON.stringify(state.handHistory));
    updateHandCount();
}

function loadHistory() {
    const saved = localStorage.getItem('hand_history');
    if (saved) {
        state.handHistory = JSON.parse(saved);
    }
}

function updateHandCount() {
    document.getElementById('hand-count').textContent = state.handHistory.length;
}

function showHistory() {
    const modal = document.getElementById('history-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    const content = document.getElementById('history-content');
    
    if (state.handHistory.length === 0) {
        content.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📋</div>
                <div class="text-xl text-white mb-2">No hands yet</div>
                <div class="text-gray-400">Analyze some hands to see them here!</div>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="space-y-4">
            ${state.handHistory.map(hand => `
                <div class="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition">
                    <div class="flex items-start gap-4">
                        <div class="space-y-2">
                            <div class="flex gap-1">
                                ${hand.holeCards.map(card => renderMiniCard(card)).join('')}
                            </div>
                            ${hand.communityCards.length > 0 ? `
                                <div class="flex gap-1">
                                    ${hand.communityCards.map(card => renderMiniCard(card)).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="flex-1">
                            <div class="flex items-center justify-between mb-2">
                                <div class="text-lg font-bold text-${getStrengthColor(hand.handStrength)}-400">${hand.handName}</div>
                                <div class="text-sm text-gray-400">${new Date(hand.timestamp).toLocaleString()}</div>
                            </div>
                            
                            <div class="flex gap-4 text-sm text-gray-300">
                                <span>💪 ${hand.handStrength}/9</span>
                                <span>📊 ${hand.adjustedWinRate}% win</span>
                                <span>👥 ${hand.playerCount} players</span>
                                <span class="px-2 py-1 rounded bg-${hand.recommendation.color}-600/30 text-${hand.recommendation.color}-400">${hand.recommendation.action}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="mt-6 pt-6 border-t border-white/10">
            <div class="flex gap-4">
                <button onclick="exportHistory('json')" class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition">
                    📥 Export JSON
                </button>
                <button onclick="clearHistory()" class="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white transition">
                    🗑️ Clear All
                </button>
            </div>
        </div>
    `;
}

function renderMiniCard(card) {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    const suitSymbol = {S: '♠', H: '♥', D: '♦', C: '♣'}[suit];
    const isRed = suit === 'H' || suit === 'D';
    
    return `<span class="card-mini ${isRed ? 'red' : ''}">${rank}${suitSymbol}</span>`;
}

function getStrengthColor(strength) {
    if (strength >= 7) return 'green';
    if (strength >= 4) return 'yellow';
    if (strength >= 2) return 'orange';
    return 'red';
}

function closeHistoryModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('history-modal').classList.add('hidden');
    document.getElementById('history-modal').classList.remove('flex');
}

function exportHistory(format) {
    if (format === 'json') {
        const json = JSON.stringify(state.handHistory, null, 2);
        downloadFile(json, 'poker-hands.json', 'application/json');
    }
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all hand history?')) {
        state.handHistory = [];
        localStorage.removeItem('hand_history');
        updateHandCount();
        showHistory();
    }
}

// Reset
function resetApp() {
    state.holeCards = [];
    state.communityCards = [];
    state.currentAnalysis = null;
    updateCardDisplay();
    
    document.getElementById('analysis-panel').innerHTML = `
        <div class="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
            <div class="text-gray-400 mb-4">
                <div class="text-6xl mb-4">🎴</div>
                <p class="text-lg">Enter your cards to see AI analysis</p>
                <p class="text-sm mt-2">Upload images or use manual entry</p>
            </div>
        </div>
    `;
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
