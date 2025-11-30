// js/modules/data.js
// ✅ VERSÃO FINAL V6.0 (CORRIGIDA E COMPLETA): Endpoint Vercel + Fix BigInt + Cache

const ethers = window.ethers;

import { State } from '../state.js';
import { addresses, boosterTiers, rentalManagerABI, rewardBoosterABI } from '../config.js';

// ====================================================================
// CONSTANTS & UTILITIES
// ====================================================================
const API_TIMEOUT_MS = 5000; // 5 segundos max para API responder
const CACHE_DURATION_MS = 60000; // Cache de dados do sistema (1 min)
const CONTRACT_READ_CACHE_MS = 10000; // Cache de leitura RPC curta (10s)
const OWNERSHIP_CACHE_MS = 30000; // Cache de dono de NFT (30s)

let systemDataCache = null;
let systemDataCacheTime = 0;

// Mapa de Cache RPC (Evita chamadas repetidas)
const contractReadCache = new Map(); 
// Mapa de Cache de Propriedade (Evita spam de ownerOf)
const ownershipCache = new Map();

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

// ENDPOINTS DA SUA API (Firebase Functions + Vercel Fix)
export const API_ENDPOINTS = {
    getHistory: 'https://gethistory-4wvdcuoouq-uc.a.run.app',
    getBoosters: 'https://getboosters-4wvdcuoouq-uc.a.run.app',
    getSystemData: 'https://getsystemdata-4wvdcuoouq-uc.a.run.app',
    getNotaryHistory: 'https://getnotaryhistory-4wvdcuoouq-uc.a.run.app',
    getRentalListings: 'https://getrentallistings-4wvdcuoouq-uc.a.run.app', 
    getUserRentals: 'https://getuserrentals-4wvdcuoouq-uc.a.run.app',       
    
    // 👇 CORREÇÃO 1: Endpoint relativo para usar o Vercel Local e evitar CORS
    uploadFileToIPFS: '/api/upload',   
    
    claimAirdrop: 'https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop'
};

// ====================================================================
// SAFETY FUNCTIONS (RPC Protection)
// ====================================================================

function isRateLimitError(e) {
    return (
        e?.error?.code === 429 || e?.code === 429 || 
        (e.message && (e.message.includes("429") || e.message.includes("Too Many Requests")))
    );
}

// Helper para garantir que temos um contrato válido (Lazy Load)
function getContractInstance(address, abi, fallbackStateContract) {
    if (fallbackStateContract) return fallbackStateContract;
    if (!address || !State.publicProvider) return null;
    try {
        return new ethers.Contract(address, abi, State.publicProvider);
    } catch (e) {
        console.warn("Failed to create lazy contract instance", e);
        return null;
    }
}

// Wrapper seguro para chamadas de Contrato com Cache e Retry
export const safeContractCall = async (contract, method, args = [], fallbackValue = 0n, retries = 2, forceRefresh = false) => {
    if (!contract) return fallbackValue;
    
    const contractAddr = contract.target || contract.address;
    
    // 👇 CORREÇÃO 2: Serialização segura de BigInt na chave de cache para evitar crash
    const serializedArgs = JSON.stringify(args, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
    const cacheKey = `${contractAddr}-${method}-${serializedArgs}`;
    const now = Date.now();

    const cacheableMethods = [
        'getPoolInfo', 'getBuyPrice', 'getSellPrice', 'getAvailableTokenIds', 
        'getAllListedTokenIds', 'tokenURI', 'boostBips', 'getListing', 
        'balanceOf', 'totalSupply', 'totalNetworkPStake', 'MAX_SUPPLY', 'TGE_SUPPLY',
        'userTotalPStake', 'pendingRewards', 'isRented', 'getRental', 'ownerOf'
    ];
    
    // Verifica Cache
    if (!forceRefresh && cacheableMethods.includes(method)) {
        const cached = contractReadCache.get(cacheKey);
        if (cached && (now - cached.timestamp < CONTRACT_READ_CACHE_MS)) {
            return cached.value;
        }
    }

    try {
        const result = await contract[method](...args);
        // Salva Cache
        if (cacheableMethods.includes(method)) {
            contractReadCache.set(cacheKey, { value: result, timestamp: now });
        }
        return result;

    } catch (e) {
        // Retry em caso de Rate Limit
        if (isRateLimitError(e) && retries > 0) {
            const jitter = Math.floor(Math.random() * 2000); 
            const delayTime = 1500 + jitter; 
            console.warn(`RPC Rate Limit (${method}). Retrying in ${delayTime}ms...`);
            await wait(delayTime);
            return safeContractCall(contract, method, args, fallbackValue, retries - 1, forceRefresh);
        }
        return fallbackValue;
    }
};

export const safeBalanceOf = async (contract, address, forceRefresh = false) => 
    safeContractCall(contract, 'balanceOf', [address], 0n, 2, forceRefresh);

// ====================================================================
// 1. GLOBAL DATA LOADING (Configurações do Sistema)
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
        // Tenta pegar da API (Mais rápido)
        const response = await fetchWithTimeout(API_ENDPOINTS.getSystemData, API_TIMEOUT_MS);
        if (!response.ok) throw new Error(`API Status: ${response.status}`);
        
        const systemData = await response.json();
        applySystemDataToState(systemData);
        
        systemDataCache = systemData;
        systemDataCacheTime = now;
        return true;
    } catch (e) {
        // Fallback: Se API falhar, usa valor padrão seguro
        console.warn("System Data API Failed. Using defaults.");
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
    // Executa em paralelo
    await Promise.allSettled([
        safeContractCall(State.bkcTokenContractPublic, 'totalSupply', [], 0n),
        loadSystemDataFromAPI()
    ]);
}

// ====================================================================
// 2. USER DATA (Básico)
// ====================================================================

export async function loadUserData(forceRefresh = false) {
    if (!State.isConnected || !State.userAddress) return;

    try {
        const balance = await safeBalanceOf(State.bkcTokenContract, State.userAddress, forceRefresh);
        State.currentUserBalance = balance;

        if (State.provider) {
            const nativeBalance = await State.provider.getBalance(State.userAddress);
            State.currentUserNativeBalance = nativeBalance;
        }

        // Carrega Boosters (API First)
        await loadMyBoostersFromAPI(forceRefresh);
        
        // Carrega pStake (On-Chain)
        if (State.delegationManagerContract) {
             const totalUserPStake = await safeContractCall(
                 State.delegationManagerContract, 'userTotalPStake', [State.userAddress], 0n, 2, forceRefresh
             );
             State.userTotalPStake = totalUserPStake;
        }

    } catch (e) { console.error("Error loading user data:", e); }
}

// ====================================================================
// 3. PÁGINA: STAKING
// ====================================================================

export async function loadUserDelegations(forceRefresh = false) {
    if (!State.isConnected || !State.delegationManagerContract) return [];
    
    try {
        // Ainda On-Chain por segurança e dados pessoais
        const delegationsRaw = await safeContractCall(
            State.delegationManagerContract, 'getDelegationsOf', [State.userAddress], [], 2, forceRefresh
        );
        State.userDelegations = delegationsRaw.map((d, index) => ({
            amount: d[0], unlockTime: d[1], lockDuration: d[2], index
        }));
        return State.userDelegations;
    } catch (e) {
        return [];
    }
}

// ====================================================================
// 4. PÁGINA: RENTAL MARKET (OTIMIZAÇÃO "API FIRST")
// ====================================================================

export async function loadRentalListings(forceRefresh = false) {
    // 1. TENTATIVA RÁPIDA: API (Firebase)
    // Evita 50 chamadas RPC. Pega JSON pronto do Indexer.
    try {
        const response = await fetchWithTimeout(API_ENDPOINTS.getRentalListings, 4000); // 4s timeout
        if (response.ok) {
            const listingsFromApi = await response.json();
            
            // Enriquece com imagens locais (tiers) para não depender de IPFS
            const enrichedListings = listingsFromApi.map(item => {
                const tier = boosterTiers.find(t => t.boostBips === Number(item.boostBips || 0));
                return {
                    ...item,
                    img: tier ? tier.img : 'assets/bkc_logo_3d.png',
                    name: tier ? tier.name : 'Booster NFT'
                };
            });

            State.rentalListings = enrichedListings;
            // console.log("⚡ Rental listings loaded from API.");
            return enrichedListings;
        }
    } catch (e) {
        console.warn("⚠️ API Rental Unavailable. Switching to Blockchain Fallback...");
    }

    // 2. FALLBACK: BLOCKCHAIN (Lento, mas seguro)
    const rentalContract = getContractInstance(addresses.rentalManager, rentalManagerABI, State.rentalManagerContractPublic);
    if (!rentalContract) { State.rentalListings = []; return []; }
    
    try {
        const listedIds = await safeContractCall(rentalContract, 'getAllListedTokenIds', [], [], 2, forceRefresh);
        if (!listedIds || listedIds.length === 0) { State.rentalListings = []; return []; }

        const listingsToFetch = listedIds.slice(0, 30); // Limita a 30 para não travar
        
        const listingsPromises = listingsToFetch.map(async (tokenId) => {
            const listing = await safeContractCall(rentalContract, 'getListing', [tokenId], null, 2, forceRefresh);
            if (listing && listing.isActive) {
                const isRented = await safeContractCall(rentalContract, 'isRented', [tokenId], false, 2, forceRefresh);
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
        console.error("Rental Fallback Error:", e);
        State.rentalListings = [];
        return [];
    }
}

export async function loadUserRentals(forceRefresh = false) {
    if (!State.userAddress) { State.myRentals = []; return []; }

    // 1. TENTATIVA API
    try {
        const response = await fetchWithTimeout(`${API_ENDPOINTS.getUserRentals}/${State.userAddress}`, 4000);
        if (response.ok) {
            const myRentalsApi = await response.json();
            const enrichedRentals = myRentalsApi.map(item => {
                const tier = boosterTiers.find(t => t.boostBips === Number(item.boostBips || 0));
                return {
                    ...item,
                    img: tier ? tier.img : 'assets/bkc_logo_3d.png',
                    name: tier ? tier.name : 'Booster NFT'
                };
            });
            State.myRentals = enrichedRentals;
            return enrichedRentals;
        }
    } catch (e) { /* Fallback silently */ }
    
    // 2. FALLBACK BLOCKCHAIN (Itera sobre listagens... ineficiente mas funciona)
    const rentalContract = getContractInstance(addresses.rentalManager, rentalManagerABI, State.rentalManagerContractPublic);
    if (!rentalContract) return [];
    
    try {
        const listedIds = await safeContractCall(rentalContract, 'getAllListedTokenIds', [], [], 2, forceRefresh);
        const myRentals = [];
        
        for (const tokenId of listedIds) {
            const rental = await safeContractCall(rentalContract, 'getRental', [tokenId], null, 2, forceRefresh);
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
// HELPERS
// ====================================================================

// Calcula o melhor booster (Propriedade ou Aluguel)
export async function getHighestBoosterBoostFromAPI() {
    // Garante dados frescos
    await loadMyBoostersFromAPI();
    
    let maxBoost = 0;
    let bestTokenId = null;
    let source = 'none';

    // Checa Boosters Próprios
    if (State.myBoosters && State.myBoosters.length > 0) {
        const highestOwned = State.myBoosters.reduce((max, b) => b.boostBips > max.boostBips ? b : max, State.myBoosters[0]);
        if (highestOwned.boostBips > maxBoost) {
            maxBoost = highestOwned.boostBips;
            bestTokenId = highestOwned.tokenId;
            source = 'owned';
        }
    }
    
    // Checa Boosters Alugados (Aluguel conta como posse temporária para desconto!)
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

// Função auxiliar interna para pegar info do booster (usada no fallback)
async function getBoosterInfo(tokenId) {
    const minABI = ["function boostBips(uint256) view returns (uint256)"];
    const contractToUse = getContractInstance(addresses.rewardBoosterNFT, minABI, State.rewardBoosterContractPublic);
    
    if (!contractToUse) return { boostBips: 0, img: 'assets/bkc_logo_3d.png', name: 'Unknown' };
    
    try {
        const boostBips = await safeContractCall(contractToUse, 'boostBips', [tokenId], 0n);
        let img = 'assets/bkc_logo_3d.png';
        let name = `Booster #${tokenId}`;
        
        const tier = boosterTiers.find(t => t.boostBips === Number(boostBips));
        if (tier) { img = tier.img; name = tier.name; } 
        
        return { boostBips: Number(boostBips), img, name };
    } catch {
        return { boostBips: 0, img: 'assets/bkc_logo_3d.png', name: 'Unknown' };
    }
}

// Cálculos de Recompensas
export async function calculateUserTotalRewards() {
    if (!State.isConnected || !State.delegationManagerContract) {
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }
    try {
        const stakingRewards = await safeContractCall(State.delegationManagerContract, 'pendingRewards', [State.userAddress], 0n);
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
    if (totalRewards === 0n) return { netClaimAmount: 0n, feeAmount: 0n, discountPercent: 0, totalRewards: 0n };
    
    let baseFeeBips = State.systemFees?.CLAIM_REWARD_FEE_BIPS || 500n; // Default 5% se falhar API
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

// 🛡️ API Fetch with AGGRESSIVE CACHING (Ghost Buster V2)
export async function loadMyBoostersFromAPI(forceRefresh = false) {
    if (!State.userAddress) return [];

    try {
        // 1. Pega lista da API
        const response = await fetchWithTimeout(`${API_ENDPOINTS.getBoosters}/${State.userAddress}`, 5000);
        if (!response.ok) throw new Error(`API Error`);
        
        let ownedTokensAPI = await response.json(); 
        
        // 2. Validação "Ghost Buster" (Confirma on-chain se ainda é dono)
        // Usa uma instância leve do contrato
        const minABI = ["function ownerOf(uint256) view returns (address)"];
        const contract = getContractInstance(addresses.rewardBoosterNFT, minABI, State.rewardBoosterContractPublic);

        if (contract && ownedTokensAPI.length > 0) {
            const checks = await Promise.all(ownedTokensAPI.map(async (token) => {
                const id = BigInt(token.tokenId);
                const cacheKey = `ownerOf-${id}`;
                const now = Date.now();

                // [OTIMIZAÇÃO] Verifica Cache Local antes de chamar RPC
                if (!forceRefresh && ownershipCache.has(cacheKey)) {
                    const cachedData = ownershipCache.get(cacheKey);
                    if (now - cachedData.timestamp < OWNERSHIP_CACHE_MS) {
                        if (cachedData.owner.toLowerCase() === State.userAddress.toLowerCase()) {
                            return { tokenId: id, boostBips: Number(token.boostBips || 0) };
                        }
                        return null; // Cache diz que vendeu
                    }
                }

                try {
                    // Chama RPC (Sem retry agressivo para não bloquear)
                    const owner = await contract.ownerOf(id);
                    ownershipCache.set(cacheKey, { owner, timestamp: now });

                    if (owner.toLowerCase() === State.userAddress.toLowerCase()) {
                        return { tokenId: id, boostBips: Number(token.boostBips || 0) };
                    }
                    return null; // Vendeu recentemente
                } catch(e) {
                    // Se der erro de RPC, confia na API temporariamente (Otimismo)
                    if(isRateLimitError(e)) {
                        return { tokenId: id, boostBips: Number(token.boostBips || 0) };
                    }
                    return null;
                }
            }));
            // Filtra nulos
            State.myBoosters = checks.filter(t => t !== null);
        } else {
            State.myBoosters = ownedTokensAPI.map(tokenData => ({
                tokenId: BigInt(tokenData.tokenId),
                boostBips: Number(tokenData.boostBips || 0)
            }));
        }
        
        return State.myBoosters;

    } catch (e) { 
        // console.error("Error fetching boosters:", e); // Opcional: silenciar para user
        return []; 
    }
}