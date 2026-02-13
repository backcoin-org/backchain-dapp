// scripts/deploy_ecosystem.ts
// ════════════════════════════════════════════════════════════════════════════
// 🚀 BACKCHAIN ECOSYSTEM - DEPLOY COMPLETO V10.0 (IMUTÁVEL)
// ════════════════════════════════════════════════════════════════════════════
//
// V10.0: TODOS os contratos são imutáveis (sem UUPS proxy).
// - BKCToken: deployer-controlled minter, TGE mint no constructor
// - BackchainEcosystem: registerModule() / registerModuleBatch()
// - LiquidityPool: AMM constant-product (novo)
// - StakingPool: substitui DelegationManager
// - BuybackMiner: substitui MiningManager
// - RewardBooster: substitui RewardBoosterNFT (mintBatch + configurePools)
// - NFTPool: substitui NFTLiquidityPool+Factory (deploy direto, initializePool)
// - FortunePool, Agora, Notary, CharityPool, RentalManager: imutáveis
// - SimpleBKCFaucet: testnet
// - BackchainGovernance: timelock + fases progressivas
//
// ════════════════════════════════════════════════════════════════════════════

import { ContractTransactionReceipt } from "ethers";
import fs from "fs";
import path from "path";

// ════════════════════════════════════════════════════════════════════════════
//                    📝 TRANSACTION LOG STRUCTURE
// ════════════════════════════════════════════════════════════════════════════

interface TransactionLogEntry {
    phase: string;
    description: string;
    txHash: string;
    from: string;
    to: string;
    gasUsed: string;
    gasPrice?: string;
    blockNumber: number;
    timestamp: string;
    status: "success" | "failed" | "skipped";
    error?: string;
}

interface DeployLogEntry {
    contractName: string;
    address: string;
    txHash: string;
    gasUsed: string;
    blockNumber: number;
    timestamp: string;
}

interface TransactionLog {
    version: string;
    network: string;
    chainId: number;
    deployer: string;
    startTime: string;
    endTime?: string;
    totalGasUsed: bigint;
    deployments: DeployLogEntry[];
    transactions: TransactionLogEntry[];
}

// Global transaction log
let txLog: TransactionLog;
let currentPhase = "INIT";

function initTransactionLog(network: string, chainId: number, deployer: string) {
    txLog = {
        version: "10.0.0",
        network,
        chainId,
        deployer,
        startTime: new Date().toISOString(),
        totalGasUsed: 0n,
        deployments: [],
        transactions: [],
    };
}

function setCurrentPhase(phase: string) {
    currentPhase = phase;
}

function logTransaction(entry: Omit<TransactionLogEntry, "phase" | "timestamp">) {
    txLog.transactions.push({
        ...entry,
        phase: currentPhase,
        timestamp: new Date().toISOString(),
    });
    if (entry.status === "success") {
        txLog.totalGasUsed += BigInt(entry.gasUsed);
    }
    saveTransactionLog();
}

function logDeployment(entry: Omit<DeployLogEntry, "timestamp">) {
    txLog.deployments.push({
        ...entry,
        timestamp: new Date().toISOString(),
    });
    txLog.totalGasUsed += BigInt(entry.gasUsed);
    saveTransactionLog();
}

function saveTransactionLog() {
    txLog.endTime = new Date().toISOString();
    const logPath = path.join(process.cwd(), "transaction-log.json");

    const logToSave = {
        ...txLog,
        totalGasUsed: txLog.totalGasUsed.toString(),
    };

    fs.writeFileSync(logPath, JSON.stringify(logToSave, null, 2));
}

function printTransactionSummary() {
    console.log("\n════════════════════════════════════════════════════════════════════════════");
    console.log("                         📜 TRANSACTION LOG SUMMARY");
    console.log("════════════════════════════════════════════════════════════════════════════");
    console.log(`   📁 Log salvo em: transaction-log.json`);
    console.log(`   ⛽ Total Gas: ${txLog.totalGasUsed.toLocaleString()}`);
    console.log(`   📦 Deploys: ${txLog.deployments.length}`);
    console.log(`   📝 Transações: ${txLog.transactions.length}`);
    console.log(`   ⏱️ Duração: ${calculateDuration()}`);
    console.log("────────────────────────────────────────────────────────────────────────────");
}

function calculateDuration(): string {
    const start = new Date(txLog.startTime).getTime();
    const end = new Date(txLog.endTime || new Date().toISOString()).getTime();
    const diff = Math.floor((end - start) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
}

// ════════════════════════════════════════════════════════════════════════════
//                    🔐 CARTEIRAS DO SISTEMA
// ════════════════════════════════════════════════════════════════════════════

const SYSTEM_WALLETS = {
    TREASURY: "0xc93030333E3a235c2605BcB7C7330650B600B6D0",
    MULTISIG_ADMIN: "",
};

// ════════════════════════════════════════════════════════════════════════════
//                    🛡️ CONFIGURAÇÃO DE SEGURANÇA
// ════════════════════════════════════════════════════════════════════════════

const SECURITY_CONFIG = {
    DEPLOY_GOVERNANCE: true,
    TIMELOCK_DELAY_SECONDS: 3600, // 1 hora (mínimo permitido)
};

// ════════════════════════════════════════════════════════════════════════════
//                    🌐 MULTI-RPC CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

const TESTNET_RPC_ENDPOINTS = [
    { name: 'Arbitrum Official', url: 'https://sepolia-rollup.arbitrum.io/rpc', priority: 1 },
    { name: 'Alchemy', url: process.env.ALCHEMY_API_KEY ? `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : null, priority: 2 },
    { name: 'BlockPI', url: 'https://arbitrum-sepolia.blockpi.network/v1/rpc/public', priority: 3 },
    { name: 'PublicNode', url: 'https://arbitrum-sepolia-rpc.publicnode.com', priority: 4 }
].filter(rpc => rpc.url) as { name: string; url: string; priority: number }[];

const MAINNET_RPC_ENDPOINTS = [
    { name: 'Alchemy', url: process.env.ALCHEMY_API_KEY ? `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : null, priority: 1 },
    { name: 'Arbitrum Official', url: 'https://arb1.arbitrum.io/rpc', priority: 2 },
    { name: 'BlockPI', url: 'https://arbitrum.blockpi.network/v1/rpc/public', priority: 3 },
].filter(rpc => rpc.url) as { name: string; url: string; priority: number }[];

let RPC_ENDPOINTS = TESTNET_RPC_ENDPOINTS;
let rpcFailCounts: Record<string, number> = {};

// ════════════════════════════════════════════════════════════════════════════
//                    ⚙️ CONFIGURAÇÃO GERAL
// ════════════════════════════════════════════════════════════════════════════

const DEPLOY_DELAY_MS = 5000;
const TX_DELAY_MS = 2000;
const RETRY_DELAY_MS = 5000;

// ════════════════════════════════════════════════════════════════════════════
//                    🎨 NFT TIERS CONFIG (V9: uint8 tiers 0-3)
// ════════════════════════════════════════════════════════════════════════════

// RewardBooster: Only mint Bronze. Higher tiers come from NFTFusion (2→1 fuse)
// NOTE: mintCount capped at 50 — initializePool transfers each NFT individually
// and costs ~250K gas/NFT. 50 × 250K = 12.5M gas (safe under 50M limit).
// More Bronze enter the pool when users sell back or split higher-tier NFTs.
const NFT_TIERS = [
    { tier: 0, name: "Bronze", mintCount: 50 },
];

// ════════════════════════════════════════════════════════════════════════════
//                    💧 LIQUIDEZ INICIAL
// ════════════════════════════════════════════════════════════════════════════

const LIQUIDITY_CONFIG = {
    FORTUNE_POOL: 1_000_000n * 10n**18n,
    FAUCET_BKC: 4_000_000n * 10n**18n,
    // NFT Pools: Bronze seeded with real NFTs; higher tiers start empty with virtual reserves
    NFT_POOL_BKC: [
        25_000n * 10n**18n,    // Bronze:  50 NFTs + 25K BKC (~500 BKC/NFT)
        250_000n * 10n**18n,   // Silver:  0 NFTs + 250K BKC (virtualReserves=10)
        200_000n * 10n**18n,   // Gold:    0 NFTs + 200K BKC (virtualReserves=10)
        150_000n * 10n**18n,   // Diamond: 0 NFTs + 150K BKC (virtualReserves=10)
    ] as const,
    NFT_POOL_VIRTUAL_RESERVES: [0, 10, 10, 10] as const,
    // LiquidityPool: ETH + BKC initial liquidity (define o preço inicial)
    LIQUIDITY_POOL_BKC: 2_000_000n * 10n**18n,
    LIQUIDITY_POOL_ETH: "0.5", // 0.5 ETH → preço inicial: 0.00000025 ETH/BKC
    // Referral BKC bonus pool (welcome gift for referred users)
    REFERRAL_BONUS_BKC: 100_000n * 10n**18n,
};

// ════════════════════════════════════════════════════════════════════════════
//                    🚰 FAUCET CONFIG
// ════════════════════════════════════════════════════════════════════════════

const FAUCET_CONFIG = {
    TOKENS_PER_REQUEST: 20n * 10n**18n,
    ETH_PER_REQUEST: 1n * 10n**15n,
    COOLDOWN_SECONDS: 86400, // 24h
};

// ════════════════════════════════════════════════════════════════════════════
//                    📊 MODULE FEE CONFIGS (V10: ModuleConfig)
// ════════════════════════════════════════════════════════════════════════════
// ModuleConfig: { active, customBps, operatorBps, treasuryBps, buybackBps }
// customBps + operatorBps + treasuryBps + buybackBps MUST = 10000
// V10: referral 10% is taken off-the-top BEFORE module split.
//      These BPS operate on the remaining 90%.
//      Effective split: Referrer 10% | Operator 15% | Treasury 25% | Buyback 50%

// V10 standard splits:
//   Tutor: 5% ETH off-the-top (ecosystem-wide)
//   Standard modules (no custom): 15% operator / 30% treasury / 55% buyback
//   Custom modules: custom% first, then 15/30/55 ratio on remainder
const MODULE_CONFIGS = {
    // Standard (staking, nft_pool, fortune, notary, nft_fusion, rental): no custom recipient
    STANDARD:    { active: true, customBps: 0,    operatorBps: 1500, treasuryBps: 3000, buybackBps: 5500 },
    // Agora (50% to content creator, 15/30/55 on remaining 50%)
    AGORA:       { active: true, customBps: 5000, operatorBps: 750,  treasuryBps: 1500, buybackBps: 2750 },
    // Charity (70% to campaign, 15/30/55 on remaining 30%)
    CHARITY:     { active: true, customBps: 7000, operatorBps: 450,  treasuryBps: 900,  buybackBps: 1650 },
    // RENTAL: 20% ecosystem fee (owner gets rentalCost directly, fee goes to standard split)
    // Note: owner already gets rentalCost via pendingEarnings — the fee is 100% ecosystem
};

// ════════════════════════════════════════════════════════════════════════════
//                    💰 ACTION FEE CONFIGS (V10: FeeConfig per action)
// ════════════════════════════════════════════════════════════════════════════
// FeeConfig: { feeType: uint8, bps: uint16, multiplier: uint32, gasEstimate: uint32 }
// feeType: 0 = gas-based (gasEstimate × gasPrice × bps × multiplier / 10000)
// feeType: 1 = value-based (txValue × bps / 10000)
//
// V10 Fee Tiers (calibrated for Arbitrum L2, ~0.01-0.1 gwei gas):
//   SOCIAL    (~$0.025): low-friction actions (like, follow, reply, claim)
//   CONTENT   (~$0.10):  content creation (post, certify, report)
//   FINANCIAL (~$1.00):  financial actions (delegate, NFT buy/sell, fortune tier1/2)
//   PREMIUM   (~$2.00):  premium services (profile boost)
//   BADGE_*:  annual subscriptions via high multipliers ($60-$750/year)

const FEE_TYPE_GAS = 0;
const FEE_TYPE_VALUE = 1;

// V10 fee tiers
const GAS_FEE_SOCIAL    = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 50,        gasEstimate: 150000 };
const GAS_FEE_CONTENT   = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 200,       gasEstimate: 200000 };
const GAS_FEE_FINANCIAL = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 2000,      gasEstimate: 200000 };
const GAS_FEE_PREMIUM   = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 2700,      gasEstimate: 300000 };

// Badge tiers (annual pricing via high multipliers — uint32 required)
const GAS_FEE_BADGE_VERIFIED = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 120000,   gasEstimate: 200000 }; // ~$60/year
const GAS_FEE_BADGE_PREMIUM  = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 600000,   gasEstimate: 200000 }; // ~$300/year
const GAS_FEE_BADGE_ELITE    = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 1500000,  gasEstimate: 200000 }; // ~$750/year

// Todas as ações do ecossistema e suas taxas
// Nota: ações com string usam ethers.id(), ações NFT usam abi.encode(string, uint8)
const ACTION_FEE_CONFIGS: Record<string, { feeType: number; bps: number; multiplier: number; gasEstimate: number }> = {
    // StakingPool
    "STAKING_DELEGATE":       GAS_FEE_FINANCIAL,
    "STAKING_CLAIM":          GAS_FEE_SOCIAL,
    "STAKING_FORCE_UNSTAKE":  GAS_FEE_FINANCIAL,
    // Agora (social)
    "AGORA_POST":             GAS_FEE_CONTENT,
    "AGORA_POST_IMAGE":       GAS_FEE_CONTENT,
    "AGORA_POST_VIDEO":       GAS_FEE_CONTENT,
    "AGORA_LIVE":             GAS_FEE_CONTENT,
    "AGORA_REPLY":            GAS_FEE_SOCIAL,
    "AGORA_REPOST":           GAS_FEE_SOCIAL,
    "AGORA_LIKE":             GAS_FEE_SOCIAL,
    "AGORA_FOLLOW":           GAS_FEE_SOCIAL,
    "AGORA_REPORT":           GAS_FEE_CONTENT,
    "AGORA_PROFILE_BOOST":    GAS_FEE_PREMIUM,
    "AGORA_BADGE_VERIFIED":   GAS_FEE_BADGE_VERIFIED,
    "AGORA_BADGE_PREMIUM":    GAS_FEE_BADGE_PREMIUM,
    "AGORA_BADGE_ELITE":      GAS_FEE_BADGE_ELITE,
    // FortunePool (per tier)
    "FORTUNE_TIER0":          GAS_FEE_SOCIAL,
    "FORTUNE_TIER1":          GAS_FEE_FINANCIAL,
    "FORTUNE_TIER2":          GAS_FEE_FINANCIAL,
    // Notary
    "NOTARY_CERTIFY":         GAS_FEE_CONTENT,
    // CharityPool
    "CHARITY_CREATE":         GAS_FEE_FINANCIAL,
    "CHARITY_BOOST":          GAS_FEE_CONTENT,
    // RentalManager
    "RENTAL_BOOST":           GAS_FEE_PREMIUM,
    // (RENTAL_RENT e CHARITY_DONATE são value-based, definidos separadamente)
    // NFTFusion (fuse 2→1 up, split 1→2 down)
    "FUSION_BRONZE":          GAS_FEE_FINANCIAL,
    "FUSION_SILVER":          GAS_FEE_FINANCIAL,
    "FUSION_GOLD":            GAS_FEE_FINANCIAL,
    "SPLIT_SILVER":           GAS_FEE_FINANCIAL,
    "SPLIT_GOLD":             GAS_FEE_FINANCIAL,
    "SPLIT_DIAMOND":          GAS_FEE_FINANCIAL,
};

// Ações value-based
const VALUE_FEE_CONFIGS: Record<string, { bps: number }> = {
    "CHARITY_DONATE": { bps: 500 },    // 5% da doação
    "RENTAL_RENT":    { bps: 2000 },   // 20% do custo de aluguel → ecossistema
};

// NFTPool actions (usam abi.encode, não keccak256 de string simples)
// Serão calculadas dinamicamente no script com ethers.AbiCoder
const NFT_FEE_CONFIG = {
    BUY:  GAS_FEE_FINANCIAL,
    SELL: GAS_FEE_FINANCIAL,
};

// ════════════════════════════════════════════════════════════════════════════
//                    🔥 BKC DISTRIBUTION (burn / operator / stakers / treasury)
// ════════════════════════════════════════════════════════════════════════════
// burn + operator + staker + treasury = 10000
// Deflation via StakingPool claims (10% burn if no tutor, recycle if NFT penalty)

const BKC_DISTRIBUTION = {
    burnBps: 0,         // 0% burn in ecosystem (burn happens on StakingPool claims)
    operatorBps: 1500,  // 15% to frontend operator
    stakerBps: 7000,    // 70% to stakers via notifyReward
    treasuryBps: 1500,  // 15% to treasury
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
        VERSION: "10.0.0",
        DESCRIPTION: "Backchain Ecosystem V10.0 - All Immutable Contracts + Ecosystem-wide Referral",
        NETWORK: networkName,
        CREATED_AT: new Date().toISOString(),
        wallets: {
            TREASURY: SYSTEM_WALLETS.TREASURY,
            MULTISIG_ADMIN: SYSTEM_WALLETS.MULTISIG_ADMIN || "DEPLOYER"
        },
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
    maxRetries = 5
): Promise<ContractTransactionReceipt | null> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`   ⏳ ${description}...`);
            const tx = await txFunction();
            const receipt = await tx.wait();
            if (!receipt) throw new Error("Recibo nulo");

            console.log(`   ✅ ${description} (gas: ${receipt.gasUsed})`);
            console.log(`      📜 TX: ${receipt.hash}`);

            logTransaction({
                description,
                txHash: receipt.hash,
                from: receipt.from,
                to: receipt.to || "",
                gasUsed: receipt.gasUsed.toString(),
                blockNumber: receipt.blockNumber,
                status: "success",
            });

            await sleep(TX_DELAY_MS);
            return receipt as ContractTransactionReceipt;
        } catch (error: any) {
            lastError = error;
            const msg = error.message || JSON.stringify(error);

            if (msg.includes("already") || msg.includes("Already")) {
                console.log(`   ⏩ Já realizado: ${description}`);
                logTransaction({
                    description,
                    txHash: "N/A (already done)",
                    from: "",
                    to: "",
                    gasUsed: "0",
                    blockNumber: 0,
                    status: "skipped",
                });
                return null;
            }

            const isRetryable =
                msg.includes("ECONNRESET") || msg.includes("TIMEOUT") ||
                msg.includes("timeout") || msg.includes("ETIMEDOUT") ||
                msg.includes("socket hang up") || msg.includes("429") ||
                msg.includes("rate limit") || msg.includes("nonce") ||
                msg.includes("replacement");

            if (isRetryable && attempt < maxRetries) {
                const waitTime = RETRY_DELAY_MS * attempt;
                console.log(`   ❌ Tentativa ${attempt}/${maxRetries}: ${msg.slice(0, 50)}`);
                console.log(`   ⏳ Aguardando ${waitTime/1000}s...`);
                await sleep(waitTime);
                continue;
            }

            console.log(`   ❌ Tentativa ${attempt}/${maxRetries}: ${msg.slice(0, 80)}`);

            if (attempt === maxRetries) {
                logTransaction({
                    description,
                    txHash: "FAILED",
                    from: "",
                    to: "",
                    gasUsed: "0",
                    blockNumber: 0,
                    status: "failed",
                    error: msg.slice(0, 200),
                });
                throw error;
            }
        }
    }
    throw lastError || new Error(`Falha após ${maxRetries} tentativas: ${description}`);
}

// ════════════════════════════════════════════════════════════════════════════
//                    🔨 DEPLOY CONTRACT HELPER (V9: TODOS IMUTÁVEIS)
// ════════════════════════════════════════════════════════════════════════════

async function deployContractWithRetry(
    Factory: any,
    args: any[],
    name: string
): Promise<{ contract: any; address: string }> {
    console.log(`\n   📦 Deploying ${name}...`);

    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            const contract = await Factory.deploy(...args);
            await contract.waitForDeployment();
            const address = await contract.getAddress();

            let txHash = "N/A";
            let gasUsed = "0";
            let blockNumber = 0;

            try {
                const deployTx = contract.deploymentTransaction();
                if (deployTx) {
                    txHash = deployTx.hash;
                    const receipt = await deployTx.wait();
                    if (receipt) {
                        gasUsed = receipt.gasUsed.toString();
                        blockNumber = receipt.blockNumber;
                    }
                }
            } catch (e) {}

            console.log(`   ✅ ${name}: ${address}`);
            console.log(`      📜 TX: ${txHash}`);

            logDeployment({
                contractName: name,
                address,
                txHash,
                gasUsed,
                blockNumber,
            });

            await sleep(DEPLOY_DELAY_MS);
            return { contract, address };
        } catch (error: any) {
            const msg = error.message || "";
            console.log(`   ❌ Tentativa ${attempt}/5: ${msg.slice(0, 60)}`);

            if (attempt < 5) {
                await sleep(RETRY_DELAY_MS * attempt);
                continue;
            }
            throw error;
        }
    }
    throw new Error(`Falha ao implantar ${name}`);
}

// ════════════════════════════════════════════════════════════════════════════
//                    🚀 SCRIPT PRINCIPAL V10.0
// ════════════════════════════════════════════════════════════════════════════

async function main() {
    const hre = require("hardhat");
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    const isMainnet = networkName === "arbitrum" || networkName === "arbitrumOne";
    RPC_ENDPOINTS = isMainnet ? MAINNET_RPC_ENDPOINTS : TESTNET_RPC_ENDPOINTS;
    RPC_ENDPOINTS.forEach(rpc => { rpcFailCounts[rpc.name] = 0; });

    const chainId = Number((await ethers.provider.getNetwork()).chainId);
    initTransactionLog(networkName, chainId, deployer.address);

    console.log("\n\n════════════════════════════════════════════════════════════════════════════");
    console.log("               🚀 BACKCHAIN ECOSYSTEM DEPLOY V10.0 (IMUTÁVEL)");
    console.log("════════════════════════════════════════════════════════════════════════════");
    console.log(`   Network:     ${networkName} (chainId: ${chainId})`);
    console.log(`   Deployer:    ${deployer.address}`);
    console.log(`   Balance:     ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
    console.log(`   Treasury:    ${SYSTEM_WALLETS.TREASURY}`);
    console.log(`   Mode:        ${isMainnet ? '🔴 MAINNET' : '🟢 TESTNET'}`);
    console.log("════════════════════════════════════════════════════════════════════════════");
    console.log("   ⚠️  V10.0: TODOS os contratos são IMUTÁVEIS (sem proxy)");
    console.log("════════════════════════════════════════════════════════════════════════════\n");

    try {
        clearConfigFiles(networkName);
        const addresses: Record<string, string> = {};

        // ══════════════════════════════════════════════════════════════════════
        // FASE 1: BKCToken (TGE mint no constructor)
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 1: BKCToken");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 1: Deploy BKCToken (TGE: 40M mint no constructor)");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // BKCToken constructor(address _treasury) — mints 40M to _treasury
        // Usamos deployer como treasury no TGE para que ele tenha BKC para fundear
        // os contratos. No final, o saldo restante é transferido para o treasury real.
        const BKCToken = await ethers.getContractFactory("BKCToken");
        const deployerAddr = deployer.address;
        const treasuryAddr = SYSTEM_WALLETS.TREASURY;

        const { contract: bkc, address: bkcAddr } = await deployContractWithRetry(
            BKCToken, [deployerAddr], "BKCToken"
        );
        addresses.bkcToken = bkcAddr;
        updateAddressJSON("bkcToken", bkcAddr);

        const tgeBalance = await bkc.balanceOf(deployerAddr);
        console.log(`   💰 TGE: ${ethers.formatEther(tgeBalance)} BKC mintados para Deployer`);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 2: BackchainEcosystem
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 2: BackchainEcosystem");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 2: Deploy BackchainEcosystem");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // BackchainEcosystem constructor(address _bkcToken, address _treasury)
        const BackchainEcosystem = await ethers.getContractFactory("BackchainEcosystem");
        const { contract: eco, address: ecoAddr } = await deployContractWithRetry(
            BackchainEcosystem, [bkcAddr, treasuryAddr], "BackchainEcosystem"
        );
        addresses.backchainEcosystem = ecoAddr;
        updateAddressJSON("backchainEcosystem", ecoAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 3: LiquidityPool (AMM)
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 3: LiquidityPool");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 3: Deploy LiquidityPool (AMM)");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // LiquidityPool constructor(address _bkcToken)
        const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
        const { contract: lp, address: lpAddr } = await deployContractWithRetry(
            LiquidityPool, [bkcAddr], "LiquidityPool"
        );
        addresses.liquidityPool = lpAddr;
        updateAddressJSON("liquidityPool", lpAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 4: StakingPool
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 4: StakingPool");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 4: Deploy StakingPool");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // StakingPool constructor(address _ecosystem, address _bkcToken)
        const StakingPool = await ethers.getContractFactory("StakingPool");
        const { contract: staking, address: stakingAddr } = await deployContractWithRetry(
            StakingPool, [ecoAddr, bkcAddr], "StakingPool"
        );
        addresses.stakingPool = stakingAddr;
        updateAddressJSON("stakingPool", stakingAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 5: BuybackMiner
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 5: BuybackMiner");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 5: Deploy BuybackMiner");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // BuybackMiner constructor(address _ecosystem, address _bkcToken, address _liquidityPool, address _stakingPool)
        const BuybackMiner = await ethers.getContractFactory("BuybackMiner");
        const { contract: buyback, address: buybackAddr } = await deployContractWithRetry(
            BuybackMiner, [ecoAddr, bkcAddr, lpAddr, stakingAddr], "BuybackMiner"
        );
        addresses.buybackMiner = buybackAddr;
        updateAddressJSON("buybackMiner", buybackAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 6: RewardBooster (mint NFTs ANTES de configurePools)
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 6: RewardBooster");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 6: Deploy RewardBooster + Mint Genesis NFTs");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // RewardBooster constructor(address _deployer)
        const RewardBooster = await ethers.getContractFactory("RewardBooster");
        const { contract: booster, address: boosterAddr } = await deployContractWithRetry(
            RewardBooster, [deployerAddr], "RewardBooster"
        );
        addresses.rewardBooster = boosterAddr;
        updateAddressJSON("rewardBooster", boosterAddr);

        // Mint genesis Bronze NFTs only (higher tiers via NFTFusion)
        const bronzeMintCount = NFT_TIERS[0].mintCount;
        const bronzeTokenIds: bigint[] = [];
        const MINT_BATCH_SIZE = 100; // Arbitrum gas limit — mint in smaller batches

        {
            let minted = 0;
            while (minted < bronzeMintCount) {
                const batchSize = Math.min(MINT_BATCH_SIZE, bronzeMintCount - minted);
                const tx = await booster.mintBatch(deployerAddr, 0, batchSize);
                const receipt = await tx.wait();

                const totalSupply = await booster.totalSupply();
                const batchStartId = Number(totalSupply) - batchSize + 1;

                for (let i = 0; i < batchSize; i++) {
                    bronzeTokenIds.push(BigInt(batchStartId + i));
                }

                console.log(`   ✅ Minted batch ${minted + 1}..${minted + batchSize} of ${bronzeMintCount} Bronze NFTs`);

                logTransaction({
                    description: `mintBatch: ${batchSize} Bronze (batch ${Math.ceil((minted + 1) / MINT_BATCH_SIZE)})`,
                    txHash: receipt?.hash || "N/A",
                    from: deployerAddr,
                    to: boosterAddr,
                    gasUsed: receipt?.gasUsed?.toString() || "0",
                    blockNumber: receipt?.blockNumber || 0,
                    status: "success",
                });

                minted += batchSize;
                await sleep(TX_DELAY_MS);
            }
        }

        console.log(`   🎉 Total NFTs mintados: ${bronzeMintCount} (higher tiers via fusion)`);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 6b: NFTFusion (fuse 2→1 up, split 1→2 down)
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 6b: NFTFusion");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 6b: Deploy NFTFusion + setFusionContract");
        console.log("═══════════════════════════════════════════════════════════════════════");

        const NFTFusion = await ethers.getContractFactory("NFTFusion");
        const { contract: fusion, address: fusionAddr } = await deployContractWithRetry(
            NFTFusion, [ecoAddr, boosterAddr], "NFTFusion"
        );
        addresses.nftFusion = fusionAddr;
        updateAddressJSON("nftFusion", fusionAddr);

        // Authorize NFTFusion as fusion contract in RewardBooster
        await sendTxWithRetry(
            async () => await booster.setFusionContract(fusionAddr),
            "RewardBooster.setFusionContract(NFTFusion)"
        );
        console.log("   ✅ NFTFusion deployed + authorized for fusion mint/burn!");

        // ══════════════════════════════════════════════════════════════════════
        // FASE 7: NFTPool × 4 (deploy + initializePool)
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 7: NFTPool × 4");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 7: Deploy 4 NFTPools + Initialize");
        console.log("═══════════════════════════════════════════════════════════════════════");

        const tierNames = ["bronze", "silver", "gold", "diamond"];
        const poolContracts: any[] = [];
        const poolAddresses: string[] = [];

        // NFTPool constructor(address _ecosystem, address _bkcToken, address _rewardBooster, uint8 _tier, uint256 _virtualReserves)
        const NFTPool = await ethers.getContractFactory("NFTPool");

        for (let tier = 0; tier < 4; tier++) {
            const vReserves = LIQUIDITY_CONFIG.NFT_POOL_VIRTUAL_RESERVES[tier];
            const { contract: pool, address: poolAddr } = await deployContractWithRetry(
                NFTPool, [ecoAddr, bkcAddr, boosterAddr, tier, vReserves], `NFTPool_${tierNames[tier]}`
            );
            poolContracts.push(pool);
            poolAddresses.push(poolAddr);
            addresses[`pool_${tierNames[tier]}`] = poolAddr;
            updateAddressJSON(`pool_${tierNames[tier]}`, poolAddr);
        }

        // configurePools no RewardBooster (IRREVERSÍVEL!)
        console.log("\n   🔒 configurePools no RewardBooster (IRREVERSÍVEL)...");
        await sendTxWithRetry(
            async () => await booster.configurePools(poolAddresses as [string, string, string, string]),
            "RewardBooster.configurePools([bronze, silver, gold, diamond])"
        );

        // Initialize Bronze pool: 1000 real NFTs + BKC
        {
            const pool = poolContracts[0];
            const poolAddr = poolAddresses[0];
            const bkcAmount = LIQUIDITY_CONFIG.NFT_POOL_BKC[0];

            console.log(`\n   📦 Inicializando BRONZE Pool: ${bronzeTokenIds.length} NFTs + ${ethers.formatEther(bkcAmount)} BKC`);

            await sendTxWithRetry(
                async () => await booster.setApprovalForAll(poolAddr, true),
                "Approve NFTs para bronze pool"
            );
            await sendTxWithRetry(
                async () => await bkc.approve(poolAddr, bkcAmount),
                "Approve BKC para bronze pool"
            );
            await sendTxWithRetry(
                async () => await pool.initializePool(bronzeTokenIds, bkcAmount),
                `initializePool bronze: ${bronzeTokenIds.length} NFTs + ${ethers.formatEther(bkcAmount)} BKC`
            );
            console.log("   ✅ Bronze pool inicializado!");
        }

        // Initialize Silver/Gold/Diamond pools: 0 real NFTs + BKC (virtual reserves handle pricing)
        for (let tier = 1; tier < 4; tier++) {
            const pool = poolContracts[tier];
            const poolAddr = poolAddresses[tier];
            const bkcAmount = LIQUIDITY_CONFIG.NFT_POOL_BKC[tier];
            const tierName = tierNames[tier];

            console.log(`\n   📦 Inicializando ${tierName.toUpperCase()} Pool: 0 NFTs + ${ethers.formatEther(bkcAmount)} BKC (virtualReserves=${LIQUIDITY_CONFIG.NFT_POOL_VIRTUAL_RESERVES[tier]})`);

            await sendTxWithRetry(
                async () => await bkc.approve(poolAddr, bkcAmount),
                `Approve BKC para ${tierName} pool`
            );
            await sendTxWithRetry(
                async () => await pool.initializePool([], bkcAmount),
                `initializePool ${tierName}: 0 NFTs + ${ethers.formatEther(bkcAmount)} BKC (virtual reserves)`
            );
            console.log(`   ✅ ${tierName} pool inicializado com virtual reserves!`);
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 8: Deploy Módulos Restantes
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 8: Módulos Restantes");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 8: Deploy FortunePool, Agora, Notary, CharityPool, RentalManager");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // FortunePool constructor(address _ecosystem, address _bkcToken)
        const FortunePool = await ethers.getContractFactory("FortunePool");
        const { contract: fortune, address: fortuneAddr } = await deployContractWithRetry(
            FortunePool, [ecoAddr, bkcAddr], "FortunePool"
        );
        addresses.fortunePool = fortuneAddr;
        updateAddressJSON("fortunePool", fortuneAddr);

        // Agora constructor(address _ecosystem)
        const Agora = await ethers.getContractFactory("Agora");
        const { contract: agora, address: agoraAddr } = await deployContractWithRetry(
            Agora, [ecoAddr], "Agora"
        );
        addresses.agora = agoraAddr;
        updateAddressJSON("agora", agoraAddr);

        // Notary constructor(address _ecosystem)
        const Notary = await ethers.getContractFactory("Notary");
        const { contract: notary, address: notaryAddr } = await deployContractWithRetry(
            Notary, [ecoAddr], "Notary"
        );
        addresses.notary = notaryAddr;
        updateAddressJSON("notary", notaryAddr);

        // CharityPool constructor(address _ecosystem)
        const CharityPool = await ethers.getContractFactory("CharityPool");
        const { contract: charity, address: charityAddr } = await deployContractWithRetry(
            CharityPool, [ecoAddr], "CharityPool"
        );
        addresses.charityPool = charityAddr;
        updateAddressJSON("charityPool", charityAddr);

        // RentalManager constructor(address _ecosystem, address _rewardBooster)
        const RentalManager = await ethers.getContractFactory("RentalManager");
        const { contract: rental, address: rentalAddr } = await deployContractWithRetry(
            RentalManager, [ecoAddr, boosterAddr], "RentalManager"
        );
        addresses.rentalManager = rentalAddr;
        updateAddressJSON("rentalManager", rentalAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 9: Configuração do Ecossistema
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 9: Configuração do Ecossistema");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 9: Registrar Módulos + Configurar Ecossistema");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // 9a. setBuybackMiner e setStakingPool no Ecosystem
        await sendTxWithRetry(
            async () => await eco.setBuybackMiner(buybackAddr),
            "Ecosystem.setBuybackMiner()"
        );
        await sendTxWithRetry(
            async () => await eco.setStakingPool(stakingAddr),
            "Ecosystem.setStakingPool()"
        );

        // 9a-bis. Set tutor relayer (deployer = relayer, same key as FAUCET_RELAYER_KEY on Vercel)
        await sendTxWithRetry(
            async () => await eco.setTutorRelayer(deployerAddr),
            "Ecosystem.setTutorRelayer(deployer)"
        );

        // V10: Enable ecosystem-wide tutor rewards (5% ETH off-the-top)
        await sendTxWithRetry(
            async () => await eco.setTutorBps(500),
            "Ecosystem.setTutorBps(500 = 5%)"
        );

        // 9b. registerModuleBatch — registrar todos os 8 módulos
        const moduleContracts = [
            stakingAddr, poolAddresses[0], fortuneAddr, agoraAddr,
            notaryAddr, charityAddr, rentalAddr, fusionAddr,
        ];
        const moduleIds = [
            ethers.id("STAKING"), ethers.id("NFT_POOL"), ethers.id("FORTUNE"), ethers.id("AGORA"),
            ethers.id("NOTARY"), ethers.id("CHARITY"), ethers.id("RENTAL"), ethers.id("NFT_FUSION"),
        ];
        const moduleConfigs = [
            MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.AGORA,
            MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.CHARITY, MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.STANDARD,
        ];

        // Converter para o formato do struct: [active, customBps, operatorBps, treasuryBps, buybackBps]
        const moduleConfigsTuples = moduleConfigs.map(c => [
            c.active, c.customBps, c.operatorBps, c.treasuryBps, c.buybackBps
        ]);

        await sendTxWithRetry(
            async () => await eco.registerModuleBatch(moduleContracts, moduleIds, moduleConfigsTuples),
            "Ecosystem.registerModuleBatch() — 8 módulos"
        );

        // Registrar os outros 3 NFT pools individualmente (mesmo MODULE_ID = NFT_POOL)
        for (let i = 1; i < 4; i++) {
            await sendTxWithRetry(
                async () => await eco.registerModule(
                    poolAddresses[i],
                    ethers.id("NFT_POOL"),
                    [MODULE_CONFIGS.STANDARD.active, MODULE_CONFIGS.STANDARD.customBps,
                     MODULE_CONFIGS.STANDARD.operatorBps, MODULE_CONFIGS.STANDARD.treasuryBps,
                     MODULE_CONFIGS.STANDARD.buybackBps]
                ),
                `Ecosystem.registerModule(pool_${tierNames[i]}, NFT_POOL)`
            );
        }

        console.log("   ✅ Todos os módulos registrados!");

        // ══════════════════════════════════════════════════════════════════════
        // FASE 9b: Configurar FeeConfig para cada ação + BKC Distribution
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 9b: Action Fee Configs");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 9b: Configurar FeeConfig para cada ação");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // Montar arrays para setFeeConfigBatch
        const actionIds: string[] = [];
        const feeConfigs: any[] = [];

        // 1) Ações gas-based (keccak256 de string simples)
        for (const [actionName, cfg] of Object.entries(ACTION_FEE_CONFIGS)) {
            actionIds.push(ethers.id(actionName));
            feeConfigs.push([cfg.feeType, cfg.bps, cfg.multiplier, cfg.gasEstimate]);
        }

        // 2) Ações value-based
        for (const [actionName, cfg] of Object.entries(VALUE_FEE_CONFIGS)) {
            actionIds.push(ethers.id(actionName));
            feeConfigs.push([FEE_TYPE_VALUE, cfg.bps, 0, 0]);
        }

        // 3) NFTPool ações (usam abi.encode, NÃO keccak256 de string!)
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        for (let tier = 0; tier < 4; tier++) {
            // ACTION_BUY = keccak256(abi.encode("NFT_BUY_T", tier))
            const buyActionId = ethers.keccak256(abiCoder.encode(["string", "uint8"], ["NFT_BUY_T", tier]));
            actionIds.push(buyActionId);
            feeConfigs.push([NFT_FEE_CONFIG.BUY.feeType, NFT_FEE_CONFIG.BUY.bps,
                             NFT_FEE_CONFIG.BUY.multiplier, NFT_FEE_CONFIG.BUY.gasEstimate]);

            // ACTION_SELL = keccak256(abi.encode("NFT_SELL_T", tier))
            const sellActionId = ethers.keccak256(abiCoder.encode(["string", "uint8"], ["NFT_SELL_T", tier]));
            actionIds.push(sellActionId);
            feeConfigs.push([NFT_FEE_CONFIG.SELL.feeType, NFT_FEE_CONFIG.SELL.bps,
                             NFT_FEE_CONFIG.SELL.multiplier, NFT_FEE_CONFIG.SELL.gasEstimate]);
        }

        console.log(`   📋 Configurando ${actionIds.length} action fees...`);

        await sendTxWithRetry(
            async () => await eco.setFeeConfigBatch(actionIds, feeConfigs),
            `Ecosystem.setFeeConfigBatch() — ${actionIds.length} ações`
        );

        // 4) BKC Distribution (burn / operator / stakers / treasury)
        // Contract defaults match, but configure explicitly for clarity
        await sendTxWithRetry(
            async () => await eco.setBkcDistribution(
                BKC_DISTRIBUTION.burnBps,
                BKC_DISTRIBUTION.operatorBps,
                BKC_DISTRIBUTION.stakerBps,
                BKC_DISTRIBUTION.treasuryBps
            ),
            `Ecosystem.setBkcDistribution(${BKC_DISTRIBUTION.burnBps}/${BKC_DISTRIBUTION.operatorBps}/${BKC_DISTRIBUTION.stakerBps}/${BKC_DISTRIBUTION.treasuryBps})`
        );

        console.log("   ✅ Todas as taxas configuradas!");

        // Log das taxas configuradas
        updateRulesJSON("feeConfigs", "totalActions", actionIds.length.toString());
        updateRulesJSON("feeConfigs", "gasBased", Object.keys(ACTION_FEE_CONFIGS).length.toString());
        updateRulesJSON("feeConfigs", "valueBased", Object.keys(VALUE_FEE_CONFIGS).length.toString());
        updateRulesJSON("feeConfigs", "nftActions", "8");
        updateRulesJSON("feeConfigs", "fusionActions", "6");
        updateRulesJSON("bkcDistribution", "burnBps", BKC_DISTRIBUTION.burnBps.toString());
        updateRulesJSON("bkcDistribution", "operatorBps", BKC_DISTRIBUTION.operatorBps.toString());
        updateRulesJSON("bkcDistribution", "stakerBps", BKC_DISTRIBUTION.stakerBps.toString());
        updateRulesJSON("bkcDistribution", "treasuryBps", BKC_DISTRIBUTION.treasuryBps.toString());

        // ══════════════════════════════════════════════════════════════════════
        // FASE 10: Configurar StakingPool + BKCToken Minter
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 10: StakingPool + BKCToken");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 10: Configurar StakingPool + Autorizar Minter");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // StakingPool: autorizar BuybackMiner + Ecosystem como notifiers
        await sendTxWithRetry(
            async () => await staking.setRewardNotifier(buybackAddr, true),
            "StakingPool.setRewardNotifier(BuybackMiner, true)"
        );
        await sendTxWithRetry(
            async () => await staking.setRewardNotifier(ecoAddr, true),
            "StakingPool.setRewardNotifier(Ecosystem, true)"
        );

        // StakingPool: configurar RewardBooster para boost de NFT
        await sendTxWithRetry(
            async () => await staking.setRewardBooster(boosterAddr),
            "StakingPool.setRewardBooster(RewardBooster)"
        );

        // NOTE: forceUnstake penalty is auto-computed by NFT tier (no setter needed)
        // Default forceUnstakeEthFee = 0.0004 ether (set in constructor)

        // BKCToken: autorizar BuybackMiner como minter
        await sendTxWithRetry(
            async () => await bkc.addMinter(buybackAddr),
            "BKCToken.addMinter(BuybackMiner)"
        );

        console.log("   ✅ StakingPool configurado + BuybackMiner autorizado como minter!");

        // ══════════════════════════════════════════════════════════════════════
        // FASE 11: Liquidez Inicial
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 11: Liquidez Inicial");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 11: Liquidez Inicial (Fortune, LiquidityPool, Faucet)");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // Fund FortunePool
        await sendTxWithRetry(
            async () => await bkc.approve(fortuneAddr, LIQUIDITY_CONFIG.FORTUNE_POOL),
            "Approve BKC para FortunePool"
        );
        await sendTxWithRetry(
            async () => await fortune.fundPrizePool(LIQUIDITY_CONFIG.FORTUNE_POOL),
            `FortunePool: ${ethers.formatEther(LIQUIDITY_CONFIG.FORTUNE_POOL)} BKC`
        );

        // Fund LiquidityPool (ETH + BKC) — define o preço inicial
        const lpBkcAmount = LIQUIDITY_CONFIG.LIQUIDITY_POOL_BKC;
        const lpEthAmount = ethers.parseEther(LIQUIDITY_CONFIG.LIQUIDITY_POOL_ETH);

        await sendTxWithRetry(
            async () => await bkc.approve(lpAddr, lpBkcAmount),
            "Approve BKC para LiquidityPool"
        );
        await sendTxWithRetry(
            async () => await lp.addLiquidity(lpBkcAmount, 0, { value: lpEthAmount }),
            `LiquidityPool: ${ethers.formatEther(lpBkcAmount)} BKC + ${LIQUIDITY_CONFIG.LIQUIDITY_POOL_ETH} ETH`
        );

        // Fund Tutor Bonus Pool (100K BKC welcome gifts for tutored users)
        const tutorBonusBkc = LIQUIDITY_CONFIG.REFERRAL_BONUS_BKC;
        await sendTxWithRetry(
            async () => await bkc.approve(ecoAddr, tutorBonusBkc),
            "Approve BKC para Tutor Bonus Pool"
        );
        await sendTxWithRetry(
            async () => await eco.fundTutorBonus(tutorBonusBkc),
            `Ecosystem.fundTutorBonus(${ethers.formatEther(tutorBonusBkc)} BKC)`
        );

        // ══════════════════════════════════════════════════════════════════════
        // FASE 12: Faucet (testnet only)
        // ══════════════════════════════════════════════════════════════════════
        let faucetAddr: string | null = null;

        if (!isMainnet) {
            setCurrentPhase("FASE 12: Faucet");
            console.log("\n═══════════════════════════════════════════════════════════════════════");
            console.log("   FASE 12: Deploy SimpleBKCFaucet (Testnet)");
            console.log("═══════════════════════════════════════════════════════════════════════");

            // SimpleBKCFaucet constructor(address _bkcToken, address _relayer, uint256 _tokensPerClaim, uint256 _ethPerClaim, uint256 _cooldown)
            const SimpleBKCFaucet = await ethers.getContractFactory("SimpleBKCFaucet");
            const { contract: faucet, address: fAddr } = await deployContractWithRetry(
                SimpleBKCFaucet,
                [bkcAddr, deployerAddr, FAUCET_CONFIG.TOKENS_PER_REQUEST, FAUCET_CONFIG.ETH_PER_REQUEST, FAUCET_CONFIG.COOLDOWN_SECONDS],
                "SimpleBKCFaucet"
            );
            faucetAddr = fAddr;
            addresses.simpleBkcFaucet = faucetAddr;
            updateAddressJSON("simpleBkcFaucet", faucetAddr);

            // Fund Faucet com BKC
            await sendTxWithRetry(
                async () => await bkc.transfer(faucetAddr!, LIQUIDITY_CONFIG.FAUCET_BKC),
                `Faucet: ${ethers.formatEther(LIQUIDITY_CONFIG.FAUCET_BKC)} BKC`
            );

            // Fund Faucet com ETH
            await sendTxWithRetry(
                async () => await deployer.sendTransaction({
                    to: faucetAddr!,
                    value: ethers.parseEther("0.1")
                }),
                "Faucet: 0.1 ETH"
            );
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 13: BackchainGovernance (opcional)
        // ══════════════════════════════════════════════════════════════════════
        let governanceAddr = "";

        if (SECURITY_CONFIG.DEPLOY_GOVERNANCE) {
            setCurrentPhase("FASE 13: Governance");
            console.log("\n═══════════════════════════════════════════════════════════════════════");
            console.log("   FASE 13: Deploy BackchainGovernance");
            console.log("═══════════════════════════════════════════════════════════════════════");

            // BackchainGovernance constructor(uint256 _timelockDelay) — min 1h, max 30 days
            const BackchainGovernance = await ethers.getContractFactory("BackchainGovernance");
            const { contract: gov, address: govAddr } = await deployContractWithRetry(
                BackchainGovernance,
                [SECURITY_CONFIG.TIMELOCK_DELAY_SECONDS],
                "BackchainGovernance"
            );
            governanceAddr = govAddr;
            addresses.backchainGovernance = governanceAddr;
            updateAddressJSON("backchainGovernance", governanceAddr);

            console.log("   ℹ️  Governance deployed. Ownership transfer é manual (pós-verificação).");
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 14: Transferir BKC restante para Treasury
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 14: Transfer to Treasury");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 14: Transferir BKC restante para Treasury");
        console.log("═══════════════════════════════════════════════════════════════════════");

        if (deployerAddr.toLowerCase() !== treasuryAddr.toLowerCase()) {
            const remainingBkc = await bkc.balanceOf(deployerAddr);
            if (remainingBkc > 0n) {
                await sendTxWithRetry(
                    async () => await bkc.transfer(treasuryAddr, remainingBkc),
                    `Transfer ${ethers.formatEther(remainingBkc)} BKC → Treasury`
                );
            }
        } else {
            console.log("   ⏩ Deployer é o Treasury, nada a transferir");
        }

        // ══════════════════════════════════════════════════════════════════════
        // RESUMO FINAL
        // ══════════════════════════════════════════════════════════════════════
        console.log("\n════════════════════════════════════════════════════════════════════════════");
        console.log("                         📊 DEPLOY V10.0 CONCLUÍDO!");
        console.log("════════════════════════════════════════════════════════════════════════════");

        console.log("\n📋 CONTRATOS IMPLANTADOS:");
        console.log("────────────────────────────────────────────────────────────────");
        for (const [key, addr] of Object.entries(addresses)) {
            if (addr && addr.startsWith("0x")) {
                console.log(`   ${key}: ${addr}`);
            }
        }

        // Verificar balances finais
        const deployerBkc = await bkc.balanceOf(deployerAddr);
        const deployerEth = await ethers.provider.getBalance(deployerAddr);
        const fortuneBkc = await bkc.balanceOf(fortuneAddr);
        const lpBkc = await bkc.balanceOf(lpAddr);

        console.log("\n💧 LIQUIDEZ FINAL:");
        console.log(`   Deployer:       ${ethers.formatEther(deployerBkc)} BKC / ${ethers.formatEther(deployerEth)} ETH`);
        console.log(`   FortunePool:    ${ethers.formatEther(fortuneBkc)} BKC`);
        console.log(`   LiquidityPool:  ${ethers.formatEther(lpBkc)} BKC`);
        if (faucetAddr) {
            const faucetBkc = await bkc.balanceOf(faucetAddr);
            console.log(`   Faucet:         ${ethers.formatEther(faucetBkc)} BKC`);
        }

        console.log("\n🎨 NFT POOLS:");
        for (let i = 0; i < 4; i++) {
            const poolAddr = poolAddresses[i];
            try {
                const pool = poolContracts[i];
                const info = await pool.getPoolInfo();
                console.log(`   ${tierNames[i]}: ${info[0]} NFTs, ${ethers.formatEther(info[1])} BKC`);
            } catch (e) {
                console.log(`   ${tierNames[i]}: ${poolAddr} (erro ao verificar)`);
            }
        }

        console.log("\n🔧 CONFIGURAÇÃO:");
        console.log(`   BuybackMiner → minter autorizado no BKCToken`);
        console.log(`   BuybackMiner + Ecosystem → reward notifiers no StakingPool`);
        console.log(`   RewardBooster → configurado no StakingPool`);
        console.log(`   NFTFusion → authorized in RewardBooster`);
        console.log(`   8 módulos registrados no Ecosystem + 3 NFT pools extras`);
        console.log(`   ${actionIds.length} action fees configuradas (gas-based + value-based + fusion)`);
        console.log(`   ETH Distribution: 5% tutor | 15% operator | 30% treasury | 55% buyback`);
        console.log(`   BKC Distribution: ${BKC_DISTRIBUTION.operatorBps/100}% operator / ${BKC_DISTRIBUTION.stakerBps/100}% stakers / ${BKC_DISTRIBUTION.treasuryBps/100}% treasury`);
        console.log(`   Staking: V2 Recycle Model (60/40/30/20/0% per NFT tier, 10% burn if no tutor)`);
        console.log(`   Rental: 20% ecosystem fee (standard split, owner gets rentalCost directly)`);
        console.log(`   Tutor Bonus Pool: ${ethers.formatEther(LIQUIDITY_CONFIG.REFERRAL_BONUS_BKC)} BKC`);

        printTransactionSummary();

        console.log("\n────────────────────────────────────────────────────────────────");
        console.log(`   🎉 BACKCHAIN V10.0 IMPLANTADO COM SUCESSO!`);
        console.log(`   📡 Rede: ${networkName} ${isMainnet ? '(MAINNET)' : '(TESTNET)'}`);
        console.log(`   🔒 Todos os contratos são IMUTÁVEIS (sem proxy)`);
        if (governanceAddr) {
            console.log(`   🏛️ Governance: ${governanceAddr}`);
        }
        console.log("────────────────────────────────────────────────────────────────");

        // Ações pendentes pós-deploy
        console.log("\n⚠️  AÇÕES MANUAIS PENDENTES:");
        console.log("   1. Verificar contratos no Etherscan: npx hardhat run scripts/verify_contracts.ts");
        console.log("   2. Transferir ownership do Ecosystem para Governance (quando pronto)");
        console.log("   3. Chamar bkc.renounceMinterAdmin() quando não precisar mais adicionar minters");
        console.log("   4. Atualizar deployment-addresses.json no frontend");
        console.log("────────────────────────────────────────────────────────────────\n");

    } catch (error: any) {
        console.error("\n❌ ERRO:", error.message);
        console.error(error);
        saveTransactionLog();
        printTransactionSummary();
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
