// modules/price-service.js
// ✅ PRODUCTION V2.0 — BKC Price Tracker (Internal LP + CoinGecko)

import { addresses } from '../config.js';

const ethers = window.ethers;

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const LP_ABI = [
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
// FETCH BKC/ETH FROM INTERNAL LIQUIDITY POOL
// ════════════════════════════════════════════════════════════════════════════

async function fetchBkcEth(provider) {
    try {
        const lpAddress = addresses?.liquidityPool;
        if (!lpAddress) {
            console.warn('[PriceService] LP address not loaded yet');
            return priceCache.bkcEth || 0;
        }

        const lp = new ethers.Contract(lpAddress, LP_ABI, provider);
        const [ethReserve, bkcReserve] = await Promise.all([
            lp.ethReserve(),
            lp.bkcReserve(),
        ]);

        if (bkcReserve === 0n || ethReserve === 0n) return 0;

        // BKC price in ETH = ethReserve / bkcReserve
        return Number(ethReserve) / Number(bkcReserve);
    } catch (e) {
        console.warn('[PriceService] LP price fetch failed:', e.message);
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
