# Backchain V9 Smart Contracts -- Complete Documentation

> **15 contracts** | Solidity 0.8.28 | Arbitrum (Sepolia / One)
> All module contracts are fully immutable after deployment. Only `BackchainEcosystem` has owner-configurable parameters.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Contract Summary Table](#2-contract-summary-table)
3. [Deploy Order](#3-deploy-order)
4. [Post-Deploy Setup](#4-post-deploy-setup)
5. [Fee Flow](#5-fee-flow)
6. [Action IDs](#6-action-ids)
7. [Tier System](#7-tier-system)
8. [Individual Contract Documentation](#8-individual-contract-documentation)
   - [IBackchain (Interfaces)](#81-ibackchain)
   - [BackchainEcosystem](#82-backchainecosystem)
   - [BKCToken](#83-bkctoken)
   - [LiquidityPool](#84-liquiditypool)
   - [StakingPool](#85-stakingpool)
   - [BuybackMiner](#86-buybackminer)
   - [RewardBooster](#87-rewardbooster)
   - [NFTPool](#88-nftpool)
   - [RentalManager](#89-rentalmanager)
   - [Agora](#810-agora)
   - [FortunePool](#811-fortunepool)
   - [Notary](#812-notary)
   - [CharityPool](#813-charitypool)
   - [BackchainGovernance](#814-backchaingovernance)
   - [SimpleBKCFaucet](#815-simplebkcfaucet)

---

## 1. Architecture Overview

### Dependency Graph

```
                        +-----------------------+
                        | BackchainGovernance   |
                        | (controls Ecosystem)  |
                        +----------+------------+
                                   |
                                   | owns
                                   v
+------------------+    +---------------------+    +-----------------+
|   BKCToken       |<-->| BackchainEcosystem  |<-->|  StakingPool    |
| (ERC-20, mint)   |    | (Central Fee Hub)   |    | (BKC rewards)   |
+--------+---------+    +----+------+---------+    +--------+--------+
         |                   |      |                       |
         |                   |      |                       |
         v                   |      |                       v
+------------------+         |      |              +-----------------+
|  LiquidityPool   |<--------+      |              | RewardBooster   |
|  (ETH/BKC AMM)  |         |      |              | (ERC-721 NFT)   |
+--------+---------+         |      |              +---+----+--------+
         |                   |      |                  |    |
         v                   |      |                  |    |
+------------------+         |      |                  |    |
|  BuybackMiner    |---------+      |                  |    |
| (ETH->BKC->Stake)|               |                  v    v
+------------------+         +------+------+     +----+----+----+
                             |             |     | NFTPool (x4) |
                    +--------+--+  +-------+-+   | (Bonding     |
                    |  Agora    |  | Fortune  |   |  Curve AMM)  |
                    | (Social)  |  | Pool     |   +----+---------+
                    +-----------+  | (Game)   |        |
                    |  Notary   |  +----------+   +----+---------+
                    +-----------+                 | RentalManager|
                    | Charity   |                 | (NFT Rental) |
                    |  Pool     |                 +--------------+
                    +-----------+
                    | Faucet    |
                    +-----------+
```

### Design Principles

- **Single fee hub**: All module contracts call `BackchainEcosystem.collectFee()` to distribute ETH/BKC fees.
- **Tier 1 modules** (ETH only): Agora, Notary, CharityPool, NFTPool, RentalManager, StakingPool
- **Tier 2 modules** (ETH + BKC): FortunePool (sends BKC fees through `collectFee` for burn/staker/treasury distribution)
- **Immutable modules**: Once deployed, contract logic never changes. Only `BackchainEcosystem` has configurable parameters (fees, splits, addresses).
- **Operator system**: Every user-facing action accepts an `operator` address. The operator earns a share of ETH fees via the ecosystem module split.
- **Dual provider pattern**: Read operations use public RPC; write operations go through MetaMask signer.

---

## 2. Contract Summary Table

| # | Contract | Purpose | Fee Tier | Immutable | Admin |
|---|----------|---------|----------|-----------|-------|
| 1 | `IBackchain` | Interface definitions for all contracts | N/A | N/A | N/A |
| 2 | `BackchainEcosystem` | Central fee hub, module registry, referral registry, ETH/BKC distribution | N/A (hub) | Logic: yes, Params: no | Owner (2-step transfer) |
| 3 | `BKCToken` | ERC-20 token (Backcoin), 200M max supply, EIP-2612 Permit | N/A | Yes (after `renounceMinterAdmin`) | Deployer (minter mgmt only) |
| 4 | `LiquidityPool` | Constant-product AMM for ETH/BKC swaps, 0.3% fee | N/A (standalone) | Fully immutable | None |
| 5 | `StakingPool` | BKC delegation with time locks, reward distribution, NFT-based burn reduction | Tier 1 (ETH) | Logic: yes, Config: deployer | Deployer (setup only) |
| 6 | `BuybackMiner` | Converts accumulated ETH fees to BKC rewards via buy+mint scarcity curve | N/A (consumer) | Fully immutable | None |
| 7 | `RewardBooster` | ERC-721 NFT with 4 tiers, provides staking burn reduction | N/A (asset) | Yes (after `configurePools`) | Deployer (pre-config only) |
| 8 | `NFTPool` (x4) | Bonding curve AMM for RewardBooster NFT trading (one pool per tier) | Tier 1 (ETH) | Yes (after `initializePool`) | Deployer (init only) |
| 9 | `RentalManager` | NFT rental marketplace for RewardBooster NFTs | Tier 1 (ETH) | Fully immutable | None |
| 10 | `Agora` | Decentralized social protocol (posts, replies, likes, profiles) | Tier 1 (ETH) | Fully immutable | None |
| 11 | `FortunePool` | Commit-reveal game with 3 prize tiers and BKC wagers | Tier 2 (ETH+BKC) | Fully immutable | None |
| 12 | `Notary` | On-chain document certification and verification | Tier 1 (ETH) | Fully immutable | None |
| 13 | `CharityPool` | Permissionless fundraising campaigns | Tier 1 (ETH) | Fully immutable | None |
| 14 | `BackchainGovernance` | Progressive decentralization governance (Admin -> Multisig -> Timelock -> DAO) | N/A (governance) | Logic: yes, Phase: irreversible | Admin / DAO |
| 15 | `SimpleBKCFaucet` | Testnet BKC + ETH distribution | N/A (utility) | No (admin-controlled) | Deployer |

---

## 3. Deploy Order

Contracts must be deployed in this exact sequence due to constructor dependencies:

```
Step  Contract              Constructor Args
----  --------------------  -------------------------------------------------
 1    BKCToken              (_treasury: address)
 2    BackchainEcosystem    (_bkcToken: BKCToken, _treasury: address)
 3    LiquidityPool         (_bkcToken: BKCToken)
 4    StakingPool           (_ecosystem: Ecosystem, _bkcToken: BKCToken)
 5    BuybackMiner          (_ecosystem: Ecosystem, _bkcToken: BKCToken,
                             _liquidityPool: LiquidityPool,
                             _stakingPool: StakingPool)
 6    RewardBooster         (_deployer: deployer address)
 7    NFTPool (Bronze)      (_ecosystem: Ecosystem, _bkcToken: BKCToken,
                             _rewardBooster: RewardBooster, _tier: 0)
 8    NFTPool (Silver)      (...same..., _tier: 1)
 9    NFTPool (Gold)        (...same..., _tier: 2)
10    NFTPool (Diamond)     (...same..., _tier: 3)
11    RentalManager         (_ecosystem: Ecosystem,
                             _rewardBooster: RewardBooster)
12    Agora                 (_ecosystem: Ecosystem)
13    FortunePool           (_ecosystem: Ecosystem, _bkcToken: BKCToken)
14    Notary                (_ecosystem: Ecosystem)
15    CharityPool           (_ecosystem: Ecosystem)
16    BackchainGovernance   (_timelockDelay: uint256, e.g. 86400 = 24h)
17    SimpleBKCFaucet       (_bkcToken: BKCToken, _relayer: address,
                             _tokensPerClaim: uint256,
                             _ethPerClaim: uint256,
                             _cooldown: uint256)
```

---

## 4. Post-Deploy Setup

After all contracts are deployed, the following one-time configuration calls are required:

### 4.1 BackchainEcosystem Configuration

```solidity
// Set dependent addresses
ecosystem.setBuybackMiner(buybackMiner.address);
ecosystem.setStakingPool(stakingPool.address);

// Register all modules (each module needs a moduleId + split config)
// Split: customBps + operatorBps + treasuryBps + buybackBps = 10000
ecosystem.registerModuleBatch(
    [stakingPool, agora, fortunePool, notary, charityPool, nftPoolBronze,
     nftPoolSilver, nftPoolGold, nftPoolDiamond, rentalManager],
    [keccak256("STAKING"), keccak256("AGORA"), keccak256("FORTUNE"),
     keccak256("NOTARY"), keccak256("CHARITY"), keccak256("NFT_POOL"),
     keccak256("NFT_POOL"), keccak256("NFT_POOL"), keccak256("NFT_POOL"),
     keccak256("RENTAL")],
    [cfg_staking, cfg_agora, cfg_fortune, cfg_notary, cfg_charity,
     cfg_nft, cfg_nft, cfg_nft, cfg_nft, cfg_rental]
);

// Configure fee schedules for all actions
ecosystem.setFeeConfigBatch(actionIds[], feeConfigs[]);
```

### 4.2 BKCToken Minter Authorization

```solidity
bkcToken.addMinter(buybackMiner.address);
// OPTIONAL: Lock minter list permanently
bkcToken.renounceMinterAdmin();
```

### 4.3 StakingPool Configuration

```solidity
stakingPool.setRewardNotifier(buybackMiner.address, true);
stakingPool.setRewardNotifier(ecosystem.address, true);
stakingPool.setRewardBooster(rewardBooster.address);
// Optional: adjust force unstake penalty (default: 1000 = 10%)
stakingPool.setForceUnstakePenalty(1000);
```

### 4.4 RewardBooster + NFTPool Initialization

```solidity
// 1. Mint initial NFT inventory (before configurePools)
rewardBooster.mintBatch(deployer, 0, 100); // 100 Bronze NFTs
rewardBooster.mintBatch(deployer, 1, 50);  // 50 Silver NFTs
rewardBooster.mintBatch(deployer, 2, 25);  // 25 Gold NFTs
rewardBooster.mintBatch(deployer, 3, 10);  // 10 Diamond NFTs

// 2. Approve NFTs and BKC for each pool
rewardBooster.setApprovalForAll(nftPoolBronze.address, true);
rewardBooster.setApprovalForAll(nftPoolSilver.address, true);
rewardBooster.setApprovalForAll(nftPoolGold.address, true);
rewardBooster.setApprovalForAll(nftPoolDiamond.address, true);
bkcToken.approve(nftPoolBronze.address, bronzeBkcAmount);
bkcToken.approve(nftPoolSilver.address, silverBkcAmount);
bkcToken.approve(nftPoolGold.address, goldBkcAmount);
bkcToken.approve(nftPoolDiamond.address, diamondBkcAmount);

// 3. Initialize each pool
nftPoolBronze.initializePool(bronzeTokenIds, bronzeBkcAmount);
nftPoolSilver.initializePool(silverTokenIds, silverBkcAmount);
nftPoolGold.initializePool(goldTokenIds, goldBkcAmount);
nftPoolDiamond.initializePool(diamondTokenIds, diamondBkcAmount);

// 4. Lock RewardBooster forever (no more minting after this)
rewardBooster.configurePools(
    [nftPoolBronze, nftPoolSilver, nftPoolGold, nftPoolDiamond]
);
```

### 4.5 LiquidityPool Initialization

```solidity
// First liquidity provider seeds the pool (sets initial price)
bkcToken.approve(liquidityPool.address, bkcAmount);
liquidityPool.addLiquidity{value: ethAmount}(bkcAmount, 0);
```

### 4.6 FortunePool Initial Funding

```solidity
// Seed the prize pool with BKC
bkcToken.approve(fortunePool.address, seedAmount);
fortunePool.fundPrizePool(seedAmount);
```

### 4.7 Governance Transfer

```solidity
// Transfer ecosystem ownership to governance contract
ecosystem.transferOwnership(governance.address);
// From governance contract:
ecosystem.acceptOwnership(); // via governance.execute()
```

---

## 5. Fee Flow

### 5.1 ETH Fee Flow (All Modules)

```
  User Action (post, like, certify, buy NFT, stake, rent, play, donate...)
       |
       | msg.value (ETH fee)
       v
  +---------------------------+
  | Module Contract           |
  |  (Agora, Notary, etc.)   |
  |  calls ecosystem          |
  |  .collectFee{value}()    |
  +------------+--------------+
               |
               v
  +---------------------------+
  | BackchainEcosystem        |
  | _distributeEth()          |
  |                           |
  | Per ModuleConfig split:   |
  |  customBps   --> instant  |-------> Custom Recipient (author, creator, seller)
  |  operatorBps --> pending  |-------> pendingEth[operator] (withdraw later)
  |  treasuryBps --> pending  |-------> pendingEth[treasury] (withdraw later)
  |  buybackBps  --> accum    |-------> buybackAccumulated
  |                           |
  | Missing addr -> buyback   |
  | Rounding dust -> buyback  |
  +---------------------------+
               |
               | When buybackAccumulated >= 0.1 ETH
               v
  +---------------------------+
  | BuybackMiner              |
  | executeBuyback()          |
  |                           |
  |  1% -> caller incentive   |-------> msg.sender (anyone)
  | 99% -> LiquidityPool swap |-------> ETH -> BKC
  |        + mint BKC         |-------> scarcity curve (decreasing)
  |                           |
  |  5% of total BKC burned   |-------> deflationary
  | 95% of total BKC sent     |-------> StakingPool.notifyReward()
  +---------------------------+
```

### 5.2 BKC Fee Flow (Tier 2 Modules -- FortunePool)

```
  FortunePool.commitPlay()
       |
       | BKC wager (20% fee)
       v
  +---------------------------+
  | FortunePool               |
  | approves ecosystem for    |
  | bkcFee, calls collectFee  |
  +------------+--------------+
               |
               v
  +---------------------------+
  | BackchainEcosystem        |
  | _distributeBkc()          |
  |                           |
  | bkcBurnBps (5%)    burn   |-------> BKCToken.burn() (permanent supply reduction)
  | bkcStakerBps (75%) send   |-------> StakingPool.notifyReward()
  | bkcTreasuryBps (20%) send |-------> treasury address
  +---------------------------+
```

### 5.3 Staking Reward Claim Flow

```
  StakingPool.claimRewards()
       |
       v
  +---------------------------------------------+
  | 1. Calculate total pending rewards           |
  |    (active delegations + savedRewards)       |
  |                                              |
  | 2. Get NFT boost (RewardBooster query)       |
  |    No NFT  = 50% burn                        |
  |    Bronze  = 40% burn                        |
  |    Silver  = 25% burn                        |
  |    Gold    = 10% burn                        |
  |    Diamond =  0% burn                        |
  |                                              |
  | 3. Burn portion -> BKCToken.burn()           |
  |                                              |
  | 4. 5% of afterBurn -> referrer               |
  |    (or treasury if no referrer)              |
  |                                              |
  | 5. 95% of afterBurn -> user                  |
  +---------------------------------------------+
```

---

## 6. Action IDs

All action IDs are `keccak256` hashes used by `BackchainEcosystem.calculateFee()` and `setFeeConfig()`.

### 6.1 StakingPool Actions

| Action ID | keccak256 of | Fee Type |
|-----------|-------------|----------|
| `ACTION_DELEGATE` | `"STAKING_DELEGATE"` | Gas-based ETH |
| `ACTION_CLAIM` | `"STAKING_CLAIM"` | Gas-based ETH |
| `ACTION_FORCE_UNSTAKE` | `"STAKING_FORCE_UNSTAKE"` | Gas-based ETH |

### 6.2 Agora Actions

| Action ID | keccak256 of | Fee Type |
|-----------|-------------|----------|
| `ACTION_POST` | `"AGORA_POST"` | Gas-based ETH |
| `ACTION_REPLY` | `"AGORA_REPLY"` | Gas-based ETH |
| `ACTION_REPOST` | `"AGORA_REPOST"` | Gas-based ETH |
| `ACTION_LIKE` | `"AGORA_LIKE"` | Gas-based ETH |
| `ACTION_FOLLOW` | `"AGORA_FOLLOW"` | Gas-based ETH |

> Note: SuperLike and Downvote use fixed 100 gwei pricing, not ecosystem fees.

### 6.3 FortunePool Actions

| Action ID | keccak256 of | Fee Type |
|-----------|-------------|----------|
| `ACTION_TIER0` | `"FORTUNE_TIER0"` | Gas-based ETH |
| `ACTION_TIER1` | `"FORTUNE_TIER1"` | Gas-based ETH |
| `ACTION_TIER2` | `"FORTUNE_TIER2"` | Gas-based ETH |

> Note: BKC fee is always 20% of wager amount (hardcoded, not via action ID).

### 6.4 Notary Actions

| Action ID | keccak256 of | Fee Type |
|-----------|-------------|----------|
| `ACTION_CERTIFY` | `"NOTARY_CERTIFY"` | Gas-based ETH |

### 6.5 CharityPool Actions

| Action ID | keccak256 of | Fee Type |
|-----------|-------------|----------|
| `ACTION_CREATE` | `"CHARITY_CREATE"` | Gas-based ETH |
| `ACTION_DONATE` | `"CHARITY_DONATE"` | Value-based ETH |
| `ACTION_BOOST` | `"CHARITY_BOOST"` | Gas-based ETH |

### 6.6 NFTPool Actions (Per Tier)

| Action ID | keccak256 of | Fee Type |
|-----------|-------------|----------|
| `ACTION_BUY` (T0) | `keccak256(abi.encodePacked("NFT_BUY_T", 0))` | Gas-based ETH |
| `ACTION_BUY` (T1) | `keccak256(abi.encodePacked("NFT_BUY_T", 1))` | Gas-based ETH |
| `ACTION_BUY` (T2) | `keccak256(abi.encodePacked("NFT_BUY_T", 2))` | Gas-based ETH |
| `ACTION_BUY` (T3) | `keccak256(abi.encodePacked("NFT_BUY_T", 3))` | Gas-based ETH |
| `ACTION_SELL` (T0) | `keccak256(abi.encodePacked("NFT_SELL_T", 0))` | Gas-based ETH |
| `ACTION_SELL` (T1) | `keccak256(abi.encodePacked("NFT_SELL_T", 1))` | Gas-based ETH |
| `ACTION_SELL` (T2) | `keccak256(abi.encodePacked("NFT_SELL_T", 2))` | Gas-based ETH |
| `ACTION_SELL` (T3) | `keccak256(abi.encodePacked("NFT_SELL_T", 3))` | Gas-based ETH |

> Note: `_tier` is a `uint8` (0-3), packed with `abi.encodePacked`. This means the action IDs are NOT the same as `keccak256("NFT_BUY_T0")` (string). They use the raw byte value of the tier number.

### 6.7 RentalManager Actions

| Action ID | keccak256 of | Fee Type |
|-----------|-------------|----------|
| `ACTION_RENT` | `"RENTAL_RENT"` | Value-based ETH |

### 6.8 Module IDs

| Module ID | keccak256 of | Used By |
|-----------|-------------|---------|
| `STAKING` | `"STAKING"` | StakingPool |
| `AGORA` | `"AGORA"` | Agora |
| `FORTUNE` | `"FORTUNE"` | FortunePool |
| `NOTARY` | `"NOTARY"` | Notary |
| `CHARITY` | `"CHARITY"` | CharityPool |
| `NFT_POOL` | `"NFT_POOL"` | NFTPool (all 4 tiers share this module ID) |
| `RENTAL` | `"RENTAL"` | RentalManager |

---

## 7. Tier System

### 7.1 NFT Tiers

| Tier | ID | Boost (bps) | Burn Rate on Claim | User Keeps |
|------|----|-------------|-------------------|------------|
| None | - | 0 | 50% (5000 bps) | 50% |
| Bronze | 0 | 1000 (10%) | 40% (4000 bps) | 60% |
| Silver | 1 | 2500 (25%) | 25% (2500 bps) | 75% |
| Gold | 2 | 4000 (40%) | 10% (1000 bps) | 90% |
| Diamond | 3 | 5000 (50%) | 0% (0 bps) | 100% |

### 7.2 Boost Sources

Users can get a boost from two sources (the higher value wins):
1. **Owned NFTs** -- queried via `RewardBooster.getUserBestBoost(user)`
2. **Rented NFTs** -- queried via `RentalManager.getUserBestBoost(user)` (though in V9 the StakingPool only has a single `rewardBooster` reference, see note below)

> Note: In the V9 `StakingPool`, the `rewardBooster` is a single `IRewardBooster` address. The deployer sets it to `RewardBooster`. The `RentalManager` also implements `IRewardBooster` but the current StakingPool only calls one. To combine owned and rented boosts, either: (a) the StakingPool queries both and takes the max, or (b) a wrapper contract aggregates both. In the current V9 code, only one `rewardBooster` is configured.

### 7.3 FortunePool Prize Tiers

| Tier | Range | Multiplier | Win Chance | Expected Value |
|------|-------|-----------|------------|----------------|
| 0 | 1-5 | 2x (20000 bps) | 20% | 0.4x |
| 1 | 1-15 | 10x (100000 bps) | 6.67% | 0.667x |
| 2 | 1-150 | 100x (1000000 bps) | 0.67% | 0.667x |

Players select any combination of tiers (bitmask 1-7). All multipliers are sub-fair, causing the pool to grow over time. Excess above 1M BKC cap is burned.

---

## 8. Individual Contract Documentation

---

### 8.1 IBackchain

**File:** `IBackchain.sol`

**Purpose:** Defines all interface contracts shared across the V9 ecosystem. Every module contract imports and references these interfaces rather than concrete implementations.

**Interfaces Defined:**

| Interface | Key Methods |
|-----------|-------------|
| `IBKCToken` | `totalSupply`, `balanceOf`, `transfer`, `transferFrom`, `approve`, `allowance`, `mint`, `burn`, `burnFrom`, `totalBurned`, `mintableRemaining` |
| `IBackchainEcosystem` | `collectFee`, `calculateFee`, `setReferrer`, `referredBy`, `treasury`, `withdrawEth`, `withdrawBuybackETH`, `buybackAccumulated`, `pendingEth`, `referralCount` |
| `IStakingPool` | `notifyReward`, `delegate`, `claimRewards`, `unstake`, `pendingRewards`, `totalPStake`, `totalBkcDelegated`, `delegationCount`, `userTotalPStake` |
| `ILiquidityPool` | `swapETHforBKC`, `swapBKCforETH`, `getQuote`, `getQuoteBKCtoETH`, `bkcReserve`, `ethReserve`, `currentPrice`, `totalLPShares` |
| `IRewardBooster` | `getUserBestBoost` (returns boost in basis points: 0, 1000, 2500, 4000, or 5000) |
| `IBuybackMiner` | `executeBuyback`, `currentMiningRate`, `pendingBuybackETH` |

---

### 8.2 BackchainEcosystem

**File:** `BackchainEcosystem.sol`

**Purpose:** Central fee hub and configuration authority for the entire Backchain protocol. All module contracts call `collectFee()` here to distribute ETH and BKC fees. The only contract with owner-configurable parameters.

#### Constructor

```solidity
constructor(address _bkcToken, address _treasury)
```

| Param | Type | Description |
|-------|------|-------------|
| `_bkcToken` | `address` | BKCToken contract address (stored as immutable) |
| `_treasury` | `address` | Initial treasury address for dev fund |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `collectFee` | `user, operator, customRecipient, moduleId, bkcFee` | Registered modules only | Distributes ETH (via msg.value) and BKC fees according to module config splits. ETH split: custom/operator/treasury/buyback. BKC split: burn/stakers/treasury. |
| `calculateFee` | `actionId, txValue` | Anyone (view) | Returns the ETH fee for a given action. Gas-based: `gasEstimate * tx.gasprice * bps * multiplier / BPS`. Value-based: `txValue * bps / BPS`. |
| `setReferrer` | `_referrer` | Any user (once) | Sets permanent, one-time referrer for the caller. Referrer earns 5% of user's staking claim rewards. |
| `withdrawEth` | -- | Operators, treasury | Withdraws accumulated ETH earnings. CEI pattern. |
| `withdrawBuybackETH` | -- | BuybackMiner only | Pulls accumulated buyback ETH. Returns amount. |
| `registerModule` | `_contract, _moduleId, _cfg` | Owner | Registers a module contract with its ETH distribution config. |
| `registerModuleBatch` | `_contracts[], _moduleIds[], _cfgs[]` | Owner | Batch version of registerModule. |
| `deauthorizeContract` | `_contract` | Owner | Removes module authorization from a specific contract. |
| `updateModuleConfig` | `_moduleId, _cfg` | Owner | Updates ETH distribution config for a module. |
| `activateModule` / `deactivateModule` | `_moduleId` | Owner | Enable/disable a module. Deactivated modules revert on collectFee. |
| `setFeeConfig` | `_actionId, _cfg` | Owner | Sets fee calculation parameters for an action (type, bps, multiplier, gasEstimate). |
| `setFeeConfigBatch` | `_actionIds[], _cfgs[]` | Owner | Batch version of setFeeConfig. |
| `setTreasury` | `_treasury` | Owner | Updates treasury address. |
| `setBuybackMiner` | `_buyback` | Owner | Updates BuybackMiner address. |
| `setStakingPool` | `_staking` | Owner | Updates StakingPool address. |
| `setBkcDistribution` | `_burnBps, _stakerBps, _treasuryBps` | Owner | Updates BKC fee split (must sum to 10000). |
| `transferOwnership` | `_newOwner` | Owner | Initiates 2-step ownership transfer. |
| `acceptOwnership` | -- | Pending owner | Completes ownership transfer. |
| `recoverToken` | `_token, _to, _amount` | Owner | Recovers accidentally sent ERC-20 tokens (NOT BKC). |

#### Events

`FeeCollected`, `EthDistributed`, `BkcFeeDistributed`, `EthWithdrawn`, `BuybackETHWithdrawn`, `ReferrerSet`, `ModuleRegistered`, `ContractDeauthorized`, `ModuleConfigUpdated`, `ModuleActivated`, `ModuleDeactivated`, `FeeConfigUpdated`, `TreasuryUpdated`, `BuybackMinerUpdated`, `StakingPoolUpdated`, `BkcDistributionUpdated`, `OwnershipTransferStarted`, `OwnershipTransferred`, `TokenRecovered`

#### Fee Model

- Gas-based: `fee = gasEstimate * tx.gasprice * bps * multiplier / 10000`
- Value-based: `fee = txValue * bps / 10000`
- Safe bounds: `MAX_FEE_BPS = 5000` (50%), `MAX_GAS_MULTIPLIER = 10000`, `MAX_GAS_ESTIMATE = 30000000`

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `owner` | `address` | Current owner |
| `pendingOwner` | `address` | Two-step transfer nominee |
| `bkcToken` | `IBKCToken` (immutable) | BKC token reference |
| `treasury` | `address` | Treasury/dev fund address |
| `buybackMiner` | `address` | BuybackMiner contract |
| `stakingPool` | `address` | StakingPool contract |
| `referredBy` | `mapping(address => address)` | Global referral registry |
| `referralCount` | `mapping(address => uint256)` | Referrals per address |
| `modules` | `mapping(bytes32 => ModuleConfig)` | Module ETH split configs |
| `authorizedContracts` | `mapping(address => bytes32)` | Contract -> moduleId binding |
| `moduleIds` | `bytes32[]` | Enumerable module IDs |
| `feeConfigs` | `mapping(bytes32 => FeeConfig)` | Per-action fee parameters |
| `bkcBurnBps` / `bkcStakerBps` / `bkcTreasuryBps` | `uint16` | BKC fee split (default 5%/75%/20%) |
| `pendingEth` | `mapping(address => uint256)` | Accumulated ETH per operator/treasury |
| `buybackAccumulated` | `uint256` | ETH waiting for buyback |
| `totalEthCollected` / `totalBkcCollected` / `totalBkcBurned` / `totalFeeEvents` | `uint256` | Global stats |

#### Security Features

- Two-step ownership transfer (prevents accidental loss)
- CEI pattern on all ETH transfers (effects before interactions)
- Missing operator/customRecipient shares flow to buyback (nothing lost)
- Rounding dust flows to buyback (nothing lost)
- Fee config validation with safe bounds
- Emergency ERC20 recovery (not BKC)
- Module split validation (must sum to 10000)

---

### 8.3 BKCToken

**File:** `BKCToken.sol`

**Purpose:** ERC-20 token powering the Backchain ecosystem. 200M hard cap, 40M minted at TGE. Remaining 160M minted via BuybackMiner scarcity curve. Supports EIP-2612 gasless approvals.

#### Constructor

```solidity
constructor(address _treasury)
```

| Param | Type | Description |
|-------|------|-------------|
| `_treasury` | `address` | Receives initial 40M BKC (TGE) |

Inherits: `ERC20("Backcoin", "BKC")`, `ERC20Permit("Backcoin")`

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `addMinter` | `_minter` | Deployer | Authorize an address to mint BKC (typically BuybackMiner). |
| `removeMinter` | `_minter` | Deployer | Remove minting authorization. |
| `renounceMinterAdmin` | -- | Deployer | Permanently locks the minter list. IRREVERSIBLE. |
| `mint` | `_to, _amount` | Authorized minters | Mint new BKC. Reverts if exceeds MAX_SUPPLY (200M). |
| `burn` | `_amount` | Anyone | Burn own tokens. Reduces totalSupply, increases totalBurned. |
| `burnFrom` | `_from, _amount` | Anyone (with allowance) | Burn from another address. Used by ecosystem for BKC fees. |
| `mintableRemaining` | -- | Anyone (view) | Returns remaining mintable BKC before cap. |
| `totalMinted` | -- | Anyone (view) | Lifetime minted = totalSupply + totalBurned. |

#### Events

`MinterAdded`, `MinterRemoved`, `MinterAdminRenounced`, `TokensBurned`, `TokensMinted`

#### Fee Model

No fees. The token itself does not charge fees on transfers.

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `MAX_SUPPLY` | `uint256` (constant) | 200,000,000 * 10^18 |
| `TGE_AMOUNT` | `uint256` (constant) | 40,000,000 * 10^18 |
| `totalBurned` | `uint256` | Cumulative BKC burned |
| `deployer` | `address` (immutable) | Deployer address |
| `minterAdminRenounced` | `bool` | Whether minter admin is permanently locked |
| `isMinter` | `mapping(address => bool)` | Authorized minters |

#### Security Features

- Hard-coded 200M max supply enforced in `mint()`
- Minter admin can be permanently renounced (irreversible)
- EIP-2612 Permit for gasless approvals
- No admin transfer functions, no blacklists, no pause

---

### 8.4 LiquidityPool

**File:** `LiquidityPool.sol`

**Purpose:** Constant-product AMM (x * y = k) for ETH/BKC swaps. Primary consumer is BuybackMiner converting ETH fees into BKC. Also provides public liquidity for anyone to swap.

#### Constructor

```solidity
constructor(address _bkcToken)
```

| Param | Type | Description |
|-------|------|-------------|
| `_bkcToken` | `address` | BKCToken contract address |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `addLiquidity` | `bkcAmount, minShares` + ETH as msg.value | Anyone | Add ETH+BKC liquidity, receive LP shares. First provider sets price and has MINIMUM_LIQUIDITY (1000) locked permanently. |
| `removeLiquidity` | `shares, minEthOut, minBkcOut` | LP holders | Remove liquidity proportionally. Slippage protection on both outputs. |
| `swapETHforBKC` | `minBkcOut` + ETH as msg.value | Anyone | Swap ETH for BKC. 0.3% fee stays in pool. |
| `swapBKCforETH` | `bkcAmount, minEthOut` | Anyone (with approval) | Swap BKC for ETH. 0.3% fee stays in pool. |
| `getQuote` | `ethAmount` | Anyone (view) | Quote: BKC output for given ETH input. |
| `getQuoteBKCtoETH` | `bkcAmount` | Anyone (view) | Quote: ETH output for given BKC input. |
| `currentPrice` | -- | Anyone (view) | Spot price: BKC per 1 ETH (before fees). |
| `getLPValue` | `provider` | Anyone (view) | ETH and BKC value of an LP's shares. |
| `getOptimalBkcForEth` | `ethAmount` | Anyone (view) | Optimal BKC to pair with ETH deposit. |
| `getPoolStats` | -- | Anyone (view) | Full pool statistics. |

#### Events

`LiquidityAdded`, `LiquidityRemoved`, `SwapETHforBKC`, `SwapBKCforETH`

#### Fee Model

- 0.3% swap fee on every trade (`SWAP_FEE_BPS = 30`)
- Fee stays in the pool, rewarding LP holders
- No external ecosystem fees

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `bkcToken` | `IBKCToken` (immutable) | BKC token reference |
| `ethReserve` | `uint256` | Current ETH in pool |
| `bkcReserve` | `uint256` | Current BKC in pool |
| `totalLPShares` | `uint256` | Total LP share tokens |
| `lpShares` | `mapping(address => uint256)` | Per-user LP shares |
| `totalSwapCount` / `totalEthVolume` / `totalBkcVolume` | `uint256` | Lifetime stats |

#### Security Features

- MINIMUM_LIQUIDITY (1000) permanently locked on first deposit (prevents price manipulation)
- Slippage protection on all operations (min amounts)
- CEI pattern: all state changes before external calls
- No admin functions -- fully immutable
- `receive()` accepts direct ETH

---

### 8.5 StakingPool

**File:** `StakingPool.sol`

**Purpose:** Users delegate BKC with time locks to earn proportional rewards. Longer locks give higher pStake (power). Rewards come from BuybackMiner and Tier 2 BKC fees. Claims apply NFT-based burn reduction and referrer cuts.

#### Constructor

```solidity
constructor(address _ecosystem, address _bkcToken)
```

| Param | Type | Description |
|-------|------|-------------|
| `_ecosystem` | `address` | BackchainEcosystem (immutable) |
| `_bkcToken` | `address` | BKCToken (immutable) |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `delegate` | `amount, lockDays, operator` + ETH fee | Anyone | Delegate BKC with time lock (1-3650 days). Pays ETH fee. Longer locks = higher pStake. |
| `unstake` | `index` | Delegator | Unstake after lock expires. Pending rewards saved (not auto-claimed). |
| `forceUnstake` | `index, operator` + ETH fee | Delegator | Unstake before lock with penalty (default 10% burned). Pays ETH fee. |
| `claimRewards` | `operator` + optional ETH fee | Delegator | Claim all pending rewards with burn reduction, referrer cut, and ETH fee. |
| `claimRewards` | -- (no params) | Delegator | Simplified claim without operator (interface compliance). |
| `notifyReward` | `bkcAmount` | Authorized notifiers | Deposit BKC rewards. Updates accRewardPerShare. Called by BuybackMiner/Ecosystem. |
| `setRewardNotifier` | `_notifier, _authorized` | Deployer | Authorize/deauthorize reward notifiers. |
| `setRewardBooster` | `_booster` | Deployer | Set the NFT boost contract address. |
| `setForceUnstakePenalty` | `_penaltyBps` | Deployer | Set force unstake penalty (max 5000 = 50%). |
| `pendingRewards` | `user` | Anyone (view) | Total raw pending rewards (before burn/cut). |
| `previewClaim` | `user` | Anyone (view) | Preview exact claim output: totalRewards, burnAmount, referrerCut, userReceives, burnRateBps, nftBoost. |
| `getDelegationsOf` | `user` | Anyone (view) | Get all active delegations. |
| `getUserSummary` | `user` | Anyone (view) | Complete staking summary. |

#### Events

`Delegated`, `Unstaked`, `ForceUnstaked`, `RewardsClaimed`, `TokensBurnedOnClaim`, `RewardNotified`, `RewardNotifierSet`, `RewardBoosterUpdated`, `ForceUnstakePenaltyUpdated`

#### Fee Model

- ETH fees on `delegate`, `forceUnstake`, `claimRewards(operator)` sent to ecosystem via `collectFee`
- Rewards subject to NFT-based burn rate (0-50%)
- 5% referrer cut on after-burn rewards (goes to treasury if no referrer)
- Force unstake: BKC penalty burned (default 10% of staked amount)

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `ecosystem` | `IBackchainEcosystem` (immutable) | Ecosystem reference |
| `bkcToken` | `IBKCToken` (immutable) | BKC token reference |
| `deployer` | `address` (immutable) | Deployer for initial setup |
| `rewardBooster` | `IRewardBooster` | NFT boost contract |
| `forceUnstakePenaltyBps` | `uint256` | Force unstake penalty (default 1000 = 10%) |
| `accRewardPerShare` | `uint256` | Accumulated reward per pStake (MasterChef-style) |
| `totalPStake` | `uint256` | Total pStake across all delegations |
| `totalBkcDelegated` | `uint256` | Total BKC locked |
| `_delegations` | `mapping(address => Delegation[])` | Per-user delegation array |
| `userTotalPStake` | `mapping(address => uint256)` | Per-user total pStake |
| `savedRewards` | `mapping(address => uint256)` | Saved rewards from unstaked delegations |
| `isRewardNotifier` | `mapping(address => bool)` | Authorized reward depositors |
| Stats | `uint256` | `totalRewardsDistributed`, `totalBurnedOnClaim`, `totalForceUnstakePenalties`, `totalEthFeesCollected` |

#### pStake Calculation

```
pStake = amount * (10000 + lockDays * 5918 / 365) / 10000
```

Examples:
- 1 day: 1.002x
- 30 days: 1.049x
- 365 days: 1.592x
- 1825 days (5yr): 3.959x
- 3650 days (10yr): 6.918x

#### Security Features

- MasterChef-style reward-per-share for gas-efficient distribution
- Graceful NFT boost fallback (try/catch, returns 0 on failure)
- Swap-with-last-and-pop for O(1) delegation removal
- CEI pattern on all transfers
- Force unstake penalty burned (deflationary)

---

### 8.6 BuybackMiner

**File:** `BuybackMiner.sol`

**Purpose:** Economic engine converting accumulated ETH protocol fees into BKC staking rewards via buy+mint mechanism with linear scarcity curve. Fully permissionless -- anyone can trigger a buyback and earn 1% incentive.

#### Constructor

```solidity
constructor(
    address _ecosystem,
    address _bkcToken,
    address _liquidityPool,
    address _stakingPool
)
```

All parameters stored as immutables.

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `executeBuyback` | -- | Anyone | Execute the full buyback cycle. Caller earns 1% ETH. Reverts if < 0.1 ETH accumulated. |
| `executeBuybackWithSlippage` | `minTotalBkcOut` | Anyone | Same as above with slippage protection on total BKC output. |
| `currentMiningRate` | -- | Anyone (view) | Current mining rate in bps (10000 = 100%, decreases linearly). |
| `pendingBuybackETH` | -- | Anyone (view) | ETH waiting for buyback in ecosystem. |
| `getSupplyInfo` | -- | Anyone (view) | Current supply, remaining mintable, mining rate. |
| `previewBuyback` | -- | Anyone (view) | Preview what a buyback would produce right now. |
| `previewMiningAtSupply` | `supplyLevel, purchaseAmount` | Anyone (pure) | Hypothetical mining at a given supply level. |
| `getBuybackStats` | -- | Anyone (view) | Comprehensive lifetime statistics. |
| `getLastBuyback` | -- | Anyone (view) | Info about the most recent buyback. |

#### Events

`BuybackExecuted`

#### Fee Model

No external fees. The BuybackMiner is a consumer of ecosystem fees:
- Pulls accumulated `buybackAccumulated` ETH from ecosystem
- 1% to caller as incentive (`CALLER_BPS = 100`)
- 5% of (purchased + mined) BKC burned (`BURN_BPS = 500`)
- 95% of (purchased + mined) BKC to StakingPool as rewards

#### Mining Scarcity Curve

```
rate = (MAX_SUPPLY - currentSupply) / MAX_MINTABLE

MAX_SUPPLY   = 200,000,000 BKC
MAX_MINTABLE = 160,000,000 BKC (200M - 40M TGE)
```

| Supply | Mining Rate | Behavior |
|--------|-----------|----------|
| 40M (start) | 100% | 1:1 with purchased |
| 80M | 75% | |
| 120M | 50% | |
| 160M | 25% | |
| 200M (cap) | 0% | Pure real yield only |

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `ecosystem` | `IBackchainEcosystem` (immutable) | |
| `bkcToken` | `IBKCToken` (immutable) | |
| `liquidityPool` | `ILiquidityPool` (immutable) | |
| `stakingPool` | `IStakingPool` (immutable) | |
| `totalEthSpent` / `totalBkcPurchased` / `totalBkcMined` / `totalBkcBurned` / `totalBkcToStakers` / `totalCallerRewards` / `totalBuybacks` | `uint256` | Lifetime stats |
| `lastBuybackTimestamp` / `lastBuybackBlock` / `lastBuybackCaller` / `lastBuybackEth` / `lastBuybackBkcTotal` | various | Last buyback info |

#### Security Features

- Fully immutable, no admin functions
- Minimum 0.1 ETH threshold prevents dust buybacks
- Slippage protection option on total BKC output
- CEI pattern: caller reward sent after all state changes
- All addresses immutable (set at construction)

---

### 8.7 RewardBooster

**File:** `RewardBooster.sol`

**Purpose:** ERC-721 NFT contract with 4 tiers (Bronze/Silver/Gold/Diamond) that provides staking reward boost by reducing burn rate. Minimal custom ERC-721 implementation without OpenZeppelin dependency. Traded via NFTPool bonding curves.

#### Constructor

```solidity
constructor(address _deployer)
```

| Param | Type | Description |
|-------|------|-------------|
| `_deployer` | `address` | Deployer address for setup (immutable) |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `configurePools` | `pools[4]` | Deployer (one-time) | Register 4 NFTPool addresses. Locks forever -- no more minting after this. |
| `mintBatch` | `to, tier, count` | Deployer (pre-config) | Mint initial NFT inventory. Only before `configurePools()`. |
| `getUserBestBoost` | `user` | Anyone (view) | Returns cached best boost for a user. O(1) read. |
| `transferFrom` | `from, to, tokenId` | Owner/approved | Standard ERC-721 transfer. Updates boost cache. |
| `safeTransferFrom` | `from, to, tokenId, [data]` | Owner/approved | Safe ERC-721 transfer with receiver check. |
| `approve` / `setApprovalForAll` | standard | Token owner | Standard ERC-721 approvals. |
| `getTokenInfo` | `tokenId` | Anyone (view) | Returns owner, tier, boost value. |
| `getUserTokens` | `user` | Anyone (view) | Returns all token IDs owned by user. |

#### Events

`Transfer`, `Approval`, `ApprovalForAll`, `PoolsConfigured`

#### Fee Model

No fees. The NFT itself does not charge fees. Fees are collected by NFTPool on buy/sell.

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `deployer` | `address` (immutable) | Setup authority |
| `configured` | `bool` | Whether pools have been configured (locks minting) |
| `totalSupply` | `uint256` | Total NFTs ever minted |
| `tokenTier` | `mapping(uint256 => uint8)` | Tier per token ID |
| `_owners` / `_balances` / `_tokenApprovals` / `_operatorApprovals` | standard ERC-721 | Ownership and approvals |
| `_userTokens` | `mapping(address => uint256[])` | Per-user token list |
| `_tokenIdx` | `mapping(uint256 => uint256)` | Token index in user's array |
| `_bestBoost` | `mapping(address => uint256)` | Cached best boost per user |
| `authorizedPool` | `mapping(address => bool)` | Authorized NFTPool addresses |

#### Security Features

- One-time configuration locks minting permanently
- Boost cache updated on every transfer (O(1) read, O(n) worst-case recalculation on remove)
- ERC-721 receiver check on safe transfers
- ERC-165 support (ERC721 + ERC721Metadata interfaces)
- No admin functions after `configurePools()`

---

### 8.8 NFTPool

**File:** `NFTPool.sol`

**Purpose:** Bonding curve AMM for trading RewardBooster NFTs. Uses constant-product formula (XY=K) where X=NFT count, Y=BKC balance. One pool deployed per tier (4 total). BKC is the trading currency; ETH fees go to ecosystem.

#### Constructor

```solidity
constructor(
    address _ecosystem,
    address _bkcToken,
    address _rewardBooster,
    uint8   _tier
)
```

| Param | Type | Description |
|-------|------|-------------|
| `_ecosystem` | `address` | BackchainEcosystem (immutable) |
| `_bkcToken` | `address` | BKCToken (immutable) |
| `_rewardBooster` | `address` | RewardBooster ERC-721 (immutable) |
| `_tier` | `uint8` | Pool tier: 0=Bronze, 1=Silver, 2=Gold, 3=Diamond (immutable) |

Generates per-tier `ACTION_BUY` and `ACTION_SELL` IDs: `keccak256(abi.encodePacked("NFT_BUY_T", _tier))`.

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `initializePool` | `tokenIds[], bkcAmount` | Deployer (one-time) | Seed pool with NFTs and BKC liquidity. Sets initial K. |
| `buyNFT` | `maxBkcPrice, operator` + ETH fee | Anyone | Buy next available NFT at bonding curve price. |
| `buySpecificNFT` | `tokenId, maxBkcPrice, operator` + ETH fee | Anyone | Buy a specific NFT by token ID. |
| `sellNFT` | `tokenId, minPayout, operator` + ETH fee | NFT owner | Sell NFT back to pool at bonding curve price. |
| `getBuyPrice` / `getSellPrice` | -- | Anyone (view) | Current bonding curve prices. |
| `getTotalBuyCost` / `getTotalSellInfo` | -- | Anyone (view) | BKC price + ETH fee combined. |
| `getPoolInfo` | -- | Anyone (view) | Pool state summary. |
| `getAvailableNFTs` | -- | Anyone (view) | All token IDs in pool. |
| `getSpread` | -- | Anyone (view) | Buy-sell spread in BKC and bps. |

#### Events

`PoolInitialized`, `NFTPurchased`, `NFTSold`

#### Fee Model

- **Buy:** User pays BKC (bonding curve price) + ETH fee. ETH fee goes to ecosystem.
- **Sell:** User receives BKC (bonding curve payout) and pays ETH fee. ETH fee goes to ecosystem.
- No BKC taxes -- only the natural buy/sell spread provides pool growth.

#### Bonding Curve Formulas

```
K = nftCount * bkcBalance

Buy Price  = K / (nftCount - 1) - bkcBalance    (scarcity drives price up)
Sell Price = bkcBalance - K / (nftCount + 1)     (abundance drives price down)
```

- Last NFT can never be bought (`nftCount <= 1` blocks buys).
- K is recalculated after every trade.

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| All constructor params | immutable | ecosystem, bkcToken, rewardBooster, deployer, tier, ACTION_BUY, ACTION_SELL |
| `bkcBalance` | `uint256` | BKC in pool |
| `nftCount` | `uint256` | NFTs in pool |
| `k` | `uint256` | Bonding curve constant |
| `initialized` | `bool` | Whether pool has been seeded |
| `_tokenIds` | `uint256[]` | NFT inventory |
| `_tokenIdx` | `mapping(uint256 => uint256)` | Token index (swap-and-pop) |
| `totalVolume` / `totalBuys` / `totalSells` / `totalEthFees` | `uint256` | Stats |
| `_locked` | `uint8` | Reentrancy guard |

#### Security Features

- Reentrancy guard on all mutations
- Slippage protection on buy (`maxBkcPrice`) and sell (`minPayout`)
- Last NFT reserved (cannot buy when `nftCount <= 1`)
- No admin functions after initialization
- No liquidity removal possible

---

### 8.9 RentalManager

**File:** `RentalManager.sol`

**Purpose:** NFT rental marketplace for RewardBooster NFTs. NFT owners list their NFTs for hourly rental; tenants rent to reduce staking burn rate. Implements `IRewardBooster` so StakingPool can query rented boost.

#### Constructor

```solidity
constructor(address _ecosystem, address _rewardBooster)
```

| Param | Type | Description |
|-------|------|-------------|
| `_ecosystem` | `address` | BackchainEcosystem (immutable) |
| `_rewardBooster` | `address` | RewardBooster ERC-721 (immutable) |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `listNFT` | `tokenId, pricePerHour, minHours, maxHours` | NFT owner | List an NFT for rent. NFT escrowed in contract. |
| `updateListing` | `tokenId, pricePerHour, minHours, maxHours` | Listing owner | Update listing parameters (only when not rented). |
| `withdrawNFT` | `tokenId` | Listing owner | Withdraw NFT from escrow (only when not rented). |
| `rentNFT` | `tokenId, hours_, operator` + ETH | Anyone | Rent an NFT. Pays rental cost + ecosystem ETH fee. One active rental per user. |
| `withdrawEarnings` | -- | Listing owners | Claim accumulated ETH earnings. |
| `getUserBestBoost` | `user` | Anyone (view) | Get best rented boost for a user. O(1). |
| `getListing` | `tokenId` | Anyone (view) | Full listing details including rental status. |
| `getRental` | `tokenId` | Anyone (view) | Current rental details. |
| `getRentalCost` | `tokenId, hours_` | Anyone (view) | Preview: rentalCost + ethFee + totalCost. |
| `hasActiveRental` | `user` | Anyone (view) | Check if user has an active rental. |
| `getAllListedTokenIds` | -- | Anyone (view) | All listed token IDs. |

#### Events

`NFTListed`, `ListingUpdated`, `NFTWithdrawn`, `NFTRented`, `EarningsWithdrawn`

#### Fee Model

- **Rental:** Tenant pays `pricePerHour * hours` (goes to NFT owner) + value-based ETH fee to ecosystem.
- NFT owner earns 100% of rental income (no platform cut on the rental itself).
- Ecosystem ETH fee calculated via `ACTION_RENT` ("RENTAL_RENT") which is value-based on the rental cost.

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `ecosystem` / `rewardBooster` | immutable | Contract references |
| `listings` | `mapping(uint256 => Listing)` | Per-token listing data (owner, pricing, stats) |
| `activeRentals` | `mapping(uint256 => Rental)` | Per-token active rental (tenant, endTime) |
| `pendingEarnings` | `mapping(address => uint256)` | Accumulated ETH per owner |
| `userActiveRental` | `mapping(address => uint256)` | One active rental per user |
| `_listedTokens` / `_listedIdx` | array + mapping | Listed token enumeration |
| Stats | `uint256` | `totalVolume`, `totalRentals`, `totalEthFees`, `totalEarningsWithdrawn` |

#### Security Features

- Reentrancy guard on all mutations
- NFT escrowed in contract during listing
- One active rental per user (prevents over-renting)
- Pull pattern for earnings withdrawal (CEI)
- Rental expiry checked on every boost query

---

### 8.10 Agora

**File:** `Agora.sol`

**Purpose:** Decentralized social protocol where anyone can build their own social network. Each operator runs a frontend = their own network. All networks share the same on-chain social graph with 15 tag categories. Features posts, replies, reposts, likes, super-likes, downvotes, follows, profiles, and premium features.

#### Constructor

```solidity
constructor(address _ecosystem)
```

| Param | Type | Description |
|-------|------|-------------|
| `_ecosystem` | `address` | BackchainEcosystem (immutable) |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `createPost` | `contentHash, tag, contentType, operator` + ETH fee | Anyone | Create a post in a tag category. Content stored in events (not on-chain storage). |
| `createReply` | `parentId, contentHash, contentType, operator` + ETH fee | Anyone | Reply to a post. Inherits parent's tag. Parent author earns custom share. |
| `createRepost` | `originalId, contentHash, operator` + ETH fee | Anyone | Repost with optional quote. Original author earns custom share. |
| `deletePost` | `postId` | Post author | Soft-delete (marks as deleted, blocks engagement). |
| `changeTag` | `postId, newTag` | Post author | Re-categorize a post. Free (gas only). |
| `like` | `postId, operator` + ETH fee | Anyone (1x per post) | Like a post. Post author earns custom share. |
| `superLike` | `postId, operator` + ETH (multiples of 100 gwei) | Anyone (unlimited) | Positive micro-tip. 100 gwei each. Author earns via custom share. |
| `downvote` | `postId, operator` + ETH (multiples of 100 gwei) | Anyone (unlimited) | Negative signal. 100 gwei each. Author earns NOTHING. |
| `follow` | `user, operator` + ETH fee | Anyone | Follow a user. Followed user earns custom share. |
| `unfollow` | `user` | Anyone | Unfollow. Free (gas only). Event-based tracking. |
| `createProfile` | `username, metadataURI, operator` + ETH (username price) | Anyone (once) | Register username + profile. Length-based pricing. |
| `updateProfile` | `metadataURI` | Profile owner | Update profile metadata. Free (gas only). |
| `pinPost` | `postId` | Post author | Pin/unpin a post to profile (1 per user). |
| `boostProfile` | `operator` + ETH (0.0005 ETH/day) | Anyone | Boost profile visibility. Stackable duration. |
| `obtainBadge` | `operator` + 0.001 ETH | Anyone | Get verified trust badge for 1 year. |

#### Events

`PostCreated`, `ReplyCreated`, `RepostCreated`, `PostDeleted`, `TagChanged`, `Liked`, `SuperLiked`, `Downvoted`, `Followed`, `Unfollowed`, `ProfileCreated`, `ProfileUpdated`, `PostPinned`, `ProfileBoosted`, `BadgeObtained`

#### Fee Model

| Action | Fee Type | Custom Recipient |
|--------|----------|-----------------|
| Post | Gas-based ETH (`AGORA_POST`) | `address(0)` (no custom) |
| Reply | Gas-based ETH (`AGORA_REPLY`) | Parent author |
| Repost | Gas-based ETH (`AGORA_REPOST`) | Original author |
| Like | Gas-based ETH (`AGORA_LIKE`) | Post author |
| SuperLike | Fixed: 100 gwei each | Post author |
| Downvote | Fixed: 100 gwei each | `address(0)` (author gets nothing) |
| Follow | Gas-based ETH (`AGORA_FOLLOW`) | Followed user |
| Profile | Username price (1 char=1 ETH ... 7+=free) | `address(0)` |
| Boost | 0.0005 ETH/day | `address(0)` |
| Badge | 0.001 ETH/year | `address(0)` |

#### Username Pricing

| Length | Price |
|--------|-------|
| 1 char | 1 ETH |
| 2 chars | 0.2 ETH |
| 3 chars | 0.03 ETH |
| 4 chars | 0.004 ETH |
| 5 chars | 0.0005 ETH |
| 6 chars | 0.0001 ETH |
| 7+ chars | Free |

#### Tag Categories

| ID | Category |
|----|----------|
| 0 | General |
| 1 | News |
| 2 | Politics |
| 3 | Comedy |
| 4 | Sports |
| 5 | Crypto |
| 6 | Tech |
| 7 | Art |
| 8 | Music |
| 9 | Gaming |
| 10 | Business |
| 11 | Education |
| 12 | Lifestyle |
| 13 | Adult |
| 14 | Random |

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `ecosystem` | `IBackchainEcosystem` (immutable) | |
| `postCounter` | `uint256` | Global post counter |
| `posts` | `mapping(uint256 => Post)` | Post data (author, tag, contentType, deleted, createdAt) -- 1 slot |
| `replyTo` / `repostOf` | `mapping(uint256 => uint256)` | Reply/repost references |
| `likeCount` / `superLikeCount` / `downvoteCount` / `replyCount` / `repostCount` | `mapping(uint256 => uint256)` | Per-post engagement |
| `hasLiked` | `mapping(uint256 => mapping(address => bool))` | Like deduplication |
| `usernameOwner` | `mapping(bytes32 => address)` | Name hash to owner |
| `userUsername` | `mapping(address => bytes32)` | Owner to name hash |
| `profileURI` | `mapping(address => string)` | IPFS metadata |
| `pinnedPost` | `mapping(address => uint256)` | One pinned post per user |
| `boostExpiry` / `badgeExpiry` | `mapping(address => uint64)` | Premium feature expiry |
| `tagPostCount` | `mapping(uint8 => uint256)` | Posts per category |
| `operatorPostCount` / `operatorEngagement` | `mapping(address => uint256)` | Operator stats |
| `totalProfiles` | `uint256` | Registered profiles |

#### Security Features

- Fully immutable, no admin
- Self-action prevention (cannot like/follow yourself)
- Like deduplication (1 per user per post)
- Soft delete (content in events remains, on-chain marked)
- Username normalization (lowercase, a-z 0-9 _ only)
- Content not stored on-chain (only hash in events), saving gas

---

### 8.11 FortunePool

**File:** `FortunePool.sol`

**Purpose:** Provably fair commit-reveal game with 3 prize tiers, BKC wagers, and a self-sustaining prize pool with auto-burn mechanism. Sub-fair multipliers cause pool growth; excess above 1M BKC cap is burned.

#### Constructor

```solidity
constructor(address _ecosystem, address _bkcToken)
```

| Param | Type | Description |
|-------|------|-------------|
| `_ecosystem` | `address` | BackchainEcosystem (immutable) |
| `_bkcToken` | `address` | BKCToken (immutable) |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `commitPlay` | `commitHash, wagerAmount, tierMask, operator` + ETH fee | Anyone | Commit a bet with hidden guesses. 20% BKC fee to ecosystem. 80% enters pool. |
| `revealPlay` | `gameId, guesses[], userSecret` | Committer | Reveal guesses, resolve game. Pays prizes if matching. |
| `claimExpired` | `gameId` | Anyone | Mark expired game as forfeited. Permissionless. |
| `fundPrizePool` | `amount` | Anyone | Add BKC to prize pool. |
| `getTierInfo` | `tier` | Anyone (pure) | Tier range, multiplier, win chance. |
| `getAllTiers` | -- | Anyone (pure) | All 3 tiers data. |
| `calculatePotentialWinnings` | `wagerAmount, tierMask` | Anyone (view) | Preview potential winnings and fee breakdown. |
| `getRequiredFee` | `tierMask` | Anyone (view) | Total ETH fee for selected tiers. |
| `getGameStatus` | `gameId` | Anyone (view) | Status, canReveal, blocks until reveal/expiry. |
| `generateCommitHash` | `guesses[], userSecret` | Anyone (pure) | Helper to generate commit hash for frontend. |

#### Events

`GameCommitted`, `GameRevealed`, `GameDetails`, `GameExpired`, `PrizePoolFunded`, `PoolExcessBurned`

#### Fee Model

- **BKC fee:** 20% of wager amount (`BKC_FEE_BPS = 2000`) sent to ecosystem as Tier 2 BKC fee (burn/stakers/treasury).
- **ETH fee:** Sum of per-tier fees (`FORTUNE_TIER0`, `FORTUNE_TIER1`, `FORTUNE_TIER2`) per selected tier.
- **Prize pool:** 80% of wager enters pool. Max payout: 10% of pool per game.
- **Auto-burn:** Pool excess above 1M BKC burned automatically.

#### Game Mechanics

1. **Commit:** Player picks tiers (bitmask 1-7), submits `keccak256(guesses[], secret)` + BKC wager + ETH fee.
2. **Wait:** 5 blocks (`REVEAL_DELAY`) for unpredictable blockhash.
3. **Reveal:** Player reveals guesses + secret within 200 blocks (`REVEAL_WINDOW`). Contract rolls per-tier random numbers, compares, pays prizes.
4. **Expiry:** If not revealed within window, wager forfeited to pool.

Roll per tier: `keccak256(blockhash, gameId, tierIndex) % range + 1`

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `ecosystem` / `bkcToken` | immutable | Contract references |
| `gameCounter` | `uint256` | Total games created |
| `prizePool` | `uint256` | Current BKC in prize pool |
| `games` | `mapping(uint256 => Commitment)` | Per-game commitment data (3 slots) |
| `gameResults` | `mapping(uint256 => GameResult)` | Per-game result data |
| `activeGame` | `mapping(address => uint256)` | One active game per player |
| Stats | `uint256` | `totalGamesPlayed`, `totalBkcWagered`, `totalBkcWon`, `totalBkcForfeited`, `totalBkcBurned` |

#### Security Features

- Commit-reveal prevents front-running (guesses hidden until blockhash exists)
- Per-tier entropy: `keccak256(blockhash, gameId, tierIndex)`
- 10% payout cap prevents pool drainage
- Auto-expire mechanism for abandoned games
- CEI pattern on all payouts
- Pool cap (1M BKC) with auto-burn

---

### 8.12 Notary

**File:** `Notary.sol`

**Purpose:** On-chain document certification. Hash a file, store proof permanently. Supports single and batch notarization with document type classification and certificate ownership transfer.

#### Constructor

```solidity
constructor(address _ecosystem)
```

| Param | Type | Description |
|-------|------|-------------|
| `_ecosystem` | `address` | BackchainEcosystem (immutable) |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `certify` | `documentHash, meta, docType, operator` + ETH fee | Anyone | Notarize a single document. Hash can never be re-certified. |
| `batchCertify` | `documentHashes[], metas[], docTypes[], operator` + ETH fee | Anyone | Notarize up to 20 documents in one tx. Single ecosystem fee call. |
| `transferCertificate` | `documentHash, newOwner` | Certificate owner | Transfer certificate ownership to another address. |
| `verify` | `documentHash` | Anyone (view) | Verify a document hash. Returns all cert data if notarized. |
| `getCertificate` | `certId` | Anyone (view) | Get certificate by sequential ID. |
| `getFee` | -- | Anyone (view) | Current ETH fee for certifying. |

#### Events

`Certified`, `BatchCertified`, `CertificateTransferred`

#### Fee Model

- Gas-based ETH fee per document (`NOTARY_CERTIFY`), sent to ecosystem.
- Batch: fee = per-doc fee * count, single `collectFee` call.
- No custom recipient (all fee to ecosystem split).

#### Document Types

| Type ID | Category |
|---------|----------|
| 0 | General |
| 1 | Contract/Agreement |
| 2 | Identity (ID, passport) |
| 3 | Diploma/Certificate |
| 4 | Property (deeds, titles) |
| 5 | Financial (invoices, receipts) |
| 6 | Legal (court docs, patents) |
| 7 | Medical (records) |
| 8 | IP (copyright) |
| 9 | Other |

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `ecosystem` | immutable | |
| `certs` | `mapping(bytes32 => Certificate)` | Hash to cert data (1 slot: owner+timestamp+docType) |
| `metadata` | `mapping(bytes32 => string)` | Hash to IPFS CID (stored separately, gas-efficient) |
| `certById` | `mapping(uint256 => bytes32)` | Sequential index to hash |
| `certCount` | `uint256` | Total certs issued |
| `totalEthCollected` | `uint256` | Lifetime ETH |

#### Security Features

- Hash uniqueness enforced (cannot re-certify)
- No admin, fully immutable
- Batch limited to 20 documents (`MAX_BATCH_SIZE`)
- Certificate ownership transferable

---

### 8.13 CharityPool

**File:** `CharityPool.sol`

**Purpose:** Permissionless fundraising campaigns. Anyone can create a campaign, anyone can donate. Creator receives 100% of raised ETH. Pure donation model with no refunds and no all-or-nothing goals.

#### Constructor

```solidity
constructor(address _ecosystem)
```

| Param | Type | Description |
|-------|------|-------------|
| `_ecosystem` | `address` | BackchainEcosystem (immutable) |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `createCampaign` | `title, metadataUri, goal, durationDays, operator` + ETH fee | Anyone | Create a campaign (1-365 day duration). Pays small creation fee. |
| `donate` | `campaignId, operator` + ETH donation | Anyone | Donate to active campaign. Value-based fee deducted. Net stored for creator. |
| `boostCampaign` | `campaignId, operator` + ETH fee | Anyone | Boost campaign visibility for 24 hours. |
| `closeCampaign` | `campaignId` | Campaign owner | Close campaign early. Can still withdraw raised funds. |
| `withdraw` | `campaignId` | Campaign owner | Withdraw raised ETH after deadline or close. 100% to creator. |
| `getCampaign` | `campaignId` | Anyone (view) | Full campaign data. |
| `canWithdraw` | `campaignId` | Anyone (view) | Check if withdrawal is available. |
| `previewDonation` | `amount` | Anyone (view) | Preview fee vs net donation for a given amount. |

#### Events

`CampaignCreated`, `DonationMade`, `CampaignBoosted`, `CampaignClosed`, `FundsWithdrawn`

#### Fee Model

| Action | Fee Type | Custom Recipient |
|--------|----------|-----------------|
| Create | Gas-based ETH (`CHARITY_CREATE`) | `address(0)` |
| Donate | Value-based ETH (`CHARITY_DONATE`) | Campaign owner |
| Boost | Gas-based ETH (`CHARITY_BOOST`) | Campaign owner |

- Creator receives net donation (gross - ecosystem fee).
- Goal is informational only (no enforcement).

#### Campaign States

| State | Value | Description |
|-------|-------|-------------|
| Active | 0 | Accepting donations |
| Closed | 1 | Creator closed early, can still withdraw |
| Withdrawn | 2 | Funds withdrawn |

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `ecosystem` | immutable | |
| `campaigns` | `mapping(uint256 => Campaign)` | Campaign data (3 packed slots) |
| `titles` / `metadataUris` | `mapping(uint256 => string)` | Campaign text data |
| `campaignCount` | `uint256` | Total campaigns |
| Stats | `uint256` | `totalDonated`, `totalWithdrawn`, `totalEthFees` |

#### Security Features

- Pull pattern for fund withdrawal (CEI)
- Only creator can withdraw and close
- Deadline enforcement (auto-close on withdraw past deadline)
- Duration limits (1-365 days)
- No admin, fully immutable

---

### 8.14 BackchainGovernance

**File:** `BackchainGovernance.sol`

**Purpose:** Progressive decentralization governance controlling BackchainEcosystem parameters. Advances through 4 irreversible phases: Admin Only -> Multisig -> Timelock -> DAO. All other V9 contracts are fully immutable; governance only touches the Ecosystem contract.

#### Constructor

```solidity
constructor(uint256 _timelockDelay)
```

| Param | Type | Description |
|-------|------|-------------|
| `_timelockDelay` | `uint256` | Initial delay for timelock proposals (1h - 30d) |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `setPendingAdmin` | `_pending` | Admin | Nominate new admin (2-step). |
| `acceptAdmin` | -- | Pending admin | Accept admin role. |
| `advancePhase` | -- | Admin | Advance to next governance phase. IRREVERSIBLE. |
| `setDAO` | `_dao` | Admin | Set DAO contract address (required before DAO phase). |
| `setTimelockDelay` | `_delay` | Governance | Update timelock delay (1h - 30d). |
| `execute` | `target, data` + ETH | Governance | Direct execution (pre-Timelock only). DISABLED once Timelock phase is reached. |
| `queueProposal` | `target, data, value, description` | Governance | Queue a proposal with timelock delay. |
| `executeProposal` | `proposalId` | Governance | Execute a queued proposal after delay. Must be within grace period. |
| `cancelProposal` | `proposalId` | Governance | Cancel a pending proposal. |
| `getProposal` | `proposalId` | Anyone (view) | Get proposal details. |
| `getProposalState` | `proposalId` | Anyone (view) | Computed state: Pending/Ready/Executed/Cancelled/Expired. |
| `getStatus` | -- | Anyone (view) | Full governance status overview. |

#### Governance Phases

| Phase | Value | Description | Execution |
|-------|-------|-------------|-----------|
| AdminOnly | 0 | Single admin | Direct `execute()` |
| Multisig | 1 | Admin is Gnosis Safe | Direct `execute()` |
| Timelock | 2 | All changes require delay | `queueProposal()` -> wait -> `executeProposal()` |
| DAO | 3 | Community votes | Same as Timelock, but `onlyGovernance` = DAO contract |

#### Proposal States

| State | Description |
|-------|-------------|
| Pending | Queued, waiting for delay |
| Ready | Delay passed, can execute |
| Executed | Successfully executed |
| Cancelled | Cancelled by governance |
| Expired | Grace period (7 days) passed |

#### Events

`AdminTransferred`, `PendingAdminSet`, `PhaseAdvanced`, `DAOSet`, `TimelockDelayUpdated`, `ProposalCreated`, `ProposalExecuted`, `ProposalCancelled`, `DirectExecution`

#### Fee Model

None. Governance does not collect fees.

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `admin` / `pendingAdmin` / `dao` | `address` | Governance authorities |
| `currentPhase` | `Phase` (enum) | Current governance phase |
| `timelockDelay` | `uint256` | Delay for proposals (1h - 30d) |
| `proposalCount` | `uint256` | Total proposals |
| `_proposals` | `mapping(uint256 => Proposal)` | Proposal data |
| `queuedTransactions` | `mapping(bytes32 => bool)` | Queued transaction hashes |

#### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MIN_DELAY` | 1 hour | Minimum timelock delay |
| `MAX_DELAY` | 30 days | Maximum timelock delay |
| `GRACE_PERIOD` | 7 days | Time to execute after delay |

#### Security Features

- Phase advancement is irreversible (can only go forward)
- Two-step admin transfer
- Direct execution permanently disabled once Timelock phase is reached
- Proposals expire after grace period (prevents stale execution)
- No proxy, no upgrades -- permanent governance infrastructure
- Ecosystem ownership can be transferred to new governance if needed

---

### 8.15 SimpleBKCFaucet

**File:** `SimpleBKCFaucet.sol`

**Purpose:** Testnet utility for distributing BKC tokens and ETH to users. Two modes: relayer (pays gas for new users) and direct claim (user pays own gas). Not a core protocol contract.

#### Constructor

```solidity
constructor(
    address _bkcToken,
    address _relayer,
    uint256 _tokensPerClaim,
    uint256 _ethPerClaim,
    uint256 _cooldown
)
```

| Param | Type | Description |
|-------|------|-------------|
| `_bkcToken` | `address` | BKCToken (immutable) |
| `_relayer` | `address` | Authorized relayer address |
| `_tokensPerClaim` | `uint256` | BKC per claim |
| `_ethPerClaim` | `uint256` | ETH per claim |
| `_cooldown` | `uint256` | Seconds between claims per user |

#### Key Functions

| Function | Params | Who Can Call | Description |
|----------|--------|-------------|-------------|
| `claim` | -- | Anyone | Direct claim. User pays gas. |
| `distributeTo` | `recipient` | Relayer only | Distribute to a single recipient. Relayer pays gas. |
| `distributeBatch` | `recipients[]` | Relayer only | Distribute to multiple recipients. Skips those on cooldown. |
| `setConfig` | `_relayer, _tokensPerClaim, _ethPerClaim, _cooldown` | Deployer | Update faucet configuration. |
| `setPaused` | `_paused` | Deployer | Pause/unpause faucet. |
| `resetCooldown` | `user` | Deployer | Reset cooldown for a specific user. |
| `withdrawAll` | -- | Deployer | Withdraw all remaining funds to deployer. |
| `canClaim` | `user` | Anyone (view) | Check if user is eligible for claim. |
| `getUserInfo` | `user` | Anyone (view) | User's claim history and eligibility. |
| `getFaucetStatus` | -- | Anyone (view) | Balances, config, estimated remaining claims. |

#### Events

`Claimed`, `ConfigUpdated`, `Paused`, `FundsDeposited`, `FundsWithdrawn`

#### Fee Model

No fees. This is a distribution utility.

#### Storage Layout

| Variable | Type | Description |
|----------|------|-------------|
| `bkcToken` / `deployer` | immutable | |
| `relayer` | `address` | Authorized relayer |
| `tokensPerClaim` / `ethPerClaim` / `cooldown` | `uint256` | Configurable distribution params |
| `paused` | `bool` | Pause state |
| `lastClaimTime` | `mapping(address => uint256)` | Last claim timestamp per user |
| `claimCount` | `mapping(address => uint256)` | Total claims per user |
| Stats | `uint256` | `totalTokensDistributed`, `totalEthDistributed`, `totalClaims`, `totalUniqueUsers` |

#### Security Features

- Cooldown prevents abuse
- Relayer authorization for gas-free claims
- Reentrancy guard
- Pausable by deployer
- Balance checks before distribution
- `receive()` accepts ETH funding
