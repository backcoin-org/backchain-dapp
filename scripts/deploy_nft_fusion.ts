// scripts/deploy_nft_fusion.ts
// Deploy NFTFusion contract + authorize in RewardBooster + register fee configs
//
// Usage: npx hardhat run scripts/deploy_nft_fusion.ts --network arbitrumSepolia

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
    console.log("Deployer:", deployer.address);

    const addresses = loadAddresses();
    const ecoAddr = addresses.backchainEcosystem;
    const boosterAddr = addresses.rewardBooster;

    if (!ecoAddr || !boosterAddr) {
        throw new Error("Missing ecosystem or rewardBooster in deployment-addresses.json");
    }

    console.log("Ecosystem:", ecoAddr);
    console.log("RewardBooster:", boosterAddr);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Deploy NFTFusion
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n[1/3] Deploying NFTFusion...");
    const NFTFusion = await ethers.getContractFactory("NFTFusion");
    const fusion = await NFTFusion.deploy(ecoAddr, boosterAddr);
    await fusion.waitForDeployment();
    const fusionAddr = await fusion.getAddress();
    console.log("   NFTFusion deployed at:", fusionAddr);
    saveAddress("nftFusion", fusionAddr);
    await sleep(TX_DELAY_MS);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Authorize NFTFusion in RewardBooster
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n[2/3] Setting fusion contract on RewardBooster...");
    const boosterABI = [
        "function setFusionContract(address _fusion) external",
        "function fusionContract() view returns (address)"
    ];
    const booster = new ethers.Contract(boosterAddr, boosterABI, deployer);

    // Check if already set
    const currentFusion = await booster.fusionContract();
    if (currentFusion !== ethers.ZeroAddress) {
        console.log("   WARNING: fusionContract already set to:", currentFusion);
        console.log("   Skipping setFusionContract (can only be set once)");
    } else {
        const tx = await booster.setFusionContract(fusionAddr);
        await tx.wait();
        console.log("   setFusionContract OK:", tx.hash);
    }
    await sleep(TX_DELAY_MS);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Register fee configs for fusion/split actions (if not already)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n[3/3] Registering fusion/split fee configs...");
    const ecoABI = [
        "function setActionFeeConfig(bytes32 actionId, uint8 feeType, uint32 bps, uint32 multiplier, uint32 gasEstimate) external",
        "function getFeeConfig(bytes32 actionId) view returns (uint8 feeType, uint32 bps, uint32 multiplier, uint32 gasEstimate)",
        "function registerModule(bytes32 moduleId, address moduleAddr, bool active, uint16 customBps, uint16 operatorBps, uint16 treasuryBps, uint16 buybackBps, address customRecipient) external"
    ];
    const eco = new ethers.Contract(ecoAddr, ecoABI, deployer);

    // Gas-based fee: feeType=1, bps=100, multiplier=2000, gasEstimate=200000 (GAS_FEE_FINANCIAL)
    const FEE_TYPE_GAS = 1;
    const fusionActions = [
        { name: "FUSION_BRONZE", id: ethers.id("FUSION_BRONZE") },
        { name: "FUSION_SILVER", id: ethers.id("FUSION_SILVER") },
        { name: "FUSION_GOLD",   id: ethers.id("FUSION_GOLD") },
        { name: "SPLIT_SILVER",  id: ethers.id("SPLIT_SILVER") },
        { name: "SPLIT_GOLD",    id: ethers.id("SPLIT_GOLD") },
        { name: "SPLIT_DIAMOND", id: ethers.id("SPLIT_DIAMOND") },
    ];

    for (const action of fusionActions) {
        try {
            const config = await eco.getFeeConfig(action.id);
            if (Number(config.bps) > 0) {
                console.log(`   ${action.name}: already configured (bps=${config.bps})`);
                continue;
            }
        } catch {}

        try {
            const tx = await eco.setActionFeeConfig(
                action.id, FEE_TYPE_GAS, 100, 2000, 200000
            );
            await tx.wait();
            console.log(`   ${action.name}: fee config set (${tx.hash})`);
            await sleep(TX_DELAY_MS);
        } catch (e: any) {
            console.log(`   ${action.name}: SKIP (${e.message?.slice(0, 60)})`);
        }
    }

    // Register NFT_FUSION module in ecosystem (if not already)
    const moduleId = ethers.id("NFT_FUSION");
    try {
        const tx = await eco.registerModule(
            moduleId, fusionAddr, true,
            0,    // customBps
            1500, // operatorBps (15%)
            3000, // treasuryBps (30%)
            5500, // buybackBps (55%)
            ethers.ZeroAddress // no custom recipient
        );
        await tx.wait();
        console.log("   NFT_FUSION module registered:", tx.hash);
    } catch (e: any) {
        console.log("   NFT_FUSION module: SKIP (", e.message?.slice(0, 60), ")");
    }

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("   NFTFusion deployed and configured!");
    console.log("   Address:", fusionAddr);
    console.log("════════════════════════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
