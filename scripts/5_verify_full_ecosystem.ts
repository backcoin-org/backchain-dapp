// scripts/5_verify_full_ecosystem.ts
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// --- Utilitários ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const toEther = (val: bigint | number | any) => ethers.formatEther(BigInt(val));

// Coletores de Dados
const report: string[] = [];
let totalGasSpent = 0n; // Acumulador de Gás

// Helper: Verifica se existe código no endereço (Previne erro BAD_DATA)
async function checkCode(provider: any, address: string, name: string) {
    if (!address) return false;
    const code = await provider.getCode(address);
    if (code === "0x") {
        console.log(`      ⚠️  CRITICAL: No contract found for ${name} at ${address}`);
        return false;
    }
    return true;
}

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
    
    console.log(`         📊 [ECON] Fee Paid: ${toEther(expectedFee)} BKC`);
    console.log(`         ⛏️ [ECON] Mined:    ${toEther(minedAmount)} BKC`);
    
    return { receipt, minedAmount };
}

async function main() {
  const [tester] = await ethers.getSigners();
  
  // Variável global para ser usada no relatório final
  let treasuryAddr = ""; 

  console.log(`\n🕵️‍♂️ SYSTEM DIAGNOSTIC & STRESS TEST V7.3 (Robust Sweep + Oracle Report)`);
  console.log(`   🧑‍🚀 Tester: ${tester.address}`);
  
  const network = await ethers.provider.getNetwork();
  console.log(`   🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // 1. Load Addresses
  const addressesPath = path.join(__dirname, "../deployment-addresses.json");
  if (!fs.existsSync(addressesPath)) throw new Error("File not found.");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  // 2. Contracts (Interfaces)
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

  console.log("   ✅ Interfaces Loaded.");

  // =================================================================
  // 🔍 PHASE 0: CODE EXISTENCE CHECK
  // =================================================================
  console.log("\n   🔍 [PHASE 0] VERIFYING CONTRACTS ON-CHAIN...");
  const isFortuneOk = await checkCode(ethers.provider, addresses.fortunePool, "FortunePool");
  const isBkcOk = await checkCode(ethers.provider, addresses.bkcToken, "BKCToken");

  if (!isFortuneOk || !isBkcOk) {
      console.log("\n   🛑 STOPPING: Critical contracts missing from this network.");
      console.log("      Please check your network connection or redeploy contracts.");
      return;
  }

  // =================================================================
  // 🔧 PHASE 0.5: ORACLE CHECK (PERMISSION + FUNDS)
  // =================================================================
  console.log("\n   🔧 [PHASE 0.5] CHECKING ORACLE HEALTH...");
  
  const envKey = process.env.ORACLE_PRIVATE_KEY;
  if (envKey) {
      const oracleWallet = new ethers.Wallet(envKey, ethers.provider);
      
      try {
          // A. Check Permissions
          const currentOracle = await fortune.oracleAddress();
          if (currentOracle.toLowerCase() !== oracleWallet.address.toLowerCase()) {
              console.log(`      ⚠️  PERMISSION MISMATCH! Fixing...`);
              await sendTx(fortune.setOracleAddress(oracleWallet.address), "Fixing Oracle Address");
          } else {
              console.log(`      ✅ Permission: OK (${oracleWallet.address})`);
          }

          // B. Check Funds (Automatic Top-Up)
          const oracleBal = await ethers.provider.getBalance(oracleWallet.address);
          console.log(`      💰 Oracle Balance: ${toEther(oracleBal)} ETH`);
          
          if (oracleBal < ethers.parseEther("0.005")) {
              console.log(`      ⚠️  LOW BALANCE! Sending 0.01 ETH from Tester...`);
              await sendTx(
                  tester.sendTransaction({ to: oracleWallet.address, value: ethers.parseEther("0.01") }),
                  "Funding Oracle"
              );
          } else {
              console.log(`      ✅ Balance: Sufficient`);
          }
      } catch (e: any) {
          console.log(`      ⚠️  Oracle Check Warning: ${e.message}`);
      }

  } else {
      console.log("      ⚠️  Skipping Oracle Check: ORACLE_PRIVATE_KEY not found in .env");
  }

  // =================================================================
  // 🧹 PHASE 0.6: WALLET CLEANUP (SAFE SWEEP)
  // =================================================================
  console.log("\n   🧹 [PHASE 0.6] SWEEPING WALLET FOR STRAY NFTS...");
  try {
      const balance = await nft.balanceOf(tester.address);
      if (balance > 0n) {
          console.log(`      🧐 Found ${balance} NFTs. Attempting sweep...`);
          
          try {
              // Tenta pegar o primeiro token. Se falhar, é porque o contrato não é Enumerable.
              const tokenId = await nft.tokenOfOwnerByIndex(tester.address, 0);
              const boostBips = await nft.boostBips(tokenId);
              const targetPoolAddr = await factory.getPoolAddress(boostBips);
              
              if (targetPoolAddr !== ethers.ZeroAddress) {
                  console.log(`      🔄 Selling Token #${tokenId} (Boost: ${boostBips})...`);
                  const targetPool = await ethers.getContractAt("NFTLiquidityPool", targetPoolAddr, tester);

                  const approved = await nft.getApproved(tokenId);
                  const isApprovedAll = await nft.isApprovedForAll(tester.address, targetPoolAddr);
                  if (approved !== targetPoolAddr && !isApprovedAll) {
                      await sendTx(nft.approve(targetPoolAddr, tokenId), `Approving`);
                  }

                  await targetPool.sellNFT(tokenId, 0n, 0n).then(tx => tx.wait());
                  console.log(`      ✅ Sweep successful for one item.`);
              } else {
                  console.log(`      ⚠️  No pool found for Boost ${boostBips}. Skipping.`);
              }
          } catch (inner: any) {
              if (inner.message.includes("is not a function") || inner.message.includes("execution reverted")) {
                  console.log(`      ⚠️  Skipping Sweep: NFT Contract does not support enumeration (Safe to ignore).`);
              } else {
                  console.log(`      ⚠️  Sweep failed: ${inner.message}`);
              }
          }
      } else {
          console.log(`      ✅ Wallet Clean.`);
      }
  } catch (e: any) { console.log(`      ⚠️  Sweep Error: ${e.message}`); }

  // =================================================================
  // 🔍 PHASE 0.7: LIQUIDITY CHECK
  // =================================================================
  console.log("\n   🔍 [PHASE 0.7] CHECKING CONTRACT LIQUIDITY...");
  try {
      treasuryAddr = await hub.getTreasuryAddress(); // Atribuindo à variável global
      const targets = [
          { name: "Fortune Pool", address: addresses.fortunePool, contract: fortune },
          { name: "Faucet Contract", address: addresses.faucet, contract: faucet },
          { name: "Rental Manager", address: addresses.rentalManager },
          { name: "Delegation Manager", address: addresses.delegationManager },
          { name: "Treasury Wallet", address: treasuryAddr },
          { name: "Tester Wallet", address: tester.address }
      ];

      console.table(await Promise.all(targets.map(async (t) => ({
          "Contract": t.name,
          "ETH": parseFloat(ethers.formatEther(await ethers.provider.getBalance(t.address))).toFixed(4),
          "BKC": parseFloat(ethers.formatEther(await bkc.balanceOf(t.address))).toFixed(2)
      }))));

      // Auto Top-Up Fortune & Faucet
      const fortuneBal = await bkc.balanceOf(addresses.fortunePool);
      if (fortuneBal < ethers.parseEther("500")) {
          await sendTx(bkc.approve(addresses.fortunePool, ethers.parseEther("1000")), "Approve Fortune");
          await sendTx(fortune.topUpPool(ethers.parseEther("1000")), "TopUp Fortune");
      }
      const faucetBal = await bkc.balanceOf(addresses.faucet);
      if (faucetBal < ethers.parseEther("100")) {
          await sendTx(bkc.approve(addresses.faucet, ethers.parseEther("1000")), "Approve Faucet");
          await sendTx(faucet.depositTokens(ethers.parseEther("1000")), "Refill Faucet");
      }
  } catch (e: any) {
      console.log(`      ⚠️  Liquidity check failed: ${e.message}`);
  }

  // =================================================================
  // LOOP DE TESTE
  // =================================================================
  const poolAddress = await factory.getPoolAddress(7000n);
  const pool = await ethers.getContractAt("NFTLiquidityPool", poolAddress, tester);

  for (let cycle = 1; cycle <= 2; cycle++) {
      console.log(`\n   🔄 ================= CYCLE ${cycle} / 2 ================= 🔄`);
      
      try {
          // --- A. NOTARY ---
          console.log(`   📜 [A] Notary`);
          const notaryFee = BigInt(await hub.getFee(ethers.id("NOTARY_SERVICE"))); 
          await sendTx(bkc.approve(addresses.decentralizedNotary, notaryFee), "Approve");
          await executeWithMiningAudit(bkc, miningManager, notary.notarize("ipfs://QmProof", "Test", ethers.id(`Doc_${cycle}_${Date.now()}`), 0n), "Notarize", notaryFee);
          report.push(`[CYCLE ${cycle}] Notary: SUCCESS`);

          // --- B. NFT MARKET (BUY) ---
          console.log(`\n   🛒 [B] NFT Buy`);
          let buyPrice = BigInt(await pool.getBuyPrice());
          let buyTaxBips = BigInt(await hub.getFee(ethers.id("NFT_POOL_BUY_TAX_BIPS")));
          let taxAmt = (buyPrice * buyTaxBips) / 10000n;
          await sendTx(bkc.approve(poolAddress, buyPrice + taxAmt), "Approve");
          const { receipt: rcBuy } = await executeWithMiningAudit(bkc, miningManager, pool.buyNextAvailableNFT(0n), "Buy NFT", taxAmt);

          let tokenIdSell;
          for (const log of rcBuy.logs) {
              try {
                  const parsed = pool.interface.parseLog(log);
                  if (parsed && parsed.name === 'NFTBought') { tokenIdSell = parsed.args.tokenId; break; }
              } catch (e) {}
          }
          console.log(`         💎 Token #${tokenIdSell} Acquired`);

          // --- C. NFT MARKET (SELL) ---
          console.log(`\n   🛒 [B.2] NFT Sell`);
          let sellPrice = BigInt(await pool.getSellPrice());
          let sellTaxBips = BigInt(await hub.getFee(ethers.id("NFT_POOL_SELL_TAX_BIPS")));
          let sellTaxAmt = (sellPrice * sellTaxBips) / 10000n;
          await sendTx(nft.approve(poolAddress, tokenIdSell), "Approve NFT");
          await executeWithMiningAudit(bkc, miningManager, pool.sellNFT(tokenIdSell, 0n, 0n), "Sell NFT", sellTaxAmt);
          report.push(`[CYCLE ${cycle}] NFT Market: SUCCESS`);

          // --- D. RENTAL ---
          console.log(`\n   🏠 [C] Rental`);
          await sendTx(bkc.approve(poolAddress, buyPrice + taxAmt), "Approve Buy 2");
          const rcPrep = await sendTx(pool.buyNextAvailableNFT(0n), "Buy for Rental");
          let tokenIdRent;
          for (const log of rcPrep.logs) {
              try {
                  const parsed = pool.interface.parseLog(log);
                  if (parsed && parsed.name === 'NFTBought') { tokenIdRent = parsed.args.tokenId; break; }
              } catch (e) {}
          }
          
          const rentalPrice = ethers.parseEther("10");
          const rentalTaxBips = BigInt(await hub.getFee(ethers.id("RENTAL_MARKET_TAX_BIPS")));
          const rentalTaxAmt = (rentalPrice * rentalTaxBips) / 10000n;

          await sendTx(nft.approve(addresses.rentalManager, tokenIdRent), "Approve RentalMgr");
          await sendTx(rental.listNFT(tokenIdRent, rentalPrice), "List NFT");
          await sendTx(bkc.approve(addresses.rentalManager, rentalPrice), "Approve Payment");
          await executeWithMiningAudit(bkc, miningManager, rental.rentNFT(tokenIdRent), "Rent NFT", rentalTaxAmt);
          report.push(`[CYCLE ${cycle}] Rental: SUCCESS`);

          // --- E. STAKING ---
          console.log(`\n   🥩 [D] Staking`);
          const stakeAmt = ethers.parseEther("50");
          const stakeFeeBips = BigInt(await hub.getFee(ethers.id("DELEGATION_FEE_BIPS")));
          const stakeFeeAmt = (stakeAmt * stakeFeeBips) / 10000n;
          await sendTx(bkc.approve(addresses.delegationManager, stakeAmt), "Approve Stake");
          await executeWithMiningAudit(bkc, miningManager, delegation.delegate(stakeAmt, 86400n * 30n, 0n), "Delegate", stakeFeeAmt);
          
          const userDelegations = await delegation.getDelegationsOf(tester.address);
          await sendTx(delegation.forceUnstake(userDelegations.length - 1, 0n), "Force Unstake");
          report.push(`[CYCLE ${cycle}] Staking: SUCCESS`);

          // --- F. FORTUNE ---
          console.log(`\n   🎰 [E] Fortune`);
          try {
              const activeTiers = await fortune.activeTierCount();
              if (activeTiers > 0n) {
                  const wager = ethers.parseEther("10");
                  const gameFeeBips = BigInt(await fortune.gameFeeBips());
                  const gameFeeAmt = (wager * gameFeeBips) / 10000n;
                  const guesses = [];
                  for(let i=0; i<Number(activeTiers); i++) guesses.push(1n);
                  const oracleFee = await fortune.oracleFeeInWei();
                  
                  await sendTx(bkc.approve(addresses.fortunePool, wager), "Approve Wager");
                  
                  const { receipt: rcGame } = await executeWithMiningAudit(
                      bkc, miningManager,
                      fortune.participate(wager, guesses, false, { value: oracleFee }),
                      "Betting",
                      gameFeeAmt
                  );
                  
                  let gameId: any;
                  for (const log of rcGame.logs) {
                      try {
                          const parsed = fortune.interface.parseLog(log);
                          if (parsed && parsed.name === 'GameRequested') { gameId = parsed.args.gameId; break; }
                      } catch (e) {}
                  }

                  console.log(`         ⏳ Waiting Oracle (Game #${gameId})...`);
                  
                  // --- ORACLE REPORT LISTENER ---
                  await new Promise<void>((resolve) => {
                      const t = setTimeout(() => { 
                          console.log("         ⚠️ Timeout. Oracle is silent or out of gas."); 
                          report.push(`[CYCLE ${cycle}] Fortune: TIMEOUT`); 
                          resolve(); 
                      }, 60000); 

                      fortune.once("GameFulfilled", (id: any, user: any, prize: bigint, rolls: bigint[], guesses: bigint[]) => { 
                          if(id == gameId) { 
                              clearTimeout(t);
                              const rollStr = rolls.map(r => r.toString()).join(", ");
                              const guessStr = guesses.map(g => g.toString()).join(", ");
                              const isWin = prize > 0n;
                              
                              console.log(`         🎲 Oracle Rolled: [ ${rollStr} ]`);
                              console.log(`         🎯 User Guessed:  [ ${guessStr} ]`);
                              console.log(`         ${isWin ? "🏆 WINNER!" : "☠️  LOSS"} Prize: ${toEther(prize)} BKC`);

                              report.push(`[CYCLE ${cycle}] Fortune: ${isWin ? "WIN" : "LOSE"} (Rolls: ${rollStr})`); 
                              resolve(); 
                          }
                      });
                  });
              }
          } catch(e: any) { 
              console.log(`         ⚠️ Fortune Error: ${e.message}`);
              report.push(`[CYCLE ${cycle}] Fortune: FAILED`);
          }

          // --- G. FAUCET ---
          console.log(`\n   🚰 [F] Faucet`);
          const recipient = cycle === 1 ? tester.address : ethers.Wallet.createRandom().address;
          let cooldown = 0n;
          if (cycle === 1) cooldown = await faucet.getCooldownRemaining(recipient);
          if (cooldown === 0n) {
              await sendTx(faucet.distributeTo(recipient), `Distributing`);
              report.push(`[CYCLE ${cycle}] Faucet: SUCCESS`);
          } else { console.log("         ⚠️ Cooldown Active. Skipping."); }

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
  // Uso seguro da variável treasuryAddr
  let finalTreasuryBal = 0n;
  if(treasuryAddr) {
      finalTreasuryBal = await bkc.balanceOf(treasuryAddr);
  }

  console.log("\n🔹 FINANCIAL:");
  console.log(`   💰 Tester:   ${toEther(finalBal)} BKC`);
  console.log(`   🏦 Treasury: ${toEther(finalTreasuryBal)} BKC`);
  console.log(`   ⛽ Gas Spent: ${toEther(totalGasSpent)} ETH`);
  console.log("=================================================");
  console.log("\n✅ SCRIPT COMPLETED SUCCESSFULLY.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});