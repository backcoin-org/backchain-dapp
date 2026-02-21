// scripts/deploy_agora_v2.ts
// Deploy Agora V2 contract to Arbitrum Sepolia

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying Agora V2 with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");

    // Load existing addresses
    const addressFile = path.join(__dirname, "..", "deployment-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));

    const ecosystemAddress = addresses.backchainEcosystem;
    console.log("Ecosystem address:", ecosystemAddress);

    // Deploy Agora V2
    console.log("\nDeploying Agora V2...");
    const Agora = await ethers.getContractFactory("Agora");
    const agora = await Agora.deploy(ecosystemAddress);
    await agora.waitForDeployment();

    const agoraAddress = await agora.getAddress();
    console.log("Agora V2 deployed to:", agoraAddress);

    // Verify version
    const version = await agora.version();
    console.log("Version:", version);

    // Update deployment-addresses.json
    addresses.agora = agoraAddress;
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
    console.log("\nUpdated deployment-addresses.json");

    // Register Agora V2 module in ecosystem
    console.log("\nRegistering Agora V2 in ecosystem...");
    const ecosystem = await ethers.getContractAt("BackchainEcosystem", ecosystemAddress);

    const MODULE_ID = ethers.keccak256(ethers.toUtf8Bytes("AGORA"));
    const tx = await ecosystem.registerModule(MODULE_ID, agoraAddress);
    await tx.wait();
    console.log("Module registered!");

    console.log("\n✅ Agora V2 deployment complete!");
    console.log("Address:", agoraAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
