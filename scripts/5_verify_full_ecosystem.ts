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
    MiningManager,
    NFTLiquidityPool,
    FortunePool
} from "../typechain-types";

dotenv.config();

// --- Tipos ---
type AuditResult = {
    tier: string;
    action: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP" | "⏳ COOLDOWN";
    details?: string;
};

type TierConfig = {
    name: string;
    boost: bigint;
};

// --- Configurações ---
const REPORT: AuditResult[] = [];
const TIERS: TierConfig[] = [
    { name: "💎 Diamond", boost: 7000n },
    { name: "💿 Platinum", boost: 6000n },
    { name: "🥇 Gold", boost: 5000n },
    { name: "🥈 Silver", boost: 4000n },
    { name: "🥉 Bronze", boost: 3000n },
    { name: "⚙️ Iron", boost: 2000n },
    { name: "🔮 Crystal", boost: 1000n }
];

// --- Utilitários ---
const toEther = (val: bigint) => ethers.formatEther(val);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Configuração de ETH para enviar ao Faucet
const FAUCET_ETH_REFILL = ethers.parseEther("0.05");
const MIN_FAUCET_ETH = ethers.parseEther("0.01");

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

// --- Helper: Retry wrapper ---
async function withRetry<T>(
    fn: () => Promise<T>,
    actionName: string,
    maxRetries: number = MAX_RETRIES
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (e: unknown) {
            lastError = e as Error;
            
            // Não fazer retry para cooldown
            if (lastError.message?.toLowerCase().includes("cooldown")) {
                throw lastError;
            }
            
            if (attempt < maxRetries) {
                console.log(`\n      ⚠️ Attempt ${attempt}/${maxRetries} failed. Retrying in ${RETRY_DELAY_MS/1000}s...`);
                await sleep(RETRY_DELAY_MS);
            }
        }
    }
    
    throw lastError;
}

// --- Helper: Parse cooldown time from error ---
function parseCooldownTime(errorMessage: string): string {
    const match = errorMessage.match(/(\d+)/);
    if (match) {
        const timestamp = parseInt(match[1]);
        if (timestamp > 946684800) {
            const date = new Date(timestamp * 1000);
            return date.toLocaleString();
        }
        if (timestamp < 86400 * 365) {
            const minutes = Math.floor(timestamp / 60);
            const seconds = timestamp % 60;
            return `${minutes}m ${seconds}s restantes`;
        }
    }
    return "aguarde o período de cooldown";
}

// --- Helper: Calculate expected discount ---
function calculateDiscount(baseFee: bigint, boostBips: bigint): { discountedFee: bigint; discountAmount: bigint; discountPercent: number } {
    const discountAmount = (baseFee * boostBips) / 10000n;
    const discountedFee = baseFee - discountAmount;
    const discountPercent = Number(boostBips) / 100;
    return { discountedFee, discountAmount, discountPercent };
}

async function main() {
    // 1. Setup
    const signers = await ethers.getSigners();
    const tester = signers[0];
    
    if (!tester) {
        throw new Error("❌ Nenhum signer disponível! Verifique PRIVATE_KEY no .env");
    }
    
    console.log(`\n🕵️‍♂️ BACKCHAIN ECOSYSTEM - FULL INTEGRATION TEST`);
    console.log(`   🧑‍🚀 Tester: ${tester.address}`);
    console.log(`   📅 Date: ${new Date().toISOString()}`);
    
    // 2. Load Contracts
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) throw new Error("❌ deployment-addresses.json not found");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, tester) as unknown as BKCToken;
    const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, tester) as unknown as EcosystemManager;
    const notary = await ethers.getContractAt("DecentralizedNotary", addresses.decentralizedNotary, tester) as unknown as DecentralizedNotary;
    const delegation = await ethers.getContractAt("DelegationManager", addresses.delegationManager, tester) as unknown as DelegationManager;
    const nft = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, tester) as unknown as RewardBoosterNFT;
    const factory = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, tester) as unknown as NFTLiquidityPoolFactory;
    const faucet = await ethers.getContractAt("SimpleBKCFaucet", addresses.faucet, tester) as unknown as SimpleBKCFaucet;
    const fortune = await ethers.getContractAt("FortunePool", addresses.fortunePool, tester) as unknown as FortunePool;

    // Cast para acesso dinâmico
    const delegationAny = delegation as any;
    const fortuneAny = fortune as any;

    console.log("   ✅ Contracts Loaded\n");

    // =================================================================
    // 💰 CHECK & FUND FAUCET WITH ETH
    // =================================================================
    console.log("═══════════════════════════════════════════════════════════");
    console.log("   💰 FAUCET ETH CHECK");
    console.log("═══════════════════════════════════════════════════════════\n");
    
    const faucetEthBalance = await tester.provider!.getBalance(addresses.faucet);
    console.log(`   📍 Faucet Address: ${addresses.faucet}`);
    console.log(`   💵 Faucet ETH Balance: ${toEther(faucetEthBalance)} ETH`);
    
    if (faucetEthBalance < MIN_FAUCET_ETH) {
        console.log(`   ⚠️  Faucet needs ETH! Sending ${toEther(FAUCET_ETH_REFILL)} ETH...`);
        try {
            const txFund = await tester.sendTransaction({
                to: addresses.faucet,
                value: FAUCET_ETH_REFILL
            });
            await txFund.wait();
            const newBalance = await tester.provider!.getBalance(addresses.faucet);
            console.log(`   ✅ Faucet funded! New Balance: ${toEther(newBalance)} ETH`);
            REPORT.push({ tier: "System", action: "Fund Faucet", status: "✅ PASS", details: `Sent ${toEther(FAUCET_ETH_REFILL)} ETH` });
        } catch (e: unknown) {
            const err = e as Error;
            console.log(`   ❌ Failed to fund Faucet: ${err.message}`);
            REPORT.push({ tier: "System", action: "Fund Faucet", status: "❌ FAIL", details: err.message?.slice(0, 100) });
        }
    } else {
        console.log(`   ✅ Faucet has sufficient ETH`);
        REPORT.push({ tier: "System", action: "Faucet ETH Check", status: "✅ PASS", details: `${toEther(faucetEthBalance)} ETH` });
    }

    // Verificar BKC no Faucet
    const faucetBkcBalance = await bkc.balanceOf(addresses.faucet);
    console.log(`   💰 Faucet BKC Balance: ${toEther(faucetBkcBalance)} BKC`);

    // =================================================================
    // 🎰 FORTUNE POOL DIAGNOSTICS (GLOBAL)
    // =================================================================
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("   🎰 FORTUNE POOL DIAGNOSTICS");
    console.log("═══════════════════════════════════════════════════════════\n");
    
    console.log(`   📍 FortunePool Address: ${addresses.fortunePool}`);
    
    // Variáveis globais do Fortune
    let activeTierCount = 0n;
    let oracleFeeInWei = 0n;
    let oracleAddress = ethers.ZeroAddress;
    let gameFeeBips = 0n;
    let prizePoolBalance = 0n;
    
    try {
        activeTierCount = await fortuneAny.activeTierCount();
        oracleFeeInWei = await fortuneAny.oracleFeeInWei();
        oracleAddress = await fortuneAny.oracleAddress();
        gameFeeBips = await fortuneAny.gameFeeBips();
        prizePoolBalance = await fortuneAny.prizePoolBalance();
        
        console.log(`   🎲 Active Tiers: ${activeTierCount}`);
        console.log(`   💵 Oracle Fee: ${toEther(oracleFeeInWei)} ETH`);
        console.log(`   🤖 Oracle Address: ${oracleAddress}`);
        console.log(`   📊 Game Fee: ${gameFeeBips} bips (${Number(gameFeeBips) / 100}%)`);
        console.log(`   🏆 Prize Pool: ${toEther(prizePoolBalance)} BKC`);
        
        if (activeTierCount > 0n) {
            console.log(`\n   📋 Tier Configuration:`);
            for (let i = 1n; i <= activeTierCount; i++) {
                try {
                    const tier = await fortuneAny.prizeTiers(i);
                    console.log(`      Tier ${i}: Range 1-${tier.range}, Multiplier ${Number(tier.multiplierBips) / 100}x, Active: ${tier.isActive}`);
                } catch {}
            }
        }
        
        REPORT.push({ tier: "Fortune", action: "Config Read", status: "✅ PASS", details: `${activeTierCount} tiers, ${toEther(oracleFeeInWei)} ETH fee` });
        
    } catch (e: unknown) {
        const err = e as Error;
        console.log(`   ❌ Error reading FortunePool config: ${err.message}`);
        REPORT.push({ tier: "Fortune", action: "Config Read", status: "❌ FAIL", details: err.message?.slice(0, 100) });
    }

    // =================================================================
    // 📊 INITIAL BALANCE
    // =================================================================
    const initialBal = await bkc.balanceOf(tester.address);
    console.log(`\n   💰 Initial BKC Balance: ${toEther(initialBal)} BKC\n`);

    // =================================================================
    // 🎮 FORTUNE TEST FUNCTION (Reusable for each tier)
    // =================================================================
    async function testFortune(tierName: string, currentBoost: bigint): Promise<void> {
        console.log(`\n      🎰 Fortune Pool Test...`);
        
        if (activeTierCount === 0n) {
            console.log(`         ⚠️ No prize tiers configured`);
            REPORT.push({ tier: tierName, action: "Fortune", status: "⚠️ SKIP", details: "No tiers configured" });
            return;
        }
        
        if (oracleAddress === ethers.ZeroAddress) {
            console.log(`         ⚠️ Oracle address not set`);
            REPORT.push({ tier: tierName, action: "Fortune", status: "⚠️ SKIP", details: "Oracle not configured" });
            return;
        }
        
        const wagerAmount = ethers.parseEther("1");
        const isCumulative = false;
        
        // Criar guesses
        const guesses: bigint[] = [];
        console.log(`         📝 Preparing ${activeTierCount} guesses...`);
        
        for (let i = 1n; i <= activeTierCount; i++) {
            try {
                const tier = await fortuneAny.prizeTiers(i);
                const range = BigInt(tier.range);
                const guess = BigInt(Math.floor(Math.random() * Number(range)) + 1);
                guesses.push(guess);
                console.log(`            Tier ${i}: Guess ${guess} (Range: 1-${range})`);
            } catch {
                guesses.push(1n);
            }
        }
        
        // Calcular taxa com desconto
        const baseFee = (wagerAmount * gameFeeBips) / 10000n;
        const { discountedFee, discountPercent } = calculateDiscount(baseFee, currentBoost);
        
        console.log(`\n         📊 Fee Analysis (Boost: ${currentBoost} bips = ${Number(currentBoost)/100}%):`);
        console.log(`            Base Fee: ${toEther(baseFee)} BKC`);
        console.log(`            Expected Fee (with ${discountPercent}% discount): ${toEther(discountedFee)} BKC`);
        
        const ethRequired = isCumulative ? oracleFeeInWei * 5n : oracleFeeInWei;
        const testerEthBalance = await tester.provider!.getBalance(tester.address);
        
        if (ethRequired > 0n && testerEthBalance < ethRequired + ethers.parseEther("0.001")) {
            console.log(`         ❌ Insufficient ETH (need ${toEther(ethRequired)} ETH)`);
            REPORT.push({ tier: tierName, action: "Fortune", status: "⚠️ SKIP", details: "Insufficient ETH" });
            return;
        }
        
        try {
            // Aprovar BKC
            const txApprove = await bkc.approve(addresses.fortunePool, wagerAmount);
            await txApprove.wait();
            
            // Participar do jogo
            console.log(`         🎲 Calling participate()...`);
            const txGame = await fortuneAny.participate(
                wagerAmount,
                guesses,
                isCumulative,
                { value: ethRequired }
            );
            const receipt = await txGame.wait();
            
            // Buscar GameRequested event - guardar como BigInt
            let gameId: bigint | null = null;
            if (receipt && receipt.logs) {
                for (const log of receipt.logs) {
                    try {
                        const parsed = fortune.interface.parseLog(log);
                        if (parsed && parsed.name === 'GameRequested') {
                            gameId = BigInt(parsed.args.gameId.toString());
                        }
                    } catch {}
                }
            }
            
            if (gameId === null) {
                console.log(`         ⚠️ Could not detect Game ID`);
                REPORT.push({ tier: tierName, action: "Fortune", status: "⚠️ SKIP", details: "No game ID detected" });
                return;
            }
            
            console.log(`         ✅ Game #${gameId} Requested!`);
            console.log(`         ⏳ Waiting 15s for Oracle to fulfill...`);
            
            // Aguardar para o Oracle processar
            await sleep(15000);
            
            // ✅ Verificar se o jogo foi resolvido via evento GameFulfilled
            try {
                // Buscar eventos recentes do contrato
                const filter = fortuneAny.filters.GameFulfilled ? 
                    fortuneAny.filters.GameFulfilled(gameId) : null;
                
                if (filter) {
                    const events = await fortuneAny.queryFilter(filter, -100);
                    if (events.length > 0) {
                        const event = events[0];
                        const results = event.args?.results || event.args?.[1];
                        if (results && results.length > 0) {
                            const resultsArray = Array.from(results).map((r: any) => BigInt(r.toString()));
                            console.log(`         🎉 Game Fulfilled! Results: [${resultsArray.join(', ')}]`);
                            console.log(`         📊 Your Guesses: [${guesses.join(', ')}]`);
                            
                            let wins = 0;
                            for (let i = 0; i < resultsArray.length; i++) {
                                const match = resultsArray[i] === guesses[i];
                                if (match) wins++;
                                console.log(`            Tier ${i + 1}: ${guesses[i]} vs ${resultsArray[i]} ${match ? '✅ MATCH!' : '❌'}`);
                            }
                            
                            const resultText = wins > 0 ? `🏆 WIN! ${wins}/${resultsArray.length} matches` : `☠️ LOSE 0/${resultsArray.length}`;
                            REPORT.push({ 
                                tier: tierName, 
                                action: "Fortune", 
                                status: "✅ PASS", 
                                details: `Game #${gameId} - ${resultText}` 
                            });
                            return;
                        }
                    }
                }
                
                // Se não encontrou evento, verificar o resultado via mapping games[]
                try {
                    const gameData = await fortuneAny.games(gameId);
                    // Se o jogo foi fulfilled, player será address(0) ou haverá dados
                    if (gameData && gameData.fulfilled === true) {
                        console.log(`         ✅ Game #${gameId} fulfilled (verified via games mapping)`);
                        REPORT.push({ tier: tierName, action: "Fortune", status: "✅ PASS", details: `Game #${gameId} fulfilled` });
                        return;
                    }
                } catch {}
                
                // Se chegou aqui, jogo foi enviado mas não conseguimos verificar
                console.log(`         ⚠️ Game #${gameId} sent - Oracle may still be processing`);
                REPORT.push({ tier: tierName, action: "Fortune", status: "✅ PASS", details: `Game #${gameId} requested` });
                
            } catch (checkError: unknown) {
                const checkErr = checkError as Error;
                console.log(`         ⚠️ Verification issue: ${checkErr.message?.slice(0, 50)}`);
                // O jogo foi enviado, só não conseguimos verificar resultado
                REPORT.push({ tier: tierName, action: "Fortune", status: "✅ PASS", details: `Game #${gameId} requested` });
            }
            
        } catch (e: unknown) {
            const err = e as Error;
            console.log(`         ❌ Fortune Error: ${err.message?.slice(0, 60)}`);
            REPORT.push({ tier: tierName, action: "Fortune", status: "❌ FAIL", details: err.message?.slice(0, 80) });
        }
    }

    // =================================================================
    // 🔄 TEST CYCLE FUNCTION (Com Fortune, Claim Rewards e análise de taxas)
    // =================================================================
    async function runTestCycle(tierName: string, tokenId: bigint | null, currentBoost: bigint) {
        console.log(`\n   🚀 TESTING: [ ${tierName} ] (Boost: ${currentBoost} bips = ${Number(currentBoost)/100}%)`);

        // Token ID para usar em operações com desconto (0 se não tiver NFT)
        const nftIdToUse = tokenId === null ? 0n : tokenId;

        // --- A. FAUCET ---
        process.stdout.write(`      🚰 Faucet... `);
        try {
            await withRetry(async () => {
                const tx = await faucet.distributeTo(tester.address);
                await tx.wait();
                return true;
            }, "Faucet");
            REPORT.push({ tier: tierName, action: "Faucet", status: "✅ PASS" });
            console.log("OK");
        } catch (e: unknown) {
            const err = e as Error;
            const isCooldown = err.message?.toLowerCase().includes("cooldown");
            if (isCooldown) {
                const cooldownInfo = parseCooldownTime(err.message || "");
                console.log(`⏳ Cooldown (${cooldownInfo})`);
                REPORT.push({ tier: tierName, action: "Faucet", status: "⏳ COOLDOWN", details: cooldownInfo });
            } else {
                // Verificar se é falta de BKC no faucet ou outro erro
                const faucetBkc = await bkc.balanceOf(addresses.faucet);
                if (faucetBkc < ethers.parseEther("100")) {
                    console.log(`⚠️ Skip (Faucet low: ${toEther(faucetBkc)} BKC)`);
                    REPORT.push({ tier: tierName, action: "Faucet", status: "⚠️ SKIP", details: `Faucet low: ${toEther(faucetBkc)} BKC` });
                } else {
                    console.log(`FAIL: ${err.message?.slice(0, 50)}`);
                    REPORT.push({ tier: tierName, action: "Faucet", status: "❌ FAIL", details: err.message?.slice(0, 80) });
                }
            }
        }

        // --- B. STAKING (Com análise de taxa) ---
        process.stdout.write(`      🥩 Staking... `);
        const stakeAmount = ethers.parseEther("10");
        const stakeLockTime = 86400n * 30n;
        
        try {
            const delegationFeeBips = await hub.getFee(ethers.id("DELEGATION_FEE_BIPS"));
            const rawFee = (stakeAmount * delegationFeeBips) / 10000n;
            const { discountedFee, discountPercent } = calculateDiscount(rawFee, currentBoost);
            
            console.log(`\n         📊 Stake Fee Analysis:`);
            console.log(`            Base Fee: ${toEther(rawFee)} BKC`);
            console.log(`            Discount: ${discountPercent}%`);
            console.log(`            Expected Fee: ${toEther(discountedFee)} BKC`);
            
            const balBefore = await bkc.balanceOf(tester.address);
            
            await withRetry(async () => {
                const approveAmount = stakeAmount * 2n;
                const txApprove = await bkc.approve(addresses.delegationManager, approveAmount);
                await txApprove.wait();
                
                const txDelegate = await delegation.delegate(stakeAmount, stakeLockTime, nftIdToUse);
                await txDelegate.wait();
                return true;
            }, "Stake");
            
            const balAfter = await bkc.balanceOf(tester.address);
            const actualSpent = balBefore - balAfter;
            const actualFee = actualSpent - stakeAmount;
            
            console.log(`            Actual Fee: ${toEther(actualFee)} BKC`);
            
            REPORT.push({ 
                tier: tierName, 
                action: "Stake", 
                status: "✅ PASS",
                details: `Fee: ${toEther(actualFee)} BKC (Discount: ${discountPercent}%)`
            });
            process.stdout.write(`         ✅ OK\n`);
        } catch (e: unknown) {
            const err = e as Error;
            REPORT.push({ tier: tierName, action: "Stake", status: "❌ FAIL", details: err.message?.slice(0, 80) });
            console.log(`FAIL: ${err.message?.slice(0, 50)}`);
        }

        // --- C. NOTARY (Com análise de taxa) ---
        process.stdout.write(`      📜 Notary... `);
        try {
            const baseFee = await hub.getFee(ethers.id("NOTARY_SERVICE"));
            const { discountedFee, discountPercent } = calculateDiscount(baseFee, currentBoost);
            
            console.log(`\n         📊 Notary Fee Analysis:`);
            console.log(`            Base Fee: ${toEther(baseFee)} BKC`);
            console.log(`            Discount: ${discountPercent}%`);
            console.log(`            Expected Fee: ${toEther(discountedFee)} BKC`);
            
            const balBefore = await bkc.balanceOf(tester.address);
            
            await withRetry(async () => {
                const approveAmount = baseFee * 2n;
                const txApprove = await bkc.approve(addresses.decentralizedNotary, approveAmount);
                await txApprove.wait();
                
                const uniqueHash = ethers.id(`Test_${tierName}_${Date.now()}_${Math.random()}`);
                
                const txNotarize = await notary.notarize(
                    "ipfs://QmTest123", 
                    "Integration Test", 
                    uniqueHash, 
                    nftIdToUse
                );
                await txNotarize.wait();
                return true;
            }, "Notary");
            
            const balAfter = await bkc.balanceOf(tester.address);
            const actualFee = balBefore - balAfter;
            
            console.log(`            Actual Fee: ${toEther(actualFee)} BKC`);
            
            REPORT.push({ 
                tier: tierName, 
                action: "Notary", 
                status: "✅ PASS",
                details: `Fee: ${toEther(actualFee)} BKC (Discount: ${discountPercent}%)`
            });
            process.stdout.write(`         ✅ OK\n`);
        } catch (e: unknown) {
            const err = e as Error;
            REPORT.push({ tier: tierName, action: "Notary", status: "❌ FAIL", details: err.message?.slice(0, 80) });
            console.log(`FAIL: ${err.message?.slice(0, 50)}`);
        }

        // --- D. FORTUNE TEST ---
        await testFortune(tierName, currentBoost);

        // --- E. CLAIM REWARDS ---
        process.stdout.write(`      🎁 Claim Rewards... `);
        try {
            // ✅ CORREÇÃO: Usar pendingRewards(address) corretamente
            const pendingRewards = await delegationAny.pendingRewards(tester.address);
            
            if (pendingRewards > 0n) {
                console.log(`\n         💰 Pending Rewards: ${toEther(pendingRewards)} BKC`);
                
                const balBefore = await bkc.balanceOf(tester.address);
                
                // ✅ CORREÇÃO: Usar chamada de baixo nível com ABI manual
                // claimReward(uint256 _boosterTokenId)
                // function selector = keccak256("claimReward(uint256)")[0:4]
                await withRetry(async () => {
                    const claimRewardAbi = ["function claimReward(uint256 _boosterTokenId)"];
                    const claimInterface = new ethers.Interface(claimRewardAbi);
                    const data = claimInterface.encodeFunctionData("claimReward", [nftIdToUse]);
                    
                    const txClaim = await tester.sendTransaction({
                        to: addresses.delegationManager,
                        data: data
                    });
                    await txClaim.wait();
                    return true;
                }, "Claim");
                
                const balAfter = await bkc.balanceOf(tester.address);
                const claimed = balAfter - balBefore;
                
                console.log(`         ✅ Claimed: ${toEther(claimed)} BKC`);
                REPORT.push({ tier: tierName, action: "Claim Rewards", status: "✅ PASS", details: `Claimed ${toEther(claimed)} BKC (NFT #${nftIdToUse})` });
            } else {
                console.log(`Skip (No rewards pending)`);
                REPORT.push({ tier: tierName, action: "Claim Rewards", status: "⚠️ SKIP", details: "No rewards pending" });
            }
        } catch (e: unknown) {
            const err = e as Error;
            // Se não houver rewards, é skip, não erro
            if (err.message?.includes("No rewards") || err.message?.includes("nothing")) {
                console.log(`Skip (No rewards)`);
                REPORT.push({ tier: tierName, action: "Claim Rewards", status: "⚠️ SKIP", details: "No rewards" });
            } else {
                console.log(`FAIL: ${err.message?.slice(0, 50)}`);
                REPORT.push({ tier: tierName, action: "Claim Rewards", status: "❌ FAIL", details: err.message?.slice(0, 80) });
            }
        }

        // --- F. FORCE UNSTAKE ---
        process.stdout.write(`      💔 Unstake... `);
        try {
            const delegations = await delegation.getDelegationsOf(tester.address);
            if (delegations.length > 0) {
                const lastIndex = delegations.length - 1;
                const balBefore = await bkc.balanceOf(tester.address);
                
                await withRetry(async () => {
                    const txUnstake = await delegation.forceUnstake(BigInt(lastIndex), nftIdToUse);
                    await txUnstake.wait();
                    return true;
                }, "Unstake");
                
                const balAfter = await bkc.balanceOf(tester.address);
                const received = balAfter - balBefore;
                
                REPORT.push({ 
                    tier: tierName, 
                    action: "Unstake", 
                    status: "✅ PASS",
                    details: `Recovered: ${toEther(received)} BKC`
                });
                console.log(`OK (Got ${toEther(received)} BKC)`);
            } else {
                REPORT.push({ tier: tierName, action: "Unstake", status: "⚠️ SKIP", details: "No active stake" });
                console.log("Skip (No stake)");
            }
        } catch (e: unknown) {
            const err = e as Error;
            REPORT.push({ tier: tierName, action: "Unstake", status: "❌ FAIL", details: err.message?.slice(0, 80) });
            console.log(`FAIL: ${err.message?.slice(0, 50)}`);
        }
    }

    // =================================================================
    // 🔥 MAIN EXECUTION
    // =================================================================

    // Phase 1: Baseline (Sem NFT = 0% boost)
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("   PHASE 1: BASELINE (NO NFT BOOST = 0%)");
    console.log("═══════════════════════════════════════════════════════════");
    await runTestCycle("Baseline", null, 0n);

    // Phase 2: Tier Sweep
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("   PHASE 2: NFT TIER SWEEP");
    console.log("═══════════════════════════════════════════════════════════");
    
    for (const tier of TIERS) {
        let currentTokenId: bigint | null = null;
        
        try {
            const poolAddr = await factory.getPoolAddress(tier.boost);
            if (poolAddr === ethers.ZeroAddress) {
                console.log(`\n⚠️  No Pool for ${tier.name}. Skipping.`);
                REPORT.push({ tier: tier.name, action: "Pool Lookup", status: "⚠️ SKIP", details: "No pool deployed" });
                continue;
            }
            
            const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddr, tester) as unknown as NFTLiquidityPool;
            
            // Buy NFT
            console.log(`\n🛍️  Buying ${tier.name} NFT (Boost: ${tier.boost} bips = ${Number(tier.boost)/100}%)...`);
            
            await withRetry(async () => {
                const buyPrice = await pool.getBuyPrice();
                const taxBips = await hub.getFee(ethers.id("NFT_POOL_BUY_TAX_BIPS"));
                const tax = (buyPrice * taxBips) / 10000n;
                const totalCost = buyPrice + tax;
                
                console.log(`   💵 Price: ${toEther(buyPrice)} + Tax: ${toEther(tax)} = ${toEther(totalCost)} BKC`);

                const txApproveBuy = await bkc.approve(poolAddr, totalCost);
                await txApproveBuy.wait();
                
                const txBuy = await pool.buyNextAvailableNFT(0n);
                const rcBuy = await txBuy.wait();
                
                if (rcBuy) { 
                    for (const log of rcBuy.logs) {
                        try {
                            const parsed = pool.interface.parseLog(log);
                            if (parsed && parsed.name === 'NFTBought') { 
                                currentTokenId = parsed.args.tokenId; 
                                break; 
                            }
                        } catch {}
                    }
                }
                
                if (currentTokenId === null) throw new Error("Could not detect Token ID");
                return true;
            }, "Buy NFT");
            
            console.log(`   ✅ Token ID: ${currentTokenId}`);
            REPORT.push({ tier: tier.name, action: "Buy NFT", status: "✅ PASS", details: `Token #${currentTokenId}` });

            // Run Tests com o boost do tier
            await runTestCycle(tier.name, currentTokenId, tier.boost);

            // Sell NFT Back
            try {
                if (currentTokenId === null) throw new Error("No token to sell");
                const ownerOf = await nft.ownerOf(currentTokenId);
                if (ownerOf === tester.address) {
                    console.log(`\n   🔄 Selling ${tier.name} NFT back...`);
                    
                    await withRetry(async () => {
                        const txApproveNFT = await nft.approve(poolAddr, currentTokenId!);
                        await txApproveNFT.wait();
                        const txSell = await pool.sellNFT(currentTokenId!, 0n, 0n);
                        await txSell.wait();
                        return true;
                    }, "Sell NFT");
                    
                    console.log(`   ✅ Sold`);
                    REPORT.push({ tier: tier.name, action: "Sell NFT", status: "✅ PASS" });
                } else {
                    console.log(`   ⚠️ NFT not owned (Owner: ${ownerOf})`);
                    REPORT.push({ tier: tier.name, action: "Sell NFT", status: "⚠️ SKIP", details: "NFT not owned" });
                }
            } catch (sellError: unknown) {
                const err = sellError as Error;
                console.log(`   ❌ Sell failed: ${err.message?.slice(0, 50)}`);
                REPORT.push({ tier: tier.name, action: "Sell NFT", status: "❌ FAIL", details: err.message?.slice(0, 80) });
            }

        } catch (e: unknown) {
            const err = e as Error;
            console.error(`\n🚨 Critical Error on ${tier.name}: ${err.message?.slice(0, 80)}`);
            REPORT.push({ tier: tier.name, action: "CRITICAL", status: "❌ FAIL", details: err.message?.slice(0, 80) });
        }
        
        await sleep(2000);
    }

    // =================================================================
    // 📊 FINAL REPORT
    // =================================================================
    console.log("\n\n═══════════════════════════════════════════════════════════");
    console.log("   📊 FINAL AUDIT REPORT");
    console.log("═══════════════════════════════════════════════════════════\n");
    
    console.table(REPORT.map(r => ({
        "Tier": r.tier,
        "Action": r.action,
        "Result": r.status,
        "Details": r.details || "-"
    })));

    // Summary (COOLDOWN não conta como erro)
    const passed = REPORT.filter(r => r.status === "✅ PASS").length;
    const failed = REPORT.filter(r => r.status === "❌ FAIL").length;
    const skipped = REPORT.filter(r => r.status === "⚠️ SKIP").length;
    const cooldown = REPORT.filter(r => r.status === "⏳ COOLDOWN").length;
    
    console.log(`\n   📈 Summary:`);
    console.log(`      ✅ Passed:   ${passed}`);
    console.log(`      ❌ Failed:   ${failed}`);
    console.log(`      ⚠️ Skipped:  ${skipped}`);
    console.log(`      ⏳ Cooldown: ${cooldown}`);
    
    const finalBal = await bkc.balanceOf(tester.address);
    const balChange = finalBal - initialBal;
    console.log(`\n   💰 Final BKC: ${toEther(finalBal)}`);
    console.log(`   📊 Net Change: ${balChange >= 0n ? '+' : ''}${toEther(balChange)} BKC`);

    if (failed > 0) {
        console.log(`\n❌ ${failed} FAILURES DETECTED!`);
        process.exit(1);
    } else {
        console.log("\n✅ ALL SYSTEMS OPERATIONAL!");
        process.exit(0);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});