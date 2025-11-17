// scripts/manage_rules.ts
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

// ######################################################################
// ###               RULES CONTROL PANEL SCRIPT                     ###
// ######################################################################

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DESCRIPTION_KEYS = ["DESCRIPTION", "COMMENT"]; // Keys to ignore in JSON

/**
 * Robust helper function to process each rule category.
 * Ensures only valid keys are passed to the contract.
 */
async function processRuleCategory(
    hub: any, 
    rules: any, 
    setter: (key: string | bigint, value: bigint) => Promise<any>, 
    converter: (value: string) => bigint,
    description: string,
    isBoosterDiscount: boolean = false
) {
    if (!rules) {
        console.log(`   -> Skipping category ${description} (not found in rules-config.json)`);
        return;
    }
    
    for (const ruleKey of Object.keys(rules)) {
        // Ignore comment keys (case-insensitive)
        if (DESCRIPTION_KEYS.includes(ruleKey.toUpperCase())) continue;

        const valueStr = rules[ruleKey];
        if (valueStr && valueStr.trim() !== "") {
            try {
                // For booster discounts, the key is also a BigInt (the boostBips)
                const keyForContract = isBoosterDiscount ? converter(ruleKey) : ruleKey;
                const valueBigInt = converter(valueStr);
                
                console.log(`   -> UPDATING ${description} [${ruleKey}] to ${valueStr}...`);
                
                // Call the setter function
                const tx = await setter(keyForContract, valueBigInt);
                await tx.wait();
                
                console.log("   ✅ SUCCESS.");
                await sleep(1000);
            } catch (e: any) {
                 console.error(`   ❌ ERROR applying rule [${ruleKey}]: ${e.message}`);
                 // We throw to stop execution and notify the user
                 throw new Error(`Failed on rule update ${ruleKey}: ${e.message}`);
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
  console.log(`Using account (Owner/MultiSig): ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Load Hub Address ---
  const addressesFilePath = path.join(
    __dirname,
    "../deployment-addresses.json"
  );
  if (!fs.existsSync(addressesFilePath)) {
    throw new Error("Missing deployment-addresses.json");
  }
  const addresses: { [key: string]: string } = JSON.parse(
    fs.readFileSync(addressesFilePath, "utf8")
  );

  const hubAddress = addresses.ecosystemManager;
  if (!hubAddress) {
    throw new Error("EcosystemManager address not found in JSON.");
  }

  // --- 2. Get Hub Instance ---
  const hub = await ethers.getContractAt(
    "EcosystemManager",
    hubAddress,
    deployer
  );
  console.log(`Connected to Hub (EcosystemManager) at: ${hubAddress}`);

  // --- 3. Load Rules from JSON ---
  const rulesConfigPath = path.join(__dirname, "../rules-config.json"); 
  if (!fs.existsSync(rulesConfigPath)) {
    throw new Error("File 'rules-config.json' not found in project root.");
  }
  const RULES_TO_APPLY = JSON.parse(fs.readFileSync(rulesConfigPath, "utf8"));
  console.log("'rules-config.json' loaded.");


  try {
    // --- 4. Process Updates ---
    console.log("\nInitiating rule verification and application...");

    // Value converters (to ensure correct typing)
    const weiConverter = (value: string) => {
        if (!/^\d+(\.\d+)?$/.test(value) && value !== "0") {
            throw new Error(`Non-numeric value ('${value}') for Wei conversion.`);
        }
        return ethers.parseUnits(value, 18);
    };
    const bigIntConverter = (value: string) => BigInt(value);
    
    // A. Service Fees (Value in Wei) - Calls setServiceFee
    await processRuleCategory(hub, RULES_TO_APPLY.serviceFees, hub.setServiceFee, weiConverter, "Service Fee (BKC)");

    // B. pStake Minimum (Value BigInt) - Calls setPStakeMinimum
    await processRuleCategory(hub, RULES_TO_APPLY.pStakeMinimums, hub.setPStakeMinimum, bigIntConverter, "pStake Minimum");

    // C. Staking Fees (Value in BIPS) - Calls setServiceFee
    await processRuleCategory(hub, RULES_TO_APPLY.stakingFees, hub.setServiceFee, bigIntConverter, "Staking Fee (BIPS)");
    
    // D. AMM Tax Fees (Value in BIPS) - Calls setServiceFee
    await processRuleCategory(hub, RULES_TO_APPLY.ammTaxFees, hub.setServiceFee, bigIntConverter, "AMM Tax (BIPS)");

    // E. Booster Discounts (Key & Value in BIPS) - Calls setBoosterDiscount
    await processRuleCategory(hub, RULES_TO_APPLY.boosterDiscounts, hub.setBoosterDiscount, bigIntConverter, "Booster Discount (BIPS)", true);

    // F. Mining Distribution (Value in BIPS) - Calls setMiningDistributionBips
    await processRuleCategory(hub, RULES_TO_APPLY.miningDistribution, hub.setMiningDistributionBips, bigIntConverter, "Mining Distribution (BIPS)");

    // G. Fee Distribution (Value in BIPS) - Calls setFeeDistributionBips (NEW)
    await processRuleCategory(hub, RULES_TO_APPLY.feeDistribution, hub.setFeeDistributionBips, bigIntConverter, "Fee Distribution (BIPS)");

    console.log("\n----------------------------------------------------");
    console.log("🎉🎉🎉 RULES UPDATE SCRIPT COMPLETE! 🎉🎉🎉");
  
  } catch (error: any) {
    console.error(
      "\n❌ Critical failure during rules update:",
      error.message
    );
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