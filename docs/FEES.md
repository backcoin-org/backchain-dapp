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

**Document:** Fees — Complete Fee Structure  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# Fee Structure

All fees in Backcoin Protocol are **transparent**, **on-chain**, and **configurable** through the EcosystemManager. This document details every fee across all services.

---

## Fee Philosophy

| Principle | Description |
|-----------|-------------|
| **Transparent** | All fees visible on-chain before any action |
| **Configurable** | Adjustable via EcosystemManager without redeployment |
| **Fair** | Discounts available through Reward Booster NFTs |
| **Sustainable** | Fees support protocol operations and staker rewards |

---

## Fee Distribution

All collected fees flow through MiningManager:

```
       User Pays Fee
            │
            ▼
    ┌───────────────┐
    │ MiningManager │
    └───────┬───────┘
            │
      ┌─────┴─────┐
      ▼           ▼
 ┌─────────┐ ┌─────────┐
 │ Stakers │ │Treasury │
 └─────────┘ └─────────┘
```

Distribution ratios are configurable and can be adjusted based on ecosystem needs.

---

## Staking Fees (DelegationManager)

**Contract:** `0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701`

| Action | Fee | Description |
|--------|-----|-------------|
| **Stake (Entry)** | Configurable | Fee when locking BKC |
| **Unstake (Exit)** | Configurable | Fee when unlocking after lock period |
| **Force Unstake** | Configurable | Penalty for early withdrawal |
| **Claim Rewards** | Configurable | Fee when claiming staking rewards |

### NFT Discounts on Staking

| NFT Tier | Discount |
|----------|----------|
| Diamond | 70% off |
| Platinum | 60% off |
| Gold | 50% off |
| Silver | 40% off |
| Bronze | 30% off |
| Iron | 20% off |
| Crystal | 10% off |

---

## Fortune Pool Fees

**Contract:** `0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631`

| Action | Fee | Description |
|--------|-----|-------------|
| **Play Game** | Configurable | Fee on each bet amount |
| **Claim Prize** | Configurable | Fee when withdrawing winnings |

### Game Odds

| Game Mode | Win Probability | Multiplier |
|-----------|-----------------|------------|
| Conservative | Higher | Lower |
| Balanced | Medium | Medium |
| Aggressive | Lower | Higher |

---

## Notary Fees (DecentralizedNotary)

**Contract:** `0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9`

| Action | Fee | Description |
|--------|-----|-------------|
| **Notarize Document** | Configurable | Fee per document certification |
| **Verify Document** | Free | Anyone can verify at no cost |

### What You Get

- NFT certificate minted to your wallet
- Immutable timestamp proof on Arbitrum
- Permanent blockchain record
- Verifiable by anyone, anytime

---

## NFT Pool Fees

**Factory Contract:** `0x0bcaB4cA1Fac9f6eFE3Db1849E8E03e88B3D9423`

| Action | Fee | Description |
|--------|-----|-------------|
| **Buy NFT** | Configurable | Fee when purchasing from pool |
| **Sell NFT** | Configurable | Fee when selling back to pool |

### Pool Addresses

| Tier | Discount | Pool Address |
|------|----------|--------------|
| Diamond | 70% | `0xD4393350bd00ef6D4509D43c6dB0E7010bB5c3d9` |
| Platinum | 60% | `0x76Edd1f3c42f607a92b9354D14F5F25278403808` |
| Gold | 50% | `0xE9354654c97Fa5CDe3931c53a72aBEdC688ab01B` |
| Silver | 40% | `0x57Bc7500213DAAfb0176E04B4Cce19cE19E145d4` |
| Bronze | 30% | `0x9eFB21b279873D04e337c371c90fF00130aB8581` |
| Iron | 20% | `0x99259cF2cE5158fcC995aCf6282574f6563a048e` |
| Crystal | 10% | `0xe7Ae6A7B48460b3c581158c80F67E566CC800271` |

### Bonding Curve Pricing

NFT prices are determined by AMM bonding curve:
- More NFTs in pool → Lower price
- Fewer NFTs in pool → Higher price
- Price adjusts automatically with each trade

---

## Rental Fees (RentalManager)

**Contract:** `0xD387B3Fd06085676e85130fb07ae06D675cb201f`

| Action | Fee | Description |
|--------|-----|-------------|
| **List NFT** | Configurable | Fee to list NFT for rental |
| **Rent NFT** | Configurable | Platform fee on rental price |
| **Rental Payment** | Set by Owner | Price set by NFT owner |

### How Rentals Work

1. Owner lists NFT with daily/weekly price
2. Renter pays rental fee + platform fee
3. Owner receives rental payment minus platform fee
4. Renter gets temporary NFT utility access

---

## Reward Booster NFT

**Contract:** `0x748b4770D6685629Ed9faf48CFa81e3E4641A341`

### Fee Discounts by Tier

Holding a Reward Booster NFT reduces fees across ALL protocol services:

| Tier | Discount | Rarity |
|------|----------|--------|
| **Diamond** | 70% | Ultra Rare |
| **Platinum** | 60% | Very Rare |
| **Gold** | 50% | Rare |
| **Silver** | 40% | Uncommon |
| **Bronze** | 30% | Common |
| **Iron** | 20% | Common |
| **Crystal** | 10% | Starter |

### Discount Example

If base fee is 100 BKC:

| Tier | Discount | You Pay |
|------|----------|---------|
| No NFT | 0% | 100 BKC |
| Crystal | 10% | 90 BKC |
| Iron | 20% | 80 BKC |
| Bronze | 30% | 70 BKC |
| Silver | 40% | 60 BKC |
| Gold | 50% | 50 BKC |
| Platinum | 60% | 40 BKC |
| Diamond | 70% | 30 BKC |

---

## Activity Rewards

**Contract:** `0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB`

When users pay fees, activity rewards are released from the 160M reserve:

```
Release Rate = Remaining Reserve / 160,000,000
```

| Reserve Status | Rate | 100 BKC fee triggers |
|----------------|------|----------------------|
| 160M remaining | 100% | 100 BKC released |
| 120M remaining | 75% | 75 BKC released |
| 80M remaining | 50% | 50 BKC released |
| 40M remaining | 25% | 25 BKC released |
| 0 remaining | 0% | 0 BKC released |

---

## Free Services

| Service | Cost | Notes |
|---------|------|-------|
| **Document Verification** | Free | Anyone can verify notarized documents |
| **Randomness Oracle** | Free | Any Arbitrum developer can use |
| **View Staking Stats** | Free | Check your position anytime |
| **View Pool Prices** | Free | Check NFT prices anytime |

---

## Fee Configuration

All fees are managed through EcosystemManager:

**Contract:** `0xF7c16C935d70627cf7F94040330C162095b8BEb1`

### Why Configurable?

| Reason | Benefit |
|--------|---------|
| **Market Adaptation** | Adjust to market conditions |
| **Community Governance** | Future DAO control |
| **Competitive Positioning** | Stay competitive with other protocols |
| **Emergency Response** | Quick adjustment if needed |

---

## Key Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| EcosystemManager | `0xF7c16C935d70627cf7F94040330C162095b8BEb1` | Fee configuration |
| MiningManager | `0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB` | Fee distribution |
| DelegationManager | `0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701` | Staking fees |
| FortunePool | `0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631` | Gaming fees |
| DecentralizedNotary | `0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9` | Notary fees |
| RentalManager | `0xD387B3Fd06085676e85130fb07ae06D675cb201f` | Rental fees |
| RewardBoosterNFT | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` | Fee discounts |
| Treasury | `0xc93030333E3a235c2605BcB7C7330650B600B6D0` | Fee recipient |

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

*This document is part of Backcoin Protocol's public documentation. All fees are verifiable on-chain.*
