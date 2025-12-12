/**
 * 🎲 FORTUNE POOL ORACLE CONFIGURATION
 * 
 * Este script configura o endereço do Oracle no FortunePool
 * para que o indexer possa resolver os jogos.
 * 
 * Uso: npx hardhat run scripts/6_configure_fortune_oracle.ts --network arbitrumSepolia
 */

import { ethers } from "hardhat";
import * as fs from "fs";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

// Endereço derivado de ORACLE_PRIVATE_KEY no .env
const ORACLE_WALLET_ADDRESS = "0xD7E622124B78A28C4c928B271FC9423285804f98";

// Oracle fee base (0.001 ETH) - Modo 5x usará 0.005 ETH
const ORACLE_FEE = ethers.parseEther("0.001");

async function main() {
    console.log("\n🎲 FORTUNE POOL ORACLE CONFIGURATION\n");
    console.log("═".repeat(60));

    // ─────────────────────────────────────────────────────────────
    // 1. Carregar endereços
    // ─────────────────────────────────────────────────────────────
    const addressesPath = "./deployment-addresses.json";
    if (!fs.existsSync(addressesPath)) {
        console.error("❌ deployment-addresses.json not found!");
        process.exit(1);
    }
    
    const ADDRESSES = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const fortunePoolAddress = ADDRESSES.fortunePool;
    
    if (!fortunePoolAddress) {
        console.error("❌ FortunePool address not found in deployment-addresses.json!");
        process.exit(1);
    }

    console.log(`   📍 FortunePool: ${fortunePoolAddress}`);
    console.log(`   🔑 Target Oracle: ${ORACLE_WALLET_ADDRESS}`);
    console.log(`   💰 Oracle Fee: ${ethers.formatEther(ORACLE_FEE)} ETH\n`);

    // ─────────────────────────────────────────────────────────────
    // 2. Conectar ao contrato
    // ─────────────────────────────────────────────────────────────
    const [deployer] = await ethers.getSigners();
    console.log(`   👤 Deployer: ${deployer.address}`);
    
    const fortunePool = await ethers.getContractAt(
        [
            "function setOracle(address _oracle) external",
            "function setOracleFee(uint256 _fee) external",
            "function oracleAddress() view returns (address)",
            "function oracleFee() view returns (uint256)",
            "function owner() view returns (address)",
            "function activeTierCount() view returns (uint256)",
            "function prizePoolBalance() view returns (uint256)"
        ],
        fortunePoolAddress,
        deployer
    );

    // ─────────────────────────────────────────────────────────────
    // 3. Verificar owner
    // ─────────────────────────────────────────────────────────────
    const owner = await fortunePool.owner();
    console.log(`   👑 Contract Owner: ${owner}`);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.error(`\n❌ ERROR: You are not the owner!`);
        console.error(`   Your address: ${deployer.address}`);
        console.error(`   Owner address: ${owner}`);
        process.exit(1);
    }
    console.log(`   ✅ Owner verified\n`);

    // ─────────────────────────────────────────────────────────────
    // 4. Verificar estado atual
    // ─────────────────────────────────────────────────────────────
    console.log("═".repeat(60));
    console.log("   📊 CURRENT STATE\n");
    
    const currentOracle = await fortunePool.oracleAddress();
    const currentFee = await fortunePool.oracleFee();
    const activeTiers = await fortunePool.activeTierCount();
    const prizePool = await fortunePool.prizePoolBalance();
    
    console.log(`   Oracle Address: ${currentOracle}`);
    console.log(`   Oracle Fee: ${ethers.formatEther(currentFee)} ETH`);
    console.log(`   Active Tiers: ${activeTiers}`);
    console.log(`   Prize Pool: ${ethers.formatEther(prizePool)} BKC\n`);

    // ─────────────────────────────────────────────────────────────
    // 5. Configurar Oracle Address
    // ─────────────────────────────────────────────────────────────
    console.log("═".repeat(60));
    console.log("   🔧 CONFIGURING ORACLE\n");

    if (currentOracle.toLowerCase() === ORACLE_WALLET_ADDRESS.toLowerCase()) {
        console.log(`   ✅ Oracle address already correct!`);
    } else {
        console.log(`   ⏳ Setting oracle address...`);
        const tx1 = await fortunePool.setOracle(ORACLE_WALLET_ADDRESS);
        console.log(`   📤 Tx: ${tx1.hash}`);
        await tx1.wait();
        console.log(`   ✅ Oracle address updated!`);
    }

    // ─────────────────────────────────────────────────────────────
    // 6. Configurar Oracle Fee
    // ─────────────────────────────────────────────────────────────
    if (currentFee === ORACLE_FEE) {
        console.log(`   ✅ Oracle fee already correct!`);
    } else {
        console.log(`   ⏳ Setting oracle fee...`);
        const tx2 = await fortunePool.setOracleFee(ORACLE_FEE);
        console.log(`   📤 Tx: ${tx2.hash}`);
        await tx2.wait();
        console.log(`   ✅ Oracle fee updated!`);
    }

    // ─────────────────────────────────────────────────────────────
    // 7. Verificar configuração final
    // ─────────────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(60));
    console.log("   📊 FINAL STATE\n");
    
    const finalOracle = await fortunePool.oracleAddress();
    const finalFee = await fortunePool.oracleFee();
    
    console.log(`   Oracle Address: ${finalOracle}`);
    console.log(`   Oracle Fee (Base): ${ethers.formatEther(finalFee)} ETH`);
    console.log(`   Oracle Fee (5x Mode): ${ethers.formatEther(finalFee * 5n)} ETH`);
    
    // ─────────────────────────────────────────────────────────────
    // 8. Resultado
    // ─────────────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(60));
    
    const oracleOk = finalOracle.toLowerCase() === ORACLE_WALLET_ADDRESS.toLowerCase();
    const feeOk = finalFee === ORACLE_FEE;
    
    if (oracleOk && feeOk) {
        console.log("   ✅ FORTUNE POOL CONFIGURATION COMPLETE!\n");
        console.log("   Next steps:");
        console.log("   1. Restart the indexer (pm2 restart indexer)");
        console.log("   2. Run the ecosystem test again");
        console.log("   3. Games should now be fulfilled automatically!\n");
    } else {
        console.log("   ❌ CONFIGURATION FAILED!\n");
        if (!oracleOk) console.log(`   - Oracle mismatch: ${finalOracle}`);
        if (!feeOk) console.log(`   - Fee mismatch: ${ethers.formatEther(finalFee)}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });