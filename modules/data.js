// js/modules/data.js
// ✅ PRODUCTION V7.1 - FortunePool V2 Support (Instant Resolution)

const ethers = window.ethers;

import { State } from '../state.js';
import { addresses, boosterTiers, rentalManagerABI, rewardBoosterABI } from '../config.js';

// ====================================================================
// CONSTANTS & CONFIGURATION
// ====================================================================
const API_TIMEOUT_MS = 5000;
const CACHE_DURATION_MS = 60000;
const CONTRACT_READ_CACHE_MS = 15000;
const OWNERSHIP_CACHE_MS = 30000;
const BALANCE_CACHE_MS = 10000;

let systemDataCache = null;
let systemDataCacheTime = 0;

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
    fortuneGames: 'https://getfortunegames-4wvdcuoouq-uc.a.run.app',
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
        errorCode === -32603 ||
        errorCode === -32000 ||
        e.message?.includes("Internal JSON-RPC")
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

    const serializedArgs = JSON.stringify(args, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
    const cacheKey = `${contractAddr}-${method}-${serializedArgs}`;
    const now = Date.now();

    const cacheableMethods = [
        'getPoolInfo', 'getBuyPrice', 'getSellPrice', 'getAvailableTokenIds',
        'getAllListedTokenIds', 'tokenURI', 'boostBips', 'getListing',
        'balanceOf', 'totalSupply', 'totalNetworkPStake', 'MAX_SUPPLY', 'TGE_SUPPLY',
        'userTotalPStake', 'pendingRewards', 'isRented', 'getRental', 'ownerOf',
        'getDelegationsOf', 'allowance', 'prizeTiers', 'activeTierCount', 'prizePoolBalance',
        // V2 FortunePool methods
        'serviceFee', 'getRequiredServiceFee', 'getAllTiers', 'getTier', 'gameCounter',
        'getPoolStats', 'getExpectedGuessCount'
    ];

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
            
            if (cacheableMethods.includes(method)) {
                contractReadCache.set(cacheKey, { value: result, timestamp: now });
            }
            
            return result;

        } catch (e) {
            lastError = e;
            
            if (isRateLimitError(e) && attempt < retries) {
                const jitter = Math.floor(Math.random() * 1000);
                const delay = 1000 * Math.pow(2, attempt) + jitter;
                await wait(delay);
                continue;
            }
            
            if (isRpcError(e) && attempt < retries) {
                await wait(500);
                continue;
            }
            
            break;
        }
    }
    
    return fallbackValue;
};

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
// 1. GLOBAL SYSTEM DATA
// ====================================================================

export async function loadSystemDataFromAPI() {
    if (!State.systemFees) State.systemFees = {};
    if (!State.systemPStakes) State.systemPStakes = {};
    if (!State.boosterDiscounts) State.boosterDiscounts = {};

    const now = Date.now();
    
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
// 2. USER DATA
// ====================================================================

export async function loadUserData(forceRefresh = false) {
    if (!State.isConnected || !State.userAddress) return;

    try {
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

        await loadMyBoostersFromAPI(forceRefresh);

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
// 3. DELEGATIONS
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
            unlockTime: BigInt(d[1] || d.unlockTime || 0),
            lockDuration: BigInt(d[2] || d.lockDuration || 0),
            index
        }));
        
        return State.userDelegations;
        
    } catch (e) {
        console.error("Error loading delegations:", e);
        return [];
    }
}

// ====================================================================
// 4. RENTAL MARKET
// ====================================================================

export async function loadRentalListings(forceRefresh = false) {
    let listingsFromApi = [];
    
    try {
        const response = await fetchWithTimeout(API_ENDPOINTS.getRentalListings, 4000);
        if (response.ok) {
            listingsFromApi = await response.json();
        }
    } catch (e) {}
    
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
            true
        );
        
        if (!listedIds || listedIds.length === 0) {
            State.rentalListings = [];
            return [];
        }

        const listingsToFetch = listedIds.slice(0, 30);

        const listingsPromises = listingsToFetch.map(async (tokenId) => {
            try {
                const listing = await safeContractCall(
                    rentalContract,
                    'getListing',
                    [tokenId],
                    null,
                    1,
                    true
                );
                
                if (listing && listing.isActive) {
                    const rentalInfo = await safeContractCall(
                        rentalContract,
                        'getRental',
                        [tokenId],
                        null,
                        1,
                        true
                    );
                    
                    const boostInfo = await getBoosterInfo(tokenId);
                    const nowSec = Math.floor(Date.now() / 1000);
                    const isCurrentlyRented = rentalInfo && BigInt(rentalInfo.endTime || 0) > BigInt(nowSec);
                    
                    return {
                        tokenId: tokenId.toString(),
                        owner: listing.owner,
                        pricePerHour: listing.pricePerHour?.toString() || listing.price?.toString() || '0',
                        minHours: listing.minHours?.toString() || '1',
                        maxHours: listing.maxHours?.toString() || '1',
                        totalEarnings: listing.totalEarnings?.toString() || '0',
                        rentalCount: Number(listing.rentalCount || 0),
                        boostBips: boostInfo.boostBips,
                        img: boostInfo.img || './assets/nft.png',
                        name: boostInfo.name,
                        isRented: isCurrentlyRented,
                        currentTenant: isCurrentlyRented ? rentalInfo.tenant : null,
                        rentalEndTime: isCurrentlyRented ? rentalInfo.endTime?.toString() : null
                    };
                }
            } catch (e) {}
            return null;
        });

        const results = await Promise.all(listingsPromises);
        const validListings = results.filter(l => l !== null);

        State.rentalListings = validListings;
        return validListings;

    } catch (e) {
        State.rentalListings = [];
        return [];
    }
}

export async function loadUserRentals(forceRefresh = false) {
    if (!State.userAddress) {
        State.myRentals = [];
        return [];
    }

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
    } catch (e) {}

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
                        tenant: rental.tenant,
                        startTime: rental.startTime?.toString() || '0',
                        endTime: rental.endTime?.toString() || '0',
                        paidAmount: rental.paidAmount?.toString() || '0',
                        boostBips: boostInfo.boostBips,
                        img: boostInfo.img,
                        name: boostInfo.name
                    });
                }
            } catch (e) {}
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
            img: tier?.img || './assets/nft.png',
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
// 7. BOOSTER LOADING
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

        let ownedTokensAPI = await response.json();

        const minABI = [
            "function ownerOf(uint256) view returns (address)",
            "function boostBips(uint256) view returns (uint256)"
        ];
        const contract = getContractInstance(
            addresses.rewardBoosterNFT,
            minABI,
            State.rewardBoosterContractPublic
        );

        if (contract && ownedTokensAPI.length > 0) {
            const checks = await Promise.all(
                ownedTokensAPI.slice(0, 50).map(async (token) => {
                    const id = BigInt(token.tokenId);
                    const cacheKey = `ownerOf-${id}`;
                    const nowTs = Date.now();

                    let tokenBoostBips = Number(token.boostBips || token.boost || 0);
                    
                    if (tokenBoostBips === 0) {
                        try {
                            const chainBoostBips = await contract.boostBips(id);
                            tokenBoostBips = Number(chainBoostBips);
                        } catch (e) {}
                    }

                    if (!forceRefresh && ownershipCache.has(cacheKey)) {
                        const cachedData = ownershipCache.get(cacheKey);
                        if (nowTs - cachedData.timestamp < OWNERSHIP_CACHE_MS) {
                            if (cachedData.owner.toLowerCase() === State.userAddress.toLowerCase()) {
                                return {
                                    tokenId: id,
                                    boostBips: tokenBoostBips,
                                    imageUrl: token.imageUrl || token.image || null
                                };
                            }
                            return null;
                        }
                    }

                    try {
                        const owner = await contract.ownerOf(id);
                        ownershipCache.set(cacheKey, { owner, timestamp: nowTs });

                        if (owner.toLowerCase() === State.userAddress.toLowerCase()) {
                            return {
                                tokenId: id,
                                boostBips: tokenBoostBips,
                                imageUrl: token.imageUrl || token.image || null
                            };
                        }
                        return null;
                        
                    } catch (e) {
                        if (isRateLimitError(e) || isRpcError(e)) {
                            return {
                                tokenId: id,
                                boostBips: tokenBoostBips,
                                imageUrl: token.imageUrl || token.image || null
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
                boostBips: Number(tokenData.boostBips || tokenData.boost || 0),
                imageUrl: tokenData.imageUrl || tokenData.image || null
            }));
        }
        
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
}

export async function forceRefreshUserData() {
    clearAllCaches();
    await loadUserData(true);
    await loadUserDelegations(true);
    await loadUserRentals(true);
}

// ====================================================================
// 9. FORTUNE POOL DATA (V2 - Instant Resolution)
// ====================================================================

export async function loadFortunePoolData(forceRefresh = false) {
    // V2: Use fortunePoolContract if available, fallback to actionsManager
    const contract = State.fortunePoolContract || State.fortunePoolContractPublic || 
                     State.actionsManagerContractPublic || State.actionsManagerContract;
    
    if (!contract) {
        State.fortunePool = { 
            active: false, 
            activeTiers: 0, 
            prizePool: 0n,
            tiers: [],
            serviceFee1x: 0n,
            serviceFee5x: 0n,
            // Backwards compatibility
            oracleFee1x: 0n,
            oracleFee5x: 0n
        };
        return State.fortunePool;
    }

    const cacheKey = 'fortunePool-status-v2';
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

        // V2: Try serviceFee first, fallback to oracleFee for backwards compatibility
        let serviceFee1x = 0n;
        let serviceFee5x = 0n;
        
        try {
            // Try V2 method first (getRequiredServiceFee)
            const [fee1x, fee5x] = await Promise.all([
                contract.getRequiredServiceFee(false).catch(() => null),
                contract.getRequiredServiceFee(true).catch(() => null)
            ]);
            
            if (fee1x !== null && fee5x !== null) {
                serviceFee1x = BigInt(fee1x.toString());
                serviceFee5x = BigInt(fee5x.toString());
            } else {
                // Fallback to V1 method (getRequiredOracleFee)
                const [oFee1x, oFee5x] = await Promise.all([
                    contract.getRequiredOracleFee(false),
                    contract.getRequiredOracleFee(true)
                ]);
                serviceFee1x = BigInt(oFee1x.toString());
                serviceFee5x = BigInt(oFee5x.toString());
            }
        } catch (e) {
            // Ultimate fallback: read base fee and multiply
            try {
                const baseFee = await contract.serviceFee().catch(() => contract.oracleFee());
                serviceFee1x = BigInt(baseFee.toString());
                serviceFee5x = serviceFee1x * 5n;
            } catch {
                // Use defaults if all else fails
                serviceFee1x = ethers.parseEther("0.001");
                serviceFee5x = ethers.parseEther("0.005");
            }
        }

        // V2: Try getAllTiers first for efficiency
        let tiers = [];
        try {
            const [ranges, multipliers] = await contract.getAllTiers();
            tiers = ranges.map((range, i) => ({
                tierId: i + 1,
                maxRange: Number(range),
                multiplierBips: Number(multipliers[i]),
                multiplier: Number(multipliers[i]) / 10000,
                active: true
            }));
        } catch {
            // Fallback: read tiers individually (V1 style)
            for (let i = 1; i <= Math.min(tierCount, 10); i++) {
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
        }

        const fortuneData = {
            active: tierCount > 0,
            activeTiers: tierCount,
            prizePool: pool,
            gameCounter: games,
            // V2 naming
            serviceFee1x,
            serviceFee5x,
            // Backwards compatibility
            oracleFee1x: serviceFee1x,
            oracleFee5x: serviceFee5x,
            tiers
        };

        contractReadCache.set(cacheKey, { value: fortuneData, timestamp: now });
        State.fortunePool = fortuneData;

        return fortuneData;

    } catch (e) {
        console.error("loadFortunePoolData error:", e);
        State.fortunePool = { 
            active: false, 
            activeTiers: 0, 
            prizePool: 0n,
            tiers: [],
            serviceFee1x: ethers.parseEther("0.001"),
            serviceFee5x: ethers.parseEther("0.005"),
            oracleFee1x: ethers.parseEther("0.001"),
            oracleFee5x: ethers.parseEther("0.005")
        };
        return State.fortunePool;
    }
}

export async function loadUserFortuneHistory(userAddress, limit = 20) {
    if (!userAddress) return [];

    const contract = State.fortunePoolContract || State.fortunePoolContractPublic ||
                     State.actionsManagerContractPublic || State.actionsManagerContract;
    if (!contract) return [];

    try {
        // V2: Try GamePlayed event first (instant resolution)
        let events = [];
        try {
            const filterV2 = contract.filters.GamePlayed(null, userAddress);
            events = await contract.queryFilter(filterV2, -10000);
        } catch {
            // Fallback to V1 event (GameFulfilled)
            try {
                const filterV1 = contract.filters.GameFulfilled(null, userAddress);
                events = await contract.queryFilter(filterV1, -10000);
            } catch {}
        }

        const games = events.slice(-limit).reverse().map(event => {
            const args = event.args;
            return {
                gameId: Number(args.gameId),
                player: args.player,
                prizeWon: BigInt(args.prizeWon?.toString() || '0'),
                wagerAmount: BigInt(args.wagerAmount?.toString() || '0'),
                rolls: args.rolls?.map(r => Number(r)) || [],
                guesses: args.guesses?.map(g => Number(g)) || [],
                isCumulative: args.isCumulative,
                matchCount: Number(args.matchCount || 0),
                txHash: event.transactionHash,
                blockNumber: event.blockNumber,
                won: BigInt(args.prizeWon?.toString() || '0') > 0n
            };
        });

        State.userFortuneHistory = games;
        return games;

    } catch (e) {
        console.error("loadUserFortuneHistory error:", e);
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