import { ethers } from "hardhat";

async function main() {
    // Stylus que funciona (só usa increment)
    const STYLUS = "0xb6bb5e9c9df36fa9504d87125af0e4b284b55092";
    
    console.log("=== DEPLOY BACKCHAIN RANDOMNESS ===\n");
    
    const [signer] = await ethers.getSigners();
    console.log("Deployer:", signer.address);
    console.log("Stylus Entropy:", STYLUS);
    
    const Factory = await ethers.getContractFactory("BackchainRandomness");
    const contract = await Factory.deploy(STYLUS);
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log("\n✅ BackchainRandomness deployed:", address);
    
    // Teste rápido
    console.log("\nTestando getRandom(1, 100)...");
    const tx = await contract.getRandom(1, 100);
    const receipt = await tx.wait();
    console.log("Gas:", receipt.gasUsed.toString());
    
    console.log("\n=== DEPLOY COMPLETO ===");
}

main().catch(console.error);
