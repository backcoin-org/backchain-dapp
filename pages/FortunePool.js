// js/pages/FortunePool.js
// ✅ VERSION V9.0: Simplified UX, Clear Odds, Digit Picker, Fixed Combo Mode

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
        .slot-spin { animation: slotSpin 0.1s infinite; }
        @keyframes slotSpin {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
        }
        .slot-hit { 
            border-color: #10b981 !important; 
            background: rgba(16,185,129,0.1) !important;
            box-shadow: 0 0 20px rgba(16,185,129,0.4);
        }
        .slot-miss { opacity: 0.4; border-color: #3f3f46 !important; }
        .digit-btn { transition: all 0.15s ease; }
        .digit-btn:hover { transform: scale(1.05); }
        .digit-btn.selected { 
            background: linear-gradient(135deg, #f59e0b, #d97706) !important; 
            color: #000 !important;
            border-color: #f59e0b !important;
        }
        .mode-card:hover { transform: translateY(-2px); }
        .win-pulse { animation: winPulse 0.5s ease-out; }
        @keyframes winPulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
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
            <!-- Jackpot Mode -->
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

            <!-- Combo Mode -->
            <button id="btn-combo" class="mode-card w-full text-left p-4 bg-zinc-900/80 border-2 border-zinc-700 rounded-xl hover:border-purple-500/50 transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <span class="text-3xl">🚀</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="text-lg font-bold text-white">Combo</h3>
                            <span class="text-purple-400 font-bold">up to 112x</span>
                        </div>
                        <p class="text-zinc-400 text-sm">Pick 3 numbers, stack your wins</p>
                        <div class="flex items-center gap-2 mt-2">
                            <span class="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">1% → 100x</span>
                            <span class="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">10% → 10x</span>
                            <span class="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">50% → 2x</span>
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
        Game.guess = 50;
        Game.phase = 'pick';
        renderPhase();
    });

    document.getElementById('btn-combo')?.addEventListener('click', () => {
        if (!State.isConnected) return showToast('Connect wallet first', 'warning');
        Game.mode = 'combo';
        Game.guesses = [1, 1, 1];
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
    // Split into digits: tens (0-9) and units (0-9) for 1-100
    const tens = Math.floor((Game.guess - 1) / 10); // 0-9
    const units = (Game.guess - 1) % 10; // 0-9

    container.innerHTML = `
        <div class="text-center">
            <p class="text-zinc-400 text-sm mb-4">Pick a number from 1-100</p>
            
            <!-- Display -->
            <div class="text-6xl font-black text-amber-400 mb-6" id="jackpot-number">${Game.guess}</div>
            
            <!-- Digit Selectors -->
            <div class="flex justify-center gap-6 mb-6">
                <!-- Tens Digit -->
                <div>
                    <p class="text-xs text-zinc-500 mb-2 uppercase">Tens</p>
                    <div class="grid grid-cols-5 gap-1">
                        ${[0,1,2,3,4,5,6,7,8,9].map(d => `
                            <button class="digit-btn w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-bold ${tens === d ? 'selected' : ''}" 
                                    data-type="tens" data-digit="${d}">${d}</button>
                        `).join('')}
                    </div>
                </div>
                <!-- Units Digit -->
                <div>
                    <p class="text-xs text-zinc-500 mb-2 uppercase">Units</p>
                    <div class="grid grid-cols-5 gap-1">
                        ${[0,1,2,3,4,5,6,7,8,9].map(d => `
                            <button class="digit-btn w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-bold ${units === d ? 'selected' : ''}" 
                                    data-type="units" data-digit="${d}">${d}</button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <p class="text-xs text-zinc-500 mb-6">You have <span class="text-amber-400 font-bold">1%</span> chance to win <span class="text-green-400 font-bold">100x</span></p>

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

    // Digit selection
    document.querySelectorAll('.digit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const digit = parseInt(btn.dataset.digit);
            
            let currentTens = Math.floor((Game.guess - 1) / 10);
            let currentUnits = (Game.guess - 1) % 10;
            
            if (type === 'tens') {
                currentTens = digit;
            } else {
                currentUnits = digit;
            }
            
            // Calculate new number (1-100)
            let newNum = currentTens * 10 + currentUnits + 1;
            if (newNum > 100) newNum = 100;
            if (newNum < 1) newNum = 1;
            
            Game.guess = newNum;
            
            // Update display
            document.getElementById('jackpot-number').textContent = Game.guess;
            
            // Update selection
            document.querySelectorAll(`.digit-btn[data-type="${type}"]`).forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
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
    const tiers = [
        { name: 'Jackpot', range: 100, multi: '100x', color: 'amber', chance: '1%' },
        { name: 'Super', range: 10, multi: '10x', color: 'purple', chance: '10%' },
        { name: 'Basic', range: 2, multi: '2x', color: 'cyan', chance: '50%' }
    ];
    const tier = tiers[Game.comboStep];
    const current = Game.guesses[Game.comboStep];

    container.innerHTML = `
        <div class="text-center">
            <!-- Progress -->
            <div class="flex justify-center gap-2 mb-4">
                ${tiers.map((t, i) => `
                    <div class="flex items-center gap-1 px-3 py-1.5 rounded-full ${i === Game.comboStep ? 'bg-zinc-700 border border-zinc-600' : 'bg-zinc-800/50'} transition-all">
                        <span class="text-xs ${i === Game.comboStep ? 'text-white font-bold' : i < Game.comboStep ? 'text-green-400' : 'text-zinc-500'}">
                            ${i < Game.comboStep ? '✓' : t.multi}
                        </span>
                    </div>
                `).join('')}
            </div>

            <h2 class="text-xl font-bold text-white mb-1">${tier.name} Tier</h2>
            <p class="text-zinc-400 text-sm mb-4">Pick 1-${tier.range} • <span class="text-green-400">${tier.chance} chance</span> • <span class="text-amber-400">${tier.multi}</span></p>

            <!-- Number Grid -->
            <div class="flex flex-wrap justify-center gap-2 max-w-xs mx-auto mb-6">
                ${Array(tier.range).fill(0).map((_, i) => {
                    const n = i + 1;
                    return `
                        <button class="digit-btn w-12 h-12 rounded-xl bg-zinc-800 border-2 ${current === n ? 'selected' : 'border-zinc-700'} text-white font-bold text-lg hover:border-amber-500/50" 
                                data-value="${n}">${n}</button>
                    `;
                }).join('')}
            </div>

            <p class="text-sm text-white mb-6">Your pick: <span id="current-pick" class="text-2xl font-bold text-amber-400">${current}</span></p>

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

    // Number selection
    document.querySelectorAll('.digit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.value);
            Game.guesses[Game.comboStep] = val;
            
            document.querySelectorAll('.digit-btn').forEach(b => {
                b.classList.remove('selected');
            });
            btn.classList.add('selected');
            
            document.getElementById('current-pick').textContent = val;
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
    const maxMulti = isJackpot ? 100 : 112;
    const userBalance = State.currentUserBalance || 0n;
    const balanceNum = formatBigNumber(userBalance);
    const lowBalance = balanceNum < 1;

    container.innerHTML = `
        <div>
            <!-- Summary -->
            <div class="text-center mb-6">
                <p class="text-zinc-400 text-sm mb-2">Your ${isJackpot ? 'pick' : 'picks'}</p>
                <div class="flex justify-center gap-3">
                    ${picks.map((p, i) => `
                        <div class="w-14 h-14 rounded-xl bg-zinc-800 border-2 border-amber-500/50 flex items-center justify-center">
                            <span class="text-2xl font-bold text-white">${p}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${lowBalance ? `
                <div class="mb-4 p-3 bg-cyan-900/20 rounded-xl border border-cyan-500/30">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-faucet text-cyan-400"></i>
                            <span class="text-sm text-white">Need tokens?</span>
                        </div>
                        <button id="btn-faucet" class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors">
                            Get Free BKC
                        </button>
                    </div>
                </div>
            ` : ''}

            <!-- Wager Input -->
            <div class="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50 mb-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-zinc-400 text-sm">Wager Amount</span>
                    <span class="text-xs text-zinc-500">Balance: ${balanceNum.toFixed(2)} BKC</span>
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

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl">
                    ← Back
                </button>
                <button id="btn-play" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl disabled:opacity-50">
                    🎰 SPIN
                </button>
            </div>
        </div>
    `;

    const wagerInput = document.getElementById('wager-input');
    const potentialWin = document.getElementById('potential-win');
    const playBtn = document.getElementById('btn-play');

    const updatePotential = () => {
        const w = parseFloat(wagerInput.value) || 0;
        Game.wager = w;
        potentialWin.textContent = w > 0 ? `+${(w * maxMulti).toFixed(2)} BKC` : '--';
        playBtn.disabled = w <= 0;
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

    document.getElementById('btn-back')?.addEventListener('click', () => {
        Game.phase = 'pick';
        if (Game.mode === 'combo') Game.comboStep = 2;
        renderPhase();
    });

    playBtn.addEventListener('click', executeGame);

    document.getElementById('btn-faucet')?.addEventListener('click', async (e) => {
        const btn = e.target;
        btn.disabled = true;
        btn.textContent = 'Claiming...';
        try {
            const res = await fetch(`${FAUCET_API}?address=${State.userAddress}`);
            const data = await res.json();
            if (data.success) {
                showToast('Tokens received! Refreshing...', 'success');
                setTimeout(() => loadUserData().then(() => renderPhase()), 3000);
            } else {
                showToast(data.error || 'Faucet error', 'error');
                btn.disabled = false;
                btn.textContent = 'Get Free BKC';
            }
        } catch (e) {
            showToast('Faucet error', 'error');
            btn.disabled = false;
            btn.textContent = 'Get Free BKC';
        }
    });
}

// ============================================================================
// PHASE 4: SPINNING
// ============================================================================
async function executeGame() {
    if (!State.isConnected) return showToast('Connect wallet first', 'warning');
    if (Game.wager <= 0) return showToast('Enter wager amount', 'warning');

    const isJackpot = Game.mode === 'jackpot';
    const wagerWei = ethers.parseEther(Game.wager.toString());
    
    // IMPORTANT: For jackpot send array with 1 element, for combo send all 3
    const guesses = isJackpot ? [Game.guess] : [...Game.guesses];
    const isCumulative = !isJackpot;

    console.log('🎰 Executing game:', { mode: Game.mode, guesses, isCumulative, wager: Game.wager });

    Game.phase = 'spin';
    renderPhase();

    try {
        const result = await executeFortuneParticipate(
            wagerWei,
            guesses,
            isCumulative,
            document.getElementById('spin-status')
        );

        if (result && result.success) {
            Game.gameId = result.gameId;
            updateSpinStatus('Waiting for oracle...', 40);
            pollForResult(result.gameId);
        } else {
            Game.phase = 'wager';
            renderPhase();
        }
    } catch (e) {
        console.error('Game error:', e);
        Game.phase = 'wager';
        renderPhase();
        showToast('Transaction failed: ' + (e.message || 'Unknown error'), 'error');
    }
}

function renderSpin(container) {
    const isJackpot = Game.mode === 'jackpot';
    const picks = isJackpot ? [Game.guess] : Game.guesses;

    container.innerHTML = `
        <div class="text-center py-8">
            <!-- Slots -->
            <div class="flex justify-center gap-4 mb-8">
                ${picks.map((p, i) => `
                    <div class="text-center">
                        <div id="slot-${i}" class="w-20 h-20 rounded-xl bg-zinc-900 border-2 border-amber-500 slot-spin flex items-center justify-center">
                            <span class="text-3xl font-black text-amber-400">?</span>
                        </div>
                        <p class="text-xs text-zinc-500 mt-2">Pick: ${p}</p>
                    </div>
                `).join('')}
            </div>

            <!-- Status -->
            <div class="flex items-center justify-center gap-2 mb-4">
                <div class="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <span id="spin-status" class="text-white font-bold">Processing...</span>
            </div>

            <div class="w-full max-w-xs mx-auto bg-zinc-800 rounded-full h-2">
                <div id="spin-progress" class="bg-amber-500 h-2 rounded-full transition-all" style="width: 10%"></div>
            </div>
        </div>
    `;
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

    updateSpinStatus('Waiting for result...', 40 + attempts);

    try {
        const result = await getGameResult(gameId);
        
        if (result && result.fulfilled) {
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
    const isWin = prize > 0n;
    const prizeNum = formatBigNumber(prize);

    container.innerHTML = `
        <div class="text-center py-6">
            <!-- Result Header -->
            <div class="mb-6 win-pulse">
                ${isWin ? `
                    <div class="text-6xl mb-3">🎉</div>
                    <h2 class="text-2xl font-bold text-green-400">YOU WON!</h2>
                    <p class="text-3xl font-black text-white mt-2">+${prizeNum.toFixed(2)} BKC</p>
                ` : `
                    <div class="text-5xl mb-3">😔</div>
                    <h2 class="text-2xl font-bold text-zinc-400">No Match</h2>
                    <p class="text-zinc-500 mt-2">Better luck next time!</p>
                `}
            </div>

            <!-- Slots Result -->
            <div class="flex justify-center gap-4 mb-8">
                ${picks.map((pick, i) => {
                    const roll = rolls[i] !== undefined ? Number(rolls[i]) : '?';
                    const hit = roll == pick;
                    return `
                        <div class="text-center">
                            <div class="w-20 h-20 rounded-xl bg-zinc-900 border-2 ${hit ? 'slot-hit' : 'slot-miss'} flex items-center justify-center">
                                <span class="text-3xl font-black ${hit ? 'text-green-400' : 'text-zinc-500'}">${roll}</span>
                            </div>
                            <p class="text-xs ${hit ? 'text-green-400' : 'text-zinc-500'} mt-2">
                                ${hit ? '✓ Match!' : `Pick: ${pick}`}
                            </p>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-new-game" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl">
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

        return `
            <div class="flex items-center justify-between p-3 border-b border-zinc-800/50 last:border-0">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full ${isWin ? 'bg-green-500/20' : 'bg-zinc-800'} flex items-center justify-center">
                        <span class="${isWin ? 'text-green-400' : 'text-zinc-500'}">${isWin ? '🏆' : '🎲'}</span>
                    </div>
                    <div>
                        <p class="text-sm font-medium ${isWin ? 'text-green-400' : 'text-zinc-400'}">
                            ${isWin ? `+${prize.toFixed(2)} BKC` : `-${wager.toFixed(2)} BKC`}
                        </p>
                        <p class="text-xs text-zinc-600">${time}</p>
                    </div>
                </div>
                ${g.txHash ? `
                    <a href="${EXPLORER_TX}${g.txHash}" target="_blank" class="text-zinc-600 hover:text-blue-400">
                        <i class="fa-solid fa-external-link text-xs"></i>
                    </a>
                ` : ''}
            </div>
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