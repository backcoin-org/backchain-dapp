import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const faucetAddr = "0xb80e5389b16693CAEe4655b535cc7Bceb4770255";
    const abi = [
        "function setConfig(address _relayer, uint256 _tokensPerClaim, uint256 _ethPerClaim, uint256 _cooldown) external",
        "function getFaucetStatus() view returns (uint256,uint256,uint256,uint256,uint256,uint256)",
    ];
    const faucet = new ethers.Contract(faucetAddr, abi, deployer);

    // setConfig(relayer, 1000 BKC, 0.01 ETH, 100yr cooldown)
    console.log("Setting faucet config: relayer + 1000 BKC + 0.01 ETH...");
    const tx1 = await faucet.setConfig(
        deployer.address,
        ethers.parseEther("1000"),
        ethers.parseEther("0.01"),
        3153600000 // ~100 years
    );
    await tx1.wait();
    console.log("Config set");

    const s = await faucet.getFaucetStatus();
    console.log(`ETH balance: ${ethers.formatEther(s[0])}`);
    console.log(`BKC balance: ${ethers.formatEther(s[1])}`);
    console.log(`ETH per drip: ${ethers.formatEther(s[2])}`);
    console.log(`BKC per drip: ${ethers.formatEther(s[3])}`);
}

main().catch(console.error);
