// scripts/resume_deploy.ts
// ════════════════════════════════════════════════════════════════════════════
// Resume deploy from Fase 8 (Notary onwards) — uses existing deployed contracts
// ════════════════════════════════════════════════════════════════════════════

import fs from "fs";
import path from "path";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const TX_DELAY_MS = 1000;
const DEPLOY_DELAY_MS = 2000;
const RETRY_DELAY_MS = 3000;

const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");

function updateAddressJSON(key: string, value: string) {
    let addresses: any = {};
    if (fs.existsSync(addressesFilePath)) {
        addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
    }
    addresses[key] = value;
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
}

async function sendTxWithRetry(
    txFunction: () => Promise<any>,
    description: string,
    maxRetries = 5
): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`   ⏳ ${description}...`);
            const tx = await txFunction();
            const receipt = await tx.wait();
            console.log(`   ✅ ${description} (gas: ${receipt.gasUsed})`);
            console.log(`      📜 TX: ${receipt.hash}`);
            await sleep(TX_DELAY_MS);
            return receipt;
        } catch (error: any) {
            const msg = error.message || "";
            if (msg.includes("already") || msg.includes("Already")) {
                console.log(`   ⏩ Already done: ${description}`);
                return null;
            }
            console.log(`   ❌ Attempt ${attempt}/${maxRetries}: ${msg.slice(0, 80)}`);
            if (attempt === maxRetries) throw error;
            await sleep(RETRY_DELAY_MS * attempt);
        }
    }
}

async function deployContract(Factory: any, args: any[], name: string) {
    console.log(`\n   📦 Deploying ${name}...`);
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            const contract = await Factory.deploy(...args);
            await contract.waitForDeployment();
            const address = await contract.getAddress();
            const deployTx = contract.deploymentTransaction();
            console.log(`   ✅ ${name}: ${address}`);
            if (deployTx) console.log(`      📜 TX: ${deployTx.hash}`);
            await sleep(DEPLOY_DELAY_MS);
            return { contract, address };
        } catch (error: any) {
            console.log(`   ❌ Attempt ${attempt}/5: ${error.message?.slice(0, 60)}`);
            if (attempt === 5) throw error;
            await sleep(RETRY_DELAY_MS * attempt);
        }
    }
    throw new Error(`Failed to deploy ${name}`);
}

// ════════════════════════════════════════════════════════════════════════════
//                    CONFIG (same as deploy_ecosystem.ts)
// ════════════════════════════════════════════════════════════════════════════

const SYSTEM_WALLETS = {
    TREASURY: "0xc93030333E3a235c2605BcB7C7330650B600B6D0",
};

const FEE_TYPE_GAS = 0;
const FEE_TYPE_VALUE = 1;

const GAS_FEE_SOCIAL    = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 50,        gasEstimate: 150000 };
const GAS_FEE_CONTENT   = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 200,       gasEstimate: 200000 };
const GAS_FEE_FINANCIAL = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 2000,      gasEstimate: 200000 };
const GAS_FEE_PREMIUM   = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 2700,      gasEstimate: 300000 };

const GAS_FEE_BADGE_VERIFIED = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 120000,   gasEstimate: 200000 };
const GAS_FEE_BADGE_PREMIUM  = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 600000,   gasEstimate: 200000 };
const GAS_FEE_BADGE_ELITE    = { feeType: FEE_TYPE_GAS, bps: 100, multiplier: 1500000,  gasEstimate: 200000 };

const MODULE_CONFIGS = {
    STANDARD:    { active: true, customBps: 0,    operatorBps: 1500, treasuryBps: 3000, buybackBps: 5500 },
    AGORA:       { active: true, customBps: 5000, operatorBps: 750,  treasuryBps: 1500, buybackBps: 2750 },
    CHARITY:     { active: true, customBps: 7000, operatorBps: 450,  treasuryBps: 900,  buybackBps: 1650 },
};

const ACTION_FEE_CONFIGS: Record<string, any> = {
    "STAKING_DELEGATE": GAS_FEE_FINANCIAL, "STAKING_CLAIM": GAS_FEE_SOCIAL, "STAKING_FORCE_UNSTAKE": GAS_FEE_FINANCIAL,
    "AGORA_POST": GAS_FEE_CONTENT, "AGORA_POST_IMAGE": GAS_FEE_CONTENT, "AGORA_POST_VIDEO": GAS_FEE_CONTENT,
    "AGORA_LIVE": GAS_FEE_CONTENT, "AGORA_REPLY": GAS_FEE_SOCIAL, "AGORA_REPOST": GAS_FEE_SOCIAL,
    "AGORA_LIKE": GAS_FEE_SOCIAL, "AGORA_FOLLOW": GAS_FEE_SOCIAL, "AGORA_REPORT": GAS_FEE_CONTENT,
    "AGORA_PROFILE_BOOST": GAS_FEE_PREMIUM,
    "AGORA_BADGE_VERIFIED": GAS_FEE_BADGE_VERIFIED, "AGORA_BADGE_PREMIUM": GAS_FEE_BADGE_PREMIUM, "AGORA_BADGE_ELITE": GAS_FEE_BADGE_ELITE,
    "FORTUNE_TIER0": GAS_FEE_SOCIAL, "FORTUNE_TIER1": GAS_FEE_FINANCIAL, "FORTUNE_TIER2": GAS_FEE_FINANCIAL,
    "NOTARY_CERTIFY": GAS_FEE_CONTENT,
    "CHARITY_CREATE": GAS_FEE_FINANCIAL, "CHARITY_BOOST": GAS_FEE_CONTENT,
    "RENTAL_BOOST": GAS_FEE_PREMIUM,
    "FUSION_BRONZE": GAS_FEE_FINANCIAL, "FUSION_SILVER": GAS_FEE_FINANCIAL, "FUSION_GOLD": GAS_FEE_FINANCIAL,
    "SPLIT_SILVER": GAS_FEE_FINANCIAL, "SPLIT_GOLD": GAS_FEE_FINANCIAL, "SPLIT_DIAMOND": GAS_FEE_FINANCIAL,
};

const VALUE_FEE_CONFIGS: Record<string, { bps: number }> = {
    "CHARITY_DONATE": { bps: 500 },
    "RENTAL_RENT":    { bps: 2000 },
};

const NFT_FEE_CONFIG = { BUY: GAS_FEE_FINANCIAL, SELL: GAS_FEE_FINANCIAL };

const BKC_DISTRIBUTION = { burnBps: 0, operatorBps: 1500, stakerBps: 7000, treasuryBps: 1500 };

const LIQUIDITY_CONFIG = {
    FORTUNE_POOL: 1_000_000n * 10n**18n,
    FAUCET_BKC: 4_000_000n * 10n**18n,
    LIQUIDITY_POOL_BKC: 2_000_000n * 10n**18n,
    LIQUIDITY_POOL_ETH: "0.5",
    REFERRAL_BONUS_BKC: 100_000n * 10n**18n,
};

const FAUCET_CONFIG = {
    TOKENS_PER_REQUEST: 20n * 10n**18n,
    ETH_PER_REQUEST: 1n * 10n**15n,
    COOLDOWN_SECONDS: 86400,
};

// ════════════════════════════════════════════════════════════════════════════
//                    MAIN — RESUME FROM FASE 8
// ════════════════════════════════════════════════════════════════════════════

async function main() {
    const hre = require("hardhat");
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;
    const isMainnet = networkName === "opbnbMainnet";

    // Load existing addresses
    const addr = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
    const deployerAddr = deployer.address;
    const treasuryAddr = SYSTEM_WALLETS.TREASURY;

    console.log("\n════════════════════════════════════════════════════════════════════════════");
    console.log("               🔄 RESUME DEPLOY — Fases 8b-14");
    console.log("════════════════════════════════════════════════════════════════════════════");
    console.log(`   Network:     ${networkName}`);
    console.log(`   Deployer:    ${deployerAddr}`);
    console.log(`   Balance:     ${ethers.formatEther(await ethers.provider.getBalance(deployerAddr))} ETH`);
    console.log(`   Already deployed: ${Object.keys(addr).length} contracts`);
    console.log("════════════════════════════════════════════════════════════════════════════\n");

    // Attach to already-deployed contracts
    const bkc = await ethers.getContractAt("BKCToken", addr.bkcToken);
    const eco = await ethers.getContractAt("BackchainEcosystem", addr.backchainEcosystem);
    const lp = await ethers.getContractAt("LiquidityPool", addr.liquidityPool);
    const staking = await ethers.getContractAt("StakingPool", addr.stakingPool);
    const fortune = await ethers.getContractAt("FortunePool", addr.fortunePool);
    const bronzePool = await ethers.getContractAt("NFTPool", addr.pool_bronze);

    const bkcAddr = addr.bkcToken;
    const ecoAddr = addr.backchainEcosystem;
    const lpAddr = addr.liquidityPool;
    const stakingAddr = addr.stakingPool;
    const buybackAddr = addr.buybackMiner;
    const boosterAddr = addr.rewardBooster;
    const fusionAddr = addr.nftFusion;
    const bronzePoolAddr = addr.pool_bronze;
    const fortuneAddr = addr.fortunePool;
    const agoraAddr = addr.agora;

    // ══════════════════════════════════════════════════════════════════════
    // FASE 8b: Deploy remaining modules (Notary, CharityPool, RentalManager)
    // ══════════════════════════════════════════════════════════════════════
    console.log("═══════════════════════════════════════════════════════════════════════");
    console.log("   FASE 8b: Deploy Notary, CharityPool, RentalManager");
    console.log("═══════════════════════════════════════════════════════════════════════");

    // Notary constructor(address _ecosystem, string memory baseTokenURI_)
    const Notary = await ethers.getContractFactory("Notary");
    const notaryBaseURI = isMainnet
        ? "https://backcoin.org/api/cert-metadata/"
        : "https://backchain-dapp.vercel.app/api/cert-metadata/";
    const { address: notaryAddr } = await deployContract(Notary, [ecoAddr, notaryBaseURI], "Notary");
    updateAddressJSON("notary", notaryAddr);

    // CharityPool constructor(address _ecosystem)
    const CharityPool = await ethers.getContractFactory("CharityPool");
    const { address: charityAddr } = await deployContract(CharityPool, [ecoAddr], "CharityPool");
    updateAddressJSON("charityPool", charityAddr);

    // RentalManager constructor(address _ecosystem, address _rewardBooster)
    const RentalManager = await ethers.getContractFactory("RentalManager");
    const { address: rentalAddr } = await deployContract(RentalManager, [ecoAddr, boosterAddr], "RentalManager");
    updateAddressJSON("rentalManager", rentalAddr);

    // ══════════════════════════════════════════════════════════════════════
    // FASE 9: Configuração do Ecossistema
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════════════");
    console.log("   FASE 9: Registrar Módulos + Configurar Ecossistema");
    console.log("═══════════════════════════════════════════════════════════════════════");

    await sendTxWithRetry(async () => await eco.setBuybackMiner(buybackAddr), "Ecosystem.setBuybackMiner()");
    await sendTxWithRetry(async () => await eco.setStakingPool(stakingAddr), "Ecosystem.setStakingPool()");
    await sendTxWithRetry(async () => await eco.setTutorRelayer(deployerAddr), "Ecosystem.setTutorRelayer(deployer)");
    await sendTxWithRetry(async () => await eco.setTutorBps(500), "Ecosystem.setTutorBps(500 = 5%)");

    // registerModuleBatch — 8 módulos
    const moduleContracts = [stakingAddr, bronzePoolAddr, fortuneAddr, agoraAddr, notaryAddr, charityAddr, rentalAddr, fusionAddr];
    const moduleIds = [
        ethers.id("STAKING"), ethers.id("NFT_POOL"), ethers.id("FORTUNE"), ethers.id("AGORA"),
        ethers.id("NOTARY"), ethers.id("CHARITY"), ethers.id("RENTAL"), ethers.id("NFT_FUSION"),
    ];
    const moduleConfigsTuples = [
        MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.AGORA,
        MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.CHARITY, MODULE_CONFIGS.STANDARD, MODULE_CONFIGS.STANDARD,
    ].map(c => [c.active, c.customBps, c.operatorBps, c.treasuryBps, c.buybackBps]);

    await sendTxWithRetry(
        async () => await eco.registerModuleBatch(moduleContracts, moduleIds, moduleConfigsTuples),
        "Ecosystem.registerModuleBatch() — 8 módulos"
    );
    console.log("   ✅ 8 módulos registrados!");

    // ══════════════════════════════════════════════════════════════════════
    // FASE 9b: Fee Configs + BKC Distribution
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════════════");
    console.log("   FASE 9b: Configurar FeeConfig para cada ação");
    console.log("═══════════════════════════════════════════════════════════════════════");

    const actionIds: string[] = [];
    const feeConfigs: any[] = [];

    for (const [name, cfg] of Object.entries(ACTION_FEE_CONFIGS)) {
        actionIds.push(ethers.id(name));
        feeConfigs.push([cfg.feeType, cfg.bps, cfg.multiplier, cfg.gasEstimate]);
    }
    for (const [name, cfg] of Object.entries(VALUE_FEE_CONFIGS)) {
        actionIds.push(ethers.id(name));
        feeConfigs.push([FEE_TYPE_VALUE, cfg.bps, 0, 0]);
    }
    // NFTPool Bronze buy/sell
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    actionIds.push(ethers.keccak256(abiCoder.encode(["string", "uint8"], ["NFT_BUY_T", 0])));
    feeConfigs.push([NFT_FEE_CONFIG.BUY.feeType, NFT_FEE_CONFIG.BUY.bps, NFT_FEE_CONFIG.BUY.multiplier, NFT_FEE_CONFIG.BUY.gasEstimate]);
    actionIds.push(ethers.keccak256(abiCoder.encode(["string", "uint8"], ["NFT_SELL_T", 0])));
    feeConfigs.push([NFT_FEE_CONFIG.SELL.feeType, NFT_FEE_CONFIG.SELL.bps, NFT_FEE_CONFIG.SELL.multiplier, NFT_FEE_CONFIG.SELL.gasEstimate]);

    console.log(`   📋 Configurando ${actionIds.length} action fees...`);
    await sendTxWithRetry(
        async () => await eco.setFeeConfigBatch(actionIds, feeConfigs),
        `Ecosystem.setFeeConfigBatch() — ${actionIds.length} ações`
    );

    await sendTxWithRetry(
        async () => await eco.setBkcDistribution(BKC_DISTRIBUTION.burnBps, BKC_DISTRIBUTION.operatorBps, BKC_DISTRIBUTION.stakerBps, BKC_DISTRIBUTION.treasuryBps),
        "Ecosystem.setBkcDistribution()"
    );
    console.log("   ✅ Todas as taxas configuradas!");

    // ══════════════════════════════════════════════════════════════════════
    // FASE 10: StakingPool + BKCToken Minter
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════════════");
    console.log("   FASE 10: Configurar StakingPool + Autorizar Minter");
    console.log("═══════════════════════════════════════════════════════════════════════");

    await sendTxWithRetry(async () => await staking.setRewardNotifier(buybackAddr, true), "StakingPool.setRewardNotifier(BuybackMiner)");
    await sendTxWithRetry(async () => await staking.setRewardNotifier(ecoAddr, true), "StakingPool.setRewardNotifier(Ecosystem)");
    await sendTxWithRetry(async () => await staking.setRewardBooster(boosterAddr), "StakingPool.setRewardBooster()");
    await sendTxWithRetry(async () => await bkc.addMinter(buybackAddr), "BKCToken.addMinter(BuybackMiner)");
    console.log("   ✅ StakingPool configurado + BuybackMiner autorizado como minter!");

    // ══════════════════════════════════════════════════════════════════════
    // FASE 11: Liquidez Inicial
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════════════");
    console.log("   FASE 11: Liquidez Inicial");
    console.log("═══════════════════════════════════════════════════════════════════════");

    // Fortune Pool
    await sendTxWithRetry(async () => await bkc.approve(fortuneAddr, LIQUIDITY_CONFIG.FORTUNE_POOL), "Approve BKC FortunePool");
    await sendTxWithRetry(async () => await fortune.fundPrizePool(LIQUIDITY_CONFIG.FORTUNE_POOL), `FortunePool: ${ethers.formatEther(LIQUIDITY_CONFIG.FORTUNE_POOL)} BKC`);

    // Liquidity Pool
    const lpBkcAmount = LIQUIDITY_CONFIG.LIQUIDITY_POOL_BKC;
    const lpEthAmount = ethers.parseEther(LIQUIDITY_CONFIG.LIQUIDITY_POOL_ETH);
    await sendTxWithRetry(async () => await bkc.approve(lpAddr, lpBkcAmount), "Approve BKC LiquidityPool");
    await sendTxWithRetry(async () => await lp.addLiquidity(lpBkcAmount, 0, { value: lpEthAmount }), `LiquidityPool: ${ethers.formatEther(lpBkcAmount)} BKC + ${LIQUIDITY_CONFIG.LIQUIDITY_POOL_ETH} ETH`);

    // Tutor Bonus
    const tutorBonusBkc = LIQUIDITY_CONFIG.REFERRAL_BONUS_BKC;
    await sendTxWithRetry(async () => await bkc.approve(ecoAddr, tutorBonusBkc), "Approve BKC Tutor Bonus");
    await sendTxWithRetry(async () => await eco.fundTutorBonus(tutorBonusBkc), `Ecosystem.fundTutorBonus(${ethers.formatEther(tutorBonusBkc)} BKC)`);

    // ══════════════════════════════════════════════════════════════════════
    // FASE 12: Faucet (testnet only)
    // ══════════════════════════════════════════════════════════════════════
    if (!isMainnet) {
        console.log("\n═══════════════════════════════════════════════════════════════════════");
        console.log("   FASE 12: Deploy SimpleBKCFaucet (Testnet)");
        console.log("═══════════════════════════════════════════════════════════════════════");

        const SimpleBKCFaucet = await ethers.getContractFactory("SimpleBKCFaucet");
        const { address: faucetAddr } = await deployContract(
            SimpleBKCFaucet,
            [bkcAddr, deployerAddr, FAUCET_CONFIG.TOKENS_PER_REQUEST, FAUCET_CONFIG.ETH_PER_REQUEST, FAUCET_CONFIG.COOLDOWN_SECONDS],
            "SimpleBKCFaucet"
        );
        updateAddressJSON("simpleBkcFaucet", faucetAddr);

        await sendTxWithRetry(async () => await bkc.transfer(faucetAddr, LIQUIDITY_CONFIG.FAUCET_BKC), `Faucet: ${ethers.formatEther(LIQUIDITY_CONFIG.FAUCET_BKC)} BKC`);
        await sendTxWithRetry(
            async () => await deployer.sendTransaction({ to: faucetAddr, value: ethers.parseEther("1.0") }),
            "Faucet: 1.0 ETH"
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // FASE 13: BackchainGovernance
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════════════");
    console.log("   FASE 13: Deploy BackchainGovernance");
    console.log("═══════════════════════════════════════════════════════════════════════");

    const BackchainGovernance = await ethers.getContractFactory("BackchainGovernance");
    const { address: govAddr } = await deployContract(BackchainGovernance, [3600], "BackchainGovernance");
    updateAddressJSON("backchainGovernance", govAddr);

    // ══════════════════════════════════════════════════════════════════════
    // FASE 14: Transfer BKC restante para Treasury
    // ══════════════════════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════════════════════");
    console.log("   FASE 14: Transfer BKC restante para Treasury");
    console.log("═══════════════════════════════════════════════════════════════════════");

    if (deployerAddr.toLowerCase() !== treasuryAddr.toLowerCase()) {
        const remainingBkc = await bkc.balanceOf(deployerAddr);
        if (remainingBkc > 0n) {
            await sendTxWithRetry(
                async () => await bkc.transfer(treasuryAddr, remainingBkc),
                `Transfer ${ethers.formatEther(remainingBkc)} BKC → Treasury`
            );
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // RESUMO FINAL
    // ══════════════════════════════════════════════════════════════════════
    const finalAddr = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
    console.log("\n════════════════════════════════════════════════════════════════════════════");
    console.log("                         📊 DEPLOY COMPLETO!");
    console.log("════════════════════════════════════════════════════════════════════════════");
    console.log("\n📋 TODOS OS CONTRATOS:");
    for (const [key, val] of Object.entries(finalAddr)) {
        console.log(`   ${key}: ${val}`);
    }

    const deployerBkc = await bkc.balanceOf(deployerAddr);
    const deployerEth = await ethers.provider.getBalance(deployerAddr);
    console.log(`\n💰 Deployer: ${ethers.formatEther(deployerBkc)} BKC / ${ethers.formatEther(deployerEth)} ETH`);
    console.log("\n   🎉 BACKCHAIN V10.0 DEPLOY COMPLETO!");
}

main().catch((error) => {
    console.error("\n❌ ERRO:", error.message);
    console.error(error);
    process.exit(1);
});
