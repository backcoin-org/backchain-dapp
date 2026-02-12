# Contract Addresses

All Backcoin contracts are deployed on **Arbitrum Sepolia** (Chain ID: `421614`).

Every contract listed below (except the Faucet) is fully immutable — no admin can pause, upgrade, or modify them. The only configurable contract is BackchainEcosystem, which controls fee parameters and is subject to progressive decentralization through governance.

## Core Contracts

| Contract | Address | Operator Support |
|----------|---------|:---:|
| BKC Token | `0x1c8B7951ae769871470e9a8951d01dB39AA34123` | — |
| BackchainEcosystem | `0xDC88493D0979AF22e2C387A2fFd5230c62551997` | — |
| Liquidity Pool | `0x32c80323dD73E2d30c0389Ea9fc6a0ad998770bF` | — |
| Staking Pool | `0xeA5D34520783564a736258a9fd29775c9c1C8E78` | Yes |
| Buyback Miner | `0xD0B684Be70213dFbdeFaecaFECB50232897EC843` | Yes |

## NFT Contracts

| Contract | Address | Operator Support |
|----------|---------|:---:|
| RewardBooster (ERC-721) | `0x5507F70c71b8e1C694841E214fe8F9Dd7c899448` | — |
| NFT Pool — Bronze | `0xeE0953171514608f8b8F7B5A343c8123b2BfE8bD` | Yes |
| NFT Pool — Silver | `0xA8e76C5E21235fC2889A25Dff0769fFf5C784639` | Yes |
| NFT Pool — Gold | `0xbcDc78a2C985722C170153015957Acb73df08F89` | Yes |
| NFT Pool — Diamond | `0x2d9fb50A5d147598fBb1151F75B8C3E261fb1Dea` | Yes |

## Service Contracts

| Contract | Address | Operator Support |
|----------|---------|:---:|
| Fortune Pool | `0x319bfC89f4d9F2364E7e454e4950ca6e440211ED` | Yes |
| Agora (Social) | `0x60088001DB6Ae83Bc9513426e415895802DBA39a` | Yes |
| Notary | `0x89DE7ea670CeEeEFA21e4dAC499313D3E0cfbB0e` | Yes |
| Charity Pool | `0x31E8B7F825610aFd3d5d25C11e9C062D27289BB2` | Yes |
| Rental Manager | `0xa2303db7e2D63398a68Ea326a3566bC92f129D44` | Yes |

## Governance & Utility

| Contract | Address | Operator Support |
|----------|---------|:---:|
| Governance | `0xA82F69f079566958c16F601A9625E40AeEeFbFf8` | — |
| BKC Faucet | `0xb80e5389b16693CAEe4655b535cc7Bceb4770255` | — |

## For Developers

```javascript
const CONTRACTS = {
    bkcToken:             "0x1c8B7951ae769871470e9a8951d01dB39AA34123",
    backchainEcosystem:   "0xDC88493D0979AF22e2C387A2fFd5230c62551997",
    liquidityPool:        "0x32c80323dD73E2d30c0389Ea9fc6a0ad998770bF",
    stakingPool:          "0xeA5D34520783564a736258a9fd29775c9c1C8E78",
    buybackMiner:         "0xD0B684Be70213dFbdeFaecaFECB50232897EC843",
    rewardBooster:        "0x5507F70c71b8e1C694841E214fe8F9Dd7c899448",
    pool_bronze:          "0xeE0953171514608f8b8F7B5A343c8123b2BfE8bD",
    pool_silver:          "0xA8e76C5E21235fC2889A25Dff0769fFf5C784639",
    pool_gold:            "0xbcDc78a2C985722C170153015957Acb73df08F89",
    pool_diamond:         "0x2d9fb50A5d147598fBb1151F75B8C3E261fb1Dea",
    fortunePool:          "0x319bfC89f4d9F2364E7e454e4950ca6e440211ED",
    agora:                "0x60088001DB6Ae83Bc9513426e415895802DBA39a",
    notary:               "0x89DE7ea670CeEeEFA21e4dAC499313D3E0cfbB0e",
    charityPool:          "0x31E8B7F825610aFd3d5d25C11e9C062D27289BB2",
    rentalManager:        "0xa2303db7e2D63398a68Ea326a3566bC92f129D44",
    simpleBkcFaucet:      "0xb80e5389b16693CAEe4655b535cc7Bceb4770255",
    backchainGovernance:  "0xA82F69f079566958c16F601A9625E40AeEeFbFf8",
};
```

## Operator Support

Contracts marked with **Yes** in the Operator Support column accept an `operator` parameter. When users interact through your frontend, pass your wallet address as the operator to earn a commission on every transaction.

Read the [Operator Guide](./BE_YOUR_OWN_CEO.md) to learn how to build and earn.

## Verification

All contracts are verified on [Arbiscan Sepolia](https://sepolia.arbiscan.io). You can read the source code, interact directly, and verify everything on-chain.

Compiler: Solidity 0.8.28 | Optimizer: runs=1, viaIR=true
