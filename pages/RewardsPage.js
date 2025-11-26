// pages/RewardsPage.js
// ✅ VERSÃO REDESENHADA: UI Premium + Proteção Anti-Crash

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

// --- Local State ---
let lastRewardsFetch = 0;
let isRewardsLoading = false;

// ============================================================================
// 1. RENDERIZAÇÃO ESTRUTURAL (LAYOUT)
// ============================================================================

export const RewardsPage = {
    async render(isNewPage) {
        const container = document.getElementById('rewards');
        if (!container) return;

        // Layout Inicial (Esqueleto)
        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div class="flex flex-col gap-8 animate-fadeIn pb-12">
                    
                    <div class="flex flex-col md:flex-row justify-between items-end gap-4">
                        <div>
                            <h1 class="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <span class="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500">My Rewards</span>
                            </h1>
                            <p class="text-zinc-400 text-sm max-w-xl">
                                Track and claim your earnings from the ecosystem. Fees are redistributed to sustain the protocol.
                            </p>
                        </div>
                        <div id="rewards-last-update" class="text-xs text-zinc-600 font-mono"></div>
                    </div>

                    <div id="rewards-content-area" class="min-h-[300px]">
                        ${renderLoading()}
                    </div>

                    <div class="mt-8 pt-8 border-t border-zinc-800/50 opacity-60 hover:opacity-100 transition-opacity">
                        <div class="flex items-center gap-3 mb-4">
                            <i class="fa-solid fa-box-archive text-zinc-600"></i>
                            <h3 class="text-sm font-bold text-zinc-500 uppercase tracking-wider">Legacy Vault</h3>
                        </div>
                        <div id="certificates-list-container" class="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl p-4 text-center">
                            <p class="text-xs text-zinc-600">Vesting Certificates have been migrated to the Global Staking Pool.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // Lógica de Carregamento
        if (State.isConnected) {
            await this.update(isNewPage);
        } else {
            const content = document.getElementById('rewards-content-area');
            if(content) content.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <i class="fa-solid fa-wallet text-4xl text-zinc-700 mb-4"></i>
                    <p class="text-zinc-500">Connect your wallet to view your earnings.</p>
                    <button onclick="window.openConnectModal()" class="mt-4 text-amber-500 hover:text-white text-sm font-bold underline">Connect Now</button>
                </div>
            `;
        }
    },

    async update(forceRefresh = false) {
        if (!State.isConnected) return;

        const contentArea = document.getElementById('rewards-content-area');
        const updateLabel = document.getElementById('rewards-last-update');
        const now = Date.now();

        // Cache de 1 minuto para evitar spam de RPC, exceto se forçado
        if (!forceRefresh && !isRewardsLoading && (now - lastRewardsFetch < 60000)) {
            // Se já tem conteúdo, não faz nada. Se está vazio, carrega.
            if (contentArea && contentArea.innerHTML.includes('loader')) {
                // Passa para o fetch
            } else {
                return; 
            }
        }

        isRewardsLoading = true;
        if (updateLabel) updateLabel.innerText = "Syncing...";

        try {
            // Carrega dados em paralelo
            await loadUserData(); // Garante pStake atualizado
            
            const [claimDetails, totalGrossRewards, boosterData] = await Promise.all([
                calculateClaimDetails(),
                calculateUserTotalRewards(),
                getHighestBoosterBoostFromAPI()
            ]);

            // Renderiza a UI com os dados frescos
            renderRewardsUI(contentArea, claimDetails, totalGrossRewards, boosterData);

            lastRewardsFetch = now;
            if (updateLabel) updateLabel.innerText = `Updated: ${new Date().toLocaleTimeString()}`;

        } catch (e) {
            console.error("Rewards Update Error:", e);
            if(contentArea) contentArea.innerHTML = renderError("Unable to load rewards data.");
        } finally {
            isRewardsLoading = false;
        }
    }
};

// ============================================================================
// 2. COMPONENTES DE UI (REDESENHADOS)
// ============================================================================

function renderRewardsUI(container, claimDetails, grossRewards, boosterData) {
    if (!container) return;

    // --- 1. TRATAMENTO DE DADOS (SEGURANÇA) ---
    // Garante que nada seja undefined antes de formatar
    const details = claimDetails || {};
    const gross = grossRewards || { stakingRewards: 0n, minerRewards: 0n };
    const booster = boosterData || { highestBoost: 0, boostName: 'None' };

    const netReward = details.netClaimAmount || 0n;
    const totalReward = details.totalRewards || 0n;
    const feeAmount = details.feeAmount || 0n;
    
    const feeBips = State.systemFees?.["CLAIM_REWARD_FEE_BIPS"] || 50n;
    const feePercent = Number(feeBips) / 100;

    // Cálculos de Economia
    // Se não tivesse booster, a taxa seria cheia. Quanto economizou?
    // Taxa Cheia = Total * (BaseFee / 10000)
    // Taxa Paga = feeAmount
    // Economia = Taxa Cheia - Taxa Paga
    const baseFeeVal = (totalReward * feeBips) / 10000n;
    const savedAmount = baseFeeVal > feeAmount ? baseFeeVal - feeAmount : 0n;
    
    const hasRewards = netReward > 0n;

    // --- 2. CONSTRUÇÃO DO HTML ---
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div class="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-700 shadow-2xl group">
                <div class="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                <div class="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                
                <div class="relative z-10 p-8 flex flex-col justify-between h-full">
                    <div>
                        <div class="flex justify-between items-start">
                            <div>
                                <h2 class="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Net Claimable</h2>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">
                                        ${formatBigNumber(netReward).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                    </span>
                                    <span class="text-xl font-bold text-amber-500">BKC</span>
                                </div>
                            </div>
                            <div class="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50 backdrop-blur-md">
                                <i class="fa-solid fa-wallet text-2xl text-zinc-500"></i>
                            </div>
                        </div>
                        
                        <div class="mt-6 flex items-center gap-4 text-sm">
                            <div class="px-3 py-1.5 rounded-md bg-zinc-800/80 border border-zinc-700 text-zinc-300">
                                <span class="text-zinc-500 mr-2">Gross:</span>
                                <span class="font-mono font-bold">${formatBigNumber(totalReward).toFixed(4)}</span>
                            </div>
                            <div class="px-3 py-1.5 rounded-md bg-red-900/20 border border-red-900/30 text-red-300">
                                <span class="text-red-400/70 mr-2">Fee:</span>
                                <span class="font-mono font-bold">-${formatBigNumber(feeAmount).toFixed(4)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="mt-10">
                        <button id="claim-btn-action" 
                            class="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 ${hasRewards ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black hover:shadow-amber-500/20' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}"
                            ${!hasRewards ? 'disabled' : ''}>
                            <i class="fa-solid fa-gift text-xl"></i> 
                            <span>${hasRewards ? 'Claim to Wallet' : 'No Rewards Yet'}</span>
                        </button>
                        ${!hasRewards ? '<p class="text-center text-xs text-zinc-600 mt-2">Delegate more BKC to start earning.</p>' : ''}
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                
                <div class="bg-zinc-900/60 border border-zinc-700 rounded-2xl p-6 relative overflow-hidden">
                    <h3 class="text-sm font-bold text-zinc-400 uppercase mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-rocket text-purple-400"></i> Efficiency
                    </h3>
                    
                    <div class="flex items-center gap-4 mb-4">
                        <div class="relative w-16 h-16 bg-black/40 rounded-xl border border-zinc-700 flex-shrink-0">
                            <img src="${booster.imageUrl || './assets/bkc_logo_3d.png'}" class="w-full h-full object-cover rounded-xl" onerror="this.src='./assets/bkc_logo_3d.png'">
                            <div class="absolute -bottom-2 -right-2 bg-zinc-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                                +${(booster.highestBoost / 100)}%
                            </div>
                        </div>
                        <div>
                            <div class="text-white font-bold text-sm">${booster.boostName}</div>
                            <div class="text-xs text-zinc-500 mt-1">Status: <span class="${booster.highestBoost > 0 ? 'text-green-400' : 'text-zinc-500'}">${booster.source === 'rented' ? 'Rented' : (booster.source === 'owned' ? 'Active' : 'Inactive')}</span></div>
                        </div>
                    </div>

                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center p-2 rounded bg-zinc-800/50">
                            <span class="text-zinc-400">Base Fee</span>
                            <span class="text-white font-mono">${feePercent.toFixed(2)}%</span>
                        </div>
                        <div class="flex justify-between items-center p-2 rounded bg-green-900/10 border border-green-500/10">
                            <span class="text-green-400">Booster Save</span>
                            <span class="text-green-300 font-mono font-bold">+${formatBigNumber(savedAmount).toFixed(4)} BKC</span>
                        </div>
                    </div>
                    
                    ${booster.highestBoost === 0 ? 
                        `<button class="w-full mt-4 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors" onclick="window.navigateTo('store')">Buy Booster</button>` 
                        : ''}
                </div>

                <div class="bg-zinc-900/60 border border-zinc-700 rounded-2xl p-6">
                    <h3 class="text-sm font-bold text-zinc-400 uppercase mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-chart-pie text-blue-400"></i> Sources
                    </h3>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-zinc-300">Staking Pool</span>
                            <span class="text-sm font-mono text-white">${formatBigNumber(gross.stakingRewards).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-zinc-300">Fortune Wins</span>
                            <span class="text-sm font-mono text-white">0.00</span>
                        </div>
                         <div class="h-px bg-zinc-800 my-2"></div>
                         <div class="flex justify-between items-center">
                            <span class="text-sm font-bold text-zinc-400">Total Gross</span>
                            <span class="text-sm font-mono font-bold text-amber-400">${formatBigNumber(totalReward).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

    // Bind Claim Button
    const btn = document.getElementById('claim-btn-action');
    if (btn && hasRewards) {
        btn.onclick = async () => {
            const { stakingRewards, minerRewards } = gross;
            await handleClaimClick(btn, stakingRewards, minerRewards);
        };
    }
}

async function handleClaimClick(btn, stakingRewards, minerRewards) {
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="loader inline-block"></div> Processing...';
    btn.classList.remove('bg-gradient-to-r');
    btn.classList.add('bg-zinc-700');

    try {
        const success = await executeUniversalClaim(stakingRewards, minerRewards, btn);
        if (success) {
            showToast("Rewards claimed successfully!", "success");
            // Recarrega forçado
            await RewardsPage.update(true);
        }
    } catch (e) {
        console.error(e);
        showToast("Claim failed.", "error");
        btn.disabled = false;
        btn.innerHTML = originalContent;
        btn.classList.add('bg-gradient-to-r');
    }
}