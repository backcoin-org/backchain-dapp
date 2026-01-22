// scripts/deploy_ecosystem.ts
// ════════════════════════════════════════════════════════════════════════════
// 🚀 BACKCHAIN ECOSYSTEM - DEPLOY COMPLETO UNIFICADO V4.0 (MAINNET READY)
// ════════════════════════════════════════════════════════════════════════════
//
// CHANGELOG V4.0:
// - Backchat: Rede Social Descentralizada integrada
//   - Posts, Comentários, Threading
//   - Tips (Gorjetas) com split Criador/Mining
//   - Mensagens Privadas E2EE
//   - Community Notes
//   - Moderação por votação
// - Todas as correções de V3.0 incluídas
//
// CHANGELOG V3.0:
// - RentalManager V2: Sistema MetaAds de promoção de listings (ETH para Treasury)
//   - Mining Fee: 7% → MiningManager (PoP)
//   - Burn Fee: 3% → Queima 🔥
//   - Função promoteListing() para destacar NFTs
//   - Treasury recebe taxas de promoção em ETH
// - FortunePool: Interface Oracle corrigida (camelCase: getNumbers)
// - CharityPool: SERVICE_KEY corrigido para "CHARITY_POOL_SERVICE"
// - CharityPool: Configuração inicial de limites e taxas
//
// IMPORTANTE:
// - Para deploy novo, use o RentalManager.sol versão V2 (com initializeV2)
// - Para upgrade de contrato existente, use: upgrade_rental_manager_v2.ts
//
// PRÉ-REQUISITO:
// O Backcoin Oracle (Stylus) deve ser deployado ANTES via cargo-stylus.
// Atualize EXTERNAL_CONTRACTS.BACKCOIN_ORACLE com o endereço.
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
    // ═══════════════════════════════════════════════════════════════════════
    // TESTNET (Arbitrum Sepolia):
    BACKCOIN_ORACLE: "0x16346f5a45f9615f1c894414989f0891c54ef07b",
    
    // MAINNET (Arbitrum One) - Atualizar após deploy do Oracle:
    // BACKCOIN_ORACLE: "0x...",
    // ═══════════════════════════════════════════════════════════════════════
};

// ════════════════════════════════════════════════════════════════════════════
//                    🔐 CARTEIRAS DO SISTEMA
// ════════════════════════════════════════════════════════════════════════════

const SYSTEM_WALLETS = {
    // Treasury recebe:
    // - 30% das taxas de mineração
    // - 30% das taxas de serviços
    // - 100% das taxas de promoção MetaAds (ETH)
    // - 70% das taxas do Backchat
    TREASURY: "0xc93030333E3a235c2605BcB7C7330650B600B6D0"
};

// ════════════════════════════════════════════════════════════════════════════
//                    🌐 MULTI-RPC CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

// Testnet RPCs
const TESTNET_RPC_ENDPOINTS = [
    { name: 'Arbitrum Official', url: 'https://sepolia-rollup.arbitrum.io/rpc', priority: 1 },
    { name: 'Alchemy', url: process.env.ALCHEMY_API_KEY ? `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : null, priority: 2 },
    { name: 'BlockPI', url: 'https://arbitrum-sepolia.blockpi.network/v1/rpc/public', priority: 3 },
    { name: 'PublicNode', url: 'https://arbitrum-sepolia-rpc.publicnode.com', priority: 4 }
].filter(rpc => rpc.url) as { name: string; url: string; priority: number }[];

// Mainnet RPCs
const MAINNET_RPC_ENDPOINTS = [
    { name: 'Alchemy', url: process.env.ALCHEMY_API_KEY ? `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : null, priority: 1 },
    { name: 'Arbitrum Official', url: 'https://arb1.arbitrum.io/rpc', priority: 2 },
    { name: 'BlockPI', url: 'https://arbitrum.blockpi.network/v1/rpc/public', priority: 3 },
].filter(rpc => rpc.url) as { name: string; url: string; priority: number }[];

let RPC_ENDPOINTS = TESTNET_RPC_ENDPOINTS;
let rpcFailCounts: Record<string, number> = {};
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
//                    🎗️ CHARITY POOL CONFIG
// ════════════════════════════════════════════════════════════════════════════

const CHARITY_CONFIG = {
    SERVICE_KEY: "CHARITY_POOL_SERVICE",
    DONATION_MINING_FEE_BIPS: 400n,      // 4% - Taxa de mineração
    DONATION_BURN_FEE_BIPS: 100n,        // 1% - Taxa de queima
    WITHDRAWAL_FEE_ETH: "0.001",          // 0.001 ETH
    GOAL_NOT_MET_BURN_BIPS: 1000n,       // 10% queimado se meta não atingida
    MIN_DONATION_AMOUNT: "1",             // 1 BKC mínimo por doação
    MAX_ACTIVE_CAMPAIGNS_PER_WALLET: 20n, // Máximo de campanhas ativas por carteira
};

// ════════════════════════════════════════════════════════════════════════════
//                    💬 BACKCHAT CONFIG (NOVO V4.0)
// ════════════════════════════════════════════════════════════════════════════

const BACKCHAT_CONFIG = {
    // Service Key para autorização no MiningManager
    SERVICE_KEY: "BACKCHAT_SERVICE",
    
    // Taxa por ação (post, comentário, mensagem)
    PLATFORM_FEE: "1",                    // 1 BKC por ação
    
    // Distribuição da taxa de plataforma
    PLATFORM_MINING_FEE_BIPS: 3000n,     // 30% → Mining
    PLATFORM_TREASURY_FEE_BIPS: 7000n,   // 70% → Treasury
    
    // Taxa sobre gorjetas (tips)
    TIP_MINING_FEE_BIPS: 1000n,          // 10% → Mining (90% vai para criador)
    
    // Limites
    MIN_TIP_AMOUNT: "1",                  // 1 BKC mínimo
    MAX_CONTENT_LENGTH: 50000n,           // 50K caracteres
    
    // KYC (desabilitado por padrão)
    KYC_REQUIRED_FOR_POSTS: false,
    KYC_REQUIRED_FOR_MESSAGES: false,
    KYC_REQUIRED_FOR_WITHDRAWAL: false,
};

// ════════════════════════════════════════════════════════════════════════════
//                    🚀 RENTAL MANAGER V2 CONFIG (MetaAds)
// ════════════════════════════════════════════════════════════════════════════

const RENTAL_CONFIG = {
    ENABLE_METAADS: true,
    
    // V2: Taxas de rental com burn
    RENTAL_MINING_FEE_BIPS: 700n,    // 7% → MiningManager (PoP)
    RENTAL_BURN_FEE_BIPS: 300n,      // 3% → Queima 🔥
    // Total: 10% (igual ao anterior, mas agora com queima)
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
    { tierId: 1, name: "Easy",   range: 3,   multiplierBips: 20000,  chance: "33%" },
    { tierId: 2, name: "Medium", range: 10,  multiplierBips: 50000,  chance: "10%" },
    { tierId: 3, name: "Hard",   range: 100, multiplierBips: 500000, chance: "1%" }
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
    TGE_SUPPLY: 40_000_000n * 10n**18n,
    FORTUNE_POOL: 1_000_000n * 10n**18n,
    FAUCET: 4_000_000n * 10n**18n,
    NFT_POOL_EACH: 500_000n * 10n**18n,
    GENESIS_STAKE_AMOUNT: 1_000n * 10n**18n,
    GENESIS_STAKE_DAYS: 365
};

// ════════════════════════════════════════════════════════════════════════════
//                    🚰 FAUCET CONFIG (TESTNET ONLY)
// ════════════════════════════════════════════════════════════════════════════

const FAUCET_CONFIG = {
    TOKENS_PER_REQUEST: 20n * 10n**18n,
    ETH_PER_REQUEST: 1n * 10n**15n
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

function clearConfigFiles(networkName: string) {
    console.log("🧹 Limpando arquivos de configuração...");
    fs.writeFileSync(addressesFilePath, JSON.stringify({}, null, 2));
    
    const defaultRules = {
        VERSION: "4.0.0",
        DESCRIPTION: "Backchain Ecosystem - Deploy Unificado V4.0 (Backchat)",
        NETWORK: networkName,
        CREATED_AT: new Date().toISOString(),
        externalContracts: { BACKCOIN_ORACLE: EXTERNAL_CONTRACTS.BACKCOIN_ORACLE },
        wallets: { TREASURY: SYSTEM_WALLETS.TREASURY },
        features: {
            METAADS_ENABLED: RENTAL_CONFIG.ENABLE_METAADS,
            BACKCHAT_ENABLED: true
        }
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
//                    🎗️ CHARITY POOL CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

async function configureCharityPool(
    charity: any,
    miningManager: any,
    charityAddr: string,
    ethers: any
) {
    console.log("\n🎗️ Configurando CharityPool");
    console.log("────────────────────────────────────────────────────────────────");

    // 1. Autorizar CharityPool no MiningManager
    const serviceKeyHash = ethers.keccak256(ethers.toUtf8Bytes(CHARITY_CONFIG.SERVICE_KEY));
    console.log(`\n   🔑 SERVICE_KEY: ${CHARITY_CONFIG.SERVICE_KEY}`);

    const currentMiner = await miningManager.authorizedMiners(serviceKeyHash);
    if (currentMiner.toLowerCase() !== charityAddr.toLowerCase()) {
        await sendTxWithRetry(
            async () => await miningManager.setAuthorizedMiner(serviceKeyHash, charityAddr),
            `Autorizar CharityPool (${CHARITY_CONFIG.SERVICE_KEY})`
        );
    } else {
        console.log(`   ⏩ CharityPool já autorizado no MiningManager`);
    }

    // 2. Configurar taxas
    console.log("\n   💰 Configurando taxas...");
    const withdrawalFeeWei = ethers.parseEther(CHARITY_CONFIG.WITHDRAWAL_FEE_ETH);
    
    try {
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
                `CharityPool: setFees`
            );
        } else {
            console.log(`   ⏩ Taxas já configuradas`);
        }
    } catch (e: any) {
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
                `CharityPool: setLimits`
            );
        } else {
            console.log(`   ⏩ Limites já configurados`);
        }
    } catch (e: any) {
        await sendTxWithRetry(
            async () => await charity.setLimits(
                minDonationWei,
                CHARITY_CONFIG.MAX_ACTIVE_CAMPAIGNS_PER_WALLET
            ),
            `CharityPool: setLimits`
        );
    }

    // Salvar configuração
    updateRulesJSON("charityPool", "DONATION_MINING_FEE_BIPS", CHARITY_CONFIG.DONATION_MINING_FEE_BIPS.toString());
    updateRulesJSON("charityPool", "DONATION_BURN_FEE_BIPS", CHARITY_CONFIG.DONATION_BURN_FEE_BIPS.toString());
    updateRulesJSON("charityPool", "WITHDRAWAL_FEE_ETH", CHARITY_CONFIG.WITHDRAWAL_FEE_ETH);
    updateRulesJSON("charityPool", "SERVICE_KEY", CHARITY_CONFIG.SERVICE_KEY);

    console.log("\n   ✅ CharityPool configurado!");
}

// ════════════════════════════════════════════════════════════════════════════
//                    💬 BACKCHAT CONFIGURATION (NOVO V4.0)
// ════════════════════════════════════════════════════════════════════════════

async function configureBackchat(
    backchat: any,
    miningManager: any,
    backchatAddr: string,
    ethers: any
) {
    console.log("\n💬 Configurando Backchat");
    console.log("────────────────────────────────────────────────────────────────");

    // 1. Autorizar Backchat no MiningManager
    const serviceKeyHash = ethers.keccak256(ethers.toUtf8Bytes(BACKCHAT_CONFIG.SERVICE_KEY));
    console.log(`\n   🔑 SERVICE_KEY: ${BACKCHAT_CONFIG.SERVICE_KEY}`);
    console.log(`      Hash: ${serviceKeyHash}`);

    const currentMiner = await miningManager.authorizedMiners(serviceKeyHash);
    if (currentMiner.toLowerCase() !== backchatAddr.toLowerCase()) {
        await sendTxWithRetry(
            async () => await miningManager.setAuthorizedMiner(serviceKeyHash, backchatAddr),
            `Autorizar Backchat (${BACKCHAT_CONFIG.SERVICE_KEY})`
        );
    } else {
        console.log(`   ⏩ Backchat já autorizado no MiningManager`);
    }

    // 2. Verificar configuração inicial (vem do initialize)
    console.log("\n   ⚙️ Verificando configuração...");
    
    try {
        const platformFee = await backchat.platformFee();
        const tipMiningFee = await backchat.tipMiningFeeBips();
        const maxContent = await backchat.maxContentLength();
        const treasury = await backchat.treasury();
        const bkcToken = await backchat.bkcToken();

        console.log(`      Platform Fee: ${ethers.formatEther(platformFee)} BKC`);
        console.log(`      Tip Mining: ${Number(tipMiningFee)/100}%`);
        console.log(`      Max Content: ${maxContent} chars`);
        console.log(`      Treasury: ${treasury}`);
        console.log(`      BKC Token: ${bkcToken}`);
    } catch (e: any) {
        console.log(`   ⚠️ Erro ao verificar: ${e.message?.slice(0, 50)}`);
    }

    // Salvar configuração
    updateRulesJSON("backchat", "PLATFORM_FEE", BACKCHAT_CONFIG.PLATFORM_FEE);
    updateRulesJSON("backchat", "PLATFORM_MINING_FEE_BIPS", BACKCHAT_CONFIG.PLATFORM_MINING_FEE_BIPS.toString());
    updateRulesJSON("backchat", "PLATFORM_TREASURY_FEE_BIPS", BACKCHAT_CONFIG.PLATFORM_TREASURY_FEE_BIPS.toString());
    updateRulesJSON("backchat", "TIP_MINING_FEE_BIPS", BACKCHAT_CONFIG.TIP_MINING_FEE_BIPS.toString());
    updateRulesJSON("backchat", "SERVICE_KEY", BACKCHAT_CONFIG.SERVICE_KEY);

    console.log("\n   ✅ Backchat configurado!");
}

// ════════════════════════════════════════════════════════════════════════════
//                    🚀 RENTAL MANAGER V2 CONFIGURATION (MetaAds)
// ════════════════════════════════════════════════════════════════════════════

async function configureRentalManagerV2(
    rental: any,
    rentalAddr: string,
    treasuryAddr: string,
    ethers: any
) {
    console.log("\n🚀 Configurando RentalManager V2 (MetaAds)");
    console.log("────────────────────────────────────────────────────────────────");

    if (!RENTAL_CONFIG.ENABLE_METAADS) {
        console.log("   ⏩ MetaAds desativado");
        return;
    }

    try {
        // 1. Verificar/Inicializar Treasury
        let currentTreasury: string;
        try {
            currentTreasury = await rental.treasury();
        } catch (e) {
            currentTreasury = ethers.ZeroAddress;
        }
        
        if (currentTreasury === ethers.ZeroAddress || currentTreasury === "0x0000000000000000000000000000000000000000") {
            console.log("   🔧 Inicializando RentalManager V2...");
            await sendTxWithRetry(
                async () => await rental.initializeV2(
                    treasuryAddr,
                    RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS,
                    RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS
                ),
                `RentalManager: initializeV2(${treasuryAddr}, ${RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS}, ${RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS})`
            );
        } else if (currentTreasury.toLowerCase() !== treasuryAddr.toLowerCase()) {
            console.log("   🔧 Atualizando Treasury...");
            await sendTxWithRetry(
                async () => await rental.setTreasury(treasuryAddr),
                `RentalManager: setTreasury(${treasuryAddr})`
            );
        } else {
            console.log(`   ⏩ Treasury já configurado: ${currentTreasury}`);
        }

        // 2. Configurar taxas de Mining e Burn (V2)
        console.log("\n   💰 Configurando taxas de rental...");
        try {
            const currentMiningFee = await rental.rentalMiningFeeBips();
            const currentBurnFee = await rental.rentalBurnFeeBips();
            
            const needsFeeUpdate = 
                currentMiningFee !== RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS ||
                currentBurnFee !== RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS;

            if (needsFeeUpdate) {
                await sendTxWithRetry(
                    async () => await rental.setRentalFees(
                        RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS,
                        RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS
                    ),
                    `RentalManager: setRentalFees(${RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS}, ${RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS})`
                );
            } else {
                console.log(`   ⏩ Taxas já configuradas: Mining ${Number(currentMiningFee)/100}%, Burn ${Number(currentBurnFee)/100}%`);
            }
        } catch (e: any) {
            // Se não conseguir ler, tenta configurar
            try {
                await sendTxWithRetry(
                    async () => await rental.setRentalFees(
                        RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS,
                        RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS
                    ),
                    `RentalManager: setRentalFees`
                );
            } catch (e2: any) {
                console.log(`   ⚠️ setRentalFees não disponível (V1?): ${e2.message?.slice(0, 40)}`);
            }
        }

        // 3. Salvar configuração
        updateRulesJSON("rentalManager", "METAADS_ENABLED", "true");
        updateRulesJSON("rentalManager", "TREASURY", treasuryAddr);
        updateRulesJSON("rentalManager", "RENTAL_MINING_FEE_BIPS", RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS.toString());
        updateRulesJSON("rentalManager", "RENTAL_BURN_FEE_BIPS", RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS.toString());
        updateRulesJSON("rentalManager", "VERSION", "V2");

        console.log("\n   ✅ RentalManager V2 configurado!");
        console.log(`      Treasury: ${treasuryAddr}`);
        console.log(`      Mining Fee: ${Number(RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS)/100}%`);
        console.log(`      Burn Fee: ${Number(RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS)/100}% 🔥`);
        console.log(`      Total Fee: ${(Number(RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS) + Number(RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS))/100}%`);
        
    } catch (e: any) {
        if (e.message?.includes("treasury") || e.message?.includes("function") || e.message?.includes("initializeV2")) {
            console.log("   ⚠️ RentalManager é V1 - MetaAds não disponível");
            console.log("   💡 Execute o upgrade: npx hardhat run scripts/upgrade_rental_manager_v2.ts");
            updateRulesJSON("rentalManager", "METAADS_ENABLED", "false");
            updateRulesJSON("rentalManager", "VERSION", "V1");
        } else {
            throw e;
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
//                    🚀 SCRIPT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export async function runScript(hre: HardhatRuntimeEnvironment) {
    const { ethers, upgrades } = hre;
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    const isMainnet = networkName === "arbitrum" || networkName === "arbitrumOne";
    RPC_ENDPOINTS = isMainnet ? MAINNET_RPC_ENDPOINTS : TESTNET_RPC_ENDPOINTS;
    RPC_ENDPOINTS.forEach(rpc => { rpcFailCounts[rpc.name] = 0; });

    console.log("════════════════════════════════════════════════════════════════");
    console.log("   🚀 BACKCHAIN ECOSYSTEM - DEPLOY COMPLETO V4.0");
    console.log("════════════════════════════════════════════════════════════════");
    console.log(`   📡 Rede: ${networkName} ${isMainnet ? '(MAINNET)' : '(TESTNET)'}`);
    console.log(`   👷 Deployer: ${deployer.address}`);
    console.log(`   💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
    console.log(`   🏦 Treasury: ${SYSTEM_WALLETS.TREASURY}`);
    console.log(`   🚀 MetaAds: ${RENTAL_CONFIG.ENABLE_METAADS ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   💬 Backchat: ENABLED`);
    console.log("────────────────────────────────────────────────────────────────\n");

    if (isMainnet) {
        console.log("⚠️  ATENÇÃO: Deploy em MAINNET!");
        console.log("   Aguardando 10 segundos para confirmação...\n");
        await sleep(10000);
    }

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

        // EcosystemManager
        const EcosystemManager = await ethers.getContractFactory("EcosystemManager");
        const { contract: hub, address: hubAddr } = await deployProxyWithRetry(
            upgrades, EcosystemManager, [deployer.address, SYSTEM_WALLETS.TREASURY], "EcosystemManager"
        );
        addresses.ecosystemManager = hubAddr;
        updateAddressJSON("ecosystemManager", hubAddr);
        updateAddressJSON("backcoinOracle", oracleAddr);
        updateAddressJSON("treasuryWallet", SYSTEM_WALLETS.TREASURY);

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
        const { contract: rental, address: rentalAddr } = await deployProxyWithRetry(
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
        // FASE 2B: BACKCHAT (NOVO V4.0)
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n💬 FASE 2B: Backchat (Rede Social)");
        console.log("────────────────────────────────────────────────────────────────");

        const Backchat = await ethers.getContractFactory("Backchat");
        const { contract: backchat, address: backchatAddr } = await deployProxyWithRetry(
            upgrades, Backchat, [deployer.address, hubAddr], "Backchat"
        );
        addresses.backchat = backchatAddr;
        updateAddressJSON("backchat", backchatAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 3: NFT LIQUIDITY SYSTEM
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n🏊 FASE 3: NFT Liquidity System");
        console.log("────────────────────────────────────────────────────────────────");

        const NFTLiquidityPool = await ethers.getContractFactory("NFTLiquidityPool");
        const poolImpl = await NFTLiquidityPool.deploy();
        await poolImpl.waitForDeployment();
        const poolImplAddr = await poolImpl.getAddress();
        console.log(`   ✅ NFTLiquidityPool (Template): ${poolImplAddr}`);
        await sleep(DEPLOY_DELAY_MS);

        const NFTLiquidityPoolFactory = await ethers.getContractFactory("NFTLiquidityPoolFactory");
        const { contract: factory, address: factoryAddr } = await deployProxyWithRetry(
            upgrades, NFTLiquidityPoolFactory, [deployer.address, hubAddr, poolImplAddr], "NFTLiquidityPoolFactory"
        );
        addresses.nftLiquidityPoolFactory = factoryAddr;
        updateAddressJSON("nftLiquidityPoolFactory", factoryAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 4: FAUCET (TESTNET ONLY)
        // ══════════════════════════════════════════════════════════════════════
        
        let faucetAddr: string | null = null;
        if (!isMainnet) {
            console.log("\n🚰 FASE 4: Faucet (Testnet)");
            console.log("────────────────────────────────────────────────────────────────");

            const Faucet = await ethers.getContractFactory("Faucet");
            const { address } = await deployProxyWithRetry(
                upgrades, Faucet, [deployer.address, hubAddr], "Faucet"
            );
            faucetAddr = address;
            addresses.faucet = faucetAddr;
            updateAddressJSON("faucet", faucetAddr);
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 5: HUB CONFIGURATION
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n⚙️ FASE 5: Configuração do Hub");
        console.log("────────────────────────────────────────────────────────────────");

        // Registrar contratos
        await sendTxWithRetry(
            async () => await hub.setContractAddresses(
                bkcAddr, nftAddr, mmAddr, dmAddr, SYSTEM_WALLETS.TREASURY
            ),
            "Hub: setContractAddresses"
        );

        await sendTxWithRetry(
            async () => await miningManager.setDelegationManager(dmAddr),
            "MiningManager: setDelegationManager"
        );

        await sendTxWithRetry(
            async () => await delegationManager.setMiningManager(mmAddr),
            "DelegationManager: setMiningManager"
        );

        // ══════════════════════════════════════════════════════════════════════
        // FASE 6: FEES CONFIGURATION
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n💰 FASE 6: Configuração de Taxas");
        console.log("────────────────────────────────────────────────────────────────");

        for (const [key, value] of Object.entries(SERVICE_FEES_BIPS)) {
            await setFeeBipsIfNeeded(hub, ethers, key, value as bigint);
        }

        // Booster Discounts
        console.log("\n   ⭐ Configurando Booster Discounts...");
        for (const { boostBips, discountBips, name } of BOOSTER_DISCOUNTS) {
            await setBoosterDiscountIfNeeded(hub, boostBips, discountBips, name);
        }

        // Distribution
        console.log("\n   📊 Configurando Distribuição...");
        await setDistributionIfNeeded(hub, ethers, "setMiningDistributionBips", "TREASURY", DISTRIBUTION.mining.TREASURY, "miningDistribution");
        await setDistributionIfNeeded(hub, ethers, "setMiningDistributionBips", "DELEGATOR_POOL", DISTRIBUTION.mining.DELEGATOR_POOL, "miningDistribution");
        await setDistributionIfNeeded(hub, ethers, "setFeeDistributionBips", "TREASURY", DISTRIBUTION.fee.TREASURY, "feeDistribution");
        await setDistributionIfNeeded(hub, ethers, "setFeeDistributionBips", "DELEGATOR_POOL", DISTRIBUTION.fee.DELEGATOR_POOL, "feeDistribution");

        // ══════════════════════════════════════════════════════════════════════
        // FASE 7: SERVICE-SPECIFIC CONFIGURATION
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n🔧 FASE 7: Configuração de Serviços");
        console.log("────────────────────────────────────────────────────────────────");

        // CharityPool
        await configureCharityPool(charity, miningManager, charityAddr, ethers);

        // RentalManager V2 (MetaAds)
        await configureRentalManagerV2(rental, rentalAddr, SYSTEM_WALLETS.TREASURY, ethers);

        // Backchat (NOVO V4.0)
        await configureBackchat(backchat, miningManager, backchatAddr, ethers);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 8: TGE
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n💎 FASE 8: TGE (Token Generation Event)");
        console.log("────────────────────────────────────────────────────────────────");

        const totalSupply = await bkc.totalSupply();
        if (totalSupply === 0n) {
            await sendTxWithRetry(
                async () => await bkc.executeTGE(LIQUIDITY_CONFIG.TGE_SUPPLY),
                `TGE: ${ethers.formatEther(LIQUIDITY_CONFIG.TGE_SUPPLY)} BKC`
            );
        } else {
            console.log(`   ⏩ TGE já executado: ${ethers.formatEther(totalSupply)} BKC`);
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 9: LIQUIDEZ INICIAL
        // ══════════════════════════════════════════════════════════════════════
        
        console.log("\n💧 FASE 9: Liquidez Inicial");
        console.log("────────────────────────────────────────────────────────────────");

        // Fortune Pool
        const fortuneBalance = await bkc.balanceOf(fortuneAddr);
        if (fortuneBalance < LIQUIDITY_CONFIG.FORTUNE_POOL) {
            const needed = LIQUIDITY_CONFIG.FORTUNE_POOL - fortuneBalance;
            await sendTxWithRetry(
                async () => await bkc.transfer(fortuneAddr, needed),
                `Fortune Pool: +${ethers.formatEther(needed)} BKC`
            );
        } else {
            console.log(`   ⏩ Fortune Pool já tem: ${ethers.formatEther(fortuneBalance)} BKC`);
        }

        // Faucet (Testnet only)
        if (!isMainnet && faucetAddr) {
            const faucetBalance = await bkc.balanceOf(faucetAddr);
            if (faucetBalance < LIQUIDITY_CONFIG.FAUCET) {
                const needed = LIQUIDITY_CONFIG.FAUCET - faucetBalance;
                await sendTxWithRetry(
                    async () => await bkc.transfer(faucetAddr, needed),
                    `Faucet: +${ethers.formatEther(needed)} BKC`
                );
            } else {
                console.log(`   ⏩ Faucet já tem: ${ethers.formatEther(faucetBalance)} BKC`);
            }
        }

        // NFT Pools
        console.log("\n   🏊 Configurando NFT Pools...");
        for (const tier of NFT_TIERS) {
            const poolAddress = await factory.getPoolByBoostBips(tier.boostBips);
            
            if (poolAddress === ethers.ZeroAddress) {
                console.log(`      🔨 Criando Pool ${tier.name}...`);
                await sendTxWithRetry(
                    async () => await factory.createPool(nftAddr, bkcAddr, tier.boostBips),
                    `Criar Pool ${tier.name}`
                );
                await sleep(TX_DELAY_MS);
                
                const newPoolAddr = await factory.getPoolByBoostBips(tier.boostBips);
                addresses[`pool_${tier.name.toLowerCase()}`] = newPoolAddr;
                updateAddressJSON(`pool_${tier.name.toLowerCase()}`, newPoolAddr);
            } else {
                console.log(`      ⏩ Pool ${tier.name}: ${poolAddress}`);
                addresses[`pool_${tier.name.toLowerCase()}`] = poolAddress;
                updateAddressJSON(`pool_${tier.name.toLowerCase()}`, poolAddress);
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
        console.log("                    📊 DEPLOY CONCLUÍDO V4.0!");
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
        console.log(`      Donation Mining: ${Number(CHARITY_CONFIG.DONATION_MINING_FEE_BIPS)/100}%`);
        console.log(`      Donation Burn:   ${Number(CHARITY_CONFIG.DONATION_BURN_FEE_BIPS)/100}%`);
        console.log(`      Withdrawal:      ${CHARITY_CONFIG.WITHDRAWAL_FEE_ETH} ETH`);
        
        console.log("\n   💬 BACKCHAT:");
        console.log(`      Platform Fee:    ${BACKCHAT_CONFIG.PLATFORM_FEE} BKC`);
        console.log(`      Platform Mining: ${Number(BACKCHAT_CONFIG.PLATFORM_MINING_FEE_BIPS)/100}%`);
        console.log(`      Platform Treasury: ${Number(BACKCHAT_CONFIG.PLATFORM_TREASURY_FEE_BIPS)/100}%`);
        console.log(`      Tip Mining:      ${Number(BACKCHAT_CONFIG.TIP_MINING_FEE_BIPS)/100}%`);
        console.log(`      Max Content:     ${BACKCHAT_CONFIG.MAX_CONTENT_LENGTH} chars`);
        
        console.log("\n   🚀 RENTAL V2 (MetaAds):");
        console.log(`      Enabled:         ${RENTAL_CONFIG.ENABLE_METAADS}`);
        console.log(`      Treasury:        ${SYSTEM_WALLETS.TREASURY}`);
        console.log(`      Mining Fee:      ${Number(RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS)/100}%`);
        console.log(`      Burn Fee:        ${Number(RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS)/100}% 🔥`);
        console.log(`      Total Fee:       ${(Number(RENTAL_CONFIG.RENTAL_MINING_FEE_BIPS) + Number(RENTAL_CONFIG.RENTAL_BURN_FEE_BIPS))/100}%`);

        console.log("\n📊 DISTRIBUIÇÃO:");
        console.log("────────────────────────────────────────────────────────────────");
        console.log("   Mining:  30% Treasury / 70% Stakers");
        console.log("   Fees:    30% Treasury / 70% Stakers");

        const finalBalance = await bkc.balanceOf(deployer.address);
        console.log("\n💧 LIQUIDEZ FINAL:");
        console.log("────────────────────────────────────────────────────────────────");
        console.log(`   Deployer: ${ethers.formatEther(finalBalance)} BKC`);
        if (!isMainnet && faucetAddr) {
            console.log(`   Faucet:   ${ethers.formatEther(await bkc.balanceOf(faucetAddr))} BKC`);
        }
        console.log(`   Fortune:  ${ethers.formatEther(await bkc.balanceOf(fortuneAddr))} BKC`);

        console.log("\n────────────────────────────────────────────────────────────────");
        console.log(`   🎉 ECOSSISTEMA BACKCHAIN V4.0 IMPLANTADO COM SUCESSO!`);
        console.log(`   📡 Rede: ${networkName} ${isMainnet ? '(MAINNET)' : '(TESTNET)'}`);
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