// modules/price-service.js
// ✅ V12.0 — BKC Price Tracker (Backchain LiquidityPool AMM + CoinGecko)

const ethers = window.ethers;

import { addresses } from '../config.js';

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const POOL_ABI = [
    'function currentPrice() external view returns (uint256)',
    'function ethReserve() view returns (uint256)',
    'function bkcReserve() view returns (uint256)',
];
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
const CACHE_TTL_MS = 60_000; // 60s cache

// ════════════════════════════════════════════════════════════════════════════
// CACHE
// ════════════════════════════════════════════════════════════════════════════

let priceCache = {
    bkcEth: 0,
    ethUsd: 0,
    bkcUsd: 0,
    timestamp: 0,
};

// ════════════════════════════════════════════════════════════════════════════
// FETCH ETH/USD FROM COINGECKO
// ════════════════════════════════════════════════════════════════════════════

async function fetchEthUsd() {
    try {
        const resp = await fetch(COINGECKO_URL);
        if (!resp.ok) return priceCache.ethUsd || 0;
        const data = await resp.json();
        return data?.ethereum?.usd || 0;
    } catch (e) {
        console.warn('[PriceService] CoinGecko fetch failed:', e.message);
        return priceCache.ethUsd || 0;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// FETCH BKC/ETH FROM BACKCHAIN LIQUIDITY POOL
// ════════════════════════════════════════════════════════════════════════════

async function fetchBkcEth(provider) {
    try {
        const poolAddr = addresses?.liquidityPool;
        if (!poolAddr) {
            console.warn('[PriceService] LiquidityPool address not loaded');
            return priceCache.bkcEth || 0;
        }

        const pool = new ethers.Contract(poolAddr, POOL_ABI, provider);

        // currentPrice() returns BKC per 1 ETH in 18 decimals
        const [bkcPerEthWei, ethRes, bkcRes] = await Promise.all([
            pool.currentPrice(),
            pool.ethReserve(),
            pool.bkcReserve(),
        ]);

        if (bkcPerEthWei === 0n || ethRes === 0n) return 0;

        // ETH per BKC = ethReserve / bkcReserve
        const ethReserve = Number(ethers.formatEther(ethRes));
        const bkcReserve = Number(ethers.formatEther(bkcRes));

        if (bkcReserve === 0) return 0;
        return ethReserve / bkcReserve; // ETH per BKC
    } catch (e) {
        console.warn('[PriceService] Pool price fetch failed:', e.message);
        return priceCache.bkcEth || 0;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get current BKC price data. Cached for 60s.
 * @param {ethers.Provider} provider - Alchemy/public provider
 * @returns {{ bkcEth: number, ethUsd: number, bkcUsd: number, timestamp: number }}
 */
export async function getBkcPrice(provider) {
    if (!provider) return priceCache;

    const now = Date.now();
    if (now - priceCache.timestamp < CACHE_TTL_MS && priceCache.bkcUsd > 0) {
        return priceCache;
    }

    const [bkcEth, ethUsd] = await Promise.all([
        fetchBkcEth(provider),
        fetchEthUsd(),
    ]);

    const bkcUsd = bkcEth * ethUsd;

    priceCache = { bkcEth, ethUsd, bkcUsd, timestamp: now };
    return priceCache;
}

/**
 * Get cached price without fetching (for sync access)
 */
export function getCachedPrice() {
    return priceCache;
}

/**
 * Format USD price for display
 */
export function formatUsd(value) {
    if (!value || value === 0) return '$0.00';
    if (value >= 1) return `$${value.toFixed(2)}`;
    if (value >= 0.01) return `$${value.toFixed(4)}`;
    // Small prices: show full decimals (no scientific notation)
    const s = value.toFixed(8).replace(/0+$/, '');
    return `$${s}`;
}
