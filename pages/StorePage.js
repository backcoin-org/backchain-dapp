// pages/StorePage.js
// ✅ VERSION V6.7: Enhanced UX with animated logo loading

const ethers = window.ethers;

import { State } from '../state.js';
import { loadUserData, loadMyBoostersFromAPI, safeContractCall, getHighestBoosterBoostFromAPI, loadSystemDataFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { executeBuyBooster, executeSellBooster } from '../modules/transactions.js';
import { formatBigNumber, renderNoData } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers, addresses, nftPoolABI, ipfsGateway } from '../config.js';

// 🔥 V6.7: Custom animated loading with BKC logo
function renderStoreLoading(message = 'Loading pool data...') {
    return `
        <div class="flex flex-col items-center justify-center py-8 gap-4">
            <div class="relative">
                <!-- Outer glow ring -->
                <div class="absolute inset-0 w-16 h-16 rounded-full bg-amber-500/20 animate-ping"></div>
                <!-- Spinning border -->
                <div class="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-amber-500 border-r-amber-500/50 animate-spin"></div>
                <!-- Logo container with pulse -->
                <div class="relative w-16 h-16 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-lg shadow-amber-500/10 animate-pulse">
                    <img src="./assets/bkc_logo_3d.png" alt="BKC" class="w-10 h-10 drop-shadow-lg" onerror="this.src='./assets/favicon.png'">
                </div>
            </div>
            <div class="text-center">
                <p class="text-zinc-400 text-sm font-medium animate-pulse">${message}</p>
                <p class="text-zinc-600 text-xs mt-1">Please wait...</p>
            </div>
        </div>
    `;
}

// 🔥 V6.7: Skeleton loading for swap interface
function renderSwapSkeleton() {
    return `
        <div class="animate-pulse space-y-4">
            <!-- Direction Toggle Skeleton -->
            <div class="flex bg-zinc-800/50 rounded-lg p-1 mb-4">
                <div class="flex-1 h-10 bg-zinc-700/50 rounded-md"></div>
                <div class="flex-1 h-10 bg-zinc-700/30 rounded-md ml-1"></div>
            </div>
            
            <!-- Swap Card Skeleton -->
            <div class="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50">
                <div class="flex justify-between items-center mb-4">
                    <div class="h-8 w-24 bg-zinc-700/50 rounded"></div>
                    <div class="h-10 w-28 bg-zinc-700/50 rounded-lg"></div>
                </div>
                <div class="flex justify-center my-4">
                    <div class="w-8 h-8 bg-zinc-700/50 rounded-full"></div>
                </div>
                <div class="flex justify-between items-center">
                    <div class="h-8 w-16 bg-zinc-700/50 rounded"></div>
                    <div class="h-10 w-28 bg-zinc-700/50 rounded-lg"></div>
                </div>
            </div>
        </div>
    `;
}

// 🔥 V6.4: Factory ABI to get pool addresses dynamically
const factoryABI = [
    "function getPoolAddress(uint256 boostBips) view returns (address)",
    "function isPool(address) view returns (bool)"
];

// Cache for pool addresses (they don't change)
const poolAddressCache = new Map();

// 🔥 V6.5: Global flag to prevent multiple transactions
let isTransactionInProgress = false;

// --- LOCAL STATE ---
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
    lastFetchTimestamp: 0
};

// --- HELPERS ---
const EXPLORER_BASE_URL = "https://sepolia.arbiscan.io/tx/";

function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        const date = new Date(secs * 1000);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    } catch (e) { return 'Recent'; }
}

function buildImageUrl(ipfsIoUrl) {
    if (!ipfsIoUrl) return './assets/bkc_logo_3d.png';
    if (ipfsIoUrl.startsWith('https://') || ipfsIoUrl.startsWith('http://')) return ipfsIoUrl;
    if (ipfsIoUrl.includes('ipfs.io/ipfs/')) return `${ipfsGateway}${ipfsIoUrl.split('ipfs.io/ipfs/')[1]}`;
    if (ipfsIoUrl.startsWith('ipfs://')) return `${ipfsGateway}${ipfsIoUrl.substring(7)}`;
    return ipfsIoUrl;
}

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
        showToast("Added to wallet!", "success");
    } catch (error) {
        console.error("MetaMask Error:", error);
    }
}

// 🔥 V6.7: Inject custom CSS for animations
function injectStoreStyles() {
    if (document.getElementById('store-custom-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'store-custom-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.3); }
            50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.6); }
        }
        
        .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-slideUp {
            animation: slideUp 0.4s ease-out forwards;
        }
        
        .store-glow {
            animation: pulseGlow 2s ease-in-out infinite;
        }
        
        .tier-btn {
            backdrop-filter: blur(4px);
        }
        
        .tier-btn:hover img {
            transform: scale(1.1);
            transition: transform 0.2s ease;
        }
        
        #swap-content .swap-arrow:hover i {
            transform: rotate(180deg);
            transition: transform 0.3s ease;
        }
        
        /* Smooth scrollbar for inventory */
        #inventory-grid::-webkit-scrollbar,
        #store-history::-webkit-scrollbar {
            width: 4px;
        }
        
        #inventory-grid::-webkit-scrollbar-track,
        #store-history::-webkit-scrollbar-track {
            background: rgba(39, 39, 42, 0.5);
            border-radius: 2px;
        }
        
        #inventory-grid::-webkit-scrollbar-thumb,
        #store-history::-webkit-scrollbar-thumb {
            background: rgba(113, 113, 122, 0.5);
            border-radius: 2px;
        }
        
        #inventory-grid::-webkit-scrollbar-thumb:hover,
        #store-history::-webkit-scrollbar-thumb:hover {
            background: rgba(161, 161, 170, 0.5);
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// 1. MAIN RENDER
// ============================================================================

export const StorePage = {
    async render(isNewPage) {
        // 🔥 V6.7: Inject custom animations CSS
        injectStoreStyles();
        
        await loadSystemDataFromAPI();
        const container = document.getElementById('store');
        if (!container) return;

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div class="max-w-5xl mx-auto py-6 px-4">
                    
                    <!-- HEADER -->
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h1 class="text-xl font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-store text-amber-400"></i> NFT Market
                            </h1>
                            <p class="text-xs text-zinc-500 mt-0.5">Buy & sell booster NFTs</p>
                        </div>
                        <button id="store-refresh-btn" class="text-xs bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>

                    <!-- MAIN GRID -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        <!-- SWAP CARD (2 cols) -->
                        <div class="lg:col-span-2">
                            <div class="glass-panel p-4 rounded-xl">
                                
                                <!-- TIER SELECTOR -->
                                <div class="mb-4">
                                    <p class="text-[10px] text-zinc-500 uppercase mb-2">Select Tier</p>
                                    <div id="tier-selector" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                        ${renderTierButtons()}
                                    </div>
                                </div>

                                <!-- SWAP INTERFACE -->
                                <div id="swap-content">
                                    ${renderStoreLoading('Fetching pool data...')}
                                </div>

                                <!-- EXECUTE BUTTON -->
                                <div id="swap-button" class="mt-4"></div>
                            </div>

                            <!-- HISTORY -->
                            <div class="glass-panel p-4 rounded-xl mt-4">
                                <h3 class="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                                    <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> Recent Trades
                                </h3>
                                <div id="store-history" class="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    ${renderNoData("Connect wallet to view")}
                                </div>
                            </div>
                        </div>

                        <!-- SIDEBAR (1 col) -->
                        <div class="space-y-4">
                            
                            <!-- INVENTORY -->
                            <div class="glass-panel p-4 rounded-xl">
                                <div class="flex justify-between items-center mb-3">
                                    <h3 class="text-sm font-bold text-zinc-400 uppercase flex items-center gap-2">
                                        <i class="fa-solid fa-box-open text-amber-500"></i> My NFTs
                                    </h3>
                                    <span id="inventory-count" class="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">0</span>
                                </div>
                                <div id="inventory-grid" class="grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                                    ${renderNoData("No NFTs")}
                                </div>
                            </div>

                            <!-- PERKS INFO -->
                            <div class="glass-panel p-4 rounded-xl">
                                <h3 class="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                                    <i class="fa-solid fa-star text-purple-400"></i> NFT Perks
                                </h3>
                                <div class="space-y-3">
                                    <div class="flex gap-3">
                                        <div class="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <i class="fa-solid fa-bolt text-amber-400 text-sm"></i>
                                        </div>
                                        <div>
                                            <p class="text-white text-xs font-bold">Boost Yield</p>
                                            <p class="text-[10px] text-zinc-500">Up to 100% staking efficiency</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-3">
                                        <div class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <i class="fa-solid fa-percent text-green-400 text-sm"></i>
                                        </div>
                                        <div>
                                            <p class="text-white text-xs font-bold">Fee Discounts</p>
                                            <p class="text-[10px] text-zinc-500">Up to 70% off protocol fees</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-3">
                                        <div class="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <i class="fa-solid fa-handshake text-cyan-400 text-sm"></i>
                                        </div>
                                        <div>
                                            <p class="text-white text-xs font-bold">Rental Income</p>
                                            <p class="text-[10px] text-zinc-500">Earn by renting to others</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- MARKET STATS -->
                            <div class="glass-panel p-4 rounded-xl">
                                <h3 class="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                                    <i class="fa-solid fa-chart-simple text-blue-400"></i> Pool Stats
                                </h3>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-xs">
                                        <span class="text-zinc-500">Buy Price</span>
                                        <span id="stat-buy-price" class="text-white font-mono">--</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-zinc-500">Sell Price</span>
                                        <span id="stat-sell-price" class="text-white font-mono">--</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-zinc-500">Sell Fee</span>
                                        <span class="text-red-400 font-mono">10%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            setupEventListeners();
        }

        // Initialize
        if (TradeState.selectedPoolBoostBips === null && boosterTiers.length > 0) {
            TradeState.selectedPoolBoostBips = boosterTiers[0].boostBips;
        }

        await loadDataForSelectedPool();
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
// 2. TIER SELECTOR
// ============================================================================

function renderTierButtons() {
    // Tier-specific colors for better visual feedback
    const tierStyles = {
        'Diamond': { bg: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
        'Platinum': { bg: 'from-slate-300/20 to-gray-400/20', border: 'border-slate-400/50', text: 'text-slate-300', glow: 'shadow-slate-400/20' },
        'Gold': { bg: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
        'Silver': { bg: 'from-gray-400/20 to-slate-400/20', border: 'border-gray-400/50', text: 'text-gray-300', glow: 'shadow-gray-400/20' },
        'Bronze': { bg: 'from-orange-600/20 to-amber-700/20', border: 'border-orange-600/50', text: 'text-orange-400', glow: 'shadow-orange-500/20' }
    };
    
    return boosterTiers.map((tier, idx) => {
        const style = tierStyles[tier.name] || tierStyles['Bronze'];
        const isFirst = idx === 0;
        return `
            <button class="tier-btn flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 ${isFirst ? `bg-gradient-to-r ${style.bg} ${style.border} ${style.text} shadow-lg ${style.glow}` : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-700/50'}" data-boost="${tier.boostBips}" data-tier="${tier.name}">
                <img src="${buildImageUrl(tier.img)}" class="w-6 h-6 rounded ring-1 ${isFirst ? 'ring-white/30' : 'ring-zinc-600/50'}" onerror="this.src='./assets/bkc_logo_3d.png'">
                <span class="text-xs font-bold">${tier.name}</span>
            </button>
        `;
    }).join('');
}

function updateTierSelection(boostBips) {
    const tierStyles = {
        'Diamond': { bg: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
        'Platinum': { bg: 'from-slate-300/20 to-gray-400/20', border: 'border-slate-400/50', text: 'text-slate-300', glow: 'shadow-slate-400/20' },
        'Gold': { bg: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
        'Silver': { bg: 'from-gray-400/20 to-slate-400/20', border: 'border-gray-400/50', text: 'text-gray-300', glow: 'shadow-gray-400/20' },
        'Bronze': { bg: 'from-orange-600/20 to-amber-700/20', border: 'border-orange-600/50', text: 'text-orange-400', glow: 'shadow-orange-500/20' }
    };

    document.querySelectorAll('.tier-btn').forEach(btn => {
        const isSelected = Number(btn.dataset.boost) === boostBips;
        const tierName = btn.dataset.tier;
        const style = tierStyles[tierName] || tierStyles['Bronze'];
        const img = btn.querySelector('img');
        
        // Reset all classes first
        btn.className = 'tier-btn flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95';
        
        if (isSelected) {
            btn.classList.add('bg-gradient-to-r', ...style.bg.split(' '), style.border, style.text, 'shadow-lg', style.glow);
            if (img) img.className = 'w-6 h-6 rounded ring-1 ring-white/30';
        } else {
            btn.classList.add('bg-zinc-800/50', 'border-zinc-700', 'text-zinc-400', 'hover:border-zinc-600', 'hover:bg-zinc-700/50');
            if (img) img.className = 'w-6 h-6 rounded ring-1 ring-zinc-600/50';
        }
    });
}

// ============================================================================
// 3. SWAP INTERFACE
// ============================================================================

function renderSwapInterface() {
    const content = document.getElementById('swap-content');
    if (!content) return;

    const selectedTier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
    const isBuy = TradeState.tradeDirection === 'buy';

    const price = isBuy ? TradeState.buyPrice : TradeState.netSellPrice;
    const priceFormatted = formatBigNumber(price).toFixed(2);
    const balance = formatBigNumber(State.currentUserBalance || 0n).toFixed(2);

    const soldOut = isBuy && TradeState.firstAvailableTokenIdForBuy === null;
    const insufficientBalance = isBuy && TradeState.buyPrice > (State.currentUserBalance || 0n);
    
    // Get tier color for glow effect
    const tierColors = {
        'Diamond': 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
        'Platinum': 'from-slate-300/20 to-gray-400/20 border-slate-400/30',
        'Gold': 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
        'Silver': 'from-gray-400/20 to-slate-400/20 border-gray-400/30',
        'Bronze': 'from-orange-600/20 to-amber-700/20 border-orange-600/30'
    };
    const tierGlow = tierColors[selectedTier?.name] || 'from-zinc-600/20 to-zinc-700/20 border-zinc-600/30';

    content.innerHTML = `
        <div class="animate-fadeIn">
            <!-- Direction Toggle -->
            <div class="flex bg-zinc-800/50 rounded-lg p-1 mb-4 border border-zinc-700/30">
                <button class="direction-btn flex-1 py-2.5 rounded-md text-sm font-bold transition-all duration-200 ${isBuy ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30'}" data-direction="buy">
                    <i class="fa-solid fa-cart-plus mr-1.5"></i> Buy
                </button>
                <button class="direction-btn flex-1 py-2.5 rounded-md text-sm font-bold transition-all duration-200 ${!isBuy ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30'}" data-direction="sell">
                    <i class="fa-solid fa-money-bill-transfer mr-1.5"></i> Sell
                </button>
            </div>

            <!-- Swap Card -->
            <div class="bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 rounded-xl p-4 border border-zinc-700/50 backdrop-blur-sm">
                
                <!-- Top Row - What you give -->
                <div class="flex justify-between items-center mb-1">
                    <span class="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">${isBuy ? 'You Pay' : 'You Sell'}</span>
                    <span class="text-[10px] ${insufficientBalance ? 'text-red-400' : 'text-zinc-600'}">${isBuy ? `Balance: ${balance} BKC` : `Owned: ${TradeState.userBalanceOfSelectedNFT}`}</span>
                </div>
                <div class="flex justify-between items-center mb-4">
                    <span class="text-2xl font-bold ${insufficientBalance ? 'text-red-400' : 'text-white'} tabular-nums">${isBuy ? priceFormatted : '1'}</span>
                    <div class="flex items-center gap-2 bg-zinc-700/50 px-3 py-2 rounded-lg border border-zinc-600/30 ${isBuy ? '' : `bg-gradient-to-r ${tierGlow}`}">
                        <img src="${isBuy ? './assets/bkc_logo_3d.png' : buildImageUrl(selectedTier?.img)}" class="w-6 h-6 rounded ${!isBuy ? 'ring-1 ring-white/20' : ''}" onerror="this.src='./assets/bkc_logo_3d.png'">
                        <span class="text-white text-sm font-bold">${isBuy ? 'BKC' : (selectedTier?.name || 'NFT')}</span>
                    </div>
                </div>

                <!-- Animated Swap Arrow -->
                <div class="flex justify-center my-2 relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-zinc-700/50"></div>
                    </div>
                    <div class="relative w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-full flex items-center justify-center border border-zinc-600/50 shadow-lg hover:scale-110 transition-transform cursor-pointer swap-arrow">
                        <i class="fa-solid fa-arrow-down text-zinc-300 text-sm"></i>
                    </div>
                </div>

                <!-- Bottom Row - What you receive -->
                <div class="flex justify-between items-center mb-1 mt-4">
                    <span class="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">${isBuy ? 'You Receive' : 'You Get'}</span>
                    <div class="flex gap-2">
                        ${soldOut ? '<span class="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">Sold Out</span>' : ''}
                        ${!isBuy ? '<span class="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">-10% Fee</span>' : ''}
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-bold text-white tabular-nums">${isBuy ? '1' : priceFormatted}</span>
                    <div class="flex items-center gap-2 bg-zinc-700/50 px-3 py-2 rounded-lg border border-zinc-600/30 ${isBuy ? `bg-gradient-to-r ${tierGlow}` : ''}">
                        <img src="${isBuy ? buildImageUrl(selectedTier?.img) : './assets/bkc_logo_3d.png'}" class="w-6 h-6 rounded ${isBuy ? 'ring-1 ring-white/20' : ''}" onerror="this.src='./assets/bkc_logo_3d.png'">
                        <span class="text-white text-sm font-bold">${isBuy ? (selectedTier?.name || 'NFT') : 'BKC'}</span>
                    </div>
                </div>
            </div>

            <!-- Info Row -->
            <div class="flex justify-between items-center mt-3 text-xs px-1">
                <span class="text-zinc-500 flex items-center gap-1.5">
                    <i class="fa-solid fa-chart-line text-zinc-600"></i>
                    ${isBuy ? 'Bonding curve pricing' : 'Net after 10% sell fee'}
                </span>
                <span class="text-amber-500/80 font-medium flex items-center gap-1">
                    <i class="fa-solid fa-bolt text-amber-400/60"></i>
                    +${(selectedTier?.boostBips || 0) / 100}% boost
                </span>
            </div>
        </div>
    `;

    // Update stats
    const buyPriceEl = document.getElementById('stat-buy-price');
    const sellPriceEl = document.getElementById('stat-sell-price');
    if (buyPriceEl) buyPriceEl.textContent = `${formatBigNumber(TradeState.buyPrice).toFixed(2)} BKC`;
    if (sellPriceEl) sellPriceEl.textContent = `${formatBigNumber(TradeState.netSellPrice).toFixed(2)} BKC`;
    
    // Add click handler for swap arrow to toggle direction
    const swapArrow = content.querySelector('.swap-arrow');
    if (swapArrow) {
        swapArrow.addEventListener('click', () => {
            TradeState.tradeDirection = TradeState.tradeDirection === 'buy' ? 'sell' : 'buy';
            renderSwapInterface();
            renderExecuteButton();
        });
    }
}

function renderExecuteButton() {
    const container = document.getElementById('swap-button');
    if (!container) return;

    let text = "Select a Tier";
    let icon = "fa-question";
    let active = false;
    let actionType = "trade";

    if (!State.isConnected) {
        text = "Connect Wallet";
        icon = "fa-wallet";
        actionType = "connect";
        active = true;
    } else if (TradeState.selectedPoolBoostBips !== null) {
        if (TradeState.tradeDirection === 'buy') {
            if (TradeState.buyPrice === 0n) { text = "Price Unavailable"; icon = "fa-ban"; }
            else if (TradeState.buyPrice > (State.currentUserBalance || 0n)) { text = "Insufficient Balance"; icon = "fa-coins"; }
            else if (TradeState.firstAvailableTokenIdForBuy === null) { text = "Sold Out"; icon = "fa-box-open"; }
            else { text = "Buy NFT"; icon = "fa-cart-plus"; active = true; }
        } else {
            if (TradeState.userBalanceOfSelectedNFT === 0) { text = "No NFT to Sell"; icon = "fa-box-open"; }
            else if (TradeState.netSellPrice === 0n) { text = "Pool Empty"; icon = "fa-droplet-slash"; }
            else if (TradeState.firstAvailableTokenId === null) { text = "Loading..."; icon = "fa-spinner fa-spin"; }
            else { text = "Sell NFT"; icon = "fa-money-bill-transfer"; active = true; }
        }
    }

    const isBuy = TradeState.tradeDirection === 'buy';
    const bgClass = isBuy
        ? (active ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black shadow-lg shadow-green-500/20' : 'bg-zinc-700/80 text-zinc-500 cursor-not-allowed')
        : (active ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-lg shadow-red-500/20' : 'bg-zinc-700/80 text-zinc-500 cursor-not-allowed');

    container.innerHTML = `
        <button id="execute-trade-btn" 
                class="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 transform ${active ? 'hover:scale-[1.02] active:scale-[0.98]' : ''} ${bgClass} flex items-center justify-center gap-2" 
                ${!active ? 'disabled' : ''} 
                data-action="${actionType}"
                data-processing="false">
            <i class="fa-solid ${icon}"></i>
            <span>${text}</span>
        </button>
    `;
}

// ============================================================================
// 4. INVENTORY
// ============================================================================

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    const countEl = document.getElementById('inventory-count');
    if (!grid) return;

    if (!State.isConnected) {
        grid.innerHTML = `<div class="col-span-3 text-center py-6 text-xs text-zinc-600">Connect wallet</div>`;
        if (countEl) countEl.textContent = '0';
        return;
    }

    const boosters = State.myBoosters || [];
    if (countEl) countEl.textContent = boosters.length;

    if (boosters.length === 0) {
        grid.innerHTML = `<div class="col-span-3 text-center py-6 text-xs text-zinc-600">No NFTs yet</div>`;
        return;
    }

    // 🔥 V6.2: Debug log to see booster data structure
    console.log('My Boosters:', boosters);

    grid.innerHTML = boosters.map(nft => {
        // 🔥 V6.2: Try multiple ways to find the tier
        const boostBips = nft.boostBips || nft.boost || nft.boostBIPS || 0;
        let tier = boosterTiers.find(t => t.boostBips === boostBips);
        
        // Try by name if boostBips didn't work
        if (!tier && nft.name) {
            const nameLower = nft.name.toLowerCase();
            tier = boosterTiers.find(t => nameLower.includes(t.name.toLowerCase()));
        }
        
        // Try by tier name
        if (!tier && nft.tier) {
            tier = boosterTiers.find(t => t.name.toLowerCase() === nft.tier.toLowerCase());
        }
        
        // Default fallback
        if (!tier) {
            tier = { name: 'Booster', img: null, boostBips: boostBips };
        }

        const imgUrl = nft.imageUrl || nft.image || buildImageUrl(tier.img);
        const tierName = tier.name || 'Booster';
        const boostPercent = boostBips ? `+${boostBips / 100}%` : '';

        return `
            <div class="inv-item relative bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2 cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800 transition-all group" data-boost="${boostBips}" data-id="${nft.tokenId}">
                <button class="wallet-btn absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-black text-[9px] opacity-0 group-hover:opacity-100 transition-opacity z-10" data-id="${nft.tokenId}" data-img="${imgUrl}">
                    <i class="fa-solid fa-wallet"></i>
                </button>
                <img src="${imgUrl}" class="w-full aspect-square object-contain mb-1" onerror="this.src='./assets/bkc_logo_3d.png'">
                <p class="text-[9px] text-zinc-400 text-center font-bold truncate">${tierName}</p>
                <p class="text-[8px] text-zinc-600 text-center">#${nft.tokenId}${boostPercent ? ` ${boostPercent}` : ''}</p>
            </div>
        `;
    }).join('');
}

// ============================================================================
// 5. HISTORY
// ============================================================================

async function loadStoreHistory() {
    const el = document.getElementById('store-history');
    if (!el) return;

    if (!State.isConnected) {
        el.innerHTML = `<div class="text-center py-4 text-xs text-zinc-600">Connect wallet</div>`;
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
        if (!response.ok) throw new Error("API Error");

        const data = await response.json();
        const history = data.filter(tx =>
            tx.type === 'BoosterBuy' ||
            tx.type === 'NFTSold' ||
            tx.type === 'NFTBought' ||
            tx.type === 'PublicSale'
        );

        if (history.length === 0) {
            el.innerHTML = `<div class="text-center py-4 text-xs text-zinc-600">No trades yet</div>`;
            return;
        }

        el.innerHTML = history.slice(0, 5).map(tx => {
            const isBuy = tx.type === 'BoosterBuy' || tx.type === 'NFTBought' || tx.type === 'PublicSale';
            const price = formatBigNumber(BigInt(tx.details?.amount || tx.amount || 0)).toFixed(2);
            const dateStr = formatDate(tx.timestamp || tx.createdAt);
            const tokenId = tx.details?.tokenId || tx.tokenId || '?';
            const txLink = `${EXPLORER_BASE_URL}${tx.txHash}`;

            return `
                <a href="${txLink}" target="_blank" class="flex items-center justify-between p-2 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-colors group">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full ${isBuy ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center">
                            <i class="fa-solid ${isBuy ? 'fa-cart-plus text-green-400' : 'fa-money-bill text-red-400'} text-[10px]"></i>
                        </div>
                        <div>
                            <p class="text-white text-xs font-medium">${isBuy ? 'Bought' : 'Sold'} #${tokenId}</p>
                            <p class="text-[10px] text-zinc-600">${dateStr}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-white text-xs font-mono">${price} BKC</p>
                        <i class="fa-solid fa-external-link text-[8px] text-zinc-600 group-hover:text-blue-400"></i>
                    </div>
                </a>
            `;
        }).join('');

    } catch (e) {
        console.error("History error:", e);
        el.innerHTML = `<div class="text-center py-4 text-xs text-red-400/50">Failed to load</div>`;
    }
}

// ============================================================================
// 6. DATA LOADING
// ============================================================================

async function loadDataForSelectedPool() {
    const now = Date.now();
    if (now - TradeState.lastFetchTimestamp < 3000 && TradeState.isDataLoading) return;
    if (TradeState.selectedPoolBoostBips === null) return;

    TradeState.isDataLoading = true;
    TradeState.lastFetchTimestamp = now;

    const content = document.getElementById('swap-content');
    const selectedTier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
    const tierName = selectedTier?.name || 'Pool';
    if (content) content.innerHTML = renderStoreLoading(`Loading ${tierName} pool...`);

    try {
        const boostBips = TradeState.selectedPoolBoostBips;
        const tier = boosterTiers.find(t => t.boostBips === boostBips);
        
        // 🔥 V6.2: Validate tier exists
        if (!tier) {
            throw new Error("Invalid tier selected.");
        }
        
        // 🔥 V6.3: Get pool address from Factory (cached)
        let poolAddress = poolAddressCache.get(boostBips);
        
        if (!poolAddress) {
            // Try to get from addresses first (for backwards compatibility)
            const poolKey = `pool_${tier.name.toLowerCase()}`;
            poolAddress = addresses[poolKey];
            
            // If not in addresses, fetch from Factory
            if (!poolAddress || !poolAddress.startsWith('0x')) {
                const factoryAddress = addresses.nftPoolFactory || addresses.nftLiquidityPoolFactory;
                
                if (!factoryAddress) {
                    throw new Error("Factory address not configured.");
                }
                
                console.log(`Fetching pool address for ${tier.name} (${boostBips} bips) from factory...`);
                const factoryContract = new ethers.Contract(factoryAddress, factoryABI, State.publicProvider);
                poolAddress = await factoryContract.getPoolAddress(boostBips);
                
                if (!poolAddress || poolAddress === ethers.ZeroAddress) {
                    throw new Error(`Pool for ${tier.name} not deployed.`);
                }
                
                console.log(`Pool address for ${tier.name}: ${poolAddress}`);
            }
            
            // Cache the address
            poolAddressCache.set(boostBips, poolAddress);
        }

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.publicProvider);
        const boosterContract = State.rewardBoosterContract || State.rewardBoosterContractPublic;

        // Load user data
        if (State.isConnected) {
            await Promise.all([loadUserData(), loadMyBoostersFromAPI()]);
            const { highestBoost, tokenId } = await getHighestBoosterBoostFromAPI();
            TradeState.bestBoosterTokenId = tokenId ? BigInt(tokenId) : 0n;
            TradeState.bestBoosterBips = Number(highestBoost);

            // 🔥 V6.2: More flexible booster filtering
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

        // Load pool data - 🔥 V6.3: Better pool status detection
        let buyPrice = ethers.MaxUint256;
        let sellPrice = 0n;
        let availableTokenIds = [];
        let baseTaxBips = State.systemFees?.["NFT_POOL_SELL_TAX_BIPS"] || 1000n;
        let discountBips = BigInt(State.boosterDiscounts?.[TradeState.bestBoosterBips] || 0);

        // 🔥 V6.3: First check pool info to see if initialized
        try {
            const poolInfo = await safeContractCall(poolContract, 'getPoolInfo', [], null);
            if (poolInfo) {
                console.log(`Pool ${tier.name} info:`, {
                    tokenBalance: poolInfo.tokenBalance?.toString(),
                    nftCount: poolInfo.nftCount?.toString(),
                    k: poolInfo.k?.toString(),
                    isInitialized: poolInfo.isInitialized
                });
                
                if (!poolInfo.isInitialized) {
                    console.warn(`Pool ${tier.name} is not initialized`);
                }
            }
        } catch (e) {
            console.warn('getPoolInfo failed:', e.message);
        }

        // Try to get prices
        try {
            buyPrice = await safeContractCall(poolContract, 'getBuyPrice', [], ethers.MaxUint256);
            console.log(`${tier.name} Buy Price:`, buyPrice.toString());
        } catch (e) {
            console.warn('getBuyPrice failed:', e.message);
        }

        try {
            sellPrice = await safeContractCall(poolContract, 'getSellPrice', [], 0n);
            console.log(`${tier.name} Sell Price:`, sellPrice.toString());
        } catch (e) {
            console.warn('getSellPrice failed:', e.message);
        }

        // Try to get available tokens - 🔥 V6.3: Use correct function name!
        try {
            // Contract function is getAvailableNFTs(), NOT getAvailableTokenIds()
            const result = await poolContract.getAvailableNFTs();
            availableTokenIds = Array.isArray(result) ? [...result] : [];
            console.log(`${tier.name} Available NFTs:`, availableTokenIds.length, availableTokenIds.map(id => id.toString()));
        } catch (e) {
            console.warn(`getAvailableNFTs failed for ${tier.name}:`, e.message);
            availableTokenIds = [];
        }

        TradeState.firstAvailableTokenIdForBuy = (availableTokenIds.length > 0) ? BigInt(availableTokenIds[availableTokenIds.length - 1]) : null;
        TradeState.buyPrice = (buyPrice === ethers.MaxUint256) ? 0n : buyPrice;
        TradeState.sellPrice = sellPrice;

        // Calculate sell fee
        const baseTaxBipsBigInt = typeof baseTaxBips === 'bigint' ? baseTaxBips : BigInt(baseTaxBips);
        const discountBipsBigInt = typeof discountBips === 'bigint' ? discountBips : BigInt(discountBips);
        const finalTaxBips = (baseTaxBipsBigInt > discountBipsBigInt) ? (baseTaxBipsBigInt - discountBipsBigInt) : 0n;
        const taxAmount = (sellPrice * finalTaxBips) / 10000n;
        TradeState.netSellPrice = sellPrice - taxAmount;

        TradeState.meetsPStakeRequirement = true;

    } catch (err) {
        console.warn("Store Data Warning:", err.message);
        // 🔥 V6.1: Show user-friendly message when pool fails
        const content = document.getElementById('swap-content');
        if (content && err.message?.includes('Pool not deployed')) {
            content.innerHTML = `
                <div class="text-center py-8">
                    <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-lock text-zinc-600"></i>
                    </div>
                    <p class="text-zinc-400 text-sm font-medium">Pool Not Available</p>
                    <p class="text-zinc-600 text-xs mt-1">This tier is not deployed yet</p>
                </div>
            `;
        }
    } finally {
        TradeState.isDataLoading = false;
        renderSwapInterface();
        renderExecuteButton();
        renderInventory();
        loadStoreHistory();
    }
}

// ============================================================================
// 7. EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    const container = document.getElementById('store');
    if (!container) return;

    container.addEventListener('click', async (e) => {
        // Refresh button
        if (e.target.closest('#store-refresh-btn')) {
            const btn = e.target.closest('#store-refresh-btn');
            const icon = btn.querySelector('i');
            icon.classList.add('fa-spin');
            await loadDataForSelectedPool();
            icon.classList.remove('fa-spin');
            return;
        }

        // Tier selection
        const tierBtn = e.target.closest('.tier-btn');
        if (tierBtn) {
            const boost = Number(tierBtn.dataset.boost);
            if (TradeState.selectedPoolBoostBips !== boost) {
                TradeState.selectedPoolBoostBips = boost;
                updateTierSelection(boost);
                await loadDataForSelectedPool();
            }
            return;
        }

        // Direction toggle
        const dirBtn = e.target.closest('.direction-btn');
        if (dirBtn) {
            const direction = dirBtn.dataset.direction;
            if (TradeState.tradeDirection !== direction) {
                TradeState.tradeDirection = direction;
                renderSwapInterface();
                renderExecuteButton();
            }
            return;
        }

        // Inventory item click (sell)
        const invItem = e.target.closest('.inv-item');
        if (invItem && !e.target.closest('.wallet-btn')) {
            const boost = Number(invItem.dataset.boost);
            TradeState.selectedPoolBoostBips = boost;
            TradeState.tradeDirection = 'sell';
            updateTierSelection(boost);
            await loadDataForSelectedPool();
            return;
        }

        // Wallet button
        const walletBtn = e.target.closest('.wallet-btn');
        if (walletBtn) {
            e.stopPropagation();
            addToWallet(walletBtn.dataset.id, walletBtn.dataset.img);
            return;
        }

        // Execute trade
        const executeBtn = e.target.closest('#execute-trade-btn');
        if (executeBtn) {
            // 🔥 V6.6: Robust click prevention
            e.preventDefault();
            e.stopPropagation();
            
            // Check BOTH the flag AND button state
            if (isTransactionInProgress || executeBtn.disabled || executeBtn.dataset.processing === 'true') {
                console.log('Transaction already in progress, ignoring click');
                return;
            }
            
            const action = executeBtn.dataset.action;

            if (action === "connect") {
                window.openConnectModal();
                return;
            }

            const tier = boosterTiers.find(t => t.boostBips === TradeState.selectedPoolBoostBips);
            if (!tier) return;

            const poolKey = `pool_${tier.name.toLowerCase()}`;
            const poolAddress = addresses[poolKey];

            // 🔥 V6.6: Set ALL flags immediately and synchronously
            isTransactionInProgress = true;
            executeBtn.disabled = true;
            executeBtn.dataset.processing = 'true';
            const originalText = executeBtn.innerHTML;
            executeBtn.innerHTML = '<div class="loader inline-block"></div> Processing...';

            try {
                if (TradeState.tradeDirection === 'buy') {
                    const success = await executeBuyBooster(poolAddress, TradeState.buyPrice, TradeState.bestBoosterTokenId, executeBtn);
                    if (success) {
                        showToast("NFT Purchased!", "success");
                        await loadDataForSelectedPool();
                    }
                } else {
                    const success = await executeSellBooster(poolAddress, TradeState.firstAvailableTokenId, TradeState.bestBoosterTokenId, executeBtn);
                    if (success) {
                        showToast("NFT Sold!", "success");
                        await loadDataForSelectedPool();
                    }
                }
            } finally {
                // 🔥 V6.6: Reset ALL flags after transaction completes
                isTransactionInProgress = false;
                executeBtn.disabled = false;
                executeBtn.dataset.processing = 'false';
                executeBtn.innerHTML = originalText;
            }
        }
    });
}