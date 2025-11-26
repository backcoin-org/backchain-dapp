// pages/StorePage.js
const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { loadUserData, loadMyBoostersFromAPI, safeContractCall, getHighestBoosterBoostFromAPI, loadSystemDataFromAPI } from '../modules/data.js';
import { executeBuyBooster, executeSellBooster } from '../modules/transactions.js';
import { formatBigNumber, renderLoading, renderError } from '../utils.js';
import { boosterTiers, addresses, nftPoolABI, ipfsGateway } from '../config.js'; 
import { rewardBoosterABI, ecosystemManagerABI } from '../config.js'; 
import { showToast } from '../ui-feedback.js'; 

// --- ESTADO LOCAL DA PÁGINA (TradeState) ---
const TradeState = {
    tradeDirection: 'buy', 
    selectedPoolBoostBips: null, 
    buyPrice: 0n,
    sellPrice: 0n,
    netSellPrice: 0n, 
    userBalanceOfSelectedNFT: 0,
    firstAvailableTokenId: null, 
    firstAvailableTokenIdForBuy: null,
    bestBoosterTokenId: 0n, 
    bestBoosterBips: 0, 
    meetsPStakeRequirement: true, 
    isDataLoading: false,
    isModalOpen: false, 
};

function buildImageUrl(ipfsIoUrl) {
    if (!ipfsIoUrl) return './assets/bkc_logo_3d.png'; 
    if (ipfsIoUrl.startsWith('https://') || ipfsIoUrl.startsWith('http://')) return ipfsIoUrl;
    if (ipfsIoUrl.includes('ipfs.io/ipfs/')) {
        const cid = ipfsIoUrl.split('ipfs.io/ipfs/')[1];
        return `${ipfsGateway}${cid}`;
    }
    if (ipfsIoUrl.startsWith('ipfs://')) {
        const cid = ipfsIoUrl.substring(7);
        return `${ipfsGateway}${cid}`;
    }
    return ipfsIoUrl;
}

// --- RENDERIZAÇÃO DA UI (SWAP BOX) ---

async function renderSwapBoxInterface() {
    const el = document.getElementById('store-items-grid');
    if (!el) return;
    
    // Só renderiza o HTML se ele estiver vazio (primeira vez)
    if (el.innerHTML.trim() === "") {
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
    }
    
    // Sempre atualiza os painéis e botões
    await renderSwapPanels();
    renderExecuteButton();
    renderPoolSelectorModal();
}

async function renderSwapPanels() {
    const contentEl = document.getElementById('swap-box-content');
    if (!contentEl) return;

    // Remove loader se dados carregados
    if (!TradeState.isDataLoading) {
        const loader = contentEl.querySelector('.loader');
        if (loader) loader.remove();
    }

    const selectedTier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
    let fromPanelHtml, toPanelHtml;
    const bkcLogoPath = "assets/bkc_logo_3d.png"; 
    const isHubReady = !!State.systemFees;

    if (TradeState.tradeDirection === 'buy') {
        fromPanelHtml = renderPanel({
            label: "You Pay",
            tokenSymbol: "BKC",
            tokenImg: bkcLogoPath,
            amount: TradeState.isDataLoading ? "..." : (TradeState.buyPrice > 0n ? formatBigNumber(TradeState.buyPrice).toFixed(2) : "0.00"),
            balance: `Balance: ${formatBigNumber(State.currentUserBalance || 0n).toFixed(2)}`
        });
        
        const sellOutBalanceText = (selectedTier && TradeState.firstAvailableTokenIdForBuy === null && !TradeState.isDataLoading) ? 'Sold Out' : '';

        toPanelHtml = renderPanel({
            label: "You Receive",
            tokenSymbol: selectedTier ? selectedTier.name : "Select Booster",
            tokenImg: selectedTier ? selectedTier.img : null,
            amount: selectedTier ? "1" : "0",
            balance: sellOutBalanceText,
            isSelector: true
        });

    } else {
        fromPanelHtml = renderPanel({
            label: "You Sell",
            tokenSymbol: selectedTier ? selectedTier.name : "Select Booster",
            tokenImg: selectedTier ? selectedTier.img : null,
            amount: selectedTier ? "1" : "0",
            balance: `You have: ${TradeState.userBalanceOfSelectedNFT}`,
            isSelector: true
        });

        let sellDetails = null;
        if (TradeState.sellPrice > 0n) {
            const gross = formatBigNumber(TradeState.sellPrice).toFixed(2);
            
            const baseTaxBips = isHubReady ? (State.systemFees["NFT_POOL_TAX_BIPS"] || 1000n) : 1000n;
            const discountBips = isHubReady ? BigInt(State.boosterDiscounts[TradeState.bestBoosterBips] || 0) : 0n;

            if (discountBips > 0n) {
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

function renderExecuteButton() {
    const buttonEl = document.getElementById('swap-box-button-container');
    if (!buttonEl) return;

    let btnText = "Select a Booster";
    let isDisabled = true;
    let isInsufficientBalance = false; 
    let isPStakeInsufficient = false; 

    if (TradeState.selectedPoolBoostBips !== null) {
        if (State.isConnected && !TradeState.meetsPStakeRequirement) {
            btnText = "Delegate Now"; 
            isDisabled = false;
            isPStakeInsufficient = true; 
        }
        else if (TradeState.tradeDirection === 'buy') {
            if (TradeState.buyPrice === 0n) {
                btnText = "Buy Booster (Price Unavailable)";
                isDisabled = true;
            } 
            else if (TradeState.buyPrice > State.currentUserBalance) {
                btnText = "Insufficient BKC Balance";
                isDisabled = true;
                isInsufficientBalance = true; 
            } 
            else if (TradeState.firstAvailableTokenIdForBuy === null) {
                btnText = "Sold Out";
                isDisabled = true;
                isInsufficientBalance = false; 
            }
            else {
                btnText = "Buy Booster";
                isDisabled = false;
            }
        } else {
            if (TradeState.userBalanceOfSelectedNFT === 0) {
                btnText = "You have no such Booster";
                isDisabled = true;
            } else if (TradeState.netSellPrice === 0n) {
                btnText = "Sell Booster (Price Unavailable)";
                isDisabled = true;
            } else if (TradeState.firstAvailableTokenId === null || TradeState.firstAvailableTokenId <= 0n) { 
                 btnText = "No NFT selected or Token ID is invalid.";
                 isDisabled = true;
            } else {
                btnText = "Sell Booster";
                isDisabled = false;
            }
        }
    }

    if (isPStakeInsufficient) {
        buttonEl.innerHTML = `
            <button id="go-to-delegate-btn" class="execute-trade-btn" 
                style="background: #f59e0b; color: #18181b; text-shadow: none; font-weight: 700;">
                <i class="fa-solid fa-layer-group mr-2"></i>
                ${btnText}
            </button>
        `;
    }
    else if (isInsufficientBalance) {
        const buyBkcLink = addresses.bkcDexPoolAddress || '#';
        buttonEl.innerHTML = `
            <a href="${buyBkcLink}" target="_blank" rel="noopener noreferrer" 
                class="execute-trade-btn" 
                style="background: #f59e0b; color: #18181b; text-decoration: none; display: flex; align-items: center; justify-content: center; font-weight: 700; text-shadow: none;">
                <i class="fa-solid fa-shopping-cart mr-2"></i>
                Buy $BKC
            </a>
        `;
    } 
    else {
        buttonEl.innerHTML = `
            <button id="execute-trade-btn" class="execute-trade-btn" ${isDisabled ? 'disabled' : ''}>
                ${btnText}
            </button>
        `;
    }
}

function renderPanel({ label, tokenSymbol, tokenImg, amount, balance, details, isSelector = false }) {
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

function renderPoolSelectorModal() {
    const modalListEl = document.getElementById('pool-modal-list');
    if (!modalListEl) return;

    modalListEl.innerHTML = boosterTiers.map(tier => {
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

async function loadDataForSelectedPool() {
    if (TradeState.selectedPoolBoostBips === null || TradeState.isDataLoading) {
        return; 
    }
    
    TradeState.isDataLoading = true;
    await renderSwapBoxInterface(); // Atualiza UI para estado "Loading"

    try {
        const boostBips = TradeState.selectedPoolBoostBips;
        const tier = boosterTiers.find(t => t.boostBips === boostBips);
        if (!tier) throw new Error(`Tier ${boostBips} não encontrado.`);
        
        const poolKey = `pool_${tier.name.toLowerCase()}`;
        const poolAddress = addresses[poolKey];
        
        if (!poolAddress || !poolAddress.startsWith('0x')) {
            throw new Error("Pool not deployed.");
        }

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.publicProvider);

        if (State.isConnected) {
            await Promise.all([loadUserData(), loadMyBoostersFromAPI()]);
            const { highestBoost, tokenId } = await getHighestBoosterBoostFromAPI(); 
            TradeState.bestBoosterTokenId = tokenId ? BigInt(tokenId) : 0n;
            TradeState.bestBoosterBips = Number(highestBoost);

            const myTierBoosters = State.myBoosters.filter(b => b.boostBips === Number(boostBips));
            TradeState.userBalanceOfSelectedNFT = myTierBoosters.length;
            TradeState.firstAvailableTokenId = myTierBoosters.length > 0 ? BigInt(myTierBoosters[0].tokenId) : null;
        } else {
            TradeState.userBalanceOfSelectedNFT = 0;
            TradeState.firstAvailableTokenId = null;
        }

        const TAX_BIPS_KEY = "NFT_POOL_TAX_BIPS";
        const PSTAKE_KEY = "NFT_POOL_ACCESS"; 
        
        const [buyPrice, sellPrice, availableTokenIds, baseTaxBips, discountBips, requiredPStake] = await Promise.all([
            safeContractCall(poolContract, 'getBuyPrice', [], ethers.MaxUint256),
            safeContractCall(poolContract, 'getSellPrice', [], 0n),
            safeContractCall(poolContract, 'getAvailableTokenIds', [], []),
            Promise.resolve(State.systemFees[TAX_BIPS_KEY] || 1000n), 
            Promise.resolve(BigInt(State.boosterDiscounts[TradeState.bestBoosterBips] || 0)),
            Promise.resolve(State.systemPStakes[PSTAKE_KEY] || 0n)
        ]);

        TradeState.firstAvailableTokenIdForBuy = (availableTokenIds.length > 0) ? BigInt(availableTokenIds[availableTokenIds.length - 1]) : null;
        TradeState.buyPrice = (buyPrice === ethers.MaxUint256) ? 0n : buyPrice; 
        TradeState.sellPrice = sellPrice;
        
        const finalTaxBips = (baseTaxBips > discountBips) ? (baseTaxBips - discountBips) : 0n;
        const taxAmount = (sellPrice * finalTaxBips) / 10000n;
        TradeState.netSellPrice = sellPrice - taxAmount;

        TradeState.meetsPStakeRequirement = !(State.isConnected && State.userTotalPStake < requiredPStake);

    } catch (err) {
        console.error("Error loading pool data:", err);
    } finally {
        TradeState.isDataLoading = false;
        await renderSwapPanels();
        renderExecuteButton();
    }
}

function toggleModal(isOpen) {
    TradeState.isModalOpen = isOpen;
    const modalEl = document.getElementById('pool-select-modal');
    if (modalEl) {
        modalEl.classList.toggle('open', isOpen);
    }
}

// --- SETUP DE LISTENERS ---

function setupStorePageListeners() {
    DOMElements.store.addEventListener('click', async (e) => {
        
        const swapBtn = e.target.closest('.swap-arrow-btn');
        if (swapBtn) {
            e.preventDefault();
            TradeState.tradeDirection = (TradeState.tradeDirection === 'buy') ? 'sell' : 'buy';
            await renderSwapPanels();
            renderExecuteButton();
            return;
        }

        const selectorBtn = e.target.closest('.token-selector-btn.is-selector');
        if (selectorBtn) {
            e.preventDefault();
            toggleModal(true);
            return;
        }

        const closeBtn = e.target.closest('.pool-modal-close');
        if (closeBtn) {
            e.preventDefault();
            toggleModal(false);
            return;
        }

        const poolItemBtn = e.target.closest('.pool-modal-item');
        if (poolItemBtn) {
            e.preventDefault();
            TradeState.selectedPoolBoostBips = Number(poolItemBtn.dataset.boostbips);
            toggleModal(false); 
            await loadDataForSelectedPool(); 
            return;
        }

        const delegateBtn = e.target.closest('#go-to-delegate-btn');
        if (delegateBtn) {
            e.preventDefault();
            document.querySelector('.sidebar-link[data-target="mine"]')?.click();
            return;
        }

        const executeBtn = e.target.closest('#execute-trade-btn');
        if (executeBtn) {
            e.preventDefault();
            const tier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
            if (!tier) { showToast("Error: No pool selected.", "error"); return; }
            const poolKey = `pool_${tier.name.toLowerCase()}`;
            const poolAddress = addresses[poolKey];
            
            if (TradeState.tradeDirection === 'buy') {
                const success = await executeBuyBooster(poolAddress, TradeState.buyPrice, TradeState.bestBoosterTokenId, executeBtn);
                if (success) await loadDataForSelectedPool(); 
            } else {
                const success = await executeSellBooster(poolAddress, TradeState.firstAvailableTokenId, TradeState.bestBoosterTokenId, executeBtn);
                if (success) await loadDataForSelectedPool(); 
            }
            return;
        }
    });
}

if (!DOMElements.store._listenersInitialized) {
    setupStorePageListeners();
    DOMElements.store._listenersInitialized = true;
}

// --- OBJETO PRINCIPAL DA PÁGINA (StorePage) ---

export const StorePage = {
    async render(isNewPage) {
        // Se NÃO é uma nova página e já temos conteúdo, apenas atualiza a UI visualmente
        const container = document.getElementById('store-items-grid');
        if (!isNewPage && container && container.innerHTML.trim() !== "") {
            await StorePage.update();
            return;
        }

        await loadSystemDataFromAPI();
        await renderSwapBoxInterface();
        
        if (TradeState.selectedPoolBoostBips === null && boosterTiers.length > 0) {
            TradeState.selectedPoolBoostBips = boosterTiers[0].boostBips; 
        }
        
        await loadDataForSelectedPool();
    },

    // Método leve para atualizar UI sem fetch pesado
    async update() {
        if (TradeState.selectedPoolBoostBips !== null) {
            await renderSwapPanels();
            renderExecuteButton();
        }
    }
};