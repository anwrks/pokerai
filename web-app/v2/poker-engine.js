// Poker Hand Evaluator - Correct 7-card evaluation, equity, outs
const PokerEngine = (() => {
    const RANK_VALUES = {'2':0,'3':1,'4':2,'5':3,'6':4,'7':5,'8':6,'9':7,'10':8,'T':8,'J':9,'Q':10,'K':11,'A':12};
    const RANK_NAMES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const SUIT_MAP = {'S':0,'s':0,'♠':0,'H':1,'h':1,'♥':1,'D':2,'d':2,'♦':2,'C':3,'c':3,'♣':3};
    const SUIT_SYMBOLS = ['♠','♥','♦','♣'];
    const HAND_NAMES = ['High Card','Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush','Royal Flush'];

    function parseCard(str) {
        str = str.trim();
        const suit = SUIT_MAP[str.slice(-1)];
        const rank = RANK_VALUES[str.slice(0,-1)];
        if (rank === undefined || suit === undefined) throw new Error('Invalid card: ' + str);
        return { rank, suit };
    }

    function cardToString(rank, suit) {
        return RANK_NAMES[rank] + SUIT_SYMBOLS[suit];
    }

    function combinations(arr, k) {
        if (k === 0) return [[]];
        if (arr.length < k) return [];
        const [first, ...rest] = arr;
        return [...combinations(rest, k-1).map(c => [first, ...c]), ...combinations(rest, k)];
    }

    function evaluate5(cards) {
        const parsed = cards.map(c => typeof c === 'string' ? parseCard(c) : c);
        const ranks = parsed.map(c => c.rank).sort((a,b) => b-a);
        const suits = parsed.map(c => c.suit);

        const isFlush = suits.every(s => s === suits[0]);

        let isStraight = false, straightHigh = -1;
        const unique = [...new Set(ranks)].sort((a,b) => b-a);
        if (unique.length === 5) {
            if (unique[0] - unique[4] === 4) { isStraight = true; straightHigh = unique[0]; }
            if (unique[0]===12 && unique[1]===3 && unique[2]===2 && unique[3]===1 && unique[4]===0) {
                isStraight = true; straightHigh = 3;
            }
        }

        const counts = {};
        ranks.forEach(r => counts[r] = (counts[r]||0)+1);
        const groups = Object.entries(counts)
            .map(([r,c]) => ({rank:+r, count:c}))
            .sort((a,b) => b.count-a.count || b.rank-a.rank);

        let handRank, tiebreakers;

        if (isStraight && isFlush) {
            handRank = straightHigh === 12 ? 9 : 8;
            tiebreakers = [straightHigh];
        } else if (groups[0].count === 4) {
            handRank = 7;
            tiebreakers = [groups[0].rank, groups[1].rank];
        } else if (groups[0].count === 3 && groups[1].count === 2) {
            handRank = 6;
            tiebreakers = [groups[0].rank, groups[1].rank];
        } else if (isFlush) {
            handRank = 5;
            tiebreakers = [...ranks];
        } else if (isStraight) {
            handRank = 4;
            tiebreakers = [straightHigh];
        } else if (groups[0].count === 3) {
            handRank = 3;
            tiebreakers = [groups[0].rank, ...groups.filter(g=>g.count===1).map(g=>g.rank).sort((a,b)=>b-a)];
        } else if (groups[0].count === 2 && groups[1] && groups[1].count === 2) {
            handRank = 2;
            const pairs = groups.filter(g=>g.count===2).map(g=>g.rank).sort((a,b)=>b-a);
            tiebreakers = [...pairs, groups.find(g=>g.count===1).rank];
        } else if (groups[0].count === 2) {
            handRank = 1;
            tiebreakers = [groups[0].rank, ...groups.filter(g=>g.count===1).map(g=>g.rank).sort((a,b)=>b-a)];
        } else {
            handRank = 0;
            tiebreakers = [...ranks];
        }

        return { handRank, handName: HAND_NAMES[handRank], tiebreakers, cards: parsed };
    }

    function evaluateBest(cardStrings) {
        if (cardStrings.length <= 5) return evaluate5(cardStrings);
        const combos = combinations(cardStrings, 5);
        let best = null;
        for (const combo of combos) {
            const result = evaluate5(combo);
            if (!best || compareResults(result, best) > 0) best = result;
        }
        return best;
    }

    function compareResults(a, b) {
        if (a.handRank !== b.handRank) return a.handRank - b.handRank;
        for (let i = 0; i < Math.min(a.tiebreakers.length, b.tiebreakers.length); i++) {
            if (a.tiebreakers[i] !== b.tiebreakers[i]) return a.tiebreakers[i] - b.tiebreakers[i];
        }
        return 0;
    }

    function createDeck() {
        const deck = [];
        for (let s = 0; s < 4; s++)
            for (let r = 0; r < 13; r++)
                deck.push(cardToString(r, s));
        return deck;
    }

    function shuffle(arr) {
        for (let i = arr.length-1; i > 0; i--) {
            const j = Math.floor(Math.random()*(i+1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function calculateEquity(holeCards, communityCards, numOpponents, iterations = 1500) {
        const known = [...holeCards, ...communityCards];
        const remaining = createDeck().filter(c => !known.includes(c));
        let wins = 0, ties = 0;

        for (let i = 0; i < iterations; i++) {
            const shuffled = shuffle([...remaining]);
            let idx = 0;
            const board = [...communityCards];
            while (board.length < 5) board.push(shuffled[idx++]);

            const opponents = [];
            for (let o = 0; o < numOpponents; o++)
                opponents.push([shuffled[idx++], shuffled[idx++]]);

            const myHand = evaluateBest([...holeCards, ...board]);
            let best = true, tied = false;
            for (const opp of opponents) {
                const cmp = compareResults(myHand, evaluateBest([...opp, ...board]));
                if (cmp < 0) { best = false; break; }
                if (cmp === 0) tied = true;
            }
            if (best && !tied) wins++;
            else if (best && tied) ties++;
        }

        return {
            winPct: Math.round((wins/iterations)*100),
            tiePct: Math.round((ties/iterations)*100),
            equity: Math.round(((wins + ties*0.5)/iterations)*100)
        };
    }

    function calculateOuts(holeCards, communityCards) {
        if (communityCards.length >= 5) return { outs: 0, cards: [] };
        const known = [...holeCards, ...communityCards];
        const current = evaluateBest(known);
        const remaining = createDeck().filter(c => !known.includes(c));
        const outCards = [];
        for (const card of remaining) {
            if (evaluateBest([...known, card]).handRank > current.handRank) outCards.push(card);
        }
        return { outs: outCards.length, cards: outCards };
    }

    function preflopStrength(cards) {
        const parsed = cards.map(c => typeof c === 'string' ? parseCard(c) : c);
        const ranks = parsed.map(c => c.rank).sort((a,b) => b-a);
        if (parsed.length === 2) {
            const suited = parsed[0].suit === parsed[1].suit;
            const gap = ranks[0] - ranks[1];
            const isPair = ranks[0] === ranks[1];
            if (isPair) return 0.5 + ranks[0] * 0.04;
            let score = (ranks[0] + ranks[1]) * 0.018;
            if (gap <= 1) score += 0.1;
            else if (gap <= 2) score += 0.05;
            if (suited) score += 0.08;
            if (ranks[0] >= 10) score += 0.08;
            return Math.min(1, score);
        }
        // Omaha preflop (4 cards)
        return preflopStrengthOmaha(parsed);
    }

    function preflopStrengthOmaha(parsed) {
        let score = 0;
        const ranks = parsed.map(c => c.rank);
        const suits = parsed.map(c => c.suit);
        // High card value
        score += ranks.reduce((s,r) => s + r, 0) * 0.005;
        // Pairs bonus
        for (let i = 0; i < 4; i++)
            for (let j = i+1; j < 4; j++)
                if (ranks[i] === ranks[j]) score += 0.08 + ranks[i] * 0.005;
        // Suited combos
        for (let i = 0; i < 4; i++)
            for (let j = i+1; j < 4; j++)
                if (suits[i] === suits[j]) score += 0.06;
        // Connectivity
        const sorted = [...ranks].sort((a,b) => a-b);
        for (let i = 0; i < 3; i++)
            if (sorted[i+1] - sorted[i] <= 2) score += 0.04;
        // Low potential (for hi-lo): cards 8 or below (rank<=6) or aces
        const lowCards = ranks.filter(r => r <= 6 || r === 12).length;
        if (lowCards >= 3) score += 0.06;
        // Aces
        if (ranks.includes(12)) score += 0.1;
        return Math.min(1, score);
    }

    // === OMAHA EVALUATION ===
    // Must use exactly 2 hole cards + exactly 3 community cards
    function evaluateOmaha(holeCards, communityCards) {
        if (communityCards.length < 3) {
            // Not enough community cards yet, return best from hole cards alone
            return evaluateBest(holeCards);
        }
        const holeCombos = combinations(holeCards, 2);   // C(4,2) = 6
        const boardCombos = combinations(communityCards, 3); // C(5,3) = 10
        let best = null;
        for (const hole of holeCombos) {
            for (const board of boardCombos) {
                const hand = evaluate5([...hole, ...board]);
                if (!best || compareResults(hand, best) > 0) best = hand;
            }
        }
        return best;
    }

    // Omaha equity (Monte Carlo) - deals 4 hole cards to opponents
    function calculateOmahaEquity(holeCards, communityCards, numOpponents, iterations = 800) {
        const known = [...holeCards, ...communityCards];
        const remaining = createDeck().filter(c => !known.includes(c));
        let wins = 0, ties = 0;
        for (let i = 0; i < iterations; i++) {
            const shuffled = shuffle([...remaining]);
            let idx = 0;
            const board = [...communityCards];
            while (board.length < 5) board.push(shuffled[idx++]);
            const opponents = [];
            for (let o = 0; o < numOpponents; o++)
                opponents.push([shuffled[idx++], shuffled[idx++], shuffled[idx++], shuffled[idx++]]);
            const myHand = evaluateOmaha(holeCards, board);
            let best = true, tied = false;
            for (const opp of opponents) {
                const cmp = compareResults(myHand, evaluateOmaha(opp, board));
                if (cmp < 0) { best = false; break; }
                if (cmp === 0) tied = true;
            }
            if (best && !tied) wins++;
            else if (best && tied) ties++;
        }
        return {
            winPct: Math.round((wins/iterations)*100),
            tiePct: Math.round((ties/iterations)*100),
            equity: Math.round(((wins + ties*0.5)/iterations)*100)
        };
    }

    // Omaha outs (cards that improve hand rank)
    function calculateOmahaOuts(holeCards, communityCards) {
        if (communityCards.length >= 5) return { outs: 0, cards: [] };
        const known = [...holeCards, ...communityCards];
        const current = evaluateOmaha(holeCards, communityCards);
        const remaining = createDeck().filter(c => !known.includes(c));
        const outCards = [];
        for (const card of remaining) {
            if (evaluateOmaha(holeCards, [...communityCards, card]).handRank > current.handRank) outCards.push(card);
        }
        return { outs: outCards.length, cards: outCards };
    }

    // === LOW HAND EVALUATION (8 or better) ===
    // Used for Omaha Hi-Lo. Must use exactly 2 hole + 3 board.
    // Returns sorted low values (descending) or null if no qualifying low.
    function evaluateOmahaLow(holeCards, communityCards) {
        if (communityCards.length < 3) return null;
        const holeCombos = combinations(holeCards, 2);
        const boardCombos = combinations(communityCards, 3);
        let bestLow = null;
        for (const hole of holeCombos) {
            for (const board of boardCombos) {
                const low = makeLowHand([...hole, ...board]);
                if (low && (!bestLow || compareLow(low, bestLow) < 0)) bestLow = low;
            }
        }
        return bestLow;
    }

    function makeLowHand(cardStrings) {
        const parsed = cardStrings.map(c => typeof c === 'string' ? parseCard(c) : c);
        // Map to low values: A=1, 2=2, 3=3, ..., 8=8. 9+ don't qualify.
        const lowVals = parsed.map(c => c.rank === 12 ? 1 : c.rank + 2);
        if (lowVals.some(v => v > 8)) return null;
        if (new Set(lowVals).size < 5) return null; // no pairs allowed
        return [...lowVals].sort((a,b) => b - a);
    }

    // Compare low hands. Lower is better. Returns <0 if a is better.
    function compareLow(a, b) {
        for (let i = 0; i < 5; i++) {
            if (a[i] !== b[i]) return a[i] - b[i];
        }
        return 0;
    }

    function lowToString(low) {
        if (!low) return null;
        const names = {1:'A',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8'};
        return low.map(v => names[v]).join('-');
    }

    return {
        parseCard, cardToString, evaluate5, evaluateBest, compareResults,
        createDeck, shuffle, calculateEquity, calculateOuts, preflopStrength,
        evaluateOmaha, calculateOmahaEquity, calculateOmahaOuts,
        evaluateOmahaLow, compareLow, lowToString,
        RANK_NAMES, SUIT_SYMBOLS, HAND_NAMES,
    };
})();
