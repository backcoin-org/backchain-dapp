// js/pages/RentalPage.js
// ✅ VERSÃO FINAL V4.1: Mobile-First UX + Robust Click Handler Fix

const ethers = window.ethers;

import { State } from '../state.js';
import { loadRentalListings, loadUserRentals, loadMyBoostersFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { executeListNFT, executeRentNFT, executeWithdrawNFT } from '../modules/transactions.js';
import { formatBigNumber, renderLoading, renderNoData } from '../utils.js';
import { showToast } from '../ui-feedback.js';
import { boosterTiers } from '../config.js'; 

// --- CSS INJECTION (MOBILE OPTIMIZED) ---
const style = document.createElement('style');
style.innerHTML = `
    /* LAYOUT PRINCIPAL */
    .rental-wrapper {
        display: grid;
        grid-template-columns: 1fr 320px; /* Desktop: Mercado | Sidebar */
        gap: 32px;
        align-items: start;
    }

    /* MOBILE FIRST ADJUSTMENTS */
    @media (max-width: 1024px) { 
        .rental-wrapper { 
            grid-template-columns: 1fr; 
            display: flex;
            flex-direction: column-reverse; /* Mobile: Sidebar embaixo, Mercado em cima */
        }
        
        /* Sidebar no mobile fica no fundo para gestão */
        .rental-sidebar {
            position: relative !important;
            top: 0 !important;
            width: 100%;
        }
    }

    /* CARD DESIGN */
    .market-card {
        background: rgba(20, 20, 23, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px; /* Bordas mais arredondadas para mobile */
        overflow: hidden;
        transition: all 0.3s ease;
        position: relative;
        display: flex;
        flex-direction: column;
    }
    .market-card:active { transform: scale(0.98); } /* Feedback tátil */

    .card-image-area {
        width: 100%;
        aspect-ratio: 1/1;
        background: radial-gradient(circle at center, rgba(255,255,255,0.03), transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        position: relative;
    }
    .card-image-area img {
        width: 70%;
        height: 70%;
        object-fit: contain;
        filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
    }

    .boost-badge {
        position: absolute;
        top: 12px; right: 12px;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(34, 211, 238, 0.3);
        color: #22d3ee;
        font-size: 11px;
        font-weight: 800;
        padding: 6px 10px;
        border-radius: 8px;
        z-index: 2;
    }

    .card-info { padding: 16px; flex: 1; display: flex; flex-direction: column; }
    
    .price-display {
        font-family: monospace;
        font-size: 20px;
        font-weight: 700;
        color: white;
    }
    .price-label { font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 600; }

    /* BOTÕES OTIMIZADOS PARA TOQUE */
    .action-button {
        width: 100%; 
        padding: 14px; /* Mais alto para toque */
        border-radius: 12px; 
        font-weight: 800; 
        font-size: 13px; 
        letter-spacing: 0.5px;
        transition: all 0.2s; 
        text-transform: uppercase;
        margin-top: auto;
        cursor: pointer;
        border: none;
    }
    .btn-rent { 
        background: #22d3ee; 
        color: #000; 
        box-shadow: 0 4px 15px rgba(34, 211, 238, 0.2);
    }
    .btn-rent:active { background: #67e8f9; transform: translateY(2px); }
    
    .btn-withdraw { 
        background: rgba(239, 68, 68, 0.15); 
        color: #ef4444; 
        border: 1px solid rgba(239, 68, 68, 0.3); 
    }

    /* SIDEBAR & MODAL */
    .rental-sidebar {
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 20px;
        padding: 24px;
        position: sticky;
        top: 24px;
        height: fit-content;
    }
    
    .modal-overlay { 
        position: fixed; inset: 0; 
        background: rgba(0,0,0,0.9); 
        z-index: 9999; /* Z-Index altíssimo para garantir */
        display: none; 
        align-items: center; 
        justify-content: center; 
        backdrop-filter: blur(5px);
        padding: 20px;
    }
    .modal-content {
        width: 100%;
        max-width: 360px;
        animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;
document.head.appendChild(style);

// --- LOCAL STATE ---
const RentalState = {
    filterTier: 'ALL',
    sortBy: 'price_asc',
    selectedRentalId: null,
    isDataLoading: false,
    history: []
};

// --- RENDER FUNCTIONS ---

export const RentalPage = {
    async render(isNewPage = false) {
        const container = document.getElementById('rental');
        if (!container) return;

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div class="flex flex-col pb-24 animate-fadeIn">
                    
                    <div class="flex gap-4 overflow-x-auto pb-4 mb-4 no-scrollbar snap-x">
                        <div class="min-w-[140px] bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 snap-center">
                            <p class="text-[10px] text-zinc-500 font-bold uppercase">Listings</p>
                            <p id="stat-listings" class="text-lg font-bold text-white">--</p>
                        </div>
                        <div class="min-w-[140px] bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 snap-center">
                            <p class="text-[10px] text-zinc-500 font-bold uppercase">Floor (1h)</p>
                            <div class="flex items-end gap-1">
                                <p id="stat-floor" class="text-lg font-bold text-white">--</p>
                                <span class="text-[10px] text-zinc-600 font-bold mb-1">BKC</span>
                            </div>
                        </div>
                        <div class="min-w-[140px] bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 snap-center cursor-pointer active:bg-zinc-800" onclick="window.navigateTo('store')">
                            <p class="text-[10px] text-amber-500 font-bold uppercase">Inventory</p>
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-box-open text-zinc-400"></i>
                                <span class="text-sm text-white font-bold">Manage</span>
                            </div>
                        </div>
                    </div>

                    <div class="rental-wrapper">
                        
                        <div class="flex flex-col gap-6">
                            
                            <div class="flex justify-between items-center gap-4">
                                <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full">
                                    <button class="filter-btn px-4 py-2 rounded-full bg-white text-black text-xs font-bold whitespace-nowrap shadow-lg" data-tier="ALL">All</button>
                                    ${boosterTiers.map(t => `<button class="filter-btn px-4 py-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold border border-zinc-700 whitespace-nowrap" data-tier="${t.name}">${t.name}</button>`).join('')}
                                </div>
                            </div>

                            <div id="rental-marketplace-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[300px]">
                                ${renderLoading()}
                            </div>
                        </div>

                        <div class="rental-sidebar">
                            
                            <div class="mb-8">
                                <div class="text-xs font-bold text-zinc-500 uppercase mb-4 tracking-widest">
                                    <i class="fa-solid fa-plus-circle text-amber-500 mr-1"></i> Create Listing
                                </div>
                                <div class="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                                    <label class="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Select Asset</label>
                                    <select id="list-nft-selector" class="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-xs mb-4 outline-none focus:border-amber-500"></select>
                                    
                                    <label class="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Price per Hour</label>
                                    <div class="flex items-center relative mb-4">
                                        <input type="number" id="list-price-input" placeholder="0.0" class="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm font-mono font-bold outline-none focus:border-amber-500 pr-12">
                                        <span class="absolute right-3 text-[10px] text-zinc-500 font-bold">BKC</span>
                                    </div>

                                    <button id="execute-list-btn" class="action-button bg-white hover:bg-zinc-200 text-black shadow-lg">List for Rent</button>
                                </div>
                            </div>

                            <div class="mb-8">
                                <div class="text-xs font-bold text-zinc-500 uppercase mb-4 tracking-widest flex justify-between">
                                    <span><i class="fa-solid fa-list-check text-blue-500 mr-1"></i> Your Listings</span>
                                    <span id="my-listings-count" class="bg-zinc-800 px-2 rounded text-white">0</span>
                                </div>
                                <div id="my-listings-list" class="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                                    <div class="text-center py-4 text-xs text-zinc-600">Connect wallet</div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div id="rent-modal" class="modal-overlay hidden">
                    <div class="bg-zinc-900 border border-zinc-700 rounded-2xl modal-content p-6 relative shadow-2xl">
                        <button id="close-rent-modal" class="absolute top-4 right-4 text-zinc-500 hover:text-white p-2"><i class="fa-solid fa-xmark text-xl"></i></button>
                        
                        <h3 class="text-xl font-bold text-white mb-1">Rent Booster</h3>
                        <p class="text-xs text-zinc-500 mb-6">1 Hour Access • Instant Activation</p>
                        
                        <div id="rent-modal-content" class="mb-6 bg-black/30 p-4 rounded-xl border border-zinc-800"></div>
                        
                        <div class="flex justify-between items-end border-t border-zinc-800 pt-4 mb-6">
                            <span class="text-zinc-400 text-xs font-bold uppercase">Total Cost</span>
                            <span id="modal-total-cost" class="text-3xl font-black text-cyan-400">0.00 <span class="text-sm text-zinc-500">BKC</span></span>
                        </div>
                        
                        <button id="confirm-rent-btn" class="action-button btn-rent shadow-lg shadow-cyan-500/20">CONFIRM PAYMENT</button>
                    </div>
                </div>
            `;
            
            setupEventListeners();
        }

        await refreshRentalData();
    },

    update() {
        if (!RentalState.isDataLoading) renderUI();
    }
};

// --- DATA FETCHING ---

async function refreshRentalData() {
    RentalState.isDataLoading = true;
    renderUI(); 
    if (State.isConnected) {
        await Promise.all([
            loadRentalListings(true),
            loadUserRentals(true),
            loadMyBoostersFromAPI(true)
        ]);
    }
    RentalState.isDataLoading = false;
    renderUI();
}

// --- RENDERING UI ---

function renderUI() {
    const marketGrid = document.getElementById('rental-marketplace-grid');
    const myListingsContainer = document.getElementById('my-listings-list');
    const formSelector = document.getElementById('list-nft-selector');
    
    const listings = State.rentalListings || [];
    
    // Stats
    if(document.getElementById('stat-listings')) document.getElementById('stat-listings').innerText = listings.length;
    if (listings.length > 0) {
        const prices = listings.map(l => parseFloat(ethers.formatEther(l.pricePerHour)));
        const minPrice = Math.min(...prices);
        if(document.getElementById('stat-floor')) document.getElementById('stat-floor').innerText = minPrice.toFixed(2);
    } else {
        if(document.getElementById('stat-floor')) document.getElementById('stat-floor').innerText = "0.00";
    }

    // MARKET GRID
    if (marketGrid) {
        if (RentalState.isDataLoading) {
            marketGrid.innerHTML = renderLoading();
        } else if (listings.length === 0) {
            marketGrid.innerHTML = renderNoData("No boosters available.");
        } else {
            let filtered = listings.filter(l => RentalState.filterTier === 'ALL' || l.name.includes(RentalState.filterTier));
            
            // Ordenação simples para mobile
            filtered.sort((a, b) => Number(a.pricePerHour) - Number(b.pricePerHour));

            marketGrid.innerHTML = filtered.map(l => {
                const price = formatBigNumber(BigInt(l.pricePerHour)).toFixed(2);
                const isOwner = l.owner.toLowerCase() === State.userAddress?.toLowerCase();
                
                if (isOwner) return ''; 

                return `
                    <div class="market-card group">
                        <div class="boost-badge">+${l.boostBips/100}% BOOST</div>
                        <div class="card-image-area">
                            <img src="${l.img}" alt="${l.name}">
                        </div>
                        <div class="card-info">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h4 class="text-white font-bold text-sm leading-tight">${l.name}</h4>
                                    <p class="text-zinc-500 text-[10px] font-mono mt-1">#${l.tokenId}</p>
                                </div>
                                <div class="text-right">
                                    <p class="price-display">${price}</p>
                                    <p class="price-label">BKC / 1H</p>
                                </div>
                            </div>
                            <div class="mt-auto">
                                <button class="action-button btn-rent rent-btn" data-id="${l.tokenId}">RENT NOW</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            if (marketGrid.innerHTML.trim() === '') marketGrid.innerHTML = renderNoData("No listings from others.");
        }
    }

    // MY LISTINGS
    if (myListingsContainer && State.isConnected) {
        const myListings = listings.filter(l => l.owner.toLowerCase() === State.userAddress.toLowerCase());
        document.getElementById('my-listings-count').innerText = myListings.length;
        
        if (myListings.length === 0) {
            myListingsContainer.innerHTML = `<div class="text-center py-4 text-xs text-zinc-600">No listings</div>`;
        } else {
            myListingsContainer.innerHTML = myListings.map(l => `
                <div class="bg-black/40 p-3 rounded-lg flex items-center justify-between border border-zinc-800">
                    <div class="flex items-center gap-3">
                        <img src="${l.img}" class="w-10 h-10 object-contain">
                        <div>
                            <p class="text-white text-xs font-bold">#${l.tokenId}</p>
                            <p class="text-zinc-500 text-[10px]">${formatBigNumber(BigInt(l.pricePerHour)).toFixed(2)} BKC</p>
                        </div>
                    </div>
                    <button class="btn-withdraw-mini withdraw-btn" data-id="${l.tokenId}">RETRIEVE</button>
                </div>
            `).join('');
        }

        if (formSelector) {
            const listedIds = new Set(listings.map(l => l.tokenId));
            const idle = (State.myBoosters || []).filter(b => !listedIds.has(b.tokenId.toString()));
            
            if (idle.length === 0) {
                formSelector.innerHTML = `<option value="">No idle assets found</option>`;
                document.getElementById('execute-list-btn').disabled = true;
            } else {
                formSelector.innerHTML = idle.map(b => {
                    const t = boosterTiers.find(x => x.boostBips === b.boostBips);
                    return `<option value="${b.tokenId}">#${b.tokenId} - ${t?.name} (+${b.boostBips/100}%)</option>`;
                }).join('');
                document.getElementById('execute-list-btn').disabled = false;
            }
        }
    }
}

// --- INTERACTION (FIXED CLICK HANDLERS) ---

function setupEventListeners() {
    
    // 1. FILTERS
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-white', 'text-black');
                b.classList.add('bg-zinc-800', 'text-zinc-400');
            });
            e.target.classList.remove('bg-zinc-800', 'text-zinc-400');
            e.target.classList.add('bg-white', 'text-black');
            RentalState.filterTier = e.target.dataset.tier;
            renderUI();
        });
    });

    // 2. LIST ASSET
    const listBtn = document.getElementById('execute-list-btn');
    if(listBtn) {
        listBtn.addEventListener('click', async (e) => {
            const tokenId = document.getElementById('list-nft-selector').value;
            const price = document.getElementById('list-price-input').value;
            
            if (!tokenId || !price || parseFloat(price) <= 0) return showToast("Invalid price", "error");
            
            const btn = e.target;
            btn.innerText = "PROCESSING...";
            btn.disabled = true;
            
            const success = await executeListNFT(tokenId, ethers.parseUnits(price, 18), 1, btn);
            if (success) await refreshRentalData();
            else { btn.innerText = "List for Rent"; btn.disabled = false; }
        });
    }

    // 3. RENT MODAL OPEN (EVENT DELEGATION - THE FIX!)
    document.addEventListener('click', (e) => {
        const rentBtn = e.target.closest('.rent-btn');
        if (rentBtn) {
            openRentModal(rentBtn.dataset.id);
        }
        
        const withdrawBtn = e.target.closest('.withdraw-btn');
        if (withdrawBtn) {
            if(!confirm("Retrieve NFT?")) return;
            executeWithdrawNFT(withdrawBtn.dataset.id, withdrawBtn).then(success => {
                if(success) refreshRentalData();
            });
        }
    });

    // 4. MODAL CLOSE
    const closeModal = () => {
        document.getElementById('rent-modal').classList.add('hidden');
        document.getElementById('rent-modal').classList.remove('flex');
    };
    document.getElementById('close-rent-modal').addEventListener('click', closeModal);
    document.getElementById('rent-modal').addEventListener('click', (e) => {
        if(e.target === document.getElementById('rent-modal')) closeModal();
    });

    // 5. CONFIRM RENT
    document.getElementById('confirm-rent-btn').addEventListener('click', async (e) => {
        const btn = e.target;
        const tokenId = RentalState.selectedRentalId;
        const listing = State.rentalListings.find(l => l.tokenId === tokenId);
        
        if (!listing) return;
        const cost = BigInt(listing.pricePerHour) * 1n; // 1h Fixa
        
        btn.innerText = "CONFIRMING...";
        btn.disabled = true;
        
        const success = await executeRentNFT(tokenId, 1, cost, btn);
        if (success) {
            closeModal();
            await refreshRentalData();
        } else {
            btn.innerText = "CONFIRM PAYMENT";
            btn.disabled = false;
        }
    });
}

// Function to populate and show modal
function openRentModal(tokenId) {
    const listing = State.rentalListings.find(l => l.tokenId === tokenId);
    if (!listing) return;
    
    RentalState.selectedRentalId = tokenId;
    
    const content = document.getElementById('rent-modal-content');
    const totalEl = document.getElementById('modal-total-cost');
    
    const priceFormatted = formatBigNumber(BigInt(listing.pricePerHour)).toFixed(2);
    totalEl.innerHTML = `${priceFormatted} <span class="text-sm text-zinc-500">BKC</span>`;

    content.innerHTML = `
        <div class="flex items-center gap-4 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
            <img src="${listing.img}" class="w-16 h-16 object-contain bg-black/20 rounded-lg p-1">
            <div>
                <h4 class="text-white font-bold text-lg leading-none">${listing.name}</h4>
                <p class="text-cyan-400 text-xs font-mono mt-1">#${listing.tokenId}</p>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('rent-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}