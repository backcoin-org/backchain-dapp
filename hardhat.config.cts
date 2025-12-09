// hardhat.config.cts
// ✅ VERSÃO FINAL: Configurado para .env Seguro e Etherscan V2

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

// ========================================
// 🔐 CONFIGURAÇÃO DE CHAVES (Backend)
// ========================================

// Lê as chaves da seção "BACKEND & HARDHAT" do seu .env
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

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
  console.warn("⚠️ AVISO: ALCHEMY_API_KEY não encontrada. Usando RPC público (lento/instável).");
}

// ========================================
// ⚙️ CONFIGURAÇÃO DO HARDHAT
// ========================================

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, 
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },
    // 🟢 TESTNET: Arbitrum Sepolia
    arbitrumSepolia: {
      url: ALCHEMY_API_KEY 
        ? `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}` 
        : "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421614,
    },
    // 🔴 MAINNET: Arbitrum One
    arbitrumOne: {
      url: ALCHEMY_API_KEY 
        ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` 
        : "https://arb1.arbitrum.io/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42161,
    },
  },

  // ========================================
  // 🔍 VERIFICAÇÃO (Etherscan V2)
  // ========================================
  etherscan: {
    // ⚠️ CRUCIAL: O plugin exige um objeto mapeando a rede -> chave
    apiKey: {
      arbitrumSepolia: ETHERSCAN_API_KEY,
      arbitrumOne: ETHERSCAN_API_KEY,
    },
    
    // Configuração customizada para usar os endpoints V2
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=421614", 
          browserURL: "https://sepolia.arbiscan.io",
        },
      },
      {
        network: "arbitrumOne",
        chainId: 42161,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=42161",
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

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;