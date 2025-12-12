// pages/NetworkStakingPage.js
// ✅ VERSION V2.1: Fixed button states, ETH gas check, better error handling

const ethers = window.ethers;

import { State } from '../state.js';
import { 
    formatBigNumber, 
    formatPStake, 
    renderLoading
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

// ============================================================================
// LOCAL STATE
// ============================================================================
let isLoading = false;
let lastFetch = 0;
let currentPage = 1;
let lockDays = 3650; // Default: 10 Years
let highestBoosterTokenId = 0n;
let isProcessing = false; // Track if a transaction is in progress

// ============================================================================
// HELPERS
// ============================================================================
function formatTimeRemaining(seconds) {
    if (seconds <= 0) return 'Ready';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (d > 365) return `${Math.floor(d/365)}y : ${d%365}d`;
    if (d > 0) return `${d}d : ${h}h : ${m}m : ${s}s`;
    if (h > 0) return `${h}h : ${m}m : ${s}s`;
    return `${m}m : ${s}s`;
}

function formatDuration(days) {
    if (days >= 365) {
        const years = days / 365;
        return years >= 2 ? `${Math.floor(years)} Years` : `${years.toFixed(1)} Year`;
    }
    if (days >= 30) return `${Math.floor(days/30)} Month${days >= 60 ? 's' : ''}`;
    return `${days} Day${days > 1 ? 's' : ''}`;
}

function calculatePStake(amount, durationSec) {
    try {
        const amountBig = BigInt(amount);
        const durationBig = BigInt(durationSec);
        const daySeconds = 86400n;
        return (amountBig * (durationBig / daySeconds)) / (10n**18n);
    } catch { return 0n; }
}

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('staking-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'staking-styles';
    style.textContent = `
        .staking-card {
            background: linear-gradient(180deg, rgba(39,39,42,0.8) 0%, rgba(24,24,27,0.9) 100%);
            border: 1px solid rgba(63,63,70,0.5);
        }
        .staking-card:hover { border-color: rgba(139,92,246,0.3); }
        
        .duration-chip {
            transition: all 0.2s ease;
        }
        .duration-chip:hover { transform: scale(1.02); }
        .duration-chip.selected {
            background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
            border-color: #8b5cf6 !important;
            color: white !important;
        }
        
        .stake-btn {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            transition: all 0.2s ease;
        }
        .stake-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            transform: translateY(-1px);
        }
        .stake-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .delegation-item {
            transition: all 0.2s ease;
        }
        .delegation-item:hover { background: rgba(63,63,70,0.3); }
        
        .countdown-active {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .stat-glow-purple { box-shadow: 0 0 20px rgba(139,92,246,0.1); }
        .stat-glow-amber { box-shadow: 0 0 20px rgba(245,158,11,0.1); }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN RENDER
// ============================================================================
export function render() {
    const container = document.getElementById('mine');
    if (!container) return;

    injectStyles();
    
    container.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 py-4 sm:py-6">
            
            <!-- Header -->
            <div class="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                    <h1 class="text-xl sm:text-2xl font-bold text-white">Stake & Earn</h1>
                    <p class="text-xs text-zinc-500 mt-0.5">Lock BKC to earn network rewards</p>
                </div>
                <button id="refresh-btn" class="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors">
                    <i class="fa-solid fa-rotate text-zinc-400 hover:text-white"></i>
                </button>
            </div>

            <!-- Stats Row - Mobile Optimized -->
            <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div class="staking-card rounded-xl p-3 sm:p-4 stat-glow-purple">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-globe text-purple-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Network</span>
                    </div>
                    <p id="stat-network" class="text-sm sm:text-lg font-bold text-white font-mono">--</p>
                </div>
                
                <div class="staking-card rounded-xl p-3 sm:p-4">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-user text-blue-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Your pStake</span>
                    </div>
                    <p id="stat-pstake" class="text-sm sm:text-lg font-bold text-white font-mono">--</p>
                </div>
                
                <div class="staking-card rounded-xl p-3 sm:p-4 stat-glow-amber">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-coins text-amber-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Rewards</span>
                    </div>
                    <div class="flex items-center justify-between gap-1">
                        <p id="stat-rewards" class="text-sm sm:text-lg font-bold text-white font-mono truncate">--</p>
                        <button id="claim-btn" disabled class="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded transition-all flex-shrink-0">
                            Claim
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Content - Stack on Mobile -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                <!-- Delegate Card -->
                <div class="staking-card rounded-2xl p-4 sm:p-5">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-layer-group text-purple-400"></i>
                        </div>
                        <h2 class="text-lg font-bold text-white">Delegate</h2>
                    </div>

                    <!-- Amount Input -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-1.5">
                            <label class="text-xs text-zinc-400">Amount</label>
                            <span class="text-[10px] text-zinc-500">
                                Balance: <span id="balance-display" class="text-white font-mono">0.00</span> BKC
                            </span>
                        </div>
                        <div class="relative">
                            <input type="number" id="amount-input" placeholder="0.00" 
                                class="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 sm:p-4 text-xl sm:text-2xl text-white font-mono outline-none focus:border-purple-500 transition-colors pr-16">
                            <button id="max-btn" class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg transition-colors">
                                MAX
                            </button>
                        </div>
                    </div>

                    <!-- Lock Duration -->
                    <div class="mb-4">
                        <label class="text-xs text-zinc-400 mb-2 block">Lock Duration</label>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400" data-days="30">1M</button>
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400" data-days="365">1Y</button>
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400" data-days="1825">5Y</button>
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400 selected" data-days="3650">10Y</button>
                        </div>
                    </div>

                    <!-- Preview -->
                    <div class="bg-zinc-900/50 rounded-xl p-3 mb-4 border border-zinc-800">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-[10px] text-zinc-500 uppercase mb-0.5">You'll Receive</p>
                                <p class="text-xl sm:text-2xl font-bold text-purple-400 font-mono" id="preview-pstake">0</p>
                                <p class="text-[10px] text-zinc-500">pStake Power</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-zinc-500 uppercase mb-0.5">After Fee</p>
                                <p class="text-sm text-white font-mono" id="preview-net">0.00 BKC</p>
                                <p class="text-[10px] text-zinc-600" id="fee-info">0.5% fee</p>
                            </div>
                        </div>
                    </div>

                    <!-- Stake Button -->
                    <button id="stake-btn" disabled class="stake-btn w-full py-3 sm:py-4 rounded-xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                        <span id="stake-btn-text">Delegate BKC</span>
                        <i id="stake-btn-icon" class="fa-solid fa-arrow-right"></i>
                    </button>

                    <!-- Info Tips -->
                    <div class="mt-4 pt-4 border-t border-zinc-800">
                        <p class="text-[10px] text-zinc-600 flex items-center gap-1.5">
                            <i class="fa-solid fa-info-circle"></i>
                            Longer lock = more pStake = bigger share of rewards
                        </p>
                    </div>
                </div>

                <!-- My Delegations -->
                <div class="staking-card rounded-2xl p-4 sm:p-5">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                                <i class="fa-solid fa-list text-zinc-400"></i>
                            </div>
                            <h2 class="text-lg font-bold text-white">My Delegations</h2>
                        </div>
                        <span id="delegation-count" class="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-1 rounded">0</span>
                    </div>

                    <div id="delegations-list" class="space-y-2 max-h-[400px] overflow-y-auto">
                        ${renderLoading()}
                    </div>
                </div>

            </div>
        </div>
    `;

    setupListeners();
    
    if (State.isConnected) {
        loadData(true);
    } else {
        resetUI();
    }
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadData(force = false) {
    if (!State.isConnected) {
        resetUI();
        return;
    }

    const now = Date.now();
    if (!force && isLoading && (now - lastFetch < 10000)) return;
    
    isLoading = true;
    lastFetch = now;

    try {
        // Get booster NFT
        const boosterData = await getHighestBoosterBoostFromAPI();
        highestBoosterTokenId = boosterData?.tokenId ? BigInt(boosterData.tokenId) : 0n;

        // Load data in parallel
        await Promise.all([
            loadUserData(force),
            loadUserDelegations(force),
            loadPublicData()
        ]);

        // Update stats
        updateStats();
        renderDelegations();
        updatePreview();

    } catch (e) {
        console.error("Staking load error:", e);
    } finally {
        isLoading = false;
    }
}

function updateStats() {
    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setTxt('stat-network', formatPStake(State.totalNetworkPStake || 0n));
    setTxt('stat-pstake', formatPStake(State.userTotalPStake || 0n));
    setTxt('balance-display', formatBigNumber(State.currentUserBalance || 0n).toFixed(2));

    // Fee info
    const feeBips = State.systemFees?.["DELEGATION_FEE_BIPS"] || 50n;
    const feePercent = Number(feeBips) / 100;
    const feeEl = document.getElementById('fee-info');
    if (feeEl) feeEl.textContent = `${feePercent}% fee`;

    // Rewards
    calculateUserTotalRewards().then(({ stakingRewards, minerRewards }) => {
        const total = stakingRewards + minerRewards;
        setTxt('stat-rewards', formatBigNumber(total).toFixed(4));
        
        const claimBtn = document.getElementById('claim-btn');
        if (claimBtn) {
            claimBtn.disabled = total <= 0n;
            if (total > 0n) {
                claimBtn.onclick = () => handleClaim(stakingRewards, minerRewards, claimBtn);
            }
        }
    });
}

function resetUI() {
    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setTxt('stat-network', '--');
    setTxt('stat-pstake', '--');
    setTxt('stat-rewards', '--');
    setTxt('balance-display', '0.00');
    setTxt('delegation-count', '0');

    const list = document.getElementById('delegations-list');
    if (list) {
        list.innerHTML = `
            <div class="text-center py-10">
                <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-wallet text-xl text-zinc-600"></i>
                </div>
                <p class="text-zinc-500 text-sm">Connect wallet to view</p>
            </div>
        `;
    }
}

// ============================================================================
// DELEGATIONS LIST
// ============================================================================
function renderDelegations() {
    const container = document.getElementById('delegations-list');
    if (!container) return;

    const delegations = State.userDelegations || [];
    
    // Update count
    const countEl = document.getElementById('delegation-count');
    if (countEl) countEl.textContent = `${delegations.length} active`;

    if (delegations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10">
                <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-layer-group text-xl text-zinc-600"></i>
                </div>
                <p class="text-zinc-500 text-sm mb-1">No active delegations</p>
                <p class="text-zinc-600 text-xs">Delegate BKC to start earning</p>
            </div>
        `;
        return;
    }

    // Sort by unlock time
    const sorted = [...delegations].sort((a, b) => Number(a.unlockTime) - Number(b.unlockTime));
    
    container.innerHTML = sorted.map(d => renderDelegationItem(d)).join('');

    // Start countdown timers
    startCountdownTimers(Array.from(container.querySelectorAll('.countdown-timer')));

    // Attach event listeners
    container.querySelectorAll('.unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUnstake(btn.dataset.index, false));
    });
    container.querySelectorAll('.force-unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUnstake(btn.dataset.index, true));
    });
}

function renderDelegationItem(d) {
    const amount = formatBigNumber(d.amount).toFixed(2);
    const pStake = formatPStake(calculatePStake(d.amount, d.lockDuration));
    const unlockTime = Number(d.unlockTime);
    const now = Math.floor(Date.now() / 1000);
    const isLocked = unlockTime > now;
    const remaining = isLocked ? unlockTime - now : 0;

    return `
        <div class="delegation-item bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/50">
            <div class="flex items-center justify-between gap-3">
                <!-- Left: Info -->
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl ${isLocked ? 'bg-amber-500/10' : 'bg-green-500/10'} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid ${isLocked ? 'fa-lock text-amber-400' : 'fa-lock-open text-green-400'} text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white font-bold text-sm truncate">${amount} <span class="text-zinc-500 text-xs">BKC</span></p>
                        <p class="text-purple-400 text-[10px] font-mono">${pStake} pS</p>
                    </div>
                </div>

                <!-- Right: Timer & Action -->
                <div class="flex items-center gap-2 flex-shrink-0">
                    ${isLocked ? `
                        <div class="countdown-timer countdown-active text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/20" 
                             data-unlock-time="${unlockTime}">
                            ${formatTimeRemaining(remaining)}
                        </div>
                        <button class="force-unstake-btn w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors" 
                                data-index="${d.index}" title="Force unstake (50% penalty)">
                            <i class="fa-solid fa-bolt text-red-400 text-xs"></i>
                        </button>
                    ` : `
                        <span class="text-[10px] font-mono bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20">
                            Ready
                        </span>
                        <button class="unstake-btn bg-white hover:bg-zinc-200 text-black text-[10px] font-bold px-3 py-2 rounded-lg transition-colors" 
                                data-index="${d.index}">
                            Unstake
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// PREVIEW CALCULATION
// ============================================================================
function updatePreview() {
    const amountInput = document.getElementById('amount-input');
    const stakeBtn = document.getElementById('stake-btn');
    
    if (!amountInput) return;

    const val = amountInput.value;
    
    if (!val || parseFloat(val) <= 0) {
        document.getElementById('preview-pstake').textContent = '0';
        document.getElementById('preview-net').textContent = '0.00 BKC';
        if (stakeBtn) stakeBtn.disabled = true;
        return;
    }

    try {
        const amountWei = ethers.parseUnits(val, 18);
        const feeBips = State.systemFees?.["DELEGATION_FEE_BIPS"] || 50n;
        const feeWei = (amountWei * BigInt(feeBips)) / 10000n;
        const netWei = amountWei - feeWei;
        
        const durationSec = BigInt(lockDays) * 86400n;
        const pStake = calculatePStake(netWei, durationSec);

        document.getElementById('preview-pstake').textContent = formatPStake(pStake);
        document.getElementById('preview-net').textContent = `${formatBigNumber(netWei).toFixed(4)} BKC`;

        // Validate balance
        const balance = State.currentUserBalance || 0n;
        if (amountWei > balance) {
            amountInput.classList.add('border-red-500');
            if (stakeBtn) stakeBtn.disabled = true;
        } else {
            amountInput.classList.remove('border-red-500');
            if (stakeBtn) stakeBtn.disabled = isProcessing;
        }
    } catch (e) {
        if (stakeBtn) stakeBtn.disabled = true;
    }
}

// ============================================================================
// ACTIONS
// ============================================================================
async function handleStake() {
    if (isProcessing) return;
    
    const amountInput = document.getElementById('amount-input');
    const stakeBtn = document.getElementById('stake-btn');
    const btnText = document.getElementById('stake-btn-text');
    const btnIcon = document.getElementById('stake-btn-icon');
    
    if (!amountInput || !stakeBtn) return;
    
    const val = amountInput.value;
    if (!val || parseFloat(val) <= 0) {
        showToast('Enter an amount', 'warning');
        return;
    }

    // Validate balance
    const balance = State.currentUserBalance || 0n;
    let amountWei;
    try {
        amountWei = ethers.parseUnits(val, 18);
        if (amountWei > balance) {
            showToast('Insufficient BKC balance', 'error');
            return;
        }
    } catch (e) {
        showToast('Invalid amount', 'error');
        return;
    }

    // Check ETH balance for gas
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const ethBalance = await provider.getBalance(State.userAddress);
        const minEth = ethers.parseEther("0.001"); // Minimum ~0.001 ETH for gas
        
        if (ethBalance < minEth) {
            showToast('Insufficient ETH for gas. Need at least 0.001 ETH.', 'error');
            return;
        }
    } catch (e) {
        console.warn('ETH balance check failed:', e);
    }

    isProcessing = true;
    const durationSec = BigInt(lockDays) * 86400n;

    // Update button state
    stakeBtn.disabled = true;
    btnText.textContent = 'Processing...';
    btnIcon.className = 'fa-solid fa-spinner fa-spin';

    try {
        // Pass null for btnElement to prevent double-handling
        const success = await executeDelegation(amountWei, durationSec, highestBoosterTokenId, null);

        if (success) {
            amountInput.value = '';
            showToast('Delegation successful!', 'success');
            await loadData(true);
        }

    } catch (e) {
        console.error('Stake error:', e);
        showToast('Delegation failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        // ALWAYS reset button state
        isProcessing = false;
        stakeBtn.disabled = false;
        btnText.textContent = 'Delegate BKC';
        btnIcon.className = 'fa-solid fa-arrow-right';
        updatePreview();
    }
}

async function handleUnstake(index, isForce) {
    if (isProcessing) return;
    
    // Find the button and update its state
    const btn = document.querySelector(isForce 
        ? `.force-unstake-btn[data-index='${index}']`
        : `.unstake-btn[data-index='${index}']`
    );
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    }
    
    isProcessing = true;

    try {
        const success = isForce 
            ? await executeForceUnstake(Number(index), highestBoosterTokenId)
            : await executeUnstake(Number(index), highestBoosterTokenId);

        if (success) {
            showToast(isForce ? 'Force unstaked (50% penalty)' : 'Unstaked successfully!', isForce ? 'warning' : 'success');
            await loadData(true);
        }
    } catch (e) {
        console.error('Unstake error:', e);
        showToast('Unstake failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
        // Re-render delegations to reset button state
        renderDelegations();
    }
}

async function handleClaim(stakingRewards, minerRewards, btn) {
    if (isProcessing) return;
    isProcessing = true;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const success = await executeUniversalClaim(stakingRewards, minerRewards, highestBoosterTokenId, null);

        if (success) {
            showToast('Rewards claimed!', 'success');
            await loadData(true);
        }
    } catch (e) {
        console.error('Claim error:', e);
        showToast('Claim failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupListeners() {
    const amountInput = document.getElementById('amount-input');
    const maxBtn = document.getElementById('max-btn');
    const stakeBtn = document.getElementById('stake-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const durationChips = document.querySelectorAll('.duration-chip');

    // Amount input
    amountInput?.addEventListener('input', updatePreview);

    // Max button
    maxBtn?.addEventListener('click', () => {
        const balance = State.currentUserBalance || 0n;
        if (amountInput) {
            amountInput.value = ethers.formatUnits(balance, 18);
            updatePreview();
        }
    });

    // Duration selection
    durationChips.forEach(chip => {
        chip.addEventListener('click', () => {
            durationChips.forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            lockDays = parseInt(chip.dataset.days);
            updatePreview();
        });
    });

    // Stake button
    stakeBtn?.addEventListener('click', handleStake);

    // Refresh button
    refreshBtn?.addEventListener('click', () => {
        const icon = refreshBtn.querySelector('i');
        icon?.classList.add('fa-spin');
        loadData(true).then(() => {
            setTimeout(() => icon?.classList.remove('fa-spin'), 500);
        });
    });
}

// ============================================================================
// EXPORTS
// ============================================================================
export function update(isConnected) {
    if (isConnected) {
        loadData();
    } else {
        resetUI();
    }
}

export const EarnPage = {
    render,
    update
};