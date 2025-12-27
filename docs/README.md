# Backcoin Protocol

**Modular DeFi Infrastructure for Real-World Utility on Arbitrum**

---

## What is Backcoin?

Backcoin is a **modular ecosystem** of interconnected DeFi services built exclusively on Arbitrum. Each module solves a real problem and can operate independently or integrate with others.

We're not building another token—we're building **infrastructure** that creates value for Arbitrum.

---

## The Problem We Solve

Most DeFi projects create circular economies where tokens only have value within their own ecosystem. Backcoin takes a different approach:

**External Value Capture:**
- Notary service: Businesses pay to certify documents (real-world demand)
- NFT Rentals: Asset utilization creates new revenue streams
- Gaming: Entertainment value attracts users beyond DeFi natives
- Oracle: Free randomness service benefits the entire Arbitrum ecosystem

**Not Circular:**
- Rewards come from fees paid for actual services
- External users (businesses, gamers, developers) bring new capital
- Each service has standalone utility regardless of token price

---

## Our Contribution to Arbitrum

### 1. Free Randomness Oracle for Everyone

We built **BackchainRandomness**—a free, instant randomness oracle using Arbitrum Stylus (Rust/WASM). Any developer on Arbitrum can use it at no cost.

**Technical Innovation:**
- First hybrid Stylus + Solidity randomness solution
- Combines Rust entropy, block.prevrandao, and transaction mixing
- No callback delays, no fees, no VRF subscriptions
- Single transaction resolution

```solidity
// Any Arbitrum developer can use this for free
IBackchainRandomness oracle = IBackchainRandomness(0x6eB891C2C7bC248EdDf31c77C4258205a37C4126);
uint256 random = oracle.getRandomNumber(msg.sender, userSeed, maxValue);
```

**Impact:** Reduces barrier for games, NFT projects, and any application needing randomness on Arbitrum.

### 2. Stylus Showcase

Our StylusEntropy contract demonstrates Arbitrum Stylus capabilities:
- Written in Rust, compiled to WASM
- Runs alongside Solidity contracts
- Proves Stylus is production-ready

**Contract:** `0xb6bb5e9c9df36fa9504d87125af0e4b284b55092`

### 3. New Users to Arbitrum

Every service we offer brings users who may never have used Arbitrum:
- **Notary:** Businesses needing document certification
- **Gaming:** Casual users seeking entertainment
- **NFT Rentals:** Asset owners wanting passive income

---

## Architecture

### Hub & Spoke Model

```
                         ┌─────────────────────┐
                         │  EcosystemManager   │
                         │    (Central Hub)    │
                         └──────────┬──────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
    │   Staking   │          │   Gaming    │          │   Utility   │
    │   Module    │          │   Module    │          │   Module    │
    └─────────────┘          └─────────────┘          └─────────────┘
           │                        │                        │
           ▼                        ▼                        ▼
    DelegationManager         FortunePool            DecentralizedNotary
                                   │                  RentalManager
                                   ▼
                          BackchainRandomness
                          (Free for Arbitrum)
```

**Why This Matters:**
- Each module can be upgraded independently
- New services plug into existing infrastructure
- Configuration changes don't require redeployment
- Third-party developers can build on our modules

### This is Just the Beginning

The modular architecture enables unlimited expansion. Future modules planned:

| Phase | Modules | Status |
|-------|---------|--------|
| **Current** | Staking, Gaming, Notary, NFT Pools, Rentals | ✅ Live on Testnet |
| **Phase 2** | Governance DAO, Yield Aggregator | 🔜 Planned |
| **Phase 3** | Crypto Debit Card, Lending/Borrowing | 📋 Roadmap |
| **Phase 4** | Exchange Integration, Cross-chain Bridge | 🎯 Vision |
| **Future** | Insurance, Real Estate Tokenization, Supply Chain | 💡 Possibilities |

The infrastructure we're building today supports all of this tomorrow.

---

## Services

### BKC Token
Native utility token with capped supply (200M max). Used across all services for fees, staking, and rewards.

### Staking (DelegationManager)
Lock BKC to earn share of protocol fees. Longer locks = higher rewards through pStake multiplier.

### Fortune Pool
Provably fair prediction game using our free randomness oracle. Multiple game modes with transparent odds.

### Decentralized Notary
Blockchain-based document certification. Each notarization mints an NFT certificate with timestamp proof.

### NFT Liquidity Pools
AMM-style instant trading for Reward Booster NFTs. Seven tiers with bonding curve pricing.

### AirBNFT (Rental Manager)
Rent NFTs for temporary utility access. Owners earn passive income, renters access benefits without buying.

### Reward Booster NFTs
Utility NFTs providing fee discounts (10-70%) across all services. Seven tiers from Crystal to Diamond.

---

## Tokenomics

### Total Supply: 200,000,000 BKC (Fixed Cap)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TOKEN DISTRIBUTION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TGE (Initial): 40,000,000 BKC (20%)                               │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                                     │
│  Activity Rewards: 160,000,000 BKC (80%)                           │
│  ░░░░░░░░████████████████████████████████████████████████████████  │
│          (Released only through ecosystem activity)                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### TGE Distribution (40,000,000 BKC)

| Allocation | Amount | % of TGE | Purpose |
|------------|--------|----------|---------|
| **Community Airdrop** | 14,000,000 | 35% | Two-phase distribution |
| **NFT Pool Liquidity** | 7,000,000 | 17.5% | 1M per tier (7 pools) |
| **Fortune Pool Prize** | 2,000,000 | 5% | Gaming liquidity |
| **DEX Liquidity** | 7,000,000 | 17.5% | Camelot/Uniswap pairs |
| **Strategic Reserve** | 10,000,000 | 25% | Future CEX listings |
| **Developer/Team** | **0** | **0%** | **Nothing** |

### Activity Rewards (160,000,000 BKC)

These tokens are **not pre-minted**. They are released only when users actively use the ecosystem:

- User pays fee for service → New tokens released proportionally
- Release rate decreases as more tokens enter circulation
- Formula: `releaseRate = remainingSupply / 160M`
- Eventually reaches zero (no infinite inflation)

**This is not mining in the traditional sense.** Users don't "mine" by clicking buttons. They earn rewards naturally by using real services that have standalone value.

---

## Sustainability Model

### Addressing the "Circular Economy" Concern

**The Criticism:** "Rewards are issued for protocol interaction, creating circular economy."

**Our Response:**

**1. External Revenue Sources**

| Service | External Value | Who Pays |
|---------|---------------|----------|
| Notary | Document certification | Businesses, legal entities |
| Gaming | Entertainment | Casual users, gamers |
| NFT Pools | Asset trading | Collectors, investors |
| Rentals | Asset utilization | Anyone needing temporary access |
| Oracle | Infrastructure | Developers (free, but brings users) |

**2. Services Work Without Token Speculation**

- Notary: Certify a document regardless of BKC price
- Gaming: Play for entertainment regardless of BKC price
- Rentals: Rent an NFT for utility regardless of BKC price

**3. No Guaranteed Returns**

- We don't promise APY percentages
- Rewards scale with actual ecosystem usage
- If nobody uses services, no rewards are generated

**4. Deflationary Pressure**

- Activity reward rate decreases over time
- Max supply is capped at 200M forever
- After all 160M activity rewards are released, only fee redistribution continues

### Configurable Economics

All fee parameters are adjustable through EcosystemManager:
- Fee percentages can be tuned based on market conditions
- Distribution ratios adaptable to ecosystem needs
- No hardcoded values that can't be changed

---

## Technical Credibility

### Verified Contracts (Arbitrum Sepolia)

| Contract | Address | Verified |
|----------|---------|----------|
| EcosystemManager | `0xF7c16C935d70627cf7F94040330C162095b8BEb1` | ✅ |
| BKC Token | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` | ✅ |
| MiningManager | `0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB` | ✅ |
| DelegationManager | `0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701` | ✅ |
| FortunePool | `0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631` | ✅ |
| DecentralizedNotary | `0x5C9C0a696a555a2a594130014041dc4320Ba7Eb9` | ✅ |
| RentalManager | `0xD387B3Fd06085676e85130fb07ae06D675cb201f` | ✅ |
| RewardBoosterNFT | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` | ✅ |
| BackchainRandomness | `0x6eB891C2C7bC248EdDf31c77C4258205a37C4126` | ✅ |
| StylusEntropy | `0xb6bb5e9c9df36fa9504d87125af0e4b284b55092` | ✅ |
| NFT Pool Factory | `0x0bcaB4cA1Fac9f6eFE3Db1849E8E03e88B3D9423` | ✅ |

### Who We Are

We are a group of **crypto enthusiasts** who want to leave our mark on the blockchain world. No corporate backing, no venture capital, no external developers—just passionate builders who believe in what we're creating.

**Our Principles:**
- **No Pre-sale:** Zero tokens sold before launch
- **No VC Allocation:** No investors with privileged access
- **No Team Tokens:** 0% allocated to developers
- **Community-Driven:** Built by the community, for the community
- **Participatory Development:** Open source, open contribution

### Development

- **3+ years** of development
- **Complete working product** on testnet
- **All contracts verified** on Arbiscan
- **Open source** codebase
- **Self-funded:** Built with personal resources and dedication

---

## Why Arbitrum?

| Reason | Explanation |
|--------|-------------|
| **Stylus** | Only chain where our Rust oracle is possible |
| **Low Fees** | Enables micro-transactions (1 BKC notary fee) |
| **Speed** | Instant game resolution in Fortune Pool |
| **Ecosystem** | Integration with Camelot, GMX, native DeFi |
| **Developer Tools** | Best-in-class tooling and documentation |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Tokenomics](./tokenomics/TOKENOMICS.md) | Complete economic model |
| [Fees](./tokenomics/FEES.md) | All fee schedules |
| [Staking](./modules/STAKING.md) | DelegationManager details |
| [Activity Rewards](./modules/MINING.md) | Reward distribution system |
| [Fortune Pool](./modules/FORTUNE_POOL.md) | Gaming mechanics |
| [Notary](./modules/NOTARY.md) | Document certification |
| [NFT Pools](./modules/NFT_LIQUIDITY_POOLS.md) | AMM trading |
| [Rentals](./modules/RENTAL.md) | AirBNFT system |
| [Oracle](./modules/BACKCHAIN_RANDOMNESS.md) | Free randomness |
| [Contracts](./developers/CONTRACTS.md) | All addresses |
| [Quick Start](./getting-started/QUICK_START.md) | Get started guide |

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

**Backcoin Protocol** — *Modular Infrastructure • Real Utility • Built on Arbitrum*
