// scripts/7_configure_fees.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const CONFIG_DELAY_MS = 1500; // 1.5-second delay

// ######################################################################
// ###               CONFIGURAÇÃO MANUAL DO JOGO E FUNDOS              ###
// ######################################################################

// ====================================================================
// =================== INÍCIO DA MODIFICAÇÃO (4 PISCINAS) ===================
// ====================================================================

// --- Liquidez Inicial Solicitada (MODIFICADA PARA 4 PISCINAS) ---
const LIQUIDITY_CONFIG = [
    // Piscinas Antigas (Contribuição ajustada)
    { 
        poolId: 0, 
        multiplier: 10, 
        chanceDenominator: 10, // 10% de chance
        bipsContribution: 2000, // 20% da contribuição
        amount: ethers.parseEther("100000") // 100K BKC
    },
    { 
        poolId: 1, 
        multiplier: 100, 
        chanceDenominator: 100, // 1% de chance
        bipsContribution: 700, // 7% da contribuição
        amount: ethers.parseEther("500000") // 500K BKC
    },
    { 
        poolId: 2, 
        multiplier: 1000, 
        chanceDenominator: 1000, // 0.1% de chance
        bipsContribution: 300, // 3% da contribuição
        amount: ethers.parseEther("1000000") // 1M BKC
    },
    
    // --- SUA NOVA PISCINA (Pool 3) ---
    { 
      poolId: 3, 
      multiplier: 4, // Multiplicador 4x (como solicitado)
      chanceDenominator: 4, // 1 em 4 = 25% de chance (como solicitado)
      bipsContribution: 7000, // Recebe 70% dos fundos (fração adequada para alta frequência)
      amount: ethers.parseEther("20000") // 20K BKC de liquidez inicial (como solicitado)
    }
];
// Total BIPS = 2000 + 700 + 300 + 7000 = 10000 BIPS (100%)
const TOTAL_INITIAL_LIQUIDITY = LIQUIDITY_CONFIG.reduce((sum, pool) => sum + pool.amount, 0n);

// ==================================================================
// =================== FIM DA MODIFICAÇÃO ===========================
// ==================================================================


// --- CONFIGURAÇÃO DE SERVIÇOS (TAXAS) ---
const SERVICE_SETTINGS = {
  // --- DecentralizedNotary ---
  NOTARY_FEE: ethers.parseUnits("100", 18), // 100 BKC
  NOTARY_SERVICE_PSTAKE: 10000, // Requer 10,000 pStake (AJUSTADO)

  // --- NOVO: TIGER GAME SERVICE ---
  TIGER_GAME_SERVICE_FEE: 0, 
  TIGER_GAME_SERVICE_PSTAKE: 10000, // Requer 10,000 pStake (AJUSTADO)

  // --- Taxas do DelegationManager ---
  UNSTAKE_FEE_BIPS: 100, // 1% (MANTIDO)
  FORCE_UNSTAKE_PENALTY_BIPS: 5000, // 50% (AJUSTADO)
  CLAIM_REWARD_FEE_BIPS: 50, // 0.5%

  // --- NFTLiquidityPool ---
  NFT_POOL_ACCESS_PSTAKE: 10000, // Requer 10,000 pStake (AJUSTADO)
  NFT_POOL_TAX_BIPS: 1000, // 10%
  NFT_POOL_TAX_TREASURY_SHARE_BIPS: 4000, // 40% da taxa
  NFT_POOL_TAX_DELEGATOR_SHARE_BIPS: 4000, // 40% da taxa
  NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS: 2000, // 20% da taxa
};
// ######################################################################

// A FUNÇÃO PRINCIPAL É AGORA EXPORTADA
export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Passo 7/8) Configurando Game, Liquidez e Regras do Sistema na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereços ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    console.error("❌ Erro: 'deployment-addresses.json' não encontrado.");
    throw new Error("Missing deployment-addresses.json");
  }
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  if (!addresses.ecosystemManager || !addresses.fortuneTiger || !addresses.bkcToken) {
      console.error("❌ Erro: 'ecosystemManager', 'fortuneTiger', ou 'bkcToken' não encontrado.");
      throw new Error("Missing ecosystemManager, fortuneTiger, or bkcToken address in JSON.");
  }

  // --- 2. Obter Instâncias dos Contratos ---
  const ecosystemManager = await ethers.getContractAt(
    "EcosystemManager",
    addresses.ecosystemManager,
    deployer
  );
  const fortuneTiger = await ethers.getContractAt(
    "FortuneTiger",
    addresses.fortuneTiger,
    deployer
  );
  const bkcToken = await ethers.getContractAt(
    "BKCToken",
    addresses.bkcToken,
    deployer
  );


  try {
    // ##############################################################
    // --- PARTE A: CONFIGURAÇÃO E LIQUIDEZ DO TIGER GAME ---
    // ##############################################################
    console.log("\n--- Parte A: Configuração e Liquidez do Tiger Game ---");

    // 2a. Aprovando BKC para o FortuneTiger (para a liquidez inicial)
    console.log(`1. Aprovando ${ethers.formatEther(TOTAL_INITIAL_LIQUIDITY)} $BKC para o FortuneTiger...`);
    let tx = await bkcToken.approve(addresses.fortuneTiger, TOTAL_INITIAL_LIQUIDITY);
    await tx.wait();
    console.log("   ✅ Aprovação do BKC bem-sucedida.");

    // 2b. Configurando as Piscinas (Multiplicadores, Chances e Contribuição)
    console.log("\n2. Configurando as 4 piscinas de prêmios (com a nova distribuição)...");
    
    // Garante que a ordem está correta para os IDs (0, 1, 2, 3)
    const sortedConfig = LIQUIDITY_CONFIG.sort((a, b) => a.poolId - b.poolId);

    const multipliers = sortedConfig.map(c => c.multiplier);
    const denominators = sortedConfig.map(c => c.chanceDenominator);
    const bips = sortedConfig.map(c => c.bipsContribution);

    tx = await fortuneTiger.setPools(multipliers, denominators, bips);
    await tx.wait();
    console.log("   ✅ setPools (Regras de Sorteio e Contribuição) concluído.");


    // 2c. Adicionando Liquidez Inicial Pool por Pool
    console.log("\n3. Adicionando liquidez inicial às 4 piscinas...");
    for (const pool of sortedConfig) { // Usa a config ordenada
        tx = await fortuneTiger.addInitialLiquidity(pool.poolId, pool.amount);
        await tx.wait();
        console.log(`   ✅ Pool x${pool.multiplier} (ID ${pool.poolId}) financiada com ${ethers.formatEther(pool.amount)} $BKC.`);
    }
    console.log(`   Total de liquidez adicionada: ${ethers.formatEther(TOTAL_INITIAL_LIQUIDITY)} $BKC.`);
    console.log("----------------------------------------------------");


    // ##############################################################
    // --- PARTE B: CONFIGURAÇÃO DE TAXAS DO HUB ---
    // ##############################################################
    console.log("\n--- Parte B: Configuração de Taxas do Hub (Regras Atualizadas) ---");
    console.log("Configurando todas as taxas do sistema e mínimos de pStake...");

    // Notary
    await setService(
      ecosystemManager,
      "NOTARY_SERVICE",
      SERVICE_SETTINGS.NOTARY_FEE,
      SERVICE_SETTINGS.NOTARY_SERVICE_PSTAKE
    );

    // NOVO: Tiger Game Service 
    await setService(
        ecosystemManager,
        "TIGER_GAME_SERVICE",
        SERVICE_SETTINGS.TIGER_GAME_SERVICE_FEE, 
        SERVICE_SETTINGS.TIGER_GAME_SERVICE_PSTAKE
    );
    
    // Taxas do DelegationManager
    await setFee(ecosystemManager, "UNSTAKE_FEE_BIPS", SERVICE_SETTINGS.UNSTAKE_FEE_BIPS);
    await setFee(ecosystemManager, "FORCE_UNSTAKE_PENALTY_BIPS", SERVICE_SETTINGS.FORCE_UNSTAKE_PENALTY_BIPS);
    await setFee(ecosystemManager, "CLAIM_REWARD_FEE_BIPS", SERVICE_SETTINGS.CLAIM_REWARD_FEE_BIPS);
    
    // NFTLiquidityPool
    await setService(
      ecosystemManager,
      "NFT_POOL_ACCESS",
      0, // Taxa de acesso é 0, apenas checa pStake
      SERVICE_SETTINGS.NFT_POOL_ACCESS_PSTAKE
    );
    await setFee(ecosystemManager, "NFT_POOL_TAX_BIPS", SERVICE_SETTINGS.NFT_POOL_TAX_BIPS);
    await setFee(ecosystemManager, "NFT_POOL_TAX_TREASURY_SHARE_BIPS", SERVICE_SETTINGS.NFT_POOL_TAX_TREASURY_SHARE_BIPS);
    await setFee(ecosystemManager, "NFT_POOL_TAX_DELEGATOR_SHARE_BIPS", SERVICE_SETTINGS.NFT_POOL_TAX_DELEGATOR_SHARE_BIPS);
    await setFee(ecosystemManager, "NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS", SERVICE_SETTINGS.NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS);

    console.log("\n✅ Todas as regras do sistema foram configuradas no Hub.");
    console.log("----------------------------------------------------");
    
  } catch (error: any) {
    console.error("❌ Falha na configuração das taxas (Passo 7):", error.message);
    throw error;
  }

  console.log("\n🎉🎉🎉 CONFIGURAÇÃO DO TIGER GAME E REGRAS CONCLUÍDA! 🎉🎉🎉");
  console.log("O sistema está pronto para a venda.");
  console.log("\nPróximo passo: Execute '8_add_liquidity.ts'");
}

// --- Funções Auxiliares (Não Modificadas) ---

async function setFee(manager: any, key: string, value: number | bigint) {
  try {
    const tx = await manager.setFee(key, value);
    await tx.wait();
    console.log(`   -> Taxa definida: ${key} = ${value.toString()}`);
    await sleep(CONFIG_DELAY_MS / 2); 
  } catch (e: any) {
    throw e; 
  }
}

async function setPStake(manager: any, key: string, value: number) {
  try {
    const tx = await manager.setPStakeMinimum(key, value);
    await tx.wait();
    console.log(`   -> pStake definido: ${key} = ${value}`);
    await sleep(CONFIG_DELAY_MS / 2);
  } catch (e: any) {
    throw e;
  }
}

// Simplificado: A chave de serviço agora é usada para taxa e pStake
async function setService(manager: any, serviceKey: string, feeValue: number | bigint, pStakeValue: number) {
    console.log(`\nConfigurando Serviço: ${serviceKey}...`);
    await setFee(manager, serviceKey, feeValue);
    await setPStake(manager, serviceKey, pStakeValue);
}