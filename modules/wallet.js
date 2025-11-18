// modules/wallet.js

import { ethers } from 'https://esm.sh/ethers@6.11.1';
import { createWeb3Modal, defaultConfig } from 'https://esm.sh/@web3modal/ethers@5.0.3';

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import {
    addresses, sepoliaRpcUrl, sepoliaChainId,
    bkcTokenABI, delegationManagerABI, 
    rewardBoosterABI, nftPoolABI, 
    actionsManagerABI, 
    publicSaleABI,
    faucetABI,
    ecosystemManagerABI,
    decentralizedNotaryABI
} from '../config.js';
import { loadPublicData, loadUserData } from './data.js';
import { signIn } from './firebase-auth-service.js';

// ============================================================================
// GLOBAL STATE FOR WALLET INITIALIZATION
// ============================================================================
// ✅ CORREÇÃO: Removido 'window.walletInitialized'
let balancePollingInterval = null;
// 🚀 NOVO: Flag para garantir que a desconexão forçada da sessão salva aconteça apenas uma vez.
let hasForcedInitialDisconnect = false; 

// ============================================================================
// WEB3MODAL CONFIGURATION
// ============================================================================
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
    mobileWallets: ['metamask', 'binance'],
    enableOnramp: false
});

// ============================================================================
// INTERNAL HELPER FUNCTIONS
// ============================================================================

/**
 * FIXED: Added address validation
 */
function validateEthereumAddress(address) {
    if (!address) return false;
    try {
        return ethers.isAddress(address);
    } catch {
        return false;
    }
}

/**
 * Instantiate contracts with signer or provider
 */
function instantiateContracts(signerOrProvider) {
    try {
        if (addresses.bkcToken)
            State.bkcTokenContract = new ethers.Contract(addresses.bkcToken, bkcTokenABI, signerOrProvider);
        if (addresses.delegationManager)
            State.delegationManagerContract = new ethers.Contract(addresses.delegationManager, delegationManagerABI, signerOrProvider);
        // REMOVIDO: State.rewardManagerContract
        if (addresses.actionsManager)
            // --- CORRIGIDO AQUI (usando actionsManagerABI) ---
            State.actionsManagerContract = new ethers.Contract(addresses.actionsManager, actionsManagerABI, signerOrProvider);
        if (addresses.rewardBoosterNFT) {
            State.rewardBoosterContract = new ethers.Contract(addresses.rewardBoosterNFT, rewardBoosterABI, signerOrProvider);
        }
        
        // --- (REFA) LÓGICA OBSOLETA REMOVIDA ---
        // (O bloco 'if (addresses.nftBondingCurve)' foi removido daqui)
        // O frontend agora deve criar instâncias de pool sob demanda

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
 * FIXED: Polling fallback for balance updates (replaces unreliable event listener)
 */
function startBalancePolling() {
    // Stop any existing polling
    if (balancePollingInterval) {
        clearInterval(balancePollingInterval);
        balancePollingInterval = null;
    }

    if (!State.bkcTokenContractPublic || !State.userAddress) return;

    console.log('Starting balance polling (every 5s)...');
    
    let lastBalance = State.currentUserBalance;

    balancePollingInterval = setInterval(async () => {
        try {
            if (!State.isConnected || !State.userAddress) {
                clearInterval(balancePollingInterval);
                balancePollingInterval = null;
                return;
            }

            const newBalance = await State.bkcTokenContractPublic.balanceOf(State.userAddress);
            
            if (newBalance !== lastBalance) {
                console.log(`Balance changed: ${ethers.formatUnits(lastBalance, 18)} → ${ethers.formatUnits(newBalance, 18)}`);
                lastBalance = newBalance;
                State.currentUserBalance = newBalance;
                
                // Trigger UI update
                if (window.updateUIState) {
                    window.updateUIState();
                }
            }
        } catch (error) {
            console.warn('Balance polling error:', error);
        }
    }, 5000); // Poll every 5 seconds
}

/**
 * FIXED: Better error handling with specific error types
 */
async function setupSignerAndLoadData(provider, address) {
    try {
        // FIXED: Validate address before proceeding
        if (!validateEthereumAddress(address)) {
            throw new Error('INVALID_ADDRESS');
        }

        State.provider = provider;
        State.signer = await provider.getSigner();
        State.userAddress = address;

        // Firebase authentication
        try {
            await signIn(State.userAddress);
        } catch (firebaseError) {
            console.error('Firebase auth failed:', firebaseError);
            throw new Error('FIREBASE_AUTH_FAILED');
        }

        // Instantiate contracts with signer
        instantiateContracts(State.signer);
        
        // Load user data
        await loadUserData(); 
        
        // FIXED: Start polling instead of event listener
        startBalancePolling();
        
        State.isConnected = true;
        // ✅ CORREÇÃO: Removido 'window.walletInitialized'
        
        return true;
    } catch (error) {
        console.error("Error during setupSignerAndLoadData:", error);
        
        // FIXED: Specific error messages
        if (error.message === 'INVALID_ADDRESS') {
            showToast("Invalid wallet address.", "error");
        } else if (error.message === 'FIREBASE_AUTH_FAILED') {
            showToast("Authentication failed. Please try again.", "error");
        } else if (error.code === 'ACTION_REJECTED') {
            showToast("Operation rejected by user.", "info");
        } else if (error.code === 'NETWORK_ERROR') {
            showToast("Network error. Please check your connection.", "error");
        } else {
            showToast(`Connection failed: ${error.message || 'Unknown error'}`, "error");
        }
        
        return false;
    }
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

/**
 * Initialize public provider for non-authenticated data
 */
export async function initPublicProvider() {
    try {
        State.publicProvider = new ethers.JsonRpcProvider(sepoliaRpcUrl);

        if (addresses.bkcToken)
            State.bkcTokenContractPublic = new ethers.Contract(addresses.bkcToken, bkcTokenABI, State.publicProvider);
        if (addresses.delegationManager)
            State.delegationManagerContractPublic = new ethers.Contract(addresses.delegationManager, delegationManagerABI, State.publicProvider);
        // REMOVIDO: State.rewardManagerContractPublic
        if (addresses.actionsManager)
            // --- CORRIGIDO AQUI (usando actionsManagerABI) ---
            State.actionsManagerContractPublic = new ethers.Contract(addresses.actionsManager, actionsManagerABI, State.publicProvider);
        
        // --- (REFA) LÓGICA OBSOLETA REMOVIDA ---
        // (O bloco 'if (addresses.nftBondingCurve)' foi removido daqui)

        await loadPublicData();
        
        console.log("Public provider initialized.");
    } catch (e) {
        console.error("Failed to initialize public provider:", e);
        showToast("Could not connect to the blockchain network.", "error");
    }
}

/**
 * ✅ CORREÇÃO: Renomeada e refatorada de 'subscribeToWalletChanges'
 * Esta função agora lida com a inicialização E subscrição.
 */
export function initWalletSubscriptions(callback) {
    let wasPreviouslyConnected = web3modal.getIsConnected(); 
    let isHandlingChange = false; // Mutex-like flag

    // ✅ CORREÇÃO DA NAVEGAÇÃO: Adiciona a flag 'hasForcedInitialDisconnect'
    // Esta lógica de desconexão só deve ocorrer na primeira carga do app, 
    // e não a cada navegação de página.
    if (wasPreviouslyConnected && !hasForcedInitialDisconnect) {
        console.log("⚠️ Found saved session on load. Forcing immediate disconnect to reset state.");
        try {
            // Não 'await' aqui, pois estamos em um contexto síncrono
            web3modal.disconnect().then(() => {
                console.log("✅ Session disconnected successfully.");
            });
        } catch (e) {
            console.warn("Could not force disconnect, may already be cleaning up:", e);
        }
        wasPreviouslyConnected = false;
        hasForcedInitialDisconnect = true; // Garante que não será executado novamente na navegação
    }
    // FIM DO BLOCO DE DESCONEXÃO FORÇADA

    const handler = async ({ provider, address, chainId, isConnected }) => {
        // Previne execuções simultâneas
        if (isHandlingChange) {
            console.log("Handler already running, skipping redundant call.");
            return;
        }
        isHandlingChange = true;
        
        console.log("Web3Modal State Change:", { isConnected, address, chainId });

        if (isConnected) {
            // ... (Validação de rede - sem alterações) ...
            if (chainId !== Number(sepoliaChainId)) {
                showToast(`Wrong network. Switching to Sepolia...`, 'error');
                const expectedChainIdHex = '0x' + (Number(sepoliaChainId)).toString(16);
                try {
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: expectedChainIdHex }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        showToast('Sepolia network not found. Adding...', 'info');
                        try {
                            await provider.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: expectedChainIdHex,
                                    chainName: sepolia.name,
                                    rpcUrls: [sepolia.rpcUrl],
                                    nativeCurrency: { name: sepolia.currency, symbol: sepolia.currency, decimals: 18 },
                                    blockExplorerUrls: [sepolia.explorerUrl],
                                }],
                            });
                        } catch (addError) {
                            console.error("Failed to add Sepolia network:", addError);
                            showToast('You need to add and connect to Sepolia network.', 'error');
                            await web3modal.disconnect();
                        }
                    } else {
                        console.error("Failed to switch network:", switchError);
                        showToast('You need to be on Sepolia network to use the dApp.', 'error');
                        await web3modal.disconnect();
                    }
                }
                isHandlingChange = false; // Libera o flag em caso de erro de rede
                return; // Retorna para esperar a próxima mudança de estado
            }

            // Setup signer and load data
            const ethersProvider = new ethers.BrowserProvider(provider);
            State.web3Provider = provider; 

            const success = await setupSignerAndLoadData(ethersProvider, address);
            
            if (success) {
                const isNewConnection = !wasPreviouslyConnected;
                wasPreviouslyConnected = true;

                callback({ 
                    isConnected: true, 
                    address, 
                    chainId,
                    isNewConnection 
                });
            } else {
                await web3modal.disconnect();
            }

        } else {
            // Disconnection handler
            console.log("Web3Modal reports disconnection. Clearing app state.");
            
            const wasConnected = State.isConnected;

            // ... (Limpeza de estado - sem alterações) ...
            if (balancePollingInterval) {
                clearInterval(balancePollingInterval);
                balancePollingInterval = null;
            }
            State.web3Provider = null; 
            State.provider = null;
            State.signer = null;
            State.userAddress = null;
            State.isConnected = false;
            State.currentUserBalance = 0n;
            State.userDelegations = [];
            State.activityHistory = [];
            State.myBoosters = [];
            State.userTotalPStake = 0n;
            // ✅ CORREÇÃO: Removido 'window.walletInitialized'

            // Reinitialize contracts with public provider
            if(State.publicProvider) {
                instantiateContracts(State.publicProvider);
            }
            
            callback({ 
                isConnected: false,
                wasConnected: wasConnected
            });
            wasPreviouslyConnected = false;
        }
        
        isHandlingChange = false; // Libera o flag
    };
    
    // Attach handler for future events
    web3modal.subscribeProvider(handler);

    // ✅ CORREÇÃO: Dispara manualmente o callback com o estado inicial (desconectado)
    // Isso garante que o app.js renderize o estado desconectado
    // imediatamente, em vez de esperar um evento.
    console.log("Disparando estado inicial (desconectado) para o app.");
    callback({ 
        isConnected: false,
        wasConnected: wasPreviouslyConnected
    });
}

/**
 * Open connection modal
 */
export function openConnectModal() {
    web3modal.open();
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet() {
    console.log("Disconnecting wallet...");
    
    // Stop polling
    if (balancePollingInterval) {
        clearInterval(balancePollingInterval);
        balancePollingInterval = null;
    }
    
    await web3modal.disconnect();
}