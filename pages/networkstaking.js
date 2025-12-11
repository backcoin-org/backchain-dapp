// pages/NetworkStakingPage.js
// ✅ VERSION V6.0: Clean UI, Mobile-First, V2.1 Compatible

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
    loadUserDelegations,
    getHighestBoosterBoostFromAPI
} from '../modules/data.js';
import { 
    executeDelegation, 
    executeUnstake, 
    executeForceUnstake, 
    executeUniversalClaim 
} from '../modules/transactions.js';
import { showToast, startCountdownTimers } from '../ui-feedback.js';

// --- Local State ---
let isStakingLoading = false;
let lastStakingFetch = 0;
let delegationCurrentPage = 1;
let currentStakingDuration = 3650; // Default: 10 Years
let highestBoosterTokenId = 0n;

// --- Helpers ---
function formatTimeRemaining(seconds) {
    if (seconds <= 0) return 'Unlocked';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 365) return `${(days / 365).toFixed(1)}y`;
    if (days > 30) return `${Math.floor(days / 30)}mo ${days % 30}d`;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
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
// 1. RENDER LAYOUT - CLEAN & MOBILE-FIRST
// =========================================================================

function renderEarnLayout() {
    const container = document.getElementById('mine');
    if (!container) return;
    if (container.querySelector('#earn-main-content')) return;

    container.innerHTML = `
        <div id="earn-main-content" class="max-w-6xl mx-auto py-4 px-4">
            
            <!-- HEADER -->
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-xl font-bold text-white">Stake & Earn</h1>
                <button id="refresh-delegations-btn" class="text-xs bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all">
                    <i class="fa-solid fa-rotate"></i> <span class="hidden sm:inline">Refresh</span>
                </button>
            </div>

            <!-- METRICS ROW -->
            <div class="grid grid-cols-3 gap-3 mb-6">
                ${renderStatCard('Network pStake', 'earn-total-network-pstake', 'fa-globe', 'purple')}
                ${renderStatCard('Your pStake', 'earn-my-pstake', 'fa-user', 'blue')}
                ${renderStatCard('Rewards', 'earn-my-rewards', 'fa-gift', 'amber', true)}
            </div>

            <!-- MAIN GRID -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                <!-- LEFT: Staking Form -->
                <div class="lg:col-span-2">
                    <div class="glass-panel p-5 border border-purple-500/20">
                        
                        <div class="flex items-center gap-2 mb-4">
                            <i class="fa-solid fa-layer-group text-purple-400"></i>
                            <h2 class="text-lg font-bold text-white">Delegate</h2>
                        </div>

                        <!-- Amount Input -->
                        <div class="mb-4">
                            <div class="flex justify-between mb-1">
                                <label class="text-xs font-medium text-zinc-400">Amount</label>
                                <span class="text-[10px] text-zinc-500">
                                    Balance: <span id="staking-balance-display" class="text-white font-mono">--</span>
                                </span>
                            </div>
                            <div class="relative">
                                <input type="number" id="staking-amount-input" placeholder="0.00" 
                                    class="w-full bg-black border border-zinc-700 rounded-lg p-3 text-xl text-white focus:border-purple-500 transition-colors font-mono outline-none placeholder-zinc-700">
                                <button class="stake-perc-btn absolute right-2 top-2 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-2 py-1.5 rounded transition-colors" data-perc="100">
                                    MAX
                                </button>
                            </div>
                        </div>

                        <!-- Duration Strategy -->
                        <div class="bg-zinc-800/40 border border-zinc-700 rounded-lg p-3 mb-4">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-[10px] text-zinc-500 uppercase tracking-wider">Lock Period</span>
                                <button id="open-duration-modal" class="text-[10px] text-purple-400 hover:text-white transition-colors">
                                    <i class="fa-solid fa-sliders mr-1"></i> Change
                                </button>
                            </div>
                            <div id="strategy-badge" class="inline-flex items-center gap-2 bg-purple-500/10 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/20">
                                <i class="fa-solid fa-gem"></i>
                                <span id="strategy-name" class="font-bold">10 Years</span>
                            </div>
                        </div>

                        <!-- Simulation Results -->
                        <div class="grid grid-cols-2 gap-3 mb-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <div>
                                <p class="text-[10px] text-zinc-500 mb-0.5">Net Amount</p>
                                <p class="text-white font-mono text-sm" id="staking-net-display">0.00 BKC</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-purple-400 mb-0.5">pStake Power</p>
                                <p class="text-xl font-bold text-white font-mono" id="staking-pstake-display">0</p>
                            </div>
                        </div>

                        <!-- Fee Info -->
                        <div id="fee-info" class="text-[10px] text-zinc-500 mb-4 flex items-center gap-1">
                            <i class="fa-solid fa-info-circle"></i>
                            <span>Fee: <span id="fee-display">0.5%</span> • Distribution: 30% Treasury / 70% Stakers</span>
                        </div>

                        <!-- Confirm Button -->
                        <button id="confirm-stake-btn" class="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            <span>Delegate</span> <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>

                    <!-- Info Card -->
                    <div class="glass-panel p-4 mt-4 border-zinc-700/50">
                        <h3 class="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1">
                            <i class="fa-solid fa-lightbulb text-amber-500"></i> How it works
                        </h3>
                        <ul class="text-[11px] text-zinc-500 space-y-1.5">
                            <li class="flex items-start gap-2">
                                <i class="fa-solid fa-check text-green-500 mt-0.5 text-[9px]"></i>
                                <span>Longer lock = more pStake power</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fa-solid fa-check text-green-500 mt-0.5 text-[9px]"></i>
                                <span>pStake = your share of network rewards</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fa-solid fa-check text-green-500 mt-0.5 text-[9px]"></i>
                                <span>Use NFT Booster for fee discounts</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- RIGHT: Delegations List -->
                <div class="lg:col-span-3">
                    <div class="glass-panel p-4 min-h-[400px]">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-sm font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-list text-zinc-500"></i> My Delegations
                            </h2>
                            <span id="delegation-count" class="text-[10px] text-zinc-600 font-mono">0 active</span>
                        </div>
                        
                        <div id="my-delegations-container" class="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                            ${renderLoading()}
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Duration Modal -->
        ${renderDurationModal()}
    `;
    
    setupStakingListeners();
}

function renderStatCard(title, id, icon, color, hasButton = false) {
    const colorClasses = {
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20'
    };
    const classes = colorClasses[color] || colorClasses.purple;
    const iconColor = classes.split(' ')[0];
    
    return `
        <div class="glass-panel p-3 sm:p-4">
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid ${icon} ${iconColor} text-xs"></i>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">${title}</span>
            </div>
            <div class="flex items-end justify-between gap-2">
                <p class="text-base sm:text-lg font-mono text-white font-bold truncate" id="${id}">--</p>
                ${hasButton ? 
                    `<button id="earn-claim-btn" class="bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold py-1 px-2 sm:px-3 rounded shadow transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0" disabled>
                        Claim
                    </button>` 
                : ''}
            </div>
        </div>
    `;
}

function renderDurationModal() {
    return `
        <div id="duration-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div class="bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full p-5 shadow-2xl relative">
                <button id="close-duration-modal" class="absolute top-3 right-3 text-zinc-500 hover:text-white">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                
                <h3 class="text-lg font-bold text-white mb-1">Lock Duration</h3>
                <p class="text-xs text-zinc-400 mb-4">Longer locks = more pStake power</p>

                <div class="mb-6">
                    <div class="flex justify-between text-sm mb-3">
                        <span class="text-zinc-400">Duration:</span>
                        <span id="modal-duration-display" class="text-purple-400 font-bold">10 Years</span>
                    </div>
                    <input type="range" id="staking-duration-slider" min="1" max="3650" value="3650" 
                        class="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500">
                    <div class="flex justify-between text-[10px] text-zinc-600 mt-1">
                        <span>1 Day</span>
                        <span>10 Years</span>
                    </div>
                </div>

                <div class="bg-amber-900/20 border border-amber-500/20 p-2 rounded-lg mb-4 hidden" id="duration-warning">
                    <p class="text-[10px] text-amber-300 flex items-center gap-1">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        Shorter duration = less pStake power
                    </p>
                </div>

                <div class="grid grid-cols-4 gap-2 mb-4">
                    <button class="duration-preset text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-1.5 rounded transition-colors" data-days="30">1M</button>
                    <button class="duration-preset text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-1.5 rounded transition-colors" data-days="365">1Y</button>
                    <button class="duration-preset text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-1.5 rounded transition-colors" data-days="1825">5Y</button>
                    <button class="duration-preset text-[10px] bg-purple-600 hover:bg-purple-500 text-white py-1.5 rounded transition-colors" data-days="3650">10Y</button>
                </div>

                <button id="apply-duration-btn" class="w-full bg-white text-black font-bold py-2.5 rounded-lg hover:bg-zinc-200 transition-colors text-sm">
                    Apply
                </button>
            </div>
        </div>
    `;
}

// =========================================================================
// 2. DATA LOGIC
// =========================================================================

async function updateStakingData(forceRefresh = false) {
    if (!State.isConnected) {
        resetStakingUI();
        return;
    }

    const now = Date.now();
    if (!forceRefresh && isStakingLoading && (now - lastStakingFetch < 10000)) return;
    
    isStakingLoading = true;
    lastStakingFetch = now;

    try {
        // Get user's best Booster NFT
        const boosterData = await getHighestBoosterBoostFromAPI();
        highestBoosterTokenId = boosterData?.tokenId ? BigInt(boosterData.tokenId) : 0n;

        // Load all data in parallel
        await Promise.all([
            loadUserData(forceRefresh),
            loadUserDelegations(forceRefresh),
            loadPublicData()
        ]);

        // Update Network Stats
        const netPStakeEl = document.getElementById('earn-total-network-pstake');
        if(netPStakeEl) netPStakeEl.textContent = formatPStake(State.totalNetworkPStake || 0n);

        // Update User Stats
        const balDisplay = document.getElementById('staking-balance-display');
        const myPStakeDisplay = document.getElementById('earn-my-pstake');
        
        if(balDisplay) balDisplay.textContent = formatBigNumber(State.currentUserBalance).toFixed(2);
        if(myPStakeDisplay) myPStakeDisplay.textContent = formatPStake(State.userTotalPStake);

        // Calculate and display rewards
        const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
        const totalRewards = stakingRewards + minerRewards;
        
        const rewardsEl = document.getElementById('earn-my-rewards');
        const claimBtn = document.getElementById('earn-claim-btn');
        
        if (rewardsEl) {
            rewardsEl.textContent = formatBigNumber(totalRewards).toFixed(4);
        }
        
        if (claimBtn) {
            if (totalRewards > 0n) {
                claimBtn.disabled = false;
                claimBtn.onclick = () => handleClaimRewards(stakingRewards, minerRewards, claimBtn);
            } else {
                claimBtn.disabled = true;
            }
        }

        // Update fee display
        const feeDisplay = document.getElementById('fee-display');
        if (feeDisplay) {
            const feeBips = State.systemFees?.["DELEGATION_FEE_BIPS"] || 50n;
            feeDisplay.textContent = `${Number(feeBips) / 100}%`;
        }

        renderDelegationsList();
        
        // Trigger simulation update
        const amountInput = document.getElementById('staking-amount-input');
        if (amountInput && amountInput.value) {
            amountInput.dispatchEvent(new Event('input'));
        }

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
    if(container) container.innerHTML = renderNoData("Connect wallet to view delegations");
    
    const countEl = document.getElementById('delegation-count');
    if(countEl) countEl.textContent = '0 active';
}

// =========================================================================
// 3. DELEGATIONS LIST
// =========================================================================

function renderDelegationsList() {
    const container = document.getElementById('my-delegations-container');
    if (!container) return;

    const delegations = State.userDelegations || [];
    
    // Update count
    const countEl = document.getElementById('delegation-count');
    if(countEl) countEl.textContent = `${delegations.length} active`;

    if (delegations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10">
                <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-layer-group text-2xl text-zinc-600"></i>
                </div>
                <p class="text-zinc-500 text-sm mb-3">No active delegations</p>
                <p class="text-zinc-600 text-xs">Delegate BKC above to start earning</p>
            </div>
        `;
        return;
    }

    renderPaginatedList(
        delegations, 
        container, 
        renderDelegationCard,
        4, 
        delegationCurrentPage,
        (newPage) => { delegationCurrentPage = newPage; renderDelegationsList(); },
        'space-y-2'
    );

    // Start countdown timers
    const timers = container.querySelectorAll('.countdown-timer');
    if (timers.length > 0) startCountdownTimers(Array.from(timers));

    // Attach event listeners
    container.querySelectorAll('.unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUnstake(btn.dataset.index, false));
    });
    container.querySelectorAll('.force-unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUnstake(btn.dataset.index, true));
    });
}

function renderDelegationCard(d) {
    const amountFormatted = formatBigNumber(d.amount).toFixed(2);
    const pStake = calculatePStake(d.amount, d.lockDuration);
    const unlockTimestamp = Number(d.unlockTime);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const isLocked = unlockTimestamp > nowSeconds;
    const timeRemaining = isLocked ? unlockTimestamp - nowSeconds : 0;
    
    const statusColor = isLocked ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20';
    const statusText = isLocked ? formatTimeRemaining(timeRemaining) : 'Ready';
    
    return `
        <div class="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 hover:border-zinc-600 transition-colors">
            <div class="flex items-center justify-between gap-3">
                
                <!-- Left: Amount & pStake -->
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-lock text-zinc-500 text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white font-bold text-sm truncate">${amountFormatted} <span class="text-zinc-500 text-xs">BKC</span></p>
                        <p class="text-purple-400 text-[10px] font-mono">${formatPStake(pStake)} pS</p>
                    </div>
                </div>

                <!-- Right: Status & Actions -->
                <div class="flex items-center gap-2 flex-shrink-0">
                    <div class="countdown-timer text-[10px] font-mono ${statusColor} px-2 py-1 rounded border" 
                         data-unlock-time="${unlockTimestamp}" data-index="${d.index}">
                        ${statusText}
                    </div>
                    
                    ${isLocked ? `
                        <button class="force-unstake-btn text-[10px] text-red-400 hover:text-red-300 font-medium px-2 py-1 hover:bg-red-500/10 rounded transition-colors" 
                                data-index="${d.index}" title="50% penalty">
                            <i class="fa-solid fa-bolt"></i>
                        </button>
                    ` : `
                        <button class="unstake-btn bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded hover:bg-zinc-200 transition-colors" 
                                data-index="${d.index}">
                            Unstake
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

// =========================================================================
// 4. EVENT LISTENERS
// =========================================================================

function setupStakingListeners() {
    const amountInput = document.getElementById('staking-amount-input');
    const confirmBtn = document.getElementById('confirm-stake-btn');
    const refreshBtn = document.getElementById('refresh-delegations-btn');
    
    const modal = document.getElementById('duration-modal');
    const openModalBtn = document.getElementById('open-duration-modal');
    const closeModalBtn = document.getElementById('close-duration-modal');
    const applyBtn = document.getElementById('apply-duration-btn');
    const slider = document.getElementById('staking-duration-slider');
    const durationDisplay = document.getElementById('modal-duration-display');
    const warningBox = document.getElementById('duration-warning');
    const strategyBadge = document.getElementById('strategy-badge');

    // --- Simulation Logic ---
    const updateSimulation = () => {
        const amountVal = amountInput?.value;
        
        if (!amountVal || parseFloat(amountVal) <= 0) {
            document.getElementById('staking-net-display').textContent = "0.00 BKC";
            document.getElementById('staking-pstake-display').textContent = "0";
            if(confirmBtn) confirmBtn.disabled = true;
            return;
        }

        try {
            const amountWei = ethers.parseUnits(amountVal, 18);
            
            // Dynamic fee from V2.1 (default 0.5%)
            const DELEGATION_FEE_BIPS = State.systemFees?.["DELEGATION_FEE_BIPS"] || 50n;
            const feeWei = (amountWei * BigInt(DELEGATION_FEE_BIPS)) / 10000n;
            const netWei = amountWei - feeWei;
            
            const durationSeconds = BigInt(currentStakingDuration) * 86400n;
            const pStake = calculatePStake(netWei, durationSeconds);

            document.getElementById('staking-net-display').textContent = `${formatBigNumber(netWei).toFixed(4)} BKC`;
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

    // --- Modal Logic ---
    const updateModalUI = () => {
        const days = parseInt(slider.value);
        let displayText;
        
        if (days >= 365) {
            const years = (days / 365).toFixed(days >= 730 ? 0 : 1);
            displayText = `${years} Year${years > 1 ? 's' : ''}`;
        } else if (days >= 30) {
            displayText = `${Math.floor(days / 30)} Month${days >= 60 ? 's' : ''}`;
        } else {
            displayText = `${days} Day${days > 1 ? 's' : ''}`;
        }
        
        durationDisplay.textContent = displayText;
        
        // Warning for short durations
        if (days < 365) {
            warningBox.classList.remove('hidden');
            durationDisplay.className = 'text-amber-400 font-bold';
        } else {
            warningBox.classList.add('hidden');
            durationDisplay.className = 'text-purple-400 font-bold';
        }
    };

    const applyStrategy = () => {
        currentStakingDuration = parseInt(slider.value);
        
        let badgeName;
        if (currentStakingDuration >= 3650) badgeName = '10 Years';
        else if (currentStakingDuration >= 1825) badgeName = '5 Years';
        else if (currentStakingDuration >= 365) badgeName = `${Math.floor(currentStakingDuration/365)} Year${currentStakingDuration >= 730 ? 's' : ''}`;
        else if (currentStakingDuration >= 30) badgeName = `${Math.floor(currentStakingDuration/30)} Month${currentStakingDuration >= 60 ? 's' : ''}`;
        else badgeName = `${currentStakingDuration} Days`;

        const isLong = currentStakingDuration >= 365;
        strategyBadge.className = isLong
            ? "inline-flex items-center gap-2 bg-purple-500/10 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/20"
            : "inline-flex items-center gap-2 bg-amber-500/10 text-amber-300 px-2 py-1 rounded text-xs border border-amber-500/20";
        
        document.getElementById('strategy-name').textContent = badgeName;
        
        closeModal();
        updateSimulation();
    };

    const openModal = () => {
        slider.value = currentStakingDuration;
        updateModalUI();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    const closeModal = () => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    };

    // --- Event Bindings ---
    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    if (slider) slider.addEventListener('input', updateModalUI);
    if (applyBtn) applyBtn.addEventListener('click', applyStrategy);

    // Duration presets
    document.querySelectorAll('.duration-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            slider.value = btn.dataset.days;
            updateModalUI();
        });
    });

    if(amountInput) {
        amountInput.addEventListener('input', updateSimulation);
        
        // Max button
        document.querySelectorAll('.stake-perc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const perc = parseInt(btn.dataset.perc);
                const bal = State.currentUserBalance || 0n;
                const amount = (bal * BigInt(perc)) / 100n;
                amountInput.value = ethers.formatUnits(amount, 18);
                updateSimulation();
            });
        });

        // Confirm stake
        confirmBtn?.addEventListener('click', async () => {
            const amountWei = ethers.parseUnits(amountInput.value, 18);
            const durationSec = BigInt(currentStakingDuration) * 86400n; 
            
            confirmBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...`;
            confirmBtn.disabled = true;

            const success = await executeDelegation(amountWei, durationSec, highestBoosterTokenId, confirmBtn);
            
            if (success) {
                amountInput.value = "";
                updateSimulation(); 
                updateStakingData(true);
                showToast("Delegation successful!", "success");
            }
            
            confirmBtn.innerHTML = `<span>Delegate</span> <i class="fa-solid fa-arrow-right"></i>`;
            confirmBtn.disabled = false;
        });
    }

    // Refresh button
    if(refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            updateStakingData(true).then(() => {
                setTimeout(() => icon.classList.remove('fa-spin'), 500);
            });
        });
    }
}

// =========================================================================
// 5. ACTIONS
// =========================================================================

async function handleUnstake(index, isForce) {
    const success = isForce 
        ? await executeForceUnstake(Number(index), highestBoosterTokenId)
        : await executeUnstake(Number(index), highestBoosterTokenId);
    
    if (success) {
        showToast(isForce ? "Force unstaked (50% penalty applied)" : "Unstaked successfully!", isForce ? "warning" : "success");
        updateStakingData(true);
    }
}

async function handleClaimRewards(stakingRewards, minerRewards, btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
    
    const success = await executeUniversalClaim(stakingRewards, minerRewards, highestBoosterTokenId, btn);
    
    if (success) {
        showToast("Rewards claimed!", "success");
        updateStakingData(true);
    } else {
        btn.disabled = false;
        btn.innerHTML = "Claim";
    }
}

// =========================================================================
// 6. EXPORT
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
        if (isConnected) {
            updateStakingData();
        } else {
            resetStakingUI();
        }
    }
};