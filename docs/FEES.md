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

**Document:** Fees — Transparent, On-Chain, Unstoppable  
**Version:** 2.0.0  
**Last Updated:** February 2026  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# Fee Structure

## Transparent Fees For a Trustless World

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    NO HIDDEN FEES. NO SURPRISES. NO TRICKS.                       ║
║                                                                                   ║
║   Every fee in Backchain Protocol is:                                            ║
║                                                                                   ║
║   ✅ TRANSPARENT    - Visible on-chain before any action                         ║
║   ✅ PREDICTABLE    - You know exactly what you'll pay                           ║
║   ✅ FAIR           - Same rules for everyone                                    ║
║   ✅ VERIFIABLE     - Check the smart contract yourself                          ║
║                                                                                   ║
║   No fine print. No hidden clauses. Just math.                                   ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

All fees in Backchain Protocol are **transparent**, **on-chain**, and **immutable**. This document details every fee across all services.

---

## 🌍 Become an Operator — Earn From Fees

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    BUILD INTERFACES. EARN COMMISSIONS.                            ║
║                                                                                   ║
║   Every fee collected in the protocol includes an OPERATOR SHARE.                ║
║                                                                                   ║
║   How it works:                                                                   ║
║   1. Build your own frontend, app, bot, or tool                                  ║
║   2. Pass your wallet address as the "operator" parameter                        ║
║   3. Earn a percentage of ALL fees from transactions through your interface      ║
║                                                                                   ║
║   No registration. No approval. No KYC. Just build and earn.                     ║
║                                                                                   ║
║   Example:                                                                        ║
║   User stakes 1000 BKC through YOUR interface → You earn operator commission     ║
║   User plays Fortune through YOUR app → You earn operator commission             ║
║   User notarizes through YOUR tool → You earn operator commission                ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 💰 Fee Distribution

All collected fees flow through MiningManager and are distributed transparently:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                              FEE FLOW                                             ║
║                                                                                   ║
║                          User Pays Fee                                            ║
║                               │                                                   ║
║                               ▼                                                   ║
║                      ┌─────────────────┐                                         ║
║                      │  MiningManager  │                                         ║
║                      └────────┬────────┘                                         ║
║                               │                                                   ║
║            ┌──────────────────┼──────────────────┐                               ║
║            │                  │                  │                               ║
║            ▼                  ▼                  ▼                               ║
║     ┌───────────┐      ┌───────────┐      ┌───────────┐                         ║
║     │ OPERATOR  │      │  STAKERS  │      │ TREASURY  │                         ║
║     │    ⚡     │      │           │      │           │                         ║
║     └───────────┘      └───────────┘      └───────────┘                         ║
║                                                                                   ║
║   ⚡ OPERATOR = Anyone who builds an interface (could be YOU!)                   ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📊 Staking Fees (DelegationManager)

**Contract:** `0x41B1B7940E06318e9b161fc64524FaE7261e8739`

| Action | Fee | Operator Earns | Description |
|--------|-----|----------------|-------------|
| **Stake** | ~1-5% | ⚡ Yes | Fee when locking BKC |
| **Unstake** | ~1-5% | ⚡ Yes | Fee when unlocking after lock period |
| **Force Unstake** | Higher | ⚡ Yes | Penalty for early withdrawal |
| **Claim Rewards** | Minimal | ⚡ Yes | Fee when claiming staking rewards |

### NFT Burn Reduction on Unstaking

Holding or renting a Reward Booster NFT **reduces the burn penalty** when unstaking:

| NFT Tier | Burn Reduction |
|----------|----------------|
| **Diamond** | 0% burn (no penalty) |
| **Gold** | 25% of normal burn |
| **Silver** | 35% of normal burn |
| **Bronze** | 50% of normal burn |
| No NFT | 50% burn penalty |

---

## 🎰 Fortune Pool Fees

**Contract:** `0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF`

| Action | Fee | Operator Earns | Description |
|--------|-----|----------------|-------------|
| **Commit Play** | Gas only | — | Commit your bet (V6 commit-reveal) |
| **Reveal Play** | ~5% of bet | ⚡ Yes | Reveal and resolve bet |
| **Claim Prize** | Minimal | ⚡ Yes | Withdraw winnings |

### Game Tiers

| Tier | Win Probability | Multiplier |
|------|-----------------|------------|
| Easy | 33.3% (1 in 3) | 2x |
| Medium | 10% (1 in 10) | 5x |
| Hard | 1% (1 in 100) | 50x |

---

## 📜 Notary Fees (DecentralizedNotary)

**Contract:** `0x2E56650a4f05D0f98787694c6C61603616716b48`

| Action | Fee | Operator Earns | Description |
|--------|-----|----------------|-------------|
| **Notarize Document** | BKC + ETH | ⚡ Yes | Certify document on-chain |
| **Verify Document** | **FREE** | — | Anyone can verify at no cost |

### What You Get

- ✅ NFT certificate minted to your wallet
- ✅ Immutable timestamp proof on Arbitrum
- ✅ Permanent blockchain record
- ✅ Verifiable by anyone, anytime, forever

---

## 💎 NFT Pool Fees

**Factory Contract:** `0x2f63000539AAE2019Cc3d6E357295d903c1fF120`

| Action | Fee | Operator Earns | Description |
|--------|-----|----------------|-------------|
| **Buy NFT** | ~5% BKC + ETH | ⚡ Yes | Purchase from pool |
| **Sell NFT** | ~10% BKC + ETH | ⚡ Yes | Sell back to pool |

### Pool Addresses

| Tier | Burn Reduction | Pool Address | Operator |
|------|----------------|--------------|----------|
| **Diamond** | 0% (no burn) | `0x5C5590458689a11731c8bAD8BDf5D8f1D7Ffe020` | ⚡ Yes |
| **Gold** | 25% burn | `0x9390e12c910C4d2E0796FA754e5C450969F09886` | ⚡ Yes |
| **Silver** | 35% burn | `0x016549ee056442eC30a916335f66ad5183E3fF5b` | ⚡ Yes |
| **Bronze** | 50% burn | `0x74eB5CF86B43517cd27f48A06abb8A521aDA63b8` | ⚡ Yes |

### Bonding Curve Pricing

NFT prices are determined by AMM bonding curve:
- More NFTs in pool → Lower price
- Fewer NFTs in pool → Higher price
- Price adjusts automatically with each trade
- **No manipulation possible** — math is law

---

## 🏠 Rental Fees (RentalManager)

**Contract:** `0x593A842d214516F216EB6E6E9A97cC84F42f6821`

| Action | Fee | Operator Earns | Description |
|--------|-----|----------------|-------------|
| **List NFT** | Gas only | — | List NFT for rental |
| **Rent NFT** | Platform % | ⚡ Yes | Fee on rental price |
| **Spotlight** | Variable | ⚡ Yes | Promote your listing |

### How Rentals Work

1. Owner lists NFT with daily/weekly price
2. Renter pays rental fee + platform fee
3. Owner receives rental payment minus platform fee
4. Renter gets temporary NFT utility access
5. **Operator earns commission** on all transactions

---

## 💬 Backchat Fees

**Contract:** `0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb`

| Action | Fee | Operator Earns | Description |
|--------|-----|----------------|-------------|
| **Create Post** | ~20% of gas | ⚡ Yes | Dynamic fee based on gas |
| **Reply** | ~20% of gas | ⚡ Yes | Reply with optional BKC tip |
| **Like** | ~20% of gas | ⚡ Yes | Like a post |
| **Super Like** | ≥0.0001 ETH | ⚡ Yes | Premium engagement |
| **Follow** | ~20% of gas | ⚡ Yes | Follow a user |
| **Profile Boost** | ≥0.0005 ETH | ⚡ Yes | Visibility boost |
| **Trust Badge** | 0.001 ETH | ⚡ Yes | Verified badge for 1 year |
| **Username** | 0-1 ETH | ⚡ Yes | Based on length |

### Username Pricing

| Length | Price |
|--------|-------|
| 1 char | 1 ETH |
| 2 chars | 0.2 ETH |
| 3 chars | 0.03 ETH |
| 4 chars | 0.004 ETH |
| 5 chars | 0.0005 ETH |
| 6 chars | 0.0001 ETH |
| 7+ chars | **FREE** |

### Backchat Fee Distribution

| With Creator | Split |
|--------------|-------|
| Creator | 40% |
| Operator | 30% |
| Treasury | 30% |

| Without Creator | Split |
|-----------------|-------|
| Operator | 60% |
| Treasury | 40% |

---

## 💚 Charity Pool Fees

**Contract:** `0x259271F3558bCa03Ddc8D7494CCF833751483Fb1`

| Action | Fee | Operator Earns | Description |
|--------|-----|----------------|-------------|
| **Create Campaign** | Gas only | — | Start a fundraiser |
| **Donate** | ~5% platform | ⚡ Yes | Donate to campaign |
| **Withdraw** | **0%** | — | 100% goes to beneficiary |

### Key Feature: 100% Withdrawal

In V6, campaign beneficiaries receive **100% of donations** — no penalties, no waiting periods, no hidden fees. The platform fee is only charged on the donation itself.

---

## 🎁 Activity Rewards

**Contract:** `0x7755982411244791d2DA96cBa04d08df72Be43C1`

When users pay fees, activity rewards are released from the 160M reserve:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   ACTIVITY REWARDS RELEASE RATE                                                   ║
║   ═════════════════════════════                                                   ║
║                                                                                   ║
║   Release Rate = Remaining Reserve / 160,000,000                                 ║
║                                                                                   ║
║   ┌────────────────────┬──────────┬─────────────────────────┐                    ║
║   │ Reserve Status     │ Rate     │ 100 BKC fee triggers    │                    ║
║   ├────────────────────┼──────────┼─────────────────────────┤                    ║
║   │ 160M remaining     │ 100%     │ 100 BKC released        │                    ║
║   │ 120M remaining     │ 75%      │ 75 BKC released         │                    ║
║   │ 80M remaining      │ 50%      │ 50 BKC released         │                    ║
║   │ 40M remaining      │ 25%      │ 25 BKC released         │                    ║
║   │ 0 remaining        │ 0%       │ 0 BKC released          │                    ║
║   └────────────────────┴──────────┴─────────────────────────┘                    ║
║                                                                                   ║
║   Rewards go to: Operators + Stakers + Treasury                                  ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🆓 Free Services

| Service | Cost | Notes |
|---------|------|-------|
| **Document Verification** | FREE | Anyone can verify notarized documents |
| **Backcoin Oracle** | FREE | Any Arbitrum developer can use |
| **View Staking Stats** | FREE | Check your position anytime |
| **View Pool Prices** | FREE | Check NFT prices anytime |
| **Unfollow** | FREE | Only gas cost |
| **Update Profile** | FREE | Only gas cost |

---

## 📋 Key Contracts

| Contract | Address | Operator Support |
|----------|---------|------------------|
| **EcosystemManager** | `0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407` | — |
| **MiningManager** | `0x7755982411244791d2DA96cBa04d08df72Be43C1` | ⚡ Yes |
| **DelegationManager** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` | ⚡ Yes |
| **FortunePool** | `0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF` | ⚡ Yes |
| **CharityPool** | `0x259271F3558bCa03Ddc8D7494CCF833751483Fb1` | ⚡ Yes |
| **DecentralizedNotary** | `0x2E56650a4f05D0f98787694c6C61603616716b48` | ⚡ Yes |
| **RentalManager** | `0x593A842d214516F216EB6E6E9A97cC84F42f6821` | ⚡ Yes |
| **Backchat** | `0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb` | ⚡ Yes |
| **RewardBoosterNFT** | `0xf2EA307686267dC674859da28C58CBb7a5866BCf` | — |
| **Treasury** | `0xc93030333E3a235c2605BcB7C7330650B600B6D0` | — |

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
║   Every fee is visible. Every calculation is verifiable.                         ║
║   Every distribution is transparent. Every rule is immutable.                    ║
║                                                                                   ║
║   No hidden fees. No fine print. No surprises.                                   ║
║   Just math. Just code. Just truth.                                              ║
║                                                                                   ║
║   Build interfaces. Earn commissions. No permission needed.                      ║
║                                                                                   ║
║                          THE FEES ARE TRANSPARENT.                                ║
║                          THE PROTOCOL IS UNSTOPPABLE.                             ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

*This document is part of Backchain Protocol's public documentation. All fees are verifiable on-chain. Trust the code, not the words.*
