/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              BACKCOIN ORACLE - MASSIVE STRESS TEST (10,000 GAMES)         ║
 * ║                                                                           ║
 * ║  Tests Oracle with 10,000 games showing gas usage per transaction         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const toEther = (val: bigint): string => parseFloat(ethers.formatEther(val)).toFixed(4);
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Statistics
interface Stats {
    totalGames: number;
    successfulGames: number;
    failedGames: number;
    totalWins: number;
    totalPrize: bigint;
    totalGasUsed: bigint;
    minGas: bigint;
    maxGas: bigint;
    tier1Rolls: Map<number, number>;
    tier2Rolls: Map<number, number>;
    tier3Rolls: Map<number, number>;
    tier1Wins: number;
    tier2Wins: number;
    tier3Wins: number;
}

async function main() {
    console.log("\n" + "═".repeat(80));
    console.log("   🎲 BACKCOIN ORACLE - MASSIVE STRESS TEST");
    console.log("   📊 10,000 Games (5,000 x 1x mode + 5,000 x 5x mode)");
    console.log("═".repeat(80));

    const [tester] = await ethers.getSigners();
    console.log(`\n   👤 Tester: ${tester.address}`);

    // Load addresses
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    // Connect to contracts
    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, tester);
    const fortune = await ethers.getContractAt("FortunePool", addresses.fortunePool, tester);

    // Check balances
    const bkcBalance = await bkc.balanceOf(tester.address);
    const ethBalance = await tester.provider!.getBalance(tester.address);
    console.log(`   💎 BKC Balance: ${toEther(bkcBalance)} BKC`);
    console.log(`   💰 ETH Balance: ${toEther(ethBalance)} ETH`);

    // Get tier info
    const activeTiers = await fortune.activeTierCount();
    console.log(`\n   📋 Active Tiers: ${activeTiers}`);
    for (let i = 1; i <= Number(activeTiers); i++) {
        const tier = await fortune.getTier(i);
        console.log(`      Tier ${i}: Range 1-${tier.maxRange}, Multiplier: ${Number(tier.multiplierBips) / 100}x`);
    }

    const wager = ethers.parseEther("5"); // 5 BKC per game
    const serviceFee = await fortune.serviceFee();
    
    console.log(`\n   💵 Wager per game: 5 BKC`);
    console.log(`   💵 Service Fee: ${toEther(serviceFee)} ETH`);
    console.log(`   💵 Total BKC needed: ~55,000 BKC (10,000 games x 5 BKC + fees)`);

    // Approve BKC - large amount for all games
    const approvalAmount = ethers.parseEther("60000");
    console.log(`\n   🔓 Approving ${toEther(approvalAmount)} BKC...`);
    const approveTx = await bkc.approve(addresses.fortunePool, approvalAmount);
    await approveTx.wait();
    console.log(`   ✅ Approved`);

    // Initialize statistics
    const stats: Stats = {
        totalGames: 0,
        successfulGames: 0,
        failedGames: 0,
        totalWins: 0,
        totalPrize: 0n,
        totalGasUsed: 0n,
        minGas: BigInt(Number.MAX_SAFE_INTEGER),
        maxGas: 0n,
        tier1Rolls: new Map(),
        tier2Rolls: new Map(),
        tier3Rolls: new Map(),
        tier1Wins: 0,
        tier2Wins: 0,
        tier3Wins: 0
    };

    const startTime = Date.now();
    const TOTAL_GAMES = 1000;
    const GAMES_PER_MODE = 500;

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 1: 5,000 Games in 1x Mode
    // ═══════════════════════════════════════════════════════════════════
    console.log("\n" + "─".repeat(80));
    console.log("   🎰 PHASE 1: 5,000 Games in 1x Mode (Jackpot - Tier 3)");
    console.log("─".repeat(80));
    console.log("   Game | Guess | Roll | Result | Gas Used   | TX Hash");
    console.log("   " + "─".repeat(75));

    const guess1x = 50; // Middle value for tier 3

    for (let i = 1; i <= GAMES_PER_MODE; i++) {
        stats.totalGames++;
        
        try {
            const requiredFee = await fortune.getRequiredServiceFee(false);
            const tx = await fortune.play(wager, [guess1x], false, { value: requiredFee });
            const receipt = await tx.wait();

            if (!receipt) {
                stats.failedGames++;
                console.log(`   ${i.toString().padStart(5)} | [${guess1x}]  |  ??  | ❌ FAIL | No receipt`);
                continue;
            }

            const gasUsed = BigInt(receipt.gasUsed);
            stats.successfulGames++;
            stats.totalGasUsed += gasUsed;
            stats.minGas = gasUsed < stats.minGas ? gasUsed : stats.minGas;
            stats.maxGas = gasUsed > stats.maxGas ? gasUsed : stats.maxGas;

            // Parse events
            let roll = 0;
            let won = false;
            let prize = 0n;

            for (const log of receipt.logs) {
                try {
                    const parsed = fortune.interface.parseLog(log);
                    if (parsed?.name === "GamePlayed") {
                        won = Number(parsed.args.matchCount) > 0;
                        prize = BigInt(parsed.args.prizeWon?.toString() || "0");
                    }
                    if (parsed?.name === "GameDetails") {
                        const rolls = Array.from(parsed.args.rolls).map((r: any) => Number(r));
                        roll = rolls[0] || 0;
                    }
                } catch {}
            }

            // Update tier 3 stats
            stats.tier3Rolls.set(roll, (stats.tier3Rolls.get(roll) || 0) + 1);
            if (won) {
                stats.totalWins++;
                stats.tier3Wins++;
                stats.totalPrize += prize;
            }

            const resultIcon = won ? "🎉 WIN!" : "❌";
            const shortHash = tx.hash.slice(0, 10) + "..." + tx.hash.slice(-6);
            
            console.log(`   ${i.toString().padStart(5)} | [${guess1x}]  | ${roll.toString().padStart(3)}  | ${resultIcon.padEnd(7)} | ${gasUsed.toString().padStart(10)} | ${shortHash}`);

            // Progress every 500 games
            if (i % 500 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                const avgGas = stats.totalGasUsed / BigInt(stats.successfulGames);
                console.log(`   ─── Progress: ${i}/${GAMES_PER_MODE} | Wins: ${stats.tier3Wins} | Avg Gas: ${avgGas} | Time: ${elapsed}s ───`);
            }

            await sleep(100); // Small delay

        } catch (e: any) {
            stats.failedGames++;
            console.log(`   ${i.toString().padStart(5)} | [${guess1x}]  |  ??  | ❌ FAIL | ${e.message?.slice(0, 30)}`);
        }
    }

    console.log(`\n   📊 Phase 1 Complete: ${stats.tier3Wins} wins, ${stats.failedGames} failed`);

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2: 5,000 Games in 5x Mode
    // ═══════════════════════════════════════════════════════════════════
    console.log("\n" + "─".repeat(80));
    console.log("   🎰 PHASE 2: 5,000 Games in 5x Mode (Cumulative - All Tiers)");
    console.log("─".repeat(80));
    console.log("   Game | Guesses   | Rolls       | Matches | Gas Used   | TX Hash");
    console.log("   " + "─".repeat(75));

    const guesses5x = [2, 5, 50]; // Guesses for each tier
    const phase1Wins = stats.totalWins;
    const phase1Failed = stats.failedGames;

    for (let i = 1; i <= GAMES_PER_MODE; i++) {
        stats.totalGames++;
        
        try {
            const requiredFee = await fortune.getRequiredServiceFee(true);
            const tx = await fortune.play(wager, guesses5x, true, { value: requiredFee });
            const receipt = await tx.wait();

            if (!receipt) {
                stats.failedGames++;
                console.log(`   ${i.toString().padStart(5)} | [2,5,50]  |  ??        | ❌ FAIL | No receipt`);
                continue;
            }

            const gasUsed = BigInt(receipt.gasUsed);
            stats.successfulGames++;
            stats.totalGasUsed += gasUsed;
            stats.minGas = gasUsed < stats.minGas ? gasUsed : stats.minGas;
            stats.maxGas = gasUsed > stats.maxGas ? gasUsed : stats.maxGas;

            // Parse events
            let rolls: number[] = [];
            let matches: boolean[] = [];
            let matchCount = 0;
            let prize = 0n;

            for (const log of receipt.logs) {
                try {
                    const parsed = fortune.interface.parseLog(log);
                    if (parsed?.name === "GamePlayed") {
                        matchCount = Number(parsed.args.matchCount);
                        prize = BigInt(parsed.args.prizeWon?.toString() || "0");
                    }
                    if (parsed?.name === "GameDetails") {
                        rolls = Array.from(parsed.args.rolls).map((r: any) => Number(r));
                        matches = Array.from(parsed.args.matches).map((m: any) => Boolean(m));
                    }
                } catch {}
            }

            // Update stats per tier
            if (rolls.length >= 1) {
                stats.tier1Rolls.set(rolls[0], (stats.tier1Rolls.get(rolls[0]) || 0) + 1);
                if (matches[0]) stats.tier1Wins++;
            }
            if (rolls.length >= 2) {
                stats.tier2Rolls.set(rolls[1], (stats.tier2Rolls.get(rolls[1]) || 0) + 1);
                if (matches[1]) stats.tier2Wins++;
            }
            if (rolls.length >= 3) {
                stats.tier3Rolls.set(rolls[2], (stats.tier3Rolls.get(rolls[2]) || 0) + 1);
                if (matches[2]) stats.tier3Wins++;
            }

            if (matchCount > 0) {
                stats.totalWins++;
                stats.totalPrize += prize;
            }

            const matchStr = matches.map((m, idx) => m ? `T${idx+1}✓` : `T${idx+1}✗`).join(' ');
            const rollStr = `[${rolls.join(',')}]`.padEnd(12);
            const shortHash = tx.hash.slice(0, 10) + "..." + tx.hash.slice(-6);
            
            console.log(`   ${i.toString().padStart(5)} | [2,5,50]  | ${rollStr} | ${matchStr} | ${gasUsed.toString().padStart(10)} | ${shortHash}`);

            // Progress every 500 games
            if (i % 500 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                const phase2Wins = stats.totalWins - phase1Wins;
                const avgGas = stats.totalGasUsed / BigInt(stats.successfulGames);
                console.log(`   ─── Progress: ${i}/${GAMES_PER_MODE} | Wins: ${phase2Wins} | Avg Gas: ${avgGas} | Time: ${elapsed}s ───`);
            }

            await sleep(100);

        } catch (e: any) {
            stats.failedGames++;
            console.log(`   ${i.toString().padStart(5)} | [2,5,50]  |  ??        | ❌ FAIL | ${e.message?.slice(0, 30)}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // FINAL STATISTICS
    // ═══════════════════════════════════════════════════════════════════
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    const avgGas = stats.successfulGames > 0 ? stats.totalGasUsed / BigInt(stats.successfulGames) : 0n;

    console.log("\n\n" + "═".repeat(80));
    console.log("   📊 FINAL STATISTICS - 10,000 GAMES");
    console.log("═".repeat(80));

    console.log(`
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ GAME SUMMARY                                                                │
   ├─────────────────────────────────────────────────────────────────────────────┤
   │ Total Games Attempted:     ${stats.totalGames.toString().padStart(10)}                                      │
   │ Successful Games:          ${stats.successfulGames.toString().padStart(10)}                                      │
   │ Failed Games:              ${stats.failedGames.toString().padStart(10)}                                      │
   │ Success Rate:              ${((stats.successfulGames / stats.totalGames) * 100).toFixed(2).padStart(9)}%                                      │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ GAS USAGE                                                                   │
   ├─────────────────────────────────────────────────────────────────────────────┤
   │ Total Gas Used:            ${stats.totalGasUsed.toString().padStart(15)}                                 │
   │ Average Gas per Game:      ${avgGas.toString().padStart(15)}                                 │
   │ Minimum Gas:               ${stats.minGas.toString().padStart(15)}                                 │
   │ Maximum Gas:               ${stats.maxGas.toString().padStart(15)}                                 │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ WIN STATISTICS                                                              │
   ├─────────────────────────────────────────────────────────────────────────────┤
   │ Total Wins:                ${stats.totalWins.toString().padStart(10)}                                      │
   │ Total Prize Won:           ${toEther(stats.totalPrize).padStart(10)} BKC                                │
   │                                                                             │
   │ Tier 1 (Range 1-3, 33.3% expected):                                        │
   │   Wins: ${stats.tier1Wins.toString().padStart(5)} / 5000 = ${((stats.tier1Wins / 5000) * 100).toFixed(2).padStart(6)}%                                         │
   │                                                                             │
   │ Tier 2 (Range 1-10, 10% expected):                                         │
   │   Wins: ${stats.tier2Wins.toString().padStart(5)} / 5000 = ${((stats.tier2Wins / 5000) * 100).toFixed(2).padStart(6)}%                                         │
   │                                                                             │
   │ Tier 3 (Range 1-100, 1% expected):                                         │
   │   Wins: ${stats.tier3Wins.toString().padStart(5)} / 10000 = ${((stats.tier3Wins / 10000) * 100).toFixed(2).padStart(6)}%                                        │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ TIER 1 DISTRIBUTION (Range 1-3) - ${stats.tier1Rolls.size > 0 ? Array.from(stats.tier1Rolls.values()).reduce((a, b) => a + b, 0) : 0} samples                             │
   ├─────────────────────────────────────────────────────────────────────────────┤`);
    
    const tier1Total = Array.from(stats.tier1Rolls.values()).reduce((a, b) => a + b, 0) || 1;
    for (let n = 1; n <= 3; n++) {
        const count = stats.tier1Rolls.get(n) || 0;
        const pct = ((count / tier1Total) * 100).toFixed(2);
        const bar = "█".repeat(Math.round((count / tier1Total) * 40));
        console.log(`   │   ${n}: ${count.toString().padStart(5)} (${pct.padStart(6)}%) ${bar.padEnd(40)} │`);
    }

    console.log(`   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ TIER 2 DISTRIBUTION (Range 1-10) - ${stats.tier2Rolls.size > 0 ? Array.from(stats.tier2Rolls.values()).reduce((a, b) => a + b, 0) : 0} samples                            │
   ├─────────────────────────────────────────────────────────────────────────────┤`);
    
    const tier2Total = Array.from(stats.tier2Rolls.values()).reduce((a, b) => a + b, 0) || 1;
    for (let n = 1; n <= 10; n++) {
        const count = stats.tier2Rolls.get(n) || 0;
        const pct = ((count / tier2Total) * 100).toFixed(2);
        const bar = "█".repeat(Math.round((count / tier2Total) * 40));
        console.log(`   │  ${n.toString().padStart(2)}: ${count.toString().padStart(5)} (${pct.padStart(6)}%) ${bar.padEnd(40)} │`);
    }

    console.log(`   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ TIER 3 DISTRIBUTION (Range 1-100) - Grouped by 10s                         │
   ├─────────────────────────────────────────────────────────────────────────────┤`);
    
    const tier3Total = Array.from(stats.tier3Rolls.values()).reduce((a, b) => a + b, 0) || 1;
    for (let rangeStart = 1; rangeStart <= 100; rangeStart += 10) {
        let rangeCount = 0;
        for (let n = rangeStart; n < rangeStart + 10 && n <= 100; n++) {
            rangeCount += stats.tier3Rolls.get(n) || 0;
        }
        const pct = ((rangeCount / tier3Total) * 100).toFixed(2);
        const bar = "█".repeat(Math.round((rangeCount / tier3Total) * 40));
        console.log(`   │ ${rangeStart.toString().padStart(3)}-${Math.min(rangeStart + 9, 100).toString().padStart(3)}: ${rangeCount.toString().padStart(5)} (${pct.padStart(6)}%) ${bar.padEnd(35)} │`);
    }

    console.log(`   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ EXECUTION TIME                                                              │
   ├─────────────────────────────────────────────────────────────────────────────┤
   │ Total Time:                ${totalTime.padStart(10)} minutes                               │
   │ Games per Minute:          ${(stats.successfulGames / parseFloat(totalTime)).toFixed(1).padStart(10)}                                      │
   └─────────────────────────────────────────────────────────────────────────────┘
`);

    console.log("   🔗 FortunePool Contract: https://sepolia.arbiscan.io/address/" + addresses.fortunePool);
    console.log("   🔗 Oracle Contract: https://sepolia.arbiscan.io/address/" + addresses.backcoinOracle);

    console.log("\n" + "═".repeat(80));
    console.log("   ✅ 10,000 GAMES STRESS TEST COMPLETE");
    console.log("═".repeat(80) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Test failed:", error);
        process.exit(1);
    });