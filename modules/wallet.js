// js/modules/wallet.js
// ✅ VERSÃO V7.1: FIX - Suporte completo para Embedded Wallets (Social Login)

import { createWeb3Modal, defaultConfig } from 'https://esm.sh/@web3modal/ethers@5.1.11?bundle';

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import {
    addresses, sepoliaRpcUrl, 
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

const ethers = window.ethers; 

// ============================================================================
// 1. CONFIGURAÇÃO
// ============================================================================
const ARBITRUM_SEPOLIA_ID_DECIMAL = 421614;
const ARBITRUM_SEPOLIA_ID_HEX = '0x66eee'; 

let balancePollingInterval = null;

// 🔥 V6.9: Novas variáveis para controle de throttle
let lastBalanceUpdate = 0;
let balanceErrorCount = 0;
const BALANCE_UPDATE_THROTTLE_MS = 5000;  // Mínimo 5s entre updates de UI
const MAX_BALANCE_ERRORS = 3;              // Para de tentar após 3 erros
const POLLING_INTERVAL_MS = 10000;         // 10s entre checks (era 5s)

// ============================================================================
// 2. WEB3MODAL SETUP
// ============================================================================
const WALLETCONNECT_PROJECT_ID = 'cd4bdedee7a7e909ebd3df8bbc502aed';

const arbitrumSepoliaConfig = {
    chainId: ARBITRUM_SEPOLIA_ID_DECIMAL,
    name: 'Arbitrum Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.arbiscan.io',
    rpcUrl: sepoliaRpcUrl 
};

const metadata = {
    name: 'Backcoin Protocol',
    description: 'DeFi Ecosystem',
    url: window.location.origin,
    icons: [window.location.origin + '/assets/bkc_logo_3d.png']
};

const ethersConfig = defaultConfig({
    metadata,
    enableEIP6963: true,      
    enableInjected: true,     
    enableCoinbase: false,    
    rpcUrl: sepoliaRpcUrl,
    defaultChainId: ARBITRUM_SEPOLIA_ID_DECIMAL,
    enableEmail: true,
    enableEns: false,
    auth: {
        email: true,
        showWallets: true,
        walletFeatures: true
    }
});

const web3modal = createWeb3Modal({
    ethersConfig,
    chains: [arbitrumSepoliaConfig],
    projectId: WALLETCONNECT_PROJECT_ID,
    enableAnalytics: true,    
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#f59e0b', 
        '--w3m-border-radius-master': '1px',
        '--w3m-z-index': 100
    }
});

// ============================================================================
// 3. UI FORCER
// ============================================================================

function startUIEnforcer(address) {
    if (!address) return;
    State.userAddress = address;
}

function stopUIEnforcer() {
    // Limpeza (Placeholder)
}

// ============================================================================
// 4. LÓGICA CORE
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
            State.currentUserBalance = BigInt(cached);
            if (window.updateUIState) window.updateUIState();
        } catch (e) { }
    }
}

function instantiateContracts(signerOrProvider) {
    try {
        if (isValidAddress(addresses.bkcToken)) State.bkcTokenContract = new ethers.Contract(addresses.bkcToken, bkcTokenABI, signerOrProvider);
        if (isValidAddress(addresses.delegationManager)) State.delegationManagerContract = new ethers.Contract(addresses.delegationManager, delegationManagerABI, signerOrProvider);
        if (isValidAddress(addresses.rewardBoosterNFT)) State.rewardBoosterContract = new ethers.Contract(addresses.rewardBoosterNFT, rewardBoosterABI, signerOrProvider);
        if (isValidAddress(addresses.publicSale)) State.publicSaleContract = new ethers.Contract(addresses.publicSale, publicSaleABI, signerOrProvider);
        if (isValidAddress(addresses.faucet)) State.faucetContract = new ethers.Contract(addresses.faucet, faucetABI, signerOrProvider);
        if (isValidAddress(addresses.rentalManager)) State.rentalManagerContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signerOrProvider);
        if (isValidAddress(addresses.actionsManager)) State.actionsManagerContract = new ethers.Contract(addresses.actionsManager, actionsManagerABI, signerOrProvider);
        if (isValidAddress(addresses.decentralizedNotary)) State.decentralizedNotaryContract = new ethers.Contract(addresses.decentralizedNotary, decentralizedNotaryABI, signerOrProvider);
        if (isValidAddress(addresses.ecosystemManager)) State.ecosystemManagerContract = new ethers.Contract(addresses.ecosystemManager, ecosystemManagerABI, signerOrProvider);
    } catch (e) { console.warn("Contract init partial failure"); }
}

// 🔥 V6.9: Função corrigida - evita loop infinito
function startBalancePolling() {
    // Limpa interval existente
    if (balancePollingInterval) {
        clearInterval(balancePollingInterval);
        balancePollingInterval = null;
    }
    
    // Valida requisitos
    if (!State.bkcTokenContractPublic || !State.userAddress) {
        console.warn("Cannot start balance polling: missing contract or address");
        return;
    }
    
    // Reset contador de erros
    balanceErrorCount = 0;
    
    // Check inicial com delay para UI estabilizar
    setTimeout(() => {
        checkBalance();
    }, 1000);
    
    // Inicia polling com intervalo mais longo (10s ao invés de 5s)
    balancePollingInterval = setInterval(checkBalance, POLLING_INTERVAL_MS);
    
    console.log("Balance polling started (10s interval)");
}

// 🔥 V6.9: Função completamente reescrita para evitar loop infinito
async function checkBalance() {
    // Skip se tab está escondida
    if (document.hidden) return;
    
    // Skip se não conectado
    if (!State.isConnected || !State.userAddress) return;
    
    // Skip se contrato não disponível
    if (!State.bkcTokenContractPublic) return;
    
    const now = Date.now();
    
    try {
        const newBalance = await State.bkcTokenContractPublic.balanceOf(State.userAddress);
        
        // Reset contador de erros em sucesso
        balanceErrorCount = 0;
        
        // Compara saldos corretamente (BigInt comparison)
        const currentBalance = State.currentUserBalance || 0n;
        const hasChanged = newBalance.toString() !== currentBalance.toString();
        
        if (hasChanged) {
            State.currentUserBalance = newBalance;
            localStorage.setItem(`balance_${State.userAddress.toLowerCase()}`, newBalance.toString());
            
            // 🔥 THROTTLE: Só atualiza UI se passou tempo suficiente
            if (now - lastBalanceUpdate > BALANCE_UPDATE_THROTTLE_MS) {
                lastBalanceUpdate = now;
                // 🔥 Usa false para não forçar re-render completo da página
                if (window.updateUIState) window.updateUIState(false);
            }
        }
        
    } catch (error) {
        // Incrementa contador de erros
        balanceErrorCount++;
        
        // Log apenas os primeiros erros
        if (balanceErrorCount <= 3) {
            console.warn(`Balance check failed (${balanceErrorCount}/${MAX_BALANCE_ERRORS}):`, error.message?.slice(0, 50));
        }
        
        // 🔥 CRITICAL FIX: NÃO dispara updates em erros!
        // Apenas para o polling se muitos erros
        if (balanceErrorCount >= MAX_BALANCE_ERRORS) {
            console.warn("Too many balance check errors. Stopping polling temporarily.");
            if (balancePollingInterval) {
                clearInterval(balancePollingInterval);
                balancePollingInterval = null;
            }
            
            // Tenta reiniciar após 60 segundos
            setTimeout(() => {
                console.log("Attempting to restart balance polling...");
                balanceErrorCount = 0;
                startBalancePolling();
            }, 60000);
        }
        
        // 🔥 REMOVIDO: Não seta balance para 0n em erro
        // 🔥 REMOVIDO: Não chama updateUIState em erro
    }
}

async function ensureNetwork(provider) {
    try {
        const network = await provider.getNetwork();
        if (Number(network.chainId) === ARBITRUM_SEPOLIA_ID_DECIMAL) return true;
        
        try {
            await provider.send("wallet_switchEthereumChain", [{ chainId: ARBITRUM_SEPOLIA_ID_HEX }]);
            return true;
        } catch (switchError) { return true; }
    } catch (e) { return true; }
}

async function setupSignerAndLoadData(provider, address) {
    try {
        if (!validateEthereumAddress(address)) return false;

        await ensureNetwork(provider);

        State.provider = provider;
        
        // 🔥 V7.1: Melhor handling para embedded wallets (social login)
        // Embedded wallets do Web3Modal já vêm com signer configurado
        try {
            const signer = await provider.getSigner();
            const signerAddr = await signer.getAddress();
            State.signer = signer;
            console.log('✅ Signer obtained for:', signerAddr.slice(0, 10) + '...');
        } catch(signerError) {
            console.warn(`⚠️ getSigner() failed: ${signerError.message}`);
            
            // 🔥 Para embedded wallets, o provider PODE assinar diretamente
            // Salvamos o provider como "signer" - Web3Modal gerencia internamente
            State.signer = provider;
            console.log('📱 Embedded wallet mode - provider will handle signing');
        }
        
        State.userAddress = address;
        State.isConnected = true; 

        // Cache + Contratos
        loadCachedBalance(address);
        
        // 🔥 V7.1: Instancia contratos com signer (ou provider para embedded)
        instantiateContracts(State.signer || State.publicProvider);
        
        // Login Firebase
        try { signIn(State.userAddress); } catch (e) { }

        // 🔥 V7.1: Força carregamento de dados com refresh
        loadUserData(true).then(() => {
            console.log('📊 User data loaded. Balance:', State.currentUserBalance?.toString() || '0');
            if (window.updateUIState) window.updateUIState(false);
        }).catch((e) => {
            console.warn('⚠️ User data load warning:', e.message);
        });

        startBalancePolling();
        
        return true;

    } catch (error) {
        console.error("Setup warning:", error);
        if (address) return true;
        return false;
    }
}

// ============================================================================
// 5. EXPORTS
// ============================================================================

export async function initPublicProvider() {
    try {
        State.publicProvider = new ethers.JsonRpcProvider(sepoliaRpcUrl);

        if (isValidAddress(addresses.bkcToken)) State.bkcTokenContractPublic = new ethers.Contract(addresses.bkcToken, bkcTokenABI, State.publicProvider);
        if (isValidAddress(addresses.delegationManager)) State.delegationManagerContractPublic = new ethers.Contract(addresses.delegationManager, delegationManagerABI, State.publicProvider);
        if (isValidAddress(addresses.faucet)) State.faucetContractPublic = new ethers.Contract(addresses.faucet, faucetABI, State.publicProvider);
        if (isValidAddress(addresses.rentalManager)) State.rentalManagerContractPublic = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.publicProvider);
        if (isValidAddress(addresses.ecosystemManager)) State.ecosystemManagerContractPublic = new ethers.Contract(addresses.ecosystemManager, ecosystemManagerABI, State.publicProvider);
        if (isValidAddress(addresses.actionsManager)) State.actionsManagerContractPublic = new ethers.Contract(addresses.actionsManager, actionsManagerABI, State.publicProvider);
        
        loadPublicData().then(() => {
             if (window.updateUIState) window.updateUIState();
        });
    } catch (e) { console.error("Public provider error:", e); }
}

export function initWalletSubscriptions(callback) {
    let currentAddress = web3modal.getAddress();
    
    if (web3modal.getIsConnected() && currentAddress) {
        const walletProvider = web3modal.getWalletProvider();
        if (walletProvider) {
            const ethersProvider = new ethers.BrowserProvider(walletProvider);
            State.web3Provider = walletProvider;
            
            // Callback IMEDIATO
            callback({ isConnected: true, address: currentAddress, isNewConnection: false });
            setupSignerAndLoadData(ethersProvider, currentAddress);
        }
    }

    const handler = async ({ provider, address, chainId, isConnected }) => {
        try {
            if (isConnected) {
                let activeAddress = address || web3modal.getAddress();
                if (!activeAddress && provider) {
                    try {
                        const tempProvider = new ethers.BrowserProvider(provider);
                        const signer = await tempProvider.getSigner();
                        activeAddress = await signer.getAddress();
                    } catch(e) {}
                }

                if (activeAddress) {
                    const ethersProvider = new ethers.BrowserProvider(provider);
                    State.web3Provider = provider; 

                    callback({ isConnected: true, address: activeAddress, chainId, isNewConnection: true });
                    await setupSignerAndLoadData(ethersProvider, activeAddress);

                } else {
                    if (balancePollingInterval) clearInterval(balancePollingInterval);
                    State.isConnected = false;
                    State.userAddress = null;
                    State.signer = null;
                    stopUIEnforcer();
                    callback({ isConnected: false });
                }
            } else {
                if (balancePollingInterval) clearInterval(balancePollingInterval);
                State.isConnected = false;
                State.userAddress = null;
                State.signer = null;
                stopUIEnforcer();
                callback({ isConnected: false });
            }
        } catch (err) { }
    };
    
    web3modal.subscribeProvider(handler);
}

export function openConnectModal() { web3modal.open(); }
export async function disconnectWallet() { await web3modal.disconnect(); }