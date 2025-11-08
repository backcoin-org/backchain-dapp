// pages/AirdropPage.js
// REESTRUTURADO: Focado apenas nas ações de Airdrop (Submit & Tasks).
// A funcionalidade de Ranking foi removida para uma página separada (RankingPage.js).

import { State } from '../state.js';
import * as db from '../modules/firebase-auth-service.js';
import { showToast, closeModal, openModal } from '../ui-feedback.js';
import { formatAddress, renderNoData, formatBigNumber, renderLoading, renderError } from '../utils.js';
import { API_ENDPOINTS } from '../modules/data.js';

// ==========================================================
//  FUNÇÃO MULTIPLICADOR (Sem alteração)
// ==========================================================
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

// --- Airdrop Page State (Simplificado) ---
let airdropState = {
    isConnected: false,
    systemConfig: null,
    basePoints: null,
    // leaderboards: null, // <-- REMOVIDO (Movido para RankingPage.js)
    user: null,
    dailyTasks: [],
    userSubmissions: [],
    isBanned: false,
    activeMainTab: 'content-submission', // <-- NOVO PADRÃO
    // activeSubmitTab: 'content-submission', // <-- REMOVIDO (Não há sub-abas)
    activeHistoryTab: 'pending',
};

// --- Constants (Sem alteração) ---
const DEFAULT_HASHTAGS = "#Backchain #BKC #Web3 #Crypto #Airdrop";
const AUTO_APPROVE_HOURS = 2;
const statusUI = {
    pending: { text: 'Pending Review', color: 'text-amber-400', bgColor: 'bg-amber-900/50', icon: 'fa-clock' },
    auditing: { text: 'Auditing', color: 'text-blue-400', bgColor: 'bg-blue-900/50', icon: 'fa-magnifying-glass' },
    approved: { text: 'Approved', color: 'text-green-400', bgColor: 'bg-green-900/50', icon: 'fa-check-circle' },
    rejected: { text: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-900/50', icon: 'fa-times-circle' },
    deleted_by_user: { text: 'Error Reported', color: 'text-zinc-400', bgColor: 'bg-zinc-700/50', icon: 'fa-trash-alt' },
    flagged_suspicious: { text: 'Flagged - Review!', color: 'text-red-300', bgColor: 'bg-red-800/60', icon: 'fa-flag' },
    pending_confirmation: { text: 'Action Required', color: 'text-cyan-400', bgColor: 'bg-cyan-900/50', icon: 'fa-clipboard-check' }
};
const platformUI = {
    'YouTube': { icon: 'fa-youtube', color: 'text-red-500', type: 'brands' },
    'YouTube Shorts': { icon: 'fa-youtube', color: 'text-red-500', type: 'brands' },
    'Instagram': { icon: 'fa-instagram', color: 'text-pink-500', type: 'brands' },
    'X/Twitter': { icon: 'fa-x-twitter', color: 'text-white', type: 'brands' },
    'Facebook': { icon: 'fa-facebook', color: 'text-blue-600', type: 'brands' },
    'Telegram': { icon: 'fa-telegram', color: 'text-cyan-400', type: 'brands' },
    'TikTok': { icon: 'fa-tiktok', color: 'text-zinc-100', type: 'brands' },
    'Reddit': { icon: 'fa-reddit', color: 'text-orange-500', type: 'brands' },
    'LinkedIn': { icon: 'fa-linkedin', color: 'text-blue-700', type: 'brands' },
    'Other': { icon: 'fa-globe', color: 'text-gray-400', type: 'solid' },
};

// =======================================================
//  1. MAIN DATA LOADING FUNCTION (Simplificado)
// =======================================================
async function loadAirdropData() {
    // Reset state
    airdropState.isConnected = State.isConnected;
    airdropState.user = null;
    airdropState.userSubmissions = [];
    airdropState.isBanned = false;
    airdropState.basePoints = null;

    try {
        // Fetch public data (config, active tasks)
        // getPublicAirdropData ainda retorna leaderboards, mas não os usamos aqui.
        const publicData = await db.getPublicAirdropData();

        airdropState.systemConfig = publicData.config;
        airdropState.basePoints = publicData.config?.ugcBasePoints || { /*...defaults...*/ };
        // airdropState.leaderboards = publicData.leaderboards; // <-- REMOVIDO
        airdropState.dailyTasks = publicData.dailyTasks;

        // Se conectado, busca dados do usuário (sem alteração)
        if (airdropState.isConnected && State.userAddress) {
            const [user, submissions] = await Promise.all([
                db.getAirdropUser(State.userAddress),
                db.getUserSubmissions(),
            ]);
            airdropState.user = user;
            airdropState.userSubmissions = submissions;

            if (user.isBanned) {
                airdropState.isBanned = true;
                return;
            }

            // Carrega elegibilidade das tarefas (sem alteração)
            if (airdropState.dailyTasks.length > 0) {
                 airdropState.dailyTasks = await Promise.all(airdropState.dailyTasks.map(async (task) => {
                     try {
                         if (!task.id) return { ...task, eligible: false, timeLeftMs: 0, error: true };
                         const eligibility = await db.isTaskEligible(task.id, task.cooldownHours);
                         return { ...task, eligible: eligibility.eligible, timeLeftMs: eligibility.timeLeft };
                     } catch (eligibilityError) {
                          return { ...task, eligible: false, timeLeftMs: 0, error: true };
                     }
                 }));
            }
        }
    } catch (error) {
        console.error("Failed to load airdrop data:", error);
        showToast(error.message || "Error loading Airdrop data. Please refresh.", "error");
        airdropState.systemConfig = { isActive: false, roundName: "Error Loading Data" };
        // airdropState.leaderboards = null; // <-- REMOVIDO
        airdropState.dailyTasks = [];
        airdropState.basePoints = {};
    }
}

// =======================================================
//  2. USER INTERACTION FUNCTIONS
// =======================================================

// --- Main Tab Switch (Agora alterna entre 'content-submission' e 'daily-tasks') ---
function handleMainTabSwitch(e) {
    const button = e.target.closest('.airdrop-tab-btn');
    if (button) {
        const targetTab = button.getAttribute('data-target');
        if (targetTab && airdropState.activeMainTab !== targetTab) {
            // Limpa timers de cooldown ao trocar de aba
            document.querySelectorAll('.task-card-link').forEach(card => {
                if (card._cooldownInterval) clearInterval(card._cooldownInterval);
                card._cooldownInterval = null;
            });
            airdropState.activeMainTab = targetTab;
            // Reseta a sub-aba de histórico se voltar para 'content-submission'
            if(targetTab === 'content-submission') {
                 airdropState.activeHistoryTab = 'pending';
            }
            renderAirdropContent(); // Re-renderiza tudo
        }
    }
}

// --- handleSubmitTabSwitch ---
// FUNÇÃO REMOVIDA (Não há mais sub-abas 'Submit & Earn')

// --- History Sub-Sub-Tab Switch (Sem alteração) ---
function handleHistoryTabSwitch(e) {
    const button = e.target.closest('.history-tab-btn');
    if (button) {
        const targetTab = button.getAttribute('data-target');
        if (targetTab && airdropState.activeHistoryTab !== targetTab) {
            airdropState.activeHistoryTab = targetTab;
            // Alterna classes e visibilidade dos painéis (lógica mantida)
            document.querySelectorAll('.history-tab-btn').forEach(btn => {
                const btnTarget = btn.getAttribute('data-target');
                const baseClass = 'history-tab-btn flex-1 sm:flex-none text-center sm:text-left justify-center sm:justify-start flex items-center gap-2 py-2 px-4 text-sm font-semibold transition-colors border-b-2 focus:outline-none rounded-t-md';
                if (btnTarget === targetTab) {
                    btn.className = `${baseClass} border-amber-500 text-amber-400 bg-main`;
                } else {
                    btn.className = `${baseClass} text-zinc-400 hover:text-white border-transparent hover:border-zinc-500/50`;
                }
            });
            const pendingList = document.getElementById('pending-submissions-list');
            const finalizedList = document.getElementById('finalized-submissions-list');
            if (pendingList) pendingList.classList.toggle('hidden', targetTab !== 'pending');
            if (finalizedList) finalizedList.classList.toggle('hidden', targetTab !== 'finalized');
        }
    }
}

// --- formatTimeLeft (Sem alteração) ---
const formatTimeLeft = (ms) => { /* ... */ };

// --- animateValue (Sem alteração) ---
function animateValue(element, start, end, duration, isPoints = true) { /* ... */ }

// --- handleGoToTask (Sem alteração) ---
async function handleGoToTask(e) {
    const cardLink = e.target.closest('.task-card-link');
    if (!cardLink) return;
    e.preventDefault();
    const taskId = cardLink.dataset.taskId;
    const taskUrl = cardLink.dataset.taskUrl;
    const task = airdropState.dailyTasks.find(t => t.id === taskId);
    if (!task) return showToast("Task not found.", "error");
    if (!airdropState.user) return showToast("User profile not loaded.", "error");

    if (taskUrl && taskUrl.startsWith('http')) {
        window.open(taskUrl, '_blank', 'noopener,noreferrer');
    }
    if (!airdropState.dailyTasks.find(t => t.id === taskId)?.eligible) {
        return showToast("Task link opened. Cannot earn points yet (cooldown active).", "info");
    }

    const statusBadge = cardLink.querySelector('.task-status-badge');
    const originalStatusHTML = statusBadge ? statusBadge.innerHTML : '';
    if (statusBadge) renderLoading(statusBadge, 'Processing...');
    cardLink.classList.add('task-disabled', 'opacity-60', 'cursor-not-allowed');

    try {
        const pointsEarned = await db.recordDailyTaskCompletion(task, airdropState.user.pointsMultiplier);
        showToast(`Task complete! +${pointsEarned} points!`, "success");

        // Atualização Otimista (Mantida)
        if (airdropState.user) {
            airdropState.user.totalPoints = (airdropState.user.totalPoints || 0) + pointsEarned;
        }
        const taskIndex = airdropState.dailyTasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            const cooldownMs = task.cooldownHours * 3600000;
            airdropState.dailyTasks[taskIndex].eligible = false;
            airdropState.dailyTasks[taskIndex].timeLeftMs = cooldownMs;
            if (statusBadge) {
                statusBadge.innerHTML = formatTimeLeft(cooldownMs).replace('Cooldown: ', '');
                statusBadge.classList.remove('bg-amber-600', 'hover:bg-amber-700', 'text-white');
                statusBadge.classList.add('bg-zinc-700', 'text-zinc-400');
                startIndividualCooldownTimer(cardLink, statusBadge, cooldownMs);
            }
        }
        
        // Re-renderiza a aba atual
        if (airdropState.activeMainTab === 'daily-tasks') {
             const contentEl = document.getElementById('active-tab-content');
             if(contentEl) {
                 // A função renderDailyTasksPanelContent agora é chamada diretamente
                 contentEl.innerHTML = renderDailyTasksPanelContent();
                 attachDailyTaskListeners(); // Re-anexa listeners e timers
             }
        } else if (airdropState.activeMainTab === 'content-submission') {
             // Se estiver na outra aba, re-renderiza ela para atualizar stats
             const contentEl = document.getElementById('active-tab-content');
             if(contentEl) {
                 contentEl.innerHTML = renderSubmissionPanelContent();
                 attachContentSubmissionListeners(); // Re-anexa listeners
             }
        }
    } catch (error) {
        // Lógica de erro mantida
        if (error.message.includes("Cooldown period is still active")) {
             showToast("Cooldown active. Cannot complete this task yet.", "error");
             const eligibility = await db.isTaskEligible(task.id, task.cooldownHours);
             if (statusBadge && document.body.contains(statusBadge)) statusBadge.innerHTML = formatTimeLeft(eligibility.timeLeft).replace('Cooldown: ', '');
        } else {
             showToast(`Failed to record task: ${error.message}`, "error");
             if (statusBadge && document.body.contains(statusBadge)) statusBadge.innerHTML = originalStatusHTML;
        }
        // Reverte estado visual do card
        if(document.body.contains(cardLink)) {
            cardLink.classList.remove('task-disabled', 'opacity-60', 'cursor-not-allowed');
        }
        if (statusBadge && document.body.contains(statusBadge)) {
             statusBadge.classList.remove('bg-zinc-700', 'text-zinc-400');
             statusBadge.classList.add('bg-amber-600', 'hover:bg-amber-700', 'text-white');
        }
    }
}

// --- startIndividualCooldownTimer (Sem alteração) ---
function startIndividualCooldownTimer(cardLink, statusBadge, initialMs) { /* ... */ }

// --- handleCopyReferralLink (Sem alteração) ---
function handleCopyReferralLink() { /* ... */ }

// --- handleResolveSubmission (Sem alteração) ---
async function handleResolveSubmission(e) { /* ... */ }

// --- openConfirmationModal (Sem alteração) ---
function openConfirmationModal(submissionId) { /* ... */ }

// --- handleConfirmAuthenticity (Lógica de re-render modificada) ---
async function handleConfirmAuthenticity(e) {
    const button = e.target.closest('#finalConfirmBtn');
    if (!button || button.disabled) return;
    const submissionId = button.dataset.submissionId;
    if (!submissionId) return;

    // Lógica de pontos otimista (Mantida)
    const submission = airdropState.userSubmissions.find(s => s.submissionId === submissionId);
    const isLegacyPost = !submission || typeof submission._pointsCalculated !== 'number' || submission._pointsCalculated <= 0;
    let pointsToAward = 0;
    if (!isLegacyPost) {
        pointsToAward = submission._pointsCalculated;
    }
    const oldTotalPoints = airdropState.user?.totalPoints || 0;
    const oldApprovedCount = airdropState.user?.approvedSubmissionsCount || 0;
    const oldMultiplier = getMultiplierByTier(oldApprovedCount);
    renderLoading(button, 'Confirming...');

    try {
        await db.confirmSubmission(submissionId);
        showToast("Post confirmed and points awarded!", "success");
        closeModal();

        if (isLegacyPost) {
            console.warn("Legacy post confirmed. Forcing data reload from DB...");
            await loadAirdropData();
            renderAirdropContent(); // Re-renderiza a página principal
            return;
        }

        // Atualização Otimista (Mantida)
        if (airdropState.user) {
            airdropState.user.totalPoints += pointsToAward;
            airdropState.user.approvedSubmissionsCount += 1;
        }
        if (submission) {
            submission.status = 'approved';
            submission.pointsAwarded = pointsToAward;
            submission.resolvedAt = new Date();
        }

        // await loadAirdropData(); // <-- REMOVIDO
        renderAirdropContent(); // Re-renderiza a página principal

        // Aciona Animação (Mantido)
        const newTotalPoints = airdropState.user?.totalPoints || 0;
        const newApprovedCount = airdropState.user?.approvedSubmissionsCount || 0;
        const newMultiplier = getMultiplierByTier(newApprovedCount);
        const pointsDisplayEl = document.getElementById('history-total-points-display');
        const multiplierDisplayEl = document.getElementById('history-multiplier-display');
        if (pointsDisplayEl && newTotalPoints > oldTotalPoints) {
            animateValue(pointsDisplayEl, oldTotalPoints, newTotalPoints, 1000, true);
        }
        if (multiplierDisplayEl && newMultiplier > oldMultiplier) {
            animateValue(multiplierDisplayEl, oldMultiplier, newMultiplier, 800, false);
        }
    } catch (error) {
        // Lógica de erro mantida
        if (error.message.includes("Document not found or already processed") || error.message.includes("already in status")) {
             showToast(`Action failed: This submission was already processed or deleted. Refreshing...`, "warning");
             closeModal();
             await loadAirdropData();
             renderAirdropContent();
             return;
        }
        showToast(`Failed to confirm post: ${error.message}`, "error");
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Confirm Authenticity';
        await loadAirdropData();
        renderAirdropContent();
    }
}

// --- handleSubmissionAction (Sem alteração) ---
async function handleSubmissionAction(e) { /* ... */ }

// --- handleSubmitUgcClick (Sem alteração) ---
async function handleSubmitUgcClick(e) { /* ... */ }

// --- handleClaimAirdrop (Função adicionada na correção anterior, mantida) ---
async function handleClaimAirdrop(e) {
    const btn = e.target.closest('#claimAirdropBtn');
    if (btn && btn.disabled) {
         showToast("Airdrop claiming is not yet active.", "info");
         return;
    }
    console.log("handleClaimAirdrop called, but not implemented.");
    showToast("Airdrop claiming is not yet available. Check back after the round ends.", "info");
}

// =======================================================
//  3. TAB RENDERING FUNCTIONS
// =======================================================

// --- renderSectionContainer (Sem alteração, mas não é mais usado pela aba Profile) ---
function renderSectionContainer(title, iconClass, contentHtml) { /* ... */ }

// --- renderContentSubmissionFlow (Sem alteração) ---
function renderContentSubmissionFlow() {
    if (!airdropState.isConnected || !airdropState.user) {
        return renderNoData(null, 'Connect your wallet to submit content.');
    }
    return `
        <div class="bg-main border border-border-color rounded-xl p-6 mb-8">
            <h3 class="text-xl font-bold text-white mb-4"><i class="fa-solid fa-arrow-right-to-bracket mr-2 text-amber-400"></i> Content Submission Flow (4 Steps)</h3>
            <ol class="space-y-6">
                                <li class="submission-step-1 border-l-4 border-amber-500 pl-4 py-1">
                    <p class="font-bold text-lg text-white mb-2 flex items-center gap-2"><span class="bg-amber-500 text-zinc-900 font-extrabold w-6 h-6 flex items-center justify-center rounded-full text-sm">1</span> Copy Your Referral Link</p>
                    <p class="text-zinc-400 text-sm mb-3">Click the button below to automatically copy your unique referral link and the required hashtags.</p>
                    <button id="copyReferralBtn_submitArea" class="btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-base w-full py-3 rounded-2xl animate-pulse-slow">
                        <i class="fa-solid fa-copy mr-2"></i> Copy Link & Hashtags
                    </button>
                </li>
                                <li class="submission-step-2 border-l-4 border-zinc-500 pl-4 py-1">
                    <p class="font-bold text-lg text-white mb-2 flex items-center gap-2"><span class="bg-zinc-500 text-zinc-900 font-extrabold w-6 h-6 flex items-center justify-center rounded-full text-sm">2</span> Create Your Social Media Post</p>
                    <p class="text-zinc-400 text-sm">...<strong class="text-amber-400">MUST</strong> include your referral link...: <span class="font-mono text-amber-400 text-xs">${DEFAULT_HASHTAGS}</span></p>
                </li>
                                <li class="submission-step-3 border-l-4 border-zinc-500 pl-4 py-1">
                    <p class="font-bold text-lg text-white mb-2 flex items-center gap-2"><span class="bg-zinc-500 text-zinc-900 font-extrabold w-6 h-6 flex items-center justify-center rounded-full text-sm">3</span> Publish the Content</p>
                    <p class="text-zinc-400 text-sm">Publish your post and ensure it is set to <strong class="text-amber-400">Public</strong> for verification.</p>
                </li>
                                <li class="submission-step-4 border-l-4 border-red-500 pl-4 py-1">
                    <p class="font-bold text-lg text-white mb-2 flex items-center gap-2"><span class="bg-red-500 text-zinc-900 font-extrabold w-6 h-6 flex items-center justify-center rounded-full text-sm">4</span> Submit the Post Link for Audit</p>
                    <label for="contentUrlInput_submitArea" class="block text-sm font-medium text-zinc-300 mb-2">Paste the direct link to your published post:</label>
                    <input type="url" id="contentUrlInput_submitArea" required placeholder="https://..." class="contentUrlInput form-input w-full p-3 mb-3 rounded-2xl border-zinc-600 focus:border-red-500 focus:ring-red-500">
                    <button id="submitContentLinkBtn_submitArea" class="submitContentLinkBtn btn bg-green-600 hover:bg-green-700 text-white font-bold text-base w-full py-3 rounded-2xl">
                        <i class="fa-solid fa-paper-plane mr-2"></i> Submit for Review
                    </button>
                    <p class="text-xs text-red-400 mt-2 font-semibold">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i> All posts undergo auditing... may result in a **permanent ban**...
                    </p>
                </li>
            </ol>
        </div>
    `;
}

// --- TAB 1: renderProfileContent ---
// FUNÇÃO REMOVIDA (Redundante, substituída pela `renderSubmissionPanelContent`)


// --- TAB 2: renderSubmitEarnContent ---
// FUNÇÃO REMOVIDA (Não há mais sub-abas, `renderAirdropContent` agora gerencia isso)


// --- (NOVA ABA PRINCIPAL 1) Content Submission Panel (Stats + Flow + History + Claim) ---
// (Esta era a antiga `renderSubmissionPanelContent`)
function renderSubmissionPanelContent() {
    // --- Obter dados do usuário para os contadores do cabeçalho ---
    const user = airdropState.user;
    let headerTotalPoints = 0;
    let headerMultiplierDisplay = '0.0x';
    if (user) {
        headerTotalPoints = user.totalPoints || 0;
        const approvedCount = user.approvedSubmissionsCount || 0;
        const multiplier = getMultiplierByTier(approvedCount);
        headerMultiplierDisplay = `${multiplier.toFixed(1)}x`;
    }

    // --- Render Submission History Tabs ---
    const getHistoryTabBtnClass = (tabName) => {
        const baseClass = 'history-tab-btn flex-1 sm:flex-none text-center sm:text-left justify-center sm:justify-start flex items-center gap-2 py-2 px-4 text-sm font-semibold transition-colors border-b-2 focus:outline-none rounded-t-md';
        return airdropState.activeHistoryTab === tabName
            ? `${baseClass} border-amber-500 text-amber-400 bg-main`
            : `${baseClass} text-zinc-400 hover:text-white border-transparent hover:border-zinc-500/50`;
    };

    // Filtra as listas (Lógica mantida)
    const nowMs = Date.now();
    const twoHoursMs = AUTO_APPROVE_HOURS * 60 * 60 * 1000;
    const pendingSubmissions = airdropState.userSubmissions.filter(sub =>
        ['pending', 'auditing', 'flagged_suspicious'].includes(sub.status)
    ).sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
    const finalizedSubmissions = airdropState.userSubmissions.filter(sub =>
        ['approved', 'rejected', 'deleted_by_user'].includes(sub.status)
    ).sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));

    // Calcula os stats (Lógica mantida)
    const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
    stats.approved = finalizedSubmissions.filter(sub => sub.status === 'approved').length;
    const rejectedFinalizedCount = finalizedSubmissions.filter(sub => ['rejected', 'deleted_by_user'].includes(sub.status)).length;
    const rejectedPendingCount = pendingSubmissions.filter(sub => sub.status === 'flagged_suspicious').length;
    stats.rejected = rejectedFinalizedCount + rejectedPendingCount;
    stats.pending = pendingSubmissions.filter(sub => ['pending', 'auditing'].includes(sub.status)).length;
    stats.total = stats.approved + stats.rejected + stats.pending;
    // (Cálculo de pendingPoints removido daqui, não era usado)

    const statsHtml = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="stat-card"><p>Total</p><p class="text-white">${stats.total}</p></div>
            <div class="stat-card border-green-500/50"><p>Confirmed</p><p class="text-green-400">${stats.approved}</p></div>
            <div class="stat-card border-amber-500/50"><p>Awaiting</p><p class="text-amber-400">${stats.pending}</p></div>
            <div class="stat-card border-red-500/50"><p>Rejected</p><p class="text-red-400">${stats.rejected}</p></div>
        </div>
        <style>
            .stat-card { background-color: var(--bg-main); border: 1px solid var(--border-color); border-radius: 0.75rem; padding: 1rem; text-align: center; }
            .stat-card p:first-child { text-sm text-zinc-400 mb-1 font-semibold uppercase tracking-wider; }
            .stat-card p:last-child { text-3xl font-extrabold; }
            @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
            .animate-pop { animation: pop 0.2s ease-out; }
        </style>`;

    // --- renderHistoryItem (Helper) (Sem alteração) ---
    const renderHistoryItem = (sub, index, total, isPendingList) => {
        let displayStatusKey = sub.status;
        let actionButtonsHtml = '';
        const submittedAtMs = sub.submittedAt?.getTime();
        const uiStatus = statusUI[displayStatusKey] || statusUI.pending;
        const uiPlatform = platformUI[sub.platform] || platformUI.Other;
        const iconClass = uiPlatform.type === 'brands' ? `fa-brands ${uiPlatform.icon}` : `fa-solid ${uiPlatform.icon}`;
        let pointsDisplay = '';

        if (isPendingList) {
            const pointsToShow = sub._pointsCalculated || 0;
            pointsDisplay = `${pointsToShow.toLocaleString('en-US')} Pts`;
            if (displayStatusKey === 'flagged_suspicious') {
                actionButtonsHtml = `
                    <div class="action-buttons-container flex justify-center gap-3 mt-4 pt-4 border-t border-zinc-700/50 w-full">
                        <button data-submission-id="${sub.submissionId}" data-resolution="not_fraud" class="resolve-flagged-btn ..."><i class="fa-solid fa-check mr-1"></i> Legitimate</button>
                        <button data-submission-id="${sub.submissionId}" data-resolution="is_fraud" class="resolve-flagged-btn ..."><i class="fa-solid fa-times mr-1"></i> Fraud/Spam</button>
                    </div>`;
            } else if (submittedAtMs && (nowMs - submittedAtMs >= twoHoursMs)) {
                displayStatusKey = 'pending_confirmation';
                actionButtonsHtml = `
                    <div class="action-buttons-container flex justify-center gap-3 mt-4 pt-4 border-t border-zinc-700/50 w-full">
                        <button data-submission-id="${sub.submissionId}" data-action="confirm" class="submission-action-btn ..."><i class="fa-solid fa-check mr-1"></i> Confirm Post</button>
                        <button data-submission-id="${sub.submissionId}" data-action="report_error" class="submission-action-btn ..."><i class="fa-solid fa-trash mr-1"></i> Report Error</button>
                    </div>`;
            } else {
                actionButtonsHtml = `<div class="mt-4 pt-4 border-t border-zinc-700/50 w-full text-center"><p class="text-xs text-zinc-500">Audit in progress...</p></div>`;
            }
        } else {
            pointsDisplay = (displayStatusKey === 'approved') ? `(+${(sub.pointsAwarded || 0).toLocaleString('en-US')} Pts)` : `(0 Pts)`;
            actionButtonsHtml = '';
        }
        const finalUiStatus = statusUI[displayStatusKey] || statusUI.pending;

        // Layout do Card (Mantido)
        return `
            <div class="submission-history-card bg-main border border-border-color rounded-xl p-4 mb-3 flex flex-col transition-colors hover:bg-zinc-800/50">
                <div class="flex flex-row items-center gap-3 min-w-0">
                    <div class="flex-shrink-0"><i class="${iconClass} ${uiPlatform.color} text-3xl w-8 text-center"></i></div>
                    <div class="flex-grow min-w-0">
                        <a href="${sub.url}" target="_blank" rel="noopener noreferrer" class="font-mono text-blue-400 hover:text-blue-300 block text-sm leading-snug truncate">${sub.url}</a>
                    </div>
                </div>
                <div class="flex flex-row items-center justify-between mt-3">
                    <p class="text-xs text-zinc-400"><span class="font-bold text-zinc-500 mr-2">#${total - index}</span> Submitted: ${sub.submittedAt ? sub.submittedAt.toLocaleString('en-US') : 'N/A'}</p>
                    <div class="flex flex-col items-center gap-1">
                        <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${finalUiStatus.bgColor} ${finalUiStatus.color}"><i class="fa-solid ${finalUiStatus.icon}"></i> ${finalUiStatus.text}</span>
                        <p class="text-sm font-bold ${finalUiStatus.color}">${pointsDisplay}</p>
                    </div>
                </div>
                ${actionButtonsHtml}
            </div>`;
    };

    // --- Cabeçalho do Histórico (Mantido) ---
    const historyHeaderHtml = `
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-8 border-t border-border-color pt-6 mb-4 gap-4">
            <h3 class="text-xl font-bold text-white mb-2 sm:mb-0">Your Submission History</h3>
            <div class="flex items-stretch gap-3">
                <div class="bg-main border border-border-color rounded-xl p-3 text-center shadow-inner flex-1 min-w-[140px]">
                    <span class="text-xs text-zinc-400 uppercase font-semibold block mb-1">Total Points</span>
                    <p id="history-total-points-display" class="text-2xl font-bold text-yellow-400 leading-none">${headerTotalPoints.toLocaleString('en-US')}</p>
                </div>
                <div class="bg-main border border-border-color rounded-xl p-3 text-center shadow-inner flex-1 min-w-[140px]">
                    <span class="text-xs text-zinc-400 uppercase font-semibold block mb-1">Multiplier</span>
                    <p id="history-multiplier-display" class="text-2xl font-bold text-green-400 leading-none">${headerMultiplierDisplay}</p>
                </div>
            </div>
        </div>`;
    
    // --- Bloco do Botão Claim (Movido da antiga renderProfileContent) ---
    const claimButtonHtml = `
        <div class="p-6 bg-sidebar border border-border-color rounded-xl shadow-xl mt-8">
            <h2 class="text-xl font-bold mb-4 text-white">Airdrop Claim</h2>
            <p class="text-zinc-400 text-sm mb-4">Once the Airdrop round is finalized and all audits are complete, click below to claim your rewards.</p>
            <button id="claimAirdropBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-md transition-colors text-lg" disabled>
                Claim Airdrop Tokens
            </button>
        </div>
    `;

    // --- Conteúdo Principal (Combina tudo) ---
    return `
        <p class="text-sm text-zinc-400 mb-6">Submit links to content you created about Backchain. Confirm your submissions after 2 hours to earn points.</p>
        ${statsHtml}
        ${renderContentSubmissionFlow()}
        <div>
            ${historyHeaderHtml}
            <div class="border-b border-zinc-700 mb-4">
                <nav id="ugc-submission-history-tabs" class="-mb-px flex flex-wrap gap-x-4 gap-y-1">
                    <button class="${getHistoryTabBtnClass('pending')}" data-target="pending">
                        <i class="fa-solid fa-hourglass-half fa-fw"></i> Pending Confirmation (${pendingSubmissions.length})
                    </button>
                    <button class="${getHistoryTabBtnClass('finalized')}" data-target="finalized">
                        <i class="fa-solid fa-archive fa-fw"></i> Finalized (${finalizedSubmissions.length})
                    </button>
                </nav>
            </div>
            <div id="ugc-submission-history-content">
                <div id="pending-submissions-list" class="${airdropState.activeHistoryTab === 'pending' ? '' : 'hidden'}">
                    ${pendingSubmissions.length > 0
                        ? pendingSubmissions.map((sub, index) => renderHistoryItem(sub, index, pendingSubmissions.length, true)).join('')
                        : '<p class="text-zinc-400 text-center p-4">You have no submissions awaiting confirmation.</p>'}
                </div>
                <div id="finalized-submissions-list" class="${airdropState.activeHistoryTab === 'finalized' ? '' : 'hidden'}">
                    ${finalizedSubmissions.length > 0
                        ? finalizedSubmissions.map((sub, index) => renderHistoryItem(sub, index, finalizedSubmissions.length, false)).join('')
                        : '<p class="text-zinc-400 text-center p-4">You have no finalized submissions.</p>'}
                </div>
            </div>
        </div>
        ${claimButtonHtml}     `;
}

// --- (NOVA ABA PRINCIPAL 2) Daily Tasks Panel (Sem alteração interna) ---
// (Esta era a antiga `renderDailyTasksPanelContent`)
function renderDailyTasksPanelContent() {
     // Limpa timers
     document.querySelectorAll('.task-card-link').forEach(card => {
        if (card._cooldownInterval) {
            clearInterval(card._cooldownInterval);
            card._cooldownInterval = null;
        }
     });

    // Lógica de filtro (Mantida)
    const eligibleTasks = airdropState.dailyTasks.filter(task => task.eligible && !task.error);
    const allTasksCount = airdropState.dailyTasks.filter(task => !task.error).length;
    let noDataMessage = '<i class="fa-solid fa-coffee mr-2"></i> No active daily tasks right now.';
    if (allTasksCount > 0 && eligibleTasks.length === 0) {
        noDataMessage = '<i class="fa-solid fa-clock mr-2"></i> All tasks are currently on cooldown. Check back later!';
    }

    // Render Task List (Mantido)
    let tasksHtml;
    if (eligibleTasks.length > 0) {
         tasksHtml = eligibleTasks.map(task => {
            const points = Math.round(task.points);
            const expiryDate = task.endDate ? task.endDate.toLocaleDateString('en-US') : 'N/A';
            let statusHTML = task.url ? '<i class="fa-solid fa-arrow-up-right-from-square mr-1"></i> Go & Earn' : '<i class="fa-solid fa-check mr-1"></i> Earn Points';
            let statusClass = 'task-status-badge font-bold text-xs py-2 px-3 rounded-xl transition-colors duration-200 shrink-0';
            let cardClass = 'task-card-link bg-main border border-border-color rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 transition-all duration-200 hover:bg-zinc-800/50 hover:border-amber-500/50 cursor-pointer block decoration-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-sidebar';
            statusClass += ' bg-amber-600 hover:bg-amber-700 text-white';

            // Layout do Card (Mantido)
            return `
                <a href="${task.url || '#'}" ${task.url ? 'target="_blank" rel="noopener noreferrer"' : ''}
                   class="${cardClass}"
                   data-task-id="${task.id}"
                   data-task-url="${task.url || ''}"
                   onclick="return false;" >
                    <div class="flex flex-col flex-grow items-center text-center sm:items-start sm:text-left min-w-0">
                        <h4 class="font-extrabold text-xl text-white break-words">${task.title}</h4>
                        <p class="text-sm text-zinc-300 mt-1 mb-3 break-words">${task.description || 'Complete the required action.'}</p>
                        <div class="flex items-center gap-4 text-xs text-zinc-500 flex-wrap justify-center sm:justify-start">
                            <span class="text-yellow-500 font-semibold"><i class="fa-solid fa-star mr-1"></i> +${points.toLocaleString('en-US')} Points</span>
                            <span><i class="fa-solid fa-clock mr-1"></i> Cooldown: ${task.cooldownHours}h</span>
                            <span><i class="fa-solid fa-calendar-times mr-1"></i> Expires: ${expiryDate}</span>
                        </div>
                    </div>
                    <div class="flex-shrink-0 w-full sm:w-40 h-full flex items-center justify-center order-2 sm:order-3 mt-3 sm:mt-0">
                        <span class="${statusClass} text-center w-full">${statusHTML}</span>
                    </div>
                </a>
            `;
        }).join('');
    } else {
        tasksHtml = `<div class="text-center p-8 bg-main border border-border-color rounded-xl mt-4"><p class="text-zinc-400 text-lg">${noDataMessage}</p></div>`;
    }

    // Conteúdo Principal da Aba (Mantido)
    return `
        <p class="text-sm text-zinc-400 mb-6">Click on a task card to visit the link and earn points. Each task has its own cooldown period shown on the card.</p>
        <div id="tasks-content" class="space-y-4">${tasksHtml}</div>
    `;
}


// --- TAB 3: renderLeaderboardPanel ---
// FUNÇÃO REMOVIDA (Movida para RankingPage.js)


// =======================================================
//  4. NOVAS FUNÇÕES HELPER (Para anexar listeners)
// =======================================================

/**
 * Anexa todos os listeners necessários para a aba 'content-submission'
 */
function attachContentSubmissionListeners() {
    document.getElementById('copyReferralBtn_submitArea')?.addEventListener('click', handleCopyReferralLink);
    document.querySelector('.submission-step-4 .submitContentLinkBtn')?.addEventListener('click', handleSubmitUgcClick);
    document.getElementById('ugc-submission-history-tabs')?.addEventListener('click', handleHistoryTabSwitch);
    
    // Listener de delegação para as listas de histórico
    const pendingListEl = document.getElementById('pending-submissions-list');
    if (pendingListEl && !pendingListEl._listenersAttached) {
        pendingListEl.addEventListener('click', handleSubmissionAction); // Confirma/Reporta
        pendingListEl.addEventListener('click', handleResolveSubmission); // Fraude/Legítimo
        pendingListEl._listenersAttached = true;
    }
    
    // Listener para o botão Claim
    document.getElementById('claimAirdropBtn')?.addEventListener('click', handleClaimAirdrop);
}

/**
 * Anexa todos os listeners necessários para a aba 'daily-tasks'
 */
function attachDailyTaskListeners() {
    // Listener de delegação para os cards de tarefa
    const tasksContentEl = document.getElementById('tasks-content');
    if (tasksContentEl && !tasksContentEl._listenerAttached) {
        tasksContentEl.addEventListener('click', handleGoToTask);
        tasksContentEl._listenerAttached = true;
    }
    
    // Inicializa os timers para tarefas em cooldown (apenas visuais)
    document.querySelectorAll('.task-card-link.task-disabled').forEach(cardLink => {
        const taskId = cardLink.dataset.taskId;
        const task = airdropState.dailyTasks.find(t => t.id === taskId);
        const statusBadge = cardLink.querySelector('.task-status-badge');
        if (task && !task.eligible && task.timeLeftMs > 0 && statusBadge) {
            startIndividualCooldownTimer(cardLink, statusBadge, task.timeLeftMs);
        }
    });
}


// =======================================================
//  5. MAIN RENDERING AND EXPORT (Simplificado)
// =======================================================

/**
 * Renders the main Airdrop page content, including tabs and the active tab's content.
 */
function renderAirdropContent() {
    const mainContainer = document.getElementById('airdrop');
    const loadingPlaceholder = document.getElementById('airdrop-loading-placeholder');
    const tabsContainer = document.getElementById('airdrop-tabs-container');
    const contentWrapper = document.getElementById('airdrop-content-wrapper');
    const activeContentEl = document.getElementById('active-tab-content');

    if (!mainContainer || !contentWrapper || !activeContentEl || !tabsContainer || !loadingPlaceholder) {
        console.error("Airdrop UI containers missing!");
        return;
    }

    // --- Ban Message (Mantido) ---
    if (airdropState.isBanned) {
        loadingPlaceholder.innerHTML = '';
        tabsContainer.innerHTML = '';
        contentWrapper.innerHTML = ``;
        return;
    }

    loadingPlaceholder.innerHTML = '';

    // --- [LED] Check for pending confirmations (Mantido) ---
    let hasPendingConfirmations = false;
    if (airdropState.userSubmissions && airdropState.userSubmissions.length > 0) {
        const nowMs = Date.now();
        const twoHoursMs = AUTO_APPROVE_HOURS * 60 * 60 * 1000;
        hasPendingConfirmations = airdropState.userSubmissions.some(sub => {
            const submittedAtMs = sub.submittedAt?.getTime();
            return ['pending', 'auditing'].includes(sub.status) &&
                   submittedAtMs &&
                   (nowMs - submittedAtMs >= twoHoursMs);
        });
    }

    // --- Render Main Tabs (Agora com 2 abas) ---
    const getTabBtnClass = (tabName) => {
        const baseClass = 'airdrop-tab-btn flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold transition-colors border-b-2 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-main rounded-t-md relative';
        return airdropState.activeMainTab === tabName
            ? `${baseClass} border-amber-500 text-amber-400`
            : `${baseClass} text-zinc-400 hover:text-white border-transparent hover:border-zinc-500/50`;
    };

    // [LED] HTML (Mantido)
    const ledHtml = hasPendingConfirmations
        ? '<span class="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>'
        : '';

    // Estrutura com apenas 2 abas principais
    tabsContainer.innerHTML = `
        <div class="border-b border-zinc-700 mb-8">
            <nav id="airdrop-tabs" class="-mb-px flex flex-wrap gap-x-6 gap-y-1" role="tablist" aria-label="Airdrop sections">
                
                <button role="tab" id="tab-content-submission" aria-controls="panel-content-submission" aria-selected="${airdropState.activeMainTab === 'content-submission'}" class="${getTabBtnClass('content-submission')}" data-target="content-submission">
                    <i class="fa-solid fa-up-right-from-square fa-fw"></i> Enviar Conteúdo
                    ${ledHtml}
                </button>
                
                <button role="tab" id="tab-daily-tasks" aria-controls="panel-daily-tasks" aria-selected="${airdropState.activeMainTab === 'daily-tasks'}" class="${getTabBtnClass('daily-tasks')}" data-target="daily-tasks">
                    <i class="fa-solid fa-list-check fa-fw"></i> Tarefas Diárias
                </button>
                
                            </nav>
        </div>
    `;

    // Listener da aba principal (Mantido)
    const tabsNav = document.getElementById('airdrop-tabs');
    if (tabsNav && !tabsNav._listenerAttached) {
       tabsNav.addEventListener('click', handleMainTabSwitch);
       tabsNav._listenerAttached = true;
    }

    // --- Render Active Main Tab Content (Simplificado) ---
    activeContentEl.innerHTML = '';
    activeContentEl.setAttribute('role', 'tabpanel');
    activeContentEl.setAttribute('tabindex', '0');
    activeContentEl.setAttribute('aria-labelledby', `tab-${airdropState.activeMainTab}`);

    try {
        switch (airdropState.activeMainTab) {
            case 'content-submission':
                activeContentEl.innerHTML = renderSubmissionPanelContent();
                attachContentSubmissionListeners(); // Usa a nova função helper
                break;
            case 'daily-tasks':
                activeContentEl.innerHTML = renderDailyTasksPanelContent();
                attachDailyTaskListeners(); // Usa a nova função helper
                break;
            default:
                airdropState.activeMainTab = 'content-submission'; // Garante o padrão
                activeContentEl.innerHTML = renderSubmissionPanelContent();
                attachContentSubmissionListeners();
        }
    } catch (error) {
         console.error(`Error rendering tab ${airdropState.activeMainTab}:`, error);
         renderError(activeContentEl, `Error loading ${airdropState.activeMainTab} content.`);
    }
}


// --- Exported Page Object (Sem alteração) ---
export const AirdropPage = {
    async render() {
        const airdropEl = document.getElementById('airdrop');
        if (!airdropEl) {
            console.error("Airdrop container element (#airdrop) not found in HTML.");
            return;
        }

        // Limpa timers
        document.querySelectorAll('.task-card-link').forEach(card => {
             if (card._cooldownInterval) clearInterval(card._cooldownInterval);
             card._cooldownInterval = null;
  G    });

        const loadingPlaceholder = document.getElementById('airdrop-loading-placeholder');
        const tabsContainer = document.getElementById('airdrop-tabs-container');
        const contentWrapper = document.getElementById('airdrop-content-wrapper');
        const activeContentEl = document.getElementById('active-tab-content');

        if (!loadingPlaceholder || !tabsContainer || !contentWrapper || !activeContentEl) {
             renderError(airdropEl, "UI Error: Could not load Airdrop components. Please try refreshing.");
             return;
        }

        renderLoading(loadingPlaceholder, 'Loading Airdrop...');
        tabsContainer.innerHTML = '';
        activeContentEl.innerHTML = '';

        try {
            await loadAirdropData(); // Agora carrega menos dados
            renderAirdropContent(); // Agora renderiza uma UI mais limpa
        } catch (error) {
            console.error("Critical error during AirdropPage.render -> loadAirdropData:", error);
            renderError(contentWrapper, "Failed to load critical airdrop data. Please refresh.");
            loadingPlaceholder.innerHTML = '';
  G    }
    },

    update(isConnected) {
        const airdropElement = document.getElementById('airdrop');
        const isVisible = airdropElement && !airdropElement.classList.contains('hidden');
        if (airdropState.isConnected !== isConnected && isVisible) {
             this.render();
        }
    }
};