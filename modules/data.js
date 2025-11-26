// js/modules/data.js
// ✅ VERSÃO FINAL OTIMIZADA: Lazy Loading (Carregamento sob demanda por página)

const ethers = window.ethers;

import { State } from '../state.js';
import { addresses, boosterTiers, rentalManagerABI } from '../config.js';

// ====================================================================
// CONSTANTS & UTILITIES
// ====================================================================
const API_TIMEOUT_MS = 8000; 
const CACHE_DURATION_MS = 60000; // 1 minuto cache sistema
const USER_DATA_CACHE_MS = 10000; // 10 segundos cache usuário
const CONTRACT_READ_CACHE_MS = 10000; // 10 segundos cache RPC

let systemDataCache = null;
let systemDataCacheTime = 0;
let lastBoosterFetchTime = 0; 

const contractReadCache = new Map(); 

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') throw new Error('API request timed out.');
        throw error;
    }
}

export const API_ENDPOINTS = {
    getHistory: 'https://gethistory-4wvdcuoouq-uc.a.run.app',
    getBoosters: 'https://getboosters-4wvdcuoouq-uc.a.run.app',
    getSystemData: 'https://getsystemdata-4wvdcuoouq-uc.a.run.app',
    getNotaryHistory: 'https://getnotaryhistory-4wvdcuoouq-uc.a.run.app',
    uploadFileToIPFS: 'https://uploadfiletoipfs-4wvdcuoouq-uc.a.run.app',   
    claimAirdrop: 'https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop'
};

// ====================================================================
// SAFETY FUNCTIONS (Retry & Jitter & CACHE)
// ====================================================================

function isRateLimitError(e) {
    return (
        e?.error?.code === 429 || e?.code === 429 || 
        (e.message && (e.message.includes("429") || e.message.includes("Too Many Requests")))
    );
}

export const safeContractCall = async (contract, method, args = [], fallbackValue = 0n, retries = 2) => {
    if (!contract) return fallbackValue;
    
    const contractAddr = contract.target || contract.address;
    const cacheKey = `${contractAddr}-${method}-${JSON.stringify(args)}`;
    const now = Date.now();

    // Métodos seguros para cache (Leitura)
    const cacheableMethods = [
        'getPoolInfo', 'getBuyPrice', 'getSellPrice', 'getAvailableTokenIds', 
        'getAllListedTokenIds', 'tokenURI', 'boostBips', 'getListing', 
        'balanceOf', 'totalSupply', 'totalNetworkPStake', 'MAX_SUPPLY', 'TGE_SUPPLY',
        'userTotalPStake', 'pendingRewards', 'isRented', 'getRental'
    ];
    
    if (cacheableMethods.includes(method)) {
        const cached = contractReadCache.get(cacheKey);
        if (cached && (now - cached.timestamp < CONTRACT_READ_CACHE_MS)) {
            return cached.value;
        }
    }

    try {
        const result = await contract[method](...args);
        if (cacheableMethods.includes(method)) {
            contractReadCache.set(cacheKey, { value: result, timestamp: now });
        }
        return result;

    } catch (e) {
        if (isRateLimitError(e) && retries > 0) {
            const jitter = Math.floor(Math.random() * 2000); 
            const delayTime = 1500 + jitter; 
            console.warn(`Rate limit (${method}). Retrying in ${delayTime}ms...`);
            await wait(delayTime);
            return safeContractCall(contract, method, args, fallbackValue, retries - 1);
        }
        // Erros silenciosos esperados
        if (e.code !== 'BAD_DATA' && e.code !== 'CALL_EXCEPTION') {
             // console.warn(`SafeCall Error (${method}):`, e.code || e.message);
        }
        return fallbackValue;
    }
};

export const safeBalanceOf = async (contract, address) => safeContractCall(contract, 'balanceOf', [address], 0n);

// ====================================================================
// 1. GLOBAL DATA LOADING (Leve - Apenas Header/Footer)
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
        // Fallbacks críticos
        if(!State.systemFees['NOTARY_SERVICE']) State.systemFees['NOTARY_SERVICE'] = 100n;
        return false;
    }
}

function applySystemDataToState(systemData) {
    if(systemData.fees) {
        for (const key in systemData.fees) State.systemFees[key] = BigInt(systemData.fees[key]);
    }
    if(systemData.pStakeRequirements) {
        for (const key in systemData.pStakeRequirements) State.systemPStakes[key] = BigInt(systemData.pStakeRequirements[key]);
    }
    if (systemData.discounts) {
        for (const key in systemData.discounts) {
            State.boosterDiscounts[key] = BigInt(systemData.discounts[key]);
        }
    }
    if (systemData.oracleFeeInWei) {
        State.systemData = State.systemData || {};
        State.systemData.oracleFeeInWei = BigInt(systemData.oracleFeeInWei);
    }
}

export async function loadPublicData() {
    if (!State.publicProvider || !State.bkcTokenContractPublic) return;

    // ✅ OTIMIZAÇÃO: Carrega APENAS dados globais essenciais (Supply e Config)
    // O resto (Rental, Stake) será carregado pelas páginas específicas
    await Promise.allSettled([
        safeContractCall(State.bkcTokenContractPublic, 'totalSupply', [], 0n),
        loadSystemDataFromAPI()
    ]);
}

// ====================================================================
// 2. USER BASIC DATA (Leve - Apenas Saldo e Booster Ativo)
// ====================================================================

export async function loadUserData() {
    if (!State.isConnected || !State.userAddress) return;

    try {
        // 1. Saldo (Essencial para Header)
        const balance = await safeBalanceOf(State.bkcTokenContract, State.userAddress);
        State.currentUserBalance = balance;

        if (State.provider) {
            const nativeBalance = await State.provider.getBalance(State.userAddress);
            State.currentUserNativeBalance = nativeBalance;
        }

        // 2. Booster (Essencial para cálculo de taxas em qualquer página)
        // Mas NÃO carrega histórico ou aluguéis aqui.
        await loadMyBoostersFromAPI();
        
        // 3. pStake do Usuário (Essencial para acesso a páginas)
        if (State.delegationManagerContract) {
             const totalUserPStake = await safeContractCall(State.delegationManagerContract, 'userTotalPStake', [State.userAddress], 0n);
             State.userTotalPStake = totalUserPStake;
        }

    } catch (e) { console.error("Error loading user data:", e); }
}

// ====================================================================
// 3. PÁGINA ESPECÍFICA: STAKING (Delegações)
// ====================================================================

// Chamada apenas pelo 'pages/networkstaking.js'
export async function loadUserDelegations() {
    if (!State.isConnected || !State.delegationManagerContract) return [];
    
    try {
        const delegationsRaw = await safeContractCall(State.delegationManagerContract, 'getDelegationsOf', [State.userAddress], []);
        State.userDelegations = delegationsRaw.map((d, index) => ({
            amount: d[0], unlockTime: d[1], lockDuration: d[2], index
        }));
        return State.userDelegations;
    } catch (e) {
        console.error("Error loading delegations:", e);
        return [];
    }
}

// ====================================================================
// 4. PÁGINA ESPECÍFICA: RENTAL MARKET (AirBNFT)
// ====================================================================

// Chamada apenas pelo 'pages/RentalPage.js'
export async function loadRentalListings() {
    if (!State.publicProvider || !addresses.rentalManager) {
        State.rentalListings = [];
        return [];
    }
    
    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.publicProvider);
    
    try {
        const listedIds = await safeContractCall(rentalContract, 'getAllListedTokenIds', [], []);
        if (!listedIds || listedIds.length === 0) {
            State.rentalListings = [];
            return [];
        }

        // Otimização: Carrega detalhes em paralelo limitado
        const listingsToFetch = listedIds.slice(0, 50); // Paginação implícita
        
        const listingsPromises = listingsToFetch.map(async (tokenId) => {
            const listing = await safeContractCall(rentalContract, 'getListing', [tokenId], null);
            if (listing && listing.isActive) {
                const isRented = await safeContractCall(rentalContract, 'isRented', [tokenId], false);
                if (!isRented) {
                    const boostInfo = await getBoosterInfo(tokenId); 
                    return {
                        tokenId: tokenId.toString(),
                        owner: listing.owner,
                        pricePerHour: listing.pricePerHour,
                        maxDurationHours: listing.maxDuration,
                        boostBips: boostInfo.boostBips,
                        img: boostInfo.img,
                        name: boostInfo.name
                    };
                }
            }
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

// Chamada apenas pelo 'pages/RentalPage.js'
export async function loadUserRentals() {
    if (!State.userAddress || !addresses.rentalManager) {
        State.myRentals = [];
        return [];
    }
    
    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.publicProvider);
    
    try {
        // Em produção real, usaríamos um indexer para isso, mas aqui filtramos a lista
        // Para otimizar, confiamos que o DashboardPage.js já carrega o essencial
        const listedIds = await safeContractCall(rentalContract, 'getAllListedTokenIds', [], []);
        const myRentals = [];
        
        for (const tokenId of listedIds) {
            const rental = await safeContractCall(rentalContract, 'getRental', [tokenId], null);
            if (rental && rental.tenant.toLowerCase() === State.userAddress.toLowerCase()) {
                const nowSec = Math.floor(Date.now() / 1000);
                if (BigInt(rental.endTime) > BigInt(nowSec)) {
                     const boostInfo = await getBoosterInfo(tokenId);
                     myRentals.push({
                        tokenId: tokenId.toString(),
                        startTime: rental.startTime,
                        endTime: rental.endTime,
                        boostBips: boostInfo.boostBips,
                        img: boostInfo.img,
                        name: boostInfo.name
                     });
                }
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
// HELPER: BOOSTER INFO (Usado por Rental e Dashboard)
// ====================================================================

async function getBoosterInfo(tokenId) {
    if (!State.rewardBoosterContractPublic && State.publicProvider && addresses.rewardBoosterNFT) {
         State.rewardBoosterContractPublic = new ethers.Contract(addresses.rewardBoosterNFT, [
            "function boostBips(uint256) view returns (uint256)", 
            "function tokenURI(uint256) view returns (string)"
         ], State.publicProvider);
    }
    
    const contractToUse = State.rewardBoosterContract || State.rewardBoosterContractPublic;
    if (!contractToUse) return { boostBips: 0, img: 'assets/bkc_logo_3d.png', name: 'Unknown' };
    
    try {
        const boostBips = await safeContractCall(contractToUse, 'boostBips', [tokenId], 0n);
        let img = 'assets/bkc_logo_3d.png';
        let name = `Booster #${tokenId}`;
        
        const tier = boosterTiers.find(t => t.boostBips === Number(boostBips));
        if (tier) {
            img = tier.img; // Usa imagem local do config se disponível
            name = tier.name;
        } 
        
        return { boostBips: Number(boostBips), img, name };
    } catch {
        return { boostBips: 0, img: 'assets/bkc_logo_3d.png', name: 'Unknown' };
    }
}

// ====================================================================
// SHARED: REWARDS CALCULATION (Usado por Dashboard e Staking)
// ====================================================================

export async function calculateUserTotalRewards() {
    if (!State.isConnected || !State.delegationManagerContract) {
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }

    try {
        const stakingRewards = await safeContractCall(State.delegationManagerContract, 'pendingRewards', [State.userAddress], 0n);
        const minerRewards = 0n; 
        const totalRewards = stakingRewards + minerRewards;
        return { stakingRewards, minerRewards, totalRewards };

    } catch (e) {
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }
}

export async function calculateClaimDetails() {
    if (!State.delegationManagerContract || !State.userAddress) {
        return { netClaimAmount: 0n, feeAmount: 0n, discountPercent: 0, totalRewards: 0n };
    }
    
    const { totalRewards } = await calculateUserTotalRewards();
    if (totalRewards === 0n) return { netClaimAmount: 0n, feeAmount: 0n, discountPercent: 0, totalRewards: 0n };
    
    let baseFeeBips = State.systemFees?.CLAIM_REWARD_FEE_BIPS || 50n;
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

export async function getHighestBoosterBoostFromAPI() {
    await loadMyBoostersFromAPI();
    
    let maxBoost = 0;
    let bestTokenId = null;
    let source = 'none';

    if (State.myBoosters && State.myBoosters.length > 0) {
        const highestOwned = State.myBoosters.reduce((max, b) => b.boostBips > max.boostBips ? b : max, State.myBoosters[0]);
        if (highestOwned.boostBips > maxBoost) {
            maxBoost = highestOwned.boostBips;
            bestTokenId = highestOwned.tokenId;
            source = 'owned';
        }
    }
    
    // Check Rentals only if needed (Lazy check)
    if (State.myRentals && State.myRentals.length > 0) {
        const highestRented = State.myRentals.reduce((max, r) => r.boostBips > max.boostBips ? r : max, State.myRentals[0]);
        if (highestRented.boostBips > maxBoost) {
            maxBoost = highestRented.boostBips;
            bestTokenId = highestRented.tokenId;
            source = 'rented';
        }
    }

    const tier = boosterTiers.find(t => t.boostBips === maxBoost);
    let imageUrl = tier?.realImg || tier?.img || 'assets/bkc_logo_3d.png';
    let nftName = tier?.name ? `${tier.name} Booster` : (source !== 'none' ? 'Booster NFT' : 'None');

    return { 
        highestBoost: maxBoost, 
        boostName: nftName, 
        imageUrl, 
        tokenId: bestTokenId ? bestTokenId.toString() : null, 
        source: source 
    };
}

export async function loadMyBoostersFromAPI() {
    if (State.myBoosters && State.myBoosters.length > 0) {
        if (Date.now() - lastBoosterFetchTime < USER_DATA_CACHE_MS) return State.myBoosters;
    }
    
    if (!State.userAddress) return [];

    try {
        const response = await fetchWithTimeout(`${API_ENDPOINTS.getBoosters}/${State.userAddress}`, 5000);
        if (!response.ok) throw new Error(`API Error`);
        
        const ownedTokensAPI = await response.json(); 
        const boosterDetails = ownedTokensAPI.map(tokenData => ({
            tokenId: BigInt(tokenData.tokenId),
            boostBips: Number(tokenData.boostBips || 0)
        }));

        State.myBoosters = boosterDetails;
        lastBoosterFetchTime = Date.now(); 
        return boosterDetails;
    } catch (e) { return State.myBoosters || []; }
}