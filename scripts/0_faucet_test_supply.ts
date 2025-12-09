// scripts/0_faucet_test_supply.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ######################################################################
// ###               CONFIGURAÇÃO DE FUNDOS DO FAUCET                 ###
// ######################################################################
// Quantidade total de BKC a ser enviada ao Faucet.
// Certifique-se de que o deployer (sua carteira) tem saldo suficiente (do TGE).
const FAUCET_TOTAL_SUPPLY_AMOUNT = ethers.parseEther("1000000"); // Exemplo: 1,000,000 BKC
// ######################################################################

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEPLOY_DELAY_MS = 2000;

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`\n🚀 (Passo 0) Financiando o Faucet na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereços ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    throw new Error("❌ Erro: 'deployment-addresses.json' não encontrado. Execute o '1_deploy_core.ts' primeiro.");
  }
  
  const addresses: { [key: string]: string } = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  const faucetAddress = addresses.faucet;
  const bkcTokenAddress = addresses.bkcToken;

  if (!faucetAddress || !bkcTokenAddress || faucetAddress.startsWith("0x...")) {
    throw new Error("❌ Erro: Endereços 'faucet' ou 'bkcToken' não configurados.");
  }

  // --- 2. Obter Instâncias dos Contratos ---
  const bkcToken = await ethers.getContractAt("BKCToken", bkcTokenAddress, deployer);

  try {
    // 3. Verificar Saldo do Deployer (TGE)
    const deployerBalance = await bkcToken.balanceOf(deployer.address);
    if (deployerBalance < FAUCET_TOTAL_SUPPLY_AMOUNT) {
      throw new Error(`❌ Saldo insuficiente! Requerido: ${ethers.formatEther(FAUCET_TOTAL_SUPPLY_AMOUNT)} BKC, Encontrado: ${ethers.formatEther(deployerBalance)} BKC. (Os tokens DEVEM vir do saldo TGE do deployer)`);
    }

    // 4. Enviar Fundos para o Faucet (Transferência do TGE)
    console.log(`\n4. Retirando do saldo TGE do deployer e transferindo ${ethers.formatEther(FAUCET_TOTAL_SUPPLY_AMOUNT)} BKC para o Faucet (${faucetAddress})...`);
    
    const tx = await bkcToken.transfer(faucetAddress, FAUCET_TOTAL_SUPPLY_AMOUNT);
    await tx.wait();
    
    console.log(`   ✅ Transferência concluída. TX Hash: ${tx.hash}`);
    await sleep(DEPLOY_DELAY_MS);
    
    // 5. Verificar Saldo do Faucet
    const finalFaucetBalance = await bkcToken.balanceOf(faucetAddress);
    console.log(`\n5. Verificação: Saldo final do Faucet: ${ethers.formatEther(finalFaucetBalance)} BKC`);
    
    if (finalFaucetBalance >= FAUCET_TOTAL_SUPPLY_AMOUNT) {
        console.log("🎉🎉🎉 FINANCIAMENTO DO FAUCET CONCLUÍDO COM SUCESSO! 🎉🎉🎉");
    } else {
        console.error("❌ AVISO: O saldo final do Faucet é menor que o esperado.");
    }
    
    // Salva o valor exato (em Wei) do suprimento inicial injetado
    addresses.faucetInitialSupplyWei = FAUCET_TOTAL_SUPPLY_AMOUNT.toString(); 
    
    fs.writeFileSync(
      addressesFilePath,
      JSON.stringify(addresses, null, 2)
    );
    console.log(`   ✅ Informação de saldo inicial do Faucet salva em 'deployment-addresses.json'.`);
    
    console.log("O Faucet está pronto para distribuir tokens para testes.");


  } catch (error: any) {
    console.error("\n❌ Falha grave no script de financiamento do Faucet:", error.message);
    process.exit(1);
  }
}

// Bloco de entrada para execução standalone (padrão Hardhat)
if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}