// scripts/test-backchat-full.ts
// Teste completo com 2 contas - lê endereço do deployment-addresses.json

import { ethers } from "hardhat";
import * as fs from "fs";

// Segunda carteira de teste (testnet apenas!)
const WALLET2_PRIVATE_KEY = "0x57aadf280e380211c8e02bbecc1ab249164114b1cc5f899720e5d50c033f4d59";

function generateText(size: number, prefix: string = ""): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
    let result = prefix ? prefix + " " : "";
    for (let i = result.length; i < size; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result.substring(0, size);
}

async function main() {
    console.log("\n" + "═".repeat(80));
    console.log("   BACKCHAT - TESTE COMPLETO DE ESTRESSE");
    console.log("   Posts, Comentários, Gorjetas, Saques, Mensagens Privadas");
    console.log("═".repeat(80) + "\n");

    // Carregar endereço do arquivo
    const addressPath = "./deployment-addresses.json";
    if (!fs.existsSync(addressPath)) {
        console.log("❌ deployment-addresses.json não encontrado!");
        console.log("   Execute primeiro: npx hardhat run scripts/deploy-backchat.ts --network arbitrumSepolia");
        return;
    }
    
    const addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));
    const BACKCHAT_ADDRESS = addresses.backchat;
    
    if (!BACKCHAT_ADDRESS) {
        console.log("❌ Endereço do Backchat não encontrado!");
        return;
    }

    // Setup contas
    const [deployer] = await ethers.getSigners();
    const provider = deployer.provider!;
    const wallet2 = new ethers.Wallet(WALLET2_PRIVATE_KEY, provider);
    
    console.log("👤 Conta 1 (Deploy):", deployer.address);
    console.log("👤 Conta 2 (Teste):", wallet2.address);
    console.log("📋 Backchat:", BACKCHAT_ADDRESS);

    // Conectar contratos (cast para any para evitar erros de tipagem)
    const backchat = await ethers.getContractAt("Backchat", BACKCHAT_ADDRESS) as any;
    const bkcAddress = await backchat.bkcToken();
    const bkc = await ethers.getContractAt("BKCToken", bkcAddress) as any;

    const backchat2 = backchat.connect(wallet2) as any;
    const bkc2 = bkc.connect(wallet2) as any;

    console.log("   BKC:", bkcAddress);

    // ========================================
    // SETUP - TRANSFERIR ETH E BKC
    // ========================================
    
    console.log("\n" + "─".repeat(80));
    console.log("   SETUP: VERIFICAR E TRANSFERIR");
    console.log("─".repeat(80));

    // ETH Conta 2
    let ethBal2 = await provider.getBalance(wallet2.address);
    console.log("\n   ETH Conta 2:", ethers.formatEther(ethBal2));

    if (ethBal2 < ethers.parseEther("0.001")) {
        console.log("   ⚠️ Transferindo 0.005 ETH...");
        await (await deployer.sendTransaction({ to: wallet2.address, value: ethers.parseEther("0.005") })).wait();
        console.log("   ✅ ETH transferido");
    }

    // BKC
    const bkcBal1 = await bkc.balanceOf(deployer.address);
    let bkcBal2 = await bkc.balanceOf(wallet2.address);
    console.log("\n   BKC Conta 1:", ethers.formatEther(bkcBal1));
    console.log("   BKC Conta 2:", ethers.formatEther(bkcBal2));

    if (bkcBal2 < ethers.parseEther("100")) {
        console.log("   ⚠️ Transferindo 200 BKC...");
        await (await bkc.transfer(wallet2.address, ethers.parseEther("200"))).wait();
        console.log("   ✅ BKC transferido");
    }

    // Aprovar BKC
    console.log("\n   Aprovando BKC...");
    await (await bkc.approve(BACKCHAT_ADDRESS, ethers.parseEther("500"))).wait();
    await (await bkc2.approve(BACKCHAT_ADDRESS, ethers.parseEther("200"))).wait();
    console.log("   ✅ Ambas contas aprovadas");

    // Contadores
    let totalOps = 0;
    let postIds: bigint[] = [];
    let commentIds: bigint[] = [];

    // ========================================
    // PARTE 1: POSTS
    // ========================================
    
    console.log("\n" + "─".repeat(80));
    console.log("   PARTE 1: CRIAR POSTS");
    console.log("─".repeat(80));

    const postSizes = [100, 280, 500, 1000, 2000, 5000];
    
    for (const size of postSizes) {
        try {
            const content = generateText(size, `[POST ${size}]`);
            console.log(`\n   📝 Post ${size} chars...`);
            
            const tx = await backchat.createPost(content, "");
            const receipt = await tx.wait();
            
            const event = receipt?.logs.find((log: any) => {
                try {
                    return backchat.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "PostCreated";
                } catch { return false; }
            });
            if (event) {
                const parsed = backchat.interface.parseLog({ topics: event.topics as string[], data: event.data });
                if (parsed) postIds.push(parsed.args[0]);
            }
            
            console.log(`      ✅ Gas: ${receipt?.gasUsed?.toString()}`);
            totalOps++;
        } catch (e: any) {
            console.log(`      ❌ ${e.message?.substring(0, 50)}`);
        }
    }

    // ========================================
    // PARTE 2: COMENTÁRIOS
    // ========================================
    
    console.log("\n" + "─".repeat(80));
    console.log("   PARTE 2: COMENTÁRIOS (10)");
    console.log("─".repeat(80));

    const targetPost = postIds[0] || 1n;

    for (let i = 1; i <= 10; i++) {
        try {
            const tx = await backchat.createComment(targetPost, generateText(150, `[COMMENT ${i}]`), "");
            const receipt = await tx.wait();
            
            const event = receipt?.logs.find((log: any) => {
                try {
                    return backchat.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "CommentCreated";
                } catch { return false; }
            });
            if (event) {
                const parsed = backchat.interface.parseLog({ topics: event.topics as string[], data: event.data });
                if (parsed) commentIds.push(parsed.args[0]);
            }
            totalOps++;
        } catch {}
    }
    console.log(`      ✅ ${commentIds.length} comentários criados`);

    // ========================================
    // PARTE 3: THREADING
    // ========================================
    
    console.log("\n" + "─".repeat(80));
    console.log("   PARTE 3: THREADING (5 níveis)");
    console.log("─".repeat(80));

    let parentComment = commentIds[0] || 1n;
    for (let depth = 1; depth <= 5; depth++) {
        try {
            const tx = await backchat.replyToComment(parentComment, generateText(100, `[DEPTH ${depth}]`), "");
            const receipt = await tx.wait();
            
            const event = receipt?.logs.find((log: any) => {
                try {
                    return backchat.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "CommentCreated";
                } catch { return false; }
            });
            if (event) {
                const parsed = backchat.interface.parseLog({ topics: event.topics as string[], data: event.data });
                if (parsed) parentComment = parsed.args[0];
            }
            console.log(`      ✅ Nível ${depth}`);
            totalOps++;
        } catch { break; }
    }

    // ========================================
    // PARTE 4: VOTAÇÃO
    // ========================================
    
    console.log("\n" + "─".repeat(80));
    console.log("   PARTE 4: VOTAÇÃO");
    console.log("─".repeat(80));

    let votes = 0;
    for (const postId of postIds.slice(1, 4)) {
        try {
            const hasVoted = await backchat.hasVotedOnPost(deployer.address, postId);
            if (!hasVoted) {
                await (await backchat.voteOnPost(postId, true)).wait();
                votes++;
            }
        } catch {}
    }
    console.log(`      ✅ ${votes} votos registrados`);
    totalOps += votes;

    // ========================================
    // PARTE 5: COMMUNITY NOTES
    // ========================================
    
    console.log("\n" + "─".repeat(80));
    console.log("   PARTE 5: COMMUNITY NOTES (3)");
    console.log("─".repeat(80));

    for (let i = 1; i <= 3; i++) {
        try {
            await (await backchat.proposeNote(targetPost, generateText(200, `[NOTE ${i}]`), "")).wait();
            console.log(`      ✅ Nota #${i}`);
            totalOps++;
        } catch {}
    }

    // ========================================
    // PARTE 6: GORJETAS
    // ========================================
    
    console.log("\n" + "─".repeat(80));
    console.log("   PARTE 6: GORJETAS (TIPS)");
    console.log("─".repeat(80));

    // Conta 2 cria post
    console.log("\n   Conta 2 criando post...");
    let tipPostId = 1n;
    try {
        const tx = await backchat2.createPost("🎯 Post para receber gorjetas!", "");
        const receipt = await tx.wait();
        const event = receipt?.logs.find((log: any) => {
            try {
                return backchat.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "PostCreated";
            } catch { return false; }
        });
        if (event) {
            const parsed = backchat.interface.parseLog({ topics: event.topics as string[], data: event.data });
            if (parsed) tipPostId = parsed.args[0];
        }
        console.log(`   ✅ Post #${tipPostId} criado`);
        totalOps++;
    } catch (e: any) {
        console.log(`   ❌ ${e.message?.substring(0, 50)}`);
    }

    // Saldo antes
    const balBefore = await backchat.creatorBalance(wallet2.address);
    console.log(`\n   💰 Saldo gorjetas (antes): ${ethers.formatEther(balBefore)} BKC`);

    // Enviar gorjetas
    const tips = [5, 10, 15, 20];
    for (const amount of tips) {
        try {
            console.log(`   💸 Enviando ${amount} BKC...`);
            await (await backchat.sendTip(wallet2.address, ethers.parseEther(amount.toString()), tipPostId)).wait();
            console.log(`      ✅ Enviado`);
            totalOps++;
        } catch (e: any) {
            console.log(`      ❌ ${e.message?.substring(0, 40)}`);
        }
    }

    // Saldo depois
    const balAfter = await backchat.creatorBalance(wallet2.address);
    console.log(`\n   💰 Saldo gorjetas (depois): ${ethers.formatEther(balAfter)} BKC`);

    const tipMiningFee = await backchat.tipMiningFeeBips();
    console.log(`\n   📊 Divisão: ${100 - Number(tipMiningFee)/100}% criador / ${Number(tipMiningFee)/100}% mining`);

    // ========================================
    // PARTE 7: SAQUE
    // ========================================
    
    console.log("\n" + "─".repeat(80));
    console.log("   PARTE 7: SAQUE (CLAIM REWARDS)");
    console.log("─".repeat(80));

    const creatorBal = await backchat.creatorBalance(wallet2.address);
    console.log(`\n   Disponível: ${ethers.formatEther(creatorBal)} BKC`);

    if (creatorBal > 0n) {
        const hasBooster = await backchat.hasBoosterAccess(wallet2.address);
        console.log(`   Booster NFT: ${hasBooster ? "✅" : "❌"}`);

        try {
            await (await backchat2.claimRewards()).wait();
            console.log("   ✅ SAQUE REALIZADO!");
            const newBal = await backchat.creatorBalance(wallet2.address);
            console.log(`   Novo saldo: ${ethers.formatEther(newBal)} BKC`);
            totalOps++;
        } catch (e: any) {
            if (e.message?.includes("Booster")) {
                console.log("   ❌ Booster NFT necessário para saque");
            } else {
                console.log(`   ❌ ${e.message?.substring(0, 50)}`);
            }
        }
    }

    // ========================================
    // PARTE 8: MENSAGENS PRIVADAS
    // ========================================
    
    console.log("\n" + "─".repeat(80));
    console.log("   PARTE 8: MENSAGENS PRIVADAS (E2EE)");
    console.log("─".repeat(80));

    // Registrar chaves
    console.log("\n   1️⃣ Registrando chaves E2EE...");
    try {
        const key1 = ethers.hexlify(ethers.randomBytes(32));
        const key2 = ethers.hexlify(ethers.randomBytes(32));
        
        const existing1 = await backchat.getPublicKey(deployer.address);
        if (!existing1 || existing1.length < 10) {
            await (await backchat.setPublicKey(key1)).wait();
        }
        console.log("      ✅ Conta 1");

        const existing2 = await backchat.getPublicKey(wallet2.address);
        if (!existing2 || existing2.length < 10) {
            await (await backchat2.setPublicKey(key2)).wait();
        }
        console.log("      ✅ Conta 2");
    } catch {}

    // Enviar mensagem
    console.log("\n   2️⃣ Enviando mensagem privada...");
    let msgId = 0n;
    let convId = 0n;
    try {
        const encrypted = "ENC:" + Buffer.from("Olá! Mensagem secreta! 🔐").toString('base64');
        const tx = await backchat.sendPrivateMessage(wallet2.address, encrypted, "");
        const receipt = await tx.wait();
        
        const event = receipt?.logs.find((log: any) => {
            try {
                return backchat.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "PrivateMessageSent";
            } catch { return false; }
        });
        if (event) {
            const parsed = backchat.interface.parseLog({ topics: event.topics as string[], data: event.data });
            if (parsed) {
                msgId = parsed.args[0];
                convId = parsed.args[1];
            }
        }
        console.log(`      ✅ Mensagem #${msgId} (Conversa #${convId})`);
        totalOps++;
    } catch (e: any) {
        console.log(`      ❌ ${e.message?.substring(0, 50)}`);
    }

    // Responder
    if (msgId > 0n) {
        console.log("\n   3️⃣ Conta 2 respondendo...");
        try {
            const reply = "ENC:" + Buffer.from("Recebi! Tudo OK! 👍").toString('base64');
            await (await backchat2.replyToMessage(msgId, reply, "")).wait();
            console.log("      ✅ Resposta enviada");
            totalOps++;
        } catch {}
    }

    // Mais mensagens
    console.log("\n   4️⃣ Enviando mais 3 mensagens...");
    for (let i = 1; i <= 3; i++) {
        try {
            const content = "ENC:" + generateText(100, `[MSG ${i}]`);
            await (await backchat.sendPrivateMessage(wallet2.address, content, "")).wait();
            totalOps++;
        } catch {}
    }
    console.log("      ✅ Mensagens enviadas");

    // ========================================
    // PARTE 9: VER MENSAGENS
    // ========================================
    
    console.log("\n" + "─".repeat(80));
    console.log("   PARTE 9: VERIFICAR MENSAGENS");
    console.log("─".repeat(80));

    const totals = await backchat.getTotals();
    const totalMsgs = Number(totals[3]);
    
    console.log(`\n   Total de mensagens: ${totalMsgs}`);
    
    for (let i = 1; i <= Math.min(totalMsgs, 5); i++) {
        try {
            const msg = await backchat.getMessage(i);
            const content = msg[2]; // encryptedContent
            let decoded = content;
            if (content.startsWith("ENC:")) {
                try {
                    decoded = Buffer.from(content.substring(4), 'base64').toString('utf8');
                } catch {}
            }
            console.log(`\n   📧 Mensagem #${i}:`);
            console.log(`      De: ${msg[0].substring(0, 10)}...`); // sender
            console.log(`      Para: ${msg[1].substring(0, 10)}...`); // recipient
            console.log(`      Conteúdo: "${decoded.substring(0, 50)}${decoded.length > 50 ? '...' : ''}"`);
        } catch {}
    }

    // ========================================
    // ESTATÍSTICAS FINAIS
    // ========================================
    
    console.log("\n" + "═".repeat(80));
    console.log("   📊 ESTATÍSTICAS FINAIS");
    console.log("═".repeat(80));

    const finalTotals = await backchat.getTotals();
    const financials = await backchat.getFinancialStats();

    console.log("\n   📈 Totais:");
    console.log(`      Posts:       ${finalTotals[0].toString()}`);
    console.log(`      Comentários: ${finalTotals[1].toString()}`);
    console.log(`      Notas:       ${finalTotals[2].toString()}`);
    console.log(`      Mensagens:   ${finalTotals[3].toString()}`);
    console.log(`      Conversas:   ${finalTotals[4].toString()}`);

    console.log("\n   💰 Financeiro:");
    console.log(`      Platform Fees: ${ethers.formatEther(financials[0])} BKC`);
    console.log(`      Tips Total:    ${ethers.formatEther(financials[1])} BKC`);
    console.log(`      Tips Criador:  ${ethers.formatEther(financials[2])} BKC`);
    console.log(`      Tips Mining:   ${ethers.formatEther(financials[3])} BKC`);

    console.log("\n   🎯 Operações: " + totalOps);

    console.log("\n" + "═".repeat(80));
    console.log("   ✅ TESTE COMPLETO!");
    console.log("═".repeat(80));
    console.log(`\n   🔗 Arbiscan: https://sepolia.arbiscan.io/address/${BACKCHAT_ADDRESS}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERRO:", error);
        process.exit(1);
    });