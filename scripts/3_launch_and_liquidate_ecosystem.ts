// scripts/3_launch_and_liquidate_ecosystem.ts
// ✅ VERSÃO FINAL V3.3: Anti-Rate Limit (Infura/Alchemy Fix) + Retry no DeployProxy

import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { LogDescription, Log, ContractTransactionReceipt } from "ethers";

// ######################################################################
// ###               CONFIGURAÇÃO DE LANÇAMENTO DO ECOSSISTEMA        ###
// ######################################################################

// AUMENTADO PARA 10s PARA EVITAR ERRO 429 (TOO MANY REQUESTS)
const DEPLOY_DELAY_MS = 10000; 
const CHUNK_SIZE = 50; // Reduzido para aliviar o RPC
const CHUNK_SIZE_BIGINT = BigInt(CHUNK_SIZE);

// Quantidade de NFTs para injetar na liquidez inicial por Tier
const MANUAL_LIQUIDITY_MINT_COUNT = [
    10n, // Diamond
    20n, // Platinum
    30n, // Gold
    40n, // Silver
    50n, // Bronze
    60n, // Iron
    70n  // Crystal
];

const FORTUNE_POOL_LIQUIDITY_TOTAL = ethers.parseEther("1000000"); // 1M BKC

// --- [CALIBRAÇÃO V3] TIGER GAME (Ajustado) ---
const FORTUNE_POOL_TIERS = [
    { poolId: 1, multiplierBips: 20000n, chanceDenominator: 3n }, 
    { poolId: 2, multiplierBips: 50000n, chanceDenominator: 10n }, 
    { poolId: 3, multiplierBips: 1000000n, chanceDenominator: 100n } 
];

// Liquidez de BKC para parear com os NFTs (2M BKC por Pool)
const LIQUIDITY_BKC_AMOUNT_PER_POOL = ethers.parseEther("2000000"); 

// Tiers Sincronizados
const ALL_TIERS = [
  { tierId: 0, name: "Diamond", boostBips: 7000n, metadata: "diamond_booster.json" },
  { tierId: 1, name: "Platinum", boostBips: 6000n, metadata: "platinum_booster.json" },
  { tierId: 2, name: "Gold", boostBips: 5000n, metadata: "gold_booster.json" },
  { tierId: 3, name: "Silver", boostBips: 4000n, metadata: "silver_booster.json" },
  { tierId: 4, name: "Bronze", boostBips: 3000n, metadata: "bronze_booster.json" },
  { tierId: 5, name: "Iron", boostBips: 2000n, metadata: "iron_booster.json" },
  { tierId: 6, name: "Crystal", boostBips: 1000n, metadata: "crystal_booster.json" },
];

const TGE_SUPPLY_AMOUNT = 40_000_000n * 10n**18n; 
const INITIAL_STAKE_AMOUNT = ethers.parseEther("1000"); 
const INITIAL_STAKE_DURATION = 365; // Dias

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

// Helper robusto para Deploy de Proxy com Retries (Evita erro 429 no deploy)
async function deployProxyWithRetries(Factory: any, args: any[], retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const instance = await upgrades.deployProxy(Factory, args, { kind: "uups" });
            await instance.waitForDeployment();
            return instance;
        } catch (error: any) {
            const msg = error.message || JSON.stringify(error);
            if (msg.includes("Too Many Requests") || msg.includes("429") || msg.includes("network")) {
                const waitTime = DEPLOY_DELAY_MS * (i + 1); // Backoff exponencial simples
                console.warn(`   ⚠️ Rate Limit no Deploy (429). Tentativa ${i + 1}/${retries}. Aguardando ${waitTime/1000}s...`);
                await sleep(waitTime);
            } else {
                throw error;
            }
        }
    }
    throw new Error("Falha no deploy após várias tentativas devido a Rate Limit.");
}

async function sendTransactionWithRetries(txFunction: () => Promise<any>, description: string, retries = 5): Promise<ContractTransactionReceipt | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const tx = await txFunction();
      console.log(`   ⏳ Enviando: ${description}...`);
      const receipt = await tx.wait();
      if (!receipt) { throw new Error("Transação enviada, mas o recibo retornou nulo."); }
      
      console.log(`   ✅ [SUCESSO] ${description}`);
      await sleep(2000); // Pausa extra após cada sucesso para respirar o RPC
      return receipt as ContractTransactionReceipt;
    } catch (error: any) {
      const errorMessage = error.message || JSON.stringify(error);
      if (errorMessage.includes("already") || errorMessage.includes("Already")) {
             console.log(`   ⚠️ Nota: Ação já realizada anteriormente (${description}). Continuando...`);
             return null;
      }
      if ((errorMessage.includes("nonce") || errorMessage.includes("replacement fee") || errorMessage.includes("network") || errorMessage.includes("Too Many Requests") || errorMessage.includes("429")) && i < retries - 1) {
        const waitTime = 5000 * (i + 1);
        console.warn(`   ⚠️ Erro temporário RPC. Tentativa ${i + 1}/${retries}. Aguardando ${waitTime/1000}s...`);
        await sleep(waitTime);
      } else {
        throw error; // Erro fatal
      }
    }
  }
  return null;
}

/**
 * 🕵️‍♂️ FUNÇÃO INTELIGENTE: SCANNER DE ÓRFÃOS
 */
async function findDeployerOrphanTokens(rewardBoosterNFT: any, deployerAddress: string, targetBoostBips: bigint): Promise<string[]> {
    console.log(`      🕵️‍♂️ Escaneando carteira por NFTs órfãos...`);
    
    // Tenta pegar logs. Se falhar por RPC, retorna vazio para não travar o script
    try {
        const filterTo = rewardBoosterNFT.filters.Transfer(null, deployerAddress, null);
        const events = await rewardBoosterNFT.queryFilter(filterTo); 
        
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

// --- Funções Auxiliares de Regras ---
async function setServiceFee(manager: any, key: string, value: number | bigint) {
    const hashedKey = ethers.id(key); 
    const current = await manager.getFee(hashedKey);
    if (current === BigInt(value)) return;
    await sendTransactionWithRetries(async () => await manager.setServiceFee(hashedKey, value), `REGRA: Taxa '${key}'`);
}
async function setPStake(manager: any, key: string, value: number | bigint) {
    const hashedKey = ethers.id(key);
    const current = await manager.getServiceRequirements(hashedKey);
    if (current.pStake === BigInt(value)) return;
    await sendTransactionWithRetries(async () => await manager.setPStakeMinimum(hashedKey, value), `REGRA: pStake '${key}'`);
}

async function getOrCreateSpoke(hre: any, addresses: any, key: string, contractName: string, contractPath: string, args: any[]) {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    
    // Verifica se já existe
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
    
    // USA O DEPLOY COM RETRY
    const instance = await deployProxyWithRetries(Factory, args);
    
    const addr = await instance.getAddress();
    addresses[key] = addr;
    updateAddressJSON(key, addr);
    console.log(`   ✅ ${contractName} criado em: ${addr}`);
    
    await sleep(DEPLOY_DELAY_MS); // Pausa após deploy
    return instance;
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Fase 2) LANÇAMENTO OFICIAL & LIMPEZA | Rede: ${networkName}`);
  console.log(`👷 Engenheiro (Deployer): ${deployer.address}`);
  console.log("----------------------------------------------------");

  if (!fs.existsSync(addressesFilePath)) throw new Error("Arquivo deployment-addresses.json faltando.");
  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  // Instanciar Contratos Core
  const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, deployer);
  const bkcTokenInstance = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
  
  // Deploy Managers (Idempotente + Retry)
  const miningManagerInstance = await getOrCreateSpoke(hre, addresses, 'miningManager', 'MiningManager', 'contracts/MiningManager.sol:MiningManager', [addresses.ecosystemManager]); 
  const delegationManagerInstance = await getOrCreateSpoke(hre, addresses, 'delegationManager', 'DelegationManager', 'contracts/DelegationManager.sol:DelegationManager', [deployer.address, addresses.ecosystemManager]);
  
  // Update Hub Addresses (Parte 1)
  console.log("\n🔌 Atualizando Hub (Parte 1)...");
  await sendTransactionWithRetries(async () => await hub.setAddresses(
      addresses.bkcToken,
      addresses.treasuryWallet || deployer.address,
      addresses.delegationManager,
      addresses.rewardBoosterNFT,
      addresses.miningManager,
      addresses.decentralizedNotary || ethers.ZeroAddress,
      addresses.fortunePool || ethers.ZeroAddress,
      addresses.nftLiquidityPoolFactory || ethers.ZeroAddress
  ), "CONEXÃO: Hub Atualizado");

  // Deploy Spokes
  const notaryInstance = await getOrCreateSpoke(hre, addresses, 'decentralizedNotary', 'DecentralizedNotary', 'contracts/DecentralizedNotary.sol:DecentralizedNotary', [deployer.address, addresses.ecosystemManager]);
  const fortunePoolInstance = await getOrCreateSpoke(hre, addresses, 'fortunePool', 'FortunePool', 'contracts/FortunePool.sol:FortunePool', [deployer.address, addresses.ecosystemManager]);
  
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
      await sleep(DEPLOY_DELAY_MS);
  }
  
  let factoryInstance = await getOrCreateSpoke(hre, addresses, 'nftLiquidityPoolFactory', 'NFTLiquidityPoolFactory', 'contracts/NFTLiquidityPoolFactory.sol:NFTLiquidityPoolFactory', 
      [deployer.address, addresses.ecosystemManager, nftPoolImpAddr]
  );

  // Update Hub Final
  console.log("\n🔌 Atualizando Hub (Final)...");
  await sendTransactionWithRetries(async () => await hub.setAddresses(
      addresses.bkcToken, addresses.treasuryWallet || deployer.address, addresses.delegationManager, addresses.rewardBoosterNFT, addresses.miningManager,
      addresses.decentralizedNotary, addresses.fortunePool, addresses.nftLiquidityPoolFactory
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
      { key: "RENTAL_MARKET_TAX_BIPS", addr: addresses.rentalManager }
  ];
  
  for (const m of miners) {
      if(m.addr && m.addr.startsWith("0x")) {
          // Verifica se já está autorizado para economizar RPC
          const currentAuth = await mm.authorizedMiners(ethers.id(m.key));
          if (currentAuth.toLowerCase() !== m.addr.toLowerCase()) {
              await sendTransactionWithRetries(async () => await mm.setAuthorizedMiner(ethers.id(m.key), m.addr), `AUTH: ${m.key}`);
          }
      }
  }

  // Transfer Ownership BKC
  if ((await bkcTokenInstance.owner()).toLowerCase() === deployer.address.toLowerCase()) {
      await sendTransactionWithRetries(async () => await bkcTokenInstance.transferOwnership(addresses.miningManager), "SEGURANÇA: Controle BKC -> MiningManager");
  }

  // TGE & Distribuição
  try {
      // Verifica balance antes de tentar mintar para não falhar se já foi feito
      const miningManagerBal = await bkcTokenInstance.balanceOf(addresses.miningManager);
      if (miningManagerBal === 0n && (await bkcTokenInstance.totalSupply()) < TGE_SUPPLY_AMOUNT) {
          await sendTransactionWithRetries(async () => await miningManagerInstance.initialTgeMint(addresses.miningManager, TGE_SUPPLY_AMOUNT), "GÊNESE: Mint Inicial");
      }
  } catch(e) { console.log("   ⚠️ TGE já realizado ou erro não-crítico."); }

  const mmBal = await bkcTokenInstance.balanceOf(addresses.miningManager);
  if (mmBal > 0n) {
      const totalLiq = FORTUNE_POOL_LIQUIDITY_TOTAL + (LIQUIDITY_BKC_AMOUNT_PER_POOL * BigInt(ALL_TIERS.length)) + INITIAL_STAKE_AMOUNT;
      await sendTransactionWithRetries(async () => await miningManagerInstance.transferTokensFromGuardian(deployer.address, totalLiq), "SAQUE: Fundos Operacionais");
      
      const rest = await bkcTokenInstance.balanceOf(addresses.miningManager);
      if (rest > 0n) {
        await sendTransactionWithRetries(async () => await miningManagerInstance.transferTokensFromGuardian(deployer.address, rest), "SAQUE: Tesouraria");
      }
  }

  // Configuração Oráculo & Tiers Jogo
  const currOracle = await fortunePoolInstance.oracleAddress();
  if (currOracle.toLowerCase() !== addresses.oracleWalletAddress.toLowerCase()) {
      await sendTransactionWithRetries(async () => await fortunePoolInstance.setOracleAddress(addresses.oracleWalletAddress), "CONFIG: Oráculo");
  }
  for (const tier of FORTUNE_POOL_TIERS) {
      await sendTransactionWithRetries(async () => await fortunePoolInstance.setPrizeTier(tier.poolId, tier.chanceDenominator, tier.multiplierBips), `JOGO: Tier ${tier.poolId} (Mult: ${tier.multiplierBips} BIPS)`);
  }

  // Aplicação Regras JSON
  try {
      const configPath = path.join(__dirname, "../rules-config.json");
      if (fs.existsSync(configPath)) {
          const RULES = JSON.parse(fs.readFileSync(configPath, "utf8"));
          await setServiceFee(hub, "NOTARY_SERVICE", ethers.parseEther(RULES.serviceFees.NOTARY_SERVICE));
          await setPStake(hub, "NOTARY_SERVICE", BigInt(RULES.pStakeMinimums.NOTARY_SERVICE));
          await setServiceFee(hub, "NFT_POOL_ACCESS", ethers.parseEther(RULES.serviceFees.NFT_POOL_ACCESS));
          await setPStake(hub, "NFT_POOL_ACCESS", BigInt(RULES.pStakeMinimums.NFT_POOL_ACCESS));
          await setServiceFee(hub, "NFT_POOL_BUY_TAX_BIPS", BigInt(RULES.ammTaxFees.NFT_POOL_BUY_TAX_BIPS));
          await setServiceFee(hub, "NFT_POOL_SELL_TAX_BIPS", BigInt(RULES.ammTaxFees.NFT_POOL_SELL_TAX_BIPS));
      }
  } catch(e) {}

  console.log("\n=== PARTE 4: INJETANDO LIQUIDEZ E LIMPANDO CARTEIRA ===");

  // Abastecer Jogo
  if ((await bkcTokenInstance.balanceOf(addresses.fortunePool)) < FORTUNE_POOL_LIQUIDITY_TOTAL) {
      await sendTransactionWithRetries(async () => await bkcTokenInstance.approve(addresses.fortunePool, FORTUNE_POOL_LIQUIDITY_TOTAL), "APROVAR: Fortune Pool");
      await sendTransactionWithRetries(async () => await fortunePoolInstance.topUpPool(FORTUNE_POOL_LIQUIDITY_TOTAL), "DEPOSITAR: Fortune Pool");
  }

  // CRIAR POOLS E LIMPAR NFTs
  const rewardBoosterNFT = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, deployer);
  
  for (let i = 0; i < ALL_TIERS.length; i++) {
      const tier = ALL_TIERS[i];
      const targetTotal = MANUAL_LIQUIDITY_MINT_COUNT[i];
      
      console.log(`\n   --- Tier: ${tier.name} ---`);
      
      const poolKey = `pool_${tier.name.toLowerCase()}`;
      let poolAddress = addresses[poolKey];

      // 1. Criar Pool se não existir
      if (!poolAddress || !poolAddress.startsWith('0x')) {
          await sendTransactionWithRetries(async () => await factoryInstance.deployPool(tier.boostBips), `FÁBRICA: Novo Pool ${tier.name}`);
          poolAddress = await factoryInstance.getPoolAddress(tier.boostBips);
          updateAddressJSON(poolKey, poolAddress);
          await sleep(DEPLOY_DELAY_MS);
      }
      
      const poolInstance = await ethers.getContractAt("NFTLiquidityPool", poolAddress, deployer);
      const poolInfo = await poolInstance.getPoolInfo();
      
      if (poolInfo.nftCount > 0n) {
          console.log(`      ⏩ Pool já abastecido. Pulando.`);
          continue;
      }

      // 2. Autorizar Pool para Mineração (Com checagem para evitar erro)
      try {
          await sendTransactionWithRetries(async () => await mm.setAuthorizedMiner(ethers.id("NFT_POOL_BUY_TAX_BIPS"), poolAddress), `AUTH: Pool ${tier.name}`);
          await sendTransactionWithRetries(async () => await mm.setAuthorizedMiner(ethers.id("NFT_POOL_SELL_TAX_BIPS"), poolAddress), `AUTH: Pool ${tier.name}`);
      } catch(e) {}

      // 3. RECUPERAÇÃO INTELIGENTE: Verificar Órfãos
      const orphanIds = await findDeployerOrphanTokens(rewardBoosterNFT, deployer.address, tier.boostBips);
      let idsToDeposit: string[] = [...orphanIds];
      
      // 4. Calcular necessidade de Mint
      const currentCount = BigInt(idsToDeposit.length);
      const needed = targetTotal > currentCount ? targetTotal - currentCount : 0n;

      if (needed > 0n) {
          console.log(`      Fabricando ${needed} novos NFTs para completar estoque...`);
          // Loop para mintar em lotes pequenos se necessário
          for (let j = 0n; j < needed; j += CHUNK_SIZE_BIGINT) {
              const batch = needed - j < CHUNK_SIZE_BIGINT ? needed - j : CHUNK_SIZE_BIGINT;
              const tx = await sendTransactionWithRetries(async () => 
                  await rewardBoosterNFT.ownerMintBatch(deployer.address, Number(batch), tier.boostBips, tier.metadata),
                  `MINT: +${batch} ${tier.name}`
              );
              
              // Capturar IDs novos dos eventos
              if (tx) {
                  const logs = (tx.logs || []) as Log[];
                  const newIds = logs.map((log: Log) => { try { return rewardBoosterNFT.interface.parseLog(log as any); } catch { return null; } })
                      .filter((log: LogDescription | null): log is LogDescription => log !== null && log.name === "BoosterMinted")
                      .map((log: LogDescription) => log.args.tokenId.toString());
                  idsToDeposit.push(...newIds);
              }
              await sleep(2000); // Pausa entre lotes
          }
      } else {
          console.log(`      ✅ Estoque completo usando apenas NFTs recuperados!`);
          idsToDeposit = idsToDeposit.slice(0, Number(targetTotal)); 
      }

      // 5. Depositar no Pool (Esvaziar Carteira)
      if (idsToDeposit.length > 0) {
          console.log(`      Depositando ${idsToDeposit.length} NFTs no Pool...`);
          await sendTransactionWithRetries(async () => await bkcTokenInstance.approve(poolAddress, LIQUIDITY_BKC_AMOUNT_PER_POOL), `BANCO: Aprovando BKC`);
          await sendTransactionWithRetries(async () => await rewardBoosterNFT.setApprovalForAll(poolAddress, true), `ESTOQUE: Aprovando NFTs`);

          let isFirst = true;
          for (let k = 0; k < idsToDeposit.length; k += CHUNK_SIZE) {
              const chunk = idsToDeposit.slice(k, k + CHUNK_SIZE);
              if (isFirst) {
                  await sendTransactionWithRetries(async () => await poolInstance.addInitialLiquidity(chunk, LIQUIDITY_BKC_AMOUNT_PER_POOL), `MERCADO: Liquidez Inicial`);
                  isFirst = false;
              } else {
                  await sendTransactionWithRetries(async () => await poolInstance.addMoreNFTsToPool(chunk), `MERCADO: +Estoque`);
              }
              await sleep(2000); // Pausa entre depósitos
          }
          await sendTransactionWithRetries(async () => await rewardBoosterNFT.setApprovalForAll(poolAddress, false), `SEGURANÇA: Revogando`);
      }
  }

  // Genesis Stake
  if ((await delegationManagerInstance.totalNetworkPStake()) === 0n) {
      console.log("\n=== PARTE 5: GENESIS STAKE ===");
      await sendTransactionWithRetries(async () => await bkcTokenInstance.approve(addresses.delegationManager, INITIAL_STAKE_AMOUNT), `BANCO: Aprovando Stake`);
      await sendTransactionWithRetries(async () => await delegationManagerInstance.delegate(INITIAL_STAKE_AMOUNT, BigInt(INITIAL_STAKE_DURATION * 86400), 0), "STAKING: Genesis");
  }

  console.log("\n----------------------------------------------------");
  console.log("🎉🎉🎉 LANÇAMENTO CONCLUÍDO & CARTEIRA LIMPA! 🎉🎉🎉");
}

if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}