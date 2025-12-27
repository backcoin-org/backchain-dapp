import { ethers } from "hardhat";

async function main() {
    const WRAPPER = "0xdC2DE7F61d1Bf4BF2A423b1b38C16A9B294263d5";
    const [signer] = await ethers.getSigners();
    
    const wrapper = new ethers.Contract(WRAPPER, [
        "function getRandomsMulti(uint256[] mins, uint256[] maxs) external payable returns (uint256[])",
        "event RandomsGenerated(address indexed requester, uint256[] results)"
    ], signer);

    console.log("=== TESTE DE VARIAÇÕES ===\n");
    
    const tests = [
        { mins: [1, 1, 1, 1], maxs: [3, 5, 10, 100], desc: "Tier + D5 + D10 + Percent" },
        { mins: [1, 1, 1], maxs: [6, 6, 6], desc: "3x Dado D6" },
        { mins: [1, 1], maxs: [52, 52], desc: "2 Cartas" },
        { mins: [0, 0, 0, 0, 0], maxs: [1, 1, 1, 1, 1], desc: "5x Cara/Coroa" },
        { mins: [1], maxs: [1000000], desc: "Loteria (1-1M)" },
        { mins: [1, 1, 1, 1, 1, 1], maxs: [60, 60, 60, 60, 60, 60], desc: "6 números MegaSena" },
        { mins: [1, 1], maxs: [37, 37], desc: "2x Roleta" },
        { mins: [1, 1, 1], maxs: [10, 100, 1000], desc: "Escala 10/100/1000" },
        { mins: [1, 1, 1, 1], maxs: [4, 13, 4, 13], desc: "2 Cartas (naipe+valor)" },
        { mins: [1, 1, 1], maxs: [20, 20, 20], desc: "3x D20 (RPG)" },
    ];
    
    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        console.log(`\n[${i+1}] ${test.desc}`);
        console.log(`    Ranges: ${test.mins.map((m, j) => `${m}-${test.maxs[j]}`).join(", ")}`);
        
        try {
            const tx = await wrapper.getRandomsMulti(test.mins, test.maxs, { gasLimit: 500000 });
            const receipt = await tx.wait();
            
            // Decodificar resultados do evento
            const iface = new ethers.Interface(["event RandomsGenerated(address indexed requester, uint256[] results)"]);
            const log = iface.parseLog({ topics: receipt.logs[0].topics, data: receipt.logs[0].data });
            const results = log?.args.results.map((r: bigint) => Number(r));
            
            console.log(`    Resultados: [${results.join(", ")}]`);
        } catch (e: any) {
            console.log(`    ERRO: ${e.message?.slice(0, 80)}`);
        }
    }
    
    console.log("\n=== FIM ===");
}

main().catch(console.error);
