// pages/AirdropPage.js
// ✅ VERSION V2.2: Extended loading with NFT tier rewards info (7 tiers: Diamond to Crystal)

import { State } from '../state.js';
import * as db from '../modules/firebase-auth-service.js';
import { showToast, closeModal, openModal } from '../ui-feedback.js';
import { formatAddress, renderNoData, formatBigNumber, renderLoading, renderError } from '../utils.js';

// ==========================================================
//  1. CONSTANTES E HELPERS
// ==========================================================

const DEFAULT_HASHTAGS = "#BKC #Backcoin #Airdrop";
const AUTO_APPROVE_HOURS = 2;

// Motivational messages for loading screen
const LOADING_MESSAGES = [
    { title: "🚀 The More You Share, The More You Earn!", subtitle: "Every post brings you closer to amazing NFT rewards" },
    { title: "💎 Diamond NFT Awaits Top Creators!", subtitle: "Rank #1-2 and receive the most exclusive booster" },
    { title: "🔥 Join the Movement!", subtitle: "Be part of something bigger and earn while doing it" },
    { title: "⭐ Early Supporters Win Big!", subtitle: "Top 500 creators will receive exclusive NFT Boosters" },
    { title: "🎯 Complete Tasks, Earn Points!", subtitle: "Simple actions, real rewards - climb the leaderboard!" },
    { title: "🏆 7 Tiers of NFT Rewards!", subtitle: "Diamond, Platinum, Gold, Silver, Bronze, Iron & Crystal" },
    { title: "🎁 Your Effort = Your Reward!", subtitle: "The more you contribute, the better your NFT tier" },
    { title: "📈 Climb the Leaderboard!", subtitle: "From Crystal to Diamond - every post counts!" }
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
    basePoints: null,
    leaderboards: null,
    user: null,
    dailyTasks: [],
    userSubmissions: [],
    isBanned: false,
    activeTab: 'dashboard', 
    activeEarnSubTab: 'tasks',
    isGuideOpen: true 
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
        
        @keyframes shine {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
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
        
        @keyframes coin-drop {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(0) rotate(360deg); opacity: 1; }
        }
        
        .airdrop-float { animation: float 4s ease-in-out infinite; }
        .airdrop-float-slow { animation: float-slow 3s ease-in-out infinite; }
        .airdrop-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .airdrop-shine {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            background-size: 200% 100%;
            animation: shine 3s infinite;
        }
        .airdrop-bounce { animation: bounce-gentle 2s ease-in-out infinite; }
        .airdrop-spin { animation: spin-slow 20s linear infinite; }
        .airdrop-fade-up { animation: fade-up 0.5s ease-out forwards; }
        .airdrop-coin-drop { animation: coin-drop 0.6s ease-out forwards; }
        
        .airdrop-card {
            transition: all 0.3s ease;
        }
        .airdrop-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 40px rgba(245, 158, 11, 0.15);
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
        
        .task-card-hover:hover {
            border-color: rgba(245, 158, 11, 0.5);
            background: rgba(245, 158, 11, 0.05);
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
    airdropState.isBanned = false;

    try {
        const publicData = await db.getPublicAirdropData();
        airdropState.systemConfig = publicData.config;
        airdropState.leaderboards = publicData.leaderboards;
        airdropState.dailyTasks = publicData.dailyTasks;

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
        
        // Handle permission errors gracefully - don't show toast for expected errors
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
            console.warn('Firebase permissions issue - user may need to connect wallet or sign in');
            // Set empty defaults so UI can still render
            airdropState.systemConfig = airdropState.systemConfig || {};
            airdropState.leaderboards = airdropState.leaderboards || { top100ByPoints: [], top100ByPosts: [] };
            airdropState.dailyTasks = airdropState.dailyTasks || [];
            return; // Don't throw, let UI render with empty state
        }
        
        showToast("Error loading data. Please refresh.", "error");
    }
}

// =======================================================
//  4. COMPONENTES DE RENDERIZAÇÃO (UI)
// =======================================================

function renderHeader() {
    return `
        <!-- Mobile Header -->
        <div class="md:hidden px-4 pt-4 pb-2">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 airdrop-float-slow">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-xl font-black airdrop-gradient-text">Airdrop</h1>
                        <p class="text-[10px] text-zinc-500">Earn rewards</p>
                    </div>
                </div>
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 hover:bg-sky-500/20 transition-all">
                    <i class="fa-brands fa-telegram text-lg"></i>
                </a>
            </div>
            
            <!-- Mobile Navigation -->
            <div class="flex gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800">
                ${renderMobileNavPill('dashboard', 'fa-home', 'Home')}
                ${renderMobileNavPill('earn', 'fa-coins', 'Earn')}
                ${renderMobileNavPill('leaderboard', 'fa-trophy', 'Rank')}
            </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:block px-4 pt-6 pb-4">
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 airdrop-float">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-3xl font-black airdrop-gradient-text tracking-tight">Airdrop Zone</h1>
                        <p class="text-zinc-400 text-sm">Complete tasks, go viral, earn rewards</p>
                    </div>
                </div>
                
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 px-5 py-2.5 rounded-full transition-all hover:scale-105">
                    <i class="fa-brands fa-telegram text-xl"></i>
                    <span class="text-sm font-bold">Join Community</span>
                </a>
            </div>

            <!-- Desktop Navigation -->
            <div class="flex justify-center">
                <div class="bg-zinc-900/80 p-1.5 rounded-full border border-zinc-800 inline-flex gap-1 shadow-xl">
                    ${renderNavPill('dashboard', 'fa-chart-pie', 'Dashboard')}
                    ${renderNavPill('earn', 'fa-rocket', 'Earn Zone')}
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
                class="nav-pill-btn px-6 py-2.5 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer
                       ${isActive ? 'airdrop-tab-active shadow-lg shadow-amber-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-800 font-medium'}">
            <i class="fa-solid ${icon}"></i> ${label}
        </button>
    `;
}

// --- DASHBOARD ---
function renderDashboard() {
    const { user, userSubmissions } = airdropState;
    
    if (!airdropState.isConnected) {
        return `
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-24 h-24 mx-auto mb-6 airdrop-float">
                    <img src="./assets/airdrop.png" alt="Connect" class="w-full h-full object-contain opacity-50">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm max-w-xs mx-auto">Connect your wallet to view your dashboard and start earning rewards.</p>
            </div>
        `;
    }
    
    if (!user) {
        return `
            <div class="text-center px-4 py-12">
                <div class="w-20 h-20 mx-auto mb-4 airdrop-spin">
                    <img src="./assets/airdrop.png" alt="Loading" class="w-full h-full object-contain opacity-60">
                </div>
                <p class="text-zinc-400 text-sm">Loading profile...</p>
            </div>
        `;
    }

    const multiplier = getMultiplierByTier(user.approvedSubmissionsCount || 0);
    const now = Date.now();
    const twoHoursMs = AUTO_APPROVE_HOURS * 60 * 60 * 1000;
    
    const actionRequiredItems = userSubmissions.filter(sub => 
        ['pending', 'auditing'].includes(sub.status) && 
        sub.submittedAt && 
        (now - sub.submittedAt.getTime() >= twoHoursMs)
    );

    const pendingAuditCount = userSubmissions.filter(s => ['pending', 'auditing'].includes(s.status)).length;

    return `
        <div class="px-4 space-y-4 airdrop-fade-up">
            <!-- Stats Cards -->
            <div class="grid grid-cols-3 gap-3">
                <!-- Points -->
                <div class="airdrop-card bg-gradient-to-br from-amber-900/30 to-zinc-900 border border-amber-500/20 rounded-2xl p-4 text-center airdrop-pulse-glow">
                    <div class="w-10 h-10 mx-auto mb-2 airdrop-bounce">
                        <img src="./assets/airdrop.png" alt="Points" class="w-full h-full object-contain">
                    </div>
                    <span class="text-2xl md:text-3xl font-black text-amber-400">${(user.totalPoints || 0).toLocaleString()}</span>
                    <p class="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Points</p>
                </div>
                
                <!-- Multiplier -->
                <div class="airdrop-card bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center">
                    <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/10 flex items-center justify-center">
                        <i class="fa-solid fa-fire text-green-400 text-lg"></i>
                    </div>
                    <span class="text-2xl md:text-3xl font-black text-green-400">${multiplier.toFixed(1)}x</span>
                    <p class="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Boost</p>
                </div>
                
                <!-- Pending -->
                <div class="airdrop-card bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center">
                    <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <i class="fa-solid fa-clock text-blue-400 text-lg"></i>
                    </div>
                    <span class="text-2xl md:text-3xl font-black text-blue-400">${pendingAuditCount}</span>
                    <p class="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Pending</p>
                </div>
            </div>

            <!-- Action Center -->
            ${actionRequiredItems.length > 0 ? `
                <div class="space-y-3">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2 px-1">
                        <i class="fa-solid fa-bell text-amber-500 airdrop-bounce"></i> Action Required
                    </h3>
                    ${actionRequiredItems.map(sub => `
                        <div class="bg-gradient-to-r from-amber-900/20 to-zinc-900 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                            <div class="flex items-start gap-3 mb-3">
                                <div class="bg-amber-500/20 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-check-circle text-amber-400"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-white font-bold text-sm">Ready for Verification</p>
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
                                    Confirm ✓
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                    <i class="fa-solid fa-check-circle text-zinc-600 text-2xl mb-2"></i>
                    <p class="text-zinc-500 text-sm">No pending actions</p>
                </div>
            `}

            <!-- Recent Activity -->
            <div>
                <h3 class="text-sm font-bold text-white mb-3 px-1">Recent Activity</h3>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    ${userSubmissions.length === 0 ? 
                        '<p class="text-zinc-500 text-sm italic p-6 text-center">No submissions yet</p>' : 
                        userSubmissions.slice(0, 5).map((sub, idx) => {
                            const statusIcon = sub.status === 'approved' ? 
                                '<i class="fa-solid fa-check-circle text-green-400"></i>' : 
                                sub.status === 'rejected' ? 
                                '<i class="fa-solid fa-times-circle text-red-400"></i>' : 
                                '<i class="fa-solid fa-clock text-amber-400"></i>';
                            const pts = sub.pointsAwarded ? `+${sub.pointsAwarded}` : '-';
                            const isLast = idx === Math.min(userSubmissions.length, 5) - 1;
                            return `
                                <div class="flex items-center justify-between p-3 ${isLast ? '' : 'border-b border-zinc-800'}">
                                    <div class="flex items-center gap-3 overflow-hidden">
                                        ${statusIcon}
                                        <a href="${sub.url}" target="_blank" class="text-zinc-400 text-xs truncate hover:text-blue-400 max-w-[180px] md:max-w-[300px]">${sub.url}</a>
                                    </div>
                                    <span class="font-mono font-bold text-white text-sm shrink-0">${pts}</span>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        </div>
    `;
}

// --- EARN ZONE ---
function renderEarnZone() {
    const isTasks = airdropState.activeEarnSubTab === 'tasks';

    return `
        <div class="px-4 airdrop-fade-up">
            <!-- Sub Tabs -->
            <div class="flex gap-2 mb-6 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                <button class="earn-subtab-btn flex-1 py-2.5 text-sm font-bold rounded-lg transition-all
                               ${isTasks ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}" data-target="tasks">
                    <i class="fa-solid fa-tasks mr-2"></i>Tasks
                </button>
                <button class="earn-subtab-btn flex-1 py-2.5 text-sm font-bold rounded-lg transition-all
                               ${!isTasks ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}" data-target="content">
                    <i class="fa-solid fa-share-nodes mr-2"></i>Viral Post
                </button>
            </div>

            <div class="earn-content">
                ${isTasks ? renderDailyTasks() : renderContentCreation()}
            </div>
        </div>
    `;
}

function renderDailyTasks() {
    const eligibleTasks = airdropState.dailyTasks.filter(t => !t.error);
    
    if(eligibleTasks.length === 0) {
        return `
            <div class="text-center py-12">
                <div class="w-20 h-20 mx-auto mb-4 opacity-50">
                    <img src="./assets/airdrop.png" alt="No tasks" class="w-full h-full object-contain">
                </div>
                <p class="text-zinc-400 text-sm">No active tasks right now</p>
                <p class="text-zinc-600 text-xs mt-1">Check back later!</p>
            </div>
        `;
    }

    return `
        <div class="space-y-3">
            ${eligibleTasks.map(task => {
                const isCooldown = !task.eligible && task.timeLeftMs > 0;
                return `
                    <div class="task-card task-card-hover bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 transition-all cursor-pointer
                                ${isCooldown ? 'opacity-50' : ''}"
                         data-id="${task.id}" data-url="${task.url || ''}">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                <i class="fa-solid ${isCooldown ? 'fa-hourglass-half' : 'fa-star'} text-xl ${isCooldown ? 'text-zinc-500' : 'text-amber-400'}"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-bold text-white text-sm truncate">${task.title}</h4>
                                <div class="flex items-center gap-3 mt-1">
                                    <span class="text-green-400 text-xs font-bold">+${Math.round(task.points)} pts</span>
                                    <span class="text-zinc-500 text-xs">${task.cooldownHours}h cooldown</span>
                                </div>
                            </div>
                            <div class="shrink-0">
                                ${isCooldown ? 
                                    '<span class="text-zinc-500 text-xs font-medium">Wait</span>' : 
                                    '<i class="fa-solid fa-chevron-right text-amber-400"></i>'
                                }
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderContentCreation() {
    const guideOpen = airdropState.isGuideOpen;
    const user = airdropState.user;
    const refCode = user?.referralCode || 'CODE';
    const shortLink = `http://backcoin.org/${refCode}`;
    
    return `
        <!-- Guide Card -->
        <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden mb-4">
            <div class="flex justify-between items-center p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors" id="guide-toggle-btn">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <i class="fa-solid fa-book text-blue-400"></i>
                    </div>
                    <span class="font-bold text-white text-sm">How it Works</span>
                </div>
                <i class="fa-solid fa-chevron-down text-zinc-400 transition-transform duration-300 ${guideOpen ? 'rotate-180' : ''}"></i>
            </div>
            
            <div class="${guideOpen ? 'block' : 'hidden'} border-t border-zinc-800 p-4 bg-zinc-900/50">
                <div class="space-y-4">
                    <!-- Step 1 -->
                    <div class="flex gap-3">
                        <div class="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-black font-bold text-sm">1</div>
                        <div class="flex-1">
                            <p class="text-white text-sm font-medium mb-2">Copy & Post</p>
                            <div class="bg-black/40 p-3 rounded-lg mb-2 border border-zinc-700">
                                <p class="text-xs font-mono text-zinc-400 break-all">${shortLink} ${DEFAULT_HASHTAGS}</p>
                            </div>
                            <button id="copy-viral-btn" class="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                <i class="fa-solid fa-copy"></i> Copy Text
                            </button>
                        </div>
                    </div>
                    
                    <!-- Step 2 -->
                    <div class="flex gap-3">
                        <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-white font-bold text-sm">2</div>
                        <div>
                            <p class="text-white text-sm font-medium">Post Publicly</p>
                            <p class="text-zinc-500 text-xs mt-1">Share on TikTok, X, YouTube or Instagram. <span class="text-amber-400 font-medium">Must be Public!</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Submit Card -->
        <div class="bg-gradient-to-br from-zinc-800/50 to-zinc-900 border border-zinc-700 rounded-2xl p-5 text-center">
            <div class="w-16 h-16 mx-auto mb-4 airdrop-float-slow">
                <img src="./assets/airdrop.png" alt="Submit" class="w-full h-full object-contain">
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Submit Your Post</h3>
            <p class="text-zinc-400 text-xs mb-4">Paste the URL of your published post</p>
            
            <div class="relative">
                <input type="url" id="content-url-input" 
                       placeholder="https://..."
                       class="w-full bg-black/50 border border-zinc-600 rounded-xl pl-4 pr-24 py-3.5 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-zinc-600">
                <button id="submit-content-btn" 
                        class="absolute right-2 top-2 bottom-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 rounded-lg transition-all text-sm">
                    Submit
                </button>
            </div>
        </div>
    `;
}

// --- LEADERBOARD ---
function renderLeaderboard() {
    const pointsList = airdropState.leaderboards?.top100ByPoints || [];
    const postsList = airdropState.leaderboards?.top100ByPosts || []; 
    
    const lastUpdatedTimestamp = airdropState.leaderboards?.lastUpdated;
    let lastUpdated = 'Just now';
    if(lastUpdatedTimestamp) {
        const date = lastUpdatedTimestamp.toDate ? lastUpdatedTimestamp.toDate() : new Date(lastUpdatedTimestamp);
        lastUpdated = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return `
        <div class="px-4 airdrop-fade-up">
            <p class="text-xs text-zinc-500 mb-4 text-center">
                <i class="fa-solid fa-sync mr-1"></i> Updated: ${lastUpdated}
            </p>

            <!-- Prizes Banner -->
            <div class="bg-gradient-to-r from-amber-900/20 to-zinc-900 border border-amber-500/20 rounded-xl p-4 mb-6 relative overflow-hidden">
                <div class="absolute top-2 right-2 w-16 h-16 airdrop-float opacity-30">
                    <img src="./assets/airdrop.png" alt="Prize" class="w-full h-full object-contain">
                </div>
                <h3 class="font-bold text-white text-sm mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-trophy text-amber-400"></i> Content Creator Rewards
                </h3>
                <p class="text-zinc-400 text-xs mb-4">Top content creators will receive exclusive NFT Boosters based on their ranking:</p>
                
                <div class="space-y-2 text-xs">
                    <!-- Diamond -->
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20">
                        <div class="flex items-center gap-2">
                            <span class="text-cyan-300 text-lg">💎</span>
                            <span class="text-cyan-300 font-bold">Diamond</span>
                        </div>
                        <span class="text-zinc-400">Rank <span class="text-white font-bold">1-2</span></span>
                    </div>
                    
                    <!-- Platinum -->
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-slate-400/10 to-transparent border border-slate-400/20">
                        <div class="flex items-center gap-2">
                            <span class="text-slate-300 text-lg">🏆</span>
                            <span class="text-slate-300 font-bold">Platinum</span>
                        </div>
                        <span class="text-zinc-400">Rank <span class="text-white font-bold">3-10</span></span>
                    </div>
                    
                    <!-- Gold -->
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20">
                        <div class="flex items-center gap-2">
                            <span class="text-yellow-400 text-lg">🥇</span>
                            <span class="text-yellow-400 font-bold">Gold</span>
                        </div>
                        <span class="text-zinc-400">Rank <span class="text-white font-bold">11-20</span></span>
                    </div>
                    
                    <!-- Silver -->
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-gray-400/10 to-transparent border border-gray-500/20">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-300 text-lg">🥈</span>
                            <span class="text-gray-300 font-bold">Silver</span>
                        </div>
                        <span class="text-zinc-400">Rank <span class="text-white font-bold">21-50</span></span>
                    </div>
                    
                    <!-- Bronze -->
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-amber-700/10 to-transparent border border-amber-700/20">
                        <div class="flex items-center gap-2">
                            <span class="text-amber-600 text-lg">🥉</span>
                            <span class="text-amber-600 font-bold">Bronze</span>
                        </div>
                        <span class="text-zinc-400">Rank <span class="text-white font-bold">51-150</span></span>
                    </div>
                    
                    <!-- Iron -->
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-zinc-600/10 to-transparent border border-zinc-600/20">
                        <div class="flex items-center gap-2">
                            <span class="text-zinc-400 text-lg">⚔️</span>
                            <span class="text-zinc-400 font-bold">Iron</span>
                        </div>
                        <span class="text-zinc-400">Rank <span class="text-white font-bold">151-300</span></span>
                    </div>
                    
                    <!-- Crystal -->
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
                        <div class="flex items-center gap-2">
                            <span class="text-purple-400 text-lg">🔮</span>
                            <span class="text-purple-400 font-bold">Crystal</span>
                        </div>
                        <span class="text-zinc-400">Rank <span class="text-white font-bold">301-500</span></span>
                    </div>
                </div>
                
                <p class="text-amber-400/80 text-[10px] mt-4 flex items-center gap-1">
                    <i class="fa-solid fa-info-circle"></i>
                    Crystal tier requires minimum 200 approved posts
                </p>
            </div>

            <!-- Rankings -->
            <div class="space-y-6">
                ${renderRankingTable('Points Leaders', 'fa-crown', 'text-yellow-500', pointsList, 'pts')}
                ${renderRankingTable('Content Creators', 'fa-video', 'text-red-500', postsList, 'posts')}
            </div>
        </div>
    `;
}

function renderRankingTable(title, icon, iconColor, list, unit) {
    return `
        <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
            <div class="p-4 border-b border-zinc-800 flex items-center gap-2">
                <i class="fa-solid ${icon} ${iconColor}"></i>
                <h3 class="font-bold text-white text-sm">${title}</h3>
            </div>
            <div class="divide-y divide-zinc-800/50">
                ${list.length === 0 ? 
                    '<p class="p-6 text-center text-zinc-500 text-sm">No data yet</p>' : 
                    list.slice(0, 10).map((item, i) => {
                        const isMe = airdropState.user && item.walletAddress.toLowerCase() === airdropState.user.walletAddress.toLowerCase();
                        const rankBg = i === 0 ? 'bg-yellow-500 text-black' : 
                                       i === 1 ? 'bg-zinc-400 text-black' : 
                                       i === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-400';
                        return `
                            <div class="flex items-center justify-between p-3 ${isMe ? 'bg-amber-500/10' : 'hover:bg-zinc-800/50'} transition-colors">
                                <div class="flex items-center gap-3">
                                    <span class="w-6 h-6 rounded-full ${rankBg} flex items-center justify-center text-xs font-bold">${i+1}</span>
                                    <span class="font-mono text-xs ${isMe ? 'text-amber-400 font-bold' : 'text-zinc-400'}">
                                        ${formatAddress(item.walletAddress)}${isMe ? ' (You)' : ''}
                                    </span>
                                </div>
                                <span class="font-bold text-white text-sm">${(item.value || 0).toLocaleString()} <span class="text-zinc-500 text-xs">${unit}</span></span>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;
}

// =======================================================
//  5. HANDLERS & ACTIONS
// =======================================================

function updateContent() {
    const contentEl = document.getElementById('main-content');
    if (!contentEl) return;

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

    // Update nav pill states
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
                btn.classList.remove('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-800', 'font-medium');
                btn.classList.add('airdrop-tab-active', 'shadow-lg', 'shadow-amber-500/20');
            } else {
                btn.classList.add('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-800', 'font-medium');
                btn.classList.remove('airdrop-tab-active', 'shadow-lg', 'shadow-amber-500/20');
            }
        }
    });

    switch(airdropState.activeTab) {
        case 'dashboard': contentEl.innerHTML = renderDashboard(); break;
        case 'earn': contentEl.innerHTML = renderEarnZone(); break;
        case 'leaderboard': contentEl.innerHTML = renderLeaderboard(); break;
        default: contentEl.innerHTML = renderDashboard();
    }
}

function handleCopySmartLink() {
    const refCode = airdropState.user?.referralCode || 'CODE';
    const textToCopy = `http://backcoin.org/${refCode} ${DEFAULT_HASHTAGS}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Copied! Now paste it in your post.", "success");
        const btn = document.getElementById('copy-viral-btn');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            btn.classList.remove('bg-amber-500', 'hover:bg-amber-600');
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.innerHTML = original;
                btn.classList.add('bg-amber-500', 'hover:bg-amber-600');
                btn.classList.remove('bg-green-600');
            }, 2000);
        }
    }).catch(() => showToast("Failed to copy.", "error"));
}

function handleTabSwitch(e) {
    const btn = e.target.closest('.nav-pill-btn');
    if (btn) { airdropState.activeTab = btn.dataset.target; updateContent(); }
}

function handleEarnSubTabSwitch(e) {
    const btn = e.target.closest('.earn-subtab-btn');
    if (btn) { airdropState.activeEarnSubTab = btn.dataset.target; updateContent(); }
}

function handleToggleGuide() {
    airdropState.isGuideOpen = !airdropState.isGuideOpen;
    updateContent();
}

function openConfirmationModal(submission) {
    const modalContent = `
        <div class="flex justify-between items-start mb-4 border-b border-zinc-700 pb-4">
            <h3 class="text-xl font-bold text-white">Verify Submission</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <p class="text-zinc-400 text-sm mb-4 text-center">Confirm your post link is authentic</p>
        <a href="${submission.url}" target="_blank" class="block bg-zinc-800 border border-zinc-600 text-blue-400 hover:text-blue-300 py-3 px-4 rounded-lg w-full text-center mb-6 text-sm truncate">${submission.url}</a>
        <div class="flex gap-3">
            <button id="cancelConfirmBtn" class="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-xl font-medium text-sm">Cancel</button>
            <button id="finalConfirmBtn" data-submission-id="${submission.submissionId}" class="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm">Confirm ✓</button>
        </div>
    `;
    openModal(modalContent, 'max-w-sm'); 
    document.getElementById('cancelConfirmBtn')?.addEventListener('click', closeModal);
    document.getElementById('finalConfirmBtn')?.addEventListener('click', handleConfirmAuthenticity);
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
    const btn = e.currentTarget;
    const input = document.getElementById('content-url-input');
    const url = input?.value.trim();
    if (!url || !url.startsWith('http')) return showToast("Enter a valid URL.", "warning");
    
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    
    try {
        await db.addSubmission(url);
        showToast("Submitted! Check Dashboard.", "success");
        input.value = '';
        await loadAirdropData();
        airdropState.activeTab = 'dashboard'; 
        updateContent();
    } catch (err) {
        showToast(err.message, "error");
        btn.disabled = false; btn.innerHTML = originalText;
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
                        
                        <!-- NFT Tiers Preview -->
                        <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6 text-left">
                            <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-3 text-center">NFT Booster Rewards</p>
                            <div class="grid grid-cols-2 gap-2 text-[10px]">
                                <div class="flex items-center gap-2">
                                    <span>💎</span><span class="text-cyan-300">Diamond</span><span class="text-zinc-600">#1-2</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span>🏆</span><span class="text-slate-300">Platinum</span><span class="text-zinc-600">#3-10</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span>🥇</span><span class="text-yellow-400">Gold</span><span class="text-zinc-600">#11-20</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span>🥈</span><span class="text-gray-300">Silver</span><span class="text-zinc-600">#21-50</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span>🥉</span><span class="text-amber-600">Bronze</span><span class="text-zinc-600">#51-150</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span>⚔️</span><span class="text-zinc-400">Iron</span><span class="text-zinc-600">#151-300</span>
                                </div>
                                <div class="flex items-center gap-2 col-span-2 justify-center pt-1 border-t border-zinc-800 mt-1">
                                    <span>🔮</span><span class="text-purple-400">Crystal</span><span class="text-zinc-600">#301-500 (min 200 posts)</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Loading indicator -->
                        <div class="flex items-center justify-center gap-2 text-amber-500">
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0s;"></div>
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0.1s;"></div>
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0.2s;"></div>
                        </div>
                        <p class="text-zinc-600 text-xs mt-3">Loading your rewards...</p>
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
            // Minimum loading time to let user read motivational message
            const minLoadingTime = new Promise(resolve => setTimeout(resolve, 4000));
            
            // Load data in parallel with minimum time
            await Promise.all([loadAirdropData(), minLoadingTime]);
            
            const loader = document.getElementById('loading-state');
            const mainArea = document.getElementById('airdrop-main');
            const content = document.getElementById('main-content');
            
            // Smooth fade out
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
            if(e.target.closest('.earn-subtab-btn')) handleEarnSubTabSwitch(e);
            if(e.target.closest('#submit-content-btn')) handleSubmitUgc(e);
            if(e.target.closest('.task-card')) handleTaskClick(e);
            if(e.target.closest('.action-btn')) handleSubmissionAction(e);
            if(e.target.closest('#copy-viral-btn')) handleCopySmartLink();
        });
    },

    update(isConnected) {
        if (airdropState.isConnected !== isConnected) {
            this.render(true); 
        }
    }
};