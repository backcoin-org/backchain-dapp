// scripts/1_deploy_full_initial_setup.ts
// ✅ VERSÃO V2.1 FINAL - Deploy Completo do Ecossistema Backcoin
// ============================================================
// Este script limpa os arquivos de configuração e faz deploy de todos os contratos

import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

// ============================================================
//                    CONFIGURAÇÃO GERAL
// ============================================================

const DEPLOY_DELAY_MS = 5000;
const IPFS_BASE_URI_BOOSTERS = "ipfs://bafybeibtfnc6zgeiayglticrk2bqqgleybpgageh723grbdtsdddoicwtu/";
const DEFAULT_ORACLE_ADDRESS = "0xd7e622124b78a28c4c928b271fc9423285804f98";

// ============================================================
//                 TAXAS OFICIAIS V2.1
// ============================================================

const OFFICIAL_FEES_V2 = {
    // Staking Fees (BIPS: 100 = 1%)
    DELEGATION_FEE_BIPS: 50,            // 0.5% - Taxa de entrada no staking
    UNSTAKE_FEE_BIPS: 100,              // 1% - Taxa de saída normal
    FORCE_UNSTAKE_PENALTY_BIPS: 5000,   // 50% - Penalidade por saída antecipada
    CLAIM_REWARD_FEE_BIPS: 100,         // 1% - Taxa ao clamar rewards
    
    // NFT Pool Fees (BIPS)
    NFT_POOL_BUY_TAX_BIPS: 500,         // 5% - Taxa de compra de NFT
    NFT_POOL_SELL_TAX_BIPS: 1000,       // 10% - Taxa de venda de NFT
    
    // Service Fees (BIPS)
    FORTUNE_POOL_SERVICE: 2000,          // 20% - Game fee do Fortune Pool
    RENTAL_MARKET_TAX_BIPS: 1000,        // 10% - Taxa do marketplace de aluguel
    
    // Fixed Fees (em BKC)
    NOTARY_SERVICE: "1"                  // 1 BKC - Taxa de notarização
};

// ============================================================
//               DISTRIBUIÇÃO DE REWARDS V2.1
// ============================================================

const DISTRIBUTION_V2 = {
    // Mining Distribution (tokens NOVOS mintados)
    mining: {
        TREASURY: 3000,          // 30%
        DELEGATOR_POOL: 7000     // 70%
    },
    // Fee Distribution (tokens EXISTENTES redistribuídos)
    fee: {
        TREASURY: 3000,          // 30%
        DELEGATOR_POOL: 7000     // 70%
    }
};

// ============================================================
//                   CONFIGURAÇÃO DE TIERS
// ============================================================

const TIERS_TO_SETUP = [
    { tierId: 1, name: "Diamond",  maxSupply: 1000000, priceETH: "1.0",   boostBips: 7000, metadata: "diamond_booster.json",  discountBips: 7000 },
    { tierId: 2, name: "Platinum", maxSupply: 1000000, priceETH: "0.4",   boostBips: 6000, metadata: "platinum_booster.json", discountBips: 6000 },
    { tierId: 3, name: "Gold",     maxSupply: 1000000, priceETH: "0.15",  boostBips: 5000, metadata: "gold_booster.json",     discountBips: 5000 },
    { tierId: 4, name: "Silver",   maxSupply: 1000000, priceETH: "0.07",  boostBips: 4000, metadata: "silver_booster.json",   discountBips: 4000 },
    { tierId: 5, name: "Bronze",   maxSupply: 1000000, priceETH: "0.03",  boostBips: 3000, metadata: "bronze_booster.json",   discountBips: 3000 },
    { tierId: 6, name: "Iron",     maxSupply: 1000000, priceETH: "0.01",  boostBips: 2000, metadata: "iron_booster.json",     discountBips: 2000 },
    { tierId: 7, name: "Crystal",  maxSupply: 1000000, priceETH: "0.004", boostBips: 1000, metadata: "crystal_booster.json",  discountBips: 1000 },
];

// ============================================================
//                    PATHS DOS ARQUIVOS
// ============================================================

const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
const rulesFilePath = path.join(__dirname, "../rules-config.json");

// ============================================================
//                    FUNÇÕES AUXILIARES
// ============================================================

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function clearConfigFiles() {
    console.log("🧹 Limpando arquivos de configuração...");
    
    // Limpar deployment-addresses.json
    fs.writeFileSync(addressesFilePath, JSON.stringify({}, null, 2));
    console.log("   ✅ deployment-addresses.json limpo");
    
    // Criar rules-config.json com valores padrão V2.1
    const defaultRules = {
        "VERSION": "2.1.0",
        "DESCRIPTION": "Configuração Oficial Backcoin V2.1 - Produção",
        "CREATED_AT": new Date().toISOString(),
        
        "serviceFees": {
            "COMMENT": "💰 Taxas em BIPS (100 = 1%) ou valor fixo em BKC",
            "DELEGATION_FEE_BIPS": OFFICIAL_FEES_V2.DELEGATION_FEE_BIPS.toString(),
            "UNSTAKE_FEE_BIPS": OFFICIAL_FEES_V2.UNSTAKE_FEE_BIPS.toString(),
            "FORCE_UNSTAKE_PENALTY_BIPS": OFFICIAL_FEES_V2.FORCE_UNSTAKE_PENALTY_BIPS.toString(),
            "CLAIM_REWARD_FEE_BIPS": OFFICIAL_FEES_V2.CLAIM_REWARD_FEE_BIPS.toString(),
            "NFT_POOL_BUY_TAX_BIPS": OFFICIAL_FEES_V2.NFT_POOL_BUY_TAX_BIPS.toString(),
            "NFT_POOL_SELL_TAX_BIPS": OFFICIAL_FEES_V2.NFT_POOL_SELL_TAX_BIPS.toString(),
            "FORTUNE_POOL_SERVICE": OFFICIAL_FEES_V2.FORTUNE_POOL_SERVICE.toString(),
            "RENTAL_MARKET_TAX_BIPS": OFFICIAL_FEES_V2.RENTAL_MARKET_TAX_BIPS.toString(),
            "NOTARY_SERVICE": OFFICIAL_FEES_V2.NOTARY_SERVICE
        },
        
        "miningDistribution": {
            "COMMENT": "⛏️ Distribuição de tokens NOVOS (soma = 10000)",
            "TREASURY": DISTRIBUTION_V2.mining.TREASURY.toString(),
            "DELEGATOR_POOL": DISTRIBUTION_V2.mining.DELEGATOR_POOL.toString()
        },
        
        "feeDistribution": {
            "COMMENT": "💵 Distribuição de taxas EXISTENTES (soma = 10000)",
            "TREASURY": DISTRIBUTION_V2.fee.TREASURY.toString(),
            "DELEGATOR_POOL": DISTRIBUTION_V2.fee.DELEGATOR_POOL.toString()
        },
        
        "boosterDiscounts": {
            "COMMENT": "⭐ Descontos por NFT (boostBips → discountBips)",
            "7000": "7000",
            "6000": "6000",
            "5000": "5000",
            "4000": "4000",
            "3000": "3000",
            "2000": "2000",
            "1000": "1000"
        },
        
        "fortunePoolTiers": {
            "COMMENT": "🎰 Configuração dos Prize Tiers (range,multiplierBips)",
            "1": "3,20000",
            "2": "10,50000",
            "3": "100,1000000"
        }
    };
    
    fs.writeFileSync(rulesFilePath, JSON.stringify(defaultRules, null, 2));
    console.log("   ✅ rules-config.json criado com valores V2.1");
}

function updateAddressJSON(key: string, value: string) {
    let currentAddresses: any = {};
    if (fs.existsSync(addressesFilePath)) {
        currentAddresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
    }
    currentAddresses[key] = value;
    fs.writeFileSync(addressesFilePath, JSON.stringify(currentAddresses, null, 2));
}

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

// ============================================================
//                    SCRIPT PRINCIPAL
// ============================================================

export async function runScript(hre: HardhatRuntimeEnvironment) {
    const { ethers, upgrades } = hre;
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    console.log("════════════════════════════════════════════════════════");
    console.log("   🚀 BACKCOIN DEPLOY V2.1 - SETUP INICIAL COMPLETO");
    console.log("════════════════════════════════════════════════════════");
    console.log(`   📡 Rede: ${networkName}`);
    console.log(`   👷 Deployer: ${deployer.address}`);
    console.log(`   💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
    console.log("----------------------------------------------------\n");

    // ═══════════════════════════════════════════════════════════════════
    // FASE 0: LIMPAR ARQUIVOS DE CONFIGURAÇÃO
    // ═══════════════════════════════════════════════════════════════════
    
    clearConfigFiles();
    const addresses: { [key: string]: string } = {};

    try {
        // ═══════════════════════════════════════════════════════════════════
        // FASE 1: CORE - HUB & TOKENS
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n📡 FASE 1: Core & Assets");
        console.log("----------------------------------------------------");

        // 1.1 EcosystemManager (Hub Central)
        const EcosystemManager = await ethers.getContractFactory("EcosystemManager");
        const { contract: hub, address: hubAddr } = await deployProxyWithRetry(
            upgrades, EcosystemManager, [deployer.address], "EcosystemManager"
        );
        addresses.ecosystemManager = hubAddr;
        updateAddressJSON("ecosystemManager", hubAddr);

        // 1.2 BKCToken (Sem Burn!)
        const BKCToken = await ethers.getContractFactory("BKCToken");
        const { contract: bkc, address: bkcAddr } = await deployProxyWithRetry(
            upgrades, BKCToken, [deployer.address], "BKCToken"
        );
        addresses.bkcToken = bkcAddr;
        updateAddressJSON("bkcToken", bkcAddr);

        // 1.3 RewardBoosterNFT
        const RewardBoosterNFT = await ethers.getContractFactory("RewardBoosterNFT");
        const { contract: nft, address: nftAddr } = await deployProxyWithRetry(
            upgrades, RewardBoosterNFT, [deployer.address], "RewardBoosterNFT"
        );
        addresses.rewardBoosterNFT = nftAddr;
        updateAddressJSON("rewardBoosterNFT", nftAddr);

        // PRÉ-WIRING 1: Registrar BKC e NFT no Hub
        console.log("\n   ⚙️ Pré-configuração: Registrando BKC e NFT no Hub...");
        await (await hub.setAddresses(
            bkcAddr,
            deployer.address,    // Treasury (temporário)
            ethers.ZeroAddress,  // DelegationManager
            nftAddr,
            ethers.ZeroAddress,  // MiningManager
            ethers.ZeroAddress,  // Notary
            ethers.ZeroAddress,  // Fortune
            ethers.ZeroAddress   // Factory
        )).wait();

        // ═══════════════════════════════════════════════════════════════════
        // FASE 2: MANAGERS (SPOKES)
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n🧠 FASE 2: Managers");
        console.log("----------------------------------------------------");

        // 2.1 MiningManager
        const MiningManager = await ethers.getContractFactory("MiningManager");
        const { contract: miningManager, address: mmAddr } = await deployProxyWithRetry(
            upgrades, MiningManager, [hubAddr], "MiningManager"
        );
        addresses.miningManager = mmAddr;
        updateAddressJSON("miningManager", mmAddr);

        // PRÉ-WIRING 2: Registrar MiningManager no Hub
        console.log("   ⚙️ Pré-configuração: Registrando MiningManager...");
        await (await hub.setAddresses(
            bkcAddr, deployer.address, ethers.ZeroAddress, nftAddr,
            mmAddr, ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress
        )).wait();

        // 2.2 DelegationManager
        const DelegationManager = await ethers.getContractFactory("DelegationManager");
        const { contract: delegationManager, address: dmAddr } = await deployProxyWithRetry(
            upgrades, DelegationManager, [deployer.address, hubAddr], "DelegationManager"
        );
        addresses.delegationManager = dmAddr;
        updateAddressJSON("delegationManager", dmAddr);

        // PRÉ-WIRING 3: Registrar DelegationManager no Hub
        console.log("   ⚙️ Pré-configuração: Registrando DelegationManager...");
        await (await hub.setAddresses(
            bkcAddr, deployer.address, dmAddr, nftAddr,
            mmAddr, ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress
        )).wait();

        // 2.3 DecentralizedNotary
        const DecentralizedNotary = await ethers.getContractFactory("DecentralizedNotary");
        const { address: notaryAddr } = await deployProxyWithRetry(
            upgrades, DecentralizedNotary, [deployer.address, hubAddr], "DecentralizedNotary"
        );
        addresses.decentralizedNotary = notaryAddr;
        updateAddressJSON("decentralizedNotary", notaryAddr);

        // 2.4 FortunePool
        const FortunePool = await ethers.getContractFactory("FortunePool");
        const { address: fortuneAddr } = await deployProxyWithRetry(
            upgrades, FortunePool, [deployer.address, hubAddr], "FortunePool"
        );
        addresses.fortunePool = fortuneAddr;
        updateAddressJSON("fortunePool", fortuneAddr);

        // 2.5 RentalManager
        const RentalManager = await ethers.getContractFactory("RentalManager");
        const { address: rentalAddr } = await deployProxyWithRetry(
            upgrades, RentalManager, [hubAddr, nftAddr], "RentalManager"
        );
        addresses.rentalManager = rentalAddr;
        updateAddressJSON("rentalManager", rentalAddr);

        // 2.6 NFT Pools (Implementation + Factory)
        const NFTLiquidityPool = await ethers.getContractFactory("NFTLiquidityPool");
        const poolImpl = await NFTLiquidityPool.deploy();
        await poolImpl.waitForDeployment();
        const poolImplAddr = await poolImpl.getAddress();
        addresses.nftLiquidityPool_Implementation = poolImplAddr;
        updateAddressJSON("nftLiquidityPool_Implementation", poolImplAddr);
        console.log(`   ✅ NFTLiquidityPool (Template): ${poolImplAddr}`);

        const Factory = await ethers.getContractFactory("NFTLiquidityPoolFactory");
        const { address: factoryAddr } = await deployProxyWithRetry(
            upgrades, Factory, [deployer.address, hubAddr, poolImplAddr], "NFTLiquidityPoolFactory"
        );
        addresses.nftLiquidityPoolFactory = factoryAddr;
        updateAddressJSON("nftLiquidityPoolFactory", factoryAddr);

        // ═══════════════════════════════════════════════════════════════════
        // FASE 3: UTILITIES & SALES
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n🛠️ FASE 3: Utilities");
        console.log("----------------------------------------------------");

        // 3.1 PublicSale
        const PublicSale = await ethers.getContractFactory("PublicSale");
        const { contract: sale, address: saleAddr } = await deployProxyWithRetry(
            upgrades, PublicSale, [nftAddr, hubAddr, deployer.address], "PublicSale"
        );
        addresses.publicSale = saleAddr;
        updateAddressJSON("publicSale", saleAddr);

        // 3.2 SimpleBKCFaucet
        const SimpleBKCFaucet = await ethers.getContractFactory("SimpleBKCFaucet");
        const { address: faucetAddr } = await deployProxyWithRetry(
            upgrades, SimpleBKCFaucet, [
                bkcAddr,
                deployer.address,
                ethers.parseEther("20"),    // dripAmount
                ethers.parseEther("0.001")  // minBalance
            ], "SimpleBKCFaucet"
        );
        addresses.faucet = faucetAddr;
        updateAddressJSON("faucet", faucetAddr);

        // Metadata
        addresses.oracleWalletAddress = DEFAULT_ORACLE_ADDRESS;
        addresses.treasuryWallet = deployer.address;
        updateAddressJSON("oracleWalletAddress", DEFAULT_ORACLE_ADDRESS);
        updateAddressJSON("treasuryWallet", deployer.address);

        // ═══════════════════════════════════════════════════════════════════
        // FASE 4: WIRING FINAL
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n🔌 FASE 4: Conectando o Sistema");
        console.log("----------------------------------------------------");

        // 4.1 Hub - Todos os endereços finais
        console.log("   → Configurando Hub com endereços finais...");
        await (await hub.setAddresses(
            bkcAddr,
            deployer.address,  // Treasury
            dmAddr,
            nftAddr,
            mmAddr,
            notaryAddr,
            fortuneAddr,
            factoryAddr
        )).wait();
        console.log("   ✅ Hub atualizado");

        // 4.2 Autorizar Miners no MiningManager
        console.log("   → Autorizando mineradores...");
        const miners = [
            { key: "FORTUNE_POOL_SERVICE", addr: fortuneAddr },
            { key: "NOTARY_SERVICE", addr: notaryAddr },
            { key: "RENTAL_MARKET_TAX_BIPS", addr: rentalAddr },
            { key: "DELEGATION_FEE_BIPS", addr: dmAddr },
            { key: "UNSTAKE_FEE_BIPS", addr: dmAddr },
            { key: "FORCE_UNSTAKE_PENALTY_BIPS", addr: dmAddr },
            { key: "CLAIM_REWARD_FEE_BIPS", addr: dmAddr },
        ];
        
        for (const m of miners) {
            const keyHash = ethers.keccak256(ethers.toUtf8Bytes(m.key));
            await (await miningManager.setAuthorizedMiner(keyHash, m.addr)).wait();
            console.log(`      + Autorizado: ${m.key}`);
        }

        // 4.3 Configurar Distribuição (30/70)
        console.log("   → Configurando distribuição de rewards...");
        const POOL_TREASURY = ethers.keccak256(ethers.toUtf8Bytes("TREASURY"));
        const POOL_DELEGATOR = ethers.keccak256(ethers.toUtf8Bytes("DELEGATOR_POOL"));

        // Mining Distribution (tokens novos)
        await (await hub.setMiningDistributionBips(POOL_TREASURY, DISTRIBUTION_V2.mining.TREASURY)).wait();
        await (await hub.setMiningDistributionBips(POOL_DELEGATOR, DISTRIBUTION_V2.mining.DELEGATOR_POOL)).wait();
        
        // Fee Distribution (tokens existentes)
        await (await hub.setFeeDistributionBips(POOL_TREASURY, DISTRIBUTION_V2.fee.TREASURY)).wait();
        await (await hub.setFeeDistributionBips(POOL_DELEGATOR, DISTRIBUTION_V2.fee.DELEGATOR_POOL)).wait();
        console.log("   ✅ Distribuição: 30% Treasury / 70% Delegators");

        // 4.4 Configurar Taxas V2.1
        console.log("   → Configurando taxas oficiais V2.1...");
        
        for (const [key, val] of Object.entries(OFFICIAL_FEES_V2)) {
            const keyHash = ethers.id(key);
            
            if (key === "NOTARY_SERVICE") {
                const notaryFee = ethers.parseEther(val as string);
                await (await hub.setServiceFee(keyHash, notaryFee)).wait();
                console.log(`      + ${key}: ${val} BKC`);
            } else {
                await (await hub.setServiceFee(keyHash, BigInt(val as number))).wait();
                console.log(`      + ${key}: ${val} bips (${(val as number) / 100}%)`);
            }
        }

        // 4.5 Configurar PublicSale e NFTs
        console.log("   → Configurando loja (PublicSale) e NFTs...");
        await (await nft.setSaleContract(saleAddr)).wait();
        await (await nft.setBaseURI(IPFS_BASE_URI_BOOSTERS)).wait();

        for (const tier of TIERS_TO_SETUP) {
            await (await sale.setTier(
                BigInt(tier.tierId),
                tier.name,                          // Nome do tier
                ethers.parseEther(tier.priceETH),   // Preço em Wei
                BigInt(tier.maxSupply),             // Max supply (uint64)
                BigInt(tier.boostBips),             // Boost bips (uint16)
                tier.metadata                       // Metadata file
            )).wait();

            if (tier.discountBips > 0) {
                await (await hub.setBoosterDiscount(BigInt(tier.boostBips), BigInt(tier.discountBips))).wait();
            }
            console.log(`      + Tier ${tier.name}: ${tier.priceETH} ETH, ${tier.discountBips / 100}% desconto`);
        }

        // ═══════════════════════════════════════════════════════════════════
        // FASE 5: TRANSFERÊNCIA DE CONTROLE
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n🔐 FASE 5: Transferência de Controle");
        console.log("----------------------------------------------------");

        console.log("   → Transferindo ownership do BKC para MiningManager...");
        await (await bkc.transferOwnership(mmAddr)).wait();
        console.log("   ✅ MiningManager agora controla a emissão de BKC");

        // ═══════════════════════════════════════════════════════════════════
        // RESUMO FINAL
        // ═══════════════════════════════════════════════════════════════════

        console.log("\n════════════════════════════════════════════════════════");
        console.log("              📊 DEPLOY CONCLUÍDO COM SUCESSO!");
        console.log("════════════════════════════════════════════════════════");
        console.log("\n📋 CONTRATOS IMPLANTADOS:");
        console.log("----------------------------------------------------");
        
        for (const [key, addr] of Object.entries(addresses)) {
            if (addr.startsWith("0x")) {
                console.log(`   ${key}: ${addr}`);
            }
        }

        console.log("\n💰 TAXAS CONFIGURADAS (V2.1):");
        console.log("----------------------------------------------------");
        console.log("   Staking Entry:      0.5%");
        console.log("   Unstaking:          1%");
        console.log("   Force Unstake:      50%");
        console.log("   Claim Reward:       1%");
        console.log("   NFT Buy:            5%");
        console.log("   NFT Sell:           10%");
        console.log("   Fortune Pool:       20%");
        console.log("   Rental:             10%");
        console.log("   Notary:             1 BKC");

        console.log("\n📊 DISTRIBUIÇÃO:");
        console.log("----------------------------------------------------");
        console.log("   Mining (novos):     30% Treasury / 70% Stakers");
        console.log("   Fees (existentes):  30% Treasury / 70% Stakers");

        console.log("\n⚠️ PRÓXIMO PASSO:");
        console.log("----------------------------------------------------");
        console.log("   Execute o script 3_launch_and_liquidate_ecosystem.ts");
        console.log("   para realizar o TGE e injetar liquidez inicial.");

        console.log("\n🎉 SETUP COMPLETO!\n");

    } catch (error: any) {
        console.error("\n❌ ERRO FATAL NO DEPLOY:", error.message);
        console.error(error);
        process.exit(1);
    }
}

// Entry point
if (require.main === module) {
    runScript(require("hardhat")).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}