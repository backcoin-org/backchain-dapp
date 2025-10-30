// scripts/4_configure_system.ts
import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import addressesJson from "../deployment-addresses.json";

// Type assertion for the addresses object
const addresses: { [key: string]: string } = addressesJson;

// --- ⚙️ CONFIGURATION ---
// Seus CIDs reais foram inseridos aqui.
const IPFS_BASE_URI_VESTING =
  "ipfs://bafybeiew62trbumuxfta36hh7tz7pdzhnh73oh6lnsrxx6ivq5mxpwyo24/";
const IPFS_BASE_URI_BOOSTERS =
  "ipfs://bafybeihxs7dd7x5thhpkmwxl3adnajjxlnwx5yqodr7hjrllxaif7ojad4/";
// ------------------------

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  console.log(`🚀 (Passo 4/8) Configurando dependências do sistema com a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- Validar CIDs (Verificação de segurança) ---
  if (
    IPFS_BASE_URI_VESTING.includes("YOUR_CID") ||
    IPFS_BASE_URI_BOOSTERS.includes("YOUR_CID")
  ) {
    console.error("❌ Erro: CIDs ainda estão com o valor padrão 'YOUR_CID'.");
    process.exit(1);
  } else {
    console.log("✅ CIDs do IPFS carregados com sucesso.");
  }


  // --- Carregar Contratos ---
  console.log("Carregando instâncias de contratos implantados...");
  const bkcToken = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
  const delegationManager = await ethers.getContractAt(
    "DelegationManager",
    addresses.delegationManager,
    deployer
  );
  const rewardManager = await ethers.getContractAt(
    "RewardManager",
    addresses.rewardManager,
    deployer
  );
  const rewardBooster = await ethers.getContractAt(
    "RewardBoosterNFT",
    addresses.rewardBoosterNFT,
    deployer
  );

  try {
    // --- Passo 1: Definir Endereços de Referência no BKCToken ---
    console.log("\n1. Definindo endereços de referência no BKCToken...");
    let tx = await bkcToken.setTreasuryWallet(deployer.address);
    await tx.wait();
    console.log(` -> Tesouraria definida para: ${deployer.address}`);

    tx = await bkcToken.setDelegationManager(addresses.delegationManager);
    await tx.wait();
    console.log(` -> Endereço do DelegationManager registrado no Token.`);

    tx = await bkcToken.setRewardManager(addresses.rewardManager);
    await tx.wait();
    console.log(` -> Endereço do RewardManager registrado no Token.`);
    console.log("✅ Endereços de referência do BKCToken configurados.");

    // --- Passo 2: Configurar Interdependências dos Managers ---
    console.log("\n2. Configurando interdependências dos managers...");
    tx = await delegationManager.setRewardManager(addresses.rewardManager);
    await tx.wait();
    console.log(` -> RewardManager definido no DelegationManager.`);

    tx = await rewardManager.setDelegationManager(addresses.delegationManager);
    await tx.wait();
    console.log(` -> DelegationManager definido no RewardManager.`);
    console.log("✅ Managers configurados.");

    // --- Passo 3: Autorizar Contrato PublicSale ---
    console.log("\n3. Autorizando PublicSale a cunhar Booster NFTs...");
    tx = await rewardBooster.setSaleContractAddress(addresses.publicSale);
    await tx.wait();
    console.log(` -> Contrato PublicSale (${addresses.publicSale}) autorizado.`);
    console.log("✅ PublicSale autorizado.");

    // --- Passo 4: Definir URIs Base dos NFTs ---
    console.log("\n4. Definindo URIs Base para metadados de NFT...");
    tx = await rewardManager.setBaseURI(IPFS_BASE_URI_VESTING);
    await tx.wait();
    console.log(` -> URI Base do Certificado de Vesting definida.`);

    tx = await rewardBooster.setBaseURI(IPFS_BASE_URI_BOOSTERS);
    await tx.wait();
    console.log(` -> URI Base do Reward Booster definida.`);
    console.log("✅ URIs Base configuradas.");

    // --- Passo 5: Transferir Posse do BKCToken ---
    console.log("\n5. Transferindo posse do BKCToken para o RewardManager...");
    const currentOwner = await bkcToken.owner();
    if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
      tx = await bkcToken.transferOwnership(addresses.rewardManager);
      await tx.wait();
      console.log(
        `✅ Posse do BKCToken transferida para: ${addresses.rewardManager}`
      );
    } else {
      console.log(
        `⚠️  A posse do BKCToken já pertence a ${currentOwner}. Nenhuma ação tomada.`
      );
    }

    console.log("\n🎉🎉🎉 CONFIGURAÇÃO DO SISTEMA CONCLUÍDA! 🎉🎉🎉");
    console.log("\nPróximo passo: Execute '5_create_pools.ts'");
    
  } catch (error: any) {
    console.error("\n❌ ERRO CRÍTICO DURANTE A CONFIGURAÇÃO DO SISTEMA (Passo 4) ❌\n");

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
        "2. Aguarde um minuto e tente executar ESTE SCRIPT ('4_configure_system.ts') novamente."
      );
    } else {
      console.error("Ocorreu um erro inesperado:", error.message);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});