// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// AIRDROP VESTING — IMMUTABLE
// ============================================================================
//
// Manages 14M BKC airdrop distribution with dual release mechanism.
//
// Option A — Instant Release (auto-stake):
//   User calls claimAndStake() → 100% of allocation is immediately delegated
//   to StakingPool with a 180-day lock. User gets full allocation working
//   for them from day 1, earning staking rewards. After 6 months they can
//   unstake at will.
//
// Option B — Vested Release (no stake):
//   User calls claimVested() → 10% unlocked per month over 10 months.
//   User calls withdrawVested() to pull available tokens anytime.
//   First 10% available immediately, next 10% after 30 days, etc.
//
// Admin Setup:
//   1. Deploy AirdropVesting
//   2. Transfer 14M BKC to this contract
//   3. Call setAllocations() with Merkle root or direct allocations
//   4. Users claim via frontend
//
// Security:
//   - Each user can claim only once
//   - Allocation set by deployer (from off-chain airdrop calculation)
//   - StakingPool.delegateFor() used for auto-stake option
//   - No admin withdrawal of user funds after allocation is set
//
// No pause. Fully permissionless after setup.
//
// ============================================================================

contract AirdropVesting is IAirdropVesting {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    uint256 public constant VESTING_MONTHS      = 10;
    uint256 public constant MONTH_DURATION      = 30 days;
    uint256 public constant STAKE_LOCK_DAYS     = 180;   // 6 months
    uint256 public constant VESTING_PERCENT_BPS = 1000;  // 10% per month

    uint256 private constant BPS = 10_000;

    bytes32 public constant MODULE_ID       = keccak256("AIRDROP");
    bytes32 public constant ACTION_CLAIM    = keccak256("AIRDROP_CLAIM");

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;
    IBKCToken           public immutable bkcToken;
    IStakingPool        public immutable stakingPool;
    address             public immutable deployer;

    // ════════════════════════════════════════════════════════════════════════
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    struct Allocation {
        uint128 totalAmount;     // Total BKC allocated
        bool    claimed;         // Whether user has chosen an option
        bool    stakedOption;    // true = Option A (auto-stake), false = Option B (vested)
        uint64  claimTimestamp;  // When the user claimed (for vesting schedule)
        uint128 vestedWithdrawn; // How much vested BKC already withdrawn (Option B)
    }

    mapping(address => Allocation) public allocations;

    /// @notice Total BKC allocated across all users
    uint256 public totalAllocated;

    /// @notice Total BKC claimed (staked or vesting initiated)
    uint256 public totalClaimed;

    /// @notice Total BKC staked via Option A
    uint256 public totalStaked;

    /// @notice Total BKC withdrawn via Option B vesting
    uint256 public totalVestedWithdrawn;

    /// @notice Whether allocations are finalized (no more changes)
    bool public allocationFinalized;

    /// @notice Count of users who claimed
    uint256 public claimCount;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event AllocationSet(address indexed beneficiary, uint256 amount);
    event AllocationFinalized(uint256 totalAllocated, uint256 beneficiaryCount);
    event ClaimedAndStaked(
        address indexed beneficiary, uint256 amount, uint256 lockDays
    );
    event ClaimedVested(
        address indexed beneficiary, uint256 totalAmount, uint256 firstRelease
    );
    event VestedWithdrawn(
        address indexed beneficiary, uint256 amount,
        uint256 totalWithdrawn, uint256 remaining
    );

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error NotAuthorized();
    error AlreadyClaimed();
    error NoAllocation();
    error NotVested();
    error NothingToWithdraw();
    error AlreadyFinalized();
    error NotFinalized();
    error ZeroAmount();
    error ZeroAddress();
    error InsufficientFee();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(
        address _ecosystem,
        address _bkcToken,
        address _stakingPool
    ) {
        ecosystem   = IBackchainEcosystem(_ecosystem);
        bkcToken    = IBKCToken(_bkcToken);
        stakingPool = IStakingPool(_stakingPool);
        deployer    = msg.sender;
    }

    // ════════════════════════════════════════════════════════════════════════
    // SETUP (deployer only)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Set allocations for multiple beneficiaries. Deployer only, before finalize.
    function setAllocations(
        address[] calldata beneficiaries,
        uint256[] calldata amounts
    ) external {
        if (msg.sender != deployer) revert NotAuthorized();
        if (allocationFinalized) revert AlreadyFinalized();
        if (beneficiaries.length != amounts.length) revert ZeroAmount();

        for (uint256 i; i < beneficiaries.length;) {
            if (beneficiaries[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();

            // Remove old allocation from total if re-setting
            uint256 oldAmount = allocations[beneficiaries[i]].totalAmount;
            if (oldAmount > 0) {
                totalAllocated -= oldAmount;
            }

            allocations[beneficiaries[i]].totalAmount = uint128(amounts[i]);
            totalAllocated += amounts[i];

            emit AllocationSet(beneficiaries[i], amounts[i]);
            unchecked { ++i; }
        }
    }

    /// @notice Finalize allocations. No more changes after this.
    function finalizeAllocations() external {
        if (msg.sender != deployer) revert NotAuthorized();
        if (allocationFinalized) revert AlreadyFinalized();
        allocationFinalized = true;
        emit AllocationFinalized(totalAllocated, claimCount);
    }

    // ════════════════════════════════════════════════════════════════════════
    // OPTION A — CLAIM & STAKE (instant full release)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Claim full airdrop allocation and auto-stake for 6 months.
    ///         100% of tokens are delegated to StakingPool with 180-day lock.
    ///         User starts earning staking rewards immediately.
    ///
    /// @param operator Frontend operator (for ecosystem fee on delegate)
    function claimAndStake(address operator) external payable override {
        if (!allocationFinalized) revert NotFinalized();
        Allocation storage a = allocations[msg.sender];
        if (a.totalAmount == 0) revert NoAllocation();
        if (a.claimed) revert AlreadyClaimed();

        uint256 amount = a.totalAmount;

        // Mark claimed
        a.claimed = true;
        a.stakedOption = true;
        a.claimTimestamp = uint64(block.timestamp);

        totalClaimed += amount;
        totalStaked += amount;
        claimCount++;

        // Approve StakingPool to pull BKC
        bkcToken.approve(address(stakingPool), amount);

        // Delegate on behalf of user (StakingPool.delegateFor)
        stakingPool.delegateFor(msg.sender, amount, STAKE_LOCK_DAYS);

        // Optional ETH fee
        if (msg.value > 0) {
            ecosystem.collectFee{value: msg.value}(
                msg.sender, operator, address(0), MODULE_ID, 0
            );
        }

        emit ClaimedAndStaked(msg.sender, amount, STAKE_LOCK_DAYS);
    }

    // ════════════════════════════════════════════════════════════════════════
    // OPTION B — CLAIM VESTED (10% per month)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Claim airdrop with vested release. 10% per month over 10 months.
    ///         First 10% available immediately after calling this.
    function claimVested() external override {
        if (!allocationFinalized) revert NotFinalized();
        Allocation storage a = allocations[msg.sender];
        if (a.totalAmount == 0) revert NoAllocation();
        if (a.claimed) revert AlreadyClaimed();

        uint256 amount = a.totalAmount;

        // Mark claimed
        a.claimed = true;
        a.stakedOption = false;
        a.claimTimestamp = uint64(block.timestamp);

        totalClaimed += amount;
        claimCount++;

        // Transfer first 10% immediately
        uint256 firstRelease = amount * VESTING_PERCENT_BPS / BPS;
        if (firstRelease > 0) {
            a.vestedWithdrawn = uint128(firstRelease);
            totalVestedWithdrawn += firstRelease;
            bkcToken.transfer(msg.sender, firstRelease);
        }

        emit ClaimedVested(msg.sender, amount, firstRelease);
    }

    /// @notice Withdraw available vested tokens (Option B only).
    ///         Call anytime — will release all unlocked-but-not-yet-withdrawn BKC.
    function withdrawVested() external override {
        Allocation storage a = allocations[msg.sender];
        if (!a.claimed) revert NoAllocation();
        if (a.stakedOption) revert NotVested();

        uint256 available = _calculateVestedAmount(msg.sender);
        uint256 withdrawn = a.vestedWithdrawn;
        uint256 toWithdraw = available > withdrawn ? available - withdrawn : 0;

        if (toWithdraw == 0) revert NothingToWithdraw();

        a.vestedWithdrawn = uint128(available);
        totalVestedWithdrawn += toWithdraw;

        bkcToken.transfer(msg.sender, toWithdraw);

        uint256 remaining = uint256(a.totalAmount) - available;
        emit VestedWithdrawn(msg.sender, toWithdraw, available, remaining);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get claim info for a beneficiary
    function getClaimInfo(address beneficiary) external view override returns (
        uint256 totalAllocation,
        bool claimed,
        bool stakedOption,
        uint256 vestedWithdrawn_,
        uint256 withdrawableNow
    ) {
        Allocation memory a = allocations[beneficiary];
        totalAllocation = a.totalAmount;
        claimed = a.claimed;
        stakedOption = a.stakedOption;
        vestedWithdrawn_ = a.vestedWithdrawn;

        if (claimed && !stakedOption) {
            uint256 vested = _calculateVestedAmount(beneficiary);
            withdrawableNow = vested > a.vestedWithdrawn ? vested - a.vestedWithdrawn : 0;
        }
    }

    /// @notice Get vesting schedule info
    function getVestingSchedule(address beneficiary) external view returns (
        uint256 totalAmount,
        uint256 vestedSoFar,
        uint256 withdrawn,
        uint256 withdrawableNow,
        uint256 monthsElapsed,
        uint256 nextReleaseTimestamp
    ) {
        Allocation memory a = allocations[beneficiary];
        totalAmount = a.totalAmount;
        withdrawn = a.vestedWithdrawn;

        if (a.claimed && !a.stakedOption) {
            uint256 elapsed = (block.timestamp - a.claimTimestamp) / MONTH_DURATION;
            monthsElapsed = elapsed > VESTING_MONTHS ? VESTING_MONTHS : elapsed;

            // +1 because first month is immediately available
            uint256 monthsVested = monthsElapsed + 1;
            if (monthsVested > VESTING_MONTHS) monthsVested = VESTING_MONTHS;

            vestedSoFar = uint256(a.totalAmount) * monthsVested * VESTING_PERCENT_BPS / BPS;
            if (vestedSoFar > a.totalAmount) vestedSoFar = a.totalAmount;

            withdrawableNow = vestedSoFar > a.vestedWithdrawn ? vestedSoFar - a.vestedWithdrawn : 0;

            if (monthsVested < VESTING_MONTHS) {
                nextReleaseTimestamp = a.claimTimestamp + (monthsElapsed + 1) * MONTH_DURATION;
            }
        }
    }

    /// @notice Global airdrop stats
    function getAirdropStats() external view returns (
        uint256 _totalAllocated,
        uint256 _totalClaimed,
        uint256 _totalStaked,
        uint256 _totalVestedWithdrawn,
        uint256 _claimCount,
        bool _finalized
    ) {
        return (
            totalAllocated, totalClaimed, totalStaked,
            totalVestedWithdrawn, claimCount, allocationFinalized
        );
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Calculate total vested BKC for a beneficiary based on time elapsed
    function _calculateVestedAmount(address beneficiary) internal view returns (uint256) {
        Allocation memory a = allocations[beneficiary];
        if (!a.claimed || a.stakedOption) return 0;

        uint256 elapsed = (block.timestamp - a.claimTimestamp) / MONTH_DURATION;

        // +1 because first 10% is available immediately
        uint256 monthsVested = elapsed + 1;
        if (monthsVested > VESTING_MONTHS) monthsVested = VESTING_MONTHS;

        uint256 vested = uint256(a.totalAmount) * monthsVested * VESTING_PERCENT_BPS / BPS;
        if (vested > a.totalAmount) return a.totalAmount;
        return vested;
    }
}
