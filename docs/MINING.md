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

**Document:** Activity Rewards (MiningManager) — Fair Distribution for Everyone  
**Version:** 2.0.0  
**Last Updated:** February 2026  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# Activity Rewards

## Rewards That Flow to Those Who Build

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    USE THE PROTOCOL. EARN THE REWARDS.                            ║
║                                                                                   ║
║   Just as Voltaire believed in merit over privilege,                             ║
║   we believe rewards should go to those who contribute.                          ║
║                                                                                   ║
║   Not to VCs. Not to insiders. Not to the team.                                  ║
║   To USERS. To BUILDERS. To OPERATORS.                                           ║
║                                                                                   ║
║   160,000,000 BKC waiting to be earned.                                          ║
║   No pre-mine. No allocation. Just activity.                                     ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

Earn BKC tokens by using protocol services. The more the ecosystem is used, the more tokens are released—but at a decreasing rate over time, ensuring long-term sustainability.

---

## 📍 Contract Information

| Property | Value |
|----------|-------|
| **Contract** | `0x7755982411244791d2DA96cBa04d08df72Be43C1` |
| **Network** | Arbitrum Sepolia |
| **Reserve** | 160,000,000 BKC |
| **Model** | Linear Scarcity |
| **Operator Support** | ⚡ Yes |

---

## 🌍 Become an Operator — Earn Mining Rewards

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    BUILD INTERFACES. EARN REWARDS.                                ║
║                                                                                   ║
║   The MiningManager distributes rewards to THREE groups:                         ║
║                                                                                   ║
║   1. OPERATORS ⚡  — Anyone who builds interfaces                                ║
║   2. STAKERS      — Users who stake BKC                                          ║
║   3. TREASURY     — Protocol development                                         ║
║                                                                                   ║
║   How to become an operator:                                                      ║
║   1. Build your own frontend, app, bot, or tool                                  ║
║   2. Pass your wallet address as the "operator" parameter                        ║
║   3. Earn a share of ALL mining rewards from your users' activity                ║
║                                                                                   ║
║   No registration. No approval. No KYC. Just build and earn.                     ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## ⚡ How It Works

### The Flow

When users pay fees for protocol services, new BKC tokens are released from the 160M reserve:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   ACTIVITY REWARDS FLOW                                                          ║
║   ═════════════════════                                                          ║
║                                                                                   ║
║   User uses service (pays BKC fee)                                               ║
║           │                                                                       ║
║           ▼                                                                       ║
║   ┌─────────────────────────────────────────────────────────────────────────┐    ║
║   │                      MiningManager receives fee                         │    ║
║   └─────────────────────────────────────────────────────────────────────────┘    ║
║           │                                                                       ║
║           ├──► Calculate release rate (based on remaining reserve)               ║
║           │                                                                       ║
║           ├──► Release new tokens from 160M reserve                              ║
║           │                                                                       ║
║           ▼                                                                       ║
║   ┌─────────────────────────────────────────────────────────────────────────┐    ║
║   │                         DISTRIBUTE TO:                                  │    ║
║   │                                                                         │    ║
║   │    ┌───────────┐      ┌───────────┐      ┌───────────┐                 │    ║
║   │    │ OPERATOR  │      │  STAKERS  │      │ TREASURY  │                 │    ║
║   │    │    ⚡     │      │           │      │           │                 │    ║
║   │    └───────────┘      └───────────┘      └───────────┘                 │    ║
║   │                                                                         │    ║
║   └─────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                   ║
║   ⚡ OPERATOR = Anyone who built the interface (could be YOU!)                   ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Not Pre-Minted — Truly Fair

The 160M tokens are **NOT** pre-minted. They are released only when:
- ✅ Users pay fees for real services
- ✅ Real protocol activity occurs
- ✅ Value is actually generated

**No activity = No release = No inflation**

---

## 📊 Linear Scarcity Model

### The Formula

```
Release Rate = Remaining Reserve / 160,000,000
```

As more tokens are released, the rate decreases automatically:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   RELEASE RATE OVER TIME                                                         ║
║   ══════════════════════                                                         ║
║                                                                                   ║
║   Reserve Status    │ Remaining      │ Rate   │ 100 BKC fee triggers            ║
║   ──────────────────┼────────────────┼────────┼──────────────────────────────    ║
║   Start             │ 160,000,000    │ 100%   │ 100 BKC released                ║
║   25% released      │ 120,000,000    │ 75%    │ 75 BKC released                 ║
║   50% released      │ 80,000,000     │ 50%    │ 50 BKC released                 ║
║   75% released      │ 40,000,000     │ 25%    │ 25 BKC released                 ║
║   100% released     │ 0              │ 0%     │ 0 BKC released                  ║
║                                                                                   ║
║   This creates NATURAL SCARCITY without arbitrary rules.                         ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🔥 Why This Model?

### Addressing the "Inflation" Concern

**The criticism:** "Protocol rewards create continuous inflation."

**Our response:**

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   THIS IS NOT INFLATION                                                          ║
║   ═════════════════════                                                          ║
║                                                                                   ║
║   ✅ CAPPED         — Maximum 160M can EVER be released                          ║
║   ✅ DECREASING     — Rate drops automatically over time                         ║
║   ✅ ACTIVITY-BASED — No activity = no release                                   ║
║   ✅ FINITE         — Eventually reaches zero                                    ║
║   ✅ TRANSPARENT    — Formula is on-chain, anyone can verify                     ║
║                                                                                   ║
║   Compare to:                                                                     ║
║   ❌ Fiat money: Unlimited printing                                              ║
║   ❌ Some tokens: Hidden minting, arbitrary inflation                            ║
║   ❌ Pre-mined coins: All tokens exist from day 1                                ║
║                                                                                   ║
║   BKC rewards are EARNED, not PRINTED.                                           ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 💰 Fee Distribution

MiningManager handles ALL protocol fees and distributes them fairly:

### Fee Sources (All Support Operator System ⚡)

| Service | Contract | Fee Type |
|---------|----------|----------|
| **Staking** | DelegationManager | Entry, exit, claim fees |
| **Fortune Pool** | FortunePool | Game fees |
| **Charity** | CharityPool | Donation fees |
| **Notary** | DecentralizedNotary | Certification fees |
| **NFT Pools** | NFTLiquidityPool | Buy/sell fees |
| **Rentals** | RentalManager | Platform fees |
| **Social** | Backchat | Tips, premium features |

### Distribution Split

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   FEE + NEWLY RELEASED TOKENS                                                    ║
║           │                                                                       ║
║           ├──────────────► OPERATOR ⚡ (configurable %)                          ║
║           │                 Anyone who builds interfaces                          ║
║           │                                                                       ║
║           ├──────────────► STAKERS (configurable %)                              ║
║           │                 Users who stake BKC                                   ║
║           │                                                                       ║
║           └──────────────► TREASURY (configurable %)                             ║
║                             Protocol development                                  ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📈 Long-Term Sustainability

| Phase | Reserve | Rate | Model | Duration |
|-------|---------|------|-------|----------|
| **Bootstrap** | 160M → 120M | 100% → 75% | High incentives | Early adoption |
| **Growth** | 120M → 80M | 75% → 50% | Medium incentives | Ecosystem expansion |
| **Maturity** | 80M → 40M | 50% → 25% | Low incentives | Stable usage |
| **Stability** | 40M → 0 | 25% → 0% | Minimal release | Long-term |
| **Complete** | 0 | 0% | Fee-only model | Forever |

**After all 160M are released, protocol runs purely on fee redistribution.**

This ensures the protocol is sustainable forever, without depending on new token releases.

---

## 💻 Smart Contract Interface

### Key Functions

```solidity
// ═══════════════════════════════════════════════════════════════════════════════
// VIEW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Get remaining reserve
function getRemainingReserve() external view returns (uint256);

// Get current release rate (in basis points, 10000 = 100%)
function getCurrentRate() external view returns (uint256);

// Get total tokens released so far
function getTotalReleased() external view returns (uint256);

// Get comprehensive mining statistics
function getMiningStats() external view returns (
    uint256 remainingReserve,
    uint256 totalReleased,
    uint256 currentRate,
    uint256 totalFeesProcessed
);

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATOR FUNCTIONS (called by authorized services)
// ═══════════════════════════════════════════════════════════════════════════════

// Process fee and distribute rewards (includes operator)
function processFee(
    uint256 _feeAmount,
    address _operator  // ⚡ Operator earns a share!
) external;
```

### Events

```solidity
// Emitted when tokens are released
event TokensReleased(
    uint256 amount,
    uint256 remainingReserve,
    uint256 currentRate
);

// Emitted when rewards are distributed
event RewardsDistributed(
    uint256 toOperator,    // ⚡ Operator share
    uint256 toStakers,
    uint256 toTreasury,
    address indexed operator
);

// Emitted when fee is processed
event FeeProcessed(
    address indexed service,
    uint256 feeAmount,
    uint256 newTokensReleased,
    address indexed operator
);
```

---

## 🔧 JavaScript Integration

```javascript
import { ethers } from 'ethers';

const MINING_MANAGER = '0x7755982411244791d2DA96cBa04d08df72Be43C1';

const miningABI = [
    "function getRemainingReserve() view returns (uint256)",
    "function getCurrentRate() view returns (uint256)",
    "function getTotalReleased() view returns (uint256)",
    "function getMiningStats() view returns (uint256, uint256, uint256, uint256)",
    "event TokensReleased(uint256 amount, uint256 remainingReserve, uint256 currentRate)",
    "event RewardsDistributed(uint256 toOperator, uint256 toStakers, uint256 toTreasury, address indexed operator)"
];

const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
const mining = new ethers.Contract(MINING_MANAGER, miningABI, provider);

// Get current mining stats
async function getMiningStats() {
    const [remaining, released, rate, fees] = await mining.getMiningStats();
    
    console.log('═══════════════════════════════════════════════');
    console.log('MINING STATS');
    console.log('═══════════════════════════════════════════════');
    console.log('Remaining Reserve:', ethers.formatEther(remaining), 'BKC');
    console.log('Total Released:', ethers.formatEther(released), 'BKC');
    console.log('Current Rate:', (Number(rate) / 100).toFixed(2), '%');
    console.log('Total Fees Processed:', ethers.formatEther(fees), 'BKC');
}

// Calculate how much would be released for a fee
async function calculateRelease(feeAmount) {
    const rate = await mining.getCurrentRate();
    const releaseAmount = (BigInt(feeAmount) * rate) / 10000n;
    
    console.log('Fee:', ethers.formatEther(feeAmount), 'BKC');
    console.log('Would release:', ethers.formatEther(releaseAmount), 'BKC');
}

// Listen for rewards distribution (see who earned what)
mining.on('RewardsDistributed', (toOperator, toStakers, toTreasury, operator) => {
    console.log('═══════════════════════════════════════════════');
    console.log('REWARDS DISTRIBUTED');
    console.log('═══════════════════════════════════════════════');
    console.log('Operator:', operator);
    console.log('  → Operator earned:', ethers.formatEther(toOperator), 'BKC');
    console.log('  → Stakers earned:', ethers.formatEther(toStakers), 'BKC');
    console.log('  → Treasury:', ethers.formatEther(toTreasury), 'BKC');
});
```

---

## 📋 Authorized Services

All these contracts can trigger mining rewards. **All support the operator system!**

| Contract | Address | Operator |
|----------|---------|----------|
| **DelegationManager** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` | ⚡ Yes |
| **FortunePool** | `0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF` | ⚡ Yes |
| **CharityPool** | `0x259271F3558bCa03Ddc8D7494CCF833751483Fb1` | ⚡ Yes |
| **DecentralizedNotary** | `0x2E56650a4f05D0f98787694c6C61603616716b48` | ⚡ Yes |
| **NFTLiquidityPool** | Factory: `0x2f63000539AAE2019Cc3d6E357295d903c1fF120` | ⚡ Yes |
| **RentalManager** | `0x593A842d214516F216EB6E6E9A97cC84F42f6821` | ⚡ Yes |
| **Backchat** | `0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb` | ⚡ Yes |

---

## 🔗 Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| **MiningManager** | `0x7755982411244791d2DA96cBa04d08df72Be43C1` | This contract |
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` | Token |
| **EcosystemManager** | `0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407` | Configuration |
| **DelegationManager** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` | Staking rewards |
| **Treasury** | `0xc93030333E3a235c2605BcB7C7330650B600B6D0` | Fee recipient |

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
║   The MiningManager is not just a reward system. It's a philosophy.              ║
║                                                                                   ║
║   A philosophy that rewards should go to contributors, not insiders.             ║
║   A philosophy that distribution should be transparent and verifiable.           ║
║   A philosophy that anyone can build and earn, without permission.               ║
║                                                                                   ║
║   160M BKC. Zero pre-mine. 100% earned through activity.                         ║
║                                                                                   ║
║   No one can change the rules. No one can stop the rewards.                      ║
║                                                                                   ║
║                         THE REWARDS ARE UNSTOPPABLE.                              ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

*This document is part of Backchain Protocol's public documentation. All activity rewards are verifiable on-chain. Trust the code, not the words.*
