// pages/AirdropPage.js
// Contains the logic and rendering for the user's Airdrop interface.

import { State } from '../state.js';
import * as db from '../modules/firebase-auth-service.js';
import { showToast, closeModal, openModal } from '../ui-feedback.js';
import { formatAddress, renderNoData, formatBigNumber, renderLoading, renderError } from '../utils.js'; 

// --- Airdrop Page State ---
let airdropState = {
    isConnected: false,
    systemConfig: null,
    basePoints: null, // Dynamic base points for content submission
    leaderboards: null,
    user: null,
    dailyTasks: [], // Active tasks with eligibility status
    userSubmissions: [], // User's content submission history
    flaggedSubmissions: [], // Submissions requiring user review
    isBanned: false, // User ban status
    activeMainTab: 'profile', // Default tab: Profile
    activeSubmitTab: 'content-submission', // Default sub-tab: Content Submission
};

// --- Constants ---
const DEFAULT_HASHTAGS = "#Backchain #BKC #Web3 #Crypto #Airdrop";
const AUTO_APPROVE_HOURS = 2; // VISUAL delay for submission approval

// --- UI Mappings (EXPANDIDO: TikTok, Reddit, LinkedIn adicionados) ---
// Used for consistent status and platform styling
const statusUI = {
    pending: { text: 'Pending Review', color: 'text-amber-400', bgColor: 'bg-amber-900/50', icon: 'fa-clock' },
    auditing: { text: 'Auditing', color: 'text-blue-400', bgColor: 'bg-blue-900/50', icon: 'fa-magnifying-glass' },
    approved: { text: 'Approved', color: 'text-green-400', bgColor: 'bg-green-900/50', icon: 'fa-check-circle' },
    rejected: { text: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-900/50', icon: 'fa-times-circle' },
    flagged_suspicious: { text: 'Flagged - Review!', color: 'text-red-300', bgColor: 'bg-red-800/60', icon: 'fa-flag' },
    // NEW VISUAL STATUS AFTER 2H AUDIT: AWAITING USER CONFIRMATION
    pending_confirmation: { text: 'Action Required: Confirm', color: 'text-cyan-400', bgColor: 'bg-cyan-900/50', icon: 'fa-clipboard-check' } 
};
const platformUI = {
    'YouTube': { icon: 'fa-youtube', color: 'text-red-500' },
    'YouTube Shorts': { icon: 'fa-youtube', color: 'text-red-500' },
    'Instagram': { icon: 'fa-instagram', color: 'text-pink-500' },
    'X/Twitter': { icon: 'fa-x-twitter', color: 'text-white' },
    'Facebook': { icon: 'fa-facebook', color: 'text-blue-600' }, 
    'Telegram': { icon: 'fa-telegram', color: 'text-cyan-400' },
    'TikTok': { icon: 'fa-tiktok', color: 'text-zinc-100' }, // Ícone do TikTok
    'Reddit': { icon: 'fa-reddit', color: 'text-orange-500' }, // Ícone do Reddit
    'LinkedIn': { icon: 'fa-linkedin', color: 'text-blue-700' }, // Ícone do LinkedIn
    'Other': { icon: 'fa-globe', color: 'text-gray-400' },
};

// =======================================================
//  1. MAIN DATA LOADING FUNCTION
// =======================================================
async function loadAirdropData() {
    // Reset state before loading
    airdropState.isConnected = State.isConnected;
    airdropState.user = null;
    airdropState.userSubmissions = [];
    airdropState.flaggedSubmissions = [];
    airdropState.isBanned = false;
    airdropState.basePoints = null;

    try {
        // Fetch public data (config, active tasks, leaderboards)
        const publicData = await db.getPublicAirdropData();

        airdropState.systemConfig = publicData.config;
        // Load base points from config, com suporte expandido para novas redes
        airdropState.basePoints = publicData.config?.ugcBasePoints || { 
            'YouTube': 5000, 
            'YouTube Shorts': 2500, 
            'Instagram': 3000, 
            'X/Twitter': 1500, 
            'Facebook': 2000, 
            'Telegram': 1000,
            'TikTok': 3500, // Novo valor base
            'Reddit': 1800,  // Novo valor base
            'LinkedIn': 2200, // Novo valor base
            'Other': 1000
        };
        airdropState.leaderboards = publicData.leaderboards;
        airdropState.dailyTasks = publicData.dailyTasks;

        // If connected, fetch user data
        if (airdropState.isConnected && State.userAddress) {
            const [user, submissions, flagged] = await Promise.all([
                db.getAirdropUser(State.userAddress),
                db.getUserSubmissions(),
                db.getUserFlaggedSubmissions()
            ]);
            airdropState.user = user;
            airdropState.userSubmissions = submissions;
            airdropState.flaggedSubmissions = flagged;

            // Check for ban
            if (user.isBanned) {
                airdropState.isBanned = true;
                console.warn("User is banned from Airdrop.");
                return;
            }

            // Load daily task eligibility (Potential performance bottleneck!)
            if (airdropState.dailyTasks.length > 0) {
                 airdropState.dailyTasks = await Promise.all(airdropState.dailyTasks.map(async (task) => {
                     try {
                         if (!task.id) return { ...task, eligible: false, timeLeftMs: 0, error: true };
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
        if (error instanceof TypeError && error.message.includes("is not a function")) {
             console.error("POSSIBLE CAUSE: Check if functions like getUserSubmissions are correctly exported in firebase-auth-service.js or clear browser cache.");
             showToast("Error loading user data. Try refreshing (Ctrl+Shift+R).", "error");
        } else {
             showToast("Error loading Airdrop data. Please refresh.", "error");
        }
        // Set error state
        airdropState.systemConfig = { isActive: false, roundName: "Error Loading Data" };
        airdropState.leaderboards = null;
        airdropState.dailyTasks = [];
        airdropState.basePoints = {};
    }
}

// =======================================================
//  2. USER INTERACTION FUNCTIONS
// =======================================================

// --- Main Tab Switch ---
function handleMainTabSwitch(e) {
    const button = e.target.closest('.airdrop-tab-btn');
    if (button) {
        const targetTab = button.getAttribute('data-target');
        if (targetTab && airdropState.activeMainTab !== targetTab) {
            // Clear old visual cooldown timers when switching tabs
            document.querySelectorAll('.task-card-link').forEach(card => {
                if (card._cooldownInterval) clearInterval(card._cooldownInterval);
                card._cooldownInterval = null;
            });
            airdropState.activeMainTab = targetTab;
            // Reset Submit & Earn sub-tab if switching back to it
            if(targetTab === 'submissions') airdropState.activeSubmitTab = 'content-submission';
            renderAirdropContent(); // Re-render everything
        }
    }
}

// --- Submit & Earn Sub-Tab Switch ---
function handleSubmitTabSwitch(e) {
    const button = e.target.closest('.submit-tab-btn');
    if (button) {
        const targetTab = button.getAttribute('data-target');
        if (targetTab && airdropState.activeSubmitTab !== targetTab) {
            airdropState.activeSubmitTab = targetTab;
            // Garantir que renderSubmitEarnContent seja chamado com o wrapper correto
            renderSubmitEarnContent(document.getElementById('airdrop-content-wrapper').querySelector('#active-tab-content'));
        }
    }
}


// --- Format Time Left (HH:MM:SS or Ready) ---
const formatTimeLeft = (ms) => {
    if (ms <= 0) return '<i class="fa-solid fa-check mr-1"></i> Ready';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    // Format HH:MM:SS
    return `Cooldown: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


// --- Handle Daily Task Click ---
async function handleGoToTask(e) {
    const cardLink = e.target.closest('.task-card-link');
    if (!cardLink) return;

    e.preventDefault();

    const taskId = cardLink.dataset.taskId;
    const taskUrl = cardLink.dataset.taskUrl;
    const task = airdropState.dailyTasks.find(t => t.id === taskId);

    if (!task) return showToast("Task not found.", "error");
    if (!airdropState.user) return showToast("User profile not loaded.", "error");

    // Abrir link no navegador, independentemente do status de elegibilidade
    if (taskUrl && taskUrl.startsWith('http')) {
        window.open(taskUrl, '_blank', 'noopener,noreferrer');
    }

    // Se não for elegível (em cooldown), não tentar pontuar, apenas abrir o link
    if (!airdropState.dailyTasks.find(t => t.id === taskId)?.eligible) {
        return showToast("Task link opened. Cannot earn points yet (cooldown active).", "info");
    }

    // --- Processo de pontuação (apenas se for elegível) ---
    
    const statusBadge = cardLink.querySelector('.task-status-badge');
    const originalStatusHTML = statusBadge ? statusBadge.innerHTML : '';
    
    if (statusBadge) renderLoading(statusBadge, 'Processing...');
    
    // Desabilitar o card *visualmente* e iniciar o processo de pontuação
    cardLink.classList.add('task-disabled', 'opacity-60', 'cursor-not-allowed');

    try {
        // Tenta registrar a conclusão e pontuar (o backend deve checar a elegibilidade novamente)
        const pointsEarned = await db.recordDailyTaskCompletion(task, airdropState.user.pointsMultiplier);
        showToast(`Task complete! +${pointsEarned} points!`, "success");

        // Atualizar o estado local e iniciar o timer visual
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
        
        // Recarregar dados após um curto delay
        setTimeout(async () => {
            await loadAirdropData();
            if (airdropState.activeSubmitTab === 'daily-tasks') {
                 const contentEl = document.getElementById('airdrop-content-wrapper').querySelector('#active-tab-content');
                 if(contentEl) renderSubmitEarnContent(contentEl);
            }
        }, 500);

    } catch (error) {
        if (error.message.includes("Cooldown period is still active")) {
             showToast("Cooldown active. Cannot complete this task yet.", "error");
             const eligibility = await db.isTaskEligible(task.id, task.cooldownHours);
             if (statusBadge && document.body.contains(statusBadge)) statusBadge.innerHTML = formatTimeLeft(eligibility.timeLeft).replace('Cooldown: ', '');
        } else {
             showToast(`Failed to record task: ${error.message}`, "error");
             console.error("Go To Task Error:", error);
             if (statusBadge && document.body.contains(statusBadge)) statusBadge.innerHTML = originalStatusHTML;
        }
        
        // Reverter o estado visual do card
        if(document.body.contains(cardLink)) {
            cardLink.classList.remove('task-disabled', 'opacity-60', 'cursor-not-allowed');
        }
        if (statusBadge && document.body.contains(statusBadge)) {
             statusBadge.classList.remove('bg-zinc-700', 'text-zinc-400');
             statusBadge.classList.add('bg-amber-600', 'hover:bg-amber-700', 'text-white');
        }
    }
}


// --- Timer Visual for Task Cooldown ---
function startIndividualCooldownTimer(cardLink, statusBadge, initialMs) {
    if (!cardLink || !statusBadge) return;
    if (cardLink._cooldownInterval) clearInterval(cardLink._cooldownInterval);

    let countdownMs = initialMs;

    const updateTimer = () => {
        countdownMs -= 1000;

        if (!document.body.contains(cardLink) || !document.body.contains(statusBadge)) {
            clearInterval(cardLink._cooldownInterval);
            cardLink._cooldownInterval = null;
            return;
        }

        if (countdownMs <= 0) {
            clearInterval(cardLink._cooldownInterval);
            cardLink._cooldownInterval = null;
            
            const task = airdropState.dailyTasks.find(t => t.id === cardLink.dataset.taskId);
            statusBadge.innerHTML = task?.url ? '<i class="fa-solid fa-arrow-up-right-from-square mr-1"></i> Go & Earn' : '<i class="fa-solid fa-check mr-1"></i> Earn Points';
            
            statusBadge.classList.remove('bg-zinc-700', 'text-zinc-400');
            statusBadge.classList.add('bg-amber-600', 'hover:bg-amber-700', 'text-white');
            cardLink.classList.remove('task-disabled', 'opacity-60', 'cursor-not-allowed');

            if(task) {
                const taskIndex = airdropState.dailyTasks.findIndex(t => t.id === task.id);
                if (taskIndex > -1) {
                    airdropState.dailyTasks[taskIndex].eligible = true;
                    airdropState.dailyTasks[taskIndex].timeLeftMs = 0;
                }
            }
        } else {
            statusBadge.innerHTML = formatTimeLeft(countdownMs).replace('Cooldown: ', '');
            statusBadge.classList.remove('bg-amber-600', 'hover:bg-amber-700', 'text-white');
            statusBadge.classList.add('bg-zinc-700', 'text-zinc-400');
        }
    };

    updateTimer();
    cardLink._cooldownInterval = setInterval(updateTimer, 1000);
}


// --- Copy Referral Link ---
function handleCopyReferralLink() {
    // 1. Check if user data is loaded and has a referral code
    const referralCode = airdropState.user?.referralCode;
    if (!referralCode) {
        return showToast("Referral code not available.", "error");
    }

    // 2. Construct the full link
    const fullReferralLink = `https://backcoin.org/?ref=${referralCode}`;
    
    // Remove the protocol (http:// or https://) for a cleaner link
    let referralLink = fullReferralLink.replace(/^(https?:\/\/)/, '');

    // Build the text to be copied: Link + 1 space + Hashtags
    const textToCopy = `${referralLink} ${DEFAULT_HASHTAGS}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Link and Hashtags copied!", "success");
    }).catch(err => {
        console.error('Failed to copy text:', err);
        showToast("Failed to copy link.", "error");
    });
}


// --- Resolve Flagged Submission ---
async function handleResolveSubmission(e) {
    const button = e.target.closest('.resolve-flagged-btn');
    if (!button || button.disabled) return;
    const submissionId = button.dataset.submissionId;
    const resolution = button.dataset.resolution;
    if (!submissionId || !resolution) return;

    const card = button.closest('.flagged-submission-card');
    const buttonsContainer = card?.querySelector('.resolve-buttons');
    if(buttonsContainer) renderLoading(buttonsContainer);

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

// --- Handle Post-Audit Confirmation/Error Report ---
async function handleSubmissionAction(e) {
    const button = e.target.closest('.submission-action-btn');
    if (!button || button.disabled) return;
    
    const submissionId = button.dataset.submissionId;
    const action = button.dataset.action; // 'confirm' or 'report_error'
    const userId = State.userAddress;

    if (!submissionId || !action || !userId) return;

    const card = button.closest('.submission-history-card');
    const buttonsContainer = card?.querySelector('.action-buttons-container');
    
    const originalButtonsHtml = buttonsContainer ? buttonsContainer.innerHTML : '';
    if(buttonsContainer) renderLoading(buttonsContainer, 'Processing...');

    try {
        if (action === 'confirm') {
            // Backend function to APPROVE and consolidate score
            await db.confirmSubmission(userId, submissionId); 
            showToast("Points confirmed and awarded!", "success");
        } else if (action === 'report_error') {
            // Backend function to DELETE (or reject and zero out points)
            await db.deleteSubmission(userId, submissionId); 
            showToast("Submission deleted. You can re-submit a correct link.", "info");
        }

        await loadAirdropData();
        renderAirdropContent(); 

    } catch (error) {
        showToast(`Failed to process action: ${error.message}`, "error");
        console.error("Submission Action Error:", error);
        
        if (buttonsContainer && document.body.contains(buttonsContainer)) {
             buttonsContainer.innerHTML = originalButtonsHtml;
             button.disabled = false;
        }
    }
}


// --- Handle Submit Content Link Click ---
async function handleSubmitUgcClick(e) {
    const submitButton = e.target.closest('.submitContentLinkBtn'); // Changed class name
    if (!submitButton || submitButton.disabled) return;

    const parentArea = submitButton.closest('.submission-step-4');
    const urlInput = parentArea?.querySelector('.contentUrlInput'); // Changed class name

    if (!urlInput) {
        console.error("Could not find content URL input field within submission area.");
        return showToast("Internal error: Input field not found.", "error");
    }

    const url = urlInput.value.trim();

    // Basic frontend validation
    if (!url) return showToast("Please paste the content URL first.", "warning");
    if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
        return showToast("Invalid URL. Must start with http:// or https://", "error");
    }

    // Visual feedback
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    renderLoading(submitButton, 'Submitting...');

    try {
        await db.addSubmission(url);

        showToast("Link submitted successfully! Pending review.", "success");
        urlInput.value = '';
        await loadAirdropData();
        renderAirdropContent();

    } catch (error) {
        // Assume que a validação do backend foi corrigida para Shorts, mas mantém o aviso genérico
        showToast(`Submission failed: ${error.message}`, "error");
        console.error("Content Submit Error:", error);
    } finally {
        if(document.body.contains(submitButton)) {
             submitButton.disabled = false;
             submitButton.innerHTML = originalButtonText;
        }
    }
}


// =======================================================
//  3. TAB RENDERING FUNCTIONS
// =======================================================

// --- Standard Section Container ---
function renderSectionContainer(title, iconClass, contentHtml) {
    return `
        <div class="bg-sidebar border border-border-color rounded-xl shadow-lg overflow-hidden mb-8">
            <div class="p-5 border-b border-zinc-700/50 bg-main">
                <h2 class="text-xl font-bold text-white flex items-center gap-3">
                    <i class="fa-solid ${iconClass} text-amber-400 fa-fw"></i>
                    ${title}
                </h2>
            </div>
            <div class="p-6">
                ${contentHtml}
            </div>
        </div>
    `;
}

// --- Content Submission Flow (4 Steps) ---
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
                    <div class="flex flex-col sm:flex-row gap-2">
                        <button id="copyReferralBtn_submitArea" class="btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-base w-full py-3 rounded-2xl animate-pulse-slow">
                            <i class="fa-solid fa-copy mr-2"></i> Copy Link & Hashtags
                        </button>
                    </div>
                </li>

                <li class="submission-step-2 border-l-4 border-zinc-500 pl-4 py-1">
                    <p class="font-bold text-lg text-white mb-2 flex items-center gap-2"><span class="bg-zinc-500 text-zinc-900 font-extrabold w-6 h-6 flex items-center justify-center rounded-full text-sm">2</span> Create Your Social Media Post</p>
                    <p class="text-zinc-400 text-sm">Create a post (video, tweet, reel, etc.) on your preferred platform (YouTube, X/Twitter, Instagram, etc.).</p>
                    <p class="text-zinc-400 text-sm mt-1">**MUST** include your referral link (copied in Step 1) and the hashtags: <span class="font-mono text-amber-400 text-xs">${DEFAULT_HASHTAGS}</span></p>
                </li>

                <li class="submission-step-3 border-l-4 border-zinc-500 pl-4 py-1">
                    <p class="font-bold text-lg text-white mb-2 flex items-center gap-2"><span class="bg-zinc-500 text-zinc-900 font-extrabold w-6 h-6 flex items-center justify-center rounded-full text-sm">3</span> Publish the Content</p>
                    <p class="text-zinc-400 text-sm">Publish your post and ensure it is set to **Public** for verification.</p>
                </li>

                <li class="submission-step-4 border-l-4 border-red-500 pl-4 py-1">
                    <p class="font-bold text-lg text-white mb-2 flex items-center gap-2"><span class="bg-red-500 text-zinc-900 font-extrabold w-6 h-6 flex items-center justify-center rounded-full text-sm">4</span> Submit the Post Link for Audit</p>
                    <label for="contentUrlInput_submitArea" class="block text-sm font-medium text-zinc-300 mb-2">
                        Paste the direct link to your published post:
                    </label>
                    
                    <input type="url" id="contentUrlInput_submitArea" required placeholder="https://..." class="contentUrlInput form-input w-full p-3 mb-3 rounded-2xl border-zinc-600 focus:border-red-500 focus:ring-red-500">
                    
                    <button id="submitContentLinkBtn_submitArea" class="submitContentLinkBtn btn bg-green-600 hover:bg-green-700 text-white font-bold text-base w-full py-3 rounded-2xl">
                        <i class="fa-solid fa-paper-plane mr-2"></i> Submit for Review
                    </button>

                     <p class="text-xs text-red-400 mt-2 font-semibold">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i> 
                        All posts undergo auditing. Submitting fake links or spam may result in a **permanent ban** from the Airdrop program.
                    </p>
                </li>
            </ol>
        </div>
    `;
}


// --- TAB 1: PROFILE ---
function renderProfileContent(el) {
    if (!el) return;

    if (!airdropState.isConnected) {
        const noDataHtml = renderNoData(null, 'Connect wallet to view profile.');
        el.innerHTML = renderSectionContainer('Your Profile', 'fa-user-check', noDataHtml);
        return;
    }
     if (!airdropState.user) {
        renderLoading(el, 'Loading profile...');
        return;
    }

    const { user, flaggedSubmissions, userSubmissions } = airdropState;
    const totalPoints = user.totalPoints || 0;
    const approvedCount = user.approvedSubmissionsCount || 0;
    const rejectedCount = user.rejectedCount || 0;
    const multiplier = Math.min(10.0, approvedCount * 0.1);
    const multiplierDisplay = `${multiplier.toFixed(1)}x`;
    
    const pendingPoints = userSubmissions
        .filter(sub => sub.status === 'pending' || sub.status === 'auditing')
        .reduce((sum, sub) => sum + (sub.basePoints || 0), 0);

    // Block for Required Action (Flagged)
    const flaggedReviewBlock = flaggedSubmissions.length > 0 ? `
        <div class="bg-red-900/40 border-2 border-red-500/80 rounded-xl p-6 mb-6 animate-pulse-slow">
            <h3 class="text-xl font-bold text-red-300 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-triangle-exclamation"></i> Action Required: Review Submissions
            </h3>
            <p class="text-sm text-zinc-200 mb-5">Our system flagged the following submissions. Please review them:</p>
            <div id="flagged-submissions-list" class="space-y-4">
                ${flaggedSubmissions.map(sub => {
                     const ui = platformUI[sub.platform] || platformUI['Other'];
                     return `
                        <div class="flagged-submission-card bg-main border border-red-600/70 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-4">
                           <div class="flex items-start gap-3 flex-grow min-w-0">
                                <i class="fa-brands ${ui.icon} ${ui.color} text-2xl mt-1 w-6 text-center shrink-0"></i>
                                <div class="min-w-0">
                                    <a href="${sub.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 font-semibold break-all block text-sm">
                                        ${sub.url}
                                    </a>
                                    <p class="text-xs text-zinc-400 mt-1">Submitted: ${sub.submittedAt ? sub.submittedAt.toLocaleDateString('en-US') : 'N/A'}</p>
                                </div>
                            </div>
                            <div class="resolve-buttons flex gap-2 mt-2 sm:mt-0 shrink-0 self-end sm:self-center">
                                <button data-submission-id="${sub.submissionId}" data-resolution="not_fraud" class="resolve-flagged-btn btn btn-success btn-xs">
                                    <i class="fa-solid fa-check mr-1"></i> Legitimate
                                </button>
                                <button data-submission-id="${sub.submissionId}" data-resolution="is_fraud" class="resolve-flagged-btn btn btn-danger btn-xs">
                                    <i class="fa-solid fa-times mr-1"></i> Fraud/Spam
                                </button>
                            </div>
                        </div>
                    `;}).join('')}
            </div>
        </div>
    ` : '';

    // Main Profile Stats Block
    const profileStatsHtml = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="md:col-span-1 space-y-4">
                 <div class="bg-main border border-border-color rounded-xl p-5 text-center shadow-inner">
                    <p class="text-sm text-zinc-400 mb-1 font-semibold uppercase tracking-wider">Total Points</p>
                    <p class="text-5xl font-extrabold text-yellow-400 tracking-tight">${totalPoints.toLocaleString('en-US')}</p>
                    <p class="text-xs text-zinc-500 mt-1">(Tasks + Content)</p>
                </div>
                <div class="bg-main border border-border-color rounded-xl p-5 text-center shadow-inner">
                    <p class="text-sm text-zinc-400 mb-1 font-semibold uppercase tracking-wider">Content Multiplier</p>
                    <p class="text-4xl font-bold text-green-400">${multiplierDisplay}</p>
                    <p class="text-xs text-zinc-500 mt-1">(${approvedCount} approved posts)</p>
                </div>
            </div>
            <div class="md:col-span-2 space-y-4">
                 <div class="bg-main border border-border-color rounded-xl p-5 text-center shadow-inner">
                    <p class="text-sm text-zinc-400 mb-1 font-semibold uppercase tracking-wider">Pending Points</p>
                    <p class="text-4xl font-bold text-amber-400">${pendingPoints.toLocaleString('en-US')}</p>
                     <p class="text-xs text-zinc-500 mt-1">(Estimated base points pending review)</p>
                </div>
                <div class="bg-main border border-border-color rounded-xl p-5 text-center shadow-inner">
                    <p class="text-sm text-zinc-400 mb-1 font-semibold uppercase tracking-wider">Rejections</p>
                    <p class="text-4xl font-bold ${rejectedCount >= 2 ? 'text-red-400 animate-pulse-slow' : 'text-orange-400'}">${rejectedCount} / 3</p>
                    <p class="text-xs text-zinc-500 mt-1">(Reaching 3 results in a ban)</p>
                </div>
            </div>
        </div>
    `;

    // Combine Blocks: Flags + Stats + Submission Area
    el.innerHTML = `
        ${flaggedReviewBlock}
        ${renderSectionContainer('Your Airdrop Stats', 'fa-chart-simple', profileStatsHtml)}
        ${renderContentSubmissionFlow()} `; // Using content flow here for quick access

    // --- Add Listeners ---
    document.getElementById('copyReferralBtn_submitArea')?.addEventListener('click', handleCopyReferralLink); 
    document.querySelector('.submission-step-4 .submitContentLinkBtn')?.addEventListener('click', handleSubmitUgcClick);
    document.getElementById('flagged-submissions-list')?.addEventListener('click', handleResolveSubmission);
}


// --- TAB 2: SUBMIT & EARN (Container/Sub-Tabs) ---
function renderSubmitEarnContent(el) {
    if (!el) return;
    
    if (!airdropState.isConnected) {
        const noDataHtml = renderNoData(null, 'Connect wallet to submit & earn.');
        el.innerHTML = renderSectionContainer('Submit & Earn', 'fa-share-nodes', noDataHtml);
        return;
    }
    
    // RENDER SUB-TABS
    const getSubTabBtnClass = (tabName) => {
        const baseClass = 'submit-tab-btn flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold transition-colors border-b-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-main rounded-t-md';
        return airdropState.activeSubmitTab === tabName
            ? `${baseClass} border-blue-500 text-blue-400` // Active
            : `${baseClass} text-zinc-400 hover:text-white border-transparent hover:border-zinc-500/50`; // Inactive
    };

    // Estrutura sem renderSectionContainer (como solicitado)
    let contentHtml = `
        <div class="border-b border-zinc-700 mb-6 bg-sidebar rounded-t-xl p-1">
            <nav id="submit-tabs" class="-mb-px flex flex-wrap gap-x-6 gap-y-1 p-1" role="tablist" aria-label="Submit & Earn sections">
                <button class="${getSubTabBtnClass('content-submission')}" data-target="content-submission">
                    <i class="fa-solid fa-up-right-from-square fa-fw"></i> Content Submission
                </button>
                 <button class="${getSubTabBtnClass('daily-tasks')}" data-target="daily-tasks">
                    <i class="fa-solid fa-list-check fa-fw"></i> Daily Tasks
                </button>
            </nav>
        </div>
        <div id="submit-earn-tab-content-wrapper" class="p-4 pt-0">
             </div>
    `;

    // Render the container structure
    el.innerHTML = contentHtml;
    
    // Add listener only once to the sub-tab navigation
    const submitTabsNav = document.getElementById('submit-tabs');
    if (submitTabsNav && !submitTabsNav._listenerAttached) {
       submitTabsNav.addEventListener('click', handleSubmitTabSwitch);
       submitTabsNav._listenerAttached = true;
    }

    // Render the active sub-tab content
    const contentWrapper = document.getElementById('submit-earn-tab-content-wrapper');
    if (contentWrapper) {
         if (airdropState.activeSubmitTab === 'content-submission') {
             contentWrapper.innerHTML = renderSubmissionPanelContent();
             // Re-attach listeners for submission flow
             document.getElementById('copyReferralBtn_submitArea')?.addEventListener('click', handleCopyReferralLink);
             document.querySelector('.submission-step-4 .submitContentLinkBtn')?.addEventListener('click', handleSubmitUgcClick);
             document.getElementById('ugc-submission-history')?.addEventListener('click', handleSubmissionAction);

         } else if (airdropState.activeSubmitTab === 'daily-tasks') {
             contentWrapper.innerHTML = renderDailyTasksPanelContent();
             // Re-attach listener for daily tasks
             const tasksContentEl = document.getElementById('tasks-content');
             if (tasksContentEl && !tasksContentEl._listenerAttached) {
                tasksContentEl.addEventListener('click', handleGoToTask);
                tasksContentEl._listenerAttached = true;
             }
             // Initialize timers
             document.querySelectorAll('.task-card-link.task-disabled').forEach(cardLink => {
                 const taskId = cardLink.dataset.taskId;
                 const task = airdropState.dailyTasks.find(t => t.id === taskId);
                 const statusBadge = cardLink.querySelector('.task-status-badge');
                 if (task && !task.eligible && task.timeLeftMs > 0 && statusBadge) {
                     startIndividualCooldownTimer(cardLink, statusBadge, task.timeLeftMs);
                 }
            });
         }
    }
}

// --- SUB-TAB 2.1: Content Submission Panel (Main content and History) ---
function renderSubmissionPanelContent() {
    // Calculate Stats
    const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
    if (airdropState.userSubmissions) {
         airdropState.userSubmissions.forEach(sub => {
            stats.total++;
            if (sub.status === 'approved') stats.approved++;
            else if (sub.status === 'rejected' || sub.status === 'flagged_suspicious') stats.rejected++;
            else if (sub.status === 'pending' || sub.status === 'auditing') stats.pending++;
        });
     }
    const statsHtml = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="stat-card">
                <p>Total Submissions</p><p class="text-white">${stats.total}</p>
            </div>
            <div class="stat-card border-green-500/50">
                <p>Approved</p><p class="text-green-400">${stats.approved}</p>
            </div>
            <div class="stat-card border-amber-500/50">
                <p>Pending Review</p><p class="text-amber-400">${stats.pending}</p>
            </div>
            <div class="stat-card border-red-500/50">
                <p>Rejected</p><p class="text-red-400">${stats.rejected}</p>
            </div>
        </div>
        <style>
            .stat-card { background-color: var(--bg-main); border: 1px solid var(--border-color); border-radius: 0.75rem; padding: 1rem; text-align: center; }
            .stat-card p:first-child { text-sm text-zinc-400 mb-1 font-semibold uppercase tracking-wider; }
            .stat-card p:last-child { text-3xl font-extrabold; }
        </style>`;

    // Render History (WITH VISUAL DELAY AND ACTIONS)
    const renderSubmissionHistory = () => {
        if (!airdropState.userSubmissions || airdropState.userSubmissions.length === 0) {
            return renderNoData(null, 'You have not submitted any content yet.');
        }
        const sortedSubs = [...airdropState.userSubmissions].sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
        const totalSubmissions = sortedSubs.length;
        const nowMs = Date.now();
        const twoHoursMs = AUTO_APPROVE_HOURS * 60 * 60 * 1000;

        return sortedSubs.map((sub, index) => {
            const submittedAtMs = sub.submittedAt?.getTime();
            let displayStatusKey = sub.status;
            let actionButtonsHtml = '';

            // PSYCHOLOGICAL DELAY LOGIC:
            if (sub.status === 'pending' && submittedAtMs && (nowMs - submittedAtMs >= twoHoursMs)) {
                // Real status in DB is 'pending', but visually shows need for confirmation
                displayStatusKey = 'pending_confirmation'; 
                actionButtonsHtml = `
                    <div class="action-buttons-container flex gap-2 mt-2 sm:mt-0 shrink-0 self-start sm:self-center">
                        <button data-submission-id="${sub.submissionId}" data-action="confirm" class="submission-action-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"><i class="fa-solid fa-check mr-1"></i> Confirm Points</button>
                        <button data-submission-id="${sub.submissionId}" data-action="report_error" class="submission-action-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"><i class="fa-solid fa-trash mr-1"></i> Report Error</button>
                    </div>
                `;
            } else if (['pending', 'auditing'].includes(sub.status)) {
                actionButtonsHtml = `<p class="text-xs text-zinc-500 mt-1">Audit in progress...</p>`;
            }

            const uiStatus = statusUI[displayStatusKey] || statusUI.pending;
            // Usa o novo mapping expandido
            const uiPlatform = platformUI[sub.platform] || platformUI.Other;
            let pointsDisplay = '';
            
            // POINTS: Show base value during audit/confirmation
            if (displayStatusKey === 'approved') { // REAL approval
                 const pointsToShow = sub.pointsAwarded !== undefined ? sub.pointsAwarded : (sub.basePoints || 0);
                 pointsDisplay = `(+${pointsToShow.toLocaleString('en-US')} Pts)`;
            } else if (['pending', 'auditing', 'flagged_suspicious', 'pending_confirmation'].includes(displayStatusKey)) {
                pointsDisplay = `(${sub.basePoints || 0} base pts)`;
            }

            // History Card
            return `
                <div class="submission-history-card bg-main border border-border-color rounded-lg p-4 mb-3 flex flex-col sm:flex-row items-start gap-4 transition-colors hover:bg-zinc-800/50">
                    <div class="flex-shrink-0 w-10 text-center pt-1"><span class="text-lg font-bold text-zinc-500">#${totalSubmissions - index}</span></div>
                    <div class="flex items-start gap-3 flex-grow min-w-0">
                        <i class="fa-brands ${uiPlatform.icon} ${uiPlatform.color} text-2xl mt-1 w-6 text-center shrink-0"></i>
                        <div class="min-w-0">
                            <a href="${sub.url}" target="_blank" rel="noopener noreferrer" class="font-mono text-blue-400 hover:text-blue-300 break-words block text-xs leading-snug">
                                ${sub.url}
                            </a>
                            <p class="text-xs text-zinc-400 mt-1.5">Submitted: ${sub.submittedAt ? sub.submittedAt.toLocaleString('en-US') : 'N/A'}</p>
                        </div>
                    </div>
                    <div class="text-left sm:text-right mt-2 sm:mt-0 shrink-0 flex flex-col items-end min-w-[120px] self-start sm:self-center">
                        <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${uiStatus.bgColor} ${uiStatus.color}"><i class="fa-solid ${uiStatus.icon}"></i> ${uiStatus.text}</span>
                        <p class="text-sm font-bold ${uiStatus.color} mt-1">${pointsDisplay}</p>
                        ${actionButtonsHtml}
                    </div>
                </div>`;
        }).join('');
    };


    // Main Content
    return `
        <p class="text-sm text-zinc-400 mb-6">Submit links to content you created about Backchain. Earn points and increase your multiplier.</p>
        ${statsHtml}
        ${renderContentSubmissionFlow()} 
        <div>
            <h3 class="text-xl font-bold mb-4 text-white mt-8 border-t border-border-color pt-6">Your Submission History</h3>
            <div id="ugc-submission-history">
                ${renderSubmissionHistory()}
            </div>
        </div>
    `;
}

// --- SUB-TAB 2.2: Daily Tasks Panel (REDESENHADO) ---
function renderDailyTasksPanelContent() {
     // Clear timers when switching away from this panel
     document.querySelectorAll('.task-card-link').forEach(card => {
        if (card._cooldownInterval) clearInterval(card._cooldownInterval);
        card._cooldownInterval = null;
    });

    // --- Render Task List ---
     const tasksHtml = airdropState.dailyTasks.length > 0 ? airdropState.dailyTasks.map(task => {
        if (task.error) return ``;

        const points = Math.round(task.points);
        const isEligible = task.eligible;
        const expiryDate = task.endDate ? task.endDate.toLocaleDateString('en-US') : 'N/A';

        // Determine initial status text/state
        let statusHTML;
        // Status chip class (discreto e lateral)
        let statusClass = 'task-status-badge font-bold text-xs py-2 px-3 rounded-xl transition-colors duration-200 shrink-0';
        // O card inteiro é o link clicável
        let cardClass = 'task-card-link bg-main border border-border-color rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200 hover:bg-zinc-800/50 hover:border-amber-500/50 cursor-pointer block decoration-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-sidebar';
        
        if (isEligible) {
             statusHTML = task.url ? 'Go & Earn' : 'Earn Points';
             statusClass += ' bg-amber-600 hover:bg-amber-700 text-white';
        } else {
            // Remove 'Cooldown: ' para evitar quebra de linha no badge
            statusHTML = formatTimeLeft(task.timeLeftMs).replace('Cooldown: ', ''); 
            // O card em cooldown tem opacidade e o cursor-not-allowed
            cardClass += ' task-disabled opacity-80 cursor-not-allowed';
            statusClass += ' bg-zinc-700 text-zinc-400';
        }
        
        // Task Card as an `<a>` link
        return `
            <a href="${task.url || '#'}" ${task.url ? 'target="_blank" rel="noopener noreferrer"' : ''}
               class="${cardClass}"
               data-task-id="${task.id}"
               data-task-url="${task.url || ''}"
               onclick="return false;" > 

                <div class="flex flex-col flex-grow items-center text-center min-w-0 pr-4">
                    <h4 class="font-extrabold text-xl text-white truncate w-full">${task.title}</h4>
                    <p class="text-sm text-zinc-300 mt-1 mb-3">${task.description || 'Complete the required action.'}</p>
                    
                    <div class="flex items-center gap-4 text-xs text-zinc-500 flex-wrap justify-center">
                        <span class="text-yellow-500 font-semibold"><i class="fa-solid fa-star mr-1"></i> +${points.toLocaleString('en-US')} Points</span>
                        <span><i class="fa-solid fa-clock mr-1"></i> Cooldown: ${task.cooldownHours}h</span>
                        <span><i class="fa-solid fa-calendar-times mr-1"></i> Expires: ${expiryDate}</span>
                    </div>
                </div>
                
                <div class="flex-shrink-0 w-full sm:w-40 h-full flex items-center justify-center order-2 sm:order-3 mt-3 sm:mt-0">
                    <span class="${statusClass} text-center w-full">
                        ${statusHTML}
                    </span>
                </div>
            </a>
        `;
    }).join('') : renderNoData(null, '<i class="fa-solid fa-coffee mr-2"></i> No active daily tasks right now.');

    // --- Main Tab Content ---
    return `
        <p class="text-sm text-zinc-400 mb-6">Click on a task card to visit the link and earn points. Each task has its own cooldown period shown on the card.</p>
        <div id="tasks-content" class="space-y-4">${tasksHtml}</div>
    `;
}


// --- TAB 3: RANKING ---
function renderLeaderboardPanel(el) {
    if (!el) return;
     document.querySelectorAll('.task-card-link').forEach(card => { /* clear timers */ });

    const { leaderboards } = airdropState;
    const topByPoints = leaderboards?.top100ByPoints || [];
    const topByPosts = leaderboards?.top100ByPosts || [];
    const lastUpdatedTimestamp = leaderboards?.lastUpdated;
    let lastUpdated = 'N/A';
    if(lastUpdatedTimestamp) {
        const date = lastUpdatedTimestamp.toDate ? lastUpdatedTimestamp.toDate() : new Date(lastUpdatedTimestamp);
         try {
             lastUpdated = date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
         } catch (e) { console.warn("Could not format leaderboard update time:", e); }
    }


    // --- Function to Render Table Rows ---
    const renderListRow = (item, index, valueKey = 'Pts', formatFn = (val) => val?.toLocaleString('en-US') || '0') => {
        const isUser = airdropState.user && item.walletAddress && airdropState.user.walletAddress?.toLowerCase() === item.walletAddress.toLowerCase();
        let rankClass = 'hover:bg-zinc-800/50';

        // Apply highlight classes for Top 3
        if (index === 0) rankClass = 'bg-amber-500/20 text-yellow-300 font-extrabold hover:bg-amber-500/30';
        else if (index < 3) rankClass = 'bg-amber-600/10 text-amber-400 font-semibold hover:bg-amber-600/20';

        // Override if it's the logged-in user
        if (isUser) rankClass = 'bg-blue-900/50 text-blue-300 font-bold border-l-4 border-blue-500 hover:bg-blue-900/70';

        // Row Layout
        return `
            <tr class="${rankClass} border-b border-zinc-700/50 last:border-b-0 text-sm">
                <td class="p-3 text-center font-bold w-16">${index + 1}</td>
                <td class="p-3 font-mono text-xs text-zinc-300">${formatAddress(item.walletAddress || 'Unknown')}</td>
                <td class="p-3 text-right font-bold w-32">${formatFn(item.value)} ${valueKey}</td>
            </tr>
        `;
    };

    // --- Render Complete Table ---
    const renderTable = (list, valueKey, formatFn) => {
        if (!list || list.length === 0) {
            return renderNoData(null, 'Leaderboard data unavailable.');
        }
        return `
            <div class="overflow-y-auto max-h-[600px] border border-border-color rounded-b-lg">
                <table class="w-full text-left table-fixed">
                    <thead class="sticky top-0 bg-zinc-800 z-10">
                        <tr class="text-xs text-zinc-400 uppercase border-b border-border-color">
                            <th class="p-3 text-center w-16">Rank</th>
                            <th class="p-3">Wallet</th>
                            <th class="p-3 text-right w-32">${valueKey === 'Pts' ? 'Points' : 'Posts'}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-700/50">
                        ${list.map((item, index) => renderListRow(item, index, valueKey, formatFn)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // --- NFT Prize Description ---
    const nftPrizeTiers = `
        <p class="font-bold text-white mb-2 text-sm">NFT Prize Tiers (Boosters):</p>
        <ul class="list-none space-y-2 text-xs text-zinc-300">
            <li><i class="fa-solid fa-gem text-blue-400 w-4 mr-1"></i> <span class="font-bold">Rank #1:</span> Diamond Booster NFT</li>
            <li><i class="fa-solid fa-crown text-gray-300 w-4 mr-1"></i> <span class="font-bold">Ranks #2 - #3:</span> Platinum Booster NFT</li>
            <li><i class="fa-solid fa-medal text-yellow-500 w-4 mr-1"></i> <span class="font-bold">Ranks #4 - #8:</span> Gold Booster NFT</li>
            <li><i class="fa-solid fa-certificate text-gray-400 w-4 mr-1"></i> <span class="font-bold">Ranks #9 - #12:</span> Silver Booster NFT</li>
            <li><i class="fa-solid fa-award text-amber-700 w-4 mr-1"></i> <span class="font-bold">Ranks #13 - #25:</span> Bronze Booster NFT</li>
            <li><i class="fa-solid fa-user-check text-green-500 w-4 mr-1"></i> <span class="font-bold">Ranks #26+:</span> Standard Booster NFT (Tier TBD)</li>
        </ul>
    `;


    // --- Main Tab Content ---
    const leaderboardContentHtml = `
        <p class="text-sm text-zinc-400 mb-6 text-center">
            <i class="fa-solid fa-sync mr-1"></i> Data Last Updated: ${lastUpdated}
        </p>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-main border border-border-color rounded-xl shadow-lg flex flex-col">
                <div class="p-5">
                    <h3 class="text-lg font-bold mb-2 text-yellow-400 flex items-center gap-2"><i class="fa-solid fa-star"></i> Total Points Ranking</h3>
                    <p class="text-xs text-zinc-400 border-t border-zinc-700/50 pt-2">Determines your share of the main <strong class="text-white">$BKC Token Allocation</strong>.</p>
                </div>
                ${renderTable(topByPoints, 'Pts')}
            </div>

            <div class="bg-main border border-border-color rounded-xl shadow-lg flex flex-col">
                 <div class="p-5">
                    <h3 class="text-lg font-bold mb-2 text-green-400 flex items-center gap-2"><i class="fa-solid fa-file-invoice"></i> Content Posts Ranking</h3>
                     <p class="text-xs text-zinc-400 border-t border-zinc-700/50 pt-2">Determines your eligibility for a tiered <strong class="text-white">$BKC Reward Booster NFT</strong>.</p>
                </div>
                <div class="p-4 bg-zinc-800 border-y border-zinc-700/50 mx-1 mb-0 rounded-t-md">
                     ${nftPrizeTiers} </div>
                ${renderTable(topByPosts, 'Posts', (val) => val?.toLocaleString('en-US') || '0')}
            </div>
        </div>
    `;

    // Render
    el.innerHTML = renderSectionContainer('Ranking & Rewards', 'fa-ranking-star', leaderboardContentHtml);
}


// =======================================================
//  4. MAIN RENDERING AND EXPORT
// =======================================================

/**
 * Renders the main Airdrop page content, including tabs and the active tab's content.
 */
function renderAirdropContent() {
    const mainContainer = document.getElementById('airdrop');
    // Ensure all base elements exist
    const loadingPlaceholder = document.getElementById('airdrop-loading-placeholder');
    const tabsContainer = document.getElementById('airdrop-tabs-container');
    const contentWrapper = document.getElementById('airdrop-content-wrapper');
    const activeContentEl = document.getElementById('active-tab-content');

    if (!mainContainer || !contentWrapper || !activeContentEl || !tabsContainer || !loadingPlaceholder) {
        console.error("Airdrop UI containers missing! Cannot render content.");
        if(mainContainer) mainContainer.innerHTML = "<p class='text-red-500 text-center p-8'>Error: UI components missing.</p>";
        return;
    }

    // --- Ban Message ---
    if (airdropState.isBanned) {
        loadingPlaceholder.innerHTML = '';
        tabsContainer.innerHTML = '';
        contentWrapper.innerHTML = `
            <div class="bg-red-900/30 border border-red-500/50 rounded-xl p-8 text-center max-w-2xl mx-auto">
                <i class="fa-solid fa-ban text-5xl text-red-400 mb-4"></i>
                <h2 class="text-2xl font-bold text-white mb-2">Account Banned</h2>
                <p class="text-zinc-300">Your account has been banned from the Airdrop due to multiple policy violations. This action is irreversible.</p>
            </div>
        `;
        return;
    }

    loadingPlaceholder.innerHTML = '';

    // --- Render Main Tabs ---
    const getTabBtnClass = (tabName) => {
        const baseClass = 'airdrop-tab-btn flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold transition-colors border-b-2 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-main rounded-t-md';
        return airdropState.activeMainTab === tabName
            ? `${baseClass} border-amber-500 text-amber-400`
            : `${baseClass} text-zinc-400 hover:text-white border-transparent hover:border-zinc-500/50`;
    };
    
    // Structure with only 3 main tabs
    tabsContainer.innerHTML = `
        <div class="border-b border-zinc-700 mb-8">
            <nav id="airdrop-tabs" class="-mb-px flex flex-wrap gap-x-6 gap-y-1" role="tablist" aria-label="Airdrop sections">
                <button role="tab" id="tab-profile" aria-controls="panel-profile" aria-selected="${airdropState.activeMainTab === 'profile'}" class="${getTabBtnClass('profile')}" data-target="profile">
                    <i class="fa-solid fa-user-check fa-fw"></i> Profile
                </button>
                <button role="tab" id="tab-submissions" aria-controls="panel-submissions" aria-selected="${airdropState.activeMainTab === 'submissions'}" class="${getTabBtnClass('submissions')}" data-target="submissions">
                    <i class="fa-solid fa-share-nodes fa-fw"></i> Submit & Earn
                </button>
                <button role="tab" id="tab-ranking" aria-controls="panel-ranking" aria-selected="${airdropState.activeMainTab === 'ranking'}" class="${getTabBtnClass('ranking')}" data-target="ranking">
                    <i class="fa-solid fa-ranking-star fa-fw"></i> Ranking
                </button>
            </nav>
        </div>
    `;

    // Add main tab listener (only once)
    const tabsNav = document.getElementById('airdrop-tabs');
    if (tabsNav && !tabsNav._listenerAttached) {
       tabsNav.addEventListener('click', handleMainTabSwitch);
       tabsNav._listenerAttached = true;
    }

    // --- Render Active Main Tab Content ---
    activeContentEl.innerHTML = '';
    activeContentEl.setAttribute('role', 'tabpanel');
    activeContentEl.setAttribute('tabindex', '0');
    activeContentEl.setAttribute('aria-labelledby', `tab-${airdropState.activeMainTab}`);

    try {
        // The activeContentEl is the container for the selected tab.
        // For 'submissions', it will contain the sub-tabs.
        switch (airdropState.activeMainTab) {
            case 'profile': renderProfileContent(activeContentEl); break;
            case 'submissions': renderSubmitEarnContent(activeContentEl); break;
            case 'ranking': renderLeaderboardPanel(activeContentEl); break;
            default: renderProfileContent(activeContentEl);
        }
    } catch (error) {
         console.error(`Error rendering tab ${airdropState.activeMainTab}:`, error);
         renderError(activeContentEl, `Error loading ${airdropState.activeMainTab} content.`);
    }
}


// --- Exported Page Object ---
export const AirdropPage = {
    /**
     * Entry point to render/reload the Airdrop page.
     */
    async render() {
        const airdropEl = document.getElementById('airdrop');
        if (!airdropEl) {
            console.error("Airdrop container element (#airdrop) not found in HTML.");
            return;
        }

        // Clear old visual cooldown timers upon re-render
        document.querySelectorAll('.task-card-link').forEach(card => {
             if (card._cooldownInterval) clearInterval(card._cooldownInterval);
             card._cooldownInterval = null;
        });

        const loadingPlaceholder = document.getElementById('airdrop-loading-placeholder');
        const tabsContainer = document.getElementById('airdrop-tabs-container');
        const contentWrapper = document.getElementById('airdrop-content-wrapper');
        const activeContentEl = document.getElementById('active-tab-content');

        if (!loadingPlaceholder || !tabsContainer || !contentWrapper || !activeContentEl) {
             console.error("One or more essential Airdrop child elements were not found!");
             renderError(airdropEl, "UI Error: Could not load Airdrop components. Please try refreshing.");
             return;
        }

        renderLoading(loadingPlaceholder, 'Loading Airdrop...');
        tabsContainer.innerHTML = '';
        activeContentEl.innerHTML = '';

        try {
            await loadAirdropData();
            renderAirdropContent();
        } catch (error) {
            console.error("Critical error during AirdropPage.render -> loadAirdropData:", error);
            renderError(contentWrapper, "Failed to load critical airdrop data. Please refresh.");
            loadingPlaceholder.innerHTML = '';
        }
    },

    /**
     * Function called by the global listener when wallet status changes.
     * @param {boolean} isConnected New connection status.
     */
    update(isConnected) {
        const airdropElement = document.getElementById('airdrop');
        const isVisible = airdropElement && !airdropElement.classList.contains('hidden');
        if (airdropState.isConnected !== isConnected && isVisible) {
             console.log(`AirdropPage: Connection status changed to ${isConnected}. Reloading...`);
             this.render();
        }
    }
};