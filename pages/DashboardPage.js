// pages/DashboardPage.js
// ✅ VERSÃO DEFINITIVA 2.0: Booster Informativo & Educativo

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import {
    loadUserData,
    calculateUserTotalRewards,
    getHighestBoosterBoostFromAPI,
    safeContractCall,
    calculateClaimDetails,
    API_ENDPOINTS
} from '../modules/data.js';
import { executeUniversalClaim } from '../modules/transactions.js';
import {
    formatBigNumber, formatPStake, renderLoading,
    renderNoData, renderError
} from '../utils.js';
import { showToast, addNftToWallet, openModal, closeModal } from '../ui-feedback.js'; // Importe openModal/closeModal se existirem, ou usamos lógica local
import { addresses, boosterTiers } from '../config.js'; 

// --- ESTADO LOCAL ---
const DashboardState = {
    hasRenderedOnce: false,
    lastUpdate: 0,
    activities: [], 
    filteredActivities: [], 
    pagination: {
        currentPage: 1,
        itemsPerPage: 6 
    },
    filters: {
        type: 'ALL', 
        sort: 'NEWEST' 
    }
};

const EXPLORER_BASE_URL = "https://sepolia.etherscan.io/tx/";

// --- ANIMAÇÃO DE RECOMPENSAS ---
let animationFrameId = null;
let displayedRewardValue = 0n;

function animateClaimableRewards(targetNetValue) {
    const rewardsEl = document.getElementById('dash-user-rewards');
    if (!rewardsEl || !State.isConnected) {
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        return;
    }

    const diff = targetNetValue - displayedRewardValue;
    if (diff > -1000000000n && diff < 1000000000n) {
        displayedRewardValue = targetNetValue;
    } else {
        displayedRewardValue += diff / 8n; 
    }

    if (displayedRewardValue < 0n) displayedRewardValue = 0n;
    
    rewardsEl.innerHTML = `${formatBigNumber(displayedRewardValue).toFixed(4)} <span class="text-sm text-amber-500">$BKC</span>`;

    if (displayedRewardValue !== targetNetValue) {
        animationFrameId = requestAnimationFrame(() => animateClaimableRewards(targetNetValue));
    }
}

// ============================================================================
// 1. RENDERIZAÇÃO ESTRUTURAL (LAYOUT)
// ============================================================================

function renderDashboardLayout() {
    if (!DOMElements.dashboard) return;

    DOMElements.dashboard.innerHTML = `
        <div class="flex flex-col gap-8 pb-10">
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                ${renderMetricCard('Total Supply', 'fa-coins', 'text-zinc-400', 'dash-metric-supply')}
                ${renderMetricCard('Net pStake', 'fa-layer-group', 'text-purple-400', 'dash-metric-pstake')}
                ${renderMetricCard('Supply Locked', 'fa-lock', 'text-blue-400', 'dash-metric-locked')}
                ${renderMetricCard('Scarcity Rate', 'fa-fire', 'text-orange-500', 'dash-metric-scarcity')}
                ${renderMetricCard('Active Users', 'fa-users', 'text-green-400', 'dash-metric-users')}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div class="lg:col-span-8 flex flex-col gap-6">
                    
                    <div class="glass-panel relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <i class="fa-solid fa-rocket text-9xl"></i>
                        </div>
                        
                        <div class="flex flex-col md:flex-row gap-8 relative z-10">
                            <div class="flex-1 space-y-6">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <p class="text-zinc-400 text-sm font-medium">Net Claimable Rewards</p>
                                        <i class="fa-solid fa-circle-info text-zinc-600 text-xs cursor-help" title="Amount you receive after protocol fees and NFT discounts"></i>
                                    </div>
                                    
                                    <div id="dash-user-rewards" class="text-4xl font-bold text-white mt-2">--</div>
                                    <p id="dash-user-gross-rewards" class="text-xs text-zinc-500 mt-1 font-mono hidden">Gross: 0.0000 BKC</p>

                                    <button id="dashboardClaimBtn" class="mt-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 text-sm w-full sm:w-auto" disabled>
                                        <i class="fa-solid fa-gift mr-2"></i> Claim Net Amount
                                    </button>
                                </div>
                                
                                <div class="border-t border-zinc-700/50 pt-4 flex items-center gap-4">
                                    <div>
                                        <p class="text-zinc-400 text-xs">Your Net pStake</p>
                                        <p id="dash-user-pstake" class="text-xl font-bold text-purple-400 font-mono">--</p>
                                    </div>
                                    <div class="h-8 w-px bg-zinc-700"></div>
                                    <button class="text-sm text-purple-400 hover:text-white font-medium delegate-link transition-colors">
                                        <i class="fa-solid fa-plus-circle mr-1"></i> Delegate More
                                    </button>
                                </div>
                            </div>

                            <div id="dash-booster-area" class="flex-1 md:border-l md:border-zinc-700/50 md:pl-8 flex flex-col justify-center min-h-[160px]">
                                ${renderLoading()}
                            </div>
                        </div>
                    </div>

                    <div class="glass-panel">
                        <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-clock-rotate-left text-zinc-400"></i> Activity History
                            </h3>
                            
                            <div class="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
                                <select id="activity-filter-type" class="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-amber-500 cursor-pointer">
                                    <option value="ALL">All Types</option>
                                    <option value="STAKE">Staking</option>
                                    <option value="CLAIM">Claims</option>
                                    <option value="NFT">Market/NFT</option>
                                    <option value="GAME">Fortune Pool</option>
                                </select>
                                <button id="activity-sort-toggle" class="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 hover:bg-zinc-700 transition-colors">
                                    <i class="fa-solid fa-arrow-down-wide-short mr-1"></i> Newest
                                </button>
                            </div>
                        </div>

                        <div id="dash-activity-list" class="space-y-3 min-h-[200px]">
                            ${renderNoData("Connect wallet to view activity.")}
                        </div>
                        
                        <div id="dash-pagination-controls" class="flex justify-between items-center mt-6 pt-4 border-t border-zinc-700/30 hidden">
                            <button class="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors" id="page-prev">
                                <i class="fa-solid fa-chevron-left mr-1"></i> Prev
                            </button>
                            <span class="text-xs text-zinc-500 font-mono" id="page-indicator">Page 1</span>
                            <button class="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors" id="page-next">
                                Next <i class="fa-solid fa-chevron-right ml-1"></i>
                            </button>
                        </div>
                    </div>

                </div>

                <div class="lg:col-span-4 flex flex-col gap-6">
                    
                    <div class="glass-panel bg-gradient-to-b from-purple-900/20 to-transparent border-purple-500/20">
                        <h3 class="font-bold text-white mb-2">Grow your Capital</h3>
                        <p class="text-sm text-zinc-400 mb-4">Delegate $BKC to the Global Consensus Pool to earn passive yield.</p>
                        <button class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors delegate-link shadow-lg shadow-purple-900/20">
                            Go to Stake Pool <i class="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </div>

                    <div class="glass-panel">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-white">Network Status</h3>
                            <span class="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 animate-pulse">Operational</span>
                        </div>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-zinc-500">Validator Node</span>
                                <span class="text-white">Global Pool</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-zinc-500">Contract</span>
                                <a href="${addresses.delegationManager ? EXPLORER_BASE_URL + addresses.delegationManager : '#'}" target="_blank" class="text-blue-400 hover:underline">View on Scan</a>
                            </div>
                        </div>
                    </div>

                     <div class="glass-panel relative overflow-hidden border-cyan-500/20">
                        <div class="absolute inset-0 bg-cyan-900/10"></div>
                        <h3 class="font-bold text-white mb-2 relative z-10">Need a Boost?</h3>
                        <p class="text-sm text-zinc-400 mb-4 relative z-10">Don't want to buy an NFT? Rent one by the hour.</p>
                        <button class="w-full border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20 font-bold py-2 px-4 rounded-lg transition-colors relative z-10 go-to-rental">
                            Visit AirBNFT Market
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="booster-info-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 opacity-0 transition-opacity duration-300">
            <div class="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl transform scale-95 transition-transform duration-300 relative">
                <button id="close-booster-modal" class="absolute top-4 right-4 text-zinc-500 hover:text-white text-xl"><i class="fa-solid fa-xmark"></i></button>
                
                <div class="text-center mb-6">
                    <div class="inline-block bg-amber-500/20 p-4 rounded-full mb-3">
                        <i class="fa-solid fa-rocket text-4xl text-amber-500"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-white">Why use a Booster?</h3>
                </div>
                
                <div class="space-y-4">
                    <div class="flex gap-4 items-start bg-zinc-800/50 p-3 rounded-lg">
                        <i class="fa-solid fa-percent text-green-400 mt-1"></i>
                        <div>
                            <h4 class="text-white font-bold text-sm">Fee Discount</h4>
                            <p class="text-zinc-400 text-xs">Protocol fees (normally 5%) are reduced significantly. Higher tiers = Lower fees.</p>
                        </div>
                    </div>
                    <div class="flex gap-4 items-start bg-zinc-800/50 p-3 rounded-lg">
                        <i class="fa-solid fa-sack-dollar text-amber-400 mt-1"></i>
                        <div>
                            <h4 class="text-white font-bold text-sm">Maximize Rewards</h4>
                            <p class="text-zinc-400 text-xs">Keep more of what you earn from staking. A Diamond Booster can save you tons of BKC.</p>
                        </div>
                    </div>
                    <div class="flex gap-4 items-start bg-zinc-800/50 p-3 rounded-lg">
                        <i class="fa-solid fa-ticket text-purple-400 mt-1"></i>
                        <div>
                            <h4 class="text-white font-bold text-sm">Access to Features</h4>
                            <p class="text-zinc-400 text-xs">Some pools and notary services require specific NFT Tiers to access.</p>
                        </div>
                    </div>
                </div>
                
                <button class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg mt-6 go-to-store" onclick="document.getElementById('booster-info-modal').classList.add('hidden')">
                    Get a Booster Now
                </button>
            </div>
        </div>
    `;
    
    attachDashboardListeners();
}

function renderMetricCard(label, icon, iconColor, id) {
    return `
        <div class="glass-panel p-4 flex flex-col items-center text-center sm:items-start sm:text-left transition-transform hover:-translate-y-1">
            <div class="flex items-center gap-2 mb-2">
                <i class="fa-solid ${icon} ${iconColor}"></i>
                <span class="text-xs text-zinc-500 uppercase font-bold tracking-wider">${label}</span>
            </div>
            <p id="${id}" class="text-lg md:text-xl font-bold text-white truncate w-full">--</p>
        </div>
    `;
}

// ============================================================================
// 2. LÓGICA DE DADOS GLOBAIS
// ============================================================================

async function updateGlobalMetrics() {
    try {
        if (!State.bkcTokenContractPublic) return;

        const [totalSupply, totalPStake, maxSupply, tgeSupply] = await Promise.all([
            safeContractCall(State.bkcTokenContractPublic, 'totalSupply', [], 0n),
            safeContractCall(State.delegationManagerContractPublic, 'totalNetworkPStake', [], 0n),
            safeContractCall(State.bkcTokenContractPublic, 'MAX_SUPPLY', [], 0n),
            safeContractCall(State.bkcTokenContractPublic, 'TGE_SUPPLY', [], 0n)
        ]);

        let totalLocked = 0n;
        const contractKeys = ['delegationManager', 'fortunePool', 'rentalManager', 'rewardBoosterNFT', 'ecosystemManager', 'decentralizedNotary', 'faucet', 'publicSale', 'bkcDexPoolAddress'];
        
        if (addresses) Object.keys(addresses).forEach(k => { if (k.startsWith('pool_')) contractKeys.push(k); });

        const uniqueAddrs = new Set();
        for (const k of contractKeys) {
            const addr = addresses[k];
            if (addr && ethers.isAddress(addr)) uniqueAddrs.add(addr);
        }

        for (const addr of uniqueAddrs) {
            try { totalLocked += await safeContractCall(State.bkcTokenContractPublic, 'balanceOf', [addr], 0n); } catch {}
        }

        const scarcityPool = maxSupply - tgeSupply;
        const minted = totalSupply - tgeSupply;
        const scarcityRate = scarcityPool > 0n ? ((scarcityPool - minted) * 10000n / scarcityPool) : 0n;

        const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.innerHTML = val; };
        
        setTxt('dash-metric-supply', formatBigNumber(totalSupply).toLocaleString('en-US', { maximumFractionDigits: 0 }));
        setTxt('dash-metric-pstake', formatPStake(totalPStake));
        
        // Supply Locked (Visual Forte)
        let lockedText = "0%";
        if (totalSupply > 0n) {
            const percent = (Number(totalLocked * 10000n / totalSupply)/100).toFixed(1);
            const amount = formatBigNumber(totalLocked).toLocaleString('en-US', { maximumFractionDigits: 1, notation: "compact", compactDisplay: "short" });
            lockedText = `${percent}% <span class="text-lg text-zinc-300 ml-2 font-bold">(${amount} BKC)</span>`;
        }
        setTxt('dash-metric-locked', lockedText);
        
        setTxt('dash-metric-scarcity', `${(Number(scarcityRate)/100).toFixed(2)}%`);
        setTxt('dash-metric-users', (State.systemData?.activeUsers || 1240).toLocaleString());

    } catch (e) { console.error("Metrics Error", e); }
}

// ============================================================================
// 3. LÓGICA DE DADOS DO USUÁRIO
// ============================================================================

async function updateUserHub() {
    if (!State.isConnected) {
        const boosterArea = document.getElementById('dash-booster-area');
        if(boosterArea) {
            boosterArea.innerHTML = `
                <div class="text-center">
                    <p class="text-zinc-500 text-sm mb-2">Connect wallet to view status</p>
                    <button onclick="window.openConnectModal()" class="text-amber-400 hover:text-white text-sm font-bold border border-amber-400/30 px-4 py-2 rounded hover:bg-amber-400/10 transition-all">Connect Wallet</button>
                </div>`;
        }
        return;
    }

    try {
        await loadUserData(); 
        
        const claimDetails = await calculateClaimDetails();
        const { totalRewards, netClaimAmount } = claimDetails;
        
        animateClaimableRewards(netClaimAmount);

        const grossEl = document.getElementById('dash-user-gross-rewards');
        if (grossEl) {
            if (totalRewards > 0n) {
                grossEl.textContent = `Gross Reward: ${formatBigNumber(totalRewards).toFixed(4)} BKC`;
                grossEl.classList.remove('hidden');
            } else {
                grossEl.classList.add('hidden');
            }
        }
        
        const claimBtn = document.getElementById('dashboardClaimBtn');
        if(claimBtn) claimBtn.disabled = netClaimAmount <= 0n;

        const pStakeEl = document.getElementById('dash-user-pstake');
        if(pStakeEl) pStakeEl.textContent = formatPStake(State.userTotalPStake);

        const boosterData = await getHighestBoosterBoostFromAPI();
        renderBoosterCard(boosterData, claimDetails);

    } catch (e) { console.error("User Hub Error", e); }
}

function renderBoosterCard(data, claimDetails) {
    const container = document.getElementById('dash-booster-area');
    if (!container) return;

    const totalPending = claimDetails ? claimDetails.totalRewards : 0n;
    
    // CASO 1: SEM BOOSTER (Botão Learn More + Alerta)
    if (!data || data.highestBoost === 0) {
        const maxBoostBips = boosterTiers && boosterTiers.length > 0 
            ? boosterTiers.reduce((max, t) => t.boostBips > max ? t.boostBips : max, 0)
            : 2000;

        const potentialSaveWei = (totalPending * BigInt(maxBoostBips)) / 10000n;
        const potentialFormatted = formatBigNumber(potentialSaveWei).toFixed(4);

        const copyText = totalPending > 0n 
            ? `<span class="text-red-400 font-bold">Stop losing ${potentialFormatted} BKC</span> in fees.`
            : "Reduce your claim fees significantly.";

        container.innerHTML = `
            <div class="text-center animate-fadeIn">
                <div class="inline-block bg-red-900/20 rounded-full p-3 mb-2 border border-red-500/30">
                    <i class="fa-solid fa-triangle-exclamation text-2xl text-red-500"></i>
                </div>
                <h4 class="text-white font-bold mb-1">Fee Alert</h4>
                <p class="text-xs text-zinc-400 mb-3 max-w-[220px] mx-auto leading-relaxed">
                    ${copyText} <br>
                    <button id="open-booster-info" class="text-amber-400 hover:text-amber-300 underline font-bold mt-1">
                        Learn about Boosters
                    </button>
                </p>
                
                <div class="flex gap-2 justify-center">
                    <button class="go-to-store bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 px-4 rounded shadow-lg transition-colors">
                        Buy
                    </button>
                    <button class="go-to-rental bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold py-2 px-4 rounded shadow-lg transition-colors">
                        Rent
                    </button>
                </div>
            </div>
        `;
        return;
    }

    // CASO 2: COM BOOSTER (Visual Rico + Informações)
    const isRented = data.source === 'rented';
    const badgeColor = isRented ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30';
    const badgeText = isRented ? 'Rented Active' : 'Owner Active';

    let upgradeText = `<span class="text-green-400">Max efficiency active!</span>`;
    const currentBoost = data.highestBoost;
    const nextTier = boosterTiers.find(t => t.boostBips > currentBoost);
    
    if (nextTier && totalPending > 0n) {
        const diffBips = BigInt(nextTier.boostBips - currentBoost);
        const extraSaveWei = (totalPending * diffBips) / 10000n;
        upgradeText = `Upgrade to save <span class="text-green-400">+${formatBigNumber(extraSaveWei).toFixed(4)} BKC</span>`;
    } else if (nextTier) {
        upgradeText = `Next Tier: +${(nextTier.boostBips - currentBoost)/100}% Efficiency`;
    }

    // Busca a imagem oficial do Tier no config.js, caso a API não tenha retornado
    let finalImageUrl = data.imageUrl;
    if (!finalImageUrl || finalImageUrl.includes('placeholder')) {
        const tierInfo = boosterTiers.find(t => t.boostBips === currentBoost);
        if (tierInfo && tierInfo.realImg) finalImageUrl = tierInfo.realImg;
    }

    container.innerHTML = `
        <div class="flex flex-col items-center w-full animate-fadeIn">
            <div class="relative w-full bg-zinc-800/40 border border-zinc-700 rounded-xl p-3 flex items-center gap-4 overflow-hidden group hover:border-amber-500/30 transition-all nft-clickable-image cursor-pointer" data-address="${addresses.rewardBoosterNFT}" data-tokenid="${data.tokenId}">
                
                <div class="relative w-20 h-20 flex-shrink-0">
                    <img src="${finalImageUrl}" class="w-full h-full object-cover rounded-lg shadow-lg transition-transform group-hover:scale-105" onerror="this.src='./assets/bkc_logo_3d.png'">
                    <div class="absolute -top-2 -left-2 bg-black/80 text-amber-400 font-black text-xs px-2 py-1 rounded border border-amber-500/50 shadow-lg z-10">
                        +${data.highestBoost/100}%
                    </div>
                </div>

                <div class="flex-1 min-w-0 z-10">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-bold ${badgeColor} px-2 py-0.5 rounded border uppercase tracking-wider">${badgeText}</span>
                        <span class="text-[10px] text-zinc-500 font-mono">#${data.tokenId}</span>
                    </div>
                    <h4 class="text-white font-bold text-sm truncate">${data.boostName}</h4>
                    <p class="text-[11px] text-zinc-400 mt-1">${upgradeText}</p>
                </div>
                
                <div class="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 pointer-events-none"></div>
            </div>
            
            <button id="open-booster-info" class="text-[10px] text-zinc-500 hover:text-zinc-300 mt-2 underline">
                What are Boosters?
            </button>
        </div>
    `;
}

// ============================================================================
// 4. TABELA DE ATIVIDADES
// ============================================================================

async function fetchAndProcessActivities() {
    const listEl = document.getElementById('dash-activity-list');
    
    if (!State.isConnected) {
        if(listEl) listEl.innerHTML = renderNoData("Connect wallet to view history.");
        return;
    }

    try {
        if (listEl && (listEl.innerHTML === "" || listEl.innerText.includes("Connect"))) {
            listEl.innerHTML = renderLoading();
        }

        if (DashboardState.activities.length === 0) {
            const response = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
            if (!response.ok) throw new Error("API Error");
            DashboardState.activities = await response.json();
        }
        
        applyFiltersAndRender();

    } catch (e) {
        console.error("Activity Fetch Error:", e);
        if(listEl) listEl.innerHTML = renderError("Failed to load history.");
    }
}

function applyFiltersAndRender() {
    let result = [...DashboardState.activities];
    const type = DashboardState.filters.type;
    
    if (type !== 'ALL') {
        result = result.filter(item => {
            const t = item.type || '';
            if (type === 'STAKE') return t.includes('Delegation');
            if (type === 'UNSTAKE') return t.includes('Unstake');
            if (type === 'CLAIM') return t.includes('Reward') || t.includes('Claim');
            if (type === 'NFT') return t.includes('Booster') || t.includes('Rent');
            if (type === 'GAME') return t.includes('Fortune') || t.includes('Game');
            return true;
        });
    }

    result.sort((a, b) => {
        const tA = a.timestamp?._seconds || a.timestamp || 0;
        const tB = b.timestamp?._seconds || b.timestamp || 0;
        return DashboardState.filters.sort === 'NEWEST' ? tB - tA : tA - tB;
    });

    DashboardState.filteredActivities = result;
    DashboardState.pagination.currentPage = 1; 
    renderActivityPage();
}

function renderActivityPage() {
    const listEl = document.getElementById('dash-activity-list');
    const controlsEl = document.getElementById('dash-pagination-controls');
    if (!listEl) return;

    const { currentPage, itemsPerPage } = DashboardState.pagination;
    const totalItems = DashboardState.filteredActivities.length;
    
    if (totalItems === 0) {
        listEl.innerHTML = renderNoData("No activities found.");
        if(controlsEl) controlsEl.classList.add('hidden');
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = DashboardState.filteredActivities.slice(start, end);

    listEl.innerHTML = pageItems.map(item => {
        let timestamp = Number(item.timestamp?._seconds || item.timestamp);
        const dateStr = new Date(timestamp * 1000).toLocaleDateString();
        const timeStr = new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let icon = 'fa-circle', color = 'text-zinc-500', label = item.type;
        if(item.type === 'Delegation') { icon = 'fa-layer-group'; color = 'text-purple-400'; label = 'Staked BKC'; }
        if(item.type === 'Unstake') { icon = 'fa-unlock'; color = 'text-zinc-400'; label = 'Unstaked'; }
        if(item.type === 'DelegatorRewardClaimed') { icon = 'fa-gift'; color = 'text-amber-400'; label = 'Rewards Claimed'; }
        if(item.type === 'BoosterNFT') { icon = 'fa-bolt'; color = 'text-cyan-400'; label = 'Booster NFT'; }
        if(item.type === 'FortuneGameWin') { icon = 'fa-trophy'; color = 'text-yellow-400'; label = 'Fortune Win'; }
        
        const txLink = item.txHash ? `${EXPLORER_BASE_URL}${item.txHash}` : '#';
        const amountDisplay = item.amount ? `${formatBigNumber(BigInt(item.amount)).toFixed(2)}` : '';

        return `
            <a href="${txLink}" target="_blank" class="block bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-3 transition-colors group">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700 group-hover:border-zinc-500">
                            <i class="fa-solid ${icon} ${color} text-xs"></i>
                        </div>
                        <div>
                            <p class="text-white text-sm font-bold">${label}</p>
                            <p class="text-xs text-zinc-500">${dateStr} • ${timeStr}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        ${amountDisplay ? `<p class="text-white text-sm font-mono">${amountDisplay} <span class="text-xs text-zinc-500">BKC</span></p>` : ''}
                        <span class="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">View <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i></span>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    if(controlsEl) {
        controlsEl.classList.remove('hidden');
        const maxPage = Math.ceil(totalItems / itemsPerPage);
        
        document.getElementById('page-indicator').innerText = `Page ${currentPage} of ${maxPage}`;
        
        const prevBtn = document.getElementById('page-prev');
        const nextBtn = document.getElementById('page-next');
        
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage >= maxPage;
        
        prevBtn.style.opacity = currentPage === 1 ? '0.3' : '1';
        nextBtn.style.opacity = currentPage >= maxPage ? '0.3' : '1';
    }
}

// ============================================================================
// 5. LISTENERS
// ============================================================================

function attachDashboardListeners() {
    if (DOMElements.dashboard) {
        DOMElements.dashboard.addEventListener('click', async (e) => {
            const target = e.target;

            // NAVEGAÇÃO
            if (target.closest('.delegate-link')) { e.preventDefault(); window.navigateTo('mine'); }
            if (target.closest('.go-to-store')) { e.preventDefault(); window.navigateTo('store'); }
            if (target.closest('.go-to-rental')) { e.preventDefault(); window.navigateTo('rental'); }

            // ABRIR MODAL EDUCATIVO
            if (target.closest('#open-booster-info')) {
                e.preventDefault();
                const modal = document.getElementById('booster-info-modal');
                if(modal) {
                    modal.classList.remove('hidden');
                    setTimeout(() => { modal.classList.remove('opacity-0'); modal.firstElementChild.classList.remove('scale-95'); }, 10);
                }
            }

            // FECHAR MODAL EDUCATIVO
            if (target.closest('#close-booster-modal') || target === document.getElementById('booster-info-modal')) {
                e.preventDefault();
                const modal = document.getElementById('booster-info-modal');
                if(modal) {
                    modal.classList.add('opacity-0');
                    modal.firstElementChild.classList.add('scale-95');
                    setTimeout(() => modal.classList.add('hidden'), 300);
                }
            }

            // NFT Click
            const nftClick = target.closest('.nft-clickable-image');
            if (nftClick) {
                const address = nftClick.dataset.address;
                const id = nftClick.dataset.tokenid;
                if(address && id) addNftToWallet(address, id);
            }

            // Claim Button
            const claimBtn = target.closest('#dashboardClaimBtn');
            if (claimBtn && !claimBtn.disabled) {
                try {
                    claimBtn.innerHTML = '<div class="loader inline-block"></div>';
                    claimBtn.disabled = true;
                    const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
                    if (stakingRewards > 0n || minerRewards > 0n) {
                        const success = await executeUniversalClaim(stakingRewards, minerRewards, null);
                        if (success) {
                            showToast("Rewards claimed!", "success");
                            await updateUserHub();
                            DashboardState.activities = []; 
                            fetchAndProcessActivities();
                        }
                    }
                } catch (err) {
                    console.error(err);
                    showToast("Claim failed", "error");
                } finally {
                    claimBtn.innerHTML = '<i class="fa-solid fa-gift mr-2"></i> Claim Net Amount';
                    claimBtn.disabled = false;
                }
            }

            // Paginação
            if (target.closest('#page-prev')) {
                if (DashboardState.pagination.currentPage > 1) {
                    DashboardState.pagination.currentPage--;
                    renderActivityPage();
                }
            }
            if (target.closest('#page-next')) {
                const max = Math.ceil(DashboardState.filteredActivities.length / DashboardState.pagination.itemsPerPage);
                if (DashboardState.pagination.currentPage < max) {
                    DashboardState.pagination.currentPage++;
                    renderActivityPage();
                }
            }
            
            // Sort
            const sortBtn = target.closest('#activity-sort-toggle');
            if (sortBtn) {
                DashboardState.filters.sort = DashboardState.filters.sort === 'NEWEST' ? 'OLDEST' : 'NEWEST';
                sortBtn.innerHTML = DashboardState.filters.sort === 'NEWEST' 
                    ? '<i class="fa-solid fa-arrow-down-wide-short mr-1"></i> Newest' 
                    : '<i class="fa-solid fa-arrow-up-wide-short mr-1"></i> Oldest';
                applyFiltersAndRender();
            }
        });

        const filterSelect = document.getElementById('activity-filter-type');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                DashboardState.filters.type = e.target.value;
                applyFiltersAndRender();
            });
        }
    }
}

export const DashboardPage = {
    async render(isNewPage) {
        renderDashboardLayout();
        updateGlobalMetrics();
        if (State.isConnected) {
            await updateUserHub();
            await fetchAndProcessActivities();
        } else {
            const boosterArea = document.getElementById('dash-booster-area');
            if(boosterArea) {
                boosterArea.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center text-zinc-500">
                        <i class="fa-solid fa-wallet text-2xl mb-2 opacity-50"></i>
                        <span class="text-xs">Connect Wallet</span>
                    </div>
                `;
            }
        }
    },

    update(isConnected) {
        const now = Date.now();
        if (isConnected) {
            const activityListEl = document.getElementById('dash-activity-list');
            const hasActivityData = DashboardState.activities.length > 0;
            const isShowingPlaceholder = activityListEl && activityListEl.innerText.includes("Connect");

            if ((now - DashboardState.lastUpdate > 10000) || (!hasActivityData && isShowingPlaceholder)) {
                DashboardState.lastUpdate = now;
                updateUserHub(); 
                fetchAndProcessActivities(); 
            }
        }
    }
};