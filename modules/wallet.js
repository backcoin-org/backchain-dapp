// js/modules/wallet.js
// ✅ VERSÃO V8.0: Auto Network Management - Fix RPC issues automatically

import { createWeb3Modal, defaultConfig } from 'https://esm.sh/@web3modal/ethers@5.1.11?bundle';

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import {
    addresses, 
    sepoliaRpcUrl,
    RPC_ENDPOINTS,
    getCurrentRpcUrl,
    switchToNextRpc,
    markRpcUnhealthy,
    markRpcHealthy,
    resetToPrimaryRpc,
    bkcTokenABI, 
    delegationManagerABI, 
    rewardBoosterABI, 
    actionsManagerABI,
    fortunePoolV2ABI,
    publicSaleABI,
    faucetABI,
    ecosystemManagerABI,
    decentralizedNotaryABI,
    rentalManagerABI,
    // 🔥 V8.0: Network Management imports
    METAMASK_NETWORK_CONFIG,
    ensureCorrectNetworkConfig,
    updateMetaMaskNetwork,
    checkRpcHealth,
    setupNetworkChangeListener
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

// 🔥 V6.9: Variáveis para controle de throttle
let lastBalanceUpdate = 0;
let balanceErrorCount = 0;
const BALANCE_UPDATE_THROTTLE_MS = 5000;  // Mínimo 5s entre updates de UI
const MAX_BALANCE_ERRORS = 3;              // Para de tentar após 3 erros
const POLLING_INTERVAL_MS = 30000;         // 30s entre checks (reduced from 10s to lower RPC load)

// 🔥 V7.0: Variáveis para controle de RPC
let rpcRetryCount = 0;
const MAX_RPC_RETRIES = 3;
let currentPublicProvider = null;

// ============================================================================
// 2. WEB3MODAL SETUP
// ============================================================================
const WALLETCONNECT_PROJECT_ID = 'cd4bdedee7a7e909ebd3df8bbc502aed';

// 🔥 V8.0: Usa configuração centralizada do METAMASK_NETWORK_CONFIG
const arbitrumSepoliaConfig = {
    chainId: METAMASK_NETWORK_CONFIG.chainIdDecimal,
    name: METAMASK_NETWORK_CONFIG.chainName,
    currency: METAMASK_NETWORK_CONFIG.nativeCurrency.symbol,
    explorerUrl: METAMASK_NETWORK_CONFIG.blockExplorerUrls[0],
    rpcUrl: METAMASK_NETWORK_CONFIG.rpcUrls[0]  // Usa o RPC primário da config
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
// 3. 🔥 MULTI-RPC SYSTEM (NOVO!)
// ============================================================================

/**
 * Verifica se um erro é relacionado a RPC
 */
function isRpcError(error) {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || error?.error?.code;
    
    return (
        errorCode === -32603 ||  // Internal JSON-RPC error
        errorCode === -32000 ||  // Server error
        errorCode === 429 ||     // Too many requests
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('internal json-rpc') ||
        errorMessage.includes('unexpected token') ||  // HTML response instead of JSON
        errorMessage.includes('<html')  // HTML error page
    );
}

/**
 * Cria um novo provider com o RPC atual
 */
function createProvider(rpcUrl) {
    return new ethers.JsonRpcProvider(rpcUrl || getCurrentRpcUrl());
}

/**
 * Tenta executar uma operação com fallback de RPC
 * @param {Function} operation - Função assíncrona a ser executada
 * @param {number} maxRetries - Número máximo de tentativas
 * @returns {Promise<any>} - Resultado da operação
 */
async function executeWithRpcFallback(operation, maxRetries = MAX_RPC_RETRIES) {
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const result = await operation();
            
            // Sucesso! Marca RPC como saudável
            markRpcHealthy(getCurrentRpcUrl());
            rpcRetryCount = 0;
            
            return result;
            
        } catch (error) {
            lastError = error;
            
            if (isRpcError(error)) {
                console.warn(`⚠️ RPC error (attempt ${attempt + 1}/${maxRetries}):`, error.message?.slice(0, 80));
                
                // Marca RPC atual como não saudável
                markRpcUnhealthy(getCurrentRpcUrl());
                
                // Tenta próximo RPC
                const newRpcUrl = switchToNextRpc();
                console.log(`🔄 Switching to: ${newRpcUrl}`);
                
                // Recria o provider público com novo RPC
                await recreatePublicProvider();
                
                // Pequeno delay antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
                
            } else {
                // Não é erro de RPC, propaga o erro
                throw error;
            }
        }
    }
    
    // Todas as tentativas falharam
    console.error('❌ All RPC attempts failed');
    throw lastError;
}

/**
 * Recria o provider público com o RPC atual
 */
async function recreatePublicProvider() {
    const newRpcUrl = getCurrentRpcUrl();
    
    try {
        State.publicProvider = createProvider(newRpcUrl);
        currentPublicProvider = State.publicProvider;
        
        // Recria contratos públicos
        if (isValidAddress(addresses.bkcToken)) {
            State.bkcTokenContractPublic = new ethers.Contract(
                addresses.bkcToken, 
                bkcTokenABI, 
                State.publicProvider
            );
        }
        if (isValidAddress(addresses.delegationManager)) {
            State.delegationManagerContractPublic = new ethers.Contract(
                addresses.delegationManager, 
                delegationManagerABI, 
                State.publicProvider
            );
        }
        if (isValidAddress(addresses.faucet)) {
            State.faucetContractPublic = new ethers.Contract(
                addresses.faucet, 
                faucetABI, 
                State.publicProvider
            );
        }
        if (isValidAddress(addresses.rentalManager)) {
            State.rentalManagerContractPublic = new ethers.Contract(
                addresses.rentalManager, 
                rentalManagerABI, 
                State.publicProvider
            );
        }
        if (isValidAddress(addresses.ecosystemManager)) {
            State.ecosystemManagerContractPublic = new ethers.Contract(
                addresses.ecosystemManager, 
                ecosystemManagerABI, 
                State.publicProvider
            );
        }
        if (isValidAddress(addresses.actionsManager)) {
            State.actionsManagerContractPublic = new ethers.Contract(
                addresses.actionsManager, 
                actionsManagerABI, 
                State.publicProvider
            );
        }
        
        // FortunePool V2 - usa fortunePoolV2 ou fortunePool como fallback
        const fortunePoolAddress = addresses.fortunePoolV2 || addresses.fortunePool;
        if (isValidAddress(fortunePoolAddress)) {
            State.fortunePoolContractPublic = new ethers.Contract(
                fortunePoolAddress, 
                fortunePoolV2ABI, 
                State.publicProvider
            );
        }
        
        console.log(`✅ Public provider recreated with: ${newRpcUrl.slice(0, 50)}...`);
        
    } catch (e) {
        console.error('Failed to recreate public provider:', e);
    }
}

// ============================================================================
// 4. UI FORCER
// ============================================================================

function startUIEnforcer(address) {
    if (!address) return;
    State.userAddress = address;
}

function stopUIEnforcer() {
    // Limpeza (Placeholder)
}

// ============================================================================
// 5. LÓGICA CORE
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
        
        // FortunePool V2 - usa fortunePoolV2 ou fortunePool como fallback
        const fortunePoolAddress = addresses.fortunePoolV2 || addresses.fortunePool;
        if (isValidAddress(fortunePoolAddress)) {
            State.fortunePoolContract = new ethers.Contract(fortunePoolAddress, fortunePoolV2ABI, signerOrProvider);
        }
    } catch (e) { console.warn("Contract init partial failure"); }
}

// 🔥 V7.0: Balance polling com fallback de RPC
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
    
    // Reset contadores
    balanceErrorCount = 0;
    rpcRetryCount = 0;
    
    // Check inicial com delay para UI estabilizar
    setTimeout(() => {
        checkBalance();
    }, 1000);
    
    // Inicia polling com intervalo de 10s
    balancePollingInterval = setInterval(checkBalance, POLLING_INTERVAL_MS);
    
    console.log("✅ Balance polling started (30s interval)");
}

// 🔥 V7.0: Check balance com suporte a multi-RPC
async function checkBalance() {
    // Skip se tab está escondida
    if (document.hidden) return;
    
    // Skip se não conectado
    if (!State.isConnected || !State.userAddress) return;
    
    // Skip se contrato não disponível
    if (!State.bkcTokenContractPublic) return;
    
    const now = Date.now();
    
    try {
        // 🔥 V7.0: Usa executeWithRpcFallback para auto-recovery
        const newBalance = await executeWithRpcFallback(async () => {
            return await State.bkcTokenContractPublic.balanceOf(State.userAddress);
        }, 2); // Máximo 2 tentativas no polling
        
        // Reset contador de erros em sucesso
        balanceErrorCount = 0;
        
        // Compara saldos corretamente (BigInt comparison)
        const currentBalance = State.currentUserBalance || 0n;
        const hasChanged = newBalance.toString() !== currentBalance.toString();
        
        if (hasChanged) {
            State.currentUserBalance = newBalance;
            localStorage.setItem(`balance_${State.userAddress.toLowerCase()}`, newBalance.toString());
            
            // THROTTLE: Só atualiza UI se passou tempo suficiente
            if (now - lastBalanceUpdate > BALANCE_UPDATE_THROTTLE_MS) {
                lastBalanceUpdate = now;
                if (window.updateUIState) window.updateUIState(false);
            }
        }
        
    } catch (error) {
        // Incrementa contador de erros
        balanceErrorCount++;
        
        // Log apenas os primeiros erros
        if (balanceErrorCount <= 3) {
            console.warn(`⚠️ Balance check failed (${balanceErrorCount}/${MAX_BALANCE_ERRORS}):`, error.message?.slice(0, 50));
        }
        
        // Para o polling se muitos erros
        if (balanceErrorCount >= MAX_BALANCE_ERRORS) {
            console.warn("❌ Too many balance check errors. Stopping polling temporarily.");
            if (balancePollingInterval) {
                clearInterval(balancePollingInterval);
                balancePollingInterval = null;
            }
            
            // Tenta reiniciar após 60 segundos com RPC primário
            setTimeout(() => {
                console.log("🔄 Attempting to restart balance polling with primary RPC...");
                resetToPrimaryRpc();
                recreatePublicProvider().then(() => {
                    balanceErrorCount = 0;
                    startBalancePolling();
                });
            }, 60000);
        }
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
        
        // Garante que State.signer nunca seja nulo
        try {
            State.signer = await provider.getSigner(); 
        } catch(signerError) {
            State.signer = provider; 
            console.warn(`Could not get standard Signer. Using Provider as read-only. Warning: ${signerError.message}`);
        }
        
        State.userAddress = address;
        State.isConnected = true; 

        // Cache + Contratos
        loadCachedBalance(address);
        instantiateContracts(State.signer);
        
        // Login Firebase
        try { signIn(State.userAddress); } catch (e) { }

        // Carregamento Assíncrono - usa false para não forçar re-render
        loadUserData().then(() => {
            if (window.updateUIState) window.updateUIState(false);
        }).catch(() => {});

        startBalancePolling();
        
        return true;

    } catch (error) {
        console.error("Setup warning:", error);
        if (address) return true;
        return false;
    }
}

// ============================================================================
// 6. EXPORTS
// ============================================================================

// 🔥 V8.0: initPublicProvider com Auto Network Management
export async function initPublicProvider() {
    try {
        // 🔥 V8.0: Verifica e corrige configuração de rede no MetaMask automaticamente
        if (window.ethereum) {
            const networkCheck = await ensureCorrectNetworkConfig();
            if (networkCheck.fixed) {
                console.log('✅ MetaMask network config was auto-fixed');
            } else if (!networkCheck.success && !networkCheck.skipped) {
                console.warn('Initial network config check:', networkCheck.error);
            }
        }
        
        const rpcUrl = getCurrentRpcUrl();
        console.log(`🌐 Initializing public provider with: ${rpcUrl.slice(0, 50)}...`);
        
        State.publicProvider = createProvider(rpcUrl);
        currentPublicProvider = State.publicProvider;

        if (isValidAddress(addresses.bkcToken)) State.bkcTokenContractPublic = new ethers.Contract(addresses.bkcToken, bkcTokenABI, State.publicProvider);
        if (isValidAddress(addresses.delegationManager)) State.delegationManagerContractPublic = new ethers.Contract(addresses.delegationManager, delegationManagerABI, State.publicProvider);
        if (isValidAddress(addresses.faucet)) State.faucetContractPublic = new ethers.Contract(addresses.faucet, faucetABI, State.publicProvider);
        if (isValidAddress(addresses.rentalManager)) State.rentalManagerContractPublic = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.publicProvider);
        if (isValidAddress(addresses.ecosystemManager)) State.ecosystemManagerContractPublic = new ethers.Contract(addresses.ecosystemManager, ecosystemManagerABI, State.publicProvider);
        if (isValidAddress(addresses.actionsManager)) State.actionsManagerContractPublic = new ethers.Contract(addresses.actionsManager, actionsManagerABI, State.publicProvider);
        
        // FortunePool V2 - usa fortunePoolV2 ou fortunePool como fallback
        const fortunePoolAddress = addresses.fortunePoolV2 || addresses.fortunePool;
        if (isValidAddress(fortunePoolAddress)) {
            State.fortunePoolContractPublic = new ethers.Contract(fortunePoolAddress, fortunePoolV2ABI, State.publicProvider);
            console.log("✅ FortunePool V2 contract initialized:", fortunePoolAddress);
        }
        
        // 🔥 V8.0: Carrega dados com fallback
        try {
            await executeWithRpcFallback(async () => {
                await loadPublicData();
            });
        } catch (e) {
            console.warn("Initial public data load failed, will retry on user interaction");
        }
        
        // 🔥 V8.0: Configura listener para mudanças de rede
        setupNetworkChangeListener(async (info) => {
            if (!info.isCorrectNetwork) {
                console.log('⚠️ User switched to wrong network');
                showToast("Please switch back to Arbitrum Sepolia", "warning");
            } else {
                // Rede correta, verifica se RPCs estão bons
                const health = await checkRpcHealth();
                if (!health.healthy) {
                    console.log('⚠️ RPC issues after network change, updating...');
                    await updateMetaMaskNetwork();
                    await recreatePublicProvider();
                }
            }
        });
        
        // 🔥 V8.0: Inicia monitoramento periódico de saúde do RPC
        startRpcHealthMonitoring();
        
        if (window.updateUIState) window.updateUIState();
        
        console.log("✅ Public provider initialized");
        
    } catch (e) { 
        console.error("Public provider error:", e);
        
        // 🔥 V8.0: Tenta corrigir MetaMask e usar próximo RPC
        if (window.ethereum) {
            await updateMetaMaskNetwork();
        }
        
        const newRpcUrl = switchToNextRpc();
        console.log(`🔄 Retrying with: ${newRpcUrl}`);
        
        try {
            State.publicProvider = createProvider(newRpcUrl);
            console.log("✅ Public provider initialized with fallback RPC");
        } catch (e2) {
            console.error("❌ All RPC endpoints failed");
        }
    }
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

// ============================================================================
// 7. 🔥 V8.0: RPC HEALTH MONITORING
// ============================================================================

let rpcHealthMonitorInterval = null;

/**
 * Inicia monitoramento periódico da saúde do RPC
 * Se detectar problemas, tenta corrigir automaticamente
 */
function startRpcHealthMonitoring() {
    // Para qualquer monitoramento existente
    if (rpcHealthMonitorInterval) {
        clearInterval(rpcHealthMonitorInterval);
    }
    
    // Verifica a cada 60 segundos (reduced from 30s to lower MetaMask RPC load)
    let lastMetaMaskUpdateAttempt = 0;
    rpcHealthMonitorInterval = setInterval(async () => {
        // Só verifica se a tab está visível e o usuário está conectado
        if (document.hidden || !State.isConnected) return;

        const health = await checkRpcHealth();

        if (!health.healthy) {
            const now = Date.now();
            // Only attempt MetaMask update every 5 minutes to avoid wallet_addEthereumChain spam
            if (now - lastMetaMaskUpdateAttempt < 300000) {
                return;
            }
            lastMetaMaskUpdateAttempt = now;

            console.log(`⚠️ RPC health check failed (${health.reason}), attempting fix...`);

            // Tenta atualizar os RPCs no MetaMask
            const updated = await updateMetaMaskNetwork();

            if (updated) {
                console.log('✅ MetaMask RPCs updated via health monitor');
                await recreatePublicProvider();

                // Reset contadores
                balanceErrorCount = 0;
                rpcRetryCount = 0;
            }
        }
    }, 60000);
    
    // Também verifica quando a tab fica ativa (with cooldown)
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden && State.isConnected) {
            const now = Date.now();
            if (now - lastMetaMaskUpdateAttempt < 300000) return;
            const health = await checkRpcHealth();
            if (!health.healthy) {
                lastMetaMaskUpdateAttempt = now;
                console.log('⚠️ RPC unhealthy on tab focus, fixing...');
                await updateMetaMaskNetwork();
                await recreatePublicProvider();
            }
        }
    });
    
    console.log('✅ RPC health monitoring started (30s interval)');
}

/**
 * Para o monitoramento de saúde do RPC
 */
function stopRpcHealthMonitoring() {
    if (rpcHealthMonitorInterval) {
        clearInterval(rpcHealthMonitorInterval);
        rpcHealthMonitorInterval = null;
    }
}

// 🔥 V8.0: Exports atualizados
export { 
    executeWithRpcFallback, 
    recreatePublicProvider,
    startRpcHealthMonitoring,
    stopRpcHealthMonitoring
};