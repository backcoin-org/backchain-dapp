// modules/js/core/network-manager.js
// ✅ PRODUCTION V1.0 - Network & RPC Manager for Backchain dApp
// 
// This module handles all network-related operations:
// - RPC health monitoring
// - Network switching
// - MetaMask RPC updates
// - Provider/Signer management
//
// ============================================================================
// ARCHITECTURE:
// - Uses multiple RPC endpoints for redundancy
// - Automatically detects and recovers from RPC issues
// - Updates MetaMask when RPCs are slow/broken
// ============================================================================

import { ErrorHandler, ErrorTypes } from './error-handler.js';

// ============================================================================
// 1. NETWORK CONFIGURATION
// ============================================================================

/**
 * Target network configuration
 * Currently: Arbitrum Sepolia (Testnet)
 */
export const NETWORK_CONFIG = {
    chainId: 421614,
    chainIdHex: '0x66eee',
    name: 'Arbitrum Sepolia',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    blockExplorer: 'https://sepolia.arbiscan.io'
};

/**
 * RPC endpoints in priority order
 * First working RPC will be used
 */
const RPC_ENDPOINTS = [
    {
        name: 'Alchemy',
        getUrl: () => {
            const key = import.meta.env?.VITE_ALCHEMY_API_KEY;
            return key ? `https://arb-sepolia.g.alchemy.com/v2/${key}` : null;
        },
        priority: 1,
        isPublic: false
    },
    {
        name: 'BlockPI',
        getUrl: () => 'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
        priority: 2,
        isPublic: true
    },
    {
        name: 'PublicNode',
        getUrl: () => 'https://arbitrum-sepolia-rpc.publicnode.com',
        priority: 3,
        isPublic: true
    },
    {
        name: 'Arbitrum Official',
        getUrl: () => 'https://sepolia-rollup.arbitrum.io/rpc',
        priority: 4,
        isPublic: true
    }
];

// ============================================================================
// 2. INTERNAL STATE
// ============================================================================

let currentRpcIndex = 0;
let healthCheckInterval = null;
let lastHealthCheck = null;
let consecutiveFailures = 0;

const MAX_CONSECUTIVE_FAILURES = 3;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const RPC_TIMEOUT = 5000; // 5 seconds

// ============================================================================
// 3. NETWORK MANAGER
// ============================================================================

export const NetworkManager = {

    // =========================================================================
    // RPC URL MANAGEMENT
    // =========================================================================

    /**
     * Gets the current best RPC URL
     * @returns {string} RPC URL
     */
    getCurrentRpcUrl() {
        const endpoints = this.getAvailableEndpoints();
        if (endpoints.length === 0) {
            throw new Error('No RPC endpoints available');
        }
        return endpoints[currentRpcIndex % endpoints.length].getUrl();
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
     * Gets array of RPC URLs for MetaMask
     * @returns {string[]} Array of RPC URLs
     */
    getRpcUrlsForMetaMask() {
        return this.getAvailableEndpoints()
            .map(rpc => rpc.getUrl())
            .filter(Boolean);
    },

    /**
     * Switches to next available RPC
     * @returns {string} New RPC URL
     */
    switchToNextRpc() {
        const endpoints = this.getAvailableEndpoints();
        if (endpoints.length <= 1) {
            console.warn('[Network] No alternative RPCs available');
            return this.getCurrentRpcUrl();
        }

        currentRpcIndex = (currentRpcIndex + 1) % endpoints.length;
        const newRpc = endpoints[currentRpcIndex];
        
        console.log(`[Network] Switched to RPC: ${newRpc.name}`);
        return newRpc.getUrl();
    },

    // =========================================================================
    // NETWORK VERIFICATION
    // =========================================================================

    /**
     * Checks if user is on the correct network
     * @returns {Promise<boolean>} true if on correct network
     */
    async isCorrectNetwork() {
        if (!window.ethereum) {
            return false;
        }

        try {
            const chainIdHex = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
            const chainId = parseInt(chainIdHex, 16);
            return chainId === NETWORK_CONFIG.chainId;
        } catch (error) {
            console.error('[Network] Error checking network:', error);
            return false;
        }
    },

    /**
     * Gets the current chain ID
     * @returns {Promise<number|null>} Chain ID or null
     */
    async getCurrentChainId() {
        if (!window.ethereum) return null;

        try {
            const chainIdHex = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
            return parseInt(chainIdHex, 16);
        } catch {
            return null;
        }
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

            console.log('[Network] Updated MetaMask RPCs');
            return true;

        } catch (error) {
            // Silently fail - this is an optimization, not critical
            console.warn('[Network] Could not update MetaMask RPCs:', error.message);
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
        const provider = this.getBrowserProvider();
        
        try {
            const signer = await provider.getSigner();
            return signer;
        } catch (error) {
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
        if (!window.ethereum) return null;

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            return accounts[0] || null;
        } catch {
            return null;
        }
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