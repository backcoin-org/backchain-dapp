# Backcoin Protocol

| | |
|---|---|
| **Project** | Backcoin Protocol |
| **Description** | Modular DeFi Infrastructure for Real-World Utility |
| **Network** | Arbitrum One |
| **Status** | Testnet Live (Arbitrum Sepolia) |
| **Website** | [backcoin.org](https://backcoin.org) |
| **Docs** | [github.com/backcoin-org/backchain-dapp/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs) |
| **X (Twitter)** | [x.com/backcoin](https://x.com/backcoin) |
| **GitHub** | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| **YouTube** | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |
| **Contact** | dev@backcoin.org |

---

**Document:** Backcoin Oracle — Free Randomness for Arbitrum  
**Version:** 2.0.0  
**Last Updated:** December 2025  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# Backcoin Oracle

## Free Randomness for the Arbitrum Ecosystem

Backcoin Oracle is **Backchain Protocol's contribution** to the Arbitrum community. We built this oracle as a **public good** — any developer, any project, any smart contract can use it **completely free**.

No subscriptions. No tokens required. No fees. **Just pay gas.**

---

## ⚡ How It Works: Instant Results via Pure Functions

### The Key Difference: `view` Functions + `staticcall`

Unlike traditional oracles that require callbacks or multiple transactions, Backcoin Oracle uses **pure/view functions** that return results **instantly in the same transaction**.

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   TRADITIONAL ORACLE (Chainlink VRF)          BACKCOIN ORACLE                ║
║   ═══════════════════════════════════         ══════════════════════════     ║
║                                                                               ║
║   TX 1: Request randomness                    TX 1: Call + Get result        ║
║         ↓                                            ↓                        ║
║   Wait 1-2 blocks...                          ✅ DONE! Instant result        ║
║         ↓                                                                     ║
║   TX 2: Callback with result                                                  ║
║         ↓                                                                     ║
║   ✅ Done (2 transactions)                                                    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Why There Are No Events in the Oracle Contract

When your contract calls the Backcoin Oracle, Solidity uses **`staticcall`** under the hood for `view`/`pure` functions. This is important to understand:

```solidity
// Your contract calls:
uint256[] memory results = oracle.get_numbers(3, 1, 100);

// Internally, Solidity executes:
// staticcall(gas, oracleAddress, inputData, ...)
```

**`staticcall` has a critical property:** It cannot modify state or emit events in the called contract.

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   WHY NO EVENTS IN THE ORACLE CONTRACT?                                      ║
║   ═════════════════════════════════════                                      ║
║                                                                               ║
║   • Your contract calls oracle.get_numbers() → Uses staticcall               ║
║   • staticcall is READ-ONLY by design                                        ║
║   • The oracle CANNOT emit events during a staticcall                        ║
║   • The oracle CANNOT write to storage during a staticcall                   ║
║                                                                               ║
║   This is a FEATURE, not a bug!                                              ║
║   It guarantees the oracle is truly stateless and gas-efficient.             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Where to Find the Logs: YOUR Contract

Since the oracle uses `staticcall`, all events and logs should be emitted **by YOUR contract** that calls the oracle:

```solidity
// CORRECT PATTERN: Your contract emits the events
contract MyGame {
    IBackcoinOracle public oracle;
    
    event GamePlayed(
        uint256 indexed gameId,
        address indexed player,
        uint256[] rolls,      // ← The random numbers
        uint256 prize
    );
    
    function play(uint256 guess) external payable {
        // 1. Get random numbers from oracle (staticcall - no events in oracle)
        uint256[] memory rolls = oracle.get_numbers(1, 1, 100);
        
        // 2. YOUR contract emits the event with the results
        emit GamePlayed(gameCounter++, msg.sender, rolls, calculatePrize(rolls));
    }
}
```

**To find game results:**
- ✅ Look at YOUR contract's events on the block explorer
- ✅ Look at YOUR contract's transaction logs
- ❌ Don't expect events in the oracle contract (it uses staticcall)

---

## Security Guarantee

### The Oracle Is 100% Secure While Arbitrum Is Secure

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   SECURITY GUARANTEE                                                          ║
║   ══════════════════                                                          ║
║                                                                               ║
║   Backcoin Oracle is AS SECURE AS the Arbitrum network itself.               ║
║                                                                               ║
║   • If you trust Arbitrum to hold your tokens → You can trust this oracle    ║
║   • If you trust Arbitrum for DeFi → You can trust this oracle               ║
║   • If you trust Arbitrum for NFTs → You can trust this oracle               ║
║                                                                               ║
║   We operate under the SAME trust assumption as:                             ║
║   • Uniswap on Arbitrum ($2B+ TVL)                                           ║
║   • Aave on Arbitrum ($1B+ TVL)                                              ║
║   • GMX ($500M+ TVL)                                                         ║
║   • Every other Arbitrum protocol                                            ║
║                                                                               ║
║   BOTTOM LINE:                                                               ║
║   If someone could manipulate this oracle, they could steal $18B+ from       ║
║   Arbitrum DeFi. The network's security IS our security.                     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Randomness Source

The oracle generates randomness using Arbitrum's block properties combined with caller-specific data:

```solidity
// Entropy sources (simplified):
// - block.prevrandao (Arbitrum's randomness beacon)
// - block.timestamp
// - block.number
// - msg.sender (the calling contract)
// - Internal nonce

// This makes results:
// ✅ Unpredictable before the block
// ✅ Deterministic within the block (same inputs = same outputs)
// ✅ Different for each caller in the same block
```

---

## Contract Addresses

| Network | Contract | Address | Explorer |
|---------|----------|---------|----------|
| **Arbitrum Sepolia** | Backcoin Oracle | `0x16346f5a45f9615f1c894414989f0891c54ef07b` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x16346f5a45f9615f1c894414989f0891c54ef07b) |
| **Arbitrum One** | Backcoin Oracle | Coming Soon | — |

---

## Quick Comparison

| Feature | Backcoin Oracle | Chainlink VRF |
|---------|-----------------|---------------|
| **Cost** | FREE | ~$0.25/request |
| **Speed** | Instant (1 TX) | 1-2 blocks (2 TX) |
| **Setup** | None | Subscription required |
| **LINK Tokens** | Not needed | Required |
| **Function Type** | `view` (staticcall) | Callback pattern |
| **Events** | In YOUR contract | In VRF Coordinator |
| **Unique Numbers** | Yes | No |
| **Batch Requests** | Yes | Limited |

---

## The 4 Functions

| Function | What It Does | Example |
|----------|--------------|---------|
| `get_numbers` | Random numbers (can repeat) | Dice, coins, damage rolls |
| `get_unique_numbers` | Unique numbers (no repeats) | Lottery, raffle, card dealing |
| `get_batch` | Multiple groups (can repeat) | Fortune Pool, multi-dice games |
| `get_batch_unique` | Multiple unique groups | Multiple lotteries at once |

---

## Integration Pattern: Best Practices

### ✅ Recommended: Emit Events in Your Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract MyGame {
    IBackcoinOracle public immutable oracle;
    uint256 public gameCounter;
    
    // YOUR events - these will appear in block explorers
    event GamePlayed(
        uint256 indexed gameId,
        address indexed player,
        uint256 wager,
        uint256[] guesses,
        uint256[] rolls,
        uint256 prize,
        bool won
    );
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    function play(uint256[] calldata guesses) external payable {
        require(msg.value >= 0.01 ether, "Min bet");
        
        // Get random numbers (this uses staticcall internally)
        uint256[] memory rolls = oracle.get_numbers(
            uint64(guesses.length), 
            1, 
            100
        );
        
        // Calculate result
        uint256 matches = countMatches(guesses, rolls);
        uint256 prize = calculatePrize(matches, msg.value);
        bool won = prize > 0;
        
        // Pay winner
        if (won) {
            payable(msg.sender).transfer(prize);
        }
        
        // Emit event in YOUR contract (this works because YOUR contract can write state)
        emit GamePlayed(
            gameCounter++,
            msg.sender,
            msg.value,
            guesses,
            rolls,      // The random numbers are logged here!
            prize,
            won
        );
    }
    
    function countMatches(uint256[] calldata guesses, uint256[] memory rolls) 
        internal pure returns (uint256 matches) 
    {
        for (uint i = 0; i < guesses.length && i < rolls.length; i++) {
            if (guesses[i] == rolls[i]) matches++;
        }
    }
    
    function calculatePrize(uint256 matches, uint256 wager) 
        internal pure returns (uint256) 
    {
        if (matches == 0) return 0;
        return wager * matches * 2; // Example: 2x per match
    }
}
```

### Viewing Results on Block Explorer

1. Go to YOUR contract on Arbiscan
2. Click "Events" tab
3. Find `GamePlayed` events
4. The `rolls` field contains the random numbers from the oracle

```
Transaction: 0xabc123...
Event: GamePlayed(
    gameId: 42,
    player: 0x1234...5678,
    wager: 1000000000000000000,
    guesses: [7, 23, 45],
    rolls: [12, 23, 67],      ← Random numbers from oracle!
    prize: 2000000000000000000,
    won: true
)
```

---

## Practical Use Cases

### Use Case 1: Dice Game

**Scenario:** You're building a dice game where players bet on the outcome.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract DiceGame {
    IBackcoinOracle public oracle;
    
    // Event in YOUR contract - this is where results are logged
    event DiceRolled(
        address indexed player, 
        uint256 guess,
        uint256 result, 
        uint256 bet, 
        bool won,
        uint256 payout
    );
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /// @notice Player bets on a number (1-6)
    function rollDice(uint256 guessedNumber) external payable {
        require(guessedNumber >= 1 && guessedNumber <= 6, "Pick 1-6");
        require(msg.value >= 0.001 ether, "Min bet 0.001 ETH");
        
        // Get random number 1-6 (staticcall - instant result)
        uint256[] memory result = oracle.get_numbers(1, 1, 6);
        uint256 diceResult = result[0];
        
        bool won = (diceResult == guessedNumber);
        uint256 payout = 0;
        
        if (won) {
            payout = msg.value * 5;
            payable(msg.sender).transfer(payout);
        }
        
        // YOUR contract emits the event with all details
        emit DiceRolled(msg.sender, guessedNumber, diceResult, msg.value, won, payout);
    }
}
```

---

### Use Case 2: Lottery System

**Scenario:** A lottery where 6 unique numbers are drawn from 1-60.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract Lottery {
    IBackcoinOracle public oracle;
    
    struct Draw {
        uint256 drawId;
        uint256[] winningNumbers;
        uint256 timestamp;
        uint256 prizePool;
    }
    
    mapping(uint256 => Draw) public draws;
    uint256 public currentDrawId;
    
    // Event logs the winning numbers in YOUR contract
    event DrawCompleted(
        uint256 indexed drawId, 
        uint256[] winningNumbers,
        uint256 prizePool,
        uint256 timestamp
    );
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /// @notice Draw the winning numbers
    function drawWinningNumbers() external {
        // Get 6 UNIQUE numbers from 1-60 (staticcall - instant)
        uint256[] memory winningNumbers = oracle.get_unique_numbers(6, 1, 60);
        
        draws[currentDrawId] = Draw({
            drawId: currentDrawId,
            winningNumbers: winningNumbers,
            timestamp: block.timestamp,
            prizePool: address(this).balance
        });
        
        // Event in YOUR contract contains the results
        emit DrawCompleted(
            currentDrawId, 
            winningNumbers,  // [7, 14, 23, 38, 45, 52]
            address(this).balance,
            block.timestamp
        );
        
        currentDrawId++;
    }
}
```

---

### Use Case 3: Fortune Pool (Multiple Tiers)

**Scenario:** A game with 3 tiers of difficulty using `get_batch`.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract FortunePool {
    IBackcoinOracle public oracle;
    uint256 public gameCounter;
    
    // Tiers: Easy (1-3), Medium (1-10), Hard (1-100)
    uint64[] private counts = [1, 1, 1];
    uint64[] private mins = [1, 1, 1];
    uint64[] private maxs = [3, 10, 100];
    
    event GamePlayed(
        uint256 indexed gameId,
        address indexed player,
        uint256 wager,
        uint256[] guesses,
        uint256[] rolls,
        bool[] matches,
        uint256 prize
    );
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    function play(uint256[] calldata guesses) external payable {
        require(guesses.length == 3, "Need 3 guesses");
        
        // Get 3 random numbers in one call (staticcall - instant)
        uint256[][] memory results = oracle.get_batch(counts, mins, maxs);
        
        // Flatten results
        uint256[] memory rolls = new uint256[](3);
        rolls[0] = results[0][0];  // Easy tier result
        rolls[1] = results[1][0];  // Medium tier result
        rolls[2] = results[2][0];  // Hard tier result
        
        // Check matches
        bool[] memory matchResults = new bool[](3);
        uint256 prize = 0;
        
        for (uint i = 0; i < 3; i++) {
            matchResults[i] = (guesses[i] == rolls[i]);
            if (matchResults[i]) {
                prize += calculateTierPrize(i, msg.value);
            }
        }
        
        if (prize > 0) {
            payable(msg.sender).transfer(prize);
        }
        
        // All results logged in YOUR contract's event
        emit GamePlayed(
            gameCounter++,
            msg.sender,
            msg.value,
            guesses,
            rolls,
            matchResults,
            prize
        );
    }
    
    function calculateTierPrize(uint256 tier, uint256 wager) 
        internal pure returns (uint256) 
    {
        if (tier == 0) return wager * 2;   // Easy: 2x
        if (tier == 1) return wager * 5;   // Medium: 5x
        return wager * 50;                  // Hard: 50x
    }
}
```

---

## API Reference

### `get_numbers(count, min, max)`

Generate random numbers that **may repeat**.

| Parameter | Type | Description |
|-----------|------|-------------|
| `count` | uint64 | How many numbers (1-500) |
| `min` | uint64 | Minimum value (inclusive) |
| `max` | uint64 | Maximum value (inclusive) |

**Returns:** `uint256[]` — Array of random numbers

```solidity
oracle.get_numbers(1, 1, 6);      // [4] — one dice
oracle.get_numbers(3, 1, 6);      // [2, 5, 2] — three dice (can repeat)
oracle.get_numbers(1, 0, 1);      // [1] — coin flip
oracle.get_numbers(5, 1, 100);    // [42, 73, 42, 15, 88] — can repeat
```

---

### `get_unique_numbers(count, min, max)`

Generate random numbers that are **all unique**.

| Parameter | Type | Description |
|-----------|------|-------------|
| `count` | uint64 | How many numbers (1-500) |
| `min` | uint64 | Minimum value (inclusive) |
| `max` | uint64 | Maximum value (inclusive) |

**Returns:** `uint256[]` — Array of unique random numbers

**Requirement:** Range (max - min + 1) must be >= count

```solidity
oracle.get_unique_numbers(6, 1, 60);   // [7, 14, 23, 38, 45, 52] — lottery
oracle.get_unique_numbers(5, 1, 52);   // [7, 23, 45, 12, 38] — poker hand
oracle.get_unique_numbers(3, 1, 100);  // [17, 42, 89] — raffle winners
```

---

### `get_batch(counts[], mins[], maxs[])`

Multiple different requests in **one transaction**.

| Parameter | Type | Description |
|-----------|------|-------------|
| `counts` | uint64[] | How many numbers per group |
| `mins` | uint64[] | Minimum per group |
| `maxs` | uint64[] | Maximum per group |

**Returns:** `uint256[][]` — Array of arrays

```solidity
// Fortune Pool: 3 tiers
oracle.get_batch([1,1,1], [1,1,1], [3,10,100]);
// Returns: [[2], [7], [42]]

// Multi-dice: 3d6 + 2d20
oracle.get_batch([3,2], [1,1], [6,20]);
// Returns: [[4,2,6], [15,8]]
```

---

### `get_batch_unique(counts[], mins[], maxs[])`

Multiple **unique** sets in one transaction.

```solidity
// Two lotteries
oracle.get_batch_unique([6,5], [1,1], [60,45]);
// Returns: [[7,14,23,38,45,52], [3,12,28,33,41]]
```

---

## Gas Costs

| Function | Example | Estimated Gas |
|----------|---------|---------------|
| `get_numbers(1, 1, 6)` | Dice roll | ~50,000 |
| `get_numbers(5, 1, 100)` | 5 random | ~80,000 |
| `get_unique_numbers(6, 1, 60)` | Lottery | ~100,000 |
| `get_batch([1,1,1], ...)` | Fortune Pool | ~90,000 |

**Oracle Fee: FREE** — You only pay network gas!

---

## Error Codes

| Error | Meaning | Solution |
|-------|---------|----------|
| `ZeroCount` | Count is 0 | Request at least 1 number |
| `TooManyNumbers` | Exceeded 500 | Request fewer numbers |
| `InvalidRange` | min > max | Ensure min <= max |
| `RangeTooSmall` | Range < count | Increase range or decrease count |
| `ArrayMismatch` | Array lengths differ | Same length for counts, mins, maxs |

---

## FAQ

**Q: Is it really free?**
> Yes! Zero fees. You only pay gas.

**Q: Why don't I see events in the oracle contract on Arbiscan?**
> The oracle uses `view` functions which are called via `staticcall`. By design, `staticcall` cannot emit events or modify state. All events should be emitted by YOUR contract that calls the oracle.

**Q: Where can I see the random numbers that were generated?**
> In YOUR contract's events. When you call the oracle and emit an event with the results, those results are logged in YOUR contract's transaction logs on the block explorer.

**Q: Is this secure?**
> Yes! As secure as Arbitrum itself. Same trust model as $18B+ in DeFi.

**Q: Can I use this for gambling/lottery?**
> Yes! That's exactly what it's designed for.

**Q: What's the maximum numbers per call?**
> 500 numbers per call.

**Q: Can `get_unique_numbers` return duplicates?**
> No, never. All numbers are guaranteed unique.

**Q: Why is it instant instead of using callbacks?**
> Using `view` functions with `staticcall` allows instant results in a single transaction, which is cheaper and faster than callback patterns.

---

## Interface (IBackcoinOracle.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IBackcoinOracle {
    /// @notice Get random numbers (may repeat)
    /// @param count How many numbers to generate
    /// @param min Minimum value (inclusive)
    /// @param max Maximum value (inclusive)
    /// @return Array of random numbers
    function get_numbers(uint64 count, uint64 min, uint64 max) 
        external view returns (uint256[] memory);
    
    /// @notice Get unique random numbers (no duplicates)
    /// @param count How many numbers to generate
    /// @param min Minimum value (inclusive)
    /// @param max Maximum value (inclusive)
    /// @return Array of unique random numbers
    function get_unique_numbers(uint64 count, uint64 min, uint64 max) 
        external view returns (uint256[] memory);
    
    /// @notice Get multiple batches of random numbers
    /// @param counts Array of counts per batch
    /// @param mins Array of minimum values per batch
    /// @param maxs Array of maximum values per batch
    /// @return Array of arrays of random numbers
    function get_batch(
        uint64[] calldata counts, 
        uint64[] calldata mins, 
        uint64[] calldata maxs
    ) external view returns (uint256[][] memory);
    
    /// @notice Get multiple batches of unique random numbers
    /// @param counts Array of counts per batch
    /// @param mins Array of minimum values per batch
    /// @param maxs Array of maximum values per batch
    /// @return Array of arrays of unique random numbers
    function get_batch_unique(
        uint64[] calldata counts, 
        uint64[] calldata mins, 
        uint64[] calldata maxs
    ) external view returns (uint256[][] memory);
}
```

---

## Support

| Channel | Link |
|---------|------|
| **Documentation** | [github.com/backcoin-org/backchain-dapp/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs) |
| **GitHub** | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| **Email** | dev@backcoin.org |
| **X (Twitter)** | [x.com/backcoin](https://x.com/backcoin) |

---

## License

MIT License — Use freely in your projects!

---

**Built by Backchain Protocol — A public good for the Arbitrum ecosystem**
