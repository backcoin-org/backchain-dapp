/**
 * 🔬 BACKCOIN V2.1 ECOSYSTEM VERIFICATION SCRIPT
 * 
 * Script de verificação completo que:
 * - Separa NFT Discounts de Fee Recycling
 * - Mostra hash de todas as transações
 * - Testa Fortune em modo 1x e 5x
 * - Usa valores múltiplos de 10 para fácil visualização
 * - Testa Faucet com informações de cooldown
 * 
 * Uso: npx hardhat run scripts/5_verify_full_ecosystem_v2.ts --network arbitrumSepolia
 */

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// =================================================================
// ⚙️ CONFIGURATION - TIERS OFICIAIS DO DEPLOY
// =================================================================

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

// Fee keys
const FEE_KEYS = {
    DELEGATION_FEE_BIPS: ethers.id("DELEGATION_FEE_BIPS"),
    NOTARY_SERVICE: ethers.id("NOTARY_SERVICE"),
    NFT_POOL_BUY_TAX_BIPS: ethers.id("NFT_POOL_BUY_TAX_BIPS"),
    NFT_POOL_SELL_TAX_BIPS: ethers.id("NFT_POOL_SELL_TAX_BIPS"),
    RENTAL_FEE_BIPS: ethers.id("RENTAL_MARKET_TAX_BIPS"),
};

// Test amounts (múltiplos de 10 para fácil visualização)
const TEST_CONFIG = {
    STAKE_AMOUNT: ethers.parseEther("100"),      // 100 BKC
    STAKE_LOCK_DAYS: 30,
    FORTUNE_WAGER: ethers.parseEther("10"),      // 10 BKC
    RENTAL_PRICE: ethers.parseEther("10"),       // 10 BKC/hora
    MIN_BKC_BALANCE: ethers.parseEther("1000"),  // Mínimo para testes
};

// Report types
type AuditEntry = {
    tier: string;
    action: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP" | "ℹ️ INFO";
    expected?: string;
    actual?: string;
    txHash?: string;
    details?: string;
};

const REPORT: AuditEntry[] = [];

// =================================================================
// 🛠️ HELPERS
// =================================================================

const toEther = (val: bigint): string => parseFloat(ethers.formatEther(val)).toFixed(4);
const toBips = (val: bigint): string => `${Number(val) / 100}%`;
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const shortHash = (hash: string): string => `${hash.slice(0, 10)}...${hash.slice(-8)}`;

function formatTimeRemaining(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

function logSection(title: string): void {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`   ${title}`);
    console.log(`${"═".repeat(70)}`);
}

function logSubsection(title: string): void {
    console.log(`\n   ─── ${title} ───`);
}

function logTx(description: string, hash: string): void {
    console.log(`      📤 ${description}`);
    console.log(`         TX: ${shortHash(hash)}`);
    console.log(`         🔗 https://sepolia.arbiscan.io/tx/${hash}`);
}

/**
 * Calcula a taxa esperada COM desconto de NFT
 * Formula: expectedFee = baseFee × (10000 - discountBips) / 10000
 */
function calculateExpectedFee(baseFee: bigint, discountBips: bigint): bigint {
    if (discountBips === 0n) return baseFee;
    return (baseFee * (10000n - discountBips)) / 10000n;
}

// =================================================================
// 📋 MAIN SCRIPT
// =================================================================

async function main(): Promise<void> {
    const [tester] = await ethers.getSigners();
    if (!tester) throw new Error("No signer configured. Check your .env file.");

    const ethBalance = await tester.provider!.getBalance(tester.address);

    console.log(`\n${"═".repeat(70)}`);
    console.log(`   🔬 BACKCOIN V2.1 ECOSYSTEM VERIFICATION`);
    console.log(`${"═".repeat(70)}`);
    console.log(`   📅 Date: ${new Date().toISOString()}`);
    console.log(`   🧑‍🚀 Tester: ${tester.address}`);
    console.log(`   💰 ETH Balance: ${toEther(BigInt(ethBalance.toString()))} ETH`);

    // Load addresses
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error("deployment-addresses.json not found. Run deployment first.");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    console.log(`   📋 Loaded ${Object.keys(addresses).length} contract addresses\n`);

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

    // Initial BKC balance
    let bkcBalance = BigInt((await bkc.balanceOf(tester.address)).toString());
    console.log(`   💎 BKC Balance: ${toEther(bkcBalance)} BKC`);

    // =================================================================
    // 1. FAUCET TEST
    // =================================================================
    logSection("🚰 FAUCET TEST");

    try {
        // Get faucet status
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
            console.log(`      ⏳ Cooldown Remaining: ${formatTimeRemaining(cooldownLeft)}`);
            
            REPORT.push({
                tier: "Setup",
                action: "Faucet",
                status: "⚠️ SKIP",
                details: `Cooldown: ${formatTimeRemaining(cooldownLeft)} remaining`
            });
        } else if (bkcBalance >= TEST_CONFIG.MIN_BKC_BALANCE) {
            console.log(`\n   ✅ Sufficient balance (${toEther(bkcBalance)} BKC), skipping faucet claim`);
            REPORT.push({
                tier: "Setup",
                action: "Faucet",
                status: "⚠️ SKIP",
                details: "Sufficient balance"
            });
        } else {
            // Try to claim
            console.log(`\n   🔄 Attempting faucet claim...`);
            
            const balBefore = BigInt((await bkc.balanceOf(tester.address)).toString());
            const ethBefore = BigInt((await tester.provider!.getBalance(tester.address)).toString());
            
            const tx = await faucet.distributeTo(tester.address);
            const receipt = await tx.wait();
            
            const balAfter = BigInt((await bkc.balanceOf(tester.address)).toString());
            const ethAfter = BigInt((await tester.provider!.getBalance(tester.address)).toString());
            
            const bkcReceived = balAfter - balBefore;
            const gasUsed = BigInt(receipt?.gasUsed?.toString() || "0");
            const gasPrice = BigInt(receipt?.gasPrice?.toString() || "0");
            const gasCost = gasUsed * gasPrice;
            const ethReceived = ethAfter - ethBefore + gasCost;
            
            logTx("Faucet Claim", tx.hash);
            console.log(`\n   📦 Received:`);
            console.log(`      BKC: +${toEther(bkcReceived)} BKC`);
            console.log(`      ETH: +${toEther(ethReceived)} ETH`);
            console.log(`      Gas Used: ${gasUsed.toString()} (cost: ${toEther(gasCost)} ETH)`);
            
            bkcBalance = balAfter;
            
            REPORT.push({
                tier: "Setup",
                action: "Faucet Claim",
                status: "✅ PASS",
                actual: `+${toEther(bkcReceived)} BKC`,
                txHash: tx.hash
            });
        }
    } catch (e: any) {
        const errMsg = e.message || '';
        if (errMsg.includes("CooldownActive")) {
            // Extract remaining time from error
            const match = errMsg.match(/CooldownActive\((\d+)\)/);
            const remaining = match ? Number(match[1]) : 0;
            console.log(`\n   ⏳ Faucet on cooldown: ${formatTimeRemaining(remaining)} remaining`);
            REPORT.push({
                tier: "Setup",
                action: "Faucet",
                status: "⚠️ SKIP",
                details: `Cooldown: ${formatTimeRemaining(remaining)}`
            });
        } else {
            console.log(`\n   ❌ Faucet error: ${errMsg.slice(0, 80)}`);
            REPORT.push({
                tier: "Setup",
                action: "Faucet",
                status: "❌ FAIL",
                details: errMsg.slice(0, 50)
            });
        }
    }

    // =================================================================
    // 2. READ BASE FEES
    // =================================================================
    logSection("📊 BASE FEES CONFIGURATION");

    const baseFees: Record<string, bigint> = {};
    
    // Delegation fee (BIPS)
    baseFees.DELEGATION_FEE_BIPS = BigInt((await hub.getFee(FEE_KEYS.DELEGATION_FEE_BIPS)).toString());
    console.log(`\n   DELEGATION_FEE_BIPS: ${baseFees.DELEGATION_FEE_BIPS} (${toBips(baseFees.DELEGATION_FEE_BIPS)})`);
    
    // Notary fee (FLAT in WEI)
    baseFees.NOTARY_SERVICE = BigInt((await hub.getFee(FEE_KEYS.NOTARY_SERVICE)).toString());
    console.log(`   NOTARY_SERVICE: ${toEther(baseFees.NOTARY_SERVICE)} BKC (flat)`);
    
    // NFT Pool fees
    baseFees.NFT_POOL_BUY_TAX_BIPS = BigInt((await hub.getFee(FEE_KEYS.NFT_POOL_BUY_TAX_BIPS)).toString());
    baseFees.NFT_POOL_SELL_TAX_BIPS = BigInt((await hub.getFee(FEE_KEYS.NFT_POOL_SELL_TAX_BIPS)).toString());
    console.log(`   NFT_POOL_BUY_TAX: ${toBips(baseFees.NFT_POOL_BUY_TAX_BIPS)}`);
    console.log(`   NFT_POOL_SELL_TAX: ${toBips(baseFees.NFT_POOL_SELL_TAX_BIPS)}`);

    // Rental fee
    baseFees.RENTAL_FEE_BIPS = BigInt((await hub.getFee(FEE_KEYS.RENTAL_FEE_BIPS)).toString());
    console.log(`   RENTAL_FEE: ${toBips(baseFees.RENTAL_FEE_BIPS)}`);

    // Show configured discounts
    console.log(`\n   📉 Configured NFT Discounts:`);
    for (const tier of TIERS.filter(t => t.boost > 0n)) {
        const discount = BigInt((await hub.getBoosterDiscount(tier.boost)).toString());
        console.log(`      ${tier.name}: ${toBips(discount)} discount`);
    }

    // =================================================================
    // 3. RUN TIER TESTS
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
    // 4. FINAL REPORT
    // =================================================================
    logSection("📊 FINAL AUDIT REPORT");

    // Group by tier
    const tierNames = [...new Set(REPORT.map(r => r.tier))];
    
    for (const tierName of tierNames) {
        console.log(`\n   ${tierName}:`);
        const tierResults = REPORT.filter(r => r.tier === tierName);
        for (const r of tierResults) {
            let line = `      ${r.status} ${r.action}`;
            if (r.actual) line += `: ${r.actual}`;
            if (r.details) line += ` (${r.details})`;
            if (r.txHash) line += ` [${shortHash(r.txHash)}]`;
            console.log(line);
        }
    }

    // Summary
    const passed = REPORT.filter(r => r.status === "✅ PASS").length;
    const failed = REPORT.filter(r => r.status === "❌ FAIL").length;
    const skipped = REPORT.filter(r => r.status === "⚠️ SKIP").length;
    const info = REPORT.filter(r => r.status === "ℹ️ INFO").length;

    console.log(`\n${"═".repeat(70)}`);
    console.log(`   📈 Summary: ${passed} passed, ${failed} failed, ${skipped} skipped, ${info} info`);
    
    if (failed > 0) {
        console.log(`\n   ❌ VERIFICATION FAILED - ${failed} test(s) did not pass`);
        process.exit(1);
    } else {
        console.log(`\n   ✅ VERIFICATION PASSED - All critical tests successful`);
    }
    console.log(`${"═".repeat(70)}\n`);
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
    logSection(`🚀 TIER: ${tier.name} (Boost: ${Number(tier.boost)/100}%, Discount: ${Number(tier.discountBips)/100}%)`);

    let acquiredTokenId: bigint | null = null;
    let poolAddress: string = ethers.ZeroAddress;

    // ─────────────────────────────────────────────────────────────
    // A. ACQUIRE NFT (if tier requires it)
    // ─────────────────────────────────────────────────────────────
    if (tier.boost > 0n && tier.poolName) {
        logSubsection("A. NFT ACQUISITION");

        try {
            poolAddress = await ctx.factory.getPoolAddress(tier.boost);
            
            if (poolAddress === ethers.ZeroAddress) {
                console.log(`      ⚠️ Pool not deployed for ${tier.name}`);
                REPORT.push({ tier: tier.name, action: "Pool Check", status: "⚠️ SKIP", details: "Pool not found" });
                return;
            }

            const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, ctx.tester);
            const availableIds = await pool.getAvailableNFTs();

            if (availableIds.length === 0) {
                console.log(`      ⚠️ No NFTs available in pool`);
                REPORT.push({ tier: tier.name, action: "NFT Buy", status: "⚠️ SKIP", details: "Pool empty" });
                return;
            }

            const buyPrice = BigInt((await pool.getBuyPrice()).toString());
            const buyTax = (buyPrice * ctx.baseFees.NFT_POOL_BUY_TAX_BIPS) / 10000n;
            const totalCost = buyPrice + buyTax;

            console.log(`      📦 Pool: ${poolAddress.slice(0, 20)}...`);
            console.log(`      💰 Price: ${toEther(buyPrice)} + ${toEther(buyTax)} tax = ${toEther(totalCost)} BKC`);
            console.log(`      📊 Available NFTs: ${availableIds.length}`);

            // Approve and buy
            await ctx.bkc.approve(poolAddress, totalCost * 2n);
            
            const txBuy = await pool.buyNFT();
            const rcBuy = await txBuy.wait();

            // Find tokenId from Transfer event (NFT contract)
            let boughtTokenId: bigint | null = null;
            for (const log of rcBuy?.logs || []) {
                try {
                    // Try parsing as NFT Transfer event
                    const parsed = ctx.nft.interface.parseLog(log);
                    if (parsed?.name === "Transfer" && parsed.args.to === ctx.tester.address) {
                        boughtTokenId = BigInt(parsed.args.tokenId.toString());
                        break;
                    }
                } catch {}
                
                // Try parsing as pool event
                try {
                    const parsed = pool.interface.parseLog(log);
                    if (parsed?.name === "NFTPurchased" || parsed?.name === "NFTBought") {
                        boughtTokenId = BigInt(parsed.args.tokenId.toString());
                        break;
                    }
                } catch {}
            }

            if (boughtTokenId !== null) {
                acquiredTokenId = boughtTokenId;
                logTx(`NFT #${boughtTokenId} Purchased`, txBuy.hash);
                
                REPORT.push({
                    tier: tier.name,
                    action: "NFT Buy",
                    status: "✅ PASS",
                    actual: `#${boughtTokenId}`,
                    txHash: txBuy.hash,
                    details: `${toEther(totalCost)} BKC`
                });
            } else {
                console.log(`      ⚠️ Could not find tokenId in events`);
                REPORT.push({ tier: tier.name, action: "NFT Buy", status: "❌ FAIL", details: "No tokenId found" });
                return;
            }

        } catch (e: any) {
            console.log(`      ❌ NFT Buy Error: ${e.message.slice(0, 60)}`);
            REPORT.push({ tier: tier.name, action: "NFT Buy", status: "❌ FAIL", details: e.message.slice(0, 40) });
            return;
        }
    }

    // Use acquired NFT for discounts
    const nftForDiscount = acquiredTokenId ?? 0n;

    // ─────────────────────────────────────────────────────────────
    // B. RENTAL SYSTEM TEST
    // ─────────────────────────────────────────────────────────────
    if (acquiredTokenId !== null) {
        logSubsection("B. RENTAL SYSTEM");

        try {
            // Approve NFT for rental
            await ctx.nft.approve(ctx.addresses.rentalManager, acquiredTokenId);
            
            const txList = await ctx.rental.listNFTSimple(acquiredTokenId, TEST_CONFIG.RENTAL_PRICE);
            const rcList = await txList.wait();
            
            logTx(`NFT #${acquiredTokenId} Listed`, txList.hash);

            // Verify listing
            const listing = await ctx.rental.listings(acquiredTokenId);
            const isActive = listing.isActive || listing[4];
            
            console.log(`      📋 Listing Active: ${isActive}`);

            if (isActive) {
                REPORT.push({
                    tier: tier.name,
                    action: "Rental List",
                    status: "✅ PASS",
                    txHash: txList.hash
                });

                // Withdraw for other tests
                const txWithdraw = await ctx.rental.withdrawNFT(acquiredTokenId);
                await txWithdraw.wait();
                
                logTx(`NFT #${acquiredTokenId} Withdrawn`, txWithdraw.hash);
                
                REPORT.push({
                    tier: tier.name,
                    action: "Rental Withdraw",
                    status: "✅ PASS",
                    txHash: txWithdraw.hash
                });
            } else {
                REPORT.push({ tier: tier.name, action: "Rental List", status: "❌ FAIL", details: "Not active" });
            }

        } catch (e: any) {
            console.log(`      ❌ Rental Error: ${e.message.slice(0, 60)}`);
            REPORT.push({ tier: tier.name, action: "Rental", status: "❌ FAIL", details: e.message.slice(0, 40) });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // C. DELEGATION TEST (Fee Discount Verification)
    // ─────────────────────────────────────────────────────────────
    logSubsection("C. DELEGATION (Staking) - Fee Discount Test");

    try {
        const stakeAmount = TEST_CONFIG.STAKE_AMOUNT;
        const lockDuration = BigInt(86400 * TEST_CONFIG.STAKE_LOCK_DAYS);
        
        // Calculate expected fees
        const baseFeeBips = ctx.baseFees.DELEGATION_FEE_BIPS;
        const baseFeeAmount = (stakeAmount * baseFeeBips) / 10000n;
        const expectedFeeWithDiscount = calculateExpectedFee(baseFeeAmount, tier.discountBips);
        const expectedNetStake = stakeAmount - expectedFeeWithDiscount;

        console.log(`\n      📊 DELEGATION FEE ANALYSIS:`);
        console.log(`      ┌────────────────────────────────────────────────┐`);
        console.log(`      │ Stake Amount:        ${toEther(stakeAmount).padStart(15)} BKC │`);
        console.log(`      │ Base Fee Rate:       ${toBips(baseFeeBips).padStart(15)}     │`);
        console.log(`      │ Base Fee Amount:     ${toEther(baseFeeAmount).padStart(15)} BKC │`);
        console.log(`      │ NFT Discount:        ${toBips(tier.discountBips).padStart(15)}     │`);
        console.log(`      │ Expected Fee:        ${toEther(expectedFeeWithDiscount).padStart(15)} BKC │`);
        console.log(`      │ Expected Net Stake:  ${toEther(expectedNetStake).padStart(15)} BKC │`);
        console.log(`      └────────────────────────────────────────────────┘`);

        // Approve and delegate
        await ctx.bkc.approve(ctx.addresses.delegationManager, stakeAmount * 2n);
        
        const txDel = await ctx.delegation.delegate(stakeAmount, lockDuration, nftForDiscount);
        const rcDel = await txDel.wait();

        logTx("Delegation Created", txDel.hash);

        // Parse Delegated event to get actual fee
        let actualFee = 0n;
        let actualNetStake = 0n;
        
        for (const log of rcDel?.logs || []) {
            try {
                const parsed = ctx.delegation.interface.parseLog(log);
                if (parsed?.name === "Delegated") {
                    actualNetStake = BigInt(parsed.args.amount?.toString() || parsed.args.netAmount?.toString() || parsed.args[2]?.toString() || "0");
                    actualFee = BigInt(parsed.args.fee?.toString() || parsed.args.feeAmount?.toString() || parsed.args[4]?.toString() || "0");
                    break;
                }
            } catch {}
        }

        // If fee not in event, calculate from net stake
        if (actualFee === 0n && actualNetStake > 0n) {
            actualFee = stakeAmount - actualNetStake;
        }

        console.log(`\n      📊 ACTUAL RESULTS (from event):`);
        console.log(`      ┌────────────────────────────────────────────────┐`);
        console.log(`      │ Actual Fee Paid:     ${toEther(actualFee).padStart(15)} BKC │`);
        console.log(`      │ Actual Net Stake:    ${toEther(actualNetStake).padStart(15)} BKC │`);
        console.log(`      └────────────────────────────────────────────────┘`);

        // Verify discount was applied correctly
        const feeMatch = actualFee === expectedFeeWithDiscount;
        const discountApplied = baseFeeAmount > 0n 
            ? ((baseFeeAmount - actualFee) * 10000n / baseFeeAmount)
            : 0n;

        console.log(`\n      📊 DISCOUNT VERIFICATION:`);
        console.log(`      ┌────────────────────────────────────────────────┐`);
        console.log(`      │ Expected Discount:   ${toBips(tier.discountBips).padStart(15)}     │`);
        console.log(`      │ Actual Discount:     ${toBips(discountApplied).padStart(15)}     │`);
        console.log(`      │ Match:               ${(feeMatch ? '✅ YES' : '❌ NO').padStart(15)}     │`);
        console.log(`      └────────────────────────────────────────────────┘`);

        REPORT.push({
            tier: tier.name,
            action: "Delegation Fee",
            status: feeMatch ? "✅ PASS" : "❌ FAIL",
            expected: `${toEther(expectedFeeWithDiscount)} BKC`,
            actual: `${toEther(actualFee)} BKC`,
            txHash: txDel.hash,
            details: `Discount: ${toBips(discountApplied)}`
        });

    } catch (e: any) {
        console.log(`      ❌ Delegation Error: ${e.message.slice(0, 60)}`);
        REPORT.push({ tier: tier.name, action: "Delegation", status: "❌ FAIL", details: e.message.slice(0, 40) });
    }

    // ─────────────────────────────────────────────────────────────
    // D. NOTARY TEST (Fee Discount Verification)
    // ─────────────────────────────────────────────────────────────
    logSubsection("D. NOTARY SERVICE - Fee Discount Test");

    try {
        const baseFee = ctx.baseFees.NOTARY_SERVICE;
        
        if (baseFee === 0n) {
            console.log(`      ⚠️ Notary fee not configured`);
            REPORT.push({ tier: tier.name, action: "Notary", status: "⚠️ SKIP", details: "Fee = 0" });
        } else {
            const expectedFeeWithDiscount = calculateExpectedFee(baseFee, tier.discountBips);

            console.log(`\n      📊 NOTARY FEE ANALYSIS:`);
            console.log(`      ┌────────────────────────────────────────────────┐`);
            console.log(`      │ Base Fee (flat):     ${toEther(baseFee).padStart(15)} BKC │`);
            console.log(`      │ NFT Discount:        ${toBips(tier.discountBips).padStart(15)}     │`);
            console.log(`      │ Expected Fee:        ${toEther(expectedFeeWithDiscount).padStart(15)} BKC │`);
            console.log(`      └────────────────────────────────────────────────┘`);

            // Approve and notarize
            await ctx.bkc.approve(ctx.addresses.decentralizedNotary, baseFee * 2n);
            
            const uniqueId = ethers.keccak256(ethers.toUtf8Bytes(Date.now().toString() + Math.random().toString()));
            const txNotary = await ctx.notary.notarize(
                "ipfs://QmTest" + Date.now(),
                "Audit Test Document",
                uniqueId,
                nftForDiscount
            );
            const rcNotary = await txNotary.wait();

            logTx("Document Notarized", txNotary.hash);

            // Parse DocumentNotarized event to get actual fee
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

            console.log(`\n      📊 ACTUAL RESULTS (from event):`);
            console.log(`      ┌────────────────────────────────────────────────┐`);
            console.log(`      │ Document Token ID:   ${tokenId.toString().padStart(15)}     │`);
            console.log(`      │ Actual Fee Paid:     ${toEther(actualFee).padStart(15)} BKC │`);
            console.log(`      └────────────────────────────────────────────────┘`);

            // Verify discount
            const feeMatch = actualFee === expectedFeeWithDiscount;
            const discountApplied = baseFee > 0n 
                ? ((baseFee - actualFee) * 10000n / baseFee)
                : 0n;

            console.log(`\n      📊 DISCOUNT VERIFICATION:`);
            console.log(`      ┌────────────────────────────────────────────────┐`);
            console.log(`      │ Expected Discount:   ${toBips(tier.discountBips).padStart(15)}     │`);
            console.log(`      │ Actual Discount:     ${toBips(discountApplied).padStart(15)}     │`);
            console.log(`      │ Match:               ${(feeMatch ? '✅ YES' : '❌ NO').padStart(15)}     │`);
            console.log(`      └────────────────────────────────────────────────┘`);

            REPORT.push({
                tier: tier.name,
                action: "Notary Fee",
                status: feeMatch ? "✅ PASS" : "❌ FAIL",
                expected: `${toEther(expectedFeeWithDiscount)} BKC`,
                actual: `${toEther(actualFee)} BKC`,
                txHash: txNotary.hash,
                details: `Discount: ${toBips(discountApplied)}`
            });
        }

    } catch (e: any) {
        console.log(`      ❌ Notary Error: ${e.message.slice(0, 60)}`);
        REPORT.push({ tier: tier.name, action: "Notary", status: "❌ FAIL", details: e.message.slice(0, 40) });
    }

    // ─────────────────────────────────────────────────────────────
    // E. FORTUNE POOL TEST (1x and 5x modes)
    // ─────────────────────────────────────────────────────────────
    logSubsection("E. FORTUNE POOL - Game Tests (1x then 5x)");

    try {
        const activeTiers = BigInt((await ctx.fortune.activeTierCount()).toString());
        
        if (activeTiers === 0n) {
            console.log(`      ⚠️ Fortune Pool not active (0 tiers)`);
            REPORT.push({ tier: tier.name, action: "Fortune", status: "⚠️ SKIP", details: "No active tiers" });
        } else {
            const wager = TEST_CONFIG.FORTUNE_WAGER;
            
            // Test both modes: 1x (Jackpot) then 5x (Cumulative)
            for (const isCumulative of [false, true]) {
                const modeName = isCumulative ? "5x (Cumulative)" : "1x (Jackpot)";
                
                console.log(`\n      🎰 MODE: ${modeName}`);
                console.log(`      ┌────────────────────────────────────────────────┐`);

                const guessCount = isCumulative ? Number(activeTiers) : 1;
                const guesses = Array(guessCount).fill(1n);
                
                // Get oracle fee for this mode
                let oracleFee = 0n;
                try {
                    oracleFee = BigInt((await ctx.fortune.getRequiredOracleFee(isCumulative)).toString());
                } catch {
                    const baseFee = BigInt((await ctx.fortune.oracleFee()).toString());
                    oracleFee = isCumulative ? baseFee * 5n : baseFee;
                }

                console.log(`      │ Wager:               ${toEther(wager).padStart(15)} BKC │`);
                console.log(`      │ Guesses:             ${guesses.join(',').padStart(15)}     │`);
                console.log(`      │ Oracle Fee:          ${toEther(oracleFee).padStart(15)} ETH │`);
                console.log(`      └────────────────────────────────────────────────┘`);

                // Check balances
                const bkcBal = BigInt((await ctx.bkc.balanceOf(ctx.tester.address)).toString());
                const ethBal = BigInt((await ctx.tester.provider!.getBalance(ctx.tester.address)).toString());

                if (bkcBal < wager) {
                    console.log(`      ⚠️ Insufficient BKC (${toEther(bkcBal)} < ${toEther(wager)})`);
                    REPORT.push({ tier: tier.name, action: `Fortune ${modeName}`, status: "⚠️ SKIP", details: "Low BKC" });
                    continue;
                }

                if (ethBal < oracleFee + ethers.parseEther("0.001")) {
                    console.log(`      ⚠️ Insufficient ETH for oracle fee`);
                    REPORT.push({ tier: tier.name, action: `Fortune ${modeName}`, status: "⚠️ SKIP", details: "Low ETH" });
                    continue;
                }

                // Approve and participate
                await ctx.bkc.approve(ctx.addresses.fortunePool, wager * 2n);
                
                const txFortune = await ctx.fortune.participate(wager, guesses, isCumulative, { value: oracleFee });
                const rcFortune = await txFortune.wait();

                logTx(`Game Submitted (${modeName})`, txFortune.hash);

                // Find gameId from event (only log GameRequested, skip undefined)
                let gameId: bigint | null = null;
                for (const log of rcFortune?.logs || []) {
                    try {
                        const parsed = ctx.fortune.interface.parseLog(log);
                        if (parsed?.name === "GameRequested" || parsed?.name === "GameStarted") {
                            gameId = BigInt(parsed.args.gameId?.toString() || parsed.args.requestId?.toString() || "0");
                            console.log(`      📝 Event: ${parsed.name} (Game #${gameId})`);
                            break;
                        }
                    } catch {}
                }

                if (gameId !== null) {
                    console.log(`      🎲 Game #${gameId} submitted. Waiting for oracle...`);
                    
                    // Wait for oracle resolution
                    let resolved = false;
                    let resultStr = "";
                    
                    for (let i = 0; i < 10; i++) {
                        await sleep(2000);
                        process.stdout.write(".");
                        
                        try {
                            const status = await ctx.fortune.getGameStatus(gameId);
                            if (status[1] === true) { // isResolved
                                const rolls = status[4];
                                const rollsArr = Array.from(rolls as bigint[]).map(r => BigInt(r.toString()));
                                const wins = rollsArr.filter((r, idx) => r === guesses[idx]).length;
                                resultStr = `[${rollsArr.join(',')}] - ${wins > 0 ? 'WIN!' : 'LOSE'}`;
                                console.log(`\n      🎲 Result: ${resultStr}`);
                                resolved = true;
                                break;
                            }
                        } catch {}
                    }

                    if (!resolved) {
                        console.log(`\n      ⏳ Oracle pending (game submitted successfully)`);
                    }

                    REPORT.push({
                        tier: tier.name,
                        action: `Fortune ${modeName}`,
                        status: "✅ PASS",
                        actual: resolved ? resultStr : `Game #${gameId} pending`,
                        txHash: txFortune.hash
                    });
                } else {
                    REPORT.push({
                        tier: tier.name,
                        action: `Fortune ${modeName}`,
                        status: "✅ PASS",
                        txHash: txFortune.hash,
                        details: "Game submitted"
                    });
                }

                await sleep(1000);
            }
        }

    } catch (e: any) {
        console.log(`      ❌ Fortune Error: ${e.message.slice(0, 60)}`);
        REPORT.push({ tier: tier.name, action: "Fortune", status: "❌ FAIL", details: e.message.slice(0, 40) });
    }

    // ─────────────────────────────────────────────────────────────
    // F. CLEANUP
    // ─────────────────────────────────────────────────────────────
    logSubsection("F. CLEANUP");

    try {
        // Force unstake all delegations
        const delegations = await ctx.delegation.getDelegationsOf(ctx.tester.address);
        for (let i = delegations.length - 1; i >= 0; i--) {
            try {
                const txUnstake = await ctx.delegation.forceUnstake(BigInt(i), nftForDiscount);
                await txUnstake.wait();
                console.log(`      🧹 Unstaked delegation #${i} [${shortHash(txUnstake.hash)}]`);
            } catch {}
        }

        // Sell NFT back
        if (acquiredTokenId !== null && poolAddress !== ethers.ZeroAddress) {
            try {
                const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, ctx.tester);
                await ctx.nft.approve(poolAddress, acquiredTokenId);
                
                const txSell = await pool.sellNFT(acquiredTokenId, 0n);
                await txSell.wait();
                
                console.log(`      🧹 Sold NFT #${acquiredTokenId} [${shortHash(txSell.hash)}]`);
                
                REPORT.push({
                    tier: tier.name,
                    action: "NFT Sell",
                    status: "✅ PASS",
                    actual: `#${acquiredTokenId}`,
                    txHash: txSell.hash
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

    console.log(`\n   ✅ Tier ${tier.name} cycle complete`);
}

// =================================================================
// 🚀 RUN
// =================================================================

main().catch((error) => {
    console.error("\n❌ FATAL ERROR:", error);
    process.exitCode = 1;
});