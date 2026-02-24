// scripts/deploy_ecosystem.ts
// ════════════════════════════════════════════════════════════════════════════
// 🚀 BACKCHAIN ECOSYSTEM - DEPLOY COMPLETO V12.0 (IMUTÁVEL)
// ════════════════════════════════════════════════════════════════════════════
//
// V12.0: TODOS os contratos são imutáveis (sem UUPS proxy).
// - AirdropClaim: IGNORADO — tokens vão direto para Treasury
// - BKCToken: deployer-controlled minter, TGE 20M mint no constructor
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
        version: "12.0.0",
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
//                    ⚙️ CONFIGURAÇÃO GERAL
// ════════════════════════════════════════════════════════════════════════════

const DEPLOY_DELAY_MS = 2000;  // L2: blocos rápidos
const TX_DELAY_MS = 1000;
const RETRY_DELAY_MS = 3000;

// ════════════════════════════════════════════════════════════════════════════
//                    🎨 NFT TIERS CONFIG (V9: uint8 tiers 0-3)
// ════════════════════════════════════════════════════════════════════════════

// V3: Single Bronze pool with on-demand minting (no pre-minting needed).
// Pool mints NFTs via RewardBooster.poolMint() when users buy.
// Higher tiers obtained via NFTFusion (2→1 fuse).
const NFT_POOL_MINTABLE_RESERVES = 10_000; // 10,000 Bronze NFTs mintable on-demand
const NFT_POOL_VIRTUAL_RESERVES  = 100;    // Phantom depth — keeps spread ≤ 2% permanently

// ════════════════════════════════════════════════════════════════════════════
//                    💧 LIQUIDEZ INICIAL
// ════════════════════════════════════════════════════════════════════════════

const LIQUIDITY_CONFIG = {
    // ── Official Token Distribution (20M TGE) ──
    // Fortune:          1,000,000 BKC
    // NFT Pool Bronze:  2,000,000 BKC
    // Liquidity Pool:   4,000,000 BKC
    // Referral (1 BKC): 1,000,000 BKC
    // Treasury:        12,000,000 BKC (includes airdrop + reserve)
    // Total:           20,000,000 BKC ✓
    FORTUNE_POOL: 1_000_000n * 10n**18n,
    // Single Bronze pool with on-demand minting (V3)
    NFT_POOL_BKC: 2_000_000n * 10n**18n,  // 2M BKC
    // LiquidityPool: ETH + BKC initial liquidity (define o preço inicial)
    LIQUIDITY_POOL_BKC: 4_000_000n * 10n**18n,
    LIQUIDITY_POOL_ETH: "1.0", // 1 ETH → preço inicial: 0.00000025 ETH/BKC
    // Tutor BKC bonus pool (1 BKC per tutored wallet = 1M wallets max)
    TUTOR_BONUS_BKC: 1_000_000n * 10n**18n,
    // Remaining 12M (airdrop + reserve) goes to Treasury in FASE 14
};

// ════════════════════════════════════════════════════════════════════════════
//                    🚰 FAUCET CONFIG
// ════════════════════════════════════════════════════════════════════════════

const FAUCET_CONFIG = {
    ETH_PER_REQUEST: 1n * 10n**15n,  // 0.001 ETH per claim
    COOLDOWN_SECONDS: 86400, // 24h
};

// ════════════════════════════════════════════════════════════════════════════
//                    🪂 AIRDROP: IGNORADO — tokens vão direto para Treasury
// ════════════════════════════════════════════════════════════════════════════

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
    // Standard (staking, nft_pool, fortune, notary, nft_fusion): no custom recipient
    STANDARD:    { active: true, customBps: 0,    operatorBps: 1500, treasuryBps: 3000, buybackBps: 5500 },
    // Agora (50% to content creator, 15/30/55 on remaining 50%)
    AGORA:       { active: true, customBps: 5000, operatorBps: 750,  treasuryBps: 1500, buybackBps: 2750 },
    // Charity V11: 97% to campaign, 1/1/1 on remaining 3%
    CHARITY:     { active: true, customBps: 9700, operatorBps: 100,  treasuryBps: 100,  buybackBps: 100 },
    // Rental V11: 90% to owner, 3/2/5 on remaining 10%
    RENTAL:      { active: true, customBps: 9000, operatorBps: 300,  treasuryBps: 200,  buybackBps: 500 },
};

// ════════════════════════════════════════════════════════════════════════════
//                    💰 ACTION FEE CONFIGS (V10: FeeConfig per action)
// ════════════════════════════════════════════════════════════════════════════
// FeeConfig: { feeType: uint8, bps: uint16, multiplier: uint32, gasEstimate: uint32 }
// feeType: 0 = gas-based (gasEstimate × gasPrice × bps × multiplier / 10000)
// feeType: 1 = value-based (txValue × bps / 10000)
//
// V12 Fee Tiers (fixed fees — gasEstimate × multiplier = direct wei amount):
// On Sepolia/opBNB: prices denominated in native token (ETH/BNB)
//   SOCIAL:    low-friction actions (like, follow, reply, claim)
//   CONTENT:   content creation (post, certify, report)
//   FINANCIAL: financial actions (delegate, NFT buy/sell, fortune tier1/2)
//   PREMIUM:   premium services (profile boost)
//   BADGE_*:   annual subscriptions via high multipliers

const FEE_TYPE_GAS = 0;
const FEE_TYPE_VALUE = 1;
const FEE_TYPE_FIXED = 2;

// ── V11 Fixed Fee Tiers ──
// feeType=2: fee = gasEstimate × multiplier (direct wei amount)
// Both gasEstimate and multiplier are uint32 (max ~4.3e9).
// Split weiAmount into gasEstimate × multiplier where both fit in uint32.
const UINT32_MAX = 4_294_967_295n;
const FIXED = (weiAmount: bigint) => {
    // Try 1e6 multiplier first (works up to ~4.3e15 ≈ 0.0043 ETH)
    let multiplier = 1_000_000n;
    let gasEst = weiAmount / multiplier;
    if (gasEst > UINT32_MAX) {
        // Fallback to 1e9 multiplier (works up to ~4.3e18 ≈ 4.3 ETH)
        multiplier = 1_000_000_000n;
        gasEst = weiAmount / multiplier;
    }
    if (gasEst * multiplier !== weiAmount) {
        throw new Error(`FIXED: cannot split ${weiAmount} into uint32 × uint32`);
    }
    return { feeType: FEE_TYPE_FIXED, bps: 0, multiplier: Number(multiplier), gasEstimate: Number(gasEst) };
};

// V12 Fee tiers (individually configurable post-deploy via setFeeConfig)
// Values in native token (ETH on testnet, BNB on opBNB mainnet)
const FIXED_MICRO     = FIXED(30000000000000n);    // 0.00003  (~$0.02)
const FIXED_SOCIAL    = FIXED(80000000000000n);    // 0.00008  (~$0.05)
const FIXED_CONTENT   = FIXED(200000000000000n);   // 0.0002   (~$0.12)
const FIXED_FINANCIAL = FIXED(500000000000000n);    // 0.0005   (~$0.30)
const FIXED_PREMIUM   = FIXED(1000000000000000n);   // 0.001    (~$0.60)
const FIXED_HIGH      = FIXED(5000000000000000n);   // 0.005    (~$3.00)

// Staking-specific fees (higher to feed buyback)
const FIXED_STAKE_DELEGATE = FIXED(150000000000000n);    // 0.00015  (~$0.09)
const FIXED_STAKE_CLAIM    = FIXED(400000000000000n);    // 0.0004   (~$0.24)
const FIXED_STAKE_FORCE    = FIXED(1700000000000000n);   // 0.0017   (~$1.00)

// Badge tiers (annual subscriptions — fixed prices)
const FIXED_BADGE_VERIFIED = FIXED(50000000000000000n);   // 0.05   (~$30/year)
const FIXED_BADGE_PREMIUM  = FIXED(250000000000000000n);  // 0.25   (~$150/year)
const FIXED_BADGE_ELITE    = FIXED(600000000000000000n);  // 0.6    (~$360/year)

// Todas as ações do ecossistema e suas taxas (V11: fixed fees)
// Nota: ações com string usam ethers.id(), ações NFT usam abi.encode(string, uint8)
const ACTION_FEE_CONFIGS: Record<string, { feeType: number; bps: number; multiplier: number; gasEstimate: number }> = {
    // ── StakingPool (higher fees to feed buyback) ──
    "STAKING_DELEGATE":       FIXED_STAKE_DELEGATE,  // 0.00015 (~$0.09)
    "STAKING_CLAIM":          FIXED_STAKE_CLAIM,     // 0.0004  (~$0.24)
    "STAKING_FORCE_UNSTAKE":  FIXED_STAKE_FORCE,     // 0.0017  (~$1.00)
    // ── Agora (social — micro fees for high volume) ──
    "AGORA_LIKE":             FIXED_MICRO,     // 0.00003 (~$0.02)
    "AGORA_FOLLOW":           FIXED_MICRO,     // 0.00003 (~$0.02)
    "AGORA_REPLY":            FIXED_MICRO,     // 0.00003 (~$0.02)
    "AGORA_REPOST":           FIXED_MICRO,     // 0.00003 (~$0.02)
    "AGORA_DOWNVOTE":         FIXED_SOCIAL,    // 0.00008 (~$0.05)
    "AGORA_REPORT":           FIXED_SOCIAL,    // 0.00008 (~$0.05)
    "AGORA_POST":             FIXED_CONTENT,   // 0.0002  (~$0.12)
    "AGORA_POST_IMAGE":       FIXED_CONTENT,   // 0.0002  (~$0.12)
    "AGORA_POST_VIDEO":       FIXED_CONTENT,   // 0.0002  (~$0.12)
    "AGORA_LIVE":             FIXED_FINANCIAL,  // 0.0005  (~$0.30)
    "AGORA_BOOST_STD":        FIXED_PREMIUM,   // 0.001   (~$0.60)
    "AGORA_BOOST_FEAT":       FIXED_HIGH,      // 0.005   (~$3.00)
    "AGORA_PROFILE_BOOST":    FIXED_PREMIUM,   // 0.001   (~$0.60)
    "AGORA_BADGE_VERIFIED":   FIXED_BADGE_VERIFIED,  // 0.05  (~$30)
    "AGORA_BADGE_PREMIUM":    FIXED_BADGE_PREMIUM,   // 0.25  (~$150)
    "AGORA_BADGE_ELITE":      FIXED_BADGE_ELITE,     // 0.6   (~$360)
    // ── FortunePool (tier 0 most expensive — easiest to win) ──
    "FORTUNE_TIER0":          FIXED_CONTENT,   // 0.0002  (~$0.12) — 1/5 odds
    "FORTUNE_TIER1":          FIXED_SOCIAL,    // 0.00008 (~$0.05) — 1/10 odds
    "FORTUNE_TIER2":          FIXED_MICRO,     // 0.00003 (~$0.02) — 1/150 odds
    // ── Notary / Cartório Digital ──
    "NOTARY_CERTIFY":         FIXED_FINANCIAL, // 0.0005  (~$0.30)
    "NOTARY_TRANSFER":        FIXED_CONTENT,   // 0.0002  (~$0.12)
    "ASSET_REGISTER":         FIXED_PREMIUM,   // 0.001   (~$0.60)
    "ASSET_TRANSFER":         FIXED_FINANCIAL, // 0.0005  (~$0.30)
    "ASSET_ANNOTATE":         FIXED_CONTENT,   // 0.0002  (~$0.12)
    // ── CharityPool ──
    "CHARITY_CREATE":         FIXED_FINANCIAL, // 0.0005  (~$0.30)
    "CHARITY_BOOST":          FIXED_CONTENT,   // 0.0002  (~$0.12)
    // ── RentalManager ──
    "RENTAL_BOOST":           FIXED_PREMIUM,   // 0.001   (~$0.60)
    // (RENTAL_RENT e CHARITY_DONATE são value-based, definidos separadamente)
    // ── NFTFusion (ascending fees by tier) ──
    "FUSION_BRONZE":          FIXED_CONTENT,   // 0.0002  (~$0.12)
    "FUSION_SILVER":          FIXED_FINANCIAL,  // 0.0005  (~$0.30)
    "FUSION_GOLD":            FIXED_PREMIUM,   // 0.001   (~$0.60)
    "SPLIT_SILVER":           FIXED_FINANCIAL,  // 0.0005  (~$0.30)
    "SPLIT_GOLD":             FIXED_PREMIUM,   // 0.001   (~$0.60)
    "SPLIT_DIAMOND":          FIXED_HIGH,      // 0.005   (~$3.00)
};

// Ações value-based (percentage of transaction value)
const VALUE_FEE_CONFIGS: Record<string, { bps: number }> = {
    "CHARITY_DONATE": { bps: 300 },    // 3% da doação
    "RENTAL_RENT":    { bps: 2000 },   // 20% do custo de aluguel
};

// NFTPool actions (per-tier, sell 2x buy for price stability)
// Uses abi.encode("NFT_BUY_T"|"NFT_SELL_T", tier) for action IDs
const NFT_BUY_FEES = [
    FIXED_SOCIAL,     // T0 Bronze: 0.00008 (~$0.05)
    FIXED_CONTENT,    // T1 Silver: 0.0002  (~$0.12)
    FIXED_FINANCIAL,  // T2 Gold:   0.0005  (~$0.30)
    FIXED_PREMIUM,    // T3 Diamond: 0.001  (~$0.60)
];
const NFT_SELL_FEES = [
    FIXED(160000000000000n),    // T0 Bronze: 0.00016 (~$0.10) = 2x buy
    FIXED(400000000000000n),    // T1 Silver: 0.0004  (~$0.24) = 2x buy
    FIXED(1000000000000000n),   // T2 Gold:   0.001   (~$0.60) = 2x buy
    FIXED(2000000000000000n),   // T3 Diamond: 0.002  (~$1.20) = 2x buy
];

// Agora username pricing (per-length, 7+ chars = free)
// Uses abi.encode("AGORA_USERNAME", length) for action IDs
const USERNAME_FEES: Record<number, ReturnType<typeof FIXED>> = {
    1: FIXED(500000000000000000n),  // 1 char: 0.5    (~$300)
    2: FIXED(100000000000000000n),  // 2 chars: 0.1   (~$60)
    3: FIXED(50000000000000000n),   // 3 chars: 0.05  (~$30)
    4: FIXED(10000000000000000n),   // 4 chars: 0.01  (~$6)
    5: FIXED(5000000000000000n),    // 5 chars: 0.005 (~$3)
    6: FIXED(1000000000000000n),    // 6 chars: 0.001 (~$0.60)
};

// ════════════════════════════════════════════════════════════════════════════
//                    🔥 BKC DISTRIBUTION (burn / operator / stakers / treasury)
// ════════════════════════════════════════════════════════════════════════════
// burn + operator + staker + treasury = 10000
// V12: 5% burn + 95% stakers (operators/treasury earn only ETH/BNB)

const BKC_DISTRIBUTION = {
    burnBps: 500,       // 5% burn (constant deflation via BuybackMiner)
    operatorBps: 0,     // 0% — operators earn only ETH/BNB
    stakerBps: 9500,    // 95% to stakers via notifyReward
    treasuryBps: 0,     // 0% — treasury earns only ETH/BNB
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
        VERSION: "12.0.0",
        DESCRIPTION: "Backchain Ecosystem V12.0 - All Immutable Contracts + Fixed Fees + Batch Actions",
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
//                    🚀 SCRIPT PRINCIPAL V12.0
// ════════════════════════════════════════════════════════════════════════════

async function main() {
    const hre = require("hardhat");
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    const isMainnet = networkName === "opbnbMainnet";

    const chainId = Number((await ethers.provider.getNetwork()).chainId);
    initTransactionLog(networkName, chainId, deployer.address);

    console.log("\n\n════════════════════════════════════════════════════════════════════════════");
    console.log("               🚀 BACKCHAIN ECOSYSTEM DEPLOY V12.0 (IMUTÁVEL)");
    console.log("════════════════════════════════════════════════════════════════════════════");
    console.log(`   Network:     ${networkName} (chainId: ${chainId})`);
    console.log(`   Deployer:    ${deployer.address}`);
    console.log(`   Balance:     ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
    console.log(`   Treasury:    ${SYSTEM_WALLETS.TREASURY}`);
    console.log(`   Mode:        ${isMainnet ? '🔴 MAINNET' : '🟢 TESTNET'}`);
    console.log("════════════════════════════════════════════════════════════════════════════");
    console.log("   ⚠️  V12.0: TODOS os contratos são IMUTÁVEIS (sem proxy)");
    console.log("════════════════════════════════════════════════════════════════════════════\n");

    try {
        clearConfigFiles(networkName);
        const addresses: Record<string, string> = {};

        // ══════════════════════════════════════════════════════════════════════
        // FASE 1: BKCToken (TGE mint no constructor)
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 1: BKCToken");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 1: Deploy BKCToken (TGE: 20M mint no constructor)");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // BKCToken constructor(address _treasury) — mints 20M to _treasury
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

        // V3: No pre-minting needed — pool mints on-demand via poolMint()
        console.log(`   ℹ️  V3: No pre-minting. Pool mints ${NFT_POOL_MINTABLE_RESERVES} Bronze on-demand.`);

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
        // FASE 7: NFTPool (single Bronze pool with on-demand minting)
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 7: NFTPool Bronze");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 7: Deploy Single Bronze NFTPool + Initialize");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // NFTPool V3 constructor: (ecosystem, bkcToken, rewardBooster, tier, virtualReserves, mintableReserves)
        const NFTPool = await ethers.getContractFactory("NFTPool");
        const bronzeMintable = NFT_POOL_MINTABLE_RESERVES;
        const bronzeVirtual  = NFT_POOL_VIRTUAL_RESERVES;
        const bronzeBkcAmount = LIQUIDITY_CONFIG.NFT_POOL_BKC;

        const { contract: bronzePool, address: bronzePoolAddr } = await deployContractWithRetry(
            NFTPool, [ecoAddr, bkcAddr, boosterAddr, 0, bronzeVirtual, bronzeMintable], "NFTPool_bronze"
        );
        addresses.pool_bronze = bronzePoolAddr;
        updateAddressJSON("pool_bronze", bronzePoolAddr);

        // configurePools no RewardBooster (IRREVERSÍVEL!)
        // Single pool — pass zeros for unused slots
        console.log("\n   🔒 configurePools no RewardBooster (IRREVERSÍVEL)...");
        await sendTxWithRetry(
            async () => await booster.configurePools([
                bronzePoolAddr, ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress
            ]),
            "RewardBooster.configurePools([bronze, 0, 0, 0])"
        );

        // Initialize Bronze pool: 0 real NFTs + 1M BKC (10,000 mintable on-demand)
        {
            console.log(`\n   📦 Inicializando BRONZE Pool: ${bronzeMintable} mintable + ${bronzeVirtual} virtual + ${ethers.formatEther(bronzeBkcAmount)} BKC (spread ≤ ${(200 / (bronzeVirtual + bronzeMintable - 1)).toFixed(1)}%)`);

            await sendTxWithRetry(
                async () => await bkc.approve(bronzePoolAddr, bronzeBkcAmount),
                "Approve BKC para bronze pool"
            );
            await sendTxWithRetry(
                async () => await bronzePool.initializePool([], bronzeBkcAmount),
                `initializePool bronze: 0 real + ${bronzeMintable} mintable + ${bronzeVirtual} virtual + ${ethers.formatEther(bronzeBkcAmount)} BKC`
            );
            console.log(`   ✅ Bronze pool inicializado! (${bronzeMintable} mintable + ${bronzeVirtual} virtual reserves)`);
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

        // V11: Set reveal delay to 2 blocks (default is 2, but explicit for clarity)
        await sendTxWithRetry(
            async () => await fortune.setRevealDelay(2),
            "FortunePool.setRevealDelay(2)"
        );

        // Agora constructor(address _ecosystem)
        const Agora = await ethers.getContractFactory("Agora");
        const { contract: agora, address: agoraAddr } = await deployContractWithRetry(
            Agora, [ecoAddr], "Agora"
        );
        addresses.agora = agoraAddr;
        updateAddressJSON("agora", agoraAddr);

        // Notary constructor(address _ecosystem, string memory baseTokenURI_)
        const Notary = await ethers.getContractFactory("Notary");
        const notaryBaseURI = "https://backcoin.org/api/cert-metadata/";
        const { contract: notary, address: notaryAddr } = await deployContractWithRetry(
            Notary, [ecoAddr, notaryBaseURI], "Notary"
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
        // FASE 8b: AirdropClaim — IGNORADO (tokens vão para Treasury)
        // ══════════════════════════════════════════════════════════════════════
        console.log("\n   ⏩ FASE 8b: AirdropClaim IGNORADO — 12M BKC vai para Treasury em FASE 14");

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
            stakingAddr, bronzePoolAddr, fortuneAddr, agoraAddr,
            notaryAddr, charityAddr, rentalAddr, fusionAddr,
        ];
        const moduleIds = [
            ethers.id("STAKING"), ethers.id("NFT_POOL"), ethers.id("FORTUNE"), ethers.id("AGORA"),
            ethers.id("NOTARY"), ethers.id("CHARITY"), ethers.id("RENTAL"), ethers.id("NFT_FUSION"),
        ];
        const moduleConfigs = [
            MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.AGORA,
            MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.CHARITY, MODULE_CONFIGS.RENTAL, MODULE_CONFIGS.STANDARD,
        ];

        // Converter para o formato do struct: [active, customBps, operatorBps, treasuryBps, buybackBps]
        const moduleConfigsTuples = moduleConfigs.map(c => [
            c.active, c.customBps, c.operatorBps, c.treasuryBps, c.buybackBps
        ]);

        await sendTxWithRetry(
            async () => await eco.registerModuleBatch(moduleContracts, moduleIds, moduleConfigsTuples),
            "Ecosystem.registerModuleBatch() — 8 módulos"
        );

        console.log("   ✅ Todos os módulos registrados (8 total: 1 Bronze pool, sem AirdropClaim)!");

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

        // 3) NFTPool actions — per-tier buy/sell (sell 2x buy for stability)
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        for (let tier = 0; tier < 4; tier++) {
            const buyFee = NFT_BUY_FEES[tier];
            const buyActionId = ethers.keccak256(abiCoder.encode(["string", "uint8"], ["NFT_BUY_T", tier]));
            actionIds.push(buyActionId);
            feeConfigs.push([buyFee.feeType, buyFee.bps, buyFee.multiplier, buyFee.gasEstimate]);

            const sellFee = NFT_SELL_FEES[tier];
            const sellActionId = ethers.keccak256(abiCoder.encode(["string", "uint8"], ["NFT_SELL_T", tier]));
            actionIds.push(sellActionId);
            feeConfigs.push([sellFee.feeType, sellFee.bps, sellFee.multiplier, sellFee.gasEstimate]);
        }

        // 4) Agora username fees — per-length (7+ chars = free, no config needed)
        for (const [lengthStr, fee] of Object.entries(USERNAME_FEES)) {
            const length = Number(lengthStr);
            const usernameActionId = ethers.keccak256(abiCoder.encode(["string", "uint256"], ["AGORA_USERNAME", length]));
            actionIds.push(usernameActionId);
            feeConfigs.push([fee.feeType, fee.bps, fee.multiplier, fee.gasEstimate]);
        }

        console.log(`   📋 Configurando ${actionIds.length} action fees...`);

        await sendTxWithRetry(
            async () => await eco.setFeeConfigBatch(actionIds, feeConfigs),
            `Ecosystem.setFeeConfigBatch() — ${actionIds.length} ações`
        );

        // 5) BKC Distribution (burn / operator / stakers / treasury)
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
        updateRulesJSON("feeConfigs", "usernameActions", Object.keys(USERNAME_FEES).length.toString());
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

        console.log("   ✅ StakingPool configurado + BuybackMiner minter!");

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

        // Fund Tutor Bonus Pool (1M BKC — 1 BKC per tutored wallet, up to 1M wallets)
        const tutorBonusBkc = LIQUIDITY_CONFIG.TUTOR_BONUS_BKC;
        await sendTxWithRetry(
            async () => await bkc.approve(ecoAddr, tutorBonusBkc),
            "Approve BKC para Tutor Bonus Pool"
        );
        await sendTxWithRetry(
            async () => await eco.fundTutorBonus(tutorBonusBkc),
            `Ecosystem.fundTutorBonus(${ethers.formatEther(tutorBonusBkc)} BKC)`
        );

        // AirdropClaim IGNORADO — 12M BKC permanece com deployer → Treasury em FASE 14
        console.log("   ⏩ AirdropClaim ignorado — 12M BKC restante vai para Treasury");

        // ══════════════════════════════════════════════════════════════════════
        // FASE 12: Faucet (testnet only)
        // ══════════════════════════════════════════════════════════════════════
        let faucetAddr: string | null = null;

        if (!isMainnet) {
            setCurrentPhase("FASE 12: Faucet");
            console.log("\n═══════════════════════════════════════════════════════════════════════");
            console.log("   FASE 12: Deploy SimpleBKCFaucet (Testnet)");
            console.log("═══════════════════════════════════════════════════════════════════════");

            // SimpleBKCFaucet V2: ETH-only (no BKC distribution)
            // constructor(address _relayer, uint256 _ethPerClaim, uint256 _cooldown)
            const SimpleBKCFaucet = await ethers.getContractFactory("SimpleBKCFaucet");
            const { contract: faucet, address: fAddr } = await deployContractWithRetry(
                SimpleBKCFaucet,
                [deployerAddr, FAUCET_CONFIG.ETH_PER_REQUEST, FAUCET_CONFIG.COOLDOWN_SECONDS],
                "SimpleBKCFaucet"
            );
            faucetAddr = fAddr;
            addresses.simpleBkcFaucet = faucetAddr;
            updateAddressJSON("simpleBkcFaucet", faucetAddr);

            // Fund Faucet com ETH apenas (1 ETH para testnet)
            await sendTxWithRetry(
                async () => await deployer.sendTransaction({
                    to: faucetAddr!,
                    value: ethers.parseEther("1.0")
                }),
                "Faucet: 1.0 ETH (ETH-only, no BKC)"
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
        console.log("                         📊 DEPLOY V12.0 CONCLUÍDO!");
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
        console.log(`   Treasury:       12M BKC (airdrop + reserve — transferred in FASE 14)`);
        if (faucetAddr) {
            const faucetEth = await ethers.provider.getBalance(faucetAddr);
            console.log(`   Faucet:         ${ethers.formatEther(faucetEth)} ETH (ETH-only)`);
        }

        console.log("\n🎨 NFT POOL (Single Bronze):");
        try {
            const info = await bronzePool.getPoolInfo();
            console.log(`   Bronze: ${info[1]} real NFTs, ${info[4]} mintable, ${ethers.formatEther(info[0])} BKC`);
            console.log(`   Effective count: ${info[2]}, K: ${info[5]}`);
        } catch (e) {
            console.log(`   Bronze: ${bronzePoolAddr} (erro ao verificar)`);
        }

        console.log("\n🔧 CONFIGURAÇÃO:");
        console.log(`   BuybackMiner → minter autorizado no BKCToken`);
        console.log(`   BuybackMiner + Ecosystem → reward notifiers no StakingPool`);
        console.log(`   RewardBooster → configurado no StakingPool`);
        console.log(`   NFTFusion → authorized in RewardBooster`);
        console.log(`   8 módulos registrados no Ecosystem (1 Bronze pool, sem AirdropClaim)`);
        console.log(`   ${actionIds.length} action fees configuradas (gas-based + value-based + fusion)`);
        console.log(`   ETH Distribution: 5% tutor | 15% operator | 30% treasury | 55% buyback`);
        console.log(`   BKC Distribution: ${BKC_DISTRIBUTION.operatorBps/100}% operator / ${BKC_DISTRIBUTION.stakerBps/100}% stakers / ${BKC_DISTRIBUTION.treasuryBps/100}% treasury`);
        console.log(`   Staking: V2 Recycle Model (60/40/30/20/0% per NFT tier, 10% burn if no tutor)`);
        console.log(`   Rental: 20% ecosystem fee (standard split, owner gets rentalCost directly)`);
        console.log(`   Tutor Bonus Pool: ${ethers.formatEther(LIQUIDITY_CONFIG.TUTOR_BONUS_BKC)} BKC (1 BKC/wallet, ~1M wallets)`);

        printTransactionSummary();

        console.log("\n────────────────────────────────────────────────────────────────");
        console.log(`   🎉 BACKCHAIN V12.0 IMPLANTADO COM SUCESSO!`);
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
