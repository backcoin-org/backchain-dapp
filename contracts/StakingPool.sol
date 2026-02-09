// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// STAKING POOL — IMMUTABLE
// ============================================================================
//
// Users delegate BKC with a time lock. Longer locks = higher pStake (power).
// Rewards come from BuybackMiner (purchased + mined BKC) and Tier 2 BKC fees.
//
// Reward claim flow:
//   1. Calculate total pending (active delegations + savedRewards)
//   2. Apply burn rate (reduced by NFT boost tier)
//   3. 5% of net rewards → referrer (or treasury if no referrer)
//   4. 95% of net rewards → user
//   5. Pay ETH fee to ecosystem
//
// NFT Burn Reduction Tiers:
//   No NFT  → 50% burn (user keeps 50%)
//   Bronze  → 40% burn (user keeps 60%)
//   Silver  → 25% burn (user keeps 75%)
//   Gold    → 10% burn (user keeps 90%)
//   Diamond →  0% burn (user keeps 100%)
//
// Force unstake:
//   Allows unstaking before lock expires with a BKC penalty.
//   Penalty BKC is burned (deflationary, benefits all holders).
//   Pending rewards are saved (not auto-claimed) so user can claim
//   later with better NFT boost conditions.
//
// Uses reward-per-share pattern (MasterChef-style) for gas-efficient
// proportional distribution without iteration.
//
// ============================================================================

contract StakingPool is IStakingPool {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    uint256 private constant BPS       = 10_000;
    uint256 private constant PRECISION = 1e18;

    // Referrer/treasury cut on claims
    uint256 public constant REFERRER_CUT_BPS = 500; // 5%

    // Lock duration limits
    uint256 public constant MIN_LOCK_DAYS = 1;
    uint256 public constant MAX_LOCK_DAYS = 3650; // 10 years

    // Module/action IDs for ecosystem fee collection
    bytes32 public constant MODULE_ID            = keccak256("STAKING");
    bytes32 public constant ACTION_DELEGATE      = keccak256("STAKING_DELEGATE");
    bytes32 public constant ACTION_CLAIM         = keccak256("STAKING_CLAIM");
    bytes32 public constant ACTION_FORCE_UNSTAKE = keccak256("STAKING_FORCE_UNSTAKE");

    // ── NFT Boost Tiers (in basis points) ──
    uint256 public constant BOOST_BRONZE  = 1000;
    uint256 public constant BOOST_SILVER  = 2500;
    uint256 public constant BOOST_GOLD    = 4000;
    uint256 public constant BOOST_DIAMOND = 5000;

    // ── Burn Rates per Tier (in basis points) ──
    uint256 public constant BURN_RATE_NO_NFT  = 5000; // 50%
    uint256 public constant BURN_RATE_BRONZE  = 4000; // 40%
    uint256 public constant BURN_RATE_SILVER  = 2500; // 25%
    uint256 public constant BURN_RATE_GOLD    = 1000; // 10%
    uint256 public constant BURN_RATE_DIAMOND = 0;    //  0%

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE ADDRESSES
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;
    IBKCToken public immutable bkcToken;
    address public immutable deployer;

    // ════════════════════════════════════════════════════════════════════════
    // CONFIGURABLE (deployer only, set during initial setup)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice NFT boost contract. If address(0), no boost is available.
    IRewardBooster public rewardBooster;

    /// @notice BKC penalty on force unstake (basis points of staked amount).
    ///         Default 1000 = 10%. Penalty is burned.
    uint256 public forceUnstakePenaltyBps = 1000;

    // ════════════════════════════════════════════════════════════════════════
    // REWARD TRACKING (global, MasterChef-style)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Accumulated reward per pStake unit (scaled by PRECISION)
    uint256 public accRewardPerShare;

    /// @notice Total pStake across all users and delegations
    uint256 public override totalPStake;

    /// @notice Total BKC currently locked in delegations
    uint256 public override totalBkcDelegated;

    /// @notice Lifetime BKC rewards deposited into this pool
    uint256 public totalRewardsDistributed;

    /// @notice Lifetime BKC burned from claim burns
    uint256 public totalBurnedOnClaim;

    /// @notice Lifetime BKC burned from force unstake penalties
    uint256 public totalForceUnstakePenalties;

    /// @notice Total ETH collected from claim/delegate/forceUnstake fees
    uint256 public totalEthFeesCollected;

    // ════════════════════════════════════════════════════════════════════════
    // DELEGATION DATA
    // ════════════════════════════════════════════════════════════════════════

    struct Delegation {
        uint128 amount;     // BKC delegated (net after any deductions)
        uint128 pStake;     // weighted power = amount × duration multiplier
        uint64  lockEnd;    // timestamp when unlock is available
        uint64  lockDays;   // original lock duration in days (for display)
        uint256 rewardDebt; // snapshot of accRewardPerShare × pStake at entry
    }

    /// @notice All active delegations per user
    mapping(address => Delegation[]) internal _delegations;

    /// @notice User's total pStake across all their delegations
    mapping(address => uint256) public override userTotalPStake;

    /// @notice Saved rewards from unstaked delegations (claimed later via claimRewards)
    mapping(address => uint256) public savedRewards;

    // ════════════════════════════════════════════════════════════════════════
    // AUTHORIZED REWARD NOTIFIERS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Addresses authorized to call notifyReward (BuybackMiner, Ecosystem)
    mapping(address => bool) public isRewardNotifier;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event Delegated(
        address indexed user,
        uint256 indexed delegationIndex,
        uint256 amount,
        uint256 pStake,
        uint256 lockDays,
        address operator
    );
    event Unstaked(
        address indexed user,
        uint256 indexed delegationIndex,
        uint256 amountReturned
    );
    event ForceUnstaked(
        address indexed user,
        uint256 indexed delegationIndex,
        uint256 amountReturned,
        uint256 penaltyBurned,
        address operator
    );
    event RewardsClaimed(
        address indexed user,
        uint256 totalRewards,
        uint256 burnedAmount,
        uint256 userReceived,
        uint256 cutAmount,
        address cutRecipient,
        uint256 nftBoostUsed,
        address operator
    );
    event TokensBurnedOnClaim(
        address indexed user,
        uint256 burnedAmount,
        uint256 burnRateBps,
        uint256 totalBurnedAllTime
    );
    event RewardNotified(
        uint256 amount,
        uint256 newAccRewardPerShare
    );
    event RewardNotifierSet(address indexed notifier, bool authorized);
    event RewardBoosterUpdated(address indexed oldBooster, address indexed newBooster);
    event ForceUnstakePenaltyUpdated(uint256 oldBps, uint256 newBps);

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error ZeroAmount();
    error LockTooShort();
    error LockTooLong();
    error StillLocked();
    error NotYetLocked();
    error NothingToClaim();
    error NotAuthorized();
    error InvalidIndex();
    error InsufficientFee();
    error TransferFailed();
    error InvalidPenalty();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _ecosystem, address _bkcToken) {
        ecosystem = IBackchainEcosystem(_ecosystem);
        bkcToken = IBKCToken(_bkcToken);
        deployer = msg.sender;
    }

    // ════════════════════════════════════════════════════════════════════════
    // SETUP (deployer configures once after deployment)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Set authorized reward notifier (BuybackMiner, Ecosystem)
    function setRewardNotifier(address _notifier, bool _authorized) external {
        if (msg.sender != deployer) revert NotAuthorized();
        isRewardNotifier[_notifier] = _authorized;
        emit RewardNotifierSet(_notifier, _authorized);
    }

    /// @notice Set the NFT boost contract address
    function setRewardBooster(address _booster) external {
        if (msg.sender != deployer) revert NotAuthorized();
        emit RewardBoosterUpdated(address(rewardBooster), _booster);
        rewardBooster = IRewardBooster(_booster);
    }

    /// @notice Set force unstake penalty (max 5000 = 50%)
    function setForceUnstakePenalty(uint256 _penaltyBps) external {
        if (msg.sender != deployer) revert NotAuthorized();
        if (_penaltyBps > 5000) revert InvalidPenalty();
        emit ForceUnstakePenaltyUpdated(forceUnstakePenaltyBps, _penaltyBps);
        forceUnstakePenaltyBps = _penaltyBps;
    }

    // ════════════════════════════════════════════════════════════════════════
    // DELEGATE BKC
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Delegate BKC with time lock. Pays ETH fee to ecosystem.
    ///         Longer locks = higher pStake = larger share of rewards.
    ///
    /// @param amount    BKC amount to delegate (must have approved this contract)
    /// @param lockDays  Lock duration in days (min 1, max 3650)
    /// @param operator  Frontend operator address (earns commission on ETH fee)
    function delegate(
        uint256 amount,
        uint256 lockDays,
        address operator
    ) external payable override {
        if (amount == 0) revert ZeroAmount();
        if (lockDays < MIN_LOCK_DAYS) revert LockTooShort();
        if (lockDays > MAX_LOCK_DAYS) revert LockTooLong();

        // ETH fee → ecosystem
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender,
                operator,
                address(0), // no custom recipient for staking
                MODULE_ID,
                0           // no BKC fee
            );
            totalEthFeesCollected += msg.value;
        }

        // Pull BKC from user
        bkcToken.transferFrom(msg.sender, address(this), amount);

        // Calculate pStake: more time = more power
        uint256 pStake = _calculatePStake(amount, lockDays);
        uint256 idx = _delegations[msg.sender].length;

        // Store delegation
        _delegations[msg.sender].push(Delegation({
            amount:     uint128(amount),
            pStake:     uint128(pStake),
            lockEnd:    uint64(block.timestamp + (lockDays * 1 days)),
            lockDays:   uint64(lockDays),
            rewardDebt: pStake * accRewardPerShare / PRECISION
        }));

        // Update totals
        userTotalPStake[msg.sender] += pStake;
        totalPStake += pStake;
        totalBkcDelegated += amount;

        emit Delegated(msg.sender, idx, amount, pStake, lockDays, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // UNSTAKE (after lock expires)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Unstake a specific delegation after its lock period expires.
    ///         Pending rewards for this delegation are saved (not auto-claimed).
    ///         Call claimRewards() separately to claim with optimal NFT boost.
    function unstake(uint256 index) external override {
        if (index >= _delegations[msg.sender].length) revert InvalidIndex();

        Delegation storage d = _delegations[msg.sender][index];
        if (block.timestamp < d.lockEnd) revert StillLocked();

        uint256 amount = d.amount;
        uint256 pStake = d.pStake;

        // Save pending reward (user claims later with claimRewards)
        uint256 pending = (uint256(d.pStake) * accRewardPerShare / PRECISION) - d.rewardDebt;
        if (pending > 0) {
            savedRewards[msg.sender] += pending;
        }

        // Update totals
        userTotalPStake[msg.sender] -= pStake;
        totalPStake -= pStake;
        totalBkcDelegated -= amount;

        // Remove delegation (swap with last, then pop)
        _removeDelegation(msg.sender, index);

        // Return full BKC amount
        bkcToken.transfer(msg.sender, amount);

        emit Unstaked(msg.sender, index, amount);
    }

    // ════════════════════════════════════════════════════════════════════════
    // FORCE UNSTAKE (before lock expires — with penalty)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Force unstake BEFORE lock period expires.
    ///         A percentage of the staked BKC is burned as penalty.
    ///         Pending rewards are saved (not auto-claimed).
    ///         Pays ETH fee to ecosystem.
    ///
    /// @param index    Delegation index to force unstake
    /// @param operator Frontend operator address
    function forceUnstake(uint256 index, address operator) external payable {
        if (index >= _delegations[msg.sender].length) revert InvalidIndex();

        Delegation storage d = _delegations[msg.sender][index];
        if (block.timestamp >= d.lockEnd) revert NotYetLocked(); // use regular unstake

        uint256 amount = d.amount;
        uint256 pStake = d.pStake;

        // Save pending reward
        uint256 pending = (uint256(d.pStake) * accRewardPerShare / PRECISION) - d.rewardDebt;
        if (pending > 0) {
            savedRewards[msg.sender] += pending;
        }

        // Calculate penalty (burned)
        uint256 penalty = amount * forceUnstakePenaltyBps / BPS;
        uint256 amountAfterPenalty = amount - penalty;

        // Update totals
        userTotalPStake[msg.sender] -= pStake;
        totalPStake -= pStake;
        totalBkcDelegated -= amount;

        // Remove delegation
        _removeDelegation(msg.sender, index);

        // Burn penalty BKC
        if (penalty > 0) {
            bkcToken.burn(penalty);
            totalForceUnstakePenalties += penalty;
        }

        // Return remaining BKC
        if (amountAfterPenalty > 0) {
            bkcToken.transfer(msg.sender, amountAfterPenalty);
        }

        // ETH fee → ecosystem
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender,
                operator,
                address(0),
                MODULE_ID,
                0
            );
            totalEthFeesCollected += msg.value;
        }

        emit ForceUnstaked(msg.sender, index, amountAfterPenalty, penalty, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLAIM REWARDS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Claim all pending staking rewards.
    ///
    ///         Flow:
    ///         1. Sum pending from all active delegations + savedRewards
    ///         2. Apply burn rate (reduced by NFT boost tier)
    ///         3. Burn the burn portion
    ///         4. 5% of net → referrer (or treasury if no referrer)
    ///         5. 95% of net → user
    ///         6. ETH fee → ecosystem (optional, can be 0 if no fee configured)
    ///
    /// @param operator Frontend operator address
    function claimRewards(address operator) external payable {
        _executeClaim(msg.sender, operator);

        // ETH fee → ecosystem (optional, sent after claim)
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender,
                operator,
                address(0),
                MODULE_ID,
                0
            );
            totalEthFeesCollected += msg.value;
        }
    }

    /// @notice Simplified claimRewards() without operator (interface compliance)
    function claimRewards() external override {
        _executeClaim(msg.sender, address(0));
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL: EXECUTE CLAIM
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Core claim logic shared by claimRewards() and claimRewards(operator)
    function _executeClaim(address user, address operator) internal {
        // 1. Calculate total pending
        uint256 totalReward = _calculateAllPending(user) + savedRewards[user];
        if (totalReward == 0) revert NothingToClaim();

        // 2. Update all reward debts + clear saved
        _updateAllRewardDebt(user);
        savedRewards[user] = 0;

        // 3. Get NFT boost and calculate burn
        uint256 nftBoost = _getUserBestBoost(user);
        uint256 burnRateBps = _getBurnRateForBoost(nftBoost);
        uint256 burnAmount = totalReward * burnRateBps / BPS;
        uint256 afterBurn = totalReward - burnAmount;

        // 4. Burn
        if (burnAmount > 0) {
            bkcToken.burn(burnAmount);
            totalBurnedOnClaim += burnAmount;
            emit TokensBurnedOnClaim(user, burnAmount, burnRateBps, totalBurnedOnClaim);
        }

        // 5. Referrer/treasury cut (5% of after-burn amount)
        uint256 cut = afterBurn * REFERRER_CUT_BPS / BPS;
        uint256 userReward = afterBurn - cut;

        address referrer = ecosystem.referredBy(user);
        address cutRecipient = referrer != address(0)
            ? referrer
            : ecosystem.treasury();

        // 6. Transfer rewards
        if (userReward > 0) {
            bkcToken.transfer(user, userReward);
        }
        if (cut > 0) {
            bkcToken.transfer(cutRecipient, cut);
        }

        emit RewardsClaimed(
            user, totalReward, burnAmount, userReward,
            cut, cutRecipient, nftBoost, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // NOTIFY REWARD (from BuybackMiner or Ecosystem)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Deposit BKC rewards. Called by BuybackMiner after buyback or
    ///         by Ecosystem after Tier 2 BKC fee distribution.
    ///         Tokens must be transferred to this contract BEFORE calling.
    function notifyReward(uint256 bkcAmount) external override {
        if (!isRewardNotifier[msg.sender]) revert NotAuthorized();
        if (totalPStake == 0 || bkcAmount == 0) return;

        accRewardPerShare += bkcAmount * PRECISION / totalPStake;
        totalRewardsDistributed += bkcAmount;

        emit RewardNotified(bkcAmount, accRewardPerShare);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: REWARDS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Total raw pending rewards for a user (before burn/cut)
    function pendingRewards(address user) external view override returns (uint256) {
        return _calculateAllPending(user) + savedRewards[user];
    }

    /// @notice Preview exactly what a claim would produce right now.
    ///         Matches the frontend's previewClaim display.
    function previewClaim(address user) external view returns (
        uint256 totalRewards,
        uint256 burnAmount,
        uint256 referrerCut,
        uint256 userReceives,
        uint256 burnRateBps,
        uint256 nftBoost
    ) {
        totalRewards = _calculateAllPending(user) + savedRewards[user];
        if (totalRewards == 0) return (0, 0, 0, 0, 0, 0);

        nftBoost = _getUserBestBoost(user);
        burnRateBps = _getBurnRateForBoost(nftBoost);
        burnAmount = totalRewards * burnRateBps / BPS;

        uint256 afterBurn = totalRewards - burnAmount;
        referrerCut = afterBurn * REFERRER_CUT_BPS / BPS;
        userReceives = afterBurn - referrerCut;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: DELEGATIONS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Number of active delegations for a user
    function delegationCount(address user) external view override returns (uint256) {
        return _delegations[user].length;
    }

    /// @notice Get all active delegations for a user (for frontend list rendering)
    function getDelegationsOf(address user) external view returns (Delegation[] memory) {
        return _delegations[user];
    }

    /// @notice Get a specific delegation with its pending reward
    function getDelegation(address user, uint256 index) external view returns (
        uint256 amount,
        uint256 pStake,
        uint256 lockEnd,
        uint256 lockDays,
        uint256 pendingReward
    ) {
        if (index >= _delegations[user].length) revert InvalidIndex();
        Delegation memory d = _delegations[user][index];
        amount = d.amount;
        pStake = d.pStake;
        lockEnd = d.lockEnd;
        lockDays = d.lockDays;
        pendingReward = (uint256(d.pStake) * accRewardPerShare / PRECISION) - d.rewardDebt;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: NFT BOOST & BURN RATE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get the best NFT boost for a user (owned or rented)
    ///         Returns 0 if no boost contract is set or user has no NFTs
    function getUserBestBoost(address user) external view returns (uint256) {
        return _getUserBestBoost(user);
    }

    /// @notice Map a boost value to its corresponding burn rate
    /// @param boostBps Boost in basis points (0, 1000, 2500, 4000, 5000)
    /// @return burnRateBps Burn rate in basis points
    function getBurnRateForBoost(uint256 boostBps) external pure returns (uint256) {
        return _getBurnRateForBoost(boostBps);
    }

    /// @notice Get human-readable tier name for a boost value
    function getTierName(uint256 boostBps) external pure returns (string memory) {
        if (boostBps >= BOOST_DIAMOND) return "Diamond";
        if (boostBps >= BOOST_GOLD)    return "Gold";
        if (boostBps >= BOOST_SILVER)  return "Silver";
        if (boostBps >= BOOST_BRONZE)  return "Bronze";
        return "None";
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: STATS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Comprehensive staking statistics for frontend dashboards
    function getStakingStats() external view returns (
        uint256 _totalPStake,
        uint256 _totalBkcDelegated,
        uint256 _totalRewardsDistributed,
        uint256 _totalBurnedOnClaim,
        uint256 _totalForceUnstakePenalties,
        uint256 _totalEthFeesCollected,
        uint256 _accRewardPerShare
    ) {
        return (
            totalPStake,
            totalBkcDelegated,
            totalRewardsDistributed,
            totalBurnedOnClaim,
            totalForceUnstakePenalties,
            totalEthFeesCollected,
            accRewardPerShare
        );
    }

    /// @notice Get a user's complete staking summary
    function getUserSummary(address user) external view returns (
        uint256 _userTotalPStake,
        uint256 _delegationCount,
        uint256 _savedRewards,
        uint256 _totalPending,
        uint256 _nftBoost,
        uint256 _burnRateBps
    ) {
        _userTotalPStake = userTotalPStake[user];
        _delegationCount = _delegations[user].length;
        _savedRewards = savedRewards[user];
        _totalPending = _calculateAllPending(user) + _savedRewards;
        _nftBoost = _getUserBestBoost(user);
        _burnRateBps = _getBurnRateForBoost(_nftBoost);
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL: pStake CALCULATION
    // ════════════════════════════════════════════════════════════════════════

    /// @notice pStake = amount × (1 + lockDays × 5918 / 365 / BPS)
    ///
    ///         Multiplier examples:
    ///           1 day   → 1.002x
    ///           30 days → 1.049x
    ///           365 days → 1.592x
    ///           1825 days (5yr) → 3.959x
    ///           3650 days (10yr) → 6.918x
    function _calculatePStake(uint256 amount, uint256 lockDays) internal pure returns (uint256) {
        uint256 multiplier = BPS + (lockDays * 5918 / 365);
        return amount * multiplier / BPS;
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL: REWARD CALCULATIONS
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Sum pending rewards across all active delegations (NOT including savedRewards)
    function _calculateAllPending(address user) internal view returns (uint256 total) {
        Delegation[] storage dels = _delegations[user];
        for (uint256 i; i < dels.length; ++i) {
            uint256 accumulated = uint256(dels[i].pStake) * accRewardPerShare / PRECISION;
            total += accumulated - dels[i].rewardDebt;
        }
    }

    /// @dev Update rewardDebt for all active delegations (called after claiming)
    function _updateAllRewardDebt(address user) internal {
        Delegation[] storage dels = _delegations[user];
        for (uint256 i; i < dels.length; ++i) {
            dels[i].rewardDebt = uint256(dels[i].pStake) * accRewardPerShare / PRECISION;
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL: NFT BOOST
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Query NFT boost with graceful fallback (returns 0 if no booster or call fails)
    function _getUserBestBoost(address user) internal view returns (uint256) {
        if (address(rewardBooster) == address(0)) return 0;

        // Graceful: if NFT contract reverts, return 0 (no boost)
        try rewardBooster.getUserBestBoost(user) returns (uint256 boost) {
            return boost;
        } catch {
            return 0;
        }
    }

    /// @dev Map boost value to burn rate. Uses tiered brackets.
    function _getBurnRateForBoost(uint256 boostBps) internal pure returns (uint256) {
        if (boostBps >= BOOST_DIAMOND) return BURN_RATE_DIAMOND; // 0%
        if (boostBps >= BOOST_GOLD)    return BURN_RATE_GOLD;    // 10%
        if (boostBps >= BOOST_SILVER)  return BURN_RATE_SILVER;  // 25%
        if (boostBps >= BOOST_BRONZE)  return BURN_RATE_BRONZE;  // 40%
        return BURN_RATE_NO_NFT;                                  // 50%
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL: DELEGATION ARRAY MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Remove delegation at index using swap-with-last-and-pop pattern.
    ///      Gas efficient — O(1) instead of O(n) shift.
    function _removeDelegation(address user, uint256 index) internal {
        uint256 lastIndex = _delegations[user].length - 1;
        if (index != lastIndex) {
            _delegations[user][index] = _delegations[user][lastIndex];
        }
        _delegations[user].pop();
    }
}
