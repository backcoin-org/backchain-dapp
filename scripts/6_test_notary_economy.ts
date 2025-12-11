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
    NFTLiquidityPool
} from "../typechain-types";

dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════
// 📋 TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface TierTestResult {
    tierName: string;
    boostBips: bigint;
    expectedDiscountBips: bigint;
    actualDiscountBips: bigint;
    
    // Taxas do Notary
    notaryBaseFee: bigint;
    notaryExpectedFee: bigint;
    notaryActualFee: bigint;
    notaryDiscrepancy: bigint;
    
    // Claim Rewards
    pendingRewardsBefore: bigint;
    claimedAmount: bigint;
    claimFeeExpected: bigint;
    claimFeeActual: bigint;
    claimDiscrepancy: bigint;
    
    // Status
    buyNftSuccess: boolean;
    notarySuccess: boolean;
    claimSuccess: boolean;
    sellNftSuccess: boolean;
    
    // Erros
    errors: string[];
}

interface EconomyReport {
    testDate: string;
    testerAddress: string;
    delegationAmount: bigint;
    
    // Configuração do Sistema
    notaryServiceFee: bigint;
    claimRewardFeeBips: bigint;
    configuredDiscounts: Map<bigint, bigint>;
    
    // Resultados por Tier
    tierResults: TierTestResult[];
    
    // Análise
    totalTests: number;
    passedTests: number;
    failedTests: number;
    
    // Problemas Identificados
    issues: string[];
    recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ⚙️ CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

const TIERS = [
    { name: "🔮 Crystal", boost: 1000n, expectedDiscount: 1000n },
    { name: "⚙️ Iron", boost: 2000n, expectedDiscount: 2000n },
    { name: "🥉 Bronze", boost: 3000n, expectedDiscount: 3000n },
    { name: "🥈 Silver", boost: 4000n, expectedDiscount: 4000n },
    { name: "🥇 Gold", boost: 5000n, expectedDiscount: 5000n },
    { name: "💿 Platinum", boost: 6000n, expectedDiscount: 6000n },
    { name: "💎 Diamond", boost: 7000n, expectedDiscount: 7000n }
];

const DELEGATION_AMOUNT = ethers.parseEther("100"); // 100 BKC
const DELEGATION_LOCK_TIME = 86400n * 30n; // 30 dias

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════════════

const toEther = (val: bigint) => ethers.formatEther(val);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function calculateExpectedFee(baseFee: bigint, discountBips: bigint): bigint {
    if (discountBips >= 10000n) return 0n;
    const discount = (baseFee * discountBips) / 10000n;
    return baseFee - discount;
}

function bipsToPercent(bips: bigint): string {
    return `${Number(bips) / 100}%`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
    console.log("\n");
    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║     🔍 NOTARY ECONOMY TEST - DISCOUNT VALIDATION              ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SETUP
    // ─────────────────────────────────────────────────────────────────────────
    
    const signers = await ethers.getSigners();
    const tester = signers[0];
    
    if (!tester) {
        throw new Error("❌ Nenhum signer disponível!");
    }

    console.log(`📅 Data: ${new Date().toISOString()}`);
    console.log(`👤 Tester: ${tester.address}\n`);

    // Carregar endereços
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error("❌ deployment-addresses.json não encontrado");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    // Carregar contratos
    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, tester) as unknown as BKCToken;
    const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, tester) as unknown as EcosystemManager;
    const notary = await ethers.getContractAt("DecentralizedNotary", addresses.decentralizedNotary, tester) as unknown as DecentralizedNotary;
    const delegation = await ethers.getContractAt("DelegationManager", addresses.delegationManager, tester) as unknown as DelegationManager;
    const nft = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, tester) as unknown as RewardBoosterNFT;
    const factory = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, tester) as unknown as NFTLiquidityPoolFactory;

    const hubAny = hub as any;
    const delegationAny = delegation as any;

    console.log("✅ Contratos carregados\n");

    // ─────────────────────────────────────────────────────────────────────────
    // 2. LER CONFIGURAÇÃO DO SISTEMA
    // ─────────────────────────────────────────────────────────────────────────
    
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("   📊 CONFIGURAÇÃO DO SISTEMA");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const notaryServiceFee = await hub.getFee(ethers.id("NOTARY_SERVICE"));
    const claimRewardFeeBips = await hub.getFee(ethers.id("CLAIM_REWARD_FEE_BIPS"));
    const delegationFeeBips = await hub.getFee(ethers.id("DELEGATION_FEE_BIPS"));
    
    console.log(`   💰 Taxa Base Notary: ${toEther(notaryServiceFee)} BKC`);
    console.log(`   📊 Taxa Claim Reward: ${claimRewardFeeBips} bips (${bipsToPercent(claimRewardFeeBips)})`);
    console.log(`   📊 Taxa Delegation: ${delegationFeeBips} bips (${bipsToPercent(delegationFeeBips)})`);
    
    // Verificar descontos configurados para cada tier
    console.log("\n   🎯 Descontos Configurados por Tier:\n");
    
    const configuredDiscounts = new Map<bigint, bigint>();
    const issues: string[] = [];
    
    for (const tier of TIERS) {
        const discount = await hubAny.boosterDiscounts(tier.boost);
        configuredDiscounts.set(tier.boost, discount);
        
        const status = discount === tier.expectedDiscount ? "✅" : "⚠️";
        console.log(`      ${tier.name}: Boost ${tier.boost} → Discount ${discount} bips (${bipsToPercent(discount)}) ${status}`);
        
        if (discount !== tier.expectedDiscount) {
            issues.push(`${tier.name}: Desconto configurado (${discount}) ≠ esperado (${tier.expectedDiscount})`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. VERIFICAR SALDO INICIAL
    // ─────────────────────────────────────────────────────────────────────────
    
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   💰 SALDO INICIAL");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const initialBalance = await bkc.balanceOf(tester.address);
    console.log(`   💵 BKC Balance: ${toEther(initialBalance)} BKC`);
    
    const requiredBalance = DELEGATION_AMOUNT + ethers.parseEther("50000"); // margem para compras
    if (initialBalance < requiredBalance) {
        console.log(`   ⚠️ Saldo pode ser insuficiente para todos os testes`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. REALIZAR DELEGAÇÃO INICIAL
    // ─────────────────────────────────────────────────────────────────────────
    
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   🥩 DELEGAÇÃO INICIAL (Para gerar rewards)");
    console.log("═══════════════════════════════════════════════════════════════\n");

    try {
        console.log(`   📝 Delegando ${toEther(DELEGATION_AMOUNT)} BKC por 30 dias...`);
        
        const txApprove = await bkc.approve(addresses.delegationManager, DELEGATION_AMOUNT * 2n);
        await txApprove.wait();
        
        const txDelegate = await delegation.delegate(DELEGATION_AMOUNT, DELEGATION_LOCK_TIME, 0n);
        await txDelegate.wait();
        
        console.log(`   ✅ Delegação realizada com sucesso!`);
        
        // Verificar delegação
        const delegations = await delegation.getDelegationsOf(tester.address);
        console.log(`   📊 Total de delegações ativas: ${delegations.length}`);
        
    } catch (e: unknown) {
        const err = e as Error;
        console.log(`   ❌ Erro na delegação: ${err.message?.slice(0, 100)}`);
        issues.push(`Delegação inicial falhou: ${err.message?.slice(0, 50)}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. TESTAR CADA TIER
    // ─────────────────────────────────────────────────────────────────────────
    
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   🧪 TESTE DE TIERS - NOTARY + CLAIM");
    console.log("═══════════════════════════════════════════════════════════════");

    const tierResults: TierTestResult[] = [];

    for (const tier of TIERS) {
        console.log(`\n┌─────────────────────────────────────────────────────────────┐`);
        console.log(`│  ${tier.name.padEnd(15)} (Boost: ${tier.boost} bips = ${bipsToPercent(tier.boost).padEnd(5)})    │`);
        console.log(`└─────────────────────────────────────────────────────────────┘\n`);

        const result: TierTestResult = {
            tierName: tier.name,
            boostBips: tier.boost,
            expectedDiscountBips: tier.expectedDiscount,
            actualDiscountBips: configuredDiscounts.get(tier.boost) || 0n,
            
            notaryBaseFee: notaryServiceFee,
            notaryExpectedFee: 0n,
            notaryActualFee: 0n,
            notaryDiscrepancy: 0n,
            
            pendingRewardsBefore: 0n,
            claimedAmount: 0n,
            claimFeeExpected: 0n,
            claimFeeActual: 0n,
            claimDiscrepancy: 0n,
            
            buyNftSuccess: false,
            notarySuccess: false,
            claimSuccess: false,
            sellNftSuccess: false,
            
            errors: []
        };

        let currentTokenId: bigint | null = null;
        let poolAddr: string = ethers.ZeroAddress;

        // ─── 5.1 COMPRAR NFT ───
        console.log(`   🛒 Comprando NFT...`);
        try {
            poolAddr = await factory.getPoolAddress(tier.boost);
            
            if (poolAddr === ethers.ZeroAddress) {
                console.log(`      ❌ Pool não encontrado para este tier`);
                result.errors.push("Pool não encontrado");
                tierResults.push(result);
                continue;
            }

            const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddr, tester) as unknown as NFTLiquidityPool;
            
            const buyPrice = await pool.getBuyPrice();
            const taxBips = await hub.getFee(ethers.id("NFT_POOL_BUY_TAX_BIPS"));
            const tax = (buyPrice * taxBips) / 10000n;
            const totalCost = buyPrice + tax;

            console.log(`      💵 Preço: ${toEther(buyPrice)} + Taxa: ${toEther(tax)} = ${toEther(totalCost)} BKC`);

            const txApprove = await bkc.approve(poolAddr, totalCost);
            await txApprove.wait();

            const txBuy = await pool.buyNextAvailableNFT(0n);
            const rcBuy = await txBuy.wait();

            // Encontrar o Token ID
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

            if (currentTokenId === null) {
                throw new Error("Token ID não detectado");
            }

            // Verificar boostBips do NFT
            const nftBoost = await nft.boostBips(currentTokenId);
            console.log(`      ✅ NFT #${currentTokenId} comprado (Boost: ${nftBoost} bips)`);
            
            if (nftBoost !== tier.boost) {
                result.errors.push(`Boost do NFT (${nftBoost}) ≠ esperado (${tier.boost})`);
            }
            
            result.buyNftSuccess = true;

        } catch (e: unknown) {
            const err = e as Error;
            console.log(`      ❌ Erro: ${err.message?.slice(0, 60)}`);
            result.errors.push(`Compra NFT: ${err.message?.slice(0, 50)}`);
            tierResults.push(result);
            continue;
        }

        await sleep(2000);

        // ─── 5.2 NOTARIZAÇÃO ───
        console.log(`\n   📜 Testando Notarização...`);
        try {
            const discountBips = configuredDiscounts.get(tier.boost) || 0n;
            result.notaryExpectedFee = calculateExpectedFee(notaryServiceFee, discountBips);
            
            console.log(`      📊 Taxa Base: ${toEther(notaryServiceFee)} BKC`);
            console.log(`      📊 Desconto: ${bipsToPercent(discountBips)}`);
            console.log(`      📊 Taxa Esperada: ${toEther(result.notaryExpectedFee)} BKC`);

            const balBefore = await bkc.balanceOf(tester.address);

            // Aprovar e notarizar
            const txApprove = await bkc.approve(addresses.decentralizedNotary, notaryServiceFee * 2n);
            await txApprove.wait();

            const uniqueHash = ethers.id(`NotaryTest_${tier.name}_${Date.now()}_${Math.random()}`);
            
            const txNotarize = await notary.notarize(
                "ipfs://QmTestNotary123",
                `Test ${tier.name}`,
                uniqueHash,
                currentTokenId!
            );
            await txNotarize.wait();

            const balAfter = await bkc.balanceOf(tester.address);
            result.notaryActualFee = balBefore - balAfter;
            result.notaryDiscrepancy = result.notaryActualFee - result.notaryExpectedFee;

            console.log(`      💵 Taxa Real: ${toEther(result.notaryActualFee)} BKC`);
            
            if (result.notaryDiscrepancy !== 0n) {
                const discrepancyPercent = (Number(result.notaryDiscrepancy) / Number(result.notaryExpectedFee) * 100).toFixed(2);
                console.log(`      ⚠️ Discrepância: ${toEther(result.notaryDiscrepancy)} BKC (${discrepancyPercent}%)`);
                result.errors.push(`Notary: Discrepância de ${toEther(result.notaryDiscrepancy)} BKC`);
            } else {
                console.log(`      ✅ Taxa correta!`);
            }

            result.notarySuccess = true;

        } catch (e: unknown) {
            const err = e as Error;
            console.log(`      ❌ Erro: ${err.message?.slice(0, 60)}`);
            result.errors.push(`Notary: ${err.message?.slice(0, 50)}`);
        }

        await sleep(2000);

        // ─── 5.3 CLAIM REWARDS ───
        console.log(`\n   🎁 Testando Claim Rewards...`);
        try {
            result.pendingRewardsBefore = await delegationAny.pendingRewards(tester.address);
            
            if (result.pendingRewardsBefore > 0n) {
                console.log(`      💰 Rewards Pendentes: ${toEther(result.pendingRewardsBefore)} BKC`);
                
                const discountBips = configuredDiscounts.get(tier.boost) || 0n;
                const baseFee = (result.pendingRewardsBefore * claimRewardFeeBips) / 10000n;
                result.claimFeeExpected = calculateExpectedFee(baseFee, discountBips);
                
                console.log(`      📊 Taxa Base Claim: ${bipsToPercent(claimRewardFeeBips)} = ${toEther(baseFee)} BKC`);
                console.log(`      📊 Taxa Esperada (com desconto): ${toEther(result.claimFeeExpected)} BKC`);

                const balBefore = await bkc.balanceOf(tester.address);

                // Chamar claimReward com o tokenId
                const claimRewardAbi = ["function claimReward(uint256 _boosterTokenId)"];
                const claimInterface = new ethers.Interface(claimRewardAbi);
                const data = claimInterface.encodeFunctionData("claimReward", [currentTokenId!]);
                
                const txClaim = await tester.sendTransaction({
                    to: addresses.delegationManager,
                    data: data
                });
                await txClaim.wait();

                const balAfter = await bkc.balanceOf(tester.address);
                result.claimedAmount = balAfter - balBefore;
                
                // Taxa real = rewards - claimed
                result.claimFeeActual = result.pendingRewardsBefore - result.claimedAmount;
                result.claimDiscrepancy = result.claimFeeActual - result.claimFeeExpected;

                console.log(`      💵 Recebido: ${toEther(result.claimedAmount)} BKC`);
                console.log(`      💵 Taxa Real: ${toEther(result.claimFeeActual)} BKC`);
                
                if (result.claimDiscrepancy !== 0n) {
                    console.log(`      ⚠️ Discrepância: ${toEther(result.claimDiscrepancy)} BKC`);
                    result.errors.push(`Claim: Discrepância de ${toEther(result.claimDiscrepancy)} BKC`);
                } else {
                    console.log(`      ✅ Taxa correta!`);
                }

                result.claimSuccess = true;
            } else {
                console.log(`      ⏭️ Sem rewards pendentes`);
                result.claimSuccess = true; // Não é erro, apenas não há rewards
            }

        } catch (e: unknown) {
            const err = e as Error;
            console.log(`      ❌ Erro: ${err.message?.slice(0, 60)}`);
            result.errors.push(`Claim: ${err.message?.slice(0, 50)}`);
        }

        await sleep(2000);

        // ─── 5.4 VENDER NFT ───
        console.log(`\n   🔄 Vendendo NFT de volta...`);
        try {
            if (currentTokenId === null) throw new Error("Token ID não disponível");
            
            const ownerOf = await nft.ownerOf(currentTokenId);
            if (ownerOf !== tester.address) {
                throw new Error("NFT não pertence ao tester");
            }

            const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddr, tester) as unknown as NFTLiquidityPool;

            const txApprove = await nft.approve(poolAddr, currentTokenId);
            await txApprove.wait();

            const txSell = await pool.sellNFT(currentTokenId, 0n, 0n);
            await txSell.wait();

            console.log(`      ✅ NFT #${currentTokenId} vendido`);
            result.sellNftSuccess = true;

        } catch (e: unknown) {
            const err = e as Error;
            console.log(`      ❌ Erro: ${err.message?.slice(0, 60)}`);
            result.errors.push(`Venda NFT: ${err.message?.slice(0, 50)}`);
        }

        tierResults.push(result);
        await sleep(3000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. DESFAZER DELEGAÇÃO
    // ─────────────────────────────────────────────────────────────────────────
    
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   💔 DESFAZENDO DELEGAÇÃO");
    console.log("═══════════════════════════════════════════════════════════════\n");

    try {
        const delegations = await delegation.getDelegationsOf(tester.address);
        if (delegations.length > 0) {
            const txUnstake = await delegation.forceUnstake(BigInt(delegations.length - 1), 0n);
            await txUnstake.wait();
            console.log("   ✅ Delegação desfeita");
        }
    } catch (e: unknown) {
        const err = e as Error;
        console.log(`   ⚠️ Erro ao desfazer delegação: ${err.message?.slice(0, 50)}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. GERAR RELATÓRIO FINAL
    // ─────────────────────────────────────────────────────────────────────────
    
    console.log("\n\n");
    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║              📊 RELATÓRIO FINAL DE ECONOMIA                   ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    // Tabela de Resultados do Notary
    console.log("┌────────────────┬───────────┬───────────────┬───────────────┬───────────────┬──────────┐");
    console.log("│ Tier           │ Boost     │ Taxa Base     │ Taxa Esperada │ Taxa Real     │ Status   │");
    console.log("├────────────────┼───────────┼───────────────┼───────────────┼───────────────┼──────────┤");

    let passedNotary = 0;
    let failedNotary = 0;

    for (const r of tierResults) {
        const boost = bipsToPercent(r.boostBips).padEnd(8);
        const base = toEther(r.notaryBaseFee).slice(0, 8).padEnd(12);
        const expected = toEther(r.notaryExpectedFee).slice(0, 10).padEnd(12);
        const actual = toEther(r.notaryActualFee).slice(0, 10).padEnd(12);
        
        let status = "⚠️ SKIP";
        if (r.notarySuccess) {
            if (r.notaryDiscrepancy === 0n) {
                status = "✅ PASS";
                passedNotary++;
            } else {
                status = "⚠️ DIFF";
                failedNotary++;
            }
        } else {
            status = "❌ FAIL";
            failedNotary++;
        }

        console.log(`│ ${r.tierName.padEnd(14)} │ ${boost} │ ${base} │ ${expected} │ ${actual} │ ${status.padEnd(8)} │`);
    }

    console.log("└────────────────┴───────────┴───────────────┴───────────────┴───────────────┴──────────┘");

    // Tabela de Resultados do Claim
    console.log("\n┌────────────────┬───────────────┬───────────────┬───────────────┬───────────────┬──────────┐");
    console.log("│ Tier           │ Rewards       │ Taxa Esperada │ Taxa Real     │ Recebido      │ Status   │");
    console.log("├────────────────┼───────────────┼───────────────┼───────────────┼───────────────┼──────────┤");

    let passedClaim = 0;
    let failedClaim = 0;

    for (const r of tierResults) {
        const rewards = toEther(r.pendingRewardsBefore).slice(0, 10).padEnd(12);
        const expected = toEther(r.claimFeeExpected).slice(0, 10).padEnd(12);
        const actual = toEther(r.claimFeeActual).slice(0, 10).padEnd(12);
        const claimed = toEther(r.claimedAmount).slice(0, 10).padEnd(12);
        
        let status = "⚠️ SKIP";
        if (r.claimSuccess && r.pendingRewardsBefore > 0n) {
            if (r.claimDiscrepancy === 0n) {
                status = "✅ PASS";
                passedClaim++;
            } else {
                status = "⚠️ DIFF";
                failedClaim++;
            }
        } else if (r.pendingRewardsBefore === 0n) {
            status = "⏭️ N/A";
        } else {
            status = "❌ FAIL";
            failedClaim++;
        }

        console.log(`│ ${r.tierName.padEnd(14)} │ ${rewards} │ ${expected} │ ${actual} │ ${claimed} │ ${status.padEnd(8)} │`);
    }

    console.log("└────────────────┴───────────────┴───────────────┴───────────────┴───────────────┴──────────┘");

    // Sumário
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   📈 SUMÁRIO");
    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log(`   🔍 Notary Tests: ${passedNotary} PASS / ${failedNotary} FAIL`);
    console.log(`   🔍 Claim Tests:  ${passedClaim} PASS / ${failedClaim} FAIL`);

    // Problemas Identificados
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   ⚠️ PROBLEMAS IDENTIFICADOS");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const allIssues = [...issues];
    for (const r of tierResults) {
        for (const err of r.errors) {
            allIssues.push(`[${r.tierName}] ${err}`);
        }
    }

    if (allIssues.length === 0) {
        console.log("   ✅ Nenhum problema identificado!");
    } else {
        for (let i = 0; i < allIssues.length; i++) {
            console.log(`   ${i + 1}. ${allIssues[i]}`);
        }
    }

    // Recomendações
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   💡 RECOMENDAÇÕES");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const recommendations: string[] = [];

    // Verificar se descontos estão configurados
    for (const tier of TIERS) {
        const discount = configuredDiscounts.get(tier.boost);
        if (!discount || discount === 0n) {
            recommendations.push(`Configurar desconto para ${tier.name}: hub.setBoosterDiscount(${tier.boost}, ${tier.expectedDiscount})`);
        } else if (discount !== tier.expectedDiscount) {
            recommendations.push(`Ajustar desconto de ${tier.name}: hub.setBoosterDiscount(${tier.boost}, ${tier.expectedDiscount}) [atual: ${discount}]`);
        }
    }

    // Verificar discrepâncias
    for (const r of tierResults) {
        if (r.notaryDiscrepancy !== 0n) {
            recommendations.push(`Investigar cálculo de desconto no Notary para ${r.tierName}`);
        }
        if (r.claimDiscrepancy !== 0n) {
            recommendations.push(`Investigar cálculo de desconto no Claim para ${r.tierName}`);
        }
    }

    if (recommendations.length === 0) {
        console.log("   ✅ Sistema funcionando corretamente!");
    } else {
        for (let i = 0; i < recommendations.length; i++) {
            console.log(`   ${i + 1}. ${recommendations[i]}`);
        }
    }

    // Saldo Final
    const finalBalance = await bkc.balanceOf(tester.address);
    const balanceChange = finalBalance - initialBalance;
    
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("   💰 BALANÇO FINAL");
    console.log("═══════════════════════════════════════════════════════════════\n");
    
    console.log(`   💵 Saldo Inicial: ${toEther(initialBalance)} BKC`);
    console.log(`   💵 Saldo Final:   ${toEther(finalBalance)} BKC`);
    console.log(`   📊 Variação:      ${balanceChange >= 0n ? '+' : ''}${toEther(balanceChange)} BKC`);

    console.log("\n");

    // Exit code
    if (failedNotary > 0 || failedClaim > 0 || allIssues.length > 0) {
        console.log("❌ TESTES CONCLUÍDOS COM PROBLEMAS\n");
        process.exit(1);
    } else {
        console.log("✅ TODOS OS TESTES PASSARAM!\n");
        process.exit(0);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});