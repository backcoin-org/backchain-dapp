// pages/NetworkStakingPage.js
// ✅ PRODUCTION V6.9 - Complete Redesign with Burn Rate System
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                    Network Staking - Delegate & Earn
// ═══════════════════════════════════════════════════════════════════════════════
//
// V6.9 Changes:
// - COMPLETE UI REDESIGN - Modern, clean, functional layout
// - NEW: Burn Rate Display - Shows NFT tier and burn reduction
// - NEW: Claim Preview - Exact breakdown of rewards vs burn
// - NEW: NFT Status Card - Shows if boost is from owned/rented NFT
// - NEW: previewClaim() integration from DelegationManager V6
// - Improved animations and visual feedback
// - Better mobile responsiveness
//
// Burn Rate System (V6):
// ┌──────────┬────────────┬───────────┬─────────────┐
// │ Tier     │ Boost Bips │ Burn Rate │ User Gets   │
// ├──────────┼────────────┼───────────┼─────────────┤
// │ No NFT   │ 0          │ 50%       │ 50%         │
// │ Bronze   │ 1000       │ 40%       │ 60%         │
// │ Silver   │ 2500       │ 25%       │ 75%         │
// │ Gold     │ 4000       │ 10%       │ 90%         │
// │ Diamond  │ 5000       │ 0%        │ 100%        │
// └──────────┴────────────┴───────────┴─────────────┘
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

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
import { showToast } from '../ui-feedback.js';
import { StakingTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";

// V6 Burn Rate Constants (matching contract)
const BURN_TIERS = {
    NONE:    { boost: 0,    burnRate: 50, userGets: 50,  color: '#71717a', name: 'None',    icon: '○' },
    BRONZE:  { boost: 1000, burnRate: 40, userGets: 60,  color: '#cd7f32', name: 'Bronze',  icon: '🥉' },
    SILVER:  { boost: 2500, burnRate: 25, userGets: 75,  color: '#c0c0c0', name: 'Silver',  icon: '🥈' },
    GOLD:    { boost: 4000, burnRate: 10, userGets: 90,  color: '#ffd700', name: 'Gold',    icon: '🥇' },
    DIAMOND: { boost: 5000, burnRate: 0,  userGets: 100, color: '#b9f2ff', name: 'Diamond', icon: '💎' }
};

// ============================================================================
// LOCAL STATE
// ============================================================================
let isLoading = false;
let lastFetch = 0;
let lockDays = 3650;
let isProcessing = false;
let stakingHistory = [];
let totalNetworkPStake = 0n;
let countdownInterval = null;
let currentHistoryFilter = 'ALL';

// V6: NFT Boost State
let userNftBoost = 0;
let userBurnRate = 50;
let nftSource = 'none'; // 'owned', 'rented', or 'none'
let claimPreview = null;

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
        return `${years}y ${remainingDays}d`;
    }
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
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
        return (amountBig * (durationBig / 86400n)) / (10n**18n);
    } catch { return 0n; }
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        return new Date(secs * 1000).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
    } catch { return ''; }
}

// V6: Get tier info from boost value
function getTierFromBoost(boost) {
    if (boost >= 5000) return BURN_TIERS.DIAMOND;
    if (boost >= 4000) return BURN_TIERS.GOLD;
    if (boost >= 2500) return BURN_TIERS.SILVER;
    if (boost >= 1000) return BURN_TIERS.BRONZE;
    return BURN_TIERS.NONE;
}

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('staking-styles-v6')) return;
    
    const style = document.createElement('style');
    style.id = 'staking-styles-v6';
    style.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Network Staking Styles - Clean & Functional
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0); } 
            50% { transform: translateY(-6px); } 
        }
        @keyframes pulse-glow { 
            0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.2); } 
            50% { box-shadow: 0 0 40px rgba(139,92,246,0.4); } 
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        @keyframes burn-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        
        .float-animation { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        
        .card-base {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .card-base:hover { 
            border-color: rgba(139,92,246,0.3);
            transform: translateY(-2px);
        }
        
        .stat-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.7) 0%, rgba(24,24,27,0.8) 100%);
            border: 1px solid rgba(63,63,70,0.4);
            border-radius: 12px;
        }
        
        /* Duration Chips */
        .duration-chip {
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .duration-chip:hover { 
            transform: scale(1.02);
            border-color: rgba(139,92,246,0.5);
        }
        .duration-chip.selected {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
            border-color: #8b5cf6 !important;
            color: white !important;
            box-shadow: 0 4px 15px rgba(124,58,237,0.3);
        }
        .duration-chip.recommended::before {
            content: '★';
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            font-size: 10px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(245,158,11,0.4);
        }
        
        /* NFT Tier Badge */
        .nft-tier-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 12px;
            border: 1px solid;
            transition: all 0.3s ease;
        }
        .nft-tier-badge:hover { transform: scale(1.05); }
        
        .tier-none { background: rgba(113,113,122,0.15); border-color: rgba(113,113,122,0.3); color: #a1a1aa; }
        .tier-bronze { background: rgba(205,127,50,0.15); border-color: rgba(205,127,50,0.4); color: #cd7f32; }
        .tier-silver { background: rgba(192,192,192,0.15); border-color: rgba(192,192,192,0.4); color: #e5e5e5; }
        .tier-gold { background: rgba(255,215,0,0.15); border-color: rgba(255,215,0,0.4); color: #ffd700; }
        .tier-diamond { background: rgba(185,242,255,0.15); border-color: rgba(185,242,255,0.4); color: #b9f2ff; }
        
        /* Burn Rate Indicator */
        .burn-indicator {
            position: relative;
            height: 8px;
            background: rgba(239,68,68,0.2);
            border-radius: 4px;
            overflow: hidden;
        }
        .burn-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, #ef4444, #f87171);
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        .receive-fill {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, #22c55e, #4ade80);
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        
        /* Claim Preview Card */
        .claim-preview {
            background: linear-gradient(145deg, rgba(22,163,74,0.1) 0%, rgba(21,128,61,0.05) 100%);
            border: 1px solid rgba(34,197,94,0.3);
            border-radius: 12px;
        }
        .claim-preview.has-burn {
            background: linear-gradient(145deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%);
            border-color: rgba(245,158,11,0.3);
        }
        
        /* Delegation Item */
        .delegation-item {
            background: rgba(39,39,42,0.5);
            border: 1px solid rgba(63,63,70,0.3);
            border-radius: 12px;
            transition: all 0.2s ease;
        }
        .delegation-item:hover { 
            background: rgba(63,63,70,0.4);
            transform: translateX(4px);
            border-color: rgba(139,92,246,0.3);
        }
        
        /* Buttons */
        .btn-primary {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            color: white;
            font-weight: 600;
            border: none;
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-primary:hover:not(:disabled) {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(124,58,237,0.3);
        }
        .btn-primary:disabled { 
            opacity: 0.5; 
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-claim {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
        }
        .btn-claim:hover:not(:disabled) {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            box-shadow: 0 8px 25px rgba(245,158,11,0.3);
        }
        
        /* History Tabs */
        .history-tab {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid rgba(63,63,70,0.5);
            background: rgba(39,39,42,0.5);
            color: #a1a1aa;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .history-tab:hover { background: rgba(63,63,70,0.6); }
        .history-tab.active {
            background: rgba(139,92,246,0.2);
            border-color: rgba(139,92,246,0.5);
            color: #a78bfa;
        }
        
        /* Input Styling */
        .input-amount {
            background: rgba(0,0,0,0.4);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 12px;
            color: white;
            font-size: 24px;
            font-family: 'JetBrains Mono', monospace;
            padding: 16px;
            width: 100%;
            outline: none;
            transition: all 0.2s ease;
        }
        .input-amount:focus {
            border-color: rgba(139,92,246,0.6);
            box-shadow: 0 0 20px rgba(139,92,246,0.1);
        }
        .input-amount.error { border-color: rgba(239,68,68,0.6); }
        
        /* Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.5); }
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
        <div class="max-w-5xl mx-auto px-4 py-6">
            
            <!-- ═══════════════════════════════════════════════════════════════
                 HEADER
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-layer-group text-2xl text-purple-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Network Staking</h1>
                        <p class="text-sm text-zinc-500">Delegate BKC • Earn Rewards • Reduce Burn</p>
                    </div>
                </div>
                <button id="refresh-btn" class="w-10 h-10 rounded-xl bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 flex items-center justify-center transition-all hover:scale-105">
                    <i class="fa-solid fa-rotate text-zinc-400"></i>
                </button>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 NFT BOOST STATUS CARD (V6 Feature)
                 ═══════════════════════════════════════════════════════════════ -->
            <div id="nft-boost-card" class="card-base p-4 mb-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div id="nft-tier-icon" class="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl">
                            ○
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span id="nft-tier-badge" class="nft-tier-badge tier-none">
                                    <span>No NFT</span>
                                </span>
                                <span id="nft-source" class="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded hidden">
                                    owned
                                </span>
                            </div>
                            <p class="text-xs text-zinc-500">
                                <span id="burn-rate-text">50% of rewards will be burned on claim</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="text-center">
                            <p class="text-[10px] text-zinc-500 uppercase mb-1">Burn Rate</p>
                            <p id="burn-rate-value" class="text-xl font-bold text-red-400 font-mono">50%</p>
                        </div>
                        <div class="text-center">
                            <p class="text-[10px] text-zinc-500 uppercase mb-1">You Keep</p>
                            <p id="keep-rate-value" class="text-xl font-bold text-green-400 font-mono">50%</p>
                        </div>
                        <a href="#/marketplace" class="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-store"></i>
                            <span>Get NFT</span>
                        </a>
                    </div>
                </div>
                <!-- Burn Rate Bar -->
                <div class="mt-4">
                    <div class="burn-indicator">
                        <div id="burn-fill" class="burn-fill" style="width: 50%"></div>
                        <div id="receive-fill" class="receive-fill" style="width: 50%"></div>
                    </div>
                    <div class="flex justify-between mt-1">
                        <span class="text-[9px] text-red-400/70">🔥 Burned</span>
                        <span class="text-[9px] text-green-400/70">✓ You Receive</span>
                    </div>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 STATS ROW
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div class="stat-card p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-globe text-purple-400 text-sm"></i>
                        <span class="text-[10px] text-zinc-500 uppercase">Network</span>
                    </div>
                    <p id="stat-network" class="text-lg font-bold text-white font-mono">--</p>
                    <p class="text-[10px] text-zinc-600">Total pStake</p>
                </div>
                
                <div class="stat-card p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-lock text-blue-400 text-sm"></i>
                        <span class="text-[10px] text-zinc-500 uppercase">Your Power</span>
                    </div>
                    <p id="stat-pstake" class="text-lg font-bold text-white font-mono">--</p>
                    <p id="stat-pstake-percent" class="text-[10px] text-zinc-600">--% of network</p>
                </div>
                
                <div class="stat-card p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-coins text-amber-400 text-sm"></i>
                        <span class="text-[10px] text-zinc-500 uppercase">Pending</span>
                    </div>
                    <p id="stat-rewards" class="text-lg font-bold text-amber-400 font-mono">--</p>
                    <p class="text-[10px] text-zinc-600">BKC Rewards</p>
                </div>
                
                <div class="stat-card p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-layer-group text-green-400 text-sm"></i>
                        <span class="text-[10px] text-zinc-500 uppercase">Delegations</span>
                    </div>
                    <p id="stat-delegations" class="text-lg font-bold text-white font-mono">0</p>
                    <p class="text-[10px] text-zinc-600">Active Locks</p>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 CLAIM REWARDS SECTION (V6 with Burn Preview)
                 ═══════════════════════════════════════════════════════════════ -->
            <div id="claim-section" class="claim-preview p-4 mb-6 hidden">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex-1">
                        <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-gift text-amber-400"></i>
                            Claim Your Rewards
                        </h3>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <p class="text-[10px] text-zinc-500 uppercase mb-1">Total Earned</p>
                                <p id="claim-total" class="text-lg font-bold text-white font-mono">0.00</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-red-400 uppercase mb-1">🔥 Burned</p>
                                <p id="claim-burn" class="text-lg font-bold text-red-400 font-mono">0.00</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-green-400 uppercase mb-1">✓ You Get</p>
                                <p id="claim-receive" class="text-lg font-bold text-green-400 font-mono">0.00</p>
                            </div>
                        </div>
                    </div>
                    <button id="claim-btn" class="btn-primary btn-claim px-6 py-3 text-sm font-bold flex items-center gap-2">
                        <i class="fa-solid fa-hand-holding-dollar"></i>
                        <span>Claim Rewards</span>
                    </button>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 MAIN CONTENT GRID
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <!-- DELEGATE CARD -->
                <div class="card-base p-5">
                    <div class="flex items-center gap-3 mb-5">
                        <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-plus text-purple-400"></i>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-white">Delegate BKC</h2>
                            <p class="text-xs text-zinc-500">Lock tokens to earn network rewards</p>
                        </div>
                    </div>

                    <!-- Amount Input -->
                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label class="text-xs text-zinc-400 font-medium">Amount</label>
                            <span class="text-xs text-zinc-500">
                                Balance: <span id="balance-display" class="text-white font-mono">0.00</span> BKC
                            </span>
                        </div>
                        <div class="relative">
                            <input type="number" id="amount-input" placeholder="0.00" 
                                   class="input-amount pr-20">
                            <button id="max-btn" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg transition-colors">
                                MAX
                            </button>
                        </div>
                    </div>

                    <!-- Lock Duration -->
                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-3">
                            <label class="text-xs text-zinc-400 font-medium">Lock Duration</label>
                            <span class="text-[10px] text-amber-400 flex items-center gap-1">
                                <i class="fa-solid fa-star"></i> 10Y = Maximum Rewards
                            </span>
                        </div>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="duration-chip relative py-3 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-400" data-days="30">
                                1M
                            </button>
                            <button class="duration-chip relative py-3 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-400" data-days="365">
                                1Y
                            </button>
                            <button class="duration-chip relative py-3 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-400" data-days="1825">
                                5Y
                            </button>
                            <button class="duration-chip recommended relative py-3 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-400 selected" data-days="3650">
                                10Y
                            </button>
                        </div>
                    </div>

                    <!-- Preview -->
                    <div class="bg-black/30 rounded-xl p-4 mb-5 border border-zinc-800">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-[10px] text-zinc-500 uppercase mb-1">You'll Generate</p>
                                <p id="preview-pstake" class="text-2xl font-bold text-purple-400 font-mono">0</p>
                                <p class="text-[10px] text-zinc-500">pStake Power</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-zinc-500 uppercase mb-1">After Fee</p>
                                <p id="preview-net" class="text-sm text-white font-mono">0.00 BKC</p>
                                <p id="fee-info" class="text-[10px] text-zinc-600">0.5% protocol fee</p>
                            </div>
                        </div>
                    </div>

                    <!-- Delegate Button -->
                    <button id="stake-btn" disabled class="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
                        <span id="stake-btn-text">Delegate BKC</span>
                        <i id="stake-btn-icon" class="fa-solid fa-lock"></i>
                    </button>
                </div>

                <!-- ACTIVE DELEGATIONS -->
                <div class="card-base p-5">
                    <div class="flex items-center justify-between mb-5">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-zinc-700/50 flex items-center justify-center">
                                <i class="fa-solid fa-list text-zinc-400"></i>
                            </div>
                            <div>
                                <h2 class="text-lg font-bold text-white">Active Delegations</h2>
                                <p class="text-xs text-zinc-500">Your locked positions</p>
                            </div>
                        </div>
                        <span id="delegation-count" class="text-xs text-zinc-500 bg-zinc-800 px-3 py-1 rounded-lg font-mono">0</span>
                    </div>

                    <div id="delegations-list" class="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                        ${renderLoading()}
                    </div>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 STAKING HISTORY
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="card-base p-5 mt-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <i class="fa-solid fa-clock-rotate-left text-purple-400"></i>
                        </div>
                        <h2 class="text-lg font-bold text-white">Staking History</h2>
                    </div>
                    <div class="flex gap-2">
                        <button class="history-tab active" data-filter="ALL">All</button>
                        <button class="history-tab" data-filter="STAKE">Stakes</button>
                        <button class="history-tab" data-filter="UNSTAKE">Unstakes</button>
                        <button class="history-tab" data-filter="CLAIM">Claims</button>
                    </div>
                </div>
                <div id="staking-history-list" class="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    <div class="text-center py-8">
                        <i class="fa-solid fa-spinner fa-spin text-2xl text-zinc-600 mb-3"></i>
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
        // V6: Load NFT boost info
        await loadNftBoostData();

        // Load network pStake from Firebase first
        try {
            const systemResponse = await fetch('https://getsystemdata-4wvdcuoouq-uc.a.run.app');
            if (systemResponse.ok) {
                const systemData = await systemResponse.json();
                if (systemData?.economy?.totalPStake) {
                    totalNetworkPStake = BigInt(systemData.economy.totalPStake);
                }
            }
        } catch (e) {
            console.log('Firebase unavailable, using blockchain');
        }
        
        // Fallback to blockchain
        if (totalNetworkPStake === 0n) {
            const contract = State.delegationManagerContractPublic || State.delegationManagerContract;
            if (contract) {
                totalNetworkPStake = await safeContractCall(contract, 'totalNetworkPStake', [], 0n);
            }
        }

        await Promise.all([
            loadUserData(true),
            loadUserDelegations(true),
            loadPublicData()
        ]);

        // V6: Load claim preview from contract
        await loadClaimPreview();

        updateUI();
        renderDelegations();
        updatePreview();
        loadStakingHistory();

    } catch (e) {
        console.error("Staking load error:", e);
    } finally {
        isLoading = false;
    }
}

// V6: Load NFT boost data
async function loadNftBoostData() {
    try {
        // Try to get boost from contract first (includes rented NFTs)
        const contract = State.delegationManagerContract || State.delegationManagerContractPublic;
        if (contract && State.userAddress) {
            try {
                const boost = await contract.getUserBestBoost(State.userAddress);
                userNftBoost = Number(boost);
            } catch {
                // Fallback to API
                const boosterData = await getHighestBoosterBoostFromAPI();
                userNftBoost = boosterData?.boost || 0;
            }
        } else {
            const boosterData = await getHighestBoosterBoostFromAPI();
            userNftBoost = boosterData?.boost || 0;
        }

        // Calculate burn rate from boost
        const tier = getTierFromBoost(userNftBoost);
        userBurnRate = tier.burnRate;

        // Determine source (owned vs rented) - simplified
        nftSource = userNftBoost > 0 ? 'active' : 'none';

        updateNftBoostUI();
    } catch (e) {
        console.error('Error loading NFT boost:', e);
        userNftBoost = 0;
        userBurnRate = 50;
    }
}

// V6: Load claim preview from contract
async function loadClaimPreview() {
    try {
        const contract = State.delegationManagerContract || State.delegationManagerContractPublic;
        if (contract && State.userAddress) {
            try {
                const preview = await contract.previewClaim(State.userAddress);
                claimPreview = {
                    totalRewards: preview.totalRewards || preview[0],
                    burnAmount: preview.burnAmount || preview[1],
                    userReceives: preview.userReceives || preview[2],
                    burnRateBips: preview.burnRateBips || preview[3],
                    nftBoost: preview.nftBoost || preview[4]
                };
            } catch {
                // Contract doesn't have previewClaim, calculate manually
                const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
                const total = stakingRewards + minerRewards;
                const burnAmount = (total * BigInt(userBurnRate)) / 100n;
                claimPreview = {
                    totalRewards: total,
                    burnAmount: burnAmount,
                    userReceives: total - burnAmount,
                    burnRateBips: BigInt(userBurnRate * 100),
                    nftBoost: BigInt(userNftBoost)
                };
            }
        }
    } catch (e) {
        console.error('Error loading claim preview:', e);
    }
}

// V6: Update NFT Boost UI
function updateNftBoostUI() {
    const tier = getTierFromBoost(userNftBoost);
    
    // Update tier icon
    const iconEl = document.getElementById('nft-tier-icon');
    if (iconEl) {
        iconEl.textContent = tier.icon;
        iconEl.style.background = `${tier.color}20`;
    }
    
    // Update tier badge
    const badgeEl = document.getElementById('nft-tier-badge');
    if (badgeEl) {
        badgeEl.className = `nft-tier-badge tier-${tier.name.toLowerCase()}`;
        badgeEl.innerHTML = `<span>${tier.icon} ${tier.name}</span>`;
    }
    
    // Update source indicator
    const sourceEl = document.getElementById('nft-source');
    if (sourceEl) {
        if (userNftBoost > 0) {
            sourceEl.classList.remove('hidden');
            sourceEl.textContent = nftSource;
        } else {
            sourceEl.classList.add('hidden');
        }
    }
    
    // Update burn rate text
    const burnTextEl = document.getElementById('burn-rate-text');
    if (burnTextEl) {
        if (tier.burnRate === 0) {
            burnTextEl.innerHTML = `<span class="text-green-400">No burn! You keep 100% of rewards</span>`;
        } else {
            burnTextEl.textContent = `${tier.burnRate}% of rewards will be burned on claim`;
        }
    }
    
    // Update burn rate values
    const burnValueEl = document.getElementById('burn-rate-value');
    const keepValueEl = document.getElementById('keep-rate-value');
    if (burnValueEl) burnValueEl.textContent = `${tier.burnRate}%`;
    if (keepValueEl) keepValueEl.textContent = `${tier.userGets}%`;
    
    // Update burn rate bar
    const burnFillEl = document.getElementById('burn-fill');
    const receiveFillEl = document.getElementById('receive-fill');
    if (burnFillEl) burnFillEl.style.width = `${tier.burnRate}%`;
    if (receiveFillEl) receiveFillEl.style.width = `${tier.userGets}%`;
}

// Update main stats UI
function updateUI() {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setText('stat-network', formatPStake(totalNetworkPStake || State.totalNetworkPStake || 0n));
    setText('stat-pstake', formatPStake(State.userTotalPStake || 0n));
    setText('balance-display', formatBigNumber(State.currentUserBalance || 0n).toFixed(2));
    setText('stat-delegations', (State.userDelegations || []).length.toString());

    // Calculate user percentage
    const userPStake = State.userTotalPStake || 0n;
    const networkPStake = totalNetworkPStake || State.totalNetworkPStake || 0n;
    let userPercent = 0;
    if (networkPStake > 0n && userPStake > 0n) {
        userPercent = Number((userPStake * 10000n) / networkPStake) / 100;
    }
    setText('stat-pstake-percent', userPercent > 0 ? `${userPercent.toFixed(2)}% of network` : '0% of network');

    // Fee info
    const feeBips = State.systemFees?.["DELEGATION_FEE_BIPS"] || 50n;
    const feePercent = Number(feeBips) / 100;
    setText('fee-info', `${feePercent}% protocol fee`);

    // Update rewards and claim section
    updateClaimSection();
}

// Update claim section with V6 burn preview
async function updateClaimSection() {
    const claimSection = document.getElementById('claim-section');
    if (!claimSection) return;

    const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
    const totalRewards = stakingRewards + minerRewards;

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setText('stat-rewards', formatBigNumber(totalRewards).toFixed(4));

    if (totalRewards > 0n) {
        claimSection.classList.remove('hidden');
        
        // Use contract preview if available, otherwise calculate
        let burnAmount, userReceives;
        if (claimPreview && claimPreview.totalRewards > 0n) {
            burnAmount = claimPreview.burnAmount;
            userReceives = claimPreview.userReceives;
        } else {
            burnAmount = (totalRewards * BigInt(userBurnRate)) / 100n;
            userReceives = totalRewards - burnAmount;
        }

        setText('claim-total', formatBigNumber(totalRewards).toFixed(4));
        setText('claim-burn', formatBigNumber(burnAmount).toFixed(4));
        setText('claim-receive', formatBigNumber(userReceives).toFixed(4));

        // Add has-burn class if burn > 0
        if (burnAmount > 0n) {
            claimSection.classList.add('has-burn');
        } else {
            claimSection.classList.remove('has-burn');
        }

        // Setup claim button
        const claimBtn = document.getElementById('claim-btn');
        if (claimBtn) {
            claimBtn.onclick = () => handleClaim(stakingRewards, minerRewards, claimBtn);
        }
    } else {
        claimSection.classList.add('hidden');
    }
}

function resetUI() {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setText('stat-network', '--');
    setText('stat-pstake', '--');
    setText('stat-rewards', '--');
    setText('stat-delegations', '0');
    setText('balance-display', '0.00');
    setText('stat-pstake-percent', '--% of network');

    const list = document.getElementById('delegations-list');
    if (list) {
        list.innerHTML = `
            <div class="text-center py-12">
                <div class="w-14 h-14 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-wallet text-xl text-zinc-600"></i>
                </div>
                <p class="text-zinc-500 text-sm">Connect wallet to view</p>
            </div>
        `;
    }

    const historyList = document.getElementById('staking-history-list');
    if (historyList) {
        historyList.innerHTML = `
            <div class="text-center py-12">
                <i class="fa-solid fa-clock-rotate-left text-2xl text-zinc-700 mb-3"></i>
                <p class="text-zinc-500 text-sm">Connect wallet to view history</p>
            </div>
        `;
    }

    const claimSection = document.getElementById('claim-section');
    if (claimSection) claimSection.classList.add('hidden');
}

// ============================================================================
// DELEGATIONS LIST
// ============================================================================
function renderDelegations() {
    const container = document.getElementById('delegations-list');
    if (!container) return;

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    const delegations = State.userDelegations || [];
    
    const countEl = document.getElementById('delegation-count');
    if (countEl) countEl.textContent = delegations.length.toString();
    
    const statEl = document.getElementById('stat-delegations');
    if (statEl) statEl.textContent = delegations.length.toString();

    if (delegations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-layer-group text-xl text-purple-400/50"></i>
                </div>
                <p class="text-zinc-500 text-sm mb-1">No active delegations</p>
                <p class="text-zinc-600 text-xs">Delegate BKC to start earning rewards</p>
            </div>
        `;
        return;
    }

    const sorted = [...delegations].sort((a, b) => Number(a.unlockTime) - Number(b.unlockTime));
    container.innerHTML = sorted.map(d => renderDelegationItem(d)).join('');

    updateCountdowns();
    countdownInterval = setInterval(updateCountdowns, 60000);

    // Setup button listeners
    container.querySelectorAll('.unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUnstake(btn.dataset.index, false));
    });
    container.querySelectorAll('.force-unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('⚠️ Force Unstake will apply a 50% penalty!\n\nAre you sure?')) {
                handleUnstake(btn.dataset.index, true);
            }
        });
    });
}

function renderDelegationItem(d) {
    const amount = formatBigNumber(d.amount).toFixed(2);
    const pStake = formatPStake(calculatePStake(d.amount, d.lockDuration));
    const unlockTime = Number(d.unlockTime);
    const now = Math.floor(Date.now() / 1000);
    const isLocked = unlockTime > now;
    const remaining = isLocked ? unlockTime - now : 0;
    const lockDays = Math.floor(Number(d.lockDuration) / 86400);

    return `
        <div class="delegation-item p-3">
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-11 h-11 rounded-xl ${isLocked ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-green-500/10 border border-green-500/20'} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid ${isLocked ? 'fa-lock text-amber-400' : 'fa-lock-open text-green-400'}"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white font-bold text-sm">${amount} <span class="text-zinc-500 text-xs font-normal">BKC</span></p>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-purple-400 text-[10px] font-mono">${pStake} pS</span>
                            <span class="text-zinc-600 text-[10px]">•</span>
                            <span class="text-zinc-500 text-[10px]">${formatDuration(lockDays)}</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                    ${isLocked ? `
                        <div class="countdown-timer text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2.5 py-1.5 rounded-lg border border-amber-500/20" 
                             data-unlock-time="${unlockTime}">
                            ${formatTimeRemaining(remaining)}
                        </div>
                        <button class="force-unstake-btn w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all hover:scale-105" 
                                data-index="${d.index}" title="Force unstake (50% penalty)">
                            <i class="fa-solid fa-bolt text-red-400 text-xs"></i>
                        </button>
                    ` : `
                        <span class="text-[10px] font-mono bg-green-500/10 text-green-400 px-2.5 py-1.5 rounded-lg border border-green-500/20">
                            ✓ Ready
                        </span>
                        <button class="unstake-btn bg-white hover:bg-zinc-100 text-black text-[10px] font-bold px-4 py-2 rounded-lg transition-all hover:scale-105" 
                                data-index="${d.index}">
                            Unstake
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

function updateCountdowns() {
    const timers = document.querySelectorAll('.countdown-timer');
    const now = Math.floor(Date.now() / 1000);
    
    timers.forEach(timer => {
        const unlockTime = parseInt(timer.dataset.unlockTime);
        timer.textContent = formatTimeRemaining(unlockTime - now);
    });
}

// ============================================================================
// STAKING HISTORY
// ============================================================================
async function loadStakingHistory() {
    if (!State.userAddress) return;
    
    try {
        const endpoint = API_ENDPOINTS.getHistory || 'https://gethistory-4wvdcuoouq-uc.a.run.app';
        const response = await fetch(`${endpoint}/${State.userAddress}`);
        if (response.ok) {
            const data = await response.json();
            stakingHistory = (data || []).filter(item => {
                const t = (item.type || '').toUpperCase();
                return t.includes('DELEGAT') || t.includes('STAKE') || 
                       t.includes('UNDELEGAT') || t.includes('CLAIM') || 
                       t.includes('REWARD') || t.includes('FORCE');
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
            <div class="text-center py-12">
                <i class="fa-solid fa-inbox text-3xl text-zinc-700 mb-3"></i>
                <p class="text-zinc-500 text-sm">No ${currentHistoryFilter === 'ALL' ? 'staking' : currentHistoryFilter.toLowerCase()} history yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredHistory.slice(0, 25).map(item => {
        const t = (item.type || '').toUpperCase();
        const details = item.details || {};
        const dateStr = formatDate(item.timestamp || item.createdAt);
        
        let icon, iconBg, iconColor, label, extraInfo = '';
        
        if (t.includes('FORCE')) {
            icon = 'fa-bolt';
            iconBg = 'bg-red-500/15';
            iconColor = 'text-red-400';
            label = 'Force Unstaked';
            if (details.feePaid && BigInt(details.feePaid) > 0n) {
                extraInfo = `<span class="text-red-400">-${formatBigNumber(BigInt(details.feePaid)).toFixed(2)} penalty</span>`;
            }
        } else if ((t.includes('DELEGAT') || t.includes('STAKE')) && !t.includes('UNSTAKE')) {
            icon = 'fa-lock';
            iconBg = 'bg-green-500/15';
            iconColor = 'text-green-400';
            label = 'Delegated';
            if (details.pStakeGenerated) {
                extraInfo = `<span class="text-purple-400">+${formatBigNumber(BigInt(details.pStakeGenerated)).toFixed(0)} pS</span>`;
            }
        } else if (t.includes('UNSTAKE') || t.includes('UNDELEGAT')) {
            icon = 'fa-unlock';
            iconBg = 'bg-orange-500/15';
            iconColor = 'text-orange-400';
            label = 'Unstaked';
        } else if (t.includes('CLAIM') || t.includes('REWARD')) {
            icon = 'fa-coins';
            iconBg = 'bg-amber-500/15';
            iconColor = 'text-amber-400';
            label = 'Claimed';
            if (details.amountReceived && BigInt(details.amountReceived) > 0n) {
                extraInfo = `<span class="text-green-400">+${formatBigNumber(BigInt(details.amountReceived)).toFixed(2)}</span>`;
            }
        } else {
            icon = 'fa-circle';
            iconBg = 'bg-zinc-500/15';
            iconColor = 'text-zinc-400';
            label = item.type || 'Activity';
        }

        const txLink = item.txHash ? `${EXPLORER_TX}${item.txHash}` : '#';
        const rawAmount = item.amount || details.amount || details.amountReceived || "0";
        const amountNum = formatBigNumber(BigInt(rawAmount));
        const amountDisplay = amountNum > 0.001 ? amountNum.toFixed(2) : '';

        return `
            <a href="${txLink}" target="_blank" class="delegation-item flex items-center justify-between p-3 group">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center">
                        <i class="fa-solid ${icon} text-sm ${iconColor}"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="text-white text-xs font-medium">${label}</p>
                            ${extraInfo ? `<span class="text-[10px]">${extraInfo}</span>` : ''}
                        </div>
                        <p class="text-zinc-600 text-[10px]">${dateStr}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${amountDisplay ? `<span class="text-xs font-mono font-medium text-white">${amountDisplay} <span class="text-zinc-500">BKC</span></span>` : ''}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-purple-400 text-[10px] transition-colors"></i>
                </div>
            </a>
        `;
    }).join('');
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
            amountInput.classList.add('error');
            if (stakeBtn) stakeBtn.disabled = true;
        } else {
            amountInput.classList.remove('error');
            if (stakeBtn) stakeBtn.disabled = isProcessing;
        }
    } catch {
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
    } catch {
        showToast('Invalid amount', 'error');
        return;
    }

    // Check ETH for gas
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const ethBalance = await provider.getBalance(State.userAddress);
        if (ethBalance < ethers.parseEther("0.001")) {
            showToast('Insufficient ETH for gas', 'error');
            return;
        }
    } catch {}

    isProcessing = true;
    const durationSec = BigInt(lockDays) * 86400n;

    stakeBtn.disabled = true;
    btnText.textContent = 'Processing...';
    btnIcon.className = 'fa-solid fa-spinner fa-spin';

    try {
        await StakingTx.delegate({
            amount: amountWei,
            lockDuration: durationSec,
            button: stakeBtn,
            
            onSuccess: async () => {
                amountInput.value = '';
                showToast('🔒 Delegation successful!', 'success');
                isLoading = false;
                lastFetch = 0;
                await loadData(true);
            },
            
            onError: (error) => {
                if (!error.cancelled) {
                    showToast('Delegation failed: ' + (error.reason || error.message || 'Unknown error'), 'error');
                }
            }
        });

    } catch (e) {
        showToast('Delegation failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
        stakeBtn.disabled = false;
        btnText.textContent = 'Delegate BKC';
        btnIcon.className = 'fa-solid fa-lock';
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
        const delegationIndex = BigInt(index);
        const txMethod = isForce ? StakingTx.forceUnstake : StakingTx.unstake;
        
        await txMethod({
            delegationIndex: delegationIndex,
            button: btn,
            
            onSuccess: async () => {
                showToast(isForce ? '⚡ Force unstaked (50% penalty applied)' : '🔓 Unstaked successfully!', isForce ? 'warning' : 'success');
                isLoading = false;
                lastFetch = 0;
                await loadData(true);
            },
            
            onError: (error) => {
                if (!error.cancelled) {
                    showToast('Unstake failed: ' + (error.reason || error.message || 'Unknown error'), 'error');
                }
            }
        });
        
    } catch (e) {
        showToast('Unstake failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
        renderDelegations();
    }
}

async function handleClaim(stakingRewards, minerRewards, btn) {
    if (isProcessing) return;
    isProcessing = true;

    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {
        await StakingTx.claimRewards({
            button: btn,
            
            onSuccess: async () => {
                showToast('🪙 Rewards claimed!', 'success');
                isLoading = false;
                lastFetch = 0;
                await loadData(true);
            },
            
            onError: (error) => {
                if (!error.cancelled) {
                    showToast('Claim failed: ' + (error.reason || error.message || 'Unknown error'), 'error');
                }
            }
        });
        
    } catch (e) {
        showToast('Claim failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
        btn.disabled = false;
        btn.innerHTML = originalHTML;
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

    historyTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            historyTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
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