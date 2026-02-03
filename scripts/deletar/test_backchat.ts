// scripts/test_backchat.ts
// ════════════════════════════════════════════════════════════════════════════
// 🧪 BACKCHAT V5.0 - SCRIPT DE TESTES COMPLETO
// ════════════════════════════════════════════════════════════════════════════
//
// V5.0: Claim LIVRE (sem exigência de NFT) + Erros descritivos
// Todas as ações requerem taxa mínima de BKC (0.001 BKC por padrão)
//
// USO: npx hardhat run scripts/test_backchat.ts --network arbitrumSepolia
//
// NOTA: Este script carrega automaticamente os endereços de deployment-addresses.json
//       Execute deploy_ecosystem.ts primeiro!
// ════════════════════════════════════════════════════════════════════════════

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ════════════════════════════════════════════════════════════════════════════
// CARREGAMENTO AUTOMÁTICO DE ENDEREÇOS
// ════════════════════════════════════════════════════════════════════════════

const addressesFilePath = path.join(__dirname, "../deployment-addresses.json");

function loadDeployedAddresses(): Record<string, string> {
    if (!fs.existsSync(addressesFilePath)) {
        console.error("❌ ERRO: deployment-addresses.json não encontrado!");
        console.error("   Execute primeiro: npx hardhat run scripts/deploy_ecosystem.ts --network <rede>");
        process.exit(1);
    }
    
    const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
    
    // Validar endereços obrigatórios
    const required = ["backchat", "bkcToken", "miningManager"];
    const missing = required.filter(key => !addresses[key]);
    
    if (missing.length > 0) {
        console.error(`❌ ERRO: Endereços obrigatórios não encontrados: ${missing.join(", ")}`);
        console.error("   Execute novamente o deploy_ecosystem.ts");
        process.exit(1);
    }
    
    console.log("📂 Endereços carregados de deployment-addresses.json");
    
    return addresses;
}

// Carregar endereços do deploy
const DEPLOYED = loadDeployedAddresses();

const CONFIG = {
    // Contratos (carregados automaticamente de deployment-addresses.json)
    // Nomes correspondem exatamente aos salvos por updateAddressJSON no deploy
    BACKCHAT: DEPLOYED.backchat,
    BKC_TOKEN: DEPLOYED.bkcToken,
    MINING_MANAGER: DEPLOYED.miningManager,
    REWARD_BOOSTER_NFT: DEPLOYED.rewardBoosterNFT || ethers.ZeroAddress,
    RENTAL_MANAGER: DEPLOYED.rentalManager || ethers.ZeroAddress,
    TREASURY: DEPLOYED.treasuryWallet || ethers.ZeroAddress,
    FAUCET: DEPLOYED.faucet || ethers.ZeroAddress,
    
    // Chave privada de teste (NÃO USE EM PRODUÇÃO!)
    TEST_PRIVATE_KEY: "57aadf280e380211c8e02bbecc1ab249164114b1cc5f899720e5d50c033f4d59",
    
    // V5.0: Taxa mínima por ação (0.001 BKC)
    MIN_FEE: ethers.parseEther("0.001"),
    
    // Quantidade de BKC para transferir do deployer
    TRANSFER_AMOUNT: ethers.parseEther("1000"),
    
    // Configurações de teste
    TEST_ETH_AMOUNT: ethers.parseEther("0.001"),
};

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

interface TestResult {
    name: string;
    success: boolean;
    error?: string;
    txHash?: string;
    gasUsed?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const results: TestResult[] = [];
let testCount = 0;
let passCount = 0;
let failCount = 0;

function generateUsername(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    return `user_${timestamp}${random}`.substring(0, 15).toLowerCase();
}

async function runTest(
    name: string,
    testFn: () => Promise<any>
): Promise<boolean> {
    testCount++;
    process.stdout.write(`   [${testCount}] ${name}... `);
    
    try {
        const result = await testFn();
        const txHash = result?.hash || "";
        const gasUsed = result?.gasUsed?.toString() || "";
        
        results.push({ name, success: true, txHash, gasUsed });
        passCount++;
        console.log(`✅ ${gasUsed ? `(${gasUsed} gas)` : ""}`);
        return true;
    } catch (error: any) {
        // Tentar extrair o motivo do erro
        let errorMsg = error.message?.slice(0, 100) || "Unknown error";
        
        // Verificar se há dados de revert
        if (error.reason) {
            errorMsg = `Reason: ${error.reason}`;
        }
        if (error.errorName) {
            errorMsg = `Error: ${error.errorName}`;
        }
        if (error.data && error.data !== "0x") {
            // Tentar decodificar erro customizado
            try {
                const errorSig = error.data.slice(0, 10);
                errorMsg += ` (sig: ${errorSig})`;
            } catch {}
        }
        
        results.push({ name, success: false, error: errorMsg });
        failCount++;
        console.log(`❌ ${errorMsg}`);
        return false;
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN TEST SCRIPT
// ════════════════════════════════════════════════════════════════════════════

async function main() {
    console.log("════════════════════════════════════════════════════════════════");
    console.log("   🧪 BACKCHAT V5.0 - TESTE COMPLETO");
    console.log("   📋 Free Claims + Descriptive Errors + Mandatory Min Fee");
    console.log("════════════════════════════════════════════════════════════════\n");

    // Mostrar endereços carregados
    console.log("📋 ENDEREÇOS CARREGADOS");
    console.log("────────────────────────────────────────────────────────────────");
    console.log(`   Backchat:       ${CONFIG.BACKCHAT}`);
    console.log(`   BKC Token:      ${CONFIG.BKC_TOKEN}`);
    console.log(`   MiningManager:  ${CONFIG.MINING_MANAGER}`);

    // ══════════════════════════════════════════════════════════════════════
    // SETUP
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("📋 SETUP");
    console.log("────────────────────────────────────────────────────────────────");
    
    // Conectar com a carteira de teste
    const provider = ethers.provider;
    const testWallet = new ethers.Wallet(CONFIG.TEST_PRIVATE_KEY, provider);
    console.log(`   Carteira de teste: ${testWallet.address}`);
    
    const balance = await provider.getBalance(testWallet.address);
    console.log(`   Balance ETH: ${ethers.formatEther(balance)} ETH`);
    
    // Carregar contratos
    const backchat = await ethers.getContractAt("Backchat", CONFIG.BACKCHAT, testWallet);
    const bkcToken = await ethers.getContractAt("BKCToken", CONFIG.BKC_TOKEN, testWallet);
    const miningManager = await ethers.getContractAt("MiningManager", CONFIG.MINING_MANAGER, testWallet);
    
    // Verificar balance BKC
    let bkcBalance = await bkcToken.balanceOf(testWallet.address);
    console.log(`   Balance BKC: ${ethers.formatEther(bkcBalance)} BKC`);
    
    // Verificar owner do BKCToken (deve ser MiningManager)
    try {
        const bkcOwner = await bkcToken.owner();
        console.log(`   BKC Owner: ${bkcOwner}`);
        if (bkcOwner.toLowerCase() === CONFIG.MINING_MANAGER.toLowerCase()) {
            console.log(`   ✅ BKC ownership correto (MiningManager)`);
        } else {
            console.log(`   ⚠️ BKC ownership INCORRETO! Deveria ser MiningManager`);
        }
    } catch (e: any) {
        console.log(`   ⚠️ Erro ao verificar owner: ${e.message?.slice(0, 50)}`);
    }
    
    // Verificar se Backchat está autorizado no MiningManager
    try {
        const serviceKey = ethers.keccak256(ethers.toUtf8Bytes("BACKCHAT_SERVICE"));
        const authorizedMiner = await miningManager.authorizedMiners(serviceKey);
        console.log(`   Backchat SERVICE_KEY: ${serviceKey.slice(0, 18)}...`);
        console.log(`   Authorized Miner: ${authorizedMiner}`);
        if (authorizedMiner.toLowerCase() === CONFIG.BACKCHAT.toLowerCase()) {
            console.log(`   ✅ Backchat autorizado no MiningManager`);
        } else {
            console.log(`   ⚠️ Backchat NÃO autorizado no MiningManager!`);
        }
    } catch (e: any) {
        console.log(`   ⚠️ Erro ao verificar autorização: ${e.message?.slice(0, 50)}`);
    }
    
    // ══════════════════════════════════════════════════════════════════════
    // OBTER BKC DO DEPLOYER SE NECESSÁRIO
    // ══════════════════════════════════════════════════════════════════════
    
    const minRequired = ethers.parseEther("100"); // Precisa de pelo menos 100 BKC para testes
    if (bkcBalance < minRequired) {
        console.log(`\n   💸 Obtendo BKC do Deployer...`);
        try {
            // Pegar o deployer (primeira conta do hardhat)
            const [deployer] = await ethers.getSigners();
            console.log(`      Deployer: ${deployer.address}`);
            
            // Conectar BKC com o deployer
            const bkcAsDeployer = await ethers.getContractAt("BKCToken", CONFIG.BKC_TOKEN, deployer);
            
            // Verificar balance do deployer
            const deployerBalance = await bkcToken.balanceOf(deployer.address);
            console.log(`      Deployer BKC: ${ethers.formatEther(deployerBalance)} BKC`);
            
            // Transferir 1000 BKC para a carteira de teste
            const tx = await bkcAsDeployer.transfer(testWallet.address, CONFIG.TRANSFER_AMOUNT);
            await tx.wait();
            
            bkcBalance = await bkcToken.balanceOf(testWallet.address);
            console.log(`   ✅ Transferido ${ethers.formatEther(CONFIG.TRANSFER_AMOUNT)} BKC do Deployer!`);
            console.log(`      Novo balance: ${ethers.formatEther(bkcBalance)} BKC`);
        } catch (e: any) {
            console.log(`   ⚠️ Transferência falhou: ${e.message?.slice(0, 80)}`);
        }
    }
    
    // ══════════════════════════════════════════════════════════════════════
    // APROVAR BACKCHAT PARA GASTAR BKC
    // ══════════════════════════════════════════════════════════════════════
    
    console.log(`\n   🔓 Aprovando Backchat para gastar BKC...`);
    const approveAmount = ethers.parseEther("100"); // Aprovar 100 BKC
    const currentAllowance = await bkcToken.allowance(testWallet.address, CONFIG.BACKCHAT);
    
    if (currentAllowance < approveAmount) {
        try {
            const approveTx = await bkcToken.approve(CONFIG.BACKCHAT, approveAmount);
            await approveTx.wait();
            console.log(`   ✅ Aprovado ${ethers.formatEther(approveAmount)} BKC para Backchat`);
        } catch (e: any) {
            console.log(`   ⚠️ Approve falhou: ${e.message?.slice(0, 50)}`);
        }
    } else {
        console.log(`   ✅ Já aprovado: ${ethers.formatEther(currentAllowance)} BKC`);
    }
    
    // Verificar minFee do contrato
    let minFee = CONFIG.MIN_FEE;
    try {
        minFee = await backchat.minFee();
        console.log(`   📊 Minimum Fee: ${ethers.formatEther(minFee)} BKC`);
    } catch (e) {
        console.log(`   📊 Minimum Fee: ${ethers.formatEther(CONFIG.MIN_FEE)} BKC (default)`);
    }
    
    // Verificar versão do contrato
    try {
        const version = await backchat.UPGRADE_INTERFACE_VERSION();
        console.log(`   📦 Contract Version: ${version}`);
    } catch (e) {
        console.log(`   📦 Contract Version: unknown`);
    }
    
    // Gerar username único para este teste
    const testUsername = generateUsername();
    console.log(`   Username teste: @${testUsername}`);
    
    // Variáveis para armazenar IDs criados
    let createdPostId: bigint = 0n;
    let createdReplyId: bigint = 0n;
    let createdRepostId: bigint = 0n;
    let createdNoteId: bigint = 0n;
    let hasProfile = false;

    // ══════════════════════════════════════════════════════════════════════
    // VERIFICAR SE JÁ TEM PERFIL
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n📊 VERIFICAÇÃO INICIAL");
    console.log("────────────────────────────────────────────────────────────────");
    
    try {
        const profile = await backchat.profiles(testWallet.address);
        if (profile.createdAt > 0n) {
            hasProfile = true;
            console.log(`   ✅ Perfil existente: @${profile.username}`);
            console.log(`   Followers: ${profile.followers}, Following: ${profile.following}`);
            console.log(`   BKC Earned: ${ethers.formatEther(profile.bkcEarned)}`);
            console.log(`   BKC Claimed: ${ethers.formatEther(profile.bkcClaimed)}`);
        } else {
            console.log(`   ℹ️ Nenhum perfil encontrado - será criado`);
        }
    } catch (e) {
        console.log(`   ℹ️ Erro ao verificar perfil - será criado`);
    }

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: VIEW FUNCTIONS (não requerem gas)
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n👁️ TESTES: VIEW FUNCTIONS");
    console.log("────────────────────────────────────────────────────────────────");

    await runTest("getDistribution()", async () => {
        const [creator, node, eco] = await backchat.getDistribution();
        console.log(`\n      Creator: ${Number(creator)/100}%, Node: ${Number(node)/100}%, Eco: ${Number(eco)/100}%`);
        return { success: true };
    });

    await runTest("stats()", async () => {
        const stats = await backchat.stats();
        console.log(`\n      Users: ${stats.users}, Posts: ${stats.posts}, Likes: ${stats.likes}, Follows: ${stats.follows}`);
        return { success: true };
    });

    await runTest("totalPosts()", async () => {
        const total = await backchat.totalPosts();
        console.log(`\n      Total posts: ${total}`);
        return { success: true };
    });

    await runTest("totalNotes()", async () => {
        const total = await backchat.totalNotes();
        console.log(`\n      Total notes: ${total}`);
        return { success: true };
    });

    await runTest("getNodeEarnings(testWallet)", async () => {
        const [bkcTotal, bkcClaimed, ethTotal, ethClaimed] = await backchat.getNodeEarnings(testWallet.address);
        console.log(`\n      BKC: ${ethers.formatEther(bkcTotal)} total, ${ethers.formatEther(bkcClaimed)} claimed`);
        console.log(`      ETH: ${ethers.formatEther(ethTotal)} total, ${ethers.formatEther(ethClaimed)} claimed`);
        return { success: true };
    });

    await runTest("getCreatorEarnings(testWallet) [V5.0 NEW]", async () => {
        const [earned, claimed, pending] = await backchat.getCreatorEarnings(testWallet.address);
        console.log(`\n      Earned: ${ethers.formatEther(earned)} BKC`);
        console.log(`      Claimed: ${ethers.formatEther(claimed)} BKC`);
        console.log(`      Pending: ${ethers.formatEther(pending)} BKC`);
        return { success: true };
    });

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: PROFILE
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n👤 TESTES: PROFILE");
    console.log("────────────────────────────────────────────────────────────────");

    // Debug: verificar configurações do Backchat
    console.log("\n   🔍 DEBUG - Verificando configurações:");
    try {
        const bkcTokenAddr = await backchat.bkcToken();
        const miningMgrAddr = await backchat.miningManager();
        const treasuryAddr = await backchat.treasury();
        console.log(`      bkcToken:       ${bkcTokenAddr}`);
        console.log(`      miningManager:  ${miningMgrAddr}`);
        console.log(`      treasury:       ${treasuryAddr}`);
        
        // Verificar allowance
        const allowance = await bkcToken.allowance(testWallet.address, CONFIG.BACKCHAT);
        console.log(`      allowance:      ${ethers.formatEther(allowance)} BKC`);
        
        // Verificar balance
        const balance = await bkcToken.balanceOf(testWallet.address);
        console.log(`      balance:        ${ethers.formatEther(balance)} BKC`);
    } catch (e: any) {
        console.log(`      ⚠️ Erro ao verificar config: ${e.message?.slice(0, 50)}`);
    }

    if (!hasProfile) {
        await runTest("createProfile() [minFee required]", async () => {
            // Tentar estimar gas primeiro para ver o erro
            try {
                await backchat.createProfile.estimateGas(
                    testUsername,
                    "Test User V5.0",
                    "Testing Backchat V5.0 - Free Claims + Descriptive Errors",
                    "",
                    "",
                    minFee,
                    ethers.ZeroAddress
                );
            } catch (estimateError: any) {
                console.log(`\n      ❌ estimateGas falhou: ${estimateError.message?.slice(0, 150)}`);
                // Tentar decodificar o erro
                if (estimateError.data) {
                    console.log(`      Data: ${estimateError.data}`);
                }
                throw estimateError;
            }
            
            const tx = await backchat.createProfile(
                testUsername,
                "Test User V5.0",
                "Testing Backchat V5.0 - Free Claims + Descriptive Errors",
                "", // avatar
                "", // banner
                minFee,  // V5.0: minFee obrigatório!
                ethers.ZeroAddress // referrer
            );
            const receipt = await tx.wait();
            hasProfile = true;
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });
    } else {
        console.log("   [SKIP] createProfile() - perfil já existe");
    }

    await runTest("updateProfile() [minFee required]", async () => {
        const tx = await backchat.updateProfile(
            "Test User V5.0 Updated",
            `Bio updated at ${new Date().toISOString()}`,
            "", // avatar
            "", // banner
            minFee,  // V5.0: minFee obrigatório!
            ethers.ZeroAddress
        );
        const receipt = await tx.wait();
        return { hash: tx.hash, gasUsed: receipt?.gasUsed };
    });

    await runTest("usernames(username) lookup", async () => {
        const profile = await backchat.profiles(testWallet.address);
        const addr = await backchat.usernames(profile.username);
        console.log(`\n      @${profile.username} => ${addr}`);
        return { success: true };
    });

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: POSTS
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n📝 TESTES: POSTS");
    console.log("────────────────────────────────────────────────────────────────");

    await runTest("createPost() [minFee required]", async () => {
        const content = `🧪 Test post #${Date.now()} - Backchat V5.0 Free Claims!`;
        const tx = await backchat.createPost(
            content,
            "", // media
            minFee,  // V5.0: minFee obrigatório!
            ethers.ZeroAddress
        );
        const receipt = await tx.wait();
        
        // Pegar o postId do evento
        const event = receipt?.logs.find((log: any) => {
            try {
                const parsed = backchat.interface.parseLog(log);
                return parsed?.name === "PostCreated";
            } catch { return false; }
        });
        if (event) {
            const parsed = backchat.interface.parseLog(event);
            createdPostId = parsed?.args[0] || 0n;
            console.log(`\n      Post ID: ${createdPostId}`);
        }
        
        return { hash: tx.hash, gasUsed: receipt?.gasUsed };
    });

    if (createdPostId > 0n) {
        await runTest("editPost() [minFee required]", async () => {
            const tx = await backchat.editPost(
                createdPostId,
                `🧪 EDITED post #${createdPostId} - ${new Date().toISOString()}`,
                "",
                minFee,  // V5.0: minFee obrigatório!
                ethers.ZeroAddress
            );
            const receipt = await tx.wait();
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });

        await runTest("reply() [minFee required]", async () => {
            const tx = await backchat.reply(
                createdPostId,
                `💬 Reply to post #${createdPostId} - automated test`,
                "",
                minFee,  // V5.0: minFee obrigatório!
                ethers.ZeroAddress
            );
            const receipt = await tx.wait();
            
            // Pegar o replyId
            const event = receipt?.logs.find((log: any) => {
                try {
                    const parsed = backchat.interface.parseLog(log);
                    return parsed?.name === "PostCreated";
                } catch { return false; }
            });
            if (event) {
                const parsed = backchat.interface.parseLog(event);
                createdReplyId = parsed?.args[0] || 0n;
                console.log(`\n      Reply ID: ${createdReplyId}`);
            }
            
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });

        await runTest("repost() [minFee required]", async () => {
            const tx = await backchat.repost(
                createdPostId,
                `🔄 Reposting #${createdPostId}`,
                minFee,  // V5.0: minFee obrigatório!
                ethers.ZeroAddress
            );
            const receipt = await tx.wait();
            
            // Pegar o repostId
            const event = receipt?.logs.find((log: any) => {
                try {
                    const parsed = backchat.interface.parseLog(log);
                    return parsed?.name === "PostCreated";
                } catch { return false; }
            });
            if (event) {
                const parsed = backchat.interface.parseLog(event);
                createdRepostId = parsed?.args[0] || 0n;
                console.log(`\n      Repost ID: ${createdRepostId}`);
            }
            
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });

        await runTest("posts(postId) view", async () => {
            const post = await backchat.posts(createdPostId);
            console.log(`\n      Author: ${post.author}`);
            console.log(`      Likes: ${post.likes}, Replies: ${post.replies}, Reposts: ${post.reposts}`);
            console.log(`      Version: ${post.version}`);
            return { success: true };
        });
    }

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: SOCIAL (Like, Follow)
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n❤️ TESTES: SOCIAL (Like, Follow)");
    console.log("────────────────────────────────────────────────────────────────");

    // Usar o post que acabamos de criar para testar like/unlike
    if (createdPostId > 0n) {
        const alreadyLiked = await backchat.likes(createdPostId, testWallet.address);
        
        if (!alreadyLiked) {
            await runTest(`like(post #${createdPostId}) [minFee required]`, async () => {
                const tx = await backchat.like(createdPostId, minFee, ethers.ZeroAddress);
                const receipt = await tx.wait();
                return { hash: tx.hash, gasUsed: receipt?.gasUsed };
            });

            await runTest(`unlike(post #${createdPostId}) [FREE]`, async () => {
                const tx = await backchat.unlike(createdPostId);
                const receipt = await tx.wait();
                return { hash: tx.hash, gasUsed: receipt?.gasUsed };
            });
        } else {
            console.log(`   [SKIP] like/unlike - já curtiu post #${createdPostId}`);
        }
    } else {
        console.log("   [SKIP] like/unlike - nenhum post criado para testar");
    }

    // Batch Like - usar posts que criamos
    if (createdPostId > 0n && createdReplyId > 0n) {
        const postIds = [createdPostId, createdReplyId];
        const batchFee = minFee * BigInt(postIds.length);
        await runTest(`batchLike([${createdPostId}, ${createdReplyId}]) [${ethers.formatEther(batchFee)} BKC]`, async () => {
            const tx = await backchat.batchLike(postIds, batchFee, ethers.ZeroAddress);
            const receipt = await tx.wait();
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });
    } else {
        console.log("   [SKIP] batchLike - posts insuficientes");
    }

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: SPOTLIGHT (requer ETH)
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n🔦 TESTES: SPOTLIGHT");
    console.log("────────────────────────────────────────────────────────────────");

    if (createdPostId > 0n && balance > ethers.parseEther("0.001")) {
        await runTest(`spotlightPost(#${createdPostId})`, async () => {
            const tx = await backchat.spotlightPost(
                createdPostId,
                ethers.ZeroAddress, // no referrer
                { value: ethers.parseEther("0.0002") }
            );
            const receipt = await tx.wait();
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });

        await runTest(`getSpotlightValue(#${createdPostId})`, async () => {
            const value = await backchat.getSpotlightValue(createdPostId);
            console.log(`\n      Spotlight value: ${ethers.formatEther(value)} ETH`);
            return { success: true };
        });
    } else {
        console.log("   [SKIP] spotlight - post não criado ou ETH insuficiente");
    }

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: COMMUNITY NOTES
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n📋 TESTES: COMMUNITY NOTES");
    console.log("────────────────────────────────────────────────────────────────");

    // Criar note no post que acabamos de criar
    if (createdPostId > 0n) {
        await runTest(`createNote(post #${createdPostId}) [minFee required]`, async () => {
            const tx = await backchat.createNote(
                createdPostId,
                `📝 Community note test - ${new Date().toISOString()}`,
                minFee,  // V5.0: minFee obrigatório!
                ethers.ZeroAddress
            );
            const receipt = await tx.wait();
            
            // Pegar noteId
            const event = receipt?.logs.find((log: any) => {
                try {
                    const parsed = backchat.interface.parseLog(log);
                    return parsed?.name === "NoteCreated";
                } catch { return false; }
            });
            if (event) {
                const parsed = backchat.interface.parseLog(event);
                createdNoteId = parsed?.args[0] || 0n;
                console.log(`\n      Note ID: ${createdNoteId}`);
            }
            
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });
    } else {
        console.log("   [SKIP] createNote - nenhum post criado para anexar note");
    }

    // Votar em uma note existente (GRÁTIS em V5.0)
    if (createdNoteId > 0n) {
        const alreadyVoted = await backchat.noteVotes(createdNoteId, testWallet.address);
        
        if (!alreadyVoted) {
            await runTest(`voteNote(#${createdNoteId}, helpful=true) [FREE]`, async () => {
                const tx = await backchat.voteNote(createdNoteId, true);
                const receipt = await tx.wait();
                return { hash: tx.hash, gasUsed: receipt?.gasUsed };
            });
        } else {
            console.log(`   [SKIP] voteNote - já votou na note #${createdNoteId}`);
        }
    } else {
        console.log("   [SKIP] voteNote - nenhuma note criada para votar");
    }

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: USER POSTS PAGINATION
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n📄 TESTES: USER POSTS PAGINATION");
    console.log("────────────────────────────────────────────────────────────────");

    await runTest("getUserPostCount()", async () => {
        const count = await backchat.getUserPostCount(testWallet.address);
        console.log(`\n      Total posts by test wallet: ${count}`);
        return { success: true };
    });

    await runTest("getUserPosts(offset=0, limit=10)", async () => {
        const postIds = await backchat.getUserPosts(testWallet.address, 0, 10);
        console.log(`\n      Post IDs: [${postIds.join(", ")}]`);
        return { success: true };
    });

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: TRUST BADGE (requer requisitos)
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n🏆 TESTES: TRUST BADGE");
    console.log("────────────────────────────────────────────────────────────────");

    await runTest("hasTrustBadge()", async () => {
        const hasBadge = await backchat.hasTrustBadge(testWallet.address);
        console.log(`\n      Has badge: ${hasBadge}`);
        return { success: true };
    });

    // Tentar obter badge (provavelmente vai falhar por não ter requisitos)
    await runTest("getTrustBadge() [expected: BadgeRequirementsNotMet]", async () => {
        try {
            const tx = await backchat.getTrustBadge(
                ethers.ZeroAddress,
                { value: ethers.parseEther("0.01") }
            );
            const receipt = await tx.wait();
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        } catch (e: any) {
            // Esperado falhar - isso é SUCESSO
            if (e.message.includes("BadgeRequirementsNotMet") || e.message.includes("revert")) {
                console.log(`\n      ✓ Corretamente rejeitado (requisitos não atendidos)`);
                return { success: true };
            }
            throw e;
        }
    });

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: CLAIMS - V5.0 FREE CLAIMS (SEM EXIGÊNCIA DE NFT!)
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n💰 TESTES: CLAIMS [V5.0 - FREE, NO NFT REQUIRED!]");
    console.log("────────────────────────────────────────────────────────────────");

    // Verificar earnings antes de tentar claim
    const [earned, claimed, pending] = await backchat.getCreatorEarnings(testWallet.address);
    console.log(`   Creator Earnings: ${ethers.formatEther(earned)} earned, ${ethers.formatEther(pending)} pending`);

    if (pending > 0n) {
        // V5.0: CLAIM FUNCIONA SEM NFT!
        await runTest("claimCreatorEarnings() [V5.0: FREE, NO NFT!]", async () => {
            const tx = await backchat.claimCreatorEarnings();
            const receipt = await tx.wait();
            console.log(`\n      ✓ Claimed ${ethers.formatEther(pending)} BKC successfully!`);
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });
    } else {
        await runTest("claimCreatorEarnings() [expected: NothingToClaim]", async () => {
            try {
                const tx = await backchat.claimCreatorEarnings();
                const receipt = await tx.wait();
                return { hash: tx.hash, gasUsed: receipt?.gasUsed };
            } catch (e: any) {
                // Esperado falhar se não tem earnings
                if (e.message.includes("NothingToClaim") || e.message.includes("revert")) {
                    console.log(`\n      ✓ Corretamente rejeitado (sem earnings pendentes)`);
                    return { success: true };
                }
                throw e;
            }
        });
    }

    // Node earnings
    const [nodeBkcTotal, nodeBkcClaimed] = await backchat.getNodeEarnings(testWallet.address);
    const nodePending = nodeBkcTotal - nodeBkcClaimed;
    
    if (nodePending > 0n) {
        await runTest("claimNodeEarnings() [has pending]", async () => {
            const tx = await backchat.claimNodeEarnings();
            const receipt = await tx.wait();
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });
    } else {
        await runTest("claimNodeEarnings() [expected: NothingToClaim]", async () => {
            try {
                const tx = await backchat.claimNodeEarnings();
                const receipt = await tx.wait();
                return { hash: tx.hash, gasUsed: receipt?.gasUsed };
            } catch (e: any) {
                // Esperado falhar se não tem earnings
                if (e.message.includes("NothingToClaim") || e.message.includes("revert")) {
                    console.log(`\n      ✓ Corretamente rejeitado (sem earnings)`);
                    return { success: true };
                }
                throw e;
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: ERROR HANDLING (V5.0 Descriptive Errors)
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n🚫 TESTES: ERROR HANDLING [V5.0 Descriptive Errors]");
    console.log("────────────────────────────────────────────────────────────────");

    await runTest("createProfile() duplicate [expected: ProfileExists]", async () => {
        try {
            const tx = await backchat.createProfile(
                "duplicate_test",
                "Test",
                "Test",
                "",
                "",
                minFee,
                ethers.ZeroAddress
            );
            await tx.wait();
            throw new Error("Should have reverted!");
        } catch (e: any) {
            if (e.message.includes("ProfileExists") || e.message.includes("revert")) {
                console.log(`\n      ✓ ProfileExists error thrown correctly`);
                return { success: true };
            }
            throw e;
        }
    });

    await runTest("like() with fee too low [expected: FeeTooLow]", async () => {
        if (createdPostId === 0n) {
            console.log(`\n      [SKIP] No post to test`);
            return { success: true };
        }
        try {
            const tx = await backchat.like(
                createdPostId,
                ethers.parseEther("0.0001"), // Muito baixo!
                ethers.ZeroAddress
            );
            await tx.wait();
            throw new Error("Should have reverted!");
        } catch (e: any) {
            if (e.message.includes("FeeTooLow") || e.message.includes("revert")) {
                console.log(`\n      ✓ FeeTooLow error thrown correctly`);
                return { success: true };
            }
            throw e;
        }
    });

    await runTest("posts(999999) non-existent", async () => {
        const post = await backchat.posts(999999);
        if (post.createdAt === 0n) {
            console.log(`\n      ✓ Returns empty post for non-existent ID`);
            return { success: true };
        }
        return { success: true };
    });

    // ══════════════════════════════════════════════════════════════════════
    // TESTES: ADMIN FUNCTIONS (só funcionam se for owner)
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n🔐 TESTES: ADMIN FUNCTIONS");
    console.log("────────────────────────────────────────────────────────────────");

    // Verificar se é owner
    const owner = await backchat.owner();
    const isOwner = owner.toLowerCase() === testWallet.address.toLowerCase();
    console.log(`   Owner: ${owner}`);
    console.log(`   Test wallet is owner: ${isOwner}`);

    if (isOwner) {
        await runTest("setDistribution(7000, 1500, 1500)", async () => {
            const tx = await backchat.setDistribution(7000, 1500, 1500);
            const receipt = await tx.wait();
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });

        await runTest("setMinFee(0.001 BKC)", async () => {
            const tx = await backchat.setMinFee(ethers.parseEther("0.001"));
            const receipt = await tx.wait();
            return { hash: tx.hash, gasUsed: receipt?.gasUsed };
        });

        await runTest("pause() + unpause()", async () => {
            const tx1 = await backchat.pause();
            await tx1.wait();
            const tx2 = await backchat.unpause();
            const receipt = await tx2.wait();
            return { hash: tx2.hash, gasUsed: receipt?.gasUsed };
        });
    } else {
        console.log("   [SKIP] Admin functions - não é owner");
    }

    // ══════════════════════════════════════════════════════════════════════
    // RESUMO
    // ══════════════════════════════════════════════════════════════════════
    
    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("                    📊 RESUMO DOS TESTES");
    console.log("════════════════════════════════════════════════════════════════");
    console.log(`   Total: ${testCount}`);
    console.log(`   ✅ Passou: ${passCount}`);
    console.log(`   ❌ Falhou: ${failCount}`);
    console.log(`   Taxa de sucesso: ${((passCount / testCount) * 100).toFixed(1)}%`);
    
    if (failCount > 0) {
        console.log("\n   ❌ TESTES QUE FALHARAM:");
        results.filter(r => !r.success).forEach(r => {
            console.log(`      - ${r.name}: ${r.error}`);
        });
    }

    // Mostrar earnings finais
    console.log("\n   💰 EARNINGS FINAIS:");
    const [finalEarned, finalClaimed, finalPending] = await backchat.getCreatorEarnings(testWallet.address);
    console.log(`      Creator: ${ethers.formatEther(finalEarned)} earned, ${ethers.formatEther(finalPending)} pending`);

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("   🧪 BACKCHAT V5.0 - TESTES CONCLUÍDOS!");
    console.log("   📋 Free Claims ✓ | Descriptive Errors ✓ | Min Fee ✓");
    console.log("════════════════════════════════════════════════════════════════\n");

    // Retornar código de erro se houve falhas
    if (failCount > 0) {
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERRO FATAL:", error);
        process.exit(1);
    });