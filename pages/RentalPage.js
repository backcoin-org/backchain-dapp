// js/pages/RentalPage.js
// ✅ PRODUCTION V14.0 - Enhanced Promotions + 24h Cooldown + Smart Sorting
const ethers = window.ethers;
import { State } from '../state.js';
import { loadRentalListings, loadUserRentals, loadMyBoostersFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers, ipfsGateway, addresses } from '../config.js';
import { RentalTx } from '../modules/transactions/index.js';

const AIRBNFT_IMAGE = "./assets/airbnft.png";
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const TREASURY_WALLET = '0xc93030333E3a235c2605BcB7C7330650B600B6D0';

// V14.0: Cooldown period after rental ends (24 hours in seconds)
const COOLDOWN_PERIOD = 24 * 60 * 60; // 24 hours

const RentalState = {
    activeTab: 'marketplace',
    filterTier: 'ALL',
    sortBy: 'featured', // V14.0: Default sort - promoted first, then longest idle
    selectedRentalId: null,
    isLoading: false,
    isTransactionPending: false,
    countdownIntervals: [],
    promotions: new Map(), // V12.5: Store promotions from contract
    pendingPromotion: null // V14.0: Track pending promotion for retry
};

// Utilities
const normalizeTokenId = (id) => id == null ? '' : String(id);
const tokenIdsMatch = (a, b) => normalizeTokenId(a) === normalizeTokenId(b);
const addressesMatch = (a, b) => a && b && a.toLowerCase() === b.toLowerCase();

function buildImageUrl(url) {
    if (!url) return './assets/nft.png';
    if (url.startsWith('http')) return url;
    if (url.includes('ipfs.io/ipfs/')) return `${ipfsGateway}${url.split('ipfs.io/ipfs/')[1]}`;
    if (url.startsWith('ipfs://')) return `${ipfsGateway}${url.substring(7)}`;
    return url;
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

// V14.0: Format cooldown time
function formatCooldownRemaining(cooldownEnds) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = cooldownEnds - now;
    if (remaining <= 0) return null;
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function getTierInfo(boostBips) {
    return boosterTiers.find(t => t.boostBips === Number(boostBips)) || { name: 'Unknown', img: './assets/nft.png', boostBips: 0 };
}

const TIER_COLORS = {
    'Diamond': { accent: '#22d3ee', bg: 'rgba(34,211,238,0.15)' },
    'Platinum': { accent: '#cbd5e1', bg: 'rgba(148,163,184,0.15)' },
    'Gold': { accent: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    'Silver': { accent: '#d1d5db', bg: 'rgba(156,163,175,0.15)' },
    'Bronze': { accent: '#fb923c', bg: 'rgba(251,146,60,0.15)' }
};

function getTierColor(name) {
    return TIER_COLORS[name] || { accent: '#71717a', bg: 'rgba(113,113,122,0.15)' };
}

// Styles
function injectStyles() {
    if (document.getElementById('rental-v14-css')) return;
    const css = document.createElement('style');
    css.id = 'rental-v14-css';
    css.textContent = `
        @keyframes r-float { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
        @keyframes r-glow { 0%,100%{filter:drop-shadow(0 0 15px rgba(34,197,94,0.3))} 50%{filter:drop-shadow(0 0 30px rgba(34,197,94,0.6))} }
        @keyframes r-fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes r-scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes r-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        
        .r-float{animation:r-float 4s ease-in-out infinite}
        .r-glow{animation:r-glow 2s ease-in-out infinite}
        .r-fadeUp{animation:r-fadeUp .4s ease-out forwards}
        .r-scaleIn{animation:r-scaleIn .3s ease-out}
        .r-pulse{animation:r-pulse 2s ease-in-out infinite}
        
        .r-glass{background:rgba(24,24,27,.85);backdrop-filter:blur(16px);border:1px solid rgba(63,63,70,.6);border-radius:20px}
        .r-glass-light{background:rgba(39,39,42,.6);backdrop-filter:blur(10px);border:1px solid rgba(63,63,70,.4);border-radius:16px}
        
        .r-card{background:linear-gradient(160deg,rgba(24,24,27,.95),rgba(39,39,42,.9));border:1px solid rgba(63,63,70,.5);border-radius:24px;overflow:hidden;transition:all .4s cubic-bezier(.4,0,.2,1)}
        .r-card:hover{transform:translateY(-8px) scale(1.01);border-color:rgba(34,197,94,.4);box-shadow:0 30px 60px -15px rgba(0,0,0,.4),0 0 30px -10px rgba(34,197,94,.15)}
        .r-card.cooldown{opacity:.7;filter:grayscale(30%)}
        .r-card.cooldown:hover{transform:none;border-color:rgba(63,63,70,.5)}
        .r-card .img-wrap{aspect-ratio:1;background:radial-gradient(circle at 50% 30%,rgba(34,197,94,.08),transparent 60%);display:flex;align-items:center;justify-content:center;padding:20px;position:relative}
        .r-card .img-wrap::after{content:'';position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(to top,rgba(24,24,27,1),transparent);pointer-events:none}
        .r-card .nft-img{width:65%;height:65%;object-fit:contain;filter:drop-shadow(0 15px 30px rgba(0,0,0,.5));transition:transform .5s ease;z-index:1}
        .r-card:hover .nft-img{transform:scale(1.12) rotate(4deg)}
        .r-card.cooldown .nft-img{filter:drop-shadow(0 15px 30px rgba(0,0,0,.5)) grayscale(50%)}
        
        .r-badge{padding:5px 12px;border-radius:10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
        
        .r-tab{padding:10px 20px;font-size:13px;font-weight:600;border-radius:12px;transition:all .25s;cursor:pointer;color:#71717a;white-space:nowrap}
        .r-tab:hover:not(.active){color:#a1a1aa;background:rgba(63,63,70,.3)}
        .r-tab.active{background:linear-gradient(135deg,#22c55e,#16a34a);color:#000;box-shadow:0 4px 20px rgba(34,197,94,.35)}
        .r-tab .cnt{display:inline-flex;min-width:18px;height:18px;padding:0 5px;margin-left:6px;font-size:10px;font-weight:700;border-radius:9px;background:rgba(0,0,0,.25);align-items:center;justify-content:center}
        
        .r-chip{padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;transition:all .25s;cursor:pointer;border:1px solid transparent}
        .r-chip.active{background:rgba(34,197,94,.15);color:#22c55e;border-color:rgba(34,197,94,.3)}
        .r-chip:not(.active){background:rgba(39,39,42,.7);color:#71717a}
        .r-chip:not(.active):hover{color:#fff;background:rgba(63,63,70,.7)}
        
        .r-btn{font-weight:700;padding:12px 24px;border-radius:14px;transition:all .25s;position:relative;overflow:hidden}
        .r-btn-primary{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}
        .r-btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 25px -8px rgba(34,197,94,.5)}
        .r-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none!important}
        .r-btn-secondary{background:rgba(39,39,42,.8);color:#a1a1aa;border:1px solid rgba(63,63,70,.8)}
        .r-btn-secondary:hover{background:rgba(63,63,70,.8);color:#fff}
        .r-btn-danger{background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.3)}
        .r-btn-danger:hover{background:rgba(239,68,68,.25)}
        .r-btn-danger:disabled{opacity:.4;cursor:not-allowed}
        
        .r-timer{font-family:'SF Mono',monospace;font-size:12px;font-weight:700;padding:6px 12px;border-radius:8px;background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.25)}
        .r-timer.warn{background:rgba(245,158,11,.15);color:#f59e0b;border-color:rgba(245,158,11,.25)}
        .r-timer.crit{background:rgba(239,68,68,.15);color:#ef4444;border-color:rgba(239,68,68,.25);animation:r-pulse 1s infinite}
        .r-timer.cooldown{background:rgba(99,102,241,.15);color:#818cf8;border-color:rgba(99,102,241,.25)}
        
        .r-stat{padding:16px;border-radius:16px;background:linear-gradient(145deg,rgba(24,24,27,.9),rgba(39,39,42,.8));border:1px solid rgba(63,63,70,.4);transition:all .25s}
        .r-stat:hover{border-color:rgba(34,197,94,.25);transform:translateY(-3px)}
        
        .r-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:50px 20px;text-align:center}
        .r-empty img{width:80px;height:80px;opacity:.25;margin-bottom:20px}
        
        .r-cooldown-overlay{position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;border-radius:24px}
        .r-cooldown-icon{font-size:32px;color:#818cf8;margin-bottom:8px}
        .r-cooldown-text{color:#a5b4fc;font-size:12px;font-weight:600}
        .r-cooldown-time{color:#818cf8;font-size:18px;font-weight:700;font-family:'SF Mono',monospace}
        
        @media(max-width:768px){
            .r-grid{grid-template-columns:1fr!important}
            .r-header-stats{display:none!important}
        }
    `;
    document.head.appendChild(css);
}

// Main Export
export const RentalPage = {
    async render(isNewPage = false) {
        injectStyles();
        const container = document.getElementById('rental');
        if (!container) return;
        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = renderLayout();
            setupEvents();
        }
        await refreshData();
    },
    update() {
        if (!RentalState.isLoading) renderContent();
    }
};

function renderLayout() {
    return `
    <div class="min-h-screen pb-12">
        <!-- Header -->
        <div class="relative overflow-hidden mb-6">
            <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5"></div>
            <div class="relative max-w-7xl mx-auto px-4 py-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div class="flex items-center gap-4">
                        <div class="relative">
                            <div class="absolute inset-0 bg-green-500/20 rounded-2xl blur-xl"></div>
                            <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-green-500/30">
                                <img src="${AIRBNFT_IMAGE}" alt="AirBNFT" class="w-12 h-12 object-contain r-float r-glow" id="mascot" onerror="this.src='./assets/nft.png'">
                            </div>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-white">Boost Rentals</h1>
                            <p class="text-zinc-500 text-sm">Rent boosters • Earn passive income</p>
                        </div>
                    </div>
                    <div class="r-header-stats flex gap-3" id="header-stats">${renderHeaderStats()}</div>
                </div>
            </div>
        </div>
        
        <!-- Nav -->
        <div class="max-w-7xl mx-auto px-4 mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex gap-2 p-1.5 r-glass-light rounded-2xl" id="tabs">
                    <button class="r-tab active" data-tab="marketplace"><i class="fa-solid fa-store mr-2"></i>Marketplace</button>
                    <button class="r-tab" data-tab="my-listings"><i class="fa-solid fa-tags mr-2"></i>My Listings<span class="cnt" id="cnt-listings">0</span></button>
                    <button class="r-tab" data-tab="my-rentals"><i class="fa-solid fa-bolt mr-2"></i>Active<span class="cnt" id="cnt-rentals">0</span></button>
                </div>
                <button id="btn-refresh" class="r-btn r-btn-secondary flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-rotate" id="refresh-icon"></i>Refresh
                </button>
            </div>
        </div>
        
        <!-- Content -->
        <div class="max-w-7xl mx-auto px-4">
            <div id="content" class="r-fadeUp">${renderLoading()}</div>
        </div>
        
        <!-- Modals -->
        ${renderRentModal()}
        ${renderListModal()}
    </div>`;
}

function renderHeaderStats() {
    const listings = State.rentalListings || [];
    const myListings = listings.filter(l => State.isConnected && addressesMatch(l.owner, State.userAddress));
    const earnings = myListings.reduce((s, l) => s + Number(ethers.formatEther(BigInt(l.totalEarnings || 0))), 0);
    const now = Math.floor(Date.now() / 1000);
    
    // V14.0: Count available NFTs excluding those in cooldown
    const available = listings.filter(l => {
        if (l.isRented || (l.rentalEndTime && Number(l.rentalEndTime) > now)) return false;
        // Check cooldown
        const cooldownEnds = getCooldownEndTime(l);
        if (cooldownEnds && cooldownEnds > now) return false;
        return true;
    }).length;
    
    return `
        <div class="r-glass-light rounded-xl px-4 py-2.5 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                <i class="fa-solid fa-coins text-green-400 text-sm"></i>
            </div>
            <div>
                <p class="text-[9px] text-zinc-500 uppercase tracking-wider">Earned</p>
                <p class="text-base font-bold text-white">${earnings.toFixed(2)} <span class="text-xs text-zinc-500">BKC</span></p>
            </div>
        </div>
        <div class="r-glass-light rounded-xl px-4 py-2.5 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <i class="fa-solid fa-store text-cyan-400 text-sm"></i>
            </div>
            <div>
                <p class="text-[9px] text-zinc-500 uppercase tracking-wider">Available</p>
                <p class="text-base font-bold text-white">${available}</p>
            </div>
        </div>`;
}

function renderLoading() {
    return `
        <div class="flex flex-col items-center justify-center py-16">
            <div class="relative mb-5">
                <div class="absolute inset-0 bg-green-500/25 rounded-full blur-xl"></div>
                <div class="relative w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-green-500/30">
                    <img src="${AIRBNFT_IMAGE}" class="w-14 h-14 object-contain r-float" onerror="this.src='./assets/nft.png'">
                </div>
                <div class="absolute inset-[-3px] rounded-full border-2 border-transparent border-t-green-400 animate-spin"></div>
            </div>
            <p class="text-green-400 text-sm font-medium animate-pulse">Loading...</p>
        </div>`;
}

function renderContent() {
    const el = document.getElementById('content');
    if (!el) return;
    
    RentalState.countdownIntervals.forEach(clearInterval);
    RentalState.countdownIntervals = [];
    
    el.classList.remove('r-fadeUp');
    void el.offsetWidth;
    el.classList.add('r-fadeUp');
    
    switch (RentalState.activeTab) {
        case 'marketplace': el.innerHTML = renderMarketplace(); break;
        case 'my-listings': el.innerHTML = renderMyListings(); break;
        case 'my-rentals': el.innerHTML = renderMyRentals(); startTimers(); break;
    }
    
    document.getElementById('header-stats').innerHTML = renderHeaderStats();
    updateBadges();
}

function updateBadges() {
    const listings = State.rentalListings || [];
    const myListings = listings.filter(l => State.isConnected && addressesMatch(l.owner, State.userAddress));
    const now = Math.floor(Date.now() / 1000);
    const activeRentals = (State.myRentals || []).filter(r => addressesMatch(r.tenant, State.userAddress) && Number(r.endTime) > now);
    
    const el1 = document.getElementById('cnt-listings');
    const el2 = document.getElementById('cnt-rentals');
    if (el1) el1.textContent = myListings.length;
    if (el2) el2.textContent = activeRentals.length;
}

// V14.0: Calculate cooldown end time for a listing
function getCooldownEndTime(listing) {
    // Cooldown starts when rental ends
    // If rentalEndTime exists and rental is not currently active, calculate cooldown end
    if (listing.lastRentalEndTime) {
        return Number(listing.lastRentalEndTime) + COOLDOWN_PERIOD;
    }
    if (listing.rentalEndTime && !listing.isRented) {
        const rentalEnd = Number(listing.rentalEndTime);
        const now = Math.floor(Date.now() / 1000);
        if (rentalEnd < now) {
            // Rental has ended, cooldown applies
            return rentalEnd + COOLDOWN_PERIOD;
        }
    }
    return null;
}

// V14.0: Check if listing is in cooldown
function isInCooldown(listing) {
    const now = Math.floor(Date.now() / 1000);
    const cooldownEnds = getCooldownEndTime(listing);
    return cooldownEnds && cooldownEnds > now;
}

// V14.0: Get time since last rental (for sorting - higher = longer idle = more priority)
function getIdleTime(listing) {
    const now = Math.floor(Date.now() / 1000);
    
    // If never rented, use listing creation time or a very old date
    if (!listing.lastRentalEndTime && !listing.rentalEndTime) {
        return listing.createdAt ? now - Number(listing.createdAt) : Number.MAX_SAFE_INTEGER;
    }
    
    const lastEnd = listing.lastRentalEndTime 
        ? Number(listing.lastRentalEndTime) 
        : (listing.rentalEndTime ? Number(listing.rentalEndTime) : 0);
    
    if (lastEnd > now) return 0; // Currently rented
    return now - lastEnd;
}

// MARKETPLACE
function renderMarketplace() {
    const listings = State.rentalListings || [];
    const now = Math.floor(Date.now() / 1000);
    
    // V14.0: Enhanced filtering with cooldown support
    let available = listings.filter(l => {
        // Hide currently rented NFTs
        if (l.isRented || (l.rentalEndTime && Number(l.rentalEndTime) > now)) return false;
        // Apply tier filter
        if (RentalState.filterTier !== 'ALL' && getTierInfo(l.boostBips).name !== RentalState.filterTier) return false;
        return true;
    });
    
    // V14.0: Smart sorting - promoted first, then by idle time (longest idle first)
    available.sort((a, b) => {
        // Get promotion from API data first, fallback to contract data
        const promoA = BigInt(a.promotionFee || '0') || (RentalState.promotions.get(normalizeTokenId(a.tokenId)) || 0n);
        const promoB = BigInt(b.promotionFee || '0') || (RentalState.promotions.get(normalizeTokenId(b.tokenId)) || 0n);
        
        // Check cooldown status
        const cooldownA = isInCooldown(a);
        const cooldownB = isInCooldown(b);
        
        // Items NOT in cooldown come first
        if (!cooldownA && cooldownB) return -1;
        if (cooldownA && !cooldownB) return 1;
        
        // Then sort by promotion (higher first)
        if (promoB > promoA) return 1;
        if (promoB < promoA) return -1;
        
        // V14.0: If same promotion level, sort by idle time (longest idle first)
        if (RentalState.sortBy === 'featured') {
            const idleA = getIdleTime(a);
            const idleB = getIdleTime(b);
            if (idleB !== idleA) return idleB - idleA; // Longer idle = higher priority
            // If same idle time, sort by price (lower first)
            const pa = BigInt(a.pricePerHour || 0), pb = BigInt(b.pricePerHour || 0);
            return pa < pb ? -1 : 1;
        }
        
        const pa = BigInt(a.pricePerHour || 0), pb = BigInt(b.pricePerHour || 0);
        if (RentalState.sortBy === 'price-low') return pa < pb ? -1 : 1;
        if (RentalState.sortBy === 'price-high') return pa > pb ? -1 : 1;
        return (b.boostBips || 0) - (a.boostBips || 0);
    });
    
    return `
        <div>
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div class="flex flex-wrap gap-2">
                    <button class="r-chip ${RentalState.filterTier === 'ALL' ? 'active' : ''}" data-filter="ALL">All</button>
                    ${boosterTiers.map(t => `<button class="r-chip ${RentalState.filterTier === t.name ? 'active' : ''}" data-filter="${t.name}">${t.name}</button>`).join('')}
                </div>
                <div class="flex items-center gap-3">
                    <select id="sort-select" class="bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none cursor-pointer">
                        <option value="featured" ${RentalState.sortBy === 'featured' ? 'selected' : ''}>🔥 Featured</option>
                        <option value="price-low" ${RentalState.sortBy === 'price-low' ? 'selected' : ''}>Price ↑</option>
                        <option value="price-high" ${RentalState.sortBy === 'price-high' ? 'selected' : ''}>Price ↓</option>
                        <option value="boost-high" ${RentalState.sortBy === 'boost-high' ? 'selected' : ''}>Boost ↓</option>
                    </select>
                    ${State.isConnected ? `<button id="btn-list" class="r-btn r-btn-primary text-sm"><i class="fa-solid fa-plus mr-2"></i>List NFT</button>` : ''}
                </div>
            </div>
            ${available.length === 0 ? renderEmpty('No NFTs available', 'Be the first to list!', true) : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 r-grid">
                    ${available.map((l, i) => renderNFTCard(l, i)).join('')}
                </div>
            `}
        </div>`;
}

function renderNFTCard(listing, idx) {
    const tier = getTierInfo(listing.boostBips);
    const color = getTierColor(tier.name);
    const price = formatBigNumber(BigInt(listing.pricePerHour || 0)).toFixed(2);
    const tokenId = normalizeTokenId(listing.tokenId);
    
    // Check if this NFT belongs to the connected user
    const isOwner = State.isConnected && addressesMatch(listing.owner, State.userAddress);
    
    // V14.0: Check cooldown status
    const cooldownEnds = getCooldownEndTime(listing);
    const now = Math.floor(Date.now() / 1000);
    const inCooldown = cooldownEnds && cooldownEnds > now;
    const cooldownRemaining = inCooldown ? formatCooldownRemaining(cooldownEnds) : null;
    
    // Check promotion status from API first, fallback to contract
    const promoFromApi = BigInt(listing.promotionFee || '0');
    const promoFromContract = RentalState.promotions.get(tokenId) || 0n;
    const promoAmount = promoFromApi > 0n ? promoFromApi : promoFromContract;
    const isPromoted = promoAmount > 0n;
    const promoEth = isPromoted ? ethers.formatEther(promoAmount) : '0';
    
    return `
        <div class="r-card r-fadeUp ${isOwner ? 'ring-2 ring-blue-500/30' : ''} ${isPromoted ? 'ring-2 ring-yellow-500/40' : ''} ${inCooldown ? 'cooldown' : ''}" style="animation-delay:${idx * 40}ms">
            ${inCooldown && !isOwner ? `
                <div class="r-cooldown-overlay">
                    <i class="fa-solid fa-hourglass-half r-cooldown-icon"></i>
                    <p class="r-cooldown-text">Cooldown Period</p>
                    <p class="r-cooldown-time">${cooldownRemaining}</p>
                    <p class="text-[10px] text-zinc-400 mt-2">Available soon</p>
                </div>
            ` : ''}
            <div class="img-wrap">
                <div class="absolute top-3 left-3 z-10 flex flex-col gap-1">
                    <span class="r-badge tier-${tier.name.toLowerCase()}">${tier.name}</span>
                    ${isPromoted ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                        <i class="fa-solid fa-fire text-[8px]"></i>PROMOTED
                    </span>` : ''}
                    ${inCooldown && isOwner ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                        <i class="fa-solid fa-hourglass-half text-[8px]"></i>${cooldownRemaining}
                    </span>` : ''}
                </div>
                <div class="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
                    <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-black/50 backdrop-blur" style="color:${color.accent}">+${(listing.boostBips||0)/100}%</span>
                    ${isOwner ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">YOURS</span>` : ''}
                    ${isPromoted ? `<span class="px-2 py-0.5 rounded text-[9px] font-mono bg-yellow-500/10 text-yellow-400">${parseFloat(promoEth).toFixed(4)} ETH</span>` : ''}
                </div>
                <img src="${buildImageUrl(listing.img || tier.img)}" class="nft-img" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-4 relative z-10">
                <div class="mb-3">
                    <h3 class="text-white font-bold">${tier.name} Booster</h3>
                    <p class="text-xs font-mono" style="color:${color.accent}">#${tokenId}</p>
                </div>
                <div class="flex items-end justify-between">
                    <div>
                        <p class="text-[9px] text-zinc-500 uppercase mb-0.5">Price/hr</p>
                        <p class="text-xl font-bold text-white">${price} <span class="text-xs text-zinc-500">BKC</span></p>
                    </div>
                    ${isOwner ? `
                        <div class="flex gap-2 items-center">
                            <button class="promote-btn flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 text-yellow-400 hover:border-yellow-400 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all" data-id="${tokenId}" title="Boost visibility">
                                <i class="fa-solid fa-rocket text-sm"></i>
                            </button>
                            <button class="withdraw-btn flex items-center gap-1.5 h-10 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 hover:border-red-400 transition-all" data-id="${tokenId}">
                                <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                                <span>Withdraw</span>
                            </button>
                        </div>
                    ` : `
                        <button class="rent-btn flex items-center gap-1.5 h-10 px-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold hover:from-green-400 hover:to-emerald-500 hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none" data-id="${tokenId}" ${inCooldown ? 'disabled' : ''}>
                            <i class="fa-solid fa-clock text-xs"></i>
                            <span>Rent</span>
                        </button>
                    `}
                </div>
            </div>
        </div>`;
}

// MY LISTINGS
function renderMyListings() {
    if (!State.isConnected) return renderConnect('View your listings');
    
    const listings = State.rentalListings || [];
    const mine = listings.filter(l => addressesMatch(l.owner, State.userAddress));
    const listedIds = new Set(listings.map(l => normalizeTokenId(l.tokenId)));
    const canList = (State.myBoosters || []).filter(b => !listedIds.has(normalizeTokenId(b.tokenId)));
    const earnings = mine.reduce((s, l) => s + Number(ethers.formatEther(BigInt(l.totalEarnings || 0))), 0);
    
    return `
        <div>
            <div class="r-glass p-6 mb-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center border border-green-500/25">
                            <i class="fa-solid fa-sack-dollar text-green-400 text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-zinc-400">Total Earnings</p>
                            <p class="text-3xl font-bold text-white">${earnings.toFixed(4)} <span class="text-lg text-zinc-500">BKC</span></p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <div class="r-stat text-center min-w-[100px]">
                            <p class="text-2xl font-bold text-white">${mine.length}</p>
                            <p class="text-[9px] text-zinc-500 uppercase">Listed</p>
                        </div>
                        <div class="r-stat text-center min-w-[100px]">
                            <p class="text-2xl font-bold text-white">${canList.length}</p>
                            <p class="text-[9px] text-zinc-500 uppercase">Available</p>
                        </div>
                        <button id="btn-list-main" class="r-btn r-btn-primary px-6" ${canList.length === 0 ? 'disabled' : ''}>
                            <i class="fa-solid fa-plus mr-2"></i>List
                        </button>
                    </div>
                </div>
            </div>
            ${mine.length === 0 ? renderEmpty('No listings yet', 'List your NFTs to earn') : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 r-grid">
                    ${mine.map((l, i) => renderMyCard(l, i)).join('')}
                </div>
            `}
        </div>`;
}

function renderMyCard(listing, idx) {
    const tier = getTierInfo(listing.boostBips);
    const color = getTierColor(tier.name);
    const price = formatBigNumber(BigInt(listing.pricePerHour || 0)).toFixed(2);
    const earned = Number(ethers.formatEther(BigInt(listing.totalEarnings || 0))).toFixed(4);
    const tokenId = normalizeTokenId(listing.tokenId);
    const now = Math.floor(Date.now() / 1000);
    const rented = listing.isRented || (listing.rentalEndTime && Number(listing.rentalEndTime) > now);
    const time = rented && listing.rentalEndTime ? formatTimeRemaining(Number(listing.rentalEndTime)) : null;
    
    // V14.0: Check cooldown for my listings too
    const cooldownEnds = !rented ? getCooldownEndTime(listing) : null;
    const inCooldown = cooldownEnds && cooldownEnds > now;
    const cooldownRemaining = inCooldown ? formatCooldownRemaining(cooldownEnds) : null;
    
    return `
        <div class="r-card r-fadeUp ${rented ? 'ring-2 ring-amber-500/25' : ''} ${inCooldown ? 'ring-2 ring-indigo-500/25' : ''}" style="animation-delay:${idx * 40}ms">
            <div class="img-wrap">
                <div class="absolute top-3 left-3 z-10">
                    <span class="r-badge tier-${tier.name.toLowerCase()}">${tier.name}</span>
                </div>
                <div class="absolute top-3 right-3 z-10">
                    ${rented ? `<span class="r-timer warn"><i class="fa-solid fa-clock mr-1"></i>${time?.text || 'Rented'}</span>` : 
                      inCooldown ? `<span class="r-timer cooldown"><i class="fa-solid fa-hourglass-half mr-1"></i>${cooldownRemaining}</span>` :
                              `<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/25">Available</span>`}
                </div>
                <img src="${buildImageUrl(listing.img || tier.img)}" class="nft-img" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-4 relative z-10">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="text-white font-bold">${tier.name}</h3>
                        <p class="text-xs font-mono" style="color:${color.accent}">#${tokenId}</p>
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded-lg font-bold" style="background:${color.bg};color:${color.accent}">+${(listing.boostBips||0)/100}%</span>
                </div>
                <div class="grid grid-cols-2 gap-3 py-3 border-t border-b border-zinc-700/40 mb-3">
                    <div><p class="text-[9px] text-zinc-500 uppercase">Price/hr</p><p class="text-white font-bold">${price}</p></div>
                    <div><p class="text-[9px] text-zinc-500 uppercase">Earned</p><p class="text-green-400 font-bold">${earned}</p></div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-zinc-500"><i class="fa-solid fa-repeat mr-1"></i>${listing.rentalCount || 0} rentals</span>
                    <button class="withdraw-btn flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 hover:border-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed" data-id="${tokenId}" ${rented ? 'disabled' : ''}>
                        <i class="fa-solid fa-arrow-right-from-bracket text-[10px]"></i>
                        <span>Withdraw</span>
                    </button>
                </div>
            </div>
        </div>`;
}

// MY RENTALS
function renderMyRentals() {
    if (!State.isConnected) return renderConnect('View your rentals');
    
    const now = Math.floor(Date.now() / 1000);
    const all = (State.myRentals || []).filter(r => addressesMatch(r.tenant, State.userAddress));
    const active = all.filter(r => Number(r.endTime) > now);
    const expired = all.filter(r => Number(r.endTime) <= now).slice(0, 5);
    
    return `
        <div>
            <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <i class="fa-solid fa-bolt text-green-400"></i>Active Boosts (${active.length})
            </h3>
            ${active.length === 0 ? renderEmpty('No active rentals', 'Rent an NFT to boost!') : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 r-grid mb-8">
                    ${active.map((r, i) => renderActiveCard(r, i)).join('')}
                </div>
            `}
            ${expired.length > 0 ? `
                <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i>Recent
                </h3>
                <div class="space-y-2">
                    ${expired.map(r => renderExpiredRow(r)).join('')}
                </div>
            ` : ''}
        </div>`;
}

function renderActiveCard(rental, idx) {
    const tokenId = normalizeTokenId(rental.tokenId);
    const listing = (State.rentalListings || []).find(l => tokenIdsMatch(l.tokenId, rental.tokenId));
    const tier = getTierInfo(listing?.boostBips || 0);
    const color = getTierColor(tier.name);
    const time = formatTimeRemaining(Number(rental.endTime));
    const paid = formatBigNumber(BigInt(rental.paidAmount || 0)).toFixed(2);
    
    let timerClass = '';
    if (time.seconds < 300) timerClass = 'crit';
    else if (time.seconds < 1800) timerClass = 'warn';
    
    return `
        <div class="r-card ring-2 ring-green-500/25 r-fadeUp" style="animation-delay:${idx * 40}ms">
            <div class="img-wrap bg-gradient-to-br from-green-500/5 to-transparent">
                <div class="absolute top-3 left-3 z-10">
                    <span class="r-badge tier-${tier.name.toLowerCase()}">${tier.name}</span>
                </div>
                <div class="absolute top-3 right-3 z-10">
                    <span class="r-timer ${timerClass}" data-end="${rental.endTime}" id="timer-${tokenId}">
                        <i class="fa-solid fa-clock mr-1"></i>${time.text}
                    </span>
                </div>
                <img src="${buildImageUrl(listing?.img || tier.img)}" class="nft-img" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-4 relative z-10">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="text-white font-bold">${tier.name}</h3>
                        <p class="text-xs font-mono" style="color:${color.accent}">#${tokenId}</p>
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded-lg font-bold" style="background:${color.bg};color:${color.accent}">+${(listing?.boostBips||0)/100}%</span>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-zinc-700/40">
                    <span class="text-xs text-zinc-500">Paid:</span>
                    <span class="text-sm font-bold text-white">${paid} BKC</span>
                </div>
            </div>
        </div>`;
}

function renderExpiredRow(rental) {
    const tokenId = normalizeTokenId(rental.tokenId);
    const listing = (State.rentalListings || []).find(l => tokenIdsMatch(l.tokenId, rental.tokenId));
    const tier = getTierInfo(listing?.boostBips || 0);
    const color = getTierColor(tier.name);
    const paid = formatBigNumber(BigInt(rental.paidAmount || 0)).toFixed(2);
    const expiry = new Date(Number(rental.endTime) * 1000).toLocaleString();
    
    return `
        <div class="r-glass-light flex items-center justify-between px-4 py-3 rounded-xl">
            <div class="flex items-center gap-3">
                <img src="${buildImageUrl(listing?.img || tier.img)}" class="w-10 h-10 rounded-lg object-contain bg-zinc-800" onerror="this.src='./assets/nft.png'">
                <div>
                    <p class="text-sm text-white font-medium">${tier.name} <span class="font-mono text-xs" style="color:${color.accent}">#${tokenId}</span></p>
                    <p class="text-[10px] text-zinc-500">${expiry}</p>
                </div>
            </div>
            <span class="text-xs text-zinc-400">${paid} BKC</span>
        </div>`;
}

function renderEmpty(title, sub, showList = false) {
    return `
        <div class="r-empty r-glass-light py-16 rounded-2xl">
            <img src="${AIRBNFT_IMAGE}" class="opacity-30 mb-4" onerror="this.src='./assets/nft.png'">
            <h4 class="text-lg font-bold text-zinc-400 mb-1">${title}</h4>
            <p class="text-sm text-zinc-600 mb-4">${sub}</p>
            ${showList && State.isConnected ? `<button id="btn-list-empty" class="r-btn r-btn-primary text-sm"><i class="fa-solid fa-plus mr-2"></i>List Now</button>` : ''}
        </div>`;
}

function renderConnect(msg) {
    return `<div class="r-empty r-glass-light py-16 rounded-2xl">
        <i class="fa-solid fa-wallet text-4xl text-zinc-600 mb-4"></i>
        <h4 class="text-lg font-bold text-zinc-400 mb-1">Wallet Required</h4>
        <p class="text-sm text-zinc-600">${msg}</p>
    </div>`;
}

function startTimers() {
    const timers = document.querySelectorAll('[data-end]');
    timers.forEach(el => {
        const update = () => {
            const end = Number(el.dataset.end);
            const t = formatTimeRemaining(end);
            el.innerHTML = `<i class="fa-solid fa-clock mr-1"></i>${t.text}`;
            el.classList.remove('warn', 'crit');
            if (t.seconds > 0 && t.seconds < 300) el.classList.add('crit');
            else if (t.seconds > 0 && t.seconds < 1800) el.classList.add('warn');
            if (t.expired) {
                clearInterval(el._int);
                refreshData();
            }
        };
        update();
        el._int = setInterval(update, 1000);
        RentalState.countdownIntervals.push(el._int);
    });
}

// Modals
function renderRentModal() {
    return `
        <div id="rent-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 items-center justify-center p-4">
            <div class="r-glass max-w-md w-full p-6 r-scaleIn">
                <div class="flex justify-between items-center mb-5">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-clock text-green-400"></i>Rent Booster
                    </h3>
                    <button id="close-rent" class="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="rent-content" class="mb-4"></div>
                <div class="r-glass-light p-4 rounded-xl mb-6">
                    <div class="flex justify-between text-sm mb-2">
                        <span class="text-zinc-400">Duration</span>
                        <span class="text-white font-bold">1 Hour</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-zinc-400">Total Cost</span>
                        <span id="rent-cost" class="text-2xl font-bold text-green-400">0 BKC</span>
                    </div>
                </div>
                <button id="confirm-rent" class="r-btn r-btn-primary w-full py-3">
                    <i class="fa-solid fa-check mr-2"></i>Confirm
                </button>
            </div>
        </div>`;
}

function renderListModal() {
    return `
        <div id="list-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 items-center justify-center p-4">
            <div class="r-glass max-w-md w-full p-6 r-scaleIn">
                <div class="flex justify-between items-center mb-5">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-tag text-green-400"></i>List NFT
                    </h3>
                    <button id="close-list" class="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="mb-4">
                    <label class="text-sm text-zinc-400 mb-1.5 block">Select NFT</label>
                    <select id="list-select" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none">
                        <option value="">Loading...</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="text-sm text-zinc-400 mb-1.5 block">Price per Hour (BKC)</label>
                    <input type="number" id="list-price" placeholder="100" min="1" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none">
                </div>
                <!-- V13.0: Add promotion option during listing -->
                <div class="r-glass-light p-4 rounded-xl mb-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-rocket text-yellow-400"></i>
                        <span class="text-sm font-bold text-white">Promote (Optional)</span>
                    </div>
                    <p class="text-xs text-zinc-400 mb-3">Pay ETH to boost visibility in marketplace</p>
                    <div class="flex gap-2">
                        <input type="number" id="list-promo-amount" placeholder="0.01" step="0.001" min="0" class="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm outline-none">
                        <span class="flex items-center px-3 bg-zinc-800 rounded-lg text-zinc-400 text-sm">ETH</span>
                    </div>
                </div>
                <button id="confirm-list" class="r-btn r-btn-primary w-full py-3">
                    <i class="fa-solid fa-tag mr-2"></i>List NFT
                </button>
                <p id="list-promo-note" class="text-xs text-zinc-500 text-center mt-2 hidden">
                    <i class="fa-solid fa-info-circle mr-1"></i>2 transactions: List + Promote
                </p>
            </div>
        </div>
        
        <!-- V12.5: Promote Modal -->
        <div id="promote-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 items-center justify-center p-4">
            <div class="r-glass max-w-md w-full p-6 r-scaleIn">
                <div class="flex justify-between items-center mb-5">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-rocket text-yellow-400"></i>Promote Listing
                    </h3>
                    <button id="close-promote" class="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="promote-content" class="mb-4"></div>
                <div class="r-glass-light p-4 rounded-xl mb-4">
                    <p class="text-xs text-zinc-400 mb-2">🔥 Promoted listings appear first in the marketplace</p>
                    <p class="text-xs text-zinc-400">💎 Pay more ETH = Higher visibility</p>
                    <p class="text-xs text-zinc-400 mt-2">📌 Promotion stays until you withdraw the NFT</p>
                </div>
                <div class="mb-6">
                    <label class="text-sm text-zinc-400 mb-1.5 block">Promotion Amount (ETH)</label>
                    <input type="number" id="promote-amount" placeholder="0.01" step="0.001" min="0.001" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none">
                    <p class="text-xs text-zinc-500 mt-1">Suggested: 0.01 - 0.1 ETH</p>
                </div>
                <div class="flex items-center justify-between mb-4 text-sm">
                    <span class="text-zinc-400">Current promotion:</span>
                    <span id="current-promo" class="text-yellow-400 font-mono">0 ETH</span>
                </div>
                <button id="confirm-promote" class="r-btn w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold">
                    <i class="fa-solid fa-rocket mr-2"></i>Promote Now
                </button>
            </div>
        </div>`;
}

// Data
async function refreshData() {
    RentalState.isLoading = true;
    try {
        await Promise.all([
            loadRentalListings(),
            State.isConnected ? loadUserRentals() : null,
            State.isConnected ? loadMyBoostersFromAPI() : null
        ]);
        
        // V12.5: Load promotions from contract
        await loadPromotionsFromContract();
        
        renderContent();
    } catch (e) {
        console.error('[Rental] Refresh error:', e);
    } finally {
        RentalState.isLoading = false;
    }
}

// V12.5: Load promotion fees from RentalManager contract
async function loadPromotionsFromContract() {
    try {
        const { NetworkManager } = await import('../modules/core/index.js');
        const provider = NetworkManager.getProvider();
        
        if (!provider || !addresses?.rentalManager) {
            console.warn('[Rental] Cannot load promotions - no provider or contract address');
            return;
        }
        
        // Minimal ABI for getPromotionRanking
        const abi = [
            'function getPromotionRanking() view returns (uint256[] tokenIds, uint256[] fees)',
            'function getPromotionFee(uint256 tokenId) view returns (uint256)'
        ];
        
        const contract = new ethers.Contract(addresses.rentalManager, abi, provider);
        
        // Try to get all promotions at once
        try {
            const [tokenIds, fees] = await contract.getPromotionRanking();
            RentalState.promotions = new Map();
            
            for (let i = 0; i < tokenIds.length; i++) {
                const tokenId = tokenIds[i].toString();
                const fee = fees[i];
                if (fee > 0n) {
                    RentalState.promotions.set(tokenId, fee);
                }
            }
            
            console.log('[Rental] Loaded', RentalState.promotions.size, 'promotions from contract');
        } catch (e) {
            // Fallback: contract might not have V2 functions yet
            console.warn('[Rental] getPromotionRanking not available, contract may need upgrade');
            RentalState.promotions = new Map();
        }
    } catch (e) {
        console.error('[Rental] Error loading promotions:', e);
        RentalState.promotions = new Map();
    }
}

// Events
function setupEvents() {
    // Tabs
    document.querySelectorAll('.r-tab').forEach(t => {
        t.addEventListener('click', () => {
            document.querySelectorAll('.r-tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            RentalState.activeTab = t.dataset.tab;
            renderContent();
        });
    });
    
    // Refresh
    document.getElementById('btn-refresh')?.addEventListener('click', async () => {
        const icon = document.getElementById('refresh-icon');
        icon?.classList.add('fa-spin');
        await refreshData();
        setTimeout(() => icon?.classList.remove('fa-spin'), 500);
    });
    
    // Delegated
    document.addEventListener('click', e => {
        const chip = e.target.closest('.r-chip');
        if (chip) { RentalState.filterTier = chip.dataset.filter; renderContent(); return; }
        
        const rent = e.target.closest('.rent-btn');
        if (rent && !rent.disabled) { openRentModal(rent.dataset.id); return; }
        
        const withdraw = e.target.closest('.withdraw-btn');
        if (withdraw && !withdraw.disabled) { handleWithdraw(withdraw); return; }
        
        // V12.5: Promote button
        const promote = e.target.closest('.promote-btn');
        if (promote && !promote.disabled) { openPromoteModal(promote.dataset.id); return; }
        
        const listBtn = e.target.closest('#btn-list, #btn-list-main, #btn-list-empty');
        if (listBtn && !listBtn.disabled) { openListModal(); return; }
    });
    
    document.addEventListener('change', e => {
        if (e.target.id === 'sort-select') { RentalState.sortBy = e.target.value; renderContent(); }
    });
    
    // Modals
    document.getElementById('close-rent')?.addEventListener('click', closeRentModal);
    document.getElementById('close-list')?.addEventListener('click', closeListModal);
    document.getElementById('close-promote')?.addEventListener('click', closePromoteModal);
    document.getElementById('rent-modal')?.addEventListener('click', e => { if (e.target.id === 'rent-modal') closeRentModal(); });
    document.getElementById('list-modal')?.addEventListener('click', e => { if (e.target.id === 'list-modal') closeListModal(); });
    document.getElementById('promote-modal')?.addEventListener('click', e => { if (e.target.id === 'promote-modal') closePromoteModal(); });
    document.getElementById('confirm-rent')?.addEventListener('click', handleRent);
    document.getElementById('confirm-list')?.addEventListener('click', handleList);
    document.getElementById('confirm-promote')?.addEventListener('click', handlePromote);
}

// Modal handlers
function openRentModal(tokenId) {
    if (!State.isConnected) { showToast('Connect wallet first', 'warning'); return; }
    const listing = (State.rentalListings || []).find(l => tokenIdsMatch(l.tokenId, tokenId));
    if (!listing) { showToast('Not found', 'error'); return; }
    
    // V14.0: Check cooldown
    if (isInCooldown(listing)) {
        const cooldownEnds = getCooldownEndTime(listing);
        const remaining = formatCooldownRemaining(cooldownEnds);
        showToast(`⏳ Cooldown active. Available in ${remaining}`, 'warning');
        return;
    }
    
    // Reset state when opening modal
    RentalState.isTransactionPending = false;
    RentalState.selectedRentalId = normalizeTokenId(tokenId);
    
    const tier = getTierInfo(listing.boostBips);
    const color = getTierColor(tier.name);
    const price = formatBigNumber(BigInt(listing.pricePerHour || 0)).toFixed(2);
    
    document.getElementById('rent-content').innerHTML = `
        <div class="flex items-center gap-4 r-glass-light p-4 rounded-xl">
            <img src="${buildImageUrl(listing.img || tier.img)}" class="w-20 h-20 object-contain rounded-xl" onerror="this.src='./assets/nft.png'">
            <div>
                <span class="r-badge tier-${tier.name.toLowerCase()} mb-2">${tier.name}</span>
                <p class="text-white font-bold text-lg">${tier.name} Booster</p>
                <p class="text-sm" style="color:${color.accent}">+${(listing.boostBips||0)/100}% boost</p>
            </div>
        </div>`;
    document.getElementById('rent-cost').innerHTML = `${price} <span class="text-base text-zinc-500">BKC</span>`;
    
    // Reset button state
    const btn = document.getElementById('confirm-rent');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Confirm';
        btn.disabled = false;
    }
    
    const modal = document.getElementById('rent-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeRentModal() {
    const modal = document.getElementById('rent-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    RentalState.selectedRentalId = null;
    RentalState.isTransactionPending = false;
    const btn = document.getElementById('confirm-rent');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Confirm';
        btn.disabled = false;
    }
}

function openListModal() {
    RentalState.isTransactionPending = false;
    
    const listings = State.rentalListings || [];
    const listedIds = new Set(listings.map(l => normalizeTokenId(l.tokenId)));
    const available = (State.myBoosters || []).filter(b => !listedIds.has(normalizeTokenId(b.tokenId)));
    
    const select = document.getElementById('list-select');
    select.innerHTML = available.length === 0 
        ? '<option value="">No NFTs available</option>'
        : available.map(b => {
            const t = getTierInfo(b.boostBips);
            return `<option value="${normalizeTokenId(b.tokenId)}">#${normalizeTokenId(b.tokenId)} - ${t.name} (+${(b.boostBips||0)/100}%)</option>`;
        }).join('');
    
    document.getElementById('list-price').value = '';
    
    // V13.0: Reset promotion input
    const promoInput = document.getElementById('list-promo-amount');
    if (promoInput) {
        promoInput.value = '';
        promoInput.addEventListener('input', () => {
            const note = document.getElementById('list-promo-note');
            if (note) {
                const val = parseFloat(promoInput.value) || 0;
                if (val > 0) {
                    note.classList.remove('hidden');
                } else {
                    note.classList.add('hidden');
                }
            }
        });
    }
    
    const note = document.getElementById('list-promo-note');
    if (note) note.classList.add('hidden');
    
    const btn = document.getElementById('confirm-list');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-tag mr-2"></i>List NFT';
        btn.disabled = false;
    }
    
    const modal = document.getElementById('list-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeListModal() {
    const modal = document.getElementById('list-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    RentalState.isTransactionPending = false;
    RentalState.pendingPromotion = null;
    const btn = document.getElementById('confirm-list');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-tag mr-2"></i>List NFT';
        btn.disabled = false;
    }
}

// V12.5: Promote Modal Functions
function openPromoteModal(tokenId) {
    if (!State.isConnected) { showToast('Connect wallet first', 'warning'); return; }
    const listing = (State.rentalListings || []).find(l => tokenIdsMatch(l.tokenId, tokenId));
    if (!listing) { showToast('Listing not found', 'error'); return; }
    
    RentalState.isTransactionPending = false;
    RentalState.selectedRentalId = normalizeTokenId(tokenId);
    
    const tier = getTierInfo(listing.boostBips);
    const color = getTierColor(tier.name);
    const currentPromo = RentalState.promotions.get(normalizeTokenId(tokenId)) || 0n;
    const currentPromoEth = ethers.formatEther(currentPromo);
    
    document.getElementById('promote-content').innerHTML = `
        <div class="flex items-center gap-4 r-glass-light p-4 rounded-xl">
            <img src="${buildImageUrl(listing.img || tier.img)}" class="w-16 h-16 object-contain rounded-xl" onerror="this.src='./assets/nft.png'">
            <div>
                <span class="r-badge tier-${tier.name.toLowerCase()} mb-2">${tier.name}</span>
                <p class="text-white font-bold">${tier.name} Booster</p>
                <p class="text-xs font-mono" style="color:${color.accent}">#${normalizeTokenId(tokenId)}</p>
            </div>
        </div>`;
    
    document.getElementById('current-promo').textContent = `${parseFloat(currentPromoEth).toFixed(4)} ETH`;
    document.getElementById('promote-amount').value = '';
    
    const btn = document.getElementById('confirm-promote');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-rocket mr-2"></i>Promote Now';
        btn.disabled = false;
    }
    
    const modal = document.getElementById('promote-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closePromoteModal() {
    const modal = document.getElementById('promote-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    RentalState.selectedRentalId = null;
    RentalState.isTransactionPending = false;
    const btn = document.getElementById('confirm-promote');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-rocket mr-2"></i>Promote Now';
        btn.disabled = false;
    }
}

// V14.0: Enhanced promotion with retry logic
async function executePromotion(tokenId, amountEth, maxRetries = 5) {
    console.log('[RentalPage] executePromotion starting for tokenId:', tokenId, 'amount:', amountEth, 'ETH');
    
    const amountWei = ethers.parseEther(amountEth);
    const abi = ['function promoteListing(uint256 tokenId) payable'];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[RentalPage] Promote attempt ${attempt}/${maxRetries}`);
            
            // Get fresh provider/signer for each attempt
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(addresses.rentalManager, abi, signer);
            
            const tx = await contract.promoteListing(tokenId, { value: amountWei });
            console.log('[RentalPage] Promote TX submitted:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('[RentalPage] ✅ Promote confirmed in block:', receipt.blockNumber);
            
            return { success: true, hash: receipt.hash };
            
        } catch (err) {
            console.warn(`[RentalPage] Promote attempt ${attempt} failed:`, err.message);
            
            // User rejection - stop immediately
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                return { success: false, cancelled: true };
            }
            
            // If it's an RPC error and we have more retries, wait and try again
            if (attempt < maxRetries && (
                err.message?.includes('Internal JSON-RPC') ||
                err.message?.includes('could not coalesce') ||
                err.code === -32603
            )) {
                const delay = Math.min(2000 * attempt, 8000); // 2s, 4s, 6s, 8s, 8s
                console.log(`[RentalPage] Waiting ${delay}ms before retry...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            
            // Last attempt failed or non-retryable error
            if (attempt === maxRetries) {
                return { success: false, error: err.reason || err.message || 'Unknown error' };
            }
        }
    }
    
    return { success: false, error: 'Max retries exceeded' };
}

async function handlePromote() {
    if (RentalState.isTransactionPending) return;
    const tokenId = RentalState.selectedRentalId;
    const amountEth = document.getElementById('promote-amount').value;
    
    if (!tokenId) { showToast('No NFT selected', 'error'); return; }
    if (!amountEth || parseFloat(amountEth) <= 0) { showToast('Enter a valid amount', 'error'); return; }
    
    const btn = document.getElementById('confirm-promote');
    RentalState.isTransactionPending = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing...';
    btn.disabled = true;
    
    console.log('[RentalPage] Starting promote transaction for tokenId:', tokenId, 'amount:', amountEth, 'ETH');
    
    const result = await executePromotion(tokenId, amountEth);
    
    if (result.success) {
        RentalState.isTransactionPending = false;
        closePromoteModal();
        showToast('🚀 NFT Promoted Successfully!', 'success');
        await refreshData();
    } else if (result.cancelled) {
        // User cancelled - just reset
        RentalState.isTransactionPending = false;
        btn.innerHTML = '<i class="fa-solid fa-rocket mr-2"></i>Promote Now';
        btn.disabled = false;
    } else {
        RentalState.isTransactionPending = false;
        btn.innerHTML = '<i class="fa-solid fa-rocket mr-2"></i>Promote Now';
        btn.disabled = false;
        showToast('Failed: ' + result.error, 'error');
    }
}

async function handleRent() {
    if (RentalState.isTransactionPending) return;
    const tokenId = RentalState.selectedRentalId;
    const listing = (State.rentalListings || []).find(l => tokenIdsMatch(l.tokenId, tokenId));
    if (!listing) return;
    
    // V14.0: Double check cooldown
    if (isInCooldown(listing)) {
        showToast('⏳ This NFT is in cooldown period', 'error');
        return;
    }
    
    const btn = document.getElementById('confirm-rent');
    RentalState.isTransactionPending = true;
    
    console.log('[RentalPage] Starting rent transaction for tokenId:', tokenId);
    
    try {
        await RentalTx.rent({
            tokenId,
            hours: 1,
            totalCost: BigInt(listing.pricePerHour || 0),
            button: btn,
            onSuccess: async (receipt) => { 
                console.log('[RentalPage] ✅ Rent onSuccess called, hash:', receipt?.hash);
                RentalState.isTransactionPending = false;
                closeRentModal(); 
                showToast('⏰ NFT Rented Successfully!', 'success'); 
                try {
                    await refreshData();
                } catch (e) {
                    console.warn('[RentalPage] Refresh after rent failed:', e);
                }
            },
            onError: (e) => { 
                console.log('[RentalPage] ❌ Rent onError called:', e);
                RentalState.isTransactionPending = false;
                if (!e.cancelled && e.type !== 'user_rejected') {
                    showToast('Failed: ' + (e.message || 'Error'), 'error'); 
                }
            }
        });
        
        console.log('[RentalPage] Rent transaction call completed');
    } catch (err) {
        console.error('[RentalPage] handleRent catch error:', err);
        RentalState.isTransactionPending = false;
        if (!err.cancelled && err.type !== 'user_rejected') {
            showToast('Failed: ' + (err.message || 'Transaction failed'), 'error');
        }
    }
}

async function handleList() {
    if (RentalState.isTransactionPending) return;
    const tokenId = document.getElementById('list-select').value;
    const price = document.getElementById('list-price').value;
    if (!tokenId) { showToast('Select an NFT', 'error'); return; }
    if (!price || parseFloat(price) <= 0) { showToast('Enter valid price', 'error'); return; }
    
    // V13.0: Get promotion amount
    const promoAmountEth = parseFloat(document.getElementById('list-promo-amount')?.value) || 0;
    
    const btn = document.getElementById('confirm-list');
    RentalState.isTransactionPending = true;
    
    // Store pending promotion for retry if needed
    if (promoAmountEth > 0) {
        RentalState.pendingPromotion = { tokenId, amountEth: promoAmountEth.toString() };
    }
    
    console.log('[RentalPage] Starting list transaction for tokenId:', tokenId, 'with promo:', promoAmountEth, 'ETH');
    
    try {
        await RentalTx.list({
            tokenId,
            pricePerHour: ethers.parseUnits(price, 18),
            minHours: 1,
            maxHours: 168,
            button: btn,
            onSuccess: async (receipt) => { 
                console.log('[RentalPage] ✅ List onSuccess called, hash:', receipt?.hash);
                
                // V14.0: Enhanced promotion flow with better retry handling
                if (promoAmountEth > 0) {
                    showToast('🏷️ NFT Listed! Now promoting...', 'success');
                    
                    // Small delay to ensure listing is indexed
                    await new Promise(r => setTimeout(r, 3000));
                    
                    const promoResult = await executePromotion(tokenId, promoAmountEth.toString());
                    
                    if (promoResult.success) {
                        RentalState.isTransactionPending = false;
                        RentalState.pendingPromotion = null;
                        closeListModal();
                        showToast('🚀 NFT Listed & Promoted!', 'success');
                        await refreshData();
                    } else if (promoResult.cancelled) {
                        // User cancelled promotion but list succeeded
                        RentalState.isTransactionPending = false;
                        RentalState.pendingPromotion = null;
                        closeListModal();
                        showToast('🏷️ NFT Listed (promotion skipped)', 'info');
                        await refreshData();
                    } else {
                        // Promotion failed but list succeeded
                        RentalState.isTransactionPending = false;
                        closeListModal();
                        showToast('⚠️ Listed but promotion failed. You can promote later.', 'warning');
                        await refreshData();
                    }
                } else {
                    // No promotion, just close and refresh
                    RentalState.isTransactionPending = false;
                    closeListModal(); 
                    showToast('🏷️ NFT Listed Successfully!', 'success'); 
                    try {
                        await refreshData();
                    } catch (e) {
                        console.warn('[RentalPage] Refresh after list failed:', e);
                    }
                }
            },
            onError: (e) => { 
                console.log('[RentalPage] ❌ List onError called:', e);
                RentalState.isTransactionPending = false;
                if (!e.cancelled && e.type !== 'user_rejected') {
                    showToast('Failed: ' + (e.message || 'Error'), 'error'); 
                }
            }
        });
        
        console.log('[RentalPage] List transaction call completed');
    } catch (err) {
        console.error('[RentalPage] handleList catch error:', err);
        RentalState.isTransactionPending = false;
        if (!err.cancelled && err.type !== 'user_rejected') {
            showToast('Failed: ' + (err.message || 'Transaction failed'), 'error');
        }
    }
}

async function handleWithdraw(btn) {
    if (RentalState.isTransactionPending) return;
    const tokenId = btn.dataset.id;
    if (!confirm('Withdraw this NFT from marketplace?')) return;
    
    RentalState.isTransactionPending = true;
    
    console.log('[RentalPage] Starting withdraw transaction for tokenId:', tokenId);
    
    try {
        await RentalTx.withdraw({
            tokenId,
            button: btn,
            onSuccess: async (receipt) => { 
                console.log('[RentalPage] ✅ Withdraw onSuccess called, hash:', receipt?.hash);
                RentalState.isTransactionPending = false;
                
                console.log('[RentalPage] Promotion cleared by contract for tokenId:', tokenId);
                
                showToast('↩️ NFT Withdrawn Successfully!', 'success'); 
                try {
                    await refreshData();
                } catch (e) {
                    console.warn('[RentalPage] Refresh after withdraw failed:', e);
                }
            },
            onError: (e) => { 
                console.log('[RentalPage] ❌ Withdraw onError called:', e);
                RentalState.isTransactionPending = false;
                if (!e.cancelled && e.type !== 'user_rejected') {
                    showToast('Failed: ' + (e.message || 'Error'), 'error'); 
                }
            }
        });
        
        console.log('[RentalPage] Withdraw transaction call completed');
    } catch (err) {
        console.error('[RentalPage] handleWithdraw catch error:', err);
        RentalState.isTransactionPending = false;
        if (!err.cancelled && err.type !== 'user_rejected') {
            showToast('Failed: ' + (err.message || 'Transaction failed'), 'error');
        }
    }
}