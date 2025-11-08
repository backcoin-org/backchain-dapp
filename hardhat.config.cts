// Importa os tipos e plugins necessários
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox"; // Pacote padrão de plugins (ethers, waffle, etc.)
import "dotenv/config"; // Carrega as variáveis do .env
import "@nomicfoundation/hardhat-verify"; // Plugin de verificação

// --- Carrega variáveis de ambiente ---
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Verifica se a chave privada existe
if (!PRIVATE_KEY) {
  console.warn("AVISO: PRIVATE_KEY não definida no arquivo .env. As transações falharão.");
}

// Define a configuração do Hardhat
const config: HardhatUserConfig = {
  
  // Versão do Solidity (Mantida a sua versão 0.8.28)
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // ✅ SOLUÇÃO PARA "Stack too deep"
    },
  },

  // Definição das Redes
  networks: {
    // Rede de desenvolvimento local
    hardhat: {
      chainId: 31337,
    },
    
    // Rede Sepolia
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111, // Chain ID da Sepolia
    },

    // Rede BSC Testnet
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },

  // Configuração de Verificação (Etherscan/BscScan)
  etherscan: {
    // A chave API será lida do .env (ETHERSCAN_API_KEY)
    apiKey: process.env.ETHERSCAN_API_KEY || "",

    // Configuração para redes customizadas (como BSC)
    customChains: [
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com"
        }
      }
      // Adicione a 'bscMainnet' aqui se for para produção
    ]
  },

  // Outras configurações (ex: gas reporter)
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

// Exporta a configuração
export default config;