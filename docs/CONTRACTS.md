# Backchain Protocol

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   "I may not agree with what you say, but I will defend to the death            ║
║    your right to say it."                                                         ║
║                                                                     — Voltaire    ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

| | |
|---|---|
| **Project** | Backchain Protocol |
| **Philosophy** | Unstoppable & Permissionless DeFi Infrastructure |
| **Network** | Arbitrum One |
| **Status** | Testnet Live (Arbitrum Sepolia) |
| **Website** | [backcoin.org](https://backcoin.org) |
| **Documentation** | [github.com/backcoin-org/backchain-dapp/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs) |
| **X (Twitter)** | [x.com/backcoin](https://x.com/backcoin) |
| **GitHub** | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| **YouTube** | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |
| **Contact** | dev@backcoin.org |

---

**Document:** Smart Contracts — The Unstoppable Infrastructure  
**Version:** 2.0.0  
**Last Updated:** February 2026  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# Smart Contracts

## The Code That Cannot Be Stopped

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    DEPLOYED. VERIFIED. UNSTOPPABLE.                               ║
║                                                                                   ║
║   These contracts run on Arbitrum.                                               ║
║   They have no admin keys.                                                        ║
║   They have no pause buttons.                                                     ║
║   They have no kill switches.                                                     ║
║                                                                                   ║
║   As long as Ethereum exists, these contracts will execute.                      ║
║   No government. No corporation. No authority can stop them.                     ║
║                                                                                   ║
║   Code is law. Math is truth. The protocol is unstoppable.                       ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

All Backchain Protocol smart contracts are deployed on Arbitrum Sepolia. Every contract is verified on Arbiscan — **trust the code, not the words**.

---

## 🌍 Become an Operator

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                         BUILD. INTEGRATE. EARN.                                   ║
║                                                                                   ║
║   Every contract marked with ⚡ supports the OPERATOR SYSTEM.                     ║
║                                                                                   ║
║   This means:                                                                     ║
║   1. Build your own frontend, app, bot, or tool                                  ║
║   2. Pass your wallet address as the "operator" parameter                        ║
║   3. Earn a percentage of ALL fees generated through your interface              ║
║                                                                                   ║
║   No registration. No approval. No KYC. Just build and earn.                     ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🔗 Network Information

| Property | Value |
|----------|-------|
| **Network** | Arbitrum Sepolia (Testnet) |
| **Chain ID** | 421614 |
| **RPC URL** | https://sepolia-rollup.arbitrum.io/rpc |
| **Explorer** | https://sepolia.arbiscan.io |
| **Currency** | ETH |

---

## 📋 Core Contracts

### Token & Management

| Contract | Address | Operator | Description |
|----------|---------|----------|-------------|
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` | — | Native ERC-20 token |
| **EcosystemManager** | `0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407` | — | Central configuration hub |
| **MiningManager** | `0x7755982411244791d2DA96cBa04d08df72Be43C1` | ⚡ Yes | Activity rewards distribution |
| **Treasury** | `0xc93030333E3a235c2605BcB7C7330650B600B6D0` | — | Protocol treasury |
| **Governance** | `0x157e08d5F5a776A530227f548d0f0C47682b7A3E` | — | On-chain governance |

### DeFi Services

| Contract | Address | Operator | Description |
|----------|---------|----------|-------------|
| **DelegationManager** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` | ⚡ Yes | Staking system |
| **FortunePool** | `0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF` | ⚡ Yes | Gaming / prediction |
| **CharityPool** | `0x259271F3558bCa03Ddc8D7494CCF833751483Fb1` | ⚡ Yes | Decentralized crowdfunding |

### Utility Services

| Contract | Address | Operator | Description |
|----------|---------|----------|-------------|
| **DecentralizedNotary** | `0x2E56650a4f05D0f98787694c6C61603616716b48` | ⚡ Yes | Document certification |
| **RentalManager** | `0x593A842d214516F216EB6E6E9A97cC84F42f6821` | ⚡ Yes | NFT rentals |
| **Backchat** | `0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb` | ⚡ Yes | Decentralized social network |

### NFT System

| Contract | Address | Operator | Description |
|----------|---------|----------|-------------|
| **RewardBoosterNFT** | `0xf2EA307686267dC674859da28C58CBb7a5866BCf` | — | Utility NFT collection |
| **NFT Pool Factory** | `0x2f63000539AAE2019Cc3d6E357295d903c1fF120` | — | Creates liquidity pools |
| **NFT Pool Implementation** | `0x9E857BE855C8397B188131Be6B85456C7b9d8dB7` | ⚡ Yes | Pool logic |

### Randomness (Stylus - Rust/WASM)

| Contract | Address | Operator | Description |
|----------|---------|----------|-------------|
| **Backcoin Oracle** | `0x16346f5a45f9615f1c894414989f0891c54ef07b` | — | Free randomness oracle |

### Utilities

| Contract | Address | Operator | Description |
|----------|---------|----------|-------------|
| **Faucet** | `0x954acE43508AC8Ee1C5509F0ee1Fe65b81C3fc90` | — | Testnet BKC distribution |

---

## 💎 NFT Liquidity Pools

Each Reward Booster tier has its own AMM pool. **All pools support the operator system!**

| Tier | Burn Reduction | Pool Address | Operator |
|------|----------------|--------------|----------|
| **Diamond** | 0% (no burn) | `0x5C5590458689a11731c8bAD8BDf5D8f1D7Ffe020` | ⚡ Yes |
| **Gold** | 25% | `0x9390e12c910C4d2E0796FA754e5C450969F09886` | ⚡ Yes |
| **Silver** | 35% | `0x016549ee056442eC30a916335f66ad5183E3fF5b` | ⚡ Yes |
| **Bronze** | 50% | `0x74eB5CF86B43517cd27f48A06abb8A521aDA63b8` | ⚡ Yes |

---

## 📦 Quick Copy Reference

### All Addresses (Plain Text)

```
# ═══════════════════════════════════════════════════════════════════════════════
# BACKCHAIN PROTOCOL - SMART CONTRACTS
# Network: Arbitrum Sepolia (Chain ID: 421614)
# ═══════════════════════════════════════════════════════════════════════════════

# Core
BKC Token:           0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396
EcosystemManager:    0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407
MiningManager:       0x7755982411244791d2DA96cBa04d08df72Be43C1
Treasury:            0xc93030333E3a235c2605BcB7C7330650B600B6D0
Governance:          0x157e08d5F5a776A530227f548d0f0C47682b7A3E

# DeFi (⚡ All support Operator System)
DelegationManager:   0x41B1B7940E06318e9b161fc64524FaE7261e8739
FortunePool:         0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF
CharityPool:         0x259271F3558bCa03Ddc8D7494CCF833751483Fb1

# Utility (⚡ All support Operator System)
DecentralizedNotary: 0x2E56650a4f05D0f98787694c6C61603616716b48
RentalManager:       0x593A842d214516F216EB6E6E9A97cC84F42f6821
Backchat:            0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb

# NFT
RewardBoosterNFT:    0xf2EA307686267dC674859da28C58CBb7a5866BCf
NFT Pool Factory:    0x2f63000539AAE2019Cc3d6E357295d903c1fF120
NFT Pool Impl:       0x9E857BE855C8397B188131Be6B85456C7b9d8dB7

# Randomness (Free!)
Backcoin Oracle:     0x16346f5a45f9615f1c894414989f0891c54ef07b

# Utilities
Faucet:              0x954acE43508AC8Ee1C5509F0ee1Fe65b81C3fc90

# NFT Pools (⚡ All support Operator System)
Diamond Pool:        0x5C5590458689a11731c8bAD8BDf5D8f1D7Ffe020
Gold Pool:           0x9390e12c910C4d2E0796FA754e5C450969F09886
Silver Pool:         0x016549ee056442eC30a916335f66ad5183E3fF5b
Bronze Pool:         0x74eB5CF86B43517cd27f48A06abb8A521aDA63b8
```

### JavaScript Constants

```javascript
/**
 * BACKCHAIN PROTOCOL - Smart Contract Addresses
 * Network: Arbitrum Sepolia (Chain ID: 421614)
 * 
 * Contracts marked with "operator: true" support the Operator System.
 * Build interfaces, pass your address, earn commissions!
 */
export const CONTRACTS = {
    // Core
    BKC_TOKEN: '0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396',
    ECOSYSTEM_MANAGER: '0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407',
    MINING_MANAGER: '0x7755982411244791d2DA96cBa04d08df72Be43C1',  // operator: true
    TREASURY: '0xc93030333E3a235c2605BcB7C7330650B600B6D0',
    GOVERNANCE: '0x157e08d5F5a776A530227f548d0f0C47682b7A3E',
    
    // DeFi (all support operator)
    DELEGATION_MANAGER: '0x41B1B7940E06318e9b161fc64524FaE7261e8739',  // operator: true
    FORTUNE_POOL: '0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF',        // operator: true
    CHARITY_POOL: '0x259271F3558bCa03Ddc8D7494CCF833751483Fb1',        // operator: true
    
    // Utility (all support operator)
    NOTARY: '0x2E56650a4f05D0f98787694c6C61603616716b48',              // operator: true
    RENTAL_MANAGER: '0x593A842d214516F216EB6E6E9A97cC84F42f6821',      // operator: true
    BACKCHAT: '0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb',            // operator: true
    
    // NFT
    REWARD_BOOSTER_NFT: '0xf2EA307686267dC674859da28C58CBb7a5866BCf',
    NFT_POOL_FACTORY: '0x2f63000539AAE2019Cc3d6E357295d903c1fF120',
    NFT_POOL_IMPL: '0x9E857BE855C8397B188131Be6B85456C7b9d8dB7',       // operator: true
    
    // Randomness (FREE!)
    BACKCOIN_ORACLE: '0x16346f5a45f9615f1c894414989f0891c54ef07b',
    
    // Utilities
    FAUCET: '0x954acE43508AC8Ee1C5509F0ee1Fe65b81C3fc90',
    
    // NFT Pools (all support operator)
    POOLS: {
        DIAMOND: '0x5C5590458689a11731c8bAD8BDf5D8f1D7Ffe020',         // operator: true
        GOLD: '0x9390e12c910C4d2E0796FA754e5C450969F09886',            // operator: true
        SILVER: '0x016549ee056442eC30a916335f66ad5183E3fF5b',          // operator: true
        BRONZE: '0x74eB5CF86B43517cd27f48A06abb8A521aDA63b8'           // operator: true
    }
};

// Default operator (used when none specified)
export const DEFAULT_OPERATOR = '0x0000000000000000000000000000000000000000';

// Network config
export const NETWORK = {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorer: 'https://sepolia.arbiscan.io'
};
```

---

## 🔗 Arbiscan Links

### Verified Contracts (Click to Verify the Code)

| Contract | Arbiscan Link |
|----------|---------------|
| BKC Token | [View Code](https://sepolia.arbiscan.io/address/0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396#code) |
| EcosystemManager | [View Code](https://sepolia.arbiscan.io/address/0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407#code) |
| MiningManager | [View Code](https://sepolia.arbiscan.io/address/0x7755982411244791d2DA96cBa04d08df72Be43C1#code) |
| DelegationManager | [View Code](https://sepolia.arbiscan.io/address/0x41B1B7940E06318e9b161fc64524FaE7261e8739#code) |
| FortunePool | [View Code](https://sepolia.arbiscan.io/address/0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF#code) |
| CharityPool | [View Code](https://sepolia.arbiscan.io/address/0x259271F3558bCa03Ddc8D7494CCF833751483Fb1#code) |
| DecentralizedNotary | [View Code](https://sepolia.arbiscan.io/address/0x2E56650a4f05D0f98787694c6C61603616716b48#code) |
| RentalManager | [View Code](https://sepolia.arbiscan.io/address/0x593A842d214516F216EB6E6E9A97cC84F42f6821#code) |
| Backchat | [View Code](https://sepolia.arbiscan.io/address/0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb#code) |
| RewardBoosterNFT | [View Code](https://sepolia.arbiscan.io/address/0xf2EA307686267dC674859da28C58CBb7a5866BCf#code) |
| Backcoin Oracle | [View Code](https://sepolia.arbiscan.io/address/0x16346f5a45f9615f1c894414989f0891c54ef07b#code) |
| Governance | [View Code](https://sepolia.arbiscan.io/address/0x157e08d5F5a776A530227f548d0f0C47682b7A3E#code) |

---

## 🏗️ Contract Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                          BACKCHAIN PROTOCOL ARCHITECTURE                          ║
║                                                                                   ║
║   ┌─────────────────────────────────────────────────────────────────────────┐    ║
║   │                                                                         │    ║
║   │                        ┌─────────────────────┐                         │    ║
║   │                        │  EcosystemManager   │                         │    ║
║   │                        │   (Central Hub)     │                         │    ║
║   │                        └──────────┬──────────┘                         │    ║
║   │                                   │                                     │    ║
║   │         ┌─────────────────────────┼─────────────────────┐              │    ║
║   │         │                         │                     │              │    ║
║   │         ▼                         ▼                     ▼              │    ║
║   │  ┌─────────────┐          ┌─────────────┐      ┌─────────────┐        │    ║
║   │  │   BKC       │          │   Mining    │      │  Treasury   │        │    ║
║   │  │   Token     │          │   Manager   │      │             │        │    ║
║   │  └─────────────┘          └──────┬──────┘      └─────────────┘        │    ║
║   │                                  │                                      │    ║
║   │    ┌──────────────┬──────────────┼──────────────┬──────────────┐       │    ║
║   │    │              │              │              │              │       │    ║
║   │    ▼              ▼              ▼              ▼              ▼       │    ║
║   │ ┌────────┐  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐     │    ║
║   │ │Staking │  │Fortune │    │Charity │    │ Notary │    │Backchat│     │    ║
║   │ │   ⚡   │  │   ⚡   │    │   ⚡   │    │   ⚡   │    │   ⚡   │     │    ║
║   │ └────────┘  └───┬────┘    └────────┘    └────────┘    └────────┘     │    ║
║   │                 │                                                      │    ║
║   │                 ▼                                                      │    ║
║   │          ┌─────────────┐                                              │    ║
║   │          │  Backcoin   │  ← FREE Randomness!                         │    ║
║   │          │   Oracle    │                                              │    ║
║   │          └─────────────┘                                              │    ║
║   │                                                                         │    ║
║   │  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │    ║
║   │  │  Reward     │      │  NFT Pool   │      │   Rental    │            │    ║
║   │  │ Booster NFT │◄────►│   Factory   │      │  Manager ⚡ │            │    ║
║   │  └─────────────┘      └──────┬──────┘      └─────────────┘            │    ║
║   │                              │                                          │    ║
║   │         ┌────────────────────┼────────────────────┐                    │    ║
║   │         │              │              │           │                    │    ║
║   │         ▼              ▼              ▼           ▼                    │    ║
║   │     Diamond ⚡     Gold ⚡      Silver ⚡    Bronze ⚡                 │    ║
║   │       Pool          Pool          Pool        Pool                     │    ║
║   │                                                                         │    ║
║   └─────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                   ║
║   ⚡ = Supports Operator System (Build interfaces → Earn commissions!)           ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## ✅ Verification Status

All contracts are verified on Arbiscan — **don't trust, verify!**

| Contract | Verified | Operator Support | Upgradeable |
|----------|----------|------------------|-------------|
| BKC Token | ✅ | — | No |
| EcosystemManager | ✅ | — | No |
| MiningManager | ✅ | ⚡ Yes | No |
| DelegationManager | ✅ | ⚡ Yes | No |
| FortunePool | ✅ | ⚡ Yes | No |
| CharityPool | ✅ | ⚡ Yes | No |
| DecentralizedNotary | ✅ | ⚡ Yes | No |
| RentalManager | ✅ | ⚡ Yes | No |
| Backchat | ✅ | ⚡ Yes | No |
| RewardBoosterNFT | ✅ | — | No |
| Backcoin Oracle | ✅ | — | No |
| NFT Pool Factory | ✅ | — | No |
| All NFT Pools | ✅ | ⚡ Yes | No |
| Governance | ✅ | — | No |

**Note:** Contracts are NOT upgradeable. Once deployed, the code cannot be changed. This is a feature, not a bug — it guarantees unstoppability.

---

## 🔐 Security Guarantees

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   IMMUTABLE INFRASTRUCTURE                                                        ║
║   ════════════════════════                                                        ║
║                                                                                   ║
║   ✅ NO ADMIN KEYS       - No one can change contract behavior                   ║
║   ✅ NO PAUSE FUNCTIONS  - No one can stop the protocol                          ║
║   ✅ NO KILL SWITCHES    - No emergency shutdown                                 ║
║   ✅ NO PROXY UPGRADES   - Code is final and immutable                           ║
║   ✅ NO BLACKLISTS       - No one can be censored                                ║
║   ✅ FULLY VERIFIED      - All source code is public                             ║
║                                                                                   ║
║   The only way to stop these contracts is to stop Ethereum itself.               ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📞 Support

| Channel | Link |
|---------|------|
| **Documentation** | [github.com/backcoin-org/backchain-dapp/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs) |
| **GitHub** | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| **Email** | dev@backcoin.org |
| **X (Twitter)** | [x.com/backcoin](https://x.com/backcoin) |

---

## 📄 License

MIT License — The code is free, just like the protocol.

---

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                        BUILT BY BACKCHAIN PROTOCOL                                ║
║                                                                                   ║
║   These contracts are not just code. They are infrastructure for freedom.        ║
║                                                                                   ║
║   Anyone can use them. Anyone can build on them. Anyone can earn from them.      ║
║   No permission needed. No approval required. No authority to ask.               ║
║                                                                                   ║
║   The contracts are deployed. The code is verified. The protocol is live.        ║
║                                                                                   ║
║   No one can stop it. No one can censor it. No one can control it.               ║
║                                                                                   ║
║                       THE INFRASTRUCTURE IS UNSTOPPABLE.                          ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

*This document is part of Backchain Protocol's public documentation. All contracts are verified on Arbiscan. Trust the code, not the words.*
