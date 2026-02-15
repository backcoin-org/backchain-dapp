import type { BackchainContext } from '@backchain/core';
import type { TxResult, FaucetStatus, UserFaucetInfo } from '@backchain/core';
export declare class FaucetModule {
    private ctx;
    constructor(ctx: BackchainContext);
    claim(): Promise<TxResult>;
    canClaim(address?: string): Promise<boolean>;
    getUserInfo(address?: string): Promise<UserFaucetInfo>;
    getStatus(): Promise<FaucetStatus>;
    getStats(): Promise<{
        tokens: bigint;
        eth: bigint;
        claims: bigint;
        users: bigint;
    }>;
    isPaused(): Promise<boolean>;
}
//# sourceMappingURL=index.d.ts.map