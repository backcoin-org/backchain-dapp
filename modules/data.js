// data.js
// ARQUIVO ATUALIZADO: Revertido o endpoint 'uploadFileToIPFS' para a Vercel (API relativa).
// Todos os outros endpoints (GCloud) permanecem.

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { formatBigNumber, formatPStake } from '../utils.js';
import { addresses, boosterTiers, ipfsGateway } from '../config.js';

// ====================================================================
// ENDPOINTS DE API
// ====================================================================
export const API_ENDPOINTS = {
    // 1. APIs do Projeto Principal: backchain-backand (Google Cloud Functions)
    // Estes estão corretos, pois são apenas leituras de dados.
    getHistory: 'https://gethistory-4wvdcuoouq-uc.a.run.app',
    getBoosters: 'https://getboosters-4wvdcuoouq-uc.a.run.app',
    getSystemData: 'https://getsystemdata-4wvdcuoouq-uc.a.run.app',

    // 2. API Pinata/Upload (Revertida para a Vercel)
    // ✅ CORREÇÃO: Movido do GCloud de volta para a Vercel para velocidade.
    // O NotaryPage.js chamará este endpoint.
    // Isso assume que seu arquivo de API na Vercel está em /api/uploadfiletoipfs.js
    uploadFileToIPFS: '/api/uploadfiletoipfs', 
    
    // 3. API Airdrop (Projeto SEPARADO: airdropbackchainnew)
    claimAirdrop: 'https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop'
};


// ====================================================================
// Funções de Segurança e Resiliência (Sem alterações)
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
// loadSystemDataFromAPI (Sem alterações)
// ====================================================================
export async function loadSystemDataFromAPI() {
    
    if (!State.systemFees) State.systemFees = {};
    if (!State.systemPStakes) State.systemPStakes = {};
    if (!State.boosterDiscounts) State.boosterDiscounts = {};

    try {
        console.log("Loading system rules from API...");
        const response = await fetch(API_ENDPOINTS.getSystemData); 
        
        if (!response.ok) {
            throw new Error(`API (getSystemData) Error: ${response.statusText} (${response.status})`);
        }
        const systemData = await response.json(); 

        State.systemFees = {};
        for (const key in systemData.fees) {
             State.systemFees[key] = BigInt(systemData.fees[key]);
        }
        
        State.systemPStakes = {};
        for (const key in systemData.pStakeRequirements) {
             State.systemPStakes[key] = BigInt(systemData.pStakeRequirements[key]);
        }
        
        State.boosterDiscounts = systemData.discounts; 
        
        console.log("System rules loaded and synced to State.");
        return true;

    } catch (e) {
        console.error("CRITICAL Error loading system data from API:", e);
        return false;
    }
}
// ====================================================================


// ====================================================================
// LÓGICA DE DADOS PÚBLICOS E PRIVADOS (Sem alterações)
// ====================================================================

export async function loadPublicData() {
    if (!State.publicProvider || !State.bkcTokenContractPublic || !State.delegationManagerContractPublic) return;

    try {
        const publicDelegationContract = State.delegationManagerContractPublic;
        const publicBkcContract = State.bkcTokenContractPublic;

        const [
            totalSupply, 
            validators, 
            MAX_SUPPLY, 
            TGE_SUPPLY
        ] = await Promise.all([
            safeContractCall(publicBkcContract, 'totalSupply', [], 0n), 
            safeContractCall(publicDelegationContract, 'getAllValidators', [], []),
            safeContractCall(publicBkcContract, 'MAX_SUPPLY', [], 0n), 
            safeContractCall(publicBkcContract, 'TGE_SUPPLY', [], 0n)
        ]);

        const MINT_POOL = MAX_SUPPLY > TGE_SUPPLY ? MAX_SUPPLY - TGE_SUPPLY : 0n;
        if (totalSupply === 0n && TGE_SUPPLY > 0n) {
             console.warn("Usando TGE_SUPPLY como estimativa de Total Supply devido à falha na chamada totalSupply().");
        }
        
        if (validators.length === 0) {
            State.allValidatorsData = [];
        } else {
            const validatorDataPromises = validators.map(async (addr) => {
                const fallbackStruct = { isRegistered: false, selfStakeAmount: 0n, totalDelegatedAmount: 0n, totalPStake: 0n };
                const validatorInfo = await safeContractCall(publicDelegationContract, 'validators', [addr], fallbackStruct);
                
                const pStake = validatorInfo.totalPStake; 

                return {
                    addr,
                    pStake, 
                    selfStake: validatorInfo.selfStakeAmount,
                    totalDelegatedAmount: validatorInfo.totalDelegatedAmount
                };
            });
            State.allValidatorsData = await Promise.all(validatorDataPromises);
        }

        const recalculatedTotalPStake = State.allValidatorsData.reduce((acc, val) => acc + val.pStake, 0n);
        State.totalNetworkPStake = recalculatedTotalPStake;
        
        await loadSystemDataFromAPI();

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
        
        State.userDelegations = delegationsRaw.map((d, index) => ({
            amount: d[0], unlockTime: d[1],
            lockDuration: d[2], validator: d[3], index,
            txHash: null 
        }));
        
        State.userTotalPStake = totalUserPStake;
        
    } catch (e) {
        console.error("Error loading user data:", e);
    }
}

export async function calculateUserTotalRewards() {
    if (!State.delegationManagerContract || !State.userAddress) {
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }

    try {
        const delegatorReward = await safeContractCall(State.delegationManagerContract, 'pendingDelegatorRewards', [State.userAddress], 0n);
        const minerRewards = await safeContractCall(State.delegationManagerContract, 'pendingValidatorRewards', [State.userAddress], 0n);

        const stakingRewards = delegatorReward;
        return { stakingRewards, minerRewards, totalRewards: stakingRewards + minerRewards };

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