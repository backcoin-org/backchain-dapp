// scripts/deploy_ecosystem.ts
// ════════════════════════════════════════════════════════════════════════════
// 🚀 BACKCHAIN ECOSYSTEM - DEPLOY COMPLETO UNIFICADO V6.9 (BACKCHAT V7)
// ════════════════════════════════════════════════════════════════════════════
//
// CHANGELOG V6.9:
// - BREAKING: Backchat V7 agora é contrato NÃO-UPGRADEABLE (sem proxy)
// - BREAKING: Backchat V7 constructor: (bkcToken, ecosystemManager)
// - REMOVED: Toda configuração pós-deploy do Backchat (hardcoded no contrato)
// - REMOVED: configureBackchat() - não há mais nada para configurar
// - FIX: Deploy direto do Backchat (não usa deployProxy)
//
// CHANGELOG V6.8:
// - FIX: FortunePool revealDelay reduzido de 5 para 2 blocos ArbOS (~30s)
//
// CHANGELOG V6.7:
// - FIX: Busca nonce fresco antes de CADA transação (evita "nonce too high")
// - FIX: Depósito de NFTs agora é sequencial com nonce dinâmico
//
// ════════════════════════════════════════════════════════════════════════════

import { HardhatRuntimeEnvironment } from "hardhat/types";
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
    implementationAddress?: string;
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
        version: "6.9.0",
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
//                    🔴 CONTRATOS EXTERNOS - CONFIGURAR AQUI
// ════════════════════════════════════════════════════════════════════════════

const EXTERNAL_CONTRACTS = {
    BACKCOIN_ORACLE: "0x16346f5a45f9615f1c894414989f0891c54ef07b",
};

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
    TRANSFER_OWNERSHIP_TO_GOVERNANCE: true,
    ENABLE_TIMELOCK: false,
    TIMELOCK_DELAY_SECONDS: 172800n,
    INITIAL_GOVERNANCE_PHASE: 0,
    VERIFY_OWNERSHIP_POST_DEPLOY: true,
    LOG_SECURITY_SUMMARY: true,
    PAUSE_BEFORE_MAINNET_DEPLOY: true,
    MAINNET_CONFIRMATION_DELAY_MS: 15000,
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
const MAX_RPC_FAILURES = 3;

// ════════════════════════════════════════════════════════════════════════════
//                    ⚙️ CONFIGURAÇÃO GERAL
// ════════════════════════════════════════════════════════════════════════════

const DEPLOY_DELAY_MS = 5000;
const TX_DELAY_MS = 2000;
const RETRY_DELAY_MS = 5000;

const IPFS_BASE_URI_BOOSTERS = "ipfs://bafybeibtfnc6zgeiayglticrk2bqqgleybpgageh723grbdtsdddoicwtu/";

// ════════════════════════════════════════════════════════════════════════════
//                    💰 TAXAS OFICIAIS
// ════════════════════════════════════════════════════════════════════════════

const SERVICE_FEES_BIPS = {
    DELEGATION_FEE_BIPS: 50n,
    UNSTAKE_FEE_BIPS: 100n,
    FORCE_UNSTAKE_PENALTY_BIPS: 5000n,
    CLAIM_REWARD_FEE_BIPS: 100n,
    NFT_POOL_BUY_TAX_BIPS: 500n,
    NFT_POOL_SELL_TAX_BIPS: 1000n,
    FORTUNE_POOL_GAME_FEE: 1000n,
    RENTAL_MARKET_TAX_BIPS: 1000n,
};

const SERVICE_FEES_FIXED = {
    NOTARY_SERVICE: "1"
};

const FORTUNE_SERVICE_FEE_1X = "0.000001";

// ════════════════════════════════════════════════════════════════════════════
//                    🎗️ CHARITY POOL CONFIG
// ════════════════════════════════════════════════════════════════════════════

const CHARITY_CONFIG = {
    SERVICE_KEY: "CHARITY_POOL_SERVICE",
    DONATION_FEE_BIPS: 500n,
    WITHDRAWAL_FEE_ETH: "0.001",
    GOAL_NOT_MET_PENALTY_BIPS: 1000n,
    MIN_DONATION_AMOUNT: "1",
    MAX_ACTIVE_CAMPAIGNS_PER_WALLET: 20n,
};

// ════════════════════════════════════════════════════════════════════════════
//                    💬 BACKCHAT V7 CONFIG (MINIMAL - HARDCODED NO CONTRATO)
// ════════════════════════════════════════════════════════════════════════════
//
// NOTA V6.9: Backchat V7 tem TODAS as configurações hardcoded como constants:
// - FEE_PERCENT = 20% do gas
// - CREATOR_BIPS = 4000 (40%)
// - OPERATOR_BIPS = 3000 (30%)
// - TREASURY_BIPS = 3000 (30%)
// - CREATOR_TIP_BIPS = 9000 (90%)
// - MINING_TIP_BIPS = 1000 (10%)
// - etc.
//
// Não há mais funções de configuração pós-deploy!
//
const BACKCHAT_CONFIG = {
    SERVICE_KEY: "BACKCHAT_SERVICE",  // Ainda precisa para autorizar no MiningManager
};

// ════════════════════════════════════════════════════════════════════════════
//                    🚀 RENTAL MANAGER V3.1 CONFIG
// ════════════════════════════════════════════════════════════════════════════

const RENTAL_CONFIG = {
    ENABLE_METAADS: true,
    RENTAL_FEE_BIPS: 1000n,
    RENTAL_MINING_FEE_BIPS: 700n,
    RENTAL_BURN_FEE_BIPS: 300n,
    SPOTLIGHT_DECAY_PER_DAY_BIPS: 100n,
    MIN_SPOTLIGHT_AMOUNT: "0.0001",
};

// ════════════════════════════════════════════════════════════════════════════
//                    🔥 MINING MANAGER V2 CONFIG
// ════════════════════════════════════════════════════════════════════════════

const MINING_MANAGER_CONFIG = {
    FEE_BURN_RATE_BIPS: 1000n,
    MINING_BURN_RATE_BIPS: 0n,
};

// ════════════════════════════════════════════════════════════════════════════
//                    📊 DISTRIBUIÇÃO DE REWARDS
// ════════════════════════════════════════════════════════════════════════════

const DISTRIBUTION = {
    mining: { TREASURY: 3000n, DELEGATOR_POOL: 7000n },
    fee: { TREASURY: 3000n, DELEGATOR_POOL: 7000n }
};

// ════════════════════════════════════════════════════════════════════════════
//                    ⭐ BOOSTER DISCOUNTS
// ════════════════════════════════════════════════════════════════════════════

const BOOSTER_DISCOUNTS = [
    { boostBips: 5000n, discountBips: 5000n, name: "Diamond" },
    { boostBips: 4000n, discountBips: 4000n, name: "Gold" },
    { boostBips: 2500n, discountBips: 2500n, name: "Silver" },
    { boostBips: 1000n, discountBips: 1000n, name: "Bronze" },
];

// ════════════════════════════════════════════════════════════════════════════
//                    🎰 FORTUNE POOL CONFIG
// ════════════════════════════════════════════════════════════════════════════

const FORTUNE_TIERS = [
    { tierId: 1, name: "Easy",   range: 3,   multiplierBips: 20000 },
    { tierId: 2, name: "Medium", range: 10,  multiplierBips: 50000 },
    { tierId: 3, name: "Hard",   range: 100, multiplierBips: 500000 }
];

// ════════════════════════════════════════════════════════════════════════════
//                    🎨 NFT TIERS CONFIG
// ════════════════════════════════════════════════════════════════════════════

const NFT_TIERS = [
    { tierId: 1, name: "Diamond",  boostBips: 5000n, metadata: "diamond_booster.json",  mintCount: 10n },
    { tierId: 2, name: "Gold",     boostBips: 4000n, metadata: "gold_booster.json",     mintCount: 30n },
    { tierId: 3, name: "Silver",   boostBips: 2500n, metadata: "silver_booster.json",   mintCount: 50n },
    { tierId: 4, name: "Bronze",   boostBips: 1000n, metadata: "bronze_booster.json",   mintCount: 100n },
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
//                    🚰 FAUCET CONFIG
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
        VERSION: "6.9.0",
        DESCRIPTION: "Backchain Ecosystem V6.9 - Backchat V7 (Non-Upgradeable)",
        NETWORK: networkName,
        CREATED_AT: new Date().toISOString(),
        externalContracts: { BACKCOIN_ORACLE: EXTERNAL_CONTRACTS.BACKCOIN_ORACLE },
        wallets: { 
            TREASURY: SYSTEM_WALLETS.TREASURY,
            MULTISIG_ADMIN: SYSTEM_WALLETS.MULTISIG_ADMIN || "DEPLOYER"
        },
        security: {
            GOVERNANCE_DEPLOYED: SECURITY_CONFIG.DEPLOY_GOVERNANCE,
            OWNERSHIP_TRANSFERRED: SECURITY_CONFIG.TRANSFER_OWNERSHIP_TO_GOVERNANCE,
            TIMELOCK_ENABLED: SECURITY_CONFIG.ENABLE_TIMELOCK,
            TIMELOCK_DELAY_SECONDS: SECURITY_CONFIG.TIMELOCK_DELAY_SECONDS.toString(),
            GOVERNANCE_PHASE: SECURITY_CONFIG.INITIAL_GOVERNANCE_PHASE,
        },
        features: {
            METAADS_ENABLED: RENTAL_CONFIG.ENABLE_METAADS,
            BACKCHAT_ENABLED: true,
            BACKCHAT_VERSION: "V7.0.0 (Non-Upgradeable)",
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
                console.log(`   ❌ Attempt ${attempt}/${maxRetries}: ${msg.slice(0, 50)}`);
                console.log(`   ⏳ Aguardando ${waitTime/1000}s...`);
                await sleep(waitTime);
                continue;
            }
            
            console.log(`   ❌ Attempt ${attempt}/${maxRetries}: ${msg.slice(0, 80)}`);
            
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
//                    🔨 DEPLOY PROXY HELPER
// ════════════════════════════════════════════════════════════════════════════

async function deployProxyWithRetry(
    upgrades: any, 
    Factory: any, 
    args: any[], 
    name: string
): Promise<{ contract: any; address: string }> {
    console.log(`\n   📦 Deploying ${name} (UUPS Proxy)...`);
    
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            const contract = await upgrades.deployProxy(Factory, args, { 
                initializer: "initialize", 
                kind: "uups" 
            });
            await contract.waitForDeployment();
            const address = await contract.getAddress();
            
            let txHash = "N/A";
            let gasUsed = "0";
            let blockNumber = 0;
            let implAddress: string | undefined;
            
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
                implAddress = await upgrades.erc1967.getImplementationAddress(address);
            } catch (e) {}
            
            console.log(`   ✅ ${name}: ${address}`);
            console.log(`      📜 TX: ${txHash}`);
            if (implAddress) {
                console.log(`      📦 Impl: ${implAddress}`);
            }
            
            logDeployment({
                contractName: name,
                address,
                implementationAddress: implAddress,
                txHash,
                gasUsed,
                blockNumber,
            });
            
            await sleep(DEPLOY_DELAY_MS);
            return { contract, address };
        } catch (error: any) {
            const msg = error.message || "";
            console.log(`   ❌ Attempt ${attempt}/5: ${msg.slice(0, 60)}`);
            
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
//                    🔨 DEPLOY REGULAR CONTRACT HELPER (V6.9 - NEW!)
// ════════════════════════════════════════════════════════════════════════════

async function deployContractWithRetry(
    Factory: any, 
    args: any[], 
    name: string
): Promise<{ contract: any; address: string }> {
    console.log(`\n   📦 Deploying ${name} (Regular Contract)...`);
    
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
            console.log(`   ❌ Attempt ${attempt}/5: ${msg.slice(0, 60)}`);
            
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

    const serviceKeyHash = ethers.keccak256(ethers.toUtf8Bytes(CHARITY_CONFIG.SERVICE_KEY));

    await sendTxWithRetry(
        async () => await miningManager.setAuthorizedMiner(serviceKeyHash, charityAddr),
        `Autorizar CharityPool (${CHARITY_CONFIG.SERVICE_KEY})`
    );

    const createCostBkc = ethers.parseEther("0");
    const withdrawCostBkc = ethers.parseEther("0");
    const donationBips = CHARITY_CONFIG.DONATION_FEE_BIPS;
    const boostCostBkc = ethers.parseEther("0");
    const boostCostEth = ethers.parseEther("0.001");
    
    try {
        await sendTxWithRetry(
            async () => await charity.setFees(
                createCostBkc,
                withdrawCostBkc,
                donationBips,
                boostCostBkc,
                boostCostEth
            ),
            `CharityPool: setFees()`
        );
    } catch (e: any) {
        console.log(`   ⚠️ setFees falhou: ${e.message?.slice(0, 50)}`);
    }

    try {
        await sendTxWithRetry(
            async () => await charity.setMaxActiveCampaigns(
                Number(CHARITY_CONFIG.MAX_ACTIVE_CAMPAIGNS_PER_WALLET)
            ),
            `CharityPool: setMaxActiveCampaigns(${CHARITY_CONFIG.MAX_ACTIVE_CAMPAIGNS_PER_WALLET})`
        );
    } catch (e: any) {
        console.log(`   ⚠️ setMaxActiveCampaigns falhou: ${e.message?.slice(0, 50)}`);
    }

    updateRulesJSON("charityPool", "DONATION_FEE_BIPS", CHARITY_CONFIG.DONATION_FEE_BIPS.toString());
    updateRulesJSON("charityPool", "SERVICE_KEY", CHARITY_CONFIG.SERVICE_KEY);
    updateRulesJSON("charityPool", "VERSION", "V2");

    console.log("   ✅ CharityPool configurado!");
}

// ════════════════════════════════════════════════════════════════════════════
//                    🚀 RENTAL MANAGER CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

async function configureRentalManagerV3(
    rental: any,
    rentalAddr: string,
    treasuryAddr: string,
    ethers: any
) {
    console.log("\n🚀 Configurando RentalManager V3.1");
    console.log("────────────────────────────────────────────────────────────────");

    let currentTreasury: string;
    try {
        currentTreasury = await rental.treasury();
    } catch (e) {
        currentTreasury = ethers.ZeroAddress;
    }

    const needsInit = currentTreasury === ethers.ZeroAddress || 
                      currentTreasury === "0x0000000000000000000000000000000000000000";

    if (needsInit) {
        try {
            await sendTxWithRetry(
                async () => await rental.initializeV4(treasuryAddr),
                `RentalManager: initializeV4(${treasuryAddr.slice(0, 10)}...)`
            );
        } catch (e1: any) {
            try {
                await sendTxWithRetry(
                    async () => await rental.setTreasury(treasuryAddr),
                    `RentalManager: setTreasury()`
                );
            } catch (e2: any) {
                console.log(`   ⚠️ Treasury config falhou: ${e2.message?.slice(0, 50)}`);
            }
        }
    } else {
        console.log(`   ⏩ Treasury já configurado: ${currentTreasury.slice(0, 10)}...`);
    }

    const minSpotlightWei = ethers.parseEther(RENTAL_CONFIG.MIN_SPOTLIGHT_AMOUNT);
    try {
        await sendTxWithRetry(
            async () => await rental.setSpotlightConfig(
                RENTAL_CONFIG.SPOTLIGHT_DECAY_PER_DAY_BIPS,
                minSpotlightWei
            ),
            `RentalManager: setSpotlightConfig()`
        );
    } catch (e: any) {
        console.log(`   ⚠️ Spotlight config falhou: ${e.message?.slice(0, 50)}`);
    }

    updateRulesJSON("rentalManager", "ENABLED", "true");
    updateRulesJSON("rentalManager", "TREASURY", treasuryAddr);
    updateRulesJSON("rentalManager", "VERSION", "V3.1");

    console.log("   ✅ RentalManager configurado!");
}

// ════════════════════════════════════════════════════════════════════════════
//                    🛡️ SECURITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

async function verifyOwnership(contract: any, expectedOwner: string, contractName: string): Promise<boolean> {
    try {
        const owner = await contract.owner();
        const isCorrect = owner.toLowerCase() === expectedOwner.toLowerCase();
        if (isCorrect) {
            console.log(`   ✅ ${contractName}: owner = ${owner.slice(0, 10)}...${owner.slice(-6)}`);
        } else {
            console.log(`   ❌ ${contractName}: owner INCORRETO!`);
        }
        return isCorrect;
    } catch (e: any) {
        console.log(`   ⚠️ ${contractName}: Não foi possível verificar ownership`);
        return false;
    }
}

async function transferOwnershipSafe(contract: any, newOwner: string, contractName: string, deployer: string): Promise<boolean> {
    try {
        const currentOwner = await contract.owner();
        
        if (currentOwner.toLowerCase() === newOwner.toLowerCase()) {
            console.log(`   ⏩ ${contractName}: Ownership já transferido`);
            return true;
        }
        
        if (currentOwner.toLowerCase() !== deployer.toLowerCase()) {
            console.log(`   ⚠️ ${contractName}: Não somos o owner atual`);
            return false;
        }
        
        await sendTxWithRetry(
            async () => await contract.transferOwnership(newOwner),
            `${contractName}: transferOwnership → ${newOwner.slice(0, 10)}...`
        );
        return true;
    } catch (e: any) {
        console.log(`   ⚠️ ${contractName}: Falha ao transferir - ${e.message?.slice(0, 50)}`);
        return false;
    }
}

// ════════════════════════════════════════════════════════════════════════════
//                    🚀 SCRIPT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

async function main() {
    const hre = require("hardhat");
    const { ethers, upgrades } = hre;
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    const isMainnet = networkName === "arbitrum" || networkName === "arbitrumOne";
    RPC_ENDPOINTS = isMainnet ? MAINNET_RPC_ENDPOINTS : TESTNET_RPC_ENDPOINTS;
    RPC_ENDPOINTS.forEach(rpc => { rpcFailCounts[rpc.name] = 0; });

    const chainId = Number((await ethers.provider.getNetwork()).chainId);
    initTransactionLog(networkName, chainId, deployer.address);

    console.log("\n\n════════════════════════════════════════════════════════════════════════════");
    console.log("               🚀 BACKCHAIN ECOSYSTEM DEPLOY V6.9 (BACKCHAT V7)");
    console.log("════════════════════════════════════════════════════════════════════════════");
    console.log(`   Network:     ${networkName} (chainId: ${chainId})`);
    console.log(`   Deployer:    ${deployer.address}`);
    console.log(`   Balance:     ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
    console.log(`   Treasury:    ${SYSTEM_WALLETS.TREASURY}`);
    console.log(`   Mode:        ${isMainnet ? '🔴 MAINNET' : '🟢 TESTNET'}`);
    console.log("════════════════════════════════════════════════════════════════════════════");
    console.log("   ⚠️  NOTA: Backchat V7 é NÃO-UPGRADEABLE (deploy direto, sem proxy)");
    console.log("════════════════════════════════════════════════════════════════════════════\n");

    const oracleAddr = EXTERNAL_CONTRACTS.BACKCOIN_ORACLE;
    if (!oracleAddr || !oracleAddr.startsWith("0x") || oracleAddr.length !== 42) {
        console.error("❌ ERRO: BACKCOIN_ORACLE não configurado!");
        process.exit(1);
    }

    try {
        clearConfigFiles(networkName);
        let addresses: Record<string, string> = {};

        // ══════════════════════════════════════════════════════════════════════
        // FASE 1: Deploy Core Contracts (BKCToken + EcosystemManager)
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 1: Core Contracts");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 1: Deploy Core Contracts (BKCToken + EcosystemManager)");
        console.log("═══════════════════════════════════════════════════════════════════════");

        const BKCToken = await ethers.getContractFactory("BKCToken");
        const { contract: bkc, address: bkcAddr } = await deployProxyWithRetry(
            upgrades, BKCToken, [deployer.address], "BKCToken"
        );
        addresses.bkcToken = bkcAddr;
        updateAddressJSON("bkcToken", bkcAddr);

        await sendTxWithRetry(
            async () => await bkc.mint(deployer.address, LIQUIDITY_CONFIG.TGE_SUPPLY),
            `Mint ${ethers.formatEther(LIQUIDITY_CONFIG.TGE_SUPPLY)} BKC`
        );

        const EcosystemManager = await ethers.getContractFactory("EcosystemManager");
        const { contract: eco, address: ecoAddr } = await deployProxyWithRetry(
            upgrades, EcosystemManager, [deployer.address], "EcosystemManager"
        );
        addresses.ecosystemManager = ecoAddr;
        updateAddressJSON("ecosystemManager", ecoAddr);
        updateAddressJSON("backcoinOracle", oracleAddr);
        updateAddressJSON("treasuryWallet", SYSTEM_WALLETS.TREASURY);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 1B: Pre-configure EcosystemManager with BKCToken address
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 1B: Pre-configure EcosystemManager");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 1B: Pre-configure EcosystemManager (BKC Token Address)");
        console.log("═══════════════════════════════════════════════════════════════════════");

        await sendTxWithRetry(
            async () => await eco.setAddresses(
                bkcAddr,
                SYSTEM_WALLETS.TREASURY,
                ethers.ZeroAddress,
                ethers.ZeroAddress,
                ethers.ZeroAddress,
                ethers.ZeroAddress,
                ethers.ZeroAddress,
                ethers.ZeroAddress
            ),
            "Pre-configure EcosystemManager with BKCToken"
        );

        // ══════════════════════════════════════════════════════════════════════
        // FASE 1C: Deploy MiningManager
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 1C: Deploy MiningManager");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 1C: Deploy MiningManager");
        console.log("═══════════════════════════════════════════════════════════════════════");

        const MiningManager = await ethers.getContractFactory("MiningManager");
        const { contract: mining, address: miningAddr } = await deployProxyWithRetry(
            upgrades, MiningManager, [ecoAddr], "MiningManager"
        );
        addresses.miningManager = miningAddr;
        updateAddressJSON("miningManager", miningAddr);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 1D: Update EcosystemManager with MiningManager
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 1D: Update EcosystemManager");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 1D: Update EcosystemManager with MiningManager");
        console.log("═══════════════════════════════════════════════════════════════════════");

        await sendTxWithRetry(
            async () => await eco.setAddresses(
                bkcAddr,
                SYSTEM_WALLETS.TREASURY,
                ethers.ZeroAddress,
                ethers.ZeroAddress,
                miningAddr,
                ethers.ZeroAddress,
                ethers.ZeroAddress,
                ethers.ZeroAddress
            ),
            "Update EcosystemManager with MiningManager"
        );

        // ══════════════════════════════════════════════════════════════════════
        // FASE 2: Deploy Dependent Contracts
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 2: Deploy Dependent Contracts");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 2: Deploy Dependent Contracts");
        console.log("═══════════════════════════════════════════════════════════════════════");

        const RewardBoosterNFT = await ethers.getContractFactory("RewardBoosterNFT");
        const { contract: nft, address: nftAddr } = await deployProxyWithRetry(
            upgrades, RewardBoosterNFT, [deployer.address], "RewardBoosterNFT"
        );
        addresses.rewardBoosterNFT = nftAddr;
        updateAddressJSON("rewardBoosterNFT", nftAddr);

        const DelegationManager = await ethers.getContractFactory("DelegationManager");
        const { contract: delegation, address: delegationAddr } = await deployProxyWithRetry(
            upgrades, DelegationManager, [deployer.address, ecoAddr], "DelegationManager"
        );
        addresses.delegationManager = delegationAddr;
        updateAddressJSON("delegationManager", delegationAddr);

        const Notary = await ethers.getContractFactory("DecentralizedNotary");
        const { contract: notary, address: notaryAddr } = await deployProxyWithRetry(
            upgrades, Notary, [deployer.address, ecoAddr], "DecentralizedNotary"
        );
        addresses.decentralizedNotary = notaryAddr;
        updateAddressJSON("decentralizedNotary", notaryAddr);

        const FortunePool = await ethers.getContractFactory("FortunePool");
        const { contract: fortune, address: fortuneAddr } = await deployProxyWithRetry(
            upgrades, FortunePool, [deployer.address, ecoAddr], "FortunePool"
        );
        addresses.fortunePool = fortuneAddr;
        updateAddressJSON("fortunePool", fortuneAddr);

        const NFTLiquidityPool = await ethers.getContractFactory("NFTLiquidityPool");
        const poolImpl = await NFTLiquidityPool.deploy();
        await poolImpl.waitForDeployment();
        const poolImplAddr = await poolImpl.getAddress();
        console.log(`   ✅ NFTLiquidityPool Impl: ${poolImplAddr}`);
        addresses.nftLiquidityPool_Implementation = poolImplAddr;
        updateAddressJSON("nftLiquidityPool_Implementation", poolImplAddr);
        await sleep(DEPLOY_DELAY_MS);

        const NFTLiquidityPoolFactory = await ethers.getContractFactory("NFTLiquidityPoolFactory");
        const { contract: factory, address: factoryAddr } = await deployProxyWithRetry(
            upgrades, NFTLiquidityPoolFactory, [deployer.address, ecoAddr, poolImplAddr], "NFTLiquidityPoolFactory"
        );
        addresses.nftLiquidityPoolFactory = factoryAddr;
        updateAddressJSON("nftLiquidityPoolFactory", factoryAddr);

        const RentalManager = await ethers.getContractFactory("RentalManager");
        const { contract: rental, address: rentalAddr } = await deployProxyWithRetry(
            upgrades, RentalManager, [ecoAddr, nftAddr], "RentalManager"
        );
        addresses.rentalManager = rentalAddr;
        updateAddressJSON("rentalManager", rentalAddr);

        // ═══════════════════════════════════════════════════════════════════════
        // 💬 BACKCHAT V7 - DEPLOY DIRETO (NÃO-UPGRADEABLE) - V6.9 CHANGE!
        // ═══════════════════════════════════════════════════════════════════════
        console.log("\n   💬 BACKCHAT V7 - Non-Upgradeable Deploy");
        console.log("   ────────────────────────────────────────────────────────────");
        
        const Backchat = await ethers.getContractFactory("Backchat");
        // V7 constructor: (address _bkcToken, address _ecosystemManager)
        const { contract: backchat, address: backchatAddr } = await deployContractWithRetry(
            Backchat, 
            [bkcAddr, ecoAddr],  // MUDANÇA V6.9: parâmetros diferentes!
            "Backchat V7"
        );
        addresses.backchat = backchatAddr;
        updateAddressJSON("backchat", backchatAddr);
        
        console.log("   ℹ️  Backchat V7: Todas as configurações são hardcoded no contrato");
        console.log("   ℹ️  Não há funções setDistribution, setBadgeRequirements, etc.");

        // CharityPool (ainda usa proxy)
        const CharityPool = await ethers.getContractFactory("CharityPool");
        const { contract: charity, address: charityAddr } = await deployProxyWithRetry(
            upgrades, CharityPool, [deployer.address, bkcAddr, miningAddr, SYSTEM_WALLETS.TREASURY], "CharityPool"
        );
        addresses.charityPool = charityAddr;
        updateAddressJSON("charityPool", charityAddr);

        // Faucet (testnet only)
        let faucetAddr: string | null = null;
        if (!isMainnet) {
            const SimpleBKCFaucet = await ethers.getContractFactory("SimpleBKCFaucet");
            const { contract: faucet, address: fAddr } = await deployProxyWithRetry(
                upgrades, SimpleBKCFaucet, [
                    bkcAddr,
                    deployer.address,
                    FAUCET_CONFIG.TOKENS_PER_REQUEST,
                    FAUCET_CONFIG.ETH_PER_REQUEST
                ], "SimpleBKCFaucet"
            );
            faucetAddr = fAddr;
            addresses.faucet = faucetAddr;
            updateAddressJSON("faucet", faucetAddr);
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 3: Configure EcosystemManager
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 3: Configure EcosystemManager");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 3: Configure EcosystemManager (Full Configuration)");
        console.log("═══════════════════════════════════════════════════════════════════════");

        await sendTxWithRetry(
            async () => await eco.setAddresses(
                bkcAddr,
                SYSTEM_WALLETS.TREASURY,
                delegationAddr,
                nftAddr,
                miningAddr,
                notaryAddr,
                fortuneAddr,
                factoryAddr
            ),
            "EcosystemManager.setAddresses() - Full Config"
        );

        await sendTxWithRetry(
            async () => await eco.setAddress("rentalManager", rentalAddr),
            "Set RentalManager"
        );

        // ══════════════════════════════════════════════════════════════════════
        // FASE 4: Configure MiningManager
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 4: Configure MiningManager");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 4: Configure MiningManager");
        console.log("═══════════════════════════════════════════════════════════════════════");

        await sendTxWithRetry(
            async () => await mining.setOperatorFee(1000n),
            "Operator Fee: 10%"
        );

        await sendTxWithRetry(
            async () => await mining.setBurnRates(
                MINING_MANAGER_CONFIG.FEE_BURN_RATE_BIPS,
                MINING_MANAGER_CONFIG.MINING_BURN_RATE_BIPS
            ),
            `Burn: ${Number(MINING_MANAGER_CONFIG.FEE_BURN_RATE_BIPS)/100}%`
        );

        // Autorizar serviços (incluindo Backchat V7!)
        const servicesToAuthorize = [
            { key: "FORTUNE_POOL_SERVICE", addr: fortuneAddr, name: "FortunePool" },
            { key: "RENTAL_MARKET_TAX_BIPS", addr: rentalAddr, name: "RentalManager" },
            { key: "NOTARY_SERVICE", addr: notaryAddr, name: "Notary" },
            { key: BACKCHAT_CONFIG.SERVICE_KEY, addr: backchatAddr, name: "Backchat V7" },  // Ainda precisa autorizar!
            { key: CHARITY_CONFIG.SERVICE_KEY, addr: charityAddr, name: "CharityPool" },
        ];

        for (const { key, addr, name } of servicesToAuthorize) {
            const keyHash = ethers.keccak256(ethers.toUtf8Bytes(key));
            await sendTxWithRetry(
                async () => await mining.setAuthorizedMiner(keyHash, addr),
                `Authorize ${name}`
            );
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 5: Configure Distribution
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 5: Configure Distribution");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 5: Configure Distribution");
        console.log("═══════════════════════════════════════════════════════════════════════");

        await setDistributionIfNeeded(eco, ethers, "setMiningDistributionBips", "TREASURY", DISTRIBUTION.mining.TREASURY, "miningDistribution");
        await setDistributionIfNeeded(eco, ethers, "setMiningDistributionBips", "DELEGATOR_POOL", DISTRIBUTION.mining.DELEGATOR_POOL, "miningDistribution");
        await setDistributionIfNeeded(eco, ethers, "setFeeDistributionBips", "TREASURY", DISTRIBUTION.fee.TREASURY, "feeDistribution");
        await setDistributionIfNeeded(eco, ethers, "setFeeDistributionBips", "DELEGATOR_POOL", DISTRIBUTION.fee.DELEGATOR_POOL, "feeDistribution");

        // ══════════════════════════════════════════════════════════════════════
        // FASE 6: Configure Service Fees
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 6: Configure Service Fees");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 6: Configure Service Fees");
        console.log("═══════════════════════════════════════════════════════════════════════");

        for (const [key, value] of Object.entries(SERVICE_FEES_BIPS)) {
            await setFeeBipsIfNeeded(eco, ethers, key, value as bigint);
        }

        const notaryFeeKey = ethers.keccak256(ethers.toUtf8Bytes("NOTARY_SERVICE"));
        const notaryFeeAmount = ethers.parseEther(SERVICE_FEES_FIXED.NOTARY_SERVICE);
        await sendTxWithRetry(
            async () => await eco.setServiceFee(notaryFeeKey, notaryFeeAmount),
            `Notary: ${SERVICE_FEES_FIXED.NOTARY_SERVICE} BKC`
        );

        // ══════════════════════════════════════════════════════════════════════
        // FASE 7: Transfer BKCToken Ownership to MiningManager
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 7: Transfer BKCToken Ownership");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 7: Transfer BKCToken Ownership to MiningManager");
        console.log("═══════════════════════════════════════════════════════════════════════");

        await sendTxWithRetry(
            async () => await bkc.transferOwnership(miningAddr),
            "BKCToken: transferOwnership → MiningManager"
        );

        // ══════════════════════════════════════════════════════════════════════
        // FASE 8: Configure Services
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 8: Configure Services");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 8: Configure Services");
        console.log("═══════════════════════════════════════════════════════════════════════");

        // ═══════════════════════════════════════════════════════════════════════
        // V6.9: BACKCHAT V7 NÃO PRECISA DE CONFIGURAÇÃO!
        // Todas as configurações são hardcoded como constants no contrato:
        // - FEE_PERCENT = 20
        // - CREATOR_BIPS = 4000 (40%)
        // - OPERATOR_BIPS = 3000 (30%)
        // - TREASURY_BIPS = 3000 (30%)
        // - CREATOR_TIP_BIPS = 9000 (90%)
        // - MINING_TIP_BIPS = 1000 (10%)
        // - SUPER_LIKE_MIN = 0.0001 ether
        // - BOOST_MIN = 0.0005 ether
        // - BADGE_FEE = 0.001 ether
        // - etc.
        // ═══════════════════════════════════════════════════════════════════════
        console.log("\n💬 Backchat V7");
        console.log("────────────────────────────────────────────────────────────────");
        console.log("   ✅ Backchat V7 não requer configuração pós-deploy!");
        console.log("   ℹ️  Todas as configurações são constants hardcoded:");
        console.log("      • ETH Fee: 20% do gas");
        console.log("      • Com Creator: 40% creator / 30% operator / 30% treasury");
        console.log("      • Sem Creator: 60% operator / 40% treasury");
        console.log("      • BKC Tip: 90% creator / 10% MiningManager");
        console.log("      • Super Like Min: 0.0001 ETH");
        console.log("      • Boost Min: 0.0005 ETH");
        console.log("      • Badge Fee: 0.001 ETH");
        
        updateRulesJSON("backchat", "SERVICE_KEY", BACKCHAT_CONFIG.SERVICE_KEY);
        updateRulesJSON("backchat", "VERSION", "V7.0.0 (Non-Upgradeable)");
        updateRulesJSON("backchat", "CONFIG_TYPE", "HARDCODED_CONSTANTS");

        // Configure CharityPool
        await configureCharityPool(charity, mining, charityAddr, ethers);

        // Configure RentalManager
        await configureRentalManagerV3(rental, rentalAddr, SYSTEM_WALLETS.TREASURY, ethers);

        // Configure FortunePool
        console.log("\n🎰 Configurando FortunePool");
        try {
            const fortuneServiceFee = ethers.parseEther(FORTUNE_SERVICE_FEE_1X);
            await sendTxWithRetry(
                async () => await fortune.setServiceFee(fortuneServiceFee),
                `FortunePool: setServiceFee()`
            );

            await sendTxWithRetry(
                async () => await fortune.setRevealDelay(2),
                `FortunePool: setRevealDelay(2) - ~30s wait`
            );

            for (const tier of FORTUNE_TIERS) {
                await sendTxWithRetry(
                    async () => await fortune.configureTier(tier.tierId, tier.range, tier.multiplierBips),
                    `Tier ${tier.tierId} (${tier.name})`
                );
            }
        } catch (e: any) {
            console.log(`   ⚠️ FortunePool config falhou: ${e.message?.slice(0, 50)}`);
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 9: Initial Liquidity
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 9: Initial Liquidity");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 9: Initial Liquidity");
        console.log("═══════════════════════════════════════════════════════════════════════");

        await sendTxWithRetry(
            async () => await bkc.approve(fortuneAddr, LIQUIDITY_CONFIG.FORTUNE_POOL),
            `Approve BKC for Fortune Pool`
        );
        await sendTxWithRetry(
            async () => await fortune.fundPrizePool(LIQUIDITY_CONFIG.FORTUNE_POOL),
            `Fortune Pool: ${ethers.formatEther(LIQUIDITY_CONFIG.FORTUNE_POOL)} BKC (via fundPrizePool)`
        );

        if (!isMainnet && faucetAddr) {
            await sendTxWithRetry(
                async () => await bkc.transfer(faucetAddr, LIQUIDITY_CONFIG.FAUCET),
                `Faucet: ${ethers.formatEther(LIQUIDITY_CONFIG.FAUCET)} BKC`
            );

            await sendTxWithRetry(
                async () => await deployer.sendTransaction({
                    to: faucetAddr,
                    value: ethers.parseEther("0.1")
                }),
                `Faucet: 0.1 ETH`
            );
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 10: Create NFT Pools
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 10: Create NFT Pools");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 10: Create NFT Pools");
        console.log("═══════════════════════════════════════════════════════════════════════");

        await sendTxWithRetry(
            async () => await factory.deployAllStandardPools(),
            "Create all 4 NFT Pools (Bronze, Silver, Gold, Diamond)"
        );

        const tierNames = ["bronze", "silver", "gold", "diamond"];
        const tierBoosts = [1000n, 2500n, 4000n, 5000n];
        const poolAddresses: Record<string, string> = {};
        
        for (let i = 0; i < 4; i++) {
            const poolAddr = await factory.getPoolAddress(tierBoosts[i]);
            addresses[`pool_${tierNames[i]}`] = poolAddr;
            poolAddresses[tierNames[i]] = poolAddr;
            updateAddressJSON(`pool_${tierNames[i]}`, poolAddr);
            console.log(`   ✅ Pool ${tierNames[i]}: ${poolAddr}`);
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 11: Mint Genesis NFTs
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 11: Mint Genesis NFTs");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 11: Mint Genesis NFTs");
        console.log("═══════════════════════════════════════════════════════════════════════");

        await sendTxWithRetry(
            async () => await nft.setBaseURI(IPFS_BASE_URI_BOOSTERS),
            `Set Base URI`
        );

        const mintedTokensByTier: Record<string, bigint[]> = {
            diamond: [],
            gold: [],
            silver: [],
            bronze: [],
        };

        const tierNameByBoost: Record<string, string> = {
            "5000": "diamond",
            "4000": "gold",
            "2500": "silver",
            "1000": "bronze",
        };

        let currentTokenId = BigInt((await nft.totalMinted()).toString());

        const MINT_BATCH_SIZE = 100;
        for (const tier of NFT_TIERS) {
            const totalToMint = Number(tier.mintCount);
            let minted = 0;
            const tierKey = tierNameByBoost[tier.boostBips.toString()];
            
            while (minted < totalToMint) {
                const batchSize = Math.min(MINT_BATCH_SIZE, totalToMint - minted);
                const recipients: string[] = Array(batchSize).fill(deployer.address);
                const boostBipsArray: bigint[] = Array(batchSize).fill(tier.boostBips);
                const metadataFiles: string[] = Array(batchSize).fill(tier.metadata);
                
                await sendTxWithRetry(
                    async () => await nft.ownerMintBatch(recipients, boostBipsArray, metadataFiles),
                    `Mint ${tier.name}: +${batchSize}`
                );
                
                for (let j = 0; j < batchSize; j++) {
                    currentTokenId++;
                    mintedTokensByTier[tierKey].push(currentTokenId);
                }
                
                minted += batchSize;
            }
        }

        const totalMinted = await nft.totalMinted();
        console.log(`   🎉 Total NFTs: ${totalMinted}`);

        // ══════════════════════════════════════════════════════════════════════
        // FASE 12: Deposit NFTs to Pools + Add BKC Liquidity
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 12: Deposit NFTs to Pools");
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 12: Deposit NFTs to Pools + Add BKC Liquidity");
        console.log("═══════════════════════════════════════════════════════════════════════");

        for (const tierName of tierNames) {
            const poolAddr = poolAddresses[tierName];
            const tokenIds = mintedTokensByTier[tierName];
            
            if (!poolAddr || poolAddr === ethers.ZeroAddress) {
                console.log(`   ⚠️ Pool ${tierName} não encontrado`);
                continue;
            }

            if (tokenIds.length === 0) {
                console.log(`   ⚠️ Nenhum NFT para ${tierName}`);
                continue;
            }

            console.log(`\n   📦 ${tierName.toUpperCase()} Pool: ${tokenIds.length} NFTs`);

            const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddr, deployer);

            await sendTxWithRetry(
                async () => await nft.setApprovalForAll(poolAddr, true),
                `Approve NFTs for ${tierName} pool`
            );

            await sendTxWithRetry(
                async () => await bkc.approve(poolAddr, LIQUIDITY_CONFIG.NFT_POOL_EACH),
                `Approve BKC for ${tierName} pool`
            );

            try {
                await sendTxWithRetry(
                    async () => await pool.addInitialLiquidity(tokenIds, LIQUIDITY_CONFIG.NFT_POOL_EACH),
                    `Add initial liquidity to ${tierName} pool (${tokenIds.length} NFTs + ${ethers.formatEther(LIQUIDITY_CONFIG.NFT_POOL_EACH)} BKC)`
                );
                console.log(`   ✅ ${tierName} pool initialized with ${tokenIds.length} NFTs!`);
            } catch (e: any) {
                console.log(`   ❌ Error initializing ${tierName} pool: ${e.message?.slice(0, 60)}`);
            }

            logTransaction({
                description: `Initialize ${tierName} pool with ${tokenIds.length} NFTs`,
                txHash: "BATCH",
                from: deployer.address,
                to: poolAddr,
                gasUsed: "0",
                blockNumber: 0,
                status: "success",
            });

            try {
                const availableNFTs = await pool.getAvailableNFTs();
                const poolBkcBalance = await bkc.balanceOf(poolAddr);
                console.log(`   🎉 ${tierName} pool FINAL: ${availableNFTs.length} NFTs, ${ethers.formatEther(poolBkcBalance)} BKC`);
            } catch (e: any) {
                console.log(`   ⚠️ Não foi possível verificar pool status`);
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 13: Deploy Governance (optional)
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 13: Deploy Governance");
        let governanceAddr = "";
        let governance: any = null;

        if (SECURITY_CONFIG.DEPLOY_GOVERNANCE) {
            console.log("\n═══════════════════════════════════════════════════════════════════════");
            console.log("   FASE 13: Deploy BackchainGovernance");
            console.log("═══════════════════════════════════════════════════════════════════════");

            try {
                const govAdmin = SYSTEM_WALLETS.MULTISIG_ADMIN || deployer.address;
                const BackchainGovernance = await ethers.getContractFactory("BackchainGovernance");
                const timelockDelay = SECURITY_CONFIG.ENABLE_TIMELOCK ? SECURITY_CONFIG.TIMELOCK_DELAY_SECONDS : 0n;
                const { contract: gov, address: govAddr } = await deployProxyWithRetry(
                    upgrades, BackchainGovernance, [govAdmin, timelockDelay], "BackchainGovernance"
                );
                governance = gov;
                governanceAddr = govAddr;
                addresses.backchainGovernance = governanceAddr;
                updateAddressJSON("backchainGovernance", governanceAddr);

                console.log("   ℹ️ Governance deployed. Contract registration skipped (manual setup required)");
            } catch (e: any) {
                console.log(`   ⚠️ Governance deploy falhou: ${e.message?.slice(0, 60)}`);
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // FASE 14: Transfer Ownership to Governance (optional)
        // ══════════════════════════════════════════════════════════════════════
        setCurrentPhase("FASE 14: Transfer Ownership to Governance");
        if (SECURITY_CONFIG.TRANSFER_OWNERSHIP_TO_GOVERNANCE && governanceAddr) {
            console.log("\n═══════════════════════════════════════════════════════════════════════");
            console.log("   FASE 14: Transfer Ownership to Governance");
            console.log("═══════════════════════════════════════════════════════════════════════");

            // NOTA V6.9: Backchat V7 NÃO tem owner - é imutável!
            const contractsToTransfer = [
                { contract: eco, name: "EcosystemManager" },
                { contract: mining, name: "MiningManager" },
                { contract: delegation, name: "DelegationManager" },
                { contract: nft, name: "RewardBoosterNFT" },
                { contract: fortune, name: "FortunePool" },
                { contract: rental, name: "RentalManager" },
                { contract: charity, name: "CharityPool" },
                // { contract: backchat, name: "Backchat" },  // V6.9: REMOVIDO - V7 não tem owner!
                { contract: factory, name: "NFTLiquidityPoolFactory" },
            ];

            console.log("   ℹ️  Backchat V7 não tem owner - é um contrato imutável");

            for (const { contract, name } of contractsToTransfer) {
                await transferOwnershipSafe(contract, governanceAddr, name, deployer.address);
            }

            updateRulesJSON("security", "OWNERSHIP_TRANSFERRED", "true");
            updateRulesJSON("security", "GOVERNANCE_ADDRESS", governanceAddr);
        }

        // ══════════════════════════════════════════════════════════════════════
        // RESUMO FINAL
        // ══════════════════════════════════════════════════════════════════════
        console.log("\n════════════════════════════════════════════════════════════════════════════");
        console.log("                         📊 DEPLOY CONCLUÍDO V6.9!");
        console.log("════════════════════════════════════════════════════════════════════════════");

        console.log("\n📋 CONTRATOS IMPLANTADOS:");
        console.log("────────────────────────────────────────────────────────────────");
        for (const [key, addr] of Object.entries(addresses)) {
            if (addr && addr.startsWith("0x")) {
                const isBackchat = key === "backchat";
                const suffix = isBackchat ? " (V7 Non-Upgradeable)" : "";
                console.log(`   ${key}: ${addr}${suffix}`);
            }
        }

        const finalBalance = await bkc.balanceOf(deployer.address);
        console.log("\n💧 LIQUIDEZ FINAL:");
        console.log(`   Deployer: ${ethers.formatEther(finalBalance)} BKC`);
        console.log(`   Fortune:  ${ethers.formatEther(await bkc.balanceOf(fortuneAddr))} BKC`);
        if (faucetAddr) {
            console.log(`   Faucet:   ${ethers.formatEther(await bkc.balanceOf(faucetAddr))} BKC`);
        }

        console.log("\n🎨 NFT POOLS:");
        for (const tierName of tierNames) {
            const poolAddr = poolAddresses[tierName];
            if (poolAddr) {
                try {
                    const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddr, deployer);
                    const available = await pool.getAvailableNFTs();
                    const bkcBalance = await bkc.balanceOf(poolAddr);
                    console.log(`   ${tierName}: ${available.length} NFTs, ${ethers.formatEther(bkcBalance)} BKC`);
                } catch (e) {
                    console.log(`   ${tierName}: (erro ao verificar)`);
                }
            }
        }

        printTransactionSummary();

        console.log("\n────────────────────────────────────────────────────────────────");
        console.log(`   🎉 BACKCHAIN V6.9 IMPLANTADO COM SUCESSO!`);
        console.log(`   📡 Rede: ${networkName} ${isMainnet ? '(MAINNET)' : '(TESTNET)'}`);
        console.log(`   💬 Backchat: V7.0.0 (Non-Upgradeable)`);
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