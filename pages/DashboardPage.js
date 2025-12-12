// js/pages/DashboardPage.js
// ✅ VERSION V8.2: Fixed Mining Power, Fees, TVL display + Backend integration

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
import { executeUniversalClaim, getFortunePoolStatus } from '../modules/transactions.js';
import {
    formatBigNumber, formatPStake, renderLoading,
    renderNoData, renderError
} from '../utils.js';
import { showToast, addNftToWallet } from '../ui-feedback.js';
import { addresses, boosterTiers } from '../config.js';

// ============================================================================
// LOCAL STATE
// ============================================================================
const DashState = {
    lastUpdate: 0,
    activities: [],
    pagination: { page: 1, perPage: 20, total: 0 },
    filters: { type: 'ALL' },
    metrics: {
        totalSupply: 0n,
        maxSupply: 0n,
        tgeSupply: 0n,
        networkPStake: 0n,
        tvl: 0n,
        tvlPercent: 0,
        miningPowerPercent: 100,
        feesCollected: 0n,
        prizePool: 0n
    },
    faucet: { canClaim: false, cooldownLeft: 0, loading: false },
    isLoadingActivities: false,
    isLoadingMetrics: false
};

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const EXPLORER_ADDR = "https://sepolia.arbiscan.io/address/";
const CACHE_TTL = 30000; // 30s cache
const FAUCET_API = "https://faucet-4wvdcuoouq-uc.a.run.app";

// ============================================================================
// HELPERS
// ============================================================================
const fmt = {
    num: (n) => {
        if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
        return n.toFixed(0);
    },
    bkc: (wei) => {
        const n = formatBigNumber(wei);
        if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
        return n.toFixed(2);
    },
    percent: (n) => `${n.toFixed(1)}%`,
    addr: (a) => a ? `${a.slice(0,6)}...${a.slice(-4)}` : '',
    time: (ts) => {
        if (!ts) return 'Just now';
        const secs = ts.seconds || ts._seconds || (new Date(ts).getTime() / 1000);
        const diff = Math.floor(Date.now() / 1000 - secs);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
        return new Date(secs * 1000).toLocaleDateString();
    },
    cooldown: (secs) => {
        if (secs <= 0) return 'Ready';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
};

// Skeleton loader component
const Skeleton = (w = 'w-20', h = 'h-6') => 
    `<div class="${w} ${h} bg-zinc-800 rounded animate-pulse"></div>`;

// ============================================================================
// MAIN RENDER
// ============================================================================
function render() {
    // Fallback: try to get dashboard element directly if DOMElements is not set
    const dashboardEl = DOMElements.dashboard || document.getElementById('dashboard');
    
    if (!dashboardEl) {
        console.warn('❌ Dashboard element not found');
        return;
    }
    
    // Update DOMElements if it was null
    if (!DOMElements.dashboard) {
        DOMElements.dashboard = dashboardEl;
    }
    
    console.log('📊 Dashboard render started');

    DOMElements.dashboard.innerHTML = `
        <div class="min-h-screen pb-24 md:pb-10">
            <!-- MOBILE HEADER -->
            <header class="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50 -mx-4 px-4 py-3 md:hidden">
                <div class="flex items-center justify-between">
                    <h1 class="text-lg font-bold text-white">Dashboard</h1>
                    <button id="dash-refresh" class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/50 active:bg-zinc-700 transition-colors">
                        <i class="fa-solid fa-rotate text-zinc-400"></i>
                    </button>
                </div>
            </header>

            <!-- DESKTOP HEADER -->
            <div class="hidden md:flex items-center justify-between mb-6">
                <h1 class="text-2xl font-bold text-white">Dashboard</h1>
                <button id="dash-refresh-desktop" class="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-white transition-all">
                    <i class="fa-solid fa-rotate"></i> Refresh
                </button>
            </div>

            <!-- HERO: BALANCE & REWARDS -->
            <section id="hero-section" class="mt-4 md:mt-0">
                ${renderHeroSection()}
            </section>

            <!-- FAUCET CARD -->
            <section id="faucet-section" class="mt-4">
                ${renderFaucetCard()}
            </section>

            <!-- METRICS GRID -->
            <section id="metrics-section" class="mt-6">
                ${renderMetricsGrid()}
            </section>

            <!-- QUICK ACTIONS (Mobile) -->
            <section class="mt-6 md:hidden">
                ${renderQuickActions()}
            </section>

            <!-- TWO COLUMN LAYOUT -->
            <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- TRANSACTIONS -->
                <section id="transactions-section" class="lg:col-span-2">
                    ${renderTransactionsCard()}
                </section>

                <!-- SIDEBAR -->
                <aside class="space-y-4 hidden lg:block">
                    ${renderSidebarCards()}
                </aside>
            </div>
        </div>
    `;

    attachListeners();
    loadAllData();
}

// ============================================================================
// HERO SECTION - Balance & Rewards
// ============================================================================
function renderHeroSection() {
    return `
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800">
            <!-- Background Pattern -->
            <div class="absolute inset-0 opacity-5">
                <div class="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-3xl"></div>
                <div class="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
            </div>

            <div class="relative p-5 md:p-6">
                <!-- Balance Row -->
                <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <!-- Left: Balance -->
                    <div class="flex-1">
                        <p class="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Your Balance</p>
                        <div class="flex items-baseline gap-2">
                            <span id="hero-balance" class="text-3xl md:text-4xl font-bold text-white">--</span>
                            <span class="text-lg text-amber-500 font-medium">BKC</span>
                        </div>
                        <p id="hero-pstake" class="text-sm text-purple-400 mt-1">
                            <i class="fa-solid fa-bolt mr-1"></i>
                            <span>-- pStake</span>
                        </p>
                    </div>

                    <!-- Right: Rewards -->
                    <div class="flex-1 md:text-right">
                        <p class="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Claimable Rewards</p>
                        <div class="flex items-baseline gap-2 md:justify-end">
                            <span id="hero-rewards" class="text-3xl md:text-4xl font-bold text-green-400">--</span>
                            <span class="text-lg text-green-500/70 font-medium">BKC</span>
                        </div>
                        <button id="claim-rewards-btn" disabled
                            class="mt-3 w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-lg shadow-green-900/20 disabled:shadow-none">
                            <i class="fa-solid fa-gift mr-2"></i> Claim Rewards
                        </button>
                    </div>
                </div>

                <!-- Booster Status Bar -->
                <div id="booster-bar" class="mt-5 pt-4 border-t border-zinc-800/50">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div id="booster-icon" class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                <i class="fa-solid fa-rocket text-zinc-600"></i>
                            </div>
                            <div>
                                <p id="booster-name" class="text-sm font-medium text-zinc-400">No Booster Active</p>
                                <p id="booster-discount" class="text-xs text-zinc-600">0% fee discount</p>
                            </div>
                        </div>
                        <button data-nav="store" class="text-xs text-amber-500 hover:text-amber-400 font-medium">
                            Get Booster <i class="fa-solid fa-chevron-right ml-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// FAUCET CARD
// ============================================================================
function renderFaucetCard() {
    return `
        <div id="faucet-card" class="hidden rounded-xl bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 p-4">
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-faucet text-cyan-400"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-white">Testnet Faucet</p>
                        <p id="faucet-status" class="text-xs text-zinc-400">Get free BKC + ETH</p>
                    </div>
                </div>
                <button id="faucet-btn" 
                    class="flex-shrink-0 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-lg text-sm transition-all">
                    <i class="fa-solid fa-droplet mr-2"></i> Claim
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// METRICS GRID
// ============================================================================
function renderMetricsGrid() {
    return `
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            ${metricCard('Total Supply', 'metric-supply', 'fa-coins', 'amber')}
            ${metricCard('TVL', 'metric-tvl', 'fa-lock', 'green')}
            ${metricCard('Mining Power', 'metric-scarcity', 'fa-fire', 'orange')}
            ${metricCard('Net pStake', 'metric-pstake', 'fa-bolt', 'purple')}
            ${metricCard('Prize Pool', 'metric-prize', 'fa-trophy', 'yellow')}
            ${metricCard('Total Fees', 'metric-fees', 'fa-chart-line', 'blue')}
        </div>
    `;
}

function metricCard(label, id, icon, color) {
    const colors = {
        amber: 'text-amber-400 bg-amber-500/10',
        green: 'text-green-400 bg-green-500/10',
        orange: 'text-orange-400 bg-orange-500/10',
        purple: 'text-purple-400 bg-purple-500/10',
        yellow: 'text-yellow-400 bg-yellow-500/10',
        blue: 'text-blue-400 bg-blue-500/10'
    };
    const [textColor, bgColor] = colors[color].split(' ');

    return `
        <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/50 transition-colors">
            <div class="flex items-center gap-2 mb-2">
                <div class="w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center">
                    <i class="fa-solid ${icon} ${textColor} text-xs"></i>
                </div>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">${label}</span>
            </div>
            <p id="${id}" class="text-lg font-bold text-white truncate">${Skeleton('w-16', 'h-6')}</p>
            <p id="${id}-sub" class="text-[10px] text-zinc-600 mt-1 truncate">&nbsp;</p>
        </div>
    `;
}

// ============================================================================
// QUICK ACTIONS (Mobile)
// ============================================================================
function renderQuickActions() {
    return `
        <div class="grid grid-cols-3 gap-3">
            <button data-nav="mine" class="flex flex-col items-center gap-2 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl active:bg-zinc-800 transition-colors w-full">
                <div class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-layer-group text-purple-400"></i>
                </div>
                <span class="text-xs font-medium text-zinc-300">Stake</span>
            </button>
            <button data-nav="store" class="flex flex-col items-center gap-2 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl active:bg-zinc-800 transition-colors w-full">
                <div class="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-store text-amber-400"></i>
                </div>
                <span class="text-xs font-medium text-zinc-300">Store</span>
            </button>
            <button data-nav="actions" class="flex flex-col items-center gap-2 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl active:bg-zinc-800 transition-colors w-full">
                <div class="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-dice text-pink-400"></i>
                </div>
                <span class="text-xs font-medium text-zinc-300">Fortune</span>
            </button>
        </div>
    `;
}

// ============================================================================
// TRANSACTIONS CARD
// ============================================================================
function renderTransactionsCard() {
    return `
        <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-zinc-800/50">
                <h3 class="font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i>
                    Your Transactions
                </h3>
                <select id="tx-filter" class="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-1.5 outline-none">
                    <option value="ALL">All Types</option>
                    <option value="STAKE">Staking</option>
                    <option value="CLAIM">Claims</option>
                    <option value="NFT">NFT</option>
                    <option value="GAME">Fortune</option>
                    <option value="NOTARY">Notary</option>
                </select>
            </div>

            <!-- Transaction List -->
            <div id="tx-list" class="divide-y divide-zinc-800/30 min-h-[300px] max-h-[600px] overflow-y-auto">
                ${renderTxSkeleton(5)}
            </div>

            <!-- Pagination -->
            <div id="tx-pagination" class="flex items-center justify-between p-4 border-t border-zinc-800/50 bg-zinc-900/30">
                <button id="tx-prev" disabled class="flex items-center gap-2 text-sm text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <i class="fa-solid fa-chevron-left"></i> Previous
                </button>
                <span id="tx-page-info" class="text-xs text-zinc-600 font-mono">Page 1</span>
                <button id="tx-next" disabled class="flex items-center gap-2 text-sm text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    Next <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
}

function renderTxSkeleton(count) {
    return Array(count).fill(0).map(() => `
        <div class="flex items-center gap-4 p-4">
            <div class="w-10 h-10 rounded-full bg-zinc-800 animate-pulse"></div>
            <div class="flex-1 space-y-2">
                <div class="w-24 h-4 bg-zinc-800 rounded animate-pulse"></div>
                <div class="w-16 h-3 bg-zinc-800/50 rounded animate-pulse"></div>
            </div>
            <div class="w-16 h-4 bg-zinc-800 rounded animate-pulse"></div>
        </div>
    `).join('');
}

// ============================================================================
// SIDEBAR CARDS
// ============================================================================
function renderSidebarCards() {
    return `
        <!-- Network Status -->
        <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-white text-sm">Network</h3>
                <span class="flex items-center gap-1.5 text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Synced
                </span>
            </div>
            <div class="space-y-3 text-xs">
                <div class="flex justify-between">
                    <span class="text-zinc-500">Chain</span>
                    <span class="text-white font-medium">Arbitrum Sepolia</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-zinc-500">Block</span>
                    <span id="current-block" class="text-zinc-400 font-mono">--</span>
                </div>
                <a href="${EXPLORER_ADDR}${addresses.ecosystemManager || ''}" target="_blank" 
                   class="flex justify-between items-center hover:bg-zinc-800/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                    <span class="text-zinc-500">Contracts</span>
                    <span class="text-blue-400 flex items-center gap-1">
                        View <i class="fa-solid fa-external-link text-[8px]"></i>
                    </span>
                </a>
            </div>
        </div>

        <!-- Yield CTA -->
        <div class="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/20 rounded-xl p-4">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-coins text-purple-400"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white text-sm">Earn Yield</h3>
                    <p class="text-xs text-zinc-400">Stake BKC, earn rewards</p>
                </div>
            </div>
            <button data-nav="mine" class="block w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-lg text-sm text-center transition-colors">
                Start Staking <i class="fa-solid fa-arrow-right ml-2"></i>
            </button>
        </div>

        <!-- Fortune CTA -->
        <div class="bg-gradient-to-br from-pink-900/30 to-pink-900/10 border border-pink-500/20 rounded-xl p-4">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-dice text-pink-400"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white text-sm">Fortune Pool</h3>
                    <p class="text-xs text-zinc-400">Win up to 100x</p>
                </div>
            </div>
            <button data-nav="actions" class="block w-full border border-pink-500/30 text-pink-400 hover:bg-pink-900/20 font-bold py-2.5 rounded-lg text-sm text-center transition-colors">
                Play Now
            </button>
        </div>

        <!-- Protocol Stats -->
        <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <h3 class="font-bold text-white text-sm mb-4">Protocol Stats</h3>
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-xs text-zinc-500">Max Supply</span>
                    <span id="stat-max-supply" class="text-xs text-zinc-300 font-mono">--</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-zinc-500">Mined</span>
                    <span id="stat-mined" class="text-xs text-zinc-300 font-mono">--</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-zinc-500">Remaining</span>
                    <span id="stat-remaining" class="text-xs text-green-400 font-mono">--</span>
                </div>
                <div class="w-full bg-zinc-800 rounded-full h-2 mt-2">
                    <div id="stat-progress" class="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all" style="width: 0%"></div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadAllData() {
    // Load in parallel for speed
    await Promise.allSettled([
        loadMetrics(),
        loadUserData(),
        loadTransactions(),
        checkFaucetStatus()
    ]);
}

async function loadMetrics() {
    if (DashState.isLoadingMetrics) return;
    DashState.isLoadingMetrics = true;

    try {
        // Fetch from backend API (has accurate miningPower and fees)
        const systemStatsPromise = fetch(API_ENDPOINTS.systemStats || 'https://getsystemstats-4wvdcuoouq-uc.a.run.app')
            .then(r => r.json())
            .catch(() => null);

        // Parallel fetch from blockchain
        const [totalSupply, maxSupply, tgeSupply, networkPStake, fortuneStatus, systemStats] = await Promise.allSettled([
            safeContractCall(State.bkcTokenContractPublic, 'totalSupply', [], 0n),
            safeContractCall(State.bkcTokenContractPublic, 'MAX_SUPPLY', [], 21000000n * 10n**18n),
            safeContractCall(State.bkcTokenContractPublic, 'TGE_SUPPLY', [], 10000000n * 10n**18n),
            safeContractCall(State.delegationManagerContractPublic, 'totalNetworkPStake', [], 0n),
            getFortunePoolStatus(),
            systemStatsPromise
        ]);

        // Process values
        const supply = totalSupply.status === 'fulfilled' ? totalSupply.value : 0n;
        const max = maxSupply.status === 'fulfilled' ? maxSupply.value : 21000000n * 10n**18n;
        const tge = tgeSupply.status === 'fulfilled' ? tgeSupply.value : 10000000n * 10n**18n;
        const pstake = networkPStake.status === 'fulfilled' ? networkPStake.value : 0n;
        const fortune = fortuneStatus.status === 'fulfilled' ? fortuneStatus.value : { prizePool: 0n };
        const stats = systemStats.status === 'fulfilled' ? systemStats.value : null;

        // Calculate metrics
        const minableTokens = max - tge; // Tokens that can be mined
        const minedTokens = supply > tge ? supply - tge : 0n;
        const remainingToMine = minableTokens - minedTokens;
        
        // Mining Power from backend (more accurate) or calculate locally
        let miningPowerPercent = 100;
        if (stats?.miningPowerBips !== undefined) {
            miningPowerPercent = Number(stats.miningPowerBips) / 100;
        } else if (minableTokens > 0n) {
            miningPowerPercent = Number((remainingToMine * 10000n) / minableTokens) / 100;
        }

        // Fees from backend
        let feesCollected = 0n;
        if (stats?.totalFeesCollected) {
            try {
                feesCollected = BigInt(stats.totalFeesCollected);
            } catch (e) {
                feesCollected = 0n;
            }
        }

        // TVL = pStake (locked in delegation)
        const tvl = pstake;
        const tvlPercent = supply > 0n ? Number((tvl * 10000n) / supply) / 100 : 0;

        // Store metrics
        DashState.metrics = {
            totalSupply: supply,
            maxSupply: max,
            tgeSupply: tge,
            networkPStake: pstake,
            tvl,
            tvlPercent,
            miningPowerPercent,
            minedTokens,
            remainingToMine,
            prizePool: fortune.prizePool || 0n,
            feesCollected,
            lastUpdate: stats?.lastUpdate || null
        };

        // Update UI
        updateMetricsUI();

    } catch (e) {
        console.error('Metrics load error:', e);
    } finally {
        DashState.isLoadingMetrics = false;
    }
}

function updateMetricsUI() {
    const m = DashState.metrics;

    // Total Supply
    setEl('metric-supply', fmt.bkc(m.totalSupply));
    setEl('metric-supply-sub', `of ${fmt.bkc(m.maxSupply)} max`);

    // TVL
    if (m.tvl === 0n) {
        setEl('metric-tvl', '0.00');
        setEl('metric-tvl-sub', 'no stakes yet');
    } else {
        setEl('metric-tvl', fmt.bkc(m.tvl));
        setEl('metric-tvl-sub', `${m.tvlPercent.toFixed(1)}% of supply`);
    }

    // Mining Power (was Scarcity)
    const mpColor = m.miningPowerPercent > 50 ? 'text-green-400' : m.miningPowerPercent > 20 ? 'text-yellow-400' : 'text-red-400';
    setEl('metric-scarcity', `<span class="${mpColor}">${m.miningPowerPercent.toFixed(1)}%</span>`, true);
    setEl('metric-scarcity-sub', 'mining power');

    // Network pStake
    if (m.networkPStake === 0n) {
        setEl('metric-pstake', '0');
        setEl('metric-pstake-sub', 'no stakers yet');
    } else {
        setEl('metric-pstake', formatPStake(m.networkPStake));
        setEl('metric-pstake-sub', 'total staking power');
    }

    // Prize Pool
    setEl('metric-prize', fmt.bkc(m.prizePool));
    setEl('metric-prize-sub', 'Fortune Pool');

    // Fees Collected
    if (m.feesCollected > 0n) {
        setEl('metric-fees', fmt.bkc(m.feesCollected));
        setEl('metric-fees-sub', 'total collected');
    } else {
        setEl('metric-fees', '0.00');
        setEl('metric-fees-sub', 'total collected');
    }

    // Sidebar stats
    setEl('stat-max-supply', fmt.bkc(m.maxSupply));
    setEl('stat-mined', fmt.bkc(m.minedTokens || 0n));
    setEl('stat-remaining', fmt.bkc(m.remainingToMine || 0n));
    
    const progressEl = document.getElementById('stat-progress');
    if (progressEl) {
        const progress = 100 - m.miningPowerPercent;
        progressEl.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
}

async function updateUserUI() {
    if (!State.isConnected) {
        setEl('hero-balance', '0.00');
        setEl('hero-rewards', '0.00');
        setEl('hero-pstake', '<i class="fa-solid fa-bolt mr-1"></i> 0 pStake');
        return;
    }

    // Balance
    const balance = State.currentUserBalance || 0n;
    setEl('hero-balance', fmt.bkc(balance));

    // pStake
    const userPStake = State.userTotalPStake || 0n;
    setEl('hero-pstake', `<i class="fa-solid fa-bolt mr-1"></i> ${formatPStake(userPStake)} pStake`, true);

    // Rewards
    try {
        const { netClaimAmount } = await calculateClaimDetails();
        setEl('hero-rewards', fmt.bkc(netClaimAmount));
        
        const claimBtn = document.getElementById('claim-rewards-btn');
        if (claimBtn) {
            claimBtn.disabled = netClaimAmount <= 0n;
        }
    } catch (e) {
        setEl('hero-rewards', '0.00');
    }

    // Booster
    try {
        const booster = await getHighestBoosterBoostFromAPI();
        const boostBips = booster?.highestBoost || 0;
        const discountPercent = boostBips / 100;
        
        setEl('booster-name', booster?.boostName || 'No Booster Active');
        setEl('booster-discount', `${discountPercent}% fee discount`);
        
        const iconEl = document.getElementById('booster-icon');
        if (iconEl && boostBips > 0) {
            const tier = boosterTiers.find(t => t.boostBips === boostBips);
            iconEl.innerHTML = `<img src="${tier?.realImg || 'assets/bkc_logo_3d.png'}" class="w-full h-full rounded-full object-cover" onerror="this.outerHTML='<i class=\\'fa-solid fa-rocket text-amber-400\\'></i>'" />`;
            iconEl.classList.remove('bg-zinc-800');
        }
    } catch (e) {
        console.warn('Booster load error:', e);
    }
}

async function loadTransactions() {
    if (!State.isConnected || !State.userAddress) {
        renderNoTransactions();
        return;
    }

    DashState.isLoadingActivities = true;

    try {
        const response = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}?limit=100`);
        if (!response.ok) throw new Error('API Error');
        
        const data = await response.json();
        DashState.activities = Array.isArray(data) ? data : [];
        DashState.pagination.total = DashState.activities.length;
        DashState.pagination.page = 1;
        
        renderTransactions();

    } catch (e) {
        console.warn('Transactions load error:', e);
        DashState.activities = [];
        renderNoTransactions();
    } finally {
        DashState.isLoadingActivities = false;
    }
}

function renderTransactions() {
    const listEl = document.getElementById('tx-list');
    if (!listEl) return;

    let filtered = [...DashState.activities];
    
    // Apply filter
    const filterType = DashState.filters.type;
    if (filterType !== 'ALL') {
        filtered = filtered.filter(tx => {
            const t = (tx.type || '').toUpperCase();
            if (filterType === 'STAKE') return t.includes('DELEGAT') || t.includes('UNSTAKE') || t.includes('STAKE');
            if (filterType === 'CLAIM') return t.includes('CLAIM') || t.includes('REWARD');
            if (filterType === 'NFT') return t.includes('NFT') || t.includes('BUY') || t.includes('SELL') || t.includes('RENTAL');
            if (filterType === 'GAME') return t.includes('GAME') || t.includes('FORTUNE');
            if (filterType === 'NOTARY') return t.includes('NOTARY');
            return true;
        });
    }

    // Pagination
    const { page, perPage } = DashState.pagination;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageItems = filtered.slice(start, end);
    const totalPages = Math.ceil(filtered.length / perPage);

    if (pageItems.length === 0) {
        listEl.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 text-center">
                <div class="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-receipt text-zinc-600 text-2xl"></i>
                </div>
                <p class="text-zinc-500 text-sm">No transactions found</p>
                <p class="text-zinc-600 text-xs mt-1">Start using the protocol to see activity</p>
            </div>
        `;
    } else {
        listEl.innerHTML = pageItems.map(tx => renderTxItem(tx)).join('');
    }

    // Update pagination controls
    const prevBtn = document.getElementById('tx-prev');
    const nextBtn = document.getElementById('tx-next');
    const pageInfo = document.getElementById('tx-page-info');

    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${page} of ${totalPages || 1}`;
}

function renderTxItem(tx) {
    const type = (tx.type || '').toUpperCase();
    let icon = 'fa-circle', color = 'text-zinc-400', label = 'Transaction';

    // Type mapping
    if (type.includes('DELEGAT') || type.includes('STAKE')) {
        icon = 'fa-layer-group'; color = 'text-purple-400'; label = 'Staked';
    } else if (type.includes('UNSTAKE')) {
        icon = 'fa-arrow-right-from-bracket'; color = 'text-orange-400'; label = 'Unstaked';
    } else if (type.includes('CLAIM') || type.includes('REWARD')) {
        icon = 'fa-gift'; color = 'text-green-400'; label = 'Claimed';
    } else if (type.includes('BUY') || type.includes('BOUGHT')) {
        icon = 'fa-cart-plus'; color = 'text-amber-400'; label = 'Bought NFT';
    } else if (type.includes('SELL') || type.includes('SOLD')) {
        icon = 'fa-tag'; color = 'text-red-400'; label = 'Sold NFT';
    } else if (type.includes('RENTAL') || type.includes('RENT')) {
        icon = 'fa-handshake'; color = 'text-cyan-400'; label = 'Rental';
    } else if (type.includes('NOTARY')) {
        icon = 'fa-file-signature'; color = 'text-indigo-400'; label = 'Notarized';
    } else if (type.includes('FAUCET')) {
        icon = 'fa-faucet'; color = 'text-cyan-400'; label = 'Faucet';
    } else if (type.includes('GAME')) {
        const isWin = tx.details?.isWin || tx.details?.prizeWon > 0;
        icon = isWin ? 'fa-trophy' : 'fa-dice';
        color = isWin ? 'text-yellow-400' : 'text-pink-400';
        label = isWin ? 'Fortune Win!' : 'Fortune';
    }

    const amount = tx.amount || tx.details?.amount || '0';
    const amountNum = formatBigNumber(BigInt(amount));
    const amountStr = amountNum > 0.01 ? amountNum.toFixed(2) : '';
    const timeStr = fmt.time(tx.timestamp || tx.createdAt);
    const txLink = tx.txHash ? `${EXPLORER_TX}${tx.txHash}` : '#';

    return `
        <a href="${txLink}" target="_blank" rel="noopener" 
           class="flex items-center gap-4 p-4 hover:bg-zinc-800/30 transition-colors group">
            <div class="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid ${icon} ${color} text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate">${label}</p>
                <p class="text-xs text-zinc-500">${timeStr}</p>
            </div>
            <div class="text-right flex-shrink-0">
                ${amountStr ? `<p class="text-sm font-mono text-white">${amountStr}</p>` : ''}
                <i class="fa-solid fa-external-link text-[10px] text-zinc-600 group-hover:text-blue-400 transition-colors"></i>
            </div>
        </a>
    `;
}

function renderNoTransactions() {
    const listEl = document.getElementById('tx-list');
    if (listEl) {
        listEl.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 text-center">
                <div class="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-wallet text-zinc-600 text-2xl"></i>
                </div>
                <p class="text-zinc-500 text-sm">Connect wallet to see transactions</p>
            </div>
        `;
    }
}

// ============================================================================
// FAUCET API - Oracle pays gas, user receives BKC + ETH
// ============================================================================
async function requestFaucetAPI(btnElement) {
    if (!State.isConnected || !State.userAddress) {
        showToast("Connect wallet first", "error");
        return false;
    }

    const originalHTML = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Requesting...`;

    try {
        console.log('📡 Calling Faucet API for:', State.userAddress);
        
        const response = await fetch(`${FAUCET_API}?address=${State.userAddress}`);
        const data = await response.json();

        console.log('📡 Faucet API response:', data);

        if (response.ok && data.success) {
            showToast("✅ Tokens sent! Check your wallet in a few seconds.", "success");
            
            // Hide faucet card after success
            const card = document.getElementById('faucet-card');
            if (card) card.classList.add('hidden');
            
            // Refresh data after a delay (wait for tx to confirm)
            setTimeout(() => {
                loadAllData();
                updateUserUI();
            }, 5000);
            
            return true;
        } else {
            // Handle specific error messages
            const msg = data.error || data.message || "Faucet unavailable";
            
            if (msg.toLowerCase().includes('cooldown') || msg.toLowerCase().includes('already')) {
                showToast(`⏳ ${msg}`, "warning");
            } else if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('empty')) {
                showToast("🚫 Faucet is empty. Contact admin.", "error");
            } else {
                showToast(`❌ ${msg}`, "error");
            }
            return false;
        }
    } catch (e) {
        console.error('Faucet API Error:', e);
        
        if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
            showToast("🔌 Faucet API offline. Try again later.", "error");
        } else {
            showToast("❌ Faucet request failed", "error");
        }
        return false;
    } finally {
        btnElement.disabled = false;
        btnElement.innerHTML = originalHTML;
    }
}

async function checkFaucetStatus() {
    if (!State.isConnected) {
        hideFaucet();
        return;
    }

    try {
        // Check if user has low balance
        const balance = State.currentUserBalance || 0n;
        const threshold = ethers.parseEther("100"); // Show faucet if < 100 BKC

        if (balance < threshold) {
            showFaucet(true);
        } else {
            hideFaucet();
        }
    } catch (e) {
        hideFaucet();
    }
}

function showFaucet(canClaim) {
    const card = document.getElementById('faucet-card');
    const btn = document.getElementById('faucet-btn');
    const status = document.getElementById('faucet-status');
    
    if (card) card.classList.remove('hidden');
    if (btn) btn.disabled = !canClaim;
    if (status) status.textContent = canClaim ? 'Get free BKC + ETH for testing' : 'Cooldown active';
}

function hideFaucet() {
    const card = document.getElementById('faucet-card');
    if (card) card.classList.add('hidden');
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function attachListeners() {
    const dash = DOMElements.dashboard || document.getElementById('dashboard');
    if (!dash) {
        console.warn('❌ Dashboard element not found for event listeners');
        return;
    }
    
    console.log('📌 Dashboard listeners attached');

    dash.addEventListener('click', async (e) => {
        const target = e.target;
        
        // Navigation buttons (data-nav) - CHECK FIRST
        const navBtn = target.closest('[data-nav]');
        if (navBtn) {
            e.preventDefault();
            const pageId = navBtn.dataset.nav;
            console.log('🔗 Navigation click:', pageId);
            if (pageId && window.navigateTo) {
                window.navigateTo(pageId);
            }
            return;
        }

        // Refresh buttons
        if (target.closest('#dash-refresh') || target.closest('#dash-refresh-desktop')) {
            const btn = target.closest('#dash-refresh') || target.closest('#dash-refresh-desktop');
            console.log('🔄 Refresh clicked');
            btn.querySelector('i')?.classList.add('fa-spin');
            await loadAllData();
            await updateUserUI();
            setTimeout(() => btn.querySelector('i')?.classList.remove('fa-spin'), 500);
            return;
        }

        // Claim rewards
        if (target.closest('#claim-rewards-btn')) {
            const btn = target.closest('#claim-rewards-btn');
            console.log('💰 Claim clicked, disabled:', btn.disabled);
            if (btn.disabled) return;
            
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Claiming...';

            try {
                const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
                if (stakingRewards > 0n || minerRewards > 0n) {
                    const booster = await getHighestBoosterBoostFromAPI();
                    const success = await executeUniversalClaim(stakingRewards, minerRewards, booster?.tokenId || 0, btn);
                    if (success) {
                        await updateUserUI();
                        loadTransactions();
                    }
                }
            } catch (e) {
                showToast('Claim failed', 'error');
            } finally {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        }

        // Faucet - Uses API (Oracle pays gas)
        if (target.closest('#faucet-btn')) {
            console.log('💧 Faucet clicked');
            const btn = target.closest('#faucet-btn');
            await requestFaucetAPI(btn);
        }

        // Pagination
        if (target.closest('#tx-prev') && DashState.pagination.page > 1) {
            DashState.pagination.page--;
            renderTransactions();
        }
        if (target.closest('#tx-next')) {
            const maxPage = Math.ceil(DashState.activities.length / DashState.pagination.perPage);
            if (DashState.pagination.page < maxPage) {
                DashState.pagination.page++;
                renderTransactions();
            }
        }
    });

    // Filter change
    const filterEl = document.getElementById('tx-filter');
    if (filterEl) {
        filterEl.addEventListener('change', (e) => {
            DashState.filters.type = e.target.value;
            DashState.pagination.page = 1;
            renderTransactions();
        });
    }
}

// ============================================================================
// HELPERS
// ============================================================================
function setEl(id, value, isHTML = false) {
    const el = document.getElementById(id);
    if (el) {
        if (isHTML) el.innerHTML = value;
        else el.textContent = value;
    }
}

// ============================================================================
// EXPORT
// ============================================================================
export const DashboardPage = {
    async render(isNewPage) {
        render();
        
        if (State.isConnected) {
            await updateUserUI();
        }
    },

    async update(isConnected) {
        const now = Date.now();
        if (now - DashState.lastUpdate < 10000) return; // Throttle 10s
        DashState.lastUpdate = now;

        await loadMetrics();
        
        if (isConnected) {
            await updateUserUI();
            await loadTransactions();
            await checkFaucetStatus();
        }
    }
};