// modules/wallet.js
// ✅ VERSÃO FINAL UX: Auto-Reconnect (F5) + Polling Rápido

import { ethers } from 'https://esm.sh/ethers@6.11.1';
import { createWeb3Modal, defaultConfig } from 'https://esm.sh/@web3modal/ethers@5.0.3';

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import {
    addresses, sepoliaRpcUrl, sepoliaChainId,
    bkcTokenABI, delegationManagerABI, 
    rewardBoosterABI, 
    actionsManagerABI, 
    publicSaleABI,
    faucetABI,
    ecosystemManagerABI,
    decentralizedNotaryABI,
    rentalManagerABI
} from '../config.js';
import { loadPublicData, loadUserData } from './data.js';
import { signIn } from './firebase-auth-service.js';

// ============================================================================
// GLOBAL STATE & CONSTANTS
// ============================================================================
let balancePollingInterval = null;
const POLLING_INTERVAL_MS = 4000; // 4 Segundos (Rápido)

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
    description: 'Backchain Ecosystem',
    url: window.location.origin,
    icons: [window.location.origin + '/assets/bkc_logo_3d.png']
};

const ethersConfig = defaultConfig({
    metadata,
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: false, 
    rpcUrl: sepoliaRpcUrl,
    defaultChainId: Number(sepoliaChainId),
    enableWeb3Js: false,
    enableEns: false, // Previne erros 404
    enableEmail: false
});

const web3modal = createWeb3Modal({
    ethersConfig,
    chains: [sepolia],
    projectId: WALLETCONNECT_PROJECT_ID,
    enableAnalytics: false,
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#f59e0b',
        '--w3m-z-index': 100
    }
});

// ============================================================================
// HELPERS
// ============================================================================

function validateEthereumAddress(address) {
    if (!address) return false;
    try { return ethers.isAddress(address); } catch { return false; }
}

function isValidAddress(addr) {
    return addr && addr !== ethers.ZeroAddress && !addr.startsWith('0x...');
}

function loadCachedBalance(address) {
    if (!address) return;
    const cached = localStorage.getItem(`balance_${address.toLowerCase()}`);
    if (cached) {
        try {
            const balanceBigInt = BigInt(cached);
            State.currentUserBalance = balanceBigInt;
            if (window.updateUIState) window.updateUIState();
            console.log("⚡ Cached balance loaded.");
        } catch (e) { console.warn("Cache invalid"); }
    }
}

function instantiateContracts(signerOrProvider) {
    try {
        if (isValidAddress(addresses.bkcToken))
            State.bkcTokenContract = new ethers.Contract(addresses.bkcToken, bkcTokenABI, signerOrProvider);
        if (isValidAddress(addresses.delegationManager))
            State.delegationManagerContract = new ethers.Contract(addresses.delegationManager, delegationManagerABI, signerOrProvider);
        if (isValidAddress(addresses.actionsManager))
            State.actionsManagerContract = new ethers.Contract(addresses.actionsManager, actionsManagerABI, signerOrProvider);
        if (isValidAddress(addresses.rewardBoosterNFT))
            State.rewardBoosterContract = new ethers.Contract(addresses.rewardBoosterNFT, rewardBoosterABI, signerOrProvider);
        if (isValidAddress(addresses.publicSale))
            State.publicSaleContract = new ethers.Contract(addresses.publicSale, publicSaleABI, signerOrProvider);
        if (isValidAddress(addresses.faucet))
            State.faucetContract = new ethers.Contract(addresses.faucet, faucetABI, signerOrProvider);
        if (isValidAddress(addresses.ecosystemManager))
            State.ecosystemManagerContract = new ethers.Contract(addresses.ecosystemManager, ecosystemManagerABI, signerOrProvider);
        if (isValidAddress(addresses.decentralizedNotary))
            State.decentralizedNotaryContract = new ethers.Contract(addresses.decentralizedNotary, decentralizedNotaryABI, signerOrProvider);
        // [NEW] Rental Manager
        if (isValidAddress(addresses.rentalManager))
            State.rentalManagerContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signerOrProvider);
            
    } catch (e) {
        console.error("Error instantiating contracts:", e);
    }
}

function startBalancePolling() {
    if (balancePollingInterval) {
        clearInterval(balancePollingInterval);
        balancePollingInterval = null;
    }

    if (!State.bkcTokenContractPublic || !State.userAddress) return;

    console.log(`🚀 Polling balance every ${POLLING_INTERVAL_MS / 1000}s`);
    checkBalance(); // Executa imediatamente
    balancePollingInterval = setInterval(checkBalance, POLLING_INTERVAL_MS); 
}

async function checkBalance() {
    if (document.hidden) return;

    try {
        if (!State.isConnected || !State.userAddress) {
            if(balancePollingInterval) clearInterval(balancePollingInterval);
            return;
        }

        const newBalance = await State.bkcTokenContractPublic.balanceOf(State.userAddress);
        
        if (newBalance !== State.currentUserBalance || State.currentUserBalance === 0n) {
            State.currentUserBalance = newBalance;
            localStorage.setItem(`balance_${State.userAddress.toLowerCase()}`, newBalance.toString());
            if (window.updateUIState) window.updateUIState(true);
        }
    } catch (error) { /* Silent catch */ }
}

async function setupSignerAndLoadData(provider, address) {
    try {
        if (!validateEthereumAddress(address)) throw new Error('INVALID_ADDRESS');

        // Se já está configurado, não recarrega tudo (Otimização)
        if (State.userAddress === address && State.signer) {
            return true;
        }

        State.provider = provider;
        State.signer = await provider.getSigner();
        State.userAddress = address;

        loadCachedBalance(address);

        // Login Firebase silencioso
        try { await signIn(State.userAddress); } catch (e) { console.warn('Auth warning:', e.message); }

        instantiateContracts(State.signer);
        
        await loadUserData(); 
        
        if (State.currentUserBalance) {
            localStorage.setItem(`balance_${address.toLowerCase()}`, State.currentUserBalance.toString());
        }

        startBalancePolling();
        
        State.isConnected = true;
        return true;
    } catch (error) {
        console.error("Setup error:", error);
        return false;
    }
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

export async function initPublicProvider() {
    try {
        State.publicProvider = new ethers.JsonRpcProvider(sepoliaRpcUrl);

        if (isValidAddress(addresses.bkcToken))
            State.bkcTokenContractPublic = new ethers.Contract(addresses.bkcToken, bkcTokenABI, State.publicProvider);
        if (isValidAddress(addresses.delegationManager))
            State.delegationManagerContractPublic = new ethers.Contract(addresses.delegationManager, delegationManagerABI, State.publicProvider);
        if (isValidAddress(addresses.faucet))
            State.faucetContractPublic = new ethers.Contract(addresses.faucet, faucetABI, State.publicProvider);
        if (isValidAddress(addresses.rentalManager))
            State.rentalManagerContractPublic = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.publicProvider);
        
        loadPublicData().then(() => {
             if (window.updateUIState) window.updateUIState();
        });
        
        console.log("✅ Public provider initialized.");
    } catch (e) {
        console.error("❌ Public provider error:", e);
    }
}

/**
 * Inicializa os ouvintes do Web3Modal.
 * Agora inclui lógica de RECONEXÃO AUTOMÁTICA ao carregar a página.
 */
export function initWalletSubscriptions(callback) {
    
    // 1. Verifica imediatamente se já existe uma conexão ativa no Web3Modal
    if (web3modal.getIsConnected()) {
        const address = web3modal.getAddress();
        const walletProvider = web3modal.getWalletProvider();
        
        if (address && walletProvider) {
            console.log("🔄 Auto-reconnecting session...");
            const ethersProvider = new ethers.BrowserProvider(walletProvider);
            State.web3Provider = walletProvider;
            
            setupSignerAndLoadData(ethersProvider, address).then(success => {
                if (success) {
                    callback({ isConnected: true, address, isNewConnection: false });
                }
            });
        }
    }

    // 2. Configura o Listener para mudanças futuras (Troca de conta, Desconexão manual)
    let isHandlingChange = false;

    const handler = async ({ provider, address, chainId, isConnected }) => {
        if (isHandlingChange) return; // Debounce
        isHandlingChange = true;
        
        try {
            if (isConnected) {
                // Se a rede estiver errada, pede para trocar
                if (chainId !== Number(sepoliaChainId)) {
                    showToast(`Wrong network. Switch to Sepolia.`, 'error');
                    try {
                        await provider.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x' + (Number(sepoliaChainId)).toString(16) }],
                        });
                    } catch (e) {}
                    isHandlingChange = false;
                    return;
                }

                const ethersProvider = new ethers.BrowserProvider(provider);
                State.web3Provider = provider; 

                const success = await setupSignerAndLoadData(ethersProvider, address);
                
                if (success) {
                    callback({ isConnected: true, address, chainId, isNewConnection: true });
                } else {
                    try { await web3modal.disconnect(); } catch(e){}
                }

            } else {
                // Lógica de Desconexão Real
                if (balancePollingInterval) {
                    clearInterval(balancePollingInterval);
                    balancePollingInterval = null;
                }
                
                State.isConnected = false;
                State.userAddress = null;
                State.signer = null;
                State.currentUserBalance = 0n;
                
                callback({ isConnected: false });
            }
        } catch (err) {
            console.error("Wallet subscription error:", err);
        } finally {
            setTimeout(() => { isHandlingChange = false; }, 500);
        }
    };
    
    try {
        web3modal.subscribeProvider(handler);
    } catch(e) { console.error("Web3Modal subscribe error:", e); }
}

export function openConnectModal() { 
    try { web3modal.open(); } catch(e) { console.error("Open modal error", e); }
}

export async function disconnectWallet() {
    if (balancePollingInterval) {
        clearInterval(balancePollingInterval);
        balancePollingInterval = null;
    }
    try { await web3modal.disconnect(); } catch(e) {}
}