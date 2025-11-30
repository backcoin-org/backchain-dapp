// scripts/set_oracle_fee.ts
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`🔑 Configurando Taxa do Oráculo com: ${deployer.address}`);

  // 1. Carregar Endereços
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) throw new Error("Arquivo de endereços não encontrado.");
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  const fortunePoolAddress = addresses.fortunePool;
  if (!fortunePoolAddress) throw new Error("FortunePool address not found.");

  // 2. Conectar ao Contrato
  // ABI Mínima para setar a taxa
  const abi = ["function setOracleFee(uint256 _feeInWei) external", "function oracleFeeInWei() view returns (uint256)"];
  const fortunePool = await ethers.getContractAt(abi as any, fortunePoolAddress, deployer);

  // 3. Verificar Taxa Atual
  const currentFee = await fortunePool.oracleFeeInWei();
  console.log(`   Taxa Atual: ${ethers.formatEther(currentFee)} ETH`);

  // 4. Definir Nova Taxa (0.001 ETH)
  const newFee = ethers.parseEther("0.001");
  
  if (currentFee == newFee) {
      console.log("   ✅ A taxa já está correta (0.001 ETH).");
      return;
  }

  console.log(`   ⚙️ Definindo nova taxa para: 0.001 ETH...`);
  const tx = await fortunePool.setOracleFee(newFee);
  await tx.wait();

  console.log("   ✅ SUCESSO! Taxa do Oráculo atualizada.");
  console.log("   Agora o Frontend (0.001) e o Contrato (0.001) estão sincronizados.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});