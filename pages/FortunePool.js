// js/pages/FortunePool.js
// ✅ PRODUCTION V38: FIXED REFERENCE ERROR + SAFE GAS

import { State } from '../state.js';
import { loadUserData, safeContractCall, API_ENDPOINTS } from '../modules/data.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';

const ethers = window.ethers;
const FAUCET_API_URL = "http://64.225.122.2:8080/faucet"; 

// --- STYLES INJECTION ---
const style = document.createElement('style');
style.innerHTML = `
    .fortune-container {
        background: radial-gradient(circle at top, #1a1a1e 0%, #000000 100%);
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 0 50px rgba(0,0,0,0.8);
        border-radius: 24px;
        overflow: hidden;
        position: relative;
    }
    .slot-window {
        background: #09090b;
        border: 2px solid #27272a;
        box-shadow: inset 0 0 20px #000;
        border-radius: 16px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
    }
    .slot-window.active { border-color: #f59e0b; box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
    .slot-window.winner { border-color: #10b981; background: rgba(16, 185, 129, 0.1); box-shadow: 0 0 30px rgba(16, 185, 129, 0.4); }
    .slot-window.loser { border-color: #ef4444; opacity: 0.5; }
    
    .slot-number {
        font-size: 3.5rem;
        font-weight: 900;
        color: #52525b;
        font-family: 'Courier New', monospace;
        z-index: 2;
    }
    .slot-window.winner .slot-number { color: #fff; text-shadow: 0 0 10px #10b981; transform: scale(1.1); }
    
    @keyframes slotSpin {
        0% { transform: translateY(0); filter: blur(0); }
        50% { transform: translateY(-5px); filter: blur(4px); }
        100% { transform: translateY(0); filter: blur(0); }
    }
    .spinning .slot-number { animation: slotSpin 0.1s infinite linear; color: #fbbf24; opacity: 0.8; }

    .status-bar {
        background: #18181b;
        border-top: 1px solid #27272a;
        padding: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: monospace;
        font-size: 10px;
        color: #71717a;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #3f3f46; margin-right: 8px; display: inline-block; }
    .status-dot.active { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; animation: pulse 1s infinite; }
    @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

    .bet-btn { 
        background: #27272a; color: #a1a1aa; border: 1px solid #3f3f46; 
        transition: all 0.2s; font-weight: bold; font-size: 10px;
    }
    .bet-btn:hover { background: #3f3f46; color: white; border-color: #71717a; }
    .action-btn {
        background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
        color: black; font-weight: 900; letter-spacing: 1px;
        text-transform: uppercase; border: none;
        box-shadow: 0 4px 0 #92400e;
        transition: all 0.1s;
    }
    .action-btn:active { transform: translateY(4px); box-shadow: none; }
    .action-btn:disabled { background: #3f3f46; color: #71717a; box-shadow: none; cursor: not-allowed; transform: none; }

    .result-overlay {
        position: absolute; inset: 0; 
        background: rgba(0,0,0,0.95); 
        backdrop-filter: blur(10px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        z-index: 50; opacity: 0; pointer-events: none; transition: opacity 0.3s;
    }
    .result-overlay.visible { opacity: 1; pointer-events: all; }
`;
document.head.appendChild(style);

// --- GLOBAL STATE ---
let gameState = {
    step: 0,
    isSpinning: false,
    pollInterval: null,
    spinInterval: null,
    guesses: [0, 0, 0],
    isCumulative: true,
    betAmount: 0,
    currentLevel: 1,
    currentXP: 0,
    xpPerLevel: 1000,
    systemReady: false
};

// --- GAMIFICATION HELPERS ---
const Gamification = {
    updateUI: () => {
        const el = document.getElementById('currentLevel'); 
        if (el) el.innerText = gameState.currentLevel; 
    },
    save: () => {
        localStorage.setItem('bkc_fortune_v38', JSON.stringify({ lvl: gameState.currentLevel, xp: gameState.currentXP })); 
        Gamification.updateUI(); 
    },
    addXP: (amount) => {
        gameState.currentXP += amount; 
        if (gameState.currentXP >= gameState.xpPerLevel) { 
            gameState.currentLevel++; 
            gameState.currentXP -= gameState.xpPerLevel; 
            showToast(`🆙 LEVEL UP! LVL ${gameState.currentLevel}`, "success"); 
        } 
        Gamification.save(); 
    },
    load: () => {
        try {
            const local = localStorage.getItem('bkc_fortune_v38');
            if (local) { 
                const p = JSON.parse(local); 
                gameState.currentLevel = p.lvl || 1; 
                gameState.currentXP = p.xp || 0; 
            }
        } catch (e) {}
    }
};

Gamification.load();

// --- GAS HELPERS ---
async function getGasWithMargin(contract, method, args) {
    try {
        const estimatedGas = await contract[method].estimateGas(...args);
        return { gasLimit: (estimatedGas * 120n) / 100n }; 
    } catch (error) {
        console.warn(`⚠️ Gas estimation failed for ${method}. Using fallback.`, error);
        return { gasLimit: 3000000n }; 
    }
}

// --- RENDER FUNCTIONS ---
function renderGame(container) {
    container.innerHTML = `
        <div class="fortune-container w-full max-w-2xl mx-auto min-h-[500px] flex flex-col justify-between">
            <div class="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div class="flex items-center gap-3">
                    <img src="assets/bkc_logo_3d.png" class="w-8 h-8 animate-pulse" alt="BKC">
                    <div>
                        <h2 class="text-xl font-black text-white leading-none tracking-tighter">FORTUNE POOL</h2>
                        <span class="text-[10px] text-amber-500 font-bold tracking-widest">REAL YIELD MINING</span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-[10px] text-zinc-500 uppercase font-bold">Player Level</div>
                    <div class="text-white font-mono font-bold">LVL <span id="currentLevel">${gameState.currentLevel}</span></div>
                </div>
            </div>

            <div id="game-stage" class="flex-1 p-6 flex flex-col justify-center relative"></div>
            <div id="controls-panel" class="p-6 bg-black/40 border-t border-white/5"></div>

            <div class="status-bar">
                <div class="flex items-center">
                    <span id="status-dot" class="status-dot"></span>
                    <span id="status-text">SYSTEM READY</span>
                </div>
                <div class="text-zinc-600">ARBITRUM SEPOLIA</div>
            </div>
            
            <div id="result-overlay" class="result-overlay"></div>
            
            <div id="no-gas-modal" class="absolute inset-0 z-[60] hidden flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                 <div class="p-6 max-w-sm text-center bg-zinc-900 border border-red-500/30 rounded-2xl">
                    <i class="fa-solid fa-gas-pump text-3xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-white mb-2">Out of Gas!</h3>
                    <p class="text-zinc-400 text-xs mb-6">You need ETH to pay for the oracle fee.</p>
                    <button id="btn-emergency-faucet" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl">Get Free Gas</button>
                    <button id="close-gas-modal" class="mt-3 text-zinc-500 text-xs underline">Close</button>
                </div>
            </div>
        </div>
    `;

    renderStep();
    
    document.getElementById('close-gas-modal').onclick = () => document.getElementById('no-gas-modal').classList.add('hidden');
    document.getElementById('btn-emergency-faucet').onclick = function() { requestGaslessRefuel(this); };
}

function renderStep() {
    const stage = document.getElementById('game-stage');
    const controls = document.getElementById('controls-panel');
    if (!stage || !controls) return;

    stage.style.opacity = '0';
    setTimeout(() => {
        if (gameState.step === 0) renderIntro(stage, controls);
        else if (gameState.step >= 1 && gameState.step <= 3) renderPicker(stage, controls);
        else if (gameState.step === 4) renderSlots(stage, controls);
        stage.style.opacity = '1';
    }, 200);
}

function renderIntro(stage, controls) {
    stage.innerHTML = `
        <div class="text-center">
            <h1 class="text-4xl font-black text-white mb-2 drop-shadow-[0_0_15px_rgba(255,165,0,0.5)]">TEST YOUR LUCK</h1>
            <p class="text-zinc-400 text-sm mb-8 max-w-xs mx-auto">Select your lucky numbers. Match the Oracle to multiply your BKC.</p>
            <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <button id="btn-random-all" class="bg-zinc-800 hover:bg-zinc-700 hover:border-amber-500 border border-zinc-700 p-6 rounded-2xl transition-all group">
                    <div class="text-4xl mb-2 group-hover:scale-110 transition-transform">🎲</div>
                    <div class="font-bold text-white text-sm">RANDOM</div>
                    <div class="text-[10px] text-zinc-500">Quick Pick</div>
                </button>
                <button id="btn-manual-pick" class="bg-zinc-800 hover:bg-zinc-700 hover:border-blue-500 border border-zinc-700 p-6 rounded-2xl transition-all group">
                    <div class="text-4xl mb-2 group-hover:scale-110 transition-transform">🧠</div>
                    <div class="font-bold text-white text-sm">MANUAL</div>
                    <div class="text-[10px] text-zinc-500">Strategy</div>
                </button>
            </div>
        </div>`;
    controls.innerHTML = `<div class="text-center text-[10px] text-zinc-600">Select a mode to begin</div>`;
    
    document.getElementById('btn-random-all').onclick = () => { gameState.guesses = [rand(3), rand(10), rand(100)]; gameState.step = 4; renderStep(); };
    document.getElementById('btn-manual-pick').onclick = () => { gameState.step = 1; renderStep(); };
}

function renderPicker(stage, controls) {
    const tiers = [{ max: 3, name: "BRONZE", reward: "1.5x" }, { max: 10, name: "SILVER", reward: "5x" }, { max: 100, name: "GOLD", reward: "50x" }];
    const t = tiers[gameState.step - 1];
    
    let grid = "";
    if (t.max <= 10) {
        grid = `<div class="flex flex-wrap justify-center gap-3">${Array.from({length: t.max},(_,i)=>i+1).map(n=>
            `<button class="w-16 h-16 bg-zinc-800 rounded-xl font-bold text-xl text-zinc-400 hover:bg-amber-500 hover:text-black hover:scale-110 transition-all step-pick-btn shadow-lg" data-val="${n}">${n}</button>`
        ).join('')}</div>`;
    } else {
        grid = `<div class="max-w-xs mx-auto"><input type="number" id="master-input" class="w-full bg-black/50 border border-zinc-700 rounded-xl text-center text-6xl py-6 text-white font-bold outline-none focus:border-amber-500 focus:text-amber-500 transition-colors" placeholder="#"><p class="text-center text-zinc-500 text-xs mt-2">Enter 1 - ${t.max}</p></div>`;
    }

    stage.innerHTML = `
        <div class="text-center animate-fadeIn">
            <div class="text-amber-500 text-[10px] font-bold tracking-widest mb-2 uppercase">STEP ${gameState.step} / 3</div>
            <h2 class="text-3xl font-black text-white mb-1">PICK ${t.name}</h2>
            <p class="text-zinc-500 text-xs mb-8">Win Multiplier: <span class="text-white font-bold">${t.reward}</span></p>
            ${grid}
        </div>`;

    if (t.max > 10) {
        controls.innerHTML = `<button id="confirm-master" class="w-full btn-action py-4 rounded-xl shadow-lg" disabled>CONFIRM NUMBER</button>`;
        const i = document.getElementById('master-input'); 
        const b = document.getElementById('confirm-master');
        i.focus();
        i.oninput = () => { const val = parseInt(i.value); b.disabled = !val || val < 1 || val > t.max; }; 
        b.onclick = () => { gameState.guesses[2] = parseInt(i.value); gameState.step = 4; renderStep(); };
    } else {
        controls.innerHTML = `<div class="text-center text-[10px] text-zinc-600">Choose a number</div>`;
        document.querySelectorAll('.step-pick-btn').forEach(b => b.onclick = () => { gameState.guesses[gameState.step-1] = parseInt(b.dataset.val); gameState.step++; renderStep(); });
    }
}

function renderSlots(stage, controls) {
    stage.innerHTML = `
        <div class="flex flex-col gap-4 h-full justify-center">
            <div class="flex justify-center gap-2 mb-2">
                 ${gameState.guesses.map((g, i) => `<div class="text-center"><div class="w-10 h-6 bg-zinc-800 rounded text-xs flex items-center justify-center text-zinc-400 font-bold border border-zinc-700">${g}</div><div class="text-[8px] text-zinc-600 mt-1 uppercase tracking-wider">Tier ${i+1}</div></div>`).join('')}
            </div>
            <div class="grid grid-cols-3 gap-3">
                ${[1,2,3].map(i => `<div id="slot-${i}" class="slot-window"><span class="slot-number">?</span></div>`).join('')}
            </div>
            <div class="grid grid-cols-3 gap-3 text-center">
                <div id="win-pot-1" class="text-[10px] text-zinc-600 font-mono transition-colors">---</div>
                <div id="win-pot-2" class="text-[10px] text-zinc-600 font-mono transition-colors">---</div>
                <div id="win-pot-3" class="text-[10px] text-zinc-600 font-mono transition-colors">---</div>
            </div>
        </div>`;

    controls.innerHTML = `
        <div class="flex items-center justify-between mb-4 bg-black/40 rounded-xl p-2 px-4 border border-zinc-700/50">
            <span class="text-zinc-500 text-xs font-bold">WAGER</span>
            <div class="flex items-center">
                <input type="number" id="bet-input" class="bg-transparent text-right text-white font-mono text-xl font-bold w-24 outline-none" placeholder="0" step="any">
                <span class="text-amber-500 font-bold text-xs ml-2">BKC</span>
            </div>
        </div>
        <div class="grid grid-cols-5 gap-2 mb-4">
            <button class="bet-btn rounded-lg py-2" data-amt="1">+1</button>
            <button class="bet-btn rounded-lg py-2" data-amt="10">+10</button>
            <button class="bet-btn rounded-lg py-2" data-amt="100">+100</button>
            <button class="bet-btn rounded-lg py-2" data-amt="1000">1K</button>
            <button id="btn-reset" class="bet-btn rounded-lg py-2 text-red-500 border-red-900/30 hover:bg-red-900/20"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div id="mode-toggle" class="mode-container border border-purple-500/30 bg-purple-900/10 p-3 rounded-xl flex items-center justify-between cursor-pointer group mb-4 transition-all hover:bg-purple-900/20">
            <div class="flex items-center gap-3"><div class="text-xl">🚀</div><div><div class="text-xs font-bold text-white" id="mode-title">TRIPLE COMBO</div><div class="text-[9px] text-purple-300">Win on all tiers</div></div></div>
            <div class="text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded font-bold">ACTIVE</div>
        </div>
        <button id="btn-spin" class="w-full action-btn py-4 rounded-xl text-lg disabled:opacity-50 disabled:grayscale" disabled>ENTER AMOUNT</button>`;

    setupControls();
}

function setupControls() {
    const inp = document.getElementById('bet-input');
    const btn = document.getElementById('btn-spin');
    
    if (gameState.betAmount > 0) inp.value = gameState.betAmount;

    const validate = () => {
        const val = parseFloat(inp.value);
        gameState.betAmount = val || 0;
        const [p1, p2, p3] = [1,2,3].map(i => document.getElementById(`win-pot-${i}`));
        
        if (val > 0) { 
            p1.innerText = `+${(val * 1.5).toLocaleString()}`; p1.style.color = '#10b981';
            p2.innerText = `+${(val * 5).toLocaleString()}`; p2.style.color = '#10b981';
            p3.innerText = `+${(val * 50).toLocaleString()}`; p3.style.color = '#10b981';
            btn.disabled = false; btn.innerText = "SPIN TO WIN";
        } else {
            [p1, p2, p3].forEach(p => { p.innerText = "---"; p.style.color = '#52525b'; });
            btn.disabled = true; btn.innerText = "ENTER AMOUNT";
        }
        if (!gameState.systemReady) { btn.disabled = true; btn.innerText = "SYSTEM OFFLINE"; }
    };

    inp.oninput = validate;
    document.querySelectorAll('.bet-btn').forEach(b => b.onclick = (e) => { 
        if(b.id === 'btn-reset') { inp.value = ''; gameState.step=0; renderStep(); return; }
        inp.value = parseFloat(((parseFloat(inp.value)||0) + parseFloat(b.dataset.amt)).toFixed(2)); 
        validate(); 
    });
    
    document.getElementById('mode-toggle').onclick = () => {
        gameState.isCumulative = !gameState.isCumulative;
        const div = document.getElementById('mode-toggle');
        const title = document.getElementById('mode-title');
        if(gameState.isCumulative) {
            div.className = "mode-container border border-purple-500/30 bg-purple-900/10 p-3 rounded-xl flex items-center justify-between cursor-pointer group mb-4 transition-all";
            title.innerText = "TRIPLE COMBO";
        } else {
            div.className = "mode-container border border-zinc-700 bg-black/20 p-3 rounded-xl flex items-center justify-between cursor-pointer group mb-4 transition-all grayscale opacity-70";
            title.innerText = "SINGLE WIN";
        }
        FortunePoolPage.checkReqs();
    };

    btn.onclick = executeTransaction;
    validate();
}

function setStatus(text, isActive = false) {
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');
    if(!dot || !txt) return;
    txt.innerText = text;
    if(isActive) { dot.classList.add('active'); txt.classList.add('text-amber-500'); }
    else { dot.classList.remove('active'); txt.classList.remove('text-amber-500'); }
}

function rand(max) { return Math.floor(Math.random() * max) + 1; }

async function checkGasAndWarn() {
    try {
        const nativeBalance = await State.provider.getBalance(State.userAddress);
        if (nativeBalance < ethers.parseEther("0.002")) {
            document.getElementById('no-gas-modal').classList.remove('hidden');
            document.getElementById('no-gas-modal').classList.add('flex');
            return false;
        }
        return true;
    } catch (e) { return true; }
}

async function requestGaslessRefuel(btnElement) {
    btnElement.innerHTML = "Requesting...";
    try {
        const response = await fetch(`${FAUCET_API_URL}?address=${State.userAddress}`);
        const data = await response.json();
        if (response.ok && data.success) showToast("Gas Sent!", "success");
        else showToast(data.error || "Cooldown", "warning");
    } catch (e) { showToast("Faucet Offline", "error"); }
    btnElement.innerHTML = "Get Free Gas";
}

// ⚠️ CORE TRANSACTION LOGIC (SAFE APPROVE + DYNAMIC GAME GAS)
async function executeTransaction() {
    if (!State.isConnected) return showToast("Connect wallet", "error");
    const hasGas = await checkGasAndWarn();
    if (!hasGas) return;

    await FortunePoolPage.checkReqs();
    if (!gameState.systemReady) return;
    
    const btn = document.getElementById('btn-spin');
    const amountWei = ethers.parseEther(gameState.betAmount.toString());
    const isCumulative = gameState.isCumulative;
    
    // 1. FEE (Exact)
    let fee = 0n;
    try {
        const baseFee = await State.actionsManagerContract.oracleFeeInWei();
        fee = isCumulative ? (baseFee * 5n) : baseFee;
    } catch (e) {
        fee = ethers.parseEther(isCumulative ? "0.00175" : "0.00035");
    }

    btn.disabled = true;
    
    try {
        // 2. APPROVE BKC (SAFE MODE: Fixed Gas)
        const spender = addresses.fortunePool;
        setStatus("APPROVING BKC...", true);
        btn.innerText = "APPROVING...";
        
        try {
            const currentAllowance = await State.bkcTokenContract.allowance(State.userAddress, spender);
            if (currentAllowance < amountWei) {
                // FORCE SAFE GAS LIMIT FOR APPROVE TO AVOID RPC ERRORS
                const approveTx = await State.bkcTokenContract.approve(spender, amountWei, { gasLimit: 300000n });
                await approveTx.wait();
            }
        } catch (approvalError) {
            console.error("Approve Error:", approvalError);
            throw new Error("Approval Failed");
        } 
        
        // 3. EXECUTE GAME (Dynamic Gas)
        setStatus("MINING TRANSACTION...", true);
        btn.innerText = "MINING...";
        startSpinning();
        
        const guessesAsBigInt = gameState.guesses.map(g => BigInt(g));
        const argsGame = [amountWei, guessesAsBigInt, isCumulative];
        
        // Use Dynamic Gas for the Game interaction as it's complex
        const gasGame = await getGasWithMargin(State.actionsManagerContract, 'participate', argsGame);
        gasGame.value = fee; 
        
        const tx = await State.actionsManagerContract.participate(...argsGame, gasGame);
        await tx.wait();
        
        setStatus("WAITING ORACLE...", true);
        btn.innerText = "PENDING...";
        
        const ctr = await safeContractCall(State.actionsManagerContract, 'gameCounter', [], 0, 2, true);
        const gameIdToWatch = Number(ctr) > 0 ? Number(ctr) - 1 : 0; 
        setTimeout(() => waitForOracle(gameIdToWatch), 2000);
        
    } catch (e) {
        console.error(e);
        stopSpinningVisuals();
        btn.disabled = false; btn.innerText = "SPIN TO WIN";
        setStatus("ERROR: TX FAILED", false);
        
        let msg = "Transaction Failed";
        if (e.message && e.message.includes("cf07063a")) msg = "Fee Mismatch (Clear Cache!)";
        else if (e.code === "ACTION_REJECTED") msg = "Rejected by User";
        else if (e.message.includes("InvalidFee")) msg = "Invalid Fee Amount";
        else if (e.message.includes("Approval Failed")) msg = "Token Approval Failed";
        
        showToast(msg, "error");
    }
}

function startSpinning() {
    gameState.isSpinning = true;
    [1,2,3].forEach(i => {
        const el = document.getElementById(`slot-${i}`);
        if(el) { el.classList.add('spinning'); el.querySelector('.slot-number').innerText = "?"; }
    });
    gameState.spinInterval = setInterval(() => {
        if(document.getElementById('slot-1')) document.querySelector('#slot-1 .slot-number').innerText = rand(3);
        if(document.getElementById('slot-2')) document.querySelector('#slot-2 .slot-number').innerText = rand(10);
        if(document.getElementById('slot-3')) document.querySelector('#slot-3 .slot-number').innerText = rand(100);
    }, 80);
}

function stopSpinningVisuals() {
    clearInterval(gameState.spinInterval);
    clearInterval(gameState.pollInterval);
    [1,2,3].forEach(i => document.getElementById(`slot-${i}`)?.classList.remove('spinning'));
}

async function waitForOracle(gameId) {
    let attempts = 0;
    if (gameState.pollInterval) clearInterval(gameState.pollInterval);
    
    gameState.pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > 60) {
            stopSpinningVisuals();
            showToast("Oracle took too long. Check history.", "info");
            resetGameUI();
            return;
        }
        try {
            const p1 = safeContractCall(State.actionsManagerContract, 'gameResults', [gameId, 0], 0n, 0, true);
            const p2 = safeContractCall(State.actionsManagerContract, 'gameResults', [gameId, 1], 0n, 0, true);
            const p3 = safeContractCall(State.actionsManagerContract, 'gameResults', [gameId, 2], 0n, 0, true);
            const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
            
            if (Number(r1) !== 0) {
                clearInterval(gameState.pollInterval);
                clearInterval(gameState.spinInterval);
                revealResults([Number(r1), Number(r2), Number(r3)]);
            }
        } catch (e) { }
    }, 2000);
}

async function revealResults(rolls) {
    setStatus("REVEALING DESTINY...", true);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let totalWin = 0;
    const multipliers = [1.5, 5, 50];
    
    for(let i=0; i<3; i++) {
        const el = document.getElementById(`slot-${i+1}`);
        const numEl = el.querySelector('.slot-number');
        el.classList.remove('spinning');
        numEl.innerText = rolls[i];
        
        if(rolls[i] === gameState.guesses[i]) {
            el.classList.add('winner');
            totalWin += gameState.betAmount * multipliers[i];
        } else {
            el.classList.add('loser');
        }
        await wait(800);
    }
    showResultOverlay(totalWin, rolls);
}

function showResultOverlay(winAmount, rolls) {
    const overlay = document.getElementById('result-overlay');
    overlay.classList.add('visible');
    const matches = rolls.map((r, i) => r === gameState.guesses[i]).filter(Boolean).length;
    
    if (matches > 0) {
        overlay.innerHTML = `
            <div class="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 class="text-4xl font-black text-amber-500 mb-2">VICTORY!</h2>
            <p class="text-white text-lg font-mono mb-8">Matches: ${matches}/3</p>
            <button id="btn-collect" class="bg-white text-black font-black py-3 px-8 rounded-xl hover:scale-105 transition-transform">COLLECT</button>`;
        Gamification.addXP(500);
    } else {
        overlay.innerHTML = `
            <div class="text-6xl mb-4 grayscale opacity-50">⛏️</div>
            <h2 class="text-3xl font-bold text-white mb-2">MINING SUCCESS</h2>
            <p class="text-zinc-400 text-sm mb-8 max-w-xs text-center">No prize this time, but your Proof-of-Purchase generated ecosystem rewards.</p>
            <button id="btn-collect" class="bg-zinc-800 border border-zinc-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-zinc-700">CONTINUE</button>`;
        Gamification.addXP(50);
    }
    document.getElementById('btn-collect').onclick = resetGameUI;
    loadUserData(true);
}

function resetGameUI() {
    document.getElementById('result-overlay').classList.remove('visible');
    setStatus("SYSTEM READY", false);
    const btn = document.getElementById('btn-spin');
    btn.disabled = false;
    btn.innerText = "SPIN TO WIN";
    [1,2,3].forEach(i => {
        const el = document.getElementById(`slot-${i}`);
        el.className = "slot-window";
        el.querySelector('.slot-number').innerText = "?";
    });
    FortunePoolPage.loadHistory();
}

export const FortunePoolPage = {
    checkReqs: async () => {
        if(!State.isConnected) return;
        gameState.systemReady = true;
        try {
            const tierCount = await safeContractCall(State.actionsManagerContract, 'activeTierCount', [], 0n, 1, false);
            if (Number(tierCount) === 0) gameState.systemReady = false;
        } catch(e) { }
    },

    loadHistory: async () => {
        const list = document.getElementById('gameHistoryList');
        if(!list || !State.isConnected) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
            const data = await res.json();
            const games = data.filter(a => a.type === 'GameResult');
            const total = games.reduce((acc, g) => acc + (g.details.isWin ? parseFloat(ethers.formatEther(g.details.amount)) : 0), 0);
            const stats = document.getElementById('totalWinningsDisplay');
            if(stats) stats.innerHTML = `Total Won: <span class="text-amber-400 font-bold">${total.toFixed(2)} BKC</span>`;
            list.innerHTML = games.slice(0, 5).map(g => `
                <tr class="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td class="p-3 font-mono text-zinc-400 text-[10px]">#${g.details.gameId}</td>
                    <td class="p-3 text-center"><span class="${g.details.isWin ? 'text-green-500' : 'text-zinc-600'} font-bold text-[10px]">${g.details.isWin ? 'WIN' : 'LOSS'}</span></td>
                    <td class="p-3 text-right text-zinc-300 font-mono text-[10px]">${g.details.isWin ? '+' + formatBigNumber(BigInt(g.details.amount)).toFixed(2) : '-'}</td>
                </tr>`).join('');
        } catch (e) { list.innerHTML = `<tr><td colspan="3" class="text-center text-[10px] text-zinc-600 py-4">History unavailable</td></tr>`; }
    },

    render(isActive) {
        if (!isActive) return;
        renderGame(document.getElementById('actions'));
        this.checkReqs();
        Gamification.updateUI();
        this.loadHistory();
    }
};

window.FortunePoolPage = FortunePoolPage;