// scripts/deploy_agora_v3.ts
// Deploy Agora V3.0 "The Forever Protocol" — re-register module + set new fee configs

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
    // STEP 1: Deploy Agora V3
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n🚀 Step 1: Deploy Agora V3...");

    const Agora = await ethers.getContractFactory("Agora");
    const agora = await Agora.deploy(ecoAddr);
    await agora.waitForDeployment();
    const agoraAddr = await agora.getAddress();
    console.log(`✅ Agora V3 deployed at: ${agoraAddr}`);

    // Verify version
    const ver = await agora.version();
    console.log(`   Version: ${ver}`);

    updateAddresses("agora", agoraAddr);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: Re-register module in ecosystem (updates address)
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n🔗 Step 2: Register Agora V3 module...");

    // Use compiled ABI for correct function signature
    const eco = await ethers.getContractAt("BackchainEcosystem", ecoAddr);
    const moduleId = ethers.id("AGORA");

    // Module config: 50% to content creator, rest split among operator/treasury/buyback
    const moduleConfig = [true, 5000, 750, 1500, 2750];

    try {
        const tx = await eco.registerModule(agoraAddr, moduleId, moduleConfig);
        await tx.wait();
        console.log(`✅ Module AGORA registered → ${agoraAddr}`);
    } catch (e: any) {
        if (e.message?.includes("already registered") || e.message?.includes("execution reverted")) {
            console.log("⚠️  Module already registered, trying updateModuleAddress...");
            // If registerModule fails because module exists, try direct
            // The ecosystem should allow re-registration or have an update function
            throw e;
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 3: Set NEW V3 fee configs
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n💰 Step 3: Set V3 fee configs...");

    const FEE_TYPE_GAS = 0;
    const coder = ethers.AbiCoder.defaultAbiCoder();

    // New V3 action IDs and their fee configs
    const newFeeConfigs: Array<{ name: string; actionId: string; config: [number, number, number, number] }> = [
        // Downvote: social tier (same as like)
        {
            name: "AGORA_DOWNVOTE",
            actionId: ethers.id("AGORA_DOWNVOTE"),
            config: [FEE_TYPE_GAS, 100, 50, 150000]  // bps=100, mult=50, gas=150k
        },
        // Post boost standard: premium tier (same as profile boost per day)
        {
            name: "AGORA_BOOST_STD",
            actionId: ethers.id("AGORA_BOOST_STD"),
            config: [FEE_TYPE_GAS, 100, 2700, 300000]  // ~$6/day
        },
        // Post boost featured: 5x standard
        {
            name: "AGORA_BOOST_FEAT",
            actionId: ethers.id("AGORA_BOOST_FEAT"),
            config: [FEE_TYPE_GAS, 100, 13500, 300000]  // ~$30/day
        },
        // Username pricing per length (1-6 chars, 7+ = free)
        // Formula: fee = gasEstimate × gasPrice × bps × multiplier / 10000
        // Using bps=1000, gasEstimate=500000 for username pricing tier
        {
            name: "AGORA_USERNAME len=1",
            actionId: ethers.keccak256(coder.encode(["string", "uint256"], ["AGORA_USERNAME", 1])),
            config: [FEE_TYPE_GAS, 1000, 200000, 500000]  // ~1 ETH at base gas
        },
        {
            name: "AGORA_USERNAME len=2",
            actionId: ethers.keccak256(coder.encode(["string", "uint256"], ["AGORA_USERNAME", 2])),
            config: [FEE_TYPE_GAS, 1000, 40000, 500000]   // ~0.2 ETH
        },
        {
            name: "AGORA_USERNAME len=3",
            actionId: ethers.keccak256(coder.encode(["string", "uint256"], ["AGORA_USERNAME", 3])),
            config: [FEE_TYPE_GAS, 1000, 6000, 500000]    // ~0.03 ETH
        },
        {
            name: "AGORA_USERNAME len=4",
            actionId: ethers.keccak256(coder.encode(["string", "uint256"], ["AGORA_USERNAME", 4])),
            config: [FEE_TYPE_GAS, 1000, 800, 500000]     // ~0.004 ETH
        },
        {
            name: "AGORA_USERNAME len=5",
            actionId: ethers.keccak256(coder.encode(["string", "uint256"], ["AGORA_USERNAME", 5])),
            config: [FEE_TYPE_GAS, 1000, 100, 500000]     // ~0.0005 ETH
        },
        {
            name: "AGORA_USERNAME len=6",
            actionId: ethers.keccak256(coder.encode(["string", "uint256"], ["AGORA_USERNAME", 6])),
            config: [FEE_TYPE_GAS, 1000, 20, 500000]      // ~0.0001 ETH
        },
    ];

    // Set fee configs one by one
    for (const fc of newFeeConfigs) {
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

    console.log(`  Agora address:  ${agoraAddr}`);
    console.log(`  Version:        ${ver}`);
    console.log(`  Post counter:   ${await agora.postCounter()}`);
    console.log(`  Total profiles: ${await agora.totalProfiles()}`);
    console.log(`  TAG_COUNT:      ${await agora.TAG_COUNT()}`);
    console.log(`  EDIT_WINDOW:    ${await agora.EDIT_WINDOW()} seconds`);

    console.log("\n✅ Agora V3 deployment complete!");
    console.log(`\nUpdate frontend: deployment-addresses.json → agora: "${agoraAddr}"`);
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
