// scripts/6_setup_sale.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, LogDescription, Log } from "ethers";
import fs from "fs";
import path from "path";
// REMOVIDO: import addressesJson from "../deployment-addresses.json";

// REMOVIDO: const addresses: { [key: string]: string } = addressesJson;

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- ⚙️ CONFIGURAÇÃO DA PRÉ-VENDA ---
//
// Os valores de 'maxSupply' representam 100% do suprimento total por Tier.
// O script cunhará 5% desse valor para a Tesouraria e configurará a venda dos 95% restantes.
//
const TIERS_TO_SETUP = [
  { tierId: 0, maxSupply: 100, priceETH: "3.60", boostBips: 5000, metadata: "diamond_booster.json" },
  { tierId: 1, maxSupply: 250, priceETH: "1.44", boostBips: 4000, metadata: "platinum_booster.json" },
  { tierId: 2, maxSupply: 500, priceETH: "0.54", boostBips: 3000, metadata: "gold_booster.json" },
  { tierId: 3, maxSupply: 1000, priceETH: "0.27", boostBips: 2000, metadata: "silver_booster.json" },
  { tierId: 4, maxSupply: 2000, priceETH: "0.144", boostBips: 1000, metadata: "bronze_booster.json" },
  { tierId: 5, maxSupply: 5000, priceETH: "0.07", boostBips: 500, metadata: "iron_booster.json" },
  { tierId: 6, maxSupply: 10000, priceETH: "0.01", boostBips: 100, metadata: "crystal_booster.json" },
];

const CHUNK_SIZE_BIGINT = BigInt(150); // Mintar em lotes de 150

// A FUNÇÃO PRINCIPAL É AGORA EXPORTADA
export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;
  
  console.log(`🚀 (Passo 6/8) Configurando Venda e Cunhando 5% da Tesouraria na rede: ${networkName}`);
  console.log(`Usando a conta: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // --- 1. Carregar Endereços (CORRIGIDO: Carregamento dinâmico) ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    console.error("❌ Erro: 'deployment-addresses.json' não encontrado. O Passo 1 falhou?");
    throw new Error("Missing deployment-addresses.json");
  }
  const addresses: { [key: string]: string } = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
  
  const saleContractAddress = addresses.publicSale;
  const boosterAddress = addresses.rewardBoosterNFT;
  const hubAddress = addresses.ecosystemManager;

  if (!saleContractAddress || !boosterAddress || !hubAddress) {
    console.error("❌ Erro: Endereços 'publicSale', 'rewardBoosterNFT', ou 'ecosystemManager' não encontrados.");
    throw new Error("Missing sale or NFT addresses.");
  }
  
  // --- 2. Obter Instâncias dos Contratos ---
  const saleContract = await ethers.getContractAt("PublicSale", saleContractAddress, deployer);
  const rewardBoosterNFT = await ethers.getContractAt("RewardBoosterNFT", boosterAddress, deployer);
  const hub = await ethers.getContractAt("EcosystemManager", hubAddress, deployer);

  const treasuryWallet = await hub.getTreasuryAddress();
  console.log(`Carteira da Tesouraria (do Hub): ${treasuryWallet}`);
  console.log("----------------------------------------------------");

  // --- 3. Cunhar 5% para a Tesouraria ---
  console.log("Iniciando cunhagem de 5% da Tesouraria (Ações de Marketing)...");
  const allTreasuryTokenIds: { [key: string]: string[] } = {};

  for (const tier of TIERS_TO_SETUP) {
    console.log(`\n -> Processando cunhagem da Tesouraria para: ${tier.metadata}`);

    // 3a. Ler maxSupply (100%) da NOSSA CONFIGURAÇÃO
    const maxSupply = BigInt(tier.maxSupply);
    if (maxSupply === 0n) {
        console.log(`   ⚠️ AVISO: maxSupply para ${tier.metadata} é 0 na configuração. Pulando cunhagem da Tesouraria.`);
        continue;
    }

    // 3b. Calcular 5%
    const fivePercent = (maxSupply * 5n) / 100n; // bigint
    console.log(`   Suprimento Máx.: ${maxSupply}, Calculando 5%: ${fivePercent}`);

    if (fivePercent === 0n) {
        console.log(`   ⚠️ AVISO: 5% calculado para ${tier.metadata} é 0. Pulando.`);
        allTreasuryTokenIds[tier.metadata] = [];
        continue;
    }

    // 3c. Cunhar os 5% para a Tesouraria em lotes
    console.log(`   -> Cunhando ${fivePercent} NFTs (${tier.metadata}) para a Tesouraria ${treasuryWallet}...`);
    const treasuryTokenIdsInTier: string[] = [];
    
    for (let i = 0n; i < fivePercent; i += CHUNK_SIZE_BIGINT) {
        const remainingInTreasuryLoop = fivePercent - i;
        const amountToMint_Treasury = remainingInTreasuryLoop < CHUNK_SIZE_BIGINT ? remainingInTreasuryLoop : CHUNK_SIZE_BIGINT;

        const tx = await rewardBoosterNFT.ownerMintBatch(
            treasuryWallet,
            Number(amountToMint_Treasury), // Converte para number
            tier.boostBips,
            tier.metadata
        );
        const receipt = await tx.wait();
        
        // Extrai os Token IDs dos logs do evento (com tipos explícitos)
        const tokenIdsInChunk = receipt.logs
            .map((log: Log) => {
                try { return rewardBoosterNFT.interface.parseLog(log); } catch { return null; }
            })
            .filter((log: LogDescription | null): log is LogDescription => log !== null && log.name === "BoosterMinted")
            .map((log: LogDescription) => log.args.tokenId.toString());
            
        treasuryTokenIdsInTier.push(...tokenIdsInChunk);
    }
    allTreasuryTokenIds[tier.metadata] = treasuryTokenIdsInTier;
    console.log(`   ✅ ${fivePercent} (${tier.metadata}) NFTs da Tesouraria cunhados.`);
  }
  
  // Salva o JSON na raiz do projeto
  const treasuryIdsPath = path.join(__dirname, "../treasury-nft-ids.json");
  fs.writeFileSync(
    treasuryIdsPath,
    JSON.stringify(allTreasuryTokenIds, null, 2)
  );
  console.log(`\n✅ IDs dos NFTs da Tesouraria (5%) salvos em ${treasuryIdsPath}`);
  console.log("----------------------------------------------------");


  // --- 4. Configurar Tiers de Venda (para os 95% restantes) ---
  console.log("Configurando 7 tiers de venda para os preços do 'Lote 1'...");

  for (const tier of TIERS_TO_SETUP) {
    console.log(`\n🔹 Configurando Tier ID ${tier.tierId} (${tier.metadata})...`);
    
    const priceInWei = ethers.parseEther(tier.priceETH);
    const maxSupply = BigInt(tier.maxSupply); // Pega o maxSupply da config

    try {
      console.log(`   Suprimento Máx.: ${maxSupply.toString()}`);
      console.log(`   Preço: ${tier.priceETH} BNB (${priceInWei} Wei)`);
      console.log(`   Boost: ${tier.boostBips} BIPS`);

      // Ordem: _tierId, _priceInWei, _maxSupply, _boostBips, _metadataFile
      const tx = await saleContract.setTier(
        tier.tierId,
        priceInWei, // 2º Argumento (Preço)
        maxSupply, // 3º Argumento (MaxSupply)
        tier.boostBips,
        tier.metadata
      );
      await tx.wait();
      console.log(`   ✅ Tier ${tier.metadata} configurado com sucesso!`);
    } catch (error: any) {
      console.error(`   ❌ FALHA ao configurar Tier ${tier.tierId}. Razão: ${error.reason || error.message}`);
      throw error;
    }
  }

  console.log("----------------------------------------------------");
  console.log("\n🎉🎉🎉 CONFIGURAÇÃO DO PUBLIC SALE CONCLUÍDA! 🎉🎉🎉");
  console.log("A pré-venda está agora pronta para o público.");
  console.log("\nPróximo passo: Execute '7_configure_fees.ts'");
}