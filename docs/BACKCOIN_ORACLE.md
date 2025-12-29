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
**Version:** 1.0.0  
**Last Updated:** December 2025  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# Backcoin Oracle

## Free Randomness for the Arbitrum Ecosystem

Backcoin Oracle is **Backchain Protocol's contribution** to the Arbitrum community. We built this oracle as a **public good** — any developer, any project, any smart contract can use it **completely free**.

No subscriptions. No tokens required. No fees. **Just pay gas.**

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

---

## Contract Addresses

| Network | Contract | Address | Explorer |
|---------|----------|---------|----------|
| **Arbitrum Sepolia** | Backcoin Oracle | `0x...` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x...) |
| **Arbitrum One** | Backcoin Oracle | Coming Soon | — |

---

## Quick Comparison

| Feature | Backcoin Oracle | Chainlink VRF |
|---------|-----------------|---------------|
| **Cost** | FREE | ~$0.25/request |
| **Speed** | Instant (1 TX) | 1-2 blocks (2 TX) |
| **Setup** | None | Subscription required |
| **LINK Tokens** | Not needed | Required |
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

## Practical Use Cases

### Use Case 1: Dice Game

**Scenario:** You're building a dice game where players bet on the outcome.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract DiceGame {
    IBackcoinOracle public oracle;
    
    event DiceRolled(address player, uint256 result, uint256 bet, bool won);
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /// @notice Player bets on a number (1-6)
    /// @param guessedNumber The number player thinks will come up
    function rollDice(uint256 guessedNumber) external payable {
        require(guessedNumber >= 1 && guessedNumber <= 6, "Pick 1-6");
        require(msg.value >= 0.001 ether, "Min bet 0.001 ETH");
        
        // Get random number 1-6
        uint256[] memory result = oracle.get_numbers(1, 1, 6);
        uint256 diceResult = result[0];
        
        bool won = (diceResult == guessedNumber);
        
        if (won) {
            // Winner gets 5x their bet
            uint256 prize = msg.value * 5;
            payable(msg.sender).transfer(prize);
        }
        
        emit DiceRolled(msg.sender, diceResult, msg.value, won);
    }
    
    /// @notice Roll multiple dice at once (e.g., Yahtzee)
    function rollMultipleDice(uint256 count) external returns (uint256[] memory) {
        require(count >= 1 && count <= 10, "1-10 dice max");
        
        // Get multiple dice rolls
        return oracle.get_numbers(count, 1, 6);
        // Returns: [4, 2, 6, 1, 3] for 5 dice
    }
}
```

**How it works:**
1. Player calls `rollDice(4)` betting the dice will show 4
2. Contract calls `oracle.get_numbers(1, 1, 6)`
3. Oracle returns `[4]` (random number between 1-6)
4. If result matches guess, player wins 5x

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
    mapping(uint256 => mapping(address => uint256[])) public tickets;
    
    uint256 public currentDrawId;
    uint256 public ticketPrice = 0.01 ether;
    
    event TicketPurchased(uint256 drawId, address player, uint256[] numbers);
    event DrawCompleted(uint256 drawId, uint256[] winningNumbers);
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /// @notice Buy a lottery ticket with 6 numbers
    /// @param numbers Your 6 chosen numbers (1-60, all unique)
    function buyTicket(uint256[] calldata numbers) external payable {
        require(msg.value >= ticketPrice, "Pay ticket price");
        require(numbers.length == 6, "Must pick 6 numbers");
        
        // Validate numbers are in range and unique
        for (uint i = 0; i < 6; i++) {
            require(numbers[i] >= 1 && numbers[i] <= 60, "Numbers must be 1-60");
            for (uint j = i + 1; j < 6; j++) {
                require(numbers[i] != numbers[j], "No duplicates");
            }
        }
        
        tickets[currentDrawId][msg.sender] = numbers;
        emit TicketPurchased(currentDrawId, msg.sender, numbers);
    }
    
    /// @notice Draw the winning numbers (admin only)
    function drawWinningNumbers() external {
        // Get 6 UNIQUE numbers from 1-60
        uint256[] memory winningNumbers = oracle.get_unique_numbers(6, 1, 60);
        // Returns: [7, 14, 23, 38, 45, 52] - all different!
        
        draws[currentDrawId] = Draw({
            drawId: currentDrawId,
            winningNumbers: winningNumbers,
            timestamp: block.timestamp,
            prizePool: address(this).balance
        });
        
        emit DrawCompleted(currentDrawId, winningNumbers);
        currentDrawId++;
    }
    
    /// @notice Check how many numbers you matched
    function checkTicket(uint256 drawId, address player) external view returns (uint256 matches) {
        uint256[] memory playerNumbers = tickets[drawId][player];
        uint256[] memory winning = draws[drawId].winningNumbers;
        
        for (uint i = 0; i < 6; i++) {
            for (uint j = 0; j < 6; j++) {
                if (playerNumbers[i] == winning[j]) {
                    matches++;
                    break;
                }
            }
        }
    }
}
```

**How it works:**
1. Players buy tickets choosing 6 numbers from 1-60
2. Admin calls `drawWinningNumbers()`
3. Oracle returns 6 UNIQUE random numbers: `[7, 14, 23, 38, 45, 52]`
4. Players check how many numbers they matched

**Why `get_unique_numbers`?** A lottery can't have duplicate winning numbers. `get_unique_numbers` guarantees all 6 numbers are different.

---

### Use Case 3: Fortune Pool (3-Tier Prize Game)

**Scenario:** A game with 3 prize tiers, each with different odds.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract FortunePool {
    IBackcoinOracle public oracle;
    
    // Prize tiers
    // Tier 1: 1 in 3 chance (33.3%) - Small prize
    // Tier 2: 1 in 10 chance (10%) - Medium prize  
    // Tier 3: 1 in 100 chance (1%) - Jackpot
    
    event GamePlayed(
        address player,
        uint256 tier1Result,  // 1-3
        uint256 tier2Result,  // 1-10
        uint256 tier3Result,  // 1-100
        uint256 totalPrize
    );
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /// @notice Play Fortune Pool
    function play() external payable returns (uint256 prize) {
        require(msg.value >= 0.01 ether, "Entry fee: 0.01 ETH");
        
        // Get all 3 random numbers in ONE transaction using batch
        uint64[] memory counts = new uint64[](3);
        uint64[] memory mins = new uint64[](3);
        uint64[] memory maxs = new uint64[](3);
        
        // Tier 1: 1 number from 1-3 (33.3% chance to hit 1)
        counts[0] = 1;
        mins[0] = 1;
        maxs[0] = 3;
        
        // Tier 2: 1 number from 1-10 (10% chance to hit 1)
        counts[1] = 1;
        mins[1] = 1;
        maxs[1] = 10;
        
        // Tier 3: 1 number from 1-100 (1% chance to hit 1)
        counts[2] = 1;
        mins[2] = 1;
        maxs[2] = 100;
        
        // Single call gets all 3 results
        uint256[][] memory results = oracle.get_batch(counts, mins, maxs);
        
        uint256 tier1 = results[0][0];  // e.g., 2
        uint256 tier2 = results[1][0];  // e.g., 7
        uint256 tier3 = results[2][0];  // e.g., 42
        
        // Calculate prizes
        if (tier1 == 1) prize += 0.02 ether;   // Tier 1 win: 2x
        if (tier2 == 1) prize += 0.05 ether;   // Tier 2 win: 5x
        if (tier3 == 1) prize += 0.5 ether;    // Tier 3 win: 50x (jackpot!)
        
        if (prize > 0) {
            payable(msg.sender).transfer(prize);
        }
        
        emit GamePlayed(msg.sender, tier1, tier2, tier3, prize);
        return prize;
    }
}
```

**How it works:**
1. Player pays 0.01 ETH to play
2. Contract calls `oracle.get_batch([1,1,1], [1,1,1], [3,10,100])`
3. Oracle returns `[[2], [7], [42]]` in ONE transaction
4. Contract checks each tier: if result is 1, player wins that tier
5. Prizes are paid out instantly

**Why `get_batch`?** Instead of 3 separate calls (3 transactions, 3x gas), `get_batch` gets all results in 1 transaction.

---

### Use Case 4: NFT Minting with Random Traits

**Scenario:** Mint NFTs with randomly assigned traits.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract RandomNFT {
    IBackcoinOracle public oracle;
    
    struct NFTTraits {
        uint256 background;  // 1-10 (10 backgrounds)
        uint256 body;        // 1-20 (20 body types)
        uint256 eyes;        // 1-15 (15 eye types)
        uint256 mouth;       // 1-12 (12 mouth types)
        uint256 accessory;   // 1-25 (25 accessories)
        uint256 rarity;      // 1-100 (determines rarity tier)
    }
    
    mapping(uint256 => NFTTraits) public tokenTraits;
    uint256 public totalSupply;
    
    event NFTMinted(uint256 tokenId, NFTTraits traits);
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /// @notice Mint a new NFT with random traits
    function mint() external payable returns (uint256 tokenId) {
        require(msg.value >= 0.05 ether, "Mint price: 0.05 ETH");
        
        tokenId = totalSupply++;
        
        // Get 6 random traits in one batch call
        uint64[] memory counts = new uint64[](6);
        uint64[] memory mins = new uint64[](6);
        uint64[] memory maxs = new uint64[](6);
        
        // Background: 1-10
        counts[0] = 1; mins[0] = 1; maxs[0] = 10;
        // Body: 1-20
        counts[1] = 1; mins[1] = 1; maxs[1] = 20;
        // Eyes: 1-15
        counts[2] = 1; mins[2] = 1; maxs[2] = 15;
        // Mouth: 1-12
        counts[3] = 1; mins[3] = 1; maxs[3] = 12;
        // Accessory: 1-25
        counts[4] = 1; mins[4] = 1; maxs[4] = 25;
        // Rarity: 1-100
        counts[5] = 1; mins[5] = 1; maxs[5] = 100;
        
        uint256[][] memory results = oracle.get_batch(counts, mins, maxs);
        
        NFTTraits memory traits = NFTTraits({
            background: results[0][0],
            body: results[1][0],
            eyes: results[2][0],
            mouth: results[3][0],
            accessory: results[4][0],
            rarity: results[5][0]
        });
        
        tokenTraits[tokenId] = traits;
        
        emit NFTMinted(tokenId, traits);
    }
    
    /// @notice Get rarity tier based on rarity score
    function getRarityTier(uint256 tokenId) external view returns (string memory) {
        uint256 rarity = tokenTraits[tokenId].rarity;
        
        if (rarity == 1) return "Legendary";      // 1% chance
        if (rarity <= 5) return "Epic";           // 4% chance
        if (rarity <= 15) return "Rare";          // 10% chance
        if (rarity <= 40) return "Uncommon";      // 25% chance
        return "Common";                           // 60% chance
    }
}
```

**How it works:**
1. User pays 0.05 ETH to mint
2. Contract calls `oracle.get_batch()` with 6 trait ranges
3. Oracle returns 6 random values for each trait
4. NFT is minted with those specific traits
5. Rarity is determined by the rarity score (1 = Legendary, very rare!)

---

### Use Case 5: Raffle / Giveaway

**Scenario:** Select 3 random winners from 500 participants.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract Raffle {
    IBackcoinOracle public oracle;
    
    address[] public participants;
    address[] public winners;
    bool public isComplete;
    
    event ParticipantEntered(address participant, uint256 index);
    event WinnersSelected(address[] winners);
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /// @notice Enter the raffle
    function enter() external {
        require(!isComplete, "Raffle ended");
        
        participants.push(msg.sender);
        emit ParticipantEntered(msg.sender, participants.length);
    }
    
    /// @notice Select winners (admin only)
    /// @param winnerCount How many winners to select
    function selectWinners(uint256 winnerCount) external {
        require(!isComplete, "Already completed");
        require(participants.length >= winnerCount, "Not enough participants");
        
        // Get UNIQUE random indices (no duplicate winners!)
        uint256[] memory winnerIndices = oracle.get_unique_numbers(
            uint64(winnerCount),
            0,                                    // min index
            uint64(participants.length - 1)       // max index
        );
        
        // Map indices to addresses
        for (uint i = 0; i < winnerCount; i++) {
            winners.push(participants[winnerIndices[i]]);
        }
        
        isComplete = true;
        emit WinnersSelected(winners);
    }
    
    /// @notice Get all winners
    function getWinners() external view returns (address[] memory) {
        return winners;
    }
}
```

**How it works:**
1. 500 people call `enter()` to join
2. Admin calls `selectWinners(3)`
3. Oracle returns 3 UNIQUE indices: `[142, 367, 23]`
4. Those 3 participants are the winners
5. **No one can win twice** because `get_unique_numbers` guarantees uniqueness

---

### Use Case 6: Card Game (Poker Deal)

**Scenario:** Deal 5 unique cards to a player.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract PokerGame {
    IBackcoinOracle public oracle;
    
    // Cards are numbered 1-52
    // 1-13 = Hearts (1=Ace, 11=J, 12=Q, 13=K)
    // 14-26 = Diamonds
    // 27-39 = Clubs  
    // 40-52 = Spades
    
    event HandDealt(address player, uint256[] cards);
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /// @notice Deal 5 cards (like video poker)
    function dealHand() external returns (uint256[] memory cards) {
        // Get 5 UNIQUE cards (can't deal same card twice!)
        cards = oracle.get_unique_numbers(5, 1, 52);
        // Returns: [7, 23, 45, 12, 38] - 5 different cards
        
        emit HandDealt(msg.sender, cards);
    }
    
    /// @notice Get card info from number
    function getCardInfo(uint256 cardNum) public pure returns (
        string memory suit,
        string memory value
    ) {
        require(cardNum >= 1 && cardNum <= 52, "Invalid card");
        
        uint256 suitNum = (cardNum - 1) / 13;
        uint256 valueNum = ((cardNum - 1) % 13) + 1;
        
        if (suitNum == 0) suit = "Hearts";
        else if (suitNum == 1) suit = "Diamonds";
        else if (suitNum == 2) suit = "Clubs";
        else suit = "Spades";
        
        if (valueNum == 1) value = "Ace";
        else if (valueNum == 11) value = "Jack";
        else if (valueNum == 12) value = "Queen";
        else if (valueNum == 13) value = "King";
        else value = toString(valueNum);
    }
    
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
```

**How it works:**
1. Player calls `dealHand()`
2. Oracle returns 5 UNIQUE numbers: `[7, 23, 45, 12, 38]`
3. Each number maps to a specific card
4. **No duplicate cards** because `get_unique_numbers` guarantees uniqueness

---

### Use Case 7: RPG Damage Calculation

**Scenario:** Calculate attack damage with critical hits.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract RPGBattle {
    IBackcoinOracle public oracle;
    
    event AttackResult(
        address attacker,
        uint256 baseDamage,
        bool isCritical,
        uint256 finalDamage
    );
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /// @notice Attack with damage variance and crit chance
    function attack(
        uint256 baseAttack,
        uint256 critChance
    ) external returns (uint256 damage, bool isCritical) {
        // Get 2 random numbers in one call:
        // 1. Damage variance (80-120% of base)
        // 2. Crit roll (1-100)
        
        uint64[] memory counts = new uint64[](2);
        uint64[] memory mins = new uint64[](2);
        uint64[] memory maxs = new uint64[](2);
        
        counts[0] = 1; mins[0] = 80; maxs[0] = 120;   // Damage %
        counts[1] = 1; mins[1] = 1; maxs[1] = 100;    // Crit roll
        
        uint256[][] memory results = oracle.get_batch(counts, mins, maxs);
        
        uint256 damagePercent = results[0][0];  // 80-120
        uint256 critRoll = results[1][0];       // 1-100
        
        // Calculate base damage with variance
        damage = (baseAttack * damagePercent) / 100;
        
        // Check for critical hit
        isCritical = (critRoll <= critChance);
        if (isCritical) {
            damage = damage * 2;  // Critical = 2x damage
        }
        
        emit AttackResult(msg.sender, baseAttack, isCritical, damage);
    }
}
```

---

### Use Case 8: Coin Flip (Simple Bet)

**Scenario:** Simple heads or tails game.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IBackcoinOracle.sol";

contract CoinFlip {
    IBackcoinOracle public oracle;
    
    event FlipResult(address player, bool guessedHeads, bool wasHeads, bool won, uint256 payout);
    
    constructor(address _oracle) {
        oracle = IBackcoinOracle(_oracle);
    }
    
    /// @notice Flip a coin
    /// @param guessHeads true = heads, false = tails
    function flip(bool guessHeads) external payable {
        require(msg.value >= 0.001 ether, "Min bet 0.001 ETH");
        
        // Get 0 or 1
        uint256[] memory result = oracle.get_numbers(1, 0, 1);
        bool wasHeads = (result[0] == 1);
        
        bool won = (guessHeads == wasHeads);
        uint256 payout = 0;
        
        if (won) {
            payout = msg.value * 2;  // 2x payout
            payable(msg.sender).transfer(payout);
        }
        
        emit FlipResult(msg.sender, guessHeads, wasHeads, won, payout);
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

**Q: Is this secure?**
> Yes! As secure as Arbitrum itself. Same trust model as $18B+ in DeFi.

**Q: Can I use this for gambling/lottery?**
> Yes! That's exactly what it's designed for.

**Q: What's the maximum numbers per call?**
> 500 numbers per call.

**Q: Can `get_unique_numbers` return duplicates?**
> No, never. All numbers are guaranteed unique.

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
