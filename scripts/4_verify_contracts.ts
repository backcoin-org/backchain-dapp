// scripts/4_verify_contracts.ts
// VERSAO V6.3: CharityPool.sol (p minusculo)

import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifyImplementation(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  proxyAddress: string,
  contractPath: string
): Promise<{ name: string; status: string; implAddress?: string }> {
  try {
    if (!proxyAddress || proxyAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`   Pulando ${contractName}: Endereco invalido.`);
      return { name: contractName, status: "skipped" };
    }

    console.log(`\nVerificando ${contractName}...`);
    console.log(`   Proxy: ${proxyAddress}`);
    
    const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implStorageValue = await hre.ethers.provider.getStorage(proxyAddress, implSlot);
    const implAddress = "0x" + implStorageValue.slice(26);
    
    if (implAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`   ${contractName}: Implementation nao encontrada`);
      return { name: contractName, status: "not_proxy" };
    }
    
    console.log(`   Implementation: ${implAddress}`);
    
    await hre.run("verify:verify", {
      address: implAddress,
      constructorArguments: [],
      contract: contractPath,
    });
    
    console.log(`   ${contractName} implementation verificada!`);
    return { name: contractName, status: "verified", implAddress };
    
  } catch (error: any) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes("already verified")) {
      console.log(`   ${contractName} ja estava verificado.`);
      return { name: contractName, status: "already_verified" };
    } else if (msg.includes("does not have bytecode")) {
      console.log(`   ${contractName}: Bytecode nao encontrado.`);
      return { name: contractName, status: "no_bytecode" };
    } else if (msg.includes("rate limit")) {
      console.log(`   Rate limit. Aguardando 15s...`);
      await sleep(15000);
      return verifyImplementation(hre, contractName, proxyAddress, contractPath);
    } else {
      console.log(`   Erro: ${error.message.substring(0, 100)}`);
      return { name: contractName, status: "failed" };
    }
  }
}

async function verifyContract(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  contractAddress: string,
  contractPath: string,
  constructorArgs: any[] = []
): Promise<{ name: string; status: string }> {
  try {
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`   Pulando ${contractName}: Endereco invalido.`);
      return { name: contractName, status: "skipped" };
    }

    console.log(`\nVerificando ${contractName}...`);
    console.log(`   Endereco: ${contractAddress}`);
    
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
      contract: contractPath,
    });
    
    console.log(`   ${contractName} verificado!`);
    return { name: contractName, status: "verified" };
    
  } catch (error: any) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes("already verified")) {
      console.log(`   ${contractName} ja estava verificado.`);
      return { name: contractName, status: "already_verified" };
    } else if (msg.includes("rate limit")) {
      console.log(`   Rate limit. Aguardando 15s...`);
      await sleep(15000);
      return verifyContract(hre, contractName, contractAddress, contractPath, constructorArgs);
    } else {
      console.log(`   Erro: ${error.message.substring(0, 100)}`);
      return { name: contractName, status: "failed" };
    }
  }
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`\n${"=".repeat(70)}`);
  console.log(`VERIFICACAO DE CONTRATOS V6.3 - ${networkName.toUpperCase()}`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Conta: ${deployer.address}`);

  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("\nVerificacao so funciona em redes publicas.");
    return;
  }

  const addressesPath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error(`deployment-addresses.json nao encontrado!`);
  }
  
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  console.log("\nEnderecos carregados.\n");

  const results: { name: string; status: string }[] = [];

  // CONTRATOS CORE
  console.log("=".repeat(70));
  console.log("CONTRATOS CORE (UUPS Proxies)");
  console.log("=".repeat(70));

  const coreContracts = [
    { name: "EcosystemManager", proxy: addresses.ecosystemManager, path: "contracts/solidity/EcosystemManager.sol:EcosystemManager" },
    { name: "BKCToken", proxy: addresses.bkcToken, path: "contracts/solidity/BKCToken.sol:BKCToken" },
    { name: "MiningManager", proxy: addresses.miningManager, path: "contracts/solidity/MiningManager.sol:MiningManager" },
    { name: "DelegationManager", proxy: addresses.delegationManager, path: "contracts/solidity/DelegationManager.sol:DelegationManager" },
    { name: "RewardBoosterNFT", proxy: addresses.rewardBoosterNFT, path: "contracts/solidity/RewardBoosterNFT.sol:RewardBoosterNFT" },
  ];

  for (const c of coreContracts) {
    if (c.proxy) {
      const result = await verifyImplementation(hre, c.name, c.proxy, c.path);
      results.push(result);
      await sleep(3000);
    }
  }

  // CONTRATOS DE SERVICO
  console.log("\n" + "=".repeat(70));
  console.log("CONTRATOS DE SERVICO (UUPS Proxies)");
  console.log("=".repeat(70));

  const serviceContracts = [
    { name: "FortunePool", proxy: addresses.fortunePool, path: "contracts/solidity/FortunePool.sol:FortunePool" },
    { name: "DecentralizedNotary", proxy: addresses.decentralizedNotary, path: "contracts/solidity/DecentralizedNotary.sol:DecentralizedNotary" },
    { name: "RentalManager", proxy: addresses.rentalManager, path: "contracts/solidity/RentalManager.sol:RentalManager" },
    { name: "PublicSale", proxy: addresses.publicSale, path: "contracts/solidity/PublicSale.sol:PublicSale" },
    { name: "NFTLiquidityPoolFactory", proxy: addresses.nftLiquidityPoolFactory, path: "contracts/solidity/NFTLiquidityPoolFactory.sol:NFTLiquidityPoolFactory" },
    { name: "CharityPool", proxy: addresses.charityPool, path: "contracts/solidity/CharityPool.sol:CharityPool" },
  ];

  for (const c of serviceContracts) {
    if (c.proxy) {
      const result = await verifyImplementation(hre, c.name, c.proxy, c.path);
      results.push(result);
      await sleep(3000);
    }
  }

  // BACKCOIN ORACLE
  console.log("\n" + "=".repeat(70));
  console.log("BACKCOIN ORACLE (Stylus/Rust)");
  console.log("=".repeat(70));

  if (addresses.backcoinOracle) {
    console.log(`\n   Backcoin Oracle: ${addresses.backcoinOracle}`);
    console.log(`\n   Contratos Stylus nao sao verificados pelo Hardhat.`);
    console.log(`   Use: cargo stylus verify --deployment-tx TX_HASH`);
    results.push({ name: "BackcoinOracle", status: "stylus_manual" });
  }

  // NFT POOLS
  console.log("\n" + "=".repeat(70));
  console.log("NFT LIQUIDITY POOLS (Minimal Proxy Clones)");
  console.log("=".repeat(70));
  console.log("\n   NFT Pools sao Minimal Proxy Clones (EIP-1167).");
  console.log("   A implementation ja foi verificada: NFTLiquidityPool_Implementation\n");

  const nftPools = [
    { name: "Pool_Diamond", address: addresses.pool_diamond },
    { name: "Pool_Platinum", address: addresses.pool_platinum },
    { name: "Pool_Gold", address: addresses.pool_gold },
    { name: "Pool_Silver", address: addresses.pool_silver },
    { name: "Pool_Bronze", address: addresses.pool_bronze },
    { name: "Pool_Iron", address: addresses.pool_iron },
    { name: "Pool_Crystal", address: addresses.pool_crystal },
  ];

  for (const pool of nftPools) {
    if (pool.address) {
      console.log(`   ${pool.name}: ${pool.address}`);
      results.push({ name: pool.name, status: "clone_ok" });
    }
  }

  // AUXILIARES
  console.log("\n" + "=".repeat(70));
  console.log("CONTRATOS AUXILIARES");
  console.log("=".repeat(70));

  if (addresses.nftLiquidityPool_Implementation) {
    const result = await verifyContract(
      hre,
      "NFTLiquidityPool_Implementation",
      addresses.nftLiquidityPool_Implementation,
      "contracts/solidity/NFTLiquidityPool.sol:NFTLiquidityPool"
    );
    results.push(result);
    await sleep(3000);
  }

  if (addresses.faucet) {
    const result = await verifyImplementation(
      hre,
      "SimpleBKCFaucet",
      addresses.faucet,
      "contracts/solidity/SimpleBKCFaucet.sol:SimpleBKCFaucet"
    );
    results.push(result);
    await sleep(3000);
  }

  // RESUMO
  console.log("\n" + "=".repeat(70));
  console.log("RESUMO DA VERIFICACAO");
  console.log("=".repeat(70));

  const verified = results.filter(r => r.status === "verified" || r.status === "already_verified");
  const clones = results.filter(r => r.status === "clone_ok");
  const failed = results.filter(r => r.status === "failed");

  console.log(`\nVerificados: ${verified.length}`);
  verified.forEach(r => console.log(`   ${r.name}`));

  if (clones.length > 0) {
    console.log(`\nClones OK: ${clones.length}`);
    clones.forEach(r => console.log(`   ${r.name}`));
  }

  if (failed.length > 0) {
    console.log(`\nFalhas: ${failed.length}`);
    failed.forEach(r => console.log(`   ${r.name}`));
  }

  const explorerBase = networkName === "arbitrumOne" 
    ? "https://arbiscan.io/address" 
    : "https://sepolia.arbiscan.io/address";

  console.log("\n" + "=".repeat(70));
  console.log("LINKAR PROXIES NO ARBISCAN");
  console.log("=".repeat(70));

  const mainProxies = [
    { name: "FortunePool", address: addresses.fortunePool },
    { name: "BKCToken", address: addresses.bkcToken },
    { name: "MiningManager", address: addresses.miningManager },
    { name: "DelegationManager", address: addresses.delegationManager },
    { name: "DecentralizedNotary", address: addresses.decentralizedNotary },
    { name: "RewardBoosterNFT", address: addresses.rewardBoosterNFT },
    { name: "RentalManager", address: addresses.rentalManager },
    { name: "EcosystemManager", address: addresses.ecosystemManager },
    { name: "CharityPool", address: addresses.charityPool },
  ];

  mainProxies.forEach(p => {
    if (p.address) {
      console.log(`\n   ${p.name}:`);
      console.log(`   ${explorerBase}/${p.address}#code`);
    }
  });

  console.log("\n" + "=".repeat(70));
  console.log("VERIFICACAO CONCLUIDA!");
  console.log("=".repeat(70));
}

import hre from "hardhat";
runScript(hre).catch(console.error);
