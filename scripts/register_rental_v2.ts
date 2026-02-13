// scripts/register_rental_v2.ts
// Register already-deployed RentalManager V2 in ecosystem
// Usage: npx hardhat run scripts/register_rental_v2.ts --network arbitrumSepolia

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const addresses = JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "deployment-addresses.json"), "utf8")
    );

    const ecoAddr = addresses.backchainEcosystem;
    const rentalAddr = addresses.rentalManager; // V2: 0x13323724a20cd48C5dD78f78b5aa07D8Cc46EDf3

    console.log("Ecosystem:", ecoAddr);
    console.log("RentalManager V2:", rentalAddr);

    // Use compiled artifact for correct ABI
    const eco = await ethers.getContractAt("BackchainEcosystem", ecoAddr, deployer);

    const moduleId = ethers.id("RENTAL");
    console.log("\nRegistering RENTAL module...");
    console.log("moduleId:", moduleId);

    const tx = await eco.registerModule(
        rentalAddr,
        moduleId,
        [true, 0, 1500, 3000, 5500] // ModuleConfig: active, customBps, operatorBps, treasuryBps, buybackBps
    );
    const receipt = await tx.wait();
    console.log("Registered! TX:", receipt?.hash);

    // Verify
    const authorized = await eco.authorizedContracts(rentalAddr);
    console.log("authorizedContracts[rental]:", authorized);
    console.log("Expected moduleId:", moduleId);
    console.log("Match:", authorized === moduleId);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
