import { type RouteConfig } from './routes.js';
import { type BackchainMiddlewareConfig, type BackchainRequest } from './middleware.js';
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
export declare function setupBackchainRoutes(router: Router, config: ServerConfig): void;
export {};
//# sourceMappingURL=server.d.ts.map