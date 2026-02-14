// @backchain/sdk — Staking Module
// ============================================================================
import { ethers } from 'ethers';
import { STAKING_POOL_ABI } from '../contracts/abis.js';
import { calculateFee, ACTION_IDS } from '../fees.js';
export class StakingModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    // ── Write ───────────────────────────────────────────────────────────────
    /**
     * Delegate BKC tokens to the staking pool.
     * Requires BKC approval. Auto-approves if allowance is insufficient.
     *
     * @param amount - Amount of BKC in wei (e.g., ethers.parseEther("100"))
     * @param lockDays - Lock period (1-3650 days). Longer = more pStake
     */
    async delegate(amount, lockDays) {
        if (lockDays < 1 || lockDays > 3650)
            throw new Error('lockDays must be 1-3650');
        if (amount <= 0n)
            throw new Error('amount must be > 0');
        const addr = this.sdk.addresses;
        // Auto-approve BKC if needed
        const allowance = await this.sdk.getBkcAllowance(addr.stakingPool);
        if (allowance < amount) {
            await this.sdk.approveBkc(addr.stakingPool, amount);
        }
        // Calculate fee
        const fee = await calculateFee(this.sdk.provider, addr.backchainEcosystem, ACTION_IDS.STAKING_DELEGATE);
        const contract = this.sdk.provider.getWriteContract(addr.stakingPool, STAKING_POOL_ABI);
        const tx = await contract.delegate(amount, lockDays, this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);
        // Parse Delegated event
        const iface = new ethers.Interface(STAKING_POOL_ABI);
        const events = {};
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'Delegated') {
                    events.delegationIndex = parsed.args[1];
                    events.pStake = parsed.args[3];
                }
            }
            catch { /* skip non-matching logs */ }
        }
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events };
    }
    /**
     * Unstake a delegation after its lock period expires.
     * @param index - Delegation index (from getDelegations)
     */
    async unstake(index) {
        const contract = this.sdk.provider.getWriteContract(this.sdk.addresses.stakingPool, STAKING_POOL_ABI);
        const tx = await contract.unstake(index);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /**
     * Force-unstake before lock period ends (with penalty).
     * @param index - Delegation index
     */
    async forceUnstake(index) {
        const addr = this.sdk.addresses;
        const preview = await this.previewForceUnstake(this.sdk.provider.address, index);
        const contract = this.sdk.provider.getWriteContract(addr.stakingPool, STAKING_POOL_ABI);
        const tx = await contract.forceUnstake(index, this.sdk.operator, { value: preview.ethFeeRequired });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    /**
     * Claim pending staking rewards.
     * Note: Without an NFT Booster, up to 50% of rewards are burned.
     */
    async claimRewards() {
        const addr = this.sdk.addresses;
        const fee = await calculateFee(this.sdk.provider, addr.backchainEcosystem, ACTION_IDS.STAKING_CLAIM);
        const contract = this.sdk.provider.getWriteContract(addr.stakingPool, STAKING_POOL_ABI);
        const tx = await contract['claimRewards(address)'](this.sdk.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }
    // ── Read ────────────────────────────────────────────────────────────────
    /** Get all delegations for an address */
    async getDelegations(address) {
        const addr = address || this.sdk.provider.address;
        if (!addr)
            throw new Error('No address');
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.stakingPool, STAKING_POOL_ABI);
        const raw = await contract.getDelegationsOf(addr);
        return raw.map((d) => ({
            amount: d.amount,
            pStake: d.pStake,
            lockEnd: d.lockEnd,
            lockDays: d.lockDays,
            rewardDebt: d.rewardDebt,
        }));
    }
    /** Get a specific delegation with pending reward */
    async getDelegation(address, index) {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.stakingPool, STAKING_POOL_ABI);
        const d = await contract.getDelegation(address, index);
        return { amount: d[0], pStake: d[1], lockEnd: d[2], lockDays: d[3], pendingReward: d[4] };
    }
    /** Get pending BKC rewards for an address */
    async pendingRewards(address) {
        const addr = address || this.sdk.provider.address;
        if (!addr)
            throw new Error('No address');
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.stakingPool, STAKING_POOL_ABI);
        return contract.pendingRewards(addr);
    }
    /** Preview what happens when claiming rewards (burn, recycle, user receives) */
    async previewClaim(address) {
        const addr = address || this.sdk.provider.address;
        if (!addr)
            throw new Error('No address');
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.stakingPool, STAKING_POOL_ABI);
        const r = await contract.previewClaim(addr);
        return {
            totalRewards: r[0], recycleAmount: r[1], burnAmount: r[2],
            tutorCut: r[3], userReceives: r[4], recycleRateBps: r[5], nftBoost: r[6],
        };
    }
    /** Preview force-unstake penalty breakdown */
    async previewForceUnstake(address, index) {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.stakingPool, STAKING_POOL_ABI);
        const r = await contract.previewForceUnstake(address, index);
        return {
            stakedAmount: r[0], totalPenalty: r[1], recycleAmount: r[2], burnAmount: r[3],
            tutorCut: r[4], userReceives: r[5], penaltyRateBps: r[6], nftBoost: r[7], ethFeeRequired: r[8],
        };
    }
    /** Get user summary (pStake, delegations, rewards, boost, recycle rate) */
    async getUserSummary(address) {
        const addr = address || this.sdk.provider.address;
        if (!addr)
            throw new Error('No address');
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.stakingPool, STAKING_POOL_ABI);
        const s = await contract.getUserSummary(addr);
        return {
            userTotalPStake: s[0], delegationCount: s[1], savedRewards: s[2],
            totalPending: s[3], nftBoost: s[4], recycleRateBps: s[5],
        };
    }
    /** Get global staking statistics */
    async getStats() {
        const contract = this.sdk.provider.getReadContract(this.sdk.addresses.stakingPool, STAKING_POOL_ABI);
        const s = await contract.getStakingStats();
        return {
            totalPStake: s[0], totalBkcDelegated: s[1], totalRewardsDistributed: s[2],
            totalBurnedOnClaim: s[3], totalRecycledOnClaim: s[4], totalForceUnstakePenalties: s[5],
            totalTutorPayments: s[6], totalEthFeesCollected: s[7], accRewardPerShare: s[8],
        };
    }
    /** Calculate pStake for a given amount and lock period (pure JS, no RPC) */
    calculatePStake(amount, lockDays) {
        return amount * (10000n + BigInt(lockDays) * 5918n / 365n) / 10000n;
    }
}
//# sourceMappingURL=staking.js.map