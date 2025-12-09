// js/modules/data.js
// ✅ VERSÃO V6.1 PRODUCTION-READY: Enhanced Cache + Error Resilience + State Sync

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

let systemDataCache = null;
let systemDataCacheTime = 0;

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
        console.warn("System Data API Failed. Using defaults.");
        // Set safe defaults
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

        // Load boosters (API First, then verify)
        await loadMyBoostersFromAPI(forceRefresh);

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
// 4. RENTAL MARKET (API FIRST STRATEGY)
// ====================================================================

export async function loadRentalListings(forceRefresh = false) {
    // 1. Try API First (Fast)
    try {
        const response = await fetchWithTimeout(API_ENDPOINTS.getRentalListings, 4000);
        if (response.ok) {
            const listingsFromApi = await response.json();

            // Enrich with local tier images
            const enrichedListings = listingsFromApi.map(item => {
                const tier = boosterTiers.find(t => t.boostBips === Number(item.boostBips || 0));
                return {
                    ...item,
                    img: tier?.img || 'assets/bkc_logo_3d.png',
                    name: tier?.name || 'Booster NFT'
                };
            });

            State.rentalListings = enrichedListings;
            return enrichedListings;
        }
    } catch (e) {
        console.warn("API Rental unavailable. Using blockchain fallback...");
    }

    // 2. Fallback: Blockchain (Slower but reliable)
    const rentalContract = getContractInstance(
        addresses.rentalManager,
        rentalManagerABI,
        State.rentalManagerContractPublic
    );
    
    if (!rentalContract) {
        State.rentalListings = [];
        return [];
    }

    try {
        const listedIds = await safeContractCall(
            rentalContract,
            'getAllListedTokenIds',
            [],
            [],
            2,
            forceRefresh
        );
        
        if (!listedIds || listedIds.length === 0) {
            State.rentalListings = [];
            return [];
        }

        // Limit to prevent hanging
        const listingsToFetch = listedIds.slice(0, 30);

        const listingsPromises = listingsToFetch.map(async (tokenId) => {
            try {
                const listing = await safeContractCall(
                    rentalContract,
                    'getListing',
                    [tokenId],
                    null,
                    1,
                    forceRefresh
                );
                
                if (listing && listing.isActive) {
                    const isRented = await safeContractCall(
                        rentalContract,
                        'isRented',
                        [tokenId],
                        false,
                        1,
                        forceRefresh
                    );
                    
                    if (!isRented) {
                        const boostInfo = await getBoosterInfo(tokenId);
                        return {
                            tokenId: tokenId.toString(),
                            owner: listing.owner,
                            price: listing.price?.toString() || '0',
                            boostBips: boostInfo.boostBips,
                            img: boostInfo.img,
                            name: boostInfo.name
                        };
                    }
                }
            } catch (e) {
                // Skip this listing on error
            }
            return null;
        });

        const results = await Promise.all(listingsPromises);
        const validListings = results.filter(l => l !== null);

        State.rentalListings = validListings;
        return validListings;

    } catch (e) {
        console.error("Rental fallback error:", e);
        State.rentalListings = [];
        return [];
    }
}

export async function loadUserRentals(forceRefresh = false) {
    if (!State.userAddress) {
        State.myRentals = [];
        return [];
    }

    // 1. Try API First
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
                    img: tier?.img || 'assets/bkc_logo_3d.png',
                    name: tier?.name || 'Booster NFT'
                };
            });
            State.myRentals = enrichedRentals;
            return enrichedRentals;
        }
    } catch (e) {
        // Silent fallback
    }

    // 2. Fallback: Blockchain
    const rentalContract = getContractInstance(
        addresses.rentalManager,
        rentalManagerABI,
        State.rentalManagerContractPublic
    );
    
    if (!rentalContract) {
        State.myRentals = [];
        return [];
    }

    try {
        const listedIds = await safeContractCall(
            rentalContract,
            'getAllListedTokenIds',
            [],
            [],
            2,
            forceRefresh
        );
        
        const myRentals = [];
        const nowSec = Math.floor(Date.now() / 1000);

        for (const tokenId of listedIds.slice(0, 30)) {
            try {
                const rental = await safeContractCall(
                    rentalContract,
                    'getRental',
                    [tokenId],
                    null,
                    1,
                    forceRefresh
                );
                
                if (rental && 
                    rental.tenant?.toLowerCase() === State.userAddress.toLowerCase() &&
                    BigInt(rental.endTime || 0) > BigInt(nowSec)) {
                    
                    const boostInfo = await getBoosterInfo(tokenId);
                    myRentals.push({
                        tokenId: tokenId.toString(),
                        startTime: rental.startTime?.toString() || '0',
                        endTime: rental.endTime?.toString() || '0',
                        boostBips: boostInfo.boostBips,
                        img: boostInfo.img,
                        name: boostInfo.name
                    });
                }
            } catch (e) {
                // Skip on error
            }
        }

        State.myRentals = myRentals;
        return myRentals;

    } catch (e) {
        State.myRentals = [];
        return [];
    }
}

// ====================================================================
// 5. BOOSTER HELPERS
// ====================================================================

// Gets the best booster (owned or rented) for discount calculation
export async function getHighestBoosterBoostFromAPI() {
    // Ensure fresh data
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

    // Check rented boosters (rentals count for discount!)
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

    return {
        highestBoost: maxBoost,
        boostName: nftName,
        imageUrl,
        tokenId: bestTokenId ? bestTokenId.toString() : null,
        source: source
    };
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

    // Get fee from system data (default 5%)
    let baseFeeBips = State.systemFees?.CLAIM_REWARD_FEE_BIPS || 500n;
    
    // Get booster discount
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
// 7. BOOSTER LOADING WITH GHOST BUSTER
// ====================================================================

export async function loadMyBoostersFromAPI(forceRefresh = false) {
    if (!State.userAddress) return [];

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
                    const now = Date.now();

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

        return State.myBoosters;

    } catch (e) {
        console.warn("Error fetching boosters:", e.message);
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
}

// Force refresh all user data
export async function forceRefreshUserData() {
    clearAllCaches();
    await loadUserData(true);
    await loadUserDelegations(true);
    await loadUserRentals(true);
}