// scripts/5_setupSale.ts
import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import addressesJson from "../deployment-addresses.json";

// Type assertion for the addresses object
const addresses: { [key: string]: string } = addressesJson;

// --- ⚙️ PRESALE CONFIGURATION ---
// This configuration MUST match your PresalePage.js
// These are the "Batch 1" (50% OFF) prices.
// To move to "Batch 2", you will run this script again with updated prices.
// ---
const TIERS_TO_SETUP = [
  { tierId: 0, priceETH: "3.60", boostBips: 5000, metadata: "diamond_booster.json" },
  { tierId: 1, priceETH: "1.44", boostBips: 4000, metadata: "platinum_booster.json" },
  { tierId: 2, priceETH: "0.54", boostBips: 3000, metadata: "gold_booster.json" },
  { tierId: 3, priceETH: "0.27", boostBips: 2000, metadata: "silver_booster.json" },
  { tierId: 4, priceETH: "0.144", boostBips: 1000, metadata: "bronze_booster.json" },
  { tierId: 5, priceETH: "0.07", boostBips: 500, metadata: "iron_booster.json" },
  { tierId: 6, priceETH: "0.01", boostBips: 100, metadata: "crystal_booster.json" },
];

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;
  
  console.log(`🚀 Configuring PublicSale tiers on network: ${networkName}`);
  console.log(`Using account: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Load Address ---
  const saleContractAddress = addresses.publicSale;
  if (!saleContractAddress) {
    console.error("❌ Error: 'publicSale' address not found in deployment-addresses.json.");
    console.error("Please run '1_deploy.ts' first.");
    process.exit(1);
  }
  
  console.log(`Configuring PublicSale contract at: ${saleContractAddress}`);

  // --- 2. Get Contract Instance ---
  const saleContract = await ethers.getContractAt(
    "PublicSale",
    saleContractAddress,
    deployer
  );

  // --- 3. Configure Tiers ---
  // This script calls setTier() for each item in the list.
  // This function is part of the PublicSale.sol V3 and enables mint-on-demand [cite: 425-467].
  // It does NOT require pre-minting or approving NFTs.
  
  console.log("Setting up 7 sale tiers for 'Batch 1' prices...");

  for (const tier of TIERS_TO_SETUP) {
    console.log(`\n🔹 Configuring Tier ID ${tier.tierId} (${tier.metadata})...`);

    const priceInWei = ethers.parseEther(tier.priceETH);

    try {
      console.log(`   Price: ${tier.priceETH} BNB (${priceInWei} Wei)`);
      console.log(`   Boost: ${tier.boostBips} BIPS`);

      // Calls the setTier function on the PublicSale contract [cite: 449-452]
      const tx = await saleContract.setTier(
        tier.tierId,
        priceInWei,
        tier.boostBips,
        tier.metadata
      );
      await tx.wait();
      console.log(`   ✅ Tier ${tier.metadata} configured successfully!`);
    } catch (error: any) {
      console.error(`   ❌ FAILED to configure Tier ${tier.tierId}. Reason: ${error.reason || error.message}`);
    }
  }

  console.log("----------------------------------------------------");
  console.log("\n🎉🎉🎉 PUBLIC SALE 'BATCH 1' IS CONFIGURED! 🎉🎉🎉");
  console.log("The presale is now ready for the public.");
  console.log("\nNext step: Run '6_addInitialLiquidity.ts' (Can be run after presale)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});