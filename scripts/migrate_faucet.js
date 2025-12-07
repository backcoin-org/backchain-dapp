// scripts/migrate_faucet.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ====================================================
// ⚙️ CONFIGURAÇÃO DOS ENDEREÇOS
// ====================================================
const OLD_FAUCET_ADDRESS = "0xbdb2950dcec742619850c4E785eC249baDE34A11"; 
const NEW_FAUCET_ADDRESS = "0x4b18A0224141F5f1Dec8a9AB38e861A3Ad77c279"; 
// ====================================================

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🔄 Iniciando Migração & Abastecimento com:", deployer.address);

  // Verificar saldo do Deployer antes de começar
  const deployerBal = await ethers.provider.getBalance(deployer.address);
  console.log(`💳 Saldo do Deployer: ${ethers.formatEther(deployerBal)} ETH`);
  
  if (deployerBal < ethers.parseEther("5.1")) {
      console.warn("⚠️ ALERTA: Seu saldo pode ser insuficiente para enviar 5 ETH + Gas.");
  }

  // 1. Pegar endereço do Token BKC
  const addressPath = path.resolve(__dirname, "../deployment-addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));
  const bkcTokenAddress = addresses.bkcToken;

  // 2. Conectar aos Contratos
  const Token = await ethers.getContractAt("IERC20Upgradeable", bkcTokenAddress);
  const OldFaucet = await ethers.getContractAt("SimpleBKCFaucet", OLD_FAUCET_ADDRESS);

  // ---------------------------------------------------------
  // PARTE 1: MIGRAR TOKENS BKC
  // ---------------------------------------------------------
  console.log("\n📦 --- 1. MIGRANDO TOKENS BKC ---");
  
  const balanceOld = await Token.balanceOf(OLD_FAUCET_ADDRESS);
  console.log(`   Saldo Antigo: ${ethers.formatEther(balanceOld)} BKC`);

  if (balanceOld > 0n) {
    console.log("   🔻 Sacando Tokens do antigo...");
    try {
        const txWithdraw = await OldFaucet.withdrawRemainingTokens();
        await txWithdraw.wait();
        console.log("   ✅ Saque confirmado.");

        console.log(`   🔺 Enviando ${ethers.formatEther(balanceOld)} BKC para o Novo Faucet...`);
        const txDeposit = await Token.transfer(NEW_FAUCET_ADDRESS, balanceOld);
        await txDeposit.wait();
        console.log("   ✅ Transferência de Tokens concluída!");
    } catch (e) {
        console.error("   ❌ Falha ao migrar Tokens:", e.message);
    }
  } else {
    console.log("   ⚠️ Nenhum Token BKC para migrar.");
  }

  // ---------------------------------------------------------
  // PARTE 2: MIGRAR ETH ANTIGO + INJETAR 5 ETH NOVO
  // ---------------------------------------------------------
  console.log("\n⛽ --- 2. MIGRANDO GÁS & ABASTECENDO ---");
  
  const ethBalanceOld = await ethers.provider.getBalance(OLD_FAUCET_ADDRESS);
  console.log(`   Saldo ETH no Antigo: ${ethers.formatEther(ethBalanceOld)} ETH`);
  
  // Valor base para enviar (5 ETH do seu bolso)
  let totalEthToSend = ethers.parseEther("5.0");

  // Se tiver ETH no antigo, saca e soma ao total
  if (ethBalanceOld > 0n) {
    console.log("   🔻 Sacando ETH do antigo...");
    try {
        const txEthWithdraw = await OldFaucet.withdrawNativeCurrency();
        await txEthWithdraw.wait();
        console.log("   ✅ ETH resgatado com sucesso.");
        
        // Adiciona o que foi resgatado ao montante de 5 ETH
        totalEthToSend = totalEthToSend + ethBalanceOld;
    } catch (e) {
        console.error("   ❌ Erro ao sacar ETH antigo:", e.message);
    }
  }

  console.log(`   🔺 Enviando TOTAL de ${ethers.formatEther(totalEthToSend)} ETH para o Novo Faucet...`);
  console.log(`      (5.0 ETH do Deployer + ${ethers.formatEther(ethBalanceOld)} ETH resgatados)`);

  const txEthDeposit = await deployer.sendTransaction({
      to: NEW_FAUCET_ADDRESS,
      value: totalEthToSend
  });
  await txEthDeposit.wait();
  console.log("   ✅ Novo Faucet abastecido com sucesso!");

  // ---------------------------------------------------------
  // RESUMO FINAL
  // ---------------------------------------------------------
  console.log("\n📊 --- RESUMO NOVO CONTRATO ---");
  const newBalToken = await Token.balanceOf(NEW_FAUCET_ADDRESS);
  const newBalEth = await ethers.provider.getBalance(NEW_FAUCET_ADDRESS);
  
  console.log(`🏛️  Endereço: ${NEW_FAUCET_ADDRESS}`);
  console.log(`📦 Saldo BKC: ${ethers.formatEther(newBalToken)}`);
  console.log(`⛽ Saldo ETH: ${ethers.formatEther(newBalEth)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });