// scripts/configure_faucet.ts
import { ethers } from "hardhat";

async function main() {
    const faucet = await ethers.getContractAt(
        "SimpleBKCFaucet", 
        "0x78E868ea89ac4c1B16E51899878Af539c98B2943"
    );
    
    console.log("Configurando Faucet...");
    console.log("  BKC por claim: 1000");
    console.log("  ETH por claim: 0.01");
    
    const tx = await faucet.setAmounts(
        ethers.parseEther("1000"),
        ethers.parseEther("0.01")
    );
    
    console.log("TX:", tx.hash);
    await tx.wait();
    console.log("OK! Faucet configurado.");
}

main().catch(console.error);