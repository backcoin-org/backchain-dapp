// scripts/deploy_charity_v2.ts
// Deploy CharityPool V2 — variable-day boost + batch reads + boost revenue tracking
// Usage: npx hardhat run scripts/deploy_charity_v2.ts --network arbitrumSepolia

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const ADDRESSES_FILE = path.join(__dirname, "..", "deployment-addresses.json");

function loadAddresses() {
    return JSON.parse(fs.readFileSync(ADDRESSES_FILE, "utf8"));
}

function updateAddresses(key: string, value: string) {
    const data = loadAddresses();
    data[key] = value;
    fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Updated ${key} = ${value}`);
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const addresses = loadAddresses();
    const ecoAddr = addresses.backchainEcosystem;
    console.log("Ecosystem:", ecoAddr);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 1: Deploy CharityPool V2
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n🚀 Step 1: Deploy CharityPool V2...");

    const CharityPool = await ethers.getContractFactory("CharityPool");
    const charity = await CharityPool.deploy(ecoAddr);
    await charity.waitForDeployment();
    const charityAddr = await charity.getAddress();
    console.log(`✅ CharityPool V2 deployed at: ${charityAddr}`);

    const ver = await charity.version();
    console.log(`   Version: ${ver}`);

    updateAddresses("charityPool", charityAddr);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: Register module in ecosystem
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n🔗 Step 2: Register CHARITY module...");

    const eco = await ethers.getContractAt("BackchainEcosystem", ecoAddr);
    const moduleId = ethers.id("CHARITY");

    // ModuleConfig: active, customBps(creator 70%), operatorBps(5%), treasuryBps(8.33%), buybackBps(16.67%)
    const moduleConfig = [true, 7000, 500, 833, 1667];

    try {
        const tx = await eco.registerModule(charityAddr, moduleId, moduleConfig);
        await tx.wait();
        console.log(`✅ Module CHARITY registered → ${charityAddr}`);
    } catch (e: any) {
        if (e.message?.includes("already registered") || e.message?.includes("execution reverted")) {
            console.log("⚠️  Module already registered, trying updateModuleAddress...");
            throw e;
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 3: Set fee configs
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n💰 Step 3: Set V2 fee configs...");

    const FEE_TYPE_GAS = 0;
    const FEE_TYPE_VALUE = 1;

    const feeConfigs: Array<{ name: string; actionId: string; config: [number, number, number, number] }> = [
        // Create: gas-based, spam prevention — small fee
        {
            name: "CHARITY_CREATE",
            actionId: ethers.id("CHARITY_CREATE"),
            config: [FEE_TYPE_GAS, 100, 50, 200000]  // bps=100, mult=50, gas=200k
        },
        // Donate: value-based 500 bps (5% of donation)
        {
            name: "CHARITY_DONATE",
            actionId: ethers.id("CHARITY_DONATE"),
            config: [FEE_TYPE_VALUE, 500, 1, 0]  // 5% of donation value
        },
        // Boost: gas-based, per-day pricing (same tier as RENTAL_BOOST)
        {
            name: "CHARITY_BOOST",
            actionId: ethers.id("CHARITY_BOOST"),
            config: [FEE_TYPE_GAS, 100, 2700, 300000]  // ~$6/day at typical gas
        },
    ];

    for (const fc of feeConfigs) {
        try {
            const tx = await eco.setFeeConfig(fc.actionId, fc.config);
            await tx.wait();
            console.log(`  ✅ ${fc.name} → [${fc.config}]`);
        } catch (e: any) {
            console.log(`  ⚠️  ${fc.name} failed: ${e.message?.slice(0, 80)}`);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 4: Verify
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n🔍 Step 4: Verify deployment...");

    console.log(`  CharityPool address: ${charityAddr}`);
    console.log(`  Version:            ${ver}`);
    console.log(`  Campaign count:     ${await charity.campaignCount()}`);
    console.log(`  MAX_BOOST_DAYS:     ${await charity.MAX_BOOST_DAYS()}`);

    console.log("\n✅ CharityPool V2 deployment complete!");
    console.log(`\nFrontend will auto-load from deployment-addresses.json`);
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
