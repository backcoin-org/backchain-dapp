// scripts/1_deploy_full_initial_setup.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { BigNumberish } from "ethers";

// Função auxiliar para atrasos (delays)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEPLOY_DELAY_MS = 15000; // Tempo seguro para redes de teste (15s)

// --- CONFIGURAÇÃO CRÍTICA (Fase 1) ---

// 1. URI DO IPFS (Nova pasta com metadados atualizados)
const IPFS_BASE_URI_BOOSTERS =
  "ipfs://bafybeibtfnc6zgeiayglticrk2bqqgleybpgageh723grbdtsdddoicwtu/";

const DEFAULT_ORACLE_ADDRESS = "0xd7e622124b78a28c4c928b271fc9423285804f98";

// 2. TIERS OTIMIZADOS ("Best System")
// Lógica: Boost Bips = Discount Bips (Ex: 70% de Força = 70% de Desconto)
const TIERS_TO_SETUP = [
  // Tier 0: Diamond (+70% Boost / -70% Taxas)
  { tierId: 0, maxSupply: 1000000, priceETH: "3.60", boostBips: 7000, metadata: "diamond_booster.json", discountBips: 7000 }, 
  // Tier 1: Platinum (+60% Boost / -60% Taxas)
  { tierId: 1, maxSupply: 1000000, priceETH: "1.44", boostBips: 6000, metadata: "platinum_booster.json", discountBips: 6000 }, 
  // Tier 2: Gold (+50% Boost / -50% Taxas)
  { tierId: 2, maxSupply: 1000000, priceETH: "0.54", boostBips: 5000, metadata: "gold_booster.json", discountBips: 5000 }, 
  // Tier 3: Silver (+40% Boost / -40% Taxas)
  { tierId: 3, maxSupply: 1000000, priceETH: "0.27", boostBips: 4000, metadata: "silver_booster.json", discountBips: 4000 }, 
  // Tier 4: Bronze (+30% Boost / -30% Taxas)
  { tierId: 4, maxSupply: 1000000, priceETH: "0.144", boostBips: 3000, metadata: "bronze_booster.json", discountBips: 3000 }, 
  // Tier 5: Iron (+20% Boost / -20% Taxas)
  { tierId: 5, maxSupply: 1000000, priceETH: "0.07", boostBips: 2000, metadata: "iron_booster.json", discountBips: 2000 }, 
  // Tier 6: Crystal (+10% Boost / -10% Taxas)
  { tierId: 6, maxSupply: 1000000, priceETH: "0.01", boostBips: 1000, metadata: "crystal_booster.json", discountBips: 1000 }, 
];

const INITIAL_FEES_TO_SET = {
    "DELEGATION_FEE_BIPS": 0,            // Taxa de Entrada no Stake (0%)
    "UNSTAKE_FEE_BIPS": 100,             // Taxa de Saída Padrão (1%)
    "FORCE_UNSTAKE_PENALTY_BIPS": 500,   // Penalidade Saída Forçada (5%)
    "CLAIM_REWARD_FEE_BIPS": 50,         // Taxa de Resgate de Lucros (0.5%)
    
    // --- [NOVO] Taxas do AirBNFT (Rental Market) ---
    "RENTAL_MARKET_TAX_BIPS": 500,       // 5% do valor do aluguel vai para o ecossistema
    "RENTAL_MARKET_ACCESS": 0            // 0 pStake necessário inicialmente para alugar
};
// ----------------------------------------

const addressesFilePath = path.join(
    __dirname,
    "../deployment-addresses.json"
  );

function deleteAddressesFileOnError() {
    if (fs.existsSync(addressesFilePath)) {
        fs.unlinkSync(addressesFilePath);
        console.log("\n==========================================================");
        console.log("🗑️ Arquivo 'deployment-addresses.json' deletado automaticamente devido ao erro.");
        console.log("⚠️ Você pode executar o script novamente com segurança.");
        console.log("==========================================================");
    }
}

function updateAddressJSON(key: string, value: string) {
    const currentAddresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
    currentAddresses[key] = value;
    fs.writeFileSync(addressesFilePath, JSON.stringify(currentAddresses, null, 2));
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers, upgrades } = hre; 
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(
    `🚀 (Fase 1: Setup OTIMIZADO + AirBNFT) Implantando Sistema na rede: ${networkName}`
  );
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  if (!IPFS_BASE_URI_BOOSTERS.includes("ipfs://")) {
    throw new Error("IPFS_BASE_URI_BOOSTERS deve ser definido e começar com 'ipfs://'");
  }

  const addresses: { [key: string]: string } = {};
  
  // Limpeza inicial do arquivo de endereços
  if (fs.existsSync(addressesFilePath)) {
       fs.unlinkSync(addressesFilePath);
       console.log(`(Limpeza: Arquivo anterior 'deployment-addresses.json' removido)`);
  }
  fs.writeFileSync(addressesFilePath, JSON.stringify({}, null, 2));


  let boosterNFT: any;
  let saleContract: any;
  let bkcTokenInstance: any;
  let rentalManagerInstance: any;
  let tx; 

  try {
    // =================================================================
    // === PASSO 1: IMPLANTAR CONTRATOS CHAVE & PRÉ-VENDA (PROXIES) ===
    // =================================================================

    // 1.1. EcosystemManager (Hub)
    console.log("1.1. Implantando EcosystemManager (Hub UUPS)...");
    const EcosystemManager = await ethers.getContractFactory("EcosystemManager");
    const ecosystemManager = await upgrades.deployProxy(
      EcosystemManager,
      [deployer.address],
      { initializer: "initialize", kind: "uups" }
    );
    await ecosystemManager.waitForDeployment();
    addresses.ecosystemManager = await ecosystemManager.getAddress();
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ EcosystemManager (Proxy) implantado em: ${addresses.ecosystemManager}`);
    await sleep(DEPLOY_DELAY_MS);

    // 1.2. RewardBoosterNFT (Factory)
    console.log("\n1.2. Implantando RewardBoosterNFT (Factory) como Proxy...");
    const RewardBoosterNFT = await ethers.getContractFactory("RewardBoosterNFT");
    boosterNFT = await upgrades.deployProxy(
        RewardBoosterNFT,
        [deployer.address], 
        { initializer: "initialize" } // UUPS já embutido na herança
    );
    await boosterNFT.waitForDeployment();
    addresses.rewardBoosterNFT = await boosterNFT.getAddress();
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ RewardBoosterNFT (Proxy) implantado em: ${addresses.rewardBoosterNFT}`);
    await sleep(DEPLOY_DELAY_MS);

    // 1.3. PublicSale (Loja)
    console.log("\n1.3. Implantando PublicSale (Loja UUPS)...");
    const PublicSale = await ethers.getContractFactory("PublicSale");
    saleContract = await upgrades.deployProxy(
      PublicSale,
      [
        addresses.rewardBoosterNFT,
        addresses.ecosystemManager,
        deployer.address
      ],
      { initializer: "initialize", kind: "uups" }
    );
    await saleContract.waitForDeployment();
    addresses.publicSale = await saleContract.getAddress();
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ PublicSale (Proxy) implantado em: ${addresses.publicSale}`);
    await sleep(DEPLOY_DELAY_MS);

    // =================================================================
    // === PASSO 2: IMPLANTAR UTILITÁRIOS DO CORE ===
    // =================================================================

    // 2.1. BKCToken
    console.log("\n2.1. Implantando BKCToken (Proxy)...");
    const BKCToken = await ethers.getContractFactory("BKCToken");
    bkcTokenInstance = await upgrades.deployProxy(
        BKCToken,
        [deployer.address], 
        { initializer: "initialize" }
    );
    await bkcTokenInstance.waitForDeployment();
    addresses.bkcToken = await bkcTokenInstance.getAddress();
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ BKCToken (Proxy) implantado em: ${addresses.bkcToken}`);
    await sleep(DEPLOY_DELAY_MS);
    
    // 2.2. SimpleBKCFaucet
    console.log("\n2.2. Implantando SimpleBKCFaucet (Utilidade) como Proxy...");
    const SimpleBKCFaucet = await ethers.getContractFactory("SimpleBKCFaucet");
    const simpleBKCFaucet = await upgrades.deployProxy(
        SimpleBKCFaucet,
        [addresses.bkcToken, deployer.address],
        { initializer: "initialize", kind: "uups" }
    );
    await simpleBKCFaucet.waitForDeployment();
    addresses.faucet = await simpleBKCFaucet.getAddress();
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ SimpleBKCFaucet (Proxy) implantado em: ${addresses.faucet}`);
    await sleep(DEPLOY_DELAY_MS);

    // =================================================================
    // === PASSO 3: SALVAR ENDEREÇOS ESTÁTICOS & CONFIG HUB ===
    // =================================================================
    
    addresses.oracleWalletAddress = DEFAULT_ORACLE_ADDRESS;
    console.log(`\n3.1. Endereço Padrão do Oráculo salvo: ${addresses.oracleWalletAddress}`);
    
    addresses.bkcDexPoolAddress = "https://pancakeswap.finance/swap?chain=bsc";
    console.log(`   Link DEX (bkcDexPoolAddress) salvo: ${addresses.bkcDexPoolAddress}`);

    addresses.mainLPPairAddress = "0x0000000000000000000000000000000000000000"; // Placeholder
    
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`   ✅ Todos os ${Object.keys(addresses).length} endereços iniciais salvos no JSON.`);
    await sleep(DEPLOY_DELAY_MS);

    console.log("\n--- Configurando Conexões e Regras ---");
    const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, deployer);
    
    // 3.2. Configuração do Hub (Conectando endereços iniciais)
    // ATENÇÃO: Precisamos configurar o Hub AGORA para que o RentalManager encontre o BKC Token na inicialização.
    console.log("3.2. Configurando Hub com `setAddresses` em lote (Pré-requisito para Rental)...");
    
    tx = await hub.setAddresses(
        addresses.bkcToken,             // _bkcToken
        deployer.address,               // _treasuryWallet (usando deployer temporariamente)
        ethers.ZeroAddress,             // _delegationManager (Fase 2)
        addresses.rewardBoosterNFT,     // _rewardBooster
        ethers.ZeroAddress,             // _miningManager (Fase 2)
        ethers.ZeroAddress,             // _decentralizedNotary (Fase 2)
        ethers.ZeroAddress,             // _fortunePool (Fase 2)
        ethers.ZeroAddress              // _nftLiquidityPoolFactory (Fase 2)
    );
    await tx.wait();
    console.log(`   ✅ Hub configurado (BKCToken visível para o ecossistema).`);
    await sleep(DEPLOY_DELAY_MS);

    // =================================================================
    // === PASSO 4: DEPLOY RENTAL MANAGER (AirBNFT) ===
    // =================================================================

    console.log("\n4.1. Implantando RentalManager (AirBNFT Market Otimizado)...");
    const RentalManager = await ethers.getContractFactory("RentalManager");
    rentalManagerInstance = await upgrades.deployProxy(
        RentalManager,
        [addresses.ecosystemManager, addresses.rewardBoosterNFT],
        { initializer: "initialize", kind: "uups" }
    );
    await rentalManagerInstance.waitForDeployment();
    addresses.rentalManager = await rentalManagerInstance.getAddress();
    
    updateAddressJSON("rentalManager", addresses.rentalManager);
    console.log(`   ✅ RentalManager (Proxy) implantado em: ${addresses.rentalManager}`);
    await sleep(DEPLOY_DELAY_MS);

    // 4.3. Definindo Taxas Iniciais (Incluindo Rental)
    console.log("\n4.2. Definindo Taxas Iniciais do Ecossistema (incluindo Rental)...");
    for (const [key, bips] of Object.entries(INITIAL_FEES_TO_SET)) {
        // Para RENTAL_MARKET_ACCESS, usamos setPStakeMinimum
        if (key === "RENTAL_MARKET_ACCESS") {
             tx = await hub.setPStakeMinimum(ethers.id(key), bips);
             console.log(`   -> pStake definido para ${key}: ${bips}`);
        } else {
             // Para taxas normais (FEE)
             tx = await hub.setServiceFee(ethers.id(key), bips);
             console.log(`   -> Taxa definida para ${key}: ${bips} BIPS`);
        }
        await tx.wait();
    }
    await sleep(DEPLOY_DELAY_MS);
    
    // 4.4. Autorização NFT & URI
    tx = await boosterNFT.setSaleContractAddress(addresses.publicSale);
    await tx.wait();
    tx = await boosterNFT.setBaseURI(IPFS_BASE_URI_BOOSTERS);
    await tx.wait();
    console.log(`   ✅ SaleContract autorizado e URI IPFS atualizada.`);
    await sleep(DEPLOY_DELAY_MS);

    // 4.5. Configuração de Tiers da Pré-venda
    console.log("\n4.3. Configurando Tiers OTIMIZADOS...");
    
    for (const tier of TIERS_TO_SETUP) {
      const priceInWei = ethers.parseEther(tier.priceETH);
      const maxSupply = BigInt(tier.maxSupply);
      
      console.log(`   -> Tier ${tier.tierId} (${tier.metadata}): ${tier.priceETH} ETH`);
      
      tx = await saleContract.setTier(
        BigInt(tier.tierId),
        priceInWei,
        maxSupply,
        BigInt(tier.boostBips),
        tier.metadata
      );
      await tx.wait();
      
      if (tier.discountBips > 0) {
        tx = await hub.setBoosterDiscount(BigInt(tier.boostBips), BigInt(tier.discountBips));
        await tx.wait();
      }
    }

    console.log("----------------------------------------------------");
    console.log("\n🎉🎉🎉 SETUP INICIAL COM AIRBNFT CONCLUÍDO! 🎉🎉🎉");
    console.log("Infraestrutura pronta, RentalManager ativo e Tiers configurados.");

  } catch (error: any) {
    console.error("\n❌ Falha Crítica durante o Setup Inicial:", error.message);
    deleteAddressesFileOnError();
    process.exit(1);
  }
}

// Bloco de execução independente
if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}