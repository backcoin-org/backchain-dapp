// scripts/4_register_validator.ts 
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { BigNumberish } from "ethers";

// ######################################################################
// ### CONFIGURAÇÃO
// ######################################################################

const VALIDATOR_REGISTRATION_KEY = "VALIDATOR_REGISTRATION_FEE"; 

// ######################################################################

const addressesFilePath = path.join(
    __dirname,
    "../deployment-addresses.json"
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEPLOY_DELAY_MS = 2000;

// Função robusta para envio de transações
async function sendTransactionWithRetries(txFunction: () => Promise<any>, description: string) {
    for (let i = 0; i < 3; i++) {
        try {
            console.log(`   -> Enviando Transação: ${description}...`);
            const tx = await txFunction();
            const receipt = await tx.wait();
            if (!receipt) { throw new Error("Transação enviada, mas um recibo nulo foi retornado."); }
            console.log(`   ✅ SUCESSO. TX Hash: ${receipt.hash}`);
            await sleep(1500);
            return receipt;
        } catch (error: any) {
            // Lógica de manipulação de erros (NONCE e ESTADO)
            if ((error.message.includes("nonce") || error.message.includes("in-flight")) && i < 2) {
                console.warn(`   ⚠️ Problema de nonce detectado. Tentando novamente em ${5000} segundos...`);
                await sleep(5000);
            } else if (error.message.includes("Validator already registered")) {
                 console.log("   ⚠️ AVISO: Validador já registrado. Processo concluído.");
                 return null; 
            } else {
                // Remove a lógica específica de Reentrancy, pois a função foi unificada
                throw new Error(`❌ FALHA na transação (${description}): ${error.message}`);
            }
        }
    }
}


export async function runScript(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;

  console.log(`\n🚀 (PASSO 4) REGISTRO UNIFICADO DE VALIDADOR (Deployer) na rede: ${networkName}`);
  console.log(`Endereço do Validador/Deployer: ${deployer.address}`);
  console.log("----------------------------------------------------");

  if (!fs.existsSync(addressesFilePath)) {
    throw new Error("Missing deployment-addresses.json. Execute 3_launch_and_liquidate_ecosystem.ts primeiro.");
  }
  const addresses: { [key: string]: string } = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));

  const { delegationManager, ecosystemManager } = addresses;
  
  if (!delegationManager || !ecosystemManager) {
    throw new Error("Missing DelegationManager or EcosystemManager address in JSON.");
  }

  // Obter Instâncias
  const dm = await ethers.getContractAt("DelegationManager", delegationManager, deployer);
  const hub = await ethers.getContractAt("EcosystemManager", ecosystemManager, deployer);
  const bkcToken = await ethers.getContractAt("BKCToken", addresses.bkcToken, deployer);

  try {
    const registrationFeeWei = await hub.getFee(VALIDATOR_REGISTRATION_KEY);
    console.log(`\n2. Taxa de Registro (Hub) lida: ${ethers.formatEther(registrationFeeWei)} BKC`);

    if (registrationFeeWei === 0n) {
        throw new Error("Taxa de registro é zero. Configure 'VALIDATOR_REGISTRATION_FEE' no Hub primeiro.");
    }
    
    // =================================================================
    // === PASSO 1: APROVAR E REGISTRAR (FLUXO ÚNICO) ===
    // =================================================================
    
    // 3.1. Aprovar o DM para puxar a taxa (Aprovação deve ocorrer antes da chamada 'registerValidator')
    const allowance = await bkcToken.allowance(deployer.address, delegationManager);
    
    if (allowance < registrationFeeWei) {
         await sendTransactionWithRetries(
            () => bkcToken.approve(delegationManager, registrationFeeWei), 
            `Aprovar ${ethers.formatEther(registrationFeeWei)} BKC para o DM (Taxa)`
         );
    } else {
         console.log("   ⚠️ AVISO: Aprovação BKC já suficiente. Pulando aprovação.");
    }

    // 3.2. Pagar a Taxa E Registrar (Chamada Única)
    console.log("\n4. Registrando o Validador (Cobrança e Registro em uma Transação)...");
    
    // Esta chamada agora cobra a taxa e muda o estado 'isRegistered'
    await sendTransactionWithRetries(
        () => dm.registerValidator(deployer.address), 
        "Registro Final do Validador (Com Taxa)"
    );

    console.log("----------------------------------------------------");
    console.log(`\n🎉🎉🎉 VALIDADOR ${deployer.address} REGISTRADO COM SUCESSO! 🎉🎉🎉`);

    // 5. Verificação Final
    const validatorInfo = await dm.validators(deployer.address);
    if (validatorInfo.isRegistered) {
        console.log(`   Status: Validador registrado = TRUE`);
    } else {
         console.error(`   Status: ERRO. O validador não está marcado como registrado.`);
    }

  } catch (error: any) {
    console.error("\n❌ Falha grave no script de registro de validador:", error.message);
    process.exit(1);
  }
}

// Bloco de entrada para execução standalone
if (require.main === module) {
  runScript(require("hardhat")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}