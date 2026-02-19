// AI Poker - Game Mode (Play vs Bots) - Clean Rewrite
console.log('🎮 Game Mode Loading...');

// ===== GAME STATE =====
let game = {
    players: [],
    pot: 0,
    communityCards: [],
    deck: [],
    dealerButton: 0,
    currentPlayer: 0,
    currentBet: 0,
    street: 'preflop', // preflop, flop, turn, river, showdown
    actionsThisStreet: 0,
    handOver: false
};

// ===== BOT PERSONALITIES =====
const BOTS = [
    {name: 'Sarah "The Shark"', avatar: '🦈', aggression: 0.7},
    {name: 'Mike "The Rock"', avatar: '🗿', aggression: 0.3},
    {name: 'Alex "Wild Card"', avatar: '🃏', aggression: 0.9},
    {name: 'Jordan "Ice"', avatar: '🧊', aggression: 0.5},
    {name: 'Taylor "Maniac"', avatar: '🤪', aggression: 1.0},
    {name: 'Sam "Bluffer"', avatar: '🎭', aggression: 0.6}
];

// ===== START GAME =====
function startGame() {
    console.log('🎮 Starting new game...');
    
    // If players already exist, just reset for new hand
    if (game.players.length > 0) {
        game.players.forEach(p => {
            p.bet = 0;
            p.folded = false;
            p.cards = [];
        });
    } else {
        // Create players for first hand
        game.players = [
            {name: 'You', avatar: '👤', chips: 1000, bet: 0, folded: false, isHuman: true, cards: []}
        ];
        
        // Add 3 bots
        for (let i = 0; i < 3; i++) {
            const bot = BOTS[i];
            game.players.push({
                name: bot.name,
                avatar: bot.avatar,
                chips: 1000,
                bet: 0,
                folded: false,
                isBot: true,
                aggression: bot.aggression,
                cards: []
            });
        }
    }
    
    // Reset game state
    game.pot = 0;
    game.communityCards = [];
    game.currentBet = 0;
    game.street = 'preflop';
    game.actionsThisStreet = 0;
    game.handOver = false;
    
    // Create and shuffle deck
    createDeck();
    
    // Deal cards
    dealHoleCards();
    
    // Post blinds
    postBlinds();
    
    // Set first player (after big blind)
    game.currentPlayer = 3 % game.players.length;
    
    // Render
    renderGameUI();
    
    // Start bot actions if first player is bot
    if (game.players[game.currentPlayer].isBot) {
        setTimeout(() => botTurn(), 1000);
    }
}

// ===== DECK =====
function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    game.deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            game.deck.push(rank + suit);
        }
    }
    
    // Shuffle
    for (let i = game.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [game.deck[i], game.deck[j]] = [game.deck[j], game.deck[i]];
    }
}

function dealHoleCards() {
    for (let player of game.players) {
        player.cards = [game.deck.pop(), game.deck.pop()];
    }
}

function postBlinds() {
    const sb = (game.dealerButton + 1) % game.players.length;
    const bb = (game.dealerButton + 2) % game.players.length;
    
    // Small blind
    game.players[sb].chips -= 10;
    game.players[sb].bet = 10;
    game.pot += 10;
    
    // Big blind
    game.players[bb].chips -= 20;
    game.players[bb].bet = 20;
    game.pot += 20;
    
    game.currentBet = 20;
}

// ===== PLAYER ACTIONS =====
function playerFold() {
    game.players[0].folded = true;
    console.log('❌ You folded');
    nextPlayer();
}

function playerCheck() {
    console.log('✓ You checked');
    game.actionsThisStreet++;
    nextPlayer();
}

function playerCall() {
    const callAmount = game.currentBet - game.players[0].bet;
    game.players[0].chips -= callAmount;
    game.players[0].bet = game.currentBet;
    game.pot += callAmount;
    console.log(`💰 You called $${callAmount}`);
    game.actionsThisStreet++;
    nextPlayer();
}

function playerRaise(amount) {
    const raiseAmount = game.currentBet + amount;
    const cost = raiseAmount - game.players[0].bet;
    
    if (cost > game.players[0].chips) {
        alert('Not enough chips!');
        return;
    }
    
    game.players[0].chips -= cost;
    game.players[0].bet = raiseAmount;
    game.pot += cost;
    game.currentBet = raiseAmount;
    game.actionsThisStreet = 1; // Reset - everyone needs to act again
    console.log(`🚀 You raised to $${raiseAmount}`);
    nextPlayer();
}

// ===== TURN FLOW =====
function nextPlayer() {
    // Move to next non-folded player
    do {
        game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    } while (game.players[game.currentPlayer].folded);
    
    // Check if street is complete
    const activePlayers = game.players.filter(p => !p.folded);
    
    // If only 1 player left, they win
    if (activePlayers.length === 1) {
        endHand();
        return;
    }
    
    // Check if everyone has acted and matched the bet
    const allMatched = activePlayers.every(p => p.bet === game.currentBet || p.chips === 0);
    const everyoneActed = game.actionsThisStreet >= activePlayers.length;
    
    if (allMatched && everyoneActed) {
        nextStreet();
        return;
    }
    
    // Continue with next player
    if (game.players[game.currentPlayer].isBot) {
        renderGameUI();
        setTimeout(() => botTurn(), 1500);
    } else {
        renderGameUI();
    }
}

function nextStreet() {
    console.log(`🎴 Moving to next street from ${game.street}`);
    
    // Reset for new street
    game.players.forEach(p => p.bet = 0);
    game.currentBet = 0;
    game.actionsThisStreet = 0;
    
    if (game.street === 'preflop') {
        // Deal flop (3 cards)
        game.communityCards = [
            game.deck.pop(),
            game.deck.pop(),
            game.deck.pop()
        ];
        game.street = 'flop';
        console.log('🃏 Flop:', game.communityCards);
        
    } else if (game.street === 'flop') {
        // Deal turn (1 card)
        game.communityCards.push(game.deck.pop());
        game.street = 'turn';
        console.log('🃏 Turn:', game.communityCards[3]);
        
    } else if (game.street === 'turn') {
        // Deal river (1 card)
        game.communityCards.push(game.deck.pop());
        game.street = 'river';
        console.log('🃏 River:', game.communityCards[4]);
        
    } else {
        // Showdown
        endHand();
        return;
    }
    
    // Start new betting round from dealer button
    game.currentPlayer = (game.dealerButton + 1) % game.players.length;
    while (game.players[game.currentPlayer].folded) {
        game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    }
    
    if (game.players[game.currentPlayer].isBot) {
        renderGameUI();
        setTimeout(() => botTurn(), 1500);
    } else {
        renderGameUI();
    }
}

function endHand() {
    const activePlayers = game.players.filter(p => !p.folded);
    let winner;
    let winMessage;
    
    if (activePlayers.length === 1) {
        winner = activePlayers[0];
        winMessage = `${winner.name} wins $${game.pot}! (everyone else folded)`;
    } else {
        // Simple showdown - just pick random winner for now
        winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        winMessage = `${winner.name} wins $${game.pot} at showdown!`;
    }
    
    winner.chips += game.pot;
    console.log('🏆', winMessage);
    
    game.pot = 0;
    game.handOver = true;
    game.winner = winner;
    game.winMessage = winMessage;
    
    renderGameUI();
}

// ===== BOT AI =====
function botTurn() {
    const bot = game.players[game.currentPlayer];
    const callAmount = game.currentBet - bot.bet;
    
    console.log(`🤖 ${bot.name} thinking...`);
    
    // Simple bot logic
    const random = Math.random();
    
    if (callAmount === 0) {
        // Can check
        if (random < 0.7) {
            console.log(`✓ ${bot.name} checks`);
            game.actionsThisStreet++;
        } else {
            // Bet
            const betSize = 30;
            bot.chips -= betSize;
            bot.bet = betSize;
            game.pot += betSize;
            game.currentBet = betSize;
            game.actionsThisStreet = 1;
            console.log(`🚀 ${bot.name} bets $${betSize}`);
        }
    } else {
        // Need to call
        if (random < 0.2) {
            // Fold
            bot.folded = true;
            console.log(`❌ ${bot.name} folds`);
        } else if (random < 0.8) {
            // Call
            bot.chips -= callAmount;
            bot.bet = game.currentBet;
            game.pot += callAmount;
            game.actionsThisStreet++;
            console.log(`💰 ${bot.name} calls $${callAmount}`);
        } else {
            // Raise
            const raiseSize = Math.min(50, bot.chips);
            const raiseTotal = game.currentBet + raiseSize;
            const cost = raiseTotal - bot.bet;
            bot.chips -= cost;
            bot.bet = raiseTotal;
            game.pot += cost;
            game.currentBet = raiseTotal;
            game.actionsThisStreet = 1;
            console.log(`🚀 ${bot.name} raises to $${raiseTotal}`);
        }
    }
    
    nextPlayer();
}

// ===== RENDER =====
function renderGameUI() {
    const container = document.getElementById('app-content');
    const human = game.players[0];
    
    // Hand over - show winner and new hand button
    if (game.handOver) {
        container.innerHTML = `
            <div class="space-y-3">
                <!-- Winner -->
                <div class="glass-strong rounded-xl p-6 text-center animate__animated animate__bounceIn">
                    <div class="text-6xl mb-4">🏆</div>
                    <div class="text-2xl font-bold text-yellow-400 mb-2">${game.winner.avatar} ${game.winner.name}</div>
                    <div class="text-white text-lg">${game.winMessage}</div>
                </div>
                
                <!-- Community Cards -->
                ${game.communityCards.length > 0 ? `
                    <div class="glass rounded-xl p-3">
                        <div class="text-xs text-gray-400 mb-2 text-center">Final Board</div>
                        <div class="flex gap-2 justify-center flex-wrap">
                            ${game.communityCards.map(card => renderCard(card)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- New Hand Button -->
                <button onclick="startGame()" class="btn bg-gradient-to-r from-purple-600 to-pink-600 text-white w-full py-4 text-lg font-bold animate__animated animate__pulse animate__infinite">
                    🎴 Deal Next Hand
                </button>
                
                <!-- Chip Counts -->
                <div class="glass rounded-xl p-3">
                    <div class="text-xs text-gray-400 mb-2">Chip Counts</div>
                    <div class="space-y-2">
                        ${game.players.map((p) => `
                            <div class="flex items-center justify-between text-sm p-2 rounded ${p.name === game.winner.name ? 'bg-yellow-400/20' : ''}">
                                <div class="flex items-center gap-2">
                                    <span class="text-xl">${p.avatar}</span>
                                    <span class="text-white">${p.name}</span>
                                    ${p.name === game.winner.name ? '<span class="text-yellow-400">👑</span>' : ''}
                                </div>
                                <div class="text-green-400 font-bold">$${p.chips}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    const isYourTurn = game.currentPlayer === 0;
    const callAmount = game.currentBet - human.bet;
    
    container.innerHTML = `
        <div class="space-y-3">
            <!-- Pot -->
            <div class="glass-strong rounded-xl p-3 text-center">
                <div class="text-xs text-gray-400">Pot</div>
                <div class="text-3xl font-black text-yellow-400">$${game.pot}</div>
                <div class="text-xs text-cyan-400 mt-1">${game.street.toUpperCase()}</div>
            </div>
            
            <!-- Community Cards -->
            <div class="glass rounded-xl p-3">
                <div class="text-xs text-gray-400 mb-2 text-center">Community Cards</div>
                <div class="flex gap-2 justify-center flex-wrap">
                    ${game.communityCards.length > 0 ? 
                        game.communityCards.map(card => renderCard(card)).join('') :
                        '<div class="text-gray-500 text-sm">Waiting for flop...</div>'
                    }
                </div>
            </div>
            
            <!-- Your Cards -->
            <div class="glass-strong rounded-xl p-3 ${human.folded ? 'opacity-50' : 'bg-cyan-600/10 border border-cyan-600/30'}">
                <div class="text-xs ${human.folded ? 'text-gray-400' : 'text-cyan-400'} font-bold mb-2">
                    Your Hand ${human.folded ? '(FOLDED)' : ''}
                </div>
                <div class="flex gap-2 justify-center mb-2">
                    ${human.cards.map(card => renderCard(card)).join('')}
                </div>
                <div class="flex items-center justify-between text-xs">
                    <span class="text-white font-bold">💰 $${human.chips}</span>
                    <span class="text-gray-400">Bet: $${human.bet}</span>
                </div>
            </div>
            
            <!-- Actions -->
            ${!human.folded && isYourTurn ? `
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="playerFold()" class="btn bg-red-600 text-white text-sm py-3">
                        ❌ Fold
                    </button>
                    ${callAmount === 0 ? `
                        <button onclick="playerCheck()" class="btn bg-cyan-600 text-white text-sm py-3">
                            ✓ Check
                        </button>
                    ` : `
                        <button onclick="playerCall()" class="btn bg-cyan-600 text-white text-sm py-3">
                            💰 Call $${callAmount}
                        </button>
                    `}
                    <button onclick="playerRaise(50)" class="btn bg-green-600 text-white text-sm py-3 col-span-2">
                        🚀 Raise $50
                    </button>
                </div>
            ` : !human.folded && !isYourTurn ? `
                <div class="glass rounded-xl p-4 text-center">
                    <div class="text-yellow-400 animate-pulse">⏳ Waiting for ${game.players[game.currentPlayer].name}...</div>
                </div>
            ` : `
                <button onclick="startGame()" class="btn bg-purple-600 text-white w-full py-3">
                    🔄 New Hand
                </button>
            `}
            
            <!-- Players -->
            <div class="glass rounded-xl p-3">
                <div class="text-xs text-gray-400 mb-2">Players</div>
                <div class="space-y-2">
                    ${game.players.map((p, idx) => `
                        <div class="flex items-center justify-between text-sm ${idx === game.currentPlayer && !p.folded ? 'bg-yellow-400/20 rounded-lg p-2' : 'p-2'}">
                            <div class="flex items-center gap-2">
                                <span class="text-xl">${p.avatar}</span>
                                <span class="text-white ${p.folded ? 'line-through opacity-50' : ''}">${p.name}</span>
                                ${idx === game.currentPlayer && !p.folded ? '<span class="text-yellow-400">👈</span>' : ''}
                            </div>
                            <div class="text-right">
                                <div class="text-green-400 font-bold">$${p.chips}</div>
                                ${p.bet > 0 ? `<div class="text-xs text-gray-400">bet: $${p.bet}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderCard(card) {
    const suit = card.slice(-1);
    const rank = card.slice(0, -1);
    const isRed = suit === '♥' || suit === '♦';
    
    return `
        <div class="inline-flex flex-col items-center justify-between bg-white rounded-lg p-2 shadow-lg min-w-[50px] h-[70px]">
            <div class="text-lg font-bold ${isRed ? 'text-red-600' : 'text-black'}">${rank}</div>
            <div class="text-2xl ${isRed ? 'text-red-600' : 'text-black'}">${suit}</div>
        </div>
    `;
}

console.log('✅ Game mode ready!');
