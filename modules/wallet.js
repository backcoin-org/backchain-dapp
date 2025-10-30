// modules/wallet.js - Final

// --- INÍCIO DA CORREÇÃO: Mover a limpeza do window.web3 para o topo ---
if (window.web3) {
    console.warn("Found window.web3. Attempting to clear the shim to prevent MetaMask warning.");
    try {
        // Tenta redefinir a propriedade para undefined
        Object.defineProperty(window, 'web3', {
            value: undefined,
            configurable: true
        });
        console.log("Successfully cleared window.web3 property.");
    } catch (e) {
        // Fallback para o método delete, caso o primeiro falhe
        try {
            delete window.web3; 
        } catch (e2) {
             console.warn("Could not delete window.web3 property (fallback failed).");
        }
    }
}
// --- FIM DA CORREÇÃO ---


const ethers = window.ethers;

import { createWeb3Modal, defaultConfig } from 'https://esm.sh/@web3modal/ethers@latest';

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import {
    addresses, sepoliaRpcUrl, sepoliaChainId,
    bkcTokenABI, delegationManagerABI, rewardManagerABI,
    rewardBoosterABI, nftBondingCurveABI, actionsManagerABI, publicSaleABI,
    faucetABI, decentralizedNotaryABI, ecosystemManagerABI // <-- ADICIONADO HUB
} from '../config.js';
import { loadPublicData, loadUserData } from './data.js';
import { signIn } from './firebase-auth-service.js';

// --- CONFIGURAÇÃO DO WEB3MODAL ---
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

let wasPreviouslyConnected = web3modal.getIsConnected();


// --- FUNÇÃO AUXILIAR PARA DESCONEXÃO SEGURA (NOVA) ---
async function safeDisconnect() {
    // Verifica se web3modal existe e se o método disconnect está disponível
    if (typeof web3modal === 'object' && web3modal !== null && typeof web3modal.disconnect === 'function') {
        try {
            await web3modal.disconnect();
        } catch (e) {
            console.error("Safe Disconnect failed:", e);
        }
    } else {
        console.warn("web3modal object not fully initialized, skipping disconnect.");
    }
}
// --- FIM DA FUNÇÃO AUXILIAR ---


// --- Funções Auxiliares Internas ---

function instantiateContracts(signerOrProvider) {
    console.log("Instantiating contracts with:", signerOrProvider);
    try {
        const contractsToInstantiate = [
            // Instancia o Hub primeiro
            { name: "ecosystemManager", address: addresses.ecosystemManager, abi: ecosystemManagerABI, stateProp: "ecosystemManagerContract" },
            { name: "bkcToken", address: addresses.bkcToken, abi: bkcTokenABI, stateProp: "bkcTokenContract" },
            { name: "delegationManager", address: addresses.delegationManager, abi: delegationManagerABI, stateProp: "delegationManagerContract" },
            { name: "rewardManager", address: addresses.rewardManager, abi: rewardManagerABI, stateProp: "rewardManagerContract" },
            { name: "actionsManager", address: addresses.actionsManager, abi: actionsManagerABI, stateProp: "actionsManagerContract" },
            { name: "rewardBoosterNFT", address: addresses.rewardBoosterNFT, abi: rewardBoosterABI, stateProp: "rewardBoosterContract" },
            { name: "nftBondingCurve", address: addresses.nftBondingCurve, abi: nftBondingCurveABI, stateProp: "nftBondingCurveContract" },
            { name: "publicSale", address: addresses.publicSale, abi: publicSaleABI, stateProp: "publicSaleContract" },
            { name: "faucet", address: addresses.faucet, abi: faucetABI, stateProp: "faucetContract", ignoreZero: true },
            { name: "decentralizedNotary", address: addresses.decentralizedNotary, abi: decentralizedNotaryABI, stateProp: "decentralizedNotaryContract", ignoreZero: true }
        ];

        for (const contractInfo of contractsToInstantiate) {
            const { name, address, abi, stateProp, ignoreZero } = contractInfo;
            
            if (address) { 
                if (ignoreZero && address === "0x0000000000000000000000000000000000000000") {
                    console.warn(`${name} address is placeholder. Skipping instantiation.`);
                    continue;
                }

                if (!abi || typeof abi !== 'object' || abi.length === 0) {
                    console.error(`ABI for ${name} is invalid or missing! Type: ${typeof abi}, Value: ${abi}`);
                    showToast(`Critical Error: ABI for ${name} is invalid. Check config.js.`, "error");
                    throw new Error(`Invalid ABI for ${name}`); 
                }

                console.log(`Instantiating ${name}...`);
                State[stateProp] = new ethers.Contract(address, abi, signerOrProvider);
                console.log(`${name} instance created at ${address}.`);
            } else {
                console.warn(`${name} address is missing in config.js. Skipping instantiation.`);
            }
        }

        console.log("Contracts instantiated:", State);

    } catch (e) {
         console.error("Error instantiating contracts:", e);
         showToast(`Error setting up contracts: ${e.message}`, "error"); 
    }
}

async function setupSignerAndLoadData(provider, address) {
    try {
        State.provider = provider;
        State.signer = await provider.getSigner();
        
        const normalizedAddress = address.toLowerCase();
        State.userAddress = normalizedAddress;
        
        await signIn(State.userAddress);

        instantiateContracts(State.signer); // Instancia com o signer
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
        instantiateContracts(State.publicProvider); // Instancia com o provider público
        await loadPublicData(); // <-- Isto causará erro, corrija a ABI no config.js
        console.log("Public provider initialized. Contracts instantiated with public provider.");
    } catch (e) {
        console.error("Failed to initialize public provider:", e);
        showToast("Could not connect to the blockchain network.", "error");
    }
}

// --- LÓGICA DE TRATAMENTO DE CONEXÃO ---

async function handleProviderChange(state, callback) {
    const { provider, address, chainId, isConnected } = state;
    console.log("Handling Provider Change:", { isConnected, address, chainId });

    if (isConnected) {
        const providerToUse = provider || await web3modal.getWalletProvider();
        if (!providerToUse) {
            console.error("Connected, but failed to get wallet provider.");
            await safeDisconnect(); // USANDO safeDisconnect
            return;
        }

        if (chainId !== Number(sepoliaChainId)) {
            showToast(`Wrong network. Switching to Sepolia...`, 'info');
            const expectedChainIdHex = '0x' + (Number(sepoliaChainId)).toString(16);
            try {
                await providerToUse.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: expectedChainIdHex }],
                });
                return;
            } catch (switchError) {
                if (switchError.code === 4902) {
                    showToast('Sepolia network not found. Adding it...', 'info');
                    try {
                        await providerToUse.request({
                            method: 'wallet_addEthereumChain',
                            params: [ { chainId: expectedChainIdHex, chainName: sepolia.name, rpcUrls: [sepolia.rpcUrl], nativeCurrency: { name: sepolia.currency, symbol: sepolia.currency, decimals: 18, }, blockExplorerUrls: [sepolia.explorerUrl], }, ],
                        });
                        return;
                    } catch (addError) {
                        console.error("Failed to add Sepolia network:", addError);
                        showToast('Please add and switch to the Sepolia network manually.', 'error');
                        await safeDisconnect(); // USANDO safeDisconnect
                        return;
                    }
                }
                console.error("Failed to switch network:", switchError);
                 if (switchError.code !== 4001) {
                      showToast('Failed to switch network. Please do it manually.', 'error');
                 } else {
                     showToast('Network switch rejected by user.', 'info');
                 }
                await safeDisconnect(); // USANDO safeDisconnect
                return;
            }
        }

        // Se chainId correto, continua
        const ethersProvider = new ethers.BrowserProvider(providerToUse);
        const success = await setupSignerAndLoadData(ethersProvider, address);

        if (success) {
            callback({ isConnected: true, address, chainId, isNewConnection: !wasPreviouslyConnected });
            wasPreviouslyConnected = true;
        } else {
            await safeDisconnect(); // USANDO safeDisconnect
        }

    } else {
        // Desconectado
        console.log("Web3Modal reports disconnection. Clearing app state.");
        const wasConnected = State.isConnected;

        State.provider = null; State.signer = null; State.userAddress = null;
        State.isConnected = false;
        State.currentUserBalance = 0n;
        State.userDelegations = [];
        State.activityHistory = [];
        State.myCertificates = [];
        State.myBoosters = [];
        State.userTotalPStake = 0n;

        // Reinstancia contrator com provider público ao desconectar
        if(State.publicProvider) {
            instantiateContracts(State.publicProvider);
             console.log("Contracts re-instantiated with public provider after disconnect.");
        } else {
             console.error("Public provider not available during disconnect cleanup!");
        }

        callback({ isConnected: false, wasConnected: wasConnected });
        wasPreviouslyConnected = false;
    }
}


export async function initializeWalletState(callback) {
    // 1. Assina as mudanças FUTURAS
    web3modal.subscribeProvider(async (state) => {
        await handleProviderChange(state, callback);
    });

    // 2. VERIFICA O ESTADO ATUAL
    const currentState = web3modal.getState();
    wasPreviouslyConnected = currentState.isConnected;

    if (currentState.isConnected) {
        console.log("Running initial connection check (Web3Modal state is connected)...");
        try {
            const provider = await web3modal.getWalletProvider();
            if (provider) {
                await handleProviderChange(
                    { ...currentState, provider: provider },
                    callback
                );
            } else {
                console.warn("Initial state is connected, but no provider found. Disconnecting.");
                await safeDisconnect(); // USANDO safeDisconnect
                await handleProviderChange({ isConnected: false, provider: null, address: null, chainId: null }, callback);
            }
        } catch (e) {
            await handleProviderChange({ isConnected: false, provider: null, address: null, chainId: null }, callback);
        }

    } else {
        console.log("Initial check: Not connected (relying on Web3Modal state).");
         if (State.isConnected) {
             await handleProviderChange({ isConnected: false, provider: null, address: null, chainId: null }, callback);
         }
    }
}


export function openConnectModal() {
    web3modal.open();
}

export async function disconnectWallet() {
    console.log("Telling Web3Modal to disconnect...");
    await safeDisconnect(); // USANDO safeDisconnect
}