// app.js (AJUSTADO: Saldo e Endereço no mesmo botão)

// --- INÍCIO DA CORREÇÃO: VERCEL ANALYTICS ---
import { inject } from 'https://esm.sh/@vercel/analytics';
inject();
// --- FIM DA CORREÇÃO ---

const ethers = window.ethers;

import { DOMElements } from './dom-elements.js';
import { State } from './state.js';
// --- CORREÇÃO 1: 'initializeWalletState' alterado para 'subscribeToWalletChanges' ---
import { initPublicProvider, subscribeToWalletChanges, disconnectWallet, openConnectModal } from './modules/wallet.js';
import { showToast, showShareModal, showWelcomeModal } from './ui-feedback.js';
// Importa o formatBigNumber original (de Wei para número)
import { formatBigNumber } from './utils.js'; 
import { loadAddresses } from './config.js'; 

// Importações das Páginas
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


// ==================================================================
// --- FUNÇÕES DE FORMATAÇÃO (AJUSTADAS) ---
// ==================================================================

/**
 * Formata o endereço da carteira para 0x + 2 chars... + 3 chars
 * (Ex: 0x03...562a)
 */
function formatAddress(addr) {
    if (!addr || addr.length < 42) return '...';
    // --- CORREÇÃO: "dois primeiros" (0x) + "3 ultimos" (62a) ---
    // slice(0, 2) = "0x"
    // slice(-3) = "62a"
    return `${addr.slice(0, 2)}...${addr.slice(-3)}`; 
}

/**
 * Formata o saldo (já convertido de Wei) para M (Milhões) ou B (Bilhões)
 * @param {bigint} bigNum - O valor em Wei (ex: 30000000000000000000000000n)
 * @returns {string} - O valor formatado (ex: "30.00M")
 */
function formatLargeBalance(bigNum) {
    // 1. Usa a função importada para converter de Wei para número
    const num = formatBigNumber(bigNum); // Ex: 30000000.00
    
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(2) + 'B'; // Bilhões
    }
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(2) + 'M'; // Milhões
    }
    if (num >= 10_000) {
        // Acima de 10k, mostrar número inteiro (sem centavos)
        return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    // Menor que 10k, mostrar com 2 casas decimais
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// ==================================================================


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
        // Usa a nova função de formatação no Toast
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


/**
 * Atualiza todos os elementos da UI com base no State global (conectado/desconectado, saldos, etc.).
 */
function updateUIState() {
    const adminLinkContainer = document.getElementById('admin-link-container');
    const statUserBalanceEl = document.getElementById('statUserBalance'); // No Dashboard

    // --- INÍCIO DA CORREÇÃO ---
    // Elementos do Cabeçalho (index.html)
    const connectButtonDesktop = document.getElementById('connectButtonDesktop');
    const connectButtonMobile = document.getElementById('connectButtonMobile');
    
    // REMOVIDOS: desktopBalanceDisplay, mobileBalanceDisplay, etc.
    
    const mobileAppDisplay = document.getElementById('mobileAppDisplay'); // O texto "Backchain"
    // --- FIM DA CORREÇÃO ---

    // Abas
    const popMiningTab = document.getElementById('pop-mining-tab');
    const validatorSectionTab = document.getElementById('validator-section-tab');

    // Helper para evitar erros
    const checkElement = (el, name) => { if (!el) console.warn(`Element ${name} not found in DOM during UI update.`); return el; };

    if (State.isConnected && State.userAddress) {
        // --- ESTADO CONECTADO ---
        
        // --- INÍCIO DAS CORREÇÕES (V3) ---
        const balanceString = formatLargeBalance(State.currentUserBalance);
        const addressFormatted = formatAddress(State.userAddress);

        // Combina Saldo e Endereço no mesmo botão
        const buttonText = `${balanceString} $BKC | ${addressFormatted}`;

        // Atualiza os botões para mostrar o texto combinado
        checkElement(connectButtonDesktop, 'connectButtonDesktop').textContent = buttonText;
        checkElement(connectButtonMobile, 'connectButtonMobile').textContent = buttonText;
        
        // Restaura o título mobile para "Backchain" para evitar duplicidade
        const mobileDisplayEl = checkElement(mobileAppDisplay, 'mobileAppDisplay');
        if (mobileDisplayEl) { 
            mobileDisplayEl.textContent = 'Backchain'; 
            mobileDisplayEl.classList.add('text-amber-400'); 
            mobileDisplayEl.classList.remove('text-white'); 
        }
        // --- FIM DAS CORREÇÕES (V3) ---


        // Elementos de contexto (Lógica mantida)
        // Atualiza o saldo do Dashboard (este pode manter a formatação completa)
        const fullBalanceNum = formatBigNumber(State.currentUserBalance);
        if (statUserBalanceEl) statUserBalanceEl.textContent = fullBalanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        if (popMiningTab) popMiningTab.style.display = 'block';
        if (validatorSectionTab) validatorSectionTab.style.display = 'block';
        if (adminLinkContainer) { adminLinkContainer.style.display = (State.userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()) ? 'block' : 'none'; }
        
    } else {
        // --- ESTADO DESCONECTADO ---
        
        // --- INÍCIO DAS CORREÇÕES (V3) ---
        // Atualiza os botões para mostrar "Connect"
        checkElement(connectButtonDesktop, 'connectButtonDesktop').textContent = "Connect";
        checkElement(connectButtonMobile, 'connectButtonMobile').textContent = "Connect";
        
        // Restaura o título mobile para "Backchain"
        const mobileDisplayEl = checkElement(mobileAppDisplay, 'mobileAppDisplay');
        if (mobileDisplayEl) { mobileDisplayEl.textContent = 'Backchain'; mobileDisplayEl.classList.add('text-amber-400'); mobileDisplayEl.classList.remove('text-white'); }
        // --- FIM DAS CORREÇÕES (V3) ---


        // Elementos de contexto (Lógica mantida)
        if (popMiningTab) popMiningTab.style.display = 'none';
        if (validatorSectionTab) validatorSectionTab.style.display = 'none';
        if (adminLinkContainer) adminLinkContainer.style.display = 'none';
        if (statUserBalanceEl) statUserBalanceEl.textContent = '--';
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
    
    // 2. Botões de Conexão (Desktop e Mobile)
    if (connectButton) {
        connectButton.addEventListener('click', openConnectModal);
    }
    if (connectButtonMobile) {
        connectButtonMobile.addEventListener('click', openConnectModal);
    }
    
    // 3. Botão de Compartilhar
    if (shareButton) {
        shareButton.addEventListener('click', () => {
            showShareModal(State.userAddress);
        });
    }


    // 4. Botão de menu mobile
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

    // 5. Lógica de Troca de Abas (Global)
    document.body.addEventListener('click', (e) => {
        const tabButton = e.target.closest('.tab-btn');
        
        if (!tabButton) return; 
        if (tabButton.classList.contains('active')) return; 
        
        e.preventDefault();
        
        const targetId = tabButton.dataset.target;
        const targetContent = document.getElementById(targetId);
        
        if (!targetContent) {
            console.warn(`Conteúdo da aba (targetId: '${targetId}') não encontrado.`);
            return;
        }

        const nav = tabButton.closest('nav');
        if (nav) {
            nav.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        }
        
        tabButton.classList.add('active');

        const contentHost = targetContent.parentElement;
        if (contentHost) {
            Array.from(contentHost.children).forEach(child => {
                if (child.classList.contains('tab-content')) {
                    child.classList.add('hidden'); 
                    child.classList.remove('active');
                }
            });
        }
        
        targetContent.classList.remove('hidden');
        targetContent.classList.add('active');
    });

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
    // --- CORREÇÃO 2: 'await initializeWalletState' alterado para 'subscribeToWalletChanges' (e removido o 'await') ---
    subscribeToWalletChanges(onWalletStateChange);

    // 3. Mostra o modal de boas-vindas. 
    showWelcomeModal();

    // 4. Navega para a página padrão.
    navigateTo(activePageId); 

    console.log("Application initialized.");
});

// Expor funções necessárias para o escopo global (para uso em HTML, se necessário)
window.openConnectModal = openConnectModal;
window.disconnectWallet = disconnectWallet;
window.updateUIState = updateUIState;