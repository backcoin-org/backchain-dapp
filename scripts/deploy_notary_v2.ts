// scripts/deploy_notary_v2.ts
// Deploy Notary V3 — per-docType fees + boost + transfer fee + batch reads
// Usage: npx hardhat run scripts/deploy_notary_v2.ts --network arbitrumSepolia

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
    // STEP 1: Deploy Notary V3
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n🚀 Step 1: Deploy Notary V3...");

    const Notary = await ethers.getContractFactory("Notary");
    const notary = await Notary.deploy(ecoAddr);
    await notary.waitForDeployment();
    const notaryAddr = await notary.getAddress();
    console.log(`✅ Notary V3 deployed at: ${notaryAddr}`);

    const ver = await notary.version();
    console.log(`   Version: ${ver}`);

    updateAddresses("notary", notaryAddr);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: Register module in ecosystem
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n🔗 Step 2: Register NOTARY module...");

    const eco = await ethers.getContractAt("BackchainEcosystem", ecoAddr);
    const moduleId = ethers.id("NOTARY");

    // ModuleConfig: active, customBps(0 — no custom recipient), operatorBps(15%), treasuryBps(30%), buybackBps(55%)
    const moduleConfig = [true, 0, 1500, 3000, 5500];

    try {
        const tx = await eco.registerModule(notaryAddr, moduleId, moduleConfig);
        await tx.wait();
        console.log(`✅ Module NOTARY registered → ${notaryAddr}`);
    } catch (e: any) {
        if (e.message?.includes("already registered") || e.message?.includes("execution reverted")) {
            console.log("⚠️  Module already registered, trying updateModuleAddress...");
            try {
                const tx2 = await eco.updateModuleAddress(moduleId, notaryAddr);
                await tx2.wait();
                console.log(`✅ Module NOTARY address updated → ${notaryAddr}`);
            } catch (e2: any) {
                console.log(`⚠️  updateModuleAddress failed: ${e2.message?.slice(0, 80)}`);
                console.log("   Manual intervention may be needed.");
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 3: Set fee configs (12 total)
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n💰 Step 3: Set V3 fee configs...");

    const FEE_TYPE_GAS = 0;
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    // Per-docType multipliers (determines price tier)
    // General/Identity/Other = cheapest, Legal/Property/Medical = premium
    const DOC_TYPE_MULTIPLIERS: Record<number, number> = {
        0: 200,    // GENERAL — cheapest
        1: 2000,   // CONTRACT — medium
        2: 200,    // IDENTITY — cheap
        3: 1000,   // DIPLOMA — medium-high
        4: 2700,   // PROPERTY — premium
        5: 2000,   // FINANCIAL — medium
        6: 2700,   // LEGAL — premium
        7: 2700,   // MEDICAL — premium
        8: 1000,   // IP — medium-high
        9: 200,    // OTHER — cheapest
    };

    const DOC_TYPE_NAMES = [
        "GENERAL", "CONTRACT", "IDENTITY", "DIPLOMA", "PROPERTY",
        "FINANCIAL", "LEGAL", "MEDICAL", "IP", "OTHER"
    ];

    const feeConfigs: Array<{ name: string; actionId: string; config: [number, number, number, number] }> = [];

    // 10 per-type certify fees
    for (let docType = 0; docType <= 9; docType++) {
        const actionId = ethers.keccak256(
            abiCoder.encode(["string", "uint8"], ["NOTARY_CERTIFY_T", docType])
        );
        feeConfigs.push({
            name: `NOTARY_CERTIFY_${DOC_TYPE_NAMES[docType]}`,
            actionId,
            config: [FEE_TYPE_GAS, 100, DOC_TYPE_MULTIPLIERS[docType], 200000]
        });
    }

    // Boost fee (per-day, like CHARITY_BOOST)
    feeConfigs.push({
        name: "NOTARY_BOOST",
        actionId: ethers.id("NOTARY_BOOST"),
        config: [FEE_TYPE_GAS, 100, 2700, 300000]
    });

    // Transfer fee (small gas-based fee)
    feeConfigs.push({
        name: "NOTARY_TRANSFER",
        actionId: ethers.id("NOTARY_TRANSFER"),
        config: [FEE_TYPE_GAS, 100, 200, 200000]
    });

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

    console.log(`  Notary address:   ${notaryAddr}`);
    console.log(`  Version:          ${ver}`);
    console.log(`  Cert count:       ${await notary.certCount()}`);
    console.log(`  MAX_BATCH_SIZE:   ${await notary.MAX_BATCH_SIZE()}`);
    console.log(`  MAX_BOOST_DAYS:   ${await notary.MAX_BOOST_DAYS()}`);

    console.log("\n✅ Notary V3 deployment complete!");
    console.log(`\nFrontend will auto-load from deployment-addresses.json`);
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
