// scripts/upgrade_rental_manager_v2.ts
// ════════════════════════════════════════════════════════════════════════════
// 🚀 RENTAL MANAGER V2 UPGRADE SCRIPT - MetaAds Promotion System
// ════════════════════════════════════════════════════════════════════════════
//
// Este script faz o upgrade do RentalManager para V2, adicionando:
// - Sistema de promoção MetaAds (pagar ETH para destacar listings)
// - Treasury configurável para receber taxas de promoção
// - Função getPromotionRanking() para frontend
// - Limpeza automática de promoção no withdraw
//
// USO:
// npx hardhat run scripts/upgrade_rental_manager_v2.ts --network arbitrumSepolia
// npx hardhat run scripts/upgrade_rental_manager_v2.ts --network arbitrum
//
// PRÉ-REQUISITOS:
// 1. RentalManager já deployado como UUPS Proxy
// 2. Deployer deve ser owner do contrato
// 3. RentalManagerV2.sol compilado (contracts/RentalManager.sol)
//
// ════════════════════════════════════════════════════════════════════════════

import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ════════════════════════════════════════════════════════════════════════════
//                    🔐 CONFIGURAÇÃO
// ════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Treasury que recebe as taxas de promoção MetaAds
    TREASURY: "0xc93030333E3a235c2605BcB7C7330650B600B6D0",
    
    // Taxas configuráveis (em basis points, 100 = 1%)
    MINING_FEE_BIPS: 700,   // 7% → MiningManager (PoP)
    BURN_FEE_BIPS: 300,     // 3% → Queima 🔥
    // Total: 10% (igual ao anterior, mas agora com queima)
    
    // Delays para evitar rate limiting
    TX_DELAY_MS: 2000,
    RETRY_DELAY_MS: 5000,
    MAX_RETRIES: 5,
};

// ════════════════════════════════════════════════════════════════════════════
//                    🛠️ HELPERS
// ════════════════════════════════════════════════════════════════════════════

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sendTxWithRetry(
    txFunction: () => Promise<any>,
    description: string
): Promise<any> {
    for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
        try {
            console.log(`   ⏳ ${description}...`);
            const tx = await txFunction();
            const receipt = await tx.wait();
            console.log(`   ✅ ${description}`);
            await sleep(CONFIG.TX_DELAY_MS);
            return receipt;
        } catch (error: any) {
            const msg = error.message || "";
            
            if (msg.includes("already") || msg.includes("Already")) {
                console.log(`   ⏩ Já realizado: ${description}`);
                return null;
            }
            
            const isRetryable = 
                msg.includes("ECONNRESET") || msg.includes("timeout") ||
                msg.includes("429") || msg.includes("nonce");
            
            if (isRetryable && attempt < CONFIG.MAX_RETRIES - 1) {
                const waitTime = CONFIG.RETRY_DELAY_MS * (attempt + 1);
                console.log(`   ⚠️ Tentativa ${attempt + 1}/${CONFIG.MAX_RETRIES}. Aguardando ${waitTime/1000}s...`);
                await sleep(waitTime);
                continue;
            }
            
            throw error;
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
//                    🚀 SCRIPT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

async function main() {
    console.log("\n" + "═".repeat(70));
    console.log("   🚀 RENTAL MANAGER V2 UPGRADE - MetaAds Promotion System");
    console.log("═".repeat(70));

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SETUP
    // ─────────────────────────────────────────────────────────────────────────

    const [deployer] = await ethers.getSigners();
    const networkName = (await ethers.provider.getNetwork()).name;
    const chainId = (await ethers.provider.getNetwork()).chainId;
    
    console.log(`\n   📡 Network: ${networkName} (chainId: ${chainId})`);
    console.log(`   👤 Deployer: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`   💰 Balance: ${ethers.formatEther(balance)} ETH`);
    console.log(`   🏦 Treasury: ${CONFIG.TREASURY}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. CARREGAR ENDEREÇOS
    // ─────────────────────────────────────────────────────────────────────────

    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    
    if (!fs.existsSync(addressesPath)) {
        console.error("\n   ❌ ERRO: deployment-addresses.json não encontrado!");
        console.error("   Execute o deploy do ecossistema primeiro.");
        process.exit(1);
    }
    
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const rentalProxyAddr = addresses.rentalManager;
    
    if (!rentalProxyAddr) {
        console.error("\n   ❌ ERRO: RentalManager não encontrado em deployment-addresses.json");
        process.exit(1);
    }
    
    console.log(`\n   📍 RentalManager Proxy: ${rentalProxyAddr}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. VERIFICAR OWNERSHIP
    // ─────────────────────────────────────────────────────────────────────────

    console.log("\n" + "─".repeat(70));
    console.log("   🔐 Verificando Ownership");
    console.log("─".repeat(70));

    // ABI mínima para verificar owner
    const minimalABI = [
        "function owner() view returns (address)",
        "function paused() view returns (bool)",
        "function getListingCount() view returns (uint256)",
        "function totalRentals() view returns (uint256)",
        "function totalVolume() view returns (uint256)"
    ];
    
    const currentContract = new ethers.Contract(rentalProxyAddr, minimalABI, deployer);
    
    let owner: string;
    try {
        owner = await currentContract.owner();
    } catch (e) {
        console.error("\n   ❌ ERRO: Não foi possível ler owner do contrato");
        process.exit(1);
    }
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.error(`\n   ❌ ERRO: Você não é o owner do contrato!`);
        console.error(`      Owner: ${owner}`);
        console.error(`      Você:  ${deployer.address}`);
        process.exit(1);
    }
    
    console.log(`   ✅ Ownership verificado: ${owner}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. CAPTURAR ESTADO ATUAL
    // ─────────────────────────────────────────────────────────────────────────

    console.log("\n" + "─".repeat(70));
    console.log("   📊 Estado Atual (antes do upgrade)");
    console.log("─".repeat(70));

    let stateBefore = {
        paused: false,
        listingCount: 0n,
        totalRentals: 0n,
        totalVolume: 0n
    };

    try {
        stateBefore.paused = await currentContract.paused();
        stateBefore.listingCount = await currentContract.getListingCount();
        stateBefore.totalRentals = await currentContract.totalRentals();
        stateBefore.totalVolume = await currentContract.totalVolume();
        
        console.log(`   Paused:        ${stateBefore.paused}`);
        console.log(`   Listings:      ${stateBefore.listingCount}`);
        console.log(`   Total Rentals: ${stateBefore.totalRentals}`);
        console.log(`   Total Volume:  ${ethers.formatEther(stateBefore.totalVolume)} BKC`);
    } catch (e: any) {
        console.log(`   ⚠️ Algumas métricas não disponíveis: ${e.message?.slice(0, 50)}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. OBTER IMPLEMENTATION ATUAL
    // ─────────────────────────────────────────────────────────────────────────

    console.log("\n" + "─".repeat(70));
    console.log("   🔍 Implementation Atual");
    console.log("─".repeat(70));

    let oldImplementation: string;
    try {
        oldImplementation = await upgrades.erc1967.getImplementationAddress(rentalProxyAddr);
        console.log(`   📍 Implementation: ${oldImplementation}`);
    } catch (e) {
        console.error("\n   ❌ ERRO: Não foi possível obter implementation address");
        console.error("   O contrato pode não ser um proxy UUPS válido");
        process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. CONFIRMAR UPGRADE
    // ─────────────────────────────────────────────────────────────────────────

    console.log("\n" + "═".repeat(70));
    console.log("   ⚠️  CONFIRMAÇÃO DE UPGRADE");
    console.log("═".repeat(70));
    console.log(`
   Você está prestes a fazer upgrade do RentalManager para V2.
   
   Mudanças:
   ├── Novo campo: promotionFees (mapping tokenId => ETH)
   ├── Novo campo: treasury (address)
   ├── Novo campo: totalPromotionFeesCollected (uint256)
   ├── Nova função: promoteListing(tokenId) payable
   ├── Nova função: getPromotionFee(tokenId) view
   ├── Nova função: getPromotionRanking() view
   ├── Nova função: setTreasury(address) onlyOwner
   ├── Modificado: withdrawNFT() - limpa promotionFees
   └── Novo evento: ListingPromoted(tokenId, owner, amount, total)
   
   Esta ação é IRREVERSÍVEL em produção.
   `);

    // Em ambiente de teste, não precisa de confirmação manual
    const isMainnet = chainId === 42161n;
    if (isMainnet) {
        console.log("   🔴 MAINNET DETECTADA - Aguardando 15 segundos...");
        console.log("   Pressione Ctrl+C para cancelar.\n");
        await sleep(15000);
    } else {
        console.log("   🟢 Testnet - Prosseguindo em 3 segundos...\n");
        await sleep(3000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. EXECUTAR UPGRADE
    // ─────────────────────────────────────────────────────────────────────────

    console.log("─".repeat(70));
    console.log("   🔄 Executando Upgrade");
    console.log("─".repeat(70));

    console.log("\n   ⏳ Compilando RentalManager V2...");
    const RentalManagerV2 = await ethers.getContractFactory("RentalManager", deployer);
    
    console.log("   ⏳ Fazendo upgrade do proxy...");
    
    let upgraded: any;
    try {
        upgraded = await upgrades.upgradeProxy(rentalProxyAddr, RentalManagerV2, {
            kind: "uups",
            redeployImplementation: "always"  // Força redeploy mesmo se bytecode similar
        });
        
        await upgraded.waitForDeployment();
        console.log("   ✅ Upgrade executado com sucesso!");
    } catch (e: any) {
        console.error(`\n   ❌ ERRO no upgrade: ${e.message}`);
        
        if (e.message?.includes("unsafeAllow")) {
            console.log("\n   💡 Dica: Adicione 'unsafeAllow' nas opções de upgrade");
        }
        
        process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. OBTER NOVA IMPLEMENTATION
    // ─────────────────────────────────────────────────────────────────────────

    const newImplementation = await upgrades.erc1967.getImplementationAddress(rentalProxyAddr);
    console.log(`\n   📍 Nova Implementation: ${newImplementation}`);

    if (oldImplementation.toLowerCase() === newImplementation.toLowerCase()) {
        console.log("   ⚠️ AVISO: Implementation não mudou (bytecode idêntico?)");
    } else {
        console.log("   ✅ Implementation atualizada!");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. INICIALIZAR V2 (Treasury)
    // ─────────────────────────────────────────────────────────────────────────

    console.log("\n" + "─".repeat(70));
    console.log("   🔧 Inicializando V2 (Treasury)");
    console.log("─".repeat(70));

    // ABI V2 para inicialização
    const v2ABI = [
        "function treasury() view returns (address)",
        "function initializeV2(address _treasury, uint256 _miningFeeBips, uint256 _burnFeeBips) external",
        "function setTreasury(address _treasury) external",
        "function setRentalFees(uint256 _miningFeeBips, uint256 _burnFeeBips) external",
        "function totalPromotionFeesCollected() view returns (uint256)",
        "function totalBurnedAllTime() view returns (uint256)",
        "function rentalMiningFeeBips() view returns (uint256)",
        "function rentalBurnFeeBips() view returns (uint256)",
        "function getPromotionFee(uint256 tokenId) view returns (uint256)",
        "function getFeeConfig() view returns (uint256 miningFeeBips, uint256 burnFeeBips, uint256 totalFeeBips)"
    ];
    
    const rentalV2 = new ethers.Contract(rentalProxyAddr, v2ABI, deployer);
    
    try {
        const currentTreasury = await rentalV2.treasury();
        console.log(`   📍 Treasury atual: ${currentTreasury}`);
        
        if (currentTreasury === ethers.ZeroAddress || currentTreasury === "0x0000000000000000000000000000000000000000") {
            // Primeira vez - inicializar V2 com treasury e fees
            console.log(`\n   ⏳ Chamando initializeV2(${CONFIG.TREASURY}, ${CONFIG.MINING_FEE_BIPS}, ${CONFIG.BURN_FEE_BIPS})...`);
            await sendTxWithRetry(
                async () => await rentalV2.initializeV2(
                    CONFIG.TREASURY,
                    CONFIG.MINING_FEE_BIPS,
                    CONFIG.BURN_FEE_BIPS
                ),
                "initializeV2"
            );
        } else if (currentTreasury.toLowerCase() !== CONFIG.TREASURY.toLowerCase()) {
            // Treasury diferente - atualizar
            console.log(`\n   ⏳ Chamando setTreasury(${CONFIG.TREASURY})...`);
            await sendTxWithRetry(
                async () => await rentalV2.setTreasury(CONFIG.TREASURY),
                "setTreasury"
            );
            
            // Também atualizar fees
            console.log(`\n   ⏳ Chamando setRentalFees(${CONFIG.MINING_FEE_BIPS}, ${CONFIG.BURN_FEE_BIPS})...`);
            await sendTxWithRetry(
                async () => await rentalV2.setRentalFees(CONFIG.MINING_FEE_BIPS, CONFIG.BURN_FEE_BIPS),
                "setRentalFees"
            );
        } else {
            console.log(`   ✅ Treasury já configurado corretamente`);
            
            // Verificar se fees precisam ser atualizados
            try {
                const currentMiningFee = await rentalV2.rentalMiningFeeBips();
                const currentBurnFee = await rentalV2.rentalBurnFeeBips();
                
                if (Number(currentMiningFee) !== CONFIG.MINING_FEE_BIPS || 
                    Number(currentBurnFee) !== CONFIG.BURN_FEE_BIPS) {
                    console.log(`\n   ⏳ Atualizando fees...`);
                    await sendTxWithRetry(
                        async () => await rentalV2.setRentalFees(CONFIG.MINING_FEE_BIPS, CONFIG.BURN_FEE_BIPS),
                        "setRentalFees"
                    );
                } else {
                    console.log(`   ✅ Fees já configurados corretamente`);
                }
            } catch (e) {
                // Fees podem não existir ainda
            }
        }
        
        // Verificar configuração final
        const finalTreasury = await rentalV2.treasury();
        console.log(`\n   ✅ Treasury Final: ${finalTreasury}`);
        
    } catch (e: any) {
        console.error(`\n   ❌ ERRO ao configurar treasury: ${e.message}`);
        console.log("   💡 Você pode configurar manualmente depois:");
        console.log(`      await contract.initializeV2("${CONFIG.TREASURY}")`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 10. VERIFICAR ESTADO PÓS-UPGRADE
    // ─────────────────────────────────────────────────────────────────────────

    console.log("\n" + "─".repeat(70));
    console.log("   📊 Estado Após Upgrade");
    console.log("─".repeat(70));

    // Usar ABI completa para verificação
    const fullABI = [
        ...minimalABI,
        "function treasury() view returns (address)",
        "function totalPromotionFeesCollected() view returns (uint256)",
        "function totalBurnedAllTime() view returns (uint256)",
        "function rentalMiningFeeBips() view returns (uint256)",
        "function rentalBurnFeeBips() view returns (uint256)"
    ];
    
    const verifyContract = new ethers.Contract(rentalProxyAddr, fullABI, deployer);

    try {
        const stateAfter = {
            paused: await verifyContract.paused(),
            listingCount: await verifyContract.getListingCount(),
            totalRentals: await verifyContract.totalRentals(),
            totalVolume: await verifyContract.totalVolume(),
            treasury: "N/A",
            totalPromotionFees: 0n,
            totalBurned: 0n,
            miningFeeBips: 0,
            burnFeeBips: 0
        };
        
        try {
            stateAfter.treasury = await verifyContract.treasury();
            stateAfter.totalPromotionFees = await verifyContract.totalPromotionFeesCollected();
            stateAfter.totalBurned = await verifyContract.totalBurnedAllTime();
            stateAfter.miningFeeBips = Number(await verifyContract.rentalMiningFeeBips());
            stateAfter.burnFeeBips = Number(await verifyContract.rentalBurnFeeBips());
        } catch (e) {
            // V2 functions may not be available yet
        }
        
        console.log(`   Paused:              ${stateAfter.paused}`);
        console.log(`   Listings:            ${stateAfter.listingCount}`);
        console.log(`   Total Rentals:       ${stateAfter.totalRentals}`);
        console.log(`   Total Volume:        ${ethers.formatEther(stateAfter.totalVolume)} BKC`);
        console.log(`   Treasury:            ${stateAfter.treasury}`);
        console.log(`   Promotion Fees:      ${ethers.formatEther(stateAfter.totalPromotionFees)} ETH`);
        console.log(`   Total Burned:        ${ethers.formatEther(stateAfter.totalBurned)} BKC 🔥`);
        console.log(`   Mining Fee:          ${stateAfter.miningFeeBips / 100}%`);
        console.log(`   Burn Fee:            ${stateAfter.burnFeeBips / 100}%`);
        console.log(`   Total Fee:           ${(stateAfter.miningFeeBips + stateAfter.burnFeeBips) / 100}%`);
        
        // Verificar preservação de estado
        const statePreserved = 
            stateBefore.listingCount === stateAfter.listingCount &&
            stateBefore.totalRentals === stateAfter.totalRentals &&
            stateBefore.totalVolume === stateAfter.totalVolume;
        
        if (statePreserved) {
            console.log("\n   ✅ Estado preservado corretamente!");
        } else {
            console.log("\n   ⚠️ AVISO: Possível diferença no estado!");
            console.log(`      Listings: ${stateBefore.listingCount} → ${stateAfter.listingCount}`);
            console.log(`      Rentals:  ${stateBefore.totalRentals} → ${stateAfter.totalRentals}`);
        }
        
    } catch (e: any) {
        console.log(`   ⚠️ Erro ao verificar estado: ${e.message?.slice(0, 50)}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 11. ATUALIZAR ARQUIVOS DE CONFIGURAÇÃO
    // ─────────────────────────────────────────────────────────────────────────

    console.log("\n" + "─".repeat(70));
    console.log("   📝 Atualizando Arquivos de Configuração");
    console.log("─".repeat(70));

    // Atualizar deployment-addresses.json
    addresses.rentalManager_Implementation = newImplementation;
    addresses.rentalManager_UpgradeTimestamp = new Date().toISOString();
    addresses.rentalManager_Version = "V2-MetaAds";
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log("   ✅ deployment-addresses.json atualizado");

    // Atualizar rules-config.json
    const rulesPath = path.join(__dirname, "../rules-config.json");
    if (fs.existsSync(rulesPath)) {
        const rules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
        if (!rules.rentalManager) rules.rentalManager = {};
        rules.rentalManager.METAADS_ENABLED = "true";
        rules.rentalManager.TREASURY = CONFIG.TREASURY;
        rules.rentalManager.VERSION = "V2";
        rules.rentalManager.UPGRADED_AT = new Date().toISOString();
        rules.LAST_UPDATED = new Date().toISOString();
        fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2));
        console.log("   ✅ rules-config.json atualizado");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 12. RESUMO FINAL
    // ─────────────────────────────────────────────────────────────────────────

    console.log("\n" + "═".repeat(70));
    console.log("   ✅ UPGRADE CONCLUÍDO COM SUCESSO!");
    console.log("═".repeat(70));
    
    console.log(`
   📋 Resumo:
   ─────────────────────────────────────────────────────────────────────
   Proxy Address:        ${rentalProxyAddr}
   Old Implementation:   ${oldImplementation}
   New Implementation:   ${newImplementation}
   Treasury:             ${CONFIG.TREASURY}
   Version:              V2 (MetaAds + Burn)
   
   💰 Estrutura de Taxas:
   ─────────────────────────────────────────────────────────────────────
   Mining Fee:           ${CONFIG.MINING_FEE_BIPS / 100}% → MiningManager (PoP)
   Burn Fee:             ${CONFIG.BURN_FEE_BIPS / 100}% → Queimado 🔥
   Total Fee:            ${(CONFIG.MINING_FEE_BIPS + CONFIG.BURN_FEE_BIPS) / 100}%
   Owner Receives:       ${100 - (CONFIG.MINING_FEE_BIPS + CONFIG.BURN_FEE_BIPS) / 100}%
   
   🚀 Novas Funcionalidades:
   ─────────────────────────────────────────────────────────────────────
   • promoteListing(tokenId) payable
     Usuários pagam ETH para promover seus listings
     
   • getPromotionFee(tokenId) view
     Retorna quanto ETH foi pago para promover um listing
     
   • getPromotionRanking() view
     Retorna todos os listings ordenados por taxa de promoção
     
   • setTreasury(address) onlyOwner
     Permite alterar o endereço da treasury
     
   • setRentalFees(miningBips, burnBips) onlyOwner
     Permite ajustar taxas de mining e burn
     
   • getFeeConfig() view
     Retorna configuração atual de taxas
     
   • totalBurnedAllTime() view
     Total de BKC queimado pelo marketplace 🔥
   
   🔗 Verificar no Explorer:
   ─────────────────────────────────────────────────────────────────────`);
   
    if (chainId === 421614n) {
        console.log(`   https://sepolia.arbiscan.io/address/${rentalProxyAddr}#code`);
    } else if (chainId === 42161n) {
        console.log(`   https://arbiscan.io/address/${rentalProxyAddr}#code`);
    }
    
    console.log(`
   📌 Próximos Passos:
   ─────────────────────────────────────────────────────────────────────
   1. Verificar contrato no Arbiscan:
      npx hardhat verify --network ${isMainnet ? 'arbitrum' : 'arbitrumSepolia'} ${newImplementation}
      
   2. Testar promoção de listing:
      await contract.promoteListing(tokenId, { value: ethers.parseEther("0.01") })
      
   3. Atualizar frontend (RentalPage.js) para usar novas funções
   
   4. Atualizar indexer para capturar evento ListingPromoted
   `);

    console.log("═".repeat(70) + "\n");
}

// ════════════════════════════════════════════════════════════════════════════
//                    ENTRY POINT
// ════════════════════════════════════════════════════════════════════════════

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Upgrade falhou:", error);
        process.exit(1);
    });