// pages/networkstaking.js

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { loadUserData, loadPublicData, safeContractCall } from '../modules/data.js';
// CORREÇÃO CRÍTICA: Removendo payValidatorFee da importação
import { executeDelegation, registerValidator } from '../modules/transactions.js'; 
import { formatBigNumber, formatAddress, formatPStake, renderLoading, renderError, renderNoData } from '../utils.js'; 
import { openModal, showToast, closeModal } from '../ui-feedback.js';
import { addresses } from '../config.js';

// --- CONSTANTES DO MÓDULO ---
const ONE_DAY_IN_SECONDS = 86400;
const VALIDATOR_REGISTRATION_KEY = "VALIDATOR_REGISTRATION_FEE"; 
const MINERS_PER_PAGE = 10; // 10 mineradores por página
let EarnPageListenersAttached = false; 

// --- UTILS E LÓGICA DE STAKING (Mantidas) ---
function setAmountUtil(elementId, percentage) {
    const input = document.getElementById(elementId);
    if (State.currentUserBalance !== null && typeof State.currentUserBalance !== 'undefined' && input) {
        const percentageBips = BigInt(Math.floor(percentage * 10000));
        const amount = (State.currentUserBalance * percentageBips) / 10000n;
        input.value = ethers.formatUnits(amount, 18);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
}
window.setDelegateAmount = (p) => setAmountUtil('delegateAmountInput', p);

function updateDelegationFeedback() {
    const amountInput = document.getElementById('delegateAmountInput');
    const durationSlider = document.getElementById('delegateDurationSlider');
    const pStakeEl = document.getElementById('modalPStakeEl');
    const netEl = document.getElementById('modalNetAmountEl');
    const bonusTextEl = document.getElementById('durationBonusText');

    if (!amountInput || !durationSlider || !pStakeEl || !netEl || !bonusTextEl) return;

    const amountStr = amountInput.value || '0';
    const durationDays = parseInt(durationSlider.value, 10);
    
    let amountWei = 0n;
    try {
        amountWei = ethers.parseEther(amountStr);
        if (amountWei < 0n) amountWei = 0n;
    } catch {
        amountWei = 0n;
    }

    const netAmountWei = amountWei; 
    
    const durationBigInt = BigInt(durationDays);
    const etherDivisor = 1_000_000_000_000_000_000n;
    
    const pStake = (netAmountWei * durationBigInt) / etherDivisor;

    netEl.textContent = `${ethers.formatUnits(netAmountWei, 18)} $BKC`;
    pStakeEl.textContent = formatPStake(pStake); 
    bonusTextEl.textContent = `x${durationDays} Day Multiplier`;

    if (durationDays > 3000) { 
         bonusTextEl.className = 'text-sm font-bold text-green-400 mt-1';
    } else if (durationDays > 1000) { 
         bonusTextEl.className = 'text-sm font-bold text-amber-400 mt-1';
    } else {
         bonusTextEl.className = 'text-sm font-bold text-zinc-400 mt-1';
    }
}


// --- FUNÇÃO CENTRALIZADA DE MODAL DELEGAÇÃO ---

function openDelegateModal(validatorAddr) {
    if (!State.isConnected) return showToast("Please connect your wallet first.", "error");
    if (State.currentUserBalance === 0n) return showToast("Your $BKC balance is zero.", "error");
    
    const currentValidator = validatorAddr; 
    
    const minLockDays = 1; 
    const maxLockDays = 3650;
    const defaultLockDays = 1825;

    const balanceNum = formatBigNumber(State.currentUserBalance || 0n);
    const balanceLocaleString = balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const feePercentage = "0.00"; 

    // Conteúdo HTML do Modal (Versão Limpa/Dashboard Style)
    const content = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white">Start Mining / Delegation</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-2xl">&times;</button>
        </div>
        <p class="text-sm text-zinc-400 mb-2">To Validator: <span class="font-mono">${formatAddress(currentValidator)}</span></p>
        <p class="text-sm text-zinc-400 mb-4">Your balance: <span class="font-bold text-amber-400">${balanceLocaleString} $BKC</span></p>
        <div class="mb-4">
            <label for="delegateAmountInput" class="block text-sm font-medium text-zinc-300 mb-1">Amount to Mine / Delegate ($BKC)</label>
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
            <input type="range" id="delegateDurationSlider" min="${minLockDays}" max="${maxLockDays}" value="${defaultLockDays}" class="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500">
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
            Confirm Delegation / Start Mining
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

        // Atualiza UI
        durationDisplay.textContent = `${durationDays} days`;
        feeAmountEl.textContent = `${formatBigNumber(fee).toFixed(4)} $BKC`;
        netAmountEl.textContent = `${formatBigNumber(netAmount).toFixed(4)} $BKC`;
        
        // Cálculo de pStake
        const durationBigInt = BigInt(durationDays);
        const etherDivisor = 1_000_000_000_000_000_000n;
        const pStake = (netAmount * durationBigInt) / etherDivisor; 
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

    confirmBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const amountInput = document.getElementById('delegateAmountInput');
        const durationSlider = document.getElementById('delegateDurationSlider');

        const amountStr = amountInput.value;
        const durationDays = durationSlider.value;
        
        if (!amountStr || parseFloat(amountStr) <= 0) return showToast('Invalid amount.', "error");
        if (!currentValidator) return showToast('Validator address not found.', "error"); 

        const totalAmount = ethers.parseEther(amountStr);
        const durationSeconds = parseInt(durationDays) * ONE_DAY_IN_SECONDS;
        
        const success = await executeDelegation(currentValidator, totalAmount, durationSeconds, e.currentTarget); 
        if (success) {
            closeModal(); 
            await loadPublicData(); 
            await loadUserData(); 
            // Renderiza novamente a página Earn
            await EarnPage.render(true); 
        }
    });
    updateDelegatePreview();
}

// --- FUNÇÕES DE RENDERIZAÇÃO DE CONTEÚDO DA PÁGINA ---

/**
 * Renderiza os controles de paginação
 * @param {number} totalPages 
 * @param {number} currentPage 
 */
function renderPaginationControls(totalPages, currentPage) {
    if (totalPages <= 1) return '';

    let html = `
        <div class="flex items-center justify-center space-x-2 mt-8">
            <button id="prevPageBtn" 
                    class="pagination-btn bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
                    data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            
            <div class="flex space-x-1">
    `;

    // Lógica para exibir números de página (máximo de 5)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
        endPage = Math.min(totalPages, 5);
        startPage = 1;
    } else if (currentPage > totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
        endPage = totalPages;
    }

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        html += `
            <button class="pagination-page-num px-3 py-1 rounded-md text-sm font-semibold transition-colors
                    ${isActive ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}"
                    data-page="${i}">
                ${i}
            </button>
        `;
    }

    html += `
            </div>
            
            <button id="nextPageBtn" 
                    class="pagination-btn bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
                    data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    `;
    return html;
}


function renderDelegateContent() {
    const container = DOMElements.earn.querySelector('#validatorsList');
    if (!container) return;
    
    // 1. Estado de Conexão
    if (!State.isConnected) {
        const connectCard = (title, message, iconClass) => {
            return `
                <div class="col-span-1 lg:col-span-3">
                    <div class="bg-sidebar border border-border-color rounded-xl p-8 text-center flex flex-col items-center max-w-2xl mx-auto">
                        <i class="fa-solid ${iconClass} text-5xl text-zinc-600 mb-6"></i>
                        <h3 class="text-2xl font-bold mb-3">${title}</h3>
                        <p class="text-zinc-400 max-w-sm mb-8">${message}</p>
                        <button 
                            onclick="window.openConnectModal()" 
                            class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-6 rounded-md transition-colors text-lg">
                            <i class="fa-solid fa-plug mr-2"></i>
                            Connect Wallet
                        </button>
                    </div>
                </div>
            `;
        };
        const defaultMessage = connectCard('Connect to Start Mining', 'You need to connect your wallet to view the list of validators and start mining/delegating your $BKC.', 'fa-wallet');
        container.innerHTML = defaultMessage;
        return;
    }
    
    // 2. Estado de No Data/Loading
    if (!Array.isArray(State.allValidatorsData) || State.allValidatorsData.length === 0) {
        container.innerHTML = renderNoData("No active validators on the network. Be the first by clicking the 'Become a Full Node / Validator' tab.");
        return;
    }

    // 3. Paginação e Ordenação
    const sortedData = [...State.allValidatorsData].sort((a, b) => {
        // Ordena por pStake (TotalPStake é mais preciso)
        if (b.totalPStake > a.totalPStake) return 1;
        if (b.totalPStake < a.totalPStake) return -1;
        return 0;
    });

    const totalMiners = sortedData.length;
    const totalPages = Math.ceil(totalMiners / MINERS_PER_PAGE);
    
    // Garante que a página atual seja válida
    let currentPage = EarnPage.currentPage;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    EarnPage.currentPage = currentPage;

    const startIndex = (currentPage - 1) * MINERS_PER_PAGE;
    const endIndex = startIndex + MINERS_PER_PAGE;
    const pageMiners = sortedData.slice(startIndex, endIndex);

    // 4. Renderização da Página Atual
    const minersHtml = pageMiners.map(validator => {
        const { addr, pStake, selfStake, totalDelegatedAmount } = validator;
        return `
            <div class="bg-sidebar border border-border-color rounded-xl p-6 flex flex-col h-full hover:shadow-lg transition-shadow">
                <div class="flex items-center justify-between border-b border-border-color/50 pb-3 mb-3">
                    <div class="flex items-center gap-3 min-w-0">
                        <i class="fa-solid fa-user-shield text-xl text-zinc-500"></i>
                        <p class="font-mono text-zinc-400 text-sm truncate" title="${addr}">${formatAddress(addr)}</p>
                    </div>
                    <p class="text-xs text-zinc-500">Validator</p>
                </div>
                <div class="text-center py-4 bg-main/50 rounded-lg mb-4">
                    <p class="text-zinc-400 text-sm">Total pStake</p>
                    <p class="text-3xl font-bold text-purple-400 mt-1">${formatPStake(pStake)}</p>
                </div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-5">
                    <div class="flex flex-col border-r border-border-color/50 pr-4">
                        <span class="text-zinc-400 text-xs uppercase">Self-Staked</span>
                        <span class="font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis">${formatBigNumber(selfStake).toFixed(2)} $BKC</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-zinc-400 text-xs uppercase">Delegated (Miners)</span>
                        <span class="font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis">${formatBigNumber(totalDelegatedAmount).toFixed(2)} $BKC</span>
                    </div>
                </div>
                <button class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2.5 px-4 rounded-md transition-colors w-full mt-auto text-center delegate-btn ${!State.isConnected ? 'btn-disabled' : ''}" data-validator="${addr}" ${!State.isConnected ? 'disabled' : ''}>
                    Start Mining (Delegation)
                </button>
            </div>`;
    }).join('');

    // 5. Combina HTML dos Mineradores e Controles de Paginação
    const paginationHtml = renderPaginationControls(totalPages, currentPage);
    
    // Injeta os mineradores na grid e adiciona a paginação após o grid
    container.innerHTML = minersHtml; 
    
    const pageWrapper = DOMElements.earn.querySelector('#delegate-content');
    if (pageWrapper) {
        // Remove a paginação antiga, se existir
        const oldPagination = pageWrapper.querySelector('#paginationControls');
        if (oldPagination) oldPagination.remove();

        // Cria e anexa a nova paginação
        const paginationDiv = document.createElement('div');
        paginationDiv.id = 'paginationControls';
        paginationDiv.innerHTML = paginationHtml;
        pageWrapper.appendChild(paginationDiv);
    }
}


async function renderValidatorPayFeePanel(feeAmount) {
    // A função registerValidator em transactions.js agora faz o trabalho unificado.
    return `
        <div class="bg-sidebar border border-border-color rounded-xl overflow-hidden">
            <div class="p-6 md:p-8">
                <div class="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div class="text-center flex-shrink-0">
                        <div class="w-28 h-28 bg-blue-500/10 rounded-full flex items-center justify-center border-2 border-blue-500/30">
                            <i class="fa-solid fa-money-bill-wave text-5xl text-blue-400"></i>
                        </div>
                        <h2 class="2xl font-bold mt-4">Become a Full Node / Validator</h2>
                        <p class="text-sm text-zinc-400">Step 1 of 1: Register (Fee Required)</p>
                    </div>
                    <div class="w-full flex-1 space-y-4">
                        <h3 class="xl font-bold">Register and Pay Fee</h3>
                        <p class="text-sm text-zinc-400">This action attempts to register you as a validator and charges the one-time fee of <span class="font-bold text-amber-400">${formatBigNumber(feeAmount).toFixed(8)} $BKC</span>. This fee triggers a **Proof-of-Purchase (PoP)** mining event.</p>
                        <button id="registerValidatorBtn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition-colors w-full text-lg">
                            <i class="fa-solid fa-money-bill-wave mr-2"></i>Approve & Register
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderValidatorContent() {
    const buyBkcLink = addresses.bkcDexPoolAddress || '#';
    
    if (!State.delegationManagerContract || !State.ecosystemManagerContract) {
        return renderError("Contracts failed to load. Check your connection or refresh the page.");
    }

    try {
        const fallbackValidatorStruct = { isRegistered: false, selfStakeAmount: 0n, totalDelegatedAmount: 0n };
        const validatorInfo = await safeContractCall(State.delegationManagerContract, 'validators', [State.userAddress], fallbackValidatorStruct);
        const registrationFeeWei = await safeContractCall(State.ecosystemManagerContract, 'getFee', [VALIDATOR_REGISTRATION_KEY], 0n); 
        
        const feeAmount = registrationFeeWei;
        
        // Estado 1: Validador Registrado
        if (validatorInfo.isRegistered) {
            return `<div class="bg-sidebar border border-border-color rounded-xl p-8 text-center"><i class="fa-solid fa-shield-halved text-5xl text-green-400 mb-4"></i><h2 class="2xl font-bold">You are a Registered Validator</h2><p class="text-zinc-400 mt-1">Thank yourself for helping secure the Backchain network.</p></div>`;
        }

        // Estado 2: Taxa não configurada
        if (feeAmount === 0n) {
            return renderError(`Registration fee (${VALIDATOR_REGISTRATION_KEY}) is zero or not configured in EcosystemManager.`);
        }

        const requiredAmount = feeAmount; 
        
        // Estado 3: Saldo Insuficiente
        if (State.currentUserBalance < requiredAmount) {
             return `<div class="bg-sidebar border border-border-color rounded-xl p-8 text-center">
                <div class="text-center p-6 border border-red-500/50 bg-red-500/10 rounded-lg space-y-3">
                    <i class="fa-solid fa-circle-exclamation text-4xl text-red-400"></i>
                    <h3 class="xl font-bold">Insufficient Balance</h3>
                    <p class="text-zinc-300">You need ${formatBigNumber(requiredAmount).toFixed(2)} $BKC (Registration Fee) to become a validator.</p>
                    <a href="${buyBkcLink}" target="_blank" rel="noopener noreferrer" class="inline-block bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2.5 px-6 rounded-lg text-md mt-4 shadow-lg hover:shadow-xl transition-all">
                        <i class="fa-solid fa-shopping-cart mr-2"></i> Buy $BKC
                    </a>
                </div>
            </div>`;
        }
        
        // Estado 4: Pronto para Registrar e Pagar (Fluxo Unificado)
        return await renderValidatorPayFeePanel(feeAmount);
        
    } catch (e) {
        console.error("CRITICAL ERROR in renderValidatorContent:", e);
        const errorMessage = e.reason || e.message || 'Unknown Contract Error. Check console logs for details.';
        return renderError(`Failed to Load Validator Panel: ${errorMessage}`);
    }
}


// --- LÓGICA DE RENDERIZAÇÃO DE CONTEÚDO DA ABA ATIVA ---

async function renderActiveTabContent(tabId) {
    const contentEl = document.getElementById(`${tabId}-content`);

    if (!contentEl) return;

    // Estado Conectado (Loading)
    if (State.isConnected) {
        if (tabId === 'delegate') {
            const listEl = document.getElementById('validatorsList');
            if (listEl) listEl.innerHTML = renderLoading();
        } else {
            contentEl.innerHTML = renderLoading();
        }
    }


    // 3. Renderiza o Conteúdo Final
    try {
        if (tabId === 'delegate') {
             // Chamada para renderizar a lista de validadores na aba Delegate
             renderDelegateContent(); // Não precisa de await
        } else if (tabId === 'validator') {
             // Chamada para renderizar o painel de Validador
             const finalHtml = await renderValidatorContent();
             contentEl.innerHTML = finalHtml;
        }

    } catch (e) {
        console.error(`Error rendering tab ${tabId}:`, e);
        contentEl.innerHTML = renderError(`Failed to load ${tabId} data: ${e.message || 'Unknown error.'}`);
    }
}

// --- SETUP DE LISTENERS (RESOLVE O BINDING DO BOTÃO) ---

function setupEarnPageListeners() {
    if (EarnPageListenersAttached) return;
    
    // ANEXA LISTENER DE AÇÕES AO ELEMENTO RAIZ DA PÁGINA EARN
    DOMElements.earn.addEventListener('click', async (e) => {
        const target = e.target.closest('button') || e.target.closest('a');
        if (!target) return;
        
        // 1. ABRIR MODAL DE DELEGAÇÃO (USA delegate-btn que é a classe injetada)
        if (target.classList.contains('delegate-btn')) {
            e.preventDefault();
            const validatorAddr = target.dataset.validator;
            if (validatorAddr) openDelegateModal(validatorAddr); 
            return;
        }
        
        // 2. REGISTRO DE VALIDADOR (FLUXO UNIFICADO)
        if (target.id === 'registerValidatorBtn') {
            e.preventDefault();
            
            // 2.1. Obtém a taxa para aprovação (agora só para UI)
            const requiredFee = await safeContractCall(State.ecosystemManagerContract, 'getFee', [VALIDATOR_REGISTRATION_KEY], 0n);
            const validatorAddress = State.userAddress; 
            
            // 2.2. Executa a transação unificada
            // [CORREÇÃO]: A função registerValidator em transactions.js espera (address, requiredFee, btnElement)
            const success = await registerValidator(validatorAddress, requiredFee, target); 
            
            if (success) {
                // SUCESSO: Força o recarregamento de dados e a aba Validador
                await loadPublicData(); 
                await loadUserData();
                await EarnPage.setActiveTab('validator'); 
            }
            return;
        }
        
        // 3. TROCA DE ABAS (Gerenciamento interno da página)
        if (target.classList.contains('tab-btn')) {
            e.preventDefault();
            const tabId = target.dataset.tab;
            if (tabId) {
                EarnPage.setActiveTab(tabId);
            }
        }

        // 4. CONTROLES DE PAGINAÇÃO
        if (target.id === 'prevPageBtn' || target.id === 'nextPageBtn' || target.classList.contains('pagination-page-num')) {
            e.preventDefault();
            const newPage = parseInt(target.dataset.page, 10);
            if (newPage >= 1) {
                EarnPage.currentPage = newPage;
                // Re-renderiza a aba delegate (mineração)
                renderActiveTabContent('delegate'); 
            }
        }
    });

    EarnPageListenersAttached = true;
    console.log("EarnPage Listeners Attached.");
}


// --- OBJETO PRINCIPAL DA PÁGINA (EarnPage) ---

export const EarnPage = {
    activeTab: 'delegate',
    currentPage: 1, // Página atual da lista de mineradores
    
    setActiveTab(tabId) {
        this.activeTab = tabId;
        
        // 1. Atualiza botões (visual)
        const tabButtons = DOMElements.earn.querySelectorAll('.tab-btn');
        const contentContainers = DOMElements.earn.querySelectorAll('.tab-content');
        
        tabButtons.forEach(btn => {
            const isThisBtnActive = btn.dataset.tab === tabId;
            btn.classList.toggle('active', isThisBtnActive);
            btn.classList.toggle('border-amber-500', isThisBtnActive);
            btn.classList.toggle('text-amber-500', isThisBtnActive);
            btn.classList.toggle('border-transparent', !isThisBtnActive);
            btn.classList.toggle('text-zinc-400', !isThisBtnActive);
        });

        // 2. Atualiza o display do container de conteúdo
        contentContainers.forEach(content => {
            content.classList.toggle('hidden', content.id !== `${tabId}-content`);
        });

        // 3. Renderiza o conteúdo da nova aba (assíncrono)
        renderActiveTabContent(tabId);
    },

    async render(isUpdate = false) {
        
        console.log(`TRACE: 1. EarnPage.render called (isUpdate: ${isUpdate}).`);
        
        // --- 1. Renderiza o HTML base (se não existir) ---
        if (!DOMElements.earn.querySelector('#earn-tabs')) {
             DOMElements.earn.innerHTML = `
                <div class="container max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <h1 class="text-3xl font-bold text-white mb-8">Network Mining & Validation</h1>
                    
                    <div class="border-b border-border-color mb-8">
                        <nav id="earn-tabs" class="-mb-px flex gap-6" aria-label="Tabs">
                            <button class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm active border-amber-500 text-amber-500" data-tab="delegate">
                                Start Mining (Delegation)
                            </button>
                            <button class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-zinc-400" data-tab="validator">
                                Become a Full Node / Validator
                            </button>
                        </nav>
                    </div>

                    <div>
                        <div id="delegate-content" class="tab-content active">
                            <p class="text-zinc-400 max-w-2xl mb-6">Select an active validator to delegate (mine with) your $BKC. This increases your pStake, making you eligible for block rewards and exclusive ecosystem services.</p>
                            <div id="validatorsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                ${renderLoading()}
                                </div>
                        </div>
                        <div id="validator-content" class="tab-content hidden">
                            </div>
                    </div>
                </div>
            `;
        }

        // --- 2. Garante que os listeners estejam anexados (inclui troca de abas) ---
        setupEarnPageListeners();
        
        // --- 3. Força a carga inicial de dados (se necessário) ---
        if (!State.isConnected || !State.allValidatorsData || isUpdate) {
            try {
                await Promise.all([
                    loadPublicData(),
                    State.isConnected ? loadUserData() : Promise.resolve() 
                ]);
                console.log("TRACE: Data loaded successfully for initial render.");
            } catch (e) {
                console.error("Error loading initial EarnPage data", e);
            }
        }
        
        // --- 4. Renderiza a aba ativa com o novo fluxo ---
        if (!isUpdate) {
            this.activeTab = 'delegate';
        }
        
        this.setActiveTab(this.activeTab); 
    }
};