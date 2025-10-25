// pages/DashboardPage.js

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import {
    loadUserData, loadMyCertificates, calculateUserTotalRewards,
    getHighestBoosterBoost, findTxHashForItem, loadPublicData,
    safeContractCall, loadMyBoosters
} from '../modules/data.js';
import { executeUniversalClaim, executeUnstake, executeForceUnstake, executeDelegation } from '../modules/transactions.js';
import {
    formatBigNumber, formatAddress, formatPStake, renderLoading,
    renderNoData, ipfsGateway, renderPaginatedList, renderError
} from '../utils.js';
import { startCountdownTimers, openModal, showToast, addNftToWallet, closeModal } from '../ui-feedback.js';
import { addresses, boosterTiers } from '../config.js';

// Base URI for Vesting Certificate metadata
const VESTING_CERT_BASE_URI = "ipfs://bafybeiew62trbumuxfta36hh7tz7pdzhnh73oh6lnsrxx6ivq5mxpwyo24/";

// State variable for activity pagination
let activityCurrentPage = 1;
const EXPLORER_BASE_URL = "https://sepolia.etherscan.io/tx/";

// Variáveis de estado para o carregamento sob demanda das abas
let tabsState = {
    delegationsLoaded: false,
    certificatesLoaded: false,
};

// --- ANIMAÇÃO DE RECOMPENSAS (AJUSTADA) ---
let animationFrameId = null;
let targetRewardValue = 0n; // Valor real + incremento simulado
let displayedRewardValue = 0n; // Valor exibido na UI
// REMOVIDO: const REWARD_INCREASE_PER_SECOND
let lastUpdateTime = 0;

function animateClaimableRewards() {
    const rewardsEl = document.getElementById('statUserRewards');
    if (!rewardsEl || !State.isConnected) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }

    const now = performance.now();
    const deltaTime = lastUpdateTime ? (now - lastUpdateTime) / 1000 : 0; // Tempo em segundos
    lastUpdateTime = now;

    // --- LÓGICA DE INCREMENTO LENTO ---
    if (targetRewardValue > 0n && deltaTime > 0) {
        // Calcula 1% do valor atual
        const onePercent = targetRewardValue / 100n;
        // Calcula quanto desse 1% deve ser adicionado por segundo para levar 600s
        const increasePerSecond = onePercent / 600n; // BigInt division floors
        // Calcula o incremento para este frame com base no deltaTime
        const incrementThisFrame = (increasePerSecond * BigInt(Math.floor(deltaTime * 1000))) / 1000n; // Mantém precisão BigInt

        targetRewardValue += incrementThisFrame;
    }
    // --- FIM DA LÓGICA DE INCREMENTO ---


    const difference = targetRewardValue - displayedRewardValue;

    // Ajusta diretamente se a diferença for mínima
    if (difference > -10n && difference < 10n && displayedRewardValue !== targetRewardValue) {
        displayedRewardValue = targetRewardValue;
    } else if (difference !== 0n) {
        // Move mais devagar: 1% da diferença a cada frame (easing suave)
        // AJUSTE: Divisor aumentado de 100n para 500n para Easing mais lento
        const movement = difference / 500n; 
        displayedRewardValue += (movement === 0n && difference !== 0n) ? (difference > 0n ? 1n : -1n) : movement;
    }

    // Garante que não vá abaixo de zero
    if (displayedRewardValue < 0n) {
        displayedRewardValue = 0n;
    }

    // AJUSTE: Mudar para toFixed(3) e diminuir a fonte do $BKC
    rewardsEl.innerHTML = `${formatBigNumber(displayedRewardValue).toFixed(3)} <span class="text-xl">$BKC</span>`; // Atualiza UI

    animationFrameId = requestAnimationFrame(animateClaimableRewards);
}

function startRewardAnimation(initialTargetValue) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId); // Para animação anterior se houver
    targetRewardValue = initialTargetValue;
    // Inicia a animação exibindo 99% do valor, ou 0 se o valor for 0
    displayedRewardValue = targetRewardValue > 0n ? (targetRewardValue * 99n) / 100n : 0n;
    lastUpdateTime = performance.now(); // Inicia o contador de tempo AGORA
    animateClaimableRewards();
}
// --- FIM DA ANIMAÇÃO ---

// --- Funções do Modal ---
function openDelegateModal(validatorAddress) {
    const balanceNum = formatBigNumber(State.currentUserBalance || 0n); // Usa fallback 0n
    const balanceLocaleString = balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
            <div class="flex justify-between"><span class="text-zinc-400">Fee (0.5%):</span><span id="delegateFeeAmount">0.0000 $BKC</span></div>
            <div class="flex justify-between"><span class="text-zinc-400">Net Delegate Amount:</span><span id="delegateNetAmount">0.0000 $BKC</span></div>
            <div class="flex justify-between"><span class="text-zinc-400">Estimated pStake:</span><span id="delegateEstimatedPStake" class="font-bold text-purple-400">0</span></div>
        </div>

        <button id="confirmDelegateBtn" class="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2.5 px-4 rounded-md transition-colors btn-disabled" disabled>
            Confirm Delegation
        </button>
    `;
    openModal(content);

    // Adiciona listeners aos elementos do modal
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
        let amount = 0n;
        let fee = 0n;
        let netAmount = 0n;

        try {
            // Garante que o input seja tratado como string para o parseUnits
            amount = ethers.parseUnits(amountStr.toString(), 18);
            if (amount < 0n) amount = 0n;
        } catch { amount = 0n; }

        const balanceBigInt = State.currentUserBalance || 0n;
        if (amount > balanceBigInt) {
            amount = balanceBigInt;
            amountInput.value = ethers.formatUnits(amount, 18);
        }

        if (amount > 0n) {
            const feeBips = 50; // Usando valor fixo corrigido
            fee = (amount * BigInt(feeBips)) / 10000n;
            netAmount = amount - fee;
            confirmBtn.disabled = netAmount <= 0n;
            confirmBtn.classList.toggle('btn-disabled', netAmount <= 0n);
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('btn-disabled');
        }

        durationDisplay.textContent = `${durationDays} days`;
        feeAmountEl.textContent = `${formatBigNumber(fee).toFixed(4)} $BKC`;
        netAmountEl.textContent = `${formatBigNumber(netAmount).toFixed(4)} $BKC`;
        const pStake = netAmount > 0n ? (netAmount / BigInt(1e18)) * BigInt(durationDays) : 0n;
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
             const feeBips = 50; // Usa o mesmo valor da correção
            const fee = (totalAmountWei * BigInt(feeBips)) / 10000n;
            const netAmount = totalAmountWei - fee;
            if (netAmount <= 0n) {
                 showToast("Net amount after fee is zero or less.", "error"); return;
            }

            const success = await executeDelegation(validatorAddress, totalAmountWei, durationSeconds, confirmBtn);
            if (success) {
                closeModal();
                await DashboardPage.render(true); // Força recarregamento completo
            }
        } catch (err) {
            console.error("Error processing delegation data:", err);
            const message = err.reason || err.data?.message || err.message || 'Invalid input or transaction rejected.';
            showToast(`Delegation Error: ${message}`, "error");
        }
    });
    updateDelegatePreview();
}

// ====================================================================
// LISTENERS (ABA E AÇÕES)
// ====================================================================

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
            void targetContent.offsetWidth; // Force reflow
            targetContent.classList.add('active');
        } else { return; }

        // Lazy Loading das Abas
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
            const parent = linkButton.closest('.bg-main'); // Encontra o card pai
            if (parent) {
                 const actionIndicatorSpan = parent.querySelector('.ml-auto'); // Encontra o span original (Find Tx/View Tx)
                 if (actionIndicatorSpan) {
                     actionIndicatorSpan.replaceWith(newLink); // Substitui o span pelo link
                 } else {
                     // Fallback se não encontrar o span
                     const detailsDiv = parent.querySelector('.pl-8');
                     if(detailsDiv) detailsDiv.appendChild(newLink);
                 }
                 linkButton.remove(); // Remove o botão original (que era o card todo)
            } else {
                linkButton.parentNode.replaceChild(newLink, linkButton); // Fallback
            }

        } else {
            showToast("Could not find transaction hash. Event might be too old.", "error");
            const failText = document.createElement('span');
            failText.className = 'text-xs text-zinc-500 italic ml-auto';
            failText.textContent = '(Hash not found)';
             const parent = linkButton.closest('.bg-main'); // Encontra o card pai
             if (parent) {
                  const actionIndicatorSpan = parent.querySelector('.ml-auto'); // Encontra o span original (Find Tx/View Tx)
                  if (actionIndicatorSpan) {
                      actionIndicatorSpan.replaceWith(failText); // Substitui pelo texto de falha
                  }
                 linkButton.remove(); // Remove o botão original
             } else {
                   linkButton.parentNode.replaceChild(failText, linkButton); // Fallback
             }
        }
    });
    historyContainer._lazyListenersAttached = true;
}

function setupDashboardActionListeners() {
    const dashboardElement = DOMElements.dashboard;
    // Garante que o elemento exista antes de adicionar listener
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
                // Usa o targetRewardValue que está sendo atualizado pela animação
                const { stakingRewards, minerRewards } = await calculateUserTotalRewards(); // Busca valores reais para transação
                const success = await executeUniversalClaim(stakingRewards, minerRewards, target); // Usa valores reais na tx
                if (success) {
                    // Após claim, reseta a animação com 0
                    startRewardAnimation(0n);
                    await DashboardPage.render(true); // Recarrega
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
                if (validatorAddr) openDelegateModal(validatorAddr);
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
        const { totalRewards } = await calculateUserTotalRewards(); // Pega o valor real
        const maxClaimAmount = formatBigNumber(totalRewards);
        const baseClaimAmount = formatBigNumber(totalRewards / 2n);
        const potentialGain = maxClaimAmount - baseClaimAmount;

        if (!efficiencyData || efficiencyData.highestBoost === 0) {
            el.innerHTML = `
                <div class="bg-main border border-border-color rounded-xl p-5 text-center flex flex-col items-center">
                    <i class="fa-solid fa-rocket text-5xl text-amber-400 mb-3 animate-pulse"></i>
                    <p class="font-bold text-2xl text-white mb-2">Boost Your Earnings!</p>
                    <p class="text-md text-zinc-400 max-w-sm mb-4">Acquire a <strong>Booster NFT</strong> to increase your reward claim rate from 50% up to 100%!</p>
                    ${totalRewards > 0n ?
                        `<p class="text-sm text-zinc-400 mt-3">You are leaving <strong class="text-red-400">${potentialGain.toFixed(2)} <span class="text-sm">$BKC</span></strong> on the table without a booster!</p>
                         <p class="text-xs text-zinc-500 mt-1">Don't miss out - maximize your rewards.</p>`
                        : '<p class="text-sm text-zinc-400 mt-3">Start delegating and get a Booster NFT to maximize future rewards!</p>'
                    }
                    <button class="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-900 font-bold py-2.5 px-6 rounded-lg text-lg mt-6 shadow-lg hover:shadow-xl transition-all go-to-store w-full">
                        <i class="fa-solid fa-store mr-2"></i> Get Your Booster!
                    </button>
                </div>`;
            return;
        }

        const boostPercent = efficiencyData.highestBoost / 100;
        const currentClaimEfficiency = efficiencyData.efficiency;
        // Calcula o valor reivindicável com base na eficiência atual
        const currentClaimAmount = formatBigNumber((totalRewards * BigInt(Math.round(currentClaimEfficiency * 100))) / 10000n);
        const unclaimedAmount = maxClaimAmount - currentClaimAmount;
        let subText = currentClaimEfficiency === 100
            ? `You're claiming <strong>100% (2x)</strong> of your rewards!`
            : `Your +${boostPercent}% boost brings your claim rate to <strong>${currentClaimEfficiency.toFixed(0)}%</strong>. ${unclaimedAmount > 0.0001 ? `Missing out on ${unclaimedAmount.toFixed(4)} $BKC.` : ''}`;

        el.innerHTML = `
            <div class="bg-main border border-border-color rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
                <img src="${efficiencyData.imageUrl || './assets/bkc_logo_3d.png'}" alt="${efficiencyData.boostName}" class="w-20 h-20 rounded-md object-cover border border-zinc-700 nft-clickable-image" data-address="${addresses.rewardBoosterNFT}" data-tokenid="${efficiencyData.tokenId || ''}">
                <div class="flex-1 text-center sm:text-left">
                    <p class="font-bold text-lg">${efficiencyData.boostName}</p>
                    <p class="text-2xl font-bold text-green-400 mt-1">+${boostPercent}% Reward Boost</p>
                    <p class="text-sm text-zinc-400">${subText}</p>
                </div>
            </div>`;
    } catch (error) {
        console.error("Error rendering reward efficiency panel:", error);
        renderError(el, "Error loading booster status."); // Usa renderError
    }
}

function renderValidatorsList() {
    const listEl = document.getElementById('top-validators-list');
    if (!listEl) return;
    if (!State.allValidatorsData) { renderLoading(listEl); return; }

    const sortedData = [...State.allValidatorsData].sort((a, b) => Number(b.pStake - a.pStake));

    const generateValidatorHtml = (validator) => { /* ... HTML como antes ... */
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
                    Delegate
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

    renderLoading(listEl); // Mostra loader antes de buscar
    try {
        const delegationsRaw = await safeContractCall(State.delegationManagerContract, 'getDelegationsOf', [State.userAddress], []);
        State.userDelegations = delegationsRaw.map((d, index) => ({
            amount: d[0], unlockTime: d[1], lockDuration: d[2], validator: d[3], index, txHash: null
        }));
        const delegations = State.userDelegations;

        if (!delegations || delegations.length === 0) { renderNoData(listEl, "You have no active delegations."); return; }

        // Mapeia as delegações para HTML (agora sem chamada de contrato extra)
        const html = delegations.map((d) => {
            const amount = d.amount;
            const amountFormatted = formatBigNumber(amount);

            // --- CORREÇÃO pStake Zerado ---
            let pStake = 0n;
            const lockDurationBigInt = BigInt(d.lockDuration);
            const amountBigInt = BigInt(d.amount);
            const ONE_DAY_SECONDS = 86400n;
            const ETHER_DIVISOR = 10n**18n;

            if (lockDurationBigInt > 0n && amountBigInt > 0n && ONE_DAY_SECONDS > 0n && ETHER_DIVISOR > 0n) {
                // Realiza a divisão inteira com BigInt
                const amountInEther = amountBigInt / ETHER_DIVISOR;
                const durationInDays = lockDurationBigInt / ONE_DAY_SECONDS;
                pStake = amountInEther * durationInDays;
            }
            // --- FIM DA CORREÇÃO ---

            const unlockTimestamp = Number(d.unlockTime);
            const isLocked = unlockTimestamp > (Date.now() / 1000);
            const penaltyAmount = formatBigNumber(amount / 2n); // 50% penalty
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
                                    ? `<button title="Force unstake with 50% penalty" class="bg-red-900/50 hover:bg-red-900/80 text-red-400 font-bold py-2 px-3 rounded-md text-sm force-unstake-btn flex-1 sm:flex-none" data-index="${d.index}"><i class="fa-solid fa-lock mr-1"></i> Force</button>` 
                                    : ''}
                                <button class="${isLocked ? 'btn-disabled' : 'bg-amber-500 hover:bg-amber-600 text-zinc-900'} font-bold py-2 px-3 rounded-md text-sm unstake-btn flex-1 sm:flex-none" data-index="${d.index}" ${isLocked ? 'disabled' : ''}><i class="fa-solid fa-unlock mr-1"></i> Unstake</button>
                            </div>
                        </div>
                        <div class="delegation-penalty-text mt-2 pt-2 border-t border-border-color/50 text-xs ${isLocked ? 'text-red-400/80' : 'text-green-400'}">
                           ${isLocked ? `<strong>Penalty (Force Unstake):</strong> 50% (~${penaltyAmount.toFixed(4)} $BKC)` : `Unstake Fee: 1%`}
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

    renderLoading(listEl); // Mostra loader antes de buscar
    try {
        await loadMyCertificates(); // Recarrega os certificados
        const certificates = State.myCertificates;

        if (!certificates || certificates.length === 0) { renderNoData(listEl, "No vesting certificates found."); return; }

        const certificatePromises = certificates.map(async ({ tokenId }) => { 
             const position = await safeContractCall(State.rewardManagerContract, 'vestingPositions', [tokenId], {totalAmount: 0n, startTime: 0n});
            if (position.startTime === 0n) return ''; // Skip if position data is invalid

            const totalAmount = position.totalAmount;
            const startTime = Number(position.startTime);
            const formattedAmount = formatBigNumber(totalAmount);
            const startDate = new Date(startTime * 1000).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
            const startTimeStr = new Date(startTime * 1000).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

            let tierName = 'bronze'; let metadataFileName = 'bronze.json'; let tierColor = 'text-yellow-600';
            if (formattedAmount > 10000) { tierName = 'diamond'; metadataFileName = 'diamond.json'; tierColor = 'text-cyan-400'; }
            else if (formattedAmount > 5000) { tierName = 'gold'; metadataFileName = 'gold.json'; tierColor = 'text-amber-400'; }
            else if (formattedAmount > 1000) { tierName = 'silver'; metadataFileName = 'silver.json'; tierColor = 'text-gray-400'; }

            const tokenURI = VESTING_CERT_BASE_URI + metadataFileName;
            let imageUrl = './assets/bkc_logo_3d.png'; let displayName = `Vesting Certificate #${tokenId.toString()}`;

            try {
                const response = await fetch(tokenURI.replace("ipfs://", ipfsGateway));
                if (response.ok) {
                    const metadata = await response.json();
                    imageUrl = metadata.image ? metadata.image.replace("ipfs://", ipfsGateway) : imageUrl;
                    displayName = metadata.name || displayName;
                }
            } catch (e) { console.warn(`Could not fetch certificate metadata (${tokenId}):`, e); }

            return `
                <div class="p-3 bg-main border border-border-color rounded-lg flex items-center gap-4">
                    <img src="${imageUrl}" alt="${displayName}" class="w-12 h-12 rounded-md object-cover nft-clickable-image" data-address="${addresses.rewardManager}" data-tokenid="${tokenId.toString()}">
                    <div class="flex-1 min-w-0">
                        <p class="font-bold ${tierColor} truncate">${displayName}</p>
                        <p class="text-sm text-zinc-400">${formattedAmount.toFixed(2)} $BKC</p>
                        <p class="text-xs text-zinc-500 mt-1">Acquired: ${startDate} ${startTimeStr}</p>
                    </div>
                    <a href="#" data-target="rewards" class="ml-auto text-sm text-amber-500 hover:text-amber-400 go-to-rewards">Details</a>
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

// (renderActivityItem e renderActivityHistory como na resposta anterior)
/**
 * Renderiza um item de atividade (Histórico).
 */
function renderActivityItem(item) {
    const timestamp = Number(item.timestamp);
    const date = new Date(timestamp * 1000).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
    const time = new Date(timestamp * 1000).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

    let title = 'On-chain Action', icon = 'fa-exchange-alt', color = 'text-zinc-500', details = 'General transaction.', itemId = null;

    switch(item.type) {
        case 'Delegation': title = `Delegation`; icon = 'fa-shield-halved'; color = 'text-purple-400'; details = `Delegated ${formatBigNumber(item.amount).toFixed(2)} to ${formatAddress(item.details.validator)}`; itemId = item.details.index; break;
        case 'Unstake': title = `Unstake`; icon = 'fa-unlock'; color = 'text-green-400'; details = `Unstaked ${formatBigNumber(item.amount).toFixed(2)} (#${item.details.index})`; itemId = item.details.index; break;
        // AJUSTE: Manteve o ícone 'fa-triangle-exclamation' para Forçada, pois 'fa-lock' foi para o botão
        case 'ForceUnstake': title = `Forced Unstake`; icon = 'fa-triangle-exclamation'; color = 'text-red-400'; details = `Penalty ${formatBigNumber(item.amount).toFixed(2)} (#${item.details.index})`; itemId = item.details.index; break;
        case 'ClaimRewards': title = `Rewards Claimed`; icon = 'fa-gift'; color = 'text-amber-400'; details = `Received ${formatBigNumber(item.amount).toFixed(2)} $BKC`; itemId = null; break;
        case 'VestingCertReceived': title = `Certificate Received`; icon = 'fa-id-card-clip'; color = 'text-cyan-400'; details = `Vesting ${formatBigNumber(item.amount).toFixed(2)} (#${item.details.tokenId})`; itemId = item.details.tokenId; break;
        case 'BoosterNFT': title = `Booster Acquired`; icon = 'fa-gem'; color = 'text-green-400'; details = `Tier: ${item.details.tierName}`; itemId = item.details.tokenId; break;
        // Adicionar outros tipos aqui...
    }

    const txHash = item.txHash;
    let Tag, tagAttributes, hoverClass, cursorClass, actionIndicator = '';
    const supportsLazySearch = ['Delegation', 'VestingCertReceived' /*, 'Unstake', 'ForceUnstake'*/].includes(item.type);

    if (txHash) { // Link Direto
        Tag = 'a'; tagAttributes = `href="${EXPLORER_BASE_URL}${txHash}" target="_blank" rel="noopener noreferrer" title="View Transaction on Explorer"`; hoverClass = 'hover:bg-main/70 group'; cursorClass = 'cursor-pointer';
        actionIndicator = `<span class="text-xs text-blue-400/80 group-hover:text-blue-300 transition-colors ml-auto">View Tx <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i></span>`;
    } else if (supportsLazySearch && itemId !== undefined && itemId !== null) { // Botão Lazy
        Tag = 'button'; tagAttributes = `data-type="${item.type}" data-id="${itemId}" title="Click to find transaction (may take time)"`; hoverClass = 'hover:bg-main/70 group lazy-tx-link'; cursorClass = 'cursor-pointer';
        actionIndicator = `<span class="text-xs text-amber-500/80 group-hover:text-amber-400 transition-colors ml-auto">Find Tx <i class="fa-solid fa-magnifying-glass ml-1"></i></span>`;
    } else { // Div Não Clicável
        Tag = 'div'; tagAttributes = `title="Transaction details unavailable"`; hoverClass = ''; cursorClass = 'cursor-default opacity-80';
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
        await loadMyBoosters(); // Garante que boosters estejam carregados

        const allActivities = [];
        const now = Math.floor(Date.now() / 1000);

        // Delegações
        State.userDelegations?.forEach(d => {
            const startTime = Number(d.unlockTime) - Number(d.lockDuration);
            allActivities.push({ type: 'Delegation', amount: d.amount, timestamp: startTime, details: { validator: d.validator, index: d.index }, txHash: null, itemId: d.index });
        });

        // Certificados
        const certPromises = State.myCertificates?.map(async (cert) => {
            const position = await safeContractCall(State.rewardManagerContract, 'vestingPositions', [cert.tokenId], {totalAmount: 0n, startTime: 0n});
            if (position.startTime > 0) {
                 allActivities.push({ type: 'VestingCertReceived', amount: position.totalAmount, timestamp: Number(position.startTime), details: { tokenId: cert.tokenId.toString() }, txHash: null, itemId: cert.tokenId.toString() });
            }
        }) || [];
        await Promise.all(certPromises);

        // Boosters
        State.myBoosters?.forEach(b => {
            const tier = boosterTiers.find(t => t.boostBips === b.boostBips);
            allActivities.push({ type: 'BoosterNFT', amount: 0n, timestamp: b.acquisitionTime || now, details: { tokenId: b.tokenId.toString(), tierName: tier?.name || 'Unknown' }, txHash: b.txHash || null, itemId: b.tokenId.toString() });
        });

        // Claim Simulado (usando o valor alvo da animação)
        if (targetRewardValue > 0n) {
             const CLAIM_SIMULATION_TIME = now - 604800; // Simula 1 semana atrás
             allActivities.push({ type: 'ClaimRewards', amount: targetRewardValue, timestamp: CLAIM_SIMULATION_TIME, details: {}, txHash: null, itemId: null });
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
        renderError(listEl, "Failed to load activity history."); // Usa renderError importado
    }
}


// --- Main Page Rendering Function ---
export const DashboardPage = {
    hasRenderedOnce: false,

    async render(isUpdate = false) {
        console.log(`DashboardPage.render called (isUpdate: ${isUpdate}, hasRenderedOnce: ${this.hasRenderedOnce})`);

        // Configura listeners gerais do dashboard
        if (!DOMElements.dashboard._listenersInitialized && DOMElements.dashboard) {
            console.log("Setting up dashboard action listeners...");
            setupDashboardActionListeners();
            DOMElements.dashboard._listenersInitialized = true;
        }

        // Reseta estado das abas e UI (Histórico não é mais uma aba separada)
        if (!isUpdate || !State.isConnected) {
            console.log("Resetting tabs state and UI.");
            tabsState = { delegationsLoaded: false, certificatesLoaded: false }; // Remove historyLoaded
            const tabsContainer = document.getElementById('user-activity-tabs');
            const contentContainer = document.getElementById('user-activity-content');
            if (tabsContainer && contentContainer) {
                 tabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                 tabsContainer.querySelector('.tab-btn[data-target="tab-overview"]')?.classList.add('active');
                 contentContainer.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
                 const overviewTab = document.getElementById('tab-overview');
                 if (overviewTab) { overviewTab.classList.remove('hidden'); overviewTab.classList.add('active'); }
            }
            // Para a animação se desconectado
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // Renderiza validadores (sempre)
        renderValidatorsList();

        const myPositionPStakeEl = document.getElementById('statUserPStake');
        const myPositionRewardsEl = document.getElementById('statUserRewards');
        const dashboardClaimBtn = document.getElementById('dashboardClaimBtn');
        const efficiencyPanel = document.getElementById('reward-efficiency-panel');
        const historyListContainer = document.getElementById('activity-history-list-container'); // Container do histórico (agora no Overview)

        // --- Estado Desconectado ---
        if (!State.isConnected) {
            console.log("Rendering disconnected state.");
            if(myPositionPStakeEl) myPositionPStakeEl.textContent = '--';
            if(myPositionRewardsEl) myPositionRewardsEl.textContent = '-- $BKC';
            if(dashboardClaimBtn) { dashboardClaimBtn.classList.add('opacity-0', 'btn-disabled'); dashboardClaimBtn.disabled = true; }
            if(efficiencyPanel) efficiencyPanel.innerHTML = '<p class="text-center text-zinc-400 p-4">Connect your wallet to view your status.</p>';
            // Limpa conteúdo das outras abas e histórico
            const delegationList = document.getElementById('my-delegations-list');
            const certList = document.getElementById('my-certificates-list');
            if(delegationList) renderNoData(delegationList, "Connect your wallet.");
            if(certList) renderNoData(certList, "Connect your wallet.");
            if(historyListContainer) renderNoData(historyListContainer, "Connect your wallet."); // Limpa histórico também
            this.hasRenderedOnce = false;
            return;
        }

        // --- Estado Conectado ---
        console.log("Rendering connected state...");

        // Mostra loaders na Visão Geral apenas no primeiro carregamento
        if (!this.hasRenderedOnce && !isUpdate) {
            console.log("First render: Showing loaders for Overview tab.");
            if(myPositionPStakeEl) renderLoading(myPositionPStakeEl);
            if(myPositionRewardsEl) myPositionRewardsEl.textContent = 'Loading...'; // Placeholder para animação
            if(efficiencyPanel) renderLoading(efficiencyPanel);
            if(historyListContainer) renderLoading(historyListContainer); // Loader para histórico
        }

        try {
            console.log("Loading user data and rewards...");
            if (!State.allValidatorsData || State.allValidatorsData.length === 0) {
                 await loadPublicData();
                 renderValidatorsList();
            }
            await loadUserData();
            const rewardsData = await calculateUserTotalRewards();
            console.log("Data loaded. Updating UI...");

            // Atualiza a Aba "Visão Geral"
            if (myPositionPStakeEl) {
                myPositionPStakeEl.textContent = formatPStake(State.userTotalPStake || 0n);
            }

            // Inicia/Atualiza Animação de Recompensas
            if (myPositionRewardsEl && dashboardClaimBtn) {
                startRewardAnimation(rewardsData.totalRewards); // Inicia a animação com o valor real
                // Botão de claim (agora desabilitado/habilitado com base no valor real)
                dashboardClaimBtn.disabled = rewardsData.totalRewards === 0n;
                dashboardClaimBtn.classList.toggle('opacity-0', rewardsData.totalRewards === 0n);
                dashboardClaimBtn.classList.toggle('btn-disabled', rewardsData.totalRewards === 0n);
            }

            // Renderiza painel de eficiência
            console.log("Rendering reward efficiency...");
            const efficiencyData = await getHighestBoosterBoost();
            await renderRewardEfficiencyPanel(efficiencyData);
            console.log("Reward efficiency rendered.");

            // Renderiza Histórico (agora parte do Overview)
            // Renderiza sempre que a aba overview está ativa
            console.log("Rendering activity history in Overview...");
            await renderActivityHistory();
            console.log("Activity history rendered.");


        } catch (error) {
            console.error("Error loading/rendering essential dashboard data:", error);
            if(myPositionPStakeEl) myPositionPStakeEl.textContent = 'Error';
            if(myPositionRewardsEl) myPositionRewardsEl.textContent = 'Error';
            if(efficiencyPanel) renderError(efficiencyPanel, "Failed to load user data.");
            if(historyListContainer) renderError(historyListContainer, "Failed to load history.");
             // Para a animação em caso de erro
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // Configura listeners das abas restantes
        setupActivityTabListeners();

        // Se for uma atualização, força recarregamento da aba ativa (se não for Overview)
        if (isUpdate) {
            console.log("Handling update: Reloading active tab content (if not Overview)...");
            const activeTabButton = document.querySelector('#user-activity-tabs .tab-btn.active');
            if (activeTabButton) {
                const activeTabId = activeTabButton.dataset.target;
                 // Recarrega histórico apenas se for um update geral e não só da animação
                // await renderActivityHistory(); // Movido para ser renderizado sempre no overview

                // Recarrega outras abas se estiverem ativas e não carregadas
                console.log(`Active tab is: ${activeTabId}. Checking reload need.`);
                if (activeTabId === 'tab-delegations') {
                    tabsState.delegationsLoaded = false; // Força recarga na próxima vez
                    await renderMyDelegations(); // Recarrega agora
                    tabsState.delegationsLoaded = true;
                } else if (activeTabId === 'tab-certificates') {
                     tabsState.certificatesLoaded = false; // Força recarga na próxima vez
                     await renderMyCertificatesDashboard(); // Recarrega agora
                     tabsState.certificatesLoaded = true;
                }
            }
        }

        // Marca que o primeiro render foi concluído
        if (!isUpdate) {
            this.hasRenderedOnce = true;
            console.log("hasRenderedOnce set to true.");
        }
    }
};