// app.js

// LINHA REMOVIDA: import { inject } from '@vercel/speed-insights';

const ethers = window.ethers;

import { DOMElements } from './dom-elements.js';
import { State } from './state.js';
// CORREÇÃO: Importa 'initializeWalletState' em vez de 'subscribeToWalletChanges'
import { initPublicProvider, initializeWalletState, disconnectWallet, openConnectModal } from './modules/wallet.js';
import { showToast, showShareModal } from './ui-feedback.js';
import { formatBigNumber, formatAddress } from './utils.js';

// Importações das Páginas
// ... (imports como antes) ...
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
import { TokenomicsPage } from './pages/TokenomicsPage.js'; // <-- Importação da nova página
import { NotaryPage } from './pages/NotaryPage.js'; // <-- IMPORTAÇÃO DA NOVA PÁGINA

// LINHA REMOVIDA: inject();

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
    'notary': NotaryPage, // <-- ROTA DA NOVA PÁGINA
    'faucet': FaucetPage,
    'tokenomics': TokenomicsPage, // <-- Rota da nova página
};

// --- MUDANÇA: 'presale' AGORA É A PÁGINA ATIVA PADRÃO ---
let activePageId = 'presale';
const ADMIN_WALLET = "0x03aC69873293cD6ddef7625AfC91E3Bd5434562a";

// --- Funções de UI e Navegação ---

function updateConnectionStatus(status, message) {
    // ... (função sem alterações) ...
    const statuses = { disconnected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'fa-circle' }, connecting: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: 'fa-spinner fa-spin' }, connected: { bg: 'bg-green-500/20', text: 'text-green-400', icon: 'fa-circle' }, }; const { bg, text, icon } = statuses[status]; const statusEl = DOMElements.connectionStatus; if (statusEl) { statusEl.className = `hidden sm:inline-flex lg:hidden items-center gap-2 py-1.5 px-3 rounded-full text-sm font-medium ${bg} ${text}`; statusEl.innerHTML = `<i class="fa-solid ${icon} text-xs"></i><span>${message}</span>`; }
}

function navigateTo(targetId) {
    // ... (lógica de verificação e navegação anterior) ...
    if (!routes[targetId]) { console.warn(`Route not found: ${targetId}. Navigating to dashboard.`); targetId = 'dashboard'; }
    if (targetId === 'admin' && (!State.userAddress || State.userAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase())) { showToast("Access Denied. You are not an administrator.", "error"); return; }
    
    // Se o alvo for nulo/vazio (acontece no primeiro load se activePageId falhar), define 'presale' como padrão
    if (!targetId) {
        targetId = 'presale';
    }

    activePageId = targetId;
    document.querySelectorAll('main section').forEach(section => { if (section) section.classList.add('hidden'); });
    
    const targetSection = document.getElementById(targetId);
    if (targetSection) { 
        targetSection.classList.remove('hidden'); 
    } else { 
        console.error(`Target section #${targetId} not found! Navigating to presale.`); 
        activePageId = 'presale'; 
        document.getElementById('presale')?.classList.remove('hidden'); 
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active')); 
        document.querySelector(`.sidebar-link[data-target="presale"]`)?.classList.add('active'); 
        routes['presale']?.render(); 
        return; 
    }
    
    document.querySelectorAll('.sidebar-link').forEach(l => { if(!l.hasAttribute('data-target')) return; l.classList.remove('active'); });
    const activeLink = document.querySelector(`.sidebar-link[data-target="${targetId}"]`);
    if(activeLink) { activeLink.classList.add('active'); }
    
    // --- AJUSTE APLICADO AQUI ---
    // A chamada .update() foi removida para evitar o "pisca-pisca"
    // O 'init()' de cada página agora tem um "guarda" para rodar só uma vez.
    if (routes[targetId] && typeof routes[targetId].render === 'function') {
        routes[targetId].render();
        if (typeof routes[targetId].init === 'function') {
            routes[targetId].init();
        }
        // LINHA REMOVIDA: if (typeof routes[targetId].update === 'function') { ... }
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

// *** FUNÇÃO updateUIState (sem alterações da versão anterior) ***
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

        // Desktop
        checkElement(desktopDisconnected, 'desktopDisconnected')?.classList.add('hidden');
        const desktopInfoEl = checkElement(desktopConnectedInfo, 'desktopConnectedInfo');
        if (desktopInfoEl) { desktopInfoEl.classList.remove('hidden'); desktopInfoEl.classList.remove('text-white'); desktopInfoEl.classList.add('text-zinc-900'); }
        const desktopAddrEl = checkElement(desktopUserAddress, 'desktopUserAddress');
        if (desktopAddrEl) desktopAddrEl.textContent = addressFormatted;
        const desktopBalEl = checkElement(desktopUserBalance, 'desktopUserBalance');
        if (desktopBalEl) desktopBalEl.textContent = `${balanceString} $BKC`;

        // Mobile
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

    if (routes[activePageId]) { if (typeof routes[activePageId].update === 'function') { routes[activePageId].update(State.isConnected); } else if (typeof routes[activePageId].render === 'function') { routes[activePageId].render(); } } else { console.error(`Route handler for ${activePageId} not found during UI update.`); navigateTo('presale'); } // Padrão 'presale'
}


// --- Handler de Mudança do Web3Modal (Sem alterações) ---
async function onWalletStateChange(newState) {
    console.log("onWalletStateChange:", newState);
    if (!newState.isConnected) { if (newState.wasConnected) showToast("Wallet disconnected.", "info"); updateUIState(); } else { if (newState.isNewConnection) showToast("Wallet connected successfully!", "success"); updateUIState(); }
}


// --- SETUP PRINCIPAL ---
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

    setupGlobalListeners();
    await initPublicProvider();
    
    // --- CORREÇÃO APLICADA AQUI ---
    // Trocamos 'subscribeToWalletChanges' por 'await initializeWalletState'.
    // Isso garante que o app espera a verificação inicial da carteira
    // antes de continuar e renderizar a página.
    await initializeWalletState(onWalletStateChange);

    // A chamada inicial 'updateUIState()' foi corretamente removida.
    
    // Esta chamada agora ocorrerá DEPOIS que o estado da carteira
    // (conectado ou desconectado) já foi estabelecido.
    navigateTo(activePageId); // 'activePageId' agora é 'presale'

    console.log("Application initialized.");
}

// Start the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}