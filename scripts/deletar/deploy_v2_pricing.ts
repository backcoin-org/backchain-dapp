// scripts/deploy_v2_pricing.ts
// Deploy Notary V2, FortunePool V2, and Agora V2.1 with updated pricing

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH\n");

    // Load existing addresses
    const addressFile = path.join(__dirname, "..", "deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));

    const ecosystemAddress = addresses.backchainEcosystem;
    const bkcTokenAddress = addresses.bkcToken;
    console.log("Ecosystem:", ecosystemAddress);
    console.log("BKC Token:", bkcTokenAddress);

    // ═══════════════════════════════════════════════════════════════
    // 1. Deploy Notary V2 (CERT_FEE = 0.0005 ETH)
    // ═══════════════════════════════════════════════════════════════
    console.log("\n─── Deploying Notary V2 ───");
    const Notary = await ethers.getContractFactory("Notary");
    const notary = await Notary.deploy(ecosystemAddress);
    await notary.waitForDeployment();
    const notaryAddress = await notary.getAddress();
    console.log("Notary V2:", notaryAddress);
    console.log("Version:", await notary.version());
    console.log("CERT_FEE:", ethers.formatEther(await notary.CERT_FEE()), "ETH");

    // ═══════════════════════════════════════════════════════════════
    // 2. Deploy FortunePool V2 (fixed min tier fees)
    // ═══════════════════════════════════════════════════════════════
    console.log("\n─── Deploying FortunePool V2 ───");
    const Fortune = await ethers.getContractFactory("FortunePool");
    const fortune = await Fortune.deploy(ecosystemAddress, bkcTokenAddress);
    await fortune.waitForDeployment();
    const fortuneAddress = await fortune.getAddress();
    console.log("FortunePool V2:", fortuneAddress);
    console.log("Version:", await fortune.version());
    console.log("FEE_TIER0:", ethers.formatEther(await fortune.FEE_TIER0()), "ETH");
    console.log("FEE_TIER1:", ethers.formatEther(await fortune.FEE_TIER1()), "ETH");
    console.log("FEE_TIER2:", ethers.formatEther(await fortune.FEE_TIER2()), "ETH");

    // ═══════════════════════════════════════════════════════════════
    // 3. Deploy Agora V2.1 (increased badge/boost prices)
    // ═══════════════════════════════════════════════════════════════
    console.log("\n─── Deploying Agora V2.1 ───");
    const Agora = await ethers.getContractFactory("Agora");
    const agora = await Agora.deploy(ecosystemAddress);
    await agora.waitForDeployment();
    const agoraAddress = await agora.getAddress();
    console.log("Agora V2.1:", agoraAddress);
    console.log("Version:", await agora.version());

    // ═══════════════════════════════════════════════════════════════
    // 4. Update deployment-addresses.json
    // ═══════════════════════════════════════════════════════════════
    addresses.notary = notaryAddress;
    addresses.fortunePool = fortuneAddress;
    addresses.agora = agoraAddress;
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
    console.log("\n✅ Updated deployment-addresses.json");

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log("\n══════════════════════════════════════════════");
    console.log("DEPLOYMENT COMPLETE");
    console.log("══════════════════════════════════════════════");
    console.log("Notary V2:       ", notaryAddress);
    console.log("FortunePool V2:  ", fortuneAddress);
    console.log("Agora V2.1:      ", agoraAddress);
    console.log("══════════════════════════════════════════════");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
