// pages/RewardsPage.js
// ✅ VERSION V8.0: Greed Strategy - Show NET rewards, highlight POTENTIAL gains with Booster

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
    { name: 'Crystal',  boostBips: 1000, discount: 10, color: 'cyan' },
    { name: 'Iron',     boostBips: 2000, discount: 20, color: 'gray' },
    { name: 'Bronze',   boostBips: 3000, discount: 30, color: 'orange' },
    { name: 'Silver',   boostBips: 4000, discount: 40, color: 'slate' },
    { name: 'Gold',     boostBips: 5000, discount: 50, color: 'yellow' },
    { name: 'Platinum', boostBips: 6000, discount: 60, color: 'purple' },
    { name: 'Diamond',  boostBips: 7000, discount: 70, color: 'blue' }
];

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
                        <i class="fa-solid fa-coins text-amber-400"></i> Rewards
                    </h1>
                    <p class="text-xs text-zinc-500 mt-0.5">Your staking earnings</p>
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
    const totalGross = details.totalRewards || 0n;
    const feeAmount = details.feeAmount || 0n;

    // Fee calculations
    const feeBips = State.systemFees?.["CLAIM_REWARD_FEE_BIPS"] || 5000n; // Default 50%
    const feePercent = Number(feeBips) / 100;
    const boostPercent = booster.highestBoost / 100;
    
    // Calculate effective rate (what user keeps)
    const discountBips = booster.highestBoost > 0 ? booster.highestBoost : 0;
    const effectiveFeeBips = Number(feeBips) - (Number(feeBips) * discountBips / 10000);
    const keepPercent = 100 - (effectiveFeeBips / 100);
    
    // Calculate potential with best booster (Diamond = 70% discount)
    const bestDiscount = 70; // Diamond tier
    const potentialKeepPercent = 100 - (feePercent * (1 - bestDiscount / 100));
    const potentialReward = totalGross > 0n ? (totalGross * BigInt(Math.round(potentialKeepPercent * 100))) / 10000n : 0n;
    const extraGain = potentialReward > netReward ? potentialReward - netReward : 0n;
    const gainPercentage = netReward > 0n ? Math.round(Number(extraGain) / Number(netReward) * 100) : bestDiscount;

    const hasRewards = netReward > 0n;
    const hasBooster = booster.highestBoost > 0;
    const boosterTokenId = BigInt(booster.tokenId || 0);

    container.innerHTML = `
        <div class="space-y-4">
            
            <!-- MAIN CLAIM CARD -->
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                
                <!-- Amount Display -->
                <div class="text-center mb-5">
                    <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Your Rewards</p>
                    <div class="flex items-baseline justify-center gap-2">
                        <span class="text-4xl font-bold text-white font-mono">${formatBigNumber(netReward).toFixed(2)}</span>
                        <span class="text-lg text-amber-400 font-bold">BKC</span>
                    </div>
                    <p class="text-xs text-zinc-600 mt-1">
                        You keep <span class="text-green-400 font-medium">${keepPercent.toFixed(1)}%</span> of earned rewards
                    </p>
                </div>

                ${!hasBooster && hasRewards ? `
                    <!-- POTENTIAL GAIN HIGHLIGHT -->
                    <div class="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-5">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-xs text-amber-400 uppercase font-bold mb-1">
                                    <i class="fa-solid fa-rocket mr-1"></i> Unlock More
                                </p>
                                <p class="text-sm text-zinc-300">
                                    With a Booster you'd get:
                                </p>
                            </div>
                            <div class="text-right">
                                <p class="text-2xl font-bold text-green-400 font-mono">${formatBigNumber(potentialReward).toFixed(2)}</p>
                                <p class="text-xs text-green-400">+${gainPercentage}% more!</p>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Claim Button -->
                <button id="claim-btn" 
                    class="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${hasRewards
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-lg shadow-amber-500/20'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }" ${!hasRewards ? 'disabled' : ''}>
                    <i id="claim-btn-icon" class="fa-solid fa-coins"></i>
                    <span id="claim-btn-text">${hasRewards ? `Claim ${formatBigNumber(netReward).toFixed(2)} BKC` : 'No Rewards Yet'}</span>
                </button>
                
                ${!hasRewards ? `
                    <p class="text-center text-[10px] text-zinc-600 mt-2">
                        <a href="#mine" onclick="window.navigateTo('mine')" class="text-amber-500/70 hover:text-amber-400">Stake BKC</a> to start earning
                    </p>
                ` : ''}
            </div>

            <!-- BOOSTER STATUS -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                ${hasBooster ? `
                    <!-- HAS BOOSTER -->
                    <div class="flex items-center gap-4">
                        <div class="relative w-14 h-14 bg-black/50 rounded-xl border-2 border-cyan-500/30 overflow-hidden flex-shrink-0 shadow-lg shadow-cyan-500/10">
                            <img src="${booster.imageUrl || './assets/bkc_logo_3d.png'}" 
                                 class="w-full h-full object-cover"
                                 onerror="this.src='./assets/bkc_logo_3d.png'">
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <p class="text-white font-bold truncate">${booster.boostName}</p>
                                <span class="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-full">
                                    +${boostPercent}%
                                </span>
                            </div>
                            <p class="text-[11px] text-zinc-500 mt-0.5">
                                ${booster.source === 'rented' ? '🔗 Rented Booster' : '✓ Your Booster'}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-zinc-500">You Keep</p>
                            <p class="text-xl font-bold text-green-400">${keepPercent.toFixed(1)}%</p>
                        </div>
                    </div>
                ` : `
                    <!-- NO BOOSTER - CTA -->
                    <div class="text-center py-2">
                        <div class="flex items-center justify-center gap-3 mb-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-gem text-xl text-amber-400"></i>
                            </div>
                            <div class="text-left">
                                <p class="text-white font-bold">Boost Your Earnings!</p>
                                <p class="text-xs text-zinc-400">Keep up to <span class="text-green-400 font-bold">${potentialKeepPercent.toFixed(0)}%</span> with a Diamond Booster</p>
                            </div>
                        </div>
                        
                        <!-- TIER PREVIEW -->
                        <div class="flex justify-center gap-1 mb-3">
                            ${BOOSTER_TIERS.map(tier => `
                                <div class="group relative">
                                    <div class="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 hover:border-amber-500/50 cursor-pointer transition-colors">
                                        ${tier.discount}%
                                    </div>
                                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                        ${tier.name}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="flex gap-2">
                            <button onclick="window.navigateTo('store')" 
                                class="flex-1 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-lg transition-all">
                                <i class="fa-solid fa-shopping-cart mr-1"></i> Buy Booster
                            </button>
                            <button onclick="window.navigateTo('rentals')" 
                                class="flex-1 py-2.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all">
                                <i class="fa-solid fa-handshake mr-1"></i> Rent One
                            </button>
                        </div>
                    </div>
                `}
            </div>

            <!-- SOURCES BREAKDOWN -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p class="text-[10px] text-zinc-500 uppercase mb-3">Reward Sources</p>
                <div class="grid grid-cols-3 gap-3 text-center">
                    <div>
                        <div class="w-9 h-9 mx-auto mb-1.5 bg-purple-500/10 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-layer-group text-purple-400 text-sm"></i>
                        </div>
                        <p class="text-white font-mono text-sm font-bold">${formatBigNumber(gross.stakingRewards).toFixed(2)}</p>
                        <p class="text-[10px] text-zinc-500">Staking</p>
                    </div>
                    <div>
                        <div class="w-9 h-9 mx-auto mb-1.5 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-hammer text-orange-400 text-sm"></i>
                        </div>
                        <p class="text-white font-mono text-sm font-bold">${formatBigNumber(gross.minerRewards).toFixed(2)}</p>
                        <p class="text-[10px] text-zinc-500">Mining</p>
                    </div>
                    <div>
                        <div class="w-9 h-9 mx-auto mb-1.5 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-dice text-cyan-400 text-sm"></i>
                        </div>
                        <p class="text-white font-mono text-sm font-bold">0.00</p>
                        <p class="text-[10px] text-zinc-500">Fortune</p>
                    </div>
                </div>
                
                <!-- Gross vs Net Summary -->
                <div class="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-2 gap-4 text-xs">
                    <div class="text-center">
                        <p class="text-zinc-500">Total Earned</p>
                        <p class="text-white font-mono font-bold">${formatBigNumber(totalGross).toFixed(4)} BKC</p>
                    </div>
                    <div class="text-center">
                        <p class="text-zinc-500">You Receive</p>
                        <p class="text-green-400 font-mono font-bold">${formatBigNumber(netReward).toFixed(4)} BKC</p>
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
            lastFetch = 0;
            await RewardsPage.update(true);
        }
    } catch (e) {
        console.error('Claim error:', e);
        showToast('Claim failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
        
        const btn = document.getElementById('claim-btn');
        const btnText = document.getElementById('claim-btn-text');
        const btnIcon = document.getElementById('claim-btn-icon');
        
        if (btn && btnText && btnIcon) {
            btn.disabled = false;
            btn.classList.add('bg-gradient-to-r', 'from-amber-500', 'to-orange-600', 'shadow-lg', 'shadow-amber-500/20');
            btn.classList.remove('bg-zinc-700');
            btnText.textContent = 'Claim Rewards';
            btnIcon.className = 'fa-solid fa-coins';
        }
    }
}

// Global reference
window.RewardsPage = RewardsPage;