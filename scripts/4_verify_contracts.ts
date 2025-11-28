// scripts/4_verify_contracts.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tenta verificar um contrato no Etherscan (ou similar).
 */
async function attemptVerification(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  contractAddress: string,
  constructorArguments: any[],
  contractPath?: string
) {
  try {
    if (!contractAddress) {
      console.log(`⚠️  Pulando ${contractName}: Endereço não encontrado.`);
      return;
    }

    console.log(`   -> Verificando ${contractName} em ${contractAddress}...`);
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
      ...(contractPath && { contract: contractPath }), // Caminho opcional
    });
    console.log("   ✅ Verificado com sucesso!");
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("   ✅ Contrato já estava verificado.");
    } else {
      console.error(`   ❌ FALHA na verificação (${contractName}): ${error.message}`);
    }
  }
  await sleep(5000); // Pausa de 5 segundos para não sobrecarregar a API
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (FASE 3) Iniciando verificação de contratos na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("⚠️  Verificação pulada. Só é possível verificar em redes públicas.");
    return;
  }

  // --- 1. Carregar Endereços ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    throw new Error("Missing deployment-addresses.json");
  }
  const addresses: { [key: string]: string } = JSON.parse(
    fs.readFileSync(addressesFilePath, "utf8")
  );
  
  // Como todos são Proxies UUPS, o construtor é vazio (initializer é usado depois).
  const constructorArgs: any[] = []; 

  console.log("=== Verificando Contratos UUPS (Proxies) ===");

  await attemptVerification(
    hre, "EcosystemManager", addresses.ecosystemManager, 
    constructorArgs,
    "contracts/EcosystemManager.sol:EcosystemManager"
  );
  
  await attemptVerification(
    hre, "MiningManager", addresses.miningManager, 
    constructorArgs,
    "contracts/MiningManager.sol:MiningManager"
  );
  
  await attemptVerification(
    hre, "DelegationManager", addresses.delegationManager, 
    constructorArgs,
    "contracts/DelegationManager.sol:DelegationManager"
  );
  
  await attemptVerification(
    hre, "DecentralizedNotary", addresses.decentralizedNotary, 
    constructorArgs,
    "contracts/DecentralizedNotary.sol:DecentralizedNotary"
  );

  // ✅ ADICIONADO: Rental Manager (AirBNFT)
  await attemptVerification(
    hre, "RentalManager", addresses.rentalManager, 
    constructorArgs,
    "contracts/RentalManager.sol:RentalManager"
  );
  
  // ✅ Fortune Pool
  await attemptVerification(
    hre, "FortunePool", addresses.fortunePool, 
    constructorArgs,
    "contracts/FortunePool.sol:FortunePool"
  );
  
  // Verifica a Implementação do Pool (Molde da Fábrica)
  // Nota: Implementações lógicas geralmente não têm construtor com args se usarem initialize,
  // mas não são proxies em si mesmas quando deployadas como molde.
  if (addresses.nftLiquidityPool_Implementation) {
    await attemptVerification(
      hre, "NFTLiquidityPool_Implementation", addresses.nftLiquidityPool_Implementation, 
      [], 
      "contracts/NFTLiquidityPool.sol:NFTLiquidityPool"
    );
  }

  // Verifica a Fábrica do Pool
  await attemptVerification(
    hre, "NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, 
    constructorArgs,
    "contracts/NFTLiquidityPoolFactory.sol:NFTLiquidityPoolFactory"
  );


  // --- 3. Verificar Contratos Normais (Standard) ---
  
  console.log("\n=== Verificando Contratos Normais / Tokens ===");

  await attemptVerification(
    hre, "BKCToken", addresses.bkcToken,
    constructorArgs, // BKCToken também é UUPS
    "contracts/BKCToken.sol:BKCToken"
  );

  await attemptVerification(
    hre, "RewardBoosterNFT", addresses.rewardBoosterNFT,
    constructorArgs, // RewardBoosterNFT também é UUPS
    "contracts/RewardBoosterNFT.sol:RewardBoosterNFT"
  );

  await attemptVerification(
    hre, "PublicSale", addresses.publicSale,
    constructorArgs,
    "contracts/PublicSale.sol:PublicSale"
  );

  await attemptVerification(
    hre, "SimpleBKCFaucet", addresses.faucet,
    constructorArgs,
    "contracts/SimpleBKCFaucet.sol:SimpleBKCFaucet"
  );

  console.log("\n🎉🎉🎉 VERIFICAÇÃO DE CONTRATOS CONCLUÍDA! 🎉🎉🎉");
}

// Bloco de entrada para execução standalone
if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}