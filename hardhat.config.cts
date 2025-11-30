// hardhat.config.cts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades"; 
import "dotenv/config";
import "@nomicfoundation/hardhat-verify";

// --- CONFIGURAÇÃO DE CHAVES (HARDCODED PARA EVITAR ERROS DE LEITURA) ---
// Estamos forçando a URL completa aqui para eliminar erro de DNS por caractere inválido
const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/7d31b7dd70ab4d4da293c96bf983f1f1";

// Tenta ler a chave privada do .env, senão avisa
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

if (!PRIVATE_KEY) {
  console.warn("⚠️ AVISO: PRIVATE_KEY não encontrada no .env. Deploy irá falhar.");
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
      // Vital para evitar 'Stack too deep'
      viaIR: true, 
    },
  },

  // Configuração das Redes
  networks: {
    hardhat: {
      chainId: 31337,
    },
    
    // Configuração da Sepolia
    sepolia: {
      url: SEPOLIA_RPC_URL, // URL Fixa e direta
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },

    // Configuração da BSC Testnet
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },

  // Verificação de Contrato
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com"
        }
      }
    ]
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  
  mocha: {
    timeout: 120000
  }
};

export default config;