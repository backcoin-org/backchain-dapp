# Tokenomics

This document explains the complete economic model of the Backcoin ecosystem — how value is created, distributed, and sustained.

## Supply Overview

| Metric | Value |
|--------|-------|
| Max Supply | 200,000,000 BKC |
| Initial (TGE) | 40,000,000 BKC (20%) |
| Activity Rewards | 160,000,000 BKC (80%) |
| Team Allocation | 0% |
| VC/Private Sale | 0% |

**Why zero team allocation?** Backcoin is designed to be truly permissionless. The protocol earns through the same mechanisms available to everyone — operator commissions, staking, and participation. The team has no special privileges.

## TGE Distribution (40M BKC)

The initial 40M tokens are used for:

- **Liquidity Pool** — Seed ETH/BKC trading pair so users can swap from day one
- **Faucet** — Free BKC for new users to get started
- **Ecosystem Growth** — Community campaigns, airdrops, partnerships

No tokens are locked or vested for insiders. Everything goes toward making the platform usable.

## Activity Rewards (160M BKC)

The remaining 160M BKC are released through the Buyback Miner based on real protocol usage:

1. Users generate ETH fees through normal activity
2. ETH accumulates in the ecosystem contract
3. The Buyback Miner converts ETH to BKC rewards + mints new BKC
4. Rewards go to stakers proportional to their delegation power

### Scarcity Curve

The minting rate decreases as supply grows:

```
Mining Rate = (200M - Current Supply) / 160M

Supply 40M  → Rate 100% (maximum rewards)
Supply 80M  → Rate 75%
Supply 120M → Rate 50%
Supply 160M → Rate 25%
Supply 200M → Rate 0% (cap reached, pure real yield)
```

This creates natural scarcity. Early participants benefit from higher mining rates, but the rewards never stop — once the cap is reached, stakers still earn from buybacks (real ETH converted to BKC).

## Fee Structure

Backcoin uses a dual-fee model. Every action generates two types of fees:

### ETH Fees (Gas-Based)
Calculated based on network gas prices. Split between:
- **Operator** — Commission for the frontend builder
- **Referrer** — Reward for bringing the user
- **Treasury** — Protocol operational funds
- **Buyback** — Accumulated for the mining cycle

### BKC Fees (Value-Based)
Applied as a percentage of the BKC amount involved. Split between:
- **Burn** — Permanently removed from circulation
- **Stakers** — Added to the reward pool
- **Treasury** — Protocol operational funds

See the full [Fee Schedule](./FEES.md) for details on each service.

## Deflationary Mechanisms

Multiple forces reduce BKC supply over time:

| Mechanism | How It Works |
|-----------|-------------|
| **Staking Burn** | Up to 50% of rewards burned on claim (reduced with NFT Boosters) |
| **Buyback Burn** | 5% of each mining cycle is burned |
| **Fortune Pool** | 20% BKC fee includes burn component |
| **Voluntary Burn** | Anyone can burn their own tokens at any time |
| **Force Unstake** | 10% penalty burned when breaking a time-lock early |

As the ecosystem grows, more BKC is burned than minted, creating deflationary pressure.

## Value Cycle

Here's how everything connects:

```
Users do things (stake, play, trade, post)
    ↓
ETH fees generated
    ↓
Buyback Miner converts ETH → buys BKC + mints new BKC
    ↓
5% of BKC burned (deflationary)
    ↓
95% sent to Staking Pool as rewards
    ↓
Stakers claim rewards (up to 50% burned unless they have NFT Booster)
    ↓
More users attracted by rewards → more activity → more fees
```

The loop is self-reinforcing. More users means more fees, more buybacks, more rewards, and more token burns. Everyone who participates — users, stakers, operators, liquidity providers — benefits from the growth.

## Operator Economics

Operators (frontend builders) earn a percentage of ETH fees on every transaction their users make. This is automatic and requires no approval:

1. Build your own Backcoin frontend
2. Pass your wallet as the `operator` parameter on transactions
3. Earn commissions on every user action

The operator system means Backcoin can grow without centralized marketing. Builders are incentivized to bring users because they directly profit from it.

See the [Operator Guide](./BE_YOUR_OWN_CEO.md) for details.

## Key Addresses

| Contract | Address |
|----------|---------|
| BKC Token | `0x1c8B7951ae769871470e9a8951d01dB39AA34123` |
| Ecosystem | `0xDC88493D0979AF22e2C387A2fFd5230c62551997` |
| Staking Pool | `0xeA5D34520783564a736258a9fd29775c9c1C8E78` |
| Buyback Miner | `0xD0B684Be70213dFbdeFaecaFECB50232897EC843` |
| Liquidity Pool | `0x32c80323dD73E2d30c0389Ea9fc6a0ad998770bF` |

See also: [BKC Token](./BKC_TOKEN.md) | [Mining](./MINING.md) | [Staking](./STAKING.md) | [Fee Schedule](./FEES.md)
