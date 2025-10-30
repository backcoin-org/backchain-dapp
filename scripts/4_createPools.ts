// scripts/4_createPools.ts
import hre from "hardhat";
import fs from "fs";
import path from "path";
import addressesJson from "../deployment-addresses.json";

// Type assertion for the addresses object
const addresses: { [key: string]: string } = addressesJson;

// --- ⚙️ CONFIGURATION ---
// This list MUST match the tiers defined in PresalePage.js
// and the immutable discounts set in EcosystemManager.
const TIERS_TO_CREATE = [
  { name: "Diamond", boostBips: 5000 },
  { name: "Platinum", boostBips: 4000 },
  { name: "Gold", boostBips: 3000 },
  { name: "Silver", boostBips: 2000 },
  { name: "Bronze", boostBips: 1000 },
  { name: "Iron", boostBips: 500 },
  { name: "Crystal", boostBips: 100 },
];
// ------------------------

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 Creating AMM liquidity pool structures on network: ${networkName}`);
  console.log(`Using account: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Load Address ---
  const poolAddress = addresses.nftLiquidityPool;
  if (!poolAddress) {
    console.error("❌ Error: 'nftLiquidityPool' address not found in deployment-addresses.json.");
    console.error("Please run '1_deploy.ts' first.");
    process.exit(1);
  }

  // --- 2. Get Contract Instance ---
  const nftLiquidityPool = await ethers.getContractAt(
    "NFTLiquidityPool",
    poolAddress,
    deployer
  );

  // --- 3. Create Pools ---
  console.log("Creating 7 empty pool structures...");
  let createdCount = 0;
  let skippedCount = 0;

  for (const tier of TIERS_TO_CREATE) {
    console.log(`\n -> Processing pool: ${tier.name} (BoostBips: ${tier.boostBips})`);
    
    try {
      // Check if pool is already initialized
      const poolInfo = await nftLiquidityPool.pools(tier.boostBips);
      
      if (poolInfo.isInitialized) {
        console.log(`   ⚠️ SKIPPED: Pool for ${tier.name} is already initialized.`);
        skippedCount++;
        continue;
      }

      // If not initialized, create it
      const tx = await nftLiquidityPool.createPool(tier.boostBips);
      await tx.wait();
      console.log(`   ✅ SUCCESS: Pool structure for ${tier.name} created.`);
      createdCount++;

    } catch (error: any) {
      console.error(`   ❌ FAILED to create pool for ${tier.name}. Reason: ${error.reason || error.message}`);
      throw error; // Stop the script if one fails
    }
  }

  console.log("----------------------------------------------------");
  console.log("\n🎉 Pool creation process complete!");
  console.log(`   Total pools created: ${createdCount}`);
  console.log(`   Total pools skipped (already exist): ${skippedCount}`);
  console.log("\nNext step: Run '5_setupSale.ts'");
}

main().catch((error: any) => {
  console.error("\n❌ CRITICAL ERROR DURING POOL CREATION ❌\n");

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
      "2. Wait a minute and try running THIS SCRIPT ('4_createPools.ts') again."
    );
  } else {
    console.error("An unexpected error occurred:", error.message);
  }

  process.exit(1);
});