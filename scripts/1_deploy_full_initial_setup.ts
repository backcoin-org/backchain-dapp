// scripts/1_deploy_full_initial_setup.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { BigNumberish } from "ethers";

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEPLOY_DELAY_MS = 2000;

// --- Presale Configuration (Phase 1) ---
const IPFS_BASE_URI_BOOSTERS =
  "ipfs://bafybeigf3n2q2cbsnsmqytv57e6dvuimtzsg6pp7iyhhhmqpaxgpzlmgem/";

const DEFAULT_ORACLE_ADDRESS = "0xd7e622124b78a28c4c928b271fc9423285804f98";

const TIERS_TO_SETUP = [
  { tierId: 0, maxSupply: 1000000, priceETH: "3.60", boostBips: 5000, metadata: "diamond_booster.json" },
  { tierId: 1, maxSupply: 1000000, priceETH: "1.44", boostBips: 4000, metadata: "platinum_booster.json" },
  { tierId: 2, maxSupply: 1000000, priceETH: "0.54", boostBips: 3000, metadata: "gold_booster.json" },
  { tierId: 3, maxSupply: 1000000, priceETH: "0.27", boostBips: 2000, metadata: "silver_booster.json" },
  { tierId: 4, maxSupply: 1000000, priceETH: "0.144", boostBips: 1000, metadata: "bronze_booster.json" },
  { tierId: 5, maxSupply: 1000000, priceETH: "0.07", boostBips: 500, metadata: "iron_booster.json" },
  { tierId: 6, maxSupply: 1000000, priceETH: "0.01", boostBips: 100, metadata: "crystal_booster.json" },
];
// ----------------------------------------

const addressesFilePath = path.join(
    __dirname,
    "../deployment-addresses.json"
);

function deleteAddressesFileOnError() {
    if (fs.existsSync(addressesFilePath)) {
        fs.unlinkSync(addressesFilePath);
        console.log("\n==========================================================");
        console.log("🗑️ 'deployment-addresses.json' file automatically deleted on error.");
        console.log("⚠️ You can safely re-run the script.");
        console.log("==========================================================");
    }
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers, upgrades } = hre; 
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(
    `🚀 (Phase 1: Core/Presale) Deploying and Configuring Initial Setup on network: ${networkName}`
  );
  console.log(`Using account: ${deployer.address}`);
  console.log("----------------------------------------------------");

  if (!IPFS_BASE_URI_BOOSTERS.includes("ipfs://")) {
    throw new Error("IPFS_BASE_URI_BOOSTERS must be set and start with 'ipfs://'");
  }

  const addresses: { [key: string]: string } = {};
  
  if (fs.existsSync(addressesFilePath)) {
       fs.unlinkSync(addressesFilePath);
       console.log(`(Cleanup: Previous 'deployment-addresses.json' deleted)`);
  }
  fs.writeFileSync(addressesFilePath, JSON.stringify({}, null, 2));


  let boosterNFT: any;
  let saleContract: any;
  let bkcTokenInstance: any;
  let tx; 

  try {
    // =================================================================
    // === STEP 1: DEPLOY KEY CONTRACTS & PRESALE (PROXIES) ===
    // =================================================================

    // 1.1. EcosystemManager (Hub)
    console.log("1.1. Deploying EcosystemManager (Hub UUPS)...");
    const EcosystemManager = await ethers.getContractFactory("EcosystemManager");
    const ecosystemManager = await upgrades.deployProxy(
      EcosystemManager,
      [deployer.address],
      { initializer: "initialize", kind: "uups" }
    );
    await ecosystemManager.waitForDeployment();
    addresses.ecosystemManager = await ecosystemManager.getAddress();
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ EcosystemManager (Proxy) deployed to: ${addresses.ecosystemManager}`);
    await sleep(DEPLOY_DELAY_MS);

    // 1.2. RewardBoosterNFT (Factory)
    console.log("\n1.2. Deploying RewardBoosterNFT (Factory) as Proxy...");
    const RewardBoosterNFT = await ethers.getContractFactory("RewardBoosterNFT");
    boosterNFT = await upgrades.deployProxy(
        RewardBoosterNFT,
        [deployer.address], 
        { initializer: "initialize" } 
    );
    await boosterNFT.waitForDeployment();
    addresses.rewardBoosterNFT = await boosterNFT.getAddress();
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ RewardBoosterNFT (Proxy) deployed to: ${addresses.rewardBoosterNFT}`);
    await sleep(DEPLOY_DELAY_MS);

    // 1.3. PublicSale (Store)
    console.log("\n1.3. Deploying PublicSale (Store UUPS)...");
    const PublicSale = await ethers.getContractFactory("PublicSale");
    saleContract = await upgrades.deployProxy(
      PublicSale,
      [
        addresses.rewardBoosterNFT,
        addresses.ecosystemManager,
        deployer.address
      ],
      { initializer: "initialize", kind: "uups" }
    );
    await saleContract.waitForDeployment();
    addresses.publicSale = await saleContract.getAddress();
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ PublicSale (Proxy) deployed to: ${addresses.publicSale}`);
    await sleep(DEPLOY_DELAY_MS);

    // =================================================================
    // === STEP 2: DEPLOY CORE UTILITIES ===
    // =================================================================

    // 2.1. BKCToken
    console.log("\n2.1. Deploying BKCToken (Proxy)...");
    const BKCToken = await ethers.getContractFactory("BKCToken");
    bkcTokenInstance = await upgrades.deployProxy(
        BKCToken,
        [deployer.address], 
        { initializer: "initialize" }
    );
    await bkcTokenInstance.waitForDeployment();
    addresses.bkcToken = await bkcTokenInstance.getAddress();
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ BKCToken (Proxy) deployed to: ${addresses.bkcToken}`);
    await sleep(DEPLOY_DELAY_MS);
    
    // 2.2. SimpleBKCFaucet
    console.log("\n2.2. Deploying SimpleBKCFaucet (Utility) as Proxy...");
    const SimpleBKCFaucet = await ethers.getContractFactory("SimpleBKCFaucet");
    const simpleBKCFaucet = await upgrades.deployProxy(
        SimpleBKCFaucet,
        [addresses.bkcToken, deployer.address],
        { initializer: "initialize", kind: "uups" }
    );
    await simpleBKCFaucet.waitForDeployment();
    addresses.faucet = await simpleBKCFaucet.getAddress();
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ SimpleBKCFaucet (Proxy) deployed to: ${addresses.faucet}`);
    await sleep(DEPLOY_DELAY_MS);

    // =================================================================
    // === STEP 3: SAVE STATIC ADDRESSES ===
    // =================================================================
    
    addresses.oracleWalletAddress = DEFAULT_ORACLE_ADDRESS;
    console.log(`\n3.1. Default Oracle Address saved: ${addresses.oracleWalletAddress}`);
    
    addresses.bkcDexPoolAddress = "https://pancakeswap.finance/swap?chain=bsc";
    console.log(`   DEX Link (bkcDexPoolAddress) saved: ${addresses.bkcDexPoolAddress}`);

    addresses.mainLPPairAddress = "0x...[PLEASE UPDATE AFTER CREATING LP]...";
    
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ All ${Object.keys(addresses).length} initial addresses saved to JSON.`);
    await sleep(DEPLOY_DELAY_MS);

    // =================================================================
    // === STEP 4: CONFIGURE CONTRACTS ===
    // =================================================================

    console.log("\n--- Configuring Connections & Rules ---");
    const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, deployer);
    
    // 4.1. Hub Configuration
    console.log("4.1. Configuring Hub with batch `setAddresses`...");
    tx = await hub.setAddresses(
        addresses.bkcToken,             // _bkcToken
        deployer.address,               // _treasuryWallet (using deployer temporarily)
        ethers.ZeroAddress,             // _delegationManager (Not deployed in Phase 1)
        addresses.rewardBoosterNFT,     // _rewardBooster
        ethers.ZeroAddress,             // _miningManager (Not deployed in Phase 1)
        ethers.ZeroAddress,             // _decentralizedNotary (Not deployed in Phase 1)
        ethers.ZeroAddress,             // _fortunePool (Not deployed in Phase 1)
        ethers.ZeroAddress              // _nftLiquidityPoolFactory (Not deployed in Phase 1)
    );
    await tx.wait();
    console.log(`   ✅ Hub configured (BKCToken, RewardBooster, and Treasury set).`);
    await sleep(DEPLOY_DELAY_MS);

    // 4.2. NFT Authorization & URI
    tx = await boosterNFT.setSaleContractAddress(addresses.publicSale);
    await tx.wait();
    tx = await boosterNFT.setBaseURI(IPFS_BASE_URI_BOOSTERS);
    await tx.wait();
    console.log(`   ✅ SaleContract authorized and Base URI set on NFT Contract.`);
    await sleep(DEPLOY_DELAY_MS);

    // 4.3. Presale Tier Configuration
    console.log("\n4.3. Configuring Sale Tiers in PublicSale (Phase 1 Prices)...");
    
    for (const tier of TIERS_TO_SETUP) {
      const priceInWei = ethers.parseEther(tier.priceETH);
      const maxSupply = BigInt(tier.maxSupply);
      
      console.log(`   -> Configuring ${tier.metadata} (ID ${tier.tierId}): Price: ${tier.priceETH} ETH/BNB`);
      
      tx = await saleContract.setTier(
        BigInt(tier.tierId),
        priceInWei,
        maxSupply,
        BigInt(tier.boostBips),
        tier.metadata
      );
      await tx.wait();
      console.log(`   ✅ Tier ${tier.tierId} configured.`);
    }

    console.log("----------------------------------------------------");
    console.log("\n🎉🎉🎉 INITIAL SETUP (CORE + PRESALE) COMPLETE! 🎉🎉🎉");
    console.log("Infrastructure (Proxies) and presale contracts are deployed.");
    console.log("\nNext Step: Run '3_launch_and_liquidate_ecosystem.ts' to deploy all internal services and activate the economy.");

  } catch (error: any) {
    console.error("\n❌ Critical Failure during Initial Setup:", error.message);
    deleteAddressesFileOnError();
    process.exit(1);
  }
}

// Standalone execution block
if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}