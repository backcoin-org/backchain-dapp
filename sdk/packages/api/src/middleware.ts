import { ethers } from 'ethers';
import { createContext, type BackchainContext, type BackchainConfig, type NetworkId } from '@backchain/core';

// ── Types ───────────────────────────────────────────────────────────────────

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

// ── Middleware ───────────────────────────────────────────────────────────────

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
export function backchainMiddleware(config: BackchainMiddlewareConfig) {
    // Create context once (shared across all requests)
    let ctx: BackchainContext | null = null;
    let initPromise: Promise<void> | null = null;

    async function init(): Promise<void> {
        const coreConfig: BackchainConfig = {
            operator: config.operator,
            network: config.network,
        };

        ctx = createContext(coreConfig);

        if (config.privateKey) {
            const wallet = new ethers.Wallet(config.privateKey, ctx.provider.reader);
            await ctx.connectWithSigner(wallet);
        }
    }

    return (req: BackchainRequest, _res: unknown, next: (err?: unknown) => void) => {
        if (ctx) {
            req.backchain = ctx;
            next();
            return;
        }

        if (!initPromise) {
            initPromise = init();
        }

        initPromise
            .then(() => {
                req.backchain = ctx!;
                next();
            })
            .catch(next);
    };
}
