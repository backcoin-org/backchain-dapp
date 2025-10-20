// pages/AdminPage.js

import { showToast } from '../ui-feedback.js';
// CORREÇÃO: Importa renderError também, caso necessário
import { renderPaginatedList, renderNoData, formatAddress, renderLoading, renderError } from '../utils.js';
import { State } from '../state.js';
import * as db from '../modules/firebase-auth-service.js'; // Import Firebase service

// The administrator wallet address (security key)
const ADMIN_WALLET = "0x03aC69873293cD6ddef7625AfC91E3Bd5434562a";

// Mapeamento de Status para UI (Cores Tailwind e Ícones Font Awesome) - Reutilizado do AirdropPage
const statusUI = {
    pending: { text: 'Pending Review', color: 'text-amber-400', bgColor: 'bg-amber-900/50', icon: 'fa-clock' },
    auditing: { text: 'Auditing', color: 'text-blue-400', bgColor: 'bg-blue-900/50', icon: 'fa-magnifying-glass' },
    approved: { text: 'Approved', color: 'text-green-400', bgColor: 'bg-green-900/50', icon: 'fa-check-circle' },
    rejected: { text: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-900/50', icon: 'fa-times-circle' },
    flagged_suspicious: { text: 'Flagged', color: 'text-red-300', bgColor: 'bg-red-800/60', icon: 'fa-flag' },
};


let adminState = {
    allSubmissions: [], // Submissões pendentes/auditing
    dailyTasks: [],     // Todas as tarefas (ativas e inativas)
    editingTask: null, // Tarefa sendo editada no formulário
    activeTab: 'manage-tasks' // Aba ativa no painel admin
};

// --- ADMIN DATA LOADING ---
const loadAdminData = async () => {
    const adminContent = document.getElementById('admin-content-wrapper');
    // Mostra loader ANTES de buscar os dados
    if(adminContent) {
        const tempLoaderDiv = document.createElement('div');
        renderLoading(tempLoaderDiv); // Usa a função utilitária
        adminContent.innerHTML = tempLoaderDiv.innerHTML;
    }


    try {
        const [submissions, tasks] = await Promise.all([
            // Usa a função correta que filtra por 'pending'/'auditing'
            db.getAllSubmissionsForAdmin(),
            db.getAllTasksForAdmin()      // Pega todas as tarefas (ativas/inativas)
        ]);

        // A função getAllSubmissionsForAdmin já deve retornar apenas pendentes/auditing
        adminState.allSubmissions = submissions;
        adminState.dailyTasks = tasks;

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

// --- ADMIN ACTION HANDLERS ---

const handleAdminAction = async (e) => {
    const btn = e.target.closest('button[data-action]'); // Seleciona o botão mais próximo com data-action
    if (!btn || btn.disabled) return; // Sai se não for um botão de ação ou estiver desabilitado

    const action = btn.dataset.action;
    const submissionId = btn.dataset.submissionId;
    const userId = btn.dataset.userId; // Firebase UID

    if (!action || !submissionId || !userId) {
        console.warn("Missing data attributes for admin action:", btn.dataset);
        return;
    }

    // Desabilita botões da linha
    const buttonCell = btn.closest('td');
    const actionButtons = buttonCell ? buttonCell.querySelectorAll('button') : [];
    actionButtons.forEach(b => b.disabled = true);
    // Adiciona loader ao botão clicado
    const originalContent = btn.innerHTML;
    const tempLoaderSpan = document.createElement('span');
    tempLoaderSpan.classList.add('inline-block'); // Para o loader ficar contido
    renderLoading(tempLoaderSpan); // Cria loader
    btn.innerHTML = ''; // Limpa
    btn.appendChild(tempLoaderSpan); // Adiciona loader


    try {
        if (action === 'approve' || action === 'reject') {
            // Lógica para determinar pontos e multiplicador (pode vir do admin UI no futuro)
            // Por agora, vamos usar valores fixos baseados na submissão
             const submission = adminState.allSubmissions.find(s => s.submissionId === submissionId && s.userId === userId);
             const basePoints = submission?.basePoints || 0; // Pega pontos base da submissão
             const points = action === 'approve' ? basePoints : 0; // Usa base points se aprovar
             const multiplier = null; // Admin não define multiplicador base aqui

            await db.updateSubmissionStatus(userId, submissionId, action, points, multiplier);
            showToast(`Submission ${action === 'approve' ? 'APPROVED' : 'REJECTED'}!`, 'success');
            loadAdminData(); // Recarrega e re-renderiza a lista
        }
        // Adicionar outras ações (ex: ban user) aqui se necessário
    } catch(error) {
        showToast(`Failed to ${action} submission: ${error.message}`, 'error');
        console.error(error);
        // Reabilita botões e restaura texto se falhar
        actionButtons.forEach(b => b.disabled = false);
        btn.innerHTML = originalContent; // Restaura o botão clicado
    }
};

const handleTaskFormSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    let startDate, endDate;
    try {
        // Valida e converte datas
        startDate = new Date(form.startDate.value + 'T00:00:00Z'); // Assume UTC start of day
        endDate = new Date(form.endDate.value + 'T23:59:59Z');   // Assume UTC end of day
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
        description: form.description.value.trim(), // Pega a descrição
        points: parseInt(form.points.value, 10),
        cooldownHours: parseInt(form.cooldown.value, 10),
        startDate: startDate,
        endDate: endDate
    };

    // Validações básicas
    if (!taskData.title || !taskData.description) { // URL agora é opcional
        showToast("Please fill in Title and Description.", "error");
        return;
    }
     if (taskData.points <= 0 || taskData.cooldownHours <= 0) {
        showToast("Points and Cooldown must be positive numbers.", "error");
        return;
    }
     // Valida URL se preenchida
     if (taskData.url && !taskData.url.startsWith('http')) {
         showToast("URL must start with http:// or https://", "error");
         return;
     }


    if (adminState.editingTask && adminState.editingTask.id) {
        taskData.id = adminState.editingTask.id; // Inclui ID se estiver editando
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
        await db.addOrUpdateDailyTask(taskData);
        showToast(`Task ${taskData.id ? 'updated' : 'created'} successfully!`, "success");
        form.reset();
        adminState.editingTask = null; // Limpa estado de edição
        loadAdminData(); // Recarrega tudo
    } catch (error) {
        showToast(`Failed to save task: ${error.message}`, "error");
        console.error(error);
         submitButton.disabled = false; // Reabilita em caso de erro
         submitButton.innerHTML = originalButtonText;
    }
};

const handleEditTask = (taskId) => {
    const task = adminState.dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    adminState.editingTask = task;
    renderManageTasksPanel(); // Re-renderiza o painel de tarefas com o formulário preenchido
};

const handleDeleteTask = async (taskId) => {
    // Usar modal customizado seria melhor aqui
    if (!window.confirm("Are you sure you want to delete this task permanently?")) return;
    try {
        await db.deleteDailyTask(taskId);
        showToast("Task deleted.", "success");
        adminState.editingTask = null; // Cancela edição se estiver editando a tarefa deletada
        loadAdminData();
    } catch (error) {
        showToast(`Failed to delete task: ${error.message}`, "error");
        console.error(error);
    }
};

// --- ADMIN RENDER FUNCTIONS ---

const renderManageTasksPanel = () => {
    const container = document.getElementById('manage-tasks-content');
    if (!container) return;

    const task = adminState.editingTask;
    const isEditing = !!task;

    // Helper para formatar Date ou Timestamp para input YYYY-MM-DD
    const formatDate = (dateValue) => {
        if (!dateValue) return '';
        try {
            const d = (dateValue instanceof Date) ? dateValue : new Date(dateValue);
            return d.toISOString().split('T')[0];
        } catch (e) { return ''; }
    }

    // Renderiza formulário e lista de tarefas
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

        <h3 class="text-xl font-bold mt-10 mb-4 border-t border-border-color pt-6">Existing Tasks</h3>
        <div id="existing-tasks-list" class="space-y-3">
            ${adminState.dailyTasks.length > 0 ? adminState.dailyTasks.map(t => `
                <div class="bg-zinc-800 p-4 rounded-lg border border-border-color flex justify-between items-center flex-wrap gap-3">
                    <div class="flex-1 min-w-[250px]">
                        <p class="font-semibold text-white">${t.title || 'No Title'}</p>
                         <p class="text-xs text-zinc-400 mt-0.5">${t.description || 'No Description'}</p>
                        <p class="text-xs text-zinc-500 mt-1">
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
            `).join('') :
            // CORREÇÃO do renderNoData
            (() => {
                const tempDiv = document.createElement('div');
                renderNoData(tempDiv, "No tasks created yet."); // Passa o elemento temporário
                return tempDiv.innerHTML; // Retorna o HTML gerado dentro dele
            })()
            }
        </div>
    `;

    // Adiciona listeners para o formulário e botões da lista
    document.getElementById('taskForm')?.addEventListener('submit', handleTaskFormSubmit);
    document.getElementById('cancelEditBtn')?.addEventListener('click', () => { adminState.editingTask = null; renderManageTasksPanel(); });

    const taskList = document.getElementById('existing-tasks-list');
    if (taskList && !taskList._listenerAttached) {
        taskList.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-id]');
            if (!btn) return;
            const taskId = btn.dataset.id;
            if (btn.dataset.action === 'edit') handleEditTask(taskId);
            if (btn.dataset.action === 'delete') handleDeleteTask(taskId);
        });
        taskList._listenerAttached = true;
    }
};


const renderSubmissionsPanel = () => {
    const container = document.getElementById('submissions-content');
    if (!container) return;

    if (!adminState.allSubmissions || adminState.allSubmissions.length === 0) {
        const tempDiv = document.createElement('div');
        renderNoData(tempDiv, 'No submissions currently pending audit.');
        container.innerHTML = tempDiv.innerHTML;
        return;
    }

    const sortedSubmissions = [...adminState.allSubmissions].sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));


    const submissionsHtml = sortedSubmissions.map(item => `
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${item.userId}">${formatAddress(item.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs truncate" title="${item.url}">
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${item.url}</a>
                <span class="block text-xs text-zinc-500">${item.platform || 'N/A'} - ${item.basePoints || 0} base pts</span>
            </td>
            <td class="p-3 text-xs text-zinc-400">${item.submittedAt ? item.submittedAt.toLocaleString() : 'N/A'}</td>
            <td class="p-3 text-xs font-semibold ${statusUI[item.status]?.color || 'text-gray-500'}">${statusUI[item.status]?.text || item.status}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button data-user-id="${item.userId}" data-submission-id="${item.submissionId}" data-action="approve" class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"><i class="fa-solid fa-check"></i></button>
                    <button data-user-id="${item.userId}" data-submission-id="${item.submissionId}" data-action="reject" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors ml-1"><i class="fa-solid fa-times"></i></button>
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
    `;

     const tbody = document.getElementById('admin-submissions-tbody');
     if (tbody && !tbody._listenerAttached) {
        tbody.addEventListener('click', handleAdminAction);
        tbody._listenerAttached = true;
     }
};


const renderAdminPanel = () => {
    const adminContent = document.getElementById('admin-content-wrapper');
    if (!adminContent) return;

    // Remove comentários do HTML gerado
    adminContent.innerHTML = `
        <h1 class="text-3xl font-bold mb-8">Airdrop Admin Panel</h1>

        <div class="border-b border-border-color mb-6">
            <nav id="admin-tabs" class="-mb-px flex gap-6">
                <button class="tab-btn ${adminState.activeTab === 'manage-tasks' ? 'active' : ''}" data-target="manage-tasks">Manage Daily Tasks</button>
                <button class="tab-btn ${adminState.activeTab === 'review-submissions' ? 'active' : ''}" data-target="review-submissions">Review Submissions</button>
            </nav>
        </div>

        <div id="manage_tasks_tab" class="tab-content ${adminState.activeTab === 'manage-tasks' ? 'active' : ''}">
            <div id="manage-tasks-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="review_submissions_tab" class="tab-content ${adminState.activeTab === 'review-submissions' ? 'active' : ''}">
            <div id="submissions-content" class="max-w-7xl mx-auto"></div>
        </div>
    `;

    // Renderiza o conteúdo da aba ativa inicial
    if (adminState.activeTab === 'manage-tasks') {
        renderManageTasksPanel();
    } else if (adminState.activeTab === 'review-submissions') {
        renderSubmissionsPanel();
    }

    const adminTabs = document.getElementById('admin-tabs');
    // Adiciona listener apenas uma vez
    if (adminTabs && !adminTabs._listenerAttached) {
        adminTabs.addEventListener('click', (e) => {
            const button = e.target.closest('.tab-btn');
            if (!button || button.classList.contains('active')) return;
            const targetId = button.dataset.target;
            adminState.activeTab = targetId; // Atualiza o estado da aba ativa

            // Atualiza classes dos botões
            document.querySelectorAll('#admin-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Mostra/Esconde conteúdo das abas
            adminContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            const targetTabElement = document.getElementById(targetId.replace('-', '_') + '_tab');

            if (targetTabElement) {
                 targetTabElement.classList.add('active');
                 // Re-renderiza o conteúdo da aba selecionada
                 if (targetId === 'manage-tasks') renderManageTasksPanel();
                 if (targetId === 'review-submissions') renderSubmissionsPanel();
            } else {
                 console.warn(`Tab content not found for target: ${targetId}`);
            }
        });
        adminTabs._listenerAttached = true;
    }
};


export const AdminPage = {
    render() {
        const adminContainer = document.getElementById('admin');
        if (!adminContainer) return;

        if (!State.isConnected || !State.userAddress || State.userAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
            adminContainer.innerHTML = `<div class="text-center text-red-400 p-8 bg-sidebar border border-red-500/50 rounded-lg">Access Denied. This page is restricted to administrators.</div>`;
            return;
        }

        adminContainer.innerHTML = `<div id="admin-content-wrapper"></div>`;
        loadAdminData();
    },

     refreshData() {
         const adminContainer = document.getElementById('admin');
         // Só recarrega se adminContainer existir E NÃO estiver escondido
         if (adminContainer && !adminContainer.classList.contains('hidden')) {
             console.log("Refreshing Admin Page data...");
             loadAdminData();
         }
     }
};