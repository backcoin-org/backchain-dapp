// pages/RewardsPage.js
// ✅ VERSION V9.0: Complete redesign - Mobile-first, modern UI, improved UX

const ethers = window.ethers;

import { State } from '../state.js';
import {
    calculateUserTotalRewards,
    calculateClaimDetails,
    getHighestBoosterBoostFromAPI,
    loadUserData
} from '../modules/data.js';
import { executeUniversalClaim } from '../modules/transactions.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';

// --- LOCAL STATE ---
let lastFetch = 0;
let isLoading = false;
let isProcessing = false;

// --- TIER DATA (matching contract) ---
const BOOSTER_TIERS = [
    { name: 'Crystal',  boostBips: 1000, discount: 10, color: '#22d3ee', icon: '💎' },
    { name: 'Iron',     boostBips: 2000, discount: 20, color: '#71717a', icon: '⚙️' },
    { name: 'Bronze',   boostBips: 3000, discount: 30, color: '#f97316', icon: '🥉' },
    { name: 'Silver',   boostBips: 4000, discount: 40, color: '#94a3b8', icon: '🥈' },
    { name: 'Gold',     boostBips: 5000, discount: 50, color: '#fbbf24', icon: '🥇' },
    { name: 'Platinum', boostBips: 6000, discount: 60, color: '#a855f7', icon: '💜' },
    { name: 'Diamond',  boostBips: 7000, discount: 70, color: '#60a5fa', icon: '💠' }
];

// ============================================================================
// STYLES
// ============================================================================

function injectStyles() {
    if (document.getElementById('rewards-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'rewards-styles';
    style.textContent = `
        /* Glow effects */
        .rewards-glow {
            box-shadow: 0 0 40px rgba(245,158,11,0.2);
        }
        .claim-ready {
            animation: claimPulse 2s ease-in-out infinite;
        }
        @keyframes claimPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.3); }
            50% { box-shadow: 0 0 40px rgba(245,158,11,0.5); }
        }
        
        /* Progress ring */
        .progress-ring {
            transform: rotate(-90deg);
        }
        .progress-ring-circle {
            transition: stroke-dashoffset 0.5s ease;
        }
        
        /* Shimmer effect for loading */
        .shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        /* Booster card hover */
        .booster-tier {
            transition: all 0.2s ease;
        }
        .booster-tier:hover {
            transform: translateY(-2px);
        }
        
        /* Claim success animation */
        @keyframes claimSuccess {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .claim-success {
            animation: claimSuccess 0.5s ease;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const RewardsPage = {
    async render(isNewPage) {
        const container = document.getElementById('rewards');
        if (!container) return;

        injectStyles();

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = getPageHTML();
        }

        if (State.isConnected) {
            await this.update(isNewPage);
        } else {
            renderNotConnected();
        }
    },

    async update(force = false) {
        if (!State.isConnected) {
            renderNotConnected();
            return;
        }

        const now = Date.now();
        if (!force && isLoading) return;
        if (!force && (now - lastFetch < 60000)) return;

        isLoading = true;
        showLoadingState();

        try {
            await loadUserData();

            const boosterData = await getHighestBoosterBoostFromAPI();
            
            const [claimDetails, grossRewards] = await Promise.all([
                calculateClaimDetails(),
                calculateUserTotalRewards()
            ]);

            renderContent(claimDetails, grossRewards, boosterData);
            lastFetch = now;

        } catch (e) {
            console.error("Rewards Error:", e);
            renderError();
        } finally {
            isLoading = false;
        }
    }
};

// ============================================================================
// PAGE STRUCTURE - MOBILE FIRST
// ============================================================================

function getPageHTML() {
    return `
        <div class="max-w-lg mx-auto px-4 py-4 pb-24">
            <!-- Header Compacto -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                        <i class="fa-solid fa-coins text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-white">Rewards</h1>
                        <p class="text-[10px] text-zinc-500">Claim your earnings</p>
                    </div>
                </div>
                <button id="rewards-refresh" class="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                    <i class="fa-solid fa-arrows-rotate text-xs"></i>
                </button>
            </div>

            <!-- Content -->
            <div id="rewards-content">
                <div class="flex items-center justify-center py-16">
                    <div class="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    `;
}

function showLoadingState() {
    const container = document.getElementById('rewards-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="space-y-4">
            <!-- Skeleton Card Principal -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div class="flex flex-col items-center">
                    <div class="w-20 h-20 rounded-full bg-zinc-800 shimmer mb-4"></div>
                    <div class="w-32 h-8 bg-zinc-800 rounded-lg shimmer mb-2"></div>
                    <div class="w-24 h-4 bg-zinc-800 rounded shimmer"></div>
                </div>
                <div class="mt-6 h-12 bg-zinc-800 rounded-xl shimmer"></div>
            </div>
            
            <!-- Skeleton Cards -->
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 h-24 shimmer"></div>
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 h-24 shimmer"></div>
            </div>
        </div>
    `;
}

// ============================================================================
// RENDER STATES
// ============================================================================

function renderNotConnected() {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-2xl text-zinc-600"></i>
            </div>
            <p class="text-zinc-400 font-medium mb-1">Wallet not connected</p>
            <p class="text-zinc-600 text-sm mb-4">Connect to view your rewards</p>
            <button onclick="window.openConnectModal()" 
                class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm rounded-xl transition-all">
                <i class="fa-solid fa-plug mr-2"></i>Connect Wallet
            </button>
        </div>
    `;
}

function renderError() {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 bg-zinc-900/50 border border-red-500/20 rounded-2xl">
            <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <i class="fa-solid fa-triangle-exclamation text-2xl text-red-400"></i>
            </div>
            <p class="text-zinc-400 font-medium mb-1">Failed to load</p>
            <p class="text-zinc-600 text-sm mb-4">Please try again</p>
            <button onclick="window.RewardsPage.update(true)" 
                class="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-xl transition-all">
                <i class="fa-solid fa-rotate-right mr-2"></i>Retry
            </button>
        </div>
    `;
}

// ============================================================================
// MAIN CONTENT - MOBILE FIRST DESIGN
// ============================================================================

function renderContent(claimDetails, grossRewards, boosterData) {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    // Process data
    const details = claimDetails || {};
    const gross = grossRewards || { stakingRewards: 0n, minerRewards: 0n };
    const booster = boosterData || { highestBoost: 0, boostName: 'None', tokenId: 0 };

    const netReward = details.netClaimAmount || 0n;
    const totalGross = details.totalRewards || 0n;
    const feeAmount = details.feeAmount || 0n;

    // Fee calculations
    const feeBips = details.baseFeeBips || Number(State.systemFees?.["CLAIM_REWARD_FEE_BIPS"] || 5000n);
    const feePercent = feeBips / 100;
    const boostPercent = booster.highestBoost / 100;
    
    const effectiveFeeBips = details.finalFeeBips || (feeBips - (feeBips * booster.highestBoost / 10000));
    const keepPercent = 100 - (effectiveFeeBips / 100);
    
    // Potential with Diamond
    const bestDiscount = 70;
    const potentialKeepPercent = 100 - (feePercent * (1 - bestDiscount / 100));
    const potentialReward = totalGross > 0n ? (totalGross * BigInt(Math.round(potentialKeepPercent * 100))) / 10000n : 0n;
    const extraGain = potentialReward > netReward ? potentialReward - netReward : 0n;

    const hasRewards = netReward > 0n;
    const hasBooster = booster.highestBoost > 0;
    const boosterTokenId = BigInt(booster.tokenId || 0);
    
    // Format numbers
    const netRewardNum = formatBigNumber(netReward);
    const totalGrossNum = formatBigNumber(totalGross);
    const feeAmountNum = formatBigNumber(feeAmount);
    const stakingNum = formatBigNumber(gross.stakingRewards);
    const miningNum = formatBigNumber(gross.minerRewards);

    // Progress ring percentage (how much you keep)
    const ringPercent = keepPercent;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (ringPercent / 100) * circumference;

    container.innerHTML = `
        <div class="space-y-4">
            
            <!-- MAIN CLAIM CARD -->
            <div class="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5 ${hasRewards ? 'claim-ready' : ''}">
                
                <!-- Circular Progress with Amount -->
                <div class="flex flex-col items-center mb-5">
                    <div class="relative w-32 h-32 mb-3">
                        <!-- Background circle -->
                        <svg class="w-full h-full progress-ring" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" stroke-width="6"/>
                            <circle cx="50" cy="50" r="45" fill="none" 
                                stroke="${hasBooster ? '#4ade80' : '#f59e0b'}" 
                                stroke-width="6"
                                stroke-linecap="round"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${strokeDashoffset}"
                                class="progress-ring-circle"/>
                        </svg>
                        <!-- Center content -->
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span class="text-2xl font-black text-white">${netRewardNum.toFixed(2)}</span>
                            <span class="text-xs text-amber-400 font-bold">BKC</span>
                        </div>
                    </div>
                    
                    <p class="text-xs text-zinc-500">
                        You keep <span class="text-${hasBooster ? 'green' : 'amber'}-400 font-bold">${keepPercent.toFixed(1)}%</span> of earnings
                    </p>
                </div>

                <!-- Claim Button -->
                <button id="claim-btn" 
                    class="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${hasRewards
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/25 active:scale-[0.98]'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }" ${!hasRewards ? 'disabled' : ''}>
                    <i id="claim-btn-icon" class="fa-solid ${hasRewards ? 'fa-coins' : 'fa-clock'}"></i>
                    <span id="claim-btn-text">${hasRewards ? `Claim ${netRewardNum.toFixed(2)} BKC` : 'No Rewards Yet'}</span>
                </button>
                
                ${!hasRewards ? `
                    <p class="text-center text-xs text-zinc-600 mt-3">
                        <i class="fa-solid fa-info-circle mr-1"></i>
                        <a href="#mine" onclick="window.navigateTo('mine')" class="text-amber-500 hover:text-amber-400">Stake BKC</a> to start earning rewards
                    </p>
                ` : ''}
            </div>

            <!-- STATS GRID - 2 columns mobile -->
            <div class="grid grid-cols-2 gap-3">
                <!-- Total Earned -->
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                            <i class="fa-solid fa-chart-line text-purple-400 text-xs"></i>
                        </div>
                        <span class="text-[10px] text-zinc-500 uppercase">Earned</span>
                    </div>
                    <p class="text-lg font-bold text-white font-mono">${totalGrossNum.toFixed(2)}</p>
                    <p class="text-[10px] text-zinc-600">Total BKC</p>
                </div>
                
                <!-- Fee -->
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                            <i class="fa-solid fa-percent text-red-400 text-xs"></i>
                        </div>
                        <span class="text-[10px] text-zinc-500 uppercase">Protocol Fee</span>
                    </div>
                    <p class="text-lg font-bold text-zinc-400 font-mono">${feeAmountNum.toFixed(2)}</p>
                    <p class="text-[10px] text-zinc-600">${(100 - keepPercent).toFixed(1)}% fee</p>
                </div>
            </div>

            <!-- REWARD SOURCES -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p class="text-[10px] text-zinc-500 uppercase mb-3">
                    <i class="fa-solid fa-layer-group mr-1"></i> Reward Sources
                </p>
                <div class="space-y-2">
                    <!-- Staking -->
                    <div class="flex items-center justify-between p-2.5 bg-zinc-800/30 rounded-lg">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-lock text-purple-400 text-xs"></i>
                            </div>
                            <span class="text-sm text-zinc-300">Staking</span>
                        </div>
                        <span class="text-sm font-mono font-bold text-white">${stakingNum.toFixed(2)} <span class="text-zinc-500 text-xs">BKC</span></span>
                    </div>
                    
                    <!-- Mining -->
                    <div class="flex items-center justify-between p-2.5 bg-zinc-800/30 rounded-lg">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-hammer text-orange-400 text-xs"></i>
                            </div>
                            <span class="text-sm text-zinc-300">Mining</span>
                        </div>
                        <span class="text-sm font-mono font-bold text-white">${miningNum.toFixed(2)} <span class="text-zinc-500 text-xs">BKC</span></span>
                    </div>
                </div>
            </div>

            <!-- BOOSTER SECTION -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div class="p-3 border-b border-zinc-800/50 flex items-center justify-between">
                    <p class="text-[10px] text-zinc-500 uppercase">
                        <i class="fa-solid fa-rocket mr-1"></i> Booster Status
                    </p>
                    ${hasBooster ? `
                        <span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full">
                            ACTIVE
                        </span>
                    ` : `
                        <span class="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded-full">
                            NONE
                        </span>
                    `}
                </div>
                
                <div class="p-4">
                    ${hasBooster ? renderActiveBooster(booster, boostPercent, keepPercent) : renderNoBooster(hasRewards, extraGain, potentialKeepPercent)}
                </div>
            </div>

        </div>
    `;

    // Bind events
    bindEvents(gross.stakingRewards, gross.minerRewards, boosterTokenId, hasRewards);
}

// ============================================================================
// BOOSTER COMPONENTS
// ============================================================================

function renderActiveBooster(booster, boostPercent, keepPercent) {
    return `
        <div class="flex items-center gap-3">
            <div class="relative w-14 h-14 bg-black/50 rounded-xl border-2 border-green-500/30 overflow-hidden flex-shrink-0">
                <img src="${booster.imageUrl || './assets/bkc_logo_3d.png'}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='./assets/bkc_logo_3d.png'">
                <div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <i class="fa-solid fa-check text-white text-[8px]"></i>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-white font-bold truncate">${booster.boostName}</p>
                <p class="text-[11px] text-zinc-500">
                    ${booster.source === 'rented' ? '🔗 Rented' : '✓ Owned'}
                </p>
            </div>
            <div class="text-right">
                <p class="text-xl font-bold text-green-400">+${boostPercent}%</p>
                <p class="text-[10px] text-zinc-500">Fee Discount</p>
            </div>
        </div>
        
        <div class="mt-3 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div class="flex items-center justify-between text-xs">
                <span class="text-green-400">
                    <i class="fa-solid fa-shield-check mr-1"></i>
                    You keep ${keepPercent.toFixed(1)}% of rewards
                </span>
                <span class="text-green-400 font-bold">Active</span>
            </div>
        </div>
    `;
}

function renderNoBooster(hasRewards, extraGain, potentialKeepPercent) {
    const extraGainNum = formatBigNumber(extraGain);
    
    return `
        <div class="text-center">
            ${hasRewards && extraGain > 0n ? `
                <!-- Potential Gain Alert -->
                <div class="mb-4 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
                    <p class="text-xs text-amber-400 font-bold mb-1">
                        <i class="fa-solid fa-bolt mr-1"></i> You're Missing Out!
                    </p>
                    <p class="text-lg font-bold text-white">+${extraGainNum.toFixed(2)} BKC</p>
                    <p class="text-[10px] text-zinc-400">Extra with a Diamond Booster</p>
                </div>
            ` : ''}
            
            <p class="text-sm text-zinc-400 mb-3">
                Get a Booster to keep up to <span class="text-green-400 font-bold">${potentialKeepPercent.toFixed(0)}%</span> of your rewards
            </p>
            
            <!-- Tier Preview -->
            <div class="flex justify-center gap-1.5 mb-4">
                ${BOOSTER_TIERS.map(tier => `
                    <div class="booster-tier w-9 h-9 rounded-lg border border-zinc-700 flex items-center justify-center cursor-pointer hover:border-amber-500/50" 
                         style="background: ${tier.color}15"
                         title="${tier.name}: ${tier.discount}% discount">
                        <span class="text-[10px] font-bold" style="color: ${tier.color}">${tier.discount}%</span>
                    </div>
                `).join('')}
            </div>
            
            <!-- CTA Buttons -->
            <div class="flex gap-2">
                <button onclick="window.navigateTo('store')" 
                    class="flex-1 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-lg transition-all active:scale-[0.98]">
                    <i class="fa-solid fa-gem mr-1"></i> Buy
                </button>
                <button onclick="window.navigateTo('rental')" 
                    class="flex-1 py-2.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all active:scale-[0.98]">
                    <i class="fa-solid fa-handshake mr-1"></i> Rent
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// EVENT BINDINGS
// ============================================================================

function bindEvents(stakingRewards, minerRewards, boosterTokenId, hasRewards) {
    // Claim button
    const claimBtn = document.getElementById('claim-btn');
    if (claimBtn && hasRewards) {
        claimBtn.onclick = () => handleClaim(stakingRewards, minerRewards, boosterTokenId);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('rewards-refresh');
    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            refreshBtn.classList.add('animate-spin');
            await RewardsPage.update(true);
            setTimeout(() => refreshBtn.classList.remove('animate-spin'), 500);
        };
    }
}

// ============================================================================
// CLAIM HANDLER
// ============================================================================

async function handleClaim(stakingRewards, minerRewards, boosterTokenId) {
    if (isProcessing) return;

    const btn = document.getElementById('claim-btn');
    const btnText = document.getElementById('claim-btn-text');
    const btnIcon = document.getElementById('claim-btn-icon');

    if (!btn) return;

    isProcessing = true;
    
    // Update button state
    btn.disabled = true;
    btn.classList.remove('bg-gradient-to-r', 'from-amber-500', 'to-orange-500', 'shadow-lg', 'shadow-amber-500/25');
    btn.classList.add('bg-zinc-700');
    btnText.textContent = 'Processing...';
    btnIcon.className = 'fa-solid fa-spinner fa-spin';

    try {
        const success = await executeUniversalClaim(stakingRewards, minerRewards, boosterTokenId, null);

        if (success) {
            // Success animation
            btn.classList.add('claim-success', 'bg-green-500');
            btn.classList.remove('bg-zinc-700');
            btnText.textContent = '✓ Claimed!';
            btnIcon.className = 'fa-solid fa-check';
            
            showToast('🎉 Rewards claimed successfully!', 'success');
            
            // Wait then refresh
            setTimeout(async () => {
                lastFetch = 0;
                await RewardsPage.update(true);
            }, 1500);
        }
    } catch (e) {
        console.error('Claim error:', e);
        showToast('Claim failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
        
        // Reset button
        resetClaimButton();
    } finally {
        isProcessing = false;
    }
}

function resetClaimButton() {
    const btn = document.getElementById('claim-btn');
    const btnText = document.getElementById('claim-btn-text');
    const btnIcon = document.getElementById('claim-btn-icon');
    
    if (btn && btnText && btnIcon) {
        btn.disabled = false;
        btn.classList.remove('bg-zinc-700', 'bg-green-500', 'claim-success');
        btn.classList.add('bg-gradient-to-r', 'from-amber-500', 'to-orange-500', 'shadow-lg', 'shadow-amber-500/25');
        btnText.textContent = 'Claim Rewards';
        btnIcon.className = 'fa-solid fa-coins';
    }
}

// ============================================================================
// GLOBAL REFERENCE
// ============================================================================
window.RewardsPage = RewardsPage;