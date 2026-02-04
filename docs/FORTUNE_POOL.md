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

**Document:** Fortune Pool — Provably Fair & Unstoppable Gaming  
**Version:** 3.0.0 (V6 Commit-Reveal)  
**Last Updated:** February 2026  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# Fortune Pool

## Games That Cannot Be Rigged

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    PROVABLY FAIR. FULLY ON-CHAIN. UNSTOPPABLE.                    ║
║                                                                                   ║
║   Just as Voltaire defended the right to free speech,                            ║
║   we defend the right to fair gaming.                                            ║
║                                                                                   ║
║   No one can rig the results.                                                    ║
║   No one can refuse your bet.                                                    ║
║   No one can withhold your winnings.                                             ║
║                                                                                   ║
║   The math is public. The code is law. The game is fair.                        ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

Fortune Pool is a provably fair prediction game powered by the **Backcoin Oracle**. Every result is verifiable on-chain. No manipulation possible.

---

## 📍 Contract Information

| Property | Value |
|----------|-------|
| **Fortune Pool V6** | `0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF` |
| **Backcoin Oracle** | `0x16346f5a45f9615f1c894414989f0891c54ef07b` |
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` |
| **Network** | Arbitrum Sepolia |
| **Resolution** | Commit-Reveal (5 blocks) |
| **Prize Pool** | 2,000,000 BKC (TGE allocation) |
| **Operator Support** | ⚡ Yes |

---

## 🌍 Become an Operator

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    BUILD A CASINO. EARN COMMISSIONS.                              ║
║                                                                                   ║
║   Anyone in the world can:                                                        ║
║                                                                                   ║
║   1. Build their own Fortune Pool frontend, app, or bot                          ║
║   2. Pass their wallet address as the "operator" parameter                       ║
║   3. Earn a percentage of ALL fees from games played through their interface     ║
║                                                                                   ║
║   No registration. No approval. No KYC.                                          ║
║   No gambling license needed to BUILD (only to operate in some jurisdictions).   ║
║                                                                                   ║
║   The smart contract doesn't care who you are. It just executes.                ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## ⚡ How It Works: V6 Commit-Reveal

### Maximum Fairness with Commit-Reveal Pattern

V6 introduces a **commit-reveal pattern** that makes manipulation mathematically impossible:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   V6 COMMIT-REVEAL FLOW                                                          ║
║   ═════════════════════                                                          ║
║                                                                                   ║
║   STEP 1: COMMIT (Player locks bet + guesses)                                    ║
║   ┌─────────────────────────────────────────────────────────────────────────┐    ║
║   │  Player calls commitPlay(wager, guesses, operator)                      │    ║
║   │  → BKC locked in contract                                               │    ║
║   │  → Guesses hashed and stored                                            │    ║
║   │  → Commit block recorded                                                │    ║
║   └─────────────────────────────────────────────────────────────────────────┘    ║
║                               │                                                   ║
║                               ▼                                                   ║
║                        WAIT 5 BLOCKS                                             ║
║                    (prevents manipulation)                                        ║
║                               │                                                   ║
║                               ▼                                                   ║
║   STEP 2: REVEAL (Player reveals and gets result)                                ║
║   ┌─────────────────────────────────────────────────────────────────────────┐    ║
║   │  Player calls revealPlay()                                              │    ║
║   │  → Oracle generates random numbers using future block data              │    ║
║   │  → Contract compares guesses vs rolls                                   │    ║
║   │  → Winner? Prize transferred immediately                                │    ║
║   │  → Loser? Wager goes to prize pool                                      │    ║
║   └─────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                   ║
║   WHY 5 BLOCKS?                                                                  ║
║   • Player commits BEFORE the random seed is known                              ║
║   • Oracle uses block data from AFTER the commit                                ║
║   • No one can predict or manipulate the outcome                                ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Why Commit-Reveal Is Maximally Fair

| Feature | Description |
|---------|-------------|
| **Unpredictable** | Random seed comes from future block (after commit) |
| **Unmanipulable** | Player can't change bet after seeing seed |
| **Verifiable** | All data on-chain, anyone can verify |
| **Trustless** | No central authority, just math |
| **Operator Earnings** | Builders earn commissions automatically |

---

## 🎰 Game Modes

### 🚀 Combo Mode (Cumulative)

Play all 3 tiers in one bet. Match numbers to win multipliers that **stack**.

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   COMBO MODE - Stack Your Wins!                                                  ║
║   ═════════════════════════════                                                  ║
║                                                                                   ║
║   Your Guesses:  [2]  [7]  [42]                                                  ║
║                   │    │    │                                                    ║
║                   ▼    ▼    ▼                                                    ║
║   Oracle Rolls:  [2]  [3]  [67]                                                  ║
║                   ✓    ✗    ✗                                                    ║
║                                                                                   ║
║   Tier 1 (Easy):   Match! → 2x multiplier                                       ║
║   Tier 2 (Medium): Miss                                                          ║
║   Tier 3 (Hard):   Miss                                                          ║
║                                                                                   ║
║   Result: Won 2x on wager!                                                       ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

**Combo Multipliers Stack:**

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

### 👑 Jackpot Mode (Single Tier)

Go for the big win! Pick one number in the Hard tier (1-100).

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   JACKPOT MODE - All or Nothing!                                                 ║
║   ══════════════════════════════                                                 ║
║                                                                                   ║
║   Your Guess:    [42]                                                            ║
║                   │                                                              ║
║                   ▼                                                              ║
║   Oracle Roll:   [42]  ← 1 in 100 chance!                                       ║
║                   ✓                                                              ║
║                                                                                   ║
║   Result: Won 50x on wager! 🎉                                                   ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

**Jackpot Odds:**
- Range: 1-100
- Win Chance: 1%
- Multiplier: **50x**

---

## 📊 Prize Tiers

| Tier | Range | Win Chance | Multiplier | House Edge |
|------|-------|------------|------------|------------|
| **Easy** | 1-3 | 33.33% | **2x** | ~33% |
| **Medium** | 1-10 | 10% | **5x** | ~50% |
| **Hard** | 1-100 | 1% | **50x** | ~50% |

---

## 🔍 How to Verify Results

All game results are stored on-chain and can be verified by anyone:

### Step 1: Find Your Game on Arbiscan

```
https://sepolia.arbiscan.io/address/0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF#events
```

### Step 2: Look for Events

**CommitPlayed Event (Step 1):**
```
CommitPlayed(
    commitId: 1234,
    player: 0xYourAddress,
    wagerAmount: 10000000000000000000,
    commitBlock: 12345678
)
```

**GameResolved Event (Step 2):**
```
GameResolved(
    commitId: 1234,
    player: 0xYourAddress,
    guesses: [2, 7, 42],
    rolls: [2, 3, 67],
    matches: [true, false, false],
    prizeWon: 20000000000000000000,
    operator: 0xOperatorAddress
)
```

---

## 💻 Smart Contract Interface

### V6 Functions (Commit-Reveal)

```solidity
// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: COMMIT - Lock your bet (requires BKC approval first)
// ═══════════════════════════════════════════════════════════════════════════════
function commitPlay(
    uint256 _wagerAmount,      // How much BKC to bet
    uint256[] calldata _guesses, // Your number guesses
    address _operator           // Who gets the commission (could be YOUR address!)
) external returns (uint256 commitId);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: REVEAL - Get your result (after 5 blocks)
// ═══════════════════════════════════════════════════════════════════════════════
function revealPlay() external returns (
    uint256[] memory rolls,     // The random numbers
    uint256 prizeWon           // Your winnings (0 if lost)
);

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Check if you can reveal yet
function canReveal(address _player) external view returns (bool);

// Get your pending commit
function getPendingCommit(address _player) external view returns (
    uint256 commitId,
    uint256 wagerAmount,
    uint256 commitBlock,
    uint256[] memory guesses,
    bool isCumulative
);

// Get prize pool balance
function prizePoolBalance() external view returns (uint256);

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
```

### Events

```solidity
// Emitted when player commits
event CommitPlayed(
    uint256 indexed commitId,
    address indexed player,
    uint256 wagerAmount,
    uint256 commitBlock,
    bool isCumulative
);

// Emitted when game resolves
event GameResolved(
    uint256 indexed commitId,
    address indexed player,
    uint256[] guesses,
    uint256[] rolls,
    bool[] matches,
    uint256 prizeWon,
    address indexed operator
);

// Emitted for big wins
event JackpotWon(
    uint256 indexed commitId,
    address indexed player,
    uint256 prizeAmount,
    uint256 tier
);
```

---

## 🔧 JavaScript Integration

### V6 Commit-Reveal Example

```javascript
import { ethers } from 'ethers';

const FORTUNE_POOL = '0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF';
const BKC_TOKEN = '0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396';

const fortunePoolABI = [
    // Commit-Reveal functions
    "function commitPlay(uint256 _wagerAmount, uint256[] calldata _guesses, address _operator) external returns (uint256 commitId)",
    "function revealPlay() external returns (uint256[] memory rolls, uint256 prizeWon)",
    "function canReveal(address _player) view returns (bool)",
    "function getPendingCommit(address _player) view returns (uint256, uint256, uint256, uint256[], bool)",
    // Events
    "event CommitPlayed(uint256 indexed commitId, address indexed player, uint256 wagerAmount, uint256 commitBlock, bool isCumulative)",
    "event GameResolved(uint256 indexed commitId, address indexed player, uint256[] guesses, uint256[] rolls, bool[] matches, uint256 prizeWon, address indexed operator)"
];

const bkcABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

/**
 * STEP 1: Commit your bet
 * @param signer - Your wallet signer
 * @param wagerBKC - Amount to bet (in BKC, e.g., "100")
 * @param guesses - Your guesses, e.g., [2, 7, 42] for Combo
 * @param operator - Operator address (pass YOUR address to earn from YOUR interface!)
 */
async function commitPlay(signer, wagerBKC, guesses, operator) {
    const fortunePool = new ethers.Contract(FORTUNE_POOL, fortunePoolABI, signer);
    const bkc = new ethers.Contract(BKC_TOKEN, bkcABI, signer);
    
    const wagerAmount = ethers.parseEther(wagerBKC);
    
    // Approve BKC if needed
    const allowance = await bkc.allowance(await signer.getAddress(), FORTUNE_POOL);
    if (allowance < wagerAmount) {
        console.log('Approving BKC...');
        const approveTx = await bkc.approve(FORTUNE_POOL, ethers.MaxUint256);
        await approveTx.wait();
    }
    
    // Commit the play
    console.log('Committing bet...');
    const tx = await fortunePool.commitPlay(wagerAmount, guesses, operator);
    const receipt = await tx.wait();
    
    // Parse CommitPlayed event
    const iface = new ethers.Interface(fortunePoolABI);
    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'CommitPlayed') {
                console.log('Commit ID:', parsed.args.commitId.toString());
                console.log('Commit Block:', parsed.args.commitBlock.toString());
                console.log('Wait 5 blocks, then call revealPlay()');
                return parsed.args.commitId;
            }
        } catch {}
    }
}

/**
 * STEP 2: Reveal and get result (call after 5 blocks)
 */
async function revealPlay(signer) {
    const fortunePool = new ethers.Contract(FORTUNE_POOL, fortunePoolABI, signer);
    
    // Check if we can reveal
    const canRevealNow = await fortunePool.canReveal(await signer.getAddress());
    if (!canRevealNow) {
        throw new Error('Cannot reveal yet. Wait for 5 blocks.');
    }
    
    // Reveal
    console.log('Revealing...');
    const tx = await fortunePool.revealPlay();
    const receipt = await tx.wait();
    
    // Parse GameResolved event
    const iface = new ethers.Interface(fortunePoolABI);
    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'GameResolved') {
                console.log('Guesses:', parsed.args.guesses.map(g => g.toString()));
                console.log('Rolls:', parsed.args.rolls.map(r => r.toString()));
                console.log('Matches:', parsed.args.matches);
                console.log('Prize Won:', ethers.formatEther(parsed.args.prizeWon), 'BKC');
                return parsed.args;
            }
        } catch {}
    }
}

// Example: Play Combo mode as an operator (earn commissions!)
const MY_OPERATOR_ADDRESS = '0xYourWalletAddress'; // YOUR address!
await commitPlay(signer, "100", [2, 7, 42], MY_OPERATOR_ADDRESS);
// Wait 5 blocks...
await revealPlay(signer);
```

---

## ⚠️ Responsible Gaming

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   PLAY RESPONSIBLY                                                               ║
║   ════════════════                                                               ║
║                                                                                   ║
║   Fortune Pool is designed for entertainment. Please:                            ║
║                                                                                   ║
║   ⚠️ Only play with funds you can afford to lose                                 ║
║   ⚠️ Set personal limits before playing                                          ║
║   ⚠️ Take breaks regularly                                                        ║
║   ⚠️ Remember: the house has an edge (~33-50%)                                   ║
║                                                                                   ║
║   The code is fair. The math is transparent. But gambling is gambling.          ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| **Fortune Pool V6** | `0x5B3c7A322eB49805c594Fd948c137b62a09BBfFF` | Main game |
| **Backcoin Oracle** | `0x16346f5a45f9615f1c894414989f0891c54ef07b` | Free randomness |
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` | Wagering |
| **MiningManager** | `0x7755982411244791d2DA96cBa04d08df72Be43C1` | Operator rewards |
| **RewardBoosterNFT** | `0xf2EA307686267dC674859da28C58CBb7a5866BCf` | Fee discounts |

---

## ❓ FAQ

**Q: Why commit-reveal instead of instant?**
> The 5-block delay ensures no one (player, miner, or operator) can predict or manipulate the random numbers. Maximum fairness.

**Q: Can I cancel my commit?**
> No. Once committed, the bet is locked. This prevents manipulation.

**Q: What if I don't reveal?**
> Your bet remains locked. Always reveal to get your result (win or lose).

**Q: How do operators earn?**
> Pass your address as the `operator` parameter. You earn a commission from every game played through your interface.

**Q: Is the randomness truly fair?**
> Yes! The Backcoin Oracle uses Arbitrum's `block.prevrandao` from AFTER your commit. No one can know the result when you commit.

**Q: Can I verify results on-chain?**
> Absolutely! Every game's guesses, rolls, and matches are stored in contract events on Arbiscan.

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
║   Fortune Pool is not just a game. It's a statement.                             ║
║                                                                                   ║
║   A statement that fair gaming is a right, not a privilege.                      ║
║   A statement that results should be verifiable by anyone.                       ║
║   A statement that the house shouldn't be able to cheat.                         ║
║                                                                                   ║
║   No one can rig it. No one can stop it. No one can censor it.                  ║
║                                                                                   ║
║                            THE GAME IS UNSTOPPABLE.                               ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

*This document is part of Backchain Protocol's public documentation. All game results are verifiable on-chain. Trust the code, not the words.*
