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

**Document:** Staking (DelegationManager) — Lock BKC, Earn Rewards  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# Staking

Lock BKC tokens to earn a share of protocol fees. Longer locks earn higher rewards through the pStake multiplier.

---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract** | `0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701` |
| **Network** | Arbitrum Sepolia |
| **Token** | BKC |
| **Lock Period** | 1 - 3650 days |

---

## How Staking Works

### The pStake System

Your reward share is calculated using **pStake** (power stake):

```
pStake = Amount × Lock Days
```

**Example:**
- Stake 1,000 BKC for 30 days = 30,000 pStake
- Stake 500 BKC for 365 days = 182,500 pStake

Higher pStake = Larger share of rewards

### Why pStake?

| Benefit | Description |
|---------|-------------|
| **Fair Distribution** | Rewards proportional to commitment |
| **Long-term Incentive** | Longer locks earn more |
| **Flexibility** | Choose your own lock period |
| **Simple Math** | Easy to calculate your share |

---

## Reward Source

### Where Do Rewards Come From?

Staking rewards come from **real protocol fees**—not emissions:

```
┌─────────────────────────────────────────────────────┐
│              REWARD FLOW                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  User pays fee (any service)                       │
│         │                                          │
│         ▼                                          │
│  MiningManager receives fee                        │
│         │                                          │
│         ├──────────► Stakers (configurable %)     │
│         │                                          │
│         └──────────► Treasury (configurable %)    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Fee Sources

| Service | Generates Fees |
|---------|----------------|
| Fortune Pool | Game fees |
| Notary | Certification fees |
| NFT Pools | Buy/sell fees |
| Staking | Entry/exit fees |
| Rentals | Platform fees |

**Important:** No guaranteed APY. Rewards depend on actual protocol usage.

---

## Lock Periods

### Available Options

| Period | pStake Multiplier | Use Case |
|--------|-------------------|----------|
| 7 days | 7x | Short-term test |
| 30 days | 30x | Monthly commitment |
| 90 days | 90x | Quarterly |
| 180 days | 180x | Semi-annual |
| 365 days | 365x | Maximum rewards |

### Choosing Your Period

```
Short Lock (7-30 days):
├─ Lower rewards
├─ More flexibility
└─ Good for testing

Long Lock (180-365 days):
├─ Higher rewards
├─ Less flexibility
└─ Maximum commitment
```

---

## Staking Actions

### Stake

Lock BKC tokens for chosen period:

```
1. Choose amount
2. Choose lock period
3. Approve BKC spending
4. Confirm stake
5. Start earning rewards
```

### Unstake

After lock period ends:

```
1. Lock period complete
2. Request unstake
3. Pay exit fee
4. Receive BKC back
```

### Force Unstake

Emergency withdrawal before lock ends:

```
⚠️ WARNING: Higher penalty fee
1. Request force unstake
2. Pay penalty fee (configurable)
3. Receive remaining BKC
```

### Claim Rewards

Collect accumulated rewards:

```
1. Check pending rewards
2. Request claim
3. Pay claim fee
4. Receive BKC rewards
```

---

## Fees

| Action | Fee |
|--------|-----|
| **Stake (Entry)** | Configurable |
| **Unstake (Exit)** | Configurable |
| **Force Unstake** | Configurable (higher penalty) |
| **Claim Rewards** | Configurable |

### NFT Discounts

Reward Booster NFT holders pay reduced fees:

| Tier | Discount |
|------|----------|
| Diamond | 70% off |
| Platinum | 60% off |
| Gold | 50% off |
| Silver | 40% off |
| Bronze | 30% off |
| Iron | 20% off |
| Crystal | 10% off |

---

## Reward Calculation

### Your Share

```
Your Rewards = (Your pStake / Total pStake) × Available Rewards
```

### Example

| Staker | Amount | Days | pStake | Share |
|--------|--------|------|--------|-------|
| Alice | 10,000 | 365 | 3,650,000 | 73% |
| Bob | 5,000 | 180 | 900,000 | 18% |
| Carol | 3,000 | 150 | 450,000 | 9% |
| **Total** | | | **5,000,000** | **100%** |

If 1,000 BKC in fees are distributed:
- Alice: 730 BKC
- Bob: 180 BKC
- Carol: 90 BKC

---

## Smart Contract Interface

### Key Functions

```solidity
// Stake tokens
function stake(uint256 amount, uint256 lockDays) external;

// Unstake after lock period
function unstake(uint256 positionId) external;

// Force unstake with penalty
function forceUnstake(uint256 positionId) external;

// Claim rewards
function claimRewards() external;

// View functions
function getPosition(address user) external view returns (
    uint256 amount,
    uint256 pStake,
    uint256 lockEnd,
    uint256 pendingRewards
);

function getTotalPStake() external view returns (uint256);
function getPendingRewards(address user) external view returns (uint256);
```

### JavaScript Example

```javascript
import { ethers } from 'ethers';

const STAKING = '0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701';
const BKC = '0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f';

// Stake tokens
async function stake(amount, lockDays, signer) {
    const amountWei = ethers.parseEther(amount.toString());
    
    // Approve BKC
    const bkc = new ethers.Contract(BKC, ERC20_ABI, signer);
    await bkc.approve(STAKING, amountWei);
    
    // Stake
    const staking = new ethers.Contract(STAKING, STAKING_ABI, signer);
    const tx = await staking.stake(amountWei, lockDays);
    await tx.wait();
    
    console.log(`Staked ${amount} BKC for ${lockDays} days`);
}

// Check position
async function checkPosition(userAddress, provider) {
    const staking = new ethers.Contract(STAKING, STAKING_ABI, provider);
    const position = await staking.getPosition(userAddress);
    
    console.log('Staked:', ethers.formatEther(position.amount), 'BKC');
    console.log('pStake:', position.pStake.toString());
    console.log('Lock ends:', new Date(Number(position.lockEnd) * 1000));
    console.log('Pending rewards:', ethers.formatEther(position.pendingRewards), 'BKC');
}

// Claim rewards
async function claimRewards(signer) {
    const staking = new ethers.Contract(STAKING, STAKING_ABI, signer);
    const tx = await staking.claimRewards();
    await tx.wait();
    
    console.log('Rewards claimed!');
}

// Unstake
async function unstake(positionId, signer) {
    const staking = new ethers.Contract(STAKING, STAKING_ABI, signer);
    const tx = await staking.unstake(positionId);
    await tx.wait();
    
    console.log('Unstaked successfully!');
}
```

---

## Strategy Guide

### For Maximum Rewards

1. **Lock longer** — 365 days gives 52x more pStake than 7 days
2. **Compound** — Claim and restake rewards
3. **Use NFT** — Reduce fees with Reward Booster
4. **Time it** — Stake before high-activity periods

### For Flexibility

1. **Short locks** — 30 days allows monthly adjustments
2. **Split stake** — Multiple positions with different lock periods
3. **Watch fees** — Wait for low-fee periods

---

## Risks

| Risk | Mitigation |
|------|------------|
| **Lock Period** | Choose period you're comfortable with |
| **Smart Contract** | Verified code, tested on testnet |
| **Variable Rewards** | Rewards depend on protocol activity |
| **Force Unstake Penalty** | Only use if absolutely necessary |

---

## Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| DelegationManager | `0xEfDa12B1D1e91FDe57eBCDB7A520cfd1D9aE4701` | Staking |
| BKC Token | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` | Stake token |
| MiningManager | `0xAdB6d83Fc7A340a22fbA93304532F0c14C9Cd4fB` | Reward distribution |
| RewardBoosterNFT | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` | Fee discounts |
| EcosystemManager | `0xF7c16C935d70627cf7F94040330C162095b8BEb1` | Configuration |

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

*This document is part of Backcoin Protocol's public documentation. All staking data is verifiable on-chain.*
