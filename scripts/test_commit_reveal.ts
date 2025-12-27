import { ethers } from "hardhat";

async function main() {
    const WRAPPER = "0xdc98d325653F317d143016C1a07309b2419fD31e";
    const [signer] = await ethers.getSigners();
    
    const wrapper = new ethers.Contract(WRAPPER, [
        "function commitRequest(bytes32 secret, uint256 numCount) external payable returns (bytes32)",
        "function revealRequest(bytes32 requestId, bytes32 secret, uint256[] mins, uint256[] maxs) external returns (uint256[])",
        "function getRandomInRange(uint256 min, uint256 max) external returns (uint256)",
        "event CommitCreated(address indexed requester, bytes32 indexed requestId, uint256 numCount)",
        "event RandomsRevealed(address indexed requester, bytes32 indexed requestId, uint256[] results)"
    ], signer);

    console.log("=== TESTE COMMIT-REVEAL ===\n");
    
    // 1. Gerar secret
    const secret = ethers.hexlify(ethers.randomBytes(32));
    console.log("1. Secret:", secret.slice(0, 20) + "...");
    
    // 2. Commit
    console.log("\n2. Fazendo COMMIT (pedindo 5 números)...");
    const commitTx = await wrapper.commitRequest(secret, 5);
    const commitReceipt = await commitTx.wait();
    const requestId = commitReceipt.logs[0].topics[2];
    console.log("   RequestId:", requestId.slice(0, 20) + "...");
    console.log("   Block:", commitReceipt.blockNumber);
    console.log("   Gas:", commitReceipt.gasUsed.toString());
    
    // 3. Aguardar 3 blocos
    console.log("\n3. Aguardando 3 blocos...");
    const startBlock = commitReceipt.blockNumber;
    while (true) {
        const current = await ethers.provider.getBlockNumber();
        process.stdout.write(`\r   ${current - startBlock}/3 blocos`);
        if (current - startBlock >= 3) break;
        await new Promise(r => setTimeout(r, 500));
    }
    console.log(" ✓");
    
    // 4. Reveal
    console.log("\n4. Fazendo REVEAL...");
    console.log("   Ranges: [1-6], [1-100], [1-1000], [1-60], [1-37]");
    
    const revealTx = await wrapper.revealRequest(
        requestId,
        secret,
        [1, 1, 1, 1, 1],
        [6, 100, 1000, 60, 37]
    );
    const revealReceipt = await revealTx.wait();
    
    // Decodificar resultado
    const iface = new ethers.Interface([
        "event RandomsRevealed(address indexed, bytes32 indexed, uint256[] results)"
    ]);
    const log = iface.parseLog({
        topics: revealReceipt.logs[0].topics,
        data: revealReceipt.logs[0].data
    });
    
    const results = log?.args.results.map((r: bigint) => Number(r));
    
    console.log("\n   ✅ RESULTADOS:");
    console.log(`   D6 (1-6):      ${results[0]}`);
    console.log(`   Percent (1-100): ${results[1]}`);
    console.log(`   Mil (1-1000):  ${results[2]}`);
    console.log(`   MegaSena (1-60): ${results[3]}`);
    console.log(`   Roleta (1-37): ${results[4]}`);
    console.log(`\n   Gas usado: ${revealReceipt.gasUsed}`);
    
    console.log("\n=== COMMIT-REVEAL FUNCIONANDO! ===");
}

main().catch(console.error);
