// js/app.js
// ✅ VERSÃO FINAL: Inicialização Forçada Corrigida

const inject = window.inject || (() => { console.warn("Dev Mode: Analytics disabled."); });
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    try { inject(); } catch (e) { console.error("Analytics Error:", e); }
}

const ethers = window.ethers;

import { DOMElements } from './dom-elements.js';
import { State } from './state.js';
import { initPublicProvider, initWalletSubscriptions, disconnectWallet, openConnectModal } from './modules/wallet.js';
import { showToast, showShareModal, showWelcomeModal } from './ui-feedback.js';
import { formatBigNumber } from './utils.js'; 
import { loadAddresses } from './config.js'; 

// Page Imports
import { DashboardPage } from './pages/DashboardPage.js';
import { EarnPage } from './pages/networkstaking.js'; 
import { StorePage } from './pages/StorePage.js';
import { RewardsPage } from './pages/RewardsPage.js';
import { FortunePoolPage } from './pages/FortunePool.js'; 
import { AboutPage } from './pages/AboutPage.js';
import { AirdropPage } from './pages/AirdropPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { PresalePage } from './pages/PresalePage.js';
import { FaucetPage } from './pages/FaucetPage.js';
import { TokenomicsPage } from './pages/TokenomicsPage.js';
import { NotaryPage } from './pages/NotaryPage.js';
import { RentalPage } from './pages/RentalPage.js';
import { SocialMediaPage } from './pages/SocialMedia.js';

// ============================================================================
// 2. CONFIGURATION & STATE
// ============================================================================

const ADMIN_WALLET = '0x03aC69873293cD6ddef7625AfC91E3Bd5434562a'; 

// 🔴 MUDANÇA IMPORTANTE: Inicia como null para forçar o primeiro render
let activePageId = null; 
let currentPageCleanup = null;
let uiUpdatePending = false; 

const routes = {
    'dashboard': DashboardPage,
    'mine': EarnPage, 
    'store': StorePage,
    'rewards': RewardsPage,
    'actions': FortunePoolPage, 
    'notary': NotaryPage,
    'airdrop': AirdropPage,
    'tokenomics': TokenomicsPage,
    'faucet': FaucetPage,
    'about': AboutPage,
    'admin': AdminPage,
    'presale': PresalePage,
    'rental': RentalPage,
    'socials': SocialMediaPage
};

// ============================================================================
// 3. FORMATTING HELPERS
// ============================================================================

function formatAddress(addr) {
    if (!addr || addr.length < 42) return '...';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`; 
}

function formatLargeBalance(bigNum) {
    const num = formatBigNumber(bigNum);
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 10_000) return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================================================
// 4. NAVIGATION ENGINE
// ============================================================================

function navigateTo(pageId, forceUpdate = false) {
    const pageContainer = document.querySelector('main > div.container');
    const navItems = document.querySelectorAll('.sidebar-link');

    if (!pageContainer) return;

    // Se a página solicitada for a mesma da atual e não for update forçado, tenta apenas atualizar dados
    if (activePageId === pageId && !forceUpdate) {
        if (routes[pageId] && typeof routes[pageId].update === 'function') {
            routes[pageId].update(State.isConnected);
        }
        return; 
    }

    // Cleanup da página anterior
    if (currentPageCleanup && typeof currentPageCleanup === 'function') {
        currentPageCleanup();
        currentPageCleanup = null;
    }

    // Esconde todas as seções visualmente
    Array.from(pageContainer.children).forEach(child => {
        if (child.tagName === 'SECTION') {
            child.classList.add('hidden');
            child.classList.remove('active');
        }
    });

    // Atualiza Menu Lateral
    navItems.forEach(item => {
        item.classList.remove('active');
        item.classList.add('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-700');
    });

    const targetPage = document.getElementById(pageId);
    
    // Se a seção HTML existe e temos a rota no JS
    if (targetPage && routes[pageId]) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active');
        
        // Verifica se é uma navegação real (mudança de rota)
        const isNewPage = activePageId !== pageId;
        activePageId = pageId;

        // Ativa o link no menu
        const activeNavItem = document.querySelector(`.sidebar-link[data-target="${pageId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.remove('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-700');
            activeNavItem.classList.add('active');
        }

        // 🔴 Renderiza a página
        if (routes[pageId] && typeof routes[pageId].render === 'function') {
            // Passamos isNewPage OR forceUpdate para garantir renderização quando necessário
            routes[pageId].render(isNewPage || forceUpdate);
        }
        
        if (typeof routes[pageId].cleanup === 'function') {
            currentPageCleanup = routes[pageId].cleanup;
        }
        
        if (isNewPage) window.scrollTo(0,0);

    } else {
        // Fallback se a rota não existir
        if(pageId !== 'dashboard') {
            console.warn(`Route '${pageId}' not found, redirecting to dashboard.`);
            navigateTo('dashboard', true);
        }
    }
}
window.navigateTo = navigateTo;

// ============================================================================
// 5. UI STATE MANAGEMENT
// ============================================================================

function updateUIState(forcePageUpdate = false) {
    if (uiUpdatePending) return;
    uiUpdatePending = true;

    requestAnimationFrame(() => {
        performUIUpdate(forcePageUpdate);
        uiUpdatePending = false;
    });
}

function performUIUpdate(forcePageUpdate) {
    const adminLinkContainer = document.getElementById('admin-link-container');
    const statUserBalanceEl = document.getElementById('statUserBalance');
    const connectButtonDesktop = document.getElementById('connectButtonDesktop');
    const connectButtonMobile = document.getElementById('connectButtonMobile');
    const mobileAppDisplay = document.getElementById('mobileAppDisplay');
    
    // Atualiza botões e textos de conexão
    if (State.isConnected && State.userAddress) {
        const balanceString = formatLargeBalance(State.currentUserBalance);
        
        if(connectButtonDesktop) connectButtonDesktop.textContent = `${balanceString} $BKC`;
        if(connectButtonMobile) connectButtonMobile.textContent = `${balanceString} $BKC`;
        
        if (mobileAppDisplay) { 
            mobileAppDisplay.textContent = 'Backcoin.org'; 
            mobileAppDisplay.classList.add('text-amber-400'); 
            mobileAppDisplay.classList.remove('text-white'); 
        }
        
        if (statUserBalanceEl) {
            statUserBalanceEl.textContent = formatBigNumber(State.currentUserBalance).toLocaleString('en-US', { 
                minimumFractionDigits: 2, maximumFractionDigits: 2 
            });
        }

        if (adminLinkContainer) { 
            adminLinkContainer.style.display = (State.userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()) ? 'block' : 'none'; 
        }
        
    } else {
        if(connectButtonDesktop) connectButtonDesktop.textContent = "Connect";
        if(connectButtonMobile) connectButtonMobile.textContent = "Connect";
        
        if (mobileAppDisplay) { 
            mobileAppDisplay.textContent = 'Backcoin.org'; 
            mobileAppDisplay.classList.add('text-amber-400'); 
            mobileAppDisplay.classList.remove('text-white'); 
        }
        
        if (adminLinkContainer) adminLinkContainer.style.display = 'none';
        if (statUserBalanceEl) statUserBalanceEl.textContent = '--';
    }

    // Lógica de Atualização da Página Atual
    // Se activePageId for null (primeiro load), forçamos 'dashboard'
    const targetPage = activePageId || 'dashboard';

    if (forcePageUpdate || !activePageId) {
        navigateTo(targetPage, true);
    } else {
        // Update leve se já estivermos na página
        if (routes[targetPage] && typeof routes[targetPage].update === 'function') {
            routes[targetPage].update(State.isConnected);
        }
    }
}

function onWalletStateChange(changes) {
    const { isConnected, address, isNewConnection, wasConnected } = changes;
    
    // Força update completo se houve mudança real de conexão
    const shouldForceUpdate = isNewConnection || (isConnected !== wasConnected);
    
    updateUIState(shouldForceUpdate); 
    
    if (isConnected && isNewConnection) {
        showToast(`Connected: ${formatAddress(address)}`, "success");
    } else if (!isConnected && wasConnected) {
        showToast("Wallet disconnected.", "info");
    }
}

// ============================================================================
// 6. EVENT LISTENERS
// ============================================================================

function initTestnetBanner() {
    const banner = document.getElementById('testnet-banner');
    const closeButton = document.getElementById('close-testnet-banner');
    if (!banner || !closeButton) return;

    if (localStorage.getItem('hideTestnetBanner') === 'true') {
        banner.remove();
        return;
    }
    banner.style.transform = 'translateY(0)'; 
    
    closeButton.addEventListener('click', () => {
        banner.style.transform = 'translateY(100%)'; 
        setTimeout(() => banner.remove(), 500);
        localStorage.setItem('hideTestnetBanner', 'true');
    });
}

function setupGlobalListeners() {
    const navItems = document.querySelectorAll('.sidebar-link');
    const menuButton = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const connectButton = document.getElementById('connectButtonDesktop');
    const connectButtonMobile = document.getElementById('connectButtonMobile');
    const shareButton = document.getElementById('shareProjectBtn');
    
    initTestnetBanner();

    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); 
                const pageId = item.dataset.target;
                if (pageId) {
                    navigateTo(pageId, false); 
                    if (sidebar && sidebar.classList.contains('translate-x-0')) {
                        sidebar.classList.remove('translate-x-0');
                        sidebar.classList.add('-translate-x-full');
                        if(sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
                    }
                }
            });
        });
    }
    
    if (connectButton) connectButton.addEventListener('click', openConnectModal);
    if (connectButtonMobile) connectButtonMobile.addEventListener('click', openConnectModal);
    if (shareButton) shareButton.addEventListener('click', () => showShareModal(State.userAddress));

    if (menuButton && sidebar && sidebarBackdrop) {
        menuButton.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('translate-x-0');
            if (isOpen) {
                sidebar.classList.add('-translate-x-full');
                sidebar.classList.remove('translate-x-0');
                sidebarBackdrop.classList.add('hidden');
            } else {
                sidebar.classList.remove('-translate-x-full');
                sidebar.classList.add('translate-x-0');
                sidebarBackdrop.classList.remove('hidden');
            }
        });
        
        sidebarBackdrop.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
            sidebarBackdrop.classList.add('hidden');
        });
    }
}

// ============================================================================
// 7. MAIN INITIALIZATION
// ============================================================================

window.addEventListener('load', async () => {
    console.log("🚀 App Initializing...");

    if (!DOMElements.earn) {
        DOMElements.earn = document.getElementById('mine'); 
    }

    try {
        const addressesLoaded = await loadAddresses(); 
        if (!addressesLoaded) throw new Error("Failed to load contract addresses");
    } catch (error) {
        console.error("❌ Critical Initialization Error:", error);
        showToast("Initialization failed. Please refresh.", "error");
        return;
    }
    
    setupGlobalListeners();

    await initPublicProvider(); 
    initWalletSubscriptions(onWalletStateChange);
    
    showWelcomeModal();
    
    const preloader = document.getElementById('preloader');
    if(preloader) preloader.style.display = 'none';
    
    // 🔴 FORÇA O PRIMEIRO RENDER DA DASHBOARD
    // Isso garante que o esqueleto "Loading..." seja substituído pelo conteúdo real
    navigateTo('dashboard', true);

    console.log("✅ App Ready.");
});

window.EarnPage = EarnPage; 
window.openConnectModal = openConnectModal;
window.disconnectWallet = disconnectWallet;
window.updateUIState = updateUIState;