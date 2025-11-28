// scripts/manage_rules.ts
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
 * Função robusta para processar categorias do EcosystemManager (Hub)
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
        // Ignora chaves de comentário
        if (DESCRIPTION_KEYS.includes(ruleKey.toUpperCase())) continue;

        const valueStr = rules[ruleKey];
        if (valueStr && valueStr.trim() !== "") {
            try {
                // Converte o valor (Wei ou Inteiro)
                const valueBigInt = converter(valueStr);
                
                let finalKey: string | bigint;
                
                // Define se a chave é String (Hash) ou Número (Booster)
                if (isBoosterDiscount) {
                    finalKey = converter(ruleKey); 
                } else {
                    finalKey = ethers.id(ruleKey); 
                }
                
                console.log(`   -> UPDATING ${description} [${ruleKey}] to ${valueStr}...`);
                
                // Executa a transação
                const tx = await setter(finalKey, valueBigInt);
                await tx.wait();
                
                console.log("   ✅ SUCCESS.");
                await sleep(500); // Pausa para evitar rate limit do RPC
            } catch (e: any) {
                 console.error(`   ❌ ERROR applying rule [${ruleKey}]: ${e.message}`);
                 // Não aborta o script, apenas loga o erro
            }
        }
    }
}

/**
 * Função ESPECIAL para os Tiers do Fortune Pool (ID -> Chance,Multiplier)
 */
async function processFortuneTiers(fortunePool: any, rules: any) {
    if (!rules || !fortunePool) return;
    
    console.log("\n🎰 Processing Fortune Pool Tiers...");

    for (const tierIdStr of Object.keys(rules)) {
        if (DESCRIPTION_KEYS.includes(tierIdStr.toUpperCase())) continue;

        const valueStr = rules[tierIdStr]; // Formato esperado: "3,20000"
        if (valueStr && valueStr.includes(",")) {
            try {
                const [chanceStr, multStr] = valueStr.split(",");
                const tierId = BigInt(tierIdStr);
                const chance = BigInt(chanceStr.trim());
                const multiplier = BigInt(multStr.trim());

                console.log(`   -> SETTING Tier ${tierId}: Chance 1/${chance}, Mult ${multiplier} BIPS...`);
                
                // ABI: setPrizeTier(uint256 _tierId, uint128 _chanceDenominator, uint64 _multiplierBips)
                const tx = await fortunePool.setPrizeTier(tierId, chance, multiplier);
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

  // --- 1. Carregar Endereços ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) throw new Error("Missing deployment-addresses.json");
  
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
  const hubAddress = addresses.ecosystemManager;
  const fortuneAddress = addresses.fortunePool; // Pega o endereço do jogo

  if (!hubAddress) throw new Error("EcosystemManager address not found in JSON.");

  // --- 2. Conectar aos Contratos ---
  const hub = await ethers.getContractAt("EcosystemManager", hubAddress, deployer);
  
  // Conecta ao Fortune Pool apenas se o endereço existir no JSON
  let fortunePool = null;
  if (fortuneAddress) {
      // Interface manual mínima para evitar dependência de artifacts complexos
      const fortuneAbi = ["function setPrizeTier(uint256, uint128, uint64) external"];
      fortunePool = new ethers.Contract(fortuneAddress, fortuneAbi, deployer);
      console.log(`Connected to Fortune Pool at: ${fortuneAddress}`);
  }
  console.log(`Connected to Hub at: ${hubAddress}`);

  // --- 3. Carregar Regras do JSON ---
  const rulesConfigPath = path.join(__dirname, "../rules-config.json"); 
  if (!fs.existsSync(rulesConfigPath)) throw new Error("rules-config.json not found.");
  
  const RULES_TO_APPLY = JSON.parse(fs.readFileSync(rulesConfigPath, "utf8"));
  console.log("'rules-config.json' loaded.");

  try {
    console.log("\nInitiating rule verification and application...");

    // --- CONVERSORES ---
    // Para valores monetários (1 BKC = 10^18 Wei)
    const weiConverter = (value: string) => ethers.parseUnits(value, 18);
    // Para valores inteiros puros (BIPS, pStake simples)
    const bigIntConverter = (value: string) => BigInt(value);
    
    // --- EXECUÇÃO DAS REGRAS DO HUB ---

    // A. Service Fees (Usa Wei Converter)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.serviceFees, 
        (k, v) => hub.setServiceFee(k, v), 
        weiConverter, 
        "Service Fee (BKC)"
    );

    // B. pStake Minimum (Usa BigInt Converter - CORREÇÃO CRÍTICA MANTIDA)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.pStakeMinimums, 
        (k, v) => hub.setPStakeMinimum(k, v), 
        bigIntConverter, 
        "pStake Minimum"
    );

    // C. Staking Fees (BIPS)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.stakingFees, 
        (k, v) => hub.setServiceFee(k, v), 
        bigIntConverter, 
        "Staking Fee (BIPS)"
    );
    
    // D. AMM Tax Fees (BIPS)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.ammTaxFees, 
        (k, v) => hub.setServiceFee(k, v), 
        bigIntConverter, 
        "AMM Tax (BIPS)"
    );

    // E. Booster Discounts (BIPS)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.boosterDiscounts, 
        (k, v) => hub.setBoosterDiscount(k, v), 
        bigIntConverter, 
        "Booster Discount (BIPS)", 
        true
    );

    // F. Mining Distribution (BIPS)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.miningDistribution, 
        (k, v) => hub.setMiningDistributionBips(k, v), 
        bigIntConverter, 
        "Mining Distribution (BIPS)"
    );

    // G. Fee Distribution (BIPS)
    await processRuleCategory(
        hub, 
        RULES_TO_APPLY.feeDistribution, 
        (k, v) => hub.setFeeDistributionBips(k, v), 
        bigIntConverter, 
        "Fee Distribution (BIPS)"
    );

    // H. Fortune Pool Tiers (Novidade!)
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