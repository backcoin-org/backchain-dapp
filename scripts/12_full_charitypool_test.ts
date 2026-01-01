// scripts/12_full_charitypool_test.ts
// Teste COMPLETO do CharityPool - Todos os cenários possíveis
// Inclui: Criação, Doações, Queimas, Mineração, Saques, Cancelamentos

import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

interface TestResult {
    scenario: string;
    success: boolean;
    campaignId?: bigint;
    donations?: number;
    raised?: string;
    burned?: string;
    mined?: string;
    withdrawn?: string;
    error?: string;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function runScript(hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();

    console.log("\n" + "═".repeat(80));
    console.log("🎗️  CHARITYPOOL - TESTE COMPLETO DE TODOS OS CENÁRIOS");
    console.log("═".repeat(80));
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`⏰ Data: ${new Date().toISOString()}`);

    // Carregar endereços
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const charityAddr = addresses.charityPool;
    const bkcAddr = addresses.bkcToken;
    const mmAddr = addresses.miningManager;

    const charity = await ethers.getContractAt("CharityPool", charityAddr, deployer);
    const bkc = await ethers.getContractAt("BKCToken", bkcAddr, deployer);
    const mm = await ethers.getContractAt("MiningManager", mmAddr, deployer);

    const results: TestResult[] = [];

    // ════════════════════════════════════════════════════════════════════════════
    // FASE 0: PREPARAÇÃO
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n" + "─".repeat(80));
    console.log("⚙️  FASE 0: PREPARAÇÃO DO AMBIENTE");
    console.log("─".repeat(80));

    // Verificar saldos iniciais
    const ethBalance = await ethers.provider.getBalance(deployer.address);
    const bkcBalance = await bkc.balanceOf(deployer.address);
    console.log(`\n   💰 Saldo ETH: ${ethers.formatEther(ethBalance)} ETH`);
    console.log(`   💎 Saldo BKC: ${ethers.formatEther(bkcBalance)} BKC`);

    // Verificar configurações do CharityPool
    const miningFeeBips = await charity.donationMiningFeeBips();
    const burnFeeBips = await charity.donationBurnFeeBips();
    const withdrawFeeETH = await charity.withdrawalFeeETH();
    const goalNotMetBurnBips = await charity.goalNotMetBurnBips();
    const minDonation = await charity.minDonationAmount();
    const maxCampaigns = await charity.maxActiveCampaignsPerWallet();

    console.log(`\n   📋 Configurações CharityPool:`);
    console.log(`      Mining Fee: ${Number(miningFeeBips) / 100}%`);
    console.log(`      Burn Fee: ${Number(burnFeeBips) / 100}%`);
    console.log(`      Withdrawal Fee: ${ethers.formatEther(withdrawFeeETH)} ETH`);
    console.log(`      Goal Not Met Burn: ${Number(goalNotMetBurnBips) / 100}%`);
    console.log(`      Min Donation: ${ethers.formatEther(minDonation)} BKC`);
    console.log(`      Max Active Campaigns: ${maxCampaigns}`);

    // Aumentar limite de campanhas se necessário
    const currentActive = await charity.userActiveCampaigns(deployer.address);
    console.log(`\n   📊 Campanhas ativas atuais: ${currentActive} / ${maxCampaigns}`);

    if (maxCampaigns < 20n) {
        console.log(`   ⏳ Aumentando limite para 20 campanhas...`);
        try {
            const tx = await charity.setLimits(minDonation, 20);
            await tx.wait();
            console.log(`   ✅ Limite aumentado para 20`);
        } catch (e: any) {
            console.log(`   ⚠️ Não foi possível aumentar limite: ${e.message?.slice(0, 50)}`);
        }
    }

    // Capturar stats iniciais
    const initialStats = {
        totalCampaigns: await charity.campaignCounter(),
        totalRaised: await charity.totalRaisedAllTime(),
        totalBurned: await charity.totalBurnedAllTime(),
        totalWithdrawals: await charity.totalSuccessfulWithdrawals(),
        deployerBKC: await bkc.balanceOf(deployer.address),
    };

    console.log(`\n   📊 Stats Iniciais:`);
    console.log(`      Total Campanhas: ${initialStats.totalCampaigns}`);
    console.log(`      Total Arrecadado: ${ethers.formatEther(initialStats.totalRaised)} BKC`);
    console.log(`      Total Queimado: ${ethers.formatEther(initialStats.totalBurned)} BKC`);
    console.log(`      Total Saques: ${initialStats.totalWithdrawals}`);

    // Aprovar BKC suficiente para todos os testes
    const totalApproval = ethers.parseEther("10000"); // 10,000 BKC
    console.log(`\n   ⏳ Aprovando ${ethers.formatEther(totalApproval)} BKC para testes...`);
    const approveTx = await bkc.approve(charityAddr, totalApproval);
    await approveTx.wait();
    console.log(`   ✅ BKC aprovado`);

    // ════════════════════════════════════════════════════════════════════════════
    // CENÁRIO 1: META ATINGIDA COM SAQUE
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(80));
    console.log("🎯 CENÁRIO 1: META ATINGIDA + SAQUE IMEDIATO");
    console.log("═".repeat(80));
    console.log("   Meta: 100 BKC | Doações: 15x 10 BKC = 150 BKC | Resultado: Meta atingida");

    try {
        // Criar campanha
        const goal1 = ethers.parseEther("100");
        const title1 = `Meta Atingida ${Date.now()}`;
        console.log(`\n   ⏳ Criando campanha "${title1}"...`);
        
        const createTx1 = await charity.createCampaign(title1, "Campanha que atingirá a meta", goal1, 7n);
        await createTx1.wait();
        
        const campaignId1 = await charity.campaignCounter() - 1n;
        console.log(`   ✅ Campanha criada! ID: ${campaignId1}`);

        // Fazer 15 doações de 10 BKC cada
        const donationAmount1 = ethers.parseEther("10");
        let totalDonated1 = 0n;
        let totalBurnedInDonations1 = 0n;
        let totalMinedInDonations1 = 0n;

        console.log(`\n   📥 Fazendo 15 doações de ${ethers.formatEther(donationAmount1)} BKC cada...`);
        
        for (let i = 1; i <= 15; i++) {
            const balanceBefore = await bkc.balanceOf(deployer.address);
            const burnedBefore = await charity.totalBurnedAllTime();
            
            const donateTx = await charity.donate(campaignId1, donationAmount1);
            await donateTx.wait();
            
            const balanceAfter = await bkc.balanceOf(deployer.address);
            const burnedAfter = await charity.totalBurnedAllTime();
            
            const actualSpent = balanceBefore - balanceAfter;
            const burnedThisTx = burnedAfter - burnedBefore;
            
            totalDonated1 += donationAmount1;
            totalBurnedInDonations1 += burnedThisTx;
            
            if (i % 5 === 0 || i === 15) {
                const campaign = await charity.getCampaign(campaignId1);
                console.log(`      Doação ${i}/15: Arrecadado = ${ethers.formatEther(campaign.raisedAmount)} BKC`);
            }
        }

        // Verificar campanha após doações
        const campaign1After = await charity.getCampaign(campaignId1);
        console.log(`\n   📊 Após 15 doações:`);
        console.log(`      Meta: ${ethers.formatEther(campaign1After.goalAmount)} BKC`);
        console.log(`      Arrecadado: ${ethers.formatEther(campaign1After.raisedAmount)} BKC`);
        console.log(`      Queimado (durante doações): ${ethers.formatEther(totalBurnedInDonations1)} BKC`);
        console.log(`      Meta atingida: ${campaign1After.raisedAmount >= campaign1After.goalAmount ? '✅ SIM' : '❌ NÃO'}`);

        // Calcular valores esperados para saque
        const canWithdraw1 = await charity.canWithdraw(campaignId1);
        console.log(`\n   💰 Pode sacar: ${canWithdraw1 ? '✅ SIM' : '❌ NÃO'}`);

        if (canWithdraw1) {
            const withdrawalCalc = await charity.calculateWithdrawal(campaignId1);
            console.log(`\n   📊 Cálculo do saque:`);
            console.log(`      Valor bruto: ${ethers.formatEther(withdrawalCalc.grossAmount)} BKC`);
            console.log(`      Taxa ETH: ${ethers.formatEther(withdrawFeeETH)} ETH`);
            console.log(`      Valor líquido: ${ethers.formatEther(withdrawalCalc.netAmount)} BKC`);

            // Fazer saque
            console.log(`\n   ⏳ Executando saque...`);
            const balanceBeforeWithdraw = await bkc.balanceOf(deployer.address);
            
            const withdrawTx = await charity.withdraw(campaignId1, { value: withdrawFeeETH });
            const withdrawReceipt = await withdrawTx.wait();
            
            const balanceAfterWithdraw = await bkc.balanceOf(deployer.address);
            const received = balanceAfterWithdraw - balanceBeforeWithdraw;

            console.log(`   ✅ Saque realizado!`);
            console.log(`      Recebido: ${ethers.formatEther(received)} BKC`);
            console.log(`      TX: https://sepolia.arbiscan.io/tx/${withdrawReceipt?.hash}`);

            results.push({
                scenario: "Meta Atingida + Saque",
                success: true,
                campaignId: campaignId1,
                donations: 15,
                raised: ethers.formatEther(campaign1After.raisedAmount),
                burned: ethers.formatEther(totalBurnedInDonations1),
                withdrawn: ethers.formatEther(received),
            });
        }

    } catch (e: any) {
        console.log(`   ❌ ERRO: ${e.message?.slice(0, 150)}`);
        results.push({ scenario: "Meta Atingida + Saque", success: false, error: e.message?.slice(0, 100) });
    }

    await sleep(2000);

    // ════════════════════════════════════════════════════════════════════════════
    // CENÁRIO 2: META NÃO ATINGIDA - CAMPANHA EXPIRA
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(80));
    console.log("⏰ CENÁRIO 2: META NÃO ATINGIDA - EXPIRAÇÃO");
    console.log("═".repeat(80));
    console.log("   Meta: 500 BKC | Doações: 10x 10 BKC = 100 BKC | Resultado: Não atinge meta");
    console.log("   Nota: Campanha com duração mínima (1 dia) - testamos comportamento");

    try {
        // Criar campanha com meta alta
        const goal2 = ethers.parseEther("500");
        const title2 = `Meta Não Atingida ${Date.now()}`;
        console.log(`\n   ⏳ Criando campanha "${title2}"...`);
        
        const createTx2 = await charity.createCampaign(title2, "Campanha que NÃO atingirá a meta", goal2, 1n); // 1 dia
        await createTx2.wait();
        
        const campaignId2 = await charity.campaignCounter() - 1n;
        console.log(`   ✅ Campanha criada! ID: ${campaignId2}`);

        // Fazer 10 doações de 10 BKC cada (total 100 BKC, meta é 500)
        const donationAmount2 = ethers.parseEther("10");
        let totalBurnedInDonations2 = 0n;

        console.log(`\n   📥 Fazendo 10 doações de ${ethers.formatEther(donationAmount2)} BKC cada...`);
        
        for (let i = 1; i <= 10; i++) {
            const burnedBefore = await charity.totalBurnedAllTime();
            
            const donateTx = await charity.donate(campaignId2, donationAmount2);
            await donateTx.wait();
            
            const burnedAfter = await charity.totalBurnedAllTime();
            totalBurnedInDonations2 += burnedAfter - burnedBefore;
            
            if (i % 5 === 0) {
                const campaign = await charity.getCampaign(campaignId2);
                console.log(`      Doação ${i}/10: Arrecadado = ${ethers.formatEther(campaign.raisedAmount)} BKC`);
            }
        }

        // Verificar campanha após doações
        const campaign2After = await charity.getCampaign(campaignId2);
        console.log(`\n   📊 Após 10 doações:`);
        console.log(`      Meta: ${ethers.formatEther(campaign2After.goalAmount)} BKC`);
        console.log(`      Arrecadado: ${ethers.formatEther(campaign2After.raisedAmount)} BKC`);
        console.log(`      Queimado (durante doações): ${ethers.formatEther(totalBurnedInDonations2)} BKC`);
        console.log(`      Progresso: ${(Number(campaign2After.raisedAmount) * 100 / Number(campaign2After.goalAmount)).toFixed(1)}%`);

        // Verificar se pode sacar (não deveria antes de expirar)
        const canWithdraw2 = await charity.canWithdraw(campaignId2);
        console.log(`\n   💰 Pode sacar agora: ${canWithdraw2 ? '✅ SIM' : '❌ NÃO (esperado - campanha ainda ativa)'}`);

        console.log(`\n   ⚠️ NOTA: Para testar saque com meta não atingida, a campanha precisa expirar.`);
        console.log(`      Deadline: ${new Date(Number(campaign2After.deadline) * 1000).toISOString()}`);

        results.push({
            scenario: "Meta Não Atingida",
            success: true,
            campaignId: campaignId2,
            donations: 10,
            raised: ethers.formatEther(campaign2After.raisedAmount),
            burned: ethers.formatEther(totalBurnedInDonations2),
        });

    } catch (e: any) {
        console.log(`   ❌ ERRO: ${e.message?.slice(0, 150)}`);
        results.push({ scenario: "Meta Não Atingida", success: false, error: e.message?.slice(0, 100) });
    }

    await sleep(2000);

    // ════════════════════════════════════════════════════════════════════════════
    // CENÁRIO 3: CAMPANHA CANCELADA PELO CRIADOR
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(80));
    console.log("🚫 CENÁRIO 3: CAMPANHA CANCELADA");
    console.log("═".repeat(80));
    console.log("   Meta: 200 BKC | Doações: 12x 5 BKC = 60 BKC | Ação: Cancelar campanha");

    try {
        // Criar campanha
        const goal3 = ethers.parseEther("200");
        const title3 = `Campanha Cancelada ${Date.now()}`;
        console.log(`\n   ⏳ Criando campanha "${title3}"...`);
        
        const createTx3 = await charity.createCampaign(title3, "Campanha que será cancelada", goal3, 30n);
        await createTx3.wait();
        
        const campaignId3 = await charity.campaignCounter() - 1n;
        console.log(`   ✅ Campanha criada! ID: ${campaignId3}`);

        // Fazer 12 doações de 5 BKC cada
        const donationAmount3 = ethers.parseEther("5");
        let totalBurnedInDonations3 = 0n;

        console.log(`\n   📥 Fazendo 12 doações de ${ethers.formatEther(donationAmount3)} BKC cada...`);
        
        for (let i = 1; i <= 12; i++) {
            const burnedBefore = await charity.totalBurnedAllTime();
            
            const donateTx = await charity.donate(campaignId3, donationAmount3);
            await donateTx.wait();
            
            const burnedAfter = await charity.totalBurnedAllTime();
            totalBurnedInDonations3 += burnedAfter - burnedBefore;
            
            if (i % 4 === 0) {
                const campaign = await charity.getCampaign(campaignId3);
                console.log(`      Doação ${i}/12: Arrecadado = ${ethers.formatEther(campaign.raisedAmount)} BKC`);
            }
        }

        // Verificar antes do cancelamento
        const campaign3Before = await charity.getCampaign(campaignId3);
        console.log(`\n   📊 Antes do cancelamento:`);
        console.log(`      Arrecadado: ${ethers.formatEther(campaign3Before.raisedAmount)} BKC`);
        console.log(`      Queimado (durante doações): ${ethers.formatEther(totalBurnedInDonations3)} BKC`);

        // Cancelar campanha
        console.log(`\n   ⏳ Cancelando campanha...`);
        const burnedBeforeCancel = await charity.totalBurnedAllTime();
        
        const cancelTx = await charity.cancelCampaign(campaignId3);
        const cancelReceipt = await cancelTx.wait();
        
        const burnedAfterCancel = await charity.totalBurnedAllTime();
        const burnedOnCancel = burnedAfterCancel - burnedBeforeCancel;

        console.log(`   ✅ Campanha cancelada!`);
        console.log(`      TX: https://sepolia.arbiscan.io/tx/${cancelReceipt?.hash}`);
        console.log(`      Queimado no cancelamento: ${ethers.formatEther(burnedOnCancel)} BKC`);

        // Verificar após cancelamento
        const campaign3After = await charity.getCampaign(campaignId3);
        console.log(`\n   📊 Após cancelamento:`);
        console.log(`      Is Cancelled: ${campaign3After.isCancelled}`);
        console.log(`      Is Active: ${campaign3After.isActive}`);

        results.push({
            scenario: "Campanha Cancelada",
            success: true,
            campaignId: campaignId3,
            donations: 12,
            raised: ethers.formatEther(campaign3Before.raisedAmount),
            burned: ethers.formatEther(totalBurnedInDonations3 + burnedOnCancel),
        });

    } catch (e: any) {
        console.log(`   ❌ ERRO: ${e.message?.slice(0, 150)}`);
        results.push({ scenario: "Campanha Cancelada", success: false, error: e.message?.slice(0, 100) });
    }

    await sleep(2000);

    // ════════════════════════════════════════════════════════════════════════════
    // CENÁRIO 4: DOAÇÕES DE VALORES VARIADOS
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(80));
    console.log("💎 CENÁRIO 4: DOAÇÕES DE VALORES VARIADOS");
    console.log("═".repeat(80));
    console.log("   Meta: 300 BKC | Doações: 10 doações de valores diferentes");

    try {
        // Criar campanha
        const goal4 = ethers.parseEther("300");
        const title4 = `Valores Variados ${Date.now()}`;
        console.log(`\n   ⏳ Criando campanha "${title4}"...`);
        
        const createTx4 = await charity.createCampaign(title4, "Testando doações de valores diferentes", goal4, 14n);
        await createTx4.wait();
        
        const campaignId4 = await charity.campaignCounter() - 1n;
        console.log(`   ✅ Campanha criada! ID: ${campaignId4}`);

        // Doações de valores variados
        const donations4 = [
            ethers.parseEther("5"),   // Pequena
            ethers.parseEther("10"),  // Média
            ethers.parseEther("25"),  // Grande
            ethers.parseEther("50"),  // Maior
            ethers.parseEther("1"),   // Mínima
            ethers.parseEther("15"),  
            ethers.parseEther("30"),
            ethers.parseEther("100"), // Muito grande
            ethers.parseEther("2"),
            ethers.parseEther("75"),  // Grande
        ];

        let totalDonated4 = 0n;
        let totalBurnedInDonations4 = 0n;
        let totalMinedInDonations4 = 0n;

        console.log(`\n   📥 Fazendo 10 doações de valores variados...`);
        
        for (let i = 0; i < donations4.length; i++) {
            const amount = donations4[i];
            const burnedBefore = await charity.totalBurnedAllTime();
            
            // Calcular fees esperadas
            const feeCalc = await charity.calculateDonationFees(amount);
            
            const donateTx = await charity.donate(campaignId4, amount);
            await donateTx.wait();
            
            const burnedAfter = await charity.totalBurnedAllTime();
            const burnedThisTx = burnedAfter - burnedBefore;
            
            totalDonated4 += amount;
            totalBurnedInDonations4 += burnedThisTx;
            totalMinedInDonations4 += feeCalc.miningFee;

            console.log(`      Doação ${i + 1}/10: ${ethers.formatEther(amount)} BKC`);
            console.log(`         → Mining: ${ethers.formatEther(feeCalc.miningFee)} | Burn: ${ethers.formatEther(feeCalc.burnFee)} | Net: ${ethers.formatEther(feeCalc.netAmount)}`);
        }

        // Verificar campanha após doações
        const campaign4After = await charity.getCampaign(campaignId4);
        console.log(`\n   📊 Após 10 doações variadas:`);
        console.log(`      Total doado (bruto): ${ethers.formatEther(totalDonated4)} BKC`);
        console.log(`      Arrecadado (líquido): ${ethers.formatEther(campaign4After.raisedAmount)} BKC`);
        console.log(`      Total queimado: ${ethers.formatEther(totalBurnedInDonations4)} BKC`);
        console.log(`      Total minerado (estimado): ${ethers.formatEther(totalMinedInDonations4)} BKC`);
        console.log(`      Meta: ${ethers.formatEther(campaign4After.goalAmount)} BKC`);
        console.log(`      Progresso: ${(Number(campaign4After.raisedAmount) * 100 / Number(campaign4After.goalAmount)).toFixed(1)}%`);

        results.push({
            scenario: "Doações Variadas",
            success: true,
            campaignId: campaignId4,
            donations: 10,
            raised: ethers.formatEther(campaign4After.raisedAmount),
            burned: ethers.formatEther(totalBurnedInDonations4),
            mined: ethers.formatEther(totalMinedInDonations4),
        });

    } catch (e: any) {
        console.log(`   ❌ ERRO: ${e.message?.slice(0, 150)}`);
        results.push({ scenario: "Doações Variadas", success: false, error: e.message?.slice(0, 100) });
    }

    await sleep(2000);

    // ════════════════════════════════════════════════════════════════════════════
    // CENÁRIO 5: META EXATA
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(80));
    console.log("🎯 CENÁRIO 5: META EXATA (considerando taxas)");
    console.log("═".repeat(80));
    console.log("   Meta: 50 BKC | Doações calculadas para atingir EXATAMENTE a meta");

    try {
        // Criar campanha
        const goal5 = ethers.parseEther("50");
        const title5 = `Meta Exata ${Date.now()}`;
        console.log(`\n   ⏳ Criando campanha "${title5}"...`);
        
        const createTx5 = await charity.createCampaign(title5, "Atingindo exatamente a meta", goal5, 7n);
        await createTx5.wait();
        
        const campaignId5 = await charity.campaignCounter() - 1n;
        console.log(`   ✅ Campanha criada! ID: ${campaignId5}`);

        // Calcular quanto precisa doar para atingir exatamente a meta
        // Net = Gross * (10000 - miningFee - burnFee) / 10000
        // Gross = Net * 10000 / (10000 - miningFee - burnFee)
        const totalFeeBips = miningFeeBips + burnFeeBips;
        const multiplier = 10000n / (10000n - totalFeeBips);
        
        // Para atingir 50 BKC líquido, precisamos doar um pouco mais
        // Vamos fazer 10 doações que somam aproximadamente o necessário
        const targetNet = ethers.parseEther("50");
        const grossNeeded = (targetNet * 10000n) / (10000n - totalFeeBips);
        const perDonation = grossNeeded / 10n + ethers.parseEther("0.1"); // +0.1 para garantir

        console.log(`\n   📊 Cálculo:`);
        console.log(`      Meta (líquido): ${ethers.formatEther(targetNet)} BKC`);
        console.log(`      Taxa total: ${Number(totalFeeBips) / 100}%`);
        console.log(`      Bruto necessário: ~${ethers.formatEther(grossNeeded)} BKC`);
        console.log(`      Por doação: ~${ethers.formatEther(perDonation)} BKC`);

        let totalBurnedInDonations5 = 0n;

        console.log(`\n   📥 Fazendo 10 doações...`);
        
        for (let i = 1; i <= 10; i++) {
            const campaign = await charity.getCampaign(campaignId5);
            const remaining = goal5 - campaign.raisedAmount;
            
            // Na última doação, doar apenas o necessário
            let donationAmount: bigint;
            if (i === 10 && remaining > 0n) {
                // Calcular quanto doar para atingir exatamente a meta
                donationAmount = (remaining * 10000n) / (10000n - totalFeeBips) + ethers.parseEther("0.01");
            } else if (remaining <= 0n) {
                console.log(`      Meta já atingida!`);
                break;
            } else {
                donationAmount = perDonation;
            }
            
            const burnedBefore = await charity.totalBurnedAllTime();
            
            const donateTx = await charity.donate(campaignId5, donationAmount);
            await donateTx.wait();
            
            const burnedAfter = await charity.totalBurnedAllTime();
            totalBurnedInDonations5 += burnedAfter - burnedBefore;

            const campaignAfter = await charity.getCampaign(campaignId5);
            console.log(`      Doação ${i}: ${ethers.formatEther(donationAmount)} BKC → Arrecadado: ${ethers.formatEther(campaignAfter.raisedAmount)} BKC`);
            
            if (campaignAfter.raisedAmount >= goal5) {
                console.log(`      ✅ Meta atingida!`);
                break;
            }
        }

        // Verificar e fazer saque
        const campaign5After = await charity.getCampaign(campaignId5);
        const canWithdraw5 = await charity.canWithdraw(campaignId5);

        console.log(`\n   📊 Resultado:`);
        console.log(`      Meta: ${ethers.formatEther(campaign5After.goalAmount)} BKC`);
        console.log(`      Arrecadado: ${ethers.formatEther(campaign5After.raisedAmount)} BKC`);
        console.log(`      Queimado: ${ethers.formatEther(totalBurnedInDonations5)} BKC`);
        console.log(`      Pode sacar: ${canWithdraw5 ? '✅ SIM' : '❌ NÃO'}`);

        if (canWithdraw5) {
            console.log(`\n   ⏳ Executando saque...`);
            const balanceBefore = await bkc.balanceOf(deployer.address);
            
            const withdrawTx = await charity.withdraw(campaignId5, { value: withdrawFeeETH });
            await withdrawTx.wait();
            
            const balanceAfter = await bkc.balanceOf(deployer.address);
            const received = balanceAfter - balanceBefore;

            console.log(`   ✅ Saque realizado! Recebido: ${ethers.formatEther(received)} BKC`);

            results.push({
                scenario: "Meta Exata + Saque",
                success: true,
                campaignId: campaignId5,
                donations: 10,
                raised: ethers.formatEther(campaign5After.raisedAmount),
                burned: ethers.formatEther(totalBurnedInDonations5),
                withdrawn: ethers.formatEther(received),
            });
        }

    } catch (e: any) {
        console.log(`   ❌ ERRO: ${e.message?.slice(0, 150)}`);
        results.push({ scenario: "Meta Exata", success: false, error: e.message?.slice(0, 100) });
    }

    // ════════════════════════════════════════════════════════════════════════════
    // RESUMO FINAL
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(80));
    console.log("📋 RESUMO FINAL DOS TESTES");
    console.log("═".repeat(80));

    // Stats finais
    const finalStats = {
        totalCampaigns: await charity.campaignCounter(),
        totalRaised: await charity.totalRaisedAllTime(),
        totalBurned: await charity.totalBurnedAllTime(),
        totalWithdrawals: await charity.totalSuccessfulWithdrawals(),
        deployerBKC: await bkc.balanceOf(deployer.address),
    };

    console.log(`\n   📊 Comparativo:`);
    console.log(`   ┌─────────────────────────┬─────────────────────┬─────────────────────┐`);
    console.log(`   │ Métrica                 │ Inicial             │ Final               │`);
    console.log(`   ├─────────────────────────┼─────────────────────┼─────────────────────┤`);
    console.log(`   │ Total Campanhas         │ ${String(initialStats.totalCampaigns).padEnd(19)} │ ${String(finalStats.totalCampaigns).padEnd(19)} │`);
    console.log(`   │ Total Arrecadado        │ ${ethers.formatEther(initialStats.totalRaised).slice(0, 17).padEnd(19)} │ ${ethers.formatEther(finalStats.totalRaised).slice(0, 17).padEnd(19)} │`);
    console.log(`   │ Total Queimado          │ ${ethers.formatEther(initialStats.totalBurned).slice(0, 17).padEnd(19)} │ ${ethers.formatEther(finalStats.totalBurned).slice(0, 17).padEnd(19)} │`);
    console.log(`   │ Total Saques            │ ${String(initialStats.totalWithdrawals).padEnd(19)} │ ${String(finalStats.totalWithdrawals).padEnd(19)} │`);
    console.log(`   └─────────────────────────┴─────────────────────┴─────────────────────┘`);

    // Diferenças
    const diffRaised = finalStats.totalRaised - initialStats.totalRaised;
    const diffBurned = finalStats.totalBurned - initialStats.totalBurned;
    const diffCampaigns = finalStats.totalCampaigns - initialStats.totalCampaigns;
    const diffWithdrawals = finalStats.totalWithdrawals - initialStats.totalWithdrawals;
    const diffBKC = initialStats.deployerBKC - finalStats.deployerBKC;

    console.log(`\n   📈 Mudanças durante os testes:`);
    console.log(`      Novas campanhas: +${diffCampaigns}`);
    console.log(`      Total arrecadado: +${ethers.formatEther(diffRaised)} BKC`);
    console.log(`      Total queimado: +${ethers.formatEther(diffBurned)} BKC`);
    console.log(`      Novos saques: +${diffWithdrawals}`);
    console.log(`      BKC gasto pelo deployer: ${ethers.formatEther(diffBKC)} BKC`);

    // Resultados dos cenários
    console.log(`\n   🧪 Resultados por Cenário:`);
    console.log(`   ┌──────────────────────────────────┬─────────┬───────────┬───────────┬───────────┐`);
    console.log(`   │ Cenário                          │ Status  │ Doações   │ Queimado  │ Sacado    │`);
    console.log(`   ├──────────────────────────────────┼─────────┼───────────┼───────────┼───────────┤`);
    
    for (const r of results) {
        const status = r.success ? '✅ OK' : '❌ FAIL';
        const donations = r.donations?.toString() || '-';
        const burned = r.burned?.slice(0, 8) || '-';
        const withdrawn = r.withdrawn?.slice(0, 8) || '-';
        console.log(`   │ ${r.scenario.padEnd(32)} │ ${status.padEnd(7)} │ ${donations.padEnd(9)} │ ${burned.padEnd(9)} │ ${withdrawn.padEnd(9)} │`);
    }
    console.log(`   └──────────────────────────────────┴─────────┴───────────┴───────────┴───────────┘`);

    // Resumo de sucesso/falha
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n   🏆 RESULTADO GERAL: ${passed}/${results.length} cenários passaram`);
    
    if (failed > 0) {
        console.log(`\n   ❌ Cenários com falha:`);
        for (const r of results.filter(r => !r.success)) {
            console.log(`      - ${r.scenario}: ${r.error}`);
        }
    }

    console.log("\n" + "═".repeat(80));
    console.log("🎗️  TESTE COMPLETO DO CHARITYPOOL FINALIZADO!");
    console.log("═".repeat(80) + "\n");
}

import hre from "hardhat";
runScript(hre).catch(console.error);