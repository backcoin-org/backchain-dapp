// scripts/test_all_functions.ts
// ✅ FULL ECOSYSTEM TEST V5.0 - Tests ALL functions with ALL HASHES
// 
// Tests (3x each):
// - Delegation: delegate, claim, force unstake
// - Fortune Pool: Mode 1x (Simple) and Mode 5x (Advanced)
// - Notary: notarize documents
// - NFT Pools: Buy & Sell from ALL TIERS
// - Rental: List, Rent, Withdraw NFTs
//
// ⚠️ WARNING: This will spend real tokens and ETH on testnet!

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEST_CONFIG = {
    // Number of times to repeat each test
    LOOP_COUNT: 3,
    
    // Amounts for testing
    DELEGATION_AMOUNT: "100",      // BKC to delegate
    DELEGATION_DURATION: 86400,    // 1 day in seconds
    FORTUNE_WAGER: "10",           // BKC to wager
    RENTAL_PRICE_PER_HOUR: "10",   // BKC per hour for rental
    
    // Gas limits
    FORTUNE_GAS_LIMIT: 2000000,
    NFT_GAS_LIMIT: 500000,
    DEFAULT_GAS_LIMIT: 300000,
    
    // Delays between transactions (ms)
    TX_DELAY: 1500,
};

// NFT Pool Tiers (7 tiers)
const NFT_TIERS = [
    { name: "Diamond", addressKey: "pool_diamond", boostBips: 7000 },
    { name: "Platinum", addressKey: "pool_platinum", boostBips: 6000 },
    { name: "Gold", addressKey: "pool_gold", boostBips: 5000 },
    { name: "Silver", addressKey: "pool_silver", boostBips: 4000 },
    { name: "Bronze", addressKey: "pool_bronze", boostBips: 3000 },
    { name: "Iron", addressKey: "pool_iron", boostBips: 2000 },
    { name: "Crystal", addressKey: "pool_crystal", boostBips: 1000 },
];

// ============================================================================
// HELPERS
// ============================================================================

function loadAddresses(): Record<string, string> {
    const possiblePaths = [
        path.join(__dirname, "../deployment-addresses.json"),
        path.join(process.cwd(), "deployment-addresses.json")
    ];
    
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log(`📁 Loading addresses from: ${p}`);
            return JSON.parse(fs.readFileSync(p, "utf8"));
        }
    }
    throw new Error("deployment-addresses.json not found!");
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Colors
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const WHITE = "\x1b[37m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function success(msg: string) { console.log(`${GREEN}✅ ${msg}${RESET}`); }
function error(msg: string) { console.log(`${RED}❌ ${msg}${RESET}`); }
function warning(msg: string) { console.log(`${YELLOW}⚠️  ${msg}${RESET}`); }
function info(msg: string) { console.log(`${CYAN}ℹ️  ${msg}${RESET}`); }
function txInfo(msg: string) { console.log(`${MAGENTA}🔄 ${msg}${RESET}`); }
function hashLog(hash: string) { console.log(`${DIM}   📜 TX: ${hash}${RESET}`); }
function header(msg: string) { console.log(`\n${BOLD}${CYAN}${"═".repeat(75)}\n${msg}\n${"═".repeat(75)}${RESET}`); }
function subheader(msg: string) { console.log(`\n${BOLD}📋 ${msg}${RESET}`); }
function loopHeader(iteration: number, total: number, name: string) {
    console.log(`\n${BOLD}${MAGENTA}────────────────────────────────────────────────────────────────────────────`);
    console.log(`  🔁 ${name} - Iteration ${iteration}/${total}`);
    console.log(`────────────────────────────────────────────────────────────────────────────${RESET}`);
}
function tierHeader(name: string, boost: number) {
    console.log(`\n${BOLD}${YELLOW}▶ TIER: ${name} (${boost/100}% boost)${RESET}`);
}

// ============================================================================
// TRANSACTION LOG
// ============================================================================

interface TxRecord {
    function: string;
    hash: string;
    status: "SUCCESS" | "FAILED";
    details?: string;
    gasUsed?: string;
}

const txLog: TxRecord[] = [];

function logTx(func: string, hash: string, status: "SUCCESS" | "FAILED", details?: string, gasUsed?: string) {
    txLog.push({ function: func, hash, status, details, gasUsed });
    hashLog(hash);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    const [deployer] = await ethers.getSigners();
    const ADDRESSES = loadAddresses();
    
    console.log(`\n${BOLD}${CYAN}`);
    console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
    console.log("║            BACKCOIN ECOSYSTEM - FULL FUNCTION TEST V5.0                  ║");
    console.log("║         Testing ALL Functions with ALL HASHES - ALL NFT TIERS           ║");
    console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
    console.log(RESET);
    
    info(`Deployer: ${deployer.address}`);
    info(`Loop Count: ${TEST_CONFIG.LOOP_COUNT}x per function`);
    info(`NFT Tiers to test: ${NFT_TIERS.length}`);
    
    const initialEthBalance = await ethers.provider.getBalance(deployer.address);
    info(`Initial ETH Balance: ${ethers.formatEther(initialEthBalance)} ETH`);
    
    // Load contracts
    const bkc = await ethers.getContractAt("BKCToken", ADDRESSES.bkcToken);
    const initialBkcBalance = await bkc.balanceOf(deployer.address);
    info(`Initial BKC Balance: ${Number(ethers.formatEther(initialBkcBalance)).toLocaleString()} BKC`);
    
    const dm = await ethers.getContractAt("DelegationManager", ADDRESSES.delegationManager);
    const notary = await ethers.getContractAt("DecentralizedNotary", ADDRESSES.decentralizedNotary);
    const booster = await ethers.getContractAt("RewardBoosterNFT", ADDRESSES.rewardBoosterNFT);
    const rental = await ethers.getContractAt("RentalManager", ADDRESSES.rentalManager);
    
    // FortunePool with V2 ABI
    const fortuneABI = [
        "function owner() view returns (address)",
        "function randomnessOracle() view returns (address)",
        "function serviceFee() view returns (uint256)",
        "function gameFeeBips() view returns (uint256)",
        "function prizePoolBalance() view returns (uint256)",
        "function activeTierCount() view returns (uint256)",
        "function gameCounter() view returns (uint256)",
        "function getRequiredServiceFee(bool) view returns (uint256)",
        "function play(uint256,uint256[],bool) payable",
        "function prizeTiers(uint256) view returns (uint128 maxRange, uint64 multiplierBips, bool active)",
        "event GamePlayed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount)",
        "event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)",
        "event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)"
    ];
    const fortune = new ethers.Contract(ADDRESSES.fortunePool, fortuneABI, deployer);
    
    // Results tracking
    const results: Record<string, { passed: number; failed: number }> = {
        delegation: { passed: 0, failed: 0 },
        claim: { passed: 0, failed: 0 },
        unstake: { passed: 0, failed: 0 },
        fortune1x: { passed: 0, failed: 0 },
        fortune5x: { passed: 0, failed: 0 },
        notary: { passed: 0, failed: 0 },
        nftBuy: { passed: 0, failed: 0 },
        nftSell: { passed: 0, failed: 0 },
        rentalList: { passed: 0, failed: 0 },
        rentalRent: { passed: 0, failed: 0 },
        rentalWithdraw: { passed: 0, failed: 0 },
    };
    
    // Fortune game results
    const fortuneResults: { mode: string; guesses: string; rolls: string; matches: number; prize: string; won: boolean }[] = [];
    
    // ========================================================================
    // INITIAL APPROVALS
    // ========================================================================
    header("PHASE 0: INITIAL APPROVALS");
    
    const maxApproval = ethers.parseEther("100000000");
    
    const contractsToApprove = [
        { name: "DelegationManager", address: ADDRESSES.delegationManager },
        { name: "FortunePool", address: ADDRESSES.fortunePool },
        { name: "Notary", address: ADDRESSES.decentralizedNotary },
        { name: "RentalManager", address: ADDRESSES.rentalManager },
    ];
    
    // Add all NFT pools
    for (const tier of NFT_TIERS) {
        const addr = ADDRESSES[tier.addressKey];
        if (addr) {
            contractsToApprove.push({ name: `Pool ${tier.name}`, address: addr });
        }
    }
    
    for (const contract of contractsToApprove) {
        if (!contract.address) continue;
        txInfo(`Approving BKC for ${contract.name}...`);
        try {
            const tx = await bkc.approve(contract.address, maxApproval);
            const receipt = await tx.wait();
            logTx(`approve_${contract.name}`, receipt!.hash, "SUCCESS");
            success(`${contract.name} approved`);
        } catch (e: any) {
            error(`Failed to approve ${contract.name}: ${e.message?.slice(0, 50)}`);
        }
    }
    
    await sleep(TEST_CONFIG.TX_DELAY);
    
    // ========================================================================
    // TEST 1: DELEGATION (3x)
    // ========================================================================
    header("PHASE 1: DELEGATION MANAGER (3x Loop)");
    
    for (let i = 1; i <= TEST_CONFIG.LOOP_COUNT; i++) {
        loopHeader(i, TEST_CONFIG.LOOP_COUNT, "DELEGATION");
        
        try {
            const delegationAmount = ethers.parseEther(TEST_CONFIG.DELEGATION_AMOUNT);
            
            // 1. Delegate
            txInfo(`Delegating ${TEST_CONFIG.DELEGATION_AMOUNT} BKC...`);
            const delegateTx = await dm.delegate(
                delegationAmount,
                TEST_CONFIG.DELEGATION_DURATION,
                0n,
                { gasLimit: 500000 }
            );
            const delegateReceipt = await delegateTx.wait();
            logTx("delegate", delegateReceipt!.hash, "SUCCESS", `${TEST_CONFIG.DELEGATION_AMOUNT} BKC`, delegateReceipt!.gasUsed.toString());
            success(`Delegated!`);
            results.delegation.passed++;
            
            await sleep(TEST_CONFIG.TX_DELAY);
            
            // 2. Check pending rewards
            const pendingRewards = await dm.pendingRewards(deployer.address);
            info(`Pending rewards: ${ethers.formatEther(pendingRewards)} BKC`);
            
            // 3. Claim rewards if any
            if (pendingRewards > 0n) {
                txInfo("Claiming rewards...");
                try {
                    const claimTx = await dm.claimReward(0n, { gasLimit: 500000 });
                    const claimReceipt = await claimTx.wait();
                    logTx("claimReward", claimReceipt!.hash, "SUCCESS", `${ethers.formatEther(pendingRewards)} BKC`, claimReceipt!.gasUsed.toString());
                    success("Rewards claimed!");
                    results.claim.passed++;
                } catch (e: any) {
                    error(`Claim failed: ${e.reason || e.message?.slice(0, 50)}`);
                    results.claim.failed++;
                }
            }
            
            await sleep(TEST_CONFIG.TX_DELAY);
            
            // 4. Get delegation count and force unstake last one
            const delegations = await dm.getDelegationsOf(deployer.address);
            if (delegations.length > 0) {
                const lastIndex = delegations.length - 1;
                txInfo(`Force unstaking delegation index ${lastIndex}...`);
                try {
                    const forceUnstakeTx = await dm.forceUnstake(lastIndex, 0n, { gasLimit: 500000 });
                    const unstakeReceipt = await forceUnstakeTx.wait();
                    logTx("forceUnstake", unstakeReceipt!.hash, "SUCCESS", `index ${lastIndex}`, unstakeReceipt!.gasUsed.toString());
                    success("Force unstake done!");
                    results.unstake.passed++;
                } catch (e: any) {
                    error(`Force unstake failed: ${e.reason || e.message?.slice(0, 50)}`);
                    results.unstake.failed++;
                }
            }
            
        } catch (e: any) {
            error(`Delegation loop ${i} FAILED: ${e.reason || e.message?.slice(0, 50)}`);
            results.delegation.failed++;
        }
        
        await sleep(TEST_CONFIG.TX_DELAY);
    }
    
    // ========================================================================
    // TEST 2: FORTUNE POOL - MODE 1x SIMPLE (3x)
    // ========================================================================
    header("PHASE 2: FORTUNE POOL - MODE 1x SIMPLE (3x Loop)");
    
    const tierCount = await fortune.activeTierCount();
    info(`Active Tiers: ${tierCount}`);
    
    // Show tier configuration
    for (let t = 1; t <= Number(tierCount); t++) {
        const tier = await fortune.prizeTiers(t);
        info(`  Tier ${t}: Range 1-${tier.maxRange}, Multiplier ${Number(tier.multiplierBips) / 10000}x`);
    }
    
    for (let i = 1; i <= TEST_CONFIG.LOOP_COUNT; i++) {
        loopHeader(i, TEST_CONFIG.LOOP_COUNT, "FORTUNE 1x (Simple/Jackpot)");
        
        try {
            const wagerAmount = ethers.parseEther(TEST_CONFIG.FORTUNE_WAGER);
            const serviceFee = await fortune.getRequiredServiceFee(false);
            
            // Get jackpot tier range
            const jackpotTier = await fortune.prizeTiers(tierCount);
            const maxRange = Number(jackpotTier.maxRange);
            
            // Random guess for jackpot tier
            const guess = BigInt(Math.floor(Math.random() * maxRange) + 1);
            
            info(`Guess: [${guess}] (Range: 1-${maxRange})`);
            info(`Wager: ${TEST_CONFIG.FORTUNE_WAGER} BKC`);
            info(`Fee: ${ethers.formatEther(serviceFee)} ETH`);
            
            txInfo("Playing Fortune 1x...");
            const playTx = await fortune.play(
                wagerAmount,
                [guess],
                false, // Mode 1x
                { value: serviceFee, gasLimit: TEST_CONFIG.FORTUNE_GAS_LIMIT }
            );
            const receipt = await playTx.wait();
            
            // Parse result
            let prizeWon = 0n;
            let roll = 0n;
            let gameId = 0n;
            
            for (const log of receipt?.logs || []) {
                try {
                    const parsed = fortune.interface.parseLog({
                        topics: log.topics as string[],
                        data: log.data
                    });
                    if (parsed?.name === "GamePlayed") {
                        prizeWon = parsed.args.prizeWon;
                        gameId = parsed.args.gameId;
                    }
                    if (parsed?.name === "GameDetails") {
                        roll = parsed.args.rolls[0];
                    }
                } catch {}
            }
            
            const won = prizeWon > 0n;
            fortuneResults.push({
                mode: "1x",
                guesses: `[${guess}]`,
                rolls: `[${roll}]`,
                matches: won ? 1 : 0,
                prize: ethers.formatEther(prizeWon),
                won
            });
            
            logTx("fortune_play_1x", receipt!.hash, "SUCCESS", `Game #${gameId} - Roll: ${roll}, Prize: ${ethers.formatEther(prizeWon)} BKC`, receipt!.gasUsed.toString());
            
            if (won) {
                console.log(`${GREEN}${BOLD}   🎉 JACKPOT! +${ethers.formatEther(prizeWon)} BKC${RESET}`);
            } else {
                console.log(`${YELLOW}   ❌ No match (Guess: ${guess}, Roll: ${roll})${RESET}`);
            }
            
            results.fortune1x.passed++;
            
        } catch (e: any) {
            error(`Fortune 1x loop ${i} FAILED: ${e.reason || e.message?.slice(0, 50)}`);
            results.fortune1x.failed++;
        }
        
        await sleep(TEST_CONFIG.TX_DELAY);
    }
    
    // ========================================================================
    // TEST 3: FORTUNE POOL - MODE 5x ADVANCED (3x)
    // ========================================================================
    header("PHASE 3: FORTUNE POOL - MODE 5x ADVANCED (3x Loop)");
    
    for (let i = 1; i <= TEST_CONFIG.LOOP_COUNT; i++) {
        loopHeader(i, TEST_CONFIG.LOOP_COUNT, "FORTUNE 5x (Cumulative)");
        
        try {
            const wagerAmount = ethers.parseEther(TEST_CONFIG.FORTUNE_WAGER);
            const serviceFee = await fortune.getRequiredServiceFee(true);
            
            // Generate random guesses for all tiers
            const guesses: bigint[] = [];
            for (let t = 1; t <= Number(tierCount); t++) {
                const tier = await fortune.prizeTiers(t);
                const maxRange = Number(tier.maxRange);
                guesses.push(BigInt(Math.floor(Math.random() * maxRange) + 1));
            }
            
            info(`Guesses: [${guesses.join(", ")}]`);
            info(`Wager: ${TEST_CONFIG.FORTUNE_WAGER} BKC`);
            info(`Fee: ${ethers.formatEther(serviceFee)} ETH`);
            
            txInfo("Playing Fortune 5x...");
            const playTx = await fortune.play(
                wagerAmount,
                guesses,
                true, // Mode 5x
                { value: serviceFee, gasLimit: TEST_CONFIG.FORTUNE_GAS_LIMIT }
            );
            const receipt = await playTx.wait();
            
            // Parse result
            let prizeWon = 0n;
            let rolls: bigint[] = [];
            let matchCount = 0;
            let gameId = 0n;
            
            for (const log of receipt?.logs || []) {
                try {
                    const parsed = fortune.interface.parseLog({
                        topics: log.topics as string[],
                        data: log.data
                    });
                    if (parsed?.name === "GamePlayed") {
                        prizeWon = parsed.args.prizeWon;
                        matchCount = Number(parsed.args.matchCount);
                        gameId = parsed.args.gameId;
                    }
                    if (parsed?.name === "GameDetails") {
                        rolls = parsed.args.rolls;
                    }
                } catch {}
            }
            
            const won = prizeWon > 0n;
            fortuneResults.push({
                mode: "5x",
                guesses: `[${guesses.join(", ")}]`,
                rolls: `[${rolls.join(", ")}]`,
                matches: matchCount,
                prize: ethers.formatEther(prizeWon),
                won
            });
            
            logTx("fortune_play_5x", receipt!.hash, "SUCCESS", `Game #${gameId} - Matches: ${matchCount}, Prize: ${ethers.formatEther(prizeWon)} BKC`, receipt!.gasUsed.toString());
            
            console.log(`${CYAN}   Guesses: [${guesses.join(", ")}]${RESET}`);
            console.log(`${CYAN}   Rolls:   [${rolls.join(", ")}]${RESET}`);
            
            if (won) {
                console.log(`${GREEN}${BOLD}   🎉 WINNER! ${matchCount} matches = +${ethers.formatEther(prizeWon)} BKC${RESET}`);
            } else {
                console.log(`${YELLOW}   ❌ No matches this round${RESET}`);
            }
            
            results.fortune5x.passed++;
            
        } catch (e: any) {
            error(`Fortune 5x loop ${i} FAILED: ${e.reason || e.message?.slice(0, 50)}`);
            results.fortune5x.failed++;
        }
        
        await sleep(TEST_CONFIG.TX_DELAY);
    }
    
    // ========================================================================
    // TEST 4: DECENTRALIZED NOTARY (3x)
    // ========================================================================
    header("PHASE 4: DECENTRALIZED NOTARY (3x Loop)");
    
    const baseFee = await notary.getBaseFee();
    info(`Notary Base Fee: ${ethers.formatEther(baseFee)} BKC`);
    
    for (let i = 1; i <= TEST_CONFIG.LOOP_COUNT; i++) {
        loopHeader(i, TEST_CONFIG.LOOP_COUNT, "NOTARY");
        
        try {
            const timestamp = Date.now();
            const ipfsUri = `QmTestDoc${timestamp}_${i}`;
            const description = `Loop Test Document #${i} - ${new Date().toISOString()}`;
            const contentHash = ethers.keccak256(ethers.toUtf8Bytes(`content-${timestamp}-${i}`));
            
            info(`IPFS: ${ipfsUri}`);
            info(`Description: ${description}`);
            
            txInfo("Notarizing document...");
            const notarizeTx = await notary.notarize(
                ipfsUri,
                description,
                contentHash,
                0n,
                { gasLimit: 500000 }
            );
            const receipt = await notarizeTx.wait();
            
            // Get token ID
            let tokenId = null;
            for (const log of receipt?.logs || []) {
                try {
                    const parsed = notary.interface.parseLog({
                        topics: log.topics as string[],
                        data: log.data
                    });
                    if (parsed?.name === "DocumentNotarized") {
                        tokenId = parsed.args.tokenId;
                    }
                } catch {}
            }
            
            logTx("notarize", receipt!.hash, "SUCCESS", `Token #${tokenId}`, receipt!.gasUsed.toString());
            success(`Document notarized! Token ID: ${tokenId}`);
            results.notary.passed++;
            
        } catch (e: any) {
            error(`Notary loop ${i} FAILED: ${e.reason || e.message?.slice(0, 50)}`);
            results.notary.failed++;
        }
        
        await sleep(TEST_CONFIG.TX_DELAY);
    }
    
    // ========================================================================
    // TEST 5: NFT LIQUIDITY POOLS - ALL TIERS (Buy & Sell each)
    // ========================================================================
    header("PHASE 5: NFT LIQUIDITY POOLS - ALL 7 TIERS");
    
    for (const tier of NFT_TIERS) {
        const poolAddress = ADDRESSES[tier.addressKey];
        
        if (!poolAddress) {
            warning(`Pool ${tier.name} not deployed, skipping`);
            continue;
        }
        
        tierHeader(tier.name, tier.boostBips);
        
        try {
            const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress);
            
            // Get pool info
            const poolInfo = await pool.getPoolInfo();
            const nftCount = poolInfo[1];
            const bkcBalance = poolInfo[0];
            
            info(`Pool BKC: ${ethers.formatEther(bkcBalance)} BKC`);
            info(`Pool NFTs: ${nftCount}`);
            
            if (nftCount === 0n) {
                warning(`No NFTs in ${tier.name} pool, skipping`);
                continue;
            }
            
            // Get prices
            const buyPrice = await pool.getBuyPriceWithTax();
            const sellPrice = await pool.getSellPriceAfterTax();
            
            info(`Buy Price: ${ethers.formatEther(buyPrice)} BKC`);
            info(`Sell Price: ${ethers.formatEther(sellPrice)} BKC`);
            info(`Spread: ${ethers.formatEther(buyPrice - sellPrice)} BKC (${((Number(buyPrice - sellPrice) / Number(buyPrice)) * 100).toFixed(2)}%)`);
            
            // BUY NFT
            txInfo(`Buying ${tier.name} NFT...`);
            try {
                const maxPrice = buyPrice + (buyPrice * 500n / 10000n); // 5% slippage
                const buyTx = await pool.buyNFTWithSlippage(maxPrice, { gasLimit: TEST_CONFIG.NFT_GAS_LIMIT });
                const buyReceipt = await buyTx.wait();
                
                // Get token ID
                let tokenId: bigint | null = null;
                for (const log of buyReceipt?.logs || []) {
                    try {
                        const parsed = pool.interface.parseLog({
                            topics: log.topics as string[],
                            data: log.data
                        });
                        if (parsed?.name === "NFTPurchased") {
                            tokenId = parsed.args.tokenId;
                        }
                    } catch {}
                }
                
                logTx(`nft_buy_${tier.name}`, buyReceipt!.hash, "SUCCESS", `Token #${tokenId}, Price: ${ethers.formatEther(buyPrice)} BKC`, buyReceipt!.gasUsed.toString());
                success(`${tier.name} NFT purchased! Token ID: ${tokenId}`);
                results.nftBuy.passed++;
                
                await sleep(TEST_CONFIG.TX_DELAY);
                
                // SELL NFT back
                if (tokenId !== null) {
                    // Approve NFT for pool
                    txInfo("Approving NFT for sale...");
                    const approveTx = await booster.approve(poolAddress, tokenId);
                    const approveReceipt = await approveTx.wait();
                    logTx(`nft_approve_${tier.name}`, approveReceipt!.hash, "SUCCESS", `Token #${tokenId}`);
                    
                    await sleep(TEST_CONFIG.TX_DELAY);
                    
                    // Sell
                    txInfo(`Selling ${tier.name} NFT...`);
                    const currentSellPrice = await pool.getSellPriceAfterTax();
                    const minPayout = currentSellPrice - (currentSellPrice * 500n / 10000n); // 5% slippage
                    
                    const sellTx = await pool.sellNFT(tokenId, minPayout, { gasLimit: TEST_CONFIG.NFT_GAS_LIMIT });
                    const sellReceipt = await sellTx.wait();
                    
                    logTx(`nft_sell_${tier.name}`, sellReceipt!.hash, "SUCCESS", `Token #${tokenId}, Payout: ${ethers.formatEther(currentSellPrice)} BKC`, sellReceipt!.gasUsed.toString());
                    success(`${tier.name} NFT sold! Token ID: ${tokenId}`);
                    results.nftSell.passed++;
                }
                
            } catch (e: any) {
                error(`${tier.name} buy/sell failed: ${e.reason || e.message?.slice(0, 50)}`);
                results.nftBuy.failed++;
            }
            
        } catch (e: any) {
            error(`${tier.name} pool error: ${e.reason || e.message?.slice(0, 50)}`);
        }
        
        await sleep(TEST_CONFIG.TX_DELAY);
    }
    
    // ========================================================================
    // TEST 6: RENTAL MANAGER (List, Rent, Withdraw)
    // ========================================================================
    header("PHASE 6: RENTAL MANAGER (List, Rent, Withdraw)");
    
    // First buy an NFT to rent
    const crystalPool = ADDRESSES.pool_crystal;
    let rentalTokenId: bigint | null = null;
    
    if (crystalPool) {
        try {
            const pool = await ethers.getContractAt("NFTLiquidityPool", crystalPool);
            const poolInfo = await pool.getPoolInfo();
            
            if (poolInfo[1] > 0n) {
                // Buy NFT for rental test
                const buyPrice = await pool.getBuyPriceWithTax();
                txInfo("Buying NFT for rental test...");
                
                const maxPrice = buyPrice + (buyPrice * 500n / 10000n);
                const buyTx = await pool.buyNFTWithSlippage(maxPrice, { gasLimit: TEST_CONFIG.NFT_GAS_LIMIT });
                const buyReceipt = await buyTx.wait();
                
                for (const log of buyReceipt?.logs || []) {
                    try {
                        const parsed = pool.interface.parseLog({
                            topics: log.topics as string[],
                            data: log.data
                        });
                        if (parsed?.name === "NFTPurchased") {
                            rentalTokenId = parsed.args.tokenId;
                        }
                    } catch {}
                }
                
                logTx("nft_buy_for_rental", buyReceipt!.hash, "SUCCESS", `Token #${rentalTokenId}`);
                success(`Bought NFT #${rentalTokenId} for rental test`);
                
                await sleep(TEST_CONFIG.TX_DELAY);
            }
        } catch (e: any) {
            warning(`Could not buy NFT for rental: ${e.message?.slice(0, 50)}`);
        }
    }
    
    if (rentalTokenId !== null) {
        // List NFT for rent
        subheader("6.1 List NFT for Rent");
        try {
            // Approve NFT for rental manager
            txInfo("Approving NFT for rental...");
            const approveTx = await booster.approve(ADDRESSES.rentalManager, rentalTokenId);
            const approveReceipt = await approveTx.wait();
            logTx("nft_approve_rental", approveReceipt!.hash, "SUCCESS", `Token #${rentalTokenId}`);
            
            await sleep(TEST_CONFIG.TX_DELAY);
            
            // List for rent
            const pricePerHour = ethers.parseEther(TEST_CONFIG.RENTAL_PRICE_PER_HOUR);
            txInfo(`Listing NFT #${rentalTokenId} for rent at ${TEST_CONFIG.RENTAL_PRICE_PER_HOUR} BKC/hour...`);
            
            const listTx = await rental.listNFT(rentalTokenId, pricePerHour, 1, 24, { gasLimit: 500000 });
            const listReceipt = await listTx.wait();
            
            logTx("rental_list", listReceipt!.hash, "SUCCESS", `Token #${rentalTokenId}, ${TEST_CONFIG.RENTAL_PRICE_PER_HOUR} BKC/hr`);
            success(`NFT #${rentalTokenId} listed for rent!`);
            results.rentalList.passed++;
            
            await sleep(TEST_CONFIG.TX_DELAY);
            
            // Rent it (simulating another user, but we rent our own for testing)
            subheader("6.2 Rent NFT (1 hour)");
            txInfo(`Renting NFT #${rentalTokenId}...`);
            
            const rentTx = await rental.rentNFTSimple(rentalTokenId, { gasLimit: 500000 });
            const rentReceipt = await rentTx.wait();
            
            logTx("rental_rent", rentReceipt!.hash, "SUCCESS", `Token #${rentalTokenId}, 1 hour`);
            success(`NFT #${rentalTokenId} rented for 1 hour!`);
            results.rentalRent.passed++;
            
            // Note: Cannot withdraw while rented, would need to wait 1 hour
            info("Note: NFT is currently rented, withdrawal would require waiting for rental to expire");
            
        } catch (e: any) {
            error(`Rental test failed: ${e.reason || e.message?.slice(0, 50)}`);
            results.rentalList.failed++;
        }
    } else {
        warning("No NFT available for rental test");
    }
    
    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    header("═══════════════════════ FINAL TEST SUMMARY ═══════════════════════");
    
    // Results table
    console.log(`\n${BOLD}Results by Function:${RESET}`);
    console.log(`┌────────────────────────────────┬──────────┬──────────┐`);
    console.log(`│ Function                       │ Passed   │ Failed   │`);
    console.log(`├────────────────────────────────┼──────────┼──────────┤`);
    
    const printRow = (name: string, key: string) => {
        const r = results[key] || { passed: 0, failed: 0 };
        console.log(`│ ${name.padEnd(30)} │    ${String(r.passed).padStart(2)}    │    ${String(r.failed).padStart(2)}    │`);
    };
    
    printRow("Delegation", "delegation");
    printRow("Claim Rewards", "claim");
    printRow("Force Unstake", "unstake");
    printRow("Fortune 1x (Simple)", "fortune1x");
    printRow("Fortune 5x (Advanced)", "fortune5x");
    printRow("Notary", "notary");
    printRow("NFT Buy (All Tiers)", "nftBuy");
    printRow("NFT Sell (All Tiers)", "nftSell");
    printRow("Rental List", "rentalList");
    printRow("Rental Rent", "rentalRent");
    
    console.log(`└────────────────────────────────┴──────────┴──────────┘`);
    
    const totalPassed = Object.values(results).reduce((a, b) => a + b.passed, 0);
    const totalFailed = Object.values(results).reduce((a, b) => a + b.failed, 0);
    
    console.log(`\n${BOLD}Total: ${GREEN}${totalPassed} Passed${RESET}, ${RED}${totalFailed} Failed${RESET}`);
    
    // Fortune Results
    header("🎰 FORTUNE POOL GAME RESULTS");
    console.log(`\n${BOLD}Game Results:${RESET}`);
    console.log(`┌──────┬──────────────────────────┬──────────────────────────┬─────────┬───────────────┬────────┐`);
    console.log(`│ Mode │ Guesses                  │ Rolls                    │ Matches │ Prize         │ Result │`);
    console.log(`├──────┼──────────────────────────┼──────────────────────────┼─────────┼───────────────┼────────┤`);
    
    for (const game of fortuneResults) {
        const result = game.won ? `${GREEN}WIN${RESET}` : `${RED}LOSS${RESET}`;
        console.log(`│ ${game.mode.padEnd(4)} │ ${game.guesses.padEnd(24)} │ ${game.rolls.padEnd(24)} │    ${String(game.matches).padStart(2)}   │ ${game.prize.padStart(10)} BKC │ ${result}    │`);
    }
    console.log(`└──────┴──────────────────────────┴──────────────────────────┴─────────┴───────────────┴────────┘`);
    
    const totalWins = fortuneResults.filter(g => g.won).length;
    const totalGames = fortuneResults.length;
    const totalPrize = fortuneResults.reduce((a, b) => a + parseFloat(b.prize), 0);
    
    console.log(`\n${BOLD}Fortune Stats:${RESET} ${totalWins}/${totalGames} wins (${((totalWins/totalGames)*100).toFixed(1)}%), Total Prize: ${totalPrize.toFixed(2)} BKC`);
    
    // All Transaction Hashes
    header("📜 ALL TRANSACTION HASHES");
    console.log(`\n${BOLD}Total Transactions: ${txLog.length}${RESET}\n`);
    
    for (const tx of txLog) {
        const status = tx.status === "SUCCESS" ? `${GREEN}✅${RESET}` : `${RED}❌${RESET}`;
        console.log(`${status} ${tx.function.padEnd(25)} | ${tx.hash}`);
        if (tx.details) {
            console.log(`${DIM}                              └─ ${tx.details}${RESET}`);
        }
    }
    
    // Final balances
    header("💰 FINAL BALANCES");
    const finalEth = await ethers.provider.getBalance(deployer.address);
    const finalBkc = await bkc.balanceOf(deployer.address);
    
    const ethSpent = initialEthBalance - finalEth;
    const bkcChange = finalBkc - initialBkcBalance;
    
    console.log(`\n${BOLD}Balance Changes:${RESET}`);
    console.log(`  ETH: ${ethers.formatEther(finalEth)} (spent ${ethers.formatEther(ethSpent)} ETH)`);
    console.log(`  BKC: ${Number(ethers.formatEther(finalBkc)).toLocaleString()} (change: ${Number(ethers.formatEther(bkcChange)).toLocaleString()} BKC)`);
    
    // Fortune Pool stats
    const finalGameCounter = await fortune.gameCounter();
    const finalPrizePool = await fortune.prizePoolBalance();
    console.log(`\n${BOLD}Fortune Pool:${RESET}`);
    console.log(`  Games Played: ${finalGameCounter}`);
    console.log(`  Prize Pool: ${Number(ethers.formatEther(finalPrizePool)).toLocaleString()} BKC`);
    
    if (totalFailed === 0) {
        console.log(`\n${GREEN}${BOLD}🎉 ALL TESTS PASSED! Ecosystem is fully operational.${RESET}\n`);
    } else {
        console.log(`\n${YELLOW}${BOLD}⚠️  Some tests failed. Check the output above for details.${RESET}\n`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });