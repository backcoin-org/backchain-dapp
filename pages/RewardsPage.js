// pages/RewardsPage.js
// ✅ PRODUCTION V12.0 - Fixed for Contract V2
//
// V12.0 Changes:
// - Fixed claimRewards call to match new contract signature (only boosterTokenId)
// - Removed unused stakingRewards/minerRewards parameters from claim
// - Added better error handling for BigInt serialization
// - Improved loading states
//
// V11.0: Migrated to use StakingTx.claimRewards from transaction engine
// V10.0: Animated Reward Image + Detailed History + Consistent Icons

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

// V11: Import new transaction module
import { StakingTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const REWARD_IMAGE = './assets/reward.png';
const EXPLORER_TX = 'https://sepolia.arbiscan.io/tx/';

// ============================================================================
// LOCAL STATE
// ============================================================================
let lastFetch = 0;
let isLoading = false;
let isProcessing = false;
let claimHistory = [];
// V12: Only boosterTokenId is needed for the claim
let _claimParams = { boosterTokenId: 0n };

// Global claim handler
window.handleRewardsClaim = async function() {
    if (isProcessing) return;
    await handleClaim(_claimParams.boosterTokenId);
};

// ============================================================================
// STYLES INJECTION
// ============================================================================
function injectStyles() {
    if (document.getElementById('reward-styles-v10')) return;
    
    const style = document.createElement('style');
    style.id = 'reward-styles-v10';
    style.textContent = `
        /* Reward Image Animations */
        @keyframes reward-float {
            0%, 100% { transform: translateY(0) rotate(-2deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes reward-pulse {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(245,158,11,0.4)); }
            50% { filter: drop-shadow(0 0 35px rgba(245,158,11,0.8)); }
        }
        @keyframes reward-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        @keyframes reward-bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        @keyframes reward-success {
            0% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-10deg); }
            50% { transform: scale(1.3) rotate(10deg); filter: drop-shadow(0 0 50px rgba(34,197,94,1)); }
            75% { transform: scale(1.1) rotate(-5deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes reward-coins {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(-30px) rotate(360deg); opacity: 0; }
        }
        .reward-float { animation: reward-float 3s ease-in-out infinite; }
        .reward-pulse { animation: reward-pulse 2s ease-in-out infinite; }
        .reward-spin { animation: reward-spin 1.5s ease-in-out; }
        .reward-bounce { animation: reward-bounce 1s ease-in-out infinite; }
        .reward-success { animation: reward-success 1s ease-out; }
        
        .history-item:hover {
            background: rgba(63,63,70,0.5) !important;
            transform: translateX(4px);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(39,39,42,0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(113,113,122,0.5);
            border-radius: 2px;
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
            renderContentImmediate();
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
        if (!force && isLoading) return;
        if (!force && (now - lastFetch < 60000)) return;

        isLoading = true;
        updateMascotAnimation('loading');

        try {
            let boosterData = { highestBoost: 0, boostName: 'None', tokenId: null, source: 'none' };
            let claimDetails = { netClaimAmount: 0n, feeAmount: 0n, totalRewards: 0n };
            let grossRewards = { stakingRewards: 0n, minerRewards: 0n };

            try { await loadUserData(); } catch (e) {}
            try { boosterData = await getHighestBoosterBoostFromAPI() || boosterData; } catch (e) {}
            try { claimDetails = await calculateClaimDetails() || claimDetails; } catch (e) {}
            try { grossRewards = await calculateUserTotalRewards() || grossRewards; } catch (e) {}
            try { await loadClaimHistory(); } catch (e) {}

            renderContent(claimDetails, grossRewards, boosterData);
            lastFetch = now;
            updateMascotAnimation('idle');

        } catch (e) {
            console.error("Rewards Error:", e);
        } finally {
            isLoading = false;
        }
    }
};

// ============================================================================
// MASCOT ANIMATION
// ============================================================================
function updateMascotAnimation(state) {
    const mascot = document.getElementById('reward-mascot');
    if (!mascot) return;
    
    mascot.className = 'w-12 h-12 object-contain';
    
    switch (state) {
        case 'loading':
            mascot.classList.add('reward-spin');
            break;
        case 'claiming':
            mascot.classList.add('reward-bounce');
            break;
        case 'success':
            mascot.classList.add('reward-success');
            break;
        default:
            mascot.classList.add('reward-float', 'reward-pulse');
    }
}

// ============================================================================
// CLAIM HISTORY
// ============================================================================
async function loadClaimHistory() {
    if (!State.userAddress) return;
    
    try {
        const response = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
        if (response.ok) {
            const allHistory = await response.json();
            claimHistory = allHistory.filter(item => {
                const type = (item.type || '').toUpperCase();
                return type.includes('REWARD') || type.includes('CLAIM');
            }).slice(0, 15);
        }
    } catch (e) {
        claimHistory = [];
    }
}

function renderClaimHistory() {
    if (claimHistory.length === 0) {
        return `
            <div class="text-center py-6">
                <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                    <i class="fa-solid fa-clock-rotate-left text-zinc-600 text-lg"></i>
                </div>
                <p class="text-zinc-500 text-xs">No claims yet</p>
                <p class="text-zinc-600 text-[10px] mt-1">Your claim history will appear here</p>
            </div>
        `;
    }

    return claimHistory.map(item => {
        const date = formatDate(item.timestamp || item.createdAt);
        const details = item.details || {};
        const txHash = item.txHash || '';
        const txLink = txHash ? `${EXPLORER_TX}${txHash}` : '#';
        
        // Calcular o valor total recebido (amountReceived ou amount - fee)
        let amountReceived = '0';
        let feeAmount = '0';
        
        if (details.amountReceived) {
            amountReceived = details.amountReceived;
        } else if (item.amount) {
            amountReceived = item.amount;
        } else if (details.amount) {
            amountReceived = details.amount;
        }
        
        if (details.feePaid) {
            feeAmount = details.feePaid;
        } else if (details.feeAmount) {
            feeAmount = details.feeAmount;
        }
        
        const formattedAmount = formatHistoryAmount(amountReceived);
        const formattedFee = formatHistoryAmount(feeAmount);
        
        // Determine claim type
        let icon, iconColor, bgColor, label;
        const type = (item.type || '').toUpperCase();
        
        if (type.includes('STAKING') || type.includes('DELEGAT')) {
            icon = 'fa-lock';
            iconColor = '#a855f7';
            bgColor = 'rgba(168,85,247,0.15)';
            label = '🔒 Staking Reward';
        } else if (type.includes('MINING') || type.includes('MINER')) {
            icon = 'fa-hammer';
            iconColor = '#f97316';
            bgColor = 'rgba(249,115,22,0.15)';
            label = '⛏️ Mining Reward';
        } else if (type.includes('CLAIM') || type.includes('REWARD')) {
            icon = 'fa-gift';
            iconColor = '#22c55e';
            bgColor = 'rgba(34,197,94,0.15)';
            label = '🎁 Claimed';
        } else {
            icon = 'fa-coins';
            iconColor = '#eab308';
            bgColor = 'rgba(234,179,8,0.15)';
            label = '💰 Reward';
        }

        return `
            <a href="${txLink}" target="_blank" rel="noopener" 
               class="history-item flex items-center justify-between p-3 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-xl transition-all group border border-zinc-700/30">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: ${bgColor}">
                        <i class="fa-solid ${icon} text-sm" style="color: ${iconColor}"></i>
                    </div>
                    <div>
                        <p class="text-sm text-white font-medium">${label}</p>
                        <p class="text-[10px] text-zinc-500">${date}</p>
                        ${parseFloat(formattedFee) > 0 ? `<p class="text-[9px] text-zinc-600">Fee: ${formattedFee} BKC</p>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="text-right">
                        <span class="text-sm font-mono font-bold text-green-400">+${formattedAmount}</span>
                        <span class="text-zinc-500 text-[10px] ml-1">BKC</span>
                    </div>
                    ${txHash ? '<i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-green-400 text-[10px] ml-2"></i>' : ''}
                </div>
            </a>
        `;
    }).join('');
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    try {
        let date;
        
        // Handle Firebase Timestamp format
        if (timestamp.seconds || timestamp._seconds) {
            const secs = timestamp.seconds || timestamp._seconds;
            date = new Date(secs * 1000);
        }
        // Handle ISO string
        else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        }
        // Handle milliseconds timestamp
        else if (typeof timestamp === 'number') {
            // If it's in seconds (Unix), convert to ms
            date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
        }
        // Handle Date object
        else if (timestamp instanceof Date) {
            date = timestamp;
        }
        else {
            return 'Unknown date';
        }
        
        // Validate date
        if (isNaN(date.getTime())) return 'Unknown date';
        
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        console.warn('Date parse error:', e);
        return 'Unknown date';
    }
}

function formatHistoryAmount(amount) {
    if (!amount) return '0.00';
    try {
        // Se for string que parece ser wei (muito longa), usar formatEther
        if (typeof amount === 'string') {
            // Se tem mais de 10 dígitos, provavelmente é wei
            if (amount.length > 10 && !amount.includes('.')) {
                const formatted = ethers.formatEther(BigInt(amount));
                return parseFloat(formatted).toFixed(4);
            }
            // Senão, já está formatado
            return parseFloat(amount).toFixed(4);
        }
        // Se for BigInt
        if (typeof amount === 'bigint') {
            const formatted = ethers.formatEther(amount);
            return parseFloat(formatted).toFixed(4);
        }
        // Se for número muito grande, provavelmente é wei
        if (typeof amount === 'number' && amount > 1e10) {
            const formatted = ethers.formatEther(BigInt(Math.floor(amount)));
            return parseFloat(formatted).toFixed(4);
        }
        // Senão, usar como está
        return parseFloat(amount).toFixed(4);
    } catch (e) {
        console.warn('Amount format error:', e);
        return '0.00';
    }
}

// ============================================================================
// PAGE STRUCTURE
// ============================================================================
function getPageHTML() {
    return `
        <div class="max-w-lg mx-auto px-4 py-4 pb-24">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <img src="${REWARD_IMAGE}" 
                         alt="Rewards" 
                         class="w-12 h-12 object-contain reward-float reward-pulse"
                         id="reward-mascot"
                         onerror="this.style.display='none'; document.getElementById('reward-fallback').style.display='flex';">
                    <div id="reward-fallback" class="hidden w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 items-center justify-center">
                        <i class="fa-solid fa-coins text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-white">🎁 Rewards</h1>
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
        <div class="flex flex-col items-center justify-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <img src="${REWARD_IMAGE}" class="w-16 h-16 opacity-30 mb-4" onerror="this.style.display='none'">
            <p class="text-zinc-400 font-medium mb-1">Wallet not connected</p>
            <p class="text-zinc-600 text-sm mb-4">Connect to view your rewards</p>
            <button onclick="window.openConnectModal()" 
                class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm rounded-xl">
                <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
            </button>
        </div>
    `;
}

function renderContentImmediate() {
    renderContent(
        { netClaimAmount: 0n, feeAmount: 0n, totalRewards: 0n },
        { stakingRewards: 0n, minerRewards: 0n },
        { highestBoost: 0, boostName: 'None', tokenId: null, source: 'none' }
    );
}

// ============================================================================
// MAIN CONTENT
// ============================================================================
function renderContent(claimDetails, grossRewards, boosterData) {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    const details = claimDetails || {};
    const gross = grossRewards || {};
    const booster = boosterData || {};

    const netReward = details.netClaimAmount || 0n;
    const totalGross = details.totalRewards || 0n;
    const feeAmount = details.feeAmount || 0n;
    const stakingRewards = gross.stakingRewards || 0n;
    const minerRewards = gross.minerRewards || 0n;
    const highestBoost = booster.highestBoost || 0;

    const feeBips = details.baseFeeBips || 5000;
    const boostPercent = highestBoost / 100;
    const effectiveFeeBips = details.finalFeeBips || (feeBips - (feeBips * highestBoost / 10000));
    const keepPercent = 100 - (effectiveFeeBips / 100);
    
    const hasRewards = netReward > 0n;
    const hasBooster = highestBoost > 0;
    
    // V12: Only store boosterTokenId - contract handles reward calculation
    const boosterTokenId = BigInt(booster.tokenId || 0);
    _claimParams = { boosterTokenId };
    
    let netRewardNum = 0, totalGrossNum = 0, feeAmountNum = 0, stakingNum = 0, miningNum = 0;
    try {
        netRewardNum = formatBigNumber ? formatBigNumber(netReward) : Number(netReward) / 1e18;
        totalGrossNum = formatBigNumber ? formatBigNumber(totalGross) : Number(totalGross) / 1e18;
        feeAmountNum = formatBigNumber ? formatBigNumber(feeAmount) : Number(feeAmount) / 1e18;
        stakingNum = formatBigNumber ? formatBigNumber(stakingRewards) : Number(stakingRewards) / 1e18;
        miningNum = formatBigNumber ? formatBigNumber(minerRewards) : Number(minerRewards) / 1e18;
    } catch (e) {}

    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (keepPercent / 100) * circumference;

    container.innerHTML = `
        <div class="space-y-4">
            <!-- MAIN CLAIM CARD -->
            <div class="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
                <div class="flex flex-col items-center mb-5">
                    <div class="relative w-32 h-32 mb-3">
                        <svg class="w-full h-full" style="transform: rotate(-90deg)" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" stroke-width="6"/>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="${hasBooster ? '#4ade80' : '#f59e0b'}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"/>
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span class="text-2xl font-black text-white">${netRewardNum.toFixed(2)}</span>
                            <span class="text-xs text-amber-400 font-bold">BKC</span>
                        </div>
                    </div>
                    <p class="text-xs text-zinc-500">You keep <span class="${hasBooster ? 'text-green-400' : 'text-amber-400'} font-bold">${keepPercent.toFixed(1)}%</span> of earnings</p>
                </div>

                <button id="claim-btn" onclick="${hasRewards ? 'window.handleRewardsClaim()' : ''}" class="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${hasRewards ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}" ${!hasRewards ? 'disabled' : ''}>
                    <i id="claim-btn-icon" class="fa-solid ${hasRewards ? 'fa-coins' : 'fa-clock'}"></i>
                    <span id="claim-btn-text">${hasRewards ? 'Claim ' + netRewardNum.toFixed(2) + ' BKC' : 'No Rewards Yet'}</span>
                </button>
                
                ${!hasRewards ? '<p class="text-center text-xs text-zinc-600 mt-3"><i class="fa-solid fa-info-circle mr-1"></i><a href="#mine" onclick="window.navigateTo(\'mine\')" class="text-amber-500 hover:text-amber-400">Stake BKC</a> to start earning</p>' : ''}
            </div>

            <!-- STATS GRID -->
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center"><i class="fa-solid fa-chart-line text-purple-400 text-xs"></i></div>
                        <span class="text-[10px] text-zinc-500 uppercase">Earned</span>
                    </div>
                    <p class="text-lg font-bold text-white font-mono">${totalGrossNum.toFixed(2)}</p>
                    <p class="text-[10px] text-zinc-600">Total BKC</p>
                </div>
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center"><i class="fa-solid fa-percent text-red-400 text-xs"></i></div>
                        <span class="text-[10px] text-zinc-500 uppercase">Fee</span>
                    </div>
                    <p class="text-lg font-bold text-zinc-400 font-mono">${feeAmountNum.toFixed(2)}</p>
                    <p class="text-[10px] text-zinc-600">${(100 - keepPercent).toFixed(1)}% fee</p>
                </div>
            </div>

            <!-- REWARD SOURCES -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p class="text-[10px] text-zinc-500 uppercase mb-3"><i class="fa-solid fa-layer-group mr-1"></i> Sources</p>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2.5 bg-zinc-800/30 rounded-lg">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center"><i class="fa-solid fa-lock text-purple-400 text-xs"></i></div>
                            <span class="text-sm text-zinc-300">Staking</span>
                        </div>
                        <span class="text-sm font-mono font-bold text-white">${stakingNum.toFixed(2)} <span class="text-zinc-500 text-xs">BKC</span></span>
                    </div>
                    <div class="flex items-center justify-between p-2.5 bg-zinc-800/30 rounded-lg">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center"><i class="fa-solid fa-hammer text-orange-400 text-xs"></i></div>
                            <span class="text-sm text-zinc-300">Mining</span>
                        </div>
                        <span class="text-sm font-mono font-bold text-white">${miningNum.toFixed(2)} <span class="text-zinc-500 text-xs">BKC</span></span>
                    </div>
                </div>
            </div>

            <!-- BOOSTER -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div class="p-3 border-b border-zinc-800/50 flex items-center justify-between">
                    <p class="text-[10px] text-zinc-500 uppercase"><i class="fa-solid fa-rocket mr-1"></i> Booster</p>
                    ${hasBooster ? '<span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full">ACTIVE</span>' : '<span class="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded-full">NONE</span>'}
                </div>
                <div class="p-4">
                    ${hasBooster ? `
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 bg-black/50 rounded-xl border-2 border-green-500/30 overflow-hidden">
                                <img src="${booster.imageUrl || './assets/bkc_logo_3d.png'}" class="w-full h-full object-cover" onerror="this.src='./assets/bkc_logo_3d.png'">
                            </div>
                            <div class="flex-1"><p class="text-white font-bold">${booster.boostName || 'Booster'}</p><p class="text-[11px] text-zinc-500">${booster.source === 'rented' ? '🔗 Rented' : '✓ Owned'}</p></div>
                            <div class="text-right"><p class="text-xl font-bold text-green-400">+${boostPercent}%</p><p class="text-[10px] text-zinc-500">Discount</p></div>
                        </div>
                    ` : `
                        <div class="text-center">
                            <p class="text-sm text-zinc-400 mb-3">Get a Booster to keep up to <span class="text-green-400 font-bold">85%</span></p>
                            <div class="flex gap-2">
                                <button onclick="window.navigateTo('store')" class="flex-1 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg"><i class="fa-solid fa-gem mr-1"></i> Buy</button>
                                <button onclick="window.navigateTo('rental')" class="flex-1 py-2.5 text-xs font-bold bg-zinc-800 text-white rounded-lg"><i class="fa-solid fa-clock mr-1"></i> Rent</button>
                            </div>
                        </div>
                    `}
                </div>
            </div>

            <!-- CLAIM HISTORY -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div class="p-3 border-b border-zinc-800/50 flex items-center justify-between">
                    <p class="text-[10px] text-zinc-500 uppercase"><i class="fa-solid fa-clock-rotate-left mr-1"></i> Claim History</p>
                    <span class="text-[10px] text-zinc-600">${claimHistory.length} claims</span>
                </div>
                <div class="p-3 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    ${renderClaimHistory()}
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// CLAIM HANDLER - V12: Only uses boosterTokenId
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
    
    updateMascotAnimation('claiming');

    try {
        // V12: Use StakingTx.claimRewards with only boosterTokenId
        // The contract handles reward calculation internally
        const result = await StakingTx.claimRewards({
            boosterTokenId: Number(boosterTokenId) || 0,
            button: btn,
            
            onSuccess: (receipt) => {
                updateMascotAnimation('success');
                btn.className = 'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-green-500 text-white';
                btnText.textContent = '🎉 Claimed!';
                btnIcon.className = 'fa-solid fa-check';
                showToast('🎁 Rewards claimed successfully!', 'success');
                
                setTimeout(() => { 
                    lastFetch = 0; 
                    claimHistory = [];
                    RewardsPage.update(true); 
                }, 2500);
            },
            
            onError: (error) => {
                // Don't show error for user rejection
                if (error && !error.cancelled && error.type !== 'user_rejected') {
                    const msg = error.message || error.reason || 'Claim failed';
                    showToast(msg, 'error');
                }
                resetClaimButton(btn, btnText, btnIcon);
                updateMascotAnimation('idle');
            }
        });

        // Handle case where result comes back but callbacks weren't triggered
        if (result && !result.success && !result.cancelled) {
            resetClaimButton(btn, btnText, btnIcon);
            updateMascotAnimation('idle');
        }

    } catch (e) {
        console.error('Claim error:', e);
        // Avoid BigInt serialization in error message
        const errorMsg = e.message || 'Claim failed';
        showToast(errorMsg, 'error');
        resetClaimButton(btn, btnText, btnIcon);
        updateMascotAnimation('idle');
    } finally {
        isProcessing = false;
    }
}

function resetClaimButton(btn, btnText, btnIcon) {
    if (!btn) return;
    btn.disabled = false;
    btn.className = 'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25';
    if (btnText) btnText.textContent = 'Claim Rewards';
    if (btnIcon) btnIcon.className = 'fa-solid fa-coins';
}

window.RewardsPage = RewardsPage;