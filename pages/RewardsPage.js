// pages/RewardsPage.js

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

// --- FUNÇÕES DE RENDERIZAÇÃO PRINCIPAL ---

/**
 * Renderiza o painel principal de recompensas e reivindicação.
 */
async function renderClaimPanel() {
    const el = document.getElementById('rewards-details-content');
    const rewardsPanel = document.getElementById('claimable-rewards-panel');

    if (!el || !rewardsPanel) return;

    if (!State.isConnected) {
        rewardsPanel.classList.add('hidden');
        return;
    }
    
    rewardsPanel.classList.remove('hidden');
    
    renderLoading(el); 

    try {
        // 1. Calcular Detalhes da Reivindicação (Net/Fee)
        const claimDetails = await calculateClaimDetails();
        const { totalRewards, netClaimAmount, feeAmount, discountPercent, basePenaltyPercent } = claimDetails;

        // 2. Calcular Recompensas Brutas Separadas (para display detalhado se necessário)
        const totalGrossRewards = await calculateUserTotalRewards();
        
        // 3. Obter Detalhes do Desconto (para exibição)
        const efficiencyData = await getHighestBoosterBoostFromAPI();
        
        // Pega a taxa base do claim (do cache)
        const baseClaimFeeBips = State.systemFees?.["CLAIM_REWARD_FEE_BIPS"] || 0n;
        const baseFeeAmount = (totalRewards * baseClaimFeeBips) / 10000n;
        
        // O valor real economizado
        const calculatedDiscountAmount = baseFeeAmount > feeAmount 
            ? baseFeeAmount - feeAmount 
            : 0n;

        // Renderiza o painel de recompensas
        el.innerHTML = `
            <div class="space-y-6">
                <div class="bg-main border border-border-color rounded-xl p-6 flex items-center justify-between shadow-inner relative overflow-hidden">
                    <div class="relative z-10">
                        <p class="text-zinc-400 text-sm flex items-center gap-2 mb-1">
                             <i class="fa-solid fa-layer-group text-purple-400"></i> Staking Rewards
                        </p>
                        <p class="text-4xl font-bold text-purple-400">${formatBigNumber(totalGrossRewards.stakingRewards).toFixed(4)} <span class="text-lg text-purple-400/70">$BKC</span></p>
                        <p class="text-xs text-zinc-500 mt-1">From Global Consensus Pool</p>
                    </div>
                    <div class="absolute right-0 bottom-0 p-4 opacity-5">
                        <i class="fa-solid fa-coins text-9xl"></i>
                    </div>
                </div>

                <div class="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                    <div class="flex justify-between items-end border-b border-zinc-700 pb-3 mb-3">
                        <span class="text-lg font-semibold text-white">Total Gross:</span>
                        <span class="text-xl font-bold text-amber-400">${formatBigNumber(totalRewards).toFixed(4)} $BKC</span>
                    </div>

                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between items-center">
                            <span class="text-zinc-400">Base Claim Fee (${basePenaltyPercent.toFixed(2)}%):</span>
                            <span class="${calculatedDiscountAmount > 0n ? 'line-through text-red-400/60' : 'text-red-400'}">-${formatBigNumber(baseFeeAmount).toFixed(4)} $BKC</span>
                        </div>
                        
                        ${efficiencyData.highestBoost > 0 ? 
                            `<div class="flex justify-between items-center font-medium text-green-400 bg-green-400/5 p-2 rounded">
                                <span><i class="fa-solid fa-sparkles mr-1"></i> Booster Discount (${efficiencyData.highestBoost / 100}%):</span>
                                <span>+${formatBigNumber(calculatedDiscountAmount).toFixed(4)} $BKC</span>
                             </div>` : 
                            `<div class="flex justify-between items-center text-zinc-500 italic">
                                <span>Booster Discount:</span>
                                <span>0.00% (No Booster)</span>
                            </div>`
                        }
                    </div>

                    <div class="flex justify-between items-center font-bold text-2xl pt-4 mt-4 border-t border-zinc-700">
                        <span class="text-zinc-200">NET TO RECEIVE:</span>
                        <span class="${netClaimAmount > 0n ? 'text-green-400' : 'text-zinc-500'}">${formatBigNumber(netClaimAmount).toFixed(4)} $BKC</span>
                    </div>
                </div>
            </div>

            <p class="text-xs text-zinc-500 mt-4 text-center">
                <i class="fa-solid fa-circle-info mr-1"></i> Claim fees are redistributed to the ecosystem to sustain long-term rewards.
            </p>

            <button id="claimAllRewardsBtn" class="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-4 px-6 rounded-lg text-xl transition-all shadow-lg hover:shadow-amber-500/20 mt-6 ${totalRewards === 0n ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}" ${totalRewards === 0n ? 'disabled' : ''}>
                 <i class="fa-solid fa-gift mr-2"></i> Claim All Rewards
            </button>
        `;

        // Adicionar listener de Claim
        document.getElementById('claimAllRewardsBtn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const { stakingRewards, minerRewards } = totalGrossRewards;
            const success = await executeUniversalClaim(stakingRewards, minerRewards, btn);
            if (success) {
                await RewardsPage.render(true);
            }
        });

    } catch (error) {
        console.error("Error rendering rewards panel:", error);
        renderError(el, "Failed to load rewards data.");
    }
}


export const RewardsPage = {
    hasInitializedListeners: false, 

    async render(isUpdate = false) {
        const contentWrapper = document.getElementById('rewards');
        if (!contentWrapper) return;
        
        contentWrapper.innerHTML = `
            <h1 class="text-2xl md:text-3xl font-bold mb-8">My Rewards Overview</h1>

            <div id="claimable-rewards-panel" class="mb-10 p-1 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-2xl">
                <div class="bg-sidebar border border-border-color rounded-xl p-6 md:p-8 shadow-2xl">
                    <h2 class="text-xl font-bold mb-6 text-amber-300 flex items-center gap-2">
                        <i class="fa-solid fa-sack-dollar"></i> Available Rewards
                    </h2>
                    <div id="rewards-details-content">
                        ${State.isConnected ? renderLoading() : renderNoData("Connect your wallet to view rewards.")}
                    </div>
                </div>
            </div>

            <div class="opacity-70 hover:opacity-100 transition-opacity">
                <h2 class="text-lg font-bold mb-4 text-zinc-400">Legacy Features</h2>
                <div id="certificates-list-container" class="p-6 bg-sidebar/30 border border-dashed border-zinc-700 rounded-xl text-center">
                    <i class="fa-solid fa-clock-rotate-left text-3xl text-zinc-600 mb-3"></i>
                    <h3 class="text-base font-semibold text-zinc-500">Vesting Certificates (Deprecated)</h3>
                    <p class="text-sm text-zinc-600 mt-1">This feature has been consolidated into the Global Staking Pool.</p>
                </div>
            </div>
        `;

        if (State.isConnected) {
            await loadUserData(); 
            await renderClaimPanel();
        }
    }
};