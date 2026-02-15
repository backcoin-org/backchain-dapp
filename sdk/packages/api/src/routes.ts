import type { BackchainContext, NftTier } from '@backchain/core';
import { StakingModule } from '@backchain/staking';
import { NftModule } from '@backchain/nft';
import { FortuneModule } from '@backchain/fortune';
import { NotaryModule } from '@backchain/notary';
import { AgoraModule } from '@backchain/agora';
import { CharityModule } from '@backchain/charity';
import { RentalModule } from '@backchain/rental';
import { SwapModule } from '@backchain/swap';
import { FaucetModule } from '@backchain/faucet';
import { BuybackModule } from '@backchain/buyback';

// ── Types ───────────────────────────────────────────────────────────────────

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

// ── Route Generator ─────────────────────────────────────────────────────────

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
export function generateRoutes(config: RouteConfig = {}): RouteDefinition[] {
    const base = config.basePath ?? '/api';
    const enabled = config.modules ? new Set(config.modules) : null;
    const routes: RouteDefinition[] = [];

    const include = (mod: string) => !enabled || enabled.has(mod);

    // ── Staking ─────────────────────────────────────────────────────────
    if (include('staking')) {
        routes.push({
            method: 'GET', path: `${base}/staking/stats`,
            handler: async (ctx) => new StakingModule(ctx).getStats(),
        });
        routes.push({
            method: 'GET', path: `${base}/staking/delegations/:address`,
            handler: async (ctx, p) => new StakingModule(ctx).getDelegations(p.address),
        });
        routes.push({
            method: 'GET', path: `${base}/staking/summary/:address`,
            handler: async (ctx, p) => new StakingModule(ctx).getUserSummary(p.address),
        });
    }

    // ── NFT ─────────────────────────────────────────────────────────────
    if (include('nft')) {
        routes.push({
            method: 'GET', path: `${base}/nft/pool/:tier/info`,
            handler: async (ctx, p) => new NftModule(ctx).getPoolInfo(Number(p.tier) as NftTier),
        });
        routes.push({
            method: 'GET', path: `${base}/nft/pool/:tier/stats`,
            handler: async (ctx, p) => new NftModule(ctx).getPoolStats(Number(p.tier) as NftTier),
        });
        routes.push({
            method: 'GET', path: `${base}/nft/user/:address/tokens`,
            handler: async (ctx, p) => new NftModule(ctx).getUserTokens(p.address),
        });
    }

    // ── Fortune ─────────────────────────────────────────────────────────
    if (include('fortune')) {
        routes.push({
            method: 'GET', path: `${base}/fortune/tiers`,
            handler: async (ctx) => new FortuneModule(ctx).getAllTiers(),
        });
        routes.push({
            method: 'GET', path: `${base}/fortune/stats`,
            handler: async (ctx) => new FortuneModule(ctx).getPoolStats(),
        });
        routes.push({
            method: 'GET', path: `${base}/fortune/game/:address`,
            handler: async (ctx, p) => new FortuneModule(ctx).activeGame(p.address),
        });
    }

    // ── Notary ──────────────────────────────────────────────────────────
    if (include('notary')) {
        routes.push({
            method: 'GET', path: `${base}/notary/verify/:hash`,
            handler: async (ctx, p) => new NotaryModule(ctx).verify(p.hash),
        });
        routes.push({
            method: 'GET', path: `${base}/notary/certificate/:id`,
            handler: async (ctx, p) => new NotaryModule(ctx).getCertificate(BigInt(p.id)),
        });
        routes.push({
            method: 'GET', path: `${base}/notary/stats`,
            handler: async (ctx) => new NotaryModule(ctx).getStats(),
        });
    }

    // ── Agora ───────────────────────────────────────────────────────────
    if (include('agora')) {
        routes.push({
            method: 'GET', path: `${base}/agora/post/:id`,
            handler: async (ctx, p) => new AgoraModule(ctx).getPost(BigInt(p.id)),
        });
        routes.push({
            method: 'GET', path: `${base}/agora/profile/:address`,
            handler: async (ctx, p) => new AgoraModule(ctx).getUserProfile(p.address),
        });
        routes.push({
            method: 'GET', path: `${base}/agora/stats`,
            handler: async (ctx) => new AgoraModule(ctx).getGlobalStats(),
        });
    }

    // ── Charity ─────────────────────────────────────────────────────────
    if (include('charity')) {
        routes.push({
            method: 'GET', path: `${base}/charity/campaign/:id`,
            handler: async (ctx, p) => new CharityModule(ctx).getCampaign(BigInt(p.id)),
        });
        routes.push({
            method: 'GET', path: `${base}/charity/stats`,
            handler: async (ctx) => new CharityModule(ctx).getStats(),
        });
    }

    // ── Rental ──────────────────────────────────────────────────────────
    if (include('rental')) {
        routes.push({
            method: 'GET', path: `${base}/rental/listing/:tokenId`,
            handler: async (ctx, p) => new RentalModule(ctx).getListing(BigInt(p.tokenId)),
        });
        routes.push({
            method: 'GET', path: `${base}/rental/listings`,
            handler: async (ctx) => new RentalModule(ctx).getAvailableListings(),
        });
        routes.push({
            method: 'GET', path: `${base}/rental/earnings/:address`,
            handler: async (ctx, p) => new RentalModule(ctx).getPendingEarnings(p.address),
        });
        routes.push({
            method: 'GET', path: `${base}/rental/stats`,
            handler: async (ctx) => new RentalModule(ctx).getStats(),
        });
    }

    // ── Swap ────────────────────────────────────────────────────────────
    if (include('swap')) {
        routes.push({
            method: 'GET', path: `${base}/swap/stats`,
            handler: async (ctx) => new SwapModule(ctx).getStats(),
        });
        routes.push({
            method: 'GET', path: `${base}/swap/quote/eth-to-bkc/:amount`,
            handler: async (ctx, p) => new SwapModule(ctx).getQuote(BigInt(p.amount)),
        });
        routes.push({
            method: 'GET', path: `${base}/swap/quote/bkc-to-eth/:amount`,
            handler: async (ctx, p) => new SwapModule(ctx).getQuoteBkcToEth(BigInt(p.amount)),
        });
        routes.push({
            method: 'GET', path: `${base}/swap/price`,
            handler: async (ctx) => new SwapModule(ctx).getCurrentPrice(),
        });
    }

    // ── Faucet ──────────────────────────────────────────────────────────
    if (include('faucet')) {
        routes.push({
            method: 'GET', path: `${base}/faucet/status`,
            handler: async (ctx) => new FaucetModule(ctx).getStatus(),
        });
        routes.push({
            method: 'GET', path: `${base}/faucet/user/:address`,
            handler: async (ctx, p) => new FaucetModule(ctx).getUserInfo(p.address),
        });
    }

    // ── Buyback ─────────────────────────────────────────────────────────
    if (include('buyback')) {
        routes.push({
            method: 'GET', path: `${base}/buyback/stats`,
            handler: async (ctx) => new BuybackModule(ctx).getStats(),
        });
        routes.push({
            method: 'GET', path: `${base}/buyback/preview`,
            handler: async (ctx) => new BuybackModule(ctx).preview(),
        });
        routes.push({
            method: 'GET', path: `${base}/buyback/mining-rate`,
            handler: async (ctx) => new BuybackModule(ctx).miningRate(),
        });
    }

    return routes;
}
