// scripts/deploy_buyback_v2.ts
// Deploy BuybackMiner V2 (with execution fee) and update ecosystem reference
//
// Steps:
//   1. Deploy new BuybackMiner V2
//   2. Ecosystem.setBuybackMiner(newAddress)
//   3. BKCToken.addMinter(newAddress)
//   4. BuybackMiner.setExecutionFee(~$1 worth of ETH)
//   5. Update deployment-addresses.json
//
// Run: npx hardhat run scripts/deploy_buyback_v2.ts --network arbitrumSepolia
// ============================================================================

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ── Existing deployed addresses ──
const ADDRESSES_FILE = path.join(__dirname, "..", "deployment-addresses.json");
const addresses = JSON.parse(fs.readFileSync(ADDRESSES_FILE, "utf-8"));

const ECOSYSTEM_ADDR = addresses.backchainEcosystem;
const BKC_TOKEN_ADDR = addresses.bkcToken;
const LIQUIDITY_POOL_ADDR = addresses.liquidityPool;
const STAKING_POOL_ADDR = addresses.stakingPool;
const OLD_BUYBACK_ADDR = addresses.buybackMiner;

// ── Execution fee: ~$1 at ~$2500/ETH ──
const EXECUTION_FEE = ethers.parseEther("0.0004"); // 0.0004 ETH ≈ $1

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("═══════════════════════════════════════════════════");
    console.log("  BUYBACK MINER V2 — DEPLOY + UPDATE ECOSYSTEM");
    console.log("═══════════════════════════════════════════════════");
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Network:  ${(await ethers.provider.getNetwork()).name}`);
    console.log(`Old BuybackMiner: ${OLD_BUYBACK_ADDR}`);
    console.log("");

    // ── Step 1: Deploy BuybackMiner V2 ──
    console.log("1️⃣  Deploying BuybackMiner V2...");
    const BuybackMiner = await ethers.getContractFactory("BuybackMiner");
    const buyback = await BuybackMiner.deploy(
        ECOSYSTEM_ADDR,
        BKC_TOKEN_ADDR,
        LIQUIDITY_POOL_ADDR,
        STAKING_POOL_ADDR
    );
    await buyback.waitForDeployment();
    const buybackAddr = await buyback.getAddress();
    console.log(`   ✅ BuybackMiner V2: ${buybackAddr}`);

    // ── Step 2: Update ecosystem reference ──
    console.log("\n2️⃣  Ecosystem.setBuybackMiner()...");
    const ecoABI = [
        "function setBuybackMiner(address _buyback) external",
        "function buybackMiner() view returns (address)"
    ];
    const eco = new ethers.Contract(ECOSYSTEM_ADDR, ecoABI, deployer);
    const tx1 = await eco.setBuybackMiner(buybackAddr, { gasLimit: 100_000 });
    await tx1.wait();
    const newRef = await eco.buybackMiner();
    console.log(`   ✅ Ecosystem.buybackMiner = ${newRef}`);

    // ── Step 3: Grant minting permission ──
    console.log("\n3️⃣  BKCToken.addMinter()...");
    const bkcABI = [
        "function addMinter(address _minter) external",
        "function isMinter(address) view returns (bool)"
    ];
    const bkc = new ethers.Contract(BKC_TOKEN_ADDR, bkcABI, deployer);
    const tx2 = await bkc.addMinter(buybackAddr, { gasLimit: 100_000 });
    await tx2.wait();
    const isMinter = await bkc.isMinter(buybackAddr);
    console.log(`   ✅ isMinter(BuybackV2) = ${isMinter}`);

    // ── Step 4: Set execution fee ──
    console.log("\n4️⃣  BuybackMiner.setExecutionFee()...");
    const tx3 = await buyback.setExecutionFee(EXECUTION_FEE, { gasLimit: 100_000 });
    await tx3.wait();
    const fee = await buyback.executionFee();
    console.log(`   ✅ executionFee = ${ethers.formatEther(fee)} ETH (~$1)`);

    // ── Step 5: Update deployment-addresses.json ──
    console.log("\n5️⃣  Updating deployment-addresses.json...");
    addresses.buybackMiner = buybackAddr;
    fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ Updated buybackMiner → ${buybackAddr}`);

    // ── Summary ──
    console.log("\n═══════════════════════════════════════════════════");
    console.log("  DEPLOYMENT COMPLETE");
    console.log("═══════════════════════════════════════════════════");
    console.log(`Old BuybackMiner: ${OLD_BUYBACK_ADDR} (retired)`);
    console.log(`New BuybackMiner: ${buybackAddr}`);
    console.log(`Execution Fee:    ${ethers.formatEther(EXECUTION_FEE)} ETH`);
    console.log(`Ecosystem updated: ✅`);
    console.log(`Minter granted:    ✅`);
    console.log("\nNext: update frontend config and deploy to Vercel");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
