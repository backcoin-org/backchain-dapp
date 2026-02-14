import type { Backchain } from '../backchain.js';
import type { TxResult, Delegation, DelegationDetail, ClaimPreview, ForceUnstakePreview, StakingStats, UserSummary } from '../types/index.js';
export declare class StakingModule {
    private sdk;
    constructor(sdk: Backchain);
    /**
     * Delegate BKC tokens to the staking pool.
     * Requires BKC approval. Auto-approves if allowance is insufficient.
     *
     * @param amount - Amount of BKC in wei (e.g., ethers.parseEther("100"))
     * @param lockDays - Lock period (1-3650 days). Longer = more pStake
     */
    delegate(amount: bigint, lockDays: number): Promise<TxResult>;
    /**
     * Unstake a delegation after its lock period expires.
     * @param index - Delegation index (from getDelegations)
     */
    unstake(index: number): Promise<TxResult>;
    /**
     * Force-unstake before lock period ends (with penalty).
     * @param index - Delegation index
     */
    forceUnstake(index: number): Promise<TxResult>;
    /**
     * Claim pending staking rewards.
     * Note: Without an NFT Booster, up to 50% of rewards are burned.
     */
    claimRewards(): Promise<TxResult>;
    /** Get all delegations for an address */
    getDelegations(address?: string): Promise<Delegation[]>;
    /** Get a specific delegation with pending reward */
    getDelegation(address: string, index: number): Promise<DelegationDetail>;
    /** Get pending BKC rewards for an address */
    pendingRewards(address?: string): Promise<bigint>;
    /** Preview what happens when claiming rewards (burn, recycle, user receives) */
    previewClaim(address?: string): Promise<ClaimPreview>;
    /** Preview force-unstake penalty breakdown */
    previewForceUnstake(address: string, index: number): Promise<ForceUnstakePreview>;
    /** Get user summary (pStake, delegations, rewards, boost, recycle rate) */
    getUserSummary(address?: string): Promise<UserSummary>;
    /** Get global staking statistics */
    getStats(): Promise<StakingStats>;
    /** Calculate pStake for a given amount and lock period (pure JS, no RPC) */
    calculatePStake(amount: bigint, lockDays: number): bigint;
}
//# sourceMappingURL=staking.d.ts.map