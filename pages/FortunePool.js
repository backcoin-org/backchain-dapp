// js/pages/FortunePool.js
// ✅ VERSION V10.0: Prize display, social sharing (Twitter/Telegram/WhatsApp), confetti, viral incentive 1000 BKC

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

// TIERS CONFIG - MUST MATCH CONTRACT ORDER!
// Contract expects guesses in order: [tier1, tier2, tier3] = [easy, medium, hard]
// Combo mode plays all 3 tiers, prizes stack
const TIERS = [
    { id: 1, name: "Easy",   range: 3,   multiplier: 2,   color: "cyan",   chance: "33%" },   // 1/3 = 33%
    { id: 2, name: "Medium", range: 10,  multiplier: 5,   color: "purple", chance: "10%" },   // 1/10 = 10%
    { id: 3, name: "Hard",   range: 100, multiplier: 100, color: "amber",  chance: "1%" }     // 1/100 = 1%
];

// Jackpot mode = only tier 3 (1/100 for 100x)
const JACKPOT_TIER = TIERS[2]; // Hard tier

// Max combo win: 2 + 5 + 100 = 107x (if you hit all 3)
const MAX_COMBO_MULTIPLIER = 107;

// ============================================================================
// GAME STATE
// ============================================================================
const Game = {
    mode: null,        // 'jackpot' | 'combo'
    phase: 'select',   // 'select' | 'pick' | 'wager' | 'spin' | 'result'
    guess: 50,         // For jackpot: 1-100
    guesses: [1, 1, 1], // For combo: [tier0, tier1, tier2]
    comboStep: 0,      // 0, 1, 2 for combo picking
    wager: 10,
    gameId: null,
    result: null,
    poolStatus: null,
    history: []
};

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('fortune-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'fortune-styles';
    style.textContent = `
        .fortune-glow { box-shadow: 0 0 30px rgba(245,158,11,0.3); }
        
        /* Slot Machine Animation */
        .slot-container {
            box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }
        .slot-reel {
            transition: none;
        }
        @keyframes slotSpin {
            0% { transform: translateY(0); }
            100% { transform: translateY(-400px); }
        }
        
        /* Custom Slider */
        input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
            cursor: pointer;
        }
        input[type="range"]::-webkit-slider-runnable-track {
            height: 8px;
            border-radius: 4px;
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            border: 3px solid #000;
            box-shadow: 0 2px 10px rgba(245,158,11,0.5);
            margin-top: -8px;
            cursor: grab;
        }
        input[type="range"]::-webkit-slider-thumb:active {
            cursor: grabbing;
            transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            border: 3px solid #000;
            box-shadow: 0 2px 10px rgba(245,158,11,0.5);
            cursor: grab;
        }
        
        /* Number Grid */
        .num-btn {
            font-size: 10px;
        }
        .num-btn:hover {
            transform: scale(1.1);
            z-index: 10;
        }
        
        /* Result animations */
        .slot-hit { 
            border-color: #10b981 !important; 
            background: rgba(16,185,129,0.1) !important;
            box-shadow: 0 0 20px rgba(16,185,129,0.4);
            animation: hitPulse 0.5s ease-out;
        }
        @keyframes hitPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .slot-miss { 
            opacity: 0.5; 
            border-color: #3f3f46 !important; 
        }
        
        /* Confetti Animation for Wins */
        .confetti-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 1000;
        }
        .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            opacity: 0;
            animation: confettiFall 3s ease-out forwards;
        }
        @keyframes confettiFall {
            0% { 
                opacity: 1; 
                transform: translateY(-100px) rotate(0deg); 
            }
            100% { 
                opacity: 0; 
                transform: translateY(100vh) rotate(720deg); 
            }
        }
        
        /* Prize glow effect */
        .prize-glow {
            animation: prizeGlow 1.5s ease-in-out infinite alternate;
        }
        @keyframes prizeGlow {
            0% { box-shadow: 0 0 10px rgba(74, 222, 128, 0.3); }
            100% { box-shadow: 0 0 30px rgba(74, 222, 128, 0.6); }
        }
        
        /* Buttons */
        .digit-btn { transition: all 0.15s ease; }
        .digit-btn:hover { transform: scale(1.05); }
        .digit-btn.selected { 
            background: linear-gradient(135deg, #f59e0b, #d97706) !important; 
            color: #000 !important;
            border-color: #f59e0b !important;
            box-shadow: 0 0 15px rgba(245,158,11,0.4);
        }
        .mode-card { transition: all 0.2s ease; }
        .mode-card:hover { transform: translateY(-2px); }
        
        /* Win celebration */
        .win-pulse { animation: winPulse 0.5s ease-out; }
        @keyframes winPulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
        
        /* Confetti for wins */
        @keyframes confetti {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100px) rotate(720deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN RENDER
// ============================================================================
export function render() {
    const container = document.getElementById('actions');
    if (!container) {
        console.error('FortunePool: Container #actions not found');
        return;
    }

    injectStyles();
    
    container.innerHTML = `
        <div class="max-w-lg mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-6">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 mb-3 fortune-glow">
                    <i class="fa-solid fa-dice text-3xl text-amber-400"></i>
                </div>
                <h1 class="text-2xl font-bold text-white">Fortune Pool</h1>
                <p class="text-zinc-500 text-sm mt-1">Pick • Spin • Win</p>
            </div>

            <!-- Pool Stats Bar -->
            <div class="flex justify-between items-center p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 mb-6">
                <div class="text-center flex-1">
                    <p class="text-[10px] text-zinc-500 uppercase">Prize Pool</p>
                    <p id="prize-pool" class="text-amber-400 font-bold">--</p>
                </div>
                <div class="w-px h-8 bg-zinc-700"></div>
                <div class="text-center flex-1">
                    <p class="text-[10px] text-zinc-500 uppercase">Your Balance</p>
                    <p id="user-balance" class="text-white font-bold">--</p>
                </div>
                <div class="w-px h-8 bg-zinc-700"></div>
                <div class="text-center flex-1">
                    <p class="text-[10px] text-zinc-500 uppercase">Games</p>
                    <p id="total-games" class="text-zinc-300 font-bold">--</p>
                </div>
            </div>

            <!-- Main Game Area -->
            <div id="game-area" class="mb-6">
                <!-- Content rendered by phase -->
            </div>

            <!-- Recent Games -->
            <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
                <div class="flex items-center justify-between p-3 border-b border-zinc-800/50">
                    <span class="text-sm font-bold text-white">Recent Games</span>
                    <span id="win-rate" class="text-xs text-zinc-500">--</span>
                </div>
                <div id="history-list" class="max-h-[200px] overflow-y-auto">
                    <div class="p-6 text-center text-zinc-600 text-sm">Loading...</div>
                </div>
            </div>
        </div>
    `;

    // Initial load
    loadPoolData();
    renderPhase();
}

// ============================================================================
// PHASE ROUTER
// ============================================================================
function renderPhase() {
    const area = document.getElementById('game-area');
    if (!area) return;

    switch (Game.phase) {
        case 'select': renderModeSelect(area); break;
        case 'pick': renderPicker(area); break;
        case 'wager': renderWager(area); break;
        case 'spin': renderSpin(area); break;
        case 'result': renderResult(area); break;
        default: renderModeSelect(area);
    }
}

// ============================================================================
// PHASE 1: MODE SELECT - Clean & Clear
// ============================================================================
function renderModeSelect(container) {
    container.innerHTML = `
        <div class="space-y-3">
            <!-- Jackpot Mode - Single Tier 3 (Hard) -->
            <button id="btn-jackpot" class="mode-card w-full text-left p-4 bg-zinc-900/80 border-2 border-zinc-700 rounded-xl hover:border-amber-500/50 transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <span class="text-3xl">👑</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="text-lg font-bold text-white">Jackpot</h3>
                            <span class="text-amber-400 font-bold">100x</span>
                        </div>
                        <p class="text-zinc-400 text-sm">Pick 1 number from 1-100</p>
                        <div class="flex items-center gap-3 mt-2">
                            <span class="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                                <i class="fa-solid fa-percent text-[8px]"></i> 1% chance
                            </span>
                            <span class="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                                <i class="fa-solid fa-bolt text-[8px]"></i> Low fee
                            </span>
                        </div>
                    </div>
                </div>
            </button>

            <!-- Combo Mode - All 3 Tiers -->
            <button id="btn-combo" class="mode-card w-full text-left p-4 bg-zinc-900/80 border-2 border-zinc-700 rounded-xl hover:border-purple-500/50 transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <span class="text-3xl">🚀</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="text-lg font-bold text-white">Combo</h3>
                            <span class="text-purple-400 font-bold">up to ${MAX_COMBO_MULTIPLIER}x</span>
                        </div>
                        <p class="text-zinc-400 text-sm">Pick 3 numbers, stack your wins</p>
                        <div class="flex items-center gap-2 mt-2">
                            <span class="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">33% → 2x</span>
                            <span class="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">10% → 5x</span>
                            <span class="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">1% → 100x</span>
                        </div>
                    </div>
                </div>
            </button>
        </div>

        ${!State.isConnected ? `
            <div class="mt-4 p-3 bg-zinc-800/50 rounded-xl text-center">
                <p class="text-zinc-400 text-sm"><i class="fa-solid fa-wallet mr-2"></i>Connect wallet to play</p>
            </div>
        ` : ''}
    `;

    document.getElementById('btn-jackpot')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        Game.mode = 'jackpot';
        Game.guess = 50; // Default for tier 3 (1-100)
        Game.phase = 'pick';
        renderPhase();
    });

    document.getElementById('btn-combo')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        Game.mode = 'combo';
        // Guesses in CONTRACT ORDER: [tier1 (1-3), tier2 (1-10), tier3 (1-100)]
        // User picks in order: Easy → Medium → Hard
        Game.guesses = [1, 1, 50]; // Default picks for each tier
        Game.comboStep = 0; // Start with Easy tier
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
    const range = 100;
    const current = Game.guess;
    
    container.innerHTML = `
        <div class="text-center">
            <!-- Header similar ao Combo -->
            <h2 class="text-xl font-bold text-white mb-1">Jackpot Mode</h2>
            <p class="text-zinc-400 text-sm mb-4">Pick 1-${range} • <span class="text-green-400">1% chance</span> • <span class="text-amber-400">100x</span></p>
            
            <!-- Display -->
            <div class="text-5xl font-black text-amber-400 mb-4" id="jackpot-number">${current}</div>
            
            <!-- Slider -->
            <div class="mb-4 px-4">
                <input type="range" id="number-slider" min="1" max="${range}" value="${current}" 
                    class="w-full h-3 rounded-full appearance-none cursor-pointer"
                    style="background: linear-gradient(to right, #f59e0b 0%, #f59e0b ${current}%, #27272a ${current}%, #27272a 100%)">
                <div class="flex justify-between text-xs text-zinc-600 mt-1">
                    <span>1</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                </div>
            </div>
            
            <!-- Quick Pick Grid - 10 columns x 10 rows -->
            <div class="mb-6">
                <p class="text-xs text-zinc-500 mb-2 uppercase">Quick Pick</p>
                <div class="grid gap-1 max-w-xs mx-auto" style="grid-template-columns: repeat(10, minmax(0, 1fr))">
                    ${Array.from({length: range}, (_, i) => i + 1).map(n => `
                        <button class="num-btn w-7 h-7 rounded-lg text-xs font-bold transition-all ${current === n ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}" 
                                data-num="${n}">${n}</button>
                    `).join('')}
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    Back
                </button>
                <button id="btn-next" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    Set Wager →
                </button>
            </div>
        </div>
    `;

    const slider = document.getElementById('number-slider');
    const display = document.getElementById('jackpot-number');
    
    // Update number
    const updateNumber = (num) => {
        Game.guess = num;
        if (display) display.textContent = num;
        if (slider) {
            slider.value = num;
            slider.style.background = `linear-gradient(to right, #f59e0b 0%, #f59e0b ${num}%, #27272a ${num}%, #27272a 100%)`;
        }
        
        // Update grid selection
        document.querySelectorAll('.num-btn').forEach(btn => {
            const btnNum = parseInt(btn.dataset.num);
            if (btnNum === num) {
                btn.classList.remove('bg-zinc-800', 'text-zinc-400', 'hover:bg-zinc-700');
                btn.classList.add('bg-amber-500', 'text-black');
            } else {
                btn.classList.remove('bg-amber-500', 'text-black');
                btn.classList.add('bg-zinc-800', 'text-zinc-400', 'hover:bg-zinc-700');
            }
        });
    };

    // Slider event
    if (slider) {
        slider.addEventListener('input', (e) => {
            updateNumber(parseInt(e.target.value));
        });
    }

    // Grid click
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            updateNumber(parseInt(btn.dataset.num));
        });
    });

    document.getElementById('btn-back')?.addEventListener('click', () => {
        Game.phase = 'select';
        renderPhase();
    });

    document.getElementById('btn-next')?.addEventListener('click', () => {
        Game.phase = 'wager';
        renderPhase();
    });
}

function renderComboPicker(container) {
    // Use TIERS array which matches contract configuration
    const tier = TIERS[Game.comboStep];
    const current = Game.guesses[Game.comboStep];
    const range = tier.range;
    
    // Determina se precisa de slider (para ranges grandes)
    const needsSlider = range > 10;

    container.innerHTML = `
        <div class="text-center">
            <!-- Progress -->
            <div class="flex justify-center gap-2 mb-4">
                ${TIERS.map((t, i) => `
                    <div class="flex items-center gap-1 px-3 py-1.5 rounded-full ${i === Game.comboStep ? 'bg-zinc-700 border border-zinc-600' : 'bg-zinc-800/50'} transition-all">
                        <span class="text-xs ${i === Game.comboStep ? 'text-white font-bold' : i < Game.comboStep ? 'text-green-400' : 'text-zinc-500'}">
                            ${i < Game.comboStep ? '✓' : t.multiplier + 'x'}
                        </span>
                    </div>
                `).join('')}
            </div>

            <h2 class="text-xl font-bold text-white mb-1">${tier.name} Tier</h2>
            <p class="text-zinc-400 text-sm mb-4">Pick 1-${range} • <span class="text-green-400">${tier.chance} chance</span> • <span class="text-amber-400">${tier.multiplier}x</span></p>

            <!-- Display -->
            <div class="text-5xl font-black text-amber-400 mb-4" id="combo-number">${current}</div>
            
            ${needsSlider ? `
                <!-- Slider para ranges grandes -->
                <div class="mb-4 px-4">
                    <input type="range" id="number-slider" min="1" max="${range}" value="${current}" 
                        class="w-full h-3 rounded-full appearance-none cursor-pointer"
                        style="background: linear-gradient(to right, #f59e0b 0%, #f59e0b ${(current/range)*100}%, #27272a ${(current/range)*100}%, #27272a 100%)">
                    <div class="flex justify-between text-xs text-zinc-600 mt-1">
                        <span>1</span>
                        <span>${Math.floor(range/4)}</span>
                        <span>${Math.floor(range/2)}</span>
                        <span>${Math.floor(range*3/4)}</span>
                        <span>${range}</span>
                    </div>
                </div>
            ` : ''}

            <!-- Number Grid -->
            <div class="mb-6">
                ${needsSlider ? `<p class="text-xs text-zinc-500 mb-2 uppercase">Quick Pick</p>` : ''}
                <div class="grid gap-1.5 max-w-xs mx-auto" style="grid-template-columns: repeat(${range <= 5 ? range : 10}, minmax(0, 1fr))">
                    ${Array.from({length: range}, (_, i) => i + 1).map(n => `
                        <button class="num-btn ${range <= 10 ? 'w-10 h-10' : 'w-7 h-7'} rounded-lg text-xs font-bold transition-all ${current === n ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}" 
                                data-num="${n}">${n}</button>
                    `).join('')}
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    ${Game.comboStep > 0 ? '← Previous' : 'Back'}
                </button>
                <button id="btn-next" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    ${Game.comboStep < 2 ? 'Next Tier →' : 'Set Wager →'}
                </button>
            </div>
        </div>
    `;

    const display = document.getElementById('combo-number');
    const slider = document.getElementById('number-slider');
    
    // Função para atualizar seleção
    const updateNumber = (num) => {
        Game.guesses[Game.comboStep] = num;
        if (display) display.textContent = num;
        if (slider) {
            slider.value = num;
            slider.style.background = `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(num/range)*100}%, #27272a ${(num/range)*100}%, #27272a 100%)`;
        }
        
        // Update grid selection
        document.querySelectorAll('.num-btn').forEach(btn => {
            const btnNum = parseInt(btn.dataset.num);
            if (btnNum === num) {
                btn.classList.remove('bg-zinc-800', 'text-zinc-400', 'hover:bg-zinc-700');
                btn.classList.add('bg-amber-500', 'text-black');
            } else {
                btn.classList.remove('bg-amber-500', 'text-black');
                btn.classList.add('bg-zinc-800', 'text-zinc-400', 'hover:bg-zinc-700');
            }
        });
    };

    // Slider event
    if (slider) {
        slider.addEventListener('input', (e) => {
            updateNumber(parseInt(e.target.value));
        });
    }

    // Grid click
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            updateNumber(parseInt(btn.dataset.num));
        });
    });

    document.getElementById('btn-back')?.addEventListener('click', () => {
        if (Game.comboStep > 0) {
            Game.comboStep--;
            renderPhase();
        } else {
            Game.phase = 'select';
            renderPhase();
        }
    });

    document.getElementById('btn-next')?.addEventListener('click', () => {
        if (Game.comboStep < 2) {
            Game.comboStep++;
            renderPhase();
        } else {
            Game.phase = 'wager';
            renderPhase();
        }
    });
}

// ============================================================================
// PHASE 3: WAGER
// ============================================================================
function renderWager(container) {
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const maxMulti = isJackpot ? 100 : MAX_COMBO_MULTIPLIER;
    const userBalance = State.currentUserBalance || 0n;
    const balanceNum = formatBigNumber(userBalance);
    const hasNoBalance = balanceNum < 0.01;

    container.innerHTML = `
        <div>
            <!-- Summary -->
            <div class="text-center mb-6">
                <p class="text-zinc-400 text-sm mb-2">Your ${isJackpot ? 'pick' : 'picks'}</p>
                <div class="flex justify-center gap-3">
                    ${isJackpot ? `
                        <div class="text-center">
                            <div class="w-16 h-16 rounded-xl bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center">
                                <span class="text-2xl font-bold text-amber-400">${picks[0]}</span>
                            </div>
                            <p class="text-xs text-amber-400 mt-1">100x</p>
                        </div>
                    ` : picks.map((p, i) => `
                        <div class="text-center">
                            <div class="w-14 h-14 rounded-xl bg-${TIERS[i].color}-500/10 border-2 border-${TIERS[i].color}-500/50 flex items-center justify-center">
                                <span class="text-xl font-bold text-${TIERS[i].color}-400">${p}</span>
                            </div>
                            <p class="text-xs text-${TIERS[i].color}-400 mt-1">${TIERS[i].multiplier}x</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${hasNoBalance ? `
                <!-- No Balance - Show Faucet Prominently -->
                <div class="mb-6 p-4 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-xl border border-red-500/30">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-exclamation-triangle text-red-400"></i>
                        </div>
                        <div>
                            <p class="text-white font-bold">No BKC Balance</p>
                            <p class="text-xs text-zinc-400">You need BKC tokens to play</p>
                        </div>
                    </div>
                    <button id="btn-faucet" class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all">
                        <i class="fa-solid fa-faucet mr-2"></i> Get Free 1000 BKC + ETH
                    </button>
                </div>
            ` : `
                <!-- Wager Input -->
                <div class="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50 mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-zinc-400 text-sm">Wager Amount</span>
                        <span class="text-xs text-zinc-500">Balance: <span class="text-amber-400">${balanceNum.toFixed(2)} BKC</span></span>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="number" id="wager-input" value="${Game.wager || 10}" min="1" step="any"
                            class="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-xl font-bold text-white outline-none focus:border-amber-500 transition-colors text-right">
                        <span class="text-amber-500 font-bold">BKC</span>
                    </div>
                    <div class="flex gap-2 mt-3">
                        <button class="quick-bet flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-lg" data-amt="10">+10</button>
                        <button class="quick-bet flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-lg" data-amt="50">+50</button>
                        <button class="quick-bet flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-lg" data-amt="100">+100</button>
                        <button id="btn-max" class="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-bold rounded-lg">MAX</button>
                    </div>
                </div>

                <!-- Potential Win -->
                <div class="bg-green-900/20 rounded-xl p-4 border border-green-500/20 mb-6 text-center">
                    <p class="text-green-400 text-xs uppercase mb-1">Potential Win</p>
                    <p id="potential-win" class="text-2xl font-bold text-green-400">--</p>
                    <p class="text-xs text-zinc-500 mt-1">Max ${maxMulti}x multiplier</p>
                </div>
            `}

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl">
                    ← Back
                </button>
                ${!hasNoBalance ? `
                    <button id="btn-play" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl disabled:opacity-50">
                        🎰 SPIN
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    // Only setup wager controls if user has balance
    if (!hasNoBalance) {
        const wagerInput = document.getElementById('wager-input');
        const potentialWin = document.getElementById('potential-win');
        const playBtn = document.getElementById('btn-play');

        const updatePotential = () => {
            const w = parseFloat(wagerInput.value) || 0;
            Game.wager = w;
            potentialWin.textContent = w > 0 ? `+${(w * maxMulti).toFixed(2)} BKC` : '--';
            
            // Disable if no wager or insufficient balance
            const hasEnoughBalance = w > 0 && w <= balanceNum;
            playBtn.disabled = !hasEnoughBalance;
            
            if (w > balanceNum && w > 0) {
                playBtn.textContent = '⚠️ Insufficient Balance';
            } else {
                playBtn.textContent = '🎰 SPIN';
            }
        };

        wagerInput.addEventListener('input', updatePotential);
        updatePotential();

        document.querySelectorAll('.quick-bet').forEach(btn => {
            btn.addEventListener('click', () => {
                const current = parseFloat(wagerInput.value) || 0;
                wagerInput.value = (current + parseFloat(btn.dataset.amt)).toFixed(2);
                updatePotential();
            });
        });

        document.getElementById('btn-max')?.addEventListener('click', () => {
            wagerInput.value = Math.floor(balanceNum).toString();
            updatePotential();
        });

        playBtn.addEventListener('click', executeGame);
    }

    document.getElementById('btn-back')?.addEventListener('click', () => {
        Game.phase = 'pick';
        if (Game.mode === 'combo') Game.comboStep = 2;
        renderPhase();
    });

    // Faucet button
    document.getElementById('btn-faucet')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Claiming...';
        try {
            const res = await fetch(`${FAUCET_API}?address=${State.userAddress}`);
            const data = await res.json();
            if (data.success) {
                showToast('🎉 1000 BKC + 0.01 ETH received!', 'success');
                btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Tokens Received!';
                // Refresh balance after a few seconds
                setTimeout(async () => {
                    await loadUserData();
                    renderPhase();
                }, 5000);
            } else {
                showToast(data.error || 'Faucet error', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-faucet mr-2"></i> Get Free 1000 BKC + ETH';
            }
        } catch (e) {
            showToast('Faucet error: ' + e.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-faucet mr-2"></i> Get Free 1000 BKC + ETH';
        }
    });
}

// ============================================================================
// PHASE 4: SPINNING
// ============================================================================
async function executeGame() {
    if (!State.isConnected) return showToast('Connect wallet first', 'warning');
    if (Game.wager <= 0) return showToast('Enter wager amount', 'warning');

    // Check balance before attempting
    const userBalance = State.currentUserBalance || 0n;
    const wagerWei = ethers.parseEther(Game.wager.toString());
    
    if (userBalance < wagerWei) {
        showToast('Insufficient BKC balance. Use faucet to get tokens.', 'error');
        return;
    }

    const isJackpot = Game.mode === 'jackpot';
    
    // IMPORTANT: For jackpot send array with 1 element, for combo send all 3
    // Contract expects: [tier1_guess, tier2_guess, tier3_guess] for combo
    // Or: [tier3_guess] for jackpot (single tier)
    const guesses = isJackpot ? [Game.guess] : [...Game.guesses];
    const isCumulative = !isJackpot;

    // Debug log - THIS IS IMPORTANT
    console.log('🎰 Executing game:', { 
        mode: Game.mode, 
        guesses: guesses,
        guessesDetails: isJackpot 
            ? `Jackpot: pick ${guesses[0]} in range 1-100` 
            : `Combo: Easy=${guesses[0]} (1-3), Medium=${guesses[1]} (1-10), Hard=${guesses[2]} (1-100)`,
        isCumulative, 
        wager: Game.wager,
        wagerWei: wagerWei.toString(),
        userBalance: userBalance.toString()
    });

    // Validate guesses for combo mode
    if (!isJackpot) {
        // Check each guess is in valid range for its tier
        for (let i = 0; i < 3; i++) {
            if (guesses[i] < 1 || guesses[i] > TIERS[i].range) {
                showToast(`${TIERS[i].name} tier: pick must be 1-${TIERS[i].range}, got ${guesses[i]}`, 'error');
                return;
            }
        }
    } else {
        // Jackpot: single guess for tier 3 (1-100)
        if (guesses[0] < 1 || guesses[0] > 100) {
            showToast(`Pick must be 1-100, got ${guesses[0]}`, 'error');
            return;
        }
    }

    Game.phase = 'spin';
    renderPhase();

    // Progress tracker durante a transação
    let progress = 5;
    const progressInterval = setInterval(() => {
        if (progress < 35) {
            progress += 2;
            const messages = ['Checking wallet...', 'Approving tokens...', 'Submitting to blockchain...', 'Confirming transaction...'];
            const msgIndex = Math.floor(progress / 10);
            updateSpinStatus(messages[Math.min(msgIndex, messages.length - 1)], progress);
        }
    }, 500);

    try {
        const result = await executeFortuneParticipate(
            wagerWei,
            guesses,
            isCumulative,
            null  // Don't pass element - we handle status ourselves
        );
        
        clearInterval(progressInterval);

        if (result && result.success) {
            Game.gameId = result.gameId;
            updateSpinStatus('🔮 Waiting for Fortune Oracle...', 40);
            pollForResult(result.gameId);
        } else {
            clearInterval(progressInterval);
            Game.phase = 'wager';
            renderPhase();
            if (result?.error) {
                showToast(result.error, 'error');
            }
        }
    } catch (e) {
        clearInterval(progressInterval);
        console.error('Game error:', e);
        Game.phase = 'wager';
        renderPhase();
        
        // Parse error message
        let errorMsg = 'Transaction failed';
        if (e.message) {
            if (e.message.includes('insufficient')) {
                errorMsg = 'Insufficient balance or allowance';
            } else if (e.message.includes('user rejected')) {
                errorMsg = 'Transaction cancelled';
            } else if (e.message.includes('reverted')) {
                errorMsg = 'Contract rejected transaction. Check balance and allowance.';
            }
        }
        showToast(errorMsg, 'error');
    }
}

function renderSpin(container) {
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const tierNames = isJackpot ? ['Jackpot'] : TIERS.map(t => t.name);
    const tierColors = isJackpot ? ['amber'] : TIERS.map(t => t.color);

    container.innerHTML = `
        <div class="text-center py-6">
            <!-- Slot Machine -->
            <div class="flex justify-center gap-3 mb-6">
                ${picks.map((p, i) => `
                    <div class="text-center">
                        <p class="text-xs text-${tierColors[i]}-400 mb-2 font-bold">${tierNames[i]}</p>
                        <div class="slot-container w-16 h-20 rounded-xl bg-black border-2 border-${tierColors[i]}-500/50 overflow-hidden relative">
                            <div id="slot-reel-${i}" class="slot-reel absolute w-full">
                                ${generateSlotNumbers(TIERS[isJackpot ? 2 : i].range)}
                            </div>
                        </div>
                        <p class="text-xs text-zinc-600 mt-1">You: <span class="text-white">${p}</span></p>
                    </div>
                `).join('')}
            </div>

            <!-- Single Status Area - Only progress bar, no extra spinner -->
            <div class="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 mb-4">
                <p id="spin-status" class="text-lg font-bold text-amber-400 mb-3">Submitting...</p>
                
                <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div id="spin-progress" class="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500" style="width: 5%"></div>
                </div>
            </div>
            
            <p class="text-xs text-zinc-500">
                <i class="fa-solid fa-wand-magic-sparkles mr-1 text-purple-400"></i>
                🔮 Fortune Oracle revealing your destiny...
            </p>
        </div>
    `;

    // Start slot animations
    startSlotAnimation(picks.length);
}

function generateSlotNumbers(range) {
    // Generate limited numbers for slot effect (max 20 for performance)
    let html = '';
    const numbersToShow = Math.min(range, 10);
    
    for (let round = 0; round < 4; round++) {
        for (let i = 1; i <= numbersToShow; i++) {
            // For large ranges, show random samples
            const num = range > 10 ? Math.floor(Math.random() * range) + 1 : i;
            html += `<div class="slot-number h-20 flex items-center justify-center text-2xl font-black text-amber-400">${num}</div>`;
        }
    }
    return html;
}

function startSlotAnimation(numSlots) {
    for (let i = 0; i < numSlots; i++) {
        const reel = document.getElementById(`slot-reel-${i}`);
        if (reel) {
            // Different speed for each reel
            const duration = 0.5 + (i * 0.3);
            reel.style.animation = `slotSpin ${duration}s linear infinite`;
        }
    }
}

function updateSpinStatus(text, progress) {
    const status = document.getElementById('spin-status');
    const bar = document.getElementById('spin-progress');
    if (status) status.textContent = text;
    if (bar) bar.style.width = `${progress}%`;
}

async function pollForResult(gameId, attempts = 0) {
    if (attempts > 60) { // 60 seconds timeout
        Game.phase = 'wager';
        renderPhase();
        showToast('Game timeout. Check history.', 'warning');
        return;
    }

    // Mensagens rotativas para engajar o usuário
    const oracleMessages = [
        '🔮 Fortune Oracle processing...',
        '✨ Oracle consulting the stars...',
        '🎲 Generating random numbers...',
        '🔮 Oracle revealing destiny...',
        '⚡ Blockchain confirming...'
    ];
    const msgIndex = Math.floor(attempts / 3) % oracleMessages.length;
    updateSpinStatus(oracleMessages[msgIndex], Math.min(40 + attempts, 95));

    try {
        const result = await getGameResult(gameId);
        
        if (result && result.fulfilled) {
            updateSpinStatus('🎉 Result received!', 100);
            await new Promise(r => setTimeout(r, 500)); // Brief pause for effect
            Game.result = result;
            Game.phase = 'result';
            renderPhase();
            loadHistory();
            return;
        }
    } catch (e) {
        console.log('Polling...', attempts);
    }

    setTimeout(() => pollForResult(gameId, attempts + 1), 1000);
}

// ============================================================================
// PHASE 5: RESULT
// ============================================================================
function renderResult(container) {
    const r = Game.result;
    if (!r) return;

    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;
    const rolls = r.rolls || [];
    const prize = r.prizeWon || 0n;
    const prizeNum = formatBigNumber(prize);
    const wagerNum = Game.wager || 0;
    
    // Count matches
    const matches = picks.map((pick, i) => {
        const roll = rolls[i] !== undefined ? Number(rolls[i]) : null;
        return roll !== null && roll == pick;
    });
    const matchCount = matches.filter(m => m).length;
    
    // Determine win state
    const hasMatches = matchCount > 0;
    const hasPrize = prize > 0n;
    const isWin = hasPrize || hasMatches;
    
    // Calculate multiplier for display
    let expectedMulti = 0;
    if (!isJackpot) {
        matches.forEach((hit, i) => {
            if (hit) expectedMulti += TIERS[i].multiplier;
        });
    } else if (matches[0]) {
        expectedMulti = 100;
    }

    // Se ganhou, dispara confetti
    if (isWin) {
        triggerConfetti();
    }

    // Mensagem para compartilhamento
    const modeName = isJackpot ? 'Jackpot' : 'Combo';
    const prizeText = hasPrize ? prizeNum.toFixed(2) : (wagerNum * expectedMulti).toFixed(2);
    const shareMessage = isWin 
        ? `🎉 I just won ${prizeText} BKC playing Fortune Pool ${modeName} mode! 🐯\n\n🔮 The Oracle revealed: [${rolls.join(', ')}]\n🎯 My picks: [${picks.join(', ')}]\n💰 ${expectedMulti}x multiplier!\n\nTry your luck at BKC Fortune Pool! 🚀`
        : `🐯 Just played Fortune Pool! The Oracle said [${rolls.join(', ')}], I picked [${picks.join(', ')}]. So close! Next time I'll win big! 🎰`;
    
    const shareUrl = window.location.origin || 'https://bkc.app';
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(shareUrl);

    container.innerHTML = `
        <div class="text-center py-4">
            <!-- Result Header -->
            <div class="mb-4 win-pulse">
                ${isWin ? `
                    <div class="text-6xl mb-2">🎉</div>
                    <h2 class="text-2xl font-bold text-green-400">${matchCount === picks.length ? '🏆 JACKPOT!' : 'YOU WON!'}</h2>
                    
                    <!-- Prize Display - Destacado -->
                    <div class="mt-3 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl border border-green-500/30 prize-glow">
                        <p class="text-xs text-green-400/80 uppercase mb-1">Your Prize</p>
                        <p class="text-4xl font-black text-green-400">+${prizeText} BKC</p>
                        <p class="text-sm text-zinc-400 mt-1">${expectedMulti}x multiplier on ${wagerNum} BKC wager</p>
                    </div>
                ` : `
                    <div class="text-5xl mb-2">🐯</div>
                    <h2 class="text-2xl font-bold text-zinc-400">No Match</h2>
                    <p class="text-zinc-500 mt-1">The Tiger wasn't lucky this time!</p>
                `}
            </div>

            <!-- Oracle Result Display -->
            <div class="mb-4">
                <p class="text-xs text-purple-400 uppercase mb-2">
                    <i class="fa-solid fa-eye mr-1"></i> Fortune Oracle Revealed
                </p>
                <div class="flex justify-center gap-3">
                    ${picks.map((pick, i) => {
                        const roll = rolls[i] !== undefined ? Number(rolls[i]) : '?';
                        const hit = matches[i];
                        const tierInfo = isJackpot ? { name: 'Jackpot', multiplier: 100, color: 'amber' } : TIERS[i];
                        return `
                            <div class="text-center">
                                <p class="text-[10px] text-${tierInfo.color}-400 mb-1 font-bold uppercase">${tierInfo.name}</p>
                                <div class="w-14 h-14 rounded-xl bg-zinc-900 border-2 ${hit ? 'slot-hit' : 'slot-miss'} flex items-center justify-center relative">
                                    <span class="text-xl font-black ${hit ? 'text-green-400' : 'text-zinc-500'}">${roll}</span>
                                    ${hit ? '<div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><i class="fa-solid fa-check text-white text-[8px]"></i></div>' : ''}
                                </div>
                                <p class="text-[10px] mt-1 ${hit ? 'text-green-400 font-bold' : 'text-zinc-600'}">
                                    You: ${pick}
                                </p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            ${isWin ? `
                <!-- Share Section - Incentivo de Viralização -->
                <div class="mb-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30">
                    <div class="flex items-center justify-center gap-2 mb-3">
                        <i class="fa-solid fa-bullhorn text-purple-400"></i>
                        <p class="text-sm font-bold text-white">Share & Earn 1000 BKC!</p>
                    </div>
                    <p class="text-xs text-zinc-400 mb-3">Post your win on social media and claim 1000 BKC test tokens!</p>
                    
                    <!-- Social Buttons -->
                    <div class="flex justify-center gap-2">
                        <a href="https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}" 
                           target="_blank" 
                           class="flex items-center gap-2 px-4 py-2 bg-black hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all border border-zinc-700">
                            <i class="fa-brands fa-x-twitter"></i>
                            <span>Post</span>
                        </a>
                        <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}" 
                           target="_blank" 
                           class="flex items-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm font-bold rounded-lg transition-all">
                            <i class="fa-brands fa-telegram"></i>
                            <span>Share</span>
                        </a>
                        <a href="https://wa.me/?text=${encodedMessage}%20${encodedUrl}" 
                           target="_blank" 
                           class="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold rounded-lg transition-all">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                    </div>
                    
                    <p class="text-[10px] text-zinc-500 mt-2">
                        <i class="fa-solid fa-gift mr-1"></i>
                        After posting, use the Faucet to claim your bonus!
                    </p>
                </div>
            ` : `
                <!-- Encouragement for losers -->
                <div class="mb-4 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                    <p class="text-sm text-zinc-400">
                        <i class="fa-solid fa-lightbulb text-amber-400 mr-1"></i>
                        Try <span class="text-purple-400 font-bold">Combo Mode</span> for better odds!
                    </p>
                </div>
            `}

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-new-game" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    🎰 Play Again
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-new-game')?.addEventListener('click', () => {
        Game.phase = 'select';
        Game.result = null;
        Game.gameId = null;
        renderPhase();
        loadPoolData();
    });
}

// ============================================================================
// CONFETTI CELEBRATION
// ============================================================================
function triggerConfetti() {
    // Remove container antigo se existir
    const existing = document.querySelector('.confetti-container');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    
    const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#fbbf24'];
    const shapes = ['●', '■', '▲', '★'];
    
    // Criar 50 confettis
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.fontSize = (Math.random() * 10 + 8) + 'px';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        container.appendChild(confetti);
    }
    
    // Remover após animação
    setTimeout(() => container.remove(), 5000);
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadPoolData() {
    try {
        const [status] = await Promise.allSettled([
            getFortunePoolStatus()
        ]);

        if (status.status === 'fulfilled' && status.value) {
            Game.poolStatus = status.value;
            document.getElementById('prize-pool').textContent = 
                formatBigNumber(status.value.prizePool || 0n).toFixed(2) + ' BKC';
            document.getElementById('total-games').textContent = 
                (status.value.totalGames || 0).toLocaleString();
        }

        // User balance
        const balance = State.currentUserBalance || 0n;
        document.getElementById('user-balance').textContent = 
            formatBigNumber(balance).toFixed(2) + ' BKC';

        // Load history
        loadHistory();

    } catch (e) {
        console.error('Load pool data error:', e);
    }
}

async function loadHistory() {
    try {
        const endpoint = API_ENDPOINTS.fortuneGames || 'https://getfortunegames-4wvdcuoouq-uc.a.run.app';
        const url = State.userAddress ? `${endpoint}?player=${State.userAddress}&limit=10` : `${endpoint}?limit=10`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.games && data.games.length > 0) {
            Game.history = data.games;
            renderHistory(data.games);
            
            // Win rate
            const wins = data.games.filter(g => g.isWin || (g.prizeWon && BigInt(g.prizeWon) > 0n)).length;
            document.getElementById('win-rate').textContent = `${wins}/${data.games.length} wins`;
        } else {
            document.getElementById('history-list').innerHTML = `
                <div class="p-6 text-center text-zinc-600 text-sm">No games yet</div>
            `;
            document.getElementById('win-rate').textContent = '';
        }
    } catch (e) {
        console.log('History load error:', e);
    }
}

function renderHistory(games) {
    const list = document.getElementById('history-list');
    if (!list) return;

    list.innerHTML = games.map(g => {
        const isWin = g.isWin || (g.prizeWon && BigInt(g.prizeWon) > 0n);
        const prize = g.prizeWon ? formatBigNumber(BigInt(g.prizeWon)) : 0;
        const wager = g.wagerAmount ? formatBigNumber(BigInt(g.wagerAmount)) : 0;
        const time = g.timestamp ? new Date(g.timestamp._seconds * 1000).toLocaleString() : '';
        
        // Ícones alinhados com Dashboard
        const icon = isWin ? 'fa-crown' : 'fa-paw';
        const iconColor = isWin ? '#facc15' : '#71717a';
        const bgColor = isWin ? 'rgba(234,179,8,0.2)' : 'rgba(39,39,42,0.5)';
        const label = isWin ? '🏆 Winner!' : '🐯 No Luck';

        return `
            <a href="${g.txHash ? EXPLORER_TX + g.txHash : '#'}" target="_blank" 
               class="flex items-center justify-between p-2.5 hover:bg-zinc-800/60 border-b border-zinc-800/30 last:border-0 transition-colors group">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${bgColor}">
                        <i class="fa-solid ${icon}" style="color: ${iconColor}; font-size: 12px"></i>
                    </div>
                    <div>
                        <p class="text-xs font-medium" style="color: ${isWin ? '#4ade80' : '#a1a1aa'}">
                            ${isWin ? `+${prize.toFixed(2)} BKC` : `-${wager.toFixed(2)} BKC`}
                        </p>
                        <p class="text-zinc-600" style="font-size: 10px">${time}</p>
                    </div>
                </div>
                <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 transition-colors" style="font-size: 9px"></i>
            </a>
        `;
    }).join('');
}

// ============================================================================
// EXPORTS
// ============================================================================
export function cleanup() {
    // Cleanup timers if any
}

export const FortunePoolPage = { render, cleanup };

export default { render, cleanup };