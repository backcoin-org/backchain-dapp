// modules/js/transactions/staking-tx.js
// ✅ V9.0 - Updated for StakingPool V9 (MasterChef-style rewards)
//
// CHANGES V9.0:
// - Renamed: DelegationManager → StakingPool
// - delegate() now takes lockDays (not seconds), payable ETH fee
// - unstake() no longer takes operator param
// - forceUnstake() is now payable (ETH fee via ecosystem)
// - claimReward() → claimRewards() (renamed)
// - ETH fee from ecosystem.calculateFee, not claimEthFee()
// - getDelegationsOf returns new struct (lockEnd, lockDays, pStake, rewardDebt)
// - previewClaim returns 6-tuple (added referrerCut)
// - totalNetworkPStake → totalPStake
// - MIN_LOCK_DURATION/MAX_LOCK_DURATION → MIN_LOCK_DAYS/MAX_LOCK_DAYS
// - Added getUserSummary, getStakingStats
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - delegate: Stake tokens with a lock period
// - unstake: Unstake tokens after lock period ends
// - forceUnstake: Unstake early with penalty (ETH fee)
// - claimRewards: Claim accumulated rewards (ETH fee)
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

function getContracts() {
    const stakingPool = addresses?.stakingPool ||
                        contractAddresses?.stakingPool ||
                        window.contractAddresses?.stakingPool;

    const bkcToken = addresses?.bkcToken ||
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;

    if (!stakingPool) {
        console.error('❌ StakingPool address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }

    if (!bkcToken) {
        console.error('❌ BKC Token address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }

    return {
        BKC_TOKEN: bkcToken,
        STAKING_POOL: stakingPool
    };
}

/**
 * StakingPool V9 ABI
 */
const STAKING_ABI = [
    // Write functions
    'function delegate(uint256 amount, uint256 lockDays, address operator) external payable',
    'function unstake(uint256 index) external',
    'function forceUnstake(uint256 index, address operator) external payable',
    'function claimRewards(address operator) external payable',

    // Read functions - Rewards
    'function pendingRewards(address user) view returns (uint256)',
    'function previewClaim(address user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 referrerCut, uint256 userReceives, uint256 burnRateBps, uint256 nftBoost)',

    // Read functions - Delegations
    'function getDelegationsOf(address user) view returns (tuple(uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt)[])',
    'function getDelegation(address user, uint256 index) view returns (uint256 amount, uint256 pStake, uint256 lockEnd, uint256 lockDays, uint256 pendingReward)',
    'function delegationCount(address user) view returns (uint256)',

    // Read functions - Stake
    'function userTotalPStake(address user) view returns (uint256)',
    'function totalPStake() view returns (uint256)',

    // Read functions - Config
    'function MIN_LOCK_DAYS() view returns (uint256)',
    'function MAX_LOCK_DAYS() view returns (uint256)',
    'function forceUnstakePenaltyBps() view returns (uint256)',

    // Read functions - NFT Boost
    'function getUserBestBoost(address user) view returns (uint256)',
    'function getBurnRateForBoost(uint256 boostBps) view returns (uint256)',
    'function getTierName(uint256 boostBps) view returns (string)',

    // Read functions - Stats
    'function getUserSummary(address user) view returns (uint256 userTotalPStake, uint256 delegationCount, uint256 savedRewards, uint256 totalPending, uint256 nftBoost, uint256 burnRateBps)',
    'function getStakingStats() view returns (uint256 totalPStake, uint256 totalBkcDelegated, uint256 totalRewardsDistributed, uint256 totalBurnedOnClaim, uint256 totalForceUnstakePenalties, uint256 totalEthFeesCollected, uint256 accRewardPerShare)',

    // Events
    'event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)',
    'event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amount)',
    'event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 burned, uint256 referrerCut, uint256 userReceived, uint256 nftBoost, address operator)'
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function getStakingContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.STAKING_POOL, STAKING_ABI, signer);
}

async function getStakingContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.STAKING_POOL, STAKING_ABI, provider);
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Delegates (stakes) tokens with a lock period
 * V9: lockDays is in days (not seconds), delegate is payable (ETH fee optional)
 */
export async function delegate({
    amount,
    lockDays,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    if (lockDays === undefined || lockDays === null) {
        throw new Error('lockDays must be provided');
    }

    const days = Number(lockDays);
    if (days < 1 || days > 3650) {
        throw new Error('Lock duration must be between 1 and 3650 days');
    }

    const stakeAmount = BigInt(amount);
    let storedOperator = operator;

    return await txEngine.execute({
        name: 'Delegate',
        button,

        getContract: async (signer) => getStakingContract(signer),
        method: 'delegate',
        args: () => [stakeAmount, BigInt(days), resolveOperator(storedOperator)],

        // Token approval config
        approval: (() => {
            const contracts = getContracts();
            return {
                token: contracts.BKC_TOKEN,
                spender: contracts.STAKING_POOL,
                amount: stakeAmount
            };
        })(),

        onSuccess,
        onError
    });
}

/**
 * Unstakes tokens after lock period has ended
 * V9: No operator parameter
 */
export async function unstake({
    delegationIndex,
    button = null,
    onSuccess = null,
    onError = null
}) {
    ValidationLayer.staking.validateUnstake({ delegationIndex });

    let storedIndex = delegationIndex;

    return await txEngine.execute({
        name: 'Unstake',
        button,

        getContract: async (signer) => getStakingContract(signer),
        method: 'unstake',
        args: [storedIndex],

        validate: async (signer, userAddress) => {
            const contract = getStakingContract(signer);
            const delegations = await contract.getDelegationsOf(userAddress);

            if (storedIndex >= delegations.length) {
                throw new Error('Delegation not found');
            }

            const delegation = delegations[storedIndex];
            const now = Math.floor(Date.now() / 1000);

            if (Number(delegation.lockEnd) > now) {
                const daysRemaining = Math.ceil((Number(delegation.lockEnd) - now) / 86400);
                throw new Error(`Lock period still active. ${daysRemaining} day(s) remaining. Use Force Unstake if needed.`);
            }
        },

        onSuccess,
        onError
    });
}

/**
 * Force unstakes tokens before lock period ends (with penalty)
 * V9: Payable — ETH fee via ecosystem
 */
export async function forceUnstake({
    delegationIndex,
    operator,
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

        getContract: async (signer) => getStakingContract(signer),
        method: 'forceUnstake',
        args: () => [storedIndex, resolveOperator(storedOperator)],

        validate: async (signer, userAddress) => {
            const contract = getStakingContract(signer);
            const delegations = await contract.getDelegationsOf(userAddress);

            if (storedIndex >= delegations.length) {
                throw new Error('Delegation not found');
            }

            const delegation = delegations[storedIndex];
            const now = Math.floor(Date.now() / 1000);

            if (Number(delegation.lockEnd) <= now) {
                throw new Error('Lock period has ended. Use normal Unstake to avoid penalty.');
            }
        },

        onSuccess,
        onError
    });
}

/**
 * Claims accumulated staking rewards
 * V9: claimRewards (not claimReward), ETH fee via ecosystem
 */
export async function claimRewards({
    operator,
    button = null,
    onSuccess = null,
    onError = null
} = {}) {
    let storedOperator = operator;

    return await txEngine.execute({
        name: 'ClaimRewards',
        button,

        getContract: async (signer) => getStakingContract(signer),
        method: 'claimRewards',
        args: () => [resolveOperator(storedOperator)],

        validate: async (signer, userAddress) => {
            const contract = getStakingContract(signer);
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
// 4. READ FUNCTIONS
// ============================================================================

/**
 * Gets user's delegations
 * V9: New struct with lockEnd, lockDays (in days), pStake, rewardDebt
 */
export async function getUserDelegations(userAddress) {
    const contract = await getStakingContractReadOnly();
    const delegations = await contract.getDelegationsOf(userAddress);
    const now = Math.floor(Date.now() / 1000);

    return delegations.map((d, index) => ({
        index,
        amount: d.amount,
        pStake: d.pStake,
        lockEnd: Number(d.lockEnd),
        lockDays: Number(d.lockDays),
        isUnlocked: Number(d.lockEnd) <= now,
        daysRemaining: Number(d.lockEnd) > now
            ? Math.ceil((Number(d.lockEnd) - now) / 86400)
            : 0
    }));
}

export async function getPendingRewards(userAddress) {
    const contract = await getStakingContractReadOnly();
    return await contract.pendingRewards(userAddress);
}

export async function getUserPStake(userAddress) {
    const contract = await getStakingContractReadOnly();
    return await contract.userTotalPStake(userAddress);
}

export async function getTotalPStake() {
    const contract = await getStakingContractReadOnly();
    return await contract.totalPStake();
}

export async function getEarlyUnstakePenalty() {
    const contract = await getStakingContractReadOnly();
    try {
        const bps = await contract.forceUnstakePenaltyBps();
        return Number(bps) / 100;
    } catch {
        return 10; // Default 10%
    }
}

/**
 * Gets staking configuration
 * V9: MIN_LOCK_DAYS/MAX_LOCK_DAYS already in days
 */
export async function getStakingConfig() {
    const contract = await getStakingContractReadOnly();

    const [minLockDays, maxLockDays, penaltyBps] = await Promise.all([
        contract.MIN_LOCK_DAYS(),
        contract.MAX_LOCK_DAYS(),
        contract.forceUnstakePenaltyBps().catch(() => 1000n)
    ]);

    return {
        minLockDays: Number(minLockDays),
        maxLockDays: Number(maxLockDays),
        penaltyPercent: Number(penaltyBps) / 100,
        penaltyBips: Number(penaltyBps)
    };
}

/**
 * Preview claim — V9 returns 6-tuple (added referrerCut)
 */
export async function previewClaim(userAddress) {
    const contract = await getStakingContractReadOnly();
    const result = await contract.previewClaim(userAddress);
    return {
        totalRewards: result.totalRewards,
        burnAmount: result.burnAmount,
        referrerCut: result.referrerCut,
        userReceives: result.userReceives,
        burnRateBps: Number(result.burnRateBps),
        nftBoost: Number(result.nftBoost)
    };
}

/**
 * User summary — V9 new
 */
export async function getUserSummary(userAddress) {
    const contract = await getStakingContractReadOnly();
    const result = await contract.getUserSummary(userAddress);
    return {
        userTotalPStake: result.userTotalPStake || result[0],
        delegationCount: Number(result.delegationCount || result[1]),
        savedRewards: result.savedRewards || result[2],
        totalPending: result.totalPending || result[3],
        nftBoost: Number(result.nftBoost || result[4]),
        burnRateBps: Number(result.burnRateBps || result[5])
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
    getStakingConfig,
    previewClaim,
    getUserSummary
};

export default StakingTx;
