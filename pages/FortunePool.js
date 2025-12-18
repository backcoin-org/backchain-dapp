// js/pages/FortunePool.js
// ✅ PRODUCTION V13.0 - Tiger Theme + Spinning Roulette + Epic Win Animation

import { State } from '../state.js';
import { loadUserData, API_ENDPOINTS } from '../modules/data.js';
import { executeFortuneParticipate } from '../modules/transactions.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const TIGER_IMAGE = "./assets/fortune.png";

const TIERS = [
    { 
        id: 1, name: "Easy", emoji: "🍀", range: 3, multiplier: 2, chance: "33%",
        color: "emerald", hex: "#10b981",
        bgFrom: "from-emerald-500/20", bgTo: "to-green-600/10",
        borderColor: "border-emerald-500/50", textColor: "text-emerald-400"
    },
    { 
        id: 2, name: "Medium", emoji: "⚡", range: 10, multiplier: 5, chance: "10%",
        color: "violet", hex: "#8b5cf6",
        bgFrom: "from-violet-500/20", bgTo: "to-purple-600/10",
        borderColor: "border-violet-500/50", textColor: "text-violet-400"
    },
    { 
        id: 3, name: "Hard", emoji: "👑", range: 100, multiplier: 100, chance: "1%",
        color: "amber", hex: "#f59e0b",
        bgFrom: "from-amber-500/20", bgTo: "to-orange-600/10",
        borderColor: "border-amber-500/50", textColor: "text-amber-400"
    }
];

const MAX_COMBO_MULTIPLIER = 107;

// ============================================================================
// GAME STATE
// ============================================================================
const Game = {
    mode: null,
    phase: 'select',
    guess: 50,
    guesses: [2, 5, 50],
    comboStep: 0,
    wager: 10,
    gameId: null,
    result: null,
    poolStatus: null,
    history: [],
    spinIntervals: []
};

// ============================================================================
// STYLES - V13 com animações da roleta
// ============================================================================
function injectStyles() {
    if (document.getElementById('fortune-styles-v13')) return;
    
    const style = document.createElement('style');
    style.id = 'fortune-styles-v13';
    style.textContent = `
        /* Tiger Mascot Animations */
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
        @keyframes tiger-bounce {
            0%, 100% { transform: scale(1) translateY(0); }
            25% { transform: scale(1.05) translateY(-8px); }
            50% { transform: scale(0.95) translateY(0); }
            75% { transform: scale(1.02) translateY(-4px); }
        }
        @keyframes tiger-celebrate {
            0%, 100% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-10deg); }
            50% { transform: scale(1.1) rotate(10deg); }
            75% { transform: scale(1.15) rotate(-5deg); }
        }
        .tiger-float { animation: tiger-float 4s ease-in-out infinite; }
        .tiger-pulse { animation: tiger-pulse 2s ease-in-out infinite; }
        .tiger-spin { animation: tiger-spin 1s ease-in-out infinite; }
        .tiger-bounce { animation: tiger-bounce 0.6s ease-out; }
        .tiger-celebrate { animation: tiger-celebrate 0.8s ease-out infinite; }
        
        /* ============================================ */
        /* SPINNING ROULETTE ANIMATIONS - V13 NEW */
        /* ============================================ */
        
        /* Número girando rápido */
        @keyframes number-spin-fast {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
        }
        
        /* Container da roleta */
        .roulette-container {
            position: relative;
            overflow: hidden;
            height: 80px;
        }
        
        .roulette-number {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: number-spin-fast 0.15s linear infinite;
        }
        
        /* Glow pulsante na roleta */
        @keyframes roulette-glow {
            0%, 100% { box-shadow: 0 0 20px var(--glow-color), inset 0 0 20px rgba(0,0,0,0.5); }
            50% { box-shadow: 0 0 40px var(--glow-color), 0 0 60px var(--glow-color), inset 0 0 20px rgba(0,0,0,0.3); }
        }
        .roulette-glow { animation: roulette-glow 0.5s ease-in-out infinite; }
        
        /* Animação de desaceleração */
        @keyframes slow-down {
            0% { animation-duration: 0.1s; }
            100% { animation-duration: 0.8s; }
        }
        
        /* Número revelado com bounce */
        @keyframes number-reveal {
            0% { transform: scale(0) rotate(-180deg); opacity: 0; }
            50% { transform: scale(1.3) rotate(10deg); }
            70% { transform: scale(0.9) rotate(-5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .number-reveal { animation: number-reveal 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
        
        /* Match animation */
        @keyframes match-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            50% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .match-pulse { animation: match-pulse 0.8s ease-out 3; }
        
        /* Shake para miss */
        @keyframes miss-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
        }
        .miss-shake { animation: miss-shake 0.5s ease-out; }
        
        /* Epic Win Overlay */
        @keyframes epic-win-bg {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        @keyframes epic-win-text {
            0% { transform: scale(0) rotate(-20deg); opacity: 0; }
            50% { transform: scale(1.2) rotate(5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes epic-win-shine {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(200%) rotate(45deg); }
        }
        @keyframes coin-rain {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .epic-win-overlay {
            animation: epic-win-bg 0.3s ease-out forwards;
        }
        .epic-win-text {
            animation: epic-win-text 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        .epic-win-shine {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 200%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: epic-win-shine 1.5s ease-out infinite;
        }
        .coin {
            position: fixed;
            font-size: 24px;
            animation: coin-rain 3s linear forwards;
            pointer-events: none;
            z-index: 10000;
        }
        
        /* Fireworks */
        @keyframes firework {
            0% { transform: scale(0); opacity: 1; }
            50% { opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
        }
        .firework {
            position: absolute;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            animation: firework 1s ease-out forwards;
        }
        
        /* Game Mode Cards */
        .game-mode-card {
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .game-mode-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 70%);
            opacity: 0;
            transition: opacity 0.3s;
        }
        .game-mode-card:hover::before { opacity: 1; }
        .game-mode-card:hover {
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
        }
        .game-mode-card:active { transform: translateY(-2px) scale(0.99); }
        
        /* Easy Picker (1-3) */
        .easy-pick-btn {
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .easy-pick-btn:hover { transform: translateY(-6px) scale(1.05); }
        .easy-pick-btn.selected {
            transform: scale(1.08);
            box-shadow: 0 0 40px var(--glow-color);
        }
        
        /* Medium Picker (1-10) */
        .medium-pick-btn {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .medium-pick-btn:hover:not(.selected) { transform: scale(1.1); z-index: 10; }
        .medium-pick-btn.selected {
            transform: scale(1.15);
            box-shadow: 0 0 25px var(--glow-color);
            z-index: 20;
        }
        
        /* Hard Picker Slider */
        .fortune-slider {
            -webkit-appearance: none;
            appearance: none;
            height: 14px;
            border-radius: 7px;
            cursor: pointer;
        }
        .fortune-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            border: 4px solid #000;
            box-shadow: 0 4px 20px rgba(245,158,11,0.6);
            cursor: grab;
            transition: all 0.2s;
        }
        .fortune-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .fortune-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.2); }
        .fortune-slider::-moz-range-thumb {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            border: 4px solid #000;
            cursor: grab;
        }
        
        /* Grid Numbers */
        .grid-num {
            font-size: 10px;
            transition: all 0.15s ease;
        }
        .grid-num:hover { transform: scale(1.2); z-index: 10; background: #52525b !important; }
        .grid-num.selected { transform: scale(1.25); z-index: 20; }
        
        /* Tier Pills */
        .tier-pill {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tier-pill.active { transform: scale(1.1); box-shadow: 0 0 15px var(--pill-glow); }
        .tier-pill.done { background: rgba(16, 185, 129, 0.2) !important; border-color: #10b981 !important; }
        
        /* Animations */
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        .float { animation: float 3s ease-in-out infinite; }
        
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px var(--glow-color, rgba(245,158,11,0.3)); }
            50% { box-shadow: 0 0 40px var(--glow-color, rgba(245,158,11,0.6)); }
        }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        
        @keyframes pop {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
        .pop { animation: pop 0.3s ease-out; }
        
        /* Wager Buttons */
        .wager-btn { transition: all 0.2s ease; }
        .wager-btn:hover:not(.selected) { transform: scale(1.05); background: #3f3f46; }
        .wager-btn.selected {
            background: linear-gradient(135deg, #f59e0b, #d97706) !important;
            color: #000 !important;
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(245,158,11,0.4);
        }
        
        /* Results */
        .result-hit {
            border-color: #10b981 !important;
            background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)) !important;
            box-shadow: 0 0 30px rgba(16,185,129,0.4);
            animation: pop 0.5s ease-out;
        }
        .result-miss { opacity: 0.4; filter: grayscale(0.3); }
        
        /* Confetti */
        .confetti-container { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 9999; }
        .confetti { position: absolute; opacity: 0; animation: confetti-fall 3s ease-out forwards; }
        @keyframes confetti-fall {
            0% { opacity: 1; transform: translateY(-50px) rotate(0deg); }
            100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
        
        /* History Item Hover */
        .history-item:hover { 
            background: rgba(63,63,70,0.5) !important; 
            transform: translateX(4px);
        }
        
        /* Waiting dots animation */
        @keyframes waiting-dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
        .waiting-dots::after {
            content: '';
            animation: waiting-dots 1.5s infinite;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN RENDER
// ============================================================================
export function render() {
    const container = document.getElementById('actions');
    if (!container) return;

    injectStyles();
    
    container.innerHTML = `
        <div class="max-w-lg mx-auto px-4 py-6 pb-24">
            <!-- Header with Tiger Mascot -->
            <div class="text-center mb-6 relative">
                <div class="inline-block relative">
                    <img src="${TIGER_IMAGE}" 
                         alt="Fortune Tiger" 
                         class="w-28 h-28 object-contain tiger-float tiger-pulse mx-auto"
                         id="tiger-mascot"
                         onerror="this.style.display='none'; document.getElementById('tiger-fallback').style.display='flex';">
                    <div id="tiger-fallback" class="hidden items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/10 border border-orange-500/30 mx-auto">
                        <span class="text-5xl">🐯</span>
                    </div>
                </div>
                <h1 class="text-2xl font-bold text-white mt-2">Fortune Pool</h1>
                <p class="text-zinc-500 text-sm mt-1">🐯 Pick your lucky numbers</p>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-2 mb-6">
                <div class="bg-zinc-900/60 backdrop-blur border border-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-[10px] text-zinc-500 uppercase mb-0.5">🏆 Prize Pool</p>
                    <p id="prize-pool" class="text-orange-400 font-bold">--</p>
                </div>
                <div class="bg-zinc-900/60 backdrop-blur border border-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-[10px] text-zinc-500 uppercase mb-0.5">💰 Balance</p>
                    <p id="user-balance" class="text-white font-bold">--</p>
                </div>
                <div class="bg-zinc-900/60 backdrop-blur border border-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-[10px] text-zinc-500 uppercase mb-0.5">🎮 Games</p>
                    <p id="total-games" class="text-zinc-300 font-bold">--</p>
                </div>
            </div>

            <!-- Game Area -->
            <div id="game-area" class="mb-6"></div>

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
    renderPhase();
}

// ============================================================================
// PHASE ROUTER
// ============================================================================
function renderPhase() {
    const area = document.getElementById('game-area');
    if (!area) return;

    // Clear any running spin intervals
    Game.spinIntervals.forEach(id => clearInterval(id));
    Game.spinIntervals = [];

    // Update tiger animation based on phase
    updateTigerAnimation(Game.phase);

    switch (Game.phase) {
        case 'select': renderModeSelect(area); break;
        case 'pick': renderPicker(area); break;
        case 'wager': renderWager(area); break;
        case 'spin': renderSpin(area); break;
        case 'result': renderResult(area); break;
        default: renderModeSelect(area);
    }
}

function updateTigerAnimation(phase) {
    const tiger = document.getElementById('tiger-mascot');
    if (!tiger) return;
    
    tiger.className = 'w-28 h-28 object-contain mx-auto';
    tiger.style.filter = '';
    
    switch (phase) {
        case 'select':
            tiger.classList.add('tiger-float', 'tiger-pulse');
            break;
        case 'pick':
            tiger.classList.add('tiger-bounce');
            break;
        case 'wager':
            tiger.classList.add('tiger-float');
            break;
        case 'spin':
            tiger.classList.add('tiger-spin');
            break;
        case 'result':
            if (Game.result?.isWin || (Game.result?.results && Game.result.results.some((r, i) => {
                const picks = Game.mode === 'jackpot' ? [Game.guess] : Game.guesses;
                return Number(r) === picks[i];
            }))) {
                tiger.classList.add('tiger-celebrate');
            } else {
                tiger.style.filter = 'grayscale(0.5)';
                tiger.classList.add('tiger-float');
            }
            break;
    }
}

// ============================================================================
// PHASE 1: MODE SELECT
// ============================================================================
function renderModeSelect(container) {
    container.innerHTML = `
        <div class="space-y-4">
            <!-- JACKPOT -->
            <button id="btn-jackpot" class="game-mode-card w-full text-left p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 border-2 border-zinc-700/50 rounded-2xl hover:border-amber-500/50">
                <div class="flex items-start gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="text-4xl">👑</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <h3 class="text-xl font-bold text-white">Jackpot</h3>
                            <span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-black">100x</span>
                        </div>
                        <p class="text-zinc-400 text-sm mb-3">Pick 1 number from 1-100</p>
                        <div class="flex items-center gap-2">
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span class="text-xs text-zinc-400">1% chance</span>
                            </div>
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                <i class="fa-solid fa-bolt text-amber-400 text-[10px]"></i>
                                <span class="text-xs text-amber-400">Big Win</span>
                            </div>
                        </div>
                    </div>
                </div>
            </button>

            <!-- COMBO -->
            <button id="btn-combo" class="game-mode-card w-full text-left p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/20 border-2 border-zinc-700/50 rounded-2xl hover:border-violet-500/50">
                <div class="flex items-start gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="text-4xl">🚀</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <h3 class="text-xl font-bold text-white">Combo</h3>
                            <span class="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-400 text-sm font-black">up to ${MAX_COMBO_MULTIPLIER}x</span>
                        </div>
                        <p class="text-zinc-400 text-sm mb-3">Pick 3 numbers, stack your wins!</p>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${TIERS.map(t => `
                                <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                    <span>${t.emoji}</span>
                                    <span class="text-xs ${t.textColor} font-bold">${t.multiplier}x</span>
                                    <span class="text-xs text-zinc-500">${t.chance}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </button>

            ${!State.isConnected ? `
                <div class="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 text-center">
                    <i class="fa-solid fa-wallet text-zinc-600 text-xl mb-2"></i>
                    <p class="text-zinc-500 text-sm">Connect wallet to play</p>
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('btn-jackpot')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        Game.mode = 'jackpot';
        Game.guess = 50;
        Game.phase = 'pick';
        renderPhase();
    });

    document.getElementById('btn-combo')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        Game.mode = 'combo';
        Game.guesses = [2, 5, 50];
        Game.comboStep = 0;
        Game.phase = 'pick';
        renderPhase();
    });
}

// ============================================================================
// PHASE 2: NUMBER PICKER
// ============================================================================
function renderPicker(container) {
    if (Game.mode === 'jackpot') {
        renderJackpotPicker(container);
    } else {
        renderComboPicker(container);
    }
}

function renderJackpotPicker(container) {
    const tier = TIERS[2];
    const current = Game.guess;
    
    container.innerHTML = `
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <div class="text-center mb-4">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${tier.bgFrom} ${tier.bgTo} border ${tier.borderColor} rounded-full mb-2">
                    <span class="text-2xl">${tier.emoji}</span>
                    <span class="${tier.textColor} font-bold">Jackpot Mode</span>
                </div>
                <p class="text-zinc-400 text-sm">Pick <span class="text-white font-bold">1-100</span> • <span class="text-emerald-400">1%</span> • <span class="${tier.textColor} font-bold">100x</span></p>
            </div>

            <div class="text-center mb-4">
                <div class="inline-flex items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} pulse-glow" style="--glow-color: ${tier.hex}40">
                    <span id="display-number" class="text-5xl font-black ${tier.textColor}">${current}</span>
                </div>
            </div>

            <div class="mb-4 px-2">
                <input type="range" id="number-slider" min="1" max="100" value="${current}" 
                    class="fortune-slider w-full"
                    style="background: linear-gradient(to right, ${tier.hex} 0%, ${tier.hex} ${current}%, #27272a ${current}%, #27272a 100%)">
                <div class="flex justify-between text-xs text-zinc-500 mt-2 px-1">
                    <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
            </div>

            <details class="group">
                <summary class="flex items-center justify-center gap-2 text-xs text-zinc-500 cursor-pointer hover:text-zinc-400 py-2">
                    <i class="fa-solid fa-grip text-[10px]"></i>
                    <span class="group-open:hidden">Show grid</span>
                    <span class="hidden group-open:inline">Hide grid</span>
                </summary>
                <div class="grid gap-1 mt-2" style="grid-template-columns: repeat(10, 1fr)">
                    ${Array.from({length: 100}, (_, i) => i + 1).map(n => `
                        <button class="grid-num aspect-square rounded font-bold ${n === current ? 'bg-amber-500 text-black selected' : 'bg-zinc-800/60 text-zinc-500'}" data-num="${n}">${n}</button>
                    `).join('')}
                </div>
            </details>

            <div class="flex gap-3 mt-5">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl"><i class="fa-solid fa-arrow-left mr-2"></i>Back</button>
                <button id="btn-next" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl">Continue<i class="fa-solid fa-arrow-right ml-2"></i></button>
            </div>
        </div>
    `;

    setupHardPickerEvents(tier, (n) => { Game.guess = n; }, current);
    document.getElementById('btn-back')?.addEventListener('click', () => { Game.phase = 'select'; renderPhase(); });
    document.getElementById('btn-next')?.addEventListener('click', () => { Game.phase = 'wager'; renderPhase(); });
}

function renderComboPicker(container) {
    const tier = TIERS[Game.comboStep];
    const current = Game.guesses[Game.comboStep];
    
    container.innerHTML = `
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <div class="flex justify-center gap-3 mb-5">
                ${TIERS.map((t, i) => {
                    const isActive = i === Game.comboStep;
                    const isDone = i < Game.comboStep;
                    return `
                        <div class="tier-pill flex items-center gap-2 px-3 py-2 rounded-xl border ${isActive ? `bg-gradient-to-br ${t.bgFrom} ${t.bgTo} ${t.borderColor} active` : isDone ? 'done bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-800/50 border-zinc-700/50'}" style="--pill-glow: ${t.hex}40">
                            <span class="text-xl">${isDone ? '✓' : t.emoji}</span>
                            <div class="text-left">
                                <p class="text-xs font-bold ${isActive ? t.textColor : isDone ? 'text-emerald-400' : 'text-zinc-500'}">${t.name}</p>
                                <p class="text-[10px] ${isDone ? 'text-emerald-400 font-bold' : 'text-zinc-600'}">${isDone ? Game.guesses[i] : t.multiplier + 'x'}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="text-center mb-4">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${tier.bgFrom} ${tier.bgTo} border ${tier.borderColor} rounded-full mb-2">
                    <span class="text-2xl">${tier.emoji}</span>
                    <span class="${tier.textColor} font-bold">${tier.name} Tier</span>
                </div>
                <p class="text-zinc-400 text-sm">Pick <span class="text-white font-bold">1-${tier.range}</span> • <span class="text-emerald-400">${tier.chance}</span> • <span class="${tier.textColor} font-bold">${tier.multiplier}x</span></p>
            </div>

            <div id="picker-area" class="mb-5">
                ${tier.range <= 3 ? renderEasyPicker(tier, current) : tier.range <= 10 ? renderMediumPicker(tier, current) : renderHardPickerHTML(tier, current)}
            </div>

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl"><i class="fa-solid fa-arrow-left mr-2"></i>${Game.comboStep > 0 ? 'Previous' : 'Back'}</button>
                <button id="btn-next" class="flex-1 py-3.5 bg-gradient-to-r from-${tier.color}-500 to-${tier.color}-600 text-black font-bold rounded-xl">${Game.comboStep < 2 ? 'Next' : 'Continue'}<i class="fa-solid fa-arrow-right ml-2"></i></button>
            </div>
        </div>
    `;

    setupComboEvents(tier);
}

function renderEasyPicker(tier, current) {
    return `
        <div class="flex justify-center gap-4 py-4">
            ${Array.from({length: tier.range}, (_, i) => i + 1).map(n => `
                <button class="easy-pick-btn w-28 h-32 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 ${n === current ? `bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} ${tier.borderColor} selected` : 'bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-600'}" data-num="${n}" style="--glow-color: ${tier.hex}">
                    <span class="text-5xl font-black ${n === current ? tier.textColor : 'text-white'}">${n}</span>
                    <span class="text-xs ${n === current ? tier.textColor : 'text-zinc-500'} font-medium">Pick ${n}</span>
                </button>
            `).join('')}
        </div>
    `;
}

function renderMediumPicker(tier, current) {
    return `
        <div class="grid grid-cols-5 gap-3 max-w-sm mx-auto py-2">
            ${Array.from({length: tier.range}, (_, i) => i + 1).map(n => `
                <button class="medium-pick-btn aspect-square rounded-xl flex items-center justify-center border-2 ${n === current ? `bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} ${tier.borderColor} selected` : 'bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-600'}" data-num="${n}" style="--glow-color: ${tier.hex}">
                    <span class="text-2xl font-black ${n === current ? tier.textColor : 'text-white'}">${n}</span>
                </button>
            `).join('')}
        </div>
    `;
}

function renderHardPickerHTML(tier, current) {
    return `
        <div class="text-center mb-4">
            <div class="inline-flex items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} pulse-glow" style="--glow-color: ${tier.hex}40">
                <span id="display-number" class="text-5xl font-black ${tier.textColor}">${current}</span>
            </div>
        </div>
        <div class="mb-4 px-2">
            <input type="range" id="number-slider" min="1" max="100" value="${current}" class="fortune-slider w-full" style="background: linear-gradient(to right, ${tier.hex} 0%, ${tier.hex} ${current}%, #27272a ${current}%, #27272a 100%)">
            <div class="flex justify-between text-xs text-zinc-500 mt-2 px-1"><span>1</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        </div>
        <details class="group">
            <summary class="flex items-center justify-center gap-2 text-xs text-zinc-500 cursor-pointer hover:text-zinc-400 py-2"><i class="fa-solid fa-grip text-[10px]"></i><span class="group-open:hidden">Show grid</span><span class="hidden group-open:inline">Hide grid</span></summary>
            <div class="grid gap-1 mt-2" style="grid-template-columns: repeat(10, 1fr)">
                ${Array.from({length: 100}, (_, i) => i + 1).map(n => `<button class="grid-num aspect-square rounded font-bold ${n === current ? 'bg-amber-500 text-black selected' : 'bg-zinc-800/60 text-zinc-500'}" data-num="${n}">${n}</button>`).join('')}
            </div>
        </details>
    `;
}

function setupComboEvents(tier) {
    const updateNumber = (num) => {
        Game.guesses[Game.comboStep] = num;
        const display = document.getElementById('display-number');
        const slider = document.getElementById('number-slider');
        if (display) display.textContent = num;
        if (slider) {
            slider.value = num;
            slider.style.background = `linear-gradient(to right, ${tier.hex} 0%, ${tier.hex} ${num}%, #27272a ${num}%, #27272a 100%)`;
        }
        document.querySelectorAll('[data-num]').forEach(btn => {
            const n = parseInt(btn.dataset.num);
            const isSel = n === num;
            btn.classList.toggle('selected', isSel);
            if (btn.classList.contains('grid-num')) {
                btn.classList.toggle('bg-amber-500', isSel);
                btn.classList.toggle('text-black', isSel);
                btn.classList.toggle('bg-zinc-800/60', !isSel);
                btn.classList.toggle('text-zinc-500', !isSel);
            }
        });
    };

    document.getElementById('number-slider')?.addEventListener('input', (e) => updateNumber(parseInt(e.target.value)));
    document.querySelectorAll('[data-num]').forEach(btn => btn.addEventListener('click', () => updateNumber(parseInt(btn.dataset.num))));
    document.getElementById('btn-back')?.addEventListener('click', () => { if (Game.comboStep > 0) Game.comboStep--; else Game.phase = 'select'; renderPhase(); });
    document.getElementById('btn-next')?.addEventListener('click', () => { if (Game.comboStep < 2) Game.comboStep++; else Game.phase = 'wager'; renderPhase(); });
}

function setupHardPickerEvents(tier, updateFn, current) {
    const updateNumber = (num) => {
        updateFn(num);
        const display = document.getElementById('display-number');
        const slider = document.getElementById('number-slider');
        if (display) display.textContent = num;
        if (slider) {
            slider.value = num;
            slider.style.background = `linear-gradient(to right, ${tier.hex} 0%, ${tier.hex} ${num}%, #27272a ${num}%, #27272a 100%)`;
        }
        document.querySelectorAll('.grid-num').forEach(btn => {
            const n = parseInt(btn.dataset.num);
            btn.classList.toggle('selected', n === num);
            btn.classList.toggle('bg-amber-500', n === num);
            btn.classList.toggle('text-black', n === num);
            btn.classList.toggle('bg-zinc-800/60', n !== num);
            btn.classList.toggle('text-zinc-500', n !== num);
        });
    };

    document.getElementById('number-slider')?.addEventListener('input', (e) => updateNumber(parseInt(e.target.value)));
    document.querySelectorAll('.grid-num').forEach(btn => btn.addEventListener('click', () => updateNumber(parseInt(btn.dataset.num))));
}

// ============================================================================
// PHASE 3: WAGER
// ============================================================================
function renderWager(container) {
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const maxMulti = isJackpot ? 100 : MAX_COMBO_MULTIPLIER;
    const balanceNum = formatBigNumber(State.currentUserBalance || 0n);
    const hasBalance = balanceNum >= 1;
    const wagerOptions = [10, 50, 100];
    
    container.innerHTML = `
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <div class="text-center mb-5">
                <h2 class="text-lg font-bold text-white mb-3">Your Picks</h2>
                <div class="flex justify-center gap-3">
                    ${(isJackpot ? [{ tier: TIERS[2], pick: picks[0] }] : picks.map((p, i) => ({ tier: TIERS[i], pick: p }))).map(({ tier, pick }) => `
                        <div class="relative">
                            <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center">
                                <span class="text-2xl font-black ${tier.textColor}">${pick}</span>
                            </div>
                            <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-${tier.color}-500 text-black text-xs font-bold rounded-full">${tier.multiplier}x</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${!hasBalance ? `
                <div class="mb-5 p-4 bg-gradient-to-r from-red-900/30 to-orange-900/20 rounded-xl border border-red-500/30">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center"><i class="fa-solid fa-exclamation-triangle text-red-400"></i></div>
                        <div><p class="text-white font-bold">No BKC Balance</p><p class="text-xs text-zinc-400">Get free tokens</p></div>
                    </div>
                    <button id="btn-faucet" class="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl"><i class="fa-solid fa-faucet mr-2"></i>Get Free 1000 BKC</button>
                </div>
            ` : `
                <div class="mb-5">
                    <div class="flex items-center justify-between mb-3">
                        <p class="text-xs text-zinc-500 uppercase">Wager</p>
                        <p class="text-xs text-zinc-400">Balance: <span class="text-white font-bold">${balanceNum.toFixed(2)}</span> BKC</p>
                    </div>
                    <div class="grid grid-cols-3 gap-2 mb-3">
                        ${wagerOptions.map(w => `<button class="wager-btn py-2.5 rounded-xl font-bold text-sm border-2 border-zinc-700/50 bg-zinc-800/60 text-zinc-300 ${Game.wager === w ? 'selected' : ''}" data-wager="${w}">${w} BKC</button>`).join('')}
                    </div>
                    <div class="flex gap-2">
                        <input type="number" id="custom-wager" value="${Game.wager}" class="flex-1 bg-zinc-800/60 border-2 border-zinc-700/50 rounded-xl px-4 py-2.5 text-white text-center font-bold focus:border-amber-500/50 focus:outline-none">
                        <button id="btn-max" class="px-4 py-2.5 bg-zinc-800/60 border-2 border-zinc-700/50 rounded-xl text-amber-400 font-bold hover:bg-zinc-700">MAX</button>
                    </div>
                </div>
                <div class="p-4 bg-gradient-to-r from-emerald-900/20 to-green-900/10 border border-emerald-500/30 rounded-xl mb-5">
                    <div class="flex items-center justify-between">
                        <div><p class="text-xs text-zinc-400 mb-1">Potential Win</p><p class="text-2xl font-black text-emerald-400" id="potential-win">${(Game.wager * maxMulti).toLocaleString()} BKC</p></div>
                        <div class="text-right"><p class="text-xs text-zinc-400 mb-1">Multiplier</p><p class="text-xl font-bold text-white">${maxMulti}x</p></div>
                    </div>
                </div>
            `}

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl"><i class="fa-solid fa-arrow-left mr-2"></i>Back</button>
                <button id="btn-play" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl ${!hasBalance ? 'opacity-50 cursor-not-allowed' : ''}" ${!hasBalance ? 'disabled' : ''}><i class="fa-solid fa-paw mr-2"></i>Play Now</button>
            </div>
        </div>
    `;

    setupWagerEvents(maxMulti, balanceNum);
}

function setupWagerEvents(maxMulti, balanceNum) {
    const updateWager = (amount) => {
        Game.wager = Math.max(1, Math.min(amount, Math.floor(balanceNum)));
        const customInput = document.getElementById('custom-wager');
        const potentialWin = document.getElementById('potential-win');
        if (customInput) customInput.value = Game.wager;
        if (potentialWin) potentialWin.textContent = (Game.wager * maxMulti).toLocaleString() + ' BKC';
        document.querySelectorAll('.wager-btn').forEach(btn => btn.classList.toggle('selected', parseInt(btn.dataset.wager) === Game.wager));
    };

    document.querySelectorAll('.wager-btn').forEach(btn => btn.addEventListener('click', () => updateWager(parseInt(btn.dataset.wager))));
    document.getElementById('custom-wager')?.addEventListener('input', (e) => updateWager(parseInt(e.target.value) || 10));
    document.getElementById('btn-max')?.addEventListener('click', () => updateWager(Math.floor(balanceNum)));
    document.getElementById('btn-faucet')?.addEventListener('click', async () => {
        showToast('Requesting tokens...', 'info');
        try {
            const res = await fetch(`https://faucet-4wvdcuoouq-uc.a.run.app?address=${State.userAddress}`);
            const data = await res.json();
            if (data.success) { showToast('🎉 Tokens received!', 'success'); await loadUserData(); renderPhase(); }
            else showToast(data.error || 'Error', 'error');
        } catch { showToast('Faucet error', 'error'); }
    });
    document.getElementById('btn-back')?.addEventListener('click', () => { Game.phase = 'pick'; if (Game.mode === 'combo') Game.comboStep = 2; renderPhase(); });
    document.getElementById('btn-play')?.addEventListener('click', async () => {
        if (Game.wager < 1) return showToast('Min: 1 BKC', 'warning');
        Game.phase = 'spin';
        renderPhase();
        try {
            const result = await executeFortuneParticipate(Game.wager, Game.mode === 'jackpot' ? [Game.guess] : Game.guesses, Game.mode === 'combo', null);
            if (result?.success) { Game.gameId = result.gameId; setTimeout(() => pollResult(result.gameId), 3000); }
            else { Game.phase = 'wager'; renderPhase(); }
        } catch (e) { showToast('Error: ' + e.message, 'error'); Game.phase = 'wager'; renderPhase(); }
    });
}

// ============================================================================
// PHASE 4: SPIN - ROULETTE ANIMATION 🎰
// ============================================================================
function renderSpin(container) {
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const tiersToShow = isJackpot ? [TIERS[2]] : TIERS;
    
    container.innerHTML = `
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6">
            <!-- Title -->
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-white mb-1">🎰 Rolling<span class="waiting-dots"></span></h2>
                <p class="text-zinc-400 text-sm">Oracle is choosing the numbers</p>
            </div>
            
            <!-- Spinning Roulettes -->
            <div class="flex justify-center gap-4 mb-6">
                ${tiersToShow.map((tier, idx) => `
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${tier.emoji} ${tier.name}</p>
                        <div class="roulette-box relative w-20 h-24 rounded-2xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} overflow-hidden roulette-glow" 
                             style="--glow-color: ${tier.hex}50" 
                             id="roulette-${idx}">
                            <!-- Spinning number -->
                            <div class="absolute inset-0 flex items-center justify-center">
                                <span class="roulette-num text-4xl font-black ${tier.textColor}" id="spin-num-${idx}">?</span>
                            </div>
                            <!-- Top/Bottom fade gradient -->
                            <div class="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/60"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Your picks (fixed below) -->
            <div class="border-t border-zinc-700/50 pt-5">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🎯 Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${(isJackpot ? [{ tier: TIERS[2], pick: picks[0] }] : picks.map((p, i) => ({ tier: TIERS[i], pick: p }))).map(({ tier, pick }) => `
                        <div class="text-center">
                            <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center">
                                <span class="text-2xl font-black ${tier.textColor}">${pick}</span>
                            </div>
                            <p class="text-xs ${tier.textColor} mt-1 font-medium">${tier.name}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <p class="text-xs text-zinc-500 mt-6 text-center"><i class="fa-solid fa-clock mr-1"></i>May take up to 30s</p>
        </div>
    `;
    
    // Start spinning animations
    startSpinningAnimations(tiersToShow);
}

function startSpinningAnimations(tiers) {
    // Clear any existing intervals
    Game.spinIntervals.forEach(id => clearInterval(id));
    Game.spinIntervals = [];
    
    tiers.forEach((tier, idx) => {
        const numEl = document.getElementById(`spin-num-${idx}`);
        if (!numEl) return;
        
        let speed = 50; // Initial speed in ms
        
        const spin = () => {
            const randomNum = Math.floor(Math.random() * tier.range) + 1;
            numEl.textContent = randomNum;
            numEl.style.transform = `scale(${0.8 + Math.random() * 0.4})`;
        };
        
        // Start fast spinning
        const intervalId = setInterval(spin, speed);
        Game.spinIntervals.push(intervalId);
    });
}

// ============================================================================
// PHASE 5: RESULT - EPIC REVEAL & WIN ANIMATION 🏆
// ============================================================================
function renderResult(container) {
    const result = Game.result;
    if (!result) return renderPhase();
    
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const results = result.results || result.randomNumbers || result.rolls || [];
    const tiersToShow = isJackpot ? [TIERS[2]] : TIERS;
    
    const matches = picks.map((pick, i) => {
        const roll = results[i] !== undefined ? Number(results[i]) : null;
        return roll !== null && roll === pick;
    });
    const matchCount = matches.filter(m => m).length;
    const isWin = matchCount > 0;
    
    let multiplier = 0;
    if (isJackpot && matches[0]) {
        multiplier = 100;
    } else if (!isJackpot) {
        matches.forEach((hit, i) => { if (hit) multiplier += TIERS[i].multiplier; });
    }
    const estimatedPrize = Game.wager * multiplier;
    
    // First render the spinning state, then animate to reveal
    container.innerHTML = `
        <div class="bg-gradient-to-br ${isWin ? 'from-emerald-900/30 to-green-900/10 border-emerald-500/30' : 'from-zinc-900 to-zinc-800/50 border-zinc-700/50'} border rounded-2xl p-6 relative overflow-hidden" id="result-container">
            
            <!-- Reveal Area -->
            <div class="text-center mb-6">
                <h2 class="text-xl font-bold text-white mb-4" id="result-title">🔮 Revealing<span class="waiting-dots"></span></h2>
            </div>
            
            <!-- Oracle Numbers with reveal animation -->
            <div class="flex justify-center gap-4 mb-6" id="oracle-numbers">
                ${tiersToShow.map((tier, idx) => `
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${tier.emoji} ${tier.name}</p>
                        <div class="oracle-box relative w-20 h-24 rounded-2xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center overflow-hidden" 
                             id="oracle-${idx}"
                             style="--glow-color: ${tier.hex}50">
                            <span class="oracle-num text-4xl font-black ${tier.textColor}" id="oracle-num-${idx}">?</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Your picks -->
            <div class="border-t border-zinc-700/50 pt-5 mb-6">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🎯 Your Numbers</p>
                <div class="flex justify-center gap-4" id="your-picks">
                    ${tiersToShow.map((tier, idx) => {
                        const pick = isJackpot ? picks[0] : picks[idx];
                        return `
                            <div class="text-center" id="pick-container-${idx}">
                                <div class="pick-box w-16 h-16 rounded-xl bg-gradient-to-br ${tier.bgFrom} ${tier.bgTo} border-2 ${tier.borderColor} flex items-center justify-center" id="pick-${idx}">
                                    <span class="text-2xl font-black ${tier.textColor}">${pick}</span>
                                </div>
                                <p class="text-xs text-zinc-500 mt-1" id="pick-label-${idx}">${tier.name}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Result message (hidden initially) -->
            <div id="result-message" class="hidden text-center mb-5"></div>
            
            <button id="btn-new-game" class="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl opacity-0 transition-opacity duration-500"><i class="fa-solid fa-paw mr-2"></i>Play Again</button>
        </div>
    `;
    
    // Start the reveal animation sequence
    animateReveal(tiersToShow, results, picks, matches, isWin, estimatedPrize, isJackpot);
    
    document.getElementById('btn-new-game')?.addEventListener('click', () => { 
        Game.phase = 'select'; 
        Game.result = null; 
        renderPhase(); 
        loadPoolData(); 
    });
}

function animateReveal(tiers, results, picks, matches, isWin, prize, isJackpot) {
    const delays = tiers.map((_, i) => 800 + i * 1000); // Stagger reveals
    
    // Start with spinning numbers
    tiers.forEach((tier, idx) => {
        const numEl = document.getElementById(`oracle-num-${idx}`);
        if (!numEl) return;
        
        // Spin for a while then reveal
        let spinSpeed = 50;
        const spinInterval = setInterval(() => {
            const randomNum = Math.floor(Math.random() * tier.range) + 1;
            numEl.textContent = randomNum;
        }, spinSpeed);
        
        // After delay, slow down and reveal
        setTimeout(() => {
            // Slow down phase
            let currentSpeed = 50;
            clearInterval(spinInterval);
            
            const slowDown = setInterval(() => {
                currentSpeed += 30;
                const randomNum = Math.floor(Math.random() * tier.range) + 1;
                numEl.textContent = randomNum;
                
                if (currentSpeed > 300) {
                    clearInterval(slowDown);
                    // Final reveal
                    const actualResult = Number(results[idx]);
                    const pick = isJackpot ? picks[0] : picks[idx];
                    const isMatch = actualResult === pick;
                    
                    // Reveal animation
                    numEl.textContent = actualResult;
                    numEl.classList.add('number-reveal');
                    
                    const box = document.getElementById(`oracle-${idx}`);
                    const pickBox = document.getElementById(`pick-${idx}`);
                    const pickLabel = document.getElementById(`pick-label-${idx}`);
                    
                    if (isMatch) {
                        // Match! Green glow and pulse
                        box.classList.add('match-pulse');
                        box.style.borderColor = '#10b981';
                        box.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.6)';
                        numEl.classList.remove(tiers[idx].textColor.replace('text-', ''));
                        numEl.classList.add('text-emerald-400');
                        
                        pickBox.classList.add('match-pulse');
                        pickBox.style.borderColor = '#10b981';
                        pickBox.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.1))';
                        pickLabel.textContent = '✓ MATCH!';
                        pickLabel.className = 'text-xs text-emerald-400 mt-1 font-bold';
                    } else {
                        // Miss - shake and gray
                        box.classList.add('miss-shake');
                        box.style.opacity = '0.5';
                        box.style.filter = 'grayscale(0.5)';
                        
                        pickBox.style.opacity = '0.5';
                        pickLabel.textContent = '✗ Miss';
                        pickLabel.className = 'text-xs text-red-400 mt-1';
                    }
                }
            }, currentSpeed);
        }, delays[idx]);
    });
    
    // After all reveals, show final result
    const totalDelay = delays[delays.length - 1] + 1500;
    setTimeout(() => {
        showFinalResult(isWin, prize);
    }, totalDelay);
}

function showFinalResult(isWin, prize) {
    const titleEl = document.getElementById('result-title');
    const messageEl = document.getElementById('result-message');
    const btnEl = document.getElementById('btn-new-game');
    const containerEl = document.getElementById('result-container');
    
    if (isWin) {
        // EPIC WIN!
        triggerEpicWinAnimation();
        triggerCoinRain();
        triggerConfetti();
        
        if (titleEl) {
            titleEl.innerHTML = '🏆 YOU WON!';
            titleEl.className = 'text-3xl font-black text-emerald-400 mb-4 epic-win-text';
        }
        
        if (messageEl) {
            messageEl.innerHTML = `
                <div class="relative overflow-hidden p-4 bg-gradient-to-r from-emerald-500/30 to-green-500/20 rounded-xl border border-emerald-500/50">
                    <div class="epic-win-shine"></div>
                    <p class="text-5xl font-black text-white mb-2">+${prize.toFixed(2)}</p>
                    <p class="text-lg text-emerald-400 font-bold">BKC Won!</p>
                </div>
            `;
            messageEl.classList.remove('hidden');
        }
        
        if (containerEl) {
            containerEl.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))';
            containerEl.style.borderColor = 'rgba(16,185,129,0.5)';
        }
    } else {
        // Not a win
        if (titleEl) {
            titleEl.innerHTML = '😿 Not this time';
            titleEl.className = 'text-2xl font-bold text-zinc-400 mb-4';
        }
        
        if (messageEl) {
            messageEl.innerHTML = `
                <p class="text-zinc-500 mb-2">Better luck next round!</p>
                <p class="text-sm text-zinc-600">The tiger will smile on you soon 🐯</p>
            `;
            messageEl.classList.remove('hidden');
        }
    }
    
    // Show play again button
    if (btnEl) {
        btnEl.style.opacity = '1';
    }
}

function triggerEpicWinAnimation() {
    // Create fireworks
    const container = document.getElementById('result-container');
    if (!container) return;
    
    const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = `${20 + Math.random() * 60}%`;
            firework.style.top = `${20 + Math.random() * 40}%`;
            firework.style.background = `radial-gradient(circle, ${colors[i % colors.length]} 0%, transparent 70%)`;
            container.appendChild(firework);
            setTimeout(() => firework.remove(), 1000);
        }, i * 200);
    }
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

function triggerConfetti() {
    document.querySelector('.confetti-container')?.remove();
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
    for (let i = 0; i < 60; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.cssText = `left:${Math.random()*100}%;color:${colors[i%colors.length]};font-size:${8+Math.random()*12}px;animation-delay:${Math.random()*2}s;animation-duration:${2+Math.random()*2}s`;
        c.textContent = ['●','■','★','🐯'][i%4];
        container.appendChild(c);
    }
    setTimeout(() => container.remove(), 5000);
}

// ============================================================================
// HELPERS
// ============================================================================
async function getFortunePoolStatus() {
    const contract = State.actionsManagerContractPublic || State.actionsManagerContract;
    if (!contract) return null;

    try {
        const [prizePool, gameCounter] = await Promise.all([
            contract.fortunePrizePool ? contract.fortunePrizePool() : Promise.resolve(0n),
            contract.fortuneGameCounter ? contract.fortuneGameCounter() : Promise.resolve(0)
        ]).catch(() => [0n, 0]);
        
        return {
            prizePool: prizePool || 0n,
            gameCounter: Number(gameCounter) || 0
        };
    } catch (e) {
        return { prizePool: 0n, gameCounter: 0 };
    }
}

async function getGameResult(gameId) {
    const contract = State.actionsManagerContractPublic || State.actionsManagerContract;
    if (!contract) return null;

    try {
        const isFulfilled = await contract.isGameFulfilled(gameId);
        
        if (!isFulfilled) {
            return { fulfilled: false, pending: true };
        }

        const results = await contract.getGameResults(gameId);
        
        return {
            fulfilled: true,
            isComplete: true,
            pending: false,
            rolls: results.map(r => Number(r)),
            results: results.map(r => Number(r)),
            randomNumbers: results.map(r => Number(r))
        };

    } catch (e) {
        return null;
    }
}

async function pollResult(gameId, attempts = 0) {
    if (attempts > 20) { showToast('Check history later', 'warning'); Game.phase = 'select'; return renderPhase(); }
    try {
        const result = await getGameResult(gameId);
        if (result?.isComplete) { Game.result = result; Game.phase = 'result'; renderPhase(); loadPoolData(); }
        else setTimeout(() => pollResult(gameId, attempts + 1), 3000);
    } catch { setTimeout(() => pollResult(gameId, attempts + 1), 3000); }
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
        if (balanceEl) balanceEl.textContent = formatBigNumber(State.currentUserBalance || 0n).toFixed(2) + ' BKC';
        loadHistory();
    } catch (e) { console.error('Pool error:', e); }
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
            if (el) el.textContent = `🏆 ${wins}/${data.games.length} wins`;
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
    } catch { }
}

function renderHistoryList(games) {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    list.innerHTML = games.map(g => {
        const isWin = g.isWin || (g.prizeWon && BigInt(g.prizeWon) > 0n);
        const prize = g.prizeWon ? formatBigNumber(BigInt(g.prizeWon)) : 0;
        const wager = g.wagerAmount ? formatBigNumber(BigInt(g.wagerAmount)) : 0;
        const time = g.timestamp ? new Date(g.timestamp._seconds * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        
        // Números apostados e do oráculo
        const guesses = g.guesses || g.details?.guesses || [];
        const rolls = g.rolls || g.details?.rolls || [];
        const guessesStr = guesses.length > 0 ? guesses.join(' • ') : '';
        const rollsStr = rolls.length > 0 ? rolls.join(' • ') : '';
        
        return `
            <a href="${g.txHash ? EXPLORER_TX + g.txHash : '#'}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group mb-1.5 bg-zinc-800/20">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center ${isWin ? 'bg-emerald-500/20' : 'bg-zinc-700/50'}">
                        <span class="text-lg">${isWin ? '🏆' : '🐯'}</span>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium flex items-center gap-2">
                            ${isWin ? '<span class="text-emerald-400">Winner!</span>' : 'Played'}
                            ${guessesStr ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold" style="background: rgba(249,115,22,0.2); color: #f97316">🎯 ${guessesStr}</span>` : ''}
                        </p>
                        <div class="flex items-center gap-2 mt-0.5">
                            <p class="text-zinc-600 text-[10px]">${time}</p>
                            ${rollsStr ? `<span class="text-[10px] text-fuchsia-400">🔮 ${rollsStr}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold ${isWin ? 'text-emerald-400' : 'text-zinc-400'}">${isWin ? '+' + prize.toFixed(2) : '-' + wager.toFixed(2)} BKC</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `;
    }).join('');
}

export function cleanup() {
    // Clear any running spin intervals
    Game.spinIntervals.forEach(id => clearInterval(id));
    Game.spinIntervals = [];
}
export const FortunePoolPage = { render, cleanup };
export default { render, cleanup };