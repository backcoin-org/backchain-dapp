// modules/transactions/staking-tx.js
// ✅ PRODUCTION V1.3 - FIXED: Correct ABI matching DelegationManager contract
// 
// CHANGES V1.3:
// - Fixed delegate() to use 3 parameters (amount, lockDuration, boosterTokenId)
// - Fixed forceUnstake() to use 2 parameters (delegationIndex, boosterTokenId)
// - Fixed claimReward() - singular with boosterTokenId parameter
// - Fixed getDelegationsOf() return struct to match contract
// - Fixed constant names (MIN_LOCK_DURATION, earlyUnstakePenaltyBips)
// - Removed window.ENV fallbacks (not needed, addresses come from config.js)
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - delegate: Stake tokens with a lock period
// - unstake: Unstake tokens after lock period ends
// - forceUnstake: Unstake early with penalty
// - claimRewards: Claim accumulated rewards
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Get contract addresses dynamically from config.js
 * Addresses are loaded from deployment-addresses.json at app init
 */
function getContracts() {
    const delegationManager = addresses?.delegationManager || 
                              contractAddresses?.delegationManager ||
                              window.contractAddresses?.delegationManager;
    
    const bkcToken = addresses?.bkcToken || 
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;
    
    if (!delegationManager) {
        console.error('❌ DelegationManager address not found!', {
            addresses,
            contractAddresses,
            windowContractAddresses: window.contractAddresses
        });
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
 * DelegationManager ABI - CORRECTED to match actual contract
 */
const DELEGATION_ABI = [
    // Write functions - FIXED: correct signatures
    'function delegate(uint256 amount, uint256 lockDuration, uint256 boosterTokenId) external',
    'function unstake(uint256 delegationIndex) external',
    'function forceUnstake(uint256 delegationIndex, uint256 boosterTokenId) external',
    'function claimReward(uint256 boosterTokenId) external',
    
    // Read functions - FIXED: correct names and return types
    'function getDelegationsOf(address user) view returns (tuple(uint256 amount, uint64 unlockTime, uint64 lockDuration)[])',
    'function pendingRewards(address user) view returns (uint256)',
    'function userTotalPStake(address user) view returns (uint256)',
    'function totalPStake() view returns (uint256)',
    'function earlyUnstakePenaltyBips() view returns (uint256)',
    'function MIN_LOCK_DURATION() view returns (uint256)',
    'function MAX_LOCK_DURATION() view returns (uint256)',
    
    // Events
    'event Delegated(address indexed user, uint256 amount, uint256 lockDuration, uint256 pStakeAmount)',
    'event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount)',
    'event ForceUnstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 penalty)',
    'event RewardClaimed(address indexed user, uint256 amount)'
];

/**
 * BKC Token ABI - for approvals
 */
const BKC_ABI = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)'
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
 * @param {number} [params.boosterTokenId=0] - Booster NFT token ID (0 = no booster)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function delegate({
    amount,
    lockDays,
    lockDuration,
    boosterTokenId = 0,
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
    const boosterId = BigInt(boosterTokenId || 0);

    return await txEngine.execute({
        name: 'Delegate',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        method: 'delegate',
        // FIXED: 3 parameters - amount, lockDuration, boosterTokenId
        args: [stakeAmount, lockPeriod, boosterId],
        
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
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function unstake({
    delegationIndex,
    button = null,
    onSuccess = null,
    onError = null
}) {
    ValidationLayer.staking.validateUnstake({ delegationIndex });

    return await txEngine.execute({
        name: 'Unstake',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        method: 'unstake',
        args: [delegationIndex],
        
        // Custom validation: check lock period ended
        validate: async (signer, userAddress) => {
            const contract = getDelegationContract(signer);
            const delegations = await contract.getDelegationsOf(userAddress);
            
            if (delegationIndex >= delegations.length) {
                throw new Error('Delegation not found');
            }
            
            const delegation = delegations[delegationIndex];
            const now = Math.floor(Date.now() / 1000);
            
            // FIXED: using unlockTime instead of lockEnd
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
 * @param {number} [params.boosterTokenId=0] - Booster NFT token ID (0 = no booster)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function forceUnstake({
    delegationIndex,
    boosterTokenId = 0,
    button = null,
    onSuccess = null,
    onError = null
}) {
    ValidationLayer.staking.validateUnstake({ delegationIndex });

    const boosterId = BigInt(boosterTokenId || 0);

    return await txEngine.execute({
        name: 'ForceUnstake',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        method: 'forceUnstake',
        // FIXED: 2 parameters - delegationIndex, boosterTokenId
        args: [delegationIndex, boosterId],
        
        // Custom validation: check delegation exists and is still locked
        validate: async (signer, userAddress) => {
            const contract = getDelegationContract(signer);
            const delegations = await contract.getDelegationsOf(userAddress);
            
            if (delegationIndex >= delegations.length) {
                throw new Error('Delegation not found');
            }
            
            const delegation = delegations[delegationIndex];
            const now = Math.floor(Date.now() / 1000);
            
            // Check if already unlocked (should use normal unstake)
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
 * @param {number} [params.boosterTokenId=0] - Booster NFT token ID (0 = no booster)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function claimRewards({
    boosterTokenId = 0,
    button = null,
    onSuccess = null,
    onError = null
} = {}) {
    const boosterId = BigInt(boosterTokenId || 0);

    return await txEngine.execute({
        name: 'ClaimRewards',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        // FIXED: claimReward (singular) with boosterTokenId
        method: 'claimReward',
        args: [boosterId],
        
        // Custom validation: check user has rewards
        validate: async (signer, userAddress) => {
            const contract = getDelegationContract(signer);
            const rewards = await contract.pendingRewards(userAddress);
            
            if (rewards <= 0n) {
                throw new Error('No rewards available to claim');
            }
        },
        
        onSuccess,
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS (Helpers)
// ============================================================================

/**
 * Gets user's delegations
 * @param {string} userAddress - User address
 * @returns {Promise<Array>} Array of delegation objects
 */
export async function getUserDelegations(userAddress) {
    const contract = await getDelegationContractReadOnly();
    const delegations = await contract.getDelegationsOf(userAddress);
    const now = Math.floor(Date.now() / 1000);
    
    return delegations.map((d, index) => ({
        index,
        amount: d.amount,
        // FIXED: using correct field names from contract
        unlockTime: Number(d.unlockTime),
        lockDuration: Number(d.lockDuration),
        // Computed
        isUnlocked: Number(d.unlockTime) <= now,
        daysRemaining: Number(d.unlockTime) > now 
            ? Math.ceil((Number(d.unlockTime) - now) / 86400)
            : 0
    }));
}

/**
 * Gets user's pending rewards
 * @param {string} userAddress - User address
 * @returns {Promise<bigint>} Pending rewards in wei
 */
export async function getPendingRewards(userAddress) {
    const contract = await getDelegationContractReadOnly();
    return await contract.pendingRewards(userAddress);
}

/**
 * Gets user's total pStake
 * @param {string} userAddress - User address
 * @returns {Promise<bigint>} User's pStake
 */
export async function getUserPStake(userAddress) {
    const contract = await getDelegationContractReadOnly();
    return await contract.userTotalPStake(userAddress);
}

/**
 * Gets network total pStake
 * @returns {Promise<bigint>} Total pStake
 */
export async function getTotalPStake() {
    const contract = await getDelegationContractReadOnly();
    return await contract.totalPStake();
}

/**
 * Gets early unstake penalty percentage
 * @returns {Promise<number>} Penalty percentage (e.g., 10 for 10%)
 */
export async function getEarlyUnstakePenalty() {
    const contract = await getDelegationContractReadOnly();
    // FIXED: correct function name
    const penaltyBips = await contract.earlyUnstakePenaltyBips();
    return Number(penaltyBips) / 100; // Convert bips to percentage
}

/**
 * Gets staking configuration
 * @returns {Promise<Object>} Config with min/max lock periods and penalty
 */
export async function getStakingConfig() {
    const contract = await getDelegationContractReadOnly();
    
    // FIXED: correct constant names
    const [minLock, maxLock, penaltyBips] = await Promise.all([
        contract.MIN_LOCK_DURATION(),
        contract.MAX_LOCK_DURATION(),
        contract.earlyUnstakePenaltyBips()
    ]);
    
    return {
        minLockDays: Number(minLock) / 86400,
        maxLockDays: Number(maxLock) / 86400,
        minLockSeconds: Number(minLock),
        maxLockSeconds: Number(maxLock),
        penaltyPercent: Number(penaltyBips) / 100,
        penaltyBips: Number(penaltyBips)
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