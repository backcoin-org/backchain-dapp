import { ethers } from "hardhat";

async function main() {
    const SECURE_STYLUS = "0xf7606ba2771f813f6e1d13c47a80a34eaa7dafb8";
    const [signer] = await ethers.getSigners();
    
    console.log("=== DEPLOY SECURE RANDOMNESS ORACLE ===\n");
    console.log("Deployer:", signer.address);
    console.log("Stylus Oracle:", SECURE_STYLUS);
    
    // Inicializar Stylus
    console.log("\n1. Inicializando Stylus...");
    const stylus = new ethers.Contract(SECURE_STYLUS, [
        "function initialize() external"
    ], signer);
    
    try {
        const initTx = await stylus.initialize();
        await initTx.wait();
        console.log("   Stylus inicializado!");
    } catch (e) {
        console.log("   Stylus já inicializado ou erro");
    }
    
    // Deploy Wrapper
    console.log("\n2. Deploying SecureRandomnessWrapper...");
    const Wrapper = await ethers.getContractFactory("SecureRandomnessWrapper");
    const wrapper = await Wrapper.deploy(SECURE_STYLUS);
    await wrapper.waitForDeployment();
    
    const wrapperAddress = await wrapper.getAddress();
    console.log("   Wrapper deployed:", wrapperAddress);
    
    // Testar modo rápido
    console.log("\n3. Testando modo rápido...");
    const tx = await wrapper.getRandomInRange(1, 100);
    const receipt = await tx.wait();
    console.log("   getRandomInRange(1,100) - Gas:", receipt.gasUsed.toString());
    
    // Testar config
    console.log("\n4. Verificando config...");
    const config = await wrapper.getConfig();
    console.log("   Min blocks wait:", config[0].toString());
    console.log("   Max blocks wait:", config[1].toString());
    console.log("   Fee per number:", config[2].toString());
    
    console.log("\n=== DEPLOY COMPLETO ===");
    console.log("\nEndereços:");
    console.log("  Stylus (Rust):", SECURE_STYLUS);
    console.log("  Wrapper (Sol):", wrapperAddress);
}

main().catch(console.error);
