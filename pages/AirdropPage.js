// pages/AirdropPage.js
// ✅ VERSION V5.0: Redesigned for 4-Tier NFT System (200 NFTs) + Enhanced UX

import { State } from '../state.js';
import * as db from '../modules/firebase-auth-service.js';
import { showToast, closeModal, openModal } from '../ui-feedback.js';
import { formatAddress, renderNoData, formatBigNumber, renderLoading, renderError } from '../utils.js';

// ==========================================================
//  1. CONSTANTES E HELPERS
// ==========================================================

const DEFAULT_HASHTAGS = "#BKC #Backcoin #Airdrop";
const AUTO_APPROVE_HOURS = 2;

// ✅ Mensagens de auditoria para "trava psicológica"
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

// ✅ Mapeamento de ações para páginas do DApp
const PLATFORM_ACTION_PAGES = {
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

// ✅ V5.0: 4-Tier NFT System Configuration
const NFT_TIERS = [
    { name: 'Diamond', icon: '💎', ranks: '#1 – #5',     count: 5,   color: 'cyan',   burn: '0%',  receive: '100%', gradient: 'from-cyan-500/20 to-cyan-900/10',  border: 'border-cyan-500/30',  text: 'text-cyan-300'  },
    { name: 'Gold',    icon: '🥇', ranks: '#6 – #25',    count: 20,  color: 'yellow', burn: '10%', receive: '90%',  gradient: 'from-yellow-500/20 to-yellow-900/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    { name: 'Silver',  icon: '🥈', ranks: '#26 – #75',   count: 50,  color: 'gray',   burn: '25%', receive: '75%',  gradient: 'from-gray-400/20 to-gray-800/10',  border: 'border-gray-400/30',  text: 'text-gray-300'  },
    { name: 'Bronze',  icon: '🥉', ranks: '#76 – #200',  count: 125, color: 'amber',  burn: '40%', receive: '60%',  gradient: 'from-amber-600/20 to-amber-900/10', border: 'border-amber-600/30', text: 'text-amber-500' },
];

const TOTAL_NFTS = 200;

function formatTimeLeft(ms) {
    if (!ms || ms <= 0) return 'Ready';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

// ✅ V5.0: Updated loading messages for 4-tier system
const LOADING_MESSAGES = [
    { title: "🚀 Share & Earn!", subtitle: "Post on social media and win exclusive NFT Boosters" },
    { title: "💎 Top 5 Get Diamond NFTs!", subtitle: "0% burn rate — keep 100% of your mining rewards" },
    { title: "📱 Post. Share. Earn.", subtitle: "It's that simple — spread the word and climb the ranks" },
    { title: "🔥 Go Viral, Get Rewarded!", subtitle: "The more you post, the higher your tier" },
    { title: "🎯 200 NFTs Up For Grabs!", subtitle: "Diamond, Gold, Silver & Bronze — every post counts" },
    { title: "🏆 4 Tiers of NFT Rewards!", subtitle: "From Bronze (60% rewards) to Diamond (100% rewards)" },
    { title: "📈 Your Posts = Your Rewards!", subtitle: "Each submission brings you closer to the top" },
    { title: "⭐ Be a Backcoin Ambassador!", subtitle: "Share our vision and earn exclusive NFT boosters" }
];

function getRandomLoadingMessage() {
    return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
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
    activeEarnTab: 'post',
    activeRanking: 'points',
    isGuideOpen: false 
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
        
        .earn-tab-btn { transition: all 0.2s ease; }
        .earn-tab-btn.active {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border-color: #f59e0b;
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

        /* V5.0: Tier card hover effects */
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

        /* V5.0: Stat counter animation */
        .stat-value {
            animation: count-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* V5.0: Rank badge */
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

        /* V5.0: Step indicator */
        .step-connector {
            position: absolute;
            left: 13px;
            top: 28px;
            bottom: -12px;
            width: 2px;
            background: linear-gradient(to bottom, #f59e0b, rgba(245,158,11,0.1));
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

            // Carregar dados de uso da plataforma
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

// =======================================================
//  4. COMPONENTES DE RENDERIZAÇÃO (UI) — V5.0 REDESIGN
// =======================================================

// ✅ V5.0: Helper para calcular rank estimado do usuário
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

function renderHeader() {
    const { user } = airdropState;
    const totalPoints = user?.totalPoints || 0;
    const platformPoints = user?.platformUsagePoints || 0;
    const approvedCount = user?.approvedSubmissionsCount || 0;
    const multiplier = getMultiplierByTier(approvedCount);
    
    // Calcula rank e tier estimado
    const postsList = airdropState.leaderboards?.top100ByPosts || [];
    const userRank = getUserEstimatedRank(postsList);
    const userTier = getUserTierFromRank(userRank);

    return `
        <!-- Mobile Header -->
        <div class="md:hidden px-4 pt-4 pb-2">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 airdrop-float-slow">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-lg font-black text-white leading-none">Airdrop</h1>
                        <span class="text-[9px] text-zinc-500">${TOTAL_NFTS} NFTs • 4 Tiers</span>
                    </div>
                </div>
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm">
                    <i class="fa-brands fa-telegram"></i>
                </a>
            </div>
            
            ${airdropState.isConnected ? `
            <!-- Stats Row Mobile — V5.0 Compact -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 mb-3">
                <div class="grid grid-cols-4 gap-2">
                    <div class="text-center">
                        <span class="text-sm font-bold text-amber-400 stat-value">${totalPoints.toLocaleString()}</span>
                        <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Points</p>
                    </div>
                    <div class="text-center">
                        <span class="text-sm font-bold text-green-400 stat-value">${approvedCount}</span>
                        <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Posts</p>
                    </div>
                    <div class="text-center">
                        <span class="text-sm font-bold text-purple-400 stat-value">${multiplier.toFixed(1)}x</span>
                        <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Boost</p>
                    </div>
                    <div class="text-center">
                        ${userTier ? `
                            <span class="text-sm font-bold ${userTier.text} stat-value">${userTier.icon}</span>
                            <p class="text-[7px] text-zinc-500 uppercase tracking-wider">#${userRank}</p>
                        ` : `
                            <span class="text-sm font-bold text-zinc-600 stat-value">—</span>
                            <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Rank</p>
                        `}
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Mobile Navigation -->
            <div class="flex gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800">
                ${renderMobileNavPill('earn', 'fa-coins', 'Earn')}
                ${renderMobileNavPill('history', 'fa-clock-rotate-left', 'History')}
                ${renderMobileNavPill('leaderboard', 'fa-trophy', 'Ranking')}
            </div>
        </div>

        <!-- Desktop Header — V5.0 Redesign -->
        <div class="hidden md:block px-4 pt-6 pb-4">
            <div class="flex items-center justify-between mb-5">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 airdrop-float relative">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-2xl font-black text-white">Airdrop <span class="airdrop-gradient-text">Campaign</span></h1>
                        <p class="text-zinc-500 text-sm">${TOTAL_NFTS} NFT Boosters • 4 Reward Tiers</p>
                    </div>
                </div>
                
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 px-4 py-2 rounded-full transition-all hover:scale-105">
                    <i class="fa-brands fa-telegram"></i>
                    <span class="text-sm font-bold">Community</span>
                </a>
            </div>

            ${airdropState.isConnected ? `
            <!-- Stats Row Desktop — V5.0 with Tier indicator -->
            <div class="grid grid-cols-5 gap-3 mb-4">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-amber-400">${totalPoints.toLocaleString()}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Total Points</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-green-400">${approvedCount}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Approved Posts</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-purple-400">${multiplier.toFixed(1)}x</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Multiplier</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-cyan-400">${platformPoints.toLocaleString()}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Platform Usage</p>
                </div>
                <div class="bg-zinc-900/80 border ${userTier ? userTier.border : 'border-zinc-800'} rounded-xl p-3 text-center relative overflow-hidden">
                    ${userTier ? `
                        <div class="absolute inset-0 bg-gradient-to-br ${userTier.gradient} opacity-30"></div>
                        <span class="text-xl font-bold ${userTier.text} relative z-10">${userTier.icon} #${userRank}</span>
                        <p class="text-[10px] text-zinc-500 uppercase relative z-10">${userTier.name} Tier</p>
                    ` : `
                        <span class="text-xl font-bold text-zinc-600">—</span>
                        <p class="text-[10px] text-zinc-500 uppercase">Your Rank</p>
                    `}
                </div>
            </div>
            ` : ''}

            <!-- Desktop Navigation -->
            <div class="flex justify-center">
                <div class="bg-zinc-900/80 p-1.5 rounded-full border border-zinc-800 inline-flex gap-1">
                    ${renderNavPill('earn', 'fa-coins', 'Earn Points')}
                    ${renderNavPill('history', 'fa-clock-rotate-left', 'My History')}
                    ${renderNavPill('leaderboard', 'fa-trophy', 'Ranking')}
                </div>
            </div>
        </div>
    `;
}

function renderMobileNavPill(target, icon, label) {
    const isActive = airdropState.activeTab === target;
    return `
        <button data-target="${target}" 
                class="nav-pill-btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1
                       ${isActive ? 'airdrop-tab-active shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}">
            <i class="fa-solid ${icon} text-sm"></i>
            <span>${label}</span>
        </button>
    `;
}

function renderNavPill(target, icon, label) {
    const isActive = airdropState.activeTab === target;
    return `
        <button data-target="${target}" 
                class="nav-pill-btn px-5 py-2.5 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer
                       ${isActive ? 'airdrop-tab-active shadow-lg shadow-amber-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}">
            <i class="fa-solid ${icon}"></i> ${label}
        </button>
    `;
}

// =======================================================
//  EARN TAB - Com sub-tabs (Post, Platform, Tasks)
// =======================================================

function renderEarnTab() {
    if (!airdropState.isConnected) {
        return `
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-24 h-24 mx-auto mb-6 airdrop-float">
                    <img src="./assets/airdrop.png" alt="Connect" class="w-full h-full object-contain opacity-50">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm max-w-xs mx-auto mb-4">Connect to start earning points and win NFT rewards.</p>
                
                <!-- V5.0: Mini tier preview for non-connected users -->
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
        <div class="px-4 airdrop-fade-up">
            <!-- Earn Sub-Navigation -->
            <div class="flex gap-2 mb-4">
                <button data-earn-tab="post" class="earn-tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 ${airdropState.activeEarnTab === 'post' ? 'active' : 'text-zinc-400'}">
                    <i class="fa-solid fa-share-nodes"></i> Post & Share
                </button>
                <button data-earn-tab="platform" class="earn-tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 ${airdropState.activeEarnTab === 'platform' ? 'active' : 'text-zinc-400'}">
                    <i class="fa-solid fa-gamepad"></i> Use Platform
                </button>
                <button data-earn-tab="tasks" class="earn-tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 ${airdropState.activeEarnTab === 'tasks' ? 'active' : 'text-zinc-400'}">
                    <i class="fa-solid fa-bolt"></i> Tasks
                </button>
            </div>

            <!-- Sub-tab Content -->
            <div id="earn-content">
                ${airdropState.activeEarnTab === 'post' ? renderPostSection() : ''}
                ${airdropState.activeEarnTab === 'platform' ? renderPlatformSection() : ''}
                ${airdropState.activeEarnTab === 'tasks' ? renderTasksSection() : ''}
            </div>
        </div>
    `;
}

// --- POST SECTION — V5.0 Redesign ---
function renderPostSection() {
    const { user } = airdropState;
    const refCode = user?.referralCode || 'CODE';
    const shortLink = `https://backcoin.org/?ref=${refCode}`;

    return `
        <div class="space-y-4">
            <!-- V5.0: Priority Banner with tier info -->
            <div class="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-3">
                <div class="flex items-center gap-2 text-amber-400 text-xs font-medium">
                    <i class="fa-solid fa-fire"></i>
                    <span>Highest rewards! Post on social media to climb the ranking and win NFTs.</span>
                </div>
            </div>

            <!-- V5.0: Steps Card — Redesigned with connected flow -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
                <div class="absolute top-3 right-3 w-14 h-14 opacity-10 airdrop-float">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                
                <h2 class="text-base font-bold text-white mb-5 flex items-center gap-2">
                    <i class="fa-solid fa-rocket text-amber-400"></i> 3 Simple Steps
                </h2>
                
                <div class="space-y-5">
                    <!-- Step 1 -->
                    <div class="flex gap-3 items-start relative">
                        <div class="flex flex-col items-center">
                            <div class="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-black font-bold text-xs relative z-10">1</div>
                            <div class="w-0.5 h-full bg-gradient-to-b from-amber-500/50 to-transparent mt-1 min-h-[20px]"></div>
                        </div>
                        <div class="flex-1 pb-2">
                            <p class="text-white text-sm font-medium mb-2">Copy your referral link</p>
                            <div class="bg-black/40 p-2.5 rounded-lg border border-zinc-700/50 mb-2">
                                <p class="text-xs font-mono text-amber-400 break-all">${shortLink}</p>
                                <p class="text-xs font-mono text-zinc-600 mt-1">${DEFAULT_HASHTAGS}</p>
                            </div>
                            <button id="copy-viral-btn" class="w-full cta-mega text-black font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2">
                                <i class="fa-solid fa-copy"></i> Copy Link & Tags
                            </button>
                        </div>
                    </div>
                    
                    <!-- Step 2 -->
                    <div class="flex gap-3 items-start relative">
                        <div class="flex flex-col items-center">
                            <div class="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-white font-bold text-xs relative z-10">2</div>
                            <div class="w-0.5 h-full bg-gradient-to-b from-zinc-600/50 to-transparent mt-1 min-h-[20px]"></div>
                        </div>
                        <div class="flex-1 pb-2">
                            <p class="text-white text-sm font-medium mb-2">Post on social media</p>
                            <div class="grid grid-cols-4 gap-2">
                                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shortLink + ' ' + DEFAULT_HASHTAGS)}" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2.5 rounded-lg bg-black/60 border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-x-twitter text-white text-base"></i>
                                    <span class="text-[9px] text-zinc-400">X</span>
                                </a>
                                <a href="https://www.tiktok.com" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2.5 rounded-lg bg-black/60 border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-tiktok text-white text-base"></i>
                                    <span class="text-[9px] text-zinc-400">TikTok</span>
                                </a>
                                <a href="https://www.instagram.com" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2.5 rounded-lg bg-black/60 border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-instagram text-pink-400 text-base"></i>
                                    <span class="text-[9px] text-zinc-400">Insta</span>
                                </a>
                                <a href="https://www.youtube.com" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2.5 rounded-lg bg-black/60 border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-youtube text-red-500 text-base"></i>
                                    <span class="text-[9px] text-zinc-400">YouTube</span>
                                </a>
                            </div>
                            <p class="text-amber-400/70 text-[10px] mt-2 flex items-center gap-1">
                                <i class="fa-solid fa-exclamation-circle"></i> Post must be PUBLIC
                            </p>
                        </div>
                    </div>
                    
                    <!-- Step 3 -->
                    <div class="flex gap-3 items-start">
                        <div class="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-white font-bold text-xs">3</div>
                        <div class="flex-1">
                            <p class="text-white text-sm font-medium mb-2">Submit your post link</p>
                            <div class="relative">
                                <input type="url" id="content-url-input" 
                                       placeholder="Paste your post URL here..."
                                       class="w-full bg-black/50 border border-zinc-600 rounded-xl pl-3 pr-20 py-3 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-zinc-600">
                                <button id="submit-content-btn" 
                                        class="absolute right-1.5 top-1.5 bottom-1.5 bg-green-600 hover:bg-green-500 text-white font-bold px-3 rounded-lg transition-all text-sm">
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- V5.0: NFT Tier Preview Card (compact) -->
            <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-gem text-amber-500 text-[10px]"></i> NFT Reward Tiers
                    </h3>
                    <span class="text-[10px] text-zinc-600">${TOTAL_NFTS} total</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${NFT_TIERS.map(tier => `
                        <div class="tier-card flex items-center gap-2.5 p-2 rounded-lg bg-gradient-to-r ${tier.gradient} border ${tier.border}">
                            <span class="text-lg">${tier.icon}</span>
                            <div class="min-w-0">
                                <span class="${tier.text} font-bold text-xs">${tier.name}</span>
                                <div class="flex items-center gap-1.5">
                                    <span class="text-zinc-400 text-[10px]">${tier.ranks}</span>
                                    <span class="text-zinc-600 text-[10px]">•</span>
                                    <span class="text-green-400/80 text-[10px]">${tier.receive}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
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
        <div class="space-y-4">
            <!-- Info Banner -->
            <div class="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl p-3">
                <div class="flex items-center gap-2 text-purple-400 text-xs font-medium">
                    <i class="fa-solid fa-gamepad"></i>
                    <span>Earn points by using Backcoin features! Each action counts.</span>
                </div>
            </div>

            <!-- Progress Card -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-white text-sm font-medium">Platform Mastery</span>
                    <span class="text-amber-400 text-xs font-bold">${completedActions}/${totalActions}</span>
                </div>
                <div class="progress-bar-bg h-2 rounded-full">
                    <div class="progress-bar-fill h-full rounded-full" style="width: ${progressPercent}%"></div>
                </div>
                <div class="flex justify-between mt-2">
                    <p class="text-zinc-500 text-[10px]">Complete actions to earn points</p>
                    <p class="text-cyan-400 text-[10px] font-bold">${platformPoints.toLocaleString()} pts earned</p>
                </div>
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

            <!-- Help Text -->
            <div class="text-center">
                <p class="text-zinc-500 text-[10px]">
                    <i class="fa-solid fa-info-circle mr-1"></i>
                    Points are automatically awarded when you use platform features
                </p>
            </div>
        </div>
    `;
}

// --- TASKS SECTION ---
function renderTasksSection() {
    const tasks = airdropState.dailyTasks || [];
    const eligibleTasks = tasks.filter(t => t.eligible);
    const completedTasks = tasks.filter(t => !t.eligible && t.timeLeftMs > 0);

    return `
        <div class="space-y-4">
            <!-- Info Banner -->
            <div class="bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-xl p-3">
                <div class="flex items-center gap-2 text-yellow-400 text-xs font-medium">
                    <i class="fa-solid fa-bolt"></i>
                    <span>Complete daily tasks for bonus points!</span>
                </div>
            </div>

            ${eligibleTasks.length > 0 ? `
                <div>
                    <h3 class="text-white text-sm font-medium mb-2">Available Tasks</h3>
                    <div class="space-y-2">
                        ${eligibleTasks.map(task => `
                            <div class="task-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 cursor-pointer hover:border-amber-500/50 transition-colors"
                                 data-id="${task.id}" data-url="${task.url || ''}">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
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
                    </div>
                </div>
            ` : ''}

            ${completedTasks.length > 0 ? `
                <div>
                    <h3 class="text-zinc-500 text-sm font-medium mb-2">On Cooldown</h3>
                    <div class="space-y-2">
                        ${completedTasks.map(task => `
                            <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 opacity-50">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
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
            ` : ''}

            ${tasks.length === 0 ? `
                <div class="text-center py-8">
                    <i class="fa-solid fa-check-circle text-zinc-600 text-3xl mb-3"></i>
                    <p class="text-zinc-500 text-sm">No tasks available right now</p>
                    <p class="text-zinc-600 text-xs mt-1">Check back later!</p>
                </div>
            ` : ''}
        </div>
    `;
}

// --- POST TAB (Legacy - mantido por compatibilidade) ---
function renderPostTab() {
    return renderEarnTab();
}

function renderDailyTasksCompact() {
    const eligibleTasks = airdropState.dailyTasks.filter(t => !t.error && t.eligible);
    
    if (eligibleTasks.length === 0) return '';
    
    return `
        <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <i class="fa-solid fa-bolt text-yellow-400"></i> Quick Tasks
            </h3>
            <div class="space-y-2">
                ${eligibleTasks.slice(0, 3).map(task => `
                    <div class="task-card flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                         data-id="${task.id}" data-url="${task.url || ''}">
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-star text-yellow-400"></i>
                            <span class="text-sm text-white">${task.title}</span>
                        </div>
                        <span class="text-green-400 text-xs font-bold">+${Math.round(task.points)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// --- HISTORY TAB ---
function renderHistoryTab() {
    const { user, userSubmissions } = airdropState;
    
    if (!airdropState.isConnected) {
        return `
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-20 h-20 mx-auto mb-4 opacity-50">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm">Connect to view your submission history.</p>
            </div>
        `;
    }
    
    const now = Date.now();
    const twoHoursMs = AUTO_APPROVE_HOURS * 60 * 60 * 1000;
    
    const actionRequiredItems = userSubmissions.filter(sub => 
        ['pending', 'auditing'].includes(sub.status) && 
        sub.submittedAt && 
        (now - sub.submittedAt.getTime() >= twoHoursMs)
    );

    const approvedCount = user?.approvedSubmissionsCount || 0;
    const pendingCount = userSubmissions.filter(s => ['pending', 'auditing'].includes(s.status)).length;
    const rejectedCount = userSubmissions.filter(s => s.status === 'rejected').length;

    return `
        <div class="px-4 space-y-4 airdrop-fade-up">
            
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-green-400">${approvedCount}</span>
                    <p class="text-[10px] text-zinc-500">Approved</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-amber-400">${pendingCount}</span>
                    <p class="text-[10px] text-zinc-500">Pending</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-red-400">${rejectedCount}</span>
                    <p class="text-[10px] text-zinc-500">Rejected</p>
                </div>
            </div>

            <!-- Action Required -->
            ${actionRequiredItems.length > 0 ? `
                <div class="space-y-3">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bell text-amber-500 airdrop-bounce"></i> Ready to Verify (${actionRequiredItems.length})
                    </h3>
                    ${actionRequiredItems.map(sub => `
                        <div class="bg-gradient-to-r from-green-900/20 to-zinc-900 border border-green-500/30 rounded-xl p-4 relative overflow-hidden">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                            <div class="flex items-start gap-3 mb-3">
                                <div class="bg-green-500/20 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-check-circle text-green-400"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-white font-bold text-sm">Ready for Verification!</p>
                                    <a href="${sub.url}" target="_blank" class="text-blue-400 text-xs truncate block hover:underline mt-1">${sub.url}</a>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button data-action="delete" data-id="${sub.submissionId}" 
                                        class="action-btn flex-1 text-red-400 text-xs font-medium py-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors">
                                    Cancel
                                </button>
                                <button data-action="confirm" data-id="${sub.submissionId}" 
                                        class="action-btn flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                                    Confirm & Earn ✓
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Recent Submissions -->
            <div>
                <h3 class="text-sm font-bold text-white mb-3">Submission History</h3>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    ${userSubmissions.length === 0 ? 
                        `<div class="p-8 text-center">
                            <i class="fa-solid fa-inbox text-zinc-600 text-3xl mb-3"></i>
                            <p class="text-zinc-500 text-sm">No submissions yet</p>
                            <p class="text-zinc-600 text-xs mt-1">Create your first post to get started!</p>
                        </div>` : 
                        userSubmissions.slice(0, 10).map((sub, idx) => {
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
                                    <div class="mt-2 flex items-center gap-2 text-amber-400/80">
                                        <i class="fa-solid fa-magnifying-glass text-[10px] animate-pulse"></i>
                                        <span class="text-[10px] font-medium">Under security audit...</span>
                                    </div>
                                `;
                            }
                            
                            const pts = sub.pointsAwarded ? `+${sub.pointsAwarded}` : '-';
                            
                            return `
                                <div class="p-3 ${isLast ? '' : 'border-b border-zinc-800'} ${statusBg}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3 overflow-hidden">
                                            ${statusIcon}
                                            <a href="${sub.url}" target="_blank" class="text-zinc-400 text-xs truncate hover:text-blue-400 max-w-[180px] md:max-w-[300px]">${sub.url}</a>
                                        </div>
                                        <span class="font-mono font-bold ${sub.pointsAwarded ? 'text-green-400' : 'text-zinc-600'} text-sm shrink-0">${pts}</span>
                                    </div>
                                    ${statusText}
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        </div>
    `;
}

// --- LEADERBOARD TAB — V5.0 Redesign ---
function renderLeaderboard() {
    const postsList = airdropState.leaderboards?.top100ByPosts || []; 
    const pointsList = airdropState.leaderboards?.top100ByPoints || [];
    const activeRanking = airdropState.activeRanking || 'posts';
    
    function renderRankingItem(item, i, type) {
        const isMe = airdropState.user && item.walletAddress?.toLowerCase() === airdropState.user.walletAddress?.toLowerCase();
        const tierInfo = getTierInfo(i + 1);
        const bgClass = type === 'posts' ? 'bg-amber-500/10' : 'bg-green-500/10';
        const textClass = type === 'posts' ? 'text-amber-400' : 'text-green-400';
        const valueColor = type === 'posts' ? 'text-white' : 'text-green-400';
        const valueLabel = type === 'posts' ? 'posts' : 'pts';
        
        return `
            <div class="flex items-center justify-between p-3 ${isMe ? bgClass : 'hover:bg-zinc-800/50'} transition-colors">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full ${tierInfo.bg} flex items-center justify-center text-xs font-bold">${tierInfo.icon || (i+1)}</span>
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
        <div class="px-4 airdrop-fade-up">

            <!-- V5.0: NFT Rewards Banner — 4 Tiers with detailed info -->
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-900 border border-amber-500/20 rounded-xl p-4 mb-5 relative overflow-hidden">
                <div class="absolute top-2 right-2 w-14 h-14 airdrop-float opacity-20">
                    <img src="./assets/airdrop.png" alt="Prize" class="w-full h-full object-contain">
                </div>
                
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-bold text-white text-sm flex items-center gap-2">
                        <i class="fa-solid fa-trophy text-amber-400"></i> NFT Booster Rewards
                    </h3>
                    <span class="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">${TOTAL_NFTS} NFTs</span>
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

// ✅ V5.0: Updated getTierInfo for 4-tier system
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

    document.querySelectorAll('.nav-pill-btn').forEach(btn => {
        const target = btn.dataset.target;
        const isMobile = btn.closest('.md\\:hidden');
        
        if (isMobile) {
            if (target === airdropState.activeTab) {
                btn.classList.add('airdrop-tab-active', 'shadow-lg');
                btn.classList.remove('text-zinc-500');
            } else {
                btn.classList.remove('airdrop-tab-active', 'shadow-lg');
                btn.classList.add('text-zinc-500');
            }
        } else {
            if (target === airdropState.activeTab) {
                btn.classList.remove('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-800');
                btn.classList.add('airdrop-tab-active', 'shadow-lg', 'shadow-amber-500/20');
            } else {
                btn.classList.add('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-800');
                btn.classList.remove('airdrop-tab-active', 'shadow-lg', 'shadow-amber-500/20');
            }
        }
    });

    switch(airdropState.activeTab) {
        case 'earn': contentEl.innerHTML = renderEarnTab(); break;
        case 'post': contentEl.innerHTML = renderEarnTab(); break;
        case 'history': contentEl.innerHTML = renderHistoryTab(); break;
        case 'leaderboard': contentEl.innerHTML = renderLeaderboard(); break;
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

function handleEarnTabSwitch(e) {
    const btn = e.target.closest('.earn-tab-btn');
    if (btn && btn.dataset.earnTab) {
        airdropState.activeEarnTab = btn.dataset.earnTab;
        updateContent();
    }
}

function handleRankingSwitch(e) {
    const btn = e.target.closest('.ranking-tab-btn');
    if (btn && btn.dataset.ranking) {
        airdropState.activeRanking = btn.dataset.ranking;
        updateContent();
    }
}

function handleToggleGuide() {
    airdropState.isGuideOpen = !airdropState.isGuideOpen;
    updateContent();
}

function openConfirmationModal(submission) {
    const modalContent = `
        <div class="text-center">
            <!-- Imagem de CAUTION -->
            <div class="w-32 h-32 mx-auto mb-4">
                <img src="./assets/caution.png" alt="Caution" class="w-full h-full object-contain">
            </div>
            
            <!-- Título com alerta -->
            <h3 class="text-xl font-bold text-red-400 mb-2">⚠️ FINAL VERIFICATION</h3>
            
            <!-- Aviso de auditoria -->
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
            
            <!-- URL sendo confirmada -->
            <div class="bg-zinc-800/80 border border-zinc-700 rounded-xl p-3 mb-4">
                <p class="text-zinc-500 text-[10px] uppercase mb-1">Post being verified:</p>
                <a href="${submission.url}" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm truncate block">${submission.url}</a>
            </div>
            
            <!-- Checkbox de confirmação -->
            <label class="flex items-start gap-3 text-left bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 mb-4 cursor-pointer hover:border-amber-500/50 transition-colors">
                <input type="checkbox" id="confirmCheckbox" class="mt-1 w-4 h-4 accent-amber-500">
                <span class="text-xs text-zinc-300">
                    I confirm this is <span class="text-white font-bold">my authentic public post</span> and I understand that 
                    <span class="text-red-400 font-bold">submitting fake content will result in permanent ban</span>.
                </span>
            </label>
            
            <!-- Botões -->
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
            
            <!-- Rodapé de aviso -->
            <p class="text-zinc-600 text-[10px] mt-4">
                <i class="fa-solid fa-info-circle mr-1"></i>
                By confirming, you agree to our audit process and anti-fraud policies.
            </p>
        </div>
    `;
    openModal(modalContent, 'max-w-md'); 
    
    // Event listener para deletar post
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
            confirmBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Confirm & Earn ✓';
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
        
        showToast("📋 Submitted! Your post is now under security audit.", "info");
        
        input.value = '';
        
        await loadAirdropData();
        airdropState.activeTab = 'history'; 
        updateContent();
        
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

// ✅ Verifica e abre modal automaticamente se houver posts prontos para verificar
function checkAndShowVerificationModal() {
    const now = Date.now();
    const twoHoursMs = AUTO_APPROVE_HOURS * 60 * 60 * 1000;
    
    const readyToVerify = airdropState.userSubmissions.filter(sub => 
        ['pending', 'auditing'].includes(sub.status) && 
        sub.submittedAt && 
        (now - sub.submittedAt.getTime() >= twoHoursMs)
    );
    
    if (readyToVerify.length > 0) {
        airdropState.activeTab = 'history';
        updateContent();
        
        setTimeout(() => {
            openConfirmationModal(readyToVerify[0]);
        }, 500);
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
        
        const loadingMsg = getRandomLoadingMessage();

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div id="loading-state" class="fixed inset-0 z-50 bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex flex-col items-center justify-center px-6 overflow-y-auto py-8">
                    <!-- Floating coins effect -->
                    <div class="absolute inset-0 overflow-hidden pointer-events-none">
                        <div class="absolute top-[10%] left-[10%] w-6 h-6 opacity-20 airdrop-float" style="animation-delay: 0s;">
                            <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                        </div>
                        <div class="absolute top-[20%] right-[15%] w-8 h-8 opacity-15 airdrop-float" style="animation-delay: 0.5s;">
                            <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                        </div>
                        <div class="absolute bottom-[30%] left-[5%] w-5 h-5 opacity-10 airdrop-float" style="animation-delay: 1s;">
                            <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                        </div>
                        <div class="absolute bottom-[20%] right-[10%] w-7 h-7 opacity-15 airdrop-float" style="animation-delay: 1.5s;">
                            <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                        </div>
                    </div>
                    
                    <!-- Main content -->
                    <div class="relative z-10 text-center max-w-sm w-full">
                        <!-- Large airdrop icon -->
                        <div class="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 airdrop-float-slow">
                            <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-2xl">
                        </div>
                        
                        <!-- Motivational message -->
                        <h2 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight">${loadingMsg.title}</h2>
                        <p class="text-zinc-400 text-sm mb-6">${loadingMsg.subtitle}</p>
                        
                        <!-- V5.0: NFT Tiers Preview — 4 Tiers -->
                        <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6 text-left">
                            <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-3 text-center">
                                ${TOTAL_NFTS} NFT Booster Rewards • 4 Tiers
                            </p>
                            <div class="space-y-1.5">
                                ${NFT_TIERS.map(tier => `
                                    <div class="flex items-center justify-between p-1.5 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <span class="text-base">${tier.icon}</span>
                                            <span class="${tier.text} font-bold text-xs">${tier.name}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-zinc-500 text-[10px]">${tier.ranks}</span>
                                            <span class="text-green-400/60 text-[10px]">${tier.receive}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Loading indicator -->
                        <div class="flex items-center justify-center gap-2 text-amber-500">
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0s;"></div>
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0.1s;"></div>
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0.2s;"></div>
                        </div>
                        <p class="text-zinc-600 text-xs mt-3">Loading...</p>
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
            const minLoadingTime = new Promise(resolve => setTimeout(resolve, 4000));
            
            await Promise.all([loadAirdropData(), minLoadingTime]);
            
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
            if(e.target.closest('#guide-toggle-btn')) handleToggleGuide();
            if(e.target.closest('#submit-content-btn')) handleSubmitUgc(e);
            if(e.target.closest('.task-card')) handleTaskClick(e);
            if(e.target.closest('.action-btn')) handleSubmissionAction(e);
            if(e.target.closest('#copy-viral-btn')) handleCopySmartLink();
            if(e.target.closest('.ranking-tab-btn')) handleRankingSwitch(e);
            if(e.target.closest('.earn-tab-btn')) handleEarnTabSwitch(e);
            if(e.target.closest('.nav-pill-btn')) handleTabSwitch(e);
            
            const platformCard = e.target.closest('.platform-action-card');
            if (platformCard && !platformCard.classList.contains('completed')) {
                const targetPage = platformCard.dataset.targetPage;
                if (targetPage) {
                    console.log('🎯 Navigating to:', targetPage);
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

// ✅ Função para navegar para outra página do DApp
function handlePlatformCardClick(pageName) {
    console.log('🎯 Platform card clicked, navigating to:', pageName);
    
    const menuLink = document.querySelector(`a[data-target="${pageName}"]`) ||
                     document.querySelector(`[data-target="${pageName}"]`);
    
    if (menuLink) {
        console.log('✅ Found menu link, clicking...');
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
        console.log('✅ Found section, showing directly...');
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
    
    console.warn('⚠️ Could not navigate to:', pageName);
}