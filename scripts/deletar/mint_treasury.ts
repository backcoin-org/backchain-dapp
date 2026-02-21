// scripts/mint_treasury.ts
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

// ######################################################################
// ###               CONFIGURAR CUNHAGEM DA TESOURARIA                ###
// ######################################################################

// Defina os NFTs que você deseja cunhar para a Tesouraria
const TIERS_TO_MINT = [
  { 
    amount: 10, // Quantidade
    boostBips: 5000, // Diamond
    metadata: "diamond_booster.json" 
  },
  { 
    amount: 25, // Quantidade
    boostBips: 4000, // Platinum
    metadata: "platinum_booster.json" 
  },
  // Adicione quantos tiers quiser...
];

// Lote de cunhagem
const CHUNK_SIZE = 150;

// ######################################################################

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(
    `🚀 (GERENCIAMENTO) Executando cunhagem manual para a Tesouraria na rede: ${networkName}`
  );
  console.log(`Usando a conta (Owner): ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereços ---
  const addressesFilePath = path.join(
    __dirname,
    "../deployment-addresses.json"
  );
  if (!fs.existsSync(addressesFilePath)) {
    throw new Error("Missing deployment-addresses.json.");
  }
  const addresses: { [key: string]: string } = JSON.parse(
    fs.readFileSync(addressesFilePath, "utf8")
  );

  const { ecosystemManager, rewardBoosterNFT } = addresses;
  if (!ecosystemManager || !rewardBoosterNFT) {
    throw new Error("EcosystemManager or RewardBoosterNFT address not found.");
  }

  // --- 2. Obter Contratos ---
  const hub = await ethers.getContractAt(
    "EcosystemManager",
    ecosystemManager,
    deployer
  );
  const boosterNFT = await ethers.getContractAt(
    "RewardBoosterNFT",
    rewardBoosterNFT,
    deployer
  );

  try {
    // --- 3. Obter Endereço da Tesouraria ---
    const treasuryWallet = await hub.getTreasuryAddress();
    if (treasuryWallet === "0x0000000000000000000000000000000000000000") {
        throw new Error("Treasury address is not set in EcosystemManager.");
    }
    console.log(`Cunhando NFTs para a Tesouraria em: ${treasuryWallet}`);

    // --- 4. Executar Cunhagem ---
    for (const tier of TIERS_TO_MINT) {
      if (tier.amount === 0) continue;
      
      console.log(`\n   -> Cunhando ${tier.amount} NFTs (${tier.metadata})...`);
      
      let totalMinted = 0;
      while (totalMinted < tier.amount) {
        const remaining = tier.amount - totalMinted;
        const amountToMint = remaining < CHUNK_SIZE ? remaining : CHUNK_SIZE;

        const tx = await boosterNFT.ownerMintBatch(
          treasuryWallet,
          BigInt(amountToMint),
          BigInt(tier.boostBips),
          tier.metadata
        );
        await tx.wait();
        
        totalMinted += amountToMint;
        console.log(`      ... ${totalMinted} / ${tier.amount} cunhados.`);
      }
      console.log(`   ✅ Lote de ${tier.metadata} concluído.`);
    }

    console.log("----------------------------------------------------");
    console.log("\n🎉🎉🎉 CUNHAGEM DA TESOURARIA CONCLUÍDA! 🎉🎉🎉");
  } catch (error: any) {
    console.error(
      "\n❌ Falha grave durante a cunhagem da Tesouraria:",
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