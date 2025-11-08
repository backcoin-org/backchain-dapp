// scripts/9_verify_contracts.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { ethers } from "ethers"; // Apenas para tipagem, se necessário

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tenta verificar um contrato no Etherscan (ou similar).
 * @param hre O Hardhat Runtime Environment
 * @param contractAddress O endereço do contrato implantado
 * @param constructorArguments Os argumentos exatos passados para o construtor
 * @param contractPath (Opcional) O caminho completo para o contrato (ex: "contracts/Token.sol:Token")
 */
async function attemptVerification(
  hre: HardhatRuntimeEnvironment,
  contractAddress: string,
  constructorArguments: any[],
  contractPath?: string
) {
  try {
    console.log(`   -> Verificando ${contractPath || contractAddress}...`);
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
      ...(contractPath && { contract: contractPath }), // Adiciona o caminho do contrato se fornecido
    });
    console.log("   ✅ Verificado com sucesso!");
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("   ⚠️  Contrato já verificado.");
    } else {
      console.error(`   ❌ FALHA na verificação: ${error.message}`);
    }
  }
  await sleep(5000); // Pausa de 5 segundos para não sobrecarregar a API do Etherscan
}

// A FUNÇÃO PRINCIPAL É AGORA EXPORTADA
export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Passo 9/9) Iniciando verificação de contratos na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // A verificação só funciona em redes públicas, não em 'localhost' ou 'hardhat'
  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("⚠️  Verificação pulada. Só é possível verificar contratos em redes públicas (ex: sepolia, mainnet).");
    return;
  }

  // --- 1. Carregar Endereços ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    console.error("❌ Erro: 'deployment-addresses.json' não encontrado.");
    throw new Error("Missing deployment-addresses.json");
  }
  const addresses: { [key: string]: string } = JSON.parse(
    fs.readFileSync(addressesFilePath, "utf8")
  );

  // --- 2. Definir Contratos e seus Argumentos de Construtor ---
  // Estes argumentos devem corresponder EXATAMENTE ao que foi usado nos scripts 1_ e 3_
  
  // Verifique os caminhos (ex: "contracts/Core/EcosystemManager.sol:EcosystemManager")
  // Estou usando um palpite comum. Ajuste se seus arquivos estiverem em subpastas.
  
  const contractsToVerify = [
    // --- Do script 1_deploy_core.ts ---
    {
      key: "ecosystemManager",
      path: "contracts/EcosystemManager.sol:EcosystemManager",
      args: () => [deployer.address],
    },
    {
      key: "bkcToken",
      path: "contracts/BKCToken.sol:BKCToken",
      args: () => [deployer.address],
    },
    {
      key: "rewardBoosterNFT",
      path: "contracts/RewardBoosterNFT.sol:RewardBoosterNFT",
      args: () => [deployer.address],
    },
    {
      key: "delegationManager",
      path: "contracts/DelegationManager.sol:DelegationManager",
      args: () => [
        addresses.bkcToken,
        addresses.ecosystemManager,
        deployer.address,
      ],
    },
    {
      key: "rewardManager",
      path: "contracts/RewardManager.sol:RewardManager",
      args: () => [
        addresses.bkcToken,
        deployer.address,
        addresses.ecosystemManager,
        deployer.address,
      ],
    },
    {
      key: "decentralizedNotary",
      path: "contracts/DecentralizedNotary.sol:DecentralizedNotary",
      args: () => [
        addresses.bkcToken,
        addresses.ecosystemManager,
        deployer.address,
      ],
    },
    {
      key: "publicSale",
      path: "contracts/PublicSale.sol:PublicSale",
      args: () => [
        addresses.rewardBoosterNFT,
        addresses.ecosystemManager,
        deployer.address,
      ],
    },
    {
      key: "faucet", // SimpleBKCFaucet
      path: "contracts/SimpleBKCFaucet.sol:SimpleBKCFaucet",
      args: () => [addresses.bkcToken],
    },
    
    // --- Do script 3_deploy_spokes.ts ---
    {
      key: "nftLiquidityPool",
      path: "contracts/NFTLiquidityPool.sol:NFTLiquidityPool",
      args: () => [addresses.ecosystemManager, deployer.address],
    },
    {
      key: "fortuneTiger",
      path: "contracts/TigerGame.sol:FortuneTiger",
      args: () => [
        addresses.ecosystemManager,
        addresses.bkcToken,
        addresses.rewardManager,
        deployer.address,
      ],
    },
  ];

  // --- 3. Executar Verificação ---
  console.log("Iniciando tentativas de verificação...");

  for (const contract of contractsToVerify) {
    const address = addresses[contract.key];
    if (!address) {
      console.log(`\n⚠️  Endereço para '${contract.key}' não encontrado no JSON. Pulando.`);
      continue;
    }

    console.log(`\nProcessando ${contract.key} em ${address}`);
    
    // Validar se todos os endereços necessários para os args existem
    const constructorArgs = contract.args();
    const argsValid = constructorArgs.every((arg) => arg !== undefined && arg !== null);

    if (!argsValid) {
        console.error(`   ❌ ERRO: Argumentos do construtor inválidos para ${contract.key}. Pode ser que um endereço dependente esteja faltando no JSON.`);
        console.error(`   Argumentos recebidos: ${JSON.stringify(constructorArgs)}`);
        continue;
    }

    await attemptVerification(
      hre,
      address,
      constructorArgs,
      contract.path
    );
  }

  console.log("\n🎉🎉🎉 VERIFICAÇÃO DE CONTRATOS CONCLUÍDA! 🎉🎉🎉");
}

// ====================================================================
// Ponto de entrada para execução standalone
// ====================================================================
if (require.main === module) {
  console.log("Executando 9_verify_contracts.ts como script standalone...");
  // Precisamos importar o 'hre' manualmente se executado diretamente
  import("hardhat").then(hre => {
    runScript(hre)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  });
}