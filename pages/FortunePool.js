// js/pages/FortunePool.js
// ✅ PRODUCTION V40: Full Dynamic Gas + Enhanced UX + Real-time Cost Display

import { State } from '../state.js';
import { loadUserData, safeContractCall, API_ENDPOINTS } from '../modules/data.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';
import { getGasWithMargin } from '../modules/transactions.js'; // 🔥 NOVO: Import de gás dinâmico

const ethers = window.ethers;

// Network Config: Arbitrum Sepolia
const EXPLORER_BASE = "https://sepolia.arbiscan.io/tx/";

// ⚠️ CONFIGURAÇÃO DO BACKEND (Fauceter)
const FAUCET_API_URL = "http://64.225.122.2:8080/faucet"; 

// --- DATE HELPER ---
function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    try {
        if (timestamp.seconds || timestamp._seconds) {
            const secs = timestamp.seconds || timestamp._seconds;
            return new Date(secs * 1000).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }); 
        }
        return new Date(timestamp).toLocaleString();
    } catch (e) { return 'Recent'; }
}

// --- ENHANCED CSS WITH NEW FEATURES ---
const style = document.createElement('style');
style.innerHTML = `
    .glass-panel {
        background: rgba(10, 10, 12, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 193, 7, 0.15);
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.9);
    }
    
    .bkc-anim { animation: coinPulse 2s infinite ease-in-out; }
    @keyframes coinPulse {
        0% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3)); }
        50% { transform: scale(1.1); filter: drop-shadow(0 0 25px rgba(245, 158, 11, 0.6)); }
        100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3)); }
    }
    
    .progress-track { 
        background: rgba(255, 255, 255, 0.1); 
        border-radius: 4px; 
        overflow: hidden; 
        height: 12px; 
        margin-top: 10px;
        position: relative;
    }
    
    .progress-fill { 
        height: 100%; 
        background: linear-gradient(90deg, #f59e0b, #fbbf24); 
        width: 0%; 
        transition: width 0.5s ease-out;
        box-shadow: 0 0 15px #f59e0b;
        position: relative;
    }
    
    .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: shimmer 1.5s infinite;
    }
    
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
    
    .guess-box {
        background: rgba(59, 130, 246, 0.05); 
        border: 1px solid rgba(59, 130, 246, 0.3); 
        color: #60a5fa;
        box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.05);
        transition: all 0.3s;
    }
    
    .guess-box:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.5);
        transform: translateY(-2px);
    }
    
    .slot-box {
        background: linear-gradient(180deg, #18181b 0%, #09090b 100%);
        border: 1px solid #3f3f46; 
        color: #52525b;
        box-shadow: inset 0 0 20px #000; 
        position: relative;
        transition: all 0.3s;
    }
    
    .tier-label { 
        font-size: 9px; 
        font-weight: 900; 
        letter-spacing: 1px; 
        text-transform: uppercase; 
        text-align: center; 
        display: block; 
        margin-bottom: 4px; 
        opacity: 0.8; 
    }
    
    .profit-tag {
        font-family: monospace; 
        font-size: 10px; 
        font-weight: bold; 
        text-align: center; 
        padding: 4px; 
        border-radius: 6px;
        background: rgba(0,0,0,0.4); 
        border: 1px solid rgba(255,255,255,0.1); 
        transition: all 0.3s;
    }
    
    .profit-active { 
        background: rgba(16, 185, 129, 0.1); 
        border-color: #10b981; 
        color: #10b981; 
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.2); 
    }
    
    @keyframes spinBlur { 
        0% { filter: blur(0); transform: translateY(0); } 
        50% { filter: blur(6px); transform: translateY(-3px); } 
        100% { filter: blur(0); transform: translateY(0); } 
    }
    
    .slot-spinning { 
        animation: spinBlur 0.1s infinite; 
        color: #71717a !important; 
        text-shadow: 0 0 5px rgba(255,255,255,0.2); 
    }
    
    .slot-hit { 
        border-color: #10b981 !important; 
        color: #fff !important; 
        background: rgba(16, 185, 129, 0.2) !important;
        text-shadow: 0 0 20px #10b981; 
        transform: scale(1.05); 
        z-index: 10;
        animation: pulse 0.5s ease-in-out;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1.05); }
        50% { transform: scale(1.15); }
    }
    
    .slot-miss { 
        border-color: #ef4444 !important; 
        color: #ef4444 !important; 
        opacity: 0.4; 
    }
    
    .btn-action { 
        background: linear-gradient(to bottom, #fbbf24, #d97706); 
        color: black; 
        font-weight: 900; 
        letter-spacing: 1px;
        transition: all 0.3s;
        position: relative;
        overflow: hidden;
    }
    
    .btn-action::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
    }
    
    .btn-action:hover::before {
        width: 300px;
        height: 300px;
    }
    
    .btn-action:hover { 
        filter: brightness(1.1); 
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }
    
    .btn-action:disabled { 
        background: #333; 
        color: #666; 
        cursor: not-allowed; 
        transform: none; 
        filter: none; 
    }
    
    .hidden-force { display: none !important; }
    
    .mode-locked { 
        opacity: 0.7; 
        filter: grayscale(1); 
        border: 1px dashed #555 !important; 
        background: #111 !important; 
    }
    
    .mode-active-cumulative { 
        background: linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(79, 70, 229, 0.3) 100%) !important;
        border: 1px solid #a855f7 !important; 
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); 
        transform: scale(1.02);
    }
    
    .mode-container { 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        cursor: pointer; 
    }
    
    .mode-container:hover { filter: brightness(1.2); }
    
    /* 🔥 NOVOS ESTILOS PARA UX MELHORADA */
    
    .gas-estimate-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 8px;
        font-size: 11px;
        font-family: monospace;
        color: #60a5fa;
        animation: fadeIn 0.3s ease-in;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .gas-estimate-badge.loading::after {
        content: '';
        width: 12px;
        height: 12px;
        border: 2px solid #60a5fa;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .cost-breakdown {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 193, 7, 0.2);
        border-radius: 12px;
        padding: 12px;
        margin-top: 12px;
        font-size: 11px;
    }
    
    .cost-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .cost-row:last-child {
        border-bottom: none;
        margin-top: 4px;
        padding-top: 8px;
        font-weight: bold;
        color: #fbbf24;
    }
    
    .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .status-indicator.checking {
        background: rgba(59, 130, 246, 0.1);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
    }
    
    .status-indicator.ready {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .status-indicator.error {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .status-indicator::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        animation: pulse-dot 2s ease-in-out infinite;
    }
    
    @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
    
    .transaction-step {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        margin: 8px 0;
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: all 0.3s;
    }
    
    .transaction-step.active {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.3);
    }
    
    .transaction-step.complete {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
    }
    
    .step-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
    }
    
    .step-icon.pending {
        background: rgba(255, 255, 255, 0.1);
        color: #71717a;
    }
    
    .step-icon.active {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        animation: pulse 1s ease-in-out infinite;
    }
    
    .step-icon.complete {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.5s ease-out;
    }
    
    .eth-balance-warning {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
        padding: 12px;
        border-radius: 8px;
        margin-top: 12px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// --- GLOBAL GAME STATE ---
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
    systemReady: false,
    // 🔥 NOVO: Estados de custo estimado
    estimatedGasCost: null,
    oracleFee: null,
    totalCostETH: null
};

// --- DATA PERSISTENCE (Gamification) ---
try {
    const local = localStorage.getItem('bkc_fortune_v24');
    if (local) { 
        const p = JSON.parse(local); 
        gameState.currentLevel = p.lvl || 1; 
        gameState.currentXP = p.xp || 0; 
    }
} catch (e) {}

function saveProgress() { 
    localStorage.setItem('bkc_fortune_v24', JSON.stringify({ lvl: gameState.currentLevel, xp: gameState.currentXP })); 
    updateGamificationUI(); 
}

function addXP(amount) { 
    gameState.currentXP += amount; 
    if (gameState.currentXP >= gameState.xpPerLevel) { 
        gameState.currentLevel++; 
        gameState.currentXP -= gameState.xpPerLevel; 
        showToast(`🆙 LEVEL UP! LVL ${gameState.currentLevel}`, "success"); 
    } 
    saveProgress(); 
}

// 🔥 NOVO: Estimativa de custo em tempo real
async function estimateTransactionCost() {
    try {
        if (!State.provider || !State.actionsManagerContract) return null;
        
        const feeData = await State.provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");
        
        // Estima gás para approve + participate
        const approveGas = 100000n; // Estimativa conservadora
        const participateGas = 600000n; // Estimativa conservadora
        
        const totalGas = approveGas + participateGas;
        const gasCostWei = totalGas * gasPrice;
        
        return {
            gasPrice: ethers.formatUnits(gasPrice, "gwei"),
            totalGas: totalGas.toString(),
            gasCostETH: ethers.formatEther(gasCostWei)
        };
    } catch (e) {
        return null;
    }
}

// 🔥 NOVO: Atualizar display de custo
async function updateCostDisplay() {
    const costEl = document.getElementById('estimated-cost-display');
    if (!costEl) return;
    
    const costs = await estimateTransactionCost();
    if (!costs) {
        costEl.innerHTML = '<span class="status-indicator checking">Estimating...</span>';
        return;
    }
    
    const oracleFee = gameState.oracleFee || ethers.parseEther("0.00035");
    const oracleFeeETH = ethers.formatEther(gameState.isCumulative ? oracleFee * 5n : oracleFee);
    const totalETH = (parseFloat(costs.gasCostETH) + parseFloat(oracleFeeETH)).toFixed(6);
    
    costEl.innerHTML = `
        <div class="cost-breakdown animate-fadeIn">
            <div class="cost-row">
                <span class="text-zinc-400">Gas Estimate:</span>
                <span class="text-blue-400">${costs.totalGas} units</span>
            </div>
            <div class="cost-row">
                <span class="text-zinc-400">Gas Price:</span>
                <span class="text-blue-400">${parseFloat(costs.gasPrice).toFixed(2)} gwei</span>
            </div>
            <div class="cost-row">
                <span class="text-zinc-400">Gas Cost:</span>
                <span class="text-amber-400">~${costs.gasCostETH} ETH</span>
            </div>
            <div class="cost-row">
                <span class="text-zinc-400">Oracle Fee:</span>
                <span class="text-amber-400">${oracleFeeETH} ETH</span>
            </div>
            <div class="cost-row">
                <span class="text-zinc-300">Total Cost:</span>
                <span class="text-amber-400 font-black">~${totalETH} ETH</span>
            </div>
        </div>
    `;
}

// --- RENDER STEPS ---
function renderStep() {
    const container = document.getElementById('game-interaction-area');
    if (!container) return;
    container.style.opacity = '0';
    setTimeout(() => { container.innerHTML = ''; buildStepHTML(container); container.style.opacity = '1'; }, 200);
}

function buildStepHTML(container) {
    if (gameState.step === 0) {
        container.innerHTML = `
            <div class="text-center py-6 animate-fadeIn">
                <img src="assets/bkc_logo_3d.png" class="w-24 h-24 mx-auto mb-6 bkc-anim" alt="Backcoin">
                <h2 class="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Fortune Pool</h2>
                <p class="text-amber-500/80 text-sm mb-10 font-bold tracking-widest">PROOF OF PURCHASE MINING</p>
                <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <button id="btn-random-all" class="glass-panel p-5 rounded-2xl hover:border-amber-500 transition-all group">
                        <div class="text-3xl mb-2">🎲</div>
                        <div class="font-bold text-white text-sm">QUICK LUCK</div>
                        <div class="text-[10px] text-zinc-500 mt-1">Random picks</div>
                    </button>
                    <button id="btn-manual-pick" class="glass-panel p-5 rounded-2xl hover:border-amber-500 transition-all group">
                        <div class="text-3xl mb-2">🧠</div>
                        <div class="font-bold text-white text-sm">STRATEGY</div>
                        <div class="text-[10px] text-zinc-500 mt-1">Choose your numbers</div>
                    </button>
                </div>
            </div>`;
        
        document.getElementById('btn-random-all').onclick = () => {
            gameState.guesses = [
                Math.floor(Math.random() * 10),
                Math.floor(Math.random() * 10),
                Math.floor(Math.random() * 10)
            ];
            gameState.step = 2;
            renderStep();
        };
        document.getElementById('btn-manual-pick').onclick = () => { gameState.step = 1; renderStep(); };
        
    } else if (gameState.step === 1) {
        container.innerHTML = `
            <div class="p-4 animate-fadeIn">
                <h3 class="text-2xl font-black text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">
                    Pick Your Numbers
                </h3>
                <div class="grid grid-cols-3 gap-4 mb-6">
                    ${[1,2,3].map(i => `
                        <div>
                            <label class="tier-label text-amber-500">Slot ${i}</label>
                            <select id="guess-${i}" class="guess-box w-full p-4 rounded-xl text-center text-2xl font-black">
                                ${[0,1,2,3,4,5,6,7,8,9].map(n => `<option value="${n}" ${gameState.guesses[i-1] === n ? 'selected' : ''}>${n}</option>`).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
                <button id="btn-confirm-numbers" class="btn-action w-full py-4 rounded-xl text-lg">
                    CONFIRM SELECTION
                </button>
            </div>`;
        
        [1,2,3].forEach(i => {
            document.getElementById(`guess-${i}`).onchange = (e) => { gameState.guesses[i-1] = parseInt(e.target.value); };
        });
        document.getElementById('btn-confirm-numbers').onclick = () => { gameState.step = 2; renderStep(); };
        
    } else if (gameState.step === 2) {
        const hasNumbers = !gameState.guesses.includes(0);
        
        container.innerHTML = `
            <div class="p-6 animate-fadeIn">
                <div class="mb-6">
                    <h3 class="text-xl font-black text-center mb-4 text-white">Your Numbers</h3>
                    <div class="grid grid-cols-3 gap-3">
                        ${gameState.guesses.map((n, i) => `
                            <div class="guess-box rounded-xl p-4 text-center">
                                <div class="tier-label text-amber-500">SLOT ${i+1}</div>
                                <div class="text-4xl font-black">${n}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="mb-6">
                    <label class="text-sm font-bold text-zinc-400 mb-2 block">Game Mode</label>
                    <div class="grid grid-cols-2 gap-3">
                        <div id="mode-single" class="mode-container glass-panel p-4 rounded-xl text-center ${!gameState.isCumulative ? 'border-amber-500' : ''}">
                            <div class="text-2xl mb-1">⚡</div>
                            <div class="font-bold text-white text-xs">SINGLE</div>
                            <div class="text-[9px] text-zinc-500 mt-1">1 round</div>
                        </div>
                        <div id="mode-cumulative" class="mode-container glass-panel p-4 rounded-xl text-center ${gameState.isCumulative ? 'mode-active-cumulative' : ''}">
                            <div class="text-2xl mb-1">🎰</div>
                            <div class="font-bold text-white text-xs">CUMULATIVE</div>
                            <div class="text-[9px] text-purple-400 mt-1">5 rounds • Higher rewards</div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <label class="text-sm font-bold text-zinc-400 mb-2 block">Bet Amount (BKC)</label>
                    <input type="number" id="bet-input" 
                        class="glass-panel w-full p-4 rounded-xl text-center text-2xl font-black text-white" 
                        placeholder="Enter BKC amount" 
                        value="${gameState.betAmount > 0 ? gameState.betAmount : ''}"
                        min="1" step="1">
                    <div class="text-[10px] text-zinc-500 mt-2 text-center">
                        Balance: ${formatBigNumber(State.currentUserBalance || 0n).toFixed(2)} BKC
                    </div>
                </div>
                
                <div id="estimated-cost-display" class="mb-4">
                    <span class="status-indicator checking">Calculating costs...</span>
                </div>
                
                <button id="btn-spin" class="btn-action w-full py-4 rounded-xl text-lg" disabled>
                    CALCULATING...
                </button>
                
                <div class="mt-4 text-center">
                    <button id="btn-back" class="text-zinc-500 text-sm hover:text-zinc-300">
                        ← Change Numbers
                    </button>
                </div>
            </div>`;
        
        document.getElementById('mode-single').onclick = () => { gameState.isCumulative = false; renderStep(); };
        document.getElementById('mode-cumulative').onclick = () => { gameState.isCumulative = true; renderStep(); };
        document.getElementById('btn-back').onclick = () => { gameState.step = 1; renderStep(); };
        
        const betInput = document.getElementById('bet-input');
        const btnSpin = document.getElementById('btn-spin');
        
        betInput.oninput = async () => {
            const val = parseFloat(betInput.value);
            gameState.betAmount = val > 0 ? val : 0;
            
            if (val > 0 && hasNumbers) {
                btnSpin.innerText = "CALCULATING GAS...";
                btnSpin.disabled = true;
                
                await updateCostDisplay();
                
                btnSpin.innerText = "SPIN TO WIN";
                btnSpin.disabled = false;
            } else {
                btnSpin.innerText = val > 0 ? "SELECT ALL NUMBERS" : "ENTER BET AMOUNT";
                btnSpin.disabled = true;
            }
        };
        
        btnSpin.onclick = async () => {
            if (gameState.betAmount > 0 && hasNumbers) {
                await executeTransaction();
            }
        };
        
        // Trigger initial cost calculation
        if (gameState.betAmount > 0 && hasNumbers) {
            updateCostDisplay().then(() => {
                btnSpin.innerText = "SPIN TO WIN";
                btnSpin.disabled = false;
            });
        }
    }
}

function updateGamificationUI() {
    const lvlEl = document.getElementById('currentLevel');
    if (lvlEl) lvlEl.innerText = gameState.currentLevel;
}

// --- SPINNING & ANIMATION ---
function startSpinning() {
    gameState.isSpinning = true;
    [1,2,3].forEach(i => document.getElementById(`slot-${i}`).classList.add('slot-spinning'));
    
    gameState.spinInterval = setInterval(() => {
        [1,2,3].forEach(i => {
            document.getElementById(`slot-${i}`).innerText = Math.floor(Math.random() * 10);
        });
    }, 80);
}

function stopSpinning(rolls, winAmount) {
    if (gameState.spinInterval) clearInterval(gameState.spinInterval);
    gameState.isSpinning = false;
    
    [1,2,3].forEach((_, idx) => {
        const el = document.getElementById(`slot-${idx+1}`);
        el.classList.remove('slot-spinning');
        el.innerText = rolls[idx];
        
        setTimeout(() => {
            if (rolls[idx] === gameState.guesses[idx]) el.classList.add('slot-hit');
            else el.classList.add('slot-miss');
        }, 100);
    });
    
    setTimeout(() => showResultOverlay(rolls, winAmount), 800);
}

function updateProgressBar(pct, msg) {
    const bar = document.getElementById('progress-bar');
    const txt = document.getElementById('progress-text');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.innerText = msg || '';
}

// --- RESULT OVERLAY ---
function showResultOverlay(rolls, winAmount) {
    const overlay = document.getElementById('result-overlay');
    const isWin = winAmount > 0n;
    const matchedCount = rolls.filter((r, i) => r === gameState.guesses[i]).length;
    
    let title = 'BETTER LUCK NEXT TIME';
    let subtitle = 'No numbers matched';
    let emoji = '😔';
    
    if (isWin) {
        if (matchedCount === 3) { title = '🎉 JACKPOT!'; emoji = '🤑'; subtitle = 'Perfect match!'; }
        else if (matchedCount === 2) { title = '🎊 BIG WIN!'; emoji = '😎'; subtitle = '2 numbers matched!'; }
        else { title = '✨ WINNER!'; emoji = '🎯'; subtitle = '1 number matched!'; }
    }
    
    const winAmountFormatted = formatBigNumber(winAmount).toFixed(2);
    
    document.getElementById('result-title').innerText = title;
    document.getElementById('result-emoji').innerText = emoji;
    document.getElementById('result-subtitle').innerText = subtitle;
    document.getElementById('result-amount').innerText = isWin ? `+${winAmountFormatted} BKC` : '0 BKC';
    document.getElementById('result-amount').className = isWin ? 'text-4xl font-black text-green-400' : 'text-4xl font-black text-red-500';
    
    const detailsHTML = `
        <div class="grid grid-cols-3 gap-3 mb-6">
            ${rolls.map((r, i) => `
                <div class="text-center">
                    <div class="tier-label ${r === gameState.guesses[i] ? 'text-green-400' : 'text-red-400'}">
                        ${r === gameState.guesses[i] ? '✓ MATCH' : '✗ MISS'}
                    </div>
                    <div class="text-3xl font-black ${r === gameState.guesses[i] ? 'text-green-400' : 'text-zinc-600'}">
                        ${r}
                    </div>
                    <div class="text-xs text-zinc-500">vs ${gameState.guesses[i]}</div>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('result-details').innerHTML = detailsHTML;
    
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    
    if (isWin) addXP(matchedCount * 100);
    
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just ${isWin ? 'WON' : 'played'} ${winAmountFormatted} BKC on @BackcoinEco Fortune Pool! 🎰\n\n${isWin ? '🎉' : '💪'} Try your luck: https://app.backcoin.org`)}`;
    
    if (isWin) {
        document.getElementById('btn-share-win').onclick = () => window.open(shareUrl, '_blank');
    } else {
        document.getElementById('btn-share-loss').onclick = () => window.open(shareUrl, '_blank');
    }
}

function closeOverlay() {
    const overlay = document.getElementById('result-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.getElementById('status-area').classList.add('hidden-force');
    document.getElementById('status-area').classList.remove('flex');
    document.getElementById('controls-area').classList.remove('hidden-force');
    document.getElementById('progress-bar').classList.remove('finish');
    document.getElementById('progress-bar').style.width = '0%';
    
    [1,2,3].forEach(i => {
        const el = document.getElementById(`slot-${i}`);
        el.className = "slot-box rounded-2xl h-20 flex items-center justify-center text-4xl font-black text-zinc-700 transition-all";
        el.innerText = "?";
        el.classList.remove('slot-hit', 'slot-miss');
    });
    
    const btnSpin = document.getElementById('btn-spin');
    if (btnSpin && gameState.betAmount > 0) {
        btnSpin.disabled = false;
        btnSpin.innerText = "SPIN TO WIN";
    }
    
    FortunePoolPage.loadHistory();
    loadUserData(true);
}

// -------------------------------------------------------------
// 🔥 MELHORADO: Gas Check com Feedback Visual
// -------------------------------------------------------------
async function checkGasAndWarn() {
    try {
        const nativeBalance = await State.provider.getBalance(State.userAddress);
        const minGas = ethers.parseEther("0.002"); 
        
        if (nativeBalance < minGas) {
            console.warn("⚠️ Low Gas Detected:", ethers.formatEther(nativeBalance));
            
            // Show enhanced warning
            const warningEl = document.getElementById('gas-warning-container');
            if (warningEl) {
                warningEl.innerHTML = `
                    <div class="eth-balance-warning">
                        <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                        <div class="flex-1">
                            <div class="font-bold">Insufficient ETH for Gas</div>
                            <div class="text-xs mt-1">
                                You have ${ethers.formatEther(nativeBalance)} ETH. 
                                Minimum required: 0.002 ETH
                            </div>
                        </div>
                    </div>
                `;
            }
            
            const modal = document.getElementById('no-gas-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
            return false;
        }
        
        // Clear warning if exists
        const warningEl = document.getElementById('gas-warning-container');
        if (warningEl) warningEl.innerHTML = '';
        
        return true;
    } catch (e) {
        console.error("Gas check failed", e);
        return true; // Fail safe
    }
}

// -------------------------------------------------------------
// 🔥 TRANSACTION EXECUTION V40: Full Dynamic Gas + Enhanced UX
// -------------------------------------------------------------
async function executeTransaction() {
    if (!State.isConnected) return showToast("Connect wallet", "error");
    
    if (gameState.guesses.includes(0)) {
        showToast("Select all 3 numbers!", "error");
        if (gameState.guesses[0] === 0) { gameState.step = 1; renderStep(); }
        return;
    }

    // 1. Gas Guard Check
    const hasGas = await checkGasAndWarn();
    if (!hasGas) return;

    await FortunePoolPage.checkReqs();
    if (!gameState.systemReady) { showToast("System Offline", "error"); return; }
    if (gameState.betAmount <= 0) return;
    
    const btn = document.getElementById('btn-spin');
    const amountWei = ethers.parseEther(gameState.betAmount.toString());
    const isCumulative = gameState.isCumulative;
    let fee = 0n;

    // 2. Calculate Oracle Fee (EXACT MATCHING)
    try {
        console.log("🔍 [INIT] Fetching oracleFeeInWei from contract...");
        const baseFee = await State.actionsManagerContract.oracleFeeInWei();
        const baseFeeBigInt = BigInt(baseFee); 
        console.log("   > Base Fee (Contract):", baseFeeBigInt.toString(), "Wei");
        
        const rawFee = isCumulative ? (baseFeeBigInt * 5n) : baseFeeBigInt;
        fee = rawFee; // Exact fee, no margin
        gameState.oracleFee = baseFeeBigInt;
        
        console.log("✅ Oracle Fee (Exact):", fee.toString(), "Wei");
    } catch (e) {
        const FALLBACK_BASE_FEE = ethers.parseEther("0.00035"); 
        fee = isCumulative ? (FALLBACK_BASE_FEE * 5n) : FALLBACK_BASE_FEE;
        gameState.oracleFee = FALLBACK_BASE_FEE;
        console.warn("⚠️ Using fallback oracle fee:", fee.toString());
    }
    
    btn.disabled = true;
    
    // 🔥 NOVO: Show transaction steps
    const statusArea = document.getElementById('status-area');
    statusArea.classList.remove('hidden-force');
    statusArea.classList.add('flex');
    statusArea.innerHTML = `
        <div class="w-full max-w-md mx-auto">
            <h3 class="text-lg font-bold text-center mb-4 text-white">Processing Transaction</h3>
            
            <div id="step-approve" class="transaction-step">
                <div class="step-icon pending">
                    <i class="fa-solid fa-check"></i>
                </div>
                <div class="flex-1">
                    <div class="font-bold text-white text-sm">Step 1: Approve BKC</div>
                    <div class="text-xs text-zinc-500" id="step-approve-status">Waiting...</div>
                </div>
            </div>
            
            <div id="step-participate" class="transaction-step">
                <div class="step-icon pending">
                    <i class="fa-solid fa-play"></i>
                </div>
                <div class="flex-1">
                    <div class="font-bold text-white text-sm">Step 2: Start Game</div>
                    <div class="text-xs text-zinc-500" id="step-participate-status">Waiting...</div>
                </div>
            </div>
            
            <div id="step-oracle" class="transaction-step">
                <div class="step-icon pending">
                    <i class="fa-solid fa-robot"></i>
                </div>
                <div class="flex-1">
                    <div class="font-bold text-white text-sm">Step 3: Oracle Response</div>
                    <div class="text-xs text-zinc-500" id="step-oracle-status">Waiting...</div>
                </div>
            </div>
        </div>
    `;
    
    try {
        // 3. STEP 1: Approval with Dynamic Gas
        const spender = addresses.fortunePool;
        const stepApprove = document.getElementById('step-approve');
        const stepApproveStatus = document.getElementById('step-approve-status');
        const stepApproveIcon = stepApprove.querySelector('.step-icon');
        
        stepApprove.classList.add('active');
        stepApproveIcon.classList.remove('pending');
        stepApproveIcon.classList.add('active');
        stepApproveStatus.textContent = 'Checking allowance...';
        
        try {
            const currentAllowance = await State.bkcTokenContract.allowance(State.userAddress, spender);
            
            if (currentAllowance < amountWei) {
                stepApproveStatus.textContent = 'Estimating gas...';
                
                // 🔥 GÁS DINÂMICO na Aprovação
                const gasOpts = await getGasWithMargin(State.bkcTokenContract, 'approve', [spender, amountWei]);
                
                stepApproveStatus.textContent = `Approve ${formatBigNumber(amountWei).toFixed(2)} BKC (${gasOpts.gasLimit.toString()} gas)`;
                
                const approveTx = await State.bkcTokenContract.approve(spender, amountWei, gasOpts);
                
                stepApproveStatus.textContent = 'Waiting for confirmation...';
                await approveTx.wait();
                
                stepApproveIcon.classList.remove('active');
                stepApproveIcon.classList.add('complete');
                stepApproveStatus.textContent = '✅ Approved!';
                stepApprove.classList.remove('active');
                stepApprove.classList.add('complete');
                
                showToast("✅ BKC Approved!", "success");
            } else {
                stepApproveIcon.classList.remove('active');
                stepApproveIcon.classList.add('complete');
                stepApproveStatus.textContent = '✅ Already approved';
                stepApprove.classList.remove('active');
                stepApprove.classList.add('complete');
            }
        } catch (approvalError) {
            console.error("❌ Approval Failed:", approvalError);
            
            stepApproveIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            stepApproveIcon.style.background = 'rgba(239, 68, 68, 0.2)';
            stepApproveIcon.style.color = '#ef4444';
            stepApproveStatus.textContent = '❌ Failed';
            
            await checkGasAndWarn();
            
            const msg = approvalError.message?.includes("insufficient funds") 
                ? "Insufficient ETH for gas" 
                : "Approval failed";
            showToast(msg, "error");
            
            btn.disabled = false;
            btn.innerText = "START MINING";
            return;
        }
        
        // 4. STEP 2: Participate with Dynamic Gas
        const stepParticipate = document.getElementById('step-participate');
        const stepParticipateStatus = document.getElementById('step-participate-status');
        const stepParticipateIcon = stepParticipate.querySelector('.step-icon');
        
        stepParticipate.classList.add('active');
        stepParticipateIcon.classList.remove('pending');
        stepParticipateIcon.classList.add('active');
        stepParticipateStatus.textContent = 'Estimating gas...';
        
        const guessesAsBigInt = gameState.guesses.map(g => BigInt(g));
        
        console.log("🚀 DEBUG PARTICIPATE V40:", {
            contractAddress: addresses.fortunePool,
            amountBKC: amountWei.toString(),
            guesses: guessesAsBigInt.map(g => g.toString()),
            feeETH: fee.toString(),
            isCumulative
        });
        
        // 🔥 ESTIMATIVA DE GÁS COM MARGEM (Dynamic Gas)
        const baseArgs = [amountWei, guessesAsBigInt, isCumulative];
        let gasOptsWithValue;
        
        try {
            stepParticipateStatus.textContent = 'Calculating optimal gas...';
            
            const estimatedGas = await State.actionsManagerContract.participate.estimateGas(
                ...baseArgs,
                { value: fee }
            );
            const gasWithMargin = (estimatedGas * 120n) / 100n;
            
            console.log(`✅ Participate Gas Estimated: ${estimatedGas.toString()} → ${gasWithMargin.toString()} (+20%)`);
            
            gasOptsWithValue = { value: fee, gasLimit: gasWithMargin };
            stepParticipateStatus.textContent = `Sending tx (${gasWithMargin.toString()} gas)...`;
            
        } catch (estimateError) {
            console.warn("⚠️ Gas estimation failed for participate. Using fallback 800k.", estimateError);
            gasOptsWithValue = { value: fee, gasLimit: 800000n };
            stepParticipateStatus.textContent = 'Sending tx (800k gas fallback)...';
        }
        
        const tx = await State.actionsManagerContract.participate(...baseArgs, gasOptsWithValue);
        
        stepParticipateStatus.textContent = 'Waiting for block confirmation...';
        startSpinning();
        
        await tx.wait();
        
        stepParticipateIcon.classList.remove('active');
        stepParticipateIcon.classList.add('complete');
        stepParticipateStatus.textContent = '✅ Transaction confirmed!';
        stepParticipate.classList.remove('active');
        stepParticipate.classList.add('complete');
        
        updateProgressBar(40, "BLOCK MINED. WAITING ORACLE...");
        
        // 5. STEP 3: Monitor Oracle
        const stepOracle = document.getElementById('step-oracle');
        const stepOracleStatus = document.getElementById('step-oracle-status');
        const stepOracleIcon = stepOracle.querySelector('.step-icon');
        
        stepOracle.classList.add('active');
        stepOracleIcon.classList.remove('pending');
        stepOracleIcon.classList.add('active');
        stepOracleStatus.textContent = 'Requesting random numbers...';
        
        const ctr = await safeContractCall(State.actionsManagerContract, 'gameCounter', [], 0, 2, true);
        const gameIdToWatch = Number(ctr) > 0 ? Number(ctr) - 1 : 0; 
        
        console.log(`✅ TX Confirmed. Counter is ${ctr}. Watching Game #${gameIdToWatch}`);
        
        stepOracleStatus.textContent = `Waiting for Game #${gameIdToWatch} result...`;
        
        setTimeout(() => waitForOracle(gameIdToWatch), 2000);
        
    } catch (e) {
        console.error("❌ Tx Failed. Full Error:", e);
        btn.disabled = false; 
        btn.innerText = "START MINING";
        
        const lowGas = await checkGasAndWarn();
        if (!lowGas) return;

        let msg = "Transaction Failed";
        
        if (e.message && e.message.includes("cf07063a")) msg = "Fee Mismatch (Clear Cache!)";
        else if (e.message && e.message.includes("insufficient funds")) msg = "Insufficient ETH for Gas";
        else if (e.code === -32603) msg = "RPC Error: Reset Metamask & Check Balance";
        else if (e.code === "ACTION_REJECTED") msg = "User rejected transaction";
        else if (e.message.includes("InvalidFee")) msg = "Invalid Fee Amount";
        
        showToast(msg, "error");
        
        document.getElementById('status-area').classList.add('hidden-force');
        document.getElementById('controls-area').classList.remove('hidden-force');
    }
}

async function waitForOracle(gameId) {
    let attempts = 0; 
    let progress = 40;
    
    if (gameState.pollInterval) clearInterval(gameState.pollInterval);
    
    const stepOracleStatus = document.getElementById('step-oracle-status');
    const stepOracle = document.getElementById('step-oracle');
    const stepOracleIcon = stepOracle.querySelector('.step-icon');
    
    gameState.pollInterval = setInterval(async () => {
        attempts++; 
        progress += 2; 
        if (progress > 95) progress = 95;
        
        updateProgressBar(progress, `ORACLE CONSENSUS (Game ${gameId})...`);
        if (stepOracleStatus) stepOracleStatus.textContent = `Polling attempt ${attempts}/60...`;
        
        if (attempts > 60) {
            clearInterval(gameState.pollInterval); 
            stopSpinning([0,0,0], 0n);
            
            if (stepOracleIcon) {
                stepOracleIcon.innerHTML = '<i class="fa-solid fa-clock"></i>';
                stepOracleIcon.style.background = 'rgba(251, 191, 36, 0.2)';
                stepOracleIcon.style.color = '#fbbf24';
            }
            if (stepOracleStatus) stepOracleStatus.textContent = '⏰ Timeout - Check history later';
            
            showToast("Oracle delay. Check history later.", "info"); 
            return;
        }
        
        try {
            const res = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
            const data = await res.json();
            const lastGame = data.filter(a => a.type === 'GameResult').sort((a, b) => {
                const timeA = a.timestamp?.seconds || a.createdAt?.seconds || 0;
                const timeB = b.timestamp?.seconds || b.createdAt?.seconds || 0;
                return timeB - timeA;
            })[0];
            
            if (lastGame && Number(lastGame.details.gameId) === gameId) {
                clearInterval(gameState.pollInterval);
                
                if (stepOracleIcon) {
                    stepOracleIcon.classList.remove('active');
                    stepOracleIcon.classList.add('complete');
                }
                if (stepOracleStatus) stepOracleStatus.textContent = '✅ Result received!';
                if (stepOracle) {
                    stepOracle.classList.remove('active');
                    stepOracle.classList.add('complete');
                }
                
                updateProgressBar(100, "RESULT READY!");
                
                const rolls = lastGame.details.rolls || [0,0,0];
                const winAmount = BigInt(lastGame.details.amount || '0');
                
                setTimeout(() => stopSpinning(rolls, winAmount), 500);
            }
        } catch (err) {
            console.log("Polling...");
        }
    }, 2000);
}

// -------------------------------------------------------------
// FAUCET REQUEST (Backend Integration)
// -------------------------------------------------------------
async function requestFaucetETH() {
    if (!State.userAddress) return showToast("Connect wallet first.", "error");
    
    const btn = document.getElementById('btn-request-eth');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<div class="loader inline-block mr-2"></div> Requesting...';
    }
    
    try {
        const res = await fetch(FAUCET_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: State.userAddress })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
            showToast(`✅ ${data.message}`, "success");
            if (data.txHash) {
                setTimeout(() => {
                    showToast(`TX: ${data.txHash.slice(0, 10)}...`, "info");
                }, 1500);
            }
        } else {
            showToast(`⚠️ ${data.error || 'Faucet Error'}`, "error");
        }
    } catch (e) {
        console.error("Faucet Error:", e);
        showToast("Faucet unavailable. Try again later.", "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Request ETH';
        }
    }
}

// -------------------------------------------------------------
// PAGE OBJECT
// -------------------------------------------------------------
const FortunePoolPage = {
    checkReqs: async () => {
        const el = document.getElementById('oracleFeeStatus');
        const pstakeEl = document.getElementById('pstakeStatus');
        const btn = document.getElementById('btn-spin');
        
        if (!el) return;
        
        let tierCount = 0;
        try {
            if (State.ecosystemManagerContractPublic) {
                const key = ethers.id("TIGER_GAME_SERVICE");
                const [fee, tierCountBigInt] = await State.ecosystemManagerContractPublic.getServiceRequirements(key);
                tierCount = Number(tierCountBigInt);
            }
        } catch (e) {
            console.warn("Could not check tier count:", e);
        }
        
        const MIN_PSTAKE_KEY = "TIGER_GAME_SERVICE";
        const minPStake = State.systemPStakes?.[MIN_PSTAKE_KEY] || 0n;
        const userPStake = State.userTotalPStake || 0n;
        let isPStakeOK = true;

        if (minPStake > 0n && userPStake < minPStake) {
            isPStakeOK = false;
            const requiredBkc = formatBigNumber(minPStake).toFixed(2);
            pstakeEl.innerHTML = `<span class="status-indicator error">❌ PSTAKE: ${requiredBkc} BKC Required</span>`;
        } else {
            pstakeEl.innerHTML = `<span class="status-indicator ready">✅ PSTAKE OK (${formatBigNumber(userPStake).toFixed(2)} BKC)</span>`;
        }

        let fee = 0n;
        try {
            let baseFee = await safeContractCall(State.actionsManagerContract, 'oracleFeeInWei', [], 0n);
            if (baseFee === 0n) baseFee = ethers.parseEther("0.00035"); 
            fee = gameState.isCumulative ? (baseFee * 5n) : baseFee;
        } catch (e) { 
            fee = ethers.parseEther(gameState.isCumulative ? "0.00175" : "0.00035");
        }
        
        if (el) { 
            const feeEth = ethers.formatEther(fee); 
            el.innerHTML = `<span class="status-indicator ready">Oracle Fee: ${feeEth} ETH</span>`;
        }
        
        gameState.systemReady = isPStakeOK && (addresses.fortunePool && State.actionsManagerContract);
        const inp = document.getElementById('bet-input');

        if (inp && parseFloat(inp.value) > 0) { 
            if (btn) { 
                btn.disabled = !gameState.systemReady; 
                btn.innerText = gameState.systemReady ? "SPIN TO WIN" : "SYSTEM ERROR / PSTAKE MISSING";
            } 
        }
    },

    loadHistory: async () => {
        const list = document.getElementById('gameHistoryList');
        const statsEl = document.getElementById('totalWinningsDisplay');
        if (!list || !State.isConnected) return;
        
        try {
            const res = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
            const data = await res.json();
            const games = data.filter(a => a.type === 'GameResult');
            
            let totalWinnings = 0;
            games.forEach(g => {
                if (g.details.isWin) totalWinnings += parseFloat(ethers.formatEther(g.details.amount));
            });
            if (statsEl) statsEl.innerHTML = `Total Won: <span class="text-amber-400 font-bold">${totalWinnings.toFixed(2)} BKC</span>`;

            list.innerHTML = games.slice(0, 10).map(g => {
                const isWin = g.details.isWin || false;
                const winAmount = g.details.amount || '0';
                const dateStr = formatDate(g.timestamp || g.createdAt);
                
                const explorerLink = g.txHash ? `${EXPLORER_BASE}${g.txHash}` : '#';
                
                const userGuesses = g.details.userGuesses || ['?', '?', '?'];
                const oracleRolls = g.details.rolls || ['?', '?', '?'];
                
                const numbersHTML = `
                    <div class="flex flex-col gap-1 items-center font-mono text-[12px]">
                        <div class="flex gap-2 items-center text-blue-400" title="Your Guesses">
                            <i class="fa-solid fa-user text-[10px]"></i>
                            ${userGuesses.map(n => `<span class="font-bold">${n}</span>`).join('<span class="text-zinc-700 mx-1">|</span>')}
                        </div>
                        <div class="flex gap-2 items-center text-zinc-500" title="Oracle Result">
                            <i class="fa-solid fa-robot text-[10px]"></i>
                            ${oracleRolls.map((n, i) => {
                                const isMatch = parseInt(n) === parseInt(userGuesses[i]);
                                return `<span class="${isMatch ? 'text-green-400 font-black animate-pulse' : ''}">${n}</span>`;
                            }).join('<span class="text-zinc-700 mx-1">|</span>')}
                        </div>
                    </div>
                `;

                let outcomeDisplay = '';
                if (isWin) {
                    outcomeDisplay = `<div class="text-right"><div class="text-green-400 font-bold text-sm">WIN</div><div class="text-white text-xs font-mono">+${formatBigNumber(BigInt(winAmount)).toFixed(2)}</div></div>`;
                } else {
                    outcomeDisplay = `<div class="text-right"><div class="text-red-500 font-bold text-sm">LOSS</div><div class="text-red-900/50 text-[10px] font-mono">BET LOST</div></div>`;
                }

                return `
                    <tr class="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td class="p-4 align-middle">
                            <a href="${explorerLink}" target="_blank" class="flex flex-col group text-left">
                                <span class="text-sm font-mono text-zinc-400 group-hover:text-amber-500 transition-colors">
                                    #${g.details.gameId} <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-50"></i>
                                </span>
                                <span class="text-[10px] text-zinc-600">${dateStr}</span>
                            </a>
                        </td>
                        <td class="text-center p-2 align-middle">
                            ${numbersHTML}
                        </td>
                        <td class="p-4 align-middle">
                            ${outcomeDisplay}
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (e) {
            console.error("History Error", e);
            list.innerHTML = `<tr><td colspan="3" class="text-center text-xs text-zinc-600 py-4">History unavailable</td></tr>`;
        }
    },
    
    render(isActive) {
        if (!isActive) return;
        const container = document.getElementById('actions');
        if (!addresses.fortunePool) { container.innerHTML = "Error Config"; return; }
        
        container.innerHTML = `
            <div class="fortune-pool-wrapper max-w-2xl mx-auto py-8 animate-fadeIn">
                <header class="flex justify-between items-end border-b border-zinc-800 pb-4 mb-6">
                    <div>
                        <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 italic">
                            FORTUNE POOL
                        </h1>
                        <p class="text-xs text-zinc-500 mt-1">Dynamic Gas • Enhanced UX • V40</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-bold text-amber-500">LVL <span id="currentLevel">1</span></div>
                    </div>
                </header>
                
                <!-- Main Game Area -->
                <div class="glass-panel p-1 rounded-3xl relative overflow-hidden min-h-[450px] flex flex-col justify-center bg-black/40">
                    <div id="game-interaction-area" class="p-4 transition-opacity duration-300"></div>
                </div>
                
                <!-- Status Bar -->
                <div class="flex flex-col gap-2 text-[10px] font-mono mt-4 px-4">
                    <div class="flex justify-between items-center">
                        <div id="pstakeStatus" class="flex-1">
                            <span class="status-indicator checking">Checking PStake...</span>
                        </div>
                        <div id="oracleFeeStatus" class="text-right flex-1">
                            <span class="status-indicator checking">Checking Fee...</span>
                        </div>
                    </div>
                    <div id="gas-warning-container"></div>
                </div>
                
                <!-- Transaction Progress Area (Hidden by default) -->
                <div id="status-area" class="hidden-force flex-col items-center justify-center p-6 mt-4 glass-panel rounded-2xl">
                    <!-- Populated dynamically during transaction -->
                </div>
                
                <!-- Game Controls (Slots Display) -->
                <div id="controls-area" class="mt-6">
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        ${[1,2,3].map(i => `
                            <div class="text-center">
                                <div class="tier-label text-amber-500">SLOT ${i}</div>
                                <div id="slot-${i}" class="slot-box rounded-2xl h-20 flex items-center justify-center text-4xl font-black text-zinc-700 transition-all">
                                    ?
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="progress-track">
                        <div id="progress-bar" class="progress-fill"></div>
                    </div>
                    <div id="progress-text" class="text-center text-xs text-zinc-500 mt-2"></div>
                </div>
                
                <!-- Game History -->
                <div class="mt-8">
                    <div class="flex justify-between items-center mb-3 ml-2 mr-2">
                        <h4 class="text-zinc-500 text-xs font-bold uppercase">Recent Results</h4>
                        <div id="totalWinningsDisplay" class="text-xs font-mono text-zinc-400"></div>
                    </div>
                    <div class="bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800">
                        <table class="w-full">
                            <tbody id="gameHistoryList">
                                <tr><td colspan="3" class="text-center py-4"><div class="simple-loader"></div></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Result Overlay -->
            <div id="result-overlay" class="hidden fixed inset-0 bg-black/90 backdrop-blur-md items-center justify-center z-50" style="z-index: 9999;">
                <div class="glass-panel p-8 rounded-3xl max-w-md w-full mx-4 animate-fadeIn">
                    <div class="text-center mb-6">
                        <div class="text-6xl mb-3" id="result-emoji">🎲</div>
                        <h2 class="text-3xl font-black text-white mb-2" id="result-title">RESULT</h2>
                        <p class="text-zinc-400 text-sm" id="result-subtitle">Checking...</p>
                    </div>
                    <div id="result-details" class="mb-6"></div>
                    <div class="text-center mb-6">
                        <div id="result-amount" class="text-4xl font-black text-amber-400">0 BKC</div>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="FortunePoolPage.closeOverlay()" class="flex-1 glass-panel py-3 rounded-xl font-bold text-white hover:bg-zinc-800 transition-all">
                            Play Again
                        </button>
                        <button id="btn-share-win" class="flex-1 btn-action py-3 rounded-xl font-bold">
                            Share <i class="fa-brands fa-twitter ml-1"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- No Gas Modal -->
            <div id="no-gas-modal" class="hidden fixed inset-0 bg-black/90 backdrop-blur-md items-center justify-center z-50">
                <div class="glass-panel p-8 rounded-3xl max-w-md w-full mx-4">
                    <div class="text-center mb-6">
                        <div class="text-6xl mb-3">⛽</div>
                        <h2 class="text-2xl font-black text-white mb-2">Insufficient ETH</h2>
                        <p class="text-zinc-400 text-sm">You need Sepolia ETH to pay for gas fees</p>
                    </div>
                    <div class="bg-zinc-900/50 p-4 rounded-xl mb-6">
                        <div class="text-xs text-zinc-500 mb-2">Required minimum:</div>
                        <div class="text-xl font-bold text-amber-400">0.002 ETH</div>
                    </div>
                    <div class="flex flex-col gap-3">
                        <button id="btn-request-eth" onclick="requestFaucetETH()" class="btn-action py-3 rounded-xl font-bold">
                            Get ETH from Faucet
                        </button>
                        <button onclick="document.getElementById('no-gas-modal').classList.add('hidden')" class="glass-panel py-3 rounded-xl font-bold text-white hover:bg-zinc-800 transition-all">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        gameState.step = 0; 
        renderStep(); 
        this.checkReqs(); 
        this.loadHistory(); 
        updateGamificationUI();
    },
    
    closeOverlay
};

// Global exports
window.FortunePoolPage = FortunePoolPage;
window.requestFaucetETH = requestFaucetETH;
window.closeOverlay = closeOverlay;