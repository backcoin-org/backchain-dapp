import type { Backchain } from '../backchain.js';
import type { TxResult, LiquidityPoolStats } from '../types/index.js';
export declare class SwapModule {
    private sdk;
    constructor(sdk: Backchain);
    /**
     * Swap ETH for BKC.
     * @param ethAmount - Amount of ETH to swap (in wei)
     * @param slippageBps - Max slippage in basis points (default 300 = 3%)
     */
    buyBkc(ethAmount: bigint, slippageBps?: number): Promise<TxResult>;
    /**
     * Swap BKC for ETH.
     * @param bkcAmount - Amount of BKC to swap (in wei)
     * @param slippageBps - Max slippage in basis points (default 300 = 3%)
     */
    sellBkc(bkcAmount: bigint, slippageBps?: number): Promise<TxResult>;
    /** Get BKC output for a given ETH input */
    getQuote(ethAmount: bigint): Promise<bigint>;
    /** Get ETH output for a given BKC input */
    getQuoteBkcToEth(bkcAmount: bigint): Promise<bigint>;
    /** Get current BKC price in ETH */
    getCurrentPrice(): Promise<bigint>;
    /** Get pool reserves */
    getReserves(): Promise<{
        ethReserve: bigint;
        bkcReserve: bigint;
    }>;
    /** Get swap fee in basis points */
    getSwapFeeBps(): Promise<bigint>;
    /** Get pool statistics */
    getStats(): Promise<LiquidityPoolStats>;
}
//# sourceMappingURL=swap.d.ts.map