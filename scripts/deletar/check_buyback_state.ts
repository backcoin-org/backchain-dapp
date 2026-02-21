import { ethers } from "hardhat";
import fs from "fs";

const addrs = JSON.parse(fs.readFileSync("deployment-addresses.json", "utf8"));

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("\n══════ BUYBACK SYSTEM STATE ══════");

    const ecosystemBal = await ethers.provider.getBalance(addrs.backchainEcosystem);
    console.log("Ecosystem ETH balance:", ethers.formatEther(ecosystemBal));

    const BuybackMiner = await ethers.getContractAt("BuybackMiner", addrs.buybackMiner);
    const swapTarget = await BuybackMiner.liquidityPool();
    console.log("Swap target (liquidityPool):", swapTarget);
    console.log("Internal LP addr:", addrs.liquidityPool);

    const BKC = await ethers.getContractAt("BKCToken", addrs.bkcToken);

    // Internal LP state
    const LP = await ethers.getContractAt("LiquidityPool", addrs.liquidityPool);
    const er = await LP.ethReserve();
    const br = await LP.bkcReserve();
    console.log("\n══════ INTERNAL LP STATE ══════");
    console.log("LP ethReserve:", ethers.formatEther(er));
    console.log("LP bkcReserve:", ethers.formatEther(br));
    console.log("LP has liquidity:", er > 0n && br > 0n);

    // BuybackMiner state
    console.log("\n══════ BUYBACK MINER STATE ══════");
    const buybackBal = await ethers.provider.getBalance(addrs.buybackMiner);
    console.log("BuybackMiner ETH:", ethers.formatEther(buybackBal));

    const totalBuybacks = await BuybackMiner.totalBuybacks();
    console.log("Total buybacks:", totalBuybacks.toString());

    const execFee = await BuybackMiner.executionFee();
    console.log("Execution fee:", ethers.formatEther(execFee), "ETH");

    const owner = await BuybackMiner.owner();
    console.log("Owner:", owner);
    console.log("Deployer:", deployer.address);
    console.log("Is owner:", owner.toLowerCase() === deployer.address.toLowerCase());

    // Ecosystem state
    console.log("\n══════ ECOSYSTEM STATE ══════");
    const Ecosystem = await ethers.getContractAt("BackchainEcosystem", addrs.backchainEcosystem);
    try {
        const bp = await Ecosystem.buybackPool();
        console.log("buybackPool:", ethers.formatEther(bp));
    } catch(e: any) { console.log("buybackPool error:", e.message?.slice(0,80)); }

    // Check if BuybackMiner is authorized minter
    const isMinter = await BKC.isMinter(addrs.buybackMiner);
    console.log("BuybackMiner is BKC minter:", isMinter);

    console.log("\n══════ SUMMARY ══════");
    if (er === 0n || br === 0n) {
        console.log("⚠️  Internal LP is EMPTY — buyback swap will fail");
        console.log("   Need to either:");
        console.log("   1. Add liquidity to internal LP, OR");
        console.log("   2. Deploy a Uniswap V3 wrapper and setSwapTarget()");
    } else {
        console.log("✅ Internal LP has liquidity — buyback can proceed");
    }
}

main();
