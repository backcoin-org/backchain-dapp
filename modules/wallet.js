// modules/wallet.js
// ARQUIVO COMPLETO E AJUSTADO

// --- CORREÇÃO: Importar ethers v6 via CDN ESM ---
import { ethers } from 'https://esm.sh/ethers@6.11.1';

// --- NOVA IMPORTAÇÃO DO WEB3MODAL via CDN ESM ---
import { createWeb3Modal, defaultConfig } from 'https://esm.sh/@web3modal/ethers@5.0.3';

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import {
    addresses, sepoliaRpcUrl, sepoliaChainId,
    bkcTokenABI, delegationManagerABI, rewardManagerABI,
    rewardBoosterABI, nftBondingCurveABI, 
    fortuneTigerABI, // Importa o ABI correto (fortuneTigerABI)
    publicSaleABI,
    faucetABI,
    ecosystemManagerABI, // Importação do EcosystemManager
    decentralizedNotaryABI // Importação do ABI do Notário
} from '../config.js';
import { loadPublicData, loadUserData } from './data.js';
import { signIn } from './firebase-auth-service.js';

// --- CONFIGURAÇÃO DO WEB3MODAL (Sem alterações) ---
const WALLETCONNECT_PROJECT_ID = 'cd4bdedee7a7e909ebd3df8bbc502aed';

const sepolia = {
    chainId: Number(sepoliaChainId),
    name: 'Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: sepoliaRpcUrl
};

const metadata = {
    name: 'Backchain dApp',
    description: 'Backchain - Decentralized Actions & Staking',
    url: window.location.origin,
    icons: [window.location.origin + '/assets/bkc_logo_3d.png']
};

const ethersConfig = defaultConfig({
    metadata,
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: true,
    rpcUrl: sepoliaRpcUrl,
    defaultChainId: Number(sepoliaChainId)
});

const featuredWallets = [
    { name: 'MetaMask', id: 'metamask' },
    { name: 'Binance Wallet', id: 'binance' },
    { name: 'WalletConnect', id: 'walletConnect' }
];

const web3modal = createWeb3Modal({
    ethersConfig,
    chains: [sepolia],
    projectId: WALLETCONNECT_PROJECT_ID,
    enableAnalytics: false,

    // ### CORREÇÃO (BÔNUS) ###
    // Desativa a busca de avatar do WalletConnect, que causa o erro 404
    // que você mencionou anteriormente.
    enableAvatar: false,

    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#f59e0b',
        '--w3m-color-mix': '#3f3f46',
        '--w3m-color-mix-strength': 20,
        '--w3m-font-family': 'Inter, sans-serif',
        '--w3m-border-radius-master': '0.375rem',
        '--w3m-z-index': 100
    },
    featuredWalletIds: featuredWallets.map(w => w.id),
    mobileWallets: [
        'metamask',
        'binance'
    ],
    enableOnramp: false
});

// --- Funções Auxiliares Internas ---

/**
 * Instancia os contratos com o SIGNER (usuário logado).
 * Esta função é chamada APENAS após a conexão bem-sucedida.
 */
function instantiateContracts(signerOrProvider) {
    try {
        // Popula o State com contratos assinados (para transações)
        if (addresses.bkcToken)
            State.bkcTokenContract = new ethers.Contract(addresses.bkcToken, bkcTokenABI, signerOrProvider);
        if (addresses.delegationManager)
            State.delegationManagerContract = new ethers.Contract(addresses.delegationManager, delegationManagerABI, signerOrProvider);
        if (addresses.rewardManager)
            State.rewardManagerContract = new ethers.Contract(addresses.rewardManager, rewardManagerABI, signerOrProvider);
        if (addresses.actionsManager)
            State.actionsManagerContract = new ethers.Contract(addresses.actionsManager, fortuneTigerABI, signerOrProvider);
        if (addresses.rewardBoosterNFT) {
            State.rewardBoosterContract = new ethers.Contract(addresses.rewardBoosterNFT, rewardBoosterABI, signerOrProvider);
        }
        if (addresses.nftBondingCurve) {
            State.nftBondingCurveContract = new ethers.Contract(addresses.nftBondingCurve, nftBondingCurveABI, signerOrProvider);
        }
         if (addresses.publicSale) {
             State.publicSaleContract = new ethers.Contract(addresses.publicSale, publicSaleABI, signerOrProvider);
         }
         if (addresses.faucet && !addresses.faucet.startsWith('0x...')) {
             State.faucetContract = new ethers.Contract(addresses.faucet, faucetABI, signerOrProvider);
         }
         if (addresses.ecosystemManager) {
            State.ecosystemManagerContract = new ethers.Contract(addresses.ecosystemManager, ecosystemManagerABI, signerOrProvider);
         }
         if (addresses.decentralizedNotary) {
            State.decentralizedNotaryContract = new ethers.Contract(addresses.decentralizedNotary, decentralizedNotaryABI, signerOrProvider);
         }

    } catch (e) {
         console.error("Error instantiating contracts:", e);
         showToast("Error setting up contracts. Check console.", "error");
    }
}

/**
 * Configura o signer e carrega os dados específicos do usuário.
 * Chamado pela lógica de reconexão/login.
 */
async function setupSignerAndLoadData(provider, address) {
    try {
        State.provider = provider;
        State.signer = await provider.getSigner();
        State.userAddress = address;

        // Autentica no Firebase (necessário para o Airdrop)
        await signIn(State.userAddress); 

        // Instancia os contratos com o signer (para o usuário poder transacionar)
        instantiateContracts(State.signer);
        
        // Carrega dados específicos do usuário (saldo, pStake, etc.)
        await loadUserData(); 
        
        State.isConnected = true;
        return true;
    } catch (error) {
         console.error("Error during setupSignerAndLoadData:", error);
         if (error.code === 'ACTION_REJECTED') { showToast("Operation rejected by user.", "info"); }
         else if (error.message.includes("Firebase")) { showToast("Firebase authentication failed.", "error"); }
         else { showToast(`Connection failed: ${error.message || 'Unknown error'}`, "error"); }
         return false;
    }
}


// --- Funções Exportadas ---

/**
 * Inicializa o provedor PÚBLICO (para dados não logados, como TVL e validadores).
 */
export async function initPublicProvider() {
     try {
        State.publicProvider = new ethers.JsonRpcProvider(sepoliaRpcUrl);

        // Inicializa os contratos PÚBLICOS que o TVL (DashboardPage.js) procura.
        if (addresses.bkcToken)
            State.bkcTokenContractPublic = new ethers.Contract(addresses.bkcToken, bkcTokenABI, State.publicProvider);
        if (addresses.delegationManager)
            State.delegationManagerContractPublic = new ethers.Contract(addresses.delegationManager, delegationManagerABI, State.publicProvider);
        if (addresses.rewardManager)
            State.rewardManagerContractPublic = new ethers.Contract(addresses.rewardManager, rewardManagerABI, State.publicProvider);
        if (addresses.actionsManager)
            State.actionsManagerContractPublic = new ethers.Contract(addresses.actionsManager, fortuneTigerABI, State.publicProvider);
        if (addresses.nftBondingCurve) {
            State.nftBondingCurveContractPublic = new ethers.Contract(addresses.nftBondingCurve, nftBondingCurveABI, State.publicProvider);
        }

        // Carrega dados públicos (ex: lista de validadores, info pública)
        await loadPublicData();
        
        console.log("Public provider and Web3Modal initialized.");
    } catch (e) {
        console.error("Failed to initialize public provider:", e);
        showToast("Could not connect to the blockchain network.", "error");
    }
}

/**
 * Assina as mudanças de estado do Web3Modal e tenta reconectar.
 * @param {function} callback - A função em app.js que lidará com as mudanças.
 */
export function subscribeToWalletChanges(callback) {
    
    let wasPreviouslyConnected = web3modal.getIsConnected(); 

    web3modal.subscribeProvider(async ({ provider, address, chainId, isConnected }) => {
        console.log("Web3Modal State Change:", { isConnected, address, chainId });

        if (isConnected) {
            
            // --- Lógica para Trocar de Rede (Mantida) ---
            if (chainId !== Number(sepoliaChainId)) {
                showToast(`Rede errada. Trocando para Sepolia...`, 'error');
                const expectedChainIdHex = '0x' + (Number(sepoliaChainId)).toString(16);

                try {
                    // 1. Tenta trocar a rede
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: expectedChainIdHex }],
                    });
                    // Sucesso, aguarda novo evento
                    return;

                } catch (switchError) {
                    // Erro 4902: Rede não existe na carteira
                    if (switchError.code === 4902) {
                        showToast('Rede Sepolia não encontrada. Adicionando...', 'info');
                        try {
                            // 2. Tenta adicionar a rede Sepolia
                            await provider.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: expectedChainIdHex,
                                        chainName: sepolia.name,
                                        rpcUrls: [sepolia.rpcUrl],
                                        nativeCurrency: { name: sepolia.currency, symbol: sepolia.currency, decimals: 18 },
                                        blockExplorerUrls: [sepolia.explorerUrl],
                                    },
                                ],
                            });
                            // Sucesso, aguarda novo evento
                            return;
                        } catch (addError) {
                            console.error("Falha ao adicionar rede Sepolia:", addError);
                            showToast('Você precisa adicionar e conectar-se à rede Sepolia.', 'error');
                            await web3modal.disconnect();
                            return;
                        }
                    }
                    // Outro erro (usuário rejeitou a troca)
                    console.error("Falha ao trocar de rede:", switchError);
                    showToast('Você precisa estar na rede Sepolia para usar o dApp.', 'error');
                    await web3modal.disconnect();
                    return;
                }
            }
            // --- Fim da Lógica de Troca de Rede ---

            // Se o chainId ESTIVER correto, continua o setup
            const ethersProvider = new ethers.BrowserProvider(provider);
            
            // ### CORREÇÃO 1: (Problema "Adicionar à Carteira") ###
            // Armazena o provedor 'raw' (EIP-1193) no State.
            // O NotaryPage.js precisa disso para a função 'wallet_watchAsset'.
            State.web3Provider = provider; 

            const success = await setupSignerAndLoadData(ethersProvider, address);
            
            if (success) {
                const isNewConnection = !wasPreviouslyConnected;
                wasPreviouslyConnected = true; // Atualiza o rastreamento

                // Chama o app.js para atualizar a UI
                callback({ 
                    isConnected: true, 
                    address, 
                    chainId,
                    isNewConnection 
                });
            } else {
                // Falha no setup (ex: Firebase)
                await web3modal.disconnect();
            }

        } else {
            // Desconectado
            console.log("Web3Modal reports disconnection. Clearing app state.");
            
            const wasConnected = State.isConnected; // Salva se o usuário estava logado antes

            // Limpa o estado do App
            // ### CORREÇÃO 1: (Problema "Adicionar à Carteira") ###
            // Limpa o provedor 'raw' do State ao desconectar.
            State.web3Provider = null; 
            State.provider = null; State.signer = null; State.userAddress = null;
            State.isConnected = false;
            State.currentUserBalance = 0n;
            State.userDelegations = [];
            State.activityHistory = [];
            State.myCertificates = [];
            State.myBoosters = [];
            State.userTotalPStake = 0n;
        
            // Recria os contratos do signer, mas com o provedor PÚBLICO
            if(State.publicProvider) {
                instantiateContracts(State.publicProvider);
            }
            
            // Chama o app.js para atualizar a UI para o estado "deslogado"
            callback({ 
                isConnected: false,
                wasConnected: wasConnected // Informa que acabou de deslogar
            });
            wasPreviouslyConnected = false;
        }
    });

    // =================================================================
    // ### CORREÇÃO 2: (Problema de Recarregar a Página) ###
    // Verifica o estado inicial no carregamento da página. Se o Web3Modal
    // tiver uma sessão salva, disparamos o 'callback' manualmente
    // para sincronizar a UI imediatamente, evitando o botão "Desconectado".
    // =================================================================
    try {
        console.log("Checking initial state on page load...");
        const currentStatus = web3modal.getState();
        
        if (currentStatus.isConnected && currentStatus.address && currentStatus.chainId) {
            
            console.log("Found saved session. Manually triggering callback to sync UI.");
            
            // Dispara o callback (em app.js) com o estado atual
            // Isso fará a UI renderizar como "Conectado" imediatamente.
            callback({
                isConnected: true,
                address: currentStatus.address,
                chainId: currentStatus.chainId,
                isNewConnection: false // Não é uma 'nova' conexão, é uma reconexão
            });
            
        } else {
            console.log("No saved session found. UI will remain disconnected.");
        }
    } catch (e) {
         console.error("Error checking initial Web3Modal state:", e);
    }
}


/**
 * Abre o modal de conexão.
 */
export function openConnectModal() {
    web3modal.open();
}

/**
 * Pede ao Web3Modal para desconectar.
 */
export async function disconnectWallet() {
    console.log("Telling Web3Modal to disconnect...");
    await web3modal.disconnect();
}