// pages/AdminPage.js
// ✅ VERSION V2.5: Wallet + Key from Environment Variables (Secure)
// --- NOVO ---
// Importa o ethers e os endereços dos contratos
const ethers = window.ethers;
import { addresses } from '../config.js'; 
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


let adminState = {
    allSubmissions: [], // Submissões pendentes/auditing
    dailyTasks: [],     // Todas as tarefas (ativas e inativas)
    ugcBasePoints: null, // Para salvar os pontos base do UGC
    platformUsageConfig: null, // Platform Usage Config
    editingTask: null, // Tarefa sendo editada no formulário
    activeTab: 'review-submissions', 
    
    // --- (INÍCIO) ESTADOS "MANAGE USERS" ---
    allUsers: [],
    selectedUserSubmissions: [],
    isSubmissionsModalOpen: false,
    selectedWallet: null,
    
    // Estados de Filtro e Paginação para "Manage Users"
    usersFilter: 'all', // 'all', 'banned', 'appealing'
    usersSearch: '',
    usersPage: 1,
    usersPerPage: 100, // <-- ATUALIZADO DE 15 PARA 100
    
    // --- (INÍCIO) NOVOS ESTADOS DE PAGINAÇÃO ---
    submissionsPage: 1,
    submissionsPerPage: 100, // <-- NOVO

    tasksPage: 1,
    tasksPerPage: 100 // <-- NOVO
    // --- (FIM) NOVOS ESTADOS ---
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

// --- (INÍCIO) NOVAS FUNÇÕES DE RESGATE (PRESALE) ---

/**
 * Busca o saldo do contrato PublicSale e exibe no painel.
 */
const loadPresaleBalance = async () => {
    const balanceEl = document.getElementById('presale-balance-amount');
    if (!balanceEl) return;

    // Mostra loader
    balanceEl.innerHTML = '<span class="loader !w-5 !h-5 inline-block"></span>';

    try {
        if (!State.signer || !State.signer.provider) {
            throw new Error("Admin provider not found.");
        }
        if (!addresses.publicSale) {
             throw new Error("PublicSale address not configured.");
        }

        const balanceWei = await State.signer.provider.getBalance(addresses.publicSale);
        const balanceEth = ethers.formatEther(balanceWei);
        
        // Exibe o saldo formatado
        balanceEl.textContent = `${parseFloat(balanceEth).toFixed(6)} ETH/BNB`;
    } catch (error) {
        console.error("Error loading presale balance:", error);
        balanceEl.textContent = "Error";
    }
};

/**
 * Manipulador para o botão de resgate de fundos da pré-venda.
 */
const handleWithdrawPresaleFunds = async (buttonElement) => {
    if (!State.signer) {
        showToast("Por favor, conecte a carteira do Owner primeiro.", "error");
        return;
    }

    if (!window.confirm("Are you sure you want to withdraw ALL funds from the Presale contract to the Treasury wallet?")) {
        return;
    }

    const presaleAbi = ["function withdrawFunds() external"];
    const saleAddress = addresses.publicSale;
    
    const contract = new ethers.Contract(saleAddress, presaleAbi, State.signer);
    
    const originalHtml = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Withdrawing...';

    try {
        console.log(`Calling withdrawFunds() on ${saleAddress}...`);
        const tx = await contract.withdrawFunds();
        
        showToast("Transaction sent. Awaiting confirmation...", "info");
        const receipt = await tx.wait();
        
        console.log("Funds withdrawn successfully!", receipt.hash);
        showToast("Funds withdrawn successfully!", "success", receipt.hash);
        
        // Atualiza o saldo exibido
        loadPresaleBalance();

    } catch (error) {
        console.error("Error withdrawing funds:", error);
        const message = error.reason || error.message || "Transaction failed.";
        showToast(`Error: ${message}`, "error");
    } finally {
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalHtml;
    }
};

// --- (FIM) NOVAS FUNÇÕES DE RESGATE (PRESALE) ---


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
        <h2 class="text-2xl font-bold mb-4">Manage Users (${totalCount})</h2>
        
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
    
    // --- CORREÇÃO DOS LISTENERS ---
    
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


// ATUALIZADO: renderSubmissionsPanel (com Paginação)
const renderSubmissionsPanel = () => {
    const container = document.getElementById('submissions-content');
    if (!container) return;

    if (!adminState.allSubmissions || adminState.allSubmissions.length === 0) {
        const tempDiv = document.createElement('div');
        renderNoData(tempDiv, 'No submissions currently pending audit.');
        container.innerHTML = tempDiv.innerHTML;
        return;
    }
    
    // --- Lógica de Paginação para Submissions ---
    const page = adminState.submissionsPage;
    const perPage = adminState.submissionsPerPage; // 100

    const sortedSubmissions = [...adminState.allSubmissions].sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));

    const totalSubmissions = sortedSubmissions.length;
    const totalPages = Math.ceil(totalSubmissions / perPage);
    const start = (page - 1) * perPage;
    const end = page * perPage;
    
    const paginatedSubmissions = sortedSubmissions.slice(start, end);

    const submissionsHtml = paginatedSubmissions.map(item => `
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${item.userId}">${formatAddress(item.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs truncate" title="${item.normalizedUrl}">
                <a href="${item.normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${item.normalizedUrl}</a>
                <span class="block text-xs text-zinc-500">${item.platform || 'N/A'} - ${item.basePoints || 0} base pts</span>
            </td>
            <td class="p-3 text-xs text-zinc-400">${item.submittedAt ? item.submittedAt.toLocaleString('en-US') : 'N/A'}</td>
            <td class="p-3 text-xs font-semibold ${statusUI[item.status]?.color || 'text-gray-500'}">${statusUI[item.status]?.text || item.status}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    
                    <button data-user-id="${item.userId}" data-submission-id="${item.submissionId}" data-action="approved" class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"><i class="fa-solid fa-check"></i></button>
                    <button data-user-id="${item.userId}" data-submission-id="${item.submissionId}" data-action="rejected" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors ml-1"><i class="fa-solid fa-times"></i></button>
                    </div>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">Review Pending Submissions (${sortedSubmissions.length})</h2>
        <div class="bg-zinc-800 rounded-xl border border-border-color overflow-x-auto">
            <table class="w-full text-left min-w-[700px]">
                <thead>
                    <tr class="bg-main border-b border-border-color text-xs text-zinc-400 uppercase">
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

    // Renderiza paginação de Submissions
    const paginationContainer = document.getElementById('admin-submissions-pagination');
    if (paginationContainer && totalPages > 1) {
        // ### CORREÇÃO 4/4: Chamando a função CORRETA ###
        renderPaginationControls(paginationContainer, adminState.submissionsPage, totalPages, handleSubmissionsPageChange);
    }

    // Anexa listener à tabela
    document.getElementById('admin-submissions-tbody')?.addEventListener('click', handleAdminAction);
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


// --- (AJUSTADO) RENDERIZA O PAINEL PRINCIPAL COM A NOVA ABA ---
const renderAdminPanel = () => {
    const adminContent = document.getElementById('admin-content-wrapper');
    if (!adminContent) return;

    // ==========================================================
    // INÍCIO DA ATUALIZAÇÃO (Adiciona Painel de Resgate)
    // ==========================================================
    adminContent.innerHTML = `
        <div id="presale-withdraw-panel" class="mb-8 p-6 bg-zinc-800 rounded-xl border border-border-color flex flex-col md:flex-row gap-4 justify-between items-center">
            <div>
                <h3 class="text-xl font-bold text-white">Presale Contract Funds</h3>
                <p class="text-sm text-zinc-400">Total accumulated in the PublicSale contract available for withdrawal.</p>
            </div>
            <div class="flex items-center gap-4">
                <div class="text-right">
                    <span class="block text-2xl font-bold text-amber-400" id="presale-balance-amount">
                        <span class="loader !w-5 !h-5 inline-block"></span>
                    </span>
                    <span class="text-xs text-zinc-500">ETH/BNB Balance</span>
                </div>
                <button id="withdraw-presale-funds-btn" class="btn-primary py-3 px-5 whitespace-nowrap">
                    <i class="fa-solid fa-download mr-2"></i> Withdraw Funds
                </button>
            </div>
        </div>

        <h1 class="text-3xl font-bold mb-8">Airdrop Admin Panel</h1>
    
    
        <div class="border-b border-border-color mb-6">
            <nav id="admin-tabs" class="-mb-px flex flex-wrap gap-x-6 gap-y-2">
                <button class="tab-btn ${adminState.activeTab === 'review-submissions' ? 'active' : ''}" data-target="review-submissions">Review Submissions</button>
                <button class="tab-btn ${adminState.activeTab === 'manage-users' ? 'active' : ''}" data-target="manage-users">Manage Users</button>
                <button class="tab-btn ${adminState.activeTab === 'manage-ugc-points' ? 'active' : ''}" data-target="manage-ugc-points">Manage UGC Points</button>
                <button class="tab-btn ${adminState.activeTab === 'manage-tasks' ? 'active' : ''}" data-target="manage-tasks">Manage Daily Tasks</button>
                <button class="tab-btn ${adminState.activeTab === 'platform-usage' ? 'active' : ''}" data-target="platform-usage">Platform Usage</button>
            </nav>
        </div>

        <div id="review_submissions_tab" class="tab-content ${adminState.activeTab === 'review-submissions' ? 'active' : ''}">
            <div id="submissions-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_users_tab" class="tab-content ${adminState.activeTab === 'manage-users' ? 'active' : ''}">
            <div id="manage-users-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_ugc_points_tab" class="tab-content ${adminState.activeTab === 'manage-ugc-points' ? 'active' : ''}">
            <div id="manage-ugc-points-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="manage_tasks_tab" class="tab-content ${adminState.activeTab === 'manage-tasks' ? 'active' : ''}">
            <div id="manage-tasks-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="platform_usage_tab" class="tab-content ${adminState.activeTab === 'platform-usage' ? 'active' : ''}">
            <div id="platform-usage-content" class="max-w-4xl mx-auto"></div>
        </div>
    `;
    // ==========================================================
    // FIM DA ATUALIZAÇÃO
    // ==========================================================

    // --- (INÍCIO) NOVOS LISTENERS E CARREGAMENTO DE SALDO ---
    
    // Anexa o listener ao novo botão de resgate
    document.getElementById('withdraw-presale-funds-btn')?.addEventListener('click', (e) => handleWithdrawPresaleFunds(e.target));
    
    // Carrega o saldo da pré-venda assim que o painel é renderizado
    loadPresaleBalance();
    
    // --- (FIM) NOVOS LISTENERS ---


    // Renderiza o conteúdo da aba ativa inicial (CORRIGIDO O TYPO)
    if (adminState.activeTab === 'manage-ugc-points') {
        renderUgcPointsPanel();
    } else if (adminState.activeTab === 'manage-tasks') {
        renderManageTasksPanel();
    } else if (adminState.activeTab === 'review-submissions') { 
        renderSubmissionsPanel();
    } else if (adminState.activeTab === 'manage-users') {
        renderManageUsersPanel(); 
    } else if (adminState.activeTab === 'platform-usage') {
        renderPlatformUsagePanel();
    }


    const adminTabs = document.getElementById('admin-tabs');
    
    // Adiciona listener nas ABAS (só precisa ser feito uma vez)
    if (adminTabs && !adminTabs._listenerAttached) {
        adminTabs.addEventListener('click', (e) => {
            const button = e.target.closest('.tab-btn');
            if (!button || button.classList.contains('active')) return;
            const targetId = button.dataset.target;
            adminState.activeTab = targetId; // Atualiza o estado da aba ativa
            
            // ATUALIZADO: Reseta filtros/pagina ao sair da aba
            if (targetId !== 'manage-users') {
                adminState.usersPage = 1;
                adminState.usersFilter = 'all';
                adminState.usersSearch = '';
            }
            if (targetId !== 'review-submissions') {
                adminState.submissionsPage = 1;
            }
            if (targetId !== 'manage-tasks') {
                adminState.tasksPage = 1;
            }
            // Fim da atualização

            document.querySelectorAll('#admin-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            adminContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            // Procura pelo ID do contêiner da aba (ex: manage_users_tab)
            const targetTabElement = document.getElementById(targetId.replace(/-/g, '_') + '_tab');

            if (targetTabElement) {
                 targetTabElement.classList.add('active');
                 
                 // Renderiza o conteúdo da nova aba ativa
                 if (targetId === 'manage-ugc-points') renderUgcPointsPanel();
                 if (targetId === 'manage-tasks') renderManageTasksPanel();
                 if (targetId === 'review-submissions') renderSubmissionsPanel();
                 if (targetId === 'manage-users') renderManageUsersPanel();
                 if (targetId === 'platform-usage') renderPlatformUsagePanel(); 
            } else {
                 console.warn(`Tab content container not found for target: ${targetId}`);
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
             
             // --- NOVO ---
             // Também atualiza o saldo da pré-venda se a página de admin for atualizada
             loadPresaleBalance();
             // --- FIM NOVO ---
         }
     }
};