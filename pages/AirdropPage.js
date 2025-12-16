// pages/AirdropPage.js
// ✅ VERSION V3.0: Social Posting Focus - Share & Earn redesign

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
    { title: "🚀 Share & Earn!", subtitle: "Post on social media and get rewarded with NFT Boosters" },
    { title: "💎 Top Creators Get Diamond NFTs!", subtitle: "Rank #1-2 and receive the most exclusive booster" },
    { title: "📱 Post. Share. Earn.", subtitle: "It's that simple - spread the word and win rewards" },
    { title: "🔥 Go Viral, Get Rewarded!", subtitle: "The more you post, the higher you climb" },
    { title: "🎯 500 Creators Will Win NFTs!", subtitle: "From Diamond to Crystal - every post counts" },
    { title: "🏆 7 Tiers of NFT Rewards!", subtitle: "Diamond, Platinum, Gold, Silver, Bronze, Iron & Crystal" },
    { title: "📈 Your Posts = Your Rewards!", subtitle: "Each submission brings you closer to the top" },
    { title: "⭐ Be a Backcoin Ambassador!", subtitle: "Share our vision and earn exclusive rewards" }
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
    activeTab: 'post',
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
        
        .airdrop-float { animation: float 4s ease-in-out infinite; }
        .airdrop-float-slow { animation: float-slow 3s ease-in-out infinite; }
        .airdrop-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .airdrop-bounce { animation: bounce-gentle 2s ease-in-out infinite; }
        .airdrop-spin { animation: spin-slow 20s linear infinite; }
        .airdrop-fade-up { animation: fade-up 0.5s ease-out forwards; }
        
        .airdrop-shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        }
        
        .airdrop-card {
            transition: all 0.3s ease;
        }
        .airdrop-card:hover {
            transform: translateY(-2px);
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
            transition: all 0.2s ease;
        }
        .social-btn:hover {
            transform: scale(1.05);
        }
        .social-btn:active {
            transform: scale(0.98);
        }
        
        .cta-mega {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
            box-shadow: 0 10px 40px rgba(245, 158, 11, 0.3);
        }
        .cta-mega:hover {
            box-shadow: 0 15px 50px rgba(245, 158, 11, 0.4);
            transform: translateY(-2px);
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
//  4. COMPONENTES DE RENDERIZAÇÃO (UI)
// =======================================================

function renderHeader() {
    return `
        <!-- Mobile Header -->
        <div class="md:hidden px-4 pt-4 pb-2">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 airdrop-float-slow">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-lg font-black text-white">Share <span class="airdrop-gradient-text">& Earn</span></h1>
                    </div>
                </div>
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="w-9 h-9 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <i class="fa-brands fa-telegram"></i>
                </a>
            </div>
            
            <!-- Mobile Navigation - Post first -->
            <div class="flex gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800">
                ${renderMobileNavPill('post', 'fa-share-nodes', 'Post')}
                ${renderMobileNavPill('history', 'fa-clock-rotate-left', 'My Posts')}
                ${renderMobileNavPill('leaderboard', 'fa-trophy', 'Ranking')}
            </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:block px-4 pt-6 pb-4">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 airdrop-float">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-2xl font-black text-white">Share <span class="airdrop-gradient-text">& Earn</span></h1>
                        <p class="text-zinc-500 text-sm">Post on social media, earn NFT rewards</p>
                    </div>
                </div>
                
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 px-4 py-2 rounded-full transition-all hover:scale-105">
                    <i class="fa-brands fa-telegram"></i>
                    <span class="text-sm font-bold">Community</span>
                </a>
            </div>

            <!-- Desktop Navigation -->
            <div class="flex justify-center">
                <div class="bg-zinc-900/80 p-1.5 rounded-full border border-zinc-800 inline-flex gap-1">
                    ${renderNavPill('post', 'fa-share-nodes', 'Create Post')}
                    ${renderNavPill('history', 'fa-clock-rotate-left', 'My Posts')}
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

// --- POST TAB (Main Focus) ---
function renderPostTab() {
    const { user } = airdropState;
    const refCode = user?.referralCode || 'CODE';
    const shortLink = `http://backcoin.org/${refCode}`;
    const approvedCount = user?.approvedSubmissionsCount || 0;
    const totalPoints = user?.totalPoints || 0;
    
    if (!airdropState.isConnected) {
        return `
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-24 h-24 mx-auto mb-6 airdrop-float">
                    <img src="./assets/airdrop.png" alt="Connect" class="w-full h-full object-contain opacity-50">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm max-w-xs mx-auto">Connect to start earning rewards by posting on social media.</p>
            </div>
        `;
    }

    return `
        <div class="px-4 space-y-5 airdrop-fade-up">
            
            <!-- Quick Stats Bar -->
            <div class="flex gap-3">
                <div class="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-black text-amber-400">${approvedCount}</span>
                    <p class="text-[10px] text-zinc-500">Posts</p>
                </div>
                <div class="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-black text-green-400">${totalPoints.toLocaleString()}</span>
                    <p class="text-[10px] text-zinc-500">Points</p>
                </div>
                <div class="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-black text-purple-400">${getMultiplierByTier(approvedCount).toFixed(1)}x</span>
                    <p class="text-[10px] text-zinc-500">Boost</p>
                </div>
            </div>

            <!-- MAIN CTA: How It Works -->
            <div class="bg-gradient-to-br from-zinc-800/50 to-zinc-900 border border-zinc-700 rounded-2xl p-5 relative overflow-hidden">
                <div class="absolute top-3 right-3 w-16 h-16 opacity-20 airdrop-float">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                
                <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-rocket text-amber-400"></i> 3 Simple Steps
                </h2>
                
                <div class="space-y-4">
                    <!-- Step 1: Copy -->
                    <div class="flex gap-3 items-start">
                        <div class="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-black font-bold text-sm">1</div>
                        <div class="flex-1">
                            <p class="text-white text-sm font-medium mb-2">Copy this text</p>
                            <div class="bg-black/40 p-3 rounded-lg border border-zinc-700 mb-2">
                                <p class="text-xs font-mono text-amber-400 break-all">${shortLink}</p>
                                <p class="text-xs font-mono text-zinc-500 mt-1">${DEFAULT_HASHTAGS}</p>
                            </div>
                            <button id="copy-viral-btn" class="w-full cta-mega text-black font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                                <i class="fa-solid fa-copy"></i> Copy Text & Link
                            </button>
                        </div>
                    </div>
                    
                    <!-- Step 2: Post -->
                    <div class="flex gap-3 items-start">
                        <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-white font-bold text-sm">2</div>
                        <div class="flex-1">
                            <p class="text-white text-sm font-medium mb-2">Post on any social network</p>
                            <div class="flex flex-wrap gap-2">
                                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shortLink + ' ' + DEFAULT_HASHTAGS)}" target="_blank" 
                                   class="social-btn flex items-center gap-2 bg-black border border-zinc-700 hover:border-zinc-500 text-white px-4 py-2 rounded-lg text-sm">
                                    <i class="fa-brands fa-x-twitter"></i> X / Twitter
                                </a>
                                <a href="https://www.tiktok.com" target="_blank" 
                                   class="social-btn flex items-center gap-2 bg-black border border-zinc-700 hover:border-zinc-500 text-white px-4 py-2 rounded-lg text-sm">
                                    <i class="fa-brands fa-tiktok"></i> TikTok
                                </a>
                                <a href="https://www.instagram.com" target="_blank" 
                                   class="social-btn flex items-center gap-2 bg-black border border-zinc-700 hover:border-zinc-500 text-white px-4 py-2 rounded-lg text-sm">
                                    <i class="fa-brands fa-instagram"></i> Instagram
                                </a>
                                <a href="https://www.youtube.com" target="_blank" 
                                   class="social-btn flex items-center gap-2 bg-black border border-zinc-700 hover:border-zinc-500 text-white px-4 py-2 rounded-lg text-sm">
                                    <i class="fa-brands fa-youtube"></i> YouTube
                                </a>
                            </div>
                            <p class="text-amber-400 text-xs mt-2 flex items-center gap-1">
                                <i class="fa-solid fa-exclamation-circle"></i> Post must be PUBLIC
                            </p>
                        </div>
                    </div>
                    
                    <!-- Step 3: Submit -->
                    <div class="flex gap-3 items-start">
                        <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-white font-bold text-sm">3</div>
                        <div class="flex-1">
                            <p class="text-white text-sm font-medium mb-2">Submit your post link</p>
                            <div class="relative">
                                <input type="url" id="content-url-input" 
                                       placeholder="Paste your post URL here..."
                                       class="w-full bg-black/50 border border-zinc-600 rounded-xl pl-4 pr-24 py-3.5 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-zinc-600">
                                <button id="submit-content-btn" 
                                        class="absolute right-2 top-2 bottom-2 bg-green-600 hover:bg-green-500 text-white font-bold px-4 rounded-lg transition-all text-sm">
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Daily Tasks (Secondary) -->
            ${renderDailyTasksCompact()}
            
        </div>
    `;
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
                            const statusIcon = sub.status === 'approved' ? 
                                '<i class="fa-solid fa-check-circle text-green-400"></i>' : 
                                sub.status === 'rejected' ? 
                                '<i class="fa-solid fa-times-circle text-red-400"></i>' : 
                                '<i class="fa-solid fa-clock text-amber-400"></i>';
                            const pts = sub.pointsAwarded ? `+${sub.pointsAwarded}` : '-';
                            const isLast = idx === Math.min(userSubmissions.length, 10) - 1;
                            return `
                                <div class="flex items-center justify-between p-3 ${isLast ? '' : 'border-b border-zinc-800'}">
                                    <div class="flex items-center gap-3 overflow-hidden">
                                        ${statusIcon}
                                        <a href="${sub.url}" target="_blank" class="text-zinc-400 text-xs truncate hover:text-blue-400 max-w-[180px] md:max-w-[300px]">${sub.url}</a>
                                    </div>
                                    <span class="font-mono font-bold ${sub.pointsAwarded ? 'text-green-400' : 'text-zinc-600'} text-sm shrink-0">${pts}</span>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        </div>
    `;
}

// --- LEADERBOARD TAB ---
function renderLeaderboard() {
    const postsList = airdropState.leaderboards?.top100ByPosts || []; 
    
    return `
        <div class="px-4 airdrop-fade-up">

            <!-- Prizes Banner - Detailed -->
            <div class="bg-gradient-to-br from-amber-900/20 to-zinc-900 border border-amber-500/20 rounded-xl p-4 mb-5 relative overflow-hidden">
                <div class="absolute top-2 right-2 w-14 h-14 airdrop-float opacity-30">
                    <img src="./assets/airdrop.png" alt="Prize" class="w-full h-full object-contain">
                </div>
                <h3 class="font-bold text-white text-sm mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-trophy text-amber-400"></i> NFT Rewards by Rank
                </h3>
                
                <div class="space-y-1.5 text-xs">
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20">
                        <div class="flex items-center gap-2"><span class="text-lg">💎</span><span class="text-cyan-300 font-bold">Diamond</span></div>
                        <span class="text-white font-bold">#1-2</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-slate-400/10 to-transparent border border-slate-400/20">
                        <div class="flex items-center gap-2"><span class="text-lg">🏆</span><span class="text-slate-300 font-bold">Platinum</span></div>
                        <span class="text-white font-bold">#3-10</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20">
                        <div class="flex items-center gap-2"><span class="text-lg">🥇</span><span class="text-yellow-400 font-bold">Gold</span></div>
                        <span class="text-white font-bold">#11-20</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-gray-400/10 to-transparent border border-gray-400/20">
                        <div class="flex items-center gap-2"><span class="text-lg">🥈</span><span class="text-gray-300 font-bold">Silver</span></div>
                        <span class="text-white font-bold">#21-50</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-amber-700/10 to-transparent border border-amber-700/20">
                        <div class="flex items-center gap-2"><span class="text-lg">🥉</span><span class="text-amber-600 font-bold">Bronze</span></div>
                        <span class="text-white font-bold">#51-150</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-zinc-600/10 to-transparent border border-zinc-600/20">
                        <div class="flex items-center gap-2"><span class="text-lg">⚔️</span><span class="text-zinc-400 font-bold">Iron</span></div>
                        <span class="text-white font-bold">#151-300</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
                        <div class="flex items-center gap-2"><span class="text-lg">🔮</span><span class="text-purple-400 font-bold">Crystal</span></div>
                        <span class="text-white font-bold">#301-500</span>
                    </div>
                </div>
                
                <p class="text-amber-400/80 text-[10px] mt-3 flex items-center gap-1">
                    <i class="fa-solid fa-info-circle"></i>
                    Crystal requires minimum 200 approved posts
                </p>
            </div>

            <!-- Top Creators Ranking -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 class="font-bold text-white text-sm flex items-center gap-2">
                        <i class="fa-solid fa-crown text-yellow-500"></i> Top Content Creators
                    </h3>
                    <span class="text-zinc-500 text-xs">${postsList.length} creators</span>
                </div>
                <div class="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto">
                    ${postsList.length === 0 ? 
                        '<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>' : 
                        postsList.slice(0, 20).map((item, i) => {
                            const isMe = airdropState.user && item.walletAddress.toLowerCase() === airdropState.user.walletAddress.toLowerCase();
                            const tierInfo = getTierInfo(i + 1);
                            return `
                                <div class="flex items-center justify-between p-3 ${isMe ? 'bg-amber-500/10' : 'hover:bg-zinc-800/50'} transition-colors">
                                    <div class="flex items-center gap-3">
                                        <span class="w-8 h-8 rounded-full ${tierInfo.bg} flex items-center justify-center text-xs font-bold">${tierInfo.icon || (i+1)}</span>
                                        <span class="font-mono text-xs ${isMe ? 'text-amber-400 font-bold' : 'text-zinc-400'}">
                                            ${formatAddress(item.walletAddress)}${isMe ? ' (You)' : ''}
                                        </span>
                                    </div>
                                    <span class="font-bold text-white text-sm">${(item.value || 0).toLocaleString()} <span class="text-zinc-500 text-xs">posts</span></span>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        </div>
    `;
}

function getTierInfo(rank) {
    if (rank <= 2) return { icon: '💎', bg: 'bg-cyan-500/20 text-cyan-300' };
    if (rank <= 10) return { icon: '🏆', bg: 'bg-slate-400/20 text-slate-300' };
    if (rank <= 20) return { icon: '🥇', bg: 'bg-yellow-500/20 text-yellow-400' };
    if (rank <= 50) return { icon: '🥈', bg: 'bg-gray-400/20 text-gray-300' };
    if (rank <= 150) return { icon: '🥉', bg: 'bg-amber-700/20 text-amber-600' };
    if (rank <= 300) return { icon: '⚔️', bg: 'bg-zinc-600/20 text-zinc-400' };
    return { icon: null, bg: 'bg-zinc-800 text-zinc-400' };
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
                btn.classList.remove('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-800');
                btn.classList.add('airdrop-tab-active', 'shadow-lg', 'shadow-amber-500/20');
            } else {
                btn.classList.add('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-800');
                btn.classList.remove('airdrop-tab-active', 'shadow-lg', 'shadow-amber-500/20');
            }
        }
    });

    switch(airdropState.activeTab) {
        case 'post': contentEl.innerHTML = renderPostTab(); break;
        case 'history': contentEl.innerHTML = renderHistoryTab(); break;
        case 'leaderboard': contentEl.innerHTML = renderLeaderboard(); break;
        default: contentEl.innerHTML = renderPostTab();
    }
}

function handleCopySmartLink() {
    const refCode = airdropState.user?.referralCode || 'CODE';
    const textToCopy = `${refCode !== 'CODE' ? `http://backcoin.org/${refCode}` : 'http://backcoin.org'} ${DEFAULT_HASHTAGS}`;
    
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

function handleToggleGuide() {
    airdropState.isGuideOpen = !airdropState.isGuideOpen;
    updateContent();
}

function openConfirmationModal(submission) {
    const modalContent = `
        <div class="flex justify-between items-start mb-4 border-b border-zinc-700 pb-4">
            <h3 class="text-xl font-bold text-white">Verify Your Post</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <p class="text-zinc-400 text-sm mb-4 text-center">Confirm this is your authentic public post</p>
        <a href="${submission.url}" target="_blank" class="block bg-zinc-800 border border-zinc-600 text-blue-400 hover:text-blue-300 py-3 px-4 rounded-lg w-full text-center mb-6 text-sm truncate">${submission.url}</a>
        <div class="flex gap-3">
            <button id="cancelConfirmBtn" class="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-xl font-medium text-sm">Cancel</button>
            <button id="finalConfirmBtn" data-submission-id="${submission.submissionId}" class="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm">Confirm & Earn ✓</button>
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
        showToast("Submitted! Check 'My Posts' tab.", "success");
        input.value = '';
        await loadAirdropData();
        airdropState.activeTab = 'history'; 
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