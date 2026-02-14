import type { Backchain } from '../backchain.js';
import type { TxResult, BuybackPreview, BuybackStats } from '../types/index.js';
export declare class BuybackModule {
    private sdk;
    constructor(sdk: Backchain);
    /**
     * Execute a buyback — converts accumulated ETH fees into BKC rewards.
     * The caller earns 5% of the mined BKC as a reward.
     * Requires paying the execution fee (anti-spam).
     */
    execute(): Promise<TxResult>;
    /**
     * Execute buyback with slippage protection.
     * @param minTotalBkcOut - Minimum total BKC output (purchased + mined)
     */
    executeWithSlippage(minTotalBkcOut: bigint): Promise<TxResult>;
    /** Preview the next buyback (estimated outputs, is ready?) */
    preview(): Promise<BuybackPreview>;
    /** Get pending ETH available for buyback */
    pendingEth(): Promise<bigint>;
    /** Get current mining rate (basis points) */
    miningRate(): Promise<bigint>;
    /** Get execution fee */
    getExecutionFee(): Promise<bigint>;
    /** Get supply info (current, max, minted, remaining, rate, burned) */
    getSupplyInfo(): Promise<{
        currentSupply: bigint;
        maxSupply: bigint;
        totalMintedViaMining: bigint;
        remainingMintable: bigint;
        miningRateBps: bigint;
        totalBurnedLifetime: bigint;
    }>;
    /** Get lifetime buyback statistics */
    getStats(): Promise<BuybackStats>;
    /** Get info about the last buyback */
    getLastBuyback(): Promise<{
        timestamp: bigint;
        blockNumber: bigint;
        caller: string;
        ethSpent: bigint;
        bkcTotal: bigint;
        timeSinceLast: bigint;
    }>;
}
//# sourceMappingURL=buyback.d.ts.map