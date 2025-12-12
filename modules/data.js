// js/modules/data.js
// ✅ VERSÃO V6.2 - CRITICAL FIX: Cache e Throttle para evitar requisições infinitas

const ethers = window.ethers;

import { State } from '../state.js';
import { addresses, boosterTiers, rentalManagerABI, rewardBoosterABI } from '../config.js';

// ====================================================================
// CONSTANTS & CONFIGURATION
// ====================================================================
const API_TIMEOUT_MS = 5000; // 5 seconds max for API
const CACHE_DURATION_MS = 60000; // System data cache (1 min)
const CONTRACT_READ_CACHE_MS = 15000; // RPC read cache (15s)
const OWNERSHIP_CACHE_MS = 30000; // NFT ownership cache (30s)
const BALANCE_CACHE_MS = 10000; // Balance cache (10s)

// 🔥 NEW: Booster-specific cache to prevent infinite calls
const BOOSTER_CACHE_MS = 30000; // Cache boosters for 30 seconds
const BOOSTER_ERROR_COOLDOWN_MS = 60000; // Wait 60s before retrying after error

let systemDataCache = null;
let systemDataCacheTime = 0;

// 🔥 NEW: Booster cache state
let boosterCacheData = null;
let boosterCacheTime = 0;
let boosterLastError = 0;
let boosterLoadInProgress = false; // Prevent concurrent calls

// Cache Maps
const contractReadCache = new Map();
const ownershipCache = new Map();
const balanceCache = new Map();

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ====================================================================
// SAFE FETCH WITH TIMEOUT
// ====================================================================

async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('API request timed out.');
        }
        throw error;
    }
}

// ====================================================================
// API ENDPOINTS
// ====================================================================

export const API_ENDPOINTS = {
    getHistory: 'https://gethistory-4wvdcuoouq-uc.a.run.app',
    getBoosters: 'https://getboosters-4wvdcuoouq-uc.a.run.app',
    getSystemData: 'https://getsystemdata-4wvdcuoouq-uc.a.run.app',
    getNotaryHistory: 'https://getnotaryhistory-4wvdcuoouq-uc.a.run.app',
    getRentalListings: 'https://getrentallistings-4wvdcuoouq-uc.a.run.app',
    getUserRentals: 'https://getuserrentals-4wvdcuoouq-uc.a.run.app',
    uploadFileToIPFS: '/api/upload',
    claimAirdrop: 'https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop'
};

// ====================================================================
// RPC SAFETY FUNCTIONS
// ====================================================================

function isRateLimitError(e) {
    return (
        e?.error?.code === 429 || 
        e?.code === 429 ||
        (e.message && (e.message.includes("429") || e.message.includes("Too Many Requests") || e.message.includes("rate limit")))
    );
}

function isRpcError(e) {
    const errorCode = e?.error?.code || e?.code;
    return (
        errorCode === -32603 || // Internal JSON-RPC error
        errorCode === -32000 || // Server error
        e.message?.includes("Internal JSON-RPC")
    );
}

// Lazy contract instance creator
function getContractInstance(address, abi, fallbackStateContract) {
    if (fallbackStateContract) return fallbackStateContract;
    if (!address || !State.publicProvider) return null;
    try {
        return new ethers.Contract(address, abi, State.publicProvider);
    } catch (e) {
        console.warn("Failed to create contract instance:", e.message);
        return null;
    }
}

// ====================================================================
// SAFE CONTRACT CALL WITH CACHE & RETRY
// ====================================================================

export const safeContractCall = async (
    contract, 
    method, 
    args = [], 
    fallbackValue = 0n, 
    retries = 2, 
    forceRefresh = false
) => {
    if (!contract) return fallbackValue;

    const contractAddr = contract.target || contract.address;

    // Safe BigInt serialization for cache key
    const serializedArgs = JSON.stringify(args, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
    const cacheKey = `${contractAddr}-${method}-${serializedArgs}`;
    const now = Date.now();

    // Methods that benefit from caching
    const cacheableMethods = [
        'getPoolInfo', 'getBuyPrice', 'getSellPrice', 'getAvailableTokenIds',
        'getAllListedTokenIds', 'tokenURI', 'boostBips', 'getListing',
        'balanceOf', 'totalSupply', 'totalNetworkPStake', 'MAX_SUPPLY', 'TGE_SUPPLY',
        'userTotalPStake', 'pendingRewards', 'isRented', 'getRental', 'ownerOf',
        'getDelegationsOf', 'allowance'
    ];

    // Check cache first
    if (!forceRefresh && cacheableMethods.includes(method)) {
        const cached = contractReadCache.get(cacheKey);
        if (cached && (now - cached.timestamp < CONTRACT_READ_CACHE_MS)) {
            return cached.value;
        }
    }

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const result = await contract[method](...args);
            
            // Update cache on success
            if (cacheableMethods.includes(method)) {
                contractReadCache.set(cacheKey, { value: result, timestamp: now });
            }
            
            return result;

        } catch (e) {
            lastError = e;
            
            // Rate limit - exponential backoff
            if (isRateLimitError(e) && attempt < retries) {
                const jitter = Math.floor(Math.random() * 1000);
                const delay = 1000 * Math.pow(2, attempt) + jitter;
                console.warn(`Rate limited on ${method}. Retry in ${delay}ms...`);
                await wait(delay);
                continue;
            }
            
            // RPC error - try once more after short delay
            if (isRpcError(e) && attempt < retries) {
                await wait(500);
                continue;
            }
            
            // Other errors - don't retry
            break;
        }
    }
    
    // Return fallback value instead of throwing
    console.warn(`Contract call failed: ${method}`, lastError?.message?.slice(0, 80));
    return fallbackValue;
};

// Specialized safe balance fetcher with dedicated cache
export const safeBalanceOf = async (contract, address, forceRefresh = false) => {
    const cacheKey = `balance-${contract?.target || contract?.address}-${address}`;
    const now = Date.now();
    
    if (!forceRefresh) {
        const cached = balanceCache.get(cacheKey);
        if (cached && (now - cached.timestamp < BALANCE_CACHE_MS)) {
            return cached.value;
        }
    }
    
    const balance = await safeContractCall(contract, 'balanceOf', [address], 0n, 2, forceRefresh);
    balanceCache.set(cacheKey, { value: balance, timestamp: now });
    return balance;
};

// ====================================================================
// 1. GLOBAL SYSTEM DATA (Fees, Configs)
// ====================================================================

export async function loadSystemDataFromAPI() {
    if (!State.systemFees) State.systemFees = {};
    if (!State.systemPStakes) State.systemPStakes = {};
    if (!State.boosterDiscounts) State.boosterDiscounts = {};

    const now = Date.now();
    
    // Use cache if fresh
    if (systemDataCache && (now - systemDataCacheTime < CACHE_DURATION_MS)) {
        applySystemDataToState(systemDataCache);
        return true;
    }

    try {
        const response = await fetchWithTimeout(API_ENDPOINTS.getSystemData, API_TIMEOUT_MS);
        if (!response.ok) throw new Error(`API Status: ${response.status}`);

        const systemData = await response.json();
        applySystemDataToState(systemData);

        systemDataCache = systemData;
        systemDataCacheTime = now;
        return true;
        
    } catch (e) {
        console.warn("System Data API Failed. Using V3.1 defaults.");
        
        // 🔥 FIXED: Use correct V3.1 Fee Strategy defaults
        if (!State.systemFees['NOTARY_SERVICE']) State.systemFees['NOTARY_SERVICE'] = 1000000000000000000n; // 1 BKC
        if (!State.systemFees['CLAIM_REWARD_FEE_BIPS']) State.systemFees['CLAIM_REWARD_FEE_BIPS'] = 5000n; // 50%
        if (!State.systemFees['DELEGATION_FEE_BIPS']) State.systemFees['DELEGATION_FEE_BIPS'] = 50n;
        if (!State.systemFees['UNSTAKE_FEE_BIPS']) State.systemFees['UNSTAKE_FEE_BIPS'] = 100n;
        if (!State.systemFees['FORCE_UNSTAKE_PENALTY_BIPS']) State.systemFees['FORCE_UNSTAKE_PENALTY_BIPS'] = 5000n;
        if (!State.systemFees['NFT_POOL_BUY_TAX_BIPS']) State.systemFees['NFT_POOL_BUY_TAX_BIPS'] = 500n;
        if (!State.systemFees['NFT_POOL_SELL_TAX_BIPS']) State.systemFees['NFT_POOL_SELL_TAX_BIPS'] = 1000n;
        if (!State.systemFees['FORTUNE_POOL_SERVICE']) State.systemFees['FORTUNE_POOL_SERVICE'] = 2000n;
        if (!State.systemFees['RENTAL_MARKET_TAX_BIPS']) State.systemFees['RENTAL_MARKET_TAX_BIPS'] = 1000n;
        
        // Default booster discounts
        const defaultDiscounts = {
            '1000': 1000n, '2000': 2000n, '3000': 3000n, '4000': 4000n,
            '5000': 5000n, '6000': 6000n, '7000': 7000n
        };
        for (const [boost, discount] of Object.entries(defaultDiscounts)) {
            if (!State.boosterDiscounts[boost]) State.boosterDiscounts[boost] = discount;
        }
        
        return false;
    }
}

function applySystemDataToState(systemData) {
    if (systemData.fees) {
        for (const key in systemData.fees) {
            try {
                State.systemFees[key] = BigInt(systemData.fees[key]);
            } catch (e) {
                State.systemFees[key] = 0n;
            }
        }
    }
    
    if (systemData.pStakeRequirements) {
        for (const key in systemData.pStakeRequirements) {
            try {
                State.systemPStakes[key] = BigInt(systemData.pStakeRequirements[key]);
            } catch (e) {
                State.systemPStakes[key] = 0n;
            }
        }
    }
    
    if (systemData.discounts) {
        for (const key in systemData.discounts) {
            try {
                State.boosterDiscounts[key] = BigInt(systemData.discounts[key]);
            } catch (e) {
                State.boosterDiscounts[key] = 0n;
            }
        }
    }
    
    if (systemData.oracleFeeInWei) {
        State.systemData = State.systemData || {};
        try {
            State.systemData.oracleFeeInWei = BigInt(systemData.oracleFeeInWei);
        } catch (e) {
            State.systemData.oracleFeeInWei = 0n;
        }
    }
}

export async function loadPublicData() {
    if (!State.publicProvider || !State.bkcTokenContractPublic) return;
    
    await Promise.allSettled([
        safeContractCall(State.bkcTokenContractPublic, 'totalSupply', [], 0n),
        loadSystemDataFromAPI()
    ]);
}

// ====================================================================
// 2. USER DATA (Balance, Boosters, pStake)
// ====================================================================

export async function loadUserData(forceRefresh = false) {
    if (!State.isConnected || !State.userAddress) return;

    try {
        // Parallel fetch for speed
        const [balance, nativeBalance] = await Promise.allSettled([
            safeBalanceOf(State.bkcTokenContract, State.userAddress, forceRefresh),
            State.provider?.getBalance(State.userAddress)
        ]);

        if (balance.status === 'fulfilled') {
            State.currentUserBalance = balance.value;
        }
        
        if (nativeBalance.status === 'fulfilled') {
            State.currentUserNativeBalance = nativeBalance.value;
        }

        // 🔥 CHANGED: Don't always reload boosters - use cache
        // Only reload if forced or cache is stale
        if (forceRefresh || !boosterCacheData || (Date.now() - boosterCacheTime > BOOSTER_CACHE_MS)) {
            await loadMyBoostersFromAPI(forceRefresh);
        }

        // Load pStake from chain
        if (State.delegationManagerContract) {
            const totalUserPStake = await safeContractCall(
                State.delegationManagerContract,
                'userTotalPStake',
                [State.userAddress],
                0n,
                2,
                forceRefresh
            );
            State.userTotalPStake = totalUserPStake;
        }

    } catch (e) {
        console.error("Error loading user data:", e);
    }
}

// ====================================================================
// 3. STAKING PAGE
// ====================================================================

export async function loadUserDelegations(forceRefresh = false) {
    if (!State.isConnected || !State.delegationManagerContract) return [];

    try {
        const delegationsRaw = await safeContractCall(
            State.delegationManagerContract,
            'getDelegationsOf',
            [State.userAddress],
            [],
            2,
            forceRefresh
        );
        
        State.userDelegations = delegationsRaw.map((d, index) => ({
            amount: d[0] || d.amount || 0n,
            unlockTime: d[1] || d.unlockTime || 0n,
            lockDuration: d[2] || d.lockDuration || 0n,
            index
        }));
        
        return State.userDelegations;
        
    } catch (e) {
        console.error("Error loading delegations:", e);
        return [];
    }
}

// ====================================================================
// 4. RENTAL PAGE
// ====================================================================

export async function loadUserRentals(forceRefresh = false) {
    if (!State.userAddress) {
        State.myRentals = [];
        return [];
    }

    try {
        const response = await fetchWithTimeout(
            `${API_ENDPOINTS.getUserRentals}/${State.userAddress}`,
            API_TIMEOUT_MS
        );
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const myRentals = await response.json();
        State.myRentals = myRentals;
        return myRentals;

    } catch (e) {
        State.myRentals = [];
        return [];
    }
}

// ====================================================================
// 5. BOOSTER HELPERS (🔥 FIXED WITH CACHE & THROTTLE)
// ====================================================================

/**
 * Gets the best booster (owned or rented) for discount calculation
 * 🔥 NOW WITH CACHE - Prevents infinite API calls
 */
export async function getHighestBoosterBoostFromAPI() {
    const now = Date.now();
    
    // 🔥 Return cached data if still fresh
    if (boosterCacheData && (now - boosterCacheTime < BOOSTER_CACHE_MS)) {
        return boosterCacheData;
    }
    
    // 🔥 If there was a recent error, don't retry immediately
    if (boosterLastError && (now - boosterLastError < BOOSTER_ERROR_COOLDOWN_MS)) {
        // Return cached data or default
        return boosterCacheData || {
            highestBoost: 0,
            boostName: 'None',
            imageUrl: 'assets/bkc_logo_3d.png',
            tokenId: null,
            source: 'none'
        };
    }
    
    // 🔥 Prevent concurrent calls
    if (boosterLoadInProgress) {
        // Wait a bit and return cached data
        await wait(100);
        return boosterCacheData || {
            highestBoost: 0,
            boostName: 'None',
            imageUrl: 'assets/bkc_logo_3d.png',
            tokenId: null,
            source: 'none'
        };
    }
    
    boosterLoadInProgress = true;
    
    try {
        // Only load if cache is stale
        await loadMyBoostersFromAPI();

        let maxBoost = 0;
        let bestTokenId = null;
        let source = 'none';

        // Check owned boosters
        if (State.myBoosters && State.myBoosters.length > 0) {
            const highestOwned = State.myBoosters.reduce(
                (max, b) => (b.boostBips > max.boostBips ? b : max),
                State.myBoosters[0]
            );
            if (highestOwned.boostBips > maxBoost) {
                maxBoost = highestOwned.boostBips;
                bestTokenId = highestOwned.tokenId;
                source = 'owned';
            }
        }

        // Check rented boosters
        if (State.myRentals && State.myRentals.length > 0) {
            const highestRented = State.myRentals.reduce(
                (max, r) => (r.boostBips > max.boostBips ? r : max),
                State.myRentals[0]
            );
            if (highestRented.boostBips > maxBoost) {
                maxBoost = highestRented.boostBips;
                bestTokenId = highestRented.tokenId;
                source = 'rented';
            }
        }

        const tier = boosterTiers.find(t => t.boostBips === maxBoost);
        const imageUrl = tier?.realImg || tier?.img || 'assets/bkc_logo_3d.png';
        const nftName = tier?.name ? `${tier.name} Booster` : (source !== 'none' ? 'Booster NFT' : 'None');

        const result = {
            highestBoost: maxBoost,
            boostName: nftName,
            imageUrl,
            tokenId: bestTokenId ? bestTokenId.toString() : null,
            source: source
        };
        
        // 🔥 Cache the result
        boosterCacheData = result;
        boosterCacheTime = now;
        
        return result;
        
    } catch (e) {
        console.warn("Error in getHighestBoosterBoostFromAPI:", e.message);
        boosterLastError = now;
        
        // Return cached data or default
        return boosterCacheData || {
            highestBoost: 0,
            boostName: 'None',
            imageUrl: 'assets/bkc_logo_3d.png',
            tokenId: null,
            source: 'none'
        };
    } finally {
        boosterLoadInProgress = false;
    }
}

// Internal helper to get booster info
async function getBoosterInfo(tokenId) {
    const minABI = ["function boostBips(uint256) view returns (uint256)"];
    const contractToUse = getContractInstance(
        addresses.rewardBoosterNFT,
        minABI,
        State.rewardBoosterContractPublic
    );

    if (!contractToUse) {
        return { boostBips: 0, img: 'assets/bkc_logo_3d.png', name: 'Unknown' };
    }

    try {
        const boostBips = await safeContractCall(
            contractToUse,
            'boostBips',
            [tokenId],
            0n
        );
        
        const bipsNum = Number(boostBips);
        const tier = boosterTiers.find(t => t.boostBips === bipsNum);
        
        return {
            boostBips: bipsNum,
            img: tier?.img || 'assets/bkc_logo_3d.png',
            name: tier?.name || `Booster #${tokenId}`
        };
        
    } catch {
        return { boostBips: 0, img: 'assets/bkc_logo_3d.png', name: 'Unknown' };
    }
}

// ====================================================================
// 6. REWARDS CALCULATION
// ====================================================================

export async function calculateUserTotalRewards() {
    if (!State.isConnected || !State.delegationManagerContract) {
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }
    
    try {
        const stakingRewards = await safeContractCall(
            State.delegationManagerContract,
            'pendingRewards',
            [State.userAddress],
            0n
        );
        return { stakingRewards, minerRewards: 0n, totalRewards: stakingRewards };
        
    } catch (e) {
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }
}

export async function calculateClaimDetails() {
    if (!State.delegationManagerContract || !State.userAddress) {
        return { netClaimAmount: 0n, feeAmount: 0n, discountPercent: 0, totalRewards: 0n };
    }

    const { totalRewards } = await calculateUserTotalRewards();
    if (totalRewards === 0n) {
        return { netClaimAmount: 0n, feeAmount: 0n, discountPercent: 0, totalRewards: 0n };
    }

    // Get fee from system data (default 50% for V3.1)
    let baseFeeBips = State.systemFees?.CLAIM_REWARD_FEE_BIPS || 5000n;
    
    // 🔥 CHANGED: Use cached booster data, don't call API again
    const boosterData = await getHighestBoosterBoostFromAPI();
    let discountBips = State.boosterDiscounts?.[boosterData.highestBoost] || 0n;

    // 🔥 FIX: Proportional discount calculation (same as contract)
    // finalFee = baseFee - (baseFee × discountBips / 10000)
    const discountAmount = (baseFeeBips * discountBips) / 10000n;
    const finalFeeBips = baseFeeBips > discountAmount ? baseFeeBips - discountAmount : 0n;
    const feeAmount = (totalRewards * finalFeeBips) / 10000n;

    return {
        netClaimAmount: totalRewards - feeAmount,
        feeAmount,
        discountPercent: Number(discountBips) / 100,
        baseFeeBips: Number(baseFeeBips),
        finalFeeBips: Number(finalFeeBips),
        totalRewards
    };
}

// ====================================================================
// 7. BOOSTER LOADING WITH GHOST BUSTER (🔥 FIXED)
// ====================================================================

export async function loadMyBoostersFromAPI(forceRefresh = false) {
    if (!State.userAddress) return [];
    
    const now = Date.now();
    
    // 🔥 Check cache first (unless force refresh)
    if (!forceRefresh && State.myBoosters && State.myBoosters.length > 0) {
        if (now - boosterCacheTime < BOOSTER_CACHE_MS) {
            return State.myBoosters;
        }
    }
    
    // 🔥 If there was a recent API error, don't retry
    if (!forceRefresh && boosterLastError && (now - boosterLastError < BOOSTER_ERROR_COOLDOWN_MS)) {
        console.log("Booster API in cooldown, using cached data");
        return State.myBoosters || [];
    }

    try {
        // 1. Get list from API
        const response = await fetchWithTimeout(
            `${API_ENDPOINTS.getBoosters}/${State.userAddress}`,
            5000
        );
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        let ownedTokensAPI = await response.json();

        // 2. Ghost Buster: Verify ownership on-chain
        const minABI = ["function ownerOf(uint256) view returns (address)"];
        const contract = getContractInstance(
            addresses.rewardBoosterNFT,
            minABI,
            State.rewardBoosterContractPublic
        );

        if (contract && ownedTokensAPI.length > 0) {
            const checks = await Promise.all(
                ownedTokensAPI.slice(0, 50).map(async (token) => { // Limit to 50
                    const id = BigInt(token.tokenId);
                    const cacheKey = `ownerOf-${id}`;

                    // Check local cache first
                    if (!forceRefresh && ownershipCache.has(cacheKey)) {
                        const cachedData = ownershipCache.get(cacheKey);
                        if (now - cachedData.timestamp < OWNERSHIP_CACHE_MS) {
                            if (cachedData.owner.toLowerCase() === State.userAddress.toLowerCase()) {
                                return {
                                    tokenId: id,
                                    boostBips: Number(token.boostBips || 0)
                                };
                            }
                            return null; // Sold
                        }
                    }

                    try {
                        const owner = await contract.ownerOf(id);
                        ownershipCache.set(cacheKey, { owner, timestamp: now });

                        if (owner.toLowerCase() === State.userAddress.toLowerCase()) {
                            return {
                                tokenId: id,
                                boostBips: Number(token.boostBips || 0)
                            };
                        }
                        return null; // Recently sold
                        
                    } catch (e) {
                        // On RPC error, trust API optimistically
                        if (isRateLimitError(e) || isRpcError(e)) {
                            return {
                                tokenId: id,
                                boostBips: Number(token.boostBips || 0)
                            };
                        }
                        return null;
                    }
                })
            );

            State.myBoosters = checks.filter(t => t !== null);
            
        } else {
            State.myBoosters = ownedTokensAPI.map(tokenData => ({
                tokenId: BigInt(tokenData.tokenId),
                boostBips: Number(tokenData.boostBips || 0)
            }));
        }
        
        // 🔥 Update cache timestamp on success
        boosterCacheTime = now;
        boosterLastError = 0; // Clear error state

        return State.myBoosters;

    } catch (e) {
        console.warn("Error fetching boosters:", e.message);
        
        // 🔥 Mark error time to prevent rapid retries
        boosterLastError = now;
        
        // Keep existing data on error
        if (!State.myBoosters) State.myBoosters = [];
        return State.myBoosters;
    }
}

// ====================================================================
// 8. UTILITY EXPORTS
// ====================================================================

// Clear all caches (useful after transactions)
export function clearAllCaches() {
    contractReadCache.clear();
    ownershipCache.clear();
    balanceCache.clear();
    systemDataCache = null;
    systemDataCacheTime = 0;
    
    // 🔥 Also clear booster cache
    boosterCacheData = null;
    boosterCacheTime = 0;
    boosterLastError = 0;
}

// Force refresh all user data
export async function forceRefreshUserData() {
    clearAllCaches();
    await loadUserData(true);
    await loadUserDelegations(true);
    await loadUserRentals(true);
}

// ====================================================================
// FORTUNE POOL DATA FUNCTIONS
// ====================================================================

export async function loadFortunePoolData(forceRefresh = false) {
    const contract = State.actionsManagerContractPublic || State.actionsManagerContract;
    
    if (!contract) {
        State.fortunePool = { 
            active: false, 
            activeTiers: 0, 
            prizePool: 0n,
            tiers: [],
            oracleFee1x: 0n,
            oracleFee5x: 0n
        };
        return State.fortunePool;
    }

    const cacheKey = 'fortunePool-status';
    const now = Date.now();

    if (!forceRefresh && contractReadCache.has(cacheKey)) {
        const cached = contractReadCache.get(cacheKey);
        if (now - cached.timestamp < CONTRACT_READ_CACHE_MS) {
            State.fortunePool = cached.value;
            return cached.value;
        }
    }

    try {
        // Parallel fetch core data
        const [activeTierCount, prizePool, gameCounter] = await Promise.allSettled([
            safeContractCall(contract, 'activeTierCount', [], 0n),
            safeContractCall(contract, 'prizePoolBalance', [], 0n),
            safeContractCall(contract, 'gameCounter', [], 0n)
        ]);

        const tierCount = Number(activeTierCount.status === 'fulfilled' ? activeTierCount.value : 0n);
        const pool = prizePool.status === 'fulfilled' ? BigInt(prizePool.value.toString()) : 0n;
        const games = Number(gameCounter.status === 'fulfilled' ? gameCounter.value : 0n);

        // Get oracle fees
        let oracleFee1x = ethers.parseEther("0.001");
        let oracleFee5x = ethers.parseEther("0.005");
        
        try {
            const [fee1x, fee5x] = await Promise.all([
                contract.getRequiredOracleFee(false),
                contract.getRequiredOracleFee(true)
            ]);
            oracleFee1x = BigInt(fee1x.toString());
            oracleFee5x = BigInt(fee5x.toString());
        } catch (e) {
            try {
                const baseFee = await contract.oracleFee();
                oracleFee1x = BigInt(baseFee.toString());
                oracleFee5x = oracleFee1x * 5n;
            } catch {}
        }

        // Load tier details
        const tiers = [];
        for (let i = 0; i < Math.min(tierCount, 10); i++) {
            try {
                const tier = await safeContractCall(contract, 'prizeTiers', [i], null);
                if (tier && tier.active) {
                    tiers.push({
                        tierId: i,
                        maxRange: Number(tier.maxRange || tier[0]),
                        multiplierBips: Number(tier.multiplierBips || tier[1]),
                        multiplier: Number(tier.multiplierBips || tier[1]) / 10000,
                        active: tier.active || tier[2]
                    });
                }
            } catch {}
        }

        const fortuneData = {
            active: tierCount > 0,
            activeTiers: tierCount,
            prizePool: pool,
            gameCounter: games,
            oracleFee1x,
            oracleFee5x,
            tiers
        };

        // Cache result
        contractReadCache.set(cacheKey, { value: fortuneData, timestamp: now });
        State.fortunePool = fortuneData;

        return fortuneData;

    } catch (e) {
        console.warn("Fortune Pool data load failed:", e.message);
        State.fortunePool = { 
            active: false, 
            activeTiers: 0, 
            prizePool: 0n,
            tiers: [],
            oracleFee1x: ethers.parseEther("0.001"),
            oracleFee5x: ethers.parseEther("0.005")
        };
        return State.fortunePool;
    }
}

export async function loadUserFortuneHistory(userAddress, limit = 20) {
    if (!userAddress) return [];

    const contract = State.actionsManagerContractPublic || State.actionsManagerContract;
    if (!contract) return [];

    try {
        const filter = contract.filters.GameFulfilled(null, userAddress);
        const events = await contract.queryFilter(filter, -10000);

        const games = events.slice(-limit).reverse().map(event => {
            const args = event.args;
            return {
                gameId: Number(args.gameId),
                player: args.player,
                prizeWon: BigInt(args.prizeWon?.toString() || '0'),
                rolls: args.rolls?.map(r => Number(r)) || [],
                guesses: args.guesses?.map(g => Number(g)) || [],
                isCumulative: args.isCumulative,
                txHash: event.transactionHash,
                blockNumber: event.blockNumber,
                won: BigInt(args.prizeWon?.toString() || '0') > 0n
            };
        });

        State.userFortuneHistory = games;
        return games;

    } catch (e) {
        console.warn("Fortune history load failed:", e.message);
        return [];
    }
}

export function calculateExpectedPayout(wagerAmount, tierIndex, isWin) {
    if (!State.fortunePool?.tiers || !isWin) return 0n;
    
    const tier = State.fortunePool.tiers[tierIndex];
    if (!tier) return 0n;

    const wager = BigInt(wagerAmount);
    const multiplierBips = BigInt(tier.multiplierBips);
    
    return (wager * multiplierBips) / 10000n;
}

export async function getExpectedGuessCount(isCumulative) {
    const contract = State.actionsManagerContractPublic || State.actionsManagerContract;
    
    if (!contract) {
        return isCumulative ? 3 : 1;
    }

    try {
        const count = await contract.getExpectedGuessCount(isCumulative);
        return Number(count);
    } catch (e) {
        if (isCumulative) {
            return State.fortunePool?.activeTiers || 3;
        }
        return 1;
    }
}