// scripts/9_upgrade_charitypool.ts
// Fazer upgrade do CharityPool para a nova versão

import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

export async function runScript(hre: HardhatRuntimeEnvironment) {
    const { ethers, upgrades } = hre;
    const [deployer] = await ethers.getSigners();

    console.log("\n" + "═".repeat(70));
    console.log("🔄 UPGRADE DO CHARITYPOOL");
    console.log("═".repeat(70));
    console.log(`👤 Deployer: ${deployer.address}`);

    // Carregar endereços
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const charityProxyAddr = addresses.charityPool;
    console.log(`\n📍 CharityPool Proxy: ${charityProxyAddr}`);

    // Verificar implementation atual
    const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implStorageValue = await ethers.provider.getStorage(charityProxyAddr, implSlot);
    const oldImplAddress = "0x" + implStorageValue.slice(26);
    console.log(`📍 Implementation ANTIGA: ${oldImplAddress}`);

    // Verificar owner
    const CharityPoolOld = await ethers.getContractAt("CharityPool", charityProxyAddr, deployer);
    const owner = await CharityPoolOld.owner();
    console.log(`👤 Owner atual: ${owner}`);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log(`\n❌ ERRO: Você não é o owner do contrato!`);
        console.log(`   Owner: ${owner}`);
        console.log(`   Deployer: ${deployer.address}`);
        return;
    }

    console.log("\n" + "─".repeat(70));
    console.log("🔨 Fazendo upgrade...");
    console.log("─".repeat(70));

    try {
        // Carregar nova factory
        const CharityPoolV2 = await ethers.getContractFactory("CharityPool");
        
        // Fazer upgrade
        console.log("\n   ⏳ Executando upgrade...");
        const upgraded = await upgrades.upgradeProxy(charityProxyAddr, CharityPoolV2);
        await upgraded.waitForDeployment();
        
        // Verificar nova implementation
        const newImplStorageValue = await ethers.provider.getStorage(charityProxyAddr, implSlot);
        const newImplAddress = "0x" + newImplStorageValue.slice(26);
        
        console.log(`\n   ✅ Upgrade concluído!`);
        console.log(`   📍 Implementation ANTIGA: ${oldImplAddress}`);
        console.log(`   📍 Implementation NOVA: ${newImplAddress}`);
        
        // Atualizar arquivo de endereços
        addresses.charityPool_Implementation = newImplAddress;
        fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
        console.log(`   📝 deployment-addresses.json atualizado`);

        // Testar novas funções
        console.log("\n" + "─".repeat(70));
        console.log("🧪 Testando novas funções...");
        console.log("─".repeat(70));

        const charity = await ethers.getContractAt("CharityPool", charityProxyAddr, deployer);

        try {
            const counter = await charity.campaignCounter();
            console.log(`   ✅ campaignCounter(): ${counter}`);
        } catch (e: any) {
            console.log(`   ❌ campaignCounter(): ${e.message?.slice(0, 50)}`);
        }

        try {
            const total = await charity.totalCampaignsCreated();
            console.log(`   ✅ totalCampaignsCreated(): ${total}`);
        } catch (e: any) {
            console.log(`   ❌ totalCampaignsCreated(): ${e.message?.slice(0, 50)}`);
        }

        try {
            const raised = await charity.totalRaisedAllTime();
            console.log(`   ✅ totalRaisedAllTime(): ${ethers.formatEther(raised)} BKC`);
        } catch (e: any) {
            console.log(`   ❌ totalRaisedAllTime(): ${e.message?.slice(0, 50)}`);
        }

        try {
            const burned = await charity.totalBurnedAllTime();
            console.log(`   ✅ totalBurnedAllTime(): ${ethers.formatEther(burned)} BKC`);
        } catch (e: any) {
            console.log(`   ❌ totalBurnedAllTime(): ${e.message?.slice(0, 50)}`);
        }

        try {
            const em = await charity.ecosystemManager();
            console.log(`   ✅ ecosystemManager(): ${em}`);
        } catch (e: any) {
            console.log(`   ❌ ecosystemManager(): ${e.message?.slice(0, 50)}`);
        }

        try {
            const serviceKey = await charity.SERVICE_KEY();
            console.log(`   ✅ SERVICE_KEY(): ${serviceKey}`);
        } catch (e: any) {
            console.log(`   ❌ SERVICE_KEY(): ${e.message?.slice(0, 50)}`);
        }

        console.log("\n" + "═".repeat(70));
        console.log("🎉 UPGRADE CONCLUÍDO COM SUCESSO!");
        console.log("═".repeat(70));
        console.log(`
Próximos passos:
1. Verificar a nova implementation no Arbiscan:
   npx hardhat run scripts/4_verify_contracts.ts --network arbitrumSepolia

2. Rodar os testes do CharityPool:
   npx hardhat run scripts/5_verify_full_ecosystem.ts --network arbitrumSepolia
`);

    } catch (e: any) {
        console.log(`\n❌ ERRO no upgrade:`);
        console.log(`   ${e.message}`);
        
        if (e.message?.includes("not upgradeable")) {
            console.log(`\n   O contrato pode não ter sido deployado como upgradeable.`);
            console.log(`   Você precisará re-deployar o CharityPool.`);
        }
    }

    console.log("═".repeat(70) + "\n");
}

import hre from "hardhat";
runScript(hre).catch(console.error);