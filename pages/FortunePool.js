// pages/FortunePool.js
// ✅ VERSÃO CORRIGIDA: Polling Robusto (Destrava a UI)

import { State } from '../state.js';
import { loadUserData, safeContractCall } from '../modules/data.js';
import { formatBigNumber, formatPStake } from '../utils.js';
import { showToast, openModal, closeModal } from '../ui-feedback.js';
import { addresses } from '../config.js';

const ethers = window.ethers;

// --- ESTADO DO JOGO ---
let gameState = {
    isSpinning: false,
    gameId: 0,
    pollInterval: null,
    spinInterval: null,
    
    currentLevel: 1,
    currentXP: 0,
    xpPerLevel: 1000,
    totalActivations: 0,
    achievements: [
        { id: 'first-win', name: 'Lucky Miner', desc: 'Win your first prize.', unlocked: false },
        { id: 'veteran', name: 'The Veteran', desc: 'Play 50 times.', unlocked: false, target: 50 },
        { id: 'high-roller', name: 'High Roller', desc: 'Commit over 1000 BKC.', unlocked: false }
    ]
};

// Carrega Estado Local
try {
    const local = localStorage.getItem('bkc_fortune_data_v5');
    if (local) {
        const parsed = JSON.parse(local);
        gameState.currentLevel = parsed.currentLevel || 1;
        gameState.currentXP = parsed.currentXP || 0;
        gameState.totalActivations = parsed.totalActivations || 0;
        gameState.achievements = parsed.achievements || gameState.achievements;
    }
} catch (e) {}

function saveProgress() {
    localStorage.setItem('bkc_fortune_data_v5', JSON.stringify({
        currentLevel: gameState.currentLevel,
        currentXP: gameState.currentXP,
        totalActivations: gameState.totalActivations,
        achievements: gameState.achievements
    }));
    updateGamificationUI();
}

// ============================================
// 1. VISUAL (SLOT MACHINE)
// ============================================

function startSlotAnimation() {
    const slots = [
        document.getElementById('slot-1'),
        document.getElementById('slot-2'),
        document.getElementById('slot-3')
    ];
    if (!slots[0]) return;

    gameState.isSpinning = true;
    slots.forEach(s => {
        s.classList.add('spinning');
        s.classList.remove('win');
    });

    if (gameState.spinInterval) clearInterval(gameState.spinInterval);
    gameState.spinInterval = setInterval(() => {
        slots.forEach(slot => {
            const max = parseInt(slot.dataset.max);
            slot.querySelector('.slot-value').innerText = Math.floor(Math.random() * max) + 1;
        });
    }, 80);
}

function stopSlotAnimation(rolls, prizeWon) {
    if (gameState.spinInterval) clearInterval(gameState.spinInterval);
    if (gameState.pollInterval) clearInterval(gameState.pollInterval);
    
    gameState.isSpinning = false;
    const slots = [
        document.getElementById('slot-1'),
        document.getElementById('slot-2'),
        document.getElementById('slot-3')
    ];

    if (!slots[0]) return;

    // Parada Sequencial
    rolls.forEach((val, index) => {
        setTimeout(() => {
            const slot = slots[index];
            if(slot) {
                slot.classList.remove('spinning');
                const valDisplay = slot.querySelector('.slot-value');
                valDisplay.innerText = val;
                if (val == 1) slot.classList.add('win');
            }
        }, index * 600);
    });

    setTimeout(() => {
        finalizeGameRound(prizeWon, rolls);
    }, 2200);
}

function finalizeGameRound(prizeWon, rolls) {
    const resultDisplay = document.getElementById('resultDisplay');
    const activateBtn = document.getElementById('activateButton');
    const prizeFloat = parseFloat(formatBigNumber(prizeWon));

    if (prizeWon > 0n) {
        resultDisplay.innerHTML = `<h3 class="text-green-400 text-2xl animate-bounce font-black">🎉 YOU WON ${prizeFloat.toFixed(2)} BKC!</h3>`;
        showToast(`WINNER! +${prizeFloat.toFixed(2)} BKC`, "success");
        addXP(150);
        checkAchievements(prizeWon);
    } else {
        resultDisplay.innerHTML = `<h3 class="text-zinc-500 font-bold">No match. Try again!</h3>`;
        addXP(20);
    }
    
    if(activateBtn) {
        activateBtn.disabled = false;
        activateBtn.innerHTML = "PLAY AGAIN";
        activateBtn.classList.remove('cursor-not-allowed', 'opacity-50');
    }
    
    gameState.totalActivations++;
    saveProgress();
    loadUserData(); 
    FortunePoolPage.loadPoolBalance();
}

// ============================================
// 2. MONITORAMENTO (POLLING ROBUSTO)
// ============================================

async function checkGameResultLoop(gameId) {
    if (!gameId || gameId <= 0) return; 

    let attempts = 0;
    if (gameState.pollInterval) clearInterval(gameState.pollInterval);

    // Verifica a cada 4 segundos se o contrato já tem o resultado gravado
    gameState.pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > 40) { // ~3 minutos
            clearInterval(gameState.pollInterval);
            showToast("Oracle delayed. Check history.", "info");
            if(gameState.isSpinning) {
                stopSlotAnimation([0, 0, 0], 0n); // Para forçado
            }
            return;
        }

        try {
            // Chama gameResults(gameId) no contrato
            const result = await safeContractCall(State.actionsManagerContract, 'gameResults', [gameId], null);
            
            // O contrato retorna [roll1, roll2, roll3]
            // Se rolls[0] for diferente de 0, o jogo acabou.
            if (result && result.length === 3) {
                const r1 = Number(result[0]);
                const r2 = Number(result[1]);
                const r3 = Number(result[2]);

                if (r1 !== 0) {
                    // BINGO! Resultado encontrado.
                    clearInterval(gameState.pollInterval);
                    
                    const rolls = [r1, r2, r3];
                    
                    // Calcula prêmio localmente para feedback visual imediato
                    // (A blockchain já pagou, isso é só para mostrar na tela)
                    // Regra: Se qualquer dado for 1, ganhou algo.
                    let visualPrize = 0n;
                    if (r1 === 1 || r2 === 1 || r3 === 1) {
                        visualPrize = 1n; // Valor simbólico > 0 para ativar efeito de vitória
                    }
                    
                    if (gameState.isSpinning) {
                        stopSlotAnimation(rolls, visualPrize);
                    }
                }
            }
        } catch (e) { }
    }, 4000);
}

// ============================================
// 3. TRANSAÇÃO (PLAY)
// ============================================

async function executePurchase() {
    if (gameState.isSpinning) return;
    if (!State.isConnected) return showToast("Connect wallet first.", "error");

    const commitInput = document.getElementById('commitInput'); 
    const activateButton = document.getElementById('activateButton'); 
    const amount = parseFloat(commitInput?.value) || 0;

    if (amount <= 0) return showToast("Enter amount.", "error");
    const amountWei = ethers.parseEther(amount.toString());

    if (amountWei > State.currentUserBalance) return showToast("Insufficient BKC.", "error");

    // Check Oracle Fee
    let ethBal = 0n;
    try { ethBal = await State.provider.getBalance(State.userAddress); } catch(e){}
    const oracleFeeWei = State.systemData?.oracleFeeInWei ? BigInt(State.systemData.oracleFeeInWei) : 0n;
    
    if (oracleFeeWei > 0n && ethBal < oracleFeeWei) {
        return showToast(`Insufficient ETH for Fee.`, "error");
    }

    // UI Loading
    activateButton.disabled = true;
    activateButton.innerHTML = '<div class="loader inline-block"></div> SENDING...';
    activateButton.classList.add('cursor-not-allowed', 'opacity-50');
    document.getElementById('resultDisplay').innerHTML = `<h3 class="text-blue-400 animate-pulse">Sending...</h3>`;

    try {
        // 1. Aprovação
        const allowance = await State.bkcTokenContract.allowance(State.userAddress, addresses.fortunePool);
        if (allowance < amountWei) {
            const txApprove = await State.bkcTokenContract.approve(addresses.fortunePool, amountWei);
            await txApprove.wait();
        }

        // 2. Jogar
        const tx = await State.actionsManagerContract.participate(amountWei, { value: oracleFeeWei });
        document.getElementById('resultDisplay').innerHTML = `<h3 class="text-amber-400 animate-pulse">Confirming...</h3>`;
        
        await tx.wait(); // Espera mineração

        // 3. Inicia Jogo
        startSlotAnimation();
        activateButton.innerHTML = "ORACLE IS THINKING...";
        document.getElementById('resultDisplay').innerHTML = `<h3 class="text-amber-400 animate-pulse">Waiting for Oracle...</h3>`;
        
        // 4. Determina GameID para monitorar
        // Pega o contador global. O jogo atual é o último (ou último - 1 dependendo da concorrência)
        // Vamos monitorar o contador atual
        const currentGameCounter = await safeContractCall(State.actionsManagerContract, 'gameCounter', [], 0);
        gameState.gameId = Number(currentGameCounter); 
        
        checkGameResultLoop(gameState.gameId);

    } catch (error) {
        console.error(error);
        showToast("Transaction failed", "error");
        activateButton.disabled = false;
        activateButton.innerHTML = "SPIN & WIN ►";
        activateButton.classList.remove('cursor-not-allowed', 'opacity-50');
        document.getElementById('resultDisplay').innerHTML = `<h3>Ready to Play</h3>`;
        gameState.isSpinning = false;
    }
}

// ============================================
// 4. UI & HELPERS
// ============================================

function updateGamificationUI() {
    const lvlEl = document.getElementById('currentLevel');
    const progFillEl = document.getElementById('progressFill');
    if (lvlEl) lvlEl.textContent = gameState.currentLevel;
    if (progFillEl) {
        const percentage = Math.min((gameState.currentXP / gameState.xpPerLevel) * 100, 100);
        progFillEl.style.width = `${percentage}%`;
    }
}

function addXP(amount) {
    gameState.currentXP += amount;
    if (gameState.currentXP >= gameState.xpPerLevel) {
         gameState.currentLevel++;
         gameState.currentXP -= gameState.xpPerLevel; 
         showToast(`LEVEL UP! Level ${gameState.currentLevel}!`, "success");
    }
    saveProgress();
}

function checkAchievements(prizeWon) {
    let newAch = false;
    const ach1 = gameState.achievements.find(a => a.id === 'first-win');
    if (ach1 && !ach1.unlocked && prizeWon > 0n) { ach1.unlocked = true; newAch = true; showToast("Achievement: Lucky Miner!", "success"); }
    if (newAch) saveProgress();
}

function showAchievements() {
    const unlocked = gameState.achievements.filter(a => a.unlocked).length;
    const html = `
        <div class="bg-zinc-900 p-6 rounded-xl max-w-md mx-auto border border-zinc-700 shadow-2xl">
            <h3 class="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2"><i class="fa-solid fa-trophy"></i> Achievements</h3>
            <p class="text-xs text-zinc-500 mb-4">Unlocked: ${unlocked}/${gameState.achievements.length}</p>
            <div class="space-y-3">
                ${gameState.achievements.map(a => `
                    <div class="flex items-center gap-3 p-3 rounded-lg ${a.unlocked ? 'bg-amber-900/20 border border-amber-500/30' : 'bg-zinc-800 opacity-60'}">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-black/50">
                             <i class="fa-solid ${a.unlocked ? 'fa-medal text-amber-400' : 'fa-lock text-zinc-600'} text-lg"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">${a.name}</h4>
                            <p class="text-[10px] text-zinc-400">${a.desc}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="mt-6 w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold py-3 rounded-lg transition-colors" onclick="document.getElementById('achievementsModal').classList.remove('active')">Close</button>
        </div>
    `;
    const modal = document.getElementById('achievementsModal');
    if(modal) {
        modal.innerHTML = html;
        modal.classList.add('active');
    }
}

export const FortunePoolPage = {
    loadPoolBalance: async () => {
        if (!State.actionsManagerContractPublic) return;
        try {
            const balance = await safeContractCall(State.actionsManagerContractPublic, 'prizePoolBalance', [], 0n);
            const el = document.getElementById('totalPool');
            if (el) el.innerText = formatBigNumber(balance).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' BKC';
        } catch {}
    },
    
    render(isActive) {
        if (!isActive) return;
        const container = document.getElementById('actions');
        
        container.innerHTML = `
            <div class="fortune-pool-wrapper text-center max-w-2xl mx-auto py-8 animate-fadeIn">
                <header class="mb-8 flex justify-between items-end border-b border-zinc-800 pb-4"> 
                    <div class="text-left">
                        <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 mb-1 italic">FORTUNE POOL</h1>
                        <div class="text-xs text-zinc-500 font-mono">PRIZE POOL: <span id="totalPool" class="text-green-400 font-bold">Loading...</span></div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-bold text-amber-500">LVL <span id="currentLevel">1</span></div>
                        <div class="w-32 h-2 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                            <div id="progressFill" class="h-full bg-gradient-to-r from-amber-600 to-yellow-400 w-0 transition-all duration-500"></div>
                        </div>
                    </div>
                </header>

                <div class="bg-zinc-900/80 border border-zinc-700/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50"></div>

                    <div class="slot-machine-container mb-8">
                        <div class="slot-window" id="slot-1" data-max="3">
                            <div class="slot-value">?</div>
                            <span class="slot-label text-[10px] mt-2 text-zinc-500 font-bold uppercase tracking-wider">33% Win</span>
                        </div>
                        <div class="slot-window" id="slot-2" data-max="10">
                            <div class="slot-value">?</div>
                            <span class="slot-label text-[10px] mt-2 text-zinc-500 font-bold uppercase tracking-wider">10% Win</span>
                        </div>
                        <div class="slot-window" id="slot-3" data-max="100">
                            <div class="slot-value">?</div>
                            <span class="slot-label text-[10px] mt-2 text-zinc-500 font-bold uppercase tracking-wider">1% Win</span>
                        </div>
                    </div>
                    
                    <div id="resultDisplay" class="h-12 mb-6 flex items-center justify-center transition-all">
                        <h3 class="text-zinc-400 uppercase tracking-widest text-sm font-bold">Ready to Play</h3>
                    </div>

                    <div class="bg-black/40 p-2 rounded-xl border border-zinc-800/50 mb-6 flex items-center gap-2">
                        <div class="flex-1 relative">
                            <input type="number" id="commitInput" class="w-full bg-transparent p-3 pl-4 text-white font-mono text-xl font-bold outline-none placeholder-zinc-700" placeholder="0.00">
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">BKC</span>
                        </div>
                        <div class="flex gap-1 pr-1">
                            <button class="quick-bet text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded transition-colors" onclick="document.getElementById('commitInput').value=10">10</button>
                            <button class="quick-bet text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded transition-colors" onclick="document.getElementById('commitInput').value=100">100</button>
                        </div>
                    </div>

                    <button id="activateButton" class="w-full bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black py-4 rounded-xl shadow-lg shadow-amber-900/20 transform transition hover:-translate-y-0.5 text-lg flex items-center justify-center gap-2 tracking-wide">
                        SPIN & WIN <i class="fa-solid fa-play"></i>
                    </button>
                    
                    <div class="mt-6 flex justify-between text-[10px] text-zinc-500 font-mono uppercase px-2">
                         <span id="pstakeStatus">Checking pStake...</span>
                         <span id="oracleFeeStatus">Oracle Fee: ...</span>
                    </div>

                </div>

                <div class="mt-8 flex justify-center gap-6">
                     <button class="text-zinc-500 hover:text-white text-xs flex items-center gap-2 transition-colors" onclick="document.getElementById('rulesModal').classList.add('active')"><i class="fa-solid fa-circle-info"></i> Rules</button>
                     <button class="text-zinc-500 hover:text-white text-xs flex items-center gap-2 transition-colors" id="achievementsBtn"><i class="fa-solid fa-trophy"></i> Awards</button>
                </div>
                
                <div id="achievementsModal" class="modal fixed inset-0 z-50 hidden bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"></div>
                
                <div id="rulesModal" class="modal fixed inset-0 z-50 hidden bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div class="bg-zinc-900 border border-zinc-700 p-6 rounded-xl max-w-sm w-full relative shadow-2xl">
                        <button class="absolute top-4 right-4 text-zinc-500 hover:text-white" onclick="document.getElementById('rulesModal').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
                        <h3 class="font-bold text-white mb-4 text-lg flex items-center gap-2"><i class="fa-solid fa-book-open text-amber-500"></i> Game Rules</h3>
                        <ul class="list-disc pl-5 text-zinc-400 text-sm space-y-3 leading-relaxed">
                            <li>Oracle rolls 3 independent dice.</li>
                            <li><strong>Dice 1 (33%):</strong> Rolls 1-3. If 1, you win 3x.</li>
                            <li><strong>Dice 2 (10%):</strong> Rolls 1-10. If 1, you win 10x.</li>
                            <li><strong>Dice 3 (1%):</strong> Rolls 1-100. If 1, you win 100x.</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        const btn = document.getElementById('activateButton');
        if (btn) btn.addEventListener('click', executePurchase);
        document.getElementById('achievementsBtn').addEventListener('click', () => this.showAchievements());

        this.loadPoolBalance();
        this.checkReqs();
        updateGamificationUI();
    },

    async checkReqs() {
        if(!State.isConnected) return;
        const fee = State.systemData?.oracleFeeInWei || 0n;
        document.getElementById('oracleFeeStatus').innerText = `FEE: ${ethers.formatEther(fee)} ETH`;
        
        const [_, pStakeReq] = await safeContractCall(State.ecosystemManagerContract, 'getServiceRequirements', ["FORTUNE_POOL_SERVICE"], [0n, 0n]);
        const hasPStake = State.userTotalPStake >= pStakeReq;
        
        const psEl = document.getElementById('pstakeStatus');
        if(psEl) {
            psEl.innerHTML = hasPStake ? '<span class="text-green-500">PSTAKE ACTIVE</span>' : '<span class="text-red-500">LOW PSTAKE</span>';
        }
    }
};