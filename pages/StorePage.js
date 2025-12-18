// pages/StorePage.js
// ✅ PRODUCTION V8.0 - Animated Trade Image + Enhanced UI + Consistent Icons

const ethers = window.ethers;

import { State } from '../state.js';
import { loadUserData, loadMyBoostersFromAPI, safeContractCall, getHighestBoosterBoostFromAPI, loadSystemDataFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { executeBuyBooster, executeSellBooster } from '../modules/transactions.js';
import { formatBigNumber, renderNoData } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers, addresses, nftPoolABI, ipfsGateway } from '../config.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const TRADE_IMAGE = "./assets/trade.png";
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";

// ============================================================================
// TIER CONFIGURATION
// ============================================================================
const TIER_CONFIG = {
    'Crystal': { 
        color: '#a855f7',
        gradient: 'from-purple-500/20 to-violet-600/20',
        border: 'border-purple-500/40',
        text: 'text-purple-400',
        glow: 'shadow-purple-500/30',
        icon: '💎'
    },
    'Diamond': { 
        color: '#22d3ee',
        gradient: 'from-cyan-500/20 to-blue-500/20',
        border: 'border-cyan-500/40',
        text: 'text-cyan-400',
        glow: 'shadow-cyan-500/30',
        icon: '💠'
    },
    'Platinum': { 
        color: '#e2e8f0',
        gradient: 'from-slate-300/20 to-gray-400/20',
        border: 'border-slate-400/40',
        text: 'text-slate-300',
        glow: 'shadow-slate-400/30',
        icon: '⚪'
    },
    'Gold': { 
        color: '#fbbf24',
        gradient: 'from-yellow-500/20 to-amber-500/20',
        border: 'border-yellow-500/40',
        text: 'text-yellow-400',
        glow: 'shadow-yellow-500/30',
        icon: '🥇'
    },
    'Silver': { 
        color: '#9ca3af',
        gradient: 'from-gray-400/20 to-slate-400/20',
        border: 'border-gray-400/40',
        text: 'text-gray-300',
        glow: 'shadow-gray-400/30',
        icon: '🥈'
    },
    'Bronze': { 
        color: '#f97316',
        gradient: 'from-orange-600/20 to-amber-700/20',
        border: 'border-orange-600/40',
        text: 'text-orange-400',
        glow: 'shadow-orange-500/30',
        icon: '🥉'
    },
    'Iron': { 
        color: '#6b7280',
        gradient: 'from-gray-500/20 to-zinc-600/20',
        border: 'border-gray-500/40',
        text: 'text-gray-400',
        glow: 'shadow-gray-500/30',
        icon: '⚙️'
    }
};

function getTierStyle(tierName) {
    return TIER_CONFIG[tierName] || TIER_CONFIG['Iron'];
}

// ============================================================================
// LOCAL STATE
// ============================================================================
const TradeState = {
    tradeDirection: 'buy',
    selectedPoolBoostBips: null,
    buyPrice: 0n,
    sellPrice: 0n,
    netSellPrice: 0n,
    poolNFTCount: 0,
    userBalanceOfSelectedNFT: 0,
    firstAvailableTokenId: null,
    firstAvailableTokenIdForBuy: null,
    bestBoosterTokenId: 0n,
    bestBoosterBips: 0,
    isDataLoading: false,
    lastFetchTimestamp: 0,
    tradeHistory: []
};

const poolAddressCache = new Map();
let isTransactionInProgress = false;

const factoryABI = [
    "function getPoolAddress(uint256 boostBips) view returns (address)",
    "function isPool(address) view returns (bool)"
];

// ============================================================================
// HELPERS
// ============================================================================
function buildImageUrl(ipfsIoUrl) {
    if (!ipfsIoUrl) return './assets/bkc_logo_3d.png';
    if (ipfsIoUrl.startsWith('https://') || ipfsIoUrl.startsWith('http://')) return ipfsIoUrl;
    if (ipfsIoUrl.includes('ipfs.io/ipfs/')) return `${ipfsGateway}${ipfsIoUrl.split('ipfs.io/ipfs/')[1]}`;
    if (ipfsIoUrl.startsWith('ipfs://')) return `${ipfsGateway}${ipfsIoUrl.substring(7)}`;
    return ipfsIoUrl;
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        const date = new Date(secs * 1000);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
}

// ============================================================================
// INJECT STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('swap-styles-v8')) return;
    
    const style = document.createElement('style');
    style.id = 'swap-styles-v8';
    style.textContent = `
        /* Trade Image Animations */
        @keyframes trade-float {
            0%, 100% { transform: translateY(0) rotate(-1deg); }
            50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes trade-pulse {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(34,197,94,0.3)); }
            50% { filter: drop-shadow(0 0 30px rgba(34,197,94,0.6)); }
        }
        @keyframes trade-buy {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(34,197,94,0.4)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 40px rgba(34,197,94,0.7)); transform: scale(1.05); }
        }
        @keyframes trade-sell {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(239,68,68,0.4)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 40px rgba(239,68,68,0.7)); transform: scale(1.05); }
        }
        @keyframes trade-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        @keyframes trade-success {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); filter: drop-shadow(0 0 50px rgba(34,197,94,0.9)); }
            100% { transform: scale(1); }
        }
        .trade-float { animation: trade-float 4s ease-in-out infinite; }
        .trade-pulse { animation: trade-pulse 2s ease-in-out infinite; }
        .trade-buy { animation: trade-buy 2s ease-in-out infinite; }
        .trade-sell { animation: trade-sell 2s ease-in-out infinite; }
        .trade-spin { animation: trade-spin 1.5s ease-in-out; }
        .trade-success { animation: trade-success 0.8s ease-out; }
        
        .swap-container {
            font-family: 'Inter', -apple-system, sans-serif;
        }
        
        .swap-card {
            background: linear-gradient(180deg, rgba(24,24,27,0.95) 0%, rgba(9,9,11,0.98) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            backdrop-filter: blur(20px);
        }
        
        .tier-chip {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .tier-chip:hover {
            transform: translateY(-2px);
        }
        
        .tier-chip.active {
            transform: scale(1.05);
        }
        
        .swap-input-box {
            background: rgba(39,39,42,0.5);
            border: 1px solid rgba(63,63,70,0.4);
            transition: all 0.2s ease;
        }
        
        .swap-input-box:hover {
            border-color: rgba(113,113,122,0.5);
        }
        
        .swap-input-box.active {
            border-color: rgba(245,158,11,0.5);
            background: rgba(39,39,42,0.7);
        }
        
        .swap-arrow-btn {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .swap-arrow-btn:hover {
            transform: rotate(180deg);
            background: rgba(63,63,70,0.8);
        }
        
        .swap-btn {
            transition: all 0.2s ease;
        }
        
        .swap-btn:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 40px -10px currentColor;
        }
        
        .swap-btn:not(:disabled):active {
            transform: translateY(0);
        }
        
        .token-selector {
            background: rgba(39,39,42,0.8);
            border: 1px solid rgba(63,63,70,0.5);
            transition: all 0.2s ease;
        }
        
        .token-selector:hover {
            background: rgba(63,63,70,0.8);
            border-color: rgba(113,113,122,0.5);
        }
        
        .inventory-item {
            transition: all 0.2s ease;
        }
        
        .inventory-item:hover {
            transform: scale(1.05);
            border-color: rgba(245,158,11,0.5);
        }
        
        .history-item:hover {
            background: rgba(63,63,70,0.5) !important;
            transform: translateX(4px);
        }
        
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .skeleton {
            background: linear-gradient(90deg, rgba(39,39,42,0.5) 25%, rgba(63,63,70,0.5) 50%, rgba(39,39,42,0.5) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scroll::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
            background: rgba(39,39,42,0.3);
        }
        .custom-scroll::-webkit-scrollbar-thumb {
            background: rgba(113,113,122,0.5);
            border-radius: 2px;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// LOADING STATES
// ============================================================================
function renderLoading() {
    return `
        <div class="flex flex-col items-center justify-center py-12">
            <div class="relative w-16 h-16">
                <div class="absolute inset-0 rounded-full border-2 border-zinc-700"></div>
                <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-green-500 animate-spin"></div>
                <div class="absolute inset-2 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                    <img src="${TRADE_IMAGE}" class="w-10 h-10 object-contain" alt="" onerror="this.src='./assets/bkc_logo_3d.png'">
                </div>
            </div>
            <p class="text-zinc-500 text-xs mt-4">Loading pool...</p>
        </div>
    `;
}

// ============================================================================
// MAIN RENDER
// ============================================================================
export const StorePage = {
    async render(isNewPage) {
        injectStyles();
        await loadSystemDataFromAPI();
        
        const container = document.getElementById('store');
        if (!container) return;

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div class="swap-container max-w-lg mx-auto py-6 px-4">
                    
                    <!-- Header with Animated Trade Image -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-3">
                            <img src="${TRADE_IMAGE}" 
                                 alt="Trade" 
                                 class="w-14 h-14 object-contain trade-float trade-pulse"
                                 id="trade-mascot"
                                 onerror="this.style.display='none'">
                            <div>
                                <h1 class="text-lg font-semibold text-white">📈 NFT Swap</h1>
                                <p class="text-xs text-zinc-500">Trade Booster NFTs</p>
                            </div>
                        </div>
                        <button id="refresh-btn" class="w-8 h-8 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                            <i class="fa-solid fa-rotate text-xs"></i>
                        </button>
                    </div>
                    
                    <!-- Main Swap Card -->
                    <div class="swap-card rounded-2xl p-4 mb-4">
                        
                        <!-- Tier Selector -->
                        <div class="mb-4">
                            <div id="tier-selector" class="flex gap-2 overflow-x-auto pb-2 custom-scroll">
                                ${renderTierChips()}
                            </div>
                        </div>
                        
                        <!-- Swap Interface -->
                        <div id="swap-interface">
                            ${renderLoading()}
                        </div>
                        
                    </div>
                    
                    <!-- My NFTs (Collapsible) -->
                    <div class="swap-card rounded-2xl overflow-hidden mb-4">
                        <button id="inventory-toggle" class="w-full flex justify-between items-center p-4 hover:bg-zinc-800/30 transition-colors">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-wallet text-amber-500 text-sm"></i>
                                <span class="text-sm font-medium text-white">My NFTs</span>
                                <span id="nft-count" class="text-xs bg-zinc-700 px-2 py-0.5 rounded-full text-zinc-300">0</span>
                            </div>
                            <i id="inventory-chevron" class="fa-solid fa-chevron-down text-zinc-500 text-xs transition-transform"></i>
                        </button>
                        <div id="inventory-panel" class="hidden border-t border-zinc-800">
                            <div id="inventory-grid" class="p-4 grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto custom-scroll">
                                ${renderNoData("No NFTs")}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Trade History (Collapsible) -->
                    <div class="swap-card rounded-2xl overflow-hidden">
                        <button id="history-toggle" class="w-full flex justify-between items-center p-4 hover:bg-zinc-800/30 transition-colors">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-clock-rotate-left text-green-500 text-sm"></i>
                                <span class="text-sm font-medium text-white">Trade History</span>
                            </div>
                            <i id="history-chevron" class="fa-solid fa-chevron-down text-zinc-500 text-xs transition-transform"></i>
                        </button>
                        <div id="history-panel" class="hidden border-t border-zinc-800">
                            <div id="history-list" class="p-4 space-y-2 max-h-[250px] overflow-y-auto custom-scroll">
                                <div class="text-center py-4 text-xs text-zinc-600">Loading history...</div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            `;

            setupEventListeners();
        }

        if (TradeState.selectedPoolBoostBips === null && boosterTiers.length > 0) {
            TradeState.selectedPoolBoostBips = boosterTiers[0].boostBips;
        }

        await loadDataForSelectedPool();
        loadTradeHistory();
    },

    async update() {
        if (TradeState.selectedPoolBoostBips !== null && !TradeState.isDataLoading) {
            const container = document.getElementById('store');
            if (container && !document.hidden) {
                await loadDataForSelectedPool();
            }
        }
    }
};

// ============================================================================
// TRADE HISTORY
// ============================================================================
async function loadTradeHistory() {
    if (!State.userAddress) return;
    
    try {
        const endpoint = API_ENDPOINTS.getHistory || 'https://gethistory-4wvdcuoouq-uc.a.run.app';
        const response = await fetch(`${endpoint}/${State.userAddress}`);
        if (response.ok) {
            const data = await response.json();
            TradeState.tradeHistory = (data || []).filter(item => {
                const t = (item.type || '').toUpperCase();
                return t.includes('BUY') || t.includes('SELL') || t.includes('SWAP') || t.includes('NFT_POOL');
            });
            renderTradeHistory();
        }
    } catch (e) {
        console.error('History load error:', e);
    }
}

function renderTradeHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;

    if (!State.isConnected) {
        container.innerHTML = `<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>`;
        return;
    }

    if (TradeState.tradeHistory.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6">
                <img src="${TRADE_IMAGE}" class="w-12 h-12 mx-auto opacity-20 mb-2" onerror="this.style.display='none'">
                <p class="text-zinc-600 text-xs">No trade history yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = TradeState.tradeHistory.slice(0, 15).map(item => {
        const t = (item.type || '').toUpperCase();
        const details = item.details || {};
        const dateStr = formatDate(item.timestamp || item.createdAt);
        
        let icon, iconColor, bgColor, label;
        
        if (t.includes('BUY')) {
            icon = 'fa-arrow-down';
            iconColor = '#22c55e';
            bgColor = 'rgba(34,197,94,0.15)';
            label = '🟢 Bought NFT';
        } else if (t.includes('SELL')) {
            icon = 'fa-arrow-up';
            iconColor = '#ef4444';
            bgColor = 'rgba(239,68,68,0.15)';
            label = '🔴 Sold NFT';
        } else {
            icon = 'fa-exchange-alt';
            iconColor = '#f59e0b';
            bgColor = 'rgba(245,158,11,0.15)';
            label = '🔄 Trade';
        }

        const txLink = item.txHash ? `${EXPLORER_TX}${item.txHash}` : '#';
        let rawAmount = item.amount || details.amount || details.price || "0";
        const amountNum = formatBigNumber(BigInt(rawAmount));
        const amountDisplay = amountNum > 0.001 ? amountNum.toFixed(2) : '';
        const tokenId = details.tokenId || '';

        return `
            <a href="${txLink}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${bgColor}">
                        <i class="fa-solid ${icon} text-sm" style="color: ${iconColor}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">
                            ${label}
                            ${tokenId ? `<span class="ml-1 text-[10px] text-amber-400 font-mono">#${tokenId}</span>` : ''}
                        </p>
                        <p class="text-zinc-600 text-[10px]">${dateStr}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${amountDisplay ? `<span class="text-xs font-mono font-bold ${t.includes('BUY') ? 'text-red-400' : 'text-green-400'}">${t.includes('BUY') ? '-' : '+'}${amountDisplay} <span class="text-zinc-500">BKC</span></span>` : ''}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `;
    }).join('');
}

// ============================================================================
// TIER CHIPS
// ============================================================================
function renderTierChips() {
    return boosterTiers.map((tier, idx) => {
        const style = getTierStyle(tier.name);
        const isFirst = idx === 0;
        
        return `
            <button class="tier-chip flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all
                ${isFirst 
                    ? `bg-gradient-to-r ${style.gradient} ${style.border} ${style.text}` 
                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                }" 
                data-boost="${tier.boostBips}" 
                data-tier="${tier.name}">
                <img src="${buildImageUrl(tier.img)}" class="w-5 h-5 rounded" onerror="this.src='./assets/bkc_logo_3d.png'">
                <span class="text-xs font-medium">${tier.name}</span>
                <span class="text-[10px] opacity-60">+${tier.boostBips/100}%</span>
            </button>
        `;
    }).join('');
}

function updateTierSelection(boostBips) {
    document.querySelectorAll('.tier-chip').forEach(btn => {
        const isSelected = Number(btn.dataset.boost) === boostBips;
        const tierName = btn.dataset.tier;
        const style = getTierStyle(tierName);
        
        btn.className = `tier-chip flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${
            isSelected 
                ? `bg-gradient-to-r ${style.gradient} ${style.border} ${style.text} active` 
                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
        }`;
    });
}

// ============================================================================
// SWAP INTERFACE
// ============================================================================
function renderSwapInterface() {
    const el = document.getElementById('swap-interface');
    if (!el) return;

    const tier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
    const style = getTierStyle(tier?.name);
    const isBuy = TradeState.tradeDirection === 'buy';
    
    // Update mascot animation based on trade direction
    updateMascotAnimation(isBuy);
    
    const price = isBuy ? TradeState.buyPrice : TradeState.netSellPrice;
    const priceFormatted = formatBigNumber(price).toFixed(2);
    const balance = formatBigNumber(State.currentUserBalance || 0n).toFixed(2);
    
    const soldOut = isBuy && TradeState.firstAvailableTokenIdForBuy === null;
    const noNFTtoSell = !isBuy && TradeState.userBalanceOfSelectedNFT === 0;
    const insufficientBalance = isBuy && TradeState.buyPrice > (State.currentUserBalance || 0n);

    el.innerHTML = `
        <div class="fade-in">
            
            <!-- From Section -->
            <div class="swap-input-box rounded-2xl p-4 mb-1">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">${isBuy ? 'You pay' : 'You sell'}</span>
                    <span class="text-xs text-zinc-600">
                        ${isBuy 
                            ? `Balance: <span class="${insufficientBalance ? 'text-red-400' : 'text-zinc-400'}">${balance}</span>` 
                            : `Owned: <span class="${noNFTtoSell ? 'text-red-400' : 'text-zinc-400'}">${TradeState.userBalanceOfSelectedNFT}</span>`
                        }
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold ${insufficientBalance && isBuy ? 'text-red-400' : 'text-white'}">${isBuy ? priceFormatted : '1'}</span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        <img src="${isBuy ? './assets/bkc_logo_3d.png' : buildImageUrl(tier?.img)}" class="w-6 h-6 rounded" onerror="this.src='./assets/bkc_logo_3d.png'">
                        <span class="text-white text-sm font-medium">${isBuy ? 'BKC' : tier?.name || 'NFT'}</span>
                    </div>
                </div>
            </div>
            
            <!-- Swap Arrow -->
            <div class="flex justify-center -my-3 relative z-10">
                <button id="swap-direction-btn" class="swap-arrow-btn w-10 h-10 rounded-xl bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            
            <!-- To Section -->
            <div class="swap-input-box rounded-2xl p-4 mt-1">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">${isBuy ? 'You receive' : 'You get'}</span>
                    <div class="flex gap-2">
                        ${soldOut ? '<span class="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Sold Out</span>' : ''}
                        ${!isBuy ? '<span class="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">10% fee</span>' : ''}
                        <span class="text-[10px] bg-zinc-700/50 ${style.text} px-2 py-0.5 rounded-full">+${(tier?.boostBips || 0)/100}% boost</span>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold text-white">${isBuy ? '1' : priceFormatted}</span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default ${isBuy ? `bg-gradient-to-r ${style.gradient}` : ''}">
                        <img src="${isBuy ? buildImageUrl(tier?.img) : './assets/bkc_logo_3d.png'}" class="w-6 h-6 rounded" onerror="this.src='./assets/bkc_logo_3d.png'">
                        <span class="text-white text-sm font-medium">${isBuy ? tier?.name || 'NFT' : 'BKC'}</span>
                    </div>
                </div>
            </div>
            
            <!-- Price Info -->
            <div class="flex justify-between items-center mt-3 px-1 text-xs">
                <span class="text-zinc-600">
                    <i class="fa-solid fa-chart-line mr-1"></i>
                    ${isBuy ? 'Bonding curve' : 'Net after fee'}
                </span>
                <span class="text-zinc-500">
                    Pool: <span class="text-zinc-400">${TradeState.poolNFTCount} NFTs</span>
                </span>
            </div>
            
            <!-- Execute Button -->
            <div class="mt-4">
                ${renderExecuteButton()}
            </div>
            
        </div>
    `;
}

function updateMascotAnimation(isBuy) {
    const mascot = document.getElementById('trade-mascot');
    if (!mascot) return;
    
    mascot.className = 'w-14 h-14 object-contain';
    
    if (isBuy) {
        mascot.classList.add('trade-buy');
    } else {
        mascot.classList.add('trade-sell');
    }
}

function renderExecuteButton() {
    let text = "Select a Tier";
    let icon = "fa-question";
    let enabled = false;
    let actionType = "trade";
    let btnClass = "bg-zinc-700 text-zinc-500";

    if (!State.isConnected) {
        text = "Connect Wallet";
        icon = "fa-wallet";
        actionType = "connect";
        enabled = true;
        btnClass = "bg-amber-500 hover:bg-amber-400 text-black";
    } else if (TradeState.selectedPoolBoostBips !== null) {
        const isBuy = TradeState.tradeDirection === 'buy';
        
        if (isBuy) {
            if (TradeState.buyPrice === 0n) { 
                text = "Price Unavailable"; icon = "fa-ban"; 
            } else if (TradeState.buyPrice > (State.currentUserBalance || 0n)) { 
                text = "Insufficient Balance"; icon = "fa-coins"; 
            } else if (TradeState.firstAvailableTokenIdForBuy === null) { 
                text = "Sold Out"; icon = "fa-box-open"; 
            } else { 
                text = "Buy NFT"; 
                icon = "fa-arrow-down"; 
                enabled = true; 
                btnClass = "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white";
            }
        } else {
            if (TradeState.userBalanceOfSelectedNFT === 0) { 
                text = "No NFT to Sell"; icon = "fa-box-open"; 
            } else if (TradeState.netSellPrice === 0n) { 
                text = "Pool Empty"; icon = "fa-droplet-slash"; 
            } else if (TradeState.firstAvailableTokenId === null) { 
                text = "Loading..."; icon = "fa-spinner fa-spin"; 
            } else { 
                text = "Sell NFT"; 
                icon = "fa-arrow-up"; 
                enabled = true; 
                btnClass = "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white";
            }
        }
    }

    return `
        <button id="execute-btn" 
                class="swap-btn w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 ${btnClass}"
                ${!enabled ? 'disabled' : ''} 
                data-action="${actionType}">
            <i class="fa-solid ${icon}"></i>
            <span>${text}</span>
        </button>
    `;
}

// ============================================================================
// INVENTORY
// ============================================================================
function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    const countEl = document.getElementById('nft-count');
    if (!grid) return;

    if (!State.isConnected) {
        grid.innerHTML = `<div class="col-span-4 text-center py-8 text-xs text-zinc-600">Connect wallet to view</div>`;
        if (countEl) countEl.textContent = '0';
        return;
    }

    const boosters = State.myBoosters || [];
    if (countEl) countEl.textContent = boosters.length;

    if (boosters.length === 0) {
        grid.innerHTML = `<div class="col-span-4 text-center py-8 text-xs text-zinc-600">No NFTs yet</div>`;
        return;
    }

    grid.innerHTML = boosters.map(nft => {
        const boostBips = nft.boostBips || nft.boost || nft.boostBIPS || 0;
        let tier = boosterTiers.find(t => t.boostBips === boostBips);
        
        if (!tier && nft.name) {
            const nameLower = nft.name.toLowerCase();
            tier = boosterTiers.find(t => nameLower.includes(t.name.toLowerCase()));
        }
        if (!tier && nft.tier) {
            tier = boosterTiers.find(t => t.name.toLowerCase() === nft.tier.toLowerCase());
        }
        if (!tier) {
            tier = { name: 'Booster', img: null, boostBips: boostBips };
        }

        const imgUrl = nft.imageUrl || nft.image || buildImageUrl(tier.img);
        const style = getTierStyle(tier.name);

        return `
            <div class="inventory-item relative bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-2 cursor-pointer hover:bg-zinc-800" 
                 data-boost="${boostBips}" data-id="${nft.tokenId}">
                <img src="${imgUrl}" class="w-full aspect-square object-contain rounded-lg" onerror="this.src='./assets/bkc_logo_3d.png'">
                <p class="text-[9px] ${style.text} text-center font-medium mt-1 truncate">${tier.name}</p>
                <p class="text-[8px] text-zinc-600 text-center">#${nft.tokenId}</p>
            </div>
        `;
    }).join('');
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadDataForSelectedPool() {
    const now = Date.now();
    if (now - TradeState.lastFetchTimestamp < 2000 && TradeState.isDataLoading) return;
    if (TradeState.selectedPoolBoostBips === null) return;

    TradeState.isDataLoading = true;
    TradeState.lastFetchTimestamp = now;

    const el = document.getElementById('swap-interface');
    if (el) el.innerHTML = renderLoading();

    try {
        const boostBips = TradeState.selectedPoolBoostBips;
        const tier = boosterTiers.find(t => t.boostBips === boostBips);
        
        if (!tier) throw new Error("Invalid tier selected.");
        
        let poolAddress = poolAddressCache.get(boostBips);
        
        if (!poolAddress) {
            const poolKey = `pool_${tier.name.toLowerCase()}`;
            poolAddress = addresses[poolKey];
            
            if (!poolAddress || !poolAddress.startsWith('0x')) {
                const factoryAddress = addresses.nftPoolFactory || addresses.nftLiquidityPoolFactory;
                if (!factoryAddress) throw new Error("Factory not configured.");
                
                const factoryContract = new ethers.Contract(factoryAddress, factoryABI, State.publicProvider);
                poolAddress = await factoryContract.getPoolAddress(boostBips);
                
                if (!poolAddress || poolAddress === ethers.ZeroAddress) {
                    throw new Error(`Pool for ${tier.name} not deployed.`);
                }
            }
            poolAddressCache.set(boostBips, poolAddress);
        }

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.publicProvider);
        const boosterContract = State.rewardBoosterContract || State.rewardBoosterContractPublic;

        if (State.isConnected) {
            await Promise.all([loadUserData(), loadMyBoostersFromAPI()]);
            const { highestBoost, tokenId } = await getHighestBoosterBoostFromAPI();
            TradeState.bestBoosterTokenId = tokenId ? BigInt(tokenId) : 0n;
            TradeState.bestBoosterBips = Number(highestBoost);

            const myTierBoosters = (State.myBoosters || []).filter(b => {
                const bBoost = b.boostBips || b.boost || b.boostBIPS || 0;
                return bBoost === Number(boostBips);
            });
            
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
                    } catch (e) {
                        if (!TradeState.firstAvailableTokenId) TradeState.firstAvailableTokenId = BigInt(booster.tokenId);
                    }
                }
            }
        }

        let buyPrice = ethers.MaxUint256;
        let sellPrice = 0n;
        let availableTokenIds = [];
        let baseTaxBips = State.systemFees?.["NFT_POOL_SELL_TAX_BIPS"] || 1000n;
        let discountBips = BigInt(State.boosterDiscounts?.[TradeState.bestBoosterBips] || 0);

        try {
            buyPrice = await safeContractCall(poolContract, 'getBuyPrice', [], ethers.MaxUint256);
        } catch (e) {
            console.warn('getBuyPrice failed:', e.message);
        }

        try {
            sellPrice = await safeContractCall(poolContract, 'getSellPrice', [], 0n);
        } catch (e) {
            console.warn('getSellPrice failed:', e.message);
        }

        try {
            const result = await poolContract.getAvailableNFTs();
            availableTokenIds = Array.isArray(result) ? [...result] : [];
        } catch (e) {
            console.warn('getAvailableNFTs failed:', e.message);
            availableTokenIds = [];
        }

        TradeState.poolNFTCount = availableTokenIds.length;
        TradeState.firstAvailableTokenIdForBuy = (availableTokenIds.length > 0) ? BigInt(availableTokenIds[availableTokenIds.length - 1]) : null;
        TradeState.buyPrice = (buyPrice === ethers.MaxUint256) ? 0n : buyPrice;
        TradeState.sellPrice = sellPrice;

        const baseTaxBipsBigInt = typeof baseTaxBips === 'bigint' ? baseTaxBips : BigInt(baseTaxBips);
        const discountBipsBigInt = typeof discountBips === 'bigint' ? discountBips : BigInt(discountBips);
        const finalTaxBips = (baseTaxBipsBigInt > discountBipsBigInt) ? (baseTaxBipsBigInt - discountBipsBigInt) : 0n;
        const taxAmount = (sellPrice * finalTaxBips) / 10000n;
        TradeState.netSellPrice = sellPrice - taxAmount;

    } catch (err) {
        console.warn("Store Data Warning:", err.message);
        const el = document.getElementById('swap-interface');
        if (el) {
            el.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-exclamation-triangle text-amber-500"></i>
                    </div>
                    <p class="text-zinc-400 text-sm">Pool unavailable</p>
                    <p class="text-zinc-600 text-xs mt-1">${err.message}</p>
                </div>
            `;
        }
        return;
    } finally {
        TradeState.isDataLoading = false;
        renderSwapInterface();
        renderInventory();
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
    const container = document.getElementById('store');
    if (!container) return;

    container.addEventListener('click', async (e) => {
        // Refresh button
        if (e.target.closest('#refresh-btn')) {
            const btn = e.target.closest('#refresh-btn');
            const icon = btn.querySelector('i');
            icon.classList.add('fa-spin');
            await loadDataForSelectedPool();
            loadTradeHistory();
            icon.classList.remove('fa-spin');
            return;
        }

        // Tier selection
        const tierBtn = e.target.closest('.tier-chip');
        if (tierBtn) {
            const boost = Number(tierBtn.dataset.boost);
            if (TradeState.selectedPoolBoostBips !== boost) {
                TradeState.selectedPoolBoostBips = boost;
                updateTierSelection(boost);
                await loadDataForSelectedPool();
            }
            return;
        }

        // Swap direction toggle
        if (e.target.closest('#swap-direction-btn')) {
            TradeState.tradeDirection = TradeState.tradeDirection === 'buy' ? 'sell' : 'buy';
            renderSwapInterface();
            return;
        }

        // Inventory toggle
        if (e.target.closest('#inventory-toggle')) {
            const panel = document.getElementById('inventory-panel');
            const chevron = document.getElementById('inventory-chevron');
            if (panel && chevron) {
                panel.classList.toggle('hidden');
                chevron.style.transform = panel.classList.contains('hidden') ? '' : 'rotate(180deg)';
            }
            return;
        }

        // History toggle
        if (e.target.closest('#history-toggle')) {
            const panel = document.getElementById('history-panel');
            const chevron = document.getElementById('history-chevron');
            if (panel && chevron) {
                panel.classList.toggle('hidden');
                chevron.style.transform = panel.classList.contains('hidden') ? '' : 'rotate(180deg)';
            }
            return;
        }

        // Inventory item click
        const invItem = e.target.closest('.inventory-item');
        if (invItem) {
            const boost = Number(invItem.dataset.boost);
            TradeState.selectedPoolBoostBips = boost;
            TradeState.tradeDirection = 'sell';
            updateTierSelection(boost);
            await loadDataForSelectedPool();
            return;
        }

        // Execute button
        const executeBtn = e.target.closest('#execute-btn');
        if (executeBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            if (isTransactionInProgress || executeBtn.disabled) return;
            
            const action = executeBtn.dataset.action;
            const mascot = document.getElementById('trade-mascot');

            if (action === "connect") {
                window.openConnectModal();
                return;
            }

            const tier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
            if (!tier) return;

            const poolKey = `pool_${tier.name.toLowerCase()}`;
            const poolAddress = addresses[poolKey] || poolAddressCache.get(tier.boostBips);
            
            if (!poolAddress) {
                showToast("Pool address not found", "error");
                return;
            }

            isTransactionInProgress = true;
            executeBtn.disabled = true;
            const originalHTML = executeBtn.innerHTML;
            executeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            
            // Animate mascot
            if (mascot) mascot.className = 'w-14 h-14 object-contain trade-spin';

            try {
                if (TradeState.tradeDirection === 'buy') {
                    const success = await executeBuyBooster(poolAddress, TradeState.buyPrice, TradeState.bestBoosterTokenId, executeBtn);
                    if (success) {
                        if (mascot) mascot.className = 'w-14 h-14 object-contain trade-success';
                        showToast("🟢 NFT Purchased!", "success");
                        await loadDataForSelectedPool();
                        loadTradeHistory();
                    }
                } else {
                    const success = await executeSellBooster(poolAddress, TradeState.firstAvailableTokenId, TradeState.bestBoosterTokenId, executeBtn);
                    if (success) {
                        if (mascot) mascot.className = 'w-14 h-14 object-contain trade-success';
                        showToast("🔴 NFT Sold!", "success");
                        await loadDataForSelectedPool();
                        loadTradeHistory();
                    }
                }
            } finally {
                isTransactionInProgress = false;
                executeBtn.disabled = false;
                executeBtn.innerHTML = originalHTML;
                
                // Reset mascot animation
                if (mascot) {
                    setTimeout(() => {
                        const isBuy = TradeState.tradeDirection === 'buy';
                        mascot.className = `w-14 h-14 object-contain ${isBuy ? 'trade-buy' : 'trade-sell'}`;
                    }, 800);
                }
            }
        }
    });
}