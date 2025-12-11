// pages/RewardsPage.js
// ✅ VERSION V6.0: Clean UI, Mobile-First, V2.1 Compatible

const ethers = window.ethers;

import { DOMElements } from '../dom-elements.js';
import { State } from '../state.js';
import {
    calculateUserTotalRewards,
    calculateClaimDetails,
    getHighestBoosterBoostFromAPI,
    loadUserData
} from '../modules/data.js';
import { executeUniversalClaim } from '../modules/transactions.js';
import {
    formatBigNumber,
    renderLoading,
    renderNoData,
    renderError
} from '../utils.js';
import { showToast } from '../ui-feedback.js';

// --- LOCAL STATE ---
let lastRewardsFetch = 0;
let isRewardsLoading = false;

// ============================================================================
// 1. MAIN RENDER
// ============================================================================

export const RewardsPage = {
    async render(isNewPage) {
        const container = document.getElementById('rewards');
        if (!container) return;

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div class="max-w-4xl mx-auto py-6 px-4">
                    
                    <!-- HEADER -->
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h1 class="text-xl font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-gift text-amber-400"></i> Rewards
                            </h1>
                            <p class="text-xs text-zinc-500 mt-0.5">Claim your staking earnings</p>
                        </div>
                        <div id="rewards-last-update" class="text-[10px] text-zinc-600 font-mono"></div>
                    </div>

                    <!-- CONTENT -->
                    <div id="rewards-content-area" class="min-h-[300px]">
                        ${renderLoading()}
                    </div>

                    <!-- LEGACY VAULT (collapsed) -->
                    <details class="mt-8 group">
                        <summary class="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400 flex items-center gap-2">
                            <i class="fa-solid fa-box-archive"></i> Legacy Vault
                            <i class="fa-solid fa-chevron-down text-[10px] group-open:rotate-180 transition-transform"></i>
                        </summary>
                        <div class="mt-3 p-4 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl">
                            <p class="text-xs text-zinc-600 text-center">Vesting Certificates have been migrated to the Global Staking Pool.</p>
                        </div>
                    </details>
                </div>
            `;
        }

        if (State.isConnected) {
            await this.update(isNewPage);
        } else {
            renderNotConnected();
        }
    },

    async update(forceRefresh = false) {
        if (!State.isConnected) return;

        const contentArea = document.getElementById('rewards-content-area');
        const updateLabel = document.getElementById('rewards-last-update');
        const now = Date.now();

        // 1 minute cache
        if (!forceRefresh && !isRewardsLoading && (now - lastRewardsFetch < 60000)) {
            if (contentArea && !contentArea.innerHTML.includes('loader')) return;
        }

        isRewardsLoading = true;
        if (updateLabel) updateLabel.textContent = "Syncing...";

        try {
            await loadUserData();

            const [claimDetails, totalGrossRewards, boosterData] = await Promise.all([
                calculateClaimDetails(),
                calculateUserTotalRewards(),
                getHighestBoosterBoostFromAPI()
            ]);

            const boosterTokenId = BigInt(boosterData.tokenId || 0);
            renderRewardsUI(contentArea, claimDetails, totalGrossRewards, boosterData, boosterTokenId);

            lastRewardsFetch = now;
            if (updateLabel) updateLabel.textContent = `Updated ${new Date().toLocaleTimeString()}`;

        } catch (e) {
            console.error("Rewards Update Error:", e);
            if (contentArea) contentArea.innerHTML = renderError("Unable to load rewards data.");
        } finally {
            isRewardsLoading = false;
        }
    }
};

// ============================================================================
// 2. NOT CONNECTED STATE
// ============================================================================

function renderNotConnected() {
    const content = document.getElementById('rewards-content-area');
    if (!content) return;

    content.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-xl text-zinc-600"></i>
            </div>
            <p class="text-zinc-500 text-sm mb-3">Connect wallet to view earnings</p>
            <button onclick="window.openConnectModal()" class="text-amber-500 hover:text-amber-400 text-sm font-bold">
                Connect Now
            </button>
        </div>
    `;
}

// ============================================================================
// 3. REWARDS UI
// ============================================================================

function renderRewardsUI(container, claimDetails, grossRewards, boosterData, boosterTokenId) {
    if (!container) return;

    // Data Processing
    const details = claimDetails || {};
    const gross = grossRewards || { stakingRewards: 0n, minerRewards: 0n };
    const booster = boosterData || { highestBoost: 0, boostName: 'None' };

    const netReward = details.netClaimAmount || 0n;
    const totalReward = details.totalRewards || 0n;
    const feeAmount = details.feeAmount || 0n;

    const feeBips = State.systemFees?.["CLAIM_REWARD_FEE_BIPS"] || 50n;
    const feePercent = Number(feeBips) / 100;

    // Savings calculation
    const baseFeeVal = (totalReward * feeBips) / 10000n;
    const savedAmount = baseFeeVal > feeAmount ? baseFeeVal - feeAmount : 0n;

    const hasRewards = netReward > 0n;

    container.innerHTML = `
        <div class="space-y-4">
            
            <!-- MAIN CLAIM CARD -->
            <div class="glass-panel p-5 rounded-xl relative overflow-hidden">
                <!-- Background glow -->
                <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                
                <div class="relative z-10">
                    <!-- Net Claimable -->
                    <div class="mb-6">
                        <p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Net Claimable</p>
                        <div class="flex items-baseline gap-2">
                            <span class="text-4xl font-black text-white">
                                ${formatBigNumber(netReward).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>
                            <span class="text-lg font-bold text-amber-500">BKC</span>
                        </div>
                    </div>

                    <!-- Breakdown -->
                    <div class="flex flex-wrap gap-2 mb-6">
                        <div class="bg-zinc-800/50 px-3 py-1.5 rounded-lg text-xs">
                            <span class="text-zinc-500">Gross:</span>
                            <span class="text-white font-mono ml-1">${formatBigNumber(totalReward).toFixed(4)}</span>
                        </div>
                        <div class="bg-red-500/10 px-3 py-1.5 rounded-lg text-xs border border-red-500/20">
                            <span class="text-red-400">Fee:</span>
                            <span class="text-red-300 font-mono ml-1">-${formatBigNumber(feeAmount).toFixed(4)}</span>
                        </div>
                        ${savedAmount > 0n ? `
                            <div class="bg-green-500/10 px-3 py-1.5 rounded-lg text-xs border border-green-500/20">
                                <span class="text-green-400">Saved:</span>
                                <span class="text-green-300 font-mono ml-1">+${formatBigNumber(savedAmount).toFixed(4)}</span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Claim Button -->
                    <button id="claim-btn-action" 
                        class="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${hasRewards
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }"
                        ${!hasRewards ? 'disabled' : ''}>
                        <i class="fa-solid fa-gift"></i>
                        <span>${hasRewards ? 'Claim to Wallet' : 'No Rewards Yet'}</span>
                    </button>
                    ${!hasRewards ? '<p class="text-center text-[10px] text-zinc-600 mt-2">Stake BKC to start earning</p>' : ''}
                </div>
            </div>

            <!-- INFO CARDS ROW -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <!-- BOOSTER CARD -->
                <div class="glass-panel p-4 rounded-xl">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="relative w-12 h-12 bg-black/40 rounded-lg border border-zinc-700 flex-shrink-0 overflow-hidden">
                            <img src="${booster.imageUrl || './assets/bkc_logo_3d.png'}" 
                                class="w-full h-full object-cover" 
                                onerror="this.src='./assets/bkc_logo_3d.png'">
                            <div class="absolute bottom-0 right-0 bg-cyan-500 text-black text-[8px] font-bold px-1 rounded-tl">
                                +${(booster.highestBoost / 100)}%
                            </div>
                        </div>
                        <div class="min-w-0">
                            <p class="text-white font-bold text-sm truncate">${booster.boostName || 'No Booster'}</p>
                            <p class="text-[10px] ${booster.highestBoost > 0 ? 'text-green-400' : 'text-zinc-500'}">
                                ${booster.source === 'rented' ? '🔗 Rented' : (booster.source === 'owned' ? '✓ Active' : '○ Inactive')}
                            </p>
                        </div>
                    </div>

                    <div class="space-y-1.5 text-xs">
                        <div class="flex justify-between p-2 bg-zinc-800/50 rounded">
                            <span class="text-zinc-500">Base Fee</span>
                            <span class="text-white font-mono">${feePercent.toFixed(2)}%</span>
                        </div>
                        <div class="flex justify-between p-2 bg-green-500/10 rounded border border-green-500/10">
                            <span class="text-green-400">Boost Savings</span>
                            <span class="text-green-300 font-mono">${formatBigNumber(savedAmount).toFixed(4)} BKC</span>
                        </div>
                    </div>

                    ${booster.highestBoost === 0 ? `
                        <button onclick="window.navigateTo('store')" 
                            class="w-full mt-3 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
                            Get Booster
                        </button>
                    ` : ''}
                </div>

                <!-- SOURCES CARD -->
                <div class="glass-panel p-4 rounded-xl">
                    <h3 class="text-xs font-bold text-zinc-400 uppercase mb-3 flex items-center gap-1.5">
                        <i class="fa-solid fa-chart-pie text-blue-400"></i> Sources
                    </h3>

                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between items-center">
                            <span class="text-zinc-400 flex items-center gap-1.5">
                                <i class="fa-solid fa-layer-group text-purple-400 text-xs"></i> Staking
                            </span>
                            <span class="text-white font-mono">${formatBigNumber(gross.stakingRewards).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-zinc-400 flex items-center gap-1.5">
                                <i class="fa-solid fa-dice text-cyan-400 text-xs"></i> Fortune
                            </span>
                            <span class="text-white font-mono">0.00</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-zinc-400 flex items-center gap-1.5">
                                <i class="fa-solid fa-hammer text-orange-400 text-xs"></i> Mining
                            </span>
                            <span class="text-white font-mono">${formatBigNumber(gross.minerRewards).toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center">
                        <span class="text-xs font-bold text-zinc-400">Total Gross</span>
                        <span class="text-amber-400 font-bold font-mono">${formatBigNumber(totalReward).toFixed(2)} BKC</span>
                    </div>
                </div>
            </div>

            <!-- QUICK STATS -->
            <div class="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                <div class="flex-shrink-0 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 min-w-[120px]">
                    <p class="text-[10px] text-zinc-500 uppercase">Fee Rate</p>
                    <p class="text-white font-bold">${feePercent.toFixed(2)}%</p>
                </div>
                <div class="flex-shrink-0 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 min-w-[120px]">
                    <p class="text-[10px] text-zinc-500 uppercase">Boost</p>
                    <p class="text-cyan-400 font-bold">+${(booster.highestBoost / 100).toFixed(0)}%</p>
                </div>
                <div class="flex-shrink-0 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 min-w-[120px]">
                    <p class="text-[10px] text-zinc-500 uppercase">Effective Fee</p>
                    <p class="text-green-400 font-bold">${(feePercent * (1 - booster.highestBoost / 10000)).toFixed(2)}%</p>
                </div>
            </div>
        </div>
    `;

    // Bind Claim Button
    const btn = document.getElementById('claim-btn-action');
    if (btn && hasRewards) {
        btn.onclick = async () => {
            const { stakingRewards, minerRewards } = gross;
            await handleClaimClick(btn, stakingRewards, minerRewards, boosterTokenId);
        };
    }
}

// ============================================================================
// 4. CLAIM HANDLER
// ============================================================================

async function handleClaimClick(btn, stakingRewards, minerRewards, boosterTokenId) {
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="loader inline-block w-4 h-4"></div> Processing...';
    btn.classList.remove('bg-gradient-to-r', 'from-amber-500', 'to-orange-600');
    btn.classList.add('bg-zinc-700');

    try {
        const success = await executeUniversalClaim(stakingRewards, minerRewards, boosterTokenId, btn);
        if (success) {
            showToast("Rewards claimed successfully!", "success");
            await RewardsPage.update(true);
        }
    } catch (e) {
        console.error(e);
        showToast("Claim failed.", "error");
        btn.disabled = false;
        btn.innerHTML = originalContent;
        btn.classList.add('bg-gradient-to-r', 'from-amber-500', 'to-orange-600');
        btn.classList.remove('bg-zinc-700');
    }
}