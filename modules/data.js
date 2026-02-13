// js/modules/data.js
// ✅ V9.0 - Updated for V9 contracts (StakingPool, FortunePool, RewardBooster)

const ethers = window.ethers;

import { State } from '../state.js';
import { addresses, boosterTiers, rentalManagerABI, rewardBoosterABI } from '../config.js';

// ====================================================================
// CONSTANTS & CONFIGURATION
// ====================================================================
const API_TIMEOUT_MS = 5000;
const CACHE_DURATION_MS = 60000;
const CONTRACT_READ_CACHE_MS = 30000;
const OWNERSHIP_CACHE_MS = 30000;
const BALANCE_CACHE_MS = 60000;

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
        'getAllListedTokenIds', 'tokenURI', 'tokenTier', 'getTokenInfo', 'getListing',
        'balanceOf', 'totalSupply', 'totalPStake', 'MAX_SUPPLY', 'TGE_SUPPLY',
        'userTotalPStake', 'pendingRewards', 'isRented', 'getRental', 'ownerOf',
        'getDelegationsOf', 'allowance', 'getPoolStats', 'getAllTiers', 'getUserSummary',
        'getUserBestBoost'
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
        // Use public contracts (Alchemy) for reads — avoids MetaMask RPC rate limits
        const publicProvider = State.bkcTokenContractPublic?.runner?.provider;
        const [balance, nativeBalance] = await Promise.allSettled([
            safeBalanceOf(State.bkcTokenContractPublic || State.bkcTokenContract, State.userAddress, forceRefresh),
            (publicProvider || State.provider)?.getBalance(State.userAddress)
        ]);

        if (balance.status === 'fulfilled') {
            State.currentUserBalance = balance.value;
        }
        
        if (nativeBalance.status === 'fulfilled') {
            State.currentUserNativeBalance = nativeBalance.value;
        }

        await loadMyBoostersFromAPI(forceRefresh);

        // Use public contract (Alchemy) to avoid MetaMask RPC rate limits
        const pStakeContract = State.stakingPoolContractPublic || State.stakingPoolContract;
        if (pStakeContract) {
            const totalUserPStake = await safeContractCall(
                pStakeContract,
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
    // V9: stakingPoolContract replaces delegationManagerContract
    const contract = State.stakingPoolContractPublic || State.stakingPoolContract;
    if (!State.isConnected || !contract) return [];

    try {
        const delegationsRaw = await safeContractCall(
            contract,
            'getDelegationsOf',
            [State.userAddress],
            [],
            2,
            forceRefresh
        );

        // V9 struct: {uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt}
        State.userDelegations = delegationsRaw.map((d, index) => ({
            amount: d.amount || d[0] || 0n,
            pStake: d.pStake || d[1] || 0n,
            lockEnd: Number(d.lockEnd || d[2] || 0),
            lockDays: Number(d.lockDays || d[3] || 0),
            rewardDebt: d.rewardDebt || d[4] || 0n,
            // Backward-compatible aliases
            unlockTime: BigInt(d.lockEnd || d[2] || 0),
            lockDuration: BigInt(d.lockDays || d[3] || 0) * 86400n,
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
                pricePerDay: item.pricePerDay?.toString() || item.pricePerHour?.toString() || item.price?.toString() || '0',
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
                
                if (listing && listing.owner !== ethers.ZeroAddress) {
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
                    
                    const nowSec2 = Math.floor(Date.now() / 1000);
                    const boostExp = Number(listing.boostExpiry || 0);

                    return {
                        tokenId: tokenId.toString(),
                        owner: listing.owner,
                        pricePerDay: listing.pricePerDay?.toString() || '0',
                        totalEarnings: listing.totalEarnings?.toString() || '0',
                        rentalCount: Number(listing.rentalCount || 0),
                        boostBips: boostInfo.boostBips,
                        img: boostInfo.img || './assets/nft.png',
                        name: boostInfo.name,
                        isRented: isCurrentlyRented,
                        currentTenant: isCurrentlyRented ? rentalInfo.tenant : null,
                        rentalEndTime: isCurrentlyRented ? rentalInfo.endTime?.toString() : null,
                        isBoosted: listing.isBoosted || boostExp > nowSec2,
                        boostExpiry: boostExp
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
                
                // V9: getRental returns (tenant, endTime, isActive)
                if (rental &&
                    rental.tenant?.toLowerCase() === State.userAddress.toLowerCase() &&
                    (rental.isActive || BigInt(rental.endTime || 0) > BigInt(nowSec))) {

                    const boostInfo = await getBoosterInfo(tokenId);
                    myRentals.push({
                        tokenId: tokenId.toString(),
                        tenant: rental.tenant,
                        endTime: rental.endTime?.toString() || '0',
                        isActive: rental.isActive,
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
    const imageUrl = tier?.image || tier?.realImg || tier?.img || 'assets/bkc_logo_3d.png';
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
    // V9: getTokenInfo returns (owner, tier, boostBips)
    const minABI = [
        "function getTokenInfo(uint256) view returns (address owner, uint8 tier, uint256 boostBips)",
        "function tokenTier(uint256) view returns (uint8)"
    ];
    const contractToUse = getContractInstance(
        addresses.rewardBooster,
        minABI,
        State.rewardBoosterContractPublic
    );

    if (!contractToUse) {
        return { boostBips: 0, img: 'assets/bkc_logo_3d.png', name: 'Unknown' };
    }

    try {
        const info = await safeContractCall(
            contractToUse,
            'getTokenInfo',
            [tokenId],
            null
        );

        if (info) {
            const bipsNum = Number(info.boostBips || info[2] || 0);
            const tier = boosterTiers.find(t => t.boostBips === bipsNum);
            return {
                boostBips: bipsNum,
                img: tier?.image || tier?.img || './assets/nft.png',
                name: tier?.name || `Booster #${tokenId}`
            };
        }
        return { boostBips: 0, img: 'assets/bkc_logo_3d.png', name: 'Unknown' };

    } catch {
        return { boostBips: 0, img: 'assets/bkc_logo_3d.png', name: 'Unknown' };
    }
}

// ====================================================================
// 6. REWARDS CALCULATION
// ====================================================================

export async function calculateUserTotalRewards() {
    // V9: stakingPoolContract replaces delegationManagerContract
    const contract = State.stakingPoolContractPublic || State.stakingPoolContract;
    if (!State.isConnected || !contract) {
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }

    try {
        const stakingRewards = await safeContractCall(
            contract,
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
    // V10: Use previewClaim from StakingPool — returns exact on-chain calculation (recycle model)
    const contract = State.stakingPoolContractPublic || State.stakingPoolContract;
    if (!contract || !State.userAddress) {
        return { netClaimAmount: 0n, feeAmount: 0n, discountPercent: 0, totalRewards: 0n, recycleRateBps: 0, nftBoost: 0 };
    }

    const { totalRewards } = await calculateUserTotalRewards();
    if (totalRewards === 0n) {
        return { netClaimAmount: 0n, feeAmount: 0n, discountPercent: 0, totalRewards: 0n, recycleRateBps: 0, nftBoost: 0 };
    }

    try {
        // V10 previewClaim returns (totalRewards, recycleAmount, burnAmount, tutorCut, userReceives, recycleRateBps, nftBoost)
        const preview = await safeContractCall(
            contract,
            'previewClaim',
            [State.userAddress],
            null
        );

        if (preview) {
            const totalRew = preview.totalRewards || preview[0] || 0n;
            const recycleAmount = preview.recycleAmount || preview[1] || 0n;
            const burnAmount = preview.burnAmount || preview[2] || 0n;
            const tutorCut = preview.tutorCut || preview[3] || 0n;
            const userReceives = preview.userReceives || preview[4] || 0n;
            const recycleRateBps = Number(preview.recycleRateBps || preview[5] || 0);
            const nftBoost = Number(preview.nftBoost || preview[6] || 0);

            const feeAmount = recycleAmount + burnAmount + tutorCut;

            console.log('[Data] V10 Claim preview:', {
                totalRewards: Number(totalRew) / 1e18,
                recycleAmount: Number(recycleAmount) / 1e18,
                burnAmount: Number(burnAmount) / 1e18,
                tutorCut: Number(tutorCut) / 1e18,
                userReceives: Number(userReceives) / 1e18,
                recycleRateBps,
                nftBoost
            });

            return {
                netClaimAmount: userReceives,
                feeAmount,
                recycleAmount,
                burnAmount,
                tutorCut,
                discountPercent: nftBoost / 100,
                totalRewards: totalRew,
                recycleRateBps,
                nftBoost,
                baseFeeBips: 6000, // V10 base recycle is 60%
                finalFeeBips: recycleRateBps
            };
        }
    } catch (e) {
        console.error('[Data] previewClaim error:', e);
    }

    // Fallback: return raw total with no fee info
    return { netClaimAmount: totalRewards, feeAmount: 0n, discountPercent: 0, totalRewards, recycleRateBps: 0, nftBoost: 0 };
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

        // V9: rewardBooster replaces rewardBoosterNFT, getTokenInfo replaces boostBips
        const minABI = [
            "function ownerOf(uint256) view returns (address)",
            "function getTokenInfo(uint256) view returns (address owner, uint8 tier, uint256 boostBips)"
        ];
        const contract = getContractInstance(
            addresses.rewardBooster,
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

                    // V9: Use getTokenInfo to get boostBips if not in API data
                    if (tokenBoostBips === 0) {
                        try {
                            const info = await contract.getTokenInfo(id);
                            tokenBoostBips = Number(info.boostBips || info[2] || 0);
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
// 9. FORTUNE POOL DATA (V9)
// ====================================================================

export async function loadFortunePoolData(forceRefresh = false) {
    // V9: fortunePoolContract only — no actionsManager fallback
    const contract = State.fortunePoolContractPublic || State.fortunePoolContract;

    const emptyState = {
        active: false,
        activeTiers: 0,
        prizePool: 0n,
        tiers: [],
        maxPayout: 0n,
        totalGamesPlayed: 0,
        fees: {}
    };

    if (!contract) {
        State.fortunePool = emptyState;
        return emptyState;
    }

    const cacheKey = 'fortunePool-status-v9';
    const now = Date.now();

    if (!forceRefresh && contractReadCache.has(cacheKey)) {
        const cached = contractReadCache.get(cacheKey);
        if (now - cached.timestamp < CONTRACT_READ_CACHE_MS) {
            State.fortunePool = cached.value;
            return cached.value;
        }
    }

    try {
        // V9: getPoolStats returns 7-tuple, getAllTiers returns 3 fixed arrays
        const [poolStats, allTiers] = await Promise.all([
            safeContractCall(contract, 'getPoolStats', [], null),
            safeContractCall(contract, 'getAllTiers', [], null)
        ]);

        const pool = poolStats ? BigInt((poolStats.prizePool || poolStats[0] || 0).toString()) : 0n;
        const totalGames = poolStats ? Number(poolStats.totalGamesPlayed || poolStats[1] || 0) : 0;
        const maxPayout = poolStats ? BigInt((poolStats.maxPayoutNow || poolStats[6] || 0).toString()) : 0n;

        // V9: getAllTiers returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)
        const tiers = [];
        if (allTiers) {
            const ranges = allTiers[0] || allTiers.ranges;
            const multipliers = allTiers[1] || allTiers.multipliers;
            const winChances = allTiers[2] || allTiers.winChances;
            for (let i = 0; i < 3; i++) {
                tiers.push({
                    tierId: i,
                    maxRange: Number(ranges[i]),
                    multiplierBips: Number(multipliers[i]),
                    multiplier: Number(multipliers[i]) / 10000,
                    winChanceBps: Number(winChances[i]),
                    active: true
                });
            }
        }

        // V9: getRequiredFee(tierMask) — get fee for each single tier + all tiers
        const fees = {};
        try {
            const [fee0, fee1, fee2, feeAll] = await Promise.all([
                safeContractCall(contract, 'getRequiredFee', [1], 0n),   // tier 0 only
                safeContractCall(contract, 'getRequiredFee', [2], 0n),   // tier 1 only
                safeContractCall(contract, 'getRequiredFee', [4], 0n),   // tier 2 only
                safeContractCall(contract, 'getRequiredFee', [7], 0n)    // all 3 tiers
            ]);
            fees.tier0 = BigInt(fee0.toString());
            fees.tier1 = BigInt(fee1.toString());
            fees.tier2 = BigInt(fee2.toString());
            fees.allTiers = BigInt(feeAll.toString());
        } catch {}

        const fortuneData = {
            active: tiers.length > 0,
            activeTiers: tiers.length,
            prizePool: pool,
            totalGamesPlayed: totalGames,
            maxPayout,
            tiers,
            fees,
            // Backward-compatible aliases
            serviceFee1x: fees.tier0 || 0n,
            serviceFee5x: fees.allTiers || 0n,
            oracleFee1x: fees.tier0 || 0n,
            oracleFee5x: fees.allTiers || 0n,
            gameCounter: totalGames
        };

        contractReadCache.set(cacheKey, { value: fortuneData, timestamp: now });
        State.fortunePool = fortuneData;

        return fortuneData;

    } catch (e) {
        State.fortunePool = emptyState;
        return emptyState;
    }
}

export async function loadUserFortuneHistory(userAddress, limit = 20) {
    if (!userAddress) return [];

    // V9: fortunePoolContract only — no actionsManager fallback
    const contract = State.fortunePoolContractPublic || State.fortunePoolContract;
    if (!contract) return [];

    try {
        // V9: GameRevealed(gameId, player, grossWager, prizeWon, tierMask, matchCount, operator)
        const filter = contract.filters.GameRevealed(null, userAddress);
        const events = await contract.queryFilter(filter, -10000);

        const games = events.slice(-limit).reverse().map(event => {
            const args = event.args;
            return {
                gameId: Number(args.gameId),
                player: args.player,
                grossWager: BigInt(args.grossWager?.toString() || '0'),
                prizeWon: BigInt(args.prizeWon?.toString() || '0'),
                tierMask: Number(args.tierMask || 0),
                matchCount: Number(args.matchCount || 0),
                operator: args.operator,
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

/**
 * V9: Guess count is determined by tierMask (number of set bits)
 * tierMask 1 (0b001) = 1 tier, tierMask 3 (0b011) = 2 tiers, tierMask 7 (0b111) = 3 tiers
 */
export function getExpectedGuessCount(tierMask) {
    if (typeof tierMask === 'boolean') {
        // Backward compat: isCumulative=true → all 3 tiers, false → 1 tier
        return tierMask ? 3 : 1;
    }
    // Count set bits in tierMask
    let count = 0;
    let mask = tierMask;
    while (mask > 0) {
        count += mask & 1;
        mask >>= 1;
    }
    return count || 1;
}