// Poker AI - Main App Controller
const state = {
    mode: 'play',
    level: 1, xp: 0, totalXP: 0,
    achievements: {}, unlockedCount: 0,
    holeCards: [], communityCards: [],
    gameType: 'holdem', numOpponents: 1,
    currentAnalysis: null, handHistory: [],
    pickerTarget: null,
};

const XP_LEVELS = [0,100,250,450,700,1000,1400,1900,2500,3200,4000,5000,6200,7600,9200,11000,13000,15200,17600,20200];

const ACHIEVEMENTS = {
    firstHand: {name:'First Steps', desc:'Analyze your first hand', icon:'🎴', xp:50},
    tenHands: {name:'Getting Warm', desc:'Analyze 10 hands', icon:'📈', xp:100},
    firstFlush: {name:'Flush!', desc:'Get a flush', icon:'♠', xp:75},
    firstFullHouse: {name:'Full House', desc:'Get a full house', icon:'🏠', xp:100},
    firstQuads: {name:'Quads!', desc:'Four of a kind', icon:'💎', xp:150},
    monster: {name:'Monster', desc:'Get 90%+ equity', icon:'🚀', xp:75},
    gameWin: {name:'Winner', desc:'Win a hand vs bots', icon:'🏆', xp:50},
};

// === INIT ===
function init() {
    loadProgress(); loadHistory(); updateHeader();
    if (typeof startGame === 'function') startGame();
}

// === MODE SWITCHING ===
function switchMode(mode) {
    state.mode = mode;
    document.getElementById('tab-play').className = mode === 'play' ? 'mode-tab active' : 'mode-tab';
    document.getElementById('tab-analyze').className = mode === 'analyze' ? 'mode-tab active' : 'mode-tab';
    if (mode === 'play') { if (typeof startGame === 'function') startGame(); }
    else renderAnalyzer();
}

// === SHARED CARD RENDERING ===
function renderCardHTML(cardStr, size) {
    const p = PokerEngine.parseCard(cardStr);
    const rank = PokerEngine.RANK_NAMES[p.rank];
    const suit = PokerEngine.SUIT_SYMBOLS[p.suit];
    const isRed = p.suit === 1 || p.suit === 2;
    const sm = size === 'small';
    const w = sm ? 44 : 58, h = sm ? 62 : 82;
    const rs = sm ? 14 : 20, ss = sm ? 17 : 24;
    return `<div class="poker-card ${isRed?'red':'black'}" style="width:${w}px;height:${h}px;">
        <span class="rank" style="font-size:${rs}px">${rank}</span>
        <span class="suit-icon" style="font-size:${ss}px">${suit}</span></div>`;
}

function renderCardBack(size) {
    const sm = size === 'small';
    return `<div class="card-back" style="width:${sm?40:54}px;height:${sm?56:76}px;font-size:${sm?12:16}px">♠</div>`;
}

function showModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }

document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
});

// === ANALYZER ===
function renderAnalyzer() {
    const maxH = state.gameType === 'holdem' ? 2 : 4;
    const c = document.getElementById('app-content');
    c.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px" class="fade-in">
        <div class="glass" style="padding:12px;display:flex;gap:8px">
            <select id="game-type" onchange="changeGameType(this.value)" style="flex:1;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.12);color:white;border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit">
                <option value="holdem" ${state.gameType==='holdem'?'selected':''}>Texas Hold'em</option>
                <option value="omaha" ${state.gameType==='omaha'?'selected':''}>Omaha High</option>
                <option value="omaha-hilo" ${state.gameType==='omaha-hilo'?'selected':''}>Omaha Hi-Lo</option>
            </select>
            <select id="num-opp" onchange="state.numOpponents=+this.value;autoAnalyze()" style="flex:1;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.12);color:white;border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit">
                ${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${state.numOpponents===n?'selected':''}>${n} opp${n>1?'s':''}</option>`).join('')}
            </select>
        </div>
        <div class="glass" style="padding:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
                <span style="font-weight:700;font-size:14px">👤 Your Hand</span>
                <span style="color:var(--dim);font-size:12px">${state.holeCards.length}/${maxH}</span>
            </div>
            <div style="display:flex;gap:8px;justify-content:center;min-height:82px;align-items:center">
                ${state.holeCards.map(c=>renderCardHTML(c)).join('')}
                ${Array(maxH-state.holeCards.length).fill(0).map(()=>'<div class="card-placeholder" style="width:58px;height:82px" onclick="openPicker(\'hole\')">+</div>').join('')}
            </div>
            <div style="display:flex;gap:8px;margin-top:12px">
                <button class="btn btn-primary" style="flex:1;font-size:13px" onclick="openPicker('hole')">Pick Cards</button>
                <button class="btn btn-fold" style="flex:1;font-size:13px" onclick="clearACards('hole')">Clear</button>
            </div>
        </div>
        <div class="glass" style="padding:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
                <span style="font-weight:700;font-size:14px">🃏 Community</span>
                <span style="color:var(--dim);font-size:12px">${state.communityCards.length}/5</span>
            </div>
            <div style="display:flex;gap:8px;justify-content:center;min-height:82px;align-items:center;flex-wrap:wrap">
                ${state.communityCards.map(c=>renderCardHTML(c)).join('')}
                ${Array(5-state.communityCards.length).fill(0).map(()=>'<div class="card-placeholder" style="width:58px;height:82px" onclick="openPicker(\'community\')">+</div>').join('')}
            </div>
            <div style="display:flex;gap:8px;margin-top:12px">
                <button class="btn btn-primary" style="flex:1;font-size:13px" onclick="openPicker('community')">Pick Cards</button>
                <button class="btn btn-fold" style="flex:1;font-size:13px" onclick="clearACards('community')">Clear</button>
            </div>
        </div>
        <div id="analysis-panel">${state.currentAnalysis ? renderAnalysisPanel(state.currentAnalysis) : '<div class="glass" style="padding:36px;text-align:center"><div style="font-size:48px;margin-bottom:8px">🎴</div><p style="color:var(--dim);font-size:13px">Pick your cards to see analysis</p></div>'}</div>
    </div>`;
}

function renderAnalysisPanel(a) {
    const colors = ['#ef4444','#ef4444','#f97316','#eab308','#eab308','#22c55e','#22c55e','#10b981','#06b6d4','#fbbf24'];
    const color = colors[a.handRank] || '#6b7280';
    const pct = ((a.handRank + 1) / 10) * 100;
    return `<div style="display:flex;flex-direction:column;gap:10px" class="slide-up">
        <div class="glass" style="padding:20px;text-align:center">
            <div style="font-size:11px;color:var(--dim);margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Your Hand</div>
            <div style="font-size:28px;font-weight:900;color:${color}">${a.handName}</div>
            <div class="strength-meter" style="margin-top:10px"><div class="strength-fill" style="width:${pct}%;background:${color}"></div></div>
        </div>
        ${a.lowStr ? `<div class="glass" style="padding:14px;text-align:center;background:rgba(34,197,94,0.06)">
            <div style="font-size:11px;color:var(--dim);margin-bottom:2px;text-transform:uppercase;letter-spacing:1px">Low Hand</div>
            <div style="font-size:22px;font-weight:900;color:var(--green)">${a.lowStr}</div>
        </div>` : state.gameType === 'omaha-hilo' ? `<div class="glass" style="padding:12px;text-align:center">
            <div style="font-size:12px;color:var(--dim)">No qualifying low</div>
        </div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="glass" style="padding:16px;text-align:center">
                <div style="font-size:11px;color:var(--dim)">Equity</div>
                <div style="font-size:30px;font-weight:900;color:var(--cyan)">${a.equity}%</div>
                <div style="font-size:11px;color:var(--dim)">vs ${state.numOpponents} opp${state.numOpponents>1?'s':''}</div>
            </div>
            <div class="glass" style="padding:16px;text-align:center">
                <div style="font-size:11px;color:var(--dim)">Outs</div>
                <div style="font-size:30px;font-weight:900;color:var(--gold)">${a.outs}</div>
                <div style="font-size:11px;color:var(--dim)">to improve</div>
            </div>
        </div>
        <div class="glass" style="padding:16px;text-align:center;background:${a.recBg}">
            <div style="font-size:11px;color:var(--dim);margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Recommendation</div>
            <div style="font-size:22px;font-weight:900;color:${a.recColor}">${a.recommendation}</div>
        </div>
        <div class="glass" style="padding:14px">
            <div style="font-size:11px;color:var(--dim);margin-bottom:6px">🧠 AI ANALYSIS</div>
            <div style="font-size:13px;color:var(--text);line-height:1.6">${a.commentary}</div>
        </div>
    </div>`;
}

function autoAnalyze() {
    const maxH = state.gameType === 'holdem' ? 2 : 4;
    if (state.holeCards.length < maxH) { state.currentAnalysis = null; return; }
    const all = [...state.holeCards, ...state.communityCards];
    if (all.length < maxH) return;

    const isOmaha = state.gameType === 'omaha' || state.gameType === 'omaha-hilo';
    const hand = isOmaha && state.communityCards.length >= 3
        ? PokerEngine.evaluateOmaha(state.holeCards, state.communityCards)
        : PokerEngine.evaluateBest(all);
    const eq = isOmaha
        ? PokerEngine.calculateOmahaEquity(state.holeCards, state.communityCards, state.numOpponents, 800)
        : PokerEngine.calculateEquity(state.holeCards, state.communityCards, state.numOpponents, 1200);
    const outs = isOmaha
        ? PokerEngine.calculateOmahaOuts(state.holeCards, state.communityCards)
        : PokerEngine.calculateOuts(state.holeCards, state.communityCards);

    // Low hand for Hi-Lo
    let lowHand = null, lowStr = null;
    if (state.gameType === 'omaha-hilo' && state.communityCards.length >= 3) {
        lowHand = PokerEngine.evaluateOmahaLow(state.holeCards, state.communityCards);
        lowStr = PokerEngine.lowToString(lowHand);
    }

    let rec, recColor, recBg;
    if (eq.equity >= 75) { rec = 'BET / RAISE'; recColor = '#22c55e'; recBg = 'rgba(34,197,94,0.08)'; }
    else if (eq.equity >= 55) { rec = 'CALL'; recColor = '#3b82f6'; recBg = 'rgba(59,130,246,0.08)'; }
    else if (eq.equity >= 35) { rec = 'CHECK / CALL'; recColor = '#f59e0b'; recBg = 'rgba(245,158,11,0.08)'; }
    else { rec = 'FOLD'; recColor = '#ef4444'; recBg = 'rgba(239,68,68,0.08)'; }

    let commentary;
    if (hand.handRank >= 8) commentary = `${hand.handName}! An extremely powerful hand. Maximize value by raising and re-raising.`;
    else if (hand.handRank >= 6) commentary = `${hand.handName} is very strong. Bet for value and protect against draws.`;
    else if (hand.handRank >= 4) commentary = `${hand.handName}. A solid made hand — play it confidently but watch for danger cards.`;
    else if (hand.handRank >= 2) commentary = `${hand.handName}. A decent hand but vulnerable to better holdings.`;
    else if (outs.outs >= 9) commentary = `Drawing hand with ${outs.outs} outs. With good pot odds, this is a profitable draw.`;
    else if (outs.outs >= 4) commentary = `${hand.handName} with ${outs.outs} outs. Marginal — proceed with caution.`;
    else commentary = `${hand.handName}. Weak holding with limited improvement potential. Fold to aggression.`;

    if (state.gameType === 'omaha-hilo') {
        if (lowHand) commentary += ` You have a qualifying low (${lowStr}) — this adds significant value to your hand.`;
        else commentary += ` No qualifying low hand.`;
    }

    state.currentAnalysis = { handRank: hand.handRank, handName: hand.handName, equity: eq.equity, outs: outs.outs, recommendation: rec, recColor, recBg, commentary, lowStr };

    addXP(10);
    saveToHistory();
    checkAchievements();

    const panel = document.getElementById('analysis-panel');
    if (panel) panel.innerHTML = renderAnalysisPanel(state.currentAnalysis);
}

// === CARD PICKER (two-step: rank then suit) ===
function openPicker(target) {
    state.pickerTarget = target;
    state.pickerRank = null;
    showRankPicker();
}

function showRankPicker() {
    const target = state.pickerTarget;
    const ranks = ['A','K','Q','J','10','9','8','7','6','5','4','3','2'];
    const used = [...state.holeCards, ...state.communityCards];

    // Check which ranks are fully used (all 4 suits taken)
    const rankUsedCount = {};
    ranks.forEach(r => { rankUsedCount[r] = 0; });
    used.forEach(card => {
        const r = card.slice(0, -1);
        if (rankUsedCount[r] !== undefined) rankUsedCount[r]++;
    });

    showModal(`<div style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="font-weight:700;font-size:17px">Pick ${target==='hole'?'Hole':'Community'} Card</h3>
            <button onclick="closeModal()" style="background:none;border:none;color:var(--dim);font-size:28px;cursor:pointer;padding:4px">&times;</button>
        </div>
        <div style="font-size:12px;color:var(--dim);margin-bottom:12px">Step 1: Choose rank</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            ${ranks.map(r => {
                const allUsed = rankUsedCount[r] >= 4;
                return `<button onclick="pickRank('${r}')" style="
                    padding:16px 8px;border-radius:12px;border:2px solid rgba(255,255,255,0.12);
                    background:rgba(255,255,255,0.06);color:${allUsed?'rgba(255,255,255,0.15)':'white'};
                    font-size:22px;font-weight:900;font-family:Georgia,serif;
                    cursor:${allUsed?'not-allowed':'pointer'};transition:all 0.15s;
                " ${allUsed?'disabled':''}>${r}</button>`;
            }).join('')}
        </div>
    </div>`);
}

function pickRank(rank) {
    state.pickerRank = rank;
    showSuitPicker(rank);
}

function showSuitPicker(rank) {
    const target = state.pickerTarget;
    const used = [...state.holeCards, ...state.communityCards];
    const suits = [
        { sym: '♠', code: 0, name: 'Spades', color: '#e2e8f0', bg: 'rgba(226,232,240,0.1)' },
        { sym: '♥', code: 1, name: 'Hearts', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        { sym: '♦', code: 2, name: 'Diamonds', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
        { sym: '♣', code: 3, name: 'Clubs', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    ];

    showModal(`<div style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div>
                <h3 style="font-weight:700;font-size:17px">Pick Suit for ${rank}</h3>
                <button onclick="showRankPicker()" style="background:none;border:none;color:var(--cyan);font-size:13px;cursor:pointer;padding:0;margin-top:2px">← Back to ranks</button>
            </div>
            <button onclick="closeModal()" style="background:none;border:none;color:var(--dim);font-size:28px;cursor:pointer;padding:4px">&times;</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
            ${suits.map(s => {
                const card = rank + s.sym;
                const isUsed = used.includes(card);
                return `<button onclick="pickCard('${card}')" style="
                    padding:24px 16px;border-radius:14px;
                    border:2px solid ${isUsed?'rgba(255,255,255,0.05)':s.color+'40'};
                    background:${isUsed?'rgba(255,255,255,0.02)':s.bg};
                    color:${isUsed?'rgba(255,255,255,0.12)':s.color};
                    cursor:${isUsed?'not-allowed':'pointer'};transition:all 0.15s;
                    display:flex;flex-direction:column;align-items:center;gap:6px;
                " ${isUsed?'disabled':''}>
                    <span style="font-size:36px">${s.sym}</span>
                    <span style="font-size:13px;font-weight:700">${rank}${s.sym}</span>
                    ${isUsed?'<span style="font-size:10px">used</span>':''}
                </button>`;
            }).join('')}
        </div>
    </div>`);
}

function pickCard(card) {
    const maxH = state.gameType === 'holdem' ? 2 : 4;
    if (state.pickerTarget === 'hole') {
        if (state.holeCards.length < maxH) state.holeCards.push(card);
        if (state.holeCards.length >= maxH) { closeModal(); renderAnalyzer(); autoAnalyze(); return; }
    } else {
        if (state.communityCards.length < 5) state.communityCards.push(card);
        if (state.communityCards.length >= 5) { closeModal(); renderAnalyzer(); autoAnalyze(); return; }
    }
    renderAnalyzer(); autoAnalyze();
    showRankPicker(); // Go back to rank picker for next card
}

function clearACards(type) {
    if (type === 'hole') state.holeCards = []; else state.communityCards = [];
    state.currentAnalysis = null;
    renderAnalyzer();
}

function changeGameType(t) {
    state.gameType = t; state.holeCards = []; state.communityCards = []; state.currentAnalysis = null;
    renderAnalyzer();
}

// === XP ===
function addXP(amount) {
    state.xp += amount; state.totalXP += amount;
    while (state.level < XP_LEVELS.length - 1 && state.xp >= XP_LEVELS[state.level]) {
        state.level++;
        showModal(`<div style="padding:40px;text-align:center">
            <div style="font-size:56px;margin-bottom:12px" class="bounce-in">🎉</div>
            <div style="font-size:22px;font-weight:900;margin-bottom:6px">Level Up!</div>
            <div style="font-size:38px;font-weight:900;color:var(--gold)">Level ${state.level}</div>
            <button class="btn btn-raise" style="margin-top:20px;width:100%" onclick="closeModal()">Nice!</button>
        </div>`);
        celebrate(); setTimeout(closeModal, 3000);
    }
    updateHeader(); saveProgress();
}

function updateHeader() {
    document.getElementById('level-badge').textContent = 'LVL ' + state.level;
    const cur = XP_LEVELS[state.level-1]||0, next = XP_LEVELS[state.level]||99999;
    document.getElementById('xp-fill').style.width = Math.min(100, ((state.xp-cur)/(next-cur))*100) + '%';
}

// === ACHIEVEMENTS ===
function checkAchievements() {
    if (state.handHistory.length >= 1 && !state.achievements.firstHand) unlockAch('firstHand');
    if (state.handHistory.length >= 10 && !state.achievements.tenHands) unlockAch('tenHands');
    if (state.currentAnalysis) {
        const n = state.currentAnalysis.handName;
        if (n === 'Flush' && !state.achievements.firstFlush) unlockAch('firstFlush');
        if (n === 'Full House' && !state.achievements.firstFullHouse) unlockAch('firstFullHouse');
        if (n === 'Four of a Kind' && !state.achievements.firstQuads) unlockAch('firstQuads');
        if (state.currentAnalysis.equity >= 90 && !state.achievements.monster) unlockAch('monster');
    }
}

function unlockAch(id) {
    const a = ACHIEVEMENTS[id];
    if (!a || state.achievements[id]) return;
    state.achievements[id] = true; state.unlockedCount++;
    addXP(a.xp);
    showModal(`<div style="padding:32px;text-align:center">
        <div style="font-size:48px;margin-bottom:10px" class="bounce-in">${a.icon}</div>
        <div style="font-size:11px;color:var(--gold);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Achievement Unlocked</div>
        <div style="font-size:20px;font-weight:900;margin-bottom:4px">${a.name}</div>
        <div style="font-size:13px;color:var(--dim);margin-bottom:4px">${a.desc}</div>
        <div style="font-size:14px;color:var(--gold);font-weight:700">+${a.xp} XP</div>
        <button class="btn btn-raise" style="margin-top:20px;width:100%" onclick="closeModal()">Nice!</button>
    </div>`);
    setTimeout(closeModal, 3000); saveProgress();
}

// === MENU ===
function showMenu() {
    showModal(`<div style="padding:20px;min-width:280px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="font-weight:700;font-size:16px">Menu</h3>
            <button onclick="closeModal()" style="background:none;border:none;color:var(--dim);font-size:24px;cursor:pointer">&times;</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn" style="background:rgba(255,255,255,0.08);color:white;text-align:left" onclick="closeModal();showAchModal()">🏆 Achievements (${state.unlockedCount}/${Object.keys(ACHIEVEMENTS).length})</button>
            <button class="btn" style="background:rgba(255,255,255,0.08);color:white;text-align:left" onclick="closeModal();showStatsModal()">📊 Statistics</button>
            <button class="btn" style="background:rgba(255,255,255,0.08);color:white;text-align:left" onclick="closeModal();showHistModal()">📋 Hand History (${state.handHistory.length})</button>
        </div>
    </div>`);
}

function showAchModal() {
    const html = Object.entries(ACHIEVEMENTS).map(([id,a]) => {
        const u = state.achievements[id];
        return `<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;background:rgba(255,255,255,0.04);${u?'':'opacity:0.35'}">
            <div style="font-size:26px;width:36px;text-align:center">${a.icon}</div>
            <div style="flex:1"><div style="font-weight:700;font-size:13px">${a.name}</div><div style="font-size:11px;color:var(--dim)">${a.desc}</div></div>
            <div style="font-size:16px">${u?'✅':'🔒'}</div></div>`;
    }).join('');
    showModal(`<div style="padding:20px;max-width:380px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 style="font-weight:700">🏆 Achievements</h3>
        <button onclick="closeModal()" style="background:none;border:none;color:var(--dim);font-size:24px;cursor:pointer">&times;</button>
    </div><div style="display:flex;flex-direction:column;gap:8px">${html}</div></div>`);
}

function showStatsModal() {
    const t = state.handHistory.length;
    showModal(`<div style="padding:20px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 style="font-weight:700">📊 Stats</h3>
        <button onclick="closeModal()" style="background:none;border:none;color:var(--dim);font-size:24px;cursor:pointer">&times;</button>
    </div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="glass" style="padding:16px;text-align:center"><div style="font-size:28px;font-weight:900;color:var(--cyan)">${t}</div><div style="font-size:11px;color:var(--dim)">Hands Analyzed</div></div>
        <div class="glass" style="padding:16px;text-align:center"><div style="font-size:28px;font-weight:900;color:var(--gold)">LVL ${state.level}</div><div style="font-size:11px;color:var(--dim)">Current Level</div></div>
        <div class="glass" style="padding:16px;text-align:center"><div style="font-size:28px;font-weight:900;color:var(--green)">${state.totalXP}</div><div style="font-size:11px;color:var(--dim)">Total XP</div></div>
        <div class="glass" style="padding:16px;text-align:center"><div style="font-size:28px;font-weight:900;color:var(--blue)">${state.unlockedCount}</div><div style="font-size:11px;color:var(--dim)">Achievements</div></div>
    </div></div>`);
}

function showHistModal() {
    showModal(`<div style="padding:20px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 style="font-weight:700">📋 History</h3>
        <button onclick="closeModal()" style="background:none;border:none;color:var(--dim);font-size:24px;cursor:pointer">&times;</button>
    </div><div style="display:flex;flex-direction:column;gap:8px;max-height:60vh;overflow:auto">
        ${state.handHistory.length===0?'<p style="color:var(--dim);text-align:center;padding:24px">No hands yet</p>':
        state.handHistory.slice(0,30).map(h=>`<div class="glass" style="padding:10px">
            <div style="display:flex;justify-content:space-between"><span style="font-weight:700;font-size:13px">${h.handName}</span><span style="font-size:11px;color:var(--dim)">${new Date(h.timestamp).toLocaleTimeString()}</span></div>
            <div style="font-size:12px;color:var(--dim)">Equity: ${h.equity}% &middot; ${h.recommendation}</div>
        </div>`).join('')}
    </div></div>`);
}

// === CELEBRATIONS ===
function celebrate() {
    const colors = ['#ffd700','#ff69b4','#22d3ee','#10b981','#f97316'];
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'confetti-piece';
            el.style.left = Math.random()*100+'%';
            el.style.background = colors[Math.floor(Math.random()*colors.length)];
            el.style.animationDelay = Math.random()*0.3+'s';
            el.style.width = (6+Math.random()*6)+'px';
            el.style.height = (6+Math.random()*6)+'px';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 3000);
        }, i * 35);
    }
}

// === PERSISTENCE ===
function saveProgress() {
    localStorage.setItem('pokerai_progress', JSON.stringify({
        level:state.level, xp:state.xp, totalXP:state.totalXP,
        achievements:state.achievements, unlockedCount:state.unlockedCount
    }));
}
function loadProgress() {
    try {
        const d = JSON.parse(localStorage.getItem('pokerai_progress'));
        if (d) { state.level=d.level||1; state.xp=d.xp||0; state.totalXP=d.totalXP||0; state.achievements=d.achievements||{}; state.unlockedCount=d.unlockedCount||0; }
    } catch(e){}
}
function saveToHistory() {
    if (!state.currentAnalysis) return;
    state.handHistory.unshift({
        timestamp: new Date().toISOString(),
        holeCards: [...state.holeCards], communityCards: [...state.communityCards],
        handName: state.currentAnalysis.handName, equity: state.currentAnalysis.equity,
        recommendation: state.currentAnalysis.recommendation,
    });
    if (state.handHistory.length > 100) state.handHistory.pop();
    localStorage.setItem('pokerai_history', JSON.stringify(state.handHistory));
}
function loadHistory() {
    try { const d = JSON.parse(localStorage.getItem('pokerai_history')); if (d) state.handHistory = d; } catch(e){}
}

document.addEventListener('DOMContentLoaded', init);
