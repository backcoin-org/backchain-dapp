// pages/NetworkStakingPage.js
// ✅ PRODUCTION V4.0 - Fixed Layout, Complete History, Force Unstake Fix

const ethers = window.ethers;

import { State } from '../state.js';
import { 
    formatBigNumber, 
    formatPStake, 
    renderLoading
} from '../utils.js';
import { 
    loadPublicData, 
    loadUserData, 
    calculateUserTotalRewards,
    loadUserDelegations,
    getHighestBoosterBoostFromAPI,
    API_ENDPOINTS,
    safeContractCall
} from '../modules/data.js';
import { 
    executeDelegation, 
    executeUnstake, 
    executeForceUnstake, 
    executeUniversalClaim 
} from '../modules/transactions.js';
import { showToast } from '../ui-feedback.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const STAKE_IMAGE = "./assets/stake.png";
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";

// ============================================================================
// LOCAL STATE
// ============================================================================
let isLoading = false;
let lastFetch = 0;
let currentPage = 1;
let lockDays = 3650; // Default: 10 Years
let highestBoosterTokenId = 0n;
let isProcessing = false;
let stakingHistory = [];
let totalNetworkPStake = 0n;

// ============================================================================
// HELPERS
// ============================================================================
function formatTimeRemaining(seconds) {
    if (seconds <= 0) return 'Ready';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    
    if (d > 365) {
        const years = Math.floor(d / 365);
        const remainingDays = d % 365;
        return `${years}y : ${remainingDays}d`;
    }
    if (d > 0) return `${d}d : ${h}h : ${m}m`;
    if (h > 0) return `${h}h : ${m}m`;
    return `${m}m`;
}

function formatDuration(days) {
    if (days >= 365) {
        const years = days / 365;
        return years >= 2 ? `${Math.floor(years)} Years` : `${years.toFixed(1)} Year`;
    }
    if (days >= 30) return `${Math.floor(days/30)} Month${days >= 60 ? 's' : ''}`;
    return `${days} Day${days > 1 ? 's' : ''}`;
}

function calculatePStake(amount, durationSec) {
    try {
        const amountBig = BigInt(amount);
        const durationBig = BigInt(durationSec);
        const daySeconds = 86400n;
        return (amountBig * (durationBig / daySeconds)) / (10n**18n);
    } catch { return 0n; }
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        const date = new Date(secs * 1000);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
}

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('staking-styles-v4')) return;
    
    const style = document.createElement('style');
    style.id = 'staking-styles-v4';
    style.textContent = `
        /* Stake Image Animations */
        @keyframes stake-pulse {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(139,92,246,0.3)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 30px rgba(139,92,246,0.6)); transform: scale(1.02); }
        }
        @keyframes stake-glow {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(6,182,212,0.4)); }
            50% { filter: drop-shadow(0 0 40px rgba(6,182,212,0.7)); }
        }
        @keyframes stake-rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes stake-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        @keyframes stake-success {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); filter: drop-shadow(0 0 40px rgba(16,185,129,0.8)); }
            100% { transform: scale(1); }
        }
        .stake-pulse { animation: stake-pulse 3s ease-in-out infinite; }
        .stake-glow { animation: stake-glow 2s ease-in-out infinite; }
        .stake-rotate { animation: stake-rotate 2s linear infinite; }
        .stake-float { animation: stake-float 4s ease-in-out infinite; }
        .stake-success { animation: stake-success 0.8s ease-out; }
        
        .staking-card {
            background: linear-gradient(180deg, rgba(39,39,42,0.8) 0%, rgba(24,24,27,0.9) 100%);
            border: 1px solid rgba(63,63,70,0.5);
        }
        .staking-card:hover { border-color: rgba(139,92,246,0.3); }
        
        .duration-chip {
            transition: all 0.2s ease;
            position: relative;
        }
        .duration-chip:hover { transform: scale(1.02); }
        .duration-chip.selected {
            background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
            border-color: #8b5cf6 !important;
            color: white !important;
        }
        .duration-chip.recommended::after {
            content: '★';
            position: absolute;
            top: -6px;
            right: -6px;
            background: #f59e0b;
            color: black;
            font-size: 8px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .stake-btn {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            transition: all 0.2s ease;
        }
        .stake-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            transform: translateY(-1px);
        }
        .stake-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .delegation-item {
            transition: all 0.2s ease;
        }
        .delegation-item:hover { background: rgba(63,63,70,0.3); transform: translateX(4px); }
        
        .history-item { transition: all 0.2s ease; }
        .history-item:hover { background: rgba(63,63,70,0.5) !important; transform: translateX(4px); }
        
        .stat-glow-purple { box-shadow: 0 0 20px rgba(139,92,246,0.1); }
        .stat-glow-amber { box-shadow: 0 0 20px rgba(245,158,11,0.1); }
        
        /* Input Group Fix */
        .input-with-button {
            position: relative;
            display: flex;
            align-items: center;
        }
        .input-with-button input {
            width: 100%;
            padding-right: 70px;
        }
        .input-with-button .max-btn-inside {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
        }
        
        /* History Tabs */
        .history-tab {
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .history-tab:hover { background: rgba(63,63,70,0.5); }
        .history-tab.active {
            background: rgba(139,92,246,0.2);
            border-color: rgba(139,92,246,0.5);
            color: #a78bfa;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN RENDER
// ============================================================================
export function render() {
    const container = document.getElementById('mine');
    if (!container) return;

    injectStyles();
    
    container.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 py-4 sm:py-6">
            
            <!-- Header with Animated Stake Image -->
            <div class="flex items-center justify-between mb-4 sm:mb-6">
                <div class="flex items-center gap-3">
                    <img src="${STAKE_IMAGE}" 
                         alt="Stake" 
                         class="w-14 h-14 object-contain stake-pulse stake-float"
                         id="stake-mascot"
                         onerror="this.style.display='none'">
                    <div>
                        <h1 class="text-xl sm:text-2xl font-bold text-white">🔒 Stake & Earn</h1>
                        <p class="text-xs text-zinc-500 mt-0.5">Lock BKC to earn network rewards</p>
                    </div>
                </div>
                <button id="refresh-btn" class="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors">
                    <i class="fa-solid fa-rotate text-zinc-400 hover:text-white"></i>
                </button>
            </div>

            <!-- Stats Row -->
            <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div class="staking-card rounded-xl p-3 sm:p-4 stat-glow-purple">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-layer-group text-purple-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Net pStake</span>
                    </div>
                    <p id="stat-network" class="text-sm sm:text-lg font-bold text-white font-mono">--</p>
                    <p class="text-[9px] text-zinc-600 mt-0.5">Total Network Power</p>
                </div>
                
                <div class="staking-card rounded-xl p-3 sm:p-4">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-lock text-blue-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Your pStake</span>
                    </div>
                    <p id="stat-pstake" class="text-sm sm:text-lg font-bold text-white font-mono">--</p>
                    <p id="stat-pstake-percent" class="text-[9px] text-zinc-600 mt-0.5">--% of network</p>
                </div>
                
                <div class="staking-card rounded-xl p-3 sm:p-4 stat-glow-amber">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-coins text-amber-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Rewards</span>
                    </div>
                    <div class="flex items-center justify-between gap-1">
                        <p id="stat-rewards" class="text-sm sm:text-lg font-bold text-white font-mono truncate">--</p>
                        <button id="claim-btn" disabled class="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded transition-all flex-shrink-0">
                            Claim
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                <!-- Delegate Card -->
                <div class="staking-card rounded-2xl p-4 sm:p-5">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-layer-group text-purple-400"></i>
                        </div>
                        <h2 class="text-lg font-bold text-white">Delegate</h2>
                    </div>

                    <!-- Amount Input - FIXED LAYOUT -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-1.5">
                            <label class="text-xs text-zinc-400">Amount</label>
                            <span class="text-[10px] text-zinc-500">
                                Balance: <span id="balance-display" class="text-white font-mono">0.00</span> BKC
                            </span>
                        </div>
                        <div class="input-with-button">
                            <input type="number" id="amount-input" placeholder="0.00" 
                                class="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 sm:p-4 text-xl sm:text-2xl text-white font-mono outline-none focus:border-purple-500 transition-colors">
                            <button id="max-btn" class="max-btn-inside text-[10px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg transition-colors">
                                MAX
                            </button>
                        </div>
                    </div>

                    <!-- Lock Duration - IMPROVED -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <label class="text-xs text-zinc-400">Lock Duration</label>
                            <span class="text-[9px] text-amber-400/80">
                                <i class="fa-solid fa-star text-[8px] mr-1"></i>
                                10Y = Max Rewards
                            </span>
                        </div>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400 hover:border-zinc-500" data-days="30">
                                1M
                            </button>
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400 hover:border-zinc-500" data-days="365">
                                1Y
                            </button>
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400 hover:border-zinc-500" data-days="1825">
                                5Y
                            </button>
                            <button class="duration-chip recommended py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400 selected" data-days="3650">
                                10Y
                            </button>
                        </div>
                        <p class="text-[9px] text-zinc-600 mt-2 text-center">
                            <i class="fa-solid fa-info-circle mr-1"></i>
                            Longer locks generate more pStake power
                        </p>
                    </div>

                    <!-- Preview -->
                    <div class="bg-zinc-900/50 rounded-xl p-3 mb-4 border border-zinc-800">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-[10px] text-zinc-500 uppercase mb-0.5">You'll Receive</p>
                                <p class="text-xl sm:text-2xl font-bold text-purple-400 font-mono" id="preview-pstake">0</p>
                                <p class="text-[10px] text-zinc-500">pStake Power</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-zinc-500 uppercase mb-0.5">After Fee</p>
                                <p class="text-sm text-white font-mono" id="preview-net">0.00 BKC</p>
                                <p class="text-[10px] text-zinc-600" id="fee-info">0.5% fee</p>
                            </div>
                        </div>
                    </div>

                    <!-- Stake Button -->
                    <button id="stake-btn" disabled class="stake-btn w-full py-3 sm:py-4 rounded-xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                        <span id="stake-btn-text">Delegate BKC</span>
                        <i id="stake-btn-icon" class="fa-solid fa-lock"></i>
                    </button>

                    <!-- Info Tips -->
                    <div class="mt-4 pt-4 border-t border-zinc-800">
                        <p class="text-[10px] text-zinc-600 flex items-center gap-1.5">
                            <i class="fa-solid fa-lightbulb text-amber-500/50"></i>
                            Pro tip: 10-year lock maximizes your rewards share
                        </p>
                    </div>
                </div>

                <!-- My Delegations -->
                <div class="staking-card rounded-2xl p-4 sm:p-5">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                                <i class="fa-solid fa-list text-zinc-400"></i>
                            </div>
                            <h2 class="text-lg font-bold text-white">My Delegations</h2>
                        </div>
                        <span id="delegation-count" class="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-1 rounded">0</span>
                    </div>

                    <div id="delegations-list" class="space-y-2 max-h-[300px] overflow-y-auto">
                        ${renderLoading()}
                    </div>
                </div>
            </div>

            <!-- Complete Staking History -->
            <div class="staking-card rounded-2xl p-4 sm:p-5 mt-4 sm:mt-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <i class="fa-solid fa-clock-rotate-left text-purple-400"></i>
                        </div>
                        <h2 class="text-lg font-bold text-white">Staking History</h2>
                    </div>
                    <div class="flex gap-1">
                        <button class="history-tab active text-[9px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800" data-filter="ALL">All</button>
                        <button class="history-tab text-[9px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-400" data-filter="STAKE">Stakes</button>
                        <button class="history-tab text-[9px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-400" data-filter="UNSTAKE">Unstakes</button>
                        <button class="history-tab text-[9px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-400" data-filter="CLAIM">Claims</button>
                    </div>
                </div>
                <div id="staking-history-list" class="space-y-2 max-h-[400px] overflow-y-auto">
                    <div class="text-center py-6">
                        <img src="${STAKE_IMAGE}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        <p class="text-zinc-600 text-sm">Loading history...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupListeners();
    
    if (State.isConnected) {
        loadData(true);
    } else {
        resetUI();
    }
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadData(force = false) {
    if (!State.isConnected) {
        resetUI();
        return;
    }

    const now = Date.now();
    if (!force && isLoading) return;
    if (!force && (now - lastFetch < 10000)) return;
    
    isLoading = true;
    lastFetch = now;

    try {
        const boosterData = await getHighestBoosterBoostFromAPI();
        highestBoosterTokenId = boosterData?.tokenId ? BigInt(boosterData.tokenId) : 0n;

        // Load Network pStake (igual ao Dashboard)
        if (State.delegationManagerContractPublic || State.delegationManagerContract) {
            const contract = State.delegationManagerContractPublic || State.delegationManagerContract;
            totalNetworkPStake = await safeContractCall(contract, 'totalNetworkPStake', [], 0n);
        }

        await Promise.all([
            loadUserData(true),
            loadUserDelegations(true),
            loadPublicData()
        ]);

        updateStats();
        renderDelegations();
        updatePreview();
        loadStakingHistory();

    } catch (e) {
        console.error("Staking load error:", e);
    } finally {
        isLoading = false;
    }
}

let currentHistoryFilter = 'ALL';

async function loadStakingHistory() {
    if (!State.userAddress) return;
    
    try {
        const endpoint = API_ENDPOINTS.getHistory || 'https://gethistory-4wvdcuoouq-uc.a.run.app';
        const response = await fetch(`${endpoint}/${State.userAddress}`);
        if (response.ok) {
            const data = await response.json();
            // Filtra atividades relacionadas a staking (incluindo force unstake)
            stakingHistory = (data || []).filter(item => {
                const t = (item.type || '').toUpperCase();
                return t.includes('DELEGAT') || 
                       t.includes('STAKE') || 
                       t.includes('UNDELEGAT') ||
                       t.includes('CLAIM') || 
                       t.includes('REWARD') ||
                       t.includes('FORCE');
            });
            renderStakingHistory();
        }
    } catch (e) {
        console.error('History load error:', e);
    }
}

function renderStakingHistory() {
    const container = document.getElementById('staking-history-list');
    if (!container) return;

    // Aplica filtro
    let filteredHistory = stakingHistory;
    if (currentHistoryFilter !== 'ALL') {
        filteredHistory = stakingHistory.filter(item => {
            const t = (item.type || '').toUpperCase();
            switch(currentHistoryFilter) {
                case 'STAKE':
                    return (t.includes('DELEGAT') || t.includes('STAKE')) && 
                           !t.includes('UNSTAKE') && !t.includes('UNDELEGAT') && !t.includes('FORCE');
                case 'UNSTAKE':
                    return t.includes('UNSTAKE') || t.includes('UNDELEGAT') || t.includes('FORCE');
                case 'CLAIM':
                    return t.includes('CLAIM') || t.includes('REWARD');
                default:
                    return true;
            }
        });
    }

    if (filteredHistory.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <img src="${STAKE_IMAGE}" class="w-14 h-14 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                <p class="text-zinc-500 text-sm">No ${currentHistoryFilter === 'ALL' ? 'staking' : currentHistoryFilter.toLowerCase()} history yet</p>
                <p class="text-zinc-600 text-xs mt-1">Your activity will appear here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredHistory.slice(0, 20).map(item => {
        const t = (item.type || '').toUpperCase();
        const details = item.details || {};
        const dateStr = formatDate(item.timestamp || item.createdAt);
        
        // Determine icon and style based on type
        let icon, iconColor, bgColor, label, extraInfo = '';
        
        if (t.includes('FORCE') || (t.includes('UNDELEGAT') && details.feePaid && BigInt(details.feePaid || 0) > 0n)) {
            // Force Unstake
            icon = 'fa-bolt';
            iconColor = '#ef4444';
            bgColor = 'rgba(239,68,68,0.15)';
            label = '⚡ Force Unstaked';
            const feePaid = details.feePaid;
            if (feePaid && BigInt(feePaid) > 0n) {
                const feeNum = formatBigNumber(BigInt(feePaid)).toFixed(2);
                extraInfo = `<span class="ml-2 text-[9px] text-red-400">(penalty: ${feeNum} BKC)</span>`;
            }
        } else if (t.includes('DELEGAT') || (t.includes('STAKE') && !t.includes('UNSTAKE'))) {
            // Stake/Delegate
            icon = 'fa-lock';
            iconColor = '#4ade80';
            bgColor = 'rgba(34,197,94,0.15)';
            label = '🔒 Delegated';
            const pStake = details.pStakeGenerated;
            if (pStake) {
                const pStakeNum = formatBigNumber(BigInt(pStake)).toFixed(0);
                extraInfo = `<span class="ml-2 text-[10px] text-purple-400 font-bold">+${pStakeNum} pStake</span>`;
            }
            const lockDuration = details.lockDuration;
            if (lockDuration) {
                const days = Number(lockDuration) / 86400;
                extraInfo += `<span class="ml-1 text-[9px] text-zinc-500">(${formatDuration(days)})</span>`;
            }
        } else if (t.includes('UNSTAKE') || t.includes('UNDELEGAT')) {
            // Normal Unstake
            icon = 'fa-unlock';
            iconColor = '#fb923c';
            bgColor = 'rgba(249,115,22,0.15)';
            label = '🔓 Unstaked';
            const amountReceived = details.amountReceived;
            if (amountReceived && BigInt(amountReceived) > 0n) {
                const amtNum = formatBigNumber(BigInt(amountReceived)).toFixed(2);
                extraInfo = `<span class="ml-2 text-[9px] text-green-400">+${amtNum} BKC</span>`;
            }
        } else if (t.includes('CLAIM') || t.includes('REWARD')) {
            // Claim Rewards
            icon = 'fa-coins';
            iconColor = '#fbbf24';
            bgColor = 'rgba(245,158,11,0.15)';
            label = '🪙 Rewards Claimed';
            const amountReceived = details.amountReceived;
            const feePaid = details.feePaid;
            if (amountReceived && BigInt(amountReceived) > 0n) {
                const amtNum = formatBigNumber(BigInt(amountReceived)).toFixed(2);
                extraInfo = `<span class="ml-2 text-[9px] text-green-400">+${amtNum} BKC</span>`;
            }
            if (feePaid && BigInt(feePaid) > 0n) {
                const feeNum = formatBigNumber(BigInt(feePaid)).toFixed(2);
                extraInfo += `<span class="ml-1 text-[9px] text-zinc-500">(fee: ${feeNum})</span>`;
            }
        } else {
            // Default
            icon = 'fa-circle';
            iconColor = '#71717a';
            bgColor = 'rgba(39,39,42,0.5)';
            label = item.type || 'Activity';
        }

        const txLink = item.txHash ? `${EXPLORER_TX}${item.txHash}` : '#';
        let rawAmount = item.amount || details.amount || details.amountReceived || "0";
        const amountNum = formatBigNumber(BigInt(rawAmount));
        const amountDisplay = amountNum > 0.001 ? amountNum.toFixed(2) : '';

        return `
            <a href="${txLink}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20" title="${dateStr}">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${bgColor}">
                        <i class="fa-solid ${icon} text-sm" style="color: ${iconColor}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">${label}${extraInfo}</p>
                        <p class="text-zinc-600 text-[10px]">${dateStr}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${amountDisplay ? `<span class="text-xs font-mono font-bold text-white">${amountDisplay} <span class="text-zinc-500">BKC</span></span>` : ''}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `;
    }).join('');
}

function updateStats() {
    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    // Network pStake (igual ao Dashboard)
    setTxt('stat-network', formatPStake(totalNetworkPStake || State.totalNetworkPStake || 0n));
    setTxt('stat-pstake', formatPStake(State.userTotalPStake || 0n));
    setTxt('balance-display', formatBigNumber(State.currentUserBalance || 0n).toFixed(2));

    // Calcula percentual do usuário na rede
    const userPStake = State.userTotalPStake || 0n;
    const networkPStake = totalNetworkPStake || State.totalNetworkPStake || 0n;
    let userPercent = 0;
    if (networkPStake > 0n && userPStake > 0n) {
        userPercent = Number((userPStake * 10000n) / networkPStake) / 100;
    }
    const percentEl = document.getElementById('stat-pstake-percent');
    if (percentEl) {
        percentEl.textContent = userPercent > 0 ? `${userPercent.toFixed(2)}% of network` : '0% of network';
    }

    const feeBips = State.systemFees?.["DELEGATION_FEE_BIPS"] || 50n;
    const feePercent = Number(feeBips) / 100;
    const feeEl = document.getElementById('fee-info');
    if (feeEl) feeEl.textContent = `${feePercent}% fee`;

    calculateUserTotalRewards().then(({ stakingRewards, minerRewards }) => {
        const total = stakingRewards + minerRewards;
        setTxt('stat-rewards', formatBigNumber(total).toFixed(4));
        
        const claimBtn = document.getElementById('claim-btn');
        if (claimBtn) {
            claimBtn.disabled = total <= 0n;
            if (total > 0n) {
                claimBtn.onclick = () => handleClaim(stakingRewards, minerRewards, claimBtn);
            }
        }
    });
}

function resetUI() {
    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setTxt('stat-network', '--');
    setTxt('stat-pstake', '--');
    setTxt('stat-rewards', '--');
    setTxt('balance-display', '0.00');
    setTxt('delegation-count', '0');
    
    const percentEl = document.getElementById('stat-pstake-percent');
    if (percentEl) percentEl.textContent = '--% of network';

    const list = document.getElementById('delegations-list');
    if (list) {
        list.innerHTML = `
            <div class="text-center py-10">
                <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-wallet text-xl text-zinc-600"></i>
                </div>
                <p class="text-zinc-500 text-sm">Connect wallet to view</p>
            </div>
        `;
    }

    const historyList = document.getElementById('staking-history-list');
    if (historyList) {
        historyList.innerHTML = `
            <div class="text-center py-8">
                <img src="${STAKE_IMAGE}" class="w-14 h-14 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                <p class="text-zinc-500 text-sm">Connect wallet to view history</p>
            </div>
        `;
    }
}

// ============================================================================
// DELEGATIONS LIST
// ============================================================================
let countdownInterval = null;

function renderDelegations() {
    const container = document.getElementById('delegations-list');
    if (!container) return;

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    const delegations = State.userDelegations || [];
    
    const countEl = document.getElementById('delegation-count');
    if (countEl) countEl.textContent = `${delegations.length} active`;

    if (delegations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10">
                <img src="${STAKE_IMAGE}" class="w-14 h-14 mx-auto opacity-20 mb-3" onerror="this.outerHTML='<div class=\\'w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3\\'><i class=\\'fa-solid fa-layer-group text-xl text-zinc-600\\'></i></div>'">
                <p class="text-zinc-500 text-sm mb-1">No active delegations</p>
                <p class="text-zinc-600 text-xs">Delegate BKC to start earning</p>
            </div>
        `;
        return;
    }

    const sorted = [...delegations].sort((a, b) => Number(a.unlockTime) - Number(b.unlockTime));
    
    container.innerHTML = sorted.map(d => renderDelegationItem(d)).join('');

    updateCountdowns();
    countdownInterval = setInterval(updateCountdowns, 60000);

    container.querySelectorAll('.unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUnstake(btn.dataset.index, false));
    });
    container.querySelectorAll('.force-unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Confirma antes de force unstake
            const confirmed = confirm('⚠️ Force Unstake will apply a 50% penalty!\n\nAre you sure you want to continue?');
            if (confirmed) {
                handleUnstake(btn.dataset.index, true);
            }
        });
    });
}

function updateCountdowns() {
    const timers = document.querySelectorAll('.countdown-timer');
    const now = Math.floor(Date.now() / 1000);
    
    timers.forEach(timer => {
        const unlockTime = parseInt(timer.dataset.unlockTime);
        const remaining = unlockTime - now;
        timer.textContent = formatTimeRemaining(remaining);
    });
}

function renderDelegationItem(d) {
    const amount = formatBigNumber(d.amount).toFixed(2);
    const pStake = formatPStake(calculatePStake(d.amount, d.lockDuration));
    const unlockTime = Number(d.unlockTime);
    const now = Math.floor(Date.now() / 1000);
    const isLocked = unlockTime > now;
    const remaining = isLocked ? unlockTime - now : 0;

    return `
        <div class="delegation-item bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/50">
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl ${isLocked ? 'bg-amber-500/10' : 'bg-green-500/10'} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid ${isLocked ? 'fa-lock text-amber-400' : 'fa-lock-open text-green-400'} text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white font-bold text-sm truncate">${amount} <span class="text-zinc-500 text-xs">BKC</span></p>
                        <p class="text-purple-400 text-[10px] font-mono">${pStake} pS</p>
                    </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                    ${isLocked ? `
                        <div class="countdown-timer text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/20" 
                             data-unlock-time="${unlockTime}">
                            ${formatTimeRemaining(remaining)}
                        </div>
                        <button class="force-unstake-btn w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors" 
                                data-index="${d.index}" title="Force unstake (50% penalty)">
                            <i class="fa-solid fa-bolt text-red-400 text-xs"></i>
                        </button>
                    ` : `
                        <span class="text-[10px] font-mono bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20">
                            Ready
                        </span>
                        <button class="unstake-btn bg-white hover:bg-zinc-200 text-black text-[10px] font-bold px-3 py-2 rounded-lg transition-colors" 
                                data-index="${d.index}">
                            Unstake
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// PREVIEW CALCULATION
// ============================================================================
function updatePreview() {
    const amountInput = document.getElementById('amount-input');
    const stakeBtn = document.getElementById('stake-btn');
    
    if (!amountInput) return;

    const val = amountInput.value;
    
    if (!val || parseFloat(val) <= 0) {
        document.getElementById('preview-pstake').textContent = '0';
        document.getElementById('preview-net').textContent = '0.00 BKC';
        if (stakeBtn) stakeBtn.disabled = true;
        return;
    }

    try {
        const amountWei = ethers.parseUnits(val, 18);
        const feeBips = State.systemFees?.["DELEGATION_FEE_BIPS"] || 50n;
        const feeWei = (amountWei * BigInt(feeBips)) / 10000n;
        const netWei = amountWei - feeWei;
        
        const durationSec = BigInt(lockDays) * 86400n;
        const pStake = calculatePStake(netWei, durationSec);

        document.getElementById('preview-pstake').textContent = formatPStake(pStake);
        document.getElementById('preview-net').textContent = `${formatBigNumber(netWei).toFixed(4)} BKC`;

        const balance = State.currentUserBalance || 0n;
        if (amountWei > balance) {
            amountInput.classList.add('border-red-500');
            if (stakeBtn) stakeBtn.disabled = true;
        } else {
            amountInput.classList.remove('border-red-500');
            if (stakeBtn) stakeBtn.disabled = isProcessing;
        }
    } catch (e) {
        if (stakeBtn) stakeBtn.disabled = true;
    }
}

// ============================================================================
// ACTIONS
// ============================================================================
async function handleStake() {
    if (isProcessing) return;
    
    const amountInput = document.getElementById('amount-input');
    const stakeBtn = document.getElementById('stake-btn');
    const btnText = document.getElementById('stake-btn-text');
    const btnIcon = document.getElementById('stake-btn-icon');
    const stakeMascot = document.getElementById('stake-mascot');
    
    if (!amountInput || !stakeBtn) return;
    
    const val = amountInput.value;
    if (!val || parseFloat(val) <= 0) {
        showToast('Enter an amount', 'warning');
        return;
    }

    const balance = State.currentUserBalance || 0n;
    let amountWei;
    try {
        amountWei = ethers.parseUnits(val, 18);
        if (amountWei > balance) {
            showToast('Insufficient BKC balance', 'error');
            return;
        }
    } catch (e) {
        showToast('Invalid amount', 'error');
        return;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const ethBalance = await provider.getBalance(State.userAddress);
        const minEth = ethers.parseEther("0.001");
        
        if (ethBalance < minEth) {
            showToast('Insufficient ETH for gas. Need at least 0.001 ETH.', 'error');
            return;
        }
    } catch (e) {
        console.warn('ETH balance check failed:', e);
    }

    isProcessing = true;
    const durationSec = BigInt(lockDays) * 86400n;

    stakeBtn.disabled = true;
    btnText.textContent = 'Processing...';
    btnIcon.className = 'fa-solid fa-spinner fa-spin';
    
    // Animate stake image
    if (stakeMascot) {
        stakeMascot.className = 'w-14 h-14 object-contain stake-rotate stake-glow';
    }

    try {
        const success = await executeDelegation(amountWei, durationSec, highestBoosterTokenId, null);

        if (success) {
            amountInput.value = '';
            showToast('🔒 Delegation successful!', 'success');
            
            // Success animation
            if (stakeMascot) {
                stakeMascot.className = 'w-14 h-14 object-contain stake-success';
                setTimeout(() => {
                    stakeMascot.className = 'w-14 h-14 object-contain stake-pulse stake-float';
                }, 800);
            }
            
            isLoading = false;
            lastFetch = 0;
            await loadData(true);
        }

    } catch (e) {
        console.error('Stake error:', e);
        showToast('Delegation failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
        stakeBtn.disabled = false;
        btnText.textContent = 'Delegate BKC';
        btnIcon.className = 'fa-solid fa-lock';
        
        // Reset animation
        if (stakeMascot) {
            stakeMascot.className = 'w-14 h-14 object-contain stake-pulse stake-float';
        }
        updatePreview();
    }
}

async function handleUnstake(index, isForce) {
    if (isProcessing) return;
    
    const btn = document.querySelector(isForce 
        ? `.force-unstake-btn[data-index='${index}']`
        : `.unstake-btn[data-index='${index}']`
    );
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    }
    
    isProcessing = true;

    try {
        // CORREÇÃO: Passa o índice correto como BigInt
        const delegationIndex = BigInt(index);
        const boosterId = highestBoosterTokenId || 0n;
        
        console.log(`Attempting ${isForce ? 'force ' : ''}unstake:`, {
            delegationIndex: delegationIndex.toString(),
            boosterId: boosterId.toString()
        });
        
        const success = isForce 
            ? await executeForceUnstake(delegationIndex, boosterId)
            : await executeUnstake(delegationIndex, boosterId);

        if (success) {
            showToast(isForce ? '⚡ Force unstaked (50% penalty applied)' : '🔓 Unstaked successfully!', isForce ? 'warning' : 'success');
            // Força recarregamento completo
            isLoading = false;
            lastFetch = 0;
            await loadData(true);
        }
    } catch (e) {
        console.error('Unstake error:', e);
        showToast('Unstake failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
        renderDelegations();
    }
}

async function handleClaim(stakingRewards, minerRewards, btn) {
    if (isProcessing) return;
    isProcessing = true;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const success = await executeUniversalClaim(stakingRewards, minerRewards, highestBoosterTokenId, null);

        if (success) {
            showToast('🪙 Rewards claimed!', 'success');
            isLoading = false;
            lastFetch = 0;
            await loadData(true);
        }
    } catch (e) {
        console.error('Claim error:', e);
        showToast('Claim failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupListeners() {
    const amountInput = document.getElementById('amount-input');
    const maxBtn = document.getElementById('max-btn');
    const stakeBtn = document.getElementById('stake-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const durationChips = document.querySelectorAll('.duration-chip');
    const historyTabs = document.querySelectorAll('.history-tab');

    amountInput?.addEventListener('input', updatePreview);

    maxBtn?.addEventListener('click', () => {
        const balance = State.currentUserBalance || 0n;
        if (amountInput) {
            amountInput.value = ethers.formatUnits(balance, 18);
            updatePreview();
        }
    });

    durationChips.forEach(chip => {
        chip.addEventListener('click', () => {
            durationChips.forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            lockDays = parseInt(chip.dataset.days);
            updatePreview();
        });
    });

    // History filter tabs
    historyTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            historyTabs.forEach(t => {
                t.classList.remove('active');
                t.classList.add('text-zinc-400');
            });
            tab.classList.add('active');
            tab.classList.remove('text-zinc-400');
            currentHistoryFilter = tab.dataset.filter;
            renderStakingHistory();
        });
    });

    stakeBtn?.addEventListener('click', handleStake);

    refreshBtn?.addEventListener('click', () => {
        const icon = refreshBtn.querySelector('i');
        icon?.classList.add('fa-spin');
        loadData(true).then(() => {
            setTimeout(() => icon?.classList.remove('fa-spin'), 500);
        });
    });
}

// ============================================================================
// EXPORTS
// ============================================================================
export function cleanup() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

export function update(isConnected) {
    if (isConnected) {
        loadData();
    } else {
        resetUI();
    }
}

export const EarnPage = {
    render,
    update,
    cleanup
};