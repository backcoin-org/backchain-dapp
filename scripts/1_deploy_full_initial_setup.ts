// scripts/1_deploy_full_initial_setup.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// --- CONFIGURAÇÃO ---
const DEPLOY_DELAY_MS = 5000; 
const IPFS_BASE_URI_BOOSTERS = "ipfs://bafybeibtfnc6zgeiayglticrk2bqqgleybpgageh723grbdtsdddoicwtu/";
const DEFAULT_ORACLE_ADDRESS = "0xd7e622124b78a28c4c928b271fc9423285804f98";

// Configuração dos Tiers
const TIERS_TO_SETUP = [
  { tierId: 1, name: "Diamond", maxSupply: 1000000, priceETH: "1.0", boostBips: 7000, metadata: "diamond_booster.json", discountBips: 7000 },
  { tierId: 2, name: "Platinum", maxSupply: 1000000, priceETH: "0.4", boostBips: 6000, metadata: "platinum_booster.json", discountBips: 6000 },
  { tierId: 3, name: "Gold", maxSupply: 1000000, priceETH: "0.15", boostBips: 5000, metadata: "gold_booster.json", discountBips: 5000 },
  { tierId: 4, name: "Silver", maxSupply: 1000000, priceETH: "0.07", boostBips: 4000, metadata: "silver_booster.json", discountBips: 4000 },
  { tierId: 5, name: "Bronze", maxSupply: 1000000, priceETH: "0.03", boostBips: 3000, metadata: "bronze_booster.json", discountBips: 3000 },
  { tierId: 6, name: "Iron", maxSupply: 1000000, priceETH: "0.01", boostBips: 2000, metadata: "iron_booster.json", discountBips: 2000 },
  { tierId: 7, name: "Crystal", maxSupply: 1000000, priceETH: "0.004", boostBips: 1000, metadata: "crystal_booster.json", discountBips: 1000 },
];

const INITIAL_FEES = {
    "DELEGATION_FEE_BIPS": 50,           
    "UNSTAKE_FEE_BIPS": 100,             
    "FORCE_UNSTAKE_PENALTY_BIPS": 5000,  
    "CLAIM_REWARD_FEE_BIPS": 100,        
    "RENTAL_MARKET_TAX_BIPS": 500,       
    "NFT_POOL_BUY_TAX_BIPS": 50,         
    "NFT_POOL_SELL_TAX_BIPS": 1000,      
    "NOTARY_SERVICE": 0                  // 1 BKC (definido na lógica)
};

const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function deployProxyWithRetry(upgrades: any, Factory: any, args: any[], name: string) {
    console.log(`   🔨 Implantando ${name}...`);
    try {
        const contract = await upgrades.deployProxy(Factory, args, { initializer: "initialize", kind: "uups" });
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        console.log(`   ✅ ${name}: ${address}`);
        await sleep(2000);
        return { contract, address };
    } catch (error: any) {
        console.error(`   ❌ Falha ao implantar ${name}: ${error.message}`);
        throw error;
    }
}

export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers, upgrades } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`🚀 DEPLOY UNIFICADO V5.2 (Correção de Dependência) | Rede: ${networkName}`);
  console.log(`👷 Deployer: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // Limpeza de arquivo anterior
  const addresses: { [key: string]: string } = {};
  fs.writeFileSync(addressesFilePath, JSON.stringify({}, null, 2));

  try {
    // ====================================================
    // 1. CORE: HUB & TOKENS
    // ====================================================
    console.log("\n📡 FASE 1: Core & Assets");

    // 1.1 EcosystemManager (Hub)
    const EcosystemManager = await ethers.getContractFactory("EcosystemManager");
    const { contract: hub, address: hubAddr } = await deployProxyWithRetry(upgrades, EcosystemManager, [deployer.address], "EcosystemManager");
    addresses.ecosystemManager = hubAddr;

    // 1.2 BKCToken
    const BKCToken = await ethers.getContractFactory("BKCToken");
    const { contract: bkc, address: bkcAddr } = await deployProxyWithRetry(upgrades, BKCToken, [deployer.address], "BKCToken");
    addresses.bkcToken = bkcAddr;

    // 1.3 RewardBoosterNFT
    const RewardBoosterNFT = await ethers.getContractFactory("RewardBoosterNFT");
    const { contract: nft, address: nftAddr } = await deployProxyWithRetry(upgrades, RewardBoosterNFT, [deployer.address], "RewardBoosterNFT");
    addresses.rewardBoosterNFT = nftAddr;

    // --- FIX: PRÉ-WIRING 1 ---
    // Precisamos registrar o BKC no Hub AGORA, senão o MiningManager falha ao tentar achar o token.
    console.log("   ⚠️ Pré-Configuração 1: Registrando BKC e NFT no Hub...");
    await (await hub.setAddresses(
        bkcAddr,
        deployer.address, // Treasury
        ethers.ZeroAddress, // DM (ainda não existe)
        nftAddr,
        ethers.ZeroAddress, // MM (ainda não existe)
        ethers.ZeroAddress, // Notary
        ethers.ZeroAddress, // Fortune
        ethers.ZeroAddress  // Factory
    )).wait();


    // ====================================================
    // 2. MANAGERS (SPOKES)
    // ====================================================
    console.log("\n🧠 FASE 2: Managers (Spokes)");

    // 2.1 MiningManager
    // Agora vai funcionar, pois ele vai consultar o Hub e encontrar o endereço do BKC
    const MiningManager = await ethers.getContractFactory("MiningManager");
    const { contract: miningManager, address: mmAddr } = await deployProxyWithRetry(upgrades, MiningManager, [hubAddr], "MiningManager");
    addresses.miningManager = mmAddr;

    // --- FIX: PRÉ-WIRING 2 ---
    // Precisamos registrar o MiningManager no Hub, pois o Notary depende dele no Init.
    console.log("   ⚠️ Pré-Configuração 2: Registrando MiningManager no Hub...");
    await (await hub.setAddresses(
        bkcAddr,
        deployer.address,
        ethers.ZeroAddress, // DM
        nftAddr,
        mmAddr, // <--- Atualizado
        ethers.ZeroAddress, // Notary
        ethers.ZeroAddress, // Fortune
        ethers.ZeroAddress  // Factory
    )).wait();

    // 2.2 DelegationManager
    const DelegationManager = await ethers.getContractFactory("DelegationManager");
    const { address: dmAddr } = await deployProxyWithRetry(upgrades, DelegationManager, [deployer.address, hubAddr], "DelegationManager");
    addresses.delegationManager = dmAddr;

    // --- FIX: PRÉ-WIRING 3 ---
    // Precisamos registrar o DelegationManager no Hub, pois o FortunePool depende dele no Init.
    console.log("   ⚠️ Pré-Configuração 3: Registrando DelegationManager no Hub...");
    await (await hub.setAddresses(
        bkcAddr,
        deployer.address,
        dmAddr, // <--- Atualizado
        nftAddr,
        mmAddr,
        ethers.ZeroAddress, // Notary
        ethers.ZeroAddress, // Fortune
        ethers.ZeroAddress  // Factory
    )).wait();

    // 2.3 DecentralizedNotary
    // Init requer BKC e MM (Já configurados no Wiring 1 e 2)
    const DecentralizedNotary = await ethers.getContractFactory("DecentralizedNotary");
    const { address: notaryAddr } = await deployProxyWithRetry(upgrades, DecentralizedNotary, [deployer.address, hubAddr], "DecentralizedNotary");
    addresses.decentralizedNotary = notaryAddr;

    // 2.4 FortunePool
    // Init requer BKC, MM e DM (Configurados nos Wirings 1, 2 e 3)
    const FortunePool = await ethers.getContractFactory("FortunePool");
    const { address: fortuneAddr } = await deployProxyWithRetry(upgrades, FortunePool, [
        deployer.address,
        hubAddr 
    ], "FortunePool");
    addresses.fortunePool = fortuneAddr;

    // 2.5 RentalManager
    const RentalManager = await ethers.getContractFactory("RentalManager");
    const { address: rentalAddr } = await deployProxyWithRetry(upgrades, RentalManager, [hubAddr, nftAddr], "RentalManager");
    addresses.rentalManager = rentalAddr;

    // 2.6 NFT Pools (Factory & Implementation)
    const NFTLiquidityPool = await ethers.getContractFactory("NFTLiquidityPool");
    const poolImpl = await NFTLiquidityPool.deploy();
    await poolImpl.waitForDeployment();
    const poolImplAddr = await poolImpl.getAddress();
    addresses.nftLiquidityPool_Implementation = poolImplAddr;
    console.log(`   ✅ Template Pool: ${poolImplAddr}`);

    const Factory = await ethers.getContractFactory("NFTLiquidityPoolFactory");
    const { address: factoryAddr } = await deployProxyWithRetry(upgrades, Factory, [deployer.address, hubAddr, poolImplAddr], "NFTLiquidityPoolFactory");
    addresses.nftLiquidityPoolFactory = factoryAddr;

    // ====================================================
    // 3. UTILITIES & SALES
    // ====================================================
    console.log("\n🛠️ FASE 3: Utilities");

    // 3.1 PublicSale
    const PublicSale = await ethers.getContractFactory("PublicSale");
    const { contract: sale, address: saleAddr } = await deployProxyWithRetry(upgrades, PublicSale, [nftAddr, hubAddr, deployer.address], "PublicSale");
    addresses.publicSale = saleAddr;

    // 3.2 Faucet
    const SimpleBKCFaucet = await ethers.getContractFactory("SimpleBKCFaucet");
    const { address: faucetAddr } = await deployProxyWithRetry(upgrades, SimpleBKCFaucet, [
        bkcAddr, 
        deployer.address, 
        ethers.parseEther("20"), 
        ethers.parseEther("0.001") 
    ], "SimpleBKCFaucet");
    addresses.faucet = faucetAddr;

    addresses.oracleWalletAddress = DEFAULT_ORACLE_ADDRESS;
    addresses.bkcDexPoolAddress = "https://app.uniswap.org/#/swap?chain=arbitrum";
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));

    // ====================================================
    // 4. WIRING FINAL
    // ====================================================
    console.log("\n🔌 FASE 4: Conectando o Sistema (Wiring Final)");

    console.log("   -> Configurando Hub com todos os endereços FINAIS...");
    const txHub = await hub.setAddresses(
        bkcAddr,
        deployer.address, 
        dmAddr,
        nftAddr,
        mmAddr,
        notaryAddr,
        fortuneAddr,
        factoryAddr
    );
    await txHub.wait();
    console.log("   ✅ Hub Atualizado.");

    console.log("   -> Autorizando Mineradores no MiningManager...");
    const miners = [
        { key: "NOTARY_SERVICE", addr: notaryAddr },
        { key: "RENTAL_MARKET_TAX_BIPS", addr: rentalAddr }, 
        { key: "TIGER_GAME_SERVICE", addr: fortuneAddr },     
    ];
    for (const m of miners) {
        const keyHash = ethers.keccak256(ethers.toUtf8Bytes(m.key));
        await (await miningManager.setAuthorizedMiner(keyHash, m.addr)).wait();
        console.log(`      + Autorizado: ${m.key}`);
    }

    // Configurando Distribuição
    const POOL_TREASURY = ethers.keccak256(ethers.toUtf8Bytes("TREASURY"));
    const POOL_DELEGATOR = ethers.keccak256(ethers.toUtf8Bytes("DELEGATOR_POOL"));
    
    await (await hub.setMiningDistributionBips(POOL_TREASURY, 5000)).wait();
    await (await hub.setMiningDistributionBips(POOL_DELEGATOR, 5000)).wait();
    await (await hub.setFeeDistributionBips(POOL_TREASURY, 5000)).wait();
    await (await hub.setFeeDistributionBips(POOL_DELEGATOR, 5000)).wait();
    console.log("   ✅ Regras de Distribuição Configuradas.");

    console.log("   -> Configurando Taxas e Regras Econômicas...");
    for (const [key, val] of Object.entries(INITIAL_FEES)) {
        const keyHash = ethers.id(key);
        
        if (key === "NOTARY_SERVICE") {
             const notaryFee = ethers.parseEther("1"); // 1 BKC
             await (await hub.setServiceFee(keyHash, notaryFee)).wait();
             console.log(`      + Taxa Notary configurada: 1 BKC`);
        } else {
             await (await hub.setServiceFee(keyHash, BigInt(val))).wait();
        }
    }

    console.log("   -> Configurando Loja (PublicSale) e NFTs...");
    await (await nft.setSaleContractAddress(saleAddr)).wait();
    await (await nft.setBaseURI(IPFS_BASE_URI_BOOSTERS)).wait();

    for (const tier of TIERS_TO_SETUP) {
        await (await sale.setTier(
            BigInt(tier.tierId),
            ethers.parseEther(tier.priceETH),
            BigInt(tier.maxSupply),
            BigInt(tier.boostBips), 
            tier.metadata
        )).wait();
        
        if (tier.discountBips > 0) {
            await (await hub.setBoosterDiscount(BigInt(tier.boostBips), BigInt(tier.discountBips))).wait();
        }
        console.log(`      + Tier ${tier.name} configurado.`);
    }

    // ====================================================
    // 5. OWNERSHIP TRANSFER
    // ====================================================
    console.log("\n🔥 FASE 5: Transferência de Controle (CRÍTICO)");
    
    console.log("   -> Transferindo Propriedade do BKC para MiningManager...");
    await (await bkc.transferOwnership(mmAddr)).wait();
    console.log("   ✅ MiningManager agora controla a emissão de BKC.");

    console.log("\n🎉 SETUP COMPLETO COM SUCESSO!");
    
  } catch (error: any) {
    console.error("\n❌ ERRO FATAL NO DEPLOY:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}