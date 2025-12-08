import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ====================================================
// 🎯 ENDEREÇOS ATUALIZADOS (DO SEU ÚLTIMO DEPLOY)
// ====================================================
const OLD_FAUCET_ORIGINAL = "0x4b18A0224141F5f1Dec8a9AB38e861A3Ad77c279"; // O primeiro de todos
const NEW_FAUCET_TARGET   = "0xaaAaec50EF7BE0745aCC38E145e317a414677420"; // O QUE ACABOU DE SER CRIADO
const BKC_TOKEN           = "0x2B006d4924582010c9768B9CfE6f8cCA094Cfe3b"; 

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("👷‍♂️ Iniciando Configuração Final com:", deployer.address);

  // Interfaces
  const FAUCET_ABI = [
    "function withdrawRemainingTokens() external",
    "function withdrawNativeCurrency() external"
  ];
  const IERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address recipient, uint256 amount) external returns (bool)"
  ];

  const OldContract = new ethers.Contract(OLD_FAUCET_ORIGINAL, FAUCET_ABI, deployer);
  const Token = new ethers.Contract(BKC_TOKEN, IERC20_ABI, deployer);

  // ====================================================
  // 1. TENTATIVA DE RESGATE (Se falhar, ignoramos)
  // ====================================================
  console.log(`\n🔻 --- CHECANDO ANTIGO: ${OLD_FAUCET_ORIGINAL} ---`);
  try {
    const balOld = await Token.balanceOf(OLD_FAUCET_ORIGINAL);
    if (balOld > 0n) {
        console.log(`   Tentando resgatar ${ethers.formatEther(balOld)} BKC...`);
        // Se der erro aqui, vai para o catch e segue a vida
        const tx = await OldContract.withdrawRemainingTokens(); 
        await tx.wait();
        console.log("   ✅ Resgate OK!");
    }
  } catch (e) {
    console.log("   ⚠️  Não foi possível sacar do antigo (sem permissão). Seguindo...");
  }

  // ====================================================
  // 2. FINANCIAR O NOVO FAUCET (TOKEN + ETH)
  // ====================================================
  console.log(`\n🚀 --- FINANCIANDO NOVO: ${NEW_FAUCET_TARGET} ---`);

  // A. Enviar Tokens BKC (Da sua carteira para o Faucet)
  const myBkcBalance = await Token.balanceOf(deployer.address);
  console.log(`   Sua Carteira tem: ${ethers.formatEther(myBkcBalance)} BKC`);

  if (myBkcBalance > 0n) {
      console.log(`   💸 Enviando TUDO para o Faucet...`);
      const txToken = await Token.transfer(NEW_FAUCET_TARGET, myBkcBalance);
      await txToken.wait();
      console.log("   ✅ BKC Transferido!");
  } else {
      console.log("   ⚠️  Sua carteira está sem BKC. Abasteça o Faucet manualmente depois.");
  }

  // B. Enviar ETH (Gas para o Faucet operar)
  const ETH_AMOUNT = ethers.parseEther("0.1"); // 0.1 ETH
  const myEthBalance = await ethers.provider.getBalance(deployer.address);

  if (myEthBalance > ETH_AMOUNT) {
      console.log(`   ⛽ Enviando 0.1 ETH para o Faucet...`);
      const txEth = await deployer.sendTransaction({
          to: NEW_FAUCET_TARGET,
          value: ETH_AMOUNT
      });
      await txEth.wait();
      console.log("   ✅ ETH Transferido!");
  } else {
      console.log("   ❌ Saldo insuficiente em ETH para enviar 0.1.");
  }

  // ====================================================
  // 3. ATUALIZAR ARQUIVO JSON
  // ====================================================
  console.log("\n📝 --- ATUALIZANDO JSON ---");
  const addressPath = path.resolve(__dirname, "../deployment-addresses.json");
  
  try {
      const addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));
      addresses.faucet = NEW_FAUCET_TARGET; // Atualiza para o novo
      fs.writeFileSync(addressPath, JSON.stringify(addresses, null, 2));
      console.log(`   ✅ Arquivo atualizado com: ${NEW_FAUCET_TARGET}`);
  } catch (e) {
      console.error("   ❌ Erro ao atualizar arquivo JSON.");
  }

  // ====================================================
  // STATUS FINAL
  // ====================================================
  const finalBkc = await Token.balanceOf(NEW_FAUCET_TARGET);
  const finalEth = await ethers.provider.getBalance(NEW_FAUCET_TARGET);

  console.log("\n📊 --- STATUS FINAL ---");
  console.log(`   Faucet Ativo: ${NEW_FAUCET_TARGET}`);
  console.log(`   Saldo BKC:    ${ethers.formatEther(finalBkc)}`);
  console.log(`   Saldo ETH:    ${ethers.formatEther(finalEth)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });