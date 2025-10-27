// scripts/1_initialMint.ts
// IMPORTANTE: Este script foi modificado para ser executado *DEPOIS* da pré-venda.
// Use-o para:
// 1. Mintar NFTs para a Tesouraria (Marketing).
// 2. Mintar NFTs e $BKC para as Piscinas de Liquidez (AMM).
// 3. Renunciar à propriedade do contrato RewardBoosterNFT (PASSO FINAL).

import hre from "hardhat";
import addresses from "../deployment-addresses.json";
import { LogDescription, ContractTransactionReceipt } from "ethers";
import fs from "fs";

// Função de atraso
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Wrapper de transação com retentativas
// --- CORREÇÃO: Corpo da função restaurado ---
async function sendTransactionWithRetries(txFunction: () => Promise<any>, retries = 3): Promise<ContractTransactionReceipt> {
  for (let i = 0; i < retries; i++) {
    try {
      const tx = await txFunction();
      console.log(`   -> Transação enviada... aguardando confirmação...`);
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transação enviada, mas o recibo retornado foi nulo.");
      }
      await sleep(1500); // Pausa para a rede processar
      return receipt;
    } catch (error: any) {
      if ((error.message.includes("nonce") || error.message.includes("in-flight")) && i < retries - 1) {
        const delay = (i + 1) * 5000;
        console.warn(`   ⚠️ Problema de nonce. Tentando novamente em ${delay / 1000} segundos...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  // Se o loop terminar (3 tentativas de nonce falharam), joga um erro.
  throw new Error("A transação falhou após múltiplas tentativas.");
}


// ######################################################################
// ###               CONFIGURE MANUALMENTE AQUI (PÓS-VENDA)           ###
// ######################################################################
// (Os valores foram movidos para dentro da função 'main' para corrigir o erro 'ethers is not defined')
// ######################################################################


async function main() {
  const { ethers } = hre; // 'ethers' é definido aqui
  const [deployer] = await ethers.getSigners();
  const treasuryWallet = deployer.address;

  // --- CORREÇÃO: Constantes movidas para dentro do 'main' ---
  const LIQUIDITY_BKC_AMOUNT_PER_POOL = ethers.parseEther("1000000");

  const TREASURY_TO_MINT = [
      { name: "Diamond", boostBips: 5000, metadata: "diamond_booster.json", amount: 10 },
      { name: "Platinum", boostBips: 4000, metadata: "platinum_booster.json", amount: 15 },
      { name: "Gold", boostBips: 3000, metadata: "gold_booster.json", amount: 40 },
      { name: "Silver", boostBips: 2000, metadata: "silver_booster.json", amount: 80 },
      { name: "Bronze", boostBips: 1000, metadata: "bronze_booster.json", amount: 120 },
      // { name: "Iron", boostBips: 500, metadata: "iron_booster.json", amount: 50 },
      // { name: "Crystal", boostBips: 100, metadata: "crystal_booster.json", amount: 100 },
  ];

  const LIQUIDITY_TO_MINT = [
      { name: "Diamond", boostBips: 5000, metadata: "diamond_booster.json", amount: 100 },
      { name: "Platinum", boostBips: 4000, metadata: "platinum_booster.json", amount: 150 },
      { name: "Gold", boostBips: 3000, metadata: "gold_booster.json", amount: 400 },
      { name: "Silver", boostBips: 2000, metadata: "silver_booster.json", amount: 800 },
      { name: "Bronze", boostBips: 1000, metadata: "bronze_booster.json", amount: 1200 },
      // { name: "Iron", boostBips: 500, metadata: "iron_booster.json", amount: 500 },
      // { name: "Crystal", boostBips: 100, metadata: "crystal_booster.json", amount: 1000 },
  ];
  // --- Fim da Correção ---


  console.log("🚀 Iniciando o processo PÓS-VENDA de criação de liquidez e NFTs da tesouraria...");

  const rewardBoosterNFT = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, deployer);
  const nftLiquidityPool = await ethers.getContractAt("NFTLiquidityPool", addresses.nftLiquidityPool, deployer);
  const bkcToken = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);

  const CHUNK_SIZE = 150; 
  const allTreasuryTokenIds: { [key: string]: string[] } = {};

  // --- Etapa 1: Mintar NFTs da Tesouraria (Marketing) ---
  console.log("\n--- Etapa 1: Mintando NFTs da Tesouraria (Marketing) ---");
  for (const tier of TREASURY_TO_MINT) {
    if (tier.amount === 0) continue;
    
    console.log(` -> Mintando ${tier.amount} NFTs (${tier.name}) para ${treasuryWallet}...`);
    const treasuryTokenIdsInTier: string[] = [];
    
    for (let i = 0; i < tier.amount; i += CHUNK_SIZE) {
        const amountToMint = Math.min(tier.amount - i, CHUNK_SIZE);

        const receipt = await sendTransactionWithRetries(() => 
            rewardBoosterNFT.ownerMintBatch(treasuryWallet, amountToMint, tier.boostBips, tier.metadata)
        );

        const tokenIdsInChunk = receipt.logs
            .map((log: any) => { try { return rewardBoosterNFT.interface.parseLog(log); } catch { return null; } })
            .filter((log): log is LogDescription => log !== null && log.name === "BoosterMinted")
            .map((log) => log.args.tokenId.toString());
        
        treasuryTokenIdsInTier.push(...tokenIdsInChunk);
    }
    allTreasuryTokenIds[tier.name] = treasuryTokenIdsInTier;
    console.log(`   ✅ ${tier.amount} NFTs (${tier.name}) da Tesouraria cunhados.`);
  }

  fs.writeFileSync("treasury-nft-ids.json", JSON.stringify(allTreasuryTokenIds, null, 2));
  console.log("\n✅ IDs dos NFTs da tesouraria salvos em treasury-nft-ids.json");


  // --- Etapa 2: Mintar NFTs e Adicionar Liquidez aos Pools ---
  console.log("\n--- Etapa 2: Adicionando Liquidez Inicial às Piscinas ---");

  // Aprova o $BKC uma única vez
  const bkcPoolCount = LIQUIDITY_TO_MINT.filter(t => t.amount > 0).length;
  const totalBkcApproval = LIQUIDITY_BKC_AMOUNT_PER_POOL * BigInt(bkcPoolCount);
  
  if (totalBkcApproval > 0) {
    console.log(`\n1. Aprovando o NFTLiquidityPool para gastar ${ethers.formatEther(totalBkcApproval)} $BKC...`);
    await sendTransactionWithRetries(() => bkcToken.approve(addresses.nftLiquidityPool, totalBkcApproval));
    console.log("✅ Aprovação de BKC bem-sucedida.");
  } else {
    console.log("\n1. Nenhum $BKC para aprovar (nenhuma liquidez para adicionar).");
  }


  // Aprova o NFT uma única vez
  await sendTransactionWithRetries(() => rewardBoosterNFT.setApprovalForAll(addresses.nftLiquidityPool, true));
  console.log("✅ Aprovação de NFTs para o Pool bem-sucedida.");

  for (const tier of LIQUIDITY_TO_MINT) {
    if (tier.amount === 0) continue;

    console.log(`\n--- Processando piscina: ${tier.name} (Total: ${tier.amount} NFTs) ---`);

    const poolInfo = await nftLiquidityPool.pools(tier.boostBips);
    if (poolInfo.isInitialized && poolInfo.nftCount > 0) {
        console.log(`⚠️  Pool do tier ${tier.name} já foi inicializado. Pulando.`);
        continue;
    }
    if (!poolInfo.isInitialized) {
        console.error(`❌ ERRO: Pool do tier ${tier.name} (boostBips: ${tier.boostBips}) não foi criado. Rode '0_createPools.ts' primeiro.`);
        continue;
    }

    // 1. Mintar NFTs para a carteira do Deployer
    console.log(` -> Mintando ${tier.amount} NFTs (${tier.name}) para a liquidez...`);
    const allPoolTokenIds: string[] = [];
    for (let i = 0; i < tier.amount; i += CHUNK_SIZE) {
        const amountToMint = Math.min(tier.amount - i, CHUNK_SIZE);
        
        const receipt = await sendTransactionWithRetries(() => 
            rewardBoosterNFT.ownerMintBatch(deployer.address, amountToMint, tier.boostBips, tier.metadata)
        );

        const tokenIdsInChunk = receipt.logs
            .map((log: any) => { try { return rewardBoosterNFT.interface.parseLog(log); } catch { return null; } })
            .filter((log): log is LogDescription => log !== null && log.name === "BoosterMinted")
            .map((log) => log.args.tokenId.toString());
        allPoolTokenIds.push(...tokenIdsInChunk);
    }
    console.log(`   ✅ Todos os ${allPoolTokenIds.length} NFTs para o pool foram cunhados.`);

    // 2. Adicionar liquidez em lotes
    console.log(` -> Adicionando liquidez com ${allPoolTokenIds.length} NFTs e ${ethers.formatEther(LIQUIDITY_BKC_AMOUNT_PER_POOL)} $BKC...`);
    let isFirstChunk = true;
    for (let i = 0; i < allPoolTokenIds.length; i += CHUNK_SIZE) {
        const chunk = allPoolTokenIds.slice(i, i + CHUNK_SIZE);
        if (isFirstChunk) {
            // A primeira transação adiciona os NFTs E os tokens $BKC
            await sendTransactionWithRetries(() => 
                nftLiquidityPool.addInitialLiquidity(tier.boostBips, chunk, LIQUIDITY_BKC_AMOUNT_PER_POOL)
            );
            isFirstChunk = false;
        } else {
            // As transações seguintes adicionam apenas mais NFTs (sem $BKC)
            await sendTransactionWithRetries(() => 
                nftLiquidityPool.addMoreNFTsToPool(tier.boostBips, chunk)
            );
        }
    }
    console.log("   ✅ Liquidez adicionada com sucesso.");
  }
  
  // Revoga a aprovação do NFT
  await sendTransactionWithRetries(() => rewardBoosterNFT.setApprovalForAll(addresses.nftLiquidityPool, false));

  // --- Etapa Final: Renunciar à Propriedade ---
  console.log("\n🔒 Etapa Final: Renunciando à propriedade do contrato RewardBoosterNFT...");
  await sendTransactionWithRetries(() => 
    rewardBoosterNFT.renounceOwnership()
  );
  console.log("✅ Propriedade renunciada. O suprimento de NFTs agora é imutável.");

  console.log("\n🎉 Processo de cunhagem e inicialização de liquidez concluído!");
}

main().catch((error: any) => {
  console.error("\n❌ ERRO CRÍTICO DURANTE A CUNHAGEM E INICIALIZAÇÃO PÓS-VENDA ❌\n");
  console.error("Ocorreu um erro inesperado:", error.message);
  process.exit(1);
});