// pages/StorePage.js

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
// Importa loadUserData para checar o pStake e safeContractCall
import { loadUserData, loadMyBoosters, safeContractCall } from '../modules/data.js';
import { executeBuyBooster, executeSellBooster } from '../modules/transactions.js';
import { formatBigNumber, renderLoading, renderError } from '../utils.js';
import { boosterTiers } from '../config.js';

// --- Estado da página de Trade (CORRIGIDO) ---
const TradeState = {
    activeTab: 'buy', // 'buy' ou 'sell'
};

// Chave do serviço vinda do contrato NFTLiquidityPool.sol
// const PSTAKE_SERVICE_KEY = "NFT_POOL_ACCESS"; // <-- NÃO É MAIS USADO

/**
 * Renderiza a interface de trade principal (Abas e Lista de Ativos)
 */
async function renderTradeInterface() {
    const el = document.getElementById('store-items-grid');
    if (!el) return;

    // 1. Renderiza o "Shell" da UI (Abas + Container)
    el.innerHTML = `
        <div class="trade-container">
            <div class="trade-tabs">
                <button class="trade-tab ${TradeState.activeTab === 'buy' ? 'active' : ''}" data-tab="buy">
                    Buy
                </button>
                <button class="trade-tab ${TradeState.activeTab === 'sell' ? 'active' : ''}" data-tab="sell">
                    Sell
                </button>
            </div>
            <div id="trade-content-area" class="trade-content">
                </div>
        </div>
    `;

    // 2. Renderiza o conteúdo da aba ativa
    await renderActiveTabContent();
}

/**
 * Renderiza o conteúdo da aba selecionada (Buy ou Sell)
 */
async function renderActiveTabContent() {
    const el = document.getElementById('trade-content-area');
    if (!el) return;

    // Adicionada verificação do ecosystemManagerContract
    // *** CORREÇÃO: Removida a verificação do ecosystemManagerContract, pois não precisamos mais dele para pStake ***
    if (!State.isConnected || !State.nftBondingCurveContract || !State.rewardBoosterContract) {
        const message = !State.isConnected ? 'Connect wallet to trade.' : 'Store config incomplete.';
        el.innerHTML = `<p class="${!State.isConnected ? 'error-message' : 'loading-message'}">${message}</p>`;
        return;
    }

    // --- LÓGICA DE VERIFICAÇÃO DE PSTAKE (REMOVIDA) ---
    // O bloco de código que verificava 'PSTAKE_SERVICE_KEY'
    // e comparava 'userPStake < MIN_PSTAKE_REQ' foi totalmente removido.
    // --- FIM DA REMOÇÃO ---

    el.innerHTML = `<p class="loading-message">Loading booster data...</p>`;
    
    try {
        await loadMyBoosters(); // Carrega os boosters do usuário (necessário para a aba "Sell")

        let contentPromises;

        if (TradeState.activeTab === 'buy') {
            // --- MODO COMPRA ---
            contentPromises = boosterTiers.map(async (tier) => {
                try {
                    const poolInfo = await safeContractCall(State.nftBondingCurveContract, 'pools', [tier.boostBips], { nftCount: 0n });
                    const buyPrice = await safeContractCall(State.nftBondingCurveContract, 'getBuyPrice', [tier.boostBips], ethers.MaxUint256);

                    const availableInPool = Number(poolInfo.nftCount);
                    const isBuyDisabled = availableInPool === 0 || buyPrice === ethers.MaxUint256;
                    const priceFormatted = isBuyDisabled ? '--' : formatBigNumber(buyPrice).toFixed(2);

                    return `
                        <div class="trade-row">
                            <div class="trade-row-icon">
                                <img src="${tier.img}" alt="${tier.name}"/>
                            </div>
                            <div class="trade-row-info">
                                <h4>${tier.name}</h4>
                                <p class="${tier.color}">+${tier.boostBips / 100}% Efficiency</p>
                            </div>
                            <div class="trade-row-stats">
                                <div class="stat-label">Price</div>
                                <div class="stat-value">${priceFormatted} BKC</div>
                                <div class="stat-label" style="margin-top: 4px;">Available: ${availableInPool}</div>
                            </div>
                            <div class="trade-row-action">
                                <button class="trade-action-btn buy buy-booster-btn" 
                                        data-boostbips="${tier.boostBips}" 
                                        data-price="${buyPrice.toString()}" 
                                        ${isBuyDisabled ? 'disabled' : ''}>
                                    Buy
                                </button>
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error(`Error loading buy data for tier ${tier.name}:`, error);
                    return `
                        <div class="trade-row">
                            <div class="trade-row-icon"><img src="${tier.img}" alt="${tier.name}"/></div>
                            <div class="trade-row-info">
                                <h4>${tier.name}</h4>
                                <p class="${tier.color}">+${tier.boostBips / 100}% Efficiency</p>
                            </div>
                            <div class="trade-row-stats text-red-400">
                                <div class="stat-label">Error</div>
                                <div class="stat-value">Failed to load</div>
                            </div>
                            <div class="trade-row-action">
                                <button class="trade-action-btn buy" disabled>Buy</button>
                            </div>
                        </div>
                    `;
                }
            });
        } else {
            // --- MODO VENDA ---
            const userBoosters = State.myBoosters;

            if (userBoosters.length === 0) {
                el.innerHTML = `<p class="text-center text-zinc-400 p-4">You do not own any Booster NFTs to sell.</p>`;
                return;
            }

            contentPromises = userBoosters.map(async (booster) => {
                try {
                    const tier = boosterTiers.find(t => t.boostBips === booster.boostBips) || { name: 'Unknown', color: 'text-zinc-400', img: '' };
                    const sellPrice = await safeContractCall(State.nftBondingCurveContract, 'getSellPrice', [booster.boostBips], 0n);
                    const isSellDisabled = sellPrice === 0n;
                    const priceFormatted = isSellDisabled ? '--' : formatBigNumber(sellPrice).toFixed(2);

                    return `
                        <div class="trade-row">
                            <div class="trade-row-icon">
                                <img src="${tier.img}" alt="${tier.name}"/>
                            </div>
                            <div class="trade-row-info">
                                <h4>${tier.name}</h4>
                                <p class="text-zinc-400" style="font-size: 0.8rem;">Token ID #${booster.tokenId}</p>
                            </div>
                            <div class="trade-row-stats">
                                <div class="stat-label">Sell Value</div>
                                <div class="stat-value">${priceFormatted} BKC</div>
                            </div>
                            <div class="trade-row-action">
                                <button class="trade-action-btn sell sell-booster-btn" 
                                        data-tokenid="${booster.tokenId}" 
                                        ${isSellDisabled ? 'disabled' : ''}>
                                    Sell
                                </button>
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error(`Error loading sell data for booster ID ${booster.tokenId}:`, error);
                    const tier = boosterTiers.find(t => t.boostBips === booster.boostBips) || { name: 'Unknown', color: 'text-zinc-400', img: '' };
                    return `
                        <div class="trade-row">
                            <div class="trade-row-icon"><img src="${tier.img}" alt="${tier.name}"/></div>
                            <div class="trade-row-info">
                                <h4>${tier.name}</h4>
                                <p class="text-zinc-400" style="font-size: 0.8rem;">Token ID #${booster.tokenId}</p>
                            </div>
                            <div class="trade-row-stats text-red-400">
                                <div class="stat-label">Error</div>
                                <div class="stat-value">Failed to load</div>
                            </div>
                            <div class="trade-row-action">
                                <button class="trade-action-btn sell" disabled>Sell</button>
                            </div>
                        </div>
                    `;
                }
            });
        }

        el.innerHTML = (await Promise.all(contentPromises)).join('');

    } catch (err) {
        console.error("Error in renderActiveTabContent:", err);
        renderError(el, "Failed to load store data. Please refresh.");
    }
}


// --- LISTENERS ---

function setupStorePageListeners() {
    DOMElements.store.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        // 1. Listener para as ABAS
        if (button.classList.contains('trade-tab')) {
            e.preventDefault();
            const newTab = button.dataset.tab;
            if (newTab !== TradeState.activeTab) {
                TradeState.activeTab = newTab;
                await renderTradeInterface();
            }
            return;
        }

        // 2. Listener para o botão de COMPRA
        if (button.classList.contains('buy-booster-btn')) {
            e.preventDefault();
            const { boostbips, price } = button.dataset;
            const success = await executeBuyBooster(boostbips, price, button);
            if (success) {
                State.myBoosters = [];
                await loadUserData(); // Recarrega os dados do usuário *depois* da compra
                await renderActiveTabContent();
            }
            return;
        }

        // 3. Listener para o botão de VENDA
        if (button.classList.contains('sell-booster-btn')) {
            e.preventDefault();
            const { tokenid } = button.dataset;
            const success = await executeSellBooster(tokenid, button);
            if (success) {
                State.myBoosters = [];
                await loadUserData(); // Recarrega os dados do usuário *depois* da venda
                await renderActiveTabContent();
            }
            return;
        }
    });
}

// Inicializa os listeners apenas uma vez
if (!DOMElements.store._listenersInitialized) {
    setupStorePageListeners();
    DOMElements.store._listenersInitialized = true;
}

// Exporta a função render principal
export const StorePage = {
    async render(isUpdate = false) {
        // A lógica de carregamento de dados foi movida para 'renderActiveTabContent'
        // para garantir que os dados estejam prontos antes de renderizar.
        await renderTradeInterface();
    }
}