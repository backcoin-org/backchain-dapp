import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// ---
// CONFIGURAÇÃO DA PRÉ-VENDA ILIMITADA
// Preços baseados no PresalePage.js
// Boosts e Metadados baseados no 1_initialMint.ts [cite: 112] e RewardBoosterNFT.sol
// ---
const tiersToSetup = [
    { tierId: 0, priceETH: "3.60", boostBips: 5000, metadata: "diamond_booster.json" },
    { tierId: 1, priceETH: "1.44", boostBips: 4000, metadata: "platinum_booster.json" },
    { tierId: 2, priceETH: "0.54", boostBips: 3000, metadata: "gold_booster.json" },
    { tierId: 3, priceETH: "0.27", boostBips: 2000, metadata: "silver_booster.json" },
    { tierId: 4, priceETH: "0.144", boostBips: 1000, metadata: "bronze_booster.json" },
    
    // Tiers "Iron" e "Crystal" do PresalePage.js (IDs 5 e 6)
    // (Assumindo boostBips de 500 para 5% e 100 para 1%)
    { tierId: 5, priceETH: "0.07", boostBips: 500, metadata: "iron_booster.json" },
    { tierId: 6, priceETH: "0.01", boostBips: 100, metadata: "crystal_booster.json" },
];

async function main() {
    const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

    const SALE_CONTRACT_ADDRESS = (addresses as any).publicSale;
    if (!SALE_CONTRACT_ADDRESS) {
        console.error("❌ Erro: Endereço do PublicSale não encontrado em deployment-addresses.json.");
        console.log("Rode 'deploySale.ts' primeiro.");
        return;
    }

    const [deployer] = await hre.ethers.getSigners();
    console.log("🚀 Configurando a Venda Pública (Ilimitada) com a conta:", deployer.address);
    console.log(`Usando contrato PublicSale em: ${SALE_CONTRACT_ADDRESS}`);

    const saleContract = await hre.ethers.getContractAt("PublicSale", SALE_CONTRACT_ADDRESS, deployer);

    // --- REMOVIDO ---
    // A lógica de 'setApprovalForAll'  foi removida,
    // pois o contrato PublicSale VAI MINTAR[cite: 45], não transferir NFTs do deployer.

    for (const tier of tiersToSetup) {
        console.log(`\n🔹 Configurando Tier ID ${tier.tierId} (${tier.metadata})...`);

        const priceInWei = ethers.parseEther(tier.priceETH);

        try {
            console.log(`   Preço: ${tier.priceETH} BNB (${priceInWei} Wei)`);
            console.log(`   Boost: ${tier.boostBips} BIPS`);

            // Esta é a nova função setTier do PublicSale.sol (V3)
            // (Sem o parâmetro _maxSupply)
            const tx = await saleContract.setTier(
                tier.tierId,
                priceInWei,
                tier.boostBips,
                tier.metadata
            );
            await tx.wait();
            console.log(`   ✅ Tier ${tier.metadata} configurado com sucesso!`);
        } catch (error: any) {
            console.error(`   ❌ Falha ao configurar o Tier ${tier.tierId}. Motivo: ${error.reason || error.message}`);
        }
    }

    // --- REMOVIDO ---
    // A lógica de revogar permissão  não é mais necessária.

    console.log("\n🎉 Configuração da Venda Pública (Ilimitada) concluída!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});