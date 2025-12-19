// scripts/3_launch_and_liquidate_ecosystem.ts
// ✅ VERSÃO V3.1 - Multi-RPC Fallback + TGE + Liquidez
// ============================================================
// CHANGELOG V3.1:
// - Sistema Multi-RPC com fallback automático
// - Retry inteligente com troca de RPC em caso de falha
// - Delays aumentados para estabilidade
// - Timeout handling melhorado
// ============================================================

import { ethers, upgrades, network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { ContractTransactionReceipt, JsonRpcProvider, Wallet } from "ethers";

// ============================================================
//              🌐 MULTI-RPC CONFIGURATION
// ============================================================

const RPC_ENDPOINTS = [
    {
        name: 'Arbitrum Official',
        url: 'https://sepolia-rollup.arbitrum.io/rpc',
        priority: 1
    },
    {
        name: 'Alchemy',
        url: process.env.ALCHEMY_API_KEY 
            ? `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` 
            : null,
        priority: 2
    },
    {
        name: 'BlockPI',
        url: 'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
        priority: 3
    },
    {
        name: 'PublicNode',
        url: 'https://arbitrum-sepolia-rpc.publicnode.com',
        priority: 4
    }
].filter(rpc => rpc.url) as { name: string; url: string; priority: number }[];

let currentRpcIndex = 0;
let rpcFailCounts: Record<string, number> = {};
RPC_ENDPOINTS.forEach(rpc => { rpcFailCounts[rpc.name] = 0; });

const MAX_RPC_FAILURES = 3;

// ============================================================
//              🔐 CARTEIRAS DO SISTEMA
// ============================================================

const SYSTEM_WALLETS = {
    TREASURY: "0xc93030333E3a235c2605BcB7C7330650B600B6D0",
    ORACLE: "0x56b05f7E8263164B07c29E26e18994F9adc00Be8"
};

// ============================================================
//                    CONFIGURAÇÃO GERAL
// ============================================================

const DEPLOY_DELAY_MS = 5000;
const TX_DELAY_MS = 2000;      // Delay entre transações
const RETRY_DELAY_MS = 5000;   // Delay antes de retry
const CHUNK_SIZE = 50;
const CHUNK_SIZE_BIGINT = BigInt(CHUNK_SIZE);

// ============================================================
//                 💰 TAXAS OFICIAIS V3.0
// ============================================================

const SERVICE_FEES_BIPS = {
    DELEGATION_FEE_BIPS: 50n,
    UNSTAKE_FEE_BIPS: 100n,
    FORCE_UNSTAKE_PENALTY_BIPS: 5000n,
    CLAIM_REWARD_FEE_BIPS: 100n,
    NFT_POOL_BUY_TAX_BIPS: 500n,
    NFT_POOL_SELL_TAX_BIPS: 1000n,
    FORTUNE_POOL_SERVICE: 2000n,
    RENTAL_MARKET_TAX_BIPS: 1000n,
};

const SERVICE_FEES_BKC = {
    NOTARY_SERVICE: ethers.parseEther("1")
};

// ============================================================
//               📊 DISTRIBUIÇÃO DE REWARDS V3.0
// ============================================================

const DISTRIBUTION = {
    mining: {
        TREASURY: 3000n,
        DELEGATOR_POOL: 7000n
    },
    fee: {
        TREASURY: 3000n,
        DELEGATOR_POOL: 7000n
    }
};

// ============================================================
//               ⭐ BOOSTER DISCOUNTS V3.0
// ============================================================

const BOOSTER_DISCOUNTS = [
    { boostBips: 7000n, discountBips: 7000n },
    { boostBips: 6000n, discountBips: 6000n },
    { boostBips: 5000n, discountBips: 5000n },
    { boostBips: 4000n, discountBips: 4000n },
    { boostBips: 3000n, discountBips: 3000n },
    { boostBips: 2000n, discountBips: 2000n },
    { boostBips: 1000n, discountBips: 1000n },
];

// ============================================================
//               🎰 FORTUNE POOL CONFIG V3.0
// ============================================================

const FORTUNE_POOL_CONFIG = {
    ORACLE_FEE_1X: 0n,
    ORACLE_FEE_5X: 0n,
    GAME_FEE_BIPS: 2000n,
};

const FORTUNE_POOL_PRIZE_TIERS = [
    { tierId: 1, range: 3,   multiplierBips: 20000,   name: "Fácil (1/3 - 2x)" },
    { tierId: 2, range: 10,  multiplierBips: 50000,   name: "Médio (1/10 - 5x)" },
    { tierId: 3, range: 100, multiplierBips: 1000000, name: "Difícil (1/100 - 100x)" }
];

// ============================================================
//               🚰 FAUCET CONFIG V3.0
// ============================================================

const FAUCET_CONFIG = {
    TOKENS_PER_REQUEST: ethers.parseEther("20"),
    ETH_PER_REQUEST: ethers.parseEther("0.001"),
    COOLDOWN_SECONDS: 3600
};

// ============================================================
//               💧 LIQUIDEZ INICIAL V3.0
// ============================================================

const LIQUIDITY_CONFIG = {
    TGE_SUPPLY: 40_000_000n * 10n**18n,
    FORTUNE_POOL: ethers.parseEther("1000000"),
    FAUCET: ethers.parseEther("4000000"),
    NFT_POOL_EACH: ethers.parseEther("500000"),
    GENESIS_STAKE_AMOUNT: ethers.parseEther("1000"),
    GENESIS_STAKE_DAYS: 365
};

const NFT_MINT_COUNT_PER_TIER = [
    100n, 200n, 300n, 400n, 500n, 600n, 1000n
];

// ============================================================
//                   🎨 TIERS DOS NFTs
// ============================================================

const ALL_TIERS = [
    { tierId: 1, name: "Diamond",  boostBips: 7000n, metadata: "diamond_booster.json" },
    { tierId: 2, name: "Platinum", boostBips: 6000n, metadata: "platinum_booster.json" },
    { tierId: 3, name: "Gold",     boostBips: 5000n, metadata: "gold_booster.json" },
    { tierId: 4, name: "Silver",   boostBips: 4000n, metadata: "silver_booster.json" },
    { tierId: 5, name: "Bronze",   boostBips: 3000n, metadata: "bronze_booster.json" },
    { tierId: 6, name: "Iron",     boostBips: 2000n, metadata: "iron_booster.json" },
    { tierId: 7, name: "Crystal",  boostBips: 1000n, metadata: "crystal_booster.json" },
];

// ============================================================
//                    PATHS DOS ARQUIVOS
// ============================================================

const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
const rulesFilePath = path.join(__dirname, "../rules-config.json");

// ============================================================
//                    FUNÇÕES AUXILIARES
// ============================================================

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function updateAddressJSON(key: string, value: string) {
    let currentAddresses: any = {};
    if (fs.existsSync(addressesFilePath)) {
        currentAddresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
    }
    currentAddresses[key] = value;
    fs.writeFileSync(addressesFilePath, JSON.stringify(currentAddresses, null, 2));
}

function updateRulesJSON(section: string, key: string, value: string) {
    let rules: any = {};
    if (fs.existsSync(rulesFilePath)) {
        rules = JSON.parse(fs.readFileSync(rulesFilePath, "utf8"));
    }
    if (!rules[section]) rules[section] = {};
    rules[section][key] = value;
    rules["LAST_UPDATED"] = new Date().toISOString();
    rules["VERSION"] = "3.1.0";
    fs.writeFileSync(rulesFilePath, JSON.stringify(rules, null, 2));
}

function createFullRulesConfig() {
    const rules = {
        "VERSION": "3.1.0",
        "DESCRIPTION": "Configuração Oficial Backcoin V3.1 - Multi-RPC",
        "NETWORK": "arbitrum-sepolia",
        "CREATED_AT": new Date().toISOString(),
        
        "serviceFeesBIPS": {
            "DELEGATION_FEE_BIPS": SERVICE_FEES_BIPS.DELEGATION_FEE_BIPS.toString(),
            "UNSTAKE_FEE_BIPS": SERVICE_FEES_BIPS.UNSTAKE_FEE_BIPS.toString(),
            "FORCE_UNSTAKE_PENALTY_BIPS": SERVICE_FEES_BIPS.FORCE_UNSTAKE_PENALTY_BIPS.toString(),
            "CLAIM_REWARD_FEE_BIPS": SERVICE_FEES_BIPS.CLAIM_REWARD_FEE_BIPS.toString(),
            "NFT_POOL_BUY_TAX_BIPS": SERVICE_FEES_BIPS.NFT_POOL_BUY_TAX_BIPS.toString(),
            "NFT_POOL_SELL_TAX_BIPS": SERVICE_FEES_BIPS.NFT_POOL_SELL_TAX_BIPS.toString(),
            "FORTUNE_POOL_SERVICE": SERVICE_FEES_BIPS.FORTUNE_POOL_SERVICE.toString(),
            "RENTAL_MARKET_TAX_BIPS": SERVICE_FEES_BIPS.RENTAL_MARKET_TAX_BIPS.toString()
        },
        
        "serviceFeesBKC": {
            "NOTARY_SERVICE": ethers.formatEther(SERVICE_FEES_BKC.NOTARY_SERVICE)
        },
        
        "miningDistribution": {
            "TREASURY": DISTRIBUTION.mining.TREASURY.toString(),
            "DELEGATOR_POOL": DISTRIBUTION.mining.DELEGATOR_POOL.toString()
        },
        
        "feeDistribution": {
            "TREASURY": DISTRIBUTION.fee.TREASURY.toString(),
            "DELEGATOR_POOL": DISTRIBUTION.fee.DELEGATOR_POOL.toString()
        },
        
        "boosterDiscounts": {
            "7000": "7000", "6000": "6000", "5000": "5000",
            "4000": "4000", "3000": "3000", "2000": "2000", "1000": "1000"
        },
        
        "fortunePoolTiers": {
            "1": `${FORTUNE_POOL_PRIZE_TIERS[0].range},${FORTUNE_POOL_PRIZE_TIERS[0].multiplierBips}`,
            "2": `${FORTUNE_POOL_PRIZE_TIERS[1].range},${FORTUNE_POOL_PRIZE_TIERS[1].multiplierBips}`,
            "3": `${FORTUNE_POOL_PRIZE_TIERS[2].range},${FORTUNE_POOL_PRIZE_TIERS[2].multiplierBips}`
        },
        
        "wallets": {
            "ORACLE_ADDRESS": SYSTEM_WALLETS.ORACLE,
            "TREASURY_ADDRESS": SYSTEM_WALLETS.TREASURY
        }
    };
    
    fs.writeFileSync(rulesFilePath, JSON.stringify(rules, null, 2));
    console.log("   ✅ rules-config.json V3.1 criado");
}

// ============================================================
//              🌐 MULTI-RPC PROVIDER SYSTEM
// ============================================================

function getNextRpc(): { name: string; url: string } {
    const availableRpcs = RPC_ENDPOINTS.filter(rpc => 
        rpcFailCounts[rpc.name] < MAX_RPC_FAILURES
    );
    
    if (availableRpcs.length === 0) {
        console.log('   ⚠️ All RPCs failed, resetting...');
        RPC_ENDPOINTS.forEach(rpc => { rpcFailCounts[rpc.name] = 0; });
        return RPC_ENDPOINTS[0];
    }
    
    return availableRpcs[0];
}

function markRpcFailed(rpcName: string) {
    rpcFailCounts[rpcName] = (rpcFailCounts[rpcName] || 0) + 1;
    console.log(`   ⚠️ RPC ${rpcName} failed (${rpcFailCounts[rpcName]}/${MAX_RPC_FAILURES})`);
}

function markRpcSuccess(rpcName: string) {
    rpcFailCounts[rpcName] = 0;
}

async function getWorkingProvider(): Promise<JsonRpcProvider> {
    for (const rpc of RPC_ENDPOINTS) {
        if (rpcFailCounts[rpc.name] >= MAX_RPC_FAILURES) continue;
        
        try {
            const provider = new ethers.JsonRpcProvider(rpc.url, undefined, {
                staticNetwork: true,
                batchMaxCount: 1
            });
            
            // Test connection with timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 15000)
            );
            await Promise.race([provider.getBlockNumber(), timeoutPromise]);
            
            console.log(`   🌐 Using RPC: ${rpc.name}`);
            markRpcSuccess(rpc.name);
            return provider;
        } catch (e) {
            markRpcFailed(rpc.name);
        }
    }
    
    // Fallback to first RPC
    console.log(`   🔄 Fallback to ${RPC_ENDPOINTS[0].name}`);
    return new ethers.JsonRpcProvider(RPC_ENDPOINTS[0].url);
}

// ============================================================
//              🔄 ROBUST TRANSACTION SENDER
// ============================================================

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
            
            // Already done - not an error
            if (msg.includes("already") || msg.includes("Already")) {
                console.log(`   ⚠️ Já realizado: ${description}`);
                return null;
            }
            
            // Connection errors - try different RPC
            const isConnectionError = 
                msg.includes("ECONNRESET") ||
                msg.includes("TIMEOUT") ||
                msg.includes("timeout") ||
                msg.includes("Timeout") ||
                msg.includes("ETIMEDOUT") ||
                msg.includes("EAI_AGAIN") ||
                msg.includes("ENOTFOUND") ||
                msg.includes("socket hang up") ||
                msg.includes("network") ||
                msg.includes("429") ||
                msg.includes("Too Many") ||
                msg.includes("rate limit") ||
                msg.includes("HeadersTimeout");
            
            if (isConnectionError) {
                const currentRpc = getNextRpc();
                markRpcFailed(currentRpc.name);
                
                const waitTime = RETRY_DELAY_MS * (attempt + 1);
                console.log(`   ⚠️ Conexão falhou. Tentativa ${attempt + 1}/${maxRetries}. Aguardando ${waitTime/1000}s...`);
                await sleep(waitTime);
                continue;
            }
            
            // Nonce errors - retry with delay
            if (msg.includes("nonce") || msg.includes("replacement")) {
                const waitTime = 3000 * (attempt + 1);
                console.log(`   ⚠️ Erro de nonce. Tentativa ${attempt + 1}/${maxRetries}. Aguardando ${waitTime/1000}s...`);
                await sleep(waitTime);
                continue;
            }
            
            // Other errors - throw immediately
            throw error;
        }
    }
    
    throw lastError || new Error(`Falha após ${maxRetries} tentativas: ${description}`);
}

// ============================================================
//              🔍 FIND ORPHAN NFTs
// ============================================================

async function findOrphanNFTs(nft: any, deployer: string, targetBoost: bigint): Promise<string[]> {
    console.log(`      🔍 Buscando NFTs órfãos...`);
    
    for (let rpcAttempt = 0; rpcAttempt < 3; rpcAttempt++) {
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
                    } catch (e) { /* ignorado */ }
                }
            }
            
            const unique = [...new Set(ownedIds)];
            if (unique.length > 0) {
                console.log(`      ⚠️ ${unique.length} NFTs órfãos encontrados!`);
            }
            return unique;
            
        } catch (e: any) {
            if (rpcAttempt < 2) {
                console.log(`      ⚠️ Falha ao buscar eventos, tentando novamente...`);
                await sleep(3000);
            }
        }
    }
    
    console.warn("      ⚠️ Falha ao buscar eventos. Continuando sem órfãos.");
    return [];
}

// ============================================================
//              HELPER FUNCTIONS
// ============================================================

async function setFeeBipsIfNeeded(hub: any, key: string, value: bigint) {
    const hash = ethers.id(key);
    const current = await hub.getFee(hash);
    if (current === value) {
        console.log(`      ⏩ ${key} já configurado (${value} bips)`);
        return;
    }
    await sendTxWithRetry(
        async () => await hub.setServiceFee(hash, value),
        `${key} → ${value} bips`
    );
    updateRulesJSON("serviceFeesBIPS", key, value.toString());
}

async function setFeeBKCIfNeeded(hub: any, key: string, value: bigint) {
    const hash = ethers.id(key);
    const current = await hub.getFee(hash);
    if (current === value) {
        console.log(`      ⏩ ${key} já configurado (${ethers.formatEther(value)} BKC)`);
        return;
    }
    await sendTxWithRetry(
        async () => await hub.setServiceFee(hash, value),
        `${key} → ${ethers.formatEther(value)} BKC`
    );
    updateRulesJSON("serviceFeesBKC", key, ethers.formatEther(value));
}

async function setDistributionIfNeeded(
    hub: any,
    funcName: "setMiningDistributionBips" | "setFeeDistributionBips",
    poolKey: string,
    value: bigint,
    section: string
) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(poolKey));
    const getFuncName = funcName === "setMiningDistributionBips" 
        ? "getMiningDistributionBips" 
        : "getFeeDistributionBips";
    
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

async function setBoosterDiscountIfNeeded(hub: any, boostBips: bigint, discountBips: bigint) {
    const current = await hub.getBoosterDiscount(boostBips);
    if (current === discountBips) {
        console.log(`      ⏩ Booster ${boostBips} já configurado`);
        return;
    }
    
    await sendTxWithRetry(
        async () => await hub.setBoosterDiscount(boostBips, discountBips),
        `Booster ${boostBips} → ${Number(discountBips)/100}% desconto`
    );
    updateRulesJSON("boosterDiscounts", boostBips.toString(), discountBips.toString());
}

async function configureFortunePoolTiers(fortunePool: any): Promise<void> {
    console.log("\n   🎰 Configurando Prize Tiers...");
    
    const currentCount = await fortunePool.activeTierCount();
    
    for (const tier of FORTUNE_POOL_PRIZE_TIERS) {
        let needsConfig = false;
        
        if (tier.tierId <= Number(currentCount)) {
            try {
                const existing = await fortunePool.prizeTiers(tier.tierId);
                if (
                    Number(existing.maxRange) !== tier.range ||
                    Number(existing.multiplierBips) !== tier.multiplierBips ||
                    !existing.active
                ) {
                    needsConfig = true;
                }
            } catch (e) {
                needsConfig = true;
            }
        } else {
            needsConfig = true;
        }
        
        if (needsConfig) {
            await sendTxWithRetry(
                async () => await fortunePool.configureTier(tier.tierId, tier.range, tier.multiplierBips),
                `Prize Tier ${tier.tierId}: ${tier.name}`
            );
            updateRulesJSON("fortunePoolTiers", tier.tierId.toString(), `${tier.range},${tier.multiplierBips}`);
        } else {
            console.log(`      ⏩ Tier ${tier.tierId} já configurado`);
        }
    }
    console.log("   ✅ Prize Tiers configurados");
}

// ============================================================
//                    SCRIPT PRINCIPAL
// ============================================================

export async function runScript(hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    console.log("════════════════════════════════════════════════════════════════");
    console.log("   🚀 BACKCOIN LAUNCH V3.1 - Multi-RPC + TGE + LIQUIDEZ");
    console.log("════════════════════════════════════════════════════════════════");
    console.log(`   📡 Rede: ${networkName}`);
    console.log(`   👷 Deployer: ${deployer.address}`);
    console.log(`   🌐 RPCs disponíveis: ${RPC_ENDPOINTS.map(r => r.name).join(', ')}`);
    console.log("────────────────────────────────────────────────────────────────\n");

    // Validação de carteiras
    if (SYSTEM_WALLETS.TREASURY.includes("INSERIR") || SYSTEM_WALLETS.ORACLE.includes("INSERIR")) {
        throw new Error("Configure as carteiras SYSTEM_WALLETS antes de executar");
    }

    // Carregar endereços
    if (!fs.existsSync(addressesFilePath)) {
        throw new Error("❌ deployment-addresses.json não encontrado!");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

    // Atualizar endereços das carteiras
    addresses.oracleWalletAddress = SYSTEM_WALLETS.ORACLE;
    addresses.treasuryWallet = SYSTEM_WALLETS.TREASURY;
    updateAddressJSON("oracleWalletAddress", SYSTEM_WALLETS.ORACLE);
    updateAddressJSON("treasuryWallet", SYSTEM_WALLETS.TREASURY);
    
    console.log(`   🔐 Oracle: ${SYSTEM_WALLETS.ORACLE}`);
    console.log(`   💰 Treasury: ${SYSTEM_WALLETS.TREASURY}\n`);

    createFullRulesConfig();

    // Instanciar contratos
    const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, deployer);
    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
    const nft = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, deployer);
    const miningManager = await ethers.getContractAt("MiningManager", addresses.miningManager, deployer);
    const delegationManager = await ethers.getContractAt("DelegationManager", addresses.delegationManager, deployer);
    const fortunePool = await ethers.getContractAt("FortunePool", addresses.fortunePool, deployer);
    const factory = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, deployer);

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 1: WIRING
    // ═══════════════════════════════════════════════════════════════════

    console.log("🔌 PARTE 1: Conectando o Sistema");
    console.log("────────────────────────────────────────────────────────────────");

    await sendTxWithRetry(
        async () => await hub.setAddresses(
            addresses.bkcToken,
            SYSTEM_WALLETS.TREASURY,
            addresses.delegationManager,
            addresses.rewardBoosterNFT,
            addresses.miningManager,
            addresses.decentralizedNotary,
            addresses.fortunePool,
            addresses.nftLiquidityPoolFactory
        ),
        "Hub: Atualizar endereços"
    );

    // Autorizar miners
    const miners = [
        { key: "FORTUNE_POOL_SERVICE", addr: addresses.fortunePool },
        { key: "NOTARY_SERVICE", addr: addresses.decentralizedNotary },
        { key: "RENTAL_MARKET_TAX_BIPS", addr: addresses.rentalManager },
        { key: "DELEGATION_FEE_BIPS", addr: addresses.delegationManager },
        { key: "UNSTAKE_FEE_BIPS", addr: addresses.delegationManager },
        { key: "FORCE_UNSTAKE_PENALTY_BIPS", addr: addresses.delegationManager },
        { key: "CLAIM_REWARD_FEE_BIPS", addr: addresses.delegationManager },
        { key: "NFT_POOL_BUY_TAX_BIPS", addr: addresses.nftLiquidityPoolFactory },
        { key: "NFT_POOL_SELL_TAX_BIPS", addr: addresses.nftLiquidityPoolFactory },
    ];

    console.log("\n   📝 Autorizando Miners...");
    for (const m of miners) {
        if (m.addr?.startsWith('0x')) {
            const hash = ethers.id(m.key);
            const current = await miningManager.authorizedMiners(hash);
            if (current.toLowerCase() !== m.addr.toLowerCase()) {
                await sendTxWithRetry(
                    async () => await miningManager.setAuthorizedMiner(hash, m.addr),
                    `Autorizar: ${m.key}`
                );
            } else {
                console.log(`      ⏩ ${m.key} já autorizado`);
            }
        }
    }

    // Transferir ownership do BKC
    try {
        const bkcOwner = await bkc.owner();
        if (bkcOwner.toLowerCase() === deployer.address.toLowerCase()) {
            await sendTxWithRetry(
                async () => await bkc.transferOwnership(addresses.miningManager),
                "Transferir ownership BKC → MiningManager"
            );
        }
    } catch (e) {
        console.log("   ⏩ BKC ownership já transferido");
    }

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 2: TAXAS
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n⚖️ PARTE 2: Configurando Taxas V3.1");
    console.log("────────────────────────────────────────────────────────────────");

    console.log("\n   📊 Taxas em BIPS:");
    await setFeeBipsIfNeeded(hub, "DELEGATION_FEE_BIPS", SERVICE_FEES_BIPS.DELEGATION_FEE_BIPS);
    await setFeeBipsIfNeeded(hub, "UNSTAKE_FEE_BIPS", SERVICE_FEES_BIPS.UNSTAKE_FEE_BIPS);
    await setFeeBipsIfNeeded(hub, "FORCE_UNSTAKE_PENALTY_BIPS", SERVICE_FEES_BIPS.FORCE_UNSTAKE_PENALTY_BIPS);
    await setFeeBipsIfNeeded(hub, "CLAIM_REWARD_FEE_BIPS", SERVICE_FEES_BIPS.CLAIM_REWARD_FEE_BIPS);
    await setFeeBipsIfNeeded(hub, "NFT_POOL_BUY_TAX_BIPS", SERVICE_FEES_BIPS.NFT_POOL_BUY_TAX_BIPS);
    await setFeeBipsIfNeeded(hub, "NFT_POOL_SELL_TAX_BIPS", SERVICE_FEES_BIPS.NFT_POOL_SELL_TAX_BIPS);
    await setFeeBipsIfNeeded(hub, "FORTUNE_POOL_SERVICE", SERVICE_FEES_BIPS.FORTUNE_POOL_SERVICE);
    await setFeeBipsIfNeeded(hub, "RENTAL_MARKET_TAX_BIPS", SERVICE_FEES_BIPS.RENTAL_MARKET_TAX_BIPS);

    console.log("\n   💰 Taxas em BKC:");
    await setFeeBKCIfNeeded(hub, "NOTARY_SERVICE", SERVICE_FEES_BKC.NOTARY_SERVICE);

    console.log("\n   ⛏️ Distribuição Mining:");
    await setDistributionIfNeeded(hub, "setMiningDistributionBips", "TREASURY", DISTRIBUTION.mining.TREASURY, "miningDistribution");
    await setDistributionIfNeeded(hub, "setMiningDistributionBips", "DELEGATOR_POOL", DISTRIBUTION.mining.DELEGATOR_POOL, "miningDistribution");

    console.log("\n   💵 Distribuição Fees:");
    await setDistributionIfNeeded(hub, "setFeeDistributionBips", "TREASURY", DISTRIBUTION.fee.TREASURY, "feeDistribution");
    await setDistributionIfNeeded(hub, "setFeeDistributionBips", "DELEGATOR_POOL", DISTRIBUTION.fee.DELEGATOR_POOL, "feeDistribution");

    console.log("\n   ⭐ Booster Discounts:");
    for (const d of BOOSTER_DISCOUNTS) {
        await setBoosterDiscountIfNeeded(hub, d.boostBips, d.discountBips);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 3: TGE
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n💰 PARTE 3: TGE");
    console.log("────────────────────────────────────────────────────────────────");

    try {
        const totalSupply = await bkc.totalSupply();
        if (totalSupply < LIQUIDITY_CONFIG.TGE_SUPPLY) {
            await sendTxWithRetry(
                async () => await miningManager.executeTGE(deployer.address, LIQUIDITY_CONFIG.TGE_SUPPLY),
                `TGE: Mint ${ethers.formatEther(LIQUIDITY_CONFIG.TGE_SUPPLY)} BKC`
            );
        } else {
            console.log("   ✅ TGE já realizado");
        }
    } catch (e: any) {
        console.log(`   ⚠️ TGE: ${e.message?.slice(0, 50)}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 4: FORTUNE POOL
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n🎰 PARTE 4: Fortune Pool");
    console.log("────────────────────────────────────────────────────────────────");

    const currentOracle = await fortunePool.oracleAddress();
    if (currentOracle.toLowerCase() !== SYSTEM_WALLETS.ORACLE.toLowerCase()) {
        await sendTxWithRetry(
            async () => await fortunePool.setOracle(SYSTEM_WALLETS.ORACLE),
            `Fortune: Oracle → ${SYSTEM_WALLETS.ORACLE.slice(0,10)}...`
        );
    }

    const currentOracleFee = await fortunePool.oracleFee();
    if (currentOracleFee !== FORTUNE_POOL_CONFIG.ORACLE_FEE_1X) {
        await sendTxWithRetry(
            async () => await fortunePool.setOracleFee(FORTUNE_POOL_CONFIG.ORACLE_FEE_1X),
            `Fortune: Oracle Fee → 0`
        );
    }

    await configureFortunePoolTiers(fortunePool);

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 5: LIQUIDEZ
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n💧 PARTE 5: Injetando Liquidez");
    console.log("────────────────────────────────────────────────────────────────");

    // 5.1 Faucet
    console.log("\n   🚰 Faucet:");
    const faucetBalance = await bkc.balanceOf(addresses.faucet);
    if (faucetBalance < LIQUIDITY_CONFIG.FAUCET) {
        const needed = LIQUIDITY_CONFIG.FAUCET - faucetBalance;
        await sendTxWithRetry(
            async () => await bkc.transfer(addresses.faucet, needed),
            `Faucet: +${ethers.formatEther(needed)} BKC`
        );
    } else {
        console.log(`      ✅ Faucet já tem ${ethers.formatEther(faucetBalance)} BKC`);
    }

    // 5.2 Fortune Pool
    console.log("\n   🎰 Fortune Pool:");
    const fortuneBalance = await bkc.balanceOf(addresses.fortunePool);
    if (fortuneBalance < LIQUIDITY_CONFIG.FORTUNE_POOL) {
        const needed = LIQUIDITY_CONFIG.FORTUNE_POOL - fortuneBalance;
        await sendTxWithRetry(
            async () => await bkc.approve(addresses.fortunePool, needed),
            "Fortune: Aprovar BKC"
        );
        await sendTxWithRetry(
            async () => await fortunePool.fundPrizePool(needed),
            `Fortune: +${ethers.formatEther(needed)} BKC`
        );
    } else {
        console.log(`      ✅ Fortune já tem ${ethers.formatEther(fortuneBalance)} BKC`);
    }

    // 5.3 NFT Pools
    console.log("\n   🏊 NFT Liquidity Pools:");
    
    for (let i = 0; i < ALL_TIERS.length; i++) {
        const tier = ALL_TIERS[i];
        const targetNFTs = NFT_MINT_COUNT_PER_TIER[i];
        const poolKey = `pool_${tier.name.toLowerCase()}`;

        console.log(`\n      --- ${tier.name} (${targetNFTs} NFTs + ${ethers.formatEther(LIQUIDITY_CONFIG.NFT_POOL_EACH)} BKC) ---`);

        // Verificar/criar pool
        let poolAddress = addresses[poolKey];
        if (!poolAddress || !poolAddress.startsWith("0x")) {
            await sendTxWithRetry(
                async () => await factory.deployPool(tier.boostBips),
                `Deploy Pool ${tier.name}`
            );
            poolAddress = await factory.getPoolAddress(tier.boostBips);
            updateAddressJSON(poolKey, poolAddress);
            addresses[poolKey] = poolAddress;
            await sleep(DEPLOY_DELAY_MS);
        }

        const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, deployer);
        
        let poolNftCount = 0n;
        try {
            const poolInfo = await pool.getPoolInfo();
            poolNftCount = poolInfo[1];
        } catch (e) {
            // Pool may not have liquidity yet
        }

        if (poolNftCount > 0n) {
            console.log(`      ⏩ Pool já tem ${poolNftCount} NFTs. Pulando.`);
            continue;
        }

        // Buscar NFTs órfãos
        const orphanIds = await findOrphanNFTs(nft, deployer.address, tier.boostBips);
        let idsToDeposit: string[] = [...orphanIds];
        const currentCount = BigInt(idsToDeposit.length);
        const needed = targetNFTs > currentCount ? targetNFTs - currentCount : 0n;

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
            idsToDeposit = updatedIds.slice(0, Number(targetNFTs));
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

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 6: GENESIS STAKE
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n📈 PARTE 6: Genesis Stake");
    console.log("────────────────────────────────────────────────────────────────");

    const totalPStake = await delegationManager.totalNetworkPStake();
    if (totalPStake === 0n) {
        await sendTxWithRetry(
            async () => await bkc.approve(addresses.delegationManager, LIQUIDITY_CONFIG.GENESIS_STAKE_AMOUNT),
            "Aprovar stake"
        );
        try {
            await sendTxWithRetry(
                async () => await delegationManager.delegate(
                    LIQUIDITY_CONFIG.GENESIS_STAKE_AMOUNT,
                    BigInt(LIQUIDITY_CONFIG.GENESIS_STAKE_DAYS * 86400),
                    0
                ),
                `Genesis Stake: ${ethers.formatEther(LIQUIDITY_CONFIG.GENESIS_STAKE_AMOUNT)} BKC`
            );
        } catch (e: any) {
            console.log(`   ⚠️ Genesis Stake: ${e.message?.slice(0, 50)}`);
        }
    } else {
        console.log(`   ✅ Network já tem stake: ${ethers.formatEther(totalPStake)} pStake`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // RESUMO
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("                      📊 RESUMO FINAL V3.1");
    console.log("════════════════════════════════════════════════════════════════");

    const finalDeployerBalance = await bkc.balanceOf(deployer.address);
    const finalFaucetBalance = await bkc.balanceOf(addresses.faucet);
    const finalFortuneBalance = await bkc.balanceOf(addresses.fortunePool);

    console.log(`\n   💰 Saldos:`);
    console.log(`      Deployer:     ${ethers.formatEther(finalDeployerBalance)} BKC`);
    console.log(`      Faucet:       ${ethers.formatEther(finalFaucetBalance)} BKC`);
    console.log(`      Fortune Pool: ${ethers.formatEther(finalFortuneBalance)} BKC`);

    console.log("\n────────────────────────────────────────────────────────────────");
    console.log("   🎉 ECOSSISTEMA BACKCOIN V3.1 LANÇADO COM SUCESSO! 🎉");
    console.log("────────────────────────────────────────────────────────────────\n");
}

// Entry point
if (require.main === module) {
    runScript(require("hardhat")).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}