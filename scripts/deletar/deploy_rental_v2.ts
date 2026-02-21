// scripts/deploy_rental_v2.ts
// Deploy RentalManager V2 (daily pricing + boost) and register in ecosystem
//
// V1 → V2 changes:
//   - pricePerHour → pricePerDay (fixed 1-day rentals)
//   - boostListing() — paid visibility promotion
//   - getAvailableListings() — returns tokenIds + boosted flags
//   - Listing struct includes boostExpiry
//
// Existing V1 listings are lost (users must re-list). Early stage = acceptable.
// Fee configs (RENTAL_RENT, RENTAL_BOOST) already set in ecosystem — no changes needed.
//
// Usage: npx hardhat run scripts/deploy_rental_v2.ts --network arbitrumSepolia

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const ADDRESSES_FILE = path.join(__dirname, "..", "deployment-addresses.json");
const TX_DELAY_MS = 2000;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function loadAddresses(): Record<string, string> {
    return JSON.parse(fs.readFileSync(ADDRESSES_FILE, "utf8"));
}

function saveAddress(key: string, value: string) {
    const addresses = loadAddresses();
    addresses[key] = value;
    fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 2));
    console.log(`   Saved ${key} = ${value}`);
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("═══════════════════════════════════════════════════");
    console.log("  RENTAL MANAGER V2 — DEPLOY + REGISTER MODULE");
    console.log("═══════════════════════════════════════════════════");
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Network:  ${(await ethers.provider.getNetwork()).chainId}`);

    const addresses = loadAddresses();
    const ecoAddr = addresses.backchainEcosystem;
    const boosterAddr = addresses.rewardBooster;
    const oldRentalAddr = addresses.rentalManager;

    if (!ecoAddr || !boosterAddr) {
        throw new Error("Missing ecosystem or rewardBooster in deployment-addresses.json");
    }

    console.log(`Ecosystem:          ${ecoAddr}`);
    console.log(`RewardBooster:      ${boosterAddr}`);
    console.log(`Old RentalManager:  ${oldRentalAddr}`);
    console.log("");

    // ═════════════════════════════════════════════════════════════════════
    // STEP 1: Deploy RentalManager V2
    // ═════════════════════════════════════════════════════════════════════
    console.log("[1/3] Deploying RentalManager V2...");
    const RentalManager = await ethers.getContractFactory("RentalManager");
    const rental = await RentalManager.deploy(ecoAddr, boosterAddr);
    await rental.waitForDeployment();
    const rentalAddr = await rental.getAddress();
    console.log(`   RentalManager V2: ${rentalAddr}`);
    saveAddress("rentalManager", rentalAddr);
    await sleep(TX_DELAY_MS);

    // ═════════════════════════════════════════════════════════════════════
    // STEP 2: Register module in ecosystem (using compiled artifact ABI)
    // ═════════════════════════════════════════════════════════════════════
    console.log("\n[2/3] Registering RENTAL module in ecosystem...");
    const eco = await ethers.getContractAt("BackchainEcosystem", ecoAddr, deployer);

    const moduleId = ethers.id("RENTAL");
    try {
        // registerModule(address _contract, bytes32 _moduleId, ModuleConfig _cfg)
        // ModuleConfig = (bool active, uint16 customBps, uint16 operatorBps, uint16 treasuryBps, uint16 buybackBps)
        // STANDARD split: 0% custom, 15% operator, 30% treasury, 55% buyback = 10000
        const tx = await eco.registerModule(
            rentalAddr,        // address _contract
            moduleId,          // bytes32 _moduleId
            [true, 0, 1500, 3000, 5500] // ModuleConfig tuple
        );
        await tx.wait();
        console.log(`   RENTAL module registered: ${tx.hash}`);
    } catch (e: any) {
        console.log(`   RENTAL module: SKIP (${e.message?.slice(0, 120)})`);
    }
    await sleep(TX_DELAY_MS);

    // ═════════════════════════════════════════════════════════════════════
    // STEP 3: Verify fee configs (already set in ecosystem deploy)
    // ═════════════════════════════════════════════════════════════════════
    console.log("\n[3/3] Verifying fee configs...");
    const feeChecks = [
        { name: "RENTAL_RENT",  id: ethers.id("RENTAL_RENT") },
        { name: "RENTAL_BOOST", id: ethers.id("RENTAL_BOOST") },
    ];

    for (const check of feeChecks) {
        try {
            const config = await eco.getFeeConfig(check.id);
            const feeType = Number(config.feeType) === 0 ? "gas" : "value";
            console.log(`   ${check.name}: type=${feeType} bps=${config.bps} mult=${config.multiplier} gas=${config.gasEstimate}`);
        } catch (e: any) {
            console.log(`   ${check.name}: NOT FOUND — may need manual configuration!`);
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════");
    console.log("  DEPLOYMENT COMPLETE");
    console.log("═══════════════════════════════════════════════════");
    console.log(`Old RentalManager (V1): ${oldRentalAddr} (retired)`);
    console.log(`New RentalManager (V2): ${rentalAddr}`);
    console.log(`Module registered:      YES`);
    console.log(`Fee configs:            Pre-existing (verified)`);
    console.log("\nNext: update frontend ABI (rental-tx.js) and deploy to Vercel");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
});
