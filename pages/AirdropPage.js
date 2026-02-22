// pages/AirdropPage.js
// ✅ VERSION V6.0: Flat layout redesign — 2 tabs, no sub-tabs, all sections visible

import { State } from '../state.js';
import * as db from '../modules/firebase-auth-service.js';
import { showToast, closeModal, openModal } from '../ui-feedback.js';
import { formatAddress, renderNoData, formatBigNumber, renderLoading, renderError } from '../utils.js';
import { NetworkManager } from '../modules/core/index.js';
import { addresses, contractAddresses, agoraABI } from '../config.js';
import { AirdropClaimTx } from '../modules/transactions/airdrop-claim-tx.js';

// ==========================================================
//  1. CONSTANTES E HELPERS
// ==========================================================

const DEFAULT_HASHTAGS = "#BKC #Backcoin #Airdrop";
const AUTO_APPROVE_HOURS = 2;

const AUDIT_MESSAGES = [
    "🔍 Your post is under security audit...",
    "🛡️ Verifying post authenticity...",
    "📋 Checking compliance with guidelines...",
    "🔐 Security review in progress...",
    "⏳ Audit team analyzing your submission..."
];

function getRandomAuditMessage() {
    return AUDIT_MESSAGES[Math.floor(Math.random() * AUDIT_MESSAGES.length)];
}

// Platform Usage Config (valores padrão - sobrescritos pelo Firebase)
const DEFAULT_PLATFORM_USAGE_CONFIG = {
    agoraProfile:{ icon: '👤', label: 'Create Profile', points: 3000,  maxCount: 1,  cooldownHours: 0,  enabled: true },
    agoraPost:   { icon: '✍️', label: 'Post on Agora',  points: 2000,  maxCount: 20, cooldownHours: 0,  enabled: true },
    agoraLike:   { icon: '❤️', label: 'Like a Post',    points: 500,   maxCount: 20, cooldownHours: 0,  enabled: true },
    faucet:      { icon: '🚰', label: 'Claim Faucet',    points: 1000,  maxCount: 1,  cooldownHours: 0,  enabled: true },
    delegation:  { icon: '📊', label: 'Delegate BKC',   points: 2000,  maxCount: 10, cooldownHours: 24, enabled: true },
    fortune:     { icon: '🎰', label: 'Play Fortune',   points: 1500,  maxCount: 10, cooldownHours: 1,  enabled: true },
    buyNFT:      { icon: '🛒', label: 'Buy NFT',        points: 2500,  maxCount: 10, cooldownHours: 0,  enabled: true },
    sellNFT:     { icon: '💰', label: 'Sell NFT',       points: 1500,  maxCount: 10, cooldownHours: 0,  enabled: true },
    listRental:  { icon: '🏷️', label: 'List for Rent',  points: 1000,  maxCount: 10, cooldownHours: 0,  enabled: true },
    rentNFT:     { icon: '⏰', label: 'Rent NFT',       points: 2000,  maxCount: 10, cooldownHours: 0,  enabled: true },
    notarize:    { icon: '📜', label: 'Notarize Doc',   points: 2000,  maxCount: 10, cooldownHours: 0,  enabled: true },
    claimReward: { icon: '💸', label: 'Claim Rewards',  points: 1000,  maxCount: 10, cooldownHours: 24, enabled: true },
    unstake:     { icon: '↩️', label: 'Unstake',        points: 500,   maxCount: 10, cooldownHours: 0,  enabled: true },
};

const PLATFORM_ACTION_PAGES = {
    agoraProfile:'agora',
    agoraPost:   'agora',
    agoraLike:   'agora',
    faucet:      'faucet',
    delegation:  'tokenomics',
    fortune:     'fortune',
    buyNFT:      'marketplace',
    sellNFT:     'marketplace',
    listRental:  'rentals',
    rentNFT:     'rentals',
    notarize:    'notary',
    claimReward: 'tokenomics',
    unstake:     'tokenomics',
};

const NFT_TIERS = [
    { name: 'Diamond', icon: '💎', ranks: '#1 – #5',     count: 5,   color: 'cyan',   burn: '0%',  receive: '100%', gradient: 'from-cyan-500/20 to-cyan-900/10',  border: 'border-cyan-500/30',  text: 'text-cyan-300',   postsNeeded: 0 },
    { name: 'Gold',    icon: '🥇', ranks: '#6 – #25',    count: 20,  color: 'yellow', burn: '10%', receive: '90%',  gradient: 'from-yellow-500/20 to-yellow-900/10', border: 'border-yellow-500/30', text: 'text-yellow-400', postsNeeded: 0 },
    { name: 'Silver',  icon: '🥈', ranks: '#26 – #75',   count: 50,  color: 'gray',   burn: '25%', receive: '75%',  gradient: 'from-gray-400/20 to-gray-800/10',  border: 'border-gray-400/30',  text: 'text-gray-300',   postsNeeded: 0 },
    { name: 'Bronze',  icon: '🥉', ranks: '#76 – #200',  count: 125, color: 'amber',  burn: '40%', receive: '60%',  gradient: 'from-amber-600/20 to-amber-900/10', border: 'border-amber-600/30', text: 'text-amber-500',  postsNeeded: 0 },
];

const TOTAL_NFTS = 200;

// Tier rank boundaries
const TIER_BOUNDARIES = [5, 25, 75, 200];

function formatTimeLeft(ms) {
    if (!ms || ms <= 0) return 'Ready';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function getMultiplierByTier(approvedCount) {
    if (approvedCount >= 100) return 10.0;
    if (approvedCount >= 90) return 9.0;
    if (approvedCount >= 80) return 8.0;
    if (approvedCount >= 70) return 7.0;
    if (approvedCount >= 60) return 6.0;
    if (approvedCount >= 50) return 5.0;
    if (approvedCount >= 40) return 4.0;
    if (approvedCount >= 30) return 3.0;
    if (approvedCount >= 20) return 2.0;
    return 1.0;
}

// --- State ---
let airdropState = {
    isConnected: false,
    systemConfig: null,
    platformUsageConfig: null,
    basePoints: null,
    leaderboards: null,
    user: null,
    dailyTasks: [],
    userSubmissions: [],
    platformUsage: {},
    isBanned: false,
    activeTab: 'earn',
    activeRanking: 'posts',
    historyExpanded: false,
    // Agora integration
    agoraHasProfile: false,
    agoraUsername: null,
    agoraPosts: [],
    // On-chain claim
    claimInfo: null,     // { claimed, claimFee, lockDays, phase, isActive, availableBalance, ... }
    claimProof: null,    // { amount, proof } from merkle tree
    claimLoading: false
};

// ==========================================================
//  2. STYLES INJECTION
// ==========================================================

function injectAirdropStyles() {
    if (document.getElementById('airdrop-custom-styles')) return;

    const style = document.createElement('style');
    style.id = 'airdrop-custom-styles';
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(3deg); }
        }

        @keyframes float-slow {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-8px) scale(1.02); }
        }

        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.2); }
            50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.4); }
        }

        @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        @keyframes fade-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }

        @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        @keyframes slide-in {
            from { opacity: 0; transform: translateX(-12px); }
            to { opacity: 1; transform: translateX(0); }
        }

        @keyframes count-up {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
        }

        @keyframes glow-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
        }

        .airdrop-float { animation: float 4s ease-in-out infinite; }
        .airdrop-float-slow { animation: float-slow 3s ease-in-out infinite; }
        .airdrop-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .airdrop-bounce { animation: bounce-gentle 2s ease-in-out infinite; }
        .airdrop-spin { animation: spin-slow 20s linear infinite; }
        .airdrop-fade-up { animation: fade-up 0.5s ease-out forwards; }
        .airdrop-pulse-ring { animation: pulse-ring 2s infinite; }
        .airdrop-slide-in { animation: slide-in 0.4s ease-out forwards; }
        .airdrop-glow { animation: glow-pulse 2s ease-in-out infinite; }

        .airdrop-shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
            background-size: 200% 100%;
            animation: shimmer 2.5s infinite;
        }

        .airdrop-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .airdrop-card:hover {
            transform: translateY(-3px);
        }

        .airdrop-tab-active {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            font-weight: 700;
        }

        .airdrop-gradient-text {
            background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .social-btn {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .social-btn:hover {
            transform: scale(1.08);
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .social-btn:active {
            transform: scale(0.95);
        }

        .cta-mega {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
            box-shadow: 0 8px 30px rgba(245, 158, 11, 0.25);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cta-mega:hover {
            box-shadow: 0 12px 40px rgba(245, 158, 11, 0.35);
            transform: translateY(-2px);
        }

        .platform-action-card { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .platform-action-card:hover:not(.completed) { transform: translateY(-3px); border-color: #f59e0b; box-shadow: 0 8px 25px rgba(0,0,0,0.2); }
        .platform-action-card.completed { opacity: 0.5; cursor: default; }

        .progress-bar-bg { background: rgba(63, 63, 70, 0.5); }
        .progress-bar-fill {
            background: linear-gradient(90deg, #f59e0b, #fbbf24);
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-area::-webkit-scrollbar { width: 4px; }
        .scroll-area::-webkit-scrollbar-track { background: transparent; }
        .scroll-area::-webkit-scrollbar-thumb { background: rgba(113, 113, 122, 0.5); border-radius: 2px; }

        .tier-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        .tier-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.03) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .tier-card:hover::before { opacity: 1; }
        .tier-card:hover { transform: translateY(-2px) scale(1.01); }

        .stat-value {
            animation: count-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .rank-badge {
            position: relative;
            overflow: hidden;
        }
        .rank-badge::after {
            content: '';
            position: absolute;
            top: -50%; left: -50%;
            width: 200%; height: 200%;
            background: conic-gradient(transparent, rgba(255,255,255,0.1), transparent);
            animation: spin-slow 8s linear infinite;
        }

        /* V6.0: Accordion */
        .accordion-chevron {
            transition: transform 0.3s ease;
        }
        .accordion-chevron.expanded {
            transform: rotate(180deg);
        }
        .accordion-body {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        .accordion-body.expanded {
            max-height: 2000px;
        }

        /* V6.0: Notification badge */
        .notif-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            min-width: 18px;
            height: 18px;
            font-size: 10px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: #ef4444;
            color: white;
            padding: 0 4px;
            animation: pulse-ring 2s infinite;
        }
    `;
    document.head.appendChild(style);
}

// =======================================================
//  3. CARREGAMENTO DE DADOS (DATA LOADING)
// =======================================================

async function loadAirdropData() {
    airdropState.isConnected = State.isConnected;
    airdropState.user = null;
    airdropState.userSubmissions = [];
    airdropState.platformUsage = {};
    airdropState.isBanned = false;

    try {
        const publicData = await db.getPublicAirdropData();
        airdropState.systemConfig = publicData.config;
        airdropState.leaderboards = publicData.leaderboards;
        airdropState.dailyTasks = publicData.dailyTasks || [];
        airdropState.platformUsageConfig = publicData.platformUsageConfig || DEFAULT_PLATFORM_USAGE_CONFIG;

        if (airdropState.isConnected && State.userAddress) {
            const [user, submissions] = await Promise.all([
                db.getAirdropUser(State.userAddress),
                db.getUserSubmissions()
            ]);

            airdropState.user = user;
            airdropState.userSubmissions = submissions;

            if (user && user.isBanned) {
                airdropState.isBanned = true;
                return;
            }

            try {
                if (typeof db.getPlatformUsage === 'function') {
                    airdropState.platformUsage = await db.getPlatformUsage() || {};
                }
            } catch (e) {
                console.warn("Could not load platform usage:", e);
                airdropState.platformUsage = {};
            }

            if (airdropState.dailyTasks.length > 0) {
                 airdropState.dailyTasks = await Promise.all(airdropState.dailyTasks.map(async (task) => {
                     try {
                         if (!task.id) return { ...task, eligible: false, timeLeftMs: 0 };
                         const eligibility = await db.isTaskEligible(task.id, task.cooldownHours);
                         return { ...task, eligible: eligibility.eligible, timeLeftMs: eligibility.timeLeft };
                     } catch {
                          return { ...task, eligible: false, timeLeftMs: 0 };
                     }
                 }));
            }
        }
    } catch (error) {
        console.error("Airdrop Data Load Error:", error);

        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
            console.warn('Firebase permissions issue - user may need to connect wallet or sign in');
            airdropState.systemConfig = airdropState.systemConfig || {};
            airdropState.leaderboards = airdropState.leaderboards || { top100ByPoints: [], top100ByPosts: [] };
            airdropState.dailyTasks = airdropState.dailyTasks || [];
            return;
        }

        showToast("Error loading data. Please refresh.", "error");
    }
}

// --- Agora On-Chain Data ---
// V12 deploy block on Sepolia — fixed fromBlock avoids massive eth_getLogs ranges
const EVENTS_LOOKBACK = 10_313_523;

async function loadAgoraData() {
    airdropState.agoraHasProfile = false;
    airdropState.agoraUsername = null;
    airdropState.agoraPosts = [];

    if (!State.isConnected || !State.userAddress) return;
    try {
        const agora = addresses?.agora || contractAddresses?.agora || window.contractAddresses?.agora;
        if (!agora) return;
        const provider = NetworkManager.getProvider();
        const contract = new window.ethers.Contract(agora, agoraABI, provider);

        // Query profile + post events in parallel (indexed by user address)
        const [profileEvents, postEvents] = await Promise.all([
            contract.queryFilter(contract.filters.ProfileCreated(State.userAddress), EVENTS_LOOKBACK).catch(() => []),
            contract.queryFilter(contract.filters.PostCreated(null, State.userAddress), EVENTS_LOOKBACK).catch(() => [])
        ]);

        if (profileEvents.length > 0) {
            airdropState.agoraHasProfile = true;
            airdropState.agoraUsername = profileEvents[0].args.username || profileEvents[0].args[1];
        }

        // Filter out replies (replyTo > 0) and reposts, keep original posts only
        const originalPosts = postEvents.filter(ev => {
            const contentHash = ev.args.contentHash || ev.args[4];
            return contentHash && contentHash.length > 0;
        });

        airdropState.agoraPosts = originalPosts.slice(-5).reverse().map(ev => ({
            postId: Number(ev.args.postId || ev.args[0]),
            contentHash: ev.args.contentHash || ev.args[4],
            contentType: Number(ev.args.contentType || ev.args[3]),
            tag: Number(ev.args.tag || ev.args[2])
        }));
    } catch (e) {
        console.warn('[Airdrop] Agora data:', e.message);
    }
}

// --- On-Chain Claim Data ---
async function loadClaimData() {
    airdropState.claimInfo = null;
    airdropState.claimProof = null;

    if (!State.isConnected || !State.userAddress) return;
    if (!AirdropClaimTx.getAirdropClaimAddress()) return;

    try {
        const info = await AirdropClaimTx.getClaimInfo(State.userAddress);
        airdropState.claimInfo = info;

        // If active phase and not yet claimed, try to fetch proof
        if (info && info.isActive && !info.claimed) {
            const proof = await AirdropClaimTx.getMerkleProof(State.userAddress, info.phase);
            airdropState.claimProof = proof;
        }
    } catch (e) {
        console.warn('[Airdrop] Claim data load failed:', e.message);
    }
}

// =======================================================
//  4. COMPONENTES DE RENDERIZACAO (UI) — V6.0 REDESIGN
// =======================================================

function getUserEstimatedRank(list) {
    if (!airdropState.user || !list || list.length === 0) return null;
    const idx = list.findIndex(item => item.walletAddress?.toLowerCase() === airdropState.user.walletAddress?.toLowerCase());
    return idx >= 0 ? idx + 1 : null;
}

function getUserTierFromRank(rank) {
    if (!rank) return null;
    if (rank <= 5) return NFT_TIERS[0];
    if (rank <= 25) return NFT_TIERS[1];
    if (rank <= 75) return NFT_TIERS[2];
    if (rank <= 200) return NFT_TIERS[3];
    return null;
}

function getNextTierInfo(rank) {
    if (!rank) return { nextTier: NFT_TIERS[3], postsNeeded: 1 };
    if (rank <= 5) return null; // Already at top
    if (rank <= 25) return { nextTier: NFT_TIERS[0], postsNeeded: rank - 5 };
    if (rank <= 75) return { nextTier: NFT_TIERS[1], postsNeeded: rank - 25 };
    if (rank <= 200) return { nextTier: NFT_TIERS[2], postsNeeded: rank - 75 };
    return { nextTier: NFT_TIERS[3], postsNeeded: rank - 200 };
}

function getActionRequiredItems() {
    const now = Date.now();
    const twoHoursMs = AUTO_APPROVE_HOURS * 60 * 60 * 1000;
    return airdropState.userSubmissions.filter(sub =>
        ['pending', 'auditing'].includes(sub.status) &&
        sub.submittedAt &&
        (now - sub.submittedAt.getTime() >= twoHoursMs)
    );
}

// --- HEADER ---
function renderHeader() {
    const { user } = airdropState;
    const totalPoints = user?.totalPoints || 0;
    const approvedCount = user?.approvedSubmissionsCount || 0;
    const multiplier = getMultiplierByTier(approvedCount);

    const postsList = airdropState.leaderboards?.top100ByPosts || [];
    const userRank = getUserEstimatedRank(postsList);
    const userTier = getUserTierFromRank(userRank);
    const actionRequired = getActionRequiredItems().length;

    return `
        <div class="px-4 pt-4 md:pt-6 pb-2">
            <!-- Title Row -->
            <div class="flex items-center justify-between mb-3">
                <div>
                    <h1 class="text-lg md:text-2xl font-black text-white">Airdrop <span class="airdrop-gradient-text hidden md:inline">Campaign</span></h1>
                    <span class="text-[9px] md:text-xs text-zinc-500">${TOTAL_NFTS} NFTs • 4 Tiers</span>
                </div>
                <a href="https://t.me/BackCoinorg" target="_blank"
                   class="flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 px-3 py-1.5 rounded-full transition-all hover:scale-105 text-xs md:text-sm">
                    <i class="fa-brands fa-telegram"></i>
                    <span class="hidden md:inline font-bold">Community</span>
                </a>
            </div>

            ${airdropState.isConnected ? `
            <!-- Stats Row -->
            <div class="grid grid-cols-4 gap-2 md:gap-3 mb-3">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 md:p-3 text-center">
                    <span class="text-sm md:text-xl font-bold text-amber-400 stat-value">${totalPoints.toLocaleString()}</span>
                    <p class="text-[7px] md:text-[10px] text-zinc-500 uppercase tracking-wider">Points</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 md:p-3 text-center">
                    <span class="text-sm md:text-xl font-bold text-green-400 stat-value">${approvedCount}</span>
                    <p class="text-[7px] md:text-[10px] text-zinc-500 uppercase tracking-wider">Posts</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 md:p-3 text-center">
                    <span class="text-sm md:text-xl font-bold text-purple-400 stat-value">${multiplier.toFixed(1)}x</span>
                    <p class="text-[7px] md:text-[10px] text-zinc-500 uppercase tracking-wider">Boost</p>
                </div>
                <div class="bg-zinc-900/80 border ${userTier ? userTier.border : 'border-zinc-800'} rounded-xl p-2 md:p-3 text-center relative overflow-hidden">
                    ${userTier ? `
                        <div class="absolute inset-0 bg-gradient-to-br ${userTier.gradient} opacity-30"></div>
                        <span class="text-sm md:text-xl font-bold ${userTier.text} relative z-10">${userTier.icon} #${userRank}</span>
                        <p class="text-[7px] md:text-[10px] text-zinc-500 uppercase relative z-10">${userTier.name}</p>
                    ` : `
                        <span class="text-sm md:text-xl font-bold text-zinc-600">—</span>
                        <p class="text-[7px] md:text-[10px] text-zinc-500 uppercase">Rank</p>
                    `}
                </div>
            </div>
            ` : ''}

            <!-- Navigation — 2 Tabs -->
            <div class="flex justify-center">
                <div class="bg-zinc-900/80 p-1 md:p-1.5 rounded-full border border-zinc-800 inline-flex gap-1 w-full md:w-auto">
                    <button data-target="earn"
                            class="nav-pill-btn flex-1 md:flex-none md:px-6 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 relative
                                   ${airdropState.activeTab === 'earn' ? 'airdrop-tab-active shadow-lg shadow-amber-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}">
                        <i class="fa-solid fa-coins"></i> Earn
                        ${actionRequired > 0 ? `<span class="notif-badge">${actionRequired}</span>` : ''}
                    </button>
                    <button data-target="ranking"
                            class="nav-pill-btn flex-1 md:flex-none md:px-6 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5
                                   ${airdropState.activeTab === 'ranking' ? 'airdrop-tab-active shadow-lg shadow-amber-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}">
                        <i class="fa-solid fa-trophy"></i> Ranking
                    </button>
                </div>
            </div>
        </div>
    `;
}

// =======================================================
//  EARN TAB — Single scrollable page, no sub-tabs
// =======================================================

// --- ON-CHAIN CLAIM SECTION ---
function renderClaimSection() {
    const info = airdropState.claimInfo;
    if (!info) return ''; // Contract not configured or load failed

    const ethers = window.ethers;

    // Phase not active — no merkle root set
    if (!info.isActive) {
        return `
            <div class="bg-gradient-to-br from-emerald-900/20 to-zinc-900/80 border border-emerald-500/20 rounded-2xl p-4 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <i class="fa-solid fa-gift text-emerald-400"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-white">Token Claim</h3>
                        <p class="text-zinc-500 text-[10px]">Phase ${info.phase || 0} completed</p>
                    </div>
                </div>
                <div class="bg-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-zinc-400 text-xs">No active claim phase right now</p>
                    <p class="text-zinc-600 text-[10px] mt-1">Next phase will be announced on Telegram</p>
                </div>
                ${info.totalClaimCount > 0 ? `
                <div class="flex items-center justify-center gap-4 mt-3 text-[10px] text-zinc-500">
                    <span>${info.totalClaimCount} claims</span>
                    <span>${Number(ethers.formatEther(info.totalClaimed)).toLocaleString()} BKC distributed</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Already claimed this phase
    if (info.claimed) {
        return `
            <div class="bg-gradient-to-br from-emerald-900/20 to-zinc-900/80 border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <i class="fa-solid fa-check-circle text-emerald-400"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-white">Phase ${info.phase} Claimed</h3>
                        <p class="text-emerald-400 text-[10px]">Tokens auto-staked for ${info.lockDays} days</p>
                    </div>
                </div>
                <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p class="text-emerald-300 text-xs font-medium">You've already claimed your allocation!</p>
                    <p class="text-zinc-500 text-[10px] mt-1">Tokens are earning staking rewards</p>
                </div>
            </div>
        `;
    }

    // Active phase, not claimed — check if user has proof
    const proof = airdropState.claimProof;
    const availableBKC = Number(ethers.formatEther(info.availableBalance)).toLocaleString();

    if (!proof) {
        // User not on the merkle tree for this phase
        return `
            <div class="bg-gradient-to-br from-emerald-900/20 to-zinc-900/80 border border-emerald-500/20 rounded-2xl p-4 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center airdrop-pulse-glow">
                        <i class="fa-solid fa-gift text-emerald-400"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-white">Phase ${info.phase} Active</h3>
                        <p class="text-emerald-400 text-[10px]">${availableBKC} BKC available</p>
                    </div>
                </div>
                <div class="bg-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-zinc-400 text-xs">Your wallet is not eligible for this phase</p>
                    <p class="text-zinc-600 text-[10px] mt-1">Keep earning points — higher ranks qualify for future phases!</p>
                </div>
            </div>
        `;
    }

    // User IS eligible — show claim button
    const claimAmountFormatted = Number(ethers.formatEther(proof.amount)).toLocaleString();
    const isSubmitting = airdropState.claimLoading;

    return `
        <div class="bg-gradient-to-br from-emerald-900/30 to-zinc-900/80 border border-emerald-500/40 rounded-2xl p-4 relative overflow-hidden airdrop-pulse-glow">
            <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-gift text-emerald-400 airdrop-bounce"></i>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-white">Phase ${info.phase} — Claim Available!</h3>
                    <p class="text-emerald-400 text-[10px]">Your allocation is ready</p>
                </div>
            </div>

            <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center mb-3">
                <p class="text-zinc-400 text-[10px] uppercase tracking-wider mb-1">Your Allocation</p>
                <p class="text-2xl font-black text-emerald-300">${claimAmountFormatted} <span class="text-sm text-emerald-500">BKC</span></p>
                <p class="text-zinc-500 text-[10px] mt-1">Auto-staked for ${info.lockDays} days</p>
            </div>

            <button id="claim-airdrop-btn"
                    class="w-full cta-mega text-black font-bold py-3 rounded-xl text-sm transition-all ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}"
                    ${isSubmitting ? 'disabled' : ''}>
                ${isSubmitting
                    ? '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Claiming...'
                    : '<i class="fa-solid fa-rocket mr-2"></i> Claim & Auto-Stake'
                }
            </button>

            <p class="text-zinc-600 text-[10px] mt-2 text-center">
                <i class="fa-solid fa-lock mr-1"></i> Tokens are locked for ${info.lockDays} days while earning staking rewards
            </p>
        </div>
    `;
}

function renderEarnTab() {
    if (!airdropState.isConnected) {
        return `
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-24 h-24 mx-auto mb-6 airdrop-float">
                    <img src="./assets/airdrop.png" alt="Connect" class="w-full h-full object-contain opacity-50">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm max-w-xs mx-auto mb-4">Connect to start earning points and win NFT rewards.</p>

                <div class="max-w-xs mx-auto bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
                    <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Win 1 of ${TOTAL_NFTS} NFT Boosters</p>
                    <div class="flex justify-center gap-3 text-lg">
                        ${NFT_TIERS.map(t => `<span title="${t.name}">${t.icon}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="px-4 space-y-4 airdrop-fade-up pb-24">
            ${renderClaimSection()}
            ${renderActionRequiredBanner()}
            ${renderYourRankSnippet()}
            ${renderPostSection()}
            ${renderPlatformSection()}
            ${renderTasksSection()}
            ${renderSubmissionHistory()}
        </div>
    `;
}

// --- ACTION REQUIRED BANNER ---
function renderActionRequiredBanner() {
    const items = getActionRequiredItems();
    if (items.length === 0) return '';

    return `
        <div class="bg-gradient-to-r from-green-900/30 to-zinc-900/80 border border-green-500/40 rounded-xl p-3 relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-bell text-green-400 airdrop-bounce"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">${items.length} post${items.length > 1 ? 's' : ''} ready to verify!</p>
                        <p class="text-green-400/70 text-[10px]">Confirm to earn points</p>
                    </div>
                </div>
                <button id="action-required-btn" class="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all">
                    Review
                </button>
            </div>
        </div>
    `;
}

// --- YOUR RANK SNIPPET ---
function renderYourRankSnippet() {
    const postsList = airdropState.leaderboards?.top100ByPosts || [];
    const userRank = getUserEstimatedRank(postsList);
    const userTier = getUserTierFromRank(userRank);
    const nextInfo = getNextTierInfo(userRank);

    if (!userRank) {
        return `
            <div id="rank-snippet-btn" class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-amber-500/30 transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <i class="fa-solid fa-arrow-up text-amber-400 text-xs"></i>
                    </div>
                    <div>
                        <p class="text-zinc-300 text-sm font-medium">Start posting to join the ranking!</p>
                        <p class="text-zinc-500 text-[10px]">Top 200 earn exclusive NFT Boosters</p>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-right text-zinc-600 text-xs"></i>
            </div>
        `;
    }

    // Calculate progress to next tier
    let progressBar = '';
    if (nextInfo) {
        const currentBoundary = userRank <= 25 ? 5 : userRank <= 75 ? 25 : userRank <= 200 ? 75 : 200;
        const prevBoundary = userRank <= 25 ? 25 : userRank <= 75 ? 75 : 200;
        const progressPct = Math.max(0, Math.min(100, ((prevBoundary - userRank) / (prevBoundary - currentBoundary)) * 100));
        progressBar = `
            <div class="flex-1 mx-3">
                <div class="progress-bar-bg h-1.5 rounded-full">
                    <div class="progress-bar-fill h-full rounded-full" style="width: ${progressPct}%"></div>
                </div>
                <p class="text-zinc-500 text-[9px] mt-0.5">${nextInfo.postsNeeded} more to ${nextInfo.nextTier.icon} ${nextInfo.nextTier.name}</p>
            </div>
        `;
    } else {
        progressBar = `
            <div class="flex-1 mx-3">
                <div class="progress-bar-bg h-1.5 rounded-full">
                    <div class="progress-bar-fill h-full rounded-full" style="width: 100%"></div>
                </div>
                <p class="text-cyan-400/70 text-[9px] mt-0.5">Top tier reached!</p>
            </div>
        `;
    }

    return `
        <div id="rank-snippet-btn" class="bg-zinc-900/80 border ${userTier.border} rounded-xl p-3 flex items-center cursor-pointer hover:border-amber-500/30 transition-colors relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r ${userTier.gradient} opacity-20"></div>
            <div class="flex items-center gap-2 relative z-10 shrink-0">
                <span class="text-lg">${userTier.icon}</span>
                <div>
                    <span class="${userTier.text} font-bold text-sm">#${userRank}</span>
                    <p class="text-zinc-500 text-[9px]">${userTier.name}</p>
                </div>
            </div>
            <div class="relative z-10 flex-1">${progressBar}</div>
            <i class="fa-solid fa-chevron-right text-zinc-600 text-xs relative z-10 shrink-0"></i>
        </div>
    `;
}

// --- POST SECTION (Agora-Integrated) ---
function _getPostPreview(post) {
    const ct = post.contentType;
    if (ct === 1) return { icon: 'fa-image', text: 'Image post', color: 'text-blue-400' };
    if (ct === 2) return { icon: 'fa-video', text: 'Video post', color: 'text-purple-400' };
    if (ct === 3) return { icon: 'fa-link', text: 'Link post', color: 'text-cyan-400' };
    // Text post — show first 80 chars
    const raw = post.contentHash || '';
    const preview = raw.length > 80 ? raw.slice(0, 77) + '...' : raw;
    return { icon: 'fa-quote-left', text: preview || 'Text post', color: 'text-zinc-300' };
}

function _buildAgoraShareUrl(postId) {
    const username = airdropState.agoraUsername;
    const myAddress = State.userAddress || '';
    const postParam = username ? `@${username}/${postId}` : `post=${postId}`;
    const refParam = myAddress ? `&ref=${myAddress}` : '';
    return `${window.location.origin}/#agora?${postParam}${refParam}`;
}

function _buildTweetIntent(postId, preview) {
    const url = _buildAgoraShareUrl(postId);
    const text = `${preview.length > 60 ? preview.slice(0, 57) + '...' : preview}\n\n${url}\n\n${DEFAULT_HASHTAGS}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function renderPostSection() {
    const { agoraHasProfile, agoraUsername, agoraPosts } = airdropState;

    // --- State 1: No Agora profile ---
    if (!agoraHasProfile) {
        return `
            <div class="bg-gradient-to-br from-indigo-900/30 to-zinc-900/80 border border-indigo-500/30 rounded-2xl overflow-hidden">
                <div class="px-4 pt-4 pb-2">
                    <h2 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-rocket text-indigo-400"></i> Share to Earn
                    </h2>
                    <p class="text-zinc-500 text-[10px] mt-0.5">Create posts on Agora, share on social media, earn points</p>
                </div>
                <div class="px-4 pb-4 text-center">
                    <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 mb-3">
                        <div class="text-3xl mb-2"><i class="fa-solid fa-user-plus text-indigo-400"></i></div>
                        <p class="text-white font-bold text-sm mb-1">Create Your Agora Profile</p>
                        <p class="text-zinc-400 text-xs mb-3">Join the decentralized social network to start earning points by sharing your posts.</p>
                        <button class="agora-nav-btn cta-mega text-black font-bold py-2.5 px-6 rounded-xl text-sm" data-target="agora">
                            <i class="fa-solid fa-arrow-right mr-1"></i> Go to Agora
                        </button>
                    </div>
                    <div class="flex items-center gap-3 text-zinc-500 text-[10px]">
                        <div class="flex items-center gap-1"><i class="fa-solid fa-pen-to-square"></i> Create posts</div>
                        <div class="text-zinc-700">→</div>
                        <div class="flex items-center gap-1"><i class="fa-brands fa-x-twitter"></i> Share on X</div>
                        <div class="text-zinc-700">→</div>
                        <div class="flex items-center gap-1"><i class="fa-solid fa-coins"></i> Earn points</div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- State 2: Has profile but no recent posts ---
    if (agoraPosts.length === 0) {
        const profileLink = `${window.location.origin}/#agora?@${agoraUsername || ''}`;
        return `
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
                <div class="px-4 pt-4 pb-2">
                    <h2 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-share-nodes text-amber-400"></i> Share to Earn
                    </h2>
                    <p class="text-zinc-500 text-[10px] mt-0.5">Post on Agora → Share on social media → Submit link → Earn points</p>
                </div>
                <div class="px-4 pb-3 text-center">
                    <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-3">
                        <p class="text-amber-400 font-bold text-sm mb-1"><i class="fa-solid fa-pen-fancy mr-1"></i> Create Your First Post</p>
                        <p class="text-zinc-400 text-xs mb-3">Write something on Agora, then share it on social media to earn airdrop points!</p>
                        <button class="agora-nav-btn cta-mega text-black font-bold py-2 px-5 rounded-xl text-sm" data-target="agora">
                            <i class="fa-solid fa-plus mr-1"></i> Post on Agora
                        </button>
                    </div>
                </div>
                ${_renderSubmitSection()}
            </div>
        `;
    }

    // --- State 3: Has posts — show them with share buttons ---
    return `
        <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
            <div class="px-4 pt-4 pb-2 flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-share-nodes text-amber-400"></i> Share to Earn
                    </h2>
                    <p class="text-zinc-500 text-[10px] mt-0.5">Share your Agora posts on social media to earn points</p>
                </div>
                <button class="agora-nav-btn text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors" data-target="agora">
                    <i class="fa-solid fa-plus mr-1"></i>New Post
                </button>
            </div>

            <!-- Posts to Share -->
            <div class="px-4 pb-3 space-y-2">
                ${agoraPosts.map(post => {
                    const preview = _getPostPreview(post);
                    const shareUrl = _buildAgoraShareUrl(post.postId);
                    const tweetUrl = _buildTweetIntent(post.postId, preview.text);

                    return `
                        <div class="bg-black/40 border border-zinc-700/50 rounded-xl p-3 flex items-center gap-3">
                            <div class="flex-1 min-w-0">
                                <p class="text-xs ${preview.color} truncate">
                                    <i class="fa-solid ${preview.icon} mr-1 text-[10px]"></i>${preview.text}
                                </p>
                                <p class="text-zinc-600 text-[9px] mt-0.5">#${post.postId}</p>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <a href="${tweetUrl}" target="_blank"
                                   class="social-btn w-8 h-8 rounded-lg bg-black/60 border border-zinc-700 hover:border-blue-500/50 flex items-center justify-center" title="Share on X">
                                    <i class="fa-brands fa-x-twitter text-white text-xs"></i>
                                </a>
                                <button class="social-btn copy-agora-link w-8 h-8 rounded-lg bg-black/60 border border-zinc-700 hover:border-amber-500/50 flex items-center justify-center" title="Copy link" data-url="${shareUrl}">
                                    <i class="fa-solid fa-copy text-zinc-400 text-xs"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Divider -->
            <div class="border-t border-zinc-800 mx-4"></div>

            ${_renderSubmitSection()}
        </div>
    `;
}

function _renderSubmitSection() {
    return `
        <div class="px-4 py-3">
            <p class="text-zinc-400 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                <i class="fa-solid fa-link text-[8px]"></i> Submit your social media post link
            </p>
            <div class="relative">
                <input type="url" id="content-url-input"
                       placeholder="Paste your X / TikTok / Instagram post URL..."
                       class="w-full bg-black/50 border border-zinc-600 rounded-xl pl-3 pr-20 py-2.5 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-zinc-600">
                <button id="submit-content-btn"
                        class="absolute right-1.5 top-1.5 bottom-1.5 bg-green-600 hover:bg-green-500 text-white font-bold px-3 rounded-lg transition-all text-sm">
                    Submit
                </button>
            </div>
            <p class="text-amber-400/60 text-[9px] mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-exclamation-circle"></i> Share an Agora post on social media, then paste the link here • 2h audit
            </p>
        </div>
    `;
}

// --- PLATFORM USAGE SECTION ---
function renderPlatformSection() {
    const config = airdropState.platformUsageConfig || DEFAULT_PLATFORM_USAGE_CONFIG;
    const usage = airdropState.platformUsage || {};

    let totalActions = 0;
    let completedActions = 0;

    Object.keys(config).forEach(key => {
        if (config[key].enabled !== false && config[key].maxCount) {
            totalActions += config[key].maxCount;
            completedActions += Math.min(usage[key]?.count || 0, config[key].maxCount);
        }
    });

    const progressPercent = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
    const platformPoints = airdropState.user?.platformUsagePoints || 0;

    return `
        <div>
            <!-- Section Header + Progress -->
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-gamepad text-purple-400"></i> Platform Quests
                </h2>
                <span class="text-cyan-400 text-[10px] font-bold">${platformPoints.toLocaleString()} pts</span>
            </div>
            <div class="flex items-center gap-2 mb-3">
                <div class="progress-bar-bg h-1.5 rounded-full flex-1">
                    <div class="progress-bar-fill h-full rounded-full" style="width: ${progressPercent}%"></div>
                </div>
                <span class="text-amber-400 text-[10px] font-bold shrink-0">${completedActions}/${totalActions}</span>
            </div>

            <!-- Actions Grid -->
            <div class="grid grid-cols-2 gap-2" id="platform-actions-grid">
                ${Object.entries(config).filter(([_, action]) => action.enabled !== false).map(([key, action]) => {
                    const userUsage = usage[key] || { count: 0, totalPoints: 0 };
                    const isCompleted = userUsage.count >= action.maxCount;
                    const remaining = Math.max(0, action.maxCount - userUsage.count);
                    const progressPct = (userUsage.count / action.maxCount) * 100;
                    const targetPage = PLATFORM_ACTION_PAGES[key] || '';

                    return `
                        <div class="platform-action-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 ${isCompleted ? 'completed opacity-60' : 'cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800/80'} transition-all"
                             data-platform-action="${key}"
                             data-target-page="${targetPage}">
                            <div class="flex items-start justify-between mb-1.5">
                                <span class="text-lg">${action.icon}</span>
                                ${isCompleted ?
                                    '<span class="text-green-400 text-xs"><i class="fa-solid fa-check-circle"></i></span>' :
                                    `<span class="text-amber-400 text-[10px] font-bold">+${action.points}</span>`
                                }
                            </div>
                            <p class="text-white text-xs font-medium mb-1">${action.label}</p>
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="text-zinc-500 text-[10px]">${userUsage.count}/${action.maxCount}</span>
                                ${!isCompleted && remaining > 0 ?
                                    `<span class="text-zinc-600 text-[10px]">${remaining} left</span>` : ''
                                }
                            </div>
                            <div class="progress-bar-bg h-1 rounded-full">
                                <div class="progress-bar-fill h-full rounded-full" style="width: ${progressPct}%"></div>
                            </div>
                            ${!isCompleted && targetPage ? `
                                <div class="mt-2 text-center">
                                    <span class="text-amber-400/70 text-[9px]"><i class="fa-solid fa-arrow-right mr-1"></i>Tap to go</span>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// --- DAILY BONUSES ---
function renderTasksSection() {
    const tasks = airdropState.dailyTasks || [];
    const eligibleTasks = tasks.filter(t => t.eligible);
    const completedTasks = tasks.filter(t => !t.eligible && t.timeLeftMs > 0);

    if (tasks.length === 0) {
        return `
            <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                <p class="text-zinc-500 text-xs"><i class="fa-solid fa-bolt text-zinc-600 mr-1"></i>No daily bonuses available</p>
            </div>
        `;
    }

    return `
        <div>
            <h2 class="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <i class="fa-solid fa-bolt text-yellow-400"></i> Daily Bonuses
            </h2>
            <div class="space-y-2">
                ${eligibleTasks.map(task => `
                    <div class="task-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 cursor-pointer hover:border-amber-500/50 transition-colors"
                         data-id="${task.id}" data-url="${task.url || ''}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-star text-yellow-400 text-xs"></i>
                                </div>
                                <div>
                                    <p class="text-white text-sm font-medium">${task.title}</p>
                                    ${task.description ? `<p class="text-zinc-500 text-[10px]">${task.description}</p>` : ''}
                                </div>
                            </div>
                            <span class="text-green-400 text-sm font-bold">+${Math.round(task.points)}</span>
                        </div>
                    </div>
                `).join('')}
                ${completedTasks.map(task => `
                    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 opacity-50">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-clock text-zinc-500 text-xs"></i>
                                </div>
                                <p class="text-zinc-400 text-sm">${task.title}</p>
                            </div>
                            <span class="text-zinc-600 text-xs">${formatTimeLeft(task.timeLeftMs)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// --- SUBMISSION HISTORY (collapsible accordion) ---
function renderSubmissionHistory() {
    const { userSubmissions, user } = airdropState;
    const approvedCount = user?.approvedSubmissionsCount || 0;
    const pendingCount = userSubmissions.filter(s => ['pending', 'auditing'].includes(s.status)).length;
    const rejectedCount = userSubmissions.filter(s => s.status === 'rejected').length;
    const total = userSubmissions.length;

    if (total === 0) return '';

    const expanded = airdropState.historyExpanded;

    return `
        <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <!-- Accordion Header -->
            <button id="history-toggle-btn" class="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-clock-rotate-left text-zinc-500 text-xs"></i>
                    <span class="text-zinc-300 text-sm font-medium">My Submissions</span>
                    <span class="text-zinc-600 text-[10px]">${total} total</span>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2">
                        ${approvedCount > 0 ? `<span class="text-green-400 text-[10px]">${approvedCount} approved</span>` : ''}
                        ${pendingCount > 0 ? `<span class="text-amber-400 text-[10px]">${pendingCount} pending</span>` : ''}
                        ${rejectedCount > 0 ? `<span class="text-red-400 text-[10px]">${rejectedCount} rejected</span>` : ''}
                    </div>
                    <i class="fa-solid fa-chevron-down text-zinc-500 text-xs accordion-chevron ${expanded ? 'expanded' : ''}"></i>
                </div>
            </button>

            <!-- Accordion Body -->
            <div class="accordion-body ${expanded ? 'expanded' : ''}">
                <div class="border-t border-zinc-800">
                    ${userSubmissions.slice(0, 10).map((sub, idx) => {
                        const isLast = idx === Math.min(userSubmissions.length, 10) - 1;
                        const isPending = ['pending', 'auditing'].includes(sub.status);
                        const isApproved = sub.status === 'approved';
                        const isRejected = sub.status === 'rejected';

                        let statusIcon, statusBg, statusText;
                        if (isApproved) {
                            statusIcon = '<i class="fa-solid fa-check-circle text-green-400"></i>';
                            statusBg = '';
                            statusText = '';
                        } else if (isRejected) {
                            statusIcon = '<i class="fa-solid fa-times-circle text-red-400"></i>';
                            statusBg = '';
                            statusText = '';
                        } else {
                            statusIcon = '<i class="fa-solid fa-shield-halved text-amber-400 animate-pulse"></i>';
                            statusBg = 'bg-amber-900/10';
                            statusText = `
                                <div class="mt-1.5 flex items-center gap-2 text-amber-400/80">
                                    <i class="fa-solid fa-magnifying-glass text-[10px] animate-pulse"></i>
                                    <span class="text-[10px] font-medium">Under security audit...</span>
                                </div>
                            `;
                        }

                        const pts = sub.pointsAwarded ? `+${sub.pointsAwarded}` : '-';

                        // Check if this submission is ready for verification
                        const now = Date.now();
                        const twoHoursMs = AUTO_APPROVE_HOURS * 60 * 60 * 1000;
                        const isReady = isPending && sub.submittedAt && (now - sub.submittedAt.getTime() >= twoHoursMs);

                        return `
                            <div class="p-3 ${isLast ? '' : 'border-b border-zinc-800'} ${statusBg}">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3 overflow-hidden">
                                        ${statusIcon}
                                        <a href="${sub.url}" target="_blank" class="text-zinc-400 text-xs truncate hover:text-blue-400 max-w-[180px] md:max-w-[300px]">${sub.url}</a>
                                    </div>
                                    <div class="flex items-center gap-2 shrink-0">
                                        ${isReady ? `
                                            <button data-action="confirm" data-id="${sub.submissionId}"
                                                    class="action-btn bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors">
                                                Verify
                                            </button>
                                        ` : ''}
                                        <span class="font-mono font-bold ${sub.pointsAwarded ? 'text-green-400' : 'text-zinc-600'} text-sm">${pts}</span>
                                    </div>
                                </div>
                                ${statusText}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// =======================================================
//  RANKING TAB
// =======================================================

function renderLeaderboard() {
    const postsList = airdropState.leaderboards?.top100ByPosts || [];
    const pointsList = airdropState.leaderboards?.top100ByPoints || [];
    const activeRanking = airdropState.activeRanking || 'posts';

    const userRank = getUserEstimatedRank(postsList);
    const userTier = getUserTierFromRank(userRank);
    const nextInfo = getNextTierInfo(userRank);
    const approvedCount = airdropState.user?.approvedSubmissionsCount || 0;
    const totalPoints = airdropState.user?.totalPoints || 0;

    function renderRankingItem(item, i, type) {
        const isMe = airdropState.user && item.walletAddress?.toLowerCase() === airdropState.user.walletAddress?.toLowerCase();
        const tierInfo = getTierInfo(i + 1);
        const bgClass = isMe ? (type === 'posts' ? 'bg-amber-500/10' : 'bg-green-500/10') : '';
        const textClass = type === 'posts' ? 'text-amber-400' : 'text-green-400';
        const valueColor = type === 'posts' ? 'text-white' : 'text-green-400';
        const valueLabel = type === 'posts' ? 'posts' : 'pts';

        return `
            <div class="flex items-center justify-between p-3 ${bgClass} ${!isMe ? 'hover:bg-zinc-800/50' : ''} transition-colors ${isMe ? 'border-l-2 border-amber-500' : ''}">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full ${tierInfo.bg} flex items-center justify-center text-xs font-bold shrink-0">${tierInfo.icon || (i+1)}</span>
                    <div class="flex flex-col">
                        <span class="font-mono text-xs ${isMe ? textClass + ' font-bold' : 'text-zinc-400'}">
                            ${formatAddress(item.walletAddress)}${isMe ? ' (You)' : ''}
                        </span>
                        ${tierInfo.tierName ? `<span class="text-[9px] ${tierInfo.tierTextColor}">${tierInfo.tierName}</span>` : ''}
                    </div>
                </div>
                <span class="font-bold ${valueColor} text-sm">${(item.value || 0).toLocaleString()} <span class="text-zinc-500 text-xs">${valueLabel}</span></span>
            </div>
        `;
    }

    const postsTabClass = activeRanking === 'posts'
        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20'
        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700';
    const pointsTabClass = activeRanking === 'points'
        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20'
        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700';

    const postsHidden = activeRanking === 'posts' ? '' : 'hidden';
    const pointsHidden = activeRanking === 'points' ? '' : 'hidden';

    const postsContent = postsList.length === 0
        ? '<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>'
        : postsList.slice(0, 50).map((item, i) => renderRankingItem(item, i, 'posts')).join('');

    const pointsContent = pointsList.length === 0
        ? '<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>'
        : pointsList.slice(0, 50).map((item, i) => renderRankingItem(item, i, 'points')).join('');

    return `
        <div class="px-4 airdrop-fade-up pb-24">

            <!-- Your Position Hero Card -->
            ${airdropState.isConnected ? `
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-900 border ${userTier ? userTier.border : 'border-zinc-800'} rounded-2xl p-5 mb-5 relative overflow-hidden">
                ${userTier ? `<div class="absolute inset-0 bg-gradient-to-br ${userTier.gradient} opacity-20"></div>` : ''}

                ${userTier ? `
                <div class="relative z-10">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl">${userTier.icon}</span>
                            <div>
                                <span class="${userTier.text} font-black text-2xl">#${userRank}</span>
                                <p class="text-zinc-400 text-xs">${userTier.name} Tier</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-amber-400 font-bold text-sm">${totalPoints.toLocaleString()} pts</p>
                            <p class="text-zinc-500 text-[10px]">${approvedCount} posts</p>
                        </div>
                    </div>
                    ${nextInfo ? `
                    <div class="bg-black/30 rounded-lg p-2.5">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-zinc-400 text-[10px]">Next: ${nextInfo.nextTier.icon} ${nextInfo.nextTier.name}</span>
                            <span class="text-zinc-500 text-[10px]">${nextInfo.postsNeeded} positions away</span>
                        </div>
                        <div class="progress-bar-bg h-1.5 rounded-full">
                            <div class="progress-bar-fill h-full rounded-full" style="width: ${Math.max(10, 100 - (nextInfo.postsNeeded * 2))}%"></div>
                        </div>
                    </div>
                    ` : `
                    <div class="bg-cyan-500/10 rounded-lg p-2.5 text-center">
                        <span class="text-cyan-300 text-xs font-medium">You're at the top! Keep it up!</span>
                    </div>
                    `}
                </div>
                ` : `
                <div class="text-center py-4 relative z-10">
                    <div class="w-12 h-12 mx-auto mb-3 opacity-30">
                        <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                    </div>
                    <p class="text-zinc-400 text-sm font-medium">Submit your first post to join the leaderboard</p>
                    <p class="text-zinc-600 text-xs mt-1">Top 200 earn exclusive NFT Boosters</p>
                </div>
                `}
            </div>
            ` : ''}

            <!-- NFT Tier Legend -->
            <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mb-5">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-gem text-amber-500 text-[10px]"></i> NFT Reward Tiers
                    </h3>
                    <span class="text-[10px] text-zinc-600">${TOTAL_NFTS} NFTs</span>
                </div>
                <div class="space-y-2">
                    ${NFT_TIERS.map(tier => `
                        <div class="tier-card flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r ${tier.gradient} border ${tier.border}">
                            <div class="flex items-center gap-2.5">
                                <span class="text-lg">${tier.icon}</span>
                                <div>
                                    <span class="${tier.text} font-bold text-xs">${tier.name}</span>
                                    <div class="text-zinc-500 text-[10px]">${tier.count} NFTs</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="text-white font-bold text-xs">${tier.ranks}</span>
                                <div class="flex items-center gap-1">
                                    <span class="text-green-400/80 text-[10px]">${tier.burn} burn</span>
                                    <span class="text-zinc-600 text-[10px]">•</span>
                                    <span class="text-green-400 text-[10px] font-medium">${tier.receive} rewards</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <p class="text-amber-400/60 text-[10px] mt-3 flex items-center gap-1">
                    <i class="fa-solid fa-info-circle"></i>
                    NFT Boosters reduce token burn when claiming mining rewards
                </p>
            </div>

            <!-- Ranking Toggle Tabs -->
            <div class="flex gap-2 mb-4">
                <button data-ranking="posts" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${postsTabClass}">
                    <i class="fa-solid fa-share-nodes"></i> By Posts
                </button>
                <button data-ranking="points" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${pointsTabClass}">
                    <i class="fa-solid fa-star"></i> By Points
                </button>
            </div>

            <!-- Posts Ranking -->
            <div id="ranking-posts" class="${postsHidden}">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                        <h3 class="font-bold text-white text-sm flex items-center gap-2">
                            <i class="fa-solid fa-crown text-yellow-500"></i> Top Content Creators
                        </h3>
                        <span class="text-zinc-500 text-xs">${postsList.length} creators</span>
                    </div>
                    <div class="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto scroll-area">
                        ${postsContent}
                    </div>
                </div>
            </div>

            <!-- Points Ranking -->
            <div id="ranking-points" class="${pointsHidden}">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                        <h3 class="font-bold text-white text-sm flex items-center gap-2">
                            <i class="fa-solid fa-star text-green-500"></i> Top Points Earners
                        </h3>
                        <span class="text-zinc-500 text-xs">${pointsList.length} earners</span>
                    </div>
                    <div class="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto scroll-area">
                        ${pointsContent}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getTierInfo(rank) {
    if (rank <= 5)   return { icon: '💎', bg: 'bg-cyan-500/20 text-cyan-300',   tierName: 'Diamond', tierTextColor: 'text-cyan-400/70' };
    if (rank <= 25)  return { icon: '🥇', bg: 'bg-yellow-500/20 text-yellow-400', tierName: 'Gold',    tierTextColor: 'text-yellow-400/70' };
    if (rank <= 75)  return { icon: '🥈', bg: 'bg-gray-400/20 text-gray-300',   tierName: 'Silver',  tierTextColor: 'text-gray-400/70' };
    if (rank <= 200) return { icon: '🥉', bg: 'bg-amber-600/20 text-amber-500', tierName: 'Bronze',  tierTextColor: 'text-amber-500/70' };
    return { icon: null, bg: 'bg-zinc-800 text-zinc-400', tierName: null, tierTextColor: '' };
}

// =======================================================
//  5. HANDLERS & ACTIONS
// =======================================================

function updateContent() {
    const contentEl = document.getElementById('main-content');
    const headerEl = document.getElementById('airdrop-header');
    if (!contentEl) return;

    if (headerEl) {
        headerEl.innerHTML = renderHeader();
    }

    if (airdropState.isBanned) {
        contentEl.innerHTML = `
            <div class="px-4 py-12 text-center">
                <i class="fa-solid fa-ban text-red-500 text-4xl mb-4"></i>
                <h2 class="text-red-500 font-bold text-xl mb-2">Account Suspended</h2>
                <p class="text-zinc-400 text-sm">Contact support on Telegram.</p>
            </div>
        `;
        return;
    }

    switch(airdropState.activeTab) {
        case 'earn': contentEl.innerHTML = renderEarnTab(); break;
        case 'ranking': contentEl.innerHTML = renderLeaderboard(); break;
        default: contentEl.innerHTML = renderEarnTab();
    }
}

function handleCopySmartLink() {
    const refCode = airdropState.user?.referralCode || 'CODE';
    const textToCopy = `${refCode !== 'CODE' ? `https://backcoin.org/?ref=${refCode}` : 'https://backcoin.org'} ${DEFAULT_HASHTAGS}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Copied! Now paste it in your post.", "success");
        const btn = document.getElementById('copy-viral-btn');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            btn.classList.remove('cta-mega');
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.innerHTML = original;
                btn.classList.add('cta-mega');
                btn.classList.remove('bg-green-600');
            }, 2000);
        }
    }).catch(() => showToast("Failed to copy.", "error"));
}

function handleTabSwitch(e) {
    const btn = e.target.closest('.nav-pill-btn');
    if (btn) { airdropState.activeTab = btn.dataset.target; updateContent(); }
}

function handleRankingSwitch(e) {
    const btn = e.target.closest('.ranking-tab-btn');
    if (btn && btn.dataset.ranking) {
        airdropState.activeRanking = btn.dataset.ranking;
        updateContent();
    }
}

function handleHistoryToggle() {
    airdropState.historyExpanded = !airdropState.historyExpanded;
    const chevron = document.querySelector('.accordion-chevron');
    const body = document.querySelector('.accordion-body');
    if (chevron) chevron.classList.toggle('expanded');
    if (body) body.classList.toggle('expanded');
}

function openConfirmationModal(submission) {
    const modalContent = `
        <div class="text-center">
            <div class="w-32 h-32 mx-auto mb-4">
                <img src="./assets/caution.png" alt="Caution" class="w-full h-full object-contain">
            </div>

            <h3 class="text-xl font-bold text-red-400 mb-2">FINAL VERIFICATION</h3>

            <div class="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-4">
                <p class="text-red-300 text-sm font-bold mb-2">
                    <i class="fa-solid fa-shield-halved mr-1"></i>
                    All posts are AUDITED
                </p>
                <p class="text-zinc-400 text-xs leading-relaxed">
                    Our security team reviews every submission.
                    <span class="text-red-400 font-bold">Fake or fraudulent links will result in PERMANENT BAN</span>
                    from the airdrop campaign.
                </p>
            </div>

            <div class="bg-zinc-800/80 border border-zinc-700 rounded-xl p-3 mb-4">
                <p class="text-zinc-500 text-[10px] uppercase mb-1">Post being verified:</p>
                <a href="${submission.url}" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm truncate block">${submission.url}</a>
            </div>

            <label class="flex items-start gap-3 text-left bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 mb-4 cursor-pointer hover:border-amber-500/50 transition-colors">
                <input type="checkbox" id="confirmCheckbox" class="mt-1 w-4 h-4 accent-amber-500">
                <span class="text-xs text-zinc-300">
                    I confirm this is <span class="text-white font-bold">my authentic public post</span> and I understand that
                    <span class="text-red-400 font-bold">submitting fake content will result in permanent ban</span>.
                </span>
            </label>

            <div class="flex gap-3">
                <button id="deletePostBtn" data-submission-id="${submission.submissionId}"
                        class="flex-1 bg-red-900/50 hover:bg-red-800 text-red-300 hover:text-white py-3 rounded-xl font-medium text-sm transition-colors border border-red-500/30">
                    <i class="fa-solid fa-trash mr-1"></i> Delete Post
                </button>
                <button id="finalConfirmBtn" data-submission-id="${submission.submissionId}"
                        class="flex-1 bg-green-600/50 text-green-200 py-3 rounded-xl font-bold text-sm cursor-not-allowed transition-colors"
                        disabled>
                    <i class="fa-solid fa-lock mr-1"></i> Confirm & Earn
                </button>
            </div>

            <p class="text-zinc-600 text-[10px] mt-4">
                <i class="fa-solid fa-info-circle mr-1"></i>
                By confirming, you agree to our audit process and anti-fraud policies.
            </p>
        </div>
    `;
    openModal(modalContent, 'max-w-md');

    document.getElementById('deletePostBtn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const submissionId = btn.dataset.submissionId;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Deleting...';

        try {
            await db.deleteSubmission(submissionId);
            showToast("Post deleted. No penalty applied.", "info");
            closeModal();
            await loadAirdropData();
            updateContent();
        } catch (err) {
            showToast(err.message, "error");
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-trash mr-1"></i> Delete Post';
        }
    });

    const checkbox = document.getElementById('confirmCheckbox');
    const confirmBtn = document.getElementById('finalConfirmBtn');

    checkbox?.addEventListener('change', () => {
        if (checkbox.checked) {
            confirmBtn.disabled = false;
            confirmBtn.className = 'flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer';
            confirmBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Confirm & Earn';
        } else {
            confirmBtn.disabled = true;
            confirmBtn.className = 'flex-1 bg-green-600/50 text-green-200 py-3 rounded-xl font-bold text-sm cursor-not-allowed transition-colors';
            confirmBtn.innerHTML = '<i class="fa-solid fa-lock mr-1"></i> Confirm & Earn';
        }
    });

    confirmBtn?.addEventListener('click', handleConfirmAuthenticity);
}

async function handleConfirmAuthenticity(e) {
    const button = e.currentTarget;
    const submissionId = button.dataset.submissionId;
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verifying...';
    try {
        await db.confirmSubmission(submissionId);
        showToast("Success! Points added.", "success");
        closeModal();
        await loadAirdropData();
        updateContent();
    } catch (error) {
        showToast("Verification failed.", "error");
        button.disabled = false;
        button.innerHTML = 'Try Again';
    }
}

async function handleSubmissionAction(e) {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'confirm') {
        const sub = airdropState.userSubmissions.find(s => s.submissionId === id);
        if(sub) openConfirmationModal(sub);
    } else if (action === 'delete') {
        if (!confirm("Remove this submission?")) return;
        try {
            await db.deleteSubmission(id);
            showToast("Removed.", "info");
            await loadAirdropData();
            updateContent();
        } catch (err) { showToast(err.message, "error"); }
    }
}

async function handleSubmitUgc(e) {
    const btn = e.target.closest('#submit-content-btn');
    if (!btn) return;

    const input = document.getElementById('content-url-input');
    const url = input?.value.trim();
    if (!url || !url.startsWith('http')) return showToast("Enter a valid URL.", "warning");

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    try {
        await db.addSubmission(url);

        showToast("Submitted! Your post is now under security audit.", "info");

        input.value = '';

        await loadAirdropData();
        airdropState.historyExpanded = true;
        updateContent();

        // Scroll to history section
        setTimeout(() => {
            document.getElementById('history-toggle-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);

    } catch (err) {
        showToast(err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleTaskClick(e) {
    const card = e.target.closest('.task-card');
    if (!card) return;
    const taskId = card.dataset.id;
    const url = card.dataset.url;
    if (url) window.open(url, '_blank');
    const task = airdropState.dailyTasks.find(t => t.id === taskId);
    if (!task || !task.eligible) return;
    try {
        await db.recordDailyTaskCompletion(task, airdropState.user.pointsMultiplier);
        showToast(`Task completed! +${task.points} pts`, "success");
        await loadAirdropData();
        updateContent();
    } catch (err) { if(!err.message.includes("Cooldown")) showToast(err.message, "error"); }
}

async function handleClaimAirdrop() {
    const info = airdropState.claimInfo;
    const proof = airdropState.claimProof;
    if (!info || !proof || info.claimed || !info.isActive) return;

    airdropState.claimLoading = true;
    updateContent();

    try {
        await AirdropClaimTx.claimAirdrop({
            amount: proof.amount,
            merkleProof: proof.proof,
            button: document.getElementById('claim-airdrop-btn'),
            onSuccess: async () => {
                airdropState.claimLoading = false;
                // Reload claim data to reflect claimed status
                await loadClaimData();
                updateContent();
            },
            onError: () => {
                airdropState.claimLoading = false;
                updateContent();
            }
        });
    } catch (e) {
        console.error('[Airdrop] Claim error:', e);
        airdropState.claimLoading = false;
        updateContent();
    }
}

function checkAndShowVerificationModal() {
    const readyToVerify = getActionRequiredItems();

    if (readyToVerify.length > 0) {
        setTimeout(() => {
            openConfirmationModal(readyToVerify[0]);
        }, 500);
    }
}

function handleActionRequiredClick() {
    const items = getActionRequiredItems();
    if (items.length > 0) {
        openConfirmationModal(items[0]);
    }
}

// =======================================================
//  6. EXPORT
// =======================================================

export const AirdropPage = {
    async render(isNewPage) {
        const container = document.getElementById('airdrop');
        if (!container) return;

        injectAirdropStyles();

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div id="loading-state" class="fixed inset-0 z-50 bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex flex-col items-center justify-center px-6">
                    <div class="text-center">
                        <div class="w-20 h-20 mx-auto mb-4 airdrop-float-slow">
                            <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-2xl">
                        </div>
                        <p class="text-zinc-400 text-sm mb-4">Loading your campaign...</p>
                        <div class="flex items-center justify-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0s;"></div>
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0.1s;"></div>
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0.2s;"></div>
                        </div>
                    </div>
                </div>

                <div id="airdrop-main" class="hidden">
                    <div id="airdrop-header">${renderHeader()}</div>
                    <div id="airdrop-body" class="max-w-2xl mx-auto pb-24">
                        <div id="main-content"></div>
                    </div>
                </div>
            `;
            this.attachListeners();
        }

        try {
            const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));

            await Promise.all([loadAirdropData(), loadAgoraData(), loadClaimData(), minLoadingTime]);

            const loader = document.getElementById('loading-state');
            const mainArea = document.getElementById('airdrop-main');
            const content = document.getElementById('main-content');

            if(loader) {
                loader.style.transition = 'opacity 0.5s ease-out';
                loader.style.opacity = '0';
                await new Promise(resolve => setTimeout(resolve, 500));
                loader.classList.add('hidden');
            }

            if(mainArea) mainArea.classList.remove('hidden');
            if(content) {
                content.classList.remove('hidden');
                updateContent();
            }

            checkAndShowVerificationModal();

        } catch (e) {
            console.error(e);
            renderError(container, "Failed to load interface.");
        }
    },

    attachListeners() {
        const body = document.getElementById('airdrop-body');
        const header = document.getElementById('airdrop-header');
        header?.addEventListener('click', handleTabSwitch);
        body?.addEventListener('click', (e) => {
            if(e.target.closest('#submit-content-btn')) handleSubmitUgc(e);
            if(e.target.closest('.task-card')) handleTaskClick(e);
            if(e.target.closest('.action-btn')) handleSubmissionAction(e);
            // copy-viral-btn removed — now uses per-post copy-agora-link
            if(e.target.closest('.ranking-tab-btn')) handleRankingSwitch(e);
            if(e.target.closest('.nav-pill-btn')) handleTabSwitch(e);
            if(e.target.closest('#history-toggle-btn')) handleHistoryToggle();
            if(e.target.closest('#action-required-btn')) handleActionRequiredClick();
            if(e.target.closest('#claim-airdrop-btn')) handleClaimAirdrop();
            if(e.target.closest('#rank-snippet-btn')) { airdropState.activeTab = 'ranking'; updateContent(); }

            // Navigate to Agora
            const agoraBtn = e.target.closest('.agora-nav-btn');
            if (agoraBtn) { handlePlatformCardClick(agoraBtn.dataset.target || 'agora'); return; }

            // Copy Agora post share link
            const copyLink = e.target.closest('.copy-agora-link');
            if (copyLink) {
                const url = copyLink.dataset.url;
                if (url) {
                    navigator.clipboard.writeText(url).then(() => {
                        showToast('Link copied! Paste it on social media.', 'success');
                        const icon = copyLink.querySelector('i');
                        if (icon) { icon.className = 'fa-solid fa-check text-green-400 text-xs'; setTimeout(() => { icon.className = 'fa-solid fa-copy text-zinc-400 text-xs'; }, 2000); }
                    }).catch(() => showToast('Failed to copy.', 'error'));
                }
                return;
            }

            const platformCard = e.target.closest('.platform-action-card');
            if (platformCard && !platformCard.classList.contains('completed')) {
                const targetPage = platformCard.dataset.targetPage;
                if (targetPage) {
                    handlePlatformCardClick(targetPage);
                }
            }
        });
    },

    update(isConnected) {
        if (airdropState.isConnected !== isConnected) {
            this.render(true);
        }
    }
};

function handlePlatformCardClick(pageName) {
    const menuLink = document.querySelector(`a[data-target="${pageName}"]`) ||
                     document.querySelector(`[data-target="${pageName}"]`);

    if (menuLink) {
        menuLink.click();

        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth < 768) {
            sidebar.classList.add('hidden');
        }
        return;
    }

    const sections = document.querySelectorAll('main > section');
    const targetSection = document.getElementById(pageName);

    if (targetSection) {
        sections.forEach(s => s.classList.add('hidden'));
        targetSection.classList.remove('hidden');

        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active', 'bg-zinc-700', 'text-white');
            link.classList.add('text-zinc-400');
        });

        const activeLink = document.querySelector(`[data-target="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active', 'bg-zinc-700', 'text-white');
            activeLink.classList.remove('text-zinc-400');
        }
        return;
    }

    console.warn('Could not navigate to:', pageName);
}
