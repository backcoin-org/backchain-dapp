// @backchain/staking — Staking Module
// ============================================================================

import { ethers } from 'ethers';
import {
    STAKING_POOL_ABI, BKC_TOKEN_ABI,
    calculateFee, ACTION_IDS,
} from '@backchain/core';
import type { BackchainContext } from '@backchain/core';
import type {
    TxResult, Delegation, DelegationDetail, ClaimPreview,
    ForceUnstakePreview, StakingStats, UserSummary,
} from '@backchain/core';

export class StakingModule {
    constructor(private ctx: BackchainContext) {}

    // ── Write ───────────────────────────────────────────────────────────────

    async delegate(amount: bigint, lockDays: number): Promise<TxResult> {
        if (lockDays < 1 || lockDays > 3650) throw new Error('lockDays must be 1-3650');
        if (amount <= 0n) throw new Error('amount must be > 0');

        const addr = this.ctx.addresses;

        const allowance = await this.ctx.getBkcAllowance(addr.stakingPool);
        if (allowance < amount) {
            await this.ctx.approveBkc(addr.stakingPool, amount);
        }

        const fee = await calculateFee(
            this.ctx.provider, addr.backchainEcosystem, ACTION_IDS.STAKING_DELEGATE
        );

        const contract = this.ctx.provider.getWriteContract(addr.stakingPool, STAKING_POOL_ABI);
        const tx = await contract.delegate(amount, lockDays, this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);

        const iface = new ethers.Interface(STAKING_POOL_ABI);
        const events: Record<string, unknown> = {};
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed?.name === 'Delegated') {
                    events.delegationIndex = parsed.args[1];
                    events.pStake = parsed.args[3];
                }
            } catch { /* skip non-matching logs */ }
        }

        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events };
    }

    async unstake(index: number): Promise<TxResult> {
        const contract = this.ctx.provider.getWriteContract(this.ctx.addresses.stakingPool, STAKING_POOL_ABI);
        const tx = await contract.unstake(index);
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    async forceUnstake(index: number): Promise<TxResult> {
        const addr = this.ctx.addresses;
        const preview = await this.previewForceUnstake(this.ctx.provider.address!, index);

        const contract = this.ctx.provider.getWriteContract(addr.stakingPool, STAKING_POOL_ABI);
        const tx = await contract.forceUnstake(index, this.ctx.operator, { value: preview.ethFeeRequired });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    async claimRewards(): Promise<TxResult> {
        const addr = this.ctx.addresses;
        const fee = await calculateFee(
            this.ctx.provider, addr.backchainEcosystem, ACTION_IDS.STAKING_CLAIM
        );

        const contract = this.ctx.provider.getWriteContract(addr.stakingPool, STAKING_POOL_ABI);
        const tx = await contract['claimRewards(address)'](this.ctx.operator, { value: fee });
        const receipt = await tx.wait(1);
        return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed, events: {} };
    }

    // ── Read ────────────────────────────────────────────────────────────────

    async getDelegations(address?: string): Promise<Delegation[]> {
        const addr = address || this.ctx.provider.address;
        if (!addr) throw new Error('No address');
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.stakingPool, STAKING_POOL_ABI);
        const raw = await contract.getDelegationsOf(addr);
        return raw.map((d: any) => ({
            amount: d.amount, pStake: d.pStake, lockEnd: d.lockEnd,
            lockDays: d.lockDays, rewardDebt: d.rewardDebt,
        }));
    }

    async getDelegation(address: string, index: number): Promise<DelegationDetail> {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.stakingPool, STAKING_POOL_ABI);
        const d = await contract.getDelegation(address, index);
        return { amount: d[0], pStake: d[1], lockEnd: d[2], lockDays: d[3], pendingReward: d[4] };
    }

    async pendingRewards(address?: string): Promise<bigint> {
        const addr = address || this.ctx.provider.address;
        if (!addr) throw new Error('No address');
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.stakingPool, STAKING_POOL_ABI);
        return contract.pendingRewards(addr);
    }

    async previewClaim(address?: string): Promise<ClaimPreview> {
        const addr = address || this.ctx.provider.address;
        if (!addr) throw new Error('No address');
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.stakingPool, STAKING_POOL_ABI);
        const r = await contract.previewClaim(addr);
        return {
            totalRewards: r[0], recycleAmount: r[1], burnAmount: r[2],
            tutorCut: r[3], userReceives: r[4], recycleRateBps: r[5], nftBoost: r[6],
        };
    }

    async previewForceUnstake(address: string, index: number): Promise<ForceUnstakePreview> {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.stakingPool, STAKING_POOL_ABI);
        const r = await contract.previewForceUnstake(address, index);
        return {
            stakedAmount: r[0], totalPenalty: r[1], recycleAmount: r[2], burnAmount: r[3],
            tutorCut: r[4], userReceives: r[5], penaltyRateBps: r[6], nftBoost: r[7], ethFeeRequired: r[8],
        };
    }

    async getUserSummary(address?: string): Promise<UserSummary> {
        const addr = address || this.ctx.provider.address;
        if (!addr) throw new Error('No address');
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.stakingPool, STAKING_POOL_ABI);
        const s = await contract.getUserSummary(addr);
        return {
            userTotalPStake: s[0], delegationCount: s[1], savedRewards: s[2],
            totalPending: s[3], nftBoost: s[4], recycleRateBps: s[5],
        };
    }

    async getStats(): Promise<StakingStats> {
        const contract = this.ctx.provider.getReadContract(this.ctx.addresses.stakingPool, STAKING_POOL_ABI);
        const s = await contract.getStakingStats();
        return {
            totalPStake: s[0], totalBkcDelegated: s[1], totalRewardsDistributed: s[2],
            totalBurnedOnClaim: s[3], totalRecycledOnClaim: s[4], totalForceUnstakePenalties: s[5],
            totalTutorPayments: s[6], totalEthFeesCollected: s[7], accRewardPerShare: s[8],
        };
    }

    calculatePStake(amount: bigint, lockDays: number): bigint {
        return amount * (10000n + BigInt(lockDays) * 5918n / 365n) / 10000n;
    }
}
