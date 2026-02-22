// js/app.js
// ✅ VERSÃO FINAL V8.0: Added Agora page

const inject = window.inject || (() => { console.warn("Dev Mode: Analytics disabled."); });
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    try { inject(); } catch (e) { console.error("Analytics Error:", e); }
}

const ethers = window.ethers;

import { DOMElements } from './dom-elements.js';
import { State } from './state.js';
import { initPublicProvider, initWalletSubscriptions, disconnectWallet, openConnectModal } from './modules/wallet.js';
import { showToast, showShareModal, showWelcomeModal, dismissSplash, openModal, closeModal } from './ui-feedback.js';
import { formatBigNumber } from './utils.js'; 
import { loadAddresses } from './config.js'; 

// V7.9: Import from new transaction module
import { executeFaucetClaim } from './modules/transactions/faucet-tx.js'; 

// Page Imports (Presale Removido)
import { DashboardPage } from './pages/DashboardPage.js';
import { StakingPage } from './pages/StakingPage.js';
import { StorePage } from './pages/StorePage.js';
// RewardsPage removed — merged into StakingPage (Stake & Earn)
import { FortunePoolPage } from './pages/FortunePool.js'; 
import { AboutPage } from './pages/AboutPage.js';
import { AirdropPage } from './pages/AirdropPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { TokenomicsPage } from './pages/TokenomicsPage.js';
import { NotaryPage } from './pages/notary/NotaryPage.js';
import { RentalPage } from './pages/RentalPage.js';
import { SocialMediaPage } from './pages/SocialMedia.js';
// CreditCardPage, DexPage, DaoPage removed (were demo placeholders)
import { TutorialsPage } from './pages/TutorialsPage.js';
import { CharityPage } from './pages/CharityPage.js';
import { AgoraPage } from './pages/agora/AgoraPage.js';
import { ReferralPage } from './pages/ReferralPage.js';
import { OperatorPage } from './pages/OperatorPage.js';
import { TradePage } from './pages/TradePage.js';

// ============================================================================
// 2. CONFIGURATION & STATE
// ============================================================================

// ✅ Admin wallet via environment variable (Vercel)
const ADMIN_WALLET = (import.meta.env.VITE_ADMIN_WALLET || "").toLowerCase();

// Expõe globalmente para o index.html poder verificar
window.__ADMIN_WALLET__ = ADMIN_WALLET;
if (ADMIN_WALLET) {
    console.log("✅ Admin access granted");
} 

let activePageId = null; 
let currentPageCleanup = null;
let uiUpdatePending = false; 

const routes = {
    'dashboard': DashboardPage,
    'staking': StakingPage,
    'store': StorePage,
    'fortune': FortunePoolPage,
    'charity': CharityPage,
    'agora': AgoraPage,
    'notary': NotaryPage,
    'airdrop': AirdropPage,
    'tokenomics': TokenomicsPage,
    'about': AboutPage,
    'admin': AdminPage,
    'rental': RentalPage,
    'socials': SocialMediaPage,
    'tutorials': TutorialsPage,
    'referral': ReferralPage,
    'operator': OperatorPage,
    'trade': TradePage,
    // Legacy aliases — redirect old URLs
    'mine': StakingPage,
    'rewards': StakingPage,
    'actions': FortunePoolPage,
    'backchat': AgoraPage
};

// ============================================================================
// 3. FORMATTING HELPERS
// ============================================================================

function formatAddress(addr) {
    if (!addr || addr.length < 42) return '...';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`; 
}

function formatLargeBalance(bigNum) {
    if (!bigNum) return "0.00";
    const num = formatBigNumber(bigNum);
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 10_000) return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================================================
// 4. NAVIGATION ENGINE (✅ FIXED: Better page transition)
// ============================================================================

function navigateTo(pageId, forceUpdate = false) {
    const pageContainer = document.querySelector('main > div.container');
    const navItems = document.querySelectorAll('.sidebar-link');

    if (!pageContainer) {
        console.error('❌ Page container not found');
        return;
    }

    // ✅ Redirect legacy routes to SEO-friendly names
    const legacyRedirects = { 'rewards': 'staking', 'mine': 'staking', 'actions': 'fortune', 'backchat': 'agora' };
    if (legacyRedirects[pageId]) {
        pageId = legacyRedirects[pageId];
        window.location.hash = pageId;
    }

    // ✅ FIX: Always process navigation when coming from a deep link
    const isComingFromDeepLink = window.location.hash.includes('/');
    const shouldNavigate = activePageId !== pageId || forceUpdate || isComingFromDeepLink;

    if (!shouldNavigate) {
        // Just update if same page
        if (routes[pageId] && typeof routes[pageId].update === 'function') {
            routes[pageId].update(State.isConnected);
        }
        return; 
    }

    console.log(`📍 Navigating: ${activePageId} → ${pageId} (force: ${forceUpdate})`);

    // Cleanup previous page
    if (currentPageCleanup && typeof currentPageCleanup === 'function') {
        currentPageCleanup();
        currentPageCleanup = null;
    }

    // ✅ FIX: Hide ALL sections, including any dynamically created content
    Array.from(pageContainer.children).forEach(child => {
        if (child.tagName === 'SECTION') {
            child.classList.add('hidden');
            child.classList.remove('active');
        }
    });

    // ✅ FIX: Also clear any page-specific containers that might persist
    const charityContainer = document.getElementById('charity-container');
    if (charityContainer && pageId !== 'charity') {
        charityContainer.innerHTML = '';
    }

    // Reset nav items — only remove active, don't add generic colors
    // (Grow section links have custom amber/emerald colors)
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    
    if (targetPage && routes[pageId]) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active');
        
        const wasNewPage = activePageId !== pageId;
        activePageId = pageId;

        // Highlight nav item (sidebar)
        const activeNavItem = document.querySelector(`.sidebar-link[data-target="${pageId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.remove('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-700');
            activeNavItem.classList.add('active');
        }

        // Highlight bottom tab (mobile)
        document.querySelectorAll('.bottom-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.bottom-tab[data-target="${pageId}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Render page
        if (routes[pageId] && typeof routes[pageId].render === 'function') {
            routes[pageId].render(wasNewPage || forceUpdate);
        }
        
        // Set cleanup function
        if (typeof routes[pageId].cleanup === 'function') {
            currentPageCleanup = routes[pageId].cleanup;
        }
        
        // Scroll to top on new page
        if (wasNewPage) {
            window.scrollTo(0, 0);
        }

    } else {
        if (pageId !== 'dashboard' && pageId !== 'faucet') { 
            console.warn(`Route '${pageId}' not found, redirecting to dashboard.`);
            navigateTo('dashboard', true);
        }
    }
}
window.navigateTo = navigateTo;

// ============================================================================
// 5. UI STATE MANAGEMENT (FINAL FIX)
// ============================================================================

const BASE_BTN_CLASSES = "wallet-btn text-xs font-mono text-center max-w-fit whitespace-nowrap relative font-bold py-2 px-4 rounded-md transition-colors";

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
    
    // 🔥 FIX: Confia APENAS no State.userAddress (preenchido pelo wallet.js)
    let currentAddress = State.userAddress; 
    
    const connectBtns = [connectButtonDesktop, connectButtonMobile];
    
    if (State.isConnected && currentAddress) {
        const balanceString = formatLargeBalance(State.currentUserBalance);
        const shortAddress = formatAddress(currentAddress);
        
        // Estilo "Conectado"
        const btnContent = `
            <div class="status-dot"></div>
            <span>${shortAddress}</span>
            <div class="balance-pill">
                ${balanceString} BKC
            </div>
        `;

        connectBtns.forEach(btn => {
            if (btn) {
                btn.innerHTML = btnContent;
                // Aplica BASE + classe de ESTADO
                btn.className = BASE_BTN_CLASSES + " wallet-btn-connected";
            }
        });
        
        // Atualiza textos auxiliares
        if (mobileAppDisplay) { 
            mobileAppDisplay.textContent = 'Backcoin.org'; 
            mobileAppDisplay.classList.add('text-white'); 
            mobileAppDisplay.classList.remove('text-amber-400'); 
        }
        
        // Admin link visibility
        if (adminLinkContainer) {
            const isAdmin = currentAddress.toLowerCase() === ADMIN_WALLET;
            adminLinkContainer.style.display = isAdmin ? 'block' : 'none';
        }
        
        // Update balance display
        if (statUserBalanceEl) {
            statUserBalanceEl.textContent = balanceString;
        }

    } else {
        // Estilo "Desconectado"
        const defaultText = `<i class="fa-solid fa-plug"></i> Connect Wallet`;
        
        connectBtns.forEach(btn => {
            if (btn) {
                btn.innerHTML = defaultText;
                // Aplica BASE + classe de ESTADO
                btn.className = BASE_BTN_CLASSES + " wallet-btn-disconnected";
            }
        });

        if (mobileAppDisplay) { 
            mobileAppDisplay.textContent = 'Backcoin.org'; 
            mobileAppDisplay.classList.add('text-amber-400'); 
            mobileAppDisplay.classList.remove('text-white'); 
        }
        
        if (adminLinkContainer) adminLinkContainer.style.display = 'none';
        if (statUserBalanceEl) statUserBalanceEl.textContent = '--';
    }

    const targetPage = activePageId || 'dashboard';

    if (forcePageUpdate || !activePageId) {
        navigateTo(targetPage, true);
    } else {
        if (routes[targetPage] && typeof routes[targetPage].update === 'function') {
            routes[targetPage].update(State.isConnected);
        }
    }
}

function onWalletStateChange(changes) {
    const { isConnected, address, isNewConnection, wasConnected } = changes;
    const shouldForceUpdate = isNewConnection || (isConnected !== wasConnected);
    
    // Atualiza o estado global
    State.isConnected = isConnected;
    if(address) State.userAddress = address;

    updateUIState(shouldForceUpdate); 
    
    if (isConnected && isNewConnection) {
        showToast(`Connected: ${formatAddress(address)}`, "success");
        // Gasless tutor onboarding: auto-set tutor + faucet bonus via API
        if (localStorage.getItem('backchain_tutor')) {
            processTutorAfterConnect();
        }
    }
    else if (!isConnected && wasConnected) showToast("Wallet disconnected.", "info");
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
            item.addEventListener('click', async (e) => {
                e.preventDefault(); 
                const pageId = item.dataset.target;
                
                if (pageId === 'faucet') {
                    showToast("Accessing Testnet Faucet...", "info");
                    const success = await executeFaucetClaim(null);
                    if (success) updateUIState(true);
                    return; 
                }

                if (pageId) {
                    // ✅ FIX: Clear any sub-routes when navigating via sidebar
                    // This ensures we go to the main page, not a deep link
                    window.location.hash = pageId;
                    navigateTo(pageId, true); // Force update to ensure clean transition
                    
                    // Close sidebar on mobile
                    if (sidebar && sidebar.classList.contains('translate-x-0')) {
                        sidebar.classList.remove('translate-x-0');
                        sidebar.classList.add('-translate-x-full');
                        if(sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
                    }
                }
            });
        });
    }
    
    // Lógica de Conectar/Desconectar Unificada
    const handleConnectClick = () => {
        openConnectModal(); 
    };

    if (connectButton) connectButton.addEventListener('click', handleConnectClick);
    if (connectButtonMobile) connectButtonMobile.addEventListener('click', handleConnectClick);
    
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

    // ✅ Mobile Bottom Tab Bar
    const bottomTabs = document.querySelectorAll('.bottom-tab[data-target]');
    bottomTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const pageId = tab.dataset.target;
            window.location.hash = pageId;
            navigateTo(pageId, true);
        });
    });

    // ✅ "More" Drawer
    const moreTabBtn = document.getElementById('more-tab-btn');
    const moreDrawer = document.getElementById('more-drawer');
    const moreDrawerBackdrop = document.getElementById('more-drawer-backdrop');

    if (moreTabBtn && moreDrawer && moreDrawerBackdrop) {
        moreTabBtn.addEventListener('click', () => {
            const isOpen = !moreDrawer.classList.contains('translate-y-full');
            if (isOpen) {
                moreDrawer.classList.add('translate-y-full');
                moreDrawerBackdrop.classList.add('hidden');
            } else {
                moreDrawer.classList.remove('translate-y-full');
                moreDrawerBackdrop.classList.remove('hidden');
            }
        });
        moreDrawerBackdrop.addEventListener('click', () => {
            moreDrawer.classList.add('translate-y-full');
            moreDrawerBackdrop.classList.add('hidden');
        });
    }

    const moreDrawerItems = document.querySelectorAll('.more-drawer-item[data-target]');
    moreDrawerItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.dataset.target;
            window.location.hash = pageId;
            navigateTo(pageId, true);
            // Close drawer
            if (moreDrawer) moreDrawer.classList.add('translate-y-full');
            if (moreDrawerBackdrop) moreDrawerBackdrop.classList.add('hidden');
        });
    });
}

// ============================================================================
// 7. MAIN INITIALIZATION (✅ FIXED: URL Hash Routing)
// ============================================================================

/**
 * ✅ FIX: Parse URL hash to determine initial page
 * Supports formats like:
 * - #charity
 * - #charity/campaign/6
 * - #backchat?ref=0xABC...123  (viral referral)
 * - #dashboard
 */
function getInitialPageFromHash() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return 'dashboard';

    // Get the base route (first part before any / or ?)
    const baseRoute = hash.split(/[/?]/)[0];

    // Check if it's a valid route
    if (routes[baseRoute]) {
        return baseRoute;
    }

    return 'dashboard';
}

/**
 * Capture tutor param from URL hash (?ref=0x...)
 * Stores in localStorage for deferred execution (wallet may not be connected yet).
 */
function captureTutorParam() {
    try {
        const hash = window.location.hash;
        const qIndex = hash.indexOf('?');
        if (qIndex === -1) return;

        const params = new URLSearchParams(hash.substring(qIndex));
        const ref = params.get('ref');

        if (ref && /^0x[a-fA-F0-9]{40}$/.test(ref)) {
            const existing = localStorage.getItem('backchain_tutor');
            if (!existing) {
                localStorage.setItem('backchain_tutor', ref);
                console.log('[Tutor] Captured tutor from URL:', ref);
            }
        }
    } catch (e) {
        console.warn('[Tutor] Failed to parse tutor param:', e.message);
    }
}

// ============================================================================
// TUTOR WELCOME OVERLAY — Gasless onboarding
// ============================================================================

async function processTutorAfterConnect() {
    const tutor = localStorage.getItem('backchain_tutor');
    if (!tutor || !State.isConnected || !State.userAddress) return;
    if (tutor.toLowerCase() === State.userAddress.toLowerCase()) {
        localStorage.removeItem('backchain_tutor');
        return;
    }

    try {
        const response = await fetch('/api/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: State.userAddress,
                referrerAddress: tutor
            })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.removeItem('backchain_tutor');

            // Show success feedback via toast (no intrusive modal)
            if (data.referrerSet) {
                showToast('Tutor registered! You are now earning referral rewards.', 'success');
            }
            if (data.faucetClaimed) {
                showToast(`Welcome bonus: ${data.ethAmount || '0.01'} ETH sent to your wallet!`, 'success');
            }
        } else {
            localStorage.removeItem('backchain_tutor');
            if (data.error) showToast(data.error, 'warning');
        }
    } catch (e) {
        console.warn('[Tutor] API call failed:', e.message);
        showToast('Tutor setup failed. You can set it manually on the Tutor page.', 'warning');
    }
}

window.addEventListener('load', async () => {
    console.log("🚀 App Initializing...");

    if (!DOMElements.earn) {
        DOMElements.earn = document.getElementById('staking');
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

    // Capture tutor param before navigation
    captureTutorParam();

    // Remove initial loader placeholder once app is ready
    const initLoader = document.getElementById('initial-loader-container');
    if (initLoader) initLoader.remove();

    // Welcome splash is already in index.html (renders while JS loads).
    // Tutor param is saved silently in localStorage — no special modal.
    // Tutor registration happens automatically when user connects wallet.
    const existingSplash = document.getElementById('welcome-splash');
    if (existingSplash) {
        existingSplash.addEventListener('click', () => dismissSplash());
        setTimeout(() => dismissSplash(), 2500);
    }

    // ✅ FIX: Navigate to the page specified in URL hash, or dashboard if none
    const initialPage = getInitialPageFromHash();
    console.log("📍 Initial page from URL:", initialPage, "Hash:", window.location.hash);
    navigateTo(initialPage, true);

    console.log("✅ App Ready.");
});

// ✅ FIX: Listen for hash changes (browser back/forward, direct URL changes)
window.addEventListener('hashchange', () => {
    captureTutorParam();
    const newPage = getInitialPageFromHash();
    const currentHash = window.location.hash;
    
    console.log("🔄 Hash changed to:", newPage, "Full hash:", currentHash);
    
    // ✅ FIX: Always navigate if it's a different base page
    // This ensures proper cleanup and re-render
    if (newPage !== activePageId) {
        navigateTo(newPage, true);
    } else if (newPage === 'charity') {
        // For charity page, we need to handle sub-routes like /campaign/6
        // The CharityPage itself will handle the detail view
        if (routes[newPage] && typeof routes[newPage].render === 'function') {
            routes[newPage].render(true);
        }
    }
});

window.StakingPage = StakingPage;
window.openConnectModal = openConnectModal;
window.disconnectWallet = disconnectWallet;
window.updateUIState = updateUIState;