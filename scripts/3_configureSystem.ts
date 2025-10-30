// scripts/3_configureSystem.ts
import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import addressesJson from "../deployment-addresses.json";

// Type assertion for the addresses object
const addresses: { [key: string]: string } = addressesJson;

// --- ⚙️ CONFIGURATION ---
// Paste the IPFS CIDs for your metadata folders here.
const IPFS_BASE_URI_VESTING =
  "ipfs://YOUR_CID_FOR_VESTING_METADATA/";
const IPFS_BASE_URI_BOOSTERS =
  "ipfs://YOUR_CID_FOR_BOOSTER_METADATA_FOLDER/";
// ------------------------

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Initializing system configuration with account:", deployer.address);
  console.log("----------------------------------------------------");

  // --- Validate CIDs ---
  if (
    IPFS_BASE_URI_VESTING.includes("YOUR_CID") ||
    IPFS_BASE_URI_BOOSTERS.includes("YOUR_CID")
  ) {
    console.error("❌ Error: Please update the IPFS_BASE_URI variables in '3_configureSystem.ts' with your actual IPFS CIDs.");
    process.exit(1);
  }

  // --- Load Contracts ---
  console.log("Loading deployed contract instances...");
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
    // --- Step 1: Set Reference Addresses in BKCToken ---
    console.log("\n1. Setting reference addresses in BKCToken...");
    let tx = await bkcToken.setTreasuryWallet(deployer.address);
    await tx.wait();
    console.log(` -> Treasury set to: ${deployer.address}`);

    tx = await bkcToken.setDelegationManager(addresses.delegationManager);
    await tx.wait();
    console.log(` -> DelegationManager address registered in Token.`);

    tx = await bkcToken.setRewardManager(addresses.rewardManager);
    await tx.wait();
    console.log(` -> RewardManager address registered in Token.`);
    console.log("✅ BKCToken reference addresses configured.");

    // --- Step 2: Configure Manager Inter-dependencies ---
    console.log("\n2. Configuring manager inter-dependencies...");
    tx = await delegationManager.setRewardManager(addresses.rewardManager);
    await tx.wait();
    console.log(` -> RewardManager set in DelegationManager.`);

    tx = await rewardManager.setDelegationManager(addresses.delegationManager);
    await tx.wait();
    console.log(` -> DelegationManager set in RewardManager.`);
    console.log("✅ Managers configured.");

    // --- Step 3: Authorize PublicSale contract ---
    console.log("\n3. Authorizing PublicSale to mint Booster NFTs...");
    tx = await rewardBooster.setSaleContractAddress(addresses.publicSale);
    await tx.wait();
    console.log(` -> PublicSale contract (${addresses.publicSale}) authorized.`);
    console.log("✅ PublicSale authorized.");

    // --- Step 4: Set NFT Base URIs ---
    console.log("\n4. Setting Base URIs for NFT metadata...");
    tx = await rewardManager.setBaseURI(IPFS_BASE_URI_VESTING);
    await tx.wait();
    console.log(` -> Vesting Certificate Base URI set.`);

    tx = await rewardBooster.setBaseURI(IPFS_BASE_URI_BOOSTERS);
    await tx.wait();
    console.log(` -> Reward Booster Base URI set.`);
    console.log("✅ Base URIs configured.");

    // --- Step 5: Transfer BKCToken Ownership ---
    console.log("\n5. Transferring BKCToken ownership to RewardManager...");
    const currentOwner = await bkcToken.owner();
    if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
      tx = await bkcToken.transferOwnership(addresses.rewardManager);
      await tx.wait();
      console.log(
        `✅ BKCToken ownership transferred to: ${addresses.rewardManager}`
      );
    } else {
      console.log(
        `⚠️ BKCToken ownership already belongs to ${currentOwner}. No action taken.`
      );
    }

    console.log("\n🎉🎉🎉 SYSTEM CONFIGURATION COMPLETE! 🎉🎉🎉");
    console.log("\nNext step: Run '4_createPools.ts'");
    
  } catch (error: any) {
    console.error("\n❌ CRITICAL ERROR DURING SYSTEM CONFIGURATION ❌\n");

    if (
      error.message.includes("ProviderError") ||
      error.message.includes("in-flight") ||
      error.message.includes("nonce") ||
      error.message.includes("underpriced")
    ) {
      console.error(
        "Likely Cause: Network connection issue or pending transaction."
      );
      console.log("\n--- RECOMMENDED ACTION ---");
      console.log(
        "1. In MetaMask, go to 'Settings' -> 'Advanced' and click 'Reset Activity Data'."
      );
      console.log(
        "2. Wait a minute and try running THIS SCRIPT ('3_configureSystem.ts') again."
      );
      console.log(
        "\n👉 IF THE ERROR PERSISTS, restart the process from scratch (delete 'deployment-addresses.json' and run '1_deploy.ts' again)."
      );
    } else {
      console.error("An unexpected error occurred:", error.message);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});