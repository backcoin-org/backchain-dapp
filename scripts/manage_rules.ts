import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

// ######################################################################
// ###               RULES CONTROL PANEL SCRIPT (FINAL V3)            ###
// ######################################################################

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DESCRIPTION_KEYS = ["DESCRIPTION", "COMMENT"];

/**
 * Robust function to process EcosystemManager (Hub) rule categories.
 */
async function processRuleCategory(
    hub: any, 
    rules: any, 
    setter: (key: string | bigint, value: bigint) => Promise<any>, 
    converter: (value: string) => bigint,
    description: string,
    isBoosterDiscount: boolean = false
) {
    if (!rules) return;
    
    for (const ruleKey of Object.keys(rules)) {
        // Ignore comment keys
        if (DESCRIPTION_KEYS.includes(ruleKey.toUpperCase())) continue;

        const valueStr = rules[ruleKey];
        if (valueStr && valueStr.trim() !== "") {
            try {
                // Convert value (Wei or Integer/Bips)
                const valueBigInt = converter(valueStr);
                
                let finalKey: string | bigint;
                
                // Determine if key is a String (Hash) or Number (Booster ID)
                if (isBoosterDiscount) {
                    finalKey = converter(ruleKey); 
                } else {
                    finalKey = ethers.id(ruleKey); 
                }
                
                console.log(`   -> UPDATING ${description} [${ruleKey}] to ${valueStr}...`);
                
                // Execute transaction
                const tx = await setter(finalKey, valueBigInt);
                await tx.wait();
                
                console.log("   ✅ SUCCESS.");
                await sleep(500); // Pause to avoid RPC rate limits
            } catch (e: any) {
                 console.error(`   ❌ ERROR applying rule [${ruleKey}]: ${e.message}`);
                 // Don't abort script, just log error
            }
        }
    }
}

/**
 * Special function for Fortune Pool Tiers (ID -> Range, Multiplier)
 */
async function processFortuneTiers(fortunePool: any, rules: any) {
    if (!rules || !fortunePool) return;
    
    console.log("\n🎰 Processing Fortune Pool Tiers...");

    for (const tierIdStr of Object.keys(rules)) {
        if (DESCRIPTION_KEYS.includes(tierIdStr.toUpperCase())) continue;

        const valueStr = rules[tierIdStr]; // Expected format: "50,20000" (Range 50, 2x Multiplier)
        if (valueStr && valueStr.includes(",")) {
            try {
                const [rangeStr, multStr] = valueStr.split(",");
                const tierId = BigInt(tierIdStr);
                const range = BigInt(rangeStr.trim());
                const multiplier = BigInt(multStr.trim());

                console.log(`   -> SETTING Tier ${tierId}: Range 1-${range}, Mult ${multiplier} BIPS...`);
                
                // ABI: setPrizeTier(uint256 _tierId, uint128 _range, uint64 _multiplierBips)
                const tx = await fortunePool.setPrizeTier(tierId, range, multiplier);
                await tx.wait();
                
                console.log("   ✅ SUCCESS.");
                await sleep(500);
            } catch (e: any) {
                console.error(`   ❌ ERROR setting Tier ${tierIdStr}: ${e.message}`);
            }
        }
    }
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(
    `🚀 (MANAGEMENT) Running ecosystem rules update script on network: ${networkName}`
  );
  console.log(`Using account: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Load Addresses ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) throw new Error("Missing deployment-addresses.json");
  
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
  const hubAddress = addresses.ecosystemManager;
  const fortuneAddress = addresses.fortunePool;

  if (!hubAddress) throw new Error("EcosystemManager address not found in JSON.");

  // --- 2. Connect to Contracts ---
  const hub = await ethers.getContractAt("EcosystemManager", hubAddress, deployer);
  
  // Connect to Fortune Pool only if address exists
  let fortunePool = null;
  if (fortuneAddress) {
      // Manual minimal ABI to avoid complex artifact dependencies
      const fortuneAbi = ["function setPrizeTier(uint256, uint128, uint64) external"];
      fortunePool = new ethers.Contract(fortuneAddress, fortuneAbi, deployer);
      console.log(`Connected to Fortune Pool at: ${fortuneAddress}`);
  }
  console.log(`Connected to Hub at: ${hubAddress}`);

  // --- 3. Load Rules from JSON ---
  const rulesConfigPath = path.join(__dirname, "../rules-config.json"); 
  if (!fs.existsSync(rulesConfigPath)) throw new Error("rules-config.json not found.");
  
  const RULES_TO_APPLY = JSON.parse(fs.readFileSync(rulesConfigPath, "utf8"));
  console.log("'rules-config.json' loaded.");

  try {
    console.log("\nInitiating rule verification and application...");

    // --- CONVERTERS ---
    // For monetary values (1 BKC = 10^18 Wei)
    const weiConverter = (value: string) => ethers.parseUnits(value, 18);
    // For pure integer values (BIPS, Quantities)
    const bigIntConverter = (value: string) => BigInt(value);
    
    // --- EXECUTE HUB RULES ---

    // A. Service Fees (Wei Values) - e.g., Notary Fee
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.serviceFees, 
        (k, v) => hub.setServiceFee(k, v), 
        weiConverter, 
        "Service Fee (BKC)"
    );

    // NOTE: 'pStakeMinimums' removed as Open Access architecture does not support gatekeeping.

    // B. Staking Fees (BIPS)
    // Both Staking Fees and AMM Taxes use 'setServiceFee' in the contract, 
    // but we use bigIntConverter because they are BIPS (100 = 1%).
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.stakingFees, 
        (k, v) => hub.setServiceFee(k, v), 
        bigIntConverter, 
        "Staking Fee (BIPS)"
    );
    
    // C. AMM Tax Fees (BIPS)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.ammTaxFees, 
        (k, v) => hub.setServiceFee(k, v), 
        bigIntConverter, 
        "AMM Tax (BIPS)"
    );

    // D. Booster Discounts (BIPS)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.boosterDiscounts, 
        (k, v) => hub.setBoosterDiscount(k, v), 
        bigIntConverter, 
        "Booster Discount (BIPS)", 
        true
    );

    // E. Mining Distribution (BIPS)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.miningDistribution, 
        (k, v) => hub.setMiningDistributionBips(k, v), 
        bigIntConverter, 
        "Mining Distribution (BIPS)"
    );

    // F. Fee Distribution (BIPS)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.feeDistribution, 
        (k, v) => hub.setFeeDistributionBips(k, v), 
        bigIntConverter, 
        "Fee Distribution (BIPS)"
    );

    // G. Fortune Pool Tiers
    if (fortunePool && RULES_TO_APPLY.fortunePoolTiers) {
        await processFortuneTiers(fortunePool, RULES_TO_APPLY.fortunePoolTiers);
    } else {
        console.log("\n⚠️ Skipping Fortune Pool Tiers (Address missing or Config empty).");
    }

    console.log("\n----------------------------------------------------");
    console.log("🎉🎉🎉 RULES UPDATE SCRIPT COMPLETE! 🎉🎉🎉");
  
  } catch (error: any) {
    console.error("\n❌ Critical failure:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}