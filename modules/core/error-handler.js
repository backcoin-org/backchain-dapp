// modules/js/core/error-handler.js
// ✅ PRODUCTION V1.3 - Auto RPC switch on rate limit
// 
// V1.3: Added handleWithRpcSwitch() to automatically switch RPC on rate limit
// V1.2: Fixed BigInt serialization error in _extractMessage (added _safeStringify)
// V1.1: classify() now respects errorType from create() to prevent re-classification
//
// This module centralizes all error handling logic.
// Classifies errors, determines retry behavior, and generates user-friendly messages.
//
// ============================================================================
// PHILOSOPHY: "Fail Fast, Fail Cheap"
// - Detect errors at the cheapest layer possible
// - Never spend gas on transactions that will fail
// - Show messages users can understand
// ============================================================================

// ============================================================================
// 1. ERROR TYPES
// ============================================================================

/**
 * Enum with all possible error types in the system
 * Organized by "layer" where they are detected
 */
export const ErrorTypes = {
    // ─────────────────────────────────────────────────────────────────────
    // LAYER 1: NETWORK (detected free, before any call)
    // ─────────────────────────────────────────────────────────────────────
    WRONG_NETWORK: 'wrong_network',
    RPC_UNHEALTHY: 'rpc_unhealthy',
    RPC_RATE_LIMITED: 'rpc_rate_limited',
    NETWORK_ERROR: 'network_error',
    
    // ─────────────────────────────────────────────────────────────────────
    // LAYER 2: WALLET (detected free)
    // ─────────────────────────────────────────────────────────────────────
    WALLET_NOT_CONNECTED: 'wallet_not_connected',
    WALLET_LOCKED: 'wallet_locked',
    
    // ─────────────────────────────────────────────────────────────────────
    // LAYER 3: BALANCES (detected free via reads)
    // ─────────────────────────────────────────────────────────────────────
    INSUFFICIENT_ETH: 'insufficient_eth',
    INSUFFICIENT_TOKEN: 'insufficient_token',
    INSUFFICIENT_ALLOWANCE: 'insufficient_allowance',
    
    // ─────────────────────────────────────────────────────────────────────
    // LAYER 4: SIMULATION (detected free via estimateGas)
    // ─────────────────────────────────────────────────────────────────────
    SIMULATION_REVERTED: 'simulation_reverted',
    GAS_ESTIMATION_FAILED: 'gas_estimation_failed',
    
    // ─────────────────────────────────────────────────────────────────────
    // LAYER 5: EXECUTION (costs gas - only reaches here if validations pass)
    // ─────────────────────────────────────────────────────────────────────
    USER_REJECTED: 'user_rejected',
    TX_REVERTED: 'tx_reverted',
    TX_TIMEOUT: 'tx_timeout',
    TX_REPLACED: 'tx_replaced',
    TX_UNDERPRICED: 'tx_underpriced',
    NONCE_ERROR: 'nonce_error',
    
    // ─────────────────────────────────────────────────────────────────────
    // DOMAIN ERRORS: CHARITY
    // ─────────────────────────────────────────────────────────────────────
    CAMPAIGN_NOT_FOUND: 'campaign_not_found',
    CAMPAIGN_NOT_ACTIVE: 'campaign_not_active',
    CAMPAIGN_STILL_ACTIVE: 'campaign_still_active',
    NOT_CAMPAIGN_CREATOR: 'not_campaign_creator',
    DONATION_TOO_SMALL: 'donation_too_small',
    MAX_CAMPAIGNS_REACHED: 'max_campaigns_reached',
    INSUFFICIENT_ETH_FEE: 'insufficient_eth_fee',
    
    // ─────────────────────────────────────────────────────────────────────
    // DOMAIN ERRORS: STAKING
    // ─────────────────────────────────────────────────────────────────────
    LOCK_PERIOD_ACTIVE: 'lock_period_active',
    LOCK_PERIOD_EXPIRED: 'lock_period_expired',
    NO_REWARDS: 'no_rewards',
    INVALID_DURATION: 'invalid_duration',
    INVALID_DELEGATION_INDEX: 'invalid_delegation_index',
    
    // ─────────────────────────────────────────────────────────────────────
    // DOMAIN ERRORS: NFT POOL
    // ─────────────────────────────────────────────────────────────────────
    NFT_NOT_IN_POOL: 'nft_not_in_pool',
    POOL_NOT_INITIALIZED: 'pool_not_initialized',
    INSUFFICIENT_POOL_LIQUIDITY: 'insufficient_pool_liquidity',
    SLIPPAGE_EXCEEDED: 'slippage_exceeded',
    NFT_BOOST_MISMATCH: 'nft_boost_mismatch',
    NOT_NFT_OWNER: 'not_nft_owner',
    
    // ─────────────────────────────────────────────────────────────────────
    // DOMAIN ERRORS: FORTUNE
    // ─────────────────────────────────────────────────────────────────────
    NO_ACTIVE_TIERS: 'no_active_tiers',
    INVALID_GUESS_COUNT: 'invalid_guess_count',
    INVALID_GUESS_RANGE: 'invalid_guess_range',
    INSUFFICIENT_SERVICE_FEE: 'insufficient_service_fee',
    
    // ─────────────────────────────────────────────────────────────────────
    // DOMAIN ERRORS: RENTAL
    // ─────────────────────────────────────────────────────────────────────
    RENTAL_STILL_ACTIVE: 'rental_still_active',
    NFT_NOT_LISTED: 'nft_not_listed',
    NFT_ALREADY_LISTED: 'nft_already_listed',
    NOT_LISTING_OWNER: 'not_listing_owner',
    MARKETPLACE_PAUSED: 'marketplace_paused',
    
    // ─────────────────────────────────────────────────────────────────────
    // DOMAIN ERRORS: NOTARY
    // ─────────────────────────────────────────────────────────────────────
    EMPTY_METADATA: 'empty_metadata',
    
    // ─────────────────────────────────────────────────────────────────────
    // GENERIC
    // ─────────────────────────────────────────────────────────────────────
    CONTRACT_ERROR: 'contract_error',
    UNKNOWN: 'unknown'
};

// ============================================================================
// 2. ERROR MESSAGES
// ============================================================================

/**
 * User-friendly messages for each error type
 */
export const ErrorMessages = {
    // Network
    [ErrorTypes.WRONG_NETWORK]: 'Please switch to Arbitrum Sepolia network',
    [ErrorTypes.RPC_UNHEALTHY]: 'Network connection issue. Retrying...',
    [ErrorTypes.RPC_RATE_LIMITED]: 'Network is busy. Please wait a moment...',
    [ErrorTypes.NETWORK_ERROR]: 'Network error. Please check your connection',
    
    // Wallet
    [ErrorTypes.WALLET_NOT_CONNECTED]: 'Please connect your wallet',
    [ErrorTypes.WALLET_LOCKED]: 'Please unlock your wallet',
    
    // Balances
    [ErrorTypes.INSUFFICIENT_ETH]: 'Insufficient ETH for gas fees',
    [ErrorTypes.INSUFFICIENT_TOKEN]: 'Insufficient BKC balance',
    [ErrorTypes.INSUFFICIENT_ALLOWANCE]: 'Token approval required',
    
    // Simulation
    [ErrorTypes.SIMULATION_REVERTED]: 'Transaction would fail. Please check your inputs',
    [ErrorTypes.GAS_ESTIMATION_FAILED]: 'Could not estimate gas. Transaction may fail',
    
    // Execution
    [ErrorTypes.USER_REJECTED]: 'Transaction cancelled',
    [ErrorTypes.TX_REVERTED]: 'Transaction failed on blockchain',
    [ErrorTypes.TX_TIMEOUT]: 'Transaction is taking too long. Please check your wallet',
    [ErrorTypes.TX_REPLACED]: 'Transaction was replaced',
    [ErrorTypes.TX_UNDERPRICED]: 'Gas price too low. Please try again',
    [ErrorTypes.NONCE_ERROR]: 'Transaction sequence error. Please refresh and try again',
    
    // Charity
    [ErrorTypes.CAMPAIGN_NOT_FOUND]: 'Campaign not found',
    [ErrorTypes.CAMPAIGN_NOT_ACTIVE]: 'This campaign is no longer accepting donations',
    [ErrorTypes.CAMPAIGN_STILL_ACTIVE]: 'Campaign is still active. Please wait until the deadline',
    [ErrorTypes.NOT_CAMPAIGN_CREATOR]: 'Only the campaign creator can perform this action',
    [ErrorTypes.DONATION_TOO_SMALL]: 'Donation amount is below the minimum required',
    [ErrorTypes.MAX_CAMPAIGNS_REACHED]: 'You have reached the maximum number of active campaigns',
    [ErrorTypes.INSUFFICIENT_ETH_FEE]: 'Insufficient ETH for withdrawal fee',
    
    // Staking
    [ErrorTypes.LOCK_PERIOD_ACTIVE]: 'Your tokens are still locked',
    [ErrorTypes.LOCK_PERIOD_EXPIRED]: 'Lock period has expired. Use normal unstake',
    [ErrorTypes.NO_REWARDS]: 'No rewards available to claim',
    [ErrorTypes.INVALID_DURATION]: 'Lock duration must be between 1 day and 10 years',
    [ErrorTypes.INVALID_DELEGATION_INDEX]: 'Delegation not found',
    
    // NFT Pool
    [ErrorTypes.NFT_NOT_IN_POOL]: 'This NFT is not available in the pool',
    [ErrorTypes.POOL_NOT_INITIALIZED]: 'Pool is not active yet',
    [ErrorTypes.INSUFFICIENT_POOL_LIQUIDITY]: 'Insufficient liquidity in pool',
    [ErrorTypes.SLIPPAGE_EXCEEDED]: 'Price changed too much. Please try again',
    [ErrorTypes.NFT_BOOST_MISMATCH]: 'NFT tier does not match this pool',
    [ErrorTypes.NOT_NFT_OWNER]: 'You do not own this NFT',
    
    // Fortune
    [ErrorTypes.NO_ACTIVE_TIERS]: 'No active prize tiers available',
    [ErrorTypes.INVALID_GUESS_COUNT]: 'Invalid number of guesses provided',
    [ErrorTypes.INVALID_GUESS_RANGE]: 'Your guess is outside the valid range',
    [ErrorTypes.INSUFFICIENT_SERVICE_FEE]: 'Incorrect service fee amount',
    
    // Rental
    [ErrorTypes.RENTAL_STILL_ACTIVE]: 'This NFT is currently being rented',
    [ErrorTypes.NFT_NOT_LISTED]: 'This NFT is not listed for rent',
    [ErrorTypes.NFT_ALREADY_LISTED]: 'This NFT is already listed',
    [ErrorTypes.NOT_LISTING_OWNER]: 'Only the listing owner can perform this action',
    [ErrorTypes.MARKETPLACE_PAUSED]: 'Marketplace is temporarily paused',
    
    // Notary
    [ErrorTypes.EMPTY_METADATA]: 'Document metadata cannot be empty',
    
    // Generic
    [ErrorTypes.CONTRACT_ERROR]: 'Transaction cannot be completed. Please check your inputs and try again',
    [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again'
};

// ============================================================================
// 3. ERROR CONFIGURATION
// ============================================================================

/**
 * Behavior configuration for each error type
 * - layer: Where error is detected (1=cheapest, 5=most expensive)
 * - retry: Whether automatic retry is allowed
 * - waitMs: Milliseconds to wait before retry
 * - action: Special action to trigger (e.g., 'switch_network')
 */
const ErrorConfig = {
    // Network - can retry
    [ErrorTypes.WRONG_NETWORK]: { layer: 1, retry: false, action: 'switch_network' },
    [ErrorTypes.RPC_UNHEALTHY]: { layer: 1, retry: true, waitMs: 2000, action: 'switch_rpc' },
    [ErrorTypes.RPC_RATE_LIMITED]: { layer: 1, retry: true, waitMs: 'extract', action: 'switch_rpc' },
    [ErrorTypes.NETWORK_ERROR]: { layer: 1, retry: true, waitMs: 3000, action: 'switch_rpc' },
    
    // Wallet - no retry
    [ErrorTypes.WALLET_NOT_CONNECTED]: { layer: 2, retry: false, action: 'connect_wallet' },
    [ErrorTypes.WALLET_LOCKED]: { layer: 2, retry: false, action: 'unlock_wallet' },
    
    // Balances - no retry
    [ErrorTypes.INSUFFICIENT_ETH]: { layer: 3, retry: false, action: 'show_faucet' },
    [ErrorTypes.INSUFFICIENT_TOKEN]: { layer: 3, retry: false },
    [ErrorTypes.INSUFFICIENT_ALLOWANCE]: { layer: 3, retry: false },
    
    // Simulation - no retry
    [ErrorTypes.SIMULATION_REVERTED]: { layer: 4, retry: false },
    [ErrorTypes.GAS_ESTIMATION_FAILED]: { layer: 4, retry: true, waitMs: 2000 },
    
    // Execution
    [ErrorTypes.USER_REJECTED]: { layer: 5, retry: false },
    [ErrorTypes.TX_REVERTED]: { layer: 5, retry: false },
    [ErrorTypes.TX_TIMEOUT]: { layer: 5, retry: true, waitMs: 5000 },
    [ErrorTypes.TX_REPLACED]: { layer: 5, retry: false },
    [ErrorTypes.TX_UNDERPRICED]: { layer: 5, retry: true, waitMs: 1000 },
    [ErrorTypes.NONCE_ERROR]: { layer: 5, retry: true, waitMs: 2000 },
    
    // Domain errors - no retry (business logic errors)
    [ErrorTypes.CAMPAIGN_NOT_FOUND]: { layer: 4, retry: false },
    [ErrorTypes.CAMPAIGN_NOT_ACTIVE]: { layer: 4, retry: false },
    [ErrorTypes.CAMPAIGN_STILL_ACTIVE]: { layer: 4, retry: false },
    [ErrorTypes.NOT_CAMPAIGN_CREATOR]: { layer: 4, retry: false },
    [ErrorTypes.DONATION_TOO_SMALL]: { layer: 4, retry: false },
    [ErrorTypes.MAX_CAMPAIGNS_REACHED]: { layer: 4, retry: false },
    [ErrorTypes.INSUFFICIENT_ETH_FEE]: { layer: 3, retry: false },
    [ErrorTypes.LOCK_PERIOD_ACTIVE]: { layer: 4, retry: false },
    [ErrorTypes.LOCK_PERIOD_EXPIRED]: { layer: 4, retry: false },
    [ErrorTypes.NO_REWARDS]: { layer: 4, retry: false },
    [ErrorTypes.INVALID_DURATION]: { layer: 4, retry: false },
    [ErrorTypes.INVALID_DELEGATION_INDEX]: { layer: 4, retry: false },
    [ErrorTypes.NFT_NOT_IN_POOL]: { layer: 4, retry: false },
    [ErrorTypes.POOL_NOT_INITIALIZED]: { layer: 4, retry: false },
    [ErrorTypes.INSUFFICIENT_POOL_LIQUIDITY]: { layer: 4, retry: false },
    [ErrorTypes.SLIPPAGE_EXCEEDED]: { layer: 4, retry: true, waitMs: 1000 },
    [ErrorTypes.NFT_BOOST_MISMATCH]: { layer: 4, retry: false },
    [ErrorTypes.NOT_NFT_OWNER]: { layer: 4, retry: false },
    [ErrorTypes.NO_ACTIVE_TIERS]: { layer: 4, retry: false },
    [ErrorTypes.INVALID_GUESS_COUNT]: { layer: 4, retry: false },
    [ErrorTypes.INVALID_GUESS_RANGE]: { layer: 4, retry: false },
    [ErrorTypes.INSUFFICIENT_SERVICE_FEE]: { layer: 4, retry: false },
    [ErrorTypes.RENTAL_STILL_ACTIVE]: { layer: 4, retry: false },
    [ErrorTypes.NFT_NOT_LISTED]: { layer: 4, retry: false },
    [ErrorTypes.NFT_ALREADY_LISTED]: { layer: 4, retry: false },
    [ErrorTypes.NOT_LISTING_OWNER]: { layer: 4, retry: false },
    [ErrorTypes.MARKETPLACE_PAUSED]: { layer: 4, retry: false },
    [ErrorTypes.EMPTY_METADATA]: { layer: 4, retry: false },
    
    // Generic
    [ErrorTypes.CONTRACT_ERROR]: { layer: 4, retry: false },
    [ErrorTypes.UNKNOWN]: { layer: 5, retry: false }
};

// ============================================================================
// 4. ERROR DETECTION PATTERNS
// ============================================================================

/**
 * Mapping of error strings to types
 * Order matters - more specific patterns first
 */
const ErrorPatterns = [
    // ─────────────────────────────────────────────────────────────────────
    // USER REJECTION (highest priority)
    // ─────────────────────────────────────────────────────────────────────
    { pattern: /user rejected/i, type: ErrorTypes.USER_REJECTED },
    { pattern: /user denied/i, type: ErrorTypes.USER_REJECTED },
    { pattern: /user cancel/i, type: ErrorTypes.USER_REJECTED },
    { pattern: /rejected by user/i, type: ErrorTypes.USER_REJECTED },
    { pattern: /cancelled/i, type: ErrorTypes.USER_REJECTED },
    { pattern: /canceled/i, type: ErrorTypes.USER_REJECTED },
    { pattern: /action_rejected/i, type: ErrorTypes.USER_REJECTED },
    
    // ─────────────────────────────────────────────────────────────────────
    // RPC ERRORS
    // ─────────────────────────────────────────────────────────────────────
    { pattern: /too many errors/i, type: ErrorTypes.RPC_RATE_LIMITED },
    { pattern: /rate limit/i, type: ErrorTypes.RPC_RATE_LIMITED },
    { pattern: /retrying in/i, type: ErrorTypes.RPC_RATE_LIMITED },
    { pattern: /429/i, type: ErrorTypes.RPC_RATE_LIMITED },
    { pattern: /internal json-rpc/i, type: ErrorTypes.RPC_UNHEALTHY },
    { pattern: /-32603/i, type: ErrorTypes.RPC_UNHEALTHY },
    { pattern: /-32002/i, type: ErrorTypes.RPC_RATE_LIMITED },
    { pattern: /failed to fetch/i, type: ErrorTypes.NETWORK_ERROR },
    { pattern: /network error/i, type: ErrorTypes.NETWORK_ERROR },
    { pattern: /timeout/i, type: ErrorTypes.TX_TIMEOUT },
    
    // ─────────────────────────────────────────────────────────────────────
    // BALANCE ERRORS
    // ─────────────────────────────────────────────────────────────────────
    { pattern: /insufficient funds/i, type: ErrorTypes.INSUFFICIENT_ETH },
    { pattern: /exceeds the balance/i, type: ErrorTypes.INSUFFICIENT_ETH },
    { pattern: /insufficient balance/i, type: ErrorTypes.INSUFFICIENT_TOKEN },
    { pattern: /transfer amount exceeds balance/i, type: ErrorTypes.INSUFFICIENT_TOKEN },
    { pattern: /exceeds balance/i, type: ErrorTypes.INSUFFICIENT_TOKEN },
    
    // ─────────────────────────────────────────────────────────────────────
    // TRANSACTION ERRORS
    // ─────────────────────────────────────────────────────────────────────
    { pattern: /nonce/i, type: ErrorTypes.NONCE_ERROR },
    { pattern: /replacement.*underpriced/i, type: ErrorTypes.TX_UNDERPRICED },
    { pattern: /transaction underpriced/i, type: ErrorTypes.TX_UNDERPRICED },
    { pattern: /gas too low/i, type: ErrorTypes.TX_UNDERPRICED },
    { pattern: /reverted/i, type: ErrorTypes.TX_REVERTED },
    { pattern: /revert/i, type: ErrorTypes.TX_REVERTED },
    
    // ─────────────────────────────────────────────────────────────────────
    // CHARITY ERRORS (from contract)
    // ─────────────────────────────────────────────────────────────────────
    { pattern: /campaignnotfound/i, type: ErrorTypes.CAMPAIGN_NOT_FOUND },
    { pattern: /campaign not found/i, type: ErrorTypes.CAMPAIGN_NOT_FOUND },
    { pattern: /campaignnotactive/i, type: ErrorTypes.CAMPAIGN_NOT_ACTIVE },
    { pattern: /campaign.*not.*active/i, type: ErrorTypes.CAMPAIGN_NOT_ACTIVE },
    { pattern: /campaignstillactive/i, type: ErrorTypes.CAMPAIGN_STILL_ACTIVE },
    { pattern: /notcampaigncreator/i, type: ErrorTypes.NOT_CAMPAIGN_CREATOR },
    { pattern: /donationtoosmall/i, type: ErrorTypes.DONATION_TOO_SMALL },
    { pattern: /maxactivecampaignsreached/i, type: ErrorTypes.MAX_CAMPAIGNS_REACHED },
    { pattern: /insufficientethfee/i, type: ErrorTypes.INSUFFICIENT_ETH_FEE },
    
    // ─────────────────────────────────────────────────────────────────────
    // STAKING ERRORS
    // ─────────────────────────────────────────────────────────────────────
    { pattern: /lockperiodactive/i, type: ErrorTypes.LOCK_PERIOD_ACTIVE },
    { pattern: /lock.*period.*active/i, type: ErrorTypes.LOCK_PERIOD_ACTIVE },
    { pattern: /still.*locked/i, type: ErrorTypes.LOCK_PERIOD_ACTIVE },
    { pattern: /lockperiodexpired/i, type: ErrorTypes.LOCK_PERIOD_EXPIRED },
    { pattern: /norewardstoclaim/i, type: ErrorTypes.NO_REWARDS },
    { pattern: /no.*rewards/i, type: ErrorTypes.NO_REWARDS },
    { pattern: /invalidduration/i, type: ErrorTypes.INVALID_DURATION },
    { pattern: /invalidindex/i, type: ErrorTypes.INVALID_DELEGATION_INDEX },
    
    // ─────────────────────────────────────────────────────────────────────
    // NFT POOL ERRORS
    // ─────────────────────────────────────────────────────────────────────
    { pattern: /nftnotinpool/i, type: ErrorTypes.NFT_NOT_IN_POOL },
    { pattern: /poolnotinitialized/i, type: ErrorTypes.POOL_NOT_INITIALIZED },
    { pattern: /insufficientliquidity/i, type: ErrorTypes.INSUFFICIENT_POOL_LIQUIDITY },
    { pattern: /insufficientnfts/i, type: ErrorTypes.INSUFFICIENT_POOL_LIQUIDITY },
    { pattern: /slippageexceeded/i, type: ErrorTypes.SLIPPAGE_EXCEEDED },
    { pattern: /slippage/i, type: ErrorTypes.SLIPPAGE_EXCEEDED },
    { pattern: /nftboostmismatch/i, type: ErrorTypes.NFT_BOOST_MISMATCH },
    { pattern: /notnftowner/i, type: ErrorTypes.NOT_NFT_OWNER },
    
    // ─────────────────────────────────────────────────────────────────────
    // FORTUNE ERRORS
    // ─────────────────────────────────────────────────────────────────────
    { pattern: /noactivetiers/i, type: ErrorTypes.NO_ACTIVE_TIERS },
    { pattern: /invalidguesscount/i, type: ErrorTypes.INVALID_GUESS_COUNT },
    { pattern: /invalidguessrange/i, type: ErrorTypes.INVALID_GUESS_RANGE },
    { pattern: /insufficientservicefee/i, type: ErrorTypes.INSUFFICIENT_SERVICE_FEE },
    
    // ─────────────────────────────────────────────────────────────────────
    // RENTAL ERRORS
    // ─────────────────────────────────────────────────────────────────────
    { pattern: /rentalstillactive/i, type: ErrorTypes.RENTAL_STILL_ACTIVE },
    { pattern: /nftnotlisted/i, type: ErrorTypes.NFT_NOT_LISTED },
    { pattern: /nftalreadylisted/i, type: ErrorTypes.NFT_ALREADY_LISTED },
    { pattern: /notlistingowner/i, type: ErrorTypes.NOT_LISTING_OWNER },
    { pattern: /marketplaceispaused/i, type: ErrorTypes.MARKETPLACE_PAUSED },
    
    // ─────────────────────────────────────────────────────────────────────
    // NOTARY ERRORS
    // ─────────────────────────────────────────────────────────────────────
    { pattern: /emptymetadata/i, type: ErrorTypes.EMPTY_METADATA },
];

// ============================================================================
// 5. ERROR HANDLER
// ============================================================================

export const ErrorHandler = {
    
    /**
     * Classifies an error and returns its type
     * 
     * @param {Error|Object} error - Error to classify
     * @returns {string} Error type (from ErrorTypes)
     * 
     * @example
     * const type = ErrorHandler.classify(error);
     * if (type === ErrorTypes.USER_REJECTED) {
     *     // User cancelled, don't show error
     * }
     */
    classify(error) {
        // If error was already classified by create(), use that type
        if (error?.errorType && Object.values(ErrorTypes).includes(error.errorType)) {
            return error.errorType;
        }
        
        const message = this._extractMessage(error);
        const code = error?.code || error?.error?.code;
        
        // Check specific codes first
        if (code === 4001 || code === 'ACTION_REJECTED') {
            return ErrorTypes.USER_REJECTED;
        }
        if (code === -32002) {
            return ErrorTypes.RPC_RATE_LIMITED;
        }
        
        // -32603 can be RPC error OR contract revert
        // Check if it's a contract revert (CALL_EXCEPTION) first
        if (code === -32603 || code === 'CALL_EXCEPTION') {
            // If message contains revert indicators, it's a contract error, not RPC
            if (message.includes('revert') || 
                message.includes('require') ||
                message.includes('execution failed') ||
                message.includes('call_exception') ||
                error?.code === 'CALL_EXCEPTION') {
                // Search patterns to classify the specific contract error
                for (const { pattern, type } of ErrorPatterns) {
                    if (pattern.test(message)) {
                        return type;
                    }
                }
                // Generic contract error (e.g., no rewards to claim)
                return ErrorTypes.CONTRACT_ERROR;
            }
            // True RPC error
            return ErrorTypes.RPC_UNHEALTHY;
        }
        
        // Search patterns in message
        for (const { pattern, type } of ErrorPatterns) {
            if (pattern.test(message)) {
                return type;
            }
        }
        
        return ErrorTypes.UNKNOWN;
    },

    /**
     * Extracts error message from different formats
     * @private
     * 
     * V1.2: Fixed BigInt serialization error - replaced JSON.stringify with safe version
     */
    _extractMessage(error) {
        if (!error) return '';
        if (typeof error === 'string') return error;
        
        const candidates = [
            error.message,
            error.reason,
            error.error?.message,
            error.error?.reason,
            error.data?.message,
            error.shortMessage,
            this._safeStringify(error)
        ];
        
        return candidates.filter(Boolean).join(' ').toLowerCase();
    },

    /**
     * Safely stringifies an object, handling BigInt values
     * @private
     */
    _safeStringify(obj) {
        try {
            return JSON.stringify(obj, (key, value) => {
                // Convert BigInt to string to avoid serialization error
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            });
        } catch (e) {
            // If still fails, return empty string
            return '';
        }
    },

    /**
     * Checks if error is user rejection
     * 
     * @param {Error} error - Error to check
     * @returns {boolean} true if user cancelled in MetaMask
     */
    isUserRejection(error) {
        return this.classify(error) === ErrorTypes.USER_REJECTED;
    },

    /**
     * Checks if error allows retry
     * 
     * @param {Error} error - Error to check
     * @returns {boolean} true if can retry
     */
    isRetryable(error) {
        const type = this.classify(error);
        return ErrorConfig[type]?.retry || false;
    },

    /**
     * Returns wait time before retry
     * 
     * @param {Error} error - Error to analyze
     * @returns {number} Milliseconds to wait
     */
    getWaitTime(error) {
        const type = this.classify(error);
        const config = ErrorConfig[type];
        
        if (!config) return 2000;
        
        if (config.waitMs === 'extract') {
            return this._extractWaitTime(error);
        }
        
        return config.waitMs || 2000;
    },

    /**
     * Extracts wait time from rate limit error message
     * @private
     */
    _extractWaitTime(error) {
        const message = this._extractMessage(error);
        
        // Pattern: "retrying in X.X minutes"
        const minutesMatch = message.match(/retrying in (\d+[,.]?\d*)\s*minutes?/i);
        if (minutesMatch) {
            const minutes = parseFloat(minutesMatch[1].replace(',', '.'));
            return Math.ceil(minutes * 60 * 1000) + 5000; // Add 5s margin
        }
        
        // Pattern: "wait X seconds"
        const secondsMatch = message.match(/wait (\d+)\s*seconds?/i);
        if (secondsMatch) {
            return parseInt(secondsMatch[1]) * 1000 + 2000;
        }
        
        return 30000; // Default for rate limit
    },

    /**
     * Returns user-friendly message for the error
     * 
     * @param {Error} error - Error to translate
     * @returns {string} User-friendly message
     */
    getMessage(error) {
        const type = this.classify(error);
        return ErrorMessages[type] || ErrorMessages[ErrorTypes.UNKNOWN];
    },

    /**
     * Returns error configuration
     * 
     * @param {Error} error - Error to analyze
     * @returns {Object} Configuration { layer, retry, waitMs, action }
     */
    getConfig(error) {
        const type = this.classify(error);
        return ErrorConfig[type] || ErrorConfig[ErrorTypes.UNKNOWN];
    },

    /**
     * Returns the layer where error was detected
     * 
     * @param {Error} error - Error to analyze
     * @returns {number} Layer number (1-5)
     */
    getLayer(error) {
        const type = this.classify(error);
        return ErrorConfig[type]?.layer || 5;
    },

    /**
     * Fully handles an error: classifies, logs, and returns structured info
     * 
     * @param {Error} error - Error to handle
     * @param {string} context - Context where it occurred (e.g., 'Donate')
     * @returns {Object} Structured error information
     */
    handle(error, context = 'Transaction') {
        const type = this.classify(error);
        const config = ErrorConfig[type] || {};
        const message = this.getMessage(error);
        
        // Structured log for debugging
        console.error(`[${context}] Error:`, {
            type,
            layer: config.layer,
            retry: config.retry,
            message,
            original: error
        });
        
        return {
            type,
            message,
            retry: config.retry || false,
            waitMs: config.retry ? this.getWaitTime(error) : 0,
            layer: config.layer || 5,
            action: config.action || null,
            original: error,
            context
        };
    },

    /**
     * V1.3: Handles error with automatic RPC switch for network errors
     * Imports NetworkManager dynamically to avoid circular dependency
     * 
     * @param {Error} error - Error to handle
     * @param {string} context - Context where it occurred
     * @returns {Promise<Object>} Structured error information + rpcSwitched flag
     */
    async handleWithRpcSwitch(error, context = 'Transaction') {
        const result = this.handle(error, context);
        
        // If action is switch_rpc, do it automatically
        if (result.action === 'switch_rpc') {
            try {
                // Dynamic import to avoid circular dependency
                const { NetworkManager } = await import('./network-manager.js');
                
                console.log('[ErrorHandler] Switching RPC due to network error...');
                const newRpc = NetworkManager.switchToNextRpc();
                
                // Try to update MetaMask too
                try {
                    await NetworkManager.updateMetaMaskRpcs();
                    console.log('[ErrorHandler] MetaMask RPC updated');
                } catch (e) {
                    console.warn('[ErrorHandler] Could not update MetaMask:', e.message);
                }
                
                result.rpcSwitched = true;
                result.newRpc = newRpc;
                
                // Reduce wait time since we switched RPC
                result.waitMs = Math.min(result.waitMs, 2000);
                
            } catch (e) {
                console.warn('[ErrorHandler] Could not switch RPC:', e.message);
                result.rpcSwitched = false;
            }
        }
        
        return result;
    },

    /**
     * Parses simulation error (estimateGas) to readable message
     * 
     * @param {Error} error - Error from estimateGas
     * @param {string} methodName - Name of the method that failed
     * @returns {Object} Structured error
     */
    parseSimulationError(error, methodName) {
        const type = this.classify(error);
        let message = this.getMessage(error);
        
        // Method-specific messages for better UX
        const methodMessages = {
            'donate': {
                [ErrorTypes.CAMPAIGN_NOT_ACTIVE]: 'This campaign has ended and is no longer accepting donations',
                [ErrorTypes.DONATION_TOO_SMALL]: 'Minimum donation is 1 BKC'
            },
            'delegate': {
                [ErrorTypes.INVALID_DURATION]: 'Lock period must be between 1 day and 10 years'
            },
            'playGame': {
                [ErrorTypes.INVALID_GUESS_RANGE]: 'Your guess must be within the valid range for this tier'
            },
            'withdraw': {
                [ErrorTypes.CAMPAIGN_STILL_ACTIVE]: 'You can withdraw after the campaign deadline'
            },
            'unstake': {
                [ErrorTypes.LOCK_PERIOD_ACTIVE]: 'Your tokens are still locked. Use force unstake to withdraw early (penalty applies)'
            },
            'claimRewards': {
                [ErrorTypes.CONTRACT_ERROR]: 'No rewards available to claim',
                [ErrorTypes.NO_REWARDS]: 'No rewards available to claim'
            }
        };
        
        const customMessage = methodMessages[methodName]?.[type];
        if (customMessage) {
            message = customMessage;
        }
        
        return {
            type,
            message,
            original: error,
            method: methodName,
            isSimulation: true
        };
    },

    /**
     * Creates a structured error for throwing
     * 
     * @param {string} type - Error type (from ErrorTypes)
     * @param {Object} [extra] - Extra data
     * @returns {Error} Error with type attached
     */
    create(type, extra = {}) {
        const message = ErrorMessages[type] || 'An error occurred';
        const error = new Error(message);
        error.errorType = type;
        error.extra = extra;
        return error;
    },

    /**
     * Checks if error requires special action
     * 
     * @param {Error} error - Error to check
     * @returns {string|null} Action to take or null
     */
    getAction(error) {
        const type = this.classify(error);
        return ErrorConfig[type]?.action || null;
    }
};

// ============================================================================
// 6. EXPORT
// ============================================================================