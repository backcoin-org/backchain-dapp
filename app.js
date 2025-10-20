// app.js

const ethers = window.ethers;

import { DOMElements } from './dom-elements.js';
import { State } from './state.js';
import { connectWallet, disconnectWallet, initPublicProvider, checkInitialConnection } from './modules/wallet.js';
// Importa a nova função de modal
import { showToast, showShareModal } from './ui-feedback.js';
import { formatBigNumber } from './utils.js';

import { DashboardPage } from './pages/DashboardPage.js';
import { EarnPage } from './pages/EarnPage.js';
import { StorePage } from './pages/StorePage.js';
import { RewardsPage } from './pages/RewardsPage.js';
import { ActionsPage } from './pages/ActionsPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { AirdropPage } from './pages/AirdropPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { PresalePage } from './pages/PresalePage.js'; 
import { DaoPage } from './pages/DaoPage.js';

const routes = {
    'dashboard': DashboardPage,
    'earn': EarnPage,
    'store': StorePage,
    'rewards': RewardsPage,
    'actions': ActionsPage,
    'about': AboutPage,
    'airdrop': AirdropPage,
    'dao': DaoPage,
    'admin': AdminPage,
    'presale': PresalePage, 
};

let activePageId = 'dashboard';
const ADMIN_WALLET = "0x03aC69873293cD6ddef7625AfC91E3Bd5434562a";

// --- Funções de UI e Navegação ---

function updateConnectionStatus(status, message) {
    const statuses = {
        disconnected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'fa-circle' },
        connecting: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: 'fa-spinner fa-spin' },
        connected: { bg: 'bg-green-500/20', text: 'text-green-400', icon: 'fa-circle' },
    };
    const { bg, text, icon } = statuses[status];
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        statusEl.className = `hidden sm:inline-flex items-center gap-2 py-1.5 px-3 rounded-full text-sm font-medium ${bg} ${text}`;
        statusEl.innerHTML = `<i class="fa-solid ${icon} text-xs"></i><span>${message}</span>`;
    }
}

function navigateTo(targetId) {
    if (!routes[targetId]) return;
    
    // Lógica de segurança para a rota de admin
    if (targetId === 'admin' && (!State.userAddress || State.userAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase())) {
        showToast("Access Denied. You are not an administrator.", "error");
        return; // Impede a navegação se não for admin
    }

    activePageId = targetId;
    document.querySelectorAll('main section').forEach(section => {
        if (section) section.classList.add('hidden');
    });
    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.classList.remove('hidden');
    
    document.querySelectorAll('.sidebar-link').forEach(l => {
        if(!l.hasAttribute('data-target')) return;
        l.classList.remove('active');
    });
    const activeLink = document.querySelector(`.sidebar-link[data-target="${targetId}"]`);
    if(activeLink) {
        activeLink.classList.add('active');
    }
    
    // Renderiza o conteúdo da página de destino
    if (routes[targetId] && typeof routes[targetId].render === 'function') {
        routes[targetId].render();
        // Se a página tiver um 'init' para listeners, chama também
        if (typeof routes[targetId].init === 'function') {
            routes[targetId].init();
        }
    }
}

function toggleSidebar() {
    DOMElements.sidebar.classList.toggle('-translate-x-full');
    DOMElements.sidebarBackdrop.classList.toggle('hidden');
}
function closeSidebar() {
    DOMElements.sidebar.classList.add('-translate-x-full');
    DOMElements.sidebarBackdrop.classList.add('hidden');
}

function updateUIState() {
    const adminLinkContainer = document.getElementById('admin-link-container');
    const statUserBalanceEl = document.getElementById('statUserBalance'); // Pega o novo elemento

    if (State.isConnected) {
        // UI para usuário conectado
        DOMElements.connectButton.classList.add('hidden');
        DOMElements.userInfo.classList.remove('hidden');
        DOMElements.userInfo.classList.add('flex');
        
        DOMElements.walletAddressEl.textContent = `${State.userAddress.substring(0, 4)}...${State.userAddress.substring(State.userAddress.length - 3)}`;
        
        const balanceNum = formatBigNumber(State.currentUserBalance);
        const balanceString = `${balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $BKC`;
        
        DOMElements.userBalanceEl.textContent = balanceString; // Header (agora oculto)
        if (statUserBalanceEl) statUserBalanceEl.textContent = balanceString; // Dashboard
        
        if(DOMElements.popMiningTab) DOMElements.popMiningTab.style.display = 'block';
        if(DOMElements.validatorSectionTab) DOMElements.validatorSectionTab.style.display = 'block';
        
        // Mostra o link de Admin se a carteira for a correta
        if (adminLinkContainer && State.userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
            adminLinkContainer.style.display = 'block';
        } else if (adminLinkContainer) {
            adminLinkContainer.style.display = 'none';
        }

        updateConnectionStatus('connected', 'Connected');
    } else {
        // UI para usuário desconectado
        DOMElements.connectButton.classList.remove('hidden');
        DOMElements.userInfo.classList.add('hidden');
        DOMElements.userInfo.classList.remove('flex');
        
        if(DOMElements.popMiningTab) DOMElements.popMiningTab.style.display = 'none';
        if(DOMElements.validatorSectionTab) DOMElements.validatorSectionTab.style.display = 'none';
        if (adminLinkContainer) adminLinkContainer.style.display = 'none';

        // Reseta painéis do dashboard
        DOMElements.userBalanceEl.textContent = '-- $BKC'; // Header
        if (statUserBalanceEl) statUserBalanceEl.textContent = '-- $BKC'; // Dashboard
        
        updateConnectionStatus('disconnected', 'Disconnected');
    }
    
    if (routes[activePageId] && typeof routes[activePageId].update === 'function') {
        routes[activePageId].update(State.isConnected); // Passa o estado de conexão
    } else {
         navigateTo(activePageId); // Renderiza a página
    }
}

// --- SETUP PRINCIPAL ---
function setupGlobalListeners() {
    DOMElements.menuBtn.addEventListener('click', toggleSidebar);
    DOMElements.sidebarBackdrop.addEventListener('click', closeSidebar);
    
    DOMElements.navLinks.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        // AJUSTE 2: Botão Share Project agora chama o modal
        if (link.id === 'shareProjectBtn') {
            e.preventDefault();
            showShareModal(); // Chama a nova função de modal
            return;
        }

        if (link.hasAttribute('data-target')) {
            e.preventDefault();
            navigateTo(link.dataset.target);
            closeSidebar();
        }
    });
    
    DOMElements.connectButton.addEventListener('click', async () => {
        const success = await connectWallet();
        if (success) updateUIState();
    });
    
    DOMElements.disconnectButton.addEventListener('click', () => {
        disconnectWallet();
        updateUIState();
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (target && (target.id === 'closeModalBtn' || target.classList.contains('closeModalBtn'))) {
            DOMElements.modalContainer.innerHTML = '';
        }
    });
    
    // Verificação para garantir que o elemento existe antes de adicionar o listener
    if(DOMElements.earnTabs) {
        DOMElements.earnTabs.addEventListener('click', (e) => {
            const button = e.target.closest('.tab-btn');
            if (!button) return;
            document.querySelectorAll('#earn-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            document.querySelectorAll('#earn .tab-content').forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(button.dataset.target);
            if(targetContent) targetContent.classList.add('active');
        });
    }
}

async function init() {
    if (typeof ethers === 'undefined') {
        showToast("Ethers library not loaded.", "error");
        return;
    }
    
    const wasConnected = await checkInitialConnection();
    // A DOM já foi carregada, então é seguro chamar setup e update
    setupGlobalListeners();
    updateUIState(); 
    
    // Navega para a página inicial (dashboard) após a configuração inicial
    navigateTo('dashboard');
}

// Garante que o DOM esteja totalmente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', init);

