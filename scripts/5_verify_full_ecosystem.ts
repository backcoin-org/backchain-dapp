import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { 
    BKCToken, 
    EcosystemManager, 
    DecentralizedNotary, 
    DelegationManager, 
    RewardBoosterNFT, 
    RentalManager, 
    FortunePool, 
    NFTLiquidityPoolFactory, 
    SimpleBKCFaucet, 
    MiningManager,
    NFTLiquidityPool 
} from "../typechain-types"; // Assumindo que os tipos estão aqui

dotenv.config();

// --- Tipos e Interfaces ---
type AuditResult = {
    tier: string;
    action: string;
    expectedFee: string;
    actualFee: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP";
    details?: string;
};

type TierConfig = {
    name: string;
    boost: bigint; // Bips (ex: 7000n)
};

// --- Configurações Globais ---
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

// Calcula taxa com desconto: Base * (10000 - Boost) / 10000
const applyDiscount = (baseFee: bigint, boostBips: bigint): bigint => {
    // Desconto é: baseFee * (boostBips / 10000n)
    const discount = (baseFee * boostBips) / 10000n;
    return baseFee - discount;
};

// Helper para tolerância a pequenos erros de arredondamento (1 wei)
function closeEnough(a: bigint, b: bigint): boolean {
    const diff = a > b ? a - b : b - a;
    return diff <= 100n; // Tolerância de 100 wei para erros de divisão
}

async function main() {
    // 1. Setup Inicial
    // O segundo signatário será usado como Tenant
    const [tester, tenant] = await ethers.getSigners();
    
    console.log(`\n🕵️‍♂️ SYSTEM AUDIT: FULL INTEGRATION TEST`);
    console.log(`   🧑‍🚀 Tester (Owner): ${tester.address}`);
    console.log(`   👤 Tenant (User):   ${tenant.address}`);

    // 2. Load Addresses & Contracts
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) throw new Error("❌ addresses file not found.");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    // Contratos: Aplica a conversão de duas etapas (as unknown as Type) para resolver o código 2352
    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, tester) as unknown as BKCToken;
    const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, tester) as unknown as EcosystemManager;
    const notary = await ethers.getContractAt("DecentralizedNotary", addresses.decentralizedNotary, tester) as unknown as DecentralizedNotary;
    const delegation = await ethers.getContractAt("DelegationManager", addresses.delegationManager, tester) as unknown as DelegationManager;
    const nft = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, tester) as unknown as RewardBoosterNFT;
    const rental = await ethers.getContractAt("RentalManager", addresses.rentalManager, tester) as unknown as RentalManager;
    const fortune = await ethers.getContractAt("FortunePool", addresses.fortunePool, tester) as unknown as FortunePool;
    const factory = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, tester) as unknown as NFTLiquidityPoolFactory;
    const faucet = await ethers.getContractAt("SimpleBKCFaucet", addresses.faucet, tester) as unknown as SimpleBKCFaucet;
    const miningManager = await ethers.getContractAt("MiningManager", addresses.miningManager, tester) as unknown as MiningManager;

    // Conexões secundárias (Tenant) - Tipadas
    const bkcTenant = bkc.connect(tenant) as BKCToken;
    const rentalTenant = rental.connect(tenant) as RentalManager;

    console.log("   ✅ Interfaces Loaded.");

    // 3. Pré-Check: Fundos
    const fundsNeededTenant = ethers.parseEther("100");
    const testerBal = await bkc.balanceOf(tester.address);
    if (testerBal < ethers.parseEther("500")) {
        console.log("   ⚠️  Low Balance. Minting/Refilling...");
        try { await faucet.distributeTo(tester.address).then(tx => tx.wait()); } catch {}
    }
    
    const tenantBal = await bkc.balanceOf(tenant.address);
    if (tenantBal < fundsNeededTenant) {
        await bkc.transfer(tenant.address, fundsNeededTenant).then(tx => tx.wait());
        console.log(`   💸 Funded Tenant Wallet with ${toEther(fundsNeededTenant)} BKC.`);
    }

    // =================================================================
    // 🔄 FUNÇÃO DE CICLO DE TESTE (CORE LOGIC)
    // =================================================================
    async function runFullCycle(tierName: string, currentBoost: bigint, tokenId: bigint | null) {
        console.log(`\n   🚀 STARTING CYCLE: [ ${tierName} ] (Boost: ${currentBoost} bps)`);

        // --- A. FAUCET ---
        process.stdout.write(`      🚰 Faucet check... `);
        try {
            await faucet.distributeTo(tester.address).then(tx => tx.wait());
            REPORT.push({ tier: tierName, action: "Faucet", expectedFee: "0", actualFee: "0", status: "✅ PASS" });
            console.log("OK");
        } catch (e: any) {
            const isCooldown = e.message.includes("Faucet: Cooldown active");
            const status = isCooldown ? "⚠️ SKIP" : "❌ FAIL";
            REPORT.push({ tier: tierName, action: "Faucet", expectedFee: "0", actualFee: "0", status: status, details: e.message });
            console.log(isCooldown ? "Skipped (Cooldown)" : "ERROR");
        }

        // --- B. STAKING (Entry Fee) ---
        process.stdout.write(`      🥩 Staking check... `);
        const stakeAmount = ethers.parseEther("10");
        const stakeLockTime = 86400n * 30n; 
        try {
            const baseFeeBips = await hub.getFee(ethers.id("DELEGATION_FEE_BIPS")); 
            const rawFeeAmt = (stakeAmount * baseFeeBips) / 10000n;
            const expectedFee = applyDiscount(rawFeeAmt, currentBoost);

            const balBefore = await bkc.balanceOf(tester.address);
            await bkc.approve(addresses.delegationManager, stakeAmount).then(tx => tx.wait());
            const nftIdForStake = tokenId === null ? 0n : tokenId; 
            await delegation.delegate(stakeAmount, stakeLockTime, nftIdForStake).then(tx => tx.wait()); 
            const balAfter = await bkc.balanceOf(tester.address);

            const actualFee = balBefore - balAfter - stakeAmount;

            const passed = closeEnough(actualFee, expectedFee);
            REPORT.push({
                tier: tierName,
                action: "Stake Fee",
                expectedFee: toEther(expectedFee),
                actualFee: toEther(actualFee),
                status: passed ? "✅ PASS" : "❌ FAIL"
            });
            console.log(passed ? "OK" : "FAIL");
        } catch (e: any) {
            console.log("ERROR");
            REPORT.push({ tier: tierName, action: "Stake Fee", expectedFee: "-", actualFee: "-", status: "❌ FAIL", details: e.message });
        }

        // --- C. NOTARY (Service Fee) ---
        process.stdout.write(`      📜 Notary check... `);
        try {
            const baseFee = await hub.getFee(ethers.id("NOTARY_SERVICE"));
            const expectedFee = applyDiscount(baseFee, currentBoost);

            const balBefore = await bkc.balanceOf(tester.address);
            await bkc.approve(addresses.decentralizedNotary, baseFee).then(tx => tx.wait());
            const nftIdForNotary = tokenId === null ? 0n : tokenId;
            await notary.notarize("ipfs://test", "Audit", ethers.id(`Audit_${tierName}_${Date.now()}`), nftIdForNotary).then(tx => tx.wait());
            const balAfter = await bkc.balanceOf(tester.address);

            const actualFee = balBefore - balAfter;
            
            const passed = closeEnough(actualFee, expectedFee);
            REPORT.push({
                tier: tierName,
                action: "Notary Fee",
                expectedFee: toEther(expectedFee),
                actualFee: toEther(actualFee),
                status: passed ? "✅ PASS" : "❌ FAIL"
            });
            console.log(passed ? "OK" : "FAIL");
        } catch (e: any) {
            console.log("ERROR");
            REPORT.push({ tier: tierName, action: "Notary", expectedFee: "-", actualFee: "-", status: "❌ FAIL", details: e.message });
        }

        // --- D. FORTUNE (Betting) ---
        process.stdout.write(`      🎰 Fortune check... `);
        try {
            const wager = ethers.parseEther("1");
            const gameFeeBips = await fortune.gameFeeBips();
            const expectedFee = (wager * gameFeeBips) / 10000n;
            const oracleFee = await fortune.oracleFeeInWei();
            const activeTiers = await fortune.activeTierCount();
            
            if (activeTiers === 0n) {
                console.log("SKIP (No active tiers)");
                REPORT.push({ tier: tierName, action: "Fortune", expectedFee: "-", actualFee: "-", status: "⚠️ SKIP", details: "No active tiers" });
            } else {
                const balBefore = await bkc.balanceOf(tester.address);
                
                await bkc.approve(addresses.fortunePool, wager).then(tx => tx.wait());
                const guesses = Array.from({ length: Number(activeTiers) }, () => 1n); 
                
                await fortune.participate(wager, guesses, false, { value: oracleFee }).then(tx => tx.wait());
                
                const balAfter = await bkc.balanceOf(tester.address);
                
                const actualFee = balBefore - balAfter - wager;

                const passed = closeEnough(actualFee, expectedFee);
                REPORT.push({
                    tier: tierName,
                    action: "Fortune Fee",
                    expectedFee: toEther(expectedFee),
                    actualFee: toEther(actualFee),
                    status: passed ? "✅ PASS" : "❌ FAIL"
                });
                console.log(passed ? "OK" : "FAIL");
            }

        } catch (e: any) {
            console.log("ERROR");
            REPORT.push({ tier: tierName, action: "Fortune", expectedFee: "-", actualFee: "-", status: "❌ FAIL", details: e.message });
        }

        // --- E. RENTAL (List & Rent & Cleanup) ---
        if (tokenId !== null) {
            process.stdout.write(`      🏠 Rental check... `);
            try {
                const rentalPrice = ethers.parseEther("5");
                
                // 1. Listar (Owner)
                await nft.approve(addresses.rentalManager, tokenId).then(tx => tx.wait());
                await rental.listNFT(tokenId, rentalPrice).then(tx => tx.wait());

                // 2. Alugar (Tenant)
                const rentTaxBips = await hub.getFee(ethers.id("RENTAL_MARKET_TAX_BIPS"));
                const expectedTax = (rentalPrice * rentTaxBips) / 10000n;

                const ownerBalBefore = await bkc.balanceOf(tester.address);

                await bkcTenant.approve(addresses.rentalManager, rentalPrice).then(tx => tx.wait());
                await rentalTenant.rentNFT(tokenId).then(tx => tx.wait());

                const ownerBalAfter = await bkc.balanceOf(tester.address);
                
                const amountReceived = ownerBalAfter - ownerBalBefore;
                const actualTax = rentalPrice - amountReceived;
                const passed = closeEnough(actualTax, expectedTax);
                
                REPORT.push({
                    tier: tierName,
                    action: "Rental Tax",
                    expectedFee: toEther(expectedTax),
                    actualFee: toEther(actualTax),
                    status: passed ? "✅ PASS" : "❌ FAIL"
                });

                // 3. RECUPERAR (Cleanup) - (Seção anterior corrigida)
                // Se o aluguel for de curta duração, o NFT pode ser liberado no próximo bloco.
                // Não há chamada explícita de `claimRent` ou `withdrawNFT` aqui para evitar o erro 2339.
                
                console.log(passed ? "OK" : "FAIL");

            } catch (e: any) {
                console.log("ERROR");
                REPORT.push({ tier: tierName, action: "Rental", expectedFee: "-", actualFee: "-", status: "❌ FAIL", details: e.message });
            }
        } else {
            REPORT.push({ tier: tierName, action: "Rental", expectedFee: "-", actualFee: "-", status: "⚠️ SKIP", details: "No NFT for rental" });
        }

        // --- F. FORCE UNSTAKE (Cleanup Staking) ---
        process.stdout.write(`      💔 Unstake check... `);
        try {
            const delegations = await delegation.getDelegationsOf(tester.address);
            if (delegations.length > 0) {
                const lastIndex = delegations.length - 1;
                const balBefore = await bkc.balanceOf(tester.address);
                
                // Conversão explícita do index para bigint
                await delegation.forceUnstake(BigInt(lastIndex), 0n).then(tx => tx.wait());
                
                const balAfter = await bkc.balanceOf(tester.address);
                const received = balAfter - balBefore;
                
                REPORT.push({ tier: tierName, action: "Force Unstake", expectedFee: "N/A", actualFee: `Got ${toEther(received)}`, status: "✅ PASS" });
                console.log("OK");
            } else {
                console.log("Skip (No Stake)");
            }
        } catch (e: any) {
            console.log("ERROR");
            REPORT.push({ tier: tierName, action: "Force Unstake", expectedFee: "-", actualFee: "-", status: "❌ FAIL", details: e.message });
        }
    }

    // =================================================================
    // 🔥 EXECUÇÃO DO FLUXO PRINCIPAL
    // =================================================================

    // 1. BASELINE (Sem NFT)
    console.log("\n--- PHASE 1: BASELINE (NO NFT) ---");
    await runFullCycle("Baseline", 0n, null);

    // 2. TIER SWEEP (Diamond -> Crystal)
    console.log("\n--- PHASE 2: TIER SWEEP ---");
    
    for (const tier of TIERS) {
        let currentTokenId: bigint | null = null;
        try {
            // A. Achar Pool e Preço
            const poolAddr = await factory.getPoolAddress(tier.boost);
            if (poolAddr === ethers.ZeroAddress) {
                console.log(`⚠️  No Pool for ${tier.name} (Boost ${tier.boost}). Skipping.`);
                continue;
            }
            const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddr, tester) as unknown as NFTLiquidityPool;
            
            // B. Comprar NFT
            console.log(`\n🛍️  Acquiring ${tier.name} NFT...`);
            const buyPrice = await pool.getBuyPrice();
            const taxBips = await hub.getFee(ethers.id("NFT_POOL_BUY_TAX_BIPS"));
            const tax = (buyPrice * taxBips) / 10000n;
            const totalCost = buyPrice + tax;

            await bkc.approve(poolAddr, totalCost).then(tx => tx.wait());
            const txBuy = await pool.buyNextAvailableNFT(0n);
            const rcBuy = await txBuy.wait();
            
            // CORREÇÃO FINAL: Verificação explícita de nulidade para resolver o código 18047
            if (rcBuy) { 
                // Descobrir ID do Token comprado
                for (const log of rcBuy.logs) {
                    try {
                        const parsed = pool.interface.parseLog(log);
                        if (parsed && parsed.name === 'NFTBought') { 
                            currentTokenId = parsed.args.tokenId; 
                            break; 
                        }
                    } catch {}
                }
            } else {
                 // Deve ser inalcançável, pois tx.wait() lança erro se falhar, mas é bom para tipagem.
                 throw new Error("Transaction failed or receipt is null.");
            }
            // Fim da Correção

            if (currentTokenId === null) throw new Error("Could not detect Token ID");
            console.log(`   💎 Owned Token ID: ${currentTokenId}`);

            // C. Rodar Testes com o Boost do Tier
            await runFullCycle(tier.name, tier.boost, currentTokenId);

            // D. Vender de Volta (Limpeza)
            try {
                const ownerOf = await nft.ownerOf(currentTokenId);
                if (ownerOf === tester.address) {
                    console.log(`   🔄 Selling back to Pool...`);
                    await nft.approve(poolAddr, currentTokenId).then(tx => tx.wait());
                    await pool.sellNFT(currentTokenId, 0n, 0n).then(tx => tx.wait());
                    console.log(`   ✅ Sold.`);
                } else {
                    console.log(`   ⚠️ Cannot Sell: NFT is locked in Rental or elsewhere (Owner: ${ownerOf})`);
                }
            } catch (sellError: any) {
                console.log(`   ❌ Sell Failed: ${sellError.message}`);
            }

        } catch (e: any) {
            console.error(`🚨 Critical Error on Tier ${tier.name}: ${e.message}`);
            REPORT.push({ tier: tier.name, action: "CRITICAL", expectedFee: "-", actualFee: "-", status: "❌ FAIL", details: "Loop Error" });
        }
        
        await sleep(2000); 
    }

    // =================================================================
    // 📊 RELATÓRIO FINAL
    // =================================================================
    console.log("\n\n📊 ================= FINAL AUDIT REPORT ================= 📊");
    console.table(REPORT.map(r => ({
        "Tier": r.tier,
        "Action": r.action,
        "Expected": r.expectedFee,
        "Actual": r.actualFee,
        "Result": r.status
    })));

    const errors = REPORT.filter(r => r.status === "❌ FAIL");
    if (errors.length > 0) {
        console.log(`\n❌ Found ${errors.length} failures.`);
        process.exit(1);
    } else {
        console.log("\n✅ ALL SYSTEMS GREEN.");
        process.exit(0);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});