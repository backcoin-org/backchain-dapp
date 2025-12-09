// scripts/4_verify_contracts_v2.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tenta verificar um contrato no Etherscan (ou similar) - Versão V2 API
 */
async function attemptVerification(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  contractAddress: string,
  constructorArguments: any[],
  contractPath?: string
) {
  try {
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`⚠️  Pulando ${contractName}: Endereço não encontrado ou inválido.`);
      return;
    }

    console.log(`\n📝 Verificando ${contractName}...`);
    console.log(`   Endereço: ${contractAddress}`);
    
    const verifyParams: any = {
      address: contractAddress,
      constructorArguments: constructorArguments,
    };
    
    // Adiciona o caminho do contrato se fornecido
    if (contractPath) {
      verifyParams.contract = contractPath;
      console.log(`   Contrato: ${contractPath}`);
    }

    await hre.run("verify:verify", verifyParams);
    
    console.log(`   ✅ ${contractName} verificado com sucesso!`);
  } catch (error: any) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes("already verified")) {
      console.log(`   ✅ ${contractName} já estava verificado.`);
    } else if (errorMessage.includes("does not have bytecode")) {
      console.log(`   ⚠️  ${contractName}: Contrato não encontrado no endereço (pode não ter sido deployed).`);
    } else if (errorMessage.includes("etherscan") && errorMessage.includes("rate limit")) {
      console.log(`   ⏳ Rate limit atingido. Aguardando 10 segundos...`);
      await sleep(10000);
      // Tenta novamente
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: constructorArguments,
          ...(contractPath && { contract: contractPath }),
        });
        console.log(`   ✅ ${contractName} verificado com sucesso (após retry)!`);
      } catch (retryError: any) {
        console.error(`   ❌ FALHA na verificação após retry (${contractName}): ${retryError.message}`);
      }
    } else {
      console.error(`   ❌ FALHA na verificação (${contractName}):`);
      console.error(`      ${error.message}`);
    }
  }
  
  // Pausa entre verificações para evitar rate limiting
  await sleep(3000);
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 VERIFICAÇÃO DE CONTRATOS - REDE: ${networkName.toUpperCase()}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`👤 Conta: ${deployer.address}`);
  console.log(`${"=".repeat(60)}\n`);

  // Verifica se é uma rede local
  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("⚠️  AVISO: Verificação só é possível em redes públicas (testnet/mainnet).");
    console.log("   Redes locais não possuem exploradores de blocos.");
    return;
  }

  // --- 1. Carregar Endereços ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  
  if (!fs.existsSync(addressesFilePath)) {
    throw new Error(`❌ Arquivo não encontrado: ${addressesFilePath}\n   Execute o script de deployment primeiro!`);
  }
  
  const addresses: { [key: string]: string } = JSON.parse(
    fs.readFileSync(addressesFilePath, "utf8")
  );
  
  console.log("📂 Endereços carregados de: deployment-addresses.json\n");

  // Como todos são Proxies UUPS, o construtor é vazio (initializer é usado depois).
  const constructorArgs: any[] = [];

  // ========================================
  // CONTRATOS UUPS (PROXIES)
  // ========================================
  console.log("\n" + "=".repeat(60));
  console.log("🔷 VERIFICANDO CONTRATOS UUPS (PROXIES)");
  console.log("=".repeat(60));

  await attemptVerification(
    hre,
    "EcosystemManager",
    addresses.ecosystemManager,
    constructorArgs,
    "contracts/EcosystemManager.sol:EcosystemManager"
  );

  await attemptVerification(
    hre,
    "MiningManager",
    addresses.miningManager,
    constructorArgs,
    "contracts/MiningManager.sol:MiningManager"
  );

  await attemptVerification(
    hre,
    "DelegationManager",
    addresses.delegationManager,
    constructorArgs,
    "contracts/DelegationManager.sol:DelegationManager"
  );

  await attemptVerification(
    hre,
    "DecentralizedNotary",
    addresses.decentralizedNotary,
    constructorArgs,
    "contracts/DecentralizedNotary.sol:DecentralizedNotary"
  );

  await attemptVerification(
    hre,
    "RentalManager",
    addresses.rentalManager,
    constructorArgs,
    "contracts/RentalManager.sol:RentalManager"
  );

  await attemptVerification(
    hre,
    "FortunePool",
    addresses.fortunePool,
    constructorArgs,
    "contracts/FortunePool.sol:FortunePool"
  );

  // ========================================
  // POOL FACTORY E IMPLEMENTATION
  // ========================================
  console.log("\n" + "=".repeat(60));
  console.log("🏭 VERIFICANDO FACTORY E IMPLEMENTATION");
  console.log("=".repeat(60));

  if (addresses.nftLiquidityPool_Implementation) {
    await attemptVerification(
      hre,
      "NFTLiquidityPool Implementation",
      addresses.nftLiquidityPool_Implementation,
      [],
      "contracts/NFTLiquidityPool.sol:NFTLiquidityPool"
    );
  }

  await attemptVerification(
    hre,
    "NFTLiquidityPoolFactory",
    addresses.nftLiquidityPoolFactory,
    constructorArgs,
    "contracts/NFTLiquidityPoolFactory.sol:NFTLiquidityPoolFactory"
  );

  // ========================================
  // TOKENS E CONTRATOS AUXILIARES
  // ========================================
  console.log("\n" + "=".repeat(60));
  console.log("🪙 VERIFICANDO TOKENS E CONTRATOS AUXILIARES");
  console.log("=".repeat(60));

  await attemptVerification(
    hre,
    "BKCToken",
    addresses.bkcToken,
    constructorArgs,
    "contracts/BKCToken.sol:BKCToken"
  );

  await attemptVerification(
    hre,
    "RewardBoosterNFT",
    addresses.rewardBoosterNFT,
    constructorArgs,
    "contracts/RewardBoosterNFT.sol:RewardBoosterNFT"
  );

  await attemptVerification(
    hre,
    "PublicSale",
    addresses.publicSale,
    constructorArgs,
    "contracts/PublicSale.sol:PublicSale"
  );

  await attemptVerification(
    hre,
    "SimpleBKCFaucet",
    addresses.faucet,
    constructorArgs,
    "contracts/SimpleBKCFaucet.sol:SimpleBKCFaucet"
  );

  // ========================================
  // FINALIZAÇÃO
  // ========================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉🎉🎉 VERIFICAÇÃO CONCLUÍDA! 🎉🎉🎉");
  console.log("=".repeat(60));
  console.log("\n💡 Dica: Verifique os contratos no explorer:");
  
  const explorerUrls: { [key: string]: string } = {
    arbitrumSepolia: "https://sepolia.arbiscan.io",
    arbitrum: "https://arbiscan.io",
    mainnet: "https://etherscan.io",
    sepolia: "https://sepolia.etherscan.io",
    goerli: "https://goerli.etherscan.io",
  };
  
  const explorerUrl = explorerUrls[networkName] || "https://etherscan.io";
  console.log(`   ${explorerUrl}/address/${addresses.ecosystemManager}\n`);
}

// Bloco de entrada para execução standalone
if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error("\n❌ ERRO FATAL:", error);
    process.exit(1);
  });
}