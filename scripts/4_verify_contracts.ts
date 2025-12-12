// scripts/4_verify_contracts.ts
// ✅ VERSÃO V4: Verificação correta para UUPS Proxies

import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Verifica a IMPLEMENTATION de um proxy UUPS
 * O Arbiscan linkará automaticamente o proxy à implementation
 */
async function verifyImplementation(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  proxyAddress: string,
  contractPath: string
): Promise<{ name: string; status: string; implAddress?: string }> {
  try {
    console.log(`\n🔍 Verificando ${contractName}...`);
    console.log(`   Proxy: ${proxyAddress}`);
    
    // Obter endereço da implementation via storage slot EIP-1967
    const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implStorageValue = await hre.ethers.provider.getStorage(proxyAddress, implSlot);
    const implAddress = "0x" + implStorageValue.slice(26); // Remove padding
    
    console.log(`   Implementation: ${implAddress}`);
    
    // Verificar a implementation
    await hre.run("verify:verify", {
      address: implAddress,
      constructorArguments: [],
      contract: contractPath,
    });
    
    console.log(`   ✅ ${contractName} implementation verificada!`);
    return { name: contractName, status: "verified", implAddress };
    
  } catch (error: any) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes("already verified")) {
      console.log(`   ✅ ${contractName} já estava verificado.`);
      return { name: contractName, status: "already_verified" };
    } else if (msg.includes("does not have bytecode")) {
      console.log(`   ⚠️  ${contractName}: Bytecode não encontrado.`);
      return { name: contractName, status: "no_bytecode" };
    } else if (msg.includes("rate limit")) {
      console.log(`   ⏳ Rate limit. Aguardando 15s...`);
      await sleep(15000);
      return verifyImplementation(hre, contractName, proxyAddress, contractPath);
    } else {
      console.log(`   ❌ Erro: ${error.message.substring(0, 80)}`);
      return { name: contractName, status: "failed" };
    }
  }
}

/**
 * Verifica um contrato normal (não proxy)
 */
async function verifyContract(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  contractAddress: string,
  contractPath: string,
  constructorArgs: any[] = []
): Promise<{ name: string; status: string }> {
  try {
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`⚠️  Pulando ${contractName}: Endereço inválido.`);
      return { name: contractName, status: "skipped" };
    }

    console.log(`\n🔍 Verificando ${contractName}...`);
    console.log(`   Endereço: ${contractAddress}`);
    
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
      contract: contractPath,
    });
    
    console.log(`   ✅ ${contractName} verificado!`);
    return { name: contractName, status: "verified" };
    
  } catch (error: any) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes("already verified")) {
      console.log(`   ✅ ${contractName} já estava verificado.`);
      return { name: contractName, status: "already_verified" };
    } else if (msg.includes("rate limit")) {
      console.log(`   ⏳ Rate limit. Aguardando 15s...`);
      await sleep(15000);
      return verifyContract(hre, contractName, contractAddress, contractPath, constructorArgs);
    } else {
      console.log(`   ❌ Erro: ${error.message.substring(0, 80)}`);
      return { name: contractName, status: "failed" };
    }
  }
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 VERIFICAÇÃO DE CONTRATOS V4 - ${networkName.toUpperCase()}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`👤 Conta: ${deployer.address}`);
  console.log(`${"=".repeat(60)}`);

  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("\n⚠️  Verificação só funciona em redes públicas.");
    return;
  }

  // Carregar endereços
  const addressesPath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error(`❌ deployment-addresses.json não encontrado!`);
  }
  
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  console.log("\n📂 Endereços carregados.\n");

  const results: { name: string; status: string }[] = [];

  // ========================================
  // 1. PROXIES UUPS - Verificar IMPLEMENTATIONS
  // ========================================
  console.log("=".repeat(60));
  console.log("🔷 CONTRATOS UUPS (verificando implementations)");
  console.log("=".repeat(60));

  const uupsContracts = [
    { name: "EcosystemManager", proxy: addresses.ecosystemManager, path: "contracts/EcosystemManager.sol:EcosystemManager" },
    { name: "MiningManager", proxy: addresses.miningManager, path: "contracts/MiningManager.sol:MiningManager" },
    { name: "DelegationManager", proxy: addresses.delegationManager, path: "contracts/DelegationManager.sol:DelegationManager" },
    { name: "DecentralizedNotary", proxy: addresses.decentralizedNotary, path: "contracts/DecentralizedNotary.sol:DecentralizedNotary" },
    { name: "RentalManager", proxy: addresses.rentalManager, path: "contracts/RentalManager.sol:RentalManager" },
    { name: "FortunePool", proxy: addresses.fortunePool, path: "contracts/FortunePool.sol:FortunePool" },
    { name: "NFTLiquidityPoolFactory", proxy: addresses.nftLiquidityPoolFactory, path: "contracts/NFTLiquidityPoolFactory.sol:NFTLiquidityPoolFactory" },
    { name: "BKCToken", proxy: addresses.bkcToken, path: "contracts/BKCToken.sol:BKCToken" },
    { name: "RewardBoosterNFT", proxy: addresses.rewardBoosterNFT, path: "contracts/RewardBoosterNFT.sol:RewardBoosterNFT" },
    { name: "PublicSale", proxy: addresses.publicSale, path: "contracts/PublicSale.sol:PublicSale" },
  ];

  for (const c of uupsContracts) {
    if (c.proxy) {
      const result = await verifyImplementation(hre, c.name, c.proxy, c.path);
      results.push(result);
      await sleep(3000);
    }
  }

  // ========================================
  // 2. CONTRATOS NÃO-PROXY
  // ========================================
  console.log("\n" + "=".repeat(60));
  console.log("🪙 CONTRATOS AUXILIARES");
  console.log("=".repeat(60));

  // NFTLiquidityPool Implementation (se existir separado)
  if (addresses.nftLiquidityPool_Implementation) {
    const result = await verifyContract(
      hre,
      "NFTLiquidityPool_Impl",
      addresses.nftLiquidityPool_Implementation,
      "contracts/NFTLiquidityPool.sol:NFTLiquidityPool"
    );
    results.push(result);
    await sleep(3000);
  }

  // SimpleBKCFaucet
  if (addresses.faucet) {
    const result = await verifyContract(
      hre,
      "SimpleBKCFaucet",
      addresses.faucet,
      "contracts/SimpleBKCFaucet.sol:SimpleBKCFaucet"
    );
    results.push(result);
  }

  // ========================================
  // 3. RESUMO
  // ========================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO");
  console.log("=".repeat(60));

  const verified = results.filter(r => r.status === "verified" || r.status === "already_verified");
  const failed = results.filter(r => r.status === "failed");
  const skipped = results.filter(r => r.status === "skipped" || r.status === "no_bytecode");

  console.log(`\n✅ Verificados: ${verified.length}`);
  verified.forEach(r => console.log(`   - ${r.name}`));

  if (failed.length > 0) {
    console.log(`\n❌ Falhas: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.name}`));
  }

  if (skipped.length > 0) {
    console.log(`\n⏭️  Pulados: ${skipped.length}`);
    skipped.forEach(r => console.log(`   - ${r.name}`));
  }

  console.log(`\n🔗 Explorer: https://sepolia.arbiscan.io/address/${addresses.ecosystemManager}`);

  // ========================================
  // 4. LINK PROXIES (instrução manual)
  // ========================================
  console.log("\n" + "=".repeat(60));
  console.log("📝 PRÓXIMO PASSO: Linkar Proxies no Arbiscan");
  console.log("=".repeat(60));
  console.log(`
Para cada contrato proxy, faça:

1. Acesse: https://sepolia.arbiscan.io/address/PROXY_ADDRESS
2. Vá em "Contract" → "More Options" → "Is this a proxy?"
3. Clique em "Verify" para linkar à implementation

Proxies para linkar:
- EcosystemManager: ${addresses.ecosystemManager}
- MiningManager: ${addresses.miningManager}
- DelegationManager: ${addresses.delegationManager}
- FortunePool: ${addresses.fortunePool}
- BKCToken: ${addresses.bkcToken}
`);

  console.log("=".repeat(60));
  console.log("🎉 VERIFICAÇÃO CONCLUÍDA!");
  console.log("=".repeat(60) + "\n");
}

// Entry point
async function main() {
  const hre = require("hardhat");
  await runScript(hre);
}

main().catch((error) => {
  console.error("\n❌ ERRO:", error);
  process.exit(1);
});