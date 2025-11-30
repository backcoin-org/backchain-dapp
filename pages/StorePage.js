// pages/StorePage.js
// ✅ VERSÃO FINAL V7.2: Tax Visibility (10%) + Modal CSS Fix

const ethers = window.ethers;

import { State } from '../state.js';
import { loadUserData, loadMyBoostersFromAPI, safeContractCall, getHighestBoosterBoostFromAPI, loadSystemDataFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { executeBuyBooster, executeSellBooster } from '../modules/transactions.js';
import { formatBigNumber } from '../utils.js'; 
import { boosterTiers, addresses, nftPoolABI, ipfsGateway, sepoliaRpcUrl } from '../config.js'; 

// --- HELPER: DATA FORMATAÇÃO ROBUSTA ---
function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    try {
        if (timestamp.seconds || timestamp._seconds) {
            const secs = timestamp.seconds || timestamp._seconds;
            return new Date(secs * 1000).toLocaleString(); 
        }
        return new Date(timestamp).toLocaleString();
    } catch (e) {
        return 'Recent';
    }
}

// --- HELPER: BLOCKCHAIN EXPLORER URL ---
function getExplorerUrl(txHash) {
    const baseUrl = "https://sepolia.etherscan.io/tx/";
    return `${baseUrl}${txHash}`;
}

// --- INJEÇÃO DE ESTILOS (CSS) ---
const style = document.createElement('style');
style.innerHTML = `
    /* LAYOUT GRID */
    .store-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; width: 100%; max-width: 1100px; margin: 0 auto; padding-top: 2rem; }
    @media (max-width: 1024px) { .store-layout { grid-template-columns: 1fr; } }

    /* SWAP CARD */
    .swap-card { background: #131313; border: 1px solid #27272a; border-radius: 24px; padding: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    .swap-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; color: #fff; }
    .swap-header h3 { font-size: 16px; font-weight: 600; margin: 0; }
    
    .swap-panel { background: #1b1b1b; border-radius: 16px; padding: 16px; border: 1px solid transparent; transition: border 0.2s; }
    .swap-panel:hover { border-color: #27272a; }
    
    .panel-header { display: flex; justify-content: space-between; font-size: 12px; color: #71717a; margin-bottom: 8px; }
    .panel-content { display: flex; justify-content: space-between; align-items: center; }
    .swap-input { background: transparent; border: none; color: #fff; font-size: 28px; font-weight: 500; width: 60%; outline: none; padding: 0; }
    
    .token-selector { background: #27272a; border-radius: 20px; padding: 6px 12px; display: flex; align-items: center; gap: 8px; color: #fff; border: none; cursor: pointer; transition: background 0.2s; font-weight: 600; font-size: 16px; }
    .token-selector:hover { background: #3f3f46; }
    .token-selector img { width: 24px; height: 24px; border-radius: 50%; }
    
    .swap-arrow-container { position: relative; height: 14px; display: flex; justify-content: center; align-items: center; z-index: 10; }
    .swap-arrow-btn { background: #1b1b1b; border: 4px solid #131313; border-radius: 12px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: #71717a; cursor: pointer; transition: all 0.2s; }
    .swap-arrow-btn:hover { color: #f59e0b; border-color: #131313; transform: scale(1.1); }

    .action-btn { width: 100%; padding: 16px; border-radius: 20px; border: none; font-size: 18px; font-weight: 600; margin-top: 8px; cursor: pointer; transition: all 0.2s; background: #2d2d35; color: #71717a; }
    .action-btn.active { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); color: #1a1a1a; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); }
    .action-btn.active:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4); }

    /* MODAL POOL SELECTOR FIX */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: none; align-items: center; justify-content: center; z-index: 1000; }
    .modal-overlay.open { display: flex; }
    
    .pool-list { max-height: 400px; overflow-y: auto; padding-right: 5px; display: flex; flex-direction: column; gap: 8px; }
    .pool-item { 
        display: flex; align-items: center; gap: 12px; padding: 12px; 
        background: #27272a; border-radius: 12px; cursor: pointer; transition: background 0.2s;
        border: 1px solid transparent;
    }
    .pool-item:hover { background: #3f3f46; border-color: #f59e0b; }
    .pool-item img { width: 32px; height: 32px; border-radius: 50%; }
    
    /* INVENTORY & ADD TO WALLET */
    .info-card { background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 20px; margin-bottom: 20px; }
    .info-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
    
    .inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 12px; }
    .inventory-item { 
        background: #27272a; border-radius: 12px; padding: 10px; position: relative; 
        transition: all 0.2s; display: flex; flex-direction: column; align-items: center; 
        border: 1px solid transparent; cursor: pointer;
    }
    .inventory-item:hover { border-color: #f59e0b; background: #3f3f46; transform: translateY(-2px); }
    .inventory-item img { width: 48px; height: 48px; margin-bottom: 8px; }
    
    .add-wallet-btn { 
        position: absolute; top: -6px; right: -6px; 
        width: 24px; height: 24px; 
        background: #f59e0b; 
        border: 2px solid #18181b; 
        border-radius: 50%; 
        color: #000; 
        font-size: 11px;
        display: flex; align-items: center; justify-content: center; 
        opacity: 1; 
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        cursor: pointer; z-index: 10;
        transition: transform 0.2s;
    }
    .add-wallet-btn:hover { transform: scale(1.15); background: #fbbf24; }

    /* HISTORY & PERKS */
    .history-card { background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 20px; margin-top: 24px; }
    .history-table { width: 100%; border-collapse: collapse; }
    .history-table th { text-align: left; font-size: 11px; color: #71717a; padding-bottom: 10px; text-transform: uppercase; }
    .history-table td { padding: 10px 0; font-size: 13px; color: #d4d4d8; border-bottom: 1px solid #27272a; }
    .history-table tr:last-child td { border-bottom: none; }
    .tx-type { font-weight: 700; font-size: 11px; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
    .type-buy { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .type-sell { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    
    .tx-link { color: #71717a; text-decoration: none; display: flex; align-items: center; gap: 4px; transition: color 0.2s; font-size: 12px; }
    .tx-link:hover { color: #f59e0b; text-decoration: underline; }

    .perk-item { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }
    .perk-icon { width: 32px; height: 32px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #f59e0b; flex-shrink: 0; }
    .perk-text h4 { font-size: 13px; color: #fff; margin: 0 0 2px 0; font-weight: 600; }
    .perk-text p { font-size: 11px; color: #a1a1aa; margin: 0; line-height: 1.4; }

    /* LOADERS */
    .store-loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; width: 100%; }
    .store-logo-pulse { width: 64px; height: 64px; margin-bottom: 20px; animation: logoPulse 2s infinite ease-in-out; }
    @keyframes logoPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
    .loader-bar-track { width: 80%; height: 4px; background: #27272a; border-radius: 10px; overflow: hidden; position: relative; }
    .loader-bar-fill { height: 100%; background: #f59e0b; width: 0%; border-radius: 10px; transition: width 0.1s linear; }
`;
document.head.appendChild(style);

// --- ESTADO LOCAL ---
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
    lastFetchTimestamp: 0,
    loaderInterval: null,
    loadingProgress: 0
};

// --- HELPER: IMAGENS ---
function buildImageUrl(ipfsIoUrl) {
    if (!ipfsIoUrl) return './assets/bkc_logo_3d.png'; 
    if (ipfsIoUrl.startsWith('https://') || ipfsIoUrl.startsWith('http://')) return ipfsIoUrl;
    if (ipfsIoUrl.includes('ipfs.io/ipfs/')) return `${ipfsGateway}${ipfsIoUrl.split('ipfs.io/ipfs/')[1]}`;
    if (ipfsIoUrl.startsWith('ipfs://')) return `${ipfsGateway}${ipfsIoUrl.substring(7)}`;
    return ipfsIoUrl;
}

// --- ADD TO METAMASK ---
async function addToWallet(tokenId, imageUrl) {
    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC721',
                options: {
                    address: addresses.rewardBoosterNFT,
                    tokenId: tokenId.toString(),
                    symbol: "BKCB",
                    image: imageUrl 
                },
            },
        });
    } catch (error) {
        console.error("MetaMask Error:", error);
    }
}

// --- LOADERS ---
function renderStoreLoader() {
    return `
        <div class="store-loader-container">
            <img src="assets/bkc_logo_3d.png" class="store-logo-pulse">
            <div id="store-loader-msg" class="text-xs text-zinc-500 font-mono mb-4">INITIALIZING MARKET...</div>
            <div class="loader-bar-track"><div id="store-loader-fill" class="loader-bar-fill"></div></div>
        </div>`;
}

function startLoadingAnimation() {
    TradeState.loadingProgress = 0;
    const barEl = document.getElementById('store-loader-fill');
    if (!barEl) return;
    if (TradeState.loaderInterval) clearInterval(TradeState.loaderInterval);
    TradeState.loaderInterval = setInterval(() => {
        if(TradeState.loadingProgress < 90) TradeState.loadingProgress += 2;
        if (barEl) barEl.style.width = `${TradeState.loadingProgress}%`;
    }, 50);
}

function stopLoadingAnimation() {
    if (TradeState.loaderInterval) clearInterval(TradeState.loaderInterval);
    const barEl = document.getElementById('store-loader-fill');
    if (barEl) barEl.style.width = '100%';
}

// --- RENDERIZAÇÃO PRINCIPAL ---

async function renderPageStructure() {
    const root = document.getElementById('store'); 
    if (!root) return;
    
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
                        <div class="info-title"><i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> Recent Activity</div>
                        <div id="store-history-content"><div class="text-center py-4"><div class="simple-loader"></div></div></div>
                    </div>
                </div>
                <div class="right-column">
                    <div class="info-card">
                        <div class="info-title"><i class="fa-solid fa-box-open text-amber-500"></i> My Inventory</div>
                        <div id="inventory-content" class="min-h-[80px]"></div>
                    </div>
                    <div class="info-card">
                        <div class="info-title"><i class="fa-solid fa-star text-purple-500"></i> Perks</div>
                        <div class="perk-item"><div class="perk-icon"><i class="fa-solid fa-bolt"></i></div><div class="perk-text"><h4>Staking Power</h4><p>Higher tiers boost staking APY.</p></div></div>
                        <div class="perk-item"><div class="perk-icon"><i class="fa-solid fa-tag"></i></div><div class="perk-text"><h4>Fee Discounts</h4><p>Up to 70% off ecosystem fees.</p></div></div>
                    </div>
                </div>
            </div>
            <div id="pool-select-modal" class="modal-overlay">
                <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-4 shadow-2xl relative animate-bounce-slow max-h-[80vh] flex flex-col">
                    <div class="flex justify-between items-center mb-4 px-2 pt-2">
                        <h4 class="text-white font-bold">Select Booster Tier</h4>
                        <button class="pool-modal-close text-zinc-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    <div id="pool-modal-list" class="pool-list custom-scrollbar flex-1 overflow-y-auto"></div>
                </div>
            </div>
        `;
    }
    
    if (TradeState.isDataLoading) {
        document.getElementById('swap-box-content').innerHTML = renderStoreLoader();
        startLoadingAnimation();
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
    if (!contentEl || TradeState.isDataLoading) return;

    const selectedTier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
    const bkcLogoPath = "assets/bkc_logo_3d.png";

    let topPanel, bottomPanel;

    if (TradeState.tradeDirection === 'buy') {
        topPanel = {
            label: "You Pay",
            balance: `Balance: ${formatBigNumber(State.currentUserBalance || 0n).toFixed(2)}`,
            amount: (TradeState.buyPrice > 0n ? formatBigNumber(TradeState.buyPrice).toFixed(2) : "0.00"),
            symbol: "BKC", img: bkcLogoPath, isSelector: false
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
        
        // MOSTRA O PREÇO LÍQUIDO (COM TAXA DE 10%)
        const netAmount = (TradeState.netSellPrice > 0n ? formatBigNumber(TradeState.netSellPrice).toFixed(2) : "0.00");
        const taxInfo = TradeState.netSellPrice < TradeState.sellPrice 
            ? `<span class="text-xs text-red-500 ml-2 font-bold">(-10% Fee)</span>` 
            : "";

        bottomPanel = {
            label: "You Receive",
            balance: `Balance: ${formatBigNumber(State.currentUserBalance || 0n).toFixed(2)}`,
            amount: netAmount,
            symbol: "BKC", img: bkcLogoPath, isSelector: false,
            extraHtml: taxInfo
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
                <div class="flex flex-col w-full">
                    <div class="flex justify-between items-center w-full">
                         <input type="text" class="swap-input" value="${bottomPanel.amount}" readonly placeholder="0.0">
                         <button class="token-selector ${bottomPanel.isSelector ? 'is-selector' : 'cursor-default'}" ${!bottomPanel.isSelector ? 'disabled' : ''}>
                            <img src="${buildImageUrl(bottomPanel.img || bkcLogoPath)}" alt="${bottomPanel.symbol}">
                            <span>${bottomPanel.symbol}</span>
                            ${bottomPanel.isSelector ? '<i class="fa-solid fa-chevron-down text-xs ml-1"></i>' : ''}
                        </button>
                    </div>
                    ${bottomPanel.extraHtml ? `<div class="mt-1 text-right">${bottomPanel.extraHtml}</div>` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderExecuteButton() {
    const container = document.getElementById('swap-box-button-container');
    if (!container || TradeState.isDataLoading) return;

    let text = "Select a Booster", active = false, actionType = "trade"; 

    if (!State.isConnected) { text = "Connect Wallet"; actionType = "connect"; active = true; } 
    else if (TradeState.selectedPoolBoostBips !== null) {
        if (!TradeState.meetsPStakeRequirement) { text = "Insufficient pStake (Delegate Now)"; active = true; actionType = "delegate"; }
        else if (TradeState.tradeDirection === 'buy') {
            if (TradeState.buyPrice === 0n) text = "Price Unavailable";
            else if (TradeState.buyPrice > State.currentUserBalance) text = "Insufficient BKC Balance";
            else if (TradeState.firstAvailableTokenIdForBuy === null) text = "Sold Out";
            else { text = "Buy Booster"; active = true; }
        } 
        else { 
            if (TradeState.userBalanceOfSelectedNFT === 0) text = "No NFT to Sell";
            else if (TradeState.netSellPrice === 0n) text = "Pool Liquidity Low";
            else if (TradeState.firstAvailableTokenId === null) text = "Loading NFT ID...";
            else { text = "Sell Booster (-10% Fee)"; active = true; }
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

// --- RENDERIZAÇÃO DE INVENTÁRIO (BOTÃO VISÍVEL) ---

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
            const imgUrl = buildImageUrl(tier.img);
            return `
                <div class="inventory-item group" data-boostbips="${nft.boostBips}" title="Click to Sell">
                    <button class="add-wallet-btn" onclick="event.stopPropagation();" data-id="${nft.tokenId}" data-img="${imgUrl}" title="Add to Metamask">
                        <i class="fa-solid fa-wallet"></i>
                    </button>
                    <img src="${imgUrl}" alt="${tier.name}" class="item-img">
                    <span class="text-[9px] text-zinc-400 font-bold">${tier.name}</span>
                    <span class="text-[9px] text-zinc-600">#${nft.tokenId}</span>
                </div>
            `;
        }).join('')}
    </div>`;

    // Bind listeners
    el.querySelectorAll('.add-wallet-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToWallet(btn.dataset.id, btn.dataset.img);
        });
    });
}

// --- HISTÓRICO COM LINK E DATA CORRIGIDA ---

async function loadStoreHistory() {
    const el = document.getElementById('store-history-content');
    if (!el || !State.isConnected) { if(el) el.innerHTML = `<div class="text-zinc-500 text-xs text-center py-4">Connect to view history</div>`; return; }

    try {
        const response = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
        if (!response.ok) throw new Error("API Error");
        
        const data = await response.json();
        // Filtro completo
        const history = data.filter(tx => 
            tx.type === 'BoosterBuy' || 
            tx.type === 'NFTSold' || 
            tx.type === 'NFTBought' ||
            tx.type === 'PublicSale' 
        );
        
        if (history.length === 0) {
            el.innerHTML = `<div class="text-zinc-500 text-xs text-center py-4">No recent trades found</div>`;
            return;
        }

        el.innerHTML = `
            <table class="history-table">
                <thead><tr><th>Action</th><th>Item</th><th>Price</th><th>Time</th></tr></thead>
                <tbody>
                    ${history.slice(0, 5).map(tx => {
                        const isBuy = tx.type === 'BoosterBuy' || tx.type === 'NFTBought' || tx.type === 'PublicSale';
                        const itemName = "Booster";
                        const price = formatBigNumber(BigInt(tx.details.amount || tx.amount || 0)).toFixed(2);
                        
                        const dateStr = formatDate(tx.timestamp || tx.createdAt);
                        const tokenId = tx.details.tokenId || tx.tokenId || '?';
                        const txLink = getExplorerUrl(tx.txHash);
                        
                        return `
                            <tr>
                                <td><span class="tx-type ${isBuy ? 'type-buy' : 'type-sell'}">${isBuy ? 'BUY' : 'SELL'}</span></td>
                                <td>${itemName} #${tokenId}</td>
                                <td>${price} BKC</td>
                                <td>
                                    <a href="${txLink}" target="_blank" class="tx-link">
                                        ${dateStr} <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                                    </a>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

    } catch (e) {
        console.error("Hist error", e);
        el.innerHTML = `<div class="text-red-500/50 text-xs text-center py-4">History unavailable</div>`;
    }
}

// --- DATA FETCHING ---

async function loadDataForSelectedPool() {
    const now = Date.now();
    if (now - TradeState.lastFetchTimestamp < 3000 && TradeState.isDataLoading) return;
    if (TradeState.selectedPoolBoostBips === null) return;
    
    TradeState.isDataLoading = true;
    TradeState.lastFetchTimestamp = now;
    
    await renderPageStructure();

    try {
        const boostBips = TradeState.selectedPoolBoostBips;
        const tier = boosterTiers.find(t => t.boostBips === boostBips);
        const poolKey = `pool_${tier.name.toLowerCase()}`;
        const poolAddress = addresses[poolKey];
        
        if (!poolAddress || !poolAddress.startsWith('0x')) throw new Error("Pool not deployed.");

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.publicProvider);
        const boosterContract = State.rewardBoosterContract || State.rewardBoosterContractPublic;

        if (State.isConnected) {
            await Promise.all([loadUserData(), loadMyBoostersFromAPI()]);
            const { highestBoost, tokenId } = await getHighestBoosterBoostFromAPI(); 
            TradeState.bestBoosterTokenId = tokenId ? BigInt(tokenId) : 0n;
            TradeState.bestBoosterBips = Number(highestBoost);

            const myTierBoosters = State.myBoosters.filter(b => b.boostBips === Number(boostBips));
            TradeState.firstAvailableTokenId = null;
            TradeState.userBalanceOfSelectedNFT = myTierBoosters.length;
            
            if (myTierBoosters.length > 0 && boosterContract) {
                for (const booster of myTierBoosters) {
                    try {
                        const owner = await safeContractCall(boosterContract, 'ownerOf', [booster.tokenId], ethers.ZeroAddress);
                        if (owner.toLowerCase() === State.userAddress.toLowerCase()) {
                            TradeState.firstAvailableTokenId = BigInt(booster.tokenId);
                            break; 
                        }
                        await new Promise(r => setTimeout(r, 100)); 
                    } catch (e) {
                         if (!TradeState.firstAvailableTokenId) TradeState.firstAvailableTokenId = BigInt(booster.tokenId);
                    }
                }
            }
        }

        const [buyPrice, sellPrice, availableTokenIds, baseTaxBips, discountBips, requiredPStake] = await Promise.all([
            safeContractCall(poolContract, 'getBuyPrice', [], ethers.MaxUint256),
            safeContractCall(poolContract, 'getSellPrice', [], 0n),
            safeContractCall(poolContract, 'getAvailableTokenIds', [], []),
            Promise.resolve(State.systemFees?.["NFT_POOL_SELL_TAX_BIPS"] || 1000n), // Força leitura da chave correta
            Promise.resolve(BigInt(State.boosterDiscounts?.[TradeState.bestBoosterBips] || 0)),
            Promise.resolve(State.systemPStakes?.["NFT_POOL_ACCESS"] || 0n)
        ]);

        TradeState.firstAvailableTokenIdForBuy = (availableTokenIds.length > 0) ? BigInt(availableTokenIds[availableTokenIds.length - 1]) : null;
        TradeState.buyPrice = (buyPrice === ethers.MaxUint256) ? 0n : buyPrice; 
        TradeState.sellPrice = sellPrice;
        
        // CÁLCULO DA TAXA DE VENDA
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
            renderInventory(); 
        }, 500);
    }
}

// --- EVENT LISTENERS ---

function setupStorePageListeners() {
    const storeSection = document.getElementById('store');
    if (!storeSection) return;

    storeSection.addEventListener('click', async (e) => {
        if (e.target.closest('.add-wallet-btn')) return; 

        if (e.target.closest('.swap-arrow-btn')) {
            e.preventDefault();
            TradeState.tradeDirection = (TradeState.tradeDirection === 'buy') ? 'sell' : 'buy';
            await renderSwapPanels();
            renderExecuteButton();
            return;
        }
        if (e.target.closest('.token-selector.is-selector')) { e.preventDefault(); document.getElementById('pool-select-modal').classList.add('open'); return; }
        if (e.target.closest('.pool-modal-close') || e.target.classList.contains('modal-overlay')) { e.preventDefault(); document.getElementById('pool-select-modal').classList.remove('open'); return; }
        
        const poolItem = e.target.closest('.pool-item');
        if (poolItem) {
            e.preventDefault();
            TradeState.selectedPoolBoostBips = Number(poolItem.dataset.boostbips);
            document.getElementById('pool-select-modal').classList.remove('open');
            await loadDataForSelectedPool();
            return;
        }

        const invItem = e.target.closest('.inventory-item');
        if (invItem && !e.target.closest('.add-wallet-btn')) {
            e.preventDefault();
            const boostBips = Number(invItem.dataset.boostbips);
            if (TradeState.selectedPoolBoostBips !== boostBips || TradeState.tradeDirection !== 'sell') {
                TradeState.selectedPoolBoostBips = boostBips;
                TradeState.tradeDirection = 'sell';
                await loadDataForSelectedPool();
            }
            return;
        }

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