import { ethers } from "hardhat";

async function main() {
    const WRAPPER = "0x7684697BA9A0487E1a13DA9C8250D76924f2d31D";
    const [signer] = await ethers.getSigners();
    
    const wrapper = new ethers.Contract(WRAPPER, [
        "function getRandomInRange(uint256 min, uint256 max) external returns (uint256)",
        "function getRandomsMulti(uint256[] mins, uint256[] maxs) external returns (uint256[])",
        "function commitRequest(bytes32 secret, uint256 numCount) external payable returns (bytes32)",
        "function revealRequest(bytes32 requestId, bytes32 secret, uint64[] mins, uint64[] maxs) external returns (uint256[])",
        "event QuickRandomGenerated(address indexed requester, uint256 min, uint256 max, uint256 result)",
        "event CommitCreated(address indexed requester, bytes32 indexed requestId, uint256 numCount)",
        "event RandomsRevealed(address indexed requester, bytes32 indexed requestId, uint256[] results)"
    ], signer);

    console.log("=== TESTE ORÁCULO SEGURO ===\n");
    
    // TESTE 1: Modo Rápido
    console.log("--- MODO RÁPIDO (1 transação) ---\n");
    
    for (let i = 0; i < 5; i++) {
        const tx = await wrapper.getRandomInRange(1, 100);
        const receipt = await tx.wait();
        const event = receipt.logs[0];
        const result = parseInt(event.data.slice(-64), 16);
        console.log(`Teste ${i+1}: ${result} (Gas: ${receipt.gasUsed})`);
    }
    
    // TESTE 2: Modo Rápido Multi
    console.log("\n--- MODO RÁPIDO MULTI ---\n");
    
    const txMulti = await wrapper.getRandomsMulti([1, 1, 1], [6, 100, 1000]);
    const receiptMulti = await txMulti.wait();
    console.log(`3 números (D6, %, 1000): Gas ${receiptMulti.gasUsed}`);
    
    // TESTE 3: Modo Seguro (Commit-Reveal)
    console.log("\n--- MODO SEGURO (Commit-Reveal) ---\n");
    
    // Gerar secret aleatório
    const secret = ethers.randomBytes(32);
    const secretHex = ethers.hexlify(secret);
    console.log("1. Secret gerado:", secretHex.slice(0, 20) + "...");
    
    // Commit
    console.log("2. Fazendo commit (3 números)...");
    const commitTx = await wrapper.commitRequest(secretHex, 3);
    const commitReceipt = await commitTx.wait();
    
    // Extrair requestId do evento
    const commitEvent = commitReceipt.logs[0];
    const requestId = commitEvent.topics[2];
    console.log("   RequestId:", requestId.slice(0, 20) + "...");
    console.log("   Block:", commitReceipt.blockNumber);
    console.log("   Gas:", commitReceipt.gasUsed.toString());
    
    // Aguardar blocos
    console.log("\n3. Aguardando 3 blocos...");
    const startBlock = commitReceipt.blockNumber;
    
    while (true) {
        const currentBlock = await ethers.provider.getBlockNumber();
        const waited = currentBlock - startBlock;
        process.stdout.write(`\r   Blocos esperados: ${waited}/3`);
        if (waited >= 3) break;
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log("\n   OK!");
    
    // Reveal
    console.log("\n4. Fazendo reveal...");
    try {
        const revealTx = await wrapper.revealRequest(
            requestId,
            secretHex,
            [1, 1, 1],    // mins
            [10, 100, 1000] // maxs
        );
        const revealReceipt = await revealTx.wait();
        
        // Decodificar resultados
        const iface = new ethers.Interface([
            "event RandomsRevealed(address indexed requester, bytes32 indexed requestId, uint256[] results)"
        ]);
        const log = iface.parseLog({
            topics: revealReceipt.logs[0].topics,
            data: revealReceipt.logs[0].data
        });
        
        console.log("   Resultados:", log?.args.results.map((r: bigint) => Number(r)));
        console.log("   Gas:", revealReceipt.gasUsed.toString());
        console.log("\n   ✅ COMMIT-REVEAL FUNCIONOU!");
        
    } catch (e: any) {
        console.log("   ❌ Erro no reveal:", e.message?.slice(0, 100));
    }
    
    console.log("\n=== FIM DOS TESTES ===");
}

main().catch(console.error);
