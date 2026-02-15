import type { BackchainContext } from '@backchain/core';
import { generateRoutes, type RouteConfig } from './routes.js';
import { backchainMiddleware, type BackchainMiddlewareConfig, type BackchainRequest } from './middleware.js';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ServerConfig extends BackchainMiddlewareConfig {
    /** Route configuration. */
    routes?: RouteConfig;
}

/** Minimal Express-compatible types. */
interface ApiRequest extends BackchainRequest {
    params: Record<string, string>;
    query: Record<string, string>;
}

interface ApiResponse {
    status(code: number): ApiResponse;
    json(body: unknown): void;
}

interface Router {
    get(path: string, handler: (req: ApiRequest, res: ApiResponse) => void): void;
    post(path: string, handler: (req: ApiRequest, res: ApiResponse) => void): void;
    use(middleware: (req: BackchainRequest, res: unknown, next: (err?: unknown) => void) => void): void;
}

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
export function setupBackchainRoutes(router: Router, config: ServerConfig): void {
    // Apply middleware
    router.use(backchainMiddleware(config));

    // Register routes
    const routes = generateRoutes(config.routes);
    for (const route of routes) {
        const method = route.method.toLowerCase() as 'get' | 'post';
        router[method](route.path, async (req: ApiRequest, res: ApiResponse) => {
            try {
                const ctx = req.backchain as BackchainContext;
                const result = await route.handler(ctx, req.params, req.query);
                // Serialize BigInt values to strings for JSON
                res.json(JSON.parse(JSON.stringify(result, (_key, value) =>
                    typeof value === 'bigint' ? value.toString() : value,
                )));
            } catch (err) {
                res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
            }
        });
    }
}
