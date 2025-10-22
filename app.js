// app.js

const ethers = window.ethers; // Assume que ethers.js está carregado globalmente

import { DOMElements } from './dom-elements.js';
import { State } from './state.js';
import { initPublicProvider, subscribeToWalletChanges, disconnectWallet, openConnectModal } from './modules/wallet.js';
import { showToast, showShareModal, showIntroModal, closeModal } from './ui-feedback.js'; // Importa closeModal
import { formatBigNumber, formatAddress } from './utils.js';

// Importa as classes/objetos das páginas
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
import { TokenomicsPage } from './pages/TokenomicsPage.js'; // Importa a nova página


// Mapeamento de rotas para os objetos/classes das páginas
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
    'faucet': FaucetPage,
    'tokenomics': TokenomicsPage, // Registra a nova rota
};
let activePageId = 'dashboard'; // Página inicial padrão
const ADMIN_WALLET = "0x03aC69873293cD6ddef7625AfC91E3Bd5434562a"; // Endereço Admin (Mantenha em minúsculas para comparação)

// --- Funções de UI e Navegação ---

/** Atualiza o indicador de status de conexão no header mobile (sm breakpoint) */
function updateConnectionStatus(status, message) {
    const statuses = {
        disconnected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'fa-circle' },
        connecting: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: 'fa-spinner fa-spin' },
        connected: { bg: 'bg-green-500/20', text: 'text-green-400', icon: 'fa-circle' },
    };
    const config = statuses[status] || statuses.disconnected;
    const statusEl = DOMElements.connectionStatus;
    if (statusEl) {
        statusEl.className = `hidden sm:inline-flex lg:hidden items-center gap-2 py-1.5 px-3 rounded-full text-sm font-medium ${config.bg} ${config.text}`; // Garante hidden inicialmente e sm:inline-flex
        statusEl.innerHTML = `<i class="fa-solid ${config.icon} text-xs"></i><span>${message}</span>`;
    } else {
        console.warn("Connection status element not found.");
    }
}

/** Navega para uma seção/página específica da aplicação */
function navigateTo(targetId) {
    console.log(`Navigating to: ${targetId}`);
    // Valida a rota ou redireciona para o dashboard
    if (!routes[targetId]) {
        console.warn(`Route not found: ${targetId}. Navigating to dashboard.`);
        targetId = 'dashboard';
    }
    // Verifica permissão de Admin
    if (targetId === 'admin' && (!State.userAddress || State.userAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase())) {
        showToast("Access Denied. Only administrators can access this page.", "error");
        // Não navega e mantém a página atual ativa visualmente (ou volta para dashboard se estava tentando acessar admin diretamente)
        if (activePageId === 'admin') activePageId = 'dashboard'; // Previne ficar "preso" visualmente no admin
        targetId = activePageId; // Volta para a página que estava antes
        // Não continua a navegação
        //return; // Descomentar se quiser impedir totalmente a mudança visual
    }

    const previousPageId = activePageId;
    activePageId = targetId;

    // Esconde todas as seções principais
    document.querySelectorAll('main > section').forEach(section => {
        section?.classList.add('hidden');
    });

    // Mostra a seção alvo
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    } else {
        // Fallback crítico se a seção não for encontrada no DOM
        console.error(`Target section element #${targetId} not found in DOM! Navigating to dashboard.`);
        activePageId = 'dashboard'; // Reseta ID ativo
        document.getElementById('dashboard')?.classList.remove('hidden'); // Tenta mostrar dashboard
        // Atualiza links da sidebar para dashboard
        document.querySelectorAll('.sidebar-link[data-target]').forEach(l => {
            l.classList.toggle('active', l.dataset.target === 'dashboard');
        });
        // Tenta renderizar o dashboard
        routes['dashboard']?.render?.();
        routes['dashboard']?.init?.();
        routes['dashboard']?.update?.(State.isConnected);
        return; // Sai da função
    }

    // Atualiza links ativos na sidebar
    document.querySelectorAll('.sidebar-link[data-target]').forEach(l => {
        l.classList.toggle('active', l.dataset.target === targetId);
    });

    // Chama lifecycle hooks da página (render, init, update)
    const pageHandler = routes[targetId];
    if (pageHandler) {
        // Chama 'unmount' da página anterior, se existir
        const previousPageHandler = routes[previousPageId];
        if (previousPageId !== targetId && typeof previousPageHandler?.unmount === 'function') {
            console.log(`Unmounting page: ${previousPageId}`);
            previousPageHandler.unmount();
        }

        // Chama 'render' da nova página (para redesenhar o conteúdo base)
        if (typeof pageHandler.render === 'function') {
            console.log(`Rendering page: ${targetId}`);
            pageHandler.render();
        }
        // Chama 'init' da nova página (para listeners e setup inicial)
        if (typeof pageHandler.init === 'function') {
            console.log(`Initializing page: ${targetId}`);
            pageHandler.init();
        }
        // Chama 'update' da nova página com o estado de conexão atual
        if (typeof pageHandler.update === 'function') {
            console.log(`Updating page ${targetId} with connection state: ${State.isConnected}`);
            pageHandler.update(State.isConnected);
        }
    } else {
        console.warn(`No handler (render, init, update) found for route: ${targetId}`);
    }
}

/** Alterna a visibilidade da sidebar */
function toggleSidebar() {
    DOMElements.sidebar?.classList.toggle('-translate-x-full');
    DOMElements.sidebarBackdrop?.classList.toggle('hidden');
}
/** Fecha a sidebar */
function closeSidebar() {
    DOMElements.sidebar?.classList.add('-translate-x-full');
    DOMElements.sidebarBackdrop?.classList.add('hidden');
}

// --- Atualização Centralizada da UI do Header e Estado Geral ---
function updateUIState() {
    console.log("updateUIState - isConnected:", State.isConnected, "User Address:", State.userAddress);

    const isAdmin = State.isConnected && State.userAddress?.toLowerCase() === ADMIN_WALLET.toLowerCase();
    const adminLinkContainer = document.getElementById('admin-link-container');

    // Elementos do Header (Desktop)
    const btnDesktopContainer = checkElement(DOMElements.connectButtonDesktop, 'DOMElements.connectButtonDesktop');
    const btnDesktopConnect = checkElement(DOMElements.desktopDisconnected, 'DOMElements.desktopDisconnected');
    const divDesktopInfo = checkElement(DOMElements.desktopConnectedInfo, 'DOMElements.desktopConnectedInfo');
    const spanDesktopAddress = checkElement(DOMElements.desktopUserAddress, 'DOMElements.desktopUserAddress');
    const spanDesktopBalance = checkElement(DOMElements.desktopUserBalance, 'DOMElements.desktopUserBalance');
    // REMOVIDO: btnBuyCryptoDesktop

    // Elementos do Header (Mobile)
    const btnMobileConnect = checkElement(DOMElements.connectButtonMobile, 'DOMElements.connectButtonMobile');
    const spanMobileDisplay = checkElement(DOMElements.mobileAppDisplay, 'DOMElements.mobileAppDisplay'); // Nome ou Saldo
    const btnMobileSettings = checkElement(DOMElements.mobileSettingsButton, 'DOMElements.mobileSettingsButton'); // Engrenagem
    // REMOVIDO: btnBuyCryptoMobile

    // Elemento de Saldo no Dashboard
    const statUserBalanceEl = document.getElementById('statUserBalance');

    if (State.isConnected && State.userAddress) {
        // --- ESTADO CONECTADO ---
        const balanceNum = formatBigNumber(State.currentUserBalance);
        // Formata saldo com mais ou menos casas decimais dependendo do valor
        const balanceString = balanceNum < 1000 ? balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const addressFormatted = formatAddress(State.userAddress);

        // Desktop Header
        btnDesktopConnect?.classList.add('hidden');
        divDesktopInfo?.classList.remove('hidden');
        if(spanDesktopAddress) spanDesktopAddress.textContent = addressFormatted;
        if(spanDesktopBalance) spanDesktopBalance.textContent = `${balanceString} $BKC`;
        // Clicar na info conectada abre o modal do Web3Modal (para desconectar, trocar conta, etc.)
        if(btnDesktopContainer) btnDesktopContainer.onclick = () => web3modal.open(); // Usa a instância global
        // REMOVIDO: btnBuyCryptoDesktop?.classList.remove('hidden');

        // Mobile Header
        btnMobileConnect?.classList.add('hidden');
        btnMobileSettings?.classList.remove('hidden'); // Mostra engrenagem
        if(btnMobileSettings) btnMobileSettings.onclick = () => web3modal.open(); // Engrenagem abre o modal
        if(spanMobileDisplay) {
            spanMobileDisplay.textContent = `${balanceString} $BKC`; // Mostra saldo
            spanMobileDisplay.classList.add('text-amber-400');
            spanMobileDisplay.classList.remove('text-white');
        }
        // REMOVIDO: btnBuyCryptoMobile?.classList.remove('hidden');

        // Outros
        if (statUserBalanceEl) statUserBalanceEl.textContent = balanceString;
        updateConnectionStatus('connected', addressFormatted);
        if (adminLinkContainer) adminLinkContainer.style.display = isAdmin ? 'block' : 'none';
        if (DOMElements.popMiningTab) DOMElements.popMiningTab.style.display = 'block';
        if (DOMElements.validatorSectionTab) DOMElements.validatorSectionTab.style.display = 'block';

        showIntroModal(); // Mostra modal de boas-vindas na primeira conexão

    } else {
        // --- ESTADO DESCONECTADO ---
        // Desktop Header
        btnDesktopConnect?.classList.remove('hidden'); // Mostra botão Connect
        divDesktopInfo?.classList.add('hidden');
        if(btnDesktopContainer) btnDesktopContainer.onclick = () => openConnectModal(); // Botão container abre o modal para conectar
        // REMOVIDO: btnBuyCryptoDesktop?.classList.add('hidden');

        // Mobile Header
        btnMobileConnect?.classList.remove('hidden'); // Mostra botão Connect
        if(btnMobileConnect) btnMobileConnect.onclick = () => openConnectModal(); // Ação do botão
        btnMobileSettings?.classList.add('hidden'); // Esconde engrenagem
        if(spanMobileDisplay) {
            spanMobileDisplay.textContent = 'Backchain'; // Mostra nome do app
            spanMobileDisplay.classList.add('text-amber-400');
            spanMobileDisplay.classList.remove('text-white');
        }
        // REMOVIDO: btnBuyCryptoMobile?.classList.add('hidden');

        // Outros
        if (statUserBalanceEl) statUserBalanceEl.textContent = '--';
        updateConnectionStatus('disconnected', 'Disconnected');
        if (adminLinkContainer) adminLinkContainer.style.display = 'none';
        if (DOMElements.popMiningTab) DOMElements.popMiningTab.style.display = 'none';
        if (DOMElements.validatorSectionTab) DOMElements.validatorSectionTab.style.display = 'none';

        // Se estava na página de admin e desconectou, redireciona
        if (activePageId === 'admin') {
             navigateTo('dashboard');
        }
    }

    // Chama o 'update' da página ativa, se existir
    const activePageHandler = routes[activePageId];
    if (activePageHandler && typeof activePageHandler.update === 'function') {
        // console.log(`Calling update for page ${activePageId} with connection state: ${State.isConnected}`);
        activePageHandler.update(State.isConnected);
    } else {
        // console.log(`No update function found for page ${activePageId} or page handler missing.`);
    }
}

/** Função helper para verificar existência de elemento no DOM */
function checkElement(el, name) {
    if (!el) {
        console.warn(`DOM Element not found: ${name}. Check the ID in index.html and dom-elements.js.`);
    }
    return el;
}


// --- Handler de Mudança de Estado da Carteira ---
/** Chamado pelo wallet.js quando o estado de conexão muda */
async function onWalletStateChange(newState) {
    console.log("App received wallet state change:", newState);

    // O estado global (State.isConnected, State.userAddress, etc.)
    // JÁ FOI ATUALIZADO pelo wallet.js ANTES de chamar este callback.
    // Apenas chamamos updateUIState() para refletir o novo State.
    updateUIState();

    // Mostra toasts informativos sobre a mudança
    if (newState.isConnected && newState.isNewConnection) {
        showToast("Wallet connected successfully!", "success");
    } else if (!newState.isConnected && newState.wasConnected) {
        showToast("Wallet disconnected.", "info");
    }
    // Não precisa de toast para reconexão silenciosa (isNewConnection: false)
}


// --- SETUP GLOBAL DE LISTENERS ---
function setupGlobalListeners() {
    console.log("Setting up global listeners...");
    // --- Sidebar ---
    checkElement(DOMElements.menuBtn, 'DOMElements.menuBtn')?.addEventListener('click', toggleSidebar);
    checkElement(DOMElements.sidebarBackdrop, 'DOMElements.sidebarBackdrop')?.addEventListener('click', closeSidebar);

    // --- Links da Sidebar (Navegação e Share) ---
    checkElement(DOMElements.navLinks, 'DOMElements.navLinks')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        // Botão Share
        if (link.id === 'shareProjectBtn') {
            e.preventDefault();
            showShareModal();
            closeSidebar();
            return;
        }

        // Links de Navegação Interna
        if (link.hasAttribute('data-target')) {
            e.preventDefault();
            const targetId = link.dataset.target;
            // Verifica se a rota existe antes de navegar (evita erros)
            if (routes[targetId]) {
                navigateTo(targetId);
            } else {
                console.warn(`Navigation ignored: Target route "${targetId}" does not exist.`);
                showToast(`Section "${targetId}" is not available.`, "error");
            }
            closeSidebar();
        }
        // Links externos (com target="_blank") ou sem data-target serão ignorados e seguirão o comportamento padrão
    });

    // --- Botões de Conexão (Header) ---
    // A ação principal (abrir modal) é definida em updateUIState,
    // mas adicionamos listeners aqui como fallback inicial.
    checkElement(DOMElements.connectButtonDesktop, 'DOMElements.connectButtonDesktop')?.addEventListener('click', () => openConnectModal());
    checkElement(DOMElements.connectButtonMobile, 'DOMElements.connectButtonMobile')?.addEventListener('click', () => openConnectModal());
    checkElement(DOMElements.mobileSettingsButton, 'DOMElements.mobileSettingsButton')?.addEventListener('click', () => web3modal.open()); // Engrenagem abre o modal

    // --- Botões "Buy Crypto" ---
    // REMOVIDO
    // checkElement(DOMElements.customBuyCryptoBtn, 'DOMElements.customBuyCryptoBtn')?.addEventListener('click', () => web3modal.open({ view: 'Onramp' }));
    // checkElement(DOMElements.customBuyCryptoBtnMobile, 'DOMElements.customBuyCryptoBtnMobile')?.addEventListener('click', () => web3modal.open({ view: 'Onramp' }));


    // --- Fechar Modal ---
    // Listener no body para capturar cliques em modais adicionados dinamicamente
    document.body.addEventListener('click', (e) => {
        // Fecha se clicar no backdrop OU em um elemento com a classe closeModalBtn
        if (e.target.id === 'modal-backdrop' || e.target.closest('.closeModalBtn')) {
            // Verifica se o clique no botão não é dentro de um input/textarea para evitar fechar ao selecionar texto
            if (!e.target.closest('input, textarea') || e.target.closest('.closeModalBtn')) {
                 closeModal();
            }
        }
    });

    // --- Abas Genéricas (Exemplo: Dashboard "My Position") ---
    // Adiciona listener a todos os contêineres de abas que precisam dessa funcionalidade
    document.querySelectorAll('[data-tab-container]').forEach(tabContainer => {
        const tabButtons = tabContainer.querySelector('[data-tab-buttons]');
        const tabContents = tabContainer.querySelector('[data-tab-contents]');

        if (tabButtons && tabContents) {
            tabButtons.addEventListener('click', (e) => {
                const button = e.target.closest('.tab-btn');
                if (!button || button.classList.contains('active')) return;

                const targetId = button.dataset.target; // Ex: 'tab-overview'

                // Desativa botão e conteúdo ativos
                tabButtons.querySelector('.tab-btn.active')?.classList.remove('active');
                tabContents.querySelector('.tab-content.active')?.classList.remove('active');
                tabContents.querySelector('.tab-content.active')?.classList.add('hidden'); // Esconde o antigo

                // Ativa novo botão e conteúdo
                button.classList.add('active');
                const targetContent = tabContents.querySelector(`#${targetId}`);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                    targetContent.classList.add('active'); // Adiciona classe 'active' para CSS e seleção futura
                     // Dispara um evento customizado para notificar que a aba mudou (opcional)
                     targetContent.dispatchEvent(new CustomEvent('tab-activated', { bubbles: true }));
                } else {
                     console.warn(`Tab content not found for target: #${targetId}`);
                }
            });
        }
    });


    console.log("Global listeners set up.");
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
async function init() {
    console.log("Initializing application...");
    // Verifica se ethers.js está carregado
    if (typeof ethers === 'undefined') {
        document.body.innerHTML = '<div class="h-screen flex items-center justify-center bg-red-900 text-white p-4">Error: Ethers.js library not loaded. Please check your network connection or script includes.</div>';
        console.error("Ethers.js not found!");
        return;
    }

    setupGlobalListeners(); // Configura listeners de UI globais
    await initPublicProvider(); // Inicializa provider público e carrega dados públicos
    subscribeToWalletChanges(onWalletStateChange); // Começa a ouvir o estado da carteira

    // Determina a rota inicial (pela URL hash ou padrão 'dashboard')
    const hash = window.location.hash.substring(1);
    const initialRoute = routes[hash] ? hash : 'dashboard'; // Valida se a rota do hash existe
    navigateTo(initialRoute);

    // A primeira chamada `updateUIState` acontecerá quando `subscribeToWalletChanges`
    // receber o estado inicial do Web3Modal (conectado ou desconectado).
    // Isso evitará o "piscar" inicial do botão conectar.

    console.log("Application initialized. Waiting for wallet state...");
}

// --- Ponto de Entrada ---
// Espera o DOM carregar completamente antes de iniciar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init(); // Executa imediatamente se o DOM já estiver pronto
}