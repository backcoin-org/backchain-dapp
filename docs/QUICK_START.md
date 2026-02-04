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

**Document:** Quick Start Guide — Join the Unstoppable Ecosystem  
**Version:** 2.0.0  
**Last Updated:** February 2026  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# Quick Start Guide

## Start Using the Unstoppable Protocol in 5 Minutes

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    NO PERMISSION NEEDED. NO APPROVAL REQUIRED.                    ║
║                                                                                   ║
║   Just as Voltaire believed everyone has the right to speak,                     ║
║   we believe everyone has the right to participate in DeFi.                      ║
║                                                                                   ║
║   No KYC. No registration. No waiting.                                           ║
║   Just connect your wallet and start.                                            ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🌍 Two Ways to Participate

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   PATH 1: USE THE PROTOCOL                PATH 2: BUILD & EARN                   ║
║   ═══════════════════════                 ═══════════════════                    ║
║                                                                                   ║
║   • Stake BKC and earn rewards            • Build your own interface             ║
║   • Play Fortune Pool                     • Pass your address as operator        ║
║   • Buy/sell NFTs                         • Earn from EVERY transaction          ║
║   • Notarize documents                    • No registration needed               ║
║   • Use Backchat social                   • No approval required                 ║
║   • Donate to charity                     • Just build and earn                  ║
║                                                                                   ║
║   Both paths are PERMISSIONLESS. Choose one or both!                             ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Wallet** | MetaMask, Rabby, or any Web3 wallet |
| **Network** | Arbitrum Sepolia testnet |
| **ETH** | Small amount for gas (~0.01 ETH) |

---

## Step 1: Add Arbitrum Sepolia Network

### Network Settings

| Field | Value |
|-------|-------|
| **Network Name** | Arbitrum Sepolia |
| **RPC URL** | https://sepolia-rollup.arbitrum.io/rpc |
| **Chain ID** | 421614 |
| **Currency Symbol** | ETH |
| **Block Explorer** | https://sepolia.arbiscan.io |

### Quick Add

Visit [chainlist.org](https://chainlist.org) and search for "Arbitrum Sepolia" → Click "Add to MetaMask"

---

## Step 2: Get Testnet ETH

You need a small amount of ETH for gas fees.

| Faucet | Link |
|--------|------|
| Arbitrum Faucet | [faucet.arbitrum.io](https://faucet.arbitrum.io) |
| Alchemy Faucet | [sepoliafaucet.com](https://sepoliafaucet.com) |
| QuickNode | [faucet.quicknode.com/arbitrum/sepolia](https://faucet.quicknode.com/arbitrum/sepolia) |

---

## Step 3: Get Test BKC Tokens

### Use Our Faucet

**Faucet Address:** `0x954acE43508AC8Ee1C5509F0ee1Fe65b81C3fc90`

1. Visit the faucet on [Arbiscan](https://sepolia.arbiscan.io/address/0x954acE43508AC8Ee1C5509F0ee1Fe65b81C3fc90#writeContract)
2. Connect your wallet
3. Click "Write Contract"
4. Call the `claim()` function
5. Receive test BKC tokens!

**Limit:** One claim per address

---

## Step 4: Add BKC Token to Wallet

### Token Details

| Field | Value |
|-------|-------|
| **Contract** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` |
| **Symbol** | BKC |
| **Decimals** | 18 |

### MetaMask

1. Open MetaMask
2. Click "Import tokens"
3. Paste contract address: `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396`
4. Click "Add Custom Token"

---

## Step 5: Start Using Backchain!

Now you're ready! Here's what you can do:

### 🎰 Play Fortune Pool

Provably fair games with commit-reveal pattern:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║   FORTUNE POOL (V6)                                                              ║
║   ─────────────────                                                              ║
║   Contract: 0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF                           ║
║                                                                                   ║
║   1. Commit your bet → Wait 5 blocks → Reveal and win!                           ║
║   2. Combo mode: Match 3 tiers for up to 57x                                     ║
║   3. Jackpot mode: 1 in 100 for 50x                                              ║
║                                                                                   ║
║   ⚡ Operators earn from every game played through their interface               ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### 💰 Stake BKC

Lock tokens to earn protocol rewards:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║   STAKING (DelegationManager V6)                                                 ║
║   ──────────────────────────────                                                 ║
║   Contract: 0x41B1B7940E06318e9b161fc64524FaE7261e8739                           ║
║                                                                                   ║
║   1. Choose lock period (7-365 days)                                             ║
║   2. Longer locks = higher rewards                                               ║
║   3. Hold NFT = reduced burn on unstake                                          ║
║                                                                                   ║
║   ⚡ Operators earn from stake/unstake/claim fees                                ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### 📜 Notarize Documents

Certify documents on blockchain forever:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║   DECENTRALIZED NOTARY (V6)                                                      ║
║   ─────────────────────────                                                      ║
║   Contract: 0x2E56650a4f05D0f98787694c6C61603616716b48                           ║
║                                                                                   ║
║   1. Upload document (stays local - never uploaded!)                             ║
║   2. Pay BKC + ETH fee                                                           ║
║   3. Receive NFT certificate                                                     ║
║   4. Verification is FREE forever                                                ║
║                                                                                   ║
║   ⚡ Operators earn from every notarization                                      ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### 💎 Buy Reward Booster NFT

Reduce burn penalties when unstaking:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║   NFT LIQUIDITY POOLS (V6)                                                       ║
║   ────────────────────────                                                       ║
║   Factory: 0x2f63000539AAE2019Cc3d6E357295d903c1fF120                            ║
║                                                                                   ║
║   Tier      │ Burn Reduction │ Pool Address                                      ║
║   ──────────┼────────────────┼─────────────────────────────────────────────      ║
║   Diamond   │ 0% (no burn)   │ 0x5C5590458689a11731c8bAD8BDf5D8f1D7Ffe020       ║
║   Gold      │ 25% burn       │ 0x9390e12c910C4d2E0796FA754e5C450969F09886       ║
║   Silver    │ 35% burn       │ 0x016549ee056442eC30a916335f66ad5183E3fF5b       ║
║   Bronze    │ 50% burn       │ 0x74eB5CF86B43517cd27f48A06abb8A521aDA63b8       ║
║                                                                                   ║
║   ⚡ Operators earn from every buy/sell                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### 💬 Use Backchat

Decentralized, censorship-resistant social network:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║   BACKCHAT (V7)                                                                  ║
║   ─────────────                                                                  ║
║   Contract: 0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb                           ║
║                                                                                   ║
║   • Post, reply, like, follow - all on-chain                                     ║
║   • Tip creators in BKC                                                          ║
║   • Get Trust Badges                                                             ║
║   • Reserve usernames (shorter = more expensive)                                 ║
║                                                                                   ║
║   ⚡ Operators earn from all social interactions                                 ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### 💚 Donate to Charity

Transparent, on-chain crowdfunding:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║   CHARITY POOL (V6)                                                              ║
║   ─────────────────                                                              ║
║   Contract: 0x259271F3558bCa03Ddc8D7494CCF833751483Fb1                           ║
║                                                                                   ║
║   • Create campaigns for any cause                                               ║
║   • 100% of donations go to beneficiary (no penalties!)                          ║
║   • Full transparency on-chain                                                   ║
║                                                                                   ║
║   ⚡ Operators earn from donation fees                                           ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🌍 Become an Operator (Build & Earn)

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    BUILD INTERFACES. EARN COMMISSIONS.                            ║
║                                                                                   ║
║   EVERY contract in Backchain supports the operator system.                      ║
║                                                                                   ║
║   How it works:                                                                   ║
║   1. Build your own frontend, app, bot, or tool                                  ║
║   2. When calling contract functions, pass YOUR address as "operator"            ║
║   3. Earn BKC + ETH from ALL transactions through your interface                 ║
║                                                                                   ║
║   Example (Fortune Pool):                                                         ║
║   ┌─────────────────────────────────────────────────────────────────────────┐    ║
║   │  // Your address earns commission from this game!                       │    ║
║   │  fortunePool.commitPlay(wagerAmount, guesses, YOUR_ADDRESS);            │    ║
║   └─────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                   ║
║   No registration. No approval. No KYC. Just build and earn.                     ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📊 Strategies

### Beginner Path

| Strategy | Description | Risk |
|----------|-------------|------|
| Get faucet tokens | Free starting capital | None |
| Stake for 30 days | Learn the system | Low |
| Try Backchat | Post and interact | Low |

### Intermediate Path

| Strategy | Description | Risk |
|----------|-------------|------|
| Stake for 180 days | Better rewards | Medium |
| Buy Gold NFT | 25% burn reduction | Medium |
| Play Fortune Pool | Entertainment + potential wins | Medium |
| Create charity campaign | Help others | None |

### Builder Path (Operators)

| Strategy | Description | Earnings |
|----------|-------------|----------|
| Build Fortune Pool frontend | Games interface | % of all bets |
| Build Notary service | Legal tech tool | % of all notarizations |
| Build Backchat client | Social app | % of all tips/actions |
| Build NFT marketplace | Trading platform | % of all trades |

---

## 📋 Quick Reference - All Contracts

### Core Contracts

| Contract | Address | Operator |
|----------|---------|----------|
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` | — |
| **Faucet** | `0x954acE43508AC8Ee1C5509F0ee1Fe65b81C3fc90` | — |
| **EcosystemManager** | `0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407` | — |
| **MiningManager** | `0x7755982411244791d2DA96cBa04d08df72Be43C1` | ⚡ Yes |
| **Treasury** | `0xc93030333E3a235c2605BcB7C7330650B600B6D0` | — |

### DeFi Services (All Support Operators ⚡)

| Contract | Address |
|----------|---------|
| **DelegationManager** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` |
| **FortunePool** | `0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF` |
| **CharityPool** | `0x259271F3558bCa03Ddc8D7494CCF833751483Fb1` |

### Utility Services (All Support Operators ⚡)

| Contract | Address |
|----------|---------|
| **DecentralizedNotary** | `0x2E56650a4f05D0f98787694c6C61603616716b48` |
| **RentalManager** | `0x593A842d214516F216EB6E6E9A97cC84F42f6821` |
| **Backchat** | `0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb` |

### NFT System

| Contract | Address |
|----------|---------|
| **RewardBoosterNFT** | `0xf2EA307686267dC674859da28C58CBb7a5866BCf` |
| **NFT Pool Factory** | `0x2f63000539AAE2019Cc3d6E357295d903c1fF120` |

### NFT Pools (All Support Operators ⚡)

| Tier | Burn Reduction | Pool Address |
|------|----------------|--------------|
| Diamond | 0% (no burn) | `0x5C5590458689a11731c8bAD8BDf5D8f1D7Ffe020` |
| Gold | 25% | `0x9390e12c910C4d2E0796FA754e5C450969F09886` |
| Silver | 35% | `0x016549ee056442eC30a916335f66ad5183E3fF5b` |
| Bronze | 50% | `0x74eB5CF86B43517cd27f48A06abb8A521aDA63b8` |

### Randomness (Free!)

| Contract | Address |
|----------|---------|
| **Backcoin Oracle** | `0x16346f5a45f9615f1c894414989f0891c54ef07b` |

---

## ✅ Checklist

Use this checklist to make sure you're set up:

- [ ] Added Arbitrum Sepolia network to wallet
- [ ] Got testnet ETH from faucet
- [ ] Claimed BKC from protocol faucet (`0x954acE43508AC8Ee1C5509F0ee1Fe65b81C3fc90`)
- [ ] Added BKC token to wallet (`0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396`)
- [ ] Made first transaction (stake, play, or buy NFT)
- [ ] (Optional) Built an interface and earned as operator

---

## 🔧 Troubleshooting

### "Insufficient funds for gas"
→ Get more ETH from Arbitrum Sepolia faucet

### "Transaction failed"
→ Check you have enough BKC for the action
→ V6 contracts also need small ETH fee
→ Try increasing gas limit

### "Token not showing in wallet"
→ Manually add token using: `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396`

### "Wrong network"
→ Switch to Arbitrum Sepolia (Chain ID: 421614)

### "Commit not ready to reveal"
→ Fortune Pool V6 requires waiting 5 blocks after commit

---

## 📞 Need Help?

| Resource | Link |
|----------|------|
| Full Documentation | [github.com/backcoin-org/backchain-dapp/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs) |
| All Contracts | [CONTRACTS.md](./CONTRACTS.md) |
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |

---

## 🚀 What's Next?

After getting comfortable with the testnet:

1. **Explore all services** — Try each feature
2. **Read the docs** — Understand the mechanics
3. **Build as operator** — Create interfaces and earn
4. **Join community** — Follow us on X
5. **Wait for mainnet** — Coming soon!

---

## 📄 License

MIT License — The code is free, just like the protocol.

---

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                        WELCOME TO BACKCHAIN PROTOCOL                              ║
║                                                                                   ║
║   You've just joined an ecosystem built on freedom.                              ║
║                                                                                   ║
║   Freedom to use without permission.                                              ║
║   Freedom to build without approval.                                              ║
║   Freedom to earn without gatekeepers.                                            ║
║                                                                                   ║
║   No one can stop you. No one can censor you. No one can exclude you.            ║
║                                                                                   ║
║                          THE PROTOCOL IS UNSTOPPABLE.                             ║
║                         AND NOW, SO ARE YOU.                                      ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

*This document is part of Backchain Protocol's public documentation. Welcome to the unstoppable ecosystem!*
