// modules/js/transactions/staking-tx.js
// ✅ PRODUCTION V2.0 - Added Operator Support
// 
// CHANGES V2.0:
// - Added operator parameter to all write functions
// - Uses resolveOperator() for hybrid system
// - ABI updated for contracts with operator support
// - Backwards compatible (operator is optional)
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - delegate: Stake tokens with a lock period
// - unstake: Unstake tokens after lock period ends
// - forceUnstake: Unstake early with penalty
// - claimRewards: Claim accumulated rewards
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Get contract addresses dynamically from config.js
 */
function getContracts() {
    const delegationManager = addresses?.delegationManager || 
                              contractAddresses?.delegationManager ||
                              window.contractAddresses?.delegationManager;
    
    const bkcToken = addresses?.bkcToken || 
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;
    
    if (!delegationManager) {
        console.error('❌ DelegationManager address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    if (!bkcToken) {
        console.error('❌ BKC Token address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    return {
        BKC_TOKEN: bkcToken,
        DELEGATION_MANAGER: delegationManager
    };
}

/**
 * DelegationManager ABI - V2 with operator support
 */
const DELEGATION_ABI = [
    // Write functions with operator
    'function delegate(uint256 amount, uint256 lockDuration, address operator) external',
    'function unstake(uint256 delegationIndex, address operator) external',
    'function forceUnstake(uint256 delegationIndex, address operator) external',
    'function claimReward(address operator) external payable',

    // Read functions
    'function getDelegationsOf(address user) view returns (tuple(uint256 amount, uint64 unlockTime, uint64 lockDuration)[])',
    'function pendingRewards(address user) view returns (uint256)',
    'function userTotalPStake(address user) view returns (uint256)',
    'function totalNetworkPStake() view returns (uint256)',
    'function MIN_LOCK_DURATION() view returns (uint256)',
    'function MAX_LOCK_DURATION() view returns (uint256)',
    'function claimEthFee() view returns (uint256)',

    // V6: NFT Boost & Preview
    'function getUserBestBoost(address user) view returns (uint256)',
    'function getBurnRateForBoost(uint256 boost) view returns (uint256)',
    'function previewClaim(address user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 userReceives, uint256 burnRateBips, uint256 nftBoost)',

    // Events (matching deployed contract)
    'event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 feePaid, address operator)',
    'event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReceived, uint256 feePaid, address operator)',
    'event RewardClaimed(address indexed user, uint256 amountReceived, uint256 burnedAmount, uint256 ethFeePaid, uint256 nftBoostUsed, address operator)'
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates DelegationManager contract instance
 */
function getDelegationContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.DELEGATION_MANAGER, DELEGATION_ABI, signer);
}

/**
 * Creates DelegationManager contract instance with provider (read-only)
 */
async function getDelegationContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.DELEGATION_MANAGER, DELEGATION_ABI, provider);
}

/**
 * Converts days to seconds
 */
function daysToSeconds(days) {
    return BigInt(days) * 24n * 60n * 60n;
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Delegates (stakes) tokens with a lock period
 * 
 * @param {Object} params - Delegation parameters
 * @param {string|bigint} params.amount - Amount to stake (wei)
 * @param {number} [params.lockDays] - Lock period in days (1-3650)
 * @param {number} [params.lockDuration] - Lock period in seconds (alternative)
 * @param {string} [params.operator] - Operator address (optional - uses default if not provided)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function delegate({
    amount,
    lockDays,
    lockDuration,
    operator,  // NEW: operator parameter
    button = null,
    onSuccess = null,
    onError = null
}) {
    // Support both lockDays and lockDuration (seconds)
    let lockPeriod;
    if (lockDuration !== undefined && lockDuration !== null) {
        lockPeriod = BigInt(lockDuration);
        const approxDays = Number(lockPeriod) / 86400;
        if (approxDays < 1 || approxDays > 3650) {
            throw new Error('Lock duration must be between 1 and 3650 days');
        }
    } else if (lockDays !== undefined && lockDays !== null) {
        ValidationLayer.staking.validateDelegate({ amount, lockDays });
        lockPeriod = daysToSeconds(lockDays);
    } else {
        throw new Error('Either lockDays or lockDuration must be provided');
    }

    const stakeAmount = BigInt(amount);
    
    // Store for args function
    let storedOperator = operator;

    return await txEngine.execute({
        name: 'Delegate',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        method: 'delegate',
        // Args as function - operator resolved at execution time
        args: () => [stakeAmount, lockPeriod, resolveOperator(storedOperator)],
        
        // Token approval config
        approval: (() => {
            const contracts = getContracts();
            return {
                token: contracts.BKC_TOKEN,
                spender: contracts.DELEGATION_MANAGER,
                amount: stakeAmount
            };
        })(),
        
        onSuccess,
        onError
    });
}

/**
 * Unstakes tokens after lock period has ended
 * 
 * @param {Object} params - Unstake parameters
 * @param {number} params.delegationIndex - Index of the delegation to unstake
 * @param {string} [params.operator] - Operator address (optional)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function unstake({
    delegationIndex,
    operator,  // NEW
    button = null,
    onSuccess = null,
    onError = null
}) {
    ValidationLayer.staking.validateUnstake({ delegationIndex });

    let storedIndex = delegationIndex;
    let storedOperator = operator;

    return await txEngine.execute({
        name: 'Unstake',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        method: 'unstake',
        args: () => [storedIndex, resolveOperator(storedOperator)],
        
        // Custom validation: check lock period ended
        validate: async (signer, userAddress) => {
            const contract = getDelegationContract(signer);
            const delegations = await contract.getDelegationsOf(userAddress);
            
            if (storedIndex >= delegations.length) {
                throw new Error('Delegation not found');
            }
            
            const delegation = delegations[storedIndex];
            const now = Math.floor(Date.now() / 1000);
            
            if (Number(delegation.unlockTime) > now) {
                const daysRemaining = Math.ceil((Number(delegation.unlockTime) - now) / 86400);
                throw new Error(`Lock period still active. ${daysRemaining} day(s) remaining. Use Force Unstake if needed.`);
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Force unstakes tokens before lock period ends (with penalty)
 * 
 * @param {Object} params - Force unstake parameters
 * @param {number} params.delegationIndex - Index of the delegation to unstake
 * @param {string} [params.operator] - Operator address (optional)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function forceUnstake({
    delegationIndex,
    operator,  // NEW
    button = null,
    onSuccess = null,
    onError = null
}) {
    ValidationLayer.staking.validateUnstake({ delegationIndex });

    let storedIndex = delegationIndex;
    let storedOperator = operator;

    return await txEngine.execute({
        name: 'ForceUnstake',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        method: 'forceUnstake',
        args: () => [storedIndex, resolveOperator(storedOperator)],
        
        // Custom validation
        validate: async (signer, userAddress) => {
            const contract = getDelegationContract(signer);
            const delegations = await contract.getDelegationsOf(userAddress);
            
            if (storedIndex >= delegations.length) {
                throw new Error('Delegation not found');
            }
            
            const delegation = delegations[storedIndex];
            const now = Math.floor(Date.now() / 1000);
            
            if (Number(delegation.unlockTime) <= now) {
                throw new Error('Lock period has ended. Use normal Unstake to avoid penalty.');
            }
        },
        
        onSuccess,
        onError
    });
}

/**
 * Claims accumulated staking rewards
 * 
 * @param {Object} params - Claim parameters
 * @param {string} [params.operator] - Operator address (optional)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function claimRewards({
    operator,  // NEW
    button = null,
    onSuccess = null,
    onError = null
} = {}) {
    let storedOperator = operator;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'ClaimReward',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        method: 'claimReward',
        args: () => [resolveOperator(storedOperator)],
        
        // ETH fee for claim
        get value() { return ethFee; },
        
        // Custom validation: check user has rewards
        validate: async (signer, userAddress) => {
            const contract = getDelegationContract(signer);
            
            // Get rewards
            const rewards = await contract.pendingRewards(userAddress);
            if (rewards <= 0n) {
                throw new Error('No rewards available to claim');
            }
            
            // Get ETH fee
            try {
                ethFee = await contract.claimEthFee();
            } catch {
                ethFee = 0n;
            }
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS (Helpers) - Unchanged
// ============================================================================

/**
 * Gets user's delegations
 */
export async function getUserDelegations(userAddress) {
    const contract = await getDelegationContractReadOnly();
    const delegations = await contract.getDelegationsOf(userAddress);
    const now = Math.floor(Date.now() / 1000);
    
    return delegations.map((d, index) => ({
        index,
        amount: d.amount,
        unlockTime: Number(d.unlockTime),
        lockDuration: Number(d.lockDuration),
        isUnlocked: Number(d.unlockTime) <= now,
        daysRemaining: Number(d.unlockTime) > now 
            ? Math.ceil((Number(d.unlockTime) - now) / 86400)
            : 0
    }));
}

/**
 * Gets user's pending rewards
 */
export async function getPendingRewards(userAddress) {
    const contract = await getDelegationContractReadOnly();
    return await contract.pendingRewards(userAddress);
}

/**
 * Gets user's total pStake
 */
export async function getUserPStake(userAddress) {
    const contract = await getDelegationContractReadOnly();
    return await contract.userTotalPStake(userAddress);
}

/**
 * Gets network total pStake
 */
export async function getTotalPStake() {
    const contract = await getDelegationContractReadOnly();
    return await contract.totalNetworkPStake();
}

/**
 * Gets early unstake penalty percentage
 * Note: Penalty is configured in EcosystemManager (FORCE_UNSTAKE_PENALTY_KEY), not DelegationManager
 */
export async function getEarlyUnstakePenalty() {
    // Penalty bips are managed by EcosystemManager, default is 5000 (50%)
    return 50;
}

/**
 * Gets staking configuration
 */
export async function getStakingConfig() {
    const contract = await getDelegationContractReadOnly();

    const [minLock, maxLock] = await Promise.all([
        contract.MIN_LOCK_DURATION(),
        contract.MAX_LOCK_DURATION()
    ]);

    return {
        minLockDays: Number(minLock) / 86400,
        maxLockDays: Number(maxLock) / 86400,
        minLockSeconds: Number(minLock),
        maxLockSeconds: Number(maxLock),
        penaltyPercent: 50,   // Managed by EcosystemManager (5000 bips default)
        penaltyBips: 5000
    };
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const StakingTx = {
    delegate,
    unstake,
    forceUnstake,
    claimRewards,
    // Read helpers
    getUserDelegations,
    getPendingRewards,
    getUserPStake,
    getTotalPStake,
    getEarlyUnstakePenalty,
    getStakingConfig
};

export default StakingTx;