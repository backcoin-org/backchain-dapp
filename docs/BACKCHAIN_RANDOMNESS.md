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

**Document:** BackchainRandomness — Free On-Chain Randomness Oracle  
**Version:** 1.0  
**Last Updated:** December 2025  

---

# BackchainRandomness Oracle

## Free Randomness for the Entire Arbitrum Ecosystem

We built this oracle as a **public good** for Arbitrum. Any developer, any project, any smart contract can use it **completely free**. No subscriptions, no tokens required, no fees — just pay gas.

---

## Contract Addresses

| Contract | Address | Explorer |
|----------|---------|----------|
| **BackchainRandomness** | `0x6eB891C2C7bC248EdDf31c77C4258205a37C4126` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x6eB891C2C7bC248EdDf31c77C4258205a37C4126) |
| **StylusEntropy (Rust)** | `0xb6bb5e9c9df36fa9504d87125af0e4b284b55092` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0xb6bb5e9c9df36fa9504d87125af0e4b284b55092) |

---

## Why We Built This

| Problem with Existing Solutions | Our Solution |
|--------------------------------|--------------|
| Chainlink VRF costs LINK tokens | **100% Free** |
| VRF requires subscription setup | **No setup required** |
| VRF has 2+ block callback delay | **Instant or Commit-Reveal** |
| Block hash is predictable | **Multiple entropy sources** |
| Complex integration patterns | **Simple function calls** |

---

## Two Security Modes

We offer **two modes** because different applications have different security needs:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   🚀 QUICK MODE                         🔒 SECURE MODE                  │
│   ═════════════                         ══════════════                  │
│                                                                         │
│   ✓ 1 transaction                       ✓ 2 transactions               │
│   ✓ Instant result                      ✓ Commit → Wait 3 blocks →     │
│   ✓ ~60,000 gas                           Reveal                        │
│   ✓ Simple integration                  ✓ ~300,000 gas total           │
│                                         ✓ Manipulation-proof            │
│                                                                         │
│   Security: ⭐⭐                          Security: ⭐⭐⭐⭐⭐               │
│   (Moderate)                            (Excellent)                     │
│                                                                         │
│   Best for:                             Best for:                       │
│   • Games under $1,000                  • Lotteries over $1,000         │
│   • NFT trait generation                • Betting systems               │
│   • Casual dice/card games              • Tournament seeding            │
│   • Random selections                   • Prize drawings                │
│   • Airdrops                            • Any high-stakes randomness    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## How Quick Mode Works

### The Process

```
┌──────────────┐         ┌─────────────────────────┐         ┌──────────────┐
│  Your dApp   │ ──────► │  BackchainRandomness    │ ──────► │   Result     │
│              │  call   │                         │ return  │              │
│ getRandom()  │         │  1. Get Stylus entropy  │         │  Random #    │
└──────────────┘         │  2. Get block hash      │         └──────────────┘
                         │  3. Mix with keccak256  │
                         │  4. Return number       │
                         └─────────────────────────┘
```

### Entropy Sources (Quick Mode)

| Source | What It Provides |
|--------|------------------|
| **Stylus Entropy** | LCG-based PRNG from Rust contract, increments each call |
| **Block Hash** | `blockhash(block.number - 1)` — previous block's hash |
| **Caller Data** | `msg.sender` address mixed into entropy |

### Code Example — Quick Mode

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBackchainRandomness {
    function getRandom(uint256 min, uint256 max) external returns (uint256);
    function getRandoms(uint256[] calldata mins, uint256[] calldata maxs) external returns (uint256[] memory);
}

contract MyGame {
    // Just point to our oracle — that's it!
    IBackchainRandomness constant ORACLE = 
        IBackchainRandomness(0x6eB891C2C7bC248EdDf31c77C4258205a37C4126);
    
    // Roll a dice — returns 1 to 6
    function rollDice() external returns (uint256) {
        return ORACLE.getRandom(1, 6);
    }
}
```

**That's all you need.** No setup, no subscription, no tokens.

---

## How Secure Mode Works

### The Two-Step Process

```
STEP 1: COMMIT                              STEP 2: REVEAL (after 3+ blocks)
══════════════                              ════════════════════════════════

┌─────────────┐                             ┌─────────────┐
│   User      │                             │   User      │
│             │                             │             │
│ 1. Generate │                             │ 1. Call     │
│    secret   │                             │    reveal() │
│             │                             │    with     │
│ 2. Call     │                             │    secret   │
│    commit() │                             │             │
│    with     │                             │ 2. Get      │
│    hash     │                             │    random   │
└──────┬──────┘                             └──────┬──────┘
       │                                           │
       ▼                                           ▼
┌─────────────────────┐                     ┌─────────────────────┐
│  Oracle stores:     │                     │  Oracle combines:   │
│                     │                     │                     │
│  • hash(secret)     │   WAIT 3 BLOCKS    │  • Your secret      │
│  • block number     │ ════════════════►  │  • Request ID       │
│  • request ID       │                     │  • Stylus entropy 1 │
│                     │                     │  • Stylus entropy 2 │
└─────────────────────┘                     │  • Commit blockhash │
                                            │  • block.prevrandao │
                                            └──────────┬──────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │  6 ENTROPY SOURCES  │
                                            │  combined with      │
                                            │  keccak256          │
                                            │         │           │
                                            │         ▼           │
                                            │  RANDOM NUMBER(S)   │
                                            └─────────────────────┘
```

### Why 6 Entropy Sources?

| # | Source | Who Controls It | Why It Helps |
|---|--------|-----------------|--------------|
| 1 | **User's Secret** | User | Unknown to everyone else until reveal |
| 2 | **Request ID** | Contract | Unique per request |
| 3 | **Stylus Entropy #1** | Contract | Changes every call |
| 4 | **Stylus Entropy #2** | Contract | Double entropy from Rust |
| 5 | **Commit Blockhash** | Network | Unknown at commit time |
| 6 | **block.prevrandao** | Network | Validator randomness |

### Why This Is Unbreakable

| Attacker | Can They Cheat? | Why Not? |
|----------|-----------------|----------|
| **User trying to predict** | ❌ No | Future blockhash unknown at commit time |
| **Sequencer/Validator** | ❌ No | User's secret is hidden until reveal |
| **Front-runner** | ❌ No | Commit already recorded, can't change it |
| **MEV bot** | ❌ No | Would need secret + future block data |
| **Contract owner** | ❌ No | No admin functions affect randomness |

**The key:** No single party has ALL information needed to predict the result.

---

## Complete API Reference

### Quick Mode Functions

#### `getRandom(uint256 min, uint256 max) → uint256`

Get a single random number in range [min, max] (inclusive).

```solidity
// Examples:
uint256 dice = oracle.getRandom(1, 6);        // 1, 2, 3, 4, 5, or 6
uint256 coin = oracle.getRandom(0, 1);        // 0 or 1
uint256 percent = oracle.getRandom(1, 100);   // 1 to 100
uint256 card = oracle.getRandom(1, 52);       // 1 to 52
```

**Gas:** ~60,000

---

#### `getRandoms(uint256[] mins, uint256[] maxs) → uint256[]`

Get multiple random numbers with different ranges in one call.

```solidity
// Generate 6 lottery numbers (1-60)
uint256[] memory mins = new uint256[](6);
uint256[] memory maxs = new uint256[](6);

for (uint i = 0; i < 6; i++) {
    mins[i] = 1;
    maxs[i] = 60;
}

uint256[] memory numbers = oracle.getRandoms(mins, maxs);
// numbers[0] = first lottery number
// numbers[1] = second lottery number
// ... etc
```

**Gas:** ~60,000 base + ~25,000 per number

**Limit:** Maximum 100 numbers per call

---

### Secure Mode Functions

#### `commit(bytes32 secret, uint256 numCount) → bytes32 requestId`

Step 1: Register your intention to get random numbers.

```solidity
// Generate a secret (keep it safe!)
bytes32 mySecret = keccak256(abi.encodePacked(
    block.timestamp,
    block.prevrandao,
    msg.sender,
    "my-unique-salt-12345"
));

// Commit — request 5 random numbers
bytes32 requestId = oracle.commit(mySecret, 5);

// IMPORTANT: Save both requestId and mySecret for reveal!
```

**Gas:** ~142,000

---

#### `canReveal(bytes32 requestId) → bool`

Check if enough blocks have passed to reveal.

```solidity
if (oracle.canReveal(requestId)) {
    // Ready to reveal!
} else {
    // Wait more blocks
}
```

---

#### `reveal(bytes32 requestId, bytes32 secret, uint256[] mins, uint256[] maxs) → uint256[]`

Step 2: Reveal your secret and get the random numbers.

```solidity
// After 3+ blocks have passed
require(oracle.canReveal(requestId), "Wait more blocks");

uint256[] memory mins = new uint256[](5);
uint256[] memory maxs = new uint256[](5);

// Set your ranges
for (uint i = 0; i < 5; i++) {
    mins[i] = 1;
    maxs[i] = 100;
}

// Reveal and get numbers
uint256[] memory results = oracle.reveal(requestId, mySecret, mins, maxs);
```

**Gas:** ~158,000 base + ~25,000 per number

---

#### `getRequest(bytes32 requestId) → (address, uint256, uint256, bool, uint256)`

Get details about a pending request.

```solidity
(
    address requester,      // Who made the request
    uint256 commitBlock,    // Block when committed
    uint256 numCount,       // How many numbers requested
    bool fulfilled,         // Already revealed?
    uint256 blocksRemaining // Blocks until can reveal
) = oracle.getRequest(requestId);
```

---

## Practical Examples

### Example 1: Dice Game (Quick Mode)

A simple dice game where players bet on the outcome.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBackchainRandomness {
    function getRandom(uint256 min, uint256 max) external returns (uint256);
}

contract DiceGame {
    IBackchainRandomness constant ORACLE = 
        IBackchainRandomness(0x6eB891C2C7bC248EdDf31c77C4258205a37C4126);
    
    event DiceRolled(address indexed player, uint256 guess, uint256 result, bool won, uint256 payout);
    
    // Player guesses a number 1-6, pays ETH to play
    function play(uint256 guess) external payable {
        require(msg.value >= 0.001 ether, "Min bet: 0.001 ETH");
        require(guess >= 1 && guess <= 6, "Guess must be 1-6");
        
        // Get random number from oracle
        uint256 result = ORACLE.getRandom(1, 6);
        
        bool won = (result == guess);
        uint256 payout = 0;
        
        if (won) {
            payout = msg.value * 5; // 5x payout for correct guess
            require(address(this).balance >= payout, "Insufficient contract balance");
            payable(msg.sender).transfer(payout);
        }
        
        emit DiceRolled(msg.sender, guess, result, won, payout);
    }
    
    // Fund the contract
    receive() external payable {}
    
    // Check contract balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
```

---

### Example 2: NFT with Random Traits (Quick Mode)

Generate random traits when minting NFTs.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface IBackchainRandomness {
    function getRandoms(uint256[] calldata mins, uint256[] calldata maxs) external returns (uint256[] memory);
}

contract RandomTraitNFT is ERC721 {
    IBackchainRandomness constant ORACLE = 
        IBackchainRandomness(0x6eB891C2C7bC248EdDf31c77C4258205a37C4126);
    
    uint256 private _tokenIds;
    
    // Trait storage
    struct Traits {
        uint256 background;  // 1-10
        uint256 body;        // 1-20
        uint256 eyes;        // 1-15
        uint256 mouth;       // 1-12
        uint256 accessory;   // 1-25
        uint256 rarity;      // 1-100 (higher = rarer)
    }
    
    mapping(uint256 => Traits) public tokenTraits;
    
    constructor() ERC721("RandomNFT", "RNFT") {}
    
    function mint() external returns (uint256) {
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        
        // Generate 6 random numbers in one call
        uint256[] memory mins = new uint256[](6);
        uint256[] memory maxs = new uint256[](6);
        
        mins[0] = 1;  maxs[0] = 10;   // background
        mins[1] = 1;  maxs[1] = 20;   // body
        mins[2] = 1;  maxs[2] = 15;   // eyes
        mins[3] = 1;  maxs[3] = 12;   // mouth
        mins[4] = 1;  maxs[4] = 25;   // accessory
        mins[5] = 1;  maxs[5] = 100;  // rarity score
        
        uint256[] memory randoms = ORACLE.getRandoms(mins, maxs);
        
        // Store traits
        tokenTraits[tokenId] = Traits({
            background: randoms[0],
            body: randoms[1],
            eyes: randoms[2],
            mouth: randoms[3],
            accessory: randoms[4],
            rarity: randoms[5]
        });
        
        _mint(msg.sender, tokenId);
        
        return tokenId;
    }
    
    // Get rarity tier
    function getRarityTier(uint256 tokenId) external view returns (string memory) {
        uint256 rarity = tokenTraits[tokenId].rarity;
        
        if (rarity >= 95) return "Legendary";      // 5% chance
        if (rarity >= 80) return "Epic";           // 15% chance
        if (rarity >= 50) return "Rare";           // 30% chance
        return "Common";                            // 50% chance
    }
}
```

---

### Example 3: Secure Lottery (Secure Mode)

A lottery with large prizes using commit-reveal for maximum security.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBackchainRandomness {
    function commit(bytes32 secret, uint256 numCount) external returns (bytes32);
    function reveal(bytes32 requestId, bytes32 secret, uint256[] calldata mins, uint256[] calldata maxs) external returns (uint256[] memory);
    function canReveal(bytes32 requestId) external view returns (bool);
}

contract SecureLottery {
    IBackchainRandomness constant ORACLE = 
        IBackchainRandomness(0x6eB891C2C7bC248EdDf31c77C4258205a37C4126);
    
    // Lottery state
    address[] public players;
    uint256 public ticketPrice = 0.1 ether;
    uint256 public roundEndBlock;
    
    // Commit-reveal state
    bytes32 public currentRequestId;
    bytes32 private currentSecret;
    bool public isDrawing;
    
    event TicketPurchased(address indexed player, uint256 ticketNumber);
    event DrawStarted(bytes32 requestId);
    event WinnerSelected(address indexed winner, uint256 prize);
    
    // Buy a ticket
    function buyTicket() external payable {
        require(msg.value == ticketPrice, "Wrong ticket price");
        require(!isDrawing, "Draw in progress");
        
        players.push(msg.sender);
        emit TicketPurchased(msg.sender, players.length);
    }
    
    // Step 1: Start the draw (commit phase)
    function startDraw() external {
        require(players.length >= 2, "Need at least 2 players");
        require(!isDrawing, "Draw already started");
        
        isDrawing = true;
        
        // Generate secret
        currentSecret = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            players.length,
            address(this)
        ));
        
        // Commit to oracle
        currentRequestId = ORACLE.commit(currentSecret, 1);
        
        emit DrawStarted(currentRequestId);
    }
    
    // Step 2: Complete the draw (reveal phase)
    function completeDraw() external {
        require(isDrawing, "Draw not started");
        require(ORACLE.canReveal(currentRequestId), "Wait more blocks");
        
        // Prepare ranges
        uint256[] memory mins = new uint256[](1);
        uint256[] memory maxs = new uint256[](1);
        mins[0] = 0;
        maxs[0] = players.length - 1;
        
        // Reveal and get winner index
        uint256[] memory results = ORACLE.reveal(
            currentRequestId,
            currentSecret,
            mins,
            maxs
        );
        
        uint256 winnerIndex = results[0];
        address winner = players[winnerIndex];
        uint256 prize = address(this).balance;
        
        // Reset lottery
        delete players;
        isDrawing = false;
        
        // Pay winner
        payable(winner).transfer(prize);
        
        emit WinnerSelected(winner, prize);
    }
    
    // View functions
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
    
    function canCompleteDraw() external view returns (bool) {
        if (!isDrawing) return false;
        return ORACLE.canReveal(currentRequestId);
    }
}
```

---

### Example 4: Card Game (Quick Mode)

Draw cards from a deck.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBackchainRandomness {
    function getRandom(uint256 min, uint256 max) external returns (uint256);
    function getRandoms(uint256[] calldata mins, uint256[] calldata maxs) external returns (uint256[] memory);
}

contract CardGame {
    IBackchainRandomness constant ORACLE = 
        IBackchainRandomness(0x6eB891C2C7bC248EdDf31c77C4258205a37C4126);
    
    // Card representation: 1-52
    // 1-13 = Hearts (A, 2-10, J, Q, K)
    // 14-26 = Diamonds
    // 27-39 = Clubs
    // 40-52 = Spades
    
    event CardDrawn(address indexed player, uint256 card, string cardName);
    event HandDealt(address indexed player, uint256[] cards);
    
    // Draw a single card
    function drawCard() external returns (uint256 card, string memory cardName) {
        card = ORACLE.getRandom(1, 52);
        cardName = getCardName(card);
        
        emit CardDrawn(msg.sender, card, cardName);
    }
    
    // Deal a poker hand (5 cards)
    function dealPokerHand() external returns (uint256[] memory) {
        uint256[] memory mins = new uint256[](5);
        uint256[] memory maxs = new uint256[](5);
        
        for (uint i = 0; i < 5; i++) {
            mins[i] = 1;
            maxs[i] = 52;
        }
        
        uint256[] memory hand = ORACLE.getRandoms(mins, maxs);
        
        emit HandDealt(msg.sender, hand);
        return hand;
    }
    
    // Deal blackjack hand (2 cards)
    function dealBlackjack() external returns (uint256 card1, uint256 card2, uint256 total) {
        uint256[] memory mins = new uint256[](2);
        uint256[] memory maxs = new uint256[](2);
        
        mins[0] = 1; maxs[0] = 52;
        mins[1] = 1; maxs[1] = 52;
        
        uint256[] memory cards = ORACLE.getRandoms(mins, maxs);
        
        card1 = cards[0];
        card2 = cards[1];
        total = getBlackjackValue(card1) + getBlackjackValue(card2);
    }
    
    // Helper: Get card name
    function getCardName(uint256 card) public pure returns (string memory) {
        string[13] memory values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        string[4] memory suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
        
        uint256 valueIndex = (card - 1) % 13;
        uint256 suitIndex = (card - 1) / 13;
        
        return string(abi.encodePacked(values[valueIndex], " of ", suits[suitIndex]));
    }
    
    // Helper: Get blackjack value
    function getBlackjackValue(uint256 card) public pure returns (uint256) {
        uint256 value = ((card - 1) % 13) + 1;
        
        if (value > 10) return 10;  // J, Q, K = 10
        if (value == 1) return 11;  // A = 11 (simplified)
        return value;
    }
}
```

---

### Example 5: Random Airdrop Selection (Secure Mode)

Fairly select airdrop winners from a list.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBackchainRandomness {
    function commit(bytes32 secret, uint256 numCount) external returns (bytes32);
    function reveal(bytes32 requestId, bytes32 secret, uint256[] calldata mins, uint256[] calldata maxs) external returns (uint256[] memory);
    function canReveal(bytes32 requestId) external view returns (bool);
}

contract AirdropSelector {
    IBackchainRandomness constant ORACLE = 
        IBackchainRandomness(0x6eB891C2C7bC248EdDf31c77C4258205a37C4126);
    
    address[] public eligibleAddresses;
    address[] public winners;
    
    bytes32 public requestId;
    bytes32 private secret;
    uint256 public winnerCount;
    bool public selectionStarted;
    bool public selectionComplete;
    
    event SelectionStarted(uint256 eligibleCount, uint256 winnerCount);
    event WinnersSelected(address[] winners);
    
    // Add eligible addresses (owner only in real implementation)
    function addEligible(address[] calldata addresses) external {
        for (uint i = 0; i < addresses.length; i++) {
            eligibleAddresses.push(addresses[i]);
        }
    }
    
    // Step 1: Start selection
    function startSelection(uint256 _winnerCount) external {
        require(!selectionStarted, "Already started");
        require(_winnerCount <= eligibleAddresses.length, "Not enough eligible");
        require(_winnerCount <= 100, "Max 100 winners per call");
        
        winnerCount = _winnerCount;
        selectionStarted = true;
        
        // Generate secret
        secret = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            eligibleAddresses.length
        ));
        
        // Commit
        requestId = ORACLE.commit(secret, winnerCount);
        
        emit SelectionStarted(eligibleAddresses.length, winnerCount);
    }
    
    // Step 2: Complete selection
    function completeSelection() external {
        require(selectionStarted, "Not started");
        require(!selectionComplete, "Already complete");
        require(ORACLE.canReveal(requestId), "Wait more blocks");
        
        // Prepare ranges for Fisher-Yates style selection
        uint256[] memory mins = new uint256[](winnerCount);
        uint256[] memory maxs = new uint256[](winnerCount);
        
        uint256 poolSize = eligibleAddresses.length;
        for (uint i = 0; i < winnerCount; i++) {
            mins[i] = 0;
            maxs[i] = poolSize - 1 - i; // Shrinking pool
        }
        
        // Get random indices
        uint256[] memory indices = ORACLE.reveal(requestId, secret, mins, maxs);
        
        // Select winners using Fisher-Yates
        address[] memory pool = eligibleAddresses;
        for (uint i = 0; i < winnerCount; i++) {
            uint256 idx = indices[i];
            winners.push(pool[idx]);
            
            // Swap with last unselected
            pool[idx] = pool[poolSize - 1 - i];
        }
        
        selectionComplete = true;
        
        emit WinnersSelected(winners);
    }
    
    // View winners
    function getWinners() external view returns (address[] memory) {
        return winners;
    }
}
```

---

### Example 6: RPG Character Stats (Quick Mode)

Generate random stats for a game character.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBackchainRandomness {
    function getRandoms(uint256[] calldata mins, uint256[] calldata maxs) external returns (uint256[] memory);
}

contract RPGCharacter {
    IBackchainRandomness constant ORACLE = 
        IBackchainRandomness(0x6eB891C2C7bC248EdDf31c77C4258205a37C4126);
    
    struct Character {
        string name;
        uint256 strength;     // 8-18
        uint256 dexterity;    // 8-18
        uint256 constitution; // 8-18
        uint256 intelligence; // 8-18
        uint256 wisdom;       // 8-18
        uint256 charisma;     // 8-18
        uint256 hitPoints;
        string characterClass;
    }
    
    mapping(address => Character) public characters;
    
    event CharacterCreated(address indexed player, string name, string characterClass);
    
    function createCharacter(string calldata name) external returns (Character memory) {
        // Generate 6 stats + 1 for class selection
        uint256[] memory mins = new uint256[](7);
        uint256[] memory maxs = new uint256[](7);
        
        // Stats: 8-18 (like D&D)
        for (uint i = 0; i < 6; i++) {
            mins[i] = 8;
            maxs[i] = 18;
        }
        
        // Class: 1-4
        mins[6] = 1;
        maxs[6] = 4;
        
        uint256[] memory rolls = ORACLE.getRandoms(mins, maxs);
        
        // Determine class
        string memory charClass;
        if (rolls[6] == 1) charClass = "Warrior";
        else if (rolls[6] == 2) charClass = "Mage";
        else if (rolls[6] == 3) charClass = "Rogue";
        else charClass = "Cleric";
        
        // Calculate HP based on class and constitution
        uint256 baseHP;
        if (rolls[6] == 1) baseHP = 10; // Warrior
        else if (rolls[6] == 2) baseHP = 6; // Mage
        else if (rolls[6] == 3) baseHP = 8; // Rogue
        else baseHP = 8; // Cleric
        
        uint256 conModifier = (rolls[2] - 10) / 2; // Constitution modifier
        uint256 hitPoints = baseHP + conModifier;
        
        Character memory newChar = Character({
            name: name,
            strength: rolls[0],
            dexterity: rolls[1],
            constitution: rolls[2],
            intelligence: rolls[3],
            wisdom: rolls[4],
            charisma: rolls[5],
            hitPoints: hitPoints,
            characterClass: charClass
        });
        
        characters[msg.sender] = newChar;
        
        emit CharacterCreated(msg.sender, name, charClass);
        
        return newChar;
    }
}
```

---

## JavaScript Integration

### Quick Mode Example

```javascript
import { ethers } from 'ethers';

const ORACLE_ADDRESS = '0x6eB891C2C7bC248EdDf31c77C4258205a37C4126';

const ORACLE_ABI = [
    'function getRandom(uint256 min, uint256 max) external returns (uint256)',
    'function getRandoms(uint256[] calldata mins, uint256[] calldata maxs) external returns (uint256[] memory)',
    'event RandomGenerated(address indexed user, uint256 result)'
];

async function rollDice(signer) {
    const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, signer);
    
    const tx = await oracle.getRandom(1, 6);
    const receipt = await tx.wait();
    
    // Parse result from events
    const event = receipt.logs.find(log => {
        try {
            return oracle.interface.parseLog(log).name === 'RandomGenerated';
        } catch { return false; }
    });
    
    const parsed = oracle.interface.parseLog(event);
    console.log('Dice roll:', parsed.args.result.toString());
    
    return parsed.args.result;
}

async function generateLotteryNumbers(signer) {
    const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, signer);
    
    // 6 numbers from 1-60
    const mins = [1, 1, 1, 1, 1, 1];
    const maxs = [60, 60, 60, 60, 60, 60];
    
    const tx = await oracle.getRandoms(mins, maxs);
    const receipt = await tx.wait();
    
    console.log('Lottery numbers generated!');
    return receipt;
}
```

### Secure Mode Example

```javascript
import { ethers } from 'ethers';

const ORACLE_ADDRESS = '0x6eB891C2C7bC248EdDf31c77C4258205a37C4126';

const ORACLE_ABI = [
    'function commit(bytes32 secret, uint256 numCount) external returns (bytes32)',
    'function reveal(bytes32 requestId, bytes32 secret, uint256[] calldata mins, uint256[] calldata maxs) external returns (uint256[] memory)',
    'function canReveal(bytes32 requestId) external view returns (bool)',
    'event CommitRecorded(bytes32 indexed requestId, address indexed user)',
    'event RandomRevealed(bytes32 indexed requestId, uint256[] results)'
];

async function secureLotteryDraw(signer) {
    const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, signer);
    
    // Step 1: Generate and commit secret
    console.log('Step 1: Committing...');
    
    const secret = ethers.randomBytes(32);
    const secretHash = ethers.keccak256(secret);
    
    const commitTx = await oracle.commit(secretHash, 1);
    const commitReceipt = await commitTx.wait();
    
    // Get request ID from event
    const commitEvent = commitReceipt.logs.find(log => {
        try {
            return oracle.interface.parseLog(log).name === 'CommitRecorded';
        } catch { return false; }
    });
    
    const requestId = oracle.interface.parseLog(commitEvent).args.requestId;
    console.log('Request ID:', requestId);
    
    // Step 2: Wait for blocks
    console.log('Step 2: Waiting for 3 blocks...');
    
    while (!(await oracle.canReveal(requestId))) {
        console.log('Waiting...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Step 3: Reveal
    console.log('Step 3: Revealing...');
    
    const mins = [1];
    const maxs = [1000000]; // Pick winner from 1 to 1,000,000
    
    const revealTx = await oracle.reveal(requestId, secret, mins, maxs);
    const revealReceipt = await revealTx.wait();
    
    const revealEvent = revealReceipt.logs.find(log => {
        try {
            return oracle.interface.parseLog(log).name === 'RandomRevealed';
        } catch { return false; }
    });
    
    const results = oracle.interface.parseLog(revealEvent).args.results;
    console.log('Winning number:', results[0].toString());
    
    return results[0];
}
```

---

## Gas Costs

### Quick Mode

| Operation | Numbers | Gas | Est. Cost* |
|-----------|---------|-----|------------|
| `getRandom()` | 1 | ~60,000 | $0.001 |
| `getRandoms()` | 3 | ~132,000 | $0.002 |
| `getRandoms()` | 5 | ~180,000 | $0.003 |
| `getRandoms()` | 10 | ~290,000 | $0.006 |

### Secure Mode

| Operation | Gas | Est. Cost* |
|-----------|-----|------------|
| `commit()` | ~142,000 | $0.003 |
| `reveal()` (5 numbers) | ~158,000 | $0.003 |
| **Total** | ~300,000 | $0.006 |

*Based on 0.01 gwei gas price

**Oracle Fee: FREE (0 ETH)** — You only pay gas!

---

## Stylus Technical Details

### Why Stylus (Rust)?

Our entropy generator runs on Arbitrum Stylus — Rust compiled to WASM:

| Benefit | Explanation |
|---------|-------------|
| **Speed** | Rust executes faster than Solidity |
| **Algorithm** | Proper LCG implementation with Knuth constants |
| **Innovation** | First hybrid Solidity + Stylus randomness oracle |
| **Arbitrum-native** | Only possible on Arbitrum |

### LCG Algorithm

```rust
// Knuth MMIX constants
const A: u64 = 6364136223846793005;
const B: u64 = 1442695040888963407;

fn next_entropy(seed: u64, counter: u64, sender: u64) -> u64 {
    seed.wrapping_mul(A)
        .wrapping_add(counter.wrapping_mul(B))
        .wrapping_add(sender)
}
```

### Contract Address

**StylusEntropy:** `0xb6bb5e9c9df36fa9504d87125af0e4b284b55092`

---

## FAQ

**Q: Is it really free?**
> Yes! The oracle fee is 0. You only pay gas for your transaction.

**Q: Can the owner manipulate results?**
> No. There are no admin functions that affect randomness generation.

**Q: Is Quick Mode safe for my game?**
> For stakes under $1,000, Quick Mode is generally safe. For higher stakes, use Secure Mode.

**Q: What if I lose my secret before reveal?**
> Your commit expires after 250 blocks. Always store secrets securely before committing.

**Q: Can I use this on other chains?**
> Currently only Arbitrum is supported due to Stylus dependency.

**Q: What's the maximum numbers per call?**
> 100 numbers per call for both modes.

**Q: How do I generate a good secret?**
> Combine multiple entropy sources:
> ```solidity
> bytes32 secret = keccak256(abi.encodePacked(
>     block.timestamp,
>     block.prevrandao,
>     msg.sender,
>     userProvidedSalt
> ));
> ```

---

## Support

Need help integrating? Contact us:

| Channel | Link |
|---------|------|
| Email | dev@backcoin.org |
| X (Twitter) | [x.com/backcoin](https://x.com/backcoin) |
| GitHub | [github.com/backcoin-org/backchain-dapp](https://github.com/backcoin-org/backchain-dapp) |
| YouTube | [youtube.com/@Backcoin](https://www.youtube.com/@Backcoin) |

---

## License

MIT License — Use freely in your projects!

---

*Built by Backcoin Protocol as a public good for the Arbitrum ecosystem.*
