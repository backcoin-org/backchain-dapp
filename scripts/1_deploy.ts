// scripts/1_deploy.ts
import hre from "hardhat";
import fs from "fs";
import path from "path";

// Helper function for delays between deployments
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEPLOY_DELAY_MS = 2000; // 2-second delay

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 Starting deployment on network: ${networkName}`);
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log("----------------------------------------------------");

  const addresses: { [key: string]: string } = {};

  try {
    // --- 1. Deploy EcosystemManager (The Hub) ---
    // This is the "brain" and must be deployed first.
    console.log("1. Deploying EcosystemManager (Hub)...");
    const ecosystemManager = await ethers.deployContract("EcosystemManager", [
      deployer.address,
    ]);
    await ecosystemManager.waitForDeployment();
    addresses.ecosystemManager = ecosystemManager.target as string;
    console.log(`✅ EcosystemManager deployed to: ${addresses.ecosystemManager}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 2. Deploy BKCToken ---
    console.log("2. Deploying BKCToken...");
    const bkcToken = await ethers.deployContract("BKCToken", [
      deployer.address,
    ]);
    await bkcToken.waitForDeployment();
    addresses.bkcToken = bkcToken.target as string;
    console.log(`✅ BKCToken deployed to: ${addresses.bkcToken}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 3. Deploy RewardBoosterNFT ---
    console.log("3. Deploying RewardBoosterNFT...");
    const rewardBoosterNFT = await ethers.deployContract("RewardBoosterNFT", [
      deployer.address,
    ]);
    await rewardBoosterNFT.waitForDeployment();
    addresses.rewardBoosterNFT = rewardBoosterNFT.target as string;
    console.log(`✅ RewardBoosterNFT deployed to: ${addresses.rewardBoosterNFT}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 4. Deploy DelegationManager ---
    // Depends on BKCToken and EcosystemManager
    console.log("4. Deploying DelegationManager...");
    const delegationManager = await ethers.deployContract("DelegationManager", [
      addresses.bkcToken,
      addresses.ecosystemManager,
      deployer.address,
    ]);
    await delegationManager.waitForDeployment();
    addresses.delegationManager = delegationManager.target as string;
    console.log(
      `✅ DelegationManager deployed to: ${addresses.delegationManager}`
    );
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 5. Deploy RewardManager ---
    // Depends on BKCToken, EcosystemManager, and Treasury (using deployer as initial treasury)
    console.log("5. Deploying RewardManager...");
    const rewardManager = await ethers.deployContract("RewardManager", [
      addresses.bkcToken,
      deployer.address, // _treasuryWallet
      addresses.ecosystemManager,
      deployer.address, // _initialOwner
    ]);
    await rewardManager.waitForDeployment();
    addresses.rewardManager = rewardManager.target as string;
    console.log(`✅ RewardManager deployed to: ${addresses.rewardManager}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 6. Deploy NFTLiquidityPool ---
    // Depends on EcosystemManager
    console.log("6. Deploying NFTLiquidityPool...");
    const nftLiquidityPool = await ethers.deployContract("NFTLiquidityPool", [
      addresses.ecosystemManager,
      deployer.address,
    ]);
    await nftLiquidityPool.waitForDeployment();
    addresses.nftLiquidityPool = nftLiquidityPool.target as string;
    console.log(
      `✅ NFTLiquidityPool deployed to: ${addresses.nftLiquidityPool}`
    );
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 7. Deploy FortuneTiger ---
    // Depends on EcosystemManager
    console.log("7. Deploying FortuneTiger...");
    const fortuneTiger = await ethers.deployContract("FortuneTiger", [
      addresses.ecosystemManager,
      deployer.address,
    ]);
    await fortuneTiger.waitForDeployment();
    addresses.fortuneTiger = fortuneTiger.target as string;
    console.log(`✅ FortuneTiger deployed to: ${addresses.fortuneTiger}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 8. Deploy DecentralizedNotary ---
    // Depends on BKCToken and EcosystemManager
    console.log("8. Deploying DecentralizedNotary...");
    const decentralizedNotary = await ethers.deployContract(
      "DecentralizedNotary",
      [addresses.bkcToken, addresses.ecosystemManager, deployer.address]
    );
    await decentralizedNotary.waitForDeployment();
    addresses.decentralizedNotary = decentralizedNotary.target as string;
    console.log(
      `✅ DecentralizedNotary deployed to: ${addresses.decentralizedNotary}`
    );
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 9. Deploy PublicSale ---
    // Depends on RewardBoosterNFT and EcosystemManager
    console.log("9. Deploying PublicSale...");
    const publicSale = await ethers.deployContract("PublicSale", [
      addresses.rewardBoosterNFT,
      addresses.ecosystemManager,
      deployer.address,
    ]);
    await publicSale.waitForDeployment();
    addresses.publicSale = publicSale.target as string;
    console.log(`✅ PublicSale deployed to: ${addresses.publicSale}`);
    console.log("----------------------------------------------------");
    await sleep(DEPLOY_DELAY_MS);

    // --- 10. Deploy SimpleBKCFaucet ---
    // Depends on BKCToken
    console.log("10. Deploying SimpleBKCFaucet...");
    const simpleBKCFaucet = await ethers.deployContract("SimpleBKCFaucet", [
      addresses.bkcToken,
    ]);
    await simpleBKCFaucet.waitForDeployment();
    addresses.faucet = simpleBKCFaucet.target as string;
    console.log(`✅ SimpleBKCFaucet deployed to: ${addresses.faucet}`);
    console.log("----------------------------------------------------");
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }

  // --- Save all 10 addresses to file ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  fs.writeFileSync(
    addressesFilePath,
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n🎉🎉🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY! 🎉🎉🎉");
  console.log(
    `✅ All 10 addresses saved to: ${addressesFilePath}`
  );
  console.log("\nNext step: Run '2_configureHub.ts'");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});