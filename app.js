// app.js (AJUSTADO: Adicionada a lógica global de troca de abas)

const ethers = window.ethers;

import { DOMElements } from './dom-elements.js';
import { State } from './state.js';
import { initPublicProvider, initializeWalletState, disconnectWallet, openConnectModal } from './modules/wallet.js';
import { showToast, showShareModal, showWelcomeModal } from './ui-feedback.js';
import { formatBigNumber, formatAddress } from './utils.js';
import { loadAddresses } from './config.js'; 

// Importações das Páginas (CORRIGIDO: O nome do componente importado DEVE ser 'TigerGamePage')
import { DashboardPage } from './pages/DashboardPage.js';
import { EarnPage } from './pages/EarnPage.js';
import { StorePage } from './pages/StorePage.js';
import { RewardsPage } from './pages/RewardsPage.js';
import { TigerGamePage } from './pages/TigerGame.js'; 
import { AboutPage } from './pages/AboutPage.js';
import { AirdropPage } from './pages/AirdropPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { PresalePage } from './pages/PresalePage.js';
import { DaoPage } from './pages/DaoPage.js';
import { FaucetPage } from './pages/FaucetPage.js';
import { TokenomicsPage } from './pages/TokenomicsPage.js';
import { NotaryPage } from './pages/NotaryPage.js';


// Mapeamento de rotas
const routes = {
    'dashboard': DashboardPage,
    'earn': EarnPage,
    'store': StorePage,
    'rewards': RewardsPage,
    'actions': TigerGamePage, // Mapeia 'actions' (ID do HTML) para o componente TigerGamePage
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


// --- FUNÇÕES DE NAVEGAÇÃO E ESTADO DA UI ---

function onWalletStateChange(changes) {
    const { isConnected, address, isNewConnection, wasConnected } = changes;
    console.log("Wallet State Changed:", changes);

    updateUIState();
    
    if (isConnected && isNewConnection) {
        showToast(`Connected: ${formatAddress(address)}`, "success");
    } else if (!isConnected && wasConnected) {
        showToast("Wallet disconnected.", "info");
    }
}

/**
 * Altera a página ativa da aplicação.
 */
function navigateTo(pageId) {
    const pageContainer = document.querySelector('main > div.container');
    const navItems = document.querySelectorAll('.sidebar-link');

    if (!pageContainer || !navItems.length) {
        console.error("DOM elements for navigation not found.");
        return;
    }

    // 1. Esconde todas as páginas
    Array.from(pageContainer.children).forEach(child => {
        if (child.tagName === 'SECTION') {
            child.classList.add('hidden');
            child.classList.remove('active');
        }
    });

    // 2. Remove o estado ativo de todos os itens da navegação
    navItems.forEach(item => {
        item.classList.remove('active');
        item.classList.add('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-700');
    });

    // 3. Exibe a página alvo
    const targetPage = document.getElementById(pageId);
    if (targetPage && routes[pageId]) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active');
        activePageId = pageId;

        // 4. Marca o item de navegação como ativo
        const activeNavItem = document.querySelector(`.sidebar-link[data-target="${pageId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // 5. Renderiza/Atualiza o conteúdo da página
        if (routes[pageId]) {
             if (typeof routes[pageId].render === 'function') {
                routes[pageId].render(true);
            }
        }
        
    } else {
        // Se a rota não for encontrada, tentamos navegar para o Dashboard
        console.error(`Page ID '${pageId}' not found or route not defined.`);
        navigateTo('dashboard');
    }
}
window.navigateTo = navigateTo;

function updateConnectionStatus(status, text) {
    const mobileStatusEl = document.getElementById('connectionStatus');
    if (!mobileStatusEl) return;

    const icon = mobileStatusEl.querySelector('i');
    const textSpan = mobileStatusEl.querySelector('span:last-child');
    if(!icon || !textSpan) return;

    textSpan.textContent = text;
    mobileStatusEl.classList.remove('bg-red-500/20', 'text-red-400');
    
    if (status === 'connected') {
        mobileStatusEl.classList.remove('hidden');
        mobileStatusEl.classList.add('bg-green-500/20', 'text-green-400');
        icon.classList.add('text-green-400');
        icon.classList.remove('text-red-400');
    } else if (status === 'disconnected') {
        mobileStatusEl.classList.remove('hidden');
        mobileStatusEl.classList.add('bg-red-500/20', 'text-red-400');
        icon.classList.add('text-red-400');
        icon.classList.remove('text-green-400');
    } else {
        mobileStatusEl.classList.add('hidden');
    }
}


/**
 * Atualiza todos os elementos da UI com base no State global (conectado/desconectado, saldos, etc.).
 */
function updateUIState() {
    const adminLinkContainer = document.getElementById('admin-link-container');
    const statUserBalanceEl = document.getElementById('statUserBalance'); 

    const desktopDisconnected = document.getElementById('desktopDisconnected');
    const desktopConnectedInfo = document.getElementById('desktopConnectedInfo');
    const desktopUserAddress = document.getElementById('desktopUserAddress');
    const desktopUserBalance = document.getElementById('desktopUserBalance');
    const connectButtonMobile = document.getElementById('connectButtonMobile');
    const mobileAppDisplay = document.getElementById('mobileAppDisplay');
    const mobileSettingsButton = document.getElementById('mobileSettingsButton');
    const popMiningTab = document.getElementById('pop-mining-tab');
    const validatorSectionTab = document.getElementById('validator-section-tab');

    const checkElement = (el, name) => { if (!el) console.warn(`Element ${name} not found in DOM during UI update.`); return el; };

    if (State.isConnected && State.userAddress) {
        // --- ESTADO CONECTADO ---
        const balanceNum = formatBigNumber(State.currentUserBalance);
        const balanceString = `${balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const addressFormatted = formatAddress(State.userAddress);

        // Desktop Conectado
        checkElement(desktopDisconnected, 'desktopDisconnected')?.classList.add('hidden');
        const desktopInfoEl = checkElement(desktopConnectedInfo, 'desktopConnectedInfo');
        if (desktopInfoEl) { 
            desktopInfoEl.classList.remove('hidden'); 
            desktopInfoEl.classList.add('flex'); 
            desktopInfoEl.style.display = 'flex';
        }
        checkElement(desktopUserAddress, 'desktopUserAddress').textContent = addressFormatted;
        checkElement(desktopUserBalance, 'desktopUserBalance').textContent = `${balanceString} $BKC`;

        // Mobile Conectado
        checkElement(connectButtonMobile, 'connectButtonMobile')?.classList.add('hidden');
        checkElement(mobileSettingsButton, 'mobileSettingsButton')?.classList.remove('hidden');
        const mobileDisplayEl = checkElement(mobileAppDisplay, 'mobileAppDisplay');
        if (mobileDisplayEl) { mobileDisplayEl.textContent = `${balanceString} $BKC`; mobileDisplayEl.classList.remove('text-amber-400'); mobileDisplayEl.classList.add('text-white'); }

        // Elementos de contexto
        if (statUserBalanceEl) statUserBalanceEl.textContent = balanceString;
        if (popMiningTab) popMiningTab.style.display = 'block';
        if (validatorSectionTab) validatorSectionTab.style.display = 'block';
        if (adminLinkContainer) { adminLinkContainer.style.display = (State.userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()) ? 'block' : 'none'; }
        updateConnectionStatus('connected', addressFormatted);

    } else {
        // --- ESTADO DESCONECTADO ---
        
        // Desktop Desconectado
        checkElement(desktopDisconnected, 'desktopDisconnected')?.classList.remove('hidden');
        const desktopInfoEl = checkElement(desktopConnectedInfo, 'desktopConnectedInfo');
        if (desktopInfoEl) { 
            desktopInfoEl.classList.add('hidden'); 
            desktopInfoEl.classList.remove('flex');
            desktopInfoEl.style.display = 'none';
        }

        // Mobile Desconectado
        checkElement(connectButtonMobile, 'connectButtonMobile')?.classList.remove('hidden');
        checkElement(mobileSettingsButton, 'mobileSettingsButton')?.classList.add('hidden');
        const mobileDisplayEl = checkElement(mobileAppDisplay, 'mobileAppDisplay');
        if (mobileDisplayEl) { mobileDisplayEl.textContent = 'Backchain'; mobileDisplayEl.classList.add('text-amber-400'); mobileDisplayEl.classList.remove('text-white'); }

        // Elementos de contexto
        if (popMiningTab) popMiningTab.style.display = 'none';
        if (validatorSectionTab) validatorSectionTab.style.display = 'none';
        if (adminLinkContainer) adminLinkContainer.style.display = 'none';
        if (statUserBalanceEl) statUserBalanceEl.textContent = '--';
        updateConnectionStatus('disconnected', 'Disconnected');
    }

    // A atualização da página ativa deve ser feita após a atualização do estado da conexão.
    // Navega para a página ativa para acionar o re-render
    navigateTo(activePageId); 
}


// --- LISTENERS E INICIALIZAÇÃO GLOBAL ---

function setupGlobalListeners() {
    const navItems = document.querySelectorAll('.sidebar-link');
    const menuButton = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const connectButton = document.getElementById('connectButtonDesktop');
    const connectButtonMobile = document.getElementById('connectButtonMobile');
    const desktopConnectedInfo = document.getElementById('desktopConnectedInfo');
    const shareButton = document.getElementById('shareProjectBtn');

    // 1. Navegação Lateral (Sidebar)
    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageId = item.dataset.target;
                if (pageId) {
                    navigateTo(pageId);
                    // Fechar o sidebar mobile após a navegação
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
    
    // 2. Botões de Conexão
    if (connectButton) {
        connectButton.addEventListener('click', openConnectModal);
    }
    if (connectButtonMobile) {
        connectButtonMobile.addEventListener('click', openConnectModal);
    }
    
    // 3. Botão de Configurações/Logout (Desktop - o wrapper)
    if (desktopConnectedInfo) {
        desktopConnectedInfo.addEventListener('click', () => {
            openConnectModal(); // Abre o modal do Web3Modal (que permite desconectar)
        });
    }

    // 4. Botão de Compartilhar
    if (shareButton) {
        shareButton.addEventListener('click', () => {
            showShareModal(State.userAddress);
        });
    }


    // 5. Botão de menu mobile
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

    // ==================================================================
    // === INÍCIO DA CORREÇÃO: LÓGICA DE TROCA DE ABAS (FALTANTE) ===
    // ==================================================================
    
    // Este listener global irá gerenciar todas as trocas de abas da aplicação
    document.body.addEventListener('click', (e) => {
        const tabButton = e.target.closest('.tab-btn');
        
        if (!tabButton) return; // O clique não foi em um botão de aba
        if (tabButton.classList.contains('active')) return; // A aba já está ativa
        
        e.preventDefault();
        
        const targetId = tabButton.dataset.target;
        const targetContent = document.getElementById(targetId);
        
        if (!targetContent) {
            console.warn(`Conteúdo da aba (targetId: '${targetId}') não encontrado.`);
            return;
        }

        // 1. Encontra o container de navegação (pai dos botões)
        const nav = tabButton.closest('nav');
        if (nav) {
            // Remove 'active' de todos os botões irmãos
            nav.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        }
        
        // 2. Ativa o botão clicado
        tabButton.classList.add('active');

        // 3. Encontra o container de conteúdo (pai dos .tab-content)
        // Isso assume que os .tab-content são irmãos do targetContent
        const contentHost = targetContent.parentElement;
        if (contentHost) {
            // Esconde todos os .tab-content irmãos
            Array.from(contentHost.children).forEach(child => {
                if (child.classList.contains('tab-content')) {
                    child.classList.add('hidden'); // O CSS usa 'hidden'
                    child.classList.remove('active'); // O CSS também usa 'active'
                }
            });
        }
        
        // 4. Mostra o conteúdo alvo
        targetContent.classList.remove('hidden');
        targetContent.classList.add('active');
    });

    // ==================================================================
    // === FIM DA CORREÇÃO ===
    // ==================================================================

    console.log("Global listeners attached.");
}

/**
 * Ponto de entrada principal da aplicação.
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Content Loaded. Starting initialization...");

    try {
         // Carregar endereços e ABIs
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

    // 2. Tenta a RECONEXÃO AUTOMÁTICA
    await initializeWalletState(onWalletStateChange);

    // 3. Mostra o modal de boas-vindas. 
    showWelcomeModal();

    // 4. Navega para a página padrão.
    // Note: A chamada a navigateTo dentro de updateUIState garante que a renderização final
    // ocorra após o estado da carteira ser conhecido.
    navigateTo(activePageId); 

    console.log("Application initialized.");
});

// Expor funções necessárias para o escopo global (para uso em HTML, se necessário)
window.openConnectModal = openConnectModal;
window.disconnectWallet = disconnectWallet;
window.updateUIState = updateUIState;