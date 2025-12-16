// pages/RewardsPage.js
// ✅ VERSION V9.3: Render-first approach - shows UI immediately, loads data in background

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

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const RewardsPage = {
    async render(isNewPage) {
        const container = document.getElementById('rewards');
        if (!container) return;

        // Always render page structure first
        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = getPageHTML();
        }

        if (State.isConnected) {
            // Show initial UI immediately with zeros
            renderContentImmediate();
            // Then load real data in background
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

        try {
            // Load data with individual error handling
            let boosterData = { highestBoost: 0, boostName: 'None', tokenId: null, source: 'none' };
            let claimDetails = { netClaimAmount: 0n, feeAmount: 0n, totalRewards: 0n };
            let grossRewards = { stakingRewards: 0n, minerRewards: 0n };

            try { await loadUserData(); } catch (e) { console.warn('loadUserData failed:', e.message); }
            try { boosterData = await getHighestBoosterBoostFromAPI() || boosterData; } catch (e) { console.warn('booster failed:', e.message); }
            try { claimDetails = await calculateClaimDetails() || claimDetails; } catch (e) { console.warn('claimDetails failed:', e.message); }
            try { grossRewards = await calculateUserTotalRewards() || grossRewards; } catch (e) { console.warn('rewards failed:', e.message); }

            renderContent(claimDetails, grossRewards, boosterData);
            lastFetch = now;

        } catch (e) {
            console.error("Rewards Error:", e);
        } finally {
            isLoading = false;
        }
    }
};

// ============================================================================
// PAGE STRUCTURE
// ============================================================================

function getPageHTML() {
    return `
        <div class="max-w-lg mx-auto px-4 py-4 pb-24">
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
                <button id="rewards-refresh" onclick="window.RewardsPage.update(true)" class="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                    <i class="fa-solid fa-arrows-rotate text-xs"></i>
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
            <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-2xl text-zinc-600"></i>
            </div>
            <p class="text-zinc-400 font-medium mb-1">Wallet not connected</p>
            <p class="text-zinc-600 text-sm mb-4">Connect to view your rewards</p>
            <button onclick="window.openConnectModal()" 
                class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm rounded-xl">
                <i class="fa-solid fa-plug mr-2"></i>Connect Wallet
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
    const boosterTokenId = BigInt(booster.tokenId || 0);
    
    let netRewardNum = 0, totalGrossNum = 0, feeAmountNum = 0, stakingNum = 0, miningNum = 0;
    try {
        netRewardNum = formatBigNumber ? formatBigNumber(netReward) : Number(netReward) / 1e18;
        totalGrossNum = formatBigNumber ? formatBigNumber(totalGross) : Number(totalGross) / 1e18;
        feeAmountNum = formatBigNumber ? formatBigNumber(feeAmount) : Number(feeAmount) / 1e18;
        stakingNum = formatBigNumber ? formatBigNumber(stakingRewards) : Number(stakingRewards) / 1e18;
        miningNum = formatBigNumber ? formatBigNumber(minerRewards) : Number(minerRewards) / 1e18;
    } catch (e) { console.warn('Format error:', e); }

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

                <button id="claim-btn" class="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${hasRewards ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}" ${!hasRewards ? 'disabled' : ''}>
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
                                <button onclick="window.navigateTo('rental')" class="flex-1 py-2.5 text-xs font-bold bg-zinc-800 text-white rounded-lg"><i class="fa-solid fa-handshake mr-1"></i> Rent</button>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

    const claimBtn = document.getElementById('claim-btn');
    if (claimBtn && hasRewards) {
        claimBtn.onclick = () => handleClaim(stakingRewards, minerRewards, boosterTokenId);
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
    btn.disabled = true;
    btn.className = 'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-zinc-700 text-zinc-400';
    btnText.textContent = 'Processing...';
    btnIcon.className = 'fa-solid fa-spinner fa-spin';

    try {
        const success = await executeUniversalClaim(stakingRewards, minerRewards, boosterTokenId, null);
        if (success) {
            btn.className = 'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-green-500 text-white';
            btnText.textContent = '✓ Claimed!';
            btnIcon.className = 'fa-solid fa-check';
            showToast('🎉 Rewards claimed!', 'success');
            setTimeout(() => { lastFetch = 0; RewardsPage.update(true); }, 1500);
        }
    } catch (e) {
        console.error('Claim error:', e);
        showToast('Claim failed: ' + (e.reason || e.message || 'Error'), 'error');
        btn.disabled = false;
        btn.className = 'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25';
        btnText.textContent = 'Claim Rewards';
        btnIcon.className = 'fa-solid fa-coins';
    } finally {
        isProcessing = false;
    }
}

window.RewardsPage = RewardsPage;