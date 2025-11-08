// scripts/1_deploy_core.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

// --- REMOVIDA A CORREÇÃO ESM (fileURLToPath) ---

// Helper function for delays between deployments
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEPLOY_DELAY_MS = 2000; // 2-second delay

// A FUNÇÃO PRINCIPAL É AGORA EXPORTADA
export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Passo 1/8) Implantando Contratos Principais na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  const addresses: { [key: string]: string } = {};

  // Garante que o arquivo de endereços esteja limpo ou exista
  // __dirname agora funciona nativamente (CommonJS)
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  fs.writeFileSync(addressesFilePath, JSON.stringify({}, null, 2));


  try {
    // --- 1. Deploy EcosystemManager (The Hub) ---
    console.log("1. Implantando EcosystemManager (Hub)...");
    const ecosystemManager = await ethers.deployContract("EcosystemManager", [
      deployer.address,
    ]);
    await ecosystemManager.waitForDeployment();
    addresses.ecosystemManager = ecosystemManager.target as string;
    console.log(`✅ EcosystemManager implantado em: ${addresses.ecosystemManager}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 2. Deploy BKCToken ---
    console.log("2. Implantando BKCToken...");
    const bkcToken = await ethers.deployContract("BKCToken", [
      deployer.address,
    ]);
    await bkcToken.waitForDeployment();
    addresses.bkcToken = bkcToken.target as string;
    console.log(`✅ BKCToken implantado em: ${addresses.bkcToken}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 3. Deploy RewardBoosterNFT ---
    console.log("3. Implantando RewardBoosterNFT...");
    const rewardBoosterNFT = await ethers.deployContract("RewardBoosterNFT", [
      deployer.address,
    ]);
    await rewardBoosterNFT.waitForDeployment();
    addresses.rewardBoosterNFT = rewardBoosterNFT.target as string;
    console.log(`✅ RewardBoosterNFT implantado em: ${addresses.rewardBoosterNFT}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 4. Deploy DelegationManager ---
    console.log("4. Implantando DelegationManager...");
    const delegationManager = await ethers.deployContract("DelegationManager", [
      addresses.bkcToken,
      addresses.ecosystemManager,
      deployer.address,
    ]);
    await delegationManager.waitForDeployment();
    addresses.delegationManager = delegationManager.target as string;
    console.log(
      `✅ DelegationManager implantado em: ${addresses.delegationManager}`
    );
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 5. Deploy RewardManager ---
    console.log("5. Implantando RewardManager...");
    const rewardManager = await ethers.deployContract("RewardManager", [
      addresses.bkcToken,
      deployer.address, // _treasuryWallet
      addresses.ecosystemManager,
      deployer.address, // _initialOwner
    ]);
    await rewardManager.waitForDeployment();
    addresses.rewardManager = rewardManager.target as string;
    console.log(`✅ RewardManager implantado em: ${addresses.rewardManager}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 6. Deploy DecentralizedNotary ---
    console.log("6. Implantando DecentralizedNotary...");
    const decentralizedNotary = await ethers.deployContract(
      "DecentralizedNotary",
      [addresses.bkcToken, addresses.ecosystemManager, deployer.address]
    );
    await decentralizedNotary.waitForDeployment();
    addresses.decentralizedNotary = decentralizedNotary.target as string;
    console.log(
      `✅ DecentralizedNotary implantado em: ${addresses.decentralizedNotary}`
    );
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 7. Deploy PublicSale ---
    console.log("7. Implantando PublicSale...");
    const publicSale = await ethers.deployContract("PublicSale", [
      addresses.rewardBoosterNFT,
      addresses.ecosystemManager,
      deployer.address,
    ]);
    await publicSale.waitForDeployment();
    addresses.publicSale = publicSale.target as string;
    console.log(`✅ PublicSale implantado em: ${addresses.publicSale}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);
    
    // --- 8. Deploy SimpleBKCFaucet (Sempre reimplantado) ---
    console.log("8. Implantando SimpleBKCFaucet...");
    const simpleBKCFaucet = await ethers.deployContract("SimpleBKCFaucet", [
        addresses.bkcToken, // <-- Passa o NOVO bkcToken (do Passo 2)
    ]);
    await simpleBKCFaucet.waitForDeployment();
    addresses.faucet = simpleBKCFaucet.target as string;
    console.log(`✅ SimpleBKCFaucet implantado em: ${addresses.faucet}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);


  } catch (error: any) {
    console.error("❌ Falha na implantação (Passo 1):", error.message);
    throw error;
  }

  // --- Salva os endereços no arquivo ---
  fs.writeFileSync(
    addressesFilePath,
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n🎉🎉🎉 CONTRATOS PRINCIPAIS IMPLANTADOS COM SUCESSO! 🎉🎉🎉");
  console.log("\nPróximo passo: Execute '0_faucet_test_supply.ts'");
}