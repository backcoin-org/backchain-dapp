// pages/DashboardPage.js
// Gerencia a página principal (Dashboard), exibindo estatísticas
// da rede, TVL, e um resumo da posição do usuário (pStake, recompensas, etc.).

// --- IMPORTAÇÕES E CONFIGURAÇÕES ---
// Importa bibliotecas, estado global, elementos do DOM,
// funções de dados, transações, utils e configuração.
const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import {
    loadUserData, 
    loadMyCertificatesFromAPI, 
    calculateUserTotalRewards,
    getHighestBoosterBoostFromAPI, 
    loadPublicData, 
    safeContractCall, 
    loadMyBoostersFromAPI, 
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
// Variáveis de estado para paginação e URLs.
let activityCurrentPage = 1;
const EXPLORER_BASE_URL = "https://sepolia.etherscan.io/tx/";

// Estado para carregamento 'lazy' das abas (Delegations, Certificates)
let tabsState = {
    delegationsLoaded: false,
    certificatesLoaded: false,
};

// --- ANIMAÇÃO DE RECOMPENSAS ---
// Funções para animar o contador de recompensas do usuário
// de forma suave (de X para Y) em vez de uma mudança abrupta.
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
// Funções para abrir e gerenciar modais interativos,
// como o modal de delegação.
async function openDelegateModal(validatorAddress) {
    if (!State.isConnected) return showToast("Please connect your wallet first.", "error");
    if (!State.ecosystemManagerContract) return showToast("EcosystemManager not loaded.", "error");

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

    // Adiciona listeners internos do modal
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

// --- SETUP DE LISTENERS ---
// Funções que anexam os event listeners na página.
// Usam delegação de eventos para eficiência.

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

        // Carrega o conteúdo da aba sob demanda
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

// Listener para o histórico de atividades (busca de TX)
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

        // A lógica de busca de hash (findTxHashForItem) foi removida
        // das importações, então simulamos uma falha.
        const txHash = null; 

        if (txHash) {
            // (Este bloco não será executado com txHash = null)
            showToast("Transaction found! Opening explorer.", "success");
            window.open(`${EXPLORER_BASE_URL}${txHash}`, '_blank');
            const newLink = document.createElement('a');
            newLink.href = `${EXPLORER_BASE_URL}${txHash}`;
            // ... (criação do link)
            linkButton.parentNode.replaceChild(newLink, linkButton);

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

// Listener principal para ações do Dashboard
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

        // Lista de IDs/Classes que precisam de preventDefault
        const needsPrevent = ['dashboardClaimBtn', 'unstake-btn', 'force-unstake-btn', 'delegate-link', 'go-to-store', 'nft-clickable-image', 'go-to-rewards'];
        if (needsPrevent.some(cls => target.id === cls || target.classList.contains(cls))) {
            e.preventDefault();
        }

        try {
            // Botão "Claim"
            if (target.id === 'dashboardClaimBtn') {
                const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
                const success = await executeUniversalClaim(stakingRewards, minerRewards, target);
                if (success) {
                    startRewardAnimation(0n);
                    await DashboardPage.render(true);
                }
            // Botão "Unstake"
            } else if (target.classList.contains('unstake-btn')) {
                const index = target.dataset.index;
                const success = await executeUnstake(Number(index));
                if (success) await DashboardPage.render(true);
            // Botão "Force Unstake"
            } else if (target.classList.contains('force-unstake-btn')) {
                const index = target.dataset.index;
                const success = await executeForceUnstake(Number(index)); 
                if (success) await DashboardPage.render(true);
            // Link "Delegate"
            } else if (target.classList.contains('delegate-link')) {
                const validatorAddr = target.dataset.validator;
                if (validatorAddr) await openDelegateModal(validatorAddr);
            // Atalho "Go to Store"
            } else if (target.classList.contains('go-to-store')) {
                // AJUSTE CRÍTICO: Usa uma função global de navegação (seu roteador deve definir isso)
                if (typeof window.navigateToPage === 'function') {
                    window.navigateToPage('store');
                } else {
                    document.querySelector('.sidebar-link[data-target="store"]')?.click();
                }
            // Imagem de NFT (Adicionar à Carteira)
            } else if (target.classList.contains('nft-clickable-image')) {
                const address = target.dataset.address;
                const tokenId = target.dataset.tokenid;
                if (address && tokenId) addNftToWallet(address, tokenId);
            // Atalho "Go to Rewards"
            } else if (target.classList.contains('go-to-rewards')) {
                // AJUSTE CRÍTICO: Usa uma função global de navegação (seu roteador deve definir isso)
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
// Funções que constroem e injetam o HTML para
// componentes específicos do Dashboard.

/**
 * Renderiza o painel de eficiência de recompensas (Booster NFT).
 */
async function renderRewardEfficiencyPanel(efficiencyData) {
    const el = document.getElementById('reward-efficiency-panel');
    if (!el) return;

    try {
        const { totalRewards } = await calculateUserTotalRewards();

        // Usuário não tem Booster
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

        // Usuário tem Booster
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

/**
 * Renderiza a lista (top 5) de validadores da rede.
 */
function renderValidatorsList() {
    const listEl = document.getElementById('top-validators-list');
    if (!listEl) return;

    // Se conectado, mas com saldo baixo, mostra o card "Buy $BKC"
    // --- (REFA) INÍCIO: Lógica de Saldo Baixo Aprimorada ---
    // (Verifica se o saldo é menor que, por ex, 10 BKC, em vez de apenas === 0)
    const minBalanceToShowBuy = ethers.parseEther("10"); 
    if (State.isConnected && State.currentUserBalance < minBalanceToShowBuy) {
    // --- (REFA) FIM ---
        
        // AJUSTE: Usar addresses.bkcDexPoolAddress (o novo campo com a URL)
        const buyBkcLink = addresses.bkcDexPoolAddress || '#'; 
        
        listEl.innerHTML = `
            <div class="col-span-1">
                <div class="text-center p-6 border border-red-500/50 bg-red-500/10 rounded-lg space-y-3">
                    <i class="fa-solid fa-circle-exclamation text-3xl text-red-400"></i>
                    <h3 class="lg font-bold">Insufficient Balance</h3>
                    <p class="text-sm text-zinc-300">You need $BKC to delegate.</p>
                    <a href="${buyBkcLink}" target="_blank" rel="noopener noreferrer" class="inline-block bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2 px-4 rounded-lg text-sm mt-3">
                        <i class="fa-solid fa-shopping-cart mr-2"></i> Buy $BKC
                    </a>
                </div>
            </div>
        `;
        return; // Para a execução
    }
    
    // Se os dados dos validadores ainda não carregaram
    if (!State.allValidatorsData) { 
        renderLoading(listEl); 
        return; 
    }

    const sortedData = [...State.allValidatorsData].sort((a, b) => Number(b.pStake - a.pStake));

    const generateValidatorHtml = (validator) => {
         // Corrigido para usar 'totalDelegatedAmount' para consistência
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
                        <span class="font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis">${formatBigNumber(totalDelegatedAmount).toFixed(2)} $BKC</span>
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

/**
 * Renderiza a lista de delegações ativas do usuário (na aba "Delegations").
 */
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

/**
 * Renderiza a lista de certificados de vesting do usuário (na aba "Certificates").
 */
async function renderMyCertificatesDashboard() {
    const listEl = document.getElementById('my-certificates-list');
    if (!listEl) return;
    if (!State.isConnected) { renderNoData(listEl, "Connect your wallet to view certificates."); return; }

    renderLoading(listEl);
    try {
        await loadMyCertificatesFromAPI(); // Usa a função da API
        const certificates = State.myCertificates;

        if (!certificates || certificates.length === 0) { renderNoData(listEl, "No vesting certificates found."); return; }
        
        const rewardManagerAddress = State.rewardManagerContract.target || addresses.rewardManager;
        const vestingDuration = Number(await safeContractCall(State.rewardManagerContract, 'VESTING_DURATION', [], 5n * 365n * 86400n));


        const certificatePromises = certificates.map(async ({ tokenId }) => { 
            const position = await safeContractCall(State.rewardManagerContract, 'vestingPositions', [tokenId], {totalAmount: 0n, startTime: 0n});
            if (position.startTime === 0n) return '';

            const tokenURI = await safeContractCall(State.rewardManagerContract, 'tokenURI', [tokenId], "");
            if (!tokenURI) {
                console.warn(`Could not get tokenURI for certificate ${tokenId}`);
                return ''; // Pula este certificado
            }
            
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

            let imageUrl = './assets/bkc_logo_3d.png'; // Fallback
            let displayName = `Vesting Certificate #${tokenId.toString()}`;
            let tierColor = 'text-cyan-400'; // Cor padrão

            try {
                const response = await fetch(tokenURI.replace("ipfs://", ipfsGateway));
                if (response.ok) {
                    const metadata = await response.json();
                    imageUrl = metadata.image ? metadata.image.replace("ipfs://", ipfsGateway) : imageUrl;
                    displayName = metadata.name || displayName;
                }
            } catch (e) { console.warn(`Could not fetch certificate metadata (${tokenId}) from ${tokenURI}:`, e); }
            
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

/**
 * Renderiza um item individual do histórico de atividades.
 */
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

    // Lógica de parsing robusta para 'item.amount' vindo da API
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
    
    // Mapeia tipos de eventos da API para strings amigáveis
    switch(item.type) {
        case 'Delegation': title = `Delegation`; icon = 'fa-shield-halved'; color = 'text-purple-400'; details = `Delegated ${formattedAmount} to ${formatAddress(itemDetails.validator)}`; itemId = itemDetails.index; break;
        case 'VestingCertReceived': title = `Certificate Received`; icon = 'fa-id-card-clip'; color = 'text-cyan-400'; details = `Vesting ${formattedAmount} (#${itemDetails.tokenId})`; itemId = itemDetails.tokenId; break;
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
        case 'CertificateWithdrawn': 
            title = `Certificate Withdrawn`; icon = 'fa-money-bill-transfer'; color = 'text-cyan-400'; 
            details = `Withdrew ${formattedAmount} $BKC (#${itemDetails.tokenId})`;
            if(itemDetails.penaltyAmount && BigInt(itemDetails.penaltyAmount) > 0n) { details += ` (Penalty: ${formatBigNumber(BigInt(itemDetails.penaltyAmount)).toFixed(2)})`; }
            itemId = itemDetails.tokenId; break;
        case 'MinerRewardClaimed': 
            title = `Miner Rewards Claimed`; icon = 'fa-pickaxe'; color = 'text-blue-400'; 
            details = `Claimed ${formattedAmount} $BKC from mining`; 
            itemId = null; break;
        case 'TigerGameWin': 
            title = `Tiger Game Win`; icon = 'fa-trophy'; color = 'text-yellow-400'; 
            details = `Won ${formattedAmount} $BKC (Wagered: ${formatBigNumber(BigInt(itemDetails.wagered || 0n)).toFixed(2)})`; 
            itemId = null; 
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
        case 'GamePlayed': 
            title = `Tiger Game Play`; icon = 'fa-dice'; color = 'text-zinc-500'; 
            details = `Wagered ${formatBigNumber(BigInt(itemDetails.wagered || 0n)).toFixed(2)} $BKC`; 
            itemId = null; 
            break;
        default:
             title = item.type || 'Unknown Action';
             icon = 'fa-question-circle';
             color = 'text-zinc-500';
             details = item.description || `Activity of type ${item.type}`;
             itemId = null;
             break;
    }
    
    // Lógica para exibir link do Etherscan ou botão "Find Tx"
    const txHash = item.txHash;
    let Tag, tagAttributes, hoverClass, cursorClass, actionIndicator = '';
    const supportsLazySearch = ['Delegation', 'VestingCertReceived', 'Unstake', 'ForceUnstake', 'CertificateWithdrawn', 'NFTBuy', 'NFTSell', 'PublicSaleBuy', 'NotaryRegister'].includes(item.type);
    
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
                <p class_broker.md="text-sm text-zinc-400 truncate">${details}</p>
            </div>
        </${Tag}>
    `;
}

/**
 * Busca e renderiza o histórico de atividades da API.
 */
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
// Funções que buscam e renderizam dados que
// não dependem de um usuário conectado (TVL, Stats da Rede).

/**
 * Carrega e renderiza o TVL (Total Value Locked) do protocolo.
 * (AJUSTADO PARA INCLUIR PISCINA DEX)
 */
async function loadAndRenderProtocolTVL() {
    const tvlPanelEl = document.getElementById('protocol-tvl-panel'); 
    const tvlValueEl = document.getElementById('protocol-tvl-value'); 
    const tvlPercEl = document.getElementById('protocol-tvl-percentage'); 
    const statLockedPercentageEl = document.getElementById('statLockedPercentage');
    const statTotalSupplyEl = document.getElementById('statTotalSupply'); 
    const tvlStakingEl = document.getElementById('tvl-detail-staking');
    const tvlVestingEl = document.getElementById('tvl-detail-vesting');
    const tvlGameEl = document.getElementById('tvl-detail-game');
    const tvlPoolEl = document.getElementById('tvl-detail-nftpool');
    const tvlDexEl = document.getElementById('tvl-detail-dex'); // <-- NOVO ELEMENTO

    if (!tvlValueEl) { 
        console.warn("TVL panel elements not found. Skipping TVL load.");
        return;
    }
    
    tvlValueEl.innerHTML = '<div class="loader !w-5 !h-5 inline-block"></div>';
    tvlPercEl.textContent = 'Calculating...';
    if(statLockedPercentageEl) statLockedPercentageEl.innerHTML = '<div class="loader !w-5 !h-5 inline-block"></div>';
    if(statTotalSupplyEl) statTotalSupplyEl.innerHTML = '<div class="loader !w-5 !h-5 inline-block"></div>';

    try {
        let totalLocked = 0n;
        let stakingLocked = 0n, vestingLocked = 0n, gameLocked = 0n, poolLocked = 0n, dexLocked = 0n; // <-- NOVO

        if (!State.bkcTokenContractPublic || !State.delegationManagerContractPublic || !State.rewardManagerContractPublic) {
            throw new Error("Contratos públicos essenciais (bkcTokenContractPublic, etc.) não estão carregados no State.");
        }
        
        const tokenContract = State.bkcTokenContractPublic;

        // 1. Saldo do Delegation Manager (Staking)
        if (addresses.delegationManager) {
            stakingLocked = await safeContractCall(tokenContract, 'balanceOf', [addresses.delegationManager], 0n);
            totalLocked += stakingLocked;
        }
        
        // 2. Saldo do Reward Manager (Vesting)
        if (addresses.rewardManager) {
            vestingLocked = await safeContractCall(tokenContract, 'balanceOf', [addresses.rewardManager], 0n);
            totalLocked += vestingLocked;
        }

        // 3. Saldo das Pools de Jogo (Fortune Pool / Actions Manager)
        if (State.actionsManagerContractPublic) {
             gameLocked = await safeContractCall(State.actionsManagerContractPublic, 'prizePoolBalance', [], 0n);
             totalLocked += gameLocked;
        } else {
             console.warn("Dashboard: State.actionsManagerContractPublic not found, skipping game pools.");
        }

        // 4. Saldo das Pools de NFT (NFT Pool / Bonding Curve)
        if (boosterTiers) {
            const poolKeys = Object.keys(addresses).filter(k => k.startsWith('pool_'));
            // console.log(`Found ${poolKeys.length} AMM pools to check for TVL.`); // Removido para diminuir o spam
            
            for (const key of poolKeys) {
                const poolAddress = addresses[key];
                if (poolAddress && poolAddress.startsWith('0x')) {
                    const poolBalance = await safeContractCall(tokenContract, 'balanceOf', [poolAddress], 0n);
                    poolLocked += poolBalance;
                }
            }
            totalLocked += poolLocked;
        } else {
            console.warn("Dashboard: boosterTiers (config.js) not found, skipping NFT pools TVL.");
        }

        // --- (REFA) INÍCIO: Lógica para TVL da DEX ---
        // 5. Saldo da Piscina DEX (PancakeSwap)
        const dexPoolAddress = addresses.mainLPPairAddress;
        if (dexPoolAddress && dexPoolAddress.startsWith('0x') && !dexPoolAddress.includes('...')) {
            // console.log(`Checking TVL for external DEX pool: ${dexPoolAddress}`); // Removido para diminuir o spam
            dexLocked = await safeContractCall(tokenContract, 'balanceOf', [dexPoolAddress], 0n);
            totalLocked += dexLocked;
        } else {
            console.warn("Dashboard: mainLPPairAddress not set or is placeholder, skipping DEX TVL.");
        }
        // --- (REFA) FIM: Lógica para TVL da DEX ---


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
        if(tvlVestingEl) tvlVestingEl.textContent = `${formatBigNumber(vestingLocked).toFixed(0)} $BKC`;
        if(tvlGameEl) tvlGameEl.textContent = `${formatBigNumber(gameLocked).toFixed(0)} $BKC`;
        if(tvlPoolEl) tvlPoolEl.textContent = `${formatBigNumber(poolLocked).toFixed(0)} $BKC`;
        if(tvlDexEl) tvlDexEl.textContent = `${formatBigNumber(dexLocked).toFixed(0)} $BKC`; // <-- NOVO

    } catch (err) {
        console.error("Failed to load protocol TVL:", err);
        tvlValueEl.textContent = 'Error';
        tvlPercEl.textContent = 'Failed to load TVL data.';
        if(statLockedPercentageEl) statLockedPercentageEl.textContent = 'Error';
        if(statTotalSupplyEl) statTotalSupplyEl.textContent = 'Error';
    }
}

/**
 * Carrega e renderiza as estatísticas públicas do cabeçalho
 * (Validadores, pStake, Scarcity).
 */
async function loadAndRenderPublicHeaderStats() {
    const statValidatorsEl = document.getElementById('statValidators');
    const statTotalPStakeEl = document.getElementById('statTotalPStake');
    const statScarcityEl = document.getElementById('statScarcity');

    try {
        if (!State.delegationManagerContractPublic || !State.bkcTokenContractPublic) {
             throw new Error("Contratos públicos (DM ou BKC) não inicializados.");
        }

        // 1. Contagem de Validadores
        if (statValidatorsEl) {
            try {
                if (!State.allValidatorsData) {
                    const validatorsArray = await safeContractCall(State.delegationManagerContractPublic, 'getAllValidators', [], []);
                    // Inicializa a estrutura de dados (será populada por loadPublicData)
                    // Corrigido para 'totalDelegatedAmount'
                    State.allValidatorsData = validatorsArray.map(addr => ({ addr, pStake: 0n, selfStake: 0n, totalDelegatedAmount: 0n }));
                }
                statValidatorsEl.textContent = State.allValidatorsData.length.toString();
            } catch (valErr) {
                console.error("Error loading validators count:", valErr);
                statValidatorsEl.textContent = 'Error';
            }
        }
        
        // 2. Total pStake da Rede
        if (statTotalPStakeEl) {
            const totalPStake = await safeContractCall(State.delegationManagerContractPublic, 'totalNetworkPStake', [], 0n);
            State.totalNetworkPStake = totalPStake; // Salva no state
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
            console.warn("Elemento 'statScarcity' não encontrado. Verifique o ID no index.html.");
        }

    } catch (err) {
        console.error("Failed to load public header stats:", err);
        if(statValidatorsEl) statValidatorsEl.textContent = 'Error';
        if(statTotalPStakeEl) statTotalPStakeEl.textContent = 'Error';
        if(statScarcityEl) statScarcityEl.textContent = 'Error';
    }
}


// --- RENDERIZADOR PRINCIPAL DA PÁGINA ---
// O objeto 'DashboardPage' exportado, contendo a
// função principal 'render' que orquestra
// a renderização de todos os componentes da página.

export const DashboardPage = {
    hasRenderedOnce: false,
    async render(isUpdate = false) {
        console.log(`DashboardPage.render called (isUpdate: ${isUpdate}, hasRenderedOnce: ${this.hasRenderedOnce})`);
        
        if (!DOMElements.dashboard._listenersInitialized && DOMElements.dashboard) {
            console.log("Setting up dashboard action listeners...");
            setupDashboardActionListeners();
            DOMElements.dashboard._listenersInitialized = true;
        }

        // Reseta o estado das abas se for uma navegação nova ou desconexão
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
        
        // --- Renderiza Dados PÚBLICOS ---
        // (Sempre renderiza, independente da conexão)
        loadAndRenderProtocolTVL();
        loadAndRenderPublicHeaderStats();
        renderValidatorsList();
        
        // Seleciona elementos do painel do usuário
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
            const certList = document.getElementById('my-certificates-list');
            if(delegationList) renderNoData(delegationList, "Connect your wallet.");
            if(certList) renderNoData(certList, "Connect your wallet.");
            if(historyListContainer) renderNoData(historyListContainer, "Connect your wallet.");
            
            const statUserBalanceEl = document.getElementById('statUserBalance');
            if(statUserBalanceEl) statUserBalanceEl.textContent = '--';

            this.hasRenderedOnce = false;
            return;
        }

        // --- Estado: Conectado ---
        console.log("Rendering connected state...");
        
        // Mostra loaders na primeira renderização
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
            
            // Calcula e renderiza o painel de "Claim"
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
            
            startRewardAnimation(totalRewards); // Inicia a animação do contador
            
            // Renderiza painel de Booster
            console.log("Rendering reward efficiency...");
            const efficiencyData = await getHighestBoosterBoostFromAPI(); 
            await renderRewardEfficiencyPanel(efficiencyData);
            console.log("Reward efficiency rendered.");
            
            // Renderiza histórico
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

        // Se for uma atualização (ex: pós-transação), recarrega a aba ativa
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