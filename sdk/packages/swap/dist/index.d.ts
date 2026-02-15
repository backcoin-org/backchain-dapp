import type { BackchainContext } from '@backchain/core';
import type { TxResult, LiquidityPoolStats } from '@backchain/core';
export declare class SwapModule {
    private ctx;
    constructor(ctx: BackchainContext);
    buyBkc(ethAmount: bigint, slippageBps?: number): Promise<TxResult>;
    sellBkc(bkcAmount: bigint, slippageBps?: number): Promise<TxResult>;
    getQuote(ethAmount: bigint): Promise<bigint>;
    getQuoteBkcToEth(bkcAmount: bigint): Promise<bigint>;
    getCurrentPrice(): Promise<bigint>;
    getReserves(): Promise<{
        ethReserve: bigint;
        bkcReserve: bigint;
    }>;
    getSwapFeeBps(): Promise<bigint>;
    getStats(): Promise<LiquidityPoolStats>;
}
//# sourceMappingURL=index.d.ts.map