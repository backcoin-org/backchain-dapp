// pages/networkstaking.js
// ✅ VERSÃO FINAL V4.1: Public Data Sync + UI Reset Fix

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { 
    formatBigNumber, 
    formatPStake, 
    renderLoading, 
    renderError,
    renderNoData,
    renderPaginatedList
} from '../utils.js';
import { 
    loadPublicData, 
    loadUserData, 
    calculateUserTotalRewards,
    loadUserDelegations 
} from '../modules/data.js';
import { 
    executeDelegation, 
    executeUnstake, 
    executeForceUnstake, 
    executeUniversalClaim 
} from '../modules/transactions.js';
import { showToast, startCountdownTimers } from '../ui-feedback.js';

// --- Estado Local ---
let isStakingLoading = false;
let lastStakingFetch = 0;
let delegationCurrentPage = 1;

// Estado da UX (em Dias)
let currentStakingDuration = 3650; // Padrão: 10 Anos

// =========================================================================
// 1. RENDERIZAÇÃO VISUAL
// =========================================================================

function renderEarnLayout() {
    const container = document.getElementById('mine');
    if (!container) return;
    
    if (container.querySelector('#earn-main-content')) return;

    container.innerHTML = `
        <div id="earn-main-content" class="container mx-auto max-w-7xl py-4 px-4">
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                ${renderStatCard('Total Network Staked', 'earn-total-network-pstake', 'fa-globe', 'text-purple-500')}
                ${renderStatCard('My Total pStake', 'earn-my-pstake', 'fa-user-shield', 'text-blue-500')}
                ${renderStatCard('Claimable Rewards', 'earn-my-rewards', 'fa-gift', 'text-amber-500', true)}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div class="lg:col-span-5">
                    <div class="glass-panel relative overflow-hidden p-1 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                        
                        <div class="bg-zinc-900/80 p-6 rounded-t-xl border-b border-zinc-800">
                            <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-layer-group text-purple-400"></i> Delegate & Earn
                            </h2>
                            <p class="text-sm text-zinc-400 mt-1">Maximize your voting power and rewards.</p>
                        </div>

                        <div class="p-6 space-y-6 bg-gradient-to-b from-zinc-900/50 to-black/50">
                            
                            <div>
                                <div class="flex justify-between mb-2">
                                    <label class="text-sm font-bold text-zinc-300">Amount to Stake</label>
                                    <span class="text-xs text-zinc-500">Available: <span id="staking-balance-display" class="text-white font-mono">--</span> $BKC</span>
                                </div>
                                <div class="relative">
                                    <input type="number" id="staking-amount-input" placeholder="0.00" class="w-full bg-black border border-zinc-700 rounded-xl p-4 text-2xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors font-mono outline-none font-bold placeholder-zinc-700">
                                    <div class="absolute right-3 top-3 flex gap-1">
                                        <button class="stake-perc-btn text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-2 rounded transition-colors uppercase tracking-wider" data-perc="100">Max</button>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-zinc-800/40 border border-zinc-700 rounded-xl p-4 relative group">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <p class="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Strategy Selected</p>
                                        <div id="strategy-badge" class="inline-flex items-center gap-2 bg-purple-500/10 text-purple-300 px-3 py-1 rounded border border-purple-500/20">
                                            <i class="fa-solid fa-gem"></i> <span id="strategy-name" class="font-bold text-sm">Diamond Hands (10Y)</span>
                                        </div>
                                    </div>
                                    <button id="open-duration-modal" class="text-xs text-zinc-500 hover:text-white underline decoration-zinc-600 hover:decoration-white transition-all p-2">
                                        <i class="fa-solid fa-sliders mr-1"></i> Adjust Duration
                                    </button>
                                </div>
                                
                                <div class="mt-4 pt-4 border-t border-zinc-700/50 grid grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-[10px] text-zinc-500">Net Staked (After Fee)</p>
                                        <p class="text-white font-mono text-sm" id="staking-net-display">0.00</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-[10px] text-purple-400 font-bold">Projected pStake Power</p>
                                        <p class="text-2xl font-bold text-white font-mono leading-none" id="staking-pstake-display">0</p>
                                    </div>
                                </div>
                            </div>

                            <button id="confirm-stake-btn" class="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-900/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-3 text-lg">
                                <span>Delegate Now</span> <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-7">
                    <div class="glass-panel p-6 min-h-[500px]">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-lg font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-list-ul text-zinc-500"></i> My Delegations
                            </h2>
                            <button id="refresh-delegations-btn" class="text-zinc-500 hover:text-white transition-colors w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center"><i class="fa-solid fa-rotate"></i></button>
                        </div>
                        
                        <div id="my-delegations-container" class="space-y-3">
                            ${renderLoading()}
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div id="duration-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 opacity-0 transition-opacity duration-300">
            <div class="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl transform scale-95 transition-transform duration-300 relative">
                <button id="close-duration-modal" class="absolute top-4 right-4 text-zinc-500 hover:text-white text-xl"><i class="fa-solid fa-xmark"></i></button>
                
                <h3 class="text-xl font-bold text-white mb-2">Select Lock Duration</h3>
                <p class="text-sm text-zinc-400 mb-6">Longer lockups grant significantly more pStake power.</p>

                <div class="mb-8">
                    <div class="flex justify-between text-sm font-bold text-white mb-4">
                        <span>Duration:</span>
                        <span id="modal-duration-display" class="text-purple-400 text-xl">10 Years</span>
                    </div>
                    <input type="range" id="staking-duration-slider" min="1" max="3650" value="3650" class="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400">
                    <div class="flex justify-between text-[10px] text-zinc-500 mt-2 font-mono uppercase">
                        <span>1 Day (Min)</span>
                        <span>10 Years (Max)</span>
                    </div>
                </div>

                <div class="bg-amber-900/20 border border-amber-500/20 p-3 rounded-lg flex gap-3 items-start mb-6 hidden" id="duration-warning">
                    <i class="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5"></i>
                    <div>
                        <p class="text-xs text-amber-200 font-bold">High pStake Impact</p>
                        <p class="text-[10px] text-amber-400/70">Reducing duration drastically reduces your pStake generation.</p>
                    </div>
                </div>

                <button id="apply-duration-btn" class="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors">
                    Apply Strategy
                </button>
            </div>
        </div>
    `;
    
    setupStakingListeners();
}

function renderStatCard(title, id, icon, colorClass, hasButton = false) {
    return `
        <div class="glass-panel p-5 flex flex-col justify-between relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <i class="fa-solid ${icon} text-5xl ${colorClass.replace('text-', 'text-')}"></i> </div>
            <p class="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">${title}</p>
            <div class="flex items-end justify-between">
                <p class="text-2xl font-mono text-white font-bold truncate" id="${id}">--</p>
                ${hasButton ? 
                    `<button id="earn-claim-btn" class="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-1.5 px-4 rounded shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed" disabled>Claim</button>` 
                    : ''}
            </div>
        </div>
    `;
}

// =========================================================================
// 2. LÓGICA DE DADOS
// =========================================================================

async function updateStakingData(forceRefresh = false) {
    if (!State.isConnected) {
        resetStakingUI();
        return;
    }

    const now = Date.now();
    if (!forceRefresh && isStakingLoading && (now - lastStakingFetch < 60000)) return;
    
    isStakingLoading = true;
    lastStakingFetch = now;

    try {
        // [FIX CRÍTICO]: Carregar dados PÚBLICOS e PRIVADOS simultaneamente
        // Isso garante que o "Total Network Staked" atualize ao clicar no refresh
        await Promise.all([
            loadUserData(forceRefresh),
            loadUserDelegations(forceRefresh),
            loadPublicData() 
        ]);

        const netPStakeEl = document.getElementById('earn-total-network-pstake');
        if(netPStakeEl) netPStakeEl.textContent = formatPStake(State.totalNetworkPStake || 0n);

        // Atualiza Cards do Usuário
        const balDisplay = document.getElementById('staking-balance-display');
        const myPStakeDisplay = document.getElementById('earn-my-pstake');
        
        if(balDisplay) balDisplay.textContent = formatBigNumber(State.currentUserBalance).toFixed(2);
        if(myPStakeDisplay) myPStakeDisplay.textContent = formatPStake(State.userTotalPStake);

        const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
        const totalRewards = stakingRewards + minerRewards;
        
        const rewardsEl = document.getElementById('earn-my-rewards');
        const claimBtn = document.getElementById('earn-claim-btn');
        
        if (rewardsEl) rewardsEl.textContent = `${formatBigNumber(totalRewards).toFixed(4)}`;
        
        if (claimBtn) {
            if (totalRewards > 0n) {
                claimBtn.disabled = false;
                claimBtn.onclick = () => handleClaimRewards(stakingRewards, minerRewards, claimBtn);
            } else {
                claimBtn.disabled = true;
            }
        }

        renderDelegationsList();
        
        // Disparar uma atualização visual da simulação para garantir consistência
        const amountInput = document.getElementById('staking-amount-input');
        if (amountInput) amountInput.dispatchEvent(new Event('input'));

    } catch (error) {
        console.error("Staking Data Error:", error);
    } finally {
        isStakingLoading = false;
    }
}

function resetStakingUI() {
    const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
    setTxt('earn-total-network-pstake', '--');
    setTxt('earn-my-pstake', '--');
    setTxt('earn-my-rewards', '--');
    setTxt('staking-balance-display', '--');
    const container = document.getElementById('my-delegations-container');
    if(container) container.innerHTML = renderNoData("Connect wallet to view delegations.");
}

// =========================================================================
// 3. LISTA DE DELEGAÇÕES
// =========================================================================

function renderDelegationsList() {
    const container = document.getElementById('my-delegations-container');
    if (!container) return;

    const delegations = State.userDelegations || [];

    if (delegations.length === 0) {
        container.innerHTML = renderNoData("You have no active delegations.");
        return;
    }

    renderPaginatedList(
        delegations, 
        container, 
        (d) => {
            const amountFormatted = formatBigNumber(d.amount).toFixed(2);
            const pStake = calculatePStake(d.amount, d.lockDuration);
            const unlockTimestamp = Number(d.unlockTime);
            const nowSeconds = Math.floor(Date.now() / 1000);
            const isLocked = unlockTimestamp > nowSeconds;
            
            return `
                <div class="glass-panel p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border border-zinc-800">
                    <div class="flex items-center gap-4 w-full sm:w-auto">
                        <div class="bg-zinc-800 p-3 rounded-lg">
                            <i class="fa-solid fa-lock text-zinc-400"></i>
                        </div>
                        <div>
                            <p class="text-white font-bold text-lg">${amountFormatted} <span class="text-zinc-500 text-xs">$BKC</span></p>
                            <p class="text-purple-400 text-xs font-mono font-bold">${formatPStake(pStake)} pStake</p>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-end gap-2 w-full sm:w-auto">
                        <div class="countdown-timer text-xs font-mono text-zinc-300 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-700" data-unlock-time="${unlockTimestamp}" data-index="${d.index}">
                            ${isLocked ? 'Calculating...' : '<span class="text-green-400">Unlocked</span>'}
                        </div>
                        <div class="flex gap-2 mt-1">
                            ${isLocked ? 
                                `<button class="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold tracking-wider force-unstake-btn px-2 py-1" data-index="${d.index}">
                                    Force Unstake
                                </button>` : ''
                            }
                            <button class="${isLocked ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'} text-xs font-bold py-1.5 px-4 rounded transition-colors unstake-btn" 
                                    data-index="${d.index}" ${isLocked ? 'disabled' : ''}>
                                Unstake
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },
        4, 
        delegationCurrentPage,
        (newPage) => { delegationCurrentPage = newPage; renderDelegationsList(); },
        'space-y-3'
    );

    const timers = container.querySelectorAll('.countdown-timer');
    if (timers.length > 0) startCountdownTimers(Array.from(timers));

    container.querySelectorAll('.unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUnstake(btn.dataset.index, false));
    });
    container.querySelectorAll('.force-unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUnstake(btn.dataset.index, true));
    });
}

function calculatePStake(amount, duration) {
    try {
        const amountBig = BigInt(amount);
        const durationBig = BigInt(duration);
        const daySeconds = 86400n;
        const divisor = 10n**18n; 
        return (amountBig * (durationBig / daySeconds)) / divisor;
    } catch { return 0n; }
}

// =========================================================================
// 4. INTERAÇÃO (LISTENERS & MODAL)
// =========================================================================

function setupStakingListeners() {
    const amountInput = document.getElementById('staking-amount-input');
    const confirmBtn = document.getElementById('confirm-stake-btn');
    const refreshBtn = document.getElementById('refresh-delegations-btn');
    
    const modal = document.getElementById('duration-modal');
    const openModalBtn = document.getElementById('open-duration-modal');
    const closeModalBtn = document.getElementById('close-duration-modal');
    const applyStrategyBtn = document.getElementById('apply-duration-btn');
    const modalSlider = document.getElementById('staking-duration-slider');
    const modalDisplay = document.getElementById('modal-duration-display');
    const warningBox = document.getElementById('duration-warning');
    const strategyBadge = document.getElementById('strategy-badge');

    const updateSimulation = () => {
        const amountVal = amountInput.value;
        
        if (!amountVal || amountVal <= 0) {
            document.getElementById('staking-net-display').textContent = "0.00";
            document.getElementById('staking-pstake-display').textContent = "0";
            confirmBtn.disabled = true;
            return;
        }

        try {
            const amountWei = ethers.parseUnits(amountVal, 18);
            
            // Taxa dinâmica (Ex: 0%, buscar de State.systemFees se disponível)
            const DELEGATION_FEE_BIPS = State.systemFees?.["DELEGATION_FEE_BIPS"] || 0n; 
            const feeWei = (amountWei * DELEGATION_FEE_BIPS) / 10000n;
            const netWei = amountWei - feeWei;
            
            const durationSeconds = BigInt(currentStakingDuration) * 86400n;
            const pStake = calculatePStake(netWei, durationSeconds);

            document.getElementById('staking-net-display').textContent = formatBigNumber(netWei).toFixed(4);
            document.getElementById('staking-pstake-display').textContent = formatPStake(pStake);
            
            if (amountWei > State.currentUserBalance) {
                confirmBtn.disabled = true;
                amountInput.classList.add('border-red-500');
            } else {
                confirmBtn.disabled = false;
                amountInput.classList.remove('border-red-500');
            }
        } catch (e) {
            confirmBtn.disabled = true;
        }
    };

    // --- MODAL LOGIC ---
    const updateModalUI = () => {
        const days = parseInt(modalSlider.value);
        const years = (days / 365).toFixed(1);
        modalDisplay.textContent = `${days} Days (${years} Years)`;
        
        if (days < 3600) {
            warningBox.classList.remove('hidden');
            modalDisplay.classList.add('text-amber-400');
            modalDisplay.classList.remove('text-purple-400');
        } else {
            warningBox.classList.add('hidden');
            modalDisplay.classList.add('text-purple-400');
            modalDisplay.classList.remove('text-amber-400');
        }
    };

    const applyStrategy = () => {
        currentStakingDuration = parseInt(modalSlider.value);
        
        const durationName = currentStakingDuration >= 3600 
            ? `Diamond Hands (${(currentStakingDuration/365).toFixed(0)}Y)`
            : `Custom (${currentStakingDuration} Days)`;

        strategyBadge.className = currentStakingDuration >= 3600
            ? "inline-flex items-center gap-2 bg-purple-500/10 text-purple-300 px-3 py-1 rounded border border-purple-500/20"
            : "inline-flex items-center gap-2 bg-amber-500/10 text-amber-300 px-3 py-1 rounded border border-amber-500/20";
            
        strategyBadge.innerHTML = `<i class="fa-solid ${currentStakingDuration >= 3600 ? 'fa-gem' : 'fa-clock'}"></i> <span class="font-bold text-sm">${durationName}</span>`;

        modal.classList.add('opacity-0');
        modal.querySelector('div').classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
        
        updateSimulation(); 
    };

    // --- Events ---
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modalSlider.value = currentStakingDuration;
            updateModalUI();
            modal.classList.remove('hidden');
            setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
        });
        
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('opacity-0');
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        });

        modalSlider.addEventListener('input', updateModalUI);
        applyStrategyBtn.addEventListener('click', applyStrategy);
    }

    if(amountInput) {
        amountInput.addEventListener('input', updateSimulation);
        
        document.querySelectorAll('.stake-perc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const perc = parseInt(btn.dataset.perc);
                const bal = State.currentUserBalance || 0n;
                const amount = (bal * BigInt(perc)) / 100n;
                amountInput.value = ethers.formatUnits(amount, 18);
                updateSimulation();
            });
        });

        confirmBtn.addEventListener('click', async () => {
            const amountWei = ethers.parseUnits(amountInput.value, 18);
            const durationSec = BigInt(currentStakingDuration) * 86400n; 
            
            confirmBtn.innerHTML = `<div class="loader inline-block mr-2"></div> Sending...`;
            confirmBtn.disabled = true;

            const success = await executeDelegation(amountWei, durationSec, 0, confirmBtn);
            
            if (success) {
                // [FIX CRÍTICO]: Limpar e Resetar a Simulação Visual
                amountInput.value = "";
                updateSimulation(); 
                updateStakingData(true); 
            } else {
                confirmBtn.innerHTML = `Delegate Now <i class="fa-solid fa-arrow-right ml-2"></i>`;
                confirmBtn.disabled = false;
            }
        });
    }

    if(refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            updateStakingData(true).then(() => icon.classList.remove('fa-spin'));
        });
    }
}

async function handleUnstake(index, isForce) {
    const success = isForce 
        ? await executeForceUnstake(Number(index))
        : await executeUnstake(Number(index));
    
    if (success) updateStakingData(true);
}

async function handleClaimRewards(stakingRewards, minerRewards, btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="loader inline-block"></div>`;
    const success = await executeUniversalClaim(stakingRewards, minerRewards, btn);
    if (success) {
        showToast("Rewards claimed!", "success");
        updateStakingData(true);
    } else {
        btn.disabled = false;
        btn.innerHTML = "Claim";
    }
}

// =========================================================================
// 5. EXPORTAÇÃO
// =========================================================================

export const EarnPage = {
    async render(isNewPage) {
        renderEarnLayout();
        
        if (State.isConnected) {
            await updateStakingData(isNewPage); 
        } else {
            resetStakingUI();
        }
    },
    
    update(isConnected) {
        updateStakingData();
    }
};