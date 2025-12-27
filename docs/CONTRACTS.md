# Backcoin Protocol

| | |
|---|---|
| **Project** | Backcoin Protocol |
| **Description** | Modular DeFi Infrastructure for Real-World Utility |
| **Network** | Arbitrum One |
| **Status** | Testnet Live (Arbitrum Sepolia) |
| **Website** | [backcoin.org](https://backcoin.org) |
| **X (Twitter)** | [x.com/backcoin](https://x.com/backcoin) |
| **GitHub** | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| **YouTube** | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |
| **Contact** | dev@backcoin.org |

---

**Document:** Smart Contracts — Complete Address Reference  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# Smart Contracts

All Backcoin Protocol smart contracts deployed on Arbitrum Sepolia. Every contract is verified on Arbiscan.

---

## Network Information

| Property | Value |
|----------|-------|
| **Network** | Arbitrum Sepolia (Testnet) |
| **Chain ID** | 421614 |
| **RPC URL** | https://sepolia-rollup.arbitrum.io/rpc |
| **Explorer** | https://sepolia.arbiscan.io |
| **Currency** | ETH |

---

## Core Contracts

### Token & Management

| Contract | Address | Description |
|----------|---------|-------------|
| **BKC Token** | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` | Native ERC-20 token |
| **EcosystemManager** | `0xF7c16C935d70627cf7F94040330C162095b8BEb1` | Central configuration hub |
| **MiningManager** | `0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB` | Activity rewards distribution |
| **Treasury** | `0xc93030333E3a235c2605BcB7C7330650B600B6D0` | Protocol treasury |

### DeFi Services

| Contract | Address | Description |
|----------|---------|-------------|
| **DelegationManager** | `0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701` | Staking system |
| **FortunePool** | `0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631` | Gaming / prediction |

### Utility Services

| Contract | Address | Description |
|----------|---------|-------------|
| **DecentralizedNotary** | `0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9` | Document certification |
| **RentalManager** | `0xD387B3Fd06085676e85130fb07ae06D675cb201f` | NFT rentals (AirBNFT) |

### NFT System

| Contract | Address | Description |
|----------|---------|-------------|
| **RewardBoosterNFT** | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` | Utility NFT collection |
| **NFT Pool Factory** | `0x0bcaB4cA1Fac9f6eFE3Db1849E8E03e88B3D9423` | Creates liquidity pools |

### Randomness (Stylus)

| Contract | Address | Description |
|----------|---------|-------------|
| **BackchainRandomness** | `0x6eB891C2C7bC248EdDf31c77C4258205a37C4126` | Free randomness oracle |
| **StylusEntropy** | `0xb6bb5e9c9df36fa9504d87125af0e4b284b55092` | Rust/WASM entropy |

### Utilities

| Contract | Address | Description |
|----------|---------|-------------|
| **Faucet** | `0x9dbf3591239Dd2D2Cc2e93b6E5086E8651e488bb` | Testnet BKC distribution |

---

## NFT Liquidity Pools

Each Reward Booster tier has its own AMM pool:

| Tier | Discount | Pool Address |
|------|----------|--------------|
| **Diamond** | 70% | `0xD4393350bd00ef6D4509D43c6dB0E7010bB5c3d9` |
| **Platinum** | 60% | `0x76Edd1f3c42f607a92b9354D14F5F25278403808` |
| **Gold** | 50% | `0xE9354654c97Fa5CDe3931c53a72aBEdC688ab01B` |
| **Silver** | 40% | `0x57Bc7500213DAAfb0176E04B4Cce19cE19E145d4` |
| **Bronze** | 30% | `0x9eFB21b279873D04e337c371c90fF00130aB8581` |
| **Iron** | 20% | `0x99259cF2cE5158fcC995aCf6282574f6563a048e` |
| **Crystal** | 10% | `0xe7Ae6A7B48460b3c581158c80F67E566CC800271` |

---

## Quick Copy Reference

### All Addresses (Plain Text)

```
# Core
BKC Token:           0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f
EcosystemManager:    0xF7c16C935d70627cf7F94040330C162095b8BEb1
MiningManager:       0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB
Treasury:            0xc93030333E3a235c2605BcB7C7330650B600B6D0

# DeFi
DelegationManager:   0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701
FortunePool:         0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631

# Utility
DecentralizedNotary: 0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9
RentalManager:       0xD387B3Fd06085676e85130fb07ae06D675cb201f

# NFT
RewardBoosterNFT:    0x748b4770D6685629Ed9faf48CFa81e3E4641A341
NFT Pool Factory:    0x0bcaB4cA1Fac9f6eFE3Db1849E8E03e88B3D9423

# Randomness
BackchainRandomness: 0x6eB891C2C7bC248EdDf31c77C4258205a37C4126
StylusEntropy:       0xb6bb5e9c9df36fa9504d87125af0e4b284b55092

# Utilities
Faucet:              0x9dbf3591239Dd2D2Cc2e93b6E5086E8651e488bb

# NFT Pools
Diamond Pool:        0xD4393350bd00ef6D4509D43c6dB0E7010bB5c3d9
Platinum Pool:       0x76Edd1f3c42f607a92b9354D14F5F25278403808
Gold Pool:           0xE9354654c97Fa5CDe3931c53a72aBEdC688ab01B
Silver Pool:         0x57Bc7500213DAAfb0176E04B4Cce19cE19E145d4
Bronze Pool:         0x9eFB21b279873D04e337c371c90fF00130aB8581
Iron Pool:           0x99259cF2cE5158fcC995aCf6282574f6563a048e
Crystal Pool:        0xe7Ae6A7B48460b3c581158c80F67E566CC800271
```

### JavaScript Constants

```javascript
export const CONTRACTS = {
    // Core
    BKC_TOKEN: '0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f',
    ECOSYSTEM_MANAGER: '0xF7c16C935d70627cf7F94040330C162095b8BEb1',
    MINING_MANAGER: '0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB',
    TREASURY: '0xc93030333E3a235c2605BcB7C7330650B600B6D0',
    
    // DeFi
    DELEGATION_MANAGER: '0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701',
    FORTUNE_POOL: '0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631',
    
    // Utility
    NOTARY: '0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9',
    RENTAL_MANAGER: '0xD387B3Fd06085676e85130fb07ae06D675cb201f',
    
    // NFT
    REWARD_BOOSTER_NFT: '0x748b4770D6685629Ed9faf48CFa81e3E4641A341',
    NFT_POOL_FACTORY: '0x0bcaB4cA1Fac9f6eFE3Db1849E8E03e88B3D9423',
    
    // Randomness
    RANDOMNESS_ORACLE: '0x6eB891C2C7bC248EdDf31c77C4258205a37C4126',
    STYLUS_ENTROPY: '0xb6bb5e9c9df36fa9504d87125af0e4b284b55092',
    
    // Utilities
    FAUCET: '0x9dbf3591239Dd2D2Cc2e93b6E5086E8651e488bb',
    
    // NFT Pools
    POOLS: {
        DIAMOND: '0xD4393350bd00ef6D4509D43c6dB0E7010bB5c3d9',
        PLATINUM: '0x76Edd1f3c42f607a92b9354D14F5F25278403808',
        GOLD: '0xE9354654c97Fa5CDe3931c53a72aBEdC688ab01B',
        SILVER: '0x57Bc7500213DAAfb0176E04B4Cce19cE19E145d4',
        BRONZE: '0x9eFB21b279873D04e337c371c90fF00130aB8581',
        IRON: '0x99259cF2cE5158fcC995aCf6282574f6563a048e',
        CRYSTAL: '0xe7Ae6A7B48460b3c581158c80F67E566CC800271'
    }
};
```

---

## Arbiscan Links

### Verified Contracts

| Contract | Arbiscan Link |
|----------|---------------|
| BKC Token | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f) |
| EcosystemManager | [View on Arbiscan](https://sepolia.arbiscan.io/address/0xF7c16C935d70627cf7F94040330C162095b8BEb1) |
| MiningManager | [View on Arbiscan](https://sepolia.arbiscan.io/address/0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB) |
| DelegationManager | [View on Arbiscan](https://sepolia.arbiscan.io/address/0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701) |
| FortunePool | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631) |
| DecentralizedNotary | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9) |
| RentalManager | [View on Arbiscan](https://sepolia.arbiscan.io/address/0xD387B3Fd06085676e85130fb07ae06D675cb201f) |
| RewardBoosterNFT | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x748b4770D6685629Ed9faf48CFa81e3E4641A341) |
| BackchainRandomness | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x6eB891C2C7bC248EdDf31c77C4258205a37C4126) |

---

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      BACKCOIN PROTOCOL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌─────────────────────┐                     │
│                    │  EcosystemManager   │                     │
│                    │   (Central Hub)     │                     │
│                    └──────────┬──────────┘                     │
│                               │                                 │
│         ┌─────────────────────┼─────────────────────┐          │
│         │                     │                     │          │
│         ▼                     ▼                     ▼          │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐    │
│  │   BKC       │      │   Mining    │      │  Treasury   │    │
│  │   Token     │      │   Manager   │      │             │    │
│  └─────────────┘      └──────┬──────┘      └─────────────┘    │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         │                    │                    │            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐    │
│  │ Delegation  │      │  Fortune    │      │   Notary    │    │
│  │  Manager    │      │   Pool      │      │             │    │
│  └─────────────┘      └──────┬──────┘      └─────────────┘    │
│                              │                                  │
│                              ▼                                  │
│                       ┌─────────────┐                          │
│                       │ Randomness  │                          │
│                       │   Oracle    │                          │
│                       └──────┬──────┘                          │
│                              │                                  │
│                              ▼                                  │
│                       ┌─────────────┐                          │
│                       │   Stylus    │                          │
│                       │  Entropy    │                          │
│                       └─────────────┘                          │
│                                                                 │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐    │
│  │  Reward     │      │  NFT Pool   │      │   Rental    │    │
│  │ Booster NFT │◄────►│   Factory   │      │   Manager   │    │
│  └─────────────┘      └─────────────┘      └─────────────┘    │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         │         │         │         │          │            │
│         ▼         ▼         ▼         ▼          ▼            │
│     Diamond  Platinum   Gold    Silver  Bronze...             │
│      Pool      Pool     Pool    Pool    Pool                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification Status

All contracts are verified on Arbiscan:

| Contract | Verified | Proxy |
|----------|----------|-------|
| BKC Token | ✅ | UUPS |
| EcosystemManager | ✅ | UUPS |
| MiningManager | ✅ | UUPS |
| DelegationManager | ✅ | UUPS |
| FortunePool | ✅ | UUPS |
| DecentralizedNotary | ✅ | UUPS |
| RentalManager | ✅ | UUPS |
| RewardBoosterNFT | ✅ | UUPS |
| BackchainRandomness | ✅ | — |
| StylusEntropy | ✅ | — |
| NFT Pool Factory | ✅ | — |
| All NFT Pools | ✅ | — |

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

*This document is part of Backcoin Protocol's public documentation. All contracts are verified on Arbiscan.*
