// pages/AirdropPage.js

import { State } from '../state.js';
import * as db from '../modules/firebase-auth-service.js';
// Importa openModal E closeModal
import { showToast, openUgcSubmitModal, closeModal, openModal } from '../ui-feedback.js';
import { formatAddress, renderNoData, formatBigNumber, renderLoading } from '../utils.js';

let airdropState = {
    isConnected: false,
    systemConfig: null,
    leaderboards: null,
    user: null,
    dailyTasks: [],
    userSubmissions: [],
    flaggedSubmissions: [],
    activeTab: 'profile',
};

let dailyTimerInterval = null;
const DEFAULT_HASHTAGS = "#Backchain #BKC #Web3 #Crypto #Airdrop";

// Mapeamento de Status para UI (Cores Tailwind e Ícones Font Awesome)
const statusUI = {
    pending: { text: 'Pending Review', color: 'text-amber-400', bgColor: 'bg-amber-900/50', icon: 'fa-clock' },
    auditing: { text: 'Auditing', color: 'text-blue-400', bgColor: 'bg-blue-900/50', icon: 'fa-magnifying-glass' }, // Legado, se aparecer
    approved: { text: 'Approved', color: 'text-green-400', bgColor: 'bg-green-900/50', icon: 'fa-check-circle' },
    rejected: { text: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-900/50', icon: 'fa-times-circle' },
    flagged_suspicious: { text: 'Flagged - Review!', color: 'text-red-300', bgColor: 'bg-red-800/60', icon: 'fa-flag' },
};
// Mapeamento de Plataformas para Ícones e Cores
const platformUI = {
    'YouTube': { icon: 'fa-youtube', color: 'text-red-500' },
    'Instagram': { icon: 'fa-instagram', color: 'text-pink-500' },
    'X/Twitter': { icon: 'fa-twitter', color: 'text-blue-400' },
    'Other': { icon: 'fa-globe', color: 'text-gray-400' },
};


// =======================================================
//  1. FUNÇÕES DE CARREGAMENTO DE DADOS
// =======================================================
async function loadAirdropData() {
    airdropState.isConnected = State.isConnected;
    airdropState.user = null;
    airdropState.userSubmissions = [];
    airdropState.flaggedSubmissions = [];

    try {
        const publicData = await db.getPublicAirdropData();
        airdropState.systemConfig = publicData.config;
        airdropState.leaderboards = publicData.leaderboards;
        airdropState.dailyTasks = publicData.dailyTasks;

        if (airdropState.isConnected && State.userAddress) {
            const [user, submissions, flagged] = await Promise.all([
                db.getAirdropUser(State.userAddress),
                db.getUserSubmissions(),
                db.getUserFlaggedSubmissions()
            ]);
            airdropState.user = user;
            airdropState.userSubmissions = submissions;
            airdropState.flaggedSubmissions = flagged;

            if (airdropState.dailyTasks.length > 0) {
                 airdropState.dailyTasks = await Promise.all(airdropState.dailyTasks.map(async (task) => {
                     try {
                         if (!task.id) {
                            console.warn("Task missing ID:", task);
                            return { ...task, eligible: false, timeLeftMs: 0, error: true };
                         }
                         const eligibility = await db.isTaskEligible(task.id, task.cooldownHours);
                         return { ...task, eligible: eligibility.eligible, timeLeftMs: eligibility.timeLeft };
                     } catch (eligibilityError) {
                          console.error(`Error checking eligibility for task ${task.id}:`, eligibilityError);
                          return { ...task, eligible: false, timeLeftMs: 0, error: true };
                     }
                 }));
            }
        }
    } catch (error) {
        console.error("Failed to load airdrop data:", error);
        showToast("Error loading Airdrop data. Please refresh.", "error");
        airdropState.systemConfig = { isActive: false, roundName: "Error" };
        airdropState.leaderboards = null;
        airdropState.dailyTasks = [];
    }
}

// =======================================================
//  2. FUNÇÕES DE ESTADO E INTERAÇÃO
// =======================================================

function handleTabSwitch(e) {
    const button = e.target.closest('.airdrop-tab-btn');
    if (button) {
        const targetTab = button.getAttribute('data-target');
        if (targetTab && airdropState.activeTab !== targetTab) {
            if (dailyTimerInterval) {
                clearInterval(dailyTimerInterval);
                dailyTimerInterval = null;
            }
            airdropState.activeTab = targetTab;
            renderAirdropContent();
        }
    }
}

const formatTimeLeft = (ms) => {
    // ... (sem alterações) ...
     if (ms <= 0) return 'Ready';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${String(hours).padStart(2, '0')}h`);
    if (minutes > 0) parts.push(`${String(minutes).padStart(2, '0')}m`);
    if (days === 0 && hours === 0) parts.push(`${String(seconds).padStart(2, '0')}s`);
    return parts.length > 0 ? `Wait: ${parts.join(':')}` : 'Calculating...';
};

async function handleDailyTaskCompletion(e) {
    // ... (sem alterações na lógica, apenas no renderLoading) ...
    const btn = e.target.closest('.daily-task-btn');
    if (!btn || btn.disabled) return;
    const taskId = btn.dataset.taskId;
    const task = airdropState.dailyTasks.find(t => t.id === taskId);
    if (!task) return showToast("Task not found.", "error");
    if (!airdropState.user) return showToast("User profile not loaded.", "error");
    const originalText = btn.innerHTML;
    const tempLoaderContainer = document.createElement('span');
    tempLoaderContainer.classList.add('inline-block');
    renderLoading(tempLoaderContainer);
    btn.innerHTML = '';
    btn.appendChild(tempLoaderContainer);
    btn.disabled = true;
    try {
        const pointsEarned = await db.recordDailyTaskCompletion(task, airdropState.user.pointsMultiplier);
        showToast(`Successfully claimed ${pointsEarned} points!`, "success");
        await loadAirdropData();
        renderAirdropContent();
    } catch (error) {
        if (error.message.includes("Cooldown period is still active")) {
             showToast("Cooldown active. Cannot claim this task yet.", "error");
             btn.innerHTML = formatTimeLeft(task.timeLeftMs);
             setTimeout(() => { btn.disabled = false; }, 1000);
        } else {
             showToast(`Failed to record task: ${error.message}`, "error");
             console.error("Daily Task Claim Error:", error);
             btn.innerHTML = originalText;
             btn.disabled = false;
        }
    }
}


function generateShareText() {
    // ... (sem alterações) ...
     if (!airdropState.user || !airdropState.user.referralCode) return "Connect wallet to get your referral link.";
    const referralLink = `https://backcoin.org/?ref=${airdropState.user.referralCode}`;
    return `Check out Backchain! Earn rewards and support the network.\nMy referral link: ${referralLink}\n\n${DEFAULT_HASHTAGS}`;
}


function openPlatformSubmitModal(platform) {
    // ... (sem alterações na lógica) ...
     if (!airdropState.user) return showToast("Please connect your wallet first.", "error");
    const shareText = generateShareText();
    const referralLink = `https://backcoin.org/?ref=${airdropState.user.referralCode}`;
    openUgcSubmitModal(platform, referralLink, shareText, async (url) => {
        const submitBtn = document.getElementById('confirmUgcSubmitBtn');
        if (!submitBtn) return;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        const tempLoaderContainer = document.createElement('span');
        renderLoading(tempLoaderContainer);
        submitBtn.innerHTML = '';
        submitBtn.appendChild(tempLoaderContainer);
        try {
            await db.addSubmission(url, platform);
            showToast(`${platform} submission successful! Pending review.`, "success");
            closeModal();
            await loadAirdropData();
            renderAirdropContent();
        } catch (error) {
            if (error.message.includes("does not seem to be a valid")) { showToast(error.message, "error"); }
            else if (error.message.includes("already been submitted")) { showToast("Submission failed: Content already submitted.", "warning"); }
            else { showToast(`Error submitting ${platform} post: ${error.message}`, "error"); console.error("UGC Submit Error:", error); }
             submitBtn.disabled = false;
             submitBtn.innerHTML = originalBtnText;
        }
    });
}


async function handleResolveSubmission(e) {
     // ... (sem alterações na lógica) ...
     const button = e.target.closest('.resolve-flagged-btn');
     if (!button || button.disabled) return;
     const submissionId = button.dataset.submissionId;
     const resolution = button.dataset.resolution;
     if (!submissionId || !resolution) return;
     const card = button.closest('.flagged-submission-card');
     const buttonsContainer = card.querySelector('.resolve-buttons');
     const tempLoaderDiv = document.createElement('div');
     renderLoading(tempLoaderDiv);
     buttonsContainer.innerHTML = tempLoaderDiv.innerHTML;
     try {
         await db.resolveFlaggedSubmission(submissionId, resolution);
         showToast(`Submission marked as '${resolution}'.`, resolution === 'not_fraud' ? 'success' : 'info');
         await loadAirdropData();
         renderAirdropContent();
     } catch (error) {
         showToast(`Error resolving submission: ${error.message}`, "error");
         console.error("Resolve Flagged Error:", error);
         renderAirdropContent();
     }
}


function startDailyTimer() {
     // ... (sem alterações na lógica) ...
      const timerEl = document.getElementById('dailyResetTimer');
    if (!timerEl) return;
    if (dailyTimerInterval) { clearInterval(dailyTimerInterval); dailyTimerInterval = null; }
    const updateTimer = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        let diffMs = tomorrow.getTime() - now.getTime();
        if (diffMs < 0) diffMs = 0;
        const hours = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const seconds = String(Math.floor((diffMs % (1000 * 60)) / 1000)).padStart(2, '0');
        timerEl.textContent = `${hours}:${minutes}:${seconds}`;
        if (diffMs <= 1500 && diffMs > 0 && dailyTimerInterval) {
            clearInterval(dailyTimerInterval);
             dailyTimerInterval = null;
            showToast("Daily reset incoming! Reloading tasks...", "info");
            setTimeout(() => {
                 const airdropElement = document.getElementById('airdrop');
                 const isVisible = airdropElement && !airdropElement.classList.contains('hidden');
                 if (isVisible) { loadAirdropData().then(renderAirdropContent); }
            }, 2000);
        }
    };
    updateTimer();
    if (!dailyTimerInterval) { dailyTimerInterval = setInterval(updateTimer, 1000); }
}


// =======================================================
//  3. FUNÇÕES DE RENDERIZAÇÃO DE CONTEÚDO (REDESENHADAS)
// =======================================================

function renderProfileContent(el) {
    if (!el) return;

    if (!airdropState.isConnected) {
        const tempNoData = document.createElement('div');
        renderNoData(tempNoData, 'Connect your wallet to participate in the Airdrop.');
        el.innerHTML = `<div class="bg-sidebar border border-border-color rounded-xl p-6">${tempNoData.innerHTML}</div>`;
        return;
    }
     if (!airdropState.user) {
        renderLoading(el, 'Loading your profile...');
        return;
    }


    const { user, systemConfig, flaggedSubmissions, userSubmissions } = airdropState;
    const totalPoints = user.totalPoints || 0;
    const approvedCount = user.approvedSubmissionsCount || 0;
    const ugcMultiplier = Math.min(10.0, approvedCount * 0.1); // Máx 10x
    const multiplierDisplay = `${ugcMultiplier.toFixed(1)}x`;

    const pendingPoints = userSubmissions
        .filter(sub => sub.status === 'pending')
        .reduce((sum, sub) => sum + (sub.basePoints || 0), 0);


    const referralCode = user.referralCode || 'N/A';
    const referralLink = `https://backcoin.org/?ref=${referralCode}`;

     const referralBlock = `
        <div class="bg-sidebar border border-border-color rounded-xl p-6 mb-6">
            <h3 class="text-xl font-bold text-white mb-3"><i class="fa-solid fa-link mr-2 text-blue-400"></i> Your Referral Link</h3>
            <p class="text-sm text-zinc-400 mb-4">Share this link! Users who join using your link might grant you bonus points in the future.</p>
            <div class="flex gap-2 mb-3">
                <input type="text" id="referralLinkInput" value="${referralLink}" readonly class="form-input flex-1 !bg-zinc-900 border-zinc-700 font-mono text-sm">
                <button id="copyReferralBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm">
                    <i class="fa-solid fa-copy"></i>
                </button>
            </div>
             <button id="generateShareTextBtn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm w-full">
                <i class="fa-solid fa-share-nodes mr-2"></i> Generate Share Text (Link + Hashtags)
            </button>
        </div>
    `;

    // Redesenho do Bloco de Revisão
    const flaggedReviewBlock = flaggedSubmissions.length > 0 ? `
        <div class="bg-red-900/30 border border-red-500/50 rounded-xl p-6 mb-6">
            <h3 class="text-xl font-bold text-red-400 mb-3"><i class="fa-solid fa-flag mr-2"></i> Action Required: Review Submissions</h3>
            <p class="text-sm text-zinc-300 mb-4">Our system flagged the following submissions. Please confirm if they are legitimate or fraudulent:</p>
            <div id="flagged-submissions-list" class="space-y-4">
                ${flaggedSubmissions.map(sub => {
                     const ui = platformUI[sub.platform] || platformUI['Other'];
                     return `
                        <div class="flagged-submission-card bg-main border border-red-500/70 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div class="flex items-start gap-3 flex-grow min-w-0">
                                <i class="fa-brands ${ui.icon} ${ui.color} text-2xl mt-1 w-6 text-center shrink-0"></i>
                                <div class="min-w-0">
                                    <a href="${sub.url}" target="_blank" class="text-blue-400 hover:text-blue-300 font-semibold break-all block text-sm">
                                        ${sub.url}
                                    </a>
                                    <p class="text-xs text-zinc-400 mt-1">Submitted: ${sub.submittedAt ? sub.submittedAt.toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                            <div class="resolve-buttons flex gap-2 mt-2 sm:mt-0 shrink-0 self-end sm:self-center">
                                <button data-submission-id="${sub.submissionId}" data-resolution="not_fraud" class="resolve-flagged-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-3 rounded">
                                    <i class="fa-solid fa-check mr-1"></i> Legitimate
                                </button>
                                <button data-submission-id="${sub.submissionId}" data-resolution="is_fraud" class="resolve-flagged-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded">
                                    <i class="fa-solid fa-times mr-1"></i> Fraud/Spam
                                </button>
                            </div>
                        </div>
                    `}).join('')}
            </div>
        </div>
    ` : '';


     const tasksHtml = airdropState.dailyTasks.length > 0 ? airdropState.dailyTasks.map(task => {
        if (task.error) {
             return `
             <div class="bg-main border border-red-500/50 rounded-xl p-5 flex justify-between items-center flex-wrap gap-4 opacity-70">
                 <p class="font-semibold text-red-400 truncate">${task.title || 'Unknown Task'}</p>
                 <p class="text-xs text-red-400">Error loading status</p>
             </div>
             `;
        }
        const points = Math.round(task.points); // Pontos base
        const isEligible = task.eligible;
        const btnClass = isEligible ? 'bg-amber-500 hover:bg-amber-600 text-zinc-900' : 'bg-zinc-700 btn-disabled text-zinc-400';
        const icon = task.cooldownHours <= 24 ? 'fa-clock' : 'fa-hourglass-start';
        const expiryDate = task.endDate ? new Date(task.endDate).toLocaleDateString() : 'Never';

        return `
            <div class="bg-main border border-border-color rounded-xl p-5 flex justify-between items-start flex-wrap gap-4 transition-all duration-300">
                <div class="flex flex-col flex-grow min-w-0">
                    <p class="font-extrabold text-xl text-white truncate">${task.title}</p>
                    <p class="text-sm text-zinc-400 mt-1">${task.description || 'Visit and engage.'}</p>
                     ${task.url ?
                        `<a href="${task.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 text-xs font-bold transition-colors mt-2 inline-block max-w-max">
                            <i class="fa-solid fa-up-right-from-square mr-1"></i> Go to Task
                        </a>` : `<div class="mt-2 h-4"></div>`
                    }
                    <div class="mt-3 flex items-center gap-4 text-xs text-zinc-500 flex-wrap">
                        <span><i class="fa-solid ${icon} mr-1"></i> Cooldown: ${task.cooldownHours}h</span>
                        <span><i class="fa-solid fa-calendar-times mr-1"></i> Expires: ${expiryDate}</span>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-2 shrink-0">
                    <span class="text-3xl font-extrabold text-yellow-400">+${points}</span>
                    <span class="text-xs text-zinc-400 -mt-1">Points</span>

                    <button data-task-id="${task.id}" class="daily-task-btn ${btnClass} font-bold py-2 px-4 rounded-md text-sm w-full sm:w-auto mt-2" ${!isEligible ? 'disabled' : ''}>
                        ${isEligible ? 'Claim Points' : formatTimeLeft(task.timeLeftMs)}
                    </button>
                </div>
            </div>
        `;
    }).join('') : (() => {
        const tempDiv = document.createElement('div');
        renderNoData(tempDiv, '<i class="fa-solid fa-list-check mr-2"></i> No active daily tasks available right now. Check back later!');
        return tempDiv.innerHTML;
    })();


    el.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-1 bg-sidebar border border-border-color rounded-xl p-6 flex flex-col h-fit shadow-lg">
                <h2 class="text-xl font-bold mb-4 text-white text-center border-b border-zinc-700 pb-3">Your Airdrop Profile</h2>
                <div class="w-full space-y-5 mt-4">
                    <div class="text-center">
                        <i class="fa-solid fa-trophy text-6xl text-amber-500 mb-3"></i>
                        <p class="text-sm text-zinc-400">Connected Wallet</p>
                        <p class="font-bold text-white text-lg break-all">${user.walletAddress}</p>
                    </div>
                    <div class="pt-4 border-t border-zinc-700">
                        <p class="text-sm text-zinc-400 mb-2 text-center">Total Points Earned</p>
                        <div class="flex justify-center items-center gap-4">
                            <p class="text-5xl font-extrabold text-yellow-400">${totalPoints.toLocaleString()}</p>
                            <span class="bg-yellow-400/10 text-yellow-400 text-sm font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-star mr-1"></i> Score</span>
                        </div>
                        <p class="text-xs text-zinc-500 text-center mt-1">(Includes Daily Tasks and Approved UGC)</p>
                    </div>

                     <div class="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-700">
                        <div class="bg-main rounded-lg p-3 text-center border border-border-color">
                            <p class="text-xs text-zinc-400">UGC Multiplier</p>
                            <p class="text-2xl font-bold text-green-400">${multiplierDisplay}</p>
                             <p class="text-xs text-zinc-500">(${approvedCount} approved)</p>
                        </div>
                         <div class="bg-main rounded-lg p-3 text-center border border-border-color">
                            <p class="text-xs text-zinc-400">Pending UGC</p>
                            <p class="text-2xl font-bold text-amber-400">${pendingPoints.toLocaleString()}</p>
                             <p class="text-xs text-zinc-500">(Base Points)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-2 space-y-6">
                 ${referralBlock}
                 ${flaggedReviewBlock}

                <div class="bg-sidebar border border-border-color rounded-xl p-6">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <h2 class="text-2xl font-bold text-white">Daily Engagement Tasks</h2>
                        <div class="text-left sm:text-right w-full sm:w-auto">
                             <p class="text-xs text-zinc-500">Daily Reset In (UTC)</p>
                             <p id="dailyResetTimer" class="text-lg font-bold text-amber-400">--:--:--</p>
                        </div>
                    </div>
                    <p class="text-sm text-zinc-400 mb-5">Complete these tasks daily to earn points. New tasks may appear after the reset timer hits zero.</p>
                    <div id="tasks-content" class="space-y-4">${tasksHtml}</div>
                </div>
            </div>
        </div>
    `;

    startDailyTimer();

    document.getElementById('copyReferralBtn')?.addEventListener('click', (e) => {
        const input = document.getElementById('referralLinkInput');
        const button = e.currentTarget;
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
             const originalIcon = button.innerHTML;
             button.innerHTML = '<i class="fa-solid fa-check"></i>';
             setTimeout(() => { button.innerHTML = originalIcon; }, 1500);
        });
    });

    document.getElementById('generateShareTextBtn')?.addEventListener('click', () => {
         const text = generateShareText();
         openModal(`
            <h3 class="text-lg font-bold mb-3">Copy Your Share Text</h3>
            <textarea id="generatedShareText" rows="5" readonly class="form-input !bg-zinc-800 border-zinc-700 font-mono text-sm w-full mb-3">${text}</textarea>
            <div class="flex justify-end gap-2">
                 <button id="copyGeneratedTextBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm">
                    <i class="fa-solid fa-copy mr-1"></i> Copy Text
                </button>
                 <button class="closeModalBtn bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-md text-sm">Close</button>
            </div>
         `);
         document.getElementById('copyGeneratedTextBtn')?.addEventListener('click', (e) => {
             const textarea = document.getElementById('generatedShareText');
             const button = e.currentTarget;
             textarea.select();
             navigator.clipboard.writeText(textarea.value).then(() => {
                 const originalText = button.innerHTML;
                 button.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Copied!';
                 setTimeout(() => { button.innerHTML = originalText; closeModal(); }, 1500);
             });
         });
    });

    document.getElementById('flagged-submissions-list')?.addEventListener('click', handleResolveSubmission);
    document.getElementById('tasks-content')?.addEventListener('click', handleDailyTaskCompletion);

    // Reinicia contadores de cooldown
    document.querySelectorAll('.daily-task-btn[data-task-id]').forEach(btn => {
         if (btn._cooldownInterval) clearInterval(btn._cooldownInterval);
         btn._cooldownInterval = null;
         const taskId = btn.dataset.taskId;
         const task = airdropState.dailyTasks.find(t => t.id === taskId);
         if (task && !task.eligible && task.timeLeftMs > 0) {
             let countdownMs = task.timeLeftMs;
             const updateButtonText = () => {
                 countdownMs -= 1000;
                 if (countdownMs <= 0) {
                     clearInterval(btn._cooldownInterval);
                     btn._cooldownInterval = null;
                     if (document.body.contains(btn)) { // Verifica se botão ainda existe
                         btn.innerHTML = 'Claim Points';
                         btn.disabled = false;
                         btn.classList.remove('bg-zinc-700', 'btn-disabled', 'text-zinc-400');
                         btn.classList.add('bg-amber-500', 'hover:bg-amber-600', 'text-zinc-900');
                     }
                     const taskIndex = airdropState.dailyTasks.findIndex(t => t.id === task.id);
                     if (taskIndex > -1) {
                        airdropState.dailyTasks[taskIndex].eligible = true;
                        airdropState.dailyTasks[taskIndex].timeLeftMs = 0;
                     }
                 } else {
                     if (document.body.contains(btn)) {
                         btn.innerHTML = formatTimeLeft(countdownMs);
                     } else {
                          clearInterval(btn._cooldownInterval);
                          btn._cooldownInterval = null;
                     }
                 }
             };
             updateButtonText();
             btn._cooldownInterval = setInterval(updateButtonText, 1000);
         }
    });
}


function renderSubmissionPanel(el) {
    if (!el) return;
    if (dailyTimerInterval) { clearInterval(dailyTimerInterval); dailyTimerInterval = null; }

    if (!airdropState.isConnected) {
        const tempNoData = document.createElement('div');
        renderNoData(tempNoData, 'Connect your wallet to submit content and view history.');
        el.innerHTML = `<div class="bg-sidebar border border-border-color rounded-xl p-6">${tempNoData.innerHTML}</div>`;
        return;
    }

    // --- REDESENHO DO HISTÓRICO ---
    const renderSubmissionHistory = () => {
        if (!airdropState.userSubmissions || airdropState.userSubmissions.length === 0) {
            const tempDiv = document.createElement('div');
            renderNoData(tempDiv, 'You have not submitted any content yet.');
            return tempDiv.innerHTML;
        }

        return airdropState.userSubmissions.map(sub => {
            const uiStatus = statusUI[sub.status] || statusUI.pending; // Fallback para pending
            const uiPlatform = platformUI[sub.platform] || platformUI.Other; // Fallback para Other

            let pointsDisplay = '';
            if (sub.status === 'approved') {
                pointsDisplay = `(+${sub.pointsAwarded || 0} Pts)`;
            } else if (sub.status === 'pending' || sub.status === 'auditing' || sub.status === 'flagged_suspicious') {
                pointsDisplay = `(${sub.basePoints || 0} base pts)`;
            }

            return `
                <div class="submission-history-card bg-main border border-border-color rounded-lg p-4 mb-3 transition-colors hover:bg-zinc-800/50 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div class="flex items-start gap-4 flex-grow min-w-0">
                        <i class="fa-brands ${uiPlatform.icon} ${uiPlatform.color} text-3xl mt-1 w-8 text-center shrink-0"></i>
                        <div class="min-w-0">
                            <a href="${sub.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 font-semibold break-all block text-sm leading-snug">
                                ${sub.url}
                            </a>
                            <p class="text-xs text-zinc-400 mt-1.5">
                                Submitted: ${sub.submittedAt ? sub.submittedAt.toLocaleDateString() : 'N/A'}
                                ${sub.resolvedAt ? ` | Resolved: ${sub.resolvedAt.toLocaleDateString()}` : ''}
                            </p>
                        </div>
                    </div>
                    <div class="text-left sm:text-right mt-2 sm:mt-0 shrink-0 flex flex-col items-end">
                        <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${uiStatus.bgColor} ${uiStatus.color}">
                            <i class="fa-solid ${uiStatus.icon}"></i>
                            ${uiStatus.text}
                        </span>
                        <p class="text-sm font-bold ${uiStatus.color} mt-1">${pointsDisplay}</p>
                    </div>
                </div>
            `;
        }).join('');
    };

     // --- REDESENHO DOS BOTÕES DE PLATAFORMA ---
     const platformButtons = [
        { name: 'YouTube', icon: 'fa-youtube', color: 'text-red-500', points: 5000 },
        { name: 'Instagram', icon: 'fa-instagram', color: 'text-pink-500', points: 3000 },
        { name: 'X/Twitter', icon: 'fa-twitter', color: 'text-blue-400', points: 1500 },
        { name: 'Other', icon: 'fa-globe', color: 'text-gray-400', points: 1000 },
     ];

    el.innerHTML = `
        <h2 class="text-2xl font-bold mb-1 text-white">UGC Submission</h2>
         <p class="text-sm text-zinc-400 mb-6">Earn points and a permanent multiplier by sharing Backchain content.</p>

        <div class="bg-sidebar border border-border-color rounded-xl p-6 mb-8 shadow-xl">
             <p class="text-zinc-300 mb-5 font-semibold text-center text-lg">
                 Select the platform of your content:
            </p>
            <div id="ugc-platform-selector" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                 ${platformButtons.map(p => `
                    <button class="ugc-platform-btn-redesigned bg-main border border-border-color p-5 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:border-amber-500/50 hover:shadow-lg hover:-translate-y-1 hover:bg-zinc-800" data-platform="${p.name}">
                        <i class="fa-brands ${p.icon} ${p.color} text-4xl"></i>
                        <span class="font-semibold text-white text-base">${p.name}</span>
                        <span class="text-xs ${p.color} font-medium">(+${p.points} base pts)</span>
                    </button>
                 `).join('')}
            </div>
             <p class="text-xs text-zinc-500 mt-5 italic text-center">
                Ensure your post includes your referral link, hashtags, and a link to official Backchain news/content.
            </p>
        </div>

        <h3 class="text-xl font-bold mb-3 text-white">Your Submission History</h3>
        <div id="ugc-submission-history" class="space-y-3"> {/* Alterado para space-y */}
            ${renderSubmissionHistory()}
        </div>
    `;

    // Listener para os botões de plataforma (agora com a nova classe)
    document.getElementById('ugc-platform-selector')?.addEventListener('click', (e) => {
        const button = e.target.closest('.ugc-platform-btn-redesigned');
        if (button) {
            const platform = button.dataset.platform;
            openPlatformSubmitModal(platform);
        }
    });
}


function renderLeaderboardPanel(el) {
    // ... (HTML interno redesenhado com comentários removidos) ...
     if (!el) return;
    if (dailyTimerInterval) { clearInterval(dailyTimerInterval); dailyTimerInterval = null; }

    const { leaderboards } = airdropState;
    const topByPoints = leaderboards?.top100ByPoints || [];
    const topByPosts = leaderboards?.top100ByPosts || [];
    const lastUpdatedTimestamp = leaderboards?.lastUpdated;
    let lastUpdated = 'N/A';
    if(lastUpdatedTimestamp) {
        const date = lastUpdatedTimestamp.toDate ? lastUpdatedTimestamp.toDate() : new Date(lastUpdatedTimestamp);
         try {
             lastUpdated = date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
         } catch (e) { console.warn("Could not format leaderboard update time:", e); }
    }


    const renderList = (list, columns = 3, valueKey = 'Points', formatFn = (val) => val?.toLocaleString() || '0') => {
        if (!list || list.length === 0) {
             return `<tr><td colspan="${columns}" class="p-4 text-center text-zinc-500">Leaderboard data is currently unavailable.</td></tr>`;
        }

        return list.map((item, index) => {
            const isUser = airdropState.user && item.walletAddress && airdropState.user.walletAddress?.toLowerCase() === item.walletAddress.toLowerCase();
            let rankClass = 'hover:bg-main';

            if (index === 0) rankClass = 'bg-amber-400/20 text-yellow-400 font-extrabold hover:bg-amber-400/30';
            else if (index < 3) rankClass = 'bg-amber-500/10 text-amber-300 font-semibold hover:bg-amber-500/20';

            if (isUser) rankClass = 'bg-blue-900/40 font-bold border-l-4 border-blue-400 hover:bg-blue-900/60';

            return `
                <tr class="${rankClass} border-b border-zinc-800 last:border-b-0">
                    <td class="p-3 font-bold">${index + 1}</td>
                    <td class="p-3 font-mono text-xs">${formatAddress(item.walletAddress || 'Unknown')}</td>
                    <td class="p-3 text-right font-bold">${formatFn(item.value)} ${valueKey}</td>
                </tr>
            `;
        }).join('');
    };

    const nftPrizeTiers = `
        <p class="font-bold text-white mb-2 text-sm">NFT Prize Tiers (Boosters):</p>
        <ul class="list-none space-y-2 text-xs text-zinc-300">
            <li><i class="fa-solid fa-gem text-blue-400 w-4"></i> <span class="font-bold">Rank #1:</span> Diamond Booster NFT</li>
            <li><i class="fa-solid fa-crown text-gray-300 w-4"></i> <span class="font-bold">Ranks #2 - #3:</span> Platinum Booster NFT</li>
            <li><i class="fa-solid fa-medal text-yellow-500 w-4"></i> <span class="font-bold">Ranks #4 - #8:</span> Gold Booster NFT</li>
            <li><i class="fa-solid fa-certificate text-gray-400 w-4"></i> <span class="font-bold">Ranks #9 - #12:</span> Silver Booster NFT</li>
            <li><i class="fa-solid fa-award text-amber-700 w-4"></i> <span class="font-bold">Ranks #13 - #25:</span> Bronze Booster NFT</li>
            <li><i class="fa-solid fa-user-check text-green-500 w-4"></i> <span class="font-bold">Ranks #26 - #2300+:</span> Standard Booster NFT (Tier TBD)</li>
        </ul>
    `;


    el.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 text-white">Leaderboards & Rewards</h2>
        <p class="text-sm text-zinc-400 mb-6">
            <i class="fa-solid fa-sync mr-1"></i> Data Last Updated: ${lastUpdated} (System Generated)
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-sidebar border border-border-color rounded-xl shadow-xl overflow-hidden">
                <div class="p-5">
                    <h3 class="text-xl font-bold mb-3 text-yellow-400"><i class="fa-solid fa-star mr-2"></i> Total Points Ranking</h3>
                    <p class="text-zinc-400 mb-4 text-sm border-b border-zinc-700/50 pb-3">
                        <span class="font-bold text-white">Reward:</span> Final $BKC Token Allocation. Your ranking determines your share of the main token pool.
                    </p>
                </div>

                <div class="overflow-y-auto max-h-[600px]">
                    <table class="w-full text-left text-sm table-fixed">
                        <thead class="sticky top-0 bg-zinc-800 z-10">
                            <tr class="text-zinc-400 border-b border-zinc-700">
                                <th class="p-3 w-16">Rank</th>
                                <th class="p-3 w-48">Wallet</th>
                                <th class="p-3 text-right">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderList(topByPoints, 3, 'Pts')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-sidebar border border-border-color rounded-xl shadow-xl overflow-hidden">
                <div class="p-5">
                    <h3 class="text-xl font-bold mb-3 text-green-400"><i class="fa-solid fa-file-invoice mr-2"></i> UGC Posts Ranking</h3>
                    <p class="text-zinc-400 mb-4 text-sm border-b border-zinc-700/50 pb-3">
                        <span class="font-bold text-white">Reward:</span> Tiered $BKC Reward Booster NFT. Top wallets with approved content win.
                    </p>
                </div>

                <div class="p-5 bg-main border-y border-zinc-700/50">
                    ${nftPrizeTiers}
                </div>

                <div class="overflow-y-auto max-h-[600px] mt-0">
                    <table class="w-full text-left text-sm table-fixed">
                         <thead class="sticky top-0 bg-zinc-800 z-10">
                            <tr class="text-zinc-400 border-b border-zinc-700">
                                <th class="p-3 w-16">Rank</th>
                                <th class="p-3 w-48">Wallet</th>
                                <th class="p-3 text-right">Posts</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderList(topByPosts, 3, 'Posts', (val) => val?.toLocaleString() || '0')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// =======================================================
//  4. RENDERIZAÇÃO PRINCIPAL E EXPORTAÇÃO
// =======================================================

function renderAirdropContent() {
    // ... (Lógica de renderização das abas como antes, sem os comentários internos) ...
    const mainContainer = document.getElementById('airdrop');
    const loadingPlaceholder = document.getElementById('airdrop-loading-placeholder');
    const tabsContainer = document.getElementById('airdrop-tabs-container');
    const contentWrapper = document.getElementById('airdrop-content-wrapper');
    const activeContentEl = document.getElementById('active-tab-content');

    if (!mainContainer || !contentWrapper || !activeContentEl || !tabsContainer || !loadingPlaceholder) {
         console.error("Airdrop container elements not found!");
         return;
    }

    loadingPlaceholder.innerHTML = '';

    const getTabClass = (tabName) => {
        const baseClass = 'airdrop-tab-btn py-3 px-6 text-sm font-semibold transition-colors border-b-2';
        return airdropState.activeTab === tabName
            ? `${baseClass} border-amber-500 text-amber-400`
            : `${baseClass} text-zinc-400 hover:text-white border-transparent hover:border-zinc-500/50`;
    };

    tabsContainer.innerHTML = `
        <div class="border-b border-zinc-700 mb-6">
            <nav id="airdrop-tabs" class="-mb-px flex flex-wrap gap-x-6 gap-y-2">
                <button class="${getTabClass('profile')}" data-target="profile">
                    <i class="fa-solid fa-user-check mr-2"></i> Your Profile & Tasks
                </button>
                <button class="${getTabClass('ugc')}" data-target="ugc">
                    <i class="fa-solid fa-upload mr-2"></i> UGC Submissions
                </button>
                <button class="${getTabClass('leaderboards')}" data-target="leaderboards">
                    <i class="fa-solid fa-ranking-star mr-2"></i> Leaderboards & Rewards
                </button>
            </nav>
        </div>
    `;

    const tabsNav = document.getElementById('airdrop-tabs');
    if (tabsNav && !tabsNav._listenerAttached) {
       tabsNav.addEventListener('click', handleTabSwitch);
       tabsNav._listenerAttached = true;
    }


    activeContentEl.innerHTML = '';
    try {
        switch (airdropState.activeTab) {
            case 'profile':
                renderProfileContent(activeContentEl);
                break;
            case 'ugc':
                renderSubmissionPanel(activeContentEl);
                break;
            case 'leaderboards':
                renderLeaderboardPanel(activeContentEl);
                break;
            default:
                 renderProfileContent(activeContentEl);
        }
    } catch (error) {
         console.error(`Error rendering tab ${airdropState.activeTab}:`, error);
         renderError(activeContentEl, `Error loading ${airdropState.activeTab} content.`);
    }
}


export const AirdropPage = {
    async render() {
        const airdropEl = document.getElementById('airdrop');
        if (!airdropEl) return;

        if (dailyTimerInterval) {
            clearInterval(dailyTimerInterval);
            dailyTimerInterval = null;
        }

        const loadingPlaceholder = document.getElementById('airdrop-loading-placeholder')
         || (()=>{ const d=document.createElement('div'); d.id='airdrop-loading-placeholder'; airdropEl.appendChild(d); return d; })();

        const tempLoaderDiv = document.createElement('div');
        renderLoading(tempLoaderDiv, 'Loading Airdrop data...');
        loadingPlaceholder.innerHTML = tempLoaderDiv.innerHTML;


        const tabsContainer = document.getElementById('airdrop-tabs-container');
        const contentWrapper = document.getElementById('airdrop-content-wrapper');
        if (tabsContainer) tabsContainer.innerHTML = '';
        if (contentWrapper) contentWrapper.innerHTML = '<div id="active-tab-content"></div>';


        await loadAirdropData();
        renderAirdropContent();
    },

    update(isConnected) {
        const airdropElement = document.getElementById('airdrop');
        const isVisible = airdropElement && !airdropElement.classList.contains('hidden');

        if (airdropState.isConnected !== isConnected && isVisible) {
             console.log("AirdropPage: Connection status changed, reloading data...");
             this.render();
        }
    }
};