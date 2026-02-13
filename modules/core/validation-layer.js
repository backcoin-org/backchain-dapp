// modules/js/core/validation-layer.js
// ✅ PRODUCTION V1.0 - Multi-Layer Validation System for Backchain dApp
// 
// This module implements layered validations following "fail fast, fail cheap":
// - Layer 1: Network validation (FREE - local check)
// - Layer 2: Wallet validation (FREE - local check)
// - Layer 3: Balance validation (FREE - read calls)
// - Layer 4: Domain validation (FREE - read calls)
//
// ============================================================================
// PHILOSOPHY:
// Validate EVERYTHING before asking user to sign.
// Catch errors at the cheapest layer possible.
// Never let a transaction reach the blockchain if it will fail.
// ============================================================================

import { NetworkManager, NETWORK_CONFIG } from './network-manager.js';
import { ErrorHandler, ErrorTypes } from './error-handler.js';
import { CacheManager, CacheTTL, CacheKeys } from './cache-manager.js';

// ============================================================================
// 1. CONFIGURATION
// ============================================================================

/**
 * Minimum ETH required for gas (in wei)
 * 0.0005 ETH should be enough for most Arbitrum transactions
 */
const MIN_ETH_FOR_GAS = 500000000000000n; // 0.0005 ETH

/**
 * ERC20 ABI fragments needed for validation
 */
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
];

// ============================================================================
// 2. CORE VALIDATION LAYER
// ============================================================================

export const ValidationLayer = {

    // =========================================================================
    // LAYER 1: NETWORK VALIDATION (FREE)
    // =========================================================================

    /**
     * Validates user is on the correct network
     * @throws {Error} If on wrong network
     */
    async validateNetwork() {
        const isCorrect = await NetworkManager.isCorrectNetwork();
        
        if (!isCorrect) {
            const currentChainId = await NetworkManager.getCurrentChainId();
            throw ErrorHandler.create(ErrorTypes.WRONG_NETWORK, {
                currentChainId,
                expectedChainId: NETWORK_CONFIG.chainId
            });
        }
    },

    /**
     * Validates RPC is healthy and responsive
     * @throws {Error} If RPC is unhealthy
     */
    async validateRpcHealth() {
        const health = await NetworkManager.checkRpcHealth();
        
        if (!health.healthy) {
            // Try to switch RPC
            NetworkManager.switchToNextRpc();
            
            // Check again
            const recheck = await NetworkManager.checkRpcHealth();
            if (!recheck.healthy) {
                throw ErrorHandler.create(ErrorTypes.RPC_UNHEALTHY, {
                    error: health.error
                });
            }
        }
    },

    // =========================================================================
    // LAYER 2: WALLET VALIDATION (FREE)
    // =========================================================================

    /**
     * Validates wallet is connected
     * @param {string} [address] - Optional address to validate
     * @throws {Error} If wallet not connected
     */
    async validateWalletConnected(address = null) {
        if (!window.ethereum) {
            throw ErrorHandler.create(ErrorTypes.WALLET_NOT_CONNECTED);
        }

        const connectedAddress = address || await NetworkManager.getConnectedAddress();
        
        if (!connectedAddress) {
            throw ErrorHandler.create(ErrorTypes.WALLET_NOT_CONNECTED);
        }

        return connectedAddress;
    },

    /**
     * Full pre-transaction check (network + wallet)
     * @returns {Promise<string>} User address
     */
    async validatePreTransaction() {
        await this.validateNetwork();
        await this.validateRpcHealth();
        const address = await this.validateWalletConnected();
        return address;
    },

    // =========================================================================
    // LAYER 3: BALANCE VALIDATION (FREE - reads)
    // =========================================================================

    /**
     * Validates user has enough ETH for gas
     * @param {string} userAddress - User's address
     * @param {bigint} [minAmount] - Minimum ETH required
     * @throws {Error} If insufficient ETH
     */
    async validateEthForGas(userAddress, minAmount = MIN_ETH_FOR_GAS) {
        const ethers = window.ethers;
        const cacheKey = CacheKeys.ethBalance(userAddress);
        
        const balance = await CacheManager.getOrFetch(
            cacheKey,
            async () => {
                const provider = NetworkManager.getProvider();
                return await provider.getBalance(userAddress);
            },
            CacheTTL.BALANCE
        );

        if (balance < minAmount) {
            throw ErrorHandler.create(ErrorTypes.INSUFFICIENT_ETH, {
                balance: ethers.formatEther(balance),
                required: ethers.formatEther(minAmount)
            });
        }

        return balance;
    },

    /**
     * Validates user has enough token balance
     * @param {string} tokenAddress - Token contract address
     * @param {bigint} amount - Required amount
     * @param {string} userAddress - User's address
     * @throws {Error} If insufficient balance
     */
    async validateTokenBalance(tokenAddress, amount, userAddress) {
        const ethers = window.ethers;
        const cacheKey = CacheKeys.tokenBalance(tokenAddress, userAddress);
        
        const balance = await CacheManager.getOrFetch(
            cacheKey,
            async () => {
                const provider = NetworkManager.getProvider();
                const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
                return await token.balanceOf(userAddress);
            },
            CacheTTL.BALANCE
        );

        if (balance < amount) {
            throw ErrorHandler.create(ErrorTypes.INSUFFICIENT_TOKEN, {
                balance: ethers.formatEther(balance),
                required: ethers.formatEther(amount)
            });
        }

        return balance;
    },

    /**
     * Checks if token approval is needed
     * @param {string} tokenAddress - Token contract address
     * @param {string} spenderAddress - Spender address
     * @param {bigint} amount - Required amount
     * @param {string} userAddress - User's address
     * @returns {Promise<boolean>} true if approval needed
     */
    async needsApproval(tokenAddress, spenderAddress, amount, userAddress) {
        const ethers = window.ethers;
        const cacheKey = CacheKeys.allowance(tokenAddress, userAddress, spenderAddress);
        
        const allowance = await CacheManager.getOrFetch(
            cacheKey,
            async () => {
                const provider = NetworkManager.getProvider();
                const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
                return await token.allowance(userAddress, spenderAddress);
            },
            CacheTTL.ALLOWANCE
        );

        return allowance < amount;
    },

    /**
     * Validates token allowance is sufficient
     * @param {string} tokenAddress - Token contract address
     * @param {string} spenderAddress - Spender address
     * @param {bigint} amount - Required amount
     * @param {string} userAddress - User's address
     * @throws {Error} If insufficient allowance
     */
    async validateAllowance(tokenAddress, spenderAddress, amount, userAddress) {
        const needsApproval = await this.needsApproval(
            tokenAddress, 
            spenderAddress, 
            amount, 
            userAddress
        );

        if (needsApproval) {
            throw ErrorHandler.create(ErrorTypes.INSUFFICIENT_ALLOWANCE, {
                token: tokenAddress,
                spender: spenderAddress,
                required: amount.toString()
            });
        }
    },

    /**
     * Full balance validation (ETH + token + allowance)
     * @param {Object} params - Validation parameters
     */
    async validateBalances({
        userAddress,
        tokenAddress = null,
        tokenAmount = null,
        spenderAddress = null,
        ethAmount = MIN_ETH_FOR_GAS
    }) {
        // Always check ETH for gas
        await this.validateEthForGas(userAddress, ethAmount);

        // Check token balance if needed
        if (tokenAddress && tokenAmount) {
            await this.validateTokenBalance(tokenAddress, tokenAmount, userAddress);
        }

        // Note: We don't validate allowance here because
        // the transaction engine handles approval separately
    },

    // =========================================================================
    // LAYER 4: INPUT VALIDATION (FREE - local)
    // =========================================================================

    /**
     * Validates a value is positive
     * @param {bigint|number|string} value - Value to check
     * @param {string} fieldName - Field name for error message
     */
    validatePositive(value, fieldName = 'Amount') {
        const num = BigInt(value);
        if (num <= 0n) {
            throw new Error(`${fieldName} must be greater than zero`);
        }
    },

    /**
     * Validates a value is within range
     * @param {bigint|number} value - Value to check
     * @param {bigint|number} min - Minimum value
     * @param {bigint|number} max - Maximum value
     * @param {string} fieldName - Field name for error message
     */
    validateRange(value, min, max, fieldName = 'Value') {
        const num = BigInt(value);
        const minNum = BigInt(min);
        const maxNum = BigInt(max);

        if (num < minNum || num > maxNum) {
            throw new Error(`${fieldName} must be between ${min} and ${max}`);
        }
    },

    /**
     * Validates string is not empty
     * @param {string} value - String to check
     * @param {string} fieldName - Field name for error message
     */
    validateNotEmpty(value, fieldName = 'Field') {
        if (!value || value.trim().length === 0) {
            throw new Error(`${fieldName} cannot be empty`);
        }
    },

    /**
     * Validates address format
     * @param {string} address - Address to validate
     * @param {string} fieldName - Field name for error message
     */
    validateAddress(address, fieldName = 'Address') {
        const ethers = window.ethers;
        
        if (!address || !ethers.isAddress(address)) {
            throw new Error(`Invalid ${fieldName}`);
        }
    },

    // =========================================================================
    // DOMAIN-SPECIFIC VALIDATORS
    // =========================================================================

    /**
     * Charity Pool validations
     */
    charity: {
        /**
         * Validates campaign creation inputs
         */
        validateCreateCampaign({ title, description, goalAmount, durationDays }) {
            ValidationLayer.validateNotEmpty(title, 'Title');
            ValidationLayer.validateNotEmpty(description, 'Description');
            ValidationLayer.validatePositive(goalAmount, 'Goal amount');
            ValidationLayer.validateRange(durationDays, 1, 180, 'Duration');
        },

        /**
         * Validates donation inputs
         */
        validateDonate({ campaignId, amount }) {
            if (campaignId === undefined || campaignId === null) {
                throw new Error('Campaign ID is required');
            }
            ValidationLayer.validatePositive(amount, 'Donation amount');
        }
    },

    /**
     * Staking/Delegation validations
     */
    staking: {
        /**
         * Validates delegation inputs
         */
        validateDelegate({ amount, lockDays }) {
            ValidationLayer.validatePositive(amount, 'Stake amount');
            ValidationLayer.validateRange(lockDays, 1, 3650, 'Lock duration'); // 1 day to 10 years
        },

        /**
         * Validates unstake inputs
         */
        validateUnstake({ delegationIndex }) {
            if (delegationIndex === undefined || delegationIndex === null || delegationIndex < 0) {
                throw new Error('Invalid delegation index');
            }
        }
    },

    /**
     * NFT Pool validations
     */
    nftPool: {
        /**
         * Validates buy NFT inputs
         */
        validateBuy({ maxPrice }) {
            if (maxPrice !== undefined && maxPrice !== null) {
                ValidationLayer.validatePositive(maxPrice, 'Max price');
            }
        },

        /**
         * Validates sell NFT inputs
         */
        validateSell({ tokenId, minPayout }) {
            if (tokenId === undefined || tokenId === null) {
                throw new Error('Token ID is required');
            }
            if (minPayout !== undefined && minPayout !== null) {
                ValidationLayer.validatePositive(minPayout, 'Min payout');
            }
        }
    },

    /**
     * Fortune Pool validations
     */
    fortune: {
        /**
         * Validates play game inputs
         */
        validatePlay({ wagerAmount, guesses, isCumulative }) {
            ValidationLayer.validatePositive(wagerAmount, 'Wager amount');
            
            if (!Array.isArray(guesses) || guesses.length === 0) {
                throw new Error('At least one guess is required');
            }

            // Validate each guess is a positive number
            guesses.forEach((guess, index) => {
                if (typeof guess !== 'number' || guess < 1) {
                    throw new Error(`Invalid guess at position ${index + 1}`);
                }
            });
        }
    },

    /**
     * Rental validations
     */
    rental: {
        /**
         * Validates list NFT inputs
         */
        validateList({ tokenId, pricePerDay }) {
            if (tokenId === undefined || tokenId === null) {
                throw new Error('Token ID is required');
            }
            ValidationLayer.validatePositive(pricePerDay, 'Price per day');
        },

        /**
         * Validates rent NFT inputs (V2: fixed 1-day, no hours)
         */
        validateRent({ tokenId }) {
            if (tokenId === undefined || tokenId === null) {
                throw new Error('Token ID is required');
            }
        }
    },

    /**
     * Notary validations
     */
    notary: {
        /**
         * Validates notarize inputs
         */
        validateNotarize({ ipfsCid, description, contentHash }) {
            ValidationLayer.validateNotEmpty(ipfsCid, 'IPFS CID');
            
            // Content hash should be 32 bytes (64 hex chars without 0x)
            if (contentHash) {
                const cleanHash = contentHash.startsWith('0x') ? contentHash.slice(2) : contentHash;
                if (cleanHash.length !== 64) {
                    throw new Error('Content hash must be 32 bytes');
                }
            }
        }
    }
};

// ============================================================================
// 3. HELPER FUNCTIONS
// ============================================================================

/**
 * Runs all pre-transaction validations
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result with user address
 */
export async function runPreValidations({
    requiresToken = false,
    tokenAddress = null,
    tokenAmount = null,
    spenderAddress = null,
    customValidation = null
}) {
    // Layer 1: Network
    await ValidationLayer.validateNetwork();
    
    // Layer 1b: RPC Health
    await ValidationLayer.validateRpcHealth();
    
    // Layer 2: Wallet
    const userAddress = await ValidationLayer.validateWalletConnected();
    
    // Layer 3: ETH for gas
    await ValidationLayer.validateEthForGas(userAddress);
    
    // Layer 3b: Token balance (if needed)
    if (requiresToken && tokenAddress && tokenAmount) {
        await ValidationLayer.validateTokenBalance(tokenAddress, tokenAmount, userAddress);
    }
    
    // Layer 4: Custom domain validation
    if (customValidation) {
        await customValidation(userAddress);
    }

    return {
        valid: true,
        userAddress,
        needsApproval: requiresToken && spenderAddress 
            ? await ValidationLayer.needsApproval(tokenAddress, spenderAddress, tokenAmount, userAddress)
            : false
    };
}

// ============================================================================
// 4. EXPORT
// ============================================================================

export default ValidationLayer;