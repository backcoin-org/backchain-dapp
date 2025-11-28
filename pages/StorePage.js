// pages/StorePage.js
// ✅ VERSÃO FINAL V6.1: Fix "renderLoading" Crash + Marketplace Completo

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { loadUserData, loadMyBoostersFromAPI, safeContractCall, getHighestBoosterBoostFromAPI, loadSystemDataFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { executeBuyBooster, executeSellBooster } from '../modules/transactions.js';
import { formatBigNumber, renderError } from '../utils.js'; // Removido renderLoading daqui pois usamos o customizado
import { boosterTiers, addresses, nftPoolABI, ipfsGateway } from '../config.js'; 
import { showToast } from '../ui-feedback.js'; 

// --- INJEÇÃO DE ESTILOS (CSS) ---
const style = document.createElement('style');
style.innerHTML = `
    /* LAYOUT GRID */
    .store-layout {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 24px;
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
        padding-top: 2rem;
    }
    
    @media (max-width: 1024px) {
        .store-layout { grid-template-columns: 1fr; }
        .swap-card { margin: 0 auto; }
    }

    /* SWAP CARD */
    .swap-card {
        background: #131313;
        border: 1px solid #27272a;
        border-radius: 24px;
        width: 100%;
        padding: 8px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        position: relative;
    }
    .swap-header {
        display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; color: #fff;
    }
    .swap-header h3 { font-size: 16px; font-weight: 600; margin: 0; }
    
    .swap-panel {
        background: #1b1b1b; border-radius: 16px; padding: 16px; border: 1px solid transparent; transition: border 0.2s;
    }
    .swap-panel:hover { border-color: #27272a; }
    
    .panel-header { display: flex; justify-content: space-between; font-size: 12px; color: #71717a; margin-bottom: 8px; }
    .panel-content { display: flex; justify-content: space-between; align-items: center; }
    .swap-input { background: transparent; border: none; color: #fff; font-size: 28px; font-weight: 500; width: 60%; outline: none; padding: 0; }
    
    .token-selector {
        background: #27272a; border-radius: 20px; padding: 6px 12px; display: flex; align-items: center; gap: 8px;
        color: #fff; border: none; cursor: pointer; transition: background 0.2s; font-weight: 600; font-size: 16px;
    }
    .token-selector:hover { background: #3f3f46; }
    .token-selector img { width: 24px; height: 24px; border-radius: 50%; }
    
    .swap-arrow-container { position: relative; height: 14px; display: flex; justify-content: center; align-items: center; z-index: 10; }
    .swap-arrow-btn {
        background: #1b1b1b; border: 4px solid #131313; border-radius: 12px; width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center; color: #71717a; cursor: pointer; transition: all 0.2s;
    }
    .swap-arrow-btn:hover { color: #f59e0b; border-color: #131313; transform: scale(1.1); }

    .action-btn {
        width: 100%; padding: 16px; border-radius: 20px; border: none; font-size: 18px; font-weight: 600; margin-top: 8px;
        cursor: pointer; transition: all 0.2s; background: #2d2d35; color: #71717a;
    }
    .action-btn.active {
        background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); color: #1a1a1a;
        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
    }
    .action-btn.active:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4); }

    /* SIDEBAR INFO STYLES */
    .info-card {
        background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 20px; margin-bottom: 20px;
    }
    .info-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
    
    .inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .inventory-item {
        background: #27272a; border-radius: 12px; padding: 8px; cursor: pointer; transition: all 0.2s;
        display: flex; flex-direction: column; align-items: center; border: 1px solid transparent;
    }
    .inventory-item:hover { border-color: #f59e0b; background: #3f3f46; transform: translateY(-2px); }
    .inventory-item img { width: 40px; height: 40px; margin-bottom: 5px; }
    .inventory-item span { font-size: 10px; color: #a1a1aa; font-weight: 600; }
    
    .perk-item { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }
    .perk-icon { 
        width: 32px; height: 32px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; 
        display: flex; align-items: center; justify-content: center; color: #f59e0b; flex-shrink: 0;
    }
    .perk-text h4 { font-size: 13px; color: #fff; margin: 0 0 2px 0; font-weight: 600; }
    .perk-text p { font-size: 11px; color: #a1a1aa; margin: 0; line-height: 1.4; }

    /* HISTORY TABLE */
    .history-card { background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 20px; margin-top: 24px; }
    .history-table { width: 100%; border-collapse: collapse; }
    .history-table th { text-align: left; font-size: 11px; color: #71717a; padding-bottom: 10px; text-transform: uppercase; }
    .history-table td { padding: 10px 0; font-size: 13px; color: #d4d4d8; border-bottom: 1px solid #27272a; }
    .history-table tr:last-child td { border-bottom: none; }
    .tx-type { font-weight: 700; font-size: 11px; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
    .type-buy { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .type-sell { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

    /* LOADER & MODAL */
    .modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
        display: none; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-overlay.open { display: flex; animation: fadeIn 0.2s ease-out; }
    .store-loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; width: 100%; animation: fadeIn 0.5s ease-out; }
    .store-logo-pulse { width: 64px; height: 64px; margin-bottom: 20px; animation: logoPulse 2s infinite ease-in-out; filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.3)); }
    @keyframes logoPulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
    .loader-text { font-family: monospace; font-size: 12px; color: #a1a1aa; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; min-height: 18px; text-align: center; }
    .loader-bar-track { width: 80%; height: 4px; background: #27272a; border-radius: 10px; overflow: hidden; position: relative; }
    .loader-bar-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); width: 0%; border-radius: 10px; transition: width 0.1s linear; box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
    .loader-percent { margin-top: 8px; font-size: 10px; color: #52525b; font-weight: bold; }
    
    .simple-loader { display: inline-block; width: 20px; height: 20px; border: 2px solid #52525b; border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; }
`;
document.head.appendChild(style);

// --- ESTADO LOCAL DA PÁGINA (TradeState) ---
const TradeState = {
    tradeDirection: 'buy', // 'buy' (BKC -> NFT) ou 'sell' (NFT -> BKC)
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
    lastFetchTimestamp: 0,
    loaderInterval: null,
    loadingProgress: 0,
    historyData: [] 
};

// --- HELPER: IMAGENS ---
function buildImageUrl(ipfsIoUrl) {
    if (!ipfsIoUrl) return './assets/bkc_logo_3d.png'; 
    if (ipfsIoUrl.startsWith('https://') || ipfsIoUrl.startsWith('http://')) return ipfsIoUrl;
    if (ipfsIoUrl.includes('ipfs.io/ipfs/')) return `${ipfsGateway}${ipfsIoUrl.split('ipfs.io/ipfs/')[1]}`;
    if (ipfsIoUrl.startsWith('ipfs://')) return `${ipfsGateway}${ipfsIoUrl.substring(7)}`;
    return ipfsIoUrl;
}

// --- LOADERS ---
function renderStoreLoader() {
    return `
        <div class="store-loader-container">
            <img src="assets/bkc_logo_3d.png" class="store-logo-pulse" alt="Loading...">
            <div id="store-loader-msg" class="loader-text">INITIALIZING MARKET...</div>
            <div class="loader-bar-track"><div id="store-loader-fill" class="loader-bar-fill"></div></div>
            <div id="store-loader-pct" class="loader-percent">0%</div>
        </div>
    `;
}

function renderSimpleLoader() {
    return `<div class="flex items-center justify-center py-4"><div class="simple-loader"></div></div>`;
}

function startLoadingAnimation() {
    TradeState.loadingProgress = 0;
    const msgEl = document.getElementById('store-loader-msg');
    const barEl = document.getElementById('store-loader-fill');
    const pctEl = document.getElementById('store-loader-pct');
    if (!barEl) return;

    const messages = ["CONNECTING TO POOLS...", "FETCHING PRICES...", "VERIFYING CONSENSUS...", "CALCULATING SLIPPAGE...", "SYNCING BALANCES...", "FINALIZING DATA..."];
    if (TradeState.loaderInterval) clearInterval(TradeState.loaderInterval);

    TradeState.loaderInterval = setInterval(() => {
        const remaining = 99 - TradeState.loadingProgress;
        const increment = Math.max(0.1, remaining / 20); 
        TradeState.loadingProgress += increment;
        if (TradeState.loadingProgress >= 99) TradeState.loadingProgress = 99;

        if (barEl) barEl.style.width = `${TradeState.loadingProgress}%`;
        if (pctEl) pctEl.innerText = `${Math.floor(TradeState.loadingProgress)}%`;
        
        if (msgEl) {
            const msgIndex = Math.floor((TradeState.loadingProgress / 100) * messages.length);
            msgEl.innerText = messages[Math.min(msgIndex, messages.length - 1)];
        }
    }, 50); 
}

function stopLoadingAnimation() {
    if (TradeState.loaderInterval) clearInterval(TradeState.loaderInterval);
    const barEl = document.getElementById('store-loader-fill');
    const pctEl = document.getElementById('store-loader-pct');
    const msgEl = document.getElementById('store-loader-msg');
    if (barEl) {
        barEl.style.width = '100%';
        if (pctEl) pctEl.innerText = '100%';
        if (msgEl) msgEl.innerText = 'READY!';
    }
}

// --- RENDERIZAÇÃO DA PÁGINA COMPLETA ---

async function renderPageStructure() {
    const root = document.getElementById('store'); 
    if (!root) return;
    
    // Renderiza Layout Grid (Esquerda: Swap, Direita: Info)
    if (!root.innerHTML.includes('store-layout')) {
        root.innerHTML = `
            <div class="store-layout animate-fadeIn">
                
                <div class="left-column">
                    <div class="swap-card">
                        <div class="swap-header">
                            <h3>NFT Market</h3>
                            <div class="text-xs text-zinc-500 font-mono"><span id="refresh-status"><i class="fa-solid fa-rotate"></i> Auto</span></div>
                        </div>
                        <div id="swap-box-content"></div>
                        <div id="swap-box-button-container" class="mt-2"></div>
                    </div>

                    <div class="history-card">
                        <div class="info-title"><i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> Transaction History</div>
                        <div id="store-history-content">
                            ${renderSimpleLoader()}
                        </div>
                    </div>
                </div>

                <div class="right-column">
                    
                    <div class="info-card">
                        <div class="info-title"><i class="fa-solid fa-box-open text-amber-500"></i> My Inventory</div>
                        <div id="inventory-content" class="min-h-[80px]">
                            ${renderSimpleLoader()}
                        </div>
                    </div>

                    <div class="info-card">
                        <div class="info-title"><i class="fa-solid fa-star text-purple-500"></i> Utilities & Perks</div>
                        <div class="perk-item">
                            <div class="perk-icon"><i class="fa-solid fa-bolt"></i></div>
                            <div class="perk-text">
                                <h4>Staking Power</h4>
                                <p>Boost your APY in the Staking Pool by holding higher tier NFTs.</p>
                            </div>
                        </div>
                        <div class="perk-item">
                            <div class="perk-icon"><i class="fa-solid fa-tag"></i></div>
                            <div class="perk-text">
                                <h4>Fee Discounts</h4>
                                <p>Get up to 70% off fees in Rental and Notary services.</p>
                            </div>
                        </div>
                        <div class="perk-item">
                            <div class="perk-icon"><i class="fa-solid fa-check-to-slot"></i></div>
                            <div class="perk-text">
                                <h4>Governance</h4>
                                <p>Increase your Voting Power in the upcoming DAO.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div id="pool-select-modal" class="modal-overlay">
                <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-4 shadow-2xl relative animate-bounce-slow">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-white font-bold">Select Booster Tier</h4>
                        <button class="pool-modal-close text-zinc-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    <div id="pool-modal-list" class="pool-list custom-scrollbar"></div>
                </div>
            </div>
        `;
    }
    
    if (TradeState.isDataLoading) {
        const contentEl = document.getElementById('swap-box-content');
        if (contentEl) {
            contentEl.innerHTML = renderStoreLoader();
            startLoadingAnimation();
        }
    } else {
        await renderSwapPanels();
        renderExecuteButton();
    }
    
    renderPoolSelectorModal();
    renderInventory(); 
    loadStoreHistory();
}

async function renderSwapPanels() {
    const contentEl = document.getElementById('swap-box-content');
    if (!contentEl) return;

    const selectedTier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
    const bkcLogoPath = "assets/bkc_logo_3d.png";
    const isLoading = TradeState.isDataLoading;

    if (isLoading) return; 

    let topPanel, bottomPanel;

    if (TradeState.tradeDirection === 'buy') {
        topPanel = {
            label: "You Pay",
            balance: `Balance: ${formatBigNumber(State.currentUserBalance || 0n).toFixed(2)}`,
            amount: (TradeState.buyPrice > 0n ? formatBigNumber(TradeState.buyPrice).toFixed(2) : "0.00"),
            symbol: "BKC",
            img: bkcLogoPath,
            isSelector: false
        };
        const soldOutText = (selectedTier && TradeState.firstAvailableTokenIdForBuy === null) ? '(Sold Out)' : '';
        bottomPanel = {
            label: "You Receive",
            balance: soldOutText,
            amount: selectedTier ? "1" : "0",
            symbol: selectedTier ? selectedTier.name : "Select Tier",
            img: selectedTier ? selectedTier.img : null,
            isSelector: true
        };
    } else {
        topPanel = {
            label: "You Sell",
            balance: `Owned: ${TradeState.userBalanceOfSelectedNFT}`,
            amount: selectedTier ? "1" : "0",
            symbol: selectedTier ? selectedTier.name : "Select Tier",
            img: selectedTier ? selectedTier.img : null,
            isSelector: true
        };
        bottomPanel = {
            label: "You Receive",
            balance: `Balance: ${formatBigNumber(State.currentUserBalance || 0n).toFixed(2)}`,
            amount: (TradeState.netSellPrice > 0n ? formatBigNumber(TradeState.netSellPrice).toFixed(2) : "0.00"),
            symbol: "BKC",
            img: bkcLogoPath,
            isSelector: false
        };
    }

    contentEl.innerHTML = `
        <div class="swap-panel mb-1">
            <div class="panel-header"><span>${topPanel.label}</span><span>${topPanel.balance}</span></div>
            <div class="panel-content">
                <input type="text" class="swap-input" value="${topPanel.amount}" readonly placeholder="0.0">
                <button class="token-selector ${topPanel.isSelector ? 'is-selector' : 'cursor-default'}" ${!topPanel.isSelector ? 'disabled' : ''}>
                    <img src="${buildImageUrl(topPanel.img || bkcLogoPath)}" alt="${topPanel.symbol}">
                    <span>${topPanel.symbol}</span>
                    ${topPanel.isSelector ? '<i class="fa-solid fa-chevron-down text-xs ml-1"></i>' : ''}
                </button>
            </div>
        </div>
        <div class="swap-arrow-container"><button class="swap-arrow-btn"><i class="fa-solid fa-arrow-down"></i></button></div>
        <div class="swap-panel mt-1">
            <div class="panel-header"><span>${bottomPanel.label}</span><span>${bottomPanel.balance}</span></div>
            <div class="panel-content">
                <input type="text" class="swap-input" value="${bottomPanel.amount}" readonly placeholder="0.0">
                <button class="token-selector ${bottomPanel.isSelector ? 'is-selector' : 'cursor-default'}" ${!bottomPanel.isSelector ? 'disabled' : ''}>
                    <img src="${buildImageUrl(bottomPanel.img || bkcLogoPath)}" alt="${bottomPanel.symbol}">
                    <span>${bottomPanel.symbol}</span>
                    ${bottomPanel.isSelector ? '<i class="fa-solid fa-chevron-down text-xs ml-1"></i>' : ''}
                </button>
            </div>
        </div>
    `;
}

function renderExecuteButton() {
    const container = document.getElementById('swap-box-button-container');
    if (!container) return;
    if (TradeState.isDataLoading) { container.innerHTML = `<button class="action-btn" disabled>Initializing...</button>`; return; }

    let text = "Select a Booster";
    let active = false;
    let actionType = "trade"; 

    if (!State.isConnected) { text = "Connect Wallet"; actionType = "connect"; active = true; } 
    else if (TradeState.selectedPoolBoostBips !== null) {
        if (!TradeState.meetsPStakeRequirement) { text = "Insufficient pStake (Delegate Now)"; active = true; actionType = "delegate"; }
        else if (TradeState.tradeDirection === 'buy') {
            if (TradeState.buyPrice === 0n) { text = "Price Unavailable"; }
            else if (TradeState.buyPrice > State.currentUserBalance) { text = "Insufficient BKC Balance"; }
            else if (TradeState.firstAvailableTokenIdForBuy === null) { text = "Sold Out"; }
            else { text = "Buy Booster"; active = true; }
        } 
        else { 
            if (TradeState.userBalanceOfSelectedNFT === 0) { text = "No NFT to Sell"; }
            else if (TradeState.netSellPrice === 0n) { text = "Pool Liquidity Low"; }
            else if (TradeState.firstAvailableTokenId === null) { text = "Error: NFT ID not found"; }
            else { text = "Sell Booster"; active = true; }
        }
    }
    container.innerHTML = `<button id="execute-trade-btn" class="action-btn ${active ? 'active' : ''}" ${!active ? 'disabled' : ''} data-action="${actionType}">${text}</button>`;
}

function renderPoolSelectorModal() {
    const list = document.getElementById('pool-modal-list');
    if (!list) return;
    list.innerHTML = boosterTiers.map(tier => `
        <div class="pool-item" data-boostbips="${tier.boostBips}">
            <img src="${buildImageUrl(tier.img)}" alt="${tier.name}">
            <div class="flex flex-col"><span class="text-white font-bold">${tier.name}</span><span class="text-xs text-zinc-500">+${tier.boostBips / 100}% Power</span></div>
            <div class="ml-auto text-amber-500 text-xs font-mono">${TradeState.selectedPoolBoostBips === tier.boostBips ? '<i class="fa-solid fa-check"></i>' : ''}</div>
        </div>`).join('');
}

// --- RENDERIZAÇÃO DE INVENTÁRIO E HISTÓRICO ---

function renderInventory() {
    const el = document.getElementById('inventory-content');
    if (!el) return;
    
    if (!State.isConnected) {
        el.innerHTML = `<div class="text-zinc-500 text-xs text-center py-4">Connect wallet to view inventory</div>`;
        return;
    }

    if (!State.myBoosters || State.myBoosters.length === 0) {
        el.innerHTML = `<div class="text-zinc-500 text-xs text-center py-4">No Boosters found</div>`;
        return;
    }

    el.innerHTML = `<div class="inventory-grid">
        ${State.myBoosters.map(nft => {
            const tier = boosterTiers.find(t => t.boostBips === nft.boostBips) || { name: 'Unknown', img: null };
            return `
                <div class="inventory-item" data-boostbips="${nft.boostBips}" title="Click to Sell">
                    <img src="${buildImageUrl(tier.img)}" alt="${tier.name}">
                    <span>${tier.name}</span>
                    <span class="text-[9px] text-zinc-600">#${nft.tokenId}</span>
                </div>
            `;
        }).join('')}
    </div>`;
}

async function loadStoreHistory() {
    const el = document.getElementById('store-history-content');
    if (!el || !State.isConnected) { if(el) el.innerHTML = `<div class="text-zinc-500 text-xs text-center py-4">Connect to view history</div>`; return; }

    try {
        const response = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
        if (!response.ok) throw new Error("API Error");
        
        const data = await response.json();
        const history = data.filter(tx => tx.type === 'BoosterBuy' || tx.type === 'NFTSold' || tx.type === 'NFTBought');
        
        if (history.length === 0) {
            el.innerHTML = `<div class="text-zinc-500 text-xs text-center py-4">No recent trades found</div>`;
            return;
        }

        el.innerHTML = `
            <table class="history-table">
                <thead><tr><th>Action</th><th>Item</th><th>Price</th><th>Time</th></tr></thead>
                <tbody>
                    ${history.slice(0, 5).map(tx => {
                        const isBuy = tx.type === 'BoosterBuy' || tx.type === 'NFTBought';
                        let itemName = "Booster";
                        const price = formatBigNumber(BigInt(tx.details.amount || 0)).toFixed(2);
                        const date = new Date(tx.timestamp || Date.now()).toLocaleDateString();
                        
                        return `
                            <tr>
                                <td><span class="tx-type ${isBuy ? 'type-buy' : 'type-sell'}">${isBuy ? 'BUY' : 'SELL'}</span></td>
                                <td>${itemName} #${tx.details.tokenId}</td>
                                <td>${price} BKC</td>
                                <td>${date}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

    } catch (e) {
        console.error("History Error:", e);
        el.innerHTML = `<div class="text-red-500/50 text-xs text-center py-4">Failed to load history</div>`;
    }
}

// --- LÓGICA DE DADOS ---

async function loadDataForSelectedPool() {
    const now = Date.now();
    if (now - TradeState.lastFetchTimestamp < 3000 && TradeState.isDataLoading) return;
    if (TradeState.selectedPoolBoostBips === null) return;
    
    TradeState.isDataLoading = true;
    TradeState.lastFetchTimestamp = now;
    
    await renderPageStructure(); // Atualiza UI para estado Loading

    try {
        const boostBips = TradeState.selectedPoolBoostBips;
        const tier = boosterTiers.find(t => t.boostBips === boostBips);
        const poolKey = `pool_${tier.name.toLowerCase()}`;
        const poolAddress = addresses[poolKey];
        
        if (!poolAddress || !poolAddress.startsWith('0x')) throw new Error("Pool not deployed.");

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.publicProvider);

        if (State.isConnected) {
            await Promise.all([loadUserData(), loadMyBoostersFromAPI()]);
            const { highestBoost, tokenId } = await getHighestBoosterBoostFromAPI(); 
            TradeState.bestBoosterTokenId = tokenId ? BigInt(tokenId) : 0n;
            TradeState.bestBoosterBips = Number(highestBoost);

            const myTierBoosters = State.myBoosters.filter(b => b.boostBips === Number(boostBips));
            TradeState.userBalanceOfSelectedNFT = myTierBoosters.length;
            TradeState.firstAvailableTokenId = myTierBoosters.length > 0 ? BigInt(myTierBoosters[0].tokenId) : null;
        }

        const [buyPrice, sellPrice, availableTokenIds, baseTaxBips, discountBips, requiredPStake] = await Promise.all([
            safeContractCall(poolContract, 'getBuyPrice', [], ethers.MaxUint256),
            safeContractCall(poolContract, 'getSellPrice', [], 0n),
            safeContractCall(poolContract, 'getAvailableTokenIds', [], []),
            Promise.resolve(State.systemFees?.["NFT_POOL_TAX_BIPS"] || 1000n), 
            Promise.resolve(BigInt(State.boosterDiscounts?.[TradeState.bestBoosterBips] || 0)),
            Promise.resolve(State.systemPStakes?.["NFT_POOL_ACCESS"] || 0n)
        ]);

        TradeState.firstAvailableTokenIdForBuy = (availableTokenIds.length > 0) ? BigInt(availableTokenIds[availableTokenIds.length - 1]) : null;
        TradeState.buyPrice = (buyPrice === ethers.MaxUint256) ? 0n : buyPrice; 
        TradeState.sellPrice = sellPrice;
        
        const finalTaxBips = (baseTaxBips > discountBips) ? (baseTaxBips - discountBips) : 0n;
        const taxAmount = (sellPrice * finalTaxBips) / 10000n;
        TradeState.netSellPrice = sellPrice - taxAmount;

        TradeState.meetsPStakeRequirement = !(State.isConnected && State.userTotalPStake < requiredPStake);

    } catch (err) {
        console.warn("Store Data Warning:", err.message);
    } finally {
        stopLoadingAnimation();
        setTimeout(async () => {
            TradeState.isDataLoading = false;
            await renderSwapPanels();
            renderExecuteButton();
            renderInventory(); // Refresh inventory after load
        }, 500);
    }
}

// --- EVENT LISTENERS ---

function setupStorePageListeners() {
    const storeSection = document.getElementById('store');
    if (!storeSection) return;

    storeSection.addEventListener('click', async (e) => {
        // Swap Direction
        if (e.target.closest('.swap-arrow-btn')) {
            e.preventDefault();
            TradeState.tradeDirection = (TradeState.tradeDirection === 'buy') ? 'sell' : 'buy';
            await renderSwapPanels();
            renderExecuteButton();
            return;
        }
        // Modal Open/Close
        if (e.target.closest('.token-selector.is-selector')) { e.preventDefault(); document.getElementById('pool-select-modal').classList.add('open'); return; }
        if (e.target.closest('.pool-modal-close') || e.target.classList.contains('modal-overlay')) { e.preventDefault(); document.getElementById('pool-select-modal').classList.remove('open'); return; }
        
        // Select Pool from Modal
        const poolItem = e.target.closest('.pool-item');
        if (poolItem) {
            e.preventDefault();
            TradeState.selectedPoolBoostBips = Number(poolItem.dataset.boostbips);
            document.getElementById('pool-select-modal').classList.remove('open');
            await loadDataForSelectedPool();
            return;
        }

        // Inventory Click (Auto-Sell)
        const invItem = e.target.closest('.inventory-item');
        if (invItem) {
            e.preventDefault();
            const boostBips = Number(invItem.dataset.boostbips);
            if (TradeState.selectedPoolBoostBips !== boostBips || TradeState.tradeDirection !== 'sell') {
                TradeState.selectedPoolBoostBips = boostBips;
                TradeState.tradeDirection = 'sell';
                await loadDataForSelectedPool();
            }
            return;
        }

        // Execute Button
        const executeBtn = e.target.closest('#execute-trade-btn');
        if (executeBtn && !executeBtn.disabled) {
            e.preventDefault();
            const action = executeBtn.dataset.action;
            if (action === "connect") { window.openConnectModal(); return; }
            if (action === "delegate") { document.querySelector('.sidebar-link[data-target="mine"]')?.click(); return; }

            const tier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
            if (!tier) return;
            const poolKey = `pool_${tier.name.toLowerCase()}`;
            const poolAddress = addresses[poolKey];

            if (TradeState.tradeDirection === 'buy') {
                const success = await executeBuyBooster(poolAddress, TradeState.buyPrice, TradeState.bestBoosterTokenId, executeBtn);
                if (success) { await loadDataForSelectedPool(); loadStoreHistory(); }
            } else {
                const success = await executeSellBooster(poolAddress, TradeState.firstAvailableTokenId, TradeState.bestBoosterTokenId, executeBtn);
                if (success) { await loadDataForSelectedPool(); loadStoreHistory(); }
            }
        }
    });
}

const storeEl = document.getElementById('store');
if (storeEl && !storeEl._listenersInitialized) {
    setupStorePageListeners();
    storeEl._listenersInitialized = true;
}

// --- EXPORT ---

export const StorePage = {
    async render(isNewPage) {
        await loadSystemDataFromAPI();
        
        const container = document.getElementById('store');
        if (container && !container.innerHTML.includes('store-layout')) {
            await renderPageStructure();
        }
        
        if (TradeState.selectedPoolBoostBips === null && boosterTiers.length > 0) {
            TradeState.selectedPoolBoostBips = boosterTiers[0].boostBips; 
        }
        
        await loadDataForSelectedPool();
    },

    async update() {
        if (TradeState.selectedPoolBoostBips !== null) {
            if (!document.hidden && document.getElementById('store').classList.contains('active')) {
                if(!TradeState.isDataLoading) await loadDataForSelectedPool();
            }
        }
    }
};