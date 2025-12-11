// scripts/3_launch_and_liquidate_ecosystem.ts
// ✅ VERSÃO V2.1 FINAL - TGE + Liquidez + Configuração Econômica
// ============================================================

import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { ContractTransactionReceipt } from "ethers";

// ============================================================
//                    CONFIGURAÇÃO GERAL
// ============================================================

const DEPLOY_DELAY_MS = 5000;
const CHUNK_SIZE = 50;
const CHUNK_SIZE_BIGINT = BigInt(CHUNK_SIZE);

// ============================================================
//                 TAXAS OFICIAIS V2.1
// ============================================================

const OFFICIAL_FEES_V2 = {
    DELEGATION_FEE_BIPS: 50n,            // 0.5%
    UNSTAKE_FEE_BIPS: 100n,              // 1%
    FORCE_UNSTAKE_PENALTY_BIPS: 5000n,   // 50%
    CLAIM_REWARD_FEE_BIPS: 100n,         // 1%
    NFT_POOL_BUY_TAX_BIPS: 500n,         // 5%
    NFT_POOL_SELL_TAX_BIPS: 1000n,       // 10%
    FORTUNE_POOL_SERVICE: 2000n,          // 20%
    RENTAL_MARKET_TAX_BIPS: 1000n,        // 10%
    NOTARY_SERVICE: ethers.parseEther("1") // 1 BKC
};

// ============================================================
//               DISTRIBUIÇÃO DE REWARDS V2.1
// ============================================================

const DISTRIBUTION_V2 = {
    mining: { TREASURY: 3000n, DELEGATOR_POOL: 7000n },
    fee: { TREASURY: 3000n, DELEGATOR_POOL: 7000n }
};

// ============================================================
//                 CONFIGURAÇÃO DE LIQUIDEZ
// ============================================================

const TGE_SUPPLY_AMOUNT = 40_000_000n * 10n**18n; // 40 Milhões BKC

const FORTUNE_POOL_LIQUIDITY = ethers.parseEther("1000000");   // 1 Milhão BKC
const FAUCET_LIQUIDITY = ethers.parseEther("4000000");         // 4 Milhões BKC
const LIQUIDITY_BKC_PER_POOL = ethers.parseEther("500000");    // 500 Mil BKC por Pool

const INITIAL_STAKE_AMOUNT = ethers.parseEther("1000");
const INITIAL_STAKE_DURATION = 365; // Dias

// NFTs por Tier para liquidez inicial
const NFT_MINT_COUNT_PER_TIER = [
    100n,   // Diamond
    200n,   // Platinum
    300n,   // Gold
    400n,   // Silver
    500n,   // Bronze
    600n,   // Iron
    1000n   // Crystal
];

// ============================================================
//               CONFIGURAÇÃO DO FORTUNE POOL
// ============================================================

const FORTUNE_POOL_PRIZE_TIERS = [
    { tierId: 1, range: 3, multiplierBips: 20000, name: "Fácil (1/3 - 2x)" },
    { tierId: 2, range: 10, multiplierBips: 50000, name: "Médio (1/10 - 5x)" },
    { tierId: 3, range: 100, multiplierBips: 1000000, name: "Difícil (1/100 - 100x)" }
];

// ============================================================
//                   TIERS DOS NFTs
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
    fs.writeFileSync(rulesFilePath, JSON.stringify(rules, null, 2));
}

// Send TX com retry
async function sendTxWithRetry(
    txFunction: () => Promise<any>,
    description: string,
    retries = 5
): Promise<ContractTransactionReceipt | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const tx = await txFunction();
            console.log(`   ⏳ ${description}...`);
            const receipt = await tx.wait();
            if (!receipt) throw new Error("Recibo nulo");
            console.log(`   ✅ ${description}`);
            await sleep(1000);
            return receipt as ContractTransactionReceipt;
        } catch (error: any) {
            const msg = error.message || JSON.stringify(error);
            
            if (msg.includes("already") || msg.includes("Already")) {
                console.log(`   ⚠️ Já realizado: ${description}`);
                return null;
            }
            
            if ((msg.includes("nonce") || msg.includes("429") || msg.includes("Too Many")) && i < retries - 1) {
                const waitTime = 3000 * (i + 1);
                console.warn(`   ⚠️ Erro temporário. Tentativa ${i + 1}/${retries}. Aguardando ${waitTime/1000}s...`);
                await sleep(waitTime);
            } else {
                throw error;
            }
        }
    }
    return null;
}

// Deploy Proxy com retry
async function deployProxyWithRetry(Factory: any, args: any[], retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const instance = await upgrades.deployProxy(Factory, args, { kind: "uups" });
            await instance.waitForDeployment();
            return instance;
        } catch (error: any) {
            const msg = error.message || "";
            if ((msg.includes("429") || msg.includes("Too Many")) && i < retries - 1) {
                const waitTime = DEPLOY_DELAY_MS * (i + 1);
                console.warn(`   ⚠️ Rate limit. Tentativa ${i + 1}/${retries}. Aguardando ${waitTime/1000}s...`);
                await sleep(waitTime);
            } else {
                throw error;
            }
        }
    }
    throw new Error("Falha no deploy após várias tentativas");
}

// Encontrar NFTs órfãos do deployer
async function findOrphanNFTs(nft: any, deployer: string, targetBoost: bigint): Promise<string[]> {
    console.log(`      🔍 Buscando NFTs órfãos...`);
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
    } catch (e) {
        console.warn("      ⚠️ Falha ao buscar eventos. Continuando sem órfãos.");
        return [];
    }
}

// Setar taxa se diferente
async function setFeeIfNeeded(hub: any, key: string, value: bigint) {
    const hash = ethers.id(key);
    const current = await hub.getFee(hash);
    if (current === value) {
        console.log(`      ⏩ ${key} já configurado`);
        return;
    }
    await sendTxWithRetry(
        async () => await hub.setServiceFee(hash, value),
        `Taxa ${key} → ${value}`
    );
    updateRulesJSON("serviceFees", key, value.toString());
}

// Setar distribuição se diferente
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
        `${section}.${poolKey} → ${value}`
    );
    updateRulesJSON(section, poolKey, value.toString());
}

// Configurar Prize Tiers do Fortune Pool
async function configureFortunePoolTiers(fortunePool: any): Promise<void> {
    console.log("\n🎰 Configurando Prize Tiers do Fortune Pool...");
    
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
            console.log(`   ⏩ Tier ${tier.tierId} já configurado`);
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

    console.log("════════════════════════════════════════════════════════");
    console.log("   🚀 BACKCOIN LAUNCH V2.1 - TGE & LIQUIDEZ");
    console.log("════════════════════════════════════════════════════════");
    console.log(`   📡 Rede: ${networkName}`);
    console.log(`   👷 Deployer: ${deployer.address}`);
    console.log("----------------------------------------------------\n");

    // Carregar endereços
    if (!fs.existsSync(addressesFilePath)) {
        throw new Error("❌ deployment-addresses.json não encontrado! Execute o script 1 primeiro.");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

    // Instanciar contratos
    const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, deployer);
    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
    const nft = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, deployer);
    const miningManager = await ethers.getContractAt("MiningManager", addresses.miningManager, deployer);
    const delegationManager = await ethers.getContractAt("DelegationManager", addresses.delegationManager, deployer);
    const fortunePool = await ethers.getContractAt("FortunePool", addresses.fortunePool, deployer);
    const factory = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, deployer);

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 1: VERIFICAR E ATUALIZAR WIRING
    // ═══════════════════════════════════════════════════════════════════

    console.log("🔌 PARTE 1: Verificando Conexões");
    console.log("----------------------------------------------------");

    // Atualizar Hub se necessário
    await sendTxWithRetry(
        async () => await hub.setAddresses(
            addresses.bkcToken,
            addresses.treasuryWallet || deployer.address,
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
    ];

    for (const m of miners) {
        if (m.addr && m.addr.startsWith("0x")) {
            const hash = ethers.id(m.key);
            const current = await miningManager.authorizedMiners(hash);
            if (current.toLowerCase() !== m.addr.toLowerCase()) {
                await sendTxWithRetry(
                    async () => await miningManager.setAuthorizedMiner(hash, m.addr),
                    `Autorizar: ${m.key}`
                );
            }
        }
    }

    // Transferir ownership do BKC se necessário
    try {
        const bkcOwner = await bkc.owner();
        if (bkcOwner.toLowerCase() === deployer.address.toLowerCase()) {
            await sendTxWithRetry(
                async () => await bkc.transferOwnership(addresses.miningManager),
                "Transferir ownership BKC → MiningManager"
            );
        }
    } catch (e) {
        console.log("   ⚠️ Owner do BKC já transferido");
    }

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 2: CONFIGURAR TAXAS V2.1
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n⚖️ PARTE 2: Configurando Taxas V2.1");
    console.log("----------------------------------------------------");

    // Taxas de serviço
    await setFeeIfNeeded(hub, "DELEGATION_FEE_BIPS", OFFICIAL_FEES_V2.DELEGATION_FEE_BIPS);
    await setFeeIfNeeded(hub, "UNSTAKE_FEE_BIPS", OFFICIAL_FEES_V2.UNSTAKE_FEE_BIPS);
    await setFeeIfNeeded(hub, "FORCE_UNSTAKE_PENALTY_BIPS", OFFICIAL_FEES_V2.FORCE_UNSTAKE_PENALTY_BIPS);
    await setFeeIfNeeded(hub, "CLAIM_REWARD_FEE_BIPS", OFFICIAL_FEES_V2.CLAIM_REWARD_FEE_BIPS);
    await setFeeIfNeeded(hub, "NFT_POOL_BUY_TAX_BIPS", OFFICIAL_FEES_V2.NFT_POOL_BUY_TAX_BIPS);
    await setFeeIfNeeded(hub, "NFT_POOL_SELL_TAX_BIPS", OFFICIAL_FEES_V2.NFT_POOL_SELL_TAX_BIPS);
    await setFeeIfNeeded(hub, "FORTUNE_POOL_SERVICE", OFFICIAL_FEES_V2.FORTUNE_POOL_SERVICE);
    await setFeeIfNeeded(hub, "RENTAL_MARKET_TAX_BIPS", OFFICIAL_FEES_V2.RENTAL_MARKET_TAX_BIPS);
    await setFeeIfNeeded(hub, "NOTARY_SERVICE", OFFICIAL_FEES_V2.NOTARY_SERVICE);

    // Distribuição Mining (30/70)
    await setDistributionIfNeeded(hub, "setMiningDistributionBips", "TREASURY", DISTRIBUTION_V2.mining.TREASURY, "miningDistribution");
    await setDistributionIfNeeded(hub, "setMiningDistributionBips", "DELEGATOR_POOL", DISTRIBUTION_V2.mining.DELEGATOR_POOL, "miningDistribution");

    // Distribuição Fee (30/70)
    await setDistributionIfNeeded(hub, "setFeeDistributionBips", "TREASURY", DISTRIBUTION_V2.fee.TREASURY, "feeDistribution");
    await setDistributionIfNeeded(hub, "setFeeDistributionBips", "DELEGATOR_POOL", DISTRIBUTION_V2.fee.DELEGATOR_POOL, "feeDistribution");

    console.log("   ✅ Taxas V2.1 configuradas");

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 3: TGE (TOKEN GENERATION EVENT)
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n💰 PARTE 3: TGE (Token Generation Event)");
    console.log("----------------------------------------------------");

    try {
        const totalSupply = await bkc.totalSupply();
        if (totalSupply < TGE_SUPPLY_AMOUNT) {
            console.log(`   🪙 Executando TGE: Mintando 40M BKC para Deployer...`);
            await sendTxWithRetry(
                async () => await miningManager.executeTGE(deployer.address, TGE_SUPPLY_AMOUNT),
                "TGE: Mint 40M BKC"
            );
        } else {
            console.log("   ✅ TGE já realizado anteriormente");
        }
    } catch (e: any) {
        console.log(`   ⚠️ TGE: ${e.message}`);
    }

    const deployerBalance = await bkc.balanceOf(deployer.address);
    console.log(`   💰 Saldo Deployer: ${ethers.formatEther(deployerBalance)} BKC`);

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 4: CONFIGURAR FORTUNE POOL
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n🎰 PARTE 4: Configurando Fortune Pool");
    console.log("----------------------------------------------------");

    // Configurar Oracle
    const currentOracle = await fortunePool.oracleAddress();
    if (currentOracle.toLowerCase() !== addresses.oracleWalletAddress.toLowerCase()) {
        await sendTxWithRetry(
            async () => await fortunePool.setOracle(addresses.oracleWalletAddress),
            "Fortune: Configurar Oracle"
        );
    }

    // Configurar Oracle Fee (0 para testnet)
    const oracleFee = await fortunePool.oracleFee();
    if (oracleFee > 0n) {
        await sendTxWithRetry(
            async () => await fortunePool.setOracleFee(0n),
            "Fortune: Oracle Fee = 0"
        );
    }

    // Configurar Prize Tiers
    await configureFortunePoolTiers(fortunePool);

    // ═══════════════════════════════════════════════════════════════════
    // PARTE 5: INJETAR LIQUIDEZ
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n💧 PARTE 5: Injetando Liquidez");
    console.log("----------------------------------------------------");

    // 5.1 Faucet (4M BKC)
    console.log("\n   🚰 Faucet:");
    const faucetBalance = await bkc.balanceOf(addresses.faucet);
    if (faucetBalance < FAUCET_LIQUIDITY) {
        const needed = FAUCET_LIQUIDITY - faucetBalance;
        const currentBalance = await bkc.balanceOf(deployer.address);
        if (currentBalance >= needed) {
            await sendTxWithRetry(
                async () => await bkc.transfer(addresses.faucet, needed),
                `Faucet: +${ethers.formatEther(needed)} BKC`
            );
        } else {
            console.warn("   ⚠️ Saldo insuficiente para Faucet");
        }
    } else {
        console.log(`      ✅ Faucet já tem ${ethers.formatEther(faucetBalance)} BKC`);
    }

    // 5.2 Fortune Pool (1M BKC)
    console.log("\n   🎰 Fortune Pool:");
    const fortuneBalance = await bkc.balanceOf(addresses.fortunePool);
    if (fortuneBalance < FORTUNE_POOL_LIQUIDITY) {
        const needed = FORTUNE_POOL_LIQUIDITY - fortuneBalance;
        await sendTxWithRetry(
            async () => await bkc.approve(addresses.fortunePool, needed),
            "Fortune: Aprovar BKC"
        );
        await sendTxWithRetry(
            async () => await fortunePool.fundPrizePool(needed),
            `Fortune: +${ethers.formatEther(needed)} BKC`
        );
    } else {
        console.log(`      ✅ Fortune Pool já tem ${ethers.formatEther(fortuneBalance)} BKC`);
    }

    // 5.3 NFT Pools (500k BKC + NFTs cada)
    console.log("\n   🏊 NFT Liquidity Pools:");
    
    for (let i = 0; i < ALL_TIERS.length; i++) {
        const tier = ALL_TIERS[i];
        const targetNFTs = NFT_MINT_COUNT_PER_TIER[i];
        const poolKey = `pool_${tier.name.toLowerCase()}`;

        console.log(`\n      --- ${tier.name} (${targetNFTs} NFTs + 500k BKC) ---`);

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
        const poolInfo = await pool.getPoolInfo();
        const poolNftCount = poolInfo[1];

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
                await sleep(1000);
            }
            
            // Re-buscar IDs
            const updatedIds = await findOrphanNFTs(nft, deployer.address, tier.boostBips);
            idsToDeposit = updatedIds.slice(0, Number(targetNFTs));
        }

        // Depositar liquidez
        if (idsToDeposit.length > 0) {
            console.log(`      📥 Depositando ${idsToDeposit.length} NFTs + 500k BKC...`);

            // Aprovar
            await sendTxWithRetry(
                async () => await bkc.approve(poolAddress, LIQUIDITY_BKC_PER_POOL),
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
                        async () => await pool.addInitialLiquidity(chunk, LIQUIDITY_BKC_PER_POOL),
                        "Liquidez Inicial"
                    );
                    isFirst = false;
                } else {
                    await sendTxWithRetry(
                        async () => await pool.addMoreNFTsToPool(chunk),
                        `+${chunk.length} NFTs`
                    );
                }
                await sleep(1000);
            }

            // Revogar aprovação
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
    console.log("----------------------------------------------------");

    const totalPStake = await delegationManager.totalNetworkPStake();
    if (totalPStake === 0n) {
        await sendTxWithRetry(
            async () => await bkc.approve(addresses.delegationManager, INITIAL_STAKE_AMOUNT),
            "Aprovar stake"
        );
        try {
            await sendTxWithRetry(
                async () => await delegationManager.delegate(
                    INITIAL_STAKE_AMOUNT,
                    BigInt(INITIAL_STAKE_DURATION * 86400),
                    0
                ),
                `Genesis Stake: ${ethers.formatEther(INITIAL_STAKE_AMOUNT)} BKC por ${INITIAL_STAKE_DURATION} dias`
            );
        } catch (e: any) {
            console.error("   ❌ Erro no Genesis Stake:", e.message);
        }
    } else {
        console.log(`   ✅ Network já tem stake: ${ethers.formatEther(totalPStake)} pStake`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // RESUMO FINAL
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n════════════════════════════════════════════════════════");
    console.log("              📊 RESUMO FINAL");
    console.log("════════════════════════════════════════════════════════");

    const finalDeployerBalance = await bkc.balanceOf(deployer.address);
    const finalFaucetBalance = await bkc.balanceOf(addresses.faucet);
    const finalFortuneBalance = await bkc.balanceOf(addresses.fortunePool);
    const finalPStake = await delegationManager.totalNetworkPStake();

    console.log(`\n   💰 Saldo Deployer:     ${ethers.formatEther(finalDeployerBalance)} BKC`);
    console.log(`   🚰 Saldo Faucet:       ${ethers.formatEther(finalFaucetBalance)} BKC`);
    console.log(`   🎰 Saldo Fortune Pool: ${ethers.formatEther(finalFortuneBalance)} BKC`);
    console.log(`   📈 Total pStake:       ${ethers.formatEther(finalPStake)}`);

    console.log("\n   💰 TAXAS V2.1 ATIVAS:");
    console.log("   ────────────────────────────────");
    console.log("   Staking Entry:      0.5%");
    console.log("   Unstaking:          1%");
    console.log("   Force Unstake:      50%");
    console.log("   Claim Reward:       1%");
    console.log("   NFT Buy:            5%");
    console.log("   NFT Sell:           10%");
    console.log("   Fortune Pool:       20%");
    console.log("   Rental:             10%");
    console.log("   Notary:             1 BKC");

    console.log("\n   📊 DISTRIBUIÇÃO:");
    console.log("   ────────────────────────────────");
    console.log("   Mining:  30% Treasury / 70% Stakers");
    console.log("   Fees:    30% Treasury / 70% Stakers");

    console.log("\n────────────────────────────────────────────────────────");
    console.log("   🎉🎉🎉 ECOSSISTEMA LANÇADO COM SUCESSO! 🎉🎉🎉");
    console.log("────────────────────────────────────────────────────────\n");
}

// Entry point
if (require.main === module) {
    runScript(require("hardhat")).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}