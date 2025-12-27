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

**Document:** Tokenomics — Complete Economic Model  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# Tokenomics

## Token Overview

| Property | Value |
|----------|-------|
| **Name** | Backcoin |
| **Symbol** | BKC |
| **Network** | Arbitrum |
| **Standard** | ERC-20 |
| **Decimals** | 18 |
| **Max Supply** | 200,000,000 BKC (Fixed, Capped Forever) |
| **Contract** | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` |

---

## Supply Distribution

### Total Supply: 200,000,000 BKC

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TOKEN DISTRIBUTION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TGE (Initial):         40,000,000 BKC  (20%)                      │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  └─ Available at launch                                            │
│                                                                     │
│  Activity Rewards:     160,000,000 BKC  (80%)                      │
│  ░░░░░░░░████████████████████████████████████████████████████████  │
│  └─ Released through ecosystem usage (not pre-minted)              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## TGE Distribution (40,000,000 BKC)

Tokens minted and distributed at Token Generation Event:

| Allocation | Amount | % of TGE | Purpose |
|------------|--------|----------|---------|
| **Community Airdrop** | 14,000,000 | 35% | Two-phase community distribution |
| **NFT Pool Liquidity** | 7,000,000 | 17.5% | 1M per tier (7 pools) |
| **DEX Liquidity** | 7,000,000 | 17.5% | Camelot/Uniswap trading pairs |
| **Strategic Reserve** | 10,000,000 | 25% | Future CEX listings |
| **Fortune Pool Prize** | 2,000,000 | 5% | Gaming prize pool |
| **Developer/Team** | **0** | **0%** | **Nothing** |
| **Private Sale** | **0** | **0%** | **Nothing** |
| **VC Allocation** | **0** | **0%** | **Nothing** |

### Visual Breakdown

```
TGE: 40,000,000 BKC (100%)

Community Airdrop     ████████████████████████████████████  35%  (14M)
NFT Pool Liquidity    █████████████████░░░░░░░░░░░░░░░░░░░  17.5% (7M)
DEX Liquidity         █████████████████░░░░░░░░░░░░░░░░░░░  17.5% (7M)
Strategic Reserve     █████████████████████████░░░░░░░░░░░  25%   (10M)
Fortune Pool Prize    █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  5%    (2M)
Developer/Team        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0%    (0)
```

---

## Community Airdrop (14,000,000 BKC)

### Two-Phase Distribution

| Phase | Amount | Criteria |
|-------|--------|----------|
| **Phase 1** | 7,000,000 BKC | Early testnet participants, community contributors |
| **Phase 2** | 7,000,000 BKC | Mainnet early adopters, active users |

### Why 35% to Community?

- Ensures wide distribution from day one
- Rewards early supporters and testers
- Creates decentralized holder base
- No insider advantages

---

## NFT Pool Liquidity (7,000,000 BKC)

### Distribution Per Pool

| Pool | Tier | Amount | Contract |
|------|------|--------|----------|
| Diamond | 70% discount | 1,000,000 BKC | `0xD4393350bd00ef6D4509D43c6dB0E7010bB5c3d9` |
| Platinum | 60% discount | 1,000,000 BKC | `0x76Edd1f3c42f607a92b9354D14F5F25278403808` |
| Gold | 50% discount | 1,000,000 BKC | `0xE9354654c97Fa5CDe3931c53a72aBEdC688ab01B` |
| Silver | 40% discount | 1,000,000 BKC | `0x57Bc7500213DAAfb0176E04B4Cce19cE19E145d4` |
| Bronze | 30% discount | 1,000,000 BKC | `0x9eFB21b279873D04e337c371c90fF00130aB8581` |
| Iron | 20% discount | 1,000,000 BKC | `0x99259cF2cE5158fcC995aCf6282574f6563a048e` |
| Crystal | 10% discount | 1,000,000 BKC | `0xe7Ae6A7B48460b3c581158c80F67E566CC800271` |

---

## Activity Rewards (160,000,000 BKC)

### How It Works

These tokens are **NOT pre-minted**. They are released only when users actively use the ecosystem:

```
User uses service → Pays fee → Activity rewards released proportionally
```

### Release Mechanism

The release rate decreases as more tokens enter circulation:

```
Release Rate = Remaining Supply / 160,000,000

Example at different stages:
┌────────────────────────────────────────────────────────────────┐
│ Released So Far │ Remaining │ Rate  │ 100 BKC fee releases   │
├─────────────────┼───────────┼───────┼────────────────────────┤
│ 0               │ 160M      │ 100%  │ 100 BKC                │
│ 40M             │ 120M      │ 75%   │ 75 BKC                 │
│ 80M             │ 80M       │ 50%   │ 50 BKC                 │
│ 120M            │ 40M       │ 25%   │ 25 BKC                 │
│ 160M            │ 0         │ 0%    │ 0 BKC (complete)       │
└────────────────────────────────────────────────────────────────┘
```

### Why This Model?

| Benefit | Explanation |
|---------|-------------|
| **Not Inflationary** | Rate decreases over time, reaches zero |
| **Activity-Based** | Only real usage releases tokens |
| **No Free Rewards** | Users must pay for actual services |
| **Self-Limiting** | Cannot release more than 160M ever |
| **Predictable** | Simple formula, fully transparent |

---

## Fee Distribution

All fees collected flow through MiningManager and are distributed:

```
Fee Collected
      │
      ▼
┌─────────────────┐
│  MiningManager  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌─────────┐
│Stakers│ │Treasury │
└───────┘ └─────────┘
```

### Distribution Ratios

Current configuration (adjustable via EcosystemManager):

| Recipient | Share | Purpose |
|-----------|-------|---------|
| **Stakers** | Configurable | Rewards for long-term holders |
| **Treasury** | Configurable | Operations, development, marketing |

**Note:** Ratios can be adjusted based on ecosystem needs without contract redeployment.

---

## Why Zero for Developers?

### Our Philosophy

We are a group of crypto enthusiasts building what we believe in. We chose to allocate **zero tokens** to ourselves because:

1. **Trust:** No insider dump risk
2. **Alignment:** We succeed only if the protocol succeeds
3. **Fairness:** Same opportunities as any community member
4. **Credibility:** Actions speak louder than words

### How We Benefit

- Use the protocol like any other user
- Earn through staking like everyone else
- Build reputation through successful delivery
- Pride in creating something meaningful

---

## Sustainability

### Not a Circular Economy

**The concern:** "Users get rewards for using the protocol, creating circular economy."

**Our response:**

| Service | External Value | Real-World Demand |
|---------|---------------|-------------------|
| Notary | Document certification | Businesses, legal, compliance |
| Gaming | Entertainment | Gamers, casual users |
| NFT Pools | Asset trading | Collectors, traders |
| Rentals | Asset utilization | Anyone needing temporary access |
| Oracle | Infrastructure | Developers (free public good) |

### Revenue Sources

External value enters the ecosystem through:

1. **Businesses** paying for notarization
2. **Gamers** paying for entertainment
3. **Traders** paying for NFT transactions
4. **Renters** paying for temporary NFT access
5. **New users** buying BKC to access services

### Long-Term Viability

| Phase | Activity Rewards | Fee Revenue | Model |
|-------|------------------|-------------|-------|
| Early | High release rate | Growing | Bootstrap |
| Growth | Medium release rate | Established | Expansion |
| Mature | Low release rate | Stable | Sustainable |
| Final | Zero release | Primary income | Self-sustaining |

After all 160M activity rewards are released, the protocol continues operating purely on fee redistribution.

---

## Token Utility

### Where BKC is Used

| Service | Use Case |
|---------|----------|
| **Staking** | Lock tokens to earn protocol fees |
| **Fortune Pool** | Wager on predictions |
| **NFT Pools** | Buy/sell Booster NFTs |
| **Notary** | Pay for document certification |
| **Rentals** | Pay rental fees |
| **Governance** | Vote on proposals (coming soon) |

### Demand Drivers

| Driver | Effect |
|--------|--------|
| Staking | Reduces circulating supply |
| NFT purchases | Continuous demand |
| Service fees | Constant utility demand |
| Fee discounts | Incentive to hold NFTs |
| Governance | Long-term holding incentive |

---

## Key Addresses

| Contract | Address |
|----------|---------|
| BKC Token | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` |
| MiningManager | `0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB` |
| DelegationManager | `0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701` |
| EcosystemManager | `0xF7c16C935d70627cf7F94040330C162095b8BEb1` |
| Treasury | `0xc93030333E3a235c2605BcB7C7330650B600B6D0` |

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

*This document is part of Backcoin Protocol's public documentation. All data is verifiable on-chain.*
