// scripts/6_addInitialLiquidity.ts
// IMPORTANTE: Este script deve ser executado *APÓS* o término da pré-venda.
//
// LÓGICA INTELIGENTE (NOVA):
// 1. LÊ o maxSupply de cada tier no PublicSale.
// 2. MINTA 5% do maxSupply de cada tier para a TESOURARIA.
// 3. Contabiliza os NFTs vendidos no PublicSale (maxSupply - mintedCount).
// 4. Minta o "restante" dos NFTs (aqueles não vendidos dos 95% originais).
// 5. Adiciona o "restante" + 2 Milhões de BKC à NFTLiquidityPool.
// 6. Renuncia à propriedade do RewardBoosterNFT (PASSO FINAL E PERMANENTE).

import hre from "hardhat";
import addressesJson from "../deployment-addresses.json";
import { LogDescription, ContractTransactionReceipt, ethers } from "ethers";
import fs from "fs";

// Type assertion for the addresses object
const addresses: { [key: string]: string } = addressesJson;

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Transaction wrapper with retries
async function sendTransactionWithRetries(
  txFunction: () => Promise<any>,
  retries = 3
): Promise<ContractTransactionReceipt> {
  for (let i = 0; i < retries; i++) {
    try {
      const tx = await txFunction();
      console.log(`   -> Transaction sent... awaiting confirmation...`);
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transaction sent, but a null receipt was returned.");
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
          `   ⚠️ Nonce issue detected. Retrying in ${delay / 1000} seconds...`
        );
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Transaction failed after multiple retry attempts.");
}

// ######################################################################
// ###               CONFIGURE MANUALMENTE AQUI (PÓS-VENDA)              ###
// ######################################################################

// Sua nova regra: 2 Milhões de BKC por piscina
const LIQUIDITY_BKC_AMOUNT_PER_POOL = ethers.parseEther("2000000"); // 2,000,000 BKC

// Definição dos 7 Tiers (deve corresponder ao 5_setupSale.ts)
const ALL_TIERS = [
  { tierId: 0, name: "Diamond", boostBips: 5000, metadata: "diamond_booster.json" },
  { tierId: 1, name: "Platinum", boostBips: 4000, metadata: "platinum_booster.json" },
  { tierId: 2, name: "Gold", boostBips: 3000, metadata: "gold_booster.json" },
  { tierId: 3, name: "Silver", boostBips: 2000, metadata: "silver_booster.json" },
  { tierId: 4, name: "Bronze", boostBips: 1000, metadata: "bronze_booster.json" },
  { tierId: 5, name: "Iron", boostBips: 500, metadata: "iron_booster.json" },
  { tierId: 6, name: "Crystal", boostBips: 100, metadata: "crystal_booster.json" },
];

// Max NFTs to process per transaction
const CHUNK_SIZE = 150;
const CHUNK_SIZE_BIGINT = BigInt(CHUNK_SIZE);

// ######################################################################
// ###               NÃO EDITE ABAIXO DESTA LINHA                     ###
// ######################################################################

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const hub = await ethers.getContractAt(
    "EcosystemManager",
    addresses.ecosystemManager,
    deployer
  );
  const treasuryWallet = await hub.getTreasuryAddress();

  console.log("🚀 Starting POST-SALE liquidity and treasury minting process...");
  console.log(`Using account: ${deployer.address}`);
  console.log(`Treasury Wallet (from Hub): ${treasuryWallet}`);
  console.log("----------------------------------------------------");

  // --- Load Contracts ---
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

  // --- Step 1: Mint 5% for Treasury ---
  console.log("\n--- Step 1: Minting 5% of Max Supply for Treasury ---");
  const allTreasuryTokenIds: { [key: string]: string[] } = {};

  for (const tier of ALL_TIERS) { // Itera sobre ALL_TIERS para pegar maxSupply
    console.log(`\n -> Processing Treasury mint for: ${tier.name}`);

    // 1a. Ler maxSupply do PublicSale
    const tierInfo = await publicSale.tiers(tier.tierId);
    const maxSupply = tierInfo.maxSupply; // é bigint
    if (maxSupply === 0n) {
        console.log(`   ⚠️ WARNING: Max supply for ${tier.name} is 0 in PublicSale. Skipping Treasury mint.`);
        continue;
    }

    // 1b. Calcular 5% (usando bigint)
    const fivePercent = (maxSupply * 5n) / 100n; // bigint * bigint / bigint = bigint
    console.log(`   Max Supply: ${maxSupply}, Calculating 5%: ${fivePercent}`);

    if (fivePercent === 0n) {
        console.log(`   ⚠️ WARNING: Calculated 5% for ${tier.name} is 0. Skipping Treasury mint.`);
        allTreasuryTokenIds[tier.name] = [];
        continue;
    }

    // 1c. Mintar os 5% para a Tesouraria
    console.log(`   -> Minting ${fivePercent} NFTs (${tier.name}) to Treasury ${treasuryWallet}...`);
    const treasuryTokenIdsInTier: string[] = [];
    // Loop usa 'bigint'
    for (let i = 0n; i < fivePercent; i += CHUNK_SIZE_BIGINT) {
        const remainingInTreasuryLoop = fivePercent - i; // bigint - bigint = bigint
        const amountToMint_Treasury = remainingInTreasuryLoop < CHUNK_SIZE_BIGINT ? remainingInTreasuryLoop : CHUNK_SIZE_BIGINT; // bigint ternary

        const receipt = await sendTransactionWithRetries(() =>
            rewardBoosterNFT.ownerMintBatch(
                treasuryWallet,
                Number(amountToMint_Treasury), // Converte para number antes de enviar
                tier.boostBips,
                tier.metadata
            )
        );
        const tokenIdsInChunk = receipt.logs
            .map((log: any) => {
                try { return rewardBoosterNFT.interface.parseLog(log); } catch { return null; }
            })
            .filter((log): log is LogDescription => log !== null && log.name === "BoosterMinted")
            .map((log) => log.args.tokenId.toString());
        treasuryTokenIdsInTier.push(...tokenIdsInChunk);
    }
    allTreasuryTokenIds[tier.name] = treasuryTokenIdsInTier;
    console.log(`   ✅ ${fivePercent} (${tier.name}) Treasury NFTs minted.`);
  }
  fs.writeFileSync(
    "treasury-nft-ids.json",
    JSON.stringify(allTreasuryTokenIds, null, 2)
  );
  console.log("\n✅ Treasury NFT IDs (5% of Max Supply) saved to treasury-nft-ids.json");
  console.log("----------------------------------------------------");


  // --- Step 2: "Intelligent" Liquidity Addition (Contabilização dos 95% restantes) ---
  console.log("\n--- Step 2: Adding Initial Liquidity to AMM Pools (using unsold from PublicSale) ---");

  // Approve $BKC one time for all pools that might receive liquidity
  const bkcPoolCount = ALL_TIERS.length; // Assume all pools *might* get liquidity initially
  const totalBkcApproval = LIQUIDITY_BKC_AMOUNT_PER_POOL * BigInt(bkcPoolCount);

  console.log(
    `\n1. Approving NFTLiquidityPool to spend ${ethers.formatEther(totalBkcApproval)} $BKC...`
  );
  await sendTransactionWithRetries(() =>
    bkcToken.approve(addresses.nftLiquidityPool, totalBkcApproval)
  );
  console.log("✅ BKC approval successful.");

  // Approve all NFTs for the Pool (needed for addInitialLiquidity/addMoreNFTsToPool)
  await sendTransactionWithRetries(() =>
    rewardBoosterNFT.setApprovalForAll(addresses.nftLiquidityPool, true)
  );
  console.log("✅ NFT approval for Pool successful.");


  // --- A LÓGICA INTELIGENTE COMEÇA AQUI ---
  for (const tier of ALL_TIERS) { // Loop sobre ALL_TIERS
    console.log(`\n--- Processing pool liquidity for: ${tier.name} ---`);

    // 2a. Contabilização: Ler o contrato PublicSale novamente
    const tierInfo = await publicSale.tiers(tier.tierId);
    const maxSupply = tierInfo.maxSupply; // Total supply defined in PublicSale
    const mintedCount = tierInfo.mintedCount; // How many were SOLD from the 95%
    // 'remaining' now represents the UNSOLD portion of the total supply
    const remaining = maxSupply - mintedCount; // bigint - bigint = bigint

    console.log(`   Stats: MaxSupply=${maxSupply}, Sold=${mintedCount}, Unsold=${remaining}`);

    // 2b. Verificar o estado do pool de liquidez
    const poolInfo = await nftLiquidityPool.pools(tier.boostBips);
    if (poolInfo.isInitialized && poolInfo.nftCount > 0) {
      console.log(`   ⚠️ WARNING: Pool for ${tier.name} already has liquidity. Skipping.`);
      continue;
    }
    if (!poolInfo.isInitialized) {
      console.error(`   ❌ ERROR: Pool for ${tier.name} (boostBips: ${tier.boostBips}) not created. Run '4_createPools.ts' first.`);
      continue;
    }

    // 2c. Verificar se há NFTs "restantes" (não vendidos) para adicionar
    if (remaining <= 0n) {
      console.log(`   ⚠️ WARNING: Tier ${tier.name} SOLD OUT (or only Treasury exists). No unsold NFTs to create liquidity pool.`);
      console.log(`   (The NFTLiquidityPool requires at least 1 NFT to initialize a pool)`);
      continue;
    }

    // 2d. Mintar os NFTs "restantes" (não vendidos)
    console.log(` -> Minting ${remaining} "unsold" NFTs (${tier.name}) for liquidity pool...`);
    const allPoolTokenIds: string[] = [];

    // Este loop usa 'bigint' pois 'remaining' é um 'bigint'
    for (let i = 0n; i < remaining; i += CHUNK_SIZE_BIGINT) { // 'i' é bigint

      // ###################
      // ### INÍCIO DA CORREÇÃO ###
      // ###################
      // CORREÇÃO: Força a tipagem para BigInt
      const remainingInLiquidityLoop = BigInt(remaining) - BigInt(i); // bigint - bigint = bigint
      // ###################
      // ### FIM DA CORREÇÃO ###
      // ###################

      // Calcula a quantidade a mintar (bigint)
      const amountToMint_Liquidity = remainingInLiquidityLoop < CHUNK_SIZE_BIGINT ? remainingInLiquidityLoop : CHUNK_SIZE_BIGINT; // bigint ternary

      const receipt = await sendTransactionWithRetries(() =>
        rewardBoosterNFT.ownerMintBatch(
          deployer.address, // Mint to self (deployer) first
          Number(amountToMint_Liquidity), // Convert bigint to number for tx
          tier.boostBips,
          tier.metadata
        )
      );
      // Parse logs to get token IDs
      const tokenIdsInChunk = receipt.logs
        .map((log: any) => {
          try { return rewardBoosterNFT.interface.parseLog(log); } catch { return null; }
        })
        .filter((log): log is LogDescription => log !== null && log.name === "BoosterMinted")
        .map((log) => log.args.tokenId.toString());
      allPoolTokenIds.push(...tokenIdsInChunk);
    }
    console.log(`   ✅ All ${allPoolTokenIds.length} unsold NFTs for pool minted.`);

    // 2e. Adicionar Liquidez (NFTs "restantes" + 2 Milhões BKC)
    console.log(
      ` -> Adding liquidity with ${allPoolTokenIds.length} unsold NFTs and ${ethers.formatEther(LIQUIDITY_BKC_AMOUNT_PER_POOL)} $BKC...`
    );
    let isFirstChunk = true;
    for (let i = 0; i < allPoolTokenIds.length; i += CHUNK_SIZE) {
      const chunk = allPoolTokenIds.slice(i, i + CHUNK_SIZE);
      if (isFirstChunk) {
        // First transaction adds NFTs AND the 2M $BKC
        await sendTransactionWithRetries(() =>
          nftLiquidityPool.addInitialLiquidity(
            tier.boostBips,
            chunk,
            LIQUIDITY_BKC_AMOUNT_PER_POOL
          )
        );
        isFirstChunk = false;
      } else {
        // Subsequent transactions only add more NFTs
        await sendTransactionWithRetries(() =>
          nftLiquidityPool.addMoreNFTsToPool(tier.boostBips, chunk)
        );
      }
    }
    console.log(`   ✅ Liquidity for ${tier.name} added successfully.`);
  }

  // Revoke NFT approval for the pool contract
  await sendTransactionWithRetries(() =>
    nftLiquidityPool.setApprovalForAll(addresses.nftLiquidityPool, false)
  );
  console.log("✅ NFT approval for Pool revoked.");
  console.log("----------------------------------------------------");

  // --- Final Step: Renounce Ownership ---
  console.log(
    "\n🔒 Final Step: Renouncing ownership of RewardBoosterNFT..."
  );
  // Only renounce if the deployer is still the owner
  const currentOwner = await rewardBoosterNFT.owner();
  if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
      await sendTransactionWithRetries(() =>
        rewardBoosterNFT.renounceOwnership()
      );
      console.log("✅ Ownership renounced. NFT supply is now FINAL and IMMUTABLE.");
  } else {
      console.log(`⚠️  Ownership already transferred or renounced. Current owner: ${currentOwner}`);
  }
  console.log("----------------------------------------------------");

  console.log(
    "\n🎉🎉🎉 POST-SALE MINTING AND LIQUIDITY INITIALIZATION COMPLETE! 🎉🎉🎉"
  );
  console.log("\n✅ The ecosystem is fully configured, and the NFT secondary market is ACTIVE.");
}

main().catch((error: any) => {
  console.error(
    "\n❌ CRITICAL ERROR DURING POST-SALE MINTING & LIQUIDITY ❌\n"
  );
  console.error("An unexpected error occurred:", error.message, error.stack);
  process.exit(1);
});