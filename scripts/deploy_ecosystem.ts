// scripts/deploy_ecosystem.ts
// ════════════════════════════════════════════════════════════════════════════
// 🚀 BACKCHAIN ECOSYSTEM - DEPLOY COMPLETO UNIFICADO V2.2
// ════════════════════════════════════════════════════════════════════════════
//
// CHANGELOG V2.2:
// - CharityPool: SERVICE_KEY corrigido para "CHARITY_POOL_SERVICE"
// - CharityPool: Configuração inicial de limites e taxas
// - CharityPool: maxActiveCampaignsPerWallet = 20
// - Autorização do CharityPool no MiningManager corrigida
//
// Este script executa o deploy completo do ecossistema Backcoin:
// - Deploy de todos os contratos (UUPS Proxies)
// - Configuração de taxas, distribuição e descontos
// - TGE (Token Generation Event)
// - Criação dos 7 NFT Liquidity Pools
// - Injeção de liquidez inicial
// - Genesis Stake
//
// PRÉ-REQUISITO:
// O Backcoin Oracle (Stylus) deve ser deployado ANTES via cargo-stylus.
// Atualize EXTERNAL_CONTRACTS.BACKCOIN_ORACLE com o endereço.
//
// GUIA DE DEPLOY DO ORACLE:
// 1. cd contracts/stylus/backcoin-oracle
// 2. sudo service docker start (WSL)
// 3. cargo stylus deploy --endpoint RPC_URL --private-key KEY
// 4. Copie o endereço para EXTERNAL_CONTRACTS.BACKCOIN_ORACLE
//
// ════════════════════════════════════════════════════════════════════════════

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ContractTransactionReceipt } from "ethers";
import fs from "fs";
import path from "path";

// ════════════════════════════════════════════════════════════════════════════
//                    🔴 CONTRATOS EXTERNOS - CONFIGURAR AQUI
// ════════════════════════════════════════════════════════════════════════════

const EXTERNAL_CONTRACTS = {
    // Backcoin Oracle (Stylus) - Deploy separado via cargo-stylus
    // Testnet (Arbitrum Sepolia):
    BACKCOIN_ORACLE: "0x16346f5a45f9615f1c894414989f0891c54ef07b",
    
    // Mainnet (Arbitrum One) - Atualizar após deploy:
    // BACKCOIN_ORACLE: "0x...",
};

// ════════════════════════════════════════════════════════════════════════════
//                    🔐 CARTEIRAS DO SISTEMA
// ════════════════════════════════════════════════════════════════════════════

const SYSTEM_WALLETS = {
    TREASURY: "0xc93030333E3a235c2605BcB7C7330650B600B6D0"
};

// ════════════════════════════════════════════════════════════════════════════
//                    🌐 MULTI-RPC CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

const RPC_ENDPOINTS = [
    { name: 'Arbitrum Official', url: 'https://sepolia-rollup.arbitrum.io/rpc', priority: 1 },
    { name: 'Alchemy', url: process.env.ALCHEMY_API_KEY ? `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : null, priority: 2 },
    { name: 'BlockPI', url: 'https://arbitrum-sepolia.blockpi.network/v1/rpc/public', priority: 3 },
    { name: 'PublicNode', url: 'https://arbitrum-sepolia-rpc.publicnode.com', priority: 4 }
].filter(rpc => rpc.url) as { name: string; url: string; priority: number }[];

let rpcFailCounts: Record<string, number> = {};
RPC_ENDPOINTS.forEach(rpc => { rpcFailCounts[rpc.name] = 0; });
const MAX_RPC_FAILURES = 3;

// ════════════════════════════════════════════════════════════════════════════
//                    ⚙️ CONFIGURAÇÃO GERAL
// ════════════════════════════════════════════════════════════════════════════

const DEPLOY_DELAY_MS = 5000;
const TX_DELAY_MS = 2000;
const RETRY_DELAY_MS = 5000;
const CHUNK_SIZE = 50;
const CHUNK_SIZE_BIGINT = BigInt(CHUNK_SIZE);

const IPFS_BASE_URI_BOOSTERS = "ipfs://bafybeibtfnc6zgeiayglticrk2bqqgleybpgageh723grbdtsdddoicwtu/";

// ════════════════════════════════════════════════════════════════════════════
//                    💰 TAXAS OFICIAIS
// ════════════════════════════════════════════════════════════════════════════

const SERVICE_FEES_BIPS = {
    DELEGATION_FEE_BIPS: 50n,            // 0.5% - Staking entry
    UNSTAKE_FEE_BIPS: 100n,              // 1% - Normal unstake
    FORCE_UNSTAKE_PENALTY_BIPS: 5000n,   // 50% - Early unstake penalty
    CLAIM_REWARD_FEE_BIPS: 100n,         // 1% - Reward claim
    NFT_POOL_BUY_TAX_BIPS: 500n,         // 5% - NFT purchase
    NFT_POOL_SELL_TAX_BIPS: 1000n,       // 10% - NFT sale
    FORTUNE_POOL_GAME_FEE: 1000n,        // 10% - Fortune game fee
    RENTAL_MARKET_TAX_BIPS: 1000n,       // 10% - NFT rental
};

const SERVICE_FEES_FIXED = {
    NOTARY_SERVICE: "1" // 1 BKC
};

// Fortune Pool Service Fees (ETH)
const FORTUNE_SERVICE_FEE_1X = "0.000001";  // Mode 1x (Jackpot)
const FORTUNE_SERVICE_FEE_5X = "0.000005";  // Mode 5x (Cumulative)

// ════════════════════════════════════════════════════════════════════════════
//                    🎗️ CHARITY POOL CONFIG (V2.2)
// ════════════════════════════════════════════════════════════════════════════

const CHARITY_CONFIG = {
    // SERVICE_KEY deve ser "CHARITY_POOL_SERVICE" (não "CHARITY_DONATION_FEE")
    SERVICE_KEY: "CHARITY_POOL_SERVICE",
    
    // Taxas de doação
    DONATION_MINING_FEE_BIPS: 400n,      // 4% - Taxa de mineração
    DONATION_BURN_FEE_BIPS: 100n,        // 1% - Taxa de queima
    
    // Taxa de saque
    WITHDRAWAL_FEE_ETH: "0.001",          // 0.001 ETH
    
    // Penalidade se meta não atingida
    GOAL_NOT_MET_BURN_BIPS: 1000n,       // 10% queimado se meta não atingida
    
    // Limites
    MIN_DONATION_AMOUNT: "1",             // 1 BKC mínimo por doação
    MAX_ACTIVE_CAMPAIGNS_PER_WALLET: 20n, // Máximo de campanhas ativas por carteira
};

// ════════════════════════════════════════════════════════════════════════════
//                    📊 DISTRIBUIÇÃO DE REWARDS
// ════════════════════════════════════════════════════════════════════════════

const DISTRIBUTION = {
    mining: { TREASURY: 3000n, DELEGATOR_POOL: 7000n },  // 30/70
    fee: { TREASURY: 3000n, DELEGATOR_POOL: 7000n }      // 30/70
};

// ════════════════════════════════════════════════════════════════════════════
//                    ⭐ BOOSTER DISCOUNTS
// ════════════════════════════════════════════════════════════════════════════

const BOOSTER_DISCOUNTS = [
    { boostBips: 7000n, discountBips: 7000n, name: "Diamond" },
    { boostBips: 6000n, discountBips: 6000n, name: "Platinum" },
    { boostBips: 5000n, discountBips: 5000n, name: "Gold" },
    { boostBips: 4000n, discountBips: 4000n, name: "Silver" },
    { boostBips: 3000n, discountBips: 3000n, name: "Bronze" },
    { boostBips: 2000n, discountBips: 2000n, name: "Iron" },
    { boostBips: 1000n, discountBips: 1000n, name: "Crystal" },
];

// ════════════════════════════════════════════════════════════════════════════
//                    🎰 FORTUNE POOL CONFIG
// ════════════════════════════════════════════════════════════════════════════

const FORTUNE_TIERS = [
    { tierId: 1, name: "Easy",   range: 3,   multiplierBips: 20000,  chance: "33%" },  // 2x
    { tierId: 2, name: "Medium", range: 10,  multiplierBips: 50000,  chance: "10%" },  // 5x
    { tierId: 3, name: "Hard",   range: 100, multiplierBips: 500000, chance: "1%" }    // 50x
];

// ════════════════════════════════════════════════════════════════════════════
//                    🎨 NFT TIERS CONFIG
// ════════════════════════════════════════════════════════════════════════════

const NFT_TIERS = [
    { tierId: 1, name: "Diamond",  boostBips: 7000n, metadata: "diamond_booster.json",  mintCount: 100n },
    { tierId: 2, name: "Platinum", boostBips: 6000n, metadata: "platinum_booster.json", mintCount: 200n },
    { tierId: 3, name: "Gold",     boostBips: 5000n, metadata: "gold_booster.json",     mintCount: 300n },
    { tierId: 4, name: "Silver",   boostBips: 4000n, metadata: "silver_booster.json",   mintCount: 400n },
    { tierId: 5, name: "Bronze",   boostBips: 3000n, metadata: "bronze_booster.json",   mintCount: 500n },
    { tierId: 6, name: "Iron",     boostBips: 2000n, metadata: "iron_booster.json",     mintCount: 600n },
    { tierId: 7, name: "Crystal",  boostBips: 1000n, metadata: "crystal_booster.json",  mintCount: 1000n },
];

// ════════════════════════════════════════════════════════════════════════════
//                    💧 LIQUIDEZ INICIAL
// ════════════════════════════════════════════════════════════════════════════

const LIQUIDITY_CONFIG = {
    TGE_SUPPLY: 40_000_000n * 10n**18n,        // 40M BKC
    FORTUNE_POOL: 1_000_000n * 10n**18n,       // 1M BKC
    FAUCET: 4_000_000n * 10n**18n,             // 4M BKC
    NFT_POOL_EACH: 500_000n * 10n**18n,        // 500K BKC per pool
    GENESIS_STAKE_AMOUNT: 1_000n * 10n**18n,   // 1K BKC
    GENESIS_STAKE_DAYS: 365
};

// ════════════════════════════════════════════════════════════════════════════
//                    🚰 FAUCET CONFIG
// ════════════════════════════════════════════════════════════════════════════

const FAUCET_CONFIG = {
    TOKENS_PER_REQUEST: 20n * 10n**18n,      // 20 BKC
    ETH_PER_REQUEST: 1n * 10n**15n            // 0.001 ETH
};

// ════════════════════════════════════════════════════════════════════════════
//                    📁 PATHS
// ════════════════════════════════════════════════════════════════════════════

const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
const rulesFilePath = path.join(__dirname, "../rules-config.json");

// ════════════════════════════════════════════════════════════════════════════
//                    🛠️ FUNÇÕES AUXILIARES
// ════════════════════════════════════════════════════════════════════════════

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getNextRpc(): { name: string; url: string } {
    const available = RPC_ENDPOINTS.filter(rpc => rpcFailCounts[rpc.name] < MAX_RPC_FAILURES);
    if (available.length === 0) {
        RPC_ENDPOINTS.forEach(rpc => { rpcFailCounts[rpc.name] = 0; });
        return RPC_ENDPOINTS[0];
    }
    return available[0];
}

function markRpcFailed(rpcName: string) {
    rpcFailCounts[rpcName] = (rpcFailCounts[rpcName] || 0) + 1;
}

function updateAddressJSON(key: string, value: string) {
    let addresses: any = {};
    if (fs.existsSync(addressesFilePath)) {
        addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
    }
    addresses[key] = value;
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
}

function updateRulesJSON(section: string, key: string, value: string) {
    let rules: any = {};
    if (fs.existsSync(rulesFilePath)) {
        rules = JSON.parse(fs.readFileSync(rulesFilePath, "utf8"));
    }
    if (!rules[section]) rules[section] = {};
    rules[section][key] = value;
    rules["LAST_UPDATED"] = new Date().toISOString();
    fs.writeFileSync(rulesFilePath, JSON.stringify(rules, null, 2));
}

function clearConfigFiles() {
    console.log("🧹 Limpando arquivos de configuração...");
    fs.writeFileSync(addressesFilePath, JSON.stringify({}, null, 2));
    
    const defaultRules = {
        VERSION: "2.2.0",
        DESCRIPTION: "Backchain Ecosystem - Deploy Unificado V2.2",
        NETWORK: "arbitrum-sepolia",
        CREATED_AT: new Date().toISOString(),
        externalContracts: { BACKCOIN_ORACLE: EXTERNAL_CONTRACTS.BACKCOIN_ORACLE },
        wallets: { TREASURY: SYSTEM_WALLETS.TREASURY }
    };
    fs.writeFileSync(rulesFilePath, JSON.stringify(defaultRules, null, 2));
    console.log("   ✅ Arquivos limpos\n");
}

// ════════════════════════════════════════════════════════════════════════════
//                    🔄 ROBUST TRANSACTION SENDER
// ════════════════════════════════════════════════════════════════════════════

async function sendTxWithRetry(
    txFunction: () => Promise<any>,
    description: string,
    maxRetries = 8
): Promise<ContractTransactionReceipt | null> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`   ⏳ ${description}...`);
            const tx = await txFunction();
            const receipt = await tx.wait();
            if (!receipt) throw new Error("Recibo nulo");
            console.log(`   ✅ ${description}`);
            await sleep(TX_DELAY_MS);
            return receipt as ContractTransactionReceipt;
        } catch (error: any) {
            lastError = error;
            const msg = error.message || JSON.stringify(error);
            
            if (msg.includes("already") || msg.includes("Already")) {
                console.log(`   ⏩ Já realizado: ${description}`);
                return null;
            }
            
            const isConnectionError = 
                msg.includes("ECONNRESET") || msg.includes("TIMEOUT") ||
                msg.includes("timeout") || msg.includes("ETIMEDOUT") ||
                msg.includes("socket hang up") || msg.includes("429") ||
                msg.includes("rate limit") || msg.includes("HeadersTimeout");
            
            if (isConnectionError) {
                const currentRpc = getNextRpc();
                markRpcFailed(currentRpc.name);
                const waitTime = RETRY_DELAY_MS * (attempt + 1);
                console.log(`   ⚠️ Conexão falhou. Tentativa ${attempt + 1}/${maxRetries}. Aguardando ${waitTime/1000}s...`);
                await sleep(waitTime);
                continue;
            }
            
            if (msg.includes("nonce") || msg.includes("replacement")) {
                const waitTime = 3000 * (attempt + 1);
                console.log(`   ⚠️ Erro de nonce. Tentativa ${attempt + 1}/${maxRetries}...`);
                await sleep(waitTime);
                continue;
            }
            
            throw error;
        }
    }
    throw lastError || new Error(`Falha após ${maxRetries} tentativas: ${description}`);
}

// ════════════════════════════════════════════════════════════════════════════
//                    🔨 DEPLOY PROXY HELPER
// ════════════════════════════════════════════════════════════════════════════

async function deployProxyWithRetry(
    upgrades: any, 
    Factory: any, 
    args: any[], 
    name: string
): Promise<{ contract: any; address: string }> {
    console.log(`   🔨 Implantando ${name}...`);
    try {
        const contract = await upgrades.deployProxy(Factory, args, { 
            initializer: "initialize", 
            kind: "uups" 
        });
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        console.log(`   ✅ ${name}: ${address}`);
        await sleep(DEPLOY_DELAY_MS);
        return { contract, address };
    } catch (error: any) {
        console.error(`   ❌ Falha ao implantar ${name}: ${error.message}`);
        throw error;
    }
}

// ════════════════════════════════════════════════════════════════════════════
//                    🔍 FIND ORPHAN NFTs
// ════════════════════════════════════════════════════════════════════════════

async function findOrphanNFTs(nft: any, deployer: string, targetBoost: bigint): Promise<string[]> {
    console.log(`      🔍 Buscando NFTs órfãos (boost=${targetBoost})...`);
    
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const filter = nft.filters.Transfer(null, deployer, null);
            const events = await nft.queryFilter(filter, -5000);
            
            const ownedIds: string[] = [];
            for (const event of events) {
                if ('args' in event) {
                    const tokenId = (event as any).args[2];
                    try {
                        const owner = await nft.ownerOf(tokenId);
                        if (owner.toLowerCase() === deployer.toLowerCase()) {
                            const boost = await nft.boostBips(tokenId);
                            if (boost === targetBoost) {
                                ownedIds.push(tokenId.toString());
                            }
                        }
                    } catch (e) { /* Token may have been transferred */ }
                }
            }
            
            const unique = [...new Set(ownedIds)];
            if (unique.length > 0) {
                console.log(`      ⚠️ ${unique.length} NFTs órfãos encontrados`);
            }
            return unique;
        } catch (e: any) {
            if (attempt < 2) {
                console.log(`      ⚠️ Falha ao buscar eventos, tentando novamente...`);
                await sleep(3000);
            }
        }
    }
    return [];
}

// ════════════════════════════════════════════════════════════════════════════
//                    📝 HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

async function setFeeBipsIfNeeded(hub: any, ethers: any, key: string, value: bigint) {
    const hash = ethers.id(key);
    const current = await hub.getFee(hash);
    if (current === value) {
        console.log(`      ⏩ ${key} já configurado`);
        return;
    }
    await sendTxWithRetry(
        async () => await hub.setServiceFee(hash, value),
        `${key} → ${value} bips (${Number(value)/100}%)`
    );
    updateRulesJSON("serviceFeesBIPS", key, value.toString());
}

async function setDistributionIfNeeded(
    hub: any,
    ethers: any,
    funcName: "setMiningDistributionBips" | "setFeeDistributionBips",
    poolKey: string,
    value: bigint,
    section: string
) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(poolKey));
    const getFuncName = funcName === "setMiningDistributionBips" 
        ? "getMiningDistributionBips" : "getFeeDistributionBips";
    
    const current = await hub[getFuncName](hash);
    if (current === value) {
        console.log(`      ⏩ ${section}.${poolKey} já configurado`);
        return;
    }
    await sendTxWithRetry(
        async () => await hub[funcName](hash, value),
        `${section}.${poolKey} → ${value} bips`
    );
    updateRulesJSON(section, poolKey, value.toString());
}

async function setBoosterDiscountIfNeeded(hub: any, boostBips: bigint, discountBips: bigint, name: string) {
    const current = await hub.getBoosterDiscount(boostBips);
    if (current === discountBips) {
        console.log(`      ⏩ ${name} (${boostBips}) já configurado`);
        return;
    }
    await sendTxWithRetry(
        async () => await hub.setBoosterDiscount(boostBips, discountBips),
        `${name}: ${Number(discountBips)/100}% desconto`
    );
    updateRulesJSON("boosterDiscounts", boostBips.toString(), discountBips.toString());
}

// ════════════════════════════════════════════════════════════════════════════
//                    🎗️ CHARITY POOL CONFIGURATION (V2.2)
// ════════════════════════════════════════════════════════════════════════════

async function configureCharityPool(
    charity: any,
    miningManager: any,
    charityAddr: string,
    ethers: any
) {
    console.log("\n🎗️ FASE 7B: Configurando CharityPool");
    console.log("────────────────────────────────────────────────────────────────");

    // 1. Autorizar CharityPool no MiningManager com a KEY CORRETA
    // IMPORTANTE: O contrato usa SERVICE_KEY = keccak256("CHARITY_POOL_SERVICE")
    const serviceKeyHash = ethers.keccak256(ethers.toUtf8Bytes(CHARITY_CONFIG.SERVICE_KEY));
    console.log(`\n   🔑 SERVICE_KEY: ${CHARITY_CONFIG.SERVICE_KEY}`);
    console.log(`      Hash: ${serviceKeyHash}`);

    const currentMiner = await miningManager.authorizedMiners(serviceKeyHash);
    if (currentMiner.toLowerCase() !== charityAddr.toLowerCase()) {
        await sendTxWithRetry(
            async () => await miningManager.setAuthorizedMiner(serviceKeyHash, charityAddr),
            `Autorizar CharityPool (${CHARITY_CONFIG.SERVICE_KEY})`
        );
    } else {
        console.log(`   ⏩ CharityPool já autorizado no MiningManager`);
    }

    // 2. Configurar taxas do CharityPool
    console.log("\n   💰 Configurando taxas...");
    
    const withdrawalFeeWei = ethers.parseEther(CHARITY_CONFIG.WITHDRAWAL_FEE_ETH);
    
    try {
        // Verificar taxas atuais
        const currentMiningFee = await charity.donationMiningFeeBips();
        const currentBurnFee = await charity.donationBurnFeeBips();
        const currentWithdrawFee = await charity.withdrawalFeeETH();
        const currentPenalty = await charity.goalNotMetBurnBips();

        const needsUpdate = 
            currentMiningFee !== CHARITY_CONFIG.DONATION_MINING_FEE_BIPS ||
            currentBurnFee !== CHARITY_CONFIG.DONATION_BURN_FEE_BIPS ||
            currentWithdrawFee !== withdrawalFeeWei ||
            currentPenalty !== CHARITY_CONFIG.GOAL_NOT_MET_BURN_BIPS;

        if (needsUpdate) {
            await sendTxWithRetry(
                async () => await charity.setFees(
                    CHARITY_CONFIG.DONATION_MINING_FEE_BIPS,
                    CHARITY_CONFIG.DONATION_BURN_FEE_BIPS,
                    withdrawalFeeWei,
                    CHARITY_CONFIG.GOAL_NOT_MET_BURN_BIPS
                ),
                `CharityPool: setFees (mining=${Number(CHARITY_CONFIG.DONATION_MINING_FEE_BIPS)/100}%, burn=${Number(CHARITY_CONFIG.DONATION_BURN_FEE_BIPS)/100}%, withdrawETH=${CHARITY_CONFIG.WITHDRAWAL_FEE_ETH}, penalty=${Number(CHARITY_CONFIG.GOAL_NOT_MET_BURN_BIPS)/100}%)`
            );
        } else {
            console.log(`   ⏩ Taxas já configuradas corretamente`);
        }
    } catch (e: any) {
        console.log(`   ⚠️ Erro ao verificar taxas, configurando: ${e.message?.slice(0, 50)}`);
        await sendTxWithRetry(
            async () => await charity.setFees(
                CHARITY_CONFIG.DONATION_MINING_FEE_BIPS,
                CHARITY_CONFIG.DONATION_BURN_FEE_BIPS,
                withdrawalFeeWei,
                CHARITY_CONFIG.GOAL_NOT_MET_BURN_BIPS
            ),
            `CharityPool: setFees`
        );
    }

    // 3. Configurar limites
    console.log("\n   📊 Configurando limites...");
    
    const minDonationWei = ethers.parseEther(CHARITY_CONFIG.MIN_DONATION_AMOUNT);
    
    try {
        const currentMinDonation = await charity.minDonationAmount();
        const currentMaxCampaigns = await charity.maxActiveCampaignsPerWallet();

        const needsLimitUpdate = 
            currentMinDonation !== minDonationWei ||
            currentMaxCampaigns !== CHARITY_CONFIG.MAX_ACTIVE_CAMPAIGNS_PER_WALLET;

        if (needsLimitUpdate) {
            await sendTxWithRetry(
                async () => await charity.setLimits(
                    minDonationWei,
                    CHARITY_CONFIG.MAX_ACTIVE_CAMPAIGNS_PER_WALLET
                ),
                `CharityPool: setLimits (minDonation=${CHARITY_CONFIG.MIN_DONATION_AMOUNT} BKC, maxCampaigns=${CHARITY_CONFIG.MAX_ACTIVE_CAMPAIGNS_PER_WALLET})`
            );
        } else {
            console.log(`   ⏩ Limites já configurados corretamente`);
        }
    } catch (e: any) {
        console.log(`   ⚠️ Erro ao verificar limites, configurando: ${e.message?.slice(0, 50)}`);
        await sendTxWithRetry(
            async () => await charity.setLimits(
                minDonationWei,
                CHARITY_CONFIG.MAX_ACTIVE_CAMPAIGNS_PER_WALLET
            ),
            `CharityPool: setLimits`
        );
    }

    // 4. Salvar configuração no rules.json
    updateRulesJSON("charityPool", "DONATION_MINING_FEE_BIPS", CHARITY_CONFIG.DONATION_MINING_FEE_BIPS.toString());
    updateRulesJSON("charityPool", "DONATION_BURN_FEE_BIPS", CHARITY_CONFIG.DONATION_BURN_FEE_BIPS.toString());
    updateRulesJSON("charityPool", "WITHDRAWAL_FEE_ETH", CHARITY_CONFIG.WITHDRAWAL_FEE_ETH);
    updateRulesJSON("charityPool", "GOAL_NOT_MET_BURN_BIPS", CHARITY_CONFIG.GOAL_NOT_MET_BURN_BIPS.toString());
    updateRulesJSON("charityPool", "MIN_DONATION_AMOUNT", CHARITY_CONFIG.MIN_DONATION_AMOUNT);
    updateRulesJSON("charityPool", "MAX_ACTIVE_CAMPAIGNS_PER_WALLET", CHARITY_CONFIG.MAX_ACTIVE_CAMPAIGNS_PER_WALLET.toString());
    updateRulesJSON("charityPool", "SERVICE_KEY", CHARITY_CONFIG.SERVICE_KEY);

    console.log("\n   ✅ CharityPool configurado com sucesso!");
    console.log("   ────────────────────────────────────────────────────────────────");
    console.log(`      Mining Fee:           ${Number(CHARITY_CONFIG.DONATION_MINING_FEE_BIPS)/100}%`);
    console.log(`      Burn Fee:             ${Number(CHARITY_CONFIG.DONATION_BURN_FEE_BIPS)/100}%`);
    console.log(`      Withdrawal Fee:       ${CHARITY_CONFIG.WITHDRAWAL_FEE_ETH} ETH`);
    console.log(`      Goal Not Met Penalty: ${Number(CHARITY_CONFIG.GOAL_NOT_MET_BURN_BIPS)/100}%`);
    console.log(`      Min Donation:         ${CHARITY_CONFIG.MIN_DONATION_AMOUNT} BKC`);
    console.log(`      Max Active Campaigns: ${CHARITY_CONFIG.MAX_ACTIVE_CAMPAIGNS_PER_WALLET}`);
    console.log(`      SERVICE_KEY:          ${CHARITY_CONFIG.SERVICE_KEY}`);
}

// ════════════════════════════════════════════════════════════════════════════
//                    🚀 SCRIPT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export async function runScript(hre: HardhatRuntimeEnvironment) {
    const { ethers, upgrades } = hre;
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    console.log("════════════════════════════════════════════════════════════════");
    console.log("   🚀 BACKCHAIN ECOSYSTEM - DEPLOY COMPLETO V2.2");
    console.log("════════════════════════════════════════════════════════════════");
    console.log(`   📡 Rede: ${networkName}`);
    console.log(`   👷 Deployer: ${deployer.address}`);
    console.log(`   💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
    console.log(`   🏦 Treasury: ${SYSTEM_WALLETS.TREASURY}`);
    console.log("────────────────────────────────────────────────────────────────\n");

    // ══════════════════════════════════════════════════════════════════════
    // VALIDAÇÃO DO ORACLE
    // ══════════════════════════════════════════════════════════════════════

    const oracleAddr = EXTERNAL_CONTRACTS.BACKCOIN_ORACLE;
    
    if (!oracleAddr || oracleAddr === "0x..." || !oracleAddr.startsWith("0x") || oracleAddr.length !== 42) {
        console.error("════════════════════════════════════════════════════════════════");
        console.error("   ❌ ERRO: BACKCOIN_ORACLE não configurado!");
        console.error("════════════════════════════════════════════════════════════════");
        console.error("\n   Deploy o Oracle via cargo-stylus e atualize o endereço.\n");
        process.exit(1);
    }

    console.log("🦀 BACKCOIN ORACLE (Stylus):");
    console.log(`   Address: ${oracleAddr}`);
    console.log("────────────────────────────────────────────────────────────────\n");

    try {
        // Carregar endereços existentes ou iniciar do zero
        let addresses: Record<string, string> = {};
        if (fs.existsSync(addressesFilePath)) {
            addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
            console.log("📂 Endereços existentes carregados.\n");
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 1: CORE CONTRACTS
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("🏗️ FASE 1: Core Contracts");
        console.log("────────────────────────────────────────────────────────────────");

        // EcosystemManager (Hub)
        const EcosystemManager = await ethers.getContractFactory("EcosystemManager");
        const { contract: hub, address: hubAddr } = await deployProxyWithRetry(
            upgrades, EcosystemManager, [deployer.address, SYSTEM_WALLETS.TREASURY], "EcosystemManager"
        );
        addresses.ecosystemManager = hubAddr;
        updateAddressJSON("ecosystemManager", hubAddr);
        updateAddressJSON("backcoinOracle", oracleAddr);

        // BKCToken
        const BKCToken = await ethers.getContractFactory("BKCToken");
        const { contract: bkc, address: bkcAddr } = await deployProxyWithRetry(
            upgrades, BKCToken, [deployer.address, hubAddr], "BKCToken"
        );
        addresses.bkcToken = bkcAddr;
        updateAddressJSON("bkcToken", bkcAddr);

        // MiningManager
        const MiningManager = await ethers.getContractFactory("MiningManager");
        const { contract: miningManager, address: mmAddr } = await deployProxyWithRetry(
            upgrades, MiningManager, [deployer.address, hubAddr], "MiningManager"
        );
        addresses.miningManager = mmAddr;
        updateAddressJSON("miningManager", mmAddr);

        // DelegationManager
        const DelegationManager = await ethers.getContractFactory("DelegationManager");
        const { contract: delegationManager, address: dmAddr } = await deployProxyWithRetry(
            upgrades, DelegationManager, [deployer.address, hubAddr], "DelegationManager"
        );
        addresses.delegationManager = dmAddr;
        updateAddressJSON("delegationManager", dmAddr);

        // RewardBoosterNFT
        const RewardBoosterNFT = await ethers.getContractFactory("RewardBoosterNFT");
        const { contract: nft, address: nftAddr } = await deployProxyWithRetry(
            upgrades, RewardBoosterNFT, [deployer.address, hubAddr], "RewardBoosterNFT"
        );
        addresses.rewardBoosterNFT = nftAddr;
        updateAddressJSON("rewardBoosterNFT", nftAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 2: SERVICE CONTRACTS
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n🔧 FASE 2: Service Contracts");
        console.log("────────────────────────────────────────────────────────────────");

        // DecentralizedNotary
        const Notary = await ethers.getContractFactory("DecentralizedNotary");
        const { address: notaryAddr } = await deployProxyWithRetry(
            upgrades, Notary, [deployer.address, hubAddr], "DecentralizedNotary"
        );
        addresses.decentralizedNotary = notaryAddr;
        updateAddressJSON("decentralizedNotary", notaryAddr);

        // FortunePool
        const FortunePool = await ethers.getContractFactory("FortunePool");
        const { contract: fortune, address: fortuneAddr } = await deployProxyWithRetry(
            upgrades, FortunePool, [deployer.address, hubAddr, oracleAddr], "FortunePool"
        );
        addresses.fortunePool = fortuneAddr;
        updateAddressJSON("fortunePool", fortuneAddr);

        // RentalManager
        const RentalManager = await ethers.getContractFactory("RentalManager");
        const { address: rentalAddr } = await deployProxyWithRetry(
            upgrades, RentalManager, [hubAddr, nftAddr], "RentalManager"
        );
        addresses.rentalManager = rentalAddr;
        updateAddressJSON("rentalManager", rentalAddr);

        // CharityPool
        const CharityPool = await ethers.getContractFactory("CharityPool");
        const { contract: charity, address: charityAddr } = await deployProxyWithRetry(
            upgrades, CharityPool, [deployer.address, hubAddr], "CharityPool"
        );
        addresses.charityPool = charityAddr;
        updateAddressJSON("charityPool", charityAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 3: NFT LIQUIDITY SYSTEM
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n🏊 FASE 3: NFT Liquidity System");
        console.log("────────────────────────────────────────────────────────────────");

        // NFTLiquidityPool Implementation (template)
        const NFTLiquidityPool = await ethers.getContractFactory("NFTLiquidityPool");
        const poolImpl = await NFTLiquidityPool.deploy();
        await poolImpl.waitForDeployment();
        const poolImplAddr = await poolImpl.getAddress();
        addresses.nftLiquidityPool_Implementation = poolImplAddr;
        updateAddressJSON("nftLiquidityPool_Implementation", poolImplAddr);
        console.log(`   ✅ NFTLiquidityPool (Template): ${poolImplAddr}`);

        // NFTLiquidityPoolFactory
        const Factory = await ethers.getContractFactory("NFTLiquidityPoolFactory");
        const { contract: factory, address: factoryAddr } = await deployProxyWithRetry(
            upgrades, Factory, [deployer.address, hubAddr, poolImplAddr], "NFTLiquidityPoolFactory"
        );
        addresses.nftLiquidityPoolFactory = factoryAddr;
        updateAddressJSON("nftLiquidityPoolFactory", factoryAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 4: UTILITIES
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n🛠️ FASE 4: Utilities");
        console.log("────────────────────────────────────────────────────────────────");

        // SimpleBKCFaucet
        const SimpleBKCFaucet = await ethers.getContractFactory("SimpleBKCFaucet");
        const { address: faucetAddr } = await deployProxyWithRetry(
            upgrades, SimpleBKCFaucet, [
                bkcAddr,
                deployer.address,
                FAUCET_CONFIG.TOKENS_PER_REQUEST,
                FAUCET_CONFIG.ETH_PER_REQUEST
            ], "SimpleBKCFaucet"
        );
        addresses.faucet = faucetAddr;
        updateAddressJSON("faucet", faucetAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 5: WIRING - CONECTAR O SISTEMA
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n🔌 FASE 5: Conectando o Sistema");
        console.log("────────────────────────────────────────────────────────────────");

        // Configurar Hub com todos os endereços
        console.log("   → Configurando EcosystemManager...");
        await sendTxWithRetry(
            async () => await hub.setAddresses(
                bkcAddr,
                SYSTEM_WALLETS.TREASURY,
                dmAddr,
                nftAddr,
                mmAddr,
                notaryAddr,
                fortuneAddr,
                factoryAddr
            ),
            "Hub: setAddresses"
        );

        // Configurar RentalManager no Hub
        await sendTxWithRetry(
            async () => await hub.setAddress("rentalManager", rentalAddr),
            "Hub: setAddress(rentalManager)"
        );

        // Registrar CharityPool via Module Registry
        const CHARITY_POOL_KEY = ethers.keccak256(ethers.toUtf8Bytes("CHARITY_POOL"));
        await sendTxWithRetry(
            async () => await hub.setModule(CHARITY_POOL_KEY, charityAddr),
            "Hub: setModule(CHARITY_POOL)"
        );

        // Configurar RewardBoosterNFT
        console.log("\n   → Configurando RewardBoosterNFT...");
        await sendTxWithRetry(
            async () => await nft.setPoolFactory(factoryAddr),
            "NFT: setPoolFactory"
        );
        await sendTxWithRetry(
            async () => await nft.setBaseURI(IPFS_BASE_URI_BOOSTERS),
            "NFT: setBaseURI"
        );

        // Autorizar Miners no MiningManager
        // ⚠️ V2.2: CHARITY_POOL_SERVICE é a KEY CORRETA (não CHARITY_DONATION_FEE)
        console.log("\n   → Autorizando Miners...");
        const miners = [
            { key: "FORTUNE_POOL_SERVICE", addr: fortuneAddr },
            { key: "NOTARY_SERVICE", addr: notaryAddr },
            { key: "RENTAL_MARKET_TAX_BIPS", addr: rentalAddr },
            { key: "DELEGATION_FEE_BIPS", addr: dmAddr },
            { key: "UNSTAKE_FEE_BIPS", addr: dmAddr },
            { key: "FORCE_UNSTAKE_PENALTY_BIPS", addr: dmAddr },
            { key: "CLAIM_REWARD_FEE_BIPS", addr: dmAddr },
            { key: "NFT_POOL_BUY_TAX_BIPS", addr: factoryAddr },
            { key: "NFT_POOL_SELL_TAX_BIPS", addr: factoryAddr },
            // ✅ V2.2: KEY CORRETA para CharityPool
            { key: CHARITY_CONFIG.SERVICE_KEY, addr: charityAddr },
        ];
        
        for (const m of miners) {
            const hash = ethers.keccak256(ethers.toUtf8Bytes(m.key));
            await sendTxWithRetry(
                async () => await miningManager.setAuthorizedMiner(hash, m.addr),
                `Autorizar: ${m.key}`
            );
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 6: CONFIGURAR TAXAS E DISTRIBUIÇÃO
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n⚖️ FASE 6: Taxas e Distribuição");
        console.log("────────────────────────────────────────────────────────────────");

        // Taxas em BIPS
        console.log("\n   📊 Taxas em BIPS:");
        for (const [key, value] of Object.entries(SERVICE_FEES_BIPS)) {
            await setFeeBipsIfNeeded(hub, ethers, key, value);
        }

        // Taxas fixas (BKC)
        console.log("\n   💰 Taxas em BKC:");
        const notaryHash = ethers.id("NOTARY_SERVICE");
        const notaryFee = ethers.parseEther(SERVICE_FEES_FIXED.NOTARY_SERVICE);
        await sendTxWithRetry(
            async () => await hub.setServiceFee(notaryHash, notaryFee),
            `NOTARY_SERVICE → ${SERVICE_FEES_FIXED.NOTARY_SERVICE} BKC`
        );

        // Distribuição Mining
        console.log("\n   ⛏️ Distribuição Mining:");
        await setDistributionIfNeeded(hub, ethers, "setMiningDistributionBips", "TREASURY", DISTRIBUTION.mining.TREASURY, "miningDistribution");
        await setDistributionIfNeeded(hub, ethers, "setMiningDistributionBips", "DELEGATOR_POOL", DISTRIBUTION.mining.DELEGATOR_POOL, "miningDistribution");

        // Distribuição Fees
        console.log("\n   💵 Distribuição Fees:");
        await setDistributionIfNeeded(hub, ethers, "setFeeDistributionBips", "TREASURY", DISTRIBUTION.fee.TREASURY, "feeDistribution");
        await setDistributionIfNeeded(hub, ethers, "setFeeDistributionBips", "DELEGATOR_POOL", DISTRIBUTION.fee.DELEGATOR_POOL, "feeDistribution");

        // Booster Discounts
        console.log("\n   ⭐ Booster Discounts:");
        for (const d of BOOSTER_DISCOUNTS) {
            await setBoosterDiscountIfNeeded(hub, d.boostBips, d.discountBips, d.name);
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 7: FORTUNE POOL CONFIG
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n🎰 FASE 7A: Fortune Pool");
        console.log("────────────────────────────────────────────────────────────────");

        // Service Fee
        const serviceFeeWei = ethers.parseEther(FORTUNE_SERVICE_FEE_1X);
        await sendTxWithRetry(
            async () => await fortune.setServiceFee(serviceFeeWei),
            `Service Fee: ${FORTUNE_SERVICE_FEE_1X} ETH (1x)`
        );
        console.log(`   ℹ️  Service Fee 5x = ${FORTUNE_SERVICE_FEE_5X} ETH`);

        // Game Fee
        await sendTxWithRetry(
            async () => await fortune.setGameFee(SERVICE_FEES_BIPS.FORTUNE_POOL_GAME_FEE),
            `Game Fee: ${Number(SERVICE_FEES_BIPS.FORTUNE_POOL_GAME_FEE)/100}%`
        );

        // Prize Tiers
        console.log("\n   🏆 Prize Tiers:");
        for (const tier of FORTUNE_TIERS) {
            await sendTxWithRetry(
                async () => await fortune.configureTier(tier.tierId, tier.range, tier.multiplierBips),
                `Tier ${tier.tierId} (${tier.name}): 1-${tier.range} → ${tier.multiplierBips/10000}x`
            );
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 7B: CHARITY POOL CONFIG (V2.2)
        // ══════════════════════════════════════════════════════════════════════
        
        await configureCharityPool(charity, miningManager, charityAddr, ethers);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 8: TGE (Token Generation Event)
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n💎 FASE 8: Token Generation Event");
        console.log("────────────────────────────────────────────────────────────────");

        const currentSupply = await bkc.totalSupply();
        if (currentSupply === 0n) {
            await sendTxWithRetry(
                async () => await bkc.mint(deployer.address, LIQUIDITY_CONFIG.TGE_SUPPLY),
                `TGE: Mint ${ethers.formatEther(LIQUIDITY_CONFIG.TGE_SUPPLY)} BKC`
            );
        } else {
            console.log(`   ⏩ TGE já realizado: ${ethers.formatEther(currentSupply)} BKC`);
        }

        // Transferir para FortunePool
        const fortuneBalance = await bkc.balanceOf(fortuneAddr);
        if (fortuneBalance < LIQUIDITY_CONFIG.FORTUNE_POOL) {
            await sendTxWithRetry(
                async () => await bkc.transfer(fortuneAddr, LIQUIDITY_CONFIG.FORTUNE_POOL),
                `Liquidez FortunePool: ${ethers.formatEther(LIQUIDITY_CONFIG.FORTUNE_POOL)} BKC`
            );
        } else {
            console.log(`   ⏩ FortunePool já tem liquidez: ${ethers.formatEther(fortuneBalance)} BKC`);
        }

        // Transferir para Faucet
        const faucetBalance = await bkc.balanceOf(faucetAddr);
        if (faucetBalance < LIQUIDITY_CONFIG.FAUCET) {
            await sendTxWithRetry(
                async () => await bkc.transfer(faucetAddr, LIQUIDITY_CONFIG.FAUCET),
                `Liquidez Faucet: ${ethers.formatEther(LIQUIDITY_CONFIG.FAUCET)} BKC`
            );
        } else {
            console.log(`   ⏩ Faucet já tem liquidez: ${ethers.formatEther(faucetBalance)} BKC`);
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 9: NFT POOLS E LIQUIDEZ
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n🎨 FASE 9: NFT Pools e Liquidez");
        console.log("────────────────────────────────────────────────────────────────");

        for (const tier of NFT_TIERS) {
            console.log(`\n   💎 ${tier.name} Pool (Boost: ${Number(tier.boostBips)/100}%)`);
            
            const poolKey = `pool_${tier.name.toLowerCase()}`;
            let poolAddress = addresses[poolKey];

            // Criar pool se não existe
            if (!poolAddress) {
                const poolExists = await factory.poolExists(tier.boostBips);
                if (!poolExists) {
                    await sendTxWithRetry(
                        async () => await factory.createPool(tier.boostBips),
                        `Criar Pool ${tier.name}`
                    );
                }
                poolAddress = await factory.getPoolAddress(tier.boostBips);
                await sleep(DEPLOY_DELAY_MS);
            }
            addresses[poolKey] = poolAddress;
            updateAddressJSON(poolKey, poolAddress);

            const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, deployer);
            
            // Verificar se pool já tem liquidez
            let poolNftCount = 0n;
            try {
                const poolInfo = await pool.getPoolInfo();
                poolNftCount = poolInfo[1];
            } catch (e) { /* Pool may not have liquidity yet */ }

            if (poolNftCount > 0n) {
                console.log(`      ⏩ Pool já tem ${poolNftCount} NFTs`);
                continue;
            }

            // Buscar NFTs órfãos
            const orphanIds = await findOrphanNFTs(nft, deployer.address, tier.boostBips);
            let idsToDeposit: string[] = [...orphanIds];
            const currentCount = BigInt(idsToDeposit.length);
            const needed = tier.mintCount > currentCount ? tier.mintCount - currentCount : 0n;

            // Mintar NFTs faltantes
            if (needed > 0n) {
                console.log(`      🔨 Mintando ${needed} NFTs...`);
                for (let j = 0n; j < needed; j += CHUNK_SIZE_BIGINT) {
                    const batch = needed - j < CHUNK_SIZE_BIGINT ? needed - j : CHUNK_SIZE_BIGINT;
                    await sendTxWithRetry(
                        async () => await nft.ownerMintBatch(deployer.address, Number(batch), tier.boostBips, tier.metadata),
                        `Mint ${batch} ${tier.name}`
                    );
                    await sleep(TX_DELAY_MS);
                }
                
                // Re-buscar IDs
                const updatedIds = await findOrphanNFTs(nft, deployer.address, tier.boostBips);
                idsToDeposit = updatedIds.slice(0, Number(tier.mintCount));
            }

            // Depositar liquidez
            if (idsToDeposit.length > 0) {
                console.log(`      📥 Depositando ${idsToDeposit.length} NFTs + ${ethers.formatEther(LIQUIDITY_CONFIG.NFT_POOL_EACH)} BKC...`);

                await sendTxWithRetry(
                    async () => await bkc.approve(poolAddress, LIQUIDITY_CONFIG.NFT_POOL_EACH),
                    "Aprovar BKC"
                );
                await sendTxWithRetry(
                    async () => await nft.setApprovalForAll(poolAddress, true),
                    "Aprovar NFTs"
                );

                // Depositar em chunks
                let isFirst = true;
                for (let k = 0; k < idsToDeposit.length; k += CHUNK_SIZE) {
                    const chunk = idsToDeposit.slice(k, k + CHUNK_SIZE);
                    if (isFirst) {
                        await sendTxWithRetry(
                            async () => await pool.addInitialLiquidity(chunk, LIQUIDITY_CONFIG.NFT_POOL_EACH),
                            "Liquidez Inicial"
                        );
                        isFirst = false;
                    } else {
                        await sendTxWithRetry(
                            async () => await pool.addMoreNFTsToPool(chunk),
                            `+${chunk.length} NFTs`
                        );
                    }
                    await sleep(TX_DELAY_MS);
                }

                await sendTxWithRetry(
                    async () => await nft.setApprovalForAll(poolAddress, false),
                    "Revogar aprovação NFTs"
                );
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 10: GENESIS STAKE
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n📈 FASE 10: Genesis Stake");
        console.log("────────────────────────────────────────────────────────────────");

        const totalPStake = await delegationManager.totalNetworkPStake();
        if (totalPStake === 0n) {
            await sendTxWithRetry(
                async () => await bkc.approve(dmAddr, LIQUIDITY_CONFIG.GENESIS_STAKE_AMOUNT),
                "Aprovar stake"
            );
            try {
                await sendTxWithRetry(
                    async () => await delegationManager.delegate(
                        LIQUIDITY_CONFIG.GENESIS_STAKE_AMOUNT,
                        BigInt(LIQUIDITY_CONFIG.GENESIS_STAKE_DAYS * 86400),
                        0
                    ),
                    `Genesis Stake: ${ethers.formatEther(LIQUIDITY_CONFIG.GENESIS_STAKE_AMOUNT)} BKC x ${LIQUIDITY_CONFIG.GENESIS_STAKE_DAYS} dias`
                );
            } catch (e: any) {
                console.log(`   ⚠️ Genesis Stake: ${e.message?.slice(0, 50)}`);
            }
        } else {
            console.log(`   ✅ Network já tem stake: ${ethers.formatEther(totalPStake)} pStake`);
        }

        // ══════════════════════════════════════════════════════════════════════
        // RESUMO FINAL
        // ══════════════════════════════════════════════════════════════════════

        console.log("\n════════════════════════════════════════════════════════════════");
        console.log("                    📊 DEPLOY CONCLUÍDO V2.2!");
        console.log("════════════════════════════════════════════════════════════════");

        console.log("\n📋 CONTRATOS IMPLANTADOS:");
        console.log("────────────────────────────────────────────────────────────────");
        for (const [key, addr] of Object.entries(addresses)) {
            if (addr && addr.startsWith("0x")) {
                console.log(`   ${key}: ${addr}`);
            }
        }

        console.log("\n🦀 BACKCOIN ORACLE (Stylus):");
        console.log(`   ${oracleAddr}`);

        console.log("\n💰 TAXAS:");
        console.log("────────────────────────────────────────────────────────────────");
        console.log("   Staking Entry:      0.5%");
        console.log("   Unstake:            1%");
        console.log("   Force Unstake:      50%");
        console.log("   Claim Reward:       1%");
        console.log("   NFT Buy:            5%");
        console.log("   NFT Sell:           10%");
        console.log("   Fortune Game:       10%");
        console.log("   Rental:             10%");
        console.log("   Notary:             1 BKC");
        console.log("\n   🎗️ CHARITY POOL:");
        console.log(`   Donation Mining:    ${Number(CHARITY_CONFIG.DONATION_MINING_FEE_BIPS)/100}%`);
        console.log(`   Donation Burn:      ${Number(CHARITY_CONFIG.DONATION_BURN_FEE_BIPS)/100}%`);
        console.log(`   Withdrawal:         ${CHARITY_CONFIG.WITHDRAWAL_FEE_ETH} ETH`);
        console.log(`   Goal Not Met:       ${Number(CHARITY_CONFIG.GOAL_NOT_MET_BURN_BIPS)/100}% burned`);

        console.log("\n📊 DISTRIBUIÇÃO:");
        console.log("────────────────────────────────────────────────────────────────");
        console.log("   Mining:  30% Treasury / 70% Stakers");
        console.log("   Fees:    30% Treasury / 70% Stakers");

        const finalBalance = await bkc.balanceOf(deployer.address);
        console.log("\n💧 LIQUIDEZ FINAL:");
        console.log("────────────────────────────────────────────────────────────────");
        console.log(`   Deployer: ${ethers.formatEther(finalBalance)} BKC`);
        console.log(`   Faucet:   ${ethers.formatEther(await bkc.balanceOf(faucetAddr))} BKC`);
        console.log(`   Fortune:  ${ethers.formatEther(await bkc.balanceOf(fortuneAddr))} BKC`);

        console.log("\n────────────────────────────────────────────────────────────────");
        console.log("   🎉 ECOSSISTEMA BACKCHAIN V2.2 IMPLANTADO COM SUCESSO!");
        console.log("────────────────────────────────────────────────────────────────\n");

    } catch (error: any) {
        console.error("\n❌ ERRO FATAL:", error.message);
        console.error(error);
        process.exit(1);
    }
}

// Entry point
if (require.main === module) {
    runScript(require("hardhat")).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}