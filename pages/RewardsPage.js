// pages/RewardsPage.js

const ethers = window.ethers;

import { DOMElements } from '../dom-elements.js'; 
import { State } from '../state.js';
import { 
    calculateUserTotalRewards, 
    calculateClaimDetails,
    getHighestBoosterBoostFromAPI, 
    safeContractCall 
} from '../modules/data.js'; 
import { executeUniversalClaim } from '../modules/transactions.js'; 
import { 
    formatBigNumber, 
    renderLoading, 
    renderNoData, 
    renderError 
} from '../utils.js';
import { addresses } from '../config.js'; 


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

        // 2. Calcular Recompensas Brutas Separadas
        const totalGrossRewards = await calculateUserTotalRewards();
        
        // 3. Obter Detalhes do Desconto (para exibição)
        const efficiencyData = await getHighestBoosterBoostFromAPI();
        
        // CORREÇÃO: Pega a taxa base do claim (assumindo CLAIM_REWARD_FEE_BIPS está carregado no State)
        const baseClaimFeeBips = State.systemData.claimRewardFeeBips || 0n;
        const baseFeeAmount = (totalRewards * baseClaimFeeBips) / 10000n;
        
        // O valor real economizado
        const calculatedDiscountAmount = baseFeeAmount > feeAmount 
            ? baseFeeAmount - feeAmount 
            : 0n;

        // Renderiza o painel de recompensas
        // REDESENHO: Layout elegante e focado em um único card de resumo
        el.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="bg-main border border-border-color rounded-xl p-5 shadow-inner">
                        <p class="text-zinc-400 text-sm flex items-center gap-2">
                             <i class="fa-solid fa-layer-group text-purple-400"></i> Staking Rewards (Delegator)
                        </p>
                        <p class="text-3xl font-bold text-purple-400 mt-1">${formatBigNumber(totalGrossRewards.stakingRewards).toFixed(4)} $BKC</p>
                    </div>
                     <div class="bg-main border border-border-color rounded-xl p-5 shadow-inner">
                        <p class="text-zinc-400 text-sm flex items-center gap-2">
                            <i class="fa-solid fa-hard-hat text-blue-400"></i> Mining Rewards (PoP)
                        </p>
                        <p class="text-3xl font-bold text-blue-400 mt-1">${formatBigNumber(totalGrossRewards.minerRewards).toFixed(4)} $BKC</p>
                    </div>
                </div>

                <div class="p-5 bg-zinc-700/50 border border-amber-500/30 rounded-xl">
                    <div class="flex justify-between items-center text-lg font-semibold border-b border-zinc-600 pb-2 mb-2">
                        <span>Total Available (Gross):</span>
                        <span class="text-amber-400">${formatBigNumber(totalRewards).toFixed(4)} $BKC</span>
                    </div>

                    <div class="space-y-1">
                        <div class="flex justify-between text-sm text-zinc-400">
                            <span>Base Claim Fee (${basePenaltyPercent.toFixed(2)}%):</span>
                            <span class="${calculatedDiscountAmount > 0n ? 'line-through text-red-400/70' : 'text-red-400'}">-${formatBigNumber(baseFeeAmount).toFixed(4)} $BKC</span>
                        </div>
                        
                        ${efficiencyData.highestBoost > 0n ? 
                            `<div class="flex justify-between font-semibold text-sm text-cyan-400">
                                <span>Booster Discount (${efficiencyData.highestBoost / 100}%):</span>
                                <span>+${formatBigNumber(calculatedDiscountAmount).toFixed(4)} $BKC</span>
                             </div>` : 
                            `<div class="flex justify-between text-sm text-zinc-400">
                                <span>Booster Discount:</span>
                                <span>0.00%</span>
                            </div>`
                        }
                    </div>

                    <div class="flex justify-between font-bold text-2xl pt-3 mt-3 border-t border-zinc-600">
                        <span>NET TO RECEIVE:</span>
                        <span class="${netClaimAmount > 0n ? 'text-green-400' : 'text-zinc-500'}">${formatBigNumber(netClaimAmount).toFixed(4)} $BKC</span>
                    </div>
                </div>
            </div>

            <p class="text-xs text-zinc-500 mt-4 text-center">
                Fees are pooled and distributed to Delegator rewards to reinforce the pStake ecosystem.
            </p>

            <button id="claimAllRewardsBtn" class="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-4 rounded-md text-lg transition-opacity mt-5 ${totalRewards === 0n ? 'btn-disabled' : ''}" ${totalRewards === 0n ? 'disabled' : ''}>
                 <i class="fa-solid fa-gift mr-2"></i> Claim All Rewards Now
            </button>
        `;

        // Adicionar listener de Claim
        document.getElementById('claimAllRewardsBtn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const { stakingRewards, minerRewards } = totalGrossRewards;
            const success = await executeUniversalClaim(stakingRewards, minerRewards, btn);
            if (success) {
                // Força o re-render após a reivindicação
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

            <div id="claimable-rewards-panel" class="mb-8 p-6 bg-sidebar border border-border-color rounded-xl max-w-2xl mx-auto shadow-2xl">
                <h2 class="text-xl font-bold mb-4 text-amber-300">Available Rewards for Claim</h2>
                <div id="rewards-details-content">
                    ${State.isConnected ? renderLoading() : renderNoData(null, "Connect your wallet to view rewards.")}
                </div>
            </div>

            <h2 class="text-xl font-bold mb-4 mt-12">Vesting & Certificates Status</h2>
            <div id="certificates-list-container" class="p-8 bg-sidebar/50 border border-zinc-700 rounded-xl text-center">
                <i class="fa-solid fa-triangle-exclamation text-4xl text-yellow-500 mb-3"></i>
                <h3 class="text-xl font-bold">Vesting Certificates are Deprecated</h3>
                <p class="text-zinc-400 mt-2">This feature has been consolidated or removed from the current protocol architecture.</p>
            </div>
        `;


        if (State.isConnected) {
            // Garante que o usuário tem os dados mais recentes antes de renderizar
            await loadUserData(); 
            await renderClaimPanel();
        }
    },
};