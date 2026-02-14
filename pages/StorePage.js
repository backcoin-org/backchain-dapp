// pages/StorePage.js
// ✅ PRODUCTION V15.0 — Card-Based NFT Marketplace + Interactive Fusion/Split UI
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                    NFT Market — Buy & Sell Booster NFTs
// ═══════════════════════════════════════════════════════════════════════════════
//
// V13.0 Changes:
// - Complete redesign: DEX swap → 4-tier card marketplace
// - All 4 pools load in parallel (no tier selector tab switching)
// - Tutor system integration (banner + reward impact preview)
// - Inventory open by default with rental links
// - CSS variables design system matching StakingPage
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

const ethers = window.ethers;

import { State } from '../state.js';
import { loadUserData, loadMyBoostersFromAPI, loadRentalListings, safeContractCall, getHighestBoosterBoostFromAPI, loadSystemDataFromAPI, API_ENDPOINTS } from '../modules/data.js';
import { formatBigNumber, renderNoData } from '../utils.js';
import { showToast, openModal, closeModal } from '../ui-feedback.js';
import { boosterTiers, addresses, nftPoolABI, ipfsGateway, getTierByBoost, getKeepRateFromBoost } from '../config.js';
import { NftTx, FusionTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const POOL_CACHE_TTL = 30000;

const TIER_CONFIG = {
    'Diamond': {
        color: '#22d3ee', border: 'rgba(34,211,238,0.4)', bg: 'rgba(34,211,238,0.06)',
        gradient: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(59,130,246,0.08))',
        icon: '💎', keepRate: 100, recycleRate: 0,
        image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq'
    },
    'Gold': {
        color: '#fbbf24', border: 'rgba(251,191,36,0.4)', bg: 'rgba(251,191,36,0.06)',
        gradient: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(217,119,6,0.08))',
        icon: '🥇', keepRate: 80, recycleRate: 20,
        image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44'
    },
    'Silver': {
        color: '#9ca3af', border: 'rgba(156,163,175,0.4)', bg: 'rgba(156,163,175,0.06)',
        gradient: 'linear-gradient(135deg, rgba(156,163,175,0.12), rgba(100,116,139,0.08))',
        icon: '🥈', keepRate: 70, recycleRate: 30,
        image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4'
    },
    'Bronze': {
        color: '#f97316', border: 'rgba(249,115,22,0.4)', bg: 'rgba(249,115,22,0.06)',
        gradient: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(180,83,9,0.08))',
        icon: '🥉', keepRate: 60, recycleRate: 40,
        image: 'https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m'
    }
};

function getTierStyle(tierName) {
    return TIER_CONFIG[tierName] || TIER_CONFIG['Bronze'];
}

// ============================================================================
// LOCAL STATE
// ============================================================================
const poolDataMap = new Map(); // boostBips → { buyPrice, sellPrice, netSellPrice, poolNFTCount, ... }
const poolAddressCache = new Map();
const poolDataCache = new Map();

let isTransactionInProgress = false;
let tradeHistory = [];
let userTutor = null;
let hasTutor = false;
let userBestBoost = 0;
let currentHistoryFilter = 'ALL';
let fuseSelected = []; // tokenIds selected for fuse (max 2)
let fuseTierFilter = null; // auto-set when first NFT selected
let splitSelectedTokenId = null; // tokenId selected for split
let splitTargetTier = null; // target tier for split
let splitConfirmPending = false; // waiting for split confirmation

const factoryABI = [
    "function getPoolAddress(uint256 boostBips) view returns (address)",
    "function isPool(address) view returns (bool)"
];

// ============================================================================
// HELPERS
// ============================================================================
function formatDate(timestamp) {
    if (!timestamp) return '';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        return new Date(secs * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
}

function getCachedPoolData(boostBips) {
    const cached = poolDataCache.get(boostBips);
    if (cached && (Date.now() - cached.timestamp < POOL_CACHE_TTL)) return cached.data;
    return null;
}

function setCachedPoolData(boostBips, data) {
    poolDataCache.set(boostBips, { data, timestamp: Date.now() });
}

function invalidateAllPoolCaches() {
    poolDataCache.clear();
}

// ============================================================================
// CSS INJECTION
// ============================================================================
function injectStyles() {
    if (document.getElementById('nft-styles-v13')) return;
    const style = document.createElement('style');
    style.id = 'nft-styles-v13';
    style.textContent = `
        .nft-shell {
            --nft-bg: #0c0c0e;
            --nft-surface: #141417;
            --nft-surface-2: #1c1c21;
            --nft-surface-3: #222228;
            --nft-border: rgba(255,255,255,0.06);
            --nft-border-h: rgba(255,255,255,0.12);
            --nft-text: #f0f0f2;
            --nft-text-2: #a0a0ab;
            --nft-text-3: #5c5c68;
            --nft-accent: #f59e0b;
            --nft-green: #4ade80;
            --nft-purple: #a78bfa;
            --nft-cyan: #22d3ee;
            --nft-red: #ef4444;
            --nft-radius: 16px;
            --nft-radius-sm: 10px;
            --nft-tr: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes nft-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes nft-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes nft-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes nft-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes nft-success { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }

        .nft-shell { max-width: 960px; margin: 0 auto; padding: 0 16px 40px; animation: nft-fadeIn 0.4s ease-out; }

        /* Header */
        .nft-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .nft-header-left { display: flex; align-items: center; gap: 14px; }
        .nft-header-icon {
            width: 48px; height: 48px; border-radius: var(--nft-radius);
            background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1));
            border: 1px solid rgba(245,158,11,0.2);
            display: flex; align-items: center; justify-content: center;
            animation: nft-float 4s ease-in-out infinite;
        }
        .nft-header-icon i { font-size: 20px; color: var(--nft-accent); }
        .nft-header-title { font-size: 20px; font-weight: 800; color: var(--nft-text); }
        .nft-header-sub { font-size: 11px; color: var(--nft-text-3); }
        .nft-refresh-btn {
            width: 40px; height: 40px; border-radius: var(--nft-radius-sm);
            background: var(--nft-surface); border: 1px solid var(--nft-border);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all var(--nft-tr); color: var(--nft-text-3);
        }
        .nft-refresh-btn:hover { color: var(--nft-text); border-color: var(--nft-border-h); }

        /* Tutor Banner */
        .nft-tutor-banner {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 14px; border-radius: var(--nft-radius-sm);
            margin-bottom: 14px; font-size: 11px; font-weight: 600;
            animation: nft-fadeIn 0.4s ease-out;
        }
        .nft-tutor-banner a { color: var(--nft-accent); text-decoration: none; font-weight: 700; margin-left: 4px; }
        .nft-tutor-banner a:hover { text-decoration: underline; }

        /* Tier Cards Grid */
        .nft-tier-grid {
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
            margin-bottom: 14px;
        }
        .nft-tier-card {
            position: relative; overflow: hidden;
            background: var(--nft-surface);
            border: 1px solid var(--nft-border);
            border-radius: var(--nft-radius);
            padding: 16px;
            transition: all var(--nft-tr);
            animation: nft-scaleIn 0.5s ease-out both;
        }
        .nft-tier-card:nth-child(1) { animation-delay: 0s; }
        .nft-tier-card:nth-child(2) { animation-delay: 0.05s; }
        .nft-tier-card:nth-child(3) { animation-delay: 0.1s; }
        .nft-tier-card:nth-child(4) { animation-delay: 0.15s; }
        .nft-tier-card:hover { border-color: var(--nft-border-h); }
        .nft-tier-card.nft-user-tier { box-shadow: 0 0 20px rgba(245,158,11,0.1); }
        .nft-user-badge {
            position: absolute; top: 8px; right: 8px;
            padding: 2px 8px; border-radius: 10px; font-size: 8px; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.05em;
            background: var(--nft-accent); color: #000;
        }

        .nft-tier-top { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .nft-tier-img {
            width: 48px; height: 48px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; flex-shrink: 0;
        }
        .nft-tier-img img { width: 100%; height: 100%; object-contain: cover; }
        .nft-tier-name { font-size: 16px; font-weight: 800; }
        .nft-keep-badge {
            display: inline-block; padding: 2px 8px; border-radius: 8px;
            font-size: 10px; font-weight: 700; margin-top: 2px;
        }

        .nft-tier-prices { margin-bottom: 10px; }
        .nft-price-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 4px 0; font-size: 11px;
        }
        .nft-price-label { color: var(--nft-text-3); display: flex; align-items: center; gap: 4px; }
        .nft-price-val { font-weight: 700; font-family: 'SF Mono', monospace; font-size: 12px; }

        .nft-tier-stats {
            display: flex; justify-content: space-between;
            padding: 6px 0; margin-bottom: 10px;
            border-top: 1px solid var(--nft-border); border-bottom: 1px solid var(--nft-border);
        }
        .nft-tier-stat { text-align: center; flex: 1; }
        .nft-tier-stat-label { font-size: 8px; color: var(--nft-text-3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .nft-tier-stat-val { font-size: 13px; font-weight: 800; }

        .nft-tier-actions { display: flex; gap: 6px; }
        .nft-action-btn {
            flex: 1; padding: 8px; font-size: 11px; font-weight: 700;
            border-radius: 8px; border: none; cursor: pointer;
            transition: all var(--nft-tr); display: flex; align-items: center;
            justify-content: center; gap: 4px;
        }
        .nft-action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .nft-action-btn:not(:disabled):hover { transform: translateY(-1px); filter: brightness(1.1); }
        .nft-buy-btn { background: linear-gradient(135deg, #22c55e, #10b981); color: white; }
        .nft-sell-btn { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; }

        /* Impact Card */
        .nft-impact {
            background: var(--nft-surface);
            border: 1px solid var(--nft-border);
            border-radius: var(--nft-radius);
            padding: 16px; margin-bottom: 14px;
            animation: nft-fadeIn 0.5s ease-out 0.2s both;
        }
        .nft-impact-title { font-size: 12px; font-weight: 700; color: var(--nft-text); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .nft-impact-title i { color: var(--nft-text-3); font-size: 11px; }
        .nft-impact-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
        }
        .nft-impact-item {
            text-align: center; padding: 8px 4px;
            background: var(--nft-surface-2); border-radius: 8px;
        }
        .nft-impact-num { font-size: 16px; font-weight: 800; }
        .nft-impact-label { font-size: 8px; color: var(--nft-text-3); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; margin-top: 2px; }
        .nft-impact-cta { margin-top: 8px; font-size: 10px; }
        .nft-impact-cta a { color: var(--nft-accent); text-decoration: none; font-weight: 700; cursor: pointer; }
        .nft-impact-cta a:hover { text-decoration: underline; }

        /* Card Base */
        .nft-card {
            background: var(--nft-surface); border: 1px solid var(--nft-border);
            border-radius: var(--nft-radius); margin-bottom: 14px;
            animation: nft-fadeIn 0.5s ease-out 0.25s both;
        }
        .nft-card-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px; cursor: pointer; transition: background var(--nft-tr);
        }
        .nft-card-header:hover { background: var(--nft-surface-2); }
        .nft-card-title { font-size: 13px; font-weight: 700; color: var(--nft-text); display: flex; align-items: center; gap: 8px; }
        .nft-card-title i { color: var(--nft-text-3); font-size: 11px; }
        .nft-card-badge { font-size: 10px; background: var(--nft-surface-3); padding: 2px 8px; border-radius: 10px; color: var(--nft-text-3); }
        .nft-card-chevron { color: var(--nft-text-3); font-size: 10px; transition: transform var(--nft-tr); }

        .nft-card-body { padding: 0 16px 16px; }

        /* Inventory */
        .nft-inv-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .nft-inv-item {
            position: relative; padding: 8px; border-radius: 10px;
            background: var(--nft-surface-2); border: 1px solid transparent;
            transition: all var(--nft-tr); cursor: default;
        }
        .nft-inv-item:hover { border-color: var(--nft-border-h); background: var(--nft-surface-3); }
        .nft-inv-img {
            width: 100%; aspect-ratio: 1; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; margin-bottom: 4px;
        }
        .nft-inv-img img { width: 100%; height: 100%; object-fit: contain; }
        .nft-inv-status {
            position: absolute; top: 4px; right: 4px;
            padding: 1px 5px; border-radius: 6px; font-size: 7px; font-weight: 800;
        }
        .nft-inv-name { font-size: 9px; text-align: center; font-weight: 700; }
        .nft-inv-id { font-size: 8px; text-align: center; color: var(--nft-text-3); }
        .nft-inv-rent {
            display: block; text-align: center; font-size: 8px; font-weight: 700;
            color: var(--nft-accent); margin-top: 2px; text-decoration: none; cursor: pointer;
        }
        .nft-inv-rent:hover { text-decoration: underline; }

        /* Fusion Section — Premium Interactive UI */
        .nft-fusion-card {
            background: var(--nft-surface); border: 1px solid var(--nft-border);
            border-radius: var(--nft-radius); margin-bottom: 12px; overflow: hidden;
            animation: nft-scaleIn 0.3s ease-out;
            box-shadow: 0 0 20px rgba(245,158,11,0.04);
        }
        .nft-fusion-tabs { display: flex; border-bottom: 1px solid var(--nft-border); position: relative; }
        .nft-fusion-tab {
            flex: 1; padding: 11px 16px; font-size: 11px; font-weight: 700;
            color: var(--nft-text-3); text-align: center; cursor: pointer;
            border-bottom: 2px solid transparent; transition: all var(--nft-tr);
            background: none; border-top: none; border-left: none; border-right: none;
        }
        .nft-fusion-tab:hover { color: var(--nft-text-2); background: rgba(255,255,255,0.02); }
        .nft-fusion-tab.active { color: var(--nft-accent); border-bottom-color: var(--nft-accent); }
        .nft-fusion-body { padding: 14px; }
        .nft-fusion-hint { font-size: 10px; color: var(--nft-text-3); margin-bottom: 10px; }

        /* Tier Filter Buttons */
        .nft-fusion-filters { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
        .nft-fusion-filter {
            padding: 5px 12px; border-radius: 20px; font-size: 10px; font-weight: 700;
            border: 1px solid var(--nft-border); background: var(--nft-surface-2);
            color: var(--nft-text-3); cursor: pointer; transition: all var(--nft-tr);
        }
        .nft-fusion-filter:hover:not(:disabled) { border-color: var(--nft-border-h); color: var(--nft-text-2); }
        .nft-fusion-filter.active { border-color: var(--nft-accent); color: var(--nft-accent); background: rgba(245,158,11,0.08); }
        .nft-fusion-filter:disabled { opacity: 0.3; cursor: not-allowed; }
        .nft-fusion-filter .ff-count { font-size: 8px; opacity: 0.6; margin-left: 3px; }

        /* Selectable NFT Grid */
        .nft-fusion-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
        .nft-fusion-nft {
            position: relative; padding: 10px 6px 8px; border-radius: 10px; text-align: center;
            background: var(--nft-surface-2); border: 2px solid var(--nft-border);
            cursor: pointer; transition: all 0.2s ease; user-select: none;
        }
        .nft-fusion-nft:hover { border-color: var(--nft-border-h); transform: translateY(-1px); }
        .nft-fusion-nft.selected {
            border-color: var(--nft-accent); background: rgba(245,158,11,0.08);
            box-shadow: 0 0 12px rgba(245,158,11,0.2);
        }
        .nft-fusion-nft.selected::after {
            content: ''; position: absolute; inset: -4px; border-radius: 12px;
            border: 2px solid var(--nft-accent); opacity: 0.4;
            animation: nft-pulse-ring 1.5s ease-in-out infinite;
        }
        .nft-fusion-nft-icon { font-size: 22px; margin-bottom: 3px; display: block; }
        .nft-fusion-nft-id { font-size: 9px; font-weight: 800; color: var(--nft-text); }
        .nft-fusion-nft-tier { font-size: 8px; color: var(--nft-text-3); margin-top: 1px; }
        .nft-fusion-nft-check {
            position: absolute; top: 3px; right: 3px; width: 16px; height: 16px;
            border-radius: 50%; background: var(--nft-accent); color: #000;
            display: none; align-items: center; justify-content: center; font-size: 8px; font-weight: 900;
        }
        .nft-fusion-nft.selected .nft-fusion-nft-check { display: flex; }

        /* Transformation Preview */
        .nft-fusion-preview {
            display: flex; align-items: center; justify-content: center; gap: 10px;
            padding: 12px 14px; background: var(--nft-surface-2);
            border: 1px solid rgba(245,158,11,0.25); border-radius: 10px;
            margin-bottom: 10px; animation: nft-fadeIn 0.3s ease-out;
        }
        .nft-fusion-preview-item { text-align: center; }
        .nft-fusion-preview-icon { font-size: 20px; display: block; }
        .nft-fusion-preview-label { font-size: 9px; font-weight: 700; margin-top: 2px; }
        .nft-fusion-preview-plus { font-size: 14px; font-weight: 900; color: var(--nft-text-3); }
        .nft-fusion-preview-arrow {
            font-size: 16px; color: var(--nft-accent); animation: nft-bounce-arrow 1s ease-in-out infinite;
        }
        .nft-fusion-preview-result { text-align: center; }
        .nft-fusion-preview-result-icon { font-size: 26px; display: block; filter: drop-shadow(0 0 6px rgba(245,158,11,0.3)); }
        .nft-fusion-preview-result-label { font-size: 10px; font-weight: 800; margin-top: 2px; }
        .nft-fusion-preview-fee { font-size: 9px; color: var(--nft-text-3); margin-top: 6px; text-align: center; }

        /* CTA Button */
        .nft-fusion-cta {
            width: 100%; padding: 10px; border: none; border-radius: 10px;
            font-size: 12px; font-weight: 800; cursor: pointer;
            transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .nft-fusion-cta.fuse-cta {
            background: linear-gradient(135deg, #f59e0b, #d97706); color: #000;
            box-shadow: 0 2px 10px rgba(245,158,11,0.25);
        }
        .nft-fusion-cta.fuse-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(245,158,11,0.35); }
        .nft-fusion-cta.split-cta {
            background: linear-gradient(135deg, #a78bfa, #7c3aed); color: #fff;
            box-shadow: 0 2px 10px rgba(124,58,237,0.25);
        }
        .nft-fusion-cta.split-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,0.35); }
        .nft-fusion-cta:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

        /* Split Options Panel */
        .nft-split-options {
            padding: 10px; margin-top: 8px; background: var(--nft-surface-3);
            border: 1px solid var(--nft-border); border-radius: 8px;
            animation: nft-fadeIn 0.2s ease-out;
        }
        .nft-split-option {
            display: flex; align-items: center; justify-content: space-between;
            padding: 7px 10px; border-radius: 6px; cursor: pointer;
            transition: all var(--nft-tr); margin-bottom: 4px;
            border: 1px solid transparent;
        }
        .nft-split-option:hover { background: rgba(255,255,255,0.03); }
        .nft-split-option.active {
            background: rgba(124,58,237,0.08); border-color: rgba(124,58,237,0.3);
        }
        .nft-split-option-left { display: flex; align-items: center; gap: 6px; }
        .nft-split-option-radio {
            width: 14px; height: 14px; border-radius: 50%;
            border: 2px solid var(--nft-border); transition: all var(--nft-tr);
        }
        .nft-split-option.active .nft-split-option-radio {
            border-color: #a78bfa; background: #a78bfa;
            box-shadow: inset 0 0 0 2px var(--nft-surface-3);
        }
        .nft-split-option-label { font-size: 10px; font-weight: 700; color: var(--nft-text); }
        .nft-split-option-fee { font-size: 9px; color: var(--nft-text-3); }

        /* Split Confirmation Inline */
        .nft-split-confirm {
            margin-top: 8px; padding: 10px 12px; background: rgba(239,68,68,0.06);
            border: 1px solid rgba(239,68,68,0.2); border-radius: 8px;
            animation: nft-fadeIn 0.2s ease-out;
        }
        .nft-split-confirm-text { font-size: 10px; color: #fca5a5; margin-bottom: 8px; line-height: 1.4; }
        .nft-split-confirm-btns { display: flex; gap: 8px; }
        .nft-split-confirm-cancel {
            flex: 1; padding: 7px; border-radius: 6px; font-size: 10px; font-weight: 700;
            background: var(--nft-surface-2); color: var(--nft-text-3); border: 1px solid var(--nft-border);
            cursor: pointer; transition: all var(--nft-tr);
        }
        .nft-split-confirm-cancel:hover { color: var(--nft-text); border-color: var(--nft-border-h); }
        .nft-split-confirm-go {
            flex: 1; padding: 7px; border-radius: 6px; font-size: 10px; font-weight: 800;
            background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; border: none;
            cursor: pointer; transition: all var(--nft-tr);
        }
        .nft-split-confirm-go:hover { transform: scale(1.02); }
        .nft-split-confirm-go:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }

        /* Empty & Stats */
        .nft-fusion-empty { text-align: center; padding: 20px; color: var(--nft-text-3); font-size: 11px; }
        .nft-fusion-empty i { font-size: 20px; margin-bottom: 6px; display: block; opacity: 0.3; }
        .nft-fusion-stats {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            padding: 8px 12px; border-top: 1px solid var(--nft-border);
            font-size: 9px; color: var(--nft-text-3);
        }
        .nft-fusion-stats-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--nft-text-3); opacity: 0.4; }

        /* Animations */
        @keyframes nft-pulse-ring {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.15; transform: scale(1.03); }
        }
        @keyframes nft-bounce-arrow {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(4px); }
        }

        /* History */
        .nft-hist-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; }
        .nft-hist-list::-webkit-scrollbar { width: 4px; }
        .nft-hist-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .nft-hist-item {
            display: flex; align-items: center; justify-content: space-between; gap: 8px;
            padding: 8px 10px; background: var(--nft-surface-2);
            border: 1px solid transparent; border-radius: 8px;
            transition: all var(--nft-tr); text-decoration: none;
        }
        .nft-hist-item:hover { background: var(--nft-surface-3); border-color: var(--nft-border-h); }
        .nft-hist-icon {
            width: 32px; height: 32px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12px;
        }
        .nft-hist-info { flex: 1; min-width: 0; }
        .nft-hist-label { font-size: 11px; font-weight: 600; color: var(--nft-text); }
        .nft-hist-date { font-size: 9px; color: var(--nft-text-3); margin-top: 1px; }
        .nft-hist-amount { font-size: 11px; font-weight: 600; font-family: 'SF Mono', monospace; }

        /* Empty / Loading */
        .nft-empty { text-align: center; padding: 24px 16px; }
        .nft-empty i { font-size: 20px; color: var(--nft-text-3); margin-bottom: 6px; display: block; }
        .nft-empty p { font-size: 11px; color: var(--nft-text-3); }
        .nft-loading { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; }
        .nft-loading-icon { width: 32px; height: 32px; opacity: 0.3; animation: nft-float 2s ease-in-out infinite; }

        /* Responsive */
        @media (max-width: 480px) {
            .nft-shell { padding: 0 10px 30px; }
            .nft-tier-grid { grid-template-columns: 1fr; }
            .nft-impact-grid { grid-template-columns: repeat(2, 1fr); }
            .nft-inv-grid { grid-template-columns: repeat(3, 1fr); }
            .nft-fusion-grid { grid-template-columns: repeat(3, 1fr); }
            .nft-fusion-preview { flex-wrap: wrap; gap: 6px; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// RENDER
// ============================================================================
export const StorePage = {
    async render(isNewPage) {
        injectStyles();
        await loadSystemDataFromAPI();

        const container = document.getElementById('store');
        if (!container) return;

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div class="nft-shell">

                    <!-- HEADER -->
                    <div class="nft-header">
                        <div class="nft-header-left">
                            <div class="nft-header-icon"><i class="fa-solid fa-gem"></i></div>
                            <div>
                                <div class="nft-header-title">Booster Market</div>
                                <div class="nft-header-sub">Buy Booster NFTs to keep more staking rewards. Higher tier = higher keep rate</div>
                            </div>
                        </div>
                        <button id="nft-refresh-btn" class="nft-refresh-btn"><i class="fa-solid fa-rotate"></i></button>
                    </div>

                    <!-- TUTOR BANNER -->
                    <div id="nft-tutor-banner"></div>

                    <!-- TIER CARDS GRID -->
                    <div id="nft-tier-grid" class="nft-tier-grid">
                        ${boosterTiers.map(() => `
                            <div class="nft-tier-card" style="min-height:200px">
                                <div class="nft-loading">
                                    <img src="./assets/bkc_logo_3d.png" class="nft-loading-icon" alt="">
                                    <span style="font-size:10px;color:var(--nft-text-3)">Loading...</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- REWARD IMPACT PREVIEW -->
                    <div id="nft-impact"></div>

                    <!-- NFT FUSION & SPLIT -->
                    <div id="nft-fusion-section"></div>

                    <!-- MY NFTs INVENTORY (open by default) -->
                    <div class="nft-card">
                        <div id="nft-inv-toggle" class="nft-card-header">
                            <div class="nft-card-title">
                                <i class="fa-solid fa-wallet"></i> My NFTs
                                <span id="nft-inv-count" class="nft-card-badge">0</span>
                            </div>
                            <i id="nft-inv-chevron" class="fa-solid fa-chevron-down nft-card-chevron" style="transform:rotate(180deg)"></i>
                        </div>
                        <div id="nft-inv-body" class="nft-card-body">
                            <div id="nft-inv-grid" class="nft-inv-grid">
                                <div class="nft-empty" style="grid-column:1/-1"><i class="fa-solid fa-gem"></i><p>Loading...</p></div>
                            </div>
                        </div>
                    </div>

                    <!-- TRADE HISTORY (open by default) -->
                    <div class="nft-card">
                        <div id="nft-hist-toggle" class="nft-card-header">
                            <div class="nft-card-title">
                                <i class="fa-solid fa-clock-rotate-left"></i> Trade History
                                <span id="nft-hist-count" class="nft-card-badge">0</span>
                            </div>
                            <i id="nft-hist-chevron" class="fa-solid fa-chevron-down nft-card-chevron" style="transform:rotate(180deg)"></i>
                        </div>
                        <div id="nft-hist-body" class="nft-card-body">
                            <div id="nft-hist-list" class="nft-hist-list">
                                <div class="nft-loading">
                                    <img src="./assets/bkc_logo_3d.png" class="nft-loading-icon" alt="">
                                    <span style="font-size:10px;color:var(--nft-text-3)">Loading...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            `;

            setupEventListeners();
        }

        await loadAllData();
    },

    async update() {
        const container = document.getElementById('store');
        if (container && !document.hidden) {
            await loadAllData();
        }
    }
};

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadAllData() {
    try {
        // Load tutor + NFT data + user data in parallel
        await Promise.all([
            loadTutorData(),
            loadMyBoostersFromAPI(),
            loadRentalListings(),
            loadUserData()
        ]);

        // Determine user's best boost
        const boosters = State.myBoosters || [];
        userBestBoost = 0;
        boosters.forEach(nft => {
            const b = Number(nft.boostBips);
            if (b > userBestBoost) userBestBoost = b;
        });

        // Load all 4 pool data in parallel
        await loadAllPoolsData();

        // Render everything
        renderTutorBanner();
        renderTierCards();
        renderImpactPreview();
        renderFusionSection();
        renderInventory();
        loadTradeHistory();
    } catch (e) {
        console.error('NFT Market data load error:', e);
    }
}

async function loadTutorData() {
    if (!State.userAddress) { userTutor = null; hasTutor = false; return; }
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

async function loadAllPoolsData() {
    const promises = boosterTiers.map(tier => loadSinglePoolData(tier));
    await Promise.allSettled(promises);
}

async function loadSinglePoolData(tier) {
    const boostBips = tier.boostBips;

    // Check cache first
    const cached = getCachedPoolData(boostBips);
    if (cached) {
        poolDataMap.set(boostBips, cached);
        return;
    }

    const poolKey = `pool_${tier.name.toLowerCase()}`;
    let poolAddress = addresses[poolKey] || poolAddressCache.get(boostBips);

    if (!poolAddress) {
        const factoryAddress = addresses.nftPoolFactory || addresses.nftLiquidityPoolFactory;
        if (factoryAddress && State.publicProvider) {
            try {
                const factory = new ethers.Contract(factoryAddress, factoryABI, State.publicProvider);
                poolAddress = await factory.getPoolAddress(boostBips);
                if (poolAddress && poolAddress !== ethers.ZeroAddress) {
                    poolAddressCache.set(boostBips, poolAddress);
                }
            } catch (e) {
                console.warn('Factory lookup failed for', tier.name, e.message);
            }
        }
    }

    if (!poolAddress || poolAddress === ethers.ZeroAddress) {
        poolDataMap.set(boostBips, { unavailable: true });
        return;
    }

    try {
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.publicProvider);

        const [buyPriceResult, sellPriceResult, availableNFTsResult] = await Promise.all([
            safeContractCall(poolContract, 'getBuyPrice', [], ethers.MaxUint256).catch(() => ethers.MaxUint256),
            safeContractCall(poolContract, 'getSellPrice', [], 0n).catch(() => 0n),
            poolContract.getAvailableNFTs().catch(() => [])
        ]);

        const availableTokenIds = Array.isArray(availableNFTsResult) ? [...availableNFTsResult] : [];
        const buyPrice = (buyPriceResult === ethers.MaxUint256) ? 0n : buyPriceResult;
        const sellPrice = sellPriceResult;

        // Net sell price after tax
        let baseTaxBips = State.systemFees?.["NFT_POOL_SELL_TAX_BIPS"] || 1000n;
        const baseTaxBigInt = typeof baseTaxBips === 'bigint' ? baseTaxBips : BigInt(baseTaxBips);
        const taxAmount = (sellPrice * baseTaxBigInt) / 10000n;
        const netSellPrice = sellPrice - taxAmount;

        // User NFTs of this tier
        const userNFTs = State.myBoosters || [];
        const rentalListings = State.rentalListings || [];
        const listedTokenIds = new Set(rentalListings.map(l => l.tokenId?.toString()));
        const nowSec = Math.floor(Date.now() / 1000);

        const userNFTsOfTier = userNFTs.filter(nft => Number(nft.boostBips) === boostBips);
        const availableNFTsOfTier = userNFTsOfTier.filter(nft => {
            const tokenIdStr = nft.tokenId?.toString();
            const listing = rentalListings.find(l => l.tokenId?.toString() === tokenIdStr);
            const isListed = listedTokenIds.has(tokenIdStr);
            const isRented = listing && listing.rentalEndTime && Number(listing.rentalEndTime) > nowSec;
            return !isListed && !isRented;
        });

        const poolData = {
            buyPrice, sellPrice, netSellPrice, poolAddress,
            poolNFTCount: availableTokenIds.length,
            firstAvailableTokenIdForBuy: availableTokenIds.length > 0 ? BigInt(availableTokenIds[availableTokenIds.length - 1]) : null,
            userOwned: userNFTsOfTier.length,
            availableToSell: availableNFTsOfTier.length,
            firstSellableTokenId: availableNFTsOfTier.length > 0 ? BigInt(availableNFTsOfTier[0].tokenId) : null,
            unavailable: false
        };

        setCachedPoolData(boostBips, poolData);
        poolDataMap.set(boostBips, poolData);
    } catch (e) {
        console.warn('Pool data error for', tier.name, e.message);
        poolDataMap.set(boostBips, { unavailable: true });
    }
}

// ============================================================================
// TUTOR BANNER
// ============================================================================
function renderTutorBanner() {
    const el = document.getElementById('nft-tutor-banner');
    if (!el) return;

    if (!State.isConnected) {
        el.innerHTML = '';
        return;
    }

    if (hasTutor) {
        const short = `${userTutor.slice(0,6)}...${userTutor.slice(-4)}`;
        el.innerHTML = `
            <div class="nft-tutor-banner" style="background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.15)">
                <i class="fa-solid fa-graduation-cap" style="color:var(--nft-green)"></i>
                <span style="color:var(--nft-green)">Tutor active (${short}) — 5% of rewards go to tutor instead of being burned</span>
            </div>
        `;
    } else {
        el.innerHTML = `
            <div class="nft-tutor-banner" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15)">
                <i class="fa-solid fa-graduation-cap" style="color:var(--nft-red)"></i>
                <span style="color:var(--nft-red)">No tutor — 10% of staking rewards burned.</span>
                <a href="#" class="go-to-tutor">Set a Tutor</a>
                <span style="color:var(--nft-text-3);margin-left:2px">to reduce burn to 5%</span>
            </div>
        `;
    }
}

// ============================================================================
// TIER CARDS
// ============================================================================
function renderTierCards() {
    const grid = document.getElementById('nft-tier-grid');
    if (!grid) return;

    grid.innerHTML = boosterTiers.map(tier => {
        const style = getTierStyle(tier.name);
        const data = poolDataMap.get(tier.boostBips) || {};
        const isUserTier = userBestBoost === tier.boostBips && userBestBoost > 0;
        const isUnavailable = data.unavailable;

        if (isUnavailable) {
            return `
                <div class="nft-tier-card" style="border-color:${style.border}">
                    <div class="nft-tier-top">
                        <div class="nft-tier-img" style="background:${style.bg};border:1px solid ${style.border}">
                            <img src="${style.image}" alt="${tier.name}" onerror="this.outerHTML='<span style=\\'font-size:28px\\'>${style.icon}</span>'">
                        </div>
                        <div>
                            <div class="nft-tier-name" style="color:${style.color}">${style.icon} ${tier.name}</div>
                            <div class="nft-keep-badge" style="background:${style.bg};color:${style.color}">Keep ${style.keepRate}%</div>
                        </div>
                    </div>
                    <div class="nft-empty"><i class="fa-solid fa-store-slash"></i><p>Pool coming soon</p></div>
                </div>
            `;
        }

        const buyPrice = data.buyPrice || 0n;
        const netSell = data.netSellPrice || 0n;
        const poolCount = data.poolNFTCount || 0;
        const userOwned = data.userOwned || 0;
        const soldOut = data.firstAvailableTokenIdForBuy === null;
        const noSellable = data.availableToSell === 0;
        const balance = State.currentUserBalance || 0n;
        const insufficientBuy = buyPrice > 0n && buyPrice > balance;

        const buyPriceStr = buyPrice > 0n ? formatBigNumber(buyPrice).toFixed(1) : '--';
        const sellPriceStr = (netSell > 0n && userOwned > 0) ? formatBigNumber(netSell).toFixed(1) : '--';

        // Buy button state
        let buyDisabled = !State.isConnected || soldOut || insufficientBuy || buyPrice === 0n;
        let buyLabel = soldOut ? 'Sold Out' : (insufficientBuy ? 'Low BKC' : 'Buy');
        let buyIcon = 'fa-cart-plus';
        if (!State.isConnected) buyLabel = 'Connect';

        // Sell button state
        let sellDisabled = !State.isConnected || noSellable;
        let sellLabel = 'Sell';
        if (!State.isConnected) { sellLabel = '--'; }
        else if (userOwned === 0) { sellLabel = 'No NFT'; }
        else if (noSellable) { sellLabel = 'Rented'; }

        // Fusion hint for sold-out tiers (Bronze can't be fused TO, Diamond can't be fused FROM)
        const tierIndex = boosterTiers.indexOf(tier);
        let fusionHint = '';
        if (soldOut && tierIndex > 0) {
            const lowerTier = boosterTiers[tierIndex - 1];
            if (lowerTier) {
                const lowerStyle = getTierStyle(lowerTier.name);
                fusionHint = `<div style="text-align:center;padding:4px 0 2px;font-size:9px;color:var(--nft-text-3)">
                    <i class="fa-solid fa-fire" style="color:#f59e0b;font-size:8px"></i>
                    Fuse 2x ${lowerStyle.icon} ${lowerTier.name} to get ${style.icon} ${tier.name}
                </div>`;
            }
        }

        return `
            <div class="nft-tier-card ${isUserTier ? 'nft-user-tier' : ''}" style="border-color:${isUserTier ? style.color : 'var(--nft-border)'}" data-boost="${tier.boostBips}">
                ${isUserTier ? '<div class="nft-user-badge">YOUR TIER</div>' : ''}
                <div class="nft-tier-top">
                    <div class="nft-tier-img" style="background:${style.bg};border:1px solid ${style.border}">
                        <img src="${style.image}" alt="${tier.name}" onerror="this.outerHTML='<span style=\\'font-size:28px\\'>${style.icon}</span>'">
                    </div>
                    <div>
                        <div class="nft-tier-name" style="color:${style.color}">${style.icon} ${tier.name}</div>
                        <div class="nft-keep-badge" style="background:${style.bg};color:${style.keepRate === 100 ? 'var(--nft-green)' : style.color}">Keep ${style.keepRate}%</div>
                    </div>
                </div>

                <div class="nft-tier-prices">
                    <div class="nft-price-row">
                        <span class="nft-price-label"><i class="fa-solid fa-cart-plus" style="color:var(--nft-green)"></i> Buy</span>
                        <span class="nft-price-val" style="color:${soldOut ? 'var(--nft-text-3)' : 'var(--nft-text)'}">${soldOut ? 'Sold Out' : `${buyPriceStr} BKC`}</span>
                    </div>
                    <div class="nft-price-row">
                        <span class="nft-price-label"><i class="fa-solid fa-money-bill-transfer" style="color:var(--nft-accent)"></i> Sell</span>
                        <span class="nft-price-val" style="color:${userOwned > 0 ? 'var(--nft-text)' : 'var(--nft-text-3)'}">${userOwned > 0 ? `${sellPriceStr} BKC` : (soldOut ? '--' : 'Buy first')}</span>
                    </div>
                </div>

                <div class="nft-tier-stats">
                    <div class="nft-tier-stat">
                        <div class="nft-tier-stat-label">In Pool</div>
                        <div class="nft-tier-stat-val" style="color:${poolCount > 0 ? 'var(--nft-green)' : 'var(--nft-red)'}">${poolCount}</div>
                    </div>
                    <div class="nft-tier-stat">
                        <div class="nft-tier-stat-label">You Own</div>
                        <div class="nft-tier-stat-val" style="color:${userOwned > 0 ? style.color : 'var(--nft-text-3)'}">${userOwned}</div>
                    </div>
                </div>

                <div class="nft-tier-actions">
                    ${soldOut ? `
                        <button class="nft-action-btn" style="flex:1;background:var(--nft-surface-2);color:var(--nft-text-3);cursor:default" disabled>
                            <i class="fa-solid fa-store-slash" style="font-size:10px"></i> Sold Out
                        </button>
                    ` : `
                        <button class="nft-action-btn nft-buy-btn" data-action="buy" data-boost="${tier.boostBips}" ${buyDisabled ? 'disabled' : ''}>
                            <i class="fa-solid fa-cart-plus" style="font-size:10px"></i> ${buyLabel}
                        </button>
                    `}
                    ${userOwned > 0 ? `
                        <button class="nft-action-btn nft-sell-btn" data-action="sell" data-boost="${tier.boostBips}" ${sellDisabled ? 'disabled' : ''}>
                            <i class="fa-solid fa-money-bill-transfer" style="font-size:10px"></i> ${sellLabel}
                        </button>
                    ` : ''}
                </div>
                ${fusionHint}
            </div>
        `;
    }).join('');
}

// ============================================================================
// REWARD IMPACT PREVIEW
// ============================================================================
function renderImpactPreview() {
    const el = document.getElementById('nft-impact');
    if (!el) return;

    if (!State.isConnected) {
        el.innerHTML = '';
        return;
    }

    const tierInfo = getTierFromBoostLocal(userBestBoost);
    const keepPct = tierInfo.keepRate;
    const recyclePct = tierInfo.recycleRate;
    const tutorPct = hasTutor ? 5 : 0;
    const burnPct = hasTutor ? 0 : 10;
    const netUserPct = keepPct - tutorPct - burnPct;

    // Can improve?
    const canUpgradeNft = userBestBoost < 5000;
    const canSetTutor = !hasTutor;

    el.innerHTML = `
        <div class="nft-impact">
            <div class="nft-impact-title"><i class="fa-solid fa-chart-pie"></i> Your Reward Distribution (on 100 BKC claimed)</div>
            <div class="nft-impact-grid">
                <div class="nft-impact-item">
                    <div class="nft-impact-num" style="color:var(--nft-green)">${netUserPct}</div>
                    <div class="nft-impact-label">You Keep</div>
                </div>
                <div class="nft-impact-item">
                    <div class="nft-impact-num" style="color:var(--nft-cyan)">${recyclePct}</div>
                    <div class="nft-impact-label">Recycled</div>
                </div>
                <div class="nft-impact-item">
                    <div class="nft-impact-num" style="color:${hasTutor ? 'var(--nft-accent)' : 'var(--nft-text-3)'}">${tutorPct}</div>
                    <div class="nft-impact-label">${hasTutor ? 'To Tutor' : 'Tutor'}</div>
                </div>
                <div class="nft-impact-item">
                    <div class="nft-impact-num" style="color:${burnPct > 0 ? 'var(--nft-red)' : 'var(--nft-green)'}">${burnPct}</div>
                    <div class="nft-impact-label">Burned</div>
                </div>
            </div>
            ${(canUpgradeNft || canSetTutor) ? `
                <div class="nft-impact-cta">
                    ${canUpgradeNft ? `<span><i class="fa-solid fa-arrow-up" style="color:var(--nft-cyan);font-size:9px;margin-right:3px"></i><a href="#" class="go-to-diamond">Upgrade to Diamond</a> to keep ${hasTutor ? '95' : '90'}%</span>` : ''}
                    ${canUpgradeNft && canSetTutor ? '<span style="color:var(--nft-text-3);margin:0 6px">|</span>' : ''}
                    ${canSetTutor ? `<span><i class="fa-solid fa-graduation-cap" style="color:var(--nft-accent);font-size:9px;margin-right:3px"></i><a href="#" class="go-to-tutor">Set a Tutor</a> to convert burn to tutor cut</span>` : ''}
                </div>
            ` : `
                <div class="nft-impact-cta" style="color:var(--nft-green)">
                    <i class="fa-solid fa-check-circle" style="font-size:9px;margin-right:3px"></i> Maximum efficiency! ${keepPct === 100 ? 'Diamond + Tutor = only 5% to tutor' : ''}
                </div>
            `}
        </div>
    `;
}

function getTierFromBoostLocal(boost) {
    if (boost >= 5000) return { keepRate: 100, recycleRate: 0, name: 'Diamond' };
    if (boost >= 4000) return { keepRate: 80, recycleRate: 20, name: 'Gold' };
    if (boost >= 2500) return { keepRate: 70, recycleRate: 30, name: 'Silver' };
    if (boost >= 1000) return { keepRate: 60, recycleRate: 40, name: 'Bronze' };
    return { keepRate: 40, recycleRate: 60, name: 'None' };
}

// ============================================================================
// FUSION & SPLIT SECTION — Premium Interactive UI
// ============================================================================
let fusionActiveTab = 'fuse'; // 'fuse' | 'split'
const TIER_NAMES_MAP = { 0: 'Bronze', 1: 'Silver', 2: 'Gold', 3: 'Diamond' };

function getAvailableNftsByTier() {
    const boosters = State.myBoosters || [];
    const rentalListings = State.rentalListings || [];
    const now = Math.floor(Date.now() / 1000);
    const nftsByTier = { 0: [], 1: [], 2: [], 3: [] };

    for (const nft of boosters) {
        const boost = Number(nft.boostBips);
        let tier = 0;
        if (boost >= 5000) tier = 3;
        else if (boost >= 4000) tier = 2;
        else if (boost >= 2500) tier = 1;

        const listing = rentalListings.find(l => l.tokenId?.toString() === nft.tokenId?.toString());
        const isRented = listing && listing.rentalEndTime && Number(listing.rentalEndTime) > now;
        const isListed = listing && !isRented;
        if (isRented || isListed) continue;

        nftsByTier[tier].push({ tokenId: Number(nft.tokenId), tier, boost });
    }
    return nftsByTier;
}

function renderFusionSection() {
    const container = document.getElementById('nft-fusion-section');
    if (!container) return;

    if (!State.isConnected) { container.innerHTML = ''; return; }

    const boosters = State.myBoosters || [];
    const nftsByTier = getAvailableNftsByTier();
    const totalAvailable = Object.values(nftsByTier).reduce((s, arr) => s + arr.length, 0);

    // Always show the card — even with 0 NFTs, show the upgrade path explanation
    const hasNfts = totalAvailable > 0;

    container.innerHTML = `
        <div class="nft-fusion-card">
            <div class="nft-fusion-tabs">
                <button class="nft-fusion-tab ${fusionActiveTab === 'fuse' ? 'active' : ''}" data-fusion-tab="fuse">
                    <i class="fa-solid fa-fire"></i> Fuse (Upgrade)
                </button>
                <button class="nft-fusion-tab ${fusionActiveTab === 'split' ? 'active' : ''}" data-fusion-tab="split">
                    <i class="fa-solid fa-scissors"></i> Split (Downgrade)
                </button>
            </div>
            <div class="nft-fusion-body">
                ${hasNfts
                    ? (fusionActiveTab === 'fuse' ? renderFuseTab(nftsByTier) : renderSplitTab(nftsByTier))
                    : renderFusionExplainer()
                }
            </div>
            <div class="nft-fusion-stats" id="nft-fusion-stats"></div>
        </div>
    `;

    // Load stats non-blocking
    FusionTx.getFusionStats().then(stats => {
        const el = document.getElementById('nft-fusion-stats');
        if (!el) return;
        const parts = [];
        if (stats.totalFusions > 0) parts.push(`${stats.totalFusions} fusions`);
        if (stats.totalSplits > 0) parts.push(`${stats.totalSplits} splits`);
        if (parts.length === 0) { el.style.display = 'none'; return; }
        el.innerHTML = `<i class="fa-solid fa-chart-simple" style="font-size:8px;opacity:0.5"></i> ${parts.join(' &middot; ')} on the platform`;
    }).catch(() => {});
}

function renderFusionExplainer() {
    return `
        <div style="text-align:center;padding:16px 10px">
            <div style="font-size:13px;font-weight:800;color:var(--nft-text);margin-bottom:10px">
                <i class="fa-solid fa-fire" style="color:#f59e0b"></i> NFT Fusion System
            </div>
            <div style="font-size:10px;color:var(--nft-text-3);margin-bottom:14px;line-height:1.5">
                Combine 2 NFTs of the same tier into 1 higher-tier NFT.<br>
                Even when pools are sold out, you can reach Diamond through fusion!
            </div>
            <div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:14px">
                <span style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:8px;background:${TIER_CONFIG.Bronze.bg};border:1px solid ${TIER_CONFIG.Bronze.border};font-size:10px;font-weight:700;color:${TIER_CONFIG.Bronze.color}">
                    2x ${TIER_CONFIG.Bronze.icon} Bronze
                </span>
                <i class="fa-solid fa-arrow-right" style="font-size:9px;color:var(--nft-accent)"></i>
                <span style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:8px;background:${TIER_CONFIG.Silver.bg};border:1px solid ${TIER_CONFIG.Silver.border};font-size:10px;font-weight:700;color:${TIER_CONFIG.Silver.color}">
                    1x ${TIER_CONFIG.Silver.icon} Silver
                </span>
                <i class="fa-solid fa-arrow-right" style="font-size:9px;color:var(--nft-accent)"></i>
                <span style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:8px;background:${TIER_CONFIG.Gold.bg};border:1px solid ${TIER_CONFIG.Gold.border};font-size:10px;font-weight:700;color:${TIER_CONFIG.Gold.color}">
                    ${TIER_CONFIG.Gold.icon} Gold
                </span>
                <i class="fa-solid fa-arrow-right" style="font-size:9px;color:var(--nft-accent)"></i>
                <span style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:8px;background:${TIER_CONFIG.Diamond.bg};border:1px solid ${TIER_CONFIG.Diamond.border};font-size:10px;font-weight:700;color:${TIER_CONFIG.Diamond.color}">
                    ${TIER_CONFIG.Diamond.icon} Diamond
                </span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:320px;margin:0 auto 12px">
                <div style="padding:8px;border-radius:8px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15)">
                    <div style="font-size:10px;font-weight:800;color:#f59e0b;margin-bottom:2px"><i class="fa-solid fa-fire"></i> Fuse</div>
                    <div style="font-size:9px;color:var(--nft-text-3)">2 same-tier NFTs &rarr; 1 higher tier</div>
                </div>
                <div style="padding:8px;border-radius:8px;background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.15)">
                    <div style="font-size:10px;font-weight:800;color:#a78bfa;margin-bottom:2px"><i class="fa-solid fa-scissors"></i> Split</div>
                    <div style="font-size:9px;color:var(--nft-text-3)">1 NFT &rarr; 2 lower-tier NFTs</div>
                </div>
            </div>
            <div style="font-size:10px;color:var(--nft-accent);font-weight:700">
                <i class="fa-solid fa-arrow-up"></i> Buy Bronze NFTs above to start fusing!
            </div>
        </div>
    `;
}

function renderFuseTab(nftsByTier) {
    // Find tiers where user has 2+ NFTs (fuse-eligible)
    const eligibleTiers = [];
    for (let t = 0; t <= 2; t++) {
        if (nftsByTier[t].length >= 2) eligibleTiers.push(t);
    }

    if (eligibleTiers.length === 0) {
        fuseSelected = [];
        fuseTierFilter = null;
        return `
            <div class="nft-fusion-empty">
                <i class="fa-solid fa-fire"></i>
                Need 2+ NFTs of the same tier to fuse.<br>
                Buy Bronze NFTs above, then fuse: 2 Bronze &rarr; 1 Silver &rarr; 1 Gold &rarr; 1 Diamond
            </div>
        `;
    }

    // Auto-select tier filter if not set or invalid
    if (fuseTierFilter === null || !eligibleTiers.includes(fuseTierFilter)) {
        fuseTierFilter = eligibleTiers[0];
        fuseSelected = [];
    }

    // Clean up stale selections (NFTs that no longer exist in current tier)
    const currentTierIds = new Set(nftsByTier[fuseTierFilter].map(n => n.tokenId));
    fuseSelected = fuseSelected.filter(id => currentTierIds.has(id));

    // Tier filter buttons
    const filterBtns = [0, 1, 2].map(t => {
        const name = TIER_NAMES_MAP[t];
        const style = getTierStyle(name);
        const count = nftsByTier[t].length;
        const isActive = t === fuseTierFilter;
        const isDisabled = count < 2;
        return `<button class="nft-fusion-filter ${isActive ? 'active' : ''}" data-fuse-filter="${t}" ${isDisabled ? 'disabled' : ''} style="${isActive ? `border-color:${style.color};color:${style.color};background:${style.bg}` : ''}">
            ${style.icon} ${name}<span class="ff-count">(${count})</span>
        </button>`;
    }).join('');

    // NFT grid for selected tier
    const nfts = nftsByTier[fuseTierFilter];
    const tierName = TIER_NAMES_MAP[fuseTierFilter];
    const tierStyle = getTierStyle(tierName);

    const nftCards = nfts.map(nft => {
        const isSelected = fuseSelected.includes(nft.tokenId);
        return `<div class="nft-fusion-nft ${isSelected ? 'selected' : ''}" data-fuse-nft="${nft.tokenId}" style="${isSelected ? `border-color:${tierStyle.color}` : ''}">
            <div class="nft-fusion-nft-check">&check;</div>
            <span class="nft-fusion-nft-icon">${tierStyle.icon}</span>
            <div class="nft-fusion-nft-id" style="color:${tierStyle.color}">#${nft.tokenId}</div>
            <div class="nft-fusion-nft-tier">${tierName}</div>
        </div>`;
    }).join('');

    // Preview (only when 2 selected)
    let previewHtml = '';
    if (fuseSelected.length === 2) {
        const resultTier = fuseTierFilter + 1;
        const resultName = TIER_NAMES_MAP[resultTier];
        const resultStyle = getTierStyle(resultName);

        previewHtml = `
            <div class="nft-fusion-preview">
                <div class="nft-fusion-preview-item">
                    <span class="nft-fusion-preview-icon">${tierStyle.icon}</span>
                    <div class="nft-fusion-preview-label" style="color:${tierStyle.color}">#${fuseSelected[0]}</div>
                </div>
                <span class="nft-fusion-preview-plus">+</span>
                <div class="nft-fusion-preview-item">
                    <span class="nft-fusion-preview-icon">${tierStyle.icon}</span>
                    <div class="nft-fusion-preview-label" style="color:${tierStyle.color}">#${fuseSelected[1]}</div>
                </div>
                <span class="nft-fusion-preview-arrow"><i class="fa-solid fa-arrow-right"></i></span>
                <div class="nft-fusion-preview-result">
                    <span class="nft-fusion-preview-result-icon">${resultStyle.icon}</span>
                    <div class="nft-fusion-preview-result-label" style="color:${resultStyle.color}">${resultName}</div>
                </div>
            </div>
            <div class="nft-fusion-preview-fee" id="fuse-fee-display">Fee: loading...</div>
            <button class="nft-fusion-cta fuse-cta" id="fuse-execute-btn">
                <i class="fa-solid fa-fire"></i> Fuse Now
            </button>
        `;

        // Load fee async
        setTimeout(() => {
            FusionTx.getEstimatedFusionFee(fuseTierFilter).then(fee => {
                const el = document.getElementById('fuse-fee-display');
                if (el) el.textContent = `Fee: ${Number(ethers.formatEther(fee)).toFixed(6)} ETH`;
            }).catch(() => {
                const el = document.getElementById('fuse-fee-display');
                if (el) el.textContent = 'Fee: N/A';
            });
        }, 50);
    }

    const hint = fuseSelected.length === 0
        ? 'Select 2 NFTs to fuse into a higher tier:'
        : fuseSelected.length === 1
            ? 'Select 1 more NFT:'
            : '';

    return `
        <div class="nft-fusion-filters">${filterBtns}</div>
        ${hint ? `<div class="nft-fusion-hint">${hint}</div>` : ''}
        <div class="nft-fusion-grid">${nftCards}</div>
        ${previewHtml}
    `;
}

function renderSplitTab(nftsByTier) {
    // Collect all splittable NFTs (Silver+)
    const splittableNfts = [];
    for (let tier = 1; tier <= 3; tier++) {
        for (const nft of nftsByTier[tier]) {
            splittableNfts.push(nft);
        }
    }

    if (splittableNfts.length === 0) {
        splitSelectedTokenId = null;
        splitTargetTier = null;
        splitConfirmPending = false;
        return `
            <div class="nft-fusion-empty">
                <i class="fa-solid fa-scissors"></i>
                No splittable NFTs (need Silver or higher).<br>
                Fuse 2 Bronze into Silver first, then you can split it back.
            </div>
        `;
    }

    // Validate selection still exists
    if (splitSelectedTokenId !== null && !splittableNfts.find(n => n.tokenId === splitSelectedTokenId)) {
        splitSelectedTokenId = null;
        splitTargetTier = null;
        splitConfirmPending = false;
    }

    // Set default target if selected NFT exists but no target set
    if (splitSelectedTokenId !== null && splitTargetTier === null) {
        const selNft = splittableNfts.find(n => n.tokenId === splitSelectedTokenId);
        if (selNft) splitTargetTier = selNft.tier - 1;
    }

    return `
        <div class="nft-fusion-hint">Select an NFT to split into lower-tier NFTs:</div>
        <div class="nft-fusion-grid" style="${splitSelectedTokenId !== null ? 'margin-bottom:0' : ''}">${splittableNfts.map(nft => {
            const name = TIER_NAMES_MAP[nft.tier];
            const style = getTierStyle(name);
            const isSelected = nft.tokenId === splitSelectedTokenId;
            return `<div class="nft-fusion-nft ${isSelected ? 'selected' : ''}" data-split-nft="${nft.tokenId}" data-split-nft-tier="${nft.tier}" style="${isSelected ? `border-color:${style.color}` : ''}">
                <div class="nft-fusion-nft-check">&check;</div>
                <span class="nft-fusion-nft-icon">${style.icon}</span>
                <div class="nft-fusion-nft-id" style="color:${style.color}">#${nft.tokenId}</div>
                <div class="nft-fusion-nft-tier">${name}</div>
            </div>`;
        }).join('')}</div>
        ${splitSelectedTokenId !== null ? (() => {
            const nft = splittableNfts.find(n => n.tokenId === splitSelectedTokenId);
            if (!nft) return '';
            const name = TIER_NAMES_MAP[nft.tier];
            const style = getTierStyle(name);

            const options = [];
            for (let target = nft.tier - 1; target >= 0; target--) {
                const levels = nft.tier - target;
                const count = 1 << levels;
                const targetName = TIER_NAMES_MAP[target];
                const targetStyle = getTierStyle(targetName);
                const isActive = splitTargetTier === target;
                options.push(`
                    <div class="nft-split-option ${isActive ? 'active' : ''}" data-split-target="${target}" data-split-source="${nft.tier}" data-split-tokenid="${nft.tokenId}">
                        <div class="nft-split-option-left">
                            <div class="nft-split-option-radio"></div>
                            <span class="nft-split-option-label">${count}x ${targetStyle.icon} ${targetName}</span>
                        </div>
                        <span class="nft-split-option-fee" id="split-fee-${nft.tokenId}-${target}">Fee: ...</span>
                    </div>
                `);
            }

            let confirmHtml = '';
            if (splitConfirmPending) {
                const count = 1 << (nft.tier - splitTargetTier);
                const targetName = TIER_NAMES_MAP[splitTargetTier];
                confirmHtml = `
                    <div class="nft-split-confirm">
                        <div class="nft-split-confirm-text">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            Burn ${name} #${nft.tokenId} &rarr; create ${count}x ${targetName}?<br>
                            This action is <strong>irreversible</strong>.
                        </div>
                        <div class="nft-split-confirm-btns">
                            <button class="nft-split-confirm-cancel" id="split-cancel-btn">Cancel</button>
                            <button class="nft-split-confirm-go" id="split-confirm-btn" data-split-tokenid="${nft.tokenId}" data-split-source="${nft.tier}" data-split-target="${splitTargetTier}">
                                <i class="fa-solid fa-scissors"></i> Confirm Split
                            </button>
                        </div>
                    </div>
                `;
            }

            // Load fees async
            setTimeout(() => loadSplitFeesForNft(nft.tokenId, nft.tier), 50);

            return `
                <div class="nft-split-options">
                    <div style="font-size:9px;color:var(--nft-text-3);margin-bottom:6px">
                        <span style="color:${style.color}">${style.icon} ${name} #${nft.tokenId}</span> &mdash; Split into:
                    </div>
                    ${options.join('')}
                    ${!splitConfirmPending ? `
                        <button class="nft-fusion-cta split-cta" id="split-execute-btn" style="margin-top:8px"
                            data-split-tokenid="${nft.tokenId}" data-split-source="${nft.tier}">
                            <i class="fa-solid fa-scissors"></i> Split ${name} #${nft.tokenId}
                        </button>
                    ` : ''}
                    ${confirmHtml}
                </div>
            `;
        })() : ''}
    `;
}

async function loadSplitFeesForNft(tokenId, sourceTier) {
    for (let target = sourceTier - 1; target >= 0; target--) {
        const el = document.getElementById(`split-fee-${tokenId}-${target}`);
        if (!el) continue;
        try {
            const fee = await FusionTx.getEstimatedMultiSplitFee(sourceTier, target);
            el.textContent = `Fee: ${Number(ethers.formatEther(fee)).toFixed(6)} ETH`;
        } catch { el.textContent = 'Fee: N/A'; }
    }
}

// ============================================================================
// INVENTORY
// ============================================================================
function renderInventory() {
    const container = document.getElementById('nft-inv-grid');
    const countEl = document.getElementById('nft-inv-count');
    if (!container) return;

    const boosters = State.myBoosters || [];
    if (countEl) countEl.textContent = boosters.length;

    if (!State.isConnected) {
        container.innerHTML = `<div class="nft-empty" style="grid-column:1/-1"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>`;
        return;
    }

    if (boosters.length === 0) {
        container.innerHTML = `
            <div class="nft-empty" style="grid-column:1/-1">
                <i class="fa-solid fa-gem"></i>
                <p>No NFTs owned</p>
                <p style="font-size:10px;color:var(--nft-text-3);margin-top:4px">Buy from a tier above to reduce your recycle rate</p>
            </div>
        `;
        return;
    }

    const rentalListings = State.rentalListings || [];
    const listedTokenIds = new Set(rentalListings.map(l => l.tokenId?.toString()));
    const now = Math.floor(Date.now() / 1000);

    container.innerHTML = boosters.map(nft => {
        const tier = boosterTiers.find(t => t.boostBips === Number(nft.boostBips));
        const style = getTierStyle(tier?.name);

        const tokenIdStr = nft.tokenId?.toString();
        const listing = rentalListings.find(l => l.tokenId?.toString() === tokenIdStr);
        const isListed = listedTokenIds.has(tokenIdStr);
        const isRented = listing && listing.rentalEndTime && Number(listing.rentalEndTime) > now;

        let statusBadge = '';
        if (isRented) {
            statusBadge = `<div class="nft-inv-status" style="background:rgba(59,130,246,0.8);color:white">Rented</div>`;
        } else if (isListed) {
            statusBadge = `<div class="nft-inv-status" style="background:rgba(74,222,128,0.8);color:#000">Listed</div>`;
        }

        const isAvailable = !isListed && !isRented;

        return `
            <div class="nft-inv-item" style="${!isAvailable ? 'opacity:0.5' : ''}">
                ${statusBadge}
                <div class="nft-inv-img" style="background:${style.bg};border:1px solid ${style.border}">
                    <img src="${style.image}" alt="${tier?.name}" onerror="this.outerHTML='<span style=\\'font-size:24px\\'>${style.icon}</span>'">
                </div>
                <div class="nft-inv-name" style="color:${style.color}">${tier?.name || 'NFT'}</div>
                <div class="nft-inv-id">#${nft.tokenId}</div>
                ${isAvailable ? `<a href="#" class="nft-inv-rent go-to-rental" data-tokenid="${nft.tokenId}">Rent Out</a>` : ''}
            </div>
        `;
    }).join('');
}

// ============================================================================
// TRADE HISTORY
// ============================================================================
async function loadTradeHistory() {
    const container = document.getElementById('nft-hist-list');

    if (!State.userAddress) {
        if (container) container.innerHTML = `<div class="nft-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>`;
        return;
    }

    try {
        const endpoint = API_ENDPOINTS.getHistory || 'https://gethistory-4wvdcuoouq-uc.a.run.app';
        const response = await fetch(`${endpoint}/${State.userAddress}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        tradeHistory = (data || []).filter(item => {
            const t = (item.type || '').toUpperCase();
            return t === 'NFTBOUGHT' || t === 'NFTSOLD' || t === 'NFT_BOUGHT' || t === 'NFT_SOLD' ||
                   t === 'NFTPURCHASED' || t === 'NFT_PURCHASED' ||
                   t.includes('NFTBOUGHT') || t.includes('NFTSOLD') || t.includes('NFTPURCHASED');
        });

        const countEl = document.getElementById('nft-hist-count');
        if (countEl) countEl.textContent = tradeHistory.length;

        renderTradeHistory();
    } catch (e) {
        console.error('History load error:', e);
        tradeHistory = [];
        renderTradeHistory();
    }
}

function renderTradeHistory() {
    const container = document.getElementById('nft-hist-list');
    if (!container) return;

    if (!State.isConnected) {
        container.innerHTML = `<div class="nft-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>`;
        return;
    }

    if (tradeHistory.length === 0) {
        container.innerHTML = `
            <div class="nft-empty">
                <i class="fa-solid fa-receipt"></i>
                <p>No NFT trades yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tradeHistory.slice(0, 20).map(item => {
        const t = (item.type || '').toUpperCase();
        const details = item.details || {};
        const dateStr = formatDate(item.timestamp || item.createdAt);
        const isBuy = t.includes('BOUGHT') || t.includes('PURCHASED');

        const icon = isBuy ? 'fa-cart-plus' : 'fa-money-bill-transfer';
        const iconColor = isBuy ? '#22c55e' : '#f59e0b';
        const iconBg = isBuy ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)';
        const label = isBuy ? 'Bought NFT' : 'Sold NFT';

        const txLink = item.txHash ? `${EXPLORER_TX}${item.txHash}` : '#';

        let amountDisplay = '';
        try {
            const rawAmount = item.amount || details.amount || details.price || details.payout || "0";
            if (typeof rawAmount === 'string' && rawAmount !== "0") {
                const amountNum = formatBigNumber(BigInt(rawAmount));
                if (amountNum > 0.001) amountDisplay = amountNum.toFixed(2);
            }
        } catch {}

        const tokenId = details.tokenId || '';
        const boostBips = details.boostBips || details.boost || '';

        return `
            <a href="${txLink}" target="_blank" class="nft-hist-item">
                <div class="nft-hist-icon" style="background:${iconBg}">
                    <i class="fa-solid ${icon}" style="color:${iconColor}"></i>
                </div>
                <div class="nft-hist-info">
                    <div class="nft-hist-label">
                        ${label}
                        ${tokenId ? `<span style="font-size:9px;color:var(--nft-accent);font-family:monospace;margin-left:4px">#${tokenId}</span>` : ''}
                        ${boostBips ? `<span style="font-size:8px;color:var(--nft-purple);margin-left:4px">+${Number(boostBips)/100}%</span>` : ''}
                    </div>
                    <div class="nft-hist-date">${dateStr}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    ${amountDisplay ? `<span class="nft-hist-amount" style="color:${isBuy ? 'var(--nft-text)' : 'var(--nft-green)'}">${isBuy ? '-' : '+'}${amountDisplay} <span style="font-size:9px;color:var(--nft-text-3)">BKC</span></span>` : ''}
                    <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:8px;color:var(--nft-text-3)"></i>
                </div>
            </a>
        `;
    }).join('');
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
    const container = document.getElementById('store');
    if (!container) return;

    container.addEventListener('click', async (e) => {
        // Refresh
        if (e.target.closest('#nft-refresh-btn')) {
            const btn = e.target.closest('#nft-refresh-btn');
            const icon = btn.querySelector('i');
            icon.classList.add('fa-spin');
            invalidateAllPoolCaches();
            await Promise.all([loadMyBoostersFromAPI(true), loadRentalListings()]);
            await loadAllData();
            icon.classList.remove('fa-spin');
            return;
        }

        // Inventory toggle
        if (e.target.closest('#nft-inv-toggle')) {
            const body = document.getElementById('nft-inv-body');
            const chevron = document.getElementById('nft-inv-chevron');
            if (body && chevron) {
                const isHidden = body.style.display === 'none';
                body.style.display = isHidden ? '' : 'none';
                chevron.style.transform = isHidden ? 'rotate(180deg)' : '';
            }
            return;
        }

        // History toggle
        if (e.target.closest('#nft-hist-toggle')) {
            const body = document.getElementById('nft-hist-body');
            const chevron = document.getElementById('nft-hist-chevron');
            if (body && chevron) {
                const isHidden = body.style.display === 'none';
                body.style.display = isHidden ? '' : 'none';
                chevron.style.transform = isHidden ? 'rotate(180deg)' : '';
            }
            return;
        }

        // Fusion tab switch
        const fusionTab = e.target.closest('.nft-fusion-tab');
        if (fusionTab) {
            fusionActiveTab = fusionTab.dataset.fusionTab;
            fuseSelected = [];
            fuseTierFilter = null;
            splitSelectedTokenId = null;
            splitTargetTier = null;
            splitConfirmPending = false;
            renderFusionSection();
            return;
        }

        // Fuse tier filter
        const fuseFilter = e.target.closest('.nft-fusion-filter');
        if (fuseFilter && !fuseFilter.disabled) {
            fuseTierFilter = Number(fuseFilter.dataset.fuseFilter);
            fuseSelected = [];
            renderFusionSection();
            return;
        }

        // Fuse NFT selection
        const fuseNftEl = e.target.closest('[data-fuse-nft]');
        if (fuseNftEl && fusionActiveTab === 'fuse') {
            const tokenId = Number(fuseNftEl.dataset.fuseNft);
            const idx = fuseSelected.indexOf(tokenId);
            if (idx >= 0) {
                fuseSelected.splice(idx, 1);
            } else if (fuseSelected.length < 2) {
                fuseSelected.push(tokenId);
            }
            renderFusionSection();
            return;
        }

        // Fuse execute button
        const fuseExecBtn = e.target.closest('#fuse-execute-btn');
        if (fuseExecBtn && !fuseExecBtn.disabled && !isTransactionInProgress && fuseSelected.length === 2) {
            e.preventDefault();
            const t1 = fuseSelected[0];
            const t2 = fuseSelected[1];

            isTransactionInProgress = true;
            try {
                await FusionTx.fuseNfts({
                    tokenId1: t1,
                    tokenId2: t2,
                    button: fuseExecBtn,
                    onSuccess: async ({ newTokenId, resultTier }) => {
                        const tierName = TIER_NAMES_MAP[resultTier] || 'NFT';
                        showToast(`Fused into ${tierName} #${newTokenId}!`, "success");
                        fuseSelected = [];
                        invalidateAllPoolCaches();
                        await Promise.all([loadMyBoostersFromAPI(true), loadAllPoolsData()]);
                        renderTierCards(); renderInventory(); renderImpactPreview(); renderFusionSection();
                    },
                    onError: (error) => {
                        if (!error.cancelled && error.type !== 'user_rejected') {
                            showToast("Fuse failed: " + (error.message || 'Unknown'), "error");
                        }
                    }
                });
            } finally { isTransactionInProgress = false; }
            return;
        }

        // Split NFT selection
        const splitNftEl = e.target.closest('[data-split-nft]');
        if (splitNftEl && fusionActiveTab === 'split' && !e.target.closest('.nft-split-options')) {
            const tokenId = Number(splitNftEl.dataset.splitNft);
            if (splitSelectedTokenId === tokenId) {
                splitSelectedTokenId = null;
                splitTargetTier = null;
                splitConfirmPending = false;
            } else {
                splitSelectedTokenId = tokenId;
                const tier = Number(splitNftEl.dataset.splitNftTier);
                splitTargetTier = tier - 1;
                splitConfirmPending = false;
            }
            renderFusionSection();
            return;
        }

        // Split target option click
        const splitOption = e.target.closest('.nft-split-option');
        if (splitOption) {
            splitTargetTier = Number(splitOption.dataset.splitTarget);
            splitConfirmPending = false;
            renderFusionSection();
            return;
        }

        // Split execute button (shows confirmation)
        const splitExecBtn = e.target.closest('#split-execute-btn');
        if (splitExecBtn && !splitExecBtn.disabled && !isTransactionInProgress) {
            e.preventDefault();
            splitConfirmPending = true;
            renderFusionSection();
            return;
        }

        // Split cancel confirmation
        const splitCancelBtn = e.target.closest('#split-cancel-btn');
        if (splitCancelBtn) {
            splitConfirmPending = false;
            renderFusionSection();
            return;
        }

        // Split confirm (actual transaction)
        const splitConfirmBtn = e.target.closest('#split-confirm-btn');
        if (splitConfirmBtn && !splitConfirmBtn.disabled && !isTransactionInProgress) {
            e.preventDefault();
            const tokenId = Number(splitConfirmBtn.dataset.splitTokenid);
            const sourceTier = Number(splitConfirmBtn.dataset.splitSource);
            const targetTier = Number(splitConfirmBtn.dataset.splitTarget);
            const levels = sourceTier - targetTier;

            isTransactionInProgress = true;
            try {
                const txFn = levels === 1 ? FusionTx.splitNft : FusionTx.splitNftTo;
                const txParams = levels === 1
                    ? { tokenId, button: splitConfirmBtn }
                    : { tokenId, targetTier, button: splitConfirmBtn };

                await txFn({
                    ...txParams,
                    onSuccess: async ({ newTokenIds, targetTier: tt }) => {
                        const tierName = TIER_NAMES_MAP[tt] || 'NFT';
                        showToast(`Split into ${newTokenIds.length}x ${tierName}!`, "success");
                        splitSelectedTokenId = null;
                        splitTargetTier = null;
                        splitConfirmPending = false;
                        invalidateAllPoolCaches();
                        await Promise.all([loadMyBoostersFromAPI(true), loadAllPoolsData()]);
                        renderTierCards(); renderInventory(); renderImpactPreview(); renderFusionSection();
                    },
                    onError: (error) => {
                        splitConfirmPending = false;
                        renderFusionSection();
                        if (!error.cancelled && error.type !== 'user_rejected') {
                            showToast("Split failed: " + (error.message || 'Unknown'), "error");
                        }
                    }
                });
            } finally { isTransactionInProgress = false; }
            return;
        }

        // Navigation
        if (e.target.closest('.go-to-tutor')) { e.preventDefault(); window.navigateTo('referral'); return; }
        if (e.target.closest('.go-to-rental')) { e.preventDefault(); window.navigateTo('rental'); return; }
        if (e.target.closest('.go-to-diamond')) { e.preventDefault(); return; } // Already on page
        if (e.target.closest('.go-to-staking')) { e.preventDefault(); window.navigateTo('staking'); return; }

        // Buy / Sell buttons on tier cards
        const actionBtn = e.target.closest('.nft-action-btn');
        if (actionBtn && !actionBtn.disabled) {
            e.preventDefault();
            e.stopPropagation();
            if (isTransactionInProgress) return;

            const action = actionBtn.dataset.action;
            const boostBips = Number(actionBtn.dataset.boost);

            if (!State.isConnected) {
                window.openConnectModal();
                return;
            }

            const tier = boosterTiers.find(t => t.boostBips === boostBips);
            if (!tier) return;

            const data = poolDataMap.get(boostBips);
            if (!data || data.unavailable) return;

            const poolAddress = data.poolAddress;
            if (!poolAddress) {
                showToast("Pool address not found", "error");
                return;
            }

            isTransactionInProgress = true;

            try {
                if (action === 'buy') {
                    await NftTx.buyFromPool({
                        poolAddress,
                        button: actionBtn,
                        onSuccess: async () => {
                            showToast(`${tier.name} NFT purchased!`, "success");
                            invalidateAllPoolCaches();
                            await Promise.all([loadMyBoostersFromAPI(true), loadAllPoolsData()]);
                            renderTierCards();
                            renderInventory();
                            renderImpactPreview();
                            renderFusionSection();
                            loadTradeHistory();
                        },
                        onError: (error) => {
                            if (!error.cancelled && error.type !== 'user_rejected') {
                                showToast("Buy failed: " + (error.message || error.reason || 'Unknown'), "error");
                            }
                        }
                    });
                } else {
                    // Sell
                    const tokenId = data.firstSellableTokenId;
                    if (!tokenId) {
                        showToast("No NFT available to sell", "error");
                        isTransactionInProgress = false;
                        return;
                    }

                    await NftTx.sellToPool({
                        poolAddress,
                        tokenId,
                        button: actionBtn,
                        onSuccess: async () => {
                            showToast(`${tier.name} NFT sold!`, "success");
                            invalidateAllPoolCaches();
                            await Promise.all([loadMyBoostersFromAPI(true), loadAllPoolsData()]);
                            renderTierCards();
                            renderInventory();
                            renderImpactPreview();
                            renderFusionSection();
                            loadTradeHistory();
                        },
                        onError: (error) => {
                            if (!error.cancelled && error.type !== 'user_rejected') {
                                showToast("Sell failed: " + (error.message || error.reason || 'Unknown'), "error");
                            }
                        }
                    });
                }
            } finally {
                isTransactionInProgress = false;
            }
        }
    });

    // (Split target selection is now handled via click handlers above)
}
