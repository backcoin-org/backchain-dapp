// js/pages/RentalPage.js
// ✅ PRODUCTION V6.9 - Complete Redesign
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                     AirBNFT - NFT Rental Marketplace
// ═══════════════════════════════════════════════════════════════════════════════
//
// V6.9 Changes:
// - COMPLETE UI REDESIGN - Modern, clean, consistent with other pages
// - Improved NFT cards with tier badges and keep rate display
// - Better mobile responsiveness
// - Enhanced visual hierarchy
// - Smoother transitions and micro-interactions
// - Consistent styling with all V6.9 pages
//
// Features:
// - 4 Tiers: Diamond (100%), Gold (90%), Silver (75%), Bronze (60%)
// - Spotlight/Promotion system with ETH
// - 24h cooldown after rental ends
// - Smart sorting (promoted first, then longest idle)
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

const ethers = window.ethers;
import { State } from '../state.js';
import { loadRentalListings, loadUserRentals, loadMyBoostersFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers, ipfsGateway, addresses, getKeepRateFromBoost, getTierByBoost } from '../config.js';
import { RentalTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const COOLDOWN_PERIOD = 24 * 60 * 60; // 24 hours

// Tier configurations with colors, keep rates, and real IPFS images
const TIER_CONFIG = {
    'Diamond': { emoji: '💎', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.3)', keepRate: 100, image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq' },
    'Gold': { emoji: '🥇', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', keepRate: 90, image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44' },
    'Silver': { emoji: '🥈', color: '#9ca3af', bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.3)', keepRate: 75, image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4' },
    'Bronze': { emoji: '🥉', color: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.3)', keepRate: 60, image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m' }
};

// ============================================================================
// STATE
// ============================================================================

const RS = {
    activeTab: 'marketplace',
    filterTier: 'ALL',
    sortBy: 'featured',
    selectedListing: null,
    isLoading: false,
    isTransactionPending: false,
    countdownIntervals: [],
    promotions: new Map()
};

// ============================================================================
// UTILITIES
// ============================================================================

const normalizeTokenId = (id) => id == null ? '' : String(id);
const tokenIdsMatch = (a, b) => normalizeTokenId(a) === normalizeTokenId(b);
const addressesMatch = (a, b) => a && b && a.toLowerCase() === b.toLowerCase();

function getTierInfo(boostBips) {
    return boosterTiers.find(t => t.boostBips === Number(boostBips)) || { name: 'Unknown', boostBips: 0 };
}

function getTierConfig(name) {
    return TIER_CONFIG[name] || { emoji: '💎', color: '#71717a', bg: 'rgba(113,113,122,0.15)', border: 'rgba(113,113,122,0.3)', keepRate: 50 };
}

function formatTimeRemaining(endTime) {
    const remaining = endTime - Math.floor(Date.now() / 1000);
    if (remaining <= 0) return { text: 'Expired', expired: true, seconds: 0 };
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    if (h > 0) return { text: `${h}h ${m}m`, expired: false, seconds: remaining };
    if (m > 0) return { text: `${m}m ${s}s`, expired: false, seconds: remaining };
    return { text: `${s}s`, expired: false, seconds: remaining };
}

function formatCooldownRemaining(cooldownEnds) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = cooldownEnds - now;
    if (remaining <= 0) return null;
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getCooldownEndTime(listing) {
    if (listing.lastRentalEndTime) {
        return Number(listing.lastRentalEndTime) + COOLDOWN_PERIOD;
    }
    if (listing.rentalEndTime && !listing.isRented) {
        const rentalEnd = Number(listing.rentalEndTime);
        const now = Math.floor(Date.now() / 1000);
        if (rentalEnd < now) return rentalEnd + COOLDOWN_PERIOD;
    }
    return null;
}

function isInCooldown(listing) {
    const now = Math.floor(Date.now() / 1000);
    const cooldownEnds = getCooldownEndTime(listing);
    return cooldownEnds && cooldownEnds > now;
}

function getIdleTime(listing) {
    const now = Math.floor(Date.now() / 1000);
    if (!listing.lastRentalEndTime && !listing.rentalEndTime) {
        return listing.createdAt ? now - Number(listing.createdAt) : Number.MAX_SAFE_INTEGER;
    }
    const lastEnd = listing.lastRentalEndTime ? Number(listing.lastRentalEndTime) : (listing.rentalEndTime ? Number(listing.rentalEndTime) : 0);
    if (lastEnd > now) return 0;
    return now - lastEnd;
}

// ============================================================================
// STYLES
// ============================================================================

function injectStyles() {
    if (document.getElementById('rental-styles-v6')) return;
    const style = document.createElement('style');
    style.id = 'rental-styles-v6';
    style.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Rental Page Styles - Modern & Clean
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0) rotate(-2deg); } 
            50% { transform: translateY(-8px) rotate(2deg); } 
        }
        @keyframes pulse-glow { 
            0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.2); } 
            50% { box-shadow: 0 0 40px rgba(34,197,94,0.4); } 
        }
        @keyframes card-in {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .float-animation { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        
        /* Main Cards */
        .rental-card-base {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        
        /* NFT Cards */
        .nft-card {
            background: linear-gradient(165deg, rgba(24,24,27,0.98) 0%, rgba(15,15,17,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.4);
            border-radius: 20px;
            overflow: hidden;
            animation: card-in 0.5s ease-out forwards;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nft-card:hover {
            transform: translateY(-6px);
            border-color: rgba(34,197,94,0.4);
            box-shadow: 0 25px 50px -15px rgba(0,0,0,0.5), 0 0 30px -10px rgba(34,197,94,0.15);
        }
        .nft-card.promoted {
            border-color: rgba(251,191,36,0.3);
            box-shadow: 0 0 30px -10px rgba(251,191,36,0.2);
        }
        .nft-card.promoted:hover {
            border-color: rgba(251,191,36,0.5);
        }
        .nft-card.owned { border-color: rgba(59,130,246,0.3); }
        .nft-card.cooldown { opacity: 0.6; filter: grayscale(40%); }
        .nft-card.cooldown:hover { transform: none; }
        
        /* Tier Badge */
        .tier-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Tabs */
        .rental-tab {
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 12px;
            transition: all 0.25s;
            cursor: pointer;
            color: #71717a;
            white-space: nowrap;
            border: none;
            background: transparent;
        }
        .rental-tab:hover:not(.active) {
            color: #a1a1aa;
            background: rgba(63,63,70,0.3);
        }
        .rental-tab.active {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #000;
            box-shadow: 0 4px 20px rgba(34,197,94,0.35);
        }
        .rental-tab .tab-count {
            display: inline-flex;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            margin-left: 6px;
            font-size: 10px;
            font-weight: 700;
            border-radius: 9px;
            background: rgba(0,0,0,0.25);
            align-items: center;
            justify-content: center;
        }
        
        /* Filter Chips */
        .filter-chip {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.25s;
            cursor: pointer;
            border: 1px solid transparent;
            background: rgba(39,39,42,0.7);
            color: #71717a;
        }
        .filter-chip:hover:not(.active) {
            color: #fff;
            background: rgba(63,63,70,0.7);
        }
        .filter-chip.active {
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border-color: rgba(34,197,94,0.3);
        }
        
        /* Buttons */
        .btn-rent {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #fff;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-rent:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(34,197,94,0.4);
        }
        .btn-rent:disabled {
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
        
        .btn-danger {
            background: rgba(239,68,68,0.15);
            color: #f87171;
            font-weight: 600;
            border: 1px solid rgba(239,68,68,0.3);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-danger:hover {
            background: rgba(239,68,68,0.25);
        }
        
        /* Timer */
        .rental-timer {
            font-family: 'SF Mono', 'Roboto Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 12px;
            border-radius: 8px;
        }
        .rental-timer.active {
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border: 1px solid rgba(34,197,94,0.25);
        }
        .rental-timer.warning {
            background: rgba(245,158,11,0.15);
            color: #f59e0b;
            border: 1px solid rgba(245,158,11,0.25);
        }
        .rental-timer.critical {
            background: rgba(239,68,68,0.15);
            color: #ef4444;
            border: 1px solid rgba(239,68,68,0.25);
            animation: pulse 1s infinite;
        }
        .rental-timer.cooldown {
            background: rgba(99,102,241,0.15);
            color: #818cf8;
            border: 1px solid rgba(99,102,241,0.25);
        }
        
        /* Promo Badge */
        .promo-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: linear-gradient(90deg, rgba(251,191,36,0.15) 0%, rgba(249,115,22,0.15) 100%);
            border: 1px solid rgba(251,191,36,0.25);
            border-radius: 10px;
            font-size: 10px;
            font-weight: 700;
            color: #fbbf24;
            text-transform: uppercase;
        }
        
        /* Modal */
        .rental-modal {
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
        .rental-modal.active { display: flex; }
        .rental-modal-content {
            background: linear-gradient(145deg, rgba(39,39,42,0.98) 0%, rgba(24,24,27,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            width: 100%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        /* Empty State */
        .rental-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
        }
        
        /* Scrollbar */
        .rental-scrollbar::-webkit-scrollbar { width: 5px; }
        .rental-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.5); border-radius: 3px; }
        .rental-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 3px; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .rental-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .nft-grid { grid-template-columns: 1fr !important; }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN RENDER
// ============================================================================

function render() {
    const container = document.getElementById('rental');
    if (!container) return;
    
    injectStyles();
    
    const listings = State.rentalListings || [];
    const myListings = listings.filter(l => State.isConnected && addressesMatch(l.owner, State.userAddress));
    const now = Math.floor(Date.now() / 1000);
    const activeRentals = (State.myRentals || []).filter(r => addressesMatch(r.tenant, State.userAddress) && Number(r.endTime) > now);
    
    container.innerHTML = `
        <div class="max-w-6xl mx-auto px-4 py-6">
            
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-key text-2xl text-emerald-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">AirBNFT</h1>
                        <p class="text-sm text-zinc-500">Rent NFTs to reduce burn rate on claims</p>
                    </div>
                </div>
                <div id="header-stats" class="flex items-center gap-3"></div>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 rental-stats-grid">
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-emerald-400 font-mono">${listings.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Listed NFTs</p>
                </div>
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-blue-400 font-mono">${listings.filter(l => l.isRented).length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Currently Rented</p>
                </div>
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-amber-400 font-mono">${myListings.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">My Listings</p>
                </div>
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-purple-400 font-mono">${activeRentals.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">My Rentals</p>
                </div>
            </div>
            
            <!-- Tabs -->
            <div class="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-zinc-800/50">
                <button class="rental-tab ${RS.activeTab === 'marketplace' ? 'active' : ''}" data-tab="marketplace">
                    <i class="fa-solid fa-store mr-2"></i>Marketplace
                </button>
                <button class="rental-tab ${RS.activeTab === 'my-listings' ? 'active' : ''}" data-tab="my-listings">
                    <i class="fa-solid fa-tags mr-2"></i>My Listings
                    <span class="tab-count" id="cnt-listings">${myListings.length}</span>
                </button>
                <button class="rental-tab ${RS.activeTab === 'my-rentals' ? 'active' : ''}" data-tab="my-rentals">
                    <i class="fa-solid fa-clock-rotate-left mr-2"></i>My Rentals
                    <span class="tab-count" id="cnt-rentals">${activeRentals.length}</span>
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="tab-content"></div>
        </div>
        
        <!-- Modals -->
        ${renderListModal()}
        ${renderRentModal()}
        ${renderPromoteModal()}
    `;
    
    attachEventListeners();
    renderTabContent();
}

function renderHeaderStats() {
    if (!State.isConnected) {
        return `
            <button onclick="window.openConnectModal && window.openConnectModal()" 
                class="btn-rent px-6 py-2.5 text-sm">
                <i class="fa-solid fa-wallet mr-2"></i>Connect
            </button>
        `;
    }
    
    return `
        <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-emerald-400 text-sm font-medium">Connected</span>
        </div>
    `;
}

function renderTabContent() {
    const el = document.getElementById('tab-content');
    if (!el) return;
    
    switch (RS.activeTab) {
        case 'marketplace': el.innerHTML = renderMarketplace(); break;
        case 'my-listings': el.innerHTML = renderMyListings(); break;
        case 'my-rentals': el.innerHTML = renderMyRentals(); break;
    }
    
    document.getElementById('header-stats').innerHTML = renderHeaderStats();
    
    if (RS.activeTab === 'my-rentals') startTimers();
}

// ============================================================================
// MARKETPLACE TAB
// ============================================================================

function renderMarketplace() {
    const listings = State.rentalListings || [];
    const now = Math.floor(Date.now() / 1000);
    
    let available = listings.filter(l => {
        if (l.isRented || (l.rentalEndTime && Number(l.rentalEndTime) > now)) return false;
        if (RS.filterTier !== 'ALL' && getTierInfo(l.boostBips).name !== RS.filterTier) return false;
        return true;
    });
    
    // Smart sorting
    available.sort((a, b) => {
        const promoA = BigInt(a.promotionFee || '0') || (RS.promotions.get(normalizeTokenId(a.tokenId)) || 0n);
        const promoB = BigInt(b.promotionFee || '0') || (RS.promotions.get(normalizeTokenId(b.tokenId)) || 0n);
        const cooldownA = isInCooldown(a);
        const cooldownB = isInCooldown(b);
        
        if (!cooldownA && cooldownB) return -1;
        if (cooldownA && !cooldownB) return 1;
        if (promoB > promoA) return 1;
        if (promoB < promoA) return -1;
        
        if (RS.sortBy === 'featured') {
            const idleA = getIdleTime(a);
            const idleB = getIdleTime(b);
            if (idleB !== idleA) return idleB - idleA;
        }
        
        const pa = BigInt(a.pricePerHour || 0), pb = BigInt(b.pricePerHour || 0);
        if (RS.sortBy === 'price-low') return pa < pb ? -1 : 1;
        if (RS.sortBy === 'price-high') return pa > pb ? -1 : 1;
        return (b.boostBips || 0) - (a.boostBips || 0);
    });
    
    return `
        <div>
            <!-- Filters & Sort -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div class="flex flex-wrap gap-2">
                    <button class="filter-chip ${RS.filterTier === 'ALL' ? 'active' : ''}" data-filter="ALL">All Tiers</button>
                    ${Object.keys(TIER_CONFIG).map(tier => `
                        <button class="filter-chip ${RS.filterTier === tier ? 'active' : ''}" data-filter="${tier}">
                            ${TIER_CONFIG[tier].emoji} ${tier}
                        </button>
                    `).join('')}
                </div>
                <div class="flex items-center gap-3">
                    <select id="sort-select" class="bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none cursor-pointer">
                        <option value="featured" ${RS.sortBy === 'featured' ? 'selected' : ''}>🔥 Featured</option>
                        <option value="price-low" ${RS.sortBy === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
                        <option value="price-high" ${RS.sortBy === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
                        <option value="boost-high" ${RS.sortBy === 'boost-high' ? 'selected' : ''}>Keep Rate: High to Low</option>
                    </select>
                    ${State.isConnected ? `
                        <button id="btn-open-list" class="btn-rent px-5 py-2.5 text-sm">
                            <i class="fa-solid fa-plus mr-2"></i>List NFT
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- NFT Grid -->
            ${available.length === 0 ? renderEmpty('No NFTs Available', 'Be the first to list your NFT!') : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nft-grid">
                    ${available.map((l, i) => renderNFTCard(l, i)).join('')}
                </div>
            `}
        </div>
    `;
}

function renderNFTCard(listing, idx) {
    const tier = getTierInfo(listing.boostBips);
    const config = getTierConfig(tier.name);
    const price = formatBigNumber(BigInt(listing.pricePerHour || 0)).toFixed(2);
    const tokenId = normalizeTokenId(listing.tokenId);
    const isOwner = State.isConnected && addressesMatch(listing.owner, State.userAddress);
    
    const cooldownEnds = getCooldownEndTime(listing);
    const now = Math.floor(Date.now() / 1000);
    const inCooldown = cooldownEnds && cooldownEnds > now;
    const cooldownRemaining = inCooldown ? formatCooldownRemaining(cooldownEnds) : null;
    
    const promoAmount = BigInt(listing.promotionFee || '0') || (RS.promotions.get(tokenId) || 0n);
    const isPromoted = promoAmount > 0n;
    const promoEth = isPromoted ? parseFloat(ethers.formatEther(promoAmount)).toFixed(3) : '0';
    const keepRate = getKeepRateFromBoost(listing.boostBips || 0);
    
    return `
        <div class="nft-card ${isPromoted ? 'promoted' : ''} ${isOwner ? 'owned' : ''} ${inCooldown ? 'cooldown' : ''}" 
             style="animation-delay:${idx * 60}ms">
            
            <!-- Header -->
            <div class="flex items-center justify-between p-4 pb-0">
                <div class="tier-badge" style="background:${config.bg};color:${config.color};border:1px solid ${config.border}">
                    ${config.emoji} ${tier.name}
                </div>
                <span class="text-sm font-bold font-mono" style="color:${config.color}">
                    Keep ${keepRate}%
                </span>
            </div>
            
            <!-- Promo Badge -->
            ${isPromoted ? `
                <div class="mx-4 mt-3">
                    <div class="promo-badge">
                        <i class="fa-solid fa-fire"></i>
                        <span>PROMOTED</span>
                        <span class="ml-auto font-mono">${promoEth} ETH</span>
                    </div>
                </div>
            ` : ''}
            
            <!-- NFT Display -->
            <div class="relative aspect-square flex items-center justify-center p-6">
                <div class="absolute inset-0 rounded-2xl opacity-50"
                     style="background: radial-gradient(circle at center, ${config.color}15 0%, transparent 70%);"></div>
                <img src="${config.image}" alt="${tier.name} Booster" class="w-4/5 h-4/5 object-contain float-animation rounded-xl" onerror="this.outerHTML='<div class=\\'text-7xl float-animation\\'>${config.emoji}</div>'">
                
                ${isOwner ? `
                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                        <i class="fa-solid fa-user mr-1"></i>YOURS
                    </div>
                ` : ''}
                
                ${inCooldown && !isOwner ? `
                    <div class="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center">
                        <i class="fa-solid fa-hourglass-half text-3xl text-indigo-400 mb-2"></i>
                        <span class="text-xs text-indigo-300 font-semibold">Cooldown</span>
                        <span class="text-lg text-indigo-400 font-bold font-mono">${cooldownRemaining}</span>
                    </div>
                ` : ''}
            </div>
            
            <!-- Info -->
            <div class="p-4 pt-0">
                <div class="flex items-baseline justify-between mb-2">
                    <h3 class="text-base font-bold text-white">${tier.name} Booster</h3>
                    <span class="text-xs font-mono" style="color:${config.color}">#${tokenId}</span>
                </div>
                
                <p class="text-xs ${keepRate === 100 ? 'text-emerald-400' : 'text-zinc-500'} mb-4">
                    ${keepRate === 100 ? '✨ Keep 100% of your rewards!' : `Save ${keepRate - 50}% on claim burns`}
                </p>
                
                <div class="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-4"></div>
                
                <!-- Price & Actions -->
                <div class="flex items-end justify-between">
                    <div>
                        <span class="text-[10px] text-zinc-500 uppercase block mb-1">Price/Hour</span>
                        <div class="flex items-baseline gap-1">
                            <span class="text-xl font-bold text-white">${price}</span>
                            <span class="text-xs text-zinc-500">BKC</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        ${isOwner ? `
                            <button class="promote-btn btn-secondary px-3 py-2 text-xs" data-id="${tokenId}">
                                <i class="fa-solid fa-rocket"></i>
                            </button>
                            <button class="withdraw-btn btn-danger px-4 py-2 text-xs" data-id="${tokenId}">
                                <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
                            </button>
                        ` : `
                            <button class="rent-btn btn-rent px-5 py-2.5 text-sm" data-id="${tokenId}" ${inCooldown ? 'disabled' : ''}>
                                <i class="fa-solid fa-bolt mr-1"></i>Rent
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// MY LISTINGS TAB
// ============================================================================

function renderMyListings() {
    if (!State.isConnected) return renderConnectPrompt('View your listings');
    
    const listings = State.rentalListings || [];
    const mine = listings.filter(l => addressesMatch(l.owner, State.userAddress));
    const listedIds = new Set(listings.map(l => normalizeTokenId(l.tokenId)));
    const canList = (State.myBoosters || []).filter(b => !listedIds.has(normalizeTokenId(b.tokenId)));
    const earnings = mine.reduce((s, l) => s + Number(ethers.formatEther(BigInt(l.totalEarnings || 0))), 0);
    
    return `
        <div>
            <!-- Earnings Card -->
            <div class="rental-card-base p-6 mb-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/25">
                            <i class="fa-solid fa-sack-dollar text-emerald-400 text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-zinc-400">Total Earnings</p>
                            <p class="text-3xl font-bold text-white">
                                ${earnings.toFixed(4)} <span class="text-lg text-zinc-500">BKC</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <div class="rental-card-base p-4 text-center min-w-[100px]">
                            <p class="text-2xl font-bold text-white">${mine.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Listed</p>
                        </div>
                        <div class="rental-card-base p-4 text-center min-w-[100px]">
                            <p class="text-2xl font-bold text-white">${canList.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Available</p>
                        </div>
                        <button id="btn-open-list" class="btn-rent px-6 py-4" ${canList.length === 0 ? 'disabled' : ''}>
                            <i class="fa-solid fa-plus mr-2"></i>List
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- My Listed NFTs -->
            ${mine.length === 0 ? renderEmpty('No Listings Yet', 'List your first NFT to start earning!') : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nft-grid">
                    ${mine.map((l, i) => renderNFTCard(l, i)).join('')}
                </div>
            `}
        </div>
    `;
}

// ============================================================================
// MY RENTALS TAB
// ============================================================================

function renderMyRentals() {
    if (!State.isConnected) return renderConnectPrompt('View your active rentals');
    
    const now = Math.floor(Date.now() / 1000);
    const rentals = (State.myRentals || []).filter(r => addressesMatch(r.tenant, State.userAddress) && Number(r.endTime) > now);
    
    return `
        <div>
            <!-- Info Card -->
            <div class="rental-card-base p-5 mb-6 border-emerald-500/20">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-circle-info text-emerald-400"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-white mb-1">How Rentals Work</h3>
                        <p class="text-xs text-zinc-400">
                            Rented NFTs reduce your burn rate when claiming rewards. 
                            Diamond = Keep 100%, Gold = 90%, Silver = 75%, Bronze = 60%.
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Active Rentals -->
            ${rentals.length === 0 ? renderEmpty('No Active Rentals', 'Rent an NFT to reduce your claim burn rate!') : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    ${rentals.map((r, i) => renderRentalCard(r, i)).join('')}
                </div>
            `}
        </div>
    `;
}

function renderRentalCard(rental, idx) {
    const tier = getTierInfo(rental.boostBips);
    const config = getTierConfig(tier.name);
    const time = formatTimeRemaining(Number(rental.endTime));
    const keepRate = getKeepRateFromBoost(rental.boostBips || 0);
    
    let timerClass = 'active';
    if (time.seconds < 3600) timerClass = 'critical';
    else if (time.seconds < 7200) timerClass = 'warning';
    
    return `
        <div class="rental-card-base p-5" style="animation: card-in 0.5s ease-out ${idx * 60}ms forwards; opacity: 0;">
            <div class="flex items-center justify-between mb-4">
                <div class="tier-badge" style="background:${config.bg};color:${config.color};border:1px solid ${config.border}">
                    ${config.emoji} ${tier.name}
                </div>
                <div class="rental-timer ${timerClass}" data-end="${rental.endTime}">
                    <i class="fa-solid fa-clock mr-1"></i>${time.text}
                </div>
            </div>
            
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
                     style="background:${config.bg}">
                    <img src="${config.image}" alt="${tier.name}" class="w-full h-full object-contain" onerror="this.outerHTML='<span class=\\'text-4xl\\'>${config.emoji}</span>'">
                </div>
                <div>
                    <h3 class="text-lg font-bold text-white">${tier.name} Booster</h3>
                    <p class="text-xs text-zinc-500">Token #${normalizeTokenId(rental.tokenId)}</p>
                </div>
            </div>
            
            <div class="p-3 rounded-xl ${keepRate === 100 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-800/50'}">
                <p class="text-sm ${keepRate === 100 ? 'text-emerald-400' : 'text-zinc-300'}">
                    <i class="fa-solid fa-shield-check mr-2"></i>
                    ${keepRate === 100 ? 'Keep 100% of rewards!' : `Keep ${keepRate}% of rewards on claims`}
                </p>
            </div>
        </div>
    `;
}

// ============================================================================
// MODALS
// ============================================================================

function renderListModal() {
    const listings = State.rentalListings || [];
    const listedIds = new Set(listings.map(l => normalizeTokenId(l.tokenId)));
    const available = (State.myBoosters || []).filter(b => !listedIds.has(normalizeTokenId(b.tokenId)));
    
    return `
        <div class="rental-modal" id="modal-list">
            <div class="rental-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-tag text-emerald-400"></i>List NFT
                    </h3>
                    <button onclick="RentalPage.closeListModal()" class="text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-5 space-y-5">
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Select NFT</label>
                        <select id="list-select" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none">
                            <option value="">-- Select an NFT --</option>
                            ${available.map(b => {
                                const tier = getTierInfo(b.boostBips);
                                const config = getTierConfig(tier.name);
                                return `<option value="${b.tokenId}">${config.emoji} ${tier.name} Booster #${b.tokenId}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Price per Hour (BKC)</label>
                        <input type="number" id="list-price" min="0.01" step="0.01" placeholder="10.00"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">
                            Promotion (ETH) <span class="text-zinc-600 font-normal">- optional</span>
                        </label>
                        <input type="number" id="list-promo-amount" min="0" step="0.001" placeholder="0.00"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none font-mono">
                        <p class="text-[10px] text-zinc-600 mt-2">Promoted listings appear first in marketplace</p>
                    </div>
                </div>
                <div class="flex gap-3 p-5 pt-0">
                    <button onclick="RentalPage.closeListModal()" class="btn-secondary flex-1 py-3">Cancel</button>
                    <button id="confirm-list" onclick="RentalPage.handleList()" class="btn-rent flex-1 py-3">
                        <i class="fa-solid fa-check mr-2"></i>List NFT
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderRentModal() {
    return `
        <div class="rental-modal" id="modal-rent">
            <div class="rental-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bolt text-emerald-400"></i>Rent NFT
                    </h3>
                    <button onclick="RentalPage.closeRentModal()" class="text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="rent-modal-content" class="p-5">
                    <!-- Content populated dynamically -->
                </div>
            </div>
        </div>
    `;
}

function renderPromoteModal() {
    return `
        <div class="rental-modal" id="modal-promote">
            <div class="rental-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-rocket text-amber-400"></i>Promote Listing
                    </h3>
                    <button onclick="RentalPage.closePromoteModal()" class="text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-5 space-y-5">
                    <p class="text-sm text-zinc-400">
                        Pay ETH to boost your listing's visibility. Promoted listings appear at the top of the marketplace.
                    </p>
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Amount (ETH)</label>
                        <input type="number" id="promote-amount" min="0.001" step="0.001" placeholder="0.01"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
                    </div>
                    <input type="hidden" id="promote-token-id">
                </div>
                <div class="flex gap-3 p-5 pt-0">
                    <button onclick="RentalPage.closePromoteModal()" class="btn-secondary flex-1 py-3">Cancel</button>
                    <button id="confirm-promote" onclick="RentalPage.handlePromote()" class="btn-rent flex-1 py-3">
                        <i class="fa-solid fa-rocket mr-2"></i>Promote
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// HELPER RENDERS
// ============================================================================

function renderEmpty(title, subtitle) {
    return `
        <div class="rental-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-key text-3xl text-zinc-600"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">${title}</h3>
            <p class="text-sm text-zinc-500">${subtitle}</p>
        </div>
    `;
}

function renderConnectPrompt(action) {
    return `
        <div class="rental-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-3xl text-zinc-500"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Connect Wallet</h3>
            <p class="text-sm text-zinc-500 mb-4">${action}</p>
            <button onclick="window.openConnectModal && window.openConnectModal()" class="btn-rent px-8 py-3">
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
        const tab = e.target.closest('.rental-tab');
        if (tab) {
            RS.activeTab = tab.dataset.tab;
            document.querySelectorAll('.rental-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTabContent();
            return;
        }
        
        // Filter clicks
        const chip = e.target.closest('.filter-chip');
        if (chip) {
            RS.filterTier = chip.dataset.filter;
            renderTabContent();
            return;
        }
        
        // Open list modal
        if (e.target.closest('#btn-open-list')) {
            openListModal();
            return;
        }
        
        // Rent button
        const rentBtn = e.target.closest('.rent-btn');
        if (rentBtn && !rentBtn.disabled) {
            openRentModal(rentBtn.dataset.id);
            return;
        }
        
        // Withdraw button
        const withdrawBtn = e.target.closest('.withdraw-btn');
        if (withdrawBtn) {
            handleWithdraw(withdrawBtn);
            return;
        }
        
        // Promote button
        const promoteBtn = e.target.closest('.promote-btn');
        if (promoteBtn) {
            openPromoteModal(promoteBtn.dataset.id);
            return;
        }
    });
    
    document.addEventListener('change', e => {
        if (e.target.id === 'sort-select') {
            RS.sortBy = e.target.value;
            renderTabContent();
        }
    });
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

function openListModal() {
    document.getElementById('modal-list').classList.add('active');
}

function closeListModal() {
    document.getElementById('modal-list').classList.remove('active');
}

function openRentModal(tokenId) {
    const listing = (State.rentalListings || []).find(l => tokenIdsMatch(l.tokenId, tokenId));
    if (!listing) return;
    
    RS.selectedListing = listing;
    const tier = getTierInfo(listing.boostBips);
    const config = getTierConfig(tier.name);
    const price = formatBigNumber(BigInt(listing.pricePerHour || 0));
    const keepRate = getKeepRateFromBoost(listing.boostBips || 0);
    
    document.getElementById('rent-modal-content').innerHTML = `
        <div class="flex items-center gap-4 mb-5 p-4 rounded-xl" style="background:${config.bg}">
            <img src="${config.image}" alt="${tier.name}" class="w-16 h-16 object-contain rounded-lg" onerror="this.outerHTML='<div class=\\'text-5xl\\'>${config.emoji}</div>'">
            <div>
                <h3 class="text-lg font-bold text-white">${tier.name} Booster #${tokenId}</h3>
                <p class="text-sm" style="color:${config.color}">Keep ${keepRate}% of rewards</p>
            </div>
        </div>
        
        <div class="space-y-4 mb-5">
            <div class="flex justify-between text-sm">
                <span class="text-zinc-500">Price per hour</span>
                <span class="text-white font-bold">${price} BKC</span>
            </div>
            <div>
                <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Rental Duration (hours)</label>
                <input type="number" id="rent-hours" min="1" max="168" value="1"
                    class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
            </div>
            <div id="rent-total" class="p-4 rounded-xl bg-zinc-800/50">
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-zinc-500">Total Cost</span>
                    <span class="text-xl font-bold text-emerald-400">${price} BKC</span>
                </div>
            </div>
        </div>
        
        <div class="flex gap-3">
            <button onclick="RentalPage.closeRentModal()" class="btn-secondary flex-1 py-3">Cancel</button>
            <button id="confirm-rent" onclick="RentalPage.handleRent()" class="btn-rent flex-1 py-3">
                <i class="fa-solid fa-bolt mr-2"></i>Rent Now
            </button>
        </div>
    `;
    
    document.getElementById('rent-hours').addEventListener('input', e => {
        const hours = parseInt(e.target.value) || 1;
        const total = Number(price) * hours;
        document.querySelector('#rent-total span:last-child').textContent = `${total.toFixed(2)} BKC`;
    });
    
    document.getElementById('modal-rent').classList.add('active');
}

function closeRentModal() {
    document.getElementById('modal-rent').classList.remove('active');
    RS.selectedListing = null;
}

function openPromoteModal(tokenId) {
    document.getElementById('promote-token-id').value = tokenId;
    document.getElementById('promote-amount').value = '';
    document.getElementById('modal-promote').classList.add('active');
}

function closePromoteModal() {
    document.getElementById('modal-promote').classList.remove('active');
}

// ============================================================================
// TRANSACTION HANDLERS
// ============================================================================

async function handleRent() {
    if (RS.isTransactionPending || !RS.selectedListing) return;
    
    const hours = parseInt(document.getElementById('rent-hours').value) || 1;
    const tokenId = normalizeTokenId(RS.selectedListing.tokenId);
    const btn = document.getElementById('confirm-rent');
    
    RS.isTransactionPending = true;
    
    try {
        await RentalTx.rent({
            tokenId,
            hours,
            button: btn,
            onSuccess: async () => {
                RS.isTransactionPending = false;
                closeRentModal();
                showToast('🎉 NFT Rented Successfully!', 'success');
                await refreshData();
            },
            onError: (e) => {
                RS.isTransactionPending = false;
                if (!e.cancelled && e.type !== 'user_rejected') {
                    showToast('Failed: ' + (e.message || 'Error'), 'error');
                }
            }
        });
    } catch (err) {
        RS.isTransactionPending = false;
        if (!err.cancelled && err.type !== 'user_rejected') {
            showToast('Failed: ' + (err.message || 'Error'), 'error');
        }
    }
}

async function handleList() {
    if (RS.isTransactionPending) return;
    
    const tokenId = document.getElementById('list-select').value;
    const price = document.getElementById('list-price').value;
    const promoAmount = parseFloat(document.getElementById('list-promo-amount')?.value) || 0;
    
    if (!tokenId) { showToast('Select an NFT', 'error'); return; }
    if (!price || parseFloat(price) <= 0) { showToast('Enter valid price', 'error'); return; }
    
    const btn = document.getElementById('confirm-list');
    RS.isTransactionPending = true;
    
    try {
        await RentalTx.list({
            tokenId,
            pricePerHour: ethers.parseUnits(price, 18),
            minHours: 1,
            maxHours: 168,
            button: btn,
            onSuccess: async () => {
                RS.isTransactionPending = false;
                closeListModal();
                showToast('🏷️ NFT Listed Successfully!', 'success');
                await refreshData();
            },
            onError: (e) => {
                RS.isTransactionPending = false;
                if (!e.cancelled && e.type !== 'user_rejected') {
                    showToast('Failed: ' + (e.message || 'Error'), 'error');
                }
            }
        });
    } catch (err) {
        RS.isTransactionPending = false;
        if (!err.cancelled && err.type !== 'user_rejected') {
            showToast('Failed: ' + (err.message || 'Error'), 'error');
        }
    }
}

async function handleWithdraw(btn) {
    if (RS.isTransactionPending) return;
    
    const tokenId = btn.dataset.id;
    if (!confirm('Withdraw this NFT from marketplace?')) return;
    
    RS.isTransactionPending = true;
    
    try {
        await RentalTx.withdraw({
            tokenId,
            button: btn,
            onSuccess: async () => {
                RS.isTransactionPending = false;
                showToast('↩️ NFT Withdrawn Successfully!', 'success');
                await refreshData();
            },
            onError: (e) => {
                RS.isTransactionPending = false;
                if (!e.cancelled && e.type !== 'user_rejected') {
                    showToast('Failed: ' + (e.message || 'Error'), 'error');
                }
            }
        });
    } catch (err) {
        RS.isTransactionPending = false;
        if (!err.cancelled && err.type !== 'user_rejected') {
            showToast('Failed: ' + (err.message || 'Error'), 'error');
        }
    }
}

async function handlePromote() {
    if (RS.isTransactionPending) return;
    
    const tokenId = document.getElementById('promote-token-id').value;
    const amount = document.getElementById('promote-amount').value;
    
    if (!amount || parseFloat(amount) <= 0) { showToast('Enter valid amount', 'error'); return; }
    
    const btn = document.getElementById('confirm-promote');
    RS.isTransactionPending = true;
    
    try {
        await RentalTx.spotlight({
            tokenId,
            amount: ethers.parseEther(amount),
            button: btn,
            onSuccess: async () => {
                RS.isTransactionPending = false;
                closePromoteModal();
                showToast('🚀 Listing Promoted!', 'success');
                await refreshData();
            },
            onError: (e) => {
                RS.isTransactionPending = false;
                if (!e.cancelled && e.type !== 'user_rejected') {
                    showToast('Failed: ' + (e.message || 'Error'), 'error');
                }
            }
        });
    } catch (err) {
        RS.isTransactionPending = false;
        if (!err.cancelled && err.type !== 'user_rejected') {
            showToast('Failed: ' + (err.message || 'Error'), 'error');
        }
    }
}

// ============================================================================
// TIMERS
// ============================================================================

function startTimers() {
    RS.countdownIntervals.forEach(clearInterval);
    RS.countdownIntervals = [];
    
    document.querySelectorAll('.rental-timer[data-end]').forEach(el => {
        const endTime = Number(el.dataset.end);
        const interval = setInterval(() => {
            const time = formatTimeRemaining(endTime);
            el.innerHTML = `<i class="fa-solid fa-clock mr-1"></i>${time.text}`;
            
            if (time.expired) {
                clearInterval(interval);
                renderTabContent();
            } else if (time.seconds < 3600) {
                el.className = 'rental-timer critical';
            } else if (time.seconds < 7200) {
                el.className = 'rental-timer warning';
            }
        }, 1000);
        RS.countdownIntervals.push(interval);
    });
}

// ============================================================================
// DATA
// ============================================================================

async function refreshData() {
    RS.isLoading = true;
    try {
        await Promise.all([
            loadRentalListings(),
            State.isConnected ? loadUserRentals() : Promise.resolve(),
            State.isConnected ? loadMyBoostersFromAPI() : Promise.resolve()
        ]);
    } catch (e) {
        console.warn('Refresh error:', e);
    }
    RS.isLoading = false;
    render();
}

// ============================================================================
// EXPORT
// ============================================================================

export const RentalPage = {
    async render(isActive) {
        if (!isActive) return;
        render();
        await refreshData();
    },
    
    update() {
        render();
    },
    
    refresh: refreshData,
    
    // Modal handlers
    openListModal,
    closeListModal,
    closeRentModal,
    closePromoteModal,
    
    // Transaction handlers
    handleRent,
    handleList,
    handleWithdraw,
    handlePromote
};

window.RentalPage = RentalPage;