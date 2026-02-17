// scripts/deploy_cert_nft.ts
// Deploy NotaryCertNFT — ERC-721 read-only wrapper for Notary certificates
// Usage: npx hardhat run scripts/deploy_cert_nft.ts --network arbitrumSepolia

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const ADDRESSES_FILE = path.join(__dirname, "..", "deployment-addresses.json");
const BASE_TOKEN_URI = "https://backcoin.org/api/cert-metadata/";

function loadAddresses() {
    return JSON.parse(fs.readFileSync(ADDRESSES_FILE, "utf8"));
}

function updateAddresses(key: string, value: string) {
    const data = loadAddresses();
    data[key] = value;
    fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(data, null, 2));
    console.log(`Updated ${key} = ${value}`);
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const addresses = loadAddresses();
    const notaryAddr = addresses.notary;
    console.log("Notary:", notaryAddr);

    // Step 1: Deploy NotaryCertNFT
    console.log("\nStep 1: Deploy NotaryCertNFT...");
    const NotaryCertNFT = await ethers.getContractFactory("NotaryCertNFT");
    const certNft = await NotaryCertNFT.deploy(notaryAddr, BASE_TOKEN_URI);
    await certNft.waitForDeployment();
    const certNftAddr = await certNft.getAddress();
    console.log(`NotaryCertNFT deployed at: ${certNftAddr}`);

    const ver = await certNft.version();
    console.log(`Version: ${ver}`);

    updateAddresses("notaryCertNFT", certNftAddr);

    // Step 2: Verify
    console.log("\nStep 2: Verify...");
    try {
        const owner = await certNft.ownerOf(1);
        console.log(`Cert #1 owner: ${owner}`);
    } catch {
        console.log("Cert #1 does not exist yet (expected if no certs)");
    }

    const supply = await certNft.totalSupply();
    console.log(`Total supply (from Notary): ${supply}`);
    console.log(`Base URI: ${BASE_TOKEN_URI}`);

    console.log("\nNotaryCertNFT deployment complete!");
    console.log("No ecosystem registration needed (standalone read-only wrapper).");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
});
