import type { BackchainContext } from '@backchain/core';
import type { TxResult, BuybackPreview, BuybackStats } from '@backchain/core';
export declare class BuybackModule {
    private ctx;
    constructor(ctx: BackchainContext);
    execute(): Promise<TxResult>;
    executeWithSlippage(minTotalBkcOut: bigint): Promise<TxResult>;
    preview(): Promise<BuybackPreview>;
    pendingEth(): Promise<bigint>;
    miningRate(): Promise<bigint>;
    getExecutionFee(): Promise<bigint>;
    getSupplyInfo(): Promise<{
        currentSupply: bigint;
        maxSupply: bigint;
        totalMintedViaMining: bigint;
        remainingMintable: bigint;
        miningRateBps: bigint;
        totalBurnedLifetime: bigint;
    }>;
    getStats(): Promise<BuybackStats>;
    getLastBuyback(): Promise<{
        timestamp: bigint;
        blockNumber: bigint;
        caller: string;
        ethSpent: bigint;
        bkcTotal: bigint;
        timeSinceLast: bigint;
    }>;
}
//# sourceMappingURL=index.d.ts.map