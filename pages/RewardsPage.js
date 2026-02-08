// pages/RewardsPage.js
// ✅ PRODUCTION V6.9 - Complete Redesign with Burn Rate System
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                    Rewards - Claim Your Earnings
// ═══════════════════════════════════════════════════════════════════════════════
//
// V6.9 Changes:
// - COMPLETE UI REDESIGN - Modern, clean, intuitive layout
// - NEW: previewClaim() integration from DelegationManager V6
// - NEW: Visual burn rate indicator with progress bar
// - NEW: NFT tier comparison showing potential savings
// - NEW: Detailed breakdown (Staking vs Miner rewards)
// - NEW: ETH claim fee display
// - Improved animations and micro-interactions
//
// Burn Rate System (V6):
// ┌──────────┬────────────┬───────────┬─────────────┐
// │ Tier     │ Boost Bips │ Burn Rate │ User Gets   │
// ├──────────┼────────────┼───────────┼─────────────┤
// │ No NFT   │ 0          │ 50%       │ 50%         │
// │ Bronze   │ 1000       │ 40%       │ 60%         │
// │ Silver   │ 2500       │ 25%       │ 75%         │
// │ Gold     │ 4000       │ 10%       │ 90%         │
// │ Diamond  │ 5000       │ 0%        │ 100%        │
// └──────────┴────────────┴───────────┴─────────────┘
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

const ethers = window.ethers;

import { State } from '../state.js';
import {
    calculateUserTotalRewards,
    calculateClaimDetails,
    getHighestBoosterBoostFromAPI,
    loadUserData,
    API_ENDPOINTS,
    safeContractCall
} from '../modules/data.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { StakingTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = 'https://sepolia.arbiscan.io/tx/';

// V6.9: Burn Rate Tiers (matching DelegationManager.sol)
const BURN_TIERS = {
    NONE:    { boost: 0,    burnRate: 50, keepRate: 50,  color: '#71717a', name: 'None',    icon: '○',  emoji: '❌', class: 'tier-none' },
    BRONZE:  { boost: 1000, burnRate: 40, keepRate: 60,  color: '#cd7f32', name: 'Bronze',  icon: '🥉', emoji: '🥉', class: 'tier-bronze' },
    SILVER:  { boost: 2500, burnRate: 25, keepRate: 75,  color: '#c0c0c0', name: 'Silver',  icon: '🥈', emoji: '🥈', class: 'tier-silver' },
    GOLD:    { boost: 4000, burnRate: 10, keepRate: 90,  color: '#ffd700', name: 'Gold',    icon: '🥇', emoji: '🥇', class: 'tier-gold' },
    DIAMOND: { boost: 5000, burnRate: 0,  keepRate: 100, color: '#b9f2ff', name: 'Diamond', icon: '💎', emoji: '💎', class: 'tier-diamond' }
};

// ============================================================================
// LOCAL STATE
// ============================================================================
let lastFetch = 0;
let isLoading = false;
let isProcessing = false;
let claimHistory = [];

// V6.9: Contract preview data
let claimPreview = null;
let userNftBoost = 0;
let userBurnRate = 50;
let nftSource = 'none';
let claimEthFee = 0n;

// Cache system
let _cachedData = null;
let _cacheTimestamp = 0;
const CACHE_DURATION = 30000;

// Global claim handler
window.handleRewardsClaim = async function() {
    if (isProcessing) return;
    await handleClaim();
};

// ============================================================================
// HELPERS
// ============================================================================
function getTierFromBoost(boost) {
    if (boost >= 5000) return BURN_TIERS.DIAMOND;
    if (boost >= 4000) return BURN_TIERS.GOLD;
    if (boost >= 2500) return BURN_TIERS.SILVER;
    if (boost >= 1000) return BURN_TIERS.BRONZE;
    return BURN_TIERS.NONE;
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
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('rewards-styles-v6')) return;
    
    const style = document.createElement('style');
    style.id = 'rewards-styles-v6';
    style.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Rewards Page Styles
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0); } 
            50% { transform: translateY(-8px); } 
        }
        @keyframes pulse-glow { 
            0%, 100% { box-shadow: 0 0 30px rgba(34,197,94,0.2); } 
            50% { box-shadow: 0 0 50px rgba(34,197,94,0.4); } 
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        @keyframes celebrate {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .float-animation { animation: float 3s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .celebrate { animation: celebrate 0.6s ease-out; }
        
        .rewards-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.95) 0%, rgba(24,24,27,0.98) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            transition: all 0.3s ease;
        }
        .rewards-card:hover { 
            border-color: rgba(34,197,94,0.3);
        }
        
        /* NFT Tier Badges */
        .tier-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 24px;
            font-weight: 600;
            font-size: 13px;
            border: 1px solid;
            transition: all 0.3s ease;
        }
        .tier-none { background: rgba(113,113,122,0.15); border-color: rgba(113,113,122,0.3); color: #a1a1aa; }
        .tier-bronze { background: rgba(205,127,50,0.15); border-color: rgba(205,127,50,0.4); color: #cd7f32; }
        .tier-silver { background: rgba(192,192,192,0.15); border-color: rgba(192,192,192,0.4); color: #e5e5e5; }
        .tier-gold { background: rgba(255,215,0,0.15); border-color: rgba(255,215,0,0.4); color: #ffd700; }
        .tier-diamond { background: rgba(185,242,255,0.15); border-color: rgba(185,242,255,0.4); color: #b9f2ff; }
        
        /* Burn Rate Bar */
        .burn-bar {
            height: 10px;
            background: rgba(239,68,68,0.2);
            border-radius: 5px;
            overflow: hidden;
            position: relative;
        }
        .burn-bar-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, #ef4444, #f87171);
            border-radius: 5px;
            transition: width 0.5s ease;
        }
        .keep-bar-fill {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, #22c55e, #4ade80);
            border-radius: 5px;
            transition: width 0.5s ease;
        }
        
        /* Claim Button */
        .claim-btn {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            font-weight: 700;
            border: none;
            border-radius: 14px;
            transition: all 0.2s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        .claim-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(34,197,94,0.3);
        }
        .claim-btn:disabled { 
            background: rgba(63,63,70,0.8);
            color: #71717a;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .claim-btn::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s ease;
        }
        .claim-btn:hover:not(:disabled)::after {
            left: 100%;
        }
        
        /* History Items */
        .history-item {
            background: rgba(39,39,42,0.5);
            border: 1px solid rgba(63,63,70,0.3);
            border-radius: 12px;
            transition: all 0.2s ease;
        }
        .history-item:hover { 
            background: rgba(63,63,70,0.5);
            transform: translateX(4px);
            border-color: rgba(34,197,94,0.3);
        }
        
        /* Comparison Card */
        .comparison-card {
            background: linear-gradient(145deg, rgba(34,197,94,0.05) 0%, rgba(22,163,74,0.02) 100%);
            border: 1px dashed rgba(34,197,94,0.3);
            border-radius: 12px;
        }
        
        /* Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,197,94,0.5); }
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
            if (_cachedData && (Date.now() - _cacheTimestamp < CACHE_DURATION)) {
                renderContent(_cachedData);
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

        const now = Date.now();
        
        if (!force && _cachedData && (now - _cacheTimestamp < CACHE_DURATION)) {
            renderContent(_cachedData);
            return;
        }

        if (!force && isLoading) return;
        if (!force && (now - lastFetch < 60000)) {
            if (_cachedData) renderContent(_cachedData);
            return;
        }

        isLoading = true;

        try {
            // Load all data
            await loadUserData();
            
            // V6.9: Load NFT boost from contract
            await loadNftBoostData();
            
            // V6.9: Load claim preview from contract
            await loadClaimPreviewData();
            
            // Load rewards breakdown
            const grossRewards = await calculateUserTotalRewards();
            
            // Load claim history
            await loadClaimHistory();

            // Cache data
            _cachedData = {
                grossRewards,
                claimPreview,
                userNftBoost,
                userBurnRate,
                nftSource,
                claimEthFee
            };
            _cacheTimestamp = now;

            renderContent(_cachedData);
            lastFetch = now;

        } catch (e) {
            console.error("Rewards Error:", e);
        } finally {
            isLoading = false;
        }
    },
    
    clearCache() {
        _cachedData = null;
        _cacheTimestamp = 0;
        lastFetch = 0;
        claimPreview = null;
    }
};

// ============================================================================
// DATA LOADING
// ============================================================================

// V6.9: Load NFT boost from contract
async function loadNftBoostData() {
    try {
        const contract = State.delegationManagerContract || State.delegationManagerContractPublic;
        if (contract && State.userAddress) {
            try {
                const boost = await contract.getUserBestBoost(State.userAddress);
                userNftBoost = Number(boost);
            } catch {
                const boosterData = await getHighestBoosterBoostFromAPI();
                userNftBoost = boosterData?.highestBoost || 0;
                nftSource = boosterData?.source || 'none';
            }
        } else {
            const boosterData = await getHighestBoosterBoostFromAPI();
            userNftBoost = boosterData?.highestBoost || 0;
            nftSource = boosterData?.source || 'none';
        }

        const tier = getTierFromBoost(userNftBoost);
        userBurnRate = tier.burnRate;
    } catch (e) {
        console.error('Error loading NFT boost:', e);
        userNftBoost = 0;
        userBurnRate = 50;
    }
}

// V6.9: Load claim preview from contract
async function loadClaimPreviewData() {
    try {
        const contract = State.delegationManagerContract || State.delegationManagerContractPublic;
        if (contract && State.userAddress) {
            // Try previewClaim from contract
            try {
                const preview = await contract.previewClaim(State.userAddress);
                claimPreview = {
                    totalRewards: preview.totalRewards || preview[0] || 0n,
                    burnAmount: preview.burnAmount || preview[1] || 0n,
                    userReceives: preview.userReceives || preview[2] || 0n,
                    burnRateBips: preview.burnRateBips || preview[3] || 0n,
                    nftBoost: preview.nftBoost || preview[4] || 0n
                };
            } catch {
                // Fallback: calculate manually
                const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
                const total = (stakingRewards || 0n) + (minerRewards || 0n);
                const burnAmount = (total * BigInt(userBurnRate)) / 100n;
                claimPreview = {
                    totalRewards: total,
                    burnAmount: burnAmount,
                    userReceives: total - burnAmount,
                    burnRateBips: BigInt(userBurnRate * 100),
                    nftBoost: BigInt(userNftBoost)
                };
            }

            // Get ETH claim fee
            try {
                claimEthFee = await contract.claimEthFee();
            } catch {
                claimEthFee = 0n;
            }
        }
    } catch (e) {
        console.error('Error loading claim preview:', e);
    }
}

// Load claim history
async function loadClaimHistory() {
    if (!State.userAddress) return;
    
    try {
        const historyUrl = API_ENDPOINTS?.getHistory || 'https://gethistory-4wvdcuoouq-uc.a.run.app';
        const response = await fetch(`${historyUrl}/${State.userAddress}`);
        
        if (!response.ok) return;
        
        const activities = await response.json();
        
        claimHistory = activities
            .filter(item => item.type === 'ClaimReward' || (item.type || '').toUpperCase().includes('CLAIM'))
            .slice(0, 10)
            .map(item => ({
                amount: item.amount || item.details?.amountReceived || item.details?.amount || '0',
                burnedAmount: item.details?.burnedAmount || '0',
                timestamp: item.timestamp?._seconds 
                    ? new Date(item.timestamp._seconds * 1000) 
                    : (item.timestamp ? new Date(item.timestamp) : new Date()),
                txHash: item.txHash || ''
            }));
        
    } catch (e) {
        console.warn('Failed to load claim history:', e.message);
        claimHistory = [];
    }
}

// ============================================================================
// PAGE HTML
// ============================================================================
function getPageHTML() {
    return `
        <div class="max-w-lg mx-auto px-4 py-6">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center">
                        <i class="fa-solid fa-gift text-green-400 text-xl"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-white">Rewards</h1>
                        <p class="text-xs text-zinc-500">Claim your staking earnings</p>
                    </div>
                </div>
                <button id="rewards-refresh" onclick="window.RewardsPage.update(true)" 
                        class="w-10 h-10 rounded-xl bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 flex items-center justify-center transition-all hover:scale-105">
                    <i class="fa-solid fa-rotate text-zinc-400"></i>
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
        <div class="rewards-card flex flex-col items-center justify-center py-16 px-6">
            <div class="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-2xl text-zinc-600"></i>
            </div>
            <p class="text-zinc-400 font-medium mb-1">Wallet not connected</p>
            <p class="text-zinc-600 text-sm mb-5">Connect to view your rewards</p>
            <button onclick="window.openConnectModal()" 
                class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all">
                <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
            </button>
        </div>
    `;
}

function renderLoading() {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    container.innerHTML = `
        <div class="rewards-card flex flex-col items-center justify-center py-16">
            <div class="w-14 h-14 rounded-full border-3 border-green-500 border-t-transparent animate-spin mb-4"></div>
            <p class="text-zinc-500 text-sm">Loading rewards...</p>
        </div>
    `;
}

// ============================================================================
// MAIN CONTENT RENDER
// ============================================================================
function renderContent(data) {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    const { grossRewards } = data || {};
    const stakingRewards = grossRewards?.stakingRewards || 0n;
    const minerRewards = grossRewards?.minerRewards || 0n;
    
    // Use contract preview or fallback
    const preview = claimPreview || {};
    const totalRewards = preview.totalRewards || (stakingRewards + minerRewards);
    const burnAmount = preview.burnAmount || (totalRewards * BigInt(userBurnRate)) / 100n;
    const userReceives = preview.userReceives || (totalRewards - burnAmount);

    // Convert to numbers for display
    const totalNum = Number(totalRewards) / 1e18;
    const burnNum = Number(burnAmount) / 1e18;
    const receiveNum = Number(userReceives) / 1e18;
    const stakingNum = Number(stakingRewards) / 1e18;
    const minerNum = Number(minerRewards) / 1e18;
    const ethFeeNum = Number(claimEthFee) / 1e18;

    const hasRewards = totalRewards > 0n;
    const tier = getTierFromBoost(userNftBoost);
    
    // Calculate potential with Diamond
    const potentialWithDiamond = totalNum; // 100% keep rate
    const currentReceive = totalNum * (tier.keepRate / 100);
    const potentialBonus = potentialWithDiamond - currentReceive;

    container.innerHTML = `
        <div class="space-y-4">
            
            <!-- ═══════════════════════════════════════════════════════════════
                 MAIN CLAIM CARD
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="rewards-card overflow-hidden ${hasRewards ? 'pulse-glow' : ''}">
                
                <!-- Hero Section -->
                <div class="relative pt-8 pb-6 px-6">
                    <!-- Background glow -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                        <div class="w-64 h-64 ${hasRewards ? 'bg-green-500/10' : 'bg-zinc-500/5'} rounded-full blur-3xl"></div>
                    </div>
                    
                    <!-- Tier Icon -->
                    <div class="relative flex justify-center mb-5">
                        <div class="text-7xl float-animation">${hasRewards ? '🎁' : '📭'}</div>
                    </div>
                    
                    <!-- Amount Display -->
                    <div class="text-center relative">
                        <p class="text-xs text-zinc-500 uppercase tracking-widest mb-2">You Will Receive</p>
                        <div class="flex items-baseline justify-center gap-2 mb-3">
                            <span class="text-5xl font-black ${hasRewards ? 'text-green-400' : 'text-zinc-600'}">${receiveNum.toFixed(4)}</span>
                            <span class="text-lg font-bold ${hasRewards ? 'text-green-500' : 'text-zinc-600'}">BKC</span>
                        </div>
                        
                        <!-- Tier Badge -->
                        <div class="tier-badge ${tier.class}">
                            <span class="text-lg">${tier.emoji}</span>
                            <span>${tier.name}</span>
                            <span class="opacity-70">•</span>
                            <span>Keep ${tier.keepRate}%</span>
                        </div>
                        
                        ${!hasRewards ? '' : userNftBoost === 0 && potentialBonus > 0.0001 ? `
                        <div class="mt-4 comparison-card p-3">
                            <p class="text-xs text-green-400">
                                <i class="fa-solid fa-lightbulb mr-1 text-amber-400"></i>
                                With 💎 Diamond NFT: <span class="font-bold">+${potentialBonus.toFixed(4)} BKC</span> more!
                            </p>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Claim Button -->
                <div class="px-5 pb-5">
                    <button id="claim-btn" onclick="${hasRewards ? 'window.handleRewardsClaim()' : ''}" 
                        class="claim-btn w-full py-4 text-base flex items-center justify-center gap-2" 
                        ${!hasRewards ? 'disabled' : ''}>
                        <i id="claim-btn-icon" class="fa-solid ${hasRewards ? 'fa-hand-holding-dollar' : 'fa-clock'}"></i>
                        <span id="claim-btn-text">${hasRewards ? 'Claim Rewards' : 'No Rewards Yet'}</span>
                    </button>
                    ${hasRewards && ethFeeNum > 0 ? `
                    <p class="text-center text-[10px] text-zinc-600 mt-2">
                        <i class="fa-brands fa-ethereum mr-1"></i>Claim fee: ${ethFeeNum.toFixed(6)} ETH
                    </p>
                    ` : ''}
                </div>
            </div>

            ${hasRewards ? `
            <!-- ═══════════════════════════════════════════════════════════════
                 BREAKDOWN CARD
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="rewards-card p-5">
                <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-chart-pie text-zinc-500"></i>
                    Reward Breakdown
                </h3>
                
                <!-- Sources -->
                <div class="space-y-3 mb-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-layer-group text-purple-400 text-xs"></i>
                            </div>
                            <span class="text-sm text-zinc-400">Staking Rewards</span>
                        </div>
                        <span class="font-mono text-white">${stakingNum.toFixed(4)} BKC</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-coins text-amber-400 text-xs"></i>
                            </div>
                            <span class="text-sm text-zinc-400">Miner Rewards</span>
                        </div>
                        <span class="font-mono text-white">${minerNum.toFixed(4)} BKC</span>
                    </div>
                </div>
                
                <div class="border-t border-zinc-800 pt-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-zinc-500">Total Earned</span>
                        <span class="font-mono text-white font-bold">${totalNum.toFixed(4)} BKC</span>
                    </div>
                    
                    <!-- Burn Rate Bar -->
                    <div class="burn-bar my-3">
                        <div class="burn-bar-fill" style="width: ${tier.burnRate}%"></div>
                        <div class="keep-bar-fill" style="width: ${tier.keepRate}%"></div>
                    </div>
                    <div class="flex justify-between text-[10px] mb-4">
                        <span class="text-red-400/70 flex items-center gap-1">
                            <i class="fa-solid fa-fire"></i> Burned ${tier.burnRate}%
                        </span>
                        <span class="text-green-400/70 flex items-center gap-1">
                            <i class="fa-solid fa-check"></i> You Keep ${tier.keepRate}%
                        </span>
                    </div>
                    
                    <div class="space-y-2">
                        ${burnNum > 0 ? `
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-red-400/70 flex items-center gap-1.5">
                                <i class="fa-solid fa-fire text-[10px]"></i>
                                Burn Amount
                            </span>
                            <span class="font-mono text-red-400/70">-${burnNum.toFixed(4)} BKC</span>
                        </div>
                        ` : ''}
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-green-400 font-medium flex items-center gap-1.5">
                                <i class="fa-solid fa-wallet text-[10px]"></i>
                                You Receive
                            </span>
                            <span class="font-mono text-green-400 font-bold">${receiveNum.toFixed(4)} BKC</span>
                        </div>
                    </div>
                </div>
            </div>
            ` : `
            <!-- Empty State -->
            <div class="rewards-card p-6 text-center">
                <i class="fa-solid fa-seedling text-3xl text-zinc-700 mb-3"></i>
                <p class="text-zinc-500 text-sm mb-2">No rewards to claim yet</p>
                <p class="text-zinc-600 text-xs">
                    <a href="#mine" onclick="window.navigateTo('mine')" class="text-green-400 hover:text-green-300">
                        Stake BKC
                    </a> to start earning rewards
                </p>
            </div>
            `}

            <!-- ═══════════════════════════════════════════════════════════════
                 NFT STATUS
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="rewards-card p-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl ${userNftBoost > 0 ? `bg-gradient-to-br from-${tier.class === 'tier-diamond' ? 'cyan' : tier.class === 'tier-gold' ? 'amber' : tier.class === 'tier-silver' ? 'gray' : tier.class === 'tier-bronze' ? 'yellow' : 'zinc'}-500/20` : 'bg-zinc-800'} border border-zinc-700/50 flex items-center justify-center text-2xl">
                            ${tier.emoji}
                        </div>
                        <div>
                            <p class="text-white font-semibold">${userNftBoost > 0 ? `${tier.name} Booster` : 'No Booster'}</p>
                            <p class="text-xs text-zinc-500">
                                ${userNftBoost > 0 ? `${nftSource === 'rented' ? 'Rented' : 'Active'} • Keep ${tier.keepRate}%` : 'Keep up to 100% with NFT'}
                            </p>
                        </div>
                    </div>
                    
                    ${userNftBoost === 0 ? `
                    <a href="#store" onclick="window.navigateTo('store')"
                       class="px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all">
                        Get NFT
                    </a>
                    ` : `
                    <div class="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                        <span class="text-[10px] text-green-400 font-bold flex items-center gap-1">
                            <i class="fa-solid fa-check"></i> ACTIVE
                        </span>
                    </div>
                    `}
                </div>
                
                ${userNftBoost > 0 && userNftBoost < 5000 ? `
                <div class="mt-4 pt-4 border-t border-zinc-800">
                    <p class="text-[11px] text-zinc-500">
                        <i class="fa-solid fa-arrow-up text-cyan-400 mr-1"></i>
                        Upgrade to 💎 Diamond to keep 100% of rewards (0% burn)
                    </p>
                </div>
                ` : ''}
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 CLAIM HISTORY
                 ═══════════════════════════════════════════════════════════════ -->
            <details class="rewards-card overflow-hidden group">
                <summary class="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors">
                    <span class="text-sm text-zinc-400 flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-xs"></i>
                        Claim History
                    </span>
                    <i class="fa-solid fa-chevron-down text-zinc-600 text-xs transition-transform group-open:rotate-180"></i>
                </summary>
                <div class="px-4 pb-4 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                    ${renderClaimHistory()}
                </div>
            </details>
        </div>
    `;
}

// ============================================================================
// CLAIM HISTORY RENDER
// ============================================================================
function renderClaimHistory() {
    if (claimHistory.length === 0) {
        return `
            <div class="text-center py-8">
                <i class="fa-solid fa-inbox text-zinc-700 text-2xl mb-3"></i>
                <p class="text-zinc-600 text-xs">No claims yet</p>
            </div>
        `;
    }

    return claimHistory.map(tx => {
        const amount = tx.amount ? (Number(tx.amount) / 1e18).toFixed(4) : '0';
        const burned = tx.burnedAmount && Number(tx.burnedAmount) > 0 ? (Number(tx.burnedAmount) / 1e18).toFixed(2) : null;
        const timeAgo = tx.timestamp ? getTimeAgo(new Date(tx.timestamp)) : '';
        
        return `
            <a href="${EXPLORER_TX}${tx.txHash}" target="_blank" 
               class="history-item flex items-center gap-3 p-3">
                <div class="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-gift text-green-400 text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-white font-medium">Claimed Rewards</p>
                    <p class="text-[10px] text-zinc-500">${timeAgo}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-sm font-mono font-bold text-green-400">+${amount}</p>
                    ${burned ? `<p class="text-[9px] text-red-400/60">🔥 -${burned}</p>` : ''}
                </div>
                <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 text-[10px] flex-shrink-0"></i>
            </a>
        `;
    }).join('');
}

// ============================================================================
// CLAIM HANDLER
// ============================================================================
async function handleClaim() {
    if (isProcessing) return;

    const btn = document.getElementById('claim-btn');
    if (!btn) return;

    isProcessing = true;

    try {
        await StakingTx.claimRewards({
            button: btn,

            onSuccess: (receipt) => {
                showToast('🎁 Rewards claimed successfully!', 'success');

                setTimeout(() => {
                    RewardsPage.clearCache();
                    claimHistory = [];
                    RewardsPage.update(true);
                }, 2500);
            },

            onError: (error) => {
                if (error && !error.cancelled && error.type !== 'user_rejected') {
                    showToast(error.message || 'Claim failed', 'error');
                }
            }
        });

    } catch (e) {
        console.error('Claim error:', e);
        showToast(e.message || 'Claim failed', 'error');
    } finally {
        isProcessing = false;
    }
}

window.RewardsPage = RewardsPage;