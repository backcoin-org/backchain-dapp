// pages/FortunePool.js
import { State } from '../state.js';
import { loadUserData } from '../modules/data.js';
import { formatBigNumber, formatAddress, formatPStake } from '../utils.js';
import { showToast, openModal, closeModal } from '../ui-feedback.js';
import { addresses } from '../config.js';
import { safeContractCall } from '../modules/data.js';

const ethers = window.ethers;

// ============================================
// I. GAMIFICATION & GAME STATE (PERSISTENCE)
// ============================================

const STORAGE_KEY = 'bkc_fortune_game_data_v2';
const XP_PER_LEVEL = 1000;

const defaultState = {
    currentLevel: 1,
    currentXP: 0,
    xpPerLevel: XP_PER_LEVEL,
    totalActivations: 0,
    achievements: [
        { id: 'first-win', name: 'Lucky Miner', desc: 'Win your first prize.', unlocked: false },
        { id: 'veteran', name: 'The Veteran', desc: 'Play 50 times.', unlocked: false, target: 50 },
        { id: 'high-roller', name: 'High Roller', desc: 'Commit over 1000 BKC in one go.', unlocked: false }
    ]
};

// Carrega do LocalStorage ou usa o padrão
let savedData = defaultState;
try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) savedData = { ...defaultState, ...JSON.parse(local) };
} catch (e) { console.error("Error loading game save", e); }

const gameState = {
    ...savedData,
    poolBalance: 0n,
    isActivating: false, 
    lastGame: {
        id: 0,
        amount: 0n,
        prize: 0n,
        rolls: [0, 0, 0]
    }
};

function saveProgress() {
    const dataToSave = {
        currentLevel: gameState.currentLevel,
        currentXP: gameState.currentXP,
        totalActivations: gameState.totalActivations,
        achievements: gameState.achievements
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    updateGamificationUI();
}

function updateGamificationUI() {
    const lvlEl = document.getElementById('currentLevel');
    const progTextEl = document.getElementById('progressText');
    const progFillEl = document.getElementById('progressFill');

    if (lvlEl) lvlEl.textContent = gameState.currentLevel;
    
    if (progTextEl && progFillEl) {
        const percentage = Math.min((gameState.currentXP / gameState.xpPerLevel) * 100, 100);
        progTextEl.textContent = `${Math.floor(gameState.currentXP)} / ${gameState.xpPerLevel} XP`;
        progFillEl.style.width = `${percentage}%`;
    }
}

function addXP(amount) {
    gameState.currentXP += amount;
    if (gameState.currentXP >= gameState.xpPerLevel) {
         gameState.currentLevel++;
         gameState.currentXP = gameState.currentXP - gameState.xpPerLevel; 
         showToast(`LEVEL UP! You are now Level ${gameState.currentLevel}!`, "success", 5000);
    }
    saveProgress();
}

// ============================================
// II. CONFIGURATIONS AND CONSTANTS
// ============================================

const PRIZE_TIERS_INFO = [
    { multiplier: 3, chance: '1 in 3 (33.3%)' },
    { multiplier: 10, chance: '1 in 10 (10%)' },
    { multiplier: 100, chance: '1 in 100 (1%)' },
];

// ============================================
// III. CONTRACT AND CALCULATION LOGIC
// ============================================

/**
 * [Método] Loads the balance of the Prize Pool (FortunePool)
 */
async function loadPoolBalanceInternal() {
    if (!State.actionsManagerContractPublic) return;
    try {
        const balance = await safeContractCall(
            State.actionsManagerContractPublic,
            'prizePoolBalance',
            [], 
            0n
        );
        gameState.poolBalance = balance;
        FortunePoolPage.updatePoolDisplay(); // Chama o método exportado
    } catch (e) {
        console.error("Failed to load pool balance:", e);
    }
}


/**
 * Called by the EVENT LISTENER when the 'GameFulfilled' event is received.
 */
export function handleGameFulfilled(gameId, user, prizeWon, rolls) {
    if (!State.userAddress || user.toLowerCase() !== State.userAddress.toLowerCase()) {
        return;
    }
    
    // UPDATE LAST GAME STATE
    gameState.lastGame = {
        id: Number(gameId),
        amount: gameState.lastGame.amount, 
        prize: prizeWon,
        rolls: rolls.map(r => Number(r))
    };

    const prizeData = {
        totalPrizeWon: prizeWon,
        rolls: rolls 
    };

    runActivationSequence(prizeData);
}

// ============================================
// IV. ACTIVATION ANIMATIONS (REWARD HANDLER)
// ============================================

async function runActivationSequence(prizeData) {
    const activationCore = document.getElementById('activationCore');
    const resultDisplay = document.getElementById('resultDisplay');
    
    if (!activationCore || !resultDisplay) return;

    // 1. Stop Animation
    activationCore.classList.remove('activating');

    // 2. Show Result
    const totalPrizeWonFloat = parseFloat(formatBigNumber(prizeData.totalPrizeWon));
    
    FortunePoolPage.updateLastGamePanel(); 

    if (prizeData.totalPrizeWon > 0n) {
        resultDisplay.classList.add('win');
        resultDisplay.innerHTML = `<h3>🎉 REWARD RECEIVED! You won ${totalPrizeWonFloat.toLocaleString('en-US', { maximumFractionDigits: 2 })} $BKC!</h3>`;
        activationCore.classList.add('win-pulse');
    } else {
        resultDisplay.classList.add('lose');
        resultDisplay.innerHTML = `<h3>No Reward This Time.</h3>`;
        activationCore.classList.add('lose-pulse');
    }

    await new Promise(resolve => setTimeout(resolve, 3000)); 
    
    // 3. Reset for next game
    activationCore.classList.remove('win-pulse', 'lose-pulse');
    resultDisplay.classList.remove('win', 'lose');
    resultDisplay.innerHTML = `<h3>Ready to Commit</h3>`;

    // 4. Final Feedback (Toast)
    if (prizeData.totalPrizeWon > 0n) {
        showToast(`ORACLE RESULT: You received ${totalPrizeWonFloat.toLocaleString('en-US', { maximumFractionDigits: 2 })} BKC reward.`, 'success');
    } else {
        showToast('ORACLE RESULT: Purchase registered. Better luck next time!', 'info');
    }
    
    // 5. Update State & Gamification
    gameState.isActivating = false;
    FortunePoolPage.updateUIState();
    
    // --- GAMIFICATION LOGIC ---
    gameState.totalActivations++;
    let xpGained = 100;
    if (prizeData.totalPrizeWon > 0n) xpGained += 50;
    FortunePoolPage.addXP(xpGained);
    FortunePoolPage.checkAchievements(prizeData.totalPrizeWon); // Chama nova lógica de checagem

    await loadUserData(); 
    await FortunePoolPage.loadPoolBalance(); // Chama o método do objeto
}

function stopActivationOnError() {
    const activationCore = document.getElementById('activationCore');
    const resultDisplay = document.getElementById('resultDisplay');
    
    if (activationCore) {
        activationCore.classList.remove('activating');
        activationCore.classList.add('lose-pulse');
    }
    if (resultDisplay) {
        resultDisplay.classList.add('lose');
        resultDisplay.innerHTML = '<h3>⚠️ TRANSACTION FAILED!</h3>';
    }
    
    gameState.isActivating = false;
    FortunePoolPage.updateUIState();
}


// ============================================
// V. MAIN "PURCHASE" FUNCTION
// ============================================

async function executePurchase() {
    if (gameState.isActivating) return;
    if (!State.isConnected) {
        showToast("Connect wallet first.", "error");
        return;
    }
    if (!State.ecosystemManagerContract || !State.bkcTokenContract || !State.actionsManagerContract) {
        showToast("Contracts are still loading. Please wait a moment and try again.", "error");
        return;
    }

    const commitInput = document.getElementById('commitInput'); 
    const activateButton = document.getElementById('activateButton'); 
    const amount = parseFloat(commitInput?.value) || 0;

    if (amount <= 0 || isNaN(amount)) {
        showToast("Please enter a valid amount to commit.", "error"); 
        return;
    }
    
    const amountWei = ethers.parseEther(amount.toString());
    
    if (amountWei > State.currentUserBalance) {
        showToast("Insufficient BKC balance for this amount.", "error");
        FortunePoolPage.updateUIState();
        return;
    }
    
    const oracleFeeWei = State.systemData.oracleFeeInWei ? BigInt(State.systemData.oracleFeeInWei) : 0n;
    if (oracleFeeWei <= 0n) {
        showToast("Oracle Fee is not set. Please contact support.", "error");
        return;
    }
    
    const userNativeBalance = State.currentUserNativeBalance || 0n;
    if (userNativeBalance < oracleFeeWei) {
        showToast(`Insufficient native balance. You need at least ${ethers.formatEther(oracleFeeWei)} ETH/BNB to pay the oracle fee.`, "error");
        return;
    }

    // Check Achievement: High Roller (antes da transação)
    if (amount >= 1000) {
        const ach = gameState.achievements.find(a => a.id === 'high-roller');
        if (ach && !ach.unlocked) { ach.unlocked = true; saveProgress(); showToast("Achievement Unlocked: High Roller!", "success"); }
    }

    gameState.isActivating = true;
    if (activateButton) {
        activateButton.disabled = true;
        activateButton.innerHTML = '<div class="loader inline-block"></div> REQUESTING ORACLE...'; 
    }

    try {
        const [ignoredFee, pStakeReq] = await safeContractCall(
            State.ecosystemManagerContract, 
            'getServiceRequirements', 
            ["FORTUNE_POOL_SERVICE"],
            [0n, 0n]
        );
        if (State.userTotalPStake < pStakeReq) {
            throw new Error(`PStake requirement failed validation. Required: ${formatPStake(pStakeReq)}`);
        }
        
        const allowance = await State.bkcTokenContract.allowance(State.userAddress, addresses.actionsManager);
        if (allowance < amountWei) {
             showToast(`Approving ${amount.toFixed(2)} $BKC for activation...`, "info");
             const approveTx = await State.bkcTokenContract.approve(addresses.actionsManager, amountWei);
             await approveTx.wait();
             showToast('Approval successful! Requesting game...', "success");
        }
        
        const playTx = await State.actionsManagerContract.participate(
            amountWei, 
            { value: oracleFeeWei }
        );
        
        gameState.lastGame.amount = amountWei; 
        gameState.lastGame.id = 0; 
        gameState.lastGame.prize = 0n;
        gameState.lastGame.rolls = [0, 0, 0];
        FortunePoolPage.updateLastGamePanel(true); 
        
        const activationCore = document.getElementById('activationCore');
        const resultDisplay = document.getElementById('resultDisplay');
        if (activationCore) activationCore.classList.add('activating');
        if (resultDisplay) resultDisplay.innerHTML = `<h3>REQUESTING ORACLE...</h3>`;

        await playTx.wait();
        
        showToast("✅ Game Requested! The Oracle is processing your result. (Est. 1-2 min)", "success");
        if (resultDisplay) resultDisplay.innerHTML = `<h3>WAITING FOR ORACLE...</h3>`;
        
    } catch (error) {
        console.error("Activation error:", error);
        let errorMessage = error.reason || error.message || 'Transaction reverted.';
        
        if (errorMessage.includes("pStake requirement failed")) {
            errorMessage = "Insufficient pStake requirement. Delegate more BKC!";
        } else if (errorMessage.includes("transfer amount exceeds balance")) {
            errorMessage = "Insufficient BKC balance.";
        } else if (errorMessage.includes("Invalid native fee")) {
            errorMessage = "Invalid Oracle Fee amount sent.";
        }
        
        showToast(`Activation Failed: ${errorMessage}`, "error");
        stopActivationOnError(); 
    } 
}


// ============================================
// VI. PAGE COMPONENT EXPORT
// ============================================

export const FortunePoolPage = {
    
    // Método corrigido: Chamada da função externa para carregar o saldo
    loadPoolBalance: loadPoolBalanceInternal,

    addXP: addXP,

    checkAchievements(prizeWon) {
        const totalActivations = gameState.totalActivations;
        let newAchievement = false;
        
        // 1. First Win
        const ach1 = gameState.achievements.find(a => a.id === 'first-win');
        if (ach1 && !ach1.unlocked && prizeWon > 0n) { ach1.unlocked = true; newAchievement = true; showToast("Achievement Unlocked: Lucky Miner!", "success"); }

        // 2. Veteran (Play 50 times)
        const ach2 = gameState.achievements.find(a => a.id === 'veteran');
        if (ach2 && !ach2.unlocked && totalActivations >= ach2.target) {
            ach2.unlocked = true; newAchievement = true; showToast("Achievement Unlocked: The Veteran!", "success");
        }
        
        if (newAchievement) saveProgress();
    },

    showAchievements() {
        const achievedCount = gameState.achievements.filter(a => a.unlocked).length;
        
        const content = `
            <div class="modal-body">
                <h3 class="text-2xl font-bold text-amber-400 mb-4">🏆 Your Achievements</h3>
                <p class="text-sm text-zinc-400 mb-6">Total Unlocked: ${achievedCount} / ${gameState.achievements.length}</p>
                <div class="space-y-4">
                    ${gameState.achievements.map(a => `
                        <div class="achievement-item ${a.unlocked ? 'bg-green-600/20 border-green-500/50' : 'bg-zinc-800 border-zinc-700 opacity-70'} p-3 rounded-lg flex items-center gap-3">
                            <i class="fa-solid ${a.unlocked ? 'fa-medal text-green-400' : 'fa-lock text-zinc-500'} text-2xl flex-shrink-0"></i>
                            <div>
                                <h4 class="text-white font-semibold">${a.name}</h4>
                                <p class="text-xs text-zinc-300">${a.desc}</p>
                                ${a.target ? `<p class="text-xs text-zinc-500 mt-1">Goal: ${a.target}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer p-4 border-t border-zinc-700 flex justify-end">
                <button class="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg closeModalBtn">Close</button>
            </div>
        `;
        openModal(content, 'max-w-md');
    },

    // --- RENDERIZAÇÃO ---
    
    render(isActive) {
        if (!isActive) return;

        const pageContainer = document.getElementById('actions');
        if (!pageContainer) return;

        pageContainer.innerHTML = this.getHtmlContent();
        
        this.initializeEventListeners();
        updateGamificationUI(); 
        
        this.loadPoolBalance();
        this.updateUIState();
        this.updateLastGamePanel(); 
    },
    
    getHtmlContent() {
        return `
            <div class="fortune-pool-wrapper">
                <header class="fortune-header"> 
                    <div class="header-top">
                        <h1 class="game-title">✨ BKC FORTUNE POOL GENERATOR</h1>
                        <div class="legacy-badge">
                            <span class="legacy-icon">🛠️</span>
                            <span class="legacy-level">Lvl <span id="currentLevel">${gameState.currentLevel}</span></span>
                        </div>
                    </div>
                    
                    <div class="legacy-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                        </div>
                        <span class="progress-text" id="progressText">Loading XP...</span>
                    </div>

                    <div class="pools-info">
                        <div class="pool-item" title="Current Pool Size" style="grid-column: span 3; background: rgba(0, 163, 255, 0.05); border-color: var(--tiger-accent-blue);">
                            <span class="pool-label">TOTAL PRIZE POOL</span>
                            <span class="pool-value" id="totalPool" style="color: var(--tiger-accent-blue); font-size: 1.25rem;">0.00</span>
                        </div>
                    </div>
                </header>

                <section class="tiger-game-area activation-area" id="activationArea">
                    <div class="activation-core" id="activationCore">
                        <div class="core-center">
                            <img src="./assets/bkc_logo_3d.png" alt="BKC" />
                        </div>
                        <div class="core-pulse-1"></div>
                        <div class="core-pulse-2"></div>
                    </div>

                    <div class="result-display" id="resultDisplay">
                        <h3>Ready to Commit</h3>
                    </div>
                </section>

                <section class="tiger-control-panel">
                    <div class="wager-section">
                        <label for="commitInput" class="control-label">COMMITMENT AMOUNT</label>
                        <div class="wager-input-group">
                            <input type="number" id="commitInput" class="wager-input" placeholder="0.00" min="0.01" step="any">
                            <span class="currency">$BKC</span>
                        </div>
                        <div class="quick-bets">
                            <button class="quick-bet-btn" data-action="add" data-value="1000">+1K</button>
                            <button class="quick-bet-btn" data-action="add" data-value="100">+100</button>
                            <button class="quick-bet-btn" data-action="add" data-value="10">+10</button>
                            <button class="quick-bet-btn" data-action="add" data-value="1">+1</button>
                            <button class="quick-bet-btn" data-action="add" data-value="0.1">+0.1</button>
                            <button class="quick-bet-btn reset-btn" data-action="reset">RESET</button>
                        </div>
                    </div>

                    <div class="payout-info">
                        <div class="info-row">
                            <span class="info-label">PSTAKE STATUS</span>
                            <span class="info-value" id="pstakeStatus">
                                <span class="status-icon">...</span> Checking
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">ORACLE FEE</span>
                            <span class="info-value" id="oracleFeeStatus">
                                <span class="status-icon">...</span> Loading
                            </span>
                        </div>
                    </div>
                </section>
                
                <section class="last-game-panel" id="lastGamePanel">
                    </section>

                <section class="tiger-action-bar">
                    <button class="spin-button" id="activateButton">ACTIVATE PURCHASE & MINE</button>
                    <button class="spin-button buy-button" id="buyBkcButton" style="display: none;">BUY $BKC TO START</button>
                    
                    <div class="secondary-actions">
                        <button class="icon-button" id="achievementsBtn" title="Achievements">
                            <i class="fa-solid fa-trophy"></i>
                            <span class="notification-badge" id="achievementBadge" style="display: none;">!</span>
                        </button>
                        <button class="icon-button" id="rulesBtn" title="How it Works"><i class="fa-solid fa-book-open"></i></button>
                    </div>
                </section>

                <div class="modal" id="achievementsModal">...</div>
                <div class="modal" id="rulesModal">...</div>
                <div class="modal" id="levelUpModal">...</div>
            </div>
        `;
    },

    initializeEventListeners() {
        const activateButton = document.getElementById('activateButton');
        const buyBkcButton = document.getElementById('buyBkcButton'); 
        const commitInput = document.getElementById('commitInput');
        const achievementsBtn = document.getElementById('achievementsBtn');
        const rulesBtn = document.getElementById('rulesBtn');

        if (commitInput) {
            commitInput.addEventListener('input', () => this.updateUIState());
        }

        document.querySelectorAll('.quick-bet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDecimalBet(e.currentTarget));
        });

        if (activateButton) {
            activateButton.addEventListener('click', executePurchase); 
        }

        if (buyBkcButton) {
            buyBkcButton.addEventListener('click', () => {
                const swapLink = addresses.bkcDexPoolAddress || '#'; 
                if (swapLink !== '#' && !swapLink.startsWith('#')) {
                     window.open(swapLink, "_blank");
                } else {
                     showToast("Buy link not configured.", "info");
                }
            });
        }

        if (achievementsBtn) {
            achievementsBtn.addEventListener('click', () => this.showAchievements());
        }
        if (rulesBtn) {
            rulesBtn.addEventListener('click', () => {
                 const modal = document.getElementById('rulesModal');
                 if(modal) modal.classList.add('active');
            });
        }
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal') || e.target.classList.contains('modal-close')) {
                    modal.classList.remove('active');
                }
            });
        });
    },

    handleDecimalBet(btnElement) {
        const commitInput = document.getElementById('commitInput');
        if (!commitInput) return;

        const action = btnElement.dataset.action;
        const value = parseFloat(btnElement.dataset.value || 0);
        let currentValue = parseFloat(commitInput.value) || 0;

        if (action === 'reset') {
            currentValue = 0;
        } else if (action === 'add') {
            currentValue = Number((currentValue + value).toFixed(2)); 
        }

        commitInput.value = currentValue > 0 ? currentValue : '';
        this.updateUIState();
    },
    
    // Chamada correta para a função externa
    loadPoolBalance: loadPoolBalanceInternal, 

    updatePoolDisplay() {
        const totalPool = document.getElementById('totalPool');
        if (totalPool) totalPool.textContent = formatBigNumber(gameState.poolBalance || 0n).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' $BKC';
    },
    
    handleGameFulfilled,

    addXP: addXP, // Usa a função externa

    checkAchievements(prizeWon) {
        const totalActivations = gameState.totalActivations;
        let newAchievement = false;
        
        const ach1 = gameState.achievements.find(a => a.id === 'first-win');
        if (ach1 && !ach1.unlocked && prizeWon > 0n) { ach1.unlocked = true; newAchievement = true; showToast("Achievement Unlocked: Lucky Miner!", "success"); }

        const ach2 = gameState.achievements.find(a => a.id === 'veteran');
        if (ach2 && !ach2.unlocked && totalActivations >= ach2.target) {
            ach2.unlocked = true; newAchievement = true; showToast("Achievement Unlocked: The Veteran!", "success");
        }
        
        // High roller é checado no executePurchase para feedback imediato, mas salvamos aqui.
        if (newAchievement) saveProgress(); 
    },

    showAchievements() {
        const achievedCount = gameState.achievements.filter(a => a.unlocked).length;
        
        const content = `
            <div class="modal-body">
                <h3 class="text-2xl font-bold text-amber-400 mb-4">🏆 Your Achievements</h3>
                <p class="text-sm text-zinc-400 mb-6">Total Unlocked: ${achievedCount} / ${gameState.achievements.length}</p>
                <div class="space-y-4">
                    ${gameState.achievements.map(a => `
                        <div class="achievement-item ${a.unlocked ? 'bg-green-600/20 border-green-500/50' : 'bg-zinc-800 border-zinc-700 opacity-70'} p-3 rounded-lg flex items-center gap-3">
                            <i class="fa-solid ${a.unlocked ? 'fa-medal text-green-400' : 'fa-lock text-zinc-500'} text-2xl flex-shrink-0"></i>
                            <div>
                                <h4 class="text-white font-semibold">${a.name}</h4>
                                <p class="text-xs text-zinc-300">${a.desc}</p>
                                ${a.target ? `<p class="text-xs text-zinc-500 mt-1">Goal: ${a.target}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer p-4 border-t border-zinc-700 flex justify-end">
                <button class="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg closeModalBtn">Close</button>
            </div>
        `;
        openModal(content, 'max-w-md');
    },

    async checkRequirements() {
        const pstakeStatusEl = document.getElementById('pstakeStatus');
        const oracleFeeStatusEl = document.getElementById('oracleFeeStatus');
        
        if (!pstakeStatusEl || !oracleFeeStatusEl || !State.ecosystemManagerContract) return false;

        if (!State.isConnected) {
            pstakeStatusEl.innerHTML = '<span class="status-icon error">⚠️</span> Connect Wallet';
            oracleFeeStatusEl.innerHTML = '<span class="status-icon error">⚠️</span> Connect Wallet';
            return false;
        }
        
        pstakeStatusEl.innerHTML = '<span class="status-icon">...</span> Checking';
        oracleFeeStatusEl.innerHTML = '<span class="status-icon">...</span> Checking';
        
        try {
            const [ignoredFee, pStakeReq] = await safeContractCall( 
                State.ecosystemManagerContract, 
                'getServiceRequirements', 
                ["FORTUNE_POOL_SERVICE"], 
                [0n, 0n]
            );
            
            const meetsPStake = State.userTotalPStake >= pStakeReq;
            
            if (meetsPStake) {
                pstakeStatusEl.innerHTML = '<span class="status-icon">✅</span> Requirement Met';
                pstakeStatusEl.classList.remove('text-red-400');
                pstakeStatusEl.classList.add('text-green-400');
            } else {
                const reqFormatted = formatPStake(pStakeReq);
                pstakeStatusEl.innerHTML = `<span class="status-icon error">❌</span> Min ${reqFormatted} pStake Required`;
                pstakeStatusEl.classList.remove('text-green-400');
                pstakeStatusEl.classList.add('text-red-400');
            }
            
            const oracleFeeWei = State.systemData.oracleFeeInWei ? BigInt(State.systemData.oracleFeeInWei) : 0n;
            const userNative = State.currentUserNativeBalance || 0n;
            const meetsOracleFee = userNative >= oracleFeeWei;
            
            if (oracleFeeWei > 0n) {
                const feeFormatted = ethers.formatEther(oracleFeeWei);
                if (meetsOracleFee) {
                    oracleFeeStatusEl.innerHTML = `<span class="status-icon">✅</span> ${feeFormatted} ETH/BNB`;
                    oracleFeeStatusEl.classList.remove('text-red-400');
                    oracleFeeStatusEl.classList.add('text-green-400');
                } else {
                    oracleFeeStatusEl.innerHTML = `<span class="status-icon error">❌</span> Need ${feeFormatted} ETH/BNB`;
                    oracleFeeStatusEl.classList.remove('text-green-400');
                    oracleFeeStatusEl.classList.add('text-red-400');
                }
            } else {
                 oracleFeeStatusEl.innerHTML = `<span class="status-icon error">⚠️</span> Not Set`;
                 oracleFeeStatusEl.classList.add('text-red-400');
            }
            
            return (meetsPStake && meetsOracleFee); 

        } catch (e) {
            pstakeStatusEl.innerHTML = '<span class="status-icon error">⚠️</span> Error Check';
            oracleFeeStatusEl.innerHTML = '<span class="status-icon error">⚠️</span> Error Check';
            return false;
        }
    },

    updateLastGamePanel(isWaiting = false) {
        const panel = document.getElementById('lastGamePanel');
        if (!panel) return;

        const { id, amount, prize, rolls } = gameState.lastGame;
        const prizeFloat = formatBigNumber(prize);
        const amountFloat = formatBigNumber(amount);
        
        const rollHtml = rolls.map(r => 
            `<span class="roll-number">${r === 0 ? '?' : r}</span>`
        ).join('');
        
        let headerText = 'LAST ACTIVATION DETAILS';
        let prizeText = 'No recorded games yet.';
        let winClass = '';

        if (isWaiting) {
             headerText = `PENDING GAME...`;
             prizeText = `<span style="color:var(--tiger-accent-blue);">Awaiting Oracle fulfillment...</span>`;
             winClass = 'pending';
        } else if (id > 0) {
            headerText = `GAME #${id}`;
            if (prize > 0n) {
                prizeText = `<span style="color:var(--tiger-accent-green);">${prizeFloat.toLocaleString('en-US', { maximumFractionDigits: 2 })} $BKC WON</span>`;
                winClass = 'win';
            } else {
                prizeText = `<span style="color:var(--tiger-accent-orange);">No Reward This Time</span>`;
                winClass = 'lose';
            }
        }
        
        panel.innerHTML = `
            <div class="panel-header ${winClass}">
                <h4>${headerText}</h4>
                <div class="prize-text">${prizeText}</div>
            </div>
            
            <div class="rolls-container">
                <div class="roll-info">
                    <span class="roll-label">Commited Amount:</span>
                    <span class="roll-value">${amountFloat.toLocaleString('en-US', { maximumFractionDigits: 2 })} $BKC</span>
                </div>
                <div class="roll-info">
                    <span class="roll-label">Rolls:</span>
                    <div class="rolls-display">
                        ${rollHtml}
                    </div>
                </div>
            </div>
        `;

        // Estilos CSS Inline para consistência com o arquivo CSS externo
        panel.style.cssText = `
            background: var(--tiger-bg-secondary);
            border: 1px solid var(--tiger-border-color);
            border-radius: 12px;
            padding: 16px;
            margin-top: 16px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;
        const rollsDisplay = panel.querySelector('.rolls-display');
        if (rollsDisplay) rollsDisplay.style.cssText = "display: flex; gap: 8px;";
        
        const rollNumbers = panel.querySelectorAll('.roll-number');
        rollNumbers.forEach(el => {
            el.style.cssText = `
                background: var(--tiger-bg-primary);
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: bold;
                color: ${winClass === 'win' ? 'var(--tiger-accent-green)' : 'var(--tiger-accent-gold)'};
                font-family: monospace;
            `;
        });
    },

    async updateUIState() {
        const activateButton = document.getElementById('activateButton');
        const buyBkcButton = document.getElementById('buyBkcButton');
        const commitInput = document.getElementById('commitInput');
        
        if (!activateButton || !buyBkcButton || !commitInput) return;

        activateButton.style.display = 'none';
        buyBkcButton.style.display = 'none';

        if (!State.isConnected) {
            activateButton.style.display = 'block';
            activateButton.disabled = true;
            activateButton.innerHTML = 'CONNECT WALLET';
            this.checkRequirements(); 
            return;
        }

        const meetsAllRequirements = await this.checkRequirements();

        if (gameState.isActivating) {
            activateButton.style.display = 'block';
            activateButton.disabled = true;
            activateButton.innerHTML = '<div class="loader inline-block"></div> WAITING FOR ORACLE...';
            return;
        }

        const amount = parseFloat(commitInput.value) || 0;
        let amountWei = 0n;
        try {
            if (amount > 0) amountWei = ethers.parseEther(amount.toString());
        } catch (e) { /* ignore */ }

        if (amountWei > 0n && amountWei > State.currentUserBalance) {
            buyBkcButton.style.display = 'block';
            buyBkcButton.innerHTML = 'INSUFFICIENT $BKC - CLICK TO BUY';
        } else if (amountWei === 0n && State.currentUserBalance === 0n) {
            buyBkcButton.style.display = 'block';
            buyBkcButton.innerHTML = 'BUY $BKC TO START';
        } else {
            activateButton.style.display = 'block';
            activateButton.innerHTML = 'ACTIVATE PURCHASE & MINE';
            activateButton.disabled = !meetsAllRequirements || amountWei === 0n;
        }
    }
};