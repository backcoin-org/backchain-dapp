// scripts/view-messages.ts
// Visualizar todas as mensagens privadas do Backchat

import { ethers } from "hardhat";
import * as fs from "fs";

function decodeContent(content: string): string {
    if (content.startsWith("ENC:")) {
        try {
            return Buffer.from(content.substring(4), 'base64').toString('utf8');
        } catch {}
    }
    return content;
}

function formatDate(timestamp: bigint): string {
    return new Date(Number(timestamp) * 1000).toLocaleString('pt-BR');
}

function short(addr: string): string {
    return addr.substring(0, 8) + "..." + addr.substring(38);
}

async function main() {
    console.log("\n" + "═".repeat(70));
    console.log("   BACKCHAT - VISUALIZADOR DE MENSAGENS PRIVADAS");
    console.log("═".repeat(70) + "\n");

    // Carregar endereço
    const addressPath = "./deployment-addresses.json";
    if (!fs.existsSync(addressPath)) {
        console.log("❌ deployment-addresses.json não encontrado!");
        return;
    }
    
    const addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));
    const BACKCHAT_ADDRESS = addresses.backchat;
    
    if (!BACKCHAT_ADDRESS) {
        console.log("❌ Endereço do Backchat não encontrado!");
        return;
    }

    console.log("📋 Backchat:", BACKCHAT_ADDRESS);

    const backchat = await ethers.getContractAt("Backchat", BACKCHAT_ADDRESS);

    // Estatísticas
    const totals = await backchat.getTotals();
    const totalMsgs = Number(totals[3]);
    const totalConvs = Number(totals[4]);

    console.log("\n📊 Estatísticas:");
    console.log(`   Mensagens: ${totalMsgs}`);
    console.log(`   Conversas: ${totalConvs}`);

    if (totalMsgs === 0) {
        console.log("\n   ℹ️ Nenhuma mensagem encontrada");
        return;
    }

    // Listar todas as mensagens
    console.log("\n" + "═".repeat(70));
    console.log("   MENSAGENS");
    console.log("═".repeat(70));

    for (let i = 1; i <= totalMsgs; i++) {
        try {
            const msg = await backchat.getMessage(i);
            
            const sender = msg[0];
            const recipient = msg[1];
            const content = msg[2];         // encryptedContent
            const ipfsHash = msg[3];        // encryptedIpfsHash
            const timestamp = msg[4];       // sentAt
            const conversationId = msg[5];
            const replyTo = msg[6];         // parentMessageId

            const decoded = decodeContent(content);

            console.log(`\n┌─────────────────────────────────────────────────────────────────`);
            console.log(`│ 📧 Mensagem #${i} (Conversa #${conversationId})`);
            console.log(`│`);
            console.log(`│ De:      ${short(sender)}`);
            console.log(`│ Para:    ${short(recipient)}`);
            console.log(`│ Data:    ${formatDate(timestamp)}`);
            if (replyTo > 0n) {
                console.log(`│ ↩️ Resposta a: #${replyTo}`);
            }
            console.log(`│`);
            console.log(`│ 💬 Criptografado: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
            console.log(`│ 🔓 Decodificado:  "${decoded}"`);
            if (ipfsHash && ipfsHash.length > 0) {
                console.log(`│ 📎 IPFS: ${ipfsHash}`);
            }
            console.log(`└─────────────────────────────────────────────────────────────────`);

        } catch (e: any) {
            console.log(`\n❌ Mensagem #${i}: erro`);
        }
    }

    // Resumo por conversa
    console.log("\n" + "═".repeat(70));
    console.log("   RESUMO POR CONVERSA");
    console.log("═".repeat(70));

    const [deployer] = await ethers.getSigners();
    const convs = await backchat.getUserConversations(deployer.address);
    
    for (const convId of convs) {
        const msgIds = await backchat.getConversationMessages(convId);
        console.log(`\n📁 Conversa #${convId}: ${msgIds.length} mensagens`);
        console.log(`   IDs: ${msgIds.map((m: any) => m.toString()).join(', ')}`);
    }

    console.log("\n" + "═".repeat(70));
    console.log(`   Total: ${totalMsgs} mensagens em ${totalConvs} conversas`);
    console.log("═".repeat(70) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERRO:", error);
        process.exit(1);
    });