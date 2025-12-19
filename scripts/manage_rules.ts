// scripts/manage_rules.ts
// ✅ VERSÃO V4.0 - Gerenciador Completo de Regras do Ecossistema Backcoin
// ============================================================
// Permite configurar TODAS as regras atualizáveis do sistema:
// - EcosystemManager: Taxas, Distribuições, Boosters, Endereços
// - FortunePool: Oracle, Game Fee, Prize Tiers
// - Faucet: Amounts, Cooldown, Relayer
// - RentalManager: Pausado, Duração Global
// - PublicSale: Tiers, Preços, Whitelist
// - MiningManager: Authorized Miners
// ============================================================

import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

// ============================================================
//                    CONFIGURAÇÃO
// ============================================================

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const TX_DELAY = 1000;
const IGNORE_KEYS = ["DESCRIPTION", "COMMENT", "SUMMARY", "VERSION", "NETWORK", "CREATED_AT", "LAST_UPDATED"];

// ============================================================
//                    TIPOS
// ============================================================

interface RulesConfig {
    VERSION?: string;
    
    // EcosystemManager
    serviceFeesBIPS?: Record<string, string>;
    serviceFeesBKC?: Record<string, string>;
    miningDistribution?: Record<string, string>;
    feeDistribution?: Record<string, string>;
    boosterDiscounts?: Record<string, string>;
    
    // FortunePool
    fortunePoolConfig?: {
        ORACLE_ADDRESS?: string;
        ORACLE_FEE_WEI?: string;
        GAME_FEE_BIPS?: string;
    };
    fortunePoolTiers?: Record<string, string>;
    
    // Faucet
    faucetConfig?: {
        RELAYER_ADDRESS?: string;
        TOKENS_PER_REQUEST_BKC?: string;
        ETH_PER_REQUEST_WEI?: string;
        COOLDOWN_SECONDS?: string;
        PAUSED?: string;
    };
    
    // RentalManager
    rentalConfig?: {
        PAUSED?: string;
        GLOBAL_DURATION_HOURS?: string;
    };
    
    // PublicSale
    publicSaleConfig?: {
        PAUSED?: string;
        WHITELIST_ENABLED?: string;
        AUTO_WITHDRAW?: string;
        START_TIME?: string;
        END_TIME?: string;
    };
    publicSaleTiers?: Record<string, {
        priceETH?: string;
        boostBips?: string;
        maxSupply?: string;
        maxPerWallet?: string;
        active?: string;
    }>;
    
    // System Wallets
    wallets?: {
        ORACLE_ADDRESS?: string;
        TREASURY_ADDRESS?: string;
    };
    
    // Authorized Miners
    authorizedMiners?: Record<string, string>;
}

// ============================================================
//                    FUNÇÕES AUXILIARES
// ============================================================

function shouldSkipKey(key: string): boolean {
    return IGNORE_KEYS.includes(key.toUpperCase()) || key.startsWith("_");
}

async function sendTx(
    txPromise: Promise<any>,
    description: string
): Promise<boolean> {
    try {
        console.log(`   ⏳ ${description}...`);
        const tx = await txPromise;
        await tx.wait();
        console.log(`   ✅ ${description}`);
        await sleep(TX_DELAY);
        return true;
    } catch (e: any) {
        const msg = e.message || "";
        if (msg.includes("already") || msg.includes("unchanged")) {
            console.log(`   ⏩ ${description} (já configurado)`);
            return true;
        }
        console.error(`   ❌ ${description}: ${msg.slice(0, 80)}`);
        return false;
    }
}

// ============================================================
//               PROCESSADORES DE REGRAS
// ============================================================

/**
 * Processa taxas em BIPS (EcosystemManager)
 */
async function processServiceFeesBips(hub: any, rules: Record<string, string>) {
    console.log("\n📊 [FEES-BIPS] Taxas em BIPS (100 = 1%):");
    
    for (const [key, value] of Object.entries(rules)) {
        if (shouldSkipKey(key)) continue;
        
        const keyHash = ethers.id(key);
        const valueBigInt = BigInt(value);
        
        const current = await hub.getFee(keyHash);
        if (current === valueBigInt) {
            console.log(`   ⏩ ${key} = ${value} (${Number(value)/100}%) - já configurado`);
            continue;
        }
        
        await sendTx(
            hub.setServiceFee(keyHash, valueBigInt),
            `${key} → ${value} bips (${Number(value)/100}%)`
        );
    }
}

/**
 * Processa taxas em BKC (EcosystemManager)
 */
async function processServiceFeesBkc(hub: any, rules: Record<string, string>) {
    console.log("\n💰 [FEES-BKC] Taxas em BKC:");
    
    for (const [key, value] of Object.entries(rules)) {
        if (shouldSkipKey(key)) continue;
        
        const keyHash = ethers.id(key);
        const valueBigInt = ethers.parseEther(value);
        
        const current = await hub.getFee(keyHash);
        if (current === valueBigInt) {
            console.log(`   ⏩ ${key} = ${value} BKC - já configurado`);
            continue;
        }
        
        await sendTx(
            hub.setServiceFee(keyHash, valueBigInt),
            `${key} → ${value} BKC`
        );
    }
}

/**
 * Processa distribuição de mining (EcosystemManager)
 */
async function processMiningDistribution(hub: any, rules: Record<string, string>) {
    console.log("\n⛏️ [MINING] Distribuição de Mining:");
    
    for (const [key, value] of Object.entries(rules)) {
        if (shouldSkipKey(key)) continue;
        
        const keyHash = ethers.keccak256(ethers.toUtf8Bytes(key));
        const valueBigInt = BigInt(value);
        
        const current = await hub.getMiningDistributionBips(keyHash);
        if (current === valueBigInt) {
            console.log(`   ⏩ ${key} = ${value} bips (${Number(value)/100}%) - já configurado`);
            continue;
        }
        
        await sendTx(
            hub.setMiningDistributionBips(keyHash, valueBigInt),
            `${key} → ${value} bips (${Number(value)/100}%)`
        );
    }
}

/**
 * Processa distribuição de fees (EcosystemManager)
 */
async function processFeeDistribution(hub: any, rules: Record<string, string>) {
    console.log("\n💵 [FEES] Distribuição de Fees:");
    
    for (const [key, value] of Object.entries(rules)) {
        if (shouldSkipKey(key)) continue;
        
        const keyHash = ethers.keccak256(ethers.toUtf8Bytes(key));
        const valueBigInt = BigInt(value);
        
        const current = await hub.getFeeDistributionBips(keyHash);
        if (current === valueBigInt) {
            console.log(`   ⏩ ${key} = ${value} bips (${Number(value)/100}%) - já configurado`);
            continue;
        }
        
        await sendTx(
            hub.setFeeDistributionBips(keyHash, valueBigInt),
            `${key} → ${value} bips (${Number(value)/100}%)`
        );
    }
}

/**
 * Processa descontos de booster (EcosystemManager)
 */
async function processBoosterDiscounts(hub: any, rules: Record<string, string>) {
    console.log("\n⭐ [BOOSTERS] Descontos por Booster:");
    
    for (const [boostBips, discountBips] of Object.entries(rules)) {
        if (shouldSkipKey(boostBips)) continue;
        
        const boostValue = BigInt(boostBips);
        const discountValue = BigInt(discountBips);
        
        const current = await hub.getBoosterDiscount(boostValue);
        if (current === discountValue) {
            console.log(`   ⏩ Boost ${boostBips} → ${Number(discountBips)/100}% desconto - já configurado`);
            continue;
        }
        
        await sendTx(
            hub.setBoosterDiscount(boostValue, discountValue),
            `Boost ${boostBips} → ${Number(discountBips)/100}% desconto`
        );
    }
}

/**
 * Processa configuração do FortunePool
 */
async function processFortunePoolConfig(fortunePool: any, config: any) {
    console.log("\n🎰 [FORTUNE] Configurações do Fortune Pool:");
    
    // Oracle Address
    if (config.ORACLE_ADDRESS) {
        const current = await fortunePool.oracleAddress();
        if (current.toLowerCase() !== config.ORACLE_ADDRESS.toLowerCase()) {
            await sendTx(
                fortunePool.setOracle(config.ORACLE_ADDRESS),
                `Oracle → ${config.ORACLE_ADDRESS.slice(0, 10)}...`
            );
        } else {
            console.log(`   ⏩ Oracle já configurado`);
        }
    }
    
    // Oracle Fee
    if (config.ORACLE_FEE_WEI !== undefined) {
        const feeValue = BigInt(config.ORACLE_FEE_WEI);
        const current = await fortunePool.oracleFee();
        if (current !== feeValue) {
            await sendTx(
                fortunePool.setOracleFee(feeValue),
                `Oracle Fee → ${ethers.formatEther(feeValue)} ETH`
            );
        } else {
            console.log(`   ⏩ Oracle Fee já configurado`);
        }
    }
    
    // Game Fee
    if (config.GAME_FEE_BIPS) {
        const feeValue = BigInt(config.GAME_FEE_BIPS);
        const current = await fortunePool.gameFeeBips();
        if (current !== feeValue) {
            await sendTx(
                fortunePool.setGameFee(feeValue),
                `Game Fee → ${Number(feeValue)/100}%`
            );
        } else {
            console.log(`   ⏩ Game Fee já configurado`);
        }
    }
}

/**
 * Processa Prize Tiers do FortunePool
 */
async function processFortunePoolTiers(fortunePool: any, tiers: Record<string, string>) {
    console.log("\n🎯 [FORTUNE] Prize Tiers:");
    
    for (const [tierIdStr, valueStr] of Object.entries(tiers)) {
        if (shouldSkipKey(tierIdStr)) continue;
        if (!valueStr.includes(",")) continue;
        
        const [rangeStr, multiplierStr] = valueStr.split(",");
        const tierId = BigInt(tierIdStr);
        const range = BigInt(rangeStr.trim());
        const multiplier = BigInt(multiplierStr.trim());
        
        try {
            const current = await fortunePool.prizeTiers(tierId);
            if (
                BigInt(current.maxRange) === range &&
                BigInt(current.multiplierBips) === multiplier &&
                current.active
            ) {
                console.log(`   ⏩ Tier ${tierId}: Range 1-${range}, ${Number(multiplier)/10000}x - já configurado`);
                continue;
            }
        } catch (e) {
            // Tier não existe, precisa criar
        }
        
        await sendTx(
            fortunePool.configureTier(tierId, range, multiplier),
            `Tier ${tierId}: Range 1-${range}, ${Number(multiplier)/10000}x`
        );
    }
}

/**
 * Processa configuração do Faucet
 */
async function processFaucetConfig(faucet: any, config: any) {
    console.log("\n🚰 [FAUCET] Configurações:");
    
    // Relayer
    if (config.RELAYER_ADDRESS) {
        const current = await faucet.relayerAddress();
        if (current.toLowerCase() !== config.RELAYER_ADDRESS.toLowerCase()) {
            await sendTx(
                faucet.setRelayer(config.RELAYER_ADDRESS),
                `Relayer → ${config.RELAYER_ADDRESS.slice(0, 10)}...`
            );
        } else {
            console.log(`   ⏩ Relayer já configurado`);
        }
    }
    
    // Amounts (tokens + ETH)
    if (config.TOKENS_PER_REQUEST_BKC && config.ETH_PER_REQUEST_WEI) {
        const tokensAmount = ethers.parseEther(config.TOKENS_PER_REQUEST_BKC);
        const ethAmount = BigInt(config.ETH_PER_REQUEST_WEI);
        
        const currentTokens = await faucet.tokensPerRequest();
        const currentEth = await faucet.ethPerRequest();
        
        if (currentTokens !== tokensAmount || currentEth !== ethAmount) {
            await sendTx(
                faucet.setAmounts(tokensAmount, ethAmount),
                `Amounts → ${config.TOKENS_PER_REQUEST_BKC} BKC + ${ethers.formatEther(ethAmount)} ETH`
            );
        } else {
            console.log(`   ⏩ Amounts já configurados`);
        }
    }
    
    // Cooldown
    if (config.COOLDOWN_SECONDS) {
        const cooldown = BigInt(config.COOLDOWN_SECONDS);
        const current = await faucet.cooldownPeriod();
        if (current !== cooldown) {
            await sendTx(
                faucet.setCooldown(cooldown),
                `Cooldown → ${Number(cooldown)/3600}h`
            );
        } else {
            console.log(`   ⏩ Cooldown já configurado`);
        }
    }
    
    // Paused
    if (config.PAUSED !== undefined) {
        const shouldBePaused = config.PAUSED === "true";
        const current = await faucet.paused();
        if (current !== shouldBePaused) {
            await sendTx(
                faucet.setPaused(shouldBePaused),
                `Paused → ${shouldBePaused}`
            );
        }
    }
}

/**
 * Processa configuração do RentalManager
 */
async function processRentalConfig(rental: any, config: any) {
    console.log("\n🏠 [RENTAL] Configurações:");
    
    // Paused
    if (config.PAUSED !== undefined) {
        const shouldBePaused = config.PAUSED === "true";
        const current = await rental.paused();
        if (current !== shouldBePaused) {
            await sendTx(
                rental.setPaused(shouldBePaused),
                `Paused → ${shouldBePaused}`
            );
        } else {
            console.log(`   ⏩ Paused = ${current}`);
        }
    }
    
    // Global Duration
    if (config.GLOBAL_DURATION_HOURS) {
        const duration = BigInt(config.GLOBAL_DURATION_HOURS) * 3600n;
        const current = await rental.globalRentalDuration();
        if (current !== duration) {
            await sendTx(
                rental.setGlobalRentalDuration(duration),
                `Global Duration → ${config.GLOBAL_DURATION_HOURS}h`
            );
        } else {
            console.log(`   ⏩ Global Duration já configurado`);
        }
    }
}

/**
 * Processa configuração do PublicSale
 */
async function processPublicSaleConfig(publicSale: any, config: any) {
    console.log("\n🛒 [SALE] Configurações do Public Sale:");
    
    // Paused
    if (config.PAUSED !== undefined) {
        const shouldBePaused = config.PAUSED === "true";
        const current = await publicSale.paused();
        if (current !== shouldBePaused) {
            await sendTx(
                publicSale.setPaused(shouldBePaused),
                `Paused → ${shouldBePaused}`
            );
        }
    }
    
    // Whitelist
    if (config.WHITELIST_ENABLED !== undefined) {
        const enabled = config.WHITELIST_ENABLED === "true";
        const current = await publicSale.whitelistEnabled();
        if (current !== enabled) {
            await sendTx(
                publicSale.setWhitelistEnabled(enabled),
                `Whitelist → ${enabled}`
            );
        }
    }
    
    // Auto Withdraw
    if (config.AUTO_WITHDRAW !== undefined) {
        const enabled = config.AUTO_WITHDRAW === "true";
        const current = await publicSale.autoWithdraw();
        if (current !== enabled) {
            await sendTx(
                publicSale.setAutoWithdraw(enabled),
                `Auto Withdraw → ${enabled}`
            );
        }
    }
    
    // Sale Times
    if (config.START_TIME && config.END_TIME) {
        const startTime = BigInt(config.START_TIME);
        const endTime = BigInt(config.END_TIME);
        await sendTx(
            publicSale.setSaleTimes(startTime, endTime),
            `Sale Times → ${startTime} - ${endTime}`
        );
    }
}

/**
 * Processa tiers do PublicSale
 */
async function processPublicSaleTiers(publicSale: any, tiers: Record<string, any>) {
    console.log("\n🎨 [SALE] NFT Tiers:");
    
    for (const [tierIdStr, tierConfig] of Object.entries(tiers)) {
        if (shouldSkipKey(tierIdStr)) continue;
        
        const tierId = BigInt(tierIdStr);
        
        // Update price
        if (tierConfig.priceETH) {
            const price = ethers.parseEther(tierConfig.priceETH);
            try {
                const current = await publicSale.tiers(tierId);
                if (current.priceInWei !== price) {
                    await sendTx(
                        publicSale.updateTierPrice(tierId, price),
                        `Tier ${tierId} price → ${tierConfig.priceETH} ETH`
                    );
                }
            } catch (e) {
                console.log(`   ⚠️ Tier ${tierId} não existe`);
            }
        }
        
        // Update active status
        if (tierConfig.active !== undefined) {
            const isActive = tierConfig.active === "true";
            await sendTx(
                publicSale.setTierActive(tierId, isActive),
                `Tier ${tierId} active → ${isActive}`
            );
        }
        
        // Update max per wallet
        if (tierConfig.maxPerWallet) {
            await sendTx(
                publicSale.setMaxPerWallet(tierId, BigInt(tierConfig.maxPerWallet)),
                `Tier ${tierId} maxPerWallet → ${tierConfig.maxPerWallet}`
            );
        }
    }
}

/**
 * Processa Authorized Miners
 */
async function processAuthorizedMiners(miningManager: any, miners: Record<string, string>, addresses: any) {
    console.log("\n⚙️ [MINING] Authorized Miners:");
    
    for (const [key, contractKey] of Object.entries(miners)) {
        if (shouldSkipKey(key)) continue;
        
        const contractAddress = addresses[contractKey];
        if (!contractAddress || !contractAddress.startsWith("0x")) {
            console.log(`   ⚠️ ${key}: Endereço não encontrado para ${contractKey}`);
            continue;
        }
        
        const keyHash = ethers.id(key);
        const current = await miningManager.authorizedMiners(keyHash);
        
        if (current.toLowerCase() === contractAddress.toLowerCase()) {
            console.log(`   ⏩ ${key} → ${contractKey} - já autorizado`);
            continue;
        }
        
        await sendTx(
            miningManager.setAuthorizedMiner(keyHash, contractAddress),
            `${key} → ${contractAddress.slice(0, 10)}...`
        );
    }
}

/**
 * Atualiza carteiras do sistema (Treasury/Oracle)
 */
async function processSystemWallets(hub: any, wallets: any, addresses: any) {
    console.log("\n🔐 [WALLETS] Carteiras do Sistema:");
    
    if (wallets.TREASURY_ADDRESS) {
        const current = await hub.treasuryWallet();
        if (current.toLowerCase() !== wallets.TREASURY_ADDRESS.toLowerCase()) {
            await sendTx(
                hub.setAddress("treasury", wallets.TREASURY_ADDRESS),
                `Treasury → ${wallets.TREASURY_ADDRESS.slice(0, 10)}...`
            );
        } else {
            console.log(`   ⏩ Treasury já configurado`);
        }
    }
}

// ============================================================
//                    SCRIPT PRINCIPAL
// ============================================================

export async function runScript(hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    console.log("════════════════════════════════════════════════════════════════");
    console.log("        🎛️ BACKCOIN RULES MANAGER V4.0");
    console.log("════════════════════════════════════════════════════════════════");
    console.log(`   📡 Network: ${networkName}`);
    console.log(`   👷 Account: ${deployer.address}`);
    console.log("────────────────────────────────────────────────────────────────");

    // --- Load Addresses ---
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error("❌ deployment-addresses.json não encontrado!");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    // --- Load Rules ---
    const rulesPath = path.join(__dirname, "../rules-config.json");
    if (!fs.existsSync(rulesPath)) {
        throw new Error("❌ rules-config.json não encontrado!");
    }
    const RULES: RulesConfig = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
    
    console.log(`\n   📋 Config Version: ${RULES.VERSION || "unknown"}`);

    // --- Connect to Contracts ---
    console.log("\n🔌 Conectando aos contratos...");
    
    const hub = addresses.ecosystemManager 
        ? await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, deployer)
        : null;
    
    const fortunePool = addresses.fortunePool
        ? await ethers.getContractAt("FortunePool", addresses.fortunePool, deployer)
        : null;
    
    const faucet = addresses.faucet
        ? await ethers.getContractAt("SimpleBKCFaucet", addresses.faucet, deployer)
        : null;
    
    const rental = addresses.rentalManager
        ? await ethers.getContractAt("RentalManager", addresses.rentalManager, deployer)
        : null;
    
    const publicSale = addresses.publicSale
        ? await ethers.getContractAt("PublicSale", addresses.publicSale, deployer)
        : null;
    
    const miningManager = addresses.miningManager
        ? await ethers.getContractAt("MiningManager", addresses.miningManager, deployer)
        : null;

    console.log(`   Hub: ${addresses.ecosystemManager || "❌"}`);
    console.log(`   FortunePool: ${addresses.fortunePool || "❌"}`);
    console.log(`   Faucet: ${addresses.faucet || "❌"}`);
    console.log(`   Rental: ${addresses.rentalManager || "❌"}`);
    console.log(`   PublicSale: ${addresses.publicSale || "❌"}`);
    console.log(`   MiningManager: ${addresses.miningManager || "❌"}`);

    // --- Apply Rules ---
    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("                    APLICANDO REGRAS");
    console.log("════════════════════════════════════════════════════════════════");

    // 1. EcosystemManager - Service Fees (BIPS)
    if (hub && RULES.serviceFeesBIPS) {
        await processServiceFeesBips(hub, RULES.serviceFeesBIPS);
    }

    // 2. EcosystemManager - Service Fees (BKC)
    if (hub && RULES.serviceFeesBKC) {
        await processServiceFeesBkc(hub, RULES.serviceFeesBKC);
    }

    // 3. EcosystemManager - Mining Distribution
    if (hub && RULES.miningDistribution) {
        await processMiningDistribution(hub, RULES.miningDistribution);
    }

    // 4. EcosystemManager - Fee Distribution
    if (hub && RULES.feeDistribution) {
        await processFeeDistribution(hub, RULES.feeDistribution);
    }

    // 5. EcosystemManager - Booster Discounts
    if (hub && RULES.boosterDiscounts) {
        await processBoosterDiscounts(hub, RULES.boosterDiscounts);
    }

    // 6. System Wallets (Treasury)
    if (hub && RULES.wallets) {
        await processSystemWallets(hub, RULES.wallets, addresses);
    }

    // 7. FortunePool Config
    if (fortunePool && RULES.fortunePoolConfig) {
        await processFortunePoolConfig(fortunePool, RULES.fortunePoolConfig);
    }

    // 8. FortunePool Tiers
    if (fortunePool && RULES.fortunePoolTiers) {
        await processFortunePoolTiers(fortunePool, RULES.fortunePoolTiers);
    }

    // 9. Faucet Config
    if (faucet && RULES.faucetConfig) {
        await processFaucetConfig(faucet, RULES.faucetConfig);
    }

    // 10. Rental Config
    if (rental && RULES.rentalConfig) {
        await processRentalConfig(rental, RULES.rentalConfig);
    }

    // 11. PublicSale Config
    if (publicSale && RULES.publicSaleConfig) {
        await processPublicSaleConfig(publicSale, RULES.publicSaleConfig);
    }

    // 12. PublicSale Tiers
    if (publicSale && RULES.publicSaleTiers) {
        await processPublicSaleTiers(publicSale, RULES.publicSaleTiers);
    }

    // 13. Authorized Miners
    if (miningManager && RULES.authorizedMiners) {
        await processAuthorizedMiners(miningManager, RULES.authorizedMiners, addresses);
    }

    // --- Summary ---
    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("                    ✅ CONCLUÍDO");
    console.log("════════════════════════════════════════════════════════════════");
    
    console.log("\n📋 Resumo das configurações aplicadas:");
    
    if (RULES.serviceFeesBIPS) {
        console.log("\n   Taxas BIPS:");
        for (const [key, value] of Object.entries(RULES.serviceFeesBIPS)) {
            if (!shouldSkipKey(key)) {
                console.log(`      ${key}: ${value} (${Number(value)/100}%)`);
            }
        }
    }
    
    if (RULES.serviceFeesBKC) {
        console.log("\n   Taxas BKC:");
        for (const [key, value] of Object.entries(RULES.serviceFeesBKC)) {
            if (!shouldSkipKey(key)) {
                console.log(`      ${key}: ${value} BKC`);
            }
        }
    }
    
    if (RULES.wallets) {
        console.log("\n   Carteiras:");
        console.log(`      Treasury: ${RULES.wallets.TREASURY_ADDRESS || "não configurado"}`);
        console.log(`      Oracle: ${RULES.wallets.ORACLE_ADDRESS || "não configurado"}`);
    }

    console.log("\n────────────────────────────────────────────────────────────────");
    console.log("   🎉 Todas as regras foram aplicadas com sucesso!");
    console.log("────────────────────────────────────────────────────────────────\n");
}

// Entry point
if (require.main === module) {
    runScript(require("hardhat")).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}