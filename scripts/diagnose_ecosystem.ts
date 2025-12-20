// scripts/diagnose_ecosystem.ts
// ✅ DIAGNOSTIC SCRIPT V2.0 - Reads from deployment-addresses.json

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Load addresses from JSON
function loadAddresses(): Record<string, string> {
    const possiblePaths = [
        path.join(__dirname, "../deployment-addresses.json"),
        path.join(__dirname, "../../deployment-addresses.json"),
        path.join(process.cwd(), "deployment-addresses.json")
    ];
    
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log(`📁 Loading addresses from: ${p}`);
            return JSON.parse(fs.readFileSync(p, "utf8"));
        }
    }
    
    throw new Error("deployment-addresses.json not found!");
}

// Service Keys
const SERVICE_KEYS = {
    DELEGATION_FEE_BIPS: ethers.id("DELEGATION_FEE_BIPS"),
    UNSTAKE_FEE_BIPS: ethers.id("UNSTAKE_FEE_BIPS"),
    FORCE_UNSTAKE_PENALTY_BIPS: ethers.id("FORCE_UNSTAKE_PENALTY_BIPS"),
    CLAIM_REWARD_FEE_BIPS: ethers.id("CLAIM_REWARD_FEE_BIPS"),
    NFT_POOL_BUY_TAX_BIPS: ethers.id("NFT_POOL_BUY_TAX_BIPS"),
    NFT_POOL_SELL_TAX_BIPS: ethers.id("NFT_POOL_SELL_TAX_BIPS"),
    FORTUNE_POOL_SERVICE: ethers.id("FORTUNE_POOL_SERVICE"),
    RENTAL_MARKET_TAX_BIPS: ethers.id("RENTAL_MARKET_TAX_BIPS"),
    NOTARY_SERVICE: ethers.id("NOTARY_SERVICE")
};

// Colors for console
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function success(msg: string) { console.log(`${GREEN}✅ ${msg}${RESET}`); }
function error(msg: string) { console.log(`${RED}❌ ${msg}${RESET}`); }
function warning(msg: string) { console.log(`${YELLOW}⚠️  ${msg}${RESET}`); }
function info(msg: string) { console.log(`${CYAN}ℹ️  ${msg}${RESET}`); }
function header(msg: string) { console.log(`\n${BOLD}${CYAN}${"=".repeat(60)}\n${msg}\n${"=".repeat(60)}${RESET}`); }
function subheader(msg: string) { console.log(`\n${BOLD}📋 ${msg}${RESET}`); }

async function main() {
    const [deployer] = await ethers.getSigners();
    const ADDRESSES = loadAddresses();
    
    console.log(`\n${BOLD}${CYAN}`);
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║         BACKCOIN ECOSYSTEM DIAGNOSTIC TOOL V2.0            ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log(RESET);
    
    info(`Deployer: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    info(`ETH Balance: ${ethers.formatEther(balance)} ETH`);
    
    let totalIssues = 0;
    let totalWarnings = 0;
    
    // ========================================================================
    // 1. SHOW LOADED ADDRESSES
    // ========================================================================
    header("1. LOADED CONTRACT ADDRESSES");
    
    const coreContracts = [
        "ecosystemManager", "bkcToken", "rewardBoosterNFT", "miningManager",
        "delegationManager", "decentralizedNotary", "fortunePool", "rentalManager",
        "nftLiquidityPoolFactory", "publicSale", "faucet"
    ];
    
    for (const name of coreContracts) {
        if (ADDRESSES[name]) {
            success(`${name}: ${ADDRESSES[name]}`);
        } else {
            error(`${name}: NOT FOUND in JSON`);
            totalIssues++;
        }
    }
    
    // Show pools
    subheader("NFT Liquidity Pools:");
    const poolNames = ["pool_diamond", "pool_platinum", "pool_gold", "pool_silver", "pool_bronze", "pool_iron", "pool_crystal"];
    for (const pool of poolNames) {
        if (ADDRESSES[pool]) {
            info(`${pool}: ${ADDRESSES[pool]}`);
        }
    }
    
    // ========================================================================
    // 2. LOAD CONTRACTS
    // ========================================================================
    header("2. LOADING CONTRACTS");
    
    const bkc = await ethers.getContractAt("BKCToken", ADDRESSES.bkcToken);
    const hub = await ethers.getContractAt("EcosystemManager", ADDRESSES.ecosystemManager);
    const mm = await ethers.getContractAt("MiningManager", ADDRESSES.miningManager);
    const dm = await ethers.getContractAt("DelegationManager", ADDRESSES.delegationManager);
    const notary = await ethers.getContractAt("DecentralizedNotary", ADDRESSES.decentralizedNotary);
    const fortune = await ethers.getContractAt("FortunePool", ADDRESSES.fortunePool);
    const rental = await ethers.getContractAt("RentalManager", ADDRESSES.rentalManager);
    const booster = await ethers.getContractAt("RewardBoosterNFT", ADDRESSES.rewardBoosterNFT);
    
    success("All contracts loaded successfully");
    
    // ========================================================================
    // 3. CHECK SERVICE FEES (BIPS)
    // ========================================================================
    header("3. SERVICE FEES CONFIGURATION");
    
    subheader("Fees in BIPS (Basis Points):");
    
    const feeChecks = [
        { name: "DELEGATION_FEE_BIPS", key: SERVICE_KEYS.DELEGATION_FEE_BIPS, expectedBips: 50 },
        { name: "UNSTAKE_FEE_BIPS", key: SERVICE_KEYS.UNSTAKE_FEE_BIPS, expectedBips: 100 },
        { name: "FORCE_UNSTAKE_PENALTY_BIPS", key: SERVICE_KEYS.FORCE_UNSTAKE_PENALTY_BIPS, expectedBips: 5000 },
        { name: "CLAIM_REWARD_FEE_BIPS", key: SERVICE_KEYS.CLAIM_REWARD_FEE_BIPS, expectedBips: 100 },
        { name: "NFT_POOL_BUY_TAX_BIPS", key: SERVICE_KEYS.NFT_POOL_BUY_TAX_BIPS, expectedBips: 500 },
        { name: "NFT_POOL_SELL_TAX_BIPS", key: SERVICE_KEYS.NFT_POOL_SELL_TAX_BIPS, expectedBips: 1000 },
        { name: "FORTUNE_POOL_SERVICE", key: SERVICE_KEYS.FORTUNE_POOL_SERVICE, expectedBips: 2000 },
        { name: "RENTAL_MARKET_TAX_BIPS", key: SERVICE_KEYS.RENTAL_MARKET_TAX_BIPS, expectedBips: 1000 }
    ];
    
    for (const check of feeChecks) {
        try {
            const fee = await hub.getFee(check.key);
            const feeBips = Number(fee);
            const feePercent = (feeBips / 100).toFixed(2);
            
            if (feeBips === 0) {
                error(`${check.name}: NOT SET (0)`);
                totalIssues++;
            } else if (feeBips === check.expectedBips) {
                success(`${check.name}: ${feeBips} bips (${feePercent}%)`);
            } else {
                info(`${check.name}: ${feeBips} bips (${feePercent}%) - expected ${check.expectedBips}`);
            }
        } catch (e: any) {
            error(`${check.name}: Failed to read - ${e.message?.slice(0, 50)}`);
            totalIssues++;
        }
    }
    
    // Check NOTARY_SERVICE (in BKC, not BIPS)
    subheader("Fees in BKC:");
    try {
        const notaryFee = await hub.getFee(SERVICE_KEYS.NOTARY_SERVICE);
        const notaryFeeBKC = ethers.formatEther(notaryFee);
        if (notaryFee === 0n) {
            error(`NOTARY_SERVICE: NOT SET (0)`);
            totalIssues++;
        } else {
            success(`NOTARY_SERVICE: ${notaryFeeBKC} BKC`);
        }
    } catch (e: any) {
        error(`NOTARY_SERVICE: Failed to read`);
        totalIssues++;
    }
    
    // ========================================================================
    // 4. CHECK MINING MANAGER - AUTHORIZED MINERS
    // ========================================================================
    header("4. MINING MANAGER - AUTHORIZED MINERS");
    
    const minerChecks = [
        { name: "FORTUNE_POOL_SERVICE", key: SERVICE_KEYS.FORTUNE_POOL_SERVICE, expected: ADDRESSES.fortunePool },
        { name: "NOTARY_SERVICE", key: SERVICE_KEYS.NOTARY_SERVICE, expected: ADDRESSES.decentralizedNotary },
        { name: "RENTAL_MARKET_TAX_BIPS", key: SERVICE_KEYS.RENTAL_MARKET_TAX_BIPS, expected: ADDRESSES.rentalManager },
        { name: "DELEGATION_FEE_BIPS", key: SERVICE_KEYS.DELEGATION_FEE_BIPS, expected: ADDRESSES.delegationManager },
        { name: "UNSTAKE_FEE_BIPS", key: SERVICE_KEYS.UNSTAKE_FEE_BIPS, expected: ADDRESSES.delegationManager },
        { name: "FORCE_UNSTAKE_PENALTY_BIPS", key: SERVICE_KEYS.FORCE_UNSTAKE_PENALTY_BIPS, expected: ADDRESSES.delegationManager },
        { name: "CLAIM_REWARD_FEE_BIPS", key: SERVICE_KEYS.CLAIM_REWARD_FEE_BIPS, expected: ADDRESSES.delegationManager }
    ];
    
    for (const check of minerChecks) {
        try {
            const authorized = await mm.authorizedMiners(check.key);
            if (authorized === ethers.ZeroAddress) {
                error(`${check.name}: NO AUTHORIZED MINER`);
                totalIssues++;
            } else if (authorized.toLowerCase() === check.expected.toLowerCase()) {
                success(`${check.name}: ${authorized.slice(0, 10)}...${authorized.slice(-6)}`);
            } else {
                warning(`${check.name}: ${authorized} (expected ${check.expected.slice(0, 10)}...)`);
                totalWarnings++;
            }
        } catch (e: any) {
            error(`${check.name}: Failed to check - ${e.message?.slice(0, 50)}`);
            totalIssues++;
        }
    }
    
    // ========================================================================
    // 5. CHECK FORTUNE POOL
    // ========================================================================
    header("5. FORTUNE POOL STATUS");
    
    try {
        const prizePool = await fortune.prizePoolBalance();
        const gameCount = await fortune.gameCounter();
        const oracleFee = await fortune.oracleFee();
        const gameFeeBips = await fortune.gameFeeBips();
        const activeTiers = await fortune.activeTierCount();
        
        success(`Prize Pool: ${Number(ethers.formatEther(prizePool)).toLocaleString()} BKC`);
        info(`Games Played: ${gameCount}`);
        info(`Oracle Fee: ${ethers.formatEther(oracleFee)} ETH`);
        info(`Game Fee: ${gameFeeBips} bips (${Number(gameFeeBips) / 100}%)`);
        info(`Active Tiers: ${activeTiers}`);
        
        if (prizePool === 0n) {
            warning("Prize Pool is EMPTY - games may fail");
            totalWarnings++;
        }
        
        if (activeTiers === 0n) {
            error("No active tiers configured!");
            totalIssues++;
        }
        
        // Check oracle address
        const oracleAddr = await fortune.oracleAddress();
        const expectedOracle = ADDRESSES.oracleWalletAddress || ADDRESSES.oracleWallet;
        if (expectedOracle && oracleAddr.toLowerCase() === expectedOracle.toLowerCase()) {
            success(`Oracle: ${oracleAddr}`);
        } else if (oracleAddr === ethers.ZeroAddress) {
            error("Oracle NOT SET");
            totalIssues++;
        } else {
            info(`Oracle: ${oracleAddr}`);
        }
        
    } catch (e: any) {
        error(`Fortune Pool check failed: ${e.message}`);
        totalIssues++;
    }
    
    // ========================================================================
    // 6. CHECK DECENTRALIZED NOTARY
    // ========================================================================
    header("6. DECENTRALIZED NOTARY STATUS");
    
    try {
        const baseFee = await notary.getBaseFee();
        const totalSupply = await notary.totalSupply();
        
        success(`Base Fee: ${ethers.formatEther(baseFee)} BKC`);
        info(`Documents Notarized: ${totalSupply}`);
        
    } catch (e: any) {
        error(`Notary check failed: ${e.message}`);
        totalIssues++;
    }
    
    // ========================================================================
    // 7. CHECK DELEGATION MANAGER
    // ========================================================================
    header("7. DELEGATION MANAGER STATUS");
    
    try {
        const totalPStake = await dm.totalNetworkPStake();
        const minLock = await dm.MIN_LOCK_DURATION();
        const maxLock = await dm.MAX_LOCK_DURATION();
        
        info(`Total Network pStake: ${ethers.formatEther(totalPStake)}`);
        info(`Min Lock Duration: ${Number(minLock) / 86400} days`);
        info(`Max Lock Duration: ${Number(maxLock) / 86400} days`);
        
        success("DelegationManager is operational");
        
    } catch (e: any) {
        error(`DelegationManager check failed: ${e.message}`);
        totalIssues++;
    }
    
    // ========================================================================
    // 8. CHECK BKC TOKEN BALANCES
    // ========================================================================
    header("8. BKC TOKEN BALANCES");
    
    const balanceChecks = [
        { name: "FortunePool (Prize Pool)", address: ADDRESSES.fortunePool },
        { name: "Treasury", address: ADDRESSES.treasuryWallet },
        { name: "Faucet", address: ADDRESSES.faucet },
        { name: "DelegationManager", address: ADDRESSES.delegationManager },
        { name: "Deployer", address: deployer.address }
    ];
    
    for (const check of balanceChecks) {
        if (!check.address) continue;
        try {
            const bal = await bkc.balanceOf(check.address);
            const formatted = Number(ethers.formatEther(bal)).toLocaleString();
            info(`${check.name}: ${formatted} BKC`);
        } catch (e) {
            warning(`${check.name}: Could not read balance`);
        }
    }
    
    // ========================================================================
    // 9. CHECK NFT POOLS
    // ========================================================================
    header("9. NFT LIQUIDITY POOLS STATUS");
    
    const pools = [
        { name: "Diamond (70%)", address: ADDRESSES.pool_diamond, boostBips: 7000 },
        { name: "Platinum (60%)", address: ADDRESSES.pool_platinum, boostBips: 6000 },
        { name: "Gold (50%)", address: ADDRESSES.pool_gold, boostBips: 5000 },
        { name: "Silver (40%)", address: ADDRESSES.pool_silver, boostBips: 4000 },
        { name: "Bronze (30%)", address: ADDRESSES.pool_bronze, boostBips: 3000 },
        { name: "Iron (20%)", address: ADDRESSES.pool_iron, boostBips: 2000 },
        { name: "Crystal (10%)", address: ADDRESSES.pool_crystal, boostBips: 1000 }
    ];
    
    for (const pool of pools) {
        if (!pool.address) {
            warning(`${pool.name}: NOT DEPLOYED`);
            continue;
        }
        
        try {
            const poolContract = await ethers.getContractAt("NFTLiquidityPool", pool.address);
            const poolInfo = await poolContract.getPoolInfo();
            const bkcBalance = poolInfo[0];
            const nftCount = poolInfo[1];
            const isInitialized = poolInfo[3];
            
            if (isInitialized) {
                success(`${pool.name}: ${Number(ethers.formatEther(bkcBalance)).toLocaleString()} BKC, ${nftCount} NFTs`);
            } else {
                warning(`${pool.name}: NOT INITIALIZED`);
                totalWarnings++;
            }
        } catch (e: any) {
            warning(`${pool.name}: Error - ${e.message?.slice(0, 40)}`);
        }
    }
    
    // ========================================================================
    // 10. TRANSACTION SIMULATIONS (staticCall)
    // ========================================================================
    header("10. TRANSACTION SIMULATIONS (staticCall)");
    
    // Test Notarize
    subheader("Testing Notarize...");
    try {
        const currentAllowance = await bkc.allowance(deployer.address, ADDRESSES.decentralizedNotary);
        if (currentAllowance < ethers.parseEther("1")) {
            info("Approving BKC for Notary...");
            const approveTx = await bkc.approve(ADDRESSES.decentralizedNotary, ethers.parseEther("100"));
            await approveTx.wait();
            success("Approved");
        } else {
            success(`Already approved: ${ethers.formatEther(currentAllowance)} BKC`);
        }
        
        const tokenId = await notary.notarize.staticCall(
            "QmDiagnosticTest123",
            "Diagnostic Test",
            ethers.keccak256(ethers.toUtf8Bytes("diagnostic-test-" + Date.now())),
            0n
        );
        success(`Notarize staticCall SUCCESS - would mint token #${tokenId}`);
        
    } catch (e: any) {
        error(`Notarize staticCall FAILED: ${e.reason || e.shortMessage || e.message?.slice(0, 100)}`);
        totalIssues++;
    }
    
    // Test Fortune Pool
    subheader("Testing FortunePool participate...");
    try {
        const currentAllowance = await bkc.allowance(deployer.address, ADDRESSES.fortunePool);
        if (currentAllowance < ethers.parseEther("10")) {
            info("Approving BKC for FortunePool...");
            const approveTx = await bkc.approve(ADDRESSES.fortunePool, ethers.parseEther("1000"));
            await approveTx.wait();
            success("Approved");
        } else {
            success(`Already approved: ${ethers.formatEther(currentAllowance)} BKC`);
        }
        
        const oracleFee = await fortune.oracleFee();
        
        await fortune.participate.staticCall(
            ethers.parseEther("10"),
            [2n, 5n, 50n],
            true,
            { value: oracleFee }
        );
        success("FortunePool participate staticCall SUCCESS");
        
    } catch (e: any) {
        error(`FortunePool participate staticCall FAILED: ${e.reason || e.shortMessage || e.message?.slice(0, 100)}`);
        totalIssues++;
    }
    
    // Test Delegation
    subheader("Testing Delegation...");
    try {
        const currentAllowance = await bkc.allowance(deployer.address, ADDRESSES.delegationManager);
        if (currentAllowance < ethers.parseEther("100")) {
            info("Approving BKC for DelegationManager...");
            const approveTx = await bkc.approve(ADDRESSES.delegationManager, ethers.parseEther("10000"));
            await approveTx.wait();
            success("Approved");
        } else {
            success(`Already approved: ${ethers.formatEther(currentAllowance)} BKC`);
        }
        
        await dm.delegate.staticCall(
            ethers.parseEther("100"),
            86400 * 30,
            0n
        );
        success("Delegation staticCall SUCCESS");
        
    } catch (e: any) {
        error(`Delegation staticCall FAILED: ${e.reason || e.shortMessage || e.message?.slice(0, 100)}`);
        totalIssues++;
    }
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    header("DIAGNOSTIC SUMMARY");
    
    if (totalIssues === 0 && totalWarnings === 0) {
        console.log(`\n${GREEN}${BOLD}🎉 ALL CHECKS PASSED! Ecosystem is fully healthy.${RESET}\n`);
    } else if (totalIssues === 0) {
        console.log(`\n${GREEN}${BOLD}✅ NO CRITICAL ISSUES${RESET}`);
        console.log(`${YELLOW}${BOLD}⚠️  WARNINGS: ${totalWarnings}${RESET}\n`);
    } else {
        console.log(`\n${RED}${BOLD}❌ ISSUES FOUND: ${totalIssues}${RESET}`);
        if (totalWarnings > 0) {
            console.log(`${YELLOW}${BOLD}⚠️  WARNINGS: ${totalWarnings}${RESET}`);
        }
        
        console.log(`\n${YELLOW}Recommended Actions:${RESET}`);
        console.log("1. Run manage_rules.ts to configure missing fees/miners");
        console.log("2. Check that all contracts are properly initialized");
        console.log("3. Initialize any pools that show as NOT INITIALIZED\n");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });