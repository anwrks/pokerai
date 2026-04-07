// Poker AI - Game Mode (Play vs Bots)
// Supports Hold'em, Omaha High, and Omaha Hi-Lo

let game = {
    players: [],
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    dealerButton: 0,
    currentPlayer: 0,
    street: 'preflop',
    handOver: false,
    showdownResults: null,
    lastAction: '',
    blinds: { small: 10, big: 20 },
    minRaise: 20,
    initialized: false,
    gameType: 'holdem', // 'holdem', 'omaha', 'omaha-hilo'
    numBots: 3,
    // Cached analysis for live coaching
    liveAnalysis: null,
    liveAnalysisStreet: null,
};

const BOT_PROFILES = [
    { name: 'Shark', avatar: '🦈', aggression: 0.7 },
    { name: 'Rock', avatar: '🗿', aggression: 0.3 },
    { name: 'Wildcard', avatar: '🃏', aggression: 0.85 },
    { name: 'Fox', avatar: '🦊', aggression: 0.6 },
    { name: 'Eagle', avatar: '🦅', aggression: 0.5 },
    { name: 'Bear', avatar: '🐻', aggression: 0.4 },
    { name: 'Wolf', avatar: '🐺', aggression: 0.75 },
    { name: 'Owl', avatar: '🦉', aggression: 0.35 },
    { name: 'Tiger', avatar: '🐯', aggression: 0.9 },
];

const GAME_TYPE_LABELS = {
    'holdem': "Hold'em",
    'omaha': 'Omaha Hi',
    'omaha-hilo': 'Omaha Hi-Lo',
};

function holeCardCount() {
    return game.gameType === 'holdem' ? 2 : 4;
}

function startGame() {
    if (!game.initialized) {
        renderLobby();
        return;
    }
    dealNewHand();
}

function renderLobby() {
    const c = document.getElementById('app-content');
    c.innerHTML = `<div style="display:flex;flex-direction:column;gap:16px;padding-top:20px" class="fade-in">
        <div style="text-align:center;margin-bottom:8px">
            <div style="font-size:52px;margin-bottom:12px">🃏</div>
            <div style="font-size:22px;font-weight:900">Play vs Bots</div>
            <div style="font-size:13px;color:var(--dim);margin-top:4px">Choose your game and take a seat</div>
        </div>

        <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;font-weight:700;padding-left:4px">Select Game</div>

        <div style="display:flex;flex-direction:column;gap:8px">
            ${Object.entries(GAME_TYPE_LABELS).map(([key, label]) => {
                const desc = {
                    'holdem': '2 hole cards. Use any 5 of 7 cards.',
                    'omaha': '4 hole cards. Must use exactly 2 hole + 3 board.',
                    'omaha-hilo': '4 hole cards. Pot splits between best high and best low (8 or better).',
                }[key];
                const icons = { 'holdem': '♠♥', 'omaha': '♠♥♦♣', 'omaha-hilo': '♠♥♦♣' }[key];
                const selected = game.gameType === key;
                return `<button onclick="game.gameType='${key}';renderLobby()" class="glass" style="padding:16px;text-align:left;cursor:pointer;border:${selected?'2px solid var(--cyan)':'1px solid var(--glass-b)'};background:${selected?'rgba(34,211,238,0.08)':'var(--glass)'};transition:all 0.2s">
                    <div style="display:flex;align-items:center;gap:12px">
                        <div style="font-size:24px;width:44px;text-align:center;letter-spacing:-2px">${icons}</div>
                        <div style="flex:1">
                            <div style="font-size:15px;font-weight:800;color:${selected?'var(--cyan)':'var(--text)'}">${label}</div>
                            <div style="font-size:12px;color:var(--dim);margin-top:2px;line-height:1.4">${desc}</div>
                        </div>
                        ${selected ? '<div style="color:var(--cyan);font-size:18px">✓</div>' : ''}
                    </div>
                </button>`;
            }).join('')}
        </div>

        <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;font-weight:700;padding-left:4px;margin-top:8px">Number of Players</div>

        <div class="glass" style="padding:14px">
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
                ${[2,3,4,5,6,7,8,9,10].map(n => `
                    <button onclick="game.numBots=${n-1};renderLobby()" style="
                        width:44px;height:44px;border-radius:10px;border:2px solid ${game.numBots===n-1?'var(--cyan)':'rgba(255,255,255,0.12)'};
                        background:${game.numBots===n-1?'rgba(34,211,238,0.15)':'rgba(255,255,255,0.05)'};
                        color:${game.numBots===n-1?'var(--cyan)':'white'};font-size:16px;font-weight:800;
                        cursor:pointer;transition:all 0.15s;
                    ">${n}</button>
                `).join('')}
            </div>
            <div style="text-align:center;margin-top:8px;font-size:12px;color:var(--dim)">
                You + ${game.numBots} bot${game.numBots>1?'s':''} = ${game.numBots+1} players
            </div>
        </div>

        <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;font-weight:700;padding-left:4px;margin-top:4px">Your Opponents</div>

        <div class="glass" style="padding:12px;display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto">
            ${BOT_PROFILES.slice(0, game.numBots).map(b => `
                <div style="display:flex;align-items:center;gap:10px">
                    <span style="font-size:24px">${b.avatar}</span>
                    <div style="flex:1">
                        <div style="font-size:13px;font-weight:700">${b.name}</div>
                        <div style="font-size:10px;color:var(--dim)">${b.aggression >= 0.8 ? 'Loose-Aggressive' : b.aggression >= 0.5 ? 'Tight-Aggressive' : 'Tight-Passive'}</div>
                    </div>
                    <div style="font-size:12px;color:var(--green);font-weight:700">$1,000</div>
                </div>
            `).join('')}
        </div>

        <button class="btn btn-deal" style="width:100%;padding:18px;font-size:17px;margin-top:8px" onclick="launchGame()">
            🎴 Deal Me In
        </button>
    </div>`;
}

function launchGame() {
    game.players = [
        { name: 'You', avatar: '👤', chips: 1000, bet: 0, folded: false, allIn: false, isHuman: true, cards: [], hasActed: false },
        ...BOT_PROFILES.slice(0, game.numBots).map(b => ({
            name: b.name, avatar: b.avatar, chips: 1000, bet: 0, folded: false,
            allIn: false, isBot: true, aggression: b.aggression, cards: [], hasActed: false
        }))
    ];
    game.initialized = true;
    dealNewHand();
}

function dealNewHand() {
    const alive = game.players.filter(p => p.chips > 0 || p.isHuman);
    if (alive.length <= 1) { renderGameOver(); return; }

    game.players.forEach(p => {
        p.bet = 0; p.folded = false; p.allIn = false;
        p.cards = []; p.handResult = null; p.lowResult = null; p.hasActed = false;
    });

    game.pot = 0; game.communityCards = []; game.currentBet = 0;
    game.street = 'preflop'; game.handOver = false;
    game.showdownResults = null; game.lastAction = '';
    game.minRaise = game.blinds.big;
    game.liveAnalysis = null; game.liveAnalysisStreet = null;

    game.deck = PokerEngine.shuffle(PokerEngine.createDeck());

    const numCards = holeCardCount();
    game.players.forEach(p => {
        if (p.chips > 0) {
            p.cards = [];
            for (let i = 0; i < numCards; i++) p.cards.push(game.deck.pop());
        } else {
            p.folded = true;
        }
    });

    const sb = findNextActive(game.dealerButton);
    const bb = findNextActive(sb);
    postBlind(sb, game.blinds.small);
    postBlind(bb, game.blinds.big);
    game.currentBet = game.blinds.big;
    game.currentPlayer = findNextActive(bb);

    renderGame();
    if (game.players[game.currentPlayer].isBot) setTimeout(doBotAction, 700);
}

function findNextActive(from) {
    let idx = (from + 1) % game.players.length;
    for (let i = 0; i < game.players.length; i++) {
        const p = game.players[idx];
        if (!p.folded && p.chips > 0 && !p.allIn) return idx;
        idx = (idx + 1) % game.players.length;
    }
    return (from + 1) % game.players.length;
}

function postBlind(idx, amount) {
    const p = game.players[idx];
    const actual = Math.min(amount, p.chips);
    p.chips -= actual; p.bet += actual; game.pot += actual;
    if (p.chips === 0) p.allIn = true;
}

// === PLAYER ACTIONS ===
function playerAction(action, amount) {
    const p = game.players[0];
    if (game.currentPlayer !== 0 || p.folded || p.allIn || game.handOver) return;

    switch (action) {
        case 'fold':
            p.folded = true; game.lastAction = 'You fold'; break;
        case 'check':
            game.lastAction = 'You check'; break;
        case 'call': {
            const cost = Math.min(game.currentBet - p.bet, p.chips);
            p.chips -= cost; p.bet += cost; game.pot += cost;
            if (p.chips === 0) p.allIn = true;
            game.lastAction = `You call $${cost}`; break;
        }
        case 'raise': {
            const total = Math.min(amount, p.chips + p.bet);
            const cost = total - p.bet;
            if (cost <= 0) return;
            game.minRaise = Math.max(game.minRaise, total - game.currentBet);
            p.chips -= cost; game.pot += cost; game.currentBet = total; p.bet = total;
            if (p.chips === 0) p.allIn = true;
            game.lastAction = `You raise to $${total}`;
            resetActed(p); break;
        }
        case 'allin': {
            const total = p.chips + p.bet;
            const cost = p.chips;
            game.pot += cost;
            if (total > game.currentBet) {
                game.minRaise = Math.max(game.minRaise, total - game.currentBet);
                game.currentBet = total; resetActed(p);
            }
            p.bet = total; p.chips = 0; p.allIn = true;
            game.lastAction = `You go ALL IN $${total}`; break;
        }
    }
    p.hasActed = true;
    advanceAction();
}

function resetActed(except) {
    game.players.forEach(p => { if (!p.folded && !p.allIn && p !== except) p.hasActed = false; });
}

function advanceAction() {
    const active = game.players.filter(p => !p.folded);
    if (active.length === 1) { endHand(active[0]); return; }

    const needAction = active.filter(p => !p.allIn && (!p.hasActed || p.bet < game.currentBet));
    if (needAction.length === 0) { nextStreet(); return; }

    let next = game.currentPlayer;
    for (let i = 0; i < game.players.length; i++) {
        next = (next + 1) % game.players.length;
        const p = game.players[next];
        if (!p.folded && !p.allIn && (!p.hasActed || p.bet < game.currentBet)) break;
    }

    game.currentPlayer = next;
    renderGame();
    if (game.players[next].isBot) setTimeout(doBotAction, 600 + Math.random() * 600);
}

function nextStreet() {
    game.players.forEach(p => { p.bet = 0; p.hasActed = false; });
    game.currentBet = 0; game.minRaise = game.blinds.big;
    game.liveAnalysis = null; // Reset coaching cache for new street
    const canBet = game.players.filter(p => !p.folded && !p.allIn).length >= 2;

    switch (game.street) {
        case 'preflop':
            game.deck.pop();
            game.communityCards.push(game.deck.pop(), game.deck.pop(), game.deck.pop());
            game.street = 'flop'; break;
        case 'flop':
            game.deck.pop();
            game.communityCards.push(game.deck.pop());
            game.street = 'turn'; break;
        case 'turn':
            game.deck.pop();
            game.communityCards.push(game.deck.pop());
            game.street = 'river'; break;
        case 'river':
            doShowdown(); return;
    }

    if (!canBet) {
        renderGame();
        const runout = () => {
            if (game.communityCards.length < 5) {
                game.deck.pop();
                game.communityCards.push(game.deck.pop());
                if (game.communityCards.length === 4) game.street = 'turn';
                if (game.communityCards.length === 5) game.street = 'river';
                renderGame();
                setTimeout(runout, 800);
            } else { setTimeout(doShowdown, 600); }
        };
        setTimeout(runout, 800);
        return;
    }

    game.currentPlayer = findNextActive(game.dealerButton);
    renderGame();
    if (game.players[game.currentPlayer].isBot) setTimeout(doBotAction, 700);
}

// === EVALUATION HELPERS ===
function evalPlayerHand(playerCards, board) {
    if (game.gameType === 'holdem') {
        return PokerEngine.evaluateBest([...playerCards, ...board]);
    }
    return PokerEngine.evaluateOmaha(playerCards, board);
}

function evalPlayerLow(playerCards, board) {
    if (game.gameType !== 'omaha-hilo') return null;
    return PokerEngine.evaluateOmahaLow(playerCards, board);
}

// === SHOWDOWN ===
function doShowdown() {
    const active = game.players.filter(p => !p.folded);

    // Evaluate high hands
    const highResults = active.map(p => ({
        player: p,
        hand: evalPlayerHand(p.cards, game.communityCards)
    })).sort((a, b) => PokerEngine.compareResults(b.hand, a.hand));

    highResults.forEach(r => r.player.handResult = r.hand);

    if (game.gameType === 'omaha-hilo') {
        // Hi-Lo: split pot between best high and best qualifying low
        const lowResults = active.map(p => ({
            player: p,
            low: evalPlayerLow(p.cards, game.communityCards)
        })).filter(r => r.low !== null)
          .sort((a, b) => PokerEngine.compareLow(a.low, b.low));

        lowResults.forEach(r => r.player.lowResult = r.low);

        // Find high winners (could tie)
        const highWinners = [highResults[0]];
        for (let i = 1; i < highResults.length; i++) {
            if (PokerEngine.compareResults(highResults[i].hand, highResults[0].hand) === 0) highWinners.push(highResults[i]);
            else break;
        }

        if (lowResults.length > 0) {
            // Split pot
            const highPot = Math.floor(game.pot / 2);
            const lowPot = game.pot - highPot;

            // High winners
            const highShare = Math.floor(highPot / highWinners.length);
            highWinners.forEach(w => w.player.chips += highShare);

            // Low winners (could tie)
            const lowWinners = [lowResults[0]];
            for (let i = 1; i < lowResults.length; i++) {
                if (PokerEngine.compareLow(lowResults[i].low, lowResults[0].low) === 0) lowWinners.push(lowResults[i]);
                else break;
            }
            const lowShare = Math.floor(lowPot / lowWinners.length);
            lowWinners.forEach(w => w.player.chips += lowShare);

            game.showdownResults = {
                winners: highWinners,
                lowWinners: lowWinners,
                results: highResults,
                lowResults: lowResults,
                isHiLo: true,
                highPot, lowPot,
            };
        } else {
            // No qualifying low — high takes all
            const share = Math.floor(game.pot / highWinners.length);
            highWinners.forEach(w => w.player.chips += share);

            game.showdownResults = {
                winners: highWinners,
                lowWinners: [],
                results: highResults,
                lowResults: [],
                isHiLo: true,
                noLow: true,
                highPot: game.pot, lowPot: 0,
            };
        }
    } else {
        // Hold'em or Omaha High — winner takes all
        const winners = [highResults[0]];
        for (let i = 1; i < highResults.length; i++) {
            if (PokerEngine.compareResults(highResults[i].hand, highResults[0].hand) === 0) winners.push(highResults[i]);
            else break;
        }
        const share = Math.floor(game.pot / winners.length);
        winners.forEach(w => w.player.chips += share);

        game.showdownResults = { winners, results: highResults, isHiLo: false };
    }

    game.handOver = true; game.street = 'showdown';
    renderGame();

    const sw = game.showdownResults;
    const humanWonHigh = sw.winners.some(w => w.player.isHuman);
    const humanWonLow = sw.lowWinners && sw.lowWinners.some(w => w.player.isHuman);
    if (humanWonHigh || humanWonLow) {
        celebrate(); addXP(50);
        if (!state.achievements.gameWin) unlockAch('gameWin');
    } else {
        addXP(5);
    }
}

function endHand(winner) {
    winner.chips += game.pot;
    game.handOver = true;
    game.showdownResults = { winners: [{ player: winner, hand: null }], results: [{ player: winner, hand: null }], isHiLo: false, lowWinners: [] };
    game.lastAction = `${winner.name} wins $${game.pot}`;
    renderGame();
    if (winner.isHuman) { celebrate(); addXP(30); if (!state.achievements.gameWin) unlockAch('gameWin'); }
    else addXP(5);
}

function dealNextHand() {
    let next = game.dealerButton;
    for (let i = 0; i < game.players.length; i++) {
        next = (next + 1) % game.players.length;
        if (game.players[next].chips > 0) break;
    }
    game.dealerButton = next;
    dealNewHand();
}

function setGameType(type) {
    game.gameType = type;
    game.initialized = false;
    game.dealerButton = 0;
    renderLobby();
}

// === BOT AI ===
function doBotAction() {
    const bot = game.players[game.currentPlayer];
    if (!bot || !bot.isBot || bot.folded || bot.allIn) { advanceAction(); return; }
    game.liveAnalysis = null; // Invalidate coaching cache when action changes

    const callAmount = game.currentBet - bot.bet;
    let strength;

    if (game.communityCards.length === 0) {
        strength = PokerEngine.preflopStrength(bot.cards);
    } else {
        const hand = evalPlayerHand(bot.cards, game.communityCards);
        strength = (hand.handRank + 1) / 10;
        // Boost for draws (only pre-river)
        if (game.communityCards.length < 5) {
            let outs;
            if (game.gameType === 'holdem') {
                outs = PokerEngine.calculateOuts(bot.cards, game.communityCards);
            } else {
                outs = PokerEngine.calculateOmahaOuts(bot.cards, game.communityCards);
            }
            strength += outs.outs * 0.015;
        }
        // In hi-lo, boost if bot has a strong low draw
        if (game.gameType === 'omaha-hilo') {
            const low = evalPlayerLow(bot.cards, game.communityCards);
            if (low) strength += 0.15; // Having a qualifying low is very valuable
        }
    }

    const effective = strength * (0.7 + bot.aggression * 0.5);
    const potOdds = callAmount > 0 ? callAmount / (game.pot + callAmount) : 0;

    if (callAmount === 0) {
        if (effective > 0.6 && Math.random() < 0.5 + bot.aggression * 0.3) {
            const size = Math.max(game.blinds.big, Math.floor(game.pot * (0.35 + bot.aggression * 0.35)));
            doBotBet(bot, size);
        } else {
            game.lastAction = `${bot.name} checks`;
        }
    } else {
        if (effective > 0.7 && Math.random() < bot.aggression * 0.6) {
            const raiseAmt = Math.max(game.minRaise, Math.floor(game.pot * 0.5));
            doBotRaise(bot, game.currentBet + raiseAmt);
        } else if (effective > potOdds + 0.05) {
            const cost = Math.min(callAmount, bot.chips);
            bot.chips -= cost; bot.bet += cost; game.pot += cost;
            if (bot.chips === 0) bot.allIn = true;
            game.lastAction = `${bot.name} calls $${cost}`;
        } else {
            bot.folded = true;
            game.lastAction = `${bot.name} folds`;
        }
    }

    bot.hasActed = true;
    advanceAction();
}

function doBotBet(bot, size) {
    const actual = Math.min(size, bot.chips);
    bot.chips -= actual; bot.bet = actual; game.pot += actual;
    game.currentBet = actual; game.minRaise = actual;
    if (bot.chips === 0) bot.allIn = true;
    game.lastAction = `${bot.name} bets $${actual}`;
    resetActed(bot);
}

function doBotRaise(bot, total) {
    const capped = Math.min(total, bot.chips + bot.bet);
    const cost = capped - bot.bet;
    if (cost <= 0) {
        const callCost = Math.min(game.currentBet - bot.bet, bot.chips);
        bot.chips -= callCost; bot.bet += callCost; game.pot += callCost;
        if (bot.chips === 0) bot.allIn = true;
        game.lastAction = `${bot.name} calls $${callCost}`;
        return;
    }
    bot.chips -= cost; game.pot += cost;
    game.minRaise = Math.max(game.minRaise, capped - game.currentBet);
    game.currentBet = capped; bot.bet = capped;
    if (bot.chips === 0) bot.allIn = true;
    game.lastAction = `${bot.name} raises to $${capped}`;
    resetActed(bot);
}

// === LIVE COACHING ===
function getLiveAnalysis(human) {
    // Cache: only recalculate when street changes
    if (game.liveAnalysis && game.liveAnalysisStreet === game.street) {
        return game.liveAnalysis;
    }

    const cards = human.cards;
    const board = game.communityCards;
    const numOpp = game.players.filter(p => !p.folded && p !== human).length;
    if (numOpp === 0) return null;

    let hand, equity, outs, lowStr = null;

    if (board.length >= 3) {
        hand = evalPlayerHand(cards, board);
        // Quick equity with fewer iterations for speed
        const isOmaha = game.gameType !== 'holdem';
        equity = isOmaha
            ? PokerEngine.calculateOmahaEquity(cards, board, numOpp, 400)
            : PokerEngine.calculateEquity(cards, board, numOpp, 500);
        outs = isOmaha
            ? PokerEngine.calculateOmahaOuts(cards, board)
            : PokerEngine.calculateOuts(cards, board);
        if (game.gameType === 'omaha-hilo') {
            const low = evalPlayerLow(cards, board);
            lowStr = low ? PokerEngine.lowToString(low) : null;
        }
    } else {
        // Preflop
        const strength = PokerEngine.preflopStrength(cards);
        hand = { handName: cards.length === 4 ? '4 Hole Cards' : 'Hole Cards', handRank: -1 };
        // Rough preflop equity estimate
        const isOmaha = game.gameType !== 'holdem';
        equity = isOmaha
            ? PokerEngine.calculateOmahaEquity(cards, [], numOpp, 300)
            : PokerEngine.calculateEquity(cards, [], numOpp, 400);
        outs = { outs: '-' };
    }

    // Recommendation
    const callAmt = game.currentBet - human.bet;
    const potOdds = callAmt > 0 ? Math.round((callAmt / (game.pot + callAmt)) * 100) : 0;
    let rec, recColor, recIcon;

    if (equity.equity >= 70) {
        rec = 'Raise'; recColor = '#22c55e'; recIcon = '🚀';
    } else if (equity.equity >= 50) {
        rec = callAmt > 0 ? 'Call' : 'Bet'; recColor = '#3b82f6'; recIcon = '✅';
    } else if (equity.equity >= 30) {
        rec = callAmt > 0 ? 'Call (cautious)' : 'Check'; recColor = '#f59e0b'; recIcon = '⚠️';
    } else {
        rec = callAmt > 0 ? 'Fold' : 'Check'; recColor = '#ef4444'; recIcon = '🛑';
    }

    // Pot odds tip
    let potOddsTip = '';
    if (callAmt > 0 && board.length >= 3 && board.length < 5 && typeof outs.outs === 'number' && outs.outs > 0) {
        const outsEquity = Math.round(outs.outs * (board.length === 3 ? 4 : 2));
        potOddsTip = outsEquity > potOdds
            ? `Pot odds ${potOdds}% < outs equity ~${outsEquity}% — profitable call`
            : `Pot odds ${potOdds}% > outs equity ~${outsEquity}% — risky call`;
    }

    // Commentary
    let tip = '';
    if (board.length === 0) {
        const s = PokerEngine.preflopStrength(cards);
        if (s >= 0.7) tip = 'Premium hand — raise for value and thin the field.';
        else if (s >= 0.45) tip = 'Solid starting hand — raise or call depending on position.';
        else if (s >= 0.3) tip = 'Marginal hand — play carefully, consider folding to raises.';
        else tip = 'Weak hand — fold to aggression, or steal from late position.';
    } else if (hand.handRank >= 6) {
        tip = `${hand.handName} is very strong. Bet big for value.`;
    } else if (hand.handRank >= 4) {
        tip = `${hand.handName}. Solid hand — bet for protection or value.`;
    } else if (hand.handRank >= 2) {
        tip = `${hand.handName}. Decent but vulnerable. Size your bets carefully.`;
    } else if (typeof outs.outs === 'number' && outs.outs >= 8) {
        tip = `${hand.handName} but ${outs.outs} outs to improve. Good draw — consider calling.`;
    } else {
        tip = `${hand.handName}. Weak holding — check or fold to pressure.`;
    }

    if (lowStr) tip += ` You have a qualifying low (${lowStr}) — extra value!`;

    const analysis = { hand, equity, outs, rec, recColor, recIcon, tip, potOddsTip, lowStr };
    game.liveAnalysis = analysis;
    game.liveAnalysisStreet = game.street;
    return analysis;
}

function renderLiveCoach(human) {
    const a = getLiveAnalysis(human);
    if (!a) return '';

    const board = game.communityCards;
    const handName = board.length >= 3 ? a.hand.handName : null;

    return `
        <div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px">
            <!-- Hand + Recommendation row -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                ${handName ? `<span style="font-size:14px;color:var(--cyan);font-weight:800;flex:1">${handName}</span>` :
                  `<span style="font-size:13px;color:var(--dim);flex:1">Preflop</span>`}
                ${a.lowStr ? `<span style="font-size:11px;color:var(--green);font-weight:600">Low: ${a.lowStr}</span>` :
                  game.gameType === 'omaha-hilo' && board.length >= 3 ? '<span style="font-size:11px;color:var(--dim)">No low</span>' : ''}
                <span style="font-size:14px;font-weight:800;color:${a.recColor}">${a.recIcon} ${a.rec}</span>
            </div>

            <!-- Stats row -->
            <div style="display:flex;gap:6px;margin-bottom:8px">
                <div style="flex:1;background:rgba(255,255,255,0.04);border-radius:8px;padding:8px;text-align:center">
                    <div style="font-size:10px;color:var(--dim)">Equity</div>
                    <div style="font-size:18px;font-weight:900;color:var(--cyan)">${a.equity.equity}%</div>
                </div>
                <div style="flex:1;background:rgba(255,255,255,0.04);border-radius:8px;padding:8px;text-align:center">
                    <div style="font-size:10px;color:var(--dim)">Win</div>
                    <div style="font-size:18px;font-weight:900;color:var(--green)">${a.equity.winPct}%</div>
                </div>
                <div style="flex:1;background:rgba(255,255,255,0.04);border-radius:8px;padding:8px;text-align:center">
                    <div style="font-size:10px;color:var(--dim)">Outs</div>
                    <div style="font-size:18px;font-weight:900;color:var(--gold)">${a.outs.outs}</div>
                </div>
            </div>

            <!-- Tip -->
            <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 10px">
                <div style="font-size:11px;color:var(--dim);margin-bottom:3px">🧠 COACH</div>
                <div style="font-size:12px;color:var(--text);line-height:1.5">${a.tip}</div>
                ${a.potOddsTip ? `<div style="font-size:11px;color:var(--cyan);margin-top:4px">${a.potOddsTip}</div>` : ''}
            </div>
        </div>`;
}

// === RENDER ===
function getBotPositions(numBots) {
    const positions = [];
    const total = numBots + 1; // +1 for human's slot at bottom
    for (let i = 1; i <= numBots; i++) {
        const angle = Math.PI / 2 + (2 * Math.PI * i) / total;
        positions.push({
            left: 50 + 46 * Math.cos(angle),
            top: 48 + 42 * Math.sin(angle),
        });
    }
    return positions;
}

function renderTinyCard() {
    return `<div style="width:18px;height:26px;background:repeating-linear-gradient(45deg,#1e3a5f,#1e3a5f 3px,#15304f 3px,#15304f 6px);border-radius:3px;border:1px solid #2a5a8f;display:inline-block;flex-shrink:0"></div>`;
}

function renderGame() {
    const c = document.getElementById('app-content');
    const human = game.players[0];

    if (game.handOver) { renderHandOver(c); return; }

    const isMyTurn = game.currentPlayer === 0 && !human.folded && !human.allIn;
    const callAmt = game.currentBet - human.bet;
    const bots = game.players.slice(1);
    const minRaiseTotal = game.currentBet + game.minRaise;
    const halfPot = game.currentBet + Math.max(game.minRaise, Math.floor(game.pot / 2));
    const potRaise = game.currentBet + Math.max(game.minRaise, game.pot);
    const numHole = holeCardCount();
    const positions = getBotPositions(bots.length);
    const seatSize = bots.length <= 4 ? 72 : bots.length <= 6 ? 64 : 56;

    c.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px" class="fade-in">
        <!-- Game Type Badge -->
        <div style="text-align:center">
            <span style="font-size:10px;font-weight:700;color:var(--cyan);text-transform:uppercase;letter-spacing:1px">${GAME_TYPE_LABELS[game.gameType]} &middot; ${game.players.length} Players</span>
        </div>

        <!-- TABLE WITH SEATS -->
        <div style="position:relative;width:100%;padding-bottom:${bots.length <= 3 ? '60' : bots.length <= 6 ? '70' : '80'}%">
            <!-- Felt oval -->
            <div class="felt-table" style="position:absolute;left:14%;right:14%;top:16%;bottom:16%;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px">
                <div style="font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">${game.street}</div>
                <div style="font-size:22px;font-weight:900;color:var(--gold);margin-bottom:6px">$${game.pot}</div>
                <div style="display:flex;gap:3px;justify-content:center;flex-wrap:wrap;max-width:90%">
                    ${game.communityCards.length > 0 ?
                        game.communityCards.map((card, i) => `<div class="flip-in" style="animation-delay:${i*0.06}s">${renderCardHTML(card, 'small')}</div>`).join('') :
                        `<span style="color:rgba(255,255,255,0.2);font-size:11px">${game.street === 'preflop' ? 'Preflop' : ''}</span>`}
                </div>
                ${game.lastAction ? `<div style="margin-top:4px;font-size:10px;color:rgba(255,255,255,0.4);max-width:90%;text-align:center">${game.lastAction}</div>` : ''}
            </div>

            <!-- Bot seats around the table -->
            ${bots.map((p, i) => {
                const pos = positions[i];
                const isActive = game.currentPlayer === i + 1 && !p.folded;
                const isDealer = game.dealerButton === i + 1;
                return `<div style="position:absolute;left:${pos.left}%;top:${pos.top}%;transform:translate(-50%,-50%);width:${seatSize}px;text-align:center;z-index:2">
                    <div style="
                        background:${isActive ? 'rgba(34,211,238,0.2)' : 'rgba(0,0,0,0.5)'};
                        border:${isActive ? '2px solid rgba(34,211,238,0.5)' : '1px solid rgba(255,255,255,0.1)'};
                        border-radius:10px;padding:6px 4px;backdrop-filter:blur(8px);
                        ${p.folded ? 'opacity:0.35;' : ''}
                        transition:all 0.3s;position:relative;
                    ">
                        ${isDealer ? '<div style="position:absolute;top:-8px;right:-4px;width:18px;height:18px;background:var(--gold);border-radius:50%;font-size:10px;font-weight:900;color:#000;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.4)">D</div>' : ''}
                        <div style="font-size:${seatSize >= 64 ? 20 : 16}px;line-height:1">${p.avatar}</div>
                        <div style="font-size:${seatSize >= 64 ? 10 : 9}px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">${p.name}</div>
                        <div style="font-size:${seatSize >= 64 ? 10 : 9}px;color:var(--green);font-weight:700">$${p.chips}</div>
                        <div style="display:flex;gap:2px;justify-content:center;margin-top:2px">
                            ${p.folded ? `<span style="font-size:${seatSize >= 64 ? 9 : 8}px;color:var(--red)">FOLD</span>` :
                              p.allIn ? `<span style="font-size:${seatSize >= 64 ? 9 : 8}px;color:var(--gold);font-weight:800">ALL IN</span>` :
                              Array(Math.min(numHole, 2)).fill(renderTinyCard()).join('')}
                        </div>
                        ${p.bet > 0 ? `<div style="font-size:8px;color:var(--gold);margin-top:1px">$${p.bet}</div>` : ''}
                    </div>
                </div>`;
            }).join('')}

            <!-- Your seat indicator on the table -->
            <div style="position:absolute;left:50%;bottom:2%;transform:translateX(-50%);z-index:2">
                <div style="background:${isMyTurn ? 'rgba(34,211,238,0.2)' : 'rgba(0,0,0,0.5)'};border:${isMyTurn ? '2px solid rgba(34,211,238,0.5)' : '1px solid rgba(255,255,255,0.1)'};border-radius:10px;padding:4px 14px;backdrop-filter:blur(8px);text-align:center;position:relative">
                    ${game.dealerButton === 0 ? '<div style="position:absolute;top:-8px;right:-4px;width:18px;height:18px;background:var(--gold);border-radius:50%;font-size:10px;font-weight:900;color:#000;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.4)">D</div>' : ''}
                    <span style="font-size:14px">👤</span>
                    <div style="font-size:10px;font-weight:700">You</div>
                    <div style="font-size:10px;color:var(--green);font-weight:700">$${human.chips}</div>
                </div>
            </div>
        </div>

        <!-- Your Hand (below table) -->
        <div class="glass${isMyTurn?' active-turn':''}" style="padding:14px;${human.folded?'opacity:0.35;':''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:18px">👤</span>
                    <div>
                        <div style="font-size:13px;font-weight:700">Your Hand${human.folded?' <span style="color:var(--red);font-size:11px">FOLDED</span>':''}${human.allIn?' <span style="color:var(--gold);font-size:11px;font-weight:800">ALL IN</span>':''}</div>
                        ${human.bet > 0 ? `<div style="font-size:11px;color:var(--dim)">Bet: $${human.bet}</div>` : ''}
                    </div>
                </div>
                <div style="font-size:16px;font-weight:900;color:var(--green)">$${human.chips}</div>
            </div>
            <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
                ${human.cards.map(card => renderCardHTML(card)).join('')}
            </div>
            ${!human.folded ? renderLiveCoach(human) : ''}
        </div>

        <!-- Actions -->
        ${isMyTurn ? `<div style="display:flex;flex-direction:column;gap:8px" class="slide-up">
            <div style="display:flex;gap:8px">
                <button class="btn btn-fold" style="flex:1" onclick="playerAction('fold')">Fold</button>
                ${callAmt === 0 ?
                    `<button class="btn btn-check" style="flex:1" onclick="playerAction('check')">Check</button>` :
                    `<button class="btn btn-call" style="flex:1" onclick="playerAction('call')">Call $${Math.min(callAmt, human.chips)}</button>`}
            </div>
            <div style="display:flex;gap:6px">
                <button class="btn btn-raise" style="flex:1;font-size:12px;padding:10px 6px" onclick="playerAction('raise',${minRaiseTotal})" ${minRaiseTotal > human.chips + human.bet ? 'disabled' : ''}>Min<br>$${minRaiseTotal}</button>
                <button class="btn btn-raise" style="flex:1;font-size:12px;padding:10px 6px" onclick="playerAction('raise',${halfPot})" ${halfPot > human.chips + human.bet ? 'disabled' : ''}>½ Pot<br>$${halfPot}</button>
                <button class="btn btn-raise" style="flex:1;font-size:12px;padding:10px 6px" onclick="playerAction('raise',${potRaise})" ${potRaise > human.chips + human.bet ? 'disabled' : ''}>Pot<br>$${potRaise}</button>
                <button class="btn btn-allin" style="flex:1;font-size:12px;padding:10px 6px" onclick="playerAction('allin')">All In<br>$${human.chips + human.bet}</button>
            </div>
        </div>` : !game.handOver && !human.folded && !human.allIn ? `
            <div style="text-align:center;padding:14px;color:var(--cyan);font-size:14px">
                <span style="animation:pulse 1.5s infinite;display:inline-block">Waiting for ${game.players[game.currentPlayer]?.name || '...'}...</span>
            </div>` : human.folded && !game.handOver ? `
            <div style="text-align:center;padding:10px;color:var(--dim);font-size:13px">Hand in progress...</div>` : ''}
    </div>`;
}

function renderHandOver(c) {
    const sw = game.showdownResults;
    const winner = sw.winners[0].player;
    const isShowdown = sw.results.length > 1 && sw.results[0].hand;
    const isHiLo = sw.isHiLo;
    const hasLow = isHiLo && sw.lowWinners && sw.lowWinners.length > 0;
    const numHole = holeCardCount();

    c.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px" class="fade-in">
        <!-- Winner -->
        <div class="glass" style="padding:24px 20px;text-align:center;background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.25);animation:glow 2s ease-in-out infinite">
            <div style="font-size:48px;margin-bottom:8px" class="bounce-in">🏆</div>
            ${isHiLo && hasLow ? `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px">
                    <div>
                        <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">High</div>
                        <div style="font-size:18px;font-weight:900;color:var(--gold)">${sw.winners.map(w=>w.player.avatar+' '+w.player.name).join(', ')}</div>
                        ${sw.winners[0].hand ? `<div style="font-size:13px;color:var(--cyan);margin-top:2px">${sw.winners[0].hand.handName}</div>` : ''}
                        <div style="font-size:13px;color:var(--text);margin-top:2px">$${sw.highPot}</div>
                    </div>
                    <div>
                        <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Low</div>
                        <div style="font-size:18px;font-weight:900;color:var(--green)">${sw.lowWinners.map(w=>w.player.avatar+' '+w.player.name).join(', ')}</div>
                        <div style="font-size:13px;color:var(--green);margin-top:2px">${PokerEngine.lowToString(sw.lowWinners[0].low)}</div>
                        <div style="font-size:13px;color:var(--text);margin-top:2px">$${sw.lowPot}</div>
                    </div>
                </div>
            ` : `
                <div style="font-size:22px;font-weight:900;color:var(--gold)">${winner.avatar} ${winner.name} Wins!</div>
                <div style="font-size:16px;color:var(--text);margin-top:4px">$${game.pot} pot</div>
                ${isShowdown && sw.winners[0].hand ? `<div style="font-size:15px;color:var(--cyan);margin-top:4px;font-weight:700">${sw.winners[0].hand.handName}</div>` :
                  `<div style="font-size:13px;color:var(--dim);margin-top:4px">Everyone else folded</div>`}
                ${isHiLo && sw.noLow ? `<div style="font-size:12px;color:var(--dim);margin-top:4px">No qualifying low</div>` : ''}
            `}
        </div>

        ${isShowdown ? `<!-- Showdown -->
        <div class="glass" style="padding:16px">
            <div style="font-size:11px;color:var(--dim);margin-bottom:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Showdown</div>
            <div style="display:flex;flex-direction:column;gap:10px">
                ${sw.results.map((r, i) => {
                    const isWinner = sw.winners.some(w => w.player === r.player);
                    const lowHand = r.player.lowResult;
                    const isLowWinner = hasLow && sw.lowWinners.some(w => w.player === r.player);
                    return `<div class="player-seat${isWinner || isLowWinner ? ' winner' : ''}" style="flex-direction:column;align-items:stretch;padding:12px">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                            <span style="font-size:22px">${r.player.avatar}</span>
                            <span style="font-weight:700;flex:1;font-size:14px">${r.player.name}</span>
                            <div style="text-align:right">
                                <div style="font-size:13px;color:${isWinner?'var(--gold)':'var(--dim)'};font-weight:700">${r.hand.handName}${isWinner?' 👑':''}</div>
                                ${isHiLo ? `<div style="font-size:11px;color:${isLowWinner?'var(--green)':'var(--dim)'}">
                                    ${lowHand ? 'Low: '+PokerEngine.lowToString(lowHand)+(isLowWinner?' 👑':'') : 'No low'}
                                </div>` : ''}
                            </div>
                        </div>
                        <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap">
                            ${r.player.cards.map(card => renderCardHTML(card, numHole > 2 ? 'small' : undefined)).join('')}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>` : ''}

        ${game.communityCards.length > 0 ? `<!-- Board -->
        <div class="felt-table" style="padding:16px;text-align:center">
            <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:8px;text-transform:uppercase;letter-spacing:2px">Board</div>
            <div style="display:flex;gap:6px;justify-content:center">
                ${game.communityCards.map(card => renderCardHTML(card)).join('')}
            </div>
        </div>` : ''}

        <!-- Chips -->
        <div class="glass" style="padding:16px">
            <div style="font-size:11px;color:var(--dim);margin-bottom:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Chip Counts</div>
            ${game.players.map(p => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;${p.chips<=0?'opacity:0.25;':''}">
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:20px">${p.avatar}</span>
                        <span style="font-weight:700;font-size:14px">${p.name}</span>
                        ${sw.winners.some(w=>w.player===p)?'<span style="font-size:14px">👑</span>':''}
                    </div>
                    <span style="font-weight:800;font-size:15px;color:${p.chips>0?'var(--green)':'var(--red)'}">$${p.chips}</span>
                </div>`).join('')}
        </div>

        <!-- Game Type + Deal -->
        <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;gap:6px">
                ${Object.entries(GAME_TYPE_LABELS).map(([key, label]) => `
                    <button class="btn" style="flex:1;font-size:12px;padding:10px 4px;background:${game.gameType===key?'linear-gradient(135deg,var(--cyan),#0891b2)':'rgba(255,255,255,0.08)'};color:white" onclick="setGameType('${key}')">
                        ${label}
                    </button>`).join('')}
            </div>
            <button class="btn btn-deal" style="width:100%;padding:16px;font-size:16px" onclick="dealNextHand()">
                🎴 Deal Next Hand
            </button>
        </div>
    </div>`;
}

function renderGameOver() {
    const c = document.getElementById('app-content');
    const winner = game.players.reduce((a, b) => a.chips > b.chips ? a : b);
    c.innerHTML = `<div style="display:flex;flex-direction:column;gap:16px;padding-top:40px;text-align:center" class="fade-in">
        <div style="font-size:64px" class="bounce-in">🎰</div>
        <div style="font-size:24px;font-weight:900;color:var(--gold)">${winner.name} wins the game!</div>
        <div style="font-size:16px;color:var(--text)">Final chips: $${winner.chips}</div>
        <div style="display:flex;gap:6px;margin-top:16px">
            ${Object.entries(GAME_TYPE_LABELS).map(([key, label]) => `
                <button class="btn" style="flex:1;font-size:12px;padding:10px 4px;background:${game.gameType===key?'linear-gradient(135deg,var(--cyan),#0891b2)':'rgba(255,255,255,0.08)'};color:white" onclick="setGameType('${key}')">
                    ${label}
                </button>`).join('')}
        </div>
        <button class="btn btn-deal" style="padding:16px;font-size:16px" onclick="resetGame()">🔄 New Game</button>
    </div>`;
}

function resetGame() {
    game.initialized = false;
    game.dealerButton = 0;
    renderLobby();
}
