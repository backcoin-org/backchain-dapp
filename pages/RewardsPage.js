// pages/RewardsPage.js
// ✅ PRODUCTION V14.4 - Clean Design + API History Fix
//
// V14.4 Changes:
// - Fixed claim history to use getHistory API (same as Dashboard)
// - Filters activities by type === 'ClaimReward'
//
// V14.2: Cleaner, minimal UI design
// V14.0: Complete UI redesign focusing on booster BENEFITS
// V13.0: NFT Discount Simulator
// V12.0: Fixed claimRewards signature
// V11.0: Migrated to StakingTx

const ethers = window.ethers;

import { State } from '../state.js';
import {
    calculateUserTotalRewards,
    calculateClaimDetails,
    getHighestBoosterBoostFromAPI,
    loadUserData,
    API_ENDPOINTS
} from '../modules/data.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers } from '../config.js';
import { StakingTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = 'https://sepolia.arbiscan.io/tx/';

// Boost tiers for simulation
const BOOST_TIERS = [
    { name: 'No Booster', boost: 0, icon: 'fa-circle-xmark', color: 'text-zinc-500', bg: 'bg-zinc-800' },
    { name: 'Crystal', boost: 1000, icon: 'fa-gem', color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    { name: 'Iron', boost: 2000, icon: 'fa-shield-halved', color: 'text-slate-300', bg: 'bg-slate-500/20' },
    { name: 'Bronze', boost: 3000, icon: 'fa-medal', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { name: 'Silver', boost: 4000, icon: 'fa-star', color: 'text-gray-300', bg: 'bg-gray-400/20' },
    { name: 'Gold', boost: 5000, icon: 'fa-crown', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { name: 'Platinum', boost: 6000, icon: 'fa-trophy', color: 'text-purple-300', bg: 'bg-purple-400/20' },
    { name: 'Diamond', boost: 7000, icon: 'fa-diamond', color: 'text-cyan-400', bg: 'bg-cyan-500/20' }
];

// ============================================================================
// LOCAL STATE
// ============================================================================
let lastFetch = 0;
let isLoading = false;
let isProcessing = false;
let claimHistory = [];
let _claimParams = { boosterTokenId: 0n };

// V14.1 FIX: Cache and debounce to prevent re-render loops
let _cachedData = null;
let _cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds cache
let _updateDebounceTimer = null;
let _renderCount = 0;
const MAX_RENDERS_PER_SECOND = 3;
let _lastRenderReset = Date.now();

// V14.1 FIX: Rate limiter for renders
function shouldThrottleRender() {
    const now = Date.now();
    if (now - _lastRenderReset > 1000) {
        _renderCount = 0;
        _lastRenderReset = now;
    }
    _renderCount++;
    return _renderCount > MAX_RENDERS_PER_SECOND;
}

window.handleRewardsClaim = async function() {
    if (isProcessing) return;
    await handleClaim(_claimParams.boosterTokenId);
};

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('reward-styles-v14')) return;
    
    const style = document.createElement('style');
    style.id = 'reward-styles-v14';
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }
        .float-animation { animation: float 3s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 2px; }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN EXPORT
// ============================================================================
export const RewardsPage = {
    async render(isNewPage) {
        injectStyles();
        const container = document.getElementById('rewards');
        if (!container) return;

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = getPageHTML();
        }

        if (State.isConnected) {
            // V14.1 FIX: Use cached data for immediate render if available
            if (_cachedData && (Date.now() - _cacheTimestamp < CACHE_DURATION)) {
                renderContent(_cachedData.claimDetails, _cachedData.grossRewards, _cachedData.boosterData);
            } else {
                renderLoading();
            }
            this.update(isNewPage);
        } else {
            renderNotConnected();
        }
    },

    async update(force = false) {
        if (!State.isConnected) {
            renderNotConnected();
            return;
        }

        // V14.1 FIX: Throttle renders to prevent loops
        if (shouldThrottleRender()) {
            console.warn('[Rewards] Render throttled - too many updates');
            return;
        }

        const now = Date.now();
        
        // V14.1 FIX: Debounce rapid update calls
        if (_updateDebounceTimer) {
            clearTimeout(_updateDebounceTimer);
        }
        
        // V14.1 FIX: Use cache if available and not forcing refresh
        if (!force && _cachedData && (now - _cacheTimestamp < CACHE_DURATION)) {
            renderContent(_cachedData.claimDetails, _cachedData.grossRewards, _cachedData.boosterData);
            return;
        }

        if (!force && isLoading) return;
        if (!force && (now - lastFetch < 60000)) {
            // Use cached data if we fetched recently
            if (_cachedData) {
                renderContent(_cachedData.claimDetails, _cachedData.grossRewards, _cachedData.boosterData);
            }
            return;
        }

        isLoading = true;

        try {
            let boosterData = { highestBoost: 0, boostName: 'None', tokenId: null, source: 'none', imageUrl: null };
            let claimDetails = { netClaimAmount: 0n, feeAmount: 0n, totalRewards: 0n, baseFeeBips: 100, finalFeeBips: 100 };
            let grossRewards = { stakingRewards: 0n, minerRewards: 0n };

            try { await loadUserData(); } catch (e) {}
            try { boosterData = await getHighestBoosterBoostFromAPI() || boosterData; } catch (e) {}
            try { claimDetails = await calculateClaimDetails() || claimDetails; } catch (e) {}
            try { grossRewards = await calculateUserTotalRewards() || grossRewards; } catch (e) {}
            try { await loadClaimHistory(); } catch (e) {}

            // V14.1 FIX: Cache the fetched data
            _cachedData = { claimDetails, grossRewards, boosterData };
            _cacheTimestamp = now;

            renderContent(claimDetails, grossRewards, boosterData);
            lastFetch = now;

        } catch (e) {
            console.error("Rewards Error:", e);
        } finally {
            isLoading = false;
        }
    },
    
    // V14.1 FIX: Method to clear cache when needed (e.g., after claim)
    clearCache() {
        _cachedData = null;
        _cacheTimestamp = 0;
        lastFetch = 0;
    }
};

// ============================================================================
// PAGE HTML
// ============================================================================
function getPageHTML() {
    return `
        <div class="max-w-lg mx-auto px-4 py-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <i class="fa-solid fa-gift text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-white">Rewards</h1>
                        <p class="text-[10px] text-zinc-500">Claim your earnings</p>
                    </div>
                </div>
                <button id="rewards-refresh" onclick="window.RewardsPage.update(true)" class="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                    <i class="fa-solid fa-rotate text-xs"></i>
                </button>
            </div>
            <div id="rewards-content"></div>
        </div>
    `;
}

function renderNotConnected() {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-2xl text-zinc-600"></i>
            </div>
            <p class="text-zinc-400 font-medium mb-1">Wallet not connected</p>
            <p class="text-zinc-600 text-sm mb-4">Connect to view your rewards</p>
            <button onclick="window.openConnectModal()" 
                class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm rounded-xl">
                <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
            </button>
        </div>
    `;
}

function renderLoading() {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16">
            <div class="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-4"></div>
            <p class="text-zinc-500 text-sm">Loading rewards...</p>
        </div>
    `;
}

// ============================================================================
// MAIN CONTENT - V14 REDESIGN
// ============================================================================
function renderContent(claimDetails, grossRewards, boosterData) {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    const details = claimDetails || {};
    const gross = grossRewards || {};
    const booster = boosterData || {};

    // Get values
    const netReward = details.netClaimAmount || 0n;
    const totalGross = details.totalRewards || 0n;
    const feeAmount = details.feeAmount || 0n;
    const stakingRewards = gross.stakingRewards || 0n;
    const minerRewards = gross.minerRewards || 0n;
    const grossFromSources = stakingRewards + minerRewards;
    const actualGross = totalGross > 0n ? totalGross : grossFromSources;
    
    const highestBoost = booster.highestBoost || 0;
    const boostPercent = highestBoost / 100;
    const baseFeeBips = details.baseFeeBips || 100;

    // Convert to numbers
    let grossNum = 0, netNum = 0, feeNum = 0, stakingNum = 0, miningNum = 0;
    try {
        grossNum = formatBigNumber ? formatBigNumber(actualGross) : Number(actualGross) / 1e18;
        netNum = formatBigNumber ? formatBigNumber(netReward) : Number(netReward) / 1e18;
        feeNum = formatBigNumber ? formatBigNumber(feeAmount) : Number(feeAmount) / 1e18;
        stakingNum = formatBigNumber ? formatBigNumber(stakingRewards) : Number(stakingRewards) / 1e18;
        miningNum = formatBigNumber ? formatBigNumber(minerRewards) : Number(minerRewards) / 1e18;
        if (netNum === 0 && grossNum > 0) netNum = grossNum - feeNum;
    } catch (e) {}

    // Calculate booster bonus (what user gains by having booster)
    // Without booster: user would pay full base fee
    // With booster: user pays reduced fee
    // Bonus = what they saved
    const feeWithoutBooster = grossNum * (baseFeeBips / 10000);
    const boosterBonus = feeWithoutBooster - feeNum;
    const netWithoutBooster = grossNum - feeWithoutBooster;

    const hasRewards = actualGross > 0n;
    const hasBooster = highestBoost > 0;
    
    _claimParams = { boosterTokenId: BigInt(booster.tokenId || 0) };

    // Find current tier info
    const currentTier = BOOST_TIERS.find(t => t.boost === highestBoost) || BOOST_TIERS[0];
    
    // V14.2: Get NFT image URL with fallback
    const nftImageUrl = booster.imageUrl || booster.image || null;

    container.innerHTML = `
        <div class="space-y-4">
            
            <!-- MAIN CLAIM CARD - Clean Design -->
            <div class="bg-gradient-to-b from-zinc-900 to-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
                
                <!-- Hero Section with Image -->
                <div class="relative pt-6 pb-4 px-6">
                    <!-- Subtle glow background -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                        <div class="w-48 h-48 bg-amber-500/5 rounded-full blur-3xl"></div>
                    </div>
                    
                    <!-- Reward Image - Clean & Simple -->
                    <div class="relative flex justify-center mb-4">
                        <img 
                            src="assets/reward.png" 
                            alt="Rewards" 
                            class="w-20 h-20 object-contain float-animation"
                            onerror="this.parentElement.innerHTML='<div class=\\'w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center\\'><i class=\\'fa-solid fa-gift text-white text-2xl\\'></i></div>'"
                        />
                    </div>
                    
                    <!-- Amount Display -->
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Available to Claim</p>
                        <div class="flex items-baseline justify-center gap-2">
                            <span class="text-4xl font-black ${hasRewards ? (hasBooster ? 'text-green-400' : 'text-white') : 'text-zinc-600'}">${netNum.toFixed(4)}</span>
                            <span class="text-base font-bold text-amber-500">BKC</span>
                        </div>
                        
                        ${hasBooster ? `
                            <div class="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                                <i class="fa-solid fa-bolt text-green-400 text-[10px]"></i>
                                <span class="text-[11px] text-green-400 font-medium">${currentTier.name} +${boostPercent}%</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Claim Button -->
                <div class="px-4 pb-4">
                    <button id="claim-btn" onclick="${hasRewards ? 'window.handleRewardsClaim()' : ''}" 
                        class="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${hasRewards ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}" 
                        ${!hasRewards ? 'disabled' : ''}>
                        <i id="claim-btn-icon" class="fa-solid ${hasRewards ? 'fa-arrow-right' : 'fa-clock'}"></i>
                        <span id="claim-btn-text">${hasRewards ? 'Claim Rewards' : 'No Rewards Yet'}</span>
                    </button>
                </div>
            </div>

            ${hasRewards ? `
            <!-- BREAKDOWN - Minimal -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-zinc-500">Earned</span>
                    <span class="font-mono text-white">${grossNum.toFixed(4)} BKC</span>
                </div>
                ${hasBooster ? `
                <div class="flex items-center justify-between text-sm mt-2">
                    <span class="text-green-400 flex items-center gap-1.5">
                        <i class="fa-solid ${currentTier.icon} text-[10px]"></i>
                        Booster Bonus
                    </span>
                    <span class="font-mono text-green-400">+${boosterBonus.toFixed(4)} BKC</span>
                </div>
                ` : ''}
                <div class="border-t border-zinc-800 mt-3 pt-3 flex items-center justify-between">
                    <span class="text-white font-medium">You Receive</span>
                    <span class="font-mono font-bold ${hasBooster ? 'text-green-400' : 'text-amber-400'}">${netNum.toFixed(4)} BKC</span>
                </div>
            </div>
            ` : `
            <!-- Empty State -->
            <div class="text-center py-2">
                <p class="text-zinc-600 text-sm">
                    <a href="#mine" onclick="window.navigateTo('mine')" class="text-amber-500 hover:text-amber-400">Stake BKC</a> to start earning rewards
                </p>
            </div>
            `}

            <!-- BOOSTER STATUS - Compact -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        ${hasBooster ? `
                            <!-- NFT Image or Icon -->
                            <div class="w-12 h-12 rounded-xl overflow-hidden ${currentTier.bg} border border-zinc-700 flex items-center justify-center">
                                ${nftImageUrl ? `
                                    <img src="${nftImageUrl}" alt="${currentTier.name}" class="w-full h-full object-cover" 
                                         onerror="this.parentElement.innerHTML='<i class=\\'fa-solid ${currentTier.icon} ${currentTier.color} text-lg\\'></i>'" />
                                ` : `
                                    <i class="fa-solid ${currentTier.icon} ${currentTier.color} text-lg"></i>
                                `}
                            </div>
                            <div>
                                <p class="text-white font-semibold">${currentTier.name} Booster</p>
                                <p class="text-xs text-zinc-500">${booster.source === 'rented' ? 'Rented' : 'Owned'} • +${boostPercent}% bonus</p>
                            </div>
                        ` : `
                            <div class="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                <i class="fa-solid fa-rocket text-zinc-600 text-lg"></i>
                            </div>
                            <div>
                                <p class="text-zinc-400 font-medium">No Booster</p>
                                <p class="text-xs text-zinc-600">Get up to +70% bonus</p>
                            </div>
                        `}
                    </div>
                    
                    ${!hasBooster ? `
                        <button onclick="window.navigateTo('store')" class="px-4 py-2 text-xs font-bold bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors">
                            Get One
                        </button>
                    ` : `
                        <div class="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <span class="text-[10px] text-green-400 font-bold">ACTIVE</span>
                        </div>
                    `}
                </div>
            </div>

            <!-- CLAIM HISTORY - Collapsible style -->
            <details class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden group">
                <summary class="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors">
                    <span class="text-sm text-zinc-400 flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-xs"></i>
                        Claim History
                    </span>
                    <i class="fa-solid fa-chevron-down text-zinc-600 text-xs transition-transform group-open:rotate-180"></i>
                </summary>
                <div class="px-4 pb-4 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    ${renderClaimHistory()}
                </div>
            </details>
        </div>
    `;
}

// ============================================================================
// CLAIM HISTORY
// ============================================================================
async function loadClaimHistory() {
    if (!State.userAddress) return;
    
    try {
        // V14.4: Usar o mesmo endpoint que o Dashboard usa
        // API_ENDPOINTS.getHistory retorna todas as atividades do usuário
        const historyUrl = API_ENDPOINTS?.getHistory || 'https://gethistory-4wvdcuoouq-uc.a.run.app';
        const response = await fetch(`${historyUrl}/${State.userAddress}`);
        
        if (!response.ok) {
            console.warn('[Rewards] Failed to fetch history:', response.status);
            return;
        }
        
        const activities = await response.json();
        
        // Filtrar apenas os ClaimReward
        claimHistory = activities
            .filter(item => item.type === 'ClaimReward')
            .slice(0, 10)
            .map(item => ({
                id: item.id || item.txHash,
                amount: item.amount || item.details?.amount || '0',
                timestamp: item.timestamp?._seconds 
                    ? new Date(item.timestamp._seconds * 1000) 
                    : (item.timestamp ? new Date(item.timestamp) : new Date()),
                transactionHash: item.txHash || '',
                feePaid: item.details?.feePaid || '0'
            }));
        
        console.log(`[Rewards] Loaded ${claimHistory.length} claim history items`);
        
    } catch (e) {
        console.warn('[Rewards] Failed to load claim history:', e.message);
        claimHistory = [];
    }
}

function renderClaimHistory() {
    if (claimHistory.length === 0) {
        return `
            <div class="text-center py-6">
                <i class="fa-solid fa-inbox text-zinc-700 text-2xl mb-2"></i>
                <p class="text-zinc-600 text-xs">No claims yet</p>
            </div>
        `;
    }

    return claimHistory.map(tx => {
        const amount = tx.amount ? (Number(tx.amount) / 1e18).toFixed(4) : '0';
        const date = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'Recent';
        const timeAgo = tx.timestamp ? getTimeAgo(new Date(tx.timestamp)) : '';
        const hash = tx.transactionHash || tx.hash || '';
        
        return `
            <a href="${EXPLORER_TX}${hash}" target="_blank" 
               class="history-item flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/30 transition-all cursor-pointer">
                <div class="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-gift text-green-400 text-xs"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-white font-medium">Claimed</p>
                    <p class="text-[10px] text-zinc-500">${timeAgo || date}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-sm font-mono font-bold text-green-400">+${amount}</p>
                    <p class="text-[10px] text-zinc-500">BKC</p>
                </div>
                <i class="fa-solid fa-external-link text-zinc-600 text-[10px] flex-shrink-0"></i>
            </a>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// ============================================================================
// CLAIM HANDLER
// ============================================================================
async function handleClaim(boosterTokenId) {
    if (isProcessing) return;
    const btn = document.getElementById('claim-btn');
    const btnText = document.getElementById('claim-btn-text');
    const btnIcon = document.getElementById('claim-btn-icon');
    if (!btn) return;

    isProcessing = true;
    btn.disabled = true;
    btn.className = 'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-zinc-700 text-zinc-400';
    btnText.textContent = 'Processing...';
    btnIcon.className = 'fa-solid fa-spinner fa-spin';

    try {
        await StakingTx.claimRewards({
            boosterTokenId: Number(boosterTokenId) || 0,
            button: btn,
            
            onSuccess: (receipt) => {
                btn.className = 'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-green-500 text-white';
                btnText.textContent = '🎉 Claimed!';
                btnIcon.className = 'fa-solid fa-check';
                showToast('🎁 Rewards claimed successfully!', 'success');
                
                setTimeout(() => { 
                    // V14.1 FIX: Use clearCache method
                    RewardsPage.clearCache();
                    claimHistory = [];
                    RewardsPage.update(true); 
                }, 2500);
            },
            
            onError: (error) => {
                if (error && !error.cancelled && error.type !== 'user_rejected') {
                    showToast(error.message || 'Claim failed', 'error');
                }
                resetClaimButton(btn, btnText, btnIcon);
            }
        });

    } catch (e) {
        console.error('Claim error:', e);
        showToast(e.message || 'Claim failed', 'error');
        resetClaimButton(btn, btnText, btnIcon);
    } finally {
        isProcessing = false;
    }
}

function resetClaimButton(btn, btnText, btnIcon) {
    if (!btn) return;
    btn.disabled = false;
    btn.className = 'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25 pulse-glow';
    if (btnText) btnText.textContent = 'Claim Rewards';
    if (btnIcon) btnIcon.className = 'fa-solid fa-coins';
}

window.RewardsPage = RewardsPage;