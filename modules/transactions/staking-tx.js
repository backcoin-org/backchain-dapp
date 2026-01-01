// modules/js/transactions/staking-tx.js
// ✅ PRODUCTION V1.0 - Staking/Delegation Transaction Handlers
// 
// This module provides transaction functions for the DelegationManager contract.
// Each function uses the transaction engine for proper validation and execution.
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - delegate: Stake tokens with a lock period
// - unstake: Unstake tokens after lock period ends
// - forceUnstake: Unstake early with penalty
// - claimRewards: Claim accumulated rewards
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Contract addresses
 */
const CONTRACTS = {
    BKC_TOKEN: window.ENV?.BKC_TOKEN_ADDRESS || '0x5c6d3a63F8A41F4dB91EBA04eA9B39AC2a6d8d79',
    DELEGATION_MANAGER: window.ENV?.DELEGATION_MANAGER_ADDRESS || '0xYourDelegationManagerAddress'
};

/**
 * DelegationManager ABI - only methods we need
 */
const DELEGATION_ABI = [
    // Write functions
    'function delegate(uint256 amount, uint256 lockPeriod) external',
    'function unstake(uint256 delegationIndex) external',
    'function forceUnstake(uint256 delegationIndex) external',
    'function claimRewards() external',
    
    // Read functions
    'function getUserDelegations(address user) view returns (tuple(uint256 amount, uint256 lockEnd, uint256 pStakeAmount, bool active)[])',
    'function pendingRewards(address user) view returns (uint256)',
    'function getUserPStake(address user) view returns (uint256)',
    'function totalPStake() view returns (uint256)',
    'function earlyUnstakePenalty() view returns (uint256)',
    'function minLockPeriod() view returns (uint256)',
    'function maxLockPeriod() view returns (uint256)',
    
    // Events
    'event Delegated(address indexed user, uint256 amount, uint256 lockPeriod, uint256 pStakeAmount)',
    'event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount)',
    'event ForceUnstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 penalty)',
    'event RewardsClaimed(address indexed user, uint256 amount)'
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
    return new ethers.Contract(CONTRACTS.DELEGATION_MANAGER, DELEGATION_ABI, signer);
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
 * @param {number} params.lockDays - Lock period in days (1-3650)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 * 
 * @example
 * const result = await StakingTx.delegate({
 *     amount: ethers.parseEther('1000'),
 *     lockDays: 30,
 *     button: document.getElementById('stakeBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('Tokens staked!');
 *         updateStakingInfo();
 *     }
 * });
 */
export async function delegate({
    amount,
    lockDays,
    button = null,
    onSuccess = null,
    onError = null
}) {
    // Validate inputs
    ValidationLayer.staking.validateDelegate({ amount, lockDays });

    const stakeAmount = BigInt(amount);
    const lockPeriod = daysToSeconds(lockDays);

    return await txEngine.execute({
        name: 'Delegate',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        method: 'delegate',
        args: [stakeAmount, lockPeriod],
        
        // Token approval config
        approval: {
            token: CONTRACTS.BKC_TOKEN,
            spender: CONTRACTS.DELEGATION_MANAGER,
            amount: stakeAmount
        },
        
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
 * 
 * @example
 * const result = await StakingTx.unstake({
 *     delegationIndex: 0,
 *     button: document.getElementById('unstakeBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('Tokens unstaked!');
 *         updateStakingInfo();
 *     }
 * });
 */
export async function unstake({
    delegationIndex,
    button = null,
    onSuccess = null,
    onError = null
}) {
    // Validate inputs
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
            const delegations = await contract.getUserDelegations(userAddress);
            
            if (delegationIndex >= delegations.length) {
                throw new Error('Delegation not found');
            }
            
            const delegation = delegations[delegationIndex];
            
            if (!delegation.active) {
                throw new Error('This delegation is no longer active');
            }
            
            const now = Math.floor(Date.now() / 1000);
            if (delegation.lockEnd > now) {
                const daysLeft = Math.ceil((Number(delegation.lockEnd) - now) / 86400);
                throw new Error(`Lock period still active. ${daysLeft} days remaining. Use Force Unstake to withdraw early with penalty.`);
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
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 * 
 * @example
 * const result = await StakingTx.forceUnstake({
 *     delegationIndex: 0,
 *     button: document.getElementById('forceUnstakeBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('Tokens withdrawn with penalty applied');
 *         updateStakingInfo();
 *     }
 * });
 */
export async function forceUnstake({
    delegationIndex,
    button = null,
    onSuccess = null,
    onError = null
}) {
    // Validate inputs
    ValidationLayer.staking.validateUnstake({ delegationIndex });

    return await txEngine.execute({
        name: 'ForceUnstake',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        method: 'forceUnstake',
        args: [delegationIndex],
        
        // Custom validation: check delegation exists and is active
        validate: async (signer, userAddress) => {
            const contract = getDelegationContract(signer);
            const delegations = await contract.getUserDelegations(userAddress);
            
            if (delegationIndex >= delegations.length) {
                throw new Error('Delegation not found');
            }
            
            const delegation = delegations[delegationIndex];
            
            if (!delegation.active) {
                throw new Error('This delegation is no longer active');
            }
            
            // Check if lock already ended (should use normal unstake)
            const now = Math.floor(Date.now() / 1000);
            if (delegation.lockEnd <= now) {
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
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 * 
 * @example
 * const result = await StakingTx.claimRewards({
 *     button: document.getElementById('claimBtn'),
 *     onSuccess: (receipt) => {
 *         showToast('Rewards claimed!');
 *         updateRewardsDisplay();
 *     }
 * });
 */
export async function claimRewards({
    button = null,
    onSuccess = null,
    onError = null
} = {}) {
    return await txEngine.execute({
        name: 'ClaimRewards',
        button,
        
        getContract: async (signer) => getDelegationContract(signer),
        method: 'claimRewards',
        args: [],
        
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
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.DELEGATION_MANAGER, DELEGATION_ABI, provider);
    
    const delegations = await contract.getUserDelegations(userAddress);
    const now = Math.floor(Date.now() / 1000);
    
    return delegations.map((d, index) => ({
        index,
        amount: d.amount,
        lockEnd: d.lockEnd,
        pStakeAmount: d.pStakeAmount,
        active: d.active,
        // Computed
        isUnlocked: Number(d.lockEnd) <= now,
        daysRemaining: d.active && Number(d.lockEnd) > now 
            ? Math.ceil((Number(d.lockEnd) - now) / 86400)
            : 0
    }));
}

/**
 * Gets user's pending rewards
 * @param {string} userAddress - User address
 * @returns {Promise<bigint>} Pending rewards in wei
 */
export async function getPendingRewards(userAddress) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.DELEGATION_MANAGER, DELEGATION_ABI, provider);
    
    return await contract.pendingRewards(userAddress);
}

/**
 * Gets user's total pStake
 * @param {string} userAddress - User address
 * @returns {Promise<bigint>} User's pStake
 */
export async function getUserPStake(userAddress) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.DELEGATION_MANAGER, DELEGATION_ABI, provider);
    
    return await contract.getUserPStake(userAddress);
}

/**
 * Gets network total pStake
 * @returns {Promise<bigint>} Total pStake
 */
export async function getTotalPStake() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.DELEGATION_MANAGER, DELEGATION_ABI, provider);
    
    return await contract.totalPStake();
}

/**
 * Gets early unstake penalty percentage
 * @returns {Promise<number>} Penalty percentage (e.g., 10 for 10%)
 */
export async function getEarlyUnstakePenalty() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.DELEGATION_MANAGER, DELEGATION_ABI, provider);
    
    return Number(await contract.earlyUnstakePenalty());
}

/**
 * Gets staking configuration
 * @returns {Promise<Object>} Config with min/max lock periods and penalty
 */
export async function getStakingConfig() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.DELEGATION_MANAGER, DELEGATION_ABI, provider);
    
    const [minLock, maxLock, penalty] = await Promise.all([
        contract.minLockPeriod(),
        contract.maxLockPeriod(),
        contract.earlyUnstakePenalty()
    ]);
    
    return {
        minLockDays: Number(minLock) / 86400,
        maxLockDays: Number(maxLock) / 86400,
        penaltyPercent: Number(penalty)
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