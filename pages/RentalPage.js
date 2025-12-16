// js/pages/RentalPage.js
// ✅ VERSION V7.1: Fixed data loading + nft.png for loading animations

const ethers = window.ethers;

import { State } from '../state.js';
import { loadRentalListings, loadUserRentals, loadMyBoostersFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { executeListNFT, executeRentNFT, executeWithdrawNFT } from '../modules/transactions.js';
import { formatBigNumber, renderNoData } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers, ipfsGateway } from '../config.js';

// ============================================================================
// LOCAL STATE
// ============================================================================

const RentalState = {
    activeTab: 'marketplace',
    filterTier: 'ALL',
    selectedRentalId: null,
    isLoading: false,
    isTransactionPending: false
};

// ============================================================================
// HELPERS
// ============================================================================

function buildImageUrl(ipfsIoUrl) {
    if (!ipfsIoUrl) return './assets/nft.png';
    if (ipfsIoUrl.startsWith('https://') || ipfsIoUrl.startsWith('http://')) return ipfsIoUrl;
    if (ipfsIoUrl.includes('ipfs.io/ipfs/')) return `${ipfsGateway}${ipfsIoUrl.split('ipfs.io/ipfs/')[1]}`;
    if (ipfsIoUrl.startsWith('ipfs://')) return `${ipfsGateway}${ipfsIoUrl.substring(7)}`;
    return ipfsIoUrl;
}

function formatTimeRemaining(endTimestamp) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTimestamp - now;
    
    if (remaining <= 0) return { text: 'Expired', expired: true };
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 0) return { text: `${hours}h ${minutes}m`, expired: false };
    return { text: `${minutes}m`, expired: false };
}

function getTierInfo(boostBips) {
    const tier = boosterTiers.find(t => t.boostBips === Number(boostBips));
    return tier || { name: 'Unknown', img: './assets/bkc_logo_3d.png', boostBips: 0 };
}

function getTierClass(tierName) {
    const classes = {
        'Diamond': 'from-cyan-500 to-blue-600',
        'Platinum': 'from-slate-300 to-gray-500',
        'Gold': 'from-yellow-400 to-amber-600',
        'Silver': 'from-gray-300 to-zinc-500',
        'Bronze': 'from-orange-500 to-amber-700'
    };
    return classes[tierName] || 'from-zinc-500 to-zinc-700';
}

// ============================================================================
// LOADING COMPONENT - Using nft.png
// ============================================================================

function renderLoading(message = 'Loading...') {
    return `
        <div class="flex flex-col items-center justify-center py-16 gap-5">
            <div class="relative">
                <!-- Outer spinning ring -->
                <div class="absolute inset-[-8px] w-24 h-24 rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-500/50 animate-spin"></div>
                <!-- Pulse glow -->
                <div class="absolute inset-0 w-20 h-20 rounded-full bg-amber-500/20 animate-ping"></div>
                <!-- NFT Image container -->
                <div class="relative w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-xl shadow-amber-500/20 overflow-hidden border-2 border-amber-500/30">
                    <img src="./assets/nft.png" alt="Loading" class="w-16 h-16 object-contain animate-pulse drop-shadow-lg" onerror="this.src='./assets/nft.png'">
                </div>
            </div>
            <div class="text-center">
                <p class="text-amber-400 text-sm font-medium animate-pulse">${message}</p>
                <p class="text-zinc-600 text-xs mt-1">Please wait...</p>
            </div>
        </div>
    `;
}

// Loading for cards/grid
function renderCardLoading() {
    return `
        <div class="nft-card animate-pulse">
            <div class="nft-image bg-zinc-800/50">
                <img src="./assets/nft.png" alt="Loading" class="w-1/2 h-1/2 opacity-30">
            </div>
            <div class="p-5 space-y-3">
                <div class="h-4 bg-zinc-700/50 rounded w-2/3"></div>
                <div class="h-3 bg-zinc-700/50 rounded w-1/2"></div>
                <div class="h-8 bg-zinc-700/50 rounded w-full mt-4"></div>
            </div>
        </div>
    `;
}

// ============================================================================
// STYLES INJECTION
// ============================================================================

function injectStyles() {
    if (document.getElementById('rental-styles-v7')) return;
    
    const style = document.createElement('style');
    style.id = 'rental-styles-v7';
    style.innerHTML = `
        .rental-tab {
            padding: 12px 24px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 10px;
            transition: all 0.2s ease;
            cursor: pointer;
            white-space: nowrap;
            position: relative;
        }
        .rental-tab.active {
            background: linear-gradient(135deg, #22d3ee, #0891b2);
            color: black;
            box-shadow: 0 4px 15px rgba(34, 211, 238, 0.4);
        }
        .rental-tab:not(.active) {
            background: rgba(39, 39, 42, 0.8);
            color: #a1a1aa;
            border: 1px solid rgba(63, 63, 70, 0.5);
        }
        .rental-tab:not(.active):hover {
            background: rgba(63, 63, 70, 0.8);
            color: white;
            border-color: rgba(113, 113, 122, 0.5);
        }
        .rental-tab .badge {
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            margin-left: 8px;
        }
        
        .nft-card {
            background: linear-gradient(145deg, rgba(24, 24, 27, 0.95), rgba(39, 39, 42, 0.95));
            border: 1px solid rgba(63, 63, 70, 0.5);
            border-radius: 20px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        .nft-card:hover {
            border-color: rgba(34, 211, 238, 0.5);
            transform: translateY(-6px);
            box-shadow: 0 20px 40px rgba(34, 211, 238, 0.15);
        }
        .nft-card .nft-image {
            aspect-ratio: 1;
            background: radial-gradient(ellipse at center, rgba(34, 211, 238, 0.08), transparent 70%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            position: relative;
        }
        .nft-card .nft-image img {
            width: 75%;
            height: 75%;
            object-fit: contain;
            filter: drop-shadow(0 12px 24px rgba(0,0,0,0.5));
            transition: transform 0.4s ease;
        }
        .nft-card:hover .nft-image img {
            transform: scale(1.15) rotate(3deg);
        }
        
        .stat-card {
            background: linear-gradient(145deg, rgba(24, 24, 27, 0.95), rgba(39, 39, 42, 0.95));
            border: 1px solid rgba(63, 63, 70, 0.5);
            border-radius: 16px;
            padding: 20px;
            transition: all 0.2s ease;
        }
        .stat-card:hover {
            border-color: rgba(34, 211, 238, 0.3);
            transform: translateY(-2px);
        }
        .stat-card.highlight {
            background: linear-gradient(145deg, rgba(34, 211, 238, 0.1), rgba(6, 182, 212, 0.05));
            border-color: rgba(34, 211, 238, 0.3);
        }
        
        .tier-badge {
            padding: 4px 12px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .tier-diamond { background: linear-gradient(135deg, #22d3ee, #0891b2); color: black; }
        .tier-platinum { background: linear-gradient(135deg, #e2e8f0, #94a3b8); color: black; }
        .tier-gold { background: linear-gradient(135deg, #fbbf24, #d97706); color: black; }
        .tier-silver { background: linear-gradient(135deg, #d1d5db, #6b7280); color: black; }
        .tier-bronze { background: linear-gradient(135deg, #fb923c, #c2410c); color: white; }
        
        .status-badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
        }
        .status-available { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
        .status-rented { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3); }
        .status-active { background: rgba(34, 211, 238, 0.2); color: #22d3ee; border: 1px solid rgba(34, 211, 238, 0.3); }
        .status-expired { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        
        .filter-chip {
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s ease;
            cursor: pointer;
            border: 1px solid transparent;
        }
        .filter-chip.active {
            background: rgba(34, 211, 238, 0.2);
            color: #22d3ee;
            border-color: rgba(34, 211, 238, 0.4);
        }
        .filter-chip:not(.active) {
            background: rgba(39, 39, 42, 0.8);
            color: #71717a;
            border-color: rgba(63, 63, 70, 0.5);
        }
        .filter-chip:not(.active):hover {
            color: white;
            background: rgba(63, 63, 70, 0.8);
        }
        
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
        
        .action-btn {
            transition: all 0.2s ease;
        }
        .action-btn:hover:not(:disabled) {
            transform: scale(1.03);
        }
        .action-btn:active:not(:disabled) {
            transform: scale(0.97);
        }
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .glass-card {
            background: rgba(24, 24, 27, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(63, 63, 70, 0.5);
            border-radius: 16px;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN RENDER
// ============================================================================

export const RentalPage = {
    async render(isNewPage = false) {
        injectStyles();
        const container = document.getElementById('rental');
        if (!container) return;

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div class="max-w-6xl mx-auto py-6 px-4">
                    
                    <!-- HEADER -->
                    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                                <i class="fa-solid fa-building text-white text-2xl"></i>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold text-white">AirBNFT</h1>
                                <p class="text-sm text-zinc-500">Rent boosters • Earn passive income</p>
                            </div>
                        </div>
                        <button id="btn-refresh-rentals" class="flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white px-5 py-2.5 rounded-xl transition-all text-sm font-medium border border-zinc-700">
                            <i class="fa-solid fa-rotate"></i> Refresh
                        </button>
                    </div>

                    <!-- DASHBOARD STATS -->
                    <div id="stats-dashboard" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        ${renderStatsDashboard()}
                    </div>

                    <!-- TAB NAVIGATION -->
                    <div class="flex gap-3 overflow-x-auto pb-3 mb-8 no-scrollbar">
                        <button class="rental-tab active" data-tab="marketplace">
                            <i class="fa-solid fa-store mr-2"></i>Marketplace
                        </button>
                        <button class="rental-tab" data-tab="my-listings">
                            <i class="fa-solid fa-tags mr-2"></i>My Listings
                            <span class="badge" id="my-listings-badge">0</span>
                        </button>
                        <button class="rental-tab" data-tab="my-rentals">
                            <i class="fa-solid fa-key mr-2"></i>My Rentals
                            <span class="badge" id="my-rentals-badge">0</span>
                        </button>
                    </div>

                    <!-- TAB CONTENT -->
                    <div id="tab-content" class="animate-fadeInUp">
                        ${renderLoading('Loading marketplace...')}
                    </div>
                </div>

                <!-- MODALS -->
                ${renderRentModal()}
                ${renderListModal()}
            `;

            setupEventListeners();
        }

        await refreshData();
    },

    update() {
        if (!RentalState.isLoading) {
            renderActiveTab();
        }
    }
};

// ============================================================================
// STATS DASHBOARD
// ============================================================================

function renderStatsDashboard() {
    const listings = State.rentalListings || [];
    const myListings = listings.filter(l => 
        State.isConnected && l.owner?.toLowerCase() === State.userAddress?.toLowerCase()
    );
    
    // Get my active rentals (where I'm the tenant)
    const now = Math.floor(Date.now() / 1000);
    const myActiveRentals = (State.myRentals || []).filter(r => 
        r.tenant?.toLowerCase() === State.userAddress?.toLowerCase() &&
        Number(r.endTime) > now
    );
    
    // Calculate total earnings from my listings
    const totalEarnings = myListings.reduce((sum, l) => {
        return sum + Number(ethers.formatEther(BigInt(l.totalEarnings || 0)));
    }, 0);
    
    // 🔥 V7.1: Floor price - use isRented from listing data
    const availableListings = listings.filter(l => {
        if (State.isConnected && l.owner?.toLowerCase() === State.userAddress?.toLowerCase()) return false;
        if (l.isRented) return false;
        if (l.rentalEndTime && Number(l.rentalEndTime) > now) return false;
        return true;
    });
    
    const floorPrice = availableListings.length > 0
        ? Math.min(...availableListings.map(l => parseFloat(ethers.formatEther(l.pricePerHour || '0'))))
        : 0;

    // Total rentals count from my listings
    const totalRentals = myListings.reduce((sum, l) => sum + Number(l.rentalCount || 0), 0);

    return `
        <div class="stat-card highlight">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-coins text-amber-400"></i>
                </div>
                <span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">Total Earnings</span>
            </div>
            <p class="text-2xl font-bold text-white">${totalEarnings.toFixed(2)}</p>
            <p class="text-xs text-zinc-500 mt-1">BKC earned from rentals</p>
        </div>
        
        <div class="stat-card">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-tag text-blue-400"></i>
                </div>
                <span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">My Listings</span>
            </div>
            <p class="text-2xl font-bold text-white">${myListings.length}</p>
            <p class="text-xs text-zinc-500 mt-1">${totalRentals} total rentals</p>
        </div>
        
        <div class="stat-card">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-bolt text-green-400"></i>
                </div>
                <span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">Active Boosts</span>
            </div>
            <p class="text-2xl font-bold text-white">${myActiveRentals.length}</p>
            <p class="text-xs text-zinc-500 mt-1">NFTs I'm renting</p>
        </div>
        
        <div class="stat-card">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-arrow-trend-down text-cyan-400"></i>
                </div>
                <span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">Floor Price</span>
            </div>
            <p class="text-2xl font-bold text-white">${floorPrice > 0 ? floorPrice.toFixed(2) : '--'}</p>
            <p class="text-xs text-zinc-500 mt-1">BKC / hour</p>
        </div>
    `;
}

// ============================================================================
// TAB CONTENT RENDERERS
// ============================================================================

function renderActiveTab() {
    const container = document.getElementById('tab-content');
    if (!container) return;

    container.classList.remove('animate-fadeInUp');
    void container.offsetWidth; // Force reflow
    container.classList.add('animate-fadeInUp');

    switch (RentalState.activeTab) {
        case 'marketplace':
            container.innerHTML = renderMarketplace();
            break;
        case 'my-listings':
            container.innerHTML = renderMyListings();
            break;
        case 'my-rentals':
            container.innerHTML = renderMyRentals();
            break;
    }
    
    // Update dashboard stats
    const statsContainer = document.getElementById('stats-dashboard');
    if (statsContainer) {
        statsContainer.innerHTML = renderStatsDashboard();
    }
    
    updateBadges();
}

function updateBadges() {
    const listings = State.rentalListings || [];
    const myListings = listings.filter(l => 
        State.isConnected && l.owner?.toLowerCase() === State.userAddress?.toLowerCase()
    );
    
    const now = Math.floor(Date.now() / 1000);
    const myActiveRentals = (State.myRentals || []).filter(r => 
        r.tenant?.toLowerCase() === State.userAddress?.toLowerCase() &&
        Number(r.endTime) > now
    );
    
    const listingsBadge = document.getElementById('my-listings-badge');
    const rentalsBadge = document.getElementById('my-rentals-badge');
    
    if (listingsBadge) listingsBadge.textContent = myListings.length;
    if (rentalsBadge) rentalsBadge.textContent = myActiveRentals.length;
}

// ============================================================================
// MARKETPLACE TAB
// ============================================================================

function renderMarketplace() {
    const listings = State.rentalListings || [];
    const now = Math.floor(Date.now() / 1000);
    
    console.log("📊 Rendering marketplace. Total listings:", listings.length);
    
    // Filter: exclude my own, exclude currently rented, apply tier filter
    const availableListings = listings.filter(l => {
        // Exclude my own listings
        if (State.isConnected && l.owner?.toLowerCase() === State.userAddress?.toLowerCase()) {
            return false;
        }
        
        // 🔥 V7.1: Use isRented from listing data or check rentalEndTime
        if (l.isRented) {
            return false;
        }
        if (l.rentalEndTime && Number(l.rentalEndTime) > now) {
            return false;
        }
        
        // Apply tier filter
        if (RentalState.filterTier !== 'ALL') {
            const tier = getTierInfo(l.boostBips);
            if (tier.name !== RentalState.filterTier) {
                return false;
            }
        }
        return true;
    });
    
    console.log("✅ Available for rent:", availableListings.length);

    // Sort by price
    availableListings.sort((a, b) => {
        const priceA = BigInt(a.pricePerHour || 0);
        const priceB = BigInt(b.pricePerHour || 0);
        return priceA < priceB ? -1 : priceA > priceB ? 1 : 0;
    });

    return `
        <div>
            <!-- FILTERS + LIST BUTTON -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div class="flex gap-2 overflow-x-auto no-scrollbar">
                    <button class="filter-chip ${RentalState.filterTier === 'ALL' ? 'active' : ''}" data-filter="ALL">All Tiers</button>
                    ${boosterTiers.map(t => `
                        <button class="filter-chip ${RentalState.filterTier === t.name ? 'active' : ''}" data-filter="${t.name}">${t.name}</button>
                    `).join('')}
                </div>
                
                ${State.isConnected ? `
                    <button id="btn-open-list-modal" class="action-btn flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm whitespace-nowrap">
                        <i class="fa-solid fa-plus"></i> List NFT
                    </button>
                ` : ''}
            </div>

            <!-- LISTINGS GRID -->
            ${availableListings.length === 0 ? `
                <div class="text-center py-20 glass-card">
                    <div class="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-5">
                        <i class="fa-solid fa-store text-3xl text-zinc-600"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-zinc-300 mb-2">No NFTs Available</h3>
                    <p class="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
                        ${listings.length === 0 
                            ? 'Be the first to list an NFT for rent and start earning!' 
                            : 'All NFTs are currently rented. Check back soon!'}
                    </p>
                    ${State.isConnected ? `
                        <button id="btn-open-list-modal-empty" class="action-btn bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:opacity-90">
                            <i class="fa-solid fa-plus mr-2"></i>List Your NFT
                        </button>
                    ` : `
                        <p class="text-cyan-400 text-sm">Connect wallet to list NFTs</p>
                    `}
                </div>
            ` : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    ${availableListings.map(listing => renderMarketplaceCard(listing)).join('')}
                </div>
            `}
        </div>
    `;
}

function renderMarketplaceCard(listing) {
    const tier = getTierInfo(listing.boostBips);
    const price = formatBigNumber(BigInt(listing.pricePerHour || 0)).toFixed(2);
    const tierClass = `tier-${tier.name.toLowerCase()}`;
    const gradientClass = getTierClass(tier.name);
    
    // 🔥 V7.1: Use nft.png as fallback
    const imgSrc = listing.img || tier.img || './assets/nft.png';
    
    return `
        <div class="nft-card">
            <div class="nft-image">
                <div class="absolute top-4 left-4">
                    <span class="tier-badge ${tierClass}">${tier.name}</span>
                </div>
                <div class="absolute top-4 right-4">
                    <span class="text-xs bg-black/60 backdrop-blur text-cyan-400 px-3 py-1 rounded-lg font-bold">
                        +${(listing.boostBips || 0) / 100}%
                    </span>
                </div>
                <img src="${buildImageUrl(imgSrc)}" alt="${tier.name}" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <p class="text-white font-bold">${tier.name} Booster</p>
                        <p class="text-cyan-400 text-xs font-mono">#${listing.tokenId}</p>
                    </div>
                </div>
                
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-[10px] text-zinc-500 uppercase mb-1">Price / Hour</p>
                        <p class="text-xl font-bold text-white">${price} <span class="text-sm text-zinc-500">BKC</span></p>
                    </div>
                    <button class="rent-btn action-btn bg-gradient-to-r ${gradientClass} text-white font-bold px-5 py-2.5 rounded-xl text-sm" data-id="${listing.tokenId}">
                        Rent Now
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// MY LISTINGS TAB
// ============================================================================

function renderMyListings() {
    if (!State.isConnected) {
        return renderConnectPrompt('View and manage your listings');
    }

    const listings = State.rentalListings || [];
    const myListings = listings.filter(l => 
        l.owner?.toLowerCase() === State.userAddress?.toLowerCase()
    );

    // Available NFTs to list
    const listedIds = new Set(listings.map(l => l.tokenId?.toString()));
    const availableToList = (State.myBoosters || []).filter(b => !listedIds.has(b.tokenId?.toString()));

    // Total earnings
    const totalEarnings = myListings.reduce((sum, l) => 
        sum + Number(ethers.formatEther(BigInt(l.totalEarnings || 0))), 0
    );

    return `
        <div>
            <!-- SUMMARY CARD -->
            <div class="glass-card p-6 mb-8">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div class="flex items-center gap-6">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                            <i class="fa-solid fa-sack-dollar text-amber-400 text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-zinc-400">Total Earnings</p>
                            <p class="text-3xl font-bold text-white">${totalEarnings.toFixed(4)} <span class="text-lg text-zinc-500">BKC</span></p>
                            <p class="text-xs text-zinc-500 mt-1">${myListings.length} active listing(s)</p>
                        </div>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-3">
                        <div class="text-center px-6 py-3 bg-zinc-800/50 rounded-xl">
                            <p class="text-2xl font-bold text-white">${availableToList.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Available to List</p>
                        </div>
                        <button id="btn-open-list-modal-main" class="action-btn bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-40" ${availableToList.length === 0 ? 'disabled' : ''}>
                            <i class="fa-solid fa-plus mr-2"></i>List New NFT
                        </button>
                    </div>
                </div>
            </div>

            <!-- MY LISTINGS GRID -->
            <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <i class="fa-solid fa-list text-blue-400"></i>
                Your Active Listings
            </h3>
            
            ${myListings.length === 0 ? `
                <div class="text-center py-16 glass-card">
                    <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-tags text-2xl text-zinc-600"></i>
                    </div>
                    <p class="text-zinc-400 font-medium mb-2">No Active Listings</p>
                    <p class="text-sm text-zinc-600">List your NFTs to start earning passive income</p>
                </div>
            ` : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    ${myListings.map(listing => renderMyListingCard(listing)).join('')}
                </div>
            `}
        </div>
    `;
}

function renderMyListingCard(listing) {
    const tier = getTierInfo(listing.boostBips);
    const price = formatBigNumber(BigInt(listing.pricePerHour || 0)).toFixed(2);
    const earnings = Number(ethers.formatEther(BigInt(listing.totalEarnings || 0))).toFixed(4);
    const rentalCount = listing.rentalCount || 0;
    const tierClass = `tier-${tier.name.toLowerCase()}`;
    
    // 🔥 V7.1: Use isRented from listing data
    const now = Math.floor(Date.now() / 1000);
    const isRented = listing.isRented || (listing.rentalEndTime && Number(listing.rentalEndTime) > now);
    const timeRemaining = isRented && listing.rentalEndTime ? formatTimeRemaining(Number(listing.rentalEndTime)) : null;

    return `
        <div class="nft-card">
            <div class="nft-image">
                <div class="absolute top-4 left-4">
                    <span class="tier-badge ${tierClass}">${tier.name}</span>
                </div>
                <div class="absolute top-4 right-4">
                    ${isRented ? `
                        <span class="status-badge status-rented">
                            <i class="fa-solid fa-clock mr-1"></i>${timeRemaining?.text || 'Rented'}
                        </span>
                    ` : `
                        <span class="status-badge status-available">Available</span>
                    `}
                </div>
                <img src="${buildImageUrl(listing.img || tier.img)}" alt="${tier.name}" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-white font-bold">${tier.name} Booster</p>
                        <p class="text-cyan-400 text-xs font-mono">#${listing.tokenId}</p>
                    </div>
                    <span class="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded font-bold">
                        +${(listing.boostBips || 0) / 100}%
                    </span>
                </div>
                
                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-3 py-3 border-t border-b border-zinc-700/50 mb-4">
                    <div>
                        <p class="text-[10px] text-zinc-500 uppercase">Price/Hour</p>
                        <p class="text-white font-bold">${price} BKC</p>
                    </div>
                    <div>
                        <p class="text-[10px] text-zinc-500 uppercase">Earned</p>
                        <p class="text-amber-400 font-bold">${earnings} BKC</p>
                    </div>
                </div>
                
                <div class="flex justify-between items-center">
                    <p class="text-xs text-zinc-500">
                        <i class="fa-solid fa-repeat mr-1"></i>${rentalCount} rental(s)
                    </p>
                    <button class="withdraw-btn action-btn ${isRented ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'} font-medium px-4 py-2 rounded-lg text-xs" data-id="${listing.tokenId}" ${isRented ? 'disabled title="Cannot withdraw while rented"' : ''}>
                        <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// MY RENTALS TAB
// ============================================================================

function renderMyRentals() {
    if (!State.isConnected) {
        return renderConnectPrompt('View your active rentals and boost history');
    }

    const now = Math.floor(Date.now() / 1000);
    const allRentals = (State.myRentals || []).filter(r => 
        r.tenant?.toLowerCase() === State.userAddress?.toLowerCase()
    );
    
    const activeRentals = allRentals.filter(r => Number(r.endTime) > now);
    const expiredRentals = allRentals.filter(r => Number(r.endTime) <= now).slice(0, 10);

    return `
        <div>
            <!-- ACTIVE RENTALS -->
            <div class="mb-10">
                <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <i class="fa-solid fa-bolt text-green-400"></i>
                    Active Boosts (${activeRentals.length})
                </h3>
                
                ${activeRentals.length === 0 ? `
                    <div class="text-center py-16 glass-card">
                        <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fa-solid fa-key text-2xl text-zinc-600"></i>
                        </div>
                        <p class="text-zinc-400 font-medium mb-2">No Active Rentals</p>
                        <p class="text-sm text-zinc-600 mb-6">Rent an NFT to get temporary boost benefits</p>
                        <button onclick="document.querySelector('[data-tab=marketplace]').click()" class="text-cyan-400 hover:text-cyan-300 font-medium">
                            <i class="fa-solid fa-arrow-right mr-2"></i>Browse Marketplace
                        </button>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        ${activeRentals.map(rental => renderActiveRentalCard(rental)).join('')}
                    </div>
                `}
            </div>

            <!-- RENTAL HISTORY -->
            ${expiredRentals.length > 0 ? `
                <div>
                    <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i>
                        Recent History
                    </h3>
                    <div class="space-y-3">
                        ${expiredRentals.map(rental => renderExpiredRentalRow(rental)).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderActiveRentalCard(rental) {
    const listing = (State.rentalListings || []).find(l => l.tokenId === rental.tokenId);
    const tier = getTierInfo(listing?.boostBips || 0);
    const timeRemaining = formatTimeRemaining(Number(rental.endTime));
    const paidAmount = formatBigNumber(BigInt(rental.paidAmount || 0)).toFixed(2);
    const tierClass = `tier-${tier.name.toLowerCase()}`;
    const gradientClass = getTierClass(tier.name);

    return `
        <div class="nft-card border-green-500/30">
            <div class="nft-image bg-gradient-to-br from-green-500/5 to-transparent">
                <div class="absolute top-4 left-4">
                    <span class="tier-badge ${tierClass}">${tier.name}</span>
                </div>
                <div class="absolute top-4 right-4">
                    <span class="status-badge status-active">
                        <i class="fa-solid fa-bolt mr-1"></i>${timeRemaining.text}
                    </span>
                </div>
                <img src="${buildImageUrl(listing?.img || tier.img)}" alt="${tier.name}" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-white font-bold">${tier.name} Booster</p>
                        <p class="text-cyan-400 text-xs font-mono">#${rental.tokenId}</p>
                    </div>
                    <span class="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-lg font-bold">
                        +${(listing?.boostBips || 0) / 100}% ACTIVE
                    </span>
                </div>
                
                <div class="pt-3 border-t border-zinc-700/50">
                    <div class="flex justify-between text-sm">
                        <span class="text-zinc-500">Paid</span>
                        <span class="text-white font-medium">${paidAmount} BKC</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderExpiredRentalRow(rental) {
    const listing = (State.rentalListings || []).find(l => l.tokenId === rental.tokenId);
    const tier = getTierInfo(listing?.boostBips || 0);
    const paidAmount = formatBigNumber(BigInt(rental.paidAmount || 0)).toFixed(2);
    const tierClass = `tier-${tier.name.toLowerCase()}`;

    return `
        <div class="flex items-center gap-4 glass-card p-4">
            <img src="${buildImageUrl(listing?.img || tier.img)}" class="w-12 h-12 rounded-xl object-contain bg-black/30" onerror="this.src='./assets/nft.png'">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="tier-badge ${tierClass} text-[9px] py-0.5 px-2">${tier.name}</span>
                    <span class="text-zinc-400 text-xs font-mono">#${rental.tokenId}</span>
                </div>
                <p class="text-zinc-500 text-xs">Paid: ${paidAmount} BKC</p>
            </div>
            <span class="status-badge status-expired">Expired</span>
        </div>
    `;
}

// ============================================================================
// CONNECT PROMPT
// ============================================================================

function renderConnectPrompt(message) {
    return `
        <div class="text-center py-20 glass-card">
            <div class="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-5">
                <i class="fa-solid fa-wallet text-3xl text-zinc-600"></i>
            </div>
            <h3 class="text-xl font-semibold text-zinc-300 mb-2">Connect Your Wallet</h3>
            <p class="text-sm text-zinc-500">${message}</p>
        </div>
    `;
}

// ============================================================================
// MODALS
// ============================================================================

function renderRentModal() {
    return `
        <div id="rent-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div class="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 relative animate-fadeInUp">
                <button id="close-rent-modal" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <i class="fa-solid fa-key text-white text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-white">Rent NFT Booster</h3>
                        <p class="text-xs text-zinc-500">1 Hour Access • Instant Activation</p>
                    </div>
                </div>
                
                <div id="rent-modal-content" class="mb-6">
                    <!-- Dynamic content -->
                </div>
                
                <div class="bg-zinc-800/50 rounded-xl p-4 mb-6">
                    <div class="flex justify-between items-center">
                        <span class="text-zinc-400 text-sm">Total Cost</span>
                        <span id="modal-total-cost" class="text-2xl font-black text-cyan-400">0.00 BKC</span>
                    </div>
                </div>
                
                <button id="confirm-rent-btn" class="action-btn w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 rounded-xl transition-all hover:opacity-90">
                    <i class="fa-solid fa-check mr-2"></i>Confirm Rental
                </button>
            </div>
        </div>
    `;
}

function renderListModal() {
    return `
        <div id="list-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div class="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 relative animate-fadeInUp">
                <button id="close-list-modal" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <i class="fa-solid fa-tag text-white text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-white">List NFT for Rent</h3>
                        <p class="text-xs text-zinc-500">Set your hourly rate and start earning</p>
                    </div>
                </div>
                
                <div class="space-y-5 mb-6">
                    <div>
                        <label class="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-medium">Select NFT</label>
                        <select id="list-nft-select" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-500 transition-colors cursor-pointer">
                            <option value="">Loading...</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-medium">Price per Hour</label>
                        <div class="relative">
                            <input type="number" id="list-price-input" placeholder="0.00" step="0.01" min="0"
                                class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-500 transition-colors pr-16 font-mono">
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">BKC</span>
                        </div>
                        <p class="text-[10px] text-zinc-600 mt-2">* A 10% protocol fee applies to rentals</p>
                    </div>
                </div>
                
                <button id="confirm-list-btn" class="action-btn w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 rounded-xl transition-all hover:opacity-90">
                    <i class="fa-solid fa-check mr-2"></i>List for Rent
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function refreshData() {
    console.log("🔄 RentalPage: Refreshing data...");
    RentalState.isLoading = true;
    
    const container = document.getElementById('tab-content');
    if (container) {
        container.innerHTML = renderLoading('Loading rentals...');
    }

    try {
        if (State.isConnected) {
            console.log("👤 User connected, loading all data...");
            await Promise.all([
                loadRentalListings(true),
                loadUserRentals(true),
                loadMyBoostersFromAPI(true)
            ]);
        } else {
            console.log("👻 User not connected, loading listings only...");
            await loadRentalListings(true);
        }
        
        console.log("✅ Data loaded. Listings:", State.rentalListings?.length || 0, "Rentals:", State.myRentals?.length || 0);
    } catch (e) {
        console.error('❌ Failed to load rental data:', e);
        showToast('Failed to load data. Please refresh.', 'error');
    }

    RentalState.isLoading = false;
    renderActiveTab();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    const container = document.getElementById('rental');
    if (!container) return;

    // Refresh Button
    const refreshBtn = document.getElementById('btn-refresh-rentals');
    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            refreshBtn.disabled = true;
            await refreshData();
            icon.classList.remove('fa-spin');
            refreshBtn.disabled = false;
        };
    }

    // Tab Navigation + All Click Events
    container.addEventListener('click', async (e) => {
        // Tab clicks
        const tab = e.target.closest('.rental-tab');
        if (tab) {
            const tabName = tab.dataset.tab;
            RentalState.activeTab = tabName;
            
            document.querySelectorAll('.rental-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            renderActiveTab();
            return;
        }

        // Filter chips
        const filter = e.target.closest('.filter-chip');
        if (filter) {
            RentalState.filterTier = filter.dataset.filter;
            document.querySelectorAll('.filter-chip').forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            renderActiveTab();
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
        if (withdrawBtn && !withdrawBtn.disabled) {
            await handleWithdraw(withdrawBtn);
            return;
        }

        // Open list modal buttons (multiple possible)
        const listModalBtn = e.target.closest('#btn-open-list-modal, #btn-open-list-modal-empty, #btn-open-list-modal-main');
        if (listModalBtn && !listModalBtn.disabled) {
            openListModal();
            return;
        }
    });

    // Modal Events
    document.getElementById('close-rent-modal')?.addEventListener('click', closeRentModal);
    document.getElementById('close-list-modal')?.addEventListener('click', closeListModal);
    
    document.getElementById('rent-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'rent-modal') closeRentModal();
    });
    document.getElementById('list-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'list-modal') closeListModal();
    });

    document.getElementById('confirm-rent-btn')?.addEventListener('click', handleConfirmRent);
    document.getElementById('confirm-list-btn')?.addEventListener('click', handleConfirmList);
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================

function openRentModal(tokenId) {
    if (!State.isConnected) {
        showToast('Please connect your wallet first', 'warning');
        return;
    }

    const listing = (State.rentalListings || []).find(l => l.tokenId === tokenId);
    if (!listing) {
        showToast('Listing not found', 'error');
        return;
    }

    RentalState.selectedRentalId = tokenId;

    const tier = getTierInfo(listing.boostBips);
    const price = formatBigNumber(BigInt(listing.pricePerHour || 0)).toFixed(2);
    const tierClass = `tier-${tier.name.toLowerCase()}`;

    const content = document.getElementById('rent-modal-content');
    const totalEl = document.getElementById('modal-total-cost');

    content.innerHTML = `
        <div class="flex items-center gap-4 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
            <img src="${buildImageUrl(listing.img || tier.img)}" class="w-20 h-20 object-contain bg-black/30 rounded-xl" onerror="this.src='./assets/nft.png'">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                    <span class="tier-badge ${tierClass}">${tier.name}</span>
                    <span class="text-cyan-400 text-xs font-mono">#${listing.tokenId}</span>
                </div>
                <p class="text-white font-bold text-lg">${tier.name} Booster</p>
                <p class="text-xs text-zinc-500">+${(listing.boostBips || 0) / 100}% boost for 1 hour</p>
            </div>
        </div>
    `;

    totalEl.innerHTML = `${price} <span class="text-sm text-zinc-500 font-normal">BKC</span>`;

    const modal = document.getElementById('rent-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeRentModal() {
    const modal = document.getElementById('rent-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    RentalState.selectedRentalId = null;
}

function openListModal() {
    // Populate NFT selector
    const listings = State.rentalListings || [];
    const listedIds = new Set(listings.map(l => l.tokenId?.toString()));
    const availableToList = (State.myBoosters || []).filter(b => !listedIds.has(b.tokenId?.toString()));

    const select = document.getElementById('list-nft-select');
    if (select) {
        if (availableToList.length === 0) {
            select.innerHTML = '<option value="">No NFTs available to list</option>';
        } else {
            select.innerHTML = availableToList.map(b => {
                const tier = getTierInfo(b.boostBips);
                return `<option value="${b.tokenId}">#${b.tokenId} - ${tier.name} (+${(b.boostBips || 0) / 100}%)</option>`;
            }).join('');
        }
    }

    document.getElementById('list-price-input').value = '';

    const modal = document.getElementById('list-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeListModal() {
    const modal = document.getElementById('list-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

async function handleConfirmRent() {
    if (RentalState.isTransactionPending) {
        console.log('Transaction already pending, ignoring');
        return;
    }

    const tokenId = RentalState.selectedRentalId;
    const listing = (State.rentalListings || []).find(l => l.tokenId === tokenId);
    if (!listing) return;

    const btn = document.getElementById('confirm-rent-btn');
    const originalText = btn.innerHTML;
    
    RentalState.isTransactionPending = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing...';
    btn.disabled = true;

    try {
        const cost = BigInt(listing.pricePerHour);
        const success = await executeRentNFT(tokenId, cost, btn);

        if (success) {
            closeRentModal();
            showToast('NFT rented successfully! Boost is now active.', 'success');
            await refreshData();
        }
    } finally {
        RentalState.isTransactionPending = false;
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleConfirmList() {
    if (RentalState.isTransactionPending) {
        console.log('Transaction already pending, ignoring');
        return;
    }

    const tokenId = document.getElementById('list-nft-select').value;
    const price = document.getElementById('list-price-input').value;

    if (!tokenId) {
        return showToast('Please select an NFT', 'error');
    }
    if (!price || parseFloat(price) <= 0) {
        return showToast('Please enter a valid price', 'error');
    }

    const btn = document.getElementById('confirm-list-btn');
    const originalText = btn.innerHTML;
    
    RentalState.isTransactionPending = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing...';
    btn.disabled = true;

    try {
        const priceWei = ethers.parseUnits(price, 18);
        const success = await executeListNFT(tokenId, priceWei, btn);

        if (success) {
            closeListModal();
            showToast('NFT listed successfully!', 'success');
            await refreshData();
        }
    } finally {
        RentalState.isTransactionPending = false;
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleWithdraw(btn) {
    if (RentalState.isTransactionPending) {
        console.log('Transaction already pending, ignoring');
        return;
    }

    const tokenId = btn.dataset.id;
    
    if (!confirm('Are you sure you want to withdraw this NFT from the rental market?')) {
        return;
    }

    const originalText = btn.innerHTML;
    
    RentalState.isTransactionPending = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const success = await executeWithdrawNFT(tokenId, btn);

        if (success) {
            showToast('NFT withdrawn successfully!', 'success');
            await refreshData();
        }
    } finally {
        RentalState.isTransactionPending = false;
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}