import { ethers } from "hardhat";

async function main() {
    const STYLUS = "0x8a08081955c666b21cb212be6b0ef8ea09780ac9";
    const [signer] = await ethers.getSigners();
    
    console.log("=== DEPLOY V2 ===\n");
    
    // Inicializar Stylus
    const stylus = new ethers.Contract(STYLUS, ["function initialize() external"], signer);
    try {
        await (await stylus.initialize()).wait();
        console.log("Stylus inicializado!");
    } catch(e) { console.log("Stylus já inicializado"); }
    
    // Deploy Wrapper
    const Wrapper = await ethers.getContractFactory("SecureRandomnessWrapper");
    const wrapper = await Wrapper.deploy(STYLUS);
    await wrapper.waitForDeployment();
    
    console.log("Wrapper V2:", await wrapper.getAddress());
}

main().catch(console.error);
