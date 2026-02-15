// scripts/test_buyback.ts
// Execute a buyback on testnet and verify the full flow
//
// npx hardhat run scripts/test_buyback.ts --network arbitrumSepolia

import { ethers } from "hardhat";
import fs from "fs";

const addrs = JSON.parse(fs.readFileSync("deployment-addresses.json", "utf8"));

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("   ⛏️  BUYBACK MINER TEST");
    console.log("════════════════════════════════════════════════════════════════");

    const BuybackMiner = await ethers.getContractAt("BuybackMiner", addrs.buybackMiner);
    const BKC = await ethers.getContractAt("BKCToken", addrs.bkcToken);
    const LP = await ethers.getContractAt("LiquidityPool", addrs.liquidityPool);
    const StakingPool = await ethers.getContractAt("StakingPool", addrs.stakingPool);
    const Ecosystem = await ethers.getContractAt("BackchainEcosystem", addrs.backchainEcosystem);

    // ── Pre-buyback state ────────────────────────────────────────────
    console.log("\n── PRE-BUYBACK STATE ──");

    const preEcoBal = await ethers.provider.getBalance(addrs.backchainEcosystem);
    console.log(`Ecosystem ETH:    ${ethers.formatEther(preEcoBal)}`);

    const preLpEth = await LP.ethReserve();
    const preLpBkc = await LP.bkcReserve();
    console.log(`LP ETH reserve:   ${ethers.formatEther(preLpEth)}`);
    console.log(`LP BKC reserve:   ${ethers.formatEther(preLpBkc)}`);

    const preBkcSupply = await BKC.totalSupply();
    console.log(`BKC total supply: ${ethers.formatEther(preBkcSupply)}`);

    const preStakingBkc = await BKC.balanceOf(addrs.stakingPool);
    console.log(`StakingPool BKC:  ${ethers.formatEther(preStakingBkc)}`);

    const preDeployerEth = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer ETH:     ${ethers.formatEther(preDeployerEth)}`);

    const preTotalBuybacks = await BuybackMiner.totalBuybacks();
    console.log(`Total buybacks:   ${preTotalBuybacks}`);

    const miningRate = await BuybackMiner.currentMiningRate();
    console.log(`Mining rate:      ${miningRate} bps (${Number(miningRate) / 100}%)`);

    // Preview buyback
    console.log("\n── PREVIEW ──");
    try {
        const preview = await BuybackMiner.previewBuyback();
        console.log(`Preview - ETH available: ${ethers.formatEther(preview[0])}`);
        console.log(`Preview - Est. BKC purchased: ${ethers.formatEther(preview[1])}`);
        console.log(`Preview - Est. BKC mined: ${ethers.formatEther(preview[2])}`);
        console.log(`Preview - Est. BKC total: ${ethers.formatEther(preview[3])}`);
        console.log(`Preview - Est. burned: ${ethers.formatEther(preview[4])}`);
        console.log(`Preview - Est. to stakers: ${ethers.formatEther(preview[5])}`);
        console.log(`Preview - Est. caller reward: ${ethers.formatEther(preview[6])}`);
    } catch (e: any) {
        console.log(`Preview failed: ${e.message?.slice(0, 120)}`);
    }

    // ── Execute buyback ──────────────────────────────────────────────
    // Send 0.01 ETH as execution fee (amplifies the buyback)
    const extraEth = ethers.parseEther("0.01");
    console.log(`\n── EXECUTING BUYBACK (+ ${ethers.formatEther(extraEth)} ETH extra) ──`);

    try {
        const tx = await BuybackMiner.executeBuyback({ value: extraEth });
        console.log(`TX hash: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Buyback executed! Gas: ${receipt!.gasUsed}`);

        // Parse events
        for (const log of receipt!.logs) {
            try {
                const parsed = BuybackMiner.interface.parseLog({ topics: [...log.topics], data: log.data });
                if (parsed && parsed.name === "BuybackExecuted") {
                    console.log("\n── BUYBACK EVENT ──");
                    console.log(`Caller:         ${parsed.args[0]}`);
                    console.log(`Buyback #:      ${parsed.args[1]}`);
                    console.log(`Caller reward:  ${ethers.formatEther(parsed.args[2])} ETH`);
                    console.log(`ETH spent:      ${ethers.formatEther(parsed.args[3])} ETH`);
                    console.log(`BKC purchased:  ${ethers.formatEther(parsed.args[4])}`);
                    console.log(`BKC mined:      ${ethers.formatEther(parsed.args[5])}`);
                    console.log(`BKC burned:     ${ethers.formatEther(parsed.args[6])}`);
                    console.log(`BKC to stakers: ${ethers.formatEther(parsed.args[7])}`);
                    console.log(`Mining rate:    ${parsed.args[8]} bps`);
                }
            } catch {}
        }
    } catch (e: any) {
        console.log(`❌ Buyback failed: ${e.message?.slice(0, 200)}`);
        // Try to decode revert reason
        if (e.data) {
            try {
                const reason = BuybackMiner.interface.parseError(e.data);
                console.log(`Revert reason: ${reason?.name}`);
            } catch {}
        }
        return;
    }

    // ── Post-buyback state ───────────────────────────────────────────
    console.log("\n── POST-BUYBACK STATE ──");

    const postEcoBal = await ethers.provider.getBalance(addrs.backchainEcosystem);
    console.log(`Ecosystem ETH:    ${ethers.formatEther(postEcoBal)} (was ${ethers.formatEther(preEcoBal)})`);

    const postLpEth = await LP.ethReserve();
    const postLpBkc = await LP.bkcReserve();
    console.log(`LP ETH reserve:   ${ethers.formatEther(postLpEth)} (was ${ethers.formatEther(preLpEth)})`);
    console.log(`LP BKC reserve:   ${ethers.formatEther(postLpBkc)} (was ${ethers.formatEther(preLpBkc)})`);

    const postBkcSupply = await BKC.totalSupply();
    console.log(`BKC total supply: ${ethers.formatEther(postBkcSupply)} (was ${ethers.formatEther(preBkcSupply)})`);

    const postStakingBkc = await BKC.balanceOf(addrs.stakingPool);
    console.log(`StakingPool BKC:  ${ethers.formatEther(postStakingBkc)} (was ${ethers.formatEther(preStakingBkc)})`);

    const postDeployerEth = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer ETH:     ${ethers.formatEther(postDeployerEth)} (was ${ethers.formatEther(preDeployerEth)})`);

    const postTotalBuybacks = await BuybackMiner.totalBuybacks();
    console.log(`Total buybacks:   ${postTotalBuybacks}`);

    // ── Deltas ───────────────────────────────────────────────────────
    console.log("\n── DELTAS ──");
    console.log(`Ecosystem ETH drained: ${ethers.formatEther(preEcoBal - postEcoBal)}`);
    console.log(`LP ETH increased:      ${ethers.formatEther(postLpEth - preLpEth)}`);
    console.log(`LP BKC decreased:      ${ethers.formatEther(preLpBkc - postLpBkc)}`);
    console.log(`BKC supply change:     ${ethers.formatEther(postBkcSupply - preBkcSupply)} (mined - burned)`);
    console.log(`StakingPool BKC gain:  ${ethers.formatEther(postStakingBkc - preStakingBkc)}`);

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("   ✅ BUYBACK TEST COMPLETE");
    console.log("════════════════════════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error("\n❌ Error:", error.message || error);
    process.exit(1);
});
