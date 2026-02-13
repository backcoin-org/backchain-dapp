// pages/StorePage.js
// ✅ PRODUCTION V14.0 — Card-Based NFT Marketplace + Tutor + Fusion/Split
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
import { showToast } from '../ui-feedback.js';
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

        /* Fusion Section */
        .nft-fusion-card { background: var(--nft-surface); border: 1px solid var(--nft-border); border-radius: var(--nft-radius); margin-bottom: 12px; overflow: hidden; animation: nft-scaleIn 0.3s ease-out; }
        .nft-fusion-tabs { display: flex; border-bottom: 1px solid var(--nft-border); }
        .nft-fusion-tab {
            flex: 1; padding: 10px 16px; font-size: 11px; font-weight: 700;
            color: var(--nft-text-3); text-align: center; cursor: pointer;
            border-bottom: 2px solid transparent; transition: all var(--nft-tr);
            background: none; border-top: none; border-left: none; border-right: none;
        }
        .nft-fusion-tab:hover { color: var(--nft-text-2); }
        .nft-fusion-tab.active { color: var(--nft-accent); border-bottom-color: var(--nft-accent); }
        .nft-fusion-body { padding: 12px; }
        .nft-fusion-row {
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            padding: 10px 12px; background: var(--nft-surface-2); border: 1px solid var(--nft-border);
            border-radius: var(--nft-radius-sm); margin-bottom: 6px; transition: all var(--nft-tr);
        }
        .nft-fusion-row:hover { border-color: var(--nft-border-h); }
        .nft-fusion-info { flex: 1; min-width: 0; }
        .nft-fusion-label { font-size: 11px; font-weight: 700; color: var(--nft-text); margin-bottom: 2px; }
        .nft-fusion-desc { font-size: 9px; color: var(--nft-text-3); }
        .nft-fusion-fee { font-size: 9px; color: var(--nft-text-2); white-space: nowrap; margin-right: 8px; }
        .nft-fusion-btn {
            padding: 6px 14px; border-radius: 8px; font-size: 10px; font-weight: 800;
            border: none; cursor: pointer; transition: all var(--nft-tr); white-space: nowrap;
        }
        .nft-fusion-btn.fuse { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; }
        .nft-fusion-btn.fuse:hover { transform: scale(1.05); }
        .nft-fusion-btn.split { background: linear-gradient(135deg, #a78bfa, #7c3aed); color: #fff; }
        .nft-fusion-btn.split:hover { transform: scale(1.05); }
        .nft-fusion-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }
        .nft-fusion-empty { text-align: center; padding: 20px; color: var(--nft-text-3); font-size: 11px; }
        .nft-fusion-empty i { font-size: 20px; margin-bottom: 6px; display: block; opacity: 0.3; }
        .nft-split-select {
            padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;
            background: var(--nft-surface-3); color: var(--nft-text); border: 1px solid var(--nft-border);
            cursor: pointer; margin-right: 6px;
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
                                <div class="nft-header-title">NFT Market</div>
                                <div class="nft-header-sub">Buy NFTs to keep more staking rewards. NFT + Tutor = max earnings</div>
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
        const sellPriceStr = netSell > 0n ? formatBigNumber(netSell).toFixed(1) : '--';

        // Buy button state
        let buyDisabled = !State.isConnected || soldOut || insufficientBuy || buyPrice === 0n;
        let buyLabel = soldOut ? 'Sold Out' : (insufficientBuy ? 'Low BKC' : 'Buy');
        if (!State.isConnected) buyLabel = 'Connect';

        // Sell button state
        let sellDisabled = !State.isConnected || noSellable;
        let sellLabel = noSellable ? (userOwned > 0 ? 'Rented' : 'No NFT') : 'Sell';
        if (!State.isConnected) sellLabel = '--';

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
                        <span class="nft-price-val" style="color:var(--nft-text)">${buyPriceStr} BKC</span>
                    </div>
                    <div class="nft-price-row">
                        <span class="nft-price-label"><i class="fa-solid fa-money-bill-transfer" style="color:var(--nft-accent)"></i> Sell</span>
                        <span class="nft-price-val" style="color:var(--nft-text)">${sellPriceStr} BKC</span>
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
                    <button class="nft-action-btn nft-buy-btn" data-action="buy" data-boost="${tier.boostBips}" ${buyDisabled ? 'disabled' : ''}>
                        <i class="fa-solid fa-cart-plus" style="font-size:10px"></i> ${buyLabel}
                    </button>
                    <button class="nft-action-btn nft-sell-btn" data-action="sell" data-boost="${tier.boostBips}" ${sellDisabled ? 'disabled' : ''}>
                        <i class="fa-solid fa-money-bill-transfer" style="font-size:10px"></i> ${sellLabel}
                    </button>
                </div>
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
// FUSION & SPLIT SECTION
// ============================================================================
let fusionActiveTab = 'fuse'; // 'fuse' | 'split'

function renderFusionSection() {
    const container = document.getElementById('nft-fusion-section');
    if (!container) return;

    if (!State.isConnected) {
        container.innerHTML = '';
        return;
    }

    const boosters = State.myBoosters || [];
    if (boosters.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Group NFTs by tier (0=Bronze, 1=Silver, 2=Gold, 3=Diamond)
    const rentalListings = State.rentalListings || [];
    const now = Math.floor(Date.now() / 1000);
    const nftsByTier = { 0: [], 1: [], 2: [], 3: [] };

    for (const nft of boosters) {
        const boost = Number(nft.boostBips);
        let tier = 0;
        if (boost >= 5000) tier = 3;
        else if (boost >= 4000) tier = 2;
        else if (boost >= 2500) tier = 1;

        // Skip rented/listed NFTs
        const listing = rentalListings.find(l => l.tokenId?.toString() === nft.tokenId?.toString());
        const isRented = listing && listing.rentalEndTime && Number(listing.rentalEndTime) > now;
        const isListed = listing && !isRented;
        if (isRented || isListed) continue;

        nftsByTier[tier].push({ tokenId: Number(nft.tokenId), tier, boost });
    }

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
                ${fusionActiveTab === 'fuse' ? renderFuseTab(nftsByTier) : renderSplitTab(nftsByTier)}
            </div>
        </div>
    `;
}

function renderFuseTab(nftsByTier) {
    // Show tiers where user has 2+ available NFTs (Bronze→Silver, Silver→Gold, Gold→Diamond)
    const fuseRows = [];

    for (let tier = 0; tier <= 2; tier++) {
        const nfts = nftsByTier[tier];
        if (nfts.length < 2) continue;

        const sourceName = TIER_NAMES_MAP[tier];
        const resultName = TIER_NAMES_MAP[tier + 1];
        const sourceStyle = getTierStyle(sourceName);
        const resultStyle = getTierStyle(resultName);

        // Pick first 2 available NFTs
        const t1 = nfts[0].tokenId;
        const t2 = nfts[1].tokenId;

        fuseRows.push(`
            <div class="nft-fusion-row">
                <div class="nft-fusion-info">
                    <div class="nft-fusion-label">
                        2x <span style="color:${sourceStyle.color}">${sourceStyle.icon} ${sourceName}</span>
                        &rarr; 1x <span style="color:${resultStyle.color}">${resultStyle.icon} ${resultName}</span>
                    </div>
                    <div class="nft-fusion-desc">Burn #${t1} + #${t2} &rarr; mint 1 ${resultName} (${nfts.length} available)</div>
                </div>
                <span class="nft-fusion-fee" id="fuse-fee-${tier}">Fee: ...</span>
                <button class="nft-fusion-btn fuse" data-fuse-tier="${tier}" data-fuse-t1="${t1}" data-fuse-t2="${t2}">
                    Fuse
                </button>
            </div>
        `);
    }

    if (fuseRows.length === 0) {
        return `
            <div class="nft-fusion-empty">
                <i class="fa-solid fa-fire"></i>
                Need 2+ NFTs of the same tier to fuse.<br>
                Buy Bronze NFTs above, then fuse: 2 Bronze &rarr; 1 Silver &rarr; 1 Gold &rarr; 1 Diamond
            </div>
        `;
    }

    // Load fees async
    setTimeout(() => loadFuseFees(), 50);
    return fuseRows.join('');
}

function renderSplitTab(nftsByTier) {
    // Show NFTs above Bronze that can be split
    const splitRows = [];

    for (let tier = 1; tier <= 3; tier++) {
        const nfts = nftsByTier[tier];
        if (nfts.length === 0) continue;

        const sourceName = TIER_NAMES_MAP[tier];
        const sourceStyle = getTierStyle(sourceName);

        for (const nft of nfts) {
            // Build target tier options
            const options = [];
            for (let target = tier - 1; target >= 0; target--) {
                const levels = tier - target;
                const count = 1 << levels;
                const targetName = TIER_NAMES_MAP[target];
                options.push(`<option value="${target}">${count}x ${targetName}</option>`);
            }

            splitRows.push(`
                <div class="nft-fusion-row">
                    <div class="nft-fusion-info">
                        <div class="nft-fusion-label">
                            <span style="color:${sourceStyle.color}">${sourceStyle.icon} ${sourceName} #${nft.tokenId}</span>
                        </div>
                        <div class="nft-fusion-desc">Split into lower-tier NFTs</div>
                    </div>
                    <select class="nft-split-select" data-split-tokenid="${nft.tokenId}" data-split-source="${tier}">
                        ${options.join('')}
                    </select>
                    <span class="nft-fusion-fee" id="split-fee-${nft.tokenId}">Fee: ...</span>
                    <button class="nft-fusion-btn split" data-split-tokenid="${nft.tokenId}" data-split-source="${tier}">
                        Split
                    </button>
                </div>
            `);
        }
    }

    if (splitRows.length === 0) {
        return `
            <div class="nft-fusion-empty">
                <i class="fa-solid fa-scissors"></i>
                No splittable NFTs (need Silver or higher).<br>
                Fuse 2 Bronze into Silver first, then you can split it back.
            </div>
        `;
    }

    setTimeout(() => loadSplitFees(), 50);
    return splitRows.join('');
}

const TIER_NAMES_MAP = { 0: 'Bronze', 1: 'Silver', 2: 'Gold', 3: 'Diamond' };

async function loadFuseFees() {
    const ethers = window.ethers;
    for (let tier = 0; tier <= 2; tier++) {
        const el = document.getElementById(`fuse-fee-${tier}`);
        if (!el) continue;
        try {
            const fee = await FusionTx.getEstimatedFusionFee(tier);
            el.textContent = `Fee: ${Number(ethers.formatEther(fee)).toFixed(6)} ETH`;
        } catch { el.textContent = 'Fee: N/A'; }
    }
}

async function loadSplitFees() {
    const ethers = window.ethers;
    const selects = document.querySelectorAll('.nft-split-select');
    for (const select of selects) {
        const tokenId = select.dataset.splitTokenid;
        const sourceTier = Number(select.dataset.splitSource);
        const targetTier = Number(select.value);
        const el = document.getElementById(`split-fee-${tokenId}`);
        if (!el) continue;
        try {
            const fee = await FusionTx.getEstimatedMultiSplitFee(sourceTier, targetTier);
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
            renderFusionSection();
            return;
        }

        // Fuse button
        const fuseBtn = e.target.closest('.nft-fusion-btn.fuse');
        if (fuseBtn && !fuseBtn.disabled && !isTransactionInProgress) {
            e.preventDefault();
            const t1 = Number(fuseBtn.dataset.fuseT1);
            const t2 = Number(fuseBtn.dataset.fuseT2);

            isTransactionInProgress = true;
            try {
                await FusionTx.fuseNfts({
                    tokenId1: t1,
                    tokenId2: t2,
                    button: fuseBtn,
                    onSuccess: async ({ newTokenId, resultTier }) => {
                        const tierName = TIER_NAMES_MAP[resultTier] || 'NFT';
                        showToast(`Fused into ${tierName} #${newTokenId}!`, "success");
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

        // Split button
        const splitBtn = e.target.closest('.nft-fusion-btn.split');
        if (splitBtn && !splitBtn.disabled && !isTransactionInProgress) {
            e.preventDefault();
            const tokenId = Number(splitBtn.dataset.splitTokenid);
            const sourceTier = Number(splitBtn.dataset.splitSource);

            // Find target tier from the dropdown
            const row = splitBtn.closest('.nft-fusion-row');
            const select = row?.querySelector('.nft-split-select');
            const targetTier = select ? Number(select.value) : sourceTier - 1;
            const levels = sourceTier - targetTier;

            isTransactionInProgress = true;
            try {
                if (levels === 1) {
                    await FusionTx.splitNft({
                        tokenId,
                        button: splitBtn,
                        onSuccess: async ({ newTokenIds, targetTier: tt }) => {
                            const tierName = TIER_NAMES_MAP[tt] || 'NFT';
                            showToast(`Split into 2x ${tierName}!`, "success");
                            invalidateAllPoolCaches();
                            await Promise.all([loadMyBoostersFromAPI(true), loadAllPoolsData()]);
                            renderTierCards(); renderInventory(); renderImpactPreview(); renderFusionSection();
                        },
                        onError: (error) => {
                            if (!error.cancelled && error.type !== 'user_rejected') {
                                showToast("Split failed: " + (error.message || 'Unknown'), "error");
                            }
                        }
                    });
                } else {
                    await FusionTx.splitNftTo({
                        tokenId,
                        targetTier,
                        button: splitBtn,
                        onSuccess: async ({ newTokenIds, targetTier: tt }) => {
                            const tierName = TIER_NAMES_MAP[tt] || 'NFT';
                            showToast(`Split into ${newTokenIds.length}x ${tierName}!`, "success");
                            invalidateAllPoolCaches();
                            await Promise.all([loadMyBoostersFromAPI(true), loadAllPoolsData()]);
                            renderTierCards(); renderInventory(); renderImpactPreview(); renderFusionSection();
                        },
                        onError: (error) => {
                            if (!error.cancelled && error.type !== 'user_rejected') {
                                showToast("Split failed: " + (error.message || 'Unknown'), "error");
                            }
                        }
                    });
                }
            } finally { isTransactionInProgress = false; }
            return;
        }

        // Navigation
        if (e.target.closest('.go-to-tutor')) { e.preventDefault(); window.navigateTo('referral'); return; }
        if (e.target.closest('.go-to-rental')) { e.preventDefault(); window.navigateTo('rental'); return; }
        if (e.target.closest('.go-to-diamond')) { e.preventDefault(); return; } // Already on page
        if (e.target.closest('.go-to-staking')) { e.preventDefault(); window.navigateTo('mine'); return; }

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
                // Delayed refresh as safety net
                setTimeout(async () => {
                    try {
                        invalidateAllPoolCaches();
                        await Promise.all([loadMyBoostersFromAPI(true), loadAllPoolsData()]);
                        renderTierCards();
                        renderInventory();
                        renderImpactPreview();
                        renderFusionSection();
                        loadTradeHistory();
                    } catch (err) {
                        console.warn('[NFT Market] Post-tx refresh failed:', err.message);
                    }
                }, 2000);
            }
        }
    });

    // Split target tier change → update fee estimate
    container.addEventListener('change', async (e) => {
        const select = e.target.closest('.nft-split-select');
        if (!select) return;
        const tokenId = select.dataset.splitTokenid;
        const sourceTier = Number(select.dataset.splitSource);
        const targetTier = Number(select.value);
        const feeEl = document.getElementById(`split-fee-${tokenId}`);
        if (!feeEl) return;
        try {
            feeEl.textContent = 'Fee: ...';
            const fee = await FusionTx.getEstimatedMultiSplitFee(sourceTier, targetTier);
            feeEl.textContent = `Fee: ${Number(ethers.formatEther(fee)).toFixed(6)} ETH`;
        } catch { feeEl.textContent = 'Fee: N/A'; }
    });
}
