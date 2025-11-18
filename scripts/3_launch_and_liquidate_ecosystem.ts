// scripts/3_launch_and_liquidate_ecosystem.ts
import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { LogDescription, Log, ContractTransactionReceipt, BaseContract } from "ethers";

// ######################################################################
// ###               ECOSYSTEM LAUNCH CONFIGURATION                 ###
// ######################################################################

const DEPLOY_DELAY_MS = 2000;
const CONFIG_DELAY_MS = 1500;
const CHUNK_SIZE = 150;
const CHUNK_SIZE_BIGINT = BigInt(CHUNK_SIZE);

// --- Manual Liquidity Mint Simulation (Test) ---
const MANUAL_LIQUIDITY_MINT_COUNT = [
    10n, // Tier 0 (Diamond)
    20n, // Tier 1 (Platinum)
    30n, // Tier 2 (Gold)
    40n, // Tier 3 (Silver)
    50n, // Tier 4 (Bronze)
    60n, // Tier 5 (Iron)
    70n  // Tier 6 (Crystal)
];
// -------------------------------------------------------------------

// --- 1. Oracle Fee ---
const FORTUNE_POOL_ORACLE_FEE_ETH = "0.001"; 

// --- 2. Fortune Pool Liquidity ---
const FORTUNE_POOL_LIQUIDITY_TOTAL = ethers.parseEther("1000000"); // 1,000,000 BKC

const FORTUNE_POOL_TIERS = [
    { poolId: 1, multiplierBips: 10000n, chanceDenominator: 3n }, // 1x, 1/3
    { poolId: 2, multiplierBips: 100000n, chanceDenominator: 10n }, // 10x, 1/10
    { poolId: 3, multiplierBips: 1000000n, chanceDenominator: 100n } // 100x, 1/100
];

// --- 3. AMM Liquidity Config ---
const LIQUIDITY_BKC_AMOUNT_PER_POOL = ethers.parseEther("2000000"); // 2,000,000 BKC per NFT Tier

const ALL_TIERS = [
  { tierId: 0, name: "Diamond", boostBips: 5000n, metadata: "diamond_booster.json" },
  { tierId: 1, name: "Platinum", boostBips: 4000n, metadata: "platinum_booster.json" },
  { tierId: 2, name: "Gold", boostBips: 3000n, metadata: "gold_booster.json" },
  { tierId: 3, name: "Silver", boostBips: 2000n, metadata: "silver_booster.json" },
  { tierId: 4, name: "Bronze", boostBips: 1000n, metadata: "bronze_booster.json" },
  { tierId: 5, name: "Iron", boostBips: 500n, metadata: "iron_booster.json" },
  { tierId: 6, name: "Crystal", boostBips: 100n, metadata: "crystal_booster.json" },
];

// --- TGE Supply (40M) ---
const TGE_SUPPLY_AMOUNT = 40_000_000n * 10n**18n; 
// ######################################################################


// --- Helper Functions ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendTransactionWithRetries(txFunction: () => Promise<any>, description: string, retries = 3): Promise<ContractTransactionReceipt | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const tx = await txFunction();
      const receipt = await tx.wait();
      if (!receipt) { throw new Error("Transaction sent but null receipt returned."); }
      console.log(`   ✅ SUCESSO. TX Hash: ${receipt.hash}`);
      await sleep(1500);
      return receipt as ContractTransactionReceipt;
    } catch (error: any) {
      if ((error.message.includes("nonce") || error.message.includes("in-flight")) && i < retries - 1) {
        console.warn(`   ⚠️ Nonce issue detected. Retrying in 5s...`);
        await sleep(5000);
      } else if (error.message.includes("Validator already registered")) {
        console.log("   ⚠️ AVISO: Validador já registrado. Processo concluído.");
        return null;
      } else if (error.message.includes("ReentrancyGuard: reentrant call")) {
        // Log específico para o erro de reentrância que estamos tentando corrigir
        throw new Error(`❌ FALHA na transação (${description}): execution reverted: ReentrancyGuard: reentrant call. VERIFIQUE SE O CONTRATO DM CORRIGIDO FOI DEPLOYADO.`);
      } else {
        throw new Error(`❌ FALHA na transação (${description}): ${error.message}`);
      }
    }
  }
  throw new Error("Transaction failed after multiple retries.");
}

// --- Rule Setting Helpers (NEW LOGIC) ---
async function setServiceFee(manager: any, key: string, value: number | bigint) {
    await sendTransactionWithRetries(() => manager.setServiceFee(key, value), `Set Fee ${key}`);
    console.log(`   -> Service/Staking Fee set: ${key} = ${value.toString()}`);
    await sleep(CONFIG_DELAY_MS / 2); 
}

async function setPStake(manager: any, key: string, value: number | bigint) {
    await sendTransactionWithRetries(() => manager.setPStakeMinimum(key, value), `Set pStake ${key}`);
    console.log(`   -> pStake Minimum set: ${key} = ${value}`);
    await sleep(CONFIG_DELAY_MS / 2);
}

async function setService(manager: any, serviceKey: string, feeValue: number | bigint, pStakeValue: number | bigint) {
    console.log(`\nConfiguring Service: ${serviceKey}...`);
    await setServiceFee(manager, serviceKey, feeValue);
    await setPStake(manager, serviceKey, pStakeValue);
}

// For Mining (New Tokens)
async function setMiningDistributionBips(manager: any, key: string, value: number | bigint) {
    await sendTransactionWithRetries(() => manager.setMiningDistributionBips(key, value), `Set Mining Bips ${key}`);
    console.log(`   -> Mining Distribution (New Tokens) set: ${key} = ${value.toString()} BIPS`);
    await sleep(CONFIG_DELAY_MS / 2); 
}

// For Fees (Original Tokens) - NEW
async function setFeeDistributionBips(manager: any, key: string, value: number | bigint) {
    await sendTransactionWithRetries(() => manager.setFeeDistributionBips(key, value), `Set Fee Bips ${key}`);
    console.log(`   -> Fee Distribution (Original Tokens) set: ${key} = ${value.toString()} BIPS`);
    await sleep(CONFIG_DELAY_MS / 2);
}
// ---------------------------------

/**
 * Helper to deploy or load Spoke contracts
 */
async function getOrCreateSpoke(
    hre: HardhatRuntimeEnvironment,
    addresses: { [key: string]: string },
    key: keyof typeof addresses,
    contractName: string,
    contractPath: string,
    initializerArgs: any[],
) {
    const { ethers, upgrades } = hre;
    const [deployer] = await ethers.getSigners();
    const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");


    if (addresses[key] && addresses.hasOwnProperty(key) && addresses[key].startsWith("0x")) {
        const instance = await ethers.getContractAt(contractName, addresses[key], deployer);
        console.log(`   ⚠️ ${contractName} already deployed. Loaded from: ${addresses[key]}`);
        return instance;
    } else {
        const ContractFactory = await ethers.getContractFactory(contractPath);
        
        const instance = await upgrades.deployProxy(ContractFactory, initializerArgs, { 
            kind: "uups" 
        });
        await instance.waitForDeployment();
        addresses[key] = await instance.getAddress();
        fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
        console.log(`   ✅ ${contractName} (Proxy) deployed & initialized at: ${addresses[key]}`);
        
        return instance;
    }
}
const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");


export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers, upgrades } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(
    `🚀 (Phase 2) Deploying, Configuring & Seeding Ecosystem on network: ${networkName}`
  );
  console.log(`Using account: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 0. Load Addresses ---
  if (!fs.existsSync(addressesFilePath)) {
    throw new Error("Missing deployment-addresses.json. Run 1_deploy_full_initial_setup.ts first.");
  }
  const addresses: { [key: string]: string } = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  const { ecosystemManager, rewardBoosterNFT, publicSale, oracleWalletAddress } = addresses;
  
  if (!ecosystemManager || !rewardBoosterNFT || !publicSale || !oracleWalletAddress) {
    throw new Error("Missing key addresses (ecosystemManager, rewardBoosterNFT, publicSale, oracleWalletAddress) in JSON.");
  }
  if (!FORTUNE_POOL_ORACLE_FEE_ETH || ethers.parseEther(FORTUNE_POOL_ORACLE_FEE_ETH) <= 0n) {
       throw new Error("ERROR: Please set a value for 'FORTUNE_POOL_ORACLE_FEE_ETH'.");
  }

  const hub = await ethers.getContractAt("EcosystemManager", ecosystemManager, deployer);
  let bkcTokenInstance: any;
  let miningManagerInstance: any;
  let delegationManagerInstance: any;
  let notaryInstance: any;
  let fortunePoolInstance: any;
  
  let tx: ContractTransactionReceipt | null;

  try {
    // ##############################################################
    // ### PART 1: DEPLOY/LOAD ALL SPOKE CONTRACTS ###
    // ##############################################################
    console.log("=== PART 1: DEPLOYING/LOADING ALL SPOKE CONTRACTS ===");
    
    // 1.1. Load BKCToken
    bkcTokenInstance = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
    console.log(`\n1.1. BKCToken (Proxy) loaded from: ${addresses.bkcToken}`);

    // 1.2. Deploy Core Spokes (MM & DM)
    miningManagerInstance = await getOrCreateSpoke(hre, addresses, 'miningManager', 'MiningManager', 'MiningManager', 
        [addresses.ecosystemManager] // Args: _ecosystemManagerAddress
    ); 
    
    delegationManagerInstance = await getOrCreateSpoke(hre, addresses, 'delegationManager', 'DelegationManager', 'contracts/DelegationManager.sol:DelegationManager',
        [deployer.address, addresses.ecosystemManager] // Args: _initialOwner, _ecosystemManagerAddress
    );
    
    // 1.3. Critical Hub Update (to allow Spokes to initialize)
    const currentTreasury = await hub.getTreasuryAddress();
    const currentBooster = await hub.getBoosterAddress();
    const currentBKC = await hub.getBKCTokenAddress();

    addresses.treasuryWallet = currentTreasury;
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));


    console.log("\n1.2. Updating Hub (MM & DM) to allow Spoke initialization...");
    await sendTransactionWithRetries(() => hub.setAddresses(
        currentBKC,
        currentTreasury,
        addresses.delegationManager,
        currentBooster,
        addresses.miningManager,
        addresses.decentralizedNotary || ethers.ZeroAddress,
        addresses.fortunePool || ethers.ZeroAddress,
        addresses.nftLiquidityPoolFactory || ethers.ZeroAddress
    ), "Update Hub with MM and DM");
    console.log(`   ✅ Hub updated with DM and MM.`);
    await sleep(DEPLOY_DELAY_MS);
    
    // 1.3. Deploy Service Spokes (Notary & FortunePool)
    console.log("\n1.3. Deploying Service Spokes (Notary, FortunePool)...");
    notaryInstance = await getOrCreateSpoke(hre, addresses, 'decentralizedNotary', 'DecentralizedNotary', 'contracts/DecentralizedNotary.sol:DecentralizedNotary',
        [deployer.address, addresses.ecosystemManager]
    );
    fortunePoolInstance = await getOrCreateSpoke(hre, addresses, 'fortunePool', 'FortunePool', 'FortunePool', 
        [deployer.address, addresses.ecosystemManager]
    );
    
    // 1.4. Deploy NFT Pool Implementation (Template)
    console.log("\n1.4. Deploying NFTLiquidityPool Implementation (Template)...");
    let nftPoolImplementationAddress = addresses.nftLiquidityPool_Implementation;
    
    if (!nftPoolImplementationAddress || !nftPoolImplementationAddress.startsWith("0x")) {
        const NFTLiquidityPool = await ethers.getContractFactory("NFTLiquidityPool");
        const nftPoolImplementation = await NFTLiquidityPool.deploy();
        await nftPoolImplementation.waitForDeployment();
        nftPoolImplementationAddress = await nftPoolImplementation.getAddress();
        addresses.nftLiquidityPool_Implementation = nftPoolImplementationAddress;
        fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
        console.log(`   ✅ Implementation (Template) deployed to: ${nftPoolImplementationAddress}`);
    } else {
        console.log(`   ⚠️ Implementation (Template) already deployed at: ${nftPoolImplementationAddress}`);
    }
    
    // 1.5. Deploy NFT Pool Factory (Proxy)
    console.log("\n1.5. Deploying NFTLiquidityPoolFactory (Proxy)...");
    let factoryInstance: BaseContract;
    const factoryAddress = addresses.nftLiquidityPoolFactory;

    if (!factoryAddress || !factoryAddress.startsWith("0x")) {
        const NFTLiquidityPoolFactory = await ethers.getContractFactory("NFTLiquidityPoolFactory");
        factoryInstance = await upgrades.deployProxy(
            NFTLiquidityPoolFactory, 
            [
                deployer.address, 
                addresses.ecosystemManager, 
                nftPoolImplementationAddress
            ], 
            { initializer: "initialize", kind: "uups" }
        );
        await factoryInstance.waitForDeployment();
        addresses.nftLiquidityPoolFactory = await factoryInstance.getAddress();
        fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
        console.log(`   ✅ NFTLiquidityPoolFactory (Proxy) deployed to: ${addresses.nftLiquidityPoolFactory}`);
    } else {
        factoryInstance = await ethers.getContractAt("NFTLiquidityPoolFactory", factoryAddress, deployer);
        console.log(`   ⚠️ NFTLiquidityPoolFactory (Proxy) already deployed. Loaded from: ${factoryAddress}`);
    }
    
    console.log(`\n✅ All Spoke contracts deployed/loaded and addresses saved.`);
    await sleep(DEPLOY_DELAY_MS);

    // ##############################################################
    // ### PART 2: CONFIGURE CONNECTIONS & OWNERSHIP ###
    // ##############################################################
    console.log("\n=== PART 2: CONFIGURING CONNECTIONS & OWNERSHIP ===");

    await sleep(20000); // 20s pause for network propagation
    console.log("   (20s pause complete. Resuming configuration...)");
    
    // 2.1. Final Hub Connection Update
    console.log("\n2.1. Updating Hub with all final Spoke addresses...");
    const finalTreasury = addresses.treasuryWallet; 
    await sendTransactionWithRetries(() => hub.setAddresses(
        addresses.bkcToken,
        finalTreasury,
        addresses.delegationManager,
        addresses.rewardBoosterNFT,
        addresses.miningManager,
        addresses.decentralizedNotary,
        addresses.fortunePool,
        addresses.nftLiquidityPoolFactory
    ), "Update Hub with All Final Addresses");
    console.log(`   ✅ Hub updated with all 8 final addresses.`);

    // 2.2. Authorize Miners in MiningManager (NEW REVENUE FUNNEL LOGIC)
    console.log("\n2.2. Authorizing Spoke contracts in MiningManager (Universal Funnel)...");
    const mm = miningManagerInstance; // Alias for clarity
    
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner("TIGER_GAME_SERVICE", addresses.fortunePool), "Authorize FortunePool");
    console.log(`   -> Authorized: FortunePool (TIGER_GAME_SERVICE)`);
    
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner("NOTARY_SERVICE", addresses.decentralizedNotary), "Authorize DecentralizedNotary");
    console.log(`   -> Authorized: DecentralizedNotary (NOTARY_SERVICE)`);

    await sendTransactionWithRetries(() => mm.setAuthorizedMiner("VALIDATOR_REGISTRATION_FEE", addresses.delegationManager), "Authorize DelegationManager (Registration)");
    console.log(`   -> Authorized: DelegationManager (VALIDATOR_REGISTRATION_FEE)`);
    
    // Authorize DelegationManager for its own internal fees (Unstake, Claim)
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner("UNSTAKE_FEE_BIPS", addresses.delegationManager), "Authorize DelegationManager (Unstake)");
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner("FORCE_UNSTAKE_PENALTY_BIPS", addresses.delegationManager), "Authorize DelegationManager (ForceUnstake)");
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner("CLAIM_REWARD_FEE_BIPS", addresses.delegationManager), "Authorize DelegationManager (Claim)");
    console.log(`   -> Authorized: DelegationManager (Internal Fees: Unstake, ForceUnstake, Claim)`);

    console.log(`   -> NFT Pool authorization will occur in Part 4 during pool deployment.`);

    // 2.3. Transfer BKCToken Ownership to MiningManager
    console.log("\n2.3. (CRITICAL) Transferring BKCToken ownership to MiningManager...");
    const currentOwner = await bkcTokenInstance.owner(); 
    if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
        await sendTransactionWithRetries(() => bkcTokenInstance.transferOwnership(addresses.miningManager), "Transfer BKCToken Ownership");
        console.log(`   ✅ OWNERSHIP TRANSFERRED! MiningManager is now the sole minter.`);
    } else if (currentOwner.toLowerCase() === addresses.miningManager.toLowerCase()) {
        console.log(`   ⚠️ WARNING: Ownership already transferred. MiningManager is owner.`);
    } else {
        throw new Error(`❌ ERROR: BKCToken owner is ${currentOwner}, not Deployer. Cannot mint TGE.`);
    }
    
    // 2.4. Mint TGE Supply
    console.log(`\n2.4. Minting TGE Supply (${ethers.formatEther(TGE_SUPPLY_AMOUNT)} BKC) to MiningManager...`);
    try {
        await sendTransactionWithRetries(() => 
            miningManagerInstance.initialTgeMint(addresses.miningManager, TGE_SUPPLY_AMOUNT), "Initial TGE Mint"
        );
        console.log(`   ✅ TGE of ${ethers.formatEther(TGE_SUPPLY_AMOUNT)} BKC minted TO the MiningManager.`);
    } catch (e: any) {
        if (e.message.includes("TGE already minted")) { console.log("   ⚠️ TGE already minted."); }
        else { throw e; }
    }
    
    // 2.5. Distribute TGE Supply from MiningManager
    console.log(`\n2.5. Distributing TGE Supply from MiningManager (${ethers.formatEther(TGE_SUPPLY_AMOUNT)} BKC)...`);
    const totalLiquidityForDeployer = FORTUNE_POOL_LIQUIDITY_TOTAL + (LIQUIDITY_BKC_AMOUNT_PER_POOL * BigInt(ALL_TIERS.length));
    const airdropWallet = deployer.address; // Using deployer as airdrop wallet
    
    if (TGE_SUPPLY_AMOUNT < totalLiquidityForDeployer) {
        throw new Error("TGE configuration invalid. TGE is less than required liquidity.");
    }
    const remainingForAirdrop = TGE_SUPPLY_AMOUNT - totalLiquidityForDeployer;

    console.log(`   -> Transferring ${ethers.formatEther(totalLiquidityForDeployer)} BKC from Manager to Deployer (for Liquidity)...`);
    try {
        await sendTransactionWithRetries(() => 
            miningManagerInstance.transferTokensFromGuardian(deployer.address, totalLiquidityForDeployer), "Transfer Liquidity to Deployer"
        );
        console.log(`   ✅ Deployer funded for liquidity.`);
    } catch (e: any) {
        if (e.message.includes("transfer amount exceeds balance")) {
             console.warn(`   ⚠️  Manager has no BKC balance. TGE mint (2.4) may have been skipped.`);
        } else {
             console.warn(`   ⚠️  Failed to transfer to Deployer (maybe done already): ${e.message}`);
        }
    }
    
    if (remainingForAirdrop > 0n) {
        console.log(`   -> Transferring ${ethers.formatEther(remainingForAirdrop)} BKC from Manager to Airdrop Wallet (${airdropWallet})...`);
        try {
            await sendTransactionWithRetries(() => 
                miningManagerInstance.transferTokensFromGuardian(airdropWallet, remainingForAirdrop), "Transfer Airdrop to Deployer"
            );
             console.log(`   ✅ Airdrop wallet funded.`);
        } catch (e: any) {
             console.warn(`   ⚠️  Failed to transfer to Airdrop (maybe done already): ${e.message}`);
        }
    }
    
    // 2.6. Configure Oracle
    console.log("\n2.6. Authorizing Oracle in FortunePool and setting fee...");
    try {
        await sendTransactionWithRetries(() => fortunePoolInstance.setOracleAddress(addresses.oracleWalletAddress), "Set Oracle Address");
        await sendTransactionWithRetries(() => fortunePoolInstance.setOracleFee(ethers.parseEther(FORTUNE_POOL_ORACLE_FEE_ETH)), "Set Oracle Fee");
        console.log(`   ✅ Oracle (${addresses.oracleWalletAddress}) authorized with fee ${FORTUNE_POOL_ORACLE_FEE_ETH} ETH/BNB.`);
    } catch (e: any) { console.warn(`   ⚠️ Failed to set oracle (maybe done already): ${e.message}`); }


    // ##############################################################
    // ### PART 3: CONFIGURE INITIAL RULES & RATES ###
    // ##############################################################
    console.log("\n=== PART 3: CONFIGURING INITIAL RULES & RATES (NEW LOGIC) ===");

    // 3.1. Configure FortunePool Tiers
    console.log("\n3.1. Configuring FortunePool Prize Tiers...");
    try {
        for (const tier of FORTUNE_POOL_TIERS) {
            await sendTransactionWithRetries(() => fortunePoolInstance.setPrizeTier(tier.poolId, tier.chanceDenominator, tier.multiplierBips), `Set FortunePool Tier ${tier.poolId}`);
            console.log(`   -> Tier ${tier.poolId} (Mult: ${Number(tier.multiplierBips)/10000}x, Chance: 1/${tier.chanceDenominator.toString()}) set.`);
        }
    } catch (e: any) { console.warn(`   ⚠️ Failed to set tiers (maybe done already): ${e.message}`); }


    // 3.2. Configure all Hub fees and pStake minimums
    console.log("\n3.2. Configuring Hub Fees, pStake, and NEW Distribution Rules...");
    
    const RULES_TO_APPLY = JSON.parse(fs.readFileSync(path.join(__dirname, "../rules-config.json"), "utf8"));
    
    try {
        // --- Service Fees & pStake ---
        await setService(hub, "NOTARY_SERVICE", ethers.parseEther(RULES_TO_APPLY.serviceFees.NOTARY_SERVICE), BigInt(RULES_TO_APPLY.pStakeMinimums.NOTARY_SERVICE));
        await setService(hub, "FORTUNE_POOL_SERVICE", ethers.parseEther(RULES_TO_APPLY.serviceFees.FORTUNE_POOL_SERVICE), BigInt(RULES_TO_APPLY.pStakeMinimums.FORTUNE_POOL_SERVICE));
        await setService(hub, "NFT_POOL_ACCESS", ethers.parseEther(RULES_TO_APPLY.serviceFees.NFT_POOL_ACCESS), BigInt(RULES_TO_APPLY.pStakeMinimums.NFT_POOL_ACCESS));
        
        await setServiceFee(hub, "VALIDATOR_REGISTRATION_FEE", ethers.parseEther(RULES_TO_APPLY.serviceFees.VALIDATOR_REGISTRATION_FEE)); 

        // --- Staking/Internal Fees (BIPS) ---
        await setServiceFee(hub, "UNSTAKE_FEE_BIPS", BigInt(RULES_TO_APPLY.stakingFees.UNSTAKE_FEE_BIPS));
        await setServiceFee(hub, "FORCE_UNSTAKE_PENALTY_BIPS", BigInt(RULES_TO_APPLY.stakingFees.FORCE_UNSTAKE_PENALTY_BIPS));
        await setServiceFee(hub, "CLAIM_REWARD_FEE_BIPS", BigInt(RULES_TO_APPLY.stakingFees.CLAIM_REWARD_FEE_BIPS));

        // --- NFT AMM Tax Fees (BIPS) ---
        await setServiceFee(hub, "NFT_POOL_TAX_BIPS", BigInt(RULES_TO_APPLY.ammTaxFees.NFT_POOL_TAX_BIPS));
        await setServiceFee(hub, "NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS", BigInt(RULES_TO_APPLY.ammTaxFees.NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS));
        
        // --- (A) MINING Distribution (New Tokens) ---
        const md = RULES_TO_APPLY.miningDistribution;
        const mdTotal = BigInt(md.TREASURY) + BigInt(md.VALIDATOR_POOL) + BigInt(md.DELEGATOR_POOL);
        if (mdTotal !== 10000n) {
            throw new Error(`Mining Distribution must sum to 10000 BIPS (100%), but sums to ${mdTotal}`);
        }
        await setMiningDistributionBips(hub, "TREASURY", BigInt(md.TREASURY));
        await setMiningDistributionBips(hub, "VALIDATOR_POOL", BigInt(md.VALIDATOR_POOL));
        await setMiningDistributionBips(hub, "DELEGATOR_POOL", BigInt(md.DELEGATOR_POOL));

        // --- (B) FEE Distribution (Original Tokens) ---
        const fd = RULES_TO_APPLY.feeDistribution;
        if (!fd) {
            throw new Error("Missing 'feeDistribution' section in rules-config.json. Please add it.");
        }
        const fdTotal = BigInt(fd.TREASURY) + BigInt(fd.VALIDATOR_POOL) + BigInt(fd.DELEGATOR_POOL);
        if (fdTotal !== 10000n) {
            throw new Error(`Fee Distribution must sum to 10000 BIPS (100%), but sums to ${fdTotal}`);
        }
        await setFeeDistributionBips(hub, "TREASURY", BigInt(fd.TREASURY));
        await setFeeDistributionBips(hub, "VALIDATOR_POOL", BigInt(fd.VALIDATOR_POOL));
        await setFeeDistributionBips(hub, "DELEGATOR_POOL", BigInt(fd.DELEGATOR_POOL));

        console.log(`   ✅ All initial rules, fees, and distributions (Mining & Fee) set in Hub.`);
    } catch (e: any) { console.warn(`   ⚠️ Failed to set rules/fees: ${e.message}`); }


    // ##############################################################
    // ### PART 4: SEED ECOSYSTEM (LIQUIDITY) ###
    // ##############################################################
    console.log("\n=== PART 4: SEEDING ECOSYSTEM (LIQUIDITY) ===");

    // 4.1. FortunePool Liquidity
    console.log(`\n4.1. Seeding FortunePool with ${ethers.formatEther(FORTUNE_POOL_LIQUIDITY_TOTAL)} $BKC...`);
    try {
        await sendTransactionWithRetries(() => 
            bkcTokenInstance.approve(addresses.fortunePool, FORTUNE_POOL_LIQUIDITY_TOTAL), "Approve FortunePool Liquidity"
        );
        console.log(`   ✅ Deployer approved FortunePool.`);
        await sendTransactionWithRetries(() => fortunePoolInstance.topUpPool(FORTUNE_POOL_LIQUIDITY_TOTAL), "TopUp FortunePool");
        console.log(`   ✅ ${ethers.formatEther(FORTUNE_POOL_LIQUIDITY_TOTAL)} BKC injected into PrizePool.`);
    } catch (e: any) {
        if (e.message.includes("transfer amount exceeds balance")) {
            console.warn(`   ⚠️  Deployer has no BKC balance. TGE distribution (2.5) may have been skipped.`);
        } else {
            console.warn(`   ⚠️  Failed to seed FortunePool (maybe done already): ${e.message}`);
        }
    }


    // 4.2. NFT AMM Liquidity (Factory Logic)
    console.log("\n4.2. Minting NFTs and Seeding AMM Pools (Factory Mode)...");

    const rewardBoosterNFT = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, deployer);
    const factoryInstanceLoaded = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, deployer);

    // Loop to mint and add liquidity for all tiers
    for (let i = 0; i < ALL_TIERS.length; i++) {
        const tier = ALL_TIERS[i];
        const initialMintAmount = MANUAL_LIQUIDITY_MINT_COUNT[i]; // Using manual test amounts

        console.log(`\n   --- Processing liquidity for: ${tier.name} (Tier ${tier.tierId}) ---`);
        
        if (initialMintAmount === 0n) { 
            console.log(`   ⚠️ Manual mint count is zero. Skipping.`); 
            continue; 
        }

        console.log(`      -> Checking/Deploying Pool Clone for ${tier.boostBips} bips...`);
        let poolAddress = await factoryInstanceLoaded.getPoolAddress(tier.boostBips);
        
        if (poolAddress === ethers.ZeroAddress) {
            console.log(`         ... Pool not found. Deploying via Factory...`);
            
            tx = await sendTransactionWithRetries(() => factoryInstanceLoaded.deployPool(tier.boostBips), `Deploy Pool ${tier.name}`);
            
            if (!tx) {
                // If deployment fails but tx is null (e.g., already exists), we assume existing pool
                // But if deployment fails and tx is null because of network error, throw.
                if (poolAddress === ethers.ZeroAddress) { // Still zero address after attempting deploy
                    throw new Error(`Failed to deploy pool ${tier.name}: Transaction receipt was null and address is still zero.`);
                }
            }
            
            const logs = (tx?.logs || []) as Log[];
            const parsedLogs = logs
                .map((log: Log) => { try { return factoryInstanceLoaded.interface.parseLog(log as any); } catch { return null; } })
                .filter((log: LogDescription | null): log is LogDescription => log !== null && log.name === "PoolDeployed");

            if (parsedLogs.length > 0) {
                poolAddress = parsedLogs[0].args.poolAddress;
                console.log(`         ✅ Pool Clone deployed to: ${poolAddress}`);
            } else if (poolAddress === ethers.ZeroAddress) {
                // This scenario means the deployPool succeeded but didn't emit the event or transaction was skipped
                console.warn(`         ⚠️ Could not find 'PoolDeployed' event for ${tier.name}. Trying to fetch address again.`);
                poolAddress = await factoryInstanceLoaded.getPoolAddress(tier.boostBips);
                if (poolAddress === ethers.ZeroAddress) {
                    throw new Error(`Failed to confirm Pool address for ${tier.name} after deployment attempt.`);
                }
            }
        } else {
            console.log(`         ... Pool already exists at: ${poolAddress}`);
        }

        // Save pool address to JSON
        const poolKey = `pool_${tier.name.toLowerCase()}`;
        addresses[poolKey] = poolAddress;
        fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
        
        // ** NEW STEP: Authorize this new pool in the MiningManager **
        console.log(`      -> Authorizing Pool ${poolAddress} in MiningManager...`);
        try {
            await sendTransactionWithRetries(() => 
                mm.setAuthorizedMiner("NFT_POOL_TAX_BIPS", poolAddress), `Authorize Pool ${tier.name} in MM`
            );
            console.log(`      ✅ Pool authorized for "NFT_POOL_TAX_BIPS"`);
        } catch (e: any) {
             console.warn(`      ⚠️ Failed to authorize pool (maybe done already): ${e.message}`);
        }
        // **********************************************************

        const poolInstance = await ethers.getContractAt("NFTLiquidityPool", poolAddress, deployer);
        const poolInfo = await poolInstance.getPoolInfo(); 
        
        if (poolInfo.nftCount > 0) { 
            console.warn(`   ⚠️ Pool at ${poolAddress} already has liquidity. Skipping AMM seed.`); 
            continue; 
        }
        
        console.log(`   NFTs to Mint (Manual Test): ${initialMintAmount}`);

        // Mint NFTs (in chunks)
        const allPoolTokenIds: string[] = [];
        for (let j = 0n; j < initialMintAmount; j += CHUNK_SIZE_BIGINT) {
            const remaining = initialMintAmount - j;
            const amountToMint = remaining < CHUNK_SIZE_BIGINT ? remaining : CHUNK_SIZE_BIGINT;
            
            tx = await sendTransactionWithRetries(() =>
                rewardBoosterNFT.ownerMintBatch(deployer.address, Number(amountToMint), tier.boostBips, tier.metadata), `Mint ${Number(amountToMint)} ${tier.name} NFTs`
            );

            if (!tx) {
                throw new Error("Failed to mint NFTs: Transaction receipt was null.");
            }
            
            const logs = (tx?.logs || []) as Log[];
            const tokenIdsInChunk = logs
                .map((log: Log) => { try { return rewardBoosterNFT.interface.parseLog(log as any); } catch { return null; } })
                .filter((log: LogDescription | null): log is LogDescription => log !== null && log.name === "BoosterMinted")
                .map((log: LogDescription) => log.args.tokenId.toString());
            allPoolTokenIds.push(...tokenIdsInChunk);
        }
        
        // Add Liquidity
        console.log(`      -> Adding ${allPoolTokenIds.length} NFTs and ${ethers.formatEther(LIQUIDITY_BKC_AMOUNT_PER_POOL)} BKC to POOL CLONE at ${poolAddress}...`);
        
        console.log(`         ... Approving BKC for ${poolAddress}`);
        await sendTransactionWithRetries(() => bkcTokenInstance.approve(poolAddress, LIQUIDITY_BKC_AMOUNT_PER_POOL), `Approve BKC to Pool ${tier.name}`);
        console.log(`         ... Approving NFTs for ${poolAddress}`);
        await sendTransactionWithRetries(() => rewardBoosterNFT.setApprovalForAll(poolAddress, true), `Approve NFTs to Pool ${tier.name}`);

        // Add liquidity in chunks
        let isFirstChunk = true;
        for (let k = 0; k < allPoolTokenIds.length; k += CHUNK_SIZE) {
            const chunk = allPoolTokenIds.slice(k, k + CHUNK_SIZE);
            if (isFirstChunk) {
                await sendTransactionWithRetries(() => 
                    poolInstance.addInitialLiquidity(chunk, LIQUIDITY_BKC_AMOUNT_PER_POOL), `Add Initial Liquidity to ${tier.name}`
                );
                isFirstChunk = false;
            } else {
                await sendTransactionWithRetries(() => poolInstance.addMoreNFTsToPool(chunk), `Add More NFTs to ${tier.name}`);
            }
        }
        
        await sendTransactionWithRetries(() => rewardBoosterNFT.setApprovalForAll(poolAddress, false), `Revoke NFT Approval for Pool ${tier.name}`);
        console.log(`   ✅ Liquidity for ${tier.name} added and approval revoked.`);
    }
    
    // ##############################################################
    // ### PART 5: REGISTER VALIDATOR (CONSOLIDATED FROM STEP 4) ###
    // ##############################################################
    console.log("\n=== PART 5: REGISTERING INITIAL VALIDATOR (DEPLOYER) ===");

    const validatorRegistrationKey = "VALIDATOR_REGISTRATION_FEE"; 
    const dm = delegationManagerInstance;

    try {
      const registrationFeeWei = await hub.getFee(validatorRegistrationKey);
      console.log(`\n5.1. Registration Fee (Hub) read: ${ethers.formatEther(registrationFeeWei)} BKC`);

      if (registrationFeeWei === 0n) {
          throw new Error("Registration fee is zero. Please configure 'VALIDATOR_REGISTRATION_FEE' in Hub.");
      }
      
      // 5.2. Approve the DM to pull the fee
      const allowance = await bkcTokenInstance.allowance(deployer.address, addresses.delegationManager);
      
      if (allowance < registrationFeeWei) {
           await sendTransactionWithRetries(
              () => bkcTokenInstance.approve(addresses.delegationManager, registrationFeeWei), 
              `Approve ${ethers.formatEther(registrationFeeWei)} BKC for DM (Fee)`
           );
      } else {
           console.log("   ⚠️ AVISO: BKC approval already sufficient. Skipping approval.");
      }

      // 5.3. Pay Fee AND Register (Single Transaction)
      console.log("\n5.3. Registering the Validator (Charging Fee and Registering in one TX)...");
      
      // This call now charges the fee and sets 'isRegistered'
      await sendTransactionWithRetries(
          () => dm.registerValidator(deployer.address), 
          "Final Validator Registration (With Fee)"
      );

      console.log("----------------------------------------------------");
      console.log(`\n🎉🎉🎉 VALIDATOR ${deployer.address} REGISTERED SUCCESSFULLY! 🎉🎉🎉`);

      // 5.4. Final Verification
      const validatorInfo = await dm.validators(deployer.address);
      if (validatorInfo[0]) { // isRegistered is the first element (index 0)
          console.log(`   Status: Validator registered = TRUE`);
      } else {
           console.error(`   Status: ERROR. The validator is not marked as registered.`);
      }

    } catch (error: any) {
      console.error("\n❌ Critical Failure in Validator Registration (Part 5):", error.message);
      // NOTE: We don't exit here, as the ecosystem setup (Parts 1-4) was successful.
    }


  } catch (error: any) {
    console.error("\n❌ Critical Failure during Ecosystem Launch:", error.message);
    process.exit(1);
  }

  console.log("\n----------------------------------------------------");
  console.log("\n🎉🎉🎉 ECOSYSTEM LAUNCH & SEEDING COMPLETE! 🎉🎉🎉");
  console.log("The ecosystem is fully deployed, configured, and seeded.");
  console.log("\nNext Step: Test the DApp and delegation flow.");
}

// Standalone execution block
if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}