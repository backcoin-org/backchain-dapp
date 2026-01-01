// ARQUIVO: scripts/6_fix_charity_authorization.ts
// ✅ FIX: Autorizar CharityPool no MiningManager

import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("\n═══════════════════════════════════════════════════════════════════════════");
    console.log("   🔧 FIX: Autorizar CharityPool no MiningManager");
    console.log("═══════════════════════════════════════════════════════════════════════════\n");

    const [deployer] = await ethers.getSigners();
    console.log(`   Deployer: ${deployer.address}`);

    // Load addresses
    let addresses: Record<string, string> = {};
    const addressPath = "./deployment-addresses.json";
    
    if (fs.existsSync(addressPath)) {
        addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));
    } else {
        console.log("❌ deployment-addresses.json não encontrado!");
        return;
    }

    const charityPoolAddr = addresses.charityPool;
    const miningManagerAddr = addresses.miningManager;

    if (!charityPoolAddr || !miningManagerAddr) {
        console.log("❌ CharityPool ou MiningManager não encontrado nos endereços!");
        return;
    }

    console.log(`   CharityPool: ${charityPoolAddr}`);
    console.log(`   MiningManager: ${miningManagerAddr}`);

    // Get MiningManager contract
    const MiningManager = await ethers.getContractFactory("MiningManager");
    const miningManager = MiningManager.attach(miningManagerAddr);

    // Check if already authorized
    const serviceKey = ethers.keccak256(ethers.toUtf8Bytes("CHARITY_POOL_SERVICE"));
    console.log(`   Service Key: ${serviceKey}`);
    
    const currentMiner = await miningManager.authorizedMiners(serviceKey);
    console.log(`   Current Authorized Miner: ${currentMiner}`);

    if (currentMiner.toLowerCase() === charityPoolAddr.toLowerCase()) {
        console.log(`\n   ✅ CharityPool já está autorizado!`);
        return;
    }

    // Authorize CharityPool using setAuthorizedMiner
    console.log(`\n   📝 Autorizando CharityPool...`);
    
    try {
        const tx = await miningManager.setAuthorizedMiner(serviceKey, charityPoolAddr);
        const receipt = await tx.wait();
        
        console.log(`   ✅ CharityPool autorizado!`);
        console.log(`   🔗 TX: https://sepolia.arbiscan.io/tx/${receipt?.hash}`);
        
        // Verify
        const newMiner = await miningManager.authorizedMiners(serviceKey);
        console.log(`   ✅ Verificação: ${newMiner.toLowerCase() === charityPoolAddr.toLowerCase() ? 'AUTORIZADO' : 'FALHA'}`);
        
    } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}`);
    }

    console.log("\n═══════════════════════════════════════════════════════════════════════════");
    console.log("   ✅ FIX COMPLETO");
    console.log("═══════════════════════════════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });