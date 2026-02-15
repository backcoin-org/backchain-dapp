import { type BackchainContext, type NetworkId } from '@backchain/core';
export interface BackchainMiddlewareConfig {
    /** Operator wallet address. */
    operator: string;
    /** Network (default: 'arbitrum-sepolia'). */
    network?: NetworkId;
    /** Custom RPC URL (optional — defaults to public RPC). */
    rpcUrl?: string;
    /** Private key for server-side signing (optional). */
    privateKey?: string;
}
/** Minimal Express-compatible request type. */
export interface BackchainRequest {
    backchain?: BackchainContext;
    [key: string]: unknown;
}
/**
 * Express/Hono middleware that injects `req.backchain` (a BackchainContext).
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { backchainMiddleware } from '@backchain/api';
 *
 * const app = express();
 * app.use(backchainMiddleware({ operator: '0x...' }));
 *
 * app.get('/stats', async (req, res) => {
 *   const ctx = req.backchain;
 *   // Use ctx with any module...
 * });
 * ```
 */
export declare function backchainMiddleware(config: BackchainMiddlewareConfig): (req: BackchainRequest, _res: unknown, next: (err?: unknown) => void) => void;
//# sourceMappingURL=middleware.d.ts.map