import { ethers } from "hardhat";

async function main() {
    const WRAPPER = "0xdC2DE7F61d1Bf4BF2A423b1b38C16A9B294263d5";
    const [signer] = await ethers.getSigners();
    
    const wrapper = new ethers.Contract(WRAPPER, [
        "function getRandomsMulti(uint256[] mins, uint256[] maxs) external payable returns (uint256[])",
        "event RandomsGenerated(address indexed requester, uint256[] results)"
    ], signer);

    const tests = [
        { mins: [1, 1, 1, 1], maxs: [3, 5, 10, 100], desc: "4 nums (Tier+D5+D10+%)" },
        { mins: [1, 1, 1], maxs: [6, 6, 6], desc: "3 nums (3xD6)" },
        { mins: [0, 0, 0, 0, 0], maxs: [1, 1, 1, 1, 1], desc: "5 nums (5xCoin)" },
        { mins: [1, 1, 1, 1, 1, 1], maxs: [60, 60, 60, 60, 60, 60], desc: "6 nums (MegaSena)" },
        { mins: [1, 1, 1], maxs: [20, 20, 20], desc: "3 nums (3xD20)" },
    ];

    console.log("=== 10 LOOPS COM CUSTOS ===\n");
    
    let totalGas = 0n;
    let totalCost = 0n;
    let txCount = 0;
    
    const gasStats: {[key: string]: bigint[]} = {};
    
    for (let loop = 1; loop <= 10; loop++) {
        console.log(`\n========== LOOP ${loop}/10 ==========`);
        
        for (const test of tests) {
            try {
                const tx = await wrapper.getRandomsMulti(test.mins, test.maxs, { gasLimit: 500000 });
                const receipt = await tx.wait();
                
                const gasUsed = receipt.gasUsed;
                const gasPrice = receipt.gasPrice || 0n;
                const cost = gasUsed * gasPrice;
                
                totalGas += gasUsed;
                totalCost += cost;
                txCount++;
                
                if (!gasStats[test.desc]) gasStats[test.desc] = [];
                gasStats[test.desc].push(gasUsed);
                
                const iface = new ethers.Interface(["event RandomsGenerated(address indexed requester, uint256[] results)"]);
                const log = iface.parseLog({ topics: receipt.logs[0].topics, data: receipt.logs[0].data });
                const results = log?.args.results.map((r: bigint) => Number(r));
                
                console.log(`${test.desc}`);
                console.log(`  Resultados: [${results.join(", ")}]`);
                console.log(`  Gas: ${gasUsed.toLocaleString()} | Custo: ${ethers.formatEther(cost)} ETH`);
                
            } catch (e: any) {
                console.log(`${test.desc}: ERRO - ${e.message?.slice(0, 50)}`);
            }
        }
    }
    
    console.log("\n\n========== RESUMO ==========");
    console.log(`Total de transações: ${txCount}`);
    console.log(`Gas total: ${totalGas.toLocaleString()}`);
    console.log(`Custo total: ${ethers.formatEther(totalCost)} ETH`);
    console.log(`Média gas/tx: ${(totalGas / BigInt(txCount)).toLocaleString()}`);
    console.log(`Média custo/tx: ${ethers.formatEther(totalCost / BigInt(txCount))} ETH`);
    
    console.log("\n--- Gas por tipo de chamada (média) ---");
    for (const [desc, values] of Object.entries(gasStats)) {
        const avg = values.reduce((a, b) => a + b, 0n) / BigInt(values.length);
        console.log(`${desc}: ${avg.toLocaleString()} gas`);
    }
    
    console.log("\n=== FIM ===");
}

main().catch(console.error);
