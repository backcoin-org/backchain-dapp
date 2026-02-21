// scripts/fund_fortune_pool.ts
// Add deployer as minter, mint 1M BKC, fund FortunePool prize pool
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../deployment-addresses.json"), "utf8"));

    const bkc = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);
    const fortuneAbi = [
        "function fundPrizePool(uint256 amount) external",
        "function prizePool() view returns (uint256)",
    ];
    const fortune = new ethers.Contract(addresses.fortunePool, fortuneAbi, deployer);

    const FUND = ethers.parseEther("1000000");

    // Step 1: Add deployer as minter (deployer is minterAdmin)
    console.log("Adding deployer as authorized minter...");
    const tx0 = await bkc.addMinter(deployer.address);
    await tx0.wait();
    console.log("✅ Deployer added as minter");

    // Step 2: Mint 1M BKC
    console.log("Minting 1M BKC...");
    const tx1 = await bkc.mint(deployer.address, FUND);
    await tx1.wait();
    console.log("✅ Minted 1M BKC");

    // Step 3: Remove deployer as minter (cleanup)
    console.log("Removing deployer from minters...");
    const tx1b = await bkc.removeMinter(deployer.address);
    await tx1b.wait();
    console.log("✅ Deployer removed from minters");

    // Step 4: Approve and fund pool
    console.log("Funding prize pool...");
    const tx2 = await bkc.approve(addresses.fortunePool, FUND);
    await tx2.wait();
    const tx3 = await fortune.fundPrizePool(FUND);
    await tx3.wait();

    const pool = await fortune.prizePool();
    console.log(`✅ Prize pool: ${ethers.formatEther(pool)} BKC`);
}

main().catch(console.error);
