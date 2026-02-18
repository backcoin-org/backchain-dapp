// pages/AdminPage.js
// ✅ VERSION V3.0: Admin Page Overhaul — Overview + Bulk Actions + Settings Accordion
const ethers = window.ethers;
import { addresses, faucetABI } from '../config.js';
import { showToast } from '../ui-feedback.js';
import { renderPaginatedList, renderPaginationControls, renderNoData, formatAddress, renderLoading, renderError } from '../utils.js';
import { State } from '../state.js';
import * as db from '../modules/firebase-auth-service.js';

// ============================================
// ADMIN CONFIGURATION (via Environment Variables)
// Definidas no Vercel - não ficam expostas no código fonte
// ============================================
const ADMIN_WALLET = (import.meta.env.VITE_ADMIN_WALLET || "").toLowerCase();
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || "";
const ADMIN_SESSION_KEY = "bkc_admin_auth_v3";

// ✅ Expõe globalmente para o script do index.html poder verificar
window.__ADMIN_WALLET__ = ADMIN_WALLET;

// Dispara evento para notificar que a configuração está pronta
setTimeout(() => {
    document.dispatchEvent(new CustomEvent('adminConfigReady'));
    console.log('✅ Admin config ready, wallet:', ADMIN_WALLET ? 'configured' : 'not set');
}, 100);

// Verifica se admin já está autenticado na sessão
function isAdminSessionValid() {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return session === "true";
}

// Marca sessão como autenticada
function setAdminSession() {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
}

// Remove sessão
function clearAdminSession() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

// Verifica se a carteira conectada é admin
function isAdminWallet() {
    if (!State.isConnected || !State.userAddress || !ADMIN_WALLET) return false;
    return State.userAddress.toLowerCase() === ADMIN_WALLET;
}

// Mapeamento de Status para UI (Cores Tailwind e Ícones Font Awesome) - Reutilizado do AirdropPage
const statusUI = {
    pending: { text: 'Pending Review', color: 'text-amber-400', bgColor: 'bg-amber-900/50', icon: 'fa-clock' },
    auditing: { text: 'Auditing', color: 'text-blue-400', bgColor: 'bg-blue-900/50', icon: 'fa-magnifying-glass' },
    approved: { text: 'Approved', color: 'text-green-400', bgColor: 'bg-green-900/50', icon: 'fa-check-circle' },
    rejected: { text: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-900/50', icon: 'fa-times-circle' },
    flagged_suspicious: { text: 'Flagged', color: 'text-red-300', bgColor: 'bg-red-800/60', icon: 'fa-flag' },
};

// Default Platform Usage Config
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

// --- HELPER FUNCTIONS ---

function getTimeAgo(date) {
    if (!date) return 'N/A';
    const now = Date.now();
    const d = date instanceof Date ? date.getTime() : new Date(date).getTime();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPlatformIcon(platform) {
    const map = {
        'YouTube': 'fa-brands fa-youtube text-red-500',
        'YouTube Shorts': 'fa-brands fa-youtube text-red-400',
        'Instagram': 'fa-brands fa-instagram text-pink-500',
        'X/Twitter': 'fa-brands fa-x-twitter text-zinc-300',
        'Facebook': 'fa-brands fa-facebook text-blue-500',
        'Telegram': 'fa-brands fa-telegram text-sky-400',
        'TikTok': 'fa-brands fa-tiktok text-pink-400',
        'Reddit': 'fa-brands fa-reddit text-orange-500',
        'LinkedIn': 'fa-brands fa-linkedin text-blue-400',
    };
    return map[platform] || 'fa-solid fa-globe text-zinc-400';
}

function truncateUrl(url, maxLen = 45) {
    if (!url) return '';
    if (url.length <= maxLen) return url;
    return url.substring(0, maxLen - 3) + '...';
}

function exportCSV(rows, headers, filename) {
    const headerLabels = headers.map(h => h.label || h.key);
    const csvLines = [headerLabels.join(',')];
    for (const row of rows) {
        const values = headers.map(h => {
            let val = row[h.key] ?? '';
            val = String(val).replace(/"/g, '""');
            return `"${val}"`;
        });
        csvLines.push(values.join(','));
    }
    const csv = csvLines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

let adminState = {
    allSubmissions: [],
    dailyTasks: [],
    ugcBasePoints: null,
    platformUsageConfig: null,
    editingTask: null,
    activeTab: 'overview', // Default to overview

    // Manage Users
    allUsers: [],
    selectedUserSubmissions: [],
    isSubmissionsModalOpen: false,
    selectedWallet: null,
    usersFilter: 'all',
    usersSearch: '',
    usersPage: 1,
    usersPerPage: 100,

    // Submissions
    submissionsPage: 1,
    submissionsPerPage: 100,
    selectedSubmissions: new Set(),       // Bulk select
    submissionsFilterPlatform: 'all',     // Platform filter

    // Tasks
    tasksPage: 1,
    tasksPerPage: 100,

    // Overview
    faucetStatus: null,

    // Settings
    settingsOpenSection: 'ugc-points',
};

// --- ADMIN DATA LOADING (ATUALIZADO) ---
const loadAdminData = async () => {
    const adminContent = document.getElementById('admin-content-wrapper');
    // Mostra loader ANTES de buscar os dados
    if(adminContent) {
        const tempLoaderDiv = document.createElement('div');
        renderLoading(tempLoaderDiv); // Usa a função utilitária
        adminContent.innerHTML = tempLoaderDiv.innerHTML;
    }


    try {
        // ✅ Garante autenticação Firebase ANTES de carregar dados
        if (State.userAddress) {
            await db.signIn(State.userAddress);
            console.log("✅ Firebase Auth: Admin authenticated");
        }
        
        const [submissions, tasks, publicData, users] = await Promise.all([
            db.getAllSubmissionsForAdmin(), // Otimizado
            db.getAllTasksForAdmin(),
            db.getPublicAirdropData(),
            db.getAllAirdropUsers() // <-- NOVO
        ]);

        adminState.allSubmissions = submissions;
        adminState.dailyTasks = tasks;
        adminState.allUsers = users; // <-- NOVO
        
        adminState.ugcBasePoints = publicData.config?.ugcBasePoints || {
            'YouTube': 5000,
            'YouTube Shorts': 2500,
            'Instagram': 3000,
            'X/Twitter': 1500,
            'Facebook': 2000,
            'Telegram': 1000,
            'TikTok': 3500,
            'Reddit': 1800,
            'LinkedIn': 2200,
            'Other': 1000
        };

        // Carrega Platform Usage Config
        adminState.platformUsageConfig = publicData.platformUsageConfig || DEFAULT_PLATFORM_USAGE_CONFIG;


        // Se estava editando, atualiza os dados da tarefa sendo editada
        if (adminState.editingTask) {
             adminState.editingTask = tasks.find(t => t.id === adminState.editingTask.id) || null;
        }

        renderAdminPanel(); // Renderiza a UI com os dados carregados
    } catch (error) {
        console.error("Error loading admin data:", error);
        if (adminContent) {
            // Usa renderError para exibir a falha
            const tempErrorDiv = document.createElement('div');
            renderError(tempErrorDiv, `Failed to load admin data: ${error.message}`);
            adminContent.innerHTML = tempErrorDiv.innerHTML;
        } else {
             showToast("Failed to load admin data.", "error");
        }
    }
};

// --- FAUCET MANAGEMENT ---

const loadFaucetStatus = async () => {
    try {
        const faucetContract = State.faucetContractPublic;
        if (!faucetContract) {
            adminState.faucetStatus = { error: 'Contract not loaded' };
            return;
        }
        const [status, stats, isPaused] = await Promise.all([
            faucetContract.getFaucetStatus(),
            faucetContract.getStats(),
            faucetContract.paused(),
        ]);
        adminState.faucetStatus = {
            ethBalance: status.ethBalance,
            tokenBalance: status.tokenBalance,
            ethPerDrip: status.ethPerDrip,
            tokensPerDrip: status.tokensPerDrip,
            estimatedEthClaims: status.estimatedEthClaims,
            estimatedTokenClaims: status.estimatedTokenClaims,
            totalTokens: stats.tokens,
            totalEth: stats.eth,
            totalClaims: stats.claims,
            totalUsers: stats.users,
            isPaused,
        };
    } catch (error) {
        console.error("Error loading faucet status:", error);
        adminState.faucetStatus = { error: error.message };
    }
    // Re-render overview if visible
    const overviewEl = document.getElementById('overview-faucet-card');
    if (overviewEl) renderFaucetCard();
};

const renderFaucetCard = () => {
    const container = document.getElementById('overview-faucet-card');
    if (!container) return;
    const fs = adminState.faucetStatus;

    if (!fs || fs.error) {
        container.innerHTML = `<div class="p-4 text-sm text-zinc-400">${fs?.error || 'Loading faucet...'}</div>`;
        return;
    }

    const tokenBal = parseFloat(ethers.formatEther(fs.tokenBalance));
    const ethBal = parseFloat(ethers.formatEther(fs.ethBalance));
    const totalTokensDist = parseFloat(ethers.formatEther(fs.totalTokens));
    const statusColor = fs.isPaused ? 'text-red-400' : 'text-green-400';
    const statusText = fs.isPaused ? 'Paused' : 'Active';
    const statusDot = fs.isPaused ? 'bg-red-500' : 'bg-green-500';

    container.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-bold text-white"><i class="fa-solid fa-faucet-drip mr-2 text-sky-400"></i>Faucet Status</h3>
            <span class="flex items-center gap-2 text-sm font-semibold ${statusColor}">
                <span class="w-2.5 h-2.5 rounded-full ${statusDot} animate-pulse"></span>${statusText}
            </span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div class="text-center">
                <span class="block text-lg font-bold text-amber-400">${tokenBal.toLocaleString('en-US', {maximumFractionDigits:0})} BKC</span>
                <span class="text-xs text-zinc-500">Token Balance</span>
            </div>
            <div class="text-center">
                <span class="block text-lg font-bold text-sky-400">${ethBal.toFixed(4)} BNB</span>
                <span class="text-xs text-zinc-500">BNB Balance</span>
            </div>
            <div class="text-center">
                <span class="block text-lg font-bold text-purple-400">${Number(fs.totalClaims).toLocaleString()}</span>
                <span class="text-xs text-zinc-500">Total Claims</span>
            </div>
            <div class="text-center">
                <span class="block text-lg font-bold text-green-400">${Number(fs.totalUsers).toLocaleString()}</span>
                <span class="text-xs text-zinc-500">Unique Users</span>
            </div>
        </div>
        <div class="flex flex-wrap gap-2 text-xs text-zinc-400 mb-4">
            <span>Per claim: ${parseFloat(ethers.formatEther(fs.tokensPerDrip)).toLocaleString()} BKC + ${parseFloat(ethers.formatEther(fs.ethPerDrip))} BNB</span>
            <span>|</span>
            <span>Total distributed: ${totalTokensDist.toLocaleString('en-US', {maximumFractionDigits:0})} BKC</span>
        </div>
        <div class="flex gap-3">
            <button id="toggle-faucet-pause-btn" class="${fs.isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">
                <i class="fa-solid ${fs.isPaused ? 'fa-play' : 'fa-pause'} mr-2"></i>${fs.isPaused ? 'Unpause Faucet' : 'Pause Faucet'}
            </button>
            <a href="https://sepolia.arbiscan.io/address/${addresses.faucet}" target="_blank" rel="noopener noreferrer"
               class="bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>Explorer
            </a>
        </div>
    `;

    document.getElementById('toggle-faucet-pause-btn')?.addEventListener('click', handleToggleFaucetPause);
};

const handleToggleFaucetPause = async () => {
    const btn = document.getElementById('toggle-faucet-pause-btn');
    if (!btn || btn.disabled) return;

    const fs = adminState.faucetStatus;
    if (!fs) return;

    const newPaused = !fs.isPaused;
    const confirmText = newPaused
        ? "Are you sure you want to PAUSE the faucet? Users won't be able to claim."
        : "Are you sure you want to UNPAUSE the faucet?";
    if (!window.confirm(confirmText)) return;

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing...';

    try {
        const faucetContract = State.faucetContract;
        if (!faucetContract) throw new Error("Faucet signer contract not available.");
        const tx = await faucetContract.setPaused(newPaused);
        showToast("Transaction sent...", "info");
        await tx.wait();
        showToast(`Faucet ${newPaused ? 'PAUSED' : 'UNPAUSED'} successfully!`, "success");
        await loadFaucetStatus();
    } catch (error) {
        console.error("Error toggling faucet pause:", error);
        showToast(`Error: ${error.reason || error.message}`, "error");
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
};

// --- OVERVIEW PANEL ---

const renderOverviewPanel = () => {
    const container = document.getElementById('overview-content');
    if (!container) return;

    const totalUsers = adminState.allUsers.length;
    const pendingCount = adminState.allSubmissions.length;
    const bannedCount = adminState.allUsers.filter(u => u.isBanned).length;
    const totalPoints = adminState.allUsers.reduce((sum, u) => sum + (u.totalPoints || 0), 0);

    container.innerHTML = `
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
                <i class="fa-solid fa-users text-2xl text-blue-400 mb-2"></i>
                <span class="block text-2xl font-bold text-white">${totalUsers.toLocaleString()}</span>
                <span class="text-xs text-zinc-500">Total Users</span>
            </div>
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center cursor-pointer hover:border-amber-500/50 transition-colors" id="overview-go-submissions">
                <i class="fa-solid fa-clock text-2xl text-amber-400 mb-2"></i>
                <span class="block text-2xl font-bold text-white">${pendingCount.toLocaleString()}</span>
                <span class="text-xs text-zinc-500">Pending Submissions</span>
            </div>
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
                <i class="fa-solid fa-star text-2xl text-yellow-400 mb-2"></i>
                <span class="block text-2xl font-bold text-white">${totalPoints >= 1000000 ? (totalPoints / 1000000).toFixed(1) + 'M' : totalPoints >= 1000 ? (totalPoints / 1000).toFixed(1) + 'K' : totalPoints.toLocaleString()}</span>
                <span class="text-xs text-zinc-500">Total Points</span>
            </div>
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
                <i class="fa-solid fa-ban text-2xl text-red-400 mb-2"></i>
                <span class="block text-2xl font-bold text-white">${bannedCount}</span>
                <span class="text-xs text-zinc-500">Banned Users</span>
            </div>
        </div>

        <!-- Faucet Status -->
        <div id="overview-faucet-card" class="bg-zinc-800 border border-zinc-700 rounded-xl p-5 mb-6">
            <div class="p-4 text-sm text-zinc-400"><span class="loader !w-5 !h-5 inline-block mr-2"></span>Loading faucet status...</div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-5">
            <h3 class="text-lg font-bold text-white mb-4"><i class="fa-solid fa-bolt mr-2 text-amber-400"></i>Quick Actions</h3>
            <div class="flex flex-wrap gap-3">
                <button id="overview-go-submissions-btn" class="bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">
                    <i class="fa-solid fa-list-check mr-2"></i>Review Submissions ${pendingCount > 0 ? `(${pendingCount})` : ''}
                </button>
                <button id="overview-export-users-btn" class="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">
                    <i class="fa-solid fa-file-csv mr-2"></i>Export Users CSV
                </button>
                <button id="overview-reload-btn" class="bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">
                    <i class="fa-solid fa-rotate mr-2"></i>Reload Data
                </button>
            </div>
        </div>
    `;

    // Load faucet data
    loadFaucetStatus();

    // Quick action listeners
    const goToTab = (tabName) => {
        adminState.activeTab = tabName;
        renderAdminPanel();
    };
    document.getElementById('overview-go-submissions')?.addEventListener('click', () => goToTab('review-submissions'));
    document.getElementById('overview-go-submissions-btn')?.addEventListener('click', () => goToTab('review-submissions'));
    document.getElementById('overview-export-users-btn')?.addEventListener('click', handleExportUsersCSV);
    document.getElementById('overview-reload-btn')?.addEventListener('click', () => {
        showToast("Reloading data...", "info");
        loadAdminData();
    });
};


// --- CSV EXPORT ---

const handleExportUsersCSV = () => {
    const users = adminState.allUsers;
    if (!users || users.length === 0) {
        showToast("No users to export.", "info");
        return;
    }
    const headers = [
        { key: 'walletAddress', label: 'Wallet' },
        { key: 'totalPoints', label: 'Total Points' },
        { key: 'approvedSubmissionsCount', label: 'Approved' },
        { key: 'rejectedCount', label: 'Rejected' },
        { key: 'isBanned', label: 'Banned' },
        { key: 'hasPendingAppeal', label: 'Appealing' },
    ];
    exportCSV(users, headers, `backchain-users-${new Date().toISOString().split('T')[0]}.csv`);
    showToast(`Exported ${users.length} users.`, "success");
};

const handleExportSubmissionsCSV = () => {
    const subs = adminState.allSubmissions;
    if (!subs || subs.length === 0) {
        showToast("No submissions to export.", "info");
        return;
    }
    const headers = [
        { key: 'walletAddress', label: 'Wallet' },
        { key: 'platform', label: 'Platform' },
        { key: 'normalizedUrl', label: 'URL' },
        { key: 'status', label: 'Status' },
        { key: 'basePoints', label: 'Base Points' },
    ];
    exportCSV(subs, headers, `backchain-submissions-${new Date().toISOString().split('T')[0]}.csv`);
    showToast(`Exported ${subs.length} submissions.`, "success");
};

// --- BULK ACTIONS ---

const handleBulkAction = async (action) => {
    const selected = adminState.selectedSubmissions;
    if (selected.size === 0) return;

    const confirmText = action === 'approved'
        ? `Approve ${selected.size} submission(s)?`
        : `Reject ${selected.size} submission(s)?`;
    if (!window.confirm(confirmText)) return;

    // Find submission data for selected IDs
    const toProcess = adminState.allSubmissions.filter(s => selected.has(s.submissionId));

    // Show processing state
    const bulkBar = document.getElementById('bulk-action-bar');
    if (bulkBar) bulkBar.innerHTML = `<span class="text-sm text-zinc-300"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing ${toProcess.length}...</span>`;

    const results = await Promise.allSettled(
        toProcess.map(s => db.updateSubmissionStatus(s.userId, s.submissionId, action))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Remove processed from state
    const processedIds = new Set(toProcess.map(s => s.submissionId));
    adminState.allSubmissions = adminState.allSubmissions.filter(s => !processedIds.has(s.submissionId));
    adminState.selectedSubmissions.clear();

    if (failed > 0) {
        showToast(`${succeeded} ${action}, ${failed} failed.`, "warning");
    } else {
        showToast(`${succeeded} submission(s) ${action}!`, "success");
    }
    renderSubmissionsPanel();
};

const handleSubmissionCheckbox = (submissionId, checked) => {
    if (checked) {
        adminState.selectedSubmissions.add(submissionId);
    } else {
        adminState.selectedSubmissions.delete(submissionId);
    }
    updateBulkActionBar();
};

const handleSelectAllSubmissions = (checked) => {
    // Get currently visible (filtered) submissions
    const filtered = getFilteredSubmissions();
    if (checked) {
        filtered.forEach(s => adminState.selectedSubmissions.add(s.submissionId));
    } else {
        adminState.selectedSubmissions.clear();
    }
    // Update all checkboxes
    document.querySelectorAll('.submission-checkbox').forEach(cb => { cb.checked = checked; });
    updateBulkActionBar();
};

const updateBulkActionBar = () => {
    const bar = document.getElementById('bulk-action-bar');
    if (!bar) return;
    const count = adminState.selectedSubmissions.size;
    if (count === 0) {
        bar.classList.add('hidden');
        return;
    }
    bar.classList.remove('hidden');
    bar.innerHTML = `
        <span class="text-sm text-zinc-300 font-medium">${count} selected</span>
        <div class="flex gap-2">
            <button id="bulk-approve-btn" class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors">
                <i class="fa-solid fa-check mr-1"></i>Approve (${count})
            </button>
            <button id="bulk-reject-btn" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors">
                <i class="fa-solid fa-times mr-1"></i>Reject (${count})
            </button>
            <button id="bulk-clear-btn" class="bg-zinc-700 hover:bg-zinc-600 text-white text-xs py-1.5 px-3 rounded transition-colors">Clear</button>
        </div>
    `;
    document.getElementById('bulk-approve-btn')?.addEventListener('click', () => handleBulkAction('approved'));
    document.getElementById('bulk-reject-btn')?.addEventListener('click', () => handleBulkAction('rejected'));
    document.getElementById('bulk-clear-btn')?.addEventListener('click', () => {
        adminState.selectedSubmissions.clear();
        document.querySelectorAll('.submission-checkbox').forEach(cb => { cb.checked = false; });
        document.getElementById('select-all-checkbox')?.setAttribute('checked', false);
        updateBulkActionBar();
    });
};

function getFilteredSubmissions() {
    let subs = adminState.allSubmissions;
    if (adminState.submissionsFilterPlatform !== 'all') {
        subs = subs.filter(s => s.platform === adminState.submissionsFilterPlatform);
    }
    return [...subs].sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
}

// --- ADMIN ACTION HANDLERS ---

// Este handler agora é APENAS para a tabela principal de "Review Submissions"
const handleAdminAction = async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn || btn.disabled) return;

    const action = btn.dataset.action; // <-- AGORA VAI RECEBER 'approved' ou 'rejected'
    const submissionId = btn.dataset.submissionId;
    const userId = btn.dataset.userId;

    if (!action || !submissionId || !userId) {
        console.warn("Missing data attributes for admin action:", btn.dataset);
        return;
    }

    const tableRow = btn.closest('tr');
    const actionButtons = btn.closest('td').querySelectorAll('button');

    if (tableRow) {
        tableRow.style.opacity = '0.5';
        tableRow.style.pointerEvents = 'none';
    } else {
        actionButtons.forEach(b => b.disabled = true);
    }

    try {
        // A função updateSubmissionStatus já espera 'approved' ou 'rejected'
        if (action === 'approved' || action === 'rejected') { 
            await db.updateSubmissionStatus(userId, submissionId, action); //
            showToast(`Submission ${action === 'approved' ? 'APPROVED' : 'REJECTED'}!`, 'success');

            // Atualiza o estado LOCAL
            adminState.allSubmissions = adminState.allSubmissions.filter(
                sub => sub.submissionId !== submissionId
            );
            
            // Recarrega os dados da aba para refletir a paginação
            renderSubmissionsPanel();
        }
    } catch(error) {
        showToast(`Failed to ${action} submission: ${error.message}`, 'error');
        console.error(error);
        
        if (tableRow) {
            tableRow.style.opacity = '1';
            tableRow.style.pointerEvents = 'auto';
        }
    }
};

// --- (INÍCIO) NOVOS HANDLERS PARA "MANAGE USERS" ---

// ATUALIZADO: handler para banir/desbanir
const handleBanUser = async (e) => {
    const btn = e.target.closest('.ban-user-btn');
    if (!btn || btn.disabled) return;

    const userId = btn.dataset.userId;
    const newBanStatus = btn.dataset.action === 'ban'; // true se 'ban', false se 'unban'
    
    if (!userId) return;
    
    const confirmationText = newBanStatus
        ? "Are you sure you want to PERMANENTLY BAN this user?\n(This is reversible)"
        : "Are you sure you want to UNBAN this user?\n(This will reset their rejection count to 0)";
    
    if (!window.confirm(confirmationText)) return;

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        await db.setBanStatus(userId, newBanStatus); //
        showToast(`User ${newBanStatus ? 'BANNED' : 'UNBANNED'}.`, 'success');

        // Atualiza o estado local
        const userIndex = adminState.allUsers.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            adminState.allUsers[userIndex].isBanned = newBanStatus;
            adminState.allUsers[userIndex].hasPendingAppeal = false; // Garante que a apelação seja zerada
            if (newBanStatus === false) {
                 adminState.allUsers[userIndex].rejectedCount = 0; // Zera contagem no UI
            }
        }
        // Re-renderiza o painel de usuários (agora com filtros)
        renderManageUsersPanel();

    } catch (error) {
        showToast(`Failed: ${error.message}`, 'error');
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
};

// NOVO: Handler para resolver apelação (contestação)
const handleResolveAppeal = async (e) => {
    const btn = e.target.closest('.resolve-appeal-btn');
    if (!btn || btn.disabled) return;

    const userId = btn.dataset.userId;
    const action = btn.dataset.action; // 'approve' ou 'deny'
    const isApproved = action === 'approve';

    if (!userId) return;

    const confirmationText = isApproved
        ? "Are you sure you want to APPROVE this appeal and UNBAN the user?"
        : "Are you sure you want to DENY this appeal? The user will remain banned.";

    if (!window.confirm(confirmationText)) return;

    // Desabilita ambos os botões (Aprovar e Negar) na linha
    const buttons = btn.closest('td').querySelectorAll('button');
    const originalHtmls = new Map();
    buttons.forEach(b => {
        originalHtmls.set(b, b.innerHTML);
        b.disabled = true;
        b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    });

    try {
        // Use setBanStatus to unban if approved
        if (isApproved) {
            await db.setBanStatus(userId, false); // Unban user
        }
        showToast(`Appeal ${isApproved ? 'APPROVED' : 'DENIED'}.`, 'success');

        // Atualiza o estado local
        const userIndex = adminState.allUsers.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            adminState.allUsers[userIndex].hasPendingAppeal = false; // Remove o flag de apelação
            if (isApproved) {
                adminState.allUsers[userIndex].isBanned = false; // Desbane
                adminState.allUsers[userIndex].rejectedCount = 0; // Zera rejeições
            }
        }
        
        // Re-renderiza a aba
        renderManageUsersPanel();

    } catch (error) {
        showToast(`Failed: ${error.message}`, 'error');
        // Restaura botões em caso de erro
        buttons.forEach(b => {
             b.disabled = false;
             b.innerHTML = originalHtmls.get(b);
        });
    }
};


// Novo handler para re-aprovar (dentro do modal)
const handleReApproveAction = async (e) => {
     const btn = e.target.closest('.re-approve-btn');
     if (!btn || btn.disabled) return;
     
     const submissionId = btn.dataset.submissionId;
     const userId = btn.dataset.userId;
     if (!submissionId || !userId) return;

     const row = btn.closest('tr');
     if(row) row.style.opacity = '0.5';
     btn.disabled = true;
     btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

     try {
         // Re-usa a função de backend, mas força 'approved'
         await db.updateSubmissionStatus(userId, submissionId, 'approved'); // <-- CORRIGIDO
         showToast('Submission re-approved!', 'success');
         
         // Remove do estado local do modal
         adminState.selectedUserSubmissions = adminState.selectedUserSubmissions.filter(
             sub => sub.submissionId !== submissionId
         );
         // Remove a linha da tabela do modal
         if(row) row.remove();
         
         // Recarrega os dados do usuário para atualizar contagens
         const userIndex = adminState.allUsers.findIndex(u => u.id === userId);
         if (userIndex > -1) {
             // Atualiza o estado local do usuário na tabela principal
             const user = adminState.allUsers[userIndex];
             // Decrementa a contagem de rejeição (garante que não fique negativo)
             user.rejectedCount = Math.max(0, (user.rejectedCount || 0) - 1);
             // (Não vamos tentar adivinhar os pontos, o usuário pode recarregar a aba)
             renderManageUsersPanel(); // Re-renderiza a tabela de usuários
         }
         // Atualiza o título do modal se a lista ficar vazia
         if (adminState.selectedUserSubmissions.length === 0) {
            const modalContent = document.querySelector('#admin-user-modal .p-6');
            if (modalContent) modalContent.innerHTML = '<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>';
         }
         
     } catch (error) {
         showToast(`Failed to re-approve: ${error.message}`, 'error');
         if(row) row.style.opacity = '1';
         btn.disabled = false;
         btn.innerHTML = '<i class="fa-solid fa-check"></i> Re-Approve';
     }
};

// Novo handler para ABRIR o modal
const handleViewRejected = async (e) => {
    const btn = e.target.closest('.view-rejected-btn');
    if (!btn || btn.disabled) return;
    
    const userId = btn.dataset.userId;
    const wallet = btn.dataset.wallet;
    if (!userId) return;

    adminState.selectedWallet = wallet;
    adminState.isSubmissionsModalOpen = true;
    
    // Abre o modal com um loader
    renderSubmissionsModal(true, []);
    
    try {
        const submissions = await db.getUserSubmissionsForAdmin(userId, 'rejected'); //
        adminState.selectedUserSubmissions = submissions;
        // Re-renderiza o modal com os dados
        renderSubmissionsModal(false, submissions);
    } catch (error) {
        showToast(`Error fetching user submissions: ${error.message}`, 'error');
        renderSubmissionsModal(false, [], true); // Renderiza com erro
    }
};

// Nova função para fechar o modal
const closeSubmissionsModal = () => {
    adminState.isSubmissionsModalOpen = false;
    adminState.selectedUserSubmissions = [];
    adminState.selectedWallet = null;
    const modal = document.getElementById('admin-user-modal');
    if (modal) modal.remove();
    document.body.style.overflow = 'auto';
};

// --- (FIM) NOVOS HANDLERS ---

// ==========================================================
//  INÍCIO DAS NOVAS FUNÇÕES (MODAL DE PERFIL "CPT")
// ==========================================================

/**
 * Handler para ABRIR o modal de perfil do usuário.
 * É chamado quando o admin clica no link da carteira na tabela.
 */
const handleViewUserProfile = (e) => {
    const link = e.target.closest('.user-profile-link');
    if (!link) return;
    
    e.preventDefault(); // Impede que o link '#' mude a URL
    
    const userId = link.dataset.userId;
    if (!userId) return;

    // Encontra o objeto completo do usuário no estado
    const user = adminState.allUsers.find(u => u.id === userId);
    if (!user) {
        showToast("Error: Could not find user data.", "error");
        return;
    }

    // Abre o modal com os dados do usuário
    renderUserProfileModal(user);
};

/**
 * Fecha o modal de perfil do usuário.
 */
const closeUserProfileModal = () => {
    const modal = document.getElementById('admin-user-profile-modal');
    if (modal) modal.remove();
    document.body.style.overflow = 'auto';
};

// ==========================================================
//  FIM DAS NOVAS FUNÇÕES
// ==========================================================


const handleTaskFormSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    let startDate, endDate;
    try {
        startDate = new Date(form.startDate.value + 'T00:00:00Z');
        endDate = new Date(form.endDate.value + 'T23:59:59Z');
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error("Invalid date format.");
        }
        if (startDate >= endDate) {
            throw new Error("Start Date must be before End Date.");
        }
    } catch (dateError) {
        showToast(dateError.message, "error");
        return;
    }

    const taskData = {
        title: form.title.value.trim(),
        url: form.url.value.trim(),
        description: form.description.value.trim(),
        points: parseInt(form.points.value, 10),
        cooldownHours: parseInt(form.cooldown.value, 10),
        startDate: startDate,
        endDate: endDate
    };

    if (!taskData.title || !taskData.description) {
        showToast("Please fill in Title and Description.", "error");
        return;
    }
     if (taskData.points <= 0 || taskData.cooldownHours <= 0) {
        showToast("Points and Cooldown must be positive numbers.", "error");
        return;
    }
     if (taskData.url && !taskData.url.startsWith('http')) {
         showToast("URL must start with http:// or https://", "error");
         return;
     }


    if (adminState.editingTask && adminState.editingTask.id) {
        taskData.id = adminState.editingTask.id;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    const tempLoaderSpan = document.createElement('span');
    tempLoaderSpan.classList.add('inline-block');
    renderLoading(tempLoaderSpan);
    submitButton.innerHTML = '';
    submitButton.appendChild(tempLoaderSpan);


    try {
        await db.addOrUpdateDailyTask(taskData); //
        showToast(`Task ${taskData.id ? 'updated' : 'created'} successfully!`, 'success');
        form.reset();
        adminState.editingTask = null;
        // Recarrega todos os dados, o que re-renderiza a aba de tasks
        loadAdminData(); 
    } catch (error) {
        showToast(`Failed to save task: ${error.message}`, "error");
        console.error(error);
         submitButton.disabled = false;
         submitButton.innerHTML = originalButtonText;
    }
};

const handleUgcPointsSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    const newPoints = {
        'YouTube': parseInt(form.youtubePoints.value, 10),
        'YouTube Shorts': parseInt(form.youtubeShortsPoints.value, 10),
        'Instagram': parseInt(form.instagramPoints.value, 10),
        'X/Twitter': parseInt(form.xTwitterPoints.value, 10),
        'Facebook': parseInt(form.facebookPoints.value, 10),
        'Telegram': parseInt(form.telegramPoints.value, 10),
        'TikTok': parseInt(form.tiktokPoints.value, 10),
        'Reddit': parseInt(form.redditPoints.value, 10),
        'LinkedIn': parseInt(form.linkedinPoints.value, 10),
        'Other': parseInt(form.otherPoints.value, 10)
    };
    
    if (Object.values(newPoints).some(p => isNaN(p) || p < 0)) {
        showToast("All points must be positive numbers (or 0).", "error");
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    const tempLoaderSpan = document.createElement('span');
    tempLoaderSpan.classList.add('inline-block');
    renderLoading(tempLoaderSpan);
    submitButton.innerHTML = '';
    submitButton.appendChild(tempLoaderSpan);

    try {
        await db.updateUgcBasePoints(newPoints); //
        showToast("UGC Base Points updated successfully!", "success");
        adminState.ugcBasePoints = newPoints;
    } catch (error) {
        showToast(`Failed to update points: ${error.message}`, "error");
        console.error(error);
    } finally {
        if(document.body.contains(submitButton)) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }
};


const handleEditTask = (taskId) => {
    const task = adminState.dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    adminState.editingTask = task;
    renderManageTasksPanel();
};

const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task permanently?")) return;
    try {
        await db.deleteDailyTask(taskId); //
        showToast("Task deleted.", "success");
        adminState.editingTask = null;
        loadAdminData(); // Recarrega tudo
    } catch (error) {
        showToast(`Failed to delete task: ${error.message}`, "error");
        console.error(error);
    }
};

// --- ADMIN RENDER FUNCTIONS ---

// --- (INÍCIO) NOVAS FUNÇÕES DE RENDERIZAÇÃO ---

// Nova função helper para renderizar o MODAL
function renderSubmissionsModal(isLoading, submissions, isError = false) {
     // Remove modal antigo se existir
     const oldModal = document.getElementById('admin-user-modal');
     if (oldModal) oldModal.remove();
     
     document.body.style.overflow = 'hidden';
     
     let contentHtml = '';
     if (isLoading) {
         contentHtml = '<div class="p-8"></div>'; // Placeholder para renderLoading
     } else if (isError) {
         contentHtml = '<p class="text-red-400 text-center p-8">Failed to load submissions.</p>';
     } else if (submissions.length === 0) {
         contentHtml = '<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>';
     } else {
         // NOTA: A paginação não foi solicitada para *dentro* do modal,
         // então isso ainda lista todas as submissões rejeitadas do usuário.
         contentHtml = `
             <table class="w-full text-left min-w-[600px]">
                 <thead>
                     <tr class="border-b border-border-color text-xs text-zinc-400 uppercase">
                         <th class="p-3">Link</th>
                         <th class="p-3">Resolved</th>
                         <th class="p-3 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody id="modal-submissions-tbody">
                     ${submissions.map(item => `
                         <tr class="border-b border-border-color hover:bg-zinc-800/50">
                             <td class="p-3 text-sm max-w-xs truncate" title="${item.url}">
                                 <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${item.url}</a>
                             </td>
                             <td class="p-3 text-xs">${item.resolvedAt ? item.resolvedAt.toLocaleString('en-US') : 'N/A'}</td>
                             <td class="p-3 text-right">
                                 <button data-user-id="${item.userId}" 
                                         data-submission-id="${item.submissionId}" 
                                         class="re-approve-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                                     <i class="fa-solid fa-check"></i> Re-Approve
                                 </button>
                             </td>
                         </tr>
                     `).join('')}
                 </tbody>
             </table>
         `;
     }

     const modalHtml = `
         <div id="admin-user-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">Rejected Posts for ${formatAddress(adminState.selectedWallet)}</h2>
                     <button id="close-admin-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 <div class="p-6 overflow-y-auto">
                     ${contentHtml}
                 </div>
             </div>
         </div>
     `;
     
     document.body.insertAdjacentHTML('beforeend', modalHtml);
     
     if (isLoading) {
         const loaderTarget = document.getElementById('admin-user-modal').querySelector('.p-8');
         if(loaderTarget) renderLoading(loaderTarget);
     }
     
     // Add Listeners
     document.getElementById('close-admin-modal-btn')?.addEventListener('click', closeSubmissionsModal);
     document.getElementById('modal-submissions-tbody')?.addEventListener('click', handleReApproveAction);
}

// ==========================================================
//  INÍCIO DA NOVA FUNÇÃO (MODAL DE PERFIL "CPT")
// ==========================================================

/**
 * Renderiza o modal de PERFIL DO USUÁRIO (o "CPT").
 * @param {object} user - O objeto completo do usuário vindo do adminState.allUsers.
 */
function renderUserProfileModal(user) {
     // Remove modal antigo se existir
     const oldModal = document.getElementById('admin-user-profile-modal');
     if (oldModal) oldModal.remove();
     
     document.body.style.overflow = 'hidden';
     
     // Define o status visual do usuário
     const statusHtml = user.isBanned
        ? `<span class="text-xs font-bold py-1 px-3 rounded-full bg-red-600 text-white">BANNED</span>`
        : (user.hasPendingAppeal
            ? `<span class="text-xs font-bold py-1 px-3 rounded-full bg-yellow-600 text-white">APPEALING</span>`
            : `<span class="text-xs font-bold py-1 px-3 rounded-full bg-green-600 text-white">ACTIVE</span>`);

     const modalHtml = `
         <div id="admin-user-profile-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">User Profile</h2>
                     <button id="close-admin-profile-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 
                 <div class="p-6 overflow-y-auto space-y-4">
                    
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-zinc-100">${formatAddress(user.walletAddress)}</h3>
                        ${statusHtml}
                    </div>

                    <div class="bg-main p-4 rounded-lg border border-border-color space-y-3">
                        <div class="flex flex-wrap justify-between gap-2">
                            <span class="text-sm text-zinc-400">Full Wallet:</span>
                            <span class="text-sm text-zinc-200 font-mono break-all">${user.walletAddress || 'N/A'}</span>
                        </div>
                        <div class="flex flex-wrap justify-between gap-2">
                            <span class="text-sm text-zinc-400">User ID:</span>
                            <span class="text-sm text-zinc-200 font-mono break-all">${user.id || 'N/A'}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-main p-4 rounded-lg border border-border-color text-center">
                            <span class="block text-xs text-zinc-400 uppercase">Total Points</span>
                            <span class="block text-2xl font-bold text-yellow-400">${(user.totalPoints || 0).toLocaleString('en-US')}</span>
                        </div>
                        <div class="bg-main p-4 rounded-lg border border-border-color text-center">
                            <span class="block text-xs text-zinc-400 uppercase">Approved</span>
                            <span class="block text-2xl font-bold text-green-400">${(user.approvedSubmissionsCount || 0).toLocaleString('en-US')}</span>
                        </div>
                         <div class="bg-main p-4 rounded-lg border border-border-color text-center">
                            <span class="block text-xs text-zinc-400 uppercase">Rejected</span>
                            <span class="block text-2xl font-bold text-red-400">${(user.rejectedCount || 0).toLocaleString('en-US')}</span>
                        </div>
                    </div>

                    <div class="border-t border-border-color pt-4 text-right">
                        <p class="text-sm text-zinc-500 italic text-left">User actions (Ban, Unban, View Rejected) are available in the main table.</p>
                    </div>

                 </div>
             </div>
         </div>
     `;
     
     document.body.insertAdjacentHTML('beforeend', modalHtml);
     
     // Adiciona Listener para fechar
     document.getElementById('close-admin-profile-modal-btn')?.addEventListener('click', closeUserProfileModal);
}
// ==========================================================
//  FIM DA NOVA FUNÇÃO
// ==========================================================


// --- (INÍCIO) NOVOS HANDLERS DE FILTRO E PAGINAÇÃO ---

const handleUsersFilterChange = (e) => {
    const btn = e.target.closest('.user-filter-btn');
    if (!btn || btn.classList.contains('active')) return;
    
    adminState.usersFilter = btn.dataset.filter || 'all';
    adminState.usersPage = 1; // Reseta para a primeira página
    renderManageUsersPanel(); // Re-renderiza a aba
};

const handleUsersSearch = (e) => {
    adminState.usersSearch = e.target.value; // Salva o valor "sujo" (com ':', etc.)
    adminState.usersPage = 1; // Reseta para a primeira página
    renderManageUsersPanel(); // Re-renderiza
};

const handleUsersPageChange = (newPage) => {
    adminState.usersPage = newPage;
    renderManageUsersPanel(); // Re-renderiza a aba
};

// NOVO HANDLER PARA PAGINAÇÃO DE SUBMISSIONS
const handleSubmissionsPageChange = (newPage) => {
    adminState.submissionsPage = newPage;
    renderSubmissionsPanel(); // Re-renderiza a aba
};

// NOVO HANDLER PARA PAGINAÇÃO DE TASKS
const handleTasksPageChange = (newPage) => {
    adminState.tasksPage = newPage;
    renderManageTasksPanel(); // Re-renderiza a aba
};

// --- (FIM) NOVOS HANDLERS DE FILTRO E PAGINAÇÃO ---


// ATUALIZADO: Nova função para renderizar a aba "MANAGE USERS" (com filtros e paginação)
const renderManageUsersPanel = () => {
    const container = document.getElementById('manage-users-content');
    if (!container) return;
    
    const allUsers = adminState.allUsers;
    
    if (!allUsers) {
         renderNoData(container, 'Loading users...');
         return;
    }
    
    // --- Lógica de Filtro e Busca ---
    
    // CORREÇÃO 1: Limpa a string de busca para o filtro
    // Remove caracteres não-alfanuméricos, exceto 'x' (para '0x')
    const rawSearch = adminState.usersSearch || '';
    const searchQuery = rawSearch.toLowerCase().trim().replace(/[^a-z0-9x]/g, '');
    
    const filterType = adminState.usersFilter;

    let filteredUsers = allUsers;

    // 1. Filtro de Busca (Wallet ou User ID)
    if (searchQuery) {
        filteredUsers = filteredUsers.filter(u => 
            // ==========================================================
            //  INÍCIO DA CORREÇÃO (Linha 631)
            // ==========================================================
            // Adiciona '?.' (optional chaining) para evitar crash se 
            // u.walletAddress ou u.id forem nulos
            (u.walletAddress?.toLowerCase().includes(searchQuery)) || 
            (u.id?.toLowerCase().includes(searchQuery))
            // ==========================================================
            //  FIM DA CORREÇÃO
            // ==========================================================
        );
    }

    // 2. Filtro de Status (Banned / Appealing)
    if (filterType === 'banned') {
        filteredUsers = filteredUsers.filter(u => u.isBanned);
    } else if (filterType === 'appealing') {
        // ASSUMINDO: 'hasPendingAppeal' vem do DB
        filteredUsers = filteredUsers.filter(u => u.hasPendingAppeal === true); 
    }
    
    // --- Estatísticas ---
    const totalCount = allUsers.length;
    const bannedCount = allUsers.filter(u => u.isBanned).length;
    const appealingCount = allUsers.filter(u => u.hasPendingAppeal === true).length;
    
    // --- Lógica de Ordenação ---
    // Prioridade: 1. Apelações, 2. Banidos, 3. Pontos
    const sortedUsers = filteredUsers.sort((a, b) => {
        if (a.hasPendingAppeal !== b.hasPendingAppeal) {
            return a.hasPendingAppeal ? -1 : 1; // Apelações primeiro
        }
        if (a.isBanned !== b.isBanned) {
            return a.isBanned ? -1 : 1; // Banidos depois
        }
        return (b.totalPoints || 0) - (a.totalPoints || 0); // Depois por pontos
    });

    // --- Lógica de Paginação ---
    const page = adminState.usersPage;
    const perPage = adminState.usersPerPage; // Agora é 100
    const totalFilteredCount = sortedUsers.length;
    const totalPages = Math.ceil(totalFilteredCount / perPage);
    const start = (page - 1) * perPage;
    const end = page * perPage;
    
    const paginatedUsers = sortedUsers.slice(start, end);

    // --- Renderização do HTML ---
    
    const usersHtml = paginatedUsers.length > 0 ? paginatedUsers.map(user => {
        let rowClass = 'border-b border-border-color hover:bg-zinc-800/50';
        let statusTag = '';

        if (user.hasPendingAppeal) {
            rowClass += ' bg-yellow-900/40'; // Destaque para apelação
            statusTag = '<span class="ml-2 text-xs font-bold text-yellow-300">[APPEALING]</span>';
        } else if (user.isBanned) {
            rowClass += ' bg-red-900/30 opacity-70';
            statusTag = '<span class="ml-2 text-xs font-bold text-red-400">[BANNED]</span>';
        }

        return `
        <tr class="${rowClass}">
            <td class="p-3 text-xs text-zinc-300 font-mono" title="User ID: ${user.id}">
                <a href="#" class="user-profile-link font-bold text-blue-400 hover:underline" 
                   data-user-id="${user.id}" 
                   title="Click to view profile. Full Wallet: ${user.walletAddress || 'N/A'}">
                    ${formatAddress(user.walletAddress)}
                </a>
                ${statusTag}
            </td>
            <td class="p-3 text-sm font-bold text-yellow-400">${(user.totalPoints || 0).toLocaleString('en-US')}</td>
            <td class="p-3 text-sm font-bold ${user.rejectedCount > 0 ? 'text-red-400' : 'text-zinc-400'}">${user.rejectedCount || 0}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    ${user.hasPendingAppeal 
                        ? /* Se está apelando, mostra botões de resolver */
                          `<button data-user-id="${user.id}" data-action="approve" 
                                   class="resolve-appeal-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-check"></i> Approve
                           </button>
                           <button data-user-id="${user.id}" data-action="deny" 
                                   class="resolve-appeal-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-times"></i> Deny
                           </button>`
                        : /* Se não está apelando, mostra botões de ban/unban */
                          `<button data-user-id="${user.id}" data-wallet="${user.walletAddress}" 
                                   class="view-rejected-btn bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-eye"></i> View Rejected
                           </button>
                           ${user.isBanned 
                                ? `<button data-user-id="${user.id}" data-action="unban" 
                                            class="ban-user-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                                       <i class="fa-solid fa-check"></i> Unban
                                   </button>`
                                : `<button data-user-id="${user.id}" data-action="ban" 
                                            class="ban-user-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">
                                       <i class="fa-solid fa-ban"></i> Ban
                                   </button>`
                           }`
                    }
                </div>
            </td>
        </tr>
    `}).join('') : `
        <tr>
            <td colspan="4" class="p-8 text-center text-zinc-400">
                ${totalCount === 0 ? 'No users found in Airdrop.' : 'No users match the current filters.'}
            </td>
        </tr>
    `;

    container.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-bold">Users (${totalCount})</h2>
            <button id="export-users-csv-btn" class="bg-zinc-700 hover:bg-zinc-600 text-white text-xs py-1.5 px-3 rounded-lg transition-colors">
                <i class="fa-solid fa-file-csv mr-1"></i>Export CSV
            </button>
        </div>

        <div class="mb-4 p-4 bg-zinc-800 rounded-xl border border-border-color flex flex-wrap gap-4 justify-between items-center">
            <div id="user-filters-nav" class="flex items-center gap-2">
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${filterType === 'all' ? 'bg-blue-600 text-white font-bold' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}" data-filter="all">
                    All (${totalCount})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${filterType === 'banned' ? 'bg-red-600 text-white font-bold' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}" data-filter="banned">
                    Banned (${bannedCount})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${filterType === 'appealing' ? 'bg-yellow-600 text-white font-bold' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}" data-filter="appealing">
                    Appealing (${appealingCount})
                </button>
            </div>
            <div class="relative flex-grow max-w-xs">
                <input type="text" id="user-search-input" class="form-input pl-10" placeholder="Search Wallet or User ID..." value="${adminState.usersSearch}">
                <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"></i>
            </div>
        </div>

        <div class="bg-zinc-800 rounded-xl border border-border-color overflow-x-auto">
            <table class="w-full text-left min-w-[700px]">
                <thead>
                    <tr class="bg-main border-b border-border-color text-xs text-zinc-400 uppercase">
                        <th class="p-3">Wallet / User ID</th>
                        <th class="p-3">Total Points</th>
                        <th class="p-3">Rejections</th>
                        <th class="p-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody id="admin-users-tbody">${usersHtml}</tbody>
            </table>
        </div>
        
        <div id="admin-users-pagination" class="mt-6"></div>
    `;
    
    // Renderiza controles de paginação (se necessário)
    const paginationContainer = document.getElementById('admin-users-pagination');
    if (paginationContainer && totalPages > 1) {
        // ### CORREÇÃO 2/4: Chamando a função CORRETA ###
        renderPaginationControls(paginationContainer, adminState.usersPage, totalPages, handleUsersPageChange);
    }
    
    // CSV Export button
    document.getElementById('export-users-csv-btn')?.addEventListener('click', handleExportUsersCSV);

    // Listener da Tabela (Delegado)
    document.getElementById('admin-users-tbody')?.addEventListener('click', (e) => {
        // ==========================================================
        // INÍCIO DA ATUALIZAÇÃO (Listener do Link de Perfil)
        // ==========================================================
        if (e.target.closest('.user-profile-link')) {
            handleViewUserProfile(e);
        }
        // ==========================================================
        // FIM DA ATUALIZAÇÃO
        // ==========================================================
        
        if (e.target.closest('.ban-user-btn')) handleBanUser(e);
        if (e.target.closest('.view-rejected-btn')) handleViewRejected(e);
        if (e.target.closest('.resolve-appeal-btn')) handleResolveAppeal(e);
    });
    
    // Listener dos Filtros (Delegado)
    document.getElementById('user-filters-nav')?.addEventListener('click', handleUsersFilterChange);
    
    // Listener da Busca (Debounced)
    const searchInput = document.getElementById('user-search-input');
    if (searchInput) {
         let searchTimeout;
         // CORREÇÃO 2: Mudar de 'input' para 'keyup' para garantir que o evento dispare
         searchInput.addEventListener('keyup', (e) => { 
             clearTimeout(searchTimeout);
             // Debounce para não re-renderizar a cada tecla
             searchTimeout = setTimeout(() => handleUsersSearch(e), 300); 
         });
    }
};

// --- (FIM) NOVAS FUNÇÕES DE RENDERIZAÇÃO ---


const renderUgcPointsPanel = () => {
    const container = document.getElementById('manage-ugc-points-content');
    if (!container) return;

    const points = adminState.ugcBasePoints;
    if (!points) {
        renderLoading(container);
        return;
    }

    const defaults = {
        'YouTube': 5000,
        'YouTube Shorts': 2500,
        'Instagram': 3000,
        'X/Twitter': 1500,
        'Facebook': 2000,
        'Telegram': 1000,
        'TikTok': 3500,
        'Reddit': 1800,
        'LinkedIn': 2200,
        'Other': 1000
    };

    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">Manage UGC Base Points</h2>
        <p class="text-sm text-zinc-400 mb-6 max-w-2xl mx-auto">
            Defina os pontos base concedidos para cada plataforma de divulgação (UGC). 
            Este valor será "exportado" para a página do airdrop e é o valor usado 
            <strong>antes</strong> do multiplicador do usuário ser aplicado.
        </p>
        <form id="ugcPointsForm" class="bg-zinc-800 p-6 rounded-xl space-y-4 border border-border-color max-w-lg mx-auto">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">YouTube:</label>
                    <input type="number" name="youtubePoints" class="form-input" value="${points['YouTube'] !== undefined ? points['YouTube'] : defaults['YouTube']}" required>
                </div>
                 <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">YouTube Shorts:</label>
                    <input type="number" name="youtubeShortsPoints" class="form-input" value="${points['YouTube Shorts'] !== undefined ? points['YouTube Shorts'] : defaults['YouTube Shorts']}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Instagram:</label>
                    <input type="number" name="instagramPoints" class="form-input" value="${points['Instagram'] !== undefined ? points['Instagram'] : defaults['Instagram']}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">TikTok:</label>
                    <input type="number" name="tiktokPoints" class="form-input" value="${points['TikTok'] !== undefined ? points['TikTok'] : defaults['TikTok']}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">X/Twitter:</label>
                    <input type="number" name="xTwitterPoints" class="form-input" value="${points['X/Twitter'] !== undefined ? points['X/Twitter'] : defaults['X/Twitter']}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Facebook:</label>
                    <input type="number" name="facebookPoints" class="form-input" value="${points['Facebook'] !== undefined ? points['Facebook'] : defaults['Facebook']}" required>
                </div>
            </div>

             <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Reddit:</label>
                    <input type="number" name="redditPoints" class="form-input" value="${points['Reddit'] !== undefined ? points['Reddit'] : defaults['Reddit']}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">LinkedIn:</label>
                    <input type="number" name="linkedinPoints" class="form-input" value="${points['LinkedIn'] !== undefined ? points['LinkedIn'] : defaults['LinkedIn']}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Telegram:</label>
                    <input type="number" name="telegramPoints" class="form-input" value="${points['Telegram'] !== undefined ? points['Telegram'] : defaults['Telegram']}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Other Platform:</label>
                    <input type="number" name="otherPoints" class="form-input" value="${points['Other'] !== undefined ? points['Other'] : defaults['Other']}" required>
                </div>
            </div>
            
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors shadow-md mt-6">
                <i class="fa-solid fa-save mr-2"></i>Save Base Points
            </button>
        </form>
    `;
    
    // Anexa listener ao formulário
    document.getElementById('ugcPointsForm')?.addEventListener('submit', handleUgcPointsSubmit);
};


// ATUALIZADO: renderManageTasksPanel (com Paginação)
const renderManageTasksPanel = () => {
    const container = document.getElementById('manage-tasks-content');
    if (!container) return;

    const task = adminState.editingTask;
    const isEditing = !!task;

    const formatDate = (dateValue) => {
        if (!dateValue) return '';
        try {
            const d = (dateValue.toDate) ? dateValue.toDate() : (dateValue instanceof Date) ? dateValue : new Date(dateValue);
            return d.toISOString().split('T')[0];
        } catch (e) { return ''; }
    }
    
    // --- Lógica de Paginação para Tasks ---
    const page = adminState.tasksPage;
    const perPage = adminState.tasksPerPage; // 100

    // Ordena (mais recentes primeiro)
    const sortedTasks = [...adminState.dailyTasks].sort((a, b) => {
        const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
        const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);
        return dateB.getTime() - dateA.getTime();
    });

    const totalTasks = sortedTasks.length;
    const totalPages = Math.ceil(totalTasks / perPage);
    const start = (page - 1) * perPage;
    const end = page * perPage;
    
    const paginatedTasks = sortedTasks.slice(start, end);
    
    const tasksListHtml = paginatedTasks.length > 0 ? paginatedTasks.map(t => {
        const now = new Date();
        const startDate = t.startDate?.toDate ? t.startDate.toDate() : (t.startDate ? new Date(t.startDate) : null);
        const endDate = t.endDate?.toDate ? t.endDate.toDate() : (t.endDate ? new Date(t.endDate) : null);
        
        let statusColor = "text-zinc-500";
        if (startDate && endDate) {
            if (now >= startDate && now <= endDate) statusColor = "text-green-400";
            else if (now < startDate) statusColor = "text-blue-400";
        }

        return `
        <div class="bg-zinc-800 p-4 rounded-lg border border-border-color flex justify-between items-center flex-wrap gap-3">
            <div class="flex-1 min-w-[250px]">
                <p class="font-semibold text-white">${t.title || 'No Title'}</p>
                 <p class="text-xs text-zinc-400 mt-0.5">${t.description || 'No Description'}</p>
                <p class="text-xs ${statusColor} mt-1">
                   <span class="font-medium text-amber-400">${t.points || 0} Pts</span> |
                   <span class="text-blue-400">${t.cooldownHours || 0}h CD</span> |
                   Active: ${formatDate(t.startDate)} to ${formatDate(t.endDate)}
                </p>
                ${t.url ? `<a href="${t.url}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-400 hover:underline break-all block mt-1">${t.url}</a>` : ''}
            </div>
            <div class="flex gap-2 shrink-0">
                <button data-id="${t.id}" data-action="edit" class="edit-task-btn bg-amber-600 hover:bg-amber-700 text-black text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-pencil mr-1"></i>Edit</button>
                <button data-id="${t.id}" data-action="delete" class="delete-task-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-trash mr-1"></i>Delete</button>
            </div>
        </div>
    `}).join('') :
    (() => {
        const tempDiv = document.createElement('div');
        renderNoData(tempDiv, "No tasks created yet.");
        return tempDiv.innerHTML;
    })();
    // --- Fim da lógica de Paginação ---


    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">${isEditing ? 'Edit Daily Task' : 'Create New Daily Task'}</h2>

        <form id="taskForm" class="bg-zinc-800 p-6 rounded-xl space-y-4 border border-border-color">
            <input type="hidden" name="id" value="${task?.id || ''}">
            <div><label class="block text-sm font-medium mb-1 text-zinc-300">Task Title:</label><input type="text" name="title" class="form-input" value="${task?.title || ''}" required></div>
            <div><label class="block text-sm font-medium mb-1 text-zinc-300">Description:</label><input type="text" name="description" class="form-input" value="${task?.description || ''}" required></div>
            <div><label class="block text-sm font-medium mb-1 text-zinc-300">Link URL (Optional):</label><input type="url" name="url" class="form-input" value="${task?.url || ''}" placeholder="https://..."></div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">Points (Base):</label><input type="number" name="points" class="form-input" value="${task?.points || 10}" min="1" required></div>
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">Cooldown (Hours):</label><input type="number" name="cooldown" class="form-input" value="${task?.cooldownHours || 24}" min="1" required></div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">Start Date (UTC):</label><input type="date" name="startDate" class="form-input" value="${formatDate(task?.startDate)}" required></div>
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">End Date (UTC):</label><input type="date" name="endDate" class="form-input" value="${formatDate(task?.endDate)}" required></div>
            </div>

            <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md transition-colors shadow-md">
                ${isEditing ? '<i class="fa-solid fa-save mr-2"></i>Save Changes' : '<i class="fa-solid fa-plus mr-2"></i>Create Task'}
            </button>
            ${isEditing ? `<button type="button" id="cancelEditBtn" class="w-full mt-2 bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 rounded-md transition-colors">Cancel Edit</button>` : ''}
        </form>

        <h3 class="text-xl font-bold mt-10 mb-4 border-t border-border-color pt-6">Existing Tasks (${totalTasks})</h3>
        <div id="existing-tasks-list" class="space-y-3">
            ${tasksListHtml}
        </div>
        <div id="admin-tasks-pagination" class="mt-6"></div>
    `;

    // Renderiza paginação de Tasks
    const paginationContainer = document.getElementById('admin-tasks-pagination');
    if (paginationContainer && totalPages > 1) {
        // ### CORREÇÃO 3/4: Chamando a função CORRETA ###
        renderPaginationControls(paginationContainer, adminState.tasksPage, totalPages, handleTasksPageChange);
    }

    // Anexa listeners
    document.getElementById('taskForm')?.addEventListener('submit', handleTaskFormSubmit);
    document.getElementById('cancelEditBtn')?.addEventListener('click', () => { adminState.editingTask = null; renderManageTasksPanel(); });

    // Listener delegado para a lista de tarefas
    document.getElementById('existing-tasks-list')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-id]');
        if (!btn) return;
        const taskId = btn.dataset.id;
        if (btn.dataset.action === 'edit') handleEditTask(taskId);
        if (btn.dataset.action === 'delete') handleDeleteTask(taskId);
    });
};


// ENHANCED: renderSubmissionsPanel (Platform Filter + Bulk Actions + Improved Rows)
const renderSubmissionsPanel = () => {
    const container = document.getElementById('submissions-content');
    if (!container) return;

    // Clear selection when re-rendering
    adminState.selectedSubmissions.clear();

    if (!adminState.allSubmissions || adminState.allSubmissions.length === 0) {
        const tempDiv = document.createElement('div');
        renderNoData(tempDiv, 'No submissions currently pending audit.');
        container.innerHTML = tempDiv.innerHTML;
        return;
    }

    // Platform filter
    const platforms = [...new Set(adminState.allSubmissions.map(s => s.platform).filter(Boolean))].sort();
    const currentFilter = adminState.submissionsFilterPlatform;

    // Filtered + sorted submissions
    const filteredSubmissions = getFilteredSubmissions();

    // Pagination
    const page = adminState.submissionsPage;
    const perPage = adminState.submissionsPerPage;
    const totalFiltered = filteredSubmissions.length;
    const totalPages = Math.ceil(totalFiltered / perPage);
    const start = (page - 1) * perPage;
    const paginatedSubmissions = filteredSubmissions.slice(start, start + perPage);

    const submissionsHtml = paginatedSubmissions.map(item => `
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-center">
                <input type="checkbox" class="submission-checkbox accent-blue-500 w-4 h-4 cursor-pointer" data-id="${item.submissionId}">
            </td>
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${item.userId}">${formatAddress(item.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs" title="${item.normalizedUrl}">
                <a href="${item.normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${truncateUrl(item.normalizedUrl)}</a>
                <span class="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                    <i class="${getPlatformIcon(item.platform)} text-[10px]"></i>${item.platform || 'Other'}
                    <span class="text-zinc-600">|</span>
                    ${item.basePoints || 0} pts
                </span>
            </td>
            <td class="p-3 text-xs text-zinc-400" title="${item.submittedAt ? item.submittedAt.toLocaleString('en-US') : ''}">${getTimeAgo(item.submittedAt)}</td>
            <td class="p-3 text-xs font-semibold ${statusUI[item.status]?.color || 'text-gray-500'}">${statusUI[item.status]?.text || item.status}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button data-user-id="${item.userId}" data-submission-id="${item.submissionId}" data-action="approved" class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"><i class="fa-solid fa-check"></i></button>
                    <button data-user-id="${item.userId}" data-submission-id="${item.submissionId}" data-action="rejected" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"><i class="fa-solid fa-times"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    // Platform filter pills
    const platformPillsHtml = `
        <button class="platform-filter-btn text-xs py-1.5 px-3 rounded-full transition-colors ${currentFilter === 'all' ? 'bg-blue-600 text-white font-bold' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}" data-platform="all">
            All (${adminState.allSubmissions.length})
        </button>
        ${platforms.map(p => {
            const count = adminState.allSubmissions.filter(s => s.platform === p).length;
            return `<button class="platform-filter-btn text-xs py-1.5 px-3 rounded-full transition-colors ${currentFilter === p ? 'bg-blue-600 text-white font-bold' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}" data-platform="${p}">
                <i class="${getPlatformIcon(p)} mr-1"></i>${p} (${count})
            </button>`;
        }).join('')}
    `;

    container.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-bold">Submissions (${adminState.allSubmissions.length})</h2>
            <button id="export-submissions-btn" class="bg-zinc-700 hover:bg-zinc-600 text-white text-xs py-1.5 px-3 rounded-lg transition-colors">
                <i class="fa-solid fa-file-csv mr-1"></i>Export CSV
            </button>
        </div>

        <!-- Platform Filter -->
        <div id="platform-filter-bar" class="flex flex-wrap gap-2 mb-4">${platformPillsHtml}</div>

        <!-- Bulk Action Bar -->
        <div id="bulk-action-bar" class="hidden mb-3 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg flex items-center justify-between gap-3"></div>

        <div class="bg-zinc-800 rounded-xl border border-border-color overflow-x-auto">
            <table class="w-full text-left min-w-[750px]">
                <thead>
                    <tr class="bg-main border-b border-border-color text-xs text-zinc-400 uppercase">
                        <th class="p-3 w-10 text-center"><input type="checkbox" id="select-all-checkbox" class="accent-blue-500 w-4 h-4 cursor-pointer"></th>
                        <th class="p-3 font-semibold">Wallet</th>
                        <th class="p-3 font-semibold">Link & Platform</th>
                        <th class="p-3 font-semibold">Submitted</th>
                        <th class="p-3 font-semibold">Status</th>
                        <th class="p-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody id="admin-submissions-tbody">${submissionsHtml}</tbody>
            </table>
        </div>
        <div id="admin-submissions-pagination" class="mt-6"></div>
    `;

    // Pagination
    const paginationContainer = document.getElementById('admin-submissions-pagination');
    if (paginationContainer && totalPages > 1) {
        renderPaginationControls(paginationContainer, adminState.submissionsPage, totalPages, handleSubmissionsPageChange);
    }

    // Listeners
    document.getElementById('admin-submissions-tbody')?.addEventListener('click', handleAdminAction);
    document.getElementById('export-submissions-btn')?.addEventListener('click', handleExportSubmissionsCSV);

    // Select all checkbox
    document.getElementById('select-all-checkbox')?.addEventListener('change', (e) => handleSelectAllSubmissions(e.target.checked));

    // Individual checkboxes
    document.getElementById('admin-submissions-tbody')?.addEventListener('change', (e) => {
        if (e.target.classList.contains('submission-checkbox')) {
            handleSubmissionCheckbox(e.target.dataset.id, e.target.checked);
        }
    });

    // Platform filter
    document.getElementById('platform-filter-bar')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.platform-filter-btn');
        if (!btn) return;
        adminState.submissionsFilterPlatform = btn.dataset.platform;
        adminState.submissionsPage = 1;
        adminState.selectedSubmissions.clear();
        renderSubmissionsPanel();
    });
};


// --- PLATFORM USAGE CONFIG PANEL ---
const renderPlatformUsagePanel = () => {
    const container = document.getElementById('platform-usage-content');
    if (!container) return;

    const config = adminState.platformUsageConfig || DEFAULT_PLATFORM_USAGE_CONFIG;
    
    // Calcular pontos totais possíveis
    let totalMaxPoints = 0;
    Object.values(config).forEach(action => {
        if (action.enabled !== false) {
            totalMaxPoints += (action.points || 0) * (action.maxCount || 1);
        }
    });

    const actionsHtml = Object.entries(config).map(([key, action]) => `
        <tr class="border-b border-zinc-700/50 hover:bg-zinc-800/50" data-action-key="${key}">
            <td class="p-3">
                <div class="flex items-center gap-2">
                    <span class="text-xl">${action.icon || '⚡'}</span>
                    <span class="text-white font-medium">${action.label || key}</span>
                </div>
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-20 text-amber-400 font-bold text-center" 
                       data-field="points" value="${action.points || 0}" min="0" step="100">
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-16 text-white text-center" 
                       data-field="maxCount" value="${action.maxCount || 1}" min="1" max="100">
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-16 text-white text-center" 
                       data-field="cooldownHours" value="${action.cooldownHours || 0}" min="0" max="168">
            </td>
            <td class="p-3 text-center">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer platform-toggle" data-field="enabled" ${action.enabled !== false ? 'checked' : ''}>
                    <div class="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </td>
            <td class="p-3 text-right text-xs text-zinc-400">
                ${((action.points || 0) * (action.maxCount || 1)).toLocaleString()}
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-white mb-2">Platform Usage Points Configuration</h2>
            <p class="text-zinc-400 text-sm">Configure points awarded for using platform features. Changes are saved immediately.</p>
        </div>

        <!-- Stats Summary -->
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
                <span class="text-2xl font-bold text-amber-400">${Object.keys(config).length}</span>
                <p class="text-xs text-zinc-500 mt-1">Total Actions</p>
            </div>
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
                <span class="text-2xl font-bold text-green-400">${Object.values(config).filter(a => a.enabled !== false).length}</span>
                <p class="text-xs text-zinc-500 mt-1">Enabled</p>
            </div>
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
                <span class="text-2xl font-bold text-purple-400">${totalMaxPoints.toLocaleString()}</span>
                <p class="text-xs text-zinc-500 mt-1">Max Points Possible</p>
            </div>
        </div>

        <!-- Actions Table -->
        <div class="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-zinc-900 border-b border-zinc-700 text-xs text-zinc-400 uppercase">
                        <th class="p-3 font-semibold">Action</th>
                        <th class="p-3 font-semibold">Points</th>
                        <th class="p-3 font-semibold">Max Count</th>
                        <th class="p-3 font-semibold">Cooldown (h)</th>
                        <th class="p-3 font-semibold text-center">Enabled</th>
                        <th class="p-3 font-semibold text-right">Max Total</th>
                    </tr>
                </thead>
                <tbody id="platform-usage-tbody">
                    ${actionsHtml}
                </tbody>
            </table>
        </div>

        <!-- Save Button -->
        <div class="mt-6 flex justify-end gap-3">
            <button id="reset-platform-config-btn" class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">
                <i class="fa-solid fa-rotate-left mr-2"></i>Reset to Default
            </button>
            <button id="save-platform-config-btn" class="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors">
                <i class="fa-solid fa-save mr-2"></i>Save Configuration
            </button>
        </div>

        <!-- Info Box -->
        <div class="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <h4 class="text-blue-400 font-bold mb-2"><i class="fa-solid fa-info-circle mr-2"></i>How It Works</h4>
            <ul class="text-zinc-400 text-sm space-y-1">
                <li>• <strong>Points:</strong> Amount awarded per action</li>
                <li>• <strong>Max Count:</strong> Maximum times a user can earn points for this action</li>
                <li>• <strong>Cooldown:</strong> Hours between earning points (0 = no cooldown)</li>
                <li>• <strong>Enabled:</strong> Toggle to enable/disable this action</li>
                <li>• Points are tracked with transaction hashes to prevent fraud</li>
            </ul>
        </div>
    `;

    // Attach event listeners
    const tbody = document.getElementById('platform-usage-tbody');
    tbody?.addEventListener('input', handlePlatformConfigChange);
    tbody?.addEventListener('change', handlePlatformConfigChange);
    
    document.getElementById('save-platform-config-btn')?.addEventListener('click', handleSavePlatformConfig);
    document.getElementById('reset-platform-config-btn')?.addEventListener('click', handleResetPlatformConfig);
};

// Handle changes to platform config inputs
const handlePlatformConfigChange = (e) => {
    const input = e.target;
    if (!input.classList.contains('platform-input') && !input.classList.contains('platform-toggle')) return;
    
    const row = input.closest('tr');
    const actionKey = row?.dataset.actionKey;
    const field = input.dataset.field;
    
    if (!actionKey || !field) return;
    
    // Update local state
    if (!adminState.platformUsageConfig[actionKey]) {
        adminState.platformUsageConfig[actionKey] = { ...DEFAULT_PLATFORM_USAGE_CONFIG[actionKey] };
    }
    
    if (field === 'enabled') {
        adminState.platformUsageConfig[actionKey].enabled = input.checked;
    } else {
        adminState.platformUsageConfig[actionKey][field] = parseInt(input.value) || 0;
    }
    
    // Update max total display
    const action = adminState.platformUsageConfig[actionKey];
    const maxTotalCell = row.querySelector('td:last-child');
    if (maxTotalCell) {
        maxTotalCell.textContent = ((action.points || 0) * (action.maxCount || 1)).toLocaleString();
    }
};

// Save platform config to Firebase
const handleSavePlatformConfig = async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
    
    try {
        await db.savePlatformUsageConfig(adminState.platformUsageConfig);
        showToast("✅ Platform Usage config saved!", "success");
        
        // Re-render to update stats
        renderPlatformUsagePanel();
    } catch (error) {
        console.error("Error saving platform config:", error);
        showToast("Failed to save config: " + error.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
};

// Reset platform config to defaults
const handleResetPlatformConfig = async () => {
    if (!confirm("Are you sure you want to reset to default values? This will save immediately.")) {
        return;
    }
    
    try {
        adminState.platformUsageConfig = { ...DEFAULT_PLATFORM_USAGE_CONFIG };
        await db.savePlatformUsageConfig(adminState.platformUsageConfig);
        showToast("✅ Config reset to defaults!", "success");
        renderPlatformUsagePanel();
    } catch (error) {
        console.error("Error resetting platform config:", error);
        showToast("Failed to reset config: " + error.message, "error");
    }
};


// --- SETTINGS ACCORDION PANEL ---

const renderSettingsPanel = () => {
    const container = document.getElementById('settings-content');
    if (!container) return;

    const openSection = adminState.settingsOpenSection;

    const sections = [
        { id: 'ugc-points', title: 'UGC Base Points', icon: 'fa-solid fa-coins text-yellow-400', contentId: 'manage-ugc-points-content' },
        { id: 'daily-tasks', title: 'Daily Tasks', icon: 'fa-solid fa-list-check text-green-400', contentId: 'manage-tasks-content' },
        { id: 'platform-usage', title: 'Platform Usage', icon: 'fa-solid fa-gamepad text-purple-400', contentId: 'platform-usage-content' },
    ];

    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">Settings</h2>
        <div class="space-y-3">
            ${sections.map(s => `
                <div class="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
                    <button class="settings-accordion-btn w-full flex items-center justify-between p-4 hover:bg-zinc-700/50 transition-colors" data-section="${s.id}">
                        <span class="flex items-center gap-3">
                            <i class="${s.icon}"></i>
                            <span class="font-semibold text-white">${s.title}</span>
                        </span>
                        <i class="fa-solid ${openSection === s.id ? 'fa-chevron-up' : 'fa-chevron-down'} text-zinc-400 transition-transform"></i>
                    </button>
                    <div class="settings-accordion-body ${openSection === s.id ? '' : 'hidden'}" data-section="${s.id}">
                        <div class="border-t border-zinc-700 p-4">
                            <div id="${s.contentId}"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Render open section content
    if (openSection === 'ugc-points') renderUgcPointsPanel();
    else if (openSection === 'daily-tasks') renderManageTasksPanel();
    else if (openSection === 'platform-usage') renderPlatformUsagePanel();

    // Accordion toggle listeners
    container.querySelectorAll('.settings-accordion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.section;
            if (adminState.settingsOpenSection === sectionId) {
                // Close current
                adminState.settingsOpenSection = null;
            } else {
                adminState.settingsOpenSection = sectionId;
            }
            renderSettingsPanel();
        });
    });
};

// --- MAIN ADMIN PANEL ---
const renderAdminPanel = () => {
    const adminContent = document.getElementById('admin-content-wrapper');
    if (!adminContent) return;

    const pendingCount = adminState.allSubmissions.length;
    const tab = adminState.activeTab;

    adminContent.innerHTML = `
        <h1 class="text-3xl font-bold mb-6">Admin Panel</h1>

        <div class="border-b border-border-color mb-6">
            <nav id="admin-tabs" class="-mb-px flex flex-wrap gap-x-6 gap-y-2">
                <button class="tab-btn ${tab === 'overview' ? 'active' : ''}" data-target="overview">
                    <i class="fa-solid fa-gauge-high mr-1.5"></i>Overview
                </button>
                <button class="tab-btn ${tab === 'review-submissions' ? 'active' : ''}" data-target="review-submissions">
                    <i class="fa-solid fa-list-check mr-1.5"></i>Submissions${pendingCount > 0 ? ` <span class="ml-1 text-xs bg-amber-600 text-white px-1.5 py-0.5 rounded-full">${pendingCount}</span>` : ''}
                </button>
                <button class="tab-btn ${tab === 'manage-users' ? 'active' : ''}" data-target="manage-users">
                    <i class="fa-solid fa-users mr-1.5"></i>Users
                </button>
                <button class="tab-btn ${tab === 'settings' ? 'active' : ''}" data-target="settings">
                    <i class="fa-solid fa-gear mr-1.5"></i>Settings
                </button>
            </nav>
        </div>

        <div id="overview_tab" class="tab-content ${tab === 'overview' ? 'active' : ''}">
            <div id="overview-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="review_submissions_tab" class="tab-content ${tab === 'review-submissions' ? 'active' : ''}">
            <div id="submissions-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_users_tab" class="tab-content ${tab === 'manage-users' ? 'active' : ''}">
            <div id="manage-users-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="settings_tab" class="tab-content ${tab === 'settings' ? 'active' : ''}">
            <div id="settings-content" class="max-w-4xl mx-auto"></div>
        </div>
    `;

    // Render active tab content
    const renderTab = (tabId) => {
        if (tabId === 'overview') renderOverviewPanel();
        else if (tabId === 'review-submissions') renderSubmissionsPanel();
        else if (tabId === 'manage-users') renderManageUsersPanel();
        else if (tabId === 'settings') renderSettingsPanel();
    };
    renderTab(tab);

    // Tab click handler
    const adminTabs = document.getElementById('admin-tabs');
    if (adminTabs && !adminTabs._listenerAttached) {
        adminTabs.addEventListener('click', (e) => {
            const button = e.target.closest('.tab-btn');
            if (!button || button.classList.contains('active')) return;
            const targetId = button.dataset.target;
            adminState.activeTab = targetId;

            // Reset filters when leaving tabs
            if (targetId !== 'manage-users') {
                adminState.usersPage = 1;
                adminState.usersFilter = 'all';
                adminState.usersSearch = '';
            }
            if (targetId !== 'review-submissions') {
                adminState.submissionsPage = 1;
                adminState.submissionsFilterPlatform = 'all';
                adminState.selectedSubmissions.clear();
            }

            document.querySelectorAll('#admin-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            adminContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            const targetTabElement = document.getElementById(targetId.replace(/-/g, '_') + '_tab');
            if (targetTabElement) {
                targetTabElement.classList.add('active');
                renderTab(targetId);
            }
        });
        adminTabs._listenerAttached = true;
    }
};


export const AdminPage = {
    render() {
        const adminContainer = document.getElementById('admin');
        if (!adminContainer) return;

        // Verifica se a carteira é admin (usando variável de ambiente)
        if (!isAdminWallet()) {
            adminContainer.innerHTML = `<div class="text-center text-red-400 p-8 bg-sidebar border border-red-500/50 rounded-lg">Access Denied. This page is restricted to administrators.</div>`;
            return;
        }

        // Verifica se já está autenticado na sessão
        if (isAdminSessionValid()) {
            adminContainer.innerHTML = `<div id="admin-content-wrapper"></div>`;
            loadAdminData();
            return;
        }

        // Mostra tela de login com senha
        adminContainer.innerHTML = `
            <div class="flex items-center justify-center min-h-[60vh]">
                <div class="bg-sidebar border border-yellow-500/30 rounded-2xl p-8 max-w-md w-full shadow-xl">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fa-solid fa-shield-halved text-3xl text-yellow-400"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white mb-2">Admin Access</h2>
                        <p class="text-zinc-400 text-sm">Enter the admin key to continue</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-zinc-400 text-sm mb-2">Admin Key</label>
                            <input type="password" id="admin-key-input" 
                                   class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                                   placeholder="Enter admin key"
                                   onkeypress="if(event.key === 'Enter') document.getElementById('admin-login-btn').click()">
                        </div>
                        
                        <button id="admin-login-btn"
                                class="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl transition-colors">
                            <i class="fa-solid fa-unlock mr-2"></i>Access Admin Panel
                        </button>
                        
                        <p id="admin-login-error" class="text-red-400 text-sm text-center hidden">
                            <i class="fa-solid fa-exclamation-circle mr-1"></i>Incorrect key
                        </p>
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-zinc-800">
                        <p class="text-zinc-500 text-xs text-center">
                            <i class="fa-solid fa-wallet mr-1"></i>Connected: ${formatAddress(State.userAddress)}
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Event listener para o botão de login
        document.getElementById('admin-login-btn').addEventListener('click', () => {
            const keyInput = document.getElementById('admin-key-input');
            const errorMsg = document.getElementById('admin-login-error');
            
            if (keyInput.value === ADMIN_KEY) {
                setAdminSession();
                showToast("✅ Admin access granted!", "success");
                adminContainer.innerHTML = `<div id="admin-content-wrapper"></div>`;
                loadAdminData();
            } else {
                errorMsg.classList.remove('hidden');
                keyInput.value = '';
                keyInput.focus();
                
                // Esconde erro após 3 segundos
                setTimeout(() => errorMsg.classList.add('hidden'), 3000);
            }
        });

        // Foca no input
        setTimeout(() => {
            document.getElementById('admin-key-input')?.focus();
        }, 100);
    },

     refreshData() {
         const adminContainer = document.getElementById('admin');
         if (adminContainer && !adminContainer.classList.contains('hidden') && isAdminSessionValid()) {
             console.log("Refreshing Admin Page data...");
             loadAdminData();
         }
     }
};