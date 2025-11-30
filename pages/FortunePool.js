// js/pages/FortunePool.js
// ✅ VERSÃO FINAL V14: Share Buttons (Win/Loss) + Viral Copywriting + Gas Error Handling

import { State } from '../state.js';
import { loadUserData, safeContractCall, API_ENDPOINTS, loadSystemDataFromAPI } from '../modules/data.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';

const ethers = window.ethers;
const EXPLORER_BASE = "https://sepolia.etherscan.io/tx/";

// --- HELPER DE DATA ---
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

// --- CSS FX ---
const style = document.createElement('style');
style.innerHTML = `
    .glass-panel {
        background: rgba(10, 10, 12, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 193, 7, 0.15);
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.9);
    }
    @keyframes coinPulse {
        0% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3)); }
        50% { transform: scale(1.1); filter: drop-shadow(0 0 25px rgba(245, 158, 11, 0.6)); }
        100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3)); }
    }
    .bkc-anim { animation: coinPulse 2s infinite ease-in-out; }
    
    .progress-track { background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; height: 8px; margin-top: 10px; }
    .progress-fill { 
        height: 100%; 
        background: linear-gradient(90deg, #f59e0b, #fbbf24); 
        width: 0%; 
        transition: width 0.5s ease-out;
        box-shadow: 0 0 15px #f59e0b;
    }
    
    .guess-box {
        background: rgba(59, 130, 246, 0.05);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #60a5fa;
        box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.05);
    }
    
    .slot-box {
        background: linear-gradient(180deg, #18181b 0%, #09090b 100%);
        border: 1px solid #3f3f46;
        color: #52525b;
        box-shadow: inset 0 0 20px #000;
        position: relative;
    }
    
    .tier-label {
        font-size: 9px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;
        text-align: center; display: block; margin-bottom: 4px; opacity: 0.8;
    }

    .profit-tag {
        font-family: monospace; font-size: 10px; font-weight: bold;
        text-align: center; padding: 4px; border-radius: 6px;
        background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
        transition: all 0.3s;
    }
    .profit-active {
        background: rgba(16, 185, 129, 0.1); border-color: #10b981; color: #10b981;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
    }

    @keyframes spinBlur { 0% { filter: blur(0); transform: translateY(0); } 50% { filter: blur(6px); transform: translateY(-3px); } 100% { filter: blur(0); transform: translateY(0); } }
    .slot-spinning { animation: spinBlur 0.1s infinite; color: #71717a !important; text-shadow: 0 0 5px rgba(255,255,255,0.2); }
    
    .slot-hit { 
        border-color: #10b981 !important; color: #fff !important; 
        background: rgba(16, 185, 129, 0.2) !important;
        text-shadow: 0 0 20px #10b981; transform: scale(1.05); z-index: 10;
    }
    .slot-miss { border-color: #ef4444 !important; color: #ef4444 !important; opacity: 0.4; }
    
    .btn-action { background: linear-gradient(to bottom, #fbbf24, #d97706); color: black; font-weight: 900; letter-spacing: 1px; }
    .btn-action:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-action:disabled { background: #333; color: #666; cursor: not-allowed; transform: none; filter: none; }

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
`;
document.head.appendChild(style);

let gameState = {
    step: 0, isSpinning: false, gameId: 0, pollInterval: null, spinInterval: null,
    guesses: [0, 0, 0], 
    isCumulative: true, // Padrão Turbo Ativo
    betAmount: 0, lastWinAmount: 0,
    currentLevel: 1, currentXP: 0, xpPerLevel: 1000, systemReady: false
};

try {
    const local = localStorage.getItem('bkc_fortune_v12');
    if (local) { const p = JSON.parse(local); gameState.currentLevel = p.lvl || 1; gameState.currentXP = p.xp || 0; }
} catch (e) {}

function saveProgress() { localStorage.setItem('bkc_fortune_v12', JSON.stringify({ lvl: gameState.currentLevel, xp: gameState.currentXP })); updateGamificationUI(); }
function addXP(amount) { gameState.currentXP += amount; if (gameState.currentXP >= gameState.xpPerLevel) { gameState.currentLevel++; gameState.currentXP -= gameState.xpPerLevel; showToast(`🆙 LEVEL UP! LVL ${gameState.currentLevel}`, "success"); } saveProgress(); }

function renderStep() {
    const container = document.getElementById('game-interaction-area');
    if (!container) return;
    container.style.opacity = '0';
    setTimeout(() => { container.innerHTML = ''; buildStepHTML(container); container.style.opacity = '1'; }, 200);
}

function buildStepHTML(container) {
    if (gameState.step === 0) {
        container.innerHTML = `
            <div class="text-center py-6">
                <img src="assets/bkc_logo_3d.png" class="w-24 h-24 mx-auto mb-6 bkc-anim" alt="Backcoin">
                <h2 class="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Fortune Pool</h2>
                <p class="text-amber-500/80 text-sm mb-10 font-bold tracking-widest">PROOF OF PURCHASE MINING</p>
                <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <button id="btn-random-all" class="glass-panel p-5 rounded-2xl hover:border-amber-500 transition-all group">
                        <div class="text-3xl mb-2">🎲</div><div class="font-bold text-white text-sm">QUICK LUCK</div>
                    </button>
                    <button id="btn-manual-pick" class="glass-panel p-5 rounded-2xl hover:border-amber-500 transition-all group">
                        <div class="text-3xl mb-2">🧠</div><div class="font-bold text-white text-sm">STRATEGY</div>
                    </button>
                </div>
            </div>`;
        document.getElementById('btn-random-all').onclick = () => { gameState.guesses = [rand(4), rand(12), rand(120)]; gameState.step = 4; renderStep(); };
        document.getElementById('btn-manual-pick').onclick = () => { gameState.step = 1; renderStep(); };
    }
    else if (gameState.step >= 1 && gameState.step <= 3) {
        const tiers = [
            { max: 4, name: "BRONZE", reward: "1.5x", desc: "1 in 4 Chance" }, 
            { max: 12, name: "SILVER", reward: "5x", desc: "1 in 12 Chance" }, 
            { max: 120, name: "GOLD", reward: "50x", desc: "1 in 120 Chance" }
        ];
        const t = tiers[gameState.step - 1];
        
        let grid = "";
        if (t.max <= 4) {
             grid = `<div class="flex flex-wrap justify-center gap-4 mb-8">${Array.from({length: t.max},(_,i)=>i+1).map(n=>`<button class="w-20 h-20 glass-panel rounded-2xl font-black text-3xl text-white hover:bg-amber-500 hover:text-black transition-all step-pick-btn shadow-lg" data-val="${n}">${n}</button>`).join('')}</div>`;
        } else if (t.max <= 12) {
             grid = `<div class="flex flex-wrap justify-center gap-3 mb-8 max-w-xs mx-auto">${Array.from({length: t.max},(_,i)=>i+1).map(n=>`<button class="w-14 h-14 glass-panel rounded-xl font-bold text-lg text-white hover:bg-zinc-200 hover:text-black transition-all step-pick-btn" data-val="${n}">${n}</button>`).join('')}</div>`;
        } else {
             grid = `<div class="max-w-xs mx-auto mb-8"><input type="number" id="master-input" class="w-full bg-black/50 border border-amber-500/30 rounded-xl text-center text-5xl py-6 text-white font-bold outline-none focus:border-amber-500" placeholder="1-120"><button id="confirm-master" class="w-full mt-4 btn-action py-3 rounded-xl shadow-lg" disabled>LOCK NUMBER</button></div>`;
        }

        container.innerHTML = `
            <div class="text-center pt-4">
                <div class="text-amber-500 text-xs font-bold tracking-widest mb-2">STEP ${gameState.step}/3</div>
                <h2 class="text-2xl font-black text-white mb-1">PICK ${t.name}</h2>
                <p class="text-zinc-500 text-xs mb-8">Win Multiplier: <span class="text-white font-bold">${t.reward}</span> (${t.desc})</p>
                ${grid}
            </div>`;
            
        if(t.max<=12) document.querySelectorAll('.step-pick-btn').forEach(b => b.onclick = () => { gameState.guesses[gameState.step-1] = parseInt(b.dataset.val); gameState.step++; renderStep(); });
        else { 
            const i = document.getElementById('master-input'); 
            const b = document.getElementById('confirm-master'); 
            i.oninput = () => {
                const val = parseInt(i.value);
                b.disabled = !val || val < 1 || val > 120;
            }; 
            b.onclick = () => { gameState.guesses[2] = parseInt(i.value); gameState.step = 4; renderStep(); }; 
        }
    }
    else if (gameState.step === 4) {
        renderBettingScreen(container);
    }
}

function rand(max) { return Math.floor(Math.random() * max) + 1; }

function renderBettingScreen(container) {
    container.innerHTML = `
        <div class="text-center relative h-full flex flex-col justify-between" style="min-height: 430px;">
            <div class="absolute top-0 right-0">
                <button id="btn-reset" class="text-[10px] text-zinc-500 hover:text-white uppercase tracking-wider flex items-center gap-1 bg-zinc-900/50 px-3 py-1 rounded-lg border border-zinc-800"><i class="fa-solid fa-rotate-left"></i> Reset</button>
            </div>
            <div class="mt-8">
                <div class="grid grid-cols-3 gap-3 mb-2 px-2">
                    <span class="tier-label text-amber-600">Bronze (1.5x)</span>
                    <span class="tier-label text-zinc-400">Silver (5x)</span>
                    <span class="tier-label text-yellow-400">Gold (50x)</span>
                </div>
                <div class="grid grid-cols-3 gap-3 mb-3 px-2 relative z-10">
                    ${gameState.guesses.map(g => `
                        <div class="guess-box rounded-xl h-10 flex items-center justify-center font-bold text-lg shadow-lg relative">
                            ${g}
                            <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-blue-500/50"><i class="fa-solid fa-arrow-down"></i></div>
                        </div>`).join('')}
                </div>
                <div class="grid grid-cols-3 gap-3 mb-3 px-2 relative z-10">
                    ${[1,2,3].map(i => `<div id="slot-${i}" class="slot-box rounded-2xl h-20 flex items-center justify-center text-4xl font-black transition-all duration-500">?</div>`).join('')}
                </div>
                <div class="grid grid-cols-3 gap-3 mb-2 px-2">
                    <div id="win-pot-1" class="profit-tag text-zinc-600">---</div>
                    <div id="win-pot-2" class="profit-tag text-zinc-600">---</div>
                    <div id="win-pot-3" class="profit-tag text-zinc-600">---</div>
                </div>
            </div>
            <div id="status-area" class="hidden-force flex-col items-center justify-center h-48 animate-fadeIn mt-4">
                <img src="assets/bkc_logo_3d.png" class="w-12 h-12 mb-3 bkc-anim" alt="Mining...">
                <div class="text-sm text-white font-bold mb-1" id="status-title">PROCESSING...</div>
                <div class="text-[10px] text-amber-500 font-mono mb-2 uppercase tracking-widest" id="status-text">INITIALIZING...</div>
                <div class="progress-track w-full max-w-xs mx-auto"><div id="progress-bar" class="progress-fill"></div></div>
            </div>
            <div id="controls-area" class="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 transition-opacity duration-500 mt-2">
                <div class="flex items-center justify-between mb-4 bg-black/40 rounded-xl p-2 px-4 border border-zinc-700/50">
                    <span class="text-zinc-500 text-xs font-bold">BET AMOUNT</span>
                    <div class="flex items-center">
                        <input type="number" id="bet-input" class="bg-transparent text-right text-white font-mono text-xl font-bold w-24 outline-none" placeholder="0" step="any">
                        <span class="text-amber-500 font-bold text-xs ml-2">BKC</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-5 gap-2 mb-4">
                    <button class="add-bet bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold py-2 rounded-lg transition-colors border border-zinc-700" data-amt="0.5">+0.5</button>
                    <button class="add-bet bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold py-2 rounded-lg transition-colors border border-zinc-700" data-amt="1">+1</button>
                    <button class="add-bet bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold py-2 rounded-lg transition-colors border border-zinc-700" data-amt="10">+10</button>
                    <button class="add-bet bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold py-2 rounded-lg transition-colors border border-zinc-700" data-amt="100">+100</button>
                    <button id="btn-clear-bet" class="bg-red-900/30 hover:bg-red-900/50 text-red-400 text-[10px] font-bold py-2 rounded-lg transition-colors border border-red-500/20"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="mb-4">
                    <div id="mode-toggle" class="mode-container mode-active-cumulative p-3 rounded-xl flex items-center justify-between cursor-pointer group">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-lg bg-purple-600/30 flex items-center justify-center border border-purple-500/50 text-xl" id="mode-icon">🚀</div>
                            <div class="text-left">
                                <div class="text-xs font-black text-white drop-shadow-md transition-colors uppercase" id="mode-title">🚀 TRIPLE WIN CHANCE</div>
                                <div class="text-[9px] text-purple-200" id="mode-desc">Combo Mode Active: Win on all 3 pools!</div>
                            </div>
                        </div>
                        <div class="text-xs font-black text-white bg-purple-600 px-2 py-1 rounded shadow-lg" id="mode-badge">ACTIVE</div>
                    </div>
                </div>
                <button id="btn-spin" class="w-full btn-action py-4 rounded-xl shadow-lg shadow-amber-900/20 text-sm disabled:opacity-50" disabled>ENTER AMOUNT</button>
            </div>
        </div>
        <div id="result-overlay" class="absolute inset-0 z-50 hidden flex-col items-center justify-center glass-panel rounded-3xl bg-black/95"></div>
    `;

    document.getElementById('btn-reset').onclick = () => { gameState.step = 0; renderStep(); };
    const inp = document.getElementById('bet-input');
    const btn = document.getElementById('btn-spin');
    
    if (gameState.betAmount > 0) inp.value = gameState.betAmount;

    const validate = () => {
        const val = parseFloat(inp.value);
        gameState.betAmount = val || 0;
        updateToggleVisuals();

        const pot1 = document.getElementById('win-pot-1');
        const pot2 = document.getElementById('win-pot-2');
        const pot3 = document.getElementById('win-pot-3');

        if (val > 0) {
            pot1.innerText = `+ ${(val * 1.5).toLocaleString()} BKC`; pot1.classList.add('profit-active');
            pot2.innerText = `+ ${(val * 5).toLocaleString()} BKC`; pot2.classList.add('profit-active');
            pot3.innerText = `+ ${(val * 50).toLocaleString()} BKC`; pot3.classList.add('profit-active');
            btn.disabled = false; btn.innerText = "SPIN TO WIN";
        } else {
            pot1.innerText = "---"; pot1.classList.remove('profit-active');
            pot2.innerText = "---"; pot2.classList.remove('profit-active');
            pot3.innerText = "---"; pot3.classList.remove('profit-active');
            btn.disabled = true; btn.innerText = "ENTER AMOUNT";
        }
        if (!gameState.systemReady) { btn.disabled = true; btn.innerText = "NETWORK ERROR"; }
    };

    inp.oninput = validate;
    
    document.querySelectorAll('.add-bet').forEach(b => b.onclick = () => { 
        let current = parseFloat(inp.value) || 0;
        let toAdd = parseFloat(b.dataset.amt);
        let newVal = current + toAdd;
        inp.value = parseFloat(newVal.toFixed(4)); 
        validate(); 
    });

    document.getElementById('btn-clear-bet').onclick = () => {
        inp.value = '';
        validate();
    };
    
    document.getElementById('mode-toggle').onclick = () => {
        const inpVal = document.getElementById('bet-input').value;
        if (!inpVal || parseFloat(inpVal) <= 0) return; 
        gameState.isCumulative = !gameState.isCumulative;
        updateToggleVisuals();
        FortunePoolPage.checkReqs();
    };
    
    btn.onclick = executeTransaction;
    validate();
}

function updateToggleVisuals() {
    const container = document.getElementById('mode-toggle');
    const title = document.getElementById('mode-title');
    const desc = document.getElementById('mode-desc');
    const icon = document.getElementById('mode-icon');
    const badge = document.getElementById('mode-badge');

    if(gameState.isCumulative) {
        container.className = "mode-container mode-active-cumulative p-3 rounded-xl flex items-center justify-between cursor-pointer group";
        title.innerText = "🚀 TRIPLE WIN CHANCE";
        desc.innerText = "Combo Mode Active: Win on all 3 pools!";
        desc.className = "text-[9px] text-purple-200";
        icon.innerHTML = "🚀"; icon.className = "w-12 h-12 rounded-lg bg-purple-600/30 flex items-center justify-center border border-purple-500/50 text-xl";
        badge.innerText = "ACTIVE"; badge.className = "text-xs font-black text-white bg-purple-600 px-2 py-1 rounded shadow-lg";
    } else {
        container.className = "mode-container mode-locked p-3 rounded-xl flex items-center justify-between cursor-pointer group";
        title.innerText = "⚠️ SINGLE WIN LIMIT";
        desc.innerText = "Capped Winnings. You keep only 1 prize.";
        desc.className = "text-[9px] text-zinc-500";
        icon.innerHTML = "🛑"; icon.className = "w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700 text-xl grayscale";
        badge.innerText = "LIMITED"; badge.className = "text-xs font-bold text-zinc-600 border border-zinc-700 px-2 py-1 rounded";
    }
}

function startSpinning() {
    gameState.isSpinning = true;
    const controls = document.getElementById('controls-area');
    const status = document.getElementById('status-area');
    controls.classList.add('hidden-force'); status.classList.remove('hidden-force'); status.classList.add('flex'); 
    [1,2,3].forEach(i => {
        const el = document.getElementById(`slot-${i}`);
        el.innerText = '?'; el.className = "slot-box rounded-2xl h-20 flex items-center justify-center text-4xl font-black slot-spinning";
    });
    gameState.spinInterval = setInterval(() => {
        if(document.getElementById('slot-1')) document.getElementById('slot-1').innerText = rand(4);
        if(document.getElementById('slot-2')) document.getElementById('slot-2').innerText = rand(12);
        if(document.getElementById('slot-3')) document.getElementById('slot-3').innerText = rand(120);
    }, 50);
    updateProgressBar(10, "MINING TRANSACTION..."); 
}

function updateProgressBar(percent, text) {
    const bar = document.getElementById('progress-bar');
    const txt = document.getElementById('status-text');
    if(bar) bar.style.width = `${percent}%`;
    if(txt) txt.innerText = text;
}

async function stopSpinning(rolls, winAmount) {
    clearInterval(gameState.spinInterval);
    clearInterval(gameState.pollInterval);
    updateProgressBar(100, "REVEALING DESTINY...");
    gameState.lastWinAmount = parseFloat(formatBigNumber(BigInt(winAmount)));
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const reveal = async (i) => {
        const el = document.getElementById(`slot-${i+1}`);
        if(!el) return;
        el.classList.remove('slot-spinning');
        el.innerText = rolls[i];
        if (rolls[i] === gameState.guesses[i]) el.classList.add('slot-hit');
        else el.classList.add('slot-miss');
    };
    await wait(500); await reveal(0); await wait(1000); await reveal(1); await wait(1000); await reveal(2); await wait(1500);
    showResultOverlay(winAmount > 0n);
}

// -------------------------------------------------------------
// ✅ SHARE BUTTON LOGIC ADDED HERE (WIN & LOSS SCENARIOS)
// -------------------------------------------------------------
function showResultOverlay(isWin) {
    const overlay = document.getElementById('result-overlay');
    overlay.classList.remove('hidden'); overlay.classList.add('flex');
    
    const winText = `🏆 I just won ${gameState.lastWinAmount.toFixed(2)} $BKC on the Fortune Pool! The Backchain Protocol is changing the game. Real Yield, Real Utility. 🚀🔥 #BKC #BACKCOIN #AIRDROP`;
    const lossText = `⛏️ Mining the future with Proof-of-Purchase! Every interaction counts in the Backchain Protocol. Join the revolution. 💎🔨 #BKC #BACKCOIN #AIRDROP`;
    
    // Encode text for Twitter Intent
    const shareText = isWin ? winText : lossText;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent('https://backcoin.org')}`;

    if (isWin) {
        overlay.innerHTML = `
            <div class="text-center p-6 w-full animate-fadeIn">
                <div class="text-6xl mb-4">🏆</div>
                <h2 class="text-4xl font-black text-amber-400 italic mb-2 drop-shadow-lg">BIG WIN!</h2>
                <div class="text-6xl font-mono font-bold text-white mb-6">${gameState.lastWinAmount.toFixed(2)} <span class="text-xl text-zinc-500">BKC</span></div>
                
                <div class="flex flex-col gap-3 justify-center">
                    <button id="btn-collect" class="bg-white text-black font-black py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform">
                        COLLECT & REPLAY
                    </button>
                    <button id="btn-share-win" class="bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold py-3 px-10 rounded-xl flex items-center justify-center gap-2 transition-all">
                        <i class="fa-brands fa-twitter"></i> SHARE VICTORY
                    </button>
                </div>
            </div>`;
        addXP(500);
    } else {
        overlay.innerHTML = `
            <div class="text-center p-6 w-full animate-fadeIn">
                <div class="text-6xl mb-4 grayscale opacity-50">💔</div>
                <h2 class="text-2xl font-bold text-zinc-300 mb-2">NOT THIS TIME</h2>
                <p class="text-zinc-500 mb-8 text-sm">Proof of Purchase generated. Ecosystem mining active.</p>
                
                <div class="flex flex-col gap-3 justify-center">
                    <button id="btn-collect" class="bg-zinc-800 text-white font-bold py-3 px-8 rounded-xl border border-zinc-600 hover:bg-zinc-700">
                        TRY AGAIN
                    </button>
                    <button id="btn-share-loss" class="bg-transparent border border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-400 font-bold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-2">
                        <i class="fa-brands fa-twitter"></i> SHARE MINING
                    </button>
                </div>
            </div>`;
        addXP(50);
    }

    // Attach Listeners
    document.getElementById('btn-collect').onclick = closeOverlay;
    
    if (isWin) {
        document.getElementById('btn-share-win').onclick = () => window.open(shareUrl, '_blank');
    } else {
        document.getElementById('btn-share-loss').onclick = () => window.open(shareUrl, '_blank');
    }
}

function closeOverlay() {
    const overlay = document.getElementById('result-overlay');
    overlay.classList.add('hidden'); overlay.classList.remove('flex');
    document.getElementById('status-area').classList.add('hidden-force'); document.getElementById('status-area').classList.remove('flex');
    document.getElementById('controls-area').classList.remove('hidden-force');
    document.getElementById('progress-bar').classList.remove('finish'); document.getElementById('progress-bar').style.width = '0%';
    [1,2,3].forEach(i => {
        const el = document.getElementById(`slot-${i}`);
        el.className = "slot-box rounded-2xl h-20 flex items-center justify-center text-4xl font-black text-zinc-700 transition-all";
        el.innerText = "?"; el.classList.remove('slot-hit', 'slot-miss');
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
// ✅ GAS ERROR HANDLING & REVERT FIX
// -------------------------------------------------------------
async function executeTransaction() {
    if (!State.isConnected) return showToast("Connect wallet", "error");
    await FortunePoolPage.checkReqs();
    if (!gameState.systemReady) { showToast("System Offline - Check Connection", "error"); return; }
    if (gameState.betAmount <= 0) return;
    const btn = document.getElementById('btn-spin');
    const amountWei = ethers.parseEther(gameState.betAmount.toString());
    if (amountWei > State.currentUserBalance) return showToast("Insufficient Balance", "error");
    
    let fee = 0n;
    if (State.systemData && State.systemData.oracleFeeInWei) { 
        fee = BigInt(State.systemData.oracleFeeInWei); 
    } else {
        if (State.actionsManagerContract) {
            try { fee = await safeContractCall(State.actionsManagerContract, 'oracleFeeInWei', [], 0n); } catch (e) {}
        }
        if (fee === 0n) fee = ethers.parseEther("0.001");
    }

    if (gameState.isCumulative) fee = fee * 5n;
    
    // --- CHECK BNB BALANCE FOR GAS & FEE ---
    try {
        const bnbBalance = await State.provider.getBalance(State.userAddress);
        const minRequiredBNB = fee + ethers.parseEther("0.005"); 
        
        if (bnbBalance < minRequiredBNB) {
            showToast("Insufficient BNB for Gas/Fee!", "error");
            document.getElementById('status-area').classList.add('hidden-force');
            btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> BUY BNB FOR GAS`;
            btn.classList.add('bg-red-600', 'hover:bg-red-500');
            btn.onclick = () => {
                window.open('https://buy.moonpay.com?currencyCode=bnb_bsc', '_blank');
            };
            return;
        }
    } catch(e) { console.warn("Gas check skipped:", e); }

    btn.disabled = true;
    try {
        const allowance = await State.bkcTokenContract.allowance(State.userAddress, addresses.fortunePool);
        if (allowance < amountWei) {
            btn.innerHTML = `<div class="loader inline-block"></div> APPROVING...`;
            const tx = await State.bkcTokenContract.approve(addresses.fortunePool, ethers.MaxUint256);
            await tx.wait();
        }
        btn.innerHTML = `<div class="loader inline-block"></div> CONFIRMING...`;
        const tx = await State.actionsManagerContract.participate(amountWei, gameState.guesses, gameState.isCumulative, { value: fee });
        startSpinning(); await tx.wait();
        updateProgressBar(40, "BLOCK MINED. WAITING ORACLE...");
        const ctr = await safeContractCall(State.actionsManagerContract, 'gameCounter', [], 0, 2, true);
        waitForOracle(Number(ctr));
    } catch (e) {
        console.error(e); btn.disabled = false; btn.innerText = "START MINING";
        
        const msg = e.reason || e.message || "Transaction Failed";
        if (msg.includes("insufficient funds") || msg.includes("gas required exceeds allowance")) {
             showToast("Transaction Reverted: Not enough BNB for gas.", "error");
             btn.innerHTML = "INSUFFICIENT BNB";
        } else {
             showToast("Error: " + msg, "error");
        }
        
        document.getElementById('status-area').classList.add('hidden-force');
        document.getElementById('controls-area').classList.remove('hidden-force');
    }
}

async function waitForOracle(gameId) {
    let attempts = 0; let progress = 40;
    if (gameState.pollInterval) clearInterval(gameState.pollInterval);
    gameState.pollInterval = setInterval(async () => {
        attempts++; progress += 2; if(progress > 95) progress = 95;
        updateProgressBar(progress, "ORACLE CONSENSUS...");
        if (attempts > 60) {
            clearInterval(gameState.pollInterval); stopSpinning([0,0,0], 0n); showToast("Oracle delay. Check history later.", "info"); return;
        }
        try {
            const p1 = safeContractCall(State.actionsManagerContract, 'gameResults', [gameId, 0], 0n, 0, true);
            const p2 = safeContractCall(State.actionsManagerContract, 'gameResults', [gameId, 1], 0n, 0, true);
            const p3 = safeContractCall(State.actionsManagerContract, 'gameResults', [gameId, 2], 0n, 0, true);
            const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
            if (Number(r1) !== 0) {
                clearInterval(gameState.pollInterval);
                const rolls = [Number(r1), Number(r2), Number(r3)];
                let win = 0n;
                if(rolls[0] === gameState.guesses[0] || rolls[1] === gameState.guesses[1] || rolls[2] === gameState.guesses[2]) {
                    let mult = 0;
                    if(rolls[0]===gameState.guesses[0]) mult=1.5; 
                    if(rolls[1]===gameState.guesses[1]) mult= gameState.isCumulative ? mult+5 : Math.max(mult, 5); 
                    if(rolls[2]===gameState.guesses[2]) mult= gameState.isCumulative ? mult+50 : Math.max(mult, 50); 
                    win = ethers.parseEther((gameState.betAmount * mult).toString());
                }
                stopSpinning(rolls, win);
            }
        } catch (e) {}
    }, 2000);
}

function updateGamificationUI() { const el = document.getElementById('currentLevel'); if (el) el.innerText = gameState.currentLevel; }

export const FortunePoolPage = {
    loadPoolBalance: async () => {},
    checkReqs: async () => {
        const el = document.getElementById('oracleFeeStatus');
        const btn = document.getElementById('btn-spin');
        if(!State.isConnected) { if(el) el.innerHTML = `<span class="text-zinc-500">Connect Wallet</span>`; return; }
        
        if (!State.systemData || !State.systemData.oracleFeeInWei) { await loadSystemDataFromAPI(); }
        
        let fee = 0n;
        if (State.systemData && State.systemData.oracleFeeInWei) { 
            fee = BigInt(State.systemData.oracleFeeInWei); 
        } else {
            if (State.actionsManagerContract) {
                try { fee = await safeContractCall(State.actionsManagerContract, 'oracleFeeInWei', [], 0n); } catch (e) {}
            }
            if (fee === 0n) fee = ethers.parseEther("0.001");
        }
        
        gameState.systemReady = true;
        if (!addresses.fortunePool) { gameState.systemReady = false; if(el) el.innerHTML = `<span class="text-red-500 font-bold">⚠️ CONTRACT ERROR</span>`; if(btn) { btn.disabled = true; btn.innerText = "SYSTEM ERROR"; } return; }
        
        if (gameState.isCumulative) fee = fee * 5n;
        
        if(el) { const feeEth = ethers.formatEther(fee); el.innerText = `FEE: ${feeEth} ETH`; el.className = "text-[10px] text-zinc-400 font-mono mt-4 px-4"; }
        const inp = document.getElementById('bet-input');
        if(inp && parseFloat(inp.value) > 0) { if(btn) { btn.disabled = false; btn.innerText = "SPIN TO WIN"; } }
    },

    loadHistory: async () => {
        const list = document.getElementById('gameHistoryList');
        const statsEl = document.getElementById('totalWinningsDisplay');
        if(!list || !State.isConnected) return;
        
        try {
            const res = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
            const data = await res.json();
            const games = data.filter(a => a.type === 'GameResult');
            
            let totalWinnings = 0;
            games.forEach(g => {
                if(g.details.isWin) totalWinnings += parseFloat(ethers.formatEther(g.details.amount));
            });
            if(statsEl) statsEl.innerHTML = `Total Won: <span class="text-amber-400 font-bold">${totalWinnings.toFixed(2)} BKC</span>`;

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
                if(isWin) {
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
                    <div><h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 italic">FORTUNE POOL</h1></div>
                    <div class="text-right"><div class="text-xs font-bold text-amber-500">LVL <span id="currentLevel">1</span></div></div>
                </header>
                <div class="glass-panel p-1 rounded-3xl relative overflow-hidden min-h-[450px] flex flex-col justify-center bg-black/40">
                    <div id="game-interaction-area" class="p-4 transition-opacity duration-300"></div>
                </div>
                <div class="flex justify-between text-[10px] text-zinc-500 font-mono mt-4 px-4"><span>System: Online</span><span id="oracleFeeStatus">Checking...</span></div>
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
            </div>`;
        
        gameState.step = 0; renderStep(); this.checkReqs(); this.loadHistory(); updateGamificationUI();
    }
};

window.FortunePoolPage = FortunePoolPage;