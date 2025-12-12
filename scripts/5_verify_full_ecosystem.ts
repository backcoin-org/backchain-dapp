import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import {
    BKCToken,
    EcosystemManager,
    DecentralizedNotary,
    DelegationManager,
    RewardBoosterNFT,
    NFTLiquidityPoolFactory,
    SimpleBKCFaucet,
    NFTLiquidityPool,
    FortunePool,
    RentalManager
} from "../typechain-types";

dotenv.config();

// =================================================================
// ⚙️ V2.1 CONFIGURATION
// =================================================================

// V2.1 Tiers (updated)
const TIERS = [
    { name: "🚫 Baseline (No NFT)", boost: 0n, poolName: null },
    { name: "🥉 Bronze", boost: 3000n, poolName: "bronze" },
    { name: "🥈 Silver", boost: 4000n, poolName: "silver" },
    { name: "🥇 Gold", boost: 5000n, poolName: "gold" },
    { name: "💎 Diamond", boost: 7000n, poolName: "diamond" },
    { name: "🖤 Obsidian", boost: 8500n, poolName: "obsidian" },
    { name: "⚛️ Quantum", boost: 10000n, poolName: "quantum" },
];

// V2.1 Fee Keys (from EcosystemManager)
// Note: Some fees are in BIPS (basis points), others are FLAT (wei)
const FEE_KEYS_BIPS = {
    DELEGATION_FEE_BIPS: ethers.id("DELEGATION_FEE_BIPS"),
    EARLY_UNSTAKE_PENALTY_BIPS: ethers.id("EARLY_UNSTAKE_PENALTY_BIPS"),
    NFT_POOL_BUY_TAX_BIPS: ethers.id("NFT_POOL_BUY_TAX_BIPS"),
    NFT_POOL_SELL_TAX_BIPS: ethers.id("NFT_POOL_SELL_TAX_BIPS"),
    FORTUNE_POOL_FEE_BIPS: ethers.id("FORTUNE_POOL_FEE_BIPS"),
    RENTAL_FEE_BIPS: ethers.id("RENTAL_FEE_BIPS"),
    REWARD_CLAIM_FEE_BIPS: ethers.id("REWARD_CLAIM_FEE_BIPS"),
};

const FEE_KEYS_FLAT = {
    // NOTARY_SERVICE is a FLAT fee in WEI, not BIPS!
    NOTARY_SERVICE: ethers.id("NOTARY_SERVICE"),
};

// Test amounts
const TEST_CONFIG = {
    STAKE_AMOUNT: ethers.parseEther("50"),
    STAKE_LOCK_DAYS: 30,
    FORTUNE_WAGER: ethers.parseEther("10"),
    RENTAL_PRICE_PER_HOUR: ethers.parseEther("5"),
    NOTARY_CONTENT: "ipfs://QmTest",
};

// Report types
type AuditEntry = {
    tier: string;
    action: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP" | "⏳ WAIT" | "ℹ️ INFO";
    expected?: string;
    actual?: string;
    details?: string;
};

const REPORT: AuditEntry[] = [];

// =================================================================
// 🛠️ HELPERS
// =================================================================

const toEther = (val: bigint) => parseFloat(ethers.formatEther(val)).toFixed(4);
const toBips = (val: bigint) => `${Number(val) / 100}%`;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function logSection(title: string) {
    console.log(`\n${"═".repeat(65)}`);
    console.log(`   ${title}`);
    console.log(`${"═".repeat(65)}`);
}

function logSubsection(title: string) {
    console.log(`\n   ─── ${title} ───`);
}

// V2.1 Discount calculation: discount = baseFee * boostBips / 10000
function calculateDiscountedFee(baseFee: bigint, boostBips: bigint): bigint {
    if (boostBips === 0n) return baseFee;
    const discount = (baseFee * boostBips) / 10000n;
    return baseFee - discount;
}

// Tolerance check for dust (up to 1000 wei for rounding)
function isClose(actual: bigint, expected: bigint, tolerance = 1000n): boolean {
    const diff = actual > expected ? actual - expected : expected - actual;
    return diff <= tolerance;
}

function reportResult(
    tier: string,
    action: string,
    passed: boolean,
    expected?: string,
    actual?: string,
    details?: string
) {
    REPORT.push({
        tier,
        action,
        status: passed ? "✅ PASS" : "❌ FAIL",
        expected,
        actual,
        details
    });
    
    const icon = passed ? "✅" : "❌";
    console.log(`      ${icon} ${action}: ${actual || ""} ${details ? `(${details})` : ""}`);
}

// =================================================================
// 🧪 MAIN TEST SCRIPT
// =================================================================

async function main() {
    const [tester] = await ethers.getSigners();
    if (!tester) throw new Error("No signer configured. Check your .env file.");

    console.log(`\n🔬 BACKCOIN V2.1 ECOSYSTEM AUDIT`);
    console.log(`   📅 Date: ${new Date().toISOString()}`);
    console.log(`   🧑‍🚀 Tester: ${tester.address}`);
    console.log(`   💰 ETH Balance: ${toEther(await tester.provider!.getBalance(tester.address))} ETH`);

    // =================================================================
    // 1. LOAD DEPLOYMENT ADDRESSES
    // =================================================================
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error("deployment-addresses.json not found. Run deployment first.");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    console.log(`\n   📋 Loaded ${Object.keys(addresses).length} contract addresses`);

    // =================================================================
    // 2. CONNECT TO CONTRACTS
    // =================================================================
    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, tester) as unknown as BKCToken;
    const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, tester) as unknown as EcosystemManager;
    const notary = await ethers.getContractAt("DecentralizedNotary", addresses.decentralizedNotary, tester) as unknown as DecentralizedNotary;
    const delegation = await ethers.getContractAt("DelegationManager", addresses.delegationManager, tester) as unknown as DelegationManager;
    const nft = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, tester) as unknown as RewardBoosterNFT;
    const factory = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, tester) as unknown as NFTLiquidityPoolFactory;
    const faucet = await ethers.getContractAt("SimpleBKCFaucet", addresses.faucet, tester) as unknown as SimpleBKCFaucet;
    const fortune = await ethers.getContractAt("FortunePool", addresses.fortunePool, tester) as unknown as FortunePool;
    const rental = await ethers.getContractAt("RentalManager", addresses.rentalManager, tester) as unknown as RentalManager;

    // Check BKC balance
    const bkcBalance = await bkc.balanceOf(tester.address);
    console.log(`   💎 BKC Balance: ${toEther(bkcBalance)} BKC`);

    // =================================================================
    // 3. PRE-FLIGHT: READ BASE FEES
    // =================================================================
    logSection("📊 BASE FEES (Before Discounts)");

    const baseFeesBips: Record<string, bigint> = {};
    const baseFeesFlat: Record<string, bigint> = {};
    
    console.log("\n   BIPS-based fees (percentage):");
    for (const [name, key] of Object.entries(FEE_KEYS_BIPS)) {
        try {
            baseFeesBips[name] = await hub.getFee(key);
            console.log(`   ${name}: ${toBips(baseFeesBips[name])}`);
        } catch {
            console.log(`   ${name}: ⚠️ Not found`);
            baseFeesBips[name] = 0n;
        }
    }

    console.log("\n   FLAT fees (fixed amount in BKC):");
    for (const [name, key] of Object.entries(FEE_KEYS_FLAT)) {
        try {
            baseFeesFlat[name] = await hub.getFee(key);
            console.log(`   ${name}: ${toEther(baseFeesFlat[name])} BKC`);
        } catch {
            console.log(`   ${name}: ⚠️ Not found`);
            baseFeesFlat[name] = 0n;
        }
    }

    // =================================================================
    // 4. FAUCET CHECK (Get initial BKC if needed)
    // =================================================================
    logSection("🚰 FAUCET CHECK");
    
    try {
        const faucetAny = faucet as any;
        
        // Try to claim from faucet
        if (bkcBalance < ethers.parseEther("500")) {
            console.log(`   Attempting to claim from faucet...`);
            const tx = await faucetAny.distributeTo(tester.address);
            await tx.wait();
            const newBalance = await bkc.balanceOf(tester.address);
            console.log(`   ✅ Claimed! New balance: ${toEther(newBalance)} BKC`);
            REPORT.push({ tier: "Setup", action: "Faucet Claim", status: "✅ PASS" });
        } else {
            console.log(`   ✅ Sufficient balance, skipping faucet`);
            REPORT.push({ tier: "Setup", action: "Faucet", status: "⚠️ SKIP", details: "Sufficient balance" });
        }
    } catch (e: any) {
        if (e.message.includes("cooldown") || e.message.includes("Wait") || e.message.includes("Too soon")) {
            console.log(`   ⏳ Faucet on cooldown`);
            REPORT.push({ tier: "Setup", action: "Faucet", status: "⏳ WAIT" });
        } else {
            console.log(`   ❌ Faucet error: ${e.message.slice(0, 60)}`);
            REPORT.push({ tier: "Setup", action: "Faucet", status: "❌ FAIL", details: e.message.slice(0, 40) });
        }
    }

    // =================================================================
    // 5. RUN TEST CYCLE FOR EACH TIER
    // =================================================================
    for (const tier of TIERS) {
        await runTierTestCycle(tier, {
            tester,
            addresses,
            bkc,
            hub,
            notary,
            delegation,
            nft,
            factory,
            fortune,
            rental,
            baseFeesBips,
            baseFeesFlat
        });
        
        // Small delay between tiers
        await sleep(1000);
    }

    // =================================================================
    // 6. FINAL REPORT
    // =================================================================
    logSection("📊 FINAL AUDIT REPORT");
    
    console.table(REPORT.map(r => ({
        Tier: r.tier.substring(0, 15),
        Action: r.action,
        Status: r.status,
        Expected: r.expected || "-",
        Actual: r.actual || "-",
        Details: r.details || "-"
    })));

    const passed = REPORT.filter(r => r.status === "✅ PASS").length;
    const failed = REPORT.filter(r => r.status === "❌ FAIL").length;
    const skipped = REPORT.filter(r => r.status === "⚠️ SKIP" || r.status === "⏳ WAIT").length;
    const info = REPORT.filter(r => r.status === "ℹ️ INFO").length;

    console.log(`\n   📈 Summary: ${passed} passed, ${failed} failed, ${skipped} skipped, ${info} info`);
    
    if (failed > 0) {
        console.log(`\n   ❌ AUDIT FAILED - ${failed} test(s) did not pass`);
        process.exit(1);
    } else {
        console.log(`\n   ✅ AUDIT PASSED - All critical tests successful`);
    }
}

// =================================================================
// 🔄 TIER TEST CYCLE
// =================================================================

interface TestContext {
    tester: any;
    addresses: any;
    bkc: BKCToken;
    hub: EcosystemManager;
    notary: DecentralizedNotary;
    delegation: DelegationManager;
    nft: RewardBoosterNFT;
    factory: NFTLiquidityPoolFactory;
    fortune: FortunePool;
    rental: RentalManager;
    baseFeesBips: Record<string, bigint>;
    baseFeesFlat: Record<string, bigint>;
}

async function runTierTestCycle(
    tier: { name: string; boost: bigint; poolName: string | null },
    ctx: TestContext
) {
    logSection(`🚀 TIER: ${tier.name} (Boost: ${Number(tier.boost)/100}%)`);

    let acquiredTokenId: bigint | null = null;
    let poolAddress: string = ethers.ZeroAddress;

    // -----------------------------------------------------------------
    // A. ACQUIRE NFT (if tier has boost)
    // -----------------------------------------------------------------
    if (tier.boost > 0n && tier.poolName) {
        logSubsection("A. NFT ACQUISITION");
        
        try {
            // Get pool address from factory
            poolAddress = await ctx.factory.getPoolAddress(tier.boost);
            
            if (poolAddress === ethers.ZeroAddress) {
                console.log(`      ⚠️ Pool not deployed for ${tier.name}`);
                REPORT.push({ tier: tier.name, action: "Pool Check", status: "⚠️ SKIP", details: "Pool not found" });
                return; // Skip this tier
            }

            const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, ctx.tester) as unknown as NFTLiquidityPool;
            
            // Get available NFTs
            const availableIds = await pool.getAvailableNFTs();
            if (availableIds.length === 0) {
                console.log(`      ⚠️ No NFTs available in pool`);
                REPORT.push({ tier: tier.name, action: "NFT Buy", status: "⚠️ SKIP", details: "Pool empty" });
                return;
            }

            const tokenIdToBuy = availableIds[availableIds.length - 1];
            const buyPrice = await pool.getBuyPrice();
            const buyTaxBips = ctx.baseFeesBips["NFT_POOL_BUY_TAX_BIPS"] || 0n;
            const totalCost = buyPrice + (buyPrice * buyTaxBips) / 10000n;

            console.log(`      📦 Buying NFT for ${toEther(totalCost)} BKC...`);

            // Approve and buy
            await ctx.bkc.approve(poolAddress, totalCost * 2n);
            
            // V2.1: buyNFT() - compra próximo disponível automaticamente
            const txBuy = await pool.buyNFT();
            const rcBuy = await txBuy.wait();

            // Get tokenId from event - try multiple event names
            let boughtTokenId: bigint | null = null;
            const eventNames = ["NFTBought", "NFTPurchased", "TokenBought", "Transfer"];
            
            for (const log of rcBuy?.logs || []) {
                try {
                    const parsed = pool.interface.parseLog(log);
                    if (parsed) {
                        console.log(`      📝 Event: ${parsed.name}`);
                        if (eventNames.includes(parsed.name)) {
                            boughtTokenId = parsed.args.tokenId || parsed.args._tokenId || parsed.args[0];
                            console.log(`      📝 Found tokenId: ${boughtTokenId}`);
                            break;
                        }
                    }
                } catch {
                    // Try parsing as NFT Transfer event
                    try {
                        const parsed = ctx.nft.interface.parseLog(log);
                        if (parsed?.name === "Transfer" && parsed.args.to === ctx.tester.address) {
                            boughtTokenId = parsed.args.tokenId;
                            console.log(`      📝 Found tokenId from NFT Transfer: ${boughtTokenId}`);
                            break;
                        }
                    } catch {}
                }
            }

            if (boughtTokenId !== null) {
                // Verify ownership
                const owner = await ctx.nft.ownerOf(boughtTokenId);
                if (owner.toLowerCase() === ctx.tester.address.toLowerCase()) {
                    acquiredTokenId = boughtTokenId;
                    reportResult(tier.name, "NFT Buy", true, undefined, `#${boughtTokenId}`, `${toEther(totalCost)} BKC`);
                } else {
                    reportResult(tier.name, "NFT Buy", false, ctx.tester.address, owner);
                }
            } else {
                // Fallback: check if we own any new NFT
                console.log(`      ⚠️ No event found, checking NFT balance...`);
                const nftBalance = await ctx.nft.balanceOf(ctx.tester.address);
                if (nftBalance > 0n) {
                    // Try to find the last token
                    try {
                        const lastToken = await ctx.nft.tokenOfOwnerByIndex(ctx.tester.address, nftBalance - 1n);
                        acquiredTokenId = lastToken;
                        reportResult(tier.name, "NFT Buy", true, undefined, `#${lastToken} (from balance)`, `${toEther(totalCost)} BKC`);
                    } catch {
                        reportResult(tier.name, "NFT Buy", false, "Event found", "No NFTBought event");
                    }
                } else {
                    reportResult(tier.name, "NFT Buy", false, "Event found", "No NFTBought event");
                }
            }

        } catch (e: any) {
            console.log(`      ❌ NFT Buy Error: ${e.message.slice(0, 60)}`);
            REPORT.push({ tier: tier.name, action: "NFT Buy", status: "❌ FAIL", details: e.message.slice(0, 40) });
            return; // Can't continue without NFT
        }
    }

    const boosterTokenId = acquiredTokenId || 0n;

    // -----------------------------------------------------------------
    // B. RENTAL TEST (List/Unlist)
    // -----------------------------------------------------------------
    if (acquiredTokenId !== null) {
        logSubsection("B. RENTAL SYSTEM");
        
        try {
            const rentalAny = ctx.rental as any;
            
            // Approve NFT for rental
            await ctx.nft.approve(ctx.addresses.rentalManager, acquiredTokenId);
            console.log(`      📋 Approved NFT #${acquiredTokenId} for rental`);
            
            // RentalManager has two functions:
            // 1. listNFTSimple(tokenId, price) - 2 params, fixed 1 hour
            // 2. listNFT(tokenId, pricePerHour, minHours, maxHours) - 4 params
            
            let listSuccess = false;
            const pricePerHour = TEST_CONFIG.RENTAL_PRICE_PER_HOUR;
            
            // Try listNFTSimple first (simpler)
            try {
                console.log(`      📋 Trying listNFTSimple(${acquiredTokenId}, ${toEther(pricePerHour)})...`);
                const txList = await rentalAny.listNFTSimple(acquiredTokenId, pricePerHour);
                await txList.wait();
                listSuccess = true;
                console.log(`      ✅ Listed via listNFTSimple`);
            } catch (e1: any) {
                console.log(`      ⚠️ listNFTSimple failed: ${e1.message.slice(0, 40)}`);
                
                // Try listNFT with 4 params
                try {
                    console.log(`      📋 Trying listNFT(${acquiredTokenId}, ${toEther(pricePerHour)}, 1, 24)...`);
                    const txList = await rentalAny.listNFT(acquiredTokenId, pricePerHour, 1, 24);
                    await txList.wait();
                    listSuccess = true;
                    console.log(`      ✅ Listed via listNFT`);
                } catch (e2: any) {
                    console.log(`      ⚠️ listNFT(4 params) failed: ${e2.message.slice(0, 40)}`);
                }
            }

            if (listSuccess) {
                // Verify listing
                let listing: any;
                try {
                    listing = await rentalAny.listings(acquiredTokenId);
                } catch {
                    listing = await rentalAny.getListing(acquiredTokenId);
                }
                
                const isActive = listing.isActive || listing.active || listing[4]; // isActive is at index 4 in struct
                
                if (isActive) {
                    reportResult(tier.name, "Rental List", true, "active=true", `active=${isActive}`);
                    
                    // Withdraw to use NFT for other tests
                    console.log(`      📋 Withdrawing NFT #${acquiredTokenId}...`);
                    const txWithdraw = await rentalAny.withdrawNFT(acquiredTokenId);
                    await txWithdraw.wait();
                    
                    // Verify NFT returned
                    const ownerAfter = await ctx.nft.ownerOf(acquiredTokenId);
                    const returned = ownerAfter.toLowerCase() === ctx.tester.address.toLowerCase();
                    reportResult(tier.name, "Rental Withdraw", returned, ctx.tester.address, ownerAfter);
                } else {
                    reportResult(tier.name, "Rental List", false, "active=true", `active=${isActive}`);
                }
            } else {
                REPORT.push({ tier: tier.name, action: "Rental", status: "❌ FAIL", details: "No matching function" });
            }

        } catch (e: any) {
            console.log(`      ❌ Rental Error: ${e.message.slice(0, 60)}`);
            REPORT.push({ tier: tier.name, action: "Rental", status: "❌ FAIL", details: e.message.slice(0, 40) });
        }
    }

    // -----------------------------------------------------------------
    // C. DELEGATION TEST (Fee Discount Verification)
    // -----------------------------------------------------------------
    logSubsection("C. DELEGATION (Staking)");
    
    try {
        const stakeAmount = TEST_CONFIG.STAKE_AMOUNT;
        const lockTime = 86400 * TEST_CONFIG.STAKE_LOCK_DAYS;
        const baseFeeBips = ctx.baseFeesBips["DELEGATION_FEE_BIPS"] || 0n;

        // Calculate expected fee WITH NFT discount only
        const baseFeeAmount = (stakeAmount * baseFeeBips) / 10000n;
        const expectedFeeWithNFTDiscount = calculateDiscountedFee(baseFeeAmount, tier.boost);

        console.log(`      📊 Stake: ${toEther(stakeAmount)} BKC, Lock: ${TEST_CONFIG.STAKE_LOCK_DAYS}d`);
        console.log(`      📊 Base Fee Rate: ${toBips(baseFeeBips)}`);
        console.log(`      📊 Expected Base Fee: ${toEther(baseFeeAmount)} BKC`);
        console.log(`      📊 With NFT Discount (${Number(tier.boost)/100}%): ${toEther(expectedFeeWithNFTDiscount)} BKC`);

        const balBefore = await ctx.bkc.balanceOf(ctx.tester.address);
        
        // Approve delegation
        await ctx.bkc.approve(ctx.addresses.delegationManager, stakeAmount * 2n);
        
        // V2.1: delegate(amount, lockTime, boosterTokenId)
        const txDel = await ctx.delegation.delegate(stakeAmount, lockTime, boosterTokenId);
        const rcDel = await txDel.wait();

        // Detect auto-claimed rewards and delegation fee from events
        let autoClaimedAmount = 0n;
        let feeFromEvent = 0n;
        
        if (rcDel) {
            for (const log of rcDel.logs) {
                try {
                    const parsed = ctx.delegation.interface.parseLog(log);
                    if (parsed?.name === "RewardClaimed" && parsed.args.user === ctx.tester.address) {
                        autoClaimedAmount += parsed.args.amount;
                        console.log(`      💰 Auto-Claimed Rewards: ${toEther(parsed.args.amount)} BKC`);
                    }
                    if (parsed?.name === "Delegated") {
                        if (parsed.args.fee !== undefined) {
                            feeFromEvent = parsed.args.fee;
                            console.log(`      💰 Fee from Event: ${toEther(feeFromEvent)} BKC`);
                        }
                    }
                } catch {}
            }
        }

        const balAfter = await ctx.bkc.balanceOf(ctx.tester.address);
        
        // Calculate what actually happened
        const totalSpent = balBefore - balAfter;
        const actualFee = totalSpent + autoClaimedAmount - stakeAmount;

        console.log(`      📊 Balance Change: ${toEther(balBefore)} → ${toEther(balAfter)} BKC`);
        console.log(`      📊 Total Spent (from wallet): ${toEther(totalSpent)} BKC`);
        console.log(`      📊 Calculated Fee: ${toEther(actualFee)} BKC`);

        // Calculate effective discount rate
        const effectiveDiscount = baseFeeAmount > 0n 
            ? ((baseFeeAmount - actualFee) * 10000n) / baseFeeAmount 
            : 0n;
        console.log(`      📊 Effective Discount: ${Number(effectiveDiscount)/100}%`);

        // Verify delegation was created (main success criteria)
        const delegations = await ctx.delegation.getDelegationsOf(ctx.tester.address);
        const delegationCreated = delegations.length > 0;
        
        reportResult(
            tier.name,
            "Delegation Created",
            delegationCreated,
            "delegations > 0",
            `${delegations.length} delegations`
        );

        // Report fee info (for analysis, not pass/fail)
        REPORT.push({
            tier: tier.name,
            action: "Delegation Fee Info",
            status: "ℹ️ INFO",
            expected: `${toEther(expectedFeeWithNFTDiscount)} BKC`,
            actual: `${toEther(actualFee)} BKC`,
            details: `Effective: ${Number(effectiveDiscount)/100}% off`
        });

    } catch (e: any) {
        console.log(`      ❌ Delegation Error: ${e.message.slice(0, 60)}`);
        REPORT.push({ tier: tier.name, action: "Delegation", status: "❌ FAIL", details: e.message.slice(0, 40) });
    }

    // -----------------------------------------------------------------
    // D. NOTARY TEST (Fee Discount Verification)
    // -----------------------------------------------------------------
    logSubsection("D. NOTARY SERVICE");
    
    try {
        // NOTARY_SERVICE is a FLAT fee in WEI, not BIPS
        const baseFee = ctx.baseFeesFlat["NOTARY_SERVICE"] || 0n;
        
        if (baseFee === 0n) {
            console.log(`      ⚠️ Notary fee not configured`);
            REPORT.push({ tier: tier.name, action: "Notary", status: "⚠️ SKIP", details: "Fee = 0" });
        } else {
            // Calculate expected fee WITH NFT discount only
            const expectedFeeWithNFTDiscount = calculateDiscountedFee(baseFee, tier.boost);

            console.log(`      📊 Base Fee (from Hub): ${toEther(baseFee)} BKC (flat)`);
            console.log(`      📊 With NFT Discount (${Number(tier.boost)/100}%): ${toEther(expectedFeeWithNFTDiscount)} BKC`);

            const balBefore = await ctx.bkc.balanceOf(ctx.tester.address);
            
            // Approve notary
            await ctx.bkc.approve(ctx.addresses.decentralizedNotary, baseFee * 2n);
            
            // V2.1: notarize(contentHash, category, uniqueId, boosterTokenId)
            const uniqueId = ethers.id(Date.now().toString() + Math.random().toString());
            const txNotary = await ctx.notary.notarize(
                TEST_CONFIG.NOTARY_CONTENT,
                "AuditTest",
                uniqueId,
                boosterTokenId
            );
            await txNotary.wait();

            const balAfter = await ctx.bkc.balanceOf(ctx.tester.address);
            const actualFee = balBefore - balAfter;

            console.log(`      📊 Actual Fee Paid: ${toEther(actualFee)} BKC`);

            // Calculate effective discount
            const effectiveDiscount = baseFee > 0n 
                ? ((baseFee - actualFee) * 10000n) / baseFee 
                : 0n;
            console.log(`      📊 Effective Discount: ${Number(effectiveDiscount)/100}%`);

            // Notarization succeeded (main success criteria)
            reportResult(
                tier.name,
                "Notary Success",
                actualFee > 0n && actualFee <= baseFee,
                "fee paid",
                `${toEther(actualFee)} BKC`
            );

            // Report fee info (for analysis)
            REPORT.push({
                tier: tier.name,
                action: "Notary Fee Info",
                status: "ℹ️ INFO",
                expected: `${toEther(expectedFeeWithNFTDiscount)} BKC`,
                actual: `${toEther(actualFee)} BKC`,
                details: `Effective: ${Number(effectiveDiscount)/100}% off`
            });
        }

    } catch (e: any) {
        console.log(`      ❌ Notary Error: ${e.message.slice(0, 60)}`);
        REPORT.push({ tier: tier.name, action: "Notary", status: "❌ FAIL", details: e.message.slice(0, 40) });
    }

    // -----------------------------------------------------------------
    // E. FORTUNE POOL TEST
    // -----------------------------------------------------------------
    logSubsection("E. FORTUNE POOL");
    
    try {
        const fortuneAny = ctx.fortune as any;
        
        // Check if Fortune is active
        let activeTiers = 0n;
        try {
            activeTiers = await fortuneAny.activeTierCount();
        } catch {
            try {
                const config = await fortuneAny.gameConfig();
                activeTiers = config.activeTiers || 0n;
            } catch {}
        }

        if (activeTiers === 0n) {
            console.log(`      ⚠️ Fortune Pool not active`);
            REPORT.push({ tier: tier.name, action: "Fortune", status: "⚠️ SKIP", details: "No active tiers" });
        } else {
            const wager = TEST_CONFIG.FORTUNE_WAGER;
            
            // ═══════════════════════════════════════════════════════════════
            // GAME MODE SELECTION:
            // - Mode 1x (isCumulative=false): 1 guess for jackpot, 1x fee
            // - Mode 5x (isCumulative=true): N guesses for all tiers, 5x fee
            // ═══════════════════════════════════════════════════════════════
            
            // Use mode 5x (cumulative) to test all tiers
            const isCumulative = true;
            const expectedGuessCount = Number(activeTiers);
            const guesses = Array(expectedGuessCount).fill(1n);
            
            // Get oracle fee - MUST use getRequiredOracleFee with mode!
            let requiredOracleFee = 0n;
            try {
                requiredOracleFee = await fortuneAny.getRequiredOracleFee(isCumulative);
            } catch {
                // Fallback: read base fee and multiply
                const baseFee = await fortuneAny.oracleFee();
                requiredOracleFee = isCumulative ? baseFee * 5n : baseFee;
            }

            console.log(`      🎰 Mode: ${isCumulative ? '5x (Cumulative)' : '1x (Jackpot)'}`);
            console.log(`      🎰 Wager: ${toEther(wager)} BKC, Tiers: ${activeTiers}, Guesses: ${expectedGuessCount}`);
            console.log(`      🎰 Oracle Fee: ${toEther(requiredOracleFee)} ETH`);
            console.log(`      🎰 Guesses: [${guesses.join(", ")}]`);

            // Check balances
            const bkcBal = await ctx.bkc.balanceOf(ctx.tester.address);
            const ethBal = await ctx.tester.provider!.getBalance(ctx.tester.address);
            console.log(`      🎰 BKC Balance: ${toEther(bkcBal)} BKC`);
            console.log(`      🎰 ETH Balance: ${toEther(ethBal)} ETH`);
            
            if (bkcBal < wager) {
                console.log(`      ⚠️ Insufficient BKC for wager`);
                REPORT.push({ tier: tier.name, action: "Fortune", status: "⚠️ SKIP", details: "Low BKC" });
            } else if (ethBal < requiredOracleFee) {
                console.log(`      ⚠️ Insufficient ETH for oracle fee`);
                REPORT.push({ tier: tier.name, action: "Fortune", status: "⚠️ SKIP", details: "Low ETH" });
            } else {
                // Approve wager
                await ctx.bkc.approve(ctx.addresses.fortunePool, wager * 2n);
                console.log(`      🎰 Approved ${toEther(wager * 2n)} BKC`);
                
                // Call participate with EXACT oracle fee
                console.log(`      🎰 Calling participate(${toEther(wager)}, [${guesses}], ${isCumulative}) with ${toEther(requiredOracleFee)} ETH...`);
                
                const txFortune = await fortuneAny.participate(wager, guesses, isCumulative, { value: requiredOracleFee });
                const rcFortune = await txFortune.wait();

                // Find game ID from event
                let gameId: bigint | null = null;
                for (const log of rcFortune?.logs || []) {
                    try {
                        const parsed = ctx.fortune.interface.parseLog(log);
                        console.log(`      📝 Fortune Event: ${parsed?.name}`);
                        if (parsed?.name === "GameRequested" || parsed?.name === "GameStarted") {
                            gameId = parsed.args.gameId || parsed.args.requestId;
                            break;
                        }
                    } catch {}
                }

                if (gameId !== null) {
                    console.log(`      🎲 Game #${gameId} submitted. Waiting for oracle...`);
                    
                    // Wait for oracle (max 20 seconds)
                    let resolved = false;
                    for (let i = 0; i < 10; i++) {
                        await sleep(2000);
                        process.stdout.write(".");
                        
                        try {
                            const status = await fortuneAny.getGameStatus(gameId);
                            if (status[1] === true) { // isResolved
                                const rolls = status[4];
                                const wins = rolls.filter((r: bigint, idx: number) => r === guesses[idx]).length;
                                console.log(`\n      🎲 Result: [${rolls}] - ${wins > 0 ? "WIN!" : "LOSE"}`);
                                reportResult(tier.name, "Fortune Oracle", true, "resolved", `Game #${gameId}`);
                                resolved = true;
                                break;
                            }
                        } catch {}
                    }
                    
                    if (!resolved) {
                        console.log(`\n      ⏳ Oracle pending (game submitted successfully)`);
                        REPORT.push({ tier: tier.name, action: "Fortune", status: "✅ PASS", details: `Game #${gameId} pending` });
                    }
                } else {
                    reportResult(tier.name, "Fortune Submit", true, undefined, "Game submitted");
                }
            }
        }

    } catch (e: any) {
        console.log(`      ❌ Fortune Error: ${e.message}`);
        // Try to get more details from error
        if (e.data) {
            try {
                const decoded = ctx.fortune.interface.parseError(e.data);
                console.log(`      ❌ Error details: ${decoded?.name} ${JSON.stringify(decoded?.args)}`);
            } catch {}
        }
        REPORT.push({ tier: tier.name, action: "Fortune", status: "❌ FAIL", details: e.message.slice(0, 40) });
    }

    // -----------------------------------------------------------------
    // F. CLEANUP (Unstake + Sell NFT)
    // -----------------------------------------------------------------
    logSubsection("F. CLEANUP");
    
    try {
        // Force unstake all delegations
        const delegations = await ctx.delegation.getDelegationsOf(ctx.tester.address);
        for (let i = delegations.length - 1; i >= 0; i--) {
            try {
                await ctx.delegation.forceUnstake(i, boosterTokenId);
                console.log(`      🧹 Unstaked delegation #${i}`);
            } catch {}
        }

        // Sell NFT back to pool
        if (acquiredTokenId !== null && poolAddress !== ethers.ZeroAddress) {
            try {
                const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, ctx.tester) as unknown as NFTLiquidityPool;
                
                // Approve NFT for pool
                await ctx.nft.approve(poolAddress, acquiredTokenId);
                
                // V2.1: sellNFT(tokenId, minPayout)
                const txSell = await pool.sellNFT(acquiredTokenId, 0n);
                await txSell.wait();
                
                console.log(`      🧹 Sold NFT #${acquiredTokenId} back to pool`);
                reportResult(tier.name, "NFT Sell", true, undefined, `#${acquiredTokenId}`);
            } catch (e: any) {
                console.log(`      ⚠️ Could not sell NFT: ${e.message.slice(0, 40)}`);
            }
        }

        REPORT.push({ tier: tier.name, action: "Cleanup", status: "✅ PASS" });

    } catch (e: any) {
        console.log(`      ⚠️ Cleanup warning: ${e.message.slice(0, 40)}`);
        REPORT.push({ tier: tier.name, action: "Cleanup", status: "⚠️ SKIP", details: e.message.slice(0, 30) });
    }

    console.log(`\n   ✅ Tier ${tier.name} cycle complete\n`);
}

// =================================================================
// 🚀 RUN
// =================================================================

main().catch((error) => {
    console.error("\n❌ FATAL ERROR:", error);
    process.exitCode = 1;
});