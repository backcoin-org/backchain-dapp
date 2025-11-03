// modules/wallet.js

// --- CORREÇÃO: Importar ethers v6 via CDN ESM ---
// Esta é a forma moderna e evita o aviso da MetaMask sobre "window.ethers"
import { ethers } from 'https://esm.sh/ethers@6.11.1';

// --- NOVA IMPORTAÇÃO DO WEB3MODAL via CDN ESM ---
import { createWeb3Modal, defaultConfig } from 'https://esm.sh/@web3modal/ethers@5.0.3';

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
// REMOVIDO: formatAddress (não é mais usado aqui)
import {
    addresses, sepoliaRpcUrl, sepoliaChainId,
    bkcTokenABI, delegationManagerABI, rewardManagerABI,
    rewardBoosterABI, nftBondingCurveABI, 
    fortuneTigerABI, // <-- CORREÇÃO 1: Importar o ABI correto (fortuneTigerABI)
    publicSaleABI,
    faucetABI,
    ecosystemManagerABI // <-- CORREÇÃO: Adicionada importação faltante do EcosystemManager
} from '../config.js';
import { loadPublicData, loadUserData } from './data.js';
import { signIn } from './firebase-auth-service.js';

// --- CONFIGURAÇÃO DO WEB3MODAL ---
const WALLETCONNECT_PROJECT_ID = 'cd4bdedee7a7e909ebd3df8bbc502aed';

const sepolia = {
    chainId: Number(sepoliaChainId), // 11155111
    name: 'Sepolia', //
    currency: 'ETH', //
    explorerUrl: 'https://sepolia.etherscan.io', //
    rpcUrl: sepoliaRpcUrl //
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

// NOVO: Define os Wallets em destaque
const featuredWallets = [
    { name: 'MetaMask', id: 'metamask' },
    { name: 'Binance Wallet', id: 'binance' },
    { name: 'WalletConnect', id: 'walletConnect' } // Garante que o WC também esteja lá
];

const web3modal = createWeb3Modal({
    ethersConfig,
    chains: [sepolia],
    projectId: WALLETCONNECT_PROJECT_ID,
    enableAnalytics: false,
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#f59e0b', // Cor de destaque
        '--w3m-color-mix': '#3f3f46', // --bg-card
        '--w3m-color-mix-strength': 20,
        '--w3m-font-family': 'Inter, sans-serif',
        '--w3m-border-radius-master': '0.375rem', // rounded-md
        '--w3m-z-index': 100 // Garante que fique acima de outros elementos
    },
    featuredWalletIds: featuredWallets.map(w => w.id),
    mobileWallets: [
        'metamask',
        'binance'
    ],

    // --- *** CORREÇÃO ADICIONADA AQUI *** ---
    // Habilita a funcionalidade "Onramp" (Buy Crypto)
    // Isso fará com que o modal busque os provedores (Coinbase, MoonPay)
    // que você ativou no seu painel do WalletConnect Cloud.
    enableOnramp: false // <-- ALTERADO PARA false
    // --- *** FIM DA CORREÇÃO *** ---
});

// --- Funções Auxiliares Internas ---

function instantiateContracts(signerOrProvider) {
    try {
        if (addresses.bkcToken)
            State.bkcTokenContract = new ethers.Contract(addresses.bkcToken, bkcTokenABI, signerOrProvider);
        if (addresses.delegationManager)
            State.delegationManagerContract = new ethers.Contract(addresses.delegationManager, delegationManagerABI, signerOrProvider);
        if (addresses.rewardManager)
            State.rewardManagerContract = new ethers.Contract(addresses.rewardManager, rewardManagerABI, signerOrProvider);
        if (addresses.actionsManager)
            // <-- CORREÇÃO 2: Usar o 'fortuneTigerABI' (correto) em vez do 'actionsManagerABI' (errado)
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
         // <-- CORREÇÃO: Adicionada inicialização faltante do EcosystemManager
         if (addresses.ecosystemManager) {
            State.ecosystemManagerContract = new ethers.Contract(addresses.ecosystemManager, ecosystemManagerABI, signerOrProvider);
         }

    } catch (e) {
         console.error("Error instantiating contracts:", e);
         showToast("Error setting up contracts. Check console.", "error");
    }
}

async function setupSignerAndLoadData(provider, address) {
    try {
        State.provider = provider;
        State.signer = await provider.getSigner();
        State.userAddress = address;

        await signIn(State.userAddress); // Autentica no Firebase

        instantiateContracts(State.signer);
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

export async function initPublicProvider() {
     try {
        State.publicProvider = new ethers.JsonRpcProvider(sepoliaRpcUrl);
        instantiateContracts(State.publicProvider); 
        await loadPublicData();
        console.log("Public provider and Web3Modal initialized.");
    } catch (e) {
        console.error("Failed to initialize public provider:", e);
        showToast("Could not connect to the blockchain network.", "error");
    }
}

/**
 * Assina as mudanças de estado do Web3Modal.
 * @param {function} callback - A função em app.js que lidará com as mudanças.
 */
export function subscribeToWalletChanges(callback) {
    let wasPreviouslyConnected = web3modal.getIsConnected(); // Checa estado inicial

    web3modal.subscribeProvider(async ({ provider, address, chainId, isConnected }) => {
        console.log("Web3Modal State Change:", { isConnected, address, chainId });

        if (isConnected) {
            
            // =================================================================
            // --- INÍCIO DA MODIFICAÇÃO: LÓGICA PARA TROCAR DE REDE ---
            // =================================================================
            
            // Verifica se o chainId conectado é diferente do chainId esperado (Sepolia)
            if (chainId !== Number(sepoliaChainId)) {
                showToast(`Rede errada. Trocando para Sepolia...`, 'error');
                
                // Converte o ID da chain (11155111) para o formato hexadecimal
                const expectedChainIdHex = '0x' + (Number(sepoliaChainId)).toString(16);

                try {
                    // 1. Tenta trocar a rede
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: expectedChainIdHex }],
                    });
                    
                    // Se a troca for bem-sucedida, o Web3Modal/MetaMask
                    // irá disparar um novo evento. A função será executada novamente
                    // já com o chainId correto.
                    return;

                } catch (switchError) {
                    
                    // Erro 4902: A rede Sepolia não está na MetaMask do usuário
                    if (switchError.code === 4902) {
                        showToast('Rede Sepolia não encontrada. Adicionando...', 'info');
                        try {
                            // 2. Tenta adicionar a rede Sepolia
                            // Usamos o objeto 'sepolia' já definido no topo deste arquivo
                            await provider.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: expectedChainIdHex,
                                        chainName: sepolia.name,
                                        rpcUrls: [sepolia.rpcUrl],
                                        nativeCurrency: {
                                            name: sepolia.currency,
                                            symbol: sepolia.currency,
                                            decimals: 18,
                                        },
                                        blockExplorerUrls: [sepolia.explorerUrl],
                                    },
                                ],
                            });
                            // Se adicionar com sucesso, o MetaMask geralmente troca.
                            // Um novo evento será disparado.
                            return;

                        } catch (addError) {
                            // Usuário rejeitou a adição
                            console.error("Falha ao adicionar rede Sepolia:", addError);
                            showToast('Você precisa adicionar e conectar-se à rede Sepolia.', 'error');
                            await web3modal.disconnect(); // Desconecta se o usuário recusar
                            return;
                        }
                    }

                    // Outro erro (ex: usuário rejeitou a troca)
                    console.error("Falha ao trocar de rede:", switchError);
                    showToast('Você precisa estar na rede Sepolia para usar o dApp.', 'error');
                    await web3modal.disconnect(); // Desconecta se o usuário recusar
                    return;
                }
            }
            
            // =================================================================
            // --- FIM DA MODIFICAÇÃO ---
            // =================================================================

            // Se o chainId ESTIVER correto, continua normalmente
            const ethersProvider = new ethers.BrowserProvider(provider);
            const success = await setupSignerAndLoadData(ethersProvider, address);
            
            if (success) {
                // --- AJUSTE DE RECONEXÃO: PEQUENO DELAY APÓS O LOADUserData ---
                // *** CORREÇÃO: Delay de 500ms REMOVIDO para consertar o "flicker" do F5 ***
                
                callback({ 
                    isConnected: true, 
                    address, 
                    chainId,
                    isNewConnection: !wasPreviouslyConnected // Sinaliza se é uma nova conexão
                });
                wasPreviouslyConnected = true;
            } else {
                // Falha no setup (ex: Firebase)
                await web3modal.disconnect();
            }

        } else {
            // Desconectado.
            console.log("Web3Modal reports disconnection. Clearing app state.");
            
            const wasConnected = State.isConnected;

            // Limpa o estado do App
            State.provider = null; State.signer = null; State.userAddress = null;
            State.isConnected = false;
            State.currentUserBalance = 0n;
            State.userDelegations = [];
            State.activityHistory = [];
            State.myCertificates = [];
            State.myBoosters = [];
            State.userTotalPStake = 0n;
        
            if(State.publicProvider) {
                instantiateContracts(State.publicProvider);
            }
            
            callback({ 
                isConnected: false,
                wasConnected: wasConnected
            });
            wasPreviouslyConnected = false;
        }
    });
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