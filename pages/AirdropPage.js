// pages/AirdropPage.js
// ✅ VERSÃO FINAL COMPLETA: Ranking de Posts + Prêmios Reintegrados

import { State } from '../state.js';
import * as db from '../modules/firebase-auth-service.js';
import { showToast, closeModal, openModal } from '../ui-feedback.js';
import { formatAddress, renderNoData, formatBigNumber, renderLoading, renderError } from '../utils.js';

// ==========================================================
//  1. CONSTANTES E HELPERS
// ==========================================================

const DEFAULT_HASHTAGS = "#BKC #Backcoin #Airdrop";
const AUTO_APPROVE_HOURS = 2;

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

// =======================================================
//  2. CARREGAMENTO DE DADOS (DATA LOADING)
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
        if (error.code !== 'permission-denied') {
            showToast("Error loading data. Please refresh.", "error");
        }
    }
}

// =======================================================
//  3. COMPONENTES DE RENDERIZAÇÃO (UI)
// =======================================================

function renderHeader() {
    return `
        <div class="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-2">
            <div>
                <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 uppercase tracking-wide">
                    Airdrop Zone
                </h1>
                <p class="text-zinc-400 text-sm">Complete tasks, go viral, earn rewards.</p>
            </div>
            
            <a href="https://t.me/BackCoinorg" target="_blank" 
               class="group flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/50 text-sky-400 px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
                <i class="fa-brands fa-telegram text-xl animate-pulse"></i>
                <span class="text-sm font-bold">Official Group</span>
            </a>
        </div>

        <div class="flex justify-center mb-10">
            <div class="bg-zinc-900 p-1.5 rounded-full border border-zinc-700 inline-flex gap-1 shadow-xl relative z-10">
                ${renderNavPill('dashboard', 'fa-chart-pie', 'Dashboard')}
                ${renderNavPill('earn', 'fa-rocket', 'Earn Zone')}
                ${renderNavPill('leaderboard', 'fa-trophy', 'Ranking')}
            </div>
        </div>
    `;
}

function renderNavPill(target, icon, label) {
    const isActive = airdropState.activeTab === target;
    const activeClass = "bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/20 font-bold";
    const inactiveClass = "text-zinc-400 hover:text-white hover:bg-zinc-800 font-medium";
    
    return `
        <button data-target="${target}" class="nav-pill-btn px-6 py-2.5 rounded-full text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${isActive ? activeClass : inactiveClass}">
            <i class="fa-solid ${icon}"></i> ${label}
        </button>
    `;
}

// --- DASHBOARD ---
function renderDashboard() {
    const { user, userSubmissions } = airdropState;
    
    if (!airdropState.isConnected) {
        return `<div class="text-center p-10 bg-sidebar border border-border-color rounded-2xl">
            <i class="fa-solid fa-wallet text-4xl text-zinc-600 mb-4"></i>
            <p class="text-zinc-400">Connect your wallet to view your Dashboard.</p>
        </div>`;
    }
    
    if (!user) return renderLoading(null, "Loading profile...");

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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div class="bg-sidebar border border-border-color rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                <div class="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-50"></div>
                <span class="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Total Points</span>
                <span class="text-5xl font-black text-yellow-400 drop-shadow-sm">${(user.totalPoints || 0).toLocaleString()}</span>
            </div>
            
            <div class="bg-sidebar border border-border-color rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                <span class="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Multiplier</span>
                <div class="flex items-baseline gap-2">
                    <span class="text-4xl font-bold text-green-400">${multiplier.toFixed(1)}x</span>
                    <span class="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">Tier ${(user.approvedSubmissionsCount || 0)} Posts</span>
                </div>
            </div>

            <div class="bg-sidebar border border-border-color rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                <span class="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">In Review</span>
                <span class="text-4xl font-bold text-blue-400">${pendingAuditCount}</span>
                <span class="text-xs text-zinc-500 mt-1">Pending Actions: ${actionRequiredItems.length}</span>
            </div>
        </div>

        <div class="mb-10">
            <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i class="fa-solid fa-bell text-amber-500 animate-bounce-slow"></i> Action Center
            </h3>
            
            ${actionRequiredItems.length > 0 ? `
                <div class="space-y-4">
                    ${actionRequiredItems.map(sub => `
                        <div class="bg-gradient-to-r from-amber-900/20 to-zinc-900 border border-amber-500/40 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg relative overflow-hidden">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                            <div class="flex items-center gap-4 max-w-full overflow-hidden">
                                <div class="bg-amber-500/20 h-12 w-12 rounded-full flex items-center justify-center text-amber-400 shrink-0">
                                    <i class="fa-solid fa-check-to-slot text-xl"></i>
                                </div>
                                <div class="min-w-0">
                                    <p class="text-white font-bold text-base">Verification Ready</p>
                                    <p class="text-zinc-400 text-xs mb-1">Your post audit period is complete. Confirm to receive points.</p>
                                    <a href="${sub.url}" target="_blank" class="text-blue-400 text-xs truncate block hover:underline font-mono bg-black/30 px-2 py-1 rounded max-w-md">${sub.url}</a>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                                <button data-action="delete" data-id="${sub.submissionId}" class="action-btn flex-1 md:flex-none text-red-400 hover:text-red-300 text-xs font-bold px-4 py-3 rounded-lg hover:bg-red-900/20 border border-transparent hover:border-red-900/50 transition-colors">Report / Cancel</button>
                                <button data-action="confirm" data-id="${sub.submissionId}" class="action-btn flex-1 md:flex-none bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-6 py-3 rounded-lg shadow-lg shadow-green-900/20 transition-all hover:scale-105">Confirm Authenticity</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="bg-sidebar/30 border border-zinc-800 rounded-xl p-8 text-center">
                    <div class="inline-block p-4 rounded-full bg-zinc-800/50 mb-3">
                        <i class="fa-solid fa-check text-zinc-500 text-2xl"></i>
                    </div>
                    <p class="text-zinc-400 text-sm">No pending actions required. You're all caught up!</p>
                </div>
            `}
        </div>

        <div>
            <h3 class="text-lg font-bold text-white mb-4 px-1">Recent Activity</h3>
            <div class="bg-sidebar border border-border-color rounded-xl overflow-hidden">
                ${userSubmissions.length === 0 ? 
                    '<p class="text-zinc-500 text-sm italic p-6 text-center">No submission history yet.</p>' : 
                    userSubmissions.slice(0, 5).map((sub, idx) => {
                        let statusBadge = sub.status === 'approved' ? '<span class="text-green-400 text-xs font-bold flex items-center gap-1"><i class="fa-solid fa-check-circle"></i> Approved</span>' : 
                                          sub.status === 'rejected' ? '<span class="text-red-400 text-xs font-bold flex items-center gap-1"><i class="fa-solid fa-times-circle"></i> Rejected</span>' : 
                                          '<span class="text-amber-400 text-xs font-bold flex items-center gap-1"><i class="fa-solid fa-clock"></i> Pending</span>';
                        const pts = sub.pointsAwarded ? `+${sub.pointsAwarded}` : '-';
                        const isLast = idx === Math.min(userSubmissions.length, 5) - 1;
                        return `
                            <div class="flex items-center justify-between p-4 ${isLast ? '' : 'border-b border-zinc-700/50'} hover:bg-zinc-700/20 transition-colors">
                                <div class="flex items-center gap-4 overflow-hidden">
                                    <div class="bg-zinc-800 h-8 w-8 rounded flex items-center justify-center text-zinc-400 shrink-0"><i class="fa-solid fa-link text-xs"></i></div>
                                    <div class="min-w-0">
                                        <a href="${sub.url}" target="_blank" class="text-zinc-300 text-sm truncate block hover:text-blue-400 transition-colors max-w-[200px] sm:max-w-[400px]">${sub.url}</a>
                                        <span class="text-[10px] text-zinc-500">${sub.submittedAt ? sub.submittedAt.toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end gap-1 shrink-0">${statusBadge}<span class="font-mono font-bold text-white text-sm">${pts}</span></div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;
}

// --- EARN ZONE ---
function renderEarnZone() {
    const isTasks = airdropState.activeEarnSubTab === 'tasks';
    const activeBtnClass = "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5";
    const inactiveBtnClass = "text-zinc-400 hover:text-white hover:bg-zinc-800";

    return `
        <div class="flex w-full border-b border-zinc-700 mb-6">
            <button class="earn-subtab-btn flex-1 py-3 text-sm font-bold transition-colors ${isTasks ? activeBtnClass : inactiveBtnClass}" data-target="tasks">
                Daily Tasks
            </button>
            <button class="earn-subtab-btn flex-1 py-3 text-sm font-bold transition-colors ${!isTasks ? activeBtnClass : inactiveBtnClass}" data-target="content">
                Viral Post
            </button>
        </div>

        <div class="earn-content animate-fade-in">
            ${isTasks ? renderDailyTasks() : renderContentCreation()}
        </div>
    `;
}

function renderDailyTasks() {
    const eligibleTasks = airdropState.dailyTasks.filter(t => !t.error);
    
    if(eligibleTasks.length === 0) {
        return `<div class="text-center p-12 bg-sidebar/30 border border-border-color rounded-xl">
            <i class="fa-solid fa-mug-hot text-4xl text-zinc-600 mb-4"></i>
            <p class="text-zinc-400">No active tasks right now. Check back later!</p>
        </div>`;
    }

    return `
        <div class="grid grid-cols-1 gap-4" id="daily-tasks-list">
            ${eligibleTasks.map(task => {
                const isCooldown = !task.eligible && task.timeLeftMs > 0;
                const opacity = isCooldown ? 'opacity-60' : 'hover:border-amber-500/50 hover:bg-zinc-800/80 cursor-pointer';
                const btnColor = isCooldown ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20';
                const btnText = isCooldown ? 'Cooldown' : (task.url ? 'Go & Earn' : 'Claim');
                return `
                    <div class="task-card bg-sidebar border border-border-color rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-4 transition-all ${opacity}"
                         data-id="${task.id}" data-url="${task.url || ''}" ${isCooldown ? '' : 'onclick="return false;"'}>
                        <div class="flex items-start gap-4 w-full">
                            <div class="bg-zinc-800 p-3 rounded-xl shrink-0"><i class="fa-solid ${isCooldown ? 'fa-hourglass' : 'fa-star'} ${isCooldown ? 'text-zinc-500' : 'text-yellow-500'} text-xl"></i></div>
                            <div>
                                <h4 class="font-bold text-white text-base">${task.title}</h4>
                                <div class="flex gap-3 mt-1 text-xs text-zinc-400 font-mono">
                                    <span class="text-green-400 font-bold">+${Math.round(task.points)} Pts</span>
                                    <span>Cycle: ${task.cooldownHours}h</span>
                                </div>
                            </div>
                        </div>
                        <button class="w-full sm:w-auto text-sm font-bold py-3 px-6 rounded-xl transition-transform active:scale-95 shrink-0 ${btnColor}" ${isCooldown ? 'disabled' : ''}>${btnText}</button>
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
        <div class="bg-sidebar border border-border-color rounded-xl overflow-hidden mb-8">
            <div class="flex justify-between items-center p-5 cursor-pointer hover:bg-zinc-800/50 transition-colors" id="guide-toggle-btn">
                <div class="flex items-center gap-3">
                    <div class="bg-blue-500/10 p-2 rounded text-blue-400"><i class="fa-solid fa-book"></i></div>
                    <h3 class="font-bold text-white">Submission Guide</h3>
                </div>
                <i id="guide-toggle-icon" class="fa-solid fa-chevron-down text-zinc-400 transition-transform duration-300 ${guideOpen ? 'rotate-180' : ''}"></i>
            </div>
            
            <div id="content-guide-container" class="${guideOpen ? 'block' : 'hidden'} bg-zinc-900/50 border-t border-zinc-700 p-5 text-sm text-zinc-300">
                <ol class="space-y-6 relative border-l-2 border-zinc-700 ml-2 pl-6">
                    <li class="relative">
                        <span class="absolute -left-[31px] top-0 bg-amber-500 border border-amber-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black">1</span>
                        <p class="font-bold text-white mb-2">Copy Viral Text & Post</p>
                        <div class="bg-black/30 p-3 rounded border border-zinc-700 mb-2 font-mono text-xs text-zinc-400 break-all">
                            ${shortLink} ${DEFAULT_HASHTAGS}
                        </div>
                        <button id="copy-viral-btn" class="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <i class="fa-solid fa-copy"></i> Copy Text + Link
                        </button>
                        <p class="text-xs text-zinc-500 mt-2">Use this text in your post description.</p>
                    </li>
                    <li class="relative">
                        <span class="absolute -left-[31px] top-0 bg-zinc-800 border border-zinc-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
                        <p class="font-bold text-white">Post Publicly & Submit Link</p>
                        <p class="text-xs text-zinc-500">Share on TikTok, X, YouTube or Instagram. <strong class="text-amber-400">Must be Public</strong>.</p>
                    </li>
                </ol>
            </div>
        </div>

        <div class="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-border-color rounded-2xl p-6 md:p-8 text-center">
            <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                <i class="fa-solid fa-link text-2xl text-zinc-400"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Submit Post Link</h3>
            <p class="text-zinc-400 text-sm mb-6 max-w-md mx-auto">Paste the URL of your published post below for audit.</p>
            <div class="max-w-lg mx-auto relative">
                <input type="url" id="content-url-input" placeholder="https://..." class="w-full bg-black/40 border border-zinc-600 rounded-xl pl-5 pr-32 py-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-600">
                <button id="submit-content-btn" class="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-lg transition-all shadow-lg">Submit</button>
            </div>
        </div>
    `;
}

// --- D. LEADERBOARD (RANKING DE PONTOS + RANKING DE POSTS) ---
function renderLeaderboard() {
    const pointsList = airdropState.leaderboards?.top100ByPoints || [];
    // ✅ REINTEGRADO: Lista de Top Posts
    const postsList = airdropState.leaderboards?.top100ByPosts || []; 
    
    const lastUpdatedTimestamp = airdropState.leaderboards?.lastUpdated;
    let lastUpdated = 'Just now';
    if(lastUpdatedTimestamp) {
        const date = lastUpdatedTimestamp.toDate ? lastUpdatedTimestamp.toDate() : new Date(lastUpdatedTimestamp);
        lastUpdated = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // ✅ REINTEGRADO: Descrição dos Prêmios
    const prizesHtml = `
        <div class="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-5 mb-8">
            <h3 class="font-bold text-white mb-3 flex items-center gap-2">
                <i class="fa-solid fa-gift text-purple-400"></i> Rewards for Top Content Creators
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div class="flex items-center gap-3">
                    <span class="bg-yellow-500/20 text-yellow-400 font-bold px-2 py-1 rounded border border-yellow-500/30">Top 1</span>
                    <span class="text-zinc-300">Diamond Booster NFT</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="bg-zinc-500/20 text-zinc-300 font-bold px-2 py-1 rounded border border-zinc-500/30">Top 2-3</span>
                    <span class="text-zinc-300">Platinum Booster NFT</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="bg-amber-700/20 text-amber-600 font-bold px-2 py-1 rounded border border-amber-700/30">Top 4-10</span>
                    <span class="text-zinc-300">Gold Booster NFT</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="bg-green-900/20 text-green-400 font-bold px-2 py-1 rounded border border-green-700/30">Top 11+</span>
                    <span class="text-zinc-300">Silver/Bronze Boosters</span>
                </div>
            </div>
        </div>
    `;

    // Helper para renderizar tabelas
    const renderTable = (title, icon, iconColor, list, valueLabel) => `
        <div class="bg-sidebar border border-border-color rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
            <div class="p-5 border-b border-zinc-700 bg-zinc-800/80 flex justify-between items-center">
                <h3 class="font-bold text-white flex items-center gap-2">
                    <i class="fa-solid ${icon} ${iconColor}"></i> ${title}
                </h3>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-700">
                        <tr><th class="px-6 py-4 w-16 text-center">#</th><th class="px-6 py-4">User</th><th class="px-6 py-4 text-right">${valueLabel}</th></tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-700/50">
                        ${list.length === 0 ? '<tr><td colspan="3" class="p-6 text-center text-zinc-500">No data yet.</td></tr>' : 
                          list.slice(0, 20).map((item, i) => {
                            const isMe = airdropState.user && item.walletAddress.toLowerCase() === airdropState.user.walletAddress.toLowerCase();
                            const rowClass = isMe ? "bg-blue-500/10" : "hover:bg-zinc-800/30";
                            const rankStyle = i < 3 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full w-8 h-8 flex items-center justify-center mx-auto" : "text-zinc-500 text-center block";
                            return `<tr class="${rowClass} transition-colors"><td class="px-6 py-4"><span class="${rankStyle}">${i+1}</span></td><td class="px-6 py-4"><span class="font-mono text-zinc-300 ${isMe ? 'text-blue-400 font-bold' : ''}">${formatAddress(item.walletAddress)} ${isMe ? '(You)' : ''}</span></td><td class="px-6 py-4 text-right font-bold text-white tracking-wide">${(item.value || 0).toLocaleString()}</td></tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    return `
        <p class="text-sm text-zinc-400 mb-6 text-center"><i class="fa-solid fa-sync mr-1"></i> Last Updated: ${lastUpdated}</p>
        ${prizesHtml}
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            ${renderTable('Top Point Holders', 'fa-crown', 'text-yellow-500', pointsList, 'Points')}
            ${renderTable('Top Content Creators', 'fa-video', 'text-red-500', postsList, 'Posts')}
        </div>
    `;
}

// =======================================================
//  4. HANDLERS & ACTIONS
// =======================================================

function updateContent() {
    const contentEl = document.getElementById('main-content');
    if (!contentEl) return;

    if (airdropState.isBanned) {
        contentEl.innerHTML = `<div class="bg-red-900/20 border border-red-500 p-8 rounded-xl text-center"><h2 class="text-red-500 font-bold text-xl mb-2">Account Banned</h2><p class="text-zinc-400">Contact support on Telegram.</p></div>`;
        return;
    }

    document.querySelectorAll('.nav-pill-btn').forEach(btn => {
        const target = btn.dataset.target;
        if (target === airdropState.activeTab) {
            btn.classList.remove('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-800', 'font-medium');
            btn.classList.add('bg-amber-500', 'text-zinc-900', 'shadow-lg', 'shadow-amber-500/20', 'font-bold');
        } else {
            btn.classList.add('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-800', 'font-medium');
            btn.classList.remove('bg-amber-500', 'text-zinc-900', 'shadow-lg', 'shadow-amber-500/20', 'font-bold');
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
            btn.classList.remove('bg-amber-500', 'hover:bg-amber-600', 'text-black');
            btn.classList.add('bg-green-600', 'text-white');
            setTimeout(() => {
                btn.innerHTML = original;
                btn.classList.add('bg-amber-500', 'hover:bg-amber-600', 'text-black');
                btn.classList.remove('bg-green-600', 'text-white');
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
        <div class="flex justify-between items-start mb-6 border-b border-zinc-700 pb-4">
            <h3 class="text-2xl font-bold text-white">Final Verification</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <p class="text-zinc-300 text-sm mb-4 text-center">Verify your link before confirming.</p>
        <a href="${submission.url}" target="_blank" class="btn bg-zinc-800 border border-zinc-600 text-blue-400 hover:text-blue-300 py-2 px-4 rounded-lg w-full text-center mb-6 block truncate">${submission.url}</a>
        <div class="flex justify-center gap-3">
            <button id="cancelConfirmBtn" class="btn bg-zinc-700 hover:bg-zinc-600 text-white py-3 px-6 rounded-xl font-semibold">Cancel</button>
            <button id="finalConfirmBtn" data-submission-id="${submission.submissionId}" class="btn bg-green-600 hover:bg-green-500 text-white py-3 px-6 rounded-xl font-bold shadow-lg">I Confirm Authenticity</button>
        </div>
    `;
    openModal(modalContent, 'max-w-md'); 
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
//  5. EXPORT
// =======================================================

export const AirdropPage = {
    async render(isNewPage) {
        const container = document.getElementById('airdrop');
        if (!container) return;

        if (container.innerHTML.trim() === '' || isNewPage) {
            container.innerHTML = `
                <div id="airdrop-header">${renderHeader()}</div>
                <div id="airdrop-body" class="max-w-5xl mx-auto pb-20">
                    <div id="loading-state" class="text-center p-12"><div class="loader inline-block"></div></div>
                    <div id="main-content" class="hidden animate-fade-in"></div>
                </div>
            `;
            this.attachListeners();
        }

        try {
            await loadAirdropData();
            const loader = document.getElementById('loading-state');
            const content = document.getElementById('main-content');
            if(loader) loader.classList.add('hidden');
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