// pages/RewardsPage.js
// ✅ VERSION V7.1: Improved Booster communication & persuasive UI

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
        updateSyncStatus('Syncing...');

        try {
            await loadUserData();

            const [claimDetails, grossRewards, boosterData] = await Promise.all([
                calculateClaimDetails(),
                calculateUserTotalRewards(),
                getHighestBoosterBoostFromAPI()
            ]);

            renderContent(claimDetails, grossRewards, boosterData);
            lastFetch = now;
            updateSyncStatus(`Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

        } catch (e) {
            console.error("Rewards Error:", e);
            renderError();
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
        <div class="max-w-2xl mx-auto py-6 px-4">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-xl font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-gift text-amber-400"></i> Rewards
                    </h1>
                    <p class="text-xs text-zinc-500 mt-0.5">Claim your earnings</p>
                </div>
                <div id="rewards-sync" class="text-[10px] text-zinc-600 font-mono"></div>
            </div>

            <!-- Content -->
            <div id="rewards-content">
                <div class="flex items-center justify-center py-20">
                    <div class="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    `;
}

function updateSyncStatus(text) {
    const el = document.getElementById('rewards-sync');
    if (el) el.textContent = text;
}

// ============================================================================
// RENDER STATES
// ============================================================================

function renderNotConnected() {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-xl text-zinc-600"></i>
            </div>
            <p class="text-zinc-500 text-sm mb-3">Connect wallet to view rewards</p>
            <button onclick="window.openConnectModal()" class="text-amber-500 hover:text-amber-400 text-sm font-bold">
                Connect Wallet
            </button>
        </div>
    `;
}

function renderError() {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 bg-zinc-900/50 border border-red-500/20 rounded-2xl">
            <div class="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <i class="fa-solid fa-exclamation-triangle text-xl text-red-400"></i>
            </div>
            <p class="text-zinc-400 text-sm mb-3">Failed to load rewards</p>
            <button onclick="window.RewardsPage.update(true)" class="text-amber-500 hover:text-amber-400 text-sm font-bold">
                Try Again
            </button>
        </div>
    `;
}

// ============================================================================
// MAIN CONTENT
// ============================================================================

function renderContent(claimDetails, grossRewards, boosterData) {
    const container = document.getElementById('rewards-content');
    if (!container) return;

    // Process data
    const details = claimDetails || {};
    const gross = grossRewards || { stakingRewards: 0n, minerRewards: 0n };
    const booster = boosterData || { highestBoost: 0, boostName: 'None', tokenId: 0 };

    const netReward = details.netClaimAmount || 0n;
    const totalReward = details.totalRewards || 0n;
    const feeAmount = details.feeAmount || 0n;

    const feeBips = State.systemFees?.["CLAIM_REWARD_FEE_BIPS"] || 50n;
    const feePercent = Number(feeBips) / 100;
    const boostPercent = booster.highestBoost / 100;
    const effectiveFee = feePercent * (1 - booster.highestBoost / 10000);

    // Savings
    const baseFee = (totalReward * feeBips) / 10000n;
    const savedAmount = baseFee > feeAmount ? baseFee - feeAmount : 0n;

    const hasRewards = netReward > 0n;
    const boosterTokenId = BigInt(booster.tokenId || 0);

    container.innerHTML = `
        <div class="space-y-4">
            
            <!-- CLAIM CARD -->
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                
                <!-- Amount Display -->
                <div class="text-center mb-5">
                    <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Available to Claim</p>
                    <div class="flex items-baseline justify-center gap-2">
                        <span class="text-4xl font-bold text-white font-mono">${formatBigNumber(netReward).toFixed(2)}</span>
                        <span class="text-lg text-amber-400 font-bold">BKC</span>
                    </div>
                </div>

                <!-- Breakdown Pills -->
                <div class="flex flex-wrap justify-center gap-2 mb-5">
                    <span class="px-3 py-1 bg-zinc-800/80 rounded-full text-xs">
                        <span class="text-zinc-500">Gross</span>
                        <span class="text-white font-mono ml-1">${formatBigNumber(totalReward).toFixed(2)}</span>
                    </span>
                    <span class="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs">
                        <span class="text-red-400">Fee</span>
                        <span class="text-red-300 font-mono ml-1">-${formatBigNumber(feeAmount).toFixed(2)}</span>
                    </span>
                    ${savedAmount > 0n ? `
                        <span class="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs">
                            <span class="text-green-400">Saved</span>
                            <span class="text-green-300 font-mono ml-1">+${formatBigNumber(savedAmount).toFixed(2)}</span>
                        </span>
                    ` : ''}
                </div>

                <!-- Claim Button -->
                <button id="claim-btn" 
                    class="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${hasRewards
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-lg shadow-amber-500/20'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }" ${!hasRewards ? 'disabled' : ''}>
                    <i id="claim-btn-icon" class="fa-solid fa-gift"></i>
                    <span id="claim-btn-text">${hasRewards ? 'Claim Rewards' : 'No Rewards Yet'}</span>
                </button>
                
                ${!hasRewards ? `
                    <p class="text-center text-[10px] text-zinc-600 mt-2">
                        <a href="#mine" onclick="window.navigateTo('mine')" class="text-amber-500/70 hover:text-amber-400">Stake BKC</a> to start earning
                    </p>
                ` : ''}
            </div>

            <!-- INFO GRID -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <!-- Booster Card - IMPROVED COMMUNICATION -->
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    ${booster.highestBoost > 0 ? `
                        <!-- HAS BOOSTER -->
                        <div class="flex items-center gap-3 mb-3">
                            <div class="relative w-12 h-12 bg-black/50 rounded-lg border border-cyan-500/30 overflow-hidden flex-shrink-0 shadow-lg shadow-cyan-500/10">
                                <img src="${booster.imageUrl || './assets/bkc_logo_3d.png'}" 
                                     class="w-full h-full object-cover"
                                     onerror="this.src='./assets/bkc_logo_3d.png'">
                                <div class="absolute -top-1 -right-1 bg-cyan-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                    +${boostPercent}%
                                </div>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-white font-bold text-sm truncate">${booster.boostName}</p>
                                <p class="text-[10px] text-cyan-400">
                                    ${booster.source === 'rented' ? '🔗 Rented Booster' : '✓ Your Booster'}
                                </p>
                            </div>
                        </div>
                        <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 text-center">
                            <p class="text-[10px] text-green-400 uppercase">You're Saving</p>
                            <p class="text-green-300 font-bold text-lg font-mono">${boostPercent}%</p>
                            <p class="text-[10px] text-green-400/70">on every claim</p>
                        </div>
                    ` : `
                        <!-- NO BOOSTER - PERSUASIVE -->
                        <div class="text-center">
                            <div class="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-rocket text-2xl text-amber-400"></i>
                            </div>
                            <p class="text-white font-bold text-sm mb-1">Boost Your Rewards!</p>
                            <p class="text-[11px] text-zinc-400 mb-3 leading-relaxed">
                                Get a <span class="text-cyan-400 font-medium">Booster NFT</span> and pay <span class="text-green-400 font-medium">less fees</span> on every claim
                            </p>
                            <div class="bg-zinc-800/50 rounded-lg p-2 mb-3">
                                <div class="flex justify-between text-xs mb-1">
                                    <span class="text-zinc-500">Without Booster</span>
                                    <span class="text-red-400 font-mono">${feePercent.toFixed(2)}% fee</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-zinc-500">With Booster</span>
                                    <span class="text-green-400 font-mono">Up to 50% off!</span>
                                </div>
                            </div>
                            <button onclick="window.navigateTo('store')" 
                                class="w-full py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-lg transition-all shadow-lg shadow-amber-500/20">
                                <i class="fa-solid fa-shopping-cart mr-1"></i> Get Booster NFT
                            </button>
                        </div>
                    `}
                </div>

                <!-- Fee Card -->
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p class="text-[10px] text-zinc-500 uppercase mb-3">Fee Structure</p>
                    <div class="space-y-2">
                        <div class="flex justify-between text-xs">
                            <span class="text-zinc-500">Base Fee</span>
                            <span class="text-white font-mono">${feePercent.toFixed(2)}%</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span class="text-zinc-500">Your Boost</span>
                            <span class="${booster.highestBoost > 0 ? 'text-cyan-400' : 'text-zinc-600'} font-mono">
                                ${booster.highestBoost > 0 ? `-${boostPercent}%` : 'None'}
                            </span>
                        </div>
                        <div class="border-t border-zinc-800 pt-2 mt-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-zinc-400 font-medium">You Pay</span>
                                <span class="${booster.highestBoost > 0 ? 'text-green-400' : 'text-amber-400'} font-mono font-bold">
                                    ${effectiveFee.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                    ${booster.highestBoost === 0 && totalReward > 0n ? `
                        <div class="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p class="text-[10px] text-amber-400 text-center">
                                💡 With a booster you'd save on this claim!
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Sources Breakdown -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p class="text-[10px] text-zinc-500 uppercase mb-3">Reward Sources</p>
                <div class="grid grid-cols-3 gap-3 text-center">
                    <div>
                        <div class="w-8 h-8 mx-auto mb-1.5 bg-purple-500/10 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-layer-group text-purple-400 text-xs"></i>
                        </div>
                        <p class="text-white font-mono text-sm font-bold">${formatBigNumber(gross.stakingRewards).toFixed(2)}</p>
                        <p class="text-[10px] text-zinc-500">Staking</p>
                    </div>
                    <div>
                        <div class="w-8 h-8 mx-auto mb-1.5 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-hammer text-orange-400 text-xs"></i>
                        </div>
                        <p class="text-white font-mono text-sm font-bold">${formatBigNumber(gross.minerRewards).toFixed(2)}</p>
                        <p class="text-[10px] text-zinc-500">Mining</p>
                    </div>
                    <div>
                        <div class="w-8 h-8 mx-auto mb-1.5 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-dice text-cyan-400 text-xs"></i>
                        </div>
                        <p class="text-white font-mono text-sm font-bold">0.00</p>
                        <p class="text-[10px] text-zinc-500">Fortune</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Bind claim button
    const btn = document.getElementById('claim-btn');
    if (btn && hasRewards) {
        btn.onclick = () => handleClaim(gross.stakingRewards, gross.minerRewards, boosterTokenId);
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
    btn.classList.remove('bg-gradient-to-r', 'from-amber-500', 'to-orange-600', 'shadow-lg', 'shadow-amber-500/20');
    btn.classList.add('bg-zinc-700');
    btnText.textContent = 'Processing...';
    btnIcon.className = 'fa-solid fa-spinner fa-spin';

    try {
        const success = await executeUniversalClaim(stakingRewards, minerRewards, boosterTokenId, null);

        if (success) {
            showToast('Rewards claimed successfully!', 'success');
            
            // Force refresh
            lastFetch = 0;
            await RewardsPage.update(true);
        }
    } catch (e) {
        console.error('Claim error:', e);
        showToast('Claim failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        // ALWAYS reset button state
        isProcessing = false;
        
        const btn = document.getElementById('claim-btn');
        const btnText = document.getElementById('claim-btn-text');
        const btnIcon = document.getElementById('claim-btn-icon');
        
        if (btn && btnText && btnIcon) {
            btn.disabled = false;
            btn.classList.add('bg-gradient-to-r', 'from-amber-500', 'to-orange-600', 'shadow-lg', 'shadow-amber-500/20');
            btn.classList.remove('bg-zinc-700');
            btnText.textContent = 'Claim Rewards';
            btnIcon.className = 'fa-solid fa-gift';
        }
    }
}

// Make available globally for error retry
window.RewardsPage = RewardsPage;