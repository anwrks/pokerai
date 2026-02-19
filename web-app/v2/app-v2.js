// AI Poker Pro - v2.0 with Gamification
console.log('🎮 AI Poker Pro v2.0 Loading...');

// ===== STATE =====
const state = {
    // Player progression
    level: 1,
    xp: 0,
    totalXP: 0,
    tier: 'Bronze',
    
    // Cards
    holeCards: [],
    communityCards: [],
    gameMode: 'holdem',
    playerCount: 2,
    
    // API
    apiKey: null,
    
    // History & Stats
    handHistory: [],
    sessionStart: null,
    sessionHands: 0,
    
    // Achievements
    achievements: {},
    unlockedCount: 0,
    
    // Current analysis
    currentAnalysis: null,
    
    // UI
    quickPickerOpen: false,
    currentPickerType: null
};

// ===== ACHIEVEMENTS SYSTEM =====
const ACHIEVEMENTS = {
    firstHand: {id: 'firstHand', name: 'First Steps', desc: 'Analyze your first hand', icon: '🎴', xp: 50},
    tenHands: {id: 'tenHands', name: 'Getting Started', desc: 'Analyze 10 hands', icon: '📈', xp: 100},
    fiftyHands: {id: 'fiftyHands', name: 'Poker Enthusiast', desc: 'Analyze 50 hands', icon: '🔥', xp: 250},
    hundredHands: {id: 'hundredHands', name: 'Poker Pro', desc: 'Analyze 100 hands', icon: '💎', xp: 500},
    
    firstFlush: {id: 'firstFlush', name: 'Flush Master', desc: 'Get your first flush', icon: '♠️', xp: 75},
    firstStraight: {id: 'firstStraight', name: 'Straight Shooter', desc: 'Get your first straight', icon: '📊', xp: 75},
    firstFullHouse: {id: 'firstFullHouse', name: 'Full House!', desc: 'Get your first full house', icon: '🏠', xp: 100},
    firstQuads: {id: 'firstQuads', name: 'Four of a Kind!', desc: 'Get your first quads', icon: '💪', xp: 150},
    firstStraightFlush: {id: 'firstStraightFlush', name: 'Straight Flush!', desc: 'Get a straight flush', icon: '🌟', xp: 200},
    
    streak3: {id: 'streak3', name: '3-Day Streak', desc: 'Use the app 3 days in a row', icon: '🔥', xp: 100},
    streak7: {id: 'streak7', name: 'Week Warrior', desc: 'Use the app 7 days in a row', icon: '⚡', xp: 250},
    
    highWinRate: {id: 'highWinRate', name: 'Monster Hand', desc: 'Get 95%+ win rate', icon: '🚀', xp: 75},
    perfectHand: {id: 'perfectHand', name: 'The Nuts!', desc: 'Get a 100% win rate', icon: '👑', xp: 150},
    
    tryOmaha: {id: 'tryOmaha', name: 'Omaha Explorer', desc: 'Try Omaha mode', icon: '🎯', xp: 50},
    multiPlayer: {id: 'multiPlayer', name: 'Multiplayer Veteran', desc: 'Analyze a 9-player hand', icon: '👥', xp: 50}
};

// XP requirements for each level
const XP_PER_LEVEL = [
    0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, // 1-10
    4000, 5000, 6200, 7600, 9200, 11000, 13000, 15200, 17600, 20200 // 11-20
];

// Tier thresholds
const TIERS = [
    {name: 'Bronze', minLevel: 1, color: '#CD7F32'},
    {name: 'Silver', minLevel: 5, color: '#C0C0C0'},
    {name: 'Gold', minLevel: 10, color: '#FFD700'},
    {name: 'Platinum', minLevel: 15, color: '#E5E4E2'},
    {name: 'Diamond', minLevel: 20, color: '#B9F2FF'}
];

// ===== INITIALIZATION =====
function init() {
    console.log('🚀 Initializing...');
    
    // Auto-configure API key
    if (!localStorage.getItem('anthropic_api_key')) {
        localStorage.setItem('anthropic_api_key', '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');
    }
    
    loadProgress();
    loadHistory();
    updateTime();
    renderApp();
    updateUI();
    
    // Event listeners
    document.getElementById('game-mode').addEventListener('change', (e) => {
        state.gameMode = e.target.value;
        renderApp();
    });
    
    document.getElementById('player-count').addEventListener('change', (e) => {
        state.playerCount = parseInt(e.target.value);
        if (state.currentAnalysis) analyzeHand();
    });
    
    console.log('✅ Ready!');
    console.log('📊 Level:', state.level, '| XP:', state.xp, '| Tier:', state.tier);
}

// ===== RENDER APP =====
function renderApp() {
    const container = document.getElementById('app-content');
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    
    container.innerHTML = `
        <!-- Hole Cards -->
        <div class="glass-strong rounded-xl p-4 mb-4 slide-in-up">
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-white font-semibold flex items-center gap-2">
                    <span>👤</span> Your Hand
                </h2>
                <span class="text-cyan-400 text-sm font-mono" id="hole-count">0/${maxHole}</span>
            </div>
            
            <div id="hole-cards" class="flex gap-2 justify-center mb-3 min-h-[100px] items-center flex-wrap">
                ${renderCardSlots(state.holeCards, maxHole)}
            </div>
            
            <div class="flex gap-2">
                <button onclick="pickCards('hole')" class="btn btn-primary flex-1 text-sm">
                    ✏️ Pick Cards
                </button>
                <label class="btn bg-purple-600 text-white flex-1 text-sm cursor-pointer">
                    📷 Upload
                    <input type="file" accept="image/*" onchange="uploadCards('hole', this)" class="hidden">
                </label>
            </div>
        </div>
        
        <!-- Community Cards -->
        <div class="glass-strong rounded-xl p-4 mb-4 slide-in-up" style="animation-delay: 0.1s">
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-white font-semibold flex items-center gap-2">
                    <span>🃏</span> Community
                </h2>
                <span class="text-green-400 text-sm font-mono" id="community-count">0/5</span>
            </div>
            
            <div id="community-cards" class="flex gap-2 justify-center mb-3 min-h-[100px] items-center flex-wrap">
                ${renderCardSlots(state.communityCards, 5)}
            </div>
            
            <div class="flex gap-2">
                <button onclick="pickCards('community')" class="btn btn-primary flex-1 text-sm">
                    ✏️ Pick Cards
                </button>
                <button onclick="clearCards('community')" class="btn btn-danger flex-1 text-sm">
                    🗑️ Clear
                </button>
            </div>
        </div>
        
        <!-- Analysis Panel -->
        <div id="analysis-panel" class="slide-in-up" style="animation-delay: 0.2s">
            ${state.currentAnalysis ? renderAnalysis(state.currentAnalysis) : renderEmptyAnalysis()}
        </div>
    `;
}

function renderCardSlots(cards, total) {
    let html = '';
    for (let i = 0; i < total; i++) {
        if (cards[i]) {
            html += renderCard(cards[i]);
        } else {
            html += '<div class="card-placeholder"></div>';
        }
    }
    return html;
}

function renderCard(card) {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    const symbol = {S: '♠', H: '♥', D: '♦', C: '♣'}[suit];
    const isRed = suit === 'H' || suit === 'D';
    const color = isRed ? '#dc2626' : '#000';
    
    return `
        <div class="card animate__animated animate__flipInY">
            <div class="card-rank" style="color: ${color}">${rank}</div>
            <div class="card-suit" style="color: ${color}">${symbol}</div>
        </div>
    `;
}

function renderEmptyAnalysis() {
    return `
        <div class="glass rounded-xl p-8 text-center">
            <div class="text-6xl mb-3 animate__animated animate__bounceIn">🎴</div>
            <p class="text-white text-sm opacity-70">Add cards to see AI analysis</p>
        </div>
    `;
}

function renderAnalysis(analysis) {
    const colorMap = {1:'red',2:'red',3:'orange',4:'yellow',5:'yellow',6:'green',7:'green',8:'green',9:'green'};
    const color = colorMap[analysis.handStrength];
    const strengthPercent = (analysis.handStrength / 9) * 100;
    
    return `
        <div class="space-y-3 animate__animated animate__fadeIn">
            <!-- Hand Name -->
            <div class="glass-strong rounded-xl p-4 text-center">
                <div class="text-xs text-gray-400 mb-1">Your Hand</div>
                <div class="text-3xl font-black text-${color}-400 mb-2">${analysis.handName}</div>
                <div class="strength-meter mt-2">
                    <div class="strength-fill bg-gradient-to-r from-${color}-500 to-${color}-600" style="width: ${strengthPercent}%"></div>
                </div>
                <div class="text-xs text-gray-300 mt-1">Strength: ${analysis.handStrength}/9</div>
            </div>
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-2 gap-2">
                <div class="glass rounded-xl p-3 text-center">
                    <div class="text-xs text-gray-400">Win Rate</div>
                    <div class="text-3xl font-black text-cyan-400">${analysis.adjustedWinRate}%</div>
                    <div class="text-xs text-gray-500">vs ${state.playerCount - 1}</div>
                </div>
                
                <div class="glass rounded-xl p-3 text-center">
                    <div class="text-xs text-gray-400">Outs</div>
                    <div class="text-3xl font-black text-orange-400">${analysis.outs}</div>
                    <div class="text-xs text-gray-500">${state.communityCards.length === 5 ? 'River' : 'to improve'}</div>
                </div>
            </div>
            
            <!-- Recommendation -->
            <div class="glass rounded-xl p-4 text-center bg-${analysis.recommendation.color}-600/20">
                <div class="text-xs text-gray-400 mb-1">Recommendation</div>
                <div class="text-2xl font-black text-${analysis.recommendation.color}-400">${analysis.recommendation.action}</div>
            </div>
            
            <!-- AI Commentary -->
            <div class="glass rounded-xl p-3">
                <div class="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <span>🧠</span> AI Analysis
                </div>
                <div class="text-xs text-gray-300">${getCommentary(analysis)}</div>
            </div>
        </div>
    `;
}

// ===== UI UPDATES =====
function updateUI() {
    // Update level & XP
    document.getElementById('player-level').textContent = state.level;
    document.getElementById('player-tier').textContent = state.tier;
    
    const levelXP = XP_PER_LEVEL[state.level - 1] || 0;
    const nextLevelXP = XP_PER_LEVEL[state.level] || 999999;
    const xpInLevel = state.xp - levelXP;
    const xpNeeded = nextLevelXP - levelXP;
    const xpPercent = (xpInLevel / xpNeeded) * 100;
    
    document.getElementById('xp-text').textContent = `${xpInLevel}/${xpNeeded} XP`;
    document.getElementById('xp-fill').style.width = xpPercent + '%';
    
    // Update badges
    document.getElementById('achievement-count').textContent = state.unlockedCount;
    document.getElementById('badge').textContent = state.handHistory.length;
}

function updateTime() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: false});
    document.getElementById('time').textContent = time;
    setTimeout(updateTime, 60000);
}

// ===== CARD PICKING =====
function pickCards(type) {
    state.currentPickerType = type;
    showQuickPicker();
}

function toggleQuickPicker() {
    state.quickPickerOpen = !state.quickPickerOpen;
    if (state.quickPickerOpen) {
        showQuickPicker();
    }
}

function showQuickPicker() {
    const modal = document.getElementById('modals-container');
    modal.innerHTML = `
        <div class="modal active">
            <div class="modal-content w-full max-w-md mx-4">
                <div class="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 class="text-white font-bold">Pick Cards</h3>
                    <button onclick="closeQuickPicker()" class="text-gray-400 text-2xl">&times;</button>
                </div>
                
                <div class="p-4">
                    <div id="quick-picker-grid" class="space-y-3"></div>
                </div>
            </div>
        </div>
    `;
    
    renderQuickPickerGrid();
}

function renderQuickPickerGrid() {
    const grid = document.getElementById('quick-picker-grid');
    const suits = ['S', 'H', 'D', 'C'];
    const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    const allExisting = [...state.holeCards, ...state.communityCards];
    
    let html = '';
    suits.forEach(suit => {
        const symbol = {S: '♠', H: '♥', D: '♦', C: '♣'}[suit];
        const isRed = suit === 'H' || suit === 'D';
        const color = isRed ? '#dc2626' : '#000';
        
        html += `<div class="flex items-center gap-2">`;
        html += `<div class="text-2xl w-8" style="color: ${isRed ? '#dc2626' : '#fff'}">${symbol}</div>`;
        html += `<div class="flex gap-1 flex-1">`;
        
        ranks.forEach(rank => {
            const card = rank + suit;
            const used = allExisting.includes(card);
            const disabled = used ? 'opacity-30 cursor-not-allowed' : '';
            
            html += `
                <button 
                    onclick="${used ? '' : `quickAddCard('${card}')`}"
                    class="quick-card ${disabled}"
                    style="${used ? '' : `color: ${color}`}"
                    ${used ? 'disabled' : ''}
                >
                    ${rank}
                </button>
            `;
        });
        
        html += `</div></div>`;
    });
    
    grid.innerHTML = html;
}

function quickAddCard(card) {
    const type = state.currentPickerType;
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    
    if (type === 'hole') {
        if (state.holeCards.length < maxHole) {
            state.holeCards.push(card);
            addXP(5, `+5 XP (Card added)`);
        }
    } else {
        if (state.communityCards.length < 5) {
            state.communityCards.push(card);
            addXP(5, `+5 XP (Card added)`);
        }
    }
    
    renderApp();
    
    // Auto-close if done
    if ((type === 'hole' && state.holeCards.length === maxHole) ||
        (type === 'community' && state.communityCards.length === 5)) {
        closeQuickPicker();
    } else {
        renderQuickPickerGrid();
    }
    
    // Auto-analyze
    if (state.holeCards.length === maxHole && state.communityCards.length >= 3) {
        analyzeHand();
    }
}

function closeQuickPicker() {
    document.getElementById('modals-container').innerHTML = '';
    state.quickPickerOpen = false;
}

function clearCards(type) {
    if (type === 'hole') {
        state.holeCards = [];
    } else {
        state.communityCards = [];
    }
    state.currentAnalysis = null;
    renderApp();
}

// ===== ANALYSIS =====
async function analyzeHand() {
    const maxHole = state.gameMode === 'holdem' ? 2 : 4;
    if (state.holeCards.length !== maxHole || state.communityCards.length < 3) return;
    
    console.log('🧠 Analyzing...');
    showAnalyzing();
    
    try {
        const analysis = calculateLocal();
        state.currentAnalysis = analysis;
        
        saveToHistory(analysis);
        addXP(25, '+25 XP (Hand analyzed)');
        checkAchievements(analysis);
        
        renderApp();
        
        // Celebrate big hands
        if (analysis.handStrength >= 7) {
            celebrate();
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
    }
}

function showAnalyzing() {
    const panel = document.getElementById('analysis-panel');
    panel.innerHTML = `
        <div class="glass rounded-xl p-8 text-center analyzing">
            <div class="text-5xl mb-3">🎴</div>
            <div class="text-white text-sm">Analyzing hand...</div>
        </div>
    `;
}

function calculateLocal() {
    const allCards = [...state.holeCards, ...state.communityCards];
    const rankCounts = {}, suitCounts = {};
    
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
        return {'A':14,'K':13,'Q':12,'J':11,'10':10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2}[rank];
    }).sort((a,b) => b - a);
    
    const straight = isStraight(rankValues);
    
    let handStrength = 1, handName = 'High Card';
    
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
    
    const baseWinRate = state.communityCards.length === 5 ? 
        {1:20,2:35,3:50,4:60,5:75,6:85,7:95,8:98,9:99}[handStrength] : 
        Math.min(95, handStrength * 10 + 10);
    
    const adjustedWinRate = adjustForPlayers(baseWinRate, handStrength);
    const outs = calculateOuts(rankCounts, suitCounts);
    const recommendation = getRecommendation(handStrength, adjustedWinRate);
    
    return {handStrength, handName, baseWinRate, adjustedWinRate, outs, recommendation};
}

function isStraight(ranks) {
    const unique = [...new Set(ranks)].sort((a,b) => b - a);
    if (unique.length < 5) return false;
    
    for (let i = 0; i <= unique.length - 5; i++) {
        if (unique[i] - unique[i + 4] === 4) return true;
    }
    
    return unique.includes(14) && unique.includes(5) && unique.includes(4) && unique.includes(3) && unique.includes(2);
}

function adjustForPlayers(baseWinRate, handStrength) {
    if (handStrength >= 8) return Math.max(95, baseWinRate - (state.playerCount - 2));
    const mult = {2:1.0,3:0.85,4:0.72,5:0.62,6:0.54,7:0.48,8:0.43,9:0.39}[state.playerCount] || 0.30;
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

function getCommentary(analysis) {
    if (analysis.handStrength >= 9) return `${analysis.handName}! The nuts. Maximize value.`;
    if (analysis.handStrength >= 7) return `${analysis.handName}! Very strong. Bet for value.`;
    if (analysis.handStrength >= 5) return `${analysis.handName}. Solid made hand.`;
    if (analysis.handStrength >= 3) return `${analysis.handName}. Decent but vulnerable.`;
    return analysis.outs >= 9 ? `Drawing with ${analysis.outs} outs.` : `Weak. Fold to aggression.`;
}

// ===== XP & LEVELING =====
function addXP(amount, message) {
    state.xp += amount;
    state.totalXP += amount;
    
    document.getElementById('last-xp').textContent = amount;
    
    // Check for level up
    while (state.xp >= (XP_PER_LEVEL[state.level] || 999999)) {
        levelUp();
    }
    
    // Update tier
    updateTier();
    
    updateUI();
    saveProgress();
}

function levelUp() {
    state.level++;
    console.log(`🎉 LEVEL UP! Now level ${state.level}`);
    
    // Show level up animation
    showLevelUpModal();
    celebrate();
}

function updateTier() {
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (state.level >= TIERS[i].minLevel) {
            state.tier = TIERS[i].name;
            break;
        }
    }
}

function showLevelUpModal() {
    const modal = document.getElementById('modals-container');
    modal.innerHTML = `
        <div class="modal active">
            <div class="modal-content w-full max-w-sm mx-4 text-center p-8">
                <div class="text-6xl mb-4 animate__animated animate__bounceIn">🎉</div>
                <h2 class="text-3xl font-black text-white mb-2">Level Up!</h2>
                <div class="text-5xl font-black text-yellow-400 mb-4">Level ${state.level}</div>
                <p class="text-gray-300 mb-6">You're now ${state.tier} tier!</p>
                <button onclick="closeModal()" class="btn btn-success w-full">Awesome!</button>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const modalEl = modal.querySelector('.modal');
        if (modalEl) modalEl.classList.remove('active');
        setTimeout(() => modal.innerHTML = '', 300);
    }, 3000);
}

function closeModal() {
    document.getElementById('modals-container').innerHTML = '';
}

// ===== ACHIEVEMENTS =====
function checkAchievements(analysis) {
    // First hand
    if (state.handHistory.length === 1 && !state.achievements.firstHand) {
        unlockAchievement('firstHand');
    }
    
    // Hand count milestones
    if (state.handHistory.length === 10 && !state.achievements.tenHands) {
        unlockAchievement('tenHands');
    }
    if (state.handHistory.length === 50 && !state.achievements.fiftyHands) {
        unlockAchievement('fiftyHands');
    }
    if (state.handHistory.length === 100 && !state.achievements.hundredHands) {
        unlockAchievement('hundredHands');
    }
    
    // Hand types
    if (analysis.handName === 'Flush' && !state.achievements.firstFlush) {
        unlockAchievement('firstFlush');
    }
    if (analysis.handName === 'Straight' && !state.achievements.firstStraight) {
        unlockAchievement('firstStraight');
    }
    if (analysis.handName === 'Full House' && !state.achievements.firstFullHouse) {
        unlockAchievement('firstFullHouse');
    }
    if (analysis.handName === 'Four of a Kind' && !state.achievements.firstQuads) {
        unlockAchievement('firstQuads');
    }
    if (analysis.handName === 'Straight Flush' && !state.achievements.firstStraightFlush) {
        unlockAchievement('firstStraightFlush');
    }
    
    // Win rate achievements
    if (analysis.adjustedWinRate >= 95 && !state.achievements.highWinRate) {
        unlockAchievement('highWinRate');
    }
    if (analysis.adjustedWinRate === 100 && !state.achievements.perfectHand) {
        unlockAchievement('perfectHand');
    }
    
    // Game mode
    if (state.gameMode.startsWith('omaha') && !state.achievements.tryOmaha) {
        unlockAchievement('tryOmaha');
    }
    
    // Player count
    if (state.playerCount === 9 && !state.achievements.multiPlayer) {
        unlockAchievement('multiPlayer');
    }
}

function unlockAchievement(id) {
    const achievement = ACHIEVEMENTS[id];
    if (!achievement) return;
    
    state.achievements[id] = true;
    state.unlockedCount++;
    
    addXP(achievement.xp, `+${achievement.xp} XP (${achievement.name})`);
    
    showAchievementUnlocked(achievement);
    saveProgress();
}

function showAchievementUnlocked(achievement) {
    const modal = document.getElementById('modals-container');
    modal.innerHTML = `
        <div class="modal active">
            <div class="modal-content w-full max-w-sm mx-4 text-center p-8">
                <div class="text-6xl mb-4 animate__animated animate__bounceIn">${achievement.icon}</div>
                <h3 class="text-xl font-bold text-yellow-400 mb-2">Achievement Unlocked!</h3>
                <h2 class="text-2xl font-black text-white mb-2">${achievement.name}</h2>
                <p class="text-gray-300 mb-4">${achievement.desc}</p>
                <div class="text-yellow-400 font-bold mb-4">+${achievement.xp} XP</div>
                <button onclick="closeModal()" class="btn btn-success w-full">Nice!</button>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const modalEl = modal.querySelector('.modal');
        if (modalEl) modalEl.classList.remove('active');
        setTimeout(() => modal.innerHTML = '', 300);
    }, 4000);
}

function showAchievements() {
    const modal = document.getElementById('modals-container');
    
    let achievementsHTML = '';
    Object.values(ACHIEVEMENTS).forEach(ach => {
        const unlocked = state.achievements[ach.id];
        achievementsHTML += `
            <div class="glass rounded-lg p-4 flex items-center gap-4 ${unlocked ? '' : 'opacity-50'}">
                <div class="badge ${unlocked ? '' : 'locked'}">${ach.icon}</div>
                <div class="flex-1">
                    <h4 class="text-white font-bold">${ach.name}</h4>
                    <p class="text-xs text-gray-400">${ach.desc}</p>
                    <p class="text-xs text-yellow-400 mt-1">+${ach.xp} XP</p>
                </div>
                ${unlocked ? '<div class="text-2xl">✅</div>' : '<div class="text-2xl">🔒</div>'}
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div class="modal active">
            <div class="modal-content w-full max-w-2xl mx-4" style="max-height: 80vh;">
                <div class="sticky top-0 bg-gradient-to-r from-purple-900 to-purple-700 p-4 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h3 class="text-white font-bold text-lg">🏆 Achievements</h3>
                        <p class="text-sm text-gray-300">${state.unlockedCount}/${Object.keys(ACHIEVEMENTS).length} Unlocked</p>
                    </div>
                    <button onclick="closeModal()" class="text-white text-2xl">&times;</button>
                </div>
                <div class="p-4 space-y-3 overflow-auto" style="max-height: calc(80vh - 80px);">
                    ${achievementsHTML}
                </div>
            </div>
        </div>
    `;
}

// ===== STATS =====
function showStats() {
    const totalHands = state.handHistory.length;
    if (totalHands === 0) {
        alert('No hands analyzed yet!');
        return;
    }
    
    const avgWinRate = state.handHistory.reduce((sum, h) => sum + h.adjustedWinRate, 0) / totalHands;
    const bestHand = state.handHistory.reduce((best, h) => h.handStrength > best.handStrength ? h : best);
    
    const handCounts = {};
    state.handHistory.forEach(h => {
        handCounts[h.handName] = (handCounts[h.handName] || 0) + 1;
    });
    
    const modal = document.getElementById('modals-container');
    modal.innerHTML = `
        <div class="modal active">
            <div class="modal-content w-full max-w-2xl mx-4">
                <div class="sticky top-0 bg-gradient-to-r from-cyan-900 to-cyan-700 p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 class="text-white font-bold text-lg">📊 Statistics</h3>
                    <button onclick="closeModal()" class="text-white text-2xl">&times;</button>
                </div>
                <div class="p-4 space-y-4">
                    <div class="grid grid-cols-3 gap-3">
                        <div class="glass rounded-lg p-4 text-center">
                            <div class="text-3xl font-black text-cyan-400">${totalHands}</div>
                            <div class="text-xs text-gray-400">Total Hands</div>
                        </div>
                        <div class="glass rounded-lg p-4 text-center">
                            <div class="text-3xl font-black text-green-400">${avgWinRate.toFixed(1)}%</div>
                            <div class="text-xs text-gray-400">Avg Win Rate</div>
                        </div>
                        <div class="glass rounded-lg p-4 text-center">
                            <div class="text-2xl font-black text-yellow-400">${bestHand.handName}</div>
                            <div class="text-xs text-gray-400">Best Hand</div>
                        </div>
                    </div>
                    
                    <div class="glass rounded-lg p-4">
                        <h4 class="text-white font-bold mb-3">Hand Distribution</h4>
                        ${Object.entries(handCounts).sort((a,b) => b[1] - a[1]).map(([name, count]) => `
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-300 text-sm">${name}</span>
                                <div class="flex items-center gap-2">
                                    <div class="progress-bar w-32">
                                        <div class="progress-fill" style="width: ${(count/totalHands)*100}%"></div>
                                    </div>
                                    <span class="text-cyan-400 text-sm font-mono">${count}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== HISTORY =====
function showHistory() {
    const modal = document.getElementById('modals-container');
    
    if (state.handHistory.length === 0) {
        modal.innerHTML = `
            <div class="modal active">
                <div class="modal-content w-full max-w-md mx-4 text-center p-8">
                    <div class="text-6xl mb-4">📋</div>
                    <h3 class="text-white font-bold mb-2">No hands yet</h3>
                    <p class="text-gray-400 mb-4">Analyze some hands to see them here!</p>
                    <button onclick="closeModal()" class="btn btn-primary w-full">Got it</button>
                </div>
            </div>
        `;
        return;
    }
    
    modal.innerHTML = `
        <div class="modal active">
            <div class="modal-content w-full max-w-2xl mx-4" style="max-height: 80vh;">
                <div class="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-700 p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 class="text-white font-bold text-lg">⏱ Hand History</h3>
                    <button onclick="closeModal()" class="text-white text-2xl">&times;</button>
                </div>
                <div class="p-4 space-y-3 overflow-auto" style="max-height: calc(80vh - 80px);">
                    ${state.handHistory.map(hand => `
                        <div class="glass rounded-lg p-3">
                            <div class="flex items-start gap-3">
                                <div class="flex-shrink-0 text-xs">
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
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderMiniCard(card) {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    const symbol = {S: '♠', H: '♥', D: '♦', C: '♣'}[suit];
    const isRed = suit === 'H' || suit === 'D';
    return `<span class="inline-block bg-white px-1 rounded text-xs font-bold" style="color: ${isRed ? '#dc2626' : '#000'}">${rank}${symbol}</span>`;
}

// ===== CELEBRATIONS =====
function celebrate() {
    // Confetti effect
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = ['#ffd700','#ff69b4','#00d4ff','#00ff88'][Math.floor(Math.random()*4)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

// ===== PERSISTENCE =====
function saveProgress() {
    localStorage.setItem('poker_progress', JSON.stringify({
        level: state.level,
        xp: state.xp,
        totalXP: state.totalXP,
        tier: state.tier,
        achievements: state.achievements,
        unlockedCount: state.unlockedCount
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('poker_progress');
    if (saved) {
        const data = JSON.parse(saved);
        state.level = data.level || 1;
        state.xp = data.xp || 0;
        state.totalXP = data.totalXP || 0;
        state.tier = data.tier || 'Bronze';
        state.achievements = data.achievements || {};
        state.unlockedCount = data.unlockedCount || 0;
    }
}

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
}

function loadHistory() {
    const saved = localStorage.getItem('hand_history');
    if (saved) {
        state.handHistory = JSON.parse(saved);
    }
}

// ===== IMAGE UPLOAD =====
async function uploadCards(type, input) {
    const file = input.files[0];
    if (!file) return;
    
    alert('Image upload feature coming soon! Use Quick Picker for now.');
    input.value = '';
}

// ===== INIT =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
