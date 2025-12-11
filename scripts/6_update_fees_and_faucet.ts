import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ######################################################################
// ###                      CONFIGURAÇÃO (EDITE AQUI)                 ###
// ######################################################################

// 1. FORTUNE POOL (Taxa do Oráculo)
// Defina 0 para "Free". O modo 5x será automaticamente 5 vezes este valor.
const NEW_ORACLE_FEE_ETH = "0.0003"; // Ex: 0.0001 ETH para 1x (0.0005 ETH para 5x)

// 2. FAUCET (Quantidade de Tokens e ETH por claim)
const NEW_FAUCET_BKC_AMOUNT = "200";    // 200 BKC por request
const NEW_FAUCET_ETH_DRIP = "0.002";   // 0.001 ETH nativo por request

// ######################################################################

async function main() {
    const [updater] = await ethers.getSigners();
    console.log(`\n⚙️  ATUALIZANDO CONFIGURAÇÕES DO ECOSSISTEMA`);
    console.log(`   🔑 Updater: ${updater.address}`);

    // 1. Carregar Endereços
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    if (!fs.existsSync(addressesPath)) throw new Error("❌ deployment-addresses.json não encontrado");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    // =================================================================
    // 🎰 ATUALIZAR FORTUNE POOL
    // =================================================================
    console.log("\n1️⃣  FORTUNE POOL: Ajustando Taxas do Oráculo...");
    
    const fortunePool = await ethers.getContractAt("FortunePool", addresses.fortunePool, updater);
    const currentFee = await fortunePool.oracleFeeInWei();
    const newFeeWei = ethers.parseEther(NEW_ORACLE_FEE_ETH);

    console.log(`   📊 Atual: ${ethers.formatEther(currentFee)} ETH`);
    console.log(`   🎯 Meta:  ${NEW_ORACLE_FEE_ETH} ETH`);

    if (currentFee !== newFeeWei) {
        console.log(`   ⏳ Atualizando taxa...`);
        const tx = await fortunePool.setOracleFee(newFeeWei);
        await tx.wait();
        console.log(`   ✅ Taxa atualizada com sucesso!`);
        console.log(`      -> 1x (Single): ${ethers.formatEther(newFeeWei)} ETH`);
        console.log(`      -> 5x (Cumulative): ${ethers.formatEther(newFeeWei * 5n)} ETH`);
    } else {
        console.log(`   ✅ Taxa já está correta. Nenhuma alteração necessária.`);
    }

    // =================================================================
    // 🚰 ATUALIZAR FAUCET
    // =================================================================
    console.log("\n2️⃣  FAUCET: Ajustando Limites de Distribuição...");

    const faucet = await ethers.getContractAt("SimpleBKCFaucet", addresses.faucet, updater);
    
    // Ler valores atuais
    const currBkc = await faucet.tokensPerRequest();
    const currEth = await faucet.ethPerRequest();

    const newBkcWei = ethers.parseEther(NEW_FAUCET_BKC_AMOUNT);
    const newEthWei = ethers.parseEther(NEW_FAUCET_ETH_DRIP);

    console.log(`   📊 Atual: ${ethers.formatEther(currBkc)} BKC | ${ethers.formatEther(currEth)} ETH`);
    console.log(`   🎯 Meta:  ${NEW_FAUCET_BKC_AMOUNT} BKC | ${NEW_FAUCET_ETH_DRIP} ETH`);

    if (currBkc !== newBkcWei || currEth !== newEthWei) {
        console.log(`   ⏳ Atualizando quantidades...`);
        // Função setAmounts(uint256 _tokensPerRequest, uint256 _ethPerRequest)
        const tx = await faucet.setAmounts(newBkcWei, newEthWei);
        await tx.wait();
        console.log(`   ✅ Faucet atualizado com sucesso!`);
    } else {
        console.log(`   ✅ Valores já estão corretos. Nenhuma alteração necessária.`);
    }

    console.log("\n🏁 AJUSTES CONCLUÍDOS!\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});