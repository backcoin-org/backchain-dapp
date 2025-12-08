import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  // 1. Carregar endereços do JSON automaticamente
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  
  if (!fs.existsSync(addressesFilePath)) {
    throw new Error("❌ Arquivo deployment-addresses.json não encontrado!");
  }
  
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
  const fortunePoolAddress = addresses.fortunePool;

  if (!fortunePoolAddress) {
    throw new Error("❌ Endereço 'fortunePool' não encontrado no JSON.");
  }

  console.log(`🔍 Verificando FortunePool em: ${fortunePoolAddress}`);

  // 2. Conectar ao contrato
  const pool = await ethers.getContractAt("FortunePool", fortunePoolAddress);

  // 3. Verificar Tiers e Taxas
  const count = await pool.activeTierCount();
  console.log(`\n📊 Tiers Ativos: ${count.toString()} (Esperado: 3)`);

  const fee = await pool.oracleFeeInWei();
  console.log(`💰 Oracle Fee: ${ethers.formatEther(fee)} ETH (Esperado: 0.00035)`);

  // 4. Detalhes dos Tiers
  if (count > 0n) {
      console.log("\n📋 Detalhes dos Tiers:");
      for(let i = 1; i <= Number(count); i++) {
          const tier = await pool.prizeTiers(i);
          console.log(`   🔸 Tier ${i}: Range 1-${tier.range} | Mult: ${tier.multiplierBips} BIPS | Ativo: ${tier.isActive}`);
      }
  } else {
      console.log("⚠️ NENHUM TIER ATIVO! O jogo vai falhar.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});