import { ethers } from "hardhat";

async function main() {
    const WRAPPER = "0xdc98d325653F317d143016C1a07309b2419fD31e";
    const [signer] = await ethers.getSigners();
    
    const wrapper = new ethers.Contract(WRAPPER, [
        "function getRandomInRange(uint256 min, uint256 max) external returns (uint256)",
        "function getRandomsMulti(uint256[] mins, uint256[] maxs) external returns (uint256[])",
        "event QuickRandomGenerated(address indexed requester, uint256 min, uint256 max, uint256 result)"
    ], signer);

    console.log("=== TESTE MODO RÁPIDO V2 ===\n");
    
    // 10 testes simples
    console.log("--- 10x getRandomInRange(1, 100) ---");
    for (let i = 0; i < 10; i++) {
        const tx = await wrapper.getRandomInRange(1, 100);
        const receipt = await tx.wait();
        const result = parseInt(receipt.logs[0].data.slice(-64), 16);
        process.stdout.write(`${result} `);
    }
    
    // Multi
    console.log("\n\n--- getRandomsMulti ---");
    const tx = await wrapper.getRandomsMulti(
        [1, 1, 1, 1, 1],
        [6, 100, 1000, 60, 37]
    );
    const receipt = await tx.wait();
    console.log("Gas:", receipt.gasUsed.toString());
    
    console.log("\n=== OK ===");
}

main().catch(console.error);
