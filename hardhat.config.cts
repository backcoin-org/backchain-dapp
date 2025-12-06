// hardhat.config.cts - VERSÃO CORRIGIDA PARA ETHERSCAN API V2
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

// ========================================
// 🔐 CONFIGURAÇÃO DE CHAVES
// ========================================

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// ⚠️ IMPORTANTE: Com a API V2, você usa UMA ÚNICA chave do Etherscan.io
// Essa mesma chave funciona para Arbitrum, Polygon, Base, etc.
// Crie sua chave em: https://etherscan.io/myapikey
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Validações
if (!PRIVATE_KEY) {
  console.warn("⚠️ AVISO: PRIVATE_KEY não encontrada no .env");
}

if (!ETHERSCAN_API_KEY) {
  console.warn("⚠️ AVISO: ETHERSCAN_API_KEY não encontrada. Verificação de contratos não funcionará.");
  console.warn("   💡 Crie uma chave em: https://etherscan.io/myapikey");
}

if (!ALCHEMY_API_KEY) {
  console.warn("⚠️ AVISO: ALCHEMY_API_KEY não encontrada. Usando endpoint público (mais lento).");
}

// ========================================
// ⚙️ CONFIGURAÇÃO DO HARDHAT
// ========================================

const config: HardhatUserConfig = {
  // Configurações do Compilador Solidity
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Importante para contratos complexos
    },
  },

  // ========================================
  // 🌐 REDES
  // ========================================
  networks: {
    hardhat: {
      chainId: 31337,
    },

    // 🟢 TESTNET: Arbitrum Sepolia
    arbitrumSepolia: {
      url: ALCHEMY_API_KEY
        ? `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        : "https://sepolia-rollup.arbitrum.io/rpc", // Fallback público
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421614,
      gasPrice: "auto",
    },

    // 🔴 MAINNET: Arbitrum One
    arbitrumOne: {
      url: ALCHEMY_API_KEY
        ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        : "https://arb1.arbitrum.io/rpc", // Fallback público
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42161,
      gasPrice: "auto",
    },
  },

  // ========================================
  // 🔍 VERIFICAÇÃO DE CONTRATOS (API V2)
  // ========================================
  // ⚠️ CRÍTICO: A partir de Agosto/2025, Etherscan usa API V2
  // Uma única chave do etherscan.io funciona para TODAS as redes!
  etherscan: {
    // Uma única chave - NÃO use objeto com chaves por rede
    apiKey: ETHERSCAN_API_KEY,

    // customChains com URLs da API V2
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          // ⚠️ IMPORTANTE: Use o endpoint V2 da Etherscan
          apiURL: "https://api.etherscan.io/v2/api",
          browserURL: "https://sepolia.arbiscan.io",
        },
      },
      {
        network: "arbitrumOne",
        chainId: 42161,
        urls: {
          // ⚠️ IMPORTANTE: Use o endpoint V2 da Etherscan
          apiURL: "https://api.etherscan.io/v2/api",
          browserURL: "https://arbiscan.io",
        },
      },
    ],
  },

  // ========================================
  // 📊 OUTRAS CONFIGURAÇÕES
  // ========================================
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: "gas-report.txt",
    noColors: true,
  },

  mocha: {
    timeout: 120000, // 2 minutos
  },

  sourcify: {
    enabled: true, // Verificação automática via Sourcify
  },

  // Paths padrão (opcional, mas bom ter explícito)
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
