// scripts/2_configure_hub_addresses.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// --- REMOVIDA A CORREÇÃO ESM (fileURLToPath) ---

// A FUNÇÃO PRINCIPAL É AGORA EXPORTADA
export async function runScript(hre: HardhatRuntimeEnvironment) { // Mantendo HardhatRuntimeEnvironment se disponível
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Passo 2/8) Configurando Endereços no Hub na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereços ---
  // __dirname agora funciona nativamente (CommonJS)
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    console.error("❌ Erro: 'deployment-addresses.json' não encontrado.");
    throw new Error("Missing deployment-addresses.json");
  }
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  // Validar endereços necessários
  const required = [
    "ecosystemManager",
    "bkcToken",
    "delegationManager",
    "rewardBoosterNFT",
  ];
  for (const addr of required) {
    if (!addresses[addr]) {
      console.error(`❌ Erro: Endereço '${addr}' não encontrado em deployment-addresses.json.`);
      throw new Error(`Missing required address: ${addr}`);
    }
  }

  // --- 2. Obter Instância do Hub ---
  const ecosystemManager = await ethers.getContractAt(
    "EcosystemManager",
    addresses.ecosystemManager,
    deployer
  );

  try {
    // --- 3. Definir Endereços Centrais ---
    console.log("1. Definindo endereços centrais no EcosystemManager...");
    const tx = await ecosystemManager.setAddresses(
      addresses.bkcToken,
      deployer.address, // Usando o deployer como Tesouraria inicial
      addresses.delegationManager,
      addresses.rewardBoosterNFT
    );
    await tx.wait();
    console.log("✅ Endereços centrais definidos com sucesso.");
    console.log(`   -> Tesouraria definida para: ${deployer.address}`);
    console.log("----------------------------------------------------");
    
  } catch (error: any) {
    console.error("❌ Falha na configuração dos endereços (Passo 2):", error.message);
    throw error;
  }

  console.log("\n🎉🎉🎉 ENDEREÇOS DO HUB CONFIGURADOS COM SUCESSO! 🎉🎉🎉");
  console.log("\nPróximo passo: Execute '3_deploy_spokes.ts'");
}