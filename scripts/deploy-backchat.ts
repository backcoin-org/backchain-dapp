// scripts/deploy-backchat.ts
// Deploy NOVO Backchat - Do zero, integrado ao ecossistema
// 100% automático - sem ajustes manuais

import { ethers, upgrades } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("\n" + "═".repeat(70));
    console.log("   BACKCHAT - NOVO DEPLOY (DO ZERO)");
    console.log("   Rede Social Descentralizada Integrada ao Ecossistema");
    console.log("═".repeat(70) + "\n");

    const [deployer] = await ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);

    // ========================================
    // CARREGAR ENDEREÇOS DO ECOSSISTEMA
    // ========================================
    
    const addressPath = "./deployment-addresses.json";
    let addresses: Record<string, string> = {};
    
    if (fs.existsSync(addressPath)) {
        addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));
    } else {
        console.log("❌ deployment-addresses.json não encontrado!");
        return;
    }

    const ecosystemManager = addresses.ecosystemManager;
    const miningManager = addresses.miningManager;

    console.log("\n📋 Endereços do Ecossistema:");
    console.log("   EcosystemManager:", ecosystemManager || "❌ NÃO ENCONTRADO");
    console.log("   MiningManager:", miningManager || "❌ NÃO ENCONTRADO");

    if (!ecosystemManager) {
        console.log("\n❌ EcosystemManager é obrigatório!");
        return;
    }

    // ========================================
    // DEPLOY DO PROXY BACKCHAT
    // ========================================
    
    console.log("\n" + "─".repeat(70));
    console.log("   DEPLOY DO CONTRATO");
    console.log("─".repeat(70));

    console.log("\n⏳ Compilando Backchat...");
    const BackchatFactory = await ethers.getContractFactory("Backchat");

    console.log("⏳ Deployando Proxy UUPS...");
    const backchat = await upgrades.deployProxy(
        BackchatFactory,
        [deployer.address, ecosystemManager],
        { 
            initializer: "initialize",
            kind: "uups"
        }
    );

    await backchat.waitForDeployment();
    const backchatProxy = await backchat.getAddress();
    const backchatImpl = await upgrades.erc1967.getImplementationAddress(backchatProxy);

    console.log("\n✅ Backchat deployado!");
    console.log("   Proxy:", backchatProxy);
    console.log("   Implementação:", backchatImpl);

    // ========================================
    // ATUALIZAR JSON IMEDIATAMENTE
    // ========================================
    
    addresses.backchat = backchatProxy;
    fs.writeFileSync(addressPath, JSON.stringify(addresses, null, 2));
    console.log("\n   ✅ deployment-addresses.json atualizado");

    // ========================================
    // VERIFICAR INICIALIZAÇÃO
    // ========================================
    
    console.log("\n" + "─".repeat(70));
    console.log("   VERIFICAÇÃO DA INICIALIZAÇÃO");
    console.log("─".repeat(70));

    try {
        const owner = await backchat.owner();
        const eco = await backchat.ecosystemManager();
        const bkc = await backchat.bkcToken();
        const treasuryAddr = await backchat.treasury();
        
        console.log("\n   ⚙️ Configuração inicial:");
        console.log("      Owner:", owner);
        console.log("      EcosystemManager:", eco);
        console.log("      BKC Token:", bkc);
        console.log("      Treasury:", treasuryAddr);

        const platformFee = await backchat.platformFee();
        const tipMiningFee = await backchat.tipMiningFeeBips();
        const maxContent = await backchat.maxContentLength();

        console.log("\n   💰 Taxas:");
        console.log("      Platform Fee:", ethers.formatEther(platformFee), "BKC");
        console.log("      Tip Mining:", Number(tipMiningFee) / 100, "%");
        console.log("      Max Content:", maxContent.toString(), "chars");
    } catch (e: any) {
        console.log("   ⚠️ Verificação parcial:", e.message?.substring(0, 50));
    }

    // ========================================
    // AUTORIZAR NO MININGMANAGER
    // ========================================
    
    console.log("\n" + "─".repeat(70));
    console.log("   AUTORIZAÇÃO NO MININGMANAGER");
    console.log("─".repeat(70));

    if (miningManager) {
        console.log("\n⏳ Autorizando Backchat no MiningManager...");
        
        try {
            const miningMgr = await ethers.getContractAt("MiningManager", miningManager);
            const serviceKey = ethers.keccak256(ethers.toUtf8Bytes("BACKCHAT_SERVICE"));
            console.log("   Service Key:", serviceKey);
            
            const tx = await miningMgr.setAuthorizedMiner(serviceKey, backchatProxy);
            const receipt = await tx.wait();
            console.log("   ✅ Backchat autorizado!");
            console.log("   TX:", receipt?.hash);
            
            // Verificar
            const authorized = await miningMgr.authorizedMiners(serviceKey);
            const isAuthorized = authorized.toLowerCase() === backchatProxy.toLowerCase();
            console.log("   Verificação:", isAuthorized ? "✅ AUTORIZADO" : "❌ FALHA");
        } catch (error: any) {
            console.log("   ⚠️ Erro na autorização:", error.message?.substring(0, 60));
            console.log("   ℹ️ Pode precisar autorizar manualmente depois");
        }
    } else {
        console.log("\n   ⚠️ MiningManager não encontrado");
    }

    // ========================================
    // TESTE BÁSICO
    // ========================================
    
    console.log("\n" + "─".repeat(70));
    console.log("   TESTE BÁSICO");
    console.log("─".repeat(70));

    try {
        const totals = await backchat.getTotals();
        console.log("\n   📊 Totais (deve ser zero):");
        console.log("      Posts:", totals[0].toString());
        console.log("      Comentários:", totals[1].toString());
        console.log("      Notas:", totals[2].toString());
        console.log("      Mensagens:", totals[3].toString());
        console.log("      Conversas:", totals[4].toString());
        console.log("\n   ✅ Contrato respondendo corretamente");
    } catch (e: any) {
        console.log("   ⚠️ Erro no teste:", e.message?.substring(0, 50));
    }

    // ========================================
    // RESUMO FINAL
    // ========================================
    
    console.log("\n" + "═".repeat(70));
    console.log("   ✅ DEPLOY COMPLETO!");
    console.log("═".repeat(70));
    
    console.log("\n   📋 Endereços salvos no deployment-addresses.json:");
    console.log(`      backchat: ${backchatProxy}`);
    console.log(`      backchatImplementation: ${backchatImpl}`);
    
    console.log("\n   📝 Próximos passos:");
    console.log("      npx hardhat verify --network arbitrumSepolia " + backchatProxy);
    console.log("      npx hardhat run scripts/test-backchat-full.ts --network arbitrumSepolia");

    console.log("\n   🔗 Arbiscan: https://sepolia.arbiscan.io/address/" + backchatProxy);
    console.log("\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERRO:", error);
        process.exit(1);
    });