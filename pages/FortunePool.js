// js/pages/FortunePool.js
// V11.0 — Fortune Pool Complete Redesign
// Unified play screen, V9 contract alignment, pending game recovery
//
// V11.0 Changes:
// - Consolidated 6 phases → 4 (play, processing, waiting, result)
// - Fixed getCommitmentStatus → getGameStatus (V9)
// - Fixed getCommitment → getGame (V9)
// - Correct tier data: Jackpot 100x/1-150, Combo 112x max
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

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const EXPLORER_ADDRESS = "https://sepolia.arbiscan.io/address/";
const ORACLE_ADDRESS = "0x16346f5a45f9615f1c894414989f0891c54ef07b";
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
        lose: `🐯 Jogando Fortune Pool no @backcoin!\n\nLoteria on-chain verificável com Oracle seguro!\n\n👉 https://backcoin.org\n\n#Backcoin #Web3 #Arbitrum`
    },
    en: {
        win: (prize) => `🎉 Just won ${prize.toLocaleString()} BKC on Fortune Pool!\n\n🐯 On-chain lottery with instant results!\n\n👉 https://backcoin.org\n\n@backcoin #Backcoin #Web3 #Arbitrum`,
        lose: `🐯 Playing Fortune Pool on @backcoin!\n\nVerifiable on-chain lottery with secure Oracle!\n\n👉 https://backcoin.org\n\n#Backcoin #Web3 #Arbitrum`
    },
    es: {
        win: (prize) => `🎉 ¡Gané ${prize.toLocaleString()} BKC en Fortune Pool!\n\n🐯 ¡Lotería on-chain con resultados instantáneos!\n\n👉 https://backcoin.org\n\n@backcoin #Backcoin #Web3 #Arbitrum`,
        lose: `🐯 ¡Jugando Fortune Pool en @backcoin!\n\nLotería on-chain verificable con Oracle seguro!\n\n👉 https://backcoin.org\n\n#Backcoin #Web3 #Arbitrum`
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
        id: 0, name: "Easy", emoji: "🍀", range: 5, multiplier: 2, chance: "20%",
        color: "emerald", hex: "#10b981",
        bgFrom: "from-emerald-500/20", bgTo: "to-green-600/10",
        borderColor: "border-emerald-500/50", textColor: "text-emerald-400"
    },
    {
        id: 1, name: "Medium", emoji: "⚡", range: 15, multiplier: 10, chance: "6.7%",
        color: "violet", hex: "#8b5cf6",
        bgFrom: "from-violet-500/20", bgTo: "to-purple-600/10",
        borderColor: "border-violet-500/50", textColor: "text-violet-400"
    },
    {
        id: 2, name: "Hard", emoji: "👑", range: 150, multiplier: 100, chance: "0.67%",
        color: "amber", hex: "#f59e0b",
        bgFrom: "from-amber-500/20", bgTo: "to-orange-600/10",
        borderColor: "border-amber-500/50", textColor: "text-amber-400"
    }
];

// Derived constants from TIERS (not hardcoded)
const COMBO_MAX_MULTIPLIER = TIERS.reduce((sum, t) => sum + t.multiplier, 0); // 112
const JACKPOT_MULTIPLIER = TIERS[2].multiplier; // 100
const JACKPOT_RANGE = TIERS[2].range; // 150

// ============================================================================
// GAME STATE
// ============================================================================
const Game = {
    mode: 'jackpot',      // 'jackpot' or 'combo'
    phase: 'play',        // 'play' | 'processing' | 'waiting' | 'result'
    guess: 50,            // Jackpot guess
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

                <!-- Contract links -->
                <div class="flex items-center justify-center gap-2 mt-3 flex-wrap">
                    <a href="${EXPLORER_ADDRESS}${ORACLE_ADDRESS}" target="_blank" rel="noopener"
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-colors">
                        <i class="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
                        <span class="text-emerald-400 text-[10px] font-medium">Oracle</span>
                        <i class="fa-solid fa-external-link text-emerald-400/50 text-[8px]"></i>
                    </a>
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
                <div class="flex items-center justify-center gap-4 mt-2">
                    <div class="text-center">
                        <p class="text-[10px] text-zinc-500">Your Balance</p>
                        <p id="user-balance" class="text-sm font-bold text-white">--</p>
                    </div>
                    <div class="w-px h-6 bg-zinc-700"></div>
                    <div class="text-center">
                        <p class="text-[10px] text-zinc-500">Total Games</p>
                        <p id="total-games" class="text-sm font-bold text-zinc-300">--</p>
                    </div>
                    <div class="w-px h-6 bg-zinc-700"></div>
                    <div class="text-center">
                        <p class="text-[10px] text-zinc-500">Max Payout</p>
                        <p id="max-payout" class="text-sm font-bold text-emerald-400">--</p>
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
    Game.commitment = {
        hash: null, userSecret: null, commitBlock: null, commitTxHash: null,
        revealDelay: Game.commitment.revealDelay || 5,
        waitStartTime: null, canReveal: false
    };
}

// ============================================================================
// PENDING GAME RECOVERY
// ============================================================================
function checkPendingGame() {
    if (!State.userAddress) return;

    try {
        const stored = JSON.parse(localStorage.getItem('fortune_pending_games') || '{}');
        const pending = Object.values(stored).find(g =>
            g.player?.toLowerCase() === State.userAddress?.toLowerCase() && !g.revealed
        );
        if (pending) {
            console.log('[FortunePool] Recovering pending game:', pending.gameId);
            Game.gameId = pending.gameId;
            Game.commitment.userSecret = pending.userSecret;
            Game.mode = pending.tierMask === 4 ? 'jackpot' : 'combo';
            Game.guesses = pending.guesses || [2, 5, 50];
            Game.guess = Game.mode === 'jackpot' ? (pending.guesses?.[0] || 50) : 50;
            Game.wager = pending.wagerAmount ? Number(window.ethers?.formatEther(BigInt(pending.wagerAmount)) || 10) : 10;
            Game.commitment.waitStartTime = pending.commitTimestamp || Date.now();
            Game.commitment.canReveal = false;
            Game.phase = 'waiting';
            renderPhase();
            startRevealCheck();
        }
    } catch (e) {
        console.warn('[FortunePool] Pending game recovery failed:', e);
    }
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
// PLAY PHASE — Unified screen: mode tabs + picker + wager + buttons
// ============================================================================
function renderPlay(container) {
    const isJackpot = Game.mode === 'jackpot';
    const maxMulti = isJackpot ? JACKPOT_MULTIPLIER : COMBO_MAX_MULTIPLIER;
    const balanceNum = formatBigNumber(State.currentUserBalance || 0n);
    const hasBalance = balanceNum >= 1;

    const serviceFeeWei = isJackpot ? Game.serviceFee1x : Game.serviceFee5x;
    const serviceFeeEth = serviceFeeWei > 0n ? Number(serviceFeeWei) / 1e18 : 0;
    const hasFee = serviceFeeWei > 0n;

    container.innerHTML = `
        <div class="space-y-4">
            <!-- Mode Tabs -->
            <div class="flex bg-zinc-900/60 border border-zinc-800/50 rounded-xl overflow-hidden">
                <button id="tab-jackpot" class="flex-1 py-3 text-center font-bold text-sm transition-all ${isJackpot ? 'bg-amber-500/15 text-amber-400 border-b-2 border-amber-500' : 'text-zinc-500 hover:text-zinc-300'}">
                    <span class="text-lg mr-1">🎰</span> Jackpot
                    <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-black ${isJackpot ? 'bg-amber-500/30 text-amber-400' : 'bg-zinc-800 text-zinc-500'}">${JACKPOT_MULTIPLIER}x</span>
                </button>
                <button id="tab-combo" class="flex-1 py-3 text-center font-bold text-sm transition-all ${!isJackpot ? 'bg-violet-500/15 text-violet-400 border-b-2 border-violet-500' : 'text-zinc-500 hover:text-zinc-300'}">
                    <span class="text-lg mr-1">🚀</span> Combo
                    <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-black ${!isJackpot ? 'bg-violet-500/30 text-violet-400' : 'bg-zinc-800 text-zinc-500'}">${COMBO_MAX_MULTIPLIER}x</span>
                </button>
            </div>

            <!-- Mode Info Banner -->
            <div class="bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-4 py-2.5 text-center">
                ${isJackpot ? `
                    <p class="text-zinc-400 text-xs">Pick <span class="text-white font-bold">1 number</span> from <span class="text-amber-400 font-bold">1-${JACKPOT_RANGE}</span> &bull; <span class="text-emerald-400">${TIERS[2].chance}</span> chance &bull; Win <span class="text-amber-400 font-bold">${JACKPOT_MULTIPLIER}x</span></p>
                ` : `
                    <p class="text-zinc-400 text-xs">Pick <span class="text-white font-bold">3 numbers</span> across 3 tiers &bull; Max <span class="text-violet-400 font-bold">${COMBO_MAX_MULTIPLIER}x</span> if all match</p>
                `}
            </div>

            <!-- Number Picker -->
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4">
                <div id="picker-area"></div>
            </div>

            <!-- Wager Section -->
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4">
                <div class="flex items-center justify-between mb-3">
                    <label class="text-sm text-zinc-400 flex items-center gap-2">
                        <i class="fa-solid fa-coins text-amber-400"></i>
                        Wager
                    </label>
                    <span class="text-xs text-zinc-500">Balance: <span class="text-amber-400 font-bold">${balanceNum.toFixed(2)}</span> BKC</span>
                </div>

                <!-- Wager Input Row -->
                <div class="flex items-center justify-center gap-2 mb-3">
                    <button id="wager-minus" class="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500/50 text-zinc-400 hover:text-red-400 font-bold text-xl transition-all active:scale-95">−</button>
                    <input type="number" id="custom-wager" value="${Game.wager}" min="1" max="${Math.floor(balanceNum)}"
                        class="w-24 h-12 text-center text-2xl font-black rounded-xl bg-zinc-900/80 border-2 border-amber-500/50 text-amber-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all appearance-none"
                        style="-moz-appearance: textfield;">
                    <button id="wager-plus" class="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-emerald-500/20 border border-zinc-700 hover:border-emerald-500/50 text-zinc-400 hover:text-emerald-400 font-bold text-xl transition-all active:scale-95">+</button>
                </div>

                <!-- Quick Amounts -->
                <div class="grid grid-cols-5 gap-1.5 mb-3">
                    ${[10, 25, 50, 100, Math.floor(balanceNum)].map(val => `
                        <button class="wager-btn py-2 text-xs font-bold rounded-lg transition-all ${Game.wager === val ? 'bg-amber-500/25 border border-amber-500/60 text-amber-400' : 'bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30'}" data-value="${val}">
                            ${val === Math.floor(balanceNum) ? 'MAX' : val}
                        </button>
                    `).join('')}
                </div>

                <!-- Potential Win + Fee -->
                <div class="flex items-center justify-between px-1">
                    <div>
                        <p class="text-[10px] text-zinc-500 uppercase">Max Win</p>
                        <p class="text-lg font-black text-emerald-400" id="potential-win">${(Game.wager * maxMulti).toLocaleString()} BKC</p>
                    </div>
                    ${hasFee ? `
                        <div class="text-right">
                            <p class="text-[10px] text-zinc-500 uppercase">Game Fee</p>
                            <p class="text-sm font-bold text-blue-400"><i class="fa-brands fa-ethereum text-[10px] mr-0.5"></i>${serviceFeeEth.toFixed(6)} ETH</p>
                        </div>
                    ` : ''}
                </div>
            </div>

            ${!hasBalance ? `
                <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                    <p class="text-red-400 text-sm mb-2">Insufficient BKC balance</p>
                    <button id="btn-faucet" class="px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 text-sm font-bold hover:bg-amber-500/30 transition-colors">
                        <i class="fa-solid fa-faucet mr-2"></i>Get Test Tokens
                    </button>
                </div>
            ` : ''}

            ${!State.isConnected ? `
                <div class="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 text-center">
                    <i class="fa-solid fa-wallet text-zinc-600 text-xl mb-2"></i>
                    <p class="text-zinc-500 text-sm">Connect wallet to play</p>
                </div>
            ` : ''}

            <!-- Action Buttons -->
            <div class="flex gap-3">
                <button id="btn-quick-play" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors border border-zinc-700 ${!hasBalance || !State.isConnected ? 'opacity-40 cursor-not-allowed' : ''}" ${!hasBalance || !State.isConnected ? 'disabled' : ''}>
                    <i class="fa-solid fa-bolt text-amber-400 mr-2"></i>Lucky Pick
                </button>
                <button id="btn-play" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all ${!hasBalance || !State.isConnected ? 'opacity-40 cursor-not-allowed' : ''}" ${!hasBalance || !State.isConnected ? 'disabled' : ''}>
                    <i class="fa-solid fa-paw mr-2"></i>Play Now
                </button>
            </div>

            <!-- Provably Fair -->
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-shield-halved text-emerald-400"></i>
                    <span class="text-emerald-400 text-sm font-medium">Provably Fair Gaming</span>
                </div>
                <p class="text-zinc-400 text-xs">Results generated by on-chain Oracle. 100% verifiable and tamper-proof. Commit-reveal prevents manipulation.</p>
            </div>
        </div>
    `;

    // Render the appropriate number picker
    renderPickerInline();

    // Setup events
    setupPlayEvents(maxMulti, balanceNum);
}

// ============================================================================
// INLINE NUMBER PICKER
// ============================================================================
function renderPickerInline() {
    const area = document.getElementById('picker-area');
    if (!area) return;

    if (Game.mode === 'jackpot') {
        renderJackpotPickerInline(area);
    } else {
        renderComboPickerInline(area);
    }
}

function renderJackpotPickerInline(container) {
    const tier = TIERS[2];
    const current = Game.guess;

    container.innerHTML = `
        <div class="text-center mb-3">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${tier.bgFrom} ${tier.bgTo} border ${tier.borderColor} rounded-full">
                <span class="text-xl">${tier.emoji}</span>
                <span class="${tier.textColor} font-bold text-sm">Pick Your Lucky Number</span>
            </div>
        </div>

        <!-- Number Input -->
        <div class="flex items-center justify-center gap-3 mb-3">
            <button class="jp-minus-10 w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xs transition-all border border-zinc-700">-10</button>
            <button class="jp-minus w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">−</button>
            <input type="number" id="jp-number" min="1" max="${JACKPOT_RANGE}" value="${current}"
                class="w-20 h-20 text-center text-3xl font-black rounded-2xl bg-amber-500 border-2 border-amber-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none shadow-lg shadow-amber-500/30"
                style="-moz-appearance: textfield;">
            <button class="jp-plus w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">+</button>
            <button class="jp-plus-10 w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xs transition-all border border-zinc-700">+10</button>
        </div>

        <!-- Slider -->
        <div class="mb-3 px-1">
            <input type="range" id="jp-slider" min="1" max="${JACKPOT_RANGE}" value="${current}"
                class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                style="background: linear-gradient(to right, ${tier.hex} 0%, ${tier.hex} ${(current / JACKPOT_RANGE) * 100}%, #27272a ${(current / JACKPOT_RANGE) * 100}%, #27272a 100%)">
            <div class="flex justify-between text-[10px] text-zinc-600 mt-1 px-1">
                <span>1</span><span>${Math.round(JACKPOT_RANGE / 4)}</span><span>${Math.round(JACKPOT_RANGE / 2)}</span><span>${Math.round(JACKPOT_RANGE * 3 / 4)}</span><span>${JACKPOT_RANGE}</span>
            </div>
        </div>

        <!-- Quick Picks -->
        <div class="flex justify-center gap-1.5 flex-wrap">
            ${[7, 13, 21, 50, 77, 99, 137].map(n => `
                <button class="jp-quick px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-num="${n}">${n}</button>
            `).join('')}
            <button id="jp-random" class="px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded-lg border border-amber-500/30 transition-all">
                <i class="fa-solid fa-dice mr-1"></i>Random
            </button>
        </div>
    `;

    const input = document.getElementById('jp-number');
    const slider = document.getElementById('jp-slider');

    const updateValue = (val) => {
        val = Math.max(1, Math.min(JACKPOT_RANGE, val));
        Game.guess = val;
        if (input) input.value = val;
        if (slider) {
            slider.value = val;
            const pct = (val / JACKPOT_RANGE) * 100;
            slider.style.background = `linear-gradient(to right, ${TIERS[2].hex} 0%, ${TIERS[2].hex} ${pct}%, #27272a ${pct}%, #27272a 100%)`;
        }
    };

    input?.addEventListener('input', (e) => updateValue(parseInt(e.target.value) || 1));
    input?.addEventListener('blur', (e) => updateValue(parseInt(e.target.value) || 1));
    slider?.addEventListener('input', (e) => updateValue(parseInt(e.target.value)));

    container.querySelector('.jp-minus')?.addEventListener('click', () => updateValue(Game.guess - 1));
    container.querySelector('.jp-plus')?.addEventListener('click', () => updateValue(Game.guess + 1));
    container.querySelector('.jp-minus-10')?.addEventListener('click', () => updateValue(Game.guess - 10));
    container.querySelector('.jp-plus-10')?.addEventListener('click', () => updateValue(Game.guess + 10));

    container.querySelectorAll('.jp-quick').forEach(btn => {
        btn.addEventListener('click', () => updateValue(parseInt(btn.dataset.num)));
    });

    document.getElementById('jp-random')?.addEventListener('click', () => {
        updateValue(Math.floor(Math.random() * JACKPOT_RANGE) + 1);
    });
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
            <button id="combo-next" class="flex-1 py-2.5 bg-gradient-to-r ${tier.bgFrom.replace('/20', '/40')} ${tier.bgTo.replace('/10', '/30')} border ${tier.borderColor} ${tier.textColor} font-bold rounded-xl transition-all text-sm">
                ${Game.comboStep < 2 ? 'Next' : 'Done'}<i class="fa-solid fa-arrow-right ml-1"></i>
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
        }
    });
}

// ============================================================================
// PLAY EVENTS
// ============================================================================
function setupPlayEvents(maxMulti, balanceNum) {
    // Tab switching
    document.getElementById('tab-jackpot')?.addEventListener('click', () => {
        if (Game.mode !== 'jackpot') {
            Game.mode = 'jackpot';
            renderPhase();
        }
    });
    document.getElementById('tab-combo')?.addEventListener('click', () => {
        if (Game.mode !== 'combo') {
            Game.mode = 'combo';
            Game.comboStep = 0;
            renderPhase();
        }
    });

    // Wager controls
    const updateWager = (amount) => {
        const isJP = Game.mode === 'jackpot';
        const multi = isJP ? JACKPOT_MULTIPLIER : COMBO_MAX_MULTIPLIER;
        Game.wager = Math.max(1, Math.min(Math.floor(amount), Math.floor(balanceNum)));

        const customInput = document.getElementById('custom-wager');
        const potentialWin = document.getElementById('potential-win');
        if (customInput) customInput.value = Game.wager;
        if (potentialWin) potentialWin.textContent = (Game.wager * multi).toLocaleString() + ' BKC';

        document.querySelectorAll('.wager-btn').forEach(btn => {
            const val = parseInt(btn.dataset.value);
            btn.className = `wager-btn py-2 text-xs font-bold rounded-lg transition-all ${Game.wager === val ? 'bg-amber-500/25 border border-amber-500/60 text-amber-400' : 'bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30'}`;
        });
    };

    document.querySelectorAll('.wager-btn').forEach(btn => {
        btn.addEventListener('click', () => updateWager(parseInt(btn.dataset.value) || 1));
    });
    document.getElementById('custom-wager')?.addEventListener('input', (e) => updateWager(parseInt(e.target.value) || 1));
    document.getElementById('wager-minus')?.addEventListener('click', () => updateWager(Game.wager - 1));
    document.getElementById('wager-plus')?.addEventListener('click', () => updateWager(Game.wager + 1));

    // Faucet
    document.getElementById('btn-faucet')?.addEventListener('click', async () => {
        showToast('Requesting tokens...', 'info');
        try {
            let success = false;
            try {
                const res = await fetch(`/api/faucet?address=${State.userAddress}`);
                const data = await res.json();
                if (res.ok && data.success) success = true;
            } catch {}
            if (!success) {
                const { FaucetTx } = await import('../modules/transactions/index.js');
                await FaucetTx.claimOnChain({ onSuccess: () => { success = true; } });
            }
            if (success) { showToast('Tokens received!', 'success'); await loadUserData(); renderPhase(); }
        } catch (e) {
            showToast(e.message?.includes('cooldown') ? e.message : 'Faucet unavailable', 'error');
        }
    });

    // Quick Play — random numbers + commit immediately
    document.getElementById('btn-quick-play')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        if (Game.wager < 1) return showToast('Min: 1 BKC', 'warning');

        // Randomize numbers
        if (Game.mode === 'jackpot') {
            Game.guess = Math.floor(Math.random() * JACKPOT_RANGE) + 1;
        } else {
            Game.guesses = TIERS.map(t => Math.floor(Math.random() * t.range) + 1);
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
        const guesses = Game.mode === 'jackpot' ? [Game.guess] : Game.guesses;
        const tierMask = Game.mode === 'combo' ? 7 : 4;
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

                // Quick flow: brief animation then immediate reveal (MetaMask time IS the wait)
                Game.phase = 'waiting';
                renderQuickReveal();
                setTimeout(() => {
                    if (Game.phase === 'waiting') executeReveal();
                }, 2000);
            },

            onError: (error) => {
                if (!error.cancelled) {
                    showToast(error.message || 'Commit failed', 'error');
                }
                Game.phase = 'play';
                renderPhase();
            }
        });
    } catch (e) {
        console.error('Commit error:', e);
        showToast('Error: ' + (e.message || 'Transaction failed'), 'error');
        Game.phase = 'play';
        renderPhase();
    }
}

// ============================================================================
// PROCESSING PHASE
// ============================================================================
function renderProcessing(container) {
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const tiersToShow = isJackpot ? [TIERS[2]] : TIERS;

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
                        const pick = isJackpot ? picks[0] : picks[idx];
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
// QUICK REVEAL — Compact animation before immediate reveal (no countdown)
// ============================================================================
function renderQuickReveal() {
    const area = document.getElementById('game-area');
    if (!area) return;

    updateTigerAnimation('waiting');

    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const tiersToShow = isJackpot ? [TIERS[2]] : TIERS;

    area.innerHTML = `
        <div class="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-500/30 rounded-2xl p-6 waiting-glow">
            <div class="text-center mb-5">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
                    <i class="fa-solid fa-dice text-3xl text-amber-400 animate-bounce"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">Preparing Reveal<span class="waiting-dots"></span></h2>
                <p class="text-violet-300 text-sm">Sign the reveal in MetaMask to see your result</p>
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
                        const pick = isJackpot ? picks[0] : picks[idx];
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
                <span id="reveal-btn-text">Auto-revealing...</span>
            </button>

            <div class="mt-3 p-2.5 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <p class="text-[10px] text-violet-300 text-center">
                    <i class="fa-solid fa-bolt mr-1"></i>
                    Confirm the reveal transaction to see your result instantly!
                </p>
            </div>
        </div>
    `;

    // Animate spinning numbers
    tiersToShow.forEach((tier, idx) => {
        const el = document.getElementById(`quick-spin-${idx}`);
        if (!el) return;
        setInterval(() => { el.textContent = Math.floor(Math.random() * tier.range) + 1; }, 80);
    });
}

// ============================================================================
// WAITING PHASE — Full countdown (used for pending game recovery + retries)
// ============================================================================
function renderWaiting(container) {
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const tiersToShow = isJackpot ? [TIERS[2]] : TIERS;

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
                        const pick = isJackpot ? picks[0] : picks[idx];
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

    // On retry, show the full waiting UI with countdown
    if (autoRevealAttempt > 0) {
        Game.commitment.waitStartTime = Date.now();
        renderPhase(); // Shows full countdown UI
    }

    const btnEl = document.getElementById('btn-reveal');
    const btnTextEl = document.getElementById('reveal-btn-text');

    if (btnEl) {
        btnEl.disabled = true;
        btnEl.classList.remove('bg-zinc-800', 'text-zinc-500', 'cursor-not-allowed');
        btnEl.classList.add('bg-gradient-to-r', 'from-amber-500', 'to-yellow-500', 'text-white');
    }
    if (btnTextEl) btnTextEl.textContent = 'Auto-retrying...';

    const delay = AUTO_REVEAL_DELAYS[Math.min(autoRevealAttempt, AUTO_REVEAL_DELAYS.length - 1)];
    console.log(`[FortunePool] Waiting ${delay / 1000}s before reveal attempt ${autoRevealAttempt + 1}...`);
    await new Promise(r => setTimeout(r, delay));

    if (Game.phase !== 'waiting') return;

    console.log('[FortunePool] Starting direct reveal (skipping pre-sim for Arbitrum L2)');
    executeReveal();
}

function enableManualRevealButton() {
    const btnEl = document.getElementById('btn-reveal');
    const btnTextEl = document.getElementById('reveal-btn-text');
    const timerEl = document.getElementById('countdown-timer');

    if (timerEl) timerEl.textContent = 'Ready!';
    if (btnEl) {
        btnEl.disabled = false;
        btnEl.classList.remove('bg-zinc-800', 'text-zinc-500', 'cursor-not-allowed', 'from-amber-500', 'to-yellow-500');
        btnEl.classList.add('bg-gradient-to-r', 'from-emerald-500', 'to-green-500', 'text-white');
    }
    if (btnTextEl) btnTextEl.textContent = 'Reveal & Get Result!';
}

async function executeReveal() {
    const btn = document.getElementById('btn-reveal');

    try {
        const guesses = Game.mode === 'jackpot' ? [Game.guess] : Game.guesses;

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
                if (error.cancelled) return;

                const msg = error.message || '';
                const isRevert = msg.includes('revert') || msg.includes('0x92555c0e') ||
                                 msg.includes('BlockhashUnavailable') || msg.includes('CALL_EXCEPTION');

                if (isRevert && autoRevealAttempt < AUTO_REVEAL_DELAYS.length - 1) {
                    autoRevealAttempt++;
                    console.warn(`[FortunePool] Reveal reverted (attempt ${autoRevealAttempt}), auto-retrying...`);
                    showToast(`Blockhash not ready, retrying (${autoRevealAttempt + 1}/${AUTO_REVEAL_DELAYS.length})...`, 'warning');
                    autoRevealWithPreSim();
                } else {
                    showToast(msg || 'Reveal failed', 'error');
                    autoRevealAttempt = 0;
                    enableManualRevealButton();
                }
            }
        });
    } catch (e) {
        console.error('Reveal error:', e);
        const msg = e.message || '';
        const isRevert = msg.includes('revert') || msg.includes('BlockhashUnavailable');

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

    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const rolls = result.rolls || [];
    const tiersToShow = isJackpot ? [TIERS[2]] : TIERS;

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
                const tier = isJackpot ? TIERS[2] : TIERS[i];
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
            <div class="grid ${isJackpot ? 'grid-cols-1 max-w-[220px] mx-auto' : 'grid-cols-3'} gap-3 mb-4">
                ${tiersToShow.map((tier, idx) => {
                    const pick = isJackpot ? picks[0] : picks[idx];
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

        // V9: getRequiredFee(uint8 tierMask)
        let feeSingle = 0n, feeAll = 0n, baseFee = 0n;
        try {
            feeSingle = await contract.getRequiredFee(1);
            feeAll = await contract.getRequiredFee(7);
            baseFee = feeSingle;
            console.log(`Service fees: single=${Number(feeSingle)/1e18} ETH, all=${Number(feeAll)/1e18} ETH`);
        } catch (e) {
            console.log("getRequiredFee failed:", e.message);
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
            const maxPayoutEl = document.getElementById('max-payout');
            if (poolEl) poolEl.textContent = formatBigNumber(status.prizePool || 0n).toFixed(2) + ' BKC';
            if (gamesEl) gamesEl.textContent = (status.gameCounter || 0).toLocaleString();
            if (maxPayoutEl && status.maxPayout) {
                maxPayoutEl.textContent = formatBigNumber(status.maxPayout).toFixed(2) + ' BKC';
            }
        }

        const balanceEl = document.getElementById('user-balance');
        if (balanceEl) balanceEl.textContent = formatBigNumber(State.currentUserBalance || 0n).toFixed(2) + ' BKC';

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
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${isCumulative ? 'bg-violet-500/20 text-violet-400' : 'bg-amber-500/20 text-amber-400'}">${isCumulative ? 'Combo' : 'Jackpot'}</span>
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
