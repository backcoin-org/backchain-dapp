import { ethers } from "hardhat";

async function main() {
    const NEW_STYLUS = "0xb6bb5e9c9df36fa9504d87125af0e4b284b55092";
    
    console.log("Deploying RandomnessOracleWrapper V2...");
    console.log("New Stylus Oracle:", NEW_STYLUS);
    
    // Primeiro inicializar o novo Stylus
    const [signer] = await ethers.getSigners();
    const stylus = new ethers.Contract(NEW_STYLUS, [
        "function initialize() external"
    ], signer);
    
    console.log("Inicializando Stylus...");
    const initTx = await stylus.initialize();
    await initTx.wait();
    console.log("Stylus inicializado!");
    
    // Deploy do wrapper
    const Wrapper = await ethers.getContractFactory("RandomnessOracleWrapper");
    const wrapper = await Wrapper.deploy(NEW_STYLUS);
    await wrapper.waitForDeployment();
    
    console.log("Wrapper V2 deployed to:", await wrapper.getAddress());
}

main().catch(console.error);
