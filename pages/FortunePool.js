// js/pages/FortunePool.js
// ✅ VERSION V8.0: Complete Redesign - Mobile-First, Immersive UX, Real-time Feedback

import { State } from '../state.js';
import { loadUserData, safeContractCall, API_ENDPOINTS } from '../modules/data.js';
import { executeFortuneParticipate, getFortunePoolStatus, getGameResult } from '../modules/transactions.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';

const ethers = window.ethers;

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const FAUCET_API = "https://faucet-4wvdcuoouq-uc.a.run.app";

// Prize tiers configuration (from contract)
const TIERS = [
    { id: 0, name: "Jackpot", range: 100, multiplier: 100, color: "amber", icon: "👑", odds: "1:100" },
    { id: 1, name: "Super",   range: 10,  multiplier: 10,  color: "purple", icon: "⚡", odds: "1:10" },
    { id: 2, name: "Basic",   range: 2,   multiplier: 2,   color: "cyan", icon: "✨", odds: "1:2" }
];

// ============================================================================
// GAME STATE
// ============================================================================
const Game = {
    mode: 'jackpot', // 'jackpot' | 'combo'
    phase: 'idle',   // 'idle' | 'picking' | 'betting' | 'spinning' | 'result'
    pickStep: 0,     // 0-2 for combo mode
    guesses: [1, 1, 1],
    wager: 0,
    gameId: null,
    pollTimer: null,
    spinTimer: null,
    result: null,
    poolStatus: null,
    history: []
};

// ============================================================================
// STYLES
// ============================================================================
const injectStyles = () => {
    if (document.getElementById('fortune-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'fortune-styles';
    style.textContent = `
        .fortune-card {
            background: linear-gradient(180deg, rgba(24,24,27,0.95) 0%, rgba(9,9,11,0.98) 100%);
            border: 1px solid rgba(63,63,70,0.5);
        }
        .fortune-slot {
            background: linear-gradient(180deg, #0a0a0a 0%, #18181b 100%);
            border: 2px solid #27272a;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .fortune-slot.spinning {
            animation: slotPulse 0.1s infinite;
            border-color: #f59e0b;
            box-shadow: 0 0 20px rgba(245,158,11,0.3);
        }
        .fortune-slot.hit {
            border-color: #10b981 !important;
            background: linear-gradient(180deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%) !important;
            box-shadow: 0 0 30px rgba(16,185,129,0.4);
            transform: scale(1.05);
        }
        .fortune-slot.miss {
            border-color: #3f3f46 !important;
            opacity: 0.4;
        }
        @keyframes slotPulse {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-1px); }
        }
        @keyframes jackpotGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.3); }
            50% { box-shadow: 0 0 40px rgba(245,158,11,0.6); }
        }
        @keyframes winCelebrate {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
        .win-animate { animation: winCelebrate 0.5s ease-out; }
        .glow-pulse { animation: jackpotGlow 2s infinite; }
        .number-btn {
            transition: all 0.15s ease;
        }
        .number-btn:active {
            transform: scale(0.95);
        }
        .number-btn.selected {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            border-color: #f59e0b;
        }
        .mode-card {
            transition: all 0.2s ease;
        }
        .mode-card.active {
            border-color: rgba(245,158,11,0.5);
            background: rgba(245,158,11,0.1);
        }
        .progress-glow {
            background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
            background-size: 200% 100%;
            animation: progressShine 1.5s linear infinite;
        }
        @keyframes progressShine {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `;
    document.head.appendChild(style);
};

// ============================================================================
// MAIN RENDER
// ============================================================================
function render() {
    const container = document.getElementById('actions');
    if (!container) return;
    
    injectStyles();
    
    container.innerHTML = `
        <div class="min-h-screen pb-24 md:pb-10">
            <!-- MOBILE HEADER -->
            <header class="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50 -mx-4 px-4 py-3 md:hidden">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <i class="fa-solid fa-dice text-white text-sm"></i>
                        </div>
                        <div>
                            <h1 class="text-lg font-bold text-white">Fortune Pool</h1>
                            <p id="header-status" class="text-[10px] text-zinc-500">Loading...</p>
                        </div>
                    </div>
                    <button id="btn-refresh" class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/50 active:bg-zinc-700">
                        <i class="fa-solid fa-rotate text-zinc-400"></i>
                    </button>
                </div>
            </header>

            <!-- DESKTOP HEADER -->
            <div class="hidden md:flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <i class="fa-solid fa-dice text-white text-xl"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Fortune Pool</h1>
                        <p id="header-status-desktop" class="text-sm text-zinc-500">Provably Fair Gaming</p>
                    </div>
                </div>
                <button id="btn-refresh-desktop" class="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-white transition-all">
                    <i class="fa-solid fa-rotate"></i> Refresh
                </button>
            </div>

            <!-- PRIZE POOL BANNER -->
            <div id="prize-banner" class="mt-4 md:mt-0 bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-amber-900/30 border border-amber-500/20 rounded-2xl p-4 mb-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-[10px] text-amber-500/70 uppercase tracking-wider font-bold">Prize Pool</p>
                        <p id="prize-pool-amount" class="text-2xl md:text-3xl font-bold text-white">-- BKC</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Max Win</p>
                        <p class="text-lg font-bold text-amber-400">100x</p>
                    </div>
                </div>
            </div>

            <!-- GAME AREA -->
            <div id="game-container" class="fortune-card rounded-2xl overflow-hidden mb-6">
                <div id="game-content" class="p-5 min-h-[400px]">
                    <!-- Dynamic content -->
                </div>
            </div>

            <!-- INFO CARDS -->
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-shield-halved text-green-400 text-sm"></i>
                        <span class="text-xs font-bold text-zinc-400">Provably Fair</span>
                    </div>
                    <p class="text-[10px] text-zinc-500">VRF oracle ensures random results</p>
                </div>
                <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-bolt text-amber-400 text-sm"></i>
                        <span class="text-xs font-bold text-zinc-400">Instant Payout</span>
                    </div>
                    <p class="text-[10px] text-zinc-500">Winnings sent automatically</p>
                </div>
            </div>

            <!-- HISTORY -->
            <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
                <div class="flex items-center justify-between p-4 border-b border-zinc-800/50">
                    <h3 class="font-bold text-white text-sm flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i>
                        Recent Games
                    </h3>
                    <span id="history-stats" class="text-xs text-zinc-500">--</span>
                </div>
                <div id="game-history" class="divide-y divide-zinc-800/30 max-h-[300px] overflow-y-auto">
                    <div class="p-8 text-center text-zinc-600 text-sm">Loading...</div>
                </div>
            </div>
        </div>
    `;

    // Initial render
    renderGameContent();
    loadPoolStatus();
    loadHistory();
    attachGlobalListeners();
}

// ============================================================================
// GAME CONTENT RENDERER
// ============================================================================
function renderGameContent() {
    const content = document.getElementById('game-content');
    if (!content) return;
    
    switch (Game.phase) {
        case 'idle':
            renderModeSelection(content);
            break;
        case 'picking':
            renderNumberPicker(content);
            break;
        case 'betting':
            renderBettingScreen(content);
            break;
        case 'spinning':
            renderSpinningScreen(content);
            break;
        case 'result':
            renderResultScreen(content);
            break;
        default:
            renderModeSelection(content);
    }
}

// ============================================================================
// PHASE 1: MODE SELECTION
// ============================================================================
function renderModeSelection(container) {
    container.innerHTML = `
        <div class="text-center py-4">
            <!-- Logo -->
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center glow-pulse">
                <i class="fa-solid fa-dice text-4xl text-amber-400"></i>
            </div>
            
            <h2 class="text-2xl font-bold text-white mb-2">Choose Your Game</h2>
            <p class="text-zinc-500 text-sm mb-8">Pick a number, spin to win!</p>

            <!-- Mode Cards -->
            <div class="grid grid-cols-1 gap-4 max-w-sm mx-auto">
                <!-- Jackpot Mode -->
                <button id="mode-jackpot" class="mode-card text-left p-5 bg-zinc-900/50 border border-zinc-700/50 rounded-xl hover:border-amber-500/50 transition-all active:scale-[0.98]">
                    <div class="flex items-start justify-between mb-3">
                        <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <span class="text-2xl">👑</span>
                        </div>
                        <span class="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">100x</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-1">Jackpot Mode</h3>
                    <p class="text-xs text-zinc-400 mb-3">Pick 1 number (1-100). Hit it for 100x!</p>
                    <div class="flex items-center gap-4 text-[10px]">
                        <span class="text-zinc-500"><i class="fa-solid fa-percentage mr-1"></i> 1% chance</span>
                        <span class="text-green-400"><i class="fa-solid fa-gas-pump mr-1"></i> Lower fee</span>
                    </div>
                </button>

                <!-- Combo Mode -->
                <button id="mode-combo" class="mode-card text-left p-5 bg-zinc-900/50 border border-zinc-700/50 rounded-xl hover:border-purple-500/50 transition-all active:scale-[0.98]">
                    <div class="flex items-start justify-between mb-3">
                        <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <span class="text-2xl">🚀</span>
                        </div>
                        <span class="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">112x MAX</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-1">Combo Mode</h3>
                    <p class="text-xs text-zinc-400 mb-3">Pick 3 numbers across tiers. Stack your wins!</p>
                    <div class="flex items-center gap-3 text-[10px]">
                        <span class="text-amber-400">100x</span>
                        <span class="text-zinc-600">+</span>
                        <span class="text-purple-400">10x</span>
                        <span class="text-zinc-600">+</span>
                        <span class="text-cyan-400">2x</span>
                    </div>
                </button>
            </div>

            <!-- Connect Wallet Notice -->
            ${!State.isConnected ? `
                <div class="mt-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                    <p class="text-zinc-400 text-sm"><i class="fa-solid fa-wallet mr-2"></i> Connect wallet to play</p>
                </div>
            ` : ''}
        </div>
    `;

    // Attach mode selection
    document.getElementById('mode-jackpot')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        Game.mode = 'jackpot';
        Game.guesses = [1]; // Only one guess for jackpot
        Game.phase = 'picking';
        Game.pickStep = 0;
        renderGameContent();
    });

    document.getElementById('mode-combo')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        Game.mode = 'combo';
        Game.guesses = [1, 1, 1]; // Three guesses for combo
        Game.phase = 'picking';
        Game.pickStep = 0;
        renderGameContent();
    });
}

// ============================================================================
// PHASE 2: NUMBER PICKER
// ============================================================================
function renderNumberPicker(container) {
    const isJackpot = Game.mode === 'jackpot';
    const tier = isJackpot ? TIERS[0] : TIERS[Game.pickStep];
    const stepNum = isJackpot ? 1 : Game.pickStep + 1;
    const totalSteps = isJackpot ? 1 : 3;
    const currentGuess = Game.guesses[isJackpot ? 0 : Game.pickStep];

    container.innerHTML = `
        <div class="text-center py-2">
            <!-- Progress -->
            <div class="flex items-center justify-center gap-2 mb-4">
                ${Array(totalSteps).fill(0).map((_, i) => `
                    <div class="w-8 h-1 rounded-full ${i < stepNum ? 'bg-amber-500' : 'bg-zinc-700'}"></div>
                `).join('')}
            </div>

            <!-- Tier Info -->
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-${tier.color}-500/10 border border-${tier.color}-500/30 rounded-full mb-4">
                <span class="text-xl">${tier.icon}</span>
                <span class="text-${tier.color}-400 font-bold text-sm">${tier.name} Tier</span>
                <span class="text-zinc-500 text-xs">• ${tier.multiplier}x</span>
            </div>

            <h2 class="text-xl font-bold text-white mb-2">Pick a Number</h2>
            <p class="text-zinc-500 text-sm mb-6">Choose 1-${tier.range} (${tier.odds} odds)</p>

            <!-- Number Grid -->
            ${renderNumberGrid(tier.range, currentGuess)}

            <!-- Current Selection -->
            <div class="mt-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-700/50">
                <div class="flex items-center justify-between">
                    <span class="text-zinc-500 text-sm">Your pick:</span>
                    <span id="current-pick" class="text-2xl font-bold text-amber-400">${currentGuess}</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 mt-6">
                <button id="btn-back-pick" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i> Back
                </button>
                <button id="btn-confirm-pick" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    ${stepNum < totalSteps ? 'Next Tier' : 'Set Wager'} <i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `;

    // Number selection
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.value);
            const idx = isJackpot ? 0 : Game.pickStep;
            Game.guesses[idx] = val;
            
            // Update UI
            document.querySelectorAll('.number-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('current-pick').textContent = val;
        });
    });

    // Input for large ranges
    const numInput = document.getElementById('num-input');
    if (numInput) {
        numInput.addEventListener('input', () => {
            let val = parseInt(numInput.value) || 1;
            val = Math.max(1, Math.min(tier.range, val));
            const idx = isJackpot ? 0 : Game.pickStep;
            Game.guesses[idx] = val;
            document.getElementById('current-pick').textContent = val;
        });
    }

    // Back button
    document.getElementById('btn-back-pick')?.addEventListener('click', () => {
        if (Game.pickStep > 0) {
            Game.pickStep--;
            renderGameContent();
        } else {
            Game.phase = 'idle';
            renderGameContent();
        }
    });

    // Confirm button
    document.getElementById('btn-confirm-pick')?.addEventListener('click', () => {
        if (isJackpot || Game.pickStep >= 2) {
            Game.phase = 'betting';
            renderGameContent();
        } else {
            Game.pickStep++;
            renderGameContent();
        }
    });
}

function renderNumberGrid(range, selected) {
    if (range <= 10) {
        // Small grid
        return `
            <div class="flex flex-wrap justify-center gap-2 max-w-xs mx-auto">
                ${Array(range).fill(0).map((_, i) => {
                    const n = i + 1;
                    return `
                        <button class="number-btn w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-bold text-lg hover:border-amber-500 ${selected === n ? 'selected' : ''}" data-value="${n}">
                            ${n}
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    } else {
        // Large range - use input
        return `
            <div class="max-w-[200px] mx-auto">
                <input type="number" id="num-input" min="1" max="${range}" value="${selected}"
                    class="w-full bg-black border-2 border-amber-500/30 rounded-xl text-center text-4xl py-4 text-white font-bold outline-none focus:border-amber-500 transition-colors">
                <div class="flex justify-between mt-2 text-xs text-zinc-500">
                    <span>Min: 1</span>
                    <span>Max: ${range}</span>
                </div>
            </div>
        `;
    }
}

// ============================================================================
// PHASE 3: BETTING SCREEN
// ============================================================================
function renderBettingScreen(container) {
    const isJackpot = Game.mode === 'jackpot';
    const oracleFee = Game.poolStatus?.oracleFee1x || 0n;
    const comboFee = Game.poolStatus?.oracleFee5x || 0n;
    const fee = isJackpot ? oracleFee : comboFee;
    const feeDisplay = fee ? parseFloat(ethers.formatEther(fee)).toFixed(4) : '~0.001';
    
    // Check user balance for faucet prompt
    const userBalance = State.currentUserBalance || 0n;
    const lowBalance = userBalance < ethers.parseEther("1");

    container.innerHTML = `
        <div class="py-2">
            <!-- Summary Header -->
            <div class="flex items-center justify-between mb-6">
                <button id="btn-back-bet" class="text-zinc-500 hover:text-white transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i> Change Numbers
                </button>
                <span class="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                    ${isJackpot ? 'JACKPOT' : 'COMBO'} MODE
                </span>
            </div>

            ${lowBalance ? `
                <!-- Low Balance Warning + Faucet -->
                <div class="mb-6 p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl border border-cyan-500/30">
                    <div class="flex items-center gap-3 mb-3">
                        <i class="fa-solid fa-faucet text-cyan-400 text-lg"></i>
                        <div>
                            <p class="text-white font-bold text-sm">Need tokens to play?</p>
                            <p class="text-xs text-zinc-400">Get free BKC + ETH from faucet</p>
                        </div>
                    </div>
                    <button id="btn-faucet" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
                        <i class="fa-solid fa-gift mr-2"></i> Get Free Tokens
                    </button>
                </div>
            ` : ''}

            <!-- Your Picks -->
            <div class="mb-6">
                <p class="text-xs text-zinc-500 uppercase tracking-wider mb-3">Your Picks</p>
                <div class="grid grid-cols-${isJackpot ? '1' : '3'} gap-3">
                    ${(isJackpot ? [TIERS[0]] : TIERS).map((tier, i) => `
                        <div class="text-center p-4 bg-zinc-900/50 rounded-xl border border-${tier.color}-500/30">
                            <span class="text-lg">${tier.icon}</span>
                            <p class="text-2xl font-bold text-white mt-1">${Game.guesses[i]}</p>
                            <p class="text-[10px] text-${tier.color}-400 mt-1">${tier.multiplier}x</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Potential Wins -->
            <div class="mb-6 p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl border border-green-500/20">
                <p class="text-xs text-green-400 uppercase tracking-wider mb-2">Potential Wins</p>
                <div id="potential-wins" class="grid grid-cols-${isJackpot ? '1' : '3'} gap-2 text-center">
                    ${(isJackpot ? [TIERS[0]] : TIERS).map(tier => `
                        <div class="text-zinc-500 text-sm">--</div>
                    `).join('')}
                </div>
                ${!isJackpot ? `
                    <div class="mt-3 pt-3 border-t border-green-500/20 text-center">
                        <span class="text-xs text-zinc-500">Max Combo: </span>
                        <span id="max-combo" class="text-green-400 font-bold">--</span>
                    </div>
                ` : ''}
            </div>

            <!-- Wager Input -->
            <div class="mb-4">
                <div class="flex items-center justify-between bg-black/40 rounded-xl p-4 border border-zinc-700/50">
                    <span class="text-zinc-500 text-sm font-bold">WAGER</span>
                    <div class="flex items-center gap-2">
                        <input type="number" id="wager-input" 
                            class="bg-transparent text-right text-white font-mono text-2xl font-bold w-28 outline-none" 
                            placeholder="0" step="any" min="0.1" value="${Game.wager || ''}">
                        <span class="text-amber-500 font-bold">BKC</span>
                    </div>
                </div>
            </div>

            <!-- Quick Amounts -->
            <div class="grid grid-cols-5 gap-2 mb-6">
                ${[1, 5, 10, 50, 100].map(amt => `
                    <button class="quick-bet bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold py-2.5 rounded-lg transition-colors" data-amt="${amt}">
                        +${amt}
                    </button>
                `).join('')}
            </div>

            <!-- Fee Info -->
            <div class="flex items-center justify-between text-xs text-zinc-500 mb-4 px-2">
                <span><i class="fa-solid fa-gas-pump mr-1"></i> Oracle Fee: ${feeDisplay} ETH</span>
                <button id="btn-clear-wager" class="text-red-400 hover:text-red-300">Clear</button>
            </div>

            <!-- Play Button -->
            <button id="btn-play" disabled
                class="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-zinc-700 disabled:to-zinc-700 text-black disabled:text-zinc-500 font-black text-lg rounded-xl transition-all disabled:cursor-not-allowed">
                ENTER WAGER TO PLAY
            </button>
        </div>
    `;

    attachBettingListeners();
}

function attachBettingListeners() {
    const wagerInput = document.getElementById('wager-input');
    const playBtn = document.getElementById('btn-play');
    const isJackpot = Game.mode === 'jackpot';

    const updatePotentialWins = () => {
        const wager = parseFloat(wagerInput?.value) || 0;
        Game.wager = wager;
        
        const tiers = isJackpot ? [TIERS[0]] : TIERS;
        const winsContainer = document.getElementById('potential-wins');
        
        if (winsContainer) {
            winsContainer.innerHTML = tiers.map(tier => {
                const win = wager * tier.multiplier;
                return `
                    <div class="${wager > 0 ? 'text-green-400 font-bold' : 'text-zinc-500'} text-sm">
                        ${wager > 0 ? `+${win.toFixed(1)}` : '--'}
                    </div>
                `;
            }).join('');
        }

        // Max combo for combo mode
        if (!isJackpot) {
            const maxCombo = document.getElementById('max-combo');
            if (maxCombo) {
                const total = wager * 112; // 100 + 10 + 2
                maxCombo.textContent = wager > 0 ? `+${total.toFixed(1)} BKC` : '--';
            }
        }

        // Update button
        if (playBtn) {
            playBtn.disabled = wager <= 0;
            playBtn.textContent = wager > 0 ? '🎰 SPIN TO WIN' : 'ENTER WAGER TO PLAY';
        }
    };

    wagerInput?.addEventListener('input', updatePotentialWins);

    // Quick bet buttons
    document.querySelectorAll('.quick-bet').forEach(btn => {
        btn.addEventListener('click', () => {
            const current = parseFloat(wagerInput?.value) || 0;
            const add = parseFloat(btn.dataset.amt);
            wagerInput.value = (current + add).toFixed(2);
            updatePotentialWins();
        });
    });

    // Clear
    document.getElementById('btn-clear-wager')?.addEventListener('click', () => {
        wagerInput.value = '';
        updatePotentialWins();
    });

    // Back
    document.getElementById('btn-back-bet')?.addEventListener('click', () => {
        Game.phase = 'picking';
        Game.pickStep = Game.mode === 'jackpot' ? 0 : 2;
        renderGameContent();
    });

    // Play
    playBtn?.addEventListener('click', executeGame);

    // Faucet button (if shown)
    const faucetBtn = document.getElementById('btn-faucet');
    if (faucetBtn) {
        faucetBtn.addEventListener('click', () => requestFaucetAPI(faucetBtn));
    }

    updatePotentialWins();
}

// ============================================================================
// PHASE 4: SPINNING
// ============================================================================
async function executeGame() {
    if (!State.isConnected) return showToast('Connect wallet first', 'warning');
    if (Game.wager <= 0) return;

    const isJackpot = Game.mode === 'jackpot';
    const wagerWei = ethers.parseEther(Game.wager.toString());
    
    // For jackpot, we only send 1 guess. For combo, send all 3
    const guesses = isJackpot ? [Game.guesses[0]] : Game.guesses;
    const isCumulative = !isJackpot;

    Game.phase = 'spinning';
    renderGameContent();

    try {
        const result = await executeFortuneParticipate(
            wagerWei,
            guesses,
            isCumulative,
            document.getElementById('btn-cancel-spin')
        );

        if (result && result.success) {
            Game.gameId = result.gameId;
            updateSpinStatus('Waiting for oracle...', 40);
            pollForResult(result.gameId);
        } else {
            Game.phase = 'betting';
            renderGameContent();
        }
    } catch (e) {
        console.error('Game error:', e);
        Game.phase = 'betting';
        renderGameContent();
        showToast('Transaction failed', 'error');
    }
}

function renderSpinningScreen(container) {
    const isJackpot = Game.mode === 'jackpot';
    const tiers = isJackpot ? [TIERS[0]] : TIERS;

    container.innerHTML = `
        <div class="text-center py-8">
            <!-- Slots -->
            <div class="grid grid-cols-${isJackpot ? '1 max-w-[120px]' : '3 max-w-sm'} gap-3 mx-auto mb-8">
                ${tiers.map((tier, i) => `
                    <div class="text-center">
                        <p class="text-[10px] text-${tier.color}-400 font-bold mb-2">${tier.name}</p>
                        <div id="slot-${i}" class="fortune-slot spinning rounded-xl h-20 flex items-center justify-center">
                            <span class="text-4xl font-black text-amber-400">?</span>
                        </div>
                        <p class="text-xs text-zinc-600 mt-2">Pick: ${Game.guesses[i]}</p>
                    </div>
                `).join('')}
            </div>

            <!-- Status -->
            <div class="max-w-xs mx-auto">
                <div class="flex items-center justify-center gap-2 mb-3">
                    <div class="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span id="spin-status" class="text-white font-bold">Processing...</span>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div id="spin-progress" class="progress-glow h-full rounded-full transition-all duration-500" style="width: 10%"></div>
                </div>
                
                <p id="spin-substatus" class="text-xs text-zinc-500 mt-3">Confirming transaction...</p>
            </div>
        </div>
    `;

    // Start slot animation
    startSlotAnimation();
}

let slotAnimationId = null;

function startSlotAnimation() {
    const isJackpot = Game.mode === 'jackpot';
    const slotCount = isJackpot ? 1 : 3;
    const ranges = isJackpot ? [100] : [100, 10, 2];

    slotAnimationId = setInterval(() => {
        for (let i = 0; i < slotCount; i++) {
            const slot = document.getElementById(`slot-${i}`);
            if (slot && slot.classList.contains('spinning')) {
                const randomNum = Math.floor(Math.random() * ranges[i]) + 1;
                slot.querySelector('span').textContent = randomNum;
            }
        }
    }, 80);
}

function stopSlotAnimation() {
    if (slotAnimationId) {
        clearInterval(slotAnimationId);
        slotAnimationId = null;
    }
}

function updateSpinStatus(text, progress) {
    const statusEl = document.getElementById('spin-status');
    const progressEl = document.getElementById('spin-progress');
    const subEl = document.getElementById('spin-substatus');

    if (statusEl) statusEl.textContent = text;
    if (progressEl) progressEl.style.width = `${progress}%`;
    if (subEl) subEl.textContent = `Game #${Game.gameId || '--'}`;
}

// ============================================================================
// POLLING FOR RESULT
// ============================================================================
function pollForResult(gameId) {
    let attempts = 0;
    let progress = 40;

    if (Game.pollTimer) clearInterval(Game.pollTimer);

    Game.pollTimer = setInterval(async () => {
        attempts++;
        progress = Math.min(progress + 3, 95);
        updateSpinStatus('Oracle processing...', progress);

        if (attempts > 45) {
            clearInterval(Game.pollTimer);
            stopSlotAnimation();
            showToast('Oracle timeout. Check history later.', 'warning');
            Game.phase = 'idle';
            renderGameContent();
            return;
        }

        try {
            const result = await getGameResult(gameId);
            
            if (result && result.fulfilled) {
                clearInterval(Game.pollTimer);
                Game.result = result.rolls;
                revealResults(result.rolls);
            }
        } catch (e) {
            console.warn('Poll error:', e);
        }
    }, 2000);
}

async function revealResults(rolls) {
    stopSlotAnimation();
    updateSpinStatus('Revealing...', 100);

    const isJackpot = Game.mode === 'jackpot';
    const slotCount = isJackpot ? 1 : 3;
    const wait = ms => new Promise(r => setTimeout(r, ms));

    // Reveal each slot with delay
    for (let i = 0; i < slotCount; i++) {
        await wait(700);
        
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) continue;

        const roll = rolls[i];
        const guess = Game.guesses[i];
        const isHit = roll === guess;

        slot.classList.remove('spinning');
        slot.querySelector('span').textContent = roll;
        
        if (isHit) {
            slot.classList.add('hit');
        } else {
            slot.classList.add('miss');
        }
    }

    await wait(1000);
    
    // Calculate winnings
    const tiers = isJackpot ? [TIERS[0]] : TIERS;
    let totalMultiplier = 0;
    
    rolls.forEach((roll, i) => {
        if (roll === Game.guesses[i]) {
            totalMultiplier += tiers[i].multiplier;
        }
    });

    const winAmount = Game.wager * totalMultiplier;
    
    Game.result = {
        rolls,
        isWin: totalMultiplier > 0,
        winAmount,
        multiplier: totalMultiplier
    };

    Game.phase = 'result';
    renderGameContent();
}

// ============================================================================
// PHASE 5: RESULT SCREEN
// ============================================================================
function renderResultScreen(container) {
    const { isWin, winAmount, multiplier, rolls } = Game.result;
    const isJackpot = Game.mode === 'jackpot';
    const tiers = isJackpot ? [TIERS[0]] : TIERS;

    container.innerHTML = `
        <div class="text-center py-6 win-animate">
            ${isWin ? `
                <!-- WIN -->
                <div class="text-6xl mb-4">🏆</div>
                <h2 class="text-3xl font-black text-amber-400 mb-2">YOU WON!</h2>
                <div class="text-5xl font-black text-white mb-2">
                    +${winAmount.toFixed(2)}
                    <span class="text-xl text-amber-500">BKC</span>
                </div>
                <p class="text-zinc-500 mb-6">${multiplier}x multiplier</p>
            ` : `
                <!-- LOSE -->
                <div class="text-5xl mb-4 opacity-50">💔</div>
                <h2 class="text-2xl font-bold text-zinc-400 mb-2">Not This Time</h2>
                <p class="text-zinc-500 mb-6">Better luck next spin!</p>
            `}

            <!-- Roll Summary -->
            <div class="grid grid-cols-${isJackpot ? '1 max-w-[150px]' : '3 max-w-sm'} gap-3 mx-auto mb-8">
                ${tiers.map((tier, i) => {
                    const roll = rolls[i];
                    const guess = Game.guesses[i];
                    const hit = roll === guess;
                    return `
                        <div class="p-4 rounded-xl ${hit ? 'bg-green-500/10 border border-green-500/30' : 'bg-zinc-800/50 border border-zinc-700/30'}">
                            <p class="text-[10px] text-zinc-500 mb-1">${tier.name}</p>
                            <div class="flex items-center justify-center gap-2">
                                <span class="text-lg ${hit ? 'text-green-400' : 'text-zinc-500'}">${guess}</span>
                                <i class="fa-solid ${hit ? 'fa-equals text-green-400' : 'fa-not-equal text-red-400'} text-xs"></i>
                                <span class="text-lg font-bold ${hit ? 'text-green-400' : 'text-white'}">${roll}</span>
                            </div>
                            ${hit ? `<p class="text-xs text-green-400 mt-1">+${tier.multiplier}x</p>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Actions -->
            <div class="flex gap-3 max-w-sm mx-auto">
                <button id="btn-new-game" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">
                    New Game
                </button>
                <button id="btn-play-again" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    Play Again
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-new-game')?.addEventListener('click', () => {
        Game.phase = 'idle';
        Game.guesses = [1, 1, 1];
        Game.wager = 0;
        renderGameContent();
    });

    document.getElementById('btn-play-again')?.addEventListener('click', () => {
        Game.phase = 'betting';
        renderGameContent();
    });

    // Refresh history
    loadHistory();
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadPoolStatus() {
    try {
        const status = await getFortunePoolStatus();
        Game.poolStatus = status;

        // Update UI
        const prizeEl = document.getElementById('prize-pool-amount');
        if (prizeEl) {
            const prizeFormatted = formatBigNumber(status.prizePool || 0n);
            prizeEl.textContent = `${prizeFormatted.toFixed(2)} BKC`;
        }

        const headerStatus = document.getElementById('header-status');
        const headerStatusDesktop = document.getElementById('header-status-desktop');
        const statusText = status.active ? '● Online' : '○ Offline';
        
        if (headerStatus) headerStatus.innerHTML = `<span class="${status.active ? 'text-green-400' : 'text-red-400'}">${statusText}</span>`;
        if (headerStatusDesktop) headerStatusDesktop.innerHTML = `<span class="${status.active ? 'text-green-400' : 'text-red-400'}">${statusText}</span> • Provably Fair`;

    } catch (e) {
        console.warn('Pool status error:', e);
    }
}

async function loadHistory() {
    const historyEl = document.getElementById('game-history');
    const statsEl = document.getElementById('history-stats');
    
    if (!historyEl || !State.isConnected) {
        if (historyEl) historyEl.innerHTML = `<div class="p-8 text-center text-zinc-600 text-sm">Connect wallet to see history</div>`;
        return;
    }

    try {
        const res = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
        const data = await res.json();
        const games = data.filter(a => 
            a.type === 'GameResult' || 
            a.type === 'FortuneGameResult' ||
            a.type?.includes('Fortune') ||
            a.type?.includes('Game')
        );

        // Calculate stats
        let wins = 0, totalWon = 0;
        games.forEach(g => {
            if (g.details?.isWin) {
                wins++;
                totalWon += parseFloat(ethers.formatEther(g.details.amount || '0'));
            }
        });

        if (statsEl) {
            statsEl.innerHTML = wins > 0 
                ? `<span class="text-green-400">${wins} wins</span> • <span class="text-amber-400">+${totalWon.toFixed(2)} BKC</span>`
                : `${games.length} games`;
        }

        if (games.length === 0) {
            historyEl.innerHTML = `<div class="p-8 text-center text-zinc-600 text-sm">No games played yet</div>`;
            return;
        }

        historyEl.innerHTML = games.slice(0, 15).map(g => {
            const isWin = g.details?.isWin || false;
            const amount = g.details?.amount || '0';
            const rolls = g.details?.rolls || [];
            const guesses = g.details?.userGuesses || [];
            const date = formatTime(g.timestamp || g.createdAt);
            const txLink = g.txHash ? `${EXPLORER_TX}${g.txHash}` : '#';

            return `
                <a href="${txLink}" target="_blank" class="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors group">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ${isWin ? 'bg-green-500/20' : 'bg-zinc-800'} flex items-center justify-center">
                            <span class="text-lg">${isWin ? '🏆' : '🎲'}</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-1 text-xs font-mono">
                                ${rolls.slice(0, 3).map((r, i) => {
                                    const hit = parseInt(r) === parseInt(guesses[i]);
                                    return `<span class="${hit ? 'text-green-400' : 'text-zinc-500'}">${r}</span>`;
                                }).join('<span class="text-zinc-700">/</span>')}
                            </div>
                            <p class="text-[10px] text-zinc-600">${date}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        ${isWin 
                            ? `<p class="text-green-400 font-bold text-sm">+${formatBigNumber(BigInt(amount)).toFixed(2)}</p>`
                            : `<p class="text-zinc-600 text-sm">Miss</p>`
                        }
                        <i class="fa-solid fa-external-link text-[8px] text-zinc-600 group-hover:text-blue-400 transition-colors"></i>
                    </div>
                </a>
            `;
        }).join('');

    } catch (e) {
        historyEl.innerHTML = `<div class="p-8 text-center text-zinc-600 text-sm">Failed to load history</div>`;
    }
}

function formatTime(ts) {
    if (!ts) return 'Just now';
    const secs = ts.seconds || ts._seconds || (new Date(ts).getTime() / 1000);
    const diff = Math.floor(Date.now() / 1000 - secs);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return new Date(secs * 1000).toLocaleDateString();
}

// ============================================================================
// FAUCET API - For users without tokens
// ============================================================================
async function requestFaucetAPI(btnElement) {
    if (!State.isConnected || !State.userAddress) {
        showToast("Connect wallet first", "error");
        return false;
    }

    const originalHTML = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...`;

    try {
        const response = await fetch(`${FAUCET_API}?address=${State.userAddress}`);
        const data = await response.json();

        if (response.ok && data.success) {
            showToast("✅ Tokens sent! Refreshing...", "success");
            setTimeout(() => {
                loadPoolStatus();
                loadHistory();
            }, 4000);
            return true;
        } else {
            const msg = data.error || "Faucet unavailable";
            if (msg.toLowerCase().includes('cooldown')) {
                showToast(`⏳ ${msg}`, "warning");
            } else {
                showToast(`❌ ${msg}`, "error");
            }
            return false;
        }
    } catch (e) {
        showToast("🔌 Faucet offline", "error");
        return false;
    } finally {
        btnElement.disabled = false;
        btnElement.innerHTML = originalHTML;
    }
}

// ============================================================================
// GLOBAL LISTENERS
// ============================================================================
function attachGlobalListeners() {
    // Refresh buttons
    document.getElementById('btn-refresh')?.addEventListener('click', refresh);
    document.getElementById('btn-refresh-desktop')?.addEventListener('click', refresh);
}

async function refresh() {
    const btns = [document.getElementById('btn-refresh'), document.getElementById('btn-refresh-desktop')];
    btns.forEach(btn => btn?.querySelector('i')?.classList.add('fa-spin'));
    
    await Promise.all([loadPoolStatus(), loadHistory()]);
    
    setTimeout(() => {
        btns.forEach(btn => btn?.querySelector('i')?.classList.remove('fa-spin'));
    }, 500);
}

// ============================================================================
// CLEANUP
// ============================================================================
function cleanup() {
    if (Game.pollTimer) clearInterval(Game.pollTimer);
    if (slotAnimationId) clearInterval(slotAnimationId);
    Game.phase = 'idle';
}

// ============================================================================
// EXPORT
// ============================================================================
export const FortunePoolPage = {
    render(isActive) {
        if (!isActive) return;
        render();
    },
    
    update(isConnected) {
        loadPoolStatus();
        if (isConnected) loadHistory();
    },
    
    cleanup() {
        cleanup();
    }
};

window.FortunePoolPage = FortunePoolPage;