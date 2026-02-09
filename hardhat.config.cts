// hardhat.config.ts
// ✅ VERSÃO V3.2: Optimizer agressivo para contratos grandes

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

// ========================================
// 🔑 CONFIGURAÇÃO DE CHAVES
// ========================================

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// ========================================
// 🌐 RPCs - ARBITRUM OFFICIAL COMO PRIMÁRIA
// ========================================

const RPC_URLS = {
  // Testnet - Arbitrum Sepolia
  arbitrumSepolia: {
    primary: "https://sepolia-rollup.arbitrum.io/rpc",
    fallback: ALCHEMY_API_KEY ? `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}` : null,
  },
  // Mainnet - Arbitrum One
  arbitrumOne: {
    primary: "https://arb1.arbitrum.io/rpc",
    fallback: ALCHEMY_API_KEY ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` : null,
  },
};

// ========================================
// ⚠️ VALIDAÇÕES DE SEGURANÇA
// ========================================

if (!PRIVATE_KEY) {
  console.warn("⚠️ AVISO: PRIVATE_KEY não encontrada no .env. Deploys irão falhar.");
}
if (!ETHERSCAN_API_KEY) {
  console.warn("⚠️ AVISO: ETHERSCAN_API_KEY não encontrada. Verificação impossível.");
}
if (!ALCHEMY_API_KEY) {
  console.warn("ℹ️ INFO: ALCHEMY_API_KEY não encontrada. Usando apenas RPC oficial do Arbitrum.");
}

// Log da RPC sendo usada
console.log(`🌐 Arbitrum Sepolia RPC: ${RPC_URLS.arbitrumSepolia.primary}`);

// ========================================
// ⚙️ CONFIGURAÇÃO DO HARDHAT
// ========================================

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,  // Mínimo = bytecode menor
          },
          viaIR: true,  // Otimização via IR
          evmVersion: "paris",
          metadata: {
            bytecodeHash: "none",  // Remove hash do metadata (economiza ~50 bytes)
          },
        },
      },
    ],
    // Override específico para Agora (contrato grande — social protocol)
    overrides: {
      "contracts/Agora.sol": {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
          viaIR: true,
          evmVersion: "paris",
          metadata: {
            bytecodeHash: "none",
          },
        },
      },
    },
  },

  networks: {
    // Local
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,  // Para testes locais
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // 🟢 TESTNET: Arbitrum Sepolia
    arbitrumSepolia: {
      url: RPC_URLS.arbitrumSepolia.primary,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421614,
      timeout: 60000,
    },

    // 🔴 MAINNET: Arbitrum One
    arbitrumOne: {
      url: RPC_URLS.arbitrumOne.primary,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42161,
      timeout: 60000,
    },

    // 🔵 ALTERNATIVA: Arbitrum Sepolia via Alchemy
    arbitrumSepoliaAlchemy: {
      url: RPC_URLS.arbitrumSepolia.fallback || RPC_URLS.arbitrumSepolia.primary,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421614,
    },
  },

  // ========================================
  // 🔍 VERIFICAÇÃO
  // ========================================
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io",
        },
      },
      {
        network: "arbitrumOne",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io",
        },
      },
    ],
  },

  sourcify: {
    enabled: true,
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    noColors: true,
  },

  // ========================================
  // 📁 PATHS
  // ========================================
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;