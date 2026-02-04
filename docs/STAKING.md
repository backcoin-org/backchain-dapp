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

**Document:** Staking (DelegationManager) — Lock, Earn, and Exit Freely  
**Version:** 2.0.0 (V6 with Operator System & Burn Reduction)  
**Last Updated:** February 2026  
**Full Documentation:** [https://github.com/backcoin-org/backchain-dapp/tree/main/docs](https://github.com/backcoin-org/backchain-dapp/tree/main/docs)

---

# Staking

## Your Tokens. Your Choice. Your Rewards.

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    STAKE. EARN. EXIT WHEN YOU WANT.                               ║
║                                                                                   ║
║   Just as Voltaire defended individual liberty,                                  ║
║   we defend your right to stake and unstake freely.                              ║
║                                                                                   ║
║   No one can freeze your stake.                                                   ║
║   No one can deny your rewards.                                                   ║
║   No one can prevent your exit.                                                   ║
║                                                                                   ║
║   Lock BKC → Earn rewards → Unstake anytime*                                     ║
║   *With burn reduction if you hold a Reward Booster NFT                          ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

Lock BKC tokens to earn a share of protocol fees. Longer locks earn higher rewards through the pStake multiplier. When you unstake, a portion is burned unless you hold a Reward Booster NFT.

---

## 📍 Contract Information

| Property | Value |
|----------|-------|
| **Contract** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` |
| **Network** | Arbitrum Sepolia |
| **Token** | BKC |
| **Lock Period** | 1 - 3650 days |
| **Fees** | BKC + ETH (V6) |
| **Operator Support** | ⚡ Yes |

---

## 🌍 Become an Operator

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                    BUILD A STAKING INTERFACE. EARN COMMISSIONS.                   ║
║                                                                                   ║
║   Anyone in the world can:                                                        ║
║                                                                                   ║
║   1. Build their own staking dashboard or DeFi aggregator                        ║
║   2. Pass their wallet address as the "operator" parameter                       ║
║   3. Earn BKC + ETH from EVERY stake/unstake/claim through their interface       ║
║                                                                                   ║
║   No registration. No approval. No KYC.                                          ║
║   Build the next great staking dashboard and earn from every transaction.        ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## ⚡ How Staking Works

### The pStake System

Your reward share is calculated using **pStake** (power stake):

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   pStake = Amount × Lock Days                                                    ║
║                                                                                   ║
║   EXAMPLES:                                                                       ║
║   ─────────                                                                       ║
║   Stake 1,000 BKC for 30 days  = 30,000 pStake                                   ║
║   Stake 500 BKC for 365 days   = 182,500 pStake                                  ║
║   Stake 10,000 BKC for 7 days  = 70,000 pStake                                   ║
║                                                                                   ║
║   Higher pStake = Larger share of rewards                                        ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Why pStake?

| Benefit | Description |
|---------|-------------|
| **Fair Distribution** | Rewards proportional to commitment |
| **Long-term Incentive** | Longer locks earn more |
| **Flexibility** | Choose your own lock period |
| **Simple Math** | Easy to calculate your share |
| **Permissionless** | No approval needed to stake |

---

## 🔥 The Burn System (V6)

### When You Unstake

V6 introduces a **burn mechanism** when unstaking. A portion of your stake is burned unless you hold a Reward Booster NFT:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   UNSTAKING 10,000 BKC                                                           ║
║   ════════════════════                                                           ║
║                                                                                   ║
║   WITHOUT NFT:                 WITH DIAMOND NFT:                                 ║
║   ────────────                 ─────────────────                                 ║
║   10,000 BKC unstaked          10,000 BKC unstaked                               ║
║   - 5,000 BKC burned (50%)     - 0 BKC burned (0%)                               ║
║   = 5,000 BKC received         = 10,000 BKC received                             ║
║                                                                                   ║
║   SAVINGS WITH DIAMOND: 5,000 BKC! 🎉                                            ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Burn Reduction Tiers

| NFT Tier | Burn When Unstaking | Protection |
|----------|---------------------|------------|
| **Diamond** | 0% | Maximum |
| **Gold** | 25% | High |
| **Silver** | 35% | Medium |
| **Bronze** | 50% | Entry |
| *No NFT* | *50%* | *None* |

**Tip:** Rent a Diamond NFT before large unstakes to save thousands of BKC!

---

## 💰 Reward Source

### Where Do Rewards Come From?

Staking rewards come from **real protocol fees**—not emissions:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   REWARD FLOW                                                                    ║
║   ═══════════                                                                    ║
║                                                                                   ║
║   User pays fee (any service)                                                    ║
║           │                                                                       ║
║           ▼                                                                       ║
║   MiningManager receives fee                                                     ║
║           │                                                                       ║
║           ├──────────────► Operator ⚡ (commission)                              ║
║           │                                                                       ║
║           ├──────────────► STAKERS (share based on pStake)                       ║
║           │                                                                       ║
║           └──────────────► Treasury (protocol development)                       ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Fee Sources

| Service | Generates Fees | Operator ⚡ |
|---------|----------------|-------------|
| Fortune Pool | Game fees | Yes |
| Charity Pool | Donation fees | Yes |
| Notary | Certification fees | Yes |
| NFT Pools | Buy/sell fees | Yes |
| Staking | Entry/exit fees | Yes |
| Rentals | Platform fees | Yes |
| Backchat | Tips, premium features | Yes |

**Important:** No guaranteed APY. Rewards depend on actual protocol usage. More activity = more rewards for stakers.

---

## ⏱️ Lock Periods

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

## 📋 Staking Actions

### Stake (V6)

Lock BKC tokens for chosen period:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   STAKE FLOW                                                                     ║
║   ══════════                                                                     ║
║                                                                                   ║
║   1. Choose amount                                                               ║
║   2. Choose lock period (1-3650 days)                                            ║
║   3. Approve BKC spending                                                        ║
║   4. Call stake(amount, days, operator) with ETH fee                             ║
║   5. Start earning rewards! ✓                                                    ║
║                                                                                   ║
║   ⚡ Operator earns commission from stake fee                                    ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Unstake (V6)

After lock period ends (or force unstake):

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   UNSTAKE FLOW                                                                   ║
║   ════════════                                                                   ║
║                                                                                   ║
║   1. Lock period complete (or choose force unstake)                              ║
║   2. Call unstake(positionId, operator) with ETH fee                             ║
║   3. System checks for Reward Booster NFT                                        ║
║   4. Apply burn reduction based on NFT tier                                      ║
║   5. Receive BKC (minus burn if no NFT)                                          ║
║                                                                                   ║
║   ⚠️ WITHOUT NFT: 50% of your stake is burned!                                   ║
║   💎 WITH DIAMOND: 0% burn, keep everything!                                     ║
║                                                                                   ║
║   ⚡ Operator earns commission from unstake fee                                  ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Claim Rewards (V6)

Collect accumulated rewards:

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   CLAIM FLOW                                                                     ║
║   ══════════                                                                     ║
║                                                                                   ║
║   1. Check pending rewards                                                       ║
║   2. Call claimRewards(operator) with ETH fee                                    ║
║   3. Receive BKC rewards                                                         ║
║                                                                                   ║
║   ⚡ Operator earns commission from claim fee                                    ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 💵 V6 Fee Structure

V6 introduces **dual fees** (BKC + ETH) with operator support:

| Action | BKC Fee | ETH Fee | Burn | Operator Earns |
|--------|---------|---------|------|----------------|
| **Stake** | ~1-5% | Dynamic | No | ⚡ Both BKC + ETH |
| **Unstake** | Gas | Dynamic | Yes (0-50%) | ⚡ Both BKC + ETH |
| **Force Unstake** | Higher | Dynamic | Yes (0-50%) | ⚡ Both BKC + ETH |
| **Claim Rewards** | ~1-5% | Dynamic | No | ⚡ Both BKC + ETH |

---

## 📊 Reward Calculation

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

## 💻 Smart Contract Interface (V6)

### Key Functions

```solidity
// ═══════════════════════════════════════════════════════════════════════════════
// STAKING FUNCTIONS (V6 - with operator and ETH fee)
// ═══════════════════════════════════════════════════════════════════════════════

// Stake tokens
function stake(
    uint256 _amount,
    uint256 _lockDays,
    address _operator       // ⚡ Operator earns commission!
) external payable;

// Unstake after lock period
function unstake(
    uint256 _positionId,
    address _operator       // ⚡ Operator earns commission!
) external payable;

// Force unstake with penalty (before lock ends)
function forceUnstake(
    uint256 _positionId,
    address _operator       // ⚡ Operator earns commission!
) external payable;

// Claim rewards
function claimRewards(
    address _operator       // ⚡ Operator earns commission!
) external payable;

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Get position details
function getPosition(address _user) external view returns (
    uint256 amount,
    uint256 pStake,
    uint256 lockEnd,
    uint256 pendingRewards
);

// Get total pStake in system
function getTotalPStake() external view returns (uint256);

// Get pending rewards for user
function getPendingRewards(address _user) external view returns (uint256);

// Get required ETH fees
function getStakeEthFee(uint256 _amount) external view returns (uint256);
function getUnstakeEthFee(uint256 _positionId) external view returns (uint256);
function getClaimEthFee() external view returns (uint256);

// Get burn percentage for user (checks NFT ownership/rental)
function getUserBurnPercent(address _user) external view returns (uint256);
```

### Events

```solidity
// Emitted when user stakes
event Staked(
    address indexed user,
    uint256 amount,
    uint256 lockDays,
    uint256 pStake,
    address indexed operator
);

// Emitted when user unstakes
event Unstaked(
    address indexed user,
    uint256 amount,
    uint256 burned,
    uint256 received,
    address indexed operator
);

// Emitted when rewards are claimed
event RewardsClaimed(
    address indexed user,
    uint256 amount,
    address indexed operator
);

// Emitted when fees are distributed
event FeesDistributed(
    uint256 bkcToOperator,
    uint256 bkcToStakers,
    uint256 ethToOperator,
    address indexed operator
);
```

---

## 🔧 JavaScript Integration (V6)

```javascript
import { ethers } from 'ethers';

const STAKING = '0x41B1B7940E06318e9b161fc64524FaE7261e8739';
const BKC_TOKEN = '0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396';
const MY_OPERATOR_ADDRESS = '0xYourAddress'; // YOUR address to earn commissions!

const stakingABI = [
    "function stake(uint256 _amount, uint256 _lockDays, address _operator) external payable",
    "function unstake(uint256 _positionId, address _operator) external payable",
    "function claimRewards(address _operator) external payable",
    "function getPosition(address _user) view returns (uint256, uint256, uint256, uint256)",
    "function getPendingRewards(address _user) view returns (uint256)",
    "function getStakeEthFee(uint256 _amount) view returns (uint256)",
    "function getUnstakeEthFee(uint256 _positionId) view returns (uint256)",
    "function getUserBurnPercent(address _user) view returns (uint256)",
    "event Staked(address indexed user, uint256 amount, uint256 lockDays, uint256 pStake, address indexed operator)",
    "event Unstaked(address indexed user, uint256 amount, uint256 burned, uint256 received, address indexed operator)"
];

const bkcABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

// Stake tokens
async function stake(amountBKC, lockDays, signer) {
    const staking = new ethers.Contract(STAKING, stakingABI, signer);
    const bkc = new ethers.Contract(BKC_TOKEN, bkcABI, signer);
    
    const amount = ethers.parseEther(amountBKC.toString());
    const ethFee = await staking.getStakeEthFee(amount);
    
    console.log('═══════════════════════════════════════════════');
    console.log('STAKE BKC');
    console.log('═══════════════════════════════════════════════');
    console.log('Amount:', amountBKC, 'BKC');
    console.log('Lock Days:', lockDays);
    console.log('pStake:', amountBKC * lockDays);
    console.log('ETH Fee:', ethers.formatEther(ethFee), 'ETH');
    
    // Approve BKC
    const allowance = await bkc.allowance(await signer.getAddress(), STAKING);
    if (allowance < amount) {
        console.log('Approving BKC...');
        await bkc.approve(STAKING, ethers.MaxUint256);
    }
    
    // Stake (pass YOUR address as operator to earn from YOUR interface!)
    console.log('Staking...');
    const tx = await staking.stake(amount, lockDays, MY_OPERATOR_ADDRESS, { value: ethFee });
    const receipt = await tx.wait();
    
    console.log('Staked successfully!');
    return receipt;
}

// Check position
async function checkPosition(userAddress, provider) {
    const staking = new ethers.Contract(STAKING, stakingABI, provider);
    const [amount, pStake, lockEnd, pending] = await staking.getPosition(userAddress);
    const burnPercent = await staking.getUserBurnPercent(userAddress);
    
    console.log('═══════════════════════════════════════════════');
    console.log('STAKING POSITION');
    console.log('═══════════════════════════════════════════════');
    console.log('Staked:', ethers.formatEther(amount), 'BKC');
    console.log('pStake:', pStake.toString());
    console.log('Lock ends:', new Date(Number(lockEnd) * 1000));
    console.log('Pending rewards:', ethers.formatEther(pending), 'BKC');
    console.log('Burn on unstake:', burnPercent.toString() + '%');
    
    if (burnPercent == 0n) {
        console.log('💎 Diamond protection active!');
    } else if (burnPercent == 50n) {
        console.log('⚠️ No NFT protection - consider renting a Diamond!');
    }
    
    return { amount, pStake, lockEnd, pending, burnPercent };
}

// Unstake
async function unstake(positionId, signer) {
    const staking = new ethers.Contract(STAKING, stakingABI, signer);
    
    // Check burn percentage first
    const burnPercent = await staking.getUserBurnPercent(await signer.getAddress());
    const ethFee = await staking.getUnstakeEthFee(positionId);
    
    console.log('═══════════════════════════════════════════════');
    console.log('UNSTAKE');
    console.log('═══════════════════════════════════════════════');
    console.log('Burn percentage:', burnPercent.toString() + '%');
    console.log('ETH Fee:', ethers.formatEther(ethFee), 'ETH');
    
    if (burnPercent > 0n) {
        console.log('⚠️ WARNING: You will lose ' + burnPercent.toString() + '% of your stake!');
        console.log('Consider renting a Diamond NFT first to avoid burn.');
    }
    
    // Unstake (pass YOUR address as operator!)
    const tx = await staking.unstake(positionId, MY_OPERATOR_ADDRESS, { value: ethFee });
    const receipt = await tx.wait();
    
    // Parse event to see actual amounts
    const iface = new ethers.Interface(stakingABI);
    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'Unstaked') {
                console.log('Amount unstaked:', ethers.formatEther(parsed.args.amount), 'BKC');
                console.log('Amount burned:', ethers.formatEther(parsed.args.burned), 'BKC');
                console.log('Amount received:', ethers.formatEther(parsed.args.received), 'BKC');
            }
        } catch {}
    }
    
    return receipt;
}

// Claim rewards
async function claimRewards(signer) {
    const staking = new ethers.Contract(STAKING, stakingABI, signer);
    
    const pending = await staking.getPendingRewards(await signer.getAddress());
    const ethFee = await staking.getClaimEthFee();
    
    console.log('Pending rewards:', ethers.formatEther(pending), 'BKC');
    console.log('ETH Fee:', ethers.formatEther(ethFee), 'ETH');
    
    // Claim (pass YOUR address as operator!)
    const tx = await staking.claimRewards(MY_OPERATOR_ADDRESS, { value: ethFee });
    await tx.wait();
    
    console.log('Rewards claimed!');
}
```

---

## 🎯 Strategy Guide

### For Maximum Rewards

1. **Lock longer** — 365 days gives 52x more pStake than 7 days
2. **Compound** — Claim and restake rewards
3. **Hold Diamond NFT** — 0% burn when unstaking
4. **Time it** — Stake before high-activity periods

### For Flexibility

1. **Short locks** — 30 days allows monthly adjustments
2. **Split stake** — Multiple positions with different lock periods
3. **Rent NFT when unstaking** — Only need protection at exit time

---

## ⚠️ Risks

| Risk | Mitigation |
|------|------------|
| **Lock Period** | Choose period you're comfortable with |
| **Burn on Unstake** | Hold or rent Reward Booster NFT |
| **Smart Contract** | Verified code, tested on testnet |
| **Variable Rewards** | Rewards depend on protocol activity |

---

## 📋 Related Contracts

| Contract | Address | Role |
|----------|---------|------|
| **DelegationManager** | `0x41B1B7940E06318e9b161fc64524FaE7261e8739` | Staking |
| **BKC Token** | `0x38DD1898b7B11f07C03e7dBd957fCC8021fB1396` | Stake token |
| **MiningManager** | `0x7755982411244791d2DA96cBa04d08df72Be43C1` | Reward distribution |
| **RewardBoosterNFT** | `0xf2EA307686267dC674859da28C58CBb7a5866BCf` | Burn reduction |
| **RentalManager** | `0x593A842d214516F216EB6E6E9A97cC84F42f6821` | Rent NFTs |
| **EcosystemManager** | `0xF5741c125Db4034640CeEA8f3DDb0C4a8d96E407` | Configuration |

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
║   Staking is not just locking tokens. It's participating in freedom.             ║
║                                                                                   ║
║   Freedom to stake without permission.                                            ║
║   Freedom to earn from protocol activity.                                         ║
║   Freedom to unstake whenever you choose.                                         ║
║   Freedom to build interfaces and earn as an operator.                           ║
║                                                                                   ║
║   Your stake. Your rewards. Your decision.                                       ║
║                                                                                   ║
║   No one can freeze your position. No one can deny your rewards.                 ║
║                                                                                   ║
║                          THE STAKING IS UNSTOPPABLE.                              ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

*This document is part of Backchain Protocol's public documentation. All staking data is verifiable on-chain. Trust the code, not the words.*
