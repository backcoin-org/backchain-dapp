// pages/FortunePool.js
import { State } from '../state.js';
import { loadUserData } from '../modules/data.js';
import { formatBigNumber, formatAddress, formatPStake } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';
import { safeContractCall } from '../modules/data.js';

const ethers = window.ethers;

// ============================================
// I. GAMIFICATION & GAME STATE
// ============================================

const gameState = {
    currentLevel: 1,
    currentXP: 0,
    xpPerLevel: 1000,
    totalActivations: 0, 
    achievements: [
        { id: 'first-activation', name: 'The Miner', desc: 'Complete your first 10 activations.', unlocked: false, requirement: 10 },
        { id: 'hundred-activations', name: 'The Veteran', desc: 'Complete 100 total activations.', unlocked: false, requirement: 100 },
        { id: 'bonus-master', name: 'Bonus Master', desc: 'Unlock the x100 Bonus.', unlocked: false, requirement: 100 },
    ],
    poolBalance: 0n,
    isActivating: false, 
    lastBonus: 0,
    // Tracking the last game
    lastGame: {
        id: 0,
        amount: 0n,
        prize: 0n,
        rolls: [0, 0, 0]
    }
};

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
 * Loads the balance of the Prize Pool (FortunePool)
 */
async function loadPoolBalance() {
    if (!State.actionsManagerContractPublic) return;
    try {
        const balance = await safeContractCall(
            State.actionsManagerContractPublic,
            'prizePoolBalance',
            [], 
            0n
        );
        gameState.poolBalance = balance;
        FortunePoolPage.updatePoolDisplay();
    } catch (e) {
        console.error("Failed to load pool balance:", e);
    }
}


/**
 * Called by the EVENT LISTENER when the 'GameFulfilled' event is received.
 */
function handleGameFulfilled(gameId, user, prizeWon, rolls) {
    if (user.toLowerCase() !== State.userAddress.toLowerCase()) {
        return;
    }
    
    console.log(`[FortunePool] Received Oracle result for Game ${gameId}: Won ${prizeWon}`);
    
    // We assume the prize is correct as sent by the Oracle/Contract.
    // Multiplier inference logic removed as it's unreliable and against the new architecture.
    const highestMultiplier = prizeWon > 0n ? 1 : 0; 

    // UPDATE LAST GAME STATE
    gameState.lastGame = {
        id: Number(gameId),
        amount: gameState.lastGame.amount, 
        prize: prizeWon,
        rolls: rolls.map(r => Number(r))
    };

    const prizeData = {
        totalPrizeWon: prizeWon,
        highestMultiplier: highestMultiplier, // Used only for success/fail display logic
        rolls: rolls 
    };

    runActivationSequence(prizeData);
}

// ============================================
// IV. ACTIVATION ANIMATIONS
// ============================================

async function runActivationSequence(prizeData) {
    const activationArea = document.getElementById('activationArea');
    const activationCore = document.getElementById('activationCore');
    const resultDisplay = document.getElementById('resultDisplay');
    
    if (!activationArea || !activationCore || !resultDisplay) return;

    // 1. Start Animation
    resultDisplay.innerHTML = `<h3>ORACLE IS PROCESSING...</h3>`;
    resultDisplay.classList.remove('win', 'lose');
    activationCore.classList.add('activating'); 
    
    await new Promise(resolve => setTimeout(resolve, 3000)); 

    // 2. Stop Animation
    activationCore.classList.remove('activating');

    // 3. Show Result
    const totalPrizeWonFloat = formatBigNumber(prizeData.totalPrizeWon);
    
    FortunePoolPage.updateLastGamePanel();

    if (prizeData.totalPrizeWon > 0n) {
        resultDisplay.classList.add('win');
        // MESSAGE CLEANUP: Reflects reward transfer, not 'bonus unlock'
        resultDisplay.innerHTML = `<h3>🎉 REWARD RECEIVED! You won ${totalPrizeWonFloat.toLocaleString('en-US', { maximumFractionDigits: 2 })} $BKC!</h3>`;
        activationCore.classList.add('win-pulse');
    } else {
        resultDisplay.classList.add('lose');
        resultDisplay.innerHTML = `<h3>Purchase Registered. No Reward This Time.</h3>`;
        activationCore.classList.add('lose-pulse');
    }

    await new Promise(resolve => setTimeout(resolve, 2500)); 
    activationCore.classList.remove('win-pulse', 'lose-pulse');
    resultDisplay.classList.remove('win', 'lose');
    resultDisplay.innerHTML = `<h3>Ready to Activate</h3>`;

    // 4. Final Feedback (Toast and Gamification)
    if (prizeData.totalPrizeWon > 0n) {
        showToast(`ORACLE RESULT: You received ${totalPrizeWonFloat.toLocaleString('en-US', { maximumFractionDigits: 2 })} BKC reward.`, 'success');
    } else {
        showToast('ORACLE RESULT: Purchase registered. Better luck next time!', 'info');
    }
    
    // 5. Update State
    gameState.isActivating = false;
    FortunePoolPage.updateUIState();
    gameState.totalActivations++;
    FortunePoolPage.addXP(100);
    FortunePoolPage.checkAchievements(totalPrizeWonFloat, prizeData.highestMultiplier);
    await loadUserData(); 
    await loadPoolBalance(); 
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
        showToast(`Insufficient native balance. You need at least ${ethers.formatEther(oracleFeeWei)} ETH/BNB to pay the oracle gas fee.`, "error");
        return;
    }


    gameState.isActivating = true;
    if (activateButton) {
        activateButton.disabled = true;
        activateButton.innerHTML = '<div class="loader inline-block"></div> ACTIVATING PURCHASE...'; 
    }

    try {
        // 1. pStake Verification
        const [ignoredFee, pStakeReq] = await safeContractCall(
            State.ecosystemManagerContract, 
            'getServiceRequirements', 
            ["FORTUNE_POOL_SERVICE"],
            [0n, 0n]
        );
        if (State.userTotalPStake < pStakeReq) {
            throw new Error(`PStake requirement failed validation. Required: ${formatPStake(pStakeReq)}`);
        }
        
        // 2. Aprovação
        showToast(`Approving ${amount.toFixed(2)} $BKC for activation...`, "info");
        const approveTx = await State.bkcTokenContract.approve(addresses.actionsManager, amountWei);
        await approveTx.wait();
        showToast('Approval successful! Requesting game...', "success");
        
        // 3. Executa a função 'participate' (Tx 1)
        const playTx = await State.actionsManagerContract.participate(
            amountWei, 
            { value: oracleFeeWei }
        );
        
        // **UPDATE LAST GAME STATE AFTER REQUEST (BEFORE ORACLE RESPONSE)**
        gameState.lastGame.amount = amountWei; // Store the committed amount
        gameState.lastGame.id = 0; 
        gameState.lastGame.prize = 0n;
        gameState.lastGame.rolls = [0, 0, 0];
        FortunePoolPage.updateLastGamePanel(true);
        
        // Start "processing" animation
        const activationCore = document.getElementById('activationCore');
        const resultDisplay = document.getElementById('resultDisplay');
        if (activationCore) activationCore.classList.add('activating');
        if (resultDisplay) resultDisplay.innerHTML = `<h3>REQUESTING ORACLE...</h3>`;

        await playTx.wait();
        
        // 4. Sucesso da Tx 1
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
            errorMessage = "Invalid Oracle Fee. Please refresh the page.";
        }
        showToast(`Activation Failed: ${errorMessage}`, "error");
        stopActivationOnError(); // Reset UI
    } 
}


// ============================================
// VI. PAGE COMPONENT EXPORT
// ============================================

export const FortunePoolPage = {
    
    render(isActive) {
        if (!isActive) return;

        const pageContainer = document.getElementById('actions');
        if (!pageContainer) {
            console.error("Page container 'actions' not found.");
            return;
        }

        // HTML base (only if not already rendered)
        if (!pageContainer.querySelector('.fortune-pool-wrapper')) {
            pageContainer.innerHTML = this.getHtmlContent();
            this.initializeEventListeners();
        }
        
        this.loadPoolBalance();
        this.updateUIState();
        this.updateLastGamePanel(); // Ensures the history panel is rendered
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
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <span class="progress-text" id="progressText">${gameState.currentXP} / ${gameState.xpPerLevel} XP</span>
                    </div>

                    <div class="pools-info">
                        <div class="pool-item" title="Chance de 3x, 10x, ou 100x" style="grid-column: span 3; background: rgba(0, 163, 255, 0.05); border-color: var(--tiger-accent-blue);">
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
                        <h3>Ready to Activate</h3>
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

                <div class="modal" id="rulesModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>📋 HOW IT WORKS (V3 ORACLE)</h2>
                            <button class="modal-close" onclick="document.getElementById('rulesModal').classList.remove('active')">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="rules-content">
                                <h3>Proof of Purchase (PoP) Mining</h3>
                                <p>This is the BKC Reward Generator. It is not a game of chance, but a <strong>mining system</strong>. Each "Activation" is a <strong>purchase</strong> (PoP) that contributes to the system's stability. 90% of your committed amount is processed by the PoP system, generating $BKC rewards for the network and a $BKC bonus (PoP mining) for the prize pool.</p>
                                
                                <h3>Asynchronous Oracle Game</h3>
                                <p>To ensure fair and secure randomness, this game uses a 2-step process:</p>
                                <p><strong>Step 1 (You Pay):</strong> You pay the $BKC amount and a small native gas fee (ETH/BNB) to request a game. Your request is logged on-chain.</p>
                                <p><strong>Step 2 (Oracle Pays):</strong> Our secure backend Oracle (indexer) sees your request, generates a random number, and sends it back to the contract. This triggers the prize calculation and pays out any winnings instantly to your wallet. (Est. 1-2 minutes)</p>
                                
                                <h3>Bonus Reward Tiers</h3>
                                <p>Your game request has a chance to unlock an instant bonus from the **single prize pool**. The system automatically pays out the <strong>highest bonus tier</strong> you unlock:</p>
                                
                                <p><strong>Tier 1 (3x):</strong> 1 in 3 chance (33.3%)</p>
                                <p><strong>Tier 2 (10x):</strong> 1 in 10 chance (10%)</p>
                                <p><strong>Tier 3 (100x):</strong> 1 in 100 chance (1%)</p>
                                <p><em>(Note: Tiers are examples and set by the contract owner)</em></p>
                                
                                <h3>pStake Requirement</h3>
                                <p>You must have sufficient pStake (delegated $BKC$) to participate.</p>
                            </div>
                        </div>
                    </div>
                </div>

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
                if(swapLink === '#') {
                    showToast("Buy link is not configured.", "error");
                    return;
                }
                if (swapLink.startsWith('#')) {
                    window.location.hash = swapLink; 
                } else {
                    window.open(swapLink, "_blank");
                }
            });
        }

        if (achievementsBtn) {
            achievementsBtn.addEventListener('click', () => this.showAchievements());
        }
        if (rulesBtn) {
            rulesBtn.addEventListener('click', () => this.showRules());
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
    
    loadPoolBalance, 

    updatePoolDisplay() {
        const totalPool = document.getElementById('totalPool');
        if (totalPool) totalPool.textContent = formatBigNumber(gameState.poolBalance || 0n).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' $BKC';
    },
    
    /**
     * Handles the Oracle result
     */
    handleGameFulfilled,

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
        
        let meetsPStake = false;
        let meetsOracleFee = false;
        
        try {
            // 1. Check pStake
            const [ignoredFee, pStakeReq] = await safeContractCall( 
                State.ecosystemManagerContract, 
                'getServiceRequirements', 
                ["FORTUNE_POOL_SERVICE"], 
                [0n, 0n]
            );
            meetsPStake = State.userTotalPStake >= pStakeReq;
            
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
            
            // 2. Check Oracle Fee
            const oracleFeeWei = State.systemData.oracleFeeInWei ? BigInt(State.systemData.oracleFeeInWei) : 0n;
            meetsOracleFee = State.currentUserNativeBalance >= oracleFeeWei;
            
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
            
            return (meetsPStake && meetsOracleFee); // Returns the general status

        } catch (e) {
            pstakeStatusEl.innerHTML = '<span class="status-icon error">⚠️</span> Error Check';
            oracleFeeStatusEl.innerHTML = '<span class="status-icon error">⚠️</span> Error Check';
            return false;
        }
    },

    // Renders the last activation/rolls panel
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
             headerText = `PENDING GAME #${id || '...'}`;
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

        // Add panel styles (for the CSS file)
        panel.style.cssText = `
            background: var(--tiger-bg-secondary);
            border: 1px solid var(--tiger-border-color);
            border-radius: 12px;
            padding: 16px;
            margin-top: 16px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;
        
        // Specific styles for the Rolls panel
        const rollsContainer = panel.querySelector('.rolls-container');
        if (rollsContainer) {
             rollsContainer.style.cssText = `
                 display: flex;
                 justify-content: space-between;
                 margin-top: 12px;
                 padding-top: 12px;
                 border-top: 1px solid var(--tiger-border-color);
                 font-size: 13px;
             `;
        }
        
        const rollsDisplay = panel.querySelector('.rolls-display');
        if (rollsDisplay) {
            rollsDisplay.style.cssText = `
                display: flex;
                gap: 8px;
            `;
        }

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

    // ... (Gamification functions maintained) ...

    async updateUIState() {
        const activateButton = document.getElementById('activateButton');
        const buyBkcButton = document.getElementById('buyBkcButton');
        const commitInput = document.getElementById('commitInput');
        
        if (!activateButton || !buyBkcButton || !commitInput) return;

        // Hide both buttons by default
        activateButton.style.display = 'none';
        buyBkcButton.style.display = 'none';

        if (!State.isConnected) {
            activateButton.style.display = 'block';
            activateButton.disabled = true;
            activateButton.innerHTML = 'CONNECT WALLET';
            this.checkRequirements(); // Update status even when disconnected
            return;
        }

        // Check all requirements (pStake AND oracle fee) first
        const meetsAllRequirements = await this.checkRequirements();

        if (gameState.isActivating) {
            activateButton.style.display = 'block';
            activateButton.disabled = true;
            activateButton.innerHTML = '<div class="loader inline-block"></div> WAITING FOR ORACLE...';
            return;
        }

        // If connected and not activating, check balances
        const amount = parseFloat(commitInput.value) || 0;
        let amountWei = 0n;
        try {
            if (amount > 0) amountWei = ethers.parseEther(amount.toString());
        } catch (e) { /* ignore parse error */ }

        if (amountWei > 0n && amountWei > State.currentUserBalance) {
            // Case 1: Entered value is GREATER than balance
            buyBkcButton.style.display = 'block';
            buyBkcButton.innerHTML = 'INSUFFICIENT $BKC - CLICK TO BUY';
        } else if (amountWei === 0n && State.currentUserBalance === 0n) {
            // Case 2: Entered nothing AND has zero balance
            buyBkcButton.style.display = 'block';
            buyBkcButton.innerHTML = 'BUY $BKC TO START';
        } else {
            // Case 3: Has sufficient balance (or entered nothing but has balance)
            activateButton.style.display = 'block';
            activateButton.innerHTML = 'ACTIVATE PURCHASE & MINE';
            // Disable if requirements (pStake/Fee) are not met OR if amount is 0
            activateButton.disabled = !meetsAllRequirements || amountWei === 0n;
        }
    }
};