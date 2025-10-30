// app.js (AJUSTADO)

const ethers = window.ethers;

import { DOMElements } from './dom-elements.js';
import { State } from './state.js';
// Assumimos que initializeWalletState e openConnectModal contêm a lógica de reconexão
import { initPublicProvider, initializeWalletState, disconnectWallet, openConnectModal } from './modules/wallet.js';
import { showToast, showShareModal, showWelcomeModal } from './ui-feedback.js';
import { formatBigNumber, formatAddress } from './utils.js';
import { loadAddresses } from './config.js'; 

// Importações das Páginas (mantidas)
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
import { FaucetPage } from './pages/FaucetPage.js';
import { TokenomicsPage } from './pages/TokenomicsPage.js';
import { NotaryPage } from './pages/NotaryPage.js';

const routes = {
    'dashboard': DashboardPage,
    'earn': EarnPage,
    'store': StorePage,
    'rewards': RewardsPage,
    'actions': ActionsPage,
    'about': AboutPage,
    'airdrop': AirdropPage,
    'admin': AdminPage,
    'presale': PresalePage,
    'dao': DaoPage,
    'notary': NotaryPage,
    'faucet': FaucetPage,
    'tokenomics': TokenomicsPage,
};

// Página inicial padrão: Dashboard
let activePageId = 'dashboard';
const ADMIN_WALLET = "0x03aC69873293cD6ddef7625AfC91E3Bd5434562a";


// --- Funções de UI e Navegação (mantidas as correções anteriores) ---

function updateConnectionStatus(status, message) {
    const statuses = { disconnected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'fa-circle' }, connecting: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: 'fa-spinner fa-spin' }, connected: { bg: 'bg-green-500/20', text: 'text-green-400', icon: 'fa-circle' }, }; const { bg, text, icon } = statuses[status]; const statusEl = DOMElements.connectionStatus; if (statusEl) { statusEl.className = `hidden sm:inline-flex lg:hidden items-center gap-2 py-1.5 px-3 rounded-full text-sm font-medium ${bg} ${text}`; statusEl.innerHTML = `<i class="fa-solid ${icon} text-xs"></i><span>${message}</span>`; }
}

function navigateTo(targetId) {
    // Verifica se a rota é válida.
    if (!routes[targetId]) { 
        console.warn(`Route not found: ${targetId}. Navigating to dashboard.`); 
        targetId = 'dashboard'; 
    }
    
    // Fallback para 'dashboard' se targetId for nulo (após a verificação de rota)
    if (!targetId) {
        targetId = 'dashboard';
    }
    
    // Restrição de acesso ao Admin
    if (targetId === 'admin' && (!State.userAddress || State.userAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase())) { 
        showToast("Access Denied. You are not an administrator.", "error"); 
        return; 
    }
    

    activePageId = targetId;
    document.querySelectorAll('main section').forEach(section => { if (section) section.classList.add('hidden'); });
    
    const targetSection = document.getElementById(targetId);
    if (targetSection) { 
        targetSection.classList.remove('hidden'); 
    } else { 
        // Se a seção alvo não for encontrada, o problema é sério (DOM Structure).
        console.error(`Target section #${targetId} not found! Navigating to dashboard.`); 
        activePageId = 'dashboard'; 
        document.getElementById('dashboard')?.classList.remove('hidden'); 
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active')); 
        document.querySelector(`.sidebar-link[data-target="dashboard"]`)?.classList.add('active'); 
        routes['dashboard']?.render(); 
        return; 
    }
    
    // Atualiza o link ativo na barra lateral
    document.querySelectorAll('.sidebar-link').forEach(l => { if(!l.hasAttribute('data-target')) return; l.classList.remove('active'); });
    const activeLink = document.querySelector(`.sidebar-link[data-target="${targetId}"]`);
    if(activeLink) { activeLink.classList.add('active'); }
    
    // Renderiza a página
    if (routes[targetId] && typeof routes[targetId].render === 'function') {
        routes[targetId].render();
        
        // NOTA: A lógica de init() foi movida para dentro do render() da PresalePage
        // e é controlada por hasInitialized. Não chamamos init aqui para evitar duplicidade.

    } else {
        console.warn(`No render function found for route: ${targetId}`);
        if (targetSection) targetSection.classList.remove('hidden');
    }
}

function toggleSidebar() {
    DOMElements.sidebar?.classList.toggle('-translate-x-full');
    DOMElements.sidebarBackdrop?.classList.toggle('hidden');
}
function closeSidebar() {
    DOMElements.sidebar?.classList.add('-translate-x-full');
    DOMElements.sidebarBackdrop?.classList.add('hidden');
}

function updateUIState() {
    const adminLinkContainer = document.getElementById('admin-link-container');
    const statUserBalanceEl = document.getElementById('statUserBalance'); // Dashboard balance

    const desktopDisconnected = DOMElements.desktopDisconnected;
    const desktopConnectedInfo = DOMElements.desktopConnectedInfo;
    const desktopUserAddress = DOMElements.desktopUserAddress;
    const desktopUserBalance = DOMElements.desktopUserBalance;
    const connectButtonMobile = DOMElements.connectButtonMobile;
    const mobileAppDisplay = DOMElements.mobileAppDisplay;
    const mobileSettingsButton = DOMElements.mobileSettingsButton;

    console.log("Updating UI state, isConnected:", State.isConnected, "User Address:", State.userAddress);

    const checkElement = (el, name) => { if (!el) console.warn(`Element ${name} not found in DOM during UI update.`); return el; };

    if (State.isConnected && State.userAddress) {
        // --- ESTADO CONECTADO ---
        const balanceNum = formatBigNumber(State.currentUserBalance);
        const balanceString = `${balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const addressFormatted = formatAddress(State.userAddress);

        checkElement(desktopDisconnected, 'desktopDisconnected')?.classList.add('hidden');
        const desktopInfoEl = checkElement(desktopConnectedInfo, 'desktopConnectedInfo');
        if (desktopInfoEl) { desktopInfoEl.classList.remove('hidden'); desktopInfoEl.classList.remove('text-white'); desktopInfoEl.classList.add('text-zinc-900'); }
        const desktopAddrEl = checkElement(desktopUserAddress, 'desktopUserAddress');
        if (desktopAddrEl) desktopAddrEl.textContent = addressFormatted;
        const desktopBalEl = checkElement(desktopUserBalance, 'desktopUserBalance');
        if (desktopBalEl) desktopBalEl.textContent = `${balanceString} $BKC`;

        checkElement(connectButtonMobile, 'connectButtonMobile')?.classList.add('hidden');
        checkElement(mobileSettingsButton, 'mobileSettingsButton')?.classList.remove('hidden');
        const mobileDisplayEl = checkElement(mobileAppDisplay, 'mobileAppDisplay');
        if (mobileDisplayEl) { mobileDisplayEl.textContent = `${balanceString} $BKC`; mobileDisplayEl.classList.add('text-amber-400'); mobileDisplayEl.classList.remove('text-white'); }

        if (statUserBalanceEl) statUserBalanceEl.textContent = balanceString;
        if (DOMElements.popMiningTab) DOMElements.popMiningTab.style.display = 'block';
        if (DOMElements.validatorSectionTab) DOMElements.validatorSectionTab.style.display = 'block';
        if (adminLinkContainer) { adminLinkContainer.style.display = (State.userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()) ? 'block' : 'none'; }
        updateConnectionStatus('connected', addressFormatted);

    } else {
        // --- ESTADO DESCONECTADO ---
        checkElement(desktopDisconnected, 'desktopDisconnected')?.classList.remove('hidden');
        const desktopInfoEl = checkElement(desktopConnectedInfo, 'desktopConnectedInfo');
        if (desktopInfoEl) { desktopInfoEl.classList.add('hidden'); desktopInfoEl.classList.remove('text-zinc-900'); }
        const desktopAddrEl = checkElement(desktopUserAddress, 'desktopUserAddress');
        if (desktopAddrEl) desktopAddrEl.textContent = '';
        const desktopBalEl = checkElement(desktopUserBalance, 'desktopUserBalance');
        if (desktopBalEl) desktopBalEl.textContent = '';

        checkElement(connectButtonMobile, 'connectButtonMobile')?.classList.remove('hidden');
        checkElement(mobileSettingsButton, 'mobileSettingsButton')?.classList.add('hidden');
        const mobileDisplayEl = checkElement(mobileAppDisplay, 'mobileAppDisplay');
        if (mobileDisplayEl) { mobileDisplayEl.textContent = 'Backchain'; mobileDisplayEl.classList.add('text-amber-400'); mobileDisplayEl.classList.remove('text-white'); }

        if (DOMElements.popMiningTab) DOMElements.popMiningTab.style.display = 'none';
        if (DOMElements.validatorSectionTab) DOMElements.validatorSectionTab.style.display = 'none';
        if (adminLinkContainer) adminLinkContainer.style.display = 'none';
        if (statUserBalanceEl) statUserBalanceEl.textContent = '--';
        updateConnectionStatus('disconnected', 'Disconnected');
    }

    // A atualização da página ativa deve ser feita após a atualização do estado da conexão.
    if (routes[activePageId]) { 
        if (typeof routes[activePageId].update === 'function') { 
            routes[activePageId].update(State.isConnected); 
        } else if (typeof routes[activePageId].render === 'function') { 
            // CORREÇÃO: Chama render, que por sua vez chama init (se necessário)
            routes[activePageId].render(); 
        } 
    } else { 
        console.error(`Route handler for ${activePageId} not found during UI update.`); 
        navigateTo('dashboard'); 
    }
}


async function onWalletStateChange(newState) {
    console.log("onWalletStateChange:", newState);
    
    // AQUI É ONDE SE GARANTE QUE A UI É ATUALIZADA APÓS QUALQUER MUDANÇA DE ESTADO
    if (!newState.isConnected) { 
        if (newState.wasConnected) showToast("Wallet disconnected.", "info"); 
        updateUIState(); 
        // Se desconectou, volta para o dashboard
        navigateTo('dashboard');
    } else { 
        if (newState.isNewConnection) showToast("Wallet connected successfully!", "success"); 
        updateUIState(); 
    }
}


// --- SETUP PRINCIPAL (CORRIGIDO E OTIMIZADO) ---
function setupGlobalListeners() {
    DOMElements.menuBtn?.addEventListener('click', toggleSidebar);
    DOMElements.sidebarBackdrop?.addEventListener('click', closeSidebar);
    DOMElements.navLinks?.addEventListener('click', (e) => { const link = e.target.closest('a'); if (!link) return; if (link.id === 'shareProjectBtn') { e.preventDefault(); showShareModal(); closeSidebar(); return; } if (link.hasAttribute('data-target')) { e.preventDefault(); navigateTo(link.dataset.target); closeSidebar(); } });
    DOMElements.connectButtonDesktop?.addEventListener('click', () => { openConnectModal(); });
    DOMElements.connectButtonMobile?.addEventListener('click', () => { openConnectModal(); });
    DOMElements.mobileSettingsButton?.addEventListener('click', () => { openConnectModal(); });
    document.body.addEventListener('click', (e) => { if (e.target.id === 'modal-backdrop' || e.target.closest('.closeModalBtn')) { if (DOMElements.modalContainer) DOMElements.modalContainer.innerHTML = ''; } });
    DOMElements.earnTabs?.addEventListener('click', (e) => { const button = e.target.closest('.tab-btn'); if (!button) return; const targetId = button.dataset.target; const earnSection = document.getElementById('earn'); if (!earnSection) return; earnSection.querySelectorAll('#earn-tabs .tab-btn').forEach(btn => btn.classList.remove('active')); button.classList.add('active'); earnSection.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active')); const targetContent = earnSection.querySelector(`#${targetId}`); if(targetContent) targetContent.classList.add('active'); });
}

async function init() {
    console.log("Initializing application...");
    if (typeof ethers === 'undefined') {
        showToast("Ethers library not loaded. Please refresh.", "error");
        document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Ethers.js not found.</div>';
        return;
    }

    try {
        console.log("Carregando endereços dos contratos...");
        const addressesLoaded = await loadAddresses(); 
        
        if (!addressesLoaded) {
            console.error("Falha ao carregar endereços. A aplicação não pode continuar.");
            return; 
        }
        console.log("Endereços carregados com sucesso.");
    
    } catch (error) {
        console.error("Falha crítica ao carregar endereços:", error);
        document.body.innerHTML = `<div style="color: red; padding: 20px;">Falha ao carregar endereços: ${error.message}</div>`;
        return;
    }
    
    setupGlobalListeners();

    // 1. Inicializa o Provedor Público
    await initPublicProvider(); 

    // 2. Tenta a RECONEXÃO AUTOMÁTICA (se o State for persistido via initializeWalletState)
    // O onWalletStateChange será chamado APÓS a verificação (se conectado ou desconectado)
    await initializeWalletState(onWalletStateChange);

    // 3. Mostra o modal de boas-vindas. O modal deve aparecer com o idioma padrão (en)
    showWelcomeModal();

    // 4. E navega para a página padrão (Dashboard, já que activePageId='dashboard')
    // A navegação acontece agora para garantir que a página correta seja renderizada logo
    // após o estado da carteira ser estabelecido (mesmo que desconectado).
    navigateTo(activePageId); 

    console.log("Application initialized.");
}

// Start the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}