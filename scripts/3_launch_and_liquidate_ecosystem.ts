// scripts/3_launch_and_liquidate_ecosystem.ts (Lançamento do Ecossistema e Liquidez Pós-Venda)

import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { LogDescription, Log, ContractTransactionReceipt, BaseContract } from "ethers";

// ######################################################################
// ###               CONFIGURAÇÃO GERAL DO ECOSSISTEMA              ###
// ######################################################################

const DEPLOY_DELAY_MS = 2000;
const CONFIG_DELAY_MS = 1500;
const CHUNK_SIZE = 150;
const CHUNK_SIZE_BIGINT = BigInt(CHUNK_SIZE);

// --- SIMULAÇÃO DE CUNHAGEM MANUAL PARA LIQUIDEZ (TESTE) ---
const MANUAL_LIQUIDITY_MINT_COUNT = [
    10n, // Tier 0 (Diamond) - 10 NFTs
    20n, // Tier 1 (Platinum) - 20 NFTs
    30n, // Tier 2 (Gold) - 30 NFTs
    40n, // Tier 3 (Silver) - 40 NFTs
    50n, // Tier 4 (Bronze) - 50 NFTs
    60n, // Tier 5 (Iron) - 60 NFTs
    70n  // Tier 6 (Crystal) - 70 NFTs
];
// -------------------------------------------------------------------


// --- 1. Taxa do Oráculo ---
const FORTUNE_POOL_ORACLE_FEE_ETH = "0.001"; 

// --- 2. CONFIGURAÇÃO DE LIQUIDEZ DO FORTUNE POOL ---
const FORTUNE_POOL_LIQUIDITY_TOTAL = ethers.parseEther("1000000"); // 1,000,000 BKC

// ✅ AJUSTADO PARA A NOVA LÓGICA DE JOGO (1x, 10x, 100x com chances 1/3, 1/10, 1/100)
const FORTUNE_POOL_TIERS = [
    { 
        poolId: 1, 
        multiplierBips: 10000n, // 1x
        chanceDenominator: 3n, // 1/3 chance
    },
    { 
        poolId: 2, 
        multiplierBips: 100000n, // 10x
        chanceDenominator: 10n, // 1/10 chance
    },
    { 
        poolId: 3, 
        multiplierBips: 1000000n, // 100x
        chanceDenominator: 100n, // 1/100 chance
    }
];

// --- 3. AMM LIQUIDEZ CONFIG ---
const LIQUIDITY_BKC_AMOUNT_PER_POOL = ethers.parseEther("2000000"); // 2,000,000 BKC por Tier NFT
const AIRDROP_AMOUNT = ethers.parseEther("25000000"); // 25,000,000 BKC para airdrop/vendas

const ALL_TIERS = [
  { tierId: 0, name: "Diamond", boostBips: 5000n, metadata: "diamond_booster.json" },
  { tierId: 1, name: "Platinum", boostBips: 4000n, metadata: "platinum_booster.json" },
  { tierId: 2, name: "Gold", boostBips: 3000n, metadata: "gold_booster.json" },
  { tierId: 3, name: "Silver", boostBips: 2000n, metadata: "silver_booster.json" },
  { tierId: 4, name: "Bronze", boostBips: 1000n, metadata: "bronze_booster.json" },
  { tierId: 5, name: "Iron", boostBips: 500n, metadata: "iron_booster.json" },
  { tierId: 6, name: "Crystal", boostBips: 100n, metadata: "crystal_booster.json" },
];
// --- SUPRIMENTO TOTAL TGE (40M) ---
const TGE_SUPPLY_AMOUNT = 40_000_000n * 10n**18n; 
// ######################################################################


// --- Funções Auxiliares (MANTIDAS) ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendTransactionWithRetries(txFunction: () => Promise<any>, retries = 3): Promise<ContractTransactionReceipt> {
  for (let i = 0; i < retries; i++) {
    try {
      const tx = await txFunction();
      const receipt = await tx.wait();
      if (!receipt) { throw new Error("Transação enviada, mas um recibo nulo foi retornado."); }
      await sleep(1500);
      return receipt as ContractTransactionReceipt;
    } catch (error: any) {
      if ((error.message.includes("nonce") || error.message.includes("in-flight")) && i < retries - 1) {
        console.warn(`   ⚠️ Problema de nonce detectado. Tentando novamente em ${5000} segundos...`);
        await sleep(5000);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Transação falhou após múltiplas tentativas.");
}

// Funções auxiliares para configuração (CORRIGIDAS)
async function setServiceFee(manager: any, key: string, value: number | bigint) {
    // setServiceFee é usado para taxas em BKC (Wei) ou BIPS de staking/AMM
    await sendTransactionWithRetries(() => manager.setServiceFee(key, value));
    console.log(`   -> Taxa de Serviço/Staking definida: ${key} = ${value.toString()}`);
    await sleep(CONFIG_DELAY_MS / 2); 
}

// Esta função define o mínimo de pStake (em BigInt)
async function setPStake(manager: any, key: string, value: number | bigint) {
    await sendTransactionWithRetries(() => manager.setPStakeMinimum(key, value));
    console.log(`   -> pStake Mínimo definido: ${key} = ${value}`);
    await sleep(CONFIG_DELAY_MS / 2);
}

// Esta função encapsula a configuração de taxa e pStake mínimo para um serviço
async function setService(manager: any, serviceKey: string, feeValue: number | bigint, pStakeValue: number | bigint) {
    console.log(`\nConfigurando Serviço: ${serviceKey}...`);
    await setServiceFee(manager, serviceKey, feeValue); // Usa a função corrigida setServiceFee
    await setPStake(manager, serviceKey, pStakeValue);
}

// Funções para Mineração (Valor em BIPS)
async function setMiningDistributionBips(manager: any, key: string, value: number | bigint) {
    await sendTransactionWithRetries(() => manager.setMiningDistributionBips(key, value));
    console.log(`   -> Distribuição de Mineração definida: ${key} = ${value.toString()} BIPS`);
    await sleep(CONFIG_DELAY_MS / 2); 
}

async function setMiningBonusBips(manager: any, key: string, value: number | bigint) {
    await sendTransactionWithRetries(() => manager.setMiningBonusBips(key, value));
    console.log(`   -> Bônus de Mineração definido: ${key} = ${value.toString()} BIPS`);
    await sleep(CONFIG_DELAY_MS / 2); 
}


/**
 * Funções auxiliares para carregamento/deploy de Spokes
 */
async function getOrCreateSpoke(
    hre: HardhatRuntimeEnvironment,
    addresses: { [key: string]: string },
    key: keyof typeof addresses,
    contractName: string,
    contractPath: string,
    initializerArgs: any[], // <--- Argumentos para a função initialize
) {
    const { ethers, upgrades } = hre;
    const [deployer] = await ethers.getSigners();
    const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");


    if (addresses[key] && addresses.hasOwnProperty(key) && addresses[key].startsWith("0x")) {
        // Carregar se já estiver implantado (MODO RETOMADA)
        const instance = await ethers.getContractAt(contractName, addresses[key], deployer);
        console.log(`   ⚠️ ${contractName} já implantado. Carregado em: ${addresses[key]}`);
        return instance;
    } else {
        // Implantar e salvar
        const ContractFactory = await ethers.getContractFactory(contractPath);
        
        // Passando initializerArgs para satisfazer a assinatura de initialize()
        const instance = await upgrades.deployProxy(ContractFactory, initializerArgs, { 
            kind: "uups" 
        });
        await instance.waitForDeployment();
        addresses[key] = await instance.getAddress();
        fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
        console.log(`   ✅ ${contractName} (Proxy) implantado e inicializado em: ${addresses[key]}`);
        
        // RETORNAMOS A INSTÂNCIA
        return instance;
    }
}
const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");


export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers, upgrades } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(
    `🚀 (Passo 3/X) Implantando, Configurando e Abastecendo o Ecossistema na rede: ${networkName}`
  );
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 0. Carregar Endereços ---
  if (!fs.existsSync(addressesFilePath)) {
    throw new Error("Faltando deployment-addresses.json. Execute 1_deploy_full_initial_setup.ts primeiro.");
  }
  const addresses: { [key: string]: string } = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  const { ecosystemManager, rewardBoosterNFT, publicSale, oracleWalletAddress } = addresses;
  
  if (!ecosystemManager || !rewardBoosterNFT || !publicSale || !oracleWalletAddress) {
    throw new Error("Faltando endereços principais (ecosystemManager, rewardBoosterNFT, publicSale, oracleWalletAddress) no JSON.");
  }
  if (!FORTUNE_POOL_ORACLE_FEE_ETH || ethers.parseEther(FORTUNE_POOL_ORACLE_FEE_ETH) <= 0n) {
       throw new Error("ERRO: Por favor, defina um valor para 'FORTUNE_POOL_ORACLE_FEE_ETH'.");
  }

  const hub = await ethers.getContractAt("EcosystemManager", ecosystemManager, deployer);
  let bkcTokenInstance: any;
  let miningManagerInstance: any;
  let delegationManagerInstance: any;
  let notaryInstance: any;
  let fortunePoolInstance: any;
  
  try {
    // ##############################################################
    // ### PARTE 1: IMPLANTAR NOVOS SPOKES (Recarrega Contratos) ###
    // ##############################################################
    console.log("=== PARTE 1: RECARREGANDO SPOKES E IMPLANTANDO NOVOS ===");
    
    // 1.1. BKCToken
    bkcTokenInstance = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
    console.log(`\n1.1. BKCToken (Proxy) carregado em: ${addresses.bkcToken}`);

    // Implantação dos contratos CORE (MM e DM) que serão referenciados pelo Notary
    // MM e DM
    miningManagerInstance = await getOrCreateSpoke(hre, addresses, 'miningManager', 'MiningManager', 'MiningManager', 
        [addresses.ecosystemManager] // Args: _ecosystemManagerAddress
    ); 
    
    // ✅ AJUSTE CRÍTICO: DelegaionManager precisa ser inicializado com o Owner/Deployer
    delegationManagerInstance = await getOrCreateSpoke(hre, addresses, 'delegationManager', 'DelegationManager', 'contracts/DelegationManager.sol:DelegationManager',
        [deployer.address, addresses.ecosystemManager] // Args: _initialOwner, _ecosystemManagerAddress
    );
    
    // 1.2. ATUALIZAÇÃO CRÍTICA DO HUB (CORREÇÃO para o erro "Notary: Core contracts not set")
    // Obtemos endereços da Fase 1, que o Hub já tem.
    const currentTreasury = await hub.getTreasuryAddress(); // Endereço temporário do deployer
    const currentBooster = await hub.getBoosterAddress();
    const currentBKC = await hub.getBKCTokenAddress();

    // ✅ AJUSTE: Garante que o Treasury Wallet é persistido no JSON para evitar reverso.
    addresses.treasuryWallet = currentTreasury;
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));


    console.log("\n1.2. Atualização CRÍTICA do Hub (MM e DM) para permitir inicialização dos Spokes...");
    
    // Usamos setAddresses, preenchendo os 8 campos.
    await sendTransactionWithRetries(() => hub.setAddresses(
        currentBKC,                               // _bkcToken (Mantido)
        currentTreasury,                          // _treasuryWallet (Mantido)
        addresses.delegationManager,              // _delegationManager (NOVO)
        currentBooster,                           // _rewardBooster (Mantido)
        addresses.miningManager,                  // _miningManager (NOVO)
        addresses.decentralizedNotary || ethers.ZeroAddress, // Placeholder seguro
        addresses.fortunePool || ethers.ZeroAddress, // Placeholder seguro
        addresses.nftLiquidityPoolFactory || ethers.ZeroAddress // Placeholder seguro
    ));
    console.log(`   ✅ Hub atualizado com DM e MM.`);
    await sleep(DEPLOY_DELAY_MS);
    
    // 1.3. Implantação de Notary e FortunePool (Que agora podem ler DM/MM do Hub)
    console.log("\n1.3. Implantando Spokes que dependem dos Core Contracts no Hub...");
    
    // DecentralizedNotary
    notaryInstance = await getOrCreateSpoke(hre, addresses, 'decentralizedNotary', 'DecentralizedNotary', 'contracts/DecentralizedNotary.sol:DecentralizedNotary',
        [deployer.address, addresses.ecosystemManager] // Args: _initialOwner, _ecosystemManagerAddress
    );

    // FortunePool
    fortunePoolInstance = await getOrCreateSpoke(hre, addresses, 'fortunePool', 'FortunePool', 'FortunePool', 
        [deployer.address, addresses.ecosystemManager] // Args: _initialOwner, _ecosystemManagerAddress
    );
    
    // --- (REFA) INÍCIO: Implantação da Fábrica de Piscinas NFT ---
    
    // 1.4. Implantar a Implementação (Molde) do NFTLiquidityPool
    console.log("\n1.4. Implantando Implementação (Molde) do NFTLiquidityPool...");
    let nftPoolImplementationAddress = addresses.nftLiquidityPool_Implementation;
    
    if (!nftPoolImplementationAddress || !nftPoolImplementationAddress.startsWith("0x")) {
        const NFTLiquidityPool = await ethers.getContractFactory("NFTLiquidityPool");
        const nftPoolImplementation = await NFTLiquidityPool.deploy();
        await nftPoolImplementation.waitForDeployment();
        nftPoolImplementationAddress = await nftPoolImplementation.getAddress();
        addresses.nftLiquidityPool_Implementation = nftPoolImplementationAddress;
        fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
        console.log(`   ✅ Implementação (Molde) implantada em: ${nftPoolImplementationAddress}`);
    } else {
        console.log(`   ⚠️ Implementação (Molde) já implantada em: ${nftPoolImplementationAddress}`);
    }
    
    // 1.5. Implantar a FÁBRICA (Proxy UUPS)
    console.log("\n1.5. Implantando NFTLiquidityPoolFactory (Proxy)...");
    let factoryInstance: BaseContract;
    const factoryAddress = addresses.nftLiquidityPoolFactory;

    if (!factoryAddress || !factoryAddress.startsWith("0x")) {
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
        addresses.nftLiquidityPoolFactory = await factoryInstance.getAddress();
        fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
        console.log(`   ✅ NFTLiquidityPoolFactory (Proxy) implantada em: ${addresses.nftLiquidityPoolFactory}`);
    } else {
        factoryInstance = await ethers.getContractAt("NFTLiquidityPoolFactory", factoryAddress, deployer);
        console.log(`   ⚠️ NFTLiquidityPoolFactory (Proxy) já implantada. Carregada em: ${factoryAddress}`);
    }
    // --- (REFA) FIM: Implantação da Fábrica de Piscinas NFT ---
    
    console.log(`\n✅ Todos os Spokes implantados/carregados e endereços salvos.`);
    console.log(`   (Contratos inicializados durante o deploy, exceto Hub e BKCToken.)`);
    await sleep(DEPLOY_DELAY_MS);


    // ##############################################################
    // ### PARTE 2: CONFIGURAÇÃO DE CONEXÕES E POSSE ###
    // ##############################################################
    console.log("\n=== PARTE 2: CONFIGURANDO CONEXÕES E POSSE ===");

    await sleep(20000); // Pausa
    console.log("   (Pausa de 20s concluída. Retomando configuração...)");

    // Declara 'tx' como 'let'
    let tx;
    
    // 2.1. Conexões do Hub (EcosystemManager) - ATUALIZAÇÃO FINAL
    console.log("\n2.1. Atualizando o Hub com todos os endereços restantes (MM, DM, Notary, FortunePool, Factory)...");
    
    // ✅ AJUSTE CRÍTICO: Obtendo o Treasury Wallet do JSON (garante que ele seja o mesmo da Parte 1.2)
    const finalTreasury = addresses.treasuryWallet; 

    // Usamos setAddresses, preenchendo todos os 8 campos com os valores finais.
    await sendTransactionWithRetries(() => hub.setAddresses(
        addresses.bkcToken,
        finalTreasury,                            // Treasury (Endereço do Deployer)
        addresses.delegationManager,
        addresses.rewardBoosterNFT,
        addresses.miningManager,
        addresses.decentralizedNotary,            // Endereço Final
        addresses.fortunePool,                    // Endereço Final
        addresses.nftLiquidityPoolFactory         // Endereço Final
    ));
    console.log(`   ✅ Cérebro atualizado com todos os 8 endereços.`);

    // 2.2. Inicializar Spokes (NADA A FAZER AQUI - FEITO NA PARTE 1)
    console.log("\n2.2. Verificação de Inicialização: Ignorando inicializações duplicadas.");


    // 2.3. Autorizando Miners no Guardião (MiningManager)
    console.log("\n2.3. Autorizando Spokes no Guardião (MiningManager)...");
    
    // Autoriza FortunePool
    console.log(`   -> Autorizando TIGER_GAME_SERVICE (FortunePool)...`);
    await sendTransactionWithRetries(() => miningManagerInstance.setAuthorizedMiner("TIGER_GAME_SERVICE", addresses.fortunePool)); 
    
    // Autoriza Notary
    console.log(`   -> Autorizando NOTARY_SERVICE (DecentralizedNotary)...`);
    await sendTransactionWithRetries(() => miningManagerInstance.setAuthorizedMiner("NOTARY_SERVICE", addresses.decentralizedNotary)); 
    
    // 💡 CORREÇÃO CRÍTICA PARA O ERRO: MM: Caller not authorized for service
    // O DelegationManager (DM) é quem paga a taxa de registro, logo ele deve ser o minerador autorizado.
    console.log(`   -> AUTORIZANDO VALIDATOR_REGISTRATION_FEE (DelegationManager)...`);
    await sendTransactionWithRetries(() => miningManagerInstance.setAuthorizedMiner(
        "VALIDATOR_REGISTRATION_FEE", 
        addresses.delegationManager // O DelegationManager é o caller
    ));
    // 💡 FIM DA CORREÇÃO
    
    console.log(`   ✅ Spokes autorizados.`);

    // 2.4. Transfer BKCToken Ownership to MiningManager
    console.log("\n2.4. (PASSO CRÍTICO) Transferindo posse do BKCToken para o MiningManager...");
    const currentOwner = await bkcTokenInstance.owner(); 
    if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
        await sendTransactionWithRetries(() => bkcTokenInstance.transferOwnership(addresses.miningManager));
        console.log(`   ✅ POSSE TRANSFERIDA! MiningManager é o único minter.`);
    } else if (currentOwner.toLowerCase() === addresses.miningManager.toLowerCase()) {
        console.log(`   ⚠️ AVISO: POSSE JÁ TRANSFERIDA! MiningManager já é o proprietário. Continuando.`);
    } else {
        throw new Error(`❌ ERRO: A posse do BKCToken pertence a ${currentOwner}, não ao Deployer. Não é possível cunhar.`);
    }
    
    // 2.5. Mint TGE Supply
    console.log(`\n2.5. Cunhando TGE Supply (${ethers.formatEther(TGE_SUPPLY_AMOUNT)} BKC) para o MiningManager...`);
    try {
        await sendTransactionWithRetries(() => 
            miningManagerInstance.initialTgeMint(addresses.miningManager, TGE_SUPPLY_AMOUNT)
        );
        console.log(`   ✅ TGE de ${ethers.formatEther(TGE_SUPPLY_AMOUNT)} BKC cunhado PARA o MiningManager.`);
    } catch (e: any) {
        if (e.message.includes("TGE already minted")) { console.log("   ⚠️ TGE já cunhado."); }
        else { throw e; }
    }
    
    // 2.6. Distribuir TGE Supply do MiningManager
    console.log(`\n2.6. Distribuindo TGE Supply do Guardião (${ethers.formatEther(TGE_SUPPLY_AMOUNT)} BKC)...`);
    const totalLiquidityForDeployer = FORTUNE_POOL_LIQUIDITY_TOTAL + (LIQUIDITY_BKC_AMOUNT_PER_POOL * BigInt(ALL_TIERS.length));
    const airdropWallet = deployer.address; 
    
    if (TGE_SUPPLY_AMOUNT < totalLiquidityForDeployer) {
        throw new Error("Configuração de TGE inválida. O TGE é menor que a liquidez necessária.");
    }
    const remainingForAirdrop = TGE_SUPPLY_AMOUNT - totalLiquidityForDeployer;

    console.log(`   -> Transferindo ${ethers.formatEther(totalLiquidityForDeployer)} BKC do Guardião para o Deployer (para Liquidez)...`);
    try {
        await sendTransactionWithRetries(() => 
            miningManagerInstance.transferTokensFromGuardian(deployer.address, totalLiquidityForDeployer)
        );
        console.log(`   ✅ Deployer financiado.`);
    } catch (e: any) {
        if (e.message.includes("transfer amount exceeds balance")) {
             console.warn(`   ⚠️  Guardian não tem saldo BKC. A cunhagem (2.5) pode ter sido pulada.`);
        } else {
             console.warn(`   ⚠️  Falha ao transferir para Deployer (talvez já feito): ${e.message}`);
        }
    }
    
    if (remainingForAirdrop > 0n) {
        console.log(`   -> Transferindo ${ethers.formatEther(remainingForAirdrop)} BKC do Guardião para a Carteira de Airdrop (${airdropWallet})...`);
        try {
            await sendTransactionWithRetries(() => 
                miningManagerInstance.transferTokensFromGuardian(airdropWallet, remainingForAirdrop)
            );
             console.log(`   ✅ Airdrop financiado.`);
        } catch (e: any) {
             console.warn(`   ⚠️  Falha ao transferir para Airdrop (talvez já feito): ${e.message}`);
        }
    }
    
    // 2.7. Configurar Oráculo
    console.log("\n2.7. Autorizando Oráculo no FortunePool e definindo taxa...");
    try {
        await sendTransactionWithRetries(() => fortunePoolInstance.setOracleAddress(addresses.oracleWalletAddress));
        await sendTransactionWithRetries(() => fortunePoolInstance.setOracleFee(ethers.parseEther(FORTUNE_POOL_ORACLE_FEE_ETH)));
        console.log(`   ✅ Oráculo (${addresses.oracleWalletAddress}) autorizado com taxa de ${FORTUNE_POOL_ORACLE_FEE_ETH} ETH/BNB.`);
    } catch (e: any) { console.warn(`   ⚠️ Falha ao configurar oráculo (talvez já feito): ${e.message}`); }


    // ##############################################################
    // ### PARTE 3: CONFIGURAÇÃO DE TAXAS E REGRAS INICIAIS ###
    // ##############################################################
    console.log("\n=== PARTE 3: CONFIGURAÇÃO DE TAXAS E REGRAS INICIAIS ===");

    // 3.1. Configuração do FortunePool
    console.log("\n3.1. Configurando as 3 piscinas de prêmios (Lógica 'Highest Prize Wins')...");
    try {
        for (const tier of FORTUNE_POOL_TIERS) {
            await sendTransactionWithRetries(() => fortunePoolInstance.setPrizeTier(tier.poolId, tier.chanceDenominator, tier.multiplierBips));
            console.log(`   -> Tier ${tier.poolId} (Mult: ${Number(tier.multiplierBips)/10000}x, Chance: 1/${tier.chanceDenominator.toString()}) configurado.`);
        }
    } catch (e: any) { console.warn(`   ⚠️ Falha ao configurar Tiers (talvez já feito): ${e.message}`); }


    // 3.2. Configurando todas as taxas e pStake no Hub
    console.log("\n3.2. Configurando Taxas e Mínimos de pStake (Hub) com base no rules-config.json...");
    // A lógica de configuração de regras foi movida para 4_manage_rules.ts
    // Mas as regras iniciais devem ser setadas aqui.

    const RULES_TO_APPLY = JSON.parse(fs.readFileSync(path.join(__dirname, "../rules-config.json"), "utf8"));
    
    try {
        // Serviços (Taxa em Wei + pStake Mínimo)
        await setService(hub, "NOTARY_SERVICE", ethers.parseEther(RULES_TO_APPLY.serviceFees.NOTARY_SERVICE), BigInt(RULES_TO_APPLY.pStakeMinimums.NOTARY_SERVICE));
        await setService(hub, "FORTUNE_POOL_SERVICE", ethers.parseEther(RULES_TO_APPLY.serviceFees.FORTUNE_POOL_SERVICE), BigInt(RULES_TO_APPLY.pStakeMinimums.FORTUNE_POOL_SERVICE));
        await setService(hub, "NFT_POOL_ACCESS", ethers.parseEther(RULES_TO_APPLY.serviceFees.NFT_POOL_ACCESS), BigInt(RULES_TO_APPLY.pStakeMinimums.NFT_POOL_ACCESS));
        
        // Taxa de Registro do Validador (NOVA TAXA FIXA - EM WEI)
        await setServiceFee(hub, "VALIDATOR_REGISTRATION_FEE", ethers.parseEther(RULES_TO_APPLY.serviceFees.VALIDATOR_REGISTRATION_FEE)); 

        // Taxas de Staking (BIPS)
        await setServiceFee(hub, "UNSTAKE_FEE_BIPS", BigInt(RULES_TO_APPLY.stakingFees.UNSTAKE_FEE_BIPS));
        await setServiceFee(hub, "FORCE_UNSTAKE_PENALTY_BIPS", BigInt(RULES_TO_APPLY.stakingFees.FORCE_UNSTAKE_PENALTY_BIPS));
        await setServiceFee(hub, "CLAIM_REWARD_FEE_BIPS", BigInt(RULES_TO_APPLY.stakingFees.CLAIM_REWARD_FEE_BIPS));

        // Impostos AMM NFT (BIPS)
        await setServiceFee(hub, "NFT_POOL_TAX_BIPS", BigInt(RULES_TO_APPLY.ammTaxFees.NFT_POOL_TAX_BIPS));
        await setServiceFee(hub, "NFT_POOL_TAX_TREASURY_SHARE_BIPS", BigInt(RULES_TO_APPLY.ammTaxFees.NFT_POOL_TAX_TREASURY_SHARE_BIPS));
        await setServiceFee(hub, "NFT_POOL_TAX_DELEGATOR_SHARE_BIPS", BigInt(RULES_TO_APPLY.ammTaxFees.NFT_POOL_TAX_DELEGATOR_SHARE_BIPS));
        await setServiceFee(hub, "NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS", BigInt(RULES_TO_APPLY.ammTaxFees.NFT_POOL_TAX_LIQUIDITY_SHARE_BIPS));

        // Distribuição de Mineração (BIPS)
        await setMiningDistributionBips(hub, "TREASURY", BigInt(RULES_TO_APPLY.miningDistribution.TREASURY));
        await setMiningDistributionBips(hub, "VALIDATOR_POOL", BigInt(RULES_TO_APPLY.miningDistribution.VALIDATOR_POOL));
        await setMiningDistributionBips(hub, "DELEGATOR_POOL", BigInt(RULES_TO_APPLY.miningDistribution.DELEGATOR_POOL));

        // Bônus de Mineração (BIPS)
        await setMiningBonusBips(hub, "FORTUNE_POOL_SERVICE", BigInt(RULES_TO_APPLY.miningBonuses.FORTUNE_POOL_SERVICE));
        await setMiningBonusBips(hub, "NOTARY_SERVICE", BigInt(RULES_TO_APPLY.miningBonuses.NOTARY_SERVICE));
        await setMiningBonusBips(hub, "VALIDATOR_REGISTRATION_FEE", BigInt(RULES_TO_APPLY.miningBonuses.VALIDATOR_REGISTRATION_FEE)); // Novo Bônus

        console.log(`   ✅ Todas as regras e taxas iniciais foram definidas no Cérebro.`);
    } catch (e: any) { console.warn(`   ⚠️ Falha ao configurar Taxas/Regras: ${e.message}`); }


    // ##############################################################
    // ### PARTE 4: ABASTECER O ECOSSISTEMA (LIQUIDEZ) ###
    // ##############################################################
    console.log("\n=== PARTE 4: ABASTECENDO O ECOSSISTEMA (LIQUIDEZ) ===");

    // 4.1. Liquidez do Fortune Pool
    console.log(`\n4.1. Abastecendo o FortunePool com ${ethers.formatEther(FORTUNE_POOL_LIQUIDITY_TOTAL)} $BKC...`);
    
    try {
        await sendTransactionWithRetries(() => 
            bkcTokenInstance.approve(addresses.fortunePool, FORTUNE_POOL_LIQUIDITY_TOTAL)
        );
        console.log(`   ✅ Aprovação do Deployer para FortunePool concluída.`);

        await sendTransactionWithRetries(() => fortunePoolInstance.topUpPool(FORTUNE_POOL_LIQUIDITY_TOTAL));
        console.log(`   ✅ Saldo de ${ethers.formatEther(FORTUNE_POOL_LIQUIDITY_TOTAL)} BKC injetado na PrizePool.`); // CORRIGIDO AQUI
    } catch (e: any) {
        if (e.message.includes("transfer amount exceeds balance")) {
            console.warn(`   ⚠️  Deployer não tem saldo BKC. A distribuição (2.6) pode ter sido pulada.`);
        } else {
            console.warn(`   ⚠️  Falha ao abastecer FortunePool (talvez já feito): ${e.message}`);
        }
    }


    // 4.2. Liquidez do NFT AMM (Lógica de Teste de Cunhagem Manual)
    console.log("\n4.2. Cunhagem de NFTs e Abastecimento das Piscinas AMM (Modo Fábrica)...");

    const rewardBoosterNFT = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, deployer);
    const factoryInstanceLoaded = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, deployer);

    // Loop de Cunhagem e Adição de Liquidez (USANDO A LISTA MANUAL PARA TESTE)
    for (let i = 0; i < ALL_TIERS.length; i++) {
        const tier = ALL_TIERS[i];
        const initialMintAmount = MANUAL_LIQUIDITY_MINT_COUNT[i]; // QTD manual para teste

        console.log(`\n   --- Processando liquidez para: ${tier.name} (Tier ${tier.tierId}) ---`);
        
        if (initialMintAmount === 0n) { 
            console.log(`   ⚠️ Quantidade de cunhagem manual é zero. Pulando.`); 
            continue; 
        }

        console.log(`      -> Verificando/Implantando Pool Clone para ${tier.boostBips} bips...`);
        let poolAddress = await factoryInstanceLoaded.getPoolAddress(tier.boostBips);
        
        if (poolAddress === ethers.ZeroAddress) {
            console.log(`         ... Piscina não encontrada. Implantando via Fábrica...`);
            tx = await sendTransactionWithRetries(() => factoryInstanceLoaded.deployPool(tier.boostBips));
            
            const logs = (tx.logs as Log[])
                .map((log: Log) => { try { return factoryInstanceLoaded.interface.parseLog(log as any); } catch { return null; } })
                .filter((log: LogDescription | null): log is LogDescription => log !== null && log.name === "PoolDeployed");

            if (logs.length > 0) {
                poolAddress = logs[0].args.poolAddress;
                console.log(`         ✅ Piscina Clone implantada em: ${poolAddress}`);
            } else {
                throw new Error("Falha ao implantar a piscina: Evento 'PoolDeployed' não encontrado.");
            }
        } else {
            console.log(`         ... Piscina já existe em: ${poolAddress}`);
        }

        const poolKey = `pool_${tier.name.toLowerCase()}`;
        addresses[poolKey] = poolAddress;
        fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
        
        const poolInstance = await ethers.getContractAt("NFTLiquidityPool", poolAddress, deployer);
        const poolInfo = await poolInstance.getPoolInfo(); 
        
        if (poolInfo.nftCount > 0) { 
            console.warn(`   ⚠️ Pool em ${poolAddress} já tem liquidez. Pulando adição de AMM.`); 
            continue; 
        }
        
        console.log(`   NFTs para Cunhar (Teste Manual): ${initialMintAmount}`);

        // Cunhagem dos NFTs (Em lote)
        const allPoolTokenIds: string[] = [];
        for (let j = 0n; j < initialMintAmount; j += CHUNK_SIZE_BIGINT) {
            const remaining = initialMintAmount - j;
            const amountToMint = remaining < CHUNK_SIZE_BIGINT ? remaining : CHUNK_SIZE_BIGINT;
            
            const receipt = await sendTransactionWithRetries(() =>
                rewardBoosterNFT.ownerMintBatch(deployer.address, Number(amountToMint), tier.boostBips, tier.metadata)
            );
            
            const tokenIdsInChunk = (receipt.logs as Log[])
                .map((log: Log) => { try { return rewardBoosterNFT.interface.parseLog(log as any); } catch { return null; } })
                .filter((log: LogDescription | null): log is LogDescription => log !== null && log.name === "BoosterMinted")
                .map((log: LogDescription) => log.args.tokenId.toString());
            allPoolTokenIds.push(...tokenIdsInChunk);
        }
        
        // Adição de Liquidez
        console.log(`      -> Adicionando ${allPoolTokenIds.length} NFTs e ${ethers.formatEther(LIQUIDITY_BKC_AMOUNT_PER_POOL)} BKC ao POOL CLONE em ${poolAddress}...`);
        
        console.log(`         ... Aprovando BKC para ${poolAddress}`);
        await sendTransactionWithRetries(() => bkcTokenInstance.approve(poolAddress, LIQUIDITY_BKC_AMOUNT_PER_POOL));
        console.log(`         ... Aprovando NFTs para ${poolAddress}`);
        await sendTransactionWithRetries(() => rewardBoosterNFT.setApprovalForAll(poolAddress, true));

        let isFirstChunk = true;
        for (let k = 0; k < allPoolTokenIds.length; k += CHUNK_SIZE) {
            const chunk = allPoolTokenIds.slice(k, k + CHUNK_SIZE);
            if (isFirstChunk) {
                await sendTransactionWithRetries(() => 
                    poolInstance.addInitialLiquidity(chunk, LIQUIDITY_BKC_AMOUNT_PER_POOL)
                );
                isFirstChunk = false;
            } else {
                await sendTransactionWithRetries(() => poolInstance.addMoreNFTsToPool(chunk));
            }
        }
        
        // Revoga a aprovação deste pool específico
        await sendTransactionWithRetries(() => rewardBoosterNFT.setApprovalForAll(poolAddress, false));
        console.log(`   ✅ Liquidez para ${tier.name} adicionada e aprovação revogada.`);
    }

  } catch (error: any) {
    console.error("\n❌ Falha grave no Lançamento/Liquidação:", error.message);
    process.exit(1);
  }

  console.log("\n----------------------------------------------------");
  console.log("\n🎉🎉🎉 LANÇAMENTO DE ECOSSISTEMA E LIQUIDEZ PÓS-VENDA CONCLUÍDOS! 🎉🎉🎉");
  console.log("O ecossistema está totalmente implantado, configurado e abastecido.");
  console.log("\nPróximo passo: Execute '4_register_validator.ts' para registrar o primeiro validador.");
}

// Bloco de entrada para execução standalone
if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}