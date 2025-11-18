// data.js
// ARQUIVO FINAL: Aponta o uploadFileToIPFS para /api/upload (o endpoint gerado pelo upload.js na Vercel)

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { formatBigNumber, formatPStake } from '../utils.js';
import { addresses, boosterTiers, ipfsGateway } from '../config.js';

// ====================================================================
// CONSTANTES E UTILITÁRIOS (NOVOS)
// ====================================================================
const API_TIMEOUT_MS = 10000; // 10 segundos de timeout para APIs lentas

// Cache para dados do sistema para evitar chamadas excessivas
let systemDataCache = null;
let systemDataCacheTime = 0;
const CACHE_DURATION_MS = 60000; // 1 minuto de cache

/**
 * Executa um fetch com um tempo limite.
 * Se o tempo limite for atingido, a promise é rejeitada.
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
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
// ENDPOINTS DE API
// ====================================================================
export const API_ENDPOINTS = {
    // 1. APIs do Projeto Principal: backchain-backand (Google Cloud Functions)
    getHistory: 'https://gethistory-4wvdcuoouq-uc.a.run.app',
    getBoosters: 'https://getboosters-4wvdcuoouq-uc.a.run.app',
    getSystemData: 'https://getsystemdata-4wvdcuoouq-uc.a.run.app',
    
    // NOVO ENDPOINT: (O URL será este após o deploy do Firebase)
    getNotaryHistory: 'https://getnotaryhistory-4wvdcuoouq-uc.a.run.app',

    // 2. API Pinata/Upload (Vercel)
    uploadFileToIPFS: '/api/upload', 
    
    // 3. API Airdrop (Projeto SEPARADO: airdropbackchainnew)
    claimAirdrop: 'https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop'
};


// ====================================================================
// Funções de Segurança e Resiliência 
// ====================================================================

export const safeBalanceOf = async (contract, address) => {
    try {
        return await contract.balanceOf(address);
    } catch (e) {
        if (e.code === 'BAD_DATA' || e.code === 'CALL_EXCEPTION') {
            console.warn(`SafeBalanceOf: Falha ao buscar saldo para ${address}. Assumindo 0n.`, e);
            return 0n;
        }
        throw e;
    }
};

export const safeContractCall = async (contract, method, args = [], fallbackValue = 0n) => {
    try {
        const result = await contract[method](...args);
        return result;
    } catch (e) {
        if (e.code === 'BAD_DATA' || e.code === 'CALL_EXCEPTION') {
            console.warn(`SafeContractCall (${method}): Falha com BAD_DATA/CALL_EXCEPTION. Retornando fallback.`, e);
            if (typeof fallbackValue === 'object' && fallbackValue !== null && !Array.isArray(fallbackValue) && typeof fallbackValue !== 'bigint') {
                 return { ...fallbackValue };
            }
            return fallbackValue;
        }
        console.error(`SafeContractCall (${method}) unexpected error:`, e);
        return fallbackValue;
    }
};

// ====================================================================
// loadSystemDataFromAPI (AJUSTADA COM TIMEOUT E CACHE)
// ====================================================================
export async function loadSystemDataFromAPI() {
    
    if (!State.systemFees) State.systemFees = {};
    if (!State.systemPStakes) State.systemPStakes = {};
    if (!State.boosterDiscounts) State.boosterDiscounts = {};

    // Verifica Cache
    const now = Date.now();
    if (systemDataCache && (now - systemDataCacheTime < CACHE_DURATION_MS)) {
        console.log("Using cached system data.");
        // Popula o State com o cache
        applySystemDataToState(systemDataCache);
        return true;
    }

    try {
        console.log("Loading system rules from API with 10s timeout...");
        
        // CORREÇÃO: Usa fetchWithTimeout
        const response = await fetchWithTimeout(API_ENDPOINTS.getSystemData, API_TIMEOUT_MS); 
        
        if (!response.ok) {
            throw new Error(`API (getSystemData) Error: ${response.statusText} (${response.status})`);
        }
        const systemData = await response.json(); 

        applySystemDataToState(systemData);
        
        // Atualiza Cache
        systemDataCache = systemData;
        systemDataCacheTime = now;
        
        console.log("System rules loaded and synced to State.");
        return true;

    } catch (e) {
        // Agora, se houver falha (CORS ou Timeout), o erro aparece rápido
        console.error("CRITICAL Error loading system data from API:", e.message);
        // O restante do loadPublicData() e a UI não serão bloqueados por 1 minuto.
        return false;
    }
}

function applySystemDataToState(systemData) {
    State.systemFees = {};
    for (const key in systemData.fees) {
         State.systemFees[key] = BigInt(systemData.fees[key]);
    }
    
    State.systemPStakes = {};
    for (const key in systemData.pStakeRequirements) {
         State.systemPStakes[key] = BigInt(systemData.pStakeRequirements[key]);
    }
    
    State.boosterDiscounts = systemData.discounts; 
}

// ====================================================================


// ====================================================================
// LÓGICA DE DADOS PÚBLICOS E PRIVADOS 
// ====================================================================

export async function loadPublicData() {
    if (!State.publicProvider || !State.bkcTokenContractPublic || !State.delegationManagerContractPublic) return;

    try {
        const publicDelegationContract = State.delegationManagerContractPublic;
        const publicBkcContract = State.bkcTokenContractPublic;

        const [
            totalSupply, 
            // validators (removido, pois getAllValidators não existe mais)
            MAX_SUPPLY, 
            TGE_SUPPLY
        ] = await Promise.all([
            safeContractCall(publicBkcContract, 'totalSupply', [], 0n), 
            // safeContractCall(publicDelegationContract, 'getAllValidators', [], []), // REMOVED
            safeContractCall(publicBkcContract, 'MAX_SUPPLY', [], 0n), 
            safeContractCall(publicBkcContract, 'TGE_SUPPLY', [], 0n)
        ]);

        const MINT_POOL = MAX_SUPPLY > TGE_SUPPLY ? MAX_SUPPLY - TGE_SUPPLY : 0n;
        if (totalSupply === 0n && TGE_SUPPLY > 0n) {
             console.warn("Usando TGE_SUPPLY como estimativa de Total Supply due to totalSupply() call failure.");
        }
        
        // Como não há mais validadores individuais públicos para listar, limpamos o array ou usamos dados mock se necessário para UI legacy
        State.allValidatorsData = []; 

        // Carrega o Total Network pStake diretamente
        const totalPStake = await safeContractCall(publicDelegationContract, 'totalNetworkPStake', [], 0n);
        State.totalNetworkPStake = totalPStake;
        
        // Chamada à API com Timeout
        await loadSystemDataFromAPI();
        
        // Se a chamada acima falhar, o código continua aqui, permitindo que a UI atualize
        // com os dados on-chain (TVL, Validators, etc.)
        if (window.updateUIState) {
            window.updateUIState();
        }

    } catch (e) { 
        console.error("Error loading public data", e)
        throw new Error(`Error loading public data: ${e.message}`);
    }
}

export async function loadUserData() {
    if (!State.signer || !State.userAddress) return;

    try {
        const [balance, delegationsRaw, totalUserPStake] = await Promise.all([
            safeBalanceOf(State.bkcTokenContract, State.userAddress),
            safeContractCall(State.delegationManagerContract, 'getDelegationsOf', [State.userAddress], []),
            safeContractCall(State.delegationManagerContract, 'userTotalPStake', [State.userAddress], 0n)
        ]);

        State.currentUserBalance = balance;
        
        // Mapeia a resposta da struct (que agora tem 3 campos: amount, unlockTime, lockDuration)
        // Ajustado para refletir a nova ABI sem 'validator'
        State.userDelegations = delegationsRaw.map((d, index) => ({
            amount: d[0], 
            unlockTime: d[1],
            lockDuration: d[2], 
            // validator: d[3], // REMOVIDO
            index,
            txHash: null 
        }));
        
        State.userTotalPStake = totalUserPStake;

        // Tenta carregar saldo nativo (ETH/MATIC) para verificações de gás
        if (State.provider) {
            const nativeBalance = await State.provider.getBalance(State.userAddress);
            State.currentUserNativeBalance = nativeBalance;
        }
        
    } catch (e) {
        console.error("Error loading user data:", e);
    }
}

export async function calculateUserTotalRewards() {
    if (!State.delegationManagerContract || !State.userAddress) {
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }

    try {
        // 1. Staking Rewards (Delegator) - Agora chamado 'pendingRewards' ou 'pendingDelegatorRewards' dependendo do contrato final
        // Vou assumir 'pendingRewards' conforme a nova ABI sugerida, mas mantenho fallback
        let stakingRewards = await safeContractCall(State.delegationManagerContract, 'pendingRewards', [State.userAddress], 0n);
        
        // Se falhar, tenta o nome antigo por compatibilidade se o contrato não foi atualizado exatamente como planejado
        if (stakingRewards === 0n) {
             stakingRewards = await safeContractCall(State.delegationManagerContract, 'pendingDelegatorRewards', [State.userAddress], 0n);
        }

        // 2. Miner Rewards (Validator) - REMOVED (Always 0)
        const minerRewards = 0n; 

        const totalRewards = stakingRewards + minerRewards;

        return { stakingRewards, minerRewards, totalRewards };

    } catch (e) {
        console.error("Error in calculateUserTotalRewards:", e);
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }
}

export async function calculateClaimDetails() {
    if (!State.delegationManagerContract || !State.ecosystemManagerContract || !State.userAddress) {
        return { netClaimAmount: 0n, feeAmount: 0n, discountPercent: 0, totalRewards: 0n, basePenaltyPercent: 0 };
    }
    
    const { totalRewards } = await calculateUserTotalRewards();
    if (totalRewards === 0n) {
        return { netClaimAmount: 0n, feeAmount: 0n, discountPercent: 0, totalRewards: 0n, basePenaltyPercent: 0 };
    }
    
    let baseFeeBips = State.systemFees?.CLAIM_REWARD_FEE_BIPS;
    if (!baseFeeBips) {
         baseFeeBips = await safeContractCall(State.ecosystemManagerContract, 'getFee', ["CLAIM_REWARD_FEE_BIPS"], 50n); 
    }

    const baseFeePercent = Number(baseFeeBips) / 100;
    
    const boosterData = await getHighestBoosterBoostFromAPI(); 
    
    let discountBips = State.boosterDiscounts?.[boosterData.highestBoost];
    if (!discountBips) {
        discountBips = await safeContractCall(State.ecosystemManagerContract, 'getBoosterDiscount', [BigInt(boosterData.highestBoost)], 0n);
    } else {
        discountBips = BigInt(discountBips);
    }
    
    const discountPercent = Number(discountBips) / 100;

    const finalFeeBips = baseFeeBips > discountBips ? baseFeeBips - discountBips : 0n;
    const finalFeeAmount = (totalRewards * finalFeeBips) / 10000n;
    
    const netClaimAmount = totalRewards - finalFeeAmount;
    
    return { 
        netClaimAmount, 
        feeAmount: finalFeeAmount, 
        discountPercent, 
        totalRewards, 
        basePenaltyPercent: baseFeePercent 
    };
}

export async function getHighestBoosterBoostFromAPI() {
    if (!State.rewardBoosterContract || !State.userAddress) {
        return { highestBoost: 0, boostName: 'None', imageUrl: '', tokenId: null, efficiency: 50 };
    }

    await loadMyBoostersFromAPI();

    if (!State.myBoosters || State.myBoosters.length === 0) {
        return { highestBoost: 0, boostName: 'None', imageUrl: '', tokenId: null, efficiency: 50 };
    }

    try {
        const highestBooster = State.myBoosters.reduce((max, booster) => booster.boostBips > max.boostBips ? booster : max, State.myBoosters[0]);

        const highestBoost = highestBooster.boostBips;
        const bestTokenId = highestBooster.tokenId;
        const boostPercent = highestBoost / 100;
        const finalEfficiency = Math.min(50 + boostPercent, 100); 

        const tier = boosterTiers.find(t => t.boostBips === highestBoost);
        let imageUrl = tier?.img || '';
        let nftName = tier?.name ? `${tier.name} Booster` : 'Booster NFT';

        try {
            const tokenURI = await safeContractCall(State.rewardBoosterContract, 'tokenURI', [bestTokenId], '');
            if (tokenURI) {
                const metadataResponse = await fetch(tokenURI.replace("ipfs://", ipfsGateway));
                if (metadataResponse.ok) {
                    const metadata = await metadataResponse.json();
                    imageUrl = metadata.image ? metadata.image.replace("ipfs://", ipfsGateway) : imageUrl;
                    nftName = metadata.name || nftName;
                }
            }
        } catch (e) {
            console.warn(`Could not fetch metadata for booster #${bestTokenId}:`, e);
        }

        return { highestBoost, boostName: nftName, imageUrl, tokenId: bestTokenId.toString(), efficiency: finalEfficiency };

    } catch (e) {
        console.error("Error processing highest booster:", e);
        return { highestBoost: 0, boostName: 'Error Loading', imageUrl: '', tokenId: null, efficiency: 50 };
    }
}

export async function loadMyBoostersFromAPI() {
    if (State.myBoosters && State.myBoosters.length > 0) {
        return State.myBoosters;
    }
    State.myBoosters = []; 

    if (!State.signer || !State.rewardBoosterContract || !State.userAddress) return [];

    try {
        console.log("Loading user boosters from API...");
        const userAddress = State.userAddress;
        
        // Uso de fetch original, pois falha na API de Booster é menos crítica que a de SystemData
        const response = await fetch(`${API_ENDPOINTS.getBoosters}/${userAddress}`);
        
        if (!response.ok) {
            throw new Error(`API (getBoosters) Error: ${response.statusText} (${response.status})`);
        }
        
        const ownedTokensAPI = await response.json(); 
        
        if (ownedTokensAPI.length === 0) {
            console.log("No boosters found via API.");
            State.myBoosters = [];
            return [];
        }

        const boosterDetails = ownedTokensAPI.map(tokenData => {
            return {
                tokenId: BigInt(tokenData.tokenId),
                boostBips: Number(tokenData.boostBips || 0), 
                txHash: null,
                acquisitionTime: tokenData.mintedAt || null
            };
        });

        State.myBoosters = boosterDetails;
        console.log(`Found ${boosterDetails.length} boosters for user via API.`);
        return boosterDetails;

    } catch (e) {
        console.error("CRITICAL Error loading My Boosters from API:", e);
        State.myBoosters = [];
        return []; 
    }
}