// app.js
// ✅ ARQUIVO CORRIGIDO

import { inject } from 'https://esm.sh/@vercel/analytics';

// Inject Vercel Analytics if not on localhost
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    inject();
}

const ethers = window.ethers;

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
import { DaoPage } from './pages/DaoPage.js';
import { FaucetPage } from './pages/FaucetPage.js';
import { TokenomicsPage } from './pages/TokenomicsPage.js';
import { NotaryPage } from './pages/NotaryPage.js';

// ============================================================================
// FORMATTING FUNCTIONS (Conteúdo Omitido por ser idêntico)
// ============================================================================

/**
 * Format wallet address to 0x + 2 chars... + 3 chars
 */
function formatAddress(addr) {
    if (!addr || addr.length < 42) return '...';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`; 
}

/**
 * Format balance (in Wei) to M (Millions) or B (Billions)
 */
function formatLargeBalance(bigNum) {
    const num = formatBigNumber(bigNum);
    
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(2) + 'B';
    }
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(2) + 'M';
    }
    if (num >= 10_000) {
        return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================================================
// ROUTE CONFIGURATION (Conteúdo Omitido por ser idêntico)
// ============================================================================

const routes = {
    'dashboard': DashboardPage,
    'mine': EarnPage, 
    'store': StorePage,
    'rewards': RewardsPage,
    'actions': FortunePoolPage, 
    'notary': NotaryPage,
    'airdrop': AirdropPage,
    'dao': DaoPage,
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
// WALLET STATE CHANGE HANDLER (Conteúdo Omitido por ser idêntico)
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
// NAVIGATION (Conteúdo Omitido por ser idêntico)
// ============================================================================

/**
 * Navigate to a specific page
 */
function navigateTo(pageId, forceUpdate = false) {
    const pageContainer = document.querySelector('main > div.container');
    const navItems = document.querySelectorAll('.sidebar-link');

    if (!pageContainer || !navItems.length) {
        console.error("DOM elements for navigation not found.");
        return;
    }

    // Call cleanup function for previous page
    if (currentPageCleanup && typeof currentPageCleanup === 'function') {
        console.log(`Cleaning up previous page: ${activePageId}`);
        currentPageCleanup();
        currentPageCleanup = null;
    }

    // Hide all pages
    Array.from(pageContainer.children).forEach(child => {
        if (child.tagName === 'SECTION') {
            child.classList.add('hidden');
            child.classList.remove('active');
        }
    });

    // Remove active state from nav items
    navItems.forEach(item => {
        item.classList.remove('active');
        item.classList.add('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-700');
    });

    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage && routes[pageId]) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active');
        
        const isNewPage = activePageId !== pageId;
        activePageId = pageId;

        // Mark nav item as active
        const activeNavItem = document.querySelector(`.sidebar-link[data-target="${pageId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.remove('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-700');
            activeNavItem.classList.add('active');
        }

        // Render page
        if (routes[pageId] && typeof routes[pageId].render === 'function') {
            routes[pageId].render(isNewPage || forceUpdate);
        }
        
        // Store cleanup function if page provides one
        if (typeof routes[pageId].cleanup === 'function') {
            currentPageCleanup = routes[pageId].cleanup;
        }
        
    } else {
        console.error(`Page ID '${pageId}' not found or route not defined.`);
        navigateTo('dashboard'); // Volta para o dashboard em caso de erro
    }
}
window.navigateTo = navigateTo;

// ============================================================================
// UI STATE UPDATE (Conteúdo Omitido por ser idêntico)
// ============================================================================

/**
 * Update all UI elements based on global State
 */
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
        // Connected state
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
        // Disconnected state
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

    // Trigger re-render of active page
    navigateTo(activePageId, forcePageUpdate); 
}

// ============================================================================
// GLOBAL EVENT LISTENERS (Conteúdo Omitido por ser idêntico)
// ============================================================================

function setupGlobalListeners() {
    const navItems = document.querySelectorAll('.sidebar-link');
    const menuButton = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const connectButton = document.getElementById('connectButtonDesktop');
    const connectButtonMobile = document.getElementById('connectButtonMobile');
    const shareButton = document.getElementById('shareProjectBtn');

    // 1. Sidebar navigation
    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageId = item.dataset.target;
                if (pageId) {
                    navigateTo(pageId, false); 
                    // Close mobile sidebar
                    if (sidebar.classList.contains('translate-x-0')) {
                        sidebar.classList.remove('translate-x-0');
                        sidebar.classList.add('-translate-x-full');
                        sidebarBackdrop.classList.add('hidden');
                    }
                }
            });
        });
    } else {
        console.warn("No sidebar navigation items found.");
    }
    
    // 2. Connect buttons
    if (connectButton) {
        connectButton.addEventListener('click', openConnectModal);
    }
    if (connectButtonMobile) {
        connectButtonMobile.addEventListener('click', openConnectModal);
    }
    
    // 3. Share button
    if (shareButton) {
        shareButton.addEventListener('click', () => {
            showShareModal(State.userAddress);
        });
    }

    // 4. Mobile menu button
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

    console.log("Global listeners attached.");
}

// ============================================================================
// APPLICATION INITIALIZATION (Ajustada)
// ============================================================================

window.addEventListener('load', async () => {
    console.log("Window 'load' event fired. Starting initialization...");

    if (!DOMElements.earn) {
        console.warn("DOMElements.earn was null. Attempting re-initialization...");
        DOMElements.earn = document.getElementById('mine'); 
        
        if (DOMElements.earn) {
            console.log("✅ DOMElements.earn re-initialized successfully to 'mine'.");
        } else {
            console.error("❌ CRITICAL: Could not find element with ID 'mine' after load.");
        }
    }

    try {
        // 1. Load contract addresses
        const addressesLoaded = await loadAddresses(); 
        
        if (!addressesLoaded) {
            console.error("Failed to load addresses. Application cannot continue.");
            return; 
        }
        console.log("Addresses loaded successfully.");
    
    } catch (error) {
        console.error("Critical failure loading addresses:", error);
        document.body.innerHTML = `<div style="color: red; padding: 20px; font-family: sans-serif; font-size: 1.2rem; background: #222; border: 1px solid red; margin: 20px;">
            <b>Error:</b> Could not load <code>deployment-addresses.json</code>.
            <br><br><b>Solution:</b> Verify the file exists in project root and refresh the page.
            <br><br><small>${error.message}</small></div>`;
        return;
    }
    
    setupGlobalListeners();

    // 2. Initialize public provider (CRITICAL). This loads public data and calls updateUIState().
    await initPublicProvider(); 
    console.log("Public provider initialized and public data loaded.");
    
    /* * CORREÇÃO: Remova a chamada forçada para evitar renderização duplicada.
     * updateUIState(true); 
     * A função initWalletSubscriptions abaixo já dispara a primeira renderização
     * (de estado desconectado) no seu callback onWalletStateChange.
     */
    
    // 3. Subscribe to wallet changes
    // O callback dentro desta função dispara a primeira renderização da UI.
    initWalletSubscriptions(onWalletStateChange);

    // 4. Show welcome modal
    showWelcomeModal();

    // A navegação é acionada por updateUIState()

    console.log("Application initialization sequence complete. Waiting for wallet state...");
});

// ============================================================================
// GLOBAL EXPORTS (Conteúdo Omitido por ser idêntico)
// ============================================================================

window.EarnPage = EarnPage; 
window.openConnectModal = openConnectModal;
window.disconnectWallet = disconnectWallet;
window.updateUIState = updateUIState;