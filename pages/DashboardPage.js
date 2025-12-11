// js/pages/DashboardPage.js
// ✅ VERSION V7.0: Complete Redesign - New Metrics, Clean UI, Mobile-First

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
import { showToast, addNftToWallet } from '../ui-feedback.js';
import { addresses, boosterTiers } from '../config.js'; 

// --- LOCAL STATE ---
const DashboardState = {
    hasRenderedOnce: false,
    lastUpdate: 0,
    activities: [], 
    filteredActivities: [], 
    userProfile: null, 
    pagination: { currentPage: 1, itemsPerPage: 8 },
    filters: { type: 'ALL', sort: 'NEWEST' },
    // Cache para métricas (detectar variação)
    metricsCache: {}
};

// --- CONFIG ---
const EXPLORER_BASE_URL = "https://sepolia.arbiscan.io/tx/";
const CONTRACT_EXPLORER_URL = "https://sepolia.arbiscan.io/address/";
const FAUCET_API_URL = "https://api.backcoin.org/faucet";

// --- HELPERS ---
function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        const date = new Date(secs * 1000);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    } catch (e) { return 'Recent'; }
}

function formatCompact(num) {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toFixed(0);
}

function getScarcityColor(percent) {
    if (percent >= 70) return 'text-green-400';
    if (percent >= 40) return 'text-yellow-400';
    if (percent >= 20) return 'text-orange-400';
    return 'text-red-400';
}

function getScarcityBg(percent) {
    if (percent >= 70) return 'from-green-500/20';
    if (percent >= 40) return 'from-yellow-500/20';
    if (percent >= 20) return 'from-orange-500/20';
    return 'from-red-500/20';
}

// --- REWARDS ANIMATION ---
let animationFrameId = null;
let displayedRewardValue = 0n;

function animateClaimableRewards(targetNetValue) {
    const rewardsEl = document.getElementById('dash-user-rewards');
    if (!rewardsEl || !State.isConnected) {
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        return;
    }
    const diff = targetNetValue - displayedRewardValue;
    if (diff > -1000000000n && diff < 1000000000n) displayedRewardValue = targetNetValue;
    else displayedRewardValue += diff / 8n; 
    
    if (displayedRewardValue < 0n) displayedRewardValue = 0n;
    
    rewardsEl.innerHTML = `${formatBigNumber(displayedRewardValue).toFixed(4)} <span class="text-sm text-amber-500/80">BKC</span>`;
    
    if (displayedRewardValue !== targetNetValue) {
        animationFrameId = requestAnimationFrame(() => animateClaimableRewards(targetNetValue));
    }
}

// --- FAUCET ---
async function requestSmartFaucet(btnElement) {
    if (!State.isConnected || !State.userAddress) return showToast("Connect wallet first", "error");

    const originalHTML = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...`;

    try {
        const response = await fetch(`${FAUCET_API_URL}?address=${State.userAddress}`);
        const data = await response.json();

        if (response.ok && data.success) {
            showToast("✅ Starter Pack Sent!", "success");
            const widget = document.getElementById('dashboard-faucet-widget');
            if(widget) widget.classList.add('hidden');
            setTimeout(() => DashboardPage.update(true), 4000); 
        } else {
            const msg = data.error || "Faucet unavailable";
            if (msg.includes("Cooldown")) showToast(`⏳ ${msg}`, "warning");
            else showToast(`❌ ${msg}`, "error");
        }
    } catch (e) {
        showToast("Faucet Offline", "error");
    } finally {
        btnElement.disabled = false;
        btnElement.innerHTML = originalHTML;
    }
}

async function checkGasAndWarn() {
    try {
        const nativeBalance = await State.provider.getBalance(State.userAddress);
        if (nativeBalance < ethers.parseEther("0.002")) {
            const modal = document.getElementById('no-gas-modal-dash');
            if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
            return false;
        }
        return true;
    } catch (e) { return true; }
}

// ============================================================================
// 1. RENDER LAYOUT - CLEAN & MOBILE-FIRST
// ============================================================================

function renderDashboardLayout() {
    if (!DOMElements.dashboard) return;

    const ecosystemAddr = addresses.ecosystemManager || '';
    const explorerLink = ecosystemAddr ? `${CONTRACT_EXPLORER_URL}${ecosystemAddr}` : '#';

    DOMElements.dashboard.innerHTML = `
        <div class="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
            
            <!-- HEADER -->
            <div class="flex justify-between items-center">
                <h1 class="text-xl font-bold text-white">Dashboard</h1>
                <button id="manual-refresh-btn" class="text-xs bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all">
                    <i class="fa-solid fa-rotate"></i> <span class="hidden sm:inline">Sync</span>
                </button>
            </div>

            <!-- METRICS GRID - 5 cards responsive -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                ${renderMetricCard('Total Supply', 'fa-coins', 'dash-metric-supply', 'Total de tokens BKC em circulação')}
                ${renderMetricCard('Net pStake', 'fa-layer-group', 'dash-metric-pstake', 'Poder de stake total da rede', 'purple')}
                ${renderMetricCard('Taxas Arrecadadas', 'fa-chart-line', 'dash-metric-taxes', 'Mineração pós-TGE + taxas coletadas', 'blue')}
                ${renderMetricCard('Taxa de Escassez', 'fa-fire', 'dash-metric-scarcity', 'Porcentagem de tokens ainda disponíveis para mineração', 'orange')}
                ${renderMetricCard('Capital Travado', 'fa-lock', 'dash-metric-locked', 'Porcentagem do supply travado em contratos', 'green')}
            </div>

            <!-- MAIN CONTENT -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- LEFT: User Hub + Activity -->
                <div class="lg:col-span-2 flex flex-col gap-6">
                    
                    <!-- FAUCET WIDGET (conditional) -->
                    <div id="dashboard-faucet-widget" class="hidden glass-panel border-l-4 p-4">
                        <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div class="text-center sm:text-left">
                                <h3 id="faucet-title" class="text-white font-bold text-sm"></h3>
                                <p id="faucet-desc" class="text-xs text-zinc-400 mt-1"></p>
                            </div>
                            <button id="faucet-action-btn" class="w-full sm:w-auto font-bold py-2 px-5 rounded-lg text-sm transition-transform hover:scale-105"></button>
                        </div>
                    </div>

                    <!-- USER HUB - Rewards Card -->
                    <div class="glass-panel p-5 relative overflow-hidden">
                        <div class="absolute top-0 right-0 opacity-5">
                            <i class="fa-solid fa-rocket text-8xl"></i>
                        </div>
                        
                        <div class="flex flex-col md:flex-row gap-6 relative z-10">
                            <!-- Rewards Section -->
                            <div class="flex-1 space-y-4">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <p class="text-zinc-400 text-xs font-medium uppercase tracking-wider">Claimable Rewards</p>
                                        <span class="text-zinc-600 text-[10px] cursor-help" title="Valor líquido após taxas">ⓘ</span>
                                    </div>
                                    <div id="dash-user-rewards" class="text-3xl md:text-4xl font-bold text-white">--</div>
                                </div>

                                <div id="dash-user-gain-area" class="hidden p-2 bg-green-900/20 border border-green-500/20 rounded-lg inline-block">
                                    <p class="text-[10px] text-green-400 font-bold flex items-center gap-1">
                                        <i class="fa-solid fa-arrow-up"></i>
                                        +<span id="dash-user-potential-gain">0</span> BKC com NFT
                                    </p>
                                </div>

                                <button id="dashboardClaimBtn" class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg transition-all text-sm w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed" disabled>
                                    <i class="fa-solid fa-gift mr-2"></i> Claim
                                </button>
                                
                                <div class="flex items-center gap-3 pt-3 border-t border-zinc-700/50">
                                    <div>
                                        <p class="text-zinc-500 text-[10px] uppercase">Your pStake</p>
                                        <p id="dash-user-pstake" class="text-lg font-bold text-purple-400 font-mono">--</p>
                                    </div>
                                    <button class="text-xs text-purple-400 hover:text-white font-medium delegate-link transition-colors ml-auto">
                                        <i class="fa-solid fa-plus mr-1"></i> Stake More
                                    </button>
                                </div>
                            </div>

                            <!-- Booster Section -->
                            <div id="dash-booster-area" class="flex-1 md:border-l md:border-zinc-700/50 md:pl-6 flex flex-col justify-center min-h-[140px]">
                                ${renderLoading()}
                            </div>
                        </div>
                    </div>

                    <!-- ACTIVITY LIST -->
                    <div class="glass-panel p-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> Activity
                            </h3>
                            
                            <div class="flex gap-2">
                                <select id="activity-filter-type" class="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] rounded px-2 py-1 outline-none cursor-pointer">
                                    <option value="ALL">All</option>
                                    <option value="STAKE">Staking</option>
                                    <option value="CLAIM">Claims</option>
                                    <option value="NFT">NFT</option>
                                    <option value="GAME">Fortune</option>
                                </select>
                                <button id="activity-sort-toggle" class="bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] rounded px-2 py-1 hover:bg-zinc-700">
                                    <i class="fa-solid fa-arrow-down-wide-short"></i>
                                </button>
                            </div>
                        </div>

                        <div id="dash-activity-list" class="space-y-2 min-h-[150px] max-h-[400px] overflow-y-auto custom-scrollbar">
                            ${renderNoData("Connect wallet to view history")}
                        </div>
                        
                        <div id="dash-pagination-controls" class="flex justify-between items-center mt-4 pt-3 border-t border-zinc-700/30 hidden">
                            <button class="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors" id="page-prev">
                                <i class="fa-solid fa-chevron-left"></i> Prev
                            </button>
                            <span class="text-[10px] text-zinc-600 font-mono" id="page-indicator">1/1</span>
                            <button class="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors" id="page-next">
                                Next <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- RIGHT SIDEBAR -->
                <div class="flex flex-col gap-4">
                    
                    <!-- NETWORK STATUS with Contract Link -->
                    <div class="glass-panel p-4">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="text-sm font-bold text-white">Network</h3>
                            <span class="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1">
                                <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Live
                            </span>
                        </div>
                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between items-center">
                                <span class="text-zinc-500">Chain</span>
                                <span class="text-white font-mono">Arbitrum Sepolia</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-zinc-500">Contracts</span>
                                <span class="text-green-400">Synced</span>
                            </div>
                            <a href="${explorerLink}" target="_blank" class="flex justify-between items-center group hover:bg-zinc-800/50 -mx-2 px-2 py-1 rounded transition-colors">
                                <span class="text-zinc-500">Main Contract</span>
                                <span class="text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                                    View <i class="fa-solid fa-external-link text-[8px]"></i>
                                </span>
                            </a>
                        </div>
                    </div>

                    <!-- QUICK ACTIONS -->
                    <div class="glass-panel p-4 bg-gradient-to-b from-purple-900/20 to-transparent border-purple-500/20">
                        <h3 class="font-bold text-white text-sm mb-2">Earn Passive Yield</h3>
                        <p class="text-xs text-zinc-400 mb-3">Delegate BKC to the Global Pool</p>
                        <button class="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-lg text-sm delegate-link transition-colors">
                            Stake Now <i class="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </div>

                    <div class="glass-panel p-4 border-cyan-500/20">
                        <h3 class="font-bold text-white text-sm mb-2">Boost Rewards</h3>
                        <p class="text-xs text-zinc-400 mb-3">Rent an NFT by the hour</p>
                        <button class="w-full border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20 font-bold py-2 rounded-lg text-sm go-to-rental transition-colors">
                            AirBNFT Market
                        </button>
                    </div>

                    <!-- PORTFOLIO STATS (conditional) -->
                    <div id="dash-presale-stats" class="hidden glass-panel p-4 border-amber-500/20">
                        <h3 class="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">
                            <i class="fa-solid fa-wallet mr-1"></i> Portfolio
                        </h3>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-zinc-900/50 rounded p-2 border border-zinc-800">
                                <p class="text-[10px] text-zinc-500">Spent</p>
                                <p id="stats-total-spent" class="text-sm font-bold text-white">0 ETH</p>
                            </div>
                            <div class="bg-zinc-900/50 rounded p-2 border border-zinc-800">
                                <p class="text-[10px] text-zinc-500">NFTs</p>
                                <p id="stats-total-boosters" class="text-sm font-bold text-white">0</p>
                            </div>
                        </div>
                        <div id="stats-tier-badges" class="flex gap-1 flex-wrap mt-2"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- MODALS -->
        ${renderBoosterModal()}
        ${renderGasModal()}
    `;
    
    attachDashboardListeners();
}

function renderMetricCard(label, icon, id, tooltip, color = 'zinc') {
    const colorClasses = {
        zinc: 'text-zinc-400',
        purple: 'text-purple-400',
        blue: 'text-blue-400',
        orange: 'text-orange-400',
        green: 'text-green-400'
    };
    const iconColor = colorClasses[color] || colorClasses.zinc;
    
    return `
        <div class="glass-panel p-3 sm:p-4 group hover:border-zinc-600 transition-all cursor-default" title="${tooltip}">
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid ${icon} ${iconColor} text-xs"></i>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">${label}</span>
            </div>
            <p id="${id}" class="text-base sm:text-lg font-bold text-white truncate">--</p>
            <div id="${id}-trend" class="text-[10px] text-zinc-600 mt-0.5 hidden"></div>
        </div>
    `;
}

function renderBoosterModal() {
    return `
        <div id="booster-info-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4 opacity-0 transition-opacity duration-300">
            <div class="bg-zinc-900 border border-amber-500/50 rounded-xl max-w-sm w-full p-5 shadow-2xl transform scale-95 transition-transform duration-300 relative">
                <button id="close-booster-modal" class="absolute top-3 right-3 text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                
                <div class="text-center mb-4">
                    <div class="inline-block bg-amber-500/20 p-3 rounded-full mb-2">
                        <i class="fa-solid fa-rocket text-3xl text-amber-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Boost Efficiency</h3>
                    <p class="text-zinc-400 text-xs mt-1">NFT holders earn up to 2x more</p>
                </div>
                
                <div class="space-y-2 bg-zinc-800/50 p-3 rounded-lg text-sm">
                    <div class="flex justify-between"><span class="text-zinc-400">No NFT:</span><span class="text-zinc-500 font-bold">50%</span></div>
                    <div class="flex justify-between"><span class="text-zinc-400">Bronze:</span><span class="text-yellow-300 font-bold">80%</span></div>
                    <div class="flex justify-between"><span class="text-amber-400">Diamond:</span><span class="text-green-400 font-bold">100%</span></div>
                </div>
                
                <div class="grid grid-cols-2 gap-2 mt-4">
                    <button class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-lg text-sm go-to-store">Buy NFT</button>
                    <button class="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2.5 rounded-lg text-sm go-to-rental">Rent NFT</button>
                </div>
            </div>
        </div>
    `;
}

function renderGasModal() {
    return `
        <div id="no-gas-modal-dash" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-xs w-full p-5 text-center">
                <div class="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/30">
                    <i class="fa-solid fa-gas-pump text-xl text-red-500"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">No Gas</h3>
                <p class="text-zinc-400 text-xs mb-4">You need Arbitrum Sepolia ETH</p>
                
                <button id="emergency-faucet-btn" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-lg text-sm mb-3">
                    <i class="fa-solid fa-hand-holding-medical mr-2"></i> Get Free Gas
                </button>
                
                <button id="close-gas-modal-dash" class="text-zinc-500 hover:text-white text-xs">Close</button>
            </div>
        </div>
    `;
}

// ============================================================================
// 2. DATA LOGIC - UPDATED METRICS
// ============================================================================

async function updateGlobalMetrics() {
    try {
        if (!State.bkcTokenContractPublic) return;

        // Fetch all data in parallel
        const [totalSupply, totalPStake, maxSupply, tgeSupply] = await Promise.all([
            safeContractCall(State.bkcTokenContractPublic, 'totalSupply', [], 0n),
            safeContractCall(State.delegationManagerContractPublic, 'totalNetworkPStake', [], 0n),
            safeContractCall(State.bkcTokenContractPublic, 'MAX_SUPPLY', [], 0n),
            safeContractCall(State.bkcTokenContractPublic, 'TGE_SUPPLY', [], 0n)
        ]);

        // Get Treasury Address & Balance
        let treasuryAddr = addresses.treasuryWallet;
        if (!treasuryAddr || treasuryAddr === ethers.ZeroAddress) {
            try {
                if (State.ecosystemManagerContractPublic) {
                    treasuryAddr = await safeContractCall(State.ecosystemManagerContractPublic, 'getTreasuryAddress', [], ethers.ZeroAddress);
                }
            } catch(e) {}
        }
        
        let treasuryBalance = 0n;
        if (treasuryAddr && treasuryAddr !== ethers.ZeroAddress) {
            treasuryBalance = await safeContractCall(State.bkcTokenContractPublic, 'balanceOf', [treasuryAddr], 0n);
        }

        // Get locked amounts from various contracts
        let fortunePoolBalance = 0n;
        let delegationBalance = 0n;
        
        try {
            if (addresses.fortunePool) {
                fortunePoolBalance = await safeContractCall(State.bkcTokenContractPublic, 'balanceOf', [addresses.fortunePool], 0n);
            }
            if (addresses.delegationManager) {
                delegationBalance = await safeContractCall(State.bkcTokenContractPublic, 'balanceOf', [addresses.delegationManager], 0n);
            }
        } catch(e) {}

        // ═══════════════════════════════════════════════════════════════════
        // CALCULATE NEW METRICS
        // ═══════════════════════════════════════════════════════════════════
        
        // 1. Total Supply (unchanged)
        const supplyNum = formatBigNumber(totalSupply);
        
        // 2. Net pStake (unchanged)
        const pStakeNum = formatBigNumber(totalPStake);
        
        // 3. TAXAS ARRECADADAS = (TotalSupply - TGE) + TreasuryBalance
        // Represents: Mined tokens post-TGE + Fees collected
        const totalMined = totalSupply > tgeSupply ? totalSupply - tgeSupply : 0n;
        const totalTaxes = totalMined + treasuryBalance;
        const taxesNum = formatBigNumber(totalTaxes);
        
        // 4. TAXA DE ESCASSEZ = % remaining to mint
        const remainingToMint = maxSupply > totalSupply ? maxSupply - totalSupply : 0n;
        const mintableBase = 160000000n * 10n**18n;
        let scarcityPercent = 0;
        if (mintableBase > 0n) {
            scarcityPercent = Number((remainingToMint * 10000n) / mintableBase) / 100;
        }
        if (scarcityPercent > 100) scarcityPercent = 100;
        
        // 5. CAPITAL TRAVADO = % of supply locked in contracts
        const totalLocked = delegationBalance + fortunePoolBalance + treasuryBalance;
        let lockedPercent = 0;
        if (totalSupply > 0n) {
            lockedPercent = Number((totalLocked * 10000n) / totalSupply) / 100;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // UPDATE UI
        // ═══════════════════════════════════════════════════════════════════
        
        const setMetric = (id, value, suffix = '') => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `${value}${suffix ? ` <span class="text-xs text-zinc-500">${suffix}</span>` : ''}`;
        };
        
        // 1. Total Supply
        setMetric('dash-metric-supply', formatCompact(supplyNum), 'BKC');
        
        // 2. Net pStake
        setMetric('dash-metric-pstake', formatPStake(totalPStake));
        
        // 3. Taxas Arrecadadas
        setMetric('dash-metric-taxes', formatCompact(taxesNum), 'BKC');
        
        // 4. Taxa de Escassez (with color coding)
        const scarcityEl = document.getElementById('dash-metric-scarcity');
        if (scarcityEl) {
            const color = getScarcityColor(scarcityPercent);
            scarcityEl.innerHTML = `<span class="${color}">${scarcityPercent.toFixed(1)}%</span>`;
        }
        
        // 5. Capital Travado
        const lockedEl = document.getElementById('dash-metric-locked');
        if (lockedEl) {
            const lockColor = lockedPercent > 30 ? 'text-green-400' : lockedPercent > 10 ? 'text-yellow-400' : 'text-zinc-400';
            lockedEl.innerHTML = `<span class="${lockColor}">${lockedPercent.toFixed(1)}%</span>`;
        }

        // Store in cache for trend detection (future feature)
        DashboardState.metricsCache = {
            supply: supplyNum,
            pstake: pStakeNum,
            taxes: taxesNum,
            scarcity: scarcityPercent,
            locked: lockedPercent,
            timestamp: Date.now()
        };

    } catch (e) { 
        console.error("Metrics Error", e); 
    }
}

async function fetchUserProfile() {
    if (!State.userAddress) return;
    try {
        const response = await fetch(`${API_ENDPOINTS.getBoosters.replace('/boosters/', '/profile/')}/${State.userAddress}`);
        if (response.ok) {
            DashboardState.userProfile = await response.json();
            renderPresaleStats(DashboardState.userProfile);
        }
    } catch (e) {}
}

function renderPresaleStats(profile) {
    const statsDiv = document.getElementById('dash-presale-stats');
    if (!statsDiv || !profile || !profile.presale) return;
    if (!profile.presale.totalBoosters || profile.presale.totalBoosters === 0) return;

    statsDiv.classList.remove('hidden');

    const spentWei = profile.presale.totalSpentWei || 0;
    const spentEth = parseFloat(ethers.formatEther(BigInt(spentWei))).toFixed(4);
    
    document.getElementById('stats-total-spent').innerText = `${spentEth} ETH`;
    document.getElementById('stats-total-boosters').innerText = profile.presale.totalBoosters || 0;

    const badgesContainer = document.getElementById('stats-tier-badges');
    if (badgesContainer && profile.presale.tiersOwned) {
        let html = '';
        Object.entries(profile.presale.tiersOwned).forEach(([tierId, count]) => {
            const tierConfig = boosterTiers[Number(tierId)-1]; 
            const name = tierConfig ? tierConfig.name : `T${tierId}`;
            html += `<span class="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">${count}x ${name}</span>`;
        });
        if(html) badgesContainer.innerHTML = html;
    }
}

async function updateUserHub(forceRefresh = false) {
    if (!State.isConnected) {
        const boosterArea = document.getElementById('dash-booster-area');
        if(boosterArea) {
            boosterArea.innerHTML = `
                <div class="text-center">
                    <p class="text-zinc-500 text-xs mb-2">Connect wallet to view</p>
                    <button onclick="window.openConnectModal()" class="text-amber-400 hover:text-white text-xs font-bold border border-amber-400/30 px-3 py-1.5 rounded hover:bg-amber-400/10">
                        Connect
                    </button>
                </div>`;
        }
        return;
    }

    try {
        const rewardsEl = document.getElementById('dash-user-rewards');
        if (forceRefresh && rewardsEl) {
            rewardsEl.classList.add('animate-pulse', 'opacity-70');
        }

        await loadUserData(forceRefresh); 
        fetchUserProfile();

        // Faucet Widget Logic
        const widget = document.getElementById('dashboard-faucet-widget');
        if (widget) {
            const ethBalance = await State.provider.getBalance(State.userAddress);
            const bkcBalance = State.currentUserBalance;
            const minEth = ethers.parseEther("0.002");
            const minBkc = ethers.parseUnits("10", 18);

            const title = widget.querySelector('#faucet-title');
            const desc = widget.querySelector('#faucet-desc');
            const btn = widget.querySelector('#faucet-action-btn');

            if (ethBalance < minEth) {
                widget.classList.remove('hidden', 'border-l-amber-500');
                widget.classList.add('border-l-red-500');
                title.innerHTML = '<i class="fa-solid fa-gas-pump text-red-500"></i> Low Gas';
                desc.innerHTML = 'Get free ETH to transact';
                btn.innerHTML = '<i class="fa-solid fa-hand-holding-medical mr-1"></i> Get Gas';
                btn.className = "w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-5 rounded-lg text-sm";
            } else if (bkcBalance < minBkc) {
                widget.classList.remove('hidden', 'border-l-red-500');
                widget.classList.add('border-l-amber-500');
                title.innerHTML = '<i class="fa-solid fa-faucet text-amber-500"></i> Get Tokens';
                desc.innerHTML = 'Claim 20 free BKC';
                btn.innerHTML = '<i class="fa-solid fa-coins mr-1"></i> Get BKC';
                btn.className = "w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-5 rounded-lg text-sm";
            } else {
                widget.classList.add('hidden');
            }
        }

        const claimDetails = await calculateClaimDetails();
        const { totalRewards, netClaimAmount, feeAmount } = claimDetails;
        
        animateClaimableRewards(netClaimAmount);

        const gainArea = document.getElementById('dash-user-gain-area');
        const gainVal = document.getElementById('dash-user-potential-gain');
        if (gainArea && gainVal) {
            if (totalRewards > 0n && feeAmount > 0n) {
                gainVal.textContent = formatBigNumber(feeAmount).toFixed(2);
                gainArea.classList.remove('hidden');
            } else {
                gainArea.classList.add('hidden');
            }
        }
        
        const claimBtn = document.getElementById('dashboardClaimBtn');
        if(claimBtn) claimBtn.disabled = netClaimAmount <= 0n;

        const pStakeEl = document.getElementById('dash-user-pstake');
        if(pStakeEl) pStakeEl.textContent = formatPStake(State.userTotalPStake);

        const boosterData = await getHighestBoosterBoostFromAPI();
        renderBoosterCard(boosterData, claimDetails);

        if (rewardsEl) rewardsEl.classList.remove('animate-pulse', 'opacity-70');

    } catch (e) { console.error("User Hub Error", e); }
}

function renderBoosterCard(data, claimDetails) {
    const container = document.getElementById('dash-booster-area');
    if (!container) return;

    const hasValidBooster = data && data.highestBoost > 0 && data.source !== 'none';
    const currentBoostBips = hasValidBooster ? data.highestBoost : 0;
    
    let efficiency = 50 + (currentBoostBips / 100);
    if (efficiency > 100) efficiency = 100;

    if (efficiency < 100) {
        const feeAmount = claimDetails?.feeAmount || 0n; 
        const lostFormatted = formatBigNumber(feeAmount).toFixed(2);

        const effColor = efficiency >= 80 ? 'from-yellow-500 to-amber-500' : 'from-red-500 to-orange-500';

        container.innerHTML = `
            <div class="text-center">
                <div class="flex items-center justify-center gap-2 mb-2">
                    <i class="fa-solid fa-gauge-high text-amber-500"></i>
                    <span class="text-white font-bold text-sm">Efficiency</span>
                </div>
                
                <div class="w-full bg-zinc-800 rounded-full h-2 mb-1 overflow-hidden">
                    <div class="bg-gradient-to-r ${effColor} h-2 rounded-full transition-all" style="width: ${efficiency}%"></div>
                </div>
                <div class="flex justify-between text-[10px] text-zinc-500 mb-3">
                    <span>${efficiency}%</span>
                    <span>100%</span>
                </div>

                ${feeAmount > 0n ? `<p class="text-[10px] text-amber-400 mb-3">-${lostFormatted} BKC in fees</p>` : ''}
                
                <div class="flex gap-2 justify-center">
                    <button class="go-to-store bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1.5 px-3 rounded">Buy NFT</button>
                    <button class="go-to-rental bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-bold py-1.5 px-3 rounded">Rent</button>
                </div>
            </div>
        `;
        return;
    }

    // 100% Efficiency - Show NFT card
    const isRented = data.source === 'rented';
    const badgeColor = isRented ? 'bg-cyan-500/20 text-cyan-300' : 'bg-green-500/20 text-green-300';
    const badgeText = isRented ? 'Rented' : 'Owned';

    let finalImageUrl = data.imageUrl;
    if (!finalImageUrl || finalImageUrl.includes('placeholder')) {
        const tierInfo = boosterTiers.find(t => t.boostBips === currentBoostBips);
        if (tierInfo && tierInfo.realImg) finalImageUrl = tierInfo.realImg;
    }

    container.innerHTML = `
        <div class="flex items-center gap-3 bg-zinc-800/40 border border-green-500/20 rounded-lg p-3 nft-clickable-image cursor-pointer" data-address="${addresses.rewardBoosterNFT}" data-tokenid="${data.tokenId}">
            <div class="relative w-14 h-14 flex-shrink-0">
                <img src="${finalImageUrl}" class="w-full h-full object-cover rounded-lg" onerror="this.src='./assets/bkc_logo_3d.png'">
                <div class="absolute -top-1 -left-1 bg-green-500 text-black font-black text-[9px] px-1.5 py-0.5 rounded">
                    100%
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-[9px] font-bold ${badgeColor} px-1.5 py-0.5 rounded uppercase">${badgeText}</span>
                    <span class="text-[9px] text-zinc-600">#${data.tokenId}</span>
                </div>
                <h4 class="text-white font-bold text-xs truncate">${data.boostName}</h4>
                <p class="text-[10px] text-green-400"><i class="fa-solid fa-check-circle mr-1"></i>Max Yield</p>
            </div>
        </div>
    `;
}

// ============================================================================
// 3. ACTIVITY TABLE
// ============================================================================

async function fetchAndProcessActivities() {
    const listEl = document.getElementById('dash-activity-list');
    if (!State.isConnected) {
        if(listEl) listEl.innerHTML = renderNoData("Connect wallet to view history");
        return;
    }

    try {
        if (listEl && DashboardState.activities.length === 0) {
            listEl.innerHTML = renderLoading();
        }

        if (DashboardState.activities.length === 0) {
            const response = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
            if (!response.ok) throw new Error("API Error");
            DashboardState.activities = await response.json();
        }
        
        applyFiltersAndRender();

    } catch (e) {
        if(listEl) listEl.innerHTML = renderError("Failed to load");
    }
}

function applyFiltersAndRender() {
    let result = [...DashboardState.activities];
    const type = DashboardState.filters.type;
    const normalize = (t) => (t || '').toUpperCase();

    if (type !== 'ALL') {
        result = result.filter(item => {
            const t = normalize(item.type);
            if (type === 'STAKE') return t.includes('DELEGATION') || t.includes('STAKE') || t.includes('UNSTAKE');
            if (type === 'CLAIM') return t.includes('REWARD') || t.includes('CLAIM');
            if (type === 'NFT') return t.includes('BOOSTER') || t.includes('RENT') || t.includes('NFT') || t.includes('TRANSFER');
            if (type === 'GAME') return t.includes('FORTUNE') || t.includes('GAME') || t.includes('REQUEST') || t.includes('RESULT');
            return true;
        });
    }

    result.sort((a, b) => {
        const getTime = (obj) => {
            if (obj.timestamp && obj.timestamp._seconds) return obj.timestamp._seconds;
            if (obj.createdAt && obj.createdAt._seconds) return obj.createdAt._seconds;
            if (obj.timestamp) return new Date(obj.timestamp).getTime() / 1000;
            return 0;
        };
        return DashboardState.filters.sort === 'NEWEST' ? getTime(b) - getTime(a) : getTime(a) - getTime(b);
    });

    DashboardState.filteredActivities = result;
    DashboardState.pagination.currentPage = 1; 
    renderActivityPage();
}

function renderActivityPage() {
    const listEl = document.getElementById('dash-activity-list');
    const controlsEl = document.getElementById('dash-pagination-controls');
    if (!listEl) return;

    if (DashboardState.filteredActivities.length === 0) {
        listEl.innerHTML = renderNoData("No activities found");
        if(controlsEl) controlsEl.classList.add('hidden');
        return;
    }

    const start = (DashboardState.pagination.currentPage - 1) * DashboardState.pagination.itemsPerPage;
    const end = start + DashboardState.pagination.itemsPerPage;
    const pageItems = DashboardState.filteredActivities.slice(start, end);

    listEl.innerHTML = pageItems.map(item => {
        const dateStr = formatDate(item.timestamp || item.createdAt);
        
        let icon = 'fa-circle', color = 'text-zinc-500', label = item.type;
        const t = (item.type || '').toUpperCase();
        
        if(t.includes('DELEGATION') || t.includes('STAKE')) { icon = 'fa-arrow-up'; color = 'text-green-400'; label = 'Staked'; }
        else if(t.includes('UNSTAKE')) { icon = 'fa-arrow-down'; color = 'text-orange-400'; label = 'Unstaked'; }
        else if(t.includes('REWARD') || t.includes('CLAIM')) { icon = 'fa-gift'; color = 'text-amber-400'; label = 'Claimed'; }
        else if(t.includes('NFTBOUGHT')) { icon = 'fa-cart-shopping'; color = 'text-green-400'; label = 'Bought NFT'; }
        else if(t.includes('BOOSTERBUY')) { icon = 'fa-star'; color = 'text-yellow-300'; label = 'Minted NFT'; }
        else if(t.includes('NFTSOLD')) { icon = 'fa-money-bill'; color = 'text-orange-400'; label = 'Sold NFT'; }
        else if(t.includes('RENTAL')) { icon = 'fa-house'; color = 'text-blue-400'; label = 'Rental'; }
        else if(t.includes('NOTARY')) { icon = 'fa-file-signature'; color = 'text-indigo-400'; label = 'Notarized'; }
        else if(t.includes('FAUCET')) { icon = 'fa-faucet'; color = 'text-cyan-400'; label = 'Faucet'; }
        else if(t === 'GAMEREQUESTED' || t.includes('FORTUNEGAMEREQUEST')) { icon = 'fa-dice'; color = 'text-purple-400'; label = 'Fortune Bet'; }
        else if(t === 'GAMERESULT' || t.includes('FORTUNEGAMERESULT')) { 
            const isWin = item.details?.isWin;
            icon = isWin ? 'fa-trophy' : 'fa-dice'; 
            color = isWin ? 'text-yellow-400' : 'text-zinc-400'; 
            label = isWin ? 'Won!' : 'Lost'; 
        }
        
        const txLink = item.txHash ? `${EXPLORER_BASE_URL}${item.txHash}` : '#';
        let rawAmount = item.amount || item.details?.amount || "0";
        const amountNum = formatBigNumber(BigInt(rawAmount));
        const amountDisplay = amountNum > 0.01 ? amountNum.toFixed(2) : '';

        return `
            <a href="${txLink}" target="_blank" class="flex items-center justify-between p-2.5 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-colors group">
                <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center">
                        <i class="fa-solid ${icon} ${color} text-[10px]"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">${label}</p>
                        <p class="text-[10px] text-zinc-600">${dateStr}</p>
                    </div>
                </div>
                <div class="text-right">
                    ${amountDisplay ? `<p class="text-white text-xs font-mono">${amountDisplay}</p>` : ''}
                    <i class="fa-solid fa-external-link text-[8px] text-zinc-600 group-hover:text-blue-400 transition-colors"></i>
                </div>
            </a>
        `;
    }).join('');

    if(controlsEl) {
        const maxPage = Math.ceil(DashboardState.filteredActivities.length / DashboardState.pagination.itemsPerPage);
        if (maxPage > 1) {
            controlsEl.classList.remove('hidden');
            document.getElementById('page-indicator').innerText = `${DashboardState.pagination.currentPage}/${maxPage}`;
            document.getElementById('page-prev').disabled = DashboardState.pagination.currentPage === 1;
            document.getElementById('page-next').disabled = DashboardState.pagination.currentPage >= maxPage;
        } else {
            controlsEl.classList.add('hidden');
        }
    }
}

// ============================================================================
// 4. EVENT LISTENERS
// ============================================================================

function attachDashboardListeners() {
    if (!DOMElements.dashboard) return;
    
    DOMElements.dashboard.addEventListener('click', async (e) => {
        const target = e.target;

        // Refresh
        if (target.closest('#manual-refresh-btn')) {
            const btn = target.closest('#manual-refresh-btn');
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i>`;
            await updateUserHub(true); 
            await updateGlobalMetrics();
            DashboardState.activities = []; 
            await fetchAndProcessActivities(); 
            setTimeout(() => { btn.innerHTML = `<i class="fa-solid fa-rotate"></i> <span class="hidden sm:inline">Sync</span>`; btn.disabled = false; }, 1000);
        }

        // Faucet
        if (target.closest('#faucet-action-btn')) await requestSmartFaucet(target.closest('#faucet-action-btn'));
        if (target.closest('#emergency-faucet-btn')) await requestSmartFaucet(target.closest('#emergency-faucet-btn'));

        // Navigation
        if (target.closest('.delegate-link')) { e.preventDefault(); window.navigateTo('mine'); }
        if (target.closest('.go-to-store')) { e.preventDefault(); window.navigateTo('store'); }
        if (target.closest('.go-to-rental')) { e.preventDefault(); window.navigateTo('rental'); }

        // Booster Modal
        if (target.closest('#open-booster-info')) {
            const modal = document.getElementById('booster-info-modal');
            if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10); }
        }
        if (target.closest('#close-booster-modal') || target.id === 'booster-info-modal') {
            const modal = document.getElementById('booster-info-modal');
            if(modal) { modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95'); setTimeout(() => modal.classList.add('hidden'), 200); }
        }

        // Gas Modal
        if (target.closest('#close-gas-modal-dash') || target.id === 'no-gas-modal-dash') {
            const modal = document.getElementById('no-gas-modal-dash');
            if(modal) { modal.classList.remove('flex'); modal.classList.add('hidden'); }
        }

        // NFT Wallet
        const nftClick = target.closest('.nft-clickable-image');
        if (nftClick) {
            const address = nftClick.dataset.address;
            const id = nftClick.dataset.tokenid;
            if(address && id) addNftToWallet(address, id);
        }

        // Claim
        const claimBtn = target.closest('#dashboardClaimBtn');
        if (claimBtn && !claimBtn.disabled) {
            try {
                claimBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
                claimBtn.disabled = true;

                const hasGas = await checkGasAndWarn();
                if (!hasGas) { claimBtn.innerHTML = '<i class="fa-solid fa-gift mr-2"></i> Claim'; claimBtn.disabled = false; return; }

                const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
                if (stakingRewards > 0n || minerRewards > 0n) {
                    const success = await executeUniversalClaim(stakingRewards, minerRewards, null);
                    if (success) {
                        showToast("Rewards claimed!", "success");
                        await updateUserHub(true); 
                        DashboardState.activities = []; 
                        fetchAndProcessActivities();
                    }
                }
            } catch (err) {
                showToast("Claim failed", "error");
            } finally {
                claimBtn.innerHTML = '<i class="fa-solid fa-gift mr-2"></i> Claim';
                claimBtn.disabled = false;
            }
        }

        // Pagination
        if (target.closest('#page-prev') && DashboardState.pagination.currentPage > 1) {
            DashboardState.pagination.currentPage--; renderActivityPage();
        }
        if (target.closest('#page-next')) {
            const max = Math.ceil(DashboardState.filteredActivities.length / DashboardState.pagination.itemsPerPage);
            if (DashboardState.pagination.currentPage < max) { DashboardState.pagination.currentPage++; renderActivityPage(); }
        }

        // Sort Toggle
        if (target.closest('#activity-sort-toggle')) {
            DashboardState.filters.sort = DashboardState.filters.sort === 'NEWEST' ? 'OLDEST' : 'NEWEST';
            applyFiltersAndRender();
        }
    });

    // Filter Select
    const filterSelect = document.getElementById('activity-filter-type');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            DashboardState.filters.type = e.target.value;
            applyFiltersAndRender();
        });
    }
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const DashboardPage = {
    async render(isNewPage) {
        renderDashboardLayout();
        updateGlobalMetrics();
        if (State.isConnected) {
            await updateUserHub(false); 
            fetchAndProcessActivities();
        }
    },

    update(isConnected) {
        const now = Date.now();
        if (isConnected) {
            if (now - DashboardState.lastUpdate > 10000) {
                DashboardState.lastUpdate = now;
                updateGlobalMetrics();
                updateUserHub(false); 
                fetchAndProcessActivities(); 
            }
        }
    }
};