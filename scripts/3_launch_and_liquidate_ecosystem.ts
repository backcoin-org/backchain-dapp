// scripts/3_launch_and_liquidate_ecosystem.ts
import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { LogDescription, Log, ContractTransactionReceipt, BaseContract } from "ethers";

// ######################################################################
// ###               CONFIGURAÇÃO DE LANÇAMENTO DO ECOSSISTEMA        ###
// ######################################################################

const DEPLOY_DELAY_MS = 2000;
const CHUNK_SIZE = 150; // Tamanho do lote para mintagem de NFTs e adição de liquidez
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

const FORTUNE_POOL_ORACLE_FEE_ETH = "0.001"; 
const FORTUNE_POOL_LIQUIDITY_TOTAL = ethers.parseEther("1000000"); // 1M BKC

// Configuração do Jogo do Tigre (Fortune Pool)
const FORTUNE_POOL_TIERS = [
    { poolId: 1, multiplierBips: 10000n, chanceDenominator: 3n }, 
    { poolId: 2, multiplierBips: 100000n, chanceDenominator: 10n }, 
    { poolId: 3, multiplierBips: 1000000n, chanceDenominator: 100n } 
];

// Liquidez de BKC para parear com os NFTs (2M BKC por Pool)
const LIQUIDITY_BKC_AMOUNT_PER_POOL = ethers.parseEther("2000000"); 

// --- ATUALIZADO: TIERS SINCRONIZADOS ("BEST SYSTEM") ---
const ALL_TIERS = [
  { tierId: 0, name: "Diamond", boostBips: 7000n, metadata: "diamond_booster.json" }, // 70%
  { tierId: 1, name: "Platinum", boostBips: 6000n, metadata: "platinum_booster.json" }, // 60%
  { tierId: 2, name: "Gold", boostBips: 5000n, metadata: "gold_booster.json" }, // 50%
  { tierId: 3, name: "Silver", boostBips: 4000n, metadata: "silver_booster.json" }, // 40%
  { tierId: 4, name: "Bronze", boostBips: 3000n, metadata: "bronze_booster.json" }, // 30%
  { tierId: 5, name: "Iron", boostBips: 2000n, metadata: "iron_booster.json" }, // 20%
  { tierId: 6, name: "Crystal", boostBips: 1000n, metadata: "crystal_booster.json" }, // 10%
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

async function sendTransactionWithRetries(txFunction: () => Promise<any>, description: string, retries = 5): Promise<ContractTransactionReceipt | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const tx = await txFunction();
      console.log(`   ⏳ Enviando: ${description}...`);
      const receipt = await tx.wait();
      if (!receipt) { throw new Error("Transação enviada, mas o recibo retornou nulo."); }
      
      console.log(`   ✅ [SUCESSO] ${description}`);
      console.log(`      └── Hash: ${receipt.hash}`);
      
      await sleep(1500);
      return receipt as ContractTransactionReceipt;
    } catch (error: any) {
      const errorMessage = error.message || JSON.stringify(error);
      
      // Tratamento de erros conhecidos para não falhar o script desnecessariamente
      if (errorMessage.includes("already") || errorMessage.includes("Already")) {
             console.log(`   ⚠️ Nota: Ação já realizada anteriormente (${description}). Continuando...`);
             return null;
      }

      // Erros de rede ou nonce
      if ((errorMessage.includes("nonce") || errorMessage.includes("replacement fee") || errorMessage.includes("network")) && i < retries - 1) {
        const waitTime = 5000 * (i + 1);
        console.warn(`   ⚠️ Erro temporário (${description}). Tentativa ${i + 1}/${retries}. Aguardando ${waitTime/1000}s...`);
        await sleep(waitTime);
      } else if (errorMessage.includes("ReentrancyGuard: reentrant call")) {
        throw new Error(`❌ FALHA (${description}): Erro de ReentrancyGuard.`);
      } else {
        // Log detalhado para debug
        console.error(`❌ FALHA (${description}): ${errorMessage}`);
        if (i === retries - 1) throw new Error(`A transação falhou após ${retries} tentativas: ${errorMessage}`);
      }
    }
  }
  return null;
}

// --- Funções Auxiliares de Regras ---

async function setServiceFee(manager: any, key: string, value: number | bigint) {
    const hashedKey = ethers.id(key); 
    const current = await manager.getFee(hashedKey);
    if (current === BigInt(value)) {
        console.log(`   ⏩ Taxa ${key} já definida como ${value}. Pulando.`);
        return;
    }
    await sendTransactionWithRetries(() => manager.setServiceFee(hashedKey, value), `REGRA: Taxa '${key}' = ${value}`);
}

async function setPStake(manager: any, key: string, value: number | bigint) {
    const hashedKey = ethers.id(key);
    const current = await manager.getServiceRequirements(hashedKey);
    if (current.pStake === BigInt(value)) {
         console.log(`   ⏩ pStake ${key} já definido como ${value}. Pulando.`);
         return;
    }
    await sendTransactionWithRetries(() => manager.setPStakeMinimum(hashedKey, value), `REGRA: pStake '${key}' = ${value}`);
}

async function setMiningDistributionBips(manager: any, key: string, value: number | bigint) {
    const hashedKey = ethers.id(key);
    const current = await manager.getMiningDistributionBips(hashedKey);
    if (current === BigInt(value)) return;
    await sendTransactionWithRetries(() => manager.setMiningDistributionBips(hashedKey, value), `ECONOMIA: Mineração '${key}' = ${value} BIPS`);
}

async function setFeeDistributionBips(manager: any, key: string, value: number | bigint) {
    const hashedKey = ethers.id(key);
    const current = await manager.getFeeDistributionBips(hashedKey);
    if (current === BigInt(value)) return;
    await sendTransactionWithRetries(() => manager.setFeeDistributionBips(hashedKey, value), `ECONOMIA: Taxas '${key}' = ${value} BIPS`);
}

async function getOrCreateSpoke(
    hre: HardhatRuntimeEnvironment,
    addresses: { [key: string]: string },
    key: string,
    contractName: string,
    contractPath: string,
    initializerArgs: any[],
) {
    const { ethers, upgrades } = hre;
    const [deployer] = await ethers.getSigners();

    // Verifica se o endereço existe e tem código (não é uma EOA vazia ou endereço inválido)
    if (addresses[key] && addresses[key].startsWith("0x")) {
        const code = await ethers.provider.getCode(addresses[key]);
        if (code !== "0x") {
            const instance = await ethers.getContractAt(contractName, addresses[key], deployer);
            console.log(`   ⚠️ ${contractName} já existe. Carregado de: ${addresses[key]}`);
            return instance;
        }
    } 
    
    console.log(`   🔨 Implantando ${contractName}...`);
    const ContractFactory = await ethers.getContractFactory(contractPath.split(":")[1] || contractName); // Lida com "Path:ContractName"
    const instance = await upgrades.deployProxy(ContractFactory, initializerArgs, { kind: "uups" });
    await instance.waitForDeployment();
    const addr = await instance.getAddress();
    addresses[key] = addr;
    updateAddressJSON(key, addr); 
    console.log(`   ✅ ${contractName} criado em: ${addr}`);
    await sleep(DEPLOY_DELAY_MS);
    return instance;
}


export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers, upgrades } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 (Fase 2) LANÇAMENTO OFICIAL | Rede: ${networkName}`);
  console.log(`👷 Engenheiro (Deployer): ${deployer.address}`);
  console.log("----------------------------------------------------");

  if (!fs.existsSync(addressesFilePath)) {
    throw new Error("Arquivo deployment-addresses.json faltando. Execute '1_deploy_full_initial_setup.ts' primeiro.");
  }
  const addresses: { [key: string]: string } = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  // Verifica se o Rental Manager foi implantado no passo 1
  if (!addresses.rentalManager) {
      console.warn("⚠️ AVISO: Endereço 'rentalManager' não encontrado. Verifique se o script 1 foi executado corretamente.");
  }

  const { ecosystemManager, rewardBoosterNFT, publicSale, oracleWalletAddress } = addresses;
  
  if (!ecosystemManager || !rewardBoosterNFT || !publicSale || !oracleWalletAddress) {
    throw new Error("Faltam endereços chave no JSON. Rode o script 1 novamente.");
  }

  const hub = await ethers.getContractAt("EcosystemManager", ecosystemManager, deployer);
  let bkcTokenInstance: any;
  let miningManagerInstance: any;
  let delegationManagerInstance: any;
  let notaryInstance: any;
  let fortunePoolInstance: any;
  
  try {
    // ##############################################################
    // ### PARTE 1: CONSTRUÇÃO (IMPLANTAR CONTRATOS QUE FALTAM) ###
    // ##############################################################
    console.log("\n=== PARTE 1: CONSTRUÇÃO DA INFRAESTRUTURA ===");
    
    bkcTokenInstance = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);

    miningManagerInstance = await getOrCreateSpoke(hre, addresses, 'miningManager', 'MiningManager', 'contracts/MiningManager.sol:MiningManager', 
        [addresses.ecosystemManager]
    ); 
    
    delegationManagerInstance = await getOrCreateSpoke(hre, addresses, 'delegationManager', 'DelegationManager', 'contracts/DelegationManager.sol:DelegationManager',
        [deployer.address, addresses.ecosystemManager]
    );
    
    // Configurar Hub com Managers
    const currentTreasury = await hub.getTreasuryAddress();
    const currentBooster = await hub.getBoosterAddress();
    const currentBKC = await hub.getBKCTokenAddress();
    addresses.treasuryWallet = currentTreasury; // Cache para uso local

    // Verifica se precisa atualizar endereços no Hub
    const currentMMInHub = await hub.getMiningManagerAddress();
    const currentDMInHub = await hub.getDelegationManagerAddress();
    const currentNotaryInHub = await hub.getDecentralizedNotaryAddress();
    
    const needsHubUpdate = 
        currentMMInHub !== addresses.miningManager ||
        currentDMInHub !== addresses.delegationManager ||
        (addresses.decentralizedNotary && currentNotaryInHub !== addresses.decentralizedNotary);

    if (needsHubUpdate) {
        console.log("\n🔌 Conectando Cérebro (Hub) aos novos Órgãos...");
        await sendTransactionWithRetries(() => hub.setAddresses(
            currentBKC,
            currentTreasury,
            addresses.delegationManager,
            currentBooster,
            addresses.miningManager,
            addresses.decentralizedNotary || ethers.ZeroAddress,
            addresses.fortunePool || ethers.ZeroAddress,
            addresses.nftLiquidityPoolFactory || ethers.ZeroAddress
        ), "CONEXÃO: Registrando Managers no Hub");
    }

    notaryInstance = await getOrCreateSpoke(hre, addresses, 'decentralizedNotary', 'DecentralizedNotary', 'contracts/DecentralizedNotary.sol:DecentralizedNotary',
        [deployer.address, addresses.ecosystemManager]
    );
    fortunePoolInstance = await getOrCreateSpoke(hre, addresses, 'fortunePool', 'FortunePool', 'contracts/FortunePool.sol:FortunePool', 
        [deployer.address, addresses.ecosystemManager]
    );
    
    // Template do Pool
    let nftPoolImplementationAddress = addresses.nftLiquidityPool_Implementation;
    if (!nftPoolImplementationAddress || !nftPoolImplementationAddress.startsWith("0x")) {
        console.log("Implantando Template do Pool...");
        const NFTLiquidityPool = await ethers.getContractFactory("NFTLiquidityPool");
        const nftPoolImplementation = await NFTLiquidityPool.deploy();
        await nftPoolImplementation.waitForDeployment();
        nftPoolImplementationAddress = await nftPoolImplementation.getAddress();
        addresses.nftLiquidityPool_Implementation = nftPoolImplementationAddress;
        updateAddressJSON("nftLiquidityPool_Implementation", nftPoolImplementationAddress);
        console.log(`   ✅ Template criado em: ${nftPoolImplementationAddress}`);
    }
    
    // Factory dos Pools
    let factoryInstance: BaseContract;
    const factoryAddress = addresses.nftLiquidityPoolFactory;
    if (!factoryAddress || !factoryAddress.startsWith("0x")) {
        console.log("Implantando Fábrica de Pools...");
        const NFTLiquidityPoolFactory = await ethers.getContractFactory("NFTLiquidityPoolFactory");
        factoryInstance = await upgrades.deployProxy(
            NFTLiquidityPoolFactory, 
            [
                deployer.address, 
                addresses.ecosystemManager, 
                nftPoolImplementationAddress
            ], 
            { initializer: "initialize", kind: "uups" }
        );
        await factoryInstance.waitForDeployment();
        const addr = await factoryInstance.getAddress();
        addresses.nftLiquidityPoolFactory = addr;
        updateAddressJSON("nftLiquidityPoolFactory", addr);
        console.log(`   ✅ Fábrica criada em: ${addr}`);
    } else {
        factoryInstance = await ethers.getContractAt("NFTLiquidityPoolFactory", factoryAddress, deployer);
    }
    
    // ##############################################################
    // ### PARTE 2: AUTORIZAÇÕES E PERMISSÕES (CRÍTICO) ###
    // ##############################################################
    console.log("\n=== PARTE 2: ASSINANDO CONTRATOS & PERMISSÕES ===");

    // Atualiza Hub novamente com novos endereços (Notary, Fortune, Factory) se necessário
    const notaryInHubCheck = await hub.getDecentralizedNotaryAddress();
    const fortuneInHubCheck = await hub.getFortunePoolAddress();
    
    if (notaryInHubCheck !== addresses.decentralizedNotary || fortuneInHubCheck !== addresses.fortunePool) {
        console.log("\n2.1. Atualizando lista telefônica do Hub...");
        await sendTransactionWithRetries(() => hub.setAddresses(
            addresses.bkcToken,
            addresses.treasuryWallet,
            addresses.delegationManager,
            addresses.rewardBoosterNFT,
            addresses.miningManager,
            addresses.decentralizedNotary,
            addresses.fortunePool,
            addresses.nftLiquidityPoolFactory
        ), "CONEXÃO FINAL: Hub Completo");
    }

    const mm = miningManagerInstance;
    
    // Autorizações de Mineração (Core)
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner(ethers.id("TIGER_GAME_SERVICE"), addresses.fortunePool), 
        "AUTH: Jogo do Tigre (PoP)"
    );
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner(ethers.id("NOTARY_SERVICE"), addresses.decentralizedNotary), 
        "AUTH: Cartório (PoP)"
    );
    
    // Autorizações Staking
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner(ethers.id("UNSTAKE_FEE_BIPS"), addresses.delegationManager), 
        "AUTH: Taxa de Unstake"
    );
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner(ethers.id("FORCE_UNSTAKE_PENALTY_BIPS"), addresses.delegationManager), 
        "AUTH: Penalidade Unstake Forçado"
    );
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner(ethers.id("CLAIM_REWARD_FEE_BIPS"), addresses.delegationManager), 
        "AUTH: Taxa Resgate Lucros"
    );
    await sendTransactionWithRetries(() => mm.setAuthorizedMiner(ethers.id("DELEGATION_FEE_BIPS"), addresses.delegationManager), 
        "AUTH: Taxa Entrada Stake"
    ); 

    // --- AUTORIZAÇÃO DO RENTAL MARKET (AirBNFT) ---
    if (addresses.rentalManager && addresses.rentalManager.startsWith("0x")) {
        console.log("   + Autorizando RentalManager para Mineração...");
        await sendTransactionWithRetries(() => mm.setAuthorizedMiner(
            ethers.id("RENTAL_MARKET_TAX_BIPS"), // Chave de taxa definida no contrato
            addresses.rentalManager
        ), "AUTH: Rental Market (PoP)");
    }

    // Transferência de Propriedade BKC
    const currentOwner = await bkcTokenInstance.owner(); 
    if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log("\n⚠️ ATENÇÃO: Passando controle da 'Impressora'...");
        await sendTransactionWithRetries(() => bkcTokenInstance.transferOwnership(addresses.miningManager), 
            "SEGURANÇA: Controle do BKC -> MiningManager"
        );
        console.log(`   ✅ Sistema Autônomo ativado.`);
    } else {
        console.log(`   ⏩ Sistema já é autônomo (Token Owner correto).`);
    }
    
    // TGE Mint (Mint Inicial)
    // Verifica se já foi mintado antes de tentar
    try {
        const treasuryBalance = await bkcTokenInstance.balanceOf(addresses.treasuryWallet);
        // Heurística: Se o tesouro já tem um saldo grande, assumimos que o TGE ocorreu
        if (treasuryBalance > 0n) {
             console.log("   ⏩ TGE provavelmente já realizado (Saldo no Tesouro). Pulando mint.");
        } else {
             await sendTransactionWithRetries(() => 
                miningManagerInstance.initialTgeMint(addresses.miningManager, TGE_SUPPLY_AMOUNT), 
                "GÊNESE: Mint Inicial (TGE)"
            );
        }
    } catch (e: any) {
        if (e.message.includes("TGE already minted") || e.message.includes("reverted")) { 
            console.log("   ⏩ Gênese já realizada (Erro de contrato)."); 
        }
        else { throw e; }
    }
    
    // Distribuição de Fundos
    const mmBalance = await bkcTokenInstance.balanceOf(addresses.miningManager);
    const totalLiquidityForDeployer = FORTUNE_POOL_LIQUIDITY_TOTAL + (LIQUIDITY_BKC_AMOUNT_PER_POOL * BigInt(ALL_TIERS.length)) + INITIAL_STAKE_AMOUNT;
    const remainingForAirdrop = TGE_SUPPLY_AMOUNT - totalLiquidityForDeployer;

    if (mmBalance > 0n) {
        console.log(`   Distribuindo fundos iniciais...`);
        await sendTransactionWithRetries(() => 
            miningManagerInstance.transferTokensFromGuardian(deployer.address, totalLiquidityForDeployer), 
            "DISTRIBUIÇÃO: Liquidez Pools/Jogos"
        );
        await sendTransactionWithRetries(() => 
            miningManagerInstance.transferTokensFromGuardian(deployer.address, remainingForAirdrop), 
            "DISTRIBUIÇÃO: Tesouraria/Airdrop"
        );
    } else {
         console.log("   ⏩ Distribuição já concluída.");
    }
    
    // Configuração Oráculo
    try {
        const currentOracle = await fortunePoolInstance.oracleAddress();
        if(currentOracle.toLowerCase() !== addresses.oracleWalletAddress.toLowerCase()) {
             await sendTransactionWithRetries(() => fortunePoolInstance.setOracleAddress(addresses.oracleWalletAddress), 
                "CONFIG: Endereço Oráculo"
            );
        }
        
        const currentOracleFee = await fortunePoolInstance.oracleFeeInWei();
        const targetFee = ethers.parseEther(FORTUNE_POOL_ORACLE_FEE_ETH);
        if(currentOracleFee !== targetFee) {
             await sendTransactionWithRetries(() => fortunePoolInstance.setOracleFee(targetFee), 
                "CONFIG: Taxa Oráculo"
            );
        }
    } catch (e: any) { console.warn(`   ⚠️ Erro ao configurar Oráculo: ${e.message}`); }


    // ##############################################################
    // ### PARTE 3: APLICANDO REGRAS ECONÔMICAS ###
    // ##############################################################
    console.log("\n=== PARTE 3: APLICANDO REGRAS ECONÔMICAS ===");

    try {
        for (const tier of FORTUNE_POOL_TIERS) {
            // Tenta definir, se falhar assume que já está setado (otimização)
            await sendTransactionWithRetries(() => fortunePoolInstance.setPrizeTier(tier.poolId, tier.chanceDenominator, tier.multiplierBips), 
                `JOGO: Configurando Tier ${tier.poolId}`
            );
        }
    } catch (e) { console.warn("Pulando configuração de tiers do Fortune (Erro não crítico)"); }

    // Tenta ler o rules-config.json se existir
    try {
        const configPath = path.join(__dirname, "../rules-config.json");
        if (fs.existsSync(configPath)) {
            const RULES = JSON.parse(fs.readFileSync(configPath, "utf8"));
            
            // Core Services
            await setServiceFee(hub, "NOTARY_SERVICE", ethers.parseEther(RULES.serviceFees.NOTARY_SERVICE));
            await setPStake(hub, "NOTARY_SERVICE", BigInt(RULES.pStakeMinimums.NOTARY_SERVICE));
            
            await setServiceFee(hub, "FORTUNE_POOL_SERVICE", ethers.parseEther(RULES.serviceFees.FORTUNE_POOL_SERVICE));
            await setPStake(hub, "FORTUNE_POOL_SERVICE", BigInt(RULES.pStakeMinimums.FORTUNE_POOL_SERVICE));

            await setServiceFee(hub, "NFT_POOL_ACCESS", ethers.parseEther(RULES.serviceFees.NFT_POOL_ACCESS));
            await setPStake(hub, "NFT_POOL_ACCESS", BigInt(RULES.pStakeMinimums.NFT_POOL_ACCESS));

            // Staking Fees
            await setServiceFee(hub, "DELEGATION_FEE_BIPS", BigInt(RULES.stakingFees.DELEGATION_FEE_BIPS));
            await setServiceFee(hub, "UNSTAKE_FEE_BIPS", BigInt(RULES.stakingFees.UNSTAKE_FEE_BIPS));
            await setServiceFee(hub, "FORCE_UNSTAKE_PENALTY_BIPS", BigInt(RULES.stakingFees.FORCE_UNSTAKE_PENALTY_BIPS));
            await setServiceFee(hub, "CLAIM_REWARD_FEE_BIPS", BigInt(RULES.stakingFees.CLAIM_REWARD_FEE_BIPS));

            // Rental Market (Fallback seguro)
            if (RULES.rentalFees) {
                 await setServiceFee(hub, "RENTAL_MARKET_TAX_BIPS", BigInt(RULES.rentalFees.TAX_BIPS));
                 await setPStake(hub, "RENTAL_MARKET_ACCESS", BigInt(RULES.rentalFees.PSTAKE_MIN));
            }

            // AMM Tax
            await setServiceFee(hub, "NFT_POOL_BUY_TAX_BIPS", BigInt(RULES.ammTaxFees.NFT_POOL_BUY_TAX_BIPS));
            await setServiceFee(hub, "NFT_POOL_SELL_TAX_BIPS", BigInt(RULES.ammTaxFees.NFT_POOL_SELL_TAX_BIPS));
            
            // Distributions
            const md = RULES.miningDistribution;
            await setMiningDistributionBips(hub, "TREASURY", BigInt(md.TREASURY));
            // Validator Pool removido/mesclado, ajuste conforme seu contrato MiningManager
            await setMiningDistributionBips(hub, "DELEGATOR_POOL", BigInt(md.DELEGATOR_POOL));

            const fd = RULES.feeDistribution;
            await setFeeDistributionBips(hub, "TREASURY", BigInt(fd.TREASURY));
            await setFeeDistributionBips(hub, "DELEGATOR_POOL", BigInt(fd.DELEGATOR_POOL));
        } else {
             console.log("   ℹ️ rules-config.json não encontrado. Pulando configurações finas.");
        }

    } catch (e: any) { 
        console.log(`   ⚠️ Erro ao aplicar regras do JSON: ${e.message}`); 
    }


    // ##############################################################
    // ### PARTE 4: SEMEAR ECOSSISTEMA (LIQUIDEZ) ###
    // ##############################################################
    console.log("\n=== PARTE 4: INJETANDO LIQUIDEZ NOS SISTEMAS ===");

    // Abastecer Jogo do Tigre
    const fpBalance = await bkcTokenInstance.balanceOf(addresses.fortunePool);
    if (fpBalance < FORTUNE_POOL_LIQUIDITY_TOTAL) {
        console.log(`\n4.1. Abastecendo FortunePool...`);
        await sendTransactionWithRetries(() => 
            bkcTokenInstance.approve(addresses.fortunePool, FORTUNE_POOL_LIQUIDITY_TOTAL), 
            "BANCO: Aprovando envio Fortune"
        );
        await sendTransactionWithRetries(() => fortunePoolInstance.topUpPool(FORTUNE_POOL_LIQUIDITY_TOTAL), 
            "BANCO: Depositando 1M BKC"
        );
    } else {
        console.log(`   ⏩ Fortune já abastecido.`);
    }

    // Criar Pools de NFT
    console.log("\n4.2. Criando Mercados de NFT (Pools)...");

    const rewardBoosterNFT = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, deployer);
    const factoryInstanceLoaded = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, deployer);

    for (let i = 0; i < ALL_TIERS.length; i++) {
        const tier = ALL_TIERS[i];
        const initialMintAmount = MANUAL_LIQUIDITY_MINT_COUNT[i]; 

        console.log(`\n   --- Tier: ${tier.name} (ID ${tier.tierId}) | Boost: ${tier.boostBips} ---`);

        const poolKey = `pool_${tier.name.toLowerCase()}`;
        let poolAddress = addresses[poolKey];

        // Buscar ou Criar Pool
        if (!poolAddress || !poolAddress.startsWith('0x')) {
            console.log(`      Buscando Pool...`);
            poolAddress = await factoryInstanceLoaded.getPoolAddress(tier.boostBips);
            
            if (poolAddress === ethers.ZeroAddress) {
                console.log(`      Criando novo Pool...`);
                await sendTransactionWithRetries(() => factoryInstanceLoaded.deployPool(tier.boostBips), 
                    `FÁBRICA: Criando Pool ${tier.name}`
                );
                poolAddress = await factoryInstanceLoaded.getPoolAddress(tier.boostBips);
            }
            updateAddressJSON(poolKey, poolAddress);
            console.log(`      📍 Pool: ${poolAddress}`);
        } else {
             console.log(`      📍 Pool (Cache): ${poolAddress}`);
        }
        
        const poolInstance = await ethers.getContractAt("NFTLiquidityPool", poolAddress, deployer);
        const poolInfo = await poolInstance.getPoolInfo();
        
        if (poolInfo.nftCount > 0n) { 
            console.log(`      ⏩ Mercado com liquidez. Pulando mint.`); 
            continue; 
        }

        console.log(`      Autorizando Pool no MiningManager...`);
        try {
            // Usando try-catch pois pode já estar autorizado
            await sendTransactionWithRetries(() => 
                mm.setAuthorizedMiner(ethers.id("NFT_POOL_BUY_TAX_BIPS"), poolAddress), 
                `AUTH: Pool ${tier.name} (Compra)`
            );
            await sendTransactionWithRetries(() => 
                mm.setAuthorizedMiner(ethers.id("NFT_POOL_SELL_TAX_BIPS"), poolAddress), 
                `AUTH: Pool ${tier.name} (Venda)`
            );
        } catch(e) {}

        console.log(`      Fabricando ${initialMintAmount} NFTs...`);
        const allPoolTokenIds: string[] = [];
        
        // Lógica de Mintagem em Lotes (Chunking)
        for (let j = 0n; j < initialMintAmount; j += CHUNK_SIZE_BIGINT) {
            const remaining = initialMintAmount - j;
            const amountToMint = remaining < CHUNK_SIZE_BIGINT ? remaining : CHUNK_SIZE_BIGINT;
            
            const tx = await sendTransactionWithRetries(() =>
                rewardBoosterNFT.ownerMintBatch(deployer.address, Number(amountToMint), tier.boostBips, tier.metadata), 
                `MINT: Lote de ${amountToMint}`
            );
            
            // Captura IDs dos eventos para adicionar ao pool
            if(tx) {
                 const logs = (tx.logs || []) as Log[];
                 const ids = logs.map((log: Log) => { try { return rewardBoosterNFT.interface.parseLog(log as any); } catch { return null; } })
                    .filter((log: LogDescription | null): log is LogDescription => log !== null && log.name === "BoosterMinted")
                    .map((log: LogDescription) => log.args.tokenId.toString());
                 allPoolTokenIds.push(...ids);
            }
        }
        
        // Adicionar Liquidez
        if (allPoolTokenIds.length > 0) {
            await sendTransactionWithRetries(() => bkcTokenInstance.approve(poolAddress, LIQUIDITY_BKC_AMOUNT_PER_POOL), `BANCO: Aprovando BKC`);
            await sendTransactionWithRetries(() => rewardBoosterNFT.setApprovalForAll(poolAddress, true), `ESTOQUE: Aprovando NFTs`);

            console.log(`      Inaugurando mercado...`);
            let isFirstChunk = true;
            // Adiciona liquidez também em lotes para evitar estouro de gás
            for (let k = 0; k < allPoolTokenIds.length; k += CHUNK_SIZE) {
                const chunk = allPoolTokenIds.slice(k, k + CHUNK_SIZE);
                if (isFirstChunk) {
                    await sendTransactionWithRetries(() => 
                        poolInstance.addInitialLiquidity(chunk, LIQUIDITY_BKC_AMOUNT_PER_POOL), 
                        `MERCADO: Liquidez Inicial`
                    );
                    isFirstChunk = false;
                } else {
                    await sendTransactionWithRetries(() => poolInstance.addMoreNFTsToPool(chunk), 
                        `MERCADO: +Estoque`
                    );
                }
            }
            await sendTransactionWithRetries(() => rewardBoosterNFT.setApprovalForAll(poolAddress, false), `SEGURANÇA: Revogando permissões`);
            console.log(`      ✅ Mercado ${tier.name} ABERTO!`);
        }
    }
    
    // ##############################################################
    // ### PARTE 5: STAKE INICIAL ###
    // ##############################################################
    console.log("\n=== PARTE 5: GENESIS STAKE ===");

    const dm = delegationManagerInstance;
    const totalPStake = await dm.totalNetworkPStake();
    
    if (totalPStake > 0n) {
         console.log(`   ⏩ Rede já possui validadores.`);
    } else {
         console.log(`   Realizando Genesis Stake...`);
         await sendTransactionWithRetries(() => bkcTokenInstance.approve(addresses.delegationManager, INITIAL_STAKE_AMOUNT), 
            `BANCO: Aprovando Stake`
         );
         const lockDurationSeconds = BigInt(INITIAL_STAKE_DURATION * 24 * 3600);
         await sendTransactionWithRetries(() => dm.delegate(INITIAL_STAKE_AMOUNT, lockDurationSeconds, 0), 
            "STAKING: Genesis Validador Criado"
         );
         console.log(`   ✅ Rede Segura!`);
    }

  } catch (error: any) {
    console.error("\n❌ ERRO CRÍTICO:", error.message);
    process.exit(1);
  }

  console.log("\n----------------------------------------------------");
  console.log("\n🎉🎉🎉 ECOSSISTEMA BEST SYSTEM ATIVO! 🎉🎉🎉");
}

if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}