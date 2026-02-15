import type { BackchainContext } from '@backchain/core';
import type { TxResult, Delegation, DelegationDetail, ClaimPreview, ForceUnstakePreview, StakingStats, UserSummary } from '@backchain/core';
export declare class StakingModule {
    private ctx;
    constructor(ctx: BackchainContext);
    delegate(amount: bigint, lockDays: number): Promise<TxResult>;
    unstake(index: number): Promise<TxResult>;
    forceUnstake(index: number): Promise<TxResult>;
    claimRewards(): Promise<TxResult>;
    getDelegations(address?: string): Promise<Delegation[]>;
    getDelegation(address: string, index: number): Promise<DelegationDetail>;
    pendingRewards(address?: string): Promise<bigint>;
    previewClaim(address?: string): Promise<ClaimPreview>;
    previewForceUnstake(address: string, index: number): Promise<ForceUnstakePreview>;
    getUserSummary(address?: string): Promise<UserSummary>;
    getStats(): Promise<StakingStats>;
    calculatePStake(amount: bigint, lockDays: number): bigint;
}
//# sourceMappingURL=index.d.ts.map