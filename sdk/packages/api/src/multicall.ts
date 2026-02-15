import { ethers } from 'ethers';
import type { BackchainContext } from '@backchain/core';

// Multicall3 is deployed at the same address on ALL EVM chains
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

const MULTICALL3_ABI = [
    'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[])',
];

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
export class Multicall {
    private mc3: ethers.Contract;

    constructor(ctx: BackchainContext) {
        this.mc3 = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, ctx.provider.reader);
    }

    /** Low-level: execute raw encoded calls. */
    async call(calls: CallInput[]): Promise<CallResult[]> {
        const formatted = calls.map(c => ({
            target: c.target,
            allowFailure: c.allowFailure ?? false,
            callData: c.callData,
        }));

        const results = await this.mc3.aggregate3(formatted);
        return results.map((r: { success: boolean; returnData: string }) => ({
            success: r.success,
            returnData: r.returnData,
        }));
    }

    /**
     * High-level: batch read multiple contract methods.
     * Returns decoded results in the same order as the input calls.
     */
    async batch(calls: BatchCall[]): Promise<unknown[]> {
        const encoded: CallInput[] = calls.map(c => ({
            target: String(c.contract.target),
            allowFailure: false,
            callData: c.contract.interface.encodeFunctionData(c.method, c.args),
        }));

        const results = await this.call(encoded);

        return results.map((r, i) => {
            if (!r.success) {
                throw new Error(`Multicall: call ${i} (${calls[i].method}) failed`);
            }
            const decoded = calls[i].contract.interface.decodeFunctionResult(calls[i].method, r.returnData);
            return decoded.length === 1 ? decoded[0] : decoded;
        });
    }
}
