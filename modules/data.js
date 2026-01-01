// js/modules/data.js
// ✅ PRODUCTION V8.0 - FIXED: Use publicProvider for ALL reads (not MetaMask)
// This prevents MetaMask RPC rate limiting errors

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
        e?.code === -32002 ||  // MetaMask rate limit
        (e.message && (
            e.message.includes("429") || 
            e.message.includes("Too Many Requests") || 
            e.message.includes("rate limit") ||
            e.message.includes("too many errors")
        ))
    );
}

function isRpcError(e) {
    const errorCode = e?.error?.code || e?.code;
    return (
        errorCode === -32603 ||
        errorCode === -32000 ||
        errorCode === -32002 ||
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
// 🔥 V8.0: HELPER TO GET PUBLIC CONTRACT (never uses MetaMask for reads)
// ====================================================================

/**
 * Get the public version of a contract for reading data
 * ALWAYS uses publicProvider (Alchemy) to avoid MetaMask rate limits
 */
function getPublicContract(contractName) {
    // Map of signer contracts to their public counterparts
    const publicContracts = {
        'bkcToken': State.bkcTokenContractPublic,
        'delegationManager': State.delegationManagerContractPublic,
        'rentalManager': State.rentalManagerContractPublic,
        'fortunePool': State.fortunePoolContractPublic,
        'actionsManager': State.actionsManagerContractPublic,
        'ecosystemManager': State.ecosystemManagerContractPublic,
        'faucet': State.faucetContractPublic
    };
    
    return publicContracts[contractName] || null;
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
        'getDelegationsOf', 'allowance', 'prizeTiers', 'activeTierCount', 'prizePoolBalance'
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
                console.warn(`⚠️ Rate limit hit, waiting ${delay}ms...`);
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
// 2. USER DATA - 🔥 V8.0: FIXED TO USE PUBLIC PROVIDER
// ====================================================================

export async function loadUserData(forceRefresh = false) {
    if (!State.isConnected || !State.userAddress) return;

    try {
        // 🔥 V8.0: Use PUBLIC contracts for reading (Alchemy, not MetaMask!)
        const bkcContract = State.bkcTokenContractPublic || State.bkcTokenContract;
        const delegationContract = State.delegationManagerContractPublic || State.delegationManagerContract;
        
        const [balance, nativeBalance] = await Promise.allSettled([
            // 🔥 FIXED: Use public contract for balance
            safeBalanceOf(bkcContract, State.userAddress, forceRefresh),
            // 🔥 FIXED: Use publicProvider for native balance
            State.publicProvider?.getBalance(State.userAddress)
        ]);

        if (balance.status === 'fulfilled') {
            State.currentUserBalance = balance.value;
        }
        
        if (nativeBalance.status === 'fulfilled') {
            State.currentUserNativeBalance = nativeBalance.value;
        }

        await loadMyBoostersFromAPI(forceRefresh);

        // 🔥 FIXED: Use public contract for pStake reading
        if (delegationContract) {
            const totalUserPStake = await safeContractCall(
                delegationContract,
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
// 3. DELEGATIONS - 🔥 V8.0: FIXED TO USE PUBLIC PROVIDER
// ====================================================================

export async function loadUserDelegations(forceRefresh = false) {
    if (!State.isConnected || !State.userAddress) return [];

    // 🔥 FIXED: Use public contract for reading delegations
    const delegationContract = State.delegationManagerContractPublic || State.delegationManagerContract;
    
    if (!delegationContract) return [];

    try {
        const delegationsRaw = await safeContractCall(
            delegationContract,
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

    // 🔥 V8.0: Use public contract
    const rentalContract = State.rentalManagerContractPublic || getContractInstance(
        addresses.rentalManager,
        rentalManagerABI,
        null
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

// ====================================================================
// 5. USER RENTALS - 🔥 V8.0: FIXED TO USE PUBLIC PROVIDER
// ====================================================================

export async function loadUserRentals(forceRefresh = false) {
    if (!State.isConnected || !State.userAddress) return [];

    try {
        const response = await fetchWithTimeout(
            `${API_ENDPOINTS.getUserRentals}/${State.userAddress.toLowerCase()}`,
            5000
        );
        if (response.ok) {
            const rentals = await response.json();
            State.userRentals = rentals;
            return rentals;
        }
    } catch (e) {}

    // 🔥 V8.0: Use public contract
    const rentalContract = State.rentalManagerContractPublic || State.rentalManagerContract;
    if (!rentalContract) return [];

    try {
        const rentedIds = await safeContractCall(
            rentalContract,
            'getUserRentedTokens',
            [State.userAddress],
            [],
            2,
            forceRefresh
        );

        if (!rentedIds || rentedIds.length === 0) {
            State.userRentals = [];
            return [];
        }

        const rentals = await Promise.all(
            rentedIds.map(async (tokenId) => {
                const rental = await safeContractCall(
                    rentalContract,
                    'getRental',
                    [tokenId],
                    null,
                    1,
                    true
                );
                if (rental) {
                    const boostInfo = await getBoosterInfo(tokenId);
                    return {
                        tokenId: tokenId.toString(),
                        tenant: rental.tenant,
                        endTime: rental.endTime?.toString(),
                        boostBips: boostInfo.boostBips,
                        img: boostInfo.img,
                        name: boostInfo.name
                    };
                }
                return null;
            })
        );

        const validRentals = rentals.filter(r => r !== null);
        State.userRentals = validRentals;
        return validRentals;

    } catch (e) {
        return [];
    }
}

// ====================================================================
// 6. BOOSTERS / NFTs
// ====================================================================

let boosterErrorCount = 0;
const MAX_BOOSTER_ERRORS = 3;

export async function loadMyBoostersFromAPI(forceRefresh = false) {
    if (!State.isConnected || !State.userAddress) return [];
    
    const cacheKey = `boosters-${State.userAddress.toLowerCase()}`;
    const now = Date.now();
    
    if (!forceRefresh) {
        const cached = ownershipCache.get(cacheKey);
        if (cached && (now - cached.timestamp < OWNERSHIP_CACHE_MS)) {
            State.myBoosters = cached.value;
            return cached.value;
        }
    }

    try {
        const response = await fetchWithTimeout(
            `${API_ENDPOINTS.getBoosters}/${State.userAddress.toLowerCase()}`,
            5000
        );
        
        if (response.ok) {
            const boosters = await response.json();
            const enriched = boosters.map(nft => {
                const tier = boosterTiers.find(t => t.boostBips === Number(nft.boostBips || 0));
                return {
                    ...nft,
                    tokenId: nft.tokenId?.toString() || nft.id?.toString(),
                    boostBips: Number(nft.boostBips || 0),
                    img: tier?.img || './assets/nft.png',
                    name: tier?.name || 'Booster NFT'
                };
            });
            
            State.myBoosters = enriched;
            ownershipCache.set(cacheKey, { value: enriched, timestamp: now });
            boosterErrorCount = 0;
            return enriched;
        }
    } catch (e) {
        boosterErrorCount++;
        if (boosterErrorCount <= MAX_BOOSTER_ERRORS) {
            console.warn(`Boosters API failed (${boosterErrorCount}/${MAX_BOOSTER_ERRORS}):`, e.message);
        }
    }

    return State.myBoosters || [];
}

export async function getBoosterInfo(tokenId) {
    const tier = boosterTiers.find(t => 
        State.myBoosters?.some(b => b.tokenId === tokenId?.toString() && Number(b.boostBips) === t.boostBips)
    );
    
    if (tier) {
        return { boostBips: tier.boostBips, img: tier.img, name: tier.name };
    }

    // 🔥 V8.0: Use public contract
    const boosterContract = State.rewardBoosterContractPublic || State.rewardBoosterContract;
    if (!boosterContract) {
        return { boostBips: 0, img: './assets/nft.png', name: 'Booster NFT' };
    }

    try {
        const boostBips = await safeContractCall(
            boosterContract,
            'boostBips',
            [tokenId],
            0n,
            1,
            false
        );
        
        const matchedTier = boosterTiers.find(t => t.boostBips === Number(boostBips));
        return {
            boostBips: Number(boostBips),
            img: matchedTier?.img || './assets/nft.png',
            name: matchedTier?.name || 'Booster NFT'
        };
    } catch (e) {
        return { boostBips: 0, img: './assets/nft.png', name: 'Booster NFT' };
    }
}

export async function getHighestBoosterBoostFromAPI() {
    if (!State.isConnected || !State.userAddress) return 0;
    
    const boosters = State.myBoosters || [];
    if (boosters.length === 0) return 0;
    
    const highest = boosters.reduce((max, b) => {
        const bips = Number(b.boostBips || 0);
        return bips > max ? bips : max;
    }, 0);
    
    return highest;
}

// ====================================================================
// 7. HISTORY
// ====================================================================

export async function loadActivityHistory(limit = 20) {
    if (!State.isConnected || !State.userAddress) return [];
    
    try {
        const response = await fetchWithTimeout(
            `${API_ENDPOINTS.getHistory}/${State.userAddress.toLowerCase()}?limit=${limit}`,
            5000
        );
        
        if (response.ok) {
            const history = await response.json();
            State.activityHistory = history;
            return history;
        }
    } catch (e) {}
    
    return State.activityHistory || [];
}

export async function loadNotarizationHistory(limit = 50) {
    if (!State.isConnected || !State.userAddress) return [];
    
    try {
        const response = await fetchWithTimeout(
            `${API_ENDPOINTS.getNotaryHistory}/${State.userAddress.toLowerCase()}?limit=${limit}`,
            5000
        );
        
        if (response.ok) {
            const history = await response.json();
            return history;
        }
    } catch (e) {}
    
    return [];
}

// ====================================================================
// 8. CACHE MANAGEMENT
// ====================================================================

export function clearAllCaches() {
    contractReadCache.clear();
    ownershipCache.clear();
    balanceCache.clear();
    systemDataCache = null;
    systemDataCacheTime = 0;
    boosterErrorCount = 0;
}

export async function forceRefreshUserData() {
    clearAllCaches();
    await loadUserData(true);
    await loadUserDelegations(true);
    await loadUserRentals(true);
}

// ====================================================================
// 9. FORTUNE POOL DATA (V2 - BackchainRandomness)
// ====================================================================

export async function loadFortunePoolData(forceRefresh = false) {
    // 🔥 V8.0: Prioritize public contracts
    const contract = State.fortunePoolContractPublic || State.fortunePoolContract || 
                     State.actionsManagerContractPublic || State.actionsManagerContract;
    
    if (!contract) {
        State.fortunePool = { 
            active: false, 
            activeTiers: 0, 
            prizePool: 0n,
            tiers: [],
            serviceFee1x: 0n,
            serviceFee5x: 0n
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

        let serviceFee1x = 0n;
        let serviceFee5x = 0n;
        
        try {
            const [fee1x, fee5x] = await Promise.all([
                contract.getRequiredServiceFee(false),
                contract.getRequiredServiceFee(true)
            ]);
            serviceFee1x = BigInt(fee1x.toString());
            serviceFee5x = BigInt(fee5x.toString());
        } catch (e) {
            try {
                const [fee1x, fee5x] = await Promise.all([
                    contract.getRequiredOracleFee(false),
                    contract.getRequiredOracleFee(true)
                ]);
                serviceFee1x = BigInt(fee1x.toString());
                serviceFee5x = BigInt(fee5x.toString());
            } catch {
                try {
                    const baseFee = await contract.serviceFee();
                    serviceFee1x = BigInt(baseFee.toString());
                    serviceFee5x = serviceFee1x * 5n;
                } catch {}
            }
        }

        const tiers = [];
        try {
            const [ranges, multipliers] = await contract.getAllTiers();
            for (let i = 0; i < ranges.length; i++) {
                tiers.push({
                    tierId: i + 1,
                    maxRange: Number(ranges[i]),
                    multiplierBips: Number(multipliers[i]),
                    multiplier: Number(multipliers[i]) / 10000,
                    active: true
                });
            }
        } catch {
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
            serviceFee1x,
            serviceFee5x,
            oracleFee1x: serviceFee1x,
            oracleFee5x: serviceFee5x,
            tiers
        };

        contractReadCache.set(cacheKey, { value: fortuneData, timestamp: now });
        State.fortunePool = fortuneData;

        return fortuneData;

    } catch (e) {
        State.fortunePool = { 
            active: false, 
            activeTiers: 0, 
            prizePool: 0n,
            tiers: [],
            serviceFee1x: 0n,
            serviceFee5x: 0n,
            oracleFee1x: 0n,
            oracleFee5x: 0n
        };
        return State.fortunePool;
    }
}

export async function loadUserFortuneHistory(userAddress, limit = 20) {
    if (!userAddress) return [];

    // 🔥 V8.0: Prioritize public contracts
    const contract = State.fortunePoolContractPublic || State.fortunePoolContract ||
                     State.actionsManagerContractPublic || State.actionsManagerContract;
    if (!contract) return [];

    try {
        let filter;
        let eventName = 'GamePlayed';
        
        try {
            filter = contract.filters.GamePlayed(null, userAddress);
        } catch {
            filter = contract.filters.GameFulfilled(null, userAddress);
            eventName = 'GameFulfilled';
        }
        
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
                matchCount: args.matchCount ? Number(args.matchCount) : 0,
                txHash: event.transactionHash,
                blockNumber: event.blockNumber,
                won: BigInt(args.prizeWon?.toString() || '0') > 0n
            };
        });

        State.userFortuneHistory = games;
        return games;

    } catch (e) {
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
    // 🔥 V8.0: Prioritize public contracts
    const contract = State.fortunePoolContractPublic || State.fortunePoolContract ||
                     State.actionsManagerContractPublic || State.actionsManagerContract;
    
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