// scripts/1_deploy_full_initial_setup.ts
// ✅ Deploy Completo do Ecossistema Backchain
// ============================================================
// Este script faz deploy de todos os contratos incluindo:
// - Contratos Solidity (UUPS Proxies)
// - FortunePool com Backcoin Oracle (Stylus)
//
// IMPORTANTE - ORACLE:
// O Backcoin Oracle (Stylus) deve ser deployado ANTES via cargo-stylus.
// Após o deploy, atualize o endereço em EXTERNAL_CONTRACTS.BACKCOIN_ORACLE
//
// GUIA DE DEPLOY DO ORACLE:
// 1. cd contracts/stylus/backcoin-oracle
// 2. sudo service docker start (WSL)
// 3. cargo stylus deploy --endpoint RPC_URL --private-key KEY --max-fee-per-gas-gwei 1
// 4. Copie o endereço e cole em EXTERNAL_CONTRACTS.BACKCOIN_ORACLE abaixo
// ============================================================

import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

// ============================================================
//              🔴 CONTRATOS EXTERNOS - CONFIGURAR AQUI
// ============================================================
// Atualize estes endereços ANTES de executar o script!

const EXTERNAL_CONTRACTS = {
    // ══════════════════════════════════════════════════════════
    // BACKCOIN ORACLE (Stylus) - Deploy separado via cargo-stylus
    // ══════════════════════════════════════════════════════════
    // Testnet (Arbitrum Sepolia):
    BACKCOIN_ORACLE: "0x16346f5a45f9615f1c894414989f0891c54ef07b",
    
    // Mainnet (Arbitrum One) - Atualizar após deploy:
    // BACKCOIN_ORACLE: "0x...",
};

// ============================================================
//                    CONFIGURAÇÃO GERAL
// ============================================================

const DEPLOY_DELAY_MS = 5000;
const IPFS_BASE_URI_BOOSTERS = "ipfs://bafybeibtfnc6zgeiayglticrk2bqqgleybpgageh723grbdtsdddoicwtu/";

// ============================================================
//                     TAXAS OFICIAIS
// ============================================================

const OFFICIAL_FEES = {
    // Staking Fees (BIPS: 100 = 1%)
    DELEGATION_FEE_BIPS: 50,            // 0.5% - Taxa de entrada no staking
    UNSTAKE_FEE_BIPS: 100,              // 1% - Taxa de saída normal
    FORCE_UNSTAKE_PENALTY_BIPS: 5000,   // 50% - Penalidade por saída antecipada
    CLAIM_REWARD_FEE_BIPS: 100,         // 1% - Taxa ao clamar rewards
    
    // NFT Pool Fees (BIPS)
    NFT_POOL_BUY_TAX_BIPS: 500,         // 5% - Taxa de compra de NFT
    NFT_POOL_SELL_TAX_BIPS: 1000,       // 10% - Taxa de venda de NFT
    
    // Service Fees (BIPS)
    FORTUNE_POOL_GAME_FEE: 1000,        // 10% - Game fee do Fortune Pool
    RENTAL_MARKET_TAX_BIPS: 1000,       // 10% - Taxa do marketplace de aluguel
    
    // Fixed Fees
    NOTARY_SERVICE: "1",                // 1 BKC - Taxa de notarização
    
    // Fortune Pool Service Fees (ETH) - Taxas ínfimas para teste
    FORTUNE_SERVICE_FEE_1X: "0.000001", // 0.000001 ETH - Mode 1x (Jackpot)
    FORTUNE_SERVICE_FEE_5X: "0.000005"  // 0.000005 ETH - Mode 5x (Cumulative) = 5 * 1x
};

// ============================================================
//              FORTUNE POOL - TIER CONFIGURATION
// ============================================================

const FORTUNE_TIERS = [
    { tierId: 1, name: "Easy",   maxRange: 3,   multiplierBips: 20000,   chance: "33%" },   // 2x
    { tierId: 2, name: "Medium", maxRange: 10,  multiplierBips: 50000,   chance: "10%" },   // 5x  
    { tierId: 3, name: "Hard",   maxRange: 100, multiplierBips: 500000,  chance: "1%" }     // 50x
];

// ============================================================
//                 DISTRIBUIÇÃO DE REWARDS
// ============================================================

const DISTRIBUTION = {
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
//                   CONFIGURAÇÃO DE TIERS NFT
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
    
    fs.writeFileSync(addressesFilePath, JSON.stringify({}, null, 2));
    console.log("   ✅ deployment-addresses.json limpo");
    
    const defaultRules = {
        "VERSION": "1.0.0",
        "DESCRIPTION": "Configuração Oficial Backchain - Produção",
        "CREATED_AT": new Date().toISOString(),
        
        "externalContracts": {
            "COMMENT": "🦀 Contratos externos (deploy separado)",
            "BACKCOIN_ORACLE": EXTERNAL_CONTRACTS.BACKCOIN_ORACLE
        },
        
        "serviceFees": {
            "COMMENT": "💰 Taxas em BIPS (100 = 1%) ou valor fixo",
            "DELEGATION_FEE_BIPS": OFFICIAL_FEES.DELEGATION_FEE_BIPS.toString(),
            "UNSTAKE_FEE_BIPS": OFFICIAL_FEES.UNSTAKE_FEE_BIPS.toString(),
            "FORCE_UNSTAKE_PENALTY_BIPS": OFFICIAL_FEES.FORCE_UNSTAKE_PENALTY_BIPS.toString(),
            "CLAIM_REWARD_FEE_BIPS": OFFICIAL_FEES.CLAIM_REWARD_FEE_BIPS.toString(),
            "NFT_POOL_BUY_TAX_BIPS": OFFICIAL_FEES.NFT_POOL_BUY_TAX_BIPS.toString(),
            "NFT_POOL_SELL_TAX_BIPS": OFFICIAL_FEES.NFT_POOL_SELL_TAX_BIPS.toString(),
            "FORTUNE_POOL_GAME_FEE": OFFICIAL_FEES.FORTUNE_POOL_GAME_FEE.toString(),
            "RENTAL_MARKET_TAX_BIPS": OFFICIAL_FEES.RENTAL_MARKET_TAX_BIPS.toString(),
            "NOTARY_SERVICE": OFFICIAL_FEES.NOTARY_SERVICE,
            "FORTUNE_SERVICE_FEE_1X": OFFICIAL_FEES.FORTUNE_SERVICE_FEE_1X,
            "FORTUNE_SERVICE_FEE_5X": OFFICIAL_FEES.FORTUNE_SERVICE_FEE_5X
        },
        
        "miningDistribution": {
            "COMMENT": "⛏️ Distribuição de tokens NOVOS (soma = 10000)",
            "TREASURY": DISTRIBUTION.mining.TREASURY.toString(),
            "DELEGATOR_POOL": DISTRIBUTION.mining.DELEGATOR_POOL.toString()
        },
        
        "feeDistribution": {
            "COMMENT": "💵 Distribuição de taxas EXISTENTES (soma = 10000)",
            "TREASURY": DISTRIBUTION.fee.TREASURY.toString(),
            "DELEGATOR_POOL": DISTRIBUTION.fee.DELEGATOR_POOL.toString()
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
        
        "fortunePool": {
            "COMMENT": "🎰 FortunePool - Instant Resolution com Backcoin Oracle",
            "oracleAddress": EXTERNAL_CONTRACTS.BACKCOIN_ORACLE,
            "serviceFee1xETH": OFFICIAL_FEES.FORTUNE_SERVICE_FEE_1X,
            "serviceFee5xETH": OFFICIAL_FEES.FORTUNE_SERVICE_FEE_5X,
            "gameFeeBips": OFFICIAL_FEES.FORTUNE_POOL_GAME_FEE.toString(),
            "tiers": FORTUNE_TIERS.map(t => ({
                id: t.tierId,
                name: t.name,
                maxRange: t.maxRange,
                multiplierBips: t.multiplierBips,
                chance: t.chance
            }))
        }
    };
    
    fs.writeFileSync(rulesFilePath, JSON.stringify(defaultRules, null, 2));
    console.log("   ✅ rules-config.json criado");
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
    console.log("   🚀 BACKCHAIN DEPLOY - SETUP INICIAL COMPLETO");
    console.log("════════════════════════════════════════════════════════");
    console.log(`   📡 Rede: ${networkName}`);
    console.log(`   👷 Deployer: ${deployer.address}`);
    console.log(`   💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
    console.log("----------------------------------------------------\n");

    // ═══════════════════════════════════════════════════════════════════
    // VALIDAÇÃO DO ORACLE
    // ═══════════════════════════════════════════════════════════════════
    
    const oracleAddr = EXTERNAL_CONTRACTS.BACKCOIN_ORACLE;
    
    if (!oracleAddr || oracleAddr === "0x..." || !oracleAddr.startsWith("0x") || oracleAddr.length !== 42) {
        console.error("════════════════════════════════════════════════════════");
        console.error("   ❌ ERRO: BACKCOIN_ORACLE não configurado!");
        console.error("════════════════════════════════════════════════════════");
        console.error("\n   Você precisa:");
        console.error("   1. Fazer deploy do Backcoin Oracle via cargo-stylus");
        console.error("   2. Atualizar EXTERNAL_CONTRACTS.BACKCOIN_ORACLE neste arquivo");
        console.error("\n   Guia rápido:");
        console.error("   cd contracts/stylus/backcoin-oracle");
        console.error("   cargo stylus deploy --endpoint RPC_URL --private-key KEY --max-fee-per-gas-gwei 1");
        console.error("════════════════════════════════════════════════════════\n");
        process.exit(1);
    }

    console.log("🦀 BACKCOIN ORACLE (Stylus):");
    console.log(`   Address: ${oracleAddr}`);
    console.log("----------------------------------------------------\n");

    clearConfigFiles();
    const addresses: { [key: string]: string } = {};
    
    // Salvar endereço do Oracle
    addresses.backcoinOracle = oracleAddr;
    updateAddressJSON("backcoinOracle", oracleAddr);

    try {
        // ═══════════════════════════════════════════════════════════════════
        // FASE 1: CORE & ASSETS
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n📡 FASE 1: Core & Assets");
        console.log("----------------------------------------------------");

        const EcosystemManager = await ethers.getContractFactory("EcosystemManager");
        const { contract: hub, address: hubAddr } = await deployProxyWithRetry(
            upgrades, EcosystemManager, [deployer.address], "EcosystemManager"
        );
        addresses.ecosystemManager = hubAddr;
        updateAddressJSON("ecosystemManager", hubAddr);

        const BKCToken = await ethers.getContractFactory("BKCToken");
        const { contract: bkc, address: bkcAddr } = await deployProxyWithRetry(
            upgrades, BKCToken, [deployer.address], "BKCToken"
        );
        addresses.bkcToken = bkcAddr;
        updateAddressJSON("bkcToken", bkcAddr);

        const RewardBoosterNFT = await ethers.getContractFactory("RewardBoosterNFT");
        const { contract: nft, address: nftAddr } = await deployProxyWithRetry(
            upgrades, RewardBoosterNFT, [deployer.address], "RewardBoosterNFT"
        );
        addresses.rewardBoosterNFT = nftAddr;
        updateAddressJSON("rewardBoosterNFT", nftAddr);

        console.log("\n   ⚙️ Pré-configuração: Registrando BKC e NFT no Hub...");
        await (await hub.setAddresses(
            bkcAddr,
            deployer.address,
            ethers.ZeroAddress,
            nftAddr,
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            ethers.ZeroAddress
        )).wait();

        // ═══════════════════════════════════════════════════════════════════
        // FASE 2: MANAGERS
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n🧠 FASE 2: Managers");
        console.log("----------------------------------------------------");

        const MiningManager = await ethers.getContractFactory("MiningManager");
        const { contract: miningManager, address: mmAddr } = await deployProxyWithRetry(
            upgrades, MiningManager, [hubAddr], "MiningManager"
        );
        addresses.miningManager = mmAddr;
        updateAddressJSON("miningManager", mmAddr);

        console.log("   ⚙️ Pré-configuração: Registrando MiningManager...");
        await (await hub.setAddresses(
            bkcAddr, deployer.address, ethers.ZeroAddress, nftAddr,
            mmAddr, ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress
        )).wait();

        const DelegationManager = await ethers.getContractFactory("DelegationManager");
        const { contract: delegationManager, address: dmAddr } = await deployProxyWithRetry(
            upgrades, DelegationManager, [deployer.address, hubAddr], "DelegationManager"
        );
        addresses.delegationManager = dmAddr;
        updateAddressJSON("delegationManager", dmAddr);

        console.log("   ⚙️ Pré-configuração: Registrando DelegationManager...");
        await (await hub.setAddresses(
            bkcAddr, deployer.address, dmAddr, nftAddr,
            mmAddr, ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress
        )).wait();

        const DecentralizedNotary = await ethers.getContractFactory("DecentralizedNotary");
        const { address: notaryAddr } = await deployProxyWithRetry(
            upgrades, DecentralizedNotary, [deployer.address, hubAddr], "DecentralizedNotary"
        );
        addresses.decentralizedNotary = notaryAddr;
        updateAddressJSON("decentralizedNotary", notaryAddr);

        // FortunePool com Backcoin Oracle (Stylus)
        console.log("\n   🎰 Implantando FortunePool com Backcoin Oracle...");
        const FortunePool = await ethers.getContractFactory("FortunePool");
        const { contract: fortune, address: fortuneAddr } = await deployProxyWithRetry(
            upgrades, FortunePool, [deployer.address, hubAddr, oracleAddr], "FortunePool"
        );
        addresses.fortunePool = fortuneAddr;
        updateAddressJSON("fortunePool", fortuneAddr);

        const RentalManager = await ethers.getContractFactory("RentalManager");
        const { address: rentalAddr } = await deployProxyWithRetry(
            upgrades, RentalManager, [hubAddr, nftAddr], "RentalManager"
        );
        addresses.rentalManager = rentalAddr;
        updateAddressJSON("rentalManager", rentalAddr);

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
        // FASE 3: UTILITIES
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n🛠️ FASE 3: Utilities");
        console.log("----------------------------------------------------");

        const PublicSale = await ethers.getContractFactory("PublicSale");
        const { contract: sale, address: saleAddr } = await deployProxyWithRetry(
            upgrades, PublicSale, [nftAddr, hubAddr, deployer.address], "PublicSale"
        );
        addresses.publicSale = saleAddr;
        updateAddressJSON("publicSale", saleAddr);

        const SimpleBKCFaucet = await ethers.getContractFactory("SimpleBKCFaucet");
        const { address: faucetAddr } = await deployProxyWithRetry(
            upgrades, SimpleBKCFaucet, [
                bkcAddr,
                deployer.address,
                ethers.parseEther("20"),
                ethers.parseEther("0.001")
            ], "SimpleBKCFaucet"
        );
        addresses.faucet = faucetAddr;
        updateAddressJSON("faucet", faucetAddr);

        addresses.treasuryWallet = deployer.address;
        updateAddressJSON("treasuryWallet", deployer.address);

        // ═══════════════════════════════════════════════════════════════════
        // FASE 4: WIRING
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n🔌 FASE 4: Conectando o Sistema");
        console.log("----------------------------------------------------");

        console.log("   → Configurando Hub com endereços finais...");
        await (await hub.setAddresses(
            bkcAddr,
            deployer.address,
            dmAddr,
            nftAddr,
            mmAddr,
            notaryAddr,
            fortuneAddr,
            factoryAddr
        )).wait();
        console.log("   ✅ Hub atualizado");

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

        console.log("   → Configurando distribuição de rewards...");
        const POOL_TREASURY = ethers.keccak256(ethers.toUtf8Bytes("TREASURY"));
        const POOL_DELEGATOR = ethers.keccak256(ethers.toUtf8Bytes("DELEGATOR_POOL"));

        await (await hub.setMiningDistributionBips(POOL_TREASURY, DISTRIBUTION.mining.TREASURY)).wait();
        await (await hub.setMiningDistributionBips(POOL_DELEGATOR, DISTRIBUTION.mining.DELEGATOR_POOL)).wait();
        await (await hub.setFeeDistributionBips(POOL_TREASURY, DISTRIBUTION.fee.TREASURY)).wait();
        await (await hub.setFeeDistributionBips(POOL_DELEGATOR, DISTRIBUTION.fee.DELEGATOR_POOL)).wait();
        console.log("   ✅ Distribuição: 30% Treasury / 70% Delegators");

        console.log("   → Configurando taxas...");
        const feesToSet = [
            { key: "DELEGATION_FEE_BIPS", val: OFFICIAL_FEES.DELEGATION_FEE_BIPS },
            { key: "UNSTAKE_FEE_BIPS", val: OFFICIAL_FEES.UNSTAKE_FEE_BIPS },
            { key: "FORCE_UNSTAKE_PENALTY_BIPS", val: OFFICIAL_FEES.FORCE_UNSTAKE_PENALTY_BIPS },
            { key: "CLAIM_REWARD_FEE_BIPS", val: OFFICIAL_FEES.CLAIM_REWARD_FEE_BIPS },
            { key: "NFT_POOL_BUY_TAX_BIPS", val: OFFICIAL_FEES.NFT_POOL_BUY_TAX_BIPS },
            { key: "NFT_POOL_SELL_TAX_BIPS", val: OFFICIAL_FEES.NFT_POOL_SELL_TAX_BIPS },
            { key: "RENTAL_MARKET_TAX_BIPS", val: OFFICIAL_FEES.RENTAL_MARKET_TAX_BIPS },
        ];
        
        for (const { key, val } of feesToSet) {
            const keyHash = ethers.id(key);
            await (await hub.setServiceFee(keyHash, BigInt(val))).wait();
            console.log(`      + ${key}: ${val} bips (${val / 100}%)`);
        }
        
        const notaryKeyHash = ethers.id("NOTARY_SERVICE");
        const notaryFee = ethers.parseEther(OFFICIAL_FEES.NOTARY_SERVICE);
        await (await hub.setServiceFee(notaryKeyHash, notaryFee)).wait();
        console.log(`      + NOTARY_SERVICE: ${OFFICIAL_FEES.NOTARY_SERVICE} BKC`);

        // ═══════════════════════════════════════════════════════════════════
        // FASE 5: FORTUNE POOL CONFIGURATION
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n🎰 FASE 5: Configurando FortunePool");
        console.log("----------------------------------------------------");

        // Service Fee (1x mode) - Taxa ínfima para teste
        const serviceFeeWei = ethers.parseEther(OFFICIAL_FEES.FORTUNE_SERVICE_FEE_1X);
        await (await fortune.setServiceFee(serviceFeeWei)).wait();
        console.log(`   ✅ Service Fee 1x: ${OFFICIAL_FEES.FORTUNE_SERVICE_FEE_1X} ETH`);
        console.log(`   ✅ Service Fee 5x: ${OFFICIAL_FEES.FORTUNE_SERVICE_FEE_5X} ETH (5 * 1x)`);

        // Game Fee
        await (await fortune.setGameFee(BigInt(OFFICIAL_FEES.FORTUNE_POOL_GAME_FEE))).wait();
        console.log(`   ✅ Game Fee: ${OFFICIAL_FEES.FORTUNE_POOL_GAME_FEE / 100}%`);

        console.log("   → Configurando Prize Tiers...");
        for (const tier of FORTUNE_TIERS) {
            await (await fortune.configureTier(
                BigInt(tier.tierId),
                BigInt(tier.maxRange),
                BigInt(tier.multiplierBips)
            )).wait();
            console.log(`      + Tier ${tier.tierId} (${tier.name}): 1-${tier.maxRange}, ${tier.multiplierBips / 10000}x, ${tier.chance}`);
        }

        // ═══════════════════════════════════════════════════════════════════
        // FASE 6: NFT CONFIGURATION
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n🖼️ FASE 6: Configurando NFTs");
        console.log("----------------------------------------------------");

        await (await nft.setSaleContract(saleAddr)).wait();
        await (await nft.setBaseURI(IPFS_BASE_URI_BOOSTERS)).wait();

        for (const tier of TIERS_TO_SETUP) {
            await (await sale.setTier(
                BigInt(tier.tierId),
                tier.name,
                ethers.parseEther(tier.priceETH),
                BigInt(tier.maxSupply),
                BigInt(tier.boostBips),
                tier.metadata
            )).wait();

            if (tier.discountBips > 0) {
                await (await hub.setBoosterDiscount(BigInt(tier.boostBips), BigInt(tier.discountBips))).wait();
            }
            console.log(`      + Tier ${tier.name}: ${tier.priceETH} ETH, ${tier.discountBips / 100}% desconto`);
        }

        // ═══════════════════════════════════════════════════════════════════
        // FASE 7: TRANSFERÊNCIA DE CONTROLE
        // ═══════════════════════════════════════════════════════════════════
        
        console.log("\n🔐 FASE 7: Transferência de Controle");
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
        
        console.log("\n🦀 BACKCOIN ORACLE (Stylus):");
        console.log("----------------------------------------------------");
        console.log(`   Address: ${oracleAddr}`);
        console.log("   Type: Rust/WASM (Arbitrum Stylus)");
        console.log("   Status: ✅ Pré-deployado");

        console.log("\n📋 CONTRATOS IMPLANTADOS:");
        console.log("----------------------------------------------------");
        
        for (const [key, addr] of Object.entries(addresses)) {
            if (addr && addr.startsWith("0x")) {
                console.log(`   ${key}: ${addr}`);
            }
        }

        console.log("\n🎰 FORTUNE POOL:");
        console.log("----------------------------------------------------");
        console.log(`   Contract: ${fortuneAddr}`);
        console.log(`   Oracle: ${oracleAddr}`);
        console.log(`   Service Fee 1x: ${OFFICIAL_FEES.FORTUNE_SERVICE_FEE_1X} ETH`);
        console.log(`   Service Fee 5x: ${OFFICIAL_FEES.FORTUNE_SERVICE_FEE_5X} ETH`);
        console.log(`   Game Fee: ${OFFICIAL_FEES.FORTUNE_POOL_GAME_FEE / 100}% of wager`);
        console.log("   Resolution: INSTANT (same transaction)");
        console.log("\n   Prize Tiers:");
        for (const tier of FORTUNE_TIERS) {
            console.log(`      ${tier.tierId}. ${tier.name}: 1-${tier.maxRange} (${tier.chance}) → ${tier.multiplierBips / 10000}x`);
        }

        console.log("\n💰 TAXAS CONFIGURADAS:");
        console.log("----------------------------------------------------");
        console.log("   Staking Entry:      0.5%");
        console.log("   Unstaking:          1%");
        console.log("   Force Unstake:      50%");
        console.log("   Claim Reward:       1%");
        console.log("   NFT Buy:            5%");
        console.log("   NFT Sell:           10%");
        console.log("   Fortune Game Fee:   10%");
        console.log("   Rental:             10%");
        console.log("   Notary:             1 BKC");

        console.log("\n📊 DISTRIBUIÇÃO:");
        console.log("----------------------------------------------------");
        console.log("   Mining (novos):     30% Treasury / 70% Stakers");
        console.log("   Fees (existentes):  30% Treasury / 70% Stakers");

        console.log("\n⚠️ PRÓXIMOS PASSOS:");
        console.log("----------------------------------------------------");
        console.log("   1. Execute o script de TGE e liquidez inicial");
        console.log("   2. Para o FortunePool:");
        console.log("      - fortune.fundPrizePool(amount) para adicionar BKC ao pool");
        console.log("   3. Para mudar o Oracle (se necessário):");
        console.log("      - fortune.setOracle(newAddress)");

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