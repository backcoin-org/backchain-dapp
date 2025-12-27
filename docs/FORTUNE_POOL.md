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

**Document:** Fortune Pool — Provably Fair Gaming  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# Fortune Pool

Provably fair prediction games powered by on-chain randomness. Play, win, and verify every result on Arbitrum.

---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract** | `0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631` |
| **Network** | Arbitrum Sepolia |
| **Randomness** | BackchainRandomness Oracle |
| **Prize Pool** | 2,000,000 BKC (TGE allocation) |

---

## How It Works

### Simple Flow

```
1. Choose game mode
2. Place bet (BKC)
3. Instant result (on-chain randomness)
4. Win → Collect prize
   Lose → Try again
```

### What Makes It Fair?

| Feature | Description |
|---------|-------------|
| **On-chain Randomness** | Uses BackchainRandomness oracle |
| **Instant Resolution** | Single transaction, no callbacks |
| **Verifiable** | Anyone can verify results on-chain |
| **No House Edge Manipulation** | Odds are transparent and fixed |

---

## Randomness Source

Fortune Pool uses **BackchainRandomness**—our free oracle built with Arbitrum Stylus:

**Oracle Address:** `0x6eB891C2C7bC248EdDf31c77C4258205a37C4126`

### How Randomness is Generated

```
┌─────────────────────────────────────────────────────┐
│              RANDOMNESS GENERATION                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  StylusEntropy (Rust/WASM)                         │
│       │                                            │
│       ▼                                            │
│  block.prevrandao                                  │
│       │                                            │
│       ▼                                            │
│  User seed + Transaction data                      │
│       │                                            │
│       ▼                                            │
│  Final Random Number                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Stylus Contract:** `0xb6bb5e9c9df36fa9504d87125af0e4b284b55092`

---

## Game Modes

Fortune Pool offers different risk/reward profiles:

| Mode | Risk | Reward | Description |
|------|------|--------|-------------|
| **Conservative** | Low | Lower multiplier | Higher win chance |
| **Balanced** | Medium | Medium multiplier | Balanced odds |
| **Aggressive** | High | Higher multiplier | Lower win chance |

### Odds Transparency

All odds are:
- Defined in smart contract
- Visible before playing
- Cannot be changed mid-game
- Auditable by anyone

---

## Playing the Game

### Requirements

1. BKC tokens in wallet
2. Connected to Arbitrum Sepolia
3. Approve BKC spending (first time only)

### Step-by-Step

```
Step 1: Approve BKC
   └─ Allow FortunePool to spend your BKC

Step 2: Choose Amount
   └─ Select how much BKC to wager

Step 3: Select Mode
   └─ Pick risk/reward profile

Step 4: Play
   └─ Confirm transaction

Step 5: Result
   └─ Instant win/lose determination
```

---

## Fees

| Action | Fee |
|--------|-----|
| **Play** | Configurable % of bet |
| **Claim Prize** | Configurable |

### NFT Discounts

Reward Booster NFT holders get fee discounts:

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

## Prize Pool

### Initial Allocation

| Source | Amount |
|--------|--------|
| TGE Allocation | 2,000,000 BKC |
| Fee Revenue | Ongoing |

### Prize Pool Growth

The prize pool grows from:
1. Initial TGE allocation
2. Portion of game fees
3. Activity reward releases

---

## Smart Contract Interface

### Key Functions

```solidity
// Play a game
function play(uint256 amount, uint8 gameMode) external returns (bool won, uint256 prize);

// View functions
function getPrizePool() external view returns (uint256);
function getOdds(uint8 gameMode) external view returns (uint256 winChance, uint256 multiplier);
function getPlayerStats(address player) external view returns (uint256 played, uint256 won, uint256 totalWinnings);
```

### JavaScript Example

```javascript
import { ethers } from 'ethers';

const FORTUNE_POOL = '0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631';
const BKC_TOKEN = '0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f';

// First: Approve BKC spending
const bkc = new ethers.Contract(BKC_TOKEN, ERC20_ABI, signer);
await bkc.approve(FORTUNE_POOL, ethers.parseEther('1000'));

// Then: Play
const fortunePool = new ethers.Contract(FORTUNE_POOL, FORTUNE_ABI, signer);
const betAmount = ethers.parseEther('10'); // 10 BKC
const gameMode = 1; // Balanced

const tx = await fortunePool.play(betAmount, gameMode);
const receipt = await tx.wait();

// Check result from events
const playEvent = receipt.logs.find(log => log.fragment?.name === 'GamePlayed');
console.log('Won:', playEvent.args.won);
console.log('Prize:', ethers.formatEther(playEvent.args.prize), 'BKC');
```

---

## Why Fortune Pool?

### For Players

| Benefit | Description |
|---------|-------------|
| **Fair** | Provably random, verifiable on-chain |
| **Instant** | No waiting for results |
| **Transparent** | All odds visible upfront |
| **Fun** | Entertainment value |

### For Arbitrum

| Benefit | Description |
|---------|-------------|
| **New Users** | Gaming attracts casual users |
| **Transactions** | Continuous network activity |
| **Stylus Showcase** | Demonstrates Rust/WASM capabilities |
| **Innovation** | First hybrid Stylus+Solidity gaming |

---

## Responsible Gaming

Fortune Pool is designed for entertainment. Please:

- Only play with funds you can afford to lose
- Set personal limits
- Take breaks
- Remember: the house always has an edge

---

## Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| FortunePool | `0x54Bf4B4D239bce58CdaDe8b3645B40f98FdEe631` | Main game |
| BKC Token | `0x0Df89f8d4f2d4240054A83638448495e1F4d3A6f` | Wagering |
| BackchainRandomness | `0x6eB891C2C7bC248EdDf31c77C4258205a37C4126` | Randomness |
| StylusEntropy | `0xb6bb5e9c9df36fa9504d87125af0e4b284b55092` | Entropy source |
| RewardBoosterNFT | `0x748b4770D6685629Ed9faf48CFa81e3E4641A341` | Fee discounts |

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

*This document is part of Backcoin Protocol's public documentation. All game results are verifiable on-chain.*
