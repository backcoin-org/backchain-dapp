// pages/StorePage.js
// ✅ PRODUCTION V6.8 - NFT Burn Rate System (4 Tiers)
//
// V6.8 Changes:
// - Updated to 4 tiers: Diamond (50%), Gold (40%), Silver (25%), Bronze (10%)
// - Shows "keep rate" instead of boost percentage (what user receives)
// - Positive messaging: "Keep 100%" instead of "50% boost"
// - Tier display shows emoji and keep rate
//
// V12.1 Changes:
// - Added auto-refresh in finally block (2s after any transaction)
// - Ensures UI updates even if onSuccess callback fails
//
// V12.0 Changes:
// - Removed 2-second throttle for instant tier switching
// - Added pool data cache (30s TTL) to avoid redundant contract calls

const ethers = window.ethers;

import { State } from '../state.js';
import { loadUserData, loadMyBoostersFromAPI, loadRentalListings, safeContractCall, getHighestBoosterBoostFromAPI, loadSystemDataFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { formatBigNumber, renderNoData } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers, addresses, nftPoolABI, ipfsGateway, getTierByBoost, getKeepRateFromBoost } from '../config.js';

// V10: Import new transaction module
import { NftTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const POOL_CACHE_TTL = 30000; // V12: 30 seconds cache for pool data

// ============================================================================
// TIER CONFIGURATION - V6.8 (4 TIERS)
// ============================================================================
const TIER_CONFIG = {
    'Diamond': {
        color: '#22d3ee',
        gradient: 'from-cyan-500/20 to-blue-500/20',
        border: 'border-cyan-500/40',
        text: 'text-cyan-400',
        glow: 'shadow-cyan-500/30',
        icon: '💎',
        image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq',
        keepRate: 100,
        burnRate: 0
    },
    'Gold': {
        color: '#fbbf24',
        gradient: 'from-yellow-500/20 to-amber-500/20',
        border: 'border-yellow-500/40',
        text: 'text-yellow-400',
        glow: 'shadow-yellow-500/30',
        icon: '🥇',
        image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44',
        keepRate: 90,
        burnRate: 10
    },
    'Silver': {
        color: '#9ca3af',
        gradient: 'from-gray-400/20 to-slate-400/20',
        border: 'border-gray-400/40',
        text: 'text-gray-300',
        glow: 'shadow-gray-400/30',
        icon: '🥈',
        image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4',
        keepRate: 75,
        burnRate: 25
    },
    'Bronze': {
        color: '#f97316',
        gradient: 'from-orange-600/20 to-amber-700/20',
        border: 'border-orange-600/40',
        text: 'text-orange-400',
        glow: 'shadow-orange-500/30',
        icon: '🥉',
        image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m',
        keepRate: 60,
        burnRate: 40
    }
};

function getTierStyle(tierName) {
    return TIER_CONFIG[tierName] || TIER_CONFIG['Bronze'];
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
    availableToSellCount: 0,
    firstAvailableTokenId: null,
    firstAvailableTokenIdForBuy: null,
    bestBoosterTokenId: 0n,
    bestBoosterBips: 0,
    isDataLoading: false,
    tradeHistory: []
};

const poolAddressCache = new Map();
const poolDataCache = new Map(); // V12: Cache pool data
let isTransactionInProgress = false;
let currentLoadingRequest = null; // V12: Track current request to cancel stale ones

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

// V12: Pool data cache functions
function getCachedPoolData(boostBips) {
    const cached = poolDataCache.get(boostBips);
    if (cached && (Date.now() - cached.timestamp < POOL_CACHE_TTL)) {
        return cached.data;
    }
    return null;
}

function setCachedPoolData(boostBips, data) {
    poolDataCache.set(boostBips, { data, timestamp: Date.now() });
}

function invalidatePoolCache(boostBips) {
    poolDataCache.delete(boostBips);
}

// ============================================================================
// INJECT STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('swap-styles-v9')) return;
    
    const style = document.createElement('style');
    style.id = 'swap-styles-v9';
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
            transform: scale(1.02);
            box-shadow: 0 0 20px rgba(139,92,246,0.3);
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
        
        .history-item {
            transition: all 0.2s ease;
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
        
        /* Tier Grid - Responsive */
        .tier-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
        }
        
        @media (max-width: 400px) {
            .tier-grid {
                grid-template-columns: repeat(3, 1fr);
            }
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
                <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin"></div>
                <div class="absolute inset-2 rounded-full bg-zinc-800 flex items-center justify-center">
                    <i class="fa-solid fa-gem text-xl text-purple-400"></i>
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
                    
                    <!-- Header with NFT Icon -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                                 id="trade-mascot">
                                <img src="${TIER_CONFIG['Diamond'].image}" alt="NFT" class="w-full h-full object-contain" onerror="this.outerHTML='<span class=\\'text-3xl\\'>💎</span>'">
                            </div>
                            <div>
                                <h1 class="text-lg font-semibold text-white">NFT Market</h1>
                                <p class="text-xs text-zinc-500">Keep up to 100% of rewards</p>
                            </div>
                        </div>
                        <button id="refresh-btn" class="w-8 h-8 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                            <i class="fa-solid fa-rotate text-xs"></i>
                        </button>
                    </div>
                    
                    <!-- Main Swap Card -->
                    <div class="swap-card rounded-2xl p-4 mb-4">
                        
                        <!-- Tier Selector - GRID Layout V6.8 -->
                        <div class="mb-4">
                            <p class="text-xs text-zinc-500 mb-2">Select NFT Tier (Higher = Keep More Rewards)</p>
                            <div id="tier-selector" class="tier-grid">
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
                    
                    <!-- Trade History (Collapsible) - OPEN by default -->
                    <div class="swap-card rounded-2xl overflow-hidden">
                        <button id="history-toggle" class="w-full flex justify-between items-center p-4 hover:bg-zinc-800/30 transition-colors">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-clock-rotate-left text-green-500 text-sm"></i>
                                <span class="text-sm font-medium text-white">Trade History</span>
                                <span id="history-count" class="text-xs bg-zinc-700 px-2 py-0.5 rounded-full text-zinc-300">0</span>
                            </div>
                            <i id="history-chevron" class="fa-solid fa-chevron-down text-zinc-500 text-xs transition-transform" style="transform: rotate(180deg)"></i>
                        </button>
                        <div id="history-panel" class="border-t border-zinc-800">
                            <div id="history-list" class="p-4 space-y-2 max-h-[300px] overflow-y-auto custom-scroll">
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
        await loadTradeHistory();
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
// TRADE HISTORY - IMPROVED
// ============================================================================
async function loadTradeHistory() {
    const container = document.getElementById('history-list');
    
    if (!State.userAddress) {
        if (container) {
            container.innerHTML = `<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>`;
        }
        return;
    }
    
    try {
        const endpoint = API_ENDPOINTS.getHistory || 'https://gethistory-4wvdcuoouq-uc.a.run.app';
        const response = await fetch(`${endpoint}/${State.userAddress}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Debug: mostrar todos os tipos de transação
        console.log("All history types:", [...new Set((data || []).map(item => item.type))]);
        
        // Filtro RESTRITO - APENAS compra e venda de NFT
        TradeState.tradeHistory = (data || []).filter(item => {
            const t = (item.type || '').toUpperCase();
            
            // APENAS estes tipos específicos de trade de NFT
            return t === 'NFTBOUGHT' || 
                   t === 'NFTSOLD' ||
                   t === 'NFT_BOUGHT' ||
                   t === 'NFT_SOLD' ||
                   t === 'NFTPURCHASED' ||
                   t === 'NFT_PURCHASED' ||
                   t.includes('NFTBOUGHT') ||
                   t.includes('NFTSOLD') ||
                   t.includes('NFTPURCHASED');
        });
        
        console.log("NFT trade history:", TradeState.tradeHistory.length, "items");
        
        // Update count badge
        const countEl = document.getElementById('history-count');
        if (countEl) countEl.textContent = TradeState.tradeHistory.length;
        
        renderTradeHistory();
        
    } catch (e) {
        console.error('History load error:', e);
        // Mesmo com erro, renderizar estado vazio
        TradeState.tradeHistory = [];
        renderTradeHistory();
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
                <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                    <i class="fa-solid fa-receipt text-zinc-600 text-lg"></i>
                </div>
                <p class="text-zinc-600 text-xs">No NFT trades yet</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy or sell NFTs to see history</p>
            </div>
        `;
        return;
    }

    container.innerHTML = TradeState.tradeHistory.slice(0, 20).map(item => {
        const t = (item.type || '').toUpperCase();
        const details = item.details || {};
        const dateStr = formatDate(item.timestamp || item.createdAt);
        
        // Determinar se é Buy ou Sell
        const isBuy = t.includes('BOUGHT') || t.includes('PURCHASED');
        
        const icon = isBuy ? 'fa-cart-plus' : 'fa-money-bill-transfer';
        const iconColor = isBuy ? '#22c55e' : '#f59e0b';
        const bgColor = isBuy ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)';
        const label = isBuy ? '🛒 Bought NFT' : '💰 Sold NFT';
        const amountPrefix = isBuy ? '-' : '+';

        const txLink = item.txHash ? `${EXPLORER_TX}${item.txHash}` : '#';
        
        // Handle amount safely
        let amountDisplay = '';
        try {
            let rawAmount = item.amount || details.amount || details.price || details.payout || "0";
            if (typeof rawAmount === 'string' && rawAmount !== "0") {
                const amountNum = formatBigNumber(BigInt(rawAmount));
                if (amountNum > 0.001) {
                    amountDisplay = amountNum.toFixed(2);
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
        
        const tokenId = details.tokenId || '';
        const boostBips = details.boostBips || details.boost || '';

        return `
            <a href="${txLink}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${bgColor}">
                        <i class="fa-solid ${icon} text-sm" style="color: ${iconColor}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">
                            ${label}
                            ${tokenId ? `<span class="ml-1 text-[10px] text-amber-400 font-mono">#${tokenId}</span>` : ''}
                            ${boostBips ? `<span class="ml-1 text-[9px] text-purple-400">+${Number(boostBips)/100}%</span>` : ''}
                        </p>
                        <p class="text-zinc-600 text-[10px]">${dateStr}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${amountDisplay ? `<span class="text-xs font-mono font-bold ${isBuy ? 'text-white' : 'text-green-400'}">${amountPrefix}${amountDisplay} <span class="text-zinc-500">BKC</span></span>` : ''}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `;
    }).join('');
}

// ============================================================================
// TIER CHIPS - GRID Layout
// ============================================================================
function renderTierChips() {
    return boosterTiers.map((tier, idx) => {
        const style = getTierStyle(tier.name);
        const isFirst = idx === 0;
        const keepRate = getKeepRateFromBoost(tier.boostBips);
        const emoji = style.icon || tier.emoji || '💎';
        
        return `
            <button class="tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                ${isFirst
                    ? `bg-gradient-to-br ${style.gradient} ${style.border} ${style.text} active`
                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                }"
                data-boost="${tier.boostBips}"
                data-tier="${tier.name}">
                <div class="w-8 h-8 flex items-center justify-center">
                    ${style.image ? `<img src="${style.image}" alt="${tier.name}" class="w-full h-full object-contain rounded" onerror="this.outerHTML='<span class=\\'text-2xl\\'>${emoji}</span>'">` : `<span class="text-2xl">${emoji}</span>`}
                </div>
                <span class="text-[10px] font-medium truncate w-full text-center">${tier.name}</span>
                <span class="text-[9px] ${keepRate === 100 ? 'text-green-400 font-bold' : 'opacity-70'}">Keep ${keepRate}%</span>
            </button>
        `;
    }).join('');
}

function updateTierSelection(boostBips) {
    document.querySelectorAll('.tier-chip').forEach(btn => {
        const isSelected = Number(btn.dataset.boost) === boostBips;
        const tierName = btn.dataset.tier;
        const style = getTierStyle(tierName);
        
        btn.className = `tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
            isSelected 
                ? `bg-gradient-to-br ${style.gradient} ${style.border} ${style.text} active` 
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
    const noNFTtoSell = !isBuy && TradeState.availableToSellCount === 0;
    const hasListedNFTs = !isBuy && TradeState.userBalanceOfSelectedNFT > TradeState.availableToSellCount;
    const insufficientBalance = isBuy && TradeState.buyPrice > (State.currentUserBalance || 0n);

    // Texto de owned que mostra quantos estão disponíveis vs total
    const ownedText = !isBuy 
        ? (hasListedNFTs 
            ? `<span class="${noNFTtoSell ? 'text-red-400' : 'text-zinc-400'}">${TradeState.availableToSellCount}</span>/<span class="text-zinc-500">${TradeState.userBalanceOfSelectedNFT}</span> <span class="text-[9px] text-blue-400">(${TradeState.userBalanceOfSelectedNFT - TradeState.availableToSellCount} rented)</span>`
            : `<span class="${noNFTtoSell ? 'text-red-400' : 'text-zinc-400'}">${TradeState.userBalanceOfSelectedNFT}</span>`)
        : '';

    // V6.8: Get tier image/emoji for display
    const tierEmoji = style.icon || tier?.emoji || '💎';
    const tierImage = style.image || '';
    const keepRate = getKeepRateFromBoost(tier?.boostBips || 0);

    el.innerHTML = `
        <div class="fade-in">
            
            <!-- From Section -->
            <div class="swap-input-box rounded-2xl p-4 mb-1">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">${isBuy ? 'You pay' : 'You sell'}</span>
                    <span class="text-xs text-zinc-600">
                        ${isBuy 
                            ? `Balance: <span class="${insufficientBalance ? 'text-red-400' : 'text-zinc-400'}">${balance}</span>` 
                            : `Available: ${ownedText}`
                        }
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold ${insufficientBalance && isBuy ? 'text-red-400' : 'text-white'}">
                        ${isBuy ? priceFormatted : '1'}
                        ${!isBuy && TradeState.firstAvailableTokenId ? `<span class="text-sm text-amber-400 ml-2">#${TradeState.firstAvailableTokenId.toString()}</span>` : ''}
                    </span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        ${isBuy
                            ? `<img src="./assets/bkc_logo_3d.png" class="w-6 h-6 rounded">`
                            : (tierImage ? `<img src="${tierImage}" alt="${tier?.name}" class="w-6 h-6 object-contain rounded" onerror="this.outerHTML='<span class=\\'text-xl\\'>${tierEmoji}</span>'">` : `<span class="text-xl">${tierEmoji}</span>`)
                        }
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
            <div class="swap-input-box rounded-2xl p-4 mt-1 mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">${isBuy ? 'You receive' : 'You receive'}</span>
                    <span class="text-xs text-zinc-600">
                        ${isBuy 
                            ? `In pool: <span class="${soldOut ? 'text-red-400' : 'text-green-400'}">${TradeState.poolNFTCount}</span>` 
                            : `Net after fee`
                        }
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold text-white">${isBuy ? '1' : formatBigNumber(TradeState.netSellPrice).toFixed(2)}</span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        ${isBuy
                            ? (tierImage ? `<img src="${tierImage}" alt="${tier?.name}" class="w-6 h-6 object-contain rounded" onerror="this.outerHTML='<span class=\\'text-xl\\'>${tierEmoji}</span>'">` : `<span class="text-xl">${tierEmoji}</span>`)
                            : `<img src="./assets/bkc_logo_3d.png" class="w-6 h-6 rounded">`
                        }
                        <span class="text-white text-sm font-medium">${isBuy ? tier?.name || 'NFT' : 'BKC'}</span>
                    </div>
                </div>
            </div>
            
            <!-- Pool Info - V6.8 -->
            <div class="flex justify-between items-center text-[10px] text-zinc-600 mb-4 px-1">
                <span class="flex items-center gap-1">
                    ${tierImage ? `<img src="${tierImage}" alt="${tier?.name}" class="w-4 h-4 object-contain" onerror="this.outerHTML='<span>${tierEmoji}</span>'">` : `<span>${tierEmoji}</span>`}
                    <span>${tier?.name || 'Unknown'} Pool</span>
                </span>
                <span class="text-green-400">Keep ${getKeepRateFromBoost(tier?.boostBips || 0)}% of rewards</span>
            </div>
            
            <!-- Execute Button -->
            ${renderExecuteButton(isBuy, soldOut, noNFTtoSell, insufficientBalance, hasListedNFTs)}
        </div>
    `;
}

function renderExecuteButton(isBuy, soldOut, noNFTtoSell, insufficientBalance, hasListedNFTs = false) {
    if (!State.isConnected) {
        return `
            <button id="execute-btn" data-action="connect" class="swap-btn w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500">
                <i class="fa-solid fa-wallet mr-2"></i> Connect Wallet
            </button>
        `;
    }

    if (isBuy) {
        if (soldOut) {
            return `
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-zinc-500 bg-zinc-800 cursor-not-allowed">
                    <i class="fa-solid fa-box-open mr-2"></i> Sold Out
                </button>
            `;
        }
        if (insufficientBalance) {
            return `
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-red-400 bg-red-950/30 cursor-not-allowed border border-red-500/30">
                    <i class="fa-solid fa-coins mr-2"></i> Insufficient BKC
                </button>
            `;
        }
        return `
            <button id="execute-btn" data-action="buy" class="swap-btn w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500">
                <i class="fa-solid fa-cart-plus mr-2"></i> Buy NFT
            </button>
        `;
    } else {
        if (noNFTtoSell && hasListedNFTs) {
            // Tem NFTs mas todos estão alugados
            return `
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-blue-400 bg-blue-950/30 cursor-not-allowed border border-blue-500/30">
                    <i class="fa-solid fa-key mr-2"></i> All NFTs Rented
                </button>
            `;
        }
        if (noNFTtoSell) {
            return `
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-zinc-500 bg-zinc-800 cursor-not-allowed">
                    <i class="fa-solid fa-gem mr-2"></i> No NFT to Sell
                </button>
            `;
        }
        return `
            <button id="execute-btn" data-action="sell" class="swap-btn w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500">
                <i class="fa-solid fa-money-bill-transfer mr-2"></i> Sell NFT
            </button>
        `;
    }
}

function updateMascotAnimation(isBuy) {
    const mascot = document.getElementById('trade-mascot');
    if (mascot) {
        mascot.className = `w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${isBuy ? 'trade-buy' : 'trade-sell'}`;
    }
}

// ============================================================================
// INVENTORY
// ============================================================================
function renderInventory() {
    const container = document.getElementById('inventory-grid');
    const countEl = document.getElementById('nft-count');
    
    if (!container) return;

    const boosters = State.myBoosters || [];
    if (countEl) countEl.textContent = boosters.length;

    if (!State.isConnected) {
        container.innerHTML = `<div class="col-span-4 text-center py-4 text-xs text-zinc-600">Connect wallet</div>`;
        return;
    }

    if (boosters.length === 0) {
        container.innerHTML = `
            <div class="col-span-4 text-center py-4">
                <p class="text-zinc-600 text-xs">No NFTs owned</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy from pool to get started</p>
            </div>
        `;
        return;
    }

    // Verificar quais NFTs estão listados para aluguel
    const rentalListings = State.rentalListings || [];
    const listedTokenIds = new Set(rentalListings.map(l => l.tokenId?.toString()));
    const now = Math.floor(Date.now() / 1000);

    container.innerHTML = boosters.map(nft => {
        const tier = boosterTiers.find(t => t.boostBips === Number(nft.boostBips));
        const style = getTierStyle(tier?.name);
        const keepRate = getKeepRateFromBoost(Number(nft.boostBips));
        const emoji = style.icon || tier?.emoji || '💎';
        const isSelected = TradeState.firstAvailableTokenId && BigInt(nft.tokenId) === TradeState.firstAvailableTokenId;
        
        // Verificar status de aluguel
        const tokenIdStr = nft.tokenId?.toString();
        const isListed = listedTokenIds.has(tokenIdStr);
        const listing = rentalListings.find(l => l.tokenId?.toString() === tokenIdStr);
        const isRented = listing && listing.rentalEndTime && Number(listing.rentalEndTime) > now;
        const isUnavailable = isListed || isRented;
        
        // Status badge
        let statusBadge = '';
        if (isRented) {
            statusBadge = `<span class="absolute top-1 right-1 bg-blue-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">🔑</span>`;
        } else if (isListed) {
            statusBadge = `<span class="absolute top-1 right-1 bg-green-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">📋</span>`;
        }
        
        return `
            <div class="inventory-item ${isUnavailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} rounded-xl p-2 border ${isSelected && !isUnavailable ? 'border-amber-500 ring-2 ring-amber-500/50 bg-amber-500/10' : 'border-zinc-700/50 bg-zinc-800/30'} hover:bg-zinc-800/50 transition-all relative"
                 data-boost="${nft.boostBips}" 
                 data-tokenid="${nft.tokenId}"
                 data-unavailable="${isUnavailable}">
                ${statusBadge}
                <div class="w-full aspect-square rounded-lg bg-gradient-to-br ${style.gradient} border ${style.border} flex items-center justify-center overflow-hidden ${isUnavailable ? 'grayscale' : ''}">
                    ${style.image ? `<img src="${style.image}" alt="${tier?.name}" class="w-full h-full object-contain p-1" onerror="this.outerHTML='<span class=\\'text-3xl\\'>${emoji}</span>'">` : `<span class="text-3xl">${emoji}</span>`}
                </div>
                <p class="text-[9px] text-center mt-1 ${style.text} truncate">${tier?.name || 'NFT'}</p>
                <p class="text-[8px] text-center ${keepRate === 100 ? 'text-green-400' : 'text-zinc-500'}">Keep ${keepRate}%</p>
                <p class="text-[7px] text-center ${isSelected && !isUnavailable ? 'text-amber-400 font-bold' : 'text-zinc-600'}">#${nft.tokenId}</p>
            </div>
        `;
    }).join('');
}

// ============================================================================
// DATA LOADING - V12: Optimized with caching
// ============================================================================
async function loadDataForSelectedPool(forceRefresh = false) {
    if (TradeState.selectedPoolBoostBips === null) return;

    const boostBips = TradeState.selectedPoolBoostBips;
    const requestId = Date.now();
    currentLoadingRequest = requestId;

    // V12: Check cache first (instant response)
    if (!forceRefresh) {
        const cachedData = getCachedPoolData(boostBips);
        if (cachedData) {
            applyPoolData(cachedData, boostBips);
            renderSwapInterface();
            renderInventory();
            // Refresh in background silently
            refreshPoolDataInBackground(boostBips, requestId);
            return;
        }
    }

    TradeState.isDataLoading = true;

    try {
        // Update user NFT data
        const userNFTs = State.myBoosters || [];
        const rentalListings = State.rentalListings || [];
        const listedTokenIds = new Set(rentalListings.map(l => l.tokenId?.toString()));
        const nowSec = Math.floor(Date.now() / 1000);

        const userNFTsOfTier = userNFTs.filter(nft => Number(nft.boostBips) === boostBips);
        
        const availableNFTsOfTier = userNFTsOfTier.filter(nft => {
            const tokenIdStr = nft.tokenId?.toString();
            const listing = rentalListings.find(l => l.tokenId?.toString() === tokenIdStr);
            const isListed = listedTokenIds.has(tokenIdStr);
            const isRented = listing && listing.rentalEndTime && Number(listing.rentalEndTime) > nowSec;
            return !isListed && !isRented;
        });

        const tier = boosterTiers.find(t => t.boostBips === boostBips);
        if (!tier) {
            console.warn("Tier not found for boostBips:", boostBips);
            return;
        }

        const poolKey = `pool_${tier.name.toLowerCase()}`;
        let poolAddress = addresses[poolKey] || poolAddressCache.get(boostBips);

        // V9: Pool addresses come from deployment-addresses.json (pool_diamond, pool_gold, etc.)
        // Factory lookup is a fallback only
        if (!poolAddress) {
            const factoryAddress = addresses.nftPoolFactory || addresses.nftLiquidityPoolFactory;
            if (factoryAddress && State.publicProvider) {
                try {
                    const factory = new ethers.Contract(factoryAddress, factoryABI, State.publicProvider);
                    poolAddress = await factory.getPoolAddress(boostBips);
                    if (poolAddress && poolAddress !== ethers.ZeroAddress) {
                        poolAddressCache.set(boostBips, poolAddress);
                    }
                } catch (e) {
                    console.warn('Factory lookup failed:', e.message);
                }
            }
        }

        // Check if request is still valid
        if (currentLoadingRequest !== requestId) return;

        if (!poolAddress || poolAddress === ethers.ZeroAddress) {
            const el = document.getElementById('swap-interface');
            if (el) {
                el.innerHTML = `
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-store-slash text-zinc-600"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool not available</p>
                        <p class="text-zinc-600 text-xs mt-1">${tier.name} pool coming soon</p>
                    </div>
                `;
            }
            return;
        }

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.publicProvider);

        // V12: Fetch all pool data in parallel for speed
        const [buyPriceResult, sellPriceResult, availableNFTsResult] = await Promise.all([
            safeContractCall(poolContract, 'getBuyPrice', [], ethers.MaxUint256).catch(() => ethers.MaxUint256),
            safeContractCall(poolContract, 'getSellPrice', [], 0n).catch(() => 0n),
            poolContract.getAvailableNFTs().catch(() => [])
        ]);

        // Check if request is still valid
        if (currentLoadingRequest !== requestId) return;

        const availableTokenIds = Array.isArray(availableNFTsResult) ? [...availableNFTsResult] : [];
        const buyPrice = (buyPriceResult === ethers.MaxUint256) ? 0n : buyPriceResult;
        const sellPrice = sellPriceResult;

        // Calculate net sell price
        let baseTaxBips = State.systemFees?.["NFT_POOL_SELL_TAX_BIPS"] || 1000n;
        let discountBips = BigInt(State.boosterDiscounts?.[TradeState.bestBoosterBips] || 0);
        const baseTaxBipsBigInt = typeof baseTaxBips === 'bigint' ? baseTaxBips : BigInt(baseTaxBips);
        const discountBipsBigInt = typeof discountBips === 'bigint' ? discountBips : BigInt(discountBips);
        const finalTaxBips = (baseTaxBipsBigInt > discountBipsBigInt) ? (baseTaxBipsBigInt - discountBipsBigInt) : 0n;
        const taxAmount = (sellPrice * finalTaxBips) / 10000n;
        const netSellPrice = sellPrice - taxAmount;

        // Build pool data object
        const poolData = {
            buyPrice,
            sellPrice,
            netSellPrice,
            poolNFTCount: availableTokenIds.length,
            firstAvailableTokenIdForBuy: (availableTokenIds.length > 0) ? BigInt(availableTokenIds[availableTokenIds.length - 1]) : null,
            userBalanceOfSelectedNFT: userNFTsOfTier.length,
            availableToSellCount: availableNFTsOfTier.length,
            availableNFTsOfTier
        };

        // Cache the data
        setCachedPoolData(boostBips, poolData);

        // Apply to state and render
        applyPoolData(poolData, boostBips);

    } catch (err) {
        console.warn("Store Data Warning:", err.message);
        if (currentLoadingRequest === requestId) {
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
        }
        return;
    } finally {
        if (currentLoadingRequest === requestId) {
            TradeState.isDataLoading = false;
            renderSwapInterface();
            renderInventory();
        }
    }
}

// V12: Background refresh without blocking UI
async function refreshPoolDataInBackground(boostBips, requestId) {
    try {
        // Silently refresh data
        const userNFTs = State.myBoosters || [];
        const rentalListings = State.rentalListings || [];
        const listedTokenIds = new Set(rentalListings.map(l => l.tokenId?.toString()));
        const nowSec = Math.floor(Date.now() / 1000);

        const userNFTsOfTier = userNFTs.filter(nft => Number(nft.boostBips) === boostBips);
        const availableNFTsOfTier = userNFTsOfTier.filter(nft => {
            const tokenIdStr = nft.tokenId?.toString();
            const listing = rentalListings.find(l => l.tokenId?.toString() === tokenIdStr);
            const isListed = listedTokenIds.has(tokenIdStr);
            const isRented = listing && listing.rentalEndTime && Number(listing.rentalEndTime) > nowSec;
            return !isListed && !isRented;
        });

        const tier = boosterTiers.find(t => t.boostBips === boostBips);
        if (!tier) return;

        const poolKey = `pool_${tier.name.toLowerCase()}`;
        let poolAddress = addresses[poolKey] || poolAddressCache.get(boostBips);
        if (!poolAddress || poolAddress === ethers.ZeroAddress) return;

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.publicProvider);

        const [buyPriceResult, sellPriceResult, availableNFTsResult] = await Promise.all([
            safeContractCall(poolContract, 'getBuyPrice', [], ethers.MaxUint256).catch(() => ethers.MaxUint256),
            safeContractCall(poolContract, 'getSellPrice', [], 0n).catch(() => 0n),
            poolContract.getAvailableNFTs().catch(() => [])
        ]);

        if (currentLoadingRequest !== requestId) return;

        const availableTokenIds = Array.isArray(availableNFTsResult) ? [...availableNFTsResult] : [];
        const buyPrice = (buyPriceResult === ethers.MaxUint256) ? 0n : buyPriceResult;
        const sellPrice = sellPriceResult;

        let baseTaxBips = State.systemFees?.["NFT_POOL_SELL_TAX_BIPS"] || 1000n;
        let discountBips = BigInt(State.boosterDiscounts?.[TradeState.bestBoosterBips] || 0);
        const baseTaxBipsBigInt = typeof baseTaxBips === 'bigint' ? baseTaxBips : BigInt(baseTaxBips);
        const discountBipsBigInt = typeof discountBips === 'bigint' ? discountBips : BigInt(discountBips);
        const finalTaxBips = (baseTaxBipsBigInt > discountBipsBigInt) ? (baseTaxBipsBigInt - discountBipsBigInt) : 0n;
        const taxAmount = (sellPrice * finalTaxBips) / 10000n;
        const netSellPrice = sellPrice - taxAmount;

        const poolData = {
            buyPrice, sellPrice, netSellPrice,
            poolNFTCount: availableTokenIds.length,
            firstAvailableTokenIdForBuy: (availableTokenIds.length > 0) ? BigInt(availableTokenIds[availableTokenIds.length - 1]) : null,
            userBalanceOfSelectedNFT: userNFTsOfTier.length,
            availableToSellCount: availableNFTsOfTier.length,
            availableNFTsOfTier
        };

        setCachedPoolData(boostBips, poolData);

        // Only update UI if still on same tier
        if (TradeState.selectedPoolBoostBips === boostBips && currentLoadingRequest === requestId) {
            applyPoolData(poolData, boostBips);
            renderSwapInterface();
        }
    } catch (e) {
        console.warn('Background refresh failed:', e.message);
    }
}

// V12: Apply pool data to TradeState
function applyPoolData(poolData, boostBips) {
    TradeState.buyPrice = poolData.buyPrice;
    TradeState.sellPrice = poolData.sellPrice;
    TradeState.netSellPrice = poolData.netSellPrice;
    TradeState.poolNFTCount = poolData.poolNFTCount;
    TradeState.firstAvailableTokenIdForBuy = poolData.firstAvailableTokenIdForBuy;
    TradeState.userBalanceOfSelectedNFT = poolData.userBalanceOfSelectedNFT;
    TradeState.availableToSellCount = poolData.availableToSellCount;

    // Update firstAvailableTokenId for selling
    const currentSelection = TradeState.firstAvailableTokenId;
    const selectionIsAvailable = currentSelection && poolData.availableNFTsOfTier?.some(nft => BigInt(nft.tokenId) === currentSelection);
    
    if (!selectionIsAvailable && poolData.availableNFTsOfTier?.length > 0) {
        TradeState.firstAvailableTokenId = BigInt(poolData.availableNFTsOfTier[0].tokenId);
    } else if (!poolData.availableNFTsOfTier?.length) {
        TradeState.firstAvailableTokenId = null;
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
    const container = document.getElementById('store');
    if (!container) return;

    container.addEventListener('click', async (e) => {
        // Refresh button - V12: Invalidate cache and force refresh
        if (e.target.closest('#refresh-btn')) {
            const btn = e.target.closest('#refresh-btn');
            const icon = btn.querySelector('i');
            icon.classList.add('fa-spin');
            
            invalidatePoolCache(TradeState.selectedPoolBoostBips);
            
            await Promise.all([
                loadMyBoostersFromAPI(true),
                loadRentalListings()
            ]);
            
            await loadDataForSelectedPool(true);
            loadTradeHistory();
            icon.classList.remove('fa-spin');
            return;
        }

        // Tier selection - V12: Instant with cache
        const tierBtn = e.target.closest('.tier-chip');
        if (tierBtn) {
            const boost = Number(tierBtn.dataset.boost);
            if (TradeState.selectedPoolBoostBips !== boost) {
                TradeState.selectedPoolBoostBips = boost;
                TradeState.firstAvailableTokenId = null; // Reset selection
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

        // Inventory item click - user selected a specific NFT to sell
        const invItem = e.target.closest('.inventory-item');
        if (invItem) {
            // Verificar se o NFT está disponível para venda
            const isUnavailable = invItem.dataset.unavailable === 'true';
            if (isUnavailable) {
                showToast("This NFT is listed for rental and cannot be sold", "warning");
                return;
            }
            
            const boost = Number(invItem.dataset.boost);
            const tokenId = invItem.dataset.tokenid;
            
            TradeState.selectedPoolBoostBips = boost;
            TradeState.tradeDirection = 'sell';
            
            // CORREÇÃO: Salvar o tokenId específico que o usuário clicou
            if (tokenId) {
                TradeState.firstAvailableTokenId = BigInt(tokenId);
                console.log("User selected NFT #" + tokenId + " for sale");
            }
            
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
            // V12.2: Don't manually set button state — txEngine handles it via setPhase()

            // Animate mascot
            if (mascot) mascot.className = 'w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-spin';

            try {
                if (TradeState.tradeDirection === 'buy') {
                    // V12: Buy NFT with cache invalidation
                    await NftTx.buyFromPool({
                        poolAddress: poolAddress,
                        button: executeBtn,
                        
                        onSuccess: async (receipt) => {
                            if (mascot) mascot.className = 'w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success';
                            showToast("🟢 NFT Purchased!", "success");
                            
                            // Invalidate cache and reload
                            invalidatePoolCache(TradeState.selectedPoolBoostBips);
                            await Promise.all([
                                loadMyBoostersFromAPI(true),
                                loadDataForSelectedPool(true)
                            ]);
                            loadTradeHistory();
                        },
                        
                        onError: (error) => {
                            if (!error.cancelled && error.type !== 'user_rejected') {
                                const msg = error.message || error.reason || 'Transaction failed';
                                showToast("Buy failed: " + msg, "error");
                            }
                        }
                    });
                } else {
                    // V12: Validate we have a token to sell
                    if (!TradeState.firstAvailableTokenId) {
                        showToast("No NFT selected for sale", "error");
                        isTransactionInProgress = false;
                        return;
                    }
                    
                    // V12: Sell NFT with cache invalidation
                    await NftTx.sellToPool({
                        poolAddress: poolAddress,
                        tokenId: TradeState.firstAvailableTokenId,
                        button: executeBtn,
                        
                        onSuccess: async (receipt) => {
                            if (mascot) mascot.className = 'w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success';
                            showToast("🔴 NFT Sold!", "success");
                            
                            // Invalidate cache and reload
                            invalidatePoolCache(TradeState.selectedPoolBoostBips);
                            await Promise.all([
                                loadMyBoostersFromAPI(true),
                                loadDataForSelectedPool(true)
                            ]);
                            loadTradeHistory();
                        },
                        
                        onError: (error) => {
                            if (!error.cancelled && error.type !== 'user_rejected') {
                                const msg = error.message || error.reason || 'Transaction failed';
                                showToast("Sell failed: " + msg, "error");
                            }
                        }
                    });
                }
            } finally {
                isTransactionInProgress = false;

                // V12.1: Always refresh data after transaction attempt
                // This ensures UI is updated even if callback failed
                setTimeout(async () => {
                    try {
                        await Promise.all([
                            loadMyBoostersFromAPI(true),
                            loadDataForSelectedPool(true)
                        ]);
                        loadTradeHistory();
                    } catch (e) {
                        console.warn('[Store] Post-transaction refresh failed:', e.message);
                    }
                }, 2000);
                
                // Reset mascot animation
                if (mascot) {
                    setTimeout(() => {
                        const isBuy = TradeState.tradeDirection === 'buy';
                        mascot.className = `w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${isBuy ? 'trade-buy' : 'trade-sell'}`;
                    }, 800);
                }
            }
        }
    });
}