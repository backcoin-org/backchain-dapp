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
// ⚙️ CONFIGURAÇÃO GLOBAL
// =================================================================
const FEES = {
    MINT_TAX_BASE: ethers.parseEther("0.0003"), // ETH
    FAUCET_ETH: ethers.parseEther("0.002"),
    FAUCET_BKC: ethers.parseEther("200")
};

const TIERS = [
    { name: "🛡️ Baseline (No NFT)", boost: 0n },
    { name: "🔮 Crystal", boost: 1000n },
    { name: "⚙️ Iron", boost: 2000n },
    { name: "🥉 Bronze", boost: 3000n },
    { name: "🥈 Silver", boost: 4000n },
    { name: "🥇 Gold", boost: 5000n },
    { name: "💿 Platinum", boost: 6000n },
    { name: "💎 Diamond", boost: 7000n }
];

type AuditEntry = {
    tier: string;
    action: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP" | "⏳ WAIT" | "ℹ️ INFO";
    details?: string;
};
const REPORT: AuditEntry[] = [];

// =================================================================
// 🛠️ HELPERS
// =================================================================
const toEther = (val: bigint) => ethers.formatEther(val);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function logSection(title: string) {
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`   ${title}`);
    console.log(`═══════════════════════════════════════════════════════════`);
}

function calculateExpectedFee(baseFee: bigint, boostBips: bigint): bigint {
    const discount = (baseFee * boostBips) / 10000n;
    return baseFee - discount;
}

// Helper para tolerância de "dust" (100 wei)
function isClose(a: bigint, b: bigint, tolerance = 100n): boolean {
    const diff = a > b ? a - b : b - a;
    return diff <= tolerance;
}

// =================================================================
// 🧪 SCRIPT PRINCIPAL
// =================================================================
async function main() {
    const [tester] = await ethers.getSigners();
    if (!tester) throw new Error("Sem signer configurado.");

    console.log(`\n🕵️‍♂️  ECOSYSTEM FULL AUDIT V3.1 (DEBUG MODE)`);
    console.log(`   🧑‍🚀 Tester: ${tester.address}`);

    // 1. Carregar Endereços
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) throw new Error("Arquivo de endereços não encontrado.");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    // 2. Conectar Contratos
    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, tester) as unknown as BKCToken;
    const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, tester) as unknown as EcosystemManager;
    const notary = await ethers.getContractAt("DecentralizedNotary", addresses.decentralizedNotary, tester) as unknown as DecentralizedNotary;
    const delegation = await ethers.getContractAt("DelegationManager", addresses.delegationManager, tester) as unknown as DelegationManager;
    const nft = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, tester) as unknown as RewardBoosterNFT;
    const factory = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, tester) as unknown as NFTLiquidityPoolFactory;
    const faucet = await ethers.getContractAt("SimpleBKCFaucet", addresses.faucet, tester) as unknown as SimpleBKCFaucet;
    const fortune = await ethers.getContractAt("FortunePool", addresses.fortunePool, tester) as unknown as FortunePool;
    const rental = await ethers.getContractAt("RentalManager", addresses.rentalManager, tester) as unknown as RentalManager;

    // Interfaces "Any" para flexibilidade
    const faucetAny = faucet as any;
    const delegationAny = delegation as any;

    // =================================================================
    // 🔁 LOOP DE TIERS
    // =================================================================
    for (const tier of TIERS) {
        await runTestCycle(tier.name, tier.boost);
    }

    async function runTestCycle(tierName: string, boostBips: bigint) {
        logSection(`🚀 TESTING TIER: ${tierName} (Boost: ${Number(boostBips)/100}%)`);
        
        let tokenId: bigint | null = null;
        let poolAddr: string = ethers.ZeroAddress;

        // ---------------------------------------------------------
        // A. SMART FAUCET (Com Fallback para Erro de ABI)
        // ---------------------------------------------------------
        process.stdout.write(`   🚰 [FAUCET] Checking... `);
        try {
            // Tenta ler locktime, se falhar, assume que pode clamar e trata o erro de revert
            let canClaim = true;
            try {
                // Tenta chamar lastAccessTime (padrão)
                const lastAccess = await faucetAny.lastAccessTime(tester.address);
                const interval = await faucetAny.cooldownInterval();
                const now = BigInt((await tester.provider!.getBlock("latest"))!.timestamp);
                if (now < lastAccess + interval) {
                    const waitTime = (lastAccess + interval) - now;
                    console.log(`⏳ Cooldown (${waitTime}s). Skipping.`);
                    REPORT.push({ tier: tierName, action: "Faucet", status: "⏳ WAIT", details: `${waitTime}s` });
                    canClaim = false;
                }
            } catch {
                // Se der erro ao ler a função (ex: nome diferente), tentamos clamar direto
                // Ignoramos o erro de leitura
            }

            if (canClaim) {
                const tx = await faucet.distributeTo(tester.address);
                await tx.wait();
                console.log(`✅ Claimed ${toEther(FEES.FAUCET_BKC)} BKC`);
                REPORT.push({ tier: tierName, action: "Faucet", status: "✅ PASS" });
            }
        } catch (e: any) {
            // Se o erro for de Revert (Cooldown do contrato), marcamos como WAIT
            if (e.message.includes("cooldown") || e.message.includes("Wait")) {
                console.log(`⏳ Contract Reverted (Cooldown).`);
                REPORT.push({ tier: tierName, action: "Faucet", status: "⏳ WAIT" });
            } else {
                console.log(`❌ Error: ${e.message.slice(0, 50)}`);
                REPORT.push({ tier: tierName, action: "Faucet", status: "❌ FAIL", details: "Check ABI/Function Name" });
            }
        }

        // ---------------------------------------------------------
        // B. NFT MARKET & RENTAL
        // ---------------------------------------------------------
        if (boostBips > 0n) {
            try {
                poolAddr = await factory.getPoolAddress(boostBips);
                if (poolAddr === ethers.ZeroAddress) {
                    console.log(`   ⚠️ Pool not found. Skipping.`);
                    return;
                }
                
                const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddr, tester) as unknown as NFTLiquidityPool;
                const buyPrice = await pool.getBuyPrice();
                const taxBips = await hub.getFee(ethers.id("NFT_POOL_BUY_TAX_BIPS"));
                const totalCost = buyPrice + (buyPrice * taxBips) / 10000n;

                console.log(`   🛍️  [MARKET] Buying NFT (Cost: ${toEther(totalCost)} BKC)...`);
                await bkc.approve(poolAddr, totalCost);
                const txBuy = await pool.buyNextAvailableNFT(0n);
                const rcBuy = await txBuy.wait();
                
                const event = rcBuy?.logs.find(l => {
                    try { return pool.interface.parseLog(l)?.name === "NFTBought"; } catch { return false; }
                });
                if (event) {
                    tokenId = pool.interface.parseLog(event)?.args.tokenId;
                    console.log(`      ✅ Bought NFT #${tokenId}`);
                    REPORT.push({ tier: tierName, action: "NFT Buy", status: "✅ PASS", details: `#${tokenId}` });
                }

                // --- TESTE DE RENTAL DEBUGADO ---
                if (tokenId !== null) {
                    console.log(`   🏠 [RENTAL] Testing List/Unlist...`);
                    const rentPrice = ethers.parseEther("10"); 
                    
                    await nft.approve(addresses.rentalManager, tokenId);
                    const txList = await rental.listNFT(tokenId, rentPrice);
                    await txList.wait();
                    
                    const listing = await rental.listings(tokenId);
                    
                    // DEBUG: Verificando o estado real
                    // console.log("      Debug Listing:", listing);

                    // Verifica se está ativo OU se o contrato virou o owner (custódia)
                    if (listing.isActive === true) {
                        console.log(`      ✅ Listed Successfully.`);
                        REPORT.push({ tier: tierName, action: "Rental Test", status: "✅ PASS" });
                    } else {
                        console.log(`      ❌ Listing State Invalid: Active=${listing.isActive}`);
                        REPORT.push({ tier: tierName, action: "Rental Test", status: "❌ FAIL", details: `Active: ${listing.isActive}` });
                    }

                    // Withdraw para usar no teste seguinte
                    const txWith = await rental.withdrawNFT(tokenId);
                    await txWith.wait();
                }

            } catch (e: any) {
                console.log(`   ❌ Market/Rental Error: ${e.message}`);
                REPORT.push({ tier: tierName, action: "NFT/Rental", status: "❌ FAIL" });
                return;
            }
        }

        const nftIdToUse = tokenId === null ? 0n : tokenId;

        // ---------------------------------------------------------
        // C. STAKING (Math Fix: Auto-Claim Detection)
        // ---------------------------------------------------------
        console.log(`   🥩 [STAKING] Delegating...`);
        try {
            const stakeAmount = ethers.parseEther("50");
            const lockTime = 86400 * 30; 
            const baseFeeBips = await hub.getFee(ethers.id("DELEGATION_FEE_BIPS"));
            
            // MATH: Fee esperada
            const feeBase = (stakeAmount * baseFeeBips) / 10000n;
            const expectedFee = calculateExpectedFee(feeBase, boostBips);

            console.log(`      📊 Math: Exp Fee ${toEther(expectedFee)} BKC`);

            const balBefore = await bkc.balanceOf(tester.address);
            
            await bkc.approve(addresses.delegationManager, stakeAmount * 2n);
            const txDel = await delegation.delegate(stakeAmount, lockTime, nftIdToUse);
            const rcDel = await txDel.wait();

            // DETECTAR AUTO-CLAIM (Recompensas sacadas automaticamente)
            let autoClaimedAmount = 0n;
            if (rcDel) {
                for (const log of rcDel.logs) {
                    try {
                        const parsed = delegation.interface.parseLog(log);
                        if (parsed?.name === "RewardClaimed" && parsed.args.user === tester.address) {
                            autoClaimedAmount += parsed.args.amount;
                            console.log(`      💰 Auto-Claimed Rewards: ${toEther(parsed.args.amount)} BKC`);
                        }
                    } catch {}
                }
            }

            const balAfter = await bkc.balanceOf(tester.address);
            
            // CÁLCULO REAL:
            // Delta da Carteira = (O que eu tinha) - (O que eu tenho agora)
            // Esse Delta é composto por: (Stake + Taxa) - (Recompensas Ganhas)
            // Logo: (Stake + Taxa) = Delta + Recompensas
            // Taxa = (Delta + Recompensas) - Stake
            
            const walletDelta = balBefore - balAfter;
            const totalCost = walletDelta + autoClaimedAmount;
            const actualFee = totalCost - stakeAmount;

            if (isClose(actualFee, expectedFee, 10000n)) { // Tolerância pequena
                console.log(`      ✅ MATCH: Paid ${toEther(actualFee)} (vs Exp ${toEther(expectedFee)})`);
                REPORT.push({ tier: tierName, action: "Stake Math", status: "✅ PASS" });
            } else {
                console.warn(`      ❌ MISMATCH: Paid ${toEther(actualFee)} vs Exp ${toEther(expectedFee)}`);
                // Não falha o script inteiro, mas loga erro
                REPORT.push({ tier: tierName, action: "Stake Math", status: "❌ FAIL", details: "Fee Mismatch" });
            }

        } catch (e: any) {
            console.log(`      ❌ Stake Error: ${e.message}`);
            REPORT.push({ tier: tierName, action: "Stake", status: "❌ FAIL" });
        }

        // ---------------------------------------------------------
        // D. NOTARY (Math Check)
        // ---------------------------------------------------------
        try {
            const baseFee = await hub.getFee(ethers.id("NOTARY_SERVICE"));
            const expected = calculateExpectedFee(baseFee, boostBips);
            
            // Só executa se tiver saldo suficiente
            const bal = await bkc.balanceOf(tester.address);
            if (bal > baseFee) {
                console.log(`   📜 [NOTARY] Service Fee Check...`);
                const b4 = await bkc.balanceOf(tester.address);
                await bkc.approve(addresses.decentralizedNotary, baseFee);
                const tx = await notary.notarize("ipfs://x", "Audit", ethers.id(Math.random().toString()), nftIdToUse);
                await tx.wait();
                const a4 = await bkc.balanceOf(tester.address);
                
                const paid = b4 - a4;
                if (isClose(paid, expected)) {
                    REPORT.push({ tier: tierName, action: "Notary Math", status: "✅ PASS" });
                } else {
                    console.log(`      ❌ Notary Mismatch: Paid ${toEther(paid)} vs Exp ${toEther(expected)}`);
                    REPORT.push({ tier: tierName, action: "Notary Math", status: "❌ FAIL" });
                }
            }
        } catch (e) {}

        // ---------------------------------------------------------
        // E. FORTUNE (Game)
        // ---------------------------------------------------------
        console.log(`   🎰 [FORTUNE] Game Test...`);
        try {
            const activeTiers = await (fortune as any).activeTierCount();
            if (activeTiers > 0n) {
                const guesses = Array(Number(activeTiers)).fill(1n);
                const wager = ethers.parseEther("10");
                const oracleFee = await (fortune as any).oracleFeeInWei();

                await bkc.approve(addresses.fortunePool, wager);
                const tx = await (fortune as any).participate(wager, guesses, false, { value: oracleFee });
                const rc = await tx.wait();
                
                // Pegar Game ID
                const evt = rc?.logs.find((l: any) => {
                    try { return fortune.interface.parseLog(l)?.name === "GameRequested"; } catch { return false; }
                });
                
                if (evt) {
                    const gameId = fortune.interface.parseLog(evt)?.args.gameId;
                    console.log(`      🚀 Game #${gameId} Sent. Waiting Oracle...`);
                    
                    let done = false;
                    for(let i=0; i<10; i++) {
                        await sleep(2000);
                        const status = await (fortune as any).getGameStatus(gameId);
                        if (status[1]) {
                            const rolls = status[4];
                            const wins = rolls.filter((r: bigint, idx: number) => r === guesses[idx]).length;
                            console.log(`      🎲 Result: [${rolls}] - ${wins > 0 ? "WIN" : "LOSE"}`);
                            REPORT.push({ tier: tierName, action: "Oracle", status: "✅ PASS" });
                            done = true;
                            break;
                        }
                        process.stdout.write(".");
                    }
                    if(!done) REPORT.push({ tier: tierName, action: "Oracle", status: "⏳ WAIT" });
                }
            }
        } catch (e: any) {
            console.log(`      ❌ Fortune Error: ${e.message}`);
        }

        // ---------------------------------------------------------
        // F. CLEANUP
        // ---------------------------------------------------------
        try {
            const delegations = await delegation.getDelegationsOf(tester.address);
            if (delegations.length > 0) {
                await delegation.forceUnstake(delegations.length - 1, nftIdToUse);
            }
            if (tokenId !== null && boostBips > 0n) {
                const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddr, tester) as unknown as NFTLiquidityPool;
                await nft.approve(poolAddr, tokenId);
                await pool.sellNFT(tokenId, 0n, 0n);
                console.log(`   🧹 Cleanup Done.`);
            }
        } catch {}

        await sleep(500);
    }

    // =================================================================
    // 📊 REPORT
    // =================================================================
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.table(REPORT.map(r => ({
        Tier: r.tier,
        Action: r.action,
        Status: r.status,
        Details: r.details || "-"
    })));
    
    const errors = REPORT.filter(r => r.status === "❌ FAIL").length;
    if (errors > 0) process.exit(1);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});