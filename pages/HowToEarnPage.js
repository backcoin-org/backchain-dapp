// pages/HowToEarnPage.js

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { renderLoading, renderError } from '../utils.js';
import { loadPublicData, loadUserData, getHighestBoosterBoostFromAPI } from '../modules/data.js';

let dataLoaded = false;

// Configurações de BIPS para ilustrar, se o State.systemFees não estiver pronto
const FALLBACK_BIPS = {
    // Valores baseados no seu último rules-config.json
    TREASURY_MINING: 2000n, // 20%
    DELEGATOR_MINING: 8000n, // 80%
    TREASURY_FEES: 5000n, // 50%
    DELEGATOR_FEES: 5000n, // 50%
    CLAIM_FEE: 3000n, // 30%
    MAX_BOOST_BIPS: 5000n, // Diamond
};

// --- SIMULAÇÃO E CÁLCULO ---

function getDistributionBips() {
    const s = State.systemFees;
    
    // As chaves são case-sensitive e vêm do EcosystemManager (via data.js)
    const miningDelegator = s?.miningDistribution?.DELEGATOR_POOL || FALLBACK_BIPS.DELEGATOR_MINING;
    const miningTreasury = s?.miningDistribution?.TREASURY || FALLBACK_BIPS.TREASURY_MINING;
    const feeDelegator = s?.feeDistribution?.DELEGATOR_POOL || FALLBACK_BIPS.DELEGATOR_FEES;
    const feeTreasury = s?.feeDistribution?.TREASURY || FALLBACK_BIPS.TREASURY_FEES;
    const baseClaimFee = s?.stakingFees?.CLAIM_REWARD_FEE_BIPS || FALLBACK_BIPS.CLAIM_FEE;

    return { miningDelegator, miningTreasury, feeDelegator, feeTreasury, baseClaimFee };
}

function calculateBoosterSavings(boosterData) {
    const { baseClaimFee } = getDistributionBips();
    
    // 1. Obter desconto do Booster (BIPS)
    let discountBips = State.boosterDiscounts?.[boosterData.highestBoost] || 0n;
    
    // 2. Calcular Taxa Final e Desconto
    const initialFee = Number(baseClaimFee); // 3000 BIPS = 30%
    const finalFeeBips = initialFee > Number(discountBips) ? BigInt(initialFee) - discountBips : 0n;
    
    // 3. Formatar valores para exibição
    const initialFeePercent = (initialFee / 100).toFixed(1);
    const finalFeePercent = (Number(finalFeeBips) / 100).toFixed(1);
    const discountPercent = (Number(discountBips) / 100).toFixed(1);

    return {
        initialFeePercent,
        finalFeePercent,
        discountPercent,
        boostName: boosterData.boostName,
        hasBooster: boosterData.highestBoost > 0,
        boostBips: boosterData.highestBoost
    };
}


// --- RENDERIZAÇÃO ---

async function renderHowToEarnContent() {
    const container = DOMElements.howToEarn.querySelector('#how-to-earn-content');
    if (!container) return;

    if (!dataLoaded) {
        renderLoading(container);
        return;
    }
    
    const { miningDelegator, miningTreasury, feeDelegator, feeTreasury, baseClaimFee } = getDistributionBips();
    const boosterData = await getHighestBoosterBoostFromAPI();
    const savings = calculateBoosterSavings(boosterData);
    
    // Conversão de BIPS para porcentagem para exibição
    const miningDelegatorPercent = (Number(miningDelegator) / 100).toFixed(1);
    const miningTreasuryPercent = (Number(miningTreasury) / 100).toFixed(1);
    const feeDelegatorPercent = (Number(feeDelegator) / 100).toFixed(1);
    const feeTreasuryPercent = (Number(feeTreasury) / 100).toFixed(1);


    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-12">
            <header class="text-center">
                <h1 class="text-4xl font-extrabold text-white mb-2">Como Você Ganha na Backchain?</h1>
                <p class="text-zinc-400 text-lg">Seus ganhos vêm de duas fontes: Novos Tokens (Mineração) e Taxas Pagas pelo Ecossistema (Fees).</p>
                <p class="text-purple-400 font-semibold mt-2">Sua fatia depende do seu <strong class="text-amber-400">pStake</strong> em relação ao total da rede.</p>
            </header>

            <div class="grid md:grid-cols-2 gap-8">
                
                <div class="bg-zinc-800/50 border border-purple-500/30 rounded-xl p-6 shadow-xl">
                    <h3 class="text-2xl font-bold text-white mb-3 flex items-center">
                        <i class="fa-solid fa-gem mr-3 text-cyan-400"></i> 1. Mineração (Novos Tokens)
                    </h3>
                    <p class="text-zinc-400 mb-4">
                        Toda taxa paga em BKC na plataforma (exceto staking) gera novos tokens via nosso mecanismo de Proof-of-Purchase (PoP). Esses novos tokens são divididos assim:
                    </p>
                    <ul class="space-y-2 text-lg">
                        <li class="flex justify-between items-center bg-zinc-700/50 p-2 rounded">
                            <span>Delegadores (Você)</span>
                            <span class="font-extrabold text-green-400">${miningDelegatorPercent}%</span>
                        </li>
                        <li class="flex justify-between items-center bg-zinc-700/50 p-2 rounded">
                            <span>Tesouraria do Protocolo</span>
                            <span class="font-extrabold text-red-400">${miningTreasuryPercent}%</span>
                        </li>
                    </ul>
                    <p class="text-sm text-zinc-500 mt-4">
                        *Regra: ${Number(miningDelegator) + Number(miningTreasury)} BIPS total (${(Number(miningDelegator) + Number(miningTreasury)) / 100}%)
                    </p>
                </div>

                <div class="bg-zinc-800/50 border border-purple-500/30 rounded-xl p-6 shadow-xl">
                    <h3 class="text-2xl font-bold text-white mb-3 flex items-center">
                        <i class="fa-solid fa-sack-dollar mr-3 text-amber-400"></i> 2. Taxas do Ecossistema (Fees)
                    </h3>
                    <p class="text-zinc-400 mb-4">
                        As taxas originais pagas por serviços como o Cartório Descentralizado ou a taxa de 'unstake' são distribuídas. Você ganha uma fatia proporcional à sua participação.
                    </p>
                    <ul class="space-y-2 text-lg">
                        <li class="flex justify-between items-center bg-zinc-700/50 p-2 rounded">
                            <span>Delegadores (Você)</span>
                            <span class="font-extrabold text-green-400">${feeDelegatorPercent}%</span>
                        </li>
                        <li class="flex justify-between items-center bg-zinc-700/50 p-2 rounded">
                            <span>Tesouraria do Protocolo</span>
                            <span class="font-extrabold text-red-400">${feeTreasuryPercent}%</span>
                        </li>
                    </ul>
                    <p class="text-sm text-zinc-500 mt-4">
                        *Regra: ${Number(feeDelegator) + Number(feeTreasury)} BIPS total (${(Number(feeDelegator) + Number(feeTreasury)) / 100}%)
                    </p>
                </div>
            </div>

            <div class="pt-8 border-t border-zinc-700/50">
                <h2 class="text-3xl font-extrabold text-amber-400 text-center mb-6 flex items-center justify-center">
                    <i class="fa-solid fa-rocket mr-3"></i> O Poder do Booster NFT
                </h2>
                <p class="text-center text-zinc-400 max-w-2xl mx-auto mb-6">
                    O Booster NFT não aumenta sua fatia das recompensas, mas sim o seu <strong class="text-white">Lucro Líquido</strong>, aplicando um desconto direto nas taxas e penalidades que você paga ao usar ou sair do sistema.
                </p>

                <div class="bg-zinc-800 border border-amber-500/50 rounded-xl p-6 grid md:grid-cols-2 gap-6 items-center">
                    <div class="space-y-4">
                        <h4 class="text-xl font-bold text-white">${savings.hasBooster ? `Seu Booster Ativo: ${savings.boostName}` : 'Simulação: Benefício Máximo (Diamond)'}</h4>
                        
                        <p class="text-zinc-300">
                            A Taxa Base de Resgate de Recompensas é de <strong class="text-red-400">${savings.initialFeePercent}%</strong>. Seu NFT de Booster aplica um desconto.
                        </p>

                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-zinc-400">Desconto Máximo Aplicável:</span>
                                <span class="font-bold text-cyan-400">-${savings.discountPercent}%</span>
                            </div>
                            <div class="flex justify-between border-t border-zinc-700 pt-2">
                                <span class="text-white font-semibold">Taxa Final de Resgate:</span>
                                <span class="font-extrabold text-green-400">${savings.finalFeePercent}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center border-l border-zinc-700 md:pl-6 pt-4 md:pt-0">
                        <img src="${boosterData.imageUrl || './assets/bkc_logo_3d.png'}" alt="Booster NFT" class="w-24 h-24 mx-auto rounded-md object-cover border border-zinc-700 mb-3">
                        ${savings.hasBooster ? 
                            `<p class="text-green-400 font-bold">Você tem um Booster ativo!</p>` : 
                            `<button onclick="window.navigateToPage('presale')" class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2 px-4 rounded-lg transition-colors mt-2">
                                Adquira seu Booster Agora
                            </button>`
                        }
                    </div>
                </div>
            </div>
            
            <div class="text-center pt-8 border-t border-zinc-700/50">
                <h3 class="text-2xl font-bold text-white mb-2">Resumo: Estratégia de Ganhos</h3>
                <p class="text-zinc-400 max-w-xl mx-auto">
                    Para maximizar, delegue (Stake) o máximo possível com o maior tempo de bloqueio (aumenta o pStake) e utilize um Booster NFT para reduzir as taxas e aumentar o lucro líquido ao resgatar.
                </p>
                <button onclick="window.navigateToPage('mine')" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-lg mt-4">
                    Começar a Delegar Agora <i class="fa-solid fa-coins ml-2"></i>
                </button>
            </div>
        </div>
    `;
}

export const HowToEarnPage = {
    async render(isUpdate = false) {
        DOMElements.howToEarn = DOMElements.howToEarn || document.getElementById('how-to-earn');
        if (!DOMElements.howToEarn) return;

        // Renderiza a estrutura inicial
        DOMElements.howToEarn.innerHTML = `
            <div class="container max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div id="how-to-earn-content">
                    ${renderLoading()}
                </div>
            </div>
        `;

        try {
            // Garante que os dados públicos (incluindo fees) e os dados do usuário (boosters) estejam carregados
            if (!isUpdate) { 
                await loadPublicData(); 
                if (State.isConnected) {
                    await loadUserData();
                }
            } else if (State.isConnected) {
                 await loadUserData(); // Atualiza dados do usuário em re-render
            }
            dataLoaded = true;
            await renderHowToEarnContent();
        } catch (e) {
            console.error("Error rendering HowToEarnPage:", e);
            renderError(container, "Não foi possível carregar as regras da plataforma para simulação.");
        }
    }
};

// Adicione esta página ao seu arquivo app.js na seção routes:
// routes['howtoearn'] = HowToEarnPage;