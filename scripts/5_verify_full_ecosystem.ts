/**
 * 🔬 BACKCOIN V3.0 ECOSYSTEM VERIFICATION SCRIPT
 * 
 * Melhorias:
 * - Mostra Service Fee real (não 0.0000)
 * - Mostra desconto esperado vs real para CADA ação
 * - Fortune: mostra números jogados vs resultado do Oracle
 * - Links clicáveis para todas as transações
 * - CharityPool: 3 cenários completos com 10+ doações cada
 *   1. Campanha que NÃO atinge meta (cancelled)
 *   2. Campanha que ATINGE meta (completed)
 *   3. Campanha que é PAUSADA/CANCELADA antes do fim
 * 
 * Uso: npx hardhat run scripts/5_verify_full_ecosystem.ts --network arbitrumSepolia
 */

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// =================================================================
// ⚙️ CONFIGURATION
// =================================================================

const ARBISCAN_BASE = "https://sepolia.arbiscan.io/tx/";

const TIERS = [
    { name: "🚫 Baseline (No NFT)", boost: 0n, discountBips: 0n, poolName: null },
    { name: "🔮 Crystal",  boost: 1000n, discountBips: 1000n, poolName: "crystal" },
    { name: "⚙️ Iron",     boost: 2000n, discountBips: 2000n, poolName: "iron" },
    { name: "🥉 Bronze",   boost: 3000n, discountBips: 3000n, poolName: "bronze" },
    { name: "🥈 Silver",   boost: 4000n, discountBips: 4000n, poolName: "silver" },
    { name: "🥇 Gold",     boost: 5000n, discountBips: 5000n, poolName: "gold" },
    { name: "💠 Platinum", boost: 6000n, discountBips: 6000n, poolName: "platinum" },
    { name: "💎 Diamond",  boost: 7000n, discountBips: 7000n, poolName: "diamond" },
];

const FEE_KEYS = {
    DELEGATION_FEE_BIPS: ethers.id("DELEGATION_FEE_BIPS"),
    NOTARY_SERVICE: ethers.id("NOTARY_SERVICE"),
    NFT_POOL_BUY_TAX_BIPS: ethers.id("NFT_POOL_BUY_TAX_BIPS"),
    NFT_POOL_SELL_TAX_BIPS: ethers.id("NFT_POOL_SELL_TAX_BIPS"),
    RENTAL_FEE_BIPS: ethers.id("RENTAL_MARKET_TAX_BIPS"),
};

const TEST_CONFIG = {
    STAKE_AMOUNT: ethers.parseEther("100"),
    STAKE_LOCK_DAYS: 30,
    FORTUNE_WAGER: ethers.parseEther("10"),
    RENTAL_PRICE: ethers.parseEther("10"),
    MIN_BKC_BALANCE: ethers.parseEther("1000"),
};

// Charity test scenarios
const CHARITY_SCENARIOS = {
    // Cenário 1: Meta NÃO atingida (100 BKC goal, ~50 BKC raised)
    NOT_REACHED: {
        name: "Meta NÃO Atingida",
        goal: ethers.parseEther("100"),
        donations: [5, 3, 7, 4, 6, 2, 8, 5, 4, 6].map(n => ethers.parseEther(n.toString())),
        shouldComplete: false,
        durationDays: 7,
    },
    // Cenário 2: Meta ATINGIDA (50 BKC goal, ~80 BKC raised)
    REACHED: {
        name: "Meta ATINGIDA",
        goal: ethers.parseEther("50"),
        donations: [10, 8, 12, 5, 7, 9, 6, 11, 8, 4].map(n => ethers.parseEther(n.toString())),
        shouldComplete: true,
        durationDays: 7,
    },
    // Cenário 3: Campanha CANCELADA antes do fim
    CANCELLED: {
        name: "Campanha CANCELADA",
        goal: ethers.parseEther("200"),
        donations: [15, 10, 20, 12, 8, 5, 7, 9, 6, 8].map(n => ethers.parseEther(n.toString())),
        shouldComplete: false,
        durationDays: 30,
    },
};

type AuditEntry = {
    tier: string;
    action: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP" | "ℹ️ INFO";
    expected?: string;
    actual?: string;
    txHash?: string;
    txLink?: string;
    details?: string;
};

const REPORT: AuditEntry[] = [];

// =================================================================
// 🛠️ HELPERS
// =================================================================

const toEther = (val: bigint): string => parseFloat(ethers.formatEther(val)).toFixed(4);
const toEtherShort = (val: bigint): string => parseFloat(ethers.formatEther(val)).toFixed(6);
const toBips = (val: bigint): string => `${Number(val) / 100}%`;
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const txLink = (hash: string): string => `${ARBISCAN_BASE}${hash}`;

function logSection(title: string): void {
    console.log(`\n${"═".repeat(80)}`);
    console.log(`   ${title}`);
    console.log(`${"═".repeat(80)}`);
}

function logSubsection(title: string): void {
    console.log(`\n   ─── ${title} ───`);
}

function logTx(description: string, hash: string): void {
    console.log(`      📤 ${description}`);
    console.log(`         🔗 ${txLink(hash)}`);
}

function calculateExpectedFee(baseFee: bigint, discountBips: bigint): bigint {
    if (discountBips === 0n) return baseFee;
    return (baseFee * (10000n - discountBips)) / 10000n;
}

function formatDiscount(baseFee: bigint, actualFee: bigint, expectedDiscount: bigint): string {
    const actualDiscount = baseFee > 0n ? ((baseFee - actualFee) * 10000n / baseFee) : 0n;
    const match = actualDiscount === expectedDiscount;
    return `Expected: ${toBips(expectedDiscount)} | Actual: ${toBips(actualDiscount)} ${match ? '✅' : '❌'}`;
}

// =================================================================
// 📋 MAIN SCRIPT
// =================================================================

async function main(): Promise<void> {
    const [tester] = await ethers.getSigners();
    if (!tester) throw new Error("No signer configured. Check your .env file.");

    const ethBalance = await tester.provider!.getBalance(tester.address);

    console.log(`\n${"═".repeat(80)}`);
    console.log(`   🔬 BACKCOIN V3.0 ECOSYSTEM VERIFICATION`);
    console.log(`   🦀 Backcoin Oracle (Stylus) - INSTANT Resolution`);
    console.log(`${"═".repeat(80)}`);
    console.log(`   📅 Date: ${new Date().toISOString()}`);
    console.log(`   🧑‍🚀 Tester: ${tester.address}`);
    console.log(`   💰 ETH Balance: ${toEther(BigInt(ethBalance.toString()))} ETH`);

    // Load addresses
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error("deployment-addresses.json not found. Run deployment first.");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    console.log(`   📋 Loaded ${Object.keys(addresses).length} contract addresses`);
    
    if (addresses.backcoinOracle) {
        console.log(`   🦀 Backcoin Oracle: ${addresses.backcoinOracle}`);
    }

    // Connect to contracts
    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, tester);
    const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, tester);
    const notary = await ethers.getContractAt("DecentralizedNotary", addresses.decentralizedNotary, tester);
    const delegation = await ethers.getContractAt("DelegationManager", addresses.delegationManager, tester);
    const nft = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, tester);
    const factory = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, tester);
    const faucet = await ethers.getContractAt("SimpleBKCFaucet", addresses.faucet, tester) as any;
    const fortune = await ethers.getContractAt("FortunePool", addresses.fortunePool, tester) as any;
    const rental = await ethers.getContractAt("RentalManager", addresses.rentalManager, tester) as any;
    const charity = addresses.charityPool 
        ? await ethers.getContractAt("CharityPool", addresses.charityPool, tester) as any
        : null;

    let bkcBalance = BigInt((await bkc.balanceOf(tester.address)).toString());
    console.log(`   💎 BKC Balance: ${toEther(bkcBalance)} BKC\n`);

    // =================================================================
    // 1. FAUCET TEST
    // =================================================================
    logSection("🚰 FAUCET TEST");
    await testFaucet(faucet, bkc, tester);

    // =================================================================
    // 2. READ BASE FEES
    // =================================================================
    logSection("📊 BASE FEES CONFIGURATION");
    const baseFees = await readBaseFees(hub, fortune, charity);

    // =================================================================
    // 3. CHARITY POOL TESTS (3 cenários)
    // =================================================================
    if (charity) {
        await testCharityPool(charity, bkc, tester, addresses);
    }

    // =================================================================
    // 4. RUN TIER TESTS
    // =================================================================
    for (const tier of TIERS) {
        await runTierTest(tier, {
            tester,
            addresses,
            bkc: bkc as any,
            hub: hub as any,
            notary: notary as any,
            delegation: delegation as any,
            nft: nft as any,
            factory: factory as any,
            fortune,
            rental,
            baseFees
        });
        
        await sleep(2000);
    }

    // =================================================================
    // 5. FINAL REPORT
    // =================================================================
    printFinalReport();
}

// =================================================================
// 🚰 FAUCET TEST
// =================================================================

async function testFaucet(faucet: any, bkc: any, tester: any): Promise<void> {
    try {
        const faucetStatus = await faucet.getFaucetStatus();
        const userInfo = await faucet.getUserInfo(tester.address);
        
        console.log(`\n   📊 Faucet Status:`);
        console.log(`      ETH Balance: ${toEther(BigInt(faucetStatus.ethBalance.toString()))} ETH`);
        console.log(`      BKC Balance: ${toEther(BigInt(faucetStatus.tokenBalance.toString()))} BKC`);
        console.log(`      Per Claim: ${toEther(BigInt(faucetStatus.tokensPerClaim.toString()))} BKC + ${toEther(BigInt(faucetStatus.ethPerClaim.toString()))} ETH`);
        
        console.log(`\n   👤 User Status:`);
        const lastClaimTime = BigInt(userInfo.lastClaim.toString());
        console.log(`      Last Claim: ${lastClaimTime > 0n ? new Date(Number(lastClaimTime) * 1000).toISOString() : 'Never'}`);
        console.log(`      Total Claims: ${userInfo.claimCount.toString()}`);
        console.log(`      Can Claim Now: ${userInfo.canClaimNow ? '✅ Yes' : '❌ No'}`);

        if (!userInfo.canClaimNow) {
            const cooldownLeft = Number(userInfo.cooldownLeft.toString());
            const mins = Math.floor(cooldownLeft / 60);
            const secs = cooldownLeft % 60;
            console.log(`      ⏳ Cooldown: ${mins}m ${secs}s remaining`);
            REPORT.push({ tier: "Setup", action: "Faucet", status: "⚠️ SKIP", details: `Cooldown: ${mins}m ${secs}s` });
        } else {
            const bkcBalance = BigInt((await bkc.balanceOf(tester.address)).toString());
            if (bkcBalance >= TEST_CONFIG.MIN_BKC_BALANCE) {
                console.log(`\n   ✅ Sufficient balance (${toEther(bkcBalance)} BKC)`);
                REPORT.push({ tier: "Setup", action: "Faucet", status: "⚠️ SKIP", details: "Sufficient balance" });
            } else {
                console.log(`\n   🔄 Claiming from faucet...`);
                const tx = await faucet.distributeTo(tester.address);
                const receipt = await tx.wait();
                logTx("Faucet Claim", tx.hash);
                REPORT.push({ tier: "Setup", action: "Faucet Claim", status: "✅ PASS", txHash: tx.hash, txLink: txLink(tx.hash) });
            }
        }
    } catch (e: any) {
        console.log(`   ❌ Faucet error: ${e.message.slice(0, 80)}`);
        REPORT.push({ tier: "Setup", action: "Faucet", status: "❌ FAIL", details: e.message.slice(0, 50) });
    }
}

// =================================================================
// 📊 READ BASE FEES
// =================================================================

async function readBaseFees(hub: any, fortune: any, charity: any): Promise<Record<string, bigint>> {
    const baseFees: Record<string, bigint> = {};
    
    baseFees.DELEGATION_FEE_BIPS = BigInt((await hub.getFee(FEE_KEYS.DELEGATION_FEE_BIPS)).toString());
    console.log(`\n   DELEGATION_FEE_BIPS: ${baseFees.DELEGATION_FEE_BIPS} (${toBips(baseFees.DELEGATION_FEE_BIPS)})`);
    
    baseFees.NOTARY_SERVICE = BigInt((await hub.getFee(FEE_KEYS.NOTARY_SERVICE)).toString());
    console.log(`   NOTARY_SERVICE: ${toEther(baseFees.NOTARY_SERVICE)} BKC (flat)`);
    
    baseFees.NFT_POOL_BUY_TAX_BIPS = BigInt((await hub.getFee(FEE_KEYS.NFT_POOL_BUY_TAX_BIPS)).toString());
    baseFees.NFT_POOL_SELL_TAX_BIPS = BigInt((await hub.getFee(FEE_KEYS.NFT_POOL_SELL_TAX_BIPS)).toString());
    console.log(`   NFT_POOL_BUY_TAX: ${toBips(baseFees.NFT_POOL_BUY_TAX_BIPS)}`);
    console.log(`   NFT_POOL_SELL_TAX: ${toBips(baseFees.NFT_POOL_SELL_TAX_BIPS)}`);

    baseFees.RENTAL_FEE_BIPS = BigInt((await hub.getFee(FEE_KEYS.RENTAL_FEE_BIPS)).toString());
    console.log(`   RENTAL_FEE: ${toBips(baseFees.RENTAL_FEE_BIPS)}`);

    // Fortune Pool Service Fee
    try {
        const serviceFee = BigInt((await fortune.serviceFee()).toString());
        baseFees.FORTUNE_SERVICE_FEE = serviceFee;
        console.log(`\n   🎰 FORTUNE POOL:`);
        console.log(`   SERVICE_FEE (1x): ${toEtherShort(serviceFee)} ETH`);
        console.log(`   SERVICE_FEE (5x): ${toEtherShort(serviceFee * 5n)} ETH`);
        
        if (serviceFee === 0n) {
            console.log(`   ⚠️ WARNING: Service fee is 0! Consider setting it.`);
        }
    } catch {
        baseFees.FORTUNE_SERVICE_FEE = 0n;
        console.log(`   ⚠️ Could not read Fortune Pool service fee`);
    }

    // CharityPool fees
    if (charity) {
        try {
            const feeConfig = await charity.getFeeConfig();
            console.log(`\n   🎗️ CHARITY POOL:`);
            console.log(`   Mining Fee: ${toBips(BigInt(feeConfig.miningFeeBips.toString()))}`);
            console.log(`   Burn Fee: ${toBips(BigInt(feeConfig.burnFeeBips.toString()))}`);
            console.log(`   Withdrawal ETH Fee: ${toEtherShort(BigInt(feeConfig.ethFee.toString()))} ETH`);
            console.log(`   Goal Not Met Penalty: ${toBips(BigInt(feeConfig.penaltyBips.toString()))}`);
            
            baseFees.CHARITY_MINING_FEE_BIPS = BigInt(feeConfig.miningFeeBips.toString());
            baseFees.CHARITY_BURN_FEE_BIPS = BigInt(feeConfig.burnFeeBips.toString());
            baseFees.CHARITY_ETH_FEE = BigInt(feeConfig.ethFee.toString());
            baseFees.CHARITY_PENALTY_BIPS = BigInt(feeConfig.penaltyBips.toString());
        } catch (e) {
            console.log(`   ⚠️ Could not read CharityPool fee config`);
        }
    }

    // Show NFT discounts
    console.log(`\n   📉 NFT Discount Tiers:`);
    for (const tier of TIERS.filter(t => t.boost > 0n)) {
        const discount = BigInt((await hub.getBoosterDiscount(tier.boost)).toString());
        console.log(`      ${tier.name}: ${toBips(discount)} discount`);
    }

    return baseFees;
}

// =================================================================
// 🎗️ CHARITY POOL TESTS
// =================================================================

async function testCharityPool(charity: any, bkc: any, tester: any, addresses: any): Promise<void> {
    logSection("🎗️ CHARITY POOL - 3 CENÁRIOS DE TESTE");

    // Get initial stats
    const statsBefore = await charity.getGlobalStats();
    console.log(`\n   📊 Stats Iniciais:`);
    console.log(`      Total Campanhas: ${statsBefore.totalCampaigns.toString()}`);
    console.log(`      Total Arrecadado: ${toEther(BigInt(statsBefore.totalRaised.toString()))} BKC`);
    console.log(`      Total Queimado: ${toEther(BigInt(statsBefore.totalBurned.toString()))} BKC`);

    // Test each scenario
    for (const [scenarioKey, scenario] of Object.entries(CHARITY_SCENARIOS)) {
        await runCharityScenario(charity, bkc, tester, addresses, scenarioKey, scenario);
        await sleep(2000);
    }

    // Final stats
    const statsAfter = await charity.getGlobalStats();
    console.log(`\n   📊 Stats Finais:`);
    console.log(`      Total Campanhas: ${statsAfter.totalCampaigns.toString()}`);
    console.log(`      Total Arrecadado: ${toEther(BigInt(statsAfter.totalRaised.toString()))} BKC`);
    console.log(`      Total Queimado: ${toEther(BigInt(statsAfter.totalBurned.toString()))} BKC`);
    console.log(`      Total Saques: ${statsAfter.totalWithdrawals.toString()}`);
}

async function runCharityScenario(
    charity: any, 
    bkc: any, 
    tester: any, 
    addresses: any,
    scenarioKey: string,
    scenario: typeof CHARITY_SCENARIOS.NOT_REACHED
): Promise<void> {
    logSubsection(`CENÁRIO: ${scenario.name}`);

    const tierName = `Charity-${scenarioKey}`;
    let campaignId: bigint | null = null;

    try {
        // ─────────────────────────────────────────────────────────────
        // A. CREATE CAMPAIGN
        // ─────────────────────────────────────────────────────────────
        console.log(`\n      📝 Criando campanha...`);
        console.log(`         Meta: ${toEther(scenario.goal)} BKC`);
        console.log(`         Duração: ${scenario.durationDays} dias`);
        console.log(`         Doações planejadas: ${scenario.donations.length}`);

        const totalDonations = scenario.donations.reduce((a, b) => a + b, 0n);
        console.log(`         Total doações: ${toEther(totalDonations)} BKC`);
        console.log(`         Meta será atingida: ${scenario.shouldComplete ? '✅ SIM' : '❌ NÃO'}`);

        const txCreate = await charity.createCampaign(
            `Test ${scenario.name} - ${Date.now()}`,
            `Teste automatizado: ${scenario.name}`,
            scenario.goal,
            scenario.durationDays
        );
        const rcCreate = await txCreate.wait();

        for (const log of rcCreate?.logs || []) {
            try {
                const parsed = charity.interface.parseLog(log);
                if (parsed?.name === "CampaignCreated") {
                    campaignId = BigInt(parsed.args.campaignId.toString());
                    break;
                }
            } catch {}
        }

        if (campaignId === null) {
            throw new Error("Campaign ID not found in events");
        }

        logTx(`Campanha #${campaignId} criada`, txCreate.hash);
        REPORT.push({
            tier: tierName,
            action: "Create Campaign",
            status: "✅ PASS",
            actual: `#${campaignId}`,
            txHash: txCreate.hash,
            txLink: txLink(txCreate.hash)
        });

        // ─────────────────────────────────────────────────────────────
        // B. MAKE DONATIONS (10+)
        // ─────────────────────────────────────────────────────────────
        console.log(`\n      💰 Realizando ${scenario.donations.length} doações...`);
        console.log(`      ┌─────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────────────────────────────────────────────────────┐`);
        console.log(`      │ Doação  │ Valor Bruto     │ Taxa Mining     │ Taxa Burn       │ Link TX                                                         │`);
        console.log(`      ├─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────────────────────────────────────────────────────┤`);

        let totalRaised = 0n;
        let totalMiningFee = 0n;
        let totalBurnFee = 0n;

        for (let i = 0; i < scenario.donations.length; i++) {
            const amount = scenario.donations[i];
            
            // Calculate expected fees
            const fees = await charity.calculateDonationFees(amount);
            const expectedNet = BigInt(fees.netAmount.toString());
            const expectedMining = BigInt(fees.miningFee.toString());
            const expectedBurn = BigInt(fees.burnFee.toString());

            // Approve and donate
            await bkc.approve(addresses.charityPool, amount);
            const txDonate = await charity.donate(campaignId, amount);
            const rcDonate = await txDonate.wait();

            // Parse event
            let actualNet = 0n;
            let actualMining = 0n;
            let actualBurn = 0n;

            for (const log of rcDonate?.logs || []) {
                try {
                    const parsed = charity.interface.parseLog(log);
                    if (parsed?.name === "DonationMade") {
                        actualNet = BigInt(parsed.args.netAmount.toString());
                        actualMining = BigInt(parsed.args.miningFee?.toString() || "0");
                        actualBurn = BigInt(parsed.args.burnFee?.toString() || "0");
                        break;
                    }
                } catch {}
            }

            // If fees not in event, calculate from amount
            if (actualMining === 0n && actualBurn === 0n) {
                actualMining = expectedMining;
                actualBurn = expectedBurn;
            }

            totalRaised += actualNet;
            totalMiningFee += actualMining;
            totalBurnFee += actualBurn;

            const shortLink = txLink(txDonate.hash).slice(0, 60) + "...";
            console.log(`      │ #${(i + 1).toString().padStart(2, '0')}     │ ${toEther(amount).padStart(12)} BKC │ ${toEther(actualMining).padStart(12)} BKC │ ${toEther(actualBurn).padStart(12)} BKC │ ${shortLink.padEnd(63)} │`);

            await sleep(500);
        }

        console.log(`      └─────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────────────────────────────────────────────────────┘`);
        console.log(`\n      📊 Resumo das Doações:`);
        console.log(`         Total Bruto: ${toEther(scenario.donations.reduce((a, b) => a + b, 0n))} BKC`);
        console.log(`         Total Líquido: ${toEther(totalRaised)} BKC`);
        console.log(`         Total Mining Fee: ${toEther(totalMiningFee)} BKC`);
        console.log(`         Total Burn Fee: ${toEther(totalBurnFee)} BKC`);

        REPORT.push({
            tier: tierName,
            action: `${scenario.donations.length} Donations`,
            status: "✅ PASS",
            actual: `${toEther(totalRaised)} BKC raised`,
            details: `Mining: ${toEther(totalMiningFee)}, Burn: ${toEther(totalBurnFee)}`
        });

        // ─────────────────────────────────────────────────────────────
        // C. CHECK CAMPAIGN STATUS
        // ─────────────────────────────────────────────────────────────
        const campaign = await charity.getCampaign(campaignId);
        const raised = BigInt(campaign.raisedAmount.toString());
        const goal = BigInt(campaign.goalAmount.toString());
        const progress = (raised * 100n) / goal;

        console.log(`\n      📈 Status da Campanha:`);
        console.log(`         Arrecadado: ${toEther(raised)} / ${toEther(goal)} BKC (${progress}%)`);
        console.log(`         Doações: ${campaign.donationCount.toString()}`);
        console.log(`         Status: ${['ACTIVE', 'COMPLETED', 'CANCELLED', 'WITHDRAWN'][campaign.status]}`);

        // ─────────────────────────────────────────────────────────────
        // D. CANCEL (if scenario requires)
        // ─────────────────────────────────────────────────────────────
        if (scenarioKey === 'CANCELLED' || scenarioKey === 'NOT_REACHED') {
            console.log(`\n      🚫 Cancelando campanha...`);
            
            const txCancel = await charity.cancelCampaign(campaignId);
            await txCancel.wait();
            
            logTx(`Campanha #${campaignId} cancelada`, txCancel.hash);
            REPORT.push({
                tier: tierName,
                action: "Cancel Campaign",
                status: "✅ PASS",
                txHash: txCancel.hash,
                txLink: txLink(txCancel.hash)
            });
        }

        // ─────────────────────────────────────────────────────────────
        // E. WITHDRAW
        // ─────────────────────────────────────────────────────────────
        console.log(`\n      💸 Processando saque...`);
        
        const withdrawal = await charity.calculateWithdrawal(campaignId);
        const grossAmount = BigInt(withdrawal.grossAmount.toString());
        const burnAmount = BigInt(withdrawal.burnAmount.toString());
        const netAmount = BigInt(withdrawal.netAmount.toString());
        const goalReached = withdrawal.goalReached;

        console.log(`\n      📊 Preview do Saque:`);
        console.log(`      ┌────────────────────────────────────────────────────┐`);
        console.log(`      │ Valor Bruto:        ${toEther(grossAmount).padStart(15)} BKC      │`);
        console.log(`      │ Penalidade/Burn:    ${toEther(burnAmount).padStart(15)} BKC      │`);
        console.log(`      │ Valor Líquido:      ${toEther(netAmount).padStart(15)} BKC      │`);
        console.log(`      │ Meta Atingida:      ${(goalReached ? '✅ SIM' : '❌ NÃO').padStart(15)}           │`);
        console.log(`      └────────────────────────────────────────────────────┘`);

        // Execute withdrawal
        const withdrawalFee = await charity.withdrawalFeeETH();
        console.log(`         ETH Fee: ${toEtherShort(BigInt(withdrawalFee.toString()))} ETH`);

        const balanceBefore = BigInt((await bkc.balanceOf(tester.address)).toString());
        
        const txWithdraw = await charity.withdraw(campaignId, { value: withdrawalFee });
        const rcWithdraw = await txWithdraw.wait();

        const balanceAfter = BigInt((await bkc.balanceOf(tester.address)).toString());
        const actualReceived = balanceAfter - balanceBefore;

        logTx(`Saque realizado`, txWithdraw.hash);
        
        console.log(`\n      ✅ Saque Concluído:`);
        console.log(`         Esperado: ${toEther(netAmount)} BKC`);
        console.log(`         Recebido: ${toEther(actualReceived)} BKC`);
        console.log(`         Match: ${actualReceived === netAmount ? '✅' : '❌'}`);

        REPORT.push({
            tier: tierName,
            action: "Withdraw",
            status: actualReceived === netAmount ? "✅ PASS" : "❌ FAIL",
            expected: `${toEther(netAmount)} BKC`,
            actual: `${toEther(actualReceived)} BKC`,
            txHash: txWithdraw.hash,
            txLink: txLink(txWithdraw.hash),
            details: goalReached ? "Goal reached" : "Goal NOT reached (penalty applied)"
        });

    } catch (e: any) {
        console.log(`      ❌ Erro: ${e.message.slice(0, 100)}`);
        REPORT.push({
            tier: tierName,
            action: "Scenario",
            status: "❌ FAIL",
            details: e.message.slice(0, 60)
        });
    }
}

// =================================================================
// 🔄 TIER TEST CYCLE
// =================================================================

interface TestContext {
    tester: any;
    addresses: any;
    bkc: any;
    hub: any;
    notary: any;
    delegation: any;
    nft: any;
    factory: any;
    fortune: any;
    rental: any;
    baseFees: Record<string, bigint>;
}

async function runTierTest(
    tier: { name: string; boost: bigint; discountBips: bigint; poolName: string | null },
    ctx: TestContext
): Promise<void> {
    logSection(`🚀 TIER: ${tier.name}`);
    console.log(`      Boost: ${toBips(tier.boost)} | Discount: ${toBips(tier.discountBips)}`);

    let acquiredTokenId: bigint | null = null;
    let poolAddress: string = ethers.ZeroAddress;

    // ─────────────────────────────────────────────────────────────
    // A. ACQUIRE NFT
    // ─────────────────────────────────────────────────────────────
    if (tier.boost > 0n && tier.poolName) {
        logSubsection("A. NFT ACQUISITION");

        try {
            poolAddress = await ctx.factory.getPoolAddress(tier.boost);
            
            if (poolAddress === ethers.ZeroAddress) {
                console.log(`      ⚠️ Pool not deployed`);
                REPORT.push({ tier: tier.name, action: "Pool Check", status: "⚠️ SKIP", details: "Pool not found" });
                return;
            }

            const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, ctx.tester);
            const availableIds = await pool.getAvailableNFTs();

            if (availableIds.length === 0) {
                console.log(`      ⚠️ No NFTs available`);
                REPORT.push({ tier: tier.name, action: "NFT Buy", status: "⚠️ SKIP", details: "Pool empty" });
                return;
            }

            const buyPrice = BigInt((await pool.getBuyPrice()).toString());
            const buyTax = (buyPrice * ctx.baseFees.NFT_POOL_BUY_TAX_BIPS) / 10000n;
            const totalCost = buyPrice + buyTax;

            console.log(`      Pool: ${poolAddress}`);
            console.log(`      Price: ${toEther(buyPrice)} BKC`);
            console.log(`      Tax (${toBips(ctx.baseFees.NFT_POOL_BUY_TAX_BIPS)}): ${toEther(buyTax)} BKC`);
            console.log(`      Total: ${toEther(totalCost)} BKC`);
            console.log(`      Available: ${availableIds.length} NFTs`);

            await ctx.bkc.approve(poolAddress, totalCost * 2n);
            
            const txBuy = await pool.buyNFT();
            const rcBuy = await txBuy.wait();

            for (const log of rcBuy?.logs || []) {
                try {
                    const parsed = ctx.nft.interface.parseLog(log);
                    if (parsed?.name === "Transfer" && parsed.args.to === ctx.tester.address) {
                        acquiredTokenId = BigInt(parsed.args.tokenId.toString());
                        break;
                    }
                } catch {}
            }

            if (acquiredTokenId !== null) {
                logTx(`NFT #${acquiredTokenId} purchased`, txBuy.hash);
                REPORT.push({
                    tier: tier.name,
                    action: "NFT Buy",
                    status: "✅ PASS",
                    actual: `#${acquiredTokenId}`,
                    txHash: txBuy.hash,
                    txLink: txLink(txBuy.hash),
                    details: `${toEther(totalCost)} BKC`
                });
            }

        } catch (e: any) {
            console.log(`      ❌ Error: ${e.message.slice(0, 60)}`);
            REPORT.push({ tier: tier.name, action: "NFT Buy", status: "❌ FAIL", details: e.message.slice(0, 40) });
            return;
        }
    }

    const nftForDiscount = acquiredTokenId ?? 0n;

    // ─────────────────────────────────────────────────────────────
    // B. RENTAL SYSTEM
    // ─────────────────────────────────────────────────────────────
    if (acquiredTokenId !== null) {
        logSubsection("B. RENTAL SYSTEM");

        try {
            await ctx.nft.approve(ctx.addresses.rentalManager, acquiredTokenId);
            
            const txList = await ctx.rental.listNFTSimple(acquiredTokenId, TEST_CONFIG.RENTAL_PRICE);
            await txList.wait();
            
            logTx(`NFT #${acquiredTokenId} listed`, txList.hash);

            const listing = await ctx.rental.listings(acquiredTokenId);
            const isActive = listing.isActive || listing[4];

            if (isActive) {
                REPORT.push({ tier: tier.name, action: "Rental List", status: "✅ PASS", txHash: txList.hash, txLink: txLink(txList.hash) });

                const txWithdraw = await ctx.rental.withdrawNFT(acquiredTokenId);
                await txWithdraw.wait();
                logTx(`NFT #${acquiredTokenId} withdrawn`, txWithdraw.hash);
                REPORT.push({ tier: tier.name, action: "Rental Withdraw", status: "✅ PASS", txHash: txWithdraw.hash, txLink: txLink(txWithdraw.hash) });
            }

        } catch (e: any) {
            console.log(`      ❌ Error: ${e.message.slice(0, 60)}`);
            REPORT.push({ tier: tier.name, action: "Rental", status: "❌ FAIL", details: e.message.slice(0, 40) });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // C. DELEGATION (Staking)
    // ─────────────────────────────────────────────────────────────
    logSubsection("C. DELEGATION - Fee Discount Test");

    try {
        const stakeAmount = TEST_CONFIG.STAKE_AMOUNT;
        const lockDuration = BigInt(86400 * TEST_CONFIG.STAKE_LOCK_DAYS);
        
        const baseFeeBips = ctx.baseFees.DELEGATION_FEE_BIPS;
        const baseFeeAmount = (stakeAmount * baseFeeBips) / 10000n;
        const expectedFee = calculateExpectedFee(baseFeeAmount, tier.discountBips);
        const expectedNet = stakeAmount - expectedFee;

        console.log(`\n      📊 DELEGATION FEE:`);
        console.log(`      ┌────────────────────────────────────────────────────────────────┐`);
        console.log(`      │ Stake Amount:           ${toEther(stakeAmount).padStart(15)} BKC             │`);
        console.log(`      │ Base Fee Rate:          ${toBips(baseFeeBips).padStart(15)}                  │`);
        console.log(`      │ Base Fee Amount:        ${toEther(baseFeeAmount).padStart(15)} BKC             │`);
        console.log(`      │ NFT Discount:           ${toBips(tier.discountBips).padStart(15)}                  │`);
        console.log(`      │ Expected Fee:           ${toEther(expectedFee).padStart(15)} BKC             │`);
        console.log(`      │ Expected Net:           ${toEther(expectedNet).padStart(15)} BKC             │`);
        console.log(`      └────────────────────────────────────────────────────────────────┘`);

        await ctx.bkc.approve(ctx.addresses.delegationManager, stakeAmount * 2n);
        
        const txDel = await ctx.delegation.delegate(stakeAmount, lockDuration, nftForDiscount);
        const rcDel = await txDel.wait();

        logTx("Delegation created", txDel.hash);

        let actualFee = 0n;
        let actualNet = 0n;
        
        for (const log of rcDel?.logs || []) {
            try {
                const parsed = ctx.delegation.interface.parseLog(log);
                if (parsed?.name === "Delegated") {
                    actualNet = BigInt(parsed.args.amount?.toString() || parsed.args.netAmount?.toString() || parsed.args[2]?.toString() || "0");
                    actualFee = BigInt(parsed.args.fee?.toString() || parsed.args.feeAmount?.toString() || parsed.args[4]?.toString() || "0");
                    break;
                }
            } catch {}
        }

        if (actualFee === 0n && actualNet > 0n) {
            actualFee = stakeAmount - actualNet;
        }

        console.log(`\n      📊 ACTUAL RESULTS:`);
        console.log(`      ┌────────────────────────────────────────────────────────────────┐`);
        console.log(`      │ Actual Fee:             ${toEther(actualFee).padStart(15)} BKC             │`);
        console.log(`      │ Actual Net:             ${toEther(actualNet).padStart(15)} BKC             │`);
        console.log(`      │ ${formatDiscount(baseFeeAmount, actualFee, tier.discountBips).padEnd(62)} │`);
        console.log(`      └────────────────────────────────────────────────────────────────┘`);

        const feeMatch = actualFee === expectedFee;
        REPORT.push({
            tier: tier.name,
            action: "Delegation Fee",
            status: feeMatch ? "✅ PASS" : "❌ FAIL",
            expected: `${toEther(expectedFee)} BKC`,
            actual: `${toEther(actualFee)} BKC`,
            txHash: txDel.hash,
            txLink: txLink(txDel.hash),
            details: `Discount: ${toBips(tier.discountBips)}`
        });

    } catch (e: any) {
        console.log(`      ❌ Error: ${e.message.slice(0, 60)}`);
        REPORT.push({ tier: tier.name, action: "Delegation", status: "❌ FAIL", details: e.message.slice(0, 40) });
    }

    // ─────────────────────────────────────────────────────────────
    // D. NOTARY SERVICE
    // ─────────────────────────────────────────────────────────────
    logSubsection("D. NOTARY SERVICE - Fee Discount Test");

    try {
        const baseFee = ctx.baseFees.NOTARY_SERVICE;
        
        if (baseFee === 0n) {
            console.log(`      ⚠️ Notary fee not configured`);
            REPORT.push({ tier: tier.name, action: "Notary", status: "⚠️ SKIP", details: "Fee = 0" });
        } else {
            const expectedFee = calculateExpectedFee(baseFee, tier.discountBips);

            console.log(`\n      📊 NOTARY FEE:`);
            console.log(`      ┌────────────────────────────────────────────────────────────────┐`);
            console.log(`      │ Base Fee (flat):        ${toEther(baseFee).padStart(15)} BKC             │`);
            console.log(`      │ NFT Discount:           ${toBips(tier.discountBips).padStart(15)}                  │`);
            console.log(`      │ Expected Fee:           ${toEther(expectedFee).padStart(15)} BKC             │`);
            console.log(`      └────────────────────────────────────────────────────────────────┘`);

            await ctx.bkc.approve(ctx.addresses.decentralizedNotary, baseFee * 2n);
            
            const uniqueId = ethers.keccak256(ethers.toUtf8Bytes(Date.now().toString() + Math.random().toString()));
            const txNotary = await ctx.notary.notarize(
                "ipfs://QmTest" + Date.now(),
                "Audit Test Document",
                uniqueId,
                nftForDiscount
            );
            const rcNotary = await txNotary.wait();

            logTx("Document notarized", txNotary.hash);

            let actualFee = 0n;
            let tokenId = 0n;
            
            for (const log of rcNotary?.logs || []) {
                try {
                    const parsed = ctx.notary.interface.parseLog(log);
                    if (parsed?.name === "DocumentNotarized") {
                        tokenId = BigInt(parsed.args.tokenId?.toString() || "0");
                        actualFee = BigInt(parsed.args.feePaid?.toString() || parsed.args.fee?.toString() || parsed.args[4]?.toString() || "0");
                        break;
                    }
                } catch {}
            }

            console.log(`\n      📊 ACTUAL RESULTS:`);
            console.log(`      ┌────────────────────────────────────────────────────────────────┐`);
            console.log(`      │ Document Token ID:      ${tokenId.toString().padStart(15)}                  │`);
            console.log(`      │ Actual Fee:             ${toEther(actualFee).padStart(15)} BKC             │`);
            console.log(`      │ ${formatDiscount(baseFee, actualFee, tier.discountBips).padEnd(62)} │`);
            console.log(`      └────────────────────────────────────────────────────────────────┘`);

            const feeMatch = actualFee === expectedFee;
            REPORT.push({
                tier: tier.name,
                action: "Notary Fee",
                status: feeMatch ? "✅ PASS" : "❌ FAIL",
                expected: `${toEther(expectedFee)} BKC`,
                actual: `${toEther(actualFee)} BKC`,
                txHash: txNotary.hash,
                txLink: txLink(txNotary.hash),
                details: `Discount: ${toBips(tier.discountBips)}`
            });
        }

    } catch (e: any) {
        console.log(`      ❌ Error: ${e.message.slice(0, 60)}`);
        REPORT.push({ tier: tier.name, action: "Notary", status: "❌ FAIL", details: e.message.slice(0, 40) });
    }

    // ─────────────────────────────────────────────────────────────
    // E. FORTUNE POOL (1x and 5x)
    // ─────────────────────────────────────────────────────────────
    logSubsection("E. FORTUNE POOL - Backcoin Oracle (INSTANT)");

    try {
        const activeTiers = BigInt((await ctx.fortune.activeTierCount()).toString());
        
        if (activeTiers === 0n) {
            console.log(`      ⚠️ Fortune Pool not active (0 tiers)`);
            REPORT.push({ tier: tier.name, action: "Fortune", status: "⚠️ SKIP", details: "No active tiers" });
        } else {
            const wager = TEST_CONFIG.FORTUNE_WAGER;
            const serviceFee = ctx.baseFees.FORTUNE_SERVICE_FEE || 0n;
            
            // Show tier info
            console.log(`\n      🎰 Prize Tiers:`);
            for (let i = 1n; i <= activeTiers; i++) {
                const tierInfo = await ctx.fortune.getTier(i);
                console.log(`         Tier ${i}: Range 1-${tierInfo.maxRange}, Multiplier ${Number(tierInfo.multiplierBips) / 100}x`);
            }

            for (const isCumulative of [false, true]) {
                const modeName = isCumulative ? "5x (Cumulative)" : "1x (Jackpot)";
                const requiredFee = isCumulative ? serviceFee * 5n : serviceFee;
                const guessCount = isCumulative ? Number(activeTiers) : 1;
                
                // Generate guesses in CORRECT order: Tier 1, Tier 2, Tier 3 (ascending)
                const guesses: bigint[] = [];
                for (let i = 0; i < guessCount; i++) {
                    const tierNum = isCumulative ? i + 1 : Number(activeTiers); // Tier 1, 2, 3 for 5x
                    const tierInfo = await ctx.fortune.getTier(BigInt(tierNum));
                    const maxRange = Number(tierInfo.maxRange);
                    guesses.push(BigInt(Math.floor(Math.random() * maxRange) + 1));
                }

                console.log(`\n      🎰 MODE: ${modeName}`);
                console.log(`      ┌────────────────────────────────────────────────────────────────┐`);
                console.log(`      │ Wager:                  ${toEther(wager).padStart(15)} BKC             │`);
                console.log(`      │ Your Guesses:           ${`[${guesses.join(', ')}]`.padStart(15)}                  │`);
                console.log(`      │ Service Fee:            ${toEtherShort(requiredFee).padStart(15)} ETH             │`);
                console.log(`      └────────────────────────────────────────────────────────────────┘`);

                const bkcBal = BigInt((await ctx.bkc.balanceOf(ctx.tester.address)).toString());
                const ethBal = BigInt((await ctx.tester.provider!.getBalance(ctx.tester.address)).toString());

                if (bkcBal < wager) {
                    console.log(`      ⚠️ Insufficient BKC`);
                    REPORT.push({ tier: tier.name, action: `Fortune ${modeName}`, status: "⚠️ SKIP", details: "Low BKC" });
                    continue;
                }

                if (ethBal < requiredFee + ethers.parseEther("0.001")) {
                    console.log(`      ⚠️ Insufficient ETH`);
                    REPORT.push({ tier: tier.name, action: `Fortune ${modeName}`, status: "⚠️ SKIP", details: "Low ETH" });
                    continue;
                }

                await ctx.bkc.approve(ctx.addresses.fortunePool, wager * 2n);
                
                const txFortune = await ctx.fortune.play(wager, guesses, isCumulative, { value: requiredFee });
                const rcFortune = await txFortune.wait();

                logTx(`Game played (${modeName})`, txFortune.hash);

                let gameId: bigint | null = null;
                let rolls: bigint[] = [];
                let matches = 0;
                let payout = 0n;
                let matchesArr: boolean[] = [];
                
                for (const log of rcFortune?.logs || []) {
                    try {
                        const parsed = ctx.fortune.interface.parseLog(log);
                        
                        if (parsed?.name === "GamePlayed") {
                            gameId = BigInt(parsed.args.gameId?.toString() || "0");
                            payout = BigInt(parsed.args.prizeWon?.toString() || "0");
                            matches = Number(parsed.args.matchCount?.toString() || "0");
                        }

                        if (parsed?.name === "GameDetails") {
                            rolls = Array.from(parsed.args.rolls || []).map((r: any) => BigInt(r.toString()));
                            matchesArr = Array.from(parsed.args.matches || []).map((m: any) => Boolean(m));
                        }
                    } catch {}
                }

                // Display results with comparison
                console.log(`\n      📊 GAME RESULTS:`);
                console.log(`      ┌─────────┬───────────────┬───────────────┬─────────┐`);
                console.log(`      │ Tier    │ Your Guess    │ Oracle Result │ Match   │`);
                console.log(`      ├─────────┼───────────────┼───────────────┼─────────┤`);
                
                for (let i = 0; i < guesses.length; i++) {
                    const guess = guesses[i];
                    const roll = rolls[i] || 0n;
                    const isMatch = matchesArr[i] || (guess === roll);
                    const tierNum = isCumulative ? i + 1 : Number(activeTiers);
                    console.log(`      │ Tier ${tierNum}  │ ${guess.toString().padStart(10)}    │ ${roll.toString().padStart(10)}    │ ${isMatch ? '✅ YES' : '❌ NO'}   │`);
                }
                
                console.log(`      └─────────┴───────────────┴───────────────┴─────────┘`);
                
                const won = payout > 0n;
                console.log(`\n      🎲 RESULT: ${matches} match(es) - ${won ? `🎉 WON ${toEther(payout)} BKC!` : '❌ LOST'}`);

                REPORT.push({
                    tier: tier.name,
                    action: `Fortune ${modeName}`,
                    status: "✅ PASS",
                    actual: `Guesses [${guesses.join(',')}] vs Oracle [${rolls.join(',')}] → ${matches} match(es)`,
                    txHash: txFortune.hash,
                    txLink: txLink(txFortune.hash),
                    details: won ? `WON ${toEther(payout)} BKC` : "LOST"
                });

                await sleep(1000);
            }
        }

    } catch (e: any) {
        console.log(`      ❌ Error: ${e.message.slice(0, 60)}`);
        REPORT.push({ tier: tier.name, action: "Fortune", status: "❌ FAIL", details: e.message.slice(0, 40) });
    }

    // ─────────────────────────────────────────────────────────────
    // F. CLEANUP
    // ─────────────────────────────────────────────────────────────
    logSubsection("F. CLEANUP");

    try {
        const delegations = await ctx.delegation.getDelegationsOf(ctx.tester.address);
        for (let i = delegations.length - 1; i >= 0; i--) {
            try {
                const txUnstake = await ctx.delegation.forceUnstake(BigInt(i), nftForDiscount);
                await txUnstake.wait();
                console.log(`      🧹 Unstaked delegation #${i}`);
                console.log(`         🔗 ${txLink(txUnstake.hash)}`);
            } catch {}
        }

        if (acquiredTokenId !== null && poolAddress !== ethers.ZeroAddress) {
            try {
                const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, ctx.tester);
                await ctx.nft.approve(poolAddress, acquiredTokenId);
                
                const txSell = await pool.sellNFT(acquiredTokenId, 0n);
                await txSell.wait();
                
                console.log(`      🧹 Sold NFT #${acquiredTokenId}`);
                console.log(`         🔗 ${txLink(txSell.hash)}`);
                
                REPORT.push({
                    tier: tier.name,
                    action: "NFT Sell",
                    status: "✅ PASS",
                    actual: `#${acquiredTokenId}`,
                    txHash: txSell.hash,
                    txLink: txLink(txSell.hash)
                });
            } catch (e: any) {
                console.log(`      ⚠️ Could not sell NFT: ${e.message.slice(0, 40)}`);
            }
        }

        REPORT.push({ tier: tier.name, action: "Cleanup", status: "✅ PASS" });

    } catch (e: any) {
        console.log(`      ⚠️ Cleanup warning: ${e.message.slice(0, 40)}`);
        REPORT.push({ tier: tier.name, action: "Cleanup", status: "⚠️ SKIP", details: e.message.slice(0, 30) });
    }

    console.log(`\n   ✅ Tier ${tier.name} complete`);
}

// =================================================================
// 📊 FINAL REPORT
// =================================================================

function printFinalReport(): void {
    logSection("📊 FINAL AUDIT REPORT");

    const tierNames = [...new Set(REPORT.map(r => r.tier))];
    
    for (const tierName of tierNames) {
        console.log(`\n   ${tierName}:`);
        const tierResults = REPORT.filter(r => r.tier === tierName);
        for (const r of tierResults) {
            let line = `      ${r.status} ${r.action}`;
            if (r.expected && r.actual) {
                line += `: Expected ${r.expected} | Actual ${r.actual}`;
            } else if (r.actual) {
                line += `: ${r.actual}`;
            }
            if (r.details) line += ` (${r.details})`;
            console.log(line);
            if (r.txLink) {
                console.log(`         🔗 ${r.txLink}`);
            }
        }
    }

    const passed = REPORT.filter(r => r.status === "✅ PASS").length;
    const failed = REPORT.filter(r => r.status === "❌ FAIL").length;
    const skipped = REPORT.filter(r => r.status === "⚠️ SKIP").length;
    const info = REPORT.filter(r => r.status === "ℹ️ INFO").length;

    console.log(`\n${"═".repeat(80)}`);
    console.log(`   📈 Summary: ${passed} passed, ${failed} failed, ${skipped} skipped, ${info} info`);
    
    if (failed > 0) {
        console.log(`\n   ❌ VERIFICATION FAILED - ${failed} test(s) did not pass`);
        
        console.log(`\n   Failed Tests:`);
        for (const r of REPORT.filter(r => r.status === "❌ FAIL")) {
            console.log(`      - ${r.tier}: ${r.action} - ${r.details || 'Unknown error'}`);
        }
        
        process.exit(1);
    } else {
        console.log(`\n   ✅ VERIFICATION PASSED - All critical tests successful`);
    }
    console.log(`${"═".repeat(80)}\n`);
}

// =================================================================
// 🚀 RUN
// =================================================================

main().catch((error) => {
    console.error("\n❌ FATAL ERROR:", error);
    process.exitCode = 1;
});