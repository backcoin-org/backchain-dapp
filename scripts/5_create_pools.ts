// scripts/5_create_pools.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
// REMOVIDO: import addressesJson from "../deployment-addresses.json";

// REMOVIDO: const addresses: { [key: string]: string } = addressesJson;

// --- ⚙️ CONFIGURATION ---
// Esta lista DEVE corresponder aos descontos imutáveis
// definidos no EcosystemManager.
const TIERS_TO_CREATE = [
  { name: "Diamond", boostBips: 5000 },
  { name: "Platinum", boostBips: 4000 },
  { name: "Gold", boostBips: 3000 },
  { name: "Silver", boostBips: 2000 },
  { name: "Bronze", boostBips: 1000 },
  { name: "Iron", boostBips: 500 },
  { name: "Crystal", boostBips: 100 },
];
// ------------------------

// A FUNÇÃO PRINCIPAL É AGORA EXPORTADA
export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Passo 5/8) Criando estruturas de Pool AMM (para NFTs) na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereço (MOVIDO PARA DENTRO DA FUNÇÃO) ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    console.error("❌ Erro: 'deployment-addresses.json' não encontrado. O Passo 1 falhou?");
    throw new Error("Missing deployment-addresses.json");
  }
  const addresses: { [key: string]: string } = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
  
  const poolAddress = addresses.nftLiquidityPool;
  if (!poolAddress) {
    console.error("❌ Erro: Endereço 'nftLiquidityPool' não encontrado em deployment-addresses.json.");
    throw new Error("Missing nftLiquidityPool address.");
  }

  // --- 2. Obter Instância do Contrato ---
  const nftLiquidityPool = await ethers.getContractAt(
    "NFTLiquidityPool",
    poolAddress,
    deployer
  );

  // --- 3. Criar Pools ---
  console.log("Criando 7 estruturas de pool vazias para o AMM de NFT...");
  let createdCount = 0;
  let skippedCount = 0;

  for (const tier of TIERS_TO_CREATE) {
    console.log(`\n -> Processando pool: ${tier.name} (BoostBips: ${tier.boostBips})`);
    
    try {
      // Verifica se o pool já foi inicializado
      const poolInfo = await nftLiquidityPool.pools(tier.boostBips);
      
      if (poolInfo.isInitialized) {
        console.log(`   ⚠️ IGNORADO: Pool para ${tier.name} já está inicializado.`);
        skippedCount++;
        continue;
      }

      // Se não inicializado, cria
      const tx = await nftLiquidityPool.createPool(tier.boostBips);
      await tx.wait();
      console.log(`   ✅ SUCESSO: Estrutura de pool para ${tier.name} criada.`);
      createdCount++;

    } catch (error: any) {
      console.error(`   ❌ FALHA ao criar pool para ${tier.name}. Razão: ${error.reason || error.message}`);
      throw error; // Interrompe o script se um falhar
    }
  }

  console.log("----------------------------------------------------");
  console.log("\n🎉 Processo de criação de pools AMM concluído!");
  console.log(`   Total de pools criados: ${createdCount}`);
  console.log(`   Total ignorados (já existiam): ${skippedCount}`);
  console.log("\nPróximo passo: Execute '6_setup_sale.ts'");
}