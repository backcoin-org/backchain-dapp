// modules/js/core/network-manager.js
// ✅ PRODUCTION V1.3 - Fixed: Always prioritize Alchemy, don't abandon paid RPC
// 
// CHANGES V1.3:
// - Alchemy is now ALWAYS tried first, even after errors
// - Public RPCs only used as fallback when Alchemy fails
// - MetaMask uses Alchemy URL directly when available
// - Added forceAlchemy flag to prevent switching away from paid RPC
// - Reduced unnecessary RPC switching
//
// CHANGES V1.2:
// - Added 60s cooldown between MetaMask RPC updates
// - Prevents loop when rate limited
// - Reduces spam of wallet_addEthereumChain requests
//
// CHANGES V1.1:
// - Added alternative RPC endpoints (4 total)
// - Added fallback public RPCs
// - Better rate limit detection and handling
// - Faster RPC switching on rate limit errors
//
// This module handles all network-related operations:
// - RPC health monitoring
// - Network switching
// - MetaMask RPC updates
// - Provider/Signer management
//
// ============================================================================
// ARCHITECTURE:
// - Alchemy (paid) is always preferred
// - Public RPCs used only when Alchemy unavailable
// - Automatic recovery without abandoning paid RPC
// ============================================================================

import { ErrorHandler, ErrorTypes } from './error-handler.js';
import { State } from '../../state.js';

// ============================================================================
// 1. NETWORK CONFIGURATION
// ============================================================================

/**
 * Target network configuration
 * Currently: opBNB Testnet
 */
export const NETWORK_CONFIG = {
    chainId: 421614,
    chainIdHex: '0x66eee',
    name: 'Arbitrum Sepolia',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
    },
    blockExplorer: 'https://sepolia.arbiscan.io'
};

/**
 * RPC endpoints in priority order (Arbitrum Sepolia — runtime)
 */
const RPC_ENDPOINTS = [
    {
        name: 'Alchemy',
        getUrl: () => {
            const key = import.meta.env?.VITE_ALCHEMY_API_KEY;
            return key ? `https://arb-sepolia.g.alchemy.com/v2/${key}` : null;
        },
        priority: 1,
        isPublic: false,
        isPaid: true
    },
    {
        name: 'Arbitrum Official',
        getUrl: () => 'https://sepolia-rollup.arbitrum.io/rpc',
        priority: 2,
        isPublic: true,
        isPaid: false
    },
    {
        name: 'PublicNode',
        getUrl: () => 'https://arbitrum-sepolia.publicnode.com',
        priority: 3,
        isPublic: true,
        isPaid: false
    }
];

// ============================================================================
// 2. INTERNAL STATE
// ============================================================================

let currentRpcIndex = 0;
let healthCheckInterval = null;
let lastHealthCheck = null;
let consecutiveFailures = 0;
let lastMetaMaskUpdate = 0;
let useAlchemyOnly = true; // V1.3: Flag to prefer Alchemy

const MAX_CONSECUTIVE_FAILURES = 3;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const RPC_TIMEOUT = 5000; // 5 seconds
const METAMASK_UPDATE_COOLDOWN = 60000; // 60 seconds cooldown
const ALCHEMY_RETRY_DELAY = 2000; // V1.3: Wait before retrying Alchemy

/** Helper: returns Alchemy RPC URL or null if no key configured */
function getAlchemyUrl() {
    return RPC_ENDPOINTS[0].getUrl();
}

// ============================================================================
// 3. NETWORK MANAGER
// ============================================================================

export const NetworkManager = {

    // =========================================================================
    // RPC URL MANAGEMENT
    // =========================================================================

    /**
     * V1.3: Gets the best RPC URL, always trying Alchemy first
     * @returns {string} RPC URL
     */
    getCurrentRpcUrl() {
        // V1.3: Always try Alchemy first if available
        const alchemyUrl = getAlchemyUrl();
        if (alchemyUrl && useAlchemyOnly) {
            return alchemyUrl;
        }
        
        const endpoints = this.getAvailableEndpoints();
        if (endpoints.length === 0) {
            throw new Error('No RPC endpoints available');
        }
        return endpoints[currentRpcIndex % endpoints.length].getUrl();
    },

    /**
     * V1.3: Gets the primary RPC URL (Alchemy if available)
     * @returns {string|null} Primary RPC URL
     */
    getPrimaryRpcUrl() {
        return getAlchemyUrl();
    },

    /**
     * Gets all available RPC endpoints (with valid URLs)
     * @returns {Array} Available endpoints
     */
    getAvailableEndpoints() {
        return RPC_ENDPOINTS
            .filter(rpc => rpc.getUrl() !== null)
            .sort((a, b) => a.priority - b.priority);
    },

    /**
     * V1.3: Gets array of RPC URLs for MetaMask
     * Alchemy is always first if available
     * @returns {string[]} Array of RPC URLs
     */
    getRpcUrlsForMetaMask() {
        const alchemyUrl = getAlchemyUrl();
        const publicUrls = this.getAvailableEndpoints()
            .filter(rpc => rpc.isPublic)
            .map(rpc => rpc.getUrl())
            .filter(Boolean);
        
        // V1.3: Alchemy always first
        if (alchemyUrl) {
            return [alchemyUrl, ...publicUrls];
        }
        return publicUrls;
    },

    /**
     * V1.3: Switches to fallback RPC (only when Alchemy fails)
     * @param {boolean} temporary - If true, will retry Alchemy soon
     * @returns {string} New RPC URL
     */
    switchToNextRpc(temporary = true) {
        const endpoints = this.getAvailableEndpoints();
        
        // V1.3: If we're using Alchemy and it failed, try public RPCs temporarily
        if (useAlchemyOnly && getAlchemyUrl()) {
            useAlchemyOnly = false;
            currentRpcIndex = 0;
            
            // Find first public RPC
            const publicEndpoint = endpoints.find(e => e.isPublic);
            if (publicEndpoint) {
                console.log(`[Network] Alchemy temporarily unavailable, using: ${publicEndpoint.name}`);
                
                // V1.3: Schedule retry of Alchemy
                if (temporary) {
                    setTimeout(() => {
                        console.log('[Network] Retrying Alchemy...');
                        useAlchemyOnly = true;
                        currentRpcIndex = 0;
                    }, ALCHEMY_RETRY_DELAY);
                }
                
                return publicEndpoint.getUrl();
            }
        }
        
        // Cycle through public RPCs
        const publicEndpoints = endpoints.filter(e => e.isPublic);
        if (publicEndpoints.length <= 1) {
            console.warn('[Network] No alternative RPCs available');
            return this.getCurrentRpcUrl();
        }

        currentRpcIndex = (currentRpcIndex + 1) % publicEndpoints.length;
        const newRpc = publicEndpoints[currentRpcIndex];
        
        console.log(`[Network] Switched to RPC: ${newRpc.name}`);
        return newRpc.getUrl();
    },

    /**
     * V1.3: Force reset to Alchemy
     */
    resetToAlchemy() {
        if (getAlchemyUrl()) {
            useAlchemyOnly = true;
            currentRpcIndex = 0;
            console.log('[Network] Reset to Alchemy RPC');
        }
    },

    /**
     * V1.1: Checks if error is a rate limit error
     * @param {Error} error - Error to check
     * @returns {boolean} True if rate limited
     */
    isRateLimitError(error) {
        const message = error?.message?.toLowerCase() || '';
        const code = error?.code;
        
        return (
            code === -32002 ||
            code === -32005 ||
            message.includes('rate limit') ||
            message.includes('too many') ||
            message.includes('exceeded') ||
            message.includes('throttled') ||
            message.includes('429')
        );
    },

    /**
     * V1.3: Handle rate limit - smart handling for Alchemy vs public RPCs
     * @param {Error} error - The rate limit error
     * @returns {Promise<string>} New RPC URL
     */
    async handleRateLimit(error) {
        // V1.3: Check if the rate limit is from Alchemy or public RPC
        const currentUrl = this.getCurrentRpcUrl();
        const alchemyUrl = getAlchemyUrl();
        const isAlchemyError = alchemyUrl && currentUrl === alchemyUrl;
        
        if (isAlchemyError) {
            // Alchemy rate limited (unusual for paid plans)
            console.warn('[Network] Alchemy rate limited (check your plan limits)');
            // Wait a bit and retry Alchemy instead of switching
            await new Promise(r => setTimeout(r, 1000));
            return alchemyUrl;
        }
        
        // Public RPC rate limited - this is expected, switch RPCs
        console.warn('[Network] Public RPC rate limited, switching...');
        const newRpc = this.switchToNextRpc();
        
        // Don't spam MetaMask updates for public RPC issues
        const now = Date.now();
        if (now - lastMetaMaskUpdate > METAMASK_UPDATE_COOLDOWN) {
            try {
                await this.updateMetaMaskRpcs();
                lastMetaMaskUpdate = now;
            } catch (e) {
                console.warn('[Network] Could not update MetaMask:', e.message);
            }
        }
        
        return newRpc;
    },

    /**
     * V1.3: Gets a working provider, always trying Alchemy first
     * @returns {Promise<ethers.JsonRpcProvider>} Working provider
     */
    async getWorkingProvider() {
        const ethers = window.ethers;
        
        // V1.3: Always try Alchemy first if available
        const alchemyUrl = getAlchemyUrl();
        if (alchemyUrl) {
            try {
                const provider = new ethers.JsonRpcProvider(alchemyUrl);
                await Promise.race([
                    provider.getBlockNumber(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('timeout')), 3000)
                    )
                ]);
                
                // Alchemy works, ensure we're using it
                useAlchemyOnly = true;
                return provider;
            } catch (error) {
                console.warn('[Network] Alchemy temporarily unavailable:', error.message);
            }
        }
        
        // V1.3: Fallback to public RPCs
        const publicEndpoints = this.getAvailableEndpoints().filter(e => e.isPublic);
        
        for (const endpoint of publicEndpoints) {
            try {
                const rpcUrl = endpoint.getUrl();
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                
                await Promise.race([
                    provider.getBlockNumber(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('timeout')), 3000)
                    )
                ]);
                
                console.log(`[Network] Using fallback RPC: ${endpoint.name}`);
                return provider;
            } catch (error) {
                console.warn(`[Network] RPC ${endpoint.name} failed, trying next...`);
            }
        }
        
        // All failed, return Alchemy anyway (might recover)
        if (alchemyUrl) {
            return new ethers.JsonRpcProvider(alchemyUrl);
        }
        
        throw new Error('No working RPC endpoints available');
    },

    // =========================================================================
    // NETWORK VERIFICATION
    // =========================================================================

    /**
     * Checks if user is on the correct network
     * @returns {Promise<boolean>} true if on correct network
     */
    async isCorrectNetwork() {
        // Try window.ethereum first (extension wallets like MetaMask)
        if (window.ethereum) {
            try {
                const chainIdHex = await window.ethereum.request({
                    method: 'eth_chainId'
                });
                const chainId = parseInt(chainIdHex, 16);
                return chainId === NETWORK_CONFIG.chainId;
            } catch (error) {
                // Fall through to State.provider fallback
            }
        }

        // Fallback for embedded/social wallets: check via State.provider
        if (State.provider) {
            try {
                const network = await State.provider.getNetwork();
                return Number(network.chainId) === NETWORK_CONFIG.chainId;
            } catch (e) { /* fall through */ }
        }

        return false;
    },

    /**
     * Gets the current chain ID
     * @returns {Promise<number|null>} Chain ID or null
     */
    async getCurrentChainId() {
        // Try window.ethereum first (extension wallets)
        if (window.ethereum) {
            try {
                const chainIdHex = await window.ethereum.request({
                    method: 'eth_chainId'
                });
                return parseInt(chainIdHex, 16);
            } catch { /* fall through */ }
        }

        // Fallback for embedded/social wallets
        if (State.provider) {
            try {
                const network = await State.provider.getNetwork();
                return Number(network.chainId);
            } catch { /* fall through */ }
        }

        return null;
    },

    // =========================================================================
    // RPC HEALTH CHECK
    // =========================================================================

    /**
     * Checks health of current RPC
     * @returns {Promise<Object>} Health status { healthy, latency, error }
     */
    async checkRpcHealth() {
        const startTime = Date.now();
        const rpcUrl = this.getCurrentRpcUrl();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT);

            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 1
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'RPC error');
            }

            const latency = Date.now() - startTime;
            consecutiveFailures = 0;

            lastHealthCheck = {
                healthy: true,
                latency,
                blockNumber: parseInt(data.result, 16),
                timestamp: Date.now()
            };

            return lastHealthCheck;

        } catch (error) {
            consecutiveFailures++;
            
            const result = {
                healthy: false,
                latency: Date.now() - startTime,
                error: error.message,
                timestamp: Date.now()
            };

            lastHealthCheck = result;

            // Auto-switch RPC after consecutive failures
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                console.warn('[Network] Too many RPC failures, switching...');
                this.switchToNextRpc();
                consecutiveFailures = 0;
            }

            return result;
        }
    },

    /**
     * Gets last health check result (cached)
     * @returns {Object|null} Last health check or null
     */
    getLastHealthCheck() {
        return lastHealthCheck;
    },

    /**
     * Checks if RPC is healthy (uses cache if recent)
     * @param {number} maxAge - Max age of cached result in ms (default 10s)
     * @returns {Promise<boolean>} true if healthy
     */
    async isRpcHealthy(maxAge = 10000) {
        // Use cached result if recent
        if (lastHealthCheck && Date.now() - lastHealthCheck.timestamp < maxAge) {
            return lastHealthCheck.healthy;
        }

        const health = await this.checkRpcHealth();
        return health.healthy;
    },

    // =========================================================================
    // NETWORK SWITCHING
    // =========================================================================

    /**
     * Switches MetaMask to the correct network
     * @returns {Promise<boolean>} true if switched successfully
     */
    async switchNetwork() {
        if (!window.ethereum) {
            throw ErrorHandler.create(ErrorTypes.WALLET_NOT_CONNECTED);
        }

        try {
            // Try to switch to existing network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: NETWORK_CONFIG.chainIdHex }]
            });
            
            console.log('[Network] Switched to', NETWORK_CONFIG.name);
            return true;

        } catch (switchError) {
            // Network doesn't exist - add it
            if (switchError.code === 4902) {
                return await this.addNetwork();
            }
            
            // User rejected
            if (switchError.code === 4001) {
                throw ErrorHandler.create(ErrorTypes.USER_REJECTED);
            }

            throw switchError;
        }
    },

    /**
     * Adds the network to MetaMask
     * @returns {Promise<boolean>} true if added successfully
     */
    async addNetwork() {
        if (!window.ethereum) {
            throw ErrorHandler.create(ErrorTypes.WALLET_NOT_CONNECTED);
        }

        const rpcUrls = this.getRpcUrlsForMetaMask();

        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: NETWORK_CONFIG.chainIdHex,
                    chainName: NETWORK_CONFIG.name,
                    nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                    rpcUrls: rpcUrls,
                    blockExplorerUrls: [NETWORK_CONFIG.blockExplorer]
                }]
            });

            console.log('[Network] Added network:', NETWORK_CONFIG.name);
            return true;

        } catch (error) {
            if (error.code === 4001) {
                throw ErrorHandler.create(ErrorTypes.USER_REJECTED);
            }
            throw error;
        }
    },

    /**
     * Updates MetaMask RPC URLs (useful when current RPC is slow)
     * This re-adds the network with updated RPC list
     * @returns {Promise<boolean>} true if updated
     */
    async updateMetaMaskRpcs() {
        if (!window.ethereum) return false;

        // V1.2: Cooldown to prevent spam updates
        const now = Date.now();
        if (now - lastMetaMaskUpdate < METAMASK_UPDATE_COOLDOWN) {
            console.log('[Network] MetaMask update on cooldown, skipping...');
            return false;
        }

        // Check if on correct network first
        const isCorrect = await this.isCorrectNetwork();
        if (!isCorrect) {
            console.log('[Network] Not on correct network, skipping RPC update');
            return false;
        }

        const rpcUrls = this.getRpcUrlsForMetaMask();

        try {
            // Re-add network updates the RPC list
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: NETWORK_CONFIG.chainIdHex,
                    chainName: NETWORK_CONFIG.name,
                    nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                    rpcUrls: rpcUrls,
                    blockExplorerUrls: [NETWORK_CONFIG.blockExplorer]
                }]
            });

            lastMetaMaskUpdate = now;
            console.log('[Network] MetaMask RPCs updated with:', rpcUrls[0]);
            return true;

        } catch (error) {
            console.warn('[Network] Could not update MetaMask RPCs:', error.message);
            return false;
        }
    },

    /**
     * V1.3: Force reset MetaMask network to use Alchemy
     * This prompts user to switch networks, which resets RPC
     * @returns {Promise<boolean>} true if successful
     */
    async forceResetMetaMaskRpc() {
        if (!window.ethereum) return false;
        
        const alchemyUrl = getAlchemyUrl();
        if (!alchemyUrl) {
            console.warn('[Network] Alchemy not configured');
            return false;
        }

        try {
            // First, try to switch to mainnet (or any other network)
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x1' }] // Ethereum Mainnet
                });
            } catch (e) {
                // Ignore - user might reject or network not exist
            }

            // Now add our network with fresh RPC
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: NETWORK_CONFIG.chainIdHex,
                    chainName: NETWORK_CONFIG.name + ' (Alchemy)', // Slightly different name
                    nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                    rpcUrls: [alchemyUrl], // ONLY Alchemy
                    blockExplorerUrls: [NETWORK_CONFIG.blockExplorer]
                }]
            });

            console.log('[Network] MetaMask reset to Alchemy RPC');
            return true;

        } catch (error) {
            console.error('[Network] Failed to reset MetaMask:', error.message);
            return false;
        }
    },

    // =========================================================================
    // PROVIDER & SIGNER
    // =========================================================================

    /**
     * Gets ethers provider for read operations
     * @returns {ethers.JsonRpcProvider} Provider instance
     */
    getProvider() {
        const ethers = window.ethers;
        if (!ethers) {
            throw new Error('ethers.js not loaded');
        }

        return new ethers.JsonRpcProvider(this.getCurrentRpcUrl());
    },

    /**
     * Gets ethers BrowserProvider (for MetaMask)
     * @returns {ethers.BrowserProvider} Browser provider
     */
    getBrowserProvider() {
        const ethers = window.ethers;
        if (!ethers) {
            throw new Error('ethers.js not loaded');
        }

        if (!window.ethereum) {
            throw ErrorHandler.create(ErrorTypes.WALLET_NOT_CONNECTED);
        }

        return new ethers.BrowserProvider(window.ethereum);
    },

    /**
     * Gets signer for write operations
     * @returns {Promise<ethers.Signer>} Signer instance
     */
    async getSigner() {
        const ethers = window.ethers;
        const provider = this.getBrowserProvider();
        
        try {
            // Get signer - ethers v6 may try ENS resolution which fails on testnets
            const signer = await provider.getSigner();
            return signer;
        } catch (error) {
            // Handle ENS not supported error (common on testnets like opBNB Testnet)
            if (error.message?.includes('ENS') || error.code === 'UNSUPPORTED_OPERATION') {
                // Fallback: get address directly and create signer without ENS
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts && accounts.length > 0) {
                        return await provider.getSigner(accounts[0]);
                    }
                } catch (fallbackError) {
                    console.warn('Signer fallback failed:', fallbackError);
                }
            }
            
            // Not connected
            if (error.code === 4001 || error.message?.includes('user rejected')) {
                throw ErrorHandler.create(ErrorTypes.USER_REJECTED);
            }
            throw ErrorHandler.create(ErrorTypes.WALLET_NOT_CONNECTED);
        }
    },

    /**
     * Gets connected wallet address
     * @returns {Promise<string|null>} Address or null
     */
    async getConnectedAddress() {
        // Try window.ethereum first (extension wallets)
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });
                if (accounts[0]) return accounts[0];
            } catch { /* fall through */ }
        }

        // Fallback for embedded/social wallets
        if (State.userAddress) return State.userAddress;

        return null;
    },

    /**
     * Requests wallet connection
     * @returns {Promise<string>} Connected address
     */
    async requestConnection() {
        if (!window.ethereum) {
            throw ErrorHandler.create(ErrorTypes.WALLET_NOT_CONNECTED);
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (!accounts || accounts.length === 0) {
                throw ErrorHandler.create(ErrorTypes.WALLET_NOT_CONNECTED);
            }

            return accounts[0];
        } catch (error) {
            if (error.code === 4001) {
                throw ErrorHandler.create(ErrorTypes.USER_REJECTED);
            }
            throw error;
        }
    },

    // =========================================================================
    // HEALTH MONITORING
    // =========================================================================

    /**
     * Starts periodic health monitoring
     * @param {number} interval - Check interval in ms (default 30s)
     */
    startHealthMonitoring(interval = HEALTH_CHECK_INTERVAL) {
        if (healthCheckInterval) {
            this.stopHealthMonitoring();
        }

        // Initial check
        this.checkRpcHealth();

        // Periodic checks
        healthCheckInterval = setInterval(() => {
            this.checkRpcHealth();
        }, interval);

        console.log('[Network] Health monitoring started');
    },

    /**
     * Stops health monitoring
     */
    stopHealthMonitoring() {
        if (healthCheckInterval) {
            clearInterval(healthCheckInterval);
            healthCheckInterval = null;
            console.log('[Network] Health monitoring stopped');
        }
    },

    /**
     * Checks if health monitoring is active
     * @returns {boolean}
     */
    isMonitoring() {
        return healthCheckInterval !== null;
    },

    // =========================================================================
    // UTILITIES
    // =========================================================================

    /**
     * Formats address for display (0x1234...5678)
     * @param {string} address - Full address
     * @param {number} chars - Chars to show on each side (default 4)
     * @returns {string} Formatted address
     */
    formatAddress(address, chars = 4) {
        if (!address) return '';
        return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
    },

    /**
     * Gets block explorer URL for address
     * @param {string} address - Address to link
     * @returns {string} Explorer URL
     */
    getAddressExplorerUrl(address) {
        return `${NETWORK_CONFIG.blockExplorer}/address/${address}`;
    },

    /**
     * Gets block explorer URL for transaction
     * @param {string} txHash - Transaction hash
     * @returns {string} Explorer URL
     */
    getTxExplorerUrl(txHash) {
        return `${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
    },

    /**
     * Checks if MetaMask is installed
     * @returns {boolean}
     */
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    },

    /**
     * Gets network status summary
     * @returns {Promise<Object>} Status object
     */
    async getStatus() {
        const [isCorrect, address, health] = await Promise.all([
            this.isCorrectNetwork(),
            this.getConnectedAddress(),
            this.checkRpcHealth()
        ]);

        return {
            isConnected: !!address,
            address,
            isCorrectNetwork: isCorrect,
            currentChainId: await this.getCurrentChainId(),
            targetChainId: NETWORK_CONFIG.chainId,
            rpcHealthy: health.healthy,
            rpcLatency: health.latency,
            currentRpc: this.getAvailableEndpoints()[currentRpcIndex]?.name || 'Unknown'
        };
    }
};

// ============================================================================
// 4. EVENT LISTENERS SETUP
// ============================================================================

/**
 * Sets up MetaMask event listeners
 * Call this once on app initialization
 * @param {Object} callbacks - Event callbacks
 */
export function setupNetworkListeners(callbacks = {}) {
    if (!window.ethereum) return;

    const {
        onAccountsChanged,
        onChainChanged,
        onConnect,
        onDisconnect
    } = callbacks;

    if (onAccountsChanged) {
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('[Network] Accounts changed:', accounts);
            onAccountsChanged(accounts);
        });
    }

    if (onChainChanged) {
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('[Network] Chain changed:', chainId);
            onChainChanged(parseInt(chainId, 16));
        });
    }

    if (onConnect) {
        window.ethereum.on('connect', (info) => {
            console.log('[Network] Connected:', info);
            onConnect(info);
        });
    }

    if (onDisconnect) {
        window.ethereum.on('disconnect', (error) => {
            console.log('[Network] Disconnected:', error);
            onDisconnect(error);
        });
    }

    console.log('[Network] Event listeners configured');
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export default NetworkManager;