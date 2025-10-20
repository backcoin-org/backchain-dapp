// modules/wallet.js

const ethers = window.ethers;

// --- NOVA IMPORTAÇÃO DO WEB3MODAL via CDN ESM ---
import { createWeb3Modal, defaultConfig } from 'https://esm.sh/@web3modal/ethers@5.0.3';

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
// REMOVIDO: formatAddress (não é mais usado aqui)
import {
    addresses, sepoliaRpcUrl, sepoliaChainId,
    bkcTokenABI, delegationManagerABI, rewardManagerABI,
    rewardBoosterABI, nftBondingCurveABI, actionsManagerABI, publicSaleABI,
    faucetABI
} from '../config.js';
import { loadPublicData, loadUserData } from './data.js';
import { signIn } from './firebase-auth-service.js';

// --- CONFIGURAÇÃO DO WEB3MODAL ---
const WALLETCONNECT_PROJECT_ID = 'cd4bdedee7a7e909ebd3df8bbc502aed';

const sepolia = {
    chainId: Number(sepoliaChainId), // 11155111
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

// NOVO: Define os Wallets em destaque
const featuredWallets = [
    { name: 'MetaMask', id: 'metamask' },
    { name: 'Binance Wallet', id: 'binance' },
    { name: 'WalletConnect', id: 'walletConnect' } // Garante que o WC também esteja lá
];

// AVISO: Não exporte 'web3modal' diretamente se o app.js for importá-lo,
// pois o app.js pode carregar antes desta linha.
// A função disconnectWallet() é o wrapper seguro.
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
    // Adiciona o destaque de carteiras para o modal de seleção
    featuredWalletIds: featuredWallets.map(w => w.id),
    // Adiciona as carteiras para o modal mobile (MetaMask e Binance)
    mobileWallets: [
        'metamask',
        'binance'
    ]
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
            State.actionsManagerContract = new ethers.Contract(addresses.actionsManager, actionsManagerABI, signerOrProvider);
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
            // Conectado
            if (chainId !== Number(sepoliaChainId)) {
                showToast(`Wrong Network. Please switch to Sepolia.`, 'error');
                await web3modal.disconnect();
                return; // O evento de desconexão será disparado
            }
            
            const ethersProvider = new ethers.BrowserProvider(provider);
            const success = await setupSignerAndLoadData(ethersProvider, address);
            
            if (success) {
                // --- AJUSTE DE RECONEXÃO: PEQUENO DELAY APÓS O LOADUserData ---
                // Isso garante que a UI do Dashboard tenha tempo de carregar os saldos e o pStake
                // antes que o app.js renderize. Essencial para reconexão em F5.
                await new Promise(resolve => setTimeout(resolve, 500)); // Espera 500ms
                // -------------------------------------------------------------
                
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