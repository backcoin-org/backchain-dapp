import { ethers } from 'ethers';
// Multicall3 is deployed at the same address on ALL EVM chains
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
const MULTICALL3_ABI = [
    'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[])',
];
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
    mc3;
    constructor(ctx) {
        this.mc3 = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, ctx.provider.reader);
    }
    /** Low-level: execute raw encoded calls. */
    async call(calls) {
        const formatted = calls.map(c => ({
            target: c.target,
            allowFailure: c.allowFailure ?? false,
            callData: c.callData,
        }));
        const results = await this.mc3.aggregate3(formatted);
        return results.map((r) => ({
            success: r.success,
            returnData: r.returnData,
        }));
    }
    /**
     * High-level: batch read multiple contract methods.
     * Returns decoded results in the same order as the input calls.
     */
    async batch(calls) {
        const encoded = calls.map(c => ({
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
//# sourceMappingURL=multicall.js.map