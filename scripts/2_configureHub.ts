// scripts/2_configureHub.ts
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const CONFIG_DELAY_MS = 1500; // 1.5-second delay

// --- ⚙️ SERVICE CONFIGURATION ---
// Define all your ecosystem fees and pStake requirements here.
// These are just examples; adjust them to your tokenomics.

const SERVICE_SETTINGS = {
  // --- DecentralizedNotary ---
  NOTARY_FEE: ethers.parseUnits("100", 18), // 100 BKC
  NOTARY_SERVICE_PSTAKE: 1000, // Requires 1000 pStake

  // --- FortuneTiger (Actions) ---
  ACTION_CREATE_FEE: ethers.parseUnits("50", 18), // 50 BKC to create an action
  ACTION_CREATE_PSTAKE: 500, // Requires 500 pStake
  ACTION_PARTICIPATE_FEE: ethers.parseUnits("5", 18), // 5 BKC to participate
  ACTION_PARTICIPATE_PSTAKE: 0, // 0 pStake to participate

  // Pot distribution BIPS (Base 10000)
  ACTION_SPORT_WINNER_BIPS: 7000, // 70% to winner
  ACTION_SPORT_CREATOR_BIPS: 1000, // 10% to creator
  ACTION_SPORT_DELEGATOR_BIPS: 1500, // 15% to delegators
  ACTION_SPORT_TREASURY_BIPS: 500, // 5% to treasury

  ACTION_CAUSE_BIPS: 8000, // 80% to the cause (beneficiary)
  ACTION_CAUSE_CREATOR_BIPS: 500, // 5% to creator
  ACTION_CAUSE_DELEGATOR_BIPS: 1000, // 10% to delegators
  ACTION_CAUSE_TREASURY_BIPS: 500, // 5% to treasury

  // --- DelegationManager Fees ---
  UNSTAKE_FEE_BIPS: 100, // 1% fee
  FORCE_UNSTAKE_PENALTY_BIPS: 2500, // 25% penalty (will be discounted by NFT)
  CLAIM_REWARD_FEE_BIPS: 50, // 0.5% fee

  // --- NFTLiquidityPool ---
  NFT_POOL_ACCESS_PSTAKE: 100, // Requires 100 pStake to trade
  NFT_POOL_TAX_BIPS: 1000, // 10% base tax on sale
  NFT_POOL_TAX_TREASURY_SHARE_BIPS: 4000, // 40% of tax to Treasury
  NFT_POOL_TAX_DELEGATOR_SHARE_BIPS: 4000, // 40% of tax to Delegators
  NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS: 2000, // 20% of tax stays in Pool
};
// --- End of Configuration ---

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 Configuring EcosystemManager on network: ${networkName}`);
  console.log(`Using account: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Load Addresses ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    console.error("❌ Error: 'deployment-addresses.json' not found.");
    console.error("Please run '1_deploy.ts' first.");
    process.exit(1);
  }
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  // Validate required addresses
  const required = [
    "ecosystemManager",
    "bkcToken",
    "delegationManager",
    "rewardBoosterNFT",
  ];
  for (const addr of required) {
    if (!addresses[addr]) {
      console.error(`❌ Error: Address '${addr}' not found in deployment-addresses.json.`);
      process.exit(1);
    }
  }

  // --- 2. Get Contract Instance ---
  const ecosystemManager = await ethers.getContractAt(
    "EcosystemManager",
    addresses.ecosystemManager,
    deployer
  );

  try {
    // --- 3. Set Core Addresses ---
    console.log("1. Setting core addresses in EcosystemManager...");
    const tx = await ecosystemManager.setAddresses(
      addresses.bkcToken,
      deployer.address, // Using deployer as the initial Treasury
      addresses.delegationManager,
      addresses.rewardBoosterNFT
    );
    await tx.wait();
    console.log("✅ Core addresses set successfully.");
    console.log(`   -> Treasury set to: ${deployer.address}`);
    console.log("----------------------------------------------------");
    await sleep(CONFIG_DELAY_MS);

    // --- 4. Set All Fees and pStake Requirements ---
    console.log("2. Configuring all system fees and pStake minimums...");

    // Notary
    await setService(
      ecosystemManager,
      "NOTARY_FEE",
      SERVICE_SETTINGS.NOTARY_FEE,
      "NOTARY_SERVICE",
      SERVICE_SETTINGS.NOTARY_SERVICE_PSTAKE
    );

    // FortuneTiger Create
    await setService(
      ecosystemManager,
      "ACTION_CREATE_FEE",
      SERVICE_SETTINGS.ACTION_CREATE_FEE,
      "ACTION_CREATE_SERVICE",
      SERVICE_SETTINGS.ACTION_CREATE_PSTAKE
    );

    // FortuneTiger Participate
    await setService(
      ecosystemManager,
      "ACTION_PARTICIPATE_FEE",
      SERVICE_SETTINGS.ACTION_PARTICIPATE_FEE,
      "ACTION_PARTICIPATE_SERVICE",
      SERVICE_SETTINGS.ACTION_PARTICIPATE_PSTAKE
    );
    
    // FortuneTiger Pot Distribution
    await setFee(ecosystemManager, "ACTION_SPORT_WINNER_BIPS", SERVICE_SETTINGS.ACTION_SPORT_WINNER_BIPS);
    await setFee(ecosystemManager, "ACTION_SPORT_CREATOR_BIPS", SERVICE_SETTINGS.ACTION_SPORT_CREATOR_BIPS);
    await setFee(ecosystemManager, "ACTION_SPORT_DELEGATOR_BIPS", SERVICE_SETTINGS.ACTION_SPORT_DELEGATOR_BIPS);
    await setFee(ecosystemManager, "ACTION_SPORT_TREASURY_BIPS", SERVICE_SETTINGS.ACTION_SPORT_TREASURY_BIPS);
    await setFee(ecosystemManager, "ACTION_CAUSE_BIPS", SERVICE_SETTINGS.ACTION_CAUSE_BIPS);
    await setFee(ecosystemManager, "ACTION_CAUSE_CREATOR_BIPS", SERVICE_SETTINGS.ACTION_CAUSE_CREATOR_BIPS);
    await setFee(ecosystemManager, "ACTION_CAUSE_DELEGATOR_BIPS", SERVICE_SETTINGS.ACTION_CAUSE_DELEGATOR_BIPS);
    await setFee(ecosystemManager, "ACTION_CAUSE_TREASURY_BIPS", SERVICE_SETTINGS.ACTION_CAUSE_TREASURY_BIPS);
    
    // DelegationManager Fees
    await setFee(ecosystemManager, "UNSTAKE_FEE_BIPS", SERVICE_SETTINGS.UNSTAKE_FEE_BIPS);
    await setFee(ecosystemManager, "FORCE_UNSTAKE_PENALTY_BIPS", SERVICE_SETTINGS.FORCE_UNSTAKE_PENALTY_BIPS);
    await setFee(ecosystemManager, "CLAIM_REWARD_FEE_BIPS", SERVICE_SETTINGS.CLAIM_REWARD_FEE_BIPS);
    
    // NFTLiquidityPool
    await setService(
      ecosystemManager,
      "NFT_POOL_ACCESS_FEE", // Fee is 0, just checking pStake
      0,
      "NFT_POOL_ACCESS",
      SERVICE_SETTINGS.NFT_POOL_ACCESS_PSTAKE
    );
    await setFee(ecosystemManager, "NFT_POOL_TAX_BIPS", SERVICE_SETTINGS.NFT_POOL_TAX_BIPS);
    await setFee(ecosystemManager, "NFT_POOL_TAX_TREASURY_SHARE_BIPS", SERVICE_SETTINGS.NFT_POOL_TAX_TREASURY_SHARE_BIPS);
    await setFee(ecosystemManager, "NFT_POOL_TAX_DELEGATOR_SHARE_BIPS", SERVICE_SETTINGS.NFT_POOL_TAX_DELEGATOR_SHARE_BIPS);
    await setFee(ecosystemManager, "NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS", SERVICE_SETTINGS.NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS);

    console.log("\n✅ All system rules configured in the Hub.");
    console.log("----------------------------------------------------");
    
  } catch (error) {
    console.error("❌ Configuration failed:", error);
    process.exit(1);
  }

  console.log("\n🎉🎉🎉 ECOSYSTEM HUB CONFIGURED SUCCESSFULLY! 🎉🎉🎉");
  console.log("\nNext step: Run '3_configureSystem.ts'");
}

// --- Helper Functions ---

async function setFee(manager: any, key: string, value: number | bigint) {
  try {
    const tx = await manager.setFee(key, value);
    await tx.wait();
    console.log(`   -> Fee set: ${key} = ${value.toString()}`);
    await sleep(CONFIG_DELAY_MS / 2); // Shorter delay for simple setters
  } catch (e: any) {
    console.error(`   ❌ FAILED to set fee: ${key}. Reason: ${e.message}`);
    throw e; // Re-throw to stop the script
  }
}

async function setPStake(manager: any, key: string, value: number) {
  try {
    const tx = await manager.setPStakeMinimum(key, value);
    await tx.wait();
    console.log(`   -> pStake set: ${key} = ${value}`);
    await sleep(CONFIG_DELAY_MS / 2);
  } catch (e: any) {
    console.error(`   ❌ FAILED to set pStake: ${key}. Reason: ${e.message}`);
    throw e;
  }
}

async function setService(manager: any, feeKey: string, feeValue: number | bigint, pStakeKey: string, pStakeValue: number) {
    console.log(`\nConfiguring Service: ${pStakeKey}...`);
    await setFee(manager, feeKey, feeValue);
    await setPStake(manager, pStakeKey, pStakeValue);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});