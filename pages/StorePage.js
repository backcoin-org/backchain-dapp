// pages/StorePage.js
// Gerencia a página "NFT Trading Pool" (Store), permitindo aos usuários
// comprar e vender Booster NFTs usando um AMM.
// REFA: Atualizado para a arquitetura "Factory" (Piscinas Individuais)

// --- IMPORTAÇÕES E CONFIGURAÇÕES ---
const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { loadUserData, loadMyBoostersFromAPI, safeContractCall, getHighestBoosterBoostFromAPI } from '../modules/data.js';
import { executeBuyBooster, executeSellBooster } from '../modules/transactions.js';
import { formatBigNumber, renderLoading, renderError } from '../utils.js';
// REFA: Importa o 'nftPoolABI' (do molde), 'addresses' e o 'ipfsGateway'
import { boosterTiers, addresses, nftPoolABI, ipfsGateway } from '../config.js'; 
import { rewardBoosterABI, ecosystemManagerABI } from '../config.js'; // Fallback ABI

// --- ESTADO LOCAL DA PÁGINA (TradeState) ---
// Objeto que rastreia o estado da UI de negociação
const TradeState = {
    tradeDirection: 'buy', // 'buy' (BKC -> NFT) ou 'sell' (NFT -> BKC)
    selectedPoolBoostBips: null, // O 'ativo' selecionado (ex: 5000 para Diamond)
    
    // Dados para o pool selecionado
    buyPrice: 0n,
    sellPrice: 0n,
    netSellPrice: 0n, // Preço de venda líquido (após taxas/descontos)
    userBalanceOfSelectedNFT: 0,
    firstAvailableTokenId: null, // O primeiro tokenId que o usuário POSSUI para VENDER
    firstAvailableTokenIdForBuy: null, // O primeiro tokenId que o POOL POSSUI para COMPRA
    
    // Rastreia o melhor booster do usuário para descontos
    bestBoosterTokenId: 0n, 
    bestBoosterBips: 0n, 
    
    isDataLoading: false,
    isModalOpen: false, // Para o modal de seleção de pool
};

// --- (REFA) Helper para Imagem ---
/**
 * Constrói uma URL de imagem IPFS confiável usando o gateway.
 * @param {string} ipfsIoUrl - A URL antiga (ex: https://ipfs.io/ipfs/CID)
 * @returns {string} A nova URL (ex: https://seu.gateway/ipfs/CID)
 */
function buildImageUrl(ipfsIoUrl) {
    if (!ipfsIoUrl) return './assets/bkc_logo_3d.png'; // Fallback
    if (ipfsIoUrl.includes('ipfs.io/ipfs/')) {
        const cid = ipfsIoUrl.split('ipfs.io/ipfs/')[1];
        return `${ipfsGateway}${cid}`;
    }
    // Lida com o formato ipfs://CID
    if (ipfsIoUrl.startsWith('ipfs://')) {
        const cid = ipfsIoUrl.substring(7);
        return `${ipfsGateway}${cid}`;
    }
    
    // Fallback se a URL já for um link http ou outro formato
    return ipfsIoUrl;
}


// --- RENDERIZAÇÃO DA UI (SWAP BOX) ---

/**
 * Renderiza a estrutura principal (shell) da Swap Box e do Modal.
 */
async function renderSwapBoxInterface() {
    const el = document.getElementById('store-items-grid');
    if (!el) return;

    // 1. Renderiza a estrutura principal
    el.innerHTML = `
        <div class="swap-box-container">
            <div class="swap-box-header">
                <h3>Trade Boosters</h3>
                <p>Swap BKC for NFT Boosters, or vice-versa.</p>
            </div>
            
            <div id="swap-box-content">
                ${TradeState.isDataLoading ? renderLoading() : ''}
            </div>

            <div id="swap-box-button-container">
                </div>
        </div>

        <div id="pool-select-modal" class="pool-modal ${TradeState.isModalOpen ? 'open' : ''}">
            <div class="pool-modal-content">
                <div class="pool-modal-header">
                    <h4>Select an Asset</h4>
                    <button class="pool-modal-close">&times;</button>
                </div>
                <div id="pool-modal-list">
                    </div>
            </div>
        </div>
    `;

    // 2. Renderiza o conteúdo interno da swap box
    await renderSwapPanels();
    renderExecuteButton();

    // 3. Renderiza o conteúdo do modal (oculto)
    renderPoolSelectorModal();
}

/**
 * Renderiza os painéis "From" e "To" com base na direção da troca.
 */
async function renderSwapPanels() {
    const contentEl = document.getElementById('swap-box-content');
    if (!contentEl) return;

    const selectedTier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
    let fromPanelHtml, toPanelHtml;
    const bkcLogoPath = "assets/bkc_logo_3d.png"; 

    // Garante que o estado do HUB esteja carregado para calcular o desconto
    const isHubReady = !!State.ecosystemManagerContract;

    if (TradeState.tradeDirection === 'buy') {
        // ========== COMPRA (BKC -> NFT) ==========
        fromPanelHtml = renderPanel({
            label: "You Pay",
            tokenSymbol: "BKC",
            tokenImg: bkcLogoPath,
            amount: TradeState.isDataLoading ? "..." : (TradeState.buyPrice > 0n ? formatBigNumber(TradeState.buyPrice).toFixed(2) : "0.00"),
            balance: `Balance: ${formatBigNumber(State.currentUserBalance).toFixed(2)}`
        });
        
        // Verifica se está esgotado para exibir o status no painel
        const sellOutBalanceText = (selectedTier && TradeState.firstAvailableTokenIdForBuy === null && !TradeState.isDataLoading) ? 'Sold Out' : '';

        toPanelHtml = renderPanel({
            label: "You Receive",
            tokenSymbol: selectedTier ? selectedTier.name : "Select Booster",
            tokenImg: selectedTier ? selectedTier.img : null,
            amount: selectedTier ? "1" : "0",
            balance: sellOutBalanceText, // Adicionado Sold Out
            isSelector: true
        });

    } else {
        // ========== VENDA (NFT -> BKC) ==========
        fromPanelHtml = renderPanel({
            label: "You Sell",
            tokenSymbol: selectedTier ? selectedTier.name : "Select Booster",
            tokenImg: selectedTier ? selectedTier.img : null,
            amount: selectedTier ? "1" : "0",
            balance: `You have: ${TradeState.userBalanceOfSelectedNFT}`,
            isSelector: true
        });

        // Detalhes do preço de venda (Taxas e Descontos)
        let sellDetails = null;
        if (TradeState.sellPrice > 0n) {
            const gross = formatBigNumber(TradeState.sellPrice).toFixed(2);
            
            // Lógica de cálculo de desconto para UI
            const baseTaxBips = isHubReady 
                ? await safeContractCall(State.ecosystemManagerContract, 'getFee', ["NFT_POOL_TAX_BIPS"], 1000n) 
                : 1000n;
            
            const discountBips = TradeState.bestBoosterBips > 0n && isHubReady 
                ? await safeContractCall(State.ecosystemManagerContract, 'getBoosterDiscount', [TradeState.bestBoosterBips], 0n)
                : 0n;

            if (discountBips > 0n) {
                const finalTaxBips = (baseTaxBips > discountBips) ? (baseTaxBips - discountBips) : 0n;
                const discountPercent = (Number(discountBips) / 100).toFixed(0);

                sellDetails = `(Gross: ${gross} | Discount: ${discountPercent}%)`;
            } else {
                sellDetails = `(Gross: ${gross} | Base Tax: ${Number(baseTaxBips) / 100}%)`;
            }
        }

        toPanelHtml = renderPanel({
            label: "You Receive (Net)",
            tokenSymbol: "BKC",
            tokenImg: bkcLogoPath, 
            amount: TradeState.isDataLoading ? "..." : (TradeState.netSellPrice > 0n ? formatBigNumber(TradeState.netSellPrice).toFixed(2) : "0.00"),
            details: sellDetails
        });
    }

    // Renderiza o HTML final da caixa
    contentEl.innerHTML = `
        ${fromPanelHtml}
        <div class="swap-arrow-button-wrapper">
            <button class="swap-arrow-btn">
                <i class="fa-solid fa-arrow-down"></i>
            </button>
        </div>
        ${toPanelHtml}
    `;
}

/**
 * Renderiza o botão principal de execução (Comprar, Vender, Saldo Insuficiente, etc.)
 */
function renderExecuteButton() {
    const buttonEl = document.getElementById('swap-box-button-container');
    if (!buttonEl) return;

    let btnText = "Select a Booster";
    let isDisabled = true;
    let isInsufficientBalance = false; // Flag para saldo insuficiente

    if (TradeState.selectedPoolBoostBips !== null) {
        if (TradeState.tradeDirection === 'buy') {
            // Lógica de Compra
            
            if (TradeState.buyPrice === 0n) {
                btnText = "Buy Booster (Price Unavailable)";
                isDisabled = true;
            } 
            // 1. Checa Saldo Insuficiente (Prioridade Máxima para mostrar o link 'Buy $BKC')
            else if (TradeState.buyPrice > State.currentUserBalance) {
                btnText = "Insufficient BKC Balance";
                isDisabled = true;
                isInsufficientBalance = true; 
            } 
            // 2. Checa Estoque 
            else if (TradeState.firstAvailableTokenIdForBuy === null) {
                btnText = "Sold Out";
                isDisabled = true;
                isInsufficientBalance = false; 
            }
            // 3. Pronto para Comprar
            else {
                btnText = "Buy Booster";
                isDisabled = false;
            }
        } else {
            // Lógica de Venda
            if (TradeState.userBalanceOfSelectedNFT === 0) {
                btnText = "You have no such Booster";
                isDisabled = true;
            } else if (TradeState.netSellPrice === 0n) {
                btnText = "Sell Booster (Price Unavailable)";
                isDisabled = true;
            } else if (TradeState.firstAvailableTokenId === null || TradeState.firstAvailableTokenId <= 0n) { 
                 // CORREÇÃO: Garante que o ID do token selecionado é válido
                 btnText = "No NFT selected or Token ID is invalid.";
                 isDisabled = true;
            } else {
                btnText = "Sell Booster";
                isDisabled = false;
            }
        }
    }

    // --- LÓGICA DE RENDERIZAÇÃO DO BOTÃO ---
    // Se a flag 'isInsufficientBalance' estiver ativa, mostra o link "Buy $BKC"
    if (isInsufficientBalance) {
        
        const buyBkcLink = addresses.bkcDexPoolAddress || '#';
        
        buttonEl.innerHTML = `
            <a href="${buyBkcLink}" target="_blank" rel="noopener noreferrer" 
                class="execute-trade-btn" 
                style="background: #f59e0b; color: #18181b; text-decoration: none; display: flex; align-items: center; justify-content: center; font-weight: 700; text-shadow: none;">
                <i class="fa-solid fa-shopping-cart mr-2"></i>
                Buy $BKC
            </a>
        `;
    } else {
        // Caso contrário, mostra o botão padrão (habilitado ou desabilitado)
        buttonEl.innerHTML = `
            <button id="execute-trade-btn" class="execute-trade-btn" ${isDisabled ? 'disabled' : ''}>
                ${btnText}
            </button>
        `;
    }
}

/**
 * Função helper para renderizar um painel (From ou To).
 */
function renderPanel({ label, tokenSymbol, tokenImg, amount, balance, details, isSelector = false }) {
    // (REFA) CORREÇÃO DA IMAGEM: Usa o helper buildImageUrl
    const finalTokenImg = buildImageUrl(tokenImg);

    const tokenDisplay = finalTokenImg 
        ? `<img src="${finalTokenImg}" alt="${tokenSymbol}" /> ${tokenSymbol}`
        : tokenSymbol;

    const selectorClass = isSelector ? 'is-selector' : '';
    const selectorArrow = isSelector ? '<i class="fa-solid fa-chevron-down"></i>' : '';
    const balanceClass = (balance === 'Sold Out') ? 'swap-balance sold-out' : 'swap-balance';

    return `
        <div class="swap-panel">
            <div class="swap-panel-header">
                <span class="swap-label">${label}</span>
                <span class="${balanceClass}">${balance || ''}</span>
            </div>
            <div class="swap-panel-main">
                <div class="swap-amount">${amount}</div>
                <button class="token-selector-btn ${selectorClass}" ${!isSelector ? 'disabled' : ''}>
                    ${tokenDisplay}
                    ${selectorArrow}
                </button>
            </div>
            ${details ? `<div class="swap-panel-details">${details}</div>` : ''}
        </div>
    `;
}

/**
 * Renderiza a lista de boosters dentro do modal de seleção.
 */
function renderPoolSelectorModal() {
    const modalListEl = document.getElementById('pool-modal-list');
    if (!modalListEl) return;

    modalListEl.innerHTML = boosterTiers.map(tier => {
        // (REFA) CORREÇÃO DA IMAGEM: Usa o helper buildImageUrl
        const finalImg = buildImageUrl(tier.img);
        return `
            <button class="pool-modal-item" data-boostbips="${tier.boostBips}">
                <img src="${finalImg}" alt="${tier.name}" />
                <div class="pool-modal-info">
                    <h4>${tier.name}</h4>
                    <span>+${tier.boostBips / 100}% Efficiency</span>
                </div>
            </button>
        `
    }).join('');
}

// --- CARREGAMENTO DE DADOS (DATA FETCHING) ---

/**
 * (REFA) Busca todos os dados necessários para o pool selecionado e atualiza o estado.
 * Esta é a função principal, agora usando a arquitetura de "Fábrica".
 */
async function loadDataForSelectedPool() {
    if (TradeState.selectedPoolBoostBips === null) {
        return; // Não faz nada se nenhum pool estiver selecionado
    }
    
    TradeState.isDataLoading = true;
    TradeState.firstAvailableTokenIdForBuy = null; 
    await renderSwapPanels(); 
    renderExecuteButton(); 

    try {
        const boostBips = TradeState.selectedPoolBoostBips;

        // --- (REFA) INÍCIO: Lógica da Fábrica ---
        
        // 1. Encontrar o endereço do pool clone correto
        const tier = boosterTiers.find(t => t.boostBips === boostBips);
        if (!tier) throw new Error(`Tier ${boostBips} não encontrado na configuração.`);
        
        const poolKey = `pool_${tier.name.toLowerCase()}`;
        const poolAddress = addresses[poolKey];
        
        if (!poolAddress || !poolAddress.startsWith('0x')) {
            console.error(`Endereço da piscina para ${tier.name} (${poolKey}) não encontrado ou inválido no deployment-addresses.json.`);
            throw new Error("Pool not deployed or not found in addresses.");
        }

        // 2. Criar uma instância de contrato temporária para este pool
        const poolContract = new ethers.Contract(
            poolAddress, 
            nftPoolABI, // Usa a ABI do "molde"
            State.publicProvider // Usa o provedor público para leitura
        );

        // --- (REFA) FIM: Lógica da Fábrica ---

        // 3. Garante que os dados de tokens/boosters do usuário estejam atualizados
        await Promise.all([
            loadUserData(), // Atualiza o balance BKC
            loadMyBoostersFromAPI() // Atualiza State.myBoosters
        ]);
        
        // 4. Carrega os boosters do usuário (necessário para Venda e Desconto)
        const { highestBoost, tokenId } = await getHighestBoosterBoostFromAPI(); 
        TradeState.bestBoosterTokenId = tokenId ? BigInt(tokenId) : 0n;
        TradeState.bestBoosterBips = BigInt(highestBoost);

        // 5. Filtra os boosters do usuário para o tier selecionado (para Vender)
        const myTierBoosters = State.myBoosters.filter(b => b.boostBips === Number(boostBips));
        TradeState.userBalanceOfSelectedNFT = myTierBoosters.length;
        
        // CORREÇÃO CRÍTICA: Salva o tokenId como BigInt
        TradeState.firstAvailableTokenId = myTierBoosters.length > 0 
            ? BigInt(myTierBoosters[0].tokenId) 
            : null;


        // 6. Busca os preços e o estoque (IDs) DO POOL CLONE
        const isHubReady = !!State.ecosystemManagerContract;
        
        const [poolInfo, buyPrice, sellPrice, availableTokenIds] = await Promise.all([
            safeContractCall(poolContract, 'getPoolInfo', [], null),
            safeContractCall(poolContract, 'getBuyPrice', [], ethers.MaxUint256),
            safeContractCall(poolContract, 'getSellPrice', [], 0n),
            safeContractCall(poolContract, 'getAvailableTokenIds', [], [])
        ]);

        if (poolInfo === null) {
            throw new Error(`Falha ao carregar getPoolInfo do contrato ${poolAddress}`);
        }

        // 7. Atualiza o estado com os dados do contrato
        TradeState.firstAvailableTokenIdForBuy = (availableTokenIds.length > 0) ? BigInt(availableTokenIds[availableTokenIds.length - 1]) : null;
        TradeState.buyPrice = (buyPrice === ethers.MaxUint256) ? 0n : buyPrice; 
        TradeState.sellPrice = sellPrice;

        // 8. Calcula o preço líquido de venda (com taxas e descontos)
        const TAX_BIPS_KEY = "NFT_POOL_TAX_BIPS";
        const [baseTaxBips, discountBips] = await Promise.all([
            isHubReady ? safeContractCall(State.ecosystemManagerContract, 'getFee', [TAX_BIPS_KEY], 1000n) : 1000n,
            isHubReady ? safeContractCall(State.ecosystemManagerContract, 'getBoosterDiscount', [TradeState.bestBoosterBips], 0n) : 0n
        ]);
        
        const finalTaxBips = (baseTaxBips > discountBips) ? (baseTaxBips - discountBips) : 0n;
        const taxAmount = (sellPrice * finalTaxBips) / 10000n;
        TradeState.netSellPrice = sellPrice - taxAmount;

    } catch (err) {
        console.error("Error loading pool data:", err);
        TradeState.buyPrice = 0n;
        TradeState.sellPrice = 0n;
        TradeState.netSellPrice = 0n;
        TradeState.firstAvailableTokenIdForBuy = null; // Garante que não pode comprar
    } finally {
        TradeState.isDataLoading = false;
        // Re-renderiza tudo com os novos dados
        await renderSwapPanels();
        renderExecuteButton();
    }
}

/**
 * Alterna a visibilidade do modal de seleção.
 */
function toggleModal(isOpen) {
    TradeState.isModalOpen = isOpen;
    const modalEl = document.getElementById('pool-select-modal');
    if (modalEl) {
        modalEl.classList.toggle('open', isOpen);
    }
}

// --- SETUP DE LISTENERS ---
// Configura os listeners de evento para a página.

function setupStorePageListeners() {
    // Usa um listener persistente no elemento principal (delegação de eventos)
    DOMElements.store.addEventListener('click', async (e) => {
        
        // --- Botão de Inverter Direção (Swap) ---
        const swapBtn = e.target.closest('.swap-arrow-btn');
        if (swapBtn) {
            e.preventDefault();
            TradeState.tradeDirection = (TradeState.tradeDirection === 'buy') ? 'sell' : 'buy';
            await renderSwapPanels();
            renderExecuteButton();
            return;
        }

        // --- Abrir Modal de Seleção de Pool ---
        const selectorBtn = e.target.closest('.token-selector-btn.is-selector');
        if (selectorBtn) {
            e.preventDefault();
            toggleModal(true);
            return;
        }

        // --- Fechar Modal de Seleção ---
        const closeBtn = e.target.closest('.pool-modal-close');
        if (closeBtn) {
            e.preventDefault();
            toggleModal(false);
            return;
        }

        // --- Selecionar um Pool do Modal ---
        const poolItemBtn = e.target.closest('.pool-modal-item');
        if (poolItemBtn) {
            e.preventDefault();
            TradeState.selectedPoolBoostBips = BigInt(poolItemBtn.dataset.boostbips);
            toggleModal(false); // Fecha o modal
            await loadDataForSelectedPool(); // Carrega os dados do pool
            return;
        }

        // --- Botão de Executar Negociação ---
        const executeBtn = e.target.closest('#execute-trade-btn');
        if (executeBtn) {
            e.preventDefault();

            // --- (REFA) INÍCIO: Lógica da Fábrica ---
            // Precisamos encontrar o endereço do pool para a transação
            const tier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
            if (!tier) {
                showToast("Error: No pool selected.", "error");
                return;
            }
            const poolKey = `pool_${tier.name.toLowerCase()}`;
            const poolAddress = addresses[poolKey];
            if (!poolAddress || !poolAddress.startsWith('0x')) {
                showToast(`Error: Pool address for ${tier.name} not found.`, "error");
                return;
            }
            // --- (REFA) FIM: Lógica da Fábrica ---
            
            if (TradeState.tradeDirection === 'buy') {
                // Lógica de Compra
                if (TradeState.firstAvailableTokenIdForBuy === null) {
                    console.error("Attempted to buy, but no Token ID is available.");
                    showToast("This item is currently sold out.", "error");
                    return;
                }
                
                const success = await executeBuyBooster(
                    poolAddress, // (REFA) Passa o endereço do pool
                    TradeState.buyPrice,
                    TradeState.bestBoosterTokenId, // (REFA) Passa o booster para pStake
                    // (REFA) Não precisamos mais passar o tokenId para comprar
                    executeBtn
                );
                if (success) {
                    await loadDataForSelectedPool(); // Recarrega os dados
                }
            } else {
                // Lógica de Venda
                // O Token ID para venda é o primeiro da lista do usuário
                if (TradeState.firstAvailableTokenId === null || TradeState.firstAvailableTokenId <= 0n) {
                     showToast("No NFT selected or Token ID is invalid.", "error");
                     return;
                }

                const success = await executeSellBooster(
                    poolAddress, // (REFA) Passa o endereço do pool
                    TradeState.firstAvailableTokenId, // O NFT que você está vendendo
                    TradeState.bestBoosterTokenId,  // O NFT que você está usando para o desconto
                    executeBtn
                );
                if (success) {
                    await loadDataForSelectedPool(); // Recarrega os dados
                }
            }
            return;
        }
    });
}

// Initialize listeners only once
if (!DOMElements.store._listenersInitialized) {
    setupStorePageListeners();
    DOMElements.store._listenersInitialized = true;
}

// --- OBJETO PRINCIPAL DA PÁGINA (StorePage) ---
// Exporta a função 'render' principal que é chamada pelo app.js

export const StorePage = {
    async render(isUpdate = false) {
        // Garante que os contratos necessários estão carregados (EcosystemManager e RewardBooster)
        await loadPublicData();
        
        await renderSwapBoxInterface();
        
        // Carrega dados para o pool padrão ou o último selecionado
        if (TradeState.selectedPoolBoostBips === null && boosterTiers.length > 0) {
            TradeState.selectedPoolBoostBips = boosterTiers[0].boostBips; // Padrão
        }
        
        // Atualiza a UI inicial e, em seguida, carrega os dados do pool
        if (State.isConnected || isUpdate) {
             await loadDataForSelectedPool();
        } else {
             // Se desconectado, apenas renderiza o shell com o pool padrão
             await loadDataForSelectedPool(); 
        }
    }
}