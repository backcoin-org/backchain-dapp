// scripts/6_fix_oracle_permissions.ts
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔧 FIXING ORACLE PERMISSIONS...");

  // 1. Carregar endereços
  const addressesPath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesPath)) throw new Error("Deployment file not found.");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  // 2. Preparar as Carteiras
  const [deployer] = await ethers.getSigners(); // Dono do contrato (quem pode mudar as regras)
  
  const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY;
  if (!oraclePrivateKey) throw new Error("❌ ORACLE_PRIVATE_KEY is missing in .env");
  
  const oracleWallet = new ethers.Wallet(oraclePrivateKey);

  console.log(`   👤 Owner (Deployer):  ${deployer.address}`);
  console.log(`   🔑 Indexer Key (.env): ${oracleWallet.address}`);

  // 3. Conectar ao Contrato
  const fortunePool = await ethers.getContractAt("FortunePool", addresses.fortunePool, deployer);
  
  // 4. Verificar o estado atual
  const currentOracleOnContract = await fortunePool.oracleAddress();
  console.log(`   🏛️  Contract Expects:  ${currentOracleOnContract}`);

  if (currentOracleOnContract.toLowerCase() === oracleWallet.address.toLowerCase()) {
      console.log("\n   ✅ ALREADY SYNCED! No action needed.");
      return;
  }

  // 5. Corrigir se estiver errado
  console.log("\n   ⚠️ MISMATCH DETECTED! Updating contract...");
  
  const tx = await fortunePool.setOracleAddress(oracleWallet.address);
  console.log(`   ➡️ Setting Oracle Address... (Tx: ${tx.hash})`);
  await tx.wait();

  console.log("   ✅ SUCCESS! Oracle permissions updated.");
  console.log("   👉 Now restart your indexer: 'pm2 restart indexer'");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});