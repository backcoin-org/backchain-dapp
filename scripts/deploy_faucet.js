// scripts/deploy_faucet.js
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying SimpleBKCFaucet with account:", deployer.address);

  // 1. Ler o endereço do BKC Token do arquivo JSON existente
  const addressPath = path.resolve(__dirname, "../deployment-addresses.json"); // Ajuste o caminho se necessário
  let addresses = {};
  
  try {
    const data = fs.readFileSync(addressPath, "utf8");
    addresses = JSON.parse(data);
  } catch (err) {
    console.error("❌ Erro ao ler deployment-addresses.json. Certifique-se que o arquivo existe.");
    process.exit(1);
  }

  const bkcTokenAddress = addresses.bkcToken;

  if (!bkcTokenAddress) {
    console.error("❌ Endereço 'bkcToken' não encontrado no JSON.");
    process.exit(1);
  }

  console.log("📦 BKC Token Address found:", bkcTokenAddress);

  // 2. Deploy do Contrato (Proxy UUPS)
  const FaucetFactory = await ethers.getContractFactory("SimpleBKCFaucet");
  
  // Parâmetros do initialize: (tokenAddress, ownerAddress)
  const faucet = await upgrades.deployProxy(FaucetFactory, [
    bkcTokenAddress, 
    deployer.address
  ], { 
    kind: 'uups',
    initializer: 'initialize'
  });

  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();

  console.log("----------------------------------------------------");
  console.log("✅ SimpleBKCFaucet Deployed to:", faucetAddress);
  console.log("----------------------------------------------------");

  // 3. (Opcional) Enviar um pouco de ETH para o Faucet começar a operar
  // Isso garante que o contrato tenha saldo para pagar o gas dos usuários na função distributeTo
  console.log("⛽ Sending initial ETH funding (0.01 ETH) to Faucet...");
  
  const tx = await deployer.sendTransaction({
    to: faucetAddress,
    value: ethers.parseEther("0.01") // Envia 0.01 ETH
  });
  
  await tx.wait();
  console.log("✅ Faucet funded with ETH!");

  console.log("\n⚠️ IMPORTANTE:");
  console.log(`1. Copie o endereço: ${faucetAddress}`);
  console.log("2. Atualize a chave 'faucet' no seu arquivo deployment-addresses.json");
  console.log("3. Envie TOKENS BKC para este endereço para ele poder distribuir.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });