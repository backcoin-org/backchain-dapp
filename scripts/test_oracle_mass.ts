import { ethers } from "hardhat";

async function main() {
    const WRAPPER = "0xa1dcAf1A3026fa53F85099B2b820b976C6001e9d";
    const [signer] = await ethers.getSigners();
    
    const wrapper = new ethers.Contract(WRAPPER, [
        "function getRandomInRange(uint256 min, uint256 max) external payable returns (uint256)",
        "function getRandomsInRange(uint256 min, uint256 max, uint256 count) external payable returns (uint256[] memory)",
        "event RandomGenerated(address indexed requester, uint256 min, uint256 max, uint256 result)"
    ], signer);

    console.log("=== TESTE EM MASSA DO ORÁCULO ===\n");
    
    const results: number[] = [];
    const NUM_TESTS = 50;
    
    console.log(`Gerando ${NUM_TESTS} números aleatórios (1-100)...\n`);
    
    for (let i = 0; i < NUM_TESTS; i++) {
        try {
            const tx = await wrapper.getRandomInRange(1, 100);
            const receipt = await tx.wait();
            
            // Decodificar o evento
            const event = receipt.logs[0];
            const result = parseInt(event.data.slice(-64), 16);
            results.push(result);
            
            process.stdout.write(`${result} `);
            if ((i + 1) % 10 === 0) console.log();
        } catch (e: any) {
            console.log(`\nErro no teste ${i}: ${e.message}`);
            break;
        }
    }
    
    console.log("\n\n=== ESTATÍSTICAS ===");
    console.log(`Total: ${results.length} números`);
    console.log(`Min: ${Math.min(...results)}`);
    console.log(`Max: ${Math.max(...results)}`);
    console.log(`Média: ${(results.reduce((a,b) => a+b, 0) / results.length).toFixed(2)}`);
    
    // Distribuição
    const distribution: {[key: number]: number} = {};
    results.forEach(r => distribution[r] = (distribution[r] || 0) + 1);
    
    console.log("\nDistribuição (valores únicos):", Object.keys(distribution).length);
    console.log("Valores repetidos:", results.length - Object.keys(distribution).length);
}

main().catch(console.error);
