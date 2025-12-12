import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

// ######################################################################
// ###          RULES CONTROL PANEL SCRIPT V3.1 (CORRIGIDO)           ###
// ###     IMPORTANTE: BIPS != BKC - Nao misturar conversores!        ###
// ######################################################################

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const IGNORE_KEYS = ["DESCRIPTION", "COMMENT", "SUMMARY"];

/**
 * Process rules with specified converter
 */
async function processRules(
    hub: any, 
    rules: any, 
    setter: (key: string | bigint, value: bigint) => Promise<any>, 
    converter: (value: string) => bigint,
    description: string,
    useNumericKey: boolean = false
) {
    if (!rules || Object.keys(rules).length === 0) {
        console.log(`   [SKIP] No rules for ${description}`);
        return 0;
    }
    
    let count = 0;
    
    for (const ruleKey of Object.keys(rules)) {
        if (IGNORE_KEYS.includes(ruleKey.toUpperCase())) continue;

        const valueStr = rules[ruleKey];
        if (!valueStr || String(valueStr).trim() === "") continue;
        
        try {
            const valueBigInt = converter(String(valueStr));
            const finalKey = useNumericKey ? BigInt(ruleKey) : ethers.id(ruleKey);
            
            console.log(`   -> ${ruleKey} = ${valueStr}`);
            
            const tx = await setter(finalKey, valueBigInt);
            await tx.wait();
            
            console.log(`      OK`);
            count++;
            await sleep(500);
        } catch (e: any) {
            console.error(`      ERROR: ${e.message?.slice(0, 80)}`);
        }
    }
    
    return count;
}

/**
 * Fortune Pool Tiers
 */
async function processFortuneTiers(fortunePool: any, rules: any) {
    if (!rules || !fortunePool) return;
    
    console.log("\n[FORTUNE] Setting Prize Tiers...");

    for (const tierIdStr of Object.keys(rules)) {
        if (IGNORE_KEYS.includes(tierIdStr.toUpperCase())) continue;

        const valueStr = rules[tierIdStr];
        if (!valueStr || !String(valueStr).includes(",")) continue;
        
        try {
            const [rangeStr, multStr] = String(valueStr).split(",");
            const tierId = BigInt(tierIdStr);
            const range = BigInt(rangeStr.trim());
            const multiplier = BigInt(multStr.trim());

            console.log(`   -> Tier ${tierId}: Range=1-${range}, Mult=${Number(multiplier)/10000}x`);
            
            const tx = await fortunePool.setPrizeTier(tierId, range, multiplier);
            await tx.wait();
            
            console.log(`      OK`);
            await sleep(500);
        } catch (e: any) {
            console.error(`      ERROR: ${e.message?.slice(0, 80)}`);
        }
    }
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    console.log("\n======================================================");
    console.log("     BACKCHAIN RULES MANAGER V3.1 (CORRIGIDO)");
    console.log("======================================================");
    console.log(`Network: ${networkName}`);
    console.log(`Account: ${deployer.address}`);
    console.log("------------------------------------------------------\n");

    // --- Load Addresses ---
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) throw new Error("Missing deployment-addresses.json");
    
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const hubAddress = addresses.ecosystemManager;
    const fortuneAddress = addresses.fortunePool;

    if (!hubAddress) throw new Error("EcosystemManager address not found");

    // --- Connect ---
    console.log("[CONNECT] Connecting to contracts...");
    const hub = await ethers.getContractAt("EcosystemManager", hubAddress, deployer);
    console.log(`   Hub: ${hubAddress}`);
    
    let fortunePool = null;
    if (fortuneAddress) {
        const abi = ["function setPrizeTier(uint256, uint128, uint64) external"];
        fortunePool = new ethers.Contract(fortuneAddress, abi, deployer);
        console.log(`   Fortune: ${fortuneAddress}`);
    }

    // --- Load Rules ---
    const rulesPath = path.join(__dirname, "../rules-config.json"); 
    if (!fs.existsSync(rulesPath)) throw new Error("rules-config.json not found");
    
    const RULES = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
    console.log(`\n[CONFIG] Loaded v${RULES.VERSION || 'unknown'}`);

    // --- Converters ---
    const weiConverter = (value: string) => ethers.parseUnits(value, 18);
    const bipsConverter = (value: string) => BigInt(value);

    try {
        console.log("\n======================================================");
        console.log("     APPLYING RULES");
        console.log("======================================================");

        // 1. Service Fees in BKC (Wei) - e.g., NOTARY_SERVICE
        if (RULES.serviceFeesBKC) {
            console.log("\n[FEES-BKC] Service Fees in BKC (converted to Wei):");
            await processRules(
                hub, RULES.serviceFeesBKC,
                (k, v) => hub.setServiceFee(k, v),
                weiConverter,
                "Fee BKC"
            );
        }

        // 2. Service Fees in BIPS - ALL OTHER FEES
        if (RULES.serviceFeesBIPS) {
            console.log("\n[FEES-BIPS] Service Fees in BIPS (100 = 1%):");
            await processRules(
                hub, RULES.serviceFeesBIPS,
                (k, v) => hub.setServiceFee(k, v),
                bipsConverter,  // <-- IMPORTANTE: NAO usar weiConverter!
                "Fee BIPS"
            );
        }

        // 3. Booster Discounts
        if (RULES.boosterDiscounts) {
            console.log("\n[BOOSTERS] Booster Discounts:");
            await processRules(
                hub, RULES.boosterDiscounts,
                (k, v) => hub.setBoosterDiscount(k, v),
                bipsConverter,
                "Booster",
                true // useNumericKey
            );
        }

        // 4. Mining Distribution
        if (RULES.miningDistribution) {
            console.log("\n[MINING] Mining Distribution:");
            await processRules(
                hub, RULES.miningDistribution,
                (k, v) => hub.setMiningDistributionBips(k, v),
                bipsConverter,
                "Mining Dist"
            );
        }

        // 5. Fee Distribution
        if (RULES.feeDistribution) {
            console.log("\n[FEES] Fee Distribution:");
            await processRules(
                hub, RULES.feeDistribution,
                (k, v) => hub.setFeeDistributionBips(k, v),
                bipsConverter,
                "Fee Dist"
            );
        }

        // 6. Fortune Pool Tiers
        if (fortunePool && RULES.fortunePoolTiers) {
            await processFortuneTiers(fortunePool, RULES.fortunePoolTiers);
        }

        console.log("\n======================================================");
        console.log("     COMPLETE!");
        console.log("======================================================");
        console.log("\nKey Settings Applied:");
        console.log(`   CLAIM_REWARD_FEE_BIPS = ${RULES.serviceFeesBIPS?.CLAIM_REWARD_FEE_BIPS || '?'} (${Number(RULES.serviceFeesBIPS?.CLAIM_REWARD_FEE_BIPS || 0) / 100}%)`);
        console.log(`   Booster Discounts = 7 tiers (10% - 70%)`);
        console.log("");
  
    } catch (error: any) {
        console.error("\nCRITICAL ERROR:", error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runScript(require("hardhat")).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}