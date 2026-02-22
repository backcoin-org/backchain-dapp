// scripts/deploy_notary_v5.ts
// Standalone deploy script for Notary V5 — Cartório Digital
// Replaces V4 Notary in existing ecosystem
//
// Usage: npx hardhat run scripts/deploy_notary_v5.ts --network sepolia
// ============================================================================

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");

function loadAddresses(): Record<string, string> {
    return JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
}

function updateAddressJSON(key: string, value: string) {
    const addresses = loadAddresses();
    addresses[key] = value;
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ── Fixed Fee Tiers (same as deploy_ecosystem.ts) ──
const FEE_TYPE_FIXED = 2;
const UINT32_MAX = 4_294_967_295n;
const FIXED = (weiAmount: bigint) => {
    let multiplier = 1_000_000n;
    let gasEst = weiAmount / multiplier;
    if (gasEst > UINT32_MAX) {
        multiplier = 1_000_000_000n;
        gasEst = weiAmount / multiplier;
    }
    if (gasEst * multiplier !== weiAmount) {
        throw new Error(`FIXED: cannot split ${weiAmount} into uint32 × uint32`);
    }
    return [FEE_TYPE_FIXED, 0, Number(multiplier), Number(gasEst)];
};

const FIXED_CONTENT   = FIXED(200000000000000n);   // 0.0002  BNB (~$0.12)
const FIXED_FINANCIAL = FIXED(500000000000000n);    // 0.0005  BNB (~$0.30)
const FIXED_PREMIUM   = FIXED(1000000000000000n);   // 0.001   BNB (~$0.60)

async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = loadAddresses();

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("   🏛️ NOTARY V5 — Cartório Digital — Standalone Deploy");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`   Deployer:  ${deployer.address}`);
    console.log(`   Ecosystem: ${addresses.backchainEcosystem}`);
    console.log(`   Old Notary (V4): ${addresses.notary}`);
    console.log("");

    const ecoAddr = addresses.backchainEcosystem;
    const oldNotaryAddr = addresses.notary;

    if (!ecoAddr) throw new Error("Missing backchainEcosystem in deployment-addresses.json");

    // ══════════════════════════════════════════════════════════════════════
    // STEP 1: Deploy Notary V5
    // ══════════════════════════════════════════════════════════════════════
    console.log("   📦 Step 1: Deploying Notary V5...");

    const Notary = await ethers.getContractFactory("Notary");
    const baseTokenURI = "https://backcoin.org/api/cert-metadata/";
    const notary = await Notary.deploy(ecoAddr, baseTokenURI);
    await notary.waitForDeployment();
    const newNotaryAddr = await notary.getAddress();

    const version = await notary.version();
    const name = await notary.name();
    const symbol = await notary.symbol();

    console.log(`   ✅ Notary V5 deployed: ${newNotaryAddr}`);
    console.log(`      Name: ${name} | Symbol: ${symbol} | Version: ${version}`);
    console.log(`      BaseURI: ${baseTokenURI}`);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: Deauthorize old Notary V4
    // ══════════════════════════════════════════════════════════════════════
    if (oldNotaryAddr) {
        console.log("\n   🗑️ Step 2: Deauthorizing old Notary V4...");
        const eco = await ethers.getContractAt("BackchainEcosystem", ecoAddr);

        try {
            const tx = await eco.deauthorizeContract(oldNotaryAddr);
            await tx.wait();
            console.log(`   ✅ Old Notary ${oldNotaryAddr} deauthorized`);
        } catch (e: any) {
            console.warn(`   ⚠️ Could not deauthorize old Notary: ${e.message}`);
            console.warn(`      (May already be deauthorized or not found)`);
        }

        await sleep(2000);
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 3: Register new Notary V5 as NOTARY module
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n   📋 Step 3: Registering Notary V5 as NOTARY module...");
    const eco = await ethers.getContractAt("BackchainEcosystem", ecoAddr);
    const NOTARY_MODULE_ID = ethers.id("NOTARY");

    // Standard config: 15% operator | 30% treasury | 55% buyback
    const moduleConfig = [true, 0, 1500, 3000, 5500];

    const regTx = await eco.registerModule(newNotaryAddr, NOTARY_MODULE_ID, moduleConfig);
    await regTx.wait();
    console.log(`   ✅ NOTARY module registered → ${newNotaryAddr}`);

    await sleep(2000);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 4: Configure fees for new asset actions
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n   💰 Step 4: Configuring asset fee configs...");

    const newActionIds = [
        ethers.id("ASSET_REGISTER"),
        ethers.id("ASSET_TRANSFER"),
        ethers.id("ASSET_ANNOTATE"),
    ];
    const newFeeConfigs = [
        FIXED_PREMIUM,    // 0.001 BNB
        FIXED_FINANCIAL,  // 0.0005 BNB
        FIXED_CONTENT,    // 0.0002 BNB
    ];

    const feeTx = await eco.setFeeConfigBatch(newActionIds, newFeeConfigs);
    await feeTx.wait();
    console.log("   ✅ Fee configs set:");
    console.log("      ASSET_REGISTER:  0.001  BNB (FIXED_PREMIUM)");
    console.log("      ASSET_TRANSFER:  0.0005 BNB (FIXED_FINANCIAL)");
    console.log("      ASSET_ANNOTATE:  0.0002 BNB (FIXED_CONTENT)");

    // ══════════════════════════════════════════════════════════════════════
    // STEP 5: Update deployment-addresses.json
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n   📝 Step 5: Updating deployment-addresses.json...");
    updateAddressJSON("notary", newNotaryAddr);
    console.log(`   ✅ notary → ${newNotaryAddr}`);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 6: Verify deployment
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n   🔍 Step 6: Verifying deployment...");

    const v = await notary.version();
    const certCount = await notary.certCount();
    const assetCount = await notary.assetCount();
    const erc721 = await notary.supportsInterface("0x80ac58cd");
    const erc721meta = await notary.supportsInterface("0x5b5e139f");

    console.log(`      Version:           ${v}`);
    console.log(`      CertCount:         ${certCount}`);
    console.log(`      AssetCount:        ${assetCount}`);
    console.log(`      ERC-721:           ${erc721}`);
    console.log(`      ERC-721 Metadata:  ${erc721meta}`);

    // Check module is authorized
    const moduleId = await eco.authorizedContracts(newNotaryAddr);
    console.log(`      Module ID:         ${moduleId === NOTARY_MODULE_ID ? '✅ NOTARY' : '❌ MISMATCH'}`);

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   🎉 NOTARY V5 DEPLOYMENT COMPLETE");
    console.log(`   New Address: ${newNotaryAddr}`);
    console.log("═══════════════════════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error("❌ Deploy failed:", error);
    process.exitCode = 1;
});
