// scripts/redeploy_fortune.ts
// Redeploy FortunePool with rebalanced tiers (4/3x, 20/15x, 100/75x)
// Steps:
//   1. Deploy new FortunePool contract
//   2. Deauthorize old FortunePool in ecosystem
//   3. Register new FortunePool as FORTUNE module
//   4. Fund prize pool with 1M BKC from treasury
//   5. Update deployment-addresses.json

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const ADDRESSES_FILE = path.resolve(__dirname, "../deployment-addresses.json");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`\nDeployer: ${deployer.address}`);
    console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

    // Load current addresses
    const addresses = JSON.parse(fs.readFileSync(ADDRESSES_FILE, "utf8"));
    const ecoAddr = addresses.backchainEcosystem;
    const bkcAddr = addresses.bkcToken;
    const oldFortuneAddr = addresses.fortunePool;

    console.log(`Ecosystem:       ${ecoAddr}`);
    console.log(`BKC Token:       ${bkcAddr}`);
    console.log(`Old FortunePool: ${oldFortuneAddr}\n`);

    // Get ecosystem contract
    const ecoAbi = [
        "function deauthorizeContract(address _contract) external",
        "function registerModule(address _contract, bytes32 _moduleId, tuple(bool active, uint16 customBps, uint16 operatorBps, uint16 treasuryBps, uint16 buybackBps) _cfg) external",
        "function authorizedContracts(address) view returns (bytes32)",
        "function owner() view returns (address)",
    ];
    const eco = new ethers.Contract(ecoAddr, ecoAbi, deployer);

    // Get BKC token contract
    const bkcAbi = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
        "function transfer(address to, uint256 amount) external returns (bool)",
    ];
    const bkc = new ethers.Contract(bkcAddr, bkcAbi, deployer);

    // ── Step 1: Deploy new FortunePool ──
    console.log("═══════════════════════════════════════════════════════");
    console.log("  Step 1: Deploy new FortunePool (rebalanced tiers)");
    console.log("═══════════════════════════════════════════════════════");

    const FortunePool = await ethers.getContractFactory("FortunePool");
    const fortune = await FortunePool.deploy(ecoAddr, bkcAddr);
    await fortune.waitForDeployment();
    const newFortuneAddr = await fortune.getAddress();
    console.log(`✅ New FortunePool: ${newFortuneAddr}\n`);

    // ── Step 2: Deauthorize old FortunePool ──
    console.log("  Step 2: Deauthorize old FortunePool");
    const oldModuleId = await eco.authorizedContracts(oldFortuneAddr);
    if (oldModuleId !== ethers.ZeroHash) {
        const tx1 = await eco.deauthorizeContract(oldFortuneAddr);
        await tx1.wait();
        console.log(`✅ Old FortunePool deauthorized (moduleId: ${oldModuleId})\n`);
    } else {
        console.log("⚠️  Old FortunePool was already deauthorized\n");
    }

    // ── Step 3: Register new FortunePool as FORTUNE module ──
    console.log("  Step 3: Register new FortunePool as FORTUNE module");
    const FORTUNE_MODULE_ID = ethers.id("FORTUNE");
    const moduleConfig = {
        active: true,
        customBps: 0,
        operatorBps: 1667,
        treasuryBps: 2778,
        buybackBps: 5555,
    };
    const tx2 = await eco.registerModule(
        newFortuneAddr,
        FORTUNE_MODULE_ID,
        [moduleConfig.active, moduleConfig.customBps, moduleConfig.operatorBps, moduleConfig.treasuryBps, moduleConfig.buybackBps]
    );
    await tx2.wait();
    console.log(`✅ New FortunePool registered as FORTUNE module\n`);

    // ── Step 4: Fund prize pool ──
    console.log("  Step 4: Fund prize pool with 1M BKC");
    const FUND_AMOUNT = ethers.parseEther("1000000"); // 1M BKC

    const fortuneAbi = [
        "function fundPrizePool(uint256 amount) external",
        "function prizePool() view returns (uint256)",
        "function getAllTiers() view returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)",
    ];
    const newFortune = new ethers.Contract(newFortuneAddr, fortuneAbi, deployer);

    // Check deployer BKC balance
    const deployerBkc = await bkc.balanceOf(deployer.address);
    console.log(`   Deployer BKC: ${ethers.formatEther(deployerBkc)}`);

    if (deployerBkc >= FUND_AMOUNT) {
        const tx3 = await bkc.approve(newFortuneAddr, FUND_AMOUNT);
        await tx3.wait();
        const tx4 = await newFortune.fundPrizePool(FUND_AMOUNT);
        await tx4.wait();
        const pool = await newFortune.prizePool();
        console.log(`✅ Prize pool funded: ${ethers.formatEther(pool)} BKC\n`);
    } else {
        console.log(`⚠️  Insufficient BKC (have ${ethers.formatEther(deployerBkc)}, need 1M)`);
        console.log(`   Fund the pool manually after transferring BKC to deployer.\n`);
    }

    // ── Step 5: Update deployment-addresses.json ──
    console.log("  Step 5: Update deployment-addresses.json");
    addresses.fortunePool = newFortuneAddr;
    fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 2) + "\n");
    console.log(`✅ deployment-addresses.json updated\n`);

    // ── Verify tier data ──
    console.log("  Verifying new tier data:");
    const tiers = await newFortune.getAllTiers();
    const tierNames = ["Easy", "Medium", "Hard"];
    for (let i = 0; i < 3; i++) {
        const range = Number(tiers.ranges[i]);
        const mult = Number(tiers.multipliers[i]) / 10000;
        const winChance = Number(tiers.winChances[i]) / 100;
        console.log(`   ${tierNames[i]}: range 1-${range}, ${mult}x multiplier, ${winChance}% chance`);
    }

    console.log(`\n═══════════════════════════════════════════════════════`);
    console.log(`  DONE! FortunePool redeployed successfully.`);
    console.log(`  Old: ${oldFortuneAddr}`);
    console.log(`  New: ${newFortuneAddr}`);
    console.log(`═══════════════════════════════════════════════════════\n`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
