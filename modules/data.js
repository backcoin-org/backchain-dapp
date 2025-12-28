// js/modules/data.js
// ✅ PRODUCTION V8.0 - Rate Limit Protection + Aggressive Caching
//
// V8.0 IMPROVEMENTS:
// - Global RPC block flag - stops ALL calls when rate limited
// - Auto-recovery after 60 seconds
// - Firebase/API first strategy - RPC only as fallback
// - Aggressive caching to minimize RPC calls
// - Visual feedback when RPC is blocked
//

const ethers = window.ethers;

import { State } from '../state.js';
import { addresses, boosterTiers, rentalManagerABI, rewardBoosterABI } from '../config.js';

// ====================================================================
// CONFIGURATION
// ====================================================================

const API_TIMEOUT_MS = 5000;
const CACHE_DURATION_MS = 60000;          // 1 minute cache for API data
const CONTRACT_READ_CACHE_MS = 30000;      // 30 seconds cache for contract reads
const OWNERSHIP_CACHE_MS = 60000;          // 1 minute cache for ownership
const BALANCE_CACHE_MS = 30000;            // 30 seconds cache for balances
const RPC_BLOCK_DURATION_MS = 60000;       // Block RPC for 1 minute after rate limit
const RPC_COOLDOWN_MS = 500;               // Minimum 500ms between RPC calls

// ====================================================================
// GLOBAL RPC PROTECTION
// ====================================================================

let rpcBlocked = false;
let rpcBlockedUntil = 0;
let lastRpcCall = 0;
let consecutiveRpcErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 3;

/**
 * Check if RPC is currently blocked
 */
function isRpcBlocked() {
    if (!rpcBlocked) return false;
    
    if (Date.now() > rpcBlockedUntil) {
        // Unblock after timeout
        rpcBlocked = false;
        consecutiveRpcErrors = 0;
        console.log('🟢 RPC unblocked - resuming normal operations');
        return false;
    }
    
    return true;
}

/**
 * Block RPC calls for a period
 */
function blockRpc(reason = 'rate limit') {
    rpcBlocked = true;
    rpcBlockedUntil = Date.now() + RPC_BLOCK_DURATION_MS;
    console.warn(`🔴 RPC BLOCKED for ${RPC_BLOCK_DURATION_MS/1000}s - reason: ${reason}`);
    
    // Show user-friendly message
    if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('⏳ Network busy, using cached data...', 'warning');
    }
}

/**
 * Throttle RPC calls
 */
async function throttleRpc() {
    const now = Date.now();
    const timeSinceLastCall = now - lastRpcCall;
    
    if (timeSinceLastCall < RPC_COOLDOWN_MS) {
        await wait(RPC_COOLDOWN_MS - timeSinceLastCall);
    }
    
    lastRpcCall = Date.now();
}

// ====================================================================
// CACHES
// ====================================================================

let systemDataCache = null;
let systemDataCacheTime = 0;

const contractReadCache = new Map();
const ownershipCache = new Map();
const balanceCache = new Map();

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ====================================================================
// SAFE FETCH WITH TIMEOUT
// ====================================================================

async function fetchWithTimeout(url, timeoutMs = API_TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('API timeout');
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
    fortuneGames: 'https://getfortunegames-4wvdcuoouq-uc.a.run.app',
    uploadFileToIPFS: '/api/upload',
    claimAirdrop: 'https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop',
    getUserBalance: 'https://getuserbalance-4wvdcuoouq-uc.a.run.app'
};

// ====================================================================
// ERROR DETECTION
// ====================================================================

function isRateLimitError(e) {
    const msg = e?.message || '';
    const code = e?.error?.code || e?.code;
    
    return (
        code === 429 ||
        code === -32002 ||
        msg.includes('429') ||
        msg.includes('Too Many Requests') ||
        msg.includes('rate limit') ||
        msg.includes('too many errors') ||
        msg.includes('retrying in')
    );
}

function isRpcError(e) {
    const code = e?.error?.code || e?.code;
    const msg = e?.message || '';
    
    return (
        code === -32603 ||
        code === -32000 ||
        code === -32002 ||
        msg.includes('Internal JSON-RPC') ||
        msg.includes('missing revert data')
    );
}

function getContractInstance(address, abi, fallbackStateContract) {
    if (fallbackStateContract) return fallbackStateContract;
    if (!address || !State.publicProvider) return null;
    try {
        return new ethers.Contract(address, abi, State.publicProvider);
    } catch (e) {
        return null;
    }
}

// ====================================================================
// SAFE CONTRACT CALL WITH CACHE & PROTECTION
// ====================================================================

export const safeContractCall = async (
    contract, 
    method, 
    args = [], 
    fallbackValue = 0n, 
    retries = 1, 
    forceRefresh = false
) => {
    if (!contract) return fallbackValue;

    // Check if RPC is blocked
    if (isRpcBlocked()) {
        // Try to return cached value
        const contractAddr = contract.target || contract.address;
        const serializedArgs = JSON.stringify(args, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        const cacheKey = `${contractAddr}-${method}-${serializedArgs}`;
        
        const cached = contractReadCache.get(cacheKey);
        if (cached) {
            return cached.value;
        }
        
        return fallbackValue;
    }

    const contractAddr = contract.target || contract.address;
    const serializedArgs = JSON.stringify(args, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
    const cacheKey = `${contractAddr}-${method}-${serializedArgs}`;
    const now = Date.now();

    // Check cache first (extended list of cacheable methods)
    const cacheableMethods = [
        'getPoolInfo', 'getBuyPrice', 'getSellPrice', 'getAvailableTokenIds',
        'getAllListedTokenIds', 'tokenURI', 'boostBips', 'getListing',
        'balanceOf', 'totalSupply', 'totalNetworkPStake', 'MAX_SUPPLY', 'TGE_SUPPLY',
        'userTotalPStake', 'pendingRewards', 'isRented', 'getRental', 'ownerOf',
        'getDelegationsOf', 'allowance', 'prizeTiers', 'activeTierCount', 'prizePoolBalance',
        'gameCounter', 'serviceFee', 'getRequiredServiceFee', 'getRequiredOracleFee'
    ];

    if (!forceRefresh && cacheableMethods.includes(method)) {
        const cached = contractReadCache.get(cacheKey);
        if (cached && (now - cached.timestamp < CONTRACT_READ_CACHE_MS)) {
            return cached.value;
        }
    }

    // Throttle RPC calls
    await throttleRpc();

    // Try the call
    try {
        const result = await contract[method](...args);
        
        // Cache the result
        contractReadCache.set(cacheKey, { value: result, timestamp: now });
        
        // Reset error counter on success
        consecutiveRpcErrors = 0;
        
        return result;

    } catch (e) {
        consecutiveRpcErrors++;
        
        // Check if we should block RPC
        if (isRateLimitError(e)) {
            blockRpc('rate limit detected');
        } else if (consecutiveRpcErrors >= MAX_CONSECUTIVE_ERRORS) {
            blockRpc(`${consecutiveRpcErrors} consecutive errors`);
        }
        
        // Return cached value if available
        const cached = contractReadCache.get(cacheKey);
        if (cached) {
            return cached.value;
        }
        
        return fallbackValue;
    }
};

export const safeBalanceOf = async (contract, address, forceRefresh = false) => {
    const cacheKey = `balance-${contract?.target || contract?.address}-${address}`;
    const now = Date.now();
    
    // Return cached if not forcing refresh
    if (!forceRefresh) {
        const cached = balanceCache.get(cacheKey);
        if (cached && (now - cached.timestamp < BALANCE_CACHE_MS)) {
            return cached.value;
        }
    }
    
    // If RPC is blocked, return cached or 0
    if (isRpcBlocked()) {
        const cached = balanceCache.get(cacheKey);
        return cached?.value || 0n;
    }
    
    const balance = await safeContractCall(contract, 'balanceOf', [address], 0n, 1, forceRefresh);
    balanceCache.set(cacheKey, { value: balance, timestamp: now });
    return balance;
};

// ====================================================================
// 1. GLOBAL SYSTEM DATA (Firebase First)
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
        // Use defaults
        if (!State.systemFees['NOTARY_SERVICE']) State.systemFees['NOTARY_SERVICE'] = 100n;
        if (!State.systemFees['CLAIM_REWARD_FEE_BIPS']) State.systemFees['CLAIM_REWARD_FEE_BIPS'] = 500n;
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
    // Only load from API - no RPC needed
    await loadSystemDataFromAPI();
}

// ====================================================================
// 2. USER DATA (API First, RPC Fallback)
// ====================================================================

export async function loadUserData(forceRefresh = false) {
    if (!State.isConnected || !State.userAddress) return;

    // Try API first for balance
    try {
        const response = await fetchWithTimeout(
            `${API_ENDPOINTS.getUserBalance}/${State.userAddress}`,
            3000
        );
        if (response.ok) {
            const data = await response.json();
            if (data.bkcBalance) {
                State.currentUserBalance = BigInt(data.bkcBalance);
            }
            if (data.ethBalance) {
                State.currentUserNativeBalance = BigInt(data.ethBalance);
            }
        }
    } catch (e) {
        // API failed, try RPC if not blocked
    }

    // Only use RPC if not blocked and API didn't work
    if (!isRpcBlocked()) {
        try {
            // BKC Balance
            if (!State.currentUserBalance || forceRefresh) {
                const balance = await safeBalanceOf(State.bkcTokenContract, State.userAddress, forceRefresh);
                if (balance > 0n) {
                    State.currentUserBalance = balance;
                }
            }
            
            // ETH Balance (only if not set)
            if (!State.currentUserNativeBalance || forceRefresh) {
                try {
                    await throttleRpc();
                    const nativeBalance = await State.provider?.getBalance(State.userAddress);
                    if (nativeBalance) {
                        State.currentUserNativeBalance = nativeBalance;
                    }
                } catch (e) {
                    if (isRateLimitError(e)) {
                        blockRpc('rate limit on getBalance');
                    }
                }
            }

            // User pStake
            if (State.delegationManagerContract) {
                const totalUserPStake = await safeContractCall(
                    State.delegationManagerContract,
                    'userTotalPStake',
                    [State.userAddress],
                    State.userTotalPStake || 0n,
                    1,
                    forceRefresh
                );
                State.userTotalPStake = totalUserPStake;
            }

        } catch (e) {
            console.warn("User data RPC error:", e.message);
        }
    }

    // Always load boosters from API (no RPC needed)
    await loadMyBoostersFromAPI(forceRefresh);
}

// ====================================================================
// 3. DELEGATIONS (RPC with cache)
// ====================================================================

export async function loadUserDelegations(forceRefresh = false) {
    if (!State.isConnected || !State.delegationManagerContract) return [];
    
    // If RPC is blocked, return cached
    if (isRpcBlocked() && State.userDelegations) {
        return State.userDelegations;
    }

    try {
        const delegationsRaw = await safeContractCall(
            State.delegationManagerContract,
            'getDelegationsOf',
            [State.userAddress],
            [],
            1,
            forceRefresh
        );
        
        if (delegationsRaw && delegationsRaw.length > 0) {
            State.userDelegations = delegationsRaw.map((d, index) => ({
                amount: d[0] || d.amount || 0n,
                unlockTime: BigInt(d[1] || d.unlockTime || 0),
                lockDuration: BigInt(d[2] || d.lockDuration || 0),
                index
            }));
        }
        
        return State.userDelegations || [];
        
    } catch (e) {
        console.warn("Error loading delegations:", e.message);
        return State.userDelegations || [];
    }
}

// ====================================================================
// 4. RENTAL MARKET (API First)
// ====================================================================

export async function loadRentalListings(forceRefresh = false) {
    // Always try API first
    try {
        const response = await fetchWithTimeout(API_ENDPOINTS.getRentalListings, 4000);
        if (response.ok) {
            const listingsFromApi = await response.json();
            
            if (listingsFromApi && listingsFromApi.length > 0) {
                const enrichedListings = listingsFromApi.map(item => {
                    const tier = boosterTiers.find(t => t.boostBips === Number(item.boostBips || 0));
                    return {
                        ...item,
                        tokenId: item.tokenId?.toString() || item.id?.toString(),
                        pricePerHour: item.pricePerHour?.toString() || item.price?.toString() || '0',
                        totalEarnings: item.totalEarnings?.toString() || '0',
                        rentalCount: Number(item.rentalCount || 0),
                        img: tier?.img || './assets/nft.png',
                        name: tier?.name || 'Booster NFT'
                    };
                });

                State.rentalListings = enrichedListings;
                return enrichedListings;
            }
        }
    } catch (e) {
        console.warn("Rental API error:", e.message);
    }

    // Return cached if API failed
    return State.rentalListings || [];
}

export async function loadUserRentals(forceRefresh = false) {
    if (!State.userAddress) {
        State.myRentals = [];
        return [];
    }

    // Always try API first
    try {
        const response = await fetchWithTimeout(
            `${API_ENDPOINTS.getUserRentals}/${State.userAddress}`,
            4000
        );
        
        if (response.ok) {
            const myRentalsApi = await response.json();
            const enrichedRentals = myRentalsApi.map(item => {
                const tier = boosterTiers.find(t => t.boostBips === Number(item.boostBips || 0));
                return {
                    ...item,
                    img: tier?.img || './assets/nft.png',
                    name: tier?.name || 'Booster NFT'
                };
            });
            State.myRentals = enrichedRentals;
            return enrichedRentals;
        }
    } catch (e) {
        console.warn("User rentals API error:", e.message);
    }

    // Return cached if API failed
    return State.myRentals || [];
}

// ====================================================================
// 5. BOOSTER HELPERS (API Only - No RPC needed)
// ====================================================================

let cachedBoosterResult = null;
let lastBoosterResultTime = 0;
const BOOSTER_RESULT_CACHE_MS = 30000;

export async function getHighestBoosterBoostFromAPI(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && cachedBoosterResult && (now - lastBoosterResultTime < BOOSTER_RESULT_CACHE_MS)) {
        return cachedBoosterResult;
    }
    
    await loadMyBoostersFromAPI(forceRefresh);

    let maxBoost = 0;
    let bestTokenId = null;
    let source = 'none';

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

    cachedBoosterResult = {
        highestBoost: maxBoost,
        boostName: nftName,
        imageUrl,
        tokenId: bestTokenId ? bestTokenId.toString() : null,
        source: source
    };
    lastBoosterResultTime = Date.now();
    
    return cachedBoosterResult;
}

async function getBoosterInfo(tokenId) {
    // Try to get from cache or tiers first
    const tier = boosterTiers.find(t => {
        // Try to match by tokenId ranges if defined
        return false; // Not easily matchable
    });
    
    // If RPC is blocked, return default
    if (isRpcBlocked()) {
        return { boostBips: 0, img: 'assets/bkc_logo_3d.png', name: `Booster #${tokenId}` };
    }

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
        const matchedTier = boosterTiers.find(t => t.boostBips === bipsNum);
        
        return {
            boostBips: bipsNum,
            img: matchedTier?.img || './assets/nft.png',
            name: matchedTier?.name || `Booster #${tokenId}`
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
    
    // If RPC blocked, return cached
    if (isRpcBlocked()) {
        return State.cachedRewards || { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }
    
    try {
        const stakingRewards = await safeContractCall(
            State.delegationManagerContract,
            'pendingRewards',
            [State.userAddress],
            0n
        );
        
        const result = { stakingRewards, minerRewards: 0n, totalRewards: stakingRewards };
        State.cachedRewards = result;
        return result;
        
    } catch (e) {
        return State.cachedRewards || { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
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

    let baseFeeBips = State.systemFees?.CLAIM_REWARD_FEE_BIPS || 500n;
    
    const boosterData = await getHighestBoosterBoostFromAPI();
    let discountBips = State.boosterDiscounts?.[boosterData.highestBoost] || 0n;

    const finalFeeBips = baseFeeBips > discountBips ? baseFeeBips - discountBips : 0n;
    const feeAmount = (totalRewards * finalFeeBips) / 10000n;

    return {
        netClaimAmount: totalRewards - feeAmount,
        feeAmount,
        discountPercent: Number(discountBips) / 100,
        totalRewards
    };
}

// ====================================================================
// 7. BOOSTER LOADING (API Only)
// ====================================================================

let isLoadingBoosters = false;
let lastBoosterFetch = 0;
let boosterErrorCount = 0;
const BOOSTER_FETCH_THROTTLE_MS = 30000;
const MAX_BOOSTER_ERRORS = 3;
const BOOSTER_ERROR_COOLDOWN_MS = 120000;

export async function loadMyBoostersFromAPI(forceRefresh = false) {
    if (!State.userAddress) return [];

    const now = Date.now();
    
    if (isLoadingBoosters) {
        return State.myBoosters || [];
    }
    
    if (!forceRefresh && (now - lastBoosterFetch < BOOSTER_FETCH_THROTTLE_MS)) {
        return State.myBoosters || [];
    }
    
    if (boosterErrorCount >= MAX_BOOSTER_ERRORS) {
        if (now - lastBoosterFetch < BOOSTER_ERROR_COOLDOWN_MS) {
            return State.myBoosters || [];
        }
        boosterErrorCount = 0;
    }

    isLoadingBoosters = true;
    lastBoosterFetch = now;

    try {
        const response = await fetchWithTimeout(
            `${API_ENDPOINTS.getBoosters}/${State.userAddress}`,
            5000
        );
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const ownedTokensAPI = await response.json();

        // Use API data directly - NO RPC verification (saves tons of calls)
        State.myBoosters = ownedTokensAPI.map(tokenData => ({
            tokenId: BigInt(tokenData.tokenId),
            boostBips: Number(tokenData.boostBips || tokenData.boost || 0),
            imageUrl: tokenData.imageUrl || tokenData.image || null
        }));
        
        boosterErrorCount = 0;
        return State.myBoosters;

    } catch (e) {
        boosterErrorCount++;
        
        if (!State.myBoosters) State.myBoosters = [];
        return State.myBoosters;
    } finally {
        isLoadingBoosters = false;
    }
}

// ====================================================================
// 8. UTILITY EXPORTS
// ====================================================================

export function clearAllCaches() {
    contractReadCache.clear();
    ownershipCache.clear();
    balanceCache.clear();
    systemDataCache = null;
    systemDataCacheTime = 0;
    cachedBoosterResult = null;
    lastBoosterResultTime = 0;
    lastBoosterFetch = 0;
    boosterErrorCount = 0;
    
    // Reset RPC block
    rpcBlocked = false;
    rpcBlockedUntil = 0;
    consecutiveRpcErrors = 0;
}

export async function forceRefreshUserData() {
    // Don't clear RPC block status - just clear caches
    contractReadCache.clear();
    ownershipCache.clear();
    balanceCache.clear();
    
    await loadUserData(true);
    await loadUserDelegations(true);
    await loadUserRentals(true);
}

/**
 * Check if RPC is currently blocked (for UI feedback)
 */
export function getRpcStatus() {
    return {
        blocked: isRpcBlocked(),
        blockedUntil: rpcBlockedUntil,
        consecutiveErrors: consecutiveRpcErrors
    };
}

// ====================================================================
// 9. FORTUNE POOL DATA
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

    // Return cached if RPC is blocked
    if (isRpcBlocked() && State.fortunePool) {
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
        const [activeTierCount, prizePool, gameCounter] = await Promise.allSettled([
            safeContractCall(contract, 'activeTierCount', [], 0n),
            safeContractCall(contract, 'prizePoolBalance', [], 0n),
            safeContractCall(contract, 'gameCounter', [], 0n)
        ]);

        const tierCount = Number(activeTierCount.status === 'fulfilled' ? activeTierCount.value : 0n);
        const pool = prizePool.status === 'fulfilled' ? BigInt(prizePool.value.toString()) : 0n;
        const games = Number(gameCounter.status === 'fulfilled' ? gameCounter.value : 0n);

        let oracleFee1x = ethers.parseEther("0.001");
        let oracleFee5x = ethers.parseEther("0.005");
        
        try {
            const [fee1x, fee5x] = await Promise.all([
                safeContractCall(contract, 'getRequiredOracleFee', [false], oracleFee1x),
                safeContractCall(contract, 'getRequiredOracleFee', [true], oracleFee5x)
            ]);
            oracleFee1x = BigInt(fee1x.toString());
            oracleFee5x = BigInt(fee5x.toString());
        } catch (e) {
            try {
                const baseFee = await safeContractCall(contract, 'oracleFee', [], oracleFee1x);
                oracleFee1x = BigInt(baseFee.toString());
                oracleFee5x = oracleFee1x * 5n;
            } catch {}
        }

        // Load tiers (limit to 5 max to reduce calls)
        const tiers = [];
        for (let i = 1; i <= Math.min(tierCount, 5); i++) {
            try {
                const tier = await safeContractCall(contract, 'prizeTiers', [i], null);
                if (tier && tier.active !== false) {
                    tiers.push({
                        tierId: i,
                        maxRange: Number(tier.maxRange || tier[0]),
                        multiplierBips: Number(tier.multiplierBips || tier[1]),
                        multiplier: Number(tier.multiplierBips || tier[1]) / 10000,
                        active: tier.active ?? tier[2] ?? true
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

        contractReadCache.set(cacheKey, { value: fortuneData, timestamp: now });
        State.fortunePool = fortuneData;

        return fortuneData;

    } catch (e) {
        // Return cached or default
        if (State.fortunePool) return State.fortunePool;
        
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
    // Use API instead of RPC events
    try {
        const response = await fetchWithTimeout(
            `${API_ENDPOINTS.fortuneGames}?player=${userAddress}&limit=${limit}`,
            4000
        );
        
        if (response.ok) {
            const data = await response.json();
            State.userFortuneHistory = data.games || [];
            return State.userFortuneHistory;
        }
    } catch (e) {
        console.warn("Fortune history API error:", e.message);
    }
    
    return State.userFortuneHistory || [];
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
    // Use cached data instead of RPC
    if (State.fortunePool?.activeTiers) {
        return isCumulative ? State.fortunePool.activeTiers : 1;
    }
    
    return isCumulative ? 3 : 1;
}