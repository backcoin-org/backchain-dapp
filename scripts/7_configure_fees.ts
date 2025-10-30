// scripts/7_configure_fees.ts
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const CONFIG_DELAY_MS = 1500; // 1.5-second delay

// --- ⚙️ CONFIGURAÇÃO DE SERVIÇOS (TAXAS) ---
// Defina todas as suas taxas e requisitos de pStake aqui.
// Ajuste-os à sua tokenomics.

const SERVICE_SETTINGS = {
  // --- DecentralizedNotary ---
  NOTARY_FEE: ethers.parseUnits("100", 18), // 100 BKC
  NOTARY_SERVICE_PSTAKE: 1000, // Requer 1000 pStake

  // --- FortuneTiger (Actions) ---
  ACTION_CREATE_FEE: ethers.parseUnits("50", 18), // 50 BKC para criar
  ACTION_CREATE_PSTAKE: 500, // Requer 500 pStake
  ACTION_PARTICIPATE_FEE: ethers.parseUnits("5", 18), // 5 BKC para participar
  ACTION_PARTICIPATE_PSTAKE: 0, // 0 pStake para participar

  // Distribuição do Pote (BIPS - Base 10000)
  ACTION_SPORT_WINNER_BIPS: 7000, // 70% ao vencedor
  ACTION_SPORT_CREATOR_BIPS: 1000, // 10% ao criador
  ACTION_SPORT_DELEGATOR_BIPS: 1500, // 15% aos delegadores
  ACTION_SPORT_TREASURY_BIPS: 500, // 5% à tesouraria

  ACTION_CAUSE_BIPS: 8000, // 80% para a causa (beneficiário)
  ACTION_CAUSE_CREATOR_BIPS: 500, // 5% ao criador
  ACTION_CAUSE_DELEGATOR_BIPS: 1000, // 10% aos delegadores
  ACTION_CAUSE_TREASURY_BIPS: 500, // 5% à tesouraria

  // --- Taxas do DelegationManager ---
  UNSTAKE_FEE_BIPS: 100, // 1% de taxa
  FORCE_UNSTAKE_PENALTY_BIPS: 2500, // 25% de penalidade
  CLAIM_REWARD_FEE_BIPS: 50, // 0.5% de taxa

  // --- NFTLiquidityPool (Sua configuração 4/4/2) ---
  NFT_POOL_ACCESS_PSTAKE: 100, // Requer 100 pStake para negociar
  NFT_POOL_TAX_BIPS: 1000, // 10% de taxa base (1000 BIPS)
  NFT_POOL_TAX_TREASURY_SHARE_BIPS: 4000, // 40% da taxa (vai 4% do total para Tesouraria)
  NFT_POOL_TAX_DELEGATOR_SHARE_BIPS: 4000, // 40% da taxa (vai 4% do total para Delegadores)
  NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS: 2000, // 20% da taxa (vai 2% do total para Liquidez)
};
// --- Fim da Configuração ---

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Passo 7/8) Configurando Taxas e Regras do Sistema na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereços ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    console.error("❌ Erro: 'deployment-addresses.json' não encontrado.");
    process.exit(1);
  }
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  if (!addresses.ecosystemManager) {
      console.error("❌ Erro: 'ecosystemManager' não encontrado.");
      process.exit(1);
  }

  // --- 2. Obter Instância do Hub ---
  const ecosystemManager = await ethers.getContractAt(
    "EcosystemManager",
    addresses.ecosystemManager,
    deployer
  );

  try {
    // --- 3. Definir Todas as Taxas e Requisitos de pStake ---
    console.log("Configurando todas as taxas do sistema e mínimos de pStake...");

    // Notary
    await setService(
      ecosystemManager,
      "NOTARY_SERVICE", // Chave de serviço unificada
      SERVICE_SETTINGS.NOTARY_FEE,
      SERVICE_SETTINGS.NOTARY_SERVICE_PSTAKE
    );

    // FortuneTiger Create
    await setService(
      ecosystemManager,
      "ACTION_CREATE_SERVICE",
      SERVICE_SETTINGS.ACTION_CREATE_FEE,
      SERVICE_SETTINGS.ACTION_CREATE_PSTAKE
    );

    // FortuneTiger Participate
    await setService(
      ecosystemManager,
      "ACTION_PARTICIPATE_SERVICE",
      SERVICE_SETTINGS.ACTION_PARTICIPATE_FEE,
      SERVICE_SETTINGS.ACTION_PARTICIPATE_PSTAKE
    );
    
    // Distribuição do Pote FortuneTiger
    await setFee(ecosystemManager, "ACTION_SPORT_WINNER_BIPS", SERVICE_SETTINGS.ACTION_SPORT_WINNER_BIPS);
    await setFee(ecosystemManager, "ACTION_SPORT_CREATOR_BIPS", SERVICE_SETTINGS.ACTION_SPORT_CREATOR_BIPS);
    await setFee(ecosystemManager, "ACTION_SPORT_DELEGATOR_BIPS", SERVICE_SETTINGS.ACTION_SPORT_DELEGATOR_BIPS);
    await setFee(ecosystemManager, "ACTION_SPORT_TREASURY_BIPS", SERVICE_SETTINGS.ACTION_SPORT_TREASURY_BIPS);
    await setFee(ecosystemManager, "ACTION_CAUSE_BIPS", SERVICE_SETTINGS.ACTION_CAUSE_BIPS);
    await setFee(ecosystemManager, "ACTION_CAUSE_CREATOR_BIPS", SERVICE_SETTINGS.ACTION_CAUSE_CREATOR_BIPS);
    await setFee(ecosystemManager, "ACTION_CAUSE_DELEGATOR_BIPS", SERVICE_SETTINGS.ACTION_CAUSE_DELEGATOR_BIPS);
    await setFee(ecosystemManager, "ACTION_CAUSE_TREASURY_BIPS", SERVICE_SETTINGS.ACTION_CAUSE_TREASURY_BIPS);
    
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
    
  } catch (error) {
    console.error("❌ Falha na configuração das taxas (Passo 7):", error);
    process.exit(1);
  }

  console.log("\n🎉🎉🎉 TAXAS E REGRAS DO HUB CONFIGURADAS COM SUCESSO! 🎉🎉🎉");
  console.log("O sistema está pronto para a venda.");
  console.log("\nPróximo passo: Aguarde o fim da pré-venda e execute '8_add_liquidity.ts'.");
}

// --- Funções Auxiliares ---

async function setFee(manager: any, key: string, value: number | bigint) {
  try {
    const tx = await manager.setFee(key, value);
    await tx.wait();
    console.log(`   -> Taxa definida: ${key} = ${value.toString()}`);
    await sleep(CONFIG_DELAY_MS / 2); // Delay menor
  } catch (e: any) {
    console.error(`   ❌ FALHA ao definir taxa: ${key}. Razão: ${e.message}`);
    throw e; // Interrompe o script
  }
}

async function setPStake(manager: any, key: string, value: number) {
  try {
    const tx = await manager.setPStakeMinimum(key, value);
    await tx.wait();
    console.log(`   -> pStake definido: ${key} = ${value}`);
    await sleep(CONFIG_DELAY_MS / 2);
  } catch (e: any) {
    console.error(`   ❌ FALHA ao definir pStake: ${key}. Razão: ${e.message}`);
    throw e;
  }
}

// Simplificado: A chave de serviço agora é usada para taxa e pStake
async function setService(manager: any, serviceKey: string, feeValue: number | bigint, pStakeValue: number) {
    console.log(`\nConfigurando Serviço: ${serviceKey}...`);
    await setFee(manager, serviceKey, feeValue);
    await setPStake(manager, serviceKey, pStakeValue);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});