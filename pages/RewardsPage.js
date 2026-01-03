// pages/RewardsPage.js
// ✅ PRODUCTION V14.0 - Complete Redesign with Booster Benefits Focus
//
// V14.0 Changes:
// - Complete UI redesign focusing on booster BENEFITS (not fees)
// - Shows: Mined → Booster Bonus → You Receive
// - Compares what user would get WITHOUT booster vs WITH booster
// - Clean, incentive-focused presentation
// - Removed fee-centric language
//
// V13.0: NFT Discount Simulator
// V12.0: Fixed claimRewards signature
// V11.0: Migrated to StakingTx
// V10.0: Animated Reward Image

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
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.3); }
            50% { box-shadow: 0 0 40px rgba(245,158,11,0.6); }
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        @keyframes shine {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        @keyframes reward-bounce {
            0%, 100% { transform: scale(1) translateY(0); }
            25% { transform: scale(1.05) translateY(-5px); }
            50% { transform: scale(1) translateY(0); }
            75% { transform: scale(1.02) translateY(-3px); }
        }
        @keyframes glow-ring {
            0%, 100% { 
                box-shadow: 0 0 20px rgba(245,158,11,0.4), 
                            0 0 40px rgba(245,158,11,0.2),
                            inset 0 0 20px rgba(245,158,11,0.1);
            }
            50% { 
                box-shadow: 0 0 30px rgba(245,158,11,0.6), 
                            0 0 60px rgba(245,158,11,0.3),
                            inset 0 0 30px rgba(245,158,11,0.2);
            }
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes nft-float {
            0%, 100% { 
                transform: translateY(0) rotate(-2deg); 
                filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
            }
            50% { 
                transform: translateY(-10px) rotate(2deg); 
                filter: drop-shadow(0 20px 30px rgba(0,0,0,0.4));
            }
        }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .float-animation { animation: float 3s ease-in-out infinite; }
        .reward-bounce { animation: reward-bounce 2s ease-in-out infinite; }
        .glow-ring { animation: glow-ring 2s ease-in-out infinite; }
        .spin-slow { animation: spin-slow 20s linear infinite; }
        .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .nft-float { animation: nft-float 4s ease-in-out infinite; }
        .shine-text {
            background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shine 3s linear infinite;
        }
        .history-item:hover {
            background: rgba(63,63,70,0.5) !important;
            transform: translateX(4px);
        }
        .tier-card:hover {
            transform: scale(1.02);
            border-color: rgba(245,158,11,0.5);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 2px; }
        .reward-image-container {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .reward-image-container::before {
            content: '';
            position: absolute;
            width: 120%;
            height: 120%;
            background: radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%);
            border-radius: 50%;
            animation: pulse-glow 3s ease-in-out infinite;
        }
        .nft-image-wrapper {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
        }
        .nft-image-wrapper::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: shine 3s infinite;
        }
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
    
    // V14.1: Get NFT image URL with fallback
    const nftImageUrl = booster.imageUrl || booster.image || null;

    container.innerHTML = `
        <div class="space-y-4">
            
            <!-- ANIMATED REWARD IMAGE -->
            <div class="reward-image-container py-4 fade-in-up">
                <img 
                    src="assets/reward.png" 
                    alt="Rewards" 
                    class="w-32 h-32 object-contain reward-bounce drop-shadow-2xl"
                    onerror="this.style.display='none'"
                />
            </div>
            
            <!-- MAIN CLAIM CARD -->
            <div class="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl overflow-hidden fade-in-up" style="animation-delay: 0.1s">
                
                <!-- Header with amount -->
                <div class="p-6 text-center border-b border-zinc-800/50">
                    <p class="text-xs text-zinc-500 uppercase tracking-wider mb-2">Available to Claim</p>
                    <div class="flex items-center justify-center gap-2">
                        <span class="text-4xl font-black ${hasBooster ? 'text-green-400' : 'text-white'}">${netNum.toFixed(4)}</span>
                        <span class="text-lg font-bold text-amber-400">BKC</span>
                    </div>
                    ${hasBooster ? `
                        <div class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                            <i class="fa-solid fa-bolt text-green-400 text-xs"></i>
                            <span class="text-xs text-green-400 font-medium">${currentTier.name} Booster Active</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Breakdown -->
                ${hasRewards ? `
                <div class="p-4 bg-black/20">
                    <div class="space-y-3">
                        
                        <!-- Mined Rewards -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <i class="fa-solid fa-hammer text-purple-400 text-sm"></i>
                                </div>
                                <span class="text-sm text-zinc-400">Mined Rewards</span>
                            </div>
                            <span class="text-sm font-mono text-white">${grossNum.toFixed(4)} BKC</span>
                        </div>

                        <!-- Booster Bonus (if has booster) -->
                        ${hasBooster && boosterBonus > 0 ? `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-lg ${currentTier.bg} flex items-center justify-center">
                                    <i class="fa-solid ${currentTier.icon} ${currentTier.color} text-sm"></i>
                                </div>
                                <div>
                                    <span class="text-sm text-green-400">${currentTier.name} Bonus</span>
                                    <span class="text-[10px] text-zinc-500 ml-1">(+${boostPercent}%)</span>
                                </div>
                            </div>
                            <span class="text-sm font-mono text-green-400">+${boosterBonus.toFixed(4)} BKC</span>
                        </div>
                        ` : ''}

                        <!-- Divider -->
                        <div class="border-t border-zinc-700/50 my-1"></div>

                        <!-- You Receive -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <i class="fa-solid fa-coins text-amber-400 text-sm"></i>
                                </div>
                                <span class="text-sm font-bold text-white">You Receive</span>
                            </div>
                            <span class="text-lg font-mono font-bold ${hasBooster ? 'text-green-400' : 'text-amber-400'}">${netNum.toFixed(4)} BKC</span>
                        </div>

                        ${!hasBooster ? `
                        <!-- No booster warning -->
                        <div class="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p class="text-xs text-amber-400 text-center">
                                <i class="fa-solid fa-lightbulb mr-1"></i>
                                Get a Booster NFT to earn <span class="font-bold">up to 70% more</span> on claims!
                            </p>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Claim Button -->
                <div class="p-4">
                    <button id="claim-btn" onclick="${hasRewards ? 'window.handleRewardsClaim()' : ''}" 
                        class="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${hasRewards ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] cursor-pointer pulse-glow' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}" 
                        ${!hasRewards ? 'disabled' : ''}>
                        <i id="claim-btn-icon" class="fa-solid ${hasRewards ? 'fa-coins' : 'fa-clock'}"></i>
                        <span id="claim-btn-text">${hasRewards ? 'Claim ' + netNum.toFixed(4) + ' BKC' : 'No Rewards Yet'}</span>
                    </button>
                    
                    ${!hasRewards ? `
                    <p class="text-center text-xs text-zinc-600 mt-3">
                        <i class="fa-solid fa-info-circle mr-1"></i>
                        <a href="#mine" onclick="window.navigateTo('mine')" class="text-amber-500 hover:text-amber-400">Stake BKC</a> to start earning
                    </p>
                    ` : ''}
                </div>
            </div>

            <!-- REWARD SOURCES -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 fade-in-up" style="animation-delay: 0.2s">
                <p class="text-[10px] text-zinc-500 uppercase mb-3">
                    <i class="fa-solid fa-layer-group mr-1"></i> Reward Sources
                </p>
                <div class="grid grid-cols-2 gap-3">
                    <div class="p-3 rounded-lg bg-zinc-800/30 text-center">
                        <div class="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center mx-auto mb-2">
                            <i class="fa-solid fa-lock text-purple-400 text-sm"></i>
                        </div>
                        <p class="text-lg font-bold font-mono text-white">${stakingNum.toFixed(2)}</p>
                        <p class="text-[10px] text-zinc-500">Staking</p>
                    </div>
                    <div class="p-3 rounded-lg bg-zinc-800/30 text-center">
                        <div class="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center mx-auto mb-2">
                            <i class="fa-solid fa-hammer text-orange-400 text-sm"></i>
                        </div>
                        <p class="text-lg font-bold font-mono text-white">${miningNum.toFixed(2)}</p>
                        <p class="text-[10px] text-zinc-500">Mining</p>
                    </div>
                </div>
            </div>

            <!-- BOOSTER CARD -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden fade-in-up" style="animation-delay: 0.3s">
                <div class="p-3 border-b border-zinc-800/50 flex items-center justify-between">
                    <p class="text-[10px] text-zinc-500 uppercase">
                        <i class="fa-solid fa-rocket mr-1"></i> Your Booster
                    </p>
                    ${hasBooster ? 
                        `<span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full">ACTIVE</span>` : 
                        `<span class="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded-full">NONE</span>`
                    }
                </div>
                <div class="p-4">
                    ${hasBooster ? `
                        <div class="flex items-center gap-4">
                            <!-- NFT Image with fallback to icon -->
                            <div class="nft-image-wrapper w-20 h-20 rounded-xl ${currentTier.bg} border-2 border-green-500/30 flex items-center justify-center overflow-hidden nft-float">
                                ${nftImageUrl ? `
                                    <img 
                                        src="${nftImageUrl}" 
                                        alt="${currentTier.name} Booster" 
                                        class="w-full h-full object-cover"
                                        onerror="this.parentElement.innerHTML='<i class=\\'fa-solid ${currentTier.icon} ${currentTier.color} text-2xl\\'></i>'"
                                    />
                                ` : `
                                    <i class="fa-solid ${currentTier.icon} ${currentTier.color} text-2xl"></i>
                                `}
                            </div>
                            <div class="flex-1">
                                <p class="text-white font-bold text-lg">${currentTier.name}</p>
                                <p class="text-xs text-zinc-500">${booster.source === 'rented' ? '🔗 Rented' : '✓ Owned'}</p>
                                ${booster.tokenId ? `<p class="text-[10px] text-zinc-600">ID: #${booster.tokenId}</p>` : ''}
                            </div>
                            <div class="text-right">
                                <p class="text-2xl font-black text-green-400">+${boostPercent}%</p>
                                <p class="text-[10px] text-zinc-500">Bonus</p>
                            </div>
                        </div>
                        ${boosterBonus > 0 ? `
                        <div class="mt-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                            <p class="text-xs text-green-400">
                                <i class="fa-solid fa-piggy-bank mr-1"></i>
                                This claim: earning <span class="font-bold">+${boosterBonus.toFixed(4)} BKC</span> extra!
                            </p>
                        </div>
                        ` : ''}
                    ` : `
                        <div class="text-center py-2">
                            <div class="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                                <i class="fa-solid fa-circle-plus text-zinc-600 text-2xl"></i>
                            </div>
                            <p class="text-zinc-400 text-sm mb-1">No Booster Active</p>
                            <p class="text-zinc-600 text-xs mb-4">Get a Booster NFT to earn up to <span class="text-green-400 font-bold">70% more</span></p>
                            <div class="flex gap-2">
                                <button onclick="window.navigateTo('store')" class="flex-1 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg hover:shadow-lg hover:shadow-amber-500/20 transition-all">
                                    <i class="fa-solid fa-gem mr-1"></i> Buy NFT
                                </button>
                                <button onclick="window.navigateTo('rental')" class="flex-1 py-2.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all">
                                    <i class="fa-solid fa-clock mr-1"></i> Rent
                                </button>
                            </div>
                        </div>
                    `}
                </div>
            </div>

            <!-- BOOST SIMULATOR -->
            ${renderBoostSimulator(grossNum, baseFeeBips, highestBoost, hasRewards)}

            <!-- CLAIM HISTORY -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div class="p-3 border-b border-zinc-800/50 flex items-center justify-between">
                    <p class="text-[10px] text-zinc-500 uppercase">
                        <i class="fa-solid fa-clock-rotate-left mr-1"></i> Claim History
                    </p>
                    <span class="text-[10px] text-zinc-600">${claimHistory.length} claims</span>
                </div>
                <div class="p-3 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                    ${renderClaimHistory()}
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// BOOST SIMULATOR
// ============================================================================
function renderBoostSimulator(grossReward, baseFeeBips, currentBoost, hasRewards) {
    if (!hasRewards || grossReward <= 0) {
        return '';
    }

    // Calculate what user gets with each tier
    const simulations = BOOST_TIERS.map(tier => {
        const discountAmount = (baseFeeBips * tier.boost) / 10000;
        const finalFeeBips = Math.max(0, baseFeeBips - discountAmount);
        const fee = grossReward * (finalFeeBips / 10000);
        const net = grossReward - fee;
        const bonus = grossReward * (discountAmount / 10000);
        
        return {
            ...tier,
            net,
            bonus,
            isCurrentTier: tier.boost === currentBoost,
            isBetterTier: tier.boost > currentBoost
        };
    });

    const currentSim = simulations.find(s => s.isCurrentTier) || simulations[0];
    const bestSim = simulations[simulations.length - 1]; // Diamond
    const potentialExtra = bestSim.net - currentSim.net;

    return `
        <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div class="p-3 border-b border-zinc-800/50 flex items-center justify-between">
                <p class="text-[10px] text-zinc-500 uppercase">
                    <i class="fa-solid fa-chart-line mr-1"></i> Booster Comparison
                </p>
                ${potentialExtra > 0 ? `
                    <span class="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full">
                        +${potentialExtra.toFixed(4)} possible
                    </span>
                ` : ''}
            </div>
            <div class="p-3">
                <div class="space-y-2">
                    ${simulations.map(sim => `
                        <div class="flex items-center gap-2 p-2 rounded-lg transition-all tier-card ${sim.isCurrentTier ? 'bg-green-500/10 border border-green-500/30' : 'bg-zinc-800/30 border border-transparent'}">
                            <div class="w-7 h-7 rounded-lg ${sim.bg} flex items-center justify-center flex-shrink-0">
                                <i class="fa-solid ${sim.icon} ${sim.color} text-xs"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1">
                                    <span class="text-xs font-medium ${sim.color}">${sim.name}</span>
                                    ${sim.isCurrentTier ? '<span class="px-1 py-0.5 bg-green-500/20 text-green-400 text-[8px] font-bold rounded">YOU</span>' : ''}
                                </div>
                            </div>
                            <div class="text-right flex-shrink-0">
                                <span class="text-sm font-mono ${sim.isCurrentTier ? 'text-green-400 font-bold' : 'text-white'}">${sim.net.toFixed(4)}</span>
                                ${sim.isBetterTier && sim.bonus > currentSim.bonus ? `
                                    <span class="text-[10px] text-green-400 ml-1">+${(sim.net - currentSim.net).toFixed(4)}</span>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${currentBoost < 7000 ? `
                    <div class="mt-3 flex gap-2">
                        <button onclick="window.navigateTo('store')" class="flex-1 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg hover:shadow-lg hover:shadow-amber-500/20 transition-all">
                            <i class="fa-solid fa-arrow-up mr-1"></i> Upgrade Booster
                        </button>
                    </div>
                ` : `
                    <div class="mt-3 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
                        <p class="text-xs text-cyan-400">
                            <i class="fa-solid fa-crown mr-1"></i> Maximum boost achieved!
                        </p>
                    </div>
                `}
            </div>
        </div>
    `;
}

// ============================================================================
// CLAIM HISTORY
// ============================================================================
async function loadClaimHistory() {
    if (!State.userAddress) return;
    
    try {
        // V14.1 FIX: Check if endpoint is defined before fetching
        const endpoint = API_ENDPOINTS?.getUserTransactions;
        if (!endpoint) {
            console.warn('[Rewards] getUserTransactions endpoint not defined');
            return;
        }
        
        const response = await fetch(`${endpoint}?address=${State.userAddress}&type=CLAIM`);
        if (response.ok) {
            const data = await response.json();
            claimHistory = (data.transactions || data || []).slice(0, 10);
        }
    } catch (e) {
        console.warn('[Rewards] Failed to load claim history:', e.message);
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