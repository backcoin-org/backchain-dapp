// scripts/deploy_notary_v4.ts
// Deploy Notary V4 — Native ERC-721 Certificate NFTs
// Usage: npx hardhat run scripts/deploy_notary_v4.ts --network arbitrumSepolia

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const ADDRESSES_FILE = path.join(__dirname, "..", "deployment-addresses.json");
const BASE_TOKEN_URI = "https://backcoin.org/api/cert-metadata/";

function loadAddresses() {
    return JSON.parse(fs.readFileSync(ADDRESSES_FILE, "utf8"));
}

function updateAddresses(key: string, value: string) {
    const data = loadAddresses();
    data[key] = value;
    fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Updated ${key} = ${value}`);
}

function removeAddress(key: string) {
    const data = loadAddresses();
    if (data[key]) {
        delete data[key];
        fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(data, null, 2));
        console.log(`🗑️  Removed ${key} from deployment-addresses.json`);
    }
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const addresses = loadAddresses();
    const ecoAddr = addresses.backchainEcosystem;
    console.log("Ecosystem:", ecoAddr);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 1: Deploy Notary V4
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n🚀 Step 1: Deploy Notary V4 (ERC-721)...");

    const Notary = await ethers.getContractFactory("Notary");
    const notary = await Notary.deploy(ecoAddr, BASE_TOKEN_URI);
    await notary.waitForDeployment();
    const notaryAddr = await notary.getAddress();
    console.log(`✅ Notary V4 deployed at: ${notaryAddr}`);

    const ver = await notary.version();
    console.log(`   Version: ${ver}`);
    console.log(`   Name:    ${await notary.name()}`);
    console.log(`   Symbol:  ${await notary.symbol()}`);

    updateAddresses("notary", notaryAddr);
    removeAddress("notaryCertNFT");

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: Register module in ecosystem
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n🔗 Step 2: Register NOTARY module...");

    const eco = await ethers.getContractAt("BackchainEcosystem", ecoAddr);
    const moduleId = ethers.id("NOTARY");

    // ModuleConfig: active, customBps(0), operatorBps(15%), treasuryBps(30%), buybackBps(55%)
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
    // STEP 3: Set fee configs (12 total — same as V3)
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n💰 Step 3: Set V4 fee configs...");

    const FEE_TYPE_GAS = 0;
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const DOC_TYPE_MULTIPLIERS: Record<number, number> = {
        0: 200,    // GENERAL
        1: 2000,   // CONTRACT
        2: 200,    // IDENTITY
        3: 1000,   // DIPLOMA
        4: 2700,   // PROPERTY
        5: 2000,   // FINANCIAL
        6: 2700,   // LEGAL
        7: 2700,   // MEDICAL
        8: 1000,   // IP
        9: 200,    // OTHER
    };

    const DOC_TYPE_NAMES = [
        "GENERAL", "CONTRACT", "IDENTITY", "DIPLOMA", "PROPERTY",
        "FINANCIAL", "LEGAL", "MEDICAL", "IP", "OTHER"
    ];

    const feeConfigs: Array<{ name: string; actionId: string; config: [number, number, number, number] }> = [];

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

    feeConfigs.push({
        name: "NOTARY_BOOST",
        actionId: ethers.id("NOTARY_BOOST"),
        config: [FEE_TYPE_GAS, 100, 2700, 300000]
    });

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

    console.log(`  Notary address:    ${notaryAddr}`);
    console.log(`  Version:           ${ver}`);
    console.log(`  Cert count:        ${await notary.certCount()}`);
    console.log(`  Total supply:      ${await notary.totalSupply()}`);
    console.log(`  MAX_BATCH_SIZE:    ${await notary.MAX_BATCH_SIZE()}`);
    console.log(`  MAX_BOOST_DAYS:    ${await notary.MAX_BOOST_DAYS()}`);

    // Verify ERC-721 interface
    const ERC721_ID = "0x80ac58cd";
    const ERC721_METADATA_ID = "0x5b5e139f";
    console.log(`  ERC-721:           ${await notary.supportsInterface(ERC721_ID)}`);
    console.log(`  ERC-721 Metadata:  ${await notary.supportsInterface(ERC721_METADATA_ID)}`);

    console.log("\n✅ Notary V4 (ERC-721) deployment complete!");
    console.log(`\nFrontend will auto-load from deployment-addresses.json`);
    console.log(`Token URI base: ${BASE_TOKEN_URI}`);
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
