// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/*
 * ============================================================================
 *
 *                             BACKCHAIN PROTOCOL
 *
 *                    ██╗   ██╗███╗   ██╗███████╗████████╗ ██████╗ ██████╗
 *                    ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
 *                    ██║   ██║██╔██╗ ██║███████╗   ██║   ██║   ██║██████╔╝
 *                    ██║   ██║██║╚██╗██║╚════██║   ██║   ██║   ██║██╔═══╝
 *                    ╚██████╔╝██║ ╚████║███████║   ██║   ╚██████╔╝██║
 *                     ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
 *
 *                    P E R M I S S I O N L E S S   .   I M M U T A B L E
 *
 * ============================================================================
 *  Contract    : DelegationManager
 *  Version     : 6.0.0
 *  Network     : Arbitrum
 *  License     : MIT
 *  Solidity    : 0.8.28
 * ============================================================================
 *
 *  100% DECENTRALIZED SYSTEM
 *
 *  This contract is part of a fully decentralized, permissionless,
 *  and UNSTOPPABLE protocol.
 *
 *  - NO CENTRAL AUTHORITY    : Code is law
 *  - NO PERMISSION NEEDED    : Anyone can become an Operator
 *  - NO SINGLE POINT OF FAILURE : Runs on Arbitrum blockchain
 *  - CENSORSHIP RESISTANT    : Cannot be stopped or controlled
 *
 * ============================================================================
 *
 *  BECOME AN OPERATOR
 *
 *  Anyone in the world can:
 *
 *  1. Build their own frontend, app, bot, or tool for Backchain
 *  2. Pass their wallet address as the "operator" parameter
 *  3. Earn a percentage of ALL fees (BKC + ETH) generated
 *
 *  No registration. No approval. No KYC. Just build and earn.
 *
 * ============================================================================
 *
 *  PURPOSE
 *
 *  Manages staking, time-locks, and reward distribution for the Backcoin
 *  ecosystem. Implements weighted staking with:
 *
 *  - Flexible lock periods (1 day to 10 years)
 *  - Proportional reward distribution based on stake weight
 *  - NFT-based burn reduction on reward claims (OWNED or RENTED)
 *  - Proof-of-Purchase mining integration
 *
 *  Stake Weight Formula:
 *  pStake = (amount × lockDays) / 1e18
 *
 *  Reward Distribution:
 *  userReward = (userPStake × accRewardPerStake) / 1e18 - rewardDebt
 *
 * ============================================================================
 *
 *  NFT BURN REDUCTION SYSTEM (V6)
 *
 *  When claiming rewards, a percentage is BURNED based on NFT ownership.
 *  The system automatically checks BOTH owned AND rented NFTs.
 *
 *  ┌──────────┬────────────┬───────────┬─────────────┐
 *  │ Tier     │ Boost Bips │ Burn Rate │ User Gets   │
 *  ├──────────┼────────────┼───────────┼─────────────┤
 *  │ No NFT   │ 0          │ 50%       │ 50%         │
 *  │ Bronze   │ 1000       │ 40%       │ 60%         │
 *  │ Silver   │ 2500       │ 25%       │ 75%         │
 *  │ Gold     │ 4000       │ 10%       │ 90%         │
 *  │ Diamond  │ 5000       │ 0%        │ 100%        │
 *  └──────────┴────────────┴───────────┴─────────────┘
 *
 *  IMPORTANT: Service fees (delegate, unstake, etc) are EQUAL for everyone.
 *             NFTs ONLY affect the burn rate when claiming rewards.
 *
 * ============================================================================
 *
 *  FEE STRUCTURE
 *
 *  ┌─────────────────┬─────────────┬────────────────────────────────────────┐
 *  │ Action          │ Fee Type    │ Destination                            │
 *  ├─────────────────┼─────────────┼────────────────────────────────────────┤
 *  │ Delegate        │ BKC (bips)  │ MiningManager → Operator/Treasury      │
 *  │ Unstake         │ BKC (bips)  │ MiningManager → Operator/Treasury      │
 *  │ Force Unstake   │ BKC (bips)  │ MiningManager → Operator/Treasury      │
 *  │ Claim Rewards   │ ETH (fixed) │ MiningManager → Operator/Treasury      │
 *  │ Claim Rewards   │ BKC (burn)  │ BURNED (reduced by NFT tier)           │
 *  └─────────────────┴─────────────┴────────────────────────────────────────┘
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";
import "./TimelockUpgradeable.sol";

contract DelegationManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IDelegationManager,
    TimelockUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    uint256 public constant MIN_LOCK_DURATION = 1 days;

    uint256 public constant MAX_LOCK_DURATION = 3650 days;

    uint256 private constant PRECISION = 1e18;

    uint256 private constant BIPS_DENOMINATOR = 10_000;

    bytes32 public constant DELEGATION_FEE_KEY = keccak256("DELEGATION_FEE_BIPS");

    bytes32 public constant UNSTAKE_FEE_KEY = keccak256("UNSTAKE_FEE_BIPS");

    bytes32 public constant FORCE_UNSTAKE_PENALTY_KEY = keccak256("FORCE_UNSTAKE_PENALTY_BIPS");

    bytes32 public constant CLAIM_REWARD_FEE_KEY = keccak256("CLAIM_REWARD_FEE_BIPS");

    // -------------------------------------------------------------------------
    //                         NFT BOOST TIERS
    // -------------------------------------------------------------------------

    uint256 public constant BOOST_BRONZE = 1000;
    uint256 public constant BOOST_SILVER = 2500;
    uint256 public constant BOOST_GOLD = 4000;
    uint256 public constant BOOST_DIAMOND = 5000;

    // -------------------------------------------------------------------------
    //                    BURN RATES (in bips) - Applied on Claim
    // -------------------------------------------------------------------------

    uint256 public constant BURN_RATE_NO_NFT = 5000;    // 50% burn
    uint256 public constant BURN_RATE_BRONZE = 4000;    // 40% burn
    uint256 public constant BURN_RATE_SILVER = 2500;    // 25% burn
    uint256 public constant BURN_RATE_GOLD = 1000;      // 10% burn
    uint256 public constant BURN_RATE_DIAMOND = 0;      // 0% burn

    // =========================================================================
    //                              STATE
    // =========================================================================

    IEcosystemManager public ecosystemManager;

    BKCToken public bkcToken;

    uint256 public totalNetworkPStake;

    uint256 public accRewardPerStake;

    struct Delegation {
        uint256 amount;
        uint64 unlockTime;
        uint64 lockDuration;
    }

    mapping(address => Delegation[]) public userDelegations;

    mapping(address => uint256) public userTotalPStake;

    mapping(address => uint256) public rewardDebt;

    mapping(address => uint256) public savedRewards;

    // =========================================================================
    //                          STATE V2 - Operators & ETH
    // =========================================================================

    uint256 public claimEthFee;

    uint256 public totalETHCollected;

    uint256 public totalBKCFees;

    // =========================================================================
    //                          STATE V6 - Burn Tracking
    // =========================================================================

    /// @notice Total BKC burned on claim (all time)
    uint256 public totalBurnedOnClaim;

    // =========================================================================
    //                           STORAGE GAP
    // =========================================================================

    uint256[39] private __gap;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    // NOTE: Event Delegated is inherited from IDelegationManager interface

    event Unstaked(
        address indexed user,
        uint256 indexed delegationIndex,
        uint256 amountReceived,
        uint256 feePaid,
        address operator
    );

    event RewardsDeposited(uint256 amount, uint256 newAccRewardPerStake);

    event RewardClaimed(
        address indexed user,
        uint256 amountReceived,
        uint256 burnedAmount,
        uint256 ethFeePaid,
        uint256 nftBoostUsed,
        address operator
    );

    event ClaimEthFeeUpdated(uint256 previousFee, uint256 newFee);

    event TokensBurnedOnClaim(
        address indexed user,
        uint256 burnedAmount,
        uint256 burnRateBips,
        uint256 totalBurnedAllTime
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
    error InsufficientETHFee();
    error TransferFailed();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

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

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        _checkTimelock(newImplementation);
    }

    function _requireUpgradeAccess() internal view override {
        _checkOwner();
    }

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    function setClaimEthFee(uint256 _fee) external onlyOwner {
        uint256 previousFee = claimEthFee;
        claimEthFee = _fee;
        emit ClaimEthFeeUpdated(previousFee, _fee);
    }

    // =========================================================================
    //                         EXTERNAL FUNCTIONS
    // =========================================================================

    function depositMiningRewards(uint256 _amount) external override {
        if (msg.sender != ecosystemManager.getMiningManagerAddress()) {
            revert UnauthorizedCaller();
        }

        if (_amount > 0 && totalNetworkPStake > 0) {
            accRewardPerStake += (_amount * PRECISION) / totalNetworkPStake;
            emit RewardsDeposited(_amount, accRewardPerStake);
        }
    }

    /// @notice Delegate tokens with time-lock
    /// @dev Fee is the SAME for all users (no NFT discount)
    /// @param _amount Amount of BKC to delegate
    /// @param _lockDuration Lock duration in seconds (1 day to 10 years)
    /// @param _operator Address to receive operator fees
    function delegate(
        uint256 _amount,
        uint256 _lockDuration,
        address _operator
    ) external nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        if (_lockDuration < MIN_LOCK_DURATION || _lockDuration > MAX_LOCK_DURATION) {
            revert InvalidDuration();
        }

        _updateUserRewards(msg.sender);

        uint256 feeBips = ecosystemManager.getFee(DELEGATION_FEE_KEY);
        uint256 feeAmount = (_amount * feeBips) / BIPS_DENOMINATOR;
        uint256 netAmount = _amount - feeAmount;

        if (netAmount == 0) revert ZeroAmount();

        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);

        if (feeAmount > 0) {
            _sendFeeToMining(DELEGATION_FEE_KEY, feeAmount, _operator);
        }

        uint256 delegationIndex = userDelegations[msg.sender].length;
        userDelegations[msg.sender].push(Delegation({
            amount: netAmount,
            unlockTime: uint64(block.timestamp + _lockDuration),
            lockDuration: uint64(_lockDuration)
        }));

        uint256 pStake = _calculatePStake(netAmount, _lockDuration);
        totalNetworkPStake += pStake;
        userTotalPStake[msg.sender] += pStake;

        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / PRECISION;

        emit Delegated(msg.sender, delegationIndex, netAmount, pStake, feeAmount, _operator);
    }

    /// @notice Unstake after lock period expires
    /// @dev Fee is the SAME for all users (no NFT discount)
    /// @param _delegationIndex Index of the delegation to unstake
    /// @param _operator Address to receive operator fees
    function unstake(
        uint256 _delegationIndex,
        address _operator
    ) external nonReentrant {
        Delegation[] storage delegations = userDelegations[msg.sender];
        if (_delegationIndex >= delegations.length) revert InvalidIndex();

        Delegation storage d = delegations[_delegationIndex];
        if (block.timestamp < d.unlockTime) revert LockPeriodActive();

        _updateUserRewards(msg.sender);

        uint256 amount = d.amount;
        uint256 pStakeToRemove = _calculatePStake(amount, d.lockDuration);

        uint256 feeBips = ecosystemManager.getFee(UNSTAKE_FEE_KEY);
        uint256 feeAmount = (amount * feeBips) / BIPS_DENOMINATOR;
        uint256 amountToUser = amount - feeAmount;

        totalNetworkPStake -= pStakeToRemove;
        userTotalPStake[msg.sender] -= pStakeToRemove;

        if (feeAmount > 0) {
            _sendFeeToMining(UNSTAKE_FEE_KEY, feeAmount, _operator);
        }

        _removeDelegation(delegations, _delegationIndex);

        bkcToken.safeTransfer(msg.sender, amountToUser);

        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / PRECISION;

        emit Unstaked(msg.sender, _delegationIndex, amountToUser, feeAmount, _operator);
    }

    /// @notice Force unstake before lock period (with penalty)
    /// @dev Penalty fee is the SAME for all users (no NFT discount)
    /// @param _delegationIndex Index of the delegation to force unstake
    /// @param _operator Address to receive operator fees
    function forceUnstake(
        uint256 _delegationIndex,
        address _operator
    ) external nonReentrant {
        Delegation[] storage delegations = userDelegations[msg.sender];
        if (_delegationIndex >= delegations.length) revert InvalidIndex();

        Delegation storage d = delegations[_delegationIndex];
        if (block.timestamp >= d.unlockTime) revert LockPeriodExpired();

        _updateUserRewards(msg.sender);

        uint256 amount = d.amount;
        uint256 pStakeToRemove = _calculatePStake(amount, d.lockDuration);

        uint256 penaltyBips = ecosystemManager.getFee(FORCE_UNSTAKE_PENALTY_KEY);
        uint256 penaltyAmount = (amount * penaltyBips) / BIPS_DENOMINATOR;
        uint256 amountToUser = amount - penaltyAmount;

        totalNetworkPStake -= pStakeToRemove;
        userTotalPStake[msg.sender] -= pStakeToRemove;

        if (penaltyAmount > 0) {
            _sendFeeToMining(FORCE_UNSTAKE_PENALTY_KEY, penaltyAmount, _operator);
        }

        _removeDelegation(delegations, _delegationIndex);

        bkcToken.safeTransfer(msg.sender, amountToUser);

        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / PRECISION;

        emit Unstaked(msg.sender, _delegationIndex, amountToUser, penaltyAmount, _operator);
    }

    /// @notice Claim rewards with NFT-based burn reduction
    /// @dev Automatically checks BOTH owned AND rented NFTs for best boost
    /// @param _operator Address to receive operator fees from ETH
    function claimReward(address _operator) external payable nonReentrant {
        uint256 _claimEthFee = claimEthFee;
        if (msg.value < _claimEthFee) revert InsufficientETHFee();

        _updateUserRewards(msg.sender);

        uint256 totalToClaim = savedRewards[msg.sender];
        if (totalToClaim == 0) revert NoRewardsToClaim();

        savedRewards[msg.sender] = 0;
        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / PRECISION;

        // Get best NFT boost (checks OWNED and RENTED)
        uint256 userBoost = _getUserBestBoost(msg.sender);
        uint256 burnRateBips = _getBurnRate(userBoost);

        // Calculate burn amount
        uint256 burnAmount = (totalToClaim * burnRateBips) / BIPS_DENOMINATOR;
        uint256 amountToUser = totalToClaim - burnAmount;

        // Burn tokens
        if (burnAmount > 0) {
            bkcToken.burn(burnAmount);
            
            unchecked {
                totalBurnedOnClaim += burnAmount;
            }

            emit TokensBurnedOnClaim(msg.sender, burnAmount, burnRateBips, totalBurnedOnClaim);
        }

        // Send ETH fee to mining
        if (msg.value > 0) {
            _sendETHToMining(msg.value, _operator);
        }

        // Transfer rewards to user
        if (amountToUser > 0) {
            bkcToken.safeTransfer(msg.sender, amountToUser);
        }

        emit RewardClaimed(msg.sender, amountToUser, burnAmount, msg.value, userBoost, _operator);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    function pendingRewards(address _user) public view returns (uint256) {
        uint256 pending = 0;

        if (userTotalPStake[_user] > 0) {
            pending = (userTotalPStake[_user] * accRewardPerStake / PRECISION) - rewardDebt[_user];
        }

        return pending + savedRewards[_user];
    }

    function getDelegationsOf(address _user) external view returns (Delegation[] memory) {
        return userDelegations[_user];
    }

    function getDelegationCount(address _user) external view returns (uint256) {
        return userDelegations[_user].length;
    }

    function getFeeStats() external view returns (
        uint256 ethCollected,
        uint256 bkcCollected,
        uint256 currentEthFee,
        uint256 totalBurned
    ) {
        return (totalETHCollected, totalBKCFees, claimEthFee, totalBurnedOnClaim);
    }

    /// @notice Get the user's best NFT boost (owned or rented)
    /// @param _user Address to check
    /// @return Best boost value in bips (0 if no NFT)
    function getUserBestBoost(address _user) external view returns (uint256) {
        return _getUserBestBoost(_user);
    }

    /// @notice Get the burn rate for a given boost value
    /// @param _boost Boost value in bips
    /// @return Burn rate in bips
    function getBurnRateForBoost(uint256 _boost) external pure returns (uint256) {
        return _getBurnRate(_boost);
    }

    /// @notice Preview claim amounts for a user
    /// @param _user Address to preview
    /// @return totalRewards Total pending rewards
    /// @return burnAmount Amount that will be burned
    /// @return userReceives Amount user will receive
    /// @return burnRateBips Burn rate in bips
    /// @return nftBoost NFT boost being used
    function previewClaim(address _user) external view returns (
        uint256 totalRewards,
        uint256 burnAmount,
        uint256 userReceives,
        uint256 burnRateBips,
        uint256 nftBoost
    ) {
        totalRewards = pendingRewards(_user);
        nftBoost = _getUserBestBoost(_user);
        burnRateBips = _getBurnRate(nftBoost);
        burnAmount = (totalRewards * burnRateBips) / BIPS_DENOMINATOR;
        userReceives = totalRewards - burnAmount;
    }

    /// @notice Get tier name for display
    /// @param _boost Boost value in bips
    /// @return Tier name string
    function getTierName(uint256 _boost) external pure returns (string memory) {
        if (_boost >= BOOST_DIAMOND) return "Diamond";
        if (_boost >= BOOST_GOLD) return "Gold";
        if (_boost >= BOOST_SILVER) return "Silver";
        if (_boost >= BOOST_BRONZE) return "Bronze";
        return "None";
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    function _updateUserRewards(address _user) internal {
        if (userTotalPStake[_user] > 0) {
            uint256 pending = (userTotalPStake[_user] * accRewardPerStake / PRECISION) - rewardDebt[_user];
            if (pending > 0) {
                savedRewards[_user] += pending;
            }
        }
    }

    function _sendFeeToMining(
        bytes32 _serviceKey,
        uint256 _feeAmount,
        address _operator
    ) internal {
        address miningManager = ecosystemManager.getMiningManagerAddress();
        if (miningManager == address(0)) revert ZeroAddress();

        unchecked {
            totalBKCFees += _feeAmount;
        }

        bkcToken.safeTransfer(miningManager, _feeAmount);

        try IMiningManager(miningManager).performPurchaseMiningWithOperator(
            _serviceKey,
            _feeAmount,
            _operator
        ) {} catch {
            try IMiningManager(miningManager).performPurchaseMining(_serviceKey, _feeAmount) {} catch {}
        }
    }

    function _sendETHToMining(uint256 _amount, address _operator) internal {
        if (_amount == 0) return;

        unchecked {
            totalETHCollected += _amount;
        }

        address miningManager = ecosystemManager.getMiningManagerAddress();
        if (miningManager != address(0)) {
            try IMiningManager(miningManager).performPurchaseMiningWithOperator{value: _amount}(
                CLAIM_REWARD_FEE_KEY,
                0,
                _operator
            ) {
                return;
            } catch {}
        }

        address treasury = ecosystemManager.getTreasuryAddress();
        if (treasury != address(0)) {
            (bool success, ) = treasury.call{value: _amount}("");
            if (!success) revert TransferFailed();
        }
    }

    /// @notice Get user's best NFT boost from OWNED or RENTED NFTs
    /// @param _user Address to check
    /// @return bestBoost Highest boost value found
    function _getUserBestBoost(address _user) internal view returns (uint256 bestBoost) {
        address boosterAddress = ecosystemManager.getBoosterAddress();
        if (boosterAddress == address(0)) return 0;

        IRewardBoosterNFT booster = IRewardBoosterNFT(boosterAddress);

        // =====================================================================
        // CHECK 1: OWNED NFTs
        // =====================================================================
        try booster.getHighestBoostOf(_user) returns (uint256, uint256 ownedBoost) {
            bestBoost = ownedBoost;
        } catch {}

        // =====================================================================
        // CHECK 2: RENTED NFTs
        // =====================================================================
        address rentalManager = ecosystemManager.getRentalManagerAddress();
        if (rentalManager != address(0)) {
            try IRentalManager(rentalManager).getUserActiveRentals(_user) returns (
                uint256[] memory rentedTokenIds,
                uint256[] memory /* endTimes */
            ) {
                uint256 length = rentedTokenIds.length;
                for (uint256 i; i < length;) {
                    try booster.boostBips(rentedTokenIds[i]) returns (uint256 rentedBoost) {
                        if (rentedBoost > bestBoost) {
                            bestBoost = rentedBoost;
                        }
                    } catch {}
                    unchecked { ++i; }
                }
            } catch {}
        }
    }

    /// @notice Get burn rate based on NFT boost
    /// @param _boost Boost value in bips
    /// @return Burn rate in bips
    function _getBurnRate(uint256 _boost) internal pure returns (uint256) {
        if (_boost >= BOOST_DIAMOND) return BURN_RATE_DIAMOND;  // 0%
        if (_boost >= BOOST_GOLD) return BURN_RATE_GOLD;        // 10%
        if (_boost >= BOOST_SILVER) return BURN_RATE_SILVER;    // 25%
        if (_boost >= BOOST_BRONZE) return BURN_RATE_BRONZE;    // 40%
        return BURN_RATE_NO_NFT;                                 // 50%
    }

    function _calculatePStake(
        uint256 _amount,
        uint256 _lockDuration
    ) internal pure returns (uint256) {
        return (_amount * (_lockDuration / 1 days)) / PRECISION;
    }

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

    receive() external payable {}
}
