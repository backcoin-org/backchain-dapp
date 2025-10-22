// dom-elements.js

export const DOMElements = {
    // Layout & Navigation
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop'),
    menuBtn: document.getElementById('menu-btn'),
    navLinks: document.getElementById('nav-links'),
    mainContentSections: document.querySelectorAll('main section'),
    earnTabs: document.getElementById('earn-tabs'),
    popMiningTab: document.getElementById('pop-mining-tab'),
    validatorSectionTab: document.getElementById('validator-section-tab'),

    // Header & Connection (*** NOVOS IDs ***)
    connectionStatus: document.getElementById('connectionStatus'),
    // Botões principais (Desktop/Mobile)
    connectButtonDesktop: document.getElementById('connectButtonDesktop'),
    connectButtonMobile: document.getElementById('connectButtonMobile'),
    mobileSettingsButton: document.getElementById('mobileSettingsButton'),
    // Elementos de estado (Desktop)
    desktopDisconnected: document.getElementById('desktopDisconnected'),
    desktopConnectedInfo: document.getElementById('desktopConnectedInfo'),
    desktopUserAddress: document.getElementById('desktopUserAddress'),
    desktopUserBalance: document.getElementById('desktopUserBalance'),
    // Elementos de estado (Mobile)
    mobileAppDisplay: document.getElementById('mobileAppDisplay'), // Nome/Saldo
    mobileConnectedInfo: document.getElementById('mobileConnectedInfo'), // Contêiner Saldo+Engrenagem
    mobileUserBalance: document.getElementById('mobileUserBalance'),

    // Modals & Toasts
    modalContainer: document.getElementById('modal-container'),
    toastContainer: document.getElementById('toast-container'),

    // Page Content Containers
    dashboard: document.getElementById('dashboard'),
    earn: document.getElementById('earn'),
    store: document.getElementById('store'),
    rewards: document.getElementById('rewards'),
    actions: document.getElementById('actions'),
    presale: document.getElementById('presale'),
    faucet: document.getElementById('faucet'),
    airdrop: document.getElementById('airdrop'), // Adicionado Airdrop
    dao: document.getElementById('dao'),         // Adicionado DAO
    about: document.getElementById('about'),     // Adicionado About
    admin: document.getElementById('admin'),     // Adicionado Admin
    tokenomics: document.getElementById('tokenomics'), // <-- ADICIONADO AQUI

    // Dashboard Stats (Public)
    statTotalSupply: document.getElementById('statTotalSupply'),
    statValidators: document.getElementById('statValidators'),
    statTotalPStake: document.getElementById('statTotalPStake'),
    statScarcity: document.getElementById('statScarcity'),
    statLockedPercentage: document.getElementById('statLockedPercentage'), // Adicionado
};