// js/pages/RentalPage.js
// ✅ VERSION V6.0: Clean UI, Mobile-First, V2.1 Compatible

const ethers = window.ethers;

import { State } from '../state.js';
import { loadRentalListings, loadUserRentals, loadMyBoostersFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { executeListNFT, executeRentNFT, executeWithdrawNFT } from '../modules/transactions.js';
import { formatBigNumber, renderLoading, renderNoData } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers } from '../config.js';

// --- LOCAL STATE ---
const RentalState = {
    filterTier: 'ALL',
    sortBy: 'price_asc',
    selectedRentalId: null,
    isLoading: false
};

// --- STYLES ---
const style = document.createElement('style');
style.innerHTML = `
    .rental-card {
        background: rgba(24, 24, 27, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.2s ease;
    }
    .rental-card:hover {
        border-color: rgba(34, 211, 238, 0.3);
        transform: translateY(-2px);
    }
    .rental-card .image-area {
        aspect-ratio: 1;
        background: radial-gradient(circle at center, rgba(255,255,255,0.02), transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        position: relative;
    }
    .rental-card .image-area img {
        width: 65%;
        height: 65%;
        object-fit: contain;
        filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
    }
    .boost-tag {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(34, 211, 238, 0.3);
        color: #22d3ee;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 6px;
    }
    .filter-pill {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.2s;
        cursor: pointer;
    }
    .filter-pill.active {
        background: white;
        color: black;
    }
    .filter-pill:not(.active) {
        background: #27272a;
        color: #71717a;
        border: 1px solid #3f3f46;
    }
    .filter-pill:not(.active):hover {
        color: white;
        border-color: #52525b;
    }
`;
document.head.appendChild(style);

// ============================================================================
// 1. MAIN RENDER
// ============================================================================

export const RentalPage = {
    async render(isNewPage = false) {
        const container = document.getElementById('rental');
        if (!container) return;

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div class="max-w-6xl mx-auto py-6 px-4">
                    
                    <!-- HEADER -->
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h1 class="text-xl font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-handshake text-cyan-400"></i> AirBNFT
                            </h1>
                            <p class="text-xs text-zinc-500 mt-0.5">Rent NFT boosters by the hour</p>
                        </div>
                        <button id="btn-refresh-rentals" class="text-xs bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>

                    <!-- STATS ROW -->
                    <div class="flex gap-3 overflow-x-auto pb-2 mb-6 no-scrollbar">
                        <div class="flex-shrink-0 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 min-w-[120px]">
                            <p class="text-[10px] text-zinc-500 font-bold uppercase">Listings</p>
                            <p id="stat-listings" class="text-lg font-bold text-white">--</p>
                        </div>
                        <div class="flex-shrink-0 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 min-w-[120px]">
                            <p class="text-[10px] text-zinc-500 font-bold uppercase">Floor</p>
                            <p id="stat-floor" class="text-lg font-bold text-white">-- <span class="text-[10px] text-zinc-600">BKC</span></p>
                        </div>
                        <div class="flex-shrink-0 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 min-w-[120px] cursor-pointer hover:bg-cyan-500/20 transition-colors" onclick="window.navigateTo('store')">
                            <p class="text-[10px] text-cyan-400 font-bold uppercase">My NFTs</p>
                            <p class="text-sm font-bold text-white flex items-center gap-1">
                                <i class="fa-solid fa-box-open"></i> View
                            </p>
                        </div>
                    </div>

                    <!-- MAIN GRID -->
                    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        
                        <!-- MARKETPLACE (3 cols) -->
                        <div class="lg:col-span-3 space-y-4">
                            
                            <!-- FILTERS -->
                            <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                <button class="filter-pill active" data-tier="ALL">All</button>
                                ${boosterTiers.map(t => `
                                    <button class="filter-pill" data-tier="${t.name}">${t.name}</button>
                                `).join('')}
                            </div>

                            <!-- GRID -->
                            <div id="marketplace-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-3 min-h-[300px]">
                                ${renderLoading()}
                            </div>
                        </div>

                        <!-- SIDEBAR (1 col) -->
                        <div class="space-y-4">
                            
                            <!-- CREATE LISTING -->
                            <div class="glass-panel p-4 rounded-xl">
                                <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                    <i class="fa-solid fa-plus-circle text-amber-500"></i> List NFT
                                </h3>
                                
                                <div class="space-y-3">
                                    <div>
                                        <label class="text-[10px] text-zinc-500 uppercase mb-1 block">Select NFT</label>
                                        <select id="list-nft-selector" class="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500">
                                            <option value="">No NFTs available</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label class="text-[10px] text-zinc-500 uppercase mb-1 block">Price / Hour</label>
                                        <div class="relative">
                                            <input type="number" id="list-price-input" placeholder="0.0" 
                                                class="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-sm font-mono outline-none focus:border-amber-500 pr-12">
                                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">BKC</span>
                                        </div>
                                    </div>
                                    
                                    <button id="execute-list-btn" class="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40" disabled>
                                        List for Rent
                                    </button>
                                </div>
                            </div>

                            <!-- MY LISTINGS -->
                            <div class="glass-panel p-4 rounded-xl">
                                <div class="flex justify-between items-center mb-3">
                                    <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                        <i class="fa-solid fa-list text-blue-400"></i> My Listings
                                    </h3>
                                    <span id="my-listings-count" class="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">0</span>
                                </div>
                                <div id="my-listings-list" class="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    <p class="text-center text-xs text-zinc-600 py-4">Connect wallet</p>
                                </div>
                            </div>

                            <!-- ACTIVE RENTALS -->
                            <div class="glass-panel p-4 rounded-xl">
                                <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                    <i class="fa-solid fa-clock text-green-400"></i> Active Rentals
                                </h3>
                                <div id="active-rentals-list" class="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                                    <p class="text-center text-xs text-zinc-600 py-4">No active rentals</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RENT MODAL -->
                ${renderRentModal()}
            `;

            setupEventListeners();
        }

        await refreshData();
    },

    update() {
        if (!RentalState.isLoading) renderUI();
    }
};

// ============================================================================
// 2. MODAL
// ============================================================================

function renderRentModal() {
    return `
        <div id="rent-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div class="bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full p-5 relative">
                <button id="close-rent-modal" class="absolute top-3 right-3 text-zinc-500 hover:text-white">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                
                <h3 class="text-lg font-bold text-white mb-1">Rent Booster</h3>
                <p class="text-[10px] text-zinc-500 mb-4">1 Hour Access • Instant Activation</p>
                
                <div id="rent-modal-content" class="mb-4">
                    <!-- Dynamic content -->
                </div>
                
                <div class="flex justify-between items-center py-3 border-t border-zinc-800 mb-4">
                    <span class="text-zinc-500 text-xs uppercase">Total</span>
                    <span id="modal-total-cost" class="text-2xl font-black text-cyan-400">0.00</span>
                </div>
                
                <button id="confirm-rent-btn" class="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-lg transition-colors">
                    Confirm Payment
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// 3. DATA REFRESH
// ============================================================================

async function refreshData() {
    RentalState.isLoading = true;
    renderUI();

    if (State.isConnected) {
        await Promise.all([
            loadRentalListings(true),
            loadUserRentals(true),
            loadMyBoostersFromAPI(true)
        ]);
    }

    RentalState.isLoading = false;
    renderUI();
}

// ============================================================================
// 4. RENDER UI
// ============================================================================

function renderUI() {
    const marketGrid = document.getElementById('marketplace-grid');
    const myListingsContainer = document.getElementById('my-listings-list');
    const activeRentalsContainer = document.getElementById('active-rentals-list');
    const formSelector = document.getElementById('list-nft-selector');

    const listings = State.rentalListings || [];
    const rentals = State.userRentals || [];

    // Stats
    const listingsEl = document.getElementById('stat-listings');
    const floorEl = document.getElementById('stat-floor');

    if (listingsEl) listingsEl.textContent = listings.length;
    if (floorEl) {
        if (listings.length > 0) {
            const prices = listings.map(l => parseFloat(ethers.formatEther(l.pricePerHour)));
            floorEl.innerHTML = `${Math.min(...prices).toFixed(2)} <span class="text-[10px] text-zinc-600">BKC</span>`;
        } else {
            floorEl.innerHTML = `-- <span class="text-[10px] text-zinc-600">BKC</span>`;
        }
    }

    // MARKETPLACE GRID
    if (marketGrid) {
        if (RentalState.isLoading) {
            marketGrid.innerHTML = renderLoading();
        } else if (listings.length === 0) {
            marketGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-store text-xl text-zinc-600"></i>
                    </div>
                    <p class="text-zinc-500 text-sm">No listings available</p>
                </div>
            `;
        } else {
            let filtered = listings.filter(l => 
                RentalState.filterTier === 'ALL' || l.name.includes(RentalState.filterTier)
            );

            // Sort by price
            filtered.sort((a, b) => Number(a.pricePerHour) - Number(b.pricePerHour));

            // Filter out own listings
            const displayListings = filtered.filter(l => 
                l.owner.toLowerCase() !== State.userAddress?.toLowerCase()
            );

            if (displayListings.length === 0) {
                marketGrid.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <p class="text-zinc-500 text-sm">No listings from other users</p>
                    </div>
                `;
            } else {
                marketGrid.innerHTML = displayListings.map(l => {
                    const price = formatBigNumber(BigInt(l.pricePerHour)).toFixed(2);
                    
                    return `
                        <div class="rental-card">
                            <div class="image-area">
                                <div class="boost-tag">+${l.boostBips / 100}%</div>
                                <img src="${l.img}" alt="${l.name}" onerror="this.src='./assets/bkc_logo_3d.png'">
                            </div>
                            <div class="p-3">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="min-w-0">
                                        <h4 class="text-white font-bold text-xs truncate">${l.name}</h4>
                                        <p class="text-zinc-600 text-[10px] font-mono">#${l.tokenId}</p>
                                    </div>
                                    <div class="text-right flex-shrink-0">
                                        <p class="text-white font-bold font-mono text-sm">${price}</p>
                                        <p class="text-[9px] text-zinc-500 uppercase">BKC/1h</p>
                                    </div>
                                </div>
                                <button class="rent-btn w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 rounded-lg text-xs transition-colors" data-id="${l.tokenId}">
                                    Rent Now
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // MY LISTINGS
    if (myListingsContainer && State.isConnected) {
        const myListings = listings.filter(l => 
            l.owner.toLowerCase() === State.userAddress.toLowerCase()
        );

        const countEl = document.getElementById('my-listings-count');
        if (countEl) countEl.textContent = myListings.length;

        if (myListings.length === 0) {
            myListingsContainer.innerHTML = `<p class="text-center text-xs text-zinc-600 py-4">No active listings</p>`;
        } else {
            myListingsContainer.innerHTML = myListings.map(l => `
                <div class="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <div class="flex items-center gap-2 min-w-0">
                        <img src="${l.img}" class="w-8 h-8 object-contain" onerror="this.src='./assets/bkc_logo_3d.png'">
                        <div class="min-w-0">
                            <p class="text-white text-[10px] font-bold truncate">#${l.tokenId}</p>
                            <p class="text-zinc-500 text-[9px]">${formatBigNumber(BigInt(l.pricePerHour)).toFixed(2)} BKC</p>
                        </div>
                    </div>
                    <button class="withdraw-btn text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1" data-id="${l.tokenId}">
                        Withdraw
                    </button>
                </div>
            `).join('');
        }
    }

    // ACTIVE RENTALS
    if (activeRentalsContainer && State.isConnected) {
        if (rentals.length === 0) {
            activeRentalsContainer.innerHTML = `<p class="text-center text-xs text-zinc-600 py-4">No active rentals</p>`;
        } else {
            activeRentalsContainer.innerHTML = rentals.map(r => {
                const expiresAt = new Date(Number(r.expiresAt) * 1000);
                const now = new Date();
                const isActive = expiresAt > now;
                const timeLeft = isActive ? Math.ceil((expiresAt - now) / 60000) : 0;

                return `
                    <div class="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center">
                                <i class="fa-solid fa-clock text-green-400 text-xs"></i>
                            </div>
                            <div>
                                <p class="text-white text-[10px] font-bold">#${r.tokenId}</p>
                                <p class="text-green-400 text-[9px]">${timeLeft}m left</p>
                            </div>
                        </div>
                        <span class="text-[9px] bg-green-500 text-black font-bold px-1.5 py-0.5 rounded">ACTIVE</span>
                    </div>
                `;
            }).join('');
        }
    }

    // LIST FORM SELECTOR
    if (formSelector && State.isConnected) {
        const listedIds = new Set(listings.map(l => l.tokenId));
        const idle = (State.myBoosters || []).filter(b => !listedIds.has(b.tokenId.toString()));

        const listBtn = document.getElementById('execute-list-btn');

        if (idle.length === 0) {
            formSelector.innerHTML = `<option value="">No NFTs available</option>`;
            if (listBtn) listBtn.disabled = true;
        } else {
            formSelector.innerHTML = idle.map(b => {
                const tier = boosterTiers.find(t => t.boostBips === b.boostBips);
                return `<option value="${b.tokenId}">#${b.tokenId} - ${tier?.name || 'Unknown'} (+${b.boostBips / 100}%)</option>`;
            }).join('');
            if (listBtn) listBtn.disabled = false;
        }
    }
}

// ============================================================================
// 5. EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Refresh Button
    const refreshBtn = document.getElementById('btn-refresh-rentals');
    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            await refreshData();
            icon.classList.remove('fa-spin');
        };
    }

    // Filters
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            RentalState.filterTier = e.target.dataset.tier;
            renderUI();
        });
    });

    // List NFT
    const listBtn = document.getElementById('execute-list-btn');
    if (listBtn) {
        listBtn.addEventListener('click', async () => {
            const tokenId = document.getElementById('list-nft-selector').value;
            const price = document.getElementById('list-price-input').value;

            if (!tokenId || !price || parseFloat(price) <= 0) {
                return showToast("Enter a valid price", "error");
            }

            listBtn.textContent = "Processing...";
            listBtn.disabled = true;

            const success = await executeListNFT(tokenId, ethers.parseUnits(price, 18), listBtn);
            
            if (success) {
                document.getElementById('list-price-input').value = '';
                await refreshData();
                showToast("NFT listed successfully!", "success");
            }

            listBtn.textContent = "List for Rent";
            listBtn.disabled = false;
        });
    }

    // Rent & Withdraw (Event Delegation)
    document.addEventListener('click', async (e) => {
        // Rent
        const rentBtn = e.target.closest('.rent-btn');
        if (rentBtn) {
            openRentModal(rentBtn.dataset.id);
        }

        // Withdraw
        const withdrawBtn = e.target.closest('.withdraw-btn');
        if (withdrawBtn) {
            if (!confirm("Withdraw this NFT from rental market?")) return;
            
            withdrawBtn.textContent = "...";
            const success = await executeWithdrawNFT(withdrawBtn.dataset.id, withdrawBtn);
            
            if (success) {
                await refreshData();
                showToast("NFT withdrawn!", "success");
            }
            
            withdrawBtn.textContent = "Withdraw";
        }
    });

    // Modal Close
    const closeModalBtn = document.getElementById('close-rent-modal');
    const modal = document.getElementById('rent-modal');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Confirm Rent
    const confirmBtn = document.getElementById('confirm-rent-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const tokenId = RentalState.selectedRentalId;
            const listing = State.rentalListings.find(l => l.tokenId === tokenId);
            
            if (!listing) return;

            const cost = BigInt(listing.pricePerHour);

            confirmBtn.textContent = "Confirming...";
            confirmBtn.disabled = true;

            const success = await executeRentNFT(tokenId, cost, confirmBtn);
            
            if (success) {
                closeModal();
                await refreshData();
                showToast("NFT rented successfully!", "success");
            }

            confirmBtn.textContent = "Confirm Payment";
            confirmBtn.disabled = false;
        });
    }
}

// ============================================================================
// 6. MODAL FUNCTIONS
// ============================================================================

function openRentModal(tokenId) {
    const listing = State.rentalListings.find(l => l.tokenId === tokenId);
    if (!listing) return;

    RentalState.selectedRentalId = tokenId;

    const content = document.getElementById('rent-modal-content');
    const totalEl = document.getElementById('modal-total-cost');

    const price = formatBigNumber(BigInt(listing.pricePerHour)).toFixed(2);

    content.innerHTML = `
        <div class="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg">
            <img src="${listing.img}" class="w-12 h-12 object-contain bg-black/20 rounded-lg" onerror="this.src='./assets/bkc_logo_3d.png'">
            <div class="min-w-0">
                <h4 class="text-white font-bold text-sm">${listing.name}</h4>
                <p class="text-cyan-400 text-xs font-mono">#${listing.tokenId}</p>
                <p class="text-[10px] text-zinc-500">+${listing.boostBips / 100}% boost for 1 hour</p>
            </div>
        </div>
    `;

    totalEl.innerHTML = `${price} <span class="text-sm text-zinc-500">BKC</span>`;

    const modal = document.getElementById('rent-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    const modal = document.getElementById('rent-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    RentalState.selectedRentalId = null;
}