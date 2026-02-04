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

**Document:** Backcoin Oracle — Free & Unstoppable Randomness  
**Version:** 2.0.0  
**Last Updated:** February 2026  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# Backcoin Oracle

## Free Randomness For All

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                      A PUBLIC GOOD. A UNIVERSAL RIGHT.                            ║
║                                                                                   ║
║   Just as Voltaire defended everyone's right to their own voice,                 ║
║   we defend everyone's right to fair and free randomness.                        ║
║                                                                                   ║
║   It doesn't matter who you are.                                                 ║
║   It doesn't matter where you come from.                                         ║
║   It doesn't matter what you're going to build.                                  ║
║                                                                                   ║
║   The Oracle is yours. Free. Forever.                                            ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

Backcoin Oracle is **Backchain Protocol's contribution** to the Arbitrum community. We built this oracle as a **public good** — any developer, any project, any smart contract can use it **completely free**.

No subscriptions. No tokens required. No fees. **Just pay gas.**

---

## 🔥 Why This Matters

In a world where centralized oracles can:
- Charge exorbitant fees
- Require specific tokens
- Deny service to whomever they want
- Change prices unilaterally

**We built the alternative.**

An oracle where:
- **No one** can charge you fees
- **No one** can deny you access
- **No one** can manipulate your results
- **Anyone** can use it, always

---

## 🌍 Become an Operator

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                         BUILD. INTEGRATE. EARN.                                   ║
║                                                                                   ║
║   Anyone in the world can:                                                        ║
║                                                                                   ║
║   1. Build their own game, lottery, app, or tool                                 ║
║   2. Integrate Backcoin Oracle for free                                          ║
║   3. Pass their address as "operator" in other ecosystem functions               ║
║   4. Earn a percentage of ALL generated fees                                     ║
║                                                                                   ║
║   No registration. No approval. No KYC. Just build and earn.                     ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

The Oracle itself is free, but when you build games and applications using the Oracle together with other ecosystem contracts (FortunePool, Backchat, etc.), you can pass your address as operator and earn commissions from all transactions!

---

## ⚡ How It Works: Instant Results

### The Key Difference: `view` Functions + `staticcall`

Unlike traditional oracles that require callbacks or multiple transactions, Backcoin Oracle uses **pure/view functions** that return results **instantly in the same transaction**.

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   TRADITIONAL ORACLE (Chainlink VRF)          BACKCOIN ORACLE                    ║
║   ══════════════════════════════════          ═══════════════════════════        ║
║                                                                                   ║
║   TX 1: Request randomness                    TX 1: Call + Get result            ║
║         ↓                                            ↓                            ║
║   Wait 1-2 blocks...                          ✅ DONE! Instant result            ║
║         ↓                                                                         ║
║   TX 2: Callback with result                                                      ║
║         ↓                                                                         ║
║   ✅ Done (2 transactions)                                                        ║
║                                                                                   ║
║   💰 Cost: ~$0.25/request + gas               💰 Cost: FREE (gas only)           ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
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
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   WHY NO EVENTS IN THE ORACLE CONTRACT?                                          ║
║   ═════════════════════════════════════                                          ║
║                                                                                   ║
║   • Your contract calls oracle.get_numbers() → Uses staticcall                   ║
║   • staticcall is READ-ONLY by design                                            ║
║   • The oracle CANNOT emit events during a staticcall                            ║
║   • The oracle CANNOT write to storage during a staticcall                       ║
║                                                                                   ║
║   This is a FEATURE, not a bug!                                                  ║
║   It guarantees the oracle is truly stateless and gas-efficient.                 ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
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
        uint256[] results,      // ← The random numbers
        uint256 prize
    );
    
    function play(uint256 guess) external payable {
        // 1. Get random numbers from oracle (staticcall - no events in oracle)
        uint256[] memory results = oracle.get_numbers(1, 1, 100);
        
        // 2. YOUR contract emits the event with the results
        emit GamePlayed(gameCounter++, msg.sender, results, calculatePrize(results));
    }
}
```

**To find game results:**
- ✅ Look at YOUR contract's events on the block explorer
- ✅ Look at YOUR contract's transaction logs
- ❌ Don't expect events in the oracle contract (it uses staticcall)

---

## 🛡️ Security Guarantee

### The Oracle Is 100% Secure While Arbitrum Is Secure

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   SECURITY GUARANTEE                                                              ║
║   ══════════════════                                                              ║
║                                                                                   ║
║   Backcoin Oracle is AS SECURE AS the Arbitrum network itself.                   ║
║                                                                                   ║
║   • If you trust Arbitrum to hold your tokens → You can trust this oracle        ║
║   • If you trust Arbitrum for DeFi → You can trust this oracle                   ║
║   • If you trust Arbitrum for NFTs → You can trust this oracle                   ║
║                                                                                   ║
║   We operate under the SAME trust assumption as:                                 ║
║   • Uniswap on Arbitrum ($2B+ TVL)                                               ║
║   • Aave on Arbitrum ($1B+ TVL)                                                  ║
║   • GMX ($500M+ TVL)                                                             ║
║   • Every other Arbitrum protocol                                                ║
║                                                                                   ║
║   BOTTOM LINE:                                                                   ║
║   If someone could manipulate this oracle, they could steal $18B+ from           ║
║   Arbitrum DeFi. The network's security IS our security.                         ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
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

## 📍 Contract Addresses

| Network | Contract | Address | Explorer |
|---------|----------|---------|----------|
| **Arbitrum Sepolia** | Backcoin Oracle | `0x16346f5a45f9615f1c894414989f0891c54ef07b` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x16346f5a45f9615f1c894414989f0891c54ef07b) |
| **Arbitrum One** | Backcoin Oracle | Coming Soon | — |

---

## ⚖️ Quick Comparison

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
| **Permission Required** | None | Registration |
| **Can Be Censored** | No | Depends |

---

## 🎲 The 4 Functions

| Function | What It Does | Example |
|----------|--------------|---------|
| `get_numbers` | Random numbers (can repeat) | Dice, coins, damage rolls |
| `get_unique_numbers` | Unique numbers (no repeats) | Lottery, raffle, card dealing |
| `get_batch` | Multiple groups (can repeat) | Fortune Pool, multi-dice games |
| `get_batch_unique` | Multiple unique groups | Multiple lotteries at once |

---

## 🏗️ Integration Pattern: Best Practices

### ✅ Recommended: Emit Events in Your Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

/**
 * @title MyGame
 * @notice Example game using Backcoin Oracle
 * @dev Anyone can build and earn as an ecosystem operator!
 */
contract MyGame {
    IBackcoinOracle public immutable oracle;
    uint256 public gameCounter;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // Events - Emitted by YOUR contract (not by the oracle)
    // ═══════════════════════════════════════════════════════════════════════════
    
    event GamePlayed(
        uint256 indexed gameId,
        address indexed player,
        uint256[] results,
        uint256 prize,
        uint256 timestamp
    );
    
    event DiceRolled(
        uint256 indexed gameId,
        address indexed player,
        uint256 value1,
        uint256 value2,
        uint256 sum
    );
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /**
     * @notice Roll dice - instant result!
     * @dev Call this function and receive the result in the same transaction
     */
    function rollDice() external payable returns (uint256 sum) {
        // 1. Get 2 dice from oracle (instant via staticcall)
        uint256[] memory dice = oracle.get_numbers(2, 1, 6);
        
        sum = dice[0] + dice[1];
        
        // 2. Emit event with results (in YOUR contract)
        emit DiceRolled(
            gameCounter,
            msg.sender,
            dice[0],
            dice[1],
            sum
        );
        
        gameCounter++;
    }
    
    /**
     * @notice Lottery - 6 unique numbers from 1 to 60
     */
    function playLottery() external payable returns (uint256[] memory numbers) {
        // Unique numbers guaranteed - never repeat!
        numbers = oracle.get_unique_numbers(6, 1, 60);
        
        emit GamePlayed(
            gameCounter++,
            msg.sender,
            numbers,
            0, // prize calculated later
            block.timestamp
        );
    }
    
    /**
     * @notice Fortune Pool style - multiple tiers
     */
    function playFortune() external payable returns (uint256[][] memory results) {
        // 3 tiers: easy (1-3), medium (1-10), hard (1-100)
        uint64[] memory counts = new uint64[](3);
        uint64[] memory mins = new uint64[](3);
        uint64[] memory maxs = new uint64[](3);
        
        counts[0] = 1; mins[0] = 1; maxs[0] = 3;    // Easy: 33% chance
        counts[1] = 1; mins[1] = 1; maxs[1] = 10;   // Medium: 10% chance
        counts[2] = 1; mins[2] = 1; maxs[2] = 100;  // Hard: 1% chance
        
        results = oracle.get_batch(counts, mins, maxs);
        
        // Process winnings...
    }
}
```

---

## 📖 API Reference

### `get_numbers(count, min, max)`

Generate random numbers that **may repeat**.

| Parameter | Type | Description |
|-----------|------|-------------|
| `count` | uint64 | How many numbers (1-500) |
| `min` | uint64 | Minimum value (inclusive) |
| `max` | uint64 | Maximum value (inclusive) |

**Returns:** `uint256[]` — Array of random numbers

```solidity
oracle.get_numbers(1, 1, 6);      // [4] — one die
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

## ⛽ Gas Costs

| Function | Example | Estimated Gas |
|----------|---------|---------------|
| `get_numbers(1, 1, 6)` | Dice roll | ~50,000 |
| `get_numbers(5, 1, 100)` | 5 random | ~80,000 |
| `get_unique_numbers(6, 1, 60)` | Lottery | ~100,000 |
| `get_batch([1,1,1], ...)` | Fortune Pool | ~90,000 |

**Oracle Fee: FREE** — You only pay network gas!

---

## ❌ Error Codes

| Error | Meaning | Solution |
|-------|---------|----------|
| `ZeroCount` | Count is 0 | Request at least 1 number |
| `TooManyNumbers` | Exceeded 500 | Request fewer numbers |
| `InvalidRange` | min > max | Ensure min <= max |
| `RangeTooSmall` | Range < count | Increase range or decrease count |
| `ArrayMismatch` | Array lengths differ | Same length for counts, mins, maxs |

---

## ❓ FAQ

**Q: Is it really free?**
> Yes! Zero fees. You only pay network gas.

**Q: Why don't I see events in the oracle contract on Arbiscan?**
> The oracle uses `view` functions which are called via `staticcall`. By design, `staticcall` cannot emit events or modify state. All events should be emitted by YOUR contract that calls the oracle.

**Q: Where can I see the random numbers that were generated?**
> In YOUR contract's events. When you call the oracle and emit an event with the results, those results are logged in YOUR contract's transaction logs on the block explorer.

**Q: Is it secure?**
> Yes! As secure as Arbitrum itself. Same trust model as $18B+ in DeFi.

**Q: Can I use it for gambling/lottery?**
> Yes! That's exactly what it's designed for.

**Q: What's the maximum numbers per call?**
> 500 numbers per call.

**Q: Can `get_unique_numbers` return duplicates?**
> No, never. All numbers are guaranteed unique.

**Q: Why is it instant instead of using callbacks?**
> Using `view` functions with `staticcall` allows instant results in a single transaction, which is cheaper and faster than callback patterns.

**Q: Can anyone use it without permission?**
> Yes! No registration, approval, or KYC required. Just call the functions.

---

## 📜 Interface (IBackcoinOracle.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IBackcoinOracle
 * @notice Interface for Backcoin Oracle - Free & Unstoppable Randomness
 * @dev A public good for the Arbitrum ecosystem
 * 
 * "I may not agree with what you say, but I will defend to the death
 *  your right to say it." — Voltaire
 * 
 * We defend everyone's right to fair and free randomness.
 */
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

## 🌍 Part of Something Bigger

Backcoin Oracle is just one piece of the **Backchain Protocol** — a complete and unstoppable DeFi ecosystem:

| Contract | Address (Testnet) | Description |
|----------|-------------------|-------------|
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` | Native ecosystem token |
| **Backcoin Oracle** | `0x16346f5a45f9615f1c894414989f0891c54ef07b` | Free randomness |
| **Fortune Pool** | `0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF` | Games of chance |
| **Delegation Manager** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` | Staking & delegation |
| **Charity Pool** | `0x259271F3558bCa03Ddc8D7494CCF833751483Fb1` | Decentralized crowdfunding |
| **Rental Manager** | `0x593A842d214516F216EB6E6E9A97cC84F42f6821` | NFT rentals |
| **Decentralized Notary** | `0x2E56650a4f05D0f98787694c6C61603616716b48` | On-chain notarization |
| **Backchat** | `0x0D8c2862df03F5be4b569C5ffF4D3aaAEE44BDDb` | Decentralized social network |

**All contracts support the operator system** — build interfaces, pass your address, and earn commissions!

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

MIT License — Use freely in your projects!

---

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                        BUILT BY BACKCHAIN PROTOCOL                                ║
║                                                                                   ║
║              A public good for the Arbitrum ecosystem and the world.             ║
║                                                                                   ║
║   Code is law. Blockchain is the judge. Math is truth.                           ║
║                                                                                   ║
║   No one can stop it. No one can censor it. No one can control it.               ║
║                                                                                   ║
║                          THE PROTOCOL IS UNSTOPPABLE.                             ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```
