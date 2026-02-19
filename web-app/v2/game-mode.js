// AI Poker - Game Mode (Play vs Bots)
console.log('🎮 Game Mode Loading...');

// ===== GAME STATE =====
const gameState = {
    mode: 'analyzer', // 'analyzer' or 'game'
    
    // Game settings
    playerCount: 4, // including you
    blinds: {small: 10, big: 20},
    startingChips: 1000,
    
    // Players
    players: [],
    dealerPosition: 0,
    currentPlayer: 0,
    
    // Table
    pot: 0,
    communityCards: [],
    currentBet: 0,
    
    // Round state
    street: 'preflop', // preflop, flop, turn, river
    roundActive: false,
    
    // Your hand
    yourCards: [],
    yourPosition: 0,
    yourChips: 1000,
    yourBet: 0
};

// ===== BOT PERSONALITIES =====
const BOT_NAMES = [
    {name: 'Sarah "The Shark"', style: 'aggressive', avatar: '🦈'},
    {name: 'Mike "The Rock"', style: 'tight', avatar: '🗿'},
    {name: 'Alex "Wild Card"', style: 'loose', avatar: '🃏'},
    {name: 'Jamie "The Pro"', style: 'balanced', avatar: '💎'},
    {name: 'Sam "Bluff Master"', style: 'bluffer', avatar: '🎭'},
    {name: 'Chris "Calculator"', style: 'mathematical', avatar: '🧮'},
    {name: 'Taylor "Maniac"', style: 'crazy', avatar: '🤪'},
    {name: 'Jordan "Ice Cold"', style: 'calm', avatar: '🧊'}
];

// ===== INITIALIZE GAME =====
function startGame() {
    console.log('🎮 Starting new game...');
    
    // Reset state
    gameState.roundActive = true;
    gameState.communityCards = [];
    gameState.pot = 0;
    gameState.currentBet = 0;
    gameState.street = 'preflop';
    
    // Create players
    gameState.players = [{
        name: 'You',
        chips: gameState.yourChips,
        bet: 0,
        cards: [],
        folded: false,
        isYou: true,
        avatar: '👤'
    }];
    
    // Add bots
    const botCount = gameState.playerCount - 1;
    const selectedBots = BOT_NAMES.slice(0, botCount);
    
    selectedBots.forEach(bot => {
        gameState.players.push({
            name: bot.name,
            chips: gameState.startingChips,
            bet: 0,
            cards: [],
            folded: false,
            isYou: false,
            isBot: true,
            style: bot.style,
            avatar: bot.avatar
        });
    });
    
    // Deal cards
    dealCards();
    
    // Post blinds
    postBlinds();
    
    // Render game UI
    renderGameUI();
}

function dealCards() {
    // Create deck
    const suits = ['S', 'H', 'D', 'C'];
    const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    let deck = [];
    
    suits.forEach(suit => {
        ranks.forEach(rank => {
            deck.push(rank + suit);
        });
    });
    
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Deal 2 cards to each player
    gameState.players.forEach(player => {
        player.cards = [deck.pop(), deck.pop()];
    });
    
    gameState.yourCards = gameState.players[0].cards;
    
    // Save deck for community cards
    gameState.deck = deck;
}

function postBlinds() {
    // Small blind (left of dealer)
    const sbPos = (gameState.dealerPosition + 1) % gameState.players.length;
    const bbPos = (gameState.dealerPosition + 2) % gameState.players.length;
    
    gameState.players[sbPos].chips -= gameState.blinds.small;
    gameState.players[sbPos].bet = gameState.blinds.small;
    gameState.pot += gameState.blinds.small;
    
    gameState.players[bbPos].chips -= gameState.blinds.big;
    gameState.players[bbPos].bet = gameState.blinds.big;
    gameState.pot += gameState.blinds.big;
    
    gameState.currentBet = gameState.blinds.big;
    gameState.currentPlayer = (bbPos + 1) % gameState.players.length;
}

// ===== ACTIONS =====
function playerFold() {
    gameState.players[0].folded = true;
    nextPlayer();
    checkRoundComplete();
}

function playerCheck() {
    if (gameState.currentBet === gameState.players[0].bet) {
        nextPlayer();
        checkRoundComplete();
    } else {
        showMessage('You must call or fold!');
    }
}

function playerCall() {
    const callAmount = gameState.currentBet - gameState.players[0].bet;
    gameState.players[0].chips -= callAmount;
    gameState.players[0].bet = gameState.currentBet;
    gameState.pot += callAmount;
    
    nextPlayer();
    checkRoundComplete();
}

function playerRaise(amount) {
    const raiseAmount = gameState.currentBet + amount;
    const cost = raiseAmount - gameState.players[0].bet;
    
    if (cost > gameState.players[0].chips) {
        showMessage('Not enough chips!');
        return;
    }
    
    gameState.players[0].chips -= cost;
    gameState.players[0].bet = raiseAmount;
    gameState.pot += cost;
    gameState.currentBet = raiseAmount;
    
    nextPlayer();
    checkRoundComplete();
}

function nextPlayer() {
    do {
        gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
    } while (gameState.players[gameState.currentPlayer].folded);
    
    // Bot's turn
    if (gameState.players[gameState.currentPlayer].isBot) {
        setTimeout(() => botAction(), 1000);
    } else {
        renderGameUI();
    }
}

function botAction() {
    const bot = gameState.players[gameState.currentPlayer];
    const callAmount = gameState.currentBet - bot.bet;
    
    // Simple bot AI
    const random = Math.random();
    let action;
    
    if (bot.style === 'aggressive' && random > 0.4) {
        action = 'raise';
    } else if (bot.style === 'tight' && random > 0.7) {
        action = 'call';
    } else if (bot.style === 'loose') {
        action = random > 0.3 ? 'call' : 'fold';
    } else {
        action = random > 0.5 ? 'call' : 'fold';
    }
    
    if (callAmount === 0) action = 'check';
    if (callAmount > bot.chips) action = 'fold';
    
    // Execute action
    if (action === 'fold') {
        bot.folded = true;
        showMessage(`${bot.name} folds`);
    } else if (action === 'check') {
        showMessage(`${bot.name} checks`);
    } else if (action === 'call') {
        bot.chips -= callAmount;
        bot.bet = gameState.currentBet;
        gameState.pot += callAmount;
        showMessage(`${bot.name} calls $${callAmount}`);
    } else if (action === 'raise') {
        const raiseAmount = Math.floor(Math.random() * 50) + 50;
        const totalBet = gameState.currentBet + raiseAmount;
        const cost = totalBet - bot.bet;
        
        bot.chips -= cost;
        bot.bet = totalBet;
        gameState.pot += cost;
        gameState.currentBet = totalBet;
        showMessage(`${bot.name} raises to $${totalBet}`);
    }
    
    nextPlayer();
    checkRoundComplete();
}

function checkRoundComplete() {
    // Check if all active players have matched the bet
    const activePlayers = gameState.players.filter(p => !p.folded);
    const allMatched = activePlayers.every(p => p.bet === gameState.currentBet || p.chips === 0);
    
    if (allMatched && gameState.currentPlayer === gameState.dealerPosition + 1) {
        nextStreet();
    }
}

function nextStreet() {
    // Reset bets
    gameState.players.forEach(p => p.bet = 0);
    gameState.currentBet = 0;
    
    if (gameState.street === 'preflop') {
        // Deal flop
        gameState.communityCards = [
            gameState.deck.pop(),
            gameState.deck.pop(),
            gameState.deck.pop()
        ];
        gameState.street = 'flop';
        showMessage('Flop: ' + gameState.communityCards.join(' '));
    } else if (gameState.street === 'flop') {
        // Deal turn
        gameState.communityCards.push(gameState.deck.pop());
        gameState.street = 'turn';
        showMessage('Turn: ' + gameState.communityCards[3]);
    } else if (gameState.street === 'river') {
        // Deal river
        gameState.communityCards.push(gameState.deck.pop());
        gameState.street = 'river';
        showMessage('River: ' + gameState.communityCards[4]);
    } else {
        // Showdown
        showdown();
        return;
    }
    
    gameState.currentPlayer = (gameState.dealerPosition + 1) % gameState.players.length;
    renderGameUI();
    
    // If current player is bot, make their move
    if (gameState.players[gameState.currentPlayer].isBot) {
        setTimeout(() => botAction(), 1000);
    }
}

function showdown() {
    showMessage('Showdown!');
    // TODO: Implement hand comparison and pot distribution
    gameState.roundActive = false;
    renderGameUI();
}

// ===== UI RENDERING =====
function renderGameUI() {
    const container = document.getElementById('app-content');
    
    container.innerHTML = `
        <div class="space-y-4">
            <!-- Pot -->
            <div class="glass-strong rounded-xl p-4 text-center">
                <div class="text-xs text-gray-400">Pot</div>
                <div class="text-4xl font-black text-yellow-400">$${gameState.pot}</div>
            </div>
            
            <!-- Community Cards -->
            <div class="glass rounded-xl p-4">
                <div class="text-xs text-gray-400 mb-2 text-center">Community Cards</div>
                <div class="flex gap-2 justify-center">
                    ${gameState.communityCards.length > 0 ? 
                        gameState.communityCards.map(c => renderCard(c)).join('') :
                        '<div class="text-gray-500 text-sm">No cards yet</div>'
                    }
                </div>
            </div>
            
            <!-- Your Cards -->
            <div class="glass-strong rounded-xl p-4 bg-cyan-600/10 border-cyan-600/30">
                <div class="text-xs text-cyan-400 font-bold mb-2">Your Hand</div>
                <div class="flex gap-2 justify-center mb-3">
                    ${gameState.yourCards.map(c => renderCard(c)).join('')}
                </div>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-white font-bold">Chips: $${gameState.players[0].chips}</span>
                    <span class="text-gray-400">Bet: $${gameState.players[0].bet}</span>
                </div>
            </div>
            
            <!-- Actions -->
            ${!gameState.players[0].folded && gameState.roundActive ? `
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="playerFold()" class="btn btn-danger text-sm">
                        Fold
                    </button>
                    ${gameState.currentBet === gameState.players[0].bet ? `
                        <button onclick="playerCheck()" class="btn btn-primary text-sm">
                            Check
                        </button>
                    ` : `
                        <button onclick="playerCall()" class="btn btn-primary text-sm">
                            Call $${gameState.currentBet - gameState.players[0].bet}
                        </button>
                    `}
                    <button onclick="playerRaise(50)" class="btn btn-success text-sm col-span-2">
                        Raise $50
                    </button>
                </div>
            ` : `
                <button onclick="startGame()" class="btn btn-success w-full">
                    New Hand
                </button>
            `}
            
            <!-- Players -->
            <div class="glass rounded-xl p-3">
                <div class="text-xs text-gray-400 mb-2">Players</div>
                <div class="space-y-2">
                    ${gameState.players.map((p, i) => `
                        <div class="flex items-center justify-between text-xs ${p.folded ? 'opacity-50' : ''}">
                            <div class="flex items-center gap-2">
                                <span class="text-lg">${p.avatar}</span>
                                <span class="text-white font-bold ${i === gameState.currentPlayer ? 'text-cyan-400' : ''}">
                                    ${p.name}
                                </span>
                            </div>
                            <div class="text-gray-400">
                                $${p.chips} ${p.folded ? '(folded)' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
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

function showMessage(msg) {
    console.log('💬', msg);
    // TODO: Add toast notification
}

// ===== MODE SWITCHER =====
function switchMode(mode) {
    gameState.mode = mode;
    
    if (mode === 'game') {
        startGame();
    } else {
        renderApp(); // Go back to analyzer
    }
}

console.log('✅ Game mode ready!');
