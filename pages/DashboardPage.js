// pages/DashboardPage.js

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import {
    loadUserData, loadMyCertificates, calculateUserTotalRewards,
    getHighestBoosterBoost, findTxHashForItem, loadPublicData,
    safeContractCall, loadMyBoosters, calculateClaimDetails
} from '../modules/data.js';
import { executeUniversalClaim, executeUnstake, executeForceUnstake, executeDelegation } from '../modules/transactions.js';
import {
    formatBigNumber, formatAddress, formatPStake, renderLoading,
    renderNoData, ipfsGateway, renderPaginatedList, renderError
} from '../utils.js';
import { startCountdownTimers, openModal, showToast, addNftToWallet, closeModal } from '../ui-feedback.js';
import { addresses, boosterTiers } from '../config.js';

// State variable for activity pagination
let activityCurrentPage = 1;
const EXPLORER_BASE_URL = "https://sepolia.etherscan.io/tx/";

// Variáveis de estado para o carregamento sob demanda das abas
let tabsState = {
    delegationsLoaded: false,
    certificatesLoaded: false,
};

// --- ANIMAÇÃO DE RECOMPENSAS (Sem alterações) ---
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
    const deltaTime = lastUpdateTime ? (now - lastUpdateTime) / 1000 : 0;
    lastUpdateTime = now;
    if (targetRewardValue > 0n && deltaTime > 0) {
        const onePercent = targetRewardValue / 100n;
        const increasePerSecond = onePercent / 600n; 
        const incrementThisFrame = (increasePerSecond * BigInt(Math.floor(deltaTime * 1000))) / 1000n;
        // Simulação de crescimento leve apenas para efeito visual
        // targetRewardValue += incrementThisFrame; // Removido para manter o valor estático, mas a animação de número continua
    }
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
// --- FIM DA ANIMAÇÃO ---

// ====================================================================
// ### openDelegateModal (Sem Alterações) ###
// ====================================================================
async function openDelegateModal(validatorAddress) {
    if (!State.isConnected) return showToast("Please connect your wallet first.", "error");
    if (!State.ecosystemManagerContract) return showToast("EcosystemManager not loaded.", "error");

    // Delegação é gratuita conforme DelegationManager.sol
    const delegationFeeBips = 0n; 
    
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
        
        const pStake = amount > 0n ? (amount / BigInt(1e18)) * BigInt(durationDays) : 0n; 
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

// --- LISTENERS (ABA E AÇÕES) ---

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
            content.classList.remove('active'); content.classList.add('hidden');
        });

        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.remove('hidden');
            void targetContent.offsetWidth; 
            targetContent.classList.add('active');
        } else { return; }

        try {
            if (targetId === 'tab-delegations' && !tabsState.delegationsLoaded) {
                await renderMyDelegations(); tabsState.delegationsLoaded = true;
            } else if (targetId === 'tab-certificates' && !tabsState.certificatesLoaded) {
                await renderMyCertificatesDashboard(); tabsState.certificatesLoaded = true;
            }
        } catch (error) {
            console.error(`Error loading tab content ${targetId}:`, error);
            if(targetContent) renderError(targetContent, `Failed to load ${targetId.split('-')[1]}.`);
        }
    });
    tabsContainer._listenersAttached = true;
}

function setupLazyLinkListeners() {
    const historyContainer = document.getElementById('activity-history-list-container');
    if (!historyContainer || historyContainer._lazyListenersAttached) return;

    historyContainer.addEventListener('click', async (e) => {
        const linkButton = e.target.closest('.lazy-tx-link');
        if (!linkButton) return;

        e.preventDefault();
        const itemType = linkButton.dataset.type;
        const itemId = linkButton.dataset.id;
        const userAddress = State.userAddress;

        if (!itemType || !itemId || !userAddress) {
            showToast("Invalid info to find transaction.", "error"); return;
        }

        linkButton.innerHTML = '<div class="loader inline-block !w-4 !h-4"></div> Finding hash...';
        linkButton.disabled = true;
        showToast("Finding transaction hash... This may take a moment.", "info");

        const txHash = await findTxHashForItem(itemType, itemId, userAddress);

        if (txHash) {
            showToast("Transaction found! Opening explorer.", "success");
            window.open(`${EXPLORER_BASE_URL}${txHash}`, '_blank');
            const newLink = document.createElement('a');
            newLink.href = `${EXPLORER_BASE_URL}${txHash}`;
            newLink.target = '_blank';
            newLink.rel = 'noopener noreferrer';
            newLink.title = 'View Transaction on Explorer';
            let classes = linkButton.className.replace('lazy-tx-link', '').replace('cursor-pointer', '').replace('group', '').replace('hover:bg-main/70','').replace('text-left','').replace('block', '').replace('w-full','');
            newLink.className = classes + ' inline-block underline text-amber-400 hover:text-amber-300 text-xs ml-auto';
            newLink.innerHTML = 'View on Etherscan <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i>';
            const parent = linkButton.closest('.bg-main');
            if (parent) {
                 const actionIndicatorSpan = parent.querySelector('.ml-auto');
                 if (actionIndicatorSpan) {
                     actionIndicatorSpan.replaceWith(newLink);
                 } else {
                     const detailsDiv = parent.querySelector('.pl-8');
                     if(detailsDiv) detailsDiv.appendChild(newLink);
                 }
                 linkButton.remove();
            } else {
                linkButton.parentNode.replaceChild(newLink, linkButton);
            }

        } else {
            showToast("Could not find transaction hash. Event might be too old.", "error");
            const failText = document.createElement('span');
            failText.className = 'text-xs text-zinc-500 italic ml-auto';
            failText.textContent = '(Hash not found)';
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
                const boosterId = State.userBoosterId || 0n; 
                const success = await executeForceUnstake(Number(index), boosterId);
                if (success) await DashboardPage.render(true);

            } else if (target.classList.contains('delegate-link')) {
                const validatorAddr = target.dataset.validator;
                if (validatorAddr) await openDelegateModal(validatorAddr);

            } else if (target.classList.contains('go-to-store')) {
                document.querySelector('.sidebar-link[data-target="store"]')?.click();
            } else if (target.classList.contains('nft-clickable-image')) {
                const address = target.dataset.address;
                const tokenId = target.dataset.tokenid;
                if (address && tokenId) addNftToWallet(address, tokenId);
            } else if (target.classList.contains('go-to-rewards')) {
                document.querySelector('.sidebar-link[data-target="rewards"]')?.click();
            }
        } catch (error) {
             console.error("Error handling dashboard action:", error);
             showToast("An unexpected error occurred.", "error");
        }
    });
    dashboardElement._actionListenersAttached = true;
}


// --- Component Rendering Functions ---

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
    if (!State.allValidatorsData) { renderLoading(listEl); return; }

    const sortedData = [...State.allValidatorsData].sort((a, b) => Number(b.pStake - a.pStake));

    const generateValidatorHtml = (validator) => {
         const { addr, pStake, selfStake, delegatedStake } = validator;
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
                        <span class="font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis">${formatBigNumber(delegatedStake).toFixed(2)} $BKC</span>
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
        
        // Busca as taxas/penalidades do Hub
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

            // Cálculo do pStake
            if (lockDurationBigInt > 0n && amountBigInt > 0n && ONE_DAY_SECONDS > 0n && ETHER_DIVISOR > 0n) {
                const amountInEther = amountBigInt / ETHER_DIVISOR;
                const durationInDays = lockDurationBigInt / ONE_DAY_SECONDS;
                pStake = amountInEther * durationInDays;
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

async function renderMyCertificatesDashboard() {
    const listEl = document.getElementById('my-certificates-list');
    if (!listEl) return;
    if (!State.isConnected) { renderNoData(listEl, "Connect your wallet to view certificates."); return; }

    renderLoading(listEl);
    try {
        await loadMyCertificates();
        const certificates = State.myCertificates;

        if (!certificates || certificates.length === 0) { renderNoData(listEl, "No vesting certificates found."); return; }

        // Carrega o URI base do contrato para o metadata
        const VESTING_CERT_BASE_URI_FULL = await safeContractCall(State.rewardManagerContract, 'tokenURI', [1], "")
            .catch(() => "ipfs://bafybeiew62trbumuxfta36hh7tz7pdzhnh73oh6lnsrxx6ivq5mxpwyo24/vesting_cert.json"); // Fallback
        
        // Assume que o VESTING_CERT_BASE_URI é tudo antes do último '/'
        const VESTING_CERT_BASE_URI = VESTING_CERT_BASE_URI_FULL.substring(0, VESTING_CERT_BASE_URI_FULL.lastIndexOf('/') + 1);
        
        const rewardManagerAddress = State.rewardManagerContract.target || addresses.rewardManager;
        const vestingDuration = Number(await safeContractCall(State.rewardManagerContract, 'VESTING_DURATION', [], 5n * 365n * 86400n));


        const certificatePromises = certificates.map(async ({ tokenId }) => { 
            const position = await safeContractCall(State.rewardManagerContract, 'vestingPositions', [tokenId], {totalAmount: 0n, startTime: 0n});
            if (position.startTime === 0n) return '';

            const totalAmount = position.totalAmount;
            const startTime = Number(position.startTime);
            const endTime = startTime + vestingDuration;
            const now = Math.floor(Date.now() / 1000);
            const formattedAmount = formatBigNumber(totalAmount);
            const startDate = new Date(startTime * 1000).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
            const startTimeStr = new Date(startTime * 1000).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
            const endDateFormatted = new Date(endTime * 1000).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
            
            const isVested = now >= endTime;
            const progress = Math.min(100, Math.floor(((now - startTime) * 100) / vestingDuration));


            // Lógica simples de tiering para exibição
            let metadataFileName = 'vesting_cert.json'; 
            let tierColor = 'text-cyan-400';
            if (formattedAmount > 10000) { metadataFileName = 'diamond.json'; tierColor = 'text-cyan-400';
            } else if (formattedAmount > 5000) { metadataFileName = 'gold.json'; tierColor = 'text-amber-400';
            } else if (formattedAmount > 1000) { metadataFileName = 'silver.json'; tierColor = 'text-gray-400';
            } else { metadataFileName = 'bronze.json'; tierColor = 'text-yellow-600'; }


            const tokenURI = VESTING_CERT_BASE_URI + metadataFileName;
            let imageUrl = './assets/bkc_logo_3d.png'; 
            let displayName = `Vesting Certificate #${tokenId.toString()}`;

            try {
                const response = await fetch(tokenURI.replace("ipfs://", ipfsGateway));
                if (response.ok) {
                    const metadata = await response.json();
                    imageUrl = metadata.image ? metadata.image.replace("ipfs://", ipfsGateway) : imageUrl;
                    displayName = metadata.name || displayName;
                }
            } catch (e) { console.warn(`Could not fetch certificate metadata (${tokenId}):`, e); }
            
            // Simulação de retirada (apenas para exibição)
            const initialPenaltyBips = Number(await safeContractCall(State.rewardManagerContract, 'INITIAL_PENALTY_BIPS', [], 5000n));
            let penaltyAmount = 0n;
            if (!isVested) {
                penaltyAmount = (totalAmount * BigInt(initialPenaltyBips)) / 10000n;
            }
            const amountToOwner = totalAmount - penaltyAmount;


            return `
                <div class="p-4 bg-sidebar/50 border border-border-color rounded-xl flex flex-col h-full">
                    <div class="flex items-start gap-4 mb-3">
                         <img src="${imageUrl}" alt="${displayName}" class="w-12 h-12 rounded-md object-cover nft-clickable-image" data-address="${rewardManagerAddress}" data-tokenid="${tokenId.toString()}">
                         <div class="flex-1 min-w-0">
                            <p class="font-bold ${tierColor} truncate text-lg">${displayName}</p>
                            <p class="text-xl font-bold text-amber-400 mt-1">${formattedAmount.toFixed(2)} $BKC</p>
                        </div>
                    </div>
                    
                    <div class="space-y-1 text-sm mb-4">
                        <div class="flex justify-between">
                            <span class="text-zinc-400">Status:</span>
                            <span class="${isVested ? 'text-green-400 font-bold' : 'text-zinc-300'}">${isVested ? 'Fully Vested' : 'Vesting until ' + endDateFormatted}</span>
                        </div>
                         <div class="w-full bg-main rounded-full h-2.5 border border-border-color mt-2">
                             <div class="bg-green-500 h-2 rounded-full" style="width: ${progress}%"></div>
                         </div>
                         <p class="text-xs text-right text-zinc-400 mt-1">Progress: ${progress}%</p>
                    </div>

                    <div class="flex-1 mt-auto">
                        <div class="p-2 bg-main rounded-lg text-xs space-y-1 border border-border-color">
                             <div class="flex justify-between"><span class="text-zinc-400">Withdrawal Amount:</span><span class="font-semibold">${formatBigNumber(amountToOwner).toFixed(4)} $BKC</span></div>
                             ${!isVested ? `<div class="flex justify-between"><span class="text-zinc-400">Early Penalty:</span><span class="text-red-400">${(initialPenaltyBips / 100).toFixed(2)}% (~${formatBigNumber(penaltyAmount).toFixed(4)} $BKC)</span></div>` : ''}
                        </div>
                        <a href="#" data-target="rewards" class="ml-auto text-sm text-amber-500 hover:text-amber-400 go-to-rewards block text-center mt-3">View Details & Withdraw</a>
                    </div>
                </div>`;
        });
        listEl.innerHTML = (await Promise.all(certificatePromises)).join('');

        listEl.querySelectorAll('.go-to-rewards').forEach(link => {
            if (!link._listenerAttached) {
                 link.addEventListener('click', (e) => { e.preventDefault(); document.querySelector('.sidebar-link[data-target="rewards"]')?.click(); });
                 link._listenerAttached = true;
            }
        });
    } catch (error) {
        console.error("Error rendering certificates:", error);
        renderError(listEl, "Failed to load certificates.");
    }
}

function renderActivityItem(item) {
    const timestamp = Number(item.timestamp);
    const date = new Date(timestamp * 1000).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
    const time = new Date(timestamp * 1000).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
    let title = 'On-chain Action', icon = 'fa-exchange-alt', color = 'text-zinc-500', details = 'General transaction.', itemId = null;
    const itemAmount = item.amount || 0n;
    const formattedAmount = formatBigNumber(itemAmount).toFixed(2);
    switch(item.type) {
        case 'Delegation': title = `Delegation`; icon = 'fa-shield-halved'; color = 'text-purple-400'; details = `Delegated ${formattedAmount} to ${formatAddress(item.details.validator)}`; itemId = item.details.index; break;
        case 'VestingCertReceived': title = `Certificate Received`; icon = 'fa-id-card-clip'; color = 'text-cyan-400'; details = `Vesting ${formattedAmount} (#${item.details.tokenId})`; itemId = item.details.tokenId; break;
        case 'BoosterNFT': title = `Booster Acquired`; icon = 'fa-gem'; color = 'text-green-400'; details = `Tier: ${item.details.tierName}`; itemId = item.details.tokenId; break;
        case 'Unstake': 
            title = `Unstake`; icon = 'fa-unlock'; color = 'text-green-400'; 
            details = `Unstaked ${formattedAmount} $BKC`; 
            if(item.details.feePaid && item.details.feePaid > 0n) { details += ` (Fee: ${formatBigNumber(item.details.feePaid).toFixed(2)})`; }
            itemId = item.details.index; break;
        case 'ForceUnstake':
            title = `Forced Unstake`; icon = 'fa-triangle-exclamation'; color = 'text-red-400'; 
            details = `Received ${formattedAmount} $BKC (Penalty: ${formatBigNumber(item.details.feePaid).toFixed(2)})`; 
            itemId = item.details.index; break;
        case 'DelegatorRewardClaimed': 
            title = `Rewards Claimed`; icon = 'fa-gift'; color = 'text-amber-400'; 
            details = `Claimed ${formattedAmount} $BKC from staking`; 
            itemId = null; break;
        case 'CertificateWithdrawn': 
            title = `Certificate Withdrawn`; icon = 'fa-money-bill-transfer'; color = 'text-cyan-400'; 
            details = `Withdrew ${formattedAmount} $BKC (#${item.details.tokenId})`;
            if(item.details.penaltyAmount && item.details.penaltyAmount > 0n) { details += ` (Penalty: ${formatBigNumber(item.details.penaltyAmount).toFixed(2)})`; }
            itemId = item.details.tokenId; break;
        case 'MinerRewardClaimed': 
            title = `Miner Rewards Claimed`; icon = 'fa-pickaxe'; color = 'text-blue-400'; 
            details = `Claimed ${formattedAmount} $BKC from mining`; 
            itemId = null; break;
    }
    const txHash = item.txHash;
    let Tag, tagAttributes, hoverClass, cursorClass, actionIndicator = '';
    const supportsLazySearch = ['Delegation', 'VestingCertReceived', 'Unstake', 'ForceUnstake', 'CertificateWithdrawn'].includes(item.type);
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
        await loadMyBoosters();
        if (!State.userDelegations || State.userDelegations.length === 0) {
             await loadUserData();
        }
        const allActivities = [];
        const userAddress = State.userAddress;
        State.userDelegations?.forEach(d => {
            const startTime = Number(d.unlockTime) - Number(d.lockDuration);
            allActivities.push({ type: 'Delegation', amount: d.amount, timestamp: startTime, details: { validator: d.validator, index: d.index }, txHash: null, itemId: d.index });
        });
        const certPromises = State.myCertificates?.map(async (cert) => {
            const position = await safeContractCall(State.rewardManagerContract, 'vestingPositions', [cert.tokenId], {totalAmount: 0n, startTime: 0n});
            if (position.startTime > 0) {
                 allActivities.push({ type: 'VestingCertReceived', amount: position.totalAmount, timestamp: Number(position.startTime), details: { tokenId: cert.tokenId.toString() }, txHash: null, itemId: cert.tokenId.toString() });
            }
        }) || [];
        await Promise.all(certPromises);
        State.myBoosters?.forEach(b => {
            const tier = boosterTiers.find(t => t.boostBips === b.boostBips);
            allActivities.push({ type: 'BoosterNFT', amount: 0n, timestamp: b.acquisitionTime || Math.floor(Date.now() / 1000), details: { tokenId: b.tokenId.toString(), tierName: tier?.name || 'Unknown' }, txHash: b.txHash || null, itemId: b.tokenId.toString() });
        });
        const blockTimestampCache = {};
        const getTimestamp = async (blockNumber) => {
            if (blockTimestampCache[blockNumber]) return blockTimestampCache[blockNumber];
            try {
                const block = await State.publicProvider.getBlock(blockNumber);
                if (block) { blockTimestampCache[blockNumber] = block.timestamp; return block.timestamp; }
            } catch (e) { console.warn(`Failed to get block ${blockNumber}`, e); }
            return Math.floor(Date.now() / 1000);
        };
        const unstakeFilter = State.delegationManagerContract.filters.Unstaked(userAddress);
        const unstakeEvents = await safeContractCall(State.delegationManagerContract, 'queryFilter', [unstakeFilter, -200000], []);
        for (const event of unstakeEvents) {
            const { user, delegationIndex, amount, feePaid } = event.args;
            const timestamp = await getTimestamp(event.blockNumber);
            const originalAmount = amount + feePaid;
            const isForceUnstake = feePaid > (originalAmount / 20n); 
            allActivities.push({ type: isForceUnstake ? 'ForceUnstake' : 'Unstake', amount: amount, timestamp: timestamp, details: { index: delegationIndex.toString(), feePaid: feePaid }, txHash: event.transactionHash, itemId: delegationIndex.toString() });
        }
        const claimFilter = State.delegationManagerContract.filters.DelegatorRewardClaimed(userAddress);
        const claimEvents = await safeContractCall(State.delegationManagerContract, 'queryFilter', [claimFilter, -200000], []);
        for (const event of claimEvents) {
            const { delegator, amount } = event.args;
            const timestamp = await getTimestamp(event.blockNumber);
            allActivities.push({ type: 'DelegatorRewardClaimed', amount: amount, timestamp: timestamp, details: {}, txHash: event.transactionHash, itemId: null });
        }
        const withdrawFilter = State.rewardManagerContract.filters.CertificateWithdrawn(null, userAddress);
        const withdrawEvents = await safeContractCall(State.rewardManagerContract, 'queryFilter', [withdrawFilter, -200000], []);
        for (const event of withdrawEvents) {
            const { tokenId, owner, amountToOwner, penaltyAmount } = event.args;
            const timestamp = await getTimestamp(event.blockNumber);
            allActivities.push({ type: 'CertificateWithdrawn', amount: amountToOwner, timestamp: timestamp, details: { tokenId: tokenId.toString(), penaltyAmount: penaltyAmount }, txHash: event.transactionHash, itemId: tokenId.toString() });
        }
        const minerClaimFilter = State.rewardManagerContract.filters.MinerRewardClaimed(userAddress);
        const minerClaimEvents = await safeContractCall(State.rewardManagerContract, 'queryFilter', [minerClaimFilter, -200000], []);
        for (const event of minerClaimEvents) {
            const { miner, amount } = event.args;
            const timestamp = await getTimestamp(event.blockNumber);
            allActivities.push({ type: 'MinerRewardClaimed', amount: amount, timestamp: timestamp, details: {}, txHash: event.transactionHash, itemId: null });
        }
        allActivities.sort((a, b) => b.timestamp - a.timestamp);
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
        console.error("Error rendering activity history:", error);
        renderError(listEl, "Failed to load activity history.");
    }
}


// --- Main Page Rendering Function ---
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
            tabsState = { delegationsLoaded: false, certificatesLoaded: false };
            const tabsContainer = document.getElementById('user-activity-tabs');
            const contentContainer = document.getElementById('user-activity-content');
            if (tabsContainer && contentContainer) {
                 tabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                 tabsContainer.querySelector('.tab-btn[data-target="tab-overview"]')?.classList.add('active');
                 contentContainer.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
                 const overviewTab = document.getElementById('tab-overview');
                 if (overviewTab) { overviewTab.classList.remove('hidden'); overviewTab.classList.add('active'); }
            }
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        renderValidatorsList();
        const myPositionPStakeEl = document.getElementById('statUserPStake');
        const efficiencyPanel = document.getElementById('reward-efficiency-panel');
        const historyListContainer = document.getElementById('activity-history-list-container');
        const claimPanelEl = document.getElementById('claimable-rewards-panel-content'); // Onde os detalhes da reivindicação vão

        if (!State.isConnected) {
            console.log("Rendering disconnected state.");
            if(myPositionPStakeEl) myPositionPStakeEl.textContent = '--';
            if(claimPanelEl) claimPanelEl.innerHTML = '<p class="text-center text-zinc-400 p-4">Connect wallet to view rewards.</p>';
            if(efficiencyPanel) efficiencyPanel.innerHTML = '<p class="text-center text-zinc-400 p-4">Connect your wallet to view your status.</p>';
            const delegationList = document.getElementById('my-delegations-list');
            const certList = document.getElementById('my-certificates-list');
            if(delegationList) renderNoData(delegationList, "Connect your wallet.");
            if(certList) renderNoData(certList, "Connect your wallet.");
            if(historyListContainer) renderNoData(historyListContainer, "Connect your wallet.");
            this.hasRenderedOnce = false;
            return;
        }
        console.log("Rendering connected state...");
        if (!this.hasRenderedOnce && !isUpdate) {
            console.log("First render: Showing loaders for Overview tab.");
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
            
            // --- CÁLCULO E RENDERIZAÇÃO DOS DETALHES DE REIVINDICAÇÃO (NOVO) ---
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
                                `<p class="text-xs text-green-400 pt-1 font-semibold"><i class="fa-solid fa-gem mr-1"></i> Seu Booster NFT economiza ${formatBigNumber(calculatedDiscountAmount).toFixed(4)} $BKC em taxas!</p>` :
                                totalRewards > 0n ?
                                `<p class="text-xs text-red-400 pt-1 font-semibold"><i class="fa-solid fa-exclamation-triangle mr-1"></i> Adquira um Booster NFT para economizar até ${formatBigNumber(baseFeeAmount).toFixed(4)} $BKC em taxas!</p>` :
                                `<p class="text-xs text-zinc-500 pt-1">Faça um Stake para começar a ganhar recompensas.</p>`
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
            
            // --- FIM DO CÁLCULO E RENDERIZAÇÃO ---
            
            console.log("Data loaded. Updating UI...");
            if (myPositionPStakeEl) {
                myPositionPStakeEl.textContent = formatPStake(State.userTotalPStake || 0n);
            }
            
            // Inicia a animação (usando o valor BRUTO para o efeito visual)
            startRewardAnimation(totalRewards);
            
            console.log("Rendering reward efficiency...");
            const efficiencyData = await getHighestBoosterBoost();
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
                } else if (activeTabId === 'tab-certificates') {
                     tabsState.certificatesLoaded = false;
                     await renderMyCertificatesDashboard();
                     tabsState.certificatesLoaded = true;
                }
            }
        }
        if (!isUpdate) {
            this.hasRenderedOnce = true;
            console.log("hasRenderedOnce set to true.");
        }
    }
};