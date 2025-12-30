// scripts/fund_faucet.ts
// ✅ Script para financiar o SimpleBKCFaucet
//
// Valores por claim:
// - BKC: 1,000 tokens por claim
// - ETH: 0.01 ETH por claim
//
// Transferência:
// - BKC: 200,000 BKC (200 claims)
// - ETH: 2.1 ETH (210 claims)
//
// Uso: npx hardhat run scripts/fund_faucet.ts --network arbitrumSepolia

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
    // Valores a transferir para o Faucet
    BKC_TO_SEND: "200000",   // 200,000 BKC
    ETH_TO_SEND: "2.1",      // 2.1 ETH
    
    // Valores por claim (para referência)
    BKC_PER_CLAIM: 1000,     // 1,000 BKC por claim
    ETH_PER_CLAIM: 0.01,     // 0.01 ETH por claim
};

// ============================================================================
// HELPERS
// ============================================================================

function loadAddresses(): Record<string, string> {
    const possiblePaths = [
        path.join(__dirname, "../deployment-addresses.json"),
        path.join(process.cwd(), "deployment-addresses.json")
    ];
    
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log(`📁 Carregando endereços de: ${p}`);
            return JSON.parse(fs.readFileSync(p, "utf8"));
        }
    }
    throw new Error("deployment-addresses.json não encontrado!");
}

// Cores para output
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function success(msg: string) { console.log(`${GREEN}✅ ${msg}${RESET}`); }
function error(msg: string) { console.log(`${RED}❌ ${msg}${RESET}`); }
function info(msg: string) { console.log(`${CYAN}ℹ️  ${msg}${RESET}`); }

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    const [deployer] = await ethers.getSigners();
    const ADDRESSES = loadAddresses();
    
    console.log(`\n${BOLD}${CYAN}`);
    console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
    console.log("║              BACKCOIN FAUCET FUNDING SCRIPT                               ║");
    console.log("║         200,000 BKC + 2.1 ETH → 200 claims de 1000 BKC + 0.01 ETH        ║");
    console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
    console.log(RESET);
    
    // Endereços
    const FAUCET_ADDRESS = ADDRESSES.faucet;
    const BKC_ADDRESS = ADDRESSES.bkcToken;
    
    if (!FAUCET_ADDRESS) {
        throw new Error("Endereço do Faucet não encontrado em deployment-addresses.json");
    }
    if (!BKC_ADDRESS) {
        throw new Error("Endereço do BKC Token não encontrado em deployment-addresses.json");
    }
    
    info(`Deployer: ${deployer.address}`);
    info(`Faucet: ${FAUCET_ADDRESS}`);
    info(`BKC Token: ${BKC_ADDRESS}`);
    
    console.log(`\n${BOLD}📊 Valores a transferir:${RESET}`);
    console.log(`   📦 BKC: ${Number(CONFIG.BKC_TO_SEND).toLocaleString()} tokens`);
    console.log(`   ⛽ ETH: ${CONFIG.ETH_TO_SEND} ETH`);
    console.log(`\n${BOLD}📊 Valores por claim:${RESET}`);
    console.log(`   📦 BKC: ${CONFIG.BKC_PER_CLAIM.toLocaleString()} tokens`);
    console.log(`   ⛽ ETH: ${CONFIG.ETH_PER_CLAIM} ETH`);
    
    // Carregar contratos
    const bkc = await ethers.getContractAt("BKCToken", BKC_ADDRESS);
    
    // Verificar saldos do deployer
    console.log(`\n${BOLD}💰 Saldos do Deployer:${RESET}`);
    const deployerEthBalance = await ethers.provider.getBalance(deployer.address);
    const deployerBkcBalance = await bkc.balanceOf(deployer.address);
    
    console.log(`   ETH: ${ethers.formatEther(deployerEthBalance)} ETH`);
    console.log(`   BKC: ${Number(ethers.formatEther(deployerBkcBalance)).toLocaleString()} BKC`);
    
    // Verificar saldos atuais do Faucet
    console.log(`\n${BOLD}🚰 Saldos ANTES do Faucet:${RESET}`);
    const faucetEthBefore = await ethers.provider.getBalance(FAUCET_ADDRESS);
    const faucetBkcBefore = await bkc.balanceOf(FAUCET_ADDRESS);
    
    console.log(`   ETH: ${ethers.formatEther(faucetEthBefore)} ETH`);
    console.log(`   BKC: ${Number(ethers.formatEther(faucetBkcBefore)).toLocaleString()} BKC`);
    
    // Valores a enviar
    const bkcToSend = ethers.parseEther(CONFIG.BKC_TO_SEND);
    const ethToSend = ethers.parseEther(CONFIG.ETH_TO_SEND);
    
    // Verificar se deployer tem saldo suficiente
    if (deployerBkcBalance < bkcToSend) {
        error(`Saldo insuficiente de BKC! Necessário: ${CONFIG.BKC_TO_SEND}, Disponível: ${ethers.formatEther(deployerBkcBalance)}`);
        return;
    }
    
    const ethForGas = ethers.parseEther("0.01"); // Reserva para gas
    if (deployerEthBalance < ethToSend + ethForGas) {
        error(`Saldo insuficiente de ETH! Necessário: ${Number(CONFIG.ETH_TO_SEND) + 0.01}, Disponível: ${ethers.formatEther(deployerEthBalance)}`);
        return;
    }
    
    // Transferir BKC
    console.log(`\n${BOLD}📦 Transferindo ${CONFIG.BKC_TO_SEND} BKC...${RESET}`);
    try {
        const bkcTx = await bkc.transfer(FAUCET_ADDRESS, bkcToSend, { gasLimit: 100000 });
        console.log(`   TX enviada: ${bkcTx.hash}`);
        
        const bkcReceipt = await bkcTx.wait();
        success(`BKC transferido! Gas usado: ${bkcReceipt!.gasUsed.toString()}`);
        console.log(`   📜 TX Hash: ${bkcReceipt!.hash}`);
    } catch (e: any) {
        error(`Falha ao transferir BKC: ${e.message?.slice(0, 100)}`);
        return;
    }
    
    // Transferir ETH
    console.log(`\n${BOLD}⛽ Transferindo ${CONFIG.ETH_TO_SEND} ETH...${RESET}`);
    try {
        const ethTx = await deployer.sendTransaction({
            to: FAUCET_ADDRESS,
            value: ethToSend,
            gasLimit: 50000
        });
        console.log(`   TX enviada: ${ethTx.hash}`);
        
        const ethReceipt = await ethTx.wait();
        success(`ETH transferido! Gas usado: ${ethReceipt!.gasUsed.toString()}`);
        console.log(`   📜 TX Hash: ${ethReceipt!.hash}`);
    } catch (e: any) {
        error(`Falha ao transferir ETH: ${e.message?.slice(0, 100)}`);
        return;
    }
    
    // Verificar saldos finais
    console.log(`\n${BOLD}✅ Saldos DEPOIS do Faucet:${RESET}`);
    const faucetEthAfter = await ethers.provider.getBalance(FAUCET_ADDRESS);
    const faucetBkcAfter = await bkc.balanceOf(FAUCET_ADDRESS);
    
    console.log(`   ETH: ${ethers.formatEther(faucetEthAfter)} ETH`);
    console.log(`   BKC: ${Number(ethers.formatEther(faucetBkcAfter)).toLocaleString()} BKC`);
    
    // Calcular capacidade
    const possibleBkcClaims = Number(ethers.formatEther(faucetBkcAfter)) / CONFIG.BKC_PER_CLAIM;
    const possibleEthClaims = Number(ethers.formatEther(faucetBkcAfter)) / CONFIG.ETH_PER_CLAIM;
    const maxClaims = Math.floor(Math.min(possibleBkcClaims, possibleEthClaims));
    
    console.log(`\n${BOLD}📊 Capacidade do Faucet:${RESET}`);
    console.log(`   Claims possíveis (BKC): ${Math.floor(possibleBkcClaims).toLocaleString()}`);
    console.log(`   Claims possíveis (ETH): ${Math.floor(possibleEthClaims).toLocaleString()}`);
    console.log(`\n${GREEN}${BOLD}🎉 Total de claims suportados: ${maxClaims.toLocaleString()}${RESET}`);
    
    console.log(`\n${BOLD}📋 Resumo:${RESET}`);
    console.log(`   Cada usuário receberá: ${CONFIG.BKC_PER_CLAIM.toLocaleString()} BKC + ${CONFIG.ETH_PER_CLAIM} ETH`);
    console.log(`   Faucet pode atender: ${maxClaims.toLocaleString()} usuários\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });