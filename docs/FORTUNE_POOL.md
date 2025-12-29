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
**Version:** 2.0  
**Last Updated:** December 2025  

---

# Fortune Pool

Provably fair prediction games powered by the **Backcoin Oracle**. Play, win, and verify every result instantly on Arbitrum.

---

## Contract Information

| Property | Value |
|----------|-------|
| **Fortune Pool V2** | `0x8093a960b9615330DdbD1B59b1Fc7eB6B6AB1526` |
| **Backcoin Oracle** | `0x16346f5a45f9615f1c894414989f0891c54ef07b` |
| **Network** | Arbitrum Sepolia |
| **Resolution** | Instant (single transaction) |
| **Prize Pool** | 2,000,000 BKC (TGE allocation) |

---

## How It Works

### Instant Results in One Transaction

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   FORTUNE POOL FLOW                                                          ║
║   ═════════════════                                                          ║
║                                                                               ║
║   1. Player calls play() with wager + guesses                                ║
║           ↓                                                                   ║
║   2. Contract calls Backcoin Oracle (staticcall)                             ║
║           ↓                                                                   ║
║   3. Oracle returns random numbers INSTANTLY                                 ║
║           ↓                                                                   ║
║   4. Contract compares guesses vs rolls                                      ║
║           ↓                                                                   ║
║   5. Winner? → Prize transferred immediately                                 ║
║      Loser?  → Wager goes to prize pool                                      ║
║           ↓                                                                   ║
║   6. Event emitted with all results                                          ║
║                                                                               ║
║   ✅ ALL IN ONE TRANSACTION!                                                 ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### What Makes It Fair?

| Feature | Description |
|---------|-------------|
| **On-chain Randomness** | Backcoin Oracle using Arbitrum's block entropy |
| **Instant Resolution** | Single transaction, no callbacks needed |
| **Verifiable** | All results logged in contract events |
| **Transparent Odds** | Multipliers and chances visible in contract |
| **No Manipulation** | Oracle uses `staticcall` - cannot be influenced |

---

## Game Modes

Fortune Pool offers two distinct game modes:

### 🚀 Combo Mode (Cumulative)

Play all 3 tiers in one bet. Match numbers to win multipliers that **stack**.

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   COMBO MODE - Stack Your Wins!                                              ║
║   ═════════════════════════════                                              ║
║                                                                               ║
║   Your Guesses:  [2]  [7]  [42]                                              ║
║                   │    │    │                                                ║
║                   ▼    ▼    ▼                                                ║
║   Oracle Rolls:  [2]  [3]  [67]                                              ║
║                   ✓    ✗    ✗                                                ║
║                                                                               ║
║   Tier 1 (Easy):   Match! → 2x multiplier                                   ║
║   Tier 2 (Medium): Miss                                                      ║
║   Tier 3 (Hard):   Miss                                                      ║
║                                                                               ║
║   Result: Won 2x on wager!                                                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Combo Multipliers Stack:**
- Match Easy only → **2x**
- Match Easy + Medium → **7x** (2 + 5)
- Match Easy + Hard → **52x** (2 + 50)
- Match All Three → **57x** (2 + 5 + 50)

---

### 👑 Jackpot Mode (Single Tier)

Go for the big win! Pick one number in the Hard tier (1-100).

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   JACKPOT MODE - All or Nothing!                                             ║
║   ══════════════════════════════                                             ║
║                                                                               ║
║   Your Guess:    [42]                                                        ║
║                   │                                                          ║
║                   ▼                                                          ║
║   Oracle Roll:   [42]  ← 1 in 100 chance!                                   ║
║                   ✓                                                          ║
║                                                                               ║
║   Result: Won 50x on wager! 🎉                                               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Jackpot Odds:**
- Range: 1-100
- Win Chance: 1%
- Multiplier: **50x**

---

## Prize Tiers

| Tier | Range | Win Chance | Multiplier | House Edge |
|------|-------|------------|------------|------------|
| **Easy** | 1-3 | 33.33% | **2x** | ~33% |
| **Medium** | 1-10 | 10% | **5x** | ~50% |
| **Hard** | 1-100 | 1% | **50x** | ~50% |

### Maximum Combo Win

| Matches | Multiplier | Example (100 BKC bet) |
|---------|------------|----------------------|
| Easy only | 2x | 200 BKC |
| Medium only | 5x | 500 BKC |
| Hard only | 50x | 5,000 BKC |
| Easy + Medium | 7x | 700 BKC |
| Easy + Hard | 52x | 5,200 BKC |
| Medium + Hard | 55x | 5,500 BKC |
| **ALL THREE** | **57x** | **5,700 BKC** 🏆 |

---

## How Results Are Verified

Since the Backcoin Oracle uses `view` functions (called via `staticcall`), **events are emitted by the Fortune Pool contract**, not the oracle.

### Finding Your Game Results

1. **Go to the Fortune Pool contract on Arbiscan:**
   ```
   https://sepolia.arbiscan.io/address/0x8093a960b9615330DdbD1B59b1Fc7eB6B6AB1526
   ```

2. **Click "Events" tab**

3. **Find `GamePlayed` event:**
   ```
   GamePlayed(
       gameId: 1234,
       player: 0xYourAddress,
       wagerAmount: 10000000000000000000,
       prizeWon: 20000000000000000000,
       isCumulative: true,
       matchCount: 1
   )
   ```

4. **Find `GameDetails` event (same transaction):**
   ```
   GameDetails(
       gameId: 1234,
       guesses: [2, 7, 42],
       rolls: [2, 3, 67],
       matches: [true, false, false]
   )
   ```

### Why Events Are in Fortune Pool, Not the Oracle

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   TECHNICAL EXPLANATION                                                       ║
║   ═════════════════════                                                       ║
║                                                                               ║
║   Fortune Pool calls:                                                         ║
║       oracle.get_batch(counts, mins, maxs)                                   ║
║                                                                               ║
║   Solidity internally uses: staticcall                                       ║
║                                                                               ║
║   staticcall properties:                                                     ║
║   • READ-ONLY by EVM design                                                  ║
║   • Cannot emit events                                                       ║
║   • Cannot modify state                                                      ║
║   • Gas efficient                                                            ║
║                                                                               ║
║   Therefore:                                                                 ║
║   • Oracle returns numbers → No events in oracle                             ║
║   • Fortune Pool emits events → Results logged here                          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Playing the Game

### Requirements

1. BKC tokens in wallet
2. Connected to Arbitrum Sepolia
3. Approve BKC spending (first time only)

### Step-by-Step

```
Step 1: Approve BKC (first time only)
   └─ Allow FortunePool to spend your BKC

Step 2: Choose Mode
   └─ 🚀 Combo: Play all 3 tiers
   └─ 👑 Jackpot: Go for 50x on Hard tier

Step 3: Enter Your Guesses
   └─ Combo: 3 numbers (Easy 1-3, Medium 1-10, Hard 1-100)
   └─ Jackpot: 1 number (1-100)

Step 4: Set Wager Amount
   └─ Minimum: 1 BKC
   └─ Maximum: Based on prize pool

Step 5: Play!
   └─ Confirm transaction
   └─ Result is INSTANT (same transaction)

Step 6: Check Result
   └─ Win → Prize auto-transferred to wallet
   └─ Lose → Try again!
```

---

## Fees

### Service Fee

| Mode | Fee |
|------|-----|
| **Combo** | ~0.003 ETH (3 random numbers) |
| **Jackpot** | ~0.001 ETH (1 random number) |

*Service fee covers oracle gas costs and protocol development.*

### NFT Fee Discounts

Reward Booster NFT holders get discounts on service fees:

| Tier | boostBips | Discount |
|------|-----------|----------|
| 💠 Diamond | 7000 | **70% off** |
| ⚪ Platinum | 6000 | **60% off** |
| 🥇 Gold | 5000 | **50% off** |
| 🥈 Silver | 4000 | **40% off** |
| 🥉 Bronze | 3000 | **30% off** |
| ⚙️ Iron | 2000 | **20% off** |
| 💎 Crystal | 1000 | **10% off** |

---

## Prize Pool

### Initial Allocation

| Source | Amount |
|--------|--------|
| TGE Allocation | 2,000,000 BKC |
| Game Fees | Ongoing |

### Prize Pool Mechanics

```
Player Loses:
   └─ Wager → Prize Pool (grows the pool)

Player Wins:
   └─ Prize ← Prize Pool (paid from pool)

Service Fee:
   └─ 50% → Protocol Treasury
   └─ 50% → Prize Pool top-up
```

---

## Smart Contract Interface

### Main Function: `play()`

```solidity
/// @notice Play Fortune Pool
/// @param _wagerAmount Amount of BKC to wager
/// @param _guesses Array of guessed numbers
/// @param _isCumulative true = Combo mode, false = Jackpot mode
/// @return gameId Unique game identifier
/// @return rolls The random numbers from oracle
/// @return prizeWon Amount won (0 if lost)
function play(
    uint256 _wagerAmount,
    uint256[] calldata _guesses,
    bool _isCumulative
) external payable returns (
    uint256 gameId,
    uint256[] memory rolls,
    uint256 prizeWon
);
```

### View Functions

```solidity
// Get prize pool balance
function prizePoolBalance() external view returns (uint256);

// Get game details
function getGameDetails(uint256 _gameId) external view returns (
    address player,
    uint256 wagerAmount,
    uint256 prizeWon,
    uint256[] memory guesses,
    uint256[] memory rolls,
    bool[] memory matches,
    bool isCumulative
);

// Get player statistics
function getPlayerStats(address _player) external view returns (
    uint256 gamesPlayed,
    uint256 totalWageredAmount,
    uint256 totalWonAmount,
    int256 netProfit
);

// Get pool statistics
function getPoolStats() external view returns (
    uint256 poolBalance,
    uint256 gamesPlayed,
    uint256 wageredAllTime,
    uint256 paidOutAllTime,
    uint256 winsAllTime,
    uint256 currentFee
);

// Calculate potential winnings
function calculatePotentialWinnings(
    uint256 _wagerAmount,
    bool _isCumulative
) external view returns (
    uint256 maxPrize,
    uint256 netWager,
    uint256 fee
);

// Get tier information
function getTier(uint256 _tierId) external view returns (
    uint128 maxRange,
    uint64 multiplierBips,
    bool active
);
```

### Events

```solidity
// Emitted for every game
event GamePlayed(
    uint256 indexed gameId,
    address indexed player,
    uint256 wagerAmount,
    uint256 prizeWon,
    bool isCumulative,
    uint8 matchCount
);

// Emitted with detailed results
event GameDetails(
    uint256 indexed gameId,
    uint256[] guesses,
    uint256[] rolls,
    bool[] matches
);

// Emitted for big wins
event JackpotWon(
    uint256 indexed gameId,
    address indexed player,
    uint256 prizeAmount,
    uint256 tier
);
```

---

## JavaScript Integration

### Basic Play Example

```javascript
import { ethers } from 'ethers';

const FORTUNE_POOL = '0x8093a960b9615330DdbD1B59b1Fc7eB6B6AB1526';
const BKC_TOKEN = '0x...'; // BKC Token address

const fortunePoolABI = [
    "function play(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable returns (uint256 gameId, uint256[] memory rolls, uint256 prizeWon)",
    "function getRequiredServiceFee(bool _isCumulative) view returns (uint256)",
    "function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager, uint256 fee)",
    "event GamePlayed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount)",
    "event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)"
];

async function playCombo(signer, wagerAmount, guesses) {
    const fortunePool = new ethers.Contract(FORTUNE_POOL, fortunePoolABI, signer);
    
    // Get required service fee
    const serviceFee = await fortunePool.getRequiredServiceFee(true); // true = Combo
    
    // Play Combo mode
    const tx = await fortunePool.play(
        ethers.parseEther(wagerAmount.toString()),
        guesses, // [2, 7, 42] for Combo
        true,    // isCumulative = true for Combo
        { value: serviceFee }
    );
    
    const receipt = await tx.wait();
    
    // Parse events
    const gamePlayedEvent = receipt.logs
        .map(log => {
            try { return fortunePool.interface.parseLog(log); } 
            catch { return null; }
        })
        .find(e => e?.name === 'GamePlayed');
    
    const gameDetailsEvent = receipt.logs
        .map(log => {
            try { return fortunePool.interface.parseLog(log); } 
            catch { return null; }
        })
        .find(e => e?.name === 'GameDetails');
    
    console.log('Game ID:', gamePlayedEvent.args.gameId.toString());
    console.log('Guesses:', gameDetailsEvent.args.guesses.map(g => g.toString()));
    console.log('Rolls:', gameDetailsEvent.args.rolls.map(r => r.toString()));
    console.log('Matches:', gameDetailsEvent.args.matches);
    console.log('Prize:', ethers.formatEther(gamePlayedEvent.args.prizeWon), 'BKC');
}

async function playJackpot(signer, wagerAmount, guess) {
    const fortunePool = new ethers.Contract(FORTUNE_POOL, fortunePoolABI, signer);
    
    // Get required service fee
    const serviceFee = await fortunePool.getRequiredServiceFee(false); // false = Jackpot
    
    // Play Jackpot mode
    const tx = await fortunePool.play(
        ethers.parseEther(wagerAmount.toString()),
        [guess], // Single number 1-100
        false,   // isCumulative = false for Jackpot
        { value: serviceFee }
    );
    
    const receipt = await tx.wait();
    // ... parse events same as above
}
```

---

## Responsible Gaming

Fortune Pool is designed for entertainment. Please:

- ⚠️ Only play with funds you can afford to lose
- ⚠️ Set personal limits
- ⚠️ Take breaks
- ⚠️ Remember: the house has an edge (~33-50%)

---

## Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| **Fortune Pool V2** | `0x8093a960b9615330DdbD1B59b1Fc7eB6B6AB1526` | Main game |
| **Backcoin Oracle** | `0x16346f5a45f9615f1c894414989f0891c54ef07b` | Randomness |
| **BKC Token** | See deployment-addresses.json | Wagering |
| **RewardBoosterNFT** | See deployment-addresses.json | Fee discounts |
| **EcosystemManager** | See deployment-addresses.json | Fee configuration |

---

## FAQ

**Q: Why is the result instant?**
> Fortune Pool V2 uses the Backcoin Oracle which returns random numbers via `view` functions. No callbacks needed!

**Q: Where can I see my game results?**
> In the Fortune Pool contract's events on Arbiscan. Look for `GamePlayed` and `GameDetails` events.

**Q: Why aren't there events in the Oracle contract?**
> The oracle uses `view` functions called via `staticcall`, which cannot emit events by EVM design. All results are logged in Fortune Pool's events.

**Q: What's the maximum I can win?**
> In Combo mode, matching all 3 tiers gives 57x your wager. In Jackpot mode, a match gives 50x.

**Q: Is the randomness truly fair?**
> Yes! The Backcoin Oracle uses Arbitrum's `block.prevrandao` combined with transaction-specific data. The same trust model as all Arbitrum DeFi.

**Q: Can I verify the results on-chain?**
> Absolutely! Every game's guesses, rolls, and matches are stored in contract events.

---

## Contact

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

*This document is part of Backcoin Protocol's public documentation. All game results are verifiable on-chain via the Fortune Pool contract events.*
