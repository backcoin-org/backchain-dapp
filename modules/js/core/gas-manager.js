// modules/js/core/gas-manager.js
// ✅ PRODUCTION V1.0 - Gas Estimation & Management for Backchain dApp
// 
// This module handles all gas-related operations:
// - Gas estimation with safety margins
// - Gas price fetching
// - Cost calculations
// - Formatting for UI display
//
// ============================================================================
// KEY CONCEPT:
// estimateGas() is FREE and acts as a transaction simulator.
// If it fails, the transaction WOULD fail on-chain (saving gas costs).
// ============================================================================

import { NetworkManager } from './network-manager.js';
import { CacheManager, CacheTTL } from './cache-manager.js';

// ============================================================================
// 1. CONFIGURATION
// ============================================================================

/**
 * Gas configuration constants
 */
const GAS_CONFIG = {
    // Safety margin multipliers (as percentage)
    SAFETY_MARGIN_PERCENT: 20,      // Add 20% to estimated gas
    MAX_SAFETY_MARGIN_PERCENT: 50,  // Never add more than 50%
    
    // Minimum gas limits by operation type
    MIN_GAS_LIMITS: {
        transfer: 21000n,
        erc20Transfer: 65000n,
        erc20Approve: 50000n,
        contractCall: 100000n,
        complexCall: 300000n
    },
    
    // Maximum gas limits (safety cap)
    MAX_GAS_LIMIT: 15000000n,  // 15M gas (Arbitrum block limit is higher)
    
    // Gas price bounds (in gwei)
    MIN_GAS_PRICE_GWEI: 0.01,
    MAX_GAS_PRICE_GWEI: 100,
    
    // Cache TTL for gas price
    GAS_PRICE_CACHE_TTL: 15000  // 15 seconds
};

// ============================================================================
// 2. GAS MANAGER
// ============================================================================

export const GasManager = {

    // =========================================================================
    // GAS ESTIMATION
    // =========================================================================

    /**
     * Estimates gas for a contract method call
     * This is FREE and simulates the transaction
     * 
     * @param {ethers.Contract} contract - Contract instance
     * @param {string} method - Method name
     * @param {Array} args - Method arguments
     * @param {Object} options - Transaction options (value, from, etc.)
     * @returns {Promise<bigint>} Estimated gas
     * 
     * @example
     * const gas = await GasManager.estimateGas(
     *     charityContract, 
     *     'donate', 
     *     [campaignId, amount]
     * );
     */
    async estimateGas(contract, method, args = [], options = {}) {
        try {
            // Call estimateGas on the contract method
            const estimate = await contract[method].estimateGas(...args, options);
            return estimate;
        } catch (error) {
            // estimateGas failed = transaction would fail
            // Re-throw for proper handling
            throw error;
        }
    },

    /**
     * Estimates gas and adds safety margin
     * 
     * @param {ethers.Contract} contract - Contract instance
     * @param {string} method - Method name
     * @param {Array} args - Method arguments
     * @param {Object} options - Transaction options
     * @returns {Promise<bigint>} Gas limit with safety margin
     */
    async estimateGasWithMargin(contract, method, args = [], options = {}) {
        const estimate = await this.estimateGas(contract, method, args, options);
        return this.addSafetyMargin(estimate);
    },

    /**
     * Adds safety margin to gas estimate
     * 
     * @param {bigint} gasEstimate - Raw gas estimate
     * @param {number} marginPercent - Margin percentage (default from config)
     * @returns {bigint} Gas with margin added
     */
    addSafetyMargin(gasEstimate, marginPercent = GAS_CONFIG.SAFETY_MARGIN_PERCENT) {
        // Ensure we're working with bigint
        const estimate = BigInt(gasEstimate);
        
        // Calculate margin
        const margin = (estimate * BigInt(marginPercent)) / 100n;
        let gasWithMargin = estimate + margin;
        
        // Apply maximum cap
        if (gasWithMargin > GAS_CONFIG.MAX_GAS_LIMIT) {
            console.warn('[Gas] Estimate exceeds max limit, capping');
            gasWithMargin = GAS_CONFIG.MAX_GAS_LIMIT;
        }
        
        return gasWithMargin;
    },

    /**
     * Gets minimum gas limit for operation type
     * 
     * @param {string} operationType - Type of operation
     * @returns {bigint} Minimum gas limit
     */
    getMinGasLimit(operationType = 'contractCall') {
        return GAS_CONFIG.MIN_GAS_LIMITS[operationType] || GAS_CONFIG.MIN_GAS_LIMITS.contractCall;
    },

    // =========================================================================
    // GAS PRICE
    // =========================================================================

    /**
     * Gets current gas price from network
     * Uses cache to avoid excessive RPC calls
     * 
     * @returns {Promise<bigint>} Gas price in wei
     */
    async getGasPrice() {
        const cacheKey = 'gas-price-current';
        
        return await CacheManager.getOrFetch(
            cacheKey,
            async () => {
                const provider = NetworkManager.getProvider();
                const feeData = await provider.getFeeData();
                return feeData.gasPrice || 0n;
            },
            GAS_CONFIG.GAS_PRICE_CACHE_TTL
        );
    },

    /**
     * Gets fee data (EIP-1559 compatible)
     * 
     * @returns {Promise<Object>} Fee data { gasPrice, maxFeePerGas, maxPriorityFeePerGas }
     */
    async getFeeData() {
        const cacheKey = 'gas-fee-data';
        
        return await CacheManager.getOrFetch(
            cacheKey,
            async () => {
                const provider = NetworkManager.getProvider();
                const feeData = await provider.getFeeData();
                return {
                    gasPrice: feeData.gasPrice || 0n,
                    maxFeePerGas: feeData.maxFeePerGas || 0n,
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 0n
                };
            },
            GAS_CONFIG.GAS_PRICE_CACHE_TTL
        );
    },

    /**
     * Gets gas price in gwei
     * 
     * @returns {Promise<number>} Gas price in gwei
     */
    async getGasPriceGwei() {
        const ethers = window.ethers;
        const gasPrice = await this.getGasPrice();
        return parseFloat(ethers.formatUnits(gasPrice, 'gwei'));
    },

    // =========================================================================
    // COST CALCULATION
    // =========================================================================

    /**
     * Calculates transaction cost in ETH
     * 
     * @param {bigint} gasLimit - Gas limit
     * @param {bigint} gasPrice - Gas price (optional, will fetch if not provided)
     * @returns {Promise<Object>} Cost info { wei, eth, formatted }
     */
    async calculateCost(gasLimit, gasPrice = null) {
        const ethers = window.ethers;
        
        if (!gasPrice) {
            gasPrice = await this.getGasPrice();
        }
        
        const costWei = BigInt(gasLimit) * BigInt(gasPrice);
        const costEth = ethers.formatEther(costWei);
        
        return {
            wei: costWei,
            eth: parseFloat(costEth),
            formatted: this.formatEth(costEth)
        };
    },

    /**
     * Estimates full transaction cost
     * 
     * @param {ethers.Contract} contract - Contract instance
     * @param {string} method - Method name
     * @param {Array} args - Method arguments
     * @param {Object} options - Transaction options
     * @returns {Promise<Object>} Full cost breakdown
     */
    async estimateTransactionCost(contract, method, args = [], options = {}) {
        const gasEstimate = await this.estimateGas(contract, method, args, options);
        const gasWithMargin = this.addSafetyMargin(gasEstimate);
        const gasPrice = await this.getGasPrice();
        const cost = await this.calculateCost(gasWithMargin, gasPrice);
        
        return {
            gasEstimate,
            gasWithMargin,
            gasPrice,
            ...cost
        };
    },

    // =========================================================================
    // VALIDATION
    // =========================================================================

    /**
     * Checks if user has enough ETH for gas
     * 
     * @param {string} userAddress - User's address
     * @param {bigint} gasLimit - Required gas limit
     * @param {bigint} gasPrice - Gas price (optional)
     * @returns {Promise<Object>} Validation result { sufficient, balance, required, shortage }
     */
    async validateGasBalance(userAddress, gasLimit, gasPrice = null) {
        const ethers = window.ethers;
        const provider = NetworkManager.getProvider();
        
        if (!gasPrice) {
            gasPrice = await this.getGasPrice();
        }
        
        const balance = await provider.getBalance(userAddress);
        const required = BigInt(gasLimit) * BigInt(gasPrice);
        const sufficient = balance >= required;
        
        return {
            sufficient,
            balance,
            required,
            shortage: sufficient ? 0n : required - balance,
            balanceFormatted: ethers.formatEther(balance),
            requiredFormatted: ethers.formatEther(required)
        };
    },

    /**
     * Quick check if user has minimum ETH for gas
     * 
     * @param {string} userAddress - User's address
     * @param {bigint} minEth - Minimum ETH required (default 0.001)
     * @returns {Promise<boolean>} true if has enough
     */
    async hasMinimumGas(userAddress, minEth = null) {
        const ethers = window.ethers;
        const provider = NetworkManager.getProvider();
        
        const balance = await provider.getBalance(userAddress);
        const minRequired = minEth || ethers.parseEther('0.001');
        
        return balance >= minRequired;
    },

    // =========================================================================
    // FORMATTING
    // =========================================================================

    /**
     * Formats ETH value for display
     * 
     * @param {string|number} ethValue - ETH value
     * @param {number} decimals - Decimal places (default 6)
     * @returns {string} Formatted string
     */
    formatEth(ethValue, decimals = 6) {
        const value = parseFloat(ethValue);
        
        if (value === 0) return '0 ETH';
        if (value < 0.000001) return '< 0.000001 ETH';
        
        return `${value.toFixed(decimals).replace(/\.?0+$/, '')} ETH`;
    },

    /**
     * Formats gas price for display
     * 
     * @param {bigint} gasPrice - Gas price in wei
     * @returns {string} Formatted string (e.g., "0.1 gwei")
     */
    formatGasPrice(gasPrice) {
        const ethers = window.ethers;
        const gwei = parseFloat(ethers.formatUnits(gasPrice, 'gwei'));
        
        if (gwei < 0.01) return '< 0.01 gwei';
        if (gwei < 1) return `${gwei.toFixed(2)} gwei`;
        
        return `${gwei.toFixed(1)} gwei`;
    },

    /**
     * Formats gas limit for display
     * 
     * @param {bigint} gasLimit - Gas limit
     * @returns {string} Formatted string (e.g., "150,000")
     */
    formatGasLimit(gasLimit) {
        return Number(gasLimit).toLocaleString();
    },

    /**
     * Gets human-readable gas summary
     * 
     * @param {Object} costInfo - Cost info from calculateCost
     * @returns {string} Summary string
     */
    formatGasSummary(costInfo) {
        return `~${costInfo.formatted} (${this.formatGasLimit(costInfo.gasWithMargin || 0n)} gas)`;
    },

    // =========================================================================
    // UTILITIES
    // =========================================================================

    /**
     * Compares two gas estimates
     * 
     * @param {bigint} estimate1 - First estimate
     * @param {bigint} estimate2 - Second estimate
     * @returns {number} Difference percentage
     */
    compareEstimates(estimate1, estimate2) {
        const e1 = BigInt(estimate1);
        const e2 = BigInt(estimate2);
        
        if (e2 === 0n) return 0;
        
        const diff = e1 > e2 ? e1 - e2 : e2 - e1;
        return Number((diff * 100n) / e2);
    },

    /**
     * Checks if gas price is reasonable
     * 
     * @param {bigint} gasPrice - Gas price in wei
     * @returns {Object} { reasonable, warning }
     */
    isGasPriceReasonable(gasPrice) {
        const ethers = window.ethers;
        const gwei = parseFloat(ethers.formatUnits(gasPrice, 'gwei'));
        
        if (gwei < GAS_CONFIG.MIN_GAS_PRICE_GWEI) {
            return { 
                reasonable: false, 
                warning: 'Gas price unusually low, transaction may be slow' 
            };
        }
        
        if (gwei > GAS_CONFIG.MAX_GAS_PRICE_GWEI) {
            return { 
                reasonable: false, 
                warning: 'Gas price unusually high, consider waiting' 
            };
        }
        
        return { reasonable: true, warning: null };
    },

    /**
     * Gets recommended gas settings for transaction
     * 
     * @param {bigint} gasEstimate - Base gas estimate
     * @returns {Promise<Object>} Recommended settings
     */
    async getRecommendedSettings(gasEstimate) {
        const feeData = await this.getFeeData();
        const gasLimit = this.addSafetyMargin(gasEstimate);
        
        return {
            gasLimit,
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        };
    },

    /**
     * Creates transaction overrides object
     * 
     * @param {bigint} gasEstimate - Gas estimate
     * @param {Object} extraOverrides - Additional overrides
     * @returns {Promise<Object>} Transaction overrides
     */
    async createTxOverrides(gasEstimate, extraOverrides = {}) {
        const settings = await this.getRecommendedSettings(gasEstimate);
        
        return {
            gasLimit: settings.gasLimit,
            ...extraOverrides
        };
    }
};

// ============================================================================
// 3. EXPORT
// ============================================================================

export default GasManager;