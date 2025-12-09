// scripts/close_presale.ts (RELATÓRIO DE VENDAS REAIS)

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ######################################################################

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(
    `\n📋 (RELATÓRIO) Lendo Vendas Reais do PublicSale na rede: ${networkName}`
  );
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereços ---
  const addressesFilePath = path.join(
    __dirname,
    "../deployment-addresses.json"
  );
  if (!fs.existsSync(addressesFilePath)) {
    throw new Error("❌ Erro: 'deployment-addresses.json' não encontrado. Execute o deploy primeiro.");
  }
  const addresses: { [key: string]: string } = JSON.parse(
    fs.readFileSync(addressesFilePath, "utf8")
  );

  const saleAddress = addresses.publicSale;
  if (!saleAddress) {
    throw new Error("❌ Erro: Endereço do PublicSale não encontrado no JSON.");
  }

  // --- 2. Obter Contrato ---
  const saleContract = await ethers.getContractAt(
    "PublicSale",
    saleAddress,
    deployer
  );
  
  try {
    console.log("--- RESULTADO DE VENDAS REAIS (MINTED COUNT) ---");
    
    // Supondo que você tem 7 tiers (0 a 6)
    for (let i = 0; i < 7; i++) {
        const tierId = BigInt(i);
        const tierInfo = await saleContract.tiers(tierId);
        
        // mintedCount é o número real de NFTs vendidos
        const mintedCount = tierInfo.mintedCount;
        
        console.log(`[Tier ${i} - ${tierInfo.metadata}]: ${mintedCount.toString()} VENDIDOS.`);
    }

    console.log("----------------------------------------------------");
    console.log("⚠️ Use estes números para calcular a quantidade de NFTs a cunhar no '3_launch_and_liquidate_ecosystem.ts'.");

  } catch (error: any) {
    console.error(
      "\n❌ Falha grave ao ler as vendas:",
      error.message
    );
    process.exit(1);
  }
}

// Bloco de entrada para execução standalone
if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}