// scripts/5_verify_full_ecosystem.ts
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// --- Utilitários ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const toEther = (val: bigint | number | any) => ethers.formatEther(BigInt(val));

// Coletores de Dados
const report: string[] = [];
let totalGasSpent = 0n; // Acumulador de Gás

// Helper: Envia Tx e Retorna o RECIBO (Receipt)
async function sendTx(txPromise: Promise<any>, description: string) {
    process.stdout.write(`      ➡️ ${description}... `);
    try {
        const tx = await txPromise;
        const receipt = await tx.wait();
        
        // Cálculo de Gás
        const gasUsed = BigInt(receipt.gasUsed);
        const gasPrice = BigInt(receipt.gasPrice);
        const cost = gasUsed * gasPrice;
        totalGasSpent += cost;

        console.log(`\n         📝 Hash: https://sepolia.arbiscan.io/tx/${tx.hash}`);
        console.log(`         ⛽ Gás: ${toEther(cost)} ETH`);
        console.log(`         ✅ Confirmado!`);
        
        return receipt;
    } catch (error: any) {
        console.log(` ❌ ERRO!`);
        console.error(`         Motivo: ${error.message}`);
        throw error;
    }
}

// Helper: Auditoria Econômica + Retorno de Recibo
async function executeWithMiningAudit(
    bkcContract: any, 
    miningManager: any,
    txPromise: Promise<any>, 
    actionName: string, 
    expectedFee: bigint
) {
    const supplyBefore = BigInt(await bkcContract.totalSupply());
    
    // Executa e pega o recibo
    const receipt = await sendTx(txPromise, actionName);
    
    const supplyAfter = BigInt(await bkcContract.totalSupply());
    const minedAmount = supplyAfter - supplyBefore;
    
    let ratio = "0%";
    if (expectedFee > 0n) {
        const ratioBig = (minedAmount * 100n) / expectedFee;
        ratio = `${ratioBig.toString()}%`;
    }

    console.log(`         📊 [ECON] Fee Paid: ${toEther(expectedFee)} BKC`);
    console.log(`         ⛏️ [ECON] Mined:    ${toEther(minedAmount)} BKC`);
    
    return { receipt, minedAmount };
}

async function main() {
  const [tester] = await ethers.getSigners();
  console.log(`\n🕵️‍♂️ SYSTEM DIAGNOSTIC & STRESS TEST V6.0`);
  console.log(`   🧑‍🚀 Tester: ${tester.address}`);
  console.log(`   🌐 Network: Arbitrum Sepolia`);

  // 1. Load Addresses
  const addressesPath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesPath)) throw new Error("File not found.");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  // 2. Contracts
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

  const poolAddress = await factory.getPoolAddress(7000n);
  const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, tester);

  console.log("   ✅ Contracts Loaded.");

  // =================================================================
  // 🔍 PHASE 0: PRE-FLIGHT SYSTEM BALANCE CHECK
  // =================================================================
  console.log("\n   🔍 [PHASE 0] CHECKING CONTRACT LIQUIDITY...");
  
  const treasuryAddr = await hub.getTreasuryAddress();
  
  const targets = [
      { name: "Fortune Pool", address: addresses.fortunePool, contract: fortune },
      { name: "Faucet Contract", address: addresses.faucet, contract: faucet },
      { name: "Rental Manager", address: addresses.rentalManager },
      { name: "Delegation Manager", address: addresses.delegationManager },
      { name: "Treasury Wallet", address: treasuryAddr },
      { name: "Mining Manager", address: addresses.miningManager },
      { name: "Tester Wallet", address: tester.address }
  ];

  console.table(
      await Promise.all(targets.map(async (t) => {
          const ethBal = await ethers.provider.getBalance(t.address);
          const bkcBal = await bkc.balanceOf(t.address);
          return {
              "Contract Name": t.name,
              "ETH Balance": parseFloat(ethers.formatEther(ethBal)).toFixed(4),
              "BKC Balance": parseFloat(ethers.formatEther(bkcBal)).toFixed(2)
          };
      }))
  );

  // --- AUTO TOP-UP LOGIC ---
  const fortuneBal = await bkc.balanceOf(addresses.fortunePool);
  if (fortuneBal < ethers.parseEther("500")) {
      console.log(`   ⚠️ Fortune Pool Low! Topping up...`);
      await sendTx(bkc.approve(addresses.fortunePool, ethers.parseEther("1000")), "Approve TopUp");
      await sendTx(fortune.topUpPool(ethers.parseEther("1000")), "Deposit to Fortune");
  }

  const faucetBal = await bkc.balanceOf(addresses.faucet);
  if (faucetBal < ethers.parseEther("100")) {
      console.log(`   ⚠️ Faucet Low! Refilling...`);
      await sendTx(bkc.approve(addresses.faucet, ethers.parseEther("1000")), "Approve Faucet");
      await sendTx(faucet.depositTokens(ethers.parseEther("1000")), "Deposit to Faucet");
  }

  // =================================================================
  // LOOP DE TESTE DUPLO (2X)
  // =================================================================
  for (let cycle = 1; cycle <= 2; cycle++) {
      console.log(`\n   🔄 ================= CYCLE ${cycle} / 2 ================= 🔄`);
      
      try {
          // --- A. NOTARY ---
          console.log(`   📜 [A] Notary`);
          const notaryFee = BigInt(await hub.getFee(ethers.id("NOTARY_SERVICE"))); 
          await sendTx(bkc.approve(addresses.decentralizedNotary, notaryFee), "Approving BKC");
          
          await executeWithMiningAudit(
              bkc, miningManager,
              notary.notarize("ipfs://QmProof", "Test", ethers.id(`Doc_${cycle}_${Date.now()}`), 0n),
              "Notarizing",
              notaryFee
          );
          report.push(`[CYCLE ${cycle}] Notary: SUCCESS`);

          // --- B. NFT MARKET (BUY) ---
          console.log(`\n   🛒 [B] NFT Buy`);
          let buyPrice = BigInt(await pool.getBuyPrice());
          let buyTaxBips = BigInt(await hub.getFee(ethers.id("NFT_POOL_BUY_TAX_BIPS")));
          let taxAmt = (buyPrice * buyTaxBips) / 10000n;
          
          await sendTx(bkc.approve(poolAddress, buyPrice + taxAmt), "Approving BKC");
          
          const { receipt: rcBuy } = await executeWithMiningAudit(
              bkc, miningManager,
              pool.buyNextAvailableNFT(0n),
              "Buying NFT",
              taxAmt 
          );

          // Extrair Token ID com segurança
          let tokenIdSell;
          for (const log of rcBuy.logs) {
              try {
                  const parsed = pool.interface.parseLog(log);
                  if (parsed && parsed.name === 'NFTBought') {
                      tokenIdSell = parsed.args.tokenId;
                      break;
                  }
              } catch (e) {}
          }
          
          if (!tokenIdSell) throw new Error("Could not find NFTBought event in receipt");
          console.log(`         💎 Token #${tokenIdSell} Acquired`);

          // --- C. NFT MARKET (SELL) ---
          console.log(`\n   🛒 [B.2] NFT Sell`);
          let sellPrice = BigInt(await pool.getSellPrice());
          let sellTaxBips = BigInt(await hub.getFee(ethers.id("NFT_POOL_SELL_TAX_BIPS")));
          let sellTaxAmt = (sellPrice * sellTaxBips) / 10000n;

          await sendTx(nft.approve(poolAddress, tokenIdSell), "Approving NFT");
          await executeWithMiningAudit(
              bkc, miningManager,
              pool.sellNFT(tokenIdSell, 0n, 0n),
              "Selling NFT",
              sellTaxAmt
          );
          report.push(`[CYCLE ${cycle}] NFT Market: SUCCESS`);

          // --- D. RENTAL ---
          console.log(`\n   🏠 [C] Rental`);
          // Buy NFT for Rental
          await sendTx(bkc.approve(poolAddress, buyPrice + taxAmt), "Approving Buy 2");
          const rcPrep = await sendTx(pool.buyNextAvailableNFT(0n), "Buying NFT (Rental Prep)");
          
          let tokenIdRent;
          for (const log of rcPrep.logs) {
              try {
                  const parsed = pool.interface.parseLog(log);
                  if (parsed && parsed.name === 'NFTBought') {
                      tokenIdRent = parsed.args.tokenId;
                      break;
                  }
              } catch (e) {}
          }
          console.log(`         💎 Token #${tokenIdRent} for Rental`);

          const rentalPrice = ethers.parseEther("10");
          const rentalTaxBips = BigInt(await hub.getFee(ethers.id("RENTAL_MARKET_TAX_BIPS")));
          const rentalTaxAmt = (rentalPrice * rentalTaxBips) / 10000n;

          await sendTx(nft.approve(addresses.rentalManager, tokenIdRent), "Approving RentalMgr");
          await sendTx(rental.listNFT(tokenIdRent, rentalPrice), "Listing");
          await sendTx(bkc.approve(addresses.rentalManager, rentalPrice), "Approving Payment");
          
          await executeWithMiningAudit(
              bkc, miningManager,
              rental.rentNFT(tokenIdRent),
              "Renting NFT",
              rentalTaxAmt
          );
          report.push(`[CYCLE ${cycle}] Rental: SUCCESS`);

          // --- E. STAKING ---
          console.log(`\n   🥩 [D] Staking`);
          const stakeAmt = ethers.parseEther("50");
          const stakeFeeBips = BigInt(await hub.getFee(ethers.id("DELEGATION_FEE_BIPS")));
          const stakeFeeAmt = (stakeAmt * stakeFeeBips) / 10000n;

          await sendTx(bkc.approve(addresses.delegationManager, stakeAmt), "Approving Stake");
          await executeWithMiningAudit(
              bkc, miningManager,
              delegation.delegate(stakeAmt, 86400n * 30n, 0n),
              "Staking",
              stakeFeeAmt
          );
          
          const userDelegations = await delegation.getDelegationsOf(tester.address);
          await sendTx(delegation.forceUnstake(userDelegations.length - 1, 0n), "Force Unstake");
          report.push(`[CYCLE ${cycle}] Staking: SUCCESS`);

          // --- F. FORTUNE ---
          console.log(`\n   🎰 [E] Fortune`);
          const activeTiers = await fortune.activeTierCount();
          if (activeTiers > 0n) {
              const wager = ethers.parseEther("10");
              const gameFeeBips = BigInt(await fortune.gameFeeBips());
              const gameFeeAmt = (wager * gameFeeBips) / 10000n;
              const guesses = [];
              for(let i=0; i<Number(activeTiers); i++) guesses.push(1n);
              const oracleFee = await fortune.oracleFeeInWei();
              
              await sendTx(bkc.approve(addresses.fortunePool, wager), "Approving Wager");
              
              const { receipt: rcGame } = await executeWithMiningAudit(
                  bkc, miningManager,
                  fortune.participate(wager, guesses, false, { value: oracleFee }),
                  "Betting",
                  gameFeeAmt
              );
              
              // Tipagem explícita para evitar erro TS
              let gameId: any;
              for (const log of rcGame.logs) {
                  try {
                      const parsed = fortune.interface.parseLog(log);
                      if (parsed && parsed.name === 'GameRequested') {
                          gameId = parsed.args.gameId;
                          break;
                      }
                  } catch (e) {}
              }

              console.log(`         ⏳ Waiting Oracle (Game #${gameId})...`);
              await new Promise<void>((resolve) => {
                  const t = setTimeout(() => { console.log("         ⚠️ Timeout"); report.push(`[CYCLE ${cycle}] Fortune: TIMEOUT`); resolve(); }, 90000);
                  fortune.once("GameFulfilled", (id: any) => { 
                      if(id == gameId) { 
                          clearTimeout(t); 
                          console.log("         🎉 Oracle OK!"); 
                          report.push(`[CYCLE ${cycle}] Fortune: SUCCESS`); 
                          resolve(); 
                      }
                  });
              });
          }

          // --- G. FAUCET ---
          console.log(`\n   🚰 [F] Faucet`);
          const recipient = cycle === 1 ? tester.address : ethers.Wallet.createRandom().address;
          // Check cooldown only if sending to self
          let cooldown = 0n;
          if (cycle === 1) cooldown = await faucet.getCooldownRemaining(recipient);
          
          if (cooldown === 0n) {
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

  // REPORT
  console.log("\n\n📄 ================= AUDIT REPORT ================= 📄");
  report.forEach(r => console.log(`   ${r}`));
  
  const finalBal = await bkc.balanceOf(tester.address);
  const finalTreasuryBal = await bkc.balanceOf(treasuryAddr);

  console.log("\n🔹 FINANCIAL:");
  console.log(`   💰 Tester:   ${toEther(finalBal)} BKC`);
  console.log(`   🏦 Treasury: ${toEther(finalTreasuryBal)} BKC`);
  console.log(`   ⛽ Gas Spent: ${toEther(totalGasSpent)} ETH`);
  console.log("=================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});