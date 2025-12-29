// scripts/4_verify_contracts.ts
// ✅ VERSÃO V6.1: Paths corrigidos para contracts/solidity/
// Inclui: UUPS Proxies, Contratos normais, NFT Pools
// Nota: Backcoin Oracle (Stylus) é verificado separadamente via cargo stylus

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
    if (!proxyAddress || proxyAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`   ⚠️  Pulando ${contractName}: Endereço inválido.`);
      return { name: contractName, status: "skipped" };
    }

    console.log(`\n🔍 Verificando ${contractName}...`);
    console.log(`   Proxy: ${proxyAddress}`);
    
    // Obter endereço da implementation via storage slot EIP-1967
    const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implStorageValue = await hre.ethers.provider.getStorage(proxyAddress, implSlot);
    const implAddress = "0x" + implStorageValue.slice(26); // Remove padding
    
    // Verificar se o endereço da implementation é válido
    if (implAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`   ⚠️  ${contractName}: Implementation não encontrada (não é proxy UUPS?)`);
      return { name: contractName, status: "not_proxy" };
    }
    
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
      console.log(`   ❌ Erro: ${error.message.substring(0, 100)}`);
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
      console.log(`   ⚠️  Pulando ${contractName}: Endereço inválido.`);
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
      console.log(`   ❌ Erro: ${error.message.substring(0, 100)}`);
      return { name: contractName, status: "failed" };
    }
  }
}

/**
 * Verifica NFT Pool (UUPS Proxy clonado)
 */
async function verifyNFTPool(
  hre: HardhatRuntimeEnvironment,
  poolName: string,
  poolAddress: string
): Promise<{ name: string; status: string }> {
  if (!poolAddress) {
    return { name: poolName, status: "skipped" };
  }
  
  return verifyImplementation(
    hre,
    poolName,
    poolAddress,
    "contracts/solidity/NFTLiquidityPool.sol:NFTLiquidityPool"  // ✅ CORRIGIDO
  );
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`\n${"═".repeat(70)}`);
  console.log(`🚀 VERIFICAÇÃO DE CONTRATOS V6.1 - ${networkName.toUpperCase()}`);
  console.log(`${"═".repeat(70)}`);
  console.log(`👤 Conta: ${deployer.address}`);
  console.log(`${"═".repeat(70)}`);

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
  // 1. CONTRATOS CORE (UUPS Proxies)
  // ========================================
  console.log("═".repeat(70));
  console.log("🔷 CONTRATOS CORE (UUPS Proxies)");
  console.log("═".repeat(70));

  // ✅ V6.1: Paths corrigidos para contracts/solidity/
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

  // ========================================
  // 2. CONTRATOS DE SERVIÇO (UUPS Proxies)
  // ========================================
  console.log("\n" + "═".repeat(70));
  console.log("🔶 CONTRATOS DE SERVIÇO (UUPS Proxies)");
  console.log("═".repeat(70));

  // ✅ V6.1: Paths corrigidos para contracts/solidity/
  const serviceContracts = [
    { name: "FortunePool", proxy: addresses.fortunePool, path: "contracts/solidity/FortunePool.sol:FortunePool" },
    { name: "DecentralizedNotary", proxy: addresses.decentralizedNotary, path: "contracts/solidity/DecentralizedNotary.sol:DecentralizedNotary" },
    { name: "RentalManager", proxy: addresses.rentalManager, path: "contracts/solidity/RentalManager.sol:RentalManager" },
    { name: "PublicSale", proxy: addresses.publicSale, path: "contracts/solidity/PublicSale.sol:PublicSale" },
    { name: "NFTLiquidityPoolFactory", proxy: addresses.nftLiquidityPoolFactory, path: "contracts/solidity/NFTLiquidityPoolFactory.sol:NFTLiquidityPoolFactory" },
  ];

  for (const c of serviceContracts) {
    if (c.proxy) {
      const result = await verifyImplementation(hre, c.name, c.proxy, c.path);
      results.push(result);
      await sleep(3000);
    }
  }

  // ========================================
  // 3. BACKCOIN ORACLE (Stylus/Rust)
  // ========================================
  console.log("\n" + "═".repeat(70));
  console.log("🦀 BACKCOIN ORACLE (Stylus/Rust)");
  console.log("═".repeat(70));

  if (addresses.backcoinOracle) {
    console.log(`\n   📍 Backcoin Oracle: ${addresses.backcoinOracle}`);
    console.log(`\n   ⚠️  Contratos Stylus (Rust/WASM) não são verificados pelo Hardhat.`);
    console.log(`   → Para verificar, use o Stylus CLI:`);
    console.log(`\n   cd contracts/stylus/backcoin-oracle`);
    console.log(`   cargo stylus verify --deployment-tx TX_HASH --endpoint RPC_URL`);
    console.log(`\n   📋 Explorer: https://sepolia.arbiscan.io/address/${addresses.backcoinOracle}`);
    
    results.push({ name: "BackcoinOracle", status: "stylus_manual" });
  } else {
    console.log(`\n   ⚠️  Backcoin Oracle não encontrado no deployment-addresses.json`);
    results.push({ name: "BackcoinOracle", status: "not_found" });
  }

  // ========================================
  // 4. NFT LIQUIDITY POOLS (7 Tiers)
  // ========================================
  console.log("\n" + "═".repeat(70));
  console.log("💎 NFT LIQUIDITY POOLS (7 Tiers)");
  console.log("═".repeat(70));

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
      const result = await verifyNFTPool(hre, pool.name, pool.address);
      results.push(result);
      await sleep(3000);
    }
  }

  // ========================================
  // 5. CONTRATOS AUXILIARES
  // ========================================
  console.log("\n" + "═".repeat(70));
  console.log("🪙 CONTRATOS AUXILIARES");
  console.log("═".repeat(70));

  // NFTLiquidityPool Implementation (template)
  if (addresses.nftLiquidityPool_Implementation) {
    const result = await verifyContract(
      hre,
      "NFTLiquidityPool_Implementation",
      addresses.nftLiquidityPool_Implementation,
      "contracts/solidity/NFTLiquidityPool.sol:NFTLiquidityPool"  // ✅ CORRIGIDO
    );
    results.push(result);
    await sleep(3000);
  }

  // SimpleBKCFaucet (UUPS Proxy)
  if (addresses.faucet) {
    const result = await verifyImplementation(
      hre,
      "SimpleBKCFaucet",
      addresses.faucet,
      "contracts/solidity/SimpleBKCFaucet.sol:SimpleBKCFaucet"  // ✅ CORRIGIDO
    );
    results.push(result);
    await sleep(3000);
  }

  // ========================================
  // 6. RESUMO
  // ========================================
  console.log("\n" + "═".repeat(70));
  console.log("📊 RESUMO DA VERIFICAÇÃO");
  console.log("═".repeat(70));

  const verified = results.filter(r => r.status === "verified" || r.status === "already_verified");
  const failed = results.filter(r => r.status === "failed");
  const skipped = results.filter(r => r.status === "skipped" || r.status === "not_proxy");
  const manual = results.filter(r => r.status === "stylus_manual");

  console.log(`\n✅ Verificados: ${verified.length}`);
  verified.forEach(r => console.log(`   ✓ ${r.name}`));

  if (failed.length > 0) {
    console.log(`\n❌ Falhas: ${failed.length}`);
    failed.forEach(r => console.log(`   ✗ ${r.name}`));
  }

  if (skipped.length > 0) {
    console.log(`\n⏭️  Pulados: ${skipped.length}`);
    skipped.forEach(r => console.log(`   - ${r.name}`));
  }

  if (manual.length > 0) {
    console.log(`\n🔧 Verificação Manual Necessária: ${manual.length}`);
    manual.forEach(r => console.log(`   - ${r.name} (Stylus/Rust)`));
  }

  // ========================================
  // INSTRUÇÕES PARA LINKAR PROXIES
  // ========================================
  const explorerBase = networkName === "arbitrumOne" 
    ? "https://arbiscan.io/address" 
    : "https://sepolia.arbiscan.io/address";

  console.log("\n" + "═".repeat(70));
  console.log("🔗 PRÓXIMO PASSO: Linkar Proxies no Arbiscan");
  console.log("═".repeat(70));
  console.log(`
Para que os logs apareçam decodificados, você precisa "linkar" cada proxy
à sua implementation no Arbiscan:

1. Acesse o endereço do PROXY no Arbiscan
2. Vá em "Contract" → "More Options" → "Is this a proxy?"
3. Clique em "Verify" para detectar automaticamente a implementation
4. Confirme o link

Proxies principais para linkar:
`);

  const mainProxies = [
    { name: "FortunePool", address: addresses.fortunePool },
    { name: "BKCToken", address: addresses.bkcToken },
    { name: "MiningManager", address: addresses.miningManager },
    { name: "DelegationManager", address: addresses.delegationManager },
    { name: "DecentralizedNotary", address: addresses.decentralizedNotary },
    { name: "RewardBoosterNFT", address: addresses.rewardBoosterNFT },
    { name: "RentalManager", address: addresses.rentalManager },
    { name: "EcosystemManager", address: addresses.ecosystemManager },
  ];

  mainProxies.forEach(p => {
    if (p.address) {
      console.log(`   ${p.name}:`);
      console.log(`   ${explorerBase}/${p.address}#code\n`);
    }
  });

  // ========================================
  // INSTRUÇÕES PARA BACKCOIN ORACLE
  // ========================================
  if (addresses.backcoinOracle) {
    console.log("═".repeat(70));
    console.log("🦀 VERIFICAR BACKCOIN ORACLE (Rust/Stylus)");
    console.log("═".repeat(70));
    console.log(`
O Backcoin Oracle é um contrato Rust compilado para WASM (Stylus).
Para verificá-lo, use o Stylus CLI:

1. No diretório do projeto Rust:
   cd contracts/stylus/backcoin-oracle

2. Verificar usando a TX de deploy:
   cargo stylus verify --deployment-tx TX_HASH --endpoint RPC_URL

3. Ou verificar pelo endereço:
   ${explorerBase}/${addresses.backcoinOracle}
`);
  }

  console.log("═".repeat(70));
  console.log("🎉 VERIFICAÇÃO CONCLUÍDA!");
  console.log("═".repeat(70));
  console.log(`
Após linkar os proxies, os logs das transações mostrarão:
- Nomes dos eventos (GamePlayed, GameResolved, etc.)
- Parâmetros decodificados (guesses, rolls, matches)
- Muito mais fácil de ler! 🎯
`);
}

// Executar se chamado diretamente
import hre from "hardhat";
runScript(hre).catch(console.error);