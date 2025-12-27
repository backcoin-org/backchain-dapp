import { ethers } from "hardhat";

async function main() {
    const WRAPPER = "0xdC2DE7F61d1Bf4BF2A423b1b38C16A9B294263d5";
    const [signer] = await ethers.getSigners();
    
    const wrapper = new ethers.Contract(WRAPPER, [
        "function getRandomInRange(uint256 min, uint256 max) external payable returns (uint256)",
        "event RandomGenerated(address indexed requester, uint256 min, uint256 max, uint256 result)"
    ], signer);

    console.log("=== TESTE ORÁCULO V2 (com entropia) ===\n");
    
    const results: number[] = [];
    const NUM_TESTS = 30;
    
    for (let i = 0; i < NUM_TESTS; i++) {
        const tx = await wrapper.getRandomInRange(1, 100);
        const receipt = await tx.wait();
        const result = parseInt(receipt.logs[0].data.slice(-64), 16);
        results.push(result);
        process.stdout.write(`${result} `);
        if ((i + 1) % 10 === 0) console.log();
    }
    
    console.log("\n\n=== ESTATÍSTICAS ===");
    console.log(`Valores únicos: ${new Set(results).size}/${results.length}`);
    console.log(`Min: ${Math.min(...results)}, Max: ${Math.max(...results)}`);
    console.log(`Média: ${(results.reduce((a,b) => a+b, 0) / results.length).toFixed(1)}`);
}

main().catch(console.error);
