// js/app.js
// ✅ ARQUIVO ATUALIZADO (SEM DAO)

// Função 'inject' (Vercel Analytics)
const inject = window.inject || (() => { console.warn("Vercel Analytics not loaded globally."); });

// A variável 'ethers' deve ser carregada via <script> tag no HTML.
const ethers = window.ethers; 

// Inject Vercel Analytics if not on localhost
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    inject();
}

import { DOMElements } from './dom-elements.js';
import { State } from './state.js';
import { initPublicProvider, initWalletSubscriptions, disconnectWallet, openConnectModal } from './modules/wallet.js';
import { showToast, showShareModal, showWelcomeModal } from './ui-feedback.js';
import { formatBigNumber } from './utils.js'; 
import { loadAddresses } from './config.js'; 

// Page imports
import { DashboardPage } from './pages/DashboardPage.js';
import { EarnPage } from './pages/networkstaking.js'; 
import { StorePage } from './pages/StorePage.js';
import { RewardsPage } from './pages/RewardsPage.js';
import { FortunePoolPage } from './pages/FortunePool.js'; 
import { AboutPage } from './pages/AboutPage.js';
import { AirdropPage } from './pages/AirdropPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { PresalePage } from './pages/PresalePage.js';
// REMOVIDO: import { DaoPage } from './pages/DaoPage.js';
import { FaucetPage } from './pages/FaucetPage.js';
import { TokenomicsPage } from './pages/TokenomicsPage.js';
import { NotaryPage } from './pages/NotaryPage.js';

// ============================================================================
// FORMATTING FUNCTIONS
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
// ROUTE CONFIGURATION
// ============================================================================

const routes = {
    'dashboard': DashboardPage,
    'mine': EarnPage, 
    'store': StorePage,
    'rewards': RewardsPage,
    'actions': FortunePoolPage, 
    'notary': NotaryPage,
    'airdrop': AirdropPage,
    // REMOVIDO: 'dao': DaoPage,
    'tokenomics': TokenomicsPage,
    'faucet': FaucetPage,
    'about': AboutPage,
    'admin': AdminPage,
    'presale': PresalePage,
};

let activePageId = 'dashboard';
const ADMIN_WALLET = '0x03aC69873293cD6ddef7625AfC91E3Bd5434562a'; 
let currentPageCleanup = null;

// ============================================================================
// WALLET STATE CHANGE HANDLER
// ============================================================================

function onWalletStateChange(changes) {
    const { isConnected, address, isNewConnection, wasConnected } = changes;
    console.log("Wallet State Changed (App):", changes);

    updateUIState(true); 
    
    if (isConnected && isNewConnection) {
        showToast(`Connected: ${formatAddress(address)}`, "success");
    } else if (!isConnected && wasConnected) {
        showToast("Wallet disconnected.", "info");
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function navigateTo(pageId, forceUpdate = false) {
    const pageContainer = document.querySelector('main > div.container');
    const navItems = document.querySelectorAll('.sidebar-link');

    if (!pageContainer || !navItems.length) {
        console.error("DOM elements for navigation not found.");
        return;
    }

    if (currentPageCleanup && typeof currentPageCleanup === 'function') {
        currentPageCleanup();
        currentPageCleanup = null;
    }

    Array.from(pageContainer.children).forEach(child => {
        if (child.tagName === 'SECTION') {
            child.classList.add('hidden');
            child.classList.remove('active');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        item.classList.add('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-700');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage && routes[pageId]) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active');
        
        const isNewPage = activePageId !== pageId;
        activePageId = pageId;

        const activeNavItem = document.querySelector(`.sidebar-link[data-target="${pageId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.remove('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-700');
            activeNavItem.classList.add('active');
        }

        if (routes[pageId] && typeof routes[pageId].render === 'function') {
            routes[pageId].render(isNewPage || forceUpdate);
        }
        
        if (typeof routes[pageId].cleanup === 'function') {
            currentPageCleanup = routes[pageId].cleanup;
        }
        
    } else {
        console.error(`Page ID '${pageId}' not found or route not defined.`);
        navigateTo('dashboard');
    }
}
window.navigateTo = navigateTo;

// ============================================================================
// UI STATE UPDATE
// ============================================================================

function updateUIState(forcePageUpdate = false) {
    const adminLinkContainer = document.getElementById('admin-link-container');
    const statUserBalanceEl = document.getElementById('statUserBalance');
    const connectButtonDesktop = document.getElementById('connectButtonDesktop');
    const connectButtonMobile = document.getElementById('connectButtonMobile');
    const mobileAppDisplay = document.getElementById('mobileAppDisplay');
    
    const checkElement = (el, name) => { 
        if (!el) console.warn(`Element ${name} not found in DOM during UI update.`); 
        return el; 
    };

    if (State.isConnected && State.userAddress) {
        const balanceString = formatLargeBalance(State.currentUserBalance);
        checkElement(connectButtonDesktop, 'connectButtonDesktop').textContent = `${balanceString} $BKC`;
        checkElement(connectButtonMobile, 'connectButtonMobile').textContent = `${balanceString} $BKC`;
        const mobileDisplayEl = checkElement(mobileAppDisplay, 'mobileAppDisplay');
        if (mobileDisplayEl) { 
            mobileDisplayEl.textContent = 'Backcoin.org'; 
            mobileDisplayEl.classList.add('text-amber-400'); 
            mobileDisplayEl.classList.remove('text-white'); 
        }
        const fullBalanceNum = formatBigNumber(State.currentUserBalance);
        if (statUserBalanceEl) {
            statUserBalanceEl.textContent = fullBalanceNum.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        }
        if (adminLinkContainer) { 
            adminLinkContainer.style.display = (State.userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()) ? 'block' : 'none'; 
        }
        
    } else {
        checkElement(connectButtonDesktop, 'connectButtonDesktop').textContent = "Connect";
        checkElement(connectButtonMobile, 'connectButtonMobile').textContent = "Connect";
        const mobileDisplayEl = checkElement(mobileAppDisplay, 'mobileAppDisplay');
        if (mobileDisplayEl) { 
            mobileDisplayEl.textContent = 'Backcoin.org'; 
            mobileDisplayEl.classList.add('text-amber-400'); 
            mobileDisplayEl.classList.remove('text-white'); 
        }
        if (adminLinkContainer) adminLinkContainer.style.display = 'none';
        if (statUserBalanceEl) statUserBalanceEl.textContent = '--';
    }

    navigateTo(activePageId, forcePageUpdate); 
}

// ============================================================================
// GLOBAL EVENT LISTENERS
// ============================================================================

function setupGlobalListeners() {
    const navItems = document.querySelectorAll('.sidebar-link');
    const menuButton = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const connectButton = document.getElementById('connectButtonDesktop');
    const connectButtonMobile = document.getElementById('connectButtonMobile');
    const shareButton = document.getElementById('shareProjectBtn');

    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageId = item.dataset.target;
                if (pageId) {
                    navigateTo(pageId, false); 
                    if (sidebar.classList.contains('translate-x-0')) {
                        sidebar.classList.remove('translate-x-0');
                        sidebar.classList.add('-translate-x-full');
                        sidebarBackdrop.classList.add('hidden');
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
            sidebar.classList.toggle('-translate-x-full');
            sidebar.classList.toggle('translate-x-0');
            sidebarBackdrop.classList.toggle('hidden');
        });
        sidebarBackdrop.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
            sidebarBackdrop.classList.add('hidden');
        });
    }
}

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

window.addEventListener('load', async () => {
    console.log("Window 'load' event fired. Starting initialization...");

    if (!DOMElements.earn) {
        DOMElements.earn = document.getElementById('mine'); 
    }

    try {
        const addressesLoaded = await loadAddresses(); 
        if (!addressesLoaded) return;
    } catch (error) {
        console.error("Critical failure loading addresses:", error);
        return;
    }
    
    setupGlobalListeners();

    await initPublicProvider(); 
    initWalletSubscriptions(onWalletStateChange);
    showWelcomeModal();
    console.log("Application initialization sequence complete.");
});

window.EarnPage = EarnPage; 
window.openConnectModal = openConnectModal;
window.disconnectWallet = disconnectWallet;
window.updateUIState = updateUIState;