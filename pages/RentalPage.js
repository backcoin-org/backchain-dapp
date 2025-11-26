// js/pages/RentalPage.js
const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { loadRentalListings, loadUserRentals, loadMyBoostersFromAPI } from '../modules/data.js';
import { executeListNFT, executeRentNFT, executeWithdrawNFT } from '../modules/transactions.js';
import { formatBigNumber, renderLoading, renderNoData } from '../utils.js';
import { showToast } from '../ui-feedback.js';

// --- LOCAL STATE ---
const RentalState = {
    activeTab: 'market', // 'market' | 'dashboard'
    selectedRentalId: null,
    rentHoursInput: 1,
    listPriceInput: '',
    listDurationInput: 24,
    isDataLoading: false
};

// --- RENDER FUNCTIONS ---

export const RentalPage = {
    async render(isNewPage = false) {
        const container = document.getElementById('rental');
        if (!container) return;

        // 1. Initial Layout Structure (Only once)
        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between items-end mb-8">
                    <div>
                        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <i class="fa-solid fa-house-laptop text-cyan-400"></i> AirBNFT <span class="text-sm bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded border border-cyan-700/50">Beta</span>
                        </h1>
                        <p class="text-zinc-400 max-w-xl">
                            Rent high-power Boosters by the hour to maximize your rewards temporarily, or monetize your idle NFTs.
                        </p>
                    </div>
                    
                    <div class="flex bg-zinc-800/50 p-1 rounded-lg border border-zinc-700 mt-4 md:mt-0">
                        <button id="tab-rent-market" class="px-6 py-2 rounded-md text-sm font-bold transition-all ${RentalState.activeTab === 'market' ? 'bg-cyan-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}">
                            <i class="fa-solid fa-shop mr-2"></i> Marketplace
                        </button>
                        <button id="tab-rent-dashboard" class="px-6 py-2 rounded-md text-sm font-bold transition-all ${RentalState.activeTab === 'dashboard' ? 'bg-cyan-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}">
                            <i class="fa-solid fa-user-astronaut mr-2"></i> My Dashboard
                        </button>
                    </div>
                </div>

                <div id="rental-content-area" class="min-h-[400px]">
                    ${renderLoading()}
                </div>

                <div id="rent-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div class="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                        <button id="close-rent-modal" class="absolute top-4 right-4 text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-xl"></i></button>
                        
                        <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-clock text-cyan-400"></i> Rent Booster
                        </h3>
                        
                        <div id="rent-modal-details" class="mb-6"></div>
                        
                        <div class="mb-6">
                            <label class="block text-sm text-zinc-400 mb-2">Duration (Hours)</label>
                            <div class="flex items-center gap-3">
                                <button class="w-10 h-10 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold" onclick="adjustRentHours(-1)">-</button>
                                <input type="number" id="rent-hours-input" value="1" min="1" class="flex-1 bg-black border border-zinc-700 rounded p-2 text-center text-white font-mono text-lg focus:border-cyan-500 outline-none">
                                <button class="w-10 h-10 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold" onclick="adjustRentHours(1)">+</button>
                            </div>
                            <p class="text-xs text-zinc-500 mt-2 text-right">Max duration: <span id="modal-max-duration">--</span> hours</p>
                        </div>

                        <div class="flex justify-between items-center border-t border-zinc-800 pt-4 mb-6">
                            <span class="text-zinc-400">Total Cost:</span>
                            <span id="modal-total-cost" class="text-xl font-bold text-cyan-400">0.00 BKC</span>
                        </div>

                        <button id="confirm-rent-btn" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-cyan-900/20">
                            Confirm Rental
                        </button>
                    </div>
                </div>
            `;
            
            setupEventListeners();
        }

        // 2. Load Data & Render Content
        RentalState.isDataLoading = true;
        if (State.isConnected) {
            await Promise.all([
                loadRentalListings(),
                loadUserRentals(),
                loadMyBoostersFromAPI() // Needed for listing list
            ]);
        }
        RentalState.isDataLoading = false;
        
        renderActiveTabContent();
    },

    update() {
        renderActiveTabContent();
    }
};

// --- INTERNAL RENDERING ---

function renderActiveTabContent() {
    const container = document.getElementById('rental-content-area');
    if (!container) return;

    if (RentalState.isDataLoading) {
        container.innerHTML = renderLoading();
        return;
    }

    if (!State.isConnected) {
        container.innerHTML = renderNoData("Connect your wallet to access the Rental Market.");
        return;
    }

    if (RentalState.activeTab === 'market') {
        renderMarketplace(container);
    } else {
        renderDashboard(container);
    }
}

function renderMarketplace(container) {
    const listings = State.rentalListings || [];

    if (listings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-zinc-800/30 rounded-xl border border-dashed border-zinc-700">
                <i class="fa-solid fa-shop-slash text-4xl text-zinc-600 mb-4"></i>
                <h3 class="text-xl font-bold text-zinc-400">Marketplace Empty</h3>
                <p class="text-zinc-500 mt-2">Be the first to list a Booster for rent!</p>
                <button class="mt-4 text-cyan-400 hover:text-cyan-300 underline" onclick="document.getElementById('tab-rent-dashboard').click()">Go to Dashboard to List</button>
            </div>
        `;
        return;
    }

    let html = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">`;
    
    listings.forEach(item => {
        const pricePerHour = formatBigNumber(item.pricePerHour);
        const isOwner = item.owner.toLowerCase() === State.userAddress.toLowerCase();

        html += `
            <div class="rental-card bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden flex flex-col relative group">
                <div class="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-mono text-white border border-zinc-600">
                    #${item.tokenId}
                </div>
                
                <div class="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
                    <img src="${item.img}" alt="${item.name}" class="h-24 w-auto object-contain drop-shadow-lg transition-transform group-hover:scale-110 duration-300">
                    <div class="mt-4 text-center">
                        <h3 class="font-bold text-white text-lg">${item.name}</h3>
                        <span class="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded font-bold border border-green-500/30">
                            +${item.boostBips / 100}% Efficiency
                        </span>
                    </div>
                </div>

                <div class="p-4 border-t border-zinc-700 bg-zinc-800/50 flex-1 flex flex-col">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-zinc-400 text-xs">Price / Hour</span>
                        <span class="text-white font-mono font-bold">${pricePerHour.toFixed(2)} BKC</span>
                    </div>
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-zinc-400 text-xs">Max Duration</span>
                        <span class="text-zinc-300 text-xs">${item.maxDurationHours} Hours</span>
                    </div>

                    <button 
                        class="mt-auto w-full py-2 rounded-lg font-bold transition-all ${isOwner ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20'}"
                        ${isOwner ? 'disabled' : ''}
                        onclick="window.openRentModal('${item.tokenId}')"
                    >
                        ${isOwner ? 'Your Listing' : 'Rent Now'}
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function renderDashboard(container) {
    // 1. My Active Rentals (Tenant)
    const myRentals = State.myRentals || [];
    
    // 2. My Listings (Owner)
    const myListings = (State.rentalListings || []).filter(l => l.owner.toLowerCase() === State.userAddress.toLowerCase());
    
    // 3. My Idle Boosters (Available to List)
    // Filter logic: Owns NFT AND NOT currently listed
    const listedIds = new Set((State.rentalListings || []).map(l => l.tokenId));
    const idleBoosters = (State.myBoosters || []).filter(b => !listedIds.has(b.tokenId.toString()));

    let html = `<div class="space-y-8">`;

    // SECTION A: ACTIVE RENTALS
    html += `
        <div class="bg-zinc-800/40 border border-zinc-700 rounded-xl p-6">
            <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-green-400"></i> Active Rentals (Rented by me)
            </h3>
            ${myRentals.length === 0 ? '<p class="text-zinc-500 text-sm">You have no active rentals.</p>' : 
                `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${myRentals.map(r => renderRentalCard(r)).join('')}
                </div>`
            }
        </div>
    `;

    // SECTION B: MY LISTINGS
    html += `
        <div class="bg-zinc-800/40 border border-zinc-700 rounded-xl p-6">
            <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <i class="fa-solid fa-shop text-amber-400"></i> My Listings (Earning Passive Income)
            </h3>
            ${myListings.length === 0 ? '<p class="text-zinc-500 text-sm">You have no active listings.</p>' : 
                `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${myListings.map(l => renderListingCard(l)).join('')}
                </div>`
            }
        </div>
    `;

    // SECTION C: CREATE LISTING FORM
    html += `
        <div class="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-600 rounded-xl p-6 shadow-xl">
            <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <i class="fa-solid fa-plus-circle text-cyan-400"></i> List New Asset
            </h3>
            
            <div class="flex flex-col lg:flex-row gap-6 items-end">
                <div class="flex-1 w-full">
                    <label class="block text-xs text-zinc-400 mb-2">Select Booster</label>
                    <select id="list-nft-selector" class="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-cyan-500 outline-none">
                        ${idleBoosters.length === 0 ? '<option value="">No idle boosters available</option>' : 
                            idleBoosters.map(b => `<option value="${b.tokenId}">Booster #${b.tokenId} (+${b.boostBips/100}%)</option>`).join('')
                        }
                    </select>
                </div>

                <div class="w-full lg:w-48">
                    <label class="block text-xs text-zinc-400 mb-2">Price / Hour (BKC)</label>
                    <input type="number" id="list-price-input" placeholder="e.g. 10" class="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-cyan-500 outline-none">
                </div>

                <div class="w-full lg:w-48">
                    <label class="block text-xs text-zinc-400 mb-2">Max Duration (Hours)</label>
                    <input type="number" id="list-duration-input" value="24" class="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-cyan-500 outline-none">
                </div>

                <button id="execute-list-btn" class="w-full lg:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded shadow-lg transition-colors" ${idleBoosters.length === 0 ? 'disabled opacity-50' : ''}>
                    List Asset
                </button>
            </div>
            <p class="text-xs text-zinc-500 mt-3">
                <i class="fa-solid fa-info-circle"></i> The NFT will be transferred to the Rental Smart Contract (Escrow) safely. You can withdraw it anytime if it's not rented.
            </p>
        </div>
    `;

    html += `</div>`;
    container.innerHTML = html;
    
    // Start timers for active rentals
    startCountdowns();
}

// --- CARD HELPERS ---

function renderRentalCard(rental) {
    const endTime = Number(rental.endTime) * 1000;
    const now = Date.now();
    const isExpired = now > endTime;

    return `
        <div class="bg-zinc-900 border border-green-900/30 rounded-lg p-4 flex items-center gap-4 relative overflow-hidden">
            <div class="absolute right-0 top-0 h-full w-1 bg-green-500"></div>
            <img src="${rental.img}" class="h-12 w-12 object-contain">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-white text-sm truncate">${rental.name}</h4>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs bg-green-500/10 text-green-400 px-1.5 rounded border border-green-500/20">+${rental.boostBips/100}% Active</span>
                </div>
                <p class="text-xs text-zinc-400 mt-2 font-mono rental-timer" data-end="${endTime}">
                    ${isExpired ? 'Expired' : 'Calculating...'}
                </p>
            </div>
        </div>
    `;
}

function renderListingCard(listing) {
    // "isRented" logic is inferred if we had that data on listing object.
    // Assuming listing object now has 'isRented' from data.js update.
    const isRented = false; // Placeholder: In data.js we should fetch this. Assuming available for withdraw for now.
    
    return `
        <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4 flex flex-col gap-3">
            <div class="flex items-center gap-3">
                <img src="${listing.img}" class="h-10 w-10 object-contain">
                <div>
                    <h4 class="font-bold text-white text-sm">#${listing.tokenId}</h4>
                    <p class="text-xs text-zinc-500">${formatBigNumber(listing.pricePerHour).toFixed(2)} BKC/hr</p>
                </div>
            </div>
            
            <div class="flex gap-2 mt-2">
                <button class="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs py-2 rounded border border-red-900/30 transition-colors withdraw-btn" data-id="${listing.tokenId}">
                    Withdraw
                </button>
            </div>
        </div>
    `;
}

// --- LOGIC & INTERACTION ---

function setupEventListeners() {
    // Tabs
    document.getElementById('tab-rent-market').addEventListener('click', () => {
        RentalState.activeTab = 'market';
        RentalPage.render();
    });
    document.getElementById('tab-rent-dashboard').addEventListener('click', () => {
        RentalState.activeTab = 'dashboard';
        RentalPage.render();
    });

    // Modal Interaction
    document.getElementById('close-rent-modal').addEventListener('click', closeModal);
    document.getElementById('confirm-rent-btn').addEventListener('click', handleRentConfirm);

    // List Interaction (Delegated for dynamic elements or attached after render)
    // Since renderDashboard replaces HTML, we attach listener to a static parent or re-attach
    const contentArea = document.getElementById('rental-content-area');
    contentArea.addEventListener('click', async (e) => {
        // List Button
        if (e.target.id === 'execute-list-btn') {
            handleListAsset(e.target);
        }
        // Withdraw Button
        if (e.target.classList.contains('withdraw-btn')) {
            const tokenId = e.target.dataset.id;
            await executeWithdrawNFT(tokenId, e.target);
        }
    });
}

// Exposed to window for onclick in HTML string
window.openRentModal = (tokenId) => {
    const listing = State.rentalListings.find(l => l.tokenId === tokenId);
    if (!listing) return;

    RentalState.selectedRentalId = tokenId;
    RentalState.rentHoursInput = 1;

    const modal = document.getElementById('rent-modal');
    const details = document.getElementById('rent-modal-details');
    const maxDurEl = document.getElementById('modal-max-duration');
    const costEl = document.getElementById('modal-total-cost');
    const input = document.getElementById('rent-hours-input');

    // Update UI
    details.innerHTML = `
        <div class="flex items-center gap-4 bg-black/40 p-4 rounded-lg">
            <img src="${listing.img}" class="h-16 w-16 object-contain">
            <div>
                <h4 class="font-bold text-white">${listing.name}</h4>
                <p class="text-cyan-400 text-sm">+${listing.boostBips/100}% Boost</p>
                <p class="text-zinc-500 text-xs mt-1">${formatBigNumber(listing.pricePerHour).toFixed(2)} BKC / Hour</p>
            </div>
        </div>
    `;
    
    maxDurEl.innerText = listing.maxDurationHours;
    input.value = 1;
    input.max = listing.maxDurationHours;
    
    // Recalculate cost function
    const updateCost = () => {
        const hours = parseInt(input.value) || 1;
        const totalWei = listing.pricePerHour * BigInt(hours);
        costEl.innerText = `${formatBigNumber(totalWei).toFixed(2)} BKC`;
    };
    
    input.oninput = updateCost;
    
    // Global adjust function for +/- buttons
    window.adjustRentHours = (delta) => {
        let val = parseInt(input.value) || 0;
        val = Math.max(1, Math.min(parseInt(listing.maxDurationHours), val + delta));
        input.value = val;
        RentalState.rentHoursInput = val;
        updateCost();
    };

    updateCost();
    modal.classList.remove('hidden');
};

function closeModal() {
    document.getElementById('rent-modal').classList.add('hidden');
}

async function handleRentConfirm(e) {
    const btn = e.target;
    const tokenId = RentalState.selectedRentalId;
    const hours = document.getElementById('rent-hours-input').value;
    const listing = State.rentalListings.find(l => l.tokenId === tokenId);
    
    if (!listing || !hours) return;

    const totalCostWei = listing.pricePerHour * BigInt(hours);
    
    const success = await executeRentNFT(tokenId, hours, totalCostWei, btn);
    if (success) closeModal();
}

async function handleListAsset(btn) {
    const tokenId = document.getElementById('list-nft-selector').value;
    const price = document.getElementById('list-price-input').value;
    const duration = document.getElementById('list-duration-input').value;

    if (!tokenId || !price || !duration) {
        showToast("Please fill in all fields", "error");
        return;
    }

    const priceWei = ethers.parseUnits(price, 18); // BKC has 18 decimals
    
    await executeListNFT(tokenId, priceWei, duration, btn);
}

function startCountdowns() {
    const timers = document.querySelectorAll('.rental-timer');
    
    const update = () => {
        const now = Date.now();
        timers.forEach(t => {
            const end = parseInt(t.dataset.end);
            if (end < now) {
                t.innerText = "Expired";
                t.classList.add('text-red-500');
            } else {
                const diff = end - now;
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                t.innerText = `${h}h ${m}m remaining`;
            }
        });
    };
    
    update();
    setInterval(update, 60000); // Update every minute
}