// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./IInterfaces.sol";
import "./BKCToken.sol";

contract DelegationManager is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    IEcosystemManager public ecosystemManager;
    BKCToken public bkcToken;

    uint256 public constant MIN_LOCK_DURATION = 1 days;
    uint256 public constant MAX_LOCK_DURATION = 3650 days;
    uint256 private constant E18 = 10**18;

    // Fee Configuration Keys
    string public constant UNSTAKE_FEE_KEY = "UNSTAKE_FEE_BIPS";
    string public constant FORCE_UNSTAKE_PENALTY_KEY = "FORCE_UNSTAKE_PENALTY_BIPS";
    string public constant CLAIM_REWARD_FEE_KEY = "CLAIM_REWARD_FEE_BIPS";

    struct Delegation {
        uint256 amount;
        uint256 unlockTime;
        uint256 lockDuration;
    }

    // Mappings
    mapping(address => Delegation[]) public userDelegations;
    mapping(address => uint256) public userTotalPStake; // Essential for service access levels
    uint256 public totalNetworkPStake;

    // Single Global Reward Pool
    uint256 public accRewardPerStake; 
    mapping(address => uint256) public rewardDebt;

    // Events
    event Delegated(address indexed user, uint256 delegationIndex, uint256 amount, uint256 pStakeGenerated);
    event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 feePaid);
    event RewardsDeposited(uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    function initialize(
        address _initialOwner,
        address _ecosystemManagerAddress
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        require(_ecosystemManagerAddress != address(0), "DM: EcosystemManager cannot be zero");
        require(_initialOwner != address(0), "DM: Invalid owner address");
        
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);

        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        require(_bkcTokenAddress != address(0), "DM: BKCToken not set in EcosystemManager");
        
        bkcToken = BKCToken(_bkcTokenAddress);
        
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Receives rewards from MiningManager for the Global Delegator Pool.
     * @dev Single argument per new interface design.
     */
    function depositMiningRewards(uint256 _amount) external { 
        require(
            msg.sender == ecosystemManager.getMiningManagerAddress(),
            "DM: Caller is not the authorized MiningManager"
        );

        if (_amount > 0 && totalNetworkPStake > 0) {
            accRewardPerStake += (_amount * E18) / totalNetworkPStake;
            emit RewardsDeposited(_amount);
        }
    }

    /**
     * @notice Delegate (Stake) tokens to the protocol to earn rewards and pStake.
     * @dev "Validator" address removed. User delegates to the system.
     */
    function delegate(
        uint256 _totalAmount, 
        uint256 _lockDuration,
        uint256 _boosterTokenId 
    ) external nonReentrant {
        require(_totalAmount > 0, "DM: Invalid amount");
        require(
            _lockDuration >= MIN_LOCK_DURATION && _lockDuration <= MAX_LOCK_DURATION,
            "DM: Invalid lock duration"
        );

        // 1. Settle rewards before changing stake
        _claimReward(msg.sender, _boosterTokenId);
        
        // 2. Pull tokens
        require(bkcToken.transferFrom(msg.sender, address(this), _totalAmount), "DM: Failed to delegate tokens");

        // 3. Create delegation entry
        uint256 delegationIndex = userDelegations[msg.sender].length;
        userDelegations[msg.sender].push(Delegation({
            amount: _totalAmount,
            unlockTime: block.timestamp + _lockDuration,
            lockDuration: _lockDuration
        }));

        // 4. Calculate pStake (Power of Delegation)
        uint256 pStake = _calculatePStake(_totalAmount, _lockDuration);
        
        // 5. Update State
        totalNetworkPStake += pStake;
        userTotalPStake[msg.sender] += pStake;
        
        // 6. Update reward debt
        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / E18;

        emit Delegated(msg.sender, delegationIndex, _totalAmount, pStake);
    }

    function unstake(
        uint256 _delegationIndex, 
        uint256 _boosterTokenId 
    ) external nonReentrant {
        Delegation[] storage delegationsOfUser = userDelegations[msg.sender];
        require(_delegationIndex < delegationsOfUser.length, "DM: Invalid index");
        
        Delegation storage d = delegationsOfUser[_delegationIndex];

        // 1. Claim rewards first
        _claimReward(msg.sender, _boosterTokenId);
        
        require(block.timestamp >= d.unlockTime, "DM: Lock period not over");

        uint256 amount = d.amount;
        uint256 pStakeToRemove = _calculatePStake(amount, d.lockDuration);
        
        // 2. Calculate Fees
        uint256 feeBips = ecosystemManager.getFee(UNSTAKE_FEE_KEY);
        uint256 finalFeeBips = _applyBoosterDiscount(feeBips, _boosterTokenId);
        
        uint256 feeAmount = (amount * finalFeeBips) / 10000;
        uint256 amountToUser = amount - feeAmount;

        // 3. Update Global/User State
        totalNetworkPStake -= pStakeToRemove;
        userTotalPStake[msg.sender] -= pStakeToRemove;
        
        // 4. Send fee to MiningManager (PoP Trigger)
        if (feeAmount > 0) {
            _sendFeeToMiningManager(UNSTAKE_FEE_KEY, feeAmount);
        }

        // 5. Remove delegation from array (Swap & Pop)
        if (delegationsOfUser.length > 1 && _delegationIndex != delegationsOfUser.length - 1) {
            delegationsOfUser[_delegationIndex] = delegationsOfUser[delegationsOfUser.length - 1];
        }
        delegationsOfUser.pop();

        // 6. Return funds to user
        require(bkcToken.transfer(msg.sender, amountToUser), "DM: Failed to transfer tokens back");
        
        // 7. Reset reward debt
        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / E18;
        
        emit Unstaked(msg.sender, _delegationIndex, amountToUser, feeAmount);
    }

    function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId) external nonReentrant {
        Delegation[] storage delegationsOfUser = userDelegations[msg.sender];
        require(_delegationIndex < delegationsOfUser.length, "DM: Invalid index");
        
        Delegation storage d = delegationsOfUser[_delegationIndex];

        // 1. Claim rewards first
        _claimReward(msg.sender, _boosterTokenId);
        
        require(
            block.timestamp < d.unlockTime,
            "DM: Delegation is unlocked, use regular unstake"
        );
        
        uint256 amount = d.amount;
        uint256 pStakeToRemove = _calculatePStake(amount, d.lockDuration);

        // 2. Calculate Penalty
        uint256 basePenaltyBips = ecosystemManager.getFee(FORCE_UNSTAKE_PENALTY_KEY);
        uint256 finalPenaltyBips = _applyBoosterDiscount(basePenaltyBips, _boosterTokenId);
        uint256 penaltyAmount = (amount * finalPenaltyBips) / 10000;
        uint256 amountToUser = amount - penaltyAmount;

        // 3. Update Global/User State
        totalNetworkPStake -= pStakeToRemove;
        userTotalPStake[msg.sender] -= pStakeToRemove;
        
        // 4. Send penalty to MiningManager (PoP Trigger)
        if (penaltyAmount > 0) {
            _sendFeeToMiningManager(FORCE_UNSTAKE_PENALTY_KEY, penaltyAmount);
        }
        
        // 5. Remove delegation from array
        if (delegationsOfUser.length > 1 && _delegationIndex != delegationsOfUser.length - 1) {
            delegationsOfUser[_delegationIndex] = delegationsOfUser[delegationsOfUser.length - 1];
        }
        delegationsOfUser.pop();
        
        // 6. Return funds to user
        require(bkcToken.transfer(msg.sender, amountToUser), "DM: Failed to return tokens to user");
        
        // 7. Reset reward debt
        rewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accRewardPerStake) / E18;
        
        emit Unstaked(msg.sender, _delegationIndex, amountToUser, penaltyAmount);
    }

    function claimReward(uint256 _boosterTokenId) external nonReentrant {
        _claimReward(msg.sender, _boosterTokenId);
    }

    function _claimReward(address _user, uint256 _boosterTokenId) internal {
        uint256 pending = pendingRewards(_user);
        if (pending > 0) {
            // Reset debt immediately to prevent reentrancy logic
            rewardDebt[_user] = (userTotalPStake[_user] * accRewardPerStake) / E18;

            uint256 baseFeeBips = ecosystemManager.getFee(CLAIM_REWARD_FEE_KEY);
            uint256 finalFeeBips = _applyBoosterDiscount(baseFeeBips, _boosterTokenId);

            uint256 feeAmount = (pending * finalFeeBips) / 10000;
            uint256 amountToUser = pending - feeAmount;

            // 1. Send fee to MiningManager (PoP Trigger)
            if (feeAmount > 0) {
                _sendFeeToMiningManager(CLAIM_REWARD_FEE_KEY, feeAmount);
            }

            if (amountToUser > 0) {
                require(
                    bkcToken.transfer(_user, amountToUser),
                    "DM: Failed to transfer rewards"
                );
            }

            emit RewardClaimed(_user, amountToUser);
        }
    }

    /**
     * @notice Internal helper to send collected fees to the MiningManager funnel.
     */
    function _sendFeeToMiningManager(string memory _serviceKey, uint256 _feeAmount) internal {
        address miningManagerAddress = ecosystemManager.getMiningManagerAddress();
        require(miningManagerAddress != address(0), "DM: MM not set in Hub");
        
        require(
            bkcToken.transfer(miningManagerAddress, _feeAmount),
            "DM: Fee transfer to MM failed"
        );
        
        IMiningManager(miningManagerAddress)
            .performPurchaseMining(
                _serviceKey,
                _feeAmount
            );
    }

    function _applyBoosterDiscount(uint256 _baseFeeBips, uint256 _boosterTokenId) internal view returns (uint256 finalFeeBips) {
        if (_boosterTokenId == 0) return _baseFeeBips;
        
        address boosterAddress = ecosystemManager.getBoosterAddress();
        if (boosterAddress == address(0)) return _baseFeeBips;
        
        IRewardBoosterNFT booster = IRewardBoosterNFT(boosterAddress);
        try booster.ownerOf(_boosterTokenId) returns (address owner) {
            if (owner == msg.sender) {
                uint256 boostBips = booster.boostBips(_boosterTokenId);
                uint256 discountBips = ecosystemManager.getBoosterDiscount(boostBips);
                
                if (discountBips > 0) {
                    return (_baseFeeBips > discountBips) ?
                        _baseFeeBips - discountBips : 0;
                }
            }
        } catch {
            // Silently ignore if NFT is invalid or doesn't exist
        }
        return _baseFeeBips;
    }

    function _calculatePStake(uint256 _amount, uint256 _lockDuration)
        internal
        pure
        returns (uint256)
    {
        // pStake = (Amount in Ether) * (Duration in Days)
        return (_amount * (_lockDuration / 1 days)) / E18;
    }

    // --- VIEW FUNCTIONS ---

    function pendingRewards(address _user)
        public
        view
        returns (uint256)
    {
        return (userTotalPStake[_user] * accRewardPerStake / E18) -
            rewardDebt[_user];
    }

    function getDelegationsOf(address _user)
        external
        view
        returns (Delegation[] memory)
    {
        return userDelegations[_user];
    }
}