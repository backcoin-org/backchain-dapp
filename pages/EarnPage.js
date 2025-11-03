// pages/EarnPage.js

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { loadUserData, loadPublicData, safeContractCall } from '../modules/data.js';
import { executeDelegation, payValidatorFee, registerValidator, createVestingCertificate } from '../modules/transactions.js';
import { formatBigNumber, formatAddress, formatPStake, renderLoading, renderError, renderNoData } from '../utils.js';
import { openModal, showToast } from '../ui-feedback.js';

let currentDelegateValidator = null;
const ONE_DAY_IN_SECONDS = 86400;
const MINING_SERVICE_KEY = "POP_MINING_SERVICE"; 

// --- CONSTANTES DE DISTRIBUIÇÃO (HARDCODED de RewardManager.sol) ---
const RECIPIENT_BONUS_BIPS = 1000; 
const TREASURY_SHARE_BIPS = 1000; 
const MINER_SHARE_BIPS = 1500;     
const DELEGATOR_SHARE_BIPS = 6500; 

let currentScarcityRate = 0; 


// --- UTILS E LÓGICA DE MINERAÇÃO ---

function setAmountUtil(elementId, percentage) {
    const input = document.getElementById(elementId);
    if (State.currentUserBalance > 0n && input) {
        const amount = (State.currentUserBalance * BigInt(Math.floor(percentage * 10000))) / 10000n;
        input.value = ethers.formatUnits(amount, 18);
        
        if (elementId === 'delegateAmountInput') updateDelegationFeedback();
        if (elementId === 'certificateAmountInput') updateMiningDistribution();
    }
}
window.setDelegateAmount = (p) => setAmountUtil('delegateAmountInput', p);
window.setCertificateAmount = (p) => setAmountUtil('certificateAmountInput', p);

function updateDelegationFeedback() {
    const amountInput = document.getElementById('delegateAmountInput');
    const durationSlider = document.getElementById('delegateDurationSlider');
    const pStakeEl = document.getElementById('modalPStakeEl');
    const netEl = document.getElementById('modalNetAmountEl');

    if (!amountInput || !durationSlider || !pStakeEl || !netEl) return;

    const amountStr = amountInput.value || '0';
    const durationDays = parseInt(durationSlider.value, 10);
    
    let amount = 0;
    try {
        amount = parseFloat(amountStr);
        if (isNaN(amount) || amount < 0) amount = 0;
    } catch(e) { amount = 0; }
    
    const netAmount = amount; 
    const pStake = netAmount * durationDays;

    netEl.textContent = `${netAmount.toFixed(4)} $BKC`;
    pStakeEl.textContent = formatPStake(pStake.toFixed(0));
}

/**
 * Tenta buscar a taxa de cunhagem atual do RewardManager.
 * CORREÇÃO: Força o uso de 99.99% (0.9999) para cálculos se a leitura for alta,
 * em alinhamento com o Dashboard.
 */
async function loadScarcityRate() {
    try {
        // --- CORREÇÃO: Adicionada verificação de contrato ANTES da chamada ---
        if (!State.rewardManagerContract) {
            console.warn("loadScarcityRate: RewardManagerContract não está pronto. Usando fallback.");
            currentScarcityRate = 0.9999;
            return;
        }
        // --- FIM DA CORREÇÃO ---

        const totalMintForOneToken = await safeContractCall(
            State.rewardManagerContract, 
            'getMintRate', 
            [ethers.parseEther('1')], 
            ethers.parseEther('0.5') // Fallback 50%
        );

        let rate = Number(ethers.formatUnits(totalMintForOneToken, 18));
        
        // --- LÓGICA DE ESCASSEZ EXTREMA (99.99%) ---
        if (rate >= 0.9999 || rate >= 1.0) { // Se for lido como 1.0 ou superior (erro de arredondamento)
            currentScarcityRate = 0.9999;
        } else if (rate <= 0 || rate > 1.5) { 
            currentScarcityRate = 0.5; // Fallback se houver erro
        } else {
            currentScarcityRate = rate;
        }
        // --- FIM DA LÓGICA DE ESCASSEZ EXTREMA ---

    } catch (e) {
        console.warn("Falha ao buscar Scarcity Rate do RM. Usando 99.99% como fallback para alta escassez.", e);
        currentScarcityRate = 0.9999; // Assume 99.99% se a falha ocorrer em estado de alta escassez.
    }
}


/**
 * Atualiza o painel de distribuição de mineração com base no input do usuário.
 */
function updateMiningDistribution() {
    const amountInput = document.getElementById('certificateAmountInput');
    const outputEl = document.getElementById('mining-distribution-details');
    const scarcityEl = document.getElementById('currentScarcityRateDisplay');

    if (!amountInput || !outputEl || !scarcityEl) return;

    // Exibição da Taxa: 99.99% se o valor for 0.9999
    scarcityEl.textContent = (currentScarcityRate === 0.9999) ? 
        `99.99%` : 
        `${(currentScarcityRate * 100).toFixed(2)}%`;
    
    const amountStr = amountInput.value || '0';
    let purchaseAmount = 0;
    try {
        purchaseAmount = parseFloat(amountStr);
        if (isNaN(purchaseAmount) || purchaseAmount < 0) purchaseAmount = 0;
    } catch(e) { purchaseAmount = 0; }
    
    if (purchaseAmount === 0) {
         outputEl.innerHTML = `<p class="text-xs text-zinc-500 text-center py-2">Enter an amount above zero to view distribution estimates.</p>`;
         return;
    }

    // 1. Cunhagem Total Estimada (Total Mint Amount)
    const totalMintAmount = purchaseAmount * currentScarcityRate;

    // 2. Distribuição
    const recipientBonus = totalMintAmount * (RECIPIENT_BONUS_BIPS / 10000); 
    const minerReward = totalMintAmount * (MINER_SHARE_BIPS / 10000);       
    const delegatorPool = totalMintAmount * (DELEGATOR_SHARE_BIPS / 10000); 
    const treasuryShare = totalMintAmount * (TREASURY_SHARE_BIPS / 10000); 
    
    const finalVestingAmount = purchaseAmount + recipientBonus;
    
    // 3. Renderização
    outputEl.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center bg-green-900/40 p-2 rounded">
                <span class="font-bold text-green-400">Total Vesting Amount (NFT):</span>
                <span class="font-bold text-lg text-green-400">${finalVestingAmount.toFixed(4)} $BKC</span>
            </div>
            
            <div class="flex justify-between items-center">
                <span class="text-zinc-400"><i class="fa-solid fa-plus-circle text-amber-400 mr-1"></i> Recipient Bonus (10% of Mint):</span>
                <span class="font-semibold text-amber-400">+ ${recipientBonus.toFixed(4)} $BKC 
                    <i class="fa-solid fa-circle-question text-zinc-500 ml-1 cursor-pointer" data-info-id="bonus"></i>
                </span>
            </div>
            <div class="flex justify-between items-center border-t border-border-color pt-2">
                <span class="text-zinc-400"><i class="fa-solid fa-user-shield text-purple-400 mr-1"></i> Miner Reward (15% of Mint):</span>
                <span class="font-semibold text-purple-400">${minerReward.toFixed(4)} $BKC
                    <i class="fa-solid fa-circle-question text-zinc-500 ml-1 cursor-pointer" data-info-id="miner"></i>
                </span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-zinc-400"><i class="fa-solid fa-coins text-cyan-400 mr-1"></i> Delegator Pool (65% of Mint):</span>
                <span class="font-semibold text-cyan-400">${delegatorPool.toFixed(4)} $BKC
                    <i class="fa-solid fa-circle-question text-zinc-500 ml-1 cursor-pointer" data-info-id="delegator"></i>
                </span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-zinc-400"><i class="fa-solid fa-vault text-blue-400 mr-1"></i> Treasury Share (10% of Mint):</span>
                <span class="font-semibold text-blue-400">${treasuryShare.toFixed(4)} $BKC
                    <i class="fa-solid fa-circle-question text-zinc-500 ml-1 cursor-pointer" data-info-id="treasury"></i>
                </span>
            </div>
        </div>
    `;
}

// --- FUNÇÕES DE RENDERIZAÇÃO DA PÁGINA (RESTANTE) ---

function renderValidatorsList() {
    const listEl = document.getElementById('validatorsList');
    if (!listEl) return;
    
    // --- CORREÇÃO: Adicionada verificação de 'allValidatorsData' ---
    if (!State.allValidatorsData) {
        listEl.innerHTML = renderLoading(listEl);
        return;
    }
    // --- FIM DA CORREÇÃO ---

    const sortedData = [...State.allValidatorsData].sort((a, b) => b.pStake - a.pStake);

    const generateValidatorHtml = (validator) => {
        const { addr, pStake, selfStake, totalDelegatedAmount } = validator;
        return `
            <div class="bg-sidebar border border-border-color rounded-xl p-6 flex flex-col h-full">
                <div class="flex items-center gap-3 border-b border-border-color pb-3 mb-3">
                    <i class="fa-solid fa-user-shield text-xl text-zinc-500"></i>
                    <p class="font-mono text-zinc-400 text-sm break-all">${formatAddress(addr)}</p>
                </div>
                <div class="flex-1 space-y-2 text-sm">
                    <div class="flex justify-between items-center"><span class="text-zinc-400">Total pStake:</span><span class="font-bold text-lg text-purple-400">${formatPStake(pStake)}</span></div>
                    <div class="border-t border-border-color my-2 pt-2">
                        <div class="flex justify-between"><span class="text-zinc-400">Self-Staked:</span><span class="font-semibold">${formatBigNumber(selfStake).toFixed(2)} $BKC</span></div>
                        <div class="flex justify-between"><span class="text-zinc-400">Delegated:</span><span class="font-semibold">${formatBigNumber(totalDelegatedAmount).toFixed(2)} $BKC</span></div>
                    </div>
                </div>
                <button class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2 px-4 rounded-md transition-colors w-full mt-4 delegate-btn" data-validator="${addr}">Delegate</button>
            </div>`;
    };

    if (State.allValidatorsData.length === 0) {
        listEl.innerHTML = renderNoData(listEl, "No active validators on the network.");
    } else {
        listEl.innerHTML = sortedData.map(generateValidatorHtml).join('');
    }
}

function openDelegateModal(validatorAddr) {
    if (!State.isConnected) return showToast("Please connect your wallet first.", "error");
    currentDelegateValidator = validatorAddr;
    
    const minLockDays = 1; 
    const maxLockDays = 3650; 
    const defaultLockDays = 1825; 

    const balanceFormatted = formatBigNumber(State.currentUserBalance).toFixed(2);
    const content = `
        <h3 class="xl font-bold mb-4">Delegate to Validator</h3>
        <p class="text-sm text-zinc-400 mb-2">To: <span class="font-mono bg-zinc-900/50 text-zinc-400 text-xs py-1 px-2 rounded-md">${formatAddress(validatorAddr)}</span></p>
        <p class="text-sm text-zinc-400 mb-4">Your balance: <span class="font-bold">${balanceFormatted}</span> $BKC</p>
        <div class="space-y-4">
            <div>
                <label for="delegateAmountInput" class="block text-sm font-medium text-zinc-400 mb-2">Amount to Delegate ($BKC)</label>
                <input type="number" id="delegateAmountInput" class="form-input" placeholder="0.00" step="0.01">
                <div class="flex gap-2 mt-2">
                    <button onclick="setDelegateAmount(0.25)" class="text-xs bg-zinc-700 hover:bg-zinc-600 rounded-md py-1 px-3">25%</button>
                    <button onclick="setDelegateAmount(0.50)" class="text-xs bg-zinc-700 hover:bg-zinc-600 rounded-md py-1 px-3">50%</button>
                    <button onclick="setDelegateAmount(0.75)" class="text-xs bg-zinc-700 hover:bg-zinc-600 rounded-md py-1 px-3">75%</button>
                    <button onclick="setDelegateAmount(1.00)" class="text-xs bg-zinc-700 hover:bg-zinc-600 rounded-md py-1 px-3">100%</button>
                </div>
            </div>
            <div>
                <label for="delegateDurationSlider" class="block text-sm font-medium text-zinc-400 mb-2">Lock Duration: <span id="delegateDurationLabel" class="font-bold text-amber-400">${defaultLockDays} days</span></label>
                <input type="range" id="delegateDurationSlider" min="${minLockDays}" max="${maxLockDays}" value="${defaultLockDays}" class="w-full">
            </div>
            <div class="p-3 bg-main border border-border-color rounded space-y-2 text-sm">
                <div class="flex justify-between items-center"><span class="text-zinc-400">Delegation Fee:</span><span class="font-bold text-green-400 font-mono">0.00 $BKC (FREE)</span></div>
                <div class="flex justify-between items-center"><span class="text-zinc-400">Net Delegate Amount:</span><span id="modalNetAmountEl" class="font-bold text-green-400 font-mono">0.00 $BKC</span></div>
                <div class="border-t border-border-color my-1"></div>
                <div class="flex justify-between items-center"><span class="text-zinc-400">Estimated pStake:</span><span id="modalPStakeEl" class="font-bold text-purple-400 text-lg font-mono">0</span></div>
            </div>
            <div class="flex gap-3">
                <button id="confirmDelegateBtn" class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2 px-4 rounded-md transition-colors flex-1">Confirm Delegation</button>
                <button class="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-md transition-colors closeModalBtn" id="closeModalBtn">Cancel</button>
            </div>
        </div>
    `;
    openModal(content);
    document.getElementById('delegateAmountInput').addEventListener('input', updateDelegationFeedback);
    document.getElementById('delegateDurationSlider').addEventListener('input', (e) => {
        const days = parseInt(e.target.value);
        document.getElementById('delegateDurationLabel').textContent = `${days} days`;
        updateDelegationFeedback();
    });
    updateDelegationFeedback();
}

/**
 * Renderiza o painel de PoP Mining.
 */
async function renderPopMiningPanel() {
    // Carrega a taxa de escassez antes de renderizar
    await loadScarcityRate(); 

    const el = document.getElementById('pop-mining-content');
    
    // --- INÍCIO DA CORREÇÃO 1 ---
    // Adiciona verificação de contrato (EcosystemManager) e conexão
    if (!el || !State.isConnected || !State.ecosystemManagerContract) {
        if(el) {
            el.innerHTML = renderNoData(el, 'Connect wallet and wait for contracts to load.');
        } 
        return;
    }
    // --- FIM DA CORREÇÃO 1 ---

    renderLoading(el);

    const minBalance = ethers.parseEther("1");
    if (State.currentUserBalance < minBalance) {
        el.innerHTML = `<div class="p-8 text-center"><div class="text-center p-6 border border-red-500/50 bg-red-500/10 rounded-lg space-y-3"><i class="fa-solid fa-circle-exclamation text-4xl text-red-400"></i><h3 class="xl font-bold">Insufficient Balance</h3><p class="text-zinc-300">You need at least 1 $BKC to execute PoP Mining.</p></div></div>`;
        return;
    }
    
    // 1. Obter Requisitos do Hub
    let serviceFee = 0n;
    let minPStake = 0n;
    let feeDisplay = "0.00 $BKC";

    try {
        // Esta chamada agora é segura por causa da verificação no início da função
        const [fee, pStake] = await safeContractCall(
            State.ecosystemManagerContract, 
            'getServiceRequirements', 
            [MINING_SERVICE_KEY], 
            [0n, 0n]
        );
        serviceFee = fee;
        minPStake = pStake;
        feeDisplay = formatBigNumber(serviceFee).toFixed(4) + " $BKC";

    } catch(e) {
        console.warn("Could not load service requirements from Hub:", e);
        // O erro 'Cannot read properties of null' não deve mais acontecer aqui.
        // Se falhar por outro motivo, renderiza um erro.
        renderError(el, "Failed to load mining requirements.");
        return;
    }
    
    // 2. Montar o painel
    el.innerHTML = `
        <div class="p-6 md:p-8">
            <div class="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div class="text-center flex-shrink-0">
                    <div class="w-28 h-28 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/30">
                        <i class="fa-solid fa-gem text-5xl text-amber-400"></i>
                    </div>
                    <h2 class="2xl font-bold mt-4">PoP Mining</h2>
                    <p class="text-sm text-zinc-400">Create Vesting Certificates</p>
                </div>
                <div class="w-full flex-1 space-y-6">
                    
                    <h3 class="lg font-bold">1. Certificate Recipient</h3>
                    <div class="bg-main border border-border-color p-4 rounded-lg">
                         <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" id="autoPopToggle" class="sr-only peer" checked>
                            <div class="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            <span class="ms-3 text-sm font-medium text-zinc-300" id="recipientModeLabel">Auto PoP (To My Wallet)</span>
                        </label>

                        <div id="recipientAddressGroup" class="mt-3" style="display: none;">
                            <p class="text-sm text-zinc-400 mb-2">Recipient Address:</p>
                            <input type="text" id="recipientAddressInput" class="form-input font-mono text-xs" placeholder="0x..." value="${State.userAddress || ''}">
                        </div>
                    </div>

                    <div>
                        <h3 class="lg font-bold">2. Purchase Amount ($BKC)</h3>
                        <p class="text-sm text-zinc-400 mb-2">Your Balance: <span id="distributorBkcBalance" class="font-bold text-amber-400">${formatBigNumber(State.currentUserBalance).toFixed(2)} $BKC</span></p>
                        <input type="number" id="certificateAmountInput" class="form-input" placeholder="e.g., 5000">
                        <div class="flex gap-2 mt-2">
                            <button onclick="setCertificateAmount(0.25)" class="text-xs bg-zinc-700 hover:bg-zinc-600 rounded-md py-1 px-3">25%</button>
                            <button onclick="setCertificateAmount(0.50)" class="text-xs bg-zinc-700 hover:bg-zinc-600 rounded-md py-1 px-3">50%</button>
                            <button onclick="setCertificateAmount(0.75)" class="text-xs bg-zinc-700 hover:bg-zinc-600 rounded-md py-1 px-3">75%</button>
                            <button onclick="setCertificateAmount(1.00)" class="text-xs bg-zinc-700 hover:bg-zinc-600 rounded-md py-1 px-3">100%</button>
                        </div>
                    </div>
                    
                    <div class="p-3 bg-main border border-border-color rounded space-y-2 text-sm">
                        <h3 class="font-bold mb-2">Mining Distribution Estimate</h3>
                        
                        <div class="flex justify-between items-center text-xs font-bold bg-zinc-700/50 p-1 rounded">
                            <span class="text-zinc-300">Current Scarcity Rate (Mint Factor):</span>
                            <span class="text-amber-400" id="currentScarcityRateDisplay">~${(currentScarcityRate * 100).toFixed(2)}%</span>
                        </div>

                        <div id="mining-distribution-details" class="pt-2">
                            <p class="text-xs text-zinc-500 text-center py-2">Enter an amount above zero to view distribution estimates.</p>
                        </div>

                        <div class="border-t border-border-color pt-2 mt-2 space-y-1">
                            <div class="flex justify-between items-center"><span class="text-zinc-400">Required Min pStake:</span><span class="font-bold text-purple-400">${formatPStake(minPStake)}</span></div>
                            <div class="flex justify-between items-center"><span class="text-zinc-400">Service Fee:</span><span class="font-bold text-green-400">${feeDisplay}</span></div>
                            <p class="text-xs text-zinc-500"><i class="fa-solid fa-gas-pump mr-1"></i> Gas/Tx Fee will also apply.</p>
                        </div>
                    </div>

                    <button id="createCertificateBtn" class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-4 rounded-md transition-colors w-full text-lg">
                        <i class="fa-solid fa-person-digging mr-2"></i>Execute Mining & Create Certificate
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 3. Configurar listeners de interação
    document.getElementById('autoPopToggle').addEventListener('change', (e) => {
        const isAuto = e.target.checked;
        const inputGroup = document.getElementById('recipientAddressGroup');
        const inputEl = document.getElementById('recipientAddressInput');
        const labelEl = document.getElementById('recipientModeLabel');

        if (isAuto) {
            inputGroup.style.display = 'none';
            inputEl.value = State.userAddress; 
            labelEl.textContent = 'Auto PoP (To My Wallet)';
        } else {
            inputGroup.style.display = 'block';
            inputEl.value = ''; 
            labelEl.textContent = 'Mining for Another (Manual)';
        }
    });

    document.getElementById('certificateAmountInput').addEventListener('input', updateMiningDistribution);

    // Chamada inicial para preencher se houver valor
    updateMiningDistribution();
}

function renderValidatorPayFeePanel(feeAmount, el) {
    el.innerHTML = `
        <div class="bg-sidebar border border-border-color rounded-xl overflow-hidden">
            <div class="p-6 md:p-8">
                <div class="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div class="text-center flex-shrink-0">
                        <div class="w-28 h-28 bg-blue-500/10 rounded-full flex items-center justify-center border-2 border-blue-500/30">
                            <i class="fa-solid fa-money-bill-wave text-5xl text-blue-400"></i>
                        </div>
                        <h2 class="2xl font-bold mt-4">Become a Validator</h2>
                        <p class="text-sm text-zinc-400">Step 1 of 2</p>
                    </div>
                    <div class="w-full flex-1 space-y-4">
                        <h3 class="xl font-bold">Pay Registration Fee</h3>
                        <p class="text-sm text-zinc-400">This one-time fee of <span class="font-bold text-amber-400">${formatBigNumber(feeAmount).toFixed(8)} $BKC</span> is sent to the protocol treasury to enable your validator registration.</p>
                        <button id="payFeeBtn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition-colors w-full text-lg">
                            <i class="fa-solid fa-money-bill-wave mr-2"></i>Approve & Pay Fee
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderValidatorRegisterPanel(stakeAmount, el) {
     el.innerHTML = `
        <div class="bg-sidebar border border-border-color rounded-xl overflow-hidden">
            <div class="p-6 md:p-8">
                <div class="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div class="text-center flex-shrink-0">
                        <div class="w-28 h-28 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/30">
                            <i class="fa-solid fa-shield-heart text-5xl text-green-400"></i>
                        </div>
                        <h2 class="2xl font-bold mt-4">Become a Validator</h2>
                        <p class="text-sm text-zinc-400">Step 2 of 2</p>
                    </div>
                    <div class="w-full flex-1 space-y-4">
                        <h3 class="xl font-bold">Self-Stake & Register</h3>
                        <p class="text-sm text-zinc-400">Your fee is paid. Now, lock <span class="font-bold text-amber-400">${formatBigNumber(stakeAmount).toFixed(8)} $BKC</span> as self-stake to finalize your registration. This amount will be locked for 5 years.</p>
                        <button id="registerValidatorBtn" class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition-colors w-full text-lg">
                            <i class="fa-solid fa-lock mr-2"></i>Approve & Register Validator
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderValidatorPanel() {
    const el = document.getElementById('validator-content-wrapper');
    
    // --- INÍCIO DA CORREÇÃO 2 ---
    // Adiciona verificação de contrato (DelegationManager e EcosystemManager) e conexão
    if (!el || !State.isConnected || !State.delegationManagerContract || !State.ecosystemManagerContract) {
        if(el) {
            el.innerHTML = renderNoData(el, 'Connect wallet and wait for contracts to load.');
        }
        return;
    }
    // --- FIM DA CORREÇÃO 2 ---

    renderLoading(el);

    try {
        // Estas chamadas agora são seguras por causa da verificação acima
        const fallbackValidatorStruct = { isRegistered: false, selfStakeAmount: 0n, totalDelegatedAmount: 0n };
        const validatorInfo = await safeContractCall(State.delegationManagerContract, 'validators', [State.userAddress], fallbackValidatorStruct);
        
        let minValidatorStakeWei = await safeContractCall(State.delegationManagerContract, 'getMinValidatorStake', [], 0n); 
        const stakeAmount = minValidatorStakeWei;
        
        if (validatorInfo.isRegistered) {
            el.innerHTML = `<div class="bg-sidebar border border-border-color rounded-xl p-8 text-center"><i class="fa-solid fa-shield-halved text-5xl text-green-400 mb-4"></i><h2 class="2xl font-bold">You are a Registered Validator</h2><p class="text-zinc-400 mt-1">Thank you for helping secure the Backchain network.</p></div>`;
            return;
        }

        if (stakeAmount === 0n) {
            renderError(el, `Failed to load validator stake amount. The network supply is likely zero or not configured.`);
            return;
        }

        const hasPaid = await safeContractCall(State.delegationManagerContract, 'hasPaidRegistrationFee', [State.userAddress], false);
        const requiredAmount = hasPaid ? stakeAmount : stakeAmount * 2n;

        if (State.currentUserBalance < requiredAmount) {
             el.innerHTML = `<div class="bg-sidebar border border-border-color rounded-xl p-8 text-center"><div class="text-center p-6 border border-red-500/50 bg-red-500/10 rounded-lg space-y-3"><i class="fa-solid fa-circle-exclamation text-4xl text-red-400"></i><h3 class="xl font-bold">Insufficient Balance</h3><p class="text-zinc-300">You need ${formatBigNumber(requiredAmount).toFixed(2)} $BKC to become a validator (Fee + Self-Stake).</p></div></div>`;
        } else {
            if (!hasPaid) {
               renderValidatorPayFeePanel(stakeAmount, el);
            } else {
               renderValidatorRegisterPanel(stakeAmount, el);
            }
        }
    } catch (e) {
        console.error("CRITICAL ERROR in renderValidatorPanel:", e);
        renderError(el, `Failed to Load Validator Panel: ${e.reason || e.message}`);
    }
}

// --- SETUP DE LISTENERS ---

function setupEarnPageListeners() {
    DOMElements.earn.addEventListener('click', async (e) => {
        const target = e.target.closest('button') || e.target.closest('a') || e.target.closest('.fa-circle-question');
        if (!target) return;
        
        // NOVO: Exibe Tooltip para Distribuição
        if (target.classList.contains('fa-circle-question')) {
            const infoId = target.dataset.infoId;
            let title = "";
            let message = "";
            
            switch(infoId) {
                case 'bonus':
                    title = "Recipient Bonus (10%)";
                    message = "This portion is immediately added to your Certificado de Vesting NFT, increasing its final value. It is locked for 5 years.";
                    break;
                case 'miner':
                    title = "Miner Reward (15%)";
                    message = "This amount goes to the current block validator (the miner) as a reward for processing your PoP transaction. It is added to their claimable rewards.";
                    break;
                case 'delegator':
                    title = "Delegator Pool (65%)";
                    message = "This is the largest share, distributed back into the Delegation Manager's reward pool to be paid out to all staking delegators over time.";
                    break;
                case 'treasury':
                    title = "Treasury Share (10%)";
                    message = "This amount is permanently transferred to the protocol's Treasury Wallet, used for ecosystem development, grants, and operational costs.";
                    break;
            }

            if (title) {
                 // Implementação simples de alerta para informação
                 alert(`${title}:\n${message}`);
            }
            return;
        }

        // 1. ABRIR MODAL DE DELEGAÇÃO
        if (target.classList.contains('delegate-btn') || target.classList.contains('delegate-link')) {
            e.preventDefault();
            const validatorAddr = target.dataset.validator;
            openDelegateModal(validatorAddr);
            return;
        }
        
        // 2. CONFIRMAR DELEGAÇÃO
        if (target.id === 'confirmDelegateBtn') {
            e.preventDefault();
            const amountStr = document.getElementById('delegateAmountInput').value;
            const durationDays = document.getElementById('delegateDurationSlider').value;
            
            if (!amountStr || parseFloat(amountStr) <= 0) return showToast('Invalid amount.', 'error');
            if (!currentDelegateValidator) return showToast('Validator address not found.', 'error');

            const totalAmount = ethers.parseEther(amountStr);
            const durationSeconds = parseInt(durationDays) * ONE_DAY_IN_SECONDS;
            
            const success = await executeDelegation(currentDelegateValidator, totalAmount, durationSeconds, target);
            if (success) {
                await loadPublicData();
                await loadUserData();
                await EarnPage.render(true);
            }
            return;
        }

        // 3. CRIAR CERTIFICADO (POP MINING)
        if (target.id === 'createCertificateBtn') {
            e.preventDefault();
            const isAuto = document.getElementById('autoPopToggle')?.checked ?? true;
            const recipientAddress = isAuto 
                ? State.userAddress 
                : document.getElementById('recipientAddressInput').value;

            const amountStr = document.getElementById('certificateAmountInput').value;
            const amount = ethers.parseEther(amountStr || '0');
            const targetBtn = e.target;
            
            if (!isAuto) {
                try {
                    ethers.getAddress(recipientAddress);
                } catch {
                    return showToast('Please enter a valid recipient address.', 'error');
                }
            }
            if (amount <= 0n) return showToast('Amount must be greater than zero.', 'error');


            const success = await createVestingCertificate(recipientAddress, amount, targetBtn);
            if (success) {
                await loadUserData();
                await renderPopMiningPanel(); 
            }
            return;
        }
        
        // 4. PAGAR TAXA DE VALIDADOR (ETAPA 1)
        if (target.id === 'payFeeBtn') {
            e.preventDefault();
            let feeAmount = await safeContractCall(State.delegationManagerContract, 'getMinValidatorStake', [], 0n);
            const success = await payValidatorFee(feeAmount, target);
            if (success) await renderValidatorPanel();
            return;
        }
        
        // 5. REGISTRAR VALIDADOR (ETAPA 2)
        if (target.id === 'registerValidatorBtn') {
            e.preventDefault();
            let stakeAmount = await safeContractCall(State.delegationManagerContract, 'getMinValidatorStake', [], 0n);
            const success = await registerValidator(stakeAmount, target);
            if (success) {
                await loadPublicData();
                await loadUserData();
                await renderValidatorPanel();
            }
            return;
        }
    });
}

// Inicializa Listeners apenas na primeira vez
if (!DOMElements.earn._listenersInitialized) {
    setupEarnPageListeners();
    DOMElements.earn._listenersInitialized = true;
}

export const EarnPage = {
    async render(isUpdate = false) {
        const popMiningContent = document.getElementById('pop-mining-content');
        const validatorContent = document.getElementById('validator-content-wrapper');
        const validatorsList = document.getElementById('validatorsList');

        if (!State.isConnected) {
            if(validatorsList) validatorsList.innerHTML = renderNoData(validatorsList, 'Connect your wallet to see delegation options.');
            if(popMiningContent) popMiningContent.innerHTML = renderNoData(popMiningContent, 'Connect your wallet to access PoP Mining.');
            if(validatorContent) validatorContent.innerHTML = renderNoData(validatorContent, 'Connect your wallet to manage validator status.');
            return;
        }
        
        // --- CORREÇÃO: Movido 'renderValidatorsList' para ser chamado ANTES ---
        // dos painéis assíncronos, para renderizar o que já pode.
        if(validatorsList) renderValidatorsList();
        
        // O POP Mining é assíncrono e deve ser esperado para garantir a taxa de escassez
        if(popMiningContent) await renderPopMiningPanel();
        
        if(validatorContent) await renderValidatorPanel();
    }
};