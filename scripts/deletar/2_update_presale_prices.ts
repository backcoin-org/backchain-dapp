// scripts/2_update_presale_prices.ts
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

// ######################################################################
// ###               CONFIGURAÇÃO DA FASE 2 DA PRÉ-VENDA              ###
// ######################################################################

/*
 * Este script ATUALIZA OS PREÇOS da pré-venda.
 * Ele chama a nova função 'updateTierPrice' e NÃO RESETA a contagem de vendas.
 */

// Defina os NOVOS PREÇOS (Fase 2) aqui - AJUSTADO PARA ARBITRUM (ETH)
// Lógica aplicada: Aumento de 50% sobre o preço da Fase 1 (Baseada em 1 ETH Diamond)
const NEW_PRICES_ETH = {
  "0": "1.5",     // Diamond (Fase 1: 1.0 -> +50%)
  "1": "0.6",     // Platinum (Fase 1: 0.4 -> +50%)
  "2": "0.225",   // Gold (Fase 1: 0.15 -> +50%)
  "3": "0.105",   // Silver (Fase 1: 0.07 -> +50%)
  "4": "0.045",   // Bronze (Fase 1: 0.03 -> +50%)
  "5": "0.015",   // Iron (Fase 1: 0.01 -> +50%)
  "6": "0.006",   // Crystal (Fase 1: 0.004 -> +50%)
};

// ######################################################################

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(
    `🚀 (GERENCIAMENTO) Atualizando preços para FASE 2 da Pré-Venda na rede: ${networkName}`
  );
  console.log(`Usando a conta (Owner): ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereços ---
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

  const saleAddress = addresses.publicSale;
  if (!saleAddress) {
    throw new Error("PublicSale address not found in JSON.");
  }

  // --- 2. Obter Contrato ---
  const saleContract = await ethers.getContractAt(
    "PublicSale",
    saleAddress,
    deployer
  );
  console.log(`Conectado ao PublicSale em: ${saleAddress}`);

  try {
    // --- 3. Processar Atualizações de Preço ---
    console.log(
      `\nIniciando atualização de preços para a Fase 2...`
    );

    for (const tierIdStr of Object.keys(NEW_PRICES_ETH)) {
      const tierId = parseInt(tierIdStr, 10);
      const newPriceETH = (NEW_PRICES_ETH as any)[tierIdStr];
      const newPriceInWei = ethers.parseEther(newPriceETH);

      console.log(`\n   -> Processando Tier ID ${tierId}...`);
      
      const currentTier = await saleContract.tiers(BigInt(tierId));
      if (!currentTier.isConfigured) {
          console.log(`      ⚠️ AVISO: Tier ${tierId} não está configurado. Pulando.`);
          continue;
      }

      console.log(`      Preço Antigo: ${ethers.formatEther(currentTier.priceInWei)} ETH`);
      console.log(`      Preço Novo:   ${newPriceETH} ETH (${newPriceInWei} Wei)`);
      console.log(`      Contagem de Vendas (MintedCount): ${currentTier.mintedCount} (NÃO SERÁ RESETADO)`);

      const tx = await saleContract.updateTierPrice(
        BigInt(tierId),
        newPriceInWei
      );
      await tx.wait();
      console.log(`   ✅ SUCESSO: Tier ${tierId} atualizado para o preço da Fase 2.`);
      await sleep(1000);
    }

    console.log("\n----------------------------------------------------");
    console.log("🎉🎉🎉 ATUALIZAÇÃO DE PREÇOS DA FASE 2 CONCLUÍDA! 🎉🎉🎉");

  } catch (error: any) {
    console.error(
      "\n❌ Falha grave durante a atualização de preços:",
      error.message
    );
    process.exit(1);
  }
}

// Bloco de entrada para execução standalone
if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}