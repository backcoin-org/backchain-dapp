import type { BackchainContext } from '@backchain/core';
export interface RouteConfig {
    /** Base path (default: '/api'). */
    basePath?: string;
    /** Which modules to expose (default: all). */
    modules?: string[];
}
/** Route definition for framework-agnostic registration. */
export interface RouteDefinition {
    method: 'GET' | 'POST';
    path: string;
    handler: (ctx: BackchainContext, params: Record<string, string>, query: Record<string, string>) => Promise<unknown>;
}
/**
 * Generate route definitions for all Backchain modules.
 * Framework-agnostic — returns RouteDefinition[] that can be wired to Express, Hono, Fastify, etc.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { generateRoutes, backchainMiddleware } from '@backchain/api';
 *
 * const app = express();
 * app.use(backchainMiddleware({ operator: '0x...' }));
 *
 * for (const route of generateRoutes()) {
 *   app.get(route.path, async (req, res) => {
 *     const result = await route.handler(req.backchain, req.params, req.query);
 *     res.json(result);
 *   });
 * }
 * ```
 */
export declare function generateRoutes(config?: RouteConfig): RouteDefinition[];
//# sourceMappingURL=routes.d.ts.map