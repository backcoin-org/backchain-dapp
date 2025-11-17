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
const EXPLORER_BASE_URL = "https://sepolia.etherscan.io/tx/";

let tabsState = {
    delegationsLoaded: false,
};

// --- ANIMAÇÃO DE RECOMPENSAS ---
let animationFrameId = null;
let targetRewardValue = 0n;
let displayedRewardValue = 0n;
let lastUpdateTime = 0;

function animateClaimableRewards() {
    const rewardsEl = document.getElementById('statUserRewards');
    if (!rewardsEl || !State.isConnected) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }
    const now = performance.now();
    const difference = targetRewardValue - displayedRewardValue;
    if (difference > -10n && difference < 10n && displayedRewardValue !== targetRewardValue) {
        displayedRewardValue = targetRewardValue;
    } else if (difference !== 0n) {
        const movement = difference / 500n; 
        displayedRewardValue += (movement === 0n && difference !== 0n) ? (difference > 0n ? 1n : -1n) : movement;
    }
    if (displayedRewardValue < 0n) {
        displayedRewardValue = 0n;
    }
    rewardsEl.innerHTML = `${formatBigNumber(displayedRewardValue).toFixed(3)} <span class="text-xl">$BKC</span>`;
    animationFrameId = requestAnimationFrame(animateClaimableRewards);
}

function startRewardAnimation(initialTargetValue) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    targetRewardValue = initialTargetValue;
    displayedRewardValue = targetRewardValue > 0n ? (targetRewardValue * 99n) / 100n : 0n;
    lastUpdateTime = performance.now();
    animateClaimableRewards();
}

// --- LÓGICA DE MODAIS ---
async function openDelegateModal(validatorAddress) {
    if (!State.isConnected) return showToast("Please connect your wallet first.", "error");
    if (!State.ecosystemManagerContract) return showToast("EcosystemManager not loaded.", "error");

    const balanceNum = formatBigNumber(State.currentUserBalance || 0n);
    const balanceLocaleString = balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const feePercentage = "0.00"; 

    const content = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white">Delegate to Validator</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-2xl">&times;</button>
        </div>
        <p class="text-sm text-zinc-400 mb-2">To: <span class="font-mono">${formatAddress(validatorAddress)}</span></p>
        <p class="text-sm text-zinc-400 mb-4">Your balance: <span class="font-bold text-amber-400">${balanceLocaleString} $BKC</span></p>
        <div class="mb-4">
            <label for="delegateAmountInput" class="block text-sm font-medium text-zinc-300 mb-1">Amount to Delegate ($BKC)</label>
            <input type="number" id="delegateAmountInput" placeholder="0.00" step="any" min="0" class="form-input">
            <div class="flex gap-2 mt-2">
                <button class="flex-1 bg-zinc-600 hover:bg-zinc-700 text-xs py-1 rounded set-delegate-perc" data-perc="25">25%</button>
                <button class="flex-1 bg-zinc-600 hover:bg-zinc-700 text-xs py-1 rounded set-delegate-perc" data-perc="50">50%</button>
                <button class="flex-1 bg-zinc-600 hover:bg-zinc-700 text-xs py-1 rounded set-delegate-perc" data-perc="75">75%</button>
                <button class="flex-1 bg-zinc-600 hover:bg-zinc-700 text-xs py-1 rounded set-delegate-perc" data-perc="100">100%</button>
            </div>
        </div>
        <div class="mb-6">
            <label for="delegateDurationSlider" class="block text-sm font-medium text-zinc-300 mb-1">Lock Duration: <span id="delegateDurationDisplay" class="font-bold text-amber-400">1825 days</span></label>
            <input type="range" id="delegateDurationSlider" min="1" max="3650" value="1825" class="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500">
            <div class="flex justify-between text-xs text-zinc-400 mt-1">
                <span>1 day</span>
                <span>10 years</span>
            </div>
        </div>
        <div class="bg-main border border-border-color rounded-lg p-3 text-sm mb-6 space-y-1">
            <div class="flex justify-between"><span class="text-zinc-400">Fee (${feePercentage}%):</span><span id="delegateFeeAmount">0.0000 $BKC</span></div>
            <div class="flex justify-between"><span class="text-zinc-400">Net Delegate Amount:</span><span id="delegateNetAmount">0.0000 $BKC</span></div>
            <div class="flex justify-between"><span class="text-zinc-400">Estimated pStake:</span><span id="delegateEstimatedPStake" class="font-bold text-purple-400">0</span></div>
        </div>
        <button id="confirmDelegateBtn" class="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2.5 px-4 rounded-md transition-colors btn-disabled" disabled>
            Confirm Delegation
        </button>
    `;
    openModal(content);

    const amountInput = document.getElementById('delegateAmountInput');
    const durationSlider = document.getElementById('delegateDurationSlider');
    const durationDisplay = document.getElementById('delegateDurationDisplay');
    const feeAmountEl = document.getElementById('delegateFeeAmount');
    const netAmountEl = document.getElementById('delegateNetAmount');
    const pStakeEl = document.getElementById('delegateEstimatedPStake');
    const confirmBtn = document.getElementById('confirmDelegateBtn');

    function updateDelegatePreview() {
        const amountStr = amountInput.value || "0";
        const durationDays = parseInt(durationSlider.value, 10);
        let amount = 0n, fee = 0n, netAmount = 0n;

        try {
            amount = ethers.parseUnits(amountStr.toString(), 18);
            if (amount < 0n) amount = 0n;
        } catch { amount = 0n; }

        const balanceBigInt = State.currentUserBalance || 0n;
        if (amount > balanceBigInt) {
            amount = balanceBigInt;
            amountInput.value = ethers.formatUnits(amount, 18);
        }

        fee = 0n;
        netAmount = amount; 

        if (amount > 0n) {
            confirmBtn.disabled = amount <= 0n; 
            confirmBtn.classList.toggle('btn-disabled', amount <= 0n);
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('btn-disabled');
        }

        durationDisplay.textContent = `${durationDays} days`;
        feeAmountEl.textContent = `${formatBigNumber(fee).toFixed(4)} $BKC`;
        netAmountEl.textContent = `${formatBigNumber(netAmount).toFixed(4)} $BKC`;
        
        // pStake = (Amount in Ether) * (Duration in Days)
        const pStake = (amount / (10n**18n)) * BigInt(durationDays);
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
            
            const success = await executeDelegation(validatorAddress, totalAmountWei, durationSeconds, confirmBtn);
            if (success) {
                closeModal();
                await DashboardPage.render(true); 
            }
        } catch (err) {
            console.error("Error processing delegation data:", err);
            const message = err.reason || err.data?.message || err.message || 'Invalid input or transaction rejected.';
            showToast(`Delegation Error: ${message}`, "error");
        }
    });
    updateDelegatePreview();
}

// --- SETUP DE LISTENERS ---
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
            content.classList.remove('hidden'); 
            content.classList.remove('active');
        });

        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.remove('hidden'); 
            void targetContent.offsetWidth; 
            targetContent.classList.add('active');
        } else { return; }

        try {
            if (targetId === 'tab-delegations' && !tabsState.delegationsLoaded) {
                await renderMyDelegations(); 
                tabsState.delegationsLoaded = true;
            } 
        } catch (error) {
            console.error(`Error loading tab content ${targetId}:`, error);
            if(targetContent) renderError(targetContent, `Failed to load ${targetId.split('-')[1]}.`);
        }
        
        document.querySelectorAll('#user-activity-content .tab-content').forEach(content => {
            if (content.id !== targetId) {
                content.classList.add('hidden');
            }
        });
    });
    tabsContainer._listenersAttached = true;
}

function setupLazyLinkListeners() {
    // This function seems to be deprecated or incomplete as findTxHashForItem was removed.
    // Keeping it for now, but it will default to the "Hash not found" state.
    const historyContainer = document.getElementById('activity-history-list-container');
    if (!historyContainer || historyContainer._lazyListenersAttached) return;

    historyContainer.addEventListener('click', async (e) => {
        const linkButton = e.closest('.lazy-tx-link');
        if (!linkButton) return;
        e.preventDefault();
        
        // The findTxHashForItem logic was removed, so we default to "not found"
        showToast("Finding transaction hash... This may take a moment.", "info");
        const txHash = null; 

        linkButton.innerHTML = '<div class="loader inline-block !w-4 !h-4"></div> Finding hash...';
        linkButton.disabled = true;

        if (txHash) {
             // This block is unlikely to be reached
        } else {
            showToast("Could not find transaction hash. Please check your explorer.", "error");
            const failText = document.createElement('span');
            failText.className = 'text-xs text-zinc-500 italic ml-auto';
            failText.textContent = '(Check Explorer)';
             const parent = linkButton.closest('.bg-main');
             if (parent) {
                  const actionIndicatorSpan = parent.querySelector('.ml-auto');
                  if (actionIndicatorSpan) {
                      actionIndicatorSpan.replaceWith(failText);
                  }
                 linkButton.remove();
             } else {
                   linkButton.parentNode.replaceChild(failText, linkButton);
             }
        }
    });
    historyContainer._lazyListenersAttached = true;
}

function setupDashboardActionListeners() {
    const dashboardElement = DOMElements.dashboard;
    if (!dashboardElement) {
        console.error("Dashboard element not found for attaching listeners.");
        return;
    }
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
                const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
                const success = await executeUniversalClaim(stakingRewards, minerRewards, target);
                if (success) {
                    startRewardAnimation(0n);
                    await DashboardPage.render(true);
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
                const validatorAddr = target.dataset.validator;
                if (validatorAddr) await openDelegateModal(validatorAddr);
            } else if (target.classList.contains('go-to-store')) {
                if (typeof window.navigateToPage === 'function') {
                    window.navigateToPage('store');
                } else {
                    document.querySelector('.sidebar-link[data-target="store"]')?.click();
                }
            } else if (target.classList.contains('nft-clickable-image')) {
                const address = target.dataset.address;
                const tokenId = target.dataset.tokenid;
                if (address && tokenId) addNftToWallet(address, tokenId);
            } else if (target.classList.contains('go-to-rewards')) {
                if (typeof window.navigateToPage === 'function') {
                    window.navigateToPage('rewards');
                } else {
                    document.querySelector('.sidebar-link[data-target="rewards"]')?.click();
                }
            }
        } catch (error) {
             console.error("Error handling dashboard action:", error);
             showToast("An unexpected error occurred.", "error");
        }
    });
    dashboardElement._actionListenersAttached = true;
}


// --- FUNÇÕES DE RENDERIZAÇÃO DE COMPONENTES ---

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
                        `<p class="text-sm text-zinc-400 mt-3">You are claiming rewards at the base rate.</p>
                         <p class="text-xs text-zinc-500 mt-1">Get a booster to maximize your earnings.</p>`
                        : '<p class="text-sm text-zinc-400 mt-3">Start delegating and get a Booster NFT to maximize future rewards!</p>'
                    }
                    <button class="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-900 font-bold py-2.5 px-6 rounded-lg text-lg mt-6 shadow-lg hover:shadow-xl transition-all go-to-store w-full">
                        <i class="fa-solid fa-store mr-2"></i> Get Your Booster!
                    </button>
                </div>`;
            return;
        }

        const boostPercent = efficiencyData.highestBoost / 100;
        let subText = `This NFT provides a <strong>+${boostPercent}%</strong> discount on ecosystem fees (like unstaking) and penalties.`;
        const boosterAddress = State.rewardBoosterContract?.target || addresses.rewardBoosterNFT;

        el.innerHTML = `
            <div class="bg-main border border-border-color rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
                <img src="${efficiencyData.imageUrl || './assets/bkc_logo_3d.png'}" alt="${efficiencyData.boostName}" class="w-20 h-20 rounded-md object-cover border border-zinc-700 nft-clickable-image" data-address="${boosterAddress}" data-tokenid="${efficiencyData.tokenId || ''}">
                <div class="flex-1 text-center sm:text-left">
                    <p class="font-bold text-lg">${efficiencyData.boostName}</p>
                    <p class="text-2xl font-bold text-green-400 mt-1">+${boostPercent}% Discount</p>
                    <p class="text-sm text-zinc-400">${subText}</p>
                </div>
            </div>`;
    } catch (error) {
        console.error("Error rendering reward efficiency panel:", error);
        renderError(el, "Error loading booster status.");
    }
}

function renderValidatorsList() {
    const listEl = document.getElementById('top-validators-list');
    if (!listEl) return;

    const minBalanceToShowBuy = ethers.parseEther("10"); 
    if (State.isConnected && State.currentUserBalance < minBalanceToShowBuy) {
        
        const buyBkcLink = addresses.bkcDexPoolAddress || '#'; 
        
        listEl.innerHTML = `
            <div class="col-span-1">
                <div class="text-center p-6 border border-red-500/50 bg-red-500/10 rounded-lg space-y-3">
                    <i class="fa-solid fa-circle-exclamation text-3xl text-red-400"></i>
                    <h3 class="lg font-bold">Insufficient Balance</h3>
                    <p class="text-sm text-zinc-300">You need $BKC to delegate.</p>
                    <a href="${buyBkcLink}" target="_blank" rel="noopener noreferrer" class="inline-block bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2.5 px-6 rounded-lg text-sm mt-3">
                        <i class="fa-solid fa-shopping-cart mr-2"></i> Buy $BKC
                    </a>
                </div>
            </div>
        `;
        return; 
    }
    
    if (!State.allValidatorsData) { 
        renderLoading(listEl); 
        return; 
    }

    const sortedData = [...State.allValidatorsData].sort((a, b) => Number(b.pStake - a.pStake));

    const generateValidatorHtml = (validator) => {
         const { addr, pStake, selfStake, totalDelegatedAmount } = validator;
        return `
            <div class="bg-main border border-border-color rounded-xl p-5 flex flex-col h-full hover:shadow-lg transition-shadow">
                 <div class="flex items-center justify-between border-b border-border-color/50 pb-3 mb-3">
                    <div class="flex items-center gap-3 min-w-0">
                        <i class="fa-solid fa-user-shield text-xl text-zinc-500"></i>
                        <p class="font-mono text-zinc-400 text-sm truncate" title="${addr}">${formatAddress(addr)}</p>
                    </div>
                    <p class="text-xs text-zinc-500">Validator</p>
                </div>
                <div class="text-center py-4 bg-sidebar/50 rounded-lg mb-4">
                    <p class="text-zinc-400 text-sm">Total pStake</p>
                    <p class="text-3xl font-bold text-purple-400 mt-1">${formatPStake(pStake)}</p>
                </div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-5">
                    <div class="flex flex-col border-r border-border-color/50 pr-4">
                        <span class="text-zinc-400 text-xs uppercase">Self-Staked</span>
                        <span class="font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis">${formatBigNumber(selfStake).toFixed(2)} $BKC</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-zinc-400 text-xs uppercase">Delegated</span>
                        <span class="font-semibold text-lg whitespace-nowimarkdown text-ellipsis">${formatBigNumber(totalDelegatedAmount).toFixed(2)} $BKC</span>
                    </div>
                </div>
                <button class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2.5 px-4 rounded-md transition-colors w-full mt-auto text-center delegate-link ${!State.isConnected ? 'btn-disabled' : ''}" data-validator="${addr}" ${!State.isConnected ? 'disabled' : ''}>
                    Delegate (Free)
                </button>
            </div>`;
    };

    if (State.allValidatorsData.length === 0) {
        renderNoData(listEl, "No active validators on the network.");
    } else {
        listEl.innerHTML = sortedData.slice(0, 5).map(generateValidatorHtml).join('');
    }
}

async function renderMyDelegations() {
    const listEl = document.getElementById('my-delegations-list');
    if (!listEl) return;
    if (!State.isConnected) { renderNoData(listEl, "Connect your wallet to view delegations."); return; }

    renderLoading(listEl);
    try {
        const delegationsRaw = await safeContractCall(State.delegationManagerContract, 'getDelegationsOf', [State.userAddress], []);
        State.userDelegations = delegationsRaw.map((d, index) => ({
            amount: d[0], unlockTime: d[1], lockDuration: d[2], validator: d[3], index, txHash: null
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

            if (lockDurationBigInt > 0n && amountBigInt > 0n && ONE_DAY_SECONDS > 0n && ETHER_DIVISOR > 0n) {
                // pStake = (Amount in Ether) * (Duration in Days)
                const pStakeCalc = (amountBigInt * (lockDurationBigInt / ONE_DAY_SECONDS)) / ETHER_DIVISOR;
                pStake = pStakeCalc;
            }

            const unlockTimestamp = Number(d.unlockTime);
            const isLocked = unlockTimestamp > (Date.now() / 1000);
            
            const penaltyPercent = (Number(forceUnstakePenaltyBips) / 100).toFixed(2);
            const penaltyAmount = formatBigNumber((amountBigInt * forceUnstakePenaltyBips) / 10000n);
            const feePercent = (Number(unstakeFeeBips) / 100).toFixed(2);
            
            const unlockDate = new Date(unlockTimestamp * 1000).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            return `
                <div class="bg-main border border-border-color rounded-xl p-4 delegation-card">
                    <div class="flex justify-between items-start gap-4">
                        <div>
                            <p class="text-2xl font-bold">${amountFormatted.toFixed(4)} <span class="text-amber-400">$BKC</span></p>
                            <p class="text-sm text-zinc-400">To: <span class="font-mono">${formatAddress(d.validator)}</span></p>
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
                                <div class="countdown-timer text-lg font-mono" data-unlock-time="${unlockTimestamp}" data-index="${d.index}">
                                    ${isLocked ? '<div class="loader !w-4 !h-4 inline-block mr-1"></div>Loading...' : '<span class="text-green-400 font-bold">Unlocked</span>'}
                                </div>
                                <p class="text-xs text-zinc-500">${unlockDate}</p>
                            </div>
                            <div class="flex gap-2 w-full sm:w-auto justify-end">
                                ${isLocked 
                                    ? `<button title="Force unstake (base penalty: ${penaltyPercent}%)" class="bg-red-900/50 hover:bg-red-900/80 text-red-400 font-bold py-2 px-3 rounded-md text-sm force-unstake-btn flex-1 sm:flex-none" data-index="${d.index}"><i class="fa-solid fa-lock mr-1"></i> Force</button>` 
                                    : ''}
                                <button class="${isLocked ? 'btn-disabled' : 'bg-amber-500 hover:bg-amber-600 text-zinc-900'} font-bold py-2 px-3 rounded-md text-sm unstake-btn flex-1 sm:flex-none" data-index="${d.index}" ${isLocked ? 'disabled' : ''}><i class="fa-solid fa-unlock mr-1"></i> Unstake</button>
                            </div>
                        </div>
                        <div class="delegation-penalty-text mt-2 pt-2 border-t border-border-color/50 text-xs ${isLocked ? 'text-red-400/80' : 'text-green-400'}">
                           ${isLocked ? `<strong>Penalty (Force Unstake):</strong> ${penaltyPercent}% (~${penaltyAmount.toFixed(4)} $BKC). Booster NFTs reduce this.` : `Unstake Fee: ${feePercent}%`}
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

// --- AJUSTE: Função atualizada para incluir 'ValidatorRegistered' ---
function renderActivityItem(item) {
    let timestamp;
    if (typeof item.timestamp === 'object' && item.timestamp._seconds) {
        timestamp = Number(item.timestamp._seconds);
    } else {
        timestamp = Number(item.timestamp);
    }

    const date = new Date(timestamp * 1000).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
    const time = new Date(timestamp * 1000).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
    let title = 'On-chain Action', icon = 'fa-exchange-alt', color = 'text-zinc-500', details = 'General transaction.';
    
    let itemId = null; 

    let itemAmount = 0n;
    try {
        if (item.amount) {
            const amountStr = item.amount.toString();
            if (amountStr.includes('e') || amountStr.includes('.')) {
                 itemAmount = ethers.FixedNumber.fromString(amountStr).floor().toBigInt();
            } else {
                 itemAmount = BigInt(amountStr);
            }
        }
    } catch (e) {
        console.warn("Could not parse activity amount from API:", item.amount, e);
    }
    
    const formattedAmount = formatBigNumber(itemAmount).toFixed(2);
    const itemDetails = item.details || {};
    
    switch(item.type) {
        case 'Delegation': title = `Delegation`; icon = 'fa-shield-halved'; color = 'text-purple-400'; details = `Delegated ${formattedAmount} to ${formatAddress(itemDetails.validator)}`; itemId = itemDetails.index; break;
        case 'BoosterNFT': title = `Booster Acquired`; icon = 'fa-gem'; color = 'text-green-400'; details = `Tier: ${itemDetails.tierName}`; itemId = itemDetails.tokenId; break;
        case 'Unstake': 
            title = `Unstake`; icon = 'fa-unlock'; color = 'text-green-400'; 
            details = `Unstaked ${formattedAmount} $BKC`; 
            if(itemDetails.feePaid && BigInt(itemDetails.feePaid) > 0n) { details += ` (Fee: ${formatBigNumber(BigInt(itemDetails.feePaid)).toFixed(2)})`; }
            itemId = itemDetails.index; break;
        case 'ForceUnstake':
            title = `Forced Unstake`; icon = 'fa-triangle-exclamation'; color = 'text-red-400'; 
            details = `Received ${formattedAmount} $BKC (Penalty: ${formatBigNumber(BigInt(itemDetails.feePaid || 0n)).toFixed(2)})`; 
            itemId = itemDetails.index; break;
        case 'DelegatorRewardClaimed': 
            title = `Rewards Claimed`; icon = 'fa-gift'; color = 'text-amber-400'; 
            details = `Claimed ${formattedAmount} $BKC from staking`; 
            itemId = null; break;
        case 'MinerRewardClaimed': 
            title = `Miner Rewards Claimed`; icon = 'fa-pickaxe'; color = 'text-blue-400'; 
            details = `Claimed ${formattedAmount} $BKC from mining`; 
            itemId = null; break;
        
        // --- AJUSTE: Renomeado de 'TigerGameWin' para 'FortuneGameWin' ---
        case 'FortuneGameWin': 
            title = `Fortune Pool Win`; icon = 'fa-trophy'; color = 'text-yellow-400'; 
            details = `Won ${formattedAmount} $BKC`; 
            itemId = null; 
            break;
        // --- AJUSTE: Renomeado de 'GamePlayed' para 'FortuneGamePlay' (ou similar) ---
        case 'GamePlayed': 
            title = `Fortune Pool Play`; icon = 'fa-dice'; color = 'text-zinc-500'; 
            details = `Played ${formatBigNumber(BigInt(itemDetails.wagered || 0n)).toFixed(2)} $BKC`; 
            itemId = null; 
            break;
            
        // --- AJUSTE: Adicionado 'ValidatorRegistered' ---
        case 'ValidatorRegistered':
            title = 'Validator Registered';
            icon = 'fa-user-shield';
            color = 'text-green-400';
            details = `Registered as network validator (Fee: ${formatBigNumber(BigInt(itemDetails.feePaid || 0n)).toFixed(2)} $BKC)`;
            itemId = null; // This event doesn't have a unique ID to search by
            break;

        case 'NFTBuy':
            title = `Booster Bought (Pool)`; icon = 'fa-shopping-cart'; color = 'text-green-400';
            details = `Bought NFT #${itemDetails.tokenId} for ${formattedAmount} $BKC`;
            itemId = itemDetails.tokenId;
            break;
        case 'NFTSell':
            title = `Booster Sold (Pool)`; icon = 'fa-dollar-sign'; color = 'text-blue-400';
            const taxFormatted = formatBigNumber(BigInt(itemDetails.tax || 0n)).toFixed(2);
            details = `Sold NFT #${itemDetails.tokenId} for ${formattedAmount} $BKC (Tax: ${taxFormatted})`;
            itemId = itemDetails.tokenId;
            break;
        case 'PublicSaleBuy': 
            title = 'Booster Bought (Store)'; 
            icon = 'fa-shopping-bag'; 
            color = 'text-green-400'; 
            details = `Bought Tier ${itemDetails.tierId} NFT (#${itemDetails.tokenId}) for ${formatBigNumber(itemAmount).toFixed(2)} $BKC`; 
            itemId = itemDetails.tokenId; 
            break;
        case 'NotaryRegister': 
            title = 'Document Notarized'; 
            icon = 'fa-stamp'; 
            color = 'text-blue-400'; 
            details = `Registered Doc #${itemDetails.tokenId} (Fee: ${formatBigNumber(itemAmount).toFixed(2)} $BKC)`; 
            itemId = itemDetails.tokenId; 
            break;
        default:
             title = item.type || 'Unknown Action';
             icon = 'fa-question-circle';
             color = 'text-zinc-500';
             details = item.description || `Activity of type ${item.type}`;
             itemId = null;
             break;
    }
    
    const txHash = item.txHash;
    let Tag, tagAttributes, hoverClass, cursorClass, actionIndicator = '';
    const supportsLazySearch = ['Delegation', 'Unstake', 'ForceUnstake', 'NFTBuy', 'NFTSell', 'PublicSaleBuy', 'NotaryRegister'].includes(item.type);
    
    if (txHash) {
        Tag = 'a'; tagAttributes = `href="${EXPLORER_BASE_URL}${txHash}" target="_blank" rel="noopener noreferrer" title="View Transaction on Explorer"`; hoverClass = 'hover:bg-main/70 group'; cursorClass = 'cursor-pointer';
        actionIndicator = `<span class="text-xs text-blue-400/80 group-hover:text-blue-300 transition-colors ml-auto">View Tx <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i></span>`;
    } else if (supportsLazySearch && itemId !== undefined && itemId !== null) {
        Tag = 'button'; tagAttributes = `data-type="${item.type}" data-id="${itemId}" title="Click to find transaction (may take time)"`; hoverClass = 'hover:bg-main/70 group lazy-tx-link'; cursorClass = 'cursor-pointer';
        actionIndicator = `<span class="text-xs text-amber-500/80 group-hover:text-amber-400 transition-colors ml-auto">Find Tx <i class="fa-solid fa-magnifying-glass ml-1"></i></span>`;
    } else {
        Tag = 'div'; tagAttributes = `title="Transaction details"`; hoverClass = ''; cursorClass = 'cursor-default';
    }
    return `
        <${Tag} ${tagAttributes} class="block w-full text-left bg-main border border-border-color rounded-lg p-4 transition-colors ${hoverClass} h-full ${cursorClass}">
            <div class="flex items-center justify-between gap-3 mb-2">
                <div class="flex items-center gap-3 min-w-0">
                    <i class="fa-solid ${icon} ${color} text-xl w-5 flex-shrink-0 text-center"></i>
                    <p class="font-bold text-base text-white transition-colors truncate">${title}</p>
                </div>
                ${actionIndicator}
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
    if (!listEl) { console.warn("History container not found"); return; }
    if (!State.isConnected) { renderNoData(listEl, "Connect your wallet to view history."); return; }
    
    renderLoading(listEl);
    
    try {
        const historyUrl = `${API_ENDPOINTS.getHistory}/${State.userAddress}`;
        const response = await fetch(historyUrl);
        
        if (!response.ok) {
            throw new Error(`API (getHistory) Error: ${response.statusText} (${response.status})`);
        }
        
        const allActivities = await response.json(); 

        if (allActivities.length === 0) {
            renderNoData(listEl, "Your recent activities will appear here.");
        } else {
            renderPaginatedList(
                allActivities, listEl, renderActivityItem, 6, activityCurrentPage,
                (newPage) => { activityCurrentPage = newPage; renderActivityHistory(); },
                'grid grid-cols-1 md:grid-cols-2 gap-4'
            );
            setupLazyLinkListeners();
        }
    } catch (error) {
        console.error("Error rendering activity history from API:", error);
        renderError(listEl, "Failed to load activity history.");
    }
}


// --- FUNÇÕES DE DADOS PÚBLICOS ---

// --- AJUSTE: Função atualizada para remover 'RewardManager' (vesting) ---
async function loadAndRenderProtocolTVL() {
    const tvlValueEl = document.getElementById('protocol-tvl-value'); 
    const tvlPercEl = document.getElementById('protocol-tvl-percentage'); 
    const statLockedPercentageEl = document.getElementById('statLockedPercentage');
    const statTotalSupplyEl = document.getElementById('statTotalSupply'); 
    const tvlStakingEl = document.getElementById('tvl-detail-staking');
    const tvlVestingEl = document.getElementById('tvl-detail-vesting'); // Será ocultado/zerado
    const tvlGameEl = document.getElementById('tvl-detail-game');
    const tvlPoolEl = document.getElementById('tvl-detail-nftpool');
    const tvlDexEl = document.getElementById('tvl-detail-dex'); 

    if (!tvlValueEl) return;
    
    tvlValueEl.innerHTML = '<div class="loader !w-5 !h-5 inline-block"></div>';
    tvlPercEl.textContent = 'Calculating...';
    if(statLockedPercentageEl) statLockedPercentageEl.innerHTML = '<div class="loader !w-5 !h-5 inline-block"></div>';
    if(statTotalSupplyEl) statTotalSupplyEl.innerHTML = '<div class="loader !w-5 !h-5 inline-block"></div>';

    try {
        let totalLocked = 0n;
        let stakingLocked = 0n, gameLocked = 0n, poolLocked = 0n, dexLocked = 0n; 

        if (!State.bkcTokenContractPublic || !State.delegationManagerContractPublic) {
            throw new Error("Essential public contracts (bkcTokenContractPublic, etc.) are not loaded in State.");
        }
        
        const tokenContract = State.bkcTokenContractPublic;

        // 1. Saldo do Delegation Manager (Staking)
        if (addresses.delegationManager) {
            stakingLocked = await safeContractCall(tokenContract, 'balanceOf', [addresses.delegationManager], 0n);
            totalLocked += stakingLocked;
        }
        
        // 2. --- AJUSTE: 'Reward Manager' (Vesting) removido ---
        // Opcional: Se o elemento HTML ainda existir, oculte-o ou zere-o.
        if(tvlVestingEl) {
             const parent = tvlVestingEl.closest('.flex'); // Oculta a linha inteira
             if(parent) parent.style.display = 'none';
        }

        // 3. Saldo das Pools de Jogo (Actions Manager / FortunePool)
        if (State.actionsManagerContractPublic) { // Assume 'actionsManagerContractPublic' é o FortunePool
             gameLocked = await safeContractCall(State.actionsManagerContractPublic, 'prizePoolBalance', [], 0n);
             totalLocked += gameLocked;
        } 

        // 4. Saldo das Pools de NFT (AMM Pools)
        if (boosterTiers) {
            const poolKeys = Object.keys(addresses).filter(k => k.startsWith('pool_'));
            for (const key of poolKeys) {
                const poolAddress = addresses[key];
                if (poolAddress && poolAddress.startsWith('0x')) {
                    const poolBalance = await safeContractCall(tokenContract, 'balanceOf', [poolAddress], 0n);
                    poolLocked += poolBalance;
                }
            }
            totalLocked += poolLocked;
        } 

        // 5. Saldo da Piscina DEX 
        const dexPoolAddress = addresses.mainLPPairAddress;
        if (dexPoolAddress && dexPoolAddress.startsWith('0x') && !dexPoolAddress.includes('...')) {
            dexLocked = await safeContractCall(tokenContract, 'balanceOf', [dexPoolAddress], 0n);
            totalLocked += dexLocked;
        } 

        const totalSupply = await safeContractCall(tokenContract, 'totalSupply', [], 0n);
        const lockedPercentage = (totalSupply > 0n) ? (Number(totalLocked * 10000n / totalSupply) / 100).toFixed(2) : 0;
        
        if (statTotalSupplyEl) {
             statTotalSupplyEl.textContent = formatBigNumber(totalSupply).toFixed(0);
        }
        if (statLockedPercentageEl) {
            statLockedPercentageEl.textContent = `${lockedPercentage}%`;
        }

        tvlValueEl.textContent = `${formatBigNumber(totalLocked).toFixed(0)} $BKC`;
        tvlPercEl.textContent = `${lockedPercentage}% of Total Supply Locked`;
        
        if(tvlStakingEl) tvlStakingEl.textContent = `${formatBigNumber(stakingLocked).toFixed(0)} $BKC`;
        if(tvlGameEl) tvlGameEl.textContent = `${formatBigNumber(gameLocked).toFixed(0)} $BKC`;
        if(tvlPoolEl) tvlPoolEl.textContent = `${formatBigNumber(poolLocked).toFixed(0)} $BKC`;
        if(tvlDexEl) tvlDexEl.textContent = `${formatBigNumber(dexLocked).toFixed(0)} $BKC`; 

    } catch (err) {
        console.error("Failed to load protocol TVL:", err);
        tvlValueEl.textContent = 'Error';
        tvlPercEl.textContent = 'Failed to load TVL data.';
        if(statLockedPercentageEl) statLockedPercentageEl.textContent = 'Error';
        if(statTotalSupplyEl) statTotalSupplyEl.textContent = 'Error';
    }
}

async function loadAndRenderPublicHeaderStats() {
    const statValidatorsEl = document.getElementById('statValidators');
    const statTotalPStakeEl = document.getElementById('statTotalPStake');
    const statScarcityEl = document.getElementById('statScarcity');

    try {
        if (!State.delegationManagerContractPublic || !State.bkcTokenContractPublic) {
             throw new Error("Public contracts (DM or BKC) not initialized.");
        }

        // 1. Contagem de Validadores
        if (statValidatorsEl) {
            try {
                if (!State.allValidatorsData) {
                    const validatorsArray = await safeContractCall(State.delegationManagerContractPublic, 'getAllValidators', [], []);
                    
                    // CORREÇÃO CRÍTICA: LÊ OS DADOS POR ÍNDICE (4 CAMPOS)
                    const pStakePromises = validatorsArray.map(addr => safeContractCall(State.delegationManagerContractPublic, 'validators', [addr], []));
                    const validatorDataRaw = await Promise.all(pStakePromises);
                    
                    // Mapeamento da estrutura do contrato: [0: isRegistered, 1: selfStakeAmount, 2: totalPStake, 3: totalDelegatedAmount]
                    State.allValidatorsData = validatorsArray.map((addr, index) => ({
                        addr,
                        isRegistered: validatorDataRaw[index][0], // Índice 0: isRegistered
                        selfStake: validatorDataRaw[index][1],    // Índice 1: selfStakeAmount
                        pStake: validatorDataRaw[index][2],       // Índice 2: totalPStake
                        totalDelegatedAmount: validatorDataRaw[index][3] // Índice 3: totalDelegatedAmount
                    }));
                }
                
                // Filtra apenas os validadores registrados para a contagem
                const registeredValidators = State.allValidatorsData.filter(v => v.isRegistered);
                statValidatorsEl.textContent = registeredValidators.length.toString();
            } catch (valErr) {
                console.error("Error loading validators count:", valErr);
                statValidatorsEl.textContent = 'Error';
            }
        }
        
        // 2. Total pStake da Rede
        if (statTotalPStakeEl) {
            const totalPStake = await safeContractCall(State.delegationManagerContractPublic, 'totalNetworkPStake', [], 0n);
            State.totalNetworkPStake = totalPStake; 
            statTotalPStakeEl.textContent = formatPStake(totalPStake);
        }
        
        // 3. Taxa de Escassez (Scarcity Rate)
        if (statScarcityEl) { 
            const tokenContract = State.bkcTokenContractPublic;
            const [currentSupply, maxSupply, tgeSupply] = await Promise.all([
                safeContractCall(tokenContract, 'totalSupply', [], 0n),
                safeContractCall(tokenContract, 'MAX_SUPPLY', [], 200000000000000000000000000n), // 200M
                safeContractCall(tokenContract, 'TGE_SUPPLY', [], 40000000000000000000000000n)  // 40M
            ]);

            const mintPool = maxSupply - tgeSupply;
            const remainingInPool = maxSupply - currentSupply;

            if (mintPool > 0n && remainingInPool >= 0n && remainingInPool <= mintPool) {
                const rateBigInt = (remainingInPool * 10000n) / mintPool;
                const ratePercent = (Number(rateBigInt) / 100).toFixed(2);
                statScarcityEl.textContent = `${ratePercent}%`;
            } else if (remainingInPool > mintPool) {
                 statScarcityEl.textContent = "100.00%";
            } else {
                statScarcityEl.textContent = "0.00%";
            }
        } else {
            console.warn("Element 'statScarcity' not found.");
        }

    } catch (err) {
        console.error("Failed to load public header stats:", err);
        if(statValidatorsEl) statValidatorsEl.textContent = 'Error';
        if(statTotalPStakeEl) statTotalPStakeEl.textContent = 'Error';
        if(statScarcityEl) statScarcityEl.textContent = 'Error';
    }
}


// --- RENDERIZADOR PRINCIPAL DA PÁGINA ---

export const DashboardPage = {
    hasRenderedOnce: false,
    async render(isUpdate = false) {
        console.log(`DashboardPage.render called (isUpdate: ${isUpdate}, hasRenderedOnce: ${this.hasRenderedOnce})`);
        
        if (!DOMElements.dashboard._listenersInitialized && DOMElements.dashboard) {
            console.log("Setting up dashboard action listeners...");
            setupDashboardActionListeners();
            DOMElements.dashboard._listenersInitialized = true;
        }

        if (!isUpdate || !State.isConnected) {
            console.log("Resetting tabs state and UI.");
            tabsState = { delegationsLoaded: false }; 
            const tabsContainer = document.getElementById('user-activity-tabs');
            const contentContainer = document.getElementById('user-activity-content');
            
            if (tabsContainer && contentContainer) {
                 const certsTab = tabsContainer.querySelector('.tab-btn[data-target="tab-certificates"]');
                 if(certsTab) certsTab.remove();
                 
                 const certsContent = document.getElementById('tab-certificates');
                 if(certsContent) certsContent.remove();
                 
                 tabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                 tabsContainer.querySelector('.tab-btn[data-target="tab-overview"]')?.classList.add('active');
                 
                 contentContainer.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                    content.classList.remove('active');
                 });
                 const overviewTab = document.getElementById('tab-overview');
                 if (overviewTab) { overviewTab.classList.remove('hidden'); overviewTab.classList.add('active'); }
            }

            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // --- Renderiza Dados PÚBLICOS ---
        loadAndRenderProtocolTVL();
        loadAndRenderPublicHeaderStats();
        renderValidatorsList();
        
        const myPositionPStakeEl = document.getElementById('statUserPStake');
        const efficiencyPanel = document.getElementById('reward-efficiency-panel');
        const historyListContainer = document.getElementById('activity-history-list-container');
        const claimPanelEl = document.getElementById('claimable-rewards-panel-content');
        
        // --- Estado: Desconectado ---
        if (!State.isConnected) {
            console.log("Rendering disconnected state (User Panels only).");
            if(myPositionPStakeEl) myPositionPStakeEl.textContent = '--';
            if(claimPanelEl) claimPanelEl.innerHTML = '<p class="text-center text-zinc-400 p-4">Connect wallet to view rewards.</p>';
            if(efficiencyPanel) efficiencyPanel.innerHTML = '<p class="text-center text-zinc-400 p-4">Connect your wallet to view your status.</p>';
            const delegationList = document.getElementById('my-delegations-list');
            if(delegationList) renderNoData(delegationList, "Connect your wallet.");
            if(historyListContainer) renderNoData(historyListContainer, "Connect your wallet.");
            
            const statUserBalanceEl = document.getElementById('statUserBalance');
            if(statUserBalanceEl) statUserBalanceEl.textContent = '--';

            this.hasRenderedOnce = false;
            return;
        }

        // --- Estado: Conectado ---
        console.log("Rendering connected state...");
        
        if (!this.hasRenderedOnce && !isUpdate) {
            console.log("First render (Connected): Showing loaders for User Panels.");
            if(myPositionPStakeEl) renderLoading(myPositionPStakeEl);
            if(claimPanelEl) renderLoading(claimPanelEl);
            if(efficiencyPanel) renderLoading(efficiencyPanel);
            if(historyListContainer) renderLoading(historyListContainer);
        }

        try {
            console.log("Loading user data and rewards...");
            if (!State.allValidatorsData || State.allValidatorsData.length === 0) {
                 await loadPublicData(); 
                 renderValidatorsList(); 
            }
            await loadUserData(); 
            
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
                                `<p class="text-xs text-green-400 pt-1 font-semibold"><i class="fa-solid fa-gem mr-1"></i> Your Booster NFT saves you ${formatBigNumber(calculatedDiscountAmount).toFixed(4)} $BKC in fees!</p>` :
                                totalRewards > 0n ?
                                `<p class="text-xs text-red-400 pt-1 font-semibold"><i class="fa-solid fa-exclamation-triangle mr-1"></i> Get a Booster NFT to save up to ${formatBigNumber(baseFeeAmount).toFixed(4)} $BKC in fees!</p>` :
                                `<p class="text-xs text-zinc-500 pt-1">Stake to start earning rewards.</p>`
                            }
                            <div class="flex justify-between items-center text-sm ${discountPercent > 0 ? 'line-through text-red-500/70' : 'text-zinc-400'}">
                                <span class="text-zinc-400">Base Fee (${basePenaltyPercent.toFixed(2)}%):</span>
                                <span>-${formatBigNumber(baseFeeAmount).toFixed(4)} $BKC</span>
                            </div>
                            
                            ${discountPercent > 0n ? 
                                `<div class="flex justify-between font-semibold text-green-400">
                                    <span>Booster Discount (${discountPercent.toFixed(2)}%):</span>
                                    <span>+${formatBigNumber(calculatedDiscountAmount).toFixed(4)} $BKC</span>
                                 </div>` : 
                                `<div class="flex justify-between text-zinc-400">
                                    <span>Booster Discount:</span>
                                    <span>0.00%</span>
                                </div>`
                            }

                            <div class="flex justify-between font-bold text-lg pt-2 border-t border-border-color/50">
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
            
            console.log("Data loaded. Updating UI...");
            if (myPositionPStakeEl) {
                myPositionPStakeEl.textContent = formatPStake(State.userTotalPStake || 0n);
            }
            
            startRewardAnimation(totalRewards); 
            
            console.log("Rendering reward efficiency...");
            const efficiencyData = await getHighestBoosterBoostFromAPI(); 
            await renderRewardEfficiencyPanel(efficiencyData);
            console.log("Reward efficiency rendered.");
            
            console.log("Rendering activity history in Overview...");
            await renderActivityHistory(); 
            console.log("Activity history rendered.");

        } catch (error) {
            console.error("Error loading/rendering essential dashboard data:", error);
            if(myPositionPStakeEl) myPositionPStakeEl.textContent = 'Error';
            if(claimPanelEl) renderError(claimPanelEl, "Failed to load rewards data.");
            if(efficiencyPanel) renderError(efficiencyPanel, "Failed to load user data.");
            if(historyListContainer) renderError(historyListContainer, "Failed to load history.");

            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        setupActivityTabListeners();

        if (isUpdate) {
            console.log("Handling update: Reloading active tab content (if not Overview)...");
            const activeTabButton = document.querySelector('#user-activity-tabs .tab-btn.active');
            if (activeTabButton) {
                const activeTabId = activeTabButton.dataset.target;
                console.log(`Active tab is: ${activeTabId}. Checking reload need.`);
                if (activeTabId === 'tab-delegations') {
                    tabsState.delegationsLoaded = false;
                    await renderMyDelegations();
                    tabsState.delegationsLoaded = true;
                }
            }
        }
        if (!isUpdate) {
            this.hasRenderedOnce = true;
            console.log("hasRenderedOnce set to true.");
        }
    }
};