import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`🕵️‍♂️ Diagnostic initiated by: ${signer.address}`);

  // 1. Load Addresses
  const addressesPath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesPath)) throw new Error("❌ deployment-addresses.json not found");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const fortuneAddr = addresses.fortunePool;
  const miningAddr = addresses.miningManager;
  const bkcAddr = addresses.bkcToken;

  console.log(`\n🏥 Checking Contract Health on Arbitrum Sepolia...`);
  console.log(`   - FortunePool: ${fortuneAddr}`);
  console.log(`   - MiningManager: ${miningAddr}`);
  console.log(`   - BKCToken: ${bkcAddr}`);

  // 2. Connect Contracts
  const fortune = await ethers.getContractAt("FortunePool", fortuneAddr);
  const mining = await ethers.getContractAt("MiningManager", miningAddr);
  const bkc = await ethers.getContractAt("BKCToken", bkcAddr);

  // 3. Verify Links
  console.log("\n🔗 Link Verification:");
  
  const fp_mm = await fortune.miningManagerAddress();
  if (fp_mm.toLowerCase() === miningAddr.toLowerCase()) {
      console.log("   ✅ FortunePool -> MiningManager: LINKED");
  } else {
      console.error(`   ❌ FortunePool -> MiningManager: BROKEN (Found: ${fp_mm})`);
  }

  const bkc_owner = await bkc.owner();
  if (bkc_owner.toLowerCase() === miningAddr.toLowerCase()) {
      console.log("   ✅ BKCToken Ownership: MiningManager (Correct)");
  } else {
      console.error(`   ❌ BKCToken Ownership: INCORRECT (Found: ${bkc_owner})`);
      console.log("      ⚠️  MiningManager cannot mint BKC if it is not the owner!");
  }

  // 4. Verify Authorization
  console.log("\n🛡️  Mining Authorization:");
  const SERVICE_KEY = ethers.id("TIGER_GAME_SERVICE");
  const authorizedMiner = await mining.authorizedMiners(SERVICE_KEY);
  
  if (authorizedMiner.toLowerCase() === fortuneAddr.toLowerCase()) {
      console.log("   ✅ FortunePool is AUTHORIZED to mine.");
  } else {
      console.error(`   ❌ FortunePool is NOT AUTHORIZED (Miner: ${authorizedMiner})`);
  }

  // 5. Verify Fees & Tiers
  console.log("\n💰 Economic Config:");
  const oracleFee = await fortune.oracleFeeInWei();
  console.log(`   - Oracle Fee: ${ethers.formatEther(oracleFee)} ETH (Should be 0.00035)`);
  
  const tiers = await fortune.activeTierCount();
  console.log(`   - Active Tiers: ${tiers}`);

  console.log("\n---------------------------------------------------");
  console.log("🏁 Diagnosis Complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});