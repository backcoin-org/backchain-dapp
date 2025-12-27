import { ethers } from "hardhat";

async function main() {
    const CONTRACT = "0x6eB891C2C7bC248EdDf31c77C4258205a37C4126";
    const [signer] = await ethers.getSigners();
    
    const randomness = new ethers.Contract(CONTRACT, [
        "function commit(bytes32 secret, uint256 numCount) external payable returns (bytes32)",
        "function reveal(bytes32 requestId, bytes32 secret, uint256[] mins, uint256[] maxs) external returns (uint256[])",
        "function getRandom(uint256 min, uint256 max) external returns (uint256)",
        "function getRandoms(uint256[] mins, uint256[] maxs) external returns (uint256[])",
        "function canReveal(bytes32 requestId) external view returns (bool)",
        "function getRequest(bytes32 requestId) external view returns (address, uint256, uint256, bool, uint256)",
        "event RequestCommitted(bytes32 indexed requestId, address indexed requester, uint256 numCount, uint256 commitBlock)",
        "event RequestRevealed(bytes32 indexed requestId, address indexed requester, uint256[] results)"
    ], signer);

    console.log("=== TESTE COMMIT-REVEAL ===\n");
    
    // Commit
    const secret = ethers.hexlify(ethers.randomBytes(32));
    console.log("1. COMMIT");
    console.log("   Secret:", secret.slice(0,20) + "...");
    
    const commitTx = await randomness.commit(secret, 5);
    const commitReceipt = await commitTx.wait();
    
    const requestId = commitReceipt.logs[0].topics[1];
    console.log("   RequestId:", requestId.slice(0,20) + "...");
    console.log("   Block:", commitReceipt.blockNumber);
    
    // Aguardar até canReveal = true
    console.log("\n2. AGUARDANDO até canReveal = true...");
    let attempts = 0;
    while (attempts < 30) {
        attempts++;
        const can = await randomness.canReveal(requestId);
        const req = await randomness.getRequest(requestId);
        const currentBlock = await ethers.provider.getBlockNumber();
        const blocksPassed = currentBlock - Number(req[1]);
        
        process.stdout.write(`\r   Blocos: ${blocksPassed}, canReveal: ${can}    `);
        
        if (can) {
            console.log("\n   ✓ Pronto para reveal!");
            break;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    
    // Reveal
    console.log("\n3. REVEAL");
    
    try {
        const revealTx = await randomness.reveal(
            requestId,
            secret,
            [1, 1, 1, 1, 1],
            [6, 20, 100, 60, 37]
        );
        const revealReceipt = await revealTx.wait();
        
        const iface = new ethers.Interface([
            "event RequestRevealed(bytes32 indexed requestId, address indexed requester, uint256[] results)"
        ]);
        const log = iface.parseLog({
            topics: revealReceipt.logs[0].topics,
            data: revealReceipt.logs[0].data
        });
        
        const results = log?.args.results.map((r: bigint) => Number(r));
        
        console.log("\n   ✅ RESULTADOS:");
        console.log(`   D6:      ${results[0]}`);
        console.log(`   D20:     ${results[1]}`);
        console.log(`   Percent: ${results[2]}`);
        console.log(`   MegaSena: ${results[3]}`);
        console.log(`   Roleta:  ${results[4]}`);
        console.log(`\n   Gas: ${revealReceipt.gasUsed}`);
        
        console.log("\n🎉 COMMIT-REVEAL FUNCIONANDO!");
    } catch (e: any) {
        console.log("   ❌ Erro:", e.message?.slice(0, 100));
    }
}

main().catch(console.error);
