import { ethers } from 'ethers';
import type { BackchainContext } from '@backchain/core';
export interface CallInput {
    target: string;
    allowFailure?: boolean;
    callData: string;
}
export interface CallResult {
    success: boolean;
    returnData: string;
}
export interface BatchCall {
    contract: ethers.Contract;
    method: string;
    args: unknown[];
}
/**
 * Multicall3 wrapper — batch N contract reads into 1 RPC call.
 *
 * @example
 * ```ts
 * import { Multicall } from '@backchain/api';
 *
 * const mc = new Multicall(ctx);
 * const [balance, allowance, supply] = await mc.batch([
 *   { contract: bkcToken, method: 'balanceOf', args: [user] },
 *   { contract: bkcToken, method: 'allowance', args: [user, spender] },
 *   { contract: bkcToken, method: 'totalSupply', args: [] },
 * ]);
 * ```
 */
export declare class Multicall {
    private mc3;
    constructor(ctx: BackchainContext);
    /** Low-level: execute raw encoded calls. */
    call(calls: CallInput[]): Promise<CallResult[]>;
    /**
     * High-level: batch read multiple contract methods.
     * Returns decoded results in the same order as the input calls.
     */
    batch(calls: BatchCall[]): Promise<unknown[]>;
}
//# sourceMappingURL=multicall.d.ts.map