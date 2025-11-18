// pages/DashboardPage.js
const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import {
    loadUserData,
    calculateUserTotalRewards,
    getHighestBoosterBoostFromAPI,
    loadPublicData,
    safeContractCall,
    calculateClaimDetails,
    API_ENDPOINTS
} from '../modules/data.js';
import { executeUniversalClaim, executeUnstake, executeForceUnstake, executeDelegation } from '../modules/transactions.js';
import {
    formatBigNumber, formatAddress, formatPStake, renderLoading,
    renderNoData, ipfsGateway, renderPaginatedList, renderError
} from '../utils.js';
import { startCountdownTimers, openModal, showToast, addNftToWallet, closeModal } from '../ui-feedback.js';
import { addresses, boosterTiers } from '../config.js';

// --- ESTADO LOCAL E CONSTANTES ---
let activityCurrentPage = 1;
const EXPLORER_BASE_URL = "https://sepolia.etherscan.io/tx/"; // Ajuste conforme sua rede (Amoy/Polygon)

let tabsState = {
    delegationsLoaded: false,
};

// --- ANIMAÇÃO DE RECOMPENSAS ---
let animationFrameId = null;
let targetRewardValue = 0n;
let displayedRewardValue = 0n;

function animateClaimableRewards() {
    const rewardsEl = document.getElementById('statUserRewards');
    if (!rewardsEl || !State.isConnected) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }

    const difference = targetRewardValue - displayedRewardValue;
    // Tolerância para Wei
    if (difference > -1000000000000n && difference < 1000000000000n) { 
        if (displayedRewardValue !== targetRewardValue) {
             displayedRewardValue = targetRewardValue;
        }
    } else if (difference !== 0n) {
        const movement = difference / 10n; // Suavização
        displayedRewardValue += (movement === 0n && difference !== 0n) ? (difference > 0n ? 1n : -1n) : movement;
    }

    if (displayedRewardValue < 0n) displayedRewardValue = 0n;

    rewardsEl.innerHTML = `${formatBigNumber(displayedRewardValue).toFixed(4)} <span class="text-xl">$BKC</span>`;
    
    if (displayedRewardValue !== targetRewardValue) {
        animationFrameId = requestAnimationFrame(animateClaimableRewards);
    } else {
        animationFrameId = null;
    }
}

function startRewardAnimation(initialTargetValue) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    targetRewardValue = initialTargetValue;
    if (displayedRewardValue === 0n && targetRewardValue > 0n) {
         displayedRewardValue = (targetRewardValue * 90n) / 100n; // Começa perto para efeito visual rápido
    }
    animateClaimableRewards();
}

// --- LÓGICA DE MODAIS ---

// Modal de Delegação Global (Sem selecionar validador específico)
async function openDelegateModal() {
    if (!State.isConnected) return showToast("Please connect your wallet first.", "error");
    
    const balanceNum = formatBigNumber(State.currentUserBalance || 0n);
    const balanceLocaleString = balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

    const content = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white">Delegate to Protocol</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-4 flex items-center gap-3">
            <i class="fa-solid fa-layer-group text-amber-500 text-2xl"></i>
            <div>
                <p class="text-sm text-zinc-400">Pool</p>
                <p class="font-bold text-white">Global Consensus Pool</p>
            </div>
        </div>
        <p class="text-sm text-zinc-400 mb-4">Your balance: <span class="font-bold text-white">${balanceLocaleString} $BKC</span></p>
        
        <div class="mb-4">
            <label for="delegateAmountInput" class="block text-sm font-medium text-zinc-300 mb-1">Amount to Delegate ($BKC)</label>
            <input type="number" id="delegateAmountInput" placeholder="0.00" step="any" min="0" class="form-input w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:outline-none focus:border-amber-500 transition-colors">
            <div class="flex gap-2 mt-2">
                <button class="flex-1 bg-zinc-700 hover:bg-zinc-600 text-xs py-1.5 rounded set-delegate-perc transition-colors" data-perc="25">25%</button>
                <button class="flex-1 bg-zinc-700 hover:bg-zinc-600 text-xs py-1.5 rounded set-delegate-perc transition-colors" data-perc="50">50%</button>
                <button class="flex-1 bg-zinc-700 hover:bg-zinc-600 text-xs py-1.5 rounded set-delegate-perc transition-colors" data-perc="75">75%</button>
                <button class="flex-1 bg-zinc-700 hover:bg-zinc-600 text-xs py-1.5 rounded set-delegate-perc transition-colors" data-perc="100">Max</button>
            </div>
        </div>

        <div class="mb-6">
            <label for="delegateDurationSlider" class="block text-sm font-medium text-zinc-300 mb-1">Lock Duration: <span id="delegateDurationDisplay" class="font-bold text-amber-400">365 days</span></label>
            <input type="range" id="delegateDurationSlider" min="1" max="3650" value="365" class="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2">
            <div class="flex justify-between text-xs text-zinc-500 mt-2">
                <span>1 day</span>
                <span>10 years</span>
            </div>
        </div>

        <div class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-sm mb-6 space-y-2">
            <div class="flex justify-between"><span class="text-zinc-400">Amount:</span><span id="delegateNetAmount" class="font-mono text-white">0.0000 $BKC</span></div>
            <div class="flex justify-between border-t border-zinc-700 pt-2"><span class="text-zinc-400">Projected pStake:</span><span id="delegateEstimatedPStake" class="font-bold text-purple-400 font-mono">0</span></div>
            <p class="text-xs text-zinc-500 mt-1 italic">* Higher duration yields higher pStake and voting power.</p>
        </div>

        <button id="confirmDelegateBtn" class="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-4 rounded-lg transition-all btn-disabled shadow-lg hover:shadow-amber-500/20" disabled>
            Confirm Delegation
        </button>
    `;
    openModal(content);

    const amountInput = document.getElementById('delegateAmountInput');
    const durationSlider = document.getElementById('delegateDurationSlider');
    const durationDisplay = document.getElementById('delegateDurationDisplay');
    const netAmountEl = document.getElementById('delegateNetAmount');
    const pStakeEl = document.getElementById('delegateEstimatedPStake');
    const confirmBtn = document.getElementById('confirmDelegateBtn');

    function updateDelegatePreview() {
        const amountStr = amountInput.value || "0";
        const durationDays = parseInt(durationSlider.value, 10);
        let amount = 0n;

        try {
            amount = ethers.parseUnits(amountStr, 18);
            if (amount < 0n) amount = 0n;
        } catch { amount = 0n; }

        const balanceBigInt = State.currentUserBalance || 0n;
        
        if (amount > 0n && amount <= balanceBigInt) {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('btn-disabled', 'opacity-50', 'cursor-not-allowed');
            amountInput.classList.remove('border-red-500', 'focus:border-red-500');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('btn-disabled', 'opacity-50', 'cursor-not-allowed');
            if(amount > balanceBigInt) amountInput.classList.add('border-red-500', 'focus:border-red-500');
        }

        durationDisplay.textContent = `${durationDays} days`;
        netAmountEl.textContent = `${formatBigNumber(amount).toFixed(4)} $BKC`;

        // pStake = (Amount * Duration) / 10^18
        const pStake = (amount * BigInt(durationDays)) / (10n ** 18n);
        pStakeEl.textContent = formatPStake(pStake);
    }

    amountInput.addEventListener('input', updateDelegatePreview);
    durationSlider.addEventListener('input', updateDelegatePreview);
    
    document.querySelectorAll('.set-delegate-perc').forEach(btn => {
        btn.addEventListener('click', () => {
            const perc = parseInt(btn.dataset.perc, 10);
            const balanceBigInt = State.currentUserBalance || 0n;
            const newAmount = (balanceBigInt * BigInt(perc)) / 100n;
            amountInput.value = ethers.formatUnits(newAmount, 18);
            updateDelegatePreview();
        });
    });

    confirmBtn.addEventListener('click', async () => {
        const amountStr = amountInput.value || "0";
        const durationDays = parseInt(durationSlider.value, 10);
        const durationSeconds = durationDays * 24 * 60 * 60;
        let totalAmountWei = 0n;

        try {
            totalAmountWei = ethers.parseUnits(amountStr, 18);
            const balanceBigInt = State.currentUserBalance || 0n;
            if (totalAmountWei <= 0n || totalAmountWei > balanceBigInt) {
                showToast("Invalid or insufficient amount.", "error"); return;
            }
            
            const originalBtnText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<div class="loader inline-block mr-2"></div> Processing...';
            confirmBtn.disabled = true;

            // CHAMADA ATUALIZADA: Não passa mais validador. Apenas Amount, Duration e BoosterID (0 aqui)
            // Assumindo que executeDelegation em transactions.js foi atualizado ou aceita null
            // Como o contrato DelegationManager.delegate(amount, duration, boosterId) tem 3 args:
            const success = await executeDelegation(totalAmountWei, durationSeconds, 0, confirmBtn);
            
            if (success) {
                closeModal();
                showToast("Delegation successful!", "success");
                await DashboardPage.render(true);
            } else {
                confirmBtn.innerHTML = originalBtnText;
                confirmBtn.disabled = false;
            }
        } catch (err) {
            console.error("Error processing delegation data:", err);
            const message = err.reason || err.data?.message || err.message || 'Transaction rejected.';
            showToast(`Delegation Error: ${message}`, "error");
            confirmBtn.innerHTML = 'Confirm Delegation';
            confirmBtn.disabled = false;
        }
    });
    updateDelegatePreview();
}

// --- LISTENERS ---

function setupActivityTabListeners() {
    const tabsContainer = document.getElementById('user-activity-tabs');
    if (!tabsContainer || tabsContainer._listenersAttached) return;

    tabsContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('.tab-btn');
        if (!button) return;
        const targetId = button.dataset.target;

        document.querySelectorAll('#user-activity-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('#user-activity-content .tab-content').forEach(content => {
            content.classList.add('hidden'); 
            content.classList.remove('active');
        });

        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.remove('hidden'); 
            targetContent.classList.add('active');
        }

        try {
            if (targetId === 'tab-delegations' && !tabsState.delegationsLoaded) {
                await renderMyDelegations(); 
                tabsState.delegationsLoaded = true;
            } 
        } catch (error) {
            console.error(`Error loading tab content ${targetId}:`, error);
            if(targetContent) renderError(targetContent, `Failed to load content.`);
        }
    });
    tabsContainer._listenersAttached = true;
}

function setupDashboardActionListeners() {
    const dashboardElement = DOMElements.dashboard;
    if (!dashboardElement) { return; }
    if (dashboardElement._actionListenersAttached) return;

    dashboardElement.addEventListener('click', async (e) => {
        const target = e.target.closest('button, a, img');
        if (!target) return;

        const needsPrevent = ['dashboardClaimBtn', 'unstake-btn', 'force-unstake-btn', 'delegate-link', 'go-to-store', 'nft-clickable-image', 'go-to-rewards'];
        if (needsPrevent.some(cls => target.id === cls || target.classList.contains(cls))) {
            e.preventDefault();
        }

        try {
            if (target.id === 'dashboardClaimBtn') {
                const btn = target;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<div class="loader inline-block mr-1"></div> Claiming...';
                btn.disabled = true;

                try {
                    const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
                    if (stakingRewards === 0n && minerRewards === 0n) {
                         showToast("No rewards to claim.", "info");
                         return;
                    }
                    const success = await executeUniversalClaim(stakingRewards, minerRewards, btn);
                    if (success) {
                        startRewardAnimation(0n);
                        await DashboardPage.render(true);
                        showToast("Rewards claimed successfully!", "success");
                    }
                } catch (e) {
                     console.error("Claim error:", e);
                     showToast("Failed to claim.", "error");
                } finally {
                    if(!btn.disabled) { 
                         btn.innerHTML = originalText;
                         btn.disabled = false;
                    }
                }

            } else if (target.classList.contains('unstake-btn')) {
                const index = target.dataset.index;
                const success = await executeUnstake(Number(index));
                if (success) await DashboardPage.render(true);

            } else if (target.classList.contains('force-unstake-btn')) {
                const index = target.dataset.index;
                const success = await executeForceUnstake(Number(index)); 
                if (success) await DashboardPage.render(true);

            } else if (target.classList.contains('delegate-link')) {
                // Agora abre o modal genérico, ignorando validador específico
                await openDelegateModal();

            } else if (target.classList.contains('go-to-store')) {
                if (typeof window.navigateToPage === 'function') window.navigateToPage('store');
                else document.querySelector('.sidebar-link[data-target="store"]')?.click();

            } else if (target.classList.contains('nft-clickable-image')) {
                const address = target.dataset.address;
                const tokenId = target.dataset.tokenid;
                if (address && tokenId) addNftToWallet(address, tokenId);

            } else if (target.classList.contains('go-to-rewards')) {
                if (typeof window.navigateToPage === 'function') window.navigateToPage('rewards');
                else document.querySelector('.sidebar-link[data-target="rewards"]')?.click();
            }
        } catch (error) {
             console.error("Error handling dashboard action:", error);
             showToast("Action failed.", "error");
        }
    });
    dashboardElement._actionListenersAttached = true;
}


// --- RENDERIZADORES ---

async function renderRewardEfficiencyPanel(efficiencyData) {
    const el = document.getElementById('reward-efficiency-panel');
    if (!el) return;

    try {
        const { totalRewards } = await calculateUserTotalRewards();

        if (!efficiencyData || efficiencyData.highestBoost === 0) {
            el.innerHTML = `
                <div class="bg-main border border-border-color rounded-xl p-5 text-center flex flex-col items-center">
                    <i class="fa-solid fa-rocket text-5xl text-amber-400 mb-3 animate-pulse"></i>
                    <p class="font-bold text-2xl text-white mb-2">Boost Your Earnings!</p>
                    <p class="text-md text-zinc-400 max-w-sm mb-4">Acquire a <strong>Booster NFT</strong> to increase your reward claim rate and reduce ecosystem fees!</p>
                    ${totalRewards > 0n ?
                        `<p class="text-sm text-zinc-400 mt-3">You are claiming rewards at the base rate.</p>`
                        : '<p class="text-sm text-zinc-400 mt-3">Start delegating and get a Booster NFT!</p>'
                    }
                    <button class="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-900 font-bold py-2.5 px-6 rounded-lg text-lg mt-6 shadow-lg hover:shadow-xl transition-all go-to-store w-full">
                        <i class="fa-solid fa-store mr-2"></i> Get Your Booster!
                    </button>
                </div>`;
            return;
        }

        const boostPercent = efficiencyData.highestBoost / 100;
        let subText = `This NFT provides a <strong>+${boostPercent}%</strong> discount on fees.`;
        const boosterAddress = State.rewardBoosterContract?.target || addresses.rewardBoosterNFT;

        el.innerHTML = `
            <div class="bg-main border border-border-color rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
                <img src="${efficiencyData.imageUrl || './assets/bkc_logo_3d.png'}" 
                     alt="${efficiencyData.boostName}" 
                     class="w-20 h-20 rounded-md object-cover border border-zinc-700 nft-clickable-image cursor-pointer" 
                     onerror="this.src='./assets/placeholder_nft.png'"
                     data-address="${boosterAddress}" 
                     data-tokenid="${efficiencyData.tokenId || ''}">
                <div class="flex-1 text-center sm:text-left">
                    <p class="font-bold text-lg text-white">${efficiencyData.boostName}</p>
                    <p class="text-2xl font-bold text-green-400 mt-1">+${boostPercent}% Discount</p>
                    <p class="text-sm text-zinc-400">${subText}</p>
                </div>
            </div>`;
    } catch (error) {
        console.error("Error rendering reward efficiency:", error);
        renderError(el, "Error loading status.");
    }
}

// MODIFICADO: Renderiza o Pool Global em vez de lista de validadores
function renderValidatorsList() {
    const listEl = document.getElementById('top-validators-list');
    if (!listEl) return;

    const minBalanceToShowBuy = ethers.parseEther("10"); 
    
    // Estado de Saldo Baixo
    if (State.isConnected && State.currentUserBalance < minBalanceToShowBuy) {
        const buyBkcLink = addresses.bkcDexPoolAddress || '#'; 
        listEl.innerHTML = `
            <div class="col-span-1">
                <div class="text-center p-6 border border-red-500/50 bg-red-500/10 rounded-lg space-y-3">
                    <i class="fa-solid fa-circle-exclamation text-3xl text-red-400"></i>
                    <h3 class="lg font-bold text-white">Insufficient Balance</h3>
                    <p class="text-sm text-zinc-300">You need $BKC to delegate.</p>
                    <a href="${buyBkcLink}" target="_blank" rel="noopener noreferrer" class="inline-block bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2.5 px-6 rounded-lg text-sm mt-3">
                        <i class="fa-solid fa-shopping-cart mr-2"></i> Buy $BKC
                    </a>
                </div>
            </div>
        `;
        return; 
    }
    
    // Estado Normal: Mostrar o Pool Global
    const totalStaked = State.totalNetworkPStake || 0n;

    listEl.innerHTML = `
        <div class="bg-main border border-border-color rounded-xl p-5 flex flex-col h-full hover:shadow-lg transition-shadow relative overflow-hidden group">
             <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i class="fa-solid fa-globe text-9xl text-purple-500"></i>
             </div>
             <div class="flex items-center justify-between border-b border-border-color/50 pb-3 mb-3 relative z-10">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="bg-purple-900/30 p-2 rounded-lg">
                        <i class="fa-solid fa-layer-group text-xl text-purple-400"></i>
                    </div>
                    <div>
                        <p class="font-bold text-white">Global Consensus Pool</p>
                        <p class="text-xs text-zinc-500">Official Protocol Staking</p>
                    </div>
                </div>
                <span class="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded border border-green-500/20">Active</span>
            </div>
            
            <div class="text-center py-4 bg-zinc-900/50 rounded-lg mb-4 relative z-10 border border-white/5">
                <p class="text-zinc-400 text-sm">Total Network pStake</p>
                <p class="text-3xl font-bold text-purple-400 mt-1">${formatPStake(totalStaked)}</p>
            </div>

            <div class="text-sm text-zinc-400 mb-5 relative z-10">
                <p><i class="fa-solid fa-check text-green-400 mr-2"></i> Earn rewards from Ecosystem Fees</p>
                <p class="mt-1"><i class="fa-solid fa-check text-green-400 mr-2"></i> Participate in Governance</p>
            </div>

            <button class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-4 rounded-md transition-colors w-full mt-auto text-center delegate-link relative z-10 ${!State.isConnected ? 'btn-disabled' : ''}" ${!State.isConnected ? 'disabled' : ''}>
                <i class="fa-solid fa-coins mr-2"></i> Delegate Now
            </button>
        </div>`;
}

async function renderMyDelegations() {
    const listEl = document.getElementById('my-delegations-list');
    if (!listEl) return;
    if (!State.isConnected) { renderNoData(listEl, "Connect your wallet to view delegations."); return; }

    renderLoading(listEl);
    try {
        // Contrato DelegationManager.getDelegationsOf retorna struct: {amount, unlockTime, lockDuration}
        // NÃO EXISTE MAIS O CAMPO VALIDATOR
        const delegationsRaw = await safeContractCall(State.delegationManagerContract, 'getDelegationsOf', [State.userAddress], []);
        
        State.userDelegations = delegationsRaw.map((d, index) => ({
            amount: d[0], // amount
            unlockTime: d[1], // unlockTime
            lockDuration: d[2], // lockDuration
            index: index
        }));
        
        const delegations = State.userDelegations;

        if (!delegations || delegations.length === 0) { renderNoData(listEl, "You have no active delegations."); return; }
        
        const forceUnstakePenaltyBips = await safeContractCall(State.ecosystemManagerContract, 'getFee', ["FORCE_UNSTAKE_PENALTY_BIPS"], 5000n);
        const unstakeFeeBips = await safeContractCall(State.ecosystemManagerContract, 'getFee', ["UNSTAKE_FEE_BIPS"], 100n);

        const html = delegations.map((d) => {
            const amount = d.amount;
            const amountFormatted = formatBigNumber(amount);
            let pStake = 0n;
            const lockDurationBigInt = BigInt(d.lockDuration);
            const amountBigInt = BigInt(d.amount);
            const ONE_DAY_SECONDS = 86400n;
            const ETHER_DIVISOR = 10n**18n;

            if (lockDurationBigInt > 0n && amountBigInt > 0n) {
                // pStake = (Amount in Ether) * (Duration in Days)
                pStake = (amountBigInt * (lockDurationBigInt / ONE_DAY_SECONDS)) / ETHER_DIVISOR;
            }

            const unlockTimestamp = Number(d.unlockTime);
            const nowSeconds = Math.floor(Date.now() / 1000);
            const isLocked = unlockTimestamp > nowSeconds;
            
            const penaltyPercent = (Number(forceUnstakePenaltyBips) / 100).toFixed(2);
            const penaltyAmount = formatBigNumber((amountBigInt * forceUnstakePenaltyBips) / 10000n);
            const feePercent = (Number(unstakeFeeBips) / 100).toFixed(2);
            
            const unlockDate = new Date(unlockTimestamp * 1000);
            const dateString = unlockDate.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
            
            return `
                <div class="bg-main border border-border-color rounded-xl p-4 delegation-card">
                    <div class="flex justify-between items-start gap-4">
                        <div>
                            <p class="text-2xl font-bold text-white">${amountFormatted.toFixed(4)} <span class="text-amber-400">$BKC</span></p>
                            <p class="text-sm text-zinc-400">Pool: <span class="font-mono text-white">Global Pool</span></p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-xl text-purple-400">${formatPStake(pStake)}</p> 
                            <p class="text-sm text-zinc-400">pStake</p>
                        </div>
                    </div>
                    <div class="bg-sidebar/50 border border-border-color rounded-lg p-3 mt-4">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div class="text-sm">
                                <p class="text-zinc-400">${isLocked ? 'Unlocks In:' : 'Status:'}</p>
                                <div class="countdown-timer text-lg font-mono text-white" data-unlock-time="${unlockTimestamp}" data-index="${d.index}">
                                    ${isLocked ? '<div class="loader !w-4 !h-4 inline-block mr-1"></div>' : '<span class="text-green-400 font-bold"><i class="fa-solid fa-check-circle"></i> Unlocked</span>'}
                                </div>
                                <p class="text-xs text-zinc-500">${dateString}</p>
                            </div>
                            <div class="flex gap-2 w-full sm:w-auto justify-end">
                                ${isLocked 
                                    ? `<button title="Force unstake (Penalty: ${penaltyPercent}%)" class="bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 font-bold py-2 px-3 rounded-md text-sm force-unstake-btn flex-1 sm:flex-none transition-colors" data-index="${d.index}"><i class="fa-solid fa-lock mr-1"></i> Force</button>` 
                                    : ''}
                                <button class="${isLocked ? 'btn-disabled opacity-50 cursor-not-allowed border border-zinc-700 text-zinc-500' : 'bg-amber-500 hover:bg-amber-600 text-zinc-900'} font-bold py-2 px-3 rounded-md text-sm unstake-btn flex-1 sm:flex-none transition-colors" data-index="${d.index}" ${isLocked ? 'disabled' : ''}>
                                    <i class="fa-solid fa-unlock mr-1"></i> Unstake
                                </button>
                            </div>
                        </div>
                        <div class="delegation-penalty-text mt-2 pt-2 border-t border-border-color/50 text-xs ${isLocked ? 'text-red-400/80' : 'text-green-400'}">
                           ${isLocked ? `<strong>Penalty if Forced:</strong> ${penaltyPercent}% (~${penaltyAmount.toFixed(4)} $BKC).` : `Normal Unstake Fee: ${feePercent}%`}
                        </div>
                    </div>
                </div>`;
        });
        listEl.innerHTML = html.join('');
        const timers = listEl.querySelectorAll('.countdown-timer[data-unlock-time]');
        if (timers.length > 0) startCountdownTimers(Array.from(timers));
    } catch (error) {
        console.error("Error rendering delegations:", error);
        renderError(listEl, "Failed to load delegations.");
    }
}

function renderActivityItem(item) {
    let timestamp;
    if (typeof item.timestamp === 'object' && item.timestamp._seconds) {
        timestamp = Number(item.timestamp._seconds);
    } else {
        timestamp = Number(item.timestamp);
    }

    const date = new Date(timestamp * 1000).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
    const time = new Date(timestamp * 1000).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
    let title = 'Action', icon = 'fa-exchange-alt', color = 'text-zinc-500', details = 'Transaction';
    
    let itemId = null; 
    let itemAmount = 0n;
    try {
        if (item.amount) {
            const amountStr = item.amount.toString();
            itemAmount = amountStr.includes('.') ? ethers.parseEther(amountStr) : BigInt(amountStr);
        }
    } catch (e) {}
    
    const formattedAmount = formatBigNumber(itemAmount).toFixed(2);
    const itemDetails = item.details || {};
    
    switch(item.type) {
        case 'Delegation': 
            title = `Delegation`; icon = 'fa-layer-group'; color = 'text-purple-400'; 
            details = `Delegated ${formattedAmount} to Global Pool`; 
            itemId = itemDetails.index; 
            break;
        case 'BoosterNFT': 
            title = `Booster Acquired`; icon = 'fa-gem'; color = 'text-green-400'; 
            details = `Tier: ${itemDetails.tierName}`; 
            itemId = itemDetails.tokenId; 
            break;
        case 'Unstake': 
            title = `Unstake`; icon = 'fa-unlock'; color = 'text-green-400'; 
            details = `Unstaked ${formattedAmount} $BKC`; 
            if(itemDetails.feePaid && BigInt(itemDetails.feePaid) > 0n) { details += ` (Fee: ${formatBigNumber(BigInt(itemDetails.feePaid)).toFixed(2)})`; }
            itemId = itemDetails.index; 
            break;
        case 'ForceUnstake':
            title = `Forced Unstake`; icon = 'fa-triangle-exclamation'; color = 'text-red-400'; 
            details = `Penalty Paid: ${formatBigNumber(BigInt(itemDetails.feePaid || 0n)).toFixed(2)} $BKC`; 
            itemId = itemDetails.index; 
            break;
        case 'DelegatorRewardClaimed': 
            title = `Rewards Claimed`; icon = 'fa-gift'; color = 'text-amber-400'; 
            details = `Claimed ${formattedAmount} $BKC`; 
            itemId = null; 
            break;
        case 'FortuneGameWin': 
            title = `Fortune Pool Win`; icon = 'fa-trophy'; color = 'text-yellow-400'; 
            details = `Won ${formattedAmount} $BKC`; 
            break;
        case 'GamePlayed': 
            title = `Fortune Pool Play`; icon = 'fa-dice'; color = 'text-zinc-500'; 
            details = `Played ${formatBigNumber(BigInt(itemDetails.wagered || 0n)).toFixed(2)} $BKC`; 
            break;
        case 'NFTBuy':
            title = `Booster Bought (Pool)`; icon = 'fa-shopping-cart'; color = 'text-green-400';
            details = `Bought NFT #${itemDetails.tokenId}`;
            itemId = itemDetails.tokenId;
            break;
        case 'NFTSell':
            title = `Booster Sold (Pool)`; icon = 'fa-dollar-sign'; color = 'text-blue-400';
            details = `Sold NFT #${itemDetails.tokenId}`;
            itemId = itemDetails.tokenId;
            break;
        case 'PublicSaleBuy': 
            title = 'Booster Bought (Store)'; icon = 'fa-shopping-bag'; color = 'text-green-400'; 
            details = `Bought Tier ${itemDetails.tierId} NFT`; 
            itemId = itemDetails.tokenId; 
            break;
        case 'NotaryRegister': 
            title = 'Document Notarized'; icon = 'fa-stamp'; color = 'text-blue-400'; 
            details = `Registered Doc #${itemDetails.tokenId}`; 
            itemId = itemDetails.tokenId; 
            break;
        default:
             title = item.type || 'Unknown Action';
             break;
    }
    
    const txHash = item.txHash;
    const Tag = txHash ? 'a' : 'div';
    const attr = txHash ? `href="${EXPLORER_BASE_URL}${txHash}" target="_blank" rel="noopener noreferrer"` : '';
    
    return `
        <${Tag} ${attr} class="block w-full text-left bg-main border border-border-color rounded-lg p-4 transition-colors ${txHash ? 'hover:bg-zinc-800 cursor-pointer group' : ''} h-full">
            <div class="flex items-center justify-between gap-3 mb-2">
                <div class="flex items-center gap-3 min-w-0">
                    <i class="fa-solid ${icon} ${color} text-xl w-5 flex-shrink-0 text-center"></i>
                    <p class="font-bold text-base text-white truncate">${title}</p>
                </div>
                ${txHash ? `<span class="text-xs text-zinc-500 group-hover:text-blue-400 transition-colors ml-auto"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>` : ''}
            </div>
            <div class="text-sm text-zinc-400 truncate pl-8">
                <p class="text-xs text-zinc-500 mb-1">${date} ${time}</p>
                <p class="text-sm text-zinc-400 truncate">${details}</p>
            </div>
        </${Tag}>
    `;
}

async function renderActivityHistory() {
    const listEl = document.getElementById('activity-history-list-container');
    if (!listEl) return;
    if (!State.isConnected) { renderNoData(listEl, "Connect your wallet to view history."); return; }
    
    renderLoading(listEl);
    try {
        const historyUrl = `${API_ENDPOINTS.getHistory}/${State.userAddress}`;
        const response = await fetch(historyUrl);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const allActivities = await response.json(); 

        if (allActivities.length === 0) {
            renderNoData(listEl, "Your recent activities will appear here.");
        } else {
            renderPaginatedList(
                allActivities, listEl, renderActivityItem, 6, activityCurrentPage,
                (newPage) => { activityCurrentPage = newPage; renderActivityHistory(); },
                'grid grid-cols-1 md:grid-cols-2 gap-4'
            );
        }
    } catch (error) {
        console.error("Error rendering history:", error);
        renderError(listEl, "Failed to load history.");
    }
}

// --- DADOS PÚBLICOS ---

async function loadAndRenderProtocolTVL() {
    const tvlValueEl = document.getElementById('protocol-tvl-value'); 
    const tvlPercEl = document.getElementById('protocol-tvl-percentage'); 
    const statTotalSupplyEl = document.getElementById('statTotalSupply'); 
    const tvlStakingEl = document.getElementById('tvl-detail-staking');
    const tvlGameEl = document.getElementById('tvl-detail-game');
    const tvlPoolEl = document.getElementById('tvl-detail-nftpool');
    
    if (!tvlValueEl) return;
    
    tvlValueEl.innerHTML = '<div class="loader !w-5 !h-5 inline-block"></div>';
    tvlPercEl.textContent = '...';

    try {
        if (!State.bkcTokenContractPublic) throw new Error("Contract not loaded");
        const tokenContract = State.bkcTokenContractPublic;
        
        let stakingLocked = 0n, gameLocked = 0n, poolLocked = 0n;

        // 1. Staking TVL
        if (addresses.delegationManager) {
            stakingLocked = await safeContractCall(tokenContract, 'balanceOf', [addresses.delegationManager], 0n);
        }

        // 2. Game TVL
        if (addresses.fortunePool) {
             gameLocked = await safeContractCall(tokenContract, 'balanceOf', [addresses.fortunePool], 0n);
        }

        // 3. Pools TVL
        if (addresses) {
            const poolKeys = Object.keys(addresses).filter(k => k.startsWith('pool_'));
            for (const key of poolKeys) {
                const poolAddr = addresses[key];
                if(poolAddr) {
                    const bal = await safeContractCall(tokenContract, 'balanceOf', [poolAddr], 0n);
                    poolLocked += bal;
                }
            }
        }

        const totalLocked = stakingLocked + gameLocked + poolLocked;
        const totalSupply = await safeContractCall(tokenContract, 'totalSupply', [], 0n);
        const lockedPercentage = (totalSupply > 0n) ? (Number(totalLocked * 10000n / totalSupply) / 100).toFixed(2) : 0;

        if(statTotalSupplyEl) statTotalSupplyEl.textContent = formatBigNumber(totalSupply).toFixed(0);
        
        tvlValueEl.textContent = `${formatBigNumber(totalLocked).toFixed(0)} $BKC`;
        tvlPercEl.textContent = `${lockedPercentage}% of Supply`;

        if(tvlStakingEl) tvlStakingEl.textContent = `${formatBigNumber(stakingLocked).toFixed(0)} $BKC`;
        if(tvlGameEl) tvlGameEl.textContent = `${formatBigNumber(gameLocked).toFixed(0)} $BKC`;
        if(tvlPoolEl) tvlPoolEl.textContent = `${formatBigNumber(poolLocked).toFixed(0)} $BKC`;

    } catch (err) {
        console.error("TVL Error:", err);
        tvlValueEl.textContent = 'Error';
    }
}

async function loadAndRenderPublicHeaderStats() {
    const statValidatorsEl = document.getElementById('statValidators'); // Agora usado para mostrar "1 Pool"
    const statTotalPStakeEl = document.getElementById('statTotalPStake');
    const statScarcityEl = document.getElementById('statScarcity');

    try {
        if (!State.delegationManagerContractPublic || !State.bkcTokenContractPublic) return;

        // 1. Active Pools (Fixo em 1 agora)
        if (statValidatorsEl) {
             statValidatorsEl.textContent = "1"; // Single Global Pool
             // Opcional: Mudar o label via JS se necessário, ou fixar no HTML para "Active Pools"
        }

        // 2. Total pStake
        if (statTotalPStakeEl) {
            const totalPStake = await safeContractCall(State.delegationManagerContractPublic, 'totalNetworkPStake', [], 0n);
            State.totalNetworkPStake = totalPStake; 
            statTotalPStakeEl.textContent = formatPStake(totalPStake);
        }

        // 3. Scarcity
        if (statScarcityEl) {
            const tokenContract = State.bkcTokenContractPublic;
            const [currentSupply, maxSupply, tgeSupply] = await Promise.all([
                safeContractCall(tokenContract, 'totalSupply', [], 0n),
                safeContractCall(tokenContract, 'MAX_SUPPLY', [], 200000000000000000000000000n),
                safeContractCall(tokenContract, 'TGE_SUPPLY', [], 40000000000000000000000000n)
            ]);

            const mintPool = maxSupply - tgeSupply;
            const remainingInPool = maxSupply - currentSupply;

            if (mintPool > 0n) {
                const ratePercent = (Number(remainingInPool * 10000n / mintPool) / 100).toFixed(2);
                statScarcityEl.textContent = `${ratePercent}%`;
            }
        }
    } catch (err) {
        console.error("Header Stats Error:", err);
    }
}

// --- MAIN ---

export const DashboardPage = {
    hasRenderedOnce: false,
    async render(isUpdate = false) {
        if (!DOMElements.dashboard._listenersInitialized && DOMElements.dashboard) {
            setupDashboardActionListeners();
            DOMElements.dashboard._listenersInitialized = true;
        }

        if (!isUpdate || !State.isConnected) {
            tabsState = { delegationsLoaded: false }; 
            // Limpeza de abas se necessário...
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Carregamento Público
        loadAndRenderProtocolTVL();
        loadAndRenderPublicHeaderStats();
        renderValidatorsList(); // Mostra o Card do Pool Global
        
        const myPositionPStakeEl = document.getElementById('statUserPStake');
        const claimPanelEl = document.getElementById('claimable-rewards-panel-content');
        
        if (!State.isConnected) {
            if(myPositionPStakeEl) myPositionPStakeEl.textContent = '--';
            if(claimPanelEl) claimPanelEl.innerHTML = '<p class="text-center text-zinc-400 p-4">Connect wallet to view rewards.</p>';
            this.hasRenderedOnce = false;
            return;
        }

        // Conectado
        if (!this.hasRenderedOnce && !isUpdate) {
             if(claimPanelEl) renderLoading(claimPanelEl);
        }

        try {
            if (!State.allValidatorsData) await loadPublicData();
            await loadUserData(); 
            
            // Painel de Recompensas
            const claimDetails = await calculateClaimDetails();
            const { totalRewards, netClaimAmount, feeAmount, discountPercent, basePenaltyPercent } = claimDetails;
            
            if (claimPanelEl) {
                 const baseFeeAmount = (totalRewards * BigInt(Math.round(basePenaltyPercent * 100))) / 10000n;
                 const calculatedDiscountAmount = baseFeeAmount > feeAmount ? baseFeeAmount - feeAmount : 0n;

                 const claimPanelHTML = `
                        <div class="space-y-1">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-zinc-400">Claimable (Gross):</span>
                                <span class="font-bold text-amber-400">${formatBigNumber(totalRewards).toFixed(4)} $BKC</span>
                            </div>
                            
                            ${discountPercent > 0n ? 
                                `<p class="text-xs text-green-400 pt-1 font-semibold"><i class="fa-solid fa-gem mr-1"></i> Booster Savings: ${formatBigNumber(calculatedDiscountAmount).toFixed(4)} $BKC</p>` :
                                totalRewards > 0n ?
                                `<p class="text-xs text-red-400 pt-1 font-semibold"><i class="fa-solid fa-exclamation-triangle mr-1"></i> Fee: ${formatBigNumber(baseFeeAmount).toFixed(4)} $BKC (Get a Booster!)</p>` :
                                `<p class="text-xs text-zinc-500 pt-1">Stake to start earning.</p>`
                            }

                            <div class="flex justify-between font-bold text-lg pt-2 border-t border-border-color/50 mt-2">
                                <span>Net Claim:</span>
                                <span class="${netClaimAmount > 0n ? 'text-white' : 'text-zinc-500'}">${formatBigNumber(netClaimAmount).toFixed(4)} $BKC</span>
                            </div>
                        </div>
                        <button id="dashboardClaimBtn" class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2.5 px-3 rounded-md text-sm transition-opacity mt-3 w-full" ${totalRewards === 0n ? 'disabled' : ''}>
                             <i class="fa-solid fa-gift mr-1"></i> Claim Now
                        </button>
                    `;
                 claimPanelEl.innerHTML = claimPanelHTML;
            }
            
            if (myPositionPStakeEl) myPositionPStakeEl.textContent = formatPStake(State.userTotalPStake || 0n);
            
            startRewardAnimation(totalRewards); 
            
            const efficiencyData = await getHighestBoosterBoostFromAPI(); 
            await renderRewardEfficiencyPanel(efficiencyData);
            await renderActivityHistory(); 

        } catch (error) {
            console.error("Dashboard Load Error:", error);
            if(claimPanelEl) renderError(claimPanelEl, "Failed to load rewards.");
        }
        
        setupActivityTabListeners();

        if (isUpdate) {
            const activeTabButton = document.querySelector('#user-activity-tabs .tab-btn.active');
            if (activeTabButton && activeTabButton.dataset.target === 'tab-delegations') {
                await renderMyDelegations();
            }
        }
        
        if (!isUpdate) this.hasRenderedOnce = true;
    }
};