// js/pages/FortunePool.js
// V11.0 — Fortune Pool Complete Redesign
// Unified play screen, V9 contract alignment, pending game recovery
//
// V11.0 Changes:
// - Consolidated 6 phases → 4 (play, processing, waiting, result)
// - Fixed getCommitmentStatus → getGameStatus (V9)
// - Fixed getCommitment → getGame (V9)
// - Correct tier data: Jackpot 75x/1-100, Combo 93x max
// - Quick Play (one-tap random game)
// - Pending game recovery from localStorage
// - Animated result reveal (numbers land one-by-one)
// - Inline wager on play screen (no separate wager phase)

import { State } from '../state.js';
import { loadUserData, API_ENDPOINTS } from '../modules/data.js';
import { formatBigNumber } from '../utils.js';
import { showToast, openModal, closeModal } from '../ui-feedback.js';
import { addresses } from '../config.js';
import { FortuneTx } from '../modules/transactions/index.js';
import { calculateFeeClientSide } from '../modules/core/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const EXPLORER_ADDRESS = "https://sepolia.arbiscan.io/address/";
const FORTUNE_POOL_ADDRESS = addresses?.fortunePool || "0x277dB00d533Bbc0fc267bbD954640aDA38ee6B37";
const TIGER_IMAGE = "./assets/fortune.png";
const SHARE_POINTS = 1000;
const ESTIMATED_BLOCK_TIME = 250; // ~250ms per Arbitrum block
const REVEAL_CHECK_MS = 3000;

// Multi-language share texts
const MODAL_UI = {
    pt: { title: 'Compartilhe & Ganhe!', subtitle: `+${SHARE_POINTS} pontos para o Airdrop`, later: 'Talvez depois' },
    en: { title: 'Share & Earn!', subtitle: `+${SHARE_POINTS} points for Airdrop`, later: 'Maybe later' },
    es: { title: '¡Comparte y Gana!', subtitle: `+${SHARE_POINTS} puntos para el Airdrop`, later: 'Quizás después' }
};

const SHARE_TEXTS = {
    pt: {
        win: (prize) => `🎉 Ganhei ${prize.toLocaleString()} BKC no Fortune Pool!\n\n🐯 Loteria on-chain com resultados instantâneos!\n\n👉 https://backcoin.org\n\n@backcoin #Backcoin #Web3 #Arbitrum`,
        lose: `🐯 Jogando Fortune Pool no @backcoin!\n\nLoteria on-chain verificável!\n\n👉 https://backcoin.org\n\n#Backcoin #Web3 #Arbitrum`
    },
    en: {
        win: (prize) => `🎉 Just won ${prize.toLocaleString()} BKC on Fortune Pool!\n\n🐯 On-chain lottery with instant results!\n\n👉 https://backcoin.org\n\n@backcoin #Backcoin #Web3 #Arbitrum`,
        lose: `🐯 Playing Fortune Pool on @backcoin!\n\nVerifiable on-chain lottery!\n\n👉 https://backcoin.org\n\n#Backcoin #Web3 #Arbitrum`
    },
    es: {
        win: (prize) => `🎉 ¡Gané ${prize.toLocaleString()} BKC en Fortune Pool!\n\n🐯 ¡Lotería on-chain con resultados instantáneos!\n\n👉 https://backcoin.org\n\n@backcoin #Backcoin #Web3 #Arbitrum`,
        lose: `🐯 ¡Jugando Fortune Pool en @backcoin!\n\nLotería on-chain verificable!\n\n👉 https://backcoin.org\n\n#Backcoin #Web3 #Arbitrum`
    }
};

const FLAG_IMAGES = {
    pt: './assets/pt.png',
    en: './assets/en.png',
    es: './assets/es.png'
};

let currentLang = 'en';

// Tier definitions — match V9 contract exactly
const TIERS = [
    {
        id: 0, name: "Easy", emoji: "🍀", range: 4, multiplier: 3, chance: "25%",
        color: "emerald", hex: "#10b981",
        bgFrom: "from-emerald-500/20", bgTo: "to-green-600/10",
        borderColor: "border-emerald-500/50", textColor: "text-emerald-400"
    },
    {
        id: 1, name: "Medium", emoji: "⚡", range: 20, multiplier: 15, chance: "5%",
        color: "violet", hex: "#8b5cf6",
        bgFrom: "from-violet-500/20", bgTo: "to-purple-600/10",
        borderColor: "border-violet-500/50", textColor: "text-violet-400"
    },
    {
        id: 2, name: "Hard", emoji: "👑", range: 100, multiplier: 75, chance: "1%",
        color: "amber", hex: "#f59e0b",
        bgFrom: "from-amber-500/20", bgTo: "to-orange-600/10",
        borderColor: "border-amber-500/50", textColor: "text-amber-400"
    }
];

// Derived constants from TIERS (not hardcoded)
const COMBO_MAX_MULTIPLIER = TIERS.reduce((sum, t) => sum + t.multiplier, 0); // 93
const JACKPOT_MULTIPLIER = TIERS[2].multiplier; // 75
const JACKPOT_RANGE = TIERS[2].range; // 100

// Combo win probability: chance of matching at least 1 tier
// = 1 - (1-0.25) × (1-0.05) × (1-0.01) ≈ 29.5%
const COMBO_WIN_CHANCE = 1 - TIERS.reduce((miss, t) => miss * (1 - 1 / t.range), 1);
const COMBO_WIN_PCT = (COMBO_WIN_CHANCE * 100).toFixed(0); // "29"
const COMBO_BOOST_VS_EASY = Math.round(((COMBO_WIN_CHANCE - 1 / TIERS[0].range) / (1 / TIERS[0].range)) * 100); // ~18

// ============================================================================
// GAME STATE
// ============================================================================
const Game = {
    mode: 'combo',        // 'easy' | 'medium' | 'hard' | 'combo'
    phase: 'play',        // 'play' | 'processing' | 'waiting' | 'result'
    guess: 2,             // Single guess (easy/jackpot)
    guesses: [2, 5, 50],  // Combo guesses
    comboStep: 0,         // Current combo picker step (0-2)
    wager: 10,
    gameId: null,
    result: null,
    txHash: null,
    poolStatus: null,
    history: [],
    serviceFee: 0n,
    serviceFee1x: 0n,
    serviceFee5x: 0n,
    tiersData: null,
    commitment: {
        hash: null,
        userSecret: null,
        commitBlock: null,
        commitTxHash: null,
        revealDelay: 5,
        waitStartTime: null,
        canReveal: false
    }
};

let revealCheckInterval = null;

// Helper: get mode configuration (tiers, tierMask, multiplier)
function getModeConfig(mode) {
    switch(mode) {
        case 'easy':   return { tiers: [TIERS[0]], tierMask: 1, multi: TIERS[0].multiplier, isSingle: true };
        case 'medium': return { tiers: [TIERS[1]], tierMask: 2, multi: TIERS[1].multiplier, isSingle: true };
        case 'hard':   return { tiers: [TIERS[2]], tierMask: 4, multi: TIERS[2].multiplier, isSingle: true };
        case 'combo':  return { tiers: TIERS, tierMask: 7, multi: COMBO_MAX_MULTIPLIER, isSingle: false };
        default:       return { tiers: [TIERS[0]], tierMask: 1, multi: TIERS[0].multiplier, isSingle: true };
    }
}

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('fortune-styles-v11')) return;

    const style = document.createElement('style');
    style.id = 'fortune-styles-v11';
    style.textContent = `
        /* Tiger Animations */
        @keyframes tiger-float {
            0%, 100% { transform: translateY(0) rotate(-2deg); }
            50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes tiger-pulse {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(249,115,22,0.3)); }
            50% { filter: drop-shadow(0 0 40px rgba(249,115,22,0.6)); }
        }
        @keyframes tiger-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        @keyframes tiger-celebrate {
            0%, 100% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-10deg); }
            50% { transform: scale(1.1) rotate(10deg); }
            75% { transform: scale(1.15) rotate(-5deg); }
        }
        .tiger-float { animation: tiger-float 4s ease-in-out infinite; }
        .tiger-pulse { animation: tiger-pulse 2s ease-in-out infinite; }
        .tiger-spin { animation: tiger-spin 1s linear infinite; }
        .tiger-celebrate { animation: tiger-celebrate 0.8s ease-out infinite; }

        /* Hide number input arrows */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type="number"] { -moz-appearance: textfield; }

        /* Slot spin */
        @keyframes slot-spin {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
        }
        .slot-spin { animation: slot-spin 0.1s linear infinite; }

        /* Number reveal */
        @keyframes number-reveal {
            0% { transform: scale(0) rotate(-180deg); opacity: 0; }
            50% { transform: scale(1.3) rotate(10deg); }
            70% { transform: scale(0.9) rotate(-5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .number-reveal { animation: number-reveal 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }

        /* Match/Miss */
        @keyframes match-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            50% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .match-pulse { animation: match-pulse 0.8s ease-out 3; }
        @keyframes miss-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
        }
        .miss-shake { animation: miss-shake 0.5s ease-out; }

        /* Glow pulse */
        @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 20px var(--glow-color, rgba(249,115,22,0.3)); }
            50% { box-shadow: 0 0 40px var(--glow-color, rgba(249,115,22,0.6)); }
        }
        .glow-pulse { animation: glow-pulse 1s ease-in-out infinite; }

        /* Progress bar shimmer */
        @keyframes progress-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        @keyframes progress-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.75; }
        }
        .progress-animate {
            background: linear-gradient(90deg, #10b981, #f59e0b, #ea580c, #f59e0b, #10b981) !important;
            background-size: 200% 100% !important;
            animation: progress-shimmer 2s linear infinite, progress-pulse 1.5s ease-in-out infinite;
        }

        /* Confetti */
        @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti {
            position: fixed;
            pointer-events: none;
            animation: confetti-fall 3s ease-out forwards;
            z-index: 9999;
        }
        .confetti-container {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 9999;
        }

        /* Coin rain */
        @keyframes coin-fall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .coin {
            position: fixed; font-size: 24px; pointer-events: none;
            animation: coin-fall 3s ease-out forwards; z-index: 9999;
        }

        /* Slider */
        .fortune-slider {
            -webkit-appearance: none;
            height: 8px; border-radius: 4px; background: #27272a;
        }
        .fortune-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px; height: 24px; border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            cursor: pointer; box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
        }
        .fortune-slider::-moz-range-thumb {
            width: 24px; height: 24px; border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            cursor: pointer; border: none;
        }

        /* Waiting dots */
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
        .waiting-dots::after { content: ''; animation: dots 1.5s infinite; }

        /* Waiting phase */
        @keyframes countdown-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
        .countdown-pulse { animation: countdown-pulse 1s ease-in-out infinite; }
        @keyframes waiting-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
            50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
        }
        .waiting-glow { animation: waiting-glow 2s ease-in-out infinite; }
        @keyframes hourglass-spin {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
            100% { transform: rotate(360deg); }
        }
        .hourglass-spin { animation: hourglass-spin 2s ease-in-out infinite; }

        /* Processing pulse */
        @keyframes processing-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.98); }
        }
        .processing-pulse { animation: processing-pulse 1.5s ease-in-out infinite; }

        /* Prize pool glow */
        @keyframes prize-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.15), inset 0 0 30px rgba(245, 158, 11, 0.05); }
            50% { box-shadow: 0 0 35px rgba(245, 158, 11, 0.3), inset 0 0 40px rgba(245, 158, 11, 0.1); }
        }
        .prize-glow { animation: prize-glow 3s ease-in-out infinite; }

        /* Tab active indicator */
        .tab-active {
            border-bottom: 3px solid #f59e0b;
            color: #f59e0b !important;
        }

        /* Reel land animation */
        @keyframes reel-land {
            0% { transform: translateY(-300%); opacity: 0; }
            60% { transform: translateY(10%); opacity: 1; }
            80% { transform: translateY(-5%); }
            100% { transform: translateY(0); opacity: 1; }
        }
        .reel-land { animation: reel-land 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN RENDER
// ============================================================================
function render() {
    injectStyles();

    const app = document.getElementById('actions');
    if (!app) {
        console.error("[FortunePool] Container #actions not found!");
        return;
    }

    app.innerHTML = `
        <div class="max-w-md mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-5">
                <div class="relative inline-block">
                    <img id="tiger-mascot" src="${TIGER_IMAGE}"
                         class="w-24 h-24 object-contain mx-auto tiger-float tiger-pulse"
                         alt="Fortune Tiger"
                         onerror="this.style.display='none'; document.getElementById('tiger-fallback').style.display='flex';">
                    <div id="tiger-fallback" class="hidden items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/10 border border-orange-500/30 mx-auto">
                        <span class="text-5xl">🐯</span>
                    </div>
                </div>
                <h1 class="text-2xl font-bold text-white mt-2">Fortune Pool</h1>
                <p class="text-zinc-500 text-sm mt-1">On-chain Lottery &bull; Verifiable Randomness</p>

                <!-- Contract link -->
                <div class="flex items-center justify-center mt-3">
                    <a href="${EXPLORER_ADDRESS}${FORTUNE_POOL_ADDRESS}" target="_blank" rel="noopener"
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition-colors">
                        <i class="fa-solid fa-file-contract text-amber-400 text-[10px]"></i>
                        <span class="text-amber-400 text-[10px] font-medium">Game Contract</span>
                        <i class="fa-solid fa-external-link text-amber-400/50 text-[8px]"></i>
                    </a>
                </div>
            </div>

            <!-- Prize Pool Banner -->
            <div class="bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-amber-900/30 border border-amber-500/30 rounded-2xl p-4 mb-5 prize-glow text-center">
                <p class="text-xs text-amber-400/70 uppercase tracking-wider mb-1">Prize Pool</p>
                <p id="prize-pool" class="text-3xl font-black text-amber-400">--</p>
                <div class="flex items-center justify-center gap-6 mt-2">
                    <div class="text-center">
                        <p class="text-[10px] text-zinc-500">Your Balance</p>
                        <p id="user-balance" class="text-sm font-bold text-white">--</p>
                    </div>
                    <div class="w-px h-6 bg-zinc-700"></div>
                    <div class="text-center">
                        <p class="text-[10px] text-zinc-500">Total Games</p>
                        <p id="total-games" class="text-sm font-bold text-zinc-300">--</p>
                    </div>
                </div>
            </div>

            <!-- Game Area -->
            <div id="game-area" class="mb-5"></div>

            <!-- History -->
            <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
                <div class="flex items-center justify-between p-3 border-b border-zinc-800/50">
                    <span class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-paw text-orange-500 text-xs"></i>
                        Recent Games
                    </span>
                    <span id="win-rate" class="text-xs text-zinc-500"></span>
                </div>
                <div id="history-list" class="max-h-[300px] overflow-y-auto p-2">
                    <div class="p-6 text-center text-zinc-600 text-sm">
                        <img src="${TIGER_IMAGE}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    `;

    loadPoolData();
    checkPendingGame();
    if (Game.phase === 'play') renderPhase();
}

function cleanup() {
    if (revealCheckInterval) {
        clearInterval(revealCheckInterval);
        revealCheckInterval = null;
    }
    Game.phase = 'play';
    Game.result = null;
    Game._balanceLoaded = false;
    Game.commitment = {
        hash: null, userSecret: null, commitBlock: null, commitTxHash: null,
        revealDelay: Game.commitment.revealDelay || 5,
        waitStartTime: null, canReveal: false
    };
}

// ============================================================================
// PENDING GAME RECOVERY
// ============================================================================

/**
 * Try to find and recover an active game when contract rejects new commit.
 * Searches localStorage first, then queries contract for recent games.
 */
async function tryRecoverActiveGame() {
    if (!State.userAddress) return;

    // First try localStorage
    const stored = JSON.parse(localStorage.getItem('fortune_pending_games') || '{}');
    const pending = Object.entries(stored).find(([, g]) =>
        g.player?.toLowerCase() === State.userAddress?.toLowerCase() && !g.revealed
    );

    if (pending) {
        const [gameId, data] = pending;
        console.log('[FortunePool] Recovering active game from localStorage:', gameId);

        // Check if game is still active on-chain before recovering
        try {
            if (State.fortunePoolContractPublic) {
                const status = await State.fortunePoolContractPublic.getGameStatus(Number(gameId));
                const gameStatus = Number(status.status);
                if (gameStatus === 0 || gameStatus === 3) {
                    // Game expired or doesn't exist — clean up
                    console.log('[FortunePool] Game', gameId, 'is expired on-chain, clearing');
                    delete stored[gameId];
                    localStorage.setItem('fortune_pending_games', JSON.stringify(stored));
                    showToast('Previous game expired. Start a new one!', 'info');
                    Game.phase = 'play';
                    renderPhase();
                    return;
                }
            }
        } catch {}

        Game.gameId = Number(gameId);
        Game.commitment.userSecret = data.userSecret;
        Game.mode = data.tierMask === 1 ? 'easy' : data.tierMask === 2 ? 'medium' : data.tierMask === 4 ? 'hard' : 'combo';
        Game.guesses = data.guesses || [2, 5, 50];
        Game.guess = data.guesses?.[0] || (Game.mode === 'hard' ? 50 : Game.mode === 'medium' ? 5 : 2);
        Game.commitment.waitStartTime = data.commitTimestamp || Date.now();
        Game.commitment.canReveal = true;
        Game.phase = 'waiting';
        renderQuickReveal();
        pollCanRevealThenReveal();
        return;
    }

    // No localStorage data — inform user
    showToast('You have an active game but recovery data was lost. Wait ~50s for it to expire, then try again.', 'error');
    Game.phase = 'play';
    renderPhase();
}

async function checkPendingGame() {
    if (!State.userAddress) return;

    try {
        const stored = JSON.parse(localStorage.getItem('fortune_pending_games') || '{}');
        const pending = Object.entries(stored).find(([, g]) =>
            g.player?.toLowerCase() === State.userAddress?.toLowerCase() && !g.revealed
        );
        if (pending) {
            const [gameId, data] = pending;
            console.log('[FortunePool] Recovering pending game:', gameId);

            // Check if game is still active on-chain
            try {
                if (State.fortunePoolContractPublic) {
                    const status = await State.fortunePoolContractPublic.getGameStatus(Number(gameId));
                    const gameStatus = Number(status.status);
                    if (gameStatus === 0 || gameStatus === 3) {
                        console.log('[FortunePool] Pending game', gameId, 'is expired, clearing');
                        delete stored[gameId];
                        localStorage.setItem('fortune_pending_games', JSON.stringify(stored));
                        showToast('Previous game expired. Start a new one!', 'info');
                        return; // Stay on play phase
                    }
                }
            } catch {}

            Game.gameId = data.gameId || Number(gameId);
            Game.commitment.userSecret = data.userSecret;
            Game.mode = data.tierMask === 1 ? 'easy' : data.tierMask === 2 ? 'medium' : data.tierMask === 4 ? 'hard' : 'combo';
            Game.guesses = data.guesses || [2, 5, 50];
            Game.guess = data.guesses?.[0] || (Game.mode === 'hard' ? 50 : Game.mode === 'medium' ? 5 : 2);
            Game.wager = data.wagerAmount ? Number(window.ethers?.formatEther(BigInt(data.wagerAmount)) || 10) : 10;
            Game.commitment.waitStartTime = data.commitTimestamp || Date.now();
            Game.commitment.canReveal = false;
            Game.phase = 'waiting';
            renderPhase();
            startRevealCheck();
        }
    } catch (e) {
        console.warn('[FortunePool] Pending game recovery failed:', e);
    }
}

function clearStuckGame() {
    // Remove from localStorage
    try {
        const stored = JSON.parse(localStorage.getItem('fortune_pending_games') || '{}');
        if (Game.gameId && stored[Game.gameId]) {
            delete stored[Game.gameId];
            localStorage.setItem('fortune_pending_games', JSON.stringify(stored));
        }
    } catch {}
    // Reset game state
    Game.phase = 'play';
    Game.gameId = null;
    Game.commitment = { hash: null, userSecret: null, commitBlock: null, commitTxHash: null, revealDelay: 5, waitStartTime: null, canReveal: false };
    autoRevealAttempt = 0;
    showToast('Previous game expired. Start a new one!', 'info');
    renderPhase();
}

// ============================================================================
// PHASE ROUTER
// ============================================================================
function renderPhase() {
    const area = document.getElementById('game-area');
    if (!area) return;

    updateTigerAnimation(Game.phase);

    switch (Game.phase) {
        case 'play': renderPlay(area); break;
        case 'processing': renderProcessing(area); break;
        case 'waiting': renderWaiting(area); break;
        case 'result': renderResult(area); break;
        default: renderPlay(area);
    }
}

function updateTigerAnimation(phase) {
    const tiger = document.getElementById('tiger-mascot');
    if (!tiger) return;

    tiger.className = 'w-24 h-24 object-contain mx-auto';
    tiger.style.filter = '';

    switch (phase) {
        case 'play':
            tiger.classList.add('tiger-float', 'tiger-pulse');
            break;
        case 'processing':
            tiger.classList.add('tiger-spin');
            break;
        case 'waiting':
            tiger.classList.add('tiger-float');
            tiger.style.filter = 'hue-rotate(270deg)';
            break;
        case 'result':
            if (Game.result?.prizeWon > 0) {
                tiger.classList.add('tiger-celebrate');
            } else {
                tiger.style.filter = 'grayscale(0.5)';
                tiger.classList.add('tiger-float');
            }
            break;
    }
}

// ============================================================================
// PLAY PHASE — Difficulty tabs + number picker + wager
// ============================================================================
function renderPlay(container) {
    const balanceNum = formatBigNumber(State.currentUserBalance || 0n);
    const hasBalance = balanceNum >= 1;
    const canPlay = hasBalance && State.isConnected;
    const cfg = getModeConfig(Game.mode);
    const isCombo = Game.mode === 'combo';
    const tier = isCombo ? null : cfg.tiers[0];

    // Default wager to 50% of balance (induce bigger bets)
    if (!Game._wagerInit && balanceNum >= 2) {
        Game.wager = Math.max(10, Math.floor(balanceNum / 2));
        Game._wagerInit = true;
    }
    if (Game.wager > balanceNum && balanceNum > 0) Game.wager = Math.floor(balanceNum);

    // Cumulative win probabilities
    const winRate = isCombo ? COMBO_WIN_CHANCE : (1 / cfg.tiers[0].range);
    const pct1 = (winRate * 100).toFixed(0);
    const pct3 = ((1 - Math.pow(1 - winRate, 3)) * 100).toFixed(0);
    const pct5 = ((1 - Math.pow(1 - winRate, 5)) * 100).toFixed(0);

    // Wager presets — % of balance
    const half = Math.max(1, Math.floor(balanceNum / 2));
    const quarter = Math.max(1, Math.floor(balanceNum / 4));
    const tenth = Math.max(1, Math.floor(balanceNum / 10));
    const maxBal = Math.max(1, Math.floor(balanceNum));

    container.innerHTML = `
        <div class="space-y-4">
            <!-- Difficulty Tabs -->
            <div class="grid grid-cols-3 gap-1 bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-1.5">
                ${['easy', 'medium', 'hard'].map(mode => {
                    const t = TIERS[mode === 'easy' ? 0 : mode === 'medium' ? 1 : 2];
                    const active = Game.mode === mode;
                    return `
                        <button class="mode-tab py-2.5 rounded-xl text-center transition-all ${active ?
                            `bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border ${t.borderColor} shadow-lg` :
                            'hover:bg-zinc-800/50 border border-transparent'}" data-mode="${mode}">
                            <p class="text-sm font-bold ${active ? t.textColor : 'text-zinc-500'}">${t.emoji} ${t.name}</p>
                            <p class="text-[10px] ${active ? t.textColor + ' opacity-80' : 'text-zinc-600'}">${t.multiplier}x &bull; ${t.chance}</p>
                        </button>
                    `;
                }).join('')}
            </div>

            ${!isCombo ? `
                <!-- Number Picker -->
                <div class="bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border ${tier.borderColor} rounded-2xl p-5">
                    <div class="text-center mb-4">
                        <p class="${tier.textColor} font-bold text-lg mb-1">Pick a Number <span class="text-sm opacity-70">(1-${tier.range})</span></p>
                        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded-full">
                            <span class="text-sm ${tier.textColor} font-black">${tier.multiplier}x</span>
                            <span class="text-zinc-500 text-xs">&bull;</span>
                            <span class="text-sm ${tier.textColor}">${tier.chance} chance</span>
                        </div>
                    </div>
                    <div id="number-picker"></div>
                </div>
            ` : `
                <!-- Combo Mode -->
                <div class="bg-gradient-to-br from-violet-900/20 to-zinc-900 border border-violet-500/30 rounded-2xl p-5">
                    <div class="text-center mb-3">
                        <p class="text-violet-400 font-bold text-lg mb-1">Combo &mdash; All 3 Tiers</p>
                        <p class="text-zinc-400 text-xs">Pick one number per tier &bull; up to <span class="text-violet-400 font-black">${COMBO_MAX_MULTIPLIER}x</span></p>
                        <div class="mt-2 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <p class="text-sm text-emerald-400 font-bold mb-1">~${COMBO_WIN_PCT}% chance of winning</p>
                            <p class="text-[10px] text-emerald-300/70">
                                ${COMBO_BOOST_VS_EASY}% more chance than Easy &bull; Match any tier to win!
                            </p>
                        </div>
                        <div class="mt-2 flex justify-center gap-3">
                            ${TIERS.map(t => `
                                <div class="text-center">
                                    <span class="text-xs">${t.emoji}</span>
                                    <p class="text-[9px] ${t.textColor}">${t.multiplier}x</p>
                                    <p class="text-[8px] text-zinc-500">${t.chance}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div id="picker-area"></div>
                </div>
            `}

            <!-- Wager + Play -->
            <div class="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4">
                <div class="flex items-center justify-between mb-2">
                    <label class="text-sm text-zinc-400"><i class="fa-solid fa-coins text-amber-400 mr-1.5"></i>Wager</label>
                    <span class="text-xs text-zinc-500">Bal: <span id="wager-balance" class="text-amber-400 font-bold">${balanceNum.toFixed(0)}</span> BKC</span>
                </div>

                <div class="flex items-center justify-center gap-2 mb-2">
                    <button id="wager-minus" class="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-red-500/20 border border-zinc-700 text-zinc-400 hover:text-red-400 font-bold text-lg transition-all">&minus;</button>
                    <input type="number" id="custom-wager" value="${Game.wager}" min="1" max="${maxBal}"
                        class="w-24 h-12 text-center text-2xl font-black rounded-lg bg-zinc-900/80 border-2 border-amber-500/50 text-amber-400 focus:outline-none focus:border-amber-400 appearance-none"
                        style="-moz-appearance: textfield;">
                    <button id="wager-plus" class="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-emerald-500/20 border border-zinc-700 text-zinc-400 hover:text-emerald-400 font-bold text-lg transition-all">+</button>
                </div>

                <div class="grid grid-cols-4 gap-1.5 mb-3">
                    ${[
                        { val: tenth, label: '10%' },
                        { val: quarter, label: '25%' },
                        { val: half, label: '50%' },
                        { val: maxBal, label: 'MAX' }
                    ].map(({val, label}) => `
                        <button class="wager-btn py-2 text-xs font-bold rounded-lg transition-all ${Game.wager === val ?
                            'bg-amber-500/25 border border-amber-500/60 text-amber-400' :
                            'bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30'}" data-value="${val}">
                            <span class="block text-[10px] opacity-70">${val.toLocaleString()}</span>
                            <span class="block font-black">${label}</span>
                        </button>
                    `).join('')}
                </div>

                <div class="flex items-center justify-between mb-2 px-1">
                    <p class="text-emerald-400 font-black text-lg" id="potential-win">${(Game.wager * cfg.multi).toLocaleString()} BKC</p>
                    <p class="text-[10px] text-zinc-500">potential win</p>
                </div>

                <!-- Win Probability Stats -->
                <div class="bg-emerald-500/5 rounded-xl p-3 mb-3 border border-emerald-500/10">
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p class="text-emerald-400 font-black text-lg">${pct1}%</p>
                            <p class="text-[9px] text-zinc-500">1 game</p>
                        </div>
                        <div class="border-x border-zinc-800">
                            <p class="text-emerald-400 font-black text-lg">${pct3}%</p>
                            <p class="text-[9px] text-zinc-500">in 3 games</p>
                        </div>
                        <div>
                            <p class="text-emerald-400 font-black text-lg">${pct5}%</p>
                            <p class="text-[9px] text-zinc-500">in 5 games</p>
                        </div>
                    </div>
                    <p class="text-[10px] text-emerald-400/60 text-center mt-1.5">
                        <i class="fa-solid fa-chart-line mr-1"></i>
                        Chance of winning at least once
                    </p>
                </div>

                <button id="btn-play" class="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-bold rounded-xl transition-all text-lg ${!canPlay ? 'opacity-40 cursor-not-allowed' : ''}" ${!canPlay ? 'disabled' : ''}>
                    <i class="fa-solid fa-play mr-2"></i>Play &mdash; ${Game.wager.toLocaleString()} BKC
                </button>

                ${!State.isConnected ? '<p class="text-center text-zinc-500 text-xs mt-2">Connect wallet to play</p>' : ''}
                ${State.isConnected && !hasBalance ? `
                    <button id="btn-faucet" class="w-full mt-2 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition-colors">
                        <i class="fa-solid fa-faucet mr-1"></i>Get Test Tokens
                    </button>
                ` : ''}
            </div>

            <!-- Combo Banner -->
            ${!isCombo ? `
                <div id="toggle-combo" class="cursor-pointer w-full bg-gradient-to-r from-violet-900/30 via-purple-900/20 to-violet-900/30 border border-violet-500/40 rounded-2xl p-4 hover:border-violet-400/60 hover:shadow-lg hover:shadow-violet-500/10 transition-all glow-pulse" style="--glow-color: rgba(139,92,246,0.15)">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-600/20 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
                            <span class="text-2xl">🎰</span>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <p class="text-violet-300 font-bold text-sm">Combo Mode</p>
                                <span class="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded text-[9px] text-emerald-400 font-bold">+${COMBO_BOOST_VS_EASY}% CHANCE</span>
                            </div>
                            <p class="text-violet-400/60 text-xs mt-0.5">Play all 3 tiers at once &bull; ~${COMBO_WIN_PCT}% win chance</p>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <p class="text-violet-400 font-black text-xl">${COMBO_MAX_MULTIPLIER}x</p>
                            <p class="text-violet-400/50 text-[9px]">multiplier</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
                        <p class="text-[10px] text-violet-400/70 flex-shrink-0">
                            <i class="fa-solid fa-arrow-up text-emerald-400 mr-1"></i>
                            ${COMBO_BOOST_VS_EASY}% more chance than Easy alone
                        </p>
                        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
                    </div>
                </div>
            ` : `
                <button id="toggle-combo" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900/40 border border-zinc-800/40 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    <span>Back to single tier</span>
                </button>
            `}
        </div>
    `;

    // Render mode-specific pickers
    if (isCombo) {
        renderPickerInline();
    } else {
        renderNumberPicker(tier);
    }

    setupPlayEvents(cfg.multi, balanceNum);
}

// ============================================================================
// NUMBER PICKER (for single-tier modes: easy, medium, hard)
// ============================================================================
function renderNumberPicker(tier) {
    const area = document.getElementById('number-picker');
    if (!area) return;

    const current = Game.guess;

    if (tier.range <= 5) {
        // Easy: 5 big buttons
        area.innerHTML = `
            <div class="flex justify-center gap-3">
                ${Array.from({length: tier.range}, (_, i) => i + 1).map(n => `
                    <button class="num-pick w-14 h-14 rounded-2xl font-black text-2xl transition-all active:scale-95 ${n === current ?
                        '' : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'}"
                        data-num="${n}"
                        style="${n === current ? `background: ${tier.hex}; color: white; box-shadow: 0 0 15px ${tier.hex}60; transform: scale(1.1)` : ''}">
                        ${n}
                    </button>
                `).join('')}
            </div>
        `;
    } else if (tier.range <= 15) {
        // Medium: grid of 15 buttons
        area.innerHTML = `
            <div class="grid grid-cols-5 gap-2 justify-items-center">
                ${Array.from({length: tier.range}, (_, i) => i + 1).map(n => `
                    <button class="num-pick w-12 h-12 rounded-xl font-bold text-lg transition-all active:scale-95 ${n === current ?
                        '' : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'}"
                        data-num="${n}"
                        style="${n === current ? `background: ${tier.hex}; color: white; box-shadow: 0 0 12px ${tier.hex}60; transform: scale(1.05)` : ''}">
                        ${n}
                    </button>
                `).join('')}
            </div>
        `;
    } else {
        // Hard: slider + input + quick picks
        area.innerHTML = `
            <div class="flex items-center justify-center gap-3 mb-3">
                <button class="np-minus-10 w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xs transition-all border border-zinc-700">-10</button>
                <button class="np-minus w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">&minus;</button>
                <input type="number" id="np-number" min="1" max="${tier.range}" value="${current}"
                    class="w-20 h-20 text-center text-3xl font-black rounded-2xl border-2 text-zinc-900 focus:outline-none appearance-none shadow-lg"
                    style="background: ${tier.hex}; border-color: ${tier.hex}; box-shadow: 0 0 20px ${tier.hex}50; -moz-appearance: textfield;">
                <button class="np-plus w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">+</button>
                <button class="np-plus-10 w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xs transition-all border border-zinc-700">+10</button>
            </div>
            <div class="mb-3 px-1">
                <input type="range" id="np-slider" min="1" max="${tier.range}" value="${current}"
                    class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                    style="background: linear-gradient(to right, ${tier.hex} 0%, ${tier.hex} ${(current / tier.range) * 100}%, #27272a ${(current / tier.range) * 100}%, #27272a 100%)">
                <div class="flex justify-between text-[10px] text-zinc-600 mt-1 px-1">
                    <span>1</span><span>${Math.round(tier.range / 4)}</span><span>${Math.round(tier.range / 2)}</span><span>${Math.round(tier.range * 3 / 4)}</span><span>${tier.range}</span>
                </div>
            </div>
            <div class="flex justify-center gap-1.5 flex-wrap">
                ${[7, 13, 21, 50, 77, 99, 137].map(n => `
                    <button class="np-quick px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-num="${n}">${n}</button>
                `).join('')}
                <button id="np-random" class="px-2 py-1.5 text-xs rounded-lg border transition-all"
                    style="background: ${tier.hex}20; border-color: ${tier.hex}50; color: ${tier.hex}">
                    <i class="fa-solid fa-dice mr-1"></i>Random
                </button>
            </div>
        `;

        const input = document.getElementById('np-number');
        const slider = document.getElementById('np-slider');

        const updateValue = (val) => {
            val = Math.max(1, Math.min(tier.range, val));
            Game.guess = val;
            if (input) input.value = val;
            if (slider) {
                slider.value = val;
                const pct = (val / tier.range) * 100;
                slider.style.background = `linear-gradient(to right, ${tier.hex} 0%, ${tier.hex} ${pct}%, #27272a ${pct}%, #27272a 100%)`;
            }
        };

        input?.addEventListener('input', (e) => updateValue(parseInt(e.target.value) || 1));
        input?.addEventListener('blur', (e) => updateValue(parseInt(e.target.value) || 1));
        slider?.addEventListener('input', (e) => updateValue(parseInt(e.target.value)));
        area.querySelector('.np-minus')?.addEventListener('click', () => updateValue(Game.guess - 1));
        area.querySelector('.np-plus')?.addEventListener('click', () => updateValue(Game.guess + 1));
        area.querySelector('.np-minus-10')?.addEventListener('click', () => updateValue(Game.guess - 10));
        area.querySelector('.np-plus-10')?.addEventListener('click', () => updateValue(Game.guess + 10));
        area.querySelectorAll('.np-quick').forEach(btn => {
            btn.addEventListener('click', () => updateValue(parseInt(btn.dataset.num)));
        });
        document.getElementById('np-random')?.addEventListener('click', () => {
            updateValue(Math.floor(Math.random() * tier.range) + 1);
        });
        return;
    }

    // Wire button click events (for easy/medium grid buttons)
    area.querySelectorAll('.num-pick').forEach(btn => {
        btn.addEventListener('click', () => {
            const num = parseInt(btn.dataset.num);
            Game.guess = num;
            const scale = tier.range <= 5 ? 1.1 : 1.05;
            area.querySelectorAll('.num-pick').forEach(b => {
                const n = parseInt(b.dataset.num);
                if (n === num) {
                    b.style.cssText = `background: ${tier.hex}; color: white; box-shadow: 0 0 15px ${tier.hex}60; transform: scale(${scale})`;
                    b.classList.remove('bg-zinc-800', 'border', 'border-zinc-700', 'text-zinc-300');
                } else {
                    b.style.cssText = '';
                    if (!b.classList.contains('bg-zinc-800')) {
                        b.classList.add('bg-zinc-800', 'border', 'border-zinc-700', 'text-zinc-300');
                    }
                }
            });
        });
    });
}

// Re-render combo picker (called by step navigation)
function renderPickerInline() {
    const area = document.getElementById('picker-area');
    if (!area) return;
    renderComboPickerInline(area);
}

function renderComboPickerInline(container) {
    const tier = TIERS[Game.comboStep];
    const current = Game.guesses[Game.comboStep];

    container.innerHTML = `
        <!-- Step Progress -->
        <div class="flex justify-center gap-2 mb-4">
            ${TIERS.map((t, i) => {
                const isActive = i === Game.comboStep;
                const isDone = i < Game.comboStep;
                return `
                    <button class="combo-step-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${isActive ? `bg-gradient-to-br ${t.bgFrom} ${t.bgTo} ${t.borderColor}` : isDone ? 'bg-emerald-500/10 border-emerald-500/50 cursor-pointer hover:bg-emerald-500/20' : 'bg-zinc-800/50 border-zinc-700/50'}" data-step="${i}">
                        <span class="text-lg">${isDone ? '✓' : t.emoji}</span>
                        <div class="text-left">
                            <p class="text-[10px] font-bold ${isActive ? t.textColor : isDone ? 'text-emerald-400' : 'text-zinc-500'}">${t.name}</p>
                            <p class="text-[8px] ${isDone ? 'text-emerald-400 font-bold' : 'text-zinc-600'}">${isDone ? Game.guesses[i] : t.multiplier + 'x'}</p>
                        </div>
                    </button>
                `;
            }).join('')}
        </div>

        <div class="text-center mb-3">
            <p class="text-zinc-400 text-xs">Pick <span class="text-white font-bold">1-${tier.range}</span> &bull; <span class="text-emerald-400">${tier.chance}</span> &bull; <span class="${tier.textColor} font-bold">${tier.multiplier}x</span></p>
        </div>

        <div id="combo-picker-content"></div>

        <!-- Navigation -->
        <div class="flex gap-2 mt-3">
            <button id="combo-prev" class="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors text-sm">
                <i class="fa-solid fa-arrow-left mr-1"></i>${Game.comboStep > 0 ? 'Prev' : ''}
            </button>
            <button id="combo-next" class="flex-1 py-2.5 ${Game.comboStep < 2 ? `bg-gradient-to-r ${tier.bgFrom.replace('/20', '/40')} ${tier.bgTo.replace('/10', '/30')} border ${tier.borderColor} ${tier.textColor}` : 'bg-gradient-to-r from-emerald-500 to-green-600 border border-emerald-400 text-white'} font-bold rounded-xl transition-all text-sm">
                ${Game.comboStep < 2 ? 'Next <i class="fa-solid fa-arrow-right ml-1"></i>' : `<i class="fa-solid fa-play mr-1"></i>Play — ${Game.wager.toLocaleString()} BKC`}
            </button>
        </div>
    `;

    // Render the picker content for this tier
    const pickerContent = document.getElementById('combo-picker-content');
    if (!pickerContent) return;

    if (tier.range <= 15) {
        // Grid buttons for Easy/Medium
        pickerContent.innerHTML = `
            <div class="flex justify-center gap-2 flex-wrap">
                ${Array.from({length: tier.range}, (_, i) => i + 1).map(n => `
                    <button class="num-btn w-11 h-11 rounded-xl font-bold text-base transition-all ${n === current ? `bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} ${tier.textColor}` : 'bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600'}" data-num="${n}">
                        ${n}
                    </button>
                `).join('')}
            </div>
        `;

        pickerContent.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const num = parseInt(btn.dataset.num);
                Game.guesses[Game.comboStep] = num;
                pickerContent.querySelectorAll('.num-btn').forEach(b => {
                    const n = parseInt(b.dataset.num);
                    b.className = `num-btn w-11 h-11 rounded-xl font-bold text-base transition-all ${n === num ? `bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} ${tier.textColor}` : 'bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600'}`;
                });
            });
        });
    } else {
        // Slider for Hard tier
        pickerContent.innerHTML = `
            <div class="flex items-center justify-center gap-3 mb-3">
                <button class="ch-minus w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">−</button>
                <input type="number" id="combo-input" min="1" max="${tier.range}" value="${current}"
                    class="w-20 h-20 text-center text-3xl font-black rounded-2xl bg-amber-500 border-2 border-amber-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none shadow-lg shadow-amber-500/30"
                    style="-moz-appearance: textfield;">
                <button class="ch-plus w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">+</button>
            </div>
            <div class="mb-2 px-1">
                <input type="range" id="combo-slider" min="1" max="${tier.range}" value="${current}"
                    class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                    style="background: linear-gradient(to right, ${tier.hex} 0%, ${tier.hex} ${(current / tier.range) * 100}%, #27272a ${(current / tier.range) * 100}%, #27272a 100%)">
            </div>
            <div class="flex justify-center gap-1.5 flex-wrap">
                ${[7, 50, 99, 137].map(n => `
                    <button class="ch-quick px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-num="${n}">${n}</button>
                `).join('')}
                <button class="ch-random px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded-lg border border-amber-500/30 transition-all">
                    <i class="fa-solid fa-dice mr-1"></i>Random
                </button>
            </div>
        `;

        const input = document.getElementById('combo-input');
        const slider = document.getElementById('combo-slider');

        const updateVal = (val) => {
            val = Math.max(1, Math.min(tier.range, val));
            Game.guesses[Game.comboStep] = val;
            if (input) input.value = val;
            if (slider) {
                slider.value = val;
                const pct = (val / tier.range) * 100;
                slider.style.background = `linear-gradient(to right, ${tier.hex} 0%, ${tier.hex} ${pct}%, #27272a ${pct}%, #27272a 100%)`;
            }
        };

        input?.addEventListener('input', (e) => updateVal(parseInt(e.target.value) || 1));
        input?.addEventListener('blur', (e) => updateVal(parseInt(e.target.value) || 1));
        slider?.addEventListener('input', (e) => updateVal(parseInt(e.target.value)));
        pickerContent.querySelector('.ch-minus')?.addEventListener('click', () => updateVal(Game.guesses[Game.comboStep] - 1));
        pickerContent.querySelector('.ch-plus')?.addEventListener('click', () => updateVal(Game.guesses[Game.comboStep] + 1));
        pickerContent.querySelectorAll('.ch-quick').forEach(btn => {
            btn.addEventListener('click', () => updateVal(parseInt(btn.dataset.num)));
        });
        pickerContent.querySelector('.ch-random')?.addEventListener('click', () => {
            updateVal(Math.floor(Math.random() * tier.range) + 1);
        });
    }

    // Step navigation (click on step pills to go back)
    container.querySelectorAll('.combo-step-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const step = parseInt(btn.dataset.step);
            if (step < Game.comboStep) {
                Game.comboStep = step;
                renderPickerInline();
            }
        });
    });

    // Prev/Next buttons
    document.getElementById('combo-prev')?.addEventListener('click', () => {
        if (Game.comboStep > 0) {
            Game.comboStep--;
            renderPickerInline();
        }
    });

    document.getElementById('combo-next')?.addEventListener('click', () => {
        if (Game.comboStep < 2) {
            Game.comboStep++;
            renderPickerInline();
        } else {
            commitGame();
        }
    });
}

// ============================================================================
// PLAY EVENTS
// ============================================================================
function setupPlayEvents(maxMulti, balanceNum) {
    // Difficulty tab switching
    document.querySelectorAll('.mode-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const newMode = btn.dataset.mode;
            if (Game.mode !== newMode) {
                Game.mode = newMode;
                const newCfg = getModeConfig(newMode);
                Game.guess = Math.min(Game.guess, newCfg.tiers[0].range);
                renderPhase();
            }
        });
    });

    // Combo toggle
    document.getElementById('toggle-combo')?.addEventListener('click', () => {
        if (Game.mode === 'combo') {
            Game.mode = 'easy';
        } else {
            Game.mode = 'combo';
            Game.comboStep = 0;
        }
        renderPhase();
    });

    // Wager controls
    const updateWager = (amount) => {
        const multi = getModeConfig(Game.mode).multi;
        Game.wager = Math.max(1, Math.min(Math.floor(amount), Math.floor(balanceNum)));

        const customInput = document.getElementById('custom-wager');
        const potentialWin = document.getElementById('potential-win');
        const playBtn = document.getElementById('btn-play');
        if (customInput) customInput.value = Game.wager;
        if (potentialWin) potentialWin.textContent = (Game.wager * multi).toLocaleString() + ' BKC';
        if (playBtn) {
            const btnText = playBtn.querySelector('i') ? '' : '';
            playBtn.innerHTML = `<i class="fa-solid fa-play mr-2"></i>Play — ${Game.wager.toLocaleString()} BKC`;
        }

        document.querySelectorAll('.wager-btn').forEach(btn => {
            const val = parseInt(btn.dataset.value);
            const isActive = Game.wager === val;
            btn.className = `wager-btn py-2 text-xs font-bold rounded-lg transition-all ${isActive ? 'bg-amber-500/25 border border-amber-500/60 text-amber-400' : 'bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30'}`;
        });
    };

    document.querySelectorAll('.wager-btn').forEach(btn => {
        btn.addEventListener('click', () => updateWager(parseInt(btn.dataset.value) || 1));
    });
    document.getElementById('custom-wager')?.addEventListener('input', (e) => updateWager(parseInt(e.target.value) || 1));
    document.getElementById('wager-minus')?.addEventListener('click', () => updateWager(Game.wager - 1));
    document.getElementById('wager-plus')?.addEventListener('click', () => updateWager(Game.wager + 1));

    // Faucet (100% gasless via API)
    document.getElementById('btn-faucet')?.addEventListener('click', async () => {
        showToast('Requesting tokens...', 'info');
        try {
            const res = await fetch(`/api/faucet?address=${State.userAddress}`);
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('Tokens received!', 'success');
                await loadUserData();
                renderPhase();
            } else {
                const msg = data.error || 'Faucet unavailable';
                showToast(msg, msg.toLowerCase().includes('cooldown') ? 'warning' : 'error');
            }
        } catch (e) {
            showToast('Faucet temporarily unavailable', 'error');
        }
    });

    // Quick Play — random numbers + commit immediately
    document.getElementById('btn-quick-play')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        if (Game.wager < 1) return showToast('Min: 1 BKC', 'warning');

        // Randomize numbers based on mode
        if (Game.mode === 'combo') {
            Game.guesses = TIERS.map(t => Math.floor(Math.random() * t.range) + 1);
        } else {
            const cfg = getModeConfig(Game.mode);
            Game.guess = Math.floor(Math.random() * cfg.tiers[0].range) + 1;
        }

        commitGame();
    });

    // Play Now
    document.getElementById('btn-play')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        if (Game.wager < 1) return showToast('Min: 1 BKC', 'warning');
        commitGame();
    });
}

// ============================================================================
// COMMIT GAME
// ============================================================================
async function commitGame() {
    Game.phase = 'processing';
    autoRevealAttempt = 0;
    renderPhase();

    try {
        const cfg = getModeConfig(Game.mode);
        const guesses = cfg.isSingle ? [Game.guess] : Game.guesses;
        const tierMask = cfg.tierMask;
        const wagerWei = window.ethers.parseEther(Game.wager.toString());

        await FortuneTx.playGame({
            wagerAmount: wagerWei,
            guesses: guesses,
            tierMask: tierMask,
            button: document.getElementById('btn-play'),

            onSuccess: (commitData) => {
                Game.gameId = commitData?.gameId || Date.now();
                Game.commitment = {
                    hash: null,
                    userSecret: commitData?.userSecret || null,
                    commitBlock: commitData?.commitBlock || null,
                    commitTxHash: commitData?.txHash || null,
                    revealDelay: Game.commitment.revealDelay || 5,
                    waitStartTime: Date.now(),
                    canReveal: true  // Skip waiting — go straight to reveal
                };
                Game.txHash = commitData?.txHash || null;

                console.log('[FortunePool] Game committed:', Game.gameId, 'Block:', Game.commitment.commitBlock);

                // Quick flow: show animation, poll canReveal, then reveal when ready
                Game.phase = 'waiting';
                renderQuickReveal();
                pollCanRevealThenReveal();
            },

            onError: (error) => {
                if (!error.cancelled) {
                    const msg = error.message || '';
                    const errData = error.original?.data || error.data || msg;
                    // 0xbfec5558 = PlayerHasActiveGame — try to recover pending game
                    if (String(errData).includes('0xbfec5558') || msg.includes('active game')) {
                        showToast('You have a pending game. Attempting to recover...', 'warning');
                        tryRecoverActiveGame();
                        return;
                    }
                    showToast(msg || 'Commit failed', 'error');
                }
                Game.phase = 'play';
                renderPhase();
            }
        });
    } catch (e) {
        console.error('Commit error:', e);
        const msg = e.message || '';
        if (String(e.data || msg).includes('0xbfec5558') || msg.includes('active game')) {
            showToast('You have a pending game. Attempting to recover...', 'warning');
            tryRecoverActiveGame();
            return;
        }
        showToast('Error: ' + (msg || 'Transaction failed'), 'error');
        Game.phase = 'play';
        renderPhase();
    }
}

// ============================================================================
// PROCESSING PHASE
// ============================================================================
function renderProcessing(container) {
    const cfg = getModeConfig(Game.mode);
    const picks = cfg.isSingle ? [Game.guess] : Game.guesses;
    const tiersToShow = cfg.tiers;

    container.innerHTML = `
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 processing-pulse">
            <div class="text-center mb-6">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
                    <i class="fa-solid fa-dice text-3xl text-amber-400 animate-bounce"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">Committing<span class="waiting-dots"></span></h2>
                <p class="text-zinc-400 text-sm">Locking your numbers on-chain</p>
            </div>

            <!-- Animated Reels -->
            <div class="flex justify-center gap-4 mb-6">
                ${tiersToShow.map((tier, idx) => `
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${tier.emoji} ${tier.name}</p>
                        <div class="w-20 h-24 rounded-2xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center overflow-hidden glow-pulse" style="--glow-color: ${tier.hex}50">
                            <span class="text-4xl font-black ${tier.textColor} slot-spin" id="spin-${idx}">?</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Your Picks -->
            <div class="border-t border-zinc-700/50 pt-4">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${tiersToShow.map((tier, idx) => {
                        const pick = picks[idx];
                        return `
                            <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center">
                                <span class="text-xl font-black ${tier.textColor}">${pick}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    // Animate spinning numbers
    tiersToShow.forEach((tier, idx) => {
        const el = document.getElementById(`spin-${idx}`);
        if (!el) return;
        setInterval(() => { el.textContent = Math.floor(Math.random() * tier.range) + 1; }, 80);
    });
}

// ============================================================================
// QUICK REVEAL — Step-based progress UI with live block countdown
// ============================================================================
function renderQuickReveal() {
    const area = document.getElementById('game-area');
    if (!area) return;

    updateTigerAnimation('waiting');

    const cfg = getModeConfig(Game.mode);
    const picks = cfg.isSingle ? [Game.guess] : Game.guesses;
    const tiersToShow = cfg.tiers;

    area.innerHTML = `
        <div class="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-500/30 rounded-2xl p-6 waiting-glow">
            <!-- Steps Progress -->
            <div class="mb-5">
                <div class="flex items-center justify-between mb-4">
                    <div id="step-1" class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                            <i class="fa-solid fa-check text-white text-xs"></i>
                        </div>
                        <span class="text-emerald-400 text-sm font-medium">Play Recorded</span>
                    </div>
                    <div class="flex-1 h-px bg-zinc-700 mx-2"></div>
                    <div id="step-2" class="flex items-center gap-2">
                        <div id="step-2-icon" class="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center">
                            <i class="fa-solid fa-spinner fa-spin text-white text-xs"></i>
                        </div>
                        <span id="step-2-text" class="text-amber-400 text-sm font-medium">Confirming...</span>
                    </div>
                    <div class="flex-1 h-px bg-zinc-700 mx-2"></div>
                    <div id="step-3" class="flex items-center gap-2">
                        <div id="step-3-icon" class="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                            <span class="text-zinc-500 text-xs font-bold">3</span>
                        </div>
                        <span id="step-3-text" class="text-zinc-500 text-sm font-medium">Result</span>
                    </div>
                </div>
                <!-- Progress bar -->
                <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div id="reveal-progress" class="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 rounded-full transition-all duration-1000 progress-animate" style="width: 33%"></div>
                </div>
                <p id="reveal-status-text" class="text-center text-xs text-zinc-400 mt-2">
                    <i class="fa-solid fa-cube mr-1"></i>Waiting for block confirmations...
                </p>
            </div>

            <!-- Spinning Reels -->
            <div class="flex justify-center gap-4 mb-5">
                ${tiersToShow.map((tier, idx) => `
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${tier.emoji} ${tier.name}</p>
                        <div class="w-20 h-24 rounded-2xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center overflow-hidden glow-pulse" style="--glow-color: ${tier.hex}50">
                            <span class="text-4xl font-black ${tier.textColor} slot-spin" id="quick-spin-${idx}">?</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Locked Picks -->
            <div class="border-t border-violet-500/20 pt-4 mb-4">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${tiersToShow.map((tier, idx) => {
                        const pick = picks[idx];
                        return `
                            <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center relative">
                                <span class="text-xl font-black ${tier.textColor}">${pick}</span>
                                <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                                    <i class="fa-solid fa-lock text-[8px] text-white"></i>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <button id="btn-reveal" disabled
                class="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-white opacity-80">
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                <span id="reveal-btn-text">Waiting for blockchain...</span>
            </button>
        </div>
    `;

    // Animate spinning numbers
    tiersToShow.forEach((tier, idx) => {
        const el = document.getElementById(`quick-spin-${idx}`);
        if (!el) return;
        setInterval(() => { el.textContent = Math.floor(Math.random() * tier.range) + 1; }, 80);
    });
}

// Update the Quick Reveal UI to show step 2 complete and step 3 active
function updateQuickRevealToStep3() {
    const step2Icon = document.getElementById('step-2-icon');
    const step2Text = document.getElementById('step-2-text');
    const step3Icon = document.getElementById('step-3-icon');
    const step3Text = document.getElementById('step-3-text');
    const progress = document.getElementById('reveal-progress');
    const statusText = document.getElementById('reveal-status-text');
    const btnText = document.getElementById('reveal-btn-text');

    if (step2Icon) step2Icon.innerHTML = '<i class="fa-solid fa-check text-white text-xs"></i>';
    if (step2Icon) step2Icon.className = 'w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center';
    if (step2Text) { step2Text.textContent = 'Confirmed'; step2Text.className = 'text-emerald-400 text-sm font-medium'; }
    if (step3Icon) step3Icon.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-white text-xs"></i>';
    if (step3Icon) step3Icon.className = 'w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center';
    if (step3Text) { step3Text.textContent = 'Revealing...'; step3Text.className = 'text-amber-400 text-sm font-medium'; }
    if (progress) progress.style.width = '80%';
    if (statusText) statusText.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Confirm in MetaMask to see your result!';
    if (btnText) btnText.textContent = 'Confirm in MetaMask...';
}

// ============================================================================
// WAITING PHASE — Full countdown (used for pending game recovery + retries)
// ============================================================================
function renderWaiting(container) {
    const cfg = getModeConfig(Game.mode);
    const picks = cfg.isSingle ? [Game.guess] : Game.guesses;
    const tiersToShow = cfg.tiers;

    const elapsed = Date.now() - (Game.commitment.waitStartTime || Date.now());
    const currentDelay = AUTO_REVEAL_DELAYS[Math.min(autoRevealAttempt, AUTO_REVEAL_DELAYS.length - 1)];
    const totalWaitMs = currentDelay + 2000;
    const remainingMs = Math.max(0, totalWaitMs - elapsed);
    const remainingSecs = Math.ceil(remainingMs / 1000);

    container.innerHTML = `
        <div class="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-500/30 rounded-2xl p-6 waiting-glow">
            <div class="text-center mb-5">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
                    <i class="fa-solid fa-hourglass-half text-3xl text-violet-400 hourglass-spin"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">Commitment Locked</h2>
                <p class="text-violet-300 text-sm">Waiting for blockchain confirmation...</p>
            </div>

            <!-- Countdown -->
            <div class="bg-zinc-900/50 rounded-xl p-4 mb-4 border border-violet-500/20">
                <div class="text-center">
                    <p class="text-xs text-zinc-500 uppercase mb-2">Time to Reveal</p>
                    <span id="countdown-timer" class="text-4xl font-black text-violet-400 countdown-pulse">~${remainingSecs}s</span>
                    <div class="mt-3 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div id="progress-bar" class="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000"
                             style="width: ${Math.min(100, (elapsed / totalWaitMs) * 100)}%"></div>
                    </div>
                </div>
            </div>

            <!-- Block Info -->
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                    <p class="text-[10px] text-zinc-500 uppercase mb-1">Commit Block</p>
                    <p class="text-sm font-mono text-white">#${Game.commitment.commitBlock || '...'}</p>
                </div>
                <div class="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                    <p class="text-[10px] text-zinc-500 uppercase mb-1">Reveal After</p>
                    <p class="text-sm font-mono text-violet-400">#${(Game.commitment.commitBlock || 0) + Game.commitment.revealDelay}</p>
                </div>
            </div>

            <!-- Locked Numbers with spinning reels -->
            <div class="border-t border-violet-500/20 pt-4 mb-4">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">Your Locked Numbers</p>
                <div class="flex justify-center gap-4">
                    ${tiersToShow.map((tier, idx) => {
                        const pick = picks[idx];
                        return `
                            <div class="text-center">
                                <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center relative">
                                    <span class="text-xl font-black ${tier.textColor}">${pick}</span>
                                    <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                                        <i class="fa-solid fa-lock text-[8px] text-white"></i>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Reveal Button -->
            <button id="btn-reveal"
                class="w-full py-3 rounded-xl font-bold transition-all ${Game.commitment.canReveal ?
                    'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg hover:shadow-emerald-500/30' :
                    'bg-zinc-800 text-zinc-500 cursor-not-allowed'}"
                ${Game.commitment.canReveal ? '' : 'disabled'}>
                <i class="fa-solid ${Game.commitment.canReveal ? 'fa-spinner fa-spin' : 'fa-lock'} mr-2"></i>
                <span id="reveal-btn-text">${Game.commitment.canReveal ? 'Auto-revealing...' : 'Waiting for blocks...'}</span>
            </button>

            <div class="mt-3 p-2.5 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <p class="text-[10px] text-violet-300 text-center">
                    <i class="fa-solid fa-shield-halved mr-1"></i>
                    Commit-reveal prevents manipulation. Reveal triggers automatically.
                </p>
            </div>

            ${Game.commitment.commitTxHash ? `
                <div class="text-center mt-3">
                    <a href="${EXPLORER_TX}${Game.commitment.commitTxHash}" target="_blank"
                       class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i> View Commit TX
                    </a>
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('btn-reveal')?.addEventListener('click', () => executeReveal());

    updateWaitingCountdown();
}

function updateWaitingCountdown() {
    if (Game.phase !== 'waiting') return;

    const timerEl = document.getElementById('countdown-timer');
    const progressEl = document.getElementById('progress-bar');
    if (!timerEl) return;

    const elapsed = Date.now() - (Game.commitment.waitStartTime || Date.now());
    const currentDelay = AUTO_REVEAL_DELAYS[Math.min(autoRevealAttempt, AUTO_REVEAL_DELAYS.length - 1)];
    const totalWaitMs = currentDelay + 2000; // delay + TX time
    const remainingMs = Math.max(0, totalWaitMs - elapsed);
    const remainingSecs = Math.ceil(remainingMs / 1000);

    if (remainingSecs > 0) {
        timerEl.textContent = `~${remainingSecs}s`;
    } else {
        timerEl.textContent = 'Revealing...';
    }

    if (progressEl) {
        progressEl.style.width = `${Math.min(100, (elapsed / totalWaitMs) * 100)}%`;
    }

    if (Game.phase === 'waiting') {
        setTimeout(updateWaitingCountdown, 1000);
    }
}

// ============================================================================
// REVEAL CHECK — V9: getGameStatus (not getCommitmentStatus)
// ============================================================================
function startRevealCheck() {
    if (revealCheckInterval) clearInterval(revealCheckInterval);

    setTimeout(updateWaitingCountdown, 100);

    revealCheckInterval = setInterval(async () => {
        if (Game.phase !== 'waiting') {
            clearInterval(revealCheckInterval);
            return;
        }

        try {
            const canReveal = await checkCanReveal();
            if (canReveal === 'expired') {
                clearInterval(revealCheckInterval);
                revealCheckInterval = null;
                console.log('[FortunePool] Game expired, clearing stuck game');
                clearStuckGame();
                return;
            }
            if (canReveal && !Game.commitment.canReveal) {
                Game.commitment.canReveal = true;
                clearInterval(revealCheckInterval);
                revealCheckInterval = null;
                console.log('[FortunePool] canReveal=true, starting auto-reveal...');
                autoRevealWithPreSim();
            }
        } catch (e) {
            console.warn('Reveal check error:', e);
        }
    }, REVEAL_CHECK_MS);
}

// V9 FIX: Use getGameStatus instead of getCommitmentStatus
async function checkCanReveal() {
    if (!State.fortunePoolContractPublic || !Game.gameId) return false;

    try {
        // V9: getGameStatus returns (status, canReveal, blocksUntilReveal, blocksUntilExpiry)
        const status = await State.fortunePoolContractPublic.getGameStatus(Game.gameId);

        // Detect expired or non-existent games (status: 0=none, 3=expired)
        const gameStatus = Number(status.status);
        if (gameStatus === 0 || gameStatus === 3) return 'expired';

        // Also get commitBlock from getGame if missing
        if (!Game.commitment.commitBlock) {
            try {
                const g = await State.fortunePoolContractPublic.getGame(Game.gameId);
                const block = Number(g.commitBlock);
                if (block > 0) Game.commitment.commitBlock = block;
            } catch {}
        }

        return status.canReveal === true;
    } catch (e) {
        // Time-based fallback (more conservative for Arbitrum ~250ms blocks)
        const elapsed = Date.now() - (Game.commitment.waitStartTime || Date.now());
        return elapsed >= 10000; // 10s fallback (plenty for 5 blocks × 250ms)
    }
}

// Auto-reveal retry — uses increasing delays for blockhash propagation on Arbitrum L2.
// First attempt is immediate (from commitGame onSuccess). Retries show countdown UI.
let autoRevealAttempt = 0;
const AUTO_REVEAL_DELAYS = [8000, 15000, 20000]; // 8s, 15s, 20s (increasing)

async function autoRevealWithPreSim() {
    if (Game.phase !== 'waiting') return;

    const statusText = document.getElementById('reveal-status-text');
    const btnEl = document.getElementById('btn-reveal');
    const btnTextEl = document.getElementById('reveal-btn-text');

    if (btnEl) {
        btnEl.disabled = true;
        btnEl.classList.remove('bg-zinc-800', 'text-zinc-500', 'cursor-not-allowed');
        btnEl.classList.add('bg-gradient-to-r', 'from-amber-500', 'to-yellow-500', 'text-white');
    }

    const delay = AUTO_REVEAL_DELAYS[Math.min(autoRevealAttempt, AUTO_REVEAL_DELAYS.length - 1)];
    console.log(`[FortunePool] Waiting ${delay / 1000}s before reveal attempt ${autoRevealAttempt + 1}...`);

    // Countdown on button + status
    if (statusText) statusText.innerHTML = '<i class="fa-solid fa-rotate mr-1"></i>Retrying automatically...';
    const startMs = Date.now();
    const countdownId = setInterval(() => {
        if (Game.phase !== 'waiting') { clearInterval(countdownId); return; }
        const remaining = Math.ceil((delay - (Date.now() - startMs)) / 1000);
        if (remaining > 0 && btnTextEl) {
            btnTextEl.textContent = `Retrying in ${remaining}s...`;
        }
    }, 500);

    await new Promise(r => setTimeout(r, delay));
    clearInterval(countdownId);

    if (Game.phase !== 'waiting') return;

    // Update UI before MetaMask popup
    updateQuickRevealToStep3();

    console.log('[FortunePool] Starting direct reveal (skipping pre-sim for Arbitrum L2)');
    executeReveal();
}

function enableManualRevealButton() {
    const statusText = document.getElementById('reveal-status-text');
    const btnEl = document.getElementById('btn-reveal');
    const btnTextEl = document.getElementById('reveal-btn-text');
    const timerEl = document.getElementById('countdown-timer');
    const progress = document.getElementById('reveal-progress');

    if (statusText) statusText.innerHTML = '<i class="fa-solid fa-hand-pointer mr-1"></i>Tap the button to see your result';
    if (timerEl) timerEl.textContent = 'Ready!';
    if (progress) progress.style.width = '67%';
    if (btnEl) {
        btnEl.disabled = false;
        btnEl.classList.remove('bg-zinc-800', 'text-zinc-500', 'cursor-not-allowed', 'from-amber-500', 'to-yellow-500', 'opacity-80');
        btnEl.classList.add('bg-gradient-to-r', 'from-emerald-500', 'to-green-500', 'text-white');
    }
    if (btnTextEl) btnTextEl.textContent = 'Reveal & Get Result!';

    // Also update step 2 to complete
    const step2Icon = document.getElementById('step-2-icon');
    const step2Text = document.getElementById('step-2-text');
    if (step2Icon) { step2Icon.innerHTML = '<i class="fa-solid fa-check text-white text-xs"></i>'; step2Icon.className = 'w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center'; }
    if (step2Text) { step2Text.textContent = 'Confirmed'; step2Text.className = 'text-emerald-400 text-sm font-medium'; }
}

// Poll canReveal on-chain every 2s, update progress UI, reveal immediately when ready
function pollCanRevealThenReveal() {
    let pollCount = 0;
    const maxPolls = 60; // 60 × 2s = 120s max wait
    let lastBlocksUntil = 999;

    const poll = async () => {
        if (Game.phase !== 'waiting') return;
        pollCount++;

        try {
            // Get detailed game status including blocks remaining
            const status = await State.fortunePoolContractPublic.getGameStatus(Game.gameId);
            const gameStatus = Number(status.status);
            if (gameStatus === 0 || gameStatus === 3) { clearStuckGame(); return; }

            const blocksUntilReveal = Number(status.blocksUntilReveal);
            const canReveal = status.canReveal === true;

            // Update progress UI
            const progressEl = document.getElementById('reveal-progress');
            const statusText = document.getElementById('reveal-status-text');

            if (blocksUntilReveal > 0 && statusText) {
                // Calculate progress (5 blocks total for REVEAL_DELAY)
                const totalBlocks = 5; // REVEAL_DELAY
                const done = Math.max(0, totalBlocks - blocksUntilReveal);
                const pct = 33 + (done / totalBlocks) * 34; // 33% → 67%
                if (progressEl) progressEl.style.width = `${pct}%`;
                statusText.innerHTML = `<i class="fa-solid fa-cube mr-1"></i>${blocksUntilReveal} block${blocksUntilReveal > 1 ? 's' : ''} remaining...`;
                lastBlocksUntil = blocksUntilReveal;
            }

            if (canReveal) {
                console.log(`[FortunePool] canReveal=true after ${pollCount} polls (~${pollCount * 2}s)`);

                // Update UI to step 3 and reveal IMMEDIATELY (no delay to avoid BlockhashUnavailable)
                updateQuickRevealToStep3();

                // Log diagnostic hash info (async, don't wait for it)
                logHashDiagnostic();

                executeReveal();
                return;
            }
        } catch (e) {
            console.warn('[FortunePool] canReveal poll error:', e);
        }

        if (pollCount < maxPolls) {
            setTimeout(poll, 2000);
        } else {
            console.warn('[FortunePool] canReveal poll timeout, enabling manual reveal');
            enableManualRevealButton();
        }
    };

    // Start polling after 2s (give commit TX time to propagate)
    setTimeout(poll, 2000);
}

// Async diagnostic: log hash comparison (non-blocking)
async function logHashDiagnostic() {
    try {
        const guesses = getModeConfig(Game.mode).isSingle ? [Game.guess] : Game.guesses;
        const ethers = window.ethers;
        // Use contract's generateCommitHash (pure function, always in ABI)
        const computedHash = await State.fortunePoolContractPublic.generateCommitHash(
            guesses.map(g => BigInt(g)),
            Game.commitment.userSecret
        );
        console.log('[FortunePool] Hash diagnostic:', {
            computedHash,
            guesses: guesses.map(g => Number(g)),
            secret: Game.commitment.userSecret?.slice(0, 18) + '...'
        });
    } catch (e) {
        console.warn('[FortunePool] Hash diagnostic failed:', e);
    }
}

async function executeReveal() {
    const btn = document.getElementById('btn-reveal');

    try {
        const guesses = getModeConfig(Game.mode).isSingle ? [Game.guess] : Game.guesses;

        await FortuneTx.revealPlay({
            gameId: Game.gameId,
            guesses: guesses,
            userSecret: Game.commitment.userSecret,
            button: btn,

            onSuccess: (receipt, gameResult) => {
                if (revealCheckInterval) clearInterval(revealCheckInterval);
                autoRevealAttempt = 0;

                Game.txHash = receipt.hash;
                Game.result = {
                    rolls: gameResult?.rolls || [],
                    prizeWon: gameResult?.prizeWon || 0n,
                    matches: gameResult?.matches || [],
                    matchCount: gameResult?.matchCount || 0
                };

                console.log('[FortunePool] Game revealed:', Game.result);
                Game.phase = 'result';
                renderPhase();
                loadPoolData();
            },

            onError: (error) => {
                if (error.cancelled) {
                    // User rejected MetaMask — show manual reveal button, don't auto-retry
                    console.log('[FortunePool] User rejected reveal, showing manual button');
                    showToast('You can reveal your result when ready', 'info');
                    autoRevealAttempt = 0;
                    enableManualRevealButton();
                    return;
                }

                const msg = error.message || '';
                const isRevert = error.type === 'tx_reverted' || msg.includes('revert') ||
                                 msg.includes('failed') || msg.includes('0x92555c0e') ||
                                 msg.includes('BlockhashUnavailable') || msg.includes('CALL_EXCEPTION');

                if (isRevert && autoRevealAttempt < AUTO_REVEAL_DELAYS.length - 1) {
                    autoRevealAttempt++;
                    console.warn(`[FortunePool] Reveal reverted (attempt ${autoRevealAttempt}), auto-retrying...`);
                    autoRevealWithPreSim();
                } else {
                    showToast('Reveal failed — tap the button to try again', 'error');
                    autoRevealAttempt = 0;
                    enableManualRevealButton();
                }
            }
        });
    } catch (e) {
        console.error('Reveal error:', e);
        const msg = e.message || '';
        const isRevert = msg.includes('revert') || msg.includes('failed') || msg.includes('BlockhashUnavailable');

        if (isRevert && autoRevealAttempt < AUTO_REVEAL_DELAYS.length - 1) {
            autoRevealAttempt++;
            console.warn(`[FortunePool] Reveal exception (attempt ${autoRevealAttempt}), auto-retrying...`);
            autoRevealWithPreSim();
        } else {
            showToast('Reveal failed: ' + (msg || 'Unknown error'), 'error');
            autoRevealAttempt = 0;
            enableManualRevealButton();
        }
    }
}

// ============================================================================
// RESULT PHASE — Animated reveal
// ============================================================================
function renderResult(container) {
    const result = Game.result;
    if (!result) return renderPhase();

    const cfg = getModeConfig(Game.mode);
    const picks = cfg.isSingle ? [Game.guess] : Game.guesses;
    const rolls = result.rolls || [];
    const tiersToShow = cfg.tiers;

    const matches = picks.map((pick, i) => {
        const roll = rolls[i] !== undefined ? Number(rolls[i]) : null;
        return roll !== null && roll === pick;
    });
    const matchCount = matches.filter(m => m).length;
    const isWin = result.prizeWon > 0 || matchCount > 0;

    let displayPrize = 0;
    if (result.prizeWon && result.prizeWon > 0n) {
        displayPrize = formatBigNumber(BigInt(result.prizeWon));
    } else if (matchCount > 0) {
        matches.forEach((hit, i) => {
            if (hit) {
                const tier = cfg.tiers[i] || TIERS[i];
                displayPrize += Game.wager * tier.multiplier;
            }
        });
    }

    const displayPrizeFormatted = typeof displayPrize === 'number'
        ? displayPrize.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : displayPrize.toLocaleString();

    container.innerHTML = `
        <div class="bg-gradient-to-br ${isWin ? 'from-emerald-900/30 to-green-900/10 border-emerald-500/30' : 'from-zinc-900 to-zinc-800/50 border-zinc-700/50'} border rounded-2xl p-5 relative overflow-hidden" id="result-container">

            <!-- Result Header -->
            <div class="text-center mb-4">
                ${isWin ? `
                    <div class="text-5xl mb-2">🎉</div>
                    <h2 class="text-2xl font-black text-emerald-400 mb-1">YOU WON!</h2>
                    <p class="text-3xl font-black text-white">${displayPrizeFormatted} BKC</p>
                ` : `
                    <div class="text-5xl mb-2">😔</div>
                    <h2 class="text-xl font-bold text-zinc-400 mb-1">No Match</h2>
                    <p class="text-zinc-500 text-sm">Better luck next time!</p>
                `}
            </div>

            <!-- Animated Result Grid -->
            <div class="grid ${cfg.isSingle ? 'grid-cols-1 max-w-[220px] mx-auto' : 'grid-cols-3'} gap-3 mb-4">
                ${tiersToShow.map((tier, idx) => {
                    const pick = picks[idx];
                    const roll = rolls[idx];
                    const isMatch = matches[idx];

                    return `
                        <div class="text-center p-3 rounded-xl ${isMatch ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-zinc-800/50 border border-zinc-700/50'}" id="result-tier-${idx}">
                            <p class="text-[10px] text-zinc-500 mb-1">${tier.emoji} ${tier.name}</p>
                            <div class="flex items-center justify-center gap-2">
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">YOU</p>
                                    <div class="w-12 h-12 rounded-lg bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border ${tier.borderColor} flex items-center justify-center">
                                        <span class="text-xl font-black ${tier.textColor}">${pick}</span>
                                    </div>
                                </div>
                                <span class="text-xl" id="match-icon-${idx}" style="opacity: 0">
                                    ${isMatch ? '=' : '≠'}
                                </span>
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">ROLL</p>
                                    <div class="w-12 h-12 rounded-lg ${isMatch ? 'bg-emerald-500/30 border-emerald-500' : 'bg-zinc-700/50 border-zinc-600'} border flex items-center justify-center overflow-hidden">
                                        <span class="text-xl font-black ${isMatch ? 'text-emerald-400' : 'text-zinc-300'}" id="roll-num-${idx}" style="opacity: 0">${roll !== undefined ? roll : '?'}</span>
                                    </div>
                                </div>
                            </div>
                            ${isMatch ? `<p class="text-emerald-400 text-xs font-bold mt-1" id="match-label-${idx}" style="opacity: 0">+${tier.multiplier}x</p>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- TX Link -->
            ${Game.txHash ? `
                <div class="text-center mb-3">
                    <a href="${EXPLORER_TX}${Game.txHash}" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i> View Transaction
                    </a>
                </div>
            ` : ''}

            <!-- Share -->
            <div class="bg-gradient-to-r ${isWin ? 'from-amber-500/10 to-orange-500/10 border-amber-500/30' : 'from-zinc-800/50 to-zinc-700/30 border-zinc-600/30'} border rounded-xl p-3 mb-3">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-9 h-9 rounded-full ${isWin ? 'bg-amber-500/20' : 'bg-zinc-700/50'} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-gift ${isWin ? 'text-amber-400' : 'text-zinc-400'}"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">${isWin ? 'Share Your Win!' : 'Share & Try Again!'}</p>
                        <p class="text-amber-400 text-xs font-medium">+${SHARE_POINTS} Airdrop Points</p>
                    </div>
                </div>
                <button id="btn-share" class="w-full py-2.5 ${isWin ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black' : 'bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600'} font-bold rounded-xl transition-all text-sm">
                    <i class="fa-solid fa-share-nodes mr-2"></i>${isWin ? 'Share Now' : 'Share Anyway'}
                </button>
            </div>

            <button id="btn-new-game" class="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                <i class="fa-solid fa-paw mr-2"></i>Play Again
            </button>
        </div>
    `;

    // Animated reveal — numbers "land" one-by-one
    tiersToShow.forEach((tier, idx) => {
        const delay = 600 + idx * 800;

        setTimeout(() => {
            const rollEl = document.getElementById(`roll-num-${idx}`);
            const iconEl = document.getElementById(`match-icon-${idx}`);
            const labelEl = document.getElementById(`match-label-${idx}`);
            const tierEl = document.getElementById(`result-tier-${idx}`);

            if (rollEl) {
                rollEl.style.opacity = '1';
                rollEl.classList.add('reel-land');
            }
            if (iconEl) {
                iconEl.style.opacity = '1';
                iconEl.className = `text-xl ${matches[idx] ? 'text-emerald-400' : 'text-red-400'}`;
            }

            // After landing, flash match/miss
            setTimeout(() => {
                if (tierEl) {
                    tierEl.classList.add(matches[idx] ? 'match-pulse' : 'miss-shake');
                }
                if (labelEl) labelEl.style.opacity = '1';
            }, 400);
        }, delay);
    });

    // Trigger celebrations after all reveals
    const totalRevealTime = 600 + tiersToShow.length * 800 + 500;
    if (isWin) {
        setTimeout(() => {
            triggerConfetti();
            if (displayPrize > Game.wager * 10) triggerCoinRain();
        }, totalRevealTime);
    }

    // Event listeners
    document.getElementById('btn-new-game')?.addEventListener('click', () => {
        Game.phase = 'play';
        Game.result = null;
        Game.txHash = null;
        Game.gameId = null;
        renderPhase();
        loadPoolData();
    });

    document.getElementById('btn-share')?.addEventListener('click', () => {
        showShareModal(isWin, displayPrize);
    });
}

// ============================================================================
// ANIMATIONS
// ============================================================================
function triggerConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
    const shapes = ['●', '■', '★', '🐯', '🎉'];

    for (let i = 0; i < 60; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.cssText = `
            left: ${Math.random() * 100}%;
            color: ${colors[i % colors.length]};
            font-size: ${8 + Math.random() * 12}px;
            animation-delay: ${Math.random() * 2}s;
            animation-duration: ${2 + Math.random() * 2}s;
        `;
        c.textContent = shapes[i % shapes.length];
        container.appendChild(c);
    }

    setTimeout(() => container.remove(), 5000);
}

function triggerCoinRain() {
    const coins = ['🪙', '💰', '✨', '⭐', '🎉'];
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.textContent = coins[Math.floor(Math.random() * coins.length)];
            coin.style.left = `${Math.random() * 100}%`;
            coin.style.animationDelay = `${Math.random() * 0.5}s`;
            coin.style.animationDuration = `${2 + Math.random() * 2}s`;
            document.body.appendChild(coin);
            setTimeout(() => coin.remove(), 4000);
        }, i * 100);
    }
}

// ============================================================================
// SHARE MODAL
// ============================================================================
function showShareModal(isWin, prize) {
    const ui = MODAL_UI[currentLang];

    const getShareText = () => {
        const texts = SHARE_TEXTS[currentLang];
        return isWin ? texts.win(prize) : texts.lose;
    };

    const modalContent = `
        <div class="text-center">
            <img src="${TIGER_IMAGE}" class="w-16 h-16 mx-auto mb-2" alt="Fortune Pool" onerror="this.style.display='none'">
            <h3 id="share-modal-title" class="text-lg font-bold text-white">${ui.title}</h3>
            <p id="share-modal-subtitle" class="text-amber-400 text-sm font-medium mb-3">${ui.subtitle}</p>

            <!-- Language Selector -->
            <div class="flex justify-center gap-2 mb-4">
                ${['pt', 'en', 'es'].map(lang => `
                    <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentLang === lang ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'} border" data-lang="${lang}">
                        <img src="${FLAG_IMAGES[lang]}" class="w-5 h-5 rounded-full object-cover" alt="${lang.toUpperCase()}">
                        <span class="${currentLang === lang ? 'text-amber-400' : 'text-zinc-400'}">${lang.toUpperCase()}</span>
                    </button>
                `).join('')}
            </div>

            <!-- Share Buttons -->
            <div class="grid grid-cols-5 gap-2 mb-4">
                <button id="share-twitter" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all">
                    <i class="fa-brands fa-x-twitter text-lg text-white mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Twitter</span>
                </button>
                <button id="share-telegram" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-[#0088cc]/20 border border-zinc-700 hover:border-[#0088cc]/50 rounded-xl transition-all">
                    <i class="fa-brands fa-telegram text-lg text-[#0088cc] mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Telegram</span>
                </button>
                <button id="share-whatsapp" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-[#25D366]/20 border border-zinc-700 hover:border-[#25D366]/50 rounded-xl transition-all">
                    <i class="fa-brands fa-whatsapp text-lg text-[#25D366] mb-1"></i>
                    <span class="text-[9px] text-zinc-500">WhatsApp</span>
                </button>
                <button id="share-instagram" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-[#E4405F]/20 border border-zinc-700 hover:border-[#E4405F]/50 rounded-xl transition-all">
                    <i class="fa-brands fa-instagram text-lg text-[#E4405F] mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Instagram</span>
                </button>
                <button id="share-copy" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all">
                    <i class="fa-solid fa-copy text-lg text-zinc-400 mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Copy</span>
                </button>
            </div>

            <button id="btn-close-share" class="text-zinc-500 hover:text-zinc-300 text-xs">${ui.later}</button>
        </div>
    `;

    openModal(modalContent, 'max-w-xs');

    // Language switcher
    const updateModalLanguage = (lang) => {
        currentLang = lang;
        const newUi = MODAL_UI[lang];

        const titleEl = document.getElementById('share-modal-title');
        const subtitleEl = document.getElementById('share-modal-subtitle');
        const laterEl = document.getElementById('btn-close-share');

        if (titleEl) titleEl.textContent = newUi.title;
        if (subtitleEl) subtitleEl.textContent = newUi.subtitle;
        if (laterEl) laterEl.textContent = newUi.later;

        document.querySelectorAll('.lang-btn').forEach(btn => {
            const btnLang = btn.dataset.lang;
            const textSpan = btn.querySelector('span');
            if (btnLang === lang) {
                btn.className = 'lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 border';
                if (textSpan) textSpan.className = 'text-amber-400';
            } else {
                btn.className = 'lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-800 border-zinc-700 hover:border-zinc-500 border';
                if (textSpan) textSpan.className = 'text-zinc-400';
            }
        });
    };

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => updateModalLanguage(btn.dataset.lang));
    });

    // Share tracking
    const trackShareOnServer = async (platform) => {
        if (!State.userAddress) return false;
        try {
            const response = await fetch('https://us-central1-backchain-backand.cloudfunctions.net/trackShare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: State.userAddress,
                    gameId: Game.gameId || Date.now(),
                    type: 'fortune',
                    platform
                })
            });
            const data = await response.json();
            if (data.success) {
                showToast(`+${data.pointsAwarded || SHARE_POINTS} Airdrop Points!`, 'success');
                return true;
            }
            return false;
        } catch {
            showToast(`+${SHARE_POINTS} Airdrop Points!`, 'success');
            return true;
        }
    };

    const shareAndTrack = async (platform, url) => {
        await trackShareOnServer(platform);
        window.open(url, '_blank');
        closeModal();
    };

    document.getElementById('share-twitter')?.addEventListener('click', () => {
        shareAndTrack('twitter', `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`);
    });
    document.getElementById('share-telegram')?.addEventListener('click', () => {
        shareAndTrack('telegram', `https://t.me/share/url?url=https://backcoin.org&text=${encodeURIComponent(getShareText())}`);
    });
    document.getElementById('share-whatsapp')?.addEventListener('click', () => {
        shareAndTrack('whatsapp', `https://wa.me/?text=${encodeURIComponent(getShareText())}`);
    });
    document.getElementById('share-instagram')?.addEventListener('click', async () => {
        const text = getShareText();
        try {
            await navigator.clipboard.writeText(text);
            await trackShareOnServer('instagram');
            closeModal();
            setTimeout(() => {
                const instructionModal = `
                    <div class="text-center p-2">
                        <i class="fa-brands fa-instagram text-4xl text-[#E4405F] mb-3"></i>
                        <h3 class="text-lg font-bold text-white mb-2">Text Copied!</h3>
                        <p class="text-zinc-400 text-sm mb-4">Now paste it in your Instagram story or post!</p>
                        <button id="btn-open-ig" class="w-full py-3 bg-gradient-to-r from-[#833AB4] via-[#E4405F] to-[#FCAF45] text-white font-bold rounded-xl mb-2">
                            <i class="fa-brands fa-instagram mr-2"></i>Open Instagram
                        </button>
                        <button id="btn-close-ig" class="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
                    </div>
                `;
                openModal(instructionModal, 'max-w-xs');
                document.getElementById('btn-open-ig')?.addEventListener('click', () => {
                    window.open('https://www.instagram.com/backcoin.bkc/', '_blank');
                    closeModal();
                });
                document.getElementById('btn-close-ig')?.addEventListener('click', closeModal);
            }, 100);
        } catch {
            showToast('Could not copy text', 'error');
            closeModal();
        }
    });
    document.getElementById('share-copy')?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(getShareText());
            showToast('Copied!', 'success');
            await trackShareOnServer('copy');
        } catch {
            showToast('Copy failed', 'error');
        }
        closeModal();
    });
    document.getElementById('btn-close-share')?.addEventListener('click', closeModal);
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function getFortunePoolStatus() {
    const contract = State.fortunePoolContract || State.fortunePoolContractPublic;
    if (!contract) return null;

    try {
        const [prizePoolVal, gameCount, tierCount] = await Promise.all([
            contract.prizePool().catch(() => 0n),
            contract.gameCounter().catch(() => 0),
            contract.TIER_COUNT().catch(() => 3)
        ]);

        // V10: Calculate fees client-side (eth_call returns 0 because tx.gasprice=0)
        const ethers = window.ethers;
        let feeSingle = 0n, feeAll = 0n, baseFee = 0n;
        try {
            const ACTION_IDS = [
                ethers.id("FORTUNE_TIER0"),
                ethers.id("FORTUNE_TIER1"),
                ethers.id("FORTUNE_TIER2")
            ];
            feeSingle = await calculateFeeClientSide(ACTION_IDS[0]);
            feeAll = 0n;
            for (const id of ACTION_IDS) {
                feeAll += await calculateFeeClientSide(id);
            }
            baseFee = feeSingle;
            console.log(`Service fees: single=${Number(feeSingle)/1e18} ETH, all=${Number(feeAll)/1e18} ETH`);
        } catch (e) {
            console.log("calculateFeeClientSide failed:", e.message);
        }

        Game.serviceFee = baseFee;
        Game.serviceFee1x = feeSingle;
        Game.serviceFee5x = feeAll;

        // Reveal delay
        try {
            const delay = await contract.REVEAL_DELAY();
            Game.commitment.revealDelay = Number(delay) || 5;
        } catch {}

        // Tier data
        try {
            const [ranges, multipliers, winChances] = await contract.getAllTiers();
            Game.tiersData = ranges.map((range, i) => ({
                range: Number(range),
                multiplier: Number(multipliers[i]) / 10000,
                winChance: Number(winChances[i]) / 10000
            }));
        } catch {}

        // Max payout
        let maxPayout = 0n;
        try {
            const stats = await contract.getPoolStats();
            maxPayout = stats.maxPayoutNow || stats[6] || 0n;
        } catch {}

        return {
            prizePool: prizePoolVal || 0n,
            gameCounter: Number(gameCount) || 0,
            serviceFee: baseFee,
            serviceFee1x: feeSingle,
            serviceFee5x: feeAll,
            tierCount: Number(tierCount) || 3,
            maxPayout
        };
    } catch (e) {
        console.error("getFortunePoolStatus error:", e);
        return { prizePool: 0n, gameCounter: 0, serviceFee: 0n, maxPayout: 0n };
    }
}

async function loadPoolData() {
    try {
        const status = await getFortunePoolStatus();
        if (status) {
            const poolEl = document.getElementById('prize-pool');
            const gamesEl = document.getElementById('total-games');
            if (poolEl) poolEl.textContent = formatBigNumber(status.prizePool || 0n).toFixed(2) + ' BKC';
            if (gamesEl) gamesEl.textContent = (status.gameCounter || 0).toLocaleString();
        }

        const balanceEl = document.getElementById('user-balance');
        const balNum = formatBigNumber(State.currentUserBalance || 0n);
        if (balanceEl) balanceEl.textContent = balNum.toFixed(2) + ' BKC';

        // Update wager section balance
        const wagerBalEl = document.getElementById('wager-balance');
        if (wagerBalEl) wagerBalEl.textContent = balNum.toFixed(0);

        // Re-render play phase if balance was 0 and now loaded
        if (balNum > 0 && Game.phase === 'play' && !Game._balanceLoaded) {
            Game._balanceLoaded = true;
            renderPhase();
        }

        loadHistory();
    } catch (e) {
        console.error('Pool error:', e);
    }
}

async function loadHistory() {
    try {
        const endpoint = API_ENDPOINTS.fortuneGames || 'https://getfortunegames-4wvdcuoouq-uc.a.run.app';
        const url = State.userAddress ? `${endpoint}?player=${State.userAddress}&limit=15` : `${endpoint}?limit=15`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.games?.length > 0) {
            renderHistoryList(data.games);
            const wins = data.games.filter(g => g.isWin || (g.prizeWon && BigInt(g.prizeWon) > 0n)).length;
            const el = document.getElementById('win-rate');
            if (el) el.textContent = `${wins}/${data.games.length} wins`;
        } else {
            const list = document.getElementById('history-list');
            if (list) list.innerHTML = `
                <div class="p-8 text-center">
                    <img src="${TIGER_IMAGE}" class="w-16 h-16 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                    <p class="text-zinc-500 text-sm">No games yet</p>
                    <p class="text-zinc-600 text-xs mt-1">Be the first to play!</p>
                </div>
            `;
        }
    } catch (e) {
        console.error("loadHistory error:", e);
    }
}

function renderHistoryList(games) {
    const list = document.getElementById('history-list');
    if (!list) return;

    list.innerHTML = games.map(game => {
        const isWin = game.isWin || (game.prizeWon && BigInt(game.prizeWon) > 0n);
        const prize = game.prizeWon ? formatBigNumber(BigInt(game.prizeWon)) : 0;
        const wager = game.wagerAmount ? formatBigNumber(BigInt(game.wagerAmount)) : 0;
        const isCumulative = game.isCumulative;
        const rolls = game.rolls || [];
        const guesses = game.guesses || [];
        const txHash = game.txHash || game.transactionHash;
        const timeAgo = getTimeAgo(game.timestamp || game.createdAt);
        const shortAddr = game.player ? `${game.player.slice(0,6)}...${game.player.slice(-4)}` : '???';
        const isMe = State.userAddress && game.player?.toLowerCase() === State.userAddress.toLowerCase();
        const txLink = txHash ? `${EXPLORER_TX}${txHash}` : null;

        return `
            <a href="${txLink || '#'}" target="${txLink ? '_blank' : '_self'}" rel="noopener"
               class="block p-3 rounded-xl mb-2 ${isWin ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-zinc-800/30 border border-zinc-700/30'} transition-all hover:scale-[1.01] ${txLink ? 'cursor-pointer hover:border-zinc-500' : ''}"
               ${!txLink ? 'onclick="return false;"' : ''}>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${isWin ? '🏆' : '🎲'}</span>
                        <span class="text-xs ${isMe ? 'text-amber-400 font-bold' : 'text-zinc-500'}">${isMe ? 'You' : shortAddr}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${isCumulative ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'}">${isCumulative ? 'Combo' : 'Single'}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-[10px] text-zinc-600">${timeAgo}</span>
                        ${txLink ? '<i class="fa-solid fa-external-link text-[8px] text-zinc-600"></i>' : ''}
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-zinc-500">Bet: ${wager.toFixed(0)}</span>
                        <span class="text-zinc-700">→</span>
                        <span class="text-xs ${isWin ? 'text-emerald-400 font-bold' : 'text-zinc-500'}">
                            ${isWin ? `+${prize.toFixed(0)} BKC` : 'No win'}
                        </span>
                    </div>
                    <div class="flex gap-1">
                        ${(isCumulative ? TIERS : [TIERS[2]]).map((tier, i) => {
                            const guess = guesses[i];
                            const roll = rolls[i];
                            const match = guess !== undefined && roll !== undefined && Number(guess) === Number(roll);
                            return `
                                <div class="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${match ? 'bg-emerald-500/30 text-emerald-400' : 'bg-zinc-700/50 text-zinc-500'}">
                                    ${roll ?? '?'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

function getTimeAgo(timestamp) {
    if (!timestamp) return 'N/A';
    try {
        const now = Date.now();
        let time;
        if (typeof timestamp === 'number') {
            time = timestamp > 1e12 ? timestamp : timestamp * 1000;
        } else if (typeof timestamp === 'string') {
            time = new Date(timestamp).getTime();
        } else if (timestamp._seconds) {
            time = timestamp._seconds * 1000;
        } else if (timestamp.seconds) {
            time = timestamp.seconds * 1000;
        } else {
            time = new Date(timestamp).getTime();
        }
        if (isNaN(time)) return 'N/A';

        const diff = now - time;
        if (diff < 0) return 'Just now';

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return 'N/A';
    }
}

// ============================================================================
// EXPORTS
// ============================================================================
export const FortunePoolPage = { render, cleanup };
