// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

/**
 * @title DelegationManager
 * @author Backchain Protocol
 * @notice Manages staking, time-locks, and reward distribution for the Backcoin ecosystem
 * @dev Implements weighted staking with:
 *      - Flexible lock periods (1 day to 10 years)
 *      - Proportional reward distribution based on stake weight
 *      - NFT-based fee discounts via RewardBoosterNFT
 *      - Proof-of-Purchase mining integration
 *
 *      Stake Weight Formula:
 *      pStake = (amount × lockDays) / 1e18
 *
 *      Reward Distribution:
 *      userReward = (userPStake × accRewardPerStake) / 1e18 - rewardDebt
 *
 * @custom:security-contact security@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract DelegationManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IDelegationManager
{
    using SafeERC20Upgradeable for BKCToken;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Minimum lock duration (1 day)
    uint256 public constant MIN_LOCK_DURATION = 1 days;

    /// @notice Maximum lock duration (10 years)
    uint256 public constant MAX_LOCK_DURATION = 3650 days;

    /// @notice Precision multiplier for reward calculations
    uint256 private constant PRECISION = 1e18;

    /// @notice Basis points denominator (100% = 10000)
    uint256 private constant BIPS_DENOMINATOR = 10_000;

    /// @notice Fee key for delegation entry fee
    bytes32 public constant DELEGATION_FEE_KEY = keccak256("DELEGATION_FEE_BIPS");

    /// @notice Fee key for normal unstake fee
    bytes32 public constant UNSTAKE_FEE_KEY = keccak256("UNSTAKE_FEE_BIPS");

    /// @notice Fee key for early unstake penalty
    bytes32 public constant FORCE_UNSTAKE_PENALTY_KEY = keccak256("FORCE_UNSTAKE_PENALTY_BIPS");

    /// @notice Fee key for reward claim fee
    bytes32 public constant CLAIM_REWARD_FEE_KEY = keccak256("CLAIM_REWARD_FEE_BIPS");

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Reference to the ecosystem hub
    IEcosystemManager public ecosystemManager;

    /// @notice BKC token contract
    BKCToken public bkcToken;

    /// @notice Total weighted stake across all users
    uint256 public totalNetworkPStake;

    /// @notice Accumulated reward per stake unit (scaled by PRECISION)
    uint256 public accRewardPerStake;

    /// @notice Individual delegation record
    struct Delegation {
        uint256 amount;       // Staked amount (after entry fee)
        uint64 unlockTime;    // Timestamp when delegation can be withdrawn
        uint64 lockDuration;  // Original lock duration in seconds
    }

    /// @notice User address => Array of delegations
    mapping(address => Delegation[]) public userDelegations;

    /// @notice User address => Total weighted stake
    mapping(address => uint256) public userTotalPStake;

    /// @notice User address => Reward debt (for accurate reward calculation)
    mapping(address => uint256) public rewardDebt;

    /// @notice User address => Accumulated unclaimed rewards
    mapping(address => uint256) public savedRewards;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when tokens are unstaked
    event Unstaked(
        address indexed user,
        uint256 indexed delegationIndex,
        uint256 amountReceived,
        uint256 feePaid
    );

    /// @notice Emitted when mining rewards are deposited
    event RewardsDeposited(uint256 amount, uint256 newAccRewardPerStake);

    /// @notice Emitted when user claims rewards
    event RewardClaimed(
        address indexed user,
        uint256 amountReceived,
        uint256 feePaid
    );

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error ZeroAmount();
    error InvalidDuration();
    error InvalidIndex();
    error UnauthorizedCaller();
    error LockPeriodActive();
    error LockPeriodExpired();
    error TokenNotConfigured();
    error NoRewardsToClaim();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the DelegationManager contract
     * @param _owner Contract owner address
     * @param _ecosystemManager Address of the ecosystem hub
     */
    function initialize(
        address _owner,
        address _ecosystemManager
    ) external initializer {
        if (_owner == address(0)) revert ZeroAddress();
        if (_ecosystemManager == address(0)) revert ZeroAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _transferOwnership(_owner);

        ecosystemManager = IEcosystemManager(_ecosystemManager);

        address bkcAddress = ecosystemManager.getBKCTokenAddress();
        if (bkcAddress == address(0)) revert TokenNotConfigured();

        bkcToken = BKCToken(bkcAddress);
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         EXTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @notice Deposits mining rewards into the staking pool
     * @dev Only callable by MiningManager
     * @param _amount Amount of BKC to distribute
     */
    function depositMiningRewards(uint256 _amount) external override {
        if (msg.sender != ecosystemManager.getMiningManagerAddress()) {
            revert UnauthorizedCaller();
        }

        if (_amount > 0 && totalNetworkPStake > 0) {
            accRewardPerStake += (_amount * PRECISION) / totalNetworkPStake;
            emit RewardsDeposited(_amount, accRewardPerStake);
        }
    }

    /**
     * @notice Stakes tokens with a time-lock
     * @dev Applies NFT-based discount on entry fee
     * @param _amount Total amount to stake (fee deducted from this)
     * @param _lockDuration Lock period in seconds (min 1 day, max 10 years)
     * @param _boosterTokenId NFT token ID for fee discount (0 = no discount)
     */
    function delegate(
        uint256 _amount,
        uint256 _lockDuration,
        uint256 _boosterTokenId
    ) external nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        if (_lockDuration < MIN_LOCK_DURATION || _lockDuration > MAX_LOCK_DURATION) {
            revert InvalidDuration();
        }

        // Update pending rewards before modifying stake
        _updateUserRewards(msg.sender);

        // Calculate fee with potential NFT discount
        uint256 baseFeeBips = ecosystemManager.getFee(DELEGATION_FEE_KEY);
        uint256 finalFeeBips = _applyBoosterDiscount(baseFeeBips, _boosterTokenId);

        uint256 feeAmount = (_amount * finalFeeBips) / BIPS_DENOMINATOR;
        uint256 netAmount = _amount - feeAmount;

        if (netAmount == 0) revert ZeroAmount();

        // Transfer tokens from user
        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Process fee
        if (feeAmount > 0) {
            _sendFeeToMining(DELEGATION_FEE_KEY, feeAmount);
        }

        // Create delegation record
        uint256 delegationIndex = userDelegations[msg.sender].length;
        userDelegations[msg.sender].push(Delegation({
            amount: netAmount,
            unlockTime: uint64(block.timestamp + _lockDuration),
            lockDuration: uint64(_lockDuration)
        }));

        // Calculate and update stake weight
        uint256 pStake = _calculatePStake(netAmount, _lockDuration);
        totalNetworkPStake += pStake;
        userTotalPStake[msg.sender] += pStake;

        // Reset reward debt
        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / PRECISION;

        emit Delegated(msg.sender, delegationIndex, netAmount, pStake, feeAmount);
    }

    /**
     * @notice Withdraws staked tokens after lock period expires
     * @dev Applies NFT-based discount on exit fee
     * @param _delegationIndex Index of the delegation to withdraw
     * @param _boosterTokenId NFT token ID for fee discount (0 = no discount)
     */
    function unstake(
        uint256 _delegationIndex,
        uint256 _boosterTokenId
    ) external nonReentrant {
        Delegation[] storage delegations = userDelegations[msg.sender];
        if (_delegationIndex >= delegations.length) revert InvalidIndex();

        Delegation storage d = delegations[_delegationIndex];
        if (block.timestamp < d.unlockTime) revert LockPeriodActive();

        // Update pending rewards
        _updateUserRewards(msg.sender);

        uint256 amount = d.amount;
        uint256 pStakeToRemove = _calculatePStake(amount, d.lockDuration);

        // Calculate fee with potential NFT discount
        uint256 baseFeeBips = ecosystemManager.getFee(UNSTAKE_FEE_KEY);
        uint256 finalFeeBips = _applyBoosterDiscount(baseFeeBips, _boosterTokenId);

        uint256 feeAmount = (amount * finalFeeBips) / BIPS_DENOMINATOR;
        uint256 amountToUser = amount - feeAmount;

        // Update state
        totalNetworkPStake -= pStakeToRemove;
        userTotalPStake[msg.sender] -= pStakeToRemove;

        // Process fee
        if (feeAmount > 0) {
            _sendFeeToMining(UNSTAKE_FEE_KEY, feeAmount);
        }

        // Remove delegation (swap and pop)
        _removeDelegation(delegations, _delegationIndex);

        // Transfer tokens to user
        bkcToken.safeTransfer(msg.sender, amountToUser);

        // Update reward debt
        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / PRECISION;

        emit Unstaked(msg.sender, _delegationIndex, amountToUser, feeAmount);
    }

    /**
     * @notice Withdraws staked tokens before lock period expires (with penalty)
     * @dev Applies NFT-based discount on penalty
     * @param _delegationIndex Index of the delegation to withdraw
     * @param _boosterTokenId NFT token ID for penalty discount (0 = no discount)
     */
    function forceUnstake(
        uint256 _delegationIndex,
        uint256 _boosterTokenId
    ) external nonReentrant {
        Delegation[] storage delegations = userDelegations[msg.sender];
        if (_delegationIndex >= delegations.length) revert InvalidIndex();

        Delegation storage d = delegations[_delegationIndex];
        if (block.timestamp >= d.unlockTime) revert LockPeriodExpired();

        // Update pending rewards
        _updateUserRewards(msg.sender);

        uint256 amount = d.amount;
        uint256 pStakeToRemove = _calculatePStake(amount, d.lockDuration);

        // Calculate penalty with potential NFT discount
        uint256 basePenaltyBips = ecosystemManager.getFee(FORCE_UNSTAKE_PENALTY_KEY);
        uint256 finalPenaltyBips = _applyBoosterDiscount(basePenaltyBips, _boosterTokenId);

        uint256 penaltyAmount = (amount * finalPenaltyBips) / BIPS_DENOMINATOR;
        uint256 amountToUser = amount - penaltyAmount;

        // Update state
        totalNetworkPStake -= pStakeToRemove;
        userTotalPStake[msg.sender] -= pStakeToRemove;

        // Process penalty
        if (penaltyAmount > 0) {
            _sendFeeToMining(FORCE_UNSTAKE_PENALTY_KEY, penaltyAmount);
        }

        // Remove delegation
        _removeDelegation(delegations, _delegationIndex);

        // Transfer tokens to user
        bkcToken.safeTransfer(msg.sender, amountToUser);

        // Update reward debt
        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / PRECISION;

        emit Unstaked(msg.sender, _delegationIndex, amountToUser, penaltyAmount);
    }

    /**
     * @notice Claims accumulated staking rewards
     * @dev Applies NFT-based discount on claim fee
     * @param _boosterTokenId NFT token ID for fee discount (0 = no discount)
     */
    function claimReward(uint256 _boosterTokenId) external nonReentrant {
        // Update pending rewards
        _updateUserRewards(msg.sender);

        uint256 totalToClaim = savedRewards[msg.sender];
        if (totalToClaim == 0) revert NoRewardsToClaim();

        // Clear saved rewards (reentrancy protection)
        savedRewards[msg.sender] = 0;
        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / PRECISION;

        // Calculate fee with potential NFT discount
        uint256 baseFeeBips = ecosystemManager.getFee(CLAIM_REWARD_FEE_KEY);
        uint256 finalFeeBips = _applyBoosterDiscount(baseFeeBips, _boosterTokenId);

        uint256 feeAmount = (totalToClaim * finalFeeBips) / BIPS_DENOMINATOR;
        uint256 amountToUser = totalToClaim - feeAmount;

        // Process fee
        if (feeAmount > 0) {
            _sendFeeToMining(CLAIM_REWARD_FEE_KEY, feeAmount);
        }

        // Transfer rewards to user
        if (amountToUser > 0) {
            bkcToken.safeTransfer(msg.sender, amountToUser);
        }

        emit RewardClaimed(msg.sender, amountToUser, feeAmount);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns pending rewards for a user
     * @param _user User address
     * @return Total claimable rewards
     */
    function pendingRewards(address _user) public view returns (uint256) {
        uint256 pending = 0;

        if (userTotalPStake[_user] > 0) {
            pending = (userTotalPStake[_user] * accRewardPerStake / PRECISION) - rewardDebt[_user];
        }

        return pending + savedRewards[_user];
    }

    /**
     * @notice Returns all delegations for a user
     * @param _user User address
     * @return Array of delegation records
     */
    function getDelegationsOf(address _user) external view returns (Delegation[] memory) {
        return userDelegations[_user];
    }

    /**
     * @notice Returns the number of active delegations for a user
     * @param _user User address
     * @return Number of delegations
     */
    function getDelegationCount(address _user) external view returns (uint256) {
        return userDelegations[_user].length;
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @dev Updates user's pending rewards to savedRewards
     */
    function _updateUserRewards(address _user) internal {
        if (userTotalPStake[_user] > 0) {
            uint256 pending = (userTotalPStake[_user] * accRewardPerStake / PRECISION) - rewardDebt[_user];
            if (pending > 0) {
                savedRewards[_user] += pending;
            }
        }
    }

    /**
     * @dev Sends fee to MiningManager for processing
     */
    function _sendFeeToMining(bytes32 _serviceKey, uint256 _feeAmount) internal {
        address miningManager = ecosystemManager.getMiningManagerAddress();
        if (miningManager == address(0)) revert ZeroAddress();

        bkcToken.safeTransfer(miningManager, _feeAmount);
        IMiningManager(miningManager).performPurchaseMining(_serviceKey, _feeAmount);
    }

    /**
     * @dev Applies proportional NFT booster discount to a fee
     *
     *      IMPORTANT: This applies a PROPORTIONAL discount, not direct subtraction.
     *
     *      Example with Crystal NFT (10% discount = 1000 bips):
     *      - Base Fee: 100 bips (1%)
     *      - Discount: 10% OF the fee (not 10% absolute)
     *      - Calculation: 100 - (100 × 1000 / 10000) = 100 - 10 = 90 bips
     *      - Result: 0.9% fee (10% reduction from 1%)
     *
     *      Example with Diamond NFT (70% discount = 7000 bips):
     *      - Base Fee: 100 bips (1%)
     *      - Discount: 70% OF the fee
     *      - Calculation: 100 - (100 × 7000 / 10000) = 100 - 70 = 30 bips
     *      - Result: 0.3% fee (70% reduction from 1%)
     *
     * @param _baseFeeBips Original fee in basis points
     * @param _boosterTokenId NFT token ID (0 = no discount)
     * @return Discounted fee in basis points
     */
    function _applyBoosterDiscount(
        uint256 _baseFeeBips,
        uint256 _boosterTokenId
    ) internal view returns (uint256) {
        // No fee = no discount needed
        if (_baseFeeBips == 0) return 0;

        // No booster = full fee
        if (_boosterTokenId == 0) return _baseFeeBips;

        address boosterAddress = ecosystemManager.getBoosterAddress();
        if (boosterAddress == address(0)) return _baseFeeBips;

        IRewardBoosterNFT booster = IRewardBoosterNFT(boosterAddress);

        // Try/catch prevents revert if NFT doesn't exist
        try booster.ownerOf(_boosterTokenId) returns (address owner) {
            // Only apply discount if caller owns the NFT
            if (owner == msg.sender) {
                uint256 boostBips = booster.boostBips(_boosterTokenId);
                uint256 discountBips = ecosystemManager.getBoosterDiscount(boostBips);

                if (discountBips > 0) {
                    // Calculate PROPORTIONAL discount
                    // discountAmount = baseFeeBips × discountBips / 10000
                    uint256 discountAmount = (_baseFeeBips * discountBips) / BIPS_DENOMINATOR;

                    // Return reduced fee (minimum 0)
                    return _baseFeeBips > discountAmount ? _baseFeeBips - discountAmount : 0;
                }
            }
        } catch {}

        return _baseFeeBips;
    }

    /**
     * @dev Calculates stake weight based on amount and lock duration
     *      pStake = (amount × lockDays) / 1e18
     */
    function _calculatePStake(
        uint256 _amount,
        uint256 _lockDuration
    ) internal pure returns (uint256) {
        return (_amount * (_lockDuration / 1 days)) / PRECISION;
    }

    /**
     * @dev Removes delegation using swap-and-pop for gas efficiency
     */
    function _removeDelegation(
        Delegation[] storage _delegations,
        uint256 _index
    ) internal {
        uint256 lastIndex = _delegations.length - 1;

        if (_index != lastIndex) {
            _delegations[_index] = _delegations[lastIndex];
        }

        _delegations.pop();
    }
}
