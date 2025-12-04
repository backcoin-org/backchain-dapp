// hardhat.config.cts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades"; 
import "dotenv/config";
import "@nomicfoundation/hardhat-verify";

// --- CONFIGURAÇÃO DE CHAVES ---

// 1. Sua Chave Alchemy (Peguei da sua imagem anterior)
// Isso garante que o deploy conte para o Grant "Everyone Onchain"
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "OXcpAI1M17gLgjZJJ8VC3";

// 2. Chave Privada (Do .env ou Hardcoded se for teste rápido)
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// 3. Chave da Arbiscan (Para verificar o contrato)
// Se não tiver, o deploy funciona, mas a verificação falha.
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY || ""; 

if (!PRIVATE_KEY) {
  console.warn("⚠️ AVISO: PRIVATE_KEY não encontrada. O deploy irá falhar.");
}

const config: HardhatUserConfig = {
  // Configurações do Compilador
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Vital para contratos complexos
    },
  },

  // Configuração das Redes (ARBITRUM)
  networks: {
    hardhat: {
      chainId: 31337,
    },
    
    // 🟢 TESTNET: Arbitrum Sepolia (Use esta para testar agora)
    arbitrumSepolia: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421614,
    },

    // 🔴 MAINNET: Arbitrum One (Use esta para o Lançamento Mundial)
    arbitrumOne: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42161,
    },
  },

  // Verificação de Contrato na Arbiscan
  etherscan: {
    apiKey: {
      // É necessário mapear a chave correta para cada rede
      arbitrumSepolia: ARBISCAN_API_KEY,
      arbitrumOne: ARBISCAN_API_KEY
    },
    customChains: [
      // Arbitrum Sepolia geralmente já é suportada nativamente pelo plugin,
      // mas mantemos a config padrão limpa.
    ]
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  
  mocha: {
    timeout: 120000
  },
  
  sourcify: {
    enabled: true // Ajuda na verificação automática
  }
};

export default config;