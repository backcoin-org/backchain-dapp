// js/dom-elements.js
// ✅ VERSÃO FINAL: Mapeamento do DOM atualizado com suporte ao AirBNFT

export const DOMElements = {
    // --- Layout & Navigation ---
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop'),
    menuBtn: document.getElementById('menu-btn'),
    navLinks: document.getElementById('nav-links'),
    mainContentSections: document.querySelectorAll('main section'),

    // --- Header & Connection ---
    // Botões principais (Desktop/Mobile conforme novo HTML)
    connectButtonDesktop: document.getElementById('connectButtonDesktop'),
    connectButtonMobile: document.getElementById('connectButtonMobile'),
    mobileAppDisplay: document.getElementById('mobileAppDisplay'), // Nome/Saldo no mobile

    // Elementos de estado legados (Mantidos para evitar erros em scripts antigos que os busquem)
    desktopDisconnected: document.getElementById('desktopDisconnected'),
    desktopConnectedInfo: document.getElementById('desktopConnectedInfo'),
    desktopUserAddress: document.getElementById('desktopUserAddress'),
    desktopUserBalance: document.getElementById('desktopUserBalance'),

    // --- Modals & Toasts ---
    modalContainer: document.getElementById('modal-container'),
    toastContainer: document.getElementById('toast-container'),

    // --- Page Content Containers (Seções) ---
    dashboard: document.getElementById('dashboard'),
    earn: document.getElementById('staking'), // Staking section
    store: document.getElementById('store'), // NFT Market
    rental: document.getElementById('rental'), // <--- NOVO: AirBNFT Section
    rewards: document.getElementById('rewards'),
    actions: document.getElementById('fortune'), // Fortune Pool
    presale: document.getElementById('presale'),
    faucet: document.getElementById('faucet'),
    airdrop: document.getElementById('airdrop'), 
    dao: document.getElementById('dao'),         
    about: document.getElementById('about'),     
    admin: document.getElementById('admin'),     
    tokenomics: document.getElementById('tokenomics'), 
    notary: document.getElementById('notary'), 

    // --- Dashboard Stats (Dados Públicos e do Usuário) ---
    statTotalSupply: document.getElementById('statTotalSupply'),
    statValidators: document.getElementById('statValidators'), // Active Users
    statTotalPStake: document.getElementById('statTotalPStake'),
    statScarcity: document.getElementById('statScarcity'),
    statLockedPercentage: document.getElementById('statLockedPercentage'),
    statUserBalance: document.getElementById('statUserBalance'),
    
    // Adicionados para garantir que DashboardPage.js encontre esses elementos
    statUserPStake: document.getElementById('statUserPStake'),
    statUserRewards: document.getElementById('statUserRewards')
};