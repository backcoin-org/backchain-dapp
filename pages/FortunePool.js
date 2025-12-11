// js/pages/FortunePool.js
// ✅ VERSION V6.0: Clean UI, Mobile-First, V2.1 Compatible

import { State } from '../state.js';
import { loadUserData, safeContractCall, API_ENDPOINTS } from '../modules/data.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';

const ethers = window.ethers;

// --- CONFIG ---
const EXPLORER_BASE = "https://sepolia.arbiscan.io/tx/";
const FAUCET_API_URL = "https://api.backcoin.org/faucet";

// --- TIER CONFIG V2.1 ---
const TIERS = [
    { id: 1, name: "Bronze", max: 3, multiplier: 1.5, color: "amber", odds: "1:3" },
    { id: 2, name: "Silver", max: 10, multiplier: 5, color: "zinc", odds: "1:10" },
    { id: 3, name: "Gold", max: 100, multiplier: 50, color: "yellow", odds: "1:100" }
];

// --- HELPERS ---
function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        const date = new Date(secs * 1000);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) { return 'Recent'; }
}

function rand(max) { 
    return Math.floor(Math.random() * max) + 1; 
}

// --- GAME STATE ---
let gameState = {
    step: 0,
    isSpinning: false,
    gameId: 0,
    pollInterval: null,
    spinInterval: null,
    guesses: [0, 0, 0],
    isCumulative: true,
    betAmount: 0,
    lastWinAmount: 0,
    currentLevel: 1,
    currentXP: 0,
    xpPerLevel: 1000,
    systemReady: false
};

// --- PERSISTENCE ---
try {
    const saved = localStorage.getItem('bkc_fortune_v6');
    if (saved) {
        const p = JSON.parse(saved);
        gameState.currentLevel = p.lvl || 1;
        gameState.currentXP = p.xp || 0;
    }
} catch (e) {}

function saveProgress() {
    localStorage.setItem('bkc_fortune_v6', JSON.stringify({ 
        lvl: gameState.currentLevel, 
        xp: gameState.currentXP 
    }));
}

function addXP(amount) {
    gameState.currentXP += amount;
    if (gameState.currentXP >= gameState.xpPerLevel) {
        gameState.currentLevel++;
        gameState.currentXP -= gameState.xpPerLevel;
        showToast(`🆙 Level ${gameState.currentLevel}!`, "success");
    }
    saveProgress();
    updateLevelDisplay();
}

function updateLevelDisplay() {
    const el = document.getElementById('player-level');
    if (el) el.textContent = gameState.currentLevel;
}

// --- INJECT STYLES ---
const style = document.createElement('style');
style.innerHTML = `
    .fortune-slot {
        background: linear-gradient(180deg, #18181b 0%, #09090b 100%);
        border: 2px solid #3f3f46;
        box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
        transition: all 0.3s ease;
    }
    .fortune-slot.spinning {
        animation: slotSpin 0.08s infinite;
        color: #71717a !important;
    }
    .fortune-slot.hit {
        border-color: #10b981 !important;
        background: rgba(16, 185, 129, 0.15) !important;
        color: #fff !important;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
        transform: scale(1.05);
    }
    .fortune-slot.miss {
        border-color: #ef4444 !important;
        color: #ef4444 !important;
        opacity: 0.5;
    }
    .guess-display {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
    }
    @keyframes slotSpin {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); filter: blur(1px); }
    }
    @keyframes coinPulse {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.3)); }
        50% { transform: scale(1.08); filter: drop-shadow(0 0 16px rgba(245, 158, 11, 0.6)); }
    }
    .coin-pulse { animation: coinPulse 2s infinite ease-in-out; }
    .progress-bar-fill {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
        box-shadow: 0 0 10px #f59e0b;
        transition: width 0.4s ease-out;
    }
`;
document.head.appendChild(style);

// ============================================================================
// 1. MAIN RENDER
// ============================================================================

function renderMainLayout() {
    const container = document.getElementById('actions');
    if (!container || !addresses.fortunePool) {
        if (container) container.innerHTML = `<div class="text-center py-20 text-zinc-500">Fortune Pool not configured</div>`;
        return;
    }

    container.innerHTML = `
        <div class="max-w-lg mx-auto py-6 px-4">
            
            <!-- HEADER -->
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                        Fortune Pool
                    </h1>
                    <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Proof of Purchase Mining</p>
                </div>
                <div class="text-right">
                    <div class="text-[10px] text-zinc-500">LEVEL</div>
                    <div id="player-level" class="text-xl font-black text-amber-500">${gameState.currentLevel}</div>
                </div>
            </div>

            <!-- GAME AREA -->
            <div class="glass-panel rounded-2xl overflow-hidden mb-4">
                <div id="game-area" class="p-4 min-h-[380px] flex flex-col justify-center">
                    <!-- Dynamic content -->
                </div>
            </div>

            <!-- STATUS BAR -->
            <div class="flex justify-between text-[10px] text-zinc-600 font-mono px-2 mb-6">
                <div id="system-status">Checking...</div>
                <div id="fee-status">--</div>
            </div>

            <!-- HISTORY -->
            <div class="glass-panel rounded-xl p-4">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-xs font-bold text-zinc-400 uppercase">Recent Games</h3>
                    <div id="total-winnings" class="text-xs font-mono text-zinc-500"></div>
                </div>
                <div id="game-history" class="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <div class="text-center py-4 text-zinc-600 text-xs">Loading...</div>
                </div>
            </div>
        </div>

        <!-- GAS MODAL -->
        ${renderGasModal()}
    `;

    gameState.step = 0;
    renderGameStep();
    FortunePoolPage.checkReqs();
    FortunePoolPage.loadHistory();
    updateLevelDisplay();
}

function renderGasModal() {
    return `
        <div id="gas-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-xs w-full p-5 text-center">
                <div class="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-gas-pump text-red-500"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Out of Gas</h3>
                <p class="text-zinc-400 text-xs mb-4">You need ETH for transaction fees</p>
                <button id="btn-faucet" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-lg text-sm mb-2">
                    <i class="fa-solid fa-hand-holding-medical mr-2"></i> Get Free Gas
                </button>
                <button id="btn-close-gas" class="text-zinc-500 hover:text-white text-xs">Close</button>
            </div>
        </div>
    `;
}

// ============================================================================
// 2. GAME STEPS
// ============================================================================

function renderGameStep() {
    const area = document.getElementById('game-area');
    if (!area) return;

    area.style.opacity = '0';
    setTimeout(() => {
        buildStepContent(area);
        area.style.opacity = '1';
    }, 150);
}

function buildStepContent(container) {
    // STEP 0: Welcome
    if (gameState.step === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <img src="assets/bkc_logo_3d.png" class="w-20 h-20 mx-auto mb-4 coin-pulse" alt="BKC">
                <h2 class="text-2xl font-black text-white mb-1">Ready to Play?</h2>
                <p class="text-zinc-500 text-sm mb-8">Pick 3 numbers and win up to 56.5x</p>
                
                <div class="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    <button id="btn-quick" class="glass-panel p-4 rounded-xl hover:border-amber-500/50 transition-all group">
                        <div class="text-2xl mb-1">🎲</div>
                        <div class="text-white font-bold text-sm">Quick</div>
                        <div class="text-[10px] text-zinc-500">Random picks</div>
                    </button>
                    <button id="btn-manual" class="glass-panel p-4 rounded-xl hover:border-amber-500/50 transition-all group">
                        <div class="text-2xl mb-1">🎯</div>
                        <div class="text-white font-bold text-sm">Strategy</div>
                        <div class="text-[10px] text-zinc-500">Pick your own</div>
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btn-quick').onclick = () => {
            gameState.guesses = [rand(3), rand(10), rand(100)];
            gameState.step = 4;
            renderGameStep();
        };
        document.getElementById('btn-manual').onclick = () => {
            gameState.step = 1;
            renderGameStep();
        };
    }
    // STEPS 1-3: Number Selection
    else if (gameState.step >= 1 && gameState.step <= 3) {
        const tier = TIERS[gameState.step - 1];
        
        let gridHTML;
        if (tier.max <= 5) {
            gridHTML = `
                <div class="flex justify-center gap-3 mb-6">
                    ${Array.from({length: tier.max}, (_, i) => i + 1).map(n => `
                        <button class="pick-btn w-14 h-14 glass-panel rounded-xl font-black text-xl text-white hover:bg-amber-500 hover:text-black transition-all" data-val="${n}">
                            ${n}
                        </button>
                    `).join('')}
                </div>
            `;
        } else if (tier.max <= 10) {
            gridHTML = `
                <div class="grid grid-cols-5 gap-2 mb-6 max-w-xs mx-auto">
                    ${Array.from({length: tier.max}, (_, i) => i + 1).map(n => `
                        <button class="pick-btn w-12 h-12 glass-panel rounded-lg font-bold text-white hover:bg-amber-500 hover:text-black transition-all" data-val="${n}">
                            ${n}
                        </button>
                    `).join('')}
                </div>
            `;
        } else {
            gridHTML = `
                <div class="max-w-[200px] mx-auto mb-6">
                    <input type="number" id="num-input" min="1" max="${tier.max}" 
                        class="w-full bg-black border-2 border-amber-500/30 rounded-xl text-center text-4xl py-4 text-white font-bold outline-none focus:border-amber-500"
                        placeholder="1-${tier.max}">
                    <button id="btn-confirm-num" class="w-full mt-3 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-lg disabled:opacity-30" disabled>
                        Confirm
                    </button>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="text-center py-2">
                <div class="text-amber-500 text-[10px] font-bold tracking-widest mb-1">STEP ${gameState.step}/3</div>
                <h2 class="text-xl font-black text-white mb-1">${tier.name} Tier</h2>
                <p class="text-zinc-500 text-xs mb-6">${tier.multiplier}x multiplier • ${tier.odds} odds</p>
                ${gridHTML}
                <button id="btn-back" class="text-[10px] text-zinc-500 hover:text-white">
                    <i class="fa-solid fa-arrow-left mr-1"></i> Back
                </button>
            </div>
        `;

        // Attach events
        document.querySelectorAll('.pick-btn').forEach(btn => {
            btn.onclick = () => {
                gameState.guesses[gameState.step - 1] = parseInt(btn.dataset.val);
                gameState.step++;
                renderGameStep();
            };
        });

        const numInput = document.getElementById('num-input');
        const confirmBtn = document.getElementById('btn-confirm-num');
        if (numInput && confirmBtn) {
            numInput.oninput = () => {
                const val = parseInt(numInput.value);
                confirmBtn.disabled = !val || val < 1 || val > tier.max;
            };
            confirmBtn.onclick = () => {
                gameState.guesses[gameState.step - 1] = parseInt(numInput.value);
                gameState.step++;
                renderGameStep();
            };
        }

        document.getElementById('btn-back').onclick = () => {
            gameState.step = gameState.step > 1 ? gameState.step - 1 : 0;
            renderGameStep();
        };
    }
    // STEP 4: Betting Screen
    else if (gameState.step === 4) {
        renderBettingScreen(container);
    }
}

// ============================================================================
// 3. BETTING SCREEN
// ============================================================================

function renderBettingScreen(container) {
    container.innerHTML = `
        <div class="relative">
            <!-- Reset Button -->
            <button id="btn-reset" class="absolute top-0 right-0 text-[10px] text-zinc-500 hover:text-white">
                <i class="fa-solid fa-rotate-left mr-1"></i> Reset
            </button>

            <!-- Guesses Display -->
            <div class="grid grid-cols-3 gap-2 mb-2 mt-6">
                ${TIERS.map((t, i) => `
                    <div class="text-center">
                        <div class="text-[9px] text-${t.color}-500 font-bold mb-1">${t.name}</div>
                        <div class="guess-display rounded-lg py-2 text-blue-400 font-bold">${gameState.guesses[i]}</div>
                        <div class="text-[9px] text-zinc-600 mt-1">${t.multiplier}x</div>
                    </div>
                `).join('')}
            </div>

            <!-- Slots -->
            <div class="grid grid-cols-3 gap-2 mb-2">
                ${[1, 2, 3].map(i => `
                    <div id="slot-${i}" class="fortune-slot rounded-xl h-16 flex items-center justify-center text-3xl font-black text-zinc-600">
                        ?
                    </div>
                `).join('')}
            </div>

            <!-- Potential Wins -->
            <div class="grid grid-cols-3 gap-2 mb-4">
                ${TIERS.map((t, i) => `
                    <div id="pot-${i+1}" class="text-center text-[10px] font-mono text-zinc-600 py-1 rounded bg-zinc-900/50">
                        --
                    </div>
                `).join('')}
            </div>

            <!-- Status Area (hidden by default) -->
            <div id="status-area" class="hidden flex-col items-center justify-center py-8">
                <img src="assets/bkc_logo_3d.png" class="w-10 h-10 mb-2 coin-pulse" alt="">
                <div id="status-title" class="text-sm text-white font-bold mb-1">Processing...</div>
                <div id="status-text" class="text-[10px] text-amber-500 font-mono mb-2">INITIALIZING</div>
                <div class="w-full max-w-xs h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div id="progress-bar" class="progress-bar-fill h-full w-0"></div>
                </div>
            </div>

            <!-- Controls -->
            <div id="controls-area" class="space-y-3">
                <!-- Bet Input -->
                <div class="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-zinc-700/50">
                    <span class="text-zinc-500 text-xs font-bold">BET</span>
                    <div class="flex items-center gap-2">
                        <input type="number" id="bet-input" 
                            class="bg-transparent text-right text-white font-mono text-lg font-bold w-20 outline-none" 
                            placeholder="0" step="any" value="${gameState.betAmount || ''}">
                        <span class="text-amber-500 font-bold text-xs">BKC</span>
                    </div>
                </div>

                <!-- Quick Amounts -->
                <div class="grid grid-cols-5 gap-2">
                    <button class="add-bet bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold py-2 rounded transition-colors" data-amt="1">+1</button>
                    <button class="add-bet bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold py-2 rounded transition-colors" data-amt="5">+5</button>
                    <button class="add-bet bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold py-2 rounded transition-colors" data-amt="10">+10</button>
                    <button class="add-bet bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold py-2 rounded transition-colors" data-amt="50">+50</button>
                    <button id="btn-clear" class="bg-red-900/30 hover:bg-red-900/50 text-red-400 text-[10px] font-bold py-2 rounded transition-colors">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- Mode Toggle -->
                <div id="mode-toggle" class="p-3 rounded-xl border cursor-pointer transition-all ${gameState.isCumulative ? 'bg-purple-500/10 border-purple-500/30' : 'bg-zinc-800/50 border-zinc-700'}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span id="mode-icon" class="text-lg">${gameState.isCumulative ? '🚀' : '🎯'}</span>
                            <div>
                                <div id="mode-title" class="text-xs font-bold text-white">${gameState.isCumulative ? 'Combo Mode' : 'Single Mode'}</div>
                                <div id="mode-desc" class="text-[9px] text-zinc-400">${gameState.isCumulative ? 'Stack all winning multipliers' : 'Keep highest win only'}</div>
                            </div>
                        </div>
                        <div id="mode-badge" class="text-[10px] font-bold px-2 py-1 rounded ${gameState.isCumulative ? 'bg-purple-500 text-white' : 'bg-zinc-700 text-zinc-400'}">
                            ${gameState.isCumulative ? 'COMBO' : 'SINGLE'}
                        </div>
                    </div>
                </div>

                <!-- Spin Button -->
                <button id="btn-spin" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed" disabled>
                    ENTER AMOUNT
                </button>
            </div>

            <!-- Result Overlay -->
            <div id="result-overlay" class="absolute inset-0 z-10 hidden items-center justify-center bg-black/95 rounded-xl"></div>
        </div>
    `;

    attachBettingListeners();
}

function attachBettingListeners() {
    const betInput = document.getElementById('bet-input');
    const spinBtn = document.getElementById('btn-spin');

    // Validation
    const validate = () => {
        const val = parseFloat(betInput.value) || 0;
        gameState.betAmount = val;

        TIERS.forEach((t, i) => {
            const potEl = document.getElementById(`pot-${i + 1}`);
            if (potEl) {
                if (val > 0) {
                    potEl.textContent = `+${(val * t.multiplier).toFixed(1)}`;
                    potEl.className = 'text-center text-[10px] font-mono text-green-400 py-1 rounded bg-green-500/10 border border-green-500/20';
                } else {
                    potEl.textContent = '--';
                    potEl.className = 'text-center text-[10px] font-mono text-zinc-600 py-1 rounded bg-zinc-900/50';
                }
            }
        });

        if (val > 0 && gameState.systemReady) {
            spinBtn.disabled = false;
            spinBtn.textContent = 'SPIN TO WIN';
        } else {
            spinBtn.disabled = true;
            spinBtn.textContent = val > 0 ? 'SYSTEM OFFLINE' : 'ENTER AMOUNT';
        }
    };

    betInput.oninput = validate;

    // Quick add buttons
    document.querySelectorAll('.add-bet').forEach(btn => {
        btn.onclick = () => {
            const current = parseFloat(betInput.value) || 0;
            betInput.value = (current + parseFloat(btn.dataset.amt)).toFixed(2);
            validate();
        };
    });

    document.getElementById('btn-clear').onclick = () => {
        betInput.value = '';
        validate();
    };

    // Mode toggle
    document.getElementById('mode-toggle').onclick = () => {
        if (gameState.betAmount <= 0) return;
        gameState.isCumulative = !gameState.isCumulative;
        updateModeVisuals();
        FortunePoolPage.checkReqs();
    };

    // Reset
    document.getElementById('btn-reset').onclick = () => {
        gameState.step = 0;
        gameState.guesses = [0, 0, 0];
        renderGameStep();
    };

    // Spin
    spinBtn.onclick = executeTransaction;

    // Gas modal
    const faucetBtn = document.getElementById('btn-faucet');
    if (faucetBtn) faucetBtn.onclick = function() { requestFaucet(this); };

    const closeGasBtn = document.getElementById('btn-close-gas');
    if (closeGasBtn) closeGasBtn.onclick = () => {
        document.getElementById('gas-modal').classList.add('hidden');
        document.getElementById('gas-modal').classList.remove('flex');
    };

    validate();
}

function updateModeVisuals() {
    const toggle = document.getElementById('mode-toggle');
    const icon = document.getElementById('mode-icon');
    const title = document.getElementById('mode-title');
    const desc = document.getElementById('mode-desc');
    const badge = document.getElementById('mode-badge');

    if (gameState.isCumulative) {
        toggle.className = 'p-3 rounded-xl border cursor-pointer transition-all bg-purple-500/10 border-purple-500/30';
        icon.textContent = '🚀';
        title.textContent = 'Combo Mode';
        desc.textContent = 'Stack all winning multipliers';
        badge.textContent = 'COMBO';
        badge.className = 'text-[10px] font-bold px-2 py-1 rounded bg-purple-500 text-white';
    } else {
        toggle.className = 'p-3 rounded-xl border cursor-pointer transition-all bg-zinc-800/50 border-zinc-700';
        icon.textContent = '🎯';
        title.textContent = 'Single Mode';
        desc.textContent = 'Keep highest win only';
        badge.textContent = 'SINGLE';
        badge.className = 'text-[10px] font-bold px-2 py-1 rounded bg-zinc-700 text-zinc-400';
    }
}

// ============================================================================
// 4. GAME EXECUTION
// ============================================================================

async function executeTransaction() {
    if (!State.isConnected) return showToast("Connect wallet", "error");

    const hasGas = await checkGas();
    if (!hasGas) return;

    await FortunePoolPage.checkReqs();
    if (!gameState.systemReady) return showToast("System offline", "error");
    if (gameState.betAmount <= 0) return;

    const btn = document.getElementById('btn-spin');
    const amountWei = ethers.parseEther(gameState.betAmount.toString());
    const isCumulative = gameState.isCumulative;

    // Get fee from contract (V2.1: oracleFee instead of oracleFeeInWei)
    let fee = 0n;
    try {
        let baseFee = await safeContractCall(State.actionsManagerContract, 'oracleFee', [], 0n);
        if (baseFee === 0n) {
            baseFee = await safeContractCall(State.actionsManagerContract, 'oracleFeeInWei', [], 0n);
        }
        if (baseFee === 0n) baseFee = ethers.parseEther("0.00035");
        fee = isCumulative ? (baseFee * 5n) : baseFee;
    } catch (e) {
        fee = ethers.parseEther(isCumulative ? "0.00175" : "0.00035");
    }

    btn.disabled = true;

    try {
        // Approve
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Approving...`;
        const spender = addresses.fortunePool;
        
        const currentAllowance = await State.bkcTokenContract.allowance(State.userAddress, spender);
        if (currentAllowance < amountWei) {
            const approveTx = await State.bkcTokenContract.approve(spender, amountWei, { gasLimit: 300000 });
            await approveTx.wait();
        }

        // Execute
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Confirming...`;
        const guessesAsBigInt = gameState.guesses.map(g => BigInt(g));

        const tx = await State.actionsManagerContract.participate(
            amountWei,
            guessesAsBigInt,
            isCumulative,
            { value: fee, gasLimit: 3000000 }
        );

        startSpinning();
        await tx.wait();
        updateProgress(40, "Waiting for Oracle...");

        const counter = await safeContractCall(State.actionsManagerContract, 'gameCounter', [], 0, 2, true);
        const gameId = Number(counter) > 0 ? Number(counter) - 1 : 0;

        setTimeout(() => pollForResult(gameId), 2000);

    } catch (e) {
        console.error("Transaction failed:", e);
        btn.disabled = false;
        btn.textContent = 'SPIN TO WIN';
        
        await checkGas();
        showToast("Transaction failed", "error");
        
        document.getElementById('status-area').classList.add('hidden');
        document.getElementById('status-area').classList.remove('flex');
        document.getElementById('controls-area').classList.remove('hidden');
    }
}

function startSpinning() {
    gameState.isSpinning = true;

    document.getElementById('controls-area').classList.add('hidden');
    document.getElementById('status-area').classList.remove('hidden');
    document.getElementById('status-area').classList.add('flex');

    [1, 2, 3].forEach(i => {
        const el = document.getElementById(`slot-${i}`);
        el.textContent = '?';
        el.className = 'fortune-slot spinning rounded-xl h-16 flex items-center justify-center text-3xl font-black';
    });

    gameState.spinInterval = setInterval(() => {
        if (document.getElementById('slot-1')) document.getElementById('slot-1').textContent = rand(5);
        if (document.getElementById('slot-2')) document.getElementById('slot-2').textContent = rand(15);
        if (document.getElementById('slot-3')) document.getElementById('slot-3').textContent = rand(100);
    }, 60);

    updateProgress(10, "Mining transaction...");
}

function updateProgress(percent, text) {
    const bar = document.getElementById('progress-bar');
    const txt = document.getElementById('status-text');
    if (bar) bar.style.width = `${percent}%`;
    if (txt) txt.textContent = text.toUpperCase();
}

async function pollForResult(gameId) {
    let attempts = 0;
    let progress = 40;

    if (gameState.pollInterval) clearInterval(gameState.pollInterval);

    gameState.pollInterval = setInterval(async () => {
        attempts++;
        progress = Math.min(progress + 2, 95);
        updateProgress(progress, `Oracle processing (#${gameId})...`);

        if (attempts > 60) {
            clearInterval(gameState.pollInterval);
            stopSpinning([0, 0, 0], 0n);
            showToast("Oracle timeout. Check history.", "info");
            return;
        }

        try {
            const rolls = await safeContractCall(State.actionsManagerContract, 'gameResults', [gameId], [], 0, true);

            if (rolls && rolls.length > 0) {
                clearInterval(gameState.pollInterval);
                const resultRolls = [Number(rolls[0]), Number(rolls[1]), Number(rolls[2])];

                let win = 0n;
                if (resultRolls[0] === gameState.guesses[0] || resultRolls[1] === gameState.guesses[1] || resultRolls[2] === gameState.guesses[2]) {
                    let mult = 0;
                    if (resultRolls[0] === gameState.guesses[0]) mult = 1.5;
                    if (resultRolls[1] === gameState.guesses[1]) {
                        mult = gameState.isCumulative ? mult + 5 : Math.max(mult, 5);
                    }
                    if (resultRolls[2] === gameState.guesses[2]) {
                        mult = gameState.isCumulative ? mult + 50 : Math.max(mult, 50);
                    }
                    win = ethers.parseEther((gameState.betAmount * mult).toFixed(18));
                }

                stopSpinning(resultRolls, win);
            }
        } catch (e) {
            console.error("Poll error:", e);
        }
    }, 2000);
}

async function stopSpinning(rolls, winAmount) {
    clearInterval(gameState.spinInterval);
    clearInterval(gameState.pollInterval);

    updateProgress(100, "Revealing...");
    gameState.lastWinAmount = parseFloat(formatBigNumber(BigInt(winAmount)));

    const wait = ms => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < 3; i++) {
        await wait(600);
        const el = document.getElementById(`slot-${i + 1}`);
        if (!el) continue;

        el.classList.remove('spinning');
        el.textContent = rolls[i];

        if (rolls[i] === gameState.guesses[i]) {
            el.classList.add('hit');
        } else {
            el.classList.add('miss');
        }
    }

    await wait(1000);
    showResult(winAmount > 0n);
}

function showResult(isWin) {
    const overlay = document.getElementById('result-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    if (isWin) {
        overlay.innerHTML = `
            <div class="text-center p-4 w-full">
                <div class="text-5xl mb-3">🏆</div>
                <h2 class="text-3xl font-black text-amber-400 mb-2">YOU WON!</h2>
                <div class="text-4xl font-mono font-bold text-white mb-4">
                    ${gameState.lastWinAmount.toFixed(2)} <span class="text-lg text-zinc-500">BKC</span>
                </div>
                <button id="btn-collect" class="w-full bg-white text-black font-black py-3 rounded-xl hover:scale-105 transition-transform">
                    COLLECT & PLAY AGAIN
                </button>
            </div>
        `;
        addXP(500);
    } else {
        overlay.innerHTML = `
            <div class="text-center p-4 w-full">
                <div class="text-4xl mb-3 opacity-50">💔</div>
                <h2 class="text-xl font-bold text-zinc-300 mb-2">Not This Time</h2>
                <p class="text-zinc-500 text-sm mb-4">Your purchase generated mining power</p>
                <button id="btn-collect" class="w-full bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors">
                    TRY AGAIN
                </button>
            </div>
        `;
        addXP(50);
    }

    document.getElementById('btn-collect').onclick = closeResult;
}

function closeResult() {
    const overlay = document.getElementById('result-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');

    document.getElementById('status-area').classList.add('hidden');
    document.getElementById('status-area').classList.remove('flex');
    document.getElementById('controls-area').classList.remove('hidden');
    document.getElementById('progress-bar').style.width = '0%';

    [1, 2, 3].forEach(i => {
        const el = document.getElementById(`slot-${i}`);
        el.className = 'fortune-slot rounded-xl h-16 flex items-center justify-center text-3xl font-black text-zinc-600';
        el.textContent = '?';
    });

    const btn = document.getElementById('btn-spin');
    if (btn && gameState.betAmount > 0) {
        btn.disabled = false;
        btn.textContent = 'SPIN TO WIN';
    }

    FortunePoolPage.loadHistory();
    loadUserData(true);
}

// ============================================================================
// 5. HELPERS
// ============================================================================

async function checkGas() {
    try {
        const balance = await State.provider.getBalance(State.userAddress);
        if (balance < ethers.parseEther("0.002")) {
            const modal = document.getElementById('gas-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
            return false;
        }
        return true;
    } catch (e) {
        return true;
    }
}

async function requestFaucet(btn) {
    if (!State.isConnected) return;

    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...`;

    try {
        const res = await fetch(`${FAUCET_API_URL}?address=${State.userAddress}`);
        const data = await res.json();

        if (res.ok && data.success) {
            showToast("✅ Gas + BKC sent!", "success");
            document.getElementById('gas-modal').classList.add('hidden');
        } else {
            showToast(data.error || "Faucet unavailable", "warning");
        }
    } catch (e) {
        showToast("Faucet offline", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

// ============================================================================
// 6. EXPORT
// ============================================================================

export const FortunePoolPage = {
    async checkReqs() {
        const systemEl = document.getElementById('system-status');
        const feeEl = document.getElementById('fee-status');
        const spinBtn = document.getElementById('btn-spin');

        if (!State.isConnected) {
            if (systemEl) systemEl.innerHTML = `<span class="text-zinc-500">Connect wallet</span>`;
            if (feeEl) feeEl.textContent = '--';
            return;
        }

        if (!addresses.fortunePool || !State.actionsManagerContract) {
            gameState.systemReady = false;
            if (systemEl) systemEl.innerHTML = `<span class="text-red-500">⚠️ Contract Error</span>`;
            if (spinBtn) { spinBtn.disabled = true; spinBtn.textContent = 'SYSTEM ERROR'; }
            return;
        }

        gameState.systemReady = true;
        if (systemEl) systemEl.innerHTML = `<span class="text-green-500">● Online</span>`;

        // Get fee (V2.1 compatible)
        let fee = 0n;
        try {
            let baseFee = await safeContractCall(State.actionsManagerContract, 'oracleFee', [], 0n);
            if (baseFee === 0n) {
                baseFee = await safeContractCall(State.actionsManagerContract, 'oracleFeeInWei', [], 0n);
            }
            if (baseFee === 0n) baseFee = ethers.parseEther("0.00035");
            fee = gameState.isCumulative ? (baseFee * 5n) : baseFee;
        } catch (e) {
            fee = ethers.parseEther(gameState.isCumulative ? "0.00175" : "0.00035");
        }

        if (feeEl) {
            feeEl.textContent = `Fee: ${ethers.formatEther(fee)} ETH`;
        }

        // Update spin button
        if (spinBtn && gameState.betAmount > 0) {
            spinBtn.disabled = !gameState.systemReady;
            spinBtn.textContent = gameState.systemReady ? 'SPIN TO WIN' : 'SYSTEM ERROR';
        }
    },

    async loadHistory() {
        const list = document.getElementById('game-history');
        const totalEl = document.getElementById('total-winnings');
        if (!list || !State.isConnected) return;

        try {
            const res = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
            const data = await res.json();
            const games = data.filter(a => a.type === 'GameResult' || a.type === 'FortuneGameResult');

            let totalWon = 0;
            games.forEach(g => {
                if (g.details?.isWin) totalWon += parseFloat(ethers.formatEther(g.details.amount || '0'));
            });

            if (totalEl) {
                totalEl.innerHTML = totalWon > 0 ? `<span class="text-amber-400">+${totalWon.toFixed(2)} BKC</span>` : '';
            }

            if (games.length === 0) {
                list.innerHTML = `<div class="text-center py-4 text-zinc-600 text-xs">No games yet</div>`;
                return;
            }

            list.innerHTML = games.slice(0, 10).map(g => {
                const isWin = g.details?.isWin || false;
                const winAmount = g.details?.amount || '0';
                const date = formatDate(g.timestamp || g.createdAt);
                const guesses = g.details?.userGuesses || ['?', '?', '?'];
                const rolls = g.details?.rolls || ['?', '?', '?'];
                const link = g.txHash ? `${EXPLORER_BASE}${g.txHash}` : '#';

                return `
                    <a href="${link}" target="_blank" class="flex items-center justify-between p-2 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg transition-colors group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center ${isWin ? 'bg-green-500/20' : 'bg-zinc-800'}">
                                <span class="text-sm">${isWin ? '🏆' : '💔'}</span>
                            </div>
                            <div>
                                <div class="flex gap-1 text-[10px] font-mono">
                                    ${rolls.map((r, i) => `
                                        <span class="${parseInt(r) === parseInt(guesses[i]) ? 'text-green-400' : 'text-zinc-500'}">${r}</span>
                                    `).join('<span class="text-zinc-700">/</span>')}
                                </div>
                                <div class="text-[9px] text-zinc-600">${date}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            ${isWin 
                                ? `<div class="text-green-400 font-bold text-xs">+${formatBigNumber(BigInt(winAmount)).toFixed(2)}</div>`
                                : `<div class="text-zinc-600 text-xs">Lost</div>`
                            }
                        </div>
                    </a>
                `;
            }).join('');

        } catch (e) {
            list.innerHTML = `<div class="text-center py-4 text-zinc-600 text-xs">Failed to load</div>`;
        }
    },

    render(isActive) {
        if (!isActive) return;
        renderMainLayout();
    }
};

window.FortunePoolPage = FortunePoolPage;