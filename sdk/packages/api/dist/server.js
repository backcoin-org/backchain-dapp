import { generateRoutes } from './routes.js';
import { backchainMiddleware } from './middleware.js';
// ── Server Factory ──────────────────────────────────────────────────────────
/**
 * Wire Backchain routes onto any Express-compatible router.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { setupBackchainRoutes } from '@backchain/api';
 *
 * const app = express();
 * app.use(express.json());
 * setupBackchainRoutes(app, {
 *   operator: '0x...',
 *   routes: { basePath: '/api' },
 * });
 * app.listen(3000);
 * ```
 */
export function setupBackchainRoutes(router, config) {
    // Apply middleware
    router.use(backchainMiddleware(config));
    // Register routes
    const routes = generateRoutes(config.routes);
    for (const route of routes) {
        const method = route.method.toLowerCase();
        router[method](route.path, async (req, res) => {
            try {
                const ctx = req.backchain;
                const result = await route.handler(ctx, req.params, req.query);
                // Serialize BigInt values to strings for JSON
                res.json(JSON.parse(JSON.stringify(result, (_key, value) => typeof value === 'bigint' ? value.toString() : value)));
            }
            catch (err) {
                res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
            }
        });
    }
}
//# sourceMappingURL=server.js.map