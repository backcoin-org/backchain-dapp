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
    ecosystemManagerABI,
    stakingPoolABI,
    buybackMinerABI,
    rewardBoosterABI,
    fortunePoolABI,
    agoraABI,
    notaryABI,
    charityPoolABI,
    rentalManagerABI,
    faucetABI,
    nftPoolABI,
    // Network Management imports
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
const POLLING_INTERVAL_MS = 60000;         // 60s entre checks (otimizado: 30s→60s para reduzir RPC Alchemy)

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
    },
    // Force Arbitrum Sepolia as default chain for new connections
    defaultChain: arbitrumSepoliaConfig,
    // Force EOA only — no smart accounts for social/email login
    defaultAccountTypes: { eip155: 'eoa' },
    preferredAccountType: 'eoa'
});

// Force EOA account type (belt-and-suspenders)
try { web3modal.setPreferredAccountType?.('eoa'); } catch(e) {}

// ============================================================================
// 3. 🔥 MULTI-RPC SYSTEM (NOVO!)
// ============================================================================

/**
 * Verifica se um erro é relacionado a RPC
 */
/**
 * Detect if a provider is a native browser extension wallet (MetaMask, Rabby, etc.)
 * vs an embedded/social wallet (Reown email, Google login).
 * Embedded wallets don't support wallet_* RPC methods.
 */
function isExtensionWallet(provider) {
    if (!provider) return false;
    return !!(provider.isMetaMask || provider.isCoinbaseWallet || provider.isBraveWallet || provider.isRabby || provider.isTrust);
}

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
        const p = State.publicProvider;
        if (isValidAddress(addresses.bkcToken)) State.bkcTokenContractPublic = new ethers.Contract(addresses.bkcToken, bkcTokenABI, p);
        if (isValidAddress(addresses.backchainEcosystem)) State.ecosystemManagerContractPublic = new ethers.Contract(addresses.backchainEcosystem, ecosystemManagerABI, p);
        if (isValidAddress(addresses.stakingPool)) State.stakingPoolContractPublic = new ethers.Contract(addresses.stakingPool, stakingPoolABI, p);
        if (isValidAddress(addresses.buybackMiner)) State.buybackMinerContractPublic = new ethers.Contract(addresses.buybackMiner, buybackMinerABI, p);
        if (isValidAddress(addresses.fortunePool)) State.fortunePoolContractPublic = new ethers.Contract(addresses.fortunePool, fortunePoolABI, p);
        if (isValidAddress(addresses.agora)) State.agoraContractPublic = new ethers.Contract(addresses.agora, agoraABI, p);
        if (isValidAddress(addresses.notary)) State.notaryContractPublic = new ethers.Contract(addresses.notary, notaryABI, p);
        if (isValidAddress(addresses.charityPool)) State.charityPoolContractPublic = new ethers.Contract(addresses.charityPool, charityPoolABI, p);
        if (isValidAddress(addresses.rentalManager)) State.rentalManagerContractPublic = new ethers.Contract(addresses.rentalManager, rentalManagerABI, p);
        if (isValidAddress(addresses.faucet)) State.faucetContractPublic = new ethers.Contract(addresses.faucet, faucetABI, p);
        
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
        const s = signerOrProvider;
        if (isValidAddress(addresses.bkcToken)) State.bkcTokenContract = new ethers.Contract(addresses.bkcToken, bkcTokenABI, s);
        if (isValidAddress(addresses.backchainEcosystem)) State.ecosystemManagerContract = new ethers.Contract(addresses.backchainEcosystem, ecosystemManagerABI, s);
        if (isValidAddress(addresses.stakingPool)) State.stakingPoolContract = new ethers.Contract(addresses.stakingPool, stakingPoolABI, s);
        if (isValidAddress(addresses.buybackMiner)) State.buybackMinerContract = new ethers.Contract(addresses.buybackMiner, buybackMinerABI, s);
        if (isValidAddress(addresses.rewardBooster)) State.rewardBoosterContract = new ethers.Contract(addresses.rewardBooster, rewardBoosterABI, s);
        if (isValidAddress(addresses.fortunePool)) State.fortunePoolContract = new ethers.Contract(addresses.fortunePool, fortunePoolABI, s);
        if (isValidAddress(addresses.agora)) State.agoraContract = new ethers.Contract(addresses.agora, agoraABI, s);
        if (isValidAddress(addresses.notary)) State.notaryContract = new ethers.Contract(addresses.notary, notaryABI, s);
        if (isValidAddress(addresses.charityPool)) State.charityPoolContract = new ethers.Contract(addresses.charityPool, charityPoolABI, s);
        if (isValidAddress(addresses.rentalManager)) State.rentalManagerContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, s);
        if (isValidAddress(addresses.faucet)) State.faucetContract = new ethers.Contract(addresses.faucet, faucetABI, s);
    } catch (e) { console.warn("Contract init partial failure"); }
}

// Balance polling — aggressive initially (5s × 5), then slows to 60s
let _fastPollCount = 0;
const FAST_POLL_INTERVAL = 5000;   // 5s for first polls
const FAST_POLL_MAX = 5;           // 5 fast polls after connect

function startBalancePolling() {
    if (balancePollingInterval) {
        clearInterval(balancePollingInterval);
        balancePollingInterval = null;
    }

    if (!State.bkcTokenContractPublic || !State.userAddress) {
        console.warn("Cannot start balance polling: missing contract or address");
        return;
    }

    balanceErrorCount = 0;
    rpcRetryCount = 0;
    _fastPollCount = 0;

    // Fast polling phase: 5s intervals for first 5 checks (catches post-claim balance quickly)
    balancePollingInterval = setInterval(() => {
        checkBalance();
        _fastPollCount++;
        if (_fastPollCount >= FAST_POLL_MAX) {
            // Switch to slow polling
            clearInterval(balancePollingInterval);
            balancePollingInterval = setInterval(checkBalance, POLLING_INTERVAL_MS);
            console.log('✅ Balance polling: switched to 60s interval');
        }
    }, FAST_POLL_INTERVAL);

    console.log("✅ Balance polling started (5s fast → 60s normal)");
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
            console.log('[Poll] Balance changed:', ethers.formatEther(currentBalance), '→', ethers.formatEther(newBalance), 'BKC');
            State.currentUserBalance = newBalance;
            localStorage.setItem(`balance_${State.userAddress.toLowerCase()}`, newBalance.toString());

            // Update UI immediately on balance change (no throttle for actual changes)
            if (window.updateUIState) window.updateUIState(false);
        }

        // Also read ETH balance during fast poll phase
        if (_fastPollCount < FAST_POLL_MAX && State.publicProvider) {
            try {
                const ethBal = await State.publicProvider.getBalance(State.userAddress);
                if (ethBal !== State.currentUserNativeBalance) {
                    State.currentUserNativeBalance = ethBal;
                }
            } catch (_) { /* ignore */ }
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
    // Skip for embedded/social wallets — chain is pre-configured via Web3Modal
    const rawProvider = provider?.provider || State.web3Provider;
    if (!isExtensionWallet(rawProvider)) return true;

    try {
        const network = await provider.getNetwork();
        if (Number(network.chainId) === ARBITRUM_SEPOLIA_ID_DECIMAL) return true;

        try {
            await provider.send("wallet_switchEthereumChain", [{ chainId: ARBITRUM_SEPOLIA_ID_HEX }]);
            return true;
        } catch (switchError) { return true; }
    } catch (e) { return true; }
}

let _setupInProgress = false;
let _pendingSetupAddress = null; // Queue re-setup if blocked by _setupInProgress

async function setupSignerAndLoadData(provider, address) {
    if (_setupInProgress) {
        // Queue this address for data reload after current setup finishes
        _pendingSetupAddress = address;
        console.log('[Wallet] Setup in progress, queued reload for', address?.slice(0, 10));
        return true;
    }
    _setupInProgress = true;
    try {
        if (!validateEthereumAddress(address)) { _setupInProgress = false; return false; }

        const rawProvider = provider?.provider || State.web3Provider;
        const isEmbedded = !isExtensionWallet(rawProvider);

        // Network: extension wallets use RPC, embedded wallets use Web3Modal API
        if (isEmbedded) {
            try {
                const chainId = web3modal.getChainId();
                if (chainId !== ARBITRUM_SEPOLIA_ID_DECIMAL) {
                    console.log(`[Wallet] Embedded wallet on chain ${chainId}, switching...`);
                    await web3modal.switchNetwork(ARBITRUM_SEPOLIA_ID_DECIMAL);
                    try { web3modal.close(); } catch(_) {}
                }
            } catch (e) {
                console.warn('[Wallet] Network switch error:', e.message);
            }

            // Get fresh wallet provider after any potential network switch
            if (address) {
                const rawWP = web3modal.getWalletProvider() || State.web3Provider;
                if (rawWP) {
                    if (rawWP.request && !rawWP._bkcPatched) {
                        const origRequest = rawWP.request.bind(rawWP);
                        rawWP.request = async function(args) {
                            if (args?.method === 'eth_requestAccounts') return [address];
                            return origRequest(args);
                        };
                        rawWP._bkcPatched = true;
                    }
                    provider = new ethers.BrowserProvider(rawWP);
                }
            }
        } else {
            await ensureNetwork(provider);
        }

        State.provider = provider;

        try {
            if (isEmbedded && address) {
                State.signer = new ethers.JsonRpcSigner(provider, address);
                console.log('[Wallet] Embedded signer created for', address.slice(0, 10) + '...');
            } else {
                State.signer = await provider.getSigner(address);
            }
        } catch(signerError) {
            State.signer = provider;
            console.warn('Could not get Signer. Read-only mode.', signerError.message);
        }

        State.userAddress = address;
        State.isConnected = true;

        // Cache + Contratos
        loadCachedBalance(address);
        instantiateContracts(State.signer);

        // Login Firebase
        try { signIn(State.userAddress); } catch (e) { }

        // Load balance data — ALWAYS force refresh on initial setup to bypass stale cache
        await loadAndDisplayBalance(address, true);

        startBalancePolling();

        return true;

    } catch (error) {
        console.error("Setup warning:", error);
        if (address) return true;
        return false;
    } finally {
        _setupInProgress = false;
        // Process queued re-setup (from subscribeProvider events during switchNetwork)
        if (_pendingSetupAddress) {
            const pendingAddr = _pendingSetupAddress;
            _pendingSetupAddress = null;
            // Just reload data, no need to re-create signer
            loadAndDisplayBalance(pendingAddr, true);
        }
    }
}

/**
 * Load balance from Alchemy (public provider) and update UI.
 * Falls back to direct contract call if loadUserData fails.
 */
async function loadAndDisplayBalance(address, forceRefresh = false) {
    try {
        await loadUserData(forceRefresh);
        if (window.updateUIState) window.updateUIState(false);
    } catch (e) {
        console.warn('[Wallet] loadUserData failed:', e.message);
    }

    // Safety net: if balance is still 0/undefined, try direct Alchemy read
    if (!State.currentUserBalance && State.bkcTokenContractPublic && address) {
        try {
            const bal = await State.bkcTokenContractPublic.balanceOf(address);
            if (bal > 0n) {
                State.currentUserBalance = bal;
                console.log('[Wallet] Direct balance read:', ethers.formatEther(bal), 'BKC');
                if (window.updateUIState) window.updateUIState(false);
            }
        } catch (e) { /* Alchemy read failed, polling will catch it later */ }
    }
}

// ============================================================================
// 6. EXPORTS
// ============================================================================

// 🔥 V8.0: initPublicProvider com Auto Network Management
export async function initPublicProvider() {
    try {
        // 🔥 V8.0: Verifica e corrige configuração de rede no MetaMask automaticamente
        // Only for extension wallets (MetaMask etc.) — embedded/social wallets don't support wallet_* methods
        if (window.ethereum && isExtensionWallet(window.ethereum)) {
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

        const p = State.publicProvider;
        if (isValidAddress(addresses.bkcToken)) State.bkcTokenContractPublic = new ethers.Contract(addresses.bkcToken, bkcTokenABI, p);
        if (isValidAddress(addresses.backchainEcosystem)) State.ecosystemManagerContractPublic = new ethers.Contract(addresses.backchainEcosystem, ecosystemManagerABI, p);
        if (isValidAddress(addresses.stakingPool)) State.stakingPoolContractPublic = new ethers.Contract(addresses.stakingPool, stakingPoolABI, p);
        if (isValidAddress(addresses.buybackMiner)) State.buybackMinerContractPublic = new ethers.Contract(addresses.buybackMiner, buybackMinerABI, p);
        if (isValidAddress(addresses.fortunePool)) State.fortunePoolContractPublic = new ethers.Contract(addresses.fortunePool, fortunePoolABI, p);
        if (isValidAddress(addresses.agora)) State.agoraContractPublic = new ethers.Contract(addresses.agora, agoraABI, p);
        if (isValidAddress(addresses.notary)) State.notaryContractPublic = new ethers.Contract(addresses.notary, notaryABI, p);
        if (isValidAddress(addresses.charityPool)) State.charityPoolContractPublic = new ethers.Contract(addresses.charityPool, charityPoolABI, p);
        if (isValidAddress(addresses.rentalManager)) State.rentalManagerContractPublic = new ethers.Contract(addresses.rentalManager, rentalManagerABI, p);
        if (isValidAddress(addresses.faucet)) State.faucetContractPublic = new ethers.Contract(addresses.faucet, faucetABI, p);
        
        // 🔥 V8.0: Carrega dados com fallback
        try {
            await executeWithRpcFallback(async () => {
                await loadPublicData();
            });
        } catch (e) {
            console.warn("Initial public data load failed, will retry on user interaction");
        }
        
        // 🔥 V8.0: Configura listener para mudanças de rede (extension wallets only)
        if (window.ethereum && isExtensionWallet(window.ethereum)) {
            setupNetworkChangeListener(async (info) => {
                if (!info.isCorrectNetwork) {
                    console.log('⚠️ User switched to wrong network');
                    showToast("Please switch back to Arbitrum Sepolia", "warning");
                } else {
                    const health = await checkRpcHealth();
                    if (!health.healthy) {
                        console.log('⚠️ RPC issues after network change, updating...');
                        await updateMetaMaskNetwork();
                        await recreatePublicProvider();
                    }
                }
            });
        }
        
        // 🔥 V8.0: Inicia monitoramento periódico de saúde do RPC
        startRpcHealthMonitoring();
        
        if (window.updateUIState) window.updateUIState();
        
        console.log("✅ Public provider initialized");
        
    } catch (e) { 
        console.error("Public provider error:", e);
        
        // 🔥 V8.0: Tenta corrigir MetaMask e usar próximo RPC
        if (window.ethereum && isExtensionWallet(window.ethereum)) {
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
            console.log(`[Wallet] subscribeProvider event: connected=${isConnected}, chain=${chainId}, addr=${address?.slice(0,10) || 'null'}, hasProvider=${!!provider}`);
            if (isConnected) {
                let activeAddress = address || web3modal.getAddress();
                if (!activeAddress && provider) {
                    try {
                        const tempProvider = new ethers.BrowserProvider(provider);
                        const accounts = await tempProvider.send('eth_accounts', []);
                        activeAddress = accounts?.[0] || null;
                    } catch(e) {
                        try {
                            const tempProvider = new ethers.BrowserProvider(provider);
                            const signer = await tempProvider.getSigner();
                            activeAddress = await signer.getAddress();
                        } catch(e2) {}
                    }
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
    
    // Otimização: removido setInterval de 60s que consumia ~60 RPC calls/hr
    // Health check agora é APENAS reativo:
    // 1. Em erros via executeWithRpcFallback()
    // 2. Quando tab fica visível (com cooldown de 5min)
    let lastMetaMaskUpdateAttempt = 0;

    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden && State.isConnected) {
            const now = Date.now();
            if (now - lastMetaMaskUpdateAttempt < 300000) return;
            const health = await checkRpcHealth();
            if (!health.healthy) {
                lastMetaMaskUpdateAttempt = now;
                console.log('⚠️ RPC unhealthy on tab focus, fixing...');
                if (window.ethereum && isExtensionWallet(window.ethereum)) {
                    await updateMetaMaskNetwork();
                }
                await recreatePublicProvider();
                balanceErrorCount = 0;
                rpcRetryCount = 0;
            }
        }
    });

    console.log('✅ RPC health monitoring started (event-driven, no polling)');
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