// scripts/verify_contracts.ts
// ════════════════════════════════════════════════════════════════════════════
// VERIFICAÇÃO DE CONTRATOS V9.0 — Todos imutáveis (sem proxy)
// ════════════════════════════════════════════════════════════════════════════

import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Delay entre verificações para evitar rate limit do Arbiscan
const VERIFY_DELAY_MS = 5000;

// Treasury address usado no deploy
const TREASURY_ADDRESS = "0xc93030333E3a235c2605BcB7C7330650B600B6D0";

// Faucet config usada no deploy
const FAUCET_CONFIG = {
  TOKENS_PER_REQUEST: BigInt("20000000000000000000"),   // 20e18
  ETH_PER_REQUEST: BigInt("1000000000000000"),           // 1e15
  COOLDOWN_SECONDS: 86400,
};

// Governance config
const TIMELOCK_DELAY_SECONDS = 3600;

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

    console.log(`\n   Verificando ${contractName}...`);
    console.log(`   Endereco: ${contractAddress}`);
    if (constructorArgs.length > 0) {
      console.log(`   Constructor args: [${constructorArgs.map(a => String(a)).join(", ")}]`);
    }

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
    } else if (msg.includes("does not have bytecode")) {
      console.log(`   ${contractName}: Bytecode nao encontrado no endereco.`);
      return { name: contractName, status: "no_bytecode" };
    } else if (msg.includes("rate limit")) {
      console.log(`   Rate limit. Aguardando 15s...`);
      await sleep(15000);
      return verifyContract(hre, contractName, contractAddress, contractPath, constructorArgs);
    } else {
      console.log(`   Erro: ${error.message.substring(0, 150)}`);
      return { name: contractName, status: "failed" };
    }
  }
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  const deployerAddr = deployer.address;

  console.log(`\n${"=".repeat(70)}`);
  console.log(`VERIFICAÇÃO DE CONTRATOS V9.0 — ${networkName.toUpperCase()}`);
  console.log(`Todos os contratos são IMUTÁVEIS (sem proxy)`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Deployer: ${deployerAddr}`);
  console.log(`Treasury: ${TREASURY_ADDRESS}`);

  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("\nVerificacao so funciona em redes publicas.");
    return;
  }

  const addressesPath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error(`deployment-addresses.json nao encontrado!`);
  }

  const addr = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  console.log("\nEnderecos carregados.\n");

  const results: { name: string; status: string }[] = [];

  // ══════════════════════════════════════════════════════════════════════
  // CORE: BKCToken + BackchainEcosystem
  // ══════════════════════════════════════════════════════════════════════
  console.log("=".repeat(70));
  console.log("CORE: BKCToken + BackchainEcosystem");
  console.log("=".repeat(70));

  // BKCToken constructor(address _treasury) — deployed with deployer as treasury for TGE
  if (addr.bkcToken) {
    const r = await verifyContract(hre, "BKCToken", addr.bkcToken,
      "contracts/BKCToken.sol:BKCToken", [deployerAddr]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // BackchainEcosystem constructor(address _bkcToken, address _treasury)
  if (addr.backchainEcosystem) {
    const r = await verifyContract(hre, "BackchainEcosystem", addr.backchainEcosystem,
      "contracts/BackchainEcosystem.sol:BackchainEcosystem", [addr.bkcToken, TREASURY_ADDRESS]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // ══════════════════════════════════════════════════════════════════════
  // DeFi: LiquidityPool + StakingPool + BuybackMiner
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n" + "=".repeat(70));
  console.log("DeFi: LiquidityPool + StakingPool + BuybackMiner");
  console.log("=".repeat(70));

  // LiquidityPool constructor(address _bkcToken)
  if (addr.liquidityPool) {
    const r = await verifyContract(hre, "LiquidityPool", addr.liquidityPool,
      "contracts/LiquidityPool.sol:LiquidityPool", [addr.bkcToken]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // StakingPool constructor(address _ecosystem, address _bkcToken)
  if (addr.stakingPool) {
    const r = await verifyContract(hre, "StakingPool", addr.stakingPool,
      "contracts/StakingPool.sol:StakingPool", [addr.backchainEcosystem, addr.bkcToken]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // BuybackMiner constructor(address _ecosystem, address _bkcToken, address _liquidityPool, address _stakingPool)
  if (addr.buybackMiner) {
    const r = await verifyContract(hre, "BuybackMiner", addr.buybackMiner,
      "contracts/BuybackMiner.sol:BuybackMiner",
      [addr.backchainEcosystem, addr.bkcToken, addr.liquidityPool, addr.stakingPool]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // ══════════════════════════════════════════════════════════════════════
  // NFT: RewardBooster + NFTPool (single Bronze)
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n" + "=".repeat(70));
  console.log("NFT: RewardBooster + NFTPool (single Bronze)");
  console.log("=".repeat(70));

  // RewardBooster constructor(address _deployer)
  if (addr.rewardBooster) {
    const r = await verifyContract(hre, "RewardBooster", addr.rewardBooster,
      "contracts/RewardBooster.sol:RewardBooster", [deployerAddr]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // NFTFusion constructor(address _ecosystem, address _booster)
  if (addr.nftFusion) {
    const r = await verifyContract(hre, "NFTFusion", addr.nftFusion,
      "contracts/NFTFusion.sol:NFTFusion",
      [addr.backchainEcosystem, addr.rewardBooster]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // NFTPool V3 constructor(address _ecosystem, address _bkcToken, address _rewardBooster, uint8 _tier, uint256 _virtualReserves, uint256 _mintableReserves)
  if (addr.pool_bronze) {
    const r = await verifyContract(hre, "NFTPool_bronze", addr.pool_bronze,
      "contracts/NFTPool.sol:NFTPool",
      [addr.backchainEcosystem, addr.bkcToken, addr.rewardBooster, 0, 0, 10000]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // ══════════════════════════════════════════════════════════════════════
  // MÓDULOS: Fortune, Agora, Notary, Charity, Rental
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n" + "=".repeat(70));
  console.log("MÓDULOS: Fortune, Agora, Notary, Charity, Rental");
  console.log("=".repeat(70));

  // FortunePool constructor(address _ecosystem, address _bkcToken)
  if (addr.fortunePool) {
    const r = await verifyContract(hre, "FortunePool", addr.fortunePool,
      "contracts/FortunePool.sol:FortunePool", [addr.backchainEcosystem, addr.bkcToken]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // Agora constructor(address _ecosystem)
  if (addr.agora) {
    const r = await verifyContract(hre, "Agora", addr.agora,
      "contracts/Agora.sol:Agora", [addr.backchainEcosystem]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // Notary constructor(address _ecosystem)
  if (addr.notary) {
    const r = await verifyContract(hre, "Notary", addr.notary,
      "contracts/Notary.sol:Notary", [addr.backchainEcosystem]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // CharityPool constructor(address _ecosystem)
  if (addr.charityPool) {
    const r = await verifyContract(hre, "CharityPool", addr.charityPool,
      "contracts/CharityPool.sol:CharityPool", [addr.backchainEcosystem]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // RentalManager constructor(address _ecosystem, address _rewardBooster)
  if (addr.rentalManager) {
    const r = await verifyContract(hre, "RentalManager", addr.rentalManager,
      "contracts/RentalManager.sol:RentalManager", [addr.backchainEcosystem, addr.rewardBooster]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // ══════════════════════════════════════════════════════════════════════
  // AUXILIARES: Faucet + Governance
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n" + "=".repeat(70));
  console.log("AUXILIARES: Faucet + Governance");
  console.log("=".repeat(70));

  // SimpleBKCFaucet constructor(address _bkcToken, address _relayer, uint256 _tokensPerClaim, uint256 _ethPerClaim, uint256 _cooldown)
  if (addr.simpleBkcFaucet) {
    const r = await verifyContract(hre, "SimpleBKCFaucet", addr.simpleBkcFaucet,
      "contracts/SimpleBKCFaucet.sol:SimpleBKCFaucet",
      [addr.bkcToken, deployerAddr, FAUCET_CONFIG.TOKENS_PER_REQUEST, FAUCET_CONFIG.ETH_PER_REQUEST, FAUCET_CONFIG.COOLDOWN_SECONDS]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // BackchainGovernance constructor(uint256 _timelockDelay)
  if (addr.backchainGovernance) {
    const r = await verifyContract(hre, "BackchainGovernance", addr.backchainGovernance,
      "contracts/BackchainGovernance.sol:BackchainGovernance", [TIMELOCK_DELAY_SECONDS]);
    results.push(r);
    await sleep(VERIFY_DELAY_MS);
  }

  // ══════════════════════════════════════════════════════════════════════
  // RESUMO
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n" + "=".repeat(70));
  console.log("RESUMO DA VERIFICAÇÃO");
  console.log("=".repeat(70));

  const verified = results.filter(r => r.status === "verified" || r.status === "already_verified");
  const failed = results.filter(r => r.status === "failed");
  const skipped = results.filter(r => r.status === "skipped");
  const noBytecode = results.filter(r => r.status === "no_bytecode");

  console.log(`\nVerificados: ${verified.length}/${results.length}`);
  verified.forEach(r => console.log(`   OK  ${r.name}`));

  if (skipped.length > 0) {
    console.log(`\nPulados: ${skipped.length}`);
    skipped.forEach(r => console.log(`   --  ${r.name}`));
  }

  if (noBytecode.length > 0) {
    console.log(`\nSem bytecode: ${noBytecode.length}`);
    noBytecode.forEach(r => console.log(`   ??  ${r.name}`));
  }

  if (failed.length > 0) {
    console.log(`\nFalhas: ${failed.length}`);
    failed.forEach(r => console.log(`   XX  ${r.name}`));
  }

  const explorerBase = networkName === "arbitrumOne"
    ? "https://arbiscan.io/address"
    : "https://sepolia.arbiscan.io/address";

  console.log("\n" + "=".repeat(70));
  console.log("LINKS ARBISCAN");
  console.log("=".repeat(70));

  const allContracts = [
    { name: "BKCToken", address: addr.bkcToken },
    { name: "BackchainEcosystem", address: addr.backchainEcosystem },
    { name: "LiquidityPool", address: addr.liquidityPool },
    { name: "StakingPool", address: addr.stakingPool },
    { name: "BuybackMiner", address: addr.buybackMiner },
    { name: "RewardBooster", address: addr.rewardBooster },
    { name: "NFTFusion", address: addr.nftFusion },
    { name: "NFTPool_Bronze", address: addr.pool_bronze },
    { name: "FortunePool", address: addr.fortunePool },
    { name: "Agora", address: addr.agora },
    { name: "Notary", address: addr.notary },
    { name: "CharityPool", address: addr.charityPool },
    { name: "RentalManager", address: addr.rentalManager },
    { name: "SimpleBKCFaucet", address: addr.simpleBkcFaucet },
    { name: "BackchainGovernance", address: addr.backchainGovernance },
  ];

  allContracts.forEach(c => {
    if (c.address) {
      console.log(`   ${c.name}: ${explorerBase}/${c.address}#code`);
    }
  });

  console.log("\n" + "=".repeat(70));
  console.log("VERIFICAÇÃO CONCLUÍDA!");
  console.log("=".repeat(70));
  console.log(`
   V9.0: Todos os contratos são imutáveis (sem proxy).
   Para re-verificar um contrato manualmente:
   npx hardhat verify --network ${networkName} <ADDRESS> [constructor args...]
`);
}

import hre from "hardhat";
runScript(hre).catch(console.error);
