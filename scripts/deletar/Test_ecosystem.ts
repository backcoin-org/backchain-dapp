/**
 * 🔬 BACKCHAIN V6.8 ECOSYSTEM VERIFICATION SCRIPT
 * 
 * Contratos testados:
 * - 🚰 Faucet (claim de tokens)
 * - 📊 Fees Configuration
 * - 🎗️ CharityPool (doações em ETH)
 * - 💬 Backchat (rede social com BKC)
 * - 🔄 Tier Tests (4 níveis: Bronze, Silver, Gold, Diamond)
 *   - NFT Acquisition
 *   - Delegation (Staking)
 *   - Notary
 *   - Fortune Pool (Commit-Reveal)
 * 
 * Uso: npx hardhat run scripts/Test_ecosystem.ts --network arbitrumSepolia
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

// V6.7: 4 tiers disponíveis
const TIERS = [
    { name: "🚫 Baseline (No NFT)", boost: 0n, poolName: null },
    { name: "🥉 Bronze",   boost: 1000n, poolName: "bronze" },
    { name: "🥈 Silver",   boost: 2500n, poolName: "silver" },
    { name: "🥇 Gold",     boost: 4000n, poolName: "gold" },
    { name: "💎 Diamond",  boost: 5000n, poolName: "diamond" },
];

const TEST_CONFIG = {
    // Delegation - lockDuration in SECONDS
    DELEGATE_AMOUNT: ethers.parseEther("100"),
    DELEGATE_LOCK_SECONDS: 86400, // 1 day minimum
    
    // Fortune Pool
    FORTUNE_WAGER: ethers.parseEther("10"),
    
    // CharityPool (doações em ETH)
    CHARITY_DONATION_ETH: ethers.parseEther("0.001"),
    CHARITY_GOAL_ETH: ethers.parseEther("0.01"),
    
    // Backchat
    BACKCHAT_POST_COST: ethers.parseEther("0.01"),
    BACKCHAT_LIKE_COST: ethers.parseEther("0.001"),
    
    // Minimum balance to skip faucet
    MIN_BKC_BALANCE: ethers.parseEther("1000"),
};

type AuditEntry = {
    tier: string;
    action: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP" | "ℹ️ INFO" | "⚠️ WARN";
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
const getTierName = (boost: bigint): string => {
    if (boost >= 5000n) return "Diamond";
    if (boost >= 4000n) return "Gold";
    if (boost >= 2500n) return "Silver";
    if (boost >= 1000n) return "Bronze";
    return "No NFT";
};
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

// =================================================================
// 📋 MAIN SCRIPT
// =================================================================

async function main(): Promise<void> {
    const [tester] = await ethers.getSigners();
    if (!tester) throw new Error("No signer configured. Check your .env file.");

    const ethBalance = await tester.provider!.getBalance(tester.address);

    console.log(`\n${"═".repeat(80)}`);
    console.log(`   🔬 BACKCHAIN V6.8 ECOSYSTEM VERIFICATION`);
    console.log(`   📅 Date: ${new Date().toISOString()}`);
    console.log(`${"═".repeat(80)}`);
    console.log(`   🧑‍🚀 Tester: ${tester.address}`);
    console.log(`   💰 ETH Balance: ${toEther(BigInt(ethBalance.toString()))} ETH`);

    // Load addresses
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error("deployment-addresses.json not found. Run deployment first.");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    console.log(`   📋 Loaded ${Object.keys(addresses).length} contract addresses`);
    
    // Show key addresses
    console.log(`\n   📋 Key Addresses:`);
    console.log(`      BKCToken: ${addresses.bkcToken}`);
    console.log(`      EcosystemManager: ${addresses.ecosystemManager}`);
    console.log(`      MiningManager: ${addresses.miningManager}`);
    console.log(`      Backchat: ${addresses.backchat}`);
    console.log(`      FortunePool: ${addresses.fortunePool}`);
    console.log(`      Faucet: ${addresses.faucet}`);

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
    const backchat = addresses.backchat
        ? await ethers.getContractAt("Backchat", addresses.backchat, tester) as any
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
    await readBaseFees(hub, fortune, charity, notary);

    // =================================================================
    // 3. CHARITY POOL TESTS
    // =================================================================
    if (charity) {
        await testCharityPool(charity, bkc, tester, addresses);
    } else {
        console.log("\n   ⚠️ CharityPool not deployed, skipping tests");
    }

    // =================================================================
    // 4. BACKCHAT TESTS
    // =================================================================
    if (backchat) {
        await testBackchat(backchat, bkc, tester, addresses);
    } else {
        console.log("\n   ⚠️ Backchat not deployed, skipping tests");
    }

    // =================================================================
    // 5. RUN TIER TESTS
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
        });
        
        await sleep(2000);
    }

    // =================================================================
    // 6. FINAL REPORT
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
                await tx.wait();
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

async function readBaseFees(hub: any, fortune: any, charity: any, notary: any): Promise<void> {
    console.log(`\n   📊 EcosystemManager Fees:`);
    
    const feeKeys = [
        "DELEGATION_FEE_BIPS",
        "UNSTAKE_FEE_BIPS",
        "FORCE_UNSTAKE_PENALTY_BIPS",
        "CLAIM_REWARD_FEE_BIPS",
        "NFT_POOL_BUY_TAX_BIPS",
        "NFT_POOL_SELL_TAX_BIPS",
        "RENTAL_MARKET_TAX_BIPS",
        "FORTUNE_POOL_GAME_FEE",
        "NOTARY_SERVICE",
    ];

    for (const key of feeKeys) {
        try {
            const fee = await hub.getFee(ethers.id(key));
            const value = BigInt(fee.toString());
            if (key.includes("BIPS")) {
                console.log(`      ${key}: ${toBips(value)}`);
            } else {
                console.log(`      ${key}: ${toEther(value)} BKC`);
            }
        } catch {
            console.log(`      ${key}: (not set)`);
        }
    }

    // Fortune Pool
    try {
        const serviceFee = await fortune.serviceFee();
        console.log(`\n   🎰 Fortune Pool:`);
        console.log(`      Service Fee: ${toEtherShort(BigInt(serviceFee.toString()))} ETH`);
        
        // Try to get revealDelay
        try {
            const revealDelay = await fortune.revealDelay();
            console.log(`      Reveal Delay: ${revealDelay} blocks`);
        } catch {
            console.log(`      Reveal Delay: (not available)`);
        }
        
        const poolStats = await fortune.getPoolStats();
        console.log(`      Prize Pool: ${toEther(BigInt(poolStats.poolBalance.toString()))} BKC`);
        console.log(`      Total Games: ${poolStats.gamesPlayed.toString()}`);
    } catch (e: any) {
        console.log(`   ⚠️ Fortune Pool: ${e.message.slice(0, 40)}`);
    }

    // CharityPool
    if (charity) {
        try {
            const feeConfig = await charity.getFeeConfig();
            console.log(`\n   🎗️ CharityPool:`);
            console.log(`      Create Cost: ${toEther(BigInt(feeConfig.createBkc.toString()))} BKC`);
            console.log(`      Withdraw Cost: ${toEther(BigInt(feeConfig.withdrawBkc.toString()))} BKC`);
            console.log(`      Donation Fee: ${toBips(BigInt(feeConfig.donationBips.toString()))}`);
        } catch (e: any) {
            console.log(`   ⚠️ CharityPool fees: ${e.message.slice(0, 40)}`);
        }
    }

    // Notary
    try {
        const [bkcFee, ethFee] = await notary.getFee();
        console.log(`\n   📜 Notary:`);
        console.log(`      BKC Fee: ${toEther(BigInt(bkcFee.toString()))} BKC`);
        console.log(`      ETH Fee: ${toEtherShort(BigInt(ethFee.toString()))} ETH`);
    } catch (e: any) {
        console.log(`   ⚠️ Notary fees: ${e.message.slice(0, 40)}`);
    }

    // NFT Tiers
    console.log(`\n   📉 NFT Tiers (Boost):`);
    for (const tier of TIERS.filter(t => t.boost > 0n)) {
        console.log(`      ${tier.name}: ${toBips(tier.boost)}`);
    }
}

// =================================================================
// 🎗️ CHARITY POOL TESTS (V6 - ETH donations)
// =================================================================

async function testCharityPool(charity: any, bkc: any, tester: any, addresses: any): Promise<void> {
    logSection("🎗️ CHARITY POOL TEST");

    const tierName = "CharityPool";

    try {
        // Get initial stats
        const statsBefore = await charity.getStats();
        console.log(`\n   📊 Stats Iniciais:`);
        console.log(`      Total Campaigns: ${statsBefore.totalCampaigns.toString()}`);
        console.log(`      Total Raised: ${toEther(BigInt(statsBefore.totalRaised.toString()))} ETH`);

        // A. CREATE CAMPAIGN
        logSubsection("A. CREATE CAMPAIGN");

        // Approve BKC for create fee
        const feeConfig = await charity.getFeeConfig();
        const createCost = BigInt(feeConfig.createBkc.toString());
        console.log(`      Create cost: ${toEther(createCost)} BKC`);
        
        await bkc.approve(addresses.charityPool, createCost * 2n);

        const durationDays = 7;
        const goalAmount = TEST_CONFIG.CHARITY_GOAL_ETH;

        const txCreate = await charity.createCampaign(
            "Test Campaign V6.7",
            "Testing CharityPool with ETH donations",
            goalAmount,
            durationDays,
            ethers.ZeroAddress // operator
        );
        const rcCreate = await txCreate.wait();

        // Parse event to get campaign ID
        let campaignId: bigint | null = null;
        for (const log of rcCreate?.logs || []) {
            try {
                const parsed = charity.interface.parseLog(log);
                if (parsed?.name === "CampaignCreated") {
                    campaignId = BigInt(parsed.args.campaignId.toString());
                    break;
                }
            } catch {}
        }

        logTx(`Campaign #${campaignId} created`, txCreate.hash);
        REPORT.push({
            tier: tierName,
            action: "Create Campaign",
            status: "✅ PASS",
            actual: `#${campaignId}`,
            txHash: txCreate.hash,
            txLink: txLink(txCreate.hash)
        });

        await sleep(1000);

        // B. DONATE (ETH)
        if (campaignId !== null) {
            logSubsection("B. DONATE (ETH)");

            const donationAmount = TEST_CONFIG.CHARITY_DONATION_ETH;
            console.log(`      Donating: ${toEther(donationAmount)} ETH`);

            const txDonate = await charity.donate(
                campaignId,
                ethers.ZeroAddress, // operator
                { value: donationAmount }
            );
            await txDonate.wait();

            logTx(`Donated ${toEther(donationAmount)} ETH`, txDonate.hash);
            REPORT.push({
                tier: tierName,
                action: "Donate ETH",
                status: "✅ PASS",
                actual: `${toEther(donationAmount)} ETH`,
                txHash: txDonate.hash,
                txLink: txLink(txDonate.hash)
            });

            // C. CHECK CAMPAIGN STATUS
            const campaign = await charity.getCampaign(campaignId);
            console.log(`\n      📈 Campaign Status:`);
            console.log(`         Raised: ${toEther(BigInt(campaign.raisedAmount.toString()))} ETH`);
            console.log(`         Goal: ${toEther(BigInt(campaign.goalAmount.toString()))} ETH`);
            console.log(`         Status: ${['ACTIVE', 'COMPLETED', 'CANCELLED', 'WITHDRAWN'][campaign.status]}`);

            // D. CANCEL CAMPAIGN
            logSubsection("C. CANCEL CAMPAIGN");
            
            const txCancel = await charity.cancelCampaign(campaignId);
            await txCancel.wait();

            logTx(`Campaign #${campaignId} cancelled`, txCancel.hash);
            REPORT.push({
                tier: tierName,
                action: "Cancel Campaign",
                status: "✅ PASS",
                txHash: txCancel.hash,
                txLink: txLink(txCancel.hash)
            });

            // E. WITHDRAW
            logSubsection("D. WITHDRAW");

            // Approve BKC for withdraw fee
            const withdrawCost = BigInt(feeConfig.withdrawBkc.toString());
            await bkc.approve(addresses.charityPool, withdrawCost * 2n);

            const txWithdraw = await charity.withdraw(campaignId, ethers.ZeroAddress);
            await txWithdraw.wait();

            logTx(`Withdrawn from campaign #${campaignId}`, txWithdraw.hash);
            REPORT.push({
                tier: tierName,
                action: "Withdraw",
                status: "✅ PASS",
                txHash: txWithdraw.hash,
                txLink: txLink(txWithdraw.hash)
            });
        }

    } catch (e: any) {
        console.log(`   ❌ CharityPool error: ${e.message.slice(0, 100)}`);
        REPORT.push({
            tier: tierName,
            action: "Test",
            status: "❌ FAIL",
            details: e.message.slice(0, 60)
        });
    }
}

// =================================================================
// 💬 BACKCHAT TESTS (V6 - BKC fees)
// =================================================================

async function testBackchat(backchat: any, bkc: any, tester: any, addresses: any): Promise<void> {
    logSection("💬 BACKCHAT TEST");

    const tierName = "Backchat";
    
    // Generate unique username
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    const testUsername = `test_${timestamp}${random}`.substring(0, 15).toLowerCase();

    let profileCreated = false;
    let postId: bigint | null = null;

    try {
        // A. CHECK CONFIG
        logSubsection("A. CONFIGURATION");

        const creatorBps = await backchat.creatorBps();
        const ecoBps = await backchat.ecoBps();
        const postCost = await backchat.postCost();
        const likeCost = await backchat.likeCost();
        
        console.log(`      Distribution: ${Number(creatorBps)/100}% creator / ${Number(ecoBps)/100}% ecosystem`);
        console.log(`      Post Cost: ${toEther(BigInt(postCost.toString()))} BKC`);
        console.log(`      Like Cost: ${toEther(BigInt(likeCost.toString()))} BKC`);
        console.log(`      Test Username: @${testUsername}`);

        // Check if profile exists
        const existingProfile = await backchat.profiles(tester.address);
        profileCreated = existingProfile.createdAt > 0;
        
        if (profileCreated) {
            console.log(`      ⚠️ Profile already exists`);
        }

        REPORT.push({
            tier: tierName,
            action: "Config Check",
            status: "✅ PASS",
            actual: `Post=${toEther(BigInt(postCost.toString()))} BKC`
        });

        // B. APPROVE BKC
        const approveAmount = ethers.parseEther("10");
        await bkc.approve(addresses.backchat, approveAmount);
        console.log(`\n      ✅ Approved ${toEther(approveAmount)} BKC for Backchat`);

        // C. CREATE PROFILE (V6 signature)
        if (!profileCreated) {
            logSubsection("B. CREATE PROFILE");

            // V6: createProfile(string username, string displayName, string bio, address operator)
            const txProfile = await backchat.createProfile(
                testUsername,
                "Test User V6",
                "Testing the Backchat ecosystem",
                ethers.ZeroAddress // operator
            );
            const rcProfile = await txProfile.wait();
            profileCreated = true;

            logTx(`Profile @${testUsername} created`, txProfile.hash);
            REPORT.push({
                tier: tierName,
                action: "Create Profile",
                status: "✅ PASS",
                actual: `@${testUsername}`,
                txHash: txProfile.hash,
                txLink: txLink(txProfile.hash)
            });

            await sleep(1000);
        }

        // D. CREATE POST (V6 signature)
        logSubsection("C. CREATE POST");

        try {
            // V6: createPost(string content, string mediaCID, address operator)
            const txPost = await backchat.createPost(
                "Hello Backchain V6.7! 🚀 Testing the ecosystem",
                "", // no media CID
                ethers.ZeroAddress // operator
            );
            const rcPost = await txPost.wait();

            // Parse event to get post ID
            for (const log of rcPost?.logs || []) {
                try {
                    const parsed = backchat.interface.parseLog(log);
                    if (parsed?.name === "PostCreated") {
                        postId = BigInt(parsed.args.postId.toString());
                        break;
                    }
                } catch {}
            }

            logTx(`Post #${postId} created`, txPost.hash);
            REPORT.push({
                tier: tierName,
                action: "Create Post",
                status: "✅ PASS",
                actual: `Post #${postId}`,
                txHash: txPost.hash,
                txLink: txLink(txPost.hash)
            });

            await sleep(1000);
        } catch (e: any) {
            console.log(`      ❌ Create Post Error: ${e.message.slice(0, 60)}`);
            REPORT.push({ tier: tierName, action: "Create Post", status: "❌ FAIL", details: e.message.slice(0, 40) });
        }

        // E. LIKE POST (V6 signature)
        if (postId !== null) {
            logSubsection("D. LIKE POST");

            try {
                // V6: like(uint256 postId, address operator)
                const txLike = await backchat.like(postId, ethers.ZeroAddress);
                await txLike.wait();

                logTx(`Liked post #${postId}`, txLike.hash);
                REPORT.push({
                    tier: tierName,
                    action: "Like Post",
                    status: "✅ PASS",
                    actual: `Post #${postId}`,
                    txHash: txLike.hash,
                    txLink: txLink(txLike.hash)
                });
            } catch (e: any) {
                console.log(`      ❌ Like Error: ${e.message.slice(0, 60)}`);
                REPORT.push({ tier: tierName, action: "Like Post", status: "❌ FAIL", details: e.message.slice(0, 40) });
            }

            await sleep(1000);
        }

        // F. REPLY TO POST (V6 signature)
        if (postId !== null) {
            logSubsection("E. REPLY TO POST");

            try {
                // V6: reply(uint256 parentId, string content, string mediaCID, address operator)
                const txReply = await backchat.reply(
                    postId,
                    "This is a test reply! 💬",
                    "",
                    ethers.ZeroAddress
                );
                const rcReply = await txReply.wait();

                let replyId: bigint | null = null;
                for (const log of rcReply?.logs || []) {
                    try {
                        const parsed = backchat.interface.parseLog(log);
                        if (parsed?.name === "PostCreated") {
                            replyId = BigInt(parsed.args.postId.toString());
                            break;
                        }
                    } catch {}
                }

                logTx(`Reply #${replyId} created`, txReply.hash);
                REPORT.push({
                    tier: tierName,
                    action: "Reply",
                    status: "✅ PASS",
                    actual: `Reply #${replyId}`,
                    txHash: txReply.hash,
                    txLink: txLink(txReply.hash)
                });
            } catch (e: any) {
                console.log(`      ❌ Reply Error: ${e.message.slice(0, 60)}`);
                REPORT.push({ tier: tierName, action: "Reply", status: "❌ FAIL", details: e.message.slice(0, 40) });
            }
        }

        // G. STATS
        logSubsection("F. STATS");

        try {
            const totalUsers = await backchat.totalUsers();
            const totalPosts = await backchat.totalPosts();

            console.log(`\n      📊 BACKCHAT STATS:`);
            console.log(`      ┌────────────────────────────────────────┐`);
            console.log(`      │ Total Users:    ${totalUsers.toString().padStart(15)}      │`);
            console.log(`      │ Total Posts:    ${totalPosts.toString().padStart(15)}      │`);
            console.log(`      └────────────────────────────────────────┘`);

            REPORT.push({
                tier: tierName,
                action: "Stats",
                status: "ℹ️ INFO",
                actual: `Users: ${totalUsers}, Posts: ${totalPosts}`
            });
        } catch (e: any) {
            console.log(`      ⚠️ Could not get stats: ${e.message.slice(0, 40)}`);
        }

        console.log(`\n   ✅ Backchat tests complete!`);

    } catch (e: any) {
        console.log(`\n      ❌ Backchat Fatal Error: ${e.message.slice(0, 100)}`);
        REPORT.push({
            tier: tierName,
            action: "Fatal Error",
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
}

async function runTierTest(
    tier: { name: string; boost: bigint; poolName: string | null },
    ctx: TestContext
): Promise<void> {
    logSection(`🚀 TIER: ${tier.name}`);
    console.log(`      Boost: ${toBips(tier.boost)}`);

    let acquiredTokenId: bigint | null = null;
    let poolAddress: string = ethers.ZeroAddress;

    // ─────────────────────────────────────────────────────────────
    // A. DELEGATION (First - so we can test boost on claim preview)
    // ─────────────────────────────────────────────────────────────
    logSubsection("A. DELEGATION (Staking)");

    try {
        const delegateAmount = TEST_CONFIG.DELEGATE_AMOUNT;
        const lockDuration = TEST_CONFIG.DELEGATE_LOCK_SECONDS;

        console.log(`      Delegating: ${toEther(delegateAmount)} BKC for ${lockDuration} seconds`);

        await ctx.bkc.approve(ctx.addresses.delegationManager, delegateAmount * 2n);

        const txDelegate = await ctx.delegation.delegate(
            delegateAmount,
            lockDuration,
            ethers.ZeroAddress
        );
        await txDelegate.wait();

        logTx(`Delegated ${toEther(delegateAmount)} BKC`, txDelegate.hash);
        REPORT.push({
            tier: tier.name,
            action: "Delegation",
            status: "✅ PASS",
            actual: `${toEther(delegateAmount)} BKC`,
            txHash: txDelegate.hash,
            txLink: txLink(txDelegate.hash)
        });

        await sleep(1000);

    } catch (e: any) {
        console.log(`      ❌ Delegation Error: ${e.message.slice(0, 80)}`);
        REPORT.push({ tier: tier.name, action: "Delegation", status: "❌ FAIL", details: e.message.slice(0, 50) });
    }

    // ─────────────────────────────────────────────────────────────
    // B. CHECK BOOST BEFORE NFT (Baseline has no NFT, others will compare)
    // ─────────────────────────────────────────────────────────────
    logSubsection("B. NFT BOOST VERIFICATION");

    let boostBeforeNFT = 0n;
    let burnRateBeforeNFT = 5000n; // 50% default

    try {
        // Check current boost (should be 0 if no NFT yet)
        boostBeforeNFT = await ctx.delegation.getUserBestBoost(ctx.tester.address);
        burnRateBeforeNFT = await ctx.delegation.getBurnRateForBoost(boostBeforeNFT);
        
        console.log(`      📊 Current Boost: ${toBips(boostBeforeNFT)} (${getTierName(boostBeforeNFT)})`);
        console.log(`      🔥 Burn Rate: ${toBips(burnRateBeforeNFT)} (on claim)`);

        // Preview claim to show burn amount
        try {
            const [totalRewards, burnAmount, userReceives, burnRateBips, nftBoost] = 
                await ctx.delegation.previewClaim(ctx.tester.address);
            
            if (totalRewards > 0n) {
                console.log(`      💰 Pending Rewards: ${toEther(totalRewards)} BKC`);
                console.log(`         Would burn: ${toEther(burnAmount)} BKC`);
                console.log(`         Would receive: ${toEther(userReceives)} BKC`);
            } else {
                console.log(`      💰 Pending Rewards: 0 BKC (just delegated)`);
            }
        } catch (e) {
            console.log(`      ⚠️ previewClaim not available`);
        }
    } catch (e: any) {
        console.log(`      ⚠️ Could not check boost: ${e.message?.slice(0, 50)}`);
    }

    // ─────────────────────────────────────────────────────────────
    // C. ACQUIRE NFT (if not Baseline)
    // ─────────────────────────────────────────────────────────────
    if (tier.boost > 0n && tier.poolName) {
        logSubsection("C. NFT ACQUISITION");

        try {
            poolAddress = await ctx.factory.getPoolAddress(tier.boost);
            
            if (poolAddress === ethers.ZeroAddress) {
                console.log(`      ⚠️ Pool not deployed for boost ${tier.boost}`);
                REPORT.push({ tier: tier.name, action: "Pool Check", status: "⚠️ SKIP", details: "Pool not found" });
            } else {
                console.log(`      Pool Address: ${poolAddress}`);

                const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, ctx.tester);
                const availableIds = await pool.getAvailableNFTs();

                if (availableIds.length === 0) {
                    console.log(`      ⚠️ No NFTs available in pool`);
                    REPORT.push({ tier: tier.name, action: "NFT Buy", status: "⚠️ SKIP", details: "Pool empty" });
                } else {
                    console.log(`      Available NFTs: ${availableIds.length}`);

                    const [bkcPrice, ethFee] = await pool.getTotalBuyCost();
                    const targetId = BigInt(availableIds[0].toString());

                    console.log(`      Target NFT: #${targetId}`);
                    console.log(`      Price: ${toEther(bkcPrice)} BKC + ${toEtherShort(ethFee)} ETH`);

                    await ctx.bkc.approve(poolAddress, bkcPrice * 2n);
                    
                    const txBuy = await pool.buySpecificNFT(targetId, ethers.ZeroAddress, { value: ethFee });
                    await txBuy.wait();

                    const owner = await ctx.nft.ownerOf(targetId);
                    if (owner.toLowerCase() === ctx.tester.address.toLowerCase()) {
                        acquiredTokenId = targetId;
                        console.log(`      ✅ Acquired NFT #${targetId}`);
                        logTx(`Bought NFT #${targetId}`, txBuy.hash);
                        
                        REPORT.push({
                            tier: tier.name,
                            action: "NFT Buy",
                            status: "✅ PASS",
                            actual: `#${targetId}`,
                            txHash: txBuy.hash,
                            txLink: txLink(txBuy.hash)
                        });

                        // ═══════════════════════════════════════════════════════════
                        // VERIFY BOOST AFTER NFT PURCHASE
                        // ═══════════════════════════════════════════════════════════
                        await sleep(500);
                        
                        const boostAfterNFT = await ctx.delegation.getUserBestBoost(ctx.tester.address);
                        const burnRateAfterNFT = await ctx.delegation.getBurnRateForBoost(boostAfterNFT);
                        
                        console.log(`\n      📊 NEW Boost: ${toBips(boostAfterNFT)} (${getTierName(boostAfterNFT)})`);
                        console.log(`      🔥 NEW Burn Rate: ${toBips(burnRateAfterNFT)} (was ${toBips(burnRateBeforeNFT)})`);
                        
                        // Calculate savings
                        const burnSaved = burnRateBeforeNFT - burnRateAfterNFT;
                        console.log(`      💎 Burn Saved: ${toBips(burnSaved)} per claim!`);
                        
                        // Verify boost matches expected
                        if (boostAfterNFT >= tier.boost) {
                            console.log(`      ✅ Boost verified: ${toBips(boostAfterNFT)} >= expected ${toBips(tier.boost)}`);
                            REPORT.push({
                                tier: tier.name,
                                action: "Boost Verify",
                                status: "✅ PASS",
                                actual: `${toBips(boostAfterNFT)} boost, ${toBips(burnRateAfterNFT)} burn`
                            });
                        } else {
                            console.log(`      ⚠️ Boost mismatch: ${toBips(boostAfterNFT)} < expected ${toBips(tier.boost)}`);
                            REPORT.push({
                                tier: tier.name,
                                action: "Boost Verify",
                                status: "⚠️ WARN",
                                actual: `${toBips(boostAfterNFT)} < ${toBips(tier.boost)}`
                            });
                        }
                    }
                }
            }
        } catch (e: any) {
            console.log(`      ❌ NFT Acquisition Error: ${e.message.slice(0, 80)}`);
            REPORT.push({ tier: tier.name, action: "NFT Buy", status: "❌ FAIL", details: e.message.slice(0, 50) });
        }

        // ═══════════════════════════════════════════════════════════
        // C2. RENTAL TEST (List → Verify → Withdraw)
        // Only test rental on Bronze tier to keep test short
        // ═══════════════════════════════════════════════════════════
        if (tier.boost === 1000n && acquiredTokenId !== null) {
            logSubsection("C2. RENTAL MARKET TEST");
            
            try {
                const pricePerHour = ethers.parseEther("1"); // 1 BKC per hour
                const minHours = 1n;
                const maxHours = 24n;
                
                console.log(`      📋 Listing NFT #${acquiredTokenId} for rental...`);
                console.log(`         Price: ${toEther(pricePerHour)} BKC/hour`);
                console.log(`         Duration: ${minHours}-${maxHours} hours`);
                
                // Approve NFT for RentalManager
                await ctx.nft.approve(ctx.addresses.rentalManager, acquiredTokenId);
                
                // List NFT
                const txList = await ctx.rental.listNFT(
                    acquiredTokenId,
                    pricePerHour,
                    minHours,
                    maxHours
                );
                await txList.wait();
                
                console.log(`      ✅ NFT listed for rental`);
                logTx(`Listed NFT #${acquiredTokenId}`, txList.hash);
                
                // Verify listing
                const listing = await ctx.rental.getListing(acquiredTokenId);
                const isActive = listing.isActive;
                const listingOwner = listing.owner;
                
                if (isActive && listingOwner.toLowerCase() === ctx.tester.address.toLowerCase()) {
                    console.log(`      ✅ Listing verified: owner=${listingOwner.slice(0, 10)}..., active=${isActive}`);
                    
                    REPORT.push({
                        tier: tier.name,
                        action: "Rental List",
                        status: "✅ PASS",
                        actual: `NFT #${acquiredTokenId} listed`,
                        txHash: txList.hash,
                        txLink: txLink(txList.hash)
                    });
                } else {
                    console.log(`      ⚠️ Listing verification failed`);
                    REPORT.push({
                        tier: tier.name,
                        action: "Rental List",
                        status: "⚠️ WARN",
                        actual: `Listing not found or inactive`
                    });
                }
                
                // Get rental cost preview
                try {
                    const [totalCost, platformFee, ownerReceives] = await ctx.rental.getRentalCost(acquiredTokenId, 1);
                    console.log(`      💰 Rental cost (1h): ${toEther(totalCost)} BKC (fee: ${toEther(platformFee)})`);
                } catch (e) {
                    // May not be available
                }
                
                // Withdraw NFT (cancel listing)
                const txWithdraw = await ctx.rental.withdrawNFT(acquiredTokenId);
                await txWithdraw.wait();
                
                console.log(`      ✅ NFT withdrawn from rental market`);
                logTx(`Withdrew NFT #${acquiredTokenId}`, txWithdraw.hash);
                
                // Verify we got NFT back
                const ownerAfter = await ctx.nft.ownerOf(acquiredTokenId);
                if (ownerAfter.toLowerCase() === ctx.tester.address.toLowerCase()) {
                    console.log(`      ✅ NFT returned to owner`);
                    REPORT.push({
                        tier: tier.name,
                        action: "Rental Withdraw",
                        status: "✅ PASS",
                        actual: `NFT #${acquiredTokenId} returned`,
                        txHash: txWithdraw.hash,
                        txLink: txLink(txWithdraw.hash)
                    });
                }
                
                // Note about full rental test
                console.log(`\n      ℹ️ Note: Full rental boost test requires 2 accounts`);
                console.log(`         (Renter would get boost from rented NFT on claim)`);
                
            } catch (e: any) {
                console.log(`      ❌ Rental Error: ${e.message.slice(0, 80)}`);
                REPORT.push({ tier: tier.name, action: "Rental", status: "❌ FAIL", details: e.message.slice(0, 50) });
            }
        }
    } else {
        // Baseline - just report the burn rate
        REPORT.push({
            tier: tier.name,
            action: "Boost Verify",
            status: "ℹ️ INFO",
            actual: `No NFT → ${toBips(burnRateBeforeNFT)} burn rate`
        });
    }

    // ─────────────────────────────────────────────────────────────
    // D. NOTARY (V6 signature)
    // ─────────────────────────────────────────────────────────────
    logSubsection("D. NOTARY");

    try {
        const ipfsCid = "ipfs://QmTest" + Date.now().toString();
        const description = "Test notarization from ecosystem test";
        const contentHash = ethers.keccak256(ethers.toUtf8Bytes(`Test Document ${Date.now()}`));

        console.log(`      IPFS CID: ${ipfsCid.slice(0, 30)}...`);
        console.log(`      Content Hash: ${contentHash.slice(0, 20)}...`);

        // Get fees
        const [bkcFee, ethFee] = await ctx.notary.getFee();
        console.log(`      BKC Fee: ${toEther(BigInt(bkcFee.toString()))} BKC`);
        console.log(`      ETH Fee: ${toEtherShort(BigInt(ethFee.toString()))} ETH`);

        // Approve BKC
        await ctx.bkc.approve(ctx.addresses.decentralizedNotary, BigInt(bkcFee.toString()) * 2n);

        // V6: notarize(string _ipfsCid, string _description, bytes32 _contentHash, address _operator)
        const txNotarize = await ctx.notary.notarize(
            ipfsCid,
            description,
            contentHash,
            ethers.ZeroAddress, // operator
            { value: ethFee }
        );
        const rcNotarize = await txNotarize.wait();

        logTx(`Document notarized`, txNotarize.hash);
        REPORT.push({
            tier: tier.name,
            action: "Notarize",
            status: "✅ PASS",
            actual: `${contentHash.slice(0, 20)}...`,
            txHash: txNotarize.hash,
            txLink: txLink(txNotarize.hash)
        });

        await sleep(1000);

    } catch (e: any) {
        console.log(`      ❌ Notary Error: ${e.message.slice(0, 80)}`);
        REPORT.push({ tier: tier.name, action: "Notary", status: "❌ FAIL", details: e.message.slice(0, 50) });
    }

    // ─────────────────────────────────────────────────────────────
    // E. FORTUNE POOL - 3 games each mode (1x Jackpot + 5x Cumulative)
    // FortunePool has NO NFT logic, so testing once is sufficient
    // ─────────────────────────────────────────────────────────────
    if (tier.boost > 0n) {
        // Skip Fortune test for NFT tiers - it's independent of NFTs
        console.log(`\n   ─── E. FORTUNE POOL ───`);
        console.log(`      ⏭️ Skipped (already tested in Baseline - Fortune has no NFT logic)`);
    } else {
        logSubsection("E. FORTUNE POOL (6 Games: 3x Jackpot + 3x Cumulative)");

        const GAMES_PER_MODE = 3;
        let totalGamesPlayed = 0;
        let totalGamesWon = 0;
        let totalWagered = 0n;
        let totalWon = 0n;

        try {
            const wager = TEST_CONFIG.FORTUNE_WAGER;
            
            // Get tier info
            const tierCount = Number(await ctx.fortune.activeTierCount());
            const revealDelayBlocks = Number(await ctx.fortune.revealDelay());
            
            // Get all tiers info
            const tiersInfo: { id: number; maxRange: number; multiplier: number }[] = [];
            for (let t = 1; t <= tierCount; t++) {
                const tierData = await ctx.fortune.getTier(t);
                tiersInfo.push({
                    id: t,
                    maxRange: Number(tierData[0]),
                    multiplier: Number(tierData[1]) / 10000
                });
            }
            
            console.log(`\n      📊 Fortune Pool Config:`);
            console.log(`         Wager: ${toEther(wager)} BKC per game`);
            console.log(`         Reveal Delay: ${revealDelayBlocks} blocks (~${revealDelayBlocks * 15}s)`);
            console.log(`         Active Tiers: ${tierCount}`);
            for (const t of tiersInfo) {
                console.log(`            Tier ${t.id}: Range 1-${t.maxRange}, Multiplier ${t.multiplier}x`);
            }

            // Approve BKC for all games
            await ctx.bkc.approve(ctx.addresses.fortunePool, wager * BigInt((GAMES_PER_MODE * 2) + 2));

            // Helper function to play one game
            async function playFortuneGame(
                gameNum: number, 
                isCumulative: boolean, 
                modeName: string
            ): Promise<{ played: boolean; won: boolean; wagered: bigint; prize: bigint }> {
                
                const modeEmoji = isCumulative ? "🎲" : "🎰";
                console.log(`\n      ╔══════════════════════════════════════════════════╗`);
                console.log(`      ║  ${modeEmoji} ${modeName} - GAME ${gameNum}/${GAMES_PER_MODE}                    ║`);
                console.log(`      ╚══════════════════════════════════════════════════╝`);
                
                // Generate guesses based on mode
                const guesses: bigint[] = [];
                const guessDescriptions: string[] = [];
                
                if (isCumulative) {
                    // 5x mode: one guess per tier
                    for (const t of tiersInfo) {
                        const guessValue = Math.floor(Math.random() * t.maxRange) + 1;
                        guesses.push(BigInt(guessValue));
                        guessDescriptions.push(`T${t.id}:${guessValue}/${t.maxRange}`);
                    }
                    console.log(`      🎯 Your guesses: ${guessDescriptions.join(', ')}`);
                } else {
                    // 1x mode: one guess on highest tier
                    const highestTier = tiersInfo[tiersInfo.length - 1];
                    const guessValue = Math.floor(Math.random() * highestTier.maxRange) + 1;
                    guesses.push(BigInt(guessValue));
                    console.log(`      🎯 Your guess: ${guessValue} (Tier ${highestTier.id}, range 1-${highestTier.maxRange})`);
                }
                
                const userSecret = ethers.hexlify(ethers.randomBytes(32)) as `0x${string}`;
                const commitmentHash = await ctx.fortune.generateCommitmentHash(guesses, userSecret);
                const serviceFee = await ctx.fortune.getRequiredServiceFee(isCumulative);
                
                console.log(`      💰 Service Fee: ${toEtherShort(BigInt(serviceFee.toString()))} ETH`);
                
                // Commit
                const txCommit = await ctx.fortune.commitPlay(
                    commitmentHash,
                    wager,
                    isCumulative,
                    ethers.ZeroAddress,
                    { value: serviceFee }
                );
                const rcCommit = await txCommit.wait();
                
                // Get game ID
                let gameId = 0n;
                for (const log of rcCommit?.logs || []) {
                    try {
                        const parsed = ctx.fortune.interface.parseLog(log);
                        if (parsed?.name === "GameCommitted") {
                            gameId = BigInt(parsed.args.gameId.toString());
                            break;
                        }
                    } catch {}
                }
                
                console.log(`      📝 Game #${gameId} committed`);
                
                // Wait for canReveal
                process.stdout.write(`      ⏳ Waiting...`);
                const maxWaitMs = 60000;
                const startWait = Date.now();
                let canRevealNow = false;
                
                while (!canRevealNow && (Date.now() - startWait) < maxWaitMs) {
                    await sleep(2000);
                    const statusCheck = await ctx.fortune.getCommitmentStatus(gameId);
                    canRevealNow = statusCheck[1];
                    const blocksLeft = Number(statusCheck[3]);
                    process.stdout.write(`\r      ⏳ Waiting... blocks left: ${blocksLeft}   `);
                }
                console.log('');
                
                if (!canRevealNow) {
                    console.log(`      ⚠️ Timeout waiting for reveal`);
                    return { played: false, won: false, wagered: 0n, prize: 0n };
                }
                
                // Reveal
                const txReveal = await ctx.fortune.revealPlay(gameId, guesses, userSecret);
                const rcReveal = await txReveal.wait();
                
                // Get result
                const result = await ctx.fortune.getGameResult(gameId);
                const resultGuesses = result[3].map((g: any) => Number(g));
                const resultRolls = result[4].map((r: any) => Number(r));
                const prizeWon = BigInt(result[2].toString());
                const matchCount = Number(result[6]);
                
                // Display results
                console.log(`      ╭──────────────────────────────────────────────────╮`);
                if (isCumulative) {
                    for (let i = 0; i < resultGuesses.length; i++) {
                        const match = resultGuesses[i] === resultRolls[i] ? "✅" : "❌";
                        console.log(`      │  Tier ${i+1}: Guess ${String(resultGuesses[i]).padStart(3)} │ Roll ${String(resultRolls[i]).padStart(3)} │ ${match}  │`);
                    }
                } else {
                    const match = resultGuesses[0] === resultRolls[0] ? "✅" : "❌";
                    console.log(`      │  YOUR GUESS:     ${String(resultGuesses[0]).padStart(3)}                          │`);
                    console.log(`      │  DRAWN NUMBER:   ${String(resultRolls[0]).padStart(3)}                          │`);
                    console.log(`      │  RESULT:         ${match}                            │`);
                }
                console.log(`      ├──────────────────────────────────────────────────┤`);
                
                if (matchCount > 0) {
                    console.log(`      │  🎉 ${matchCount} MATCH${matchCount > 1 ? 'ES' : ''}! Won ${toEther(prizeWon).padStart(12)} BKC     │`);
                } else {
                    console.log(`      │  😢 NO MATCHES - Better luck next time!          │`);
                }
                console.log(`      ╰──────────────────────────────────────────────────╯`);
                console.log(`         🔗 ${txLink(txReveal.hash)}`);
                
                REPORT.push({
                    tier: tier.name,
                    action: `Fortune ${modeName} #${gameNum}`,
                    status: "✅ PASS",
                    actual: `${matchCount} match${matchCount !== 1 ? 'es' : ''}, ${matchCount > 0 ? 'Won ' + toEther(prizeWon) + ' BKC' : 'No win'}`,
                    txHash: txReveal.hash,
                    txLink: txLink(txReveal.hash)
                });
                
                return { 
                    played: true, 
                    won: matchCount > 0, 
                    wagered: wager, 
                    prize: prizeWon 
                };
            }

            // ═══════════════════════════════════════════════════════════
            // MODE 1: JACKPOT (1x) - 3 Games
            // ═══════════════════════════════════════════════════════════
            console.log(`\n      ${"═".repeat(54)}`);
            console.log(`      ║  🎰 MODE 1x (JACKPOT) - 3 GAMES                      ║`);
            console.log(`      ║  1 guess on highest tier, 1x service fee            ║`);
            console.log(`      ${"═".repeat(54)}`);
            
            for (let i = 1; i <= GAMES_PER_MODE; i++) {
                const result = await playFortuneGame(i, false, "1x Jackpot");
                if (result.played) {
                    totalGamesPlayed++;
                    totalWagered += result.wagered;
                    if (result.won) {
                        totalGamesWon++;
                        totalWon += result.prize;
                    }
                }
                await sleep(500);
            }

            // ═══════════════════════════════════════════════════════════
            // MODE 2: CUMULATIVE (5x) - 3 Games
            // ═══════════════════════════════════════════════════════════
            console.log(`\n      ${"═".repeat(54)}`);
            console.log(`      ║  🎲 MODE 5x (CUMULATIVE) - 3 GAMES                   ║`);
            console.log(`      ║  ${tierCount} guesses (1 per tier), ${tierCount}x service fee               ║`);
            console.log(`      ${"═".repeat(54)}`);
            
            for (let i = 1; i <= GAMES_PER_MODE; i++) {
                const result = await playFortuneGame(i, true, "5x Cumulative");
                if (result.played) {
                    totalGamesPlayed++;
                    totalWagered += result.wagered;
                    if (result.won) {
                        totalGamesWon++;
                        totalWon += result.prize;
                    }
                }
                await sleep(500);
            }

            // ═══════════════════════════════════════════════════════════
            // FINAL SUMMARY
            // ═══════════════════════════════════════════════════════════
            console.log(`\n      ╔══════════════════════════════════════════════════╗`);
            console.log(`      ║           📊 FORTUNE POOL SUMMARY                 ║`);
            console.log(`      ╠══════════════════════════════════════════════════╣`);
            console.log(`      ║  Total Games:    ${String(totalGamesPlayed).padStart(2)}/6                           ║`);
            console.log(`      ║  Games Won:      ${String(totalGamesWon).padStart(2)}                              ║`);
            console.log(`      ║  Win Rate:       ${((totalGamesWon / totalGamesPlayed) * 100).toFixed(1).padStart(5)}%                        ║`);
            console.log(`      ╠══════════════════════════════════════════════════╣`);
            console.log(`      ║  Total Wagered:  ${toEther(totalWagered).padStart(12)} BKC            ║`);
            console.log(`      ║  Total Won:      ${toEther(totalWon).padStart(12)} BKC            ║`);
            const profit = totalWon - totalWagered;
            const profitStr = profit >= 0n ? `+${toEther(profit)}` : toEther(profit);
            console.log(`      ║  Net Result:     ${profitStr.padStart(12)} BKC            ║`);
            console.log(`      ╚══════════════════════════════════════════════════╝`);

        } catch (e: any) {
            console.log(`      ❌ Fortune Error: ${e.message.slice(0, 80)}`);
            REPORT.push({ tier: tier.name, action: "Fortune", status: "❌ FAIL", details: e.message.slice(0, 50) });
        }
    } // End of else (Fortune only runs on Baseline)

    // ─────────────────────────────────────────────────────────────
    // F. CLEANUP
    // ─────────────────────────────────────────────────────────────
    logSubsection("F. CLEANUP");

    try {
        // Force Unstake delegations
        const delegations = await ctx.delegation.getDelegationsOf(ctx.tester.address);
        for (let i = delegations.length - 1; i >= 0; i--) {
            try {
                // V6: forceUnstake(uint256 _delegationIndex, address _operator)
                const txUnstake = await ctx.delegation.forceUnstake(BigInt(i), ethers.ZeroAddress);
                await txUnstake.wait();
                console.log(`      🧹 Force unstaked delegation #${i}`);
            } catch (e: any) {
                console.log(`      ⚠️ Could not unstake #${i}: ${e.message.slice(0, 30)}`);
            }
        }

        // Sell NFT back if acquired
        if (acquiredTokenId !== null && poolAddress !== ethers.ZeroAddress) {
            try {
                const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, ctx.tester);
                await ctx.nft.approve(poolAddress, acquiredTokenId);
                
                const sellEthFee = await pool.sellEthFee();
                const txSell = await pool.sellNFT(acquiredTokenId, 0n, ethers.ZeroAddress, { value: sellEthFee });
                await txSell.wait();
                
                console.log(`      🧹 Sold NFT #${acquiredTokenId}`);
                logTx(`Sold NFT #${acquiredTokenId}`, txSell.hash);
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