// modules/wallet.js

const ethers = window.ethers; // Manter esta única declaração e uso.

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { showToast, openModal } from '../ui-feedback.js'; 
import { 
    addresses, sepoliaRpcUrl, sepoliaChainId,
    bkcTokenABI, delegationManagerABI, rewardManagerABI, 
    rewardBoosterABI, nftBondingCurveABI, actionsManagerABI
} from '../config.js';
import { loadPublicData, loadUserData } from './data.js';
import { formatBigNumber, formatAddress } from '../utils.js';
// Importa o serviço de autenticação do Firebase
import { signIn } from './firebase-auth-service.js';

// --- Funções Auxiliares Internas ---

function updateConnectionStatus(status, message) {
    const statuses = {
        disconnected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'fa-circle' },
        connecting: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: 'fa-spinner fa-spin' },
        connected: { bg: 'bg-green-500/20', text: 'text-green-400', icon: 'fa-circle' },
    };
    const { bg, text, icon } = statuses[status];
    DOMElements.connectionStatus.className = `hidden sm:inline-flex items-center gap-2 py-1.5 px-3 rounded-full text-sm font-medium ${bg} ${text}`;
    DOMElements.connectionStatus.innerHTML = `<i class="fa-solid ${icon} text-xs"></i><span>${message}</span>`;
}

function instantiateContracts(signerOrProvider) {
    // Garante que os contratos só sejam instanciados se os endereços existirem, prevenindo erros do Ethers.
    if (addresses.bkcToken)
        State.bkcTokenContract = new ethers.Contract(addresses.bkcToken, bkcTokenABI, signerOrProvider);
    
    if (addresses.delegationManager)
        State.delegationManagerContract = new ethers.Contract(addresses.delegationManager, delegationManagerABI, signerOrProvider);
    
    if (addresses.rewardManager)
        State.rewardManagerContract = new ethers.Contract(addresses.rewardManager, rewardManagerABI, signerOrProvider);
        
    if (addresses.actionsManager)
        State.actionsManagerContract = new ethers.Contract(addresses.actionsManager, actionsManagerABI, signerOrProvider);
    
    // Verificações adicionais para contratos opcionais/NFTs
    if (addresses.rewardBoosterNFT) {
        State.rewardBoosterContract = new ethers.Contract(addresses.rewardBoosterNFT, rewardBoosterABI, signerOrProvider);
    }
    if (addresses.nftBondingCurve) {
        State.nftBondingCurveContract = new ethers.Contract(addresses.nftBondingCurve, nftBondingCurveABI, signerOrProvider);
    }
}

async function setupSignerAndLoadData() {
    State.signer = await State.provider.getSigner();
    State.userAddress = await State.signer.getAddress(); // Garante que o endereço é obtido
    
    // IMPORTANTE: Faz o login anônimo no Firebase e cria a sessão segura
    try {
        // Passa o endereço da carteira para o serviço Firebase
        await signIn(State.userAddress); 
    } catch (error) {
        showToast("Falha na autenticação do Firebase.", "error");
        console.error("Erro de Auth do Firebase:", error);
        disconnectWallet(); 
        return false;
    }

    instantiateContracts(State.signer);
    await loadUserData();
    State.isConnected = true;
    updateConnectionStatus('connected', formatAddress(State.userAddress));
    return true;
}


// --- Funções Exportadas ---

export async function initPublicProvider() {
     try {
        State.publicProvider = new ethers.JsonRpcProvider(sepoliaRpcUrl);
        instantiateContracts(State.publicProvider);
        await loadPublicData();
    } catch (e) {
        console.error("Failed to initialize public provider:", e);
        showToast("Could not connect to the blockchain network.", "error");
    }
}

export async function checkInitialConnection() {
    if (typeof window.ethereum === 'undefined') {
        return false;
    }
    try {
        State.provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await State.provider.listAccounts();
        if (accounts.length > 0) {
            console.log("Existing connection found. Auto-connecting...");
            return await setupSignerAndLoadData();
        }
        return false;
    } catch (error) {
        console.warn("Could not check initial connection:", error);
        return false;
    }
}

export async function connectWallet() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (typeof window.ethereum === 'undefined') {
        openModal('Install MetaMask', 'Please install MetaMask or another Web3 wallet to connect.', 'Install MetaMask', 'https://metamask.io/download/');
        return false;
    }
    
    DOMElements.connectButton.disabled = true;
    DOMElements.connectButton.innerHTML = '<div class="loader"></div>';
    updateConnectionStatus('connecting', 'Connecting...');

    try {
        State.provider = new ethers.BrowserProvider(window.ethereum);
        await State.provider.send("eth_requestAccounts", []);
        
        const network = await State.provider.getNetwork();
        if (network.chainId !== sepoliaChainId) {
            showToast('Please switch to the Sepolia network.', 'info');
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
        }
        
        const success = await setupSignerAndLoadData();
        if(success) {
            showToast('Wallet connected successfully!', 'success');
        }
        return success;

    } catch (error) {
        console.error('Error connecting wallet:', error);
        showToast(`Error connecting: ${error.message || 'User rejected the connection.'}`, 'error');
        disconnectWallet();
        return false;
    } finally {
        DOMElements.connectButton.disabled = false;
        DOMElements.connectButton.innerHTML = '<i class="fa-solid fa-wallet mr-2"></i>Connect Wallet';
    }
}

export function disconnectWallet() {
    State.provider = null; State.signer = null; State.userAddress = null;
    State.isConnected = false;
    
    instantiateContracts(State.publicProvider);
    
    updateConnectionStatus('disconnected', 'Disconnected');
    
    showToast('Wallet disconnected.', 'info');
    
    loadPublicData(); 
}