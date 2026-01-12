// js/pages/RentalPage.js
// ✅ PRODUCTION V12.5 - Complete UI Redesign + MetaAds Promotions (On-Chain)
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

const RentalState = {
    activeTab: 'marketplace',
    filterTier: 'ALL',
    sortBy: 'promotion', // V12.5: Default sort by promotion
    selectedRentalId: null,
    isLoading: false,
    isTransactionPending: false,
    countdownIntervals: [],
    promotions: new Map() // V12.5: Store promotions from contract
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
    if (document.getElementById('rental-v12-css')) return;
    const css = document.createElement('style');
    css.id = 'rental-v12-css';
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
        .r-card .img-wrap{aspect-ratio:1;background:radial-gradient(circle at 50% 30%,rgba(34,197,94,.08),transparent 60%);display:flex;align-items:center;justify-content:center;padding:20px;position:relative}
        .r-card .img-wrap::after{content:'';position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(to top,rgba(24,24,27,1),transparent);pointer-events:none}
        .r-card .nft-img{width:65%;height:65%;object-fit:contain;filter:drop-shadow(0 15px 30px rgba(0,0,0,.5));transition:transform .5s ease;z-index:1}
        .r-card:hover .nft-img{transform:scale(1.12) rotate(4deg)}
        
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
        
        .r-stat{padding:16px;border-radius:16px;background:linear-gradient(145deg,rgba(24,24,27,.9),rgba(39,39,42,.8));border:1px solid rgba(63,63,70,.4);transition:all .25s}
        .r-stat:hover{border-color:rgba(34,197,94,.25);transform:translateY(-3px)}
        
        .r-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:50px 20px;text-align:center}
        .r-empty img{width:80px;height:80px;opacity:.25;margin-bottom:20px}
        
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
    
    // V12.1: Count ALL available NFTs (including user's own)
    const available = listings.filter(l => {
        return !l.isRented && !(l.rentalEndTime && Number(l.rentalEndTime) > now);
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

// MARKETPLACE
function renderMarketplace() {
    const listings = State.rentalListings || [];
    const now = Math.floor(Date.now() / 1000);
    
    // V12.1: Show ALL listings (including user's own), filter only by rental status and tier
    let available = listings.filter(l => {
        // Hide currently rented NFTs
        if (l.isRented || (l.rentalEndTime && Number(l.rentalEndTime) > now)) return false;
        // Apply tier filter
        if (RentalState.filterTier !== 'ALL' && getTierInfo(l.boostBips).name !== RentalState.filterTier) return false;
        return true;
    });
    
    // V12.5: Sort by promotion first (highest paid first), then by selected criteria
    available.sort((a, b) => {
        const promoA = RentalState.promotions.get(normalizeTokenId(a.tokenId)) || 0n;
        const promoB = RentalState.promotions.get(normalizeTokenId(b.tokenId)) || 0n;
        
        // If sorting by promotion, always prioritize promoted listings
        if (RentalState.sortBy === 'promotion') {
            if (promoB > promoA) return 1;
            if (promoB < promoA) return -1;
            // If same promotion, sort by price
            const pa = BigInt(a.pricePerHour || 0), pb = BigInt(b.pricePerHour || 0);
            return pa < pb ? -1 : 1;
        }
        
        // For other sorts, still show promoted first, then apply criteria
        if (promoB > promoA) return 1;
        if (promoB < promoA) return -1;
        
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
                        <option value="promotion" ${RentalState.sortBy === 'promotion' ? 'selected' : ''}>🔥 Featured</option>
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
    
    // V12.1: Check if this NFT belongs to the connected user
    const isOwner = State.isConnected && addressesMatch(listing.owner, State.userAddress);
    
    // V12.5: Check promotion status
    const promoAmount = RentalState.promotions.get(tokenId) || 0n;
    const isPromoted = promoAmount > 0n;
    const promoEth = isPromoted ? ethers.formatEther(promoAmount) : '0';
    
    return `
        <div class="r-card r-fadeUp ${isOwner ? 'ring-2 ring-blue-500/30' : ''} ${isPromoted ? 'ring-2 ring-yellow-500/40' : ''}" style="animation-delay:${idx * 40}ms">
            <div class="img-wrap">
                <div class="absolute top-3 left-3 z-10 flex flex-col gap-1">
                    <span class="r-badge tier-${tier.name.toLowerCase()}">${tier.name}</span>
                    ${isPromoted ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                        <i class="fa-solid fa-fire text-[8px]"></i>PROMOTED
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
                        <div class="flex gap-2">
                            <button class="promote-btn r-btn text-sm px-3 py-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 text-yellow-400 hover:border-yellow-400/50" data-id="${tokenId}" title="Boost visibility">
                                <i class="fa-solid fa-rocket"></i>
                            </button>
                            <button class="withdraw-btn r-btn r-btn-danger text-sm px-4 py-2" data-id="${tokenId}">
                                <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
                            </button>
                        </div>
                    ` : `
                        <button class="rent-btn r-btn r-btn-primary text-sm px-4 py-2" data-id="${tokenId}">
                            <i class="fa-solid fa-clock mr-1"></i>Rent
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
    
    return `
        <div class="r-card r-fadeUp ${rented ? 'ring-2 ring-amber-500/25' : ''}" style="animation-delay:${idx * 40}ms">
            <div class="img-wrap">
                <div class="absolute top-3 left-3 z-10">
                    <span class="r-badge tier-${tier.name.toLowerCase()}">${tier.name}</span>
                </div>
                <div class="absolute top-3 right-3 z-10">
                    ${rented ? `<span class="r-timer warn"><i class="fa-solid fa-clock mr-1"></i>${time?.text || 'Rented'}</span>` : 
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
                    <span class="text-xs text-zinc-500"><i class="fa-solid fa-repeat mr-1"></i>${listing.rentalCount || 0}</span>
                    <button class="withdraw-btn r-btn r-btn-danger text-xs px-3 py-1.5" data-id="${tokenId}" ${rented ? 'disabled' : ''}>
                        <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
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
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="text-white font-bold">${tier.name}</h3>
                        <p class="text-xs font-mono" style="color:${color.accent}">#${tokenId}</p>
                    </div>
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/25">
                        +${(listing?.boostBips||0)/100}% <i class="fa-solid fa-bolt ml-1"></i>
                    </span>
                </div>
                <div class="pt-3 border-t border-zinc-700/40 flex justify-between">
                    <span class="text-zinc-500 text-sm">Paid</span>
                    <span class="text-white font-bold">${paid} BKC</span>
                </div>
            </div>
        </div>`;
}

function renderExpiredRow(rental) {
    const tokenId = normalizeTokenId(rental.tokenId);
    const listing = (State.rentalListings || []).find(l => tokenIdsMatch(l.tokenId, rental.tokenId));
    const tier = getTierInfo(listing?.boostBips || 0);
    const paid = formatBigNumber(BigInt(rental.paidAmount || 0)).toFixed(2);
    
    return `
        <div class="flex items-center gap-3 r-glass-light p-3 rounded-xl">
            <img src="${buildImageUrl(listing?.img || tier.img)}" class="w-10 h-10 rounded-lg object-contain bg-black/30" onerror="this.src='./assets/nft.png'">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                    <span class="r-badge tier-${tier.name.toLowerCase()} text-[8px] py-0.5 px-2">${tier.name}</span>
                    <span class="text-zinc-400 text-xs font-mono">#${tokenId}</span>
                </div>
                <p class="text-zinc-500 text-[11px]">Paid: ${paid} BKC</p>
            </div>
            <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">Expired</span>
        </div>`;
}

function startTimers() {
    document.querySelectorAll('[data-end]').forEach(el => {
        const end = Number(el.dataset.end);
        const interval = setInterval(() => {
            const t = formatTimeRemaining(end);
            if (t.expired) {
                el.innerHTML = '<i class="fa-solid fa-clock mr-1"></i>Expired';
                el.className = 'r-timer crit';
                clearInterval(interval);
                setTimeout(() => refreshData(), 2000);
            } else {
                el.innerHTML = `<i class="fa-solid fa-clock mr-1"></i>${t.text}`;
                el.classList.remove('warn', 'crit');
                if (t.seconds < 300) el.classList.add('crit');
                else if (t.seconds < 1800) el.classList.add('warn');
            }
        }, 1000);
        RentalState.countdownIntervals.push(interval);
    });
}

// Helpers
function renderEmpty(title, sub, showBtn = false) {
    return `
        <div class="r-empty r-glass p-10">
            <img src="${AIRBNFT_IMAGE}" onerror="this.style.display='none'">
            <h3 class="text-lg font-bold text-zinc-300 mb-1">${title}</h3>
            <p class="text-zinc-500 mb-5">${sub}</p>
            ${showBtn && State.isConnected ? `<button id="btn-list-empty" class="r-btn r-btn-primary"><i class="fa-solid fa-plus mr-2"></i>List NFT</button>` : ''}
        </div>`;
}

function renderConnect(msg) {
    return `
        <div class="r-empty r-glass p-10">
            <div class="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-5 border border-zinc-700">
                <i class="fa-solid fa-wallet text-zinc-500 text-3xl"></i>
            </div>
            <h3 class="text-lg font-bold text-zinc-300 mb-1">Connect Wallet</h3>
            <p class="text-zinc-500">${msg}</p>
        </div>`;
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
                <div class="r-glass-light rounded-xl p-3 mb-4 text-center">
                    <i class="fa-solid fa-hourglass-half text-amber-400 mr-2"></i>
                    Duration: <span class="text-white font-bold">1 hour</span>
                </div>
                <div class="r-glass-light rounded-xl p-4 mb-5 flex justify-between items-center">
                    <span class="text-zinc-400">Total</span>
                    <span id="rent-cost" class="text-2xl font-bold text-white">--</span>
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
                <div class="space-y-4 mb-6">
                    <div>
                        <label class="text-sm text-zinc-400 mb-1.5 block">Select NFT</label>
                        <select id="list-select" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none"></select>
                    </div>
                    <div>
                        <label class="text-sm text-zinc-400 mb-1.5 block">Price/Hour (BKC)</label>
                        <input type="number" id="list-price" placeholder="10" step="0.01" min="0.01" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none">
                    </div>
                </div>
                <button id="confirm-list" class="r-btn r-btn-primary w-full py-3">
                    <i class="fa-solid fa-tag mr-2"></i>List NFT
                </button>
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
    
    // V12.3: Reset state when opening modal
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
    
    // V12.3: Reset button state
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
    // V12.3: Always reset state when closing modal
    RentalState.isTransactionPending = false;
    // Reset button state
    const btn = document.getElementById('confirm-rent');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Confirm';
        btn.disabled = false;
    }
}

function openListModal() {
    // V12.3: Reset state when opening modal
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
    
    // V12.3: Reset button state
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
    // V12.3: Always reset state when closing modal
    RentalState.isTransactionPending = false;
    // Reset button state
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
    
    try {
        // V12.5: Call contract directly
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const amountWei = ethers.parseEther(amountEth);
        
        // Minimal ABI for promoteListing
        const abi = ['function promoteListing(uint256 tokenId) payable'];
        const contract = new ethers.Contract(addresses.rentalManager, abi, signer);
        
        const tx = await contract.promoteListing(tokenId, { value: amountWei });
        console.log('[RentalPage] Promote TX submitted:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('[RentalPage] ✅ Promote confirmed in block:', receipt.blockNumber);
        
        RentalState.isTransactionPending = false;
        closePromoteModal();
        showToast('🚀 NFT Promoted Successfully!', 'success');
        await refreshData();
        
    } catch (err) {
        console.error('[RentalPage] handlePromote error:', err);
        RentalState.isTransactionPending = false;
        btn.innerHTML = '<i class="fa-solid fa-rocket mr-2"></i>Promote Now';
        btn.disabled = false;
        
        if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
            // User cancelled - don't show error
            return;
        }
        
        showToast('Failed: ' + (err.reason || err.message || 'Unknown error'), 'error');
    }
}

async function handleRent() {
    if (RentalState.isTransactionPending) return;
    const tokenId = RentalState.selectedRentalId;
    const listing = (State.rentalListings || []).find(l => tokenIdsMatch(l.tokenId, tokenId));
    if (!listing) return;
    
    const btn = document.getElementById('confirm-rent');
    RentalState.isTransactionPending = true;
    
    // V12.4: Don't change button before passing to txEngine
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
    
    const btn = document.getElementById('confirm-list');
    RentalState.isTransactionPending = true;
    
    // V12.4: Don't change button before passing to txEngine
    // Let txEngine manage the button state completely
    console.log('[RentalPage] Starting list transaction for tokenId:', tokenId);
    
    try {
        await RentalTx.list({
            tokenId,
            pricePerHour: ethers.parseUnits(price, 18),
            minHours: 1,
            maxHours: 168,
            button: btn, // txEngine will save original state and manage it
            onSuccess: async (receipt) => { 
                console.log('[RentalPage] ✅ List onSuccess called, hash:', receipt?.hash);
                RentalState.isTransactionPending = false;
                closeListModal(); 
                showToast('🏷️ NFT Listed Successfully!', 'success'); 
                try {
                    await refreshData();
                } catch (e) {
                    console.warn('[RentalPage] Refresh after list failed:', e);
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
    
    // V12.4: Don't change button before passing to txEngine
    console.log('[RentalPage] Starting withdraw transaction for tokenId:', tokenId);
    
    try {
        await RentalTx.withdraw({
            tokenId,
            button: btn,
            onSuccess: async (receipt) => { 
                console.log('[RentalPage] ✅ Withdraw onSuccess called, hash:', receipt?.hash);
                RentalState.isTransactionPending = false;
                
                // V12.5: Promotion is automatically cleared by contract on withdraw
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