// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// STAKING POOL — IMMUTABLE (V2: Recycle + Tutor)
// ============================================================================
//
// Users delegate BKC with a time lock. Longer locks = higher pStake (power).
// Rewards come from BuybackMiner (purchased + mined BKC) and Tier 2 BKC fees.
//
// Reward claim flow (V2 — Recycle Model):
//   1. Calculate total pending (active delegations + savedRewards)
//   2. NFT tier determines recycle rate (tokens returned to stakers, NOT burned)
//   3. Tutor system: 5% to tutor if set, otherwise 10% burned
//   4. User receives: total - recycle - tutorCut (or - burn if no tutor)
//   5. Pay ETH fee to ecosystem
//
// NFT Recycle Rates (basis points recycled to all stakers):
//   No NFT  → 60% recycled (user keeps 40%, or 45% with tutor)
//   Bronze  → 40% recycled (user keeps 60%, or 65% with tutor)
//   Silver  → 30% recycled (user keeps 70%, or 75% with tutor)
//   Gold    → 20% recycled (user keeps 80%, or 85% with tutor)
//   Diamond →  0% recycled (user keeps 100%, or 95% with tutor)
//
// Tutor system:
//   With tutor: 5% of total → tutor, 0% burned (user saves 5% vs no-tutor)
//   No tutor:  10% of total → burned (deflationary penalty for no mentor)
//   Net: having a tutor saves user 5% of rewards
//
// Force unstake:
//   Default: 10% penalty (burned). Diamond NFT holders: only 5% penalty.
//   Pending rewards are saved (not auto-claimed).
//
// Gas optimized: combined calculate+update loop in claims (single iteration).
//
// ============================================================================

contract StakingPool is IStakingPool {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    uint256 private constant BPS       = 10_000;
    uint256 private constant PRECISION = 1e18;

    // Tutor: 5% of total rewards goes to tutor
    uint256 public constant TUTOR_BPS = 500; // 5%

    // No-tutor burn: 10% of total rewards is burned (only penalty for no tutor)
    uint256 public constant NO_TUTOR_BURN_BPS = 1000; // 10%

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

    // ── Recycle Rates per Tier (in basis points — recycled to stakers, NOT burned) ──
    uint256 public constant RECYCLE_RATE_NO_NFT  = 6000; // 60%
    uint256 public constant RECYCLE_RATE_BRONZE  = 4000; // 40%
    uint256 public constant RECYCLE_RATE_SILVER  = 3000; // 30%
    uint256 public constant RECYCLE_RATE_GOLD    = 2000; // 20%
    uint256 public constant RECYCLE_RATE_DIAMOND = 0;    // 0% (keeps everything)

    // ── Tutor & Burn on Penalties ──
    uint256 public constant TUTOR_PENALTY_BPS = 500;     // 5% of penalty → tutor
    uint256 public constant NO_TUTOR_BURN_PENALTY_BPS = 1000; // 10% of penalty → burned

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

    /// @notice Minimum ETH fee required for force unstake (~$1 USD).
    ///         Routed through ecosystem.collectFee for standard distribution.
    uint256 public forceUnstakeEthFee = 0.0004 ether;

    /// @notice Authorized contracts that can call delegateFor (AirdropVesting)
    mapping(address => bool) public isDelegateForAuthorized;

    // ════════════════════════════════════════════════════════════════════════
    // REWARD TRACKING (global, MasterChef-style)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Accumulated reward per pStake unit (scaled by PRECISION)
    uint256 public accRewardPerShare;

    /// @notice Total pStake across all users and delegations
    uint256 public override totalPStake;

    /// @notice Total BKC currently locked in delegations
    uint256 public override totalBkcDelegated;

    /// @notice Lifetime BKC rewards deposited into this pool (including recycled)
    uint256 public totalRewardsDistributed;

    /// @notice Lifetime BKC burned from no-tutor claims
    uint256 public totalBurnedOnClaim;

    /// @notice Lifetime BKC recycled back to stakers
    uint256 public totalRecycledOnClaim;

    /// @notice Lifetime BKC burned from force unstake penalties
    uint256 public totalForceUnstakePenalties;

    /// @notice Lifetime BKC sent to tutors
    uint256 public totalTutorPayments;

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
        uint256 totalPenalty,
        uint256 recycledAmount,
        uint256 burnedAmount,
        uint256 tutorAmount,
        address tutor,
        address operator
    );
    event RewardsClaimed(
        address indexed user,
        uint256 totalRewards,
        uint256 recycledAmount,
        uint256 burnedAmount,
        uint256 tutorAmount,
        uint256 userReceived,
        uint256 nftBoostUsed,
        address tutor,
        address operator
    );
    event RewardNotified(
        uint256 amount,
        uint256 newAccRewardPerShare
    );
    event RewardNotifierSet(address indexed notifier, bool authorized);
    event RewardBoosterUpdated(address indexed oldBooster, address indexed newBooster);
    event ForceUnstakeEthFeeUpdated(uint256 oldFee, uint256 newFee);
    event DelegateForAuthorizationSet(address indexed contractAddr, bool authorized);

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

    /// @notice Set the ETH fee for force unstake
    function setForceUnstakeEthFee(uint256 _fee) external {
        if (msg.sender != deployer) revert NotAuthorized();
        if (_fee > 0.01 ether) revert InvalidPenalty(); // max ~$20
        emit ForceUnstakeEthFeeUpdated(forceUnstakeEthFee, _fee);
        forceUnstakeEthFee = _fee;
    }

    /// @notice Authorize a contract to call delegateFor (e.g., AirdropVesting)
    function setDelegateForAuthorized(address _contract, bool _authorized) external {
        if (msg.sender != deployer) revert NotAuthorized();
        isDelegateForAuthorized[_contract] = _authorized;
        emit DelegateForAuthorizationSet(_contract, _authorized);
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

    /// @notice Delegate BKC on behalf of a beneficiary. Only callable by authorized
    ///         contracts (e.g., AirdropVesting). Pulls BKC from msg.sender,
    ///         creates delegation for beneficiary.
    ///
    /// @param beneficiary Address who owns the delegation and earns rewards
    /// @param amount      BKC amount to delegate (must be approved for this contract)
    /// @param lockDays    Lock duration in days
    function delegateFor(
        address beneficiary,
        uint256 amount,
        uint256 lockDays
    ) external override {
        if (!isDelegateForAuthorized[msg.sender]) revert NotAuthorized();
        if (amount == 0) revert ZeroAmount();
        if (lockDays < MIN_LOCK_DAYS) revert LockTooShort();
        if (lockDays > MAX_LOCK_DAYS) revert LockTooLong();

        // Pull BKC from caller (e.g., AirdropVesting contract)
        bkcToken.transferFrom(msg.sender, address(this), amount);

        // Calculate pStake
        uint256 pStake = _calculatePStake(amount, lockDays);
        uint256 idx = _delegations[beneficiary].length;

        // Store delegation under beneficiary
        _delegations[beneficiary].push(Delegation({
            amount:     uint128(amount),
            pStake:     uint128(pStake),
            lockEnd:    uint64(block.timestamp + (lockDays * 1 days)),
            lockDays:   uint64(lockDays),
            rewardDebt: pStake * accRewardPerShare / PRECISION
        }));

        // Update totals
        userTotalPStake[beneficiary] += pStake;
        totalPStake += pStake;
        totalBkcDelegated += amount;

        emit Delegated(beneficiary, idx, amount, pStake, lockDays, address(0));
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
    ///         Diamond NFT holders get reduced penalty (5% vs 10% default).
    ///         Pending rewards are saved (not auto-claimed).
    ///         Pays ETH fee to ecosystem.
    ///
    /// @param index    Delegation index to force unstake
    /// @param operator Frontend operator address
    function forceUnstake(uint256 index, address operator) external payable {
        if (index >= _delegations[msg.sender].length) revert InvalidIndex();
        if (msg.value < forceUnstakeEthFee) revert InsufficientFee();

        Delegation storage d = _delegations[msg.sender][index];
        if (block.timestamp >= d.lockEnd) revert NotYetLocked(); // use regular unstake

        uint256 amount = d.amount;
        uint256 pStake = d.pStake;

        // Save pending reward
        uint256 pending = (uint256(d.pStake) * accRewardPerShare / PRECISION) - d.rewardDebt;
        if (pending > 0) {
            savedRewards[msg.sender] += pending;
        }

        // ── Penalty follows same NFT-tier logic as claims ──
        uint256 nftBoost = _getUserBestBoost(msg.sender);
        uint256 penaltyRateBps = _getRecycleRateForBoost(nftBoost);
        // Same rates: No NFT=60%, Bronze=40%, Silver=30%, Gold=20%, Diamond=0%

        uint256 penalty = amount * penaltyRateBps / BPS;

        // ── Penalty distribution: recycle + tutor/burn (same as claims) ──
        uint256 recycleAmount;
        uint256 burnAmount;
        uint256 tutorAmount;
        address tutor;

        if (penalty > 0) {
            tutor = ecosystem.tutorOf(msg.sender);
            if (tutor != address(0)) {
                tutorAmount = penalty * TUTOR_PENALTY_BPS / BPS;
            } else {
                burnAmount = penalty * NO_TUTOR_BURN_PENALTY_BPS / BPS;
            }
            recycleAmount = penalty - tutorAmount - burnAmount;

            // Burn
            if (burnAmount > 0) {
                bkcToken.burn(burnAmount);
                totalBurnedOnClaim += burnAmount;
            }

            // Recycle to stakers (before removing this user's pStake)
            if (recycleAmount > 0 && totalPStake > 0) {
                accRewardPerShare += recycleAmount * PRECISION / totalPStake;
                totalRewardsDistributed += recycleAmount;
                totalRecycledOnClaim += recycleAmount;
            }

            // Tutor cut
            if (tutorAmount > 0) {
                bkcToken.transfer(tutor, tutorAmount);
                totalTutorPayments += tutorAmount;
            }

            totalForceUnstakePenalties += penalty;
        }

        uint256 amountAfterPenalty = amount - penalty;

        // Update totals
        userTotalPStake[msg.sender] -= pStake;
        totalPStake -= pStake;
        totalBkcDelegated -= amount;

        // Remove delegation
        _removeDelegation(msg.sender, index);

        // Return remaining BKC
        if (amountAfterPenalty > 0) {
            bkcToken.transfer(msg.sender, amountAfterPenalty);
        }

        // ETH fee → ecosystem (mandatory)
        ecosystem.collectFee{value: msg.value}(
            msg.sender,
            operator,
            address(0),
            MODULE_ID,
            0
        );
        totalEthFeesCollected += msg.value;

        emit ForceUnstaked(
            msg.sender, index, amountAfterPenalty, penalty,
            recycleAmount, burnAmount, tutorAmount, tutor, operator
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLAIM REWARDS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Claim all pending staking rewards.
    ///
    ///         V2 Recycle Model:
    ///         1. Calculate pending (combined loop — gas optimized)
    ///         2. NFT tier → recycle rate (tokens returned to all stakers)
    ///         3. Tutor: 5% → tutor. No tutor: 10% burned.
    ///         4. User receives: total - recycle - tutor/burn
    ///         5. ETH fee → ecosystem
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
    // INTERNAL: EXECUTE CLAIM (V2 — Recycle + Tutor)
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Core claim logic — V2 Recycle Model:
    ///
    ///      Recycled tokens stay in the contract and increase accRewardPerShare,
    ///      effectively redistributing them to all active stakers proportionally.
    ///
    ///      With tutor: user pays 5% to tutor (no burn).
    ///      Without tutor: user pays 10% to burn (deflationary penalty).
    ///      NFT tier determines recycle rate (60%/40%/30%/20%/0%).
    ///
    ///      Gas optimization: single loop for calculate + update debts.
    function _executeClaim(address user, address operator) internal {
        // 1. Combined loop: calculate pending + update debts (saves ~1.8K gas)
        uint256 totalReward = _calculateAndUpdateDebts(user) + savedRewards[user];
        if (totalReward == 0) revert NothingToClaim();
        savedRewards[user] = 0;

        // 2. Get NFT boost and recycle rate
        uint256 nftBoost = _getUserBestBoost(user);
        uint256 recycleRateBps = _getRecycleRateForBoost(nftBoost);

        // 3. Calculate recycle amount (returned to staker pool)
        uint256 recycleAmount = totalReward * recycleRateBps / BPS;

        // 4. Tutor or burn
        address tutor = ecosystem.tutorOf(user);
        uint256 tutorAmount;
        uint256 burnAmount;

        if (tutor != address(0)) {
            // With tutor: 5% to tutor, 0% burned
            tutorAmount = totalReward * TUTOR_BPS / BPS;
        } else {
            // Without tutor: 10% burned (deflationary penalty)
            burnAmount = totalReward * NO_TUTOR_BURN_BPS / BPS;
        }

        // 5. User receives remainder
        uint256 userReward = totalReward - recycleAmount - tutorAmount - burnAmount;

        // 6. Execute: burn, recycle, transfer
        if (burnAmount > 0) {
            bkcToken.burn(burnAmount);
            totalBurnedOnClaim += burnAmount;
        }

        if (recycleAmount > 0 && totalPStake > 0) {
            // Recycle: increase accRewardPerShare (tokens stay in contract)
            accRewardPerShare += recycleAmount * PRECISION / totalPStake;
            totalRewardsDistributed += recycleAmount;
            totalRecycledOnClaim += recycleAmount;
        }

        if (userReward > 0) {
            bkcToken.transfer(user, userReward);
        }

        if (tutorAmount > 0) {
            bkcToken.transfer(tutor, tutorAmount);
            totalTutorPayments += tutorAmount;
        }

        emit RewardsClaimed(
            user, totalReward, recycleAmount, burnAmount,
            tutorAmount, userReward, nftBoost, tutor, operator
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

    /// @notice Total raw pending rewards for a user (before recycle/tutor/burn)
    function pendingRewards(address user) external view override returns (uint256) {
        return _calculateAllPending(user) + savedRewards[user];
    }

    /// @notice Preview exactly what a claim would produce right now.
    ///         Matches the frontend's previewClaim display.
    function previewClaim(address user) external view returns (
        uint256 totalRewards,
        uint256 recycleAmount,
        uint256 burnAmount,
        uint256 tutorCut,
        uint256 userReceives,
        uint256 recycleRateBps,
        uint256 nftBoost
    ) {
        totalRewards = _calculateAllPending(user) + savedRewards[user];
        if (totalRewards == 0) return (0, 0, 0, 0, 0, 0, 0);

        nftBoost = _getUserBestBoost(user);
        recycleRateBps = _getRecycleRateForBoost(nftBoost);
        recycleAmount = totalRewards * recycleRateBps / BPS;

        address tutor = ecosystem.tutorOf(user);
        if (tutor != address(0)) {
            tutorCut = totalRewards * TUTOR_BPS / BPS;
        } else {
            burnAmount = totalRewards * NO_TUTOR_BURN_BPS / BPS;
        }

        userReceives = totalRewards - recycleAmount - tutorCut - burnAmount;
    }

    /// @notice Preview exactly what a force unstake would produce.
    function previewForceUnstake(address user, uint256 index) external view returns (
        uint256 stakedAmount,
        uint256 totalPenalty,
        uint256 recycleAmount,
        uint256 burnAmount,
        uint256 tutorCut,
        uint256 userReceives,
        uint256 penaltyRateBps,
        uint256 nftBoost,
        uint256 ethFeeRequired
    ) {
        if (index >= _delegations[user].length) revert InvalidIndex();
        Delegation memory d = _delegations[user][index];
        stakedAmount = d.amount;
        ethFeeRequired = forceUnstakeEthFee;

        nftBoost = _getUserBestBoost(user);
        penaltyRateBps = _getRecycleRateForBoost(nftBoost);
        totalPenalty = stakedAmount * penaltyRateBps / BPS;

        if (totalPenalty > 0) {
            address tutor = ecosystem.tutorOf(user);
            if (tutor != address(0)) {
                tutorCut = totalPenalty * TUTOR_PENALTY_BPS / BPS;
            } else {
                burnAmount = totalPenalty * NO_TUTOR_BURN_PENALTY_BPS / BPS;
            }
            recycleAmount = totalPenalty - tutorCut - burnAmount;
        }

        userReceives = stakedAmount - totalPenalty;
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
    // VIEWS: NFT BOOST & RECYCLE RATE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get the best NFT boost for a user (owned or rented)
    ///         Returns 0 if no boost contract is set or user has no NFTs
    function getUserBestBoost(address user) external view returns (uint256) {
        return _getUserBestBoost(user);
    }

    /// @notice Map a boost value to its corresponding recycle rate
    /// @param boostBps Boost in basis points (0, 1000, 2500, 4000, 5000)
    /// @return recycleRateBps Recycle rate in basis points
    function getRecycleRateForBoost(uint256 boostBps) external pure returns (uint256) {
        return _getRecycleRateForBoost(boostBps);
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
        uint256 _totalRecycledOnClaim,
        uint256 _totalForceUnstakePenalties,
        uint256 _totalTutorPayments,
        uint256 _totalEthFeesCollected,
        uint256 _accRewardPerShare
    ) {
        return (
            totalPStake,
            totalBkcDelegated,
            totalRewardsDistributed,
            totalBurnedOnClaim,
            totalRecycledOnClaim,
            totalForceUnstakePenalties,
            totalTutorPayments,
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
        uint256 _recycleRateBps
    ) {
        _userTotalPStake = userTotalPStake[user];
        _delegationCount = _delegations[user].length;
        _savedRewards = savedRewards[user];
        _totalPending = _calculateAllPending(user) + _savedRewards;
        _nftBoost = _getUserBestBoost(user);
        _recycleRateBps = _getRecycleRateForBoost(_nftBoost);
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

    /// @dev Combined: calculate pending + update debts in single loop (gas optimization)
    ///      Saves ~1.8K gas per claim vs separate calculate + update loops.
    function _calculateAndUpdateDebts(address user) internal returns (uint256 total) {
        Delegation[] storage dels = _delegations[user];
        for (uint256 i; i < dels.length; ++i) {
            uint256 accumulated = uint256(dels[i].pStake) * accRewardPerShare / PRECISION;
            total += accumulated - dels[i].rewardDebt;
            dels[i].rewardDebt = accumulated;
        }
    }

    /// @dev View-only: sum pending rewards (for pendingRewards/previewClaim views)
    function _calculateAllPending(address user) internal view returns (uint256 total) {
        Delegation[] storage dels = _delegations[user];
        for (uint256 i; i < dels.length; ++i) {
            uint256 accumulated = uint256(dels[i].pStake) * accRewardPerShare / PRECISION;
            total += accumulated - dels[i].rewardDebt;
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

    /// @dev Map boost value to recycle rate. Uses tiered brackets.
    function _getRecycleRateForBoost(uint256 boostBps) internal pure returns (uint256) {
        if (boostBps >= BOOST_DIAMOND) return RECYCLE_RATE_DIAMOND; // 0%
        if (boostBps >= BOOST_GOLD)    return RECYCLE_RATE_GOLD;    // 20%
        if (boostBps >= BOOST_SILVER)  return RECYCLE_RATE_SILVER;  // 30%
        if (boostBps >= BOOST_BRONZE)  return RECYCLE_RATE_BRONZE;  // 40%
        return RECYCLE_RATE_NO_NFT;                                  // 60%
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
