import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Implantando PublicSale com a conta:", deployer.address);
  
  // Lendo o arquivo de endereços
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  // --- CORREÇÃO: Lendo os endereços corretos do arquivo ---
  const nftContractAddress = addresses.rewardBoosterNFT;
  const ecosystemManagerAddress = addresses.ecosystemManager; // <-- O endereço do Hub/Manager
  
  if (!nftContractAddress || !ecosystemManagerAddress) {
    console.error("❌ Erro: 'rewardBoosterNFT' ou 'ecosystemManager' não encontrados em deployment-addresses.json.");
    return;
  }

  // --- REMOVIDO ---
  // O treasuryAddress não é mais necessário aqui, 
  // pois o contrato o buscará do EcosystemManager[cite: 155, 156].

  console.log(`Usando RewardBoosterNFT em: ${nftContractAddress}`);
  console.log(`Usando EcosystemManager em: ${ecosystemManagerAddress}`);

  // --- CORREÇÃO: Passando os argumentos corretos para o construtor  ---
  const publicSale = await hre.ethers.deployContract("PublicSale", [
    nftContractAddress,       // 1. _rewardBoosterAddress
    ecosystemManagerAddress,  // 2. _ecosystemManagerAddress
    deployer.address,         // 3. _initialOwner (o dono do contrato)
  ]);

  await publicSale.waitForDeployment();
  console.log(`✅ Contrato PublicSale implantado em: ${publicSale.target}`);

  // Adicionando o novo endereço e salvando o arquivo
  addresses.publicSale = publicSale.target;
  fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
  console.log("✅ Endereço do PublicSale salvo em deployment-addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});