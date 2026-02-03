/**
 * 🔬 FORTUNE POOL DIAGNOSTIC SCRIPT
 * 
 * Testa todas as funcionalidades do FortunePool com logs detalhados
 * para identificar o problema do TooEarlyToReveal
 */

import { ethers } from "hardhat";
import * as fs from "fs";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const toEther = (wei: bigint) => ethers.formatEther(wei);

function loadAddresses(): Record<string, string> {
    // Try multiple possible filenames
    const possiblePaths = [
        "./deployment-addresses.json",
        "./deployed-addresses.json",
        "./deployedAddresses.json", 
        "./addresses.json",
        "./contracts.json"
    ];
    
    for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
            console.log(`   Loading addresses from: ${path}`);
            return JSON.parse(fs.readFileSync(path, "utf8"));
        }
    }
    
    // If not found, list files in current directory
    const files = fs.readdirSync("./").filter(f => f.endsWith(".json"));
    throw new Error(`Address file not found. Available JSON files: ${files.join(", ")}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
    console.log("\n" + "═".repeat(80));
    console.log("   🔬 FORTUNE POOL DIAGNOSTIC");
    console.log("═".repeat(80));

    const [signer] = await ethers.getSigners();
    const addresses = loadAddresses();
    
    console.log(`\n   Signer: ${signer.address}`);
    console.log(`   FortunePool: ${addresses.fortunePool}`);

    // Connect to contracts
    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken);
    const fortune = await ethers.getContractAt("FortunePool", addresses.fortunePool);

    // ═══════════════════════════════════════════════════════════════════════
    // 1. CHECK CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n" + "─".repeat(80));
    console.log("   1. CONFIGURATION CHECK");
    console.log("─".repeat(80));

    const revealDelay = await fortune.revealDelay();
    const revealWindow = await fortune.revealWindow();
    const serviceFee = await fortune.serviceFee();
    const prizePool = await fortune.prizePoolBalance();
    const tierCount = await fortune.activeTierCount();

    console.log(`   Reveal Delay: ${revealDelay} blocks`);
    console.log(`   Reveal Window: ${revealWindow} blocks`);
    console.log(`   Service Fee: ${toEther(serviceFee)} ETH`);
    console.log(`   Prize Pool: ${toEther(prizePool)} BKC`);
    console.log(`   Active Tiers: ${tierCount}`);

    // Get tier details
    // getTier returns: (maxRange, multiplierBips, active)
    for (let i = 1; i <= Number(tierCount); i++) {
        const tier = await fortune.getTier(i);
        const maxRange = tier[0];
        const multiplierBips = tier[1];
        const active = tier[2];
        console.log(`   Tier ${i}: range=1-${maxRange}, multiplier=${multiplierBips} bips, active=${active}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. BLOCK NUMBER ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n" + "─".repeat(80));
    console.log("   2. BLOCK NUMBER ANALYSIS (Arbitrum L1 vs L2)");
    console.log("─".repeat(80));

    // Get block from provider (L2 block)
    const providerBlock = await signer.provider!.getBlockNumber();
    console.log(`   Provider block (L2): ${providerBlock}`);

    // Try to get ArbOS block number via eth_call
    // On Arbitrum, block.number in contracts returns ArbOS block, not L2 block
    try {
        // Call a view function and check the block
        const blockInfo = await signer.provider!.getBlock("latest");
        console.log(`   Latest block timestamp: ${blockInfo?.timestamp}`);
        console.log(`   Latest block number: ${blockInfo?.number}`);
    } catch (e: any) {
        console.log(`   Could not get block info: ${e.message?.slice(0, 50)}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. COMMIT A NEW GAME
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n" + "─".repeat(80));
    console.log("   3. COMMIT NEW GAME");
    console.log("─".repeat(80));

    const wager = ethers.parseEther("10");
    // getTier returns: (maxRange, multiplierBips, active)
    const jackpotTier = await fortune.getTier(tierCount);
    const maxRange = Number(jackpotTier[0]); // maxRange is index 0
    const guessValue = Math.floor(Math.random() * maxRange) + 1;
    const guesses = [BigInt(guessValue)];
    const userSecret = ethers.hexlify(ethers.randomBytes(32)) as `0x${string}`;
    const isCumulative = false;

    console.log(`   Wager: ${toEther(wager)} BKC`);
    console.log(`   Guess: ${guessValue} (range 1-${maxRange})`);
    console.log(`   Mode: ${isCumulative ? 'Cumulative' : 'Jackpot'}`);
    console.log(`   Secret: ${userSecret.slice(0, 18)}...`);

    // Generate commitment hash
    const commitmentHash = await fortune.generateCommitmentHash(guesses, userSecret);
    console.log(`   Commitment Hash: ${commitmentHash}`);

    // Approve BKC
    console.log(`\n   Approving BKC...`);
    await bkc.approve(addresses.fortunePool, wager * 2n);

    // Get required fee
    const requiredFee = await fortune.getRequiredServiceFee(isCumulative);
    console.log(`   Required ETH fee: ${toEther(requiredFee)} ETH`);

    // Record block BEFORE commit
    const blockBeforeCommit = await signer.provider!.getBlockNumber();
    console.log(`\n   Block BEFORE commit (provider): ${blockBeforeCommit}`);

    // Commit
    console.log(`   Committing...`);
    const txCommit = await fortune.commitPlay(
        commitmentHash,
        wager,
        isCumulative,
        ethers.ZeroAddress,
        { value: requiredFee }
    );
    const rcCommit = await txCommit.wait();

    // Record block AFTER commit
    const blockAfterCommit = await signer.provider!.getBlockNumber();
    const receiptBlock = rcCommit?.blockNumber || 0;

    console.log(`   ✅ Commit TX: ${txCommit.hash}`);
    console.log(`   Receipt block (from receipt): ${receiptBlock}`);
    console.log(`   Block AFTER commit (provider): ${blockAfterCommit}`);

    // Get game ID from event
    let gameId = 0n;
    for (const log of rcCommit?.logs || []) {
        try {
            const parsed = fortune.interface.parseLog(log);
            if (parsed?.name === "GameCommitted") {
                gameId = BigInt(parsed.args.gameId.toString());
                console.log(`   Game ID: ${gameId}`);
                break;
            }
        } catch {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. ANALYZE STORED COMMITMENT
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n" + "─".repeat(80));
    console.log("   4. STORED COMMITMENT ANALYSIS");
    console.log("─".repeat(80));

    // Get commitment data
    const commitment = await fortune.getCommitment(gameId);
    const storedCommitBlock = Number(commitment[1]); // commitBlock is index 1

    console.log(`   Stored commitBlock: ${storedCommitBlock}`);
    console.log(`   Receipt block: ${receiptBlock}`);
    console.log(`   Difference: ${receiptBlock - storedCommitBlock}`);

    if (storedCommitBlock !== receiptBlock) {
        console.log(`\n   ⚠️ MISMATCH DETECTED!`);
        console.log(`   The contract is using a DIFFERENT block number than the provider.`);
        console.log(`   This is likely the ArbOS block number vs L2 block number issue.`);
        console.log(`\n   On Arbitrum:`);
        console.log(`   - Provider returns L2 block number (~238M)`);
        console.log(`   - Contract's block.number returns ArbOS block (~10M)`);
    }

    // Calculate required reveal block based on STORED commitBlock
    const requiredRevealBlock = storedCommitBlock + Number(revealDelay);
    const expiryBlock = storedCommitBlock + Number(revealWindow);

    console.log(`\n   Required reveal block (stored + delay): ${requiredRevealBlock}`);
    console.log(`   Expiry block (stored + window): ${expiryBlock}`);

    // ═══════════════════════════════════════════════════════════════════════
    // 5. MONITOR BLOCK PROGRESSION
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n" + "─".repeat(80));
    console.log("   5. MONITORING BLOCK PROGRESSION");
    console.log("─".repeat(80));

    console.log(`\n   Waiting for blocks to pass...`);
    console.log(`   Target: ArbOS block >= ${requiredRevealBlock}`);
    console.log(`   Current stored commitBlock: ${storedCommitBlock}`);
    console.log(`   Need ${Number(revealDelay)} more ArbOS blocks\n`);

    // Monitor both provider block and commitment status
    for (let i = 0; i < 60; i++) {
        const providerBlk = await signer.provider!.getBlockNumber();
        
        // Get commitment status which tells us the contract's view
        const status = await fortune.getCommitmentStatus(gameId);
        const canReveal = status[1];
        const isExpired = status[2];
        const blocksUntilReveal = Number(status[3]);
        const blocksUntilExpiry = Number(status[4]);

        console.log(`   [${i}] Provider: ${providerBlk} | canReveal: ${canReveal} | blocksUntil: ${blocksUntilReveal} | expired: ${isExpired}`);

        if (canReveal) {
            console.log(`\n   ✅ canReveal is TRUE! Breaking out of loop.`);
            break;
        }

        if (isExpired) {
            console.log(`\n   ❌ Commitment EXPIRED before we could reveal!`);
            break;
        }

        await sleep(500); // Wait 500ms between checks
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. ATTEMPT REVEAL
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n" + "─".repeat(80));
    console.log("   6. ATTEMPTING REVEAL");
    console.log("─".repeat(80));

    // Final status check
    const finalStatus = await fortune.getCommitmentStatus(gameId);
    const finalCanReveal = finalStatus[1];
    const finalIsExpired = finalStatus[2];

    console.log(`   Final status: canReveal=${finalCanReveal}, isExpired=${finalIsExpired}`);

    if (!finalCanReveal) {
        console.log(`\n   ⚠️ canReveal is still FALSE. Attempting reveal anyway to see error...`);
    }

    // Try static call first
    console.log(`\n   Testing with staticCall...`);
    try {
        await fortune.revealPlay.staticCall(gameId, guesses, userSecret);
        console.log(`   ✅ staticCall succeeded!`);
    } catch (e: any) {
        const errData = e.data || e.error?.data;
        console.log(`   ❌ staticCall failed`);
        console.log(`      Reason: ${e.reason || e.message?.slice(0, 80)}`);
        if (errData) {
            console.log(`      Error data: ${errData}`);
            const selector = errData.slice(0, 10);
            console.log(`      Selector: ${selector}`);
            
            // Known selectors
            const errors: Record<string, string> = {
                '0x5ef6c0c7': 'TooEarlyToReveal',
                '0x0f27149e': 'TooLateToReveal',
                '0xac51f49f': 'HashMismatch',
            };
            if (errors[selector]) {
                console.log(`      Known error: ${errors[selector]}`);
            }
        }
    }

    // Try actual transaction
    console.log(`\n   Sending actual reveal transaction...`);
    try {
        const txReveal = await fortune.revealPlay(gameId, guesses, userSecret);
        const rcReveal = await txReveal.wait();

        console.log(`   ✅ Reveal succeeded!`);
        console.log(`   TX: ${txReveal.hash}`);

        // Parse result
        for (const log of rcReveal?.logs || []) {
            try {
                const parsed = fortune.interface.parseLog(log);
                if (parsed?.name === "GameRevealed") {
                    const prizeWon = BigInt(parsed.args.prizeWon?.toString() || "0");
                    const matchCount = Number(parsed.args.matchCount?.toString() || "0");
                    console.log(`   Result: ${matchCount} matches, ${toEther(prizeWon)} BKC won`);
                }
            } catch {}
        }
    } catch (e: any) {
        console.log(`   ❌ Reveal failed`);
        console.log(`      Reason: ${e.reason || e.message?.slice(0, 100)}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7. ARBOS BLOCK SPEED MEASUREMENT
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n" + "─".repeat(80));
    console.log("   7. ARBOS BLOCK SPEED MEASUREMENT");
    console.log("─".repeat(80));

    // Check if game is still pending
    const commitment2 = await fortune.getCommitment(gameId);
    const status2 = commitment2[3]; // status enum
    
    // Status: 0=NONE, 1=COMMITTED, 2=REVEALED, 3=EXPIRED
    if (Number(status2) === 1) { // Still COMMITTED
        console.log(`   Game still in COMMITTED state.`);
        console.log(`   Measuring ArbOS block progression speed...\n`);
        
        // Get initial blocksUntilReveal
        const initialStatus = await fortune.getCommitmentStatus(gameId);
        const initialBlocksLeft = Number(initialStatus[3]);
        const startTime = Date.now();
        
        console.log(`   Initial blocksUntilReveal: ${initialBlocksLeft}`);
        console.log(`   Monitoring for up to 3 minutes...\n`);
        
        let lastBlocksLeft = initialBlocksLeft;
        let blockDecreaseCount = 0;
        
        // Monitor for up to 3 minutes
        for (let i = 0; i < 180; i++) {
            await sleep(1000); // 1 second intervals
            
            const statusCheck = await fortune.getCommitmentStatus(gameId);
            const canRevealNow = statusCheck[1];
            const isExpiredNow = statusCheck[2];
            const blocksLeft = Number(statusCheck[3]);
            
            // Check if blocks decreased
            if (blocksLeft < lastBlocksLeft) {
                const elapsed = (Date.now() - startTime) / 1000;
                const blocksDecreased = lastBlocksLeft - blocksLeft;
                blockDecreaseCount += blocksDecreased;
                console.log(`   ⬇️ [${elapsed.toFixed(1)}s] Blocks decreased: ${lastBlocksLeft} → ${blocksLeft} (-${blocksDecreased})`);
                lastBlocksLeft = blocksLeft;
            }
            
            // Log every 10 seconds
            if (i > 0 && i % 10 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const providerBlk = await signer.provider!.getBlockNumber();
                console.log(`   [${elapsed.toFixed(0)}s] blocksUntil: ${blocksLeft}, canReveal: ${canRevealNow}, provider: ${providerBlk}`);
            }

            if (canRevealNow) {
                const elapsed = (Date.now() - startTime) / 1000;
                console.log(`\n   ✅ canReveal is TRUE after ${elapsed.toFixed(1)} seconds!`);
                console.log(`   ArbOS blocks needed: ${initialBlocksLeft}`);
                console.log(`   Time per ArbOS block: ${(elapsed / initialBlocksLeft).toFixed(2)} seconds`);
                
                // Attempt reveal
                console.log(`\n   Attempting reveal...`);
                try {
                    const tx = await fortune.revealPlay(gameId, guesses, userSecret);
                    const rc = await tx.wait();
                    console.log(`   ✅ REVEAL SUCCEEDED!`);
                    console.log(`   TX: ${tx.hash}`);
                    
                    for (const log of rc?.logs || []) {
                        try {
                            const parsed = fortune.interface.parseLog(log);
                            if (parsed?.name === "GameRevealed") {
                                const prizeWon = BigInt(parsed.args.prizeWon?.toString() || "0");
                                const matchCount = Number(parsed.args.matchCount?.toString() || "0");
                                console.log(`   Result: ${matchCount} matches, ${toEther(prizeWon)} BKC won`);
                            }
                        } catch {}
                    }
                } catch (e: any) {
                    console.log(`   ❌ Reveal failed: ${e.reason || e.message?.slice(0, 80)}`);
                }
                break;
            }

            if (isExpiredNow) {
                console.log(`\n   ❌ Game EXPIRED without reveal`);
                break;
            }
        }
        
        // Check final status after loop
        const finalCheck = await fortune.getCommitmentStatus(gameId);
        const didReveal = finalCheck[1];
        
        if (!didReveal && Number(status2) === 1) {
            const elapsed = (Date.now() - startTime) / 1000;
            console.log(`\n   ⚠️ Timeout after ${elapsed.toFixed(0)} seconds`);
            console.log(`   ArbOS blocks decreased by: ${blockDecreaseCount}`);
            if (blockDecreaseCount > 0) {
                console.log(`   Estimated time per ArbOS block: ${(elapsed / blockDecreaseCount).toFixed(2)} seconds`);
            } else {
                console.log(`   ⚠️ NO ArbOS blocks passed during the test!`);
                console.log(`   This suggests ArbOS blocks are VERY slow on Arbitrum Sepolia`);
            }
        }
    } else if (Number(status2) === 2) {
        console.log(`   Game already REVEALED`);
    } else if (Number(status2) === 3) {
        console.log(`   Game EXPIRED`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 8. SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(80));
    console.log("   SUMMARY");
    console.log("═".repeat(80));

    console.log(`
   ═══════════════════════════════════════════════════════════════════════════
   KEY FINDINGS:
   ═══════════════════════════════════════════════════════════════════════════
   
   Provider block (L2):     ${blockAfterCommit}
   Stored commitBlock:      ${storedCommitBlock}
   Difference:              ${blockAfterCommit - storedCommitBlock} blocks
   
   ═══════════════════════════════════════════════════════════════════════════
   THE ARBITRUM BLOCK NUMBER ISSUE:
   ═══════════════════════════════════════════════════════════════════════════
   
   Arbitrum has TWO different block numbering systems:
   
   1. L2 Block Number (what ethers/provider returns)
      - Updated rapidly with each L2 transaction
      - Currently around ~238 million on Sepolia
   
   2. ArbOS Block Number (what Solidity block.number returns)
      - Based on L1 Ethereum block timing
      - Much slower, currently around ~10 million on Sepolia
      - This is what the FortunePool contract uses!
   
   ═══════════════════════════════════════════════════════════════════════════
   IMPACT ON FORTUNEPOOL:
   ═══════════════════════════════════════════════════════════════════════════
   
   The contract's revealDelay of ${revealDelay} blocks refers to ArbOS blocks,
   NOT L2 blocks. Since ArbOS blocks are tied to L1 timing (~12 seconds per
   block on mainnet, may vary on testnet), the actual wait time is:
   
   Estimated wait: ${Number(revealDelay)} ArbOS blocks × ~12 seconds = ~${Number(revealDelay) * 12} seconds
   
   However, on Arbitrum Sepolia (testnet), the timing may be different and
   potentially MUCH slower.
   
   ═══════════════════════════════════════════════════════════════════════════
   RECOMMENDED SOLUTIONS:
   ═══════════════════════════════════════════════════════════════════════════
   
   Option 1 (Contract Change):
   - Use ArbSys.arbBlockNumber() for consistent L2 block tracking
   - ArbSys is at 0x0000000000000000000000000000000000000064
   
   Option 2 (Frontend/Test Adaptation):  
   - Trust getCommitmentStatus().canReveal instead of calculating locally
   - Wait until canReveal returns true before attempting reveal
   - May require waiting 60+ seconds on testnet
   
   Option 3 (Reduce revealDelay):
   - If acceptable for security, reduce revealDelay to 1-2 blocks
   - This reduces wait time significantly
   
   ═══════════════════════════════════════════════════════════════════════════
`);

    console.log("═".repeat(80));
    console.log("   DIAGNOSTIC COMPLETE");
    console.log("═".repeat(80) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });