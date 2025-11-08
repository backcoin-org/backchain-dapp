// scripts/run_master.ts
import hre from "hardhat";

// IMPORTAR AS NOVAS FUNÇÕES EXPORTADAS DE CADA ARQUIVO (usando o nome 'runScript' que ajustamos em todos eles)
import { runScript as run0_faucet_test_supply } from "./0_faucet_test_supply";
import { runScript as run1_deploy_core } from "./1_deploy_core";
import { runScript as run2_configure_hub_addresses } from "./2_configure_hub_addresses";
import { runScript as run3_deploy_spokes } from "./3_deploy_spokes";
import { runScript as run4_configure_system } from "./4_configure_system";
import { runScript as run5_create_pools } from "./5_create_pools";
import { runScript as run6_setup_sale } from "./6_setup_sale";
import { runScript as run7_configure_fees } from "./7_configure_fees";
import { runScript as run8_add_liquidity } from "./8_add_liquidity"; // Incluído para completar a lista, mas será executado manualmente.
// --- ATUALIZAÇÃO: Importação do script 9 ---
import { runScript as run9_verify_contracts } from "./9_verify_contracts";


// --- 📋 SEQUÊNCIA DE EXECUÇÃO ---
const SCRIPT_SEQUENCE = [
    { name: "1_deploy_core.ts", func: run1_deploy_core, description: "Implantação dos Contratos Principais" },
    { name: "0_faucet_test_supply.ts", func: run0_faucet_test_supply, description: "Financiamento Opcional de Teste (10M BKC)", isTest: true }, 
    { name: "2_configure_hub_addresses.ts", func: run2_configure_hub_addresses, description: "Configuração dos Endereços Centrais no Hub" },
    { name: "3_deploy_spokes.ts", func: run3_deploy_spokes, description: "Implantação dos Contratos Spoke" },
    { name: "4_configure_system.ts", func: run4_configure_system, description: "Transferência de Posse do Token e Definição de Dependências" },
    { name: "5_create_pools.ts", func: run5_create_pools, description: "Criação das Estruturas de Pool AMM" },
    { name: "6_setup_sale.ts", func: run6_setup_sale, description: "Configuração da Pré-Venda e Cunhagem da Tesouraria" },
    { name: "7_configure_fees.ts", func: run7_configure_fees, description: "Definição de Todas as Taxas e pStake Mínimos no Hub" },
    
    // --- ATUALIZAÇÃO: Passo 9 adicionado à sequência ---
    { name: "9_verify_contracts.ts", func: run9_verify_contracts, description: "Verificação dos Contratos no Etherscan/BscScan", isTest: false },

    // O Passo 8 é manual (Pós-Venda) e não deve ser executado automaticamente, mas está aqui para referência.
    // { name: "8_add_liquidity.ts", func: run8_add_liquidity, description: "Adição de Liquidez Pós-Venda e Renúncia de Posse", isManual: true },
];
// ----------------------------------

async function main() {
    const networkName = hre.network.name;

    console.log(`\n\n======================================================`);
    console.log(`🚀 INÍCIO DA EXECUÇÃO MASTER (IMPORTAÇÃO DIRETA)`);
    console.log(`Rede Alvo: ${networkName}`);
    console.log(`======================================================\n`);

    // Redes de teste (onde o Passo 0 é executado)
    const isTestNet = (networkName === 'sepolia' || networkName === 'localhost' || networkName === 'hardhat');
    let successfulScripts = 0;

    for (const script of SCRIPT_SEQUENCE) {
        
        // Pula o Passo 0 se não for uma rede de teste
        if (script.isTest && !isTestNet) {
            console.log(`\n--- ⏭️ PULANDO ${script.name} (${script.description}) ---`);
            continue;
        }

        console.log(`\n--- ⏳ EXECUTANDO PASSO: ${script.name} (${script.description}) ---`);

        try {
            // Chamada direta da função exportada, passando o Hardhat Runtime Environment
            await script.func(hre); 

            console.log(`✅ ${script.name} CONCLUÍDO COM SUCESSO.`);
            successfulScripts++;
            
            // Pausa entre scripts (Recomendado para redes públicas)
            await new Promise(resolve => setTimeout(resolve, 3000)); 

        } catch (error: any) {
            console.error(`\n======================================================`);
            console.error(`❌ FALHA CRÍTICA NA EXECUÇÃO SEQUENCIAL: ${script.name}`);
            console.error(`ERRO: ${error.message}`);
            console.error(`======================================================`);
            process.exit(1);
        }
    }

    console.log(`\n\n======================================================`);
    console.log(`🎉 EXECUÇÃO MASTER CONCLUÍDA!`);
    console.log(`Total de scripts executados com sucesso: ${successfulScripts}`);
    console.log(`⚠️ Lembre-se de executar '8_add_liquidity.ts' manualmente APÓS o término da pré-venda.`);
    console.log(`======================================================\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});