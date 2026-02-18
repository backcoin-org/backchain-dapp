// js/pages/RentalPage.js
// ✅ PRODUCTION V2.0 - Boost Market (V2: Daily pricing + Boost promotion)
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                    Boost Market — NFT Rental Marketplace
// ═══════════════════════════════════════════════════════════════════════════════
//
// V9.0 Changes:
// - Rebranded: AirBNFT → Boost Market
// - ETH-only pricing (no BKC)
// - Removed spotlight/promote system (not in V9 contract)
// - Added withdrawEarnings() for pull-pattern owner payouts
// - Live rental cost preview (rental + ecosystem fee) via getRentalCost()
// - Removed fake 24h cooldown (not in V9 contract)
// - How It Works explainer section
// - Share listing via Web Share API
//
// ═══════════════════════════════════════════════════════════════════════════════

const ethers = window.ethers;
import { State } from '../state.js';
import { loadRentalListings, loadUserRentals, loadMyBoostersFromAPI } from '../modules/data.js';
import { formatBigNumber } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers, getKeepRateFromBoost } from '../config.js';
import { RentalTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";

// Tier configurations with colors, keep rates, and IPFS images
const TIER_CONFIG = {
    'Diamond': { emoji: '💎', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.3)', keepRate: 100, image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq' },
    'Gold':    { emoji: '🥇', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', keepRate: 90, image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44' },
    'Silver':  { emoji: '🥈', color: '#9ca3af', bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.3)', keepRate: 75, image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4' },
    'Bronze':  { emoji: '🥉', color: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.3)', keepRate: 60, image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m' }
};

// ============================================================================
// STATE
// ============================================================================

const RS = {
    activeTab: 'marketplace',
    filterTier: 'ALL',
    sortBy: 'boosted',
    selectedListing: null,
    isLoading: false,
    isTransactionPending: false,
    countdownIntervals: [],
    pendingEarningsAmount: 0n,
    marketStats: null
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

function formatEthPrice(wei) {
    if (!wei) return '0';
    const val = parseFloat(ethers.formatEther(BigInt(wei)));
    if (val === 0) return '0';
    if (val < 0.0001) return '<0.0001';
    if (val < 0.01) return val.toFixed(4);
    if (val < 1) return val.toFixed(3);
    return val.toFixed(2);
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

// ============================================================================
// STYLES
// ============================================================================

function injectStyles() {
    if (document.getElementById('boost-market-styles')) return;
    const style = document.createElement('style');
    style.id = 'boost-market-styles';
    style.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           V9.0 Boost Market Styles
           ═══════════════════════════════════════════════════════════════════ */

        @keyframes bm-float {
            0%, 100% { transform: translateY(0) rotate(-2deg); }
            50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes bm-card-in {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bm-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }

        .bm-float { animation: bm-float 4s ease-in-out infinite; }

        /* Main Cards */
        .bm-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }

        /* NFT Cards */
        .bm-nft-card {
            background: linear-gradient(165deg, rgba(24,24,27,0.98) 0%, rgba(15,15,17,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.4);
            border-radius: 20px;
            overflow: hidden;
            animation: bm-card-in 0.5s ease-out forwards;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bm-nft-card:hover {
            transform: translateY(-6px);
            border-color: rgba(34,197,94,0.4);
            box-shadow: 0 25px 50px -15px rgba(0,0,0,0.5), 0 0 30px -10px rgba(34,197,94,0.15);
        }
        .bm-nft-card.owned { border-color: rgba(59,130,246,0.3); }
        .bm-nft-card.rented-out { opacity: 0.7; }
        .bm-nft-card.rented-out:hover { transform: none; }

        /* Tier Badge */
        .bm-tier-badge {
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
        .bm-tab {
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
        .bm-tab:hover:not(.active) {
            color: #a1a1aa;
            background: rgba(63,63,70,0.3);
        }
        .bm-tab.active {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #000;
            box-shadow: 0 4px 20px rgba(34,197,94,0.35);
        }
        .bm-tab .tab-count {
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
        .bm-filter {
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
        .bm-filter:hover:not(.active) {
            color: #fff;
            background: rgba(63,63,70,0.7);
        }
        .bm-filter.active {
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border-color: rgba(34,197,94,0.3);
        }

        /* Buttons */
        .bm-btn-primary {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #fff;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .bm-btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(34,197,94,0.4);
        }
        .bm-btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .bm-btn-secondary {
            background: rgba(63,63,70,0.8);
            color: #a1a1aa;
            font-weight: 600;
            border: 1px solid rgba(63,63,70,0.8);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .bm-btn-secondary:hover {
            background: rgba(63,63,70,1);
            color: #fff;
        }

        .bm-btn-danger {
            background: rgba(239,68,68,0.15);
            color: #f87171;
            font-weight: 600;
            border: 1px solid rgba(239,68,68,0.3);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .bm-btn-danger:hover {
            background: rgba(239,68,68,0.25);
        }

        .bm-btn-amber {
            background: rgba(251,191,36,0.15);
            color: #fbbf24;
            font-weight: 600;
            border: 1px solid rgba(251,191,36,0.3);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .bm-btn-amber:hover {
            background: rgba(251,191,36,0.25);
        }

        /* Timer */
        .bm-timer {
            font-family: 'SF Mono', 'Roboto Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 12px;
            border-radius: 8px;
        }
        .bm-timer.active {
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border: 1px solid rgba(34,197,94,0.25);
        }
        .bm-timer.warning {
            background: rgba(245,158,11,0.15);
            color: #f59e0b;
            border: 1px solid rgba(245,158,11,0.25);
        }
        .bm-timer.critical {
            background: rgba(239,68,68,0.15);
            color: #ef4444;
            border: 1px solid rgba(239,68,68,0.25);
            animation: bm-pulse 1s infinite;
        }

        /* Modal */
        .bm-modal {
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
        .bm-modal.active { display: flex; }
        .bm-modal-content {
            background: linear-gradient(145deg, rgba(39,39,42,0.98) 0%, rgba(24,24,27,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            width: 100%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
        }

        /* Empty State */
        .bm-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
        }

        /* How It Works Steps */
        .bm-step {
            display: flex;
            align-items: flex-start;
            gap: 16px;
        }
        .bm-step-num {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 14px;
            flex-shrink: 0;
        }

        /* Boost badge */
        .bm-boost-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 700;
            background: rgba(251,146,60,0.15);
            color: #fb923c;
            border: 1px solid rgba(251,146,60,0.3);
        }
        .bm-nft-card.boosted {
            border-color: rgba(251,146,60,0.4);
            box-shadow: 0 0 20px -5px rgba(251,146,60,0.15);
        }

        /* Boost inline panel */
        .bm-boost-panel {
            background: rgba(251,146,60,0.06);
            border: 1px solid rgba(251,146,60,0.2);
            border-radius: 12px;
            padding: 12px;
        }

        /* Rented overlay */
        .bm-rented-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.7);
            border-radius: inherit;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .bm-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .bm-nft-grid { grid-template-columns: 1fr !important; }
            .bm-how-grid { grid-template-columns: 1fr !important; }
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
    const stats = RS.marketStats;

    container.innerHTML = `
        <div class="max-w-6xl mx-auto px-4 py-6">

            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 flex items-center justify-center bm-float">
                        <i class="fa-solid fa-rocket text-2xl text-emerald-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Boost Market</h1>
                        <p class="text-sm text-zinc-500">Rent NFT Boosters. Keep more rewards.</p>
                    </div>
                </div>
                <div id="bm-header-actions">
                    ${!State.isConnected ? `
                        <button onclick="window.openConnectModal && window.openConnectModal()"
                            class="bm-btn-primary px-6 py-2.5 text-sm">
                            <i class="fa-solid fa-wallet mr-2"></i>Connect
                        </button>
                    ` : `
                        <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span class="text-emerald-400 text-sm font-medium">Connected</span>
                        </div>
                    `}
                </div>
            </div>

            <!-- How It Works -->
            <div class="bm-card p-5 mb-6" style="border-color: rgba(34,197,94,0.15);">
                <div class="flex items-center gap-2 mb-4">
                    <i class="fa-solid fa-circle-info text-emerald-400 text-sm"></i>
                    <h3 class="text-sm font-bold text-white">How It Works</h3>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bm-how-grid">
                    <div class="bm-step">
                        <div class="bm-step-num bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">1</div>
                        <div>
                            <p class="text-sm font-bold text-white">List</p>
                            <p class="text-xs text-zinc-500">Owners list NFTs with daily BNB price</p>
                        </div>
                    </div>
                    <div class="bm-step">
                        <div class="bm-step-num bg-blue-500/15 text-blue-400 border border-blue-500/25">2</div>
                        <div>
                            <p class="text-sm font-bold text-white">Rent</p>
                            <p class="text-xs text-zinc-500">Tenants rent to reduce burn rate on staking claims</p>
                        </div>
                    </div>
                    <div class="bm-step">
                        <div class="bm-step-num bg-amber-500/15 text-amber-400 border border-amber-500/25">3</div>
                        <div>
                            <p class="text-sm font-bold text-white">Earn</p>
                            <p class="text-xs text-zinc-500">Owners withdraw accumulated BNB earnings anytime</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bm-stats-grid">
                <div class="bm-card p-4 text-center">
                    <p class="text-2xl font-bold text-emerald-400 font-mono">${listings.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Listed</p>
                </div>
                <div class="bm-card p-4 text-center">
                    <p class="text-2xl font-bold text-blue-400 font-mono">${listings.filter(l => l.isRented || l.currentlyRented).length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Rented</p>
                </div>
                <div class="bm-card p-4 text-center">
                    <p class="text-2xl font-bold text-amber-400 font-mono">${stats ? stats.totalRentals : '—'}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Total Rentals</p>
                </div>
                <div class="bm-card p-4 text-center">
                    <p class="text-2xl font-bold text-purple-400 font-mono"><i class="fa-brands fa-ethereum text-lg mr-1"></i>${stats ? formatEthPrice(stats.totalVolume) : '—'}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Volume (BNB)</p>
                </div>
            </div>

            <!-- Tabs -->
            <div class="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-zinc-800/50">
                <button class="bm-tab ${RS.activeTab === 'marketplace' ? 'active' : ''}" data-tab="marketplace">
                    <i class="fa-solid fa-store mr-2"></i>Marketplace
                </button>
                <button class="bm-tab ${RS.activeTab === 'my-listings' ? 'active' : ''}" data-tab="my-listings">
                    <i class="fa-solid fa-tags mr-2"></i>My Listings
                    <span class="tab-count">${myListings.length}</span>
                </button>
                <button class="bm-tab ${RS.activeTab === 'my-rentals' ? 'active' : ''}" data-tab="my-rentals">
                    <i class="fa-solid fa-clock-rotate-left mr-2"></i>My Rentals
                    <span class="tab-count">${activeRentals.length}</span>
                </button>
            </div>

            <!-- Tab Content -->
            <div id="bm-tab-content"></div>
        </div>

        <!-- Modals -->
        ${renderListModal()}
        ${renderRentModal()}
        ${renderBoostModal()}
    `;

    attachEventListeners();
    renderTabContent();
}

function renderTabContent() {
    const el = document.getElementById('bm-tab-content');
    if (!el) return;

    switch (RS.activeTab) {
        case 'marketplace': el.innerHTML = renderMarketplace(); break;
        case 'my-listings': el.innerHTML = renderMyListings(); break;
        case 'my-rentals': el.innerHTML = renderMyRentals(); break;
    }

    if (RS.activeTab === 'my-rentals') startTimers();
}

// ============================================================================
// MARKETPLACE TAB
// ============================================================================

function renderMarketplace() {
    const listings = State.rentalListings || [];
    const now = Math.floor(Date.now() / 1000);

    let available = listings.filter(l => {
        const isRented = l.isRented || l.currentlyRented || (l.rentalEndTime && Number(l.rentalEndTime) > now);
        if (isRented) return false;
        if (RS.filterTier !== 'ALL' && getTierInfo(l.boostBips).name !== RS.filterTier) return false;
        return true;
    });

    // Sort
    available.sort((a, b) => {
        if (RS.sortBy === 'boosted') {
            // Boosted listings first, then by boost expiry (longest remaining first), then by tier
            if (a.isBoosted && !b.isBoosted) return -1;
            if (!a.isBoosted && b.isBoosted) return 1;
            if (a.isBoosted && b.isBoosted) return (b.boostExpiry || 0) - (a.boostExpiry || 0);
            return (b.boostBips || 0) - (a.boostBips || 0);
        }
        const pa = BigInt(a.pricePerDay || 0), pb = BigInt(b.pricePerDay || 0);
        if (RS.sortBy === 'price-low') return pa < pb ? -1 : pa > pb ? 1 : 0;
        if (RS.sortBy === 'price-high') return pa > pb ? -1 : pa < pb ? 1 : 0;
        // Default: boost-high (best tier first)
        return (b.boostBips || 0) - (a.boostBips || 0);
    });

    return `
        <div>
            <!-- Filters & Sort -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div class="flex flex-wrap gap-2">
                    <button class="bm-filter ${RS.filterTier === 'ALL' ? 'active' : ''}" data-filter="ALL">All Tiers</button>
                    ${Object.keys(TIER_CONFIG).map(tier => `
                        <button class="bm-filter ${RS.filterTier === tier ? 'active' : ''}" data-filter="${tier}">
                            ${TIER_CONFIG[tier].emoji} ${tier}
                        </button>
                    `).join('')}
                </div>
                <div class="flex items-center gap-3">
                    <select id="bm-sort" class="bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none cursor-pointer">
                        <option value="boosted" ${RS.sortBy === 'boosted' ? 'selected' : ''}>Promoted First</option>
                        <option value="boost-high" ${RS.sortBy === 'boost-high' ? 'selected' : ''}>Best Boost First</option>
                        <option value="price-low" ${RS.sortBy === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
                        <option value="price-high" ${RS.sortBy === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
                    </select>
                    ${State.isConnected ? `
                        <button id="bm-open-list" class="bm-btn-primary px-5 py-2.5 text-sm">
                            <i class="fa-solid fa-plus mr-2"></i>List NFT
                        </button>
                    ` : ''}
                </div>
            </div>

            <!-- NFT Grid -->
            ${available.length === 0 ? renderEmpty('No NFTs Available', 'Be the first to list your NFT booster!') : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 bm-nft-grid">
                    ${available.map((l, i) => renderNFTCard(l, i, false)).join('')}
                </div>
            `}
        </div>
    `;
}

function renderNFTCard(listing, idx, showOwnerActions = false) {
    const tier = getTierInfo(listing.boostBips);
    const config = getTierConfig(tier.name);
    const price = formatEthPrice(listing.pricePerDay);
    const tokenId = normalizeTokenId(listing.tokenId);
    const isOwner = State.isConnected && addressesMatch(listing.owner, State.userAddress);
    const isRented = listing.isRented || listing.currentlyRented;
    const keepRate = getKeepRateFromBoost(listing.boostBips || 0);
    const isBoosted = listing.isBoosted;
    const boostDaysLeft = isBoosted ? Math.max(0, Math.ceil((listing.boostExpiry - Math.floor(Date.now() / 1000)) / 86400)) : 0;

    return `
        <div class="bm-nft-card ${isOwner ? 'owned' : ''} ${isRented ? 'rented-out' : ''} ${isBoosted ? 'boosted' : ''}"
             style="animation-delay:${idx * 60}ms">

            <!-- Header -->
            <div class="flex items-center justify-between p-4 pb-0">
                <div class="bm-tier-badge" style="background:${config.bg};color:${config.color};border:1px solid ${config.border}">
                    ${config.emoji} ${tier.name}
                </div>
                <div class="flex items-center gap-2">
                    ${isBoosted ? `<span class="bm-boost-badge"><i class="fa-solid fa-fire"></i> ${boostDaysLeft}d</span>` : ''}
                    <span class="text-sm font-bold font-mono" style="color:${config.color}">
                        Keep ${keepRate}%
                    </span>
                </div>
            </div>

            <!-- NFT Display -->
            <div class="relative aspect-square flex items-center justify-center p-6">
                <div class="absolute inset-0 rounded-2xl opacity-50"
                     style="background: radial-gradient(circle at center, ${config.color}15 0%, transparent 70%);"></div>
                <img src="${config.image}" alt="${tier.name} Booster"
                     class="w-4/5 h-4/5 object-contain bm-float rounded-xl"
                     onerror="this.outerHTML='<div class=\\'text-7xl bm-float\\'>${config.emoji}</div>'">

                ${isOwner ? `
                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                        <i class="fa-solid fa-user mr-1"></i>YOURS
                    </div>
                ` : ''}

                ${isRented && !isOwner ? `
                    <div class="bm-rented-overlay">
                        <i class="fa-solid fa-lock text-3xl text-zinc-400 mb-2"></i>
                        <span class="text-xs text-zinc-300 font-semibold">Currently Rented</span>
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
                    ${keepRate === 100 ? 'Keep 100% of your staking rewards!' : `Save ${keepRate - 50}% on claim burns`}
                </p>

                <div class="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-4"></div>

                <!-- Price & Actions -->
                <div class="flex items-end justify-between">
                    <div>
                        <span class="text-[10px] text-zinc-500 uppercase block mb-1">Price/Day</span>
                        <div class="flex items-baseline gap-1.5">
                            <i class="fa-brands fa-ethereum text-blue-400 text-sm"></i>
                            <span class="text-xl font-bold text-white">${price}</span>
                            <span class="text-xs text-zinc-500">BNB</span>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        ${isOwner ? `
                            <button class="bm-boost-btn bm-btn-amber px-3 py-2 text-xs" data-id="${tokenId}" title="Boost listing">
                                <i class="fa-solid fa-fire mr-1"></i>${isBoosted ? 'Extend' : 'Boost'}
                            </button>
                            <button class="bm-share-btn bm-btn-secondary px-3 py-2 text-xs" data-id="${tokenId}" title="Share listing">
                                <i class="fa-solid fa-share-nodes"></i>
                            </button>
                            <button class="bm-withdraw-btn bm-btn-danger px-3 py-2 text-xs" data-id="${tokenId}" ${isRented ? 'disabled' : ''}>
                                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                            </button>
                        ` : `
                            <button class="bm-rent-btn bm-btn-primary px-5 py-2.5 text-sm" data-id="${tokenId}" ${isRented ? 'disabled' : ''}>
                                <i class="fa-solid fa-bolt mr-1"></i>Rent 1 Day
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
    const totalEarnings = mine.reduce((s, l) => s + BigInt(l.totalEarnings || 0), 0n);

    return `
        <div>
            <!-- Earnings Card -->
            <div class="bm-card p-6 mb-6" style="border-color: rgba(34,197,94,0.2);">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/25">
                            <i class="fa-solid fa-sack-dollar text-emerald-400 text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-zinc-400">Total Lifetime Earnings</p>
                            <p class="text-3xl font-bold text-white">
                                <i class="fa-brands fa-ethereum text-blue-400 text-2xl mr-1"></i>${formatEthPrice(totalEarnings)} <span class="text-lg text-zinc-500">BNB</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-3 items-center">
                        <!-- Pending Earnings -->
                        <div class="bm-card p-4 text-center min-w-[120px]" style="border-color: rgba(251,191,36,0.2);">
                            <p class="text-xl font-bold text-amber-400 font-mono" id="bm-pending-amount">
                                ${RS.pendingEarningsAmount > 0n ? formatEthPrice(RS.pendingEarningsAmount) : '0'}
                            </p>
                            <p class="text-[10px] text-zinc-500 uppercase">Pending BNB</p>
                        </div>
                        <button id="bm-withdraw-earnings" class="bm-btn-amber px-5 py-3 text-sm"
                                ${RS.pendingEarningsAmount === 0n ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>
                            <i class="fa-solid fa-coins mr-2"></i>Withdraw Earnings
                        </button>
                        <div class="bm-card p-4 text-center min-w-[80px]">
                            <p class="text-xl font-bold text-white">${mine.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Listed</p>
                        </div>
                        <div class="bm-card p-4 text-center min-w-[80px]">
                            <p class="text-xl font-bold text-white">${canList.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Available</p>
                        </div>
                        <button id="bm-open-list" class="bm-btn-primary px-6 py-3" ${canList.length === 0 ? 'disabled' : ''}>
                            <i class="fa-solid fa-plus mr-2"></i>List
                        </button>
                    </div>
                </div>
            </div>

            <!-- My Listed NFTs -->
            ${mine.length === 0 ? renderEmpty('No Listings Yet', 'List your first NFT to start earning BNB!') : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 bm-nft-grid">
                    ${mine.map((l, i) => renderNFTCard(l, i, true)).join('')}
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
            <!-- Tier Info -->
            <div class="bm-card p-5 mb-6" style="border-color: rgba(34,197,94,0.15);">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-shield-halved text-emerald-400"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-white mb-1">Boost Tiers</h3>
                        <p class="text-xs text-zinc-400">
                            Diamond = Keep 100% | Gold = 90% | Silver = 75% | Bronze = 60% — Without NFT: 50% burned.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Active Rentals -->
            ${rentals.length === 0 ? renderEmpty('No Active Rentals', 'Rent an NFT booster to keep more staking rewards!') : `
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
        <div class="bm-card p-5" style="animation: bm-card-in 0.5s ease-out ${idx * 60}ms forwards; opacity: 0;">
            <div class="flex items-center justify-between mb-4">
                <div class="bm-tier-badge" style="background:${config.bg};color:${config.color};border:1px solid ${config.border}">
                    ${config.emoji} ${tier.name}
                </div>
                <div class="bm-timer ${timerClass}" data-end="${rental.endTime}">
                    <i class="fa-solid fa-clock mr-1"></i>${time.text}
                </div>
            </div>

            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
                     style="background:${config.bg}">
                    <img src="${config.image}" alt="${tier.name}" class="w-full h-full object-contain"
                         onerror="this.outerHTML='<span class=\\'text-4xl\\'>${config.emoji}</span>'">
                </div>
                <div>
                    <h3 class="text-lg font-bold text-white">${tier.name} Booster</h3>
                    <p class="text-xs text-zinc-500">Token #${normalizeTokenId(rental.tokenId)}</p>
                </div>
            </div>

            <div class="p-3 rounded-xl ${keepRate === 100 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-800/50'}">
                <p class="text-sm ${keepRate === 100 ? 'text-emerald-400' : 'text-zinc-300'}">
                    <i class="fa-solid fa-shield-halved mr-2"></i>
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
        <div class="bm-modal" id="bm-modal-list">
            <div class="bm-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-tag text-emerald-400"></i>List NFT for Rent
                    </h3>
                    <button class="bm-close-list text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-5 space-y-5">
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Select NFT</label>
                        <select id="bm-list-select" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none">
                            <option value="">-- Select an NFT --</option>
                            ${available.map(b => {
                                const tier = getTierInfo(b.boostBips);
                                const config = getTierConfig(tier.name);
                                return `<option value="${b.tokenId}">${config.emoji} ${tier.name} Booster #${b.tokenId}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Price per Day (BNB)</label>
                        <input type="number" id="bm-list-price" min="0.0001" step="0.0001" placeholder="0.005"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
                        <p class="text-[10px] text-zinc-600 mt-2">Fixed 1-day rental. NFT auto re-lists after each rental.</p>
                    </div>
                </div>
                <div class="flex gap-3 p-5 pt-0">
                    <button class="bm-close-list bm-btn-secondary flex-1 py-3">Cancel</button>
                    <button id="bm-confirm-list" class="bm-btn-primary flex-1 py-3">
                        <i class="fa-solid fa-check mr-2"></i>List NFT
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderRentModal() {
    return `
        <div class="bm-modal" id="bm-modal-rent">
            <div class="bm-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bolt text-emerald-400"></i>Rent Booster
                    </h3>
                    <button class="bm-close-rent text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="bm-rent-modal-body" class="p-5">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>
    `;
}

function renderBoostModal() {
    return `
        <div class="bm-modal" id="bm-modal-boost">
            <div class="bm-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-fire text-amber-400"></i>Boost Listing
                    </h3>
                    <button class="bm-close-boost text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="bm-boost-modal-body" class="p-5">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>
    `;
}

function openBoostModal(tokenId) {
    const listing = (State.rentalListings || []).find(l => tokenIdsMatch(l.tokenId, tokenId));
    if (!listing) return;

    RS.selectedListing = listing;
    const tier = getTierInfo(listing.boostBips);
    const config = getTierConfig(tier.name);
    const isBoosted = listing.isBoosted;
    const boostDaysLeft = isBoosted ? Math.max(0, Math.ceil((listing.boostExpiry - Math.floor(Date.now() / 1000)) / 86400)) : 0;

    const body = document.getElementById('bm-boost-modal-body');
    if (!body) return;

    body.innerHTML = `
        <div class="flex items-center gap-4 mb-5 p-4 rounded-xl" style="background:${config.bg}">
            <img src="${config.image}" alt="${tier.name}" class="w-14 h-14 object-contain rounded-lg"
                 onerror="this.outerHTML='<div class=\\'text-4xl\\'>${config.emoji}</div>'">
            <div>
                <h3 class="text-base font-bold text-white">${tier.name} Booster #${tokenId}</h3>
                ${isBoosted
                    ? `<p class="text-xs text-amber-400"><i class="fa-solid fa-fire mr-1"></i>Boosted — ${boostDaysLeft} days remaining</p>`
                    : `<p class="text-xs text-zinc-500">Not boosted</p>`
                }
            </div>
        </div>

        <div class="mb-5">
            <p class="text-sm text-zinc-400 mb-4">
                Boosted listings appear first in the marketplace. Choose how many days to boost.
                ${isBoosted ? 'New days will extend from current expiry.' : ''}
            </p>
            <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Boost Duration (days)</label>
            <input type="range" id="bm-boost-days" min="1" max="90" value="30"
                class="w-full accent-amber-500 cursor-pointer">
            <div class="flex justify-between text-xs text-zinc-500 mt-1">
                <span>1 day</span>
                <span id="bm-boost-days-label" class="text-amber-400 font-bold">30 days</span>
                <span>90 days</span>
            </div>
        </div>

        <div id="bm-boost-cost" class="bm-boost-panel mb-5">
            <div class="flex justify-between text-sm mb-2">
                <span class="text-zinc-500">Cost per day</span>
                <span class="text-zinc-300 font-mono" id="bm-boost-cost-day">Calculating...</span>
            </div>
            <div class="h-px bg-amber-500/20 my-2"></div>
            <div class="flex justify-between text-sm">
                <span class="text-amber-400 font-bold">Total Cost</span>
                <span class="text-lg font-bold text-amber-400 font-mono" id="bm-boost-cost-total">—</span>
            </div>
        </div>

        <div class="flex gap-3">
            <button class="bm-close-boost bm-btn-secondary flex-1 py-3">Cancel</button>
            <button id="bm-confirm-boost" class="bm-btn-amber flex-1 py-3" data-id="${tokenId}">
                <i class="fa-solid fa-fire mr-2"></i>${isBoosted ? 'Extend Boost' : 'Boost Now'}
            </button>
        </div>
    `;

    const slider = document.getElementById('bm-boost-days');
    const daysLabel = document.getElementById('bm-boost-days-label');

    const updateBoostCost = async () => {
        const days = parseInt(slider.value) || 1;
        daysLabel.textContent = `${days} day${days > 1 ? 's' : ''}`;

        try {
            const cost = await RentalTx.getBoostCost(days);
            document.getElementById('bm-boost-cost-day').innerHTML = `<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${cost.feePerDayFormatted} BNB`;
            document.getElementById('bm-boost-cost-total').innerHTML = `<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${cost.totalFeeFormatted} BNB`;
        } catch {
            document.getElementById('bm-boost-cost-day').textContent = 'Error';
            document.getElementById('bm-boost-cost-total').textContent = 'Error';
        }
    };

    updateBoostCost();
    slider.addEventListener('input', updateBoostCost);

    document.getElementById('bm-modal-boost').classList.add('active');
}

function closeBoostModal() {
    const modal = document.getElementById('bm-modal-boost');
    if (modal) modal.classList.remove('active');
    RS.selectedListing = null;
}

async function handleBoost() {
    if (RS.isTransactionPending || !RS.selectedListing) return;

    const tokenId = normalizeTokenId(RS.selectedListing.tokenId);
    const days = parseInt(document.getElementById('bm-boost-days').value) || 1;
    const btn = document.getElementById('bm-confirm-boost');

    RS.isTransactionPending = true;

    try {
        await RentalTx.boostListing({
            tokenId,
            days,
            button: btn,
            onSuccess: async () => {
                RS.isTransactionPending = false;
                closeBoostModal();
                showToast(`Listing boosted for ${days} days!`, 'success');
                await refreshData();
            },
            onError: (e) => {
                RS.isTransactionPending = false;
                if (!e.cancelled && e.type !== 'user_rejected') {
                    showToast('Boost failed: ' + (e.message || 'Error'), 'error');
                }
            }
        });
    } catch (err) {
        RS.isTransactionPending = false;
        if (!err.cancelled && err.type !== 'user_rejected') {
            showToast('Boost failed: ' + (err.message || 'Error'), 'error');
        }
    }
}

// ============================================================================
// HELPER RENDERS
// ============================================================================

function renderEmpty(title, subtitle) {
    return `
        <div class="bm-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-rocket text-3xl text-zinc-600"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">${title}</h3>
            <p class="text-sm text-zinc-500">${subtitle}</p>
        </div>
    `;
}

function renderConnectPrompt(action) {
    return `
        <div class="bm-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-3xl text-zinc-500"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Connect Wallet</h3>
            <p class="text-sm text-zinc-500 mb-4">${action}</p>
            <button onclick="window.openConnectModal && window.openConnectModal()" class="bm-btn-primary px-8 py-3">
                <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
            </button>
        </div>
    `;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

let bmClickHandler = null;
let bmChangeHandler = null;

function attachEventListeners() {
    // Remove old listeners if any
    if (bmClickHandler) document.removeEventListener('click', bmClickHandler);
    if (bmChangeHandler) document.removeEventListener('change', bmChangeHandler);

    bmClickHandler = (e) => {
        const target = e.target;

        // Tab clicks
        const tab = target.closest('.bm-tab');
        if (tab) {
            RS.activeTab = tab.dataset.tab;
            document.querySelectorAll('.bm-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTabContent();
            return;
        }

        // Filter clicks
        const chip = target.closest('.bm-filter');
        if (chip) {
            RS.filterTier = chip.dataset.filter;
            renderTabContent();
            return;
        }

        // Open list modal
        if (target.closest('#bm-open-list')) {
            openListModal();
            return;
        }

        // Close list modal
        if (target.closest('.bm-close-list')) {
            closeListModal();
            return;
        }

        // Close rent modal
        if (target.closest('.bm-close-rent')) {
            closeRentModal();
            return;
        }

        // Confirm list
        if (target.closest('#bm-confirm-list')) {
            handleList();
            return;
        }

        // Confirm rent
        if (target.closest('#bm-confirm-rent')) {
            handleRent();
            return;
        }

        // Confirm boost
        if (target.closest('#bm-confirm-boost')) {
            handleBoost();
            return;
        }

        // Close boost modal
        if (target.closest('.bm-close-boost')) {
            closeBoostModal();
            return;
        }

        // Boost button on card
        const boostBtn = target.closest('.bm-boost-btn');
        if (boostBtn) {
            openBoostModal(boostBtn.dataset.id);
            return;
        }

        // Rent button
        const rentBtn = target.closest('.bm-rent-btn');
        if (rentBtn && !rentBtn.disabled) {
            openRentModal(rentBtn.dataset.id);
            return;
        }

        // Withdraw NFT button
        const withdrawBtn = target.closest('.bm-withdraw-btn');
        if (withdrawBtn && !withdrawBtn.disabled) {
            handleWithdrawNft(withdrawBtn);
            return;
        }

        // Share button
        const shareBtn = target.closest('.bm-share-btn');
        if (shareBtn) {
            shareListing(shareBtn.dataset.id);
            return;
        }

        // Withdraw earnings button
        if (target.closest('#bm-withdraw-earnings')) {
            handleWithdrawEarnings();
            return;
        }

        // Click outside modal to close
        if (target.classList.contains('bm-modal')) {
            target.classList.remove('active');
            RS.selectedListing = null;
            return;
        }
    };

    bmChangeHandler = (e) => {
        if (e.target.id === 'bm-sort') {
            RS.sortBy = e.target.value;
            renderTabContent();
        }
    };

    document.addEventListener('click', bmClickHandler);
    document.addEventListener('change', bmChangeHandler);
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

function openListModal() {
    const modal = document.getElementById('bm-modal-list');
    if (modal) modal.classList.add('active');
}

function closeListModal() {
    const modal = document.getElementById('bm-modal-list');
    if (modal) modal.classList.remove('active');
}

function openRentModal(tokenId) {
    const listing = (State.rentalListings || []).find(l => tokenIdsMatch(l.tokenId, tokenId));
    if (!listing) return;

    RS.selectedListing = listing;
    const tier = getTierInfo(listing.boostBips);
    const config = getTierConfig(tier.name);
    const price = formatEthPrice(listing.pricePerDay);
    const keepRate = getKeepRateFromBoost(listing.boostBips || 0);

    const body = document.getElementById('bm-rent-modal-body');
    if (!body) return;

    body.innerHTML = `
        <div class="flex items-center gap-4 mb-5 p-4 rounded-xl" style="background:${config.bg}">
            <img src="${config.image}" alt="${tier.name}" class="w-16 h-16 object-contain rounded-lg"
                 onerror="this.outerHTML='<div class=\\'text-5xl\\'>${config.emoji}</div>'">
            <div>
                <h3 class="text-lg font-bold text-white">${tier.name} Booster #${tokenId}</h3>
                <p class="text-sm" style="color:${config.color}">Keep ${keepRate}% of rewards</p>
            </div>
        </div>

        <div class="space-y-4 mb-5">
            <div class="flex justify-between text-sm">
                <span class="text-zinc-500">Duration</span>
                <span class="text-white font-bold">1 Day (24 hours)</span>
            </div>
            <div id="bm-rent-cost" class="p-4 rounded-xl bg-zinc-800/50 space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-zinc-500">Rental Cost</span>
                    <span class="text-white font-mono" id="bm-cost-rental"><i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>Calculating...</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-zinc-500">Ecosystem Fee (20%)</span>
                    <span class="text-zinc-400 font-mono" id="bm-cost-fee">—</span>
                </div>
                <div class="h-px bg-zinc-700 my-1"></div>
                <div class="flex justify-between text-sm">
                    <span class="text-zinc-400 font-bold">Total</span>
                    <span class="text-xl font-bold text-emerald-400 font-mono" id="bm-cost-total">—</span>
                </div>
            </div>
            <div id="bm-balance-warn" class="hidden p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <p class="text-xs text-red-400" id="bm-balance-warn-text"></p>
            </div>
        </div>

        <div class="flex gap-3">
            <button class="bm-close-rent bm-btn-secondary flex-1 py-3">Cancel</button>
            <button id="bm-confirm-rent" class="bm-btn-primary flex-1 py-3">
                <i class="fa-solid fa-bolt mr-2"></i>Rent 1 Day
            </button>
        </div>
    `;

    // Calculate cost on load + check balance (fixed 1-day, no hours input)
    const rentBtn = document.getElementById('bm-confirm-rent');
    const balanceWarn = document.getElementById('bm-balance-warn');
    const balanceWarnText = document.getElementById('bm-balance-warn-text');

    const updateCost = async () => {
        let totalCost = 0n;

        try {
            const cost = await RentalTx.getRentalCost(tokenId);
            totalCost = cost.totalCost;
            document.getElementById('bm-cost-rental').innerHTML = `<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${cost.rentalCostFormatted} BNB`;
            document.getElementById('bm-cost-fee').innerHTML = `<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${cost.ethFeeFormatted} BNB`;
            document.getElementById('bm-cost-total').innerHTML = `<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${cost.totalCostFormatted} BNB`;
        } catch (err) {
            const simple = BigInt(listing.pricePerDay || 0);
            totalCost = simple;
            document.getElementById('bm-cost-rental').innerHTML = `<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${formatEthPrice(simple)} BNB`;
            document.getElementById('bm-cost-fee').textContent = '~fee';
            document.getElementById('bm-cost-total').innerHTML = `<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>~${formatEthPrice(simple)} BNB`;
        }

        if (State.isConnected && totalCost > 0n) {
            try {
                const { NetworkManager } = await import('../modules/core/index.js');
                const ethBalance = await NetworkManager.getProvider().getBalance(State.userAddress);
                const needed = totalCost + ethers.parseEther('0.001');

                if (ethBalance < needed) {
                    const deficit = formatEthPrice(needed - ethBalance);
                    rentBtn.disabled = true;
                    rentBtn.className = 'flex-1 py-3 rounded-xl font-bold text-sm border border-red-500/30 bg-red-500/10 text-red-400 cursor-not-allowed';
                    rentBtn.innerHTML = `<i class="fa-brands fa-ethereum mr-1"></i>Need ${formatEthPrice(needed)} BNB`;
                    balanceWarn.classList.remove('hidden');
                    balanceWarnText.textContent = `Your balance: ${formatEthPrice(ethBalance)} BNB — need ${deficit} more BNB`;
                } else {
                    rentBtn.disabled = false;
                    rentBtn.className = 'bm-btn-primary flex-1 py-3';
                    rentBtn.innerHTML = '<i class="fa-solid fa-bolt mr-2"></i>Rent 1 Day';
                    balanceWarn.classList.add('hidden');
                }
            } catch {
                rentBtn.disabled = false;
                rentBtn.className = 'bm-btn-primary flex-1 py-3';
                rentBtn.innerHTML = '<i class="fa-solid fa-bolt mr-2"></i>Rent 1 Day';
                balanceWarn.classList.add('hidden');
            }
        }
    };

    updateCost();

    document.getElementById('bm-modal-rent').classList.add('active');
}

function closeRentModal() {
    const modal = document.getElementById('bm-modal-rent');
    if (modal) modal.classList.remove('active');
    RS.selectedListing = null;
}

// ============================================================================
// TRANSACTION HANDLERS
// ============================================================================

async function handleRent() {
    if (RS.isTransactionPending || !RS.selectedListing) return;

    const tokenId = normalizeTokenId(RS.selectedListing.tokenId);
    const btn = document.getElementById('bm-confirm-rent');

    RS.isTransactionPending = true;

    try {
        await RentalTx.rent({
            tokenId,
            button: btn,
            onSuccess: async () => {
                RS.isTransactionPending = false;
                closeRentModal();
                showToast('NFT Rented Successfully!', 'success');
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

    const tokenId = document.getElementById('bm-list-select').value;
    const price = document.getElementById('bm-list-price').value;

    if (!tokenId) { showToast('Select an NFT', 'error'); return; }
    if (!price || parseFloat(price) <= 0) { showToast('Enter valid price', 'error'); return; }

    const btn = document.getElementById('bm-confirm-list');
    RS.isTransactionPending = true;

    try {
        await RentalTx.list({
            tokenId,
            pricePerDay: ethers.parseEther(price),
            button: btn,
            onSuccess: async () => {
                RS.isTransactionPending = false;
                closeListModal();
                showToast('NFT Listed Successfully!', 'success');
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

async function handleWithdrawNft(btn) {
    if (RS.isTransactionPending) return;

    const tokenId = btn.dataset.id;
    if (!confirm('Withdraw this NFT from the marketplace?')) return;

    RS.isTransactionPending = true;

    try {
        await RentalTx.withdraw({
            tokenId,
            button: btn,
            onSuccess: async () => {
                RS.isTransactionPending = false;
                showToast('NFT Withdrawn Successfully!', 'success');
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

async function handleWithdrawEarnings() {
    if (RS.isTransactionPending || RS.pendingEarningsAmount === 0n) return;

    const btn = document.getElementById('bm-withdraw-earnings');
    RS.isTransactionPending = true;

    try {
        await RentalTx.withdrawEarnings({
            button: btn,
            onSuccess: async () => {
                RS.isTransactionPending = false;
                RS.pendingEarningsAmount = 0n;
                showToast('Earnings Withdrawn!', 'success');
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
// SHARE
// ============================================================================

function shareListing(tokenId) {
    const url = `https://backcoin.org/#rental`;
    const text = `Rent NFT Boosters on Backchain Boost Market!\n\nKeep up to 100% of your staking rewards by renting an NFT booster.\n\n${url}\n\n#Backchain #DeFi #Arbitrum #Web3`;

    if (navigator.share) {
        navigator.share({ title: 'Backchain Boost Market', text, url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Link copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Could not copy link', 'error');
        });
    }
}

// ============================================================================
// TIMERS
// ============================================================================

function startTimers() {
    RS.countdownIntervals.forEach(clearInterval);
    RS.countdownIntervals = [];

    document.querySelectorAll('.bm-timer[data-end]').forEach(el => {
        const endTime = Number(el.dataset.end);
        const interval = setInterval(() => {
            const time = formatTimeRemaining(endTime);
            el.innerHTML = `<i class="fa-solid fa-clock mr-1"></i>${time.text}`;

            if (time.expired) {
                clearInterval(interval);
                renderTabContent();
            } else if (time.seconds < 3600) {
                el.className = 'bm-timer critical';
            } else if (time.seconds < 7200) {
                el.className = 'bm-timer warning';
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
        const promises = [loadRentalListings()];
        if (State.isConnected) {
            promises.push(loadUserRentals());
            promises.push(loadMyBoostersFromAPI());
            promises.push(loadPendingEarnings());
        }
        promises.push(loadMarketStats());
        await Promise.all(promises);
    } catch (e) {
        console.warn('[BoostMarket] Refresh error:', e);
    }
    RS.isLoading = false;
    render();
}

async function loadPendingEarnings() {
    if (!State.userAddress) return;
    try {
        const result = await RentalTx.getPendingEarnings(State.userAddress);
        RS.pendingEarningsAmount = result.amount;
    } catch {
        RS.pendingEarningsAmount = 0n;
    }
}

async function loadMarketStats() {
    try {
        RS.marketStats = await RentalTx.getMarketplaceStats();
    } catch {
        RS.marketStats = null;
    }
}

// ============================================================================
// CLEANUP
// ============================================================================

function cleanup() {
    RS.countdownIntervals.forEach(clearInterval);
    RS.countdownIntervals = [];
    if (bmClickHandler) {
        document.removeEventListener('click', bmClickHandler);
        bmClickHandler = null;
    }
    if (bmChangeHandler) {
        document.removeEventListener('change', bmChangeHandler);
        bmChangeHandler = null;
    }
}

// ============================================================================
// EXPORT
// ============================================================================

export const RentalPage = {
    async render(isActive) {
        if (!isActive) {
            cleanup();
            return;
        }
        render();
        await refreshData();
    },

    update() {
        render();
    },

    refresh: refreshData,
    cleanup
};

window.RentalPage = RentalPage;
