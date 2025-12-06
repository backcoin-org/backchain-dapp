// scripts/force_oracle_fee.ts
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Endereço e Taxa Definidos
  const ORACLE_ADDRESS = "0xd7e622124b78a28c4c928b271fc9423285804f98";
  const NEW_ORACLE_FEE = ethers.parseEther("0.00035"); 

  console.log(`🔑 Sincronizando FortunePool com Admin: ${deployer.address}`);

  // 1. Carregar Endereços
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) throw new Error("Arquivo de endereços não encontrado.");
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  const fortunePoolAddress = addresses.fortunePool;
  if (!fortunePoolAddress) throw new Error("FortunePool address not found.");

  // ABI Mínima: setOracleFee, setOracleAddress, oracleFeeInWei
  const abi = [
    "function setOracleFee(uint256 _feeInWei) external", 
    "function setOracleAddress(address _oracle) external",
    "function oracleFeeInWei() view returns (uint256)",
    "function oracleAddress() view returns (address)"
  ];
  const fortunePool = await ethers.getContractAt(abi as any, fortunePoolAddress, deployer);

  // 2. Definir Endereço do Oráculo
  const currentAddr = await fortunePool.oracleAddress();
  if (currentAddr.toLowerCase() !== ORACLE_ADDRESS.toLowerCase()) {
      console.log(`   ⚙️ Definindo Endereço do Oráculo para: ${ORACLE_ADDRESS}...`);
      await (await fortunePool.setOracleAddress(ORACLE_ADDRESS)).wait();
  } else {
      console.log(`   ✅ Endereço do Oráculo já está correto.`);
  }


  // 3. Definir Nova Taxa (0.00035 ETH)
  const currentFee = await fortunePool.oracleFeeInWei();
  console.log(`   Taxa Atual: ${ethers.formatEther(currentFee)} ETH`);
  
  if (currentFee !== NEW_ORACLE_FEE) {
      console.log(`   ⚙️ Definindo nova Taxa para: 0.00035 ETH...`);
      const tx = await fortunePool.setOracleFee(NEW_ORACLE_FEE);
      await tx.wait();
      console.log("   ✅ SUCESSO! Taxa e Endereço do Oráculo atualizados.");
  } else {
      console.log("   ✅ A taxa já está correta (0.00035 ETH).");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});