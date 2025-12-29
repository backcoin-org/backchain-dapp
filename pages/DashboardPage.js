// js/pages/DashboardPage.js
// ✅ PRODUCTION V8.2 - Individual Fallbacks for pStake/TVL + Firebase-first

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
    networkActivities: [],
    filteredActivities: [],
    userProfile: null,
    pagination: { currentPage: 1, itemsPerPage: 8 },
    filters: { type: 'ALL', sort: 'NEWEST' },
    metricsCache: {},
    economicData: null,
    isLoadingNetworkActivity: false,
    networkActivitiesTimestamp: 0,
    faucet: {
        canClaim: true,
        cooldownEnd: null,
        isLoading: false,
        lastCheck: 0
    }
};

// --- CONFIG ---
const EXPLORER_BASE_URL = "https://sepolia.arbiscan.io/tx/";
const CONTRACT_EXPLORER_URL = "https://sepolia.arbiscan.io/address/";
const FAUCET_API_URL = "https://faucet-4wvdcuoouq-uc.a.run.app";
const NETWORK_ACTIVITY_API = "https://getrecentactivity-4wvdcuoouq-uc.a.run.app";
const SYSTEM_DATA_API = "https://getsystemdata-4wvdcuoouq-uc.a.run.app";
const FAUCET_BKC_AMOUNT = "1,000";
const FAUCET_ETH_AMOUNT = "0.01";
const FAUCET_BALANCE_THRESHOLD = ethers.parseUnits("100", 18);

// ============================================================================
// ÍCONES CONSISTENTES - Usados em toda aplicação
// ============================================================================
const ACTIVITY_ICONS = {
    // Staking
    STAKING: { icon: 'fa-lock', color: '#4ade80', bg: 'rgba(34,197,94,0.15)', label: '🔒 Staked', emoji: '🔒' },
    UNSTAKING: { icon: 'fa-unlock', color: '#fb923c', bg: 'rgba(249,115,22,0.15)', label: '🔓 Unstaked', emoji: '🔓' },
    FORCE_UNSTAKE: { icon: 'fa-bolt', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: '⚡ Force Unstaked', emoji: '⚡' },
    CLAIM: { icon: 'fa-coins', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', label: '🪙 Rewards Claimed', emoji: '🪙' },
    
    // NFT
    NFT_BUY: { icon: 'fa-bag-shopping', color: '#4ade80', bg: 'rgba(34,197,94,0.15)', label: '🛍️ Bought NFT', emoji: '🛍️' },
    NFT_SELL: { icon: 'fa-hand-holding-dollar', color: '#fb923c', bg: 'rgba(249,115,22,0.15)', label: '💰 Sold NFT', emoji: '💰' },
    NFT_MINT: { icon: 'fa-gem', color: '#fde047', bg: 'rgba(234,179,8,0.15)', label: '💎 Minted Booster', emoji: '💎' },
    NFT_TRANSFER: { icon: 'fa-arrow-right-arrow-left', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', label: '↔️ Transfer', emoji: '↔️' },
    
    // Rental
    RENTAL_LIST: { icon: 'fa-tag', color: '#4ade80', bg: 'rgba(34,197,94,0.15)', label: '🏷️ Listed NFT', emoji: '🏷️' },
    RENTAL_RENT: { icon: 'fa-clock', color: '#22d3ee', bg: 'rgba(6,182,212,0.15)', label: '⏰ Rented NFT', emoji: '⏰' },
    RENTAL_WITHDRAW: { icon: 'fa-rotate-left', color: '#fb923c', bg: 'rgba(249,115,22,0.15)', label: '↩️ Withdrawn', emoji: '↩️' },
    
    // Fortune - 🐯 Tiger Theme
    FORTUNE_BET: { icon: 'fa-paw', color: '#f97316', bg: 'rgba(249,115,22,0.2)', label: '🐯 Fortune Bet', emoji: '🐯' },
    FORTUNE_ORACLE: { icon: 'fa-eye', color: '#e879f9', bg: 'rgba(232,121,249,0.25)', label: '🔮 Oracle Response', emoji: '🔮' },
    FORTUNE_WIN: { icon: 'fa-crown', color: '#facc15', bg: 'rgba(234,179,8,0.25)', label: '🏆 Fortune Winner!', emoji: '🏆' },
    FORTUNE_LOSE: { icon: 'fa-paw', color: '#71717a', bg: 'rgba(39,39,42,0.5)', label: '🐯 No Luck', emoji: '😿' },
    
    // Notary - 📜 Document Theme
    NOTARY: { icon: 'fa-stamp', color: '#818cf8', bg: 'rgba(99,102,241,0.15)', label: '📜 Notarized', emoji: '📜' },
    
    // Faucet
    FAUCET: { icon: 'fa-droplet', color: '#22d3ee', bg: 'rgba(6,182,212,0.15)', label: '💧 Faucet Claim', emoji: '💧' },
    
    // Default
    DEFAULT: { icon: 'fa-circle', color: '#71717a', bg: 'rgba(39,39,42,0.5)', label: 'Activity', emoji: '📋' }
};

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

function formatFullDateTime(timestamp) {
    if (!timestamp) return '';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        const date = new Date(secs * 1000);
        return date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
        });
    } catch (e) { return ''; }
}

function formatCompact(num) {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toFixed(0);
}

function truncateAddress(addr) {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatCooldownTime(endTime) {
    if (!endTime) return '';
    const now = Date.now();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    if (diff <= 0) return '';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function getActivityStyle(type, details = {}) {
    const t = (type || '').toUpperCase().trim();
    
    // Staking
    if (t === 'STAKING' || t === 'STAKED' || t === 'STAKE' || t === 'DELEGATED' || t === 'DELEGATION' || t.includes('DELEGAT')) {
        return ACTIVITY_ICONS.STAKING;
    }
    if (t === 'UNSTAKE' || t === 'UNSTAKED' || t === 'UNSTAKING' || t.includes('UNDELEGAT')) {
        if (t.includes('FORCE')) return ACTIVITY_ICONS.FORCE_UNSTAKE;
        return ACTIVITY_ICONS.UNSTAKING;
    }
    if (t === 'CLAIMREWARD' || t === 'CLAIM' || t === 'CLAIMED' || t.includes('REWARD') || t.includes('CLAIM')) {
        return ACTIVITY_ICONS.CLAIM;
    }
    
    // NFT
    if (t === 'NFTBOUGHT' || t.includes('NFTBOUGHT') || t.includes('NFT_BOUGHT')) {
        return ACTIVITY_ICONS.NFT_BUY;
    }
    if (t === 'NFTSOLD' || t.includes('NFTSOLD') || t.includes('NFT_SOLD')) {
        return ACTIVITY_ICONS.NFT_SELL;
    }
    if (t === 'BOOSTERBUY' || t.includes('BOOSTER') || t.includes('PRESALE') || t.includes('MINTED')) {
        return ACTIVITY_ICONS.NFT_MINT;
    }
    if (t === 'TRANSFER' || t.includes('TRANSFER')) {
        return ACTIVITY_ICONS.NFT_TRANSFER;
    }
    
    // Rental
    if (t === 'RENTALLISTED' || t.includes('LISTED') || t.includes('LIST')) {
        return ACTIVITY_ICONS.RENTAL_LIST;
    }
    if (t === 'RENTALRENTED' || t === 'RENTED' || t.includes('RENTAL') && t.includes('RENT')) {
        return ACTIVITY_ICONS.RENTAL_RENT;
    }
    if (t === 'RENTALWITHDRAWN' || t.includes('WITHDRAW')) {
        return ACTIVITY_ICONS.RENTAL_WITHDRAW;
    }
    
    // Fortune
    if (t === 'GAMEREQUESTED' || t.includes('GAMEREQUESTED') || t.includes('GAME_REQUEST') || t.includes('REQUEST')) {
        return ACTIVITY_ICONS.FORTUNE_BET;
    }
    if (t === 'GAMEFULFILLED' || t.includes('FULFILLED') || t.includes('ORACLE')) {
        return ACTIVITY_ICONS.FORTUNE_ORACLE;
    }
    if (t === 'GAMERESULT' || t.includes('RESULT')) {
        const isWin = details?.isWin || details?.prizeWon > 0;
        return isWin ? ACTIVITY_ICONS.FORTUNE_WIN : ACTIVITY_ICONS.FORTUNE_LOSE;
    }
    if (t.includes('FORTUNE') || t.includes('GAME')) {
        return ACTIVITY_ICONS.FORTUNE_BET;
    }
    
    // Notary
    if (t === 'NOTARYREGISTER' || t === 'NOTARIZED' || t.includes('NOTARY') || t.includes('DOCUMENT')) {
        return ACTIVITY_ICONS.NOTARY;
    }
    
    // Faucet
    if (t === 'FAUCETCLAIM' || t.includes('FAUCET') || t.includes('DISTRIBUTED')) {
        return ACTIVITY_ICONS.FAUCET;
    }
    
    return ACTIVITY_ICONS.DEFAULT;
}

// --- REWARDS ANIMATION ---
let animationFrameId = null;
let displayedRewardValue = 0n;

function animateClaimableRewards(targetNetValue) {
    const rewardsEl = document.getElementById('dash-user-rewards');
    if (!rewardsEl || !State.isConnected) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
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

// ============================================================================
// FAUCET FUNCTIONS
// ============================================================================

async function requestSmartFaucet(btnElement) {
    if (!State.isConnected || !State.userAddress) {
        return showToast("Connect wallet first", "error");
    }

    const originalHTML = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...`;
    DashboardState.faucet.isLoading = true;

    try {
        const response = await fetch(`${FAUCET_API_URL}?address=${State.userAddress}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        const data = await response.json();

        if (response.ok && data.success) {
            showToast(`✅ Faucet Sent! ${FAUCET_BKC_AMOUNT} BKC + ${FAUCET_ETH_AMOUNT} ETH`, "success");
            DashboardState.faucet.canClaim = false;
            DashboardState.faucet.cooldownEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            updateFaucetWidget();
            setTimeout(() => { DashboardPage.update(true); }, 4000);
        } else {
            const msg = data.error || data.message || "Faucet unavailable";
            if (msg.toLowerCase().includes("cooldown") || msg.toLowerCase().includes("wait") || msg.toLowerCase().includes("hour")) {
                showToast(`⏳ ${msg}`, "warning");
                const hoursMatch = msg.match(/(\d+)\s*hour/i);
                if (hoursMatch) {
                    const hours = parseInt(hoursMatch[1]);
                    DashboardState.faucet.canClaim = false;
                    DashboardState.faucet.cooldownEnd = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
                    updateFaucetWidget();
                }
            } else {
                showToast(`❌ ${msg}`, "error");
            }
        }
    } catch (e) {
        console.error("Faucet error:", e);
        showToast("Faucet Offline - Try again later", "error");
    } finally {
        DashboardState.faucet.isLoading = false;
        btnElement.disabled = false;
        btnElement.innerHTML = originalHTML;
    }
}

function shouldShowFaucet() {
    if (!State.isConnected) return false;
    const bkcBalance = State.currentUserBalance || State.bkcBalance || 0n;
    return bkcBalance < FAUCET_BALANCE_THRESHOLD;
}

function updateFaucetWidget() {
    const widget = document.getElementById('dashboard-faucet-widget');
    if (!widget) return;
    
    if (!shouldShowFaucet()) {
        widget.classList.add('hidden');
        return;
    }
    
    widget.classList.remove('hidden');
    
    const bkcBalance = State.currentUserBalance || State.bkcBalance || 0n;
    const isNewUser = bkcBalance === 0n;
    const cooldownTime = formatCooldownTime(DashboardState.faucet.cooldownEnd);
    const canClaim = DashboardState.faucet.canClaim && !cooldownTime;
    
    const titleEl = document.getElementById('faucet-title');
    const descEl = document.getElementById('faucet-desc');
    const statusEl = document.getElementById('faucet-status');
    const btn = document.getElementById('faucet-action-btn');
    
    widget.className = 'glass-panel border-l-4 p-4';
    if (btn) btn.className = 'w-full sm:w-auto font-bold py-2.5 px-5 rounded-lg text-sm transition-all';
    
    if (!canClaim && cooldownTime) {
        widget.classList.add('border-zinc-500');
        if (titleEl) titleEl.innerText = "⏳ Faucet Cooldown";
        if (descEl) descEl.innerText = "Come back when the timer ends";
        if (statusEl) {
            statusEl.classList.remove('hidden');
            statusEl.innerHTML = `<i class="fa-solid fa-clock mr-1"></i> ${cooldownTime} remaining`;
        }
        if (btn) {
            btn.classList.add('bg-zinc-700', 'text-zinc-400', 'cursor-not-allowed');
            btn.innerHTML = '<i class="fa-solid fa-hourglass-half mr-2"></i> On Cooldown';
            btn.disabled = true;
        }
    } else if (isNewUser) {
        widget.classList.add('border-green-500');
        if (titleEl) titleEl.innerText = "🎉 Welcome to BackCoin!";
        if (descEl) descEl.innerText = `Claim your free starter pack: ${FAUCET_BKC_AMOUNT} BKC + ${FAUCET_ETH_AMOUNT} ETH for gas`;
        if (statusEl) statusEl.classList.add('hidden');
        if (btn) {
            btn.classList.add('bg-green-600', 'hover:bg-green-500', 'text-white', 'hover:scale-105');
            btn.innerHTML = '<i class="fa-solid fa-gift mr-2"></i> Claim Starter Pack';
            btn.disabled = false;
        }
    } else {
        const balanceNum = formatBigNumber(bkcBalance).toFixed(2);
        widget.classList.add('border-cyan-500');
        if (titleEl) titleEl.innerText = "💧 Need More BKC?";
        if (descEl) descEl.innerText = `Balance: ${balanceNum} BKC • Get ${FAUCET_BKC_AMOUNT} BKC + ${FAUCET_ETH_AMOUNT} ETH`;
        if (statusEl) statusEl.classList.add('hidden');
        if (btn) {
            btn.classList.add('bg-cyan-600', 'hover:bg-cyan-500', 'text-white', 'hover:scale-105');
            btn.innerHTML = '<i class="fa-solid fa-faucet mr-2"></i> Request Tokens';
            btn.disabled = false;
        }
    }
}

async function checkGasAndWarn() {
    try {
        const nativeBalance = await State.provider.getBalance(State.userAddress);
        if (nativeBalance < ethers.parseEther("0.002")) {
            const modal = document.getElementById('no-gas-modal-dash');
            if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
            return false;
        }
        return true;
    } catch (e) { return true; }
}

// ============================================================================
// 1. RENDER LAYOUT
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

            <!-- METRICS GRID -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                ${renderMetricCardAuto('Total Supply', 'fa-coins', 'dash-metric-supply', 'Total BKC tokens in circulation')}
                ${renderMetricCard('Net pStake', 'fa-layer-group', 'dash-metric-pstake', 'Total staking power on network', 'purple')}
                ${renderMetricCard('Economic Output', 'fa-chart-line', 'dash-metric-economic', 'Total value generated (Mined + Fees)', 'green')}
                ${renderMetricCard('Fees Collected', 'fa-receipt', 'dash-metric-fees', 'Total fees generated by the ecosystem', 'orange')}
                ${renderMetricCard('TVL %', 'fa-lock', 'dash-metric-tvl', 'Percentage of supply locked in contracts', 'blue')}
                ${renderBalanceCard()}
            </div>

            <!-- MAIN CONTENT -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- LEFT: User Hub + Activity -->
                <div class="lg:col-span-2 flex flex-col gap-6">
                    
                    <!-- FAUCET WIDGET -->
                    <div id="dashboard-faucet-widget" class="hidden glass-panel border-l-4 p-4">
                        <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div class="text-center sm:text-left flex-1">
                                <h3 id="faucet-title" class="text-white font-bold text-sm"></h3>
                                <p id="faucet-desc" class="text-xs text-zinc-400 mt-1"></p>
                                <p id="faucet-status" class="hidden text-xs text-amber-400 mt-1 font-mono"></p>
                            </div>
                            <button id="faucet-action-btn" class="w-full sm:w-auto font-bold py-2.5 px-5 rounded-lg text-sm transition-all"></button>
                        </div>
                    </div>

                    <!-- USER HUB -->
                    <div class="glass-panel p-5 relative overflow-hidden">
                        <div class="absolute top-0 right-0 opacity-5">
                            <i class="fa-solid fa-rocket text-8xl"></i>
                        </div>
                        
                        <div class="flex flex-col md:flex-row gap-6 relative z-10">
                            <div class="flex-1 space-y-4">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <p class="text-zinc-400 text-xs font-medium uppercase tracking-wider">Claimable Rewards</p>
                                        <span class="text-zinc-600 text-[10px] cursor-help" title="Net value after fees">ⓘ</span>
                                    </div>
                                    <div id="dash-user-rewards" class="text-3xl md:text-4xl font-bold text-white">--</div>
                                </div>

                                <div id="dash-user-gain-area" class="hidden p-2 bg-green-900/20 border border-green-500/20 rounded-lg inline-block">
                                    <p class="text-[10px] text-green-400 font-bold flex items-center gap-1">
                                        <i class="fa-solid fa-arrow-up"></i>
                                        +<span id="dash-user-potential-gain">0</span> BKC with NFT
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

                            <div id="dash-booster-area" class="flex-1 md:border-l md:border-zinc-700/50 md:pl-6 flex flex-col justify-center min-h-[140px]">
                                <div class="flex items-center justify-center gap-2">
                                    <img src="./assets/bkc_logo_3d.png" class="w-8 h-8 object-contain animate-pulse opacity-50" alt="">
                                    <span class="text-zinc-600 text-xs animate-pulse">Loading...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ACTIVITY LIST -->
                    <div class="glass-panel p-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> 
                                <span id="activity-title">Activity</span>
                            </h3>
                            
                            <div class="flex gap-2">
                                <select id="activity-filter-type" class="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] rounded px-2 py-1 outline-none cursor-pointer">
                                    <option value="ALL">All</option>
                                    <option value="STAKE">Staking</option>
                                    <option value="CLAIM">Claims</option>
                                    <option value="NFT">NFT</option>
                                    <option value="GAME">Fortune</option>
                                    <option value="NOTARY">Notary</option>
                                    <option value="FAUCET">Faucet</option>
                                </select>
                                <button id="activity-sort-toggle" class="bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] rounded px-2 py-1 hover:bg-zinc-700">
                                    <i class="fa-solid fa-arrow-down-wide-short"></i>
                                </button>
                            </div>
                        </div>

                        <div id="dash-activity-list" class="space-y-2 min-h-[150px] max-h-[500px] overflow-y-auto custom-scrollbar">
                            <div class="flex flex-col items-center justify-center py-8">
                                <div class="relative">
                                    <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                                    <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
                                </div>
                                <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading activity...</p>
                            </div>
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
                    
                    <!-- NETWORK STATUS -->
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

                    <!-- FORTUNE POOL CARD - 🐯 Tiger Theme -->
                    <div class="glass-panel p-4 bg-gradient-to-b from-orange-900/20 to-transparent border-orange-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-paw text-orange-400"></i>
                            <h3 class="font-bold text-white text-sm">Fortune Pool</h3>
                        </div>
                        <p class="text-xs text-zinc-400 mb-3">Test your luck with on-chain games</p>
                        <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-3">
                            <span>Prize Pool</span>
                            <span id="dash-fortune-prize" class="text-orange-400 font-mono">--</span>
                        </div>
                        <button class="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-2.5 rounded-lg text-sm go-to-fortune transition-colors">
                            Play Now <i class="fa-solid fa-paw ml-2"></i>
                        </button>
                    </div>

                    <!-- NOTARY CARD - 📜 Document Theme -->
                    <div class="glass-panel p-4 bg-gradient-to-b from-indigo-900/20 to-transparent border-indigo-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-stamp text-indigo-400"></i>
                            <h3 class="font-bold text-white text-sm">Decentralized Notary</h3>
                        </div>
                        <p class="text-xs text-zinc-400 mb-3">Certify documents on blockchain</p>
                        <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-3">
                            <span>Total Notarized</span>
                            <span id="dash-notary-count" class="text-indigo-400 font-mono">--</span>
                        </div>
                        <button class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm go-to-notary transition-colors">
                            Notarize Now <i class="fa-solid fa-stamp ml-2"></i>
                        </button>
                    </div>

                    <!-- PORTFOLIO STATS -->
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
        </div>
    `;
}

function renderMetricCardAuto(label, icon, id, tooltip, color = 'zinc') {
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
            <p id="${id}" class="font-bold text-white leading-tight" style="font-size: clamp(12px, 3.5vw, 18px)">--</p>
        </div>
    `;
}

function renderBalanceCard() {
    return `
        <div id="dash-balance-card" class="glass-panel p-3 sm:p-4 group hover:border-amber-500/50 transition-all cursor-default relative overflow-hidden" title="Your BKC balance" style="border-color: rgba(245,158,11,0.3)">
            <div class="absolute top-1 right-1 opacity-20">
                <img src="./assets/bkc_logo_3d.png" class="w-8 h-8" alt="">
            </div>
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid fa-wallet text-amber-400 text-xs"></i>
                <span class="text-[10px] text-amber-500/80 uppercase font-bold tracking-wider">Your Balance</span>
            </div>
            <p id="dash-metric-balance" class="font-bold text-amber-400 font-mono leading-tight relative z-10" style="font-size: clamp(14px, 4vw, 20px)">--</p>
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
                    <i class="fa-solid fa-hand-holding-medical mr-2"></i> Get Free Gas + BKC
                </button>
                
                <button id="close-gas-modal-dash" class="text-zinc-500 hover:text-white text-xs">Close</button>
            </div>
        </div>
    `;
}

// ============================================================================
// 2. DATA LOGIC
// ============================================================================

async function fetchEconomicData() {
    try {
        const response = await fetch(SYSTEM_DATA_API);
        if (response.ok) {
            const data = await response.json();
            DashboardState.economicData = data;
            return data;
        }
    } catch (e) {}
    return null;
}

async function updateGlobalMetrics() {
    try {
        // ✅ V8.2: Buscar dados econômicos do Firebase PRIMEIRO
        const ecoData = await fetchEconomicData();
        
        let totalSupply = 0n;
        let totalPStake = 0n;
        let totalTVL = 0n;
        let economicOutput = 0n;
        let totalFeesCollected = 0n;
        let notaryCount = 0;
        let fortunePoolBalance = 0n;

        // Usar dados do Firebase se disponíveis
        if (ecoData) {
            console.log('📊 Firebase economic data:', ecoData.economy);
            if (ecoData.economy?.totalSupply) totalSupply = BigInt(ecoData.economy.totalSupply);
            if (ecoData.economy?.totalPStake) totalPStake = BigInt(ecoData.economy.totalPStake);
            if (ecoData.economy?.totalTVL) totalTVL = BigInt(ecoData.economy.totalTVL);
            if (ecoData.economy?.economicOutput) economicOutput = BigInt(ecoData.economy.economicOutput);
            if (ecoData.economy?.totalFeesCollected) totalFeesCollected = BigInt(ecoData.economy.totalFeesCollected);
            if (ecoData.economy?.fortunePoolBalance) fortunePoolBalance = BigInt(ecoData.economy.fortunePoolBalance);
            if (ecoData.stats?.notarizedDocuments) notaryCount = ecoData.stats.notarizedDocuments;
        }

        // ✅ V8.2: Fallbacks INDIVIDUAIS para dados que não vieram do Firebase
        if (State.bkcTokenContractPublic) {
            // Fallback: totalSupply
            if (totalSupply === 0n) {
                console.log('📊 Fetching totalSupply from blockchain (fallback)...');
                totalSupply = await safeContractCall(State.bkcTokenContractPublic, 'totalSupply', [], 0n);
            }
            
            // Fallback: totalPStake
            if (totalPStake === 0n && State.delegationManagerContractPublic) {
                console.log('📊 Fetching totalPStake from blockchain (fallback)...');
                totalPStake = await safeContractCall(State.delegationManagerContractPublic, 'totalNetworkPStake', [], 0n);
            }

            // Fallback: TVL (calcular se não veio do Firebase)
            if (totalTVL === 0n) {
                console.log('📊 Calculating TVL from blockchain (fallback)...');
                const contractAddresses = [
                    addresses.delegationManager,
                    addresses.fortunePool,
                    addresses.rentalManager,
                    addresses.miningManager,
                    addresses.decentralizedNotary,
                    addresses.nftLiquidityPoolFactory,
                    addresses.pool_diamond,
                    addresses.pool_platinum,
                    addresses.pool_gold,
                    addresses.pool_silver,
                    addresses.pool_bronze,
                    addresses.pool_iron,
                    addresses.pool_crystal
                ].filter(addr => addr && addr !== ethers.ZeroAddress);

                const balancePromises = contractAddresses.map(addr => 
                    safeContractCall(State.bkcTokenContractPublic, 'balanceOf', [addr], 0n)
                );
                const balances = await Promise.all(balancePromises);
                
                balances.forEach(bal => { totalTVL += bal; });

                // Fortune Pool balance
                if (addresses.fortunePool && fortunePoolBalance === 0n) {
                    const fortuneIdx = contractAddresses.indexOf(addresses.fortunePool);
                    if (fortuneIdx >= 0) fortunePoolBalance = balances[fortuneIdx];
                }
            }
        }

        const supplyNum = formatBigNumber(totalSupply);
        const economicNum = formatBigNumber(economicOutput);
        const feesNum = formatBigNumber(totalFeesCollected);
        const fortunePrize = formatBigNumber(fortunePoolBalance);

        const formatFullNumber = (num) => {
            return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        };

        let tvlPercent = 0;
        if (totalSupply > 0n) {
            tvlPercent = Number((totalTVL * 10000n) / totalSupply) / 100;
        }
        if (tvlPercent > 100) tvlPercent = 100;

        const setMetric = (id, value, suffix = '') => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `${value}${suffix ? ` <span class="text-xs text-zinc-500">${suffix}</span>` : ''}`;
        };

        const supplyEl = document.getElementById('dash-metric-supply');
        if (supplyEl) {
            supplyEl.innerHTML = `${formatFullNumber(supplyNum)} <span style="font-size: 10px; color: #71717a">BKC</span>`;
        }
        
        setMetric('dash-metric-pstake', formatPStake(totalPStake));
        setMetric('dash-metric-economic', formatCompact(economicNum), 'BKC');
        setMetric('dash-metric-fees', formatCompact(feesNum), 'BKC');
        
        const tvlEl = document.getElementById('dash-metric-tvl');
        if (tvlEl) {
            const tvlColor = tvlPercent > 30 ? 'text-green-400' : tvlPercent > 10 ? 'text-yellow-400' : 'text-blue-400';
            tvlEl.innerHTML = `<span class="${tvlColor}">${tvlPercent.toFixed(1)}%</span>`;
        }

        updateBalanceCard();

        const fortunePrizeEl = document.getElementById('dash-fortune-prize');
        if (fortunePrizeEl) fortunePrizeEl.innerText = `${formatCompact(fortunePrize)} BKC`;

        const notaryCountEl = document.getElementById('dash-notary-count');
        if (notaryCountEl) notaryCountEl.innerText = notaryCount > 0 ? `${notaryCount} docs` : '--';

        DashboardState.metricsCache = { supply: supplyNum, economic: economicNum, fees: feesNum, timestamp: Date.now() };

    } catch (e) {
        console.error("Metrics Error", e);
    }
}

async function fetchUserProfile() {
    if (!State.userAddress) return;
    try {
        const response = await fetch(`https://getuserprofile-4wvdcuoouq-uc.a.run.app/${State.userAddress}`);
        if (response.ok) {
            DashboardState.userProfile = await response.json();
            renderPresaleStats(DashboardState.userProfile);
        }
    } catch (e) { }
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
            const tierConfig = boosterTiers[Number(tierId) - 1];
            const name = tierConfig ? tierConfig.name : `T${tierId}`;
            html += `<span class="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">${count}x ${name}</span>`;
        });
        if (html) badgesContainer.innerHTML = html;
    }
}

function updateBalanceCard() {
    const balanceEl = document.getElementById('dash-metric-balance');
    const cardEl = document.getElementById('dash-balance-card');
    if (!balanceEl) return;

    const balance = State.currentUserBalance || State.bkcBalance || 0n;
    
    if (!State.isConnected) {
        balanceEl.innerHTML = `<span class="text-zinc-500 text-xs">Connect Wallet</span>`;
        if (cardEl) cardEl.style.borderColor = 'rgba(63,63,70,0.5)';
        return;
    }

    if (balance === 0n) {
        balanceEl.innerHTML = `0.00 <span style="font-size: 10px; color: #71717a">BKC</span>`;
    } else {
        const balanceNum = formatBigNumber(balance);
        const formatted = balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        balanceEl.innerHTML = `${formatted} <span style="font-size: 10px; color: #71717a">BKC</span>`;
    }
    
    if (cardEl) cardEl.style.borderColor = 'rgba(245,158,11,0.3)';
}

async function updateUserHub(forceRefresh = false) {
    if (!State.isConnected) {
        const boosterArea = document.getElementById('dash-booster-area');
        if (boosterArea) {
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
        if (forceRefresh && rewardsEl) rewardsEl.classList.add('animate-pulse', 'opacity-70');

        const [, claimDetails, boosterData] = await Promise.all([
            loadUserData(),
            calculateClaimDetails(),
            getHighestBoosterBoostFromAPI()
        ]);

        const netClaimAmount = claimDetails?.netClaimAmount || 0n;
        animateClaimableRewards(netClaimAmount);

        if (rewardsEl) rewardsEl.classList.remove('animate-pulse', 'opacity-70');

        const claimBtn = document.getElementById('dashboardClaimBtn');
        if (claimBtn) claimBtn.disabled = netClaimAmount <= 0n;

        const pStakeEl = document.getElementById('dash-user-pstake');
        if (pStakeEl) {
            let userPStake = State.userData?.pStake || State.userData?.userTotalPStake || State.userTotalPStake || 0n;
            
            if (userPStake === 0n && State.delegationManagerContractPublic && State.userAddress) {
                try {
                    userPStake = await safeContractCall(State.delegationManagerContractPublic, 'userTotalPStake', [State.userAddress], 0n);
                } catch (e) {}
            }
            
            pStakeEl.innerText = formatPStake(userPStake);
        }

        updateBalanceCard();
        updateBoosterDisplay(boosterData, claimDetails);
        fetchUserProfile();
        updateFaucetWidget();

    } catch (e) {
        console.error("User Hub Error:", e);
    }
}

function updateBoosterDisplay(data, claimDetails) {
    const container = document.getElementById('dash-booster-area');
    if (!container) return;

    const currentBoostBips = data?.highestBoost || 0;

    if (currentBoostBips === 0) {
        const grossReward = claimDetails?.totalRewards || 0n;
        const potentialGain = (grossReward * 5000n) / 10000n;

        if (potentialGain > 0n) {
            const gainArea = document.getElementById('dash-user-gain-area');
            if (gainArea) {
                gainArea.classList.remove('hidden');
                document.getElementById('dash-user-potential-gain').innerText = formatBigNumber(potentialGain).toFixed(2);
            }
        }

        container.innerHTML = `
            <div class="text-center space-y-3">
                <div class="flex items-center justify-center gap-2">
                    <div class="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <i class="fa-solid fa-rocket text-amber-400"></i>
                    </div>
                    <div class="text-left">
                        <p class="text-white text-sm font-bold">50% Efficiency</p>
                        <p class="text-[10px] text-zinc-500">No NFT active</p>
                    </div>
                </div>
                
                <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-red-500 to-amber-500 h-full rounded-full" style="width: 50%"></div>
                </div>
                
                <button id="open-booster-info" class="text-xs text-amber-400 hover:text-white font-medium">
                    <i class="fa-solid fa-circle-info mr-1"></i> How to boost?
                </button>
                
                <div class="flex gap-2 justify-center">
                    <button class="go-to-store bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1.5 px-3 rounded">Buy NFT</button>
                    <button class="go-to-rental bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-bold py-1.5 px-3 rounded">Rent</button>
                </div>
            </div>
        `;
        return;
    }

    const isRented = data.source === 'rented';
    const badgeColor = isRented ? 'bg-cyan-500/20 text-cyan-300' : 'bg-green-500/20 text-green-300';
    const badgeText = isRented ? 'Rented' : 'Owned';

    let finalImageUrl = data.imageUrl;
    const tierInfo = boosterTiers.find(t => t.boostBips === currentBoostBips);
    if (!finalImageUrl || finalImageUrl.includes('placeholder')) {
        if (tierInfo && tierInfo.realImg) finalImageUrl = tierInfo.realImg;
    }

    // Desconto real: boostBips / 100
    // Diamond 7000 -> 70%, Iron 2000 -> 20%, etc.
    const discountPercent = currentBoostBips / 100;
    
    // Nome do tier
    const tierName = tierInfo?.name || data.boostName?.replace(' Booster', '') || 'Booster';

    container.innerHTML = `
        <div class="flex items-center gap-3 bg-zinc-800/40 border border-green-500/20 rounded-lg p-3 nft-clickable-image cursor-pointer" data-address="${addresses.rewardBoosterNFT}" data-tokenid="${data.tokenId}">
            <div class="relative w-14 h-14 flex-shrink-0">
                <img src="${finalImageUrl}" class="w-full h-full object-cover rounded-lg" onerror="this.src='./assets/bkc_logo_3d.png'">
                <div class="absolute -top-1 -left-1 bg-green-500 text-black font-black text-[9px] px-1.5 py-0.5 rounded">${discountPercent}%</div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-[9px] font-bold ${badgeColor} px-1.5 py-0.5 rounded uppercase">${badgeText}</span>
                    <span class="text-[9px] text-zinc-600">#${data.tokenId}</span>
                </div>
                <h4 class="text-white font-bold text-xs truncate">${tierName} Booster</h4>
                <p class="text-[10px] text-green-400"><i class="fa-solid fa-check-circle mr-1"></i>${discountPercent}% Fee Discount</p>
            </div>
        </div>
    `;
}

// ============================================================================
// 3. ACTIVITY - Histórico Completo com Detalhes
// ============================================================================

async function fetchAndProcessActivities() {
    const listEl = document.getElementById('dash-activity-list');
    const titleEl = document.getElementById('activity-title');

    try {
        if (State.isConnected) {
            // Usuário logado: mostra activity do usuário
            if (DashboardState.activities.length === 0) {
                if (listEl) {
                    listEl.innerHTML = `
                        <div class="flex flex-col items-center justify-center py-8">
                            <div class="relative">
                                <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                                <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
                            </div>
                            <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading your activity...</p>
                        </div>
                    `;
                }
                const response = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
                if (response.ok) {
                    DashboardState.activities = await response.json();
                }
            }

            if (DashboardState.activities.length > 0) {
                if (titleEl) titleEl.textContent = 'Your Activity';
                applyFiltersAndRender();
                return;
            }
        }

        // Não logado ou sem activity: mostra activity do sistema
        if (titleEl) titleEl.textContent = 'Network Activity';
        await fetchNetworkActivity();

    } catch (e) {
        console.error("Activity fetch error:", e);
        if (titleEl) titleEl.textContent = 'Network Activity';
        await fetchNetworkActivity();
    }
}

async function fetchNetworkActivity() {
    const listEl = document.getElementById('dash-activity-list');
    if (!listEl) return;

    if (DashboardState.isLoadingNetworkActivity) return;

    const cacheAge = Date.now() - DashboardState.networkActivitiesTimestamp;
    if (DashboardState.networkActivities.length > 0 && cacheAge < 300000) {
        renderNetworkActivityList();
        return;
    }

    DashboardState.isLoadingNetworkActivity = true;
    listEl.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8">
            <div class="relative">
                <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
            </div>
            <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading network activity...</p>
        </div>
    `;

    try {
        const response = await fetch(`${NETWORK_ACTIVITY_API}?limit=30`);
        if (response.ok) {
            const data = await response.json();
            DashboardState.networkActivities = Array.isArray(data) ? data : (data.activities || []);
            DashboardState.networkActivitiesTimestamp = Date.now();
        } else {
            DashboardState.networkActivities = [];
        }
    } catch (e) {
        console.error("Network activity fetch error:", e);
        DashboardState.networkActivities = [];
    } finally {
        DashboardState.isLoadingNetworkActivity = false;
    }

    renderNetworkActivityList();
}

function renderNetworkActivityList() {
    const listEl = document.getElementById('dash-activity-list');
    const controlsEl = document.getElementById('dash-pagination-controls');
    if (!listEl) return;

    if (DashboardState.networkActivities.length === 0) {
        listEl.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 px-4">
                <div class="relative mb-4">
                    <div class="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="./assets/bkc_logo_3d.png" class="relative w-14 h-14 object-contain opacity-30" alt="BKC">
                </div>
                <p class="text-zinc-500 text-sm font-medium mb-1">No Network Activity</p>
                <p class="text-zinc-600 text-xs text-center">Be the first to make a move!</p>
            </div>
        `;
        if (controlsEl) controlsEl.classList.add('hidden');
        return;
    }

    listEl.innerHTML = DashboardState.networkActivities.slice(0, 15).map(item => {
        return renderActivityItem(item, true);
    }).join('');

    if (controlsEl) controlsEl.classList.add('hidden');
}

function applyFiltersAndRender() {
    let result = [...DashboardState.activities];
    const type = DashboardState.filters.type;
    const normalize = (t) => (t || '').toUpperCase();

    if (type !== 'ALL') {
        result = result.filter(item => {
            const t = normalize(item.type);
            if (type === 'STAKE') return t.includes('DELEGATION') || t.includes('DELEGAT') || t.includes('STAKE') || t.includes('UNSTAKE');
            if (type === 'CLAIM') return t.includes('REWARD') || t.includes('CLAIM');
            if (type === 'NFT') return t.includes('BOOSTER') || t.includes('RENT') || t.includes('NFT') || t.includes('TRANSFER');
            if (type === 'GAME') return t.includes('FORTUNE') || t.includes('GAME') || t.includes('REQUEST') || t.includes('RESULT') || t.includes('FULFILLED');
            if (type === 'NOTARY') return t.includes('NOTARY') || t.includes('NOTARIZED') || t.includes('DOCUMENT');
            if (type === 'FAUCET') return t.includes('FAUCET');
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
        listEl.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 px-4">
                <div class="relative mb-4">
                    <div class="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="./assets/bkc_logo_3d.png" class="relative w-16 h-16 object-contain opacity-40" alt="BKC">
                </div>
                <p class="text-zinc-500 text-sm font-medium mb-1">No Activity Yet</p>
                <p class="text-zinc-600 text-xs text-center max-w-[200px]">Start staking, trading or playing to see your history here</p>
            </div>
        `;
        if (controlsEl) controlsEl.classList.add('hidden');
        return;
    }

    const start = (DashboardState.pagination.currentPage - 1) * DashboardState.pagination.itemsPerPage;
    const end = start + DashboardState.pagination.itemsPerPage;
    const pageItems = DashboardState.filteredActivities.slice(start, end);

    listEl.innerHTML = pageItems.map(item => renderActivityItem(item, false)).join('');

    if (controlsEl) {
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

// Renderiza item de activity com detalhes completos
function renderActivityItem(item, showAddress = false) {
    const dateStr = formatDate(item.timestamp || item.createdAt);
    const fullDateTime = formatFullDateTime(item.timestamp || item.createdAt);
    const address = item.user || item.userAddress || item.from || '';
    const truncAddr = truncateAddress(address);
    
    const style = getActivityStyle(item.type, item.details);
    let extraInfo = '';
    
    // Detalhes específicos por tipo
    const t = (item.type || '').toUpperCase().trim();
    const details = item.details || {};
    
    // Fortune - Números apostados
    if (t.includes('GAMEREQUESTED') || t.includes('REQUEST')) {
        const guesses = details.guesses || item.guesses;
        if (guesses && Array.isArray(guesses) && guesses.length > 0) {
            extraInfo = `<span class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold" style="background: rgba(249,115,22,0.2); color: #f97316">🎯 ${guesses.join(' • ')}</span>`;
        }
        const wager = details.amount || details.wagerAmount;
        if (wager) {
            const wagerNum = formatBigNumber(BigInt(wager)).toFixed(2);
            extraInfo += `<span class="ml-1 text-[10px] text-zinc-500">(${wagerNum} BKC)</span>`;
        }
    }
    
    // Fortune Oracle - Números respondidos
    if (t.includes('FULFILLED') || t.includes('ORACLE')) {
        const rolls = details.rolls || item.rolls || details.oracleNumbers;
        if (rolls && Array.isArray(rolls) && rolls.length > 0) {
            extraInfo = `<span class="ml-2 px-2 py-0.5 rounded text-[11px] font-bold" style="background: linear-gradient(135deg, rgba(168,85,247,0.3), rgba(232,121,249,0.3)); color: #e879f9; border: 1px solid rgba(232,121,249,0.4)">🔮 ${rolls.join(' • ')}</span>`;
        }
    }
    
    // Fortune Result - Win/Lose com números
    if (t.includes('RESULT') || t.includes('GAMERESULT')) {
        const isWin = details.isWin || details.prizeWon > 0;
        const rolls = details.rolls || item.rolls;
        if (rolls && Array.isArray(rolls) && rolls.length > 0) {
            if (isWin) {
                extraInfo = `<span class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold" style="background: rgba(234,179,8,0.2); color: #facc15">🏆 ${rolls.join(' • ')}</span>`;
            } else {
                extraInfo = `<span class="ml-2 text-[9px] text-zinc-500">[${rolls.join(', ')}]</span>`;
            }
        }
    }
    
    // Notary - IPFS CID
    if (t.includes('NOTARY')) {
        const ipfsCid = details.ipfsCid;
        if (ipfsCid) {
            const shortCid = ipfsCid.replace('ipfs://', '').slice(0, 12) + '...';
            extraInfo = `<span class="ml-2 text-[9px] text-indigo-400 font-mono">${shortCid}</span>`;
        }
    }
    
    // Staking - pStake gerado
    if (t.includes('STAKING') || t.includes('DELEGAT')) {
        const pStake = details.pStakeGenerated;
        if (pStake) {
            const pStakeNum = formatBigNumber(BigInt(pStake)).toFixed(0);
            extraInfo = `<span class="ml-2 text-[10px] text-purple-400">+${pStakeNum} pStake</span>`;
        }
    }
    
    // Claim - Fee pago
    if (t.includes('CLAIM') || t.includes('REWARD')) {
        const feePaid = details.feePaid;
        if (feePaid && BigInt(feePaid) > 0n) {
            const feeNum = formatBigNumber(BigInt(feePaid)).toFixed(2);
            extraInfo = `<span class="ml-2 text-[9px] text-zinc-500">(fee: ${feeNum})</span>`;
        }
    }

    const txLink = item.txHash ? `${EXPLORER_BASE_URL}${item.txHash}` : '#';
    let rawAmount = item.amount || details.amount || details.wagerAmount || details.prizeWon || "0";
    const amountNum = formatBigNumber(BigInt(rawAmount));
    const amountDisplay = amountNum > 0.001 ? amountNum.toFixed(2) : '';

    return `
        <a href="${txLink}" target="_blank" class="flex items-center justify-between p-2.5 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all hover:border-zinc-600/50 group" style="background: rgba(39,39,42,0.3)" title="${fullDateTime}">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${style.bg}">
                    <i class="fa-solid ${style.icon} text-xs" style="color: ${style.color}"></i>
                </div>
                <div>
                    <p class="text-white text-xs font-medium">${style.label}${extraInfo}</p>
                    <p class="text-zinc-600" style="font-size: 10px">${showAddress ? truncAddr + ' • ' : ''}${dateStr}</p>
                </div>
            </div>
            <div class="text-right flex items-center gap-2">
                ${amountDisplay ? `<p class="text-white text-xs font-mono">${amountDisplay} <span class="text-zinc-500">BKC</span></p>` : ''}
                <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 transition-colors" style="font-size: 9px"></i>
            </div>
        </a>
    `;
}

// ============================================================================
// 4. EVENT LISTENERS
// ============================================================================

function attachDashboardListeners() {
    if (!DOMElements.dashboard) return;

    DOMElements.dashboard.addEventListener('click', async (e) => {
        const target = e.target;

        if (target.closest('#manual-refresh-btn')) {
            const btn = target.closest('#manual-refresh-btn');
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i>`;
            await updateUserHub(true);
            await updateGlobalMetrics();
            DashboardState.activities = [];
            DashboardState.networkActivities = [];
            DashboardState.networkActivitiesTimestamp = 0;
            DashboardState.faucet.lastCheck = 0;
            await fetchAndProcessActivities();
            setTimeout(() => { btn.innerHTML = `<i class="fa-solid fa-rotate"></i> <span class="hidden sm:inline">Sync</span>`; btn.disabled = false; }, 1000);
        }

        if (target.closest('#faucet-action-btn')) {
            const btn = target.closest('#faucet-action-btn');
            if (!btn.disabled) await requestSmartFaucet(btn);
        }
        if (target.closest('#emergency-faucet-btn')) {
            await requestSmartFaucet(target.closest('#emergency-faucet-btn'));
        }

        if (target.closest('.delegate-link')) { e.preventDefault(); window.navigateTo('mine'); }
        if (target.closest('.go-to-store')) { e.preventDefault(); window.navigateTo('store'); }
        if (target.closest('.go-to-rental')) { e.preventDefault(); window.navigateTo('rental'); }
        if (target.closest('.go-to-fortune')) { e.preventDefault(); window.navigateTo('actions'); }
        if (target.closest('.go-to-notary')) { e.preventDefault(); window.navigateTo('notary'); }

        if (target.closest('#open-booster-info')) {
            const modal = document.getElementById('booster-info-modal');
            if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10); }
        }
        if (target.closest('#close-booster-modal') || target.id === 'booster-info-modal') {
            const modal = document.getElementById('booster-info-modal');
            if (modal) { modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95'); setTimeout(() => modal.classList.add('hidden'), 200); }
        }

        if (target.closest('#close-gas-modal-dash') || target.id === 'no-gas-modal-dash') {
            const modal = document.getElementById('no-gas-modal-dash');
            if (modal) { modal.classList.remove('flex'); modal.classList.add('hidden'); }
        }

        const nftClick = target.closest('.nft-clickable-image');
        if (nftClick) {
            const address = nftClick.dataset.address;
            const id = nftClick.dataset.tokenid;
            if (address && id) addNftToWallet(address, id);
        }

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

        if (target.closest('#page-prev') && DashboardState.pagination.currentPage > 1) {
            DashboardState.pagination.currentPage--; renderActivityPage();
        }
        if (target.closest('#page-next')) {
            const max = Math.ceil(DashboardState.filteredActivities.length / DashboardState.pagination.itemsPerPage);
            if (DashboardState.pagination.currentPage < max) { DashboardState.pagination.currentPage++; renderActivityPage(); }
        }

        if (target.closest('#activity-sort-toggle')) {
            DashboardState.filters.sort = DashboardState.filters.sort === 'NEWEST' ? 'OLDEST' : 'NEWEST';
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

// ============================================================================
// 5. EXPORT
// ============================================================================

export const DashboardPage = {
    async render(isNewPage) {
        renderDashboardLayout();
        updateGlobalMetrics();
        fetchAndProcessActivities();

        if (State.isConnected) {
            await updateUserHub(false);
        }
    },

    update(isConnected) {
        const now = Date.now();
        if (now - DashboardState.lastUpdate > 10000) {
            DashboardState.lastUpdate = now;
            updateGlobalMetrics();

            if (isConnected) {
                updateUserHub(false);
            }

            fetchAndProcessActivities();
        }
    }
};