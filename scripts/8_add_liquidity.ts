// scripts/8_add_liquidity.ts
// IMPORTANTE: Este script deve ser executado *APÓS* o término da pré-venda.
//
// LÓGICA: Cunha NFTs "não vendidos" (95% - Vendidos) e adiciona-os ao AMM de NFT.

import { HardhatRuntimeEnvironment } from "hardhat/types";
// REMOVIDO: import addressesJson from "../deployment-addresses.json";
import { LogDescription, ContractTransactionReceipt, ethers, Log } from "ethers";
import fs from "fs";
import path from "path";

// REMOVIDO: const addresses: { [key: string]: string } = addressesJson;

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Transaction wrapper with retries (função completa)
async function sendTransactionWithRetries(
  txFunction: () => Promise<any>,
  retries = 3
): Promise<ContractTransactionReceipt> {
  for (let i = 0; i < retries; i++) {
    try {
      const tx = await txFunction();
      console.log(`   -> Transação enviada... aguardando confirmação...`);
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transação enviada, mas um recibo nulo foi retornado.");
      }
      await sleep(1500);
      return receipt;
    } catch (error: any) {
      if (
        (error.message.includes("nonce") ||
          error.message.includes("in-flight") ||
          error.message.includes("underpriced")) &&
        i < retries - 1
      ) {
        const delay = (i + 1) * 5000;
        console.warn(
          `   ⚠️ Problema de Nonce detectado. Tentando novamente em ${delay / 1000} segundos...`
        );
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Transação falhou após múltiplas tentativas.");
}

// ######################################################################
// ###               CONFIGURE MANUALMENTE AQUI (PÓS-VENDA)              ###
// ######################################################################

// Sua nova regra: 2 Milhões de BKC por piscina AMM
const LIQUIDITY_BKC_AMOUNT_PER_POOL = ethers.parseEther("2000000"); // 2,000,000 BKC

// Definição dos 7 Tiers (deve corresponder ao 6_setup_sale.ts)
const ALL_TIERS = [
  { tierId: 0, name: "Diamond", boostBips: 5000, metadata: "diamond_booster.json" },
  { tierId: 1, name: "Platinum", boostBips: 4000, metadata: "platinum_booster.json" },
  { tierId: 2, name: "Gold", boostBips: 3000, metadata: "gold_booster.json" },
  { tierId: 3, name: "Silver", boostBips: 2000, metadata: "silver_booster.json" },
  { tierId: 4, name: "Bronze", boostBips: 1000, metadata: "bronze_booster.json" },
  { tierId: 5, name: "Iron", boostBips: 500, metadata: "iron_booster.json" },
  { tierId: 6, name: "Crystal", boostBips: 100, metadata: "crystal_booster.json" },
];

// Max NFTs para processar por transação
const CHUNK_SIZE = 150;
const CHUNK_SIZE_BIGINT = BigInt(CHUNK_SIZE);

// ######################################################################
// ###               NÃO EDITE ABAIXO DESTA LINHA                     ###
// ######################################################################

// A FUNÇÃO PRINCIPAL É AGORA EXPORTADA
export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  // --- Carregar Endereços (CORRIGIDO: Carregamento dinâmico) ---
  const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesFilePath)) {
    console.error("❌ Erro: 'deployment-addresses.json' não encontrado. O deploy master (passos 1-7) foi executado?");
    throw new Error("Missing deployment-addresses.json");
  }
  const addresses: { [key: string]: string } = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));


  // --- Carregar Contratos ---
  const hub = await ethers.getContractAt(
    "EcosystemManager",
    addresses.ecosystemManager,
    deployer
  );
  const treasuryWallet = await hub.getTreasuryAddress();

  console.log("🚀 (Passo 8/8) Iniciando processo PÓS-VENDA de liquidez...");
  console.log(`Usando a conta: ${deployer.address}`);
  console.log(`Carteira da Tesouraria (do Hub): ${treasuryWallet}`);
  console.log("----------------------------------------------------");

  // --- Obter Instâncias dos Contratos ---
  const rewardBoosterNFT = await ethers.getContractAt(
    "RewardBoosterNFT",
    addresses.rewardBoosterNFT,
    deployer
  );
  const nftLiquidityPool = await ethers.getContractAt(
    "NFTLiquidityPool",
    addresses.nftLiquidityPool,
    deployer
  );
  const bkcToken = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
  const publicSale = await ethers.getContractAt(
    "PublicSale",
    addresses.publicSale,
    deployer
  );

  console.log("\n--- Passo 1: Adicionando Liquidez Inicial às Piscinas AMM (usando não vendidos) ---");

  // Aprovar $BKC uma vez para todas as piscinas
  const bkcPoolCount = ALL_TIERS.length;
  const totalBkcApproval = LIQUIDITY_BKC_AMOUNT_PER_POOL * BigInt(bkcPoolCount);

  console.log(
    `\n1. Aprovando NFTLiquidityPool para gastar ${ethers.formatEther(totalBkcApproval)} $BKC...`
  );
  await sendTransactionWithRetries(() =>
    bkcToken.approve(addresses.nftLiquidityPool, totalBkcApproval)
  );
  console.log("✅ Aprovação do BKC bem-sucedida.");

  // Aprovar todos os NFTs para o Pool
  await sendTransactionWithRetries(() =>
    rewardBoosterNFT.setApprovalForAll(addresses.nftLiquidityPool, true)
  );
  console.log("✅ Aprovação de NFT para o Pool bem-sucedida.");


  // --- A LÓGICA INTELIGENTE COMEÇA AQUI ---
  for (const tier of ALL_TIERS) {
    console.log(`\n--- Processando liquidez da piscina para: ${tier.name} ---`);

    // 2a. Contabilização: Ler o contrato PublicSale
    const tierInfo = await publicSale.tiers(tier.tierId);
    const maxSupply = tierInfo.maxSupply; // Suprimento Total (100%)
    const mintedCount = tierInfo.mintedCount; // Quantos foram VENDIDOS (pelo público)
    
    // 2b. Calcular corretamente os não vendidos (95% - Vendidos)
    const saleAllocation = (maxSupply * 95n) / 100n; // Os 95% que estavam à venda
    let unsoldAmount = 0n;

    if (mintedCount >= saleAllocation) {
        unsoldAmount = 0n;
    } else {
        unsoldAmount = saleAllocation - mintedCount; // O que sobrou dos 95%
    }
    
    console.log(`   Estatísticas: Suprimento Máx.=${maxSupply}, Alocação Venda (95%)=${saleAllocation}`);
    console.log(`   Vendido (público)=${mintedCount}, Não Vendido (para liquidez)=${unsoldAmount}`);

    // 2c. Verificar o estado da piscina de liquidez
    const poolInfo = await nftLiquidityPool.pools(tier.boostBips);
    if (poolInfo.isInitialized && poolInfo.nftCount > 0) {
      console.log(`   ⚠️ AVISO: Piscina para ${tier.name} já tem liquidez. Pulando.`);
      continue;
    }
    if (!poolInfo.isInitialized) {
      console.error(`   ❌ ERRO: Piscina para ${tier.name} (boostBips: ${tier.boostBips}) não foi criada. Execute '5_create_pools.ts' primeiro.`);
      continue;
    }

    // 2d. Verificar se há NFTs "não vendidos" para adicionar
    if (unsoldAmount <= 0n) {
      console.log(`   ⚠️ AVISO: Tier ${tier.name} ESGOTADO. Nenhum NFT não vendido para criar piscina de liquidez.`);
      console.log(`   (O NFTLiquidityPool requer pelo menos 1 NFT para inicializar uma piscina)`);
      continue;
    }

    // 2e. Cunhar os NFTs "não vendidos" (unsoldAmount)
    console.log(` -> Cunhando ${unsoldAmount} NFTs "não vendidos" (${tier.name}) para a piscina de liquidez...`);
    const allPoolTokenIds: string[] = [];

    // Este loop usa 'bigint'
    for (let i = 0n; i < unsoldAmount; i += CHUNK_SIZE_BIGINT) {
      const remainingInLiquidityLoop = unsoldAmount - i;
      const amountToMint_Liquidity = remainingInLiquidityLoop < CHUNK_SIZE_BIGINT ? remainingInLiquidityLoop : CHUNK_SIZE_BIGINT;

      const receipt = await sendTransactionWithRetries(() =>
        rewardBoosterNFT.ownerMintBatch(
          deployer.address, // Cunha para si mesmo (deployer) primeiro
          Number(amountToMint_Liquidity), // Converte bigint para number
          tier.boostBips,
          tier.metadata
        )
      );

      // Analisa os logs para obter os token IDs
      const tokenIdsInChunk = receipt.logs
        .map((log: Log) => {
          try { return rewardBoosterNFT.interface.parseLog(log); } catch { return null; }
        })
        .filter((log: LogDescription | null): log is LogDescription => log !== null && log.name === "BoosterMinted")
        .map((log: LogDescription) => log.args.tokenId.toString());
          
      allPoolTokenIds.push(...tokenIdsInChunk);
    }
    console.log(`   ✅ Todos os ${allPoolTokenIds.length} NFTs não vendidos para a piscina foram cunhados.`);

    // 2f. Adicionar Liquidez (NFTs "não vendidos" + 2 Milhões BKC)
    console.log(
      ` -> Adicionando liquidez com ${allPoolTokenIds.length} NFTs não vendidos e ${ethers.formatEther(LIQUIDITY_BKC_AMOUNT_PER_POOL)} $BKC...`
    );
    let isFirstChunk = true;
    for (let i = 0; i < allPoolTokenIds.length; i += CHUNK_SIZE) {
      const chunk = allPoolTokenIds.slice(i, i + CHUNK_SIZE);
      if (isFirstChunk) {
        // A primeira transação adiciona NFTs E os 2M $BKC
        await sendTransactionWithRetries(() =>
          nftLiquidityPool.addInitialLiquidity(
            tier.boostBips,
            chunk,
            LIQUIDITY_BKC_AMOUNT_PER_POOL
          )
        );
        isFirstChunk = false;
      } else {
        // Transações subsequentes adicionam apenas mais NFTs
        await sendTransactionWithRetries(() =>
          nftLiquidityPool.addMoreNFTsToPool(tier.boostBips, chunk)
        );
      }
    }
    console.log(`   ✅ Liquidez para ${tier.name} adicionada com sucesso.`);
  }

  // Revoga a aprovação de NFT para o contrato do pool
  await sendTransactionWithRetries(() =>
    rewardBoosterNFT.setApprovalForAll(addresses.nftLiquidityPool, false)
  );
  console.log("✅ Aprovação de NFT para o Pool revogada.");
  console.log("----------------------------------------------------");

  // --- Passo Final: Renunciar à Posse ---
  console.log(
    "\n🔒 Passo Final: Renunciando à posse do RewardBoosterNFT..."
  );
  // Apenas renuncia se o deployer ainda for o dono
  const currentOwner = await rewardBoosterNFT.owner();
  if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
      await sendTransactionWithRetries(() =>
        rewardBoosterNFT.renounceOwnership()
      );
      console.log("✅ Posse renunciada. O suprimento de NFT agora é FINAL e IMUTÁVEL.");
  } else {
      console.log(`⚠️  Posse já transferida ou renunciada. Dono atual: ${currentOwner}`);
  }
  console.log("----------------------------------------------------");

  console.log(
    "\n🎉🎉🎉 CUNHAGEM PÓS-VENDA E INICIALIZAÇÃO DA LIQUIDEZ CONCLUÍDAS! 🎉🎉🎉"
  );
  console.log("\n✅ O ecossistema está totalmente configurado e o mercado secundário de NFT está ATIVO.");
}

// ====================================================================
// Ponto de entrada para execução standalone (se necessário)
// ====================================================================
// (Removido o bloco de execução automática para garantir que seja chamado apenas pelo run_master.ts)

// ADICIONADO BLOCO DE CORREÇÃO:
if (require.main === module) {
  console.log("Executando 8_add_liquidity.ts como script standalone...");
  // Precisamos importar o 'hre' (Hardhat Runtime Environment)
  import("hardhat").then(hre => {
    runScript(hre) // Chama a função principal do script
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  });
}