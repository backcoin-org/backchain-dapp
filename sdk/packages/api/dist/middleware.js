import { ethers } from 'ethers';
import { createContext } from '@backchain/core';
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
export function backchainMiddleware(config) {
    // Create context once (shared across all requests)
    let ctx = null;
    let initPromise = null;
    async function init() {
        const coreConfig = {
            operator: config.operator,
            network: config.network,
        };
        ctx = createContext(coreConfig);
        if (config.privateKey) {
            const wallet = new ethers.Wallet(config.privateKey, ctx.provider.reader);
            await ctx.connectWithSigner(wallet);
        }
    }
    return (req, _res, next) => {
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
            req.backchain = ctx;
            next();
        })
            .catch(next);
    };
}
//# sourceMappingURL=middleware.js.map