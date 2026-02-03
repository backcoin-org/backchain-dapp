// js/pages/StorePage.js
// ✅ PRODUCTION V6.9 - Complete Redesign
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                     NFT Store - AMM Liquidity Pool
// ═══════════════════════════════════════════════════════════════════════════════
//
// V6.9 Changes:
// - COMPLETE UI REDESIGN - Modern, clean, consistent with other pages
// - Better price display with bonding curve visualization
// - Improved tier cards with keep rate display
// - Enhanced buy/sell modals
// - Smoother transitions and animations
// - Consistent styling with all V6.9 pages
//
// Features:
// - AMM-style NFT trading with XY=K bonding curve
// - 4 Tiers: Diamond (100%), Gold (90%), Silver (75%), Bronze (60%)
// - Buy NFT from pool, Sell NFT back to pool
// - Dynamic pricing based on pool liquidity
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

const ethers = window.ethers;
import { State } from '../state.js';
import { formatBigNumber } from '../utils.js';
import { safeContractCall, loadPublicData, loadUserData } from '../modules/data.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers, getKeepRateFromBoost } from '../config.js';
import { StoreTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";

// Tier configurations
const TIER_CONFIG = {
    'Diamond': { emoji: '💎', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.3)', keepRate: 100, boostBips: 5000 },
    'Gold': { emoji: '🥇', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', keepRate: 90, boostBips: 4000 },
    'Silver': { emoji: '🥈', color: '#9ca3af', bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.3)', keepRate: 75, boostBips: 2500 },
    'Bronze': { emoji: '🥉', color: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.3)', keepRate: 60, boostBips: 1000 }
};

// ============================================================================
// STATE
// ============================================================================

const Store = {
    activeTab: 'buy',
    selectedTier: null,
    pools: {},  // Pool data per tier
    userNFTs: [], // User's NFTs for selling
    isLoading: false,
    isTransactionPending: false
};

// ============================================================================
// UTILITIES
// ============================================================================

function getTierConfig(name) {
    return TIER_CONFIG[name] || TIER_CONFIG['Bronze'];
}

function formatPrice(wei) {
    if (!wei || wei === 0n) return '0.00';
    return parseFloat(ethers.formatEther(wei)).toFixed(2);
}

function formatETH(wei) {
    if (!wei || wei === 0n) return '0.000';
    return parseFloat(ethers.formatEther(wei)).toFixed(4);
}

// ============================================================================
// STYLES
// ============================================================================

function injectStyles() {
    if (document.getElementById('store-styles-v6')) return;
    const style = document.createElement('style');
    style.id = 'store-styles-v6';
    style.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Store Page Styles - Modern & Clean
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0); } 
            50% { transform: translateY(-8px); } 
        }
        @keyframes pulse-glow { 
            0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.2); } 
            50% { box-shadow: 0 0 40px rgba(139,92,246,0.4); } 
        }
        @keyframes card-in {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .float-animation { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        
        /* Cards */
        .store-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            transition: all 0.3s ease;
        }
        .store-card:hover {
            border-color: rgba(139,92,246,0.3);
        }
        
        /* Tier Cards */
        .tier-card {
            background: linear-gradient(165deg, rgba(24,24,27,0.98) 0%, rgba(15,15,17,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.4);
            border-radius: 20px;
            overflow: hidden;
            animation: card-in 0.5s ease-out forwards;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
        }
        .tier-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 25px 50px -15px rgba(0,0,0,0.5);
        }
        .tier-card.selected {
            border-color: rgba(139,92,246,0.5);
            box-shadow: 0 0 30px -10px rgba(139,92,246,0.3);
        }
        
        /* Tabs */
        .store-tab {
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 12px;
            transition: all 0.25s;
            cursor: pointer;
            color: #71717a;
            white-space: nowrap;
            border: none;
            background: transparent;
        }
        .store-tab:hover:not(.active) {
            color: #a1a1aa;
            background: rgba(63,63,70,0.3);
        }
        .store-tab.active {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: #fff;
            box-shadow: 0 4px 20px rgba(139,92,246,0.35);
        }
        
        /* Buttons */
        .btn-store {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: #fff;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-store:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(139,92,246,0.4);
        }
        .btn-store:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            background: rgba(63,63,70,0.8);
            color: #a1a1aa;
            font-weight: 600;
            border: 1px solid rgba(63,63,70,0.8);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-secondary:hover {
            background: rgba(63,63,70,1);
            color: #fff;
        }
        
        .btn-sell {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #fff;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-sell:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(239,68,68,0.4);
        }
        
        /* Modal */
        .store-modal {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.9);
            backdrop-filter: blur(10px);
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        .store-modal.active { display: flex; }
        .store-modal-content {
            background: linear-gradient(145deg, rgba(39,39,42,0.98) 0%, rgba(24,24,27,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            width: 100%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        /* Price Display */
        .price-tag {
            font-family: 'SF Mono', 'Roboto Mono', monospace;
        }
        
        /* Pool Stats */
        .pool-stat {
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            padding: 12px 16px;
        }
        
        /* Empty State */
        .store-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .tier-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
            .tier-grid { grid-template-columns: 1fr !important; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN RENDER
// ============================================================================

function render() {
    const container = document.getElementById('store');
    if (!container) return;
    
    injectStyles();
    
    container.innerHTML = `
        <div class="max-w-5xl mx-auto px-4 py-6">
            
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-store text-2xl text-purple-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">NFT Store</h1>
                        <p class="text-sm text-zinc-500">Buy & sell RewardBooster NFTs</p>
                    </div>
                </div>
                <div id="balance-display" class="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 text-sm">
                    <i class="fa-solid fa-wallet text-purple-400"></i>
                    <span class="text-zinc-400">--</span>
                </div>
            </div>
            
            <!-- Info Banner -->
            <div class="store-card p-5 mb-6 border-purple-500/20">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-lightbulb text-purple-400"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-white mb-1">Why Buy an NFT?</h3>
                        <p class="text-xs text-zinc-400">
                            NFTs reduce your burn rate when claiming staking rewards. Without an NFT, 50% is burned. 
                            With Diamond NFT, you keep 100% of your rewards!
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Tabs -->
            <div class="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800/50">
                <button class="store-tab ${Store.activeTab === 'buy' ? 'active' : ''}" data-tab="buy">
                    <i class="fa-solid fa-cart-shopping mr-2"></i>Buy NFT
                </button>
                <button class="store-tab ${Store.activeTab === 'sell' ? 'active' : ''}" data-tab="sell">
                    <i class="fa-solid fa-coins mr-2"></i>Sell NFT
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="tab-content"></div>
        </div>
        
        <!-- Buy Modal -->
        ${renderBuyModal()}
        
        <!-- Sell Modal -->
        ${renderSellModal()}
    `;
    
    attachEventListeners();
    renderTabContent();
    updateBalanceDisplay();
}

function updateBalanceDisplay() {
    const el = document.getElementById('balance-display');
    if (!el) return;
    
    if (!State.isConnected) {
        el.innerHTML = `
            <i class="fa-solid fa-wallet text-zinc-500"></i>
            <span class="text-zinc-500">Not connected</span>
        `;
        return;
    }
    
    const balance = State.currentUserBalance || 0n;
    el.innerHTML = `
        <i class="fa-solid fa-wallet text-purple-400"></i>
        <span class="text-purple-400 font-mono font-bold">${formatBigNumber(balance)} BKC</span>
    `;
}

function renderTabContent() {
    const el = document.getElementById('tab-content');
    if (!el) return;
    
    switch (Store.activeTab) {
        case 'buy': el.innerHTML = renderBuyTab(); break;
        case 'sell': el.innerHTML = renderSellTab(); break;
    }
}

// ============================================================================
// BUY TAB
// ============================================================================

function renderBuyTab() {
    const tiers = Object.keys(TIER_CONFIG);
    
    return `
        <div>
            <!-- Tier Selection -->
            <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Select Tier</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tier-grid">
                ${tiers.map((tierName, idx) => renderTierCard(tierName, idx, 'buy')).join('')}
            </div>
            
            <!-- Pool Info -->
            <div class="mt-8">
                <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">How It Works</h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="store-card p-5">
                        <div class="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center mb-3">
                            <i class="fa-solid fa-chart-line text-purple-400"></i>
                        </div>
                        <h4 class="text-sm font-bold text-white mb-1">Dynamic Pricing</h4>
                        <p class="text-xs text-zinc-500">Prices adjust based on supply. Less NFTs = higher price.</p>
                    </div>
                    <div class="store-card p-5">
                        <div class="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
                            <i class="fa-solid fa-shield-check text-emerald-400"></i>
                        </div>
                        <h4 class="text-sm font-bold text-white mb-1">Reduce Burn Rate</h4>
                        <p class="text-xs text-zinc-500">Keep more of your staking rewards with higher tier NFTs.</p>
                    </div>
                    <div class="store-card p-5">
                        <div class="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3">
                            <i class="fa-solid fa-rotate text-amber-400"></i>
                        </div>
                        <h4 class="text-sm font-bold text-white mb-1">Trade Anytime</h4>
                        <p class="text-xs text-zinc-500">Sell back to the pool whenever you want (10% fee).</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTierCard(tierName, idx, mode) {
    const config = getTierConfig(tierName);
    const pool = Store.pools[tierName] || {};
    const buyPrice = pool.buyPrice ? formatPrice(pool.buyPrice) : '--';
    const sellPrice = pool.sellPrice ? formatPrice(pool.sellPrice) : '--';
    const available = pool.nftCount || 0;
    const ethFee = pool.buyEthFee ? formatETH(pool.buyEthFee) : '0';
    
    return `
        <div class="tier-card ${Store.selectedTier === tierName ? 'selected' : ''}" 
             data-tier="${tierName}" style="animation-delay:${idx * 80}ms">
            
            <!-- Header -->
            <div class="p-4 pb-0 flex items-center justify-between">
                <div class="px-3 py-1.5 rounded-lg text-xs font-bold" 
                     style="background:${config.bg};color:${config.color};border:1px solid ${config.border}">
                    ${config.emoji} ${tierName}
                </div>
                <span class="text-xs font-bold" style="color:${config.color}">Keep ${config.keepRate}%</span>
            </div>
            
            <!-- NFT Display -->
            <div class="relative aspect-square flex items-center justify-center p-4">
                <div class="absolute inset-0 opacity-30" 
                     style="background: radial-gradient(circle at center, ${config.color}20 0%, transparent 70%);"></div>
                <div class="text-6xl float-animation">${config.emoji}</div>
            </div>
            
            <!-- Info -->
            <div class="p-4 pt-0 space-y-3">
                <div class="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
                
                <div class="flex justify-between text-sm">
                    <span class="text-zinc-500">Available</span>
                    <span class="text-white font-bold">${available}</span>
                </div>
                
                ${mode === 'buy' ? `
                    <div class="flex justify-between items-baseline">
                        <span class="text-zinc-500 text-sm">Buy Price</span>
                        <div class="text-right">
                            <span class="text-lg font-bold text-white price-tag">${buyPrice}</span>
                            <span class="text-xs text-zinc-500"> BKC</span>
                        </div>
                    </div>
                    ${ethFee !== '0' ? `
                        <div class="flex justify-between text-xs">
                            <span class="text-zinc-600">+ ETH Fee</span>
                            <span class="text-zinc-400">${ethFee} ETH</span>
                        </div>
                    ` : ''}
                ` : `
                    <div class="flex justify-between items-baseline">
                        <span class="text-zinc-500 text-sm">Sell Price</span>
                        <div class="text-right">
                            <span class="text-lg font-bold text-white price-tag">${sellPrice}</span>
                            <span class="text-xs text-zinc-500"> BKC</span>
                        </div>
                    </div>
                `}
                
                <button class="${mode === 'buy' ? 'btn-store' : 'btn-sell'} w-full py-3 text-sm" 
                        data-action="${mode}" data-tier="${tierName}"
                        ${available === 0 && mode === 'buy' ? 'disabled' : ''}>
                    ${mode === 'buy' ? `<i class="fa-solid fa-cart-plus mr-2"></i>Buy Now` : `<i class="fa-solid fa-coins mr-2"></i>Sell`}
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// SELL TAB
// ============================================================================

function renderSellTab() {
    if (!State.isConnected) {
        return renderConnectPrompt('Sell your NFTs');
    }
    
    const myNFTs = Store.userNFTs || [];
    
    if (myNFTs.length === 0) {
        return `
            <div class="store-empty">
                <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-box-open text-3xl text-zinc-500"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">No NFTs to Sell</h3>
                <p class="text-sm text-zinc-500 mb-4">You don't have any RewardBooster NFTs</p>
                <button class="btn-store px-6 py-3" onclick="StorePage.switchTab('buy')">
                    <i class="fa-solid fa-cart-shopping mr-2"></i>Buy an NFT
                </button>
            </div>
        `;
    }
    
    return `
        <div>
            <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Your NFTs (${myNFTs.length})</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tier-grid">
                ${myNFTs.map((nft, idx) => renderUserNFTCard(nft, idx)).join('')}
            </div>
            
            <div class="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p class="text-sm text-amber-400">
                    <i class="fa-solid fa-info-circle mr-2"></i>
                    Selling an NFT incurs a 10% fee. You'll receive the net amount shown.
                </p>
            </div>
        </div>
    `;
}

function renderUserNFTCard(nft, idx) {
    const tierName = getTierNameFromBoost(nft.boostBips);
    const config = getTierConfig(tierName);
    const pool = Store.pools[tierName] || {};
    const sellPrice = pool.sellPrice ? formatPrice(pool.sellPrice) : '--';
    
    return `
        <div class="tier-card" style="animation-delay:${idx * 80}ms">
            <div class="p-4 pb-0 flex items-center justify-between">
                <div class="px-3 py-1.5 rounded-lg text-xs font-bold" 
                     style="background:${config.bg};color:${config.color};border:1px solid ${config.border}">
                    ${config.emoji} ${tierName}
                </div>
                <span class="text-xs font-mono" style="color:${config.color}">#${nft.tokenId}</span>
            </div>
            
            <div class="relative aspect-square flex items-center justify-center p-4">
                <div class="absolute inset-0 opacity-30" 
                     style="background: radial-gradient(circle at center, ${config.color}20 0%, transparent 70%);"></div>
                <div class="text-6xl float-animation">${config.emoji}</div>
            </div>
            
            <div class="p-4 pt-0 space-y-3">
                <div class="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
                
                <div class="flex justify-between items-baseline">
                    <span class="text-zinc-500 text-sm">You'll receive</span>
                    <div class="text-right">
                        <span class="text-lg font-bold text-emerald-400 price-tag">${sellPrice}</span>
                        <span class="text-xs text-zinc-500"> BKC</span>
                    </div>
                </div>
                
                <button class="btn-sell w-full py-3 text-sm" data-action="sell" data-token="${nft.tokenId}" data-tier="${tierName}">
                    <i class="fa-solid fa-coins mr-2"></i>Sell NFT
                </button>
            </div>
        </div>
    `;
}

function getTierNameFromBoost(boostBips) {
    const boost = Number(boostBips);
    if (boost >= 5000) return 'Diamond';
    if (boost >= 4000) return 'Gold';
    if (boost >= 2500) return 'Silver';
    return 'Bronze';
}

// ============================================================================
// MODALS
// ============================================================================

function renderBuyModal() {
    return `
        <div class="store-modal" id="modal-buy">
            <div class="store-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-cart-shopping text-purple-400"></i>Buy NFT
                    </h3>
                    <button onclick="StorePage.closeBuyModal()" class="text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="buy-modal-content" class="p-5">
                    <!-- Content populated dynamically -->
                </div>
            </div>
        </div>
    `;
}

function renderSellModal() {
    return `
        <div class="store-modal" id="modal-sell">
            <div class="store-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-coins text-red-400"></i>Sell NFT
                    </h3>
                    <button onclick="StorePage.closeSellModal()" class="text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="sell-modal-content" class="p-5">
                    <!-- Content populated dynamically -->
                </div>
            </div>
        </div>
    `;
}

function openBuyModal(tierName) {
    const config = getTierConfig(tierName);
    const pool = Store.pools[tierName] || {};
    const buyPrice = pool.buyPrice || 0n;
    const buyTax = pool.buyTax || 0n;
    const totalCost = buyPrice + buyTax;
    const ethFee = pool.buyEthFee || 0n;
    const balance = State.currentUserBalance || 0n;
    const canAfford = balance >= totalCost;
    
    document.getElementById('buy-modal-content').innerHTML = `
        <div class="flex items-center gap-4 mb-5 p-4 rounded-xl" style="background:${config.bg}">
            <div class="text-5xl">${config.emoji}</div>
            <div>
                <h3 class="text-lg font-bold text-white">${tierName} Booster</h3>
                <p class="text-sm" style="color:${config.color}">Keep ${config.keepRate}% of rewards</p>
            </div>
        </div>
        
        <div class="space-y-3 mb-5">
            <div class="pool-stat flex justify-between">
                <span class="text-zinc-500">Base Price</span>
                <span class="text-white font-mono">${formatPrice(buyPrice)} BKC</span>
            </div>
            <div class="pool-stat flex justify-between">
                <span class="text-zinc-500">Buy Tax (5%)</span>
                <span class="text-amber-400 font-mono">+${formatPrice(buyTax)} BKC</span>
            </div>
            ${ethFee > 0n ? `
                <div class="pool-stat flex justify-between">
                    <span class="text-zinc-500">ETH Fee</span>
                    <span class="text-blue-400 font-mono">${formatETH(ethFee)} ETH</span>
                </div>
            ` : ''}
            <div class="h-px bg-zinc-700"></div>
            <div class="flex justify-between text-lg">
                <span class="text-zinc-300 font-bold">Total Cost</span>
                <span class="text-purple-400 font-bold font-mono">${formatPrice(totalCost)} BKC</span>
            </div>
        </div>
        
        <div class="p-4 rounded-xl mb-5 ${canAfford ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}">
            <div class="flex justify-between text-sm">
                <span class="${canAfford ? 'text-emerald-400' : 'text-red-400'}">Your Balance</span>
                <span class="${canAfford ? 'text-emerald-400' : 'text-red-400'} font-mono font-bold">${formatBigNumber(balance)} BKC</span>
            </div>
        </div>
        
        <div class="flex gap-3">
            <button onclick="StorePage.closeBuyModal()" class="btn-secondary flex-1 py-3">Cancel</button>
            <button id="confirm-buy" onclick="StorePage.handleBuy('${tierName}')" class="btn-store flex-1 py-3" ${!canAfford ? 'disabled' : ''}>
                <i class="fa-solid fa-cart-plus mr-2"></i>Buy Now
            </button>
        </div>
    `;
    
    document.getElementById('modal-buy').classList.add('active');
}

function closeBuyModal() {
    document.getElementById('modal-buy').classList.remove('active');
}

function openSellModal(tokenId, tierName) {
    const config = getTierConfig(tierName);
    const pool = Store.pools[tierName] || {};
    const sellPrice = pool.sellPrice || 0n;
    const ethFee = pool.sellEthFee || 0n;
    
    document.getElementById('sell-modal-content').innerHTML = `
        <div class="flex items-center gap-4 mb-5 p-4 rounded-xl" style="background:${config.bg}">
            <div class="text-5xl">${config.emoji}</div>
            <div>
                <h3 class="text-lg font-bold text-white">${tierName} Booster #${tokenId}</h3>
                <p class="text-sm" style="color:${config.color}">Keep ${config.keepRate}% tier</p>
            </div>
        </div>
        
        <div class="space-y-3 mb-5">
            <div class="pool-stat flex justify-between">
                <span class="text-zinc-500">Sell Price (after 10% tax)</span>
                <span class="text-emerald-400 font-mono font-bold">${formatPrice(sellPrice)} BKC</span>
            </div>
            ${ethFee > 0n ? `
                <div class="pool-stat flex justify-between">
                    <span class="text-zinc-500">ETH Fee Required</span>
                    <span class="text-blue-400 font-mono">${formatETH(ethFee)} ETH</span>
                </div>
            ` : ''}
        </div>
        
        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5">
            <p class="text-sm text-amber-400">
                <i class="fa-solid fa-warning mr-2"></i>
                This action cannot be undone. The NFT will be sold to the liquidity pool.
            </p>
        </div>
        
        <div class="flex gap-3">
            <button onclick="StorePage.closeSellModal()" class="btn-secondary flex-1 py-3">Cancel</button>
            <button id="confirm-sell" onclick="StorePage.handleSell('${tokenId}', '${tierName}')" class="btn-sell flex-1 py-3">
                <i class="fa-solid fa-coins mr-2"></i>Sell for ${formatPrice(sellPrice)} BKC
            </button>
        </div>
    `;
    
    document.getElementById('modal-sell').classList.add('active');
}

function closeSellModal() {
    document.getElementById('modal-sell').classList.remove('active');
}

// ============================================================================
// HELPERS
// ============================================================================

function renderConnectPrompt(action) {
    return `
        <div class="store-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-3xl text-zinc-500"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Connect Wallet</h3>
            <p class="text-sm text-zinc-500 mb-4">${action}</p>
            <button onclick="window.openConnectModal && window.openConnectModal()" class="btn-store px-8 py-3">
                <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
            </button>
        </div>
    `;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function attachEventListeners() {
    document.addEventListener('click', e => {
        // Tab clicks
        const tab = e.target.closest('.store-tab');
        if (tab) {
            Store.activeTab = tab.dataset.tab;
            document.querySelectorAll('.store-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTabContent();
            return;
        }
        
        // Buy action
        const buyBtn = e.target.closest('[data-action="buy"]');
        if (buyBtn && !buyBtn.disabled) {
            if (!State.isConnected) {
                showToast('Please connect wallet first', 'error');
                return;
            }
            openBuyModal(buyBtn.dataset.tier);
            return;
        }
        
        // Sell action
        const sellBtn = e.target.closest('[data-action="sell"]');
        if (sellBtn) {
            const tokenId = sellBtn.dataset.token;
            const tier = sellBtn.dataset.tier;
            if (tokenId) {
                openSellModal(tokenId, tier);
            }
            return;
        }
    });
}

// ============================================================================
// TRANSACTION HANDLERS
// ============================================================================

async function handleBuy(tierName) {
    if (Store.isTransactionPending) return;
    
    const pool = Store.pools[tierName] || {};
    const btn = document.getElementById('confirm-buy');
    
    Store.isTransactionPending = true;
    
    try {
        await StoreTx.buy({
            tier: tierName,
            button: btn,
            onSuccess: async () => {
                Store.isTransactionPending = false;
                closeBuyModal();
                showToast(`🎉 ${tierName} NFT purchased!`, 'success');
                await refreshData();
            },
            onError: (e) => {
                Store.isTransactionPending = false;
                if (!e.cancelled && e.type !== 'user_rejected') {
                    showToast('Failed: ' + (e.message || 'Error'), 'error');
                }
            }
        });
    } catch (err) {
        Store.isTransactionPending = false;
        if (!err.cancelled && err.type !== 'user_rejected') {
            showToast('Failed: ' + (err.message || 'Error'), 'error');
        }
    }
}

async function handleSell(tokenId, tierName) {
    if (Store.isTransactionPending) return;
    
    const btn = document.getElementById('confirm-sell');
    Store.isTransactionPending = true;
    
    try {
        await StoreTx.sell({
            tokenId,
            tier: tierName,
            button: btn,
            onSuccess: async () => {
                Store.isTransactionPending = false;
                closeSellModal();
                showToast(`💰 NFT sold successfully!`, 'success');
                await refreshData();
            },
            onError: (e) => {
                Store.isTransactionPending = false;
                if (!e.cancelled && e.type !== 'user_rejected') {
                    showToast('Failed: ' + (e.message || 'Error'), 'error');
                }
            }
        });
    } catch (err) {
        Store.isTransactionPending = false;
        if (!err.cancelled && err.type !== 'user_rejected') {
            showToast('Failed: ' + (err.message || 'Error'), 'error');
        }
    }
}

// ============================================================================
// DATA
// ============================================================================

async function loadPoolData() {
    Store.isLoading = true;
    
    try {
        // Load pool data for each tier from contracts
        for (const tierName of Object.keys(TIER_CONFIG)) {
            const contract = State[`nftPool${tierName}`] || State.nftPoolContract;
            if (!contract) continue;
            
            try {
                const [buyPrice, sellPrice, nftCount, buyEthFee, sellEthFee] = await Promise.all([
                    safeContractCall(contract, 'getBuyPriceWithTax', [], 0n),
                    safeContractCall(contract, 'getSellPriceAfterTax', [], 0n),
                    safeContractCall(contract, 'getNFTCount', [], 0),
                    safeContractCall(contract, 'buyEthFee', [], 0n),
                    safeContractCall(contract, 'sellEthFee', [], 0n)
                ]);
                
                const buyTax = buyPrice > 0n ? buyPrice * 5n / 105n : 0n; // Reverse calculate 5% tax
                
                Store.pools[tierName] = {
                    buyPrice: buyPrice - buyTax,
                    buyTax,
                    sellPrice,
                    nftCount: Number(nftCount),
                    buyEthFee,
                    sellEthFee
                };
            } catch (e) {
                console.warn(`Failed to load ${tierName} pool:`, e);
            }
        }
        
        // Load user's NFTs for selling
        if (State.isConnected && State.userAddress) {
            Store.userNFTs = State.myBoosters || [];
        }
        
    } catch (e) {
        console.error('Pool data load error:', e);
    }
    
    Store.isLoading = false;
}

async function refreshData() {
    await loadPoolData();
    if (State.isConnected) await loadUserData();
    render();
}

function switchTab(tab) {
    Store.activeTab = tab;
    renderTabContent();
    document.querySelectorAll('.store-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
}

// ============================================================================
// EXPORT
// ============================================================================

export const StorePage = {
    async render(isActive) {
        if (!isActive) return;
        render();
        await loadPoolData();
        render();
    },
    
    update() {
        updateBalanceDisplay();
        renderTabContent();
    },
    
    refresh: refreshData,
    switchTab,
    
    // Modal handlers
    closeBuyModal,
    closeSellModal,
    
    // Transaction handlers
    handleBuy,
    handleSell
};

window.StorePage = StorePage;