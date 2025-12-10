// scripts/3_launch_and_liquidate_ecosystem.ts
// ✅ VERSÃO V5.5 FINAL: TGE para Deployer + Helpers Completos + Distribuição Controlada

import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { LogDescription, Log, ContractTransactionReceipt } from "ethers";

// ######################################################################
// ###               CONFIGURAÇÃO GERAL E FINANCEIRA                  ###
// ######################################################################

const DEPLOY_DELAY_MS = 5000; 
const CHUNK_SIZE = 50; 
const CHUNK_SIZE_BIGINT = BigInt(CHUNK_SIZE);

// 💰 CONFIGURAÇÃO DE VALORES (DISTRIBUIÇÃO)
const TGE_SUPPLY_AMOUNT = 40_000_000n * 10n**18n; // 40 Milhões Total

const FORTUNE_POOL_LIQUIDITY_TOTAL = ethers.parseEther("1000000"); // 1 Milhão BKC
const FAUCET_LIQUIDITY_TOTAL = ethers.parseEther("4000000");       // 4 Milhões BKC
const LIQUIDITY_BKC_AMOUNT_PER_POOL = ethers.parseEther("500000"); // 500 Mil BKC por Pool

const INITIAL_STAKE_AMOUNT = ethers.parseEther("1000"); 
const INITIAL_STAKE_DURATION = 365; // Dias

// Metas de NFTs por Tier (Ajuste conforme necessário)
const MANUAL_LIQUIDITY_MINT_COUNT = [
    100n,  // Diamond
    200n,  // Platinum
    300n,  // Gold
    400n,  // Silver
    500n,  // Bronze
    600n,  // Iron
    1000n  // Crystal
];

// ######################################################################
// ###        🎰 CONFIGURAÇÃO DOS PRIZE TIERS DO FORTUNE POOL         ###
// ######################################################################
const FORTUNE_POOL_PRIZE_TIERS = [
    { tierId: 1, range: 3, multiplierBips: 20000, name: "Fácil (1/3 - 2x)" },
    { tierId: 2, range: 10, multiplierBips: 50000, name: "Médio (1/10 - 5x)" },
    { tierId: 3, range: 100, multiplierBips: 1000000, name: "Difícil (1/100 - 100x)" }
];

// Tiers Sincronizados (NFT Boosters)
const ALL_TIERS = [
  { tierId: 1, name: "Diamond", boostBips: 7000n, metadata: "diamond_booster.json" },
  { tierId: 2, name: "Platinum", boostBips: 6000n, metadata: "platinum_booster.json" },
  { tierId: 3, name: "Gold", boostBips: 5000n, metadata: "gold_booster.json" },
  { tierId: 4, name: "Silver", boostBips: 4000n, metadata: "silver_booster.json" },
  { tierId: 5, name: "Bronze", boostBips: 3000n, metadata: "bronze_booster.json" },
  { tierId: 6, name: "Iron", boostBips: 2000n, metadata: "iron_booster.json" },
  { tierId: 7, name: "Crystal", boostBips: 1000n, metadata: "crystal_booster.json" },
];

// ######################################################################
// ###                  FUNÇÕES AUXILIARES (HELPERS)                  ###
// ######################################################################

const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function updateAddressJSON(key: string, value: string) {
    let currentAddresses: any = {};
    if (fs.existsSync(addressesFilePath)) {
        currentAddresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
    }
    currentAddresses[key] = value;
    fs.writeFileSync(addressesFilePath, JSON.stringify(currentAddresses, null, 2));
}

// Helper: Deploy Proxy com Retry
async function deployProxyWithRetries(Factory: any, args: any[], retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const instance = await upgrades.deployProxy(Factory, args, { kind: "uups" });
            await instance.waitForDeployment();
            return instance;
        } catch (error: any) {
            const msg = error.message || JSON.stringify(error);
            if (msg.includes("Too Many Requests") || msg.includes("429") || msg.includes("network") || msg.includes("timeout")) {
                const waitTime = DEPLOY_DELAY_MS * (i + 1); 
                console.warn(`   ⚠️ Rate Limit no Deploy (429). Tentativa ${i + 1}/${retries}. Aguardando ${waitTime/1000}s...`);
                await sleep(waitTime);
            } else {
                throw error;
            }
        }
    }
    throw new Error("Falha no deploy após várias tentativas devido a Rate Limit.");
}

// Helper: Send Tx com Retry
async function sendTransactionWithRetries(txFunction: () => Promise<any>, description: string, retries = 5): Promise<ContractTransactionReceipt | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const tx = await txFunction();
      console.log(`   ⏳ Enviando: ${description}...`);
      const receipt = await tx.wait();
      if (!receipt) { throw new Error("Transação enviada, mas o recibo retornou nulo."); }
      
      console.log(`   ✅ [SUCESSO] ${description}`);
      await sleep(1000); 
      return receipt as ContractTransactionReceipt;
    } catch (error: any) {
      const errorMessage = error.message || JSON.stringify(error);
      if (errorMessage.includes("already") || errorMessage.includes("Already") || errorMessage.includes("GameAlreadyFulfilled")) {
             console.log(`   ⚠️ Nota: Ação já realizada anteriormente (${description}). Continuando...`);
             return null;
      }
      if ((errorMessage.includes("nonce") || errorMessage.includes("replacement fee") || errorMessage.includes("network") || errorMessage.includes("Too Many Requests") || errorMessage.includes("429")) && i < retries - 1) {
        const waitTime = 3000 * (i + 1);
        console.warn(`   ⚠️ Erro temporário RPC. Tentativa ${i + 1}/${retries}. Aguardando ${waitTime/1000}s...`);
        await sleep(waitTime);
      } else {
        throw error; 
      }
    }
  }
  return null;
}

// Helper: Encontrar NFTs Órfãos
async function findDeployerOrphanTokens(rewardBoosterNFT: any, deployerAddress: string, targetBoostBips: bigint): Promise<string[]> {
    console.log(`      🕵️‍♂️ Escaneando carteira por NFTs órfãos...`);
    try {
        const filterTo = rewardBoosterNFT.filters.Transfer(null, deployerAddress, null);
        const events = await rewardBoosterNFT.queryFilter(filterTo, -5000); 
        
        const ownedTokenIds: string[] = [];
        for (const event of events) {
            if ('args' in event) {
                const tokenId = (event as any).args[2];
                try {
                    const currentOwner = await rewardBoosterNFT.ownerOf(tokenId);
                    if (currentOwner.toLowerCase() === deployerAddress.toLowerCase()) {
                        const boost = await rewardBoosterNFT.boostBips(tokenId);
                        if (boost === targetBoostBips) {
                            ownedTokenIds.push(tokenId.toString());
                        }
                    }
                } catch (e) { /* Token ignorado */ }
            }
        }
        
        const uniqueIds = [...new Set(ownedTokenIds)];
        if (uniqueIds.length > 0) console.log(`      ⚠️ ${uniqueIds.length} NFTs órfãos encontrados! Reutilizando...`);
        return uniqueIds;
    } catch (e) {
        console.warn("      ⚠️ Falha ao escanear eventos (RPC Limit). Seguindo sem órfãos.");
        return [];
    }
}

// Helper: Setar Taxa
async function setServiceFee(manager: any, key: string, value: number | bigint) {
    const hashedKey = ethers.id(key); 
    const current = await manager.getFee(hashedKey);
    if (current === BigInt(value)) return;
    await sendTransactionWithRetries(async () => await manager.setServiceFee(hashedKey, value), `REGRA: Taxa '${key}' -> ${value}`);
}

// Helper: Get or Create Spoke
async function getOrCreateSpoke(hre: any, addresses: any, key: string, contractName: string, contractPath: string, args: any[]) {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    
    if (addresses[key] && addresses[key].startsWith("0x")) {
        try {
            const code = await ethers.provider.getCode(addresses[key]);
            if (code !== "0x") {
                console.log(`   ⏩ ${contractName} já implantado em: ${addresses[key]}`);
                return await ethers.getContractAt(contractName, addresses[key], deployer);
            }
        } catch (e) { console.warn("   ⚠️ Erro ao verificar código do contrato, tentando implantar..."); }
    } 

    console.log(`   🔨 Implantando ${contractName}...`);
    const Factory = await ethers.getContractFactory(contractPath.split(":")[1]);
    const instance = await deployProxyWithRetries(Factory, args);
    const addr = await instance.getAddress();
    addresses[key] = addr;
    updateAddressJSON(key, addr);
    console.log(`   ✅ ${contractName} criado em: ${addr}`);
    await sleep(DEPLOY_DELAY_MS); 
    return instance;
}

// Helper: Configurar Fortune Pool
async function configureFortunePoolPrizeTiers(fortunePoolInstance: any): Promise<void> {
    console.log("\n🎰 CONFIGURANDO PRIZE TIERS DO FORTUNE POOL...");
    const currentActiveTierCount = await fortunePoolInstance.activeTierCount();
    
    for (const tierConfig of FORTUNE_POOL_PRIZE_TIERS) {
        const { tierId, range, multiplierBips } = tierConfig;
        
        let needsConfiguration = false;
        if (tierId <= Number(currentActiveTierCount)) {
            try {
                const existingTier = await fortunePoolInstance.prizeTiers(tierId);
                if (Number(existingTier.range) !== range || Number(existingTier.multiplierBips) !== multiplierBips || !existingTier.isActive) {
                    needsConfiguration = true;
                }
            } catch (e) { needsConfiguration = true; }
        } else {
            needsConfiguration = true;
        }
        
        if (needsConfiguration) {
            await sendTransactionWithRetries(
                async () => await fortunePoolInstance.setPrizeTier(tierId, range, multiplierBips),
                `PRIZE TIER ${tierId} (range=${range}, mult=${multiplierBips})`
            );
        }
    }
    console.log("   ✅ Prize Tiers verificados/configurados.");
}

// ######################################################################
// ###                        SCRIPT PRINCIPAL                        ###
// ######################################################################

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Fase 3) LANÇAMENTO & LIQUIDEZ V5.5 | Rede: ${networkName}`);
  console.log(`👷 Deployer (Genesis): ${deployer.address}`);
  console.log("----------------------------------------------------");

  if (!fs.existsSync(addressesFilePath)) throw new Error("Arquivo deployment-addresses.json faltando.");
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  // Instanciar Contratos Core
  const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, deployer);
  const bkcTokenInstance = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
  
  // Deploy Managers
  const miningManagerInstance = await getOrCreateSpoke(hre, addresses, 'miningManager', 'MiningManager', 'contracts/MiningManager.sol:MiningManager', [addresses.ecosystemManager]); 
  const delegationManagerInstance = await getOrCreateSpoke(hre, addresses, 'delegationManager', 'DelegationManager', 'contracts/DelegationManager.sol:DelegationManager', [deployer.address, addresses.ecosystemManager]);
  const notaryInstance = await getOrCreateSpoke(hre, addresses, 'decentralizedNotary', 'DecentralizedNotary', 'contracts/DecentralizedNotary.sol:DecentralizedNotary', [deployer.address, addresses.ecosystemManager]);
  const fortunePoolInstance = await getOrCreateSpoke(hre, addresses, 'fortunePool', 'FortunePool', 'contracts/FortunePool.sol:FortunePool', [deployer.address, addresses.ecosystemManager]);
  const rentalManagerInstance = await getOrCreateSpoke(hre, addresses, 'rentalManager', 'RentalManager', 'contracts/RentalManager.sol:RentalManager', [addresses.ecosystemManager, addresses.rewardBoosterNFT]);

  // Template & Factory
  let nftPoolImpAddr = addresses.nftLiquidityPool_Implementation;
  if (!nftPoolImpAddr || !nftPoolImpAddr.startsWith("0x")) {
      console.log(`   🔨 Implantando Template NFTLiquidityPool...`);
      const NFTLiquidityPool = await ethers.getContractFactory("NFTLiquidityPool");
      const imp = await NFTLiquidityPool.deploy();
      await imp.waitForDeployment();
      nftPoolImpAddr = await imp.getAddress();
      addresses.nftLiquidityPool_Implementation = nftPoolImpAddr;
      updateAddressJSON("nftLiquidityPool_Implementation", nftPoolImpAddr);
  }
  
  let factoryInstance = await getOrCreateSpoke(hre, addresses, 'nftLiquidityPoolFactory', 'NFTLiquidityPoolFactory', 'contracts/NFTLiquidityPoolFactory.sol:NFTLiquidityPoolFactory', 
      [deployer.address, addresses.ecosystemManager, nftPoolImpAddr]
  );

  // Update Hub Final
  console.log("\n🔌 Atualizando Hub (Wiring Final)...");
  await sendTransactionWithRetries(async () => await hub.setAddresses(
      addresses.bkcToken, 
      addresses.treasuryWallet || deployer.address, 
      addresses.delegationManager, 
      addresses.rewardBoosterNFT, 
      addresses.miningManager,
      addresses.decentralizedNotary, 
      addresses.fortunePool, 
      addresses.nftLiquidityPoolFactory
  ), "CONEXÃO: Hub Final");

  // Permissões de Mineração
  const mm = miningManagerInstance;
  const miners = [
      { key: "TIGER_GAME_SERVICE", addr: addresses.fortunePool },
      { key: "NOTARY_SERVICE", addr: addresses.decentralizedNotary },
      { key: "UNSTAKE_FEE_BIPS", addr: addresses.delegationManager },
      { key: "FORCE_UNSTAKE_PENALTY_BIPS", addr: addresses.delegationManager },
      { key: "CLAIM_REWARD_FEE_BIPS", addr: addresses.delegationManager },
      { key: "DELEGATION_FEE_BIPS", addr: addresses.delegationManager },
      { key: "RENTAL_MARKET_TAX_BIPS", addr: addresses.rentalManager },
  ];
  
  for (const m of miners) {
      if(m.addr && m.addr.startsWith("0x")) {
          const currentAuth = await mm.authorizedMiners(ethers.id(m.key));
          if (currentAuth.toLowerCase() !== m.addr.toLowerCase()) {
              await sendTransactionWithRetries(async () => await mm.setAuthorizedMiner(ethers.id(m.key), m.addr), `AUTH: ${m.key}`);
          }
      }
  }

  // Transfer Ownership BKC se necessário
  try {
    if ((await bkcTokenInstance.owner()).toLowerCase() === deployer.address.toLowerCase()) {
        await sendTransactionWithRetries(async () => await bkcTokenInstance.transferOwnership(addresses.miningManager), "SEGURANÇA: Controle BKC -> MiningManager");
    }
  } catch(e) { console.log("   ⚠️ Owner do BKC já transferido ou inacessível."); }

  // ═══════════════════════════════════════════════════════════════════
  // 💰 TGE & DISTRIBUIÇÃO INICIAL
  // ═══════════════════════════════════════════════════════════════════
  
  console.log("\n=== PARTE 1: TGE (TOKEN GENERATION EVENT) ===");

  try {
      const totalSupply = await bkcTokenInstance.totalSupply();
      if (totalSupply < TGE_SUPPLY_AMOUNT) {
          // CORREÇÃO CRÍTICA: Mintar para o DEPLOYER, não para o contrato
          console.log(`   🪙 Executing TGE: Minting 40M BKC to DEPLOYER (${deployer.address})...`);
          await sendTransactionWithRetries(async () => 
              await miningManagerInstance.initialTgeMint(deployer.address, TGE_SUPPLY_AMOUNT), 
              "GÊNESE: Mint Inicial 40M -> Deployer"
          );
      } else {
          console.log("   ✅ TGE já realizado anteriormente.");
      }
  } catch(e: any) { console.log(`   ⚠️ TGE Check: ${e.message}`); }

  const deployerBalance = await bkcTokenInstance.balanceOf(deployer.address);
  console.log(`   💰 Saldo do Deployer: ${ethers.formatEther(deployerBalance)} BKC`);

  // 🚰 DISTRIBUIÇÃO 1: FAUCET (4 MILHÕES)
  const faucetBalance = await bkcTokenInstance.balanceOf(addresses.faucet);
  if (faucetBalance < FAUCET_LIQUIDITY_TOTAL) {
      const needed = FAUCET_LIQUIDITY_TOTAL - faucetBalance;
      if (deployerBalance >= needed) {
          console.log(`   🚰 Abastecendo Faucet com ${ethers.formatEther(needed)} BKC...`);
          await sendTransactionWithRetries(async () => 
              await bkcTokenInstance.transfer(addresses.faucet, needed), 
              "TRANSFER: Liquidez Faucet (4MM)"
          );
      } else {
          console.warn("   ⚠️ Saldo insuficiente no Deployer para abastecer o Faucet.");
      }
  } else {
      console.log(`   ✅ Faucet já abastecido (${ethers.formatEther(faucetBalance)} BKC)`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🎰 CONFIGURAÇÃO DO FORTUNE POOL
  // ═══════════════════════════════════════════════════════════════════
  
  console.log("\n=== PARTE 2: CONFIGURAÇÃO DO FORTUNE POOL ===");
  
  if ((await fortunePoolInstance.oracleAddress()).toLowerCase() !== addresses.oracleWalletAddress.toLowerCase()) {
      await sendTransactionWithRetries(async () => await fortunePoolInstance.setOracleAddress(addresses.oracleWalletAddress), "CONFIG: Oráculo");
  }
  
  const currOracleFee = await fortunePoolInstance.oracleFeeInWei();
  if (currOracleFee > 0n) {
      await sendTransactionWithRetries(async () => await fortunePoolInstance.setOracleFee(0n), "CONFIG: Taxa Oráculo (0 ETH)");
  }

  await configureFortunePoolPrizeTiers(fortunePoolInstance);

  // ═══════════════════════════════════════════════════════════════════
  // ⚖️ APLICAÇÃO DE REGRAS ECONÔMICAS
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n⚖️  Aplicando Taxas Econômicas...");
  await setServiceFee(hub, "FORCE_UNSTAKE_PENALTY_BIPS", 5000n);
  await setServiceFee(hub, "CLAIM_REWARD_FEE_BIPS", 100n);
  await setServiceFee(hub, "DELEGATION_FEE_BIPS", 50n);
  await setServiceFee(hub, "UNSTAKE_FEE_BIPS", 100n);
  await setServiceFee(hub, "NFT_POOL_SELL_TAX_BIPS", 1000n);
  await setServiceFee(hub, "NFT_POOL_BUY_TAX_BIPS", 50n);
  await setServiceFee(hub, "RENTAL_MARKET_TAX_BIPS", 500n);
  await setServiceFee(hub, "NOTARY_SERVICE", ethers.parseEther("1"));
  
  console.log("\n=== PARTE 3: INJETANDO LIQUIDEZ ESCALONADA ===");

  // 🎲 DISTRIBUIÇÃO 2: FORTUNE POOL (1 MILHÃO)
  const currentFortuneBalance = await bkcTokenInstance.balanceOf(addresses.fortunePool);
  if (currentFortuneBalance < FORTUNE_POOL_LIQUIDITY_TOTAL) {
      const needed = FORTUNE_POOL_LIQUIDITY_TOTAL - currentFortuneBalance;
      console.log(`   💰 Fortune Pool precisa de mais ${ethers.formatEther(needed)} BKC`);
      // Como o dinheiro está no Deployer, fazemos Approve + TopUp (Função topUp puxa da msg.sender)
      await sendTransactionWithRetries(async () => await bkcTokenInstance.approve(addresses.fortunePool, needed), "APROVAR: Fortune Pool");
      await sendTransactionWithRetries(async () => await fortunePoolInstance.topUpPool(needed), "DEPOSITAR: Fortune Pool (1MM)");
  } else {
      console.log(`   ✅ Fortune Pool já tem liquidez (${ethers.formatEther(currentFortuneBalance)} BKC)`);
  }

  // 🏊 DISTRIBUIÇÃO 3: NFT POOLS (500k CADA)
  const rewardBoosterNFT = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, deployer);
  
  for (let i = 0; i < ALL_TIERS.length; i++) {
      const tier = ALL_TIERS[i];
      const targetTotal = MANUAL_LIQUIDITY_MINT_COUNT[i];
      const poolKey = `pool_${tier.name.toLowerCase()}`;
      
      console.log(`\n   --- Tier: ${tier.name} (Meta: ${targetTotal} NFTs | Liquidez: 500k BKC) ---`);

      let poolAddress = addresses[poolKey];
      if (!poolAddress || !poolAddress.startsWith('0x')) {
          await sendTransactionWithRetries(async () => await factoryInstance.deployPool(tier.boostBips), `FÁBRICA: Novo Pool ${tier.name}`);
          poolAddress = await factoryInstance.getPoolAddress(tier.boostBips);
          updateAddressJSON(poolKey, poolAddress);
          await sleep(DEPLOY_DELAY_MS);
      }
      
      const poolInstance = await ethers.getContractAt("NFTLiquidityPool", poolAddress, deployer);
      const poolInfo = await poolInstance.getPoolInfo();
      const poolNftCount = poolInfo[1];
      
      if (poolNftCount > 0n) {
          console.log(`      ⏩ Pool já abastecido (${poolNftCount} NFTs). Pulando.`);
          continue;
      }

      const orphanIds = await findDeployerOrphanTokens(rewardBoosterNFT, deployer.address, tier.boostBips);
      let idsToDeposit: string[] = [...orphanIds];
      const currentCount = BigInt(idsToDeposit.length);
      const needed = targetTotal > currentCount ? targetTotal - currentCount : 0n;

      if (needed > 0n) {
          console.log(`      Fabricando ${needed} novos NFTs...`);
          for (let j = 0n; j < needed; j += CHUNK_SIZE_BIGINT) {
              const batch = needed - j < CHUNK_SIZE_BIGINT ? needed - j : CHUNK_SIZE_BIGINT;
              const tx = await sendTransactionWithRetries(async () => 
                  await rewardBoosterNFT.ownerMintBatch(deployer.address, Number(batch), tier.boostBips, tier.metadata),
                  `MINT: +${batch} ${tier.name}`
              );
              if (tx) await sleep(1000); 
          }
          // Re-busca IDs atualizados
          const updatedIds = await findDeployerOrphanTokens(rewardBoosterNFT, deployer.address, tier.boostBips);
          idsToDeposit = updatedIds.slice(0, Number(targetTotal));
      }

      if (idsToDeposit.length > 0) {
          console.log(`      Depositando ${idsToDeposit.length} NFTs e 500k BKC...`);
          //Deployer aprova Pool para gastar BKC e NFTs
          await sendTransactionWithRetries(async () => await bkcTokenInstance.approve(poolAddress, LIQUIDITY_BKC_AMOUNT_PER_POOL), `BANCO: Aprovando 500k BKC`);
          await sendTransactionWithRetries(async () => await rewardBoosterNFT.setApprovalForAll(poolAddress, true), `ESTOQUE: Aprovando NFTs`);

          let isFirst = true;
          for (let k = 0; k < idsToDeposit.length; k += CHUNK_SIZE) {
              const chunk = idsToDeposit.slice(k, k + CHUNK_SIZE);
              if (isFirst) {
                  await sendTransactionWithRetries(async () => await poolInstance.addInitialLiquidity(chunk, LIQUIDITY_BKC_AMOUNT_PER_POOL), `MERCADO: Liquidez Inicial (NFTs + BKC)`);
                  isFirst = false;
              } else {
                  await sendTransactionWithRetries(async () => await poolInstance.addMoreNFTsToPool(chunk), `MERCADO: +Estoque NFTs`);
              }
              await sleep(1000); 
          }
          await sendTransactionWithRetries(async () => await rewardBoosterNFT.setApprovalForAll(poolAddress, false), `SEGURANÇA: Revogando`);
      }
  }

  // Genesis Stake
  if ((await delegationManagerInstance.totalNetworkPStake()) === 0n) {
      console.log("\n=== PARTE 4: GENESIS STAKE ===");
      await sendTransactionWithRetries(async () => await bkcTokenInstance.approve(addresses.delegationManager, INITIAL_STAKE_AMOUNT), `BANCO: Aprovando Stake`);
      try {
          await sendTransactionWithRetries(async () => await delegationManagerInstance.delegate(INITIAL_STAKE_AMOUNT, BigInt(INITIAL_STAKE_DURATION * 86400), 0), "STAKING: Genesis");
      } catch (error: any) { console.error("      ❌ ERRO NO GENESIS STAKE:", error.message); }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 📊 RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════════
  
  console.log("\n════════════════════════════════════════════════════════");
  console.log("                    📊 RESUMO FINAL");
  console.log("════════════════════════════════════════════════════════");
  
  const finalDeployerBalance = await bkcTokenInstance.balanceOf(deployer.address);
  console.log(`   💰 Saldo Restante Deployer: ${ethers.formatEther(finalDeployerBalance)} BKC`);
  console.log(`   🚰 Saldo Faucet: ${ethers.formatEther(await bkcTokenInstance.balanceOf(addresses.faucet))} BKC`);
  console.log(`   🎰 Saldo Fortune Pool: ${ethers.formatEther(await bkcTokenInstance.balanceOf(addresses.fortunePool))} BKC`);
  
  const totalPStake = await delegationManagerInstance.totalNetworkPStake();
  console.log(`   📈 Total Staked: ${ethers.formatEther(totalPStake)}`);

  console.log("\n----------------------------------------------------");
  console.log("🎉🎉🎉 ECOSSISTEMA LANÇADO COM SUCESSO! 🎉🎉🎉");
  console.log("----------------------------------------------------");
}

if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}