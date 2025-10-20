// modules/data.js

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { formatBigNumber, formatPStake } from '../utils.js';
import { addresses, boosterTiers, ipfsGateway } from '../config.js';

// ====================================================================
// FUNÇÕES DE SEGURANÇA E RESILIÊNCIA (EXPORTADAS PARA USO EM OUTROS MODULES)
// ====================================================================

// Função auxiliar para buscar saldo com fallback seguro, tratando BAD_DATA
export const safeBalanceOf = async (contract, address) => {
    try {
        // Tenta buscar o saldo
        return await contract.balanceOf(address);
    } catch (e) {
        // Se der erro de BAD_DATA ou CALL_EXCEPTION, assume 0n e avisa
        if (e.code === 'BAD_DATA' || e.code === 'CALL_EXCEPTION') {
            console.warn(`SafeBalanceOf: Falha ao buscar saldo para ${address}. Assumindo 0n.`, e);
            return 0n;
        }
        // Para outros erros, relança
        throw e;
    }
};

// Função auxiliar genérica para chamadas de contrato view/pure que podem reverter
export const safeContractCall = async (contract, method, args = [], fallbackValue = 0n) => {
    try {
        // Tenta chamar o método do contrato com os argumentos fornecidos
        const result = await contract[method](...args);
        return result;
    } catch (e) {
        // Se der erro de BAD_DATA ou CALL_EXCEPTION, retorna o valor fallback e avisa
        if (e.code === 'BAD_DATA' || e.code === 'CALL_EXCEPTION') {
            console.warn(`SafeContractCall (${method}): Falha com BAD_DATA/CALL_EXCEPTION. Retornando fallback.`, e);
            // Garante que o fallback seja copiado se for um objeto
            if (typeof fallbackValue === 'object' && fallbackValue !== null && !Array.isArray(fallbackValue) && typeof fallbackValue !== 'bigint') {
                 return { ...fallbackValue };
            }
            return fallbackValue;
        }
        // Para outros erros inesperados, registra o erro e retorna o fallback
        console.error(`SafeContractCall (${method}) unexpected error:`, e);
        return fallbackValue;
    }
};

// ====================================================================
// INÍCIO: NOVA FUNÇÃO HÍBRIDA (LAZY LOADING)
// ====================================================================

/**
 * Busca o txHash de um item específico sob demanda, consultando o histórico de eventos.
 * Esta é a função de "carregamento lento" que é chamada quando o usuário clica em um item
 * de histórico que não tinha um txHash pré-carregado.
 * * @param {string} itemType 'delegation', 'certificate', etc.
 * @param {string} itemId O ID do item (delegationIndex ou tokenId).
 * @param {string} userAddress O endereço do usuário (para filtrar eventos).
 * @returns {string | null} O hash da transação ou nulo se não for encontrado.
 */
export async function findTxHashForItem(itemType, itemId, userAddress) {
    if (!State.publicProvider) return null;

    let contract;
    let eventFilter;
    let idKey; // O nome do argumento no evento (ex: 'delegationIndex' ou 'tokenId')

    try {
        switch (itemType) {
            case 'Delegation':
                contract = State.delegationManagerContract;
                // Filtra pelo evento 'Delegated'
                // Precisamos filtrar por usuário (msg.sender) e pelo índice
                // Infelizmente, 'delegationIndex' não é 'indexed' no evento.
                // Vamos filtrar por usuário e encontrar o índice manualmente.
                eventFilter = contract.filters.Delegated(userAddress, null); 
                idKey = 'delegationIndex';
                break;
                
            case 'VestingCertReceived':
                contract = State.rewardManagerContract;
                // Filtra pelo evento 'VestingCertificateCreated'
                // Filtra por 'recipient' e 'tokenId'
                eventFilter = contract.filters.VestingCertificateCreated(null, userAddress, BigInt(itemId));
                idKey = 'tokenId';
                break;
            
            // Adicionar outros tipos aqui se necessário (ex: Unstake)
            
            default:
                console.warn(`findTxHashForItem: Tipo de item desconhecido: ${itemType}`);
                return null;
        }

        // Define um range de blocos (ex: últimos 50000 blocos) para não sobrecarregar
        const latestBlock = await State.publicProvider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 50000); // Ajuste este range se necessário

        const events = await contract.queryFilter(eventFilter, fromBlock, 'latest');

        if (!events || events.length === 0) {
            console.log(`Nenhum evento encontrado para ${itemType} ID ${itemId}`);
            return null;
        }

        // Procura o evento específico
        // (O filtro já deve ter feito isso para o Certificado, mas fazemos de novo para garantir)
        for (let i = events.length - 1; i >= 0; i--) { // Começa do mais recente
            const event = events[i];
            const eventId = event.args[idKey];
            
            if (eventId && eventId.toString() === itemId.toString()) {
                return event.transactionHash; // Encontramos!
            }
        }
        
        console.log(`Evento ${itemType} ID ${itemId} não encontrado nos resultados filtrados.`);
        return null;

    } catch (e) {
        console.error(`Erro ao buscar txHash para ${itemType} ID ${itemId}:`, e);
        return null;
    }
}

// ====================================================================
// FIM: NOVA FUNÇÃO HÍBRIDA
// ====================================================================


export async function loadPublicData() {
    // Garante que os provedores e contratos públicos estejam inicializados
    if (!State.publicProvider || !State.bkcTokenContract || !State.delegationManagerContract) return;

    try {
        const publicDelegationContract = State.delegationManagerContract;
        const publicBkcContract = State.bkcTokenContract;

        // Busca o total supply de forma segura
        let totalSupply = await safeContractCall(publicBkcContract, 'totalSupply', [], 0n);

        // Busca vários dados públicos em paralelo
        const [
            totalPStake_BUGGY, validators, MINT_POOL, TGE_SUPPLY, // Renomeado totalPStake para _BUGGY
            delegatedManagerBalance, nftPoolBalance, rewardManagerBalance, actionsManagerBalance
        ] = await Promise.all([
            // Busca o pStake total da rede
            safeContractCall(publicDelegationContract, 'totalNetworkPStake', [], 0n),
            // Busca a lista de validadores registrados
            safeContractCall(publicDelegationContract, 'getAllValidators', [], []),
            // Busca a constante MINT_POOL (total minerável)
            safeContractCall(publicDelegationContract, 'MINT_POOL', [], 0n),
            // Busca a constante TGE_SUPPLY (supply inicial)
            safeContractCall(publicDelegationContract, 'TGE_SUPPLY', [], 0n),

            // Busca os saldos de BKC nos contratos relevantes para calcular o % bloqueado
            safeBalanceOf(publicBkcContract, addresses.delegationManager), // Saldo do DelegationManager
            safeBalanceOf(publicBkcContract, addresses.nftBondingCurve), // Saldo do NFTLiquidityPool
            safeBalanceOf(publicBkcContract, addresses.rewardManager), // Saldo do RewardManager
            safeBalanceOf(publicBkcContract, addresses.actionsManager) // Saldo do FortuneTiger (ActionsManager)
        ]);

        // Se a busca direta do totalSupply falhar, usa o TGE_SUPPLY como fallback
        if (totalSupply === 0n && TGE_SUPPLY > 0n) {
             totalSupply = TGE_SUPPLY;
             console.warn("Usando TGE_SUPPLY como estimativa de Total Supply devido à falha na chamada totalSupply().");
        }

        // Calcula o total de tokens bloqueados somando os saldos dos contratos
        const totalLockedWei = delegatedManagerBalance + nftPoolBalance + rewardManagerBalance + actionsManagerBalance;
        let lockedPercentage = 0;

        // Calcula a porcentagem bloqueada em relação ao total supply
        if (totalSupply > 0n) {
             lockedPercentage = (Number(totalLockedWei) * 100) / Number(totalSupply);
        }

        // Atualiza os elementos do DOM com os dados públicos
        DOMElements.statTotalSupply.textContent = `${formatBigNumber(totalSupply).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        
        DOMElements.statValidators.textContent = validators.length;

        const lockedEl = document.getElementById('statLockedPercentage');
        if (lockedEl) lockedEl.textContent = `${lockedPercentage.toFixed(2)}%`;

        const scarcityRateEl = document.getElementById('statScarcity');
        // Calcula quanto já foi minerado além do TGE
        const currentMinted = totalSupply > TGE_SUPPLY ? totalSupply - TGE_SUPPLY : 0n;
        // Calcula quanto ainda pode ser minerado
        const remainingMintable = MINT_POOL - currentMinted;

        // Calcula a taxa de escassez (quanto % do pool de mineração ainda resta)
        let scarcityRate = 0n;
        if (MINT_POOL > 0n) { // Evita divisão por zero
            scarcityRate = (remainingMintable * 10000n) / MINT_POOL;
        } else {
             // Caso MINT_POOL seja 0, a escassez é 100% se nada foi mintado, 0% caso contrário
             scarcityRate = (totalSupply === 0n && remainingMintable > 0n) ? 10000n : 0n;
        }

        if (scarcityRateEl) scarcityRateEl.textContent = `${(Number(scarcityRate) / 100).toFixed(2)}%`;


        // Busca os dados detalhados de cada validador
        if (validators.length === 0) {
            State.allValidatorsData = [];
        } else {
            const validatorDataPromises = validators.map(async (addr) => {
                const fallbackStruct = { isRegistered: false, selfStakeAmount: 0n, totalDelegatedAmount: 0n, totalPStake: 0n };
                // Busca informações do validador (stake próprio, stake delegado)
                const validatorInfo = await safeContractCall(publicDelegationContract, 'validators', [addr], fallbackStruct);
                
                // =================================================================
                // CORREÇÃO DO BUG (Pedido 4): Usar `validatorInfo.totalPStake`
                // O pStake total do validador (self-stake + delegações recebidas) está em 'validatorInfo.totalPStake'.
                // A chamada 'userTotalPStake' era incorreta para este contexto.
                // =================================================================
                const pStake = validatorInfo.totalPStake;

                return {
                    addr,
                    pStake, // <-- CORRIGIDO
                    selfStake: validatorInfo.selfStakeAmount,
                    delegatedStake: validatorInfo.totalDelegatedAmount
                };
            });
            State.allValidatorsData = await Promise.all(validatorDataPromises);
        }

        // --- CORREÇÃO BUG 1 (pStake Inconsistente) ---
        // O totalNetworkPStake do contrato está incorreto (não é atualizado no registerValidator)
        // Recalculamos o total somando o pStake de todos os validadores
        const recalculatedTotalPStake = State.allValidatorsData.reduce((acc, val) => acc + val.pStake, 0n);
        
        // Usamos o valor recalculado (mais preciso) em vez do valor do contrato (totalPStake_BUGGY)
        DOMElements.statTotalPStake.textContent = formatPStake(recalculatedTotalPStake);
        // --- FIM DA CORREÇÃO ---

    } catch (e) { console.error("Error loading public data", e)}
}

// --- LÓGICA DE DADOS DO USUÁRIO ---

export async function loadUserData() {
    // Garante que o usuário esteja conectado
    if (!State.signer || !State.userAddress) return;

    const statUserPStake = document.getElementById('statUserPStake');
    const statUserRewards = document.getElementById('statUserRewards');
    const dashboardClaimBtn = document.getElementById('dashboardClaimBtn');

    try {
        // Busca o saldo, as delegações e o pStake do usuário em paralelo
        const [balance, delegationsRaw, totalUserPStake] = await Promise.all([
            // Saldo de BKC do usuário
            safeBalanceOf(State.bkcTokenContract, State.userAddress),
            // Lista de delegações ativas do usuário
            safeContractCall(State.delegationManagerContract, 'getDelegationsOf', [State.userAddress], []),
            // pStake total do usuário
            safeContractCall(State.delegationManagerContract, 'userTotalPStake', [State.userAddress], 0n)
        ]);

        // Atualiza o estado global com os dados do usuário
        State.currentUserBalance = balance;
        
        // Mapeia os dados brutos das delegações para um formato mais fácil de usar
        // NOTA: delegationsRaw (do contrato) não inclui txHash.
        State.userDelegations = delegationsRaw.map((d, index) => ({
            amount: d[0], unlockTime: d[1],
            lockDuration: d[2], validator: d[3], index,
            txHash: null // <-- txHash será buscado sob demanda (lazy loading)
        }));
        
        // *** ADIÇÃO PARA CORRIGIR BUG 2 ***
        // Armazena o pStake total do usuário no estado
        State.userTotalPStake = totalUserPStake;
        // *** FIM DA ADIÇÃO ***

        // Atualiza os elementos do DOM relacionados à posição do usuário
        if(statUserPStake) statUserPStake.textContent = formatPStake(totalUserPStake);

        // Calcula e exibe as recompensas totais reivindicáveis
        const { totalRewards } = await calculateUserTotalRewards();
        if(statUserRewards) statUserRewards.textContent = `${formatBigNumber(totalRewards).toFixed(4)}`;

        // Habilita ou desabilita o botão de reivindicar no dashboard
        if (dashboardClaimBtn) {
            if (totalRewards > 0n) {
                dashboardClaimBtn.classList.remove('opacity-0', 'btn-disabled');
                dashboardClaimBtn.disabled = false;
            } else {
                dashboardClaimBtn.classList.add('opacity-0', 'btn-disabled');
                dashboardClaimBtn.disabled = true;
            }
        }
    } catch (e) {
        console.error("Error loading user data:", e);
    }
}

export async function calculateUserTotalRewards() {
    // Garante que os contratos e o endereço do usuário estejam disponíveis
    if (!State.delegationManagerContract || !State.rewardManagerContract || !State.userAddress) {
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }

    try {
        // Busca as recompensas pendentes de delegação
        const delegatorReward = await safeContractCall(State.delegationManagerContract, 'pendingDelegatorRewards', [State.userAddress], 0n);
        // Busca as recompensas pendentes de mineração (PoP)
        const minerRewards = await safeContractCall(State.rewardManagerContract, 'minerRewardsOwed', [State.userAddress], 0n);

        const stakingRewards = delegatorReward; // Atualmente, apenas recompensas de delegador são consideradas 'staking'
        return { stakingRewards, minerRewards, totalRewards: stakingRewards + minerRewards };

    } catch (e) {
        console.error("Error in calculateUserTotalRewards:", e);
        return { stakingRewards: 0n, minerRewards: 0n, totalRewards: 0n };
    }
}

export async function getHighestBoosterBoost() {
    // Garante que o contrato booster e o endereço do usuário estejam disponíveis
    if (!State.rewardBoosterContract || !State.userAddress) {
        return { highestBoost: 0, boostName: 'None', imageUrl: '', tokenId: null, efficiency: 50 };
    }

    // Tenta carregar os boosters. loadMyBoosters agora trata o erro de limite RPC internamente.
    await loadMyBoosters();


    // Se myBoosters está vazio (seja por falha no carregamento ou por não ter NFTs), retorna o padrão.
    if (!State.myBoosters || State.myBoosters.length === 0) {
        return { highestBoost: 0, boostName: 'None', imageUrl: '', tokenId: null, efficiency: 50 };
    }

    try {
        // Encontra o booster com o maior 'boostBips' do array carregado
        const highestBooster = State.myBoosters.reduce((max, booster) => booster.boostBips > max.boostBips ? booster : max, State.myBoosters[0]);

        const highestBoost = highestBooster.boostBips;
        const bestTokenId = highestBooster.tokenId;

        // Calcula a eficiência final (base 50% + boost, máximo 100%)
        const boostPercent = highestBoost / 100;
        const finalEfficiency = Math.min(50 + boostPercent, 100);

        // Encontra os detalhes do tier (imagem, nome) com base no boostBips
        const tier = boosterTiers.find(t => t.boostBips === highestBoost);
        let imageUrl = tier?.img || '';
        let nftName = tier?.name ? `${tier.name} Booster` : 'Booster NFT';

        // Tenta buscar metadados on-chain (nome, imagem) para ter a informação mais atualizada
        try {
            const tokenURI = await safeContractCall(State.rewardBoosterContract, 'tokenURI', [bestTokenId], '');
            if (tokenURI) {
                // Converte URI IPFS para gateway HTTP
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

        // Retorna os dados do booster de maior valor
        return { highestBoost, boostName: nftName, imageUrl, tokenId: bestTokenId.toString(), efficiency: finalEfficiency };

    } catch (e) {
        console.error("Error processing highest booster:", e);
        // Retorna um estado padrão seguro se houver erro ao processar boosters carregados
        return { highestBoost: 0, boostName: 'Error Loading', imageUrl: '', tokenId: null, efficiency: 50 };
    }
}


export async function loadMyCertificates() {
    // Garante que o usuário esteja conectado e o contrato exista
    if (!State.signer || !State.rewardManagerContract) return [];

    try {
        // Busca quantos certificados (NFTs) o usuário possui
        const balance = await safeBalanceOf(State.rewardManagerContract, State.userAddress);
        const count = Number(balance);
        if (count === 0) {
             State.myCertificates = [];
             return [];
        }

        const tokenIds = [];

        // Itera para buscar o ID de cada certificado do usuário
        for (let i = 0; i < count; i++) {
            try {
                // Chama a função da ABI corrigida
                const tokenId = await safeContractCall(State.rewardManagerContract, 'tokenOfOwnerByIndex', [State.userAddress, i], 0n);

                if (tokenId !== 0n) {
                    tokenIds.push(tokenId);
                } else {
                     // Se retornar 0, pode indicar fim da lista ou erro, parar por segurança
                     break;
                }
            } catch (e) {
                console.error(`Falha ao carregar certificado de índice ${i}. Abortando listagem.`, e);
                State.myCertificates = []; // Limpa para evitar dados parciais
                return State.myCertificates; // Retorna imediatamente em caso de erro
            }
        }
        
        // NOTA: Esta função também não pode buscar o txHash de forma eficiente.
        State.myCertificates = tokenIds.reverse().map(id => ({ 
            tokenId: id,
            txHash: null // <-- txHash será buscado sob demanda (lazy loading)
        }));
        return State.myCertificates;

    } catch (e) {
        console.error("Erro ao carregar certificados de vesting:", e);
        State.myCertificates = []; // Garante estado limpo em caso de erro
        return [];
    }
}

export async function loadMyBoosters() {
    // Evita recarregar desnecessariamente se já foi carregado e não teve erro
    if (State.myBoosters && State.myBoosters.length > 0) {
        return State.myBoosters;
    }

    State.myBoosters = []; // Reseta antes de tentar carregar

    // Garante que o usuário esteja conectado e os contratos/provedores existam
    if (!State.signer || !State.rewardBoosterContract || !State.publicProvider) return [];

    try {
        console.log("Loading user boosters by querying Transfer events...");

        const userAddress = State.userAddress;
        const contract = State.rewardBoosterContract;

        // Obtém o bloco mais recente
        const latestBlock = await State.publicProvider.getBlockNumber();
        // Define o limite de blocos para a consulta (baixo para evitar erro RPC)
        const blockLimit = 10000; // Mantém o limite baixo
        // Calcula o bloco inicial da consulta
        const fromBlock = Math.max(0, latestBlock - blockLimit);
        console.log(`Querying booster events from block ${fromBlock} to latest (${latestBlock})`);

        // Cria filtros para eventos de transferência PARA e DE o usuário
        const transferToUserFilter = contract.filters.Transfer(null, userAddress);
        const transferFromUserFilter = contract.filters.Transfer(userAddress, null);

        // Executa as consultas de eventos em paralelo
        const [toEvents, fromEvents] = await Promise.all([
            contract.queryFilter(transferToUserFilter, fromBlock, 'latest'),
            contract.queryFilter(transferFromUserFilter, fromBlock, 'latest')
        ]);

        // Processa os eventos para determinar quais NFTs o usuário possui atualmente
        const ownedTokens = new Map();
        
        // =================================================================
        // CORREÇÃO (Pedido 3): Capturar txHash e timestamp dos eventos
        // =================================================================

        // 1. Processa eventos "PARA" o usuário, buscando o timestamp
        const toEventsWithData = await Promise.all(toEvents.map(async (event) => ({
            tokenId: event.args.tokenId,
            txHash: event.transactionHash,
            timestamp: (await event.getBlock()).timestamp
        })));

        // Adiciona todos os tokens transferidos PARA o usuário
        toEventsWithData.forEach(data => {
            ownedTokens.set(data.tokenId.toString(), data);
        });
        
        // Remove todos os tokens transferidos DE o usuário
        fromEvents.forEach(event => {
            const tokenId = event.args.tokenId;
            ownedTokens.delete(tokenId.toString());
        });

        // Converte o Map de tokens possuídos em um array de IDs e dados
        // 'ownedTokens.values()' agora contém { tokenId, txHash, timestamp }
        const currentOwnedTokenData = Array.from(ownedTokens.values());


        // Se não encontrou tokens no intervalo de blocos consultado
        if (currentOwnedTokenData.length === 0) {
            console.log("No boosters found in the queried block range.");
            State.myBoosters = [];
            return []; // Retorna array vazio, sem erro
        }

        // Busca os detalhes (boostBips) de cada token possuído
        const boosterDetailsPromises = currentOwnedTokenData.map(async (tokenData) => {
            const boostBips = await safeContractCall(contract, 'boostBips', [tokenData.tokenId], 0n);
            return {
                tokenId: tokenData.tokenId,
                boostBips: Number(boostBips),
                txHash: tokenData.txHash,           // <-- Passa o txHash
                acquisitionTime: tokenData.timestamp // <-- Passa o timestamp
            };
        });

        // Aguarda todas as buscas de detalhes
        const boosterDetails = await Promise.all(boosterDetailsPromises);

        // Armazena os detalhes dos boosters no estado global
        State.myBoosters = boosterDetails;
        console.log(`Found ${boosterDetails.length} boosters for user.`);
        return boosterDetails; // Retorna os boosters encontrados

    // <<< CORREÇÃO APLICADA AQUI: Removido ': any' do catch >>>
    } catch (e) {
        // AJUSTE CRÍTICO: Captura o erro específico de limite RPC (-32005)
        // O erro original 'e' pode ser um erro genérico do Ethers ('UNKNOWN_ERROR')
        // precisamos olhar dentro dele para achar o código RPC real.
        const rpcErrorCode = e?.error?.code ?? e?.code; // Tenta acessar o código RPC interno

        if (rpcErrorCode === -32005) {
            // Código -32005 é o erro "query returned more than 10000 results"
            console.warn("Could not load boosters due to RPC query limit. Booster functionality might be affected.", e.message);
            State.myBoosters = []; // Garante que a lista está vazia
            return []; // Retorna array vazio, *sem lançar o erro* para não travar o app
        } else {
            // Para outros erros inesperados, registra e lança
            console.error("CRITICAL Error loading My Boosters via event query:", e);
            State.myBoosters = [];
            throw e; // Lança outros erros para depuração, pois podem indicar problemas reais
        }
    }
}