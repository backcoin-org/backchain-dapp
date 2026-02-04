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

## Unstoppable & Permissionless DeFi Infrastructure

*Built by the Community. For the Community. Impossible to Stop.*

---

## Our Philosophy

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    CODE IS LAW. MATH IS TRUTH. FREEDOM IS DEFAULT.                ║
║                                                                                   ║
║   Just as Voltaire fought for freedom of speech against powerful institutions,   ║
║   we build infrastructure for financial freedom against centralized control.     ║
║                                                                                   ║
║   No one can freeze your tokens.                                                 ║
║   No one can censor your transactions.                                           ║
║   No one can deny you access.                                                    ║
║   No one can stop the protocol.                                                  ║
║                                                                                   ║
║   As long as Ethereum exists, Backchain Protocol executes.                       ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

Backchain is more than a DeFi protocol — it's **infrastructure for freedom**. We build permissionless services that anyone can use, anyone can build on, and no one can stop.

---

## Be Your Own CEO — The Operator Economy

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    YOU ARE NOT A USER. YOU ARE A CEO.                             ║
║                                                                                   ║
║   Backchain Protocol doesn't have employees. It has OPERATORS.                   ║
║   Operators are CEOs of their own Web3 businesses.                               ║
║                                                                                   ║
║   Build an interface to Backchain Protocol and YOU become the CEO:               ║
║                                                                                   ║
║   - YOU decide what to build                                                     ║
║   - YOU design the user experience                                               ║
║   - YOU attract your own users                                                   ║
║   - YOU keep the commissions (BKC + ETH)                                         ║
║   - YOU answer to no one                                                         ║
║                                                                                   ║
║   No job interview. No approval process. No boss.                                ║
║   Just build and start earning. You are the CEO.                                 ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### How to Become a CEO

| Step | Action |
|------|--------|
| **1** | Build your own frontend, app, bot, or tool |
| **2** | Pass your wallet address as the `operator` parameter |
| **3** | Every transaction through YOUR interface pays YOU |

**That's it. No registration. No approval. No KYC. No partnership agreements.**

### Your Business Opportunities

| You Build | You Earn From |
|-----------|---------------|
| Casino / Gaming site | Every bet placed |
| Staking dashboard | Every stake, unstake, claim |
| Notary service | Every document certified |
| NFT marketplace | Every trade executed |
| Social media client | Every post, like, tip |
| Crowdfunding platform | Every donation |
| Rental marketplace | Every NFT rented |

### CEO vs Employee

| Aspect | Traditional Job | Backchain CEO |
|--------|-----------------|---------------|
| Startup cost | N/A | $0 |
| Permission needed | Job application | None |
| Income ceiling | Salary cap | Unlimited |
| Can be fired | Yes | Impossible |
| Own your business | No | 100% |
| Geographic limits | Yes | Global |

**Read more:** [BE_YOUR_OWN_CEO.md](./BE_YOUR_OWN_CEO.md)

---

## Backcoin Oracle — Free Randomness for Arbitrum

Our contribution to the Arbitrum ecosystem: **100% FREE randomness oracle** built in Rust/WASM using Arbitrum Stylus.

### Why This Matters

Most randomness solutions are expensive, complex, or require subscriptions. We built something different:

| Feature | Backcoin Oracle | Others |
|---------|-----------------|--------|
| **Cost** | FREE | $0.25+/request |
| **Speed** | Instant (1 TX) | 1-2 blocks delay |
| **Setup** | None | Subscription required |
| **Permission** | None needed | Registration required |
| **Can Be Stopped** | No | Depends |

```solidity
// Any Arbitrum developer can use this for FREE
IBackcoinOracle oracle = IBackcoinOracle(0x16346f5a45f9615f1c894414989f0891c54ef07b);
uint256[] memory results = oracle.get_numbers(1, 1, 100);
```

**Impact:** Every game, NFT project, lottery, or application needing randomness can use our oracle at zero cost. This is our gift to the Arbitrum ecosystem.

---

## The Ecosystem

### All Services — All Support Operators (CEOs)

| Service | Contract | Description | Be a CEO |
|---------|----------|-------------|----------|
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` | Native token (no freeze, no blacklist) | — |
| **Staking** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` | Lock BKC, earn rewards | Yes |
| **Fortune Pool** | `0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF` | Provably fair gaming | Yes |
| **Charity Pool** | `0x259271F3558bCa03Ddc8D7494CCF833751483Fb1` | Transparent crowdfunding | Yes |
| **Notary** | `0x2E56650a4f05D0f98787694c6C61603616716b48` | Document certification | Yes |
| **NFT Pools** | `0x2f63000539AAE2019Cc3d6E357295d903c1fF120` | AMM trading for NFTs | Yes |
| **Rentals** | `0x593A842d214516F216EB6E6E9A97cC84F42f6821` | NFT rentals | Yes |
| **Backchat** | `0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb` | Censorship-resistant social | Yes |
| **Oracle** | `0x16346f5a45f9615f1c894414989f0891c54ef07b` | FREE randomness | — |

---

## Immutable Guarantees

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   WHAT MAKES BACKCHAIN UNSTOPPABLE                                               ║
║   ════════════════════════════════                                               ║
║                                                                                   ║
║   NO ADMIN KEYS       - No one can change contract behavior                      ║
║   NO PAUSE FUNCTIONS  - No one can stop the protocol                             ║
║   NO BLACKLISTS       - No one can be censored                                   ║
║   NO FREEZE FUNCTIONS - No one can freeze your tokens                            ║
║   NO PROXY UPGRADES   - Code is final and immutable                              ║
║   FULLY VERIFIED      - All source code is public on Arbiscan                    ║
║                                                                                   ║
║   The only way to stop these contracts is to stop Ethereum itself.               ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Community-Driven Philosophy

### Built by Independent Developers

Backchain was created by **autonomous developers from the community** — crypto enthusiasts who believe in the transformative power of decentralization. No corporate backing, no venture capital, no external control.

### Our Commitment

| Principle | Our Position |
|-----------|--------------|
| **External Investors** | Refused — We declined all angel investor offers |
| **VC Funding** | Refused — No venture capital involvement |
| **Pre-sale** | None — Zero tokens sold before launch |
| **Team Allocation** | 0% — Developers earn like everyone else |
| **Admin Keys** | None — Cannot change or stop the protocol |
| **Community Funding** | Only — Self-funded and community-supported |

### Why We Refuse External Funding

We have **refused all partnerships and investments** that could compromise the protocol. Accepting investor money would:

- Create privileged insiders who can exit at users' expense
- Introduce pressure to add "admin functions" for investor protection
- Compromise our commitment to true decentralization
- Make the protocol stoppable

**We chose freedom over funding.**

---

## Tokenomics

### Total Supply: 200,000,000 BKC (Fixed Forever)

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   TOKEN DISTRIBUTION                                                              ║
║   ══════════════════                                                              ║
║                                                                                   ║
║   TGE (Initial): 40,000,000 BKC (20%)                                            ║
║   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║
║           (Community, NFT Pools, DEX, Gaming - zero for team)                    ║
║                                                                                   ║
║   Activity Rewards: 160,000,000 BKC (80%)                                        ║
║   ░░░░░░░░████████████████████████████████████████████████████████████████████░  ║
║           (Released ONLY through ecosystem activity - not pre-minted)            ║
║                                                                                   ║
║   80% goes to USERS and OPERATORS (CEOs) who actually use the protocol.          ║
║   NOT to VCs. NOT to insiders. NOT to team.                                      ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### TGE Distribution (40,000,000 BKC)

| Allocation | Amount | % of TGE | Purpose |
|------------|--------|----------|---------|
| **Community Airdrop** | 14,000,000 | 35% | Two-phase distribution |
| **NFT Pool Liquidity** | 7,000,000 | 17.5% | Enable instant NFT trading |
| **DEX Liquidity** | 7,000,000 | 17.5% | Camelot/Uniswap pairs |
| **Strategic Reserve** | 10,000,000 | 25% | Future growth |
| **Fortune Pool Prize** | 2,000,000 | 5% | Gaming liquidity |
| **Developer/Team** | **0** | **0%** | **ZERO tokens to team** |

### Activity Rewards Distribution

When users pay fees, rewards flow to:

| Recipient | Description |
|-----------|-------------|
| **Operators (CEOs)** | Anyone who builds interfaces and attracts users |
| **Stakers** | Users who stake BKC |
| **Treasury** | Protocol development |

**No activity = No release = No inflation.** Tokens are EARNED, not printed.

---

## Verified Contracts (Arbitrum Sepolia)

### Core Infrastructure

| Contract | Address | Be a CEO |
|----------|---------|----------|
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` | — |
| **EcosystemManager** | `0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407` | — |
| **MiningManager** | `0x7755982411244791d2DA96cBa04d08df72Be43C1` | Yes |
| **Treasury** | `0xc93030333E3a235c2605BcB7C7330650B600B6D0` | — |
| **Governance** | `0x157e08d5F5a776A530227f548d0f0C47682b7A3E` | — |

### DeFi Services

| Contract | Address | Be a CEO |
|----------|---------|----------|
| **DelegationManager** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` | Yes |
| **FortunePool** | `0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF` | Yes |
| **CharityPool** | `0x259271F3558bCa03Ddc8D7494CCF833751483Fb1` | Yes |

### Utility Services

| Contract | Address | Be a CEO |
|----------|---------|----------|
| **DecentralizedNotary** | `0x2E56650a4f05D0f98787694c6C61603616716b48` | Yes |
| **RentalManager** | `0x593A842d214516F216EB6E6E9A97cC84F42f6821` | Yes |
| **Backchat** | `0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb` | Yes |

### NFT System

| Contract | Address | Be a CEO |
|----------|---------|----------|
| **RewardBoosterNFT** | `0xf2EA307686267dC674859da28C58CBb7a5866BCf` | — |
| **NFT Pool Factory** | `0x2f63000539AAE2019Cc3d6E357295d903c1fF120` | — |
| **Diamond Pool** | `0x5C5590458689a11731c8bAD8BDf5D8f1D7Ffe020` | Yes |
| **Gold Pool** | `0x9390e12c910C4d2E0796FA754e5C450969F09886` | Yes |
| **Silver Pool** | `0x016549ee056442eC30a916335f66ad5183E3fF5b` | Yes |
| **Bronze Pool** | `0x74eB5CF86B43517cd27f48A06abb8A521aDA63b8` | Yes |

### Randomness (FREE!)

| Contract | Address |
|----------|---------|
| **Backcoin Oracle** | `0x16346f5a45f9615f1c894414989f0891c54ef07b` |

### Utilities

| Contract | Address |
|----------|---------|
| **Faucet** | `0x954acE43508AC8Ee1C5509F0ee1Fe65b81C3fc90` |

---

## Why We Chose Arbitrum

| Reason | Why It Matters |
|--------|----------------|
| **Stylus** | Only chain where our Rust oracle is possible |
| **Security** | Battle-tested Layer 2 with Ethereum's security |
| **Low Fees** | Enables micro-transactions and accessibility |
| **Transparency** | Open governance, honest communication |
| **Ecosystem** | Strong developer community |

**We believe in Arbitrum's vision** — and we're here to contribute, not just extract value.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Quick Start](./QUICK_START.md) | Get started in 5 minutes |
| [**Be Your Own CEO**](./BE_YOUR_OWN_CEO.md) | **Become an operator and earn** |
| [Contracts](./CONTRACTS.md) | All addresses |
| [BKC Token](./BKC_TOKEN.md) | Token details |
| [Fees](./FEES.md) | All fee schedules |
| [Staking](./STAKING.md) | DelegationManager details |
| [Activity Rewards](./MINING.md) | Reward distribution |
| [Fortune Pool](./FORTUNE_POOL.md) | Gaming mechanics |
| [Notary](./NOTARY.md) | Document certification |
| [NFT Pools](./NFT_LIQUIDITY_POOLS.md) | AMM trading |
| [Rentals](./RENTAL.md) | NFT rentals |
| [Backchat](./BACKCHAT.md) | Social network |
| [Charity](./CHARITY.md) | Crowdfunding |
| [**Oracle**](./BACKCOIN_ORACLE.md) | **Free randomness** |

---

## Links

| Channel | Link |
|---------|------|
| Website | [backcoin.org](https://backcoin.org) |
| Email | dev@backcoin.org |
| Twitter | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |
| LinkedIn | [linkedin.com/in/backcoin](https://www.linkedin.com/in/backcoin/) |
| Instagram | [instagram.com/backcoin.bkc](https://www.instagram.com/backcoin.bkc/) |

---

## License

MIT License — The code is free, just like the protocol.

---

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                          BACKCHAIN PROTOCOL                                       ║
║                                                                                   ║
║   This is not just a protocol. It's a statement.                                 ║
║                                                                                   ║
║   A statement that financial infrastructure should be permissionless.            ║
║   A statement that anyone can be a CEO, not just an employee.                    ║
║   A statement that code, once deployed, should be unstoppable.                   ║
║                                                                                   ║
║   We built this for the developer who wants to build and earn.                   ║
║   We built this for the entrepreneur who wants to be their own boss.             ║
║   We built this for the freelancer who needs tools without gatekeepers.          ║
║   We built this for everyone who believes in financial freedom.                  ║
║                                                                                   ║
║   You are not a user. You are a potential CEO.                                   ║
║   Build an interface. Earn commissions. Answer to no one.                        ║
║                                                                                   ║
║   No one can freeze it. No one can censor it. No one can stop it.                ║
║                                                                                   ║
║                        THE PROTOCOL IS UNSTOPPABLE.                               ║
║                        YOUR BUSINESS IS UNSTOPPABLE.                              ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

**Built by the Community • For the Community • On Arbitrum**

**Unstoppable • Permissionless • Be Your Own CEO • Free Oracle**
