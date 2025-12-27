import { ethers } from "hardhat";

async function main() {
    const STYLUS_ORACLE = "0xdac58dc90bc27c617d3ba75efeae80e6f3f6a3bd";
    
    console.log("Deploying RandomnessOracleWrapper...");
    console.log("Stylus Oracle:", STYLUS_ORACLE);
    
    const Wrapper = await ethers.getContractFactory("RandomnessOracleWrapper");
    const wrapper = await Wrapper.deploy(STYLUS_ORACLE);
    await wrapper.waitForDeployment();
    
    const address = await wrapper.getAddress();
    console.log("RandomnessOracleWrapper deployed to:", address);
    
    // Testar
    console.log("\nTestando...");
    const seed = await wrapper.getCurrentSeed();
    console.log("Current seed:", seed.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
