// scripts/test_stylus_oracle.ts
// ✅ STYLUS RANDOMNESS ORACLE TEST SCRIPT
// Uso: npx hardhat run scripts/test_stylus_oracle.ts --network arbitrumSepolia

import { ethers } from "hardhat";

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// Endereço do contrato Stylus deployado
const ORACLE_ADDRESS = "0x7d4529bea4fad20e31553f76d3bad189d048c616";

// ABI do RandomnessOracle (apenas as funções que vamos testar)
const ORACLE_ABI = [
    "function initialize() external",
    "function get_random(uint256 min, uint256 max) external returns (uint256)",
    "function get_counter() external view returns (uint256)",
    "function get_seed() external view returns (uint256)",
    "function get_owner() external view returns (address)"
];

// Colors for console
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GRAY = "\x1b[90m";

function success(msg: string) { console.log(`${GREEN}✅ ${msg}${RESET}`); }
function error(msg: string) { console.log(`${RED}❌ ${msg}${RESET}`); }
function warning(msg: string) { console.log(`${YELLOW}⚠️  ${msg}${RESET}`); }
function info(msg: string) { console.log(`${CYAN}ℹ️  ${msg}${RESET}`); }
function header(msg: string) { console.log(`\n${BOLD}${CYAN}${"═".repeat(60)}\n${msg}\n${"═".repeat(60)}${RESET}`); }
function subheader(msg: string) { console.log(`\n${BOLD}📋 ${msg}${RESET}`); }
function result(name: string, value: any) { console.log(`${GRAY}   ${name}: ${RESET}${value}`); }

async function main() {
    const [signer] = await ethers.getSigners();
    
    console.log(`\n${BOLD}${CYAN}`);
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║       STYLUS RANDOMNESS ORACLE - DIAGNOSTIC TOOL           ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log(RESET);
    
    info(`Signer: ${signer.address}`);
    info(`Oracle: ${ORACLE_ADDRESS}`);
    
    const balance = await ethers.provider.getBalance(signer.address);
    info(`ETH Balance: ${ethers.formatEther(balance)} ETH`);
    
    let passed = 0;
    let failed = 0;
    
    // Conectar ao contrato
    const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, signer);
    
    // ========================================================================
    // 1. VERIFICAR CÓDIGO DO CONTRATO
    // ========================================================================
    header("1. VERIFICAÇÃO DO CONTRATO");
    
    const code = await ethers.provider.getCode(ORACLE_ADDRESS);
    if (code.length > 10) {
        success(`Contrato existe (${code.length} bytes)`);
        passed++;
    } else {
        error("Contrato não encontrado!");
        failed++;
        return;
    }
    
    // ========================================================================
    // 2. VIEW FUNCTIONS (sem parâmetros)
    // ========================================================================
    header("2. VIEW FUNCTIONS (sem parâmetros)");
    
    // get_owner()
    subheader("get_owner()");
    try {
        const owner = await oracle.get_owner();
        success(`get_owner() = ${owner}`);
        result("Owner", owner);
        passed++;
    } catch (e: any) {
        error(`get_owner() FAILED: ${e.reason || e.shortMessage || e.message?.slice(0, 80)}`);
        failed++;
    }
    
    // get_counter()
    subheader("get_counter()");
    try {
        const counter = await oracle.get_counter();
        success(`get_counter() = ${counter}`);
        result("Counter", counter.toString());
        passed++;
    } catch (e: any) {
        error(`get_counter() FAILED: ${e.reason || e.shortMessage || e.message?.slice(0, 80)}`);
        failed++;
    }
    
    // get_seed()
    subheader("get_seed()");
    try {
        const seed = await oracle.get_seed();
        success(`get_seed() = ${seed}`);
        result("Seed", seed.toString());
        passed++;
    } catch (e: any) {
        error(`get_seed() FAILED: ${e.reason || e.shortMessage || e.message?.slice(0, 80)}`);
        failed++;
    }
    
    // ========================================================================
    // 3. MUTABLE FUNCTION: get_random()
    // ========================================================================
    header("3. MUTABLE FUNCTION: get_random()");
    
    subheader("Testando get_random(1, 100)...");
    try {
        // Primeiro tenta staticCall para ver se funciona
        info("Tentando staticCall...");
        const randomStatic = await oracle.get_random.staticCall(1n, 100n);
        success(`staticCall SUCCESS: ${randomStatic}`);
        passed++;
        
        // Se staticCall funcionou, executa a transação real
        info("Executando transação real...");
        const tx = await oracle.get_random(1n, 100n, { gasLimit: 300000 });
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            success(`Transação SUCCESS!`);
            result("TX Hash", receipt.hash);
            result("Gas Used", receipt.gasUsed.toString());
            passed++;
        } else {
            error(`Transação FAILED (status=0)`);
            failed++;
        }
        
    } catch (e: any) {
        error(`get_random() FAILED: ${e.reason || e.shortMessage || e.message?.slice(0, 100)}`);
        failed++;
        
        // Tentar ver mais detalhes do erro
        if (e.data) {
            warning(`Error data: ${e.data}`);
        }
    }
    
    // ========================================================================
    // 4. VERIFICAR COUNTER APÓS get_random()
    // ========================================================================
    header("4. VERIFICAR ESTADO APÓS get_random()");
    
    subheader("get_counter() após chamada");
    try {
        const counterAfter = await oracle.get_counter();
        info(`Counter após: ${counterAfter}`);
        
        if (counterAfter > 0n) {
            success("Counter foi incrementado!");
            passed++;
        } else {
            warning("Counter ainda é 0 (get_random pode ter falhado)");
        }
    } catch (e: any) {
        error(`get_counter() FAILED: ${e.message?.slice(0, 80)}`);
        failed++;
    }
    
    subheader("get_seed() após chamada");
    try {
        const seedAfter = await oracle.get_seed();
        info(`Seed após: ${seedAfter}`);
    } catch (e: any) {
        error(`get_seed() FAILED: ${e.message?.slice(0, 80)}`);
    }
    
    // ========================================================================
    // 5. MÚLTIPLAS CHAMADAS (verificar aleatoriedade)
    // ========================================================================
    header("5. TESTE DE ALEATORIEDADE");
    
    subheader("Gerando 5 números aleatórios (1-100)...");
    
    const randoms: bigint[] = [];
    for (let i = 0; i < 5; i++) {
        try {
            const tx = await oracle.get_random(1n, 100n, { gasLimit: 300000 });
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                // Ler o counter para ter uma ideia do progresso
                const counter = await oracle.get_counter();
                info(`Chamada ${i + 1}: Counter = ${counter}`);
            } else {
                warning(`Chamada ${i + 1}: FAILED`);
            }
        } catch (e: any) {
            error(`Chamada ${i + 1}: ${e.reason || e.shortMessage || "FAILED"}`);
            break;
        }
    }
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    header("RESUMO DO DIAGNÓSTICO");
    
    console.log(`\n${GREEN}   Passou: ${passed}${RESET}`);
    console.log(`${RED}   Falhou: ${failed}${RESET}\n`);
    
    if (failed === 0) {
        console.log(`${GREEN}${BOLD}🎉 TODOS OS TESTES PASSARAM!${RESET}`);
        console.log(`${GREEN}   O RandomnessOracle está funcionando corretamente.${RESET}\n`);
    } else {
        console.log(`${RED}${BOLD}❌ ALGUNS TESTES FALHARAM${RESET}`);
        console.log(`${YELLOW}   Verifique os erros acima para mais detalhes.${RESET}`);
        
        console.log(`\n${YELLOW}Possíveis causas:${RESET}`);
        console.log("1. Contrato não foi inicializado (chamar initialize())");
        console.log("2. Bug no Stylus SDK com block:: functions");
        console.log("3. Problema com operador módulo (%) no Stylus");
        console.log("4. Gas insuficiente\n");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });