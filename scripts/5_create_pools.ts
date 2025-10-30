// scripts/5_create_pools.ts
import hre from "hardhat";
import fs from "fs";
import path from "path";
import addressesJson from "../deployment-addresses.json";

// Type assertion for the addresses object
const addresses: { [key: string]: string } = addressesJson;

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

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Passo 5/8) Criando estruturas de Pool AMM na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereço ---
  const poolAddress = addresses.nftLiquidityPool;
  if (!poolAddress) {
    console.error("❌ Erro: Endereço 'nftLiquidityPool' não encontrado em deployment-addresses.json.");
    console.error("Por favor, execute os scripts 1, 2 e 3 primeiro.");
    process.exit(1);
  }

  // --- 2. Obter Instância do Contrato ---
  const nftLiquidityPool = await ethers.getContractAt(
    "NFTLiquidityPool",
    poolAddress,
    deployer
  );

  // --- 3. Criar Pools ---
  console.log("Criando 7 estruturas de pool vazias...");
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
  console.log("\n🎉 Processo de criação de pools concluído!");
  console.log(`   Total de pools criados: ${createdCount}`);
  console.log(`   Total ignorados (já existiam): ${skippedCount}`);
  console.log("\nPróximo passo: Execute '6_setup_sale.ts'");
}

main().catch((error: any) => {
  console.error("\n❌ ERRO CRÍTICO DURANTE A CRIAÇÃO DOS POOLS (Passo 5) ❌\n");

  if (
    error.message.includes("ProviderError") ||
    error.message.includes("in-flight") ||
    error.message.includes("nonce") ||
    error.message.includes("underpriced")
  ) {
    console.error(
      "Causa Provável: Problema de conexão de rede ou transação pendente."
    );
    console.log("\n--- AÇÃO RECOMENDADA ---");
    console.log(
      "1. No MetaMask, vá em 'Configurações' -> 'Avançado' e clique em 'Limpar dados de atividade'."
    );
    console.log(
      "2. Aguarde um minuto e tente executar ESTE SCRIPT ('5_create_pools.ts') novamente."
    );
  } else {
    console.error("Ocorreu um erro inesperado:", error.message);
  }

  process.exit(1);
});