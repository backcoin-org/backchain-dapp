// scripts/3_deploy_spokes.ts
import hre from "hardhat";
import fs from "fs";
import path from "path";

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEPLOY_DELAY_MS = 2000; // 2-second delay

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Passo 3/8) Implantando Contratos "Spoke" na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereços Existentes ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    console.error("❌ Erro: 'deployment-addresses.json' não encontrado.");
    console.error("Por favor, execute '1_deploy_core.ts' e '2_configure_hub_addresses.ts' primeiro.");
    process.exit(1);
  }
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  if (!addresses.ecosystemManager) {
      console.error("❌ Erro: 'ecosystemManager' não encontrado.");
      process.exit(1);
  }

  try {
    // --- 1. Deploy NFTLiquidityPool ---
    // Este construtor LÊ do Hub, que agora está configurado (Passo 2).
    console.log("1. Implantando NFTLiquidityPool...");
    const nftLiquidityPool = await ethers.deployContract("NFTLiquidityPool", [
      addresses.ecosystemManager,
      deployer.address,
    ]);
    await nftLiquidityPool.waitForDeployment();
    addresses.nftLiquidityPool = nftLiquidityPool.target as string;
    console.log(
      `✅ NFTLiquidityPool implantado em: ${addresses.nftLiquidityPool}`
    );
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 2. Deploy FortuneTiger ---
    // Este construtor LÊ do Hub, que agora está configurado (Passo 2).
    console.log("2. Implantando FortuneTiger...");
    const fortuneTiger = await ethers.deployContract("FortuneTiger", [
      addresses.ecosystemManager,
      deployer.address,
    ]);
    await fortuneTiger.waitForDeployment();
    addresses.fortuneTiger = fortuneTiger.target as string;
    console.log(`✅ FortuneTiger implantado em: ${addresses.fortuneTiger}`);
    console.log("----------------------------------------------------");

  } catch (error) {
    console.error("❌ Falha na implantação dos Spokes (Passo 3):", error);
    process.exit(1);
  }

  // --- Salva TODOS os 10 endereços de volta no arquivo ---
  fs.writeFileSync(
    addressesFilePath,
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n🎉🎉🎉 CONTRATOS SPOKE IMPLANTADOS COM SUCESSO! 🎉🎉🎉");
  console.log(
    `✅ Todos os 10 endereços estão agora em: ${addressesFilePath}`
  );
  console.log("\nPróximo passo: Execute '4_configure_system.ts'");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});