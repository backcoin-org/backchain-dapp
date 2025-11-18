// pages/networkstaking.js
const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { loadUserData, loadPublicData, safeContractCall } from '../modules/data.js';
import { executeDelegation } from '../modules/transactions.js'; 
import { formatBigNumber, formatAddress, formatPStake, renderLoading, renderError, renderNoData } from '../utils.js'; 
import { openModal, showToast, closeModal } from '../ui-feedback.js';
import { addresses } from '../config.js';

// --- CONSTANTES ---
const ONE_DAY_IN_SECONDS = 86400;
let EarnPageListenersAttached = false; 

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

// --- LÓGICA DO MODAL DE DELEGAÇÃO (Global) ---

function openDelegateModal() {
    if (!State.isConnected) return showToast("Please connect your wallet first.", "error");
    
    const balanceNum = formatBigNumber(State.currentUserBalance || 0n);
    const balanceLocaleString = balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    const minLockDays = 1; 
    const maxLockDays = 3650;
    const defaultLockDays = 365; 

    const content = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white">Delegate to Global Pool</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div class="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <i class="fa-solid fa-info-circle text-purple-400 mt-1"></i>
            <div class="text-sm text-zinc-300">
                <p class="font-semibold text-purple-300 mb-1">Global Consensus Staking</p>
                <p>You are delegating directly to the Backchain Protocol. Rewards are distributed automatically based on your share of the total network pStake.</p>
            </div>
        </div>

        <div class="flex justify-between text-sm text-zinc-400 mb-2">
            <span>Amount to Delegate</span>
            <span>Balance: <span class="font-bold text-white cursor-pointer hover:text-amber-400" onclick="window.setDelegateAmount(1.0)">${balanceLocaleString} $BKC</span></span>
        </div>
        
        <div class="relative mb-6">
            <input type="number" id="delegateAmountInput" placeholder="0.00" step="any" min="0" class="form-input w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:outline-none focus:border-amber-500 text-lg font-mono">
            <div class="absolute right-2 top-2 flex gap-1">
                <button class="bg-zinc-700 hover:bg-zinc-600 text-xs px-2 py-1 rounded transition-colors set-delegate-perc" data-perc="25">25%</button>
                <button class="bg-zinc-700 hover:bg-zinc-600 text-xs px-2 py-1 rounded transition-colors set-delegate-perc" data-perc="50">50%</button>
                <button class="bg-zinc-700 hover:bg-zinc-600 text-xs px-2 py-1 rounded transition-colors set-delegate-perc" data-perc="100">Max</button>
            </div>
        </div>

        <div class="mb-6">
            <label for="delegateDurationSlider" class="flex justify-between text-sm font-medium text-zinc-300 mb-2">
                <span>Lock Duration</span>
                <span id="delegateDurationDisplay" class="font-bold text-amber-400">365 days</span>
            </label>
            <input type="range" id="delegateDurationSlider" min="${minLockDays}" max="${maxLockDays}" value="${defaultLockDays}" class="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500">
            <div class="flex justify-between text-xs text-zinc-500 mt-2">
                <span>1 day</span>
                <span class="text-amber-500/70">Longer lock = More pStake = More Rewards</span>
                <span>10 years</span>
            </div>
        </div>

        <div class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-2 text-sm mb-6">
             <div class="flex justify-between items-center">
                <span class="text-zinc-400">Estimated pStake Power:</span>
                <span id="delegateEstimatedPStake" class="font-bold text-xl text-purple-400 font-mono">0</span>
            </div>
            <p class="text-xs text-zinc-500 text-right mt-1">pStake determines your share of block rewards.</p>
        </div>

        <button id="confirmDelegateBtn" class="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-4 rounded-lg transition-all btn-disabled shadow-lg hover:shadow-amber-500/20" disabled>
            Confirm Delegation
        </button>
    `;
    openModal(content);

    const amountInput = document.getElementById('delegateAmountInput');
    const durationSlider = document.getElementById('delegateDurationSlider');
    const durationDisplay = document.getElementById('delegateDurationDisplay');
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
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('btn-disabled', 'opacity-50', 'cursor-not-allowed');
        }
        
        if (amount > balanceBigInt) amountInput.classList.add('border-red-500');
        else amountInput.classList.remove('border-red-500');

        durationDisplay.textContent = `${durationDays} days`;
        
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

    confirmBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const amountStr = amountInput.value;
        const durationDays = durationSlider.value;
        
        if (!amountStr || parseFloat(amountStr) <= 0) return showToast('Invalid amount.', "error");
        
        const totalAmount = ethers.parseEther(amountStr);
        const durationSeconds = parseInt(durationDays) * ONE_DAY_IN_SECONDS;
        
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<div class="loader inline-block mr-2"></div> Processing...';
        confirmBtn.disabled = true;

        const success = await executeDelegation(totalAmount, durationSeconds, 0, confirmBtn); 
        
        if (success) {
            closeModal(); 
            await loadUserData(); 
            // showToast removido daqui pois executeDelegation já exibe.
            await EarnPage.render(true);
        } else {
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    });
    updateDelegatePreview();
}

// --- RENDERIZAÇÃO ---

function renderStakingOverview() {
    const container = DOMElements.earn.querySelector('#staking-overview-container');
    if (!container) return;
    
    const totalStaked = State.totalNetworkPStake || 0n;
    const myPStake = State.userTotalPStake || 0n;
    const myShare = totalStaked > 0n ? (Number(myPStake * 10000n / totalStaked) / 100).toFixed(4) : "0.00";

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-sidebar border border-border-color rounded-xl p-6 relative overflow-hidden">
                 <div class="absolute top-0 right-0 p-4 opacity-10">
                    <i class="fa-solid fa-globe text-6xl text-purple-500"></i>
                 </div>
                 <p class="text-zinc-400 text-sm">Total Network pStake</p>
                 <p class="text-3xl font-bold text-white mt-1">${formatPStake(totalStaked)}</p>
                 <p class="text-xs text-zinc-500 mt-2">Global consensus power</p>
            </div>

            <div class="bg-sidebar border border-border-color rounded-xl p-6 relative overflow-hidden">
                 <div class="absolute top-0 right-0 p-4 opacity-10">
                    <i class="fa-solid fa-user-astronaut text-6xl text-amber-500"></i>
                 </div>
                 <p class="text-zinc-400 text-sm">Your pStake Share</p>
                 <p class="text-3xl font-bold text-amber-400 mt-1">${myShare}%</p>
                 <p class="text-xs text-zinc-500 mt-2">Of total block rewards</p>
            </div>
        </div>

        <div class="bg-sidebar border border-border-color rounded-xl p-8 text-center max-w-3xl mx-auto">
            <div class="inline-block p-4 bg-purple-500/10 rounded-full mb-6">
                <i class="fa-solid fa-layer-group text-5xl text-purple-400"></i>
            </div>
            <h2 class="text-2xl font-bold text-white mb-3">Start Mining (Delegation)</h2>
            <p class="text-zinc-400 mb-8">
                Delegate your $BKC to the Global Consensus Pool to earn passive rewards. 
                <br>Lock your tokens for longer periods to increase your <strong>pStake</strong> (Protocol Stake) and earn a larger share of the ecosystem fees.
            </p>
            
            ${!State.isConnected ? 
                `<button onclick="window.openConnectModal()" class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-8 rounded-lg text-lg transition-all shadow-lg hover:shadow-amber-500/20">
                    <i class="fa-solid fa-plug mr-2"></i> Connect Wallet to Stake
                </button>` :
                `<button id="startStakingBtn" class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-lg text-xl transition-all shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-1">
                    <i class="fa-solid fa-coins mr-2"></i> Stake Now
                </button>`
            }
        </div>
    `;
}

function setupEarnPageListeners() {
    if (EarnPageListenersAttached) return;
    
    DOMElements.earn.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        if (target.id === 'startStakingBtn') {
            e.preventDefault();
            openDelegateModal();
        }
    });

    EarnPageListenersAttached = true;
}

// --- OBJETO PRINCIPAL DA PÁGINA (EarnPage) ---

export const EarnPage = {
    async render(isUpdate = false) {
        console.log(`EarnPage.render (isUpdate: ${isUpdate})`);
        
        DOMElements.earn.innerHTML = `
            <div class="container max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div class="flex items-center gap-4 mb-8">
                    <h1 class="text-3xl font-bold text-white">Staking Pool</h1>
                    <span class="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded border border-green-500/20">Live</span>
                </div>
                
                <div id="staking-overview-container">
                     ${renderLoading()}
                </div>
            </div>
        `;

        setupEarnPageListeners();
        
        try {
            if (!isUpdate) {
                await Promise.all([
                    loadPublicData(),
                    State.isConnected ? loadUserData() : Promise.resolve()
                ]);
            }
            renderStakingOverview();
        } catch (e) {
            console.error("Error loading EarnPage data", e);
            const container = DOMElements.earn.querySelector('#staking-overview-container');
            if(container) container.innerHTML = renderError("Failed to load staking data.");
        }
    }
};