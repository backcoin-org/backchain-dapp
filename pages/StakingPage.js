// pages/StakingPage.js
// ✅ PRODUCTION V10.2 — NFT Tier Comparison + Tutor System
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                    Stake & Earn — Unified Hub
// ═══════════════════════════════════════════════════════════════════════════════
//
// V10.0 Changes:
// - MERGED into single unified StakingPage (was EarnPage + RewardsPage)
// - Complete visual redesign with CSS injection (stk-styles-v10)
// - Hero rewards card with animated amount + NFT boost panel
// - Full-width layout, mobile-first responsive design
// - Removed duplicate code (RECYCLE_TIERS, NFT load, claim preview)
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

const ethers = window.ethers;

import { State } from '../state.js';
import { formatBigNumber, formatPStake, renderLoading } from '../utils.js';
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
import { StakingTx, BuybackTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";

const RECYCLE_TIERS = {
    NONE:    { boost: 0,    recycleRate: 60, keepRate: 40,  color: '#71717a', name: 'None',    icon: '○',  class: 'stk-tier-none' },
    BRONZE:  { boost: 1000, recycleRate: 40, keepRate: 60,  color: '#cd7f32', name: 'Bronze',  icon: '🥉', class: 'stk-tier-bronze' },
    SILVER:  { boost: 2500, recycleRate: 30, keepRate: 70,  color: '#c0c0c0', name: 'Silver',  icon: '🥈', class: 'stk-tier-silver' },
    GOLD:    { boost: 4000, recycleRate: 20, keepRate: 80,  color: '#ffd700', name: 'Gold',    icon: '🥇', class: 'stk-tier-gold' },
    DIAMOND: { boost: 5000, recycleRate: 0,  keepRate: 100, color: '#b9f2ff', name: 'Diamond', icon: '💎', class: 'stk-tier-diamond' }
};

// ============================================================================
// LOCAL STATE
// ============================================================================
let isLoading = false;
let lastFetch = 0;
let lockDays = 3650;
let isProcessing = false;
let stakingHistory = [];
let totalPStakeNetwork = 0n;
let countdownInterval = null;
let currentHistoryFilter = 'ALL';

// NFT Boost State
let userNftBoost = 0;
let userRecycleRate = 60;
let nftSource = 'none';
let claimPreview = null;
let claimEthFee = 0n;

// Tutor State
let userTutor = null; // address or null
let hasTutor = false;

// Rewards split
let stakingRewardsAmount = 0n;
let minerRewardsAmount = 0n;

// Buyback State
let buybackPreview = null;
let buybackStats = null;
let buybackLastInfo = null;
let buybackFee = 0n;

// ============================================================================
// HELPERS
// ============================================================================
function formatTimeRemaining(seconds) {
    if (seconds <= 0) return 'Ready';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}mo`;
    if (days > 30) return `${Math.floor(days / 30)}mo ${days % 30}d`;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function formatDuration(days) {
    if (days >= 365) {
        const years = Math.floor(days / 365);
        return years === 1 ? '1 Year' : `${years} Years`;
    }
    if (days >= 30) return `${Math.floor(days / 30)} Month(s)`;
    return `${days} Day(s)`;
}

function calculatePStake(amount, durationSec) {
    if (amount <= 0n || durationSec <= 0n) return 0n;
    const days = durationSec / 86400n;
    // Match contract: pStake = amount * (10000 + lockDays * 5918 / 365) / 10000
    const BPS = 10000n;
    const multiplier = BPS + (days * 5918n / 365n);
    return amount * multiplier / BPS;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Recent';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        return new Date(secs * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Recent'; }
}

function getTierFromBoost(boost) {
    const b = Number(boost);
    if (b >= 5000) return RECYCLE_TIERS.DIAMOND;
    if (b >= 4000) return RECYCLE_TIERS.GOLD;
    if (b >= 2500) return RECYCLE_TIERS.SILVER;
    if (b >= 1000) return RECYCLE_TIERS.BRONZE;
    return RECYCLE_TIERS.NONE;
}

// ============================================================================
// CSS INJECTION
// ============================================================================
function injectStyles() {
    if (document.getElementById('stk-styles-v10')) return;
    const style = document.createElement('style');
    style.id = 'stk-styles-v10';
    style.textContent = `
        .stk-shell {
            --stk-bg: #0c0c0e;
            --stk-surface: #141417;
            --stk-surface-2: #1c1c21;
            --stk-surface-3: #222228;
            --stk-border: rgba(255,255,255,0.06);
            --stk-border-h: rgba(255,255,255,0.12);
            --stk-text: #f0f0f2;
            --stk-text-2: #a0a0ab;
            --stk-text-3: #5c5c68;
            --stk-accent: #f59e0b;
            --stk-green: #4ade80;
            --stk-purple: #a78bfa;
            --stk-cyan: #22d3ee;
            --stk-red: #ef4444;
            --stk-radius: 16px;
            --stk-radius-sm: 10px;
            --stk-tr: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes stk-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes stk-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes stk-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes stk-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes stk-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }

        .stk-shell { max-width: 960px; margin: 0 auto; padding: 0 16px 40px; animation: stk-fadeIn 0.4s ease-out; }

        /* ── Header ── */
        .stk-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .stk-header-left { display: flex; align-items: center; gap: 14px; }
        .stk-header-icon {
            width: 48px; height: 48px; border-radius: var(--stk-radius);
            background: linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.1));
            border: 1px solid rgba(167,139,250,0.2);
            display: flex; align-items: center; justify-content: center;
            animation: stk-float 4s ease-in-out infinite;
        }
        .stk-header-icon i { font-size: 20px; color: var(--stk-purple); }
        .stk-header-title { font-size: 20px; font-weight: 800; color: var(--stk-text); }
        .stk-header-sub { font-size: 11px; color: var(--stk-text-3); }
        .stk-refresh-btn {
            width: 40px; height: 40px; border-radius: var(--stk-radius-sm);
            background: var(--stk-surface); border: 1px solid var(--stk-border);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all var(--stk-tr); color: var(--stk-text-3);
        }
        .stk-refresh-btn:hover { color: var(--stk-text); border-color: var(--stk-border-h); }

        /* ── Hero Card ── */
        .stk-hero {
            position: relative; overflow: hidden;
            background: linear-gradient(135deg, rgba(20,20,23,0.95), rgba(12,12,14,0.98));
            border: 1px solid var(--stk-border);
            border-radius: var(--stk-radius);
            padding: 28px 24px;
            margin-bottom: 14px;
            animation: stk-scaleIn 0.5s ease-out;
        }
        .stk-hero::before {
            content: '';
            position: absolute; top: -50%; right: -20%;
            width: 400px; height: 400px;
            background: radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%);
            pointer-events: none; animation: stk-glow 4s ease-in-out infinite;
        }
        .stk-hero::after {
            content: '';
            position: absolute; inset: 0;
            border-radius: var(--stk-radius); padding: 1px;
            background: linear-gradient(135deg, rgba(74,222,128,0.2), rgba(167,139,250,0.15), rgba(245,158,11,0.1));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude; -webkit-mask-composite: xor;
            pointer-events: none; opacity: 0.5;
        }
        .stk-hero-inner { display: flex; gap: 24px; position: relative; z-index: 1; }
        .stk-hero-left { flex: 1.2; min-width: 0; }
        .stk-hero-right { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }

        .stk-hero-label { font-size: 11px; color: var(--stk-text-3); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 4px; }
        .stk-reward-value {
            font-size: clamp(28px, 5vw, 40px); font-weight: 800;
            color: var(--stk-green); font-variant-numeric: tabular-nums;
            line-height: 1.1; text-shadow: 0 0 30px rgba(74,222,128,0.2);
        }
        .stk-reward-suffix { font-size: 14px; color: rgba(74,222,128,0.6); font-weight: 600; }

        .stk-claim-btn {
            display: inline-flex; align-items: center; gap: 8px;
            margin-top: 16px; padding: 10px 24px;
            background: linear-gradient(135deg, #22c55e, #10b981);
            color: white; font-weight: 700; font-size: 14px;
            border-radius: var(--stk-radius-sm); border: none; cursor: pointer;
            transition: all var(--stk-tr); box-shadow: 0 4px 20px rgba(34,197,94,0.25);
        }
        .stk-claim-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(34,197,94,0.35); }
        .stk-claim-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .stk-claim-btn:not(:disabled) {
            background-size: 200% 100%;
            background-image: linear-gradient(90deg, #22c55e 0%, #34d399 25%, #22c55e 50%, #10b981 100%);
            animation: stk-shimmer 3s linear infinite;
        }
        .stk-eth-fee { font-size: 10px; color: var(--stk-text-3); margin-top: 6px; }

        .stk-breakdown { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--stk-border); }
        .stk-breakdown-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 3px 0; }
        .stk-breakdown-label { color: var(--stk-text-3); display: flex; align-items: center; gap: 4px; }
        .stk-breakdown-val { font-weight: 700; font-family: 'SF Mono', monospace; }

        /* ── NFT Boost Panel ── */
        .stk-boost-panel {
            background: var(--stk-surface-2); border: 1px solid var(--stk-border);
            border-radius: var(--stk-radius-sm); padding: 16px;
        }
        .stk-tier-badge {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 12px; border-radius: 20px;
            font-weight: 700; font-size: 12px; border: 1px solid;
        }
        .stk-tier-none { background: rgba(113,113,122,0.1); border-color: rgba(113,113,122,0.2); color: #a1a1aa; }
        .stk-tier-bronze { background: rgba(205,127,50,0.1); border-color: rgba(205,127,50,0.3); color: #cd7f32; }
        .stk-tier-silver { background: rgba(192,192,192,0.1); border-color: rgba(192,192,192,0.3); color: #e5e5e5; }
        .stk-tier-gold { background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.3); color: #ffd700; }
        .stk-tier-diamond { background: rgba(185,242,255,0.1); border-color: rgba(185,242,255,0.3); color: #b9f2ff; }

        .stk-burn-bar { height: 8px; background: rgba(239,68,68,0.15); border-radius: 4px; overflow: hidden; position: relative; margin: 10px 0 6px; }
        .stk-burn-fill { position: absolute; left: 0; top: 0; height: 100%; background: linear-gradient(90deg, #ef4444, #f87171); border-radius: 4px; transition: width 0.5s ease; }
        .stk-keep-fill { position: absolute; right: 0; top: 0; height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80); border-radius: 4px; transition: width 0.5s ease; }

        .stk-boost-cta {
            display: inline-flex; align-items: center; gap: 6px;
            margin-top: 10px; padding: 7px 14px; font-size: 11px; font-weight: 700;
            border-radius: 8px; border: none; cursor: pointer;
            transition: all var(--stk-tr); color: #000;
            background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        .stk-boost-cta:hover { filter: brightness(1.1); transform: translateY(-1px); }

        /* ── Stats Row ── */
        .stk-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
        .stk-stat {
            display: flex; flex-direction: column; gap: 2px;
            padding: 10px 12px; background: var(--stk-surface);
            border: 1px solid var(--stk-border); border-radius: var(--stk-radius-sm);
            transition: border-color var(--stk-tr);
        }
        .stk-stat:hover { border-color: var(--stk-border-h); }
        .stk-stat-label { font-size: 9px; color: var(--stk-text-3); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .stk-stat-label i { font-size: 9px; }
        .stk-stat-value { font-size: 14px; font-weight: 700; color: var(--stk-text); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── Card Base ── */
        .stk-card {
            background: var(--stk-surface); border: 1px solid var(--stk-border);
            border-radius: var(--stk-radius); padding: 18px;
            margin-bottom: 14px; animation: stk-fadeIn 0.5s ease-out both;
        }
        .stk-card-title { font-size: 14px; font-weight: 700; color: var(--stk-text); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .stk-card-title i { color: var(--stk-text-3); font-size: 12px; }

        /* ── Stake Form ── */
        .stk-input-wrap { position: relative; margin-bottom: 12px; }
        .stk-amount-input {
            width: 100%; padding: 14px 70px 14px 16px;
            background: var(--stk-surface-2); border: 1px solid var(--stk-border-h);
            border-radius: var(--stk-radius-sm); color: var(--stk-text);
            font-size: 20px; font-weight: 700; font-family: 'SF Mono', 'JetBrains Mono', monospace;
            outline: none; transition: border-color var(--stk-tr);
        }
        .stk-amount-input::placeholder { color: var(--stk-text-3); font-weight: 400; }
        .stk-amount-input:focus { border-color: rgba(167,139,250,0.4); }
        .stk-amount-input.error { border-color: rgba(239,68,68,0.5); }
        .stk-max-btn {
            position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
            padding: 4px 10px; font-size: 10px; font-weight: 800;
            background: rgba(167,139,250,0.15); color: var(--stk-purple);
            border: 1px solid rgba(167,139,250,0.3); border-radius: 6px;
            cursor: pointer; transition: all var(--stk-tr);
        }
        .stk-max-btn:hover { background: rgba(167,139,250,0.25); }
        .stk-balance-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--stk-text-3); margin-bottom: 14px; }

        /* Duration Chips */
        .stk-duration-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
        .stk-duration-chip {
            padding: 10px 8px; text-align: center;
            background: var(--stk-surface-2); border: 1px solid var(--stk-border);
            border-radius: var(--stk-radius-sm); cursor: pointer;
            transition: all var(--stk-tr); position: relative;
        }
        .stk-duration-chip:hover { border-color: var(--stk-border-h); }
        .stk-duration-chip.selected {
            background: linear-gradient(135deg, rgba(167,139,250,0.12), rgba(139,92,246,0.08));
            border-color: rgba(167,139,250,0.4);
            box-shadow: 0 0 16px rgba(167,139,250,0.1);
        }
        .stk-duration-chip .stk-chip-label { font-size: 14px; font-weight: 700; color: var(--stk-text); }
        .stk-duration-chip .stk-chip-sub { font-size: 9px; color: var(--stk-text-3); margin-top: 2px; }
        .stk-duration-chip.selected .stk-chip-label { color: var(--stk-purple); }
        .stk-duration-chip.recommended::after {
            content: '\\2605'; position: absolute; top: -6px; right: -4px;
            width: 16px; height: 16px; font-size: 9px; line-height: 16px; text-align: center;
            background: linear-gradient(135deg, #f59e0b, #d97706); color: #000;
            border-radius: 50%;
        }

        .stk-preview-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 6px 0; }
        .stk-preview-label { color: var(--stk-text-3); }
        .stk-preview-val { color: var(--stk-text); font-weight: 700; font-family: 'SF Mono', monospace; }

        .stk-delegate-btn {
            width: 100%; padding: 12px; margin-top: 14px;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white; font-weight: 700; font-size: 14px;
            border-radius: var(--stk-radius-sm); border: none; cursor: pointer;
            transition: all var(--stk-tr); box-shadow: 0 4px 20px rgba(139,92,246,0.2);
        }
        .stk-delegate-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 28px rgba(139,92,246,0.3); }
        .stk-delegate-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── Delegations ── */
        .stk-deleg-list { display: flex; flex-direction: column; gap: 6px; max-height: 350px; overflow-y: auto; }
        .stk-deleg-list::-webkit-scrollbar { width: 4px; }
        .stk-deleg-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .stk-deleg-item {
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            padding: 10px 12px; background: var(--stk-surface-2);
            border: 1px solid transparent; border-radius: 8px;
            transition: all var(--stk-tr);
        }
        .stk-deleg-item:hover { background: var(--stk-surface-3); border-color: var(--stk-border-h); transform: translateX(3px); }
        .stk-deleg-icon {
            width: 36px; height: 36px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .stk-deleg-info { flex: 1; min-width: 0; }
        .stk-deleg-amount { font-size: 13px; font-weight: 700; color: var(--stk-text); }
        .stk-deleg-meta { font-size: 10px; color: var(--stk-text-3); margin-top: 1px; display: flex; align-items: center; gap: 6px; }
        .stk-countdown { font-size: 11px; font-weight: 700; color: #fbbf24; font-family: 'SF Mono', monospace; }
        .stk-unstake-btn {
            padding: 5px 10px; font-size: 10px; font-weight: 700;
            border-radius: 6px; cursor: pointer; transition: all var(--stk-tr); border: none;
        }
        .stk-unstake-ready { background: rgba(255,255,255,0.1); color: var(--stk-text); }
        .stk-unstake-ready:hover { background: rgba(255,255,255,0.2); }
        .stk-unstake-force { background: rgba(239,68,68,0.1); color: var(--stk-red); }
        .stk-unstake-force:hover { background: rgba(239,68,68,0.2); }

        /* ── History ── */
        .stk-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
        .stk-tab {
            padding: 4px 10px; font-size: 10px; font-weight: 600;
            color: var(--stk-text-3); background: var(--stk-surface-2);
            border: 1px solid var(--stk-border); border-radius: 20px;
            cursor: pointer; transition: all var(--stk-tr); white-space: nowrap;
        }
        .stk-tab:hover { color: var(--stk-text-2); border-color: var(--stk-border-h); }
        .stk-tab.active { color: var(--stk-purple); background: rgba(167,139,250,0.1); border-color: rgba(167,139,250,0.3); }

        .stk-history-list { display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; }
        .stk-history-list::-webkit-scrollbar { width: 4px; }
        .stk-history-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .stk-history-item {
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            padding: 8px 10px; background: var(--stk-surface-2);
            border: 1px solid transparent; border-radius: 8px;
            transition: all var(--stk-tr); text-decoration: none;
        }
        .stk-history-item:hover { background: var(--stk-surface-3); border-color: var(--stk-border-h); }
        .stk-history-icon {
            width: 32px; height: 32px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12px;
        }
        .stk-history-info { flex: 1; min-width: 0; }
        .stk-history-label { font-size: 12px; font-weight: 600; color: var(--stk-text); display: flex; align-items: center; gap: 6px; }
        .stk-history-date { font-size: 10px; color: var(--stk-text-3); margin-top: 1px; }
        .stk-history-amount { font-size: 12px; font-weight: 600; color: var(--stk-text); font-family: 'SF Mono', monospace; text-align: right; white-space: nowrap; }
        .stk-history-link { font-size: 9px; color: var(--stk-text-3); transition: color var(--stk-tr); }
        .stk-history-item:hover .stk-history-link { color: var(--stk-purple); }

        /* ── Empty / Loading ── */
        .stk-empty { text-align: center; padding: 32px 16px; }
        .stk-empty i { font-size: 24px; color: var(--stk-text-3); margin-bottom: 8px; display: block; }
        .stk-empty p { font-size: 12px; color: var(--stk-text-3); }
        .stk-loading { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px; }
        .stk-loading-icon { width: 36px; height: 36px; opacity: 0.3; animation: stk-float 2s ease-in-out infinite; }

        /* ── Not Connected ── */
        .stk-connect-card {
            text-align: center; padding: 48px 24px;
            background: var(--stk-surface); border: 1px solid var(--stk-border);
            border-radius: var(--stk-radius);
        }
        .stk-connect-btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 24px; margin-top: 16px;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white; font-weight: 700; font-size: 14px;
            border-radius: var(--stk-radius-sm); border: none; cursor: pointer;
            transition: all var(--stk-tr);
        }
        .stk-connect-btn:hover { filter: brightness(1.1); }

        /* ── Buyback Card ── */
        .stk-buyback {
            position: relative;
            padding: 16px 18px;
            background: linear-gradient(135deg, rgba(249,115,22,0.06), rgba(234,88,12,0.03));
            border: 1px solid rgba(249,115,22,0.18);
            border-radius: var(--stk-radius);
            margin-bottom: 14px;
            overflow: hidden;
            animation: stk-fadeIn 0.5s ease-out both;
        }
        .stk-buyback::before {
            content: '';
            position: absolute;
            top: -50%; right: -10%;
            width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%);
            pointer-events: none;
            animation: stk-glow 5s ease-in-out infinite;
        }
        .stk-buyback-header {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 12px; position: relative; z-index: 1;
        }
        .stk-buyback-title {
            display: flex; align-items: center; gap: 8px;
            font-size: 13px; font-weight: 700; color: var(--stk-text);
        }
        .stk-buyback-title i { color: #f97316; font-size: 14px; }
        .stk-buyback-badge {
            font-size: 10px; font-weight: 700; padding: 3px 10px;
            border-radius: 20px; background: rgba(249,115,22,0.12);
            color: #f97316; border: 1px solid rgba(249,115,22,0.2);
        }
        .stk-buyback-grid {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 8px; margin-bottom: 12px; position: relative; z-index: 1;
        }
        .stk-buyback-metric {
            padding: 8px 10px; background: var(--stk-surface);
            border: 1px solid var(--stk-border); border-radius: var(--stk-radius-sm);
        }
        .stk-buyback-metric-label {
            font-size: 9px; color: var(--stk-text-3); text-transform: uppercase;
            letter-spacing: 0.08em; font-weight: 700; margin-bottom: 2px;
        }
        .stk-buyback-metric-value {
            font-size: 13px; font-weight: 700; color: var(--stk-text);
            font-variant-numeric: tabular-nums;
        }
        .stk-buyback-footer {
            display: flex; align-items: center; justify-content: space-between;
            gap: 12px; position: relative; z-index: 1;
        }
        .stk-buyback-info {
            font-size: 10px; color: var(--stk-text-3); flex: 1;
        }
        .stk-buyback-btn {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 10px 20px; font-size: 12px; font-weight: 700;
            color: #000; background: linear-gradient(135deg, #f97316, #ea580c);
            border: none; border-radius: var(--stk-radius-sm); cursor: pointer;
            transition: all var(--stk-tr); white-space: nowrap;
        }
        .stk-buyback-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(249,115,22,0.3); }
        .stk-buyback-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .stk-buyback-empty {
            text-align: center; padding: 8px 0; font-size: 11px; color: var(--stk-text-3);
            position: relative; z-index: 1;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
            .stk-shell { padding: 0 10px 30px; }
            .stk-hero { padding: 20px 16px; }
            .stk-hero-inner { flex-direction: column; gap: 16px; }
            .stk-hero-right { border-top: 1px solid var(--stk-border); padding-top: 16px; }
            .stk-stats { grid-template-columns: repeat(2, 1fr); }
            .stk-buyback-grid { grid-template-columns: 1fr 1fr; }
            .stk-buyback-footer { flex-direction: column; text-align: center; }
            .stk-buyback-btn { width: 100%; justify-content: center; }
            .stk-reward-value { font-size: 28px; }
            .stk-duration-grid { grid-template-columns: repeat(2, 1fr); }
            .stk-tabs { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
            .stk-tabs::-webkit-scrollbar { display: none; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// RENDER
// ============================================================================
function render() {
    const container = document.getElementById('staking');
    if (!container) return;
    injectStyles();

    container.innerHTML = `
        <div class="stk-shell">

            <!-- HEADER -->
            <div class="stk-header">
                <div class="stk-header-left">
                    <div class="stk-header-icon"><i class="fa-solid fa-layer-group"></i></div>
                    <div>
                        <div class="stk-header-title">Stake & Earn</div>
                        <div class="stk-header-sub">Delegate BKC, earn rewards. NFT + Tutor = keep more</div>
                    </div>
                </div>
                <button id="stk-refresh-btn" class="stk-refresh-btn"><i class="fa-solid fa-rotate"></i></button>
            </div>

            <!-- HERO REWARDS -->
            <div class="stk-hero">
                <div class="stk-hero-inner">
                    <div class="stk-hero-left">
                        <div class="stk-hero-label">You Will Receive</div>
                        <div id="stk-reward-value" class="stk-reward-value">-- <span class="stk-reward-suffix">BKC</span></div>

                        <div id="stk-breakdown" class="stk-breakdown" style="display:none">
                            <div class="stk-breakdown-row">
                                <span class="stk-breakdown-label"><i class="fa-solid fa-layer-group" style="color:var(--stk-purple)"></i> Staking</span>
                                <span id="stk-break-staking" class="stk-breakdown-val" style="color:var(--stk-text)">0</span>
                            </div>
                            <div class="stk-breakdown-row">
                                <span class="stk-breakdown-label"><i class="fa-solid fa-coins" style="color:var(--stk-accent)"></i> Mining</span>
                                <span id="stk-break-mining" class="stk-breakdown-val" style="color:var(--stk-text)">0</span>
                            </div>
                            <div class="stk-breakdown-row">
                                <span class="stk-breakdown-label"><i class="fa-solid fa-recycle" style="color:#22d3ee"></i> Recycled</span>
                                <span id="stk-break-recycled" class="stk-breakdown-val" style="color:#22d3ee">0</span>
                            </div>
                            <div id="stk-break-tutor-row" class="stk-breakdown-row">
                                <span class="stk-breakdown-label"><i class="fa-solid fa-graduation-cap" style="color:var(--stk-accent)"></i> <span id="stk-break-tutor-label">Tutor</span></span>
                                <span id="stk-break-tutor" class="stk-breakdown-val" style="color:var(--stk-accent)">0</span>
                            </div>
                            <div class="stk-breakdown-row">
                                <span class="stk-breakdown-label"><i class="fa-solid fa-fire" style="color:var(--stk-red)"></i> Burned</span>
                                <span id="stk-break-burned" class="stk-breakdown-val" style="color:var(--stk-red)">0</span>
                            </div>
                        </div>

                        <button id="stk-claim-btn" class="stk-claim-btn" disabled>
                            <i class="fa-solid fa-hand-holding-dollar"></i> <span>Claim Rewards</span>
                        </button>
                        <div id="stk-eth-fee" class="stk-eth-fee"></div>
                    </div>

                    <div class="stk-hero-right">
                        <div id="stk-boost-panel">
                            <div style="text-align:center">
                                <img src="./assets/bkc_logo_3d.png" style="width:32px;height:32px;opacity:0.3;animation:stk-float 2s infinite" alt="">
                                <p style="font-size:11px;color:var(--stk-text-3);margin-top:8px">Loading boost...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- BUYBACK CARD -->
            <div id="stk-buyback-card" class="stk-buyback" style="display:none">
                <div class="stk-buyback-header">
                    <div class="stk-buyback-title">
                        <i class="fa-solid fa-hammer"></i> Buyback Available
                    </div>
                    <span id="stk-buyback-badge" class="stk-buyback-badge">5% Reward</span>
                </div>
                <div class="stk-buyback-grid">
                    <div class="stk-buyback-metric">
                        <div class="stk-buyback-metric-label">Pending BNB</div>
                        <div id="stk-buyback-pending" class="stk-buyback-metric-value" style="color:#f97316">--</div>
                    </div>
                    <div class="stk-buyback-metric">
                        <div class="stk-buyback-metric-label">Your Reward (5%)</div>
                        <div id="stk-buyback-reward" class="stk-buyback-metric-value" style="color:var(--stk-green)">--</div>
                    </div>
                    <div class="stk-buyback-metric">
                        <div class="stk-buyback-metric-label">BKC to Stakers</div>
                        <div id="stk-buyback-stakers" class="stk-buyback-metric-value" style="color:var(--stk-cyan)">--</div>
                    </div>
                    <div class="stk-buyback-metric">
                        <div class="stk-buyback-metric-label">Mining Rate</div>
                        <div id="stk-buyback-rate" class="stk-buyback-metric-value" style="color:var(--stk-purple)">--</div>
                    </div>
                </div>
                <div class="stk-buyback-footer">
                    <div class="stk-buyback-info" id="stk-buyback-info">
                        Execute buyback to earn 5% of pending BNB. Remaining converts to BKC staker rewards.
                    </div>
                    <button id="stk-buyback-btn" class="stk-buyback-btn" disabled>
                        <i class="fa-solid fa-hammer"></i> Execute Buyback
                    </button>
                </div>
            </div>

            <!-- STATS ROW -->
            <div class="stk-stats">
                <div class="stk-stat">
                    <div class="stk-stat-label"><i class="fa-solid fa-globe" style="color:var(--stk-purple)"></i> Network pStake</div>
                    <div id="stk-stat-network" class="stk-stat-value">--</div>
                </div>
                <div class="stk-stat">
                    <div class="stk-stat-label"><i class="fa-solid fa-bolt" style="color:var(--stk-cyan)"></i> Your Power</div>
                    <div id="stk-stat-power" class="stk-stat-value">--</div>
                </div>
                <div class="stk-stat">
                    <div class="stk-stat-label"><i class="fa-solid fa-gift" style="color:var(--stk-green)"></i> Pending</div>
                    <div id="stk-stat-rewards" class="stk-stat-value">--</div>
                </div>
                <div class="stk-stat">
                    <div class="stk-stat-label"><i class="fa-solid fa-lock" style="color:var(--stk-accent)"></i> Active Locks</div>
                    <div id="stk-stat-locks" class="stk-stat-value">--</div>
                </div>
            </div>

            <!-- STAKE FORM -->
            <div class="stk-card" style="animation-delay:0.1s">
                <div class="stk-card-title"><i class="fa-solid fa-arrow-right-to-bracket"></i> Delegate BKC</div>

                <div class="stk-input-wrap">
                    <input type="number" id="stk-amount-input" class="stk-amount-input" placeholder="0.00" step="any" min="0">
                    <button id="stk-max-btn" class="stk-max-btn">MAX</button>
                </div>

                <div class="stk-balance-row">
                    <span>Available</span>
                    <span id="stk-balance-display">-- BKC</span>
                </div>

                <div class="stk-duration-grid">
                    <div class="stk-duration-chip" data-days="30">
                        <div class="stk-chip-label">1M</div>
                        <div class="stk-chip-sub">30 days</div>
                    </div>
                    <div class="stk-duration-chip" data-days="365">
                        <div class="stk-chip-label">1Y</div>
                        <div class="stk-chip-sub">365 days</div>
                    </div>
                    <div class="stk-duration-chip" data-days="1825">
                        <div class="stk-chip-label">5Y</div>
                        <div class="stk-chip-sub">1,825 days</div>
                    </div>
                    <div class="stk-duration-chip selected recommended" data-days="3650">
                        <div class="stk-chip-label">10Y</div>
                        <div class="stk-chip-sub">3,650 days</div>
                    </div>
                </div>

                <div style="background:var(--stk-surface-2);border-radius:8px;padding:10px 12px;margin-bottom:4px">
                    <div class="stk-preview-row">
                        <span class="stk-preview-label">pStake Power</span>
                        <span id="stk-preview-pstake" class="stk-preview-val" style="color:var(--stk-purple)">0</span>
                    </div>
                    <div class="stk-preview-row">
                        <span class="stk-preview-label">Net Amount</span>
                        <span id="stk-preview-net" class="stk-preview-val">0.00 BKC</span>
                    </div>
                    <div class="stk-preview-row">
                        <span class="stk-preview-label">Fee</span>
                        <span id="stk-fee-info" class="stk-preview-val" style="color:var(--stk-text-3);font-size:11px">0.5%</span>
                    </div>
                </div>

                <button id="stk-delegate-btn" class="stk-delegate-btn" disabled>
                    <i class="fa-solid fa-lock" style="margin-right:6px"></i> Delegate BKC
                </button>
            </div>

            <!-- ACTIVE DELEGATIONS -->
            <div class="stk-card" style="animation-delay:0.15s">
                <div class="stk-card-title">
                    <i class="fa-solid fa-list-check"></i> Active Delegations
                    <span id="stk-deleg-count" style="font-size:10px;color:var(--stk-text-3);margin-left:auto">0</span>
                </div>
                <div id="stk-deleg-list" class="stk-deleg-list">
                    <div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No active delegations</p></div>
                </div>
            </div>

            <!-- HISTORY -->
            <div class="stk-card" style="animation-delay:0.2s">
                <div class="stk-card-title"><i class="fa-solid fa-clock-rotate-left"></i> History</div>
                <div class="stk-tabs">
                    <button class="stk-tab active" data-filter="ALL">All</button>
                    <button class="stk-tab" data-filter="STAKE">Stakes</button>
                    <button class="stk-tab" data-filter="UNSTAKE">Unstakes</button>
                    <button class="stk-tab" data-filter="CLAIM">Claims</button>
                </div>
                <div id="stk-history-list" class="stk-history-list">
                    <div class="stk-loading">
                        <img src="./assets/bkc_logo_3d.png" class="stk-loading-icon" alt="">
                        <span style="font-size:11px;color:var(--stk-text-3)">Loading history...</span>
                    </div>
                </div>
            </div>

        </div>
    `;

    setupListeners();

    if (State.isConnected) {
        loadData();
    } else {
        resetUI();
    }
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadData(force = false) {
    if (isLoading) return;
    const now = Date.now();
    if (!force && now - lastFetch < 10000) return;

    isLoading = true;
    lastFetch = now;

    try {
        await Promise.all([loadNftBoostData(), loadTutorData()]);

        const [, , delegations] = await Promise.all([
            loadUserData(),
            loadPublicData(),
            loadUserDelegations()
        ]);

        // V9: Read totalPStake directly from StakingPool contract
        const stakingContract = State.stakingPoolContractPublic || State.stakingPoolContract;
        if (stakingContract) {
            totalPStakeNetwork = await safeContractCall(stakingContract, 'totalPStake', [], 0n);
        }

        await loadClaimPreview();

        const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
        stakingRewardsAmount = stakingRewards || 0n;
        minerRewardsAmount = minerRewards || 0n;

        updateHeroRewards();
        updateNftBoostPanel();
        updateStats();
        renderDelegations();
        loadStakingHistory();
        updatePreview();
        loadBuybackData();
    } catch (e) {
        console.error('Staking data load error:', e);
    } finally {
        isLoading = false;
    }
}

async function loadNftBoostData() {
    if (!State.userAddress) return;
    try {
        // V9: stakingPoolContract replaces delegationManagerContract
        const stakingContract = State.stakingPoolContractPublic || State.stakingPoolContract;
        if (stakingContract) {
            const boost = await safeContractCall(stakingContract, 'getUserBestBoost', [State.userAddress], 0n);
            userNftBoost = Number(boost);
        }
        if (userNftBoost === 0) {
            const data = await getHighestBoosterBoostFromAPI();
            if (data && data.highestBoost > 0) {
                userNftBoost = data.highestBoost;
                nftSource = data.source || 'api';
            }
        } else {
            nftSource = 'active';
        }
        const tier = getTierFromBoost(userNftBoost);
        userRecycleRate = tier.recycleRate;
    } catch (e) {
        console.error('NFT boost load error:', e);
    }
}

async function loadTutorData() {
    if (!State.userAddress) return;
    try {
        const eco = State.ecosystemContractPublic || State.ecosystemContract;
        if (eco) {
            const tutor = await safeContractCall(eco, 'tutorOf', [State.userAddress], ethers.ZeroAddress);
            userTutor = (tutor && tutor !== ethers.ZeroAddress) ? tutor : null;
            hasTutor = !!userTutor;
        }
    } catch (e) {
        console.error('Tutor data load error:', e);
    }
}

async function loadClaimPreview() {
    // V9: stakingPoolContract, previewClaim returns 6-tuple
    const stakingContract = State.stakingPoolContractPublic || State.stakingPoolContract;
    if (!State.userAddress || !stakingContract) return;
    try {
        const preview = await safeContractCall(stakingContract, 'previewClaim', [State.userAddress], null);
        if (preview) {
            // V10: (totalRewards, recycleAmount, burnAmount, tutorCut, userReceives, recycleRateBps, nftBoost)
            claimPreview = {
                totalRewards: preview.totalRewards || preview[0] || 0n,
                recycleAmount: preview.recycleAmount || preview[1] || 0n,
                burnAmount: preview.burnAmount || preview[2] || 0n,
                tutorCut: preview.tutorCut || preview[3] || 0n,
                userReceives: preview.userReceives || preview[4] || 0n,
                recycleRateBps: preview.recycleRateBps || preview[5] || 0n,
                nftBoost: preview.nftBoost || preview[6] || 0n
            };
        }
        claimEthFee = 0n;
    } catch (e) {
        console.error('Claim preview error:', e);
        const total = stakingRewardsAmount + minerRewardsAmount;
        const recycleAmount = (total * BigInt(userRecycleRate)) / 100n;
        claimPreview = { totalRewards: total, recycleAmount, burnAmount: 0n, tutorCut: 0n, userReceives: total - recycleAmount, recycleRateBps: BigInt(userRecycleRate * 100), nftBoost: BigInt(userNftBoost) };
    }
}

async function loadBuybackData() {
    try {
        const [preview, stats, lastInfo, fee] = await Promise.all([
            BuybackTx.getPreviewBuyback().catch(() => null),
            BuybackTx.getBuybackStats().catch(() => null),
            BuybackTx.getLastBuyback().catch(() => null),
            BuybackTx.getExecutionFee().catch(() => 0n)
        ]);
        buybackPreview = preview;
        buybackStats = stats;
        buybackLastInfo = lastInfo;
        buybackFee = fee;
        updateBuybackCard();
    } catch (e) {
        console.error('Buyback data load error:', e);
    }
}

function updateBuybackCard() {
    const card = document.getElementById('stk-buyback-card');
    if (!card) return;

    const pendingEl = document.getElementById('stk-buyback-pending');
    const rewardEl = document.getElementById('stk-buyback-reward');
    const stakersEl = document.getElementById('stk-buyback-stakers');
    const rateEl = document.getElementById('stk-buyback-rate');
    const btn = document.getElementById('stk-buyback-btn');
    const infoEl = document.getElementById('stk-buyback-info');

    if (!buybackPreview) {
        card.style.display = 'none';
        return;
    }

    card.style.display = '';

    const pendingEth = buybackPreview.ethAvailable || 0n;
    const callerReward = buybackPreview.estimatedCallerReward || 0n;
    const toStakers = buybackPreview.estimatedToStakers || 0n;
    const rateBps = Number(buybackPreview.currentMiningRateBps || 0n);
    const isReady = buybackPreview.isReady;

    pendingEl.textContent = `${Number(ethers.formatEther(pendingEth)).toFixed(6)} BNB`;
    rewardEl.textContent = `+${Number(ethers.formatEther(callerReward)).toFixed(6)} BNB`;
    stakersEl.textContent = `${formatBigNumber(toStakers).toLocaleString('en-US', { maximumFractionDigits: 1 })} BKC`;
    rateEl.textContent = `${(rateBps / 100).toFixed(1)}%`;

    btn.disabled = !isReady;

    // Info line with fee + last buyback
    const feeStr = buybackFee > 0n ? Number(ethers.formatEther(buybackFee)).toFixed(4) : '0';
    let infoText = buybackFee > 0n
        ? `Fee: ${feeStr} BNB (added to buyback). Earn 5% of total.`
        : 'Execute buyback to earn 5% of pending BNB.';
    if (buybackLastInfo && Number(buybackLastInfo.timeSinceLast) > 0) {
        const secsAgo = Number(buybackLastInfo.timeSinceLast);
        const timeAgo = secsAgo < 3600 ? `${Math.floor(secsAgo / 60)}m ago`
            : secsAgo < 86400 ? `${Math.floor(secsAgo / 3600)}h ago`
            : `${Math.floor(secsAgo / 86400)}d ago`;
        infoText += ` | Last: ${timeAgo}`;
    }
    if (buybackStats && Number(buybackStats.totalBuybacks) > 0) {
        infoText += ` | Total: ${Number(buybackStats.totalBuybacks)} buybacks`;
    }
    infoEl.textContent = infoText;
}

// ============================================================================
// UI UPDATES
// ============================================================================
function updateHeroRewards() {
    const rewardEl = document.getElementById('stk-reward-value');
    const claimBtn = document.getElementById('stk-claim-btn');
    const breakdownEl = document.getElementById('stk-breakdown');
    const ethFeeEl = document.getElementById('stk-eth-fee');

    const receiveAmount = claimPreview?.userReceives || 0n;
    const totalAmount = claimPreview?.totalRewards || 0n;
    const recycleAmount = claimPreview?.recycleAmount || 0n;
    const burnAmount = claimPreview?.burnAmount || 0n;
    const tutorCut = claimPreview?.tutorCut || 0n;
    const hasRewards = receiveAmount > 0n;

    if (rewardEl) {
        const num = formatBigNumber(receiveAmount);
        rewardEl.innerHTML = `${num.toFixed(4)} <span class="stk-reward-suffix">BKC</span>`;
    }
    if (claimBtn) {
        claimBtn.disabled = !hasRewards;
        const btnSpan = claimBtn.querySelector('span');
        if (btnSpan) btnSpan.textContent = hasRewards ? 'Claim Rewards' : 'No Rewards Yet';
    }

    if (breakdownEl && hasRewards) {
        breakdownEl.style.display = '';
        const stakNum = formatBigNumber(stakingRewardsAmount).toFixed(4);
        const minNum = formatBigNumber(minerRewardsAmount).toFixed(4);
        const recycleNum = formatBigNumber(recycleAmount).toFixed(4);
        const burnNum = formatBigNumber(burnAmount).toFixed(4);
        const tutorNum = formatBigNumber(tutorCut).toFixed(4);
        document.getElementById('stk-break-staking').textContent = `${stakNum} BKC`;
        document.getElementById('stk-break-mining').textContent = `${minNum} BKC`;
        const recycledEl = document.getElementById('stk-break-recycled');
        if (recycledEl) {
            recycledEl.textContent = recycleAmount > 0n ? `-${recycleNum} BKC` : 'None';
            recycledEl.style.color = recycleAmount > 0n ? '#22d3ee' : 'var(--stk-green)';
        }
        // Tutor cut row
        const tutorRow = document.getElementById('stk-break-tutor-row');
        const tutorEl = document.getElementById('stk-break-tutor');
        const tutorLabel = document.getElementById('stk-break-tutor-label');
        if (tutorRow) {
            if (hasTutor && tutorCut > 0n) {
                tutorRow.style.display = '';
                if (tutorLabel) tutorLabel.textContent = 'Tutor (5%)';
                if (tutorEl) { tutorEl.textContent = `-${tutorNum} BKC`; tutorEl.style.color = 'var(--stk-accent)'; }
            } else if (!hasTutor && burnAmount > 0n) {
                // No tutor: 10% burned instead of 5% tutor
                tutorRow.style.display = 'none';
            } else {
                tutorRow.style.display = 'none';
            }
        }
        document.getElementById('stk-break-burned').textContent = burnAmount > 0n ? `-${burnNum} BKC` : 'None';
        document.getElementById('stk-break-burned').style.color = burnAmount > 0n ? 'var(--stk-red)' : 'var(--stk-green)';
    } else if (breakdownEl) {
        breakdownEl.style.display = 'none';
    }

    if (ethFeeEl) {
        if (hasRewards && claimEthFee > 0n) {
            const feeEth = parseFloat(ethers.formatEther(claimEthFee)).toFixed(6);
            ethFeeEl.innerHTML = `<i class="fa-brands fa-ethereum" style="margin-right:3px"></i>Claim fee: ${feeEth} BNB`;
        } else {
            ethFeeEl.textContent = '';
        }
    }
}

function updateNftBoostPanel() {
    const panel = document.getElementById('stk-boost-panel');
    if (!panel) return;

    const tier = getTierFromBoost(userNftBoost);
    const hasNft = userNftBoost > 0;

    // Build tier comparison rows
    const tiers = [RECYCLE_TIERS.NONE, RECYCLE_TIERS.BRONZE, RECYCLE_TIERS.SILVER, RECYCLE_TIERS.GOLD, RECYCLE_TIERS.DIAMOND];
    const tierRows = tiers.map(t => {
        const isCurrent = t.name === tier.name;
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 0;${isCurrent ? 'font-weight:700' : 'opacity:0.6'}">
            <span style="font-size:10px;color:${t.color}">${t.icon} ${t.name}${isCurrent ? ' ←' : ''}</span>
            <span style="font-size:10px;color:${t.keepRate === 100 ? 'var(--stk-green)' : 'var(--stk-text-2)'}">Keep ${t.keepRate}%</span>
        </div>`;
    }).join('');

    // Tutor info
    const tutorShort = userTutor ? `${userTutor.slice(0,6)}...${userTutor.slice(-4)}` : '';
    const tutorSection = hasTutor
        ? `<div style="display:flex;align-items:center;gap:6px;margin-top:10px;padding:6px 8px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:6px">
            <i class="fa-solid fa-graduation-cap" style="color:var(--stk-accent);font-size:10px"></i>
            <span style="font-size:10px;color:var(--stk-accent);font-weight:600">Tutor: ${tutorShort}</span>
            <span style="font-size:9px;color:var(--stk-text-3);margin-left:auto">5% rewards</span>
        </div>`
        : `<div style="margin-top:10px;padding:6px 8px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:6px">
            <div style="display:flex;align-items:center;gap:6px">
                <i class="fa-solid fa-graduation-cap" style="color:var(--stk-red);font-size:10px"></i>
                <span style="font-size:10px;color:var(--stk-red);font-weight:600">No tutor — 10% burned</span>
            </div>
            <p style="font-size:9px;color:var(--stk-text-3);margin:3px 0 0">Set a tutor to reduce burn to 5% (sent to tutor instead)</p>
            <a href="#referral" class="go-to-tutor" style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;font-size:10px;font-weight:700;color:var(--stk-accent);text-decoration:none;cursor:pointer">
                <i class="fa-solid fa-arrow-right" style="font-size:8px"></i> Set a Tutor
            </a>
        </div>`;

    panel.innerHTML = `
        <div class="stk-boost-panel">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <div class="stk-tier-badge ${tier.class}">
                    <span style="font-size:16px">${tier.icon}</span>
                    <span>${tier.name}</span>
                    <span style="opacity:0.5">|</span>
                    <span>Keep ${tier.keepRate}%</span>
                </div>
                ${hasNft ? `<span style="font-size:9px;color:var(--stk-green);font-weight:700"><i class="fa-solid fa-check" style="margin-right:3px"></i>ACTIVE</span>` : ''}
            </div>

            <div class="stk-burn-bar">
                <div class="stk-burn-fill" style="width:${tier.recycleRate}%"></div>
                <div class="stk-keep-fill" style="width:${tier.keepRate}%"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px">
                <span style="color:rgba(6,182,212,0.7)"><i class="fa-solid fa-recycle" style="margin-right:3px"></i>Recycle ${tier.recycleRate}%</span>
                <span style="color:rgba(74,222,128,0.7)"><i class="fa-solid fa-check" style="margin-right:3px"></i>Keep ${tier.keepRate}%</span>
            </div>

            <!-- Tier Comparison -->
            <div style="margin-top:10px;padding:8px;background:var(--stk-surface-3);border-radius:6px">
                <div style="font-size:9px;color:var(--stk-text-3);text-transform:uppercase;letter-spacing:0.05em;font-weight:700;margin-bottom:4px">
                    <i class="fa-solid fa-gem" style="margin-right:3px"></i>NFT Tier Benefits
                </div>
                ${tierRows}
            </div>

            ${!hasNft ? `
                <button class="stk-boost-cta go-to-store"><i class="fa-solid fa-gem" style="font-size:10px"></i> Get an NFT</button>
            ` : userNftBoost < 5000 ? `
                <p style="font-size:10px;color:var(--stk-text-3);margin-top:8px">
                    <i class="fa-solid fa-arrow-up" style="color:var(--stk-cyan);margin-right:3px"></i>
                    Upgrade to ${RECYCLE_TIERS.DIAMOND.icon} Diamond to keep 100%
                    <span class="go-to-store" style="color:var(--stk-accent);cursor:pointer;margin-left:4px">Upgrade</span>
                </p>
            ` : ''}

            <!-- Tutor Info -->
            ${tutorSection}
        </div>
    `;
}

function updateStats() {
    const setEl = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

    setEl('stk-stat-network', formatPStake(totalPStakeNetwork));

    const userPStake = State.userData?.pStake || State.userData?.userTotalPStake || State.userTotalPStake || 0n;
    const pct = totalPStakeNetwork > 0n ? Number((userPStake * 10000n) / totalPStakeNetwork) / 100 : 0;
    setEl('stk-stat-power', `${formatPStake(userPStake)} <span style="font-size:10px;color:var(--stk-text-3)">(${pct.toFixed(2)}%)</span>`);

    const totalRewards = claimPreview?.userReceives || 0n;
    const rewardsNum = formatBigNumber(totalRewards);
    setEl('stk-stat-rewards', rewardsNum > 0 ? `<span style="color:var(--stk-green)">${rewardsNum.toFixed(2)}</span> <span style="font-size:10px;color:var(--stk-text-3)">BKC</span>` : `<span style="color:var(--stk-text-3)">0 BKC</span>`);

    const delegCount = State.userDelegations?.length || 0;
    setEl('stk-stat-locks', `${delegCount}`);

    // Balance
    const balance = State.currentUserBalance || 0n;
    const balEl = document.getElementById('stk-balance-display');
    if (balEl) balEl.textContent = balance > 0n ? `${formatBigNumber(balance).toFixed(2)} BKC` : '0.00 BKC';

    // Fee
    const feeBips = State.systemFees?.["DELEGATION_FEE_BIPS"] || 50n;
    const feeEl = document.getElementById('stk-fee-info');
    if (feeEl) feeEl.textContent = `${Number(feeBips) / 100}%`;
}

function resetUI() {
    userTutor = null;
    hasTutor = false;
    const setEl = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    setEl('stk-reward-value', `-- <span class="stk-reward-suffix">BKC</span>`);
    setEl('stk-stat-network', '--');
    setEl('stk-stat-power', '--');
    setEl('stk-stat-rewards', '--');
    setEl('stk-stat-locks', '--');
    setEl('stk-balance-display', '-- BKC');

    const claimBtn = document.getElementById('stk-claim-btn');
    if (claimBtn) claimBtn.disabled = true;

    const breakdownEl = document.getElementById('stk-breakdown');
    if (breakdownEl) breakdownEl.style.display = 'none';

    const delegList = document.getElementById('stk-deleg-list');
    if (delegList) delegList.innerHTML = '<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>';

    const histList = document.getElementById('stk-history-list');
    if (histList) histList.innerHTML = '<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>';

    const panel = document.getElementById('stk-boost-panel');
    if (panel) panel.innerHTML = '<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet</p></div>';
}

// ============================================================================
// DELEGATIONS
// ============================================================================
function renderDelegations() {
    const container = document.getElementById('stk-deleg-list');
    const countEl = document.getElementById('stk-deleg-count');
    if (!container) return;

    const delegations = State.userDelegations || [];
    if (countEl) countEl.textContent = delegations.length;

    if (delegations.length === 0) {
        container.innerHTML = '<div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No active delegations</p></div>';
        return;
    }

    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

    const sorted = [...delegations].sort((a, b) => Number(a.unlockTime) - Number(b.unlockTime));
    container.innerHTML = sorted.map((d, i) => renderDelegationItem(d, i)).join('');

    countdownInterval = setInterval(updateCountdowns, 60000);

    // Attach unstake handlers
    container.querySelectorAll('.stk-unstake-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUnstake(parseInt(btn.dataset.index), btn.classList.contains('stk-unstake-force')));
    });
}

function renderDelegationItem(d, originalIndex) {
    const amount = formatBigNumber(d.amount || 0n);
    const lockDurationDays = d.lockDays || (Number(d.lockDuration || 0n) / 86400);
    const unlockTimestamp = Number(d.unlockTime || d.lockEnd || 0n);
    const now = Math.floor(Date.now() / 1000);
    const isLocked = unlockTimestamp > now;
    const remaining = isLocked ? unlockTimestamp - now : 0;
    const durationSec = d.lockDuration || (BigInt(d.lockDays || 0) * 86400n);
    const pStake = d.pStake || calculatePStake(d.amount || 0n, durationSec);

    return `
        <div class="stk-deleg-item">
            <div class="stk-deleg-icon" style="background:${isLocked ? 'rgba(251,191,36,0.1)' : 'rgba(74,222,128,0.1)'}">
                <i class="fa-solid ${isLocked ? 'fa-lock' : 'fa-lock-open'}" style="color:${isLocked ? '#fbbf24' : 'var(--stk-green)'}; font-size:14px"></i>
            </div>
            <div class="stk-deleg-info">
                <div class="stk-deleg-amount">${amount.toFixed(2)} BKC</div>
                <div class="stk-deleg-meta">
                    <span style="color:var(--stk-purple)">${formatPStake(pStake)} pS</span>
                    <span style="color:var(--stk-text-3)">|</span>
                    <span>${formatDuration(lockDurationDays)}</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                ${isLocked ? `
                    <span class="stk-countdown" data-unlock-time="${unlockTimestamp}">${formatTimeRemaining(remaining)}</span>
                    <button class="stk-unstake-btn stk-unstake-force" data-index="${d.index !== undefined ? d.index : originalIndex}" title="Force unstake (60% base penalty, reduced by NFT)">
                        <i class="fa-solid fa-bolt" style="font-size:10px"></i>
                    </button>
                ` : `
                    <span style="font-size:10px;color:var(--stk-green);font-weight:700"><i class="fa-solid fa-check" style="margin-right:3px"></i>Ready</span>
                    <button class="stk-unstake-btn stk-unstake-ready" data-index="${d.index !== undefined ? d.index : originalIndex}">Unstake</button>
                `}
            </div>
        </div>
    `;
}

function updateCountdowns() {
    document.querySelectorAll('.stk-countdown').forEach(el => {
        const unlockTime = parseInt(el.dataset.unlockTime);
        const now = Math.floor(Date.now() / 1000);
        el.textContent = formatTimeRemaining(unlockTime - now);
    });
}

// ============================================================================
// HISTORY
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
    const container = document.getElementById('stk-history-list');
    if (!container) return;

    let filtered = stakingHistory;
    if (currentHistoryFilter !== 'ALL') {
        filtered = stakingHistory.filter(item => {
            const t = (item.type || '').toUpperCase();
            switch (currentHistoryFilter) {
                case 'STAKE': return (t.includes('DELEGAT') || t.includes('STAKE')) && !t.includes('UNSTAKE') && !t.includes('UNDELEGAT') && !t.includes('FORCE');
                case 'UNSTAKE': return t.includes('UNSTAKE') || t.includes('UNDELEGAT') || t.includes('FORCE');
                case 'CLAIM': return t.includes('CLAIM') || t.includes('REWARD');
                default: return true;
            }
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No ${currentHistoryFilter === 'ALL' ? '' : currentHistoryFilter.toLowerCase() + ' '}history yet</p></div>`;
        return;
    }

    container.innerHTML = filtered.slice(0, 25).map(item => {
        const t = (item.type || '').toUpperCase();
        const details = item.details || {};
        const dateStr = formatDate(item.timestamp || item.createdAt);

        let icon, iconBg, iconColor, label, extraInfo = '';

        if (t.includes('FORCE')) {
            icon = 'fa-bolt'; iconBg = 'rgba(239,68,68,0.12)'; iconColor = '#ef4444'; label = 'Force Unstaked';
            if (details.feePaid && BigInt(details.feePaid) > 0n) extraInfo = `<span style="color:#ef4444">-${formatBigNumber(BigInt(details.feePaid)).toFixed(2)}</span>`;
        } else if ((t.includes('DELEGAT') || t.includes('STAKE')) && !t.includes('UNSTAKE')) {
            icon = 'fa-lock'; iconBg = 'rgba(74,222,128,0.12)'; iconColor = '#4ade80'; label = 'Delegated';
            if (details.pStakeGenerated) extraInfo = `<span style="color:var(--stk-purple)">+${formatBigNumber(BigInt(details.pStakeGenerated)).toFixed(0)} pS</span>`;
        } else if (t.includes('UNSTAKE') || t.includes('UNDELEGAT')) {
            icon = 'fa-unlock'; iconBg = 'rgba(249,115,22,0.12)'; iconColor = '#f97316'; label = 'Unstaked';
        } else if (t.includes('CLAIM') || t.includes('REWARD')) {
            icon = 'fa-coins'; iconBg = 'rgba(251,191,36,0.12)'; iconColor = '#fbbf24'; label = 'Claimed';
            if (details.amountReceived && BigInt(details.amountReceived) > 0n) extraInfo = `<span style="color:var(--stk-green)">+${formatBigNumber(BigInt(details.amountReceived)).toFixed(2)}</span>`;
            if (details.recycledAmount && BigInt(details.recycledAmount) > 0n) extraInfo += ` <span style="font-size:9px;color:rgba(6,182,212,0.6)">♻-${formatBigNumber(BigInt(details.recycledAmount)).toFixed(2)}</span>`;
            else if (details.burnedAmount && BigInt(details.burnedAmount) > 0n) extraInfo += ` <span style="font-size:9px;color:rgba(239,68,68,0.6)">🔥-${formatBigNumber(BigInt(details.burnedAmount)).toFixed(2)}</span>`;
        } else {
            icon = 'fa-circle'; iconBg = 'rgba(113,113,122,0.12)'; iconColor = '#71717a'; label = item.type || 'Activity';
        }

        const txLink = item.txHash ? `${EXPLORER_TX}${item.txHash}` : '#';
        const rawAmount = item.amount || details.amount || details.amountReceived || "0";
        let amountNum = 0;
        try { amountNum = formatBigNumber(BigInt(rawAmount)); } catch {}
        const amountDisplay = amountNum > 0.001 ? amountNum.toFixed(2) : '';

        return `
            <a href="${txLink}" target="_blank" class="stk-history-item">
                <div class="stk-history-icon" style="background:${iconBg}">
                    <i class="fa-solid ${icon}" style="color:${iconColor}"></i>
                </div>
                <div class="stk-history-info">
                    <div class="stk-history-label">${label} ${extraInfo ? `<span style="font-size:10px">${extraInfo}</span>` : ''}</div>
                    <div class="stk-history-date">${dateStr}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    ${amountDisplay ? `<span class="stk-history-amount">${amountDisplay} <span style="font-size:10px;color:var(--stk-text-3)">BKC</span></span>` : ''}
                    <i class="fa-solid fa-arrow-up-right-from-square stk-history-link"></i>
                </div>
            </a>
        `;
    }).join('');
}

// ============================================================================
// STAKE FORM PREVIEW
// ============================================================================
function updatePreview() {
    const amountInput = document.getElementById('stk-amount-input');
    const stakeBtn = document.getElementById('stk-delegate-btn');
    if (!amountInput) return;

    const val = amountInput.value;
    if (!val || parseFloat(val) <= 0) {
        const pEl = document.getElementById('stk-preview-pstake'); if (pEl) pEl.textContent = '0';
        const nEl = document.getElementById('stk-preview-net'); if (nEl) nEl.textContent = '0.00 BKC';
        if (stakeBtn) stakeBtn.disabled = true;
        return;
    }

    try {
        const amountWei = ethers.parseUnits(val, 18);
        const feeBips = State.systemFees?.["DELEGATION_FEE_BIPS"] || 50n;
        const feeWei = (amountWei * BigInt(feeBips)) / 10000n;
        const netWei = amountWei - feeWei;
        const durationDays = BigInt(lockDays);
        // Match contract: pStake = amount * (10000 + lockDays * 5918 / 365) / 10000
        const BPS = 10000n;
        const multiplier = BPS + (durationDays * 5918n / 365n);
        const pStake = netWei * multiplier / BPS;

        const pEl = document.getElementById('stk-preview-pstake'); if (pEl) pEl.textContent = formatPStake(pStake);
        const nEl = document.getElementById('stk-preview-net'); if (nEl) nEl.textContent = `${formatBigNumber(netWei).toFixed(4)} BKC`;

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
    const amountInput = document.getElementById('stk-amount-input');
    const stakeBtn = document.getElementById('stk-delegate-btn');
    if (!amountInput || !stakeBtn) return;

    const val = amountInput.value;
    if (!val || parseFloat(val) <= 0) return showToast('Enter an amount', 'warning');

    const balance = State.currentUserBalance || 0n;
    let amountWei;
    try {
        amountWei = ethers.parseUnits(val, 18);
        if (amountWei > balance) return showToast('Insufficient BKC balance', 'error');
    } catch { return showToast('Invalid amount', 'error'); }

    try {
        const ethBalance = await State.publicProvider.getBalance(State.userAddress);
        if (ethBalance < ethers.parseEther("0.001")) return showToast('Insufficient BNB for gas', 'error');
    } catch {}

    isProcessing = true;

    try {
        await StakingTx.delegate({
            amount: amountWei,
            lockDays: lockDays,
            button: stakeBtn,
            onSuccess: async () => {
                amountInput.value = '';
                showToast('Delegation successful!', 'success');
                isLoading = false; lastFetch = 0;
                await loadData(true);
            },
            onError: (error) => { if (!error.cancelled) showToast('Delegation failed: ' + (error.reason || error.message || 'Unknown error'), 'error'); }
        });
    } catch (e) {
        showToast('Delegation failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
        updatePreview();
    }
}

async function handleUnstake(index, isForce) {
    if (isProcessing) return;

    if (isForce) {
        // Load force unstake preview for detailed info
        let previewMsg = `Force unstake has a 60% base penalty.\n`;
        try {
            const stakingContract = State.stakingPoolContractPublic || State.stakingPoolContract;
            if (stakingContract && State.userAddress) {
                const preview = await safeContractCall(stakingContract, 'previewForceUnstake', [State.userAddress, BigInt(index)], null);
                if (preview) {
                    const stakedAmt = formatBigNumber(preview[0] || 0n).toFixed(2);
                    const totalPenalty = formatBigNumber(preview[1] || 0n).toFixed(2);
                    const recycleAmt = formatBigNumber(preview[2] || 0n).toFixed(2);
                    const burnAmt = formatBigNumber(preview[3] || 0n).toFixed(2);
                    const tutorAmt = formatBigNumber(preview[4] || 0n).toFixed(2);
                    const userGets = formatBigNumber(preview[5] || 0n).toFixed(2);
                    const ethFee = parseFloat(ethers.formatEther(preview[8] || 0n)).toFixed(4);
                    const tier = getTierFromBoost(Number(preview[7] || 0n));
                    previewMsg = `Force Unstake Preview (${tier.icon} ${tier.name})\n\n`;
                    previewMsg += `Staked: ${stakedAmt} BKC\n`;
                    previewMsg += `Penalty: -${totalPenalty} BKC\n`;
                    previewMsg += `  Recycled: ${recycleAmt} BKC (to all stakers)\n`;
                    if (parseFloat(tutorAmt) > 0) previewMsg += `  Tutor: ${tutorAmt} BKC (5%)\n`;
                    if (parseFloat(burnAmt) > 0) previewMsg += `  Burned: ${burnAmt} BKC${!hasTutor ? ' (no tutor = 10% burn)' : ''}\n`;
                    previewMsg += `  BNB Fee: ${ethFee} BNB\n`;
                    previewMsg += `\nYou receive: ${userGets} BKC\n`;
                    previewMsg += `\nContinue?`;
                }
            }
        } catch (e) {
            console.warn('Force unstake preview error:', e);
            previewMsg += `Your NFT tier: ${getTierFromBoost(userNftBoost).icon} ${getTierFromBoost(userNftBoost).name}\n`;
            previewMsg += `${hasTutor ? '5% to tutor' : '10% burned (no tutor)'}\nContinue?`;
        }
        if (!confirm(previewMsg)) return;
    }

    const btn = document.querySelector(`.stk-unstake-btn[data-index='${index}']`);
    isProcessing = true;

    try {
        const txMethod = isForce ? StakingTx.forceUnstake : StakingTx.unstake;
        await txMethod({
            delegationIndex: BigInt(index),
            button: btn,
            onSuccess: async () => {
                showToast(isForce ? 'Force unstaked (penalty applied)' : 'Unstaked successfully!', isForce ? 'warning' : 'success');
                isLoading = false; lastFetch = 0;
                await loadData(true);
            },
            onError: (error) => { if (!error.cancelled) showToast('Unstake failed: ' + (error.reason || error.message || 'Unknown error'), 'error'); }
        });
    } catch (e) {
        showToast('Unstake failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
    }
}

async function handleClaim() {
    if (isProcessing) return;
    const btn = document.getElementById('stk-claim-btn');
    isProcessing = true;

    try {
        await StakingTx.claimRewards({
            button: btn,
            onSuccess: async () => {
                showToast('Rewards claimed!', 'success');
                isLoading = false; lastFetch = 0;
                stakingHistory = [];
                await loadData(true);
            },
            onError: (error) => { if (!error.cancelled) showToast('Claim failed: ' + (error.reason || error.message || 'Unknown error'), 'error'); }
        });
    } catch (e) {
        showToast('Claim failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
    }
}

async function handleBuyback() {
    if (isProcessing) return;
    const btn = document.getElementById('stk-buyback-btn');
    isProcessing = true;

    try {
        await BuybackTx.executeBuyback({
            button: btn,
            onSuccess: async (receipt) => {
                const reward = buybackPreview?.estimatedCallerReward || 0n;
                const rewardStr = Number(ethers.formatEther(reward)).toFixed(6);
                showToast(`Buyback executed! You earned ${rewardStr} BNB`, 'success');
                isLoading = false; lastFetch = 0;
                await loadData(true);
            },
            onError: (error) => { if (!error.cancelled) showToast('Buyback failed: ' + (error.reason || error.message || 'Unknown error'), 'error'); }
        });
    } catch (e) {
        showToast('Buyback failed: ' + (e.reason || e.message || 'Unknown error'), 'error');
    } finally {
        isProcessing = false;
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupListeners() {
    const container = document.getElementById('staking');
    if (!container) return;

    const amountInput = document.getElementById('stk-amount-input');
    const maxBtn = document.getElementById('stk-max-btn');
    const stakeBtn = document.getElementById('stk-delegate-btn');
    const refreshBtn = document.getElementById('stk-refresh-btn');
    const durationChips = document.querySelectorAll('.stk-duration-chip');
    const historyTabs = document.querySelectorAll('.stk-tab');

    amountInput?.addEventListener('input', updatePreview);

    maxBtn?.addEventListener('click', () => {
        const balance = State.currentUserBalance || 0n;
        if (amountInput) { amountInput.value = ethers.formatUnits(balance, 18); updatePreview(); }
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
        loadData(true).then(() => { setTimeout(() => icon?.classList.remove('fa-spin'), 500); });
    });

    // Claim button
    document.getElementById('stk-claim-btn')?.addEventListener('click', handleClaim);

    // Buyback button
    document.getElementById('stk-buyback-btn')?.addEventListener('click', handleBuyback);

    // Navigation via event delegation
    container.addEventListener('click', (e) => {
        if (e.target.closest('.go-to-store')) { e.preventDefault(); window.navigateTo('store'); }
        if (e.target.closest('.go-to-rental')) { e.preventDefault(); window.navigateTo('rental'); }
        if (e.target.closest('.go-to-tutor')) { e.preventDefault(); window.navigateTo('referral'); }
    });
}

// ============================================================================
// EXPORTS
// ============================================================================
export function cleanup() {
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

export function update(isConnected) {
    if (isConnected) { loadData(); } else { resetUI(); }
}

export const StakingPage = { render, update, cleanup };
