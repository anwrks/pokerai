// AI Poker Web App - iPhone Edition
// Fixed version with better error handling

const state = {
    holeCards: [],
    communityCards: [],
    gameMode: 'holdem',
    playerCount: 2,
    apiKey: null,
    currentCardType: null,
    selectedRank: null,
    selectedSuit: null,
    handHistory: [],
    currentAnalysis: null
};

// Initialize
function init() {
    console.log('🎮 Initializing AI Poker...');
    
    // Auto-configure API key for testing
    if (!localStorage.getItem('anthropic_api_key')) {
        localStorage.setItem('anthropic_api_key', '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');
        console.log('✅ API key auto-configured');
    }
    
    loadAPIKey();
    loadHistory();
    updateBadge();
    checkAPIStatus();
    updateTime();
    
    // Event listeners
    document.getElementById('game-mode').addEventListener('change', (e) => {
        state.gameMode = e.target.value;
        updateHoleCardRequirement();
        console.log('Game mode changed to:', state.gameMode);
    });
    
    document.getElementById('player-count').addEventListener('change', (e) => {
        state.playerCount = parseInt(e.target.value);
        console.log('Player count changed to:', state.playerCount);
        if (state.currentAnalysis) {
            analyzeHand();
        }
    });
    
    console.log('✅ Initialization complete');
}

// Time display
function updateTime() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: false});
    document.getElementById('time').textContent = time;
    setTimeout(updateTime, 60000);
}

// API Key
function loadAPIKey() {
    state.apiKey = localStorage.getItem('anthropic_api_key');
    console.log('API Key:', state.apiKey ? '✅ Loaded' : '❌ Not found');
}

function checkAPIStatus() {
    const status = document.getElementById('api-status');
    if (state.apiKey && state.apiKey.startsWith('sk-ant-')) {
        status.className = 'text-xs px-3 py-2 bg-green-600/20 border border-green-600/30 text-green-400 rounded-lg text-center';
        status.textContent = '✓ API Key Configured';
        status.onclick = null;
    } else {
        status.className = 'text-xs px-3 py-2 bg-yellow-600/20 border border-yellow-600/30 text-yellow-400 rounded-lg text-center cursor-pointer';
        status.textContent = '⚠️ Tap to set API key';
        status.onclick = promptForAPIKey;
    }
}

function promptForAPIKey() {
    const key = prompt('Enter your Anthropic API key:\n\n(Get one at console.anthropic.com)');
    if (key && key.startsWith('sk-ant-')) {
        localStorage.setItem('anthropic_api_key', key);
        state.apiKey = key;
        checkAPIStatus();
        alert('✓ API key saved!');
        console.log('✅ API key configured');
    } else if (key) {
        alert('❌ Invalid API key. Should start with "sk-ant-"');
    }
}

// Modal handling
function showManualEntry(type) {
    state.currentCardType = type;
    state.selectedRank = null;
    state.selectedSuit = null;
    updateCardPreview();
    resetButtonStyles();
    document.getElementById('manual-modal').classList.add('active');
    console.log('Opening manual entry for:', type);
}

function closeModal() {
    document.getElementById('manual-modal').classList.remove('active');
    state.selectedRank = null;
    state.selectedSuit = null;
    resetButtonStyles();
}

function resetButtonStyles() {
    document.querySelectorAll('.rank-btn').forEach(btn => {
        btn.className = 'rank-btn px-2 py-2 bg-white/10 text-white rounded text-sm font-bold';
    });
    document.querySelectorAll('.suit-btn').forEach(btn => {
        const isRed = btn.textContent === '♥' || btn.textContent === '♦';
        btn.className = `suit-btn px-3 py-3 bg-white/10 ${isRed ? 'text-red-500' : 'text-white'} rounded text-3xl`;
    });
}

function selectRank(rank) {
    state.selectedRank = rank;
    console.log('Selected rank:', rank);
    
    // Highlight button
    resetButtonStyles();
    event.target.className = 'rank-btn px-2 py-2 bg-purple-600 text-white rounded text-sm font-bold';
    
    updateCardPreview();
    
    // Auto-add if both selected
    if (state.selectedSuit) {
        setTimeout(() => addCard(), 100);
    }
}

function selectSuit(suit) {
    state.selectedSuit = suit;
    console.log('Selected suit:', suit);
    
    // Highlight button
    resetButtonStyles();
    const isRed = suit === 'H' || suit === 'D';
    event.target.className = `suit-btn px-3 py-3 bg-purple-600 ${isRed ? 'text-red-500' : 'text-white'} rounded text-3xl`;
    
    updateCardPreview();
    
    // Auto-add if both selected
    if (state.selectedRank) {
        setTimeout(() => addCard(), 100);
    }
}

function updateCardPreview() {
    const preview = document.getElementById('card-preview');
    if (!state.selectedRank && !state.selectedSuit) {
        preview.textContent = '🃏';
        return;
    }
    
    if (state.selectedRank && state.selectedSuit) {
        const symbol = {S: '♠', H: '♥', D: '♦', C: '♣'}[state.selectedSuit];
        const isRed = state.selectedSuit === 'H' || state.selectedSuit === 'D';
        preview.innerHTML = `<span style="color: ${isRed ? '#dc2626' : '#000'}">${state.selectedRank}${symbol}</span>`;
    } else if (state.selectedRank) {
        preview.textContent = state.selectedRank + '?';
    } else {
        const symbol = {S: '♠', H: '♥', D: '♦', C: '♣'}[state.selectedSuit];
        preview.textContent = '?' + symbol;
    }
}

function addCard() {
    if (!state.selectedRank || !state.selectedSuit) {
        console.warn('Cannot add card: missing rank or suit');
        return;
    }
    
    const card = state.selectedRank + state.selectedSuit;
    const allCards = [...state.holeCards, ...state.communityCards];
    
    // Check duplicates
    if (allCards.includes(card)) {
        alert(`Card ${card} already used!`);
        state.selectedRank = null;
        state.selectedSuit = null;
        resetButtonStyles();
        updateCardPreview();
        return;
    }
    
    // Add to appropriate array
    if (state.currentCardType === 'hole') {
        const maxHole = state.gameMode === 'holdem' ? 2 : 4;
        if (state.holeCards.length < maxHole) {
            state.holeCards.push(card);
            console.log('Added hole card:', card);
        }
    } else {
        if (state.communityCards.length < 5) {
            state.communityCards.push(card);
            console.log('Added community card:', card);
        }
    }
    
    updateCardDisplay();
    state.selectedRank = null;
    state.selectedSuit = null;
    resetButtonStyles();
    updateCardPreview();
    
    // Auto-close and analyze if enough cards
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    if ((state.currentCardType === 'hole' && state.holeCards.length === maxHole) ||
        (state.currentCardType === 'community' && state.communityCards.length === 5)) {
        closeModal();
    }
    
    // Analyze if we have minimum cards
    if (state.holeCards.length === maxHole && state.communityCards.length >= 3) {
        analyzeHand();
    }
}

function removeLastCard() {
    if (state.currentCardType === 'hole' && state.holeCards.length > 0) {
        const removed = state.holeCards.pop();
        console.log('Removed hole card:', removed);
    } else if (state.currentCardType === 'community' && state.communityCards.length > 0) {
        const removed = state.communityCards.pop();
        console.log('Removed community card:', removed);
    }
    updateCardDisplay();
}

function updateCardDisplay() {
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    
    // Hole cards
    const holeContainer = document.getElementById('hole-cards');
    if (state.holeCards.length === 0) {
        holeContainer.innerHTML = Array(maxHole).fill(0).map(() => 
            '<div class="card-placeholder"></div>'
        ).join('');
    } else {
        const cards = state.holeCards.map(card => renderCard(card)).join('');
        const placeholders = Array(Math.max(0, maxHole - state.holeCards.length)).fill(0).map(() =>
            '<div class="card-placeholder"></div>'
        ).join('');
        holeContainer.innerHTML = cards + placeholders;
    }
    document.getElementById('hole-count').textContent = `${state.holeCards.length}/${maxHole}`;
    
    // Community cards
    const communityContainer = document.getElementById('community-cards');
    if (state.communityCards.length === 0) {
        communityContainer.innerHTML = Array(5).fill(0).map(() => 
            '<div class="card-placeholder"></div>'
        ).join('');
    } else {
        const cards = state.communityCards.map(card => renderCard(card)).join('');
        const placeholders = Array(Math.max(0, 5 - state.communityCards.length)).fill(0).map(() =>
            '<div class="card-placeholder"></div>'
        ).join('');
        communityContainer.innerHTML = cards + placeholders;
    }
    document.getElementById('community-count').textContent = `${state.communityCards.length}/5`;
}

function renderCard(card) {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    const symbol = {S: '♠', H: '♥', D: '♦', C: '♣'}[suit];
    const isRed = suit === 'H' || suit === 'D';
    const color = isRed ? '#dc2626' : '#000';
    
    return `
        <div class="card">
            <div class="card-rank" style="color: ${color}">${rank}</div>
            <div class="card-suit" style="color: ${color}">${symbol}</div>
        </div>
    `;
}

function updateHoleCardRequirement() {
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    if (state.holeCards.length > maxHole) {
        state.holeCards = state.holeCards.slice(0, maxHole);
    }
    updateCardDisplay();
}

// Image upload
async function uploadCards(type, input) {
    if (!state.apiKey) {
        promptForAPIKey();
        return;
    }
    
    const file = input.files[0];
    if (!file) return;
    
    console.log('📷 Uploading image for', type);
    showLoadingState('Analyzing image...');
    
    try {
        const base64 = await fileToBase64(file);
        const cards = await detectCards(base64);
        
        console.log('Cards detected:', cards);
        
        if (cards.length === 0) {
            alert('No cards detected. Try a clearer image.');
            hideLoadingState();
            return;
        }
        
        // Add detected cards
        state.currentCardType = type;
        const allCards = [...state.holeCards, ...state.communityCards];
        
        for (const card of cards) {
            if (allCards.includes(card)) {
                console.log('Skipping duplicate:', card);
                continue;
            }
            
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
        hideLoadingState();
        
        // Analyze if we have enough cards
        const maxHole = state.gameMode === 'holdem' ? 2 : 4;
        if (state.holeCards.length === maxHole && state.communityCards.length >= 3) {
            analyzeHand();
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error: ' + error.message);
        hideLoadingState();
    }
    
    // Reset input
    input.value = '';
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
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
                    {type: 'image', source: {type: 'base64', media_type: 'image/jpeg', data: base64Image}},
                    {type: 'text', text: 'Return ONLY a JSON array of playing cards visible in this image. Format: ["AS","KH","10D"]. Use A,K,Q,J,10,9,8,7,6,5,4,3,2 for ranks and S,H,D,C for suits. No explanation.'}
                ]
            }]
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    const text = data.content[0].text.trim().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
}

// Hand analysis
async function analyzeHand() {
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    if (state.holeCards.length !== maxHole || state.communityCards.length < 3) {
        console.log('Not enough cards to analyze');
        return;
    }
    
    console.log('🧠 Analyzing hand...');
    showLoadingState('Analyzing hand...');
    
    try {
        const localAnalysis = calculateLocal();
        let aiHandName = null;
        
        if (state.apiKey) {
            try {
                aiHandName = await getAIHandEvaluation();
            } catch (e) {
                console.warn('AI evaluation failed, using local:', e);
            }
        }
        
        const analysis = {
            ...localAnalysis,
            handName: aiHandName || localAnalysis.handName
        };
        
        console.log('Analysis complete:', analysis);
        state.currentAnalysis = analysis;
        displayAnalysis(analysis);
        saveToHistory(analysis);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError('Analysis failed: ' + error.message);
    }
}

async function getAIHandEvaluation() {
    if (!state.apiKey) return null;
    
    const allCards = [...state.holeCards, ...state.communityCards];
    const prompt = state.gameMode.startsWith('omaha')
        ? `In Omaha poker, you MUST use exactly 2 cards from your hand and 3 from the board. Given hole cards: ${state.holeCards.join(', ')} and community cards: ${state.communityCards.join(', ')}, what is the BEST possible poker hand? Respond with ONLY the hand name. No explanation.`
        : `Cards: ${allCards.join(', ')}. Best 5-card poker hand? Reply with only the hand name: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, Pair, or High Card.`;
    
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
            messages: [{role: 'user', content: prompt}]
        })
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.content[0].text.trim();
}

function calculateLocal() {
    const allCards = [...state.holeCards, ...state.communityCards];
    const rankCounts = {};
    const suitCounts = {};
    
    allCards.forEach(card => {
        const rank = card.slice(0, -1);
        const suit = card.slice(-1);
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    
    const counts = Object.values(rankCounts);
    const hasFlush = Object.values(suitCounts).some(c => c >= 5);
    const hasFour = counts.some(c => c === 4);
    const hasThree = counts.some(c => c >= 3);
    const pairCount = counts.filter(c => c === 2).length;
    const threeCount = counts.filter(c => c === 3).length;
    
    const rankValues = allCards.map(card => {
        const rank = card.slice(0, -1);
        const val = {'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2}[rank];
        return val;
    }).sort((a, b) => b - a);
    
    const straight = isStraight(rankValues);
    
    let handStrength = 1;
    let handName = 'High Card';
    
    if (hasFlush && straight) {
        handStrength = 9; handName = 'Straight Flush';
    } else if (hasFour) {
        handStrength = 8; handName = 'Four of a Kind';
    } else if (threeCount >= 1 && pairCount >= 1) {
        handStrength = 7; handName = 'Full House';
    } else if (hasFlush) {
        handStrength = 6; handName = 'Flush';
    } else if (straight) {
        handStrength = 5; handName = 'Straight';
    } else if (hasThree) {
        handStrength = 4; handName = 'Three of a Kind';
    } else if (pairCount >= 2) {
        handStrength = 3; handName = 'Two Pair';
    } else if (pairCount === 1) {
        handStrength = 2; handName = 'Pair';
    }
    
    const baseWinRate = state.communityCards.length === 5 ? getRiverWinRate(handStrength) : Math.min(95, handStrength * 10 + 10);
    const adjustedWinRate = adjustForPlayers(baseWinRate, handStrength);
    const outs = calculateOuts(rankCounts, suitCounts);
    const recommendation = getRecommendation(handStrength, adjustedWinRate);
    
    return {handStrength, handName, baseWinRate, adjustedWinRate, outs, recommendation};
}

function isStraight(ranks) {
    const unique = [...new Set(ranks)].sort((a, b) => b - a);
    if (unique.length < 5) return false;
    
    for (let i = 0; i <= unique.length - 5; i++) {
        if (unique[i] - unique[i + 4] === 4) return true;
    }
    
    return unique.includes(14) && unique.includes(5) && unique.includes(4) && unique.includes(3) && unique.includes(2);
}

function getRiverWinRate(strength) {
    return {1: 20, 2: 35, 3: 50, 4: 60, 5: 75, 6: 85, 7: 95, 8: 98, 9: 99}[strength] || 20;
}

function adjustForPlayers(baseWinRate, handStrength) {
    if (handStrength >= 8) return Math.max(95, baseWinRate - (state.playerCount - 2));
    const multipliers = {2: 1.0, 3: 0.85, 4: 0.72, 5: 0.62, 6: 0.54, 7: 0.48, 8: 0.43, 9: 0.39};
    const mult = multipliers[state.playerCount] || 0.30;
    const adj = handStrength >= 6 ? 1.1 : 1.0;
    return Math.max(5, Math.min(99, Math.round(baseWinRate * mult * adj)));
}

function calculateOuts(rankCounts, suitCounts) {
    if (state.communityCards.length === 5) return 0;
    let outs = 0;
    Object.values(rankCounts).forEach(c => {
        if (c === 2) outs += 2;
        if (c === 3) outs += 1;
    });
    if (Math.max(...Object.values(suitCounts)) === 4) outs += 9;
    return outs;
}

function getRecommendation(strength, winRate) {
    if (strength >= 7 || winRate >= 80) return {action: 'BET/RAISE', color: 'green'};
    if (strength >= 4 || winRate >= 60) return {action: 'CALL', color: 'blue'};
    if (strength >= 2 || winRate >= 40) return {action: 'CHECK/CALL', color: 'orange'};
    return {action: 'FOLD', color: 'red'};
}

function displayAnalysis(analysis) {
    const colorMap = {1: 'red', 2: 'red', 3: 'orange', 4: 'yellow', 5: 'yellow', 6: 'green', 7: 'green', 8: 'green', 9: 'green'};
    const color = colorMap[analysis.handStrength];
    
    document.getElementById('analysis-panel').innerHTML = `
        <div class="space-y-3">
            <div class="bg-gradient-to-br from-purple-600/20 to-purple-900/20 rounded-xl p-4 border border-purple-600/30 text-center">
                <div class="text-xs text-gray-400 mb-1">Your Hand</div>
                <div class="text-2xl font-bold text-${color}-400">${analysis.handName}</div>
                <div class="text-xs text-gray-300 mt-1">Strength: ${analysis.handStrength}/9</div>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
                <div class="bg-cyan-600/20 rounded-lg p-3 border border-cyan-600/30 text-center">
                    <div class="text-xs text-gray-400">Win Rate</div>
                    <div class="text-2xl font-bold text-cyan-400">${analysis.adjustedWinRate}%</div>
                    <div class="text-xs text-gray-500">vs ${state.playerCount - 1}</div>
                </div>
                
                <div class="bg-orange-600/20 rounded-lg p-3 border border-orange-600/30 text-center">
                    <div class="text-xs text-gray-400">Outs</div>
                    <div class="text-2xl font-bold text-orange-400">${analysis.outs}</div>
                    <div class="text-xs text-gray-500">${state.communityCards.length === 5 ? 'River' : 'to improve'}</div>
                </div>
            </div>
            
            <div class="bg-${analysis.recommendation.color}-600/20 rounded-lg p-3 border border-${analysis.recommendation.color}-600/30 text-center">
                <div class="text-xs text-gray-400 mb-1">Recommendation</div>
                <div class="text-xl font-bold text-${analysis.recommendation.color}-400">${analysis.recommendation.action}</div>
            </div>
            
            <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                <div class="text-xs text-gray-400 mb-1">🧠 AI Analysis</div>
                <div class="text-xs text-gray-300">${getCommentary(analysis)}</div>
            </div>
        </div>
    `;
}

function getCommentary(analysis) {
    if (analysis.handStrength >= 9) return `${analysis.handName}! The absolute nuts. Maximize value.`;
    if (analysis.handStrength >= 7) return `${analysis.handName}! Very strong. Bet for value.`;
    if (analysis.handStrength >= 5) return `${analysis.handName}. Solid made hand.`;
    if (analysis.handStrength >= 3) return `${analysis.handName}. Decent but vulnerable. ${analysis.outs > 0 ? `${analysis.outs} outs.` : ''}`;
    if (analysis.outs >= 9) return `Drawing hand with ${analysis.outs} outs! Good equity.`;
    return `Weak holding. Fold to aggression.`;
}

// Loading states
function showLoadingState(message) {
    document.getElementById('analysis-panel').innerHTML = `
        <div class="bg-white/5 rounded-xl p-6 border border-cyan-600/30 analyzing text-center">
            <div class="text-4xl mb-2">🎴</div>
            <div class="text-white text-sm">${message}</div>
        </div>
    `;
}

function hideLoadingState() {
    if (!state.currentAnalysis) {
        document.getElementById('analysis-panel').innerHTML = `
            <div class="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                <div class="text-5xl mb-3">🎴</div>
                <p class="text-white text-sm">Enter cards to analyze</p>
            </div>
        `;
    }
}

function showError(message) {
    document.getElementById('analysis-panel').innerHTML = `
        <div class="bg-red-600/20 rounded-xl p-4 border border-red-600/30 text-center">
            <div class="text-3xl mb-2">❌</div>
            <div class="text-red-400 text-sm">${message}</div>
        </div>
    `;
}

// History
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
    updateBadge();
    console.log('💾 Saved to history');
}

function loadHistory() {
    const saved = localStorage.getItem('hand_history');
    if (saved) {
        state.handHistory = JSON.parse(saved);
        console.log(`📖 Loaded ${state.handHistory.length} hands from history`);
    }
}

function updateBadge() {
    document.getElementById('badge').textContent = state.handHistory.length;
}

function showHistory() {
    document.getElementById('history-modal').classList.add('active');
    
    const content = document.getElementById('history-content');
    if (state.handHistory.length === 0) {
        content.innerHTML = `
            <div class="text-center py-8">
                <div class="text-5xl mb-3">📋</div>
                <div class="text-white text-sm">No hands yet</div>
            </div>
        `;
        return;
    }
    
    content.innerHTML = state.handHistory.map(hand => `
        <div class="bg-white/5 rounded-lg p-3 mb-3 border border-white/10">
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0">
                    ${hand.holeCards.map(c => renderMiniCard(c)).join(' ')}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <div class="text-sm font-bold text-white truncate">${hand.handName}</div>
                        <div class="text-xs text-gray-400">${new Date(hand.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div class="flex gap-2 text-xs text-gray-300">
                        <span>${hand.adjustedWinRate}%</span>
                        <span>•</span>
                        <span>${hand.playerCount}P</span>
                        <span>•</span>
                        <span class="text-${hand.recommendation.color}-400">${hand.recommendation.action}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderMiniCard(card) {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    const symbol = {S: '♠', H: '♥', D: '♦', C: '♣'}[suit];
    const isRed = suit === 'H' || suit === 'D';
    return `<span class="inline-block bg-white px-1 rounded text-xs font-bold" style="color: ${isRed ? '#dc2626' : '#000'}">${rank}${symbol}</span>`;
}

function closeHistoryModal() {
    document.getElementById('history-modal').classList.remove('active');
}

// Reset
function resetApp() {
    if (state.holeCards.length > 0 || state.communityCards.length > 0) {
        if (!confirm('Clear all cards?')) return;
    }
    
    state.holeCards = [];
    state.communityCards = [];
    state.currentAnalysis = null;
    updateCardDisplay();
    hideLoadingState();
    console.log('🔄 App reset');
}

// Init on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
