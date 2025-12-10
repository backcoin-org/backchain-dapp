// scripts/5_verify_full_ecosystem.ts
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// --- Utilitários ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Garante conversão segura para BigInt antes de formatar
const toEther = (val: bigint | number | any) => ethers.formatEther(BigInt(val));

// Coletores de Dados
const report: string[] = [];
let totalGasSpent = 0n; // Acumulador de Gás

// Função auxiliar para enviar Tx com Auditoria de Gás e Log Visual
async function sendTx(txPromise: Promise<any>, description: string) {
    process.stdout.write(`      ➡️ ${description}... `);
    try {
        const tx = await txPromise;
        // Espera a confirmação para pegar o recibo real
        const receipt = await tx.wait();
        
        // Cálculo de Gás
        const gasUsed = BigInt(receipt.gasUsed);
        const gasPrice = BigInt(receipt.gasPrice); // Na Arbitrum isso é o effectiveGasPrice
        const cost = gasUsed * gasPrice;
        
        // Atualiza acumulador global
        totalGasSpent += cost;

        console.log(`\n         📝 Hash: https://sepolia.arbiscan.io/tx/${tx.hash}`);
        console.log(`         ⛽ Custo Gás: ${toEther(cost)} ETH (${gasUsed} units)`);
        console.log(`         ✅ Confirmado!`);
        
        return tx;
    } catch (error: any) {
        console.log(` ❌ ERRO!`);
        console.error(`         Motivo: ${error.message}`);
        throw error;
    }
}

// Auditor Econômico (Mineração + Gás)
async function executeWithMiningAudit(
    bkcContract: any, 
    miningManager: any,
    txPromise: Promise<any>, 
    actionName: string, 
    expectedFee: bigint
) {
    // 1. Snapshot Before
    const supplyBefore = BigInt(await bkcContract.totalSupply());
    
    // 2. Execute Tx (O sendTx já calcula e loga o gás)
    const tx = await sendTx(txPromise, actionName);
    
    // 3. Snapshot After
    const supplyAfter = BigInt(await bkcContract.totalSupply());
    const minedAmount = supplyAfter - supplyBefore;
    
    // 4. Calculate Stats
    let ratio = "0%";
    if (expectedFee > 0n) {
        // Ratio = (Mined / Fee) * 100
        const ratioBig = (minedAmount * 100n) / expectedFee;
        ratio = `${ratioBig.toString()}%`;
    }

    console.log(`         📊 [ECON] Fee Paid: ${toEther(expectedFee)} BKC`);
    console.log(`         ⛏️ [ECON] Mined:    ${toEther(minedAmount)} BKC (Dynamic Scarcity)`);
    console.log(`         📉 [ECON] Ratio:    ${ratio} Efficiency`);
    
    return { tx, minedAmount };
}

async function main() {
  const [tester] = await ethers.getSigners();
  console.log(`\n🕵️‍♂️ ECOSYSTEM AUDIT (GAS + ECONOMY + INTEGRITY)`);
  console.log(`   🧑‍🚀 Tester: ${tester.address}`);
  console.log(`   🌐 Network: Arbitrum Sepolia`);

  // 1. Load Addresses
  const addressesPath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesPath)) throw new Error("File deployment-addresses.json not found.");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  // 2. Instantiate Contracts
  const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, tester);
  const hub = await ethers.getContractAt("EcosystemManager", addresses.ecosystemManager, tester);
  const notary = await ethers.getContractAt("DecentralizedNotary", addresses.decentralizedNotary, tester);
  const delegation = await ethers.getContractAt("DelegationManager", addresses.delegationManager, tester);
  const nft = await ethers.getContractAt("RewardBoosterNFT", addresses.rewardBoosterNFT, tester);
  const rental = await ethers.getContractAt("RentalManager", addresses.rentalManager, tester);
  const fortune = await ethers.getContractAt("FortunePool", addresses.fortunePool, tester);
  const factory = await ethers.getContractAt("NFTLiquidityPoolFactory", addresses.nftLiquidityPoolFactory, tester);
  const miningManager = await ethers.getContractAt("MiningManager", addresses.miningManager, tester);
  const faucet = await ethers.getContractAt("SimpleBKCFaucet", addresses.faucet, tester);

  // Pool Diamond (7000 Bips)
  const poolAddress = await factory.getPoolAddress(7000n);
  const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, tester);

  console.log("   ✅ Contracts Loaded.");

  // -----------------------------------------------------------------
  // 📉 SCARCITY BASELINE CHECK
  // -----------------------------------------------------------------
  console.log("\n   📉 [BASELINE] Checking Dynamic Scarcity...");
  const oneEther = ethers.parseEther("1");
  const expectedMint = await miningManager.getMintAmount(oneEther);
  const maxSupply = await bkc.MAX_SUPPLY();
  const currentSupply = await bkc.totalSupply();
  
  console.log(`      Total Supply: ${toEther(currentSupply)} / ${toEther(maxSupply)} BKC`);
  console.log(`      Current Rate: 1.0 BKC Fee = ${toEther(expectedMint)} BKC Mined`);

  // =================================================================
  // DOUBLE VERIFICATION LOOP (2X)
  // =================================================================
  for (let cycle = 1; cycle <= 2; cycle++) {
      console.log(`\n   🔄 ================= CYCLE ${cycle} / 2 ================= 🔄`);
      
      try {
          // --- A. NOTARY (FIXED FEE) ---
          console.log(`   📜 [A] Notary Service`);
          const notaryFee = BigInt(await hub.getFee(ethers.id("NOTARY_SERVICE"))); 
          
          await sendTx(bkc.approve(addresses.decentralizedNotary, notaryFee), "Approving BKC");
          const docId = ethers.id(`Doc_Cycle_${cycle}_${Date.now()}`);
          
          await executeWithMiningAudit(
              bkc, miningManager,
              notary.notarize("ipfs://QmProof", "Econ Test", docId, 0n),
              "Notarizing (Mining Trigger)",
              notaryFee
          );
          report.push(`[CYCLE ${cycle}] Notary: SUCCESS`);

          // --- B. NFT MARKET (BUY TAX) ---
          console.log(`\n   🛒 [B] NFT Market (Buy Tax)`);
          let buyPrice = BigInt(await pool.getBuyPrice());
          let buyTaxBips = BigInt(await hub.getFee(ethers.id("NFT_POOL_BUY_TAX_BIPS")));
          
          let taxAmt = (buyPrice * buyTaxBips) / 10000n;
          let totalCost = buyPrice + taxAmt;

          await sendTx(bkc.approve(poolAddress, totalCost), "Approving BKC");
          
          await executeWithMiningAudit(
              bkc, miningManager,
              pool.buyNextAvailableNFT(0n),
              "Buying NFT (Mining Trigger)",
              taxAmt 
          );

          // Get Token ID
          const filter = pool.filters.NFTBought();
          const events = await pool.queryFilter(filter, -1);
          const lastEvent = events[events.length - 1] as any;
          const tokenIdSell = lastEvent.args?.tokenId;
          console.log(`         💎 Token #${tokenIdSell} Acquired`);

          // --- C. NFT MARKET (SELL TAX) ---
          console.log(`\n   🛒 [B.2] NFT Market (Sell Tax)`);
          let sellPrice = BigInt(await pool.getSellPrice());
          let sellTaxBips = BigInt(await hub.getFee(ethers.id("NFT_POOL_SELL_TAX_BIPS")));
          let sellTaxAmt = (sellPrice * sellTaxBips) / 10000n;

          await sendTx(nft.approve(poolAddress, tokenIdSell), "Approving NFT");
          
          await executeWithMiningAudit(
              bkc, miningManager,
              pool.sellNFT(tokenIdSell, 0n, 0n),
              "Selling NFT (Mining Trigger)",
              sellTaxAmt
          );
          report.push(`[CYCLE ${cycle}] NFT Market: SUCCESS`);

          // --- D. RENTAL (LIST & RENT) ---
          console.log(`\n   🏠 [C] Rental Market`);
          // Buy new NFT for rental
          await sendTx(bkc.approve(poolAddress, totalCost), "Approving Buy 2");
          const txPrep = await pool.buyNextAvailableNFT(0n);
          await txPrep.wait();
          
          const events2 = await pool.queryFilter(filter, -1);
          const lastEvent2 = events2[events2.length - 1] as any;
          const tokenIdRent = lastEvent2.args?.tokenId;

          const rentalPrice = ethers.parseEther("10");
          const rentalTaxBips = BigInt(await hub.getFee(ethers.id("RENTAL_MARKET_TAX_BIPS")));
          const rentalTaxAmt = (rentalPrice * rentalTaxBips) / 10000n;

          await sendTx(nft.approve(addresses.rentalManager, tokenIdRent), "Approving RentalMgr");
          await sendTx(rental.listNFT(tokenIdRent, rentalPrice), "Listing");
          
          await sendTx(bkc.approve(addresses.rentalManager, rentalPrice), "Approving Rental Payment");
          
          await executeWithMiningAudit(
              bkc, miningManager,
              rental.rentNFT(tokenIdRent),
              "Renting NFT (Mining Trigger)",
              rentalTaxAmt
          );
          report.push(`[CYCLE ${cycle}] Rental: SUCCESS`);

          // --- E. STAKING (DELEGATION FEE) ---
          console.log(`\n   🥩 [D] Staking`);
          const stakeAmt = ethers.parseEther("50");
          const stakeFeeBips = BigInt(await hub.getFee(ethers.id("DELEGATION_FEE_BIPS")));
          const stakeFeeAmt = (stakeAmt * stakeFeeBips) / 10000n;

          await sendTx(bkc.approve(addresses.delegationManager, stakeAmt), "Approving Stake");
          
          await executeWithMiningAudit(
              bkc, miningManager,
              delegation.delegate(stakeAmt, 86400n * 30n, 0n),
              "Staking (Mining Trigger)",
              stakeFeeAmt
          );
          
          // Clean up (Force Unstake)
          const userDelegations = await delegation.getDelegationsOf(tester.address);
          await sendTx(delegation.forceUnstake(userDelegations.length - 1, 0n), "Force Unstake");
          report.push(`[CYCLE ${cycle}] Staking: SUCCESS`);

          // --- F. FORTUNE POOL (GAME FEE) ---
          console.log(`\n   🎰 [E] Fortune Pool`);
          const activeTiers = await fortune.activeTierCount();
          if (activeTiers > 0n) {
              const wager = ethers.parseEther("10");
              const gameFeeBips = BigInt(await fortune.gameFeeBips());
              const gameFeeAmt = (wager * gameFeeBips) / 10000n;

              const guesses = [];
              for(let i=0; i<Number(activeTiers); i++) guesses.push(1n);
              const oracleFee = await fortune.oracleFeeInWei();
              
              await sendTx(bkc.approve(addresses.fortunePool, wager), "Approving Wager");
              
              const txGame = await executeWithMiningAudit(
                  bkc, miningManager,
                  fortune.participate(wager, guesses, false, { value: oracleFee }),
                  "Betting (Mining Trigger)",
                  gameFeeAmt
              );
              
              const rcGame = await txGame.tx.wait();
              const evtGame = rcGame?.logs.find((l: any) => { try { return fortune.interface.parseLog(l)?.name === "GameRequested"; } catch { return false; } });
              const gameId = fortune.interface.parseLog(evtGame!)?.args?.gameId;

              console.log(`         ⏳ Waiting for Oracle...`);
              await new Promise<void>((resolve) => {
                  const t = setTimeout(() => { console.log("         ⚠️ Timeout"); report.push(`[CYCLE ${cycle}] Fortune: TIMEOUT`); resolve(); }, 90000);
                  fortune.once("GameFulfilled", (id) => { if(id === gameId) { clearTimeout(t); console.log("         🎉 Oracle OK!"); report.push(`[CYCLE ${cycle}] Fortune: SUCCESS`); resolve(); }});
              });
          }

          // --- G. FAUCET ---
          console.log(`\n   🚰 [F] Faucet`);
          const recipient = cycle === 1 ? tester.address : ethers.Wallet.createRandom().address;
          let skipFaucet = false;
          if (cycle === 1) {
              const cooldown = await faucet.getCooldownRemaining(recipient);
              if (cooldown > 0n) skipFaucet = true;
          }
          if (!skipFaucet) {
              await sendTx(faucet.distributeTo(recipient), `Distributing`);
              report.push(`[CYCLE ${cycle}] Faucet: SUCCESS`);
          } else {
              console.log("         ⚠️ Cooldown Active. Skipping.");
          }

      } catch (e: any) {
          console.error(`🚨 CYCLE ${cycle} FAIL:`, e.message);
          report.push(`[CYCLE ${cycle}] ❌ FAILED: ${e.message}`);
          break;
      }
      
      console.log(`\n   ⏸️ Cooling down (5s)...`);
      await sleep(5000);
  }

  // =================================================================
  // FINAL REPORT
  // =================================================================
  console.log("\n\n📄 ================= FULL SYSTEM AUDIT REPORT ================= 📄");
  
  console.log("\n🔹 MODULE STATUS:");
  report.forEach(r => console.log(`   ${r}`));
  
  const finalBal = await bkc.balanceOf(tester.address);
  const treasuryAddr = await hub.getTreasuryAddress();
  const treasuryBal = await bkc.balanceOf(treasuryAddr);

  console.log("\n🔹 FINANCIAL SUMMARY:");
  console.log(`   💰 Tester Balance:   ${toEther(finalBal)} BKC`);
  console.log(`   🏦 Treasury Balance: ${toEther(treasuryBal)} BKC (Revenue Collected)`);

  console.log("\n🔹 GAS CONSUMPTION (Arbitrum Sepolia):");
  console.log(`   ⛽ TOTAL GAS SPENT:  ${toEther(totalGasSpent)} ETH`);
  console.log("   (This cost includes deployment, approvals, and complex contract interactions)");
  
  console.log("\n=================================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});