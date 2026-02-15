// modules/price-service.js
// ✅ PRODUCTION V1.0 — BKC Price Tracker (Uniswap V3 + CoinGecko)

const ethers = window.ethers;

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const POOL = "0x4A434eCcA4c53e79834d74Be0DA6c224b92f0B35";
const WETH9 = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";
const POOL_ABI = [
    'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)',
    'function token0() view returns (address)',
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
let wethIsToken0 = null; // cached after first call

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
// FETCH BKC/ETH FROM UNISWAP V3 POOL
// ════════════════════════════════════════════════════════════════════════════

async function fetchBkcEth(provider) {
    try {
        const pool = new ethers.Contract(POOL, POOL_ABI, provider);

        const promises = [pool.slot0()];
        if (wethIsToken0 === null) promises.push(pool.token0());

        const results = await Promise.all(promises);
        const sqrtPriceX96 = results[0][0];

        if (wethIsToken0 === null) {
            wethIsToken0 = results[1].toLowerCase() === WETH9.toLowerCase();
        }

        const sqrtPrice = Number(sqrtPriceX96) / (2 ** 96);
        const price = sqrtPrice * sqrtPrice; // token1 per token0

        if (wethIsToken0) {
            // token0=WETH, token1=BKC → price = BKC per WETH
            return price > 0 ? 1 / price : 0; // ETH per BKC
        } else {
            // token0=BKC, token1=WETH → price = WETH per BKC
            return price;
        }
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
    if (value >= 0.0001) return `$${value.toFixed(6)}`;
    return `$${value.toExponential(2)}`;
}
